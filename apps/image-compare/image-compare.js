class ImageCompare {
    constructor() {
        this.imageA = null;
        this.imageB = null;
        this.sensitivity = 30;
        this.diffData = null;

        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        // File inputs
        this.inputA = document.getElementById('imageA');
        this.inputB = document.getElementById('imageB');

        // Canvases
        this.canvasA = document.getElementById('canvasA');
        this.canvasB = document.getElementById('canvasB');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        this.canvasDiff = document.getElementById('canvasDiff');

        // Controls
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.opacitySlider = document.getElementById('opacity');
        this.opacityValue = document.getElementById('opacityValue');
        this.compareBtn = document.getElementById('compareBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Views
        this.resultsSection = document.getElementById('resultsSection');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.diffStats = document.getElementById('diffStats');
    }

    attachEventListeners() {
        this.inputA.addEventListener('change', (e) => this.handleImageUpload(e, 'A'));
        this.inputB.addEventListener('change', (e) => this.handleImageUpload(e, 'B'));

        this.sensitivitySlider.addEventListener('input', (e) => {
            this.sensitivity = parseInt(e.target.value);
            this.sensitivityValue.textContent = this.sensitivity;
            if (this.diffData) {
                this.compareImages();
            }
        });

        this.opacitySlider.addEventListener('input', (e) => {
            this.opacityValue.textContent = e.target.value;
            if (this.imageA && this.imageB) {
                this.renderOverlay(e.target.value / 100);
            }
        });

        this.compareBtn.addEventListener('click', () => this.compareImages());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });
    }

    handleImageUpload(event, imageId) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (imageId === 'A') {
                    this.imageA = img;
                } else {
                    this.imageB = img;
                }

                // Update upload label
                const label = event.target.nextElementSibling;
                label.querySelector('span:last-child').textContent = file.name;
                label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                this.checkIfReadyToCompare();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    checkIfReadyToCompare() {
        if (this.imageA && this.imageB) {
            this.compareBtn.disabled = false;
        }
    }

    compareImages() {
        if (!this.imageA || !this.imageB) return;

        // Get dimensions
        const width = Math.max(this.imageA.width, this.imageB.width);
        const height = Math.max(this.imageA.height, this.imageB.height);

        // Set canvas dimensions
        this.setCanvasDimensions(width, height);

        // Draw images
        this.drawImageOnCanvas(this.canvasA, this.imageA, width, height);
        this.drawImageOnCanvas(this.canvasB, this.imageB, width, height);

        // Calculate differences
        this.calculateDifferences(width, height);

        // Render overlay
        this.renderOverlay(this.opacitySlider.value / 100);

        // Show results
        this.resultsSection.classList.add('active');
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setCanvasDimensions(width, height) {
        [this.canvasA, this.canvasB, this.canvasOverlay, this.canvasDiff].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
    }

    drawImageOnCanvas(canvas, image, width, height) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Center the image if it's smaller than canvas
        const x = (width - image.width) / 2;
        const y = (height - image.height) / 2;
        ctx.drawImage(image, x, y);
    }

    calculateDifferences(width, height) {
        const ctxA = this.canvasA.getContext('2d');
        const ctxB = this.canvasB.getContext('2d');
        const ctxDiff = this.canvasDiff.getContext('2d');

        const imageDataA = ctxA.getImageData(0, 0, width, height);
        const imageDataB = ctxB.getImageData(0, 0, width, height);
        const diffImageData = ctxDiff.createImageData(width, height);

        const dataA = imageDataA.data;
        const dataB = imageDataB.data;
        const dataDiff = diffImageData.data;

        let totalPixels = width * height;
        let differentPixels = 0;
        // Invert sensitivity: 1 = minimal (255), 100 = maximal (0)
        const threshold = (100 - this.sensitivity) * 2.55; // Convert to 0-255 scale

        for (let i = 0; i < dataA.length; i += 4) {
            const rDiff = Math.abs(dataA[i] - dataB[i]);
            const gDiff = Math.abs(dataA[i + 1] - dataB[i + 1]);
            const bDiff = Math.abs(dataA[i + 2] - dataB[i + 2]);

            const avgDiff = (rDiff + gDiff + bDiff) / 3;

            if (avgDiff > threshold) {
                // Highlight difference in red
                dataDiff[i] = 255;         // R
                dataDiff[i + 1] = 0;       // G
                dataDiff[i + 2] = 0;       // B
                dataDiff[i + 3] = 255;     // A
                differentPixels++;
            } else {
                // Show original image dimmed
                dataDiff[i] = dataA[i] * 0.3;
                dataDiff[i + 1] = dataA[i + 1] * 0.3;
                dataDiff[i + 2] = dataA[i + 2] * 0.3;
                dataDiff[i + 3] = 255;
            }
        }

        ctxDiff.putImageData(diffImageData, 0, 0);

        // Store diff data
        this.diffData = {
            totalPixels,
            differentPixels,
            percentage: ((differentPixels / totalPixels) * 100).toFixed(2)
        };

        this.updateStats();
    }

    renderOverlay(opacity) {
        if (!this.imageA || !this.imageB) return;

        const ctx = this.canvasOverlay.getContext('2d');
        const width = this.canvasOverlay.width;
        const height = this.canvasOverlay.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw image A
        const xA = (width - this.imageA.width) / 2;
        const yA = (height - this.imageA.height) / 2;
        ctx.globalAlpha = 1 - opacity;
        ctx.drawImage(this.imageA, xA, yA);

        // Draw image B with opacity
        const xB = (width - this.imageB.width) / 2;
        const yB = (height - this.imageB.height) / 2;
        ctx.globalAlpha = opacity;
        ctx.drawImage(this.imageB, xB, yB);

        ctx.globalAlpha = 1;
    }

    updateStats() {
        if (!this.diffData) return;

        this.diffStats.innerHTML = `
            <h4>Statistiken</h4>
            <p>Gesamtpixel: <span class="highlight">${this.diffData.totalPixels.toLocaleString()}</span></p>
            <p>Unterschiedliche Pixel: <span class="highlight">${this.diffData.differentPixels.toLocaleString()}</span></p>
            <p>Unterschied: <span class="highlight">${this.diffData.percentage}%</span></p>
        `;
    }

    switchView(viewName) {
        // Update tabs
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active');
        });

        const viewMap = {
            'side-by-side': 'sideBySideView',
            'overlay': 'overlayView',
            'difference': 'differenceView'
        };

        document.getElementById(viewMap[viewName]).classList.add('active');
    }

    reset() {
        // Reset images
        this.imageA = null;
        this.imageB = null;
        this.diffData = null;

        // Clear file inputs
        this.inputA.value = '';
        this.inputB.value = '';

        // Reset labels
        document.querySelectorAll('.upload-label').forEach(label => {
            label.querySelector('span:last-child').textContent = label.querySelector('span:last-child').textContent.includes('A') ? 'Bild A hochladen' : 'Bild B hochladen';
            label.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        });

        // Clear canvases
        [this.canvasA, this.canvasB, this.canvasOverlay, this.canvasDiff].forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Hide results
        this.resultsSection.classList.remove('active');

        // Disable compare button
        this.compareBtn.disabled = true;

        // Reset sliders
        this.sensitivitySlider.value = 30;
        this.sensitivityValue.textContent = '30';
        this.sensitivity = 30;
        this.opacitySlider.value = 50;
        this.opacityValue.textContent = '50';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ImageCompare();
});
