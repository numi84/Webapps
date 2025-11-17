// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const totalCountEl = document.getElementById('total-count');
const activeCountEl = document.getElementById('active-count');
const completedCountEl = document.getElementById('completed-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// Load todos from LocalStorage
function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    }
}

// Save todos to LocalStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todo = {
        id: Date.now(),
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

// Initialize
loadTodos();
renderTodos();
