// Snake Deluxe - Neon Edition
// Vollständig überarbeitet mit allen Bug-Fixes und Performance-Optimierungen

'use strict';

// ============================================================
// KONSTANTEN
// ============================================================
const CONFIG = {
    GRID_SIZE: 25,
    TILE_COUNT: 20,
    DEFAULT_SPEED: 150,
    LEVEL_UP_THRESHOLD: 5,
    MAX_PARTICLES: 100,
    MAX_TRAIL: 50,
    TRAIL_SPAWN_CHANCE: 0.15,
    TRAIL_DECAY: 0.02,
    FOOD_PULSE_SPEED: 0.005,
    SAVE_DEBOUNCE_MS: 1000,
    GAME_OVER_PARTICLE_COUNT: 100,
    FOOD_PARTICLE_COUNT: 15,
    FOOD_CYAN_PARTICLE_COUNT: 8
};

const STORAGE_KEYS = {
    HIGHSCORE: 'snake-deluxe-highscore',
    STATS: 'snake-deluxe-stats'
};

const COLORS = {
    snakeHead: { r: 0, g: 255, b: 255 },
    snakeBody: { r: 255, g: 0, b: 255 },
    food: { r: 255, g: 255, b: 0 },
    trail: { r: 0, g: 200, b: 200 }
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    NONE: { x: 0, y: 0 }
};

// ============================================================
// PARTICLE CLASS
// ============================================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================
// GAME CLASS
// ============================================================
class SnakeDeluxeGame {
    constructor() {
        this.domElements = {};
        this.canvas = null;
        this.ctx = null;
        this.particleCanvas = null;
        this.particleCtx = null;
        this.gridCanvas = null;
        this.gridCtx = null;

        // Game State
        this.snake = [];
        this.snakePositions = [];
        this.food = { x: 15, y: 15 };
        this.direction = { ...DIRECTIONS.NONE };
        this.nextDirection = { ...DIRECTIONS.NONE };
        this.score = 0;
        this.level = 1;
        this.highscore = 0;
        this.gameLoop = null;
        this.animationFrame = null;
        this.gameOverAnimationFrame = null;
        this.gameSpeed = CONFIG.DEFAULT_SPEED;
        this.gameRunning = false;
        this.interpolation = 0;
        this.particles = [];
        this.trail = [];

        // Statistics
        this.stats = {
            bestStreak: 0,
            gamesPlayed: 0,
            totalOrbs: 0
        };

        // Debounce timer for saving
        this.saveDebounceTimer = null;

        // Cached color strings
        this.cachedColors = {
            food: `rgb(${COLORS.food.r}, ${COLORS.food.g}, ${COLORS.food.b})`,
            cyan: 'rgb(0, 255, 255)',
            magenta: 'rgb(255, 0, 255)'
        };

        // Bound event handlers (für cleanup)
        this.boundKeyHandler = this.handleKeyDown.bind(this);
        this.boundResizeHandler = this.handleResize.bind(this);
    }

    // --------------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------------
    init() {
        if (!this.initCanvas()) {
            this.showError('Canvas konnte nicht initialisiert werden.');
            return false;
        }

        if (!this.initDOMElements()) {
            this.showError('DOM-Elemente konnten nicht gefunden werden.');
            return false;
        }

        this.createGridCache();
        this.loadStats();
        this.setupEventListeners();
        this.draw();

        return true;
    }

    initCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.particleCanvas = document.getElementById('particle-canvas');

