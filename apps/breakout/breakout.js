import { Ball } from './modules/Ball.js';
import { Paddle } from './modules/Paddle.js';
import { Block, BlockType, BlockConfig } from './modules/Block.js';
import { Powerup, PowerupType, PowerupConfig, Laser } from './modules/Powerup.js';
import { ParticleSystem } from './modules/ParticleSystem.js';
import { BackgroundManager } from './modules/BackgroundManager.js';
import { SaveManager } from './modules/SaveManager.js';
import { InputManager } from './modules/InputManager.js';
import { SoundManager } from './modules/SoundManager.js';

// Game States
const GameState = {
    MAIN_MENU: 'mainMenu',
    LEVEL_SELECT: 'levelSelect',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    SETTINGS: 'settings',
    EDITOR: 'editor',
    HIGH_SCORES: 'highscores',
    ACHIEVEMENTS: 'achievements',
    HOW_TO: 'howto'
};

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgCanvas = document.getElementById('backgroundCanvas');

        this.state = GameState.MAIN_MENU;
        this.saveManager = new SaveManager();
        this.settings = this.saveManager.loadSettings();
        this.saveData = this.saveManager.loadSaveData();

        this.input = new InputManager(this.canvas);
        this.particles = new ParticleSystem(200);
        this.backgroundManager = new BackgroundManager(this.bgCanvas);
        this.soundManager = new SoundManager();

        // Game objects
        this.balls = [];
        this.paddle = null;
        this.blocks = [];
        this.powerups = [];
        this.activePowerups = [];
        this.lasers = [];

        // Game state
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.scoreMultiplier = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.highScore = 0;

        // Level editor
        this.editorCanvas = document.getElementById('editorCanvas');
        this.editorCtx = this.editorCanvas ? this.editorCanvas.getContext('2d') : null;
        this.editorGrid = [];
        this.editorSelectedBlock = BlockType.STANDARD;
        this.editorTool = 'place';

        // Timing
        this.lastTime = 0;
        this.gameRunning = false;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.backgroundManager.setType(this.settings.backgroundType);
        this.backgroundManager.setAnimated(this.settings.animatedBackground);

        this.setupUI();
        this.setupInput();
        this.initLevels();

        this.showScreen(GameState.MAIN_MENU);
        this.startGameLoop();
    }

    resizeCanvas() {
        const maxWidth = 900;
        const maxHeight = 700;
        const aspectRatio = maxWidth / maxHeight;

        let width = Math.min(window.innerWidth - 40, maxWidth);
        let height = width / aspectRatio;

        if (height > window.innerHeight - 150) {
            height = window.innerHeight - 150;
            width = height * aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;

        if (this.editorCanvas) {
            this.editorCanvas.width = Math.min(800, window.innerWidth - 400);
            this.editorCanvas.height = 600;
        }
    }

    setupUI() {
        // Main menu buttons
        document.querySelectorAll('[data-action="play"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.LEVEL_SELECT));
        });

        document.querySelectorAll('[data-action="editor"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.EDITOR));
        });

        document.querySelectorAll('[data-action="settings"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.SETTINGS));
        });

        document.querySelectorAll('[data-action="highscores"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.HIGH_SCORES));
        });

        document.querySelectorAll('[data-action="achievements"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.ACHIEVEMENTS));
        });

        document.querySelectorAll('[data-action="howto"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.HOW_TO));
        });

        document.querySelectorAll('[data-action="backToMenu"]').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen(GameState.MAIN_MENU));
        });

        // Game controls
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.launchBall());
        }

        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseGame());
        }

        // Pause menu
        document.querySelectorAll('[data-action="resume"]').forEach(btn => {
            btn.addEventListener('click', () => this.resumeGame());
        });

        document.querySelectorAll('[data-action="restart"]').forEach(btn => {
            btn.addEventListener('click', () => this.restartLevel());
        });

        document.querySelectorAll('[data-action="quit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen(GameState.MAIN_MENU);
                this.hideModal('pauseMenu');
            });
        });

        // Level complete
        document.querySelectorAll('[data-action="nextLevel"]').forEach(btn => {
            btn.addEventListener('click', () => this.loadNextLevel());
        });

        document.querySelectorAll('[data-action="levelSelect"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal('levelComplete');
                this.hideModal('gameOver');
                this.showScreen(GameState.LEVEL_SELECT);
            });
        });

        document.querySelectorAll('[data-action="retry"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal('gameOver');
                this.restartLevel();
            });
        });

        // Settings
        this.setupSettings();
    }

    setupSettings() {
        const difficultySelect = document.getElementById('difficulty');
        const backgroundSelect = document.getElementById('backgroundType');
        const animatedBg = document.getElementById('animatedBackground');
        const particleQuality = document.getElementById('particleQuality');
        const screenShake = document.getElementById('screenShake');
        const ballTrail = document.getElementById('ballTrail');

        if (difficultySelect) {
            difficultySelect.value = this.settings.difficulty;
            difficultySelect.addEventListener('change', (e) => {
                this.settings.difficulty = e.target.value;
                this.saveManager.saveSettings(this.settings);
            });
        }

        if (backgroundSelect) {
            backgroundSelect.value = this.settings.backgroundType;
            backgroundSelect.addEventListener('change', (e) => {
                this.settings.backgroundType = e.target.value;
                this.backgroundManager.setType(e.target.value);
                this.saveManager.saveSettings(this.settings);
            });
        }

        if (animatedBg) {
            animatedBg.checked = this.settings.animatedBackground;
            animatedBg.addEventListener('change', (e) => {
                this.settings.animatedBackground = e.target.checked;
                this.backgroundManager.setAnimated(e.target.checked);
                this.saveManager.saveSettings(this.settings);
            });
        }

        if (particleQuality) {
            particleQuality.value = this.settings.particleQuality;
            particleQuality.addEventListener('change', (e) => {
                this.settings.particleQuality = e.target.value;
                this.saveManager.saveSettings(this.settings);
            });
        }

        if (screenShake) {
            screenShake.checked = this.settings.screenShake;
            screenShake.addEventListener('change', (e) => {
                this.settings.screenShake = e.target.checked;
                this.saveManager.saveSettings(this.settings);
            });
        }

        if (ballTrail) {
            ballTrail.checked = this.settings.ballTrail;
            ballTrail.addEventListener('change', (e) => {
                this.settings.ballTrail = e.target.checked;
                this.saveManager.saveSettings(this.settings);
            });
        }

        // Data management
        document.getElementById('exportSave')?.addEventListener('click', () => {
            const data = this.saveManager.exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'breakout_save.json';
            a.click();
        });

        document.getElementById('resetProgress')?.addEventListener('click', () => {
            if (confirm('Möchten Sie wirklich Ihren gesamten Fortschritt zurücksetzen?')) {
                this.saveManager.resetProgress();
                this.saveData = this.saveManager.loadSaveData();
                alert('Fortschritt wurde zurückgesetzt.');
            }
        });
    }

    setupInput() {
        // Space to launch ball or shoot laser
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === GameState.PLAYING) {
                e.preventDefault();

                const activeBall = this.balls.find(b => !b.active && !b.destroyed);
                if (activeBall) {
                    this.launchBall();
                } else if (this.paddle.hasLaser) {
                    this.shootLaser();
                }
            }

            // Pause with ESC or P
            if ((e.code === 'Escape' || e.code === 'KeyP') && this.state === GameState.PLAYING) {
                this.pauseGame();
            }
        });

        // Canvas click to launch ball
        this.input.onAction('onClick', () => {
            if (this.state === GameState.PLAYING) {
                const activeBall = this.balls.find(b => !b.active);
                if (activeBall) {
                    this.launchBall();
                } else if (this.paddle.hasLaser) {
                    this.shootLaser();
                }
            }
        });
    }

    showScreen(state) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const screenMap = {
            [GameState.MAIN_MENU]: 'mainMenu',
            [GameState.LEVEL_SELECT]: 'levelSelect',
            [GameState.PLAYING]: 'gameScreen',
            [GameState.SETTINGS]: 'settingsScreen',
            [GameState.EDITOR]: 'editorScreen',
            [GameState.HIGH_SCORES]: 'highscoresScreen',
            [GameState.ACHIEVEMENTS]: 'achievementsScreen',
            [GameState.HOW_TO]: 'howtoScreen'
        };

        const screenId = screenMap[state];
        if (screenId) {
            document.getElementById(screenId)?.classList.add('active');
        }

        this.state = state;

        // Initialize screen-specific content
        if (state === GameState.LEVEL_SELECT) {
            this.renderLevelSelect();
        } else if (state === GameState.EDITOR) {
            this.initEditor();
        } else if (state === GameState.HIGH_SCORES) {
            this.renderHighScores();
        } else if (state === GameState.ACHIEVEMENTS) {
            this.renderAchievements();
        }
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }

    // Level System
    initLevels() {
        // Will load from JSON file in production
        // For now, we'll generate them dynamically
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = [];

        for (let i = 1; i <= 30; i++) {
            levels.push({
                id: i,
                name: `Level ${i}`,
                difficulty: i <= 10 ? 'easy' : i <= 20 ? 'medium' : 'hard',
                blocks: this.generateLevelBlocks(i)
            });
        }

        return levels;
    }

    generateLevelBlocks(levelNumber) {
        const blocks = [];
        const cols = 12;
        const rows = Math.min(5 + Math.floor(levelNumber / 3), 10);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let type = BlockType.STANDARD;
                let colorIndex = col;

                // Add variety based on level
                if (levelNumber > 5 && Math.random() < 0.1) {
                    type = BlockType.HARD;
                } else if (levelNumber > 10 && Math.random() < 0.05) {
                    type = BlockType.EXPLOSIVE;
                } else if (levelNumber > 15 && Math.random() < 0.08) {
                    type = BlockType.MOVING;
                } else if (levelNumber > 20 && Math.random() < 0.03) {
                    type = BlockType.UNBREAKABLE;
                }

                blocks.push({ col, row, type, colorIndex });
            }
        }

        return blocks;
    }

    renderLevelSelect() {
        const grid = document.getElementById('levelGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.levels.forEach(level => {
            const isUnlocked = this.saveData.progress.unlockedLevels.includes(level.id);
            const levelData = this.saveData.progress.levelScores[level.id] || {};

            const card = document.createElement('div');
            card.className = 'level-card' + (isUnlocked ? '' : ' locked');

            card.innerHTML = `
                <div class="level-number">${level.id}</div>
                <div class="level-stars">${this.renderStars(levelData.stars || 0)}</div>
                <div class="level-highscore">${levelData.highScore || 0}</div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => this.startLevel(level.id));
            }

            grid.appendChild(card);
        });
    }

    renderStars(count) {
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `<span class="${i < count ? 'star earned' : 'star'}">⭐</span>`;
        }
        return html;
    }

    startLevel(levelId) {
        this.currentLevel = levelId;
        const level = this.levels.find(l => l.id === levelId);
        if (!level) return;

        this.score = 0;
        this.lives = 3;
        this.scoreMultiplier = 1;
        this.combo = 0;
        this.comboTimer = 0;

        this.highScore = this.saveData.progress.levelScores[levelId]?.highScore || 0;

        this.loadLevel(level);
        this.showScreen(GameState.PLAYING);
        this.gameRunning = true;

        document.getElementById('startOverlay').style.display = 'flex';
    }

    loadLevel(level) {
        this.balls = [];
        this.blocks = [];
        this.powerups = [];
        this.activePowerups = [];
        this.lasers = [];
        this.particles.clear();

        const blockWidth = 60;
        const blockHeight = 20;
        const blockPadding = 4;
        const offsetX = (this.canvas.width - (12 * (blockWidth + blockPadding))) / 2;
        const offsetY = 60;

        // Create blocks
        level.blocks.forEach(blockData => {
            const x = offsetX + blockData.col * (blockWidth + blockPadding);
            const y = offsetY + blockData.row * (blockHeight + blockPadding);
            const block = new Block(x, y, blockWidth, blockHeight, blockData.type, blockData.colorIndex);
            this.blocks.push(block);
        });

        // Create paddle
        const paddleY = this.canvas.height - 30;
        this.paddle = new Paddle(this.canvas.width / 2 - 50, paddleY, 100, 15);

        // Create ball
        const ball = new Ball(this.canvas.width / 2, paddleY - 20, 8, 5);
        this.balls.push(ball);

        this.updateHUD();
    }

    launchBall() {
        const inactiveBall = this.balls.find(b => !b.active);
        if (inactiveBall) {
            // Calculate angle based on paddle movement if ball is stuck
            let angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.3;

            if (inactiveBall.stuckToPaddle) {
                // Get paddle velocity (difference from last frame)
                const paddleVelX = this.paddle.x - this.paddle.lastX;

                // Determine base angle from captured angle
                // If ball was coming from right (positive dx), launch left
                // If ball was coming from left (negative dx), launch right
                const capturedDx = Math.cos(inactiveBall.capturedAngle);
                let baseAngle = capturedDx > 0 ? -Math.PI * 2/3 : -Math.PI / 3; // left or right

                // Influence angle based on paddle movement
                const velocityInfluence = paddleVelX * 0.05; // Adjust sensitivity
                angle = baseAngle + velocityInfluence;

                // Clamp angle to reasonable range (upward)
                angle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, angle));

                inactiveBall.stuckToPaddle = false;
            }

            inactiveBall.launch(angle);
            document.getElementById('startOverlay').style.display = 'none';
        }
    }

    shootLaser() {
        const positions = this.paddle.shoot();
        if (positions) {
            positions.forEach(pos => {
                this.lasers.push(new Laser(pos.x, pos.y));
            });
            this.soundManager.playLaserShoot();
        }
    }

    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.gameRunning = false;
            this.showModal('pauseMenu');
        }
    }

    resumeGame() {
        this.gameRunning = true;
        this.hideModal('pauseMenu');
    }

    restartLevel() {
        const level = this.levels.find(l => l.id === this.currentLevel);
        if (level) {
            this.loadLevel(level);
        }
        this.gameRunning = true;
        document.getElementById('startOverlay').style.display = 'flex';
    }

    loadNextLevel() {
        this.hideModal('levelComplete');
        const nextLevelId = this.currentLevel + 1;
        if (nextLevelId <= this.levels.length) {
            this.startLevel(nextLevelId);
        } else {
            this.showScreen(GameState.LEVEL_SELECT);
        }
    }

    // Game Loop
    startGameLoop() {
        const loop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(deltaTime);
            this.render();

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    update(deltaTime) {
        // Background always updates
        this.backgroundManager.update(deltaTime);

        if (this.state !== GameState.PLAYING || !this.gameRunning) {
            return;
        }

        // Update paddle
        this.paddle.update(this.input, this.canvas.width, deltaTime);

        // Update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // If ball is stuck to paddle (sticky or magnet), move with paddle
            if (ball.stuckToPaddle && !ball.active) {
                const pBounds = this.paddle.getBounds();
                ball.x = pBounds.centerX + ball.paddleOffset;
                ball.y = this.paddle.y - ball.radius;
                continue;
            }

            const result = ball.update(deltaTime, this.canvas.width, this.canvas.height);

            // Play wall bounce sound
            if (result.wallBounce) {
                this.soundManager.playWallBounce();
            }

            if (result.lost) {
                // Check if shield is active - bounce ball back instead of losing it
                if (this.paddle.hasShield) {
                    ball.y = this.canvas.height - ball.radius;
                    ball.dy = -Math.abs(ball.dy); // Reverse direction upward
                    this.soundManager.playPaddleHit();
                    continue;
                }

                this.balls.splice(i, 1);
                if (this.balls.length === 0) {
                    this.loseLife();
                }
                continue;
            }

            if (!ball.active) continue;

            // Apply magnetic force if active
            this.applyMagneticForce(ball);

            // Ball-paddle collision
            this.checkBallPaddleCollision(ball);

            // Ball-block collision
            this.checkBallBlockCollisions(ball);
        }

        // Update blocks
        const firstBall = this.balls[0];
        if (firstBall) {
            this.blocks.forEach(block => {
                block.update(deltaTime, firstBall.x, firstBall.y);
            });
        }

        // Update powerups
        this.updatePowerups(deltaTime);

        // Update lasers
        this.updateLasers(deltaTime);

        // Update particles
        this.particles.update(deltaTime);

        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Check level complete
        this.checkLevelComplete();
    }

    checkBallPaddleCollision(ball) {
        const pBounds = this.paddle.getBounds();
        const bBounds = ball.getBounds();

        if (bBounds.x < pBounds.x + pBounds.width &&
            bBounds.x + bBounds.width > pBounds.x &&
            bBounds.y < pBounds.y + pBounds.height &&
            bBounds.y + bBounds.height > pBounds.y) {

            if (this.paddle.isSticky) {
                ball.active = false;
                ball.stuckToPaddle = true;
                ball.paddleOffset = ball.x - pBounds.centerX;
                // Store the angle the ball was coming from
                ball.capturedAngle = Math.atan2(ball.dy, ball.dx);
                // Clear trail when caught
                ball.trail = [];
                this.soundManager.playPaddleHit();
            } else {
                // Calculate bounce angle based on hit position
                const hitPos = (ball.x - pBounds.centerX) / (pBounds.width / 2);
                const maxAngle = Math.PI * 75 / 180;
                const angle = hitPos * maxAngle;

                ball.dx = Math.sin(angle) * ball.speed;
                ball.dy = -Math.abs(Math.cos(angle) * ball.speed);
                ball.y = pBounds.y - ball.radius;

                this.soundManager.playPaddleHit();
            }
        }
    }

    applyMagneticForce(ball) {
        if (!ball.isMagnetic || !ball.active) return;

        const pBounds = this.paddle.getBounds();
        const dx = pBounds.centerX - ball.x;
        const dy = pBounds.centerY - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only apply force if ball is within magnetic range
        const magneticRange = 200;
        if (distance < magneticRange && distance > 0) {
            // Force decreases with distance (inverse square law)
            const forceMagnitude = 0.15 * (1 - distance / magneticRange);

            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Apply force to ball velocity
            ball.dx += dirX * forceMagnitude;
            ball.dy += dirY * forceMagnitude;

            // Limit max speed
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const maxSpeed = ball.speed * 1.5;
            if (currentSpeed > maxSpeed) {
                ball.dx = (ball.dx / currentSpeed) * maxSpeed;
                ball.dy = (ball.dy / currentSpeed) * maxSpeed;
            }
        }
    }

    checkBallBlockCollisions(ball) {
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            if (block.destroyed) continue;

            const side = block.getCollisionSide(ball);
            if (side) {
                // Handle collision
                if (!ball.isFireball) {
                    if (side === 'top' || side === 'bottom') {
                        ball.reverseY();
                    } else {
                        ball.reverseX();
                    }
                }

                // Hit block
                const destroyed = block.hit(1);

                if (destroyed) {
                    this.blocks.splice(i, 1);
                    this.handleBlockDestroyed(block);
                }

                if (!ball.isFireball) {
                    break; // Only hit one block per frame
                }
            }
        }
    }

    handleBlockDestroyed(block) {
        // Add score
        const points = Math.floor(block.points * this.scoreMultiplier);
        this.score += points;

        // Combo
        this.combo++;
        this.comboTimer = 2000; // 2 seconds

        // Sound effects
        this.soundManager.playBlockDestroy();
        if (this.combo > 1) {
            this.soundManager.playCombo(this.combo);
        }

        // Particles
        const bounds = block.getBounds();
        this.particles.emitBlockDestruction(bounds.centerX, bounds.centerY, block.getColor());

        // Explosive block
        if (block.type === BlockType.EXPLOSIVE) {
            this.particles.emitExplosion(bounds.centerX, bounds.centerY);
            this.soundManager.playExplosion();
            this.explodeNearbyBlocks(block);
        }

        // Drop powerup
        if (Math.random() < 0.2) {
            this.dropPowerup(bounds.centerX, bounds.centerY);
            this.soundManager.playPowerupDrop();
        }

        // Update stats
        this.saveManager.updateStatistics({ blocksDestroyed: 1 }, this.saveData);
        this.saveManager.updateStatistics({ bestCombo: this.combo }, this.saveData);

        this.updateHUD();
    }

    explodeNearbyBlocks(explosiveBlock) {
        const radius = BlockConfig[BlockType.EXPLOSIVE].explosionRadius;
        const bounds = explosiveBlock.getBounds();

        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            if (block.destroyed || block.type === BlockType.UNBREAKABLE) continue;

            const blockBounds = block.getBounds();
            const dx = Math.abs(blockBounds.centerX - bounds.centerX);
            const dy = Math.abs(blockBounds.centerY - bounds.centerY);

            // Check if within explosion radius (in block units)
            const blockWidth = 64; // width + padding
            const blockHeight = 24; // height + padding

            if (dx < blockWidth * (radius + 1) && dy < blockHeight * (radius + 1)) {
                const destroyed = block.hit(999); // Instant destroy
                if (destroyed) {
                    this.blocks.splice(i, 1);
                    this.score += Math.floor(block.points * this.scoreMultiplier * 0.5);
                    this.particles.emitBlockDestruction(blockBounds.centerX, blockBounds.centerY, block.getColor());
                }
            }
        }
    }

    dropPowerup(x, y) {
        const types = Object.values(PowerupType);
        const type = types[Math.floor(Math.random() * types.length)];
        const powerup = new Powerup(x, y, type);
        this.powerups.push(powerup);
    }

    updatePowerups(deltaTime) {
        // Update falling powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];

            if (powerup.collected) {
                // Update active powerup
                const stillActive = powerup.update(deltaTime);
                if (!stillActive) {
                    powerup.deactivate(this);
                    this.activePowerups.splice(this.activePowerups.indexOf(powerup), 1);
                }
            } else {
                powerup.update(deltaTime);

                // Check collection
                if (powerup.checkCollision(this.paddle)) {
                    // Check if same powerup type is already active
                    const existingPowerup = this.activePowerups.find(p => p.type === powerup.type && p.active);

                    if (existingPowerup && existingPowerup.duration > 0) {
                        // Extend the duration of existing powerup
                        existingPowerup.extendDuration();
                        this.powerups.splice(i, 1);
                    } else {
                        // Activate new powerup
                        powerup.activate(this);
                        this.powerups.splice(i, 1);
                        this.activePowerups.push(powerup);
                    }

                    this.particles.emitPowerupCollect(powerup.x, powerup.y, powerup.color);
                    this.soundManager.playPowerupCollect();
                    this.saveManager.updateStatistics({ powerupsCollected: 1 }, this.saveData);
                }
                // Remove if off screen
                else if (powerup.y > this.canvas.height) {
                    this.powerups.splice(i, 1);
                }
            }
        }

        this.updatePowerupUI();
    }

    updatePowerupUI() {
        const container = document.getElementById('activePowerups');
        if (!container) return;

        container.innerHTML = '';

        this.activePowerups.forEach(powerup => {
            if (powerup.duration <= 0) return; // Don't show instant or permanent powerups

            const div = document.createElement('div');
            div.className = 'powerup-indicator';
            div.innerHTML = `
                <div class="powerup-indicator-header">
                    <span class="powerup-indicator-icon">${powerup.icon}</span>
                    <span class="powerup-indicator-name">${powerup.name}</span>
                </div>
                <div class="powerup-indicator-timer">
                    <div class="powerup-indicator-progress" style="width: ${powerup.getTimeRemainingPercent()}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    updateLasers(deltaTime) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.update();

            if (!laser.active) {
                this.lasers.splice(i, 1);
                continue;
            }

            // Check laser-block collision
            const laserBounds = laser.getBounds();
            for (let j = this.blocks.length - 1; j >= 0; j--) {
                const block = this.blocks[j];
                if (block.destroyed) continue;

                const blockBounds = block.getBounds();
                if (laserBounds.x < blockBounds.x + blockBounds.width &&
                    laserBounds.x + laserBounds.width > blockBounds.x &&
                    laserBounds.y < blockBounds.y + blockBounds.height &&
                    laserBounds.y + laserBounds.height > blockBounds.y) {

                    const destroyed = block.hit(1);
                    if (destroyed) {
                        this.blocks.splice(j, 1);
                        this.handleBlockDestroyed(block);
                    }

                    this.lasers.splice(i, 1);
                    break;
                }
            }
        }
    }

    spawnMultiBalls(count) {
        const existingBall = this.balls[0];
        if (!existingBall) return;

        for (let i = 0; i < count - 1; i++) {
            const newBall = new Ball(existingBall.x, existingBall.y, existingBall.radius, existingBall.speed);
            const angle = -Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 2;
            newBall.launch(angle);
            this.balls.push(newBall);
        }
    }

    addLife() {
        this.lives = Math.min(this.lives + 1, 10);
        this.updateHUD();
    }

    loseLife() {
        if (this.paddle.hasShield) {
            this.paddle.hasShield = false;
            // Remove shield from active powerups
            const shieldPowerup = this.activePowerups.find(p => p.type === PowerupType.SHIELD);
            if (shieldPowerup) {
                const index = this.activePowerups.indexOf(shieldPowerup);
                this.activePowerups.splice(index, 1);
            }
        } else {
            this.lives--;
            this.soundManager.playLoseLife();
        }

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetBall();
        }

        this.updateHUD();
    }

    resetBall() {
        const ball = new Ball(this.canvas.width / 2, this.paddle.y - 20, 8, 5);
        this.balls.push(ball);
        document.getElementById('startOverlay').style.display = 'flex';
    }

    checkLevelComplete() {
        const breakableBlocks = this.blocks.filter(b =>
            b.type !== BlockType.UNBREAKABLE && !b.destroyed
        );

        if (breakableBlocks.length === 0) {
            this.levelComplete();
        }
    }

    levelComplete() {
        this.gameRunning = false;

        // Calculate stars
        const perfectRun = this.lives === 3;
        let stars = 1;
        if (this.score > this.highScore) stars = 2;
        if (perfectRun) stars = 3;

        // Sound effect
        this.soundManager.playLevelComplete();

        // Save progress
        this.saveManager.saveLevelScore(this.currentLevel, this.score, stars, perfectRun, this.saveData);
        this.saveManager.unlockLevel(this.currentLevel + 1, this.saveData);
        this.saveManager.addHighScore(this.score, this.currentLevel, this.saveData);
        this.saveManager.updateStatistics({
            gamesPlayed: 1,
            totalScore: this.score
        }, this.saveData);
        this.saveManager.saveSaveData(this.saveData);

        // Show modal
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bonusScore').textContent = this.lives * 100;
        document.getElementById('totalScore').textContent = this.score + (this.lives * 100);

        const starsDiv = document.getElementById('levelStars');
        if (starsDiv) {
            starsDiv.innerHTML = this.renderStars(stars);
        }

        this.showModal('levelComplete');
    }

    gameOver() {
        this.gameRunning = false;

        // Sound effect
        this.soundManager.playGameOver();

        document.getElementById('gameOverScore').textContent = this.score;
        document.getElementById('gameOverHighScore').textContent = this.highScore;

        this.saveManager.updateStatistics({
            gamesPlayed: 1,
            totalScore: this.score
        }, this.saveData);
        this.saveManager.saveSaveData(this.saveData);

        this.showModal('gameOver');
    }

    updateHUD() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('levelDisplay').textContent = this.currentLevel;
        document.getElementById('highScoreDisplay').textContent = this.highScore;

        const livesDisplay = document.getElementById('livesDisplay');
        if (livesDisplay) {
            livesDisplay.innerHTML = '❤'.repeat(this.lives);
        }

        if (this.combo > 1) {
            const comboDisplay = document.getElementById('comboDisplay');
            if (comboDisplay) {
                comboDisplay.textContent = `${this.combo}x COMBO!`;
                comboDisplay.classList.add('active');
            }
        } else {
            document.getElementById('comboDisplay')?.classList.remove('active');
        }
    }

    render() {
        // Render background
        this.backgroundManager.render();

        if (this.state !== GameState.PLAYING) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render game objects
        this.blocks.forEach(block => block.render(this.ctx));
        this.paddle.render(this.ctx);
        this.balls.forEach(ball => ball.render(this.ctx, this.settings.ballTrail));
        this.powerups.forEach(powerup => powerup.render(this.ctx));
        this.lasers.forEach(laser => laser.render(this.ctx));
        this.particles.render(this.ctx);

        // Shield visual at bottom
        if (this.paddle.hasShield) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00E5FF';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#00E5FF';
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.canvas.height - 5);
            this.ctx.lineTo(this.canvas.width, this.canvas.height - 5);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    // Editor methods
    initEditor() {
        if (!this.editorCanvas) return;

        // Clear grid
        this.editorGrid = [];
        for (let row = 0; row < 15; row++) {
            this.editorGrid[row] = [];
            for (let col = 0; col < 12; col++) {
                this.editorGrid[row][col] = null;
            }
        }

        this.setupEditorPalette();
        this.setupEditorCanvas();
        this.renderEditorGrid();
    }

    setupEditorPalette() {
        const palette = document.getElementById('blockPalette');
        if (!palette) return;

        palette.innerHTML = '';

        Object.entries(BlockType).forEach(([key, type]) => {
            const div = document.createElement('div');
            div.className = 'palette-block';
            div.style.background = BlockConfig[type].color || BlockConfig[type].colors?.[0];
            div.textContent = key[0];

            div.addEventListener('click', () => {
                this.editorSelectedBlock = type;
                document.querySelectorAll('.palette-block').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
            });

            palette.appendChild(div);
        });

        // Select first by default
        palette.querySelector('.palette-block')?.classList.add('selected');

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editorTool = btn.dataset.tool;
            });
        });
    }

    setupEditorCanvas() {
        if (!this.editorCanvas) return;

        let isDrawing = false;

        this.editorCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            this.handleEditorClick(e);
        });

        this.editorCanvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                this.handleEditorClick(e);
            }
        });

        this.editorCanvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        this.editorCanvas.addEventListener('mouseleave', () => {
            isDrawing = false;
        });
    }

    handleEditorClick(e) {
        const rect = this.editorCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellWidth = this.editorCanvas.width / 12;
        const cellHeight = this.editorCanvas.height / 15;

        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);

        if (row >= 0 && row < 15 && col >= 0 && col < 12) {
            if (this.editorTool === 'place') {
                this.editorGrid[row][col] = {
                    type: this.editorSelectedBlock,
                    colorIndex: col
                };
            } else if (this.editorTool === 'erase') {
                this.editorGrid[row][col] = null;
            }

            this.renderEditorGrid();
        }
    }

    renderEditorGrid() {
        if (!this.editorCtx) return;

        const ctx = this.editorCtx;
        const cellWidth = this.editorCanvas.width / 12;
        const cellHeight = this.editorCanvas.height / 15;

        ctx.clearRect(0, 0, this.editorCanvas.width, this.editorCanvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        for (let row = 0; row <= 15; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * cellHeight);
            ctx.lineTo(this.editorCanvas.width, row * cellHeight);
            ctx.stroke();
        }

        for (let col = 0; col <= 12; col++) {
            ctx.beginPath();
            ctx.moveTo(col * cellWidth, 0);
            ctx.lineTo(col * cellWidth, this.editorCanvas.height);
            ctx.stroke();
        }

        // Draw blocks
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 12; col++) {
                const cell = this.editorGrid[row][col];
                if (cell) {
                    const x = col * cellWidth;
                    const y = row * cellHeight;

                    const config = BlockConfig[cell.type];
                    ctx.fillStyle = config.colors?.[cell.colorIndex] || config.color;
                    ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
                }
            }
        }
    }

    renderHighScores() {
        const list = document.getElementById('highscoresList');
        if (!list) return;

        list.innerHTML = '';

        if (this.saveData.highScores.length === 0) {
            list.innerHTML = '<p style="text-align: center; opacity: 0.5; padding: 40px;">Noch keine Highscores</p>';
            return;
        }

        this.saveData.highScores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'highscore-item';
            div.innerHTML = `
                <div class="highscore-rank">${index + 1}</div>
                <div class="highscore-info">
                    <div class="highscore-score">${entry.score}</div>
                    <div class="highscore-level">Level ${entry.level}</div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    renderAchievements() {
        const grid = document.getElementById('achievementsList');
        if (!grid) return;

        const achievements = [
            { id: 'first_break', name: 'First Break', desc: 'Zerstöre deinen ersten Block', icon: '🎯' },
            { id: 'destroyer', name: 'Destroyer', desc: '1000 Blöcke zerstört', icon: '💥' },
            { id: 'collector', name: 'Collector', desc: '50 Powerups gesammelt', icon: '⭐' },
            { id: 'level_master', name: 'Level Master', desc: 'Alle Level abgeschlossen', icon: '🏆' },
            { id: 'perfectionist', name: 'Perfectionist', desc: '5 perfekte Level', icon: '✨' },
            { id: 'combo_king', name: 'Combo King', desc: '10x Combo erreicht', icon: '🔥' },
        ];

        grid.innerHTML = '';

        achievements.forEach(achievement => {
            const unlocked = this.saveManager.hasAchievement(achievement.id, this.saveData);

            const card = document.createElement('div');
            card.className = 'achievement-card' + (unlocked ? ' unlocked' : ' locked');
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.desc}</div>
            `;
            grid.appendChild(card);
        });
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreakoutGame();
});
