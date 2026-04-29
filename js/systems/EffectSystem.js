(function() {
    'use strict';

    class EffectSystem extends BaseSystem {
        constructor() {
            super();
            this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
            this.bulletTrails = [];
            this.glowEffects = [];
            this.floatingTexts = [];
            this.deathExplosions = [];
            this.damageNumbers = [];
        }

        setGame(game) {
            super.setGame(game);
        }

        addScreenShake(intensity, duration = 0.3) {
            this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
            this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        }

        updateScreenShake(dt) {
            if (this.screenShake.duration > 0) {
                this.screenShake.duration -= dt;
                
                const shakeAmount = this.screenShake.intensity * (this.screenShake.duration / 0.3);
                this.screenShake.x = (Math.random() - 0.5) * shakeAmount * 2;
                this.screenShake.y = (Math.random() - 0.5) * shakeAmount * 2;
                
                if (this.screenShake.duration <= 0) {
                    this.screenShake.x = 0;
                    this.screenShake.y = 0;
                    this.screenShake.intensity = 0;
                }
            }
        }

        applyScreenShake(ctx) {
            if (this.screenShake.x !== 0 || this.screenShake.y !== 0) {
                ctx.translate(this.screenShake.x, this.screenShake.y);
            }
        }

        createBulletTrail(x, y, color = '#ffcc00', size = 8) {
            this.bulletTrails.push({
                x: x,
                y: y,
                color: color,
                size: size,
                alpha: 1,
                life: 0.15
            });
        }

        updateBulletTrails(dt) {
            for (let i = this.bulletTrails.length - 1; i >= 0; i--) {
                const trail = this.bulletTrails[i];
                trail.life -= dt;
                trail.alpha = trail.life / 0.15;
                
                if (trail.life <= 0) {
                    this.bulletTrails.splice(i, 1);
                }
            }
        }

        drawBulletTrails(ctx) {
            for (const trail of this.bulletTrails) {
                ctx.globalAlpha = trail.alpha;
                ctx.fillStyle = trail.color;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, trail.size * trail.alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        createDeathExplosion(x, y, color = '#ff8800', radius = 60) {
            this.deathExplosions.push({
                x: x,
                y: y,
                color: color,
                radius: radius,
                currentRadius: 0,
                alpha: 1,
                life: 0.5,
                particles: []
            });
            
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2;
                const speed = 100 + Math.random() * 100;
                this.deathExplosions[this.deathExplosions.length - 1].particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 5 + Math.random() * 5,
                    alpha: 1
                });
            }
        }

        createCritEffect(x, y, damage) {
            this.glowEffects.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 80,
                alpha: 1,
                life: 0.4,
                color: '#ffd700'
            });
            
            this.addFloatingText(
                x, y - 30,
                `暴击! ${Math.floor(damage)}`,
                '#ffd700',
                28,
                1.2
            );
        }

        updateDeathExplosions(dt) {
            for (let i = this.deathExplosions.length - 1; i >= 0; i--) {
                const exp = this.deathExplosions[i];
                exp.life -= dt;
                exp.alpha = exp.life / 0.5;
                exp.currentRadius = exp.radius * (1 - exp.alpha);
                
                for (const p of exp.particles) {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.alpha = exp.alpha;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                }
                
                if (exp.life <= 0) {
                    this.deathExplosions.splice(i, 1);
                }
            }
        }

        drawDeathExplosions(ctx) {
            for (const exp of this.deathExplosions) {
                const gradient = ctx.createRadialGradient(
                    exp.x, exp.y, 0,
                    exp.x, exp.y, exp.currentRadius
                );
                gradient.addColorStop(0, `rgba(255, 255, 200, ${exp.alpha})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 100, ${exp.alpha * 0.8})`);
                gradient.addColorStop(0.6, `rgba(255, 100, 50, ${exp.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, exp.currentRadius, 0, Math.PI * 2);
                ctx.fill();
                
                for (const p of exp.particles) {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = exp.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        }

        addFloatingText(x, y, text, color = '#fff', size = 20, scale = 1) {
            this.floatingTexts.push({
                x: x,
                y: y,
                text: text,
                color: color,
                size: size,
                scale: scale,
                alpha: 1,
                life: 1.5,
                vy: -60,
                vx: (Math.random() - 0.5) * 40,
                scalePhase: 0
            });
        }

        updateFloatingTexts(dt) {
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const text = this.floatingTexts[i];
                text.life -= dt;
                text.alpha = Math.max(0, text.life / 1.5);
                text.y += text.vy * dt;
                text.x += text.vx * dt;
                text.scalePhase += dt * 10;
                
                if (text.life <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        drawFloatingTexts(ctx) {
            for (const text of this.floatingTexts) {
                const pulseScale = 1 + Math.sin(text.scalePhase) * 0.1;
                const finalScale = text.scale * pulseScale;
                
                ctx.save();
                ctx.translate(text.x, text.y);
                ctx.scale(finalScale, finalScale);
                ctx.globalAlpha = text.alpha;
                
                ctx.font = `bold ${text.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 4;
                ctx.strokeText(text.text, 0, 0);
                
                ctx.fillStyle = text.color;
                ctx.fillText(text.text, 0, 0);
                
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        addGlowEffect(x, y, color = '#ffd700', radius = 60, duration = 0.3) {
            this.glowEffects.push({
                x: x,
                y: y,
                color: color,
                radius: 0,
                maxRadius: radius,
                alpha: 1,
                life: duration
            });
        }

        updateGlowEffects(dt) {
            for (let i = this.glowEffects.length - 1; i >= 0; i--) {
                const glow = this.glowEffects[i];
                glow.life -= dt;
                glow.alpha = glow.life / 0.3;
                glow.radius = glow.maxRadius * (1 - glow.alpha);
                
                if (glow.life <= 0) {
                    this.glowEffects.splice(i, 1);
                }
            }
        }

        drawGlowEffects(ctx) {
            for (const glow of this.glowEffects) {
                const gradient = ctx.createRadialGradient(
                    glow.x, glow.y, 0,
                    glow.x, glow.y, glow.radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 200, ${glow.alpha * 0.6})`);
                gradient.addColorStop(0.5, `rgba(255, 200, 100, ${glow.alpha * 0.3})`);
                gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        addDamageNumber(x, y, damage, isCrit = false, isHeal = false) {
            this.damageNumbers.push({
                x: x,
                y: y,
                damage: damage,
                isCrit: isCrit,
                isHeal: isHeal,
                alpha: 1,
                life: 1,
                vy: -50,
                scale: isCrit ? 1.5 : 1,
                scalePhase: 0
            });
        }

        updateDamageNumbers(dt) {
            for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
                const num = this.damageNumbers[i];
                num.life -= dt;
                num.alpha = Math.max(0, num.life);
                num.y += num.vy * dt;
                num.scalePhase += dt * 8;
                
                if (num.life <= 0) {
                    this.damageNumbers.splice(i, 1);
                }
            }
        }

        drawDamageNumbers(ctx) {
            for (const num of this.damageNumbers) {
                let color;
                let text;
                
                if (num.isHeal) {
                    color = '#44ff44';
                    text = `+${Math.floor(num.damage)}`;
                } else if (num.isCrit) {
                    color = '#ffd700';
                    text = `暴击! ${Math.floor(num.damage)}`;
                } else {
                    color = '#ff4444';
                    text = `-${Math.floor(num.damage)}`;
                }
                
                const pulseScale = num.isCrit ? (1 + Math.sin(num.scalePhase) * 0.15) : 1;
                const finalScale = num.scale * pulseScale;
                
                ctx.save();
                ctx.translate(num.x, num.y);
                ctx.scale(finalScale, finalScale);
                ctx.globalAlpha = num.alpha;
                
                const fontSize = num.isCrit ? 24 : 18;
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.strokeText(text, 0, 0);
                
                ctx.fillStyle = color;
                ctx.fillText(text, 0, 0);
                
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        update(dt) {
            this.updateScreenShake(dt);
            this.updateBulletTrails(dt);
            this.updateDeathExplosions(dt);
            this.updateFloatingTexts(dt);
            this.updateGlowEffects(dt);
            this.updateDamageNumbers(dt);
        }

        render(ctx) {
            this.drawBulletTrails(ctx);
            this.drawDeathExplosions(ctx);
            this.drawGlowEffects(ctx);
            this.drawFloatingTexts(ctx);
            this.drawDamageNumbers(ctx);
        }

        clear() {
            this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
            this.bulletTrails.length = 0;
            this.glowEffects.length = 0;
            this.floatingTexts.length = 0;
            this.deathExplosions.length = 0;
            this.damageNumbers.length = 0;
        }
    }

    if (typeof window !== 'undefined') {
        window.EffectSystem = EffectSystem;
    }

})();