        if (!this.canvas || !this.particleCanvas) {
            console.error('Canvas elements not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particleCtx = this.particleCanvas.getContext('2d');

        if (!this.ctx || !this.particleCtx) {
            console.error('Canvas 2D context not available');
            return false;
        }

        // Set canvas dimensions
        const size = CONFIG.GRID_SIZE * CONFIG.TILE_COUNT;
        this.canvas.width = this.canvas.height = size;
        this.particleCanvas.width = this.particleCanvas.height = size;

        return true;
    }

    initDOMElements() {
        const elementIds = [
            'score', 'level', 'highscore', 'start-btn',
            'best-streak', 'games-played', 'total-orbs'
        ];

        for (const id of elementIds) {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element not found: ${id}`);
                return false;
            }
            this.domElements[id] = element;
        }

        this.domElements.difficultyButtons = document.querySelectorAll('.diff-btn');
        this.domElements.arrowButtons = document.querySelectorAll('.arrow-btn');

        return true;
    }

    createGridCache() {
        // Pre-render grid to offscreen canvas for better performance
        this.gridCanvas = document.createElement('canvas');
        const size = CONFIG.GRID_SIZE * CONFIG.TILE_COUNT;
        this.gridCanvas.width = this.gridCanvas.height = size;
        this.gridCtx = this.gridCanvas.getContext('2d');

        if (!this.gridCtx) return;

        this.gridCtx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
        this.gridCtx.lineWidth = 1;

        for (let i = 0; i <= CONFIG.TILE_COUNT; i++) {
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(i * CONFIG.GRID_SIZE, 0);
            this.gridCtx.lineTo(i * CONFIG.GRID_SIZE, size);
            this.gridCtx.stroke();

            this.gridCtx.beginPath();
            this.gridCtx.moveTo(0, i * CONFIG.GRID_SIZE);
            this.gridCtx.lineTo(size, i * CONFIG.GRID_SIZE);
            this.gridCtx.stroke();
        }
    }

    // --------------------------------------------------------
    // LOCAL STORAGE (with error handling)
    // --------------------------------------------------------
    loadStats() {
        try {
            const storedHighscore = localStorage.getItem(STORAGE_KEYS.HIGHSCORE);
            if (storedHighscore) {
                const parsed = parseInt(storedHighscore, 10);
                if (!isNaN(parsed)) {
                    this.highscore = parsed;
                    this.domElements.highscore.textContent = this.highscore;
                }
            }
        } catch (e) {
            console.warn('Could not load highscore from localStorage:', e);
        }

        try {
            const storedStats = localStorage.getItem(STORAGE_KEYS.STATS);
            if (storedStats) {
                const parsed = JSON.parse(storedStats);
                // Validate parsed data structure
                if (parsed && typeof parsed === 'object') {
                    this.stats.bestStreak = typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0;
                    this.stats.gamesPlayed = typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0;
                    this.stats.totalOrbs = typeof parsed.totalOrbs === 'number' ? parsed.totalOrbs : 0;
                }
                this.updateStatsDisplay();
            }
        } catch (e) {
            console.warn('Could not load stats from localStorage:', e);
            // Reset to defaults
            this.stats = { bestStreak: 0, gamesPlayed: 0, totalOrbs: 0 };
        }
    }

    saveStats() {
        // Debounce saves to avoid excessive writes
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        this.saveDebounceTimer = setTimeout(() => {
            this._doSaveStats();
        }, CONFIG.SAVE_DEBOUNCE_MS);
    }

    saveStatsImmediate() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        this._doSaveStats();
    }

    _doSaveStats() {
        try {
            if (this.score > this.highscore) {
                this.highscore = this.score;
                localStorage.setItem(STORAGE_KEYS.HIGHSCORE, String(this.highscore));
                this.domElements.highscore.textContent = this.highscore;
            }

            if (this.score > this.stats.bestStreak) {
                this.stats.bestStreak = this.score;
            }

            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
            this.updateStatsDisplay();
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    updateStatsDisplay() {
        this.domElements['best-streak'].textContent = this.stats.bestStreak;
        this.domElements['games-played'].textContent = this.stats.gamesPlayed;
        this.domElements['total-orbs'].textContent = this.stats.totalOrbs;
    }

    // --------------------------------------------------------
    // GAME CONTROL
    // --------------------------------------------------------
    startGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.snakePositions = [{ x: 10 * CONFIG.GRID_SIZE, y: 10 * CONFIG.GRID_SIZE }];
        this.direction = { ...DIRECTIONS.RIGHT };
        this.nextDirection = { ...DIRECTIONS.RIGHT };
        this.score = 0;
        this.level = 1;
        this.interpolation = 0;
        this.particles = [];
        this.trail = [];

        this.domElements.score.textContent = this.score;
        this.domElements.level.textContent = this.level;
        this.gameRunning = true;

        this.placeFood();

        // Clear existing loops
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.gameOverAnimationFrame) cancelAnimationFrame(this.gameOverAnimationFrame);
        this.gameOverAnimationFrame = null;

        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.animate();
    }

    update() {
        if (!this.gameRunning) return;

        // Update direction from nextDirection
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Check wall collision
        if (head.x < 0 || head.x >= CONFIG.TILE_COUNT ||
            head.y < 0 || head.y >= CONFIG.TILE_COUNT) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.collectFood();
        } else {
            this.snake.pop();
        }

        // Update smooth positions
        this.snakePositions = this.snake.map(segment => ({
            x: segment.x * CONFIG.GRID_SIZE,
            y: segment.y * CONFIG.GRID_SIZE
        }));

        this.interpolation = 0;
    }

    collectFood() {
        this.score++;
        this.stats.totalOrbs++;
        this.domElements.score.textContent = this.score;

        // Animate score
        this.domElements.score.classList.add('score-pop');
        setTimeout(() => this.domElements.score.classList.remove('score-pop'), 300);

        // Level up check
        if (this.score % CONFIG.LEVEL_UP_THRESHOLD === 0) {
            this.level++;
            this.domElements.level.textContent = this.level;
            this.domElements.level.classList.add('score-pop');
            setTimeout(() => this.domElements.level.classList.remove('score-pop'), 300);
        }

        // Create particles
        const foodX = this.food.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const foodY = this.food.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        this.createFoodParticles(foodX, foodY);

        this.placeFood();
        this.saveStats();
    }

    placeFood() {
        const maxAttempts = CONFIG.TILE_COUNT * CONFIG.TILE_COUNT;
        let attempts = 0;

        do {
            this.food = {
                x: Math.floor(Math.random() * CONFIG.TILE_COUNT),
                y: Math.floor(Math.random() * CONFIG.TILE_COUNT)
            };
            attempts++;

            // Prevent infinite loop if snake fills the board
            if (attempts >= maxAttempts) {
                // Find any empty spot systematically
                for (let x = 0; x < CONFIG.TILE_COUNT; x++) {
                    for (let y = 0; y < CONFIG.TILE_COUNT; y++) {
                        if (!this.snake.some(s => s.x === x && s.y === y)) {
                            this.food = { x, y };
                            return;
                        }
                    }
                }
                // No space left - player wins!
                this.gameOver(true);
                return;
            }
        } while (this.snake.some(segment =>
            segment.x === this.food.x && segment.y === this.food.y));
    }

    gameOver(isWin = false) {
        this.gameRunning = false;

        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Increment games played at end, not start
        this.stats.gamesPlayed++;
        this.saveStatsImmediate();

        // Create explosion effect
        if (this.snake.length > 0) {
            const head = this.snake[0];
            for (let i = 0; i < CONFIG.GAME_OVER_PARTICLE_COUNT; i++) {
                const color = Math.random() > 0.5 ? this.cachedColors.cyan : this.cachedColors.magenta;
                this.particles.push(new Particle(
                    head.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
                    head.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
                    color
                ));
            }
        }

        // Continue animating particles until they fade
        this.animateGameOverParticles();

        // Show game over modal
        setTimeout(() => {
            this.showGameOverModal(isWin);
        }, 100);
    }

    animateGameOverParticles() {
        if (this.gameOverAnimationFrame) {
            cancelAnimationFrame(this.gameOverAnimationFrame);
        }

        const animate = () => {
            this.drawParticles();
            if (this.particles.length > 0) {
                this.gameOverAnimationFrame = requestAnimationFrame(animate);
            } else {
                this.gameOverAnimationFrame = null;
            }
        };
        animate();
    }

    // --------------------------------------------------------
    // RENDERING
    // --------------------------------------------------------
    animate() {
        if (!this.gameRunning) return;

        this.interpolation += 0.15;
        if (this.interpolation > 1) this.interpolation = 1;

        this.draw();
        this.drawParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    draw() {
        const ctx = this.ctx;
        const size = this.canvas.width;

        // Clear with fade effect
        ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
        ctx.fillRect(0, 0, size, size);

        // Draw cached grid
        if (this.gridCanvas) {
            ctx.drawImage(this.gridCanvas, 0, 0);
        }

        // Draw trail
        this.drawTrail(ctx);

        // Draw food
        this.drawFood(ctx);

        // Draw snake
        this.drawSnake(ctx);
    }

    drawTrail(ctx) {
        const trailColor = COLORS.trail;

        for (let i = this.trail.length - 1; i >= 0; i--) {
            const t = this.trail[i];
            t.life -= CONFIG.TRAIL_DECAY;

            if (t.life <= 0) {
                this.trail.splice(i, 1);
                continue;
            }

            ctx.fillStyle = `rgba(${trailColor.r}, ${trailColor.g}, ${trailColor.b}, ${t.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Limit trail size efficiently
        if (this.trail.length > CONFIG.MAX_TRAIL) {
            this.trail.splice(0, this.trail.length - CONFIG.MAX_TRAIL);
        }
    }

    drawFood(ctx) {
        const pulse = Math.sin(performance.now() * CONFIG.FOOD_PULSE_SPEED) * 0.3 + 0.7;
        const foodSize = (CONFIG.GRID_SIZE / 2 - 2) * (1 + pulse * 0.2);
        const foodX = this.food.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const foodY = this.food.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;

        ctx.save();
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = this.cachedColors.food;
        ctx.fillStyle = this.cachedColors.food;
        ctx.beginPath();
        ctx.arc(foodX, foodY, foodSize, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(foodX - foodSize * 0.25, foodY - foodSize * 0.25, foodSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawSnake(ctx) {
        const snakeLength = this.snake.length;

        for (let i = 0; i < snakeLength; i++) {
            const segment = this.snake[i];
            const targetX = segment.x * CONFIG.GRID_SIZE;
            const targetY = segment.y * CONFIG.GRID_SIZE;

            let drawX = targetX;
            let drawY = targetY;

            // Smooth interpolation for head
            if (i === 0 && snakeLength > 1) {
                const prev = this.snake[1];
                const prevX = prev.x * CONFIG.GRID_SIZE;
                const prevY = prev.y * CONFIG.GRID_SIZE;

                drawX = prevX + (targetX - prevX) * this.interpolation;
                drawY = prevY + (targetY - prevY) * this.interpolation;

                // Add trail for head
                if (Math.random() < CONFIG.TRAIL_SPAWN_CHANCE) {
                    this.trail.push({
                        x: drawX + CONFIG.GRID_SIZE / 2,
                        y: drawY + CONFIG.GRID_SIZE / 2,
                        size: Math.random() * 3 + 2,
                        life: 1
                    });
                }
            }

            // Calculate gradient color
            const ratio = i / Math.max(snakeLength - 1, 1);
            const r = Math.floor(COLORS.snakeHead.r + (COLORS.snakeBody.r - COLORS.snakeHead.r) * ratio);
            const g = Math.floor(COLORS.snakeHead.g + (COLORS.snakeBody.g - COLORS.snakeHead.g) * ratio);
            const b = Math.floor(COLORS.snakeHead.b + (COLORS.snakeBody.b - COLORS.snakeHead.b) * ratio);

            ctx.save();

            // Only shadow on head for performance
            if (i === 0) {
                ctx.shadowBlur = 25;
                ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            }

            // Draw segment
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(drawX + 2, drawY + 2, CONFIG.GRID_SIZE - 4, CONFIG.GRID_SIZE - 4);

            // Highlight
            const alpha = Math.max(0, 0.2 - i * 0.01);
            if (alpha > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(drawX + 3, drawY + 3, CONFIG.GRID_SIZE * 0.4, CONFIG.GRID_SIZE * 0.4);
            }

            ctx.restore();
        }
    }

    drawParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

        // Update, draw, and filter in one pass
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                particle.draw(this.particleCtx);
            }
        }

        // Limit particles efficiently
        if (this.particles.length > CONFIG.MAX_PARTICLES) {
            this.particles.splice(0, this.particles.length - CONFIG.MAX_PARTICLES);
        }
    }

    createFoodParticles(x, y) {
        for (let i = 0; i < CONFIG.FOOD_PARTICLE_COUNT; i++) {
            this.particles.push(new Particle(x, y, this.cachedColors.food));
        }
        for (let i = 0; i < CONFIG.FOOD_CYAN_PARTICLE_COUNT; i++) {
            this.particles.push(new Particle(x, y, this.cachedColors.cyan));
        }
    }

    // --------------------------------------------------------
    // INPUT HANDLING
    // --------------------------------------------------------
    changeDirection(newDirection) {
        // Prevent reversing direction (check against NEXT direction, not current)
        if (newDirection.x === -this.nextDirection.x && newDirection.y === -this.nextDirection.y) {
            return;
        }

        // Prevent diagonal movement
        if (newDirection.x !== 0 && newDirection.y !== 0) {
            return;
        }

        this.nextDirection = { ...newDirection };
    }

    handleKeyDown(e) {
        // Ignore arrow keys when game not running (except space)
        if (!this.gameRunning && e.key !== ' ') {
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.changeDirection(DIRECTIONS.UP);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.changeDirection(DIRECTIONS.DOWN);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.changeDirection(DIRECTIONS.LEFT);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.changeDirection(DIRECTIONS.RIGHT);
                break;
            case ' ':
                e.preventDefault();
                if (!this.gameRunning) {
                    this.startGame();
                }
                break;
        }
    }

    handleArrowButton(direction) {
        switch (direction) {
            case 'up':
                this.changeDirection(DIRECTIONS.UP);
                break;
            case 'down':
                this.changeDirection(DIRECTIONS.DOWN);
                break;
            case 'left':
                this.changeDirection(DIRECTIONS.LEFT);
                break;
            case 'right':
                this.changeDirection(DIRECTIONS.RIGHT);
                break;
        }
    }

    handleDifficultyChange(btn) {
        const speedStr = btn.dataset.speed;
        const speed = parseInt(speedStr, 10);

        if (isNaN(speed) || speed <= 0) {
            console.warn('Invalid speed value:', speedStr);
            return;
        }

        // Update active state
        this.domElements.difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.gameSpeed = speed;

        // Update running game
        if (this.gameRunning && this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        }
    }

    handleResize() {
        // Recreate grid cache on resize if needed
        this.createGridCache();
    }

    // --------------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------------
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', this.boundKeyHandler);

        // Start button
        this.domElements['start-btn'].addEventListener('click', () => this.startGame());

        // Arrow buttons
        this.domElements.arrowButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const dir = btn.dataset.direction;
                if (dir) this.handleArrowButton(dir);
            });
        });

