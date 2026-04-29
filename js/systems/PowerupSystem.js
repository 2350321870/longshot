(function() {
    'use strict';

    class PowerupSystem {
        constructor(game) {
            this.game = game;
            
            this.powerups = [];
            this.powerupTypes = [
                {
                    id: 'gold',
                    name: '金币',
                    color: '#FFD700',
                    icon: '💰'
                },
                {
                    id: 'health_pack',
                    name: '生命包',
                    color: '#FF4444',
                    icon: '❤️'
                },
                {
                    id: 'damage_boost',
                    name: '伤害提升',
                    color: '#FF6600',
                    icon: '⚔️'
                },
                {
                    id: 'speed_boost',
                    name: '速度提升',
                    color: '#00FF00',
                    icon: '💨'
                }
            ];
            
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            this.loadPowerupData();
            this.isInitialized = true;
            
            console.log('PowerupSystem initialized');
        }

        loadPowerupData() {
            const powerupTypes = window.powerupTypes || {};
            if (powerupTypes && Object.keys(powerupTypes).length > 0) {
                this.powerupTypes = Object.values(powerupTypes);
            }
        }

        update(dt) {
            const gravity = 4;
            const maxFallSpeed = 8;
            
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const powerup = this.powerups[i];
                
                if (powerup.falling) {
                    powerup.vy = Math.min(powerup.vy + gravity * dt, maxFallSpeed);
                    powerup.y += powerup.vy * 60 * dt;
                    
                    if (powerup.y > this.game.height + powerup.radius) {
                        this.powerups.splice(i, 1);
                        continue;
                    }
                }
                
                powerup.angle += dt * 2;
                powerup.bobOffset = Math.sin(Date.now() / 300 + i) * 3;
                
                if (this.game.player) {
                    const dx = this.game.player.x - powerup.x;
                    const dy = this.game.player.y - powerup.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const magnetRange = this.game.playerStats?.magnetRange || 100;
                    if (dist < magnetRange) {
                        const attractSpeed = 8;
                        powerup.x += (dx / dist) * attractSpeed * 60 * dt;
                        powerup.y += (dy / dist) * attractSpeed * 60 * dt;
                    }
                    
                    const playerRadius = this.game.player.radius || 20;
                    if (dist < playerRadius + powerup.radius) {
                        this.collectPowerup(powerup);
                        this.powerups.splice(i, 1);
                    }
                }
            }
        }

        spawnPowerup(x, y) {
            const type = this.powerupTypes[Math.floor(Math.random() * this.powerupTypes.length)];
            
            this.powerups.push({
                x: x,
                y: y,
                radius: 15,
                angle: 0,
                bobOffset: 0,
                vy: 0,
                falling: true,
                ...type
            });
        }

        collectPowerup(powerup) {
            switch (powerup.id) {
                case 'gold':
                    this.game.goldEarned += 10;
                    this.game.score += 10;
                    break;
                case 'health_pack':
                    if (this.game.playerStats) {
                        this.game.playerStats.health = Math.min(
                            this.game.playerStats.health + 20,
                            this.game.playerStats.maxHealth
                        );
                    }
                    break;
                case 'damage_boost':
                    if (this.game.activeBuffs) {
                        this.game.activeBuffs.push({
                            type: 'damage_boost',
                            multiplier: 1.5,
                            startTime: this.game.currentTime,
                            duration: 10
                        });
                    }
                    break;
                case 'speed_boost':
                    if (this.game.activeBuffs) {
                        this.game.activeBuffs.push({
                            type: 'speed_boost',
                            multiplier: 1.3,
                            startTime: this.game.currentTime,
                            duration: 8
                        });
                    }
                    break;
            }
            
            if (this.game.createCollectParticles) {
                this.game.createCollectParticles(powerup.x, powerup.y, powerup.color);
            }
            
            if (this.game.updateStatistics) {
                this.game.updateStatistics('powerup_collect', 1);
            }
            
            if (this.game.updateUI) {
                this.game.updateUI();
            }
        }

        render(ctx) {
            for (const powerup of this.powerups) {
                ctx.save();
                ctx.translate(powerup.x, powerup.y + powerup.bobOffset);
                ctx.rotate(powerup.angle);
                
                ctx.shadowColor = powerup.color;
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
                ctx.fillStyle = powerup.color + '40';
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.font = `${powerup.radius * 1.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(powerup.icon, 0, 0);
                
                ctx.restore();
            }
        }

        reset() {
            this.powerups = [];
        }

        getPowerups() {
            return this.powerups;
        }
    }

    if (typeof window !== 'undefined') {
        window.PowerupSystem = PowerupSystem;
    }

})();