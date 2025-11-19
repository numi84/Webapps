// ==========================================
// Jigsaw Puzzle Game - Main Implementation
// ==========================================

// Constants & Configuration
const DIFFICULTIES = {
    easy: { rows: 3, cols: 4, name: 'Einfach' },
    medium: { rows: 4, cols: 6, name: 'Mittel' },
    hard: { rows: 6, cols: 8, name: 'Schwer' },
    expert: { rows: 8, cols: 12, name: 'Experte' }
};

const SNAP_DISTANCE = 25;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EXAMPLE_IMAGES = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
    'https://picsum.photos/800/600?random=4'
];

// Game State
let gameState = {
    currentScreen: 'upload',
    image: null,
    difficulty: 'medium',
    customRows: 4,
    customCols: 6,
    useCustom: false,
    settings: {
        showGhost: true,
        showPreview: true,
        highlightEdges: true,
        soundEnabled: true,
        ghostOpacity: 0.2
    },
    pieces: [],
    groups: [],
    progress: {
        startTime: null,
        moves: 0,
        placedPieces: 0,
        totalPieces: 0
    }
};

// ==========================================
// Classes
// ==========================================

class PuzzlePiece {
    constructor(id, row, col, x, y, width, height) {
        this.id = id;
        this.row = row;
        this.col = col;
        this.gridX = x;
        this.gridY = y;
        this.width = width;
        this.height = height;

        // Current position (random at start)
        this.x = Math.random() * 500;
        this.y = Math.random() * 400;

        // Shape and connections
        this.shape = null;
        this.connectedPieces = [];
        this.group = null;
        this.isPlaced = false;

        // Rendering
        this.imageData = null;
        this.zIndex = id;
    }

