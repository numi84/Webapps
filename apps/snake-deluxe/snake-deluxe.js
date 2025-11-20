// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const particleCanvas = document.getElementById('particle-canvas');
const particleCtx = particleCanvas.getContext('2d');

const gridSize = 25;
const tileCount = 20;
canvas.width = particleCanvas.width = canvas.height = particleCanvas.height = gridSize * tileCount;

// Game State
let snake = [{ x: 10, y: 10 }];
let snakePositions = [{ x: 10 * gridSize, y: 10 * gridSize }]; // For smooth animation
let food = { x: 15, y: 15 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let level = 1;
let highscore = 0;
let gameLoop = null;
let animationFrame = null;
let gameSpeed = 150;
let gameRunning = false;
let interpolation = 0;
let particles = [];
let trail = [];

// Statistics
let stats = {
    bestStreak: 0,
    gamesPlayed: 0,
    totalOrbs: 0
};

// Colors
const colors = {
    snakeHead: { r: 0, g: 255, b: 255 },
    snakeBody: { r: 255, g: 0, b: 255 },
    food: { r: 255, g: 255, b: 0 },
    trail: { r: 0, g: 200, b: 200 }
};

// DOM Elements
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const highscoreEl = document.getElementById('highscore');
const startBtn = document.getElementById('start-btn');
const difficultyButtons = document.querySelectorAll('.diff-btn');
const arrowButtons = document.querySelectorAll('.arrow-btn');
const bestStreakEl = document.getElementById('best-streak');
const gamesPlayedEl = document.getElementById('games-played');
const totalOrbsEl = document.getElementById('total-orbs');

// Particle Class
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
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        // Reduced shadowBlur for better performance
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Load Stats
function loadStats() {
    const stored = localStorage.getItem('snake-deluxe-highscore');
    if (stored) {
        highscore = parseInt(stored);
        highscoreEl.textContent = highscore;
    }

    const storedStats = localStorage.getItem('snake-deluxe-stats');
    if (storedStats) {
        stats = JSON.parse(storedStats);
        bestStreakEl.textContent = stats.bestStreak;
        gamesPlayedEl.textContent = stats.gamesPlayed;
        totalOrbsEl.textContent = stats.totalOrbs;
    }
}

// Save Stats
function saveStats() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('snake-deluxe-highscore', highscore);
        highscoreEl.textContent = highscore;
    }

    if (score > stats.bestStreak) {
        stats.bestStreak = score;
    }

    localStorage.setItem('snake-deluxe-stats', JSON.stringify(stats));
    bestStreakEl.textContent = stats.bestStreak;
    gamesPlayedEl.textContent = stats.gamesPlayed;
    totalOrbsEl.textContent = stats.totalOrbs;
}

// Start Game
function startGame() {
    snake = [{ x: 10, y: 10 }];
    snakePositions = [{ x: 10 * gridSize, y: 10 * gridSize }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    interpolation = 0;
    particles = [];
    trail = [];

    scoreEl.textContent = score;
    levelEl.textContent = level;
    gameRunning = true;

    stats.gamesPlayed++;
    saveStats();

    placeFood();

    if (gameLoop) clearInterval(gameLoop);
    if (animationFrame) cancelAnimationFrame(animationFrame);

    gameLoop = setInterval(update, gameSpeed);
    animate();
}

// Update Game Logic
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
        stats.totalOrbs++;
        scoreEl.textContent = score;

        // Animate score
        scoreEl.classList.add('score-pop');
        setTimeout(() => scoreEl.classList.remove('score-pop'), 300);

        // Level up every 5 points
        if (score % 5 === 0) {
            level++;
            levelEl.textContent = level;
            levelEl.classList.add('score-pop');
            setTimeout(() => levelEl.classList.remove('score-pop'), 300);
        }

        // Create particles
        createFoodParticles(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);

        placeFood();
        saveStats();
    } else {
        snake.pop();
    }

    // Update smooth positions
    snakePositions = snake.map(segment => ({
        x: segment.x * gridSize,
        y: segment.y * gridSize
    }));

    interpolation = 0;
}

// Animation Loop for smooth rendering
function animate() {
    if (!gameRunning) return;

    interpolation += 0.15;
    if (interpolation > 1) interpolation = 1;

    draw();
    drawParticles();

    animationFrame = requestAnimationFrame(animate);
}

