(function() {
    'use strict';

    class GameCore {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.gameState = 'mainMenu';
            this.isPaused = false;
            this.freeRefreshCount = 1;
            this.currentTab = 'battle';
            
            this.width = 0;
            this.height = 0;
            
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            this.initSystems();
            this.setupEventListeners();
            this.renderMainMenu();
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }

        initSystems() {
            this.saveManager = new SaveManager('dragonShooterSave');
            this.saveData = this.saveManager.init();
            
            this.eventBus = new EventBus();
            
            this.particleSystem = new ParticleSystem(this);
            this.effectSystem = new EffectSystem(this);
            this.skillSystem = new SkillSystem(this);
            this.windingEnemySystem = new WindingEnemySystem(this);
            this.chestSystem = new ChestSystem(this);
            this.powerupSystem = new PowerupSystem(this);
            this.uiManager = new UIManager();
            this.achievementSystem = new AchievementSystem(this, this.saveManager);
            this.mainMenuSystem = new MainMenuSystem(this, this.saveManager, this.achievementSystem);
            
            this.uiManager.setGame(this);
            
            this.particleSystem.init();
            this.effectSystem.init();
            this.skillSystem.init();
            this.windingEnemySystem.init();
            this.chestSystem.init();
            this.powerupSystem.init();
            this.uiManager.init();
            this.achievementSystem.init();
            this.mainMenuSystem.init();
            
            console.log('All systems initialized');
        }

        setupEventListeners() {
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            this.eventBus.on('achievement-unlocked', (data) => {
                this.onAchievementUnlocked(data);
            });
            
            this.eventBus.on('shop-purchase', (data) => {
                this.onShopPurchase(data);
            });
        }

        handleMouseMove(e) {
            if (this.gameState !== 'playing') return;
            
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        }

        handleClick(e) {
            if (this.gameState === 'mainMenu') {
                this.mainMenuSystem.handleClick(e);
                return;
            }
            
            if (this.gameState === 'playing') {
                if (this.isPaused) {
                    this.isPaused = false;
                }
            }
        }

        handleKeyDown(e) {
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    if (this.isPaused) {
                        this.returnToMainMenu();
                    } else {
                        this.isPaused = true;
                    }
                }
            }
            
            if (this.gameState === 'playing' && !this.isPaused) {
                this.skillSystem.handleKeyDown(e);
            }
        }

        initGame() {
            this.player = {
                x: this.width / 2,
                y: this.height - 100,
                radius: 15,
                health: 100,
                maxHealth: 100,
                invincible: 0
            };
            
            this.playerStats = this.getPlayerStats();
            
            this.enemies = [];
            this.bullets = [];
            this.particles = [];
            this.powerups = [];
            this.chests = [];
            this.activeBuffs = [];
            this.damageNumbers = [];
            this.floatingTexts = [];
            this.bulletTrails = [];
            this.deathExplosions = [];
            this.glowEffects = [];
            
            this.goldEarned = 0;
            this.score = 0;
            this.enemiesKilled = 0;
            this.chestsOpened = 0;
            this.segmentsDestroyed = 0;
            
            this.shootTimer = 0;
            this.spawnTimer = 0;
            this.chestSpawnTimer = 0;
            
            this.skillLevels = {};
            this.unlockedSkills = [];
            
            this.currentLevel = 1;
            this.currentTime = 0;
            
            this.comboSystem = {
                combo: 0,
                comboTimer: 0,
                comboMultiplier: 1
            };
            
            this.path = this.generatePath();
            this.currentWave = 1;
            this.totalWaves = 10;
            this.waveAnnouncement = null;
            
            this.shield = 0;
            this.maxShield = 50;
            this.shieldCooldown = 0;
            
            this.lastTime = 0;
        }

        getPlayerStats() {
            const baseStats = {
                health: 100,
                maxHealth: 100,
                damage: 10,
                speed: 0.5,
                critChance: 0.1,
                critDamage: 1.5,
                magnetRange: 100
            };
            
            const upgrades = this.saveData.permanentUpgrades || {};
            
            return {
                health: baseStats.health + (upgrades.maxHealth || 0) * 10,
                maxHealth: baseStats.maxHealth + (upgrades.maxHealth || 0) * 10,
                damage: baseStats.damage + (upgrades.bulletDamage || 0) * 2,
                speed: baseStats.speed + (upgrades.moveSpeed || 0) * 0.05,
                critChance: baseStats.critChance + (upgrades.critChance || 0) * 0.02,
                critDamage: baseStats.critDamage + (upgrades.critDamage || 0) * 0.1,
                magnetRange: baseStats.magnetRange + (upgrades.goldBonus || 0) * 5,
                skillDamage: 1 + (upgrades.skillDamage || 0) * 0.1,
                attackSpeed: 1 + (upgrades.attackSpeed || 0) * 0.05,
                healthRegen: upgrades.healthRegen || 0,
                damageReduction: upgrades.damageReduction || 0,
                bulletPierce: upgrades.bulletPierce || 0,
                extraRevives: upgrades.extraRevives || 0,
                enemySlow: upgrades.enemySlow || 0
            };
        }

        generatePath() {
            const points = [];
            const segments = 8;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = this.width * (0.2 + 0.6 * Math.sin(t * Math.PI * 2 + Math.PI / 2));
                const y = this.height * (0.1 + t * 0.5);
                points.push({ x, y });
            }
            
            return points;
        }

        startLevel(levelNum) {
            this.currentLevel = levelNum;
            this.initGame();
            
            this.gameState = 'playing';
            this.updateUI();
            
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('gameCanvas').classList.remove('hidden');
            document.getElementById('battleUI').classList.remove('hidden');
            document.getElementById('battleLevelDisplay').textContent = `当前第${this.currentLevel}关`;
            
            this.lastTime = 0;
            requestAnimationFrame((t) => this.gameLoop(t));
        }

        gameLoop(timestamp) {
            if (this.gameState !== 'playing') return;
            
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
            this.lastTime = timestamp;
            this.currentTime += dt;
            
            if (!this.isPaused) {
                this.update(dt);
            }
            
            this.render();
            
            requestAnimationFrame((t) => this.gameLoop(t));
        }

        update(dt) {
            this.updatePlayer(dt);
            this.updateBullets(dt);
            this.windingEnemySystem.update(dt);
            this.chestSystem.update(dt);
            this.powerupSystem.update(dt);
            this.particleSystem.update(dt);
            this.effectSystem.update(dt);
            this.skillSystem.update(dt);
            this.updateComboSystem(dt);
            this.updateBuffs(dt);
            this.updateSpawning(dt);
            this.checkLevelComplete();
            
            this.playerStats.health = Math.min(
                this.playerStats.health + this.playerStats.healthRegen * dt,
                this.playerStats.maxHealth
            );
            
            if (this.shieldCooldown > 0) {
                this.shieldCooldown -= dt;
                if (this.shieldCooldown <= 0 && this.shield < this.maxShield) {
                    this.shield = this.maxShield;
                }
            }
            
            if (this.playerStats.health <= 0) {
                this.gameOver();
            }
        }

        updatePlayer(dt) {
            if (!this.player || !this.mouseX || !this.mouseY) return;
            
            const dx = this.mouseX - this.player.x;
            const dy = this.mouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                const speed = this.playerStats.speed * 300 * dt;
                this.player.x += (dx / dist) * speed;
                this.player.y += (dy / dist) * speed;
            }
            
            this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
            this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
            
            this.player.health = this.playerStats.health;
            
            if (this.player.invincible > 0) {
                this.player.invincible -= dt;
            }
        }

        updateBullets(dt) {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                
                bullet.x += bullet.vx * 60 * dt;
                bullet.y += bullet.vy * 60 * dt;
                
                if (bullet.x < -50 || bullet.x > this.width + 50 ||
                    bullet.y < -50 || bullet.y > this.height + 50) {
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                if (bullet.lifetime > 0) {
                    bullet.lifetime -= dt;
                    if (bullet.lifetime <= 0) {
                        this.bullets.splice(i, 1);
                        continue;
                    }
                }
            }
        }

        updateComboSystem(dt) {
            if (this.comboSystem.combo > 0) {
                this.comboSystem.comboTimer -= dt;
                if (this.comboSystem.comboTimer <= 0) {
                    this.comboSystem.combo = 0;
                    this.comboSystem.comboMultiplier = 1;
                }
            }
        }

        updateBuffs(dt) {
            for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
                const buff = this.activeBuffs[i];
                const elapsed = this.currentTime - buff.startTime;
                
                if (elapsed >= buff.duration) {
                    this.activeBuffs.splice(i, 1);
                }
            }
        }

        updateSpawning(dt) {
            this.shootTimer += dt;
            const shootInterval = Math.max(0.1, 0.3 - this.playerStats.attackSpeed * 0.1);
            
            if (this.shootTimer >= shootInterval) {
                this.shoot();
                this.shootTimer = 0;
            }
            
            this.windingEnemySystem.updateSpawning(dt);
        }

        shoot() {
            const baseDamage = this.playerStats.damage;
            const isCrit = Math.random() < this.playerStats.critChance;
            const critMultiplier = isCrit ? this.playerStats.critDamage : 1;
            
            let damage = baseDamage * critMultiplier;
            
            for (const buff of this.activeBuffs) {
                if (buff.type === 'damage_boost') {
                    damage *= buff.multiplier;
                }
            }
            
            const bullet = {
                x: this.player.x,
                y: this.player.y - this.player.radius,
                vx: 0,
                vy: -12,
                radius: 5,
                damage: Math.floor(damage),
                isCrit: isCrit,
                color: isCrit ? '#FFD700' : '#4488ff',
                pierce: this.playerStats.bulletPierce
            };
            
            this.bullets.push(bullet);
            this.effectSystem.createBulletTrail(bullet.x, bullet.y, bullet.color);
        }

        checkLevelComplete() {
            const levelConfig = this.getLevelConfig(this.currentLevel);
            const requiredKills = levelConfig.enemyCount || 10;
            
            if (this.enemiesKilled >= requiredKills && this.enemies.length === 0) {
                this.levelComplete();
            }
        }

        levelComplete() {
            this.gameState = 'levelComplete';
            
            const reward = this.calculateLevelReward();
            this.goldEarned += reward;
            
            this.saveData.gold += this.goldEarned;
            this.saveData.highestLevelPassed = Math.max(this.saveData.highestLevelPassed, this.currentLevel);
            
            if (this.currentLevel >= this.saveData.maxUnlockedLevel) {
                this.saveData.maxUnlockedLevel = this.currentLevel + 1;
            }
            
            this.saveManager.save(this.saveData);
            this.achievementSystem.checkAchievements();
            
            document.getElementById('battleUI').classList.add('hidden');
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
            document.getElementById('levelCompleteGold').textContent = this.goldEarned;
            document.getElementById('levelCompleteScore').textContent = this.score;
            document.getElementById('levelCompleteLevel').textContent = this.currentLevel;
        }

        calculateLevelReward() {
            const baseReward = this.currentLevel * 50;
            const comboBonus = Math.floor(this.comboSystem.combo * 5);
            return baseReward + comboBonus;
        }

        gameOver() {
            this.gameState = 'gameOver';
            
            this.saveData.gold += this.goldEarned;
            this.saveManager.save(this.saveData);
            
            document.getElementById('battleUI').classList.add('hidden');
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('gameOverGold').textContent = this.goldEarned;
            document.getElementById('gameOverLevel').textContent = this.currentLevel;
        }

        retryLevel() {
            document.getElementById('gameOverScreen').classList.remove('show');
            this.startLevel(this.currentLevel);
        }

        returnToMainMenu() {
            if (this.goldEarned > 0) {
                this.saveData.gold += this.goldEarned;
            }
            
            if (this.currentLevel > this.saveData.maxUnlockedLevel) {
                this.saveData.maxUnlockedLevel = this.currentLevel;
            }
            
            this.saveManager.save(this.saveData);
            this.renderMainMenu();
        }

        getLevelConfig(levelNum) {
            const baseLevel = Math.min(levelNum, 9);
            const cycle = Math.max(1, Math.floor((levelNum - 1) / 9) + 1);
            
            const baseConfig = GameData.levelConfigs[baseLevel] || GameData.levelConfigs[9];
            
            const healthMultiplier = 1 + (cycle - 1) * 0.25;
            const speedMultiplier = 1 + (cycle - 1) * 0.05;
            
            return {
                ...baseConfig,
                enemyHealth: Math.floor(baseConfig.enemyHealth * healthMultiplier),
                enemySpeed: baseConfig.enemySpeed * speedMultiplier
            };
        }

        takeDamage(amount) {
            if (this.shield > 0) {
                const shieldDamage = Math.min(this.shield, amount);
                this.shield -= shieldDamage;
                amount -= shieldDamage;
                
                if (amount <= 0) return;
            }
            
            const reduction = 1 - this.playerStats.damageReduction;
            this.playerStats.health -= amount * reduction;
            this.updateUI();
            
            this.effectSystem.createHitParticles(this.player.x, this.player.y, '#FF4444');
            this.effectSystem.addScreenShake(Math.min(10, amount), 0.2);
        }

        takeDamageWithPassive(amount) {
            const character = GameData.characterConfig[this.saveData.selectedCharacter] || 
                            GameData.characterConfig.default;
            
            if (character.passive && character.passive.type === 'health_based_reduction') {
                const healthPercent = this.playerStats.health / this.playerStats.maxHealth;
                const threshold = character.passive.threshold || 0.2;
                const reductionPerThreshold = character.passive.reductionPerThreshold || 0.1;
                
                const thresholdsPassed = Math.floor((1 - healthPercent) / threshold);
                const totalReduction = Math.min(thresholdsPassed * reductionPerThreshold, 0.5);
                
                amount *= (1 - totalReduction);
            }
            
            this.takeDamage(amount);
        }

        render() {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            this.effectSystem.applyScreenShake(this.ctx);
            
            this.drawBackground();
            this.drawPath();
            
            this.particleSystem.render(this.ctx);
            this.effectSystem.renderBulletTrails(this.ctx);
            this.powerupSystem.render(this.ctx);
            this.chestSystem.render(this.ctx);
            this.drawBullets();
            
            this.skillSystem.render(this.ctx);
            this.windingEnemySystem.render(this.ctx);
            this.effectSystem.renderDeathExplosions(this.ctx);
            this.drawPlayer();
            this.effectSystem.renderGlowEffects(this.ctx);
            this.particleSystem.renderDamageNumbers(this.ctx);
            this.effectSystem.renderFloatingTexts(this.ctx);
            
            this.uiManager.render(this.ctx, this.canvas);
            
            if (this.isPaused) {
                this.uiManager.renderPauseOverlay(this.ctx, this.canvas);
            }
            
            this.effectSystem.renderWaveAnnouncement(this.ctx, this.canvas);
            
            this.ctx.restore();
        }

        drawBackground() {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f3460');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            for (let i = 0; i < 50; i++) {
                const x = (Math.sin(i * 123.456) * 0.5 + 0.5) * this.width;
                const y = (Math.cos(i * 789.012) * 0.5 + 0.5) * this.height;
                const size = Math.random() * 2 + 0.5;
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        drawPath() {
            if (!this.path || this.path.length < 2) return;
            
            this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
            this.ctx.lineWidth = 40;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(150, 150, 200, 0.5)';
            this.ctx.lineWidth = 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            this.ctx.stroke();
        }

        drawBullets() {
            for (const bullet of this.bullets) {
                this.ctx.save();
                
                this.ctx.shadowColor = bullet.color;
                this.ctx.shadowBlur = 10;
                
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
                
                const gradient = this.ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, bullet.radius
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, bullet.color);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }

        drawPlayer() {
            if (!this.player) return;
            
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);
            
            if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
                this.ctx.globalAlpha = 0.5;
            }
            
            this.ctx.shadowColor = '#4488ff';
            this.ctx.shadowBlur = 20;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.radius);
            gradient.addColorStop(0, '#88ccff');
            gradient.addColorStop(1, '#4488ff');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.ctx.font = `${this.player.radius * 1.2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🛡️', 0, -2);
            
            this.ctx.restore();
        }

        renderMainMenu() {
            this.gameState = 'mainMenu';
            
            document.getElementById('gameCanvas').classList.add('hidden');
            document.getElementById('battleUI').classList.add('hidden');
            document.getElementById('levelCompleteScreen').classList.add('hidden');
            document.getElementById('gameOverScreen').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
            
            this.mainMenuSystem.renderMainMenu();
        }

        updateUI() {
            this.uiManager.updateUI();
        }

        createGoldParticles(x, y) {
            this.particleSystem.createGoldParticles(x, y);
        }

        createCollectParticles(x, y, color) {
            this.particleSystem.createCollectParticles(x, y, color);
        }

        updateStatistics(type, amount) {
            this.saveManager.updateStatistics(type, amount);
        }

        addComboKill() {
            this.comboSystem.combo++;
            this.comboSystem.comboTimer = 2;
            this.comboSystem.comboMultiplier = 1 + (this.comboSystem.combo - 1) * 0.1;
        }

        onAchievementUnlocked(data) {
            console.log('Achievement unlocked:', data);
            this.effectSystem.addFloatingText(
                this.width / 2,
                this.height / 2,
                `🎉 ${data.name}`,
                '#FFD700',
                2
            );
        }

        onShopPurchase(data) {
            console.log('Shop purchase:', data);
        }
    }

    window.DragonShooterGame = GameCore;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);

})();