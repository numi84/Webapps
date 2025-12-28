// Canvas Setup
let canvas;
let ctx;
let gridCanvas = null; // Off-screen canvas for grid caching

const gridSize = 20;
const tileCount = 20;

// Game State
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highscore = 0;
let gameLoop = null;
let gameSpeed = 150;
let gameRunning = false;

// DOM Elements
let scoreEl;
let highscoreEl;
let startBtn;
let difficultyButtons;
let arrowButtons;

// Load Highscore
function loadHighscore() {
    try {
        const stored = localStorage.getItem('snake-highscore');
        if (stored) {
            highscore = parseInt(stored);
            highscoreEl.textContent = highscore;
        }
    } catch (error) {
        console.error('localStorage read error:', error);
        // Fallback auf Default-Wert (highscore bleibt 0)
    }
}

// Save Highscore
function saveHighscore() {
    if (score > highscore) {
        highscore = score;
        try {
            localStorage.setItem('snake-highscore', highscore);
        } catch (error) {
            console.error('localStorage write error:', error);
            // Highscore wird trotzdem angezeigt, nur nicht persistiert
        }
        highscoreEl.textContent = highscore;
    }
}

// Start Game
function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = score;
    gameRunning = true;

    placeFood();

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

// Draw Grid (cached)
function drawGrid() {
    if (!gridCanvas) {
        // Create off-screen canvas for grid
        gridCanvas = document.createElement('canvas');
        gridCanvas.width = canvas.width;
        gridCanvas.height = canvas.height;
        const gridCtx = gridCanvas.getContext('2d');

        // Draw background
        gridCtx.fillStyle = '#1a1a1a';
        gridCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        gridCtx.strokeStyle = '#2a2a2a';
        gridCtx.lineWidth = 1;
        for (let i = 0; i <= tileCount; i++) {
            gridCtx.beginPath();
            gridCtx.moveTo(i * gridSize, 0);
            gridCtx.lineTo(i * gridSize, canvas.height);
            gridCtx.stroke();

            gridCtx.beginPath();
            gridCtx.moveTo(0, i * gridSize);
            gridCtx.lineTo(canvas.width, i * gridSize);
            gridCtx.stroke();
        }
    }
    // Copy cached grid to main canvas
    ctx.drawImage(gridCanvas, 0, 0);
}

// Update Game
function update() {
    if (!gameRunning) return;

    // Update direction
    direction = { ...nextDirection };

    // Move snake
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }

    draw();
}

// Draw Game
function draw() {
    // Use cached grid instead of redrawing every frame
    drawGrid();

    // Draw food
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4caf50' : '#66bb6a';
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
}

// Place Food
function placeFood() {
    let attempts = 0;
    const maxAttempts = tileCount * tileCount;

    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        attempts++;
        if (attempts >= maxAttempts) {
            // Game won - no space left
            gameOver();
            return;
        }
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    saveHighscore();

    // Game over state is clear from the stopped game - no blocking alert needed
    // setTimeout(() => {
    //     alert(`Game Over!\n\nPunkte: ${score}\nHighscore: ${highscore}`);
    // }, 100);
}

// Change Direction
function changeDirection(newDirection) {
    // Prevent opposite direction
    if (newDirection.x === -direction.x && newDirection.y === -direction.y) {
        return;
    }

    // Prevent diagonal movement
    if (newDirection.x !== 0 && newDirection.y !== 0) {
        return;
    }

    nextDirection = newDirection;
}

// Initialize Application
function init() {
    // Get DOM Elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    scoreEl = document.getElementById('score');
    highscoreEl = document.getElementById('highscore');
    startBtn = document.getElementById('start-btn');
    difficultyButtons = document.querySelectorAll('.diff-btn');
    arrowButtons = document.querySelectorAll('.arrow-btn');

    // Set canvas size
    canvas.width = canvas.height = gridSize * tileCount;

    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                changeDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
                e.preventDefault();
                changeDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                changeDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
                e.preventDefault();
                changeDirection({ x: 1, y: 0 });
                break;
        }
    });

    // Button Controls
    arrowButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.direction;
            switch (dir) {
                case 'up':
                    changeDirection({ x: 0, y: -1 });
                    break;
                case 'down':
                    changeDirection({ x: 0, y: 1 });
                    break;
                case 'left':
                    changeDirection({ x: -1, y: 0 });
                    break;
                case 'right':
                    changeDirection({ x: 1, y: 0 });
                    break;
            }
        });
    });

    // Start Button
    startBtn.addEventListener('click', startGame);

    // Difficulty Selection
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameSpeed = parseInt(btn.dataset.speed);

            if (gameRunning) {
                clearInterval(gameLoop);
                gameLoop = setInterval(update, gameSpeed);
            }
        });
    });

    // Initialize application
    loadHighscore();
    draw();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
