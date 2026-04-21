(function() {
    'use strict';

    class Bullet extends BaseEntity {
        constructor(game, config = {}) {
            super();
            this.game = game;
            
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.vx = config.vx || 0;
            this.vy = config.vy || 0;
            this.damage = config.damage || 10;
            this.isCrit = config.isCrit || false;
            this.radius = config.radius || 8;
            
            this.pierce = config.pierce || 0;
            this.pierceCount = 0;
            this.bounce = config.bounce || 0;
            this.bounceCount = 0;
            this.chainLightning = config.chainLightning || 0;
            this.splashRadius = config.splashRadius || 0;
            this.splashDamage = config.splashDamage || 0;
            this.homing = config.homing || false;
            this.burnChance = config.burnChance || 0;
            this.freezeChance = config.freezeChance || 0;
            this.blindChance = config.blindChance || 0;
            this.poisonChance = config.poisonChance || 0;
            this.maxRange = config.maxRange || null;
            this.traveledDistance = 0;
            this.enemiesHit = [];
            
            this.color = config.color || '#ffcc00';
            this.trail = [];
            this.glowIntensity = Math.random() * 0.3 + 0.7;
            this.glowPhase = Math.random() * Math.PI * 2;
        }

        update(dt, enemies = []) {
            if (this.homing && enemies.length > 0) {
                this.updateHoming(enemies, dt);
            }
            
            const startX = this.x;
            const startY = this.y;
            
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            const dx = this.x - startX;
            const dy = this.y - startY;
            this.traveledDistance += Math.sqrt(dx * dx + dy * dy);
            
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 15) {
                this.trail.shift();
            }
            
            for (const t of this.trail) {
                t.alpha = Math.max(0, t.alpha - dt * 3);
            }
            
            this.glowPhase += dt * 5;
            
            if (this.maxRange && this.traveledDistance >= this.maxRange) {
                this.active = false;
            }
        }

        updateHoming(enemies, dt) {
            if (enemies.length === 0) return;
            
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            for (const enemy of enemies) {
                if (enemy.isDestroyed) continue;
                if (this.enemiesHit.includes(enemy)) continue;
                
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
            
            if (nearestEnemy) {
                const targetAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const currentAngle = Math.atan2(this.vy, this.vx);
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                const turnRate = 0.1;
                const newAngle = currentAngle + angleDiff * turnRate;
                
                this.vx = Math.cos(newAngle) * speed;
                this.vy = Math.sin(newAngle) * speed;
            }
        }

        canHitEnemy(enemy) {
            if (enemy.isDestroyed) return false;
            if (this.enemiesHit.includes(enemy)) return false;
            return true;
        }

        onHitEnemy(enemy) {
            this.enemiesHit.push(enemy);
            
            if (this.pierce > 0 && this.pierceCount < this.pierce) {
                this.pierceCount++;
            } else {
                this.active = false;
            }
            
            if (this.splashRadius > 0 && this.splashDamage > 0) {
                return {
                    splash: true,
                    radius: this.splashRadius,
                    damage: this.splashDamage
                };
            }
            
            return null;
        }

        getStatusEffects() {
            const effects = {};
            
            if (this.burnChance > 0 && Math.random() < this.burnChance) {
                effects.burn = { damage: this.damage * 0.2, duration: 3 };
            }
            if (this.freezeChance > 0 && Math.random() < this.freezeChance) {
                effects.freeze = { duration: 1.5 };
            }
            if (this.blindChance > 0 && Math.random() < this.blindChance) {
                effects.blind = { duration: 2 };
            }
            if (this.poisonChance > 0 && Math.random() < this.poisonChance) {
                effects.poison = { damage: this.damage * 0.15, duration: 4 };
            }
            
            return effects;
        }

        shouldBounce(canvasWidth, canvasHeight) {
            if (this.bounceCount >= this.bounce) return false;
            
            return this.x < 0 || this.x > canvasWidth || 
                   this.y < 0 || this.y > canvasHeight;
        }

        bounce(canvasWidth, canvasHeight) {
            if (this.x < 0 || this.x > canvasWidth) {
                this.vx = -this.vx;
                this.x = Math.max(0, Math.min(canvasWidth, this.x));
            }
            if (this.y < 0 || this.y > canvasHeight) {
                this.vy = -this.vy;
                this.y = Math.max(0, Math.min(canvasHeight, this.y));
            }
            
            this.bounceCount++;
        }

        render(ctx) {
            this.renderTrail(ctx);
            this.renderBullet(ctx);
        }

        renderTrail(ctx) {
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const size = this.radius * (i + 1) / this.trail.length * 0.7;
                
                ctx.globalAlpha = t.alpha * 0.5;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        renderBullet(ctx) {
            const glowPulse = Math.sin(this.glowPhase) * 0.3 + 0.7;
            
            const glowGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * 3
            );
            
            if (this.isCrit) {
                glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * glowPulse})`);
                glowGradient.addColorStop(0.3, `rgba(255, 200, 0, ${0.3 * glowPulse})`);
                glowGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            } else {
                glowGradient.addColorStop(0, `rgba(255, 204, 0, ${0.4 * glowPulse})`);
                glowGradient.addColorStop(0.5, `rgba(255, 150, 0, ${0.2 * glowPulse})`);
                glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            }
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            const bodyGradient = ctx.createRadialGradient(
                this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
                this.x, this.y, this.radius
            );
            
            if (this.isCrit) {
                bodyGradient.addColorStop(0, '#fff');
                bodyGradient.addColorStop(0.5, '#ff0');
                bodyGradient.addColorStop(1, '#f80');
            } else {
                bodyGradient.addColorStop(0, '#fff');
                bodyGradient.addColorStop(0.5, this.color);
                bodyGradient.addColorStop(1, '#f80');
            }
            
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            if (this.isCrit) {
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 3;
                this.drawStar(ctx, this.x, this.y, 5, this.radius * 1.5, this.radius * 0.8);
            }
        }

        drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(
                    cx + Math.cos(rot) * outerRadius,
                    cy + Math.sin(rot) * outerRadius
                );
                rot += step;
                
                ctx.lineTo(
                    cx + Math.cos(rot) * innerRadius,
                    cy + Math.sin(rot) * innerRadius
                );
                rot += step;
            }
            
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.stroke();
        }
    }

    if (typeof window !== 'undefined') {
        window.Bullet = Bullet;
    }

})();
