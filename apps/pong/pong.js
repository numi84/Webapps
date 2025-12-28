// Pong - Complete Refactor
// All issues fixed: DOM safety, memory leaks, race conditions, etc.

'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const CONFIG = {
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 100,
    BALL_SIZE: 10,
    PADDLE_SPEED: 6,
    INITIAL_BALL_SPEED: 5,
    WINNING_SCORE: 10,
    SPEED_INCREMENT: 0.2,
    MOUSE_SMOOTHING: 0.15,
    MAX_ANGLE: Math.PI / 4,  // 45 degrees
    SCORE_DELAY_MS: 1000,
    NEXT_GAME_DELAY_MS: 2500,
    COUNTDOWN_SECONDS: 3
};

const COLORS = {
    background: '#1a1a2e',
    centerLine: 'rgba(255, 255, 255, 0.2)',
    paddle1: '#667eea',
    paddle2: '#764ba2',
    ball: '#ffffff',
    text: 'rgba(255, 255, 255, 0.5)',
    pauseOverlay: 'rgba(0, 0, 0, 0.7)'
};

// ============================================================
// PONG GAME CLASS
// ============================================================
class PongGame {
    constructor() {
        // DOM Elements (will be initialized in init())
        this.canvas = null;
        this.ctx = null;
        this.domElements = {};

        // Audio
        this.audioContext = null;
        this.audioResumed = false;

        // Game State
        this.gameRunning = false;
        this.isPaused = false;
        this.controlMode = 'arrows';
        this.mouseY = 0;
        this.bestOf = 10;
        this.player1Side = 'left';
        this.ballDirection = 1;

        // Timeout/Animation tracking (for cleanup)
        this.activeTimeouts = [];
        this.animationFrameId = null;

        // Game Objects
        this.paddle1 = null;
        this.paddle2 = null;
        this.ball = null;
        this.score = { player1: 0, player2: 0 };
        this.seriesScore = { player1: 0, player2: 0 };

        // Keyboard State
        this.keys = {
            w: false,
            s: false,
            ArrowUp: false,
            ArrowDown: false
        };

        // Bound event handlers (for cleanup)
        this.boundHandlers = {};
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
            this.showError('DOM-Elemente nicht gefunden.');
            return false;
        }

        this.initAudio();
        this.initGameObjects();
        this.setupEventListeners();
        this.draw();

