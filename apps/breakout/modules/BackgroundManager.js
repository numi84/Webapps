import { BackgroundParticle } from './ParticleSystem.js';

export class BackgroundManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = 'gradient';
        this.animated = true;
        this.time = 0;
        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push(new BackgroundParticle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                this.canvas
            ));
        }
    }

    setType(type) {
        this.type = type;
        if (type === 'particles') {
            this.initParticles();
        }
    }

    setAnimated(animated) {
        this.animated = animated;
    }

    update(deltaTime) {
        if (!this.animated) return;

        this.time += deltaTime * 0.001; // Convert to seconds

        if (this.type === 'particles') {
            this.particles.forEach(p => p.update());
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        switch (this.type) {
            case 'solid':
                this.renderSolid(ctx, w, h);
                break;

            case 'gradient':
                this.renderGradient(ctx, w, h);
                break;

            case 'space':
                this.renderSpace(ctx, w, h);
                break;

            case 'underwater':
                this.renderUnderwater(ctx, w, h);
                break;

            case 'retro':
                this.renderRetro(ctx, w, h);
                break;

            case 'particles':
                this.renderParticles(ctx, w, h);
                break;

            default:
                this.renderGradient(ctx, w, h);
        }
    }

    renderSolid(ctx, w, h) {
        ctx.fillStyle = '#0f0f1e';
        ctx.fillRect(0, 0, w, h);
    }

    renderGradient(ctx, w, h) {
        let gradient;

        if (this.animated) {
            const hue1 = (this.time * 20) % 360;
            const hue2 = (hue1 + 60) % 360;
            gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, `hsl(${hue1}, 70%, 15%)`);
            gradient.addColorStop(1, `hsl(${hue2}, 70%, 10%)`);
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#0f0f1e');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    renderSpace(ctx, w, h) {
        // Dark space background
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, w, h);

        // Stars
        ctx.fillStyle = '#FFF';
        const starCount = this.animated ? 100 : 50;

        for (let i = 0; i < starCount; i++) {
            const x = (i * 73) % w;
            const y = (i * 97 + (this.animated ? this.time * 10 : 0)) % h;
            const size = (i % 3) * 0.5 + 0.5;
            const alpha = this.animated ? 0.3 + Math.sin(this.time + i) * 0.3 : 0.6;

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nebula effect
        if (this.animated) {
            const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.1)');
            gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.05)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.globalAlpha = 0.5 + Math.sin(this.time) * 0.2;
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.globalAlpha = 1;
    }

    renderUnderwater(ctx, w, h) {
        // Blue gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#001f3f');
        gradient.addColorStop(1, '#003366');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Bubbles
        if (this.animated) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 20; i++) {
                const x = (i * 53 + this.time * 30) % w;
                const y = h - ((this.time * 50 + i * 100) % h);
                const size = 3 + (i % 5);

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Light rays
        ctx.save();
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const x = (w / 5) * i + (this.animated ? Math.sin(this.time + i) * 50 : 0);
            const rayGradient = ctx.createLinearGradient(x, 0, x + 50, h);
            rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            rayGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rayGradient;
            ctx.fillRect(x, 0, 50, h);
        }
        ctx.restore();
    }

    renderRetro(ctx, w, h) {
        // Purple/pink gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#2d1b69');
        gradient.addColorStop(1, '#0f0520');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        const offset = this.animated ? (this.time * 50) % 50 : 0;

        // Horizontal lines
        for (let y = offset; y < h; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Perspective grid
        ctx.save();
        ctx.translate(w / 2, h * 0.8);

        for (let i = -5; i <= 5; i++) {
            const x = i * 100;
            ctx.beginPath();
            ctx.moveTo(x, offset);
            ctx.lineTo(x * 3, 300);
            ctx.stroke();
        }

        for (let y = offset; y < 300; y += 50) {
            ctx.beginPath();
            ctx.moveTo(-500, y);
            ctx.lineTo(500, y);
            ctx.stroke();
        }

        ctx.restore();

        // Sun/moon
        if (this.animated) {
            const sunY = h * 0.6 + Math.sin(this.time * 0.5) * 20;
            const gradient = ctx.createRadialGradient(w / 2, sunY, 0, w / 2, sunY, 80);
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.5, '#ff0080');
            gradient.addColorStop(1, 'rgba(255, 0, 128, 0)');

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(w / 2, sunY, 80, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    renderParticles(ctx, w, h) {
        // Dark background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, w, h);

        // Render particles
        this.particles.forEach(p => p.render(ctx));
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.type === 'particles') {
            this.initParticles();
        }
    }
}
