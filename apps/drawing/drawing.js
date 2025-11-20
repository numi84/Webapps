// Canvas Setup
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// State
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let currentSize = 5;
let lastX = 0;
let lastY = 0;

// DOM Elements
const toolButtons = document.querySelectorAll('.tool-btn');
const colorPicker = document.getElementById('color-picker');
const colorPresets = document.querySelectorAll('.color-preset');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const importBtn = document.getElementById('import-btn');
const imageInput = document.getElementById('image-input');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');

// Initialize canvas with white background
function initCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Get mouse/touch position relative to canvas
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Start Drawing
function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
}

// Draw
function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);

    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.globalCompositeOperation = 'source-over';
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
}

// Stop Drawing
function stopDrawing() {
    isDrawing = false;
}

// Set Tool
function setTool(tool) {
    currentTool = tool;
    toolButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

// Set Color
function setColor(color) {
    currentColor = color;
    colorPicker.value = color;
    if (currentTool === 'eraser') {
        setTool('pen');
    }
}

// Set Size
function setSize(size) {
    currentSize = size;
    sizeValue.textContent = `${size}px`;
}

// Clear Canvas
function clearCanvas() {
    if (!confirm('Möchtest du wirklich alles löschen?')) return;
    initCanvas();
}

// Save Drawing
function saveDrawing() {
    const link = document.createElement('a');
    link.download = `zeichnung-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import Image
function importImage() {
    imageInput.click();
}

// Load and display the imported image
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Draw the image on the canvas
            // Scale the image to fit the canvas while maintaining aspect ratio
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Event Listeners - Mouse
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Event Listeners - Touch
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Tool Selection
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
    });
});

// Color Picker
colorPicker.addEventListener('input', (e) => {
    setColor(e.target.value);
});

// Color Presets
colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        setColor(preset.dataset.color);
    });
});

// Size Slider
sizeSlider.addEventListener('input', (e) => {
    setSize(e.target.value);
});

// Buttons
importBtn.addEventListener('click', importImage);
imageInput.addEventListener('change', handleImageUpload);
clearBtn.addEventListener('click', clearCanvas);
saveBtn.addEventListener('click', saveDrawing);

// Initialize
initCanvas();
