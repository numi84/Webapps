// Game State
let gameState = {
    dice: [0, 0, 0, 0, 0],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    scores: {},
    usedCategories: new Set(),
    gameOver: false
};

// DOM Elements
const diceElements = document.querySelectorAll('.dice');
const rollBtn = document.getElementById('roll-btn');
const rollsLeftEl = document.getElementById('rolls-left');
const totalScoreEl = document.getElementById('total-score');
const bonusScoreEl = document.getElementById('bonus-score');
const newGameBtn = document.getElementById('new-game-btn');
const scoreRows = document.querySelectorAll('.score-row[data-category]');

// Initialize Game
function initGame() {
    gameState = {
        dice: [0, 0, 0, 0, 0],
        held: [false, false, false, false, false],
        rollsLeft: 3,
        scores: {},
        usedCategories: new Set(),
        gameOver: false
    };

    updateDisplay();
    resetScorecard();
    rollBtn.disabled = false;
}

// Roll Dice
function rollDice() {
    if (gameState.rollsLeft === 0) return;

    gameState.dice = gameState.dice.map((value, index) => {
        if (gameState.held[index]) return value;
        return Math.floor(Math.random() * 6) + 1;
    });

    gameState.rollsLeft--;

    // Animate dice
    diceElements.forEach((diceEl, index) => {
        if (!gameState.held[index]) {
            diceEl.classList.add('rolling');
            setTimeout(() => {
                diceEl.classList.remove('rolling');
            }, 500);
        }
    });

    updateDisplay();
    updateScorePossibilities();
}

// Toggle Hold
function toggleHold(index) {
    if (gameState.dice[index] === 0) return;
    gameState.held[index] = !gameState.held[index];
    updateDisplay();
}

// Calculate Score for Category
function calculateScore(category, dice) {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // counts[i] = how many dice show value i
    dice.forEach(value => counts[value]++);

    const sum = dice.reduce((a, b) => a + b, 0);

    switch (category) {
        case 'ones': return counts[1] * 1;
        case 'twos': return counts[2] * 2;
        case 'threes': return counts[3] * 3;
        case 'fours': return counts[4] * 4;
        case 'fives': return counts[5] * 5;
        case 'sixes': return counts[6] * 6;

        case 'threeOfKind':
            return counts.some(c => c >= 3) ? sum : 0;

        case 'fourOfKind':
            return counts.some(c => c >= 4) ? sum : 0;

        case 'fullHouse':
            const hasThree = counts.some(c => c === 3);
            const hasTwo = counts.some(c => c === 2);
            return (hasThree && hasTwo) ? 25 : 0;

        case 'smallStraight':
            const smallStraights = [
                [1, 2, 3, 4],
                [2, 3, 4, 5],
                [3, 4, 5, 6]
            ];
            return smallStraights.some(straight =>
                straight.every(num => counts[num] > 0)
            ) ? 30 : 0;

        case 'largeStraight':
            const largeStraights = [
                [1, 2, 3, 4, 5],
                [2, 3, 4, 5, 6]
            ];
            return largeStraights.some(straight =>
                straight.every(num => counts[num] > 0)
            ) ? 40 : 0;

        case 'yatzy':
            return counts.some(c => c === 5) ? 50 : 0;

        case 'chance':
            return sum;

        default:
            return 0;
    }
}

// Select Category
function selectCategory(category) {
    if (gameState.usedCategories.has(category)) return;
    if (gameState.dice.every(d => d === 0)) return;

    const score = calculateScore(category, gameState.dice);
    gameState.scores[category] = score;
    gameState.usedCategories.add(category);

    // Mark row as used
    const row = document.querySelector(`[data-category="${category}"]`);
    row.classList.add('used');
    row.querySelector('.category-score').textContent = score;

    // Reset for next turn
    gameState.dice = [0, 0, 0, 0, 0];
    gameState.held = [false, false, false, false, false];
    gameState.rollsLeft = 3;

    updateDisplay();
    updateTotalScore();

    // Check if game is over
    if (gameState.usedCategories.size === 13) {
        endGame();
    }
}

// Update Score Possibilities
function updateScorePossibilities() {
    if (gameState.dice.every(d => d === 0)) return;

    scoreRows.forEach(row => {
        const category = row.dataset.category;
        if (!gameState.usedCategories.has(category)) {
            const score = calculateScore(category, gameState.dice);
            row.querySelector('.category-score').textContent = score;
            row.querySelector('.select-btn').disabled = false;
        }
    });
}

// Update Total Score
function updateTotalScore() {
    // Calculate upper section
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const upperSum = upperCategories.reduce((sum, cat) => {
        return sum + (gameState.scores[cat] || 0);
    }, 0);

    // Bonus if upper section >= 63
    const bonus = upperSum >= 63 ? 35 : 0;
    bonusScoreEl.textContent = bonus;

    // Calculate total
    const total = Object.values(gameState.scores).reduce((a, b) => a + b, 0) + bonus;
    totalScoreEl.textContent = total;
}

// Update Display
function updateDisplay() {
    // Update dice
    diceElements.forEach((diceEl, index) => {
        const valueEl = diceEl.querySelector('.dice-value');
        const holdBtn = diceEl.querySelector('.hold-btn');

        if (gameState.dice[index] === 0) {
            valueEl.textContent = '?';
            diceEl.classList.remove('held');
            holdBtn.disabled = true;
        } else {
            valueEl.textContent = gameState.dice[index];
            diceEl.classList.toggle('held', gameState.held[index]);
            holdBtn.disabled = false;
            holdBtn.textContent = gameState.held[index] ? 'Freigeben' : 'Halten';
        }
    });

    // Update rolls left
    rollsLeftEl.textContent = gameState.rollsLeft;
    rollBtn.disabled = gameState.rollsLeft === 0;
}

// Reset Scorecard
function resetScorecard() {
    scoreRows.forEach(row => {
        row.classList.remove('used');
        row.querySelector('.category-score').textContent = '-';
        row.querySelector('.select-btn').disabled = true;
    });
    bonusScoreEl.textContent = '0';
    totalScoreEl.textContent = '0';
}

// End Game
function endGame() {
    gameState.gameOver = true;
    rollBtn.disabled = true;

    const total = parseInt(totalScoreEl.textContent);
    setTimeout(() => {
        alert(`Spiel beendet!\n\nDeine Gesamtpunktzahl: ${total} Punkte\n\nGut gespielt!`);
    }, 300);
}

// Event Listeners
rollBtn.addEventListener('click', rollDice);

diceElements.forEach((diceEl, index) => {
    const holdBtn = diceEl.querySelector('.hold-btn');
    holdBtn.addEventListener('click', () => toggleHold(index));
});

scoreRows.forEach(row => {
    const selectBtn = row.querySelector('.select-btn');
    const category = row.dataset.category;
    selectBtn.addEventListener('click', () => selectCategory(category));
});

newGameBtn.addEventListener('click', initGame);

// Initialize
initGame();
