export const BlockType = {
    STANDARD: 'standard',
    HARD: 'hard',
    UNBREAKABLE: 'unbreakable',
    EXPLOSIVE: 'explosive',
    MOVING: 'moving',
    INVISIBLE: 'invisible',
    REGENERATING: 'regenerating',
    MULTI_HIT: 'multiHit'
};

export const BlockConfig = {
    [BlockType.STANDARD]: {
        health: 1,
        points: 10,
        colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
                 '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39']
    },
    [BlockType.HARD]: {
        health: 3,
        points: 50,
        color: '#FF5722'
    },
    [BlockType.UNBREAKABLE]: {
        health: Infinity,
        points: 0,
        color: '#9E9E9E'
    },
    [BlockType.EXPLOSIVE]: {
        health: 1,
        points: 100,
        color: '#FF9800',
        explosionRadius: 1
    },
    [BlockType.MOVING]: {
        health: 1,
        points: 30,
        color: '#00BCD4',
        speed: 1.5
    },
    [BlockType.INVISIBLE]: {
        health: 1,
        points: 50,
        color: 'rgba(255, 255, 255, 0.1)',
        revealDistance: 100
    },
    [BlockType.REGENERATING]: {
        health: 1,
        points: 20,
        color: '#4CAF50',
        regenerateTime: 10000 // ms
    },
    [BlockType.MULTI_HIT]: {
        health: 5,
        points: 100,
        color: '#E91E63'
    }
};

export class Block {
    constructor(x, y, width, height, type = BlockType.STANDARD, colorIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.colorIndex = colorIndex;

        const config = BlockConfig[type];
        this.maxHealth = config.health;
        this.health = config.health;
        this.points = config.points;
        this.destroyed = false;

        // Type-specific properties
        this.movingDirection = 1;
        this.movingSpeed = config.speed || 0;
        this.initialX = x;
        this.movingRange = 100;
        this.visible = type !== BlockType.INVISIBLE;
        this.regenerateTimer = 0;
        this.isRegenerating = false;
        this.revealProgress = type === BlockType.INVISIBLE ? 0 : 1;

        // Animation time (accumulated, pauses when game pauses)
        this.animationTime = 0;
    }

    hit(damage = 1) {
        if (this.health === Infinity || this.destroyed) return false;

        this.health -= damage;

        if (this.health <= 0) {
            this.destroyed = true;
            return true; // Block destroyed
        }

        // Start regeneration timer for regenerating blocks
        if (this.type === BlockType.REGENERATING && this.health < this.maxHealth) {
            this.isRegenerating = false;
            this.regenerateTimer = 0;
        }

        return false; // Block still alive
    }

    update(deltaTime, ballX, ballY) {
        // Accumulate animation time (this pauses when game pauses)
        this.animationTime += deltaTime;

        // Moving block
        if (this.type === BlockType.MOVING && !this.destroyed) {
            this.x += this.movingSpeed * this.movingDirection;

            // Reverse direction at bounds
            if (this.x <= this.initialX - this.movingRange) {
                this.x = this.initialX - this.movingRange;
                this.movingDirection = 1;
            } else if (this.x >= this.initialX + this.movingRange) {
                this.x = this.initialX + this.movingRange;
                this.movingDirection = -1;
            }
        }

        // Invisible block reveal
        if (this.type === BlockType.INVISIBLE && !this.destroyed) {
            const dx = (this.x + this.width / 2) - ballX;
            const dy = (this.y + this.height / 2) - ballY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const revealDistance = BlockConfig[BlockType.INVISIBLE].revealDistance;

            if (distance < revealDistance) {
                this.visible = true;
                this.revealProgress = Math.min(1, 1 - (distance / revealDistance));
            } else {
                this.revealProgress = Math.max(0, this.revealProgress - 0.02);
                if (this.revealProgress <= 0) {
                    this.visible = false;
                }
            }
        }

        // Regenerating block
        if (this.type === BlockType.REGENERATING && !this.destroyed && this.health < this.maxHealth) {
            this.regenerateTimer += deltaTime;
            const regenTime = BlockConfig[BlockType.REGENERATING].regenerateTime;

            if (this.regenerateTimer >= regenTime) {
                this.health = this.maxHealth;
                this.regenerateTimer = 0;
                this.isRegenerating = false;
            } else if (this.regenerateTimer >= regenTime * 0.5) {
                this.isRegenerating = true;
            }
        }
    }

    render(ctx) {
        if (this.destroyed || (!this.visible && this.type === BlockType.INVISIBLE && this.revealProgress === 0)) {
            return;
        }

        ctx.save();

        const color = this.getColor();
        ctx.fillStyle = color;

        // Opacity for invisible blocks
        if (this.type === BlockType.INVISIBLE) {
            ctx.globalAlpha = 0.2 + (this.revealProgress * 0.8);
        }

        // Shadow effect
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;

        // Draw block
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Type-specific visuals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        switch (this.type) {
            case BlockType.HARD:
            case BlockType.MULTI_HIT:
                // Show health number
                ctx.fillText(this.health, centerX, centerY);
                break;

            case BlockType.UNBREAKABLE:
                ctx.fillText('▦', centerX, centerY);
                break;

            case BlockType.EXPLOSIVE:
                ctx.fillText('💥', centerX, centerY);
                break;

            case BlockType.MOVING:
                ctx.fillText('↔', centerX, centerY);
                break;

            case BlockType.INVISIBLE:
                if (this.visible) {
                    ctx.fillText('👻', centerX, centerY);
                }
                break;

            case BlockType.REGENERATING:
                if (this.isRegenerating) {
                    // Pulsing effect - use animationTime instead of Date.now() so it pauses correctly
                    const alpha = (Math.sin(this.animationTime / 200) + 1) / 2;
                    ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillText('♻', centerX, centerY);
                break;
        }

        ctx.restore();
    }

    getColor() {
        const config = BlockConfig[this.type];

        if (config.colors) {
            // Rainbow colors for standard blocks
            return config.colors[this.colorIndex % config.colors.length];
        } else if (this.type === BlockType.HARD || this.type === BlockType.MULTI_HIT) {
            // Color intensity based on health
            const healthPercent = this.health / this.maxHealth;
            const intensity = Math.floor(255 * healthPercent);
            return `rgb(${intensity}, ${Math.floor(intensity * 0.4)}, ${Math.floor(intensity * 0.2)})`;
        } else {
            return config.color;
        }
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

    getCollisionSide(ball) {
        const ballBounds = ball.getBounds();
        const blockBounds = this.getBounds();

        const dx = ballBounds.centerX - blockBounds.centerX;
        const dy = ballBounds.centerY - blockBounds.centerY;

        const width = (this.width + ball.radius * 2) / 2;
        const height = (this.height + ball.radius * 2) / 2;

        const crossWidth = width * dy;
        const crossHeight = height * dx;

        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
                return crossWidth > -crossHeight ? 'bottom' : 'left';
            } else {
                return crossWidth > -crossHeight ? 'right' : 'top';
            }
        }

        return null;
    }
}
