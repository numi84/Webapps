export class Ball {
    constructor(x, y, radius = 8, speed = 5) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.color = '#FFFFFF';
        this.active = false;
        this.trail = [];
        this.maxTrailLength = 10;

        // Special states
        this.isFireball = false;
        this.isSticky = false;
        this.isMagnetic = false;
        this.stuckToPaddle = false;
        this.paddleOffset = 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.active = false;
        this.trail = [];
        this.isFireball = false;
        this.isSticky = false;
    }

    launch(angle = -Math.PI / 4) {
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        this.active = true;
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        if (!this.active) return;

        // Store trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Wall collisions (left, right, top)
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
        } else if (this.x + this.radius >= canvasWidth) {
            this.x = canvasWidth - this.radius;
            this.dx = -Math.abs(this.dx);
        }

        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy);
        }

        // Return true if ball went below canvas (lost)
        return this.y - this.radius > canvasHeight;
    }

    render(ctx, showTrail = true) {
        // Draw trail
        if (showTrail && this.trail.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = (i + 1) / this.trail.length * 0.5;
                const size = this.radius * ((i + 1) / this.trail.length);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw ball
        ctx.save();

        // Glow effect for special states
        if (this.isFireball) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FF6F00';
            this.color = '#FF6F00';
        } else if (this.isMagnetic) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#757575';
            this.color = '#AAAAAA';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    reverseX() {
        this.dx = -this.dx;
    }

    reverseY() {
        this.dy = -this.dy;
    }

    setVelocity(dx, dy) {
        this.dx = dx;
        this.dy = dy;
    }

    setSpeed(speed) {
        const angle = Math.atan2(this.dy, this.dx);
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
        this.speed = speed;
    }

    increaseSpeed(amount = 0.5) {
        this.speed = Math.min(this.speed + amount, 12); // Max speed 12
        this.setSpeed(this.speed);
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
            centerX: this.x,
            centerY: this.y
        };
    }
}
