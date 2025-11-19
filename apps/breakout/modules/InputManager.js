export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            active: false
        };
        this.touch = {
            x: 0,
            y: 0,
            active: false
        };
        this.actions = {};

        this.setupListeners();
    }

    setupListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
            this.mouse.active = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.actions.onClick) {
                this.actions.onClick(e);
            }
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
            if (this.actions.onTouchStart) {
                this.actions.onTouchStart(e);
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
            if (this.actions.onTouchEnd) {
                this.actions.onTouchEnd(e);
            }
        });

        this.canvas.addEventListener('touchcancel', () => {
            this.touch.active = false;
        });
    }

    handleTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.touch.x = (touch.clientX - rect.left) * scaleX;
        this.touch.y = (touch.clientY - rect.top) * scaleY;
        this.touch.active = true;

        // Also update mouse for paddle control
        this.mouse.x = this.touch.x;
        this.mouse.y = this.touch.y;
        this.mouse.active = true;
    }

    isKeyDown(key) {
        return this.keys[key] || false;
    }

    onAction(action, callback) {
        this.actions[action] = callback;
    }

    reset() {
        this.keys = {};
        this.mouse.active = false;
        this.touch.active = false;
    }
}
