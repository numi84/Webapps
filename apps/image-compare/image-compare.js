class ImageCompare {
    constructor() {
        this.imageA = null;
        this.imageB = null;
        this.sensitivity = 70;
        this.diffData = null;

        // Zoom and pan state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;

        // Performance optimization: cache diff canvas
        this.cachedDiffCanvas = null;
        this.animationFrameId = null;
        this.minimapUpdateTimeout = null;

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

        // Minimaps
        this.minimapA = document.getElementById('minimapA');
        this.minimapB = document.getElementById('minimapB');
        this.minimapOverlay = document.getElementById('minimapOverlay');
        this.minimapDiff = document.getElementById('minimapDiff');

        // Canvas containers
        this.canvasContainers = document.querySelectorAll('.canvas-container');

        // Controls
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.opacitySlider = document.getElementById('opacity');
        this.opacityValue = document.getElementById('opacityValue');
        this.compareBtn = document.getElementById('compareBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Zoom controls
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.zoomResetBtn = document.getElementById('zoomReset');
        this.zoomValue = document.getElementById('zoomValue');

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

        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.handleZoom(0.2));
        this.zoomOutBtn.addEventListener('click', () => this.handleZoom(-0.2));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());

        // Mouse wheel zoom
        this.canvasContainers.forEach(container => {
            container.addEventListener('wheel', (e) => this.handleWheelZoom(e));
            container.addEventListener('mousedown', (e) => this.startPan(e));
            container.addEventListener('mousemove', (e) => this.pan(e));
            container.addEventListener('mouseup', () => this.endPan());
            container.addEventListener('mouseleave', () => this.endPan());
        });
    }

    async handleImageUpload(event, imageId) {
        const file = event.target.files[0];
        if (!file) return;

        // Check if file is a PDF
        if (file.type === 'application/pdf') {
            await this.handlePdfUpload(file, imageId, event.target);
        }
        // Check if file is a TIFF
        else if (file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff')) {
            await this.handleTiffUpload(file, imageId, event.target);
        }
        else {
            // Handle regular image files
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
    }

    async handlePdfUpload(file, imageId, inputElement) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1); // Get first page

            // Set up canvas for PDF rendering
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Render PDF page to canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert canvas to image
            const img = new Image();
            img.onload = () => {
                if (imageId === 'A') {
                    this.imageA = img;
                } else {
                    this.imageB = img;
                }

                // Update upload label
                const label = inputElement.nextElementSibling;
                label.querySelector('span:last-child').textContent = file.name + ' (Seite 1)';
                label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                this.checkIfReadyToCompare();
            };
            img.src = canvas.toDataURL();
        } catch (error) {
            console.error('Fehler beim Laden der PDF:', error);
            alert('Fehler beim Laden der PDF-Datei. Bitte versuchen Sie es erneut.');
        }
    }

    async handleTiffUpload(file, imageId, inputElement) {
        try {
            const arrayBuffer = await file.arrayBuffer();

            // Use Tiff.js to decode TIFF
            const tiff = new Tiff({ buffer: arrayBuffer });
            const canvas = tiff.toCanvas();

            if (!canvas) {
                throw new Error('TIFF konnte nicht dekodiert werden');
            }

            // Convert canvas to image
            const img = new Image();
            img.onload = () => {
                if (imageId === 'A') {
                    this.imageA = img;
                } else {
                    this.imageB = img;
                }

                // Update upload label
                const label = inputElement.nextElementSibling;
                label.querySelector('span:last-child').textContent = file.name;
                label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                this.checkIfReadyToCompare();
            };
            img.src = canvas.toDataURL();
        } catch (error) {
            console.error('Fehler beim Laden der TIFF:', error);
            alert('Fehler beim Laden der TIFF-Datei. Bitte versuchen Sie es erneut.');
        }
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

        // Initialize minimaps
        this.updateMinimaps();
    }

    setCanvasDimensions(width, height) {
        [this.canvasA, this.canvasB, this.canvasOverlay, this.canvasDiff].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
    }

    drawImageOnCanvas(canvas, image, width, height) {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Apply zoom and pan transformations
        ctx.translate(this.panX + canvas.width / 2, this.panY + canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Center the image if it's smaller than canvas
        const x = (width - image.width) / 2;
        const y = (height - image.height) / 2;
        ctx.drawImage(image, x, y);

        ctx.restore();
    }

    calculateDifferences(width, height) {
        const ctxA = this.canvasA.getContext('2d');
        const ctxB = this.canvasB.getContext('2d');
        const ctxDiff = this.canvasDiff.getContext('2d');

        // Save the current transform state
        const currentZoom = this.zoom;
        const currentPanX = this.panX;
        const currentPanY = this.panY;

        // Temporarily reset zoom/pan for accurate pixel comparison
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Redraw without zoom for comparison
        this.drawImageOnCanvas(this.canvasA, this.imageA, width, height);
        this.drawImageOnCanvas(this.canvasB, this.imageB, width, height);

        const imageDataA = ctxA.getImageData(0, 0, width, height);
        const imageDataB = ctxB.getImageData(0, 0, width, height);
        const diffImageData = ctxDiff.createImageData(width, height);

        const dataA = imageDataA.data;
        const dataB = imageDataB.data;
        const dataDiff = diffImageData.data;

        let totalPixels = width * height;
        let differentPixels = 0;
        // Inverted: 0 = less sensitive (high threshold), 100 = very sensitive (low threshold)
        const threshold = (100 - this.sensitivity) * 2.55;

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

        // Create cached version of difference canvas
        if (!this.cachedDiffCanvas) {
            this.cachedDiffCanvas = document.createElement('canvas');
        }
        this.cachedDiffCanvas.width = width;
        this.cachedDiffCanvas.height = height;
        const cachedCtx = this.cachedDiffCanvas.getContext('2d');
        cachedCtx.putImageData(diffImageData, 0, 0);

        // Restore zoom/pan state
        this.zoom = currentZoom;
        this.panX = currentPanX;
        this.panY = currentPanY;

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

        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Apply zoom and pan transformations
        ctx.translate(this.panX + width / 2, this.panY + height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-width / 2, -height / 2);

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
        ctx.restore();
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
        this.updateMinimaps();
    }

    handleZoom(delta) {
        this.zoom = Math.max(0.5, Math.min(5, this.zoom + delta));
        this.zoomValue.textContent = Math.round(this.zoom * 100);

        // Use requestAnimationFrame for smooth updates
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.redrawAll();
            this.animationFrameId = null;
        });
    }

    handleWheelZoom(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.handleZoom(delta);
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.zoomValue.textContent = '100';
        this.redrawAll();
    }

    startPan(e) {
        if (this.zoom <= 1) return;
        this.isPanning = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    pan(e) {
        if (!this.isPanning || this.zoom <= 1) return;

        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;

        this.panX += deltaX;
        this.panY += deltaY;

        this.lastX = e.clientX;
        this.lastY = e.clientY;

        // Use requestAnimationFrame for smooth updates
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.redrawAll();
            this.animationFrameId = null;
        });
    }

    endPan() {
        this.isPanning = false;
    }

    redrawAll() {
        if (!this.imageA || !this.imageB) return;

        const width = Math.max(this.imageA.width, this.imageB.width);
        const height = Math.max(this.imageA.height, this.imageB.height);

        // Redraw all canvases with zoom and pan
        this.drawImageOnCanvas(this.canvasA, this.imageA, width, height);
        this.drawImageOnCanvas(this.canvasB, this.imageB, width, height);
        this.renderOverlay(this.opacitySlider.value / 100);

        // Only redraw diff canvas with cached data (no recalculation)
        if (this.cachedDiffCanvas) {
            this.drawDiffWithTransform(width, height);
        }

        this.updateMinimaps();
    }

    drawDiffWithTransform(width, height) {
        const ctx = this.canvasDiff.getContext('2d');

        ctx.save();
        ctx.clearRect(0, 0, this.canvasDiff.width, this.canvasDiff.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Apply zoom and pan transformations
        ctx.translate(this.panX + width / 2, this.panY + height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-width / 2, -height / 2);

        // Draw cached diff canvas
        ctx.drawImage(this.cachedDiffCanvas, 0, 0);

        ctx.restore();
    }

    updateMinimaps() {
        if (!this.imageA || !this.imageB) return;

        // Throttle minimap updates for better performance
        if (this.minimapUpdateTimeout) {
            clearTimeout(this.minimapUpdateTimeout);
        }

        this.minimapUpdateTimeout = setTimeout(() => {
            const minimaps = [
                { canvas: this.minimapA, source: this.canvasA },
                { canvas: this.minimapB, source: this.canvasB },
                { canvas: this.minimapOverlay, source: this.canvasOverlay },
                { canvas: this.minimapDiff, source: this.canvasDiff }
            ];

            minimaps.forEach(({ canvas, source }) => {
                if (this.zoom > 1) {
                    canvas.classList.add('active');
                    this.drawMinimap(canvas, source);
                } else {
                    canvas.classList.remove('active');
                }
            });
        }, 50); // Update minimaps every 50ms max
    }

    drawMinimap(minimap, sourceCanvas) {
        const maxSize = 150;
        const aspect = sourceCanvas.width / sourceCanvas.height;

        if (aspect > 1) {
            minimap.width = maxSize;
            minimap.height = maxSize / aspect;
        } else {
            minimap.height = maxSize;
            minimap.width = maxSize * aspect;
        }

        const ctx = minimap.getContext('2d');
        ctx.clearRect(0, 0, minimap.width, minimap.height);
        ctx.drawImage(sourceCanvas, 0, 0, minimap.width, minimap.height);

        // Draw viewport indicator
        const viewportWidth = minimap.width / this.zoom;
        const viewportHeight = minimap.height / this.zoom;
        const viewportX = -this.panX / (sourceCanvas.width * this.zoom) * minimap.width;
        const viewportY = -this.panY / (sourceCanvas.height * this.zoom) * minimap.height;

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    }

    reset() {
        // Reset images
        this.imageA = null;
        this.imageB = null;
        this.diffData = null;

        // Reset zoom and pan
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.zoomValue.textContent = '100';

        // Clear cached diff canvas
        this.cachedDiffCanvas = null;

        // Cancel any pending animation frames
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

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

        // Hide minimaps
        [this.minimapA, this.minimapB, this.minimapOverlay, this.minimapDiff].forEach(minimap => {
            minimap.classList.remove('active');
        });

        // Hide results
        this.resultsSection.classList.remove('active');

        // Disable compare button
        this.compareBtn.disabled = true;

        // Reset sliders
        this.sensitivitySlider.value = 70;
        this.sensitivityValue.textContent = '70';
        this.sensitivity = 70;
        this.opacitySlider.value = 50;
        this.opacityValue.textContent = '50';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ImageCompare();
});
