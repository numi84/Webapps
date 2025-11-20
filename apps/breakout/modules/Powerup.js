export const PowerupType = {
    MULTI_BALL: 'multiBall',
    WIDE_PADDLE: 'widePaddle',
    NARROW_PADDLE: 'narrowPaddle',
    EXTRA_LIFE: 'extraLife',
    SCORE_MULTIPLIER: 'scoreMultiplier',
    SLOW_MOTION: 'slowMotion',
    STICKY_PADDLE: 'stickyPaddle',
    LASER: 'laser',
    FIREBALL: 'fireball',
    MAGNET: 'magnet',
    SHIELD: 'shield'
};

export const PowerupConfig = {
    [PowerupType.MULTI_BALL]: {
        duration: -1,
        color: '#2196F3',
        icon: '●●',
        name: 'Multi-Ball',
        ballCount: 3
    },
    [PowerupType.WIDE_PADDLE]: {
        duration: 20000,
        color: '#4CAF50',
        icon: '↔',
        name: 'Breiter Schläger'
    },
    [PowerupType.NARROW_PADDLE]: {
        duration: 15000,
        color: '#F44336',
        icon: '↔',
        name: 'Schmaler Schläger',
        pointsMultiplier: 2
    },
    [PowerupType.EXTRA_LIFE]: {
        duration: 0,
        color: '#E91E63',
        icon: '❤',
        name: 'Extra Leben'
    },
    [PowerupType.SCORE_MULTIPLIER]: {
        duration: 15000,
        color: '#FFD700',
        icon: '⭐',
        name: 'Score Bonus',
        multipliers: [2, 3, 5]
    },
    [PowerupType.SLOW_MOTION]: {
        duration: 10000,
        color: '#00BCD4',
        icon: '⏱',
        name: 'Zeitlupe',
        speedMultiplier: 0.5
    },
    [PowerupType.STICKY_PADDLE]: {
        duration: 30000,
        color: '#9C27B0',
        icon: '🎯',
        name: 'Klebriger Schläger'
    },
    [PowerupType.LASER]: {
        duration: 20000,
        color: '#FF5722',
        icon: '🔫',
        name: 'Laser',
        shots: 10
    },
    [PowerupType.FIREBALL]: {
        duration: 15000,
        color: '#FF6F00',
        icon: '🔥',
        name: 'Feuerball'
    },
    [PowerupType.MAGNET]: {
        duration: 20000,
        color: '#757575',
        icon: '🧲',
        name: 'Magnet',
        attractionForce: 0.3
    },
    [PowerupType.SHIELD]: {
        duration: -1,
        color: '#00E5FF',
        icon: '🛡',
        name: 'Schutzschild'
    }
};

export class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.fallSpeed = 3;
        this.collected = false;
        this.active = false;

        const config = PowerupConfig[type];
        this.duration = config.duration;
        this.color = config.color;
        this.icon = config.icon;
        this.name = config.name;
        this.timeRemaining = config.duration;
        this.startTime = 0;
    }

    update(deltaTime) {
        if (this.collected) {
            if (this.active && this.duration > 0) {
                this.timeRemaining -= deltaTime;
                if (this.timeRemaining <= 0) {
                    this.active = false;
                    return false; // Powerup expired
                }
            }
            return true; // Still active or permanent
        }

        // Fall down
        this.y += this.fallSpeed;
        return true;
    }

    render(ctx) {
        if (this.collected) return;

        ctx.save();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Draw capsule
        ctx.fillStyle = this.color;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2);

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

    activate(game) {
        this.collected = true;
        this.active = true;
        this.startTime = Date.now();

        const config = PowerupConfig[this.type];

        switch (this.type) {
            case PowerupType.MULTI_BALL:
                game.spawnMultiBalls(config.ballCount);
                break;

            case PowerupType.WIDE_PADDLE:
                game.paddle.increaseSizeLevel();
                break;

            case PowerupType.NARROW_PADDLE:
                game.paddle.decreaseSizeLevel();
                game.scoreMultiplier *= config.pointsMultiplier;
                break;

            case PowerupType.EXTRA_LIFE:
                game.addLife();
                this.active = false;
                break;

            case PowerupType.SCORE_MULTIPLIER:
                const multiplier = config.multipliers[Math.floor(Math.random() * config.multipliers.length)];
                game.scoreMultiplier *= multiplier;
                this.multiplierValue = multiplier;
                break;

            case PowerupType.SLOW_MOTION:
                game.balls.forEach(ball => ball.setSpeed(ball.speed * config.speedMultiplier));
                this.originalSpeed = game.balls[0].speed / config.speedMultiplier;
                break;

            case PowerupType.STICKY_PADDLE:
                game.paddle.isSticky = true;
                break;

            case PowerupType.LASER:
                game.paddle.hasLaser = true;
                game.paddle.laserShots = config.shots;
                break;

            case PowerupType.FIREBALL:
                game.balls.forEach(ball => ball.isFireball = true);
                break;

            case PowerupType.MAGNET:
                game.balls.forEach(ball => ball.isMagnetic = true);
                this.attractionForce = config.attractionForce;
                break;

            case PowerupType.SHIELD:
                game.paddle.hasShield = true;
                this.active = true; // Will be deactivated when used
                break;
        }
    }

    deactivate(game) {
        const config = PowerupConfig[this.type];

        switch (this.type) {
            case PowerupType.WIDE_PADDLE:
                game.paddle.decreaseSizeLevel();
                break;

            case PowerupType.NARROW_PADDLE:
                game.paddle.increaseSizeLevel();
                if (config.pointsMultiplier) {
                    game.scoreMultiplier /= config.pointsMultiplier;
                }
                break;

            case PowerupType.SCORE_MULTIPLIER:
                game.scoreMultiplier /= this.multiplierValue;
                break;

            case PowerupType.SLOW_MOTION:
                game.balls.forEach(ball => {
                    if (this.originalSpeed) {
                        ball.setSpeed(this.originalSpeed);
                    }
                });
                break;

            case PowerupType.STICKY_PADDLE:
                game.paddle.isSticky = false;
                break;

            case PowerupType.LASER:
                game.paddle.hasLaser = false;
                game.paddle.laserShots = 0;
                break;

            case PowerupType.FIREBALL:
                game.balls.forEach(ball => ball.isFireball = false);
                break;

            case PowerupType.MAGNET:
                game.balls.forEach(ball => ball.isMagnetic = false);
                break;

            case PowerupType.SHIELD:
                game.paddle.hasShield = false;
                break;
        }

        this.active = false;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    checkCollision(paddle) {
        const pBounds = paddle.getBounds();
        const bounds = this.getBounds();

        return bounds.x < pBounds.x + pBounds.width &&
               bounds.x + bounds.width > pBounds.x &&
               bounds.y < pBounds.y + pBounds.height &&
               bounds.y + bounds.height > pBounds.y;
    }

    getTimeRemainingPercent() {
        if (this.duration <= 0) return 100;
        return (this.timeRemaining / this.duration) * 100;
    }

    extendDuration() {
        // Add full duration to remaining time
        if (this.duration > 0) {
            this.timeRemaining += this.duration;
        }
    }
}

export class Laser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 8;
        this.active = true;
        this.color = '#FF5722';
    }

    update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
