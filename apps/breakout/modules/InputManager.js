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

        // Store bound handlers for cleanup
        this.boundHandlers = {};

        this.setupListeners();
    }

    setupListeners() {
        // Create bound handlers that can be removed later
        this.boundHandlers.keydown = (e) => {
            this.keys[e.code] = true;

            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        };

        this.boundHandlers.keyup = (e) => {
            this.keys[e.code] = false;
        };

        this.boundHandlers.mousemove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
            this.mouse.active = true;
        };

        this.boundHandlers.mouseleave = () => {
            this.mouse.active = false;
        };

        this.boundHandlers.click = (e) => {
            if (this.actions.onClick) {
                this.actions.onClick(e);
            }
        };

        this.boundHandlers.touchstart = (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
            if (this.actions.onTouchStart) {
                this.actions.onTouchStart(e);
            }
        };

        this.boundHandlers.touchmove = (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0]);
        };

        this.boundHandlers.touchend = (e) => {
            e.preventDefault();
            this.touch.active = false;
            // Reset mouse.active when touch ends to prevent stale input state
            this.mouse.active = false;
            if (this.actions.onTouchEnd) {
                this.actions.onTouchEnd(e);
            }
        };

        this.boundHandlers.touchcancel = () => {
            this.touch.active = false;
            this.mouse.active = false;
        };

        // Add event listeners
        window.addEventListener('keydown', this.boundHandlers.keydown);
        window.addEventListener('keyup', this.boundHandlers.keyup);

        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseleave);
        this.canvas.addEventListener('click', this.boundHandlers.click);

        this.canvas.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        this.canvas.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        this.canvas.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
        this.canvas.addEventListener('touchcancel', this.boundHandlers.touchcancel);
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

    /**
     * Remove all event listeners to prevent memory leaks.
     * Call this when the game is destroyed or the page is unloaded.
     */
    destroy() {
        window.removeEventListener('keydown', this.boundHandlers.keydown);
        window.removeEventListener('keyup', this.boundHandlers.keyup);

        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseleave);
        this.canvas.removeEventListener('click', this.boundHandlers.click);

        this.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart);
        this.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove);
        this.canvas.removeEventListener('touchend', this.boundHandlers.touchend);
        this.canvas.removeEventListener('touchcancel', this.boundHandlers.touchcancel);

        this.boundHandlers = {};
        this.actions = {};
        this.reset();
    }
}
