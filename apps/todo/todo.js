// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
let todoInput;
let addBtn;
let todoList;
let totalCountEl;
let activeCountEl;
let completedCountEl;
let filterButtons;
let clearCompletedBtn;
let clearAllBtn;
let exportBtn;
let importBtn;
let importFileInput;

// Load todos from LocalStorage
function loadTodos() {
    try {
        const stored = localStorage.getItem('todos');
        if (stored) {
            todos = JSON.parse(stored);
        }
    } catch (error) {
        console.error('localStorage read error:', error);
        // Fallback auf leeres Array (todos bleibt [])
    }
}

// Save todos to LocalStorage
function saveTodos() {
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
        console.error('localStorage write error:', error);
        // Todos werden nicht persistiert, aber App funktioniert weiter
    }
}

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todo = {
        id: Date.now() + Math.random(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString('de-DE')
    };

    todos.push(todo);
    saveTodos();
    todoInput.value = '';
    renderTodos();
}

// Toggle Todo
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// Delete Todo
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// Clear Completed
function clearCompleted() {
    if (!confirm('Möchtest du alle erledigten Aufgaben löschen?')) return;
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
}

// Clear All
function clearAll() {
    if (!confirm('Möchtest du wirklich ALLE Aufgaben löschen?')) return;
    todos = [];
    saveTodos();
    renderTodos();
}

// Filter Todos
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

// Render Todos
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>${currentFilter === 'all' ? 'Keine Aufgaben vorhanden' :
                 currentFilter === 'active' ? 'Keine offenen Aufgaben' :
                 'Keine erledigten Aufgaben'}</p>
            <p style="font-size: 0.9rem;">Füge eine neue Aufgabe hinzu!</p>
        `;
        todoList.appendChild(emptyState);
    } else {
        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleTodo(todo.id));

            const text = document.createElement('span');
            text.className = 'todo-text';
            text.textContent = todo.text;

            const date = document.createElement('span');
            date.className = 'todo-date';
            date.textContent = todo.createdAt;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Löschen';
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

            todoItem.appendChild(checkbox);
            todoItem.appendChild(text);
            todoItem.appendChild(date);
            todoItem.appendChild(deleteBtn);

            todoList.appendChild(todoItem);
        });
    }

    updateStats();
}

// Update Stats
function updateStats() {
    const total = todos.length;
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;

    totalCountEl.textContent = total;
    activeCountEl.textContent = active;
    completedCountEl.textContent = completed;
}

// Set Filter
function setFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderTodos();
}

// Export Todos
function exportTodos() {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `todos-backup-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
}

// Import Todos
function importTodos() {
    importFileInput.click();
}

// Handle File Import
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTodos = JSON.parse(e.target.result);

            if (!Array.isArray(importedTodos)) {
                alert('Ungültiges Dateiformat! Die Datei muss ein JSON-Array enthalten.');
                return;
            }

            // Validate todo structure
            const isValid = importedTodos.every(todo =>
                todo.hasOwnProperty('id') &&
                todo.hasOwnProperty('text') &&
                todo.hasOwnProperty('completed')
            );

            if (!isValid) {
                alert('Ungültiges Todo-Format! Bitte stelle sicher, dass alle Todos die erforderlichen Felder haben.');
                return;
            }

            const confirmMsg = `Möchtest du ${importedTodos.length} Todo(s) importieren?\n\nHinweis: Dies wird deine aktuellen Todos ersetzen!`;
            if (confirm(confirmMsg)) {
                todos = importedTodos;
                saveTodos();
                renderTodos();
                alert(`${importedTodos.length} Todo(s) erfolgreich importiert!`);
            }
        } catch (error) {
            alert('Fehler beim Lesen der Datei! Bitte stelle sicher, dass es eine gültige JSON-Datei ist.');
            console.error('Import error:', error);
        }

        // Reset file input
        event.target.value = '';
    };

    reader.readAsText(file);
}

// Initialize Application
function init() {
    // Get DOM Elements
    todoInput = document.getElementById('todo-input');
    addBtn = document.getElementById('add-btn');
    todoList = document.getElementById('todo-list');
    totalCountEl = document.getElementById('total-count');
    activeCountEl = document.getElementById('active-count');
    completedCountEl = document.getElementById('completed-count');
    filterButtons = document.querySelectorAll('.filter-btn');
    clearCompletedBtn = document.getElementById('clear-completed-btn');
    clearAllBtn = document.getElementById('clear-all-btn');
    exportBtn = document.getElementById('export-btn');
    importBtn = document.getElementById('import-btn');
    importFileInput = document.getElementById('import-file-input');

    // Event Listeners
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);
    exportBtn.addEventListener('click', exportTodos);
    importBtn.addEventListener('click', importTodos);
    importFileInput.addEventListener('change', handleFileImport);

    // Initialize application
    loadTodos();
    renderTodos();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
