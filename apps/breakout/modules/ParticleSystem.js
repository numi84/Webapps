class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1000;
        this.size = 3;
        this.color = '#FFF';
        this.alpha = 1;
        this.active = false;
        this.gravity = 0.1;
        this.friction = 0.98;
    }

    init(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.alpha = 1;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;

        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor(maxParticles = 200) {
        this.particles = [];
        this.maxParticles = maxParticles;

        // Pre-create particle pool
        for (let i = 0; i < maxParticles; i++) {
            this.particles.push(new Particle());
        }

        // Track next likely inactive particle index for O(1) average case
        this.nextInactiveHint = 0;
    }

    emit(x, y, count, config = {}) {
        const {
            color = '#FFF',
            minSize = 2,
            maxSize = 6,
            minSpeed = 1,
            maxSpeed = 4,
            life = 1000,
            spread = Math.PI * 2,
            direction = 0
        } = config;

        for (let i = 0; i < count; i++) {
            const particle = this.getInactiveParticle();
            if (!particle) break;

            const angle = direction + (Math.random() - 0.5) * spread;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = minSize + Math.random() * (maxSize - minSize);

            particle.init(x, y, vx, vy, color, size, life);
        }
    }

    emitExplosion(x, y, color = '#FF9800') {
        this.emit(x, y, 30, {
            color,
            minSize: 3,
            maxSize: 8,
            minSpeed: 2,
            maxSpeed: 6,
            life: 800
        });
    }

    emitBlockDestruction(x, y, color) {
        this.emit(x, y, 15, {
            color,
            minSize: 2,
            maxSize: 5,
            minSpeed: 1,
            maxSpeed: 4,
            life: 600
        });
    }

    emitPowerupCollect(x, y, color) {
        this.emit(x, y, 20, {
            color,
            minSize: 2,
            maxSize: 6,
            minSpeed: 2,
            maxSpeed: 5,
            life: 1000,
            spread: Math.PI * 2
        });
    }

    emitCombo(x, y, comboLevel) {
        const colors = ['#FFD700', '#FF4500', '#FF1493', '#00FF00'];
        const color = colors[Math.min(comboLevel - 1, colors.length - 1)];

        this.emit(x, y, comboLevel * 5, {
            color,
            minSize: 3,
            maxSize: 7,
            minSpeed: 3,
            maxSpeed: 6,
            life: 1200,
            direction: -Math.PI / 2,
            spread: Math.PI / 3
        });
    }

    emitTrail(x, y, color = '#FFF') {
        this.emit(x, y, 1, {
            color,
            minSize: 1,
            maxSize: 3,
            minSpeed: 0,
            maxSpeed: 0.5,
            life: 300
        });
    }

    getInactiveParticle() {
        // Start from hint index for O(1) average case
        const len = this.particles.length;

        for (let i = 0; i < len; i++) {
            const idx = (this.nextInactiveHint + i) % len;
            if (!this.particles[idx].active) {
                // Update hint for next search
                this.nextInactiveHint = (idx + 1) % len;
                return this.particles[idx];
            }
        }

        return null; // No inactive particles available
    }

    update(deltaTime) {
        for (const particle of this.particles) {
            if (particle.active) {
                particle.update(deltaTime);
            }
        }
    }

    render(ctx) {
        for (const particle of this.particles) {
            if (particle.active) {
                particle.render(ctx);
            }
        }
    }

    clear() {
        for (const particle of this.particles) {
            particle.reset();
        }
    }

    getActiveCount() {
        return this.particles.filter(p => p.active).length;
    }
}

// Background particles for dynamic backgrounds
export class BackgroundParticle {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = 1 + Math.random() * 3;
        this.alpha = 0.2 + Math.random() * 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