        // Difficulty buttons
        this.domElements.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleDifficultyChange(btn));
        });

        // Resize handler
        window.addEventListener('resize', this.boundResizeHandler);
    }

    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.boundKeyHandler);
        window.removeEventListener('resize', this.boundResizeHandler);

        // Clear intervals and animation frames
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.gameOverAnimationFrame) cancelAnimationFrame(this.gameOverAnimationFrame);
        if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    }

    // --------------------------------------------------------
    // UI HELPERS
    // --------------------------------------------------------
    showGameOverModal(isWin = false) {
        // Remove existing modal if present
        const existingModal = document.getElementById('game-over-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const title = isWin ? '🎉 GEWONNEN! 🎉' : '🎮 GAME OVER 🎮';
        const message = isWin
            ? 'Unglaublich! Du hast das gesamte Spielfeld gefüllt!'
            : '';

        const modal = document.createElement('div');
        modal.id = 'game-over-modal';
        modal.className = 'game-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 class="modal-title">${title}</h2>
                ${message ? `<p class="modal-message">${message}</p>` : ''}
                <div class="modal-stats">
                    <div class="modal-stat">
                        <span class="modal-stat-label">Punkte</span>
                        <span class="modal-stat-value">${this.score}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Level</span>
                        <span class="modal-stat-value">${this.level}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Highscore</span>
                        <span class="modal-stat-value">${this.highscore}</span>
                    </div>
                </div>
                <button class="modal-btn" id="modal-play-again">Nochmal spielen</button>
                <button class="modal-btn modal-btn-secondary" id="modal-close">Schließen</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for modal buttons
        document.getElementById('modal-play-again').addEventListener('click', () => {
            modal.remove();
            this.startGame();
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    showError(message) {
        console.error('Snake Deluxe Error:', message);
        const container = document.querySelector('.game-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>⚠️ Fehler</h2>
                    <p>${message}</p>
                    <p>Bitte Seite neu laden.</p>
                </div>
            `;
        }
    }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeDeluxeGame();

    if (game.init()) {
        // Make game accessible for debugging (optional)
        window.snakeDeluxeGame = game;
    }
});