    render(ctx, highlight = false) {
        if (!this.imageData) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Create clip path if shape exists
        if (this.shape) {
            this.shape.createPath(ctx, this.width, this.height);
            ctx.clip();
        } else {
            // Fallback to rectangle
            ctx.rect(0, 0, this.width, this.height);
            ctx.clip();
        }

        // Draw image (imageData is a canvas element)
        try {
            ctx.drawImage(this.imageData, 0, 0, this.width, this.height);
        } catch (e) {
            console.error('Error drawing piece image:', e);
            // Fallback: draw colored rectangle
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        ctx.restore();

        // Draw outline outside of clip
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.shape) {
            this.shape.createPath(ctx, this.width, this.height);
            ctx.strokeStyle = highlight ? '#667eea' : 'rgba(0,0,0,0.5)';
            ctx.lineWidth = highlight ? 3 : 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    moveBy(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    contains(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    distanceTo(other) {
        const c1 = this.getCenter();
        const c2 = other.getCenter();
        return Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2));
    }

    isNeighbor(other) {
        const rowDiff = Math.abs(this.row - other.row);
        const colDiff = Math.abs(this.col - other.col);
        return (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 0);
    }

    shouldSnapTo(other) {
        if (!this.isNeighbor(other)) return false;

        // Calculate expected relative position
        const expectedX = this.gridX + (other.col - this.col) * this.width;
        const expectedY = this.gridY + (other.row - this.row) * this.height;

        const actualDx = other.x - this.x;
        const actualDy = other.y - this.y;
        const expectedDx = expectedX - this.gridX;
        const expectedDy = expectedY - this.gridY;

        const distance = Math.sqrt(
            Math.pow(actualDx - expectedDx, 2) +
            Math.pow(actualDy - expectedDy, 2)
        );

        return distance < SNAP_DISTANCE;
    }
}

class PieceShape {
    constructor(top, right, bottom, left) {
        this.top = top;      // 'flat', 'in', 'out'
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }

    createPath(ctx, width, height) {
        const tabWidth = width * 0.2;
        const tabHeight = height * 0.2;

        ctx.beginPath();

        // Start at top-left
        ctx.moveTo(0, 0);

        // Top edge
        if (this.top === 'flat') {
            ctx.lineTo(width, 0);
        } else {
            this.drawTab(ctx, 0, 0, width, 0, tabHeight, this.top === 'out');
        }

        // Right edge
        if (this.right === 'flat') {
            ctx.lineTo(width, height);
        } else {
            this.drawTab(ctx, width, 0, width, height, tabWidth, this.right === 'out');
        }

        // Bottom edge
        if (this.bottom === 'flat') {
            ctx.lineTo(0, height);
        } else {
            this.drawTab(ctx, width, height, 0, height, tabHeight, this.bottom === 'out');
        }

        // Left edge
        if (this.left === 'flat') {
            ctx.lineTo(0, 0);
        } else {
            this.drawTab(ctx, 0, height, 0, 0, tabWidth, this.left === 'out');
        }

        ctx.closePath();
    }

    drawTab(ctx, x1, y1, x2, y2, size, isOut) {
        const horizontal = y1 === y2;
        const direction = isOut ? 1 : -1;

        if (horizontal) {
            // Horizontal edge (top or bottom)
            const dir = x2 > x1 ? 1 : -1;
            const midX = (x1 + x2) / 2;
            const tabRadius = Math.abs(size) * 0.3;

            // Draw to start of tab
            ctx.lineTo(midX - tabRadius * dir, y1);

            // Draw tab using bezier curve for smoother shape
            ctx.bezierCurveTo(
                midX - tabRadius * dir, y1 + size * direction * 0.2,
                midX - tabRadius * dir * 0.5, y1 + size * direction,
                midX, y1 + size * direction
            );
            ctx.bezierCurveTo(
                midX + tabRadius * dir * 0.5, y1 + size * direction,
                midX + tabRadius * dir, y1 + size * direction * 0.2,
                midX + tabRadius * dir, y1
            );

            // Complete the edge
            ctx.lineTo(x2, y2);
        } else {
            // Vertical edge (left or right)
            const dir = y2 > y1 ? 1 : -1;
            const midY = (y1 + y2) / 2;
            const tabRadius = Math.abs(size) * 0.3;

            // Draw to start of tab
            ctx.lineTo(x1, midY - tabRadius * dir);

            // Draw tab using bezier curve for smoother shape
            ctx.bezierCurveTo(
                x1 + size * direction * 0.2, midY - tabRadius * dir,
                x1 + size * direction, midY - tabRadius * dir * 0.5,
                x1 + size * direction, midY
            );
            ctx.bezierCurveTo(
                x1 + size * direction, midY + tabRadius * dir * 0.5,
                x1 + size * direction * 0.2, midY + tabRadius * dir,
                x1, midY + tabRadius * dir
            );

            // Complete the edge
            ctx.lineTo(x2, y2);
        }
    }
}

class PieceGroup {
    constructor() {
        this.pieces = [];
    }

    add(piece) {
        if (!this.pieces.includes(piece)) {
            this.pieces.push(piece);
            piece.group = this;
        }
    }

    remove(piece) {
        const index = this.pieces.indexOf(piece);
        if (index > -1) {
            this.pieces.splice(index, 1);
            piece.group = null;
        }
    }

    merge(otherGroup) {
        otherGroup.pieces.forEach(piece => {
            this.add(piece);
        });
        otherGroup.pieces = [];
    }

    moveBy(dx, dy) {
        this.pieces.forEach(piece => {
            piece.moveBy(dx, dy);
        });
    }

    getBounds() {
        if (this.pieces.length === 0) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.pieces.forEach(piece => {
            minX = Math.min(minX, piece.x);
            minY = Math.min(minY, piece.y);
            maxX = Math.max(maxX, piece.x + piece.width);
            maxY = Math.max(maxY, piece.y + piece.height);
        });

        return { minX, minY, maxX, maxY };
    }
}

class PuzzleGenerator {
    static generate(image, rows, cols) {
        const pieces = [];
        const pieceWidth = image.width / cols;
        const pieceHeight = image.height / rows;

        // Generate shapes
        const shapes = this.generateShapes(rows, cols);

        // Create pieces
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = row * cols + col;
                const piece = new PuzzlePiece(
                    id, row, col,
                    col * pieceWidth,
                    row * pieceHeight,
                    pieceWidth,
                    pieceHeight
                );
                piece.shape = shapes[row][col];
                pieces.push(piece);
            }
        }

        // Cut image for each piece
        pieces.forEach(piece => {
            piece.imageData = this.cutImageForPiece(image, piece);
        });

        return pieces;
    }

