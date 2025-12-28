// Game State
let gameState = {
    pairs: 6,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    gameStarted: false,
    canFlip: true
};

// Card symbols
const symbols = ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍', '🥥', '🥭'];

// DOM Elements
let gameBoard;
let movesEl;
let pairsEl;
let timerEl;
let newGameBtn;
let winMessage;
let difficultyButtons;

// Initialize Game
function initGame() {
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.timer = 0;
    gameState.gameStarted = false;
    gameState.canFlip = true;

    clearInterval(gameState.timerInterval);

    createCards();
    renderBoard();
    updateDisplay();
    hideWinMessage();
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Create Cards
function createCards() {
    const selectedSymbols = symbols.slice(0, gameState.pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];

    // Shuffle cards using Fisher-Yates algorithm for uniform randomness
    const shuffled = shuffleArray(cardPairs);
    gameState.cards = shuffled.map((symbol, index) => ({ symbol, id: index }));
}

// Render Board
function renderBoard() {
    gameBoard.innerHTML = '';

    // Set grid columns based on number of pairs
    const cols = gameState.pairs <= 6 ? 4 : gameState.pairs <= 8 ? 4 : 6;
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';

        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = card.symbol;

        cardElement.appendChild(cardBack);
        cardElement.appendChild(cardFront);

        cardElement.addEventListener('click', () => flipCard(index));

        gameBoard.appendChild(cardElement);
    });
}

// Flip Card
function flipCard(index) {
    if (!gameState.canFlip) return;

    const card = gameState.cards[index];
    const cardElement = document.querySelector(`[data-index="${index}"]`);

    // Can't flip if already flipped or matched
    if (cardElement.classList.contains('flipped') ||
        cardElement.classList.contains('matched')) {
        return;
    }

    // Start timer on first flip
    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }

    // Flip card
    cardElement.classList.add('flipped');
    gameState.flippedCards.push({ index, symbol: card.symbol });

    // Check for match when two cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateDisplay();
        checkMatch();
    }
}

// Check Match
function checkMatch() {
    gameState.canFlip = false;

    const [card1, card2] = gameState.flippedCards;

    setTimeout(() => {
        const element1 = document.querySelector(`[data-index="${card1.index}"]`);
        const element2 = document.querySelector(`[data-index="${card2.index}"]`);

        if (card1.symbol === card2.symbol) {
            // Match!
            element1.classList.add('matched');
            element2.classList.add('matched');
            gameState.matchedPairs++;

            pairsEl.textContent = gameState.matchedPairs;

            // Check win
            if (gameState.matchedPairs === gameState.pairs) {
                winGame();
            }
        } else {
            // No match, flip back
            element1.classList.remove('flipped');
            element2.classList.remove('flipped');
        }

        gameState.flippedCards = [];
        gameState.canFlip = true;
    }, 800);
}

// Win Game
function winGame() {
    clearInterval(gameState.timerInterval);
    showWinMessage();

    // Win message is already visible in HTML - no blocking alert needed
    // setTimeout(() => {
    //     alert(`Glückwunsch!\n\nZüge: ${gameState.moves}\nZeit: ${gameState.timer}s`);
    // }, 500);
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
    pairsEl.textContent = `${gameState.matchedPairs}/${gameState.pairs}`;
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
    gameBoard = document.getElementById('game-board');
    movesEl = document.getElementById('moves');
    pairsEl = document.getElementById('pairs');
    timerEl = document.getElementById('timer');
    newGameBtn = document.getElementById('new-game-btn');
    winMessage = document.getElementById('win-message');
    difficultyButtons = document.querySelectorAll('.diff-btn');

    // Event Listeners
    newGameBtn.addEventListener('click', initGame);

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            gameState.pairs = parseInt(btn.dataset.pairs);
            initGame();
        });
    });

    // Initialize game
    initGame();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
