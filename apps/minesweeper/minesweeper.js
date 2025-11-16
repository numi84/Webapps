// Game State
let gameState = {
    board: [],
    rows: 8,
    cols: 8,
    mines: 10,
    flags: 0,
    revealed: 0,
    gameOver: false,
    gameWon: false,
    firstClick: true,
    timer: 0,
    timerInterval: null
};

// Difficulty Settings
const difficulties = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 20 },
    hard: { rows: 16, cols: 16, mines: 40 }
};

// DOM Elements
const gameBoard = document.getElementById('game-board');
const minesCount = document.getElementById('mines-count');
const flagsCount = document.getElementById('flags-count');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');
const gameMessage = document.getElementById('game-message');
const difficultyButtons = document.querySelectorAll('.diff-btn');

// Initialize Game
function initGame() {
    gameState.board = [];
    gameState.flags = 0;
    gameState.revealed = 0;
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.firstClick = true;
    gameState.timer = 0;

    clearInterval(gameState.timerInterval);
    timerDisplay.textContent = '0s';

    createBoard();
    renderBoard();
    updateDisplay();
    hideMessage();
}

// Create Board
function createBoard() {
    for (let row = 0; row < gameState.rows; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < gameState.cols; col++) {
            gameState.board[row][col] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
}

// Place Mines (after first click to avoid instant loss)
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;

    while (minesPlaced < gameState.mines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);

        // Don't place mine on first click or adjacent cells
        if (!gameState.board[row][col].isMine &&
            !isAdjacent(row, col, firstRow, firstCol) &&
            !(row === firstRow && col === firstCol)) {
            gameState.board[row][col].isMine = true;
            minesPlaced++;
        }
    }

    calculateNeighborMines();
}

// Check if cell is adjacent to first click
function isAdjacent(row, col, firstRow, firstCol) {
    return Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
}

// Calculate Neighbor Mines
function calculateNeighborMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (!gameState.board[row][col].isMine) {
                let count = 0;

                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;

                        const newRow = row + dr;
                        const newCol = col + dc;

                        if (isValidCell(newRow, newCol) &&
                            gameState.board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }

                gameState.board[row][col].neighborMines = count;
            }
        }
    }
}

// Check if cell is valid
function isValidCell(row, col) {
    return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

// Render Board
function renderBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${gameState.cols}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${gameState.rows}, 30px)`;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.addEventListener('click', () => handleLeftClick(row, col));
            cell.addEventListener('contextmenu', (e) => handleRightClick(e, row, col));

            gameBoard.appendChild(cell);
        }
    }
}

// Update Cell Display
function updateCell(row, col) {
    const cellData = gameState.board[row][col];
    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

    if (cellData.isFlagged) {
        cellElement.classList.add('flagged');
        cellElement.textContent = '🚩';
    } else {
        cellElement.classList.remove('flagged');
        cellElement.textContent = '';
    }

    if (cellData.isRevealed) {
        cellElement.classList.add('revealed');

        if (cellData.isMine) {
            cellElement.classList.add('mine');
            cellElement.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
            cellElement.textContent = cellData.neighborMines;
            cellElement.dataset.count = cellData.neighborMines;
        }
    }
}

// Handle Left Click
function handleLeftClick(row, col) {
    if (gameState.gameOver || gameState.gameWon) return;

    const cell = gameState.board[row][col];

    if (cell.isFlagged || cell.isRevealed) return;

    // Place mines on first click
    if (gameState.firstClick) {
        placeMines(row, col);
        gameState.firstClick = false;
        startTimer();
    }

    revealCell(row, col);
}

// Handle Right Click (Flag)
function handleRightClick(e, row, col) {
    e.preventDefault();

    if (gameState.gameOver || gameState.gameWon) return;

    const cell = gameState.board[row][col];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;

    if (cell.isFlagged) {
        gameState.flags++;
    } else {
        gameState.flags--;
    }

    updateCell(row, col);
    updateDisplay();
}

// Reveal Cell
function revealCell(row, col) {
    if (!isValidCell(row, col)) return;

    const cell = gameState.board[row][col];

    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    gameState.revealed++;
    updateCell(row, col);

    // Hit a mine
    if (cell.isMine) {
        gameOver(false);
        return;
    }

    // Auto-reveal adjacent cells if no neighboring mines
    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                revealCell(row + dr, col + dc);
            }
        }
    }

    // Check for win
    checkWin();
}

// Check Win Condition
function checkWin() {
    const totalCells = gameState.rows * gameState.cols;
    const safeCells = totalCells - gameState.mines;

    if (gameState.revealed === safeCells) {
        gameOver(true);
    }
}

// Game Over
function gameOver(won) {
    gameState.gameOver = true;
    gameState.gameWon = won;

    clearInterval(gameState.timerInterval);

    // Reveal all mines
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].isMine) {
                gameState.board[row][col].isRevealed = true;
                updateCell(row, col);
            }
        }
    }

    showMessage(won);
}

// Show Message
function showMessage(won) {
    gameMessage.classList.remove('hidden', 'win', 'lose');

    if (won) {
        gameMessage.classList.add('win');
        gameMessage.textContent = `🎉 Gewonnen! Zeit: ${gameState.timer}s`;
    } else {
        gameMessage.classList.add('lose');
        gameMessage.textContent = '💥 Verloren! Versuch es nochmal!';
    }
}

// Hide Message
function hideMessage() {
    gameMessage.classList.add('hidden');
}

// Update Display
function updateDisplay() {
    minesCount.textContent = gameState.mines;
    flagsCount.textContent = gameState.flags;
}

// Start Timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        timerDisplay.textContent = `${gameState.timer}s`;
    }, 1000);
}

// Reset Game
resetBtn.addEventListener('click', initGame);

// Difficulty Selection
difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set difficulty
        const difficulty = btn.dataset.difficulty;
        gameState.rows = difficulties[difficulty].rows;
        gameState.cols = difficulties[difficulty].cols;
        gameState.mines = difficulties[difficulty].mines;

        // Start new game
        initGame();
    });
});

// Initialize game on load
initGame();