    static generateShapes(rows, cols) {
        const shapes = [];
        const horizontal = [];
        const vertical = [];

        // Generate random horizontal edges
        for (let row = 0; row <= rows; row++) {
            horizontal[row] = [];
            for (let col = 0; col < cols; col++) {
                if (row === 0 || row === rows) {
                    horizontal[row][col] = 'flat';
                } else {
                    horizontal[row][col] = Math.random() > 0.5 ? 'out' : 'in';
                }
            }
        }

        // Generate random vertical edges
        for (let row = 0; row < rows; row++) {
            vertical[row] = [];
            for (let col = 0; col <= cols; col++) {
                if (col === 0 || col === cols) {
                    vertical[row][col] = 'flat';
                } else {
                    vertical[row][col] = Math.random() > 0.5 ? 'out' : 'in';
                }
            }
        }

        // Create shapes for each piece
        for (let row = 0; row < rows; row++) {
            shapes[row] = [];
            for (let col = 0; col < cols; col++) {
                const top = horizontal[row][col];
                const bottom = horizontal[row + 1][col] === 'out' ? 'in' :
                             horizontal[row + 1][col] === 'in' ? 'out' : 'flat';
                const left = vertical[row][col];
                const right = vertical[row][col + 1] === 'out' ? 'in' :
                            vertical[row][col + 1] === 'in' ? 'out' : 'flat';

                shapes[row][col] = new PieceShape(top, right, bottom, left);
            }
        }

        return shapes;
    }

    static cutImageForPiece(image, piece) {
        const canvas = document.createElement('canvas');
        canvas.width = piece.width;
        canvas.height = piece.height;
        const ctx = canvas.getContext('2d');

        // Draw the image section
        ctx.drawImage(
            image,
            piece.gridX, piece.gridY, piece.width, piece.height,
            0, 0, piece.width, piece.height
        );

        return canvas;
    }
}

class GameCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.width = 0;
        this.height = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    getContext() {
        return this.ctx;
    }
}

