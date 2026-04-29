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
            
            const mainScreen = document.getElementById('mainScreen');
            const gameCanvas = document.getElementById('gameCanvas');
            const battleUI = document.getElementById('battleUI');
            const battleLevelDisplay = document.getElementById('battleLevelDisplay');
            
            if (mainScreen) mainScreen.classList.add('hidden');
            if (gameCanvas) gameCanvas.classList.remove('hidden');
            if (battleUI) battleUI.classList.remove('hidden');
            if (battleLevelDisplay) battleLevelDisplay.textContent = `当前第${this.currentLevel}关`;
            
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
            
            const battleUI = document.getElementById('battleUI');
            const levelUpScreen = document.getElementById('levelUpScreen');
            const levelupStats = document.getElementById('levelupStats');
            
            if (battleUI) battleUI.classList.add('hidden');
            if (levelUpScreen) levelUpScreen.classList.remove('hidden');
            if (levelupStats) {
                levelupStats.innerHTML = `
                    <div>关卡: <span class="highlight">${this.currentLevel}</span></div>
                    <div>获得金币: <span class="highlight">${this.goldEarned}</span></div>
                    <div>最终得分: <span class="highlight">${this.score}</span></div>
                `;
            }
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
            
            const battleUI = document.getElementById('battleUI');
            const gameOverScreen = document.getElementById('gameOverScreen');
            const finalLevel = document.getElementById('finalLevel');
            const finalGold = document.getElementById('finalGold');
            const finalScore = document.getElementById('finalScore');
            
            if (battleUI) battleUI.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.remove('hidden');
            if (finalLevel) finalLevel.textContent = this.currentLevel;
            if (finalGold) finalGold.textContent = this.goldEarned;
            if (finalScore) finalScore.textContent = this.score;
        }

        retryLevel() {
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
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
            
            const gameCanvas = document.getElementById('gameCanvas');
            const battleUI = document.getElementById('battleUI');
            const levelUpScreen = document.getElementById('levelUpScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            const mainScreen = document.getElementById('mainScreen');
            
            if (gameCanvas) gameCanvas.classList.add('hidden');
            if (battleUI) battleUI.classList.add('hidden');
            if (levelUpScreen) levelUpScreen.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
            if (mainScreen) mainScreen.classList.remove('hidden');
            
            if (this.mainMenuSystem) {
                this.mainMenuSystem.renderMainMenu();
            }
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

        showToast(message, type = 'info') {
            let existing = document.getElementById('gameToast');
            if (existing) {
                existing.remove();
            }

            const toast = document.createElement('div');
            toast.id = 'gameToast';
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(50, 50, 70, 0.95), rgba(40, 40, 60, 0.95));
                color: #fff;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                z-index: 10000;
                border: 2px solid rgba(255, 215, 0, 0.4);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2);
                animation: toastSlideIn 0.3s ease-out, toastPulse 2s ease-in-out infinite;
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }, 2000);
        }

        checkCollision(a, b) {
            if (!a || !b) return false;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (a.radius || 20) + (b.radius || 20);
            return dist < minDist;
        }

        checkCircleCollision(a, b) {
            return this.checkCollision(a, b);
        }

        createDamageNumber(x, y, value, isCrit = false, isReduced = false) {
            if (this.particleSystem && this.particleSystem.createDamageNumber) {
                this.particleSystem.createDamageNumber(x, y, value, isCrit, isReduced);
            } else if (this.effectSystem && this.effectSystem.addDamageNumber) {
                this.effectSystem.addDamageNumber(x, y, value, isCrit);
            }
        }

        createHitParticles(x, y, color) {
            if (this.particleSystem && this.particleSystem.createHitParticles) {
                this.particleSystem.createHitParticles(x, y, color);
            }
        }

        createKillExplosion(x, y, color, size = 1) {
            if (this.particleSystem && this.particleSystem.createKillExplosion) {
                this.particleSystem.createKillExplosion(x, y, color, size);
            }
        }

        createDeathParticles(x, y, color) {
            if (this.particleSystem && this.particleSystem.createDeathParticles) {
                this.particleSystem.createDeathParticles(x, y, color);
            }
        }

        spawnChest(x, y) {
            if (this.chestSystem && this.chestSystem.spawnChest) {
                this.chestSystem.spawnChest(x, y);
            }
        }

        spawnPowerup(x, y, type = null) {
            if (this.powerupSystem && this.powerupSystem.spawnPowerup) {
                this.powerupSystem.spawnPowerup(x, y, type);
            }
        }

        autoSelectSkill() {
            if (this.skillSystem && this.skillSystem.autoSelectSkill) {
                this.skillSystem.autoSelectSkill();
            }
        }

        dragonReachedEnd(enemy) {
            if (enemy && enemy.segments) {
                const totalDamage = enemy.segments.reduce((sum, s) => sum + (s.maxHealth || 10), 0);
                this.takeDamageWithPassive(totalDamage * 0.1);
            }
            
            const index = this.enemies.indexOf(enemy);
            if (index >= 0) {
                this.enemies.splice(index, 1);
            }
        }
    }

    window.GameCore = GameCore;
    window.DragonShooterGame = GameCore;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        @keyframes toastSlideIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastSlideOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        @keyframes toastPulse {
            0%, 100% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2); }
            50% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.4); }
        }
    `;
    document.head.appendChild(style);

})();