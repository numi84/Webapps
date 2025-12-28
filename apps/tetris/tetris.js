// Canvas Setup
let canvas;
let ctx;
let nextCanvas;
let nextCtx;

const blockSize = 30;
const cols = 10;
const rows = 20;

// Tetrominos
const tetrominos = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

const colors = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

// Game State
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let gameRunning = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationFrameId = null;

// DOM Elements
let scoreEl;
let levelEl;
let linesEl;
let startBtn;
let controlButtons;

// Initialize Board
function createBoard() {
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
}

// Create Piece
function createPiece() {
    const types = Object.keys(tetrominos);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        type: type,
        shape: tetrominos[type],
        color: colors[type],
        x: Math.floor(cols / 2) - Math.floor(tetrominos[type][0].length / 2),
        y: 0
    };
}

// Draw Block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

// Draw Board
function drawBoard() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(x, y, value);
            }
        });
    });
}

// Draw Piece
function drawPiece(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x, piece.y + y, piece.color);
            }
        });
    });
}

// Draw Next Piece
function drawNextPiece() {
    nextCtx.fillStyle = '#f5f5f5';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);

        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(
                        (offsetX + x) * blockSize,
                        (offsetY + y) * blockSize,
                        blockSize,
                        blockSize
                    );
                    nextCtx.strokeStyle = '#000';
                    nextCtx.strokeRect(
                        (offsetX + x) * blockSize,
                        (offsetY + y) * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            });
        });
    }
}

// Check Collision
function collides(piece, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                if (newX < 0 || newX >= cols || newY >= rows) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge Piece to Board
function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        });
    });
}

// Rotate Piece
function rotate(piece) {
    const newShape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: newShape };
}

// Move Piece
function move(direction) {
    if (!gameRunning) return;

    if (direction === 'left' && !collides(currentPiece, -1, 0)) {
        currentPiece.x--;
    } else if (direction === 'right' && !collides(currentPiece, 1, 0)) {
        currentPiece.x++;
    } else if (direction === 'down') {
        drop();
    } else if (direction === 'rotate') {
        const rotated = rotate(currentPiece);
        if (!collides(rotated)) {
            currentPiece = rotated;
        }
    } else if (direction === 'drop') {
        while (!collides(currentPiece, 0, 1)) {
            currentPiece.y++;
        }
        drop();
    }

    draw();
}

// Drop Piece
function drop() {
    if (collides(currentPiece, 0, 1)) {
        merge();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();

        if (collides(currentPiece)) {
            gameOver();
        }
    } else {
        currentPiece.y++;
    }
}

// Clear Lines
function clearLines() {
    let linesCleared = 0;

    for (let y = rows - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(cols).fill(0));
            linesCleared++;
            y++; // Recheck this row
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        score += ([0, 40, 100, 300, 1200][linesCleared] || 0) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);

        updateDisplay();
    }
}

// Update Display
function updateDisplay() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
}

// Draw
function draw() {
    drawBoard();
    if (currentPiece) {
        drawPiece(currentPiece);
    }
}

// Game Loop
function update(time = 0) {
    if (!gameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }

    draw();
    animationFrameId = requestAnimationFrame(update);
}

// Start Game
function startGame() {
    createBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropCounter = 0;
    dropInterval = 1000;
    lastTime = 0;

    currentPiece = createPiece();
    nextPiece = createPiece();

    gameRunning = true;

    updateDisplay();
    drawNextPiece();
    requestAnimationFrame(update);
}

// Game Over
function gameOver() {
    gameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Game over state is clear from the stopped game - no blocking alert needed
    // setTimeout(() => {
    //     alert(`Game Over!\n\nPunkte: ${score}\nLevel: ${level}\nReihen: ${lines}`);
    // }, 100);
}

// Initialize Application
function init() {
    // Get DOM Elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    scoreEl = document.getElementById('score');
    levelEl = document.getElementById('level');
    linesEl = document.getElementById('lines');
    startBtn = document.getElementById('start-btn');
    controlButtons = document.querySelectorAll('.control-btn');

    // Set canvas sizes
    canvas.width = cols * blockSize;
    canvas.height = rows * blockSize;
    nextCanvas.width = 4 * blockSize;
    nextCanvas.height = 4 * blockSize;

    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                move('right');
                break;
            case 'ArrowDown':
                e.preventDefault();
                move('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                move('rotate');
                break;
            case ' ':
                e.preventDefault();
                move('drop');
                break;
        }
    });

    // Button Controls
    controlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            move(btn.dataset.action);
        });
    });

    // Start Button
    startBtn.addEventListener('click', startGame);

    // Initialize game
    drawBoard();
    drawNextPiece();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