class DragController {
    constructor(canvas, pieces) {
        this.canvas = canvas;
        this.pieces = pieces;
        this.draggedPiece = null;
        this.draggedGroup = null;
        this.offset = { x: 0, y: 0 };
        this.isDragging = false;
        this.hasMoved = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.canvas.canvas.addEventListener('mouseleave', (e) => this.handleEnd(e));

        // Touch events
        this.canvas.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleStart(touch);
        });
        this.canvas.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMove(touch);
        });
        this.canvas.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        });
    }

    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    findPieceAt(x, y) {
        // Search from top to bottom (highest z-index first)
        const sorted = [...this.pieces].sort((a, b) => b.zIndex - a.zIndex);
        return sorted.find(piece => piece.contains(x, y));
    }

    handleStart(e) {
        const pos = this.getCanvasCoordinates(e.clientX, e.clientY);
        const piece = this.findPieceAt(pos.x, pos.y);

        if (piece) {
            this.isDragging = true;
            this.hasMoved = false;
            this.draggedPiece = piece;
            this.draggedGroup = piece.group;
            this.offset = {
                x: pos.x - piece.x,
                y: pos.y - piece.y
            };

            // Bring to front
            const maxZ = Math.max(...this.pieces.map(p => p.zIndex));
            if (this.draggedGroup) {
                this.draggedGroup.pieces.forEach(p => p.zIndex = maxZ + 1);
            } else {
                piece.zIndex = maxZ + 1;
            }
        }
    }

    handleMove(e) {
        if (!this.isDragging || !this.draggedPiece) return;

        const pos = this.getCanvasCoordinates(e.clientX, e.clientY);
        const newX = pos.x - this.offset.x;
        const newY = pos.y - this.offset.y;

        if (this.draggedGroup && this.draggedGroup.pieces.length > 1) {
            const dx = newX - this.draggedPiece.x;
            const dy = newY - this.draggedPiece.y;
            this.draggedGroup.moveBy(dx, dy);
        } else {
            this.draggedPiece.moveTo(newX, newY);
        }

        this.hasMoved = true;
    }

    handleEnd(e) {
        if (!this.isDragging || !this.draggedPiece) return;

        // Increment move counter only if piece was actually moved
        if (this.hasMoved) {
            gameState.progress.moves++;
        }

        // Check for snapping
        this.checkSnap();

        this.isDragging = false;
        this.draggedPiece = null;
        this.draggedGroup = null;
        this.hasMoved = false;
    }

    checkSnap() {
        const movedPieces = this.draggedGroup ?
            this.draggedGroup.pieces : [this.draggedPiece];

        movedPieces.forEach(piece => {
            this.pieces.forEach(other => {
                if (piece === other) return;
                if (piece.group && piece.group === other.group) return;

                if (piece.shouldSnapTo(other)) {
                    this.snapPieces(piece, other);
                }
            });
        });
    }

    snapPieces(piece1, piece2) {
        // Calculate correct position
        const dx = (piece2.col - piece1.col) * piece1.width;
        const dy = (piece2.row - piece1.row) * piece1.height;

        const targetX = piece2.x - dx;
        const targetY = piece2.y - dy;

        // Move piece1's group to snap position
        if (piece1.group) {
            const offsetX = targetX - piece1.x;
            const offsetY = targetY - piece1.y;
            piece1.group.moveBy(offsetX, offsetY);
        } else {
            piece1.moveTo(targetX, targetY);
        }

        // Merge groups
        this.mergeGroups(piece1, piece2);

        // Play sound
        if (gameState.settings.soundEnabled) {
            this.playSnapSound();
        }

        // Check if correctly placed
        this.checkPlacement();
    }

    mergeGroups(piece1, piece2) {
        let group1 = piece1.group;
        let group2 = piece2.group;

        if (!group1 && !group2) {
            const newGroup = new PieceGroup();
            newGroup.add(piece1);
            newGroup.add(piece2);
            gameState.groups.push(newGroup);
        } else if (group1 && !group2) {
            group1.add(piece2);
        } else if (!group1 && group2) {
            group2.add(piece1);
        } else if (group1 !== group2) {
            group1.merge(group2);
            const index = gameState.groups.indexOf(group2);
            if (index > -1) {
                gameState.groups.splice(index, 1);
            }
        }
    }

    checkPlacement() {
        // Update placed pieces count
        gameState.progress.placedPieces = 0;

        gameState.groups.forEach(group => {
            const allCorrect = group.pieces.every(piece => {
                const tolerance = 5;
                return Math.abs(piece.x - piece.gridX) < tolerance &&
                       Math.abs(piece.y - piece.gridY) < tolerance;
            });

            if (allCorrect) {
                gameState.progress.placedPieces += group.pieces.length;
                group.pieces.forEach(p => p.isPlaced = true);
            }
        });

        // Update display immediately
        if (game && game.progressTracker) {
            game.progressTracker.updateDisplay();
        }

        // Check completion
        if (gameState.progress.placedPieces === gameState.progress.totalPieces) {
            setTimeout(() => {
                game.complete();
            }, 500);
        }
    }

    playSnapSound() {
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
}

class ProgressTracker {
    constructor() {
        this.timerInterval = null;
    }

