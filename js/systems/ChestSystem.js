(function() {
    'use strict';

    class ChestSystem {
        constructor(game) {
            this.game = game;
            
            this.chests = [];
            this.chestsOpened = 0;
            this.chestSpawnTimer = 0;
            
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            this.isInitialized = true;
            
            console.log('ChestSystem initialized');
        }

        update(dt) {
            const gravity = 5;
            const maxFallSpeed = 10;
            
            for (let i = this.chests.length - 1; i >= 0; i--) {
                const chest = this.chests[i];
                
                if (chest.falling) {
                    chest.vy = Math.min(chest.vy + gravity * dt, maxFallSpeed);
                    chest.y += chest.vy * 60 * dt;
                    
                    if (chest.y > this.game.height + chest.radius) {
                        this.chests.splice(i, 1);
                        continue;
                    }
                }
                
                chest.bobOffset = Math.sin(Date.now() / 500 + i) * 5;
                
                if (this.game.player) {
                    if (this.checkCollision(chest, this.game.player)) {
                        this.openChest(chest);
                        this.chests.splice(i, 1);
                    }
                }
            }
            
            this.updateSpawning(dt);
        }

        updateSpawning(dt) {
            this.chestSpawnTimer += dt;
            const chestInterval = 12;
            
            if (this.chestSpawnTimer >= chestInterval && this.chests.length < 2) {
                this.spawnChest();
                this.chestSpawnTimer = 0;
            }
        }

        checkCollision(obj1, obj2) {
            if (!obj1 || !obj2) return false;
            
            const dx = obj1.x - obj2.x;
            const dy = obj1.y - obj2.y;
            const r1 = obj1.radius || Math.max(obj1.width || 0, obj1.height || 0) / 2;
            const r2 = obj2.radius || Math.max(obj2.width || 0, obj2.height || 0) / 2;
            
            return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
        }

        spawnChest(x, y) {
            const goldAmount = 50 + Math.floor(Math.random() * 200);
            
            this.chests.push({
                x: x || (80 + Math.random() * (this.game.width - 160)),
                y: y || -50,
                radius: 30,
                bobOffset: 0,
                goldAmount: goldAmount,
                vy: 0,
                falling: true
            });
        }

        openChest(chest) {
            this.chestsOpened++;
            const goldAmount = chest.goldAmount || 20;
            this.game.goldEarned += goldAmount;
            this.game.score += goldAmount * 2;
            
            if (this.game.updateStatistics) {
                this.game.updateStatistics('chest_open', 1);
            }
            
            if (this.game.createGoldParticles) {
                this.game.createGoldParticles(chest.x, chest.y);
            }
            
            if (this.game.spawnPowerup) {
                for (let i = 0; i < 2; i++) {
                    if (Math.random() < 0.7) {
                        this.game.spawnPowerup(
                            chest.x + (Math.random() - 0.5) * 50,
                            chest.y + (Math.random() - 0.5) * 50
                        );
                    }
                }
            }
            
            if (this.game.updateUI) {
                this.game.updateUI();
            }
        }

        render(ctx) {
            for (const chest of this.chests) {
                ctx.save();
                ctx.translate(chest.x, chest.y + chest.bobOffset);
                
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 25;
                
                ctx.beginPath();
                ctx.arc(0, 0, chest.radius, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, chest.radius);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, '#FFA500');
                gradient.addColorStop(1, '#8B4513');
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.shadowBlur = 0;
                
                ctx.font = `${chest.radius * 1.2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📦', 0, -5);
                
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                const goldText = `${chest.goldAmount}`;
                ctx.strokeText(goldText, 0, chest.radius * 0.5);
                ctx.fillText(goldText, 0, chest.radius * 0.5);
                
                ctx.restore();
            }
        }

        reset() {
            this.chests = [];
            this.chestsOpened = 0;
            this.chestSpawnTimer = 0;
        }

        getChests() {
            return this.chests;
        }
    }

    if (typeof window !== 'undefined') {
        window.ChestSystem = ChestSystem;
    }

})();