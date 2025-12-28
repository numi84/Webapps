// State
let currentOperand = '0';
let previousOperand = '';
let operation = null;

// DOM Elements
let currentOperandEl;
let previousOperandEl;
let numberButtons;
let operatorButtons;
let equalsButton;
let clearButton;
let deleteButton;
let percentButton;

// Append Number
function appendNumber(number) {
    if (number === '.' && currentOperand.includes('.')) return;

    if (currentOperand === '0') {
        currentOperand = number === '.' ? '0.' : number;
    } else {
        currentOperand += number;
    }

    updateDisplay();
}

// Choose Operation
function chooseOperation(operator) {
    if (currentOperand === '') return;

    if (previousOperand !== '') {
        calculate();
    }

    operation = operator;
    previousOperand = currentOperand;
    currentOperand = '';
    updateDisplay();
}

// Calculate
function calculate() {
    let result;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                alert('Division durch Null nicht möglich!');
                clear();
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }

    // Check for Infinity or NaN
    if (!isFinite(result) || isNaN(result)) {
        alert('Fehler: Ergebnis ist zu groß oder ungültig!');
        clear();
        return;
    }

    currentOperand = result.toString();
    operation = null;
    previousOperand = '';
    updateDisplay();
}

// Clear
function clear() {
    currentOperand = '0';
    previousOperand = '';
    operation = null;
    updateDisplay();
}

// Delete
function deleteNumber() {
    if (currentOperand.length === 1) {
        currentOperand = '0';
    } else {
        currentOperand = currentOperand.slice(0, -1);
    }
    updateDisplay();
}

// Percent
function percent() {
    const current = parseFloat(currentOperand);
    if (isNaN(current)) return;

    // If there's a pending operation, calculate percentage of previous operand
    if (operation && previousOperand) {
        const prev = parseFloat(previousOperand);
        currentOperand = (prev * current / 100).toString();
    } else {
        currentOperand = (current / 100).toString();
    }
    updateDisplay();
}

// Update Display
function updateDisplay() {
    currentOperandEl.textContent = currentOperand;

    if (operation != null) {
        previousOperandEl.textContent = `${previousOperand} ${getOperatorSymbol(operation)}`;
    } else {
        previousOperandEl.textContent = '';
    }
}

// Get Operator Symbol
function getOperatorSymbol(op) {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
        default: return '';
    }
}

// Initialize
function init() {
    // Get DOM Elements
    currentOperandEl = document.getElementById('current-operand');
    previousOperandEl = document.getElementById('previous-operand');
    numberButtons = document.querySelectorAll('[data-number]');
    operatorButtons = document.querySelectorAll('[data-operator]');
    equalsButton = document.querySelector('[data-action="equals"]');
    clearButton = document.querySelector('[data-action="clear"]');
    deleteButton = document.querySelector('[data-action="delete"]');
    percentButton = document.querySelector('[data-action="percent"]');

    // Event Listeners
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            appendNumber(button.dataset.number);
        });
    });

    operatorButtons.forEach(button => {
        button.addEventListener('click', () => {
            chooseOperation(button.dataset.operator);
        });
    });

    equalsButton.addEventListener('click', calculate);
    clearButton.addEventListener('click', clear);
    deleteButton.addEventListener('click', deleteNumber);
    percentButton.addEventListener('click', percent);

    // Keyboard Support
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            appendNumber(e.key);
        } else if (e.key === '.') {
            appendNumber('.');
        } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            chooseOperation(e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            calculate();
        } else if (e.key === 'Escape') {
            clear();
        } else if (e.key === 'Backspace') {
            deleteNumber();
        } else if (e.key === '%') {
            percent();
        }
    });

    // Initialize display
    updateDisplay();
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', init);
