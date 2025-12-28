// Game State
let gameState = {
    size: 3,
    tiles: [],
    emptyIndex: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    gameStarted: false
};

// DOM Elements
let puzzleBoard;
let movesEl;
let timerEl;
let shuffleBtn;
let winMessage;
let difficultyButtons;

// Initialize Game
function initGame() {
    const totalTiles = gameState.size * gameState.size;
    gameState.tiles = Array.from({ length: totalTiles }, (_, i) => i);
    gameState.emptyIndex = totalTiles - 1;
    gameState.moves = 0;
    gameState.timer = 0;
    gameState.gameStarted = false;

    clearInterval(gameState.timerInterval);

    renderBoard();
    updateDisplay();
    hideWinMessage();
}

// Render Board
function renderBoard() {
    puzzleBoard.innerHTML = '';
    puzzleBoard.style.gridTemplateColumns = `repeat(${gameState.size}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${gameState.size}, 1fr)`;

    gameState.tiles.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = 'tile';

        if (value === gameState.tiles[gameState.emptyIndex]) {
            tile.classList.add('empty');
        } else {
            tile.textContent = value + 1;
            tile.addEventListener('click', () => moveTile(index));
        }

        puzzleBoard.appendChild(tile);
    });
}

// Check if tile can move
function canMove(index) {
    const row = Math.floor(index / gameState.size);
    const col = index % gameState.size;
    const emptyRow = Math.floor(gameState.emptyIndex / gameState.size);
    const emptyCol = gameState.emptyIndex % gameState.size;

    // Check if adjacent (same row or column, distance of 1)
    return (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
           (col === emptyCol && Math.abs(row - emptyRow) === 1);
}

// Move Tile
function moveTile(index) {
    if (!canMove(index)) return;

    // Start timer on first move
    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }

    // Swap tiles
    [gameState.tiles[index], gameState.tiles[gameState.emptyIndex]] =
        [gameState.tiles[gameState.emptyIndex], gameState.tiles[index]];

    gameState.emptyIndex = index;
    gameState.moves++;

    renderBoard();
    updateDisplay();

    // Check win
    if (checkWin()) {
        winGame();
    }
}

// Shuffle Board
function shuffle() {
    // Reset game
    initGame();

    // Perform random valid moves
    const shuffleMoves = gameState.size * gameState.size * 50;

    for (let i = 0; i < shuffleMoves; i++) {
        const validMoves = getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

        // Swap without updating UI
        [gameState.tiles[randomMove], gameState.tiles[gameState.emptyIndex]] =
            [gameState.tiles[gameState.emptyIndex], gameState.tiles[randomMove]];
        gameState.emptyIndex = randomMove;
    }

    gameState.moves = 0;
    renderBoard();
    updateDisplay();
}

// Get Valid Moves
function getValidMoves() {
    const moves = [];
    for (let i = 0; i < gameState.tiles.length; i++) {
        if (canMove(i)) {
            moves.push(i);
        }
    }
    return moves;
}

// Check Win
function checkWin() {
    for (let i = 0; i < gameState.tiles.length - 1; i++) {
        if (gameState.tiles[i] !== i) {
            return false;
        }
    }
    return true;
}

// Win Game
function winGame() {
    clearInterval(gameState.timerInterval);
    showWinMessage();

    // Win message is already visible in HTML - no blocking alert needed
    // setTimeout(() => {
    //     alert(`Glückwunsch!\n\nZüge: ${gameState.moves}\nZeit: ${gameState.timer}s`);
    // }, 300);
}

// Show/Hide Win Message
function showWinMessage() {
    winMessage.classList.remove('hidden');
}

function hideWinMessage() {
    winMessage.classList.add('hidden');
}

// Update Display
function updateDisplay() {
    movesEl.textContent = gameState.moves;
    timerEl.textContent = `${gameState.timer}s`;
}

// Start Timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateDisplay();
    }, 1000);
}

// Initialize Application
function init() {
    // Get DOM Elements
    puzzleBoard = document.getElementById('puzzle-board');
    movesEl = document.getElementById('moves');
    timerEl = document.getElementById('timer');
    shuffleBtn = document.getElementById('shuffle-btn');
    winMessage = document.getElementById('win-message');
    difficultyButtons = document.querySelectorAll('.diff-btn');

    // Event Listeners
    shuffleBtn.addEventListener('click', shuffle);

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            gameState.size = parseInt(btn.dataset.size);
            initGame();
        });
    });

    // Initialize game
    initGame();
    shuffle();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
