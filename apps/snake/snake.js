// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = 20;
canvas.width = canvas.height = gridSize * tileCount;

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
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const startBtn = document.getElementById('start-btn');
const difficultyButtons = document.querySelectorAll('.diff-btn');
const arrowButtons = document.querySelectorAll('.arrow-btn');

// Load Highscore
function loadHighscore() {
    const stored = localStorage.getItem('snake-highscore');
    if (stored) {
        highscore = parseInt(stored);
        highscoreEl.textContent = highscore;
    }
}

// Save Highscore
function saveHighscore() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('snake-highscore', highscore);
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
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

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
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    saveHighscore();

    setTimeout(() => {
        alert(`Game Over!\n\nPunkte: ${score}\nHighscore: ${highscore}`);
    }, 100);
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

// Initialize
loadHighscore();
draw();
