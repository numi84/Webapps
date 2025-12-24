export class SaveManager {
    constructor() {
        this.STORAGE_KEYS = {
            SAVE_DATA: 'breakout_save_v1',
            SETTINGS: 'breakout_settings_v1',
            CUSTOM_LEVELS: 'breakout_custom_levels_v1'
        };

        this.defaultSettings = {
            difficulty: 'normal',
            backgroundType: 'gradient',
            animatedBackground: true,
            particleQuality: 'medium',
            screenShake: true,
            ballTrail: true
        };

        this.defaultSaveData = {
            version: '1.0.0',
            progress: {
                currentLevel: 1,
                unlockedLevels: [1],
                levelScores: {}
            },
            statistics: {
                gamesPlayed: 0,
                blocksDestroyed: 0,
                powerupsCollected: 0,
                totalScore: 0,
                bestCombo: 0
            },
            achievements: [],
            highScores: []
        };
    }

    // Settings
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (stored) {
                return { ...this.defaultSettings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return { ...this.defaultSettings };
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Save Data
    loadSaveData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.SAVE_DATA);
            if (stored) {
                const data = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return {
                    ...this.defaultSaveData,
                    ...data,
                    progress: { ...this.defaultSaveData.progress, ...data.progress },
                    statistics: { ...this.defaultSaveData.statistics, ...data.statistics }
                };
            }
        } catch (error) {
            console.error('Error loading save data:', error);
        }
        return { ...this.defaultSaveData };
    }

    saveSaveData(saveData) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SAVE_DATA, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Level Progress
    unlockLevel(levelNumber, saveData) {
        if (!saveData.progress.unlockedLevels.includes(levelNumber)) {
            saveData.progress.unlockedLevels.push(levelNumber);
            saveData.progress.unlockedLevels.sort((a, b) => a - b);
        }
    }

    saveLevelScore(levelNumber, score, stars, perfect, saveData) {
        const levelData = saveData.progress.levelScores[levelNumber] || {
            highScore: 0,
            stars: 0,
            completed: false,
            perfectRun: false
        };

        levelData.completed = true;
        levelData.highScore = Math.max(levelData.highScore, score);
        levelData.stars = Math.max(levelData.stars, stars);
        if (perfect) {
            levelData.perfectRun = true;
        }

        saveData.progress.levelScores[levelNumber] = levelData;
    }

    // High Scores
    addHighScore(score, level, saveData) {
        const entry = {
            score,
            level,
            date: Date.now()
        };

        saveData.highScores.push(entry);
        saveData.highScores.sort((a, b) => b.score - a.score);
        saveData.highScores = saveData.highScores.slice(0, 10); // Keep top 10
    }

    // Achievements
    unlockAchievement(achievementId, saveData) {
        const existing = saveData.achievements.find(a => a.id === achievementId);
        if (!existing) {
            saveData.achievements.push({
                id: achievementId,
                unlockedAt: Date.now()
            });
            return true; // New achievement
        }
        return false;
    }

    hasAchievement(achievementId, saveData) {
        return saveData.achievements.some(a => a.id === achievementId);
    }

    // Statistics
    updateStatistics(updates, saveData) {
        Object.keys(updates).forEach(key => {
            if (key === 'bestCombo') {
                saveData.statistics[key] = Math.max(
                    saveData.statistics[key] || 0,
                    updates[key]
                );
            } else {
                saveData.statistics[key] = (saveData.statistics[key] || 0) + updates[key];
            }
        });
    }

    // Custom Levels
    loadCustomLevels() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.CUSTOM_LEVELS);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom levels:', error);
        }
        return [];
    }

    saveCustomLevels(levels) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CUSTOM_LEVELS, JSON.stringify(levels));
            return true;
        } catch (error) {
            console.error('Error saving custom levels:', error);
            return false;
        }
    }

    addCustomLevel(level) {
        const levels = this.loadCustomLevels();
        level.id = 'custom_' + Date.now();
        levels.push(level);
        return this.saveCustomLevels(levels);
    }

    deleteCustomLevel(levelId) {
        const levels = this.loadCustomLevels();
        const filtered = levels.filter(l => l.id !== levelId);
        return this.saveCustomLevels(filtered);
    }

    // Export/Import
    exportAllData() {
        return {
            settings: this.loadSettings(),
            saveData: this.loadSaveData(),
            customLevels: this.loadCustomLevels()
        };
    }

    importAllData(data) {
        try {
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.saveData) {
                this.saveSaveData(data.saveData);
            }
            if (data.customLevels) {
                this.saveCustomLevels(data.customLevels);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Reset
    resetProgress() {
        try {
            localStorage.setItem(
                this.STORAGE_KEYS.SAVE_DATA,
                JSON.stringify(this.defaultSaveData)
            );
            return true;
        } catch (error) {
            console.error('Error resetting progress:', error);
            return false;
        }
    }

    resetSettings() {
        try {
            localStorage.setItem(
                this.STORAGE_KEYS.SETTINGS,
                JSON.stringify(this.defaultSettings)
            );
            return true;
        } catch (error) {
            console.error('Error resetting settings:', error);
            return false;
        }
    }

    clearCustomLevels() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CUSTOM_LEVELS);
            return true;
        } catch (error) {
            console.error('Error clearing custom levels:', error);
            return false;
        }
    }

    // Level Code (Base64 encoding for sharing)
    encodeLevelCode(level) {
        try {
            const json = JSON.stringify(level);
            return btoa(json);
        } catch (error) {
            console.error('Error encoding level:', error);
            return null;
        }
    }

    decodeLevelCode(code) {
        try {
            const json = atob(code);
            const level = JSON.parse(json);

            // Validate the decoded level structure
            if (!this.validateLevelStructure(level)) {
                console.error('Invalid level structure');
                return null;
            }

            return level;
        } catch (error) {
            console.error('Error decoding level:', error);
            return null;
        }
    }

    /**
     * Validate that a level object has the required structure.
     * Prevents potential issues from malformed or malicious level data.
     */
    validateLevelStructure(level) {
        // Must be an object
        if (!level || typeof level !== 'object') {
            return false;
        }

        // Must have blocks array
        if (!Array.isArray(level.blocks)) {
            return false;
        }

        // Validate each block has required properties
        const validBlockTypes = ['standard', 'hard', 'unbreakable', 'explosive', 'moving', 'invisible', 'regenerating', 'multiHit'];

        for (const block of level.blocks) {
            if (typeof block !== 'object') return false;
            if (typeof block.col !== 'number' || block.col < 0 || block.col > 15) return false;
            if (typeof block.row !== 'number' || block.row < 0 || block.row > 20) return false;
            if (block.type && !validBlockTypes.includes(block.type)) return false;
        }

        // If powerups exist, validate them
        if (level.powerups) {
            if (!Array.isArray(level.powerups)) {
                return false;
            }

            for (const powerup of level.powerups) {
                if (typeof powerup !== 'object') return false;
                if (typeof powerup.col !== 'number' || powerup.col < 0 || powerup.col > 15) return false;
                if (typeof powerup.row !== 'number' || powerup.row < 0 || powerup.row > 20) return false;
            }
        }

        // Validate name length if present (prevent XSS via extremely long strings)
        if (level.name && (typeof level.name !== 'string' || level.name.length > 100)) {
            return false;
        }

        if (level.description && (typeof level.description !== 'string' || level.description.length > 500)) {
            return false;
        }

        // Valid difficulty values
        if (level.difficulty && !['easy', 'medium', 'hard'].includes(level.difficulty)) {
            return false;
        }

        return true;
    }
}
