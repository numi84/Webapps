// Canvas Setup
const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startBtn = document.getElementById('start-btn');
const scoreP1Element = document.getElementById('score-p1');
const scoreP2Element = document.getElementById('score-p2');
const gameMessage = document.getElementById('game-message');
const controlModeSelect = document.getElementById('control-mode');

// Game Constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 5;
const WINNING_SCORE = 10;

// Game State
let gameRunning = false;
let controlMode = 'arrows'; // 'arrows' or 'mouse'
let mouseY = canvas.height / 2;

// Game Objects
const paddle1 = {
    x: 30,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const paddle2 = {
    x: canvas.width - 30 - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
};

const score = {
    player1: 0,
    player2: 0
};

// Keyboard State
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// Event Listeners
startBtn.addEventListener('click', startGame);

controlModeSelect.addEventListener('change', (e) => {
    controlMode = e.target.value;
});

// Keyboard Events
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        keys.w = true;
        e.preventDefault();
    }
    if (e.key === 's' || e.key === 'S') {
        keys.s = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
        keys.ArrowUp = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
        keys.ArrowDown = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

// Mouse Events
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Game Functions
function startGame() {
    gameRunning = true;
    score.player1 = 0;
    score.player2 = 0;
    updateScore();
    hideMessage();
    resetBall();
    gameLoop();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    // Random angle between -45 and 45 degrees, converted to radians
    const angle = (Math.random() * 90 - 45) * Math.PI / 180;
    const direction = Math.random() < 0.5 ? 1 : -1;

    ball.speed = INITIAL_BALL_SPEED;
    ball.dx = Math.cos(angle) * ball.speed * direction;
    ball.dy = Math.sin(angle) * ball.speed;
}

function updatePaddles() {
    // Player 1 (WASD)
    if (keys.w) {
        paddle1.dy = -PADDLE_SPEED;
    } else if (keys.s) {
        paddle1.dy = PADDLE_SPEED;
    } else {
        paddle1.dy = 0;
    }

    // Player 2 (Arrows or Mouse)
    if (controlMode === 'arrows') {
        if (keys.ArrowUp) {
            paddle2.dy = -PADDLE_SPEED;
        } else if (keys.ArrowDown) {
            paddle2.dy = PADDLE_SPEED;
        } else {
            paddle2.dy = 0;
        }
    } else if (controlMode === 'mouse') {
        // Smooth mouse following
        const targetY = mouseY - paddle2.height / 2;
        const diff = targetY - paddle2.y;

        if (Math.abs(diff) > 2) {
            paddle2.dy = diff * 0.15;
        } else {
            paddle2.dy = 0;
        }
    }

    // Update paddle positions
    paddle1.y += paddle1.dy;
    paddle2.y += paddle2.dy;

    // Keep paddles in bounds
    paddle1.y = Math.max(0, Math.min(canvas.height - paddle1.height, paddle1.y));
    paddle2.y = Math.max(0, Math.min(canvas.height - paddle2.height, paddle2.y));
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (top and bottom)
    if (ball.y - ball.size / 2 <= 0 || ball.y + ball.size / 2 >= canvas.height) {
        ball.dy *= -1;
    }

    // Paddle 1 collision
    if (ball.x - ball.size / 2 <= paddle1.x + paddle1.width &&
        ball.x + ball.size / 2 >= paddle1.x &&
        ball.y >= paddle1.y &&
        ball.y <= paddle1.y + paddle1.height) {

        // Calculate hit position (-1 to 1, where 0 is center)
        const hitPos = (ball.y - (paddle1.y + paddle1.height / 2)) / (paddle1.height / 2);

        // Adjust angle based on hit position
        const angle = hitPos * (Math.PI / 4); // Max 45 degrees

        ball.speed += 0.2; // Increase speed slightly
        ball.dx = Math.cos(angle) * ball.speed;
        ball.dy = Math.sin(angle) * ball.speed;

        ball.x = paddle1.x + paddle1.width + ball.size / 2;
    }

    // Paddle 2 collision
    if (ball.x + ball.size / 2 >= paddle2.x &&
        ball.x - ball.size / 2 <= paddle2.x + paddle2.width &&
        ball.y >= paddle2.y &&
        ball.y <= paddle2.y + paddle2.height) {

        // Calculate hit position (-1 to 1, where 0 is center)
        const hitPos = (ball.y - (paddle2.y + paddle2.height / 2)) / (paddle2.height / 2);

        // Adjust angle based on hit position
        const angle = hitPos * (Math.PI / 4); // Max 45 degrees

        ball.speed += 0.2; // Increase speed slightly
        ball.dx = -Math.cos(angle) * ball.speed;
        ball.dy = Math.sin(angle) * ball.speed;

        ball.x = paddle2.x - ball.size / 2;
    }

    // Score detection
    if (ball.x - ball.size / 2 <= 0) {
        // Player 2 scores
        score.player2++;
        updateScore();
        checkWin();
        if (gameRunning) {
            setTimeout(resetBall, 1000);
        }
    } else if (ball.x + ball.size / 2 >= canvas.width) {
        // Player 1 scores
        score.player1++;
        updateScore();
        checkWin();
        if (gameRunning) {
            setTimeout(resetBall, 1000);
        }
    }
}

function checkWin() {
    if (score.player1 >= WINNING_SCORE) {
        gameRunning = false;
        showMessage('🎉 Spieler 1 gewinnt!');
    } else if (score.player2 >= WINNING_SCORE) {
        gameRunning = false;
        showMessage('🎉 Spieler 2 gewinnt!');
    }
}

function updateScore() {
    scoreP1Element.textContent = score.player1;
    scoreP2Element.textContent = score.player2;
}

function showMessage(msg) {
    gameMessage.textContent = msg;
    gameMessage.classList.remove('hidden');
}

function hideMessage() {
    gameMessage.classList.add('hidden');
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#667eea';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);

    ctx.fillStyle = '#764ba2';
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw control mode indicator for Player 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(
        controlMode === 'mouse' ? 'Maus-Modus' : 'Tastatur-Modus',
        canvas.width - 10,
        20
    );
    ctx.textAlign = 'left';
}

function gameLoop() {
    if (!gameRunning) return;

    updatePaddles();
    updateBall();
    draw();

    requestAnimationFrame(gameLoop);
}

// Initial draw
draw();
