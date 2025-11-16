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
const gameBoard = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const winMessage = document.getElementById('win-message');
const difficultyButtons = document.querySelectorAll('.diff-btn');

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

// Create Cards
function createCards() {
    const selectedSymbols = symbols.slice(0, gameState.pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];

    // Shuffle cards
    gameState.cards = cardPairs
        .map((symbol, index) => ({ symbol, id: index }))
        .sort(() => Math.random() - 0.5);
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

    setTimeout(() => {
        alert(`Glückwunsch!\n\nZüge: ${gameState.moves}\nZeit: ${gameState.timer}s`);
    }, 500);
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

// Initialize
initGame();
