(function() {
    'use strict';

    class ParticleSystem {
        constructor(game) {
            this.game = game;
            this.particles = [];
            this.pool = [];
            this.maxPoolSize = 200;
            this.maxParticles = 80;
            
            this.damageNumbers = [];
            this.deathExplosions = [];
            this.glowEffects = [];
        }

        emit(x, y, options = {}) {
            const count = options.count || 1;
            
            for (let i = 0; i < count; i++) {
                const particle = this.createParticle(x, y, options);
                this.particles.push(particle);
            }
        }

        createParticle(x, y, options) {
            let particle;
            
            if (this.pool.length > 0) {
                particle = this.pool.pop();
            } else {
                particle = {};
            }
            
            particle.x = x + (options.offsetX || 0);
            particle.y = y + (options.offsetY || 0);
            particle.vx = options.vx || (Math.random() - 0.5) * 100;
            particle.vy = options.vy || (Math.random() - 0.5) * 100;
            particle.size = options.size || Math.random() * 5 + 2;
            particle.startSize = particle.size;
            particle.life = options.life || Math.random() * 0.5 + 0.2;
            particle.maxLife = particle.life;
            particle.alpha = options.alpha || 1;
            particle.color = options.color || '#fff';
            particle.gravity = options.gravity || 0;
            particle.friction = options.friction || 0;
            particle.rotation = options.rotation || Math.random() * Math.PI * 2;
            particle.rotationSpeed = options.rotationSpeed || 0;
            particle.type = options.type || 'circle';
            particle.sizeDecay = options.sizeDecay || 0;
            particle.alphaDecay = options.alphaDecay || 1;
            particle.radius = particle.size;
            
            return particle;
        }

        update(dt) {
            this.updateParticles(dt);
            this.updateDamageNumbers(dt);
            this.updateDeathExplosions(dt);
            this.updateGlowEffects(dt);
        }

        updateParticles(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                if (p.vx !== undefined) {
                    p.x += p.vx * 60 * dt;
                    p.y += p.vy * 60 * dt;
                }
                
                if (p.lifetime !== undefined) {
                    p.lifetime -= dt;
                    p.alpha = Math.max(0, p.lifetime / (p.maxLifetime || p.lifetime));
                } else if (p.life !== undefined) {
                    p.life -= dt;
                    p.vy += (p.gravity || 0) * dt;
                    p.vx *= Math.pow(1 - (p.friction || 0), dt * 60);
                    p.vy *= Math.pow(1 - (p.friction || 0), dt * 60);
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.rotation += (p.rotationSpeed || 0) * dt;
                    
                    if (p.sizeDecay > 0) {
                        p.size = p.startSize * Math.pow(1 - p.sizeDecay, dt * 60);
                    }
                    
                    p.alpha = (p.life / p.maxLife) * (p.alphaDecay || 1);
                }
                
                if ((p.lifetime !== undefined && p.lifetime <= 0) || 
                    (p.life !== undefined && p.life <= 0)) {
                    if (this.pool.length < this.maxPoolSize) {
                        this.pool.push(p);
                    }
                    this.particles.splice(i, 1);
                }
            }
        }

        createDamageNumber(x, y, value, isCrit = false, isReduced = false) {
            const MAX_DAMAGE_NUMBERS = 40;
            
            if (this.damageNumbers.length >= MAX_DAMAGE_NUMBERS) {
                for (const dn of this.damageNumbers) {
                    const dist = Math.sqrt((dn.x - x) * (dn.x - x) + (dn.y - y) * (dn.y - y));
                    if (dist < 50 && dn.lifetime > 0.2) {
                        dn.value += value;
                        dn.isCrit = dn.isCrit || isCrit;
                        dn.isReduced = dn.isReduced || isReduced;
                        dn.lifetime = Math.min(dn.lifetime + 0.1, 0.6);
                        return;
                    }
                }
                return;
            }
            
            for (const dn of this.damageNumbers) {
                const dist = Math.sqrt((dn.x - x) * (dn.x - x) + (dn.y - y) * (dn.y - y));
                if (dist < 40) {
                    dn.value += value;
                    dn.isCrit = dn.isCrit || isCrit;
                    dn.isReduced = dn.isReduced || isReduced;
                    dn.lifetime = Math.min(dn.lifetime + 0.1, 0.6);
                    return;
                }
            }
            
            this.damageNumbers.push({
                x: x,
                y: y,
                value: value,
                isCrit: isCrit,
                isReduced: isReduced,
                lifetime: 0.6,
                vy: -2.5,
                critEffectTriggered: false
            });
        }

        updateDamageNumbers(dt) {
            for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
                const dn = this.damageNumbers[i];
                
                if (dn.isCrit && !dn.critEffectTriggered) {
                    if (Math.random() < 0.5 && this.game && this.game.addScreenShake) {
                        this.game.addScreenShake(3, 0.1);
                    }
                    dn.critEffectTriggered = true;
                }
                
                dn.y += dn.vy * 60 * dt;
                dn.lifetime -= dt;
                dn.alpha = Math.max(0, dn.lifetime / 0.6);
                
                if (!dn.scale) dn.scale = 1;
                if (dn.isCrit) {
                    const scaleProgress = 1 - (dn.lifetime / 0.6);
                    if (scaleProgress < 0.2) {
                        dn.scale = 1 + Math.sin(scaleProgress * Math.PI / 0.2) * 0.2;
                    }
                }
                
                if (dn.lifetime <= 0) {
                    this.damageNumbers.splice(i, 1);
                }
            }
        }

        updateDeathExplosions(dt) {
            for (let i = this.deathExplosions.length - 1; i >= 0; i--) {
                const exp = this.deathExplosions[i];
                exp.lifetime -= dt;
                exp.alpha = Math.max(0, exp.lifetime / exp.maxLifetime);
                exp.radius = exp.maxRadius * (1 - exp.lifetime / exp.maxLifetime);
                
                if (exp.lifetime <= 0) {
                    this.deathExplosions.splice(i, 1);
                }
            }
        }

        updateGlowEffects(dt) {
            for (let i = this.glowEffects.length - 1; i >= 0; i--) {
                const glow = this.glowEffects[i];
                glow.lifetime -= dt;
                glow.alpha = Math.max(0, glow.lifetime / glow.maxLifetime);
                glow.radius = glow.maxRadius * (1 - glow.lifetime / glow.maxLifetime);
                
                if (glow.lifetime <= 0) {
                    this.glowEffects.splice(i, 1);
                }
            }
        }

        createHitParticles(x, y, color) {
            if (this.particles.length >= this.maxParticles) return;
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(3, maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 2,
                    color: color,
                    lifetime: 0.4,
                    maxLifetime: 0.4,
                    alpha: 1
                });
            }
        }

        createDeathParticles(x, y, color) {
            if (this.particles.length >= this.maxParticles) return;
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(6, maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 3,
                    color: color,
                    lifetime: 0.7,
                    maxLifetime: 0.7,
                    alpha: 1
                });
            }
        }

        createCollectParticles(x, y, color) {
            if (this.particles.length >= this.maxParticles) return;
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(4, maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 1 + Math.random() * 2,
                    color: color,
                    lifetime: 0.6,
                    maxLifetime: 0.6,
                    alpha: 1
                });
            }
        }

        createGoldParticles(x, y) {
            if (this.particles.length >= this.maxParticles) return;
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(6, maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 2,
                    color: '#FFD700',
                    lifetime: 0.8,
                    maxLifetime: 0.8,
                    alpha: 1
                });
            }
        }

        createKillExplosion(x, y, color, size = 1) {
            if (this.particles.length >= this.maxParticles) {
                this.deathExplosions.push({
                    x: x,
                    y: y,
                    radius: 5,
                    maxRadius: 50 * size,
                    color: color,
                    lifetime: 0.3,
                    maxLifetime: 0.3
                });
                if (this.game && this.game.addScreenShake) {
                    this.game.addScreenShake(2 * size, 0.15);
                }
                return;
            }
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(Math.floor(8 * size), maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (3 + Math.random() * 4) * size;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: (2 + Math.random() * 3) * size,
                    color: color,
                    lifetime: 0.6 + Math.random() * 0.3,
                    maxLifetime: 0.6 + Math.random() * 0.3,
                    alpha: 1
                });
            }
            
            this.deathExplosions.push({
                x: x,
                y: y,
                radius: 5,
                maxRadius: 50 * size,
                color: color,
                lifetime: 0.3,
                maxLifetime: 0.3
            });
            
            if (this.game && this.game.addScreenShake) {
                this.game.addScreenShake(2 * size, 0.15);
            }
        }

        createCritEffect(x, y) {
            if (this.particles.length >= this.maxParticles) {
                this.glowEffects.push({
                    x: x,
                    y: y,
                    radius: 20,
                    maxRadius: 40,
                    color: '#FFD700',
                    lifetime: 0.2,
                    maxLifetime: 0.2
                });
                return;
            }
            
            const maxParticles = Math.max(0, this.maxParticles - this.particles.length);
            const particleCount = Math.min(8, maxParticles);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 3;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 3,
                    color: '#FFD700',
                    lifetime: 0.3,
                    maxLifetime: 0.3,
                    alpha: 1
                });
            }
            
            this.glowEffects.push({
                x: x,
                y: y,
                radius: 20,
                maxRadius: 40,
                color: '#FFD700',
                lifetime: 0.2,
                maxLifetime: 0.2
            });
        }

        render(ctx) {
            this.renderParticles(ctx);
            this.renderDamageNumbers(ctx);
            this.renderDeathExplosions(ctx);
            this.renderGlowEffects(ctx);
        }

        renderParticles(ctx) {
            for (const p of this.particles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                
                if (p.rotation !== undefined) {
                    ctx.rotate(p.rotation);
                }
                
                const size = p.radius || p.size;
                
                if (p.type === 'circle' || !p.type) {
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'square') {
                    ctx.fillRect(-size, -size, size * 2, size * 2);
                } else if (p.type === 'triangle') {
                    ctx.beginPath();
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size, size);
                    ctx.lineTo(-size, size);
                    ctx.closePath();
                    ctx.fill();
                } else if (p.type === 'star') {
                    this.drawStar(ctx, 0, 0, 5, size, size * 0.5);
                }
                
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        renderDamageNumbers(ctx) {
            for (const dn of this.damageNumbers) {
                ctx.save();
                ctx.globalAlpha = dn.alpha;
                
                if (dn.scale) {
                    ctx.scale(dn.scale, dn.scale);
                }
                
                if (dn.isCrit) {
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = '#FFD700';
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                } else if (dn.isReduced) {
                    ctx.font = '18px Arial';
                    ctx.fillStyle = '#888888';
                } else {
                    ctx.font = '18px Arial';
                    ctx.fillStyle = '#FFFFFF';
                }
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(dn.value, dn.x, dn.y);
                
                ctx.restore();
            }
        }

        renderDeathExplosions(ctx) {
            for (const exp of this.deathExplosions) {
                ctx.save();
                ctx.globalAlpha = exp.alpha * 0.5;
                ctx.fillStyle = exp.color;
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        renderGlowEffects(ctx) {
            for (const glow of this.glowEffects) {
                ctx.save();
                ctx.globalAlpha = glow.alpha * 0.3;
                
                const gradient = ctx.createRadialGradient(
                    glow.x, glow.y, 0,
                    glow.x, glow.y, glow.radius
                );
                gradient.addColorStop(0, glow.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
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
            ctx.fill();
        }

        createExplosion(x, y, options = {}) {
            const count = options.count || 20;
            const colors = options.colors || ['#ff0', '#f80', '#f00'];
            const size = options.size || 8;
            const speed = options.speed || 200;
            
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
                const vel = speed * (0.5 + Math.random() * 0.5);
                
                this.emit(x, y, {
                    vx: Math.cos(angle) * vel,
                    vy: Math.sin(angle) * vel,
                    size: size * (0.5 + Math.random() * 0.5),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 0.3 + Math.random() * 0.4,
                    alpha: 1,
                    alphaDecay: 1
                });
            }
        }

        createSparkles(x, y, options = {}) {
            const count = options.count || 10;
            
            for (let i = 0; i < count; i++) {
                this.emit(x, y, {
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150 - 50,
                    size: Math.random() * 4 + 2,
                    color: options.color || '#ff0',
                    life: 0.2 + Math.random() * 0.3,
                    gravity: 300,
                    type: 'star'
                });
            }
        }

        createBloodSplat(x, y, options = {}) {
            const count = options.count || 15;
            
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() - 0.5) * Math.PI;
                const vel = 50 + Math.random() * 150;
                
                this.emit(x, y, {
                    vx: Math.cos(angle) * vel,
                    vy: Math.sin(angle) * vel - 50,
                    size: Math.random() * 6 + 3,
                    color: '#800',
                    life: 0.3 + Math.random() * 0.5,
                    gravity: 500,
                    type: 'circle'
                });
            }
        }

        createTrail(x, y, options = {}) {
            this.emit(x, y, {
                count: 1,
                vx: 0,
                vy: 0,
                size: options.size || 10,
                color: options.color || '#fff',
                life: options.life || 0.1,
                alpha: options.alpha || 0.5,
                alphaDecay: 0.8
            });
        }

        clear() {
            this.particles.length = 0;
            this.damageNumbers.length = 0;
            this.deathExplosions.length = 0;
            this.glowEffects.length = 0;
        }

        getCount() {
            return this.particles.length;
        }

        reset() {
            this.clear();
            this.pool = [];
        }
    }

    if (typeof window !== 'undefined') {
        window.ParticleSystem = ParticleSystem;
    }

})();