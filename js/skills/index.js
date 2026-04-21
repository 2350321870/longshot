(function() {
    'use strict';

    class SkillBase {
        constructor(game, config) {
            this.game = game;
            this.id = config.id || 'unknown_skill';
            this.name = config.name || '未知技能';
            this.desc = config.desc || '';
            this.rarity = config.rarity || 'common';
            this.damage = config.damage || 0;
            this.cooldown = config.cooldown || 0;
            this.duration = config.duration || 0;
            this.radius = config.radius || 0;
            this.count = config.count || 1;
            this.type = config.type || 'active';
            
            this.active = false;
            this.timer = 0;
            this.cooldownTimer = 0;
        }

        activate() {
            if (this.cooldownTimer > 0) return false;
            this.active = true;
            this.timer = 0;
            this.cooldownTimer = this.cooldown;
            this.onActivate();
            return true;
        }

        deactivate() {
            this.active = false;
            this.onDeactivate();
        }

        update(dt) {
            if (this.cooldownTimer > 0) {
                this.cooldownTimer -= dt;
            }
            
            if (this.active) {
                this.timer += dt;
                this.onUpdate(dt);
                
                if (this.duration > 0 && this.timer >= this.duration) {
                    this.deactivate();
                }
            }
        }

        render(ctx) {
            if (this.active) {
                this.onRender(ctx);
            }
        }

        onActivate() {
        }

        onDeactivate() {
        }

        onUpdate(dt) {
        }

        onRender(ctx) {
        }

        getStats(level) {
            const multiplier = 1 + (level - 1) * 0.15;
            return {
                name: this.name,
                desc: this.desc,
                damage: Math.floor(this.damage * multiplier),
                duration: this.duration,
                cooldown: this.cooldown,
                rarity: this.rarity
            };
        }

        isReady() {
            return this.cooldownTimer <= 0;
        }

        getCooldownPercent() {
            if (this.cooldown <= 0) return 1;
            return Math.max(0, 1 - this.cooldownTimer / this.cooldown);
        }
    }

    class ThunderDragonSkill extends SkillBase {
        constructor(game) {
            super(game, {
                id: 'thunder_dragon',
                name: '雷龙',
                desc: '召唤雷龙进行直线攻击',
                rarity: 's',
                damage: 300,
                duration: 3,
                radius: 80
            });
            
            this.dragons = [];
            this.particles = [];
        }

        onActivate() {
            const stats = this.game.getSkillStats('thunder_dragon');
            const damage = stats ? stats.damage : this.damage;
            
            this.dragons.push({
                x: this.game.player.x,
                y: this.game.player.y,
                width: 120,
                height: 60,
                speed: 500,
                angle: 0,
                damage: damage,
                lifetime: this.duration,
                timer: 0,
                segments: []
            });

            this.game.addScreenShake(15, 0.8);
            
            if (this.game.events) {
                this.game.events.emit('skill:activated', { id: this.id, name: this.name });
            }
        }

        onUpdate(dt) {
            for (let i = this.dragons.length - 1; i >= 0; i--) {
                const dragon = this.dragons[i];
                dragon.timer += dt;
                dragon.x += dragon.speed * dt;

                dragon.segments.push({
                    x: dragon.x,
                    y: dragon.y,
                    alpha: 1
                });

                if (dragon.segments.length > 20) {
                    dragon.segments.shift();
                }

                for (const seg of dragon.segments) {
                    seg.alpha = Math.max(0, seg.alpha - dt * 2);
                }

                this.createParticles(dragon.x, dragon.y);

                for (let j = this.particles.length - 1; j >= 0; j--) {
                    const p = this.particles[j];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.life -= dt;
                    p.alpha = p.life / p.maxLife;
                    
                    if (p.life <= 0) {
                        this.particles.splice(j, 1);
                    }
                }

                if (this.game.enemies) {
                    for (const enemy of this.game.enemies) {
                        const dx = enemy.x - dragon.x;
                        const dy = enemy.y - dragon.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < this.radius) {
                            if (this.game.damageEnemy) {
                                this.game.damageEnemy(enemy, dragon.damage * dt);
                            }
                        }
                    }
                }

                if (dragon.timer >= dragon.lifetime || dragon.x > this.game.canvas.width + 200) {
                    this.dragons.splice(i, 1);
                }
            }

            if (this.dragons.length === 0) {
                this.deactivate();
            }
        }

        createParticles(x, y) {
            if (Math.random() < 0.3) return;
            
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 60,
                    y: y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    size: Math.random() * 8 + 4,
                    life: Math.random() * 0.5 + 0.2,
                    maxLife: 0.7,
                    alpha: 1,
                    color: Math.random() > 0.5 ? '#fff' : '#ff0'
                });
            }
        }

        onRender(ctx) {
            for (const dragon of this.dragons) {
                this.renderDragonSegments(ctx, dragon);
                this.renderDragonBody(ctx, dragon);
            }

            for (const p of this.particles) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        renderDragonSegments(ctx, dragon) {
            for (let i = 0; i < dragon.segments.length; i++) {
                const seg = dragon.segments[i];
                const size = (i + 1) / dragon.segments.length * 25;
                
                ctx.globalAlpha = seg.alpha * 0.6;
                ctx.fillStyle = `hsl(45, 100%, ${50 + i * 2}%)`;
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        renderDragonBody(ctx, dragon) {
            const pulse = Math.sin(dragon.timer * 10) * 0.2 + 1;
            const glowIntensity = Math.sin(dragon.timer * 8) * 0.3 + 0.7;

            const gradient = ctx.createRadialGradient(
                dragon.x, dragon.y, 0,
                dragon.x, dragon.y, 80 * pulse
            );
            gradient.addColorStop(0, `rgba(255, 255, 0, ${0.6 * glowIntensity})`);
            gradient.addColorStop(0.3, `rgba(255, 200, 0, ${0.3 * glowIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(dragon.x, dragon.y, 80 * pulse, 0, Math.PI * 2);
            ctx.fill();

            const bodyGradient = ctx.createLinearGradient(
                dragon.x - dragon.width, dragon.y,
                dragon.x + dragon.width, dragon.y
            );
            bodyGradient.addColorStop(0, '#fff');
            bodyGradient.addColorStop(0.3, '#ff0');
            bodyGradient.addColorStop(0.6, '#f80');
            bodyGradient.addColorStop(1, '#f00');

            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(dragon.x, dragon.y, dragon.width, dragon.height * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff0';
            ctx.shadowColor = '#ff0';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(dragon.x + 60, dragon.y - 15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(dragon.x + 60, dragon.y + 15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(dragon.x + 62, dragon.y - 15, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(dragon.x + 62, dragon.y + 15, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class IceStormSkill extends SkillBase {
        constructor(game) {
            super(game, {
                id: 'ice_storm',
                name: '冰风暴',
                desc: '在中心位置召唤冰风暴，持续造成伤害并减速',
                rarity: 's',
                damage: 100,
                duration: 8,
                radius: 200
            });
            
            this.iceCrystals = [];
            this.snowflakes = [];
            this.centerX = 0;
            this.centerY = 0;
        }

        onActivate() {
            const stats = this.game.getSkillStats('ice_storm');
            const damage = stats ? stats.damage : this.damage;
            const radius = stats ? stats.radius : this.radius;
            
            this.centerX = this.game.player.x;
            this.centerY = this.game.player.y;

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                this.iceCrystals.push({
                    x: this.centerX + Math.cos(angle) * radius * 0.7,
                    y: this.centerY + Math.sin(angle) * radius * 0.7,
                    angle: angle,
                    rotation: 0,
                    size: 25,
                    pulsePhase: Math.random() * Math.PI * 2,
                    damage: damage * 0.2
                });
            }

            for (let i = 0; i < 50; i++) {
                this.snowflakes.push({
                    x: this.centerX + (Math.random() - 0.5) * radius * 2,
                    y: this.centerY + (Math.random() - 0.5) * radius * 2,
                    size: Math.random() * 4 + 2,
                    speed: Math.random() * 50 + 20,
                    rotationSpeed: (Math.random() - 0.5) * 3,
                    rotation: Math.random() * Math.PI * 2
                });
            }

            this.game.addScreenShake(8, 0.5);
            
            if (this.game.events) {
                this.game.events.emit('skill:activated', { id: this.id, name: this.name });
            }
        }

        onUpdate(dt) {
            const stats = this.game.getSkillStats('ice_storm');
            const radius = stats ? stats.radius : this.radius;
            const damage = stats ? stats.damage : this.damage;

            for (const crystal of this.iceCrystals) {
                crystal.angle += dt * 0.8;
                crystal.rotation += dt * 2;
                crystal.pulsePhase += dt * 3;
                
                crystal.x = this.centerX + Math.cos(crystal.angle) * radius * 0.7;
                crystal.y = this.centerY + Math.sin(crystal.angle) * radius * 0.7;
            }

            for (const flake of this.snowflakes) {
                flake.y += flake.speed * dt;
                flake.rotation += flake.rotationSpeed * dt;
                
                if (flake.y > this.centerY + radius) {
                    flake.y = this.centerY - radius;
                    flake.x = this.centerX + (Math.random() - 0.5) * radius * 2;
                }
            }

            if (this.game.enemies) {
                for (const enemy of this.game.enemies) {
                    const dx = enemy.x - this.centerX;
                    const dy = enemy.y - this.centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < radius) {
                        if (this.game.damageEnemy) {
                            this.game.damageEnemy(enemy, damage * dt);
                        }
                        
                        if (enemy.speed) {
                            enemy.iceSlowed = true;
                            enemy.iceSlowTimer = 1;
                        }
                    }
                }
            }

            if (this.timer >= this.duration) {
                this.deactivate();
            }
        }

        onRender(ctx) {
            const stats = this.game.getSkillStats('ice_storm');
            const radius = stats ? stats.radius : this.radius;

            const bgGradient = ctx.createRadialGradient(
                this.centerX, this.centerY, 0,
                this.centerX, this.centerY, radius
            );
            bgGradient.addColorStop(0, 'rgba(150, 200, 255, 0.15)');
            bgGradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.1)');
            bgGradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
            
            ctx.fillStyle = bgGradient;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            for (const flake of this.snowflakes) {
                ctx.save();
                ctx.translate(flake.x, flake.y);
                ctx.rotate(flake.rotation);
                ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = Math.cos(angle) * flake.size;
                    const y = Math.sin(angle) * flake.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }

            for (const crystal of this.iceCrystals) {
                const pulse = Math.sin(crystal.pulsePhase) * 0.3 + 1;
                const size = crystal.size * pulse;

                const glow = ctx.createRadialGradient(
                    crystal.x, crystal.y, 0,
                    crystal.x, crystal.y, size * 2
                );
                glow.addColorStop(0, 'rgba(150, 200, 255, 0.6)');
                glow.addColorStop(1, 'rgba(100, 180, 255, 0)');
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(crystal.x, crystal.y, size * 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(crystal.x, crystal.y);
                ctx.rotate(crystal.rotation);

                const gradient = ctx.createLinearGradient(-size, -size, size, size);
                gradient.addColorStop(0, '#fff');
                gradient.addColorStop(0.5, '#88ccff');
                gradient.addColorStop(1, '#4488ff');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }

            const ringAlpha = 0.3 + Math.sin(this.timer * 5) * 0.1;
            ctx.strokeStyle = `rgba(100, 180, 255, ${ringAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    class RainOfNeedlesSkill extends SkillBase {
        constructor(game) {
            super(game, {
                id: 'rain_of_needles',
                name: '针雨',
                desc: '从屏幕上方落下大量针，造成伤害',
                rarity: 's',
                damage: 50,
                duration: 5,
                count: 100
            });
            
            this.needles = [];
        }

        onActivate() {
            const stats = this.game.getSkillStats('rain_of_needles');
            const damage = stats ? stats.damage : this.damage;
            const count = stats ? stats.count : this.count;

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    if (this.active) {
                        this.spawnNeedle(damage);
                    }
                }, i * (this.duration * 1000 / count));
            }

            this.game.addScreenShake(10, 0.6);
            
            if (this.game.events) {
                this.game.events.emit('skill:activated', { id: this.id, name: this.name });
            }
        }

        spawnNeedle(damage) {
            this.needles.push({
                x: Math.random() * this.game.canvas.width,
                y: -50,
                targetX: Math.random() * this.game.canvas.width,
                targetY: this.game.canvas.height + 50,
                speed: 400 + Math.random() * 200,
                damage: damage,
                size: 6,
                rotation: Math.random() * Math.PI * 2,
                trail: []
            });
        }

        onUpdate(dt) {
            for (let i = this.needles.length - 1; i >= 0; i--) {
                const needle = this.needles[i];
                
                const dx = needle.targetX - needle.x;
                const dy = needle.targetY - needle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const moveX = (dx / dist) * needle.speed * dt;
                    const moveY = (dy / dist) * needle.speed * dt;
                    needle.x += moveX;
                    needle.y += moveY;
                    needle.rotation = Math.atan2(dy, dx);
                }

                needle.trail.push({ x: needle.x, y: needle.y, alpha: 1 });
                if (needle.trail.length > 10) {
                    needle.trail.shift();
                }
                
                for (const t of needle.trail) {
                    t.alpha = Math.max(0, t.alpha - dt * 3);
                }

                if (this.game.enemies) {
                    for (const enemy of this.game.enemies) {
                        const ex = enemy.x - needle.x;
                        const ey = enemy.y - needle.y;
                        const eDist = Math.sqrt(ex * ex + ey * ey);
                        
                        if (eDist < enemy.radius + needle.size) {
                            if (this.game.damageEnemy) {
                                this.game.damageEnemy(enemy, needle.damage);
                            }
                            needle.y = this.game.canvas.height + 100;
                        }
                    }
                }

                if (needle.y > this.game.canvas.height + 100) {
                    this.needles.splice(i, 1);
                }
            }

            if (this.timer >= this.duration && this.needles.length === 0) {
                this.deactivate();
            }
        }

        onRender(ctx) {
            for (const needle of this.needles) {
                for (let i = 0; i < needle.trail.length; i++) {
                    const t = needle.trail[i];
                    const alpha = t.alpha * 0.5;
                    const size = needle.size * (i + 1) / needle.trail.length * 0.6;
                    
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                ctx.save();
                ctx.translate(needle.x, needle.y);
                ctx.rotate(needle.rotation);

                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, needle.size * 3);
                glow.addColorStop(0, 'rgba(255, 100, 100, 0.5)');
                glow.addColorStop(1, 'rgba(255, 50, 50, 0)');
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, needle.size * 3, 0, Math.PI * 2);
                ctx.fill();

                const gradient = ctx.createLinearGradient(-needle.size * 3, 0, needle.size * 3, 0);
                gradient.addColorStop(0, '#fff');
                gradient.addColorStop(0.3, '#ff8888');
                gradient.addColorStop(0.6, '#ff4444');
                gradient.addColorStop(1, '#cc0000');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(needle.size * 3, 0);
                ctx.lineTo(-needle.size * 2, -needle.size * 0.8);
                ctx.lineTo(-needle.size * 3, 0);
                ctx.lineTo(-needle.size * 2, needle.size * 0.8);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.SkillBase = SkillBase;
        window.ThunderDragonSkill = ThunderDragonSkill;
        window.IceStormSkill = IceStormSkill;
        window.RainOfNeedlesSkill = RainOfNeedlesSkill;
    }

})();
