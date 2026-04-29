(function() {
    'use strict';

    class ParticleSystem extends BaseSystem {
        constructor() {
            super();
            this.particles = [];
            this.pool = [];
            this.maxPoolSize = 200;
        }

        setGame(game) {
            super.setGame(game);
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
            
            return particle;
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.life -= dt;
                
                if (p.life <= 0) {
                    if (this.pool.length < this.maxPoolSize) {
                        this.pool.push(p);
                    }
                    this.particles.splice(i, 1);
                    continue;
                }
                
                p.vy += p.gravity * dt;
                p.vx *= Math.pow(1 - p.friction, dt * 60);
                p.vy *= Math.pow(1 - p.friction, dt * 60);
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rotation += p.rotationSpeed * dt;
                
                if (p.sizeDecay > 0) {
                    p.size = p.startSize * Math.pow(1 - p.sizeDecay, dt * 60);
                }
                
                p.alpha = (p.life / p.maxLife) * p.alphaDecay;
            }
        }

        render(ctx) {
            for (const p of this.particles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'square') {
                    ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
                } else if (p.type === 'triangle') {
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(p.size, p.size);
                    ctx.lineTo(-p.size, p.size);
                    ctx.closePath();
                    ctx.fill();
                } else if (p.type === 'star') {
                    this.drawStar(ctx, 0, 0, 5, p.size, p.size * 0.5);
                }
                
                ctx.restore();
            }
            ctx.globalAlpha = 1;
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
        }

        getCount() {
            return this.particles.length;
        }
    }

    if (typeof window !== 'undefined') {
        window.ParticleSystem = ParticleSystem;
    }

})();
