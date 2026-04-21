(function() {
    'use strict';

    class Enemy extends BaseEntity {
        constructor(game, config = {}) {
            super();
            this.game = game;
            
            this.type = config.type || 'dragon';
            this.health = config.health || 100;
            this.maxHealth = config.health || 100;
            this.speed = config.speed || 0.8;
            this.damage = config.damage || 5;
            this.goldValue = config.goldValue || 10;
            this.scoreValue = config.scoreValue || 100;
            this.xpValue = config.xpValue || 10;
            
            this.radius = config.radius || 40;
            this.segments = config.segments || 10;
            this.path = config.path || [];
            this.pathIndex = 0;
            this.pathProgress = 0;
            
            this.color = config.color || '#ff4444';
            this.isBoss = config.isBoss || false;
            
            this.activeEffects = [];
            this.isSlowed = false;
            this.slowTimer = 0;
            this.isBurning = false;
            this.burnTimer = 0;
            this.burnDamage = 0;
            this.isPoisoned = false;
            this.poisonTimer = 0;
            this.poisonDamage = 0;
            this.isFrozen = false;
            this.frozenTimer = 0;
            this.isBlinded = false;
            this.blindTimer = 0;
            this.isStunned = false;
            this.stunTimer = 0;
            
            this.iceSlowed = false;
            this.iceSlowTimer = 0;
            
            this.destroyedSegments = [];
            this.isDestroyed = false;
            this.destroyTimer = 0;
            this.explosionRadius = 0;
            
            this.flashTimer = 0;
            this.isFlashing = false;
            
            this.bodySegments = [];
            this.initBodySegments();
            
            this.angle = 0;
            this.wavePhase = Math.random() * Math.PI * 2;
        }

        initBodySegments() {
            this.bodySegments = [];
            for (let i = 0; i < this.segments; i++) {
                this.bodySegments.push({
                    offsetX: 0,
                    offsetY: 0,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        setPath(path) {
            this.path = path;
            this.pathIndex = 0;
            this.pathProgress = 0;
            
            if (this.path.length > 0) {
                this.x = this.path[0].x;
                this.y = this.path[0].y;
            }
        }

        update(dt, currentTime) {
            if (this.isDestroyed) {
                this.destroyTimer += dt;
                this.explosionRadius += dt * 200;
                return;
            }
            
            this.updateStatusEffects(dt);
            this.updatePathMovement(dt);
            this.updateWaveAnimation(dt, currentTime);
            
            if (this.iceSlowed) {
                this.iceSlowTimer -= dt;
                if (this.iceSlowTimer <= 0) {
                    this.iceSlowed = false;
                }
            }
            
            if (this.isFlashing) {
                this.flashTimer -= dt;
                if (this.flashTimer <= 0) {
                    this.isFlashing = false;
                }
            }
        }

        updateStatusEffects(dt) {
            if (this.isSlowed) {
                this.slowTimer -= dt;
                if (this.slowTimer <= 0) {
                    this.isSlowed = false;
                }
            }
            
            if (this.isBurning) {
                this.burnTimer -= dt;
                this.takeDamage(this.burnDamage * dt);
                if (this.burnTimer <= 0) {
                    this.isBurning = false;
                    this.burnDamage = 0;
                }
            }
            
            if (this.isPoisoned) {
                this.poisonTimer -= dt;
                this.takeDamage(this.poisonDamage * dt);
                if (this.poisonTimer <= 0) {
                    this.isPoisoned = false;
                    this.poisonDamage = 0;
                }
            }
            
            if (this.isFrozen) {
                this.frozenTimer -= dt;
                if (this.frozenTimer <= 0) {
                    this.isFrozen = false;
                }
            }
            
            if (this.isBlinded) {
                this.blindTimer -= dt;
                if (this.blindTimer <= 0) {
                    this.isBlinded = false;
                }
            }
            
            if (this.isStunned) {
                this.stunTimer -= dt;
                if (this.stunTimer <= 0) {
                    this.isStunned = false;
                }
            }
        }

        updatePathMovement(dt) {
            if (this.isStunned || this.isFrozen) return;
            
            if (this.path.length < 2) return;
            
            let actualSpeed = this.speed;
            
            if (this.isSlowed) {
                actualSpeed *= 0.5;
            }
            if (this.iceSlowed) {
                actualSpeed *= 0.7;
            }
            
            const currentPoint = this.path[this.pathIndex];
            const nextPoint = this.path[Math.min(this.pathIndex + 1, this.path.length - 1)];
            
            const dx = nextPoint.x - currentPoint.x;
            const dy = nextPoint.y - currentPoint.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            
            if (segmentLength > 0) {
                this.pathProgress += (actualSpeed * dt * 60) / segmentLength;
                
                while (this.pathProgress >= 1 && this.pathIndex < this.path.length - 2) {
                    this.pathProgress -= 1;
                    this.pathIndex++;
                }
                
                const t = Math.min(1, this.pathProgress);
                const currentIdx = Math.min(this.pathIndex, this.path.length - 2);
                const nextIdx = Math.min(currentIdx + 1, this.path.length - 1);
                
                const p1 = this.path[currentIdx];
                const p2 = this.path[nextIdx];
                
                this.x = p1.x + (p2.x - p1.x) * t;
                this.y = p1.y + (p2.y - p1.y) * t;
                
                this.angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            }
            
            if (this.pathIndex >= this.path.length - 2 && this.pathProgress >= 1) {
                this.onReachEnd();
            }
        }

        updateWaveAnimation(dt, currentTime) {
            this.wavePhase += dt * 3;
            
            for (let i = 0; i < this.bodySegments.length; i++) {
                const seg = this.bodySegments[i];
                seg.phase += dt * (2 + i * 0.1);
                seg.offsetY = Math.sin(seg.phase) * (5 + i * 0.5);
            }
        }

        takeDamage(amount) {
            if (this.isDestroyed) return false;
            
            this.health -= amount;
            this.isFlashing = true;
            this.flashTimer = 0.1;
            
            if (this.health <= 0) {
                this.health = 0;
                this.isDestroyed = true;
                this.destroyTimer = 0;
                return true;
            }
            
            return false;
        }

        applyBurn(damage, duration) {
            this.isBurning = true;
            this.burnDamage = Math.max(this.burnDamage, damage);
            this.burnTimer = Math.max(this.burnTimer, duration);
        }

        applyFreeze(duration) {
            this.isFrozen = true;
            this.frozenTimer = Math.max(this.frozenTimer, duration);
        }

        applyPoison(damage, duration) {
            this.isPoisoned = true;
            this.poisonDamage = Math.max(this.poisonDamage, damage);
            this.poisonTimer = Math.max(this.poisonTimer, duration);
        }

        applySlow(amount, duration) {
            this.isSlowed = true;
            this.slowTimer = Math.max(this.slowTimer, duration);
        }

        applyStun(duration) {
            this.isStunned = true;
            this.stunTimer = Math.max(this.stunTimer, duration);
        }

        applyBlind(duration) {
            this.isBlinded = true;
            this.blindTimer = Math.max(this.blindTimer, duration);
        }

        onReachEnd() {
            if (this.game && this.game.damagePlayer) {
                this.game.damagePlayer(this.damage);
            }
            this.isDestroyed = true;
        }

        getHealthPercent() {
            return this.health / this.maxHealth;
        }

        hasStatusEffect() {
            return this.isSlowed || this.isBurning || this.isPoisoned || 
                   this.isFrozen || this.isBlinded || this.isStunned;
        }

        render(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.isDestroyed) {
                this.renderDestroyed(ctx);
                ctx.restore();
                return;
            }
            
            this.renderHealthBar(ctx);
            this.renderBody(ctx);
            this.renderStatusEffects(ctx);
            
            ctx.restore();
        }

        renderHealthBar(ctx) {
            const barWidth = this.radius * 2;
            const barHeight = 6;
            const barX = -barWidth / 2;
            const barY = -this.radius - 15;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const healthPercent = this.getHealthPercent();
            let barColor = '#44ff44';
            if (healthPercent < 0.3) {
                barColor = '#ff4444';
            } else if (healthPercent < 0.6) {
                barColor = '#ffaa00';
            }
            
            ctx.fillStyle = barColor;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }

        renderBody(ctx) {
            if (this.isFlashing) {
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = this.color;
            }
            
            if (this.isFrozen) {
                ctx.fillStyle = '#88ccff';
            }
            
            this.renderDragonBody(ctx);
        }

        renderDragonBody(ctx) {
            const segmentCount = this.bodySegments.length;
            const segmentSpacing = this.radius * 0.6;
            
            for (let i = segmentCount - 1; i >= 0; i--) {
                const seg = this.bodySegments[i];
                const offsetX = -i * segmentSpacing;
                const offsetY = seg.offsetY;
                const size = this.radius * (0.8 - i * 0.03);
                
                const gradient = ctx.createRadialGradient(
                    offsetX, offsetY, 0,
                    offsetX, offsetY, size
                );
                
                if (this.isFlashing) {
                    gradient.addColorStop(0, '#fff');
                    gradient.addColorStop(1, '#ccc');
                } else if (this.isFrozen) {
                    gradient.addColorStop(0, '#aaddff');
                    gradient.addColorStop(1, '#6699cc');
                } else {
                    gradient.addColorStop(0, this.lightenColor(this.color, 30));
                    gradient.addColorStop(1, this.color);
                }
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const headGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, this.radius);
            if (this.isFlashing) {
                headGradient.addColorStop(0, '#fff');
                headGradient.addColorStop(1, '#ccc');
            } else if (this.isFrozen) {
                headGradient.addColorStop(0, '#bbddff');
                headGradient.addColorStop(1, '#6699cc');
            } else {
                headGradient.addColorStop(0, this.lightenColor(this.color, 40));
                headGradient.addColorStop(1, this.color);
            }
            
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = this.isFrozen ? '#fff' : '#ff0';
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, -this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
            ctx.arc(this.radius * 0.4, this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.radius * 0.45, -this.radius * 0.2, this.radius * 0.08, 0, Math.PI * 2);
            ctx.arc(this.radius * 0.45, this.radius * 0.2, this.radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.isBoss) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        renderStatusEffects(ctx) {
            let effectCount = 0;
            
            if (this.isBurning) {
                this.renderEffectIcon(ctx, '🔥', effectCount++);
            }
            if (this.isFrozen) {
                this.renderEffectIcon(ctx, '❄️', effectCount++);
            }
            if (this.isPoisoned) {
                this.renderEffectIcon(ctx, '☠️', effectCount++);
            }
            if (this.isSlowed) {
                this.renderEffectIcon(ctx, '🐌', effectCount++);
            }
            if (this.isStunned) {
                this.renderEffectIcon(ctx, '💫', effectCount++);
            }
        }

        renderEffectIcon(ctx, icon, index) {
            const startX = -this.radius;
            const startY = this.radius + 15;
            const spacing = 20;
            
            ctx.font = '14px Arial';
            ctx.fillText(icon, startX + index * spacing, startY);
        }

        renderDestroyed(ctx) {
            const alpha = Math.max(0, 1 - this.destroyTimer * 2);
            
            ctx.globalAlpha = alpha;
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.explosionRadius);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.explosionRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        }

        lightenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (
                0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 1 ? 0 : B) : 255)
            ).toString(16).slice(1);
        }
    }

    if (typeof window !== 'undefined') {
        window.Enemy = Enemy;
    }

})();
