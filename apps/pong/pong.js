// Canvas Setup
const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startBtn = document.getElementById('start-btn');
const scoreP1Element = document.getElementById('score-p1');
const scoreP2Element = document.getElementById('score-p2');
const seriesP1Element = document.getElementById('series-p1');
const seriesP2Element = document.getElementById('series-p2');
const gameMessage = document.getElementById('game-message');
const controlModeSelect = document.getElementById('control-mode');
const bestOfSelect = document.getElementById('best-of');
const sideSelectionSelect = document.getElementById('side-selection');
const leftPlayerLabel = document.getElementById('left-player-label');
const rightPlayerLabel = document.getElementById('right-player-label');
const leftPlayerControls = document.getElementById('left-player-controls');
const rightPlayerControls = document.getElementById('right-player-controls');
const countdownElement = document.getElementById('countdown');

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
let bestOf = 10; // Number of games in the series
let player1Side = 'left'; // 'left' or 'right'
let seriesScore = {
    player1: 0,
    player2: 0
};

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

bestOfSelect.addEventListener('change', (e) => {
    bestOf = parseInt(e.target.value);
});

sideSelectionSelect.addEventListener('change', (e) => {
    player1Side = e.target.value;
    updatePlayerLabels();
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
    score.player1 = 0;
    score.player2 = 0;
    seriesScore.player1 = 0;
    seriesScore.player2 = 0;
    bestOf = parseInt(bestOfSelect.value);
    player1Side = sideSelectionSelect.value;
    updateScore();
    updateSeriesScore();
    updatePlayerLabels();
    hideMessage();

    // Hide start button
    startBtn.classList.add('hidden');

    // Start countdown
    startCountdown();
}

function startCountdown() {
    let count = 3;

    const showCount = () => {
        if (count > 0) {
            countdownElement.textContent = count;
            countdownElement.classList.remove('hidden');

            // Remove and re-add animation
            countdownElement.style.animation = 'none';
            setTimeout(() => {
                countdownElement.style.animation = 'countdownPulse 1s ease-in-out';
            }, 10);

            count--;
            setTimeout(showCount, 1000);
        } else {
            countdownElement.classList.add('hidden');
            resetBall();
            gameRunning = true;
            gameLoop();
        }
    };

    showCount();
}

function updatePlayerLabels() {
    if (player1Side === 'left') {
        leftPlayerLabel.textContent = 'Spieler 1 (Links)';
        rightPlayerLabel.textContent = 'Spieler 2 (Rechts)';
        leftPlayerControls.textContent = 'W - Hoch | S - Runter';
        rightPlayerControls.innerHTML = `
            <select id="control-mode" class="control-select">
                <option value="arrows" ${controlMode === 'arrows' ? 'selected' : ''}>Pfeiltasten (↑/↓)</option>
                <option value="mouse" ${controlMode === 'mouse' ? 'selected' : ''}>Maus</option>
            </select>
        `;
    } else {
        leftPlayerLabel.textContent = 'Spieler 2 (Links)';
        rightPlayerLabel.textContent = 'Spieler 1 (Rechts)';
        rightPlayerControls.textContent = 'W - Hoch | S - Runter';
        leftPlayerControls.innerHTML = `
            <select id="control-mode" class="control-select">
                <option value="arrows" ${controlMode === 'arrows' ? 'selected' : ''}>Pfeiltasten (↑/↓)</option>
                <option value="mouse" ${controlMode === 'mouse' ? 'selected' : ''}>Maus</option>
            </select>
        `;
    }

    // Re-attach event listener to the new control mode select
    const newControlModeSelect = document.getElementById('control-mode');
    if (newControlModeSelect) {
        newControlModeSelect.addEventListener('change', (e) => {
            controlMode = e.target.value;
        });
        controlMode = newControlModeSelect.value;
    }
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
    // Determine which paddle each player controls based on side selection
    const player1Paddle = player1Side === 'left' ? paddle1 : paddle2;
    const player2Paddle = player1Side === 'left' ? paddle2 : paddle1;

    // Player 1 (WASD) controls their assigned paddle
    if (keys.w) {
        player1Paddle.dy = -PADDLE_SPEED;
    } else if (keys.s) {
        player1Paddle.dy = PADDLE_SPEED;
    } else {
        player1Paddle.dy = 0;
    }

    // Player 2 (Arrows or Mouse) controls their assigned paddle
    if (controlMode === 'arrows') {
        if (keys.ArrowUp) {
            player2Paddle.dy = -PADDLE_SPEED;
        } else if (keys.ArrowDown) {
            player2Paddle.dy = PADDLE_SPEED;
        } else {
            player2Paddle.dy = 0;
        }
    } else if (controlMode === 'mouse') {
        // Smooth mouse following
        const targetY = mouseY - player2Paddle.height / 2;
        const diff = targetY - player2Paddle.y;

        if (Math.abs(diff) > 2) {
            player2Paddle.dy = diff * 0.15;
        } else {
            player2Paddle.dy = 0;
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
        // Player 1 wins this game
        seriesScore.player1++;
        updateSeriesScore();

        const gamesNeededToWin = Math.ceil(bestOf / 2);

        if (seriesScore.player1 >= gamesNeededToWin) {
            // Player 1 wins the series
            gameRunning = false;
            showMessage(`🎉 Spieler 1 gewinnt die Serie! (${seriesScore.player1}-${seriesScore.player2})`);
            // Show start button again
            startBtn.classList.remove('hidden');
        } else {
            // Continue to next game
            gameRunning = false;
            const gamesPlayed = seriesScore.player1 + seriesScore.player2;
            showMessage(`Spieler 1 gewinnt Spiel ${gamesPlayed}! Serie: ${seriesScore.player1}-${seriesScore.player2}`);
            setTimeout(() => {
                startNextGame();
            }, 2500);
        }
    } else if (score.player2 >= WINNING_SCORE) {
        // Player 2 wins this game
        seriesScore.player2++;
        updateSeriesScore();

        const gamesNeededToWin = Math.ceil(bestOf / 2);

        if (seriesScore.player2 >= gamesNeededToWin) {
            // Player 2 wins the series
            gameRunning = false;
            showMessage(`🎉 Spieler 2 gewinnt die Serie! (${seriesScore.player1}-${seriesScore.player2})`);
            // Show start button again
            startBtn.classList.remove('hidden');
        } else {
            // Continue to next game
            gameRunning = false;
            const gamesPlayed = seriesScore.player1 + seriesScore.player2;
            showMessage(`Spieler 2 gewinnt Spiel ${gamesPlayed}! Serie: ${seriesScore.player1}-${seriesScore.player2}`);
            setTimeout(() => {
                startNextGame();
            }, 2500);
        }
    }
}

function startNextGame() {
    score.player1 = 0;
    score.player2 = 0;
    updateScore();
    hideMessage();
    startCountdown();
}

function updateScore() {
    scoreP1Element.textContent = score.player1;
    scoreP2Element.textContent = score.player2;
}

function updateSeriesScore() {
    seriesP1Element.textContent = seriesScore.player1;
    seriesP2Element.textContent = seriesScore.player2;
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