    start() {
        gameState.progress.startTime = Date.now();
        gameState.progress.moves = 0;
        gameState.progress.placedPieces = 0;

        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateDisplay() {
        const elapsed = this.getElapsedTime();
        document.getElementById('timer-display').textContent = this.formatTime(elapsed);
        document.getElementById('moves-display').textContent = gameState.progress.moves;

        const percentage = (gameState.progress.placedPieces / gameState.progress.totalPieces * 100).toFixed(0);
        document.getElementById('progress-display').textContent = percentage + '%';
        document.getElementById('progress-bar-fill').style.width = percentage + '%';
    }

    getElapsedTime() {
        if (!gameState.progress.startTime) return 0;
        return Date.now() - gameState.progress.startTime;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}

class GameRenderer {
    constructor(canvas, pieces, image) {
        this.canvas = canvas;
        this.pieces = pieces;
        this.image = image;
        this.animationFrame = null;
    }

    start() {
        this.render();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    render() {
        this.canvas.clear();
        const ctx = this.canvas.getContext();

        // Render ghost image centered
        if (gameState.settings.showGhost && this.image && gameState.ghostArea) {
            ctx.globalAlpha = gameState.settings.ghostOpacity;
            ctx.drawImage(
                this.image,
                gameState.ghostArea.x,
                gameState.ghostArea.y,
                gameState.ghostArea.width,
                gameState.ghostArea.height
            );
            ctx.globalAlpha = 1.0;
        }

        // Sort pieces by z-index
        const sorted = [...this.pieces].sort((a, b) => a.zIndex - b.zIndex);

        // Render pieces
        sorted.forEach(piece => {
            const highlight = gameState.settings.highlightEdges &&
                            (piece.row === 0 || piece.col === 0 ||
                             piece.row === getDifficulty().rows - 1 ||
                             piece.col === getDifficulty().cols - 1);
            piece.render(ctx, highlight);
        });

        this.animationFrame = requestAnimationFrame(() => this.render());
    }
}

// ==========================================
// Main Game Class
// ==========================================

class PuzzleGame {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.dragController = null;
        this.progressTracker = new ProgressTracker();
    }

    init() {
        this.setupUploadScreen();
        this.setupSettingsScreen();
        this.setupGameScreen();
        this.setupCompletionScreen();
        this.setupModals();

        this.showScreen('upload');
    }

    setupUploadScreen() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) this.loadImageFile(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadImageFile(file);
        });

        document.getElementById('change-image-btn').addEventListener('click', () => {
            document.getElementById('preview-container').classList.add('hidden');
            dropZone.classList.remove('hidden');
            gameState.image = null;
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            if (gameState.image) {
                this.showScreen('settings');
            }
        });