        return true;
    }

    initCanvas() {
        this.canvas = document.getElementById('pong-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Canvas 2D context not available');
            return false;
        }

        this.mouseY = this.canvas.height / 2;
        return true;
    }

    initDOMElements() {
        const elementIds = [
            'start-btn', 'score-p1', 'score-p2', 'series-p1', 'series-p2',
            'game-message', 'control-mode', 'best-of', 'side-selection',
            'left-player-label', 'right-player-label',
            'left-player-controls', 'right-player-controls',
            'countdown', 'direction-arrow'
        ];

        for (const id of elementIds) {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element not found: ${id}`);
                return false;
            }
            this.domElements[id] = element;
        }

        return true;
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Check if suspended (autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioResumed = false;
            } else {
                this.audioResumed = true;
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.audioContext = null;
        }
    }

    async resumeAudio() {
        if (!this.audioContext || this.audioResumed) return;

        try {
            await this.audioContext.resume();
            this.audioResumed = true;
        } catch (e) {
            console.warn('Failed to resume AudioContext:', e);
        }
    }

    initGameObjects() {
        this.paddle1 = {
            x: 30,
            y: this.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
            width: CONFIG.PADDLE_WIDTH,
            height: CONFIG.PADDLE_HEIGHT,
            dy: 0
        };

        this.paddle2 = {
            x: this.canvas.width - 30 - CONFIG.PADDLE_WIDTH,
            y: this.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
            width: CONFIG.PADDLE_WIDTH,
            height: CONFIG.PADDLE_HEIGHT,
            dy: 0
        };

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: CONFIG.BALL_SIZE,
            dx: CONFIG.INITIAL_BALL_SPEED,
            dy: CONFIG.INITIAL_BALL_SPEED,
            speed: CONFIG.INITIAL_BALL_SPEED
        };
    }

    // --------------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------------
    setupEventListeners() {
        // Create bound handlers
        this.boundHandlers.keydown = this.handleKeyDown.bind(this);
        this.boundHandlers.keyup = this.handleKeyUp.bind(this);
        this.boundHandlers.mousemove = this.handleMouseMove.bind(this);

        // Keyboard
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);

        // Mouse
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);

        // UI Controls
        this.domElements['start-btn'].addEventListener('click', () => this.startGame());

        this.domElements['control-mode'].addEventListener('change', (e) => {
            this.controlMode = e.target.value;
        });

        this.domElements['best-of'].addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) {
                this.bestOf = val;
            }
        });

        this.domElements['side-selection'].addEventListener('change', (e) => {
            this.player1Side = e.target.value;
            this.updatePlayerLabels();
        });
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();

        if (key === 'w') {
            this.keys.w = true;
            e.preventDefault();
        } else if (key === 's') {
            this.keys.s = true;
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            this.keys.ArrowUp = true;
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            this.keys.ArrowDown = true;
            e.preventDefault();
        } else if (key === 'p' || e.key === 'Escape') {
            // Pause functionality
            if (this.gameRunning) {
                this.togglePause();
                e.preventDefault();
            }
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();

        if (key === 'w') this.keys.w = false;
        else if (key === 's') this.keys.s = false;
        else if (e.key === 'ArrowUp') this.keys.ArrowUp = false;
        else if (e.key === 'ArrowDown') this.keys.ArrowDown = false;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleY = this.canvas.height / rect.height;
        this.mouseY = (e.clientY - rect.top) * scaleY;
    }

    destroy() {
        // Clear all timeouts
        this.clearAllTimeouts();

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);

        this.boundHandlers = {};
    }

    // --------------------------------------------------------
    // TIMEOUT MANAGEMENT
    // --------------------------------------------------------
    addTimeout(callback, delay) {
        const id = setTimeout(() => {
            // Remove from tracking when executed
            this.activeTimeouts = this.activeTimeouts.filter(t => t !== id);
            callback();
        }, delay);
        this.activeTimeouts.push(id);
        return id;
    }

    clearAllTimeouts() {
        for (const id of this.activeTimeouts) {
            clearTimeout(id);
        }
        this.activeTimeouts = [];
    }

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        // Resume audio on first interaction
        if (!this.audioResumed) {
            this.resumeAudio();
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // Silently fail - audio is not critical
        }
    }

    playCountdownSound() { this.playSound(600, 0.1); }
    playStartSound() { this.playSound(800, 0.15); }
    playPaddleHitSound() { this.playSound(400, 0.05, 'square'); }
    playWallHitSound() { this.playSound(300, 0.05, 'square'); }
    playScoreSound() { this.playSound(200, 0.3, 'triangle'); }

    // --------------------------------------------------------
    // GAME CONTROL
    // --------------------------------------------------------
    startGame() {
        // Resume audio on user interaction
        this.resumeAudio();

        // Clear any pending timeouts from previous game
        this.clearAllTimeouts();

        this.score.player1 = 0;
        this.score.player2 = 0;
        this.seriesScore.player1 = 0;
        this.seriesScore.player2 = 0;

        // Parse and validate bestOf
        const bestOfVal = parseInt(this.domElements['best-of'].value, 10);
        if (!isNaN(bestOfVal) && bestOfVal > 0) {
            this.bestOf = bestOfVal;
        }

        this.player1Side = this.domElements['side-selection'].value;

        this.updateScore();
        this.updateSeriesScore();
        this.updatePlayerLabels();
        this.hideMessage();

        this.domElements['start-btn'].classList.add('hidden');
        this.startCountdown();
    }

    startCountdown() {
        let count = CONFIG.COUNTDOWN_SECONDS;

        // Determine ball direction for next round
        this.ballDirection = Math.random() < 0.5 ? 1 : -1;

        // Show direction arrow
        const arrow = this.domElements['direction-arrow'];
        arrow.textContent = this.ballDirection === 1 ? '→' : '←';
        arrow.className = 'direction-arrow ' + (this.ballDirection === 1 ? 'right' : 'left');
        arrow.classList.remove('hidden');

        const countdown = this.domElements['countdown'];

        const showCount = () => {
            if (count > 0) {
                countdown.textContent = count;
                countdown.classList.remove('hidden');

                // Trigger animation
                countdown.style.animation = 'none';
                this.addTimeout(() => {
                    countdown.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);

                this.playCountdownSound();

                if (count === 1) {
                    this.addTimeout(() => {
                        countdown.classList.add('hidden');
                        arrow.classList.add('hidden');
                    }, 500);
                }

                count--;
                this.addTimeout(showCount, 1000);
            } else {
                countdown.classList.add('hidden');
                arrow.classList.add('hidden');

                this.playStartSound();
                this.resetBall();
                this.isPaused = false;
                this.gameRunning = true;
                this.gameLoop();
            }
        };

        showCount();
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Show pause message
            this.showMessage('⏸ PAUSE - Drücke P oder ESC zum Fortsetzen');
        } else {
            this.hideMessage();
            // Resume game loop
            this.gameLoop();
        }
    }

    updatePlayerLabels() {
        const leftLabel = this.domElements['left-player-label'];
        const rightLabel = this.domElements['right-player-label'];
        const leftControls = this.domElements['left-player-controls'];
        const rightControls = this.domElements['right-player-controls'];

        // Instead of using innerHTML (which causes stale reference and event listener accumulation),
        // we update the existing control-mode select visibility based on side

        if (this.player1Side === 'left') {
            leftLabel.textContent = 'Spieler 1 (Links)';
            rightLabel.textContent = 'Spieler 2 (Rechts)';
            leftControls.textContent = 'W - Hoch | S - Runter';

            // Move control select to right side
            this.updateControlSelectLocation(rightControls);
        } else {
            leftLabel.textContent = 'Spieler 2 (Links)';
            rightLabel.textContent = 'Spieler 1 (Rechts)';
            rightControls.textContent = 'W - Hoch | S - Runter';

            // Move control select to left side
            this.updateControlSelectLocation(leftControls);
        }
    }

    updateControlSelectLocation(container) {
        // Get or create the control mode select
        let select = this.domElements['control-mode'];

        // If select exists and is in a different container, move it
        if (select && select.parentNode !== container) {
            // Clear the container first if it has text
            container.textContent = '';
            container.appendChild(select);
        }

        // Update select value to current control mode
        if (select) {
            select.value = this.controlMode;
        }
    }

    // --------------------------------------------------------
    // GAME LOGIC
    // --------------------------------------------------------
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random angle between -45 and 45 degrees
        const angle = (Math.random() * 90 - 45) * Math.PI / 180;

        this.ball.speed = CONFIG.INITIAL_BALL_SPEED;
        this.ball.dx = Math.cos(angle) * this.ball.speed * this.ballDirection;
        this.ball.dy = Math.sin(angle) * this.ball.speed;
    }

    updatePaddles() {
        // Determine which paddle each player controls
        const player1Paddle = this.player1Side === 'left' ? this.paddle1 : this.paddle2;
        const player2Paddle = this.player1Side === 'left' ? this.paddle2 : this.paddle1;

        // Player 1 (WASD)
        if (this.keys.w) {
            player1Paddle.dy = -CONFIG.PADDLE_SPEED;
        } else if (this.keys.s) {
            player1Paddle.dy = CONFIG.PADDLE_SPEED;
        } else {
            player1Paddle.dy = 0;
        }

        // Player 2 (Arrows or Mouse)
        if (this.controlMode === 'arrows') {
            if (this.keys.ArrowUp) {
                player2Paddle.dy = -CONFIG.PADDLE_SPEED;
            } else if (this.keys.ArrowDown) {
                player2Paddle.dy = CONFIG.PADDLE_SPEED;
            } else {
                player2Paddle.dy = 0;
            }
        } else {
            // Mouse control with smoothing
            const targetY = this.mouseY - player2Paddle.height / 2;
            const diff = targetY - player2Paddle.y;

            if (Math.abs(diff) > 2) {
                player2Paddle.dy = diff * CONFIG.MOUSE_SMOOTHING;
            } else {
                player2Paddle.dy = 0;
            }
        }

        // Update positions
        this.paddle1.y += this.paddle1.dy;
        this.paddle2.y += this.paddle2.dy;

        // Keep in bounds
        this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
        this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collision (top and bottom)
        if (this.ball.y - this.ball.size / 2 <= 0 || this.ball.y + this.ball.size / 2 >= this.canvas.height) {
            this.ball.dy *= -1;
            this.playWallHitSound();
        }

        // Paddle 1 collision
        this.checkPaddleCollision(this.paddle1, 1);

        // Paddle 2 collision
        this.checkPaddleCollision(this.paddle2, -1);

        // Score detection
        if (this.ball.x - this.ball.size / 2 <= 0) {
            this.handleScore('player2');
        } else if (this.ball.x + this.ball.size / 2 >= this.canvas.width) {
            this.handleScore('player1');
        }
    }

    checkPaddleCollision(paddle, xDirection) {
        const ballLeft = this.ball.x - this.ball.size / 2;
        const ballRight = this.ball.x + this.ball.size / 2;
        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + paddle.width;

        if (ballRight >= paddleLeft && ballLeft <= paddleRight &&
            this.ball.y >= paddle.y && this.ball.y <= paddle.y + paddle.height) {

            // Calculate hit position (-1 to 1)
            const hitPos = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);

            // Adjust angle based on hit position
            const angle = hitPos * CONFIG.MAX_ANGLE;

            this.ball.speed += CONFIG.SPEED_INCREMENT;
            this.ball.dx = xDirection * Math.cos(angle) * this.ball.speed;
            this.ball.dy = Math.sin(angle) * this.ball.speed;

            // Prevent ball from getting stuck inside paddle
            if (xDirection === 1) {
                this.ball.x = paddleRight + this.ball.size / 2;
            } else {
                this.ball.x = paddleLeft - this.ball.size / 2;
            }

            this.playPaddleHitSound();
        }
    }

    handleScore(scorer) {
        this.score[scorer]++;
        this.updateScore();
        this.playScoreSound();

        // Check for game win
        const winner = this.checkGameWin();

        if (winner) {
            this.handleGameWin(winner);
        } else if (this.gameRunning) {
            // Show brief "Get Ready" message during delay
            this.showMessage('Bereit...');

            // Generate new direction
            this.ballDirection = Math.random() < 0.5 ? 1 : -1;

            // Reset ball after delay (using tracked timeout)
            this.addTimeout(() => {
                if (this.gameRunning && !this.isPaused) {
                    this.hideMessage();
                    this.resetBall();
                }
            }, CONFIG.SCORE_DELAY_MS);
        }
    }

    checkGameWin() {
        if (this.score.player1 >= CONFIG.WINNING_SCORE) {
            return 'player1';
        } else if (this.score.player2 >= CONFIG.WINNING_SCORE) {
            return 'player2';
        }
        return null;
    }

    handleGameWin(winner) {
        // Update series score
        this.seriesScore[winner]++;
        this.updateSeriesScore();

        const gamesNeededToWin = Math.ceil(this.bestOf / 2);
        const winnerNum = winner === 'player1' ? 1 : 2;
        const loserNum = winner === 'player1' ? 2 : 1;

        if (this.seriesScore[winner] >= gamesNeededToWin) {
            // Series win
            this.gameRunning = false;
            this.showMessage(`🎉 Spieler ${winnerNum} gewinnt die Serie! (${this.seriesScore.player1}-${this.seriesScore.player2})`);
            this.domElements['start-btn'].classList.remove('hidden');
        } else {
            // Game win, continue series
            this.gameRunning = false;
            const gamesPlayed = this.seriesScore.player1 + this.seriesScore.player2;
            this.showMessage(`Spieler ${winnerNum} gewinnt Spiel ${gamesPlayed}! Serie: ${this.seriesScore.player1}-${this.seriesScore.player2}`);

            this.addTimeout(() => {
                this.startNextGame();
            }, CONFIG.NEXT_GAME_DELAY_MS);
        }
    }

    startNextGame() {
        this.score.player1 = 0;
        this.score.player2 = 0;
        this.updateScore();
        this.hideMessage();
        this.startCountdown();
    }

    // --------------------------------------------------------
    // UI UPDATES
    // --------------------------------------------------------
    updateScore() {
        this.domElements['score-p1'].textContent = this.score.player1;
        this.domElements['score-p2'].textContent = this.score.player2;
    }

    updateSeriesScore() {
        this.domElements['series-p1'].textContent = this.seriesScore.player1;
        this.domElements['series-p2'].textContent = this.seriesScore.player2;
    }

    showMessage(msg) {
        this.domElements['game-message'].textContent = msg;
        this.domElements['game-message'].classList.remove('hidden');
    }

    hideMessage() {
        this.domElements['game-message'].classList.add('hidden');
    }

    showError(msg) {
        console.error('Pong Error:', msg);
        const container = document.querySelector('.game-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                    <h2>⚠️ Fehler</h2>
                    <p>${msg}</p>
                    <p>Bitte Seite neu laden.</p>
                </div>
            `;
        }
    }

    // --------------------------------------------------------
    // RENDERING
    // --------------------------------------------------------
    draw() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        ctx.strokeStyle = COLORS.centerLine;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles
        ctx.fillStyle = COLORS.paddle1;
        ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);

        ctx.fillStyle = COLORS.paddle2;
        ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        // Draw ball
        ctx.fillStyle = COLORS.ball;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw game score on canvas (big numbers)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.score.player1, this.canvas.width / 4, 100);
        ctx.fillText(this.score.player2, 3 * this.canvas.width / 4, 100);

        // Draw control mode indicator
        ctx.fillStyle = COLORS.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            this.controlMode === 'mouse' ? 'Maus-Modus' : 'Tastatur-Modus',
            this.canvas.width - 10,
            20
        );

        // Draw pause indicator
        if (this.isPaused && this.gameRunning) {
            ctx.fillStyle = COLORS.pauseOverlay;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⏸ PAUSE', this.canvas.width / 2, this.canvas.height / 2);

            ctx.font = '18px Arial';
            ctx.fillText('Drücke P oder ESC zum Fortsetzen', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }

        ctx.textAlign = 'left';
    }

    gameLoop() {
        if (!this.gameRunning || this.isPaused) {
            // Still draw when paused to show pause overlay
            if (this.isPaused) {
                this.draw();
            }
            return;
        }

        this.updatePaddles();
        this.updateBall();
        this.draw();

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new PongGame();

    if (game.init()) {
        // Make accessible for debugging
        window.pongGame = game;
    }
});
