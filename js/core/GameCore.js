(function() {
    'use strict';

    class GameCore {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.width = 0;
            this.height = 0;
            
            this.gameState = 'main_menu';
            this.isPaused = false;
            this.lastTime = 0;
            this.currentTime = 0;
            this.deltaTime = 0;
            
            this.player = null;
            this.bullets = [];
            this.enemies = [];
            this.powerups = [];
            this.chests = [];
            
            this.currentWave = 1;
            this.totalWaves = 10;
            this.remainingEnemies = 0;
            this.totalKills = 0;
            this.gold = 0;
            this.score = 0;
            
            this.eventBus = null;
            this.pluginManager = null;
            this.saveManager = null;
            this.collisionSystem = null;
            this.particleSystem = null;
            this.effectSystem = null;
            this.uiManager = null;
            
            this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
            this.waveAnnouncement = null;
            
            this.activeSkills = [];
            this.passiveSkills = [];
            this.skillCooldowns = {};
            
            this.unlockedSkills = {};
            this.equippedSkills = [];
            
            this.saveData = null;
            this.enemyConfig = {};
            this.skillData = {};
            this.difficultyConfig = {};
            this.waveTypes = [];
            
            this.isInitialized = false;
            this._animationFrameId = null;
        }

        init() {
            if (this.isInitialized) {
                console.log('GameCore already initialized');
                return;
            }

            console.log('Initializing GameCore...');
            
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            this.initSystems();
            this.loadConfig();
            this.loadSaveData();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('GameCore initialized successfully!');
            
            this.emit('game:initialized');
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }

        initSystems() {
            if (window.EventBus) {
                this.eventBus = new EventBus();
            } else {
                this.eventBus = {
                    on: function() {},
                    off: function() {},
                    emit: function() {},
                    once: function() {}
                };
            }
            
            if (window.PluginManager) {
                this.pluginManager = new PluginManager();
            }
            
            if (window.SaveManager) {
                this.saveManager = new SaveManager();
            }
            
            if (window.CollisionSystem) {
                this.collisionSystem = new CollisionSystem();
                this.collisionSystem.setGame(this);
            }
            
            if (window.ParticleSystem) {
                this.particleSystem = new ParticleSystem();
                this.particleSystem.setGame(this);
            }
            
            if (window.EffectSystem) {
                this.effectSystem = new EffectSystem();
                this.effectSystem.setGame(this);
            }
            
            if (window.UIManager) {
                this.uiManager = new UIManager();
                this.uiManager.setGame(this);
            }
            
            if (window.ComboPlugin && this.pluginManager) {
                this.pluginManager.register(new ComboPlugin());
                this.pluginManager.enable('combo');
            }
            
            if (window.ScreenShakePlugin && this.pluginManager) {
                this.pluginManager.register(new ScreenShakePlugin());
                this.pluginManager.enable('screenShake');
            }
        }

        loadConfig() {
            if (window.GameConfig) {
                this.enemyConfig = GameConfig.enemyTypes || {};
                this.skillData = GameConfig.skillData || {};
                this.difficultyConfig = GameConfig.difficultyPresets || {};
            }
            
            if (window.generateWaveTypes) {
                this.waveTypes = generateWaveTypes(this.totalWaves);
            } else {
                this.waveTypes = [];
                for (let i = 0; i < this.totalWaves; i++) {
                    this.waveTypes.push({
                        wave: i + 1,
                        type: 'normal',
                        isBossWave: (i + 1) % 5 === 0,
                        enemyCount: 5 + (i + 1) * 2,
                        enemyTypes: ['dragon']
                    });
                }
            }
        }

        loadSaveData() {
            if (this.saveManager) {
                this.saveData = this.saveManager.load();
            }
            
            if (!this.saveData) {
                if (window.getDefaultSaveData) {
                    this.saveData = getDefaultSaveData();
                } else {
                    this.saveData = {
                        totalGold: 0,
                        highScore: 0,
                        totalKills: 0,
                        totalWavesCompleted: 0,
                        gamesPlayed: 0,
                        unlockedCharacters: ['default'],
                        selectedCharacter: 'default',
                        unlockedSkills: {},
                        equippedSkills: [],
                        difficulty: 'normal',
                        soundEnabled: true,
                        musicEnabled: true,
                        sfxVolume: 1,
                        musicVolume: 0.5
                    };
                }
            }
            
            this.unlockedSkills = this.saveData.unlockedSkills || {};
            this.equippedSkills = this.saveData.equippedSkills || [];
        }

        saveGame() {
            if (this.saveManager && this.saveData) {
                return this.saveManager.save(this.saveData);
            }
            return false;
        }

        setupEventListeners() {
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            document.addEventListener('keyup', (e) => this.handleKeyUp(e));
            
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.handleMouseDown({ 
                    clientX: touch.clientX, 
                    clientY: touch.clientY,
                    button: 0
                });
            });
            
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.handleMouseMove({ 
                    clientX: touch.clientX, 
                    clientY: touch.clientY 
                });
            });
            
            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMouseUp({ button: 0 });
            });
        }

        handleKeyDown(e) {
            this.emit('input:keydown', { key: e.key });
            
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.togglePause();
                } else if (this.isPaused) {
                    this.resumeGame();
                }
                return;
            }
            
            if (this.gameState === 'playing' && !this.isPaused) {
                const skillNum = parseInt(e.key);
                if (skillNum >= 1 && skillNum <= 4) {
                    this.useSkillByIndex(skillNum - 1);
                }
            }
        }

        handleKeyUp(e) {
            this.emit('input:keyup', { key: e.key });
        }

        handleClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.emit('input:click', { x, y, event: e });
        }

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.emit('input:mousemove', { x, y, event: e });
        }

        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.emit('input:mousedown', { x, y, event: e });
        }

        handleMouseUp(e) {
            this.emit('input:mouseup', { event: e });
        }

        startGame() {
            console.log('Starting game...');
            
            this.initGameState();
            this.gameState = 'playing';
            this.isPaused = false;
            
            this.emit('game:start');
            
            this.lastTime = performance.now();
            this._animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }

        initGameState() {
            this.currentWave = 1;
            this.totalKills = 0;
            this.gold = 0;
            this.score = 0;
            
            this.bullets = [];
            this.enemies = [];
            this.powerups = [];
            this.chests = [];
            
            if (window.Player) {
                this.player = new Player(this);
                this.player.init({
                    maxHealth: 100,
                    bulletDamage: 10,
                    moveSpeed: 0.3
                });
            } else {
                this.player = {
                    x: this.width * 0.15,
                    y: this.height / 2,
                    radius: 25,
                    health: 100,
                    maxHealth: 100,
                    bulletDamage: 10,
                    moveSpeed: 0.3,
                    lastShotTime: 0,
                    fireRate: 0.15
                };
            }
            
            this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
            
            if (this.uiManager) {
                this.uiManager.setCurrentScreen('battle');
            }
            
            this.spawnWave(1);
            
            this.showWaveAnnouncement(1);
        }

        spawnWave(waveNum) {
            const waveConfig = this.waveTypes[waveNum - 1];
            if (!waveConfig) return;
            
            const difficulty = this.difficultyConfig[this.saveData?.difficulty] || 
                              this.difficultyConfig.normal || {};
            
            const healthMult = difficulty.healthMultiplier || 1;
            const speedMult = difficulty.speedMultiplier || 1;
            const enemyCount = waveConfig.enemyCount;
            
            this.remainingEnemies = enemyCount;
            
            const path = this.generatePath();
            
            for (let i = 0; i < enemyCount; i++) {
                setTimeout(() => {
                    if (this.gameState !== 'playing') return;
                    
                    const enemyType = waveConfig.enemyTypes[
                        Math.floor(Math.random() * waveConfig.enemyTypes.length)
                    ];
                    
                    const config = this.enemyConfig[enemyType] || {
                        name: 'Unknown',
                        color: '#ff4444',
                        health: 100,
                        speed: 0.8,
                        damage: 5,
                        goldValue: 10,
                        scoreValue: 100,
                        xpValue: 10
                    };
                    
                    let enemy;
                    if (window.Enemy) {
                        enemy = new Enemy(this, {
                            type: enemyType,
                            health: config.health * healthMult,
                            speed: config.speed * speedMult,
                            damage: config.damage,
                            goldValue: config.goldValue,
                            scoreValue: config.scoreValue,
                            xpValue: config.xpValue,
                            color: config.color,
                            isBoss: waveConfig.isBossWave || config.isBoss
                        });
                        enemy.setPath(path);
                    } else {
                        enemy = {
                            x: path[0]?.x || this.width + 50,
                            y: path[0]?.y || this.height / 2,
                            radius: 40,
                            path: path,
                            pathIndex: 0,
                            pathProgress: 0,
                            health: config.health * healthMult,
                            maxHealth: config.health * healthMult,
                            speed: config.speed * speedMult,
                            damage: config.damage,
                            goldValue: config.goldValue,
                            scoreValue: config.scoreValue,
                            color: config.color,
                            isBoss: waveConfig.isBossWave || config.isBoss,
                            isDestroyed: false
                        };
                    }
                    
                    this.enemies.push(enemy);
                    
                }, i * 1000);
            }
        }

        generatePath() {
            const path = [];
            const startX = this.width + 100;
            const endX = -100;
            
            const points = 5 + Math.floor(Math.random() * 3);
            const segmentWidth = (startX - endX) / points;
            
            for (let i = 0; i <= points; i++) {
                const x = startX - segmentWidth * i;
                const y = this.height * 0.3 + Math.random() * this.height * 0.4;
                path.push({ x, y });
            }
            
            path[path.length - 1] = { x: endX, y: this.height / 2 };
            
            return path;
        }

        showWaveAnnouncement(wave) {
            this.waveAnnouncement = {
                wave: wave,
                duration: 2,
                elapsed: 0
            };
        }

        togglePause() {
            if (this.gameState === 'playing') {
                this.isPaused = true;
                this.gameState = 'paused';
                this.emit('game:pause');
            } else if (this.isPaused) {
                this.resumeGame();
            }
        }

        resumeGame() {
            if (this.isPaused) {
                this.isPaused = false;
                this.gameState = 'playing';
                this.lastTime = performance.now();
                this.emit('game:resume');
                this._animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
            }
        }

        gameLoop(currentTime = 0) {
            if (this.gameState !== 'playing' && !this.isPaused) {
                return;
            }
            
            if (this.isPaused) {
                return;
            }
            
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.currentTime = currentTime / 1000;
            
            if (this.deltaTime > 0.1) {
                this._animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
                return;
            }
            
            this.update(this.deltaTime);
            this.render();
            
            this._animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }

        update(dt) {
            if (this.waveAnnouncement) {
                this.waveAnnouncement.elapsed += dt;
                if (this.waveAnnouncement.elapsed >= this.waveAnnouncement.duration) {
                    this.waveAnnouncement = null;
                }
            }
            
            this.updatePlayer(dt);
            this.updateBullets(dt);
            this.updateEnemies(dt);
            this.updateCollisions();
            
            if (this.pluginManager) {
                this.pluginManager.update(dt);
            }
            
            if (this.effectSystem) {
                this.effectSystem.update(dt);
            }
            
            if (this.particleSystem) {
                this.particleSystem.update(dt);
            }
            
            this.updateScreenShake(dt);
            this.updateSkillCooldowns(dt);
            this.checkLevelComplete();
        }

        updatePlayer(dt) {
            if (!this.player) return;
            
            if (this.player.update) {
                this.player.update(dt, this.currentTime);
            }
        }

        updateBullets(dt) {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                
                if (bullet.update) {
                    bullet.update(dt, this.enemies);
                } else {
                    bullet.x += bullet.vx * dt;
                    bullet.y += bullet.vy * dt;
                }
                
                if (bullet.x < -50 || bullet.x > this.width + 50 ||
                    bullet.y < -50 || bullet.y > this.height + 50) {
                    this.bullets.splice(i, 1);
                }
            }
        }

        updateEnemies(dt) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (enemy.update) {
                    enemy.update(dt, this.currentTime);
                } else if (!enemy.isDestroyed && enemy.path) {
                    this.updateEnemyPath(enemy, dt);
                }
                
                if (enemy.isDestroyed) {
                    if (enemy.destroyTimer === undefined) {
                        enemy.destroyTimer = 0;
                    }
                    enemy.destroyTimer += dt;
                    
                    if (enemy.destroyTimer > 0.5) {
                        this.enemies.splice(i, 1);
                    }
                }
            }
        }

        updateEnemyPath(enemy, dt) {
            if (enemy.path.length < 2) return;
            
            const speed = enemy.speed || 0.8;
            const currentIdx = enemy.pathIndex || 0;
            const nextIdx = Math.min(currentIdx + 1, enemy.path.length - 1);
            
            const p1 = enemy.path[currentIdx];
            const p2 = enemy.path[nextIdx];
            
            if (!p1 || !p2) return;
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            
            if (segmentLength > 0) {
                let progress = enemy.pathProgress || 0;
                progress += (speed * dt * 60) / segmentLength;
                
                while (progress >= 1 && currentIdx < enemy.path.length - 2) {
                    progress -= 1;
                    enemy.pathIndex = currentIdx + 1;
                }
                
                enemy.pathProgress = progress;
                
                const t = Math.min(1, progress);
                enemy.x = p1.x + (p2.x - p1.x) * t;
                enemy.y = p1.y + (p2.y - p1.y) * t;
                
                if (enemy.pathIndex >= enemy.path.length - 2 && progress >= 1) {
                    this.damagePlayer(enemy.damage || 5);
                    enemy.isDestroyed = true;
                    this.remainingEnemies--;
                }
            }
        }

        updateCollisions() {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (enemy.isDestroyed) continue;
                    
                    const hit = this.collisionSystem ? 
                        this.collisionSystem.checkCircleCollision(bullet, enemy) :
                        this.checkSimpleCollision(bullet, enemy);
                    
                    if (hit) {
                        this.onBulletHitEnemy(bullet, enemy, i, j);
                        break;
                    }
                }
            }
        }

        checkSimpleCollision(obj1, obj2) {
            if (!obj1 || !obj2) return false;
            
            const dx = obj2.x - obj1.x;
            const dy = obj2.y - obj1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = (obj1.radius || 8) + (obj2.radius || 40);
            
            return distance < minDist;
        }

        onBulletHitEnemy(bullet, enemy, bulletIndex, enemyIndex) {
            const damage = bullet.damage || 10;
            
            if (enemy.takeDamage) {
                const killed = enemy.takeDamage(damage);
                if (killed) {
                    this.onEnemyKilled(enemy);
                }
            } else {
                enemy.health -= damage;
                
                if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.isDestroyed = true;
                    this.onEnemyKilled(enemy);
                }
            }
            
            if (this.effectSystem) {
                this.effectSystem.addDamageNumber(enemy.x, enemy.y, damage, bullet.isCrit);
                this.effectSystem.addScreenShake(bullet.isCrit ? 3 : 1, 0.15);
            }
            
            if (bullet.pierce !== undefined && bullet.pierceCount < bullet.pierce) {
                bullet.pierceCount++;
            } else {
                this.bullets.splice(bulletIndex, 1);
            }
        }

        onEnemyKilled(enemy) {
            this.totalKills++;
            this.gold += enemy.goldValue || 10;
            this.score += enemy.scoreValue || 100;
            this.remainingEnemies--;
            
            if (this.pluginManager) {
                const comboPlugin = this.pluginManager.getPlugin('combo');
                if (comboPlugin && comboPlugin.addComboKill) {
                    comboPlugin.addComboKill();
                }
            }
            
            if (this.effectSystem) {
                this.effectSystem.createDeathExplosion(enemy.x, enemy.y, enemy.color);
            }
            
            if (this.player && this.player.lifesteal) {
                const healAmount = enemy.goldValue * this.player.lifesteal;
                this.player.heal(healAmount);
            }
            
            this.emit('enemy:killed', { enemy, gold: enemy.goldValue });
        }

        damagePlayer(amount) {
            if (!this.player) return;
            
            let finalDamage = amount;
            
            if (this.player.takeDamage) {
                finalDamage = this.player.takeDamage(amount);
            } else {
                if (this.player.damageReduction) {
                    finalDamage *= (1 - this.player.damageReduction);
                }
                this.player.health = Math.max(0, this.player.health - finalDamage);
            }
            
            if (finalDamage > 0 && this.effectSystem) {
                this.effectSystem.addScreenShake(2, 0.2);
                this.effectSystem.addDamageNumber(this.player.x, this.player.y, finalDamage, false);
            }
            
            if (this.player.health <= 0) {
                this.gameOver();
            }
            
            this.emit('player:damaged', { damage: finalDamage });
        }

        updateScreenShake(dt) {
            if (this.screenShake.duration > 0) {
                this.screenShake.duration -= dt;
                const shake = this.screenShake.intensity * (this.screenShake.duration / 0.3);
                this.screenShake.x = (Math.random() - 0.5) * shake * 2;
                this.screenShake.y = (Math.random() - 0.5) * shake * 2;
            } else {
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }

        addScreenShake(intensity, duration) {
            this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
            this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        }

        updateSkillCooldowns(dt) {
            for (const skillId in this.skillCooldowns) {
                if (this.skillCooldowns[skillId] > 0) {
                    this.skillCooldowns[skillId] -= dt;
                }
            }
        }

        useSkillByIndex(index) {
            if (index >= this.equippedSkills.length) return;
            
            const skillId = this.equippedSkills[index];
            this.useSkill(skillId);
        }

        useSkill(skillId) {
            if (!skillId) return false;
            
            const skill = this.skillData[skillId];
            if (!skill) return false;
            
            if (!this.unlockedSkills[skillId]) return false;
            
            if (this.skillCooldowns[skillId] > 0) return false;
            
            this.skillCooldowns[skillId] = skill.cooldown || 5;
            
            this.executeSkill(skillId, skill);
            this.emit('skill:used', { skillId, skill });
            
            return true;
        }

        executeSkill(skillId, skill) {
            if (skillId === 'fireball') {
                const mouseX = this.width / 2;
                const mouseY = this.height / 2;
                const damage = skill.damage || 50;
                const radius = skill.radius || 100;
                
                for (const enemy of this.enemies) {
                    if (enemy.isDestroyed) continue;
                    const dist = Math.sqrt(
                        Math.pow(enemy.x - mouseX, 2) + 
                        Math.pow(enemy.y - mouseY, 2)
                    );
                    if (dist < radius) {
                        if (enemy.takeDamage) {
                            if (enemy.takeDamage(damage)) {
                                this.onEnemyKilled(enemy);
                            }
                        } else {
                            enemy.health -= damage;
                            if (enemy.health <= 0) {
                                enemy.isDestroyed = true;
                                this.onEnemyKilled(enemy);
                            }
                        }
                    }
                }
                
                if (this.effectSystem) {
                    this.effectSystem.addScreenShake(3, 0.25);
                }
                
            } else if (skillId === 'thunder') {
                const nearest = this.findNearestEnemy();
                if (nearest) {
                    const damage = skill.damage || 35;
                    if (nearest.takeDamage) {
                        if (nearest.takeDamage(damage)) {
                            this.onEnemyKilled(nearest);
                        }
                    } else {
                        nearest.health -= damage;
                        if (nearest.health <= 0) {
                            nearest.isDestroyed = true;
                            this.onEnemyKilled(nearest);
                        }
                    }
                }
                
            } else if (skillId === 'iceWall') {
                const shieldAmount = skill.shieldAmount || 100;
                if (this.player) {
                    this.player.addShield(shieldAmount, 10);
                }
                
            } else if (skillId === 'heal') {
                const healAmount = skill.healAmount || 50;
                if (this.player) {
                    this.player.heal(healAmount);
                    if (this.effectSystem) {
                        this.effectSystem.addGlowEffect(this.player.x, this.player.y, '#44ff44', 100, 0.5);
                    }
                }
                
            } else if (skillId === 'dash') {
                if (this.player) {
                    this.player.isInvincible = true;
                    this.player.invincibleTimer = skill.invulnerableDuration || 0.5;
                }
            }
        }

        findNearestEnemy() {
            if (!this.player) return null;
            
            let nearest = null;
            let minDist = Infinity;
            
            for (const enemy of this.enemies) {
                if (enemy.isDestroyed) continue;
                const dist = Math.sqrt(
                    Math.pow(enemy.x - this.player.x, 2) + 
                    Math.pow(enemy.y - this.player.y, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }
            
            return nearest;
        }

        checkLevelComplete() {
            if (this.remainingEnemies <= 0 && this.enemies.filter(e => !e.isDestroyed).length === 0) {
                if (this.currentWave < this.totalWaves) {
                    this.currentWave++;
                    this.showWaveAnnouncement(this.currentWave);
                    setTimeout(() => {
                        if (this.gameState === 'playing') {
                            this.spawnWave(this.currentWave);
                        }
                    }, 2000);
                } else {
                    this.levelComplete();
                }
            }
        }

        levelComplete() {
            this.gameState = 'level_complete';
            this.emit('game:levelComplete', {
                wave: this.currentWave,
                gold: this.gold,
                score: this.score,
                kills: this.totalKills
            });
            
            if (this.saveData) {
                this.saveData.totalGold += this.gold;
                this.saveData.totalKills += this.totalKills;
                this.saveData.totalWavesCompleted = Math.max(
                    this.saveData.totalWavesCompleted || 0,
                    this.currentWave
                );
                this.saveData.gamesPlayed = (this.saveData.gamesPlayed || 0) + 1;
                this.saveGame();
            }
        }

        gameOver() {
            this.gameState = 'game_over';
            this.emit('game:over', {
                wave: this.currentWave,
                gold: this.gold,
                score: this.score,
                kills: this.totalKills
            });
            
            if (this._animationFrameId) {
                cancelAnimationFrame(this._animationFrameId);
            }
            
            if (this.saveData) {
                this.saveData.totalGold += this.gold;
                this.saveData.totalKills += this.totalKills;
                this.saveData.gamesPlayed = (this.saveData.gamesPlayed || 0) + 1;
                this.saveGame();
            }
        }

        render() {
            this.ctx.save();
            
            if (this.screenShake.x !== 0 || this.screenShake.y !== 0) {
                this.ctx.translate(this.screenShake.x, this.screenShake.y);
            }
            
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            this.drawBackground();
            this.drawPath();
            
            if (this.particleSystem) {
                this.particleSystem.render(this.ctx);
            }
            
            if (this.effectSystem) {
                this.effectSystem.render(this.ctx);
            }
            
            this.drawBullets();
            this.drawEnemies();
            this.drawPlayer();
            
            if (this.uiManager) {
                this.uiManager.render(this.ctx, this.canvas);
            }
            
            this.renderHUD();
            this.renderWaveAnnouncement();
            
            this.ctx.restore();
        }

        drawBackground() {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f0f1a');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 137.5) % this.width;
                const y = (i * 73.3) % this.height;
                const size = (i % 3) + 1;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        drawPath() {
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
            this.ctx.lineWidth = 80;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.width + 50, this.height / 2);
            
            for (let i = 0; i < 5; i++) {
                const x = this.width - (i + 1) * (this.width / 5);
                const y = this.height * (0.3 + Math.sin(i) * 0.2);
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.lineTo(-50, this.height / 2);
            this.ctx.stroke();
        }

        drawBullets() {
            for (const bullet of this.bullets) {
                if (bullet.render) {
                    bullet.render(this.ctx);
                } else {
                    this.ctx.fillStyle = bullet.isCrit ? '#FFD700' : '#ffcc00';
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, bullet.radius || 8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        drawEnemies() {
            for (const enemy of this.enemies) {
                if (enemy.render) {
                    enemy.render(this.ctx);
                } else if (!enemy.isDestroyed) {
                    this.ctx.fillStyle = enemy.color;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    if (enemy.health !== undefined) {
                        const barWidth = enemy.radius * 2;
                        const barHeight = 6;
                        const healthPercent = enemy.health / enemy.maxHealth;
                        
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        this.ctx.fillRect(
                            enemy.x - barWidth / 2,
                            enemy.y - enemy.radius - 15,
                            barWidth,
                            barHeight
                        );
                        
                        this.ctx.fillStyle = healthPercent > 0.3 ? '#44ff44' : '#ff4444';
                        this.ctx.fillRect(
                            enemy.x - barWidth / 2,
                            enemy.y - enemy.radius - 15,
                            barWidth * healthPercent,
                            barHeight
                        );
                    }
                }
            }
        }

        drawPlayer() {
            if (!this.player) return;
            
            if (this.player.render) {
                this.player.render(this.ctx);
            } else {
                const gradient = this.ctx.createRadialGradient(
                    this.player.x - 5, this.player.y - 5, 0,
                    this.player.x, this.player.y, this.player.radius
                );
                gradient.addColorStop(0, '#88aaff');
                gradient.addColorStop(1, '#4488ff');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#2244aa';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(this.player.x - 8, this.player.y - 5, 8, 0, Math.PI * 2);
                this.ctx.arc(this.player.x + 8, this.player.y - 5, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(this.player.x - 8, this.player.y - 5, 4, 0, Math.PI * 2);
                this.ctx.arc(this.player.x + 8, this.player.y - 5, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        renderHUD() {
            if (!this.player) return;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(20, 20, 280, 70);
            
            const healthPercent = this.player.health / this.player.maxHealth;
            this.ctx.fillStyle = 'rgba(80, 20, 20, 0.8)';
            this.ctx.fillRect(30, 30, 240, 20);
            this.ctx.fillStyle = healthPercent > 0.3 ? '#44ff44' : '#ff4444';
            this.ctx.fillRect(30, 30, 240 * healthPercent, 20);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(30, 30, 240, 20);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                `生命: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`,
                35, 45
            );
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(this.width - 200, 20, 180, 60);
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`💰 ${Math.floor(this.gold)}`, this.width - 30, 45);
            
            this.ctx.fillStyle = '#ff6600';
            this.ctx.fillText(`⚔️ 第${this.currentWave}波`, this.width - 30, 68);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `波次进度: ${this.currentWave}/${this.totalWaves}`,
                this.width / 2, 35
            );
        }

        renderWaveAnnouncement() {
            if (!this.waveAnnouncement) return;
            
            const progress = this.waveAnnouncement.elapsed / this.waveAnnouncement.duration;
            const fadeIn = Math.min(1, progress * 5);
            const fadeOut = Math.max(0, 1 - (progress - 0.7) / 0.3);
            const alpha = fadeIn * fadeOut;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            this.ctx.font = 'bold 80px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ff6600';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            
            const text = `第 ${this.waveAnnouncement.wave} 波`;
            this.ctx.strokeText(text, this.width / 2, this.height / 2 - 50);
            this.ctx.fillText(text, this.width / 2, this.height / 2 - 50);
            
            this.ctx.font = 'bold 30px Arial';
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText('准备战斗!', this.width / 2, this.height / 2 + 30);
            this.ctx.fillText('准备战斗!', this.width / 2, this.height / 2 + 30);
            
            this.ctx.restore();
        }

        emit(eventName, data) {
            if (this.eventBus) {
                this.eventBus.emit(eventName, data);
            }
        }

        on(eventName, callback) {
            if (this.eventBus) {
                this.eventBus.on(eventName, callback);
            }
        }

        getState() {
            return {
                gameState: this.gameState,
                isPaused: this.isPaused,
                currentWave: this.currentWave,
                totalWaves: this.totalWaves,
                totalKills: this.totalKills,
                gold: this.gold,
                score: this.score,
                playerHealth: this.player?.health || 0,
                playerMaxHealth: this.player?.maxHealth || 100
            };
        }

        destroy() {
            if (this._animationFrameId) {
                cancelAnimationFrame(this._animationFrameId);
            }
            this.isInitialized = false;
            this.emit('game:destroyed');
        }
    }

    if (typeof window !== 'undefined') {
        window.GameCore = GameCore;
    }

})();