        // Load example images
        this.loadExampleImages();
    }

    loadExampleImages() {
        const grid = document.getElementById('example-grid');
        grid.innerHTML = '';

        EXAMPLE_IMAGES.forEach((url, index) => {
            const div = document.createElement('div');
            div.className = 'example-image';
            div.innerHTML = `<img src="${url}" alt="Beispiel ${index + 1}">`;
            div.addEventListener('click', () => this.loadImageURL(url));
            grid.appendChild(div);
        });
    }

    loadImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Bitte wähle eine Bilddatei aus.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('Datei ist zu groß. Maximale Größe: 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImageURL(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    loadImageURL(url) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            gameState.image = img;
            this.showPreview(img);
        };
        img.onerror = () => {
            alert('Fehler beim Laden des Bildes.');
        };
        img.src = url;
    }

    showPreview(img) {
        document.getElementById('drop-zone').classList.add('hidden');
        const previewContainer = document.getElementById('preview-container');
        previewContainer.classList.remove('hidden');
        document.getElementById('preview-image').src = img.src;
    }

    setupSettingsScreen() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-card').forEach(c =>
                    c.classList.remove('active'));
                card.classList.add('active');
                gameState.difficulty = card.dataset.difficulty;
                gameState.useCustom = false;
                document.getElementById('custom-toggle').checked = false;
                document.getElementById('custom-inputs').classList.add('hidden');
            });
        });

        // Custom difficulty
        const customToggle = document.getElementById('custom-toggle');
        const customInputs = document.getElementById('custom-inputs');
        const customRows = document.getElementById('custom-rows');
        const customCols = document.getElementById('custom-cols');
        const customTotal = document.getElementById('custom-total');

        customToggle.addEventListener('change', () => {
            if (customToggle.checked) {
                customInputs.classList.remove('hidden');
                gameState.useCustom = true;
                document.querySelectorAll('.difficulty-card').forEach(c =>
                    c.classList.remove('active'));
            } else {
                customInputs.classList.add('hidden');
                gameState.useCustom = false;
            }
        });

        const updateCustomTotal = () => {
            const rows = parseInt(customRows.value) || 4;
            const cols = parseInt(customCols.value) || 6;
            customTotal.textContent = rows * cols;
            gameState.customRows = rows;
            gameState.customCols = cols;
        };

        customRows.addEventListener('input', updateCustomTotal);
        customCols.addEventListener('input', updateCustomTotal);

        // Options
        document.getElementById('option-ghost').addEventListener('change', (e) => {
            gameState.settings.showGhost = e.target.checked;
        });
        document.getElementById('option-preview').addEventListener('change', (e) => {
            gameState.settings.showPreview = e.target.checked;
        });
        document.getElementById('option-edges').addEventListener('change', (e) => {
            gameState.settings.highlightEdges = e.target.checked;
        });
        document.getElementById('option-sound').addEventListener('change', (e) => {
            gameState.settings.soundEnabled = e.target.checked;
        });

        // Navigation
        document.getElementById('back-to-upload-btn').addEventListener('click', () => {
            this.showScreen('upload');
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
    }

    setupGameScreen() {
        // Ghost opacity slider
        const ghostSlider = document.getElementById('ghost-opacity');
        const ghostValue = document.getElementById('ghost-value');

        ghostSlider.addEventListener('input', () => {
            const value = parseInt(ghostSlider.value);
            ghostValue.textContent = value + '%';
            gameState.settings.ghostOpacity = value / 100;
        });

        // Preview window dragging
        const previewWindow = document.getElementById('preview-window');
        const previewHeader = previewWindow.querySelector('.preview-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        previewHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - previewWindow.offsetLeft;
            initialY = e.clientY - previewWindow.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                previewWindow.style.left = currentX + 'px';
                previewWindow.style.top = currentY + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        document.getElementById('close-preview-btn').addEventListener('click', () => {
            previewWindow.classList.add('hidden');
            gameState.settings.showPreview = false;
        });

        // Control buttons
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('hidden');
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Möchtest du wirklich neu starten?')) {
                this.startGame();
            }
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            if (confirm('Zurück zum Hauptmenü? Der Fortschritt geht verloren.')) {
                this.showScreen('upload');
                if (this.renderer) this.renderer.stop();
                this.progressTracker.stop();
            }
        });
    }

    setupCompletionScreen() {
        document.getElementById('new-puzzle-btn').addEventListener('click', () => {
            this.showScreen('upload');
            if (this.renderer) this.renderer.stop();
            this.progressTracker.stop();
        });

        document.getElementById('same-image-btn').addEventListener('click', () => {
            this.showScreen('settings');
        });
    }

    setupModals() {
        // Settings modal
        document.getElementById('close-settings-modal').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        document.getElementById('save-settings-btn').addEventListener('click', () => {
            gameState.settings.showGhost = document.getElementById('modal-ghost').checked;
            gameState.settings.showPreview = document.getElementById('modal-preview').checked;
            gameState.settings.highlightEdges = document.getElementById('modal-edges').checked;
            gameState.settings.soundEnabled = document.getElementById('modal-sound').checked;

            // Update UI
            document.getElementById('preview-window').classList.toggle('hidden',
                !gameState.settings.showPreview);
            document.getElementById('ghost-opacity-slider').classList.toggle('hidden',
                !gameState.settings.showGhost);

            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Help modal
        document.getElementById('close-help-modal').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('hidden');
        });
    }

    startGame() {
        if (!gameState.image) {
            alert('Bitte wähle zuerst ein Bild aus.');
            return;
        }

        this.showScreen('game');

        const difficulty = getDifficulty();
        const canvasElement = document.getElementById('game-canvas');

        // Setup canvas - use full available space
        const canvasWidth = window.innerWidth - 40;
        const canvasHeight = window.innerHeight - 200;

        this.canvas = new GameCanvas(canvasElement);
        this.canvas.resize(canvasWidth, canvasHeight);

        // Calculate ghost image size (centered)
        const maxGhostWidth = Math.min(canvasWidth * 0.6, 800);
        const maxGhostHeight = Math.min(canvasHeight * 0.8, 600);
        const aspectRatio = gameState.image.width / gameState.image.height;

        let ghostWidth, ghostHeight;
        if (aspectRatio > maxGhostWidth / maxGhostHeight) {
            ghostWidth = maxGhostWidth;
            ghostHeight = maxGhostWidth / aspectRatio;
        } else {
            ghostHeight = maxGhostHeight;
            ghostWidth = maxGhostHeight * aspectRatio;
        }

        // Store ghost position for rendering
        gameState.ghostArea = {
            x: (canvasWidth - ghostWidth) / 2,
            y: (canvasHeight - ghostHeight) / 2,
            width: ghostWidth,
            height: ghostHeight
        };

        // Generate puzzle based on ghost size
        const scaledImage = this.scaleImage(gameState.image, ghostWidth, ghostHeight);
        gameState.pieces = PuzzleGenerator.generate(scaledImage, difficulty.rows, difficulty.cols);
        gameState.groups = [];
        gameState.progress.totalPieces = gameState.pieces.length;

        // Adjust piece positions to ghost area
        gameState.pieces.forEach(piece => {
            piece.gridX += gameState.ghostArea.x;
            piece.gridY += gameState.ghostArea.y;
        });

        // Shuffle pieces
        this.shufflePieces();

        // Setup controllers
        this.dragController = new DragController(this.canvas, gameState.pieces);
        this.renderer = new GameRenderer(this.canvas, gameState.pieces, scaledImage);

        // Start rendering
        this.renderer.start();

        // Start progress tracking
        this.progressTracker.start();

        // Update preview
        if (gameState.settings.showPreview) {
            document.getElementById('preview-img').src = gameState.image.src;
            document.getElementById('preview-window').classList.remove('hidden');
        }

        // Show ghost slider if enabled
        document.getElementById('ghost-opacity-slider').classList.toggle('hidden',
            !gameState.settings.showGhost);
    }

    scaleImage(img, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Return the canvas directly - drawImage can use canvas as source
        return canvas;
    }

    shufflePieces() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const margin = 20;
        const ghostArea = gameState.ghostArea;

        gameState.pieces.forEach(piece => {
            let x, y;
            let attempts = 0;

            // Try to place pieces outside ghost area
            do {
                x = margin + Math.random() * (canvasWidth - piece.width - margin * 2);
                y = margin + Math.random() * (canvasHeight - piece.height - margin * 2);
                attempts++;

                // After 50 attempts, allow placement anywhere
                if (attempts > 50) break;

                // Check if piece overlaps with ghost area center
                const pieceCenter = { x: x + piece.width / 2, y: y + piece.height / 2 };
                const ghostCenter = {
                    x: ghostArea.x + ghostArea.width / 2,
                    y: ghostArea.y + ghostArea.height / 2
                };

                // Keep pieces away from the center of ghost area
                const distance = Math.sqrt(
                    Math.pow(pieceCenter.x - ghostCenter.x, 2) +
                    Math.pow(pieceCenter.y - ghostCenter.y, 2)
                );

                // Accept if piece is far enough from ghost center
                if (distance > Math.min(ghostArea.width, ghostArea.height) * 0.4) {
                    break;
                }
            } while (attempts < 50);

            piece.x = x;
            piece.y = y;
        });
    }

    complete() {
        this.progressTracker.stop();
        if (this.renderer) this.renderer.stop();

        // Show completion screen
        const elapsed = this.progressTracker.getElapsedTime();
        document.getElementById('completion-time').textContent =
            this.progressTracker.formatTime(elapsed);
        document.getElementById('completion-moves').textContent =
            gameState.progress.moves;
        document.getElementById('completion-difficulty').textContent =
            getDifficulty().name || 'Custom';
        document.getElementById('completion-pieces').textContent =
            gameState.progress.totalPieces;
        document.getElementById('completion-img').src = gameState.image.src;

        this.showScreen('completion');

        // Play completion sound
        if (gameState.settings.soundEnabled) {
            this.playCompletionSound();
        }
    }

    playCompletionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784, 1047]; // C, E, G, C

            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                const startTime = audioContext.currentTime + i * 0.15;
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenName + '-screen').classList.add('active');
        gameState.currentScreen = screenName;
    }
}

// ==========================================
// Utility Functions
// ==========================================

function getDifficulty() {
    if (gameState.useCustom) {
        return {
            rows: gameState.customRows,
            cols: gameState.customCols,
            name: 'Custom'
        };
    }
    return DIFFICULTIES[gameState.difficulty];
}

// ==========================================
// Initialize Game
// ==========================================

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new PuzzleGame();
    game.init();
});