// Draw Game
function draw() {
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simplified grid (no shadow for better performance)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
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

    // Draw trail (no shadow for better performance)
    trail.forEach((t, index) => {
        const alpha = t.life;
        ctx.fillStyle = `rgba(${colors.trail.r}, ${colors.trail.g}, ${colors.trail.b}, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Update and remove old trail
    trail = trail.filter(t => {
        t.life -= 0.02;
        return t.life > 0;
    });

    // Limit trail array size for performance
    if (trail.length > 50) {
        trail = trail.slice(-50);
    }

    // Draw food with pulsating glow (optimized)
    const foodPulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    const foodSize = (gridSize / 2 - 2) * (1 + foodPulse * 0.2);
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;

    ctx.save();
    // Reduced shadowBlur for better performance
    ctx.shadowBlur = 20 * foodPulse;
    ctx.shadowColor = `rgb(${colors.food.r}, ${colors.food.g}, ${colors.food.b})`;

    // Simplified glow - single layer
    ctx.fillStyle = `rgb(${colors.food.r}, ${colors.food.g}, ${colors.food.b})`;
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

    // Draw snake with smooth interpolation and gradient
    snake.forEach((segment, index) => {
        const targetX = segment.x * gridSize;
        const targetY = segment.y * gridSize;

        let drawX = targetX;
        let drawY = targetY;

        // Smooth interpolation for movement
        if (index === 0 && snake.length > 1) {
            const prevSegment = snake[1];
            const prevX = prevSegment.x * gridSize;
            const prevY = prevSegment.y * gridSize;

            drawX = prevX + (targetX - prevX) * interpolation;
            drawY = prevY + (targetY - prevY) * interpolation;

            // Add trail for head (reduced frequency for performance)
            if (Math.random() < 0.15) {
                trail.push({
                    x: drawX + gridSize / 2,
                    y: drawY + gridSize / 2,
                    size: Math.random() * 3 + 2,
                    life: 1
                });
            }
        }

        // Calculate color gradient from head to tail
        const ratio = index / Math.max(snake.length - 1, 1);
        const r = Math.floor(colors.snakeHead.r + (colors.snakeBody.r - colors.snakeHead.r) * ratio);
        const g = Math.floor(colors.snakeHead.g + (colors.snakeBody.g - colors.snakeHead.g) * ratio);
        const b = Math.floor(colors.snakeHead.b + (colors.snakeBody.b - colors.snakeHead.b) * ratio);

        // Draw segment with optimized glow
        ctx.save();

        // Only add shadow to head for better performance
        if (index === 0) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        }

        // Solid color fill (no gradient for better performance)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
            drawX + 2,
            drawY + 2,
            gridSize - 4,
            gridSize - 4
        );

        // Add highlight for depth
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 - index * 0.01})`;
        ctx.fillRect(
            drawX + 3,
            drawY + 3,
            gridSize * 0.4,
            gridSize * 0.4
        );

        ctx.restore();
    });
}

// Draw Particles (optimized)
function drawParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    // Update and filter in one pass for better performance
    particles = particles.filter(particle => {
        particle.update();
        if (particle.life > 0) {
            particle.draw(particleCtx);
            return true;
        }
        return false;
    });

    // Limit total particles for consistent performance
    if (particles.length > 100) {
        particles = particles.slice(-100);
    }
}

// Create Food Particles (optimized count)
function createFoodParticles(x, y) {
    // Reduced particle count for better performance
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const color = `rgb(${colors.food.r}, ${colors.food.g}, ${colors.food.b})`;
        particles.push(new Particle(x, y, color));
    }

    // Add some cyan particles too
    for (let i = 0; i < 8; i++) {
        const color = `rgb(0, 255, 255)`;
        particles.push(new Particle(x, y, color));
    }
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
    if (animationFrame) cancelAnimationFrame(animationFrame);
    saveStats();

    // Create explosion effect
    const head = snake[0];
    for (let i = 0; i < 100; i++) {
        const color = Math.random() > 0.5 ? 'rgb(0, 255, 255)' : 'rgb(255, 0, 255)';
        particles.push(new Particle(
            head.x * gridSize + gridSize / 2,
            head.y * gridSize + gridSize / 2,
            color
        ));
    }

    // Continue animating particles
    const particleAnimation = () => {
        drawParticles();
        if (particles.length > 0) {
            requestAnimationFrame(particleAnimation);
        }
    };
    particleAnimation();

    setTimeout(() => {
        alert(`🎮 GAME OVER! 🎮\n\n✨ Punkte: ${score}\n🏆 Highscore: ${highscore}\n📊 Level: ${level}`);
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
    if (!gameRunning && e.key.startsWith('Arrow')) {
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            changeDirection({ x: 0, y: -1 });
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            changeDirection({ x: 0, y: 1 });
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            changeDirection({ x: -1, y: 0 });
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            changeDirection({ x: 1, y: 0 });
            break;
        case ' ':
            e.preventDefault();
            if (!gameRunning) {
                startGame();
            }
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
loadStats();
draw();
