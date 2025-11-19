export class Paddle {
    constructor(x, y, width = 100, height = 15) {
        this.x = x;
        this.y = y;
        this.baseWidth = width;
        this.width = width;
        this.height = height;
        this.speed = 8;
        this.color = '#4CAF50';
        this.targetX = x;
        this.lastX = x;

        // Special states
        this.hasLaser = false;
        this.laserShots = 0;
        this.hasShield = false;
        this.isSticky = false;
        this.stickyBall = null;
    }

    update(input, canvasWidth, deltaTime) {
        // Store last position for velocity calculation
        this.lastX = this.x;

        // Mouse/touch control
        if (input.mouse.active) {
            this.targetX = input.mouse.x - this.width / 2;
        }
        // Keyboard control
        else if (input.isKeyDown('ArrowLeft')) {
            this.targetX -= this.speed;
        } else if (input.isKeyDown('ArrowRight')) {
            this.targetX += this.speed;
        }

        // Smooth movement
        const diff = this.targetX - this.x;
        this.x += diff * 0.2;

        // Keep within bounds
        this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
    }

    render(ctx) {
        ctx.save();

        // Shield effect
        if (this.hasShield) {
            ctx.strokeStyle = '#00E5FF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00E5FF';
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        }

        // Main paddle
        if (this.hasLaser) {
            // Gradient for laser paddle
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
            gradient.addColorStop(0, '#FF5722');
            gradient.addColorStop(0.5, '#FF9800');
            gradient.addColorStop(1, '#FF5722');
            ctx.fillStyle = gradient;
        } else if (this.isSticky) {
            ctx.fillStyle = '#9C27B0';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;

        // Draw paddle with rounded corners
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 5);
        ctx.fill();

        // Laser cannons visual
        if (this.hasLaser) {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.arc(this.x + this.width - 10, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    setWidth(multiplier) {
        this.width = this.baseWidth * multiplier;
    }

    resetWidth() {
        this.width = this.baseWidth;
    }

    shoot() {
        if (this.hasLaser && this.laserShots > 0) {
            this.laserShots--;
            return [
                { x: this.x + 10, y: this.y },
                { x: this.x + this.width - 10, y: this.y }
            ];
        }
        return null;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            centerX: this.x + this.width / 2,
            centerY: this.y + this.height / 2
        };
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}
