class DragonShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'start';
        this.isPaused = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initGame();
        this.setupEventListeners();
        this.loadLuaData();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    initGame() {
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.chests = [];
        this.particles = [];
        this.powerups = [];
        this.damageNumbers = [];
        
        this.level = 1;
        this.score = 0;
        this.gold = 0;
        this.enemiesKilled = 0;
        this.chestsOpened = 0;
        this.enemiesInLevel = 0;
        this.totalEnemiesInLevel = 0;
        
        this.lastTime = 0;
        this.shootTimer = 0;
        this.spawnTimer = 0;
        this.chestSpawnTimer = 0;
        
        this.playerStats = {
            maxHealth: 100,
            health: 100,
            speed: 5,
            bulletSpeed: 10,
            bulletDamage: 10,
            bulletCount: 1,
            bulletSpread: 0,
            fireRate: 0.15,
            bulletSize: 8,
            bulletPierce: 0,
            criticalChance: 0,
            criticalDamage: 1.5,
            bulletBounce: 0,
            magnetRange: 50
        };
        
        this.unlockedSkills = [];
        this.activeBuffs = [];
        
        this.targetPosition = null;
        this.isMoving = false;
    }
    
    loadLuaData() {
        if (typeof WasmMoon !== 'undefined') {
            this.luaRuntime = WasmMoon;
            this.initLuaScripts();
        } else {
            console.log('Lua runtime not available, using default data');
            this.initDefaultData();
        }
    }
    
    initLuaScripts() {
        const luaCode = `
-- 关卡配置
levels = {
    [1] = { enemyCount = 10, enemyHealth = 50, enemySpeed = 1, enemyDamage = 5, dropChance = 0.3 },
    [2] = { enemyCount = 15, enemyHealth = 60, enemySpeed = 1.1, enemyDamage = 6, dropChance = 0.35 },
    [3] = { enemyCount = 20, enemyHealth = 75, enemySpeed = 1.2, enemyDamage = 8, dropChance = 0.4, unlockAbility = true },
    [4] = { enemyCount = 25, enemyHealth = 90, enemySpeed = 1.3, enemyDamage = 10, dropChance = 0.4 },
    [5] = { enemyCount = 30, enemyHealth = 110, enemySpeed = 1.4, enemyDamage = 12, dropChance = 0.45 },
    [6] = { enemyCount = 35, enemyHealth = 130, enemySpeed = 1.5, enemyDamage = 15, dropChance = 0.5, unlockAbility = true }
}

-- 技能配置
skills = {
    {
        id = "bullet_count",
        name = "多重射击",
        description = "子弹数量+1",
        icon = "🎯",
        effect = function(stats)
            stats.bulletCount = stats.bulletCount + 1
            return stats
        end
    },
    {
        id = "bullet_spread",
        name = "扇形射击",
        description = "子弹覆盖范围扩大",
        icon = "🌟",
        effect = function(stats)
            stats.bulletSpread = stats.bulletSpread + 15
            return stats
        end
    },
    {
        id = "fire_rate",
        name = "快速射击",
        description = "射击速度提升20%",
        icon = "⚡",
        effect = function(stats)
            stats.fireRate = stats.fireRate * 0.8
            return stats
        end
    },
    {
        id = "damage",
        name = "强力子弹",
        description = "子弹伤害+25%",
        icon = "💥",
        effect = function(stats)
            stats.bulletDamage = math.floor(stats.bulletDamage * 1.25)
            return stats
        end
    },
    {
        id = "health",
        name = "生命恢复",
        description = "恢复30点生命值",
        icon = "❤️",
        effect = function(stats)
            stats.health = math.min(stats.health + 30, stats.maxHealth)
            return stats
        end
    },
    {
        id = "max_health",
        name = "生命强化",
        description = "最大生命值+25",
        icon = "💗",
        effect = function(stats)
            stats.maxHealth = stats.maxHealth + 25
            stats.health = stats.health + 25
            return stats
        end
    },
    {
        id = "bullet_size",
        name = "巨型子弹",
        description = "子弹体积变大",
        icon = "🔵",
        effect = function(stats)
            stats.bulletSize = stats.bulletSize + 3
            return stats
        end
    },
    {
        id = "speed",
        name = "加速移动",
        description = "移动速度+15%",
        icon = "🏃",
        effect = function(stats)
            stats.speed = stats.speed * 1.15
            return stats
        end
    },
    {
        id = "pierce",
        name = "穿透子弹",
        description = "子弹可穿透敌人",
        icon = "🎯",
        effect = function(stats)
            stats.bulletPierce = stats.bulletPierce + 1
            return stats
        end
    },
    {
        id = "crit_chance",
        name = "暴击专精",
        description = "暴击几率+10%",
        icon = "⭐",
        effect = function(stats)
            stats.criticalChance = stats.criticalChance + 0.1
            return stats
        end
    },
    {
        id = "crit_damage",
        name = "暴击强化",
        description = "暴击伤害+50%",
        icon = "💫",
        effect = function(stats)
            stats.criticalDamage = stats.criticalDamage + 0.5
            return stats
        end
    },
    {
        id = "magnet",
        name = "磁铁效果",
        description = "自动吸引道具范围+50",
        icon = "🧲",
        effect = function(stats)
            stats.magnetRange = stats.magnetRange + 50
            return stats
        end
    }
}

-- 道具配置
powerups = {
    {
        id = "gold",
        name = "金币",
        icon = "💰",
        color = "#FFD700",
        effect = function(game, powerup)
            game.gold = game.gold + 10
            game.updateUI()
        end
    },
    {
        id = "health_pack",
        name = "生命包",
        icon = "💊",
        color = "#FF6B6B",
        effect = function(game, powerup)
            game.playerStats.health = math.min(
                game.playerStats.health + 20,
                game.playerStats.maxHealth
            )
            game.updateUI()
        end
    },
    {
        id = "damage_boost",
        name = "伤害提升",
        icon = "⚔️",
        color = "#FF4444",
        duration = 10,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "damage_boost",
                multiplier = 1.5,
                startTime = game.currentTime,
                duration = 10
            })
        end
    },
    {
        id = "speed_boost",
        name = "速度提升",
        icon = "💨",
        color = "#00CED1",
        duration = 8,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "speed_boost",
                multiplier = 1.3,
                startTime = game.currentTime,
                duration = 8
            })
        end
    }
}

-- 获取关卡配置
function getLevelConfig(levelNum)
    local baseLevel = ((levelNum - 1) % 6) + 1
    local multiplier = math.floor((levelNum - 1) / 6) + 1
    
    local config = levels[baseLevel] or levels[1]
    local result = {
        enemyCount = config.enemyCount + (multiplier - 1) * 10,
        enemyHealth = math.floor(config.enemyHealth * (1 + (multiplier - 1) * 0.3)),
        enemySpeed = config.enemySpeed + (multiplier - 1) * 0.1,
        enemyDamage = math.floor(config.enemyDamage * (1 + (multiplier - 1) * 0.2)),
        dropChance = math.min(config.dropChance + (multiplier - 1) * 0.05, 0.7),
        unlockAbility = config.unlockAbility or false
    }
    return result
end

-- 获取随机技能
function getRandomSkills(count, excludeIds)
    excludeIds = excludeIds or {}
    local available = {}
    
    for i, skill in ipairs(skills) do
        local excluded = false
        for _, excludeId in ipairs(excludeIds) do
            if skill.id == excludeId then
                excluded = true
                break
            end
        end
        if not excluded then
            table.insert(available, skill)
        end
    end
    
    local result = {}
    for i = 1, math.min(count, #available) do
        local idx = math.random(1, #available)
        table.insert(result, available[idx])
        table.remove(available, idx)
    end
    
    return result
end

return {
    getLevelConfig = getLevelConfig,
    getRandomSkills = getRandomSkills,
    skills = skills,
    powerups = powerups
}
`;

        this.levelConfigs = {
            1: { enemyCount: 10, enemyHealth: 50, enemySpeed: 1, enemyDamage: 5, dropChance: 0.3 },
            2: { enemyCount: 15, enemyHealth: 60, enemySpeed: 1.1, enemyDamage: 6, dropChance: 0.35 },
            3: { enemyCount: 20, enemyHealth: 75, enemySpeed: 1.2, enemyDamage: 8, dropChance: 0.4, unlockAbility: true },
            4: { enemyCount: 25, enemyHealth: 90, enemySpeed: 1.3, enemyDamage: 10, dropChance: 0.4 },
            5: { enemyCount: 30, enemyHealth: 110, enemySpeed: 1.4, enemyDamage: 12, dropChance: 0.45 },
            6: { enemyCount: 35, enemyHealth: 130, enemySpeed: 1.5, enemyDamage: 15, dropChance: 0.5, unlockAbility: true }
        };

        this.skills = [
            { id: "bullet_count", name: "多重射击", description: "子弹数量+1", icon: "🎯" },
            { id: "bullet_spread", name: "扇形射击", description: "子弹覆盖范围扩大", icon: "🌟" },
            { id: "fire_rate", name: "快速射击", description: "射击速度提升20%", icon: "⚡" },
            { id: "damage", name: "强力子弹", description: "子弹伤害+25%", icon: "💥" },
            { id: "health", name: "生命恢复", description: "恢复30点生命值", icon: "❤️" },
            { id: "max_health", name: "生命强化", description: "最大生命值+25", icon: "💗" },
            { id: "bullet_size", name: "巨型子弹", description: "子弹体积变大", icon: "🔵" },
            { id: "speed", name: "加速移动", description: "移动速度+15%", icon: "🏃" },
            { id: "pierce", name: "穿透子弹", description: "子弹可穿透敌人", icon: "🎯" },
            { id: "crit_chance", name: "暴击专精", description: "暴击几率+10%", icon: "⭐" },
            { id: "crit_damage", name: "暴击强化", description: "暴击伤害+50%", icon: "💫" },
            { id: "magnet", name: "磁铁效果", description: "自动吸引道具范围+50", icon: "🧲" }
        ];

        this.powerups = [
            { id: "gold", name: "金币", icon: "💰", color: "#FFD700" },
            { id: "health_pack", name: "生命包", icon: "💊", color: "#FF6B6B" },
            { id: "damage_boost", name: "伤害提升", icon: "⚔️", color: "#FF4444", duration: 10 },
            { id: "speed_boost", name: "速度提升", icon: "💨", color: "#00CED1", duration: 8 }
        ];
    }
    
    initDefaultData() {
        this.levelConfigs = {
            1: { enemyCount: 10, enemyHealth: 50, enemySpeed: 1, enemyDamage: 5, dropChance: 0.3 },
            2: { enemyCount: 15, enemyHealth: 60, enemySpeed: 1.1, enemyDamage: 6, dropChance: 0.35 },
            3: { enemyCount: 20, enemyHealth: 75, enemySpeed: 1.2, enemyDamage: 8, dropChance: 0.4, unlockAbility: true },
            4: { enemyCount: 25, enemyHealth: 90, enemySpeed: 1.3, enemyDamage: 10, dropChance: 0.4 },
            5: { enemyCount: 30, enemyHealth: 110, enemySpeed: 1.4, enemyDamage: 12, dropChance: 0.45 },
            6: { enemyCount: 35, enemyHealth: 130, enemySpeed: 1.5, enemyDamage: 15, dropChance: 0.5, unlockAbility: true }
        };

        this.skills = [
            { id: "bullet_count", name: "多重射击", description: "子弹数量+1", icon: "🎯" },
            { id: "bullet_spread", name: "扇形射击", description: "子弹覆盖范围扩大", icon: "🌟" },
            { id: "fire_rate", name: "快速射击", description: "射击速度提升20%", icon: "⚡" },
            { id: "damage", name: "强力子弹", description: "子弹伤害+25%", icon: "💥" },
            { id: "health", name: "生命恢复", description: "恢复30点生命值", icon: "❤️" },
            { id: "max_health", name: "生命强化", description: "最大生命值+25", icon: "💗" },
            { id: "bullet_size", name: "巨型子弹", description: "子弹体积变大", icon: "🔵" },
            { id: "speed", name: "加速移动", description: "移动速度+15%", icon: "🏃" },
            { id: "pierce", name: "穿透子弹", description: "子弹可穿透敌人", icon: "🎯" },
            { id: "crit_chance", name: "暴击专精", description: "暴击几率+10%", icon: "⭐" },
            { id: "crit_damage", name: "暴击强化", description: "暴击伤害+50%", icon: "💫" },
            { id: "magnet", name: "磁铁效果", description: "自动吸引道具范围+50", icon: "🧲" }
        ];

        this.powerups = [
            { id: "gold", name: "金币", icon: "💰", color: "#FFD700" },
            { id: "health_pack", name: "生命包", icon: "💊", color: "#FF6B6B" },
            { id: "damage_boost", name: "伤害提升", icon: "⚔️", color: "#FF4444", duration: 10 },
            { id: "speed_boost", name: "速度提升", icon: "💨", color: "#00CED1", duration: 8 }
        ];
    }
    
    getLevelConfig(levelNum) {
        const baseLevel = ((levelNum - 1) % 6) + 1;
        const multiplier = Math.floor((levelNum - 1) / 6) + 1;
        
        const config = this.levelConfigs[baseLevel] || this.levelConfigs[1];
        
        return {
            enemyCount: config.enemyCount + (multiplier - 1) * 10,
            enemyHealth: Math.floor(config.enemyHealth * (1 + (multiplier - 1) * 0.3)),
            enemySpeed: config.enemySpeed + (multiplier - 1) * 0.1,
            enemyDamage: Math.floor(config.enemyDamage * (1 + (multiplier - 1) * 0.2)),
            dropChance: Math.min(config.dropChance + (multiplier - 1) * 0.05, 0.7),
            unlockAbility: config.unlockAbility || false
        };
    }
    
    getRandomSkills(count, excludeIds) {
        excludeIds = excludeIds || [];
        let available = this.skills.filter(skill => !excludeIds.includes(skill.id));
        
        const result = [];
        for (let i = 0; i < Math.min(count, available.length); i++) {
            const idx = Math.floor(Math.random() * available.length);
            result.push(available[idx]);
            available.splice(idx, 1);
        }
        
        return result;
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('continueBtn').addEventListener('click', () => this.nextLevel());
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleTouchStart(e) {
        if (this.gameState !== 'playing') return;
        e.preventDefault();
        const touch = e.touches[0];
        this.targetPosition = {
            x: touch.clientX,
            y: touch.clientY
        };
        this.isMoving = true;
    }
    
    handleTouchMove(e) {
        if (this.gameState !== 'playing') return;
        e.preventDefault();
        if (!this.isMoving) return;
        const touch = e.touches[0];
        this.targetPosition = {
            x: touch.clientX,
            y: touch.clientY
        };
    }
    
    handleTouchEnd(e) {
        this.isMoving = false;
        this.targetPosition = null;
    }
    
    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        this.targetPosition = {
            x: e.clientX,
            y: e.clientY
        };
        this.isMoving = true;
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'playing') return;
        if (!this.isMoving) return;
        this.targetPosition = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    handleMouseUp(e) {
        this.isMoving = false;
        this.targetPosition = null;
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        this.keys = this.keys || {};
        this.keys[e.key.toLowerCase()] = true;
    }
    
    handleKeyUp(e) {
        if (this.gameState !== 'playing') return;
        this.keys = this.keys || {};
        this.keys[e.key.toLowerCase()] = false;
    }
    
    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.initGame();
        this.initPlayer();
        this.startLevel(1);
        this.gameState = 'playing';
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    restartGame() {
        document.getElementById('gameOverScreen').classList.remove('show');
        this.initGame();
        this.initPlayer();
        this.startLevel(1);
        this.gameState = 'playing';
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    initPlayer() {
        this.player = {
            x: this.width / 2,
            y: this.height - 150,
            width: 40,
            height: 40,
            radius: 20,
            angle: -Math.PI / 2,
            invincible: 0
        };
    }
    
    startLevel(levelNum) {
        this.level = levelNum;
        const config = this.getLevelConfig(levelNum);
        
        this.enemiesInLevel = 0;
        this.totalEnemiesInLevel = config.enemyCount;
        this.enemiesKilled = 0;
        this.chestsOpened = 0;
        
        this.enemies = [];
        this.powerups = [];
        this.chests = [];
        
        this.updateUI();
        
        console.log(`Level ${levelNum} started! Enemies: ${config.enemyCount}`);
    }
    
    nextLevel() {
        document.getElementById('levelUpScreen').classList.remove('show');
        const newLevel = this.level + 1;
        this.startLevel(newLevel);
        this.gameState = 'playing';
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.currentTime = currentTime / 1000;
        
        if (deltaTime > 0.1) {
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(dt) {
        this.updatePlayer(dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.updateChests(dt);
        this.updatePowerups(dt);
        this.updateParticles(dt);
        this.updateDamageNumbers(dt);
        this.updateBuffs(dt);
        this.updateSpawning(dt);
        this.checkLevelComplete();
    }
    
    updatePlayer(dt) {
        if (!this.player) return;
        
        const keys = this.keys || {};
        let dx = 0, dy = 0;
        
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        
        if (this.isMoving && this.targetPosition) {
            const targetX = this.targetPosition.x;
            const targetY = this.targetPosition.y;
            
            dx = targetX - this.player.x;
            dy = targetY - this.player.y;
            
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                dx /= dist;
                dy /= dist;
            } else {
                dx = 0;
                dy = 0;
            }
        }
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                dx /= len;
                dy /= len;
            }
            
            const speedMultiplier = this.getBuffMultiplier('speed_boost');
            const speed = this.playerStats.speed * speedMultiplier * 60 * dt;
            
            this.player.x += dx * speed;
            this.player.y += dy * speed;
            
            this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
            this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
        }
        
        if (this.player.invincible > 0) {
            this.player.invincible -= dt;
        }
        
        this.shootTimer += dt;
        if (this.shootTimer >= this.playerStats.fireRate) {
            this.shoot();
            this.shootTimer = 0;
        }
    }
    
    getBuffMultiplier(buffType) {
        let multiplier = 1;
        for (const buff of this.activeBuffs) {
            if (buff.type === buffType) {
                multiplier *= buff.multiplier;
            }
        }
        return multiplier;
    }
    
    shoot() {
        if (!this.player) return;
        
        const bulletCount = this.playerStats.bulletCount;
        const spread = this.playerStats.bulletSpread;
        
        const baseAngle = -Math.PI / 2;
        
        for (let i = 0; i < bulletCount; i++) {
            let angle = baseAngle;
            
            if (bulletCount > 1) {
                const startAngle = baseAngle - (spread * Math.PI / 180) / 2;
                const angleStep = (spread * Math.PI / 180) / (bulletCount - 1);
                angle = startAngle + i * angleStep;
            }
            
            const isCrit = Math.random() < this.playerStats.criticalChance;
            const critMultiplier = isCrit ? this.playerStats.criticalDamage : 1;
            const damageBoost = this.getBuffMultiplier('damage_boost');
            
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - this.player.radius,
                vx: Math.cos(angle) * this.playerStats.bulletSpeed,
                vy: Math.sin(angle) * this.playerStats.bulletSpeed,
                radius: this.playerStats.bulletSize,
                damage: Math.floor(this.playerStats.bulletDamage * critMultiplier * damageBoost),
                isCrit: isCrit,
                pierceCount: this.playerStats.bulletPierce,
                color: isCrit ? '#FFD700' : '#00FFFF'
            });
        }
    }
    
    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * 60 * dt;
            bullet.y += bullet.vy * 60 * dt;
            
            if (bullet.x < -bullet.radius || bullet.x > this.width + bullet.radius ||
                bullet.y < -bullet.radius || bullet.y > this.height + bullet.radius) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies(dt) {
        const levelConfig = this.getLevelConfig(this.level);
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.player) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    enemy.x += (dx / dist) * enemy.speed * 60 * dt;
                    enemy.y += (dy / dist) * enemy.speed * 60 * dt;
                }
            }
            
            enemy.angle += dt * 2;
            
            if (this.checkCollision(enemy, this.player)) {
                if (this.player.invincible <= 0) {
                    this.takeDamage(enemy.damage);
                    this.player.invincible = 0.5;
                }
            }
            
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                
                if (this.checkCircleCollision(bullet, enemy)) {
                    enemy.health -= bullet.damage;
                    
                    this.damageNumbers.push({
                        x: enemy.x,
                        y: enemy.y - enemy.radius,
                        value: bullet.damage,
                        isCrit: bullet.isCrit,
                        lifetime: 1,
                        vy: -2
                    });
                    
                    this.createHitParticles(bullet.x, bullet.y, bullet.color);
                    
                    if (bullet.pierceCount > 0) {
                        bullet.pierceCount--;
                    } else {
                        this.bullets.splice(j, 1);
                    }
                    
                    if (enemy.health <= 0) {
                        this.createDeathParticles(enemy.x, enemy.y, enemy.color);
                        this.enemiesKilled++;
                        this.score += enemy.health;
                        
                        if (Math.random() < levelConfig.dropChance) {
                            this.spawnPowerup(enemy.x, enemy.y);
                        }
                        
                        this.enemies.splice(i, 1);
                        
                        this.showSkillSelection();
                        break;
                    }
                }
            }
        }
        
        this.updateUI();
    }
    
    updateChests(dt) {
        for (let i = this.chests.length - 1; i >= 0; i--) {
            const chest = this.chests[i];
            chest.bobOffset = Math.sin(Date.now() / 500 + i) * 5;
            
            if (this.checkCollision(chest, this.player)) {
                this.openChest(chest);
                this.chests.splice(i, 1);
            }
        }
    }
    
    openChest(chest) {
        this.chestsOpened++;
        this.gold += 20;
        this.score += 50;
        
        this.createGoldParticles(chest.x, chest.y);
        
        for (let i = 0; i < 2; i++) {
            if (Math.random() < 0.7) {
                this.spawnPowerup(
                    chest.x + (Math.random() - 0.5) * 50,
                    chest.y + (Math.random() - 0.5) * 50
                );
            }
        }
        
        this.updateUI();
    }
    
    updatePowerups(dt) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.angle += dt * 2;
            powerup.bobOffset = Math.sin(Date.now() / 300 + i) * 3;
            
            if (this.player) {
                const dx = this.player.x - powerup.x;
                const dy = this.player.y - powerup.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.playerStats.magnetRange) {
                    const attractSpeed = 8;
                    powerup.x += (dx / dist) * attractSpeed * 60 * dt;
                    powerup.y += (dy / dist) * attractSpeed * 60 * dt;
                }
                
                if (dist < this.player.radius + powerup.radius) {
                    this.collectPowerup(powerup);
                    this.powerups.splice(i, 1);
                }
            }
        }
    }
    
    collectPowerup(powerup) {
        switch (powerup.id) {
            case 'gold':
                this.gold += 10;
                this.score += 10;
                break;
            case 'health_pack':
                this.playerStats.health = Math.min(
                    this.playerStats.health + 20,
                    this.playerStats.maxHealth
                );
                break;
            case 'damage_boost':
                this.activeBuffs.push({
                    type: 'damage_boost',
                    multiplier: 1.5,
                    startTime: this.currentTime,
                    duration: 10
                });
                break;
            case 'speed_boost':
                this.activeBuffs.push({
                    type: 'speed_boost',
                    multiplier: 1.3,
                    startTime: this.currentTime,
                    duration: 8
                });
                break;
        }
        
        this.createCollectParticles(powerup.x, powerup.y, powerup.color);
        this.updateUI();
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
    
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * 60 * dt;
            p.y += p.vy * 60 * dt;
            p.lifetime -= dt;
            p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
            
            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateDamageNumbers(dt) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y += dn.vy * 60 * dt;
            dn.lifetime -= dt;
            dn.alpha = Math.max(0, dn.lifetime);
            
            if (dn.lifetime <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    updateSpawning(dt) {
        const config = this.getLevelConfig(this.level);
        
        this.spawnTimer += dt;
        const spawnInterval = Math.max(1, 3 - this.level * 0.1);
        
        if (this.spawnTimer >= spawnInterval && this.enemiesInLevel < this.totalEnemiesInLevel) {
            this.spawnEnemy(config);
            this.enemiesInLevel++;
            this.spawnTimer = 0;
        }
        
        this.chestSpawnTimer += dt;
        const chestInterval = 8;
        
        if (this.chestSpawnTimer >= chestInterval && this.chests.length < 3) {
            this.spawnChest();
            this.chestSpawnTimer = 0;
        }
    }
    
    spawnEnemy(config) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0:
                x = Math.random() * this.width;
                y = -50;
                break;
            case 1:
                x = this.width + 50;
                y = Math.random() * this.height;
                break;
            case 2:
                x = Math.random() * this.width;
                y = this.height + 50;
                break;
            case 3:
                x = -50;
                y = Math.random() * this.height;
                break;
        }
        
        const dragonTypes = ['🐉', '🐲', '🦎', '🐊'];
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
        
        this.enemies.push({
            x: x,
            y: y,
            radius: 25 + Math.random() * 15,
            health: config.enemyHealth,
            maxHealth: config.enemyHealth,
            speed: config.enemySpeed,
            damage: config.enemyDamage,
            angle: 0,
            type: dragonTypes[Math.floor(Math.random() * dragonTypes.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    spawnChest() {
        const margin = 80;
        const x = margin + Math.random() * (this.width - margin * 2);
        const y = margin + Math.random() * (this.height - margin * 2);
        
        this.chests.push({
            x: x,
            y: y,
            radius: 30,
            bobOffset: 0
        });
    }
    
    spawnPowerup(x, y) {
        const powerupTypes = this.powerups;
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        this.powerups.push({
            x: x,
            y: y,
            radius: 15,
            angle: 0,
            bobOffset: 0,
            ...type
        });
    }
    
    checkCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const r1 = obj1.radius || Math.max(obj1.width, obj1.height) / 2;
        const r2 = obj2.radius || Math.max(obj2.width, obj2.height) / 2;
        
        return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
    }
    
    checkCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < circle1.radius + circle2.radius;
    }
    
    takeDamage(amount) {
        this.playerStats.health -= amount;
        this.updateUI();
        
        this.createHitParticles(this.player.x, this.player.y, '#FF4444');
        
        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalGold').textContent = this.gold;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.add('show');
    }
    
    checkLevelComplete() {
        if (this.enemiesKilled >= this.totalEnemiesInLevel && this.enemies.length === 0) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.gameState = 'levelUp';
        
        const config = this.getLevelConfig(this.level);
        
        let unlockText = `关卡 ${this.level} 完成！`;
        if (config.unlockAbility) {
            unlockText += ' 🎉 解锁了新能力！';
        }
        
        document.getElementById('unlockText').textContent = unlockText;
        document.getElementById('levelUpScreen').classList.add('show');
    }
    
    showSkillSelection() {
        const skillContainer = document.getElementById('skillCards');
        skillContainer.innerHTML = '';
        
        const availableSkills = this.getRandomSkills(3);
        
        if (availableSkills.length === 0) {
            return;
        }
        
        this.gameState = 'skillSelect';
        
        availableSkills.forEach((skill, index) => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-desc">${skill.description}</div>
            `;
            
            card.addEventListener('click', () => {
                this.applySkill(skill);
                document.getElementById('skillSelection').classList.remove('show');
                this.gameState = 'playing';
                this.lastTime = 0;
                requestAnimationFrame((t) => this.gameLoop(t));
            });
            
            skillContainer.appendChild(card);
        });
        
        document.getElementById('skillSelection').classList.add('show');
    }
    
    applySkill(skill) {
        switch (skill.id) {
            case 'bullet_count':
                this.playerStats.bulletCount++;
                break;
            case 'bullet_spread':
                this.playerStats.bulletSpread += 15;
                break;
            case 'fire_rate':
                this.playerStats.fireRate *= 0.8;
                break;
            case 'damage':
                this.playerStats.bulletDamage = Math.floor(this.playerStats.bulletDamage * 1.25);
                break;
            case 'health':
                this.playerStats.health = Math.min(
                    this.playerStats.health + 30,
                    this.playerStats.maxHealth
                );
                break;
            case 'max_health':
                this.playerStats.maxHealth += 25;
                this.playerStats.health += 25;
                break;
            case 'bullet_size':
                this.playerStats.bulletSize += 3;
                break;
            case 'speed':
                this.playerStats.speed *= 1.15;
                break;
            case 'pierce':
                this.playerStats.bulletPierce++;
                break;
            case 'crit_chance':
                this.playerStats.criticalChance += 0.1;
                break;
            case 'crit_damage':
                this.playerStats.criticalDamage += 0.5;
                break;
            case 'magnet':
                this.playerStats.magnetRange += 50;
                break;
        }
        
        this.unlockedSkills.push(skill.id);
        this.updateUI();
    }
    
    createHitParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: color,
                lifetime: 0.5,
                maxLifetime: 0.5,
                alpha: 1
            });
        }
    }
    
    createDeathParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: color,
                lifetime: 1,
                maxLifetime: 1,
                alpha: 1
            });
        }
    }
    
    createCollectParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: color,
                lifetime: 0.8,
                maxLifetime: 0.8,
                alpha: 1
            });
        }
    }
    
    createGoldParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: '#FFD700',
                lifetime: 1.2,
                maxLifetime: 1.2,
                alpha: 1
            });
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        this.drawParticles();
        this.drawPowerups();
        this.drawChests();
        this.drawBullets();
        this.drawEnemies();
        this.drawPlayer();
        this.drawDamageNumbers();
    }
    
    drawBackground() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height)
        );
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 20; i++) {
            const x = (i * 137 + Date.now() * 0.01) % this.width;
            const y = (i * 89 + Date.now() * 0.005) % this.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#667eea';
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawPlayer() {
        if (!this.player) return;
        
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        if (this.player.invincible > 0) {
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }
        
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.radius);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(0.7, '#0088FF');
        gradient.addColorStop(1, '#0044AA');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        this.ctx.font = `${this.player.radius * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🚀', 0, 2);
        
        this.ctx.restore();
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, bullet.color);
            gradient.addColorStop(1, bullet.color + '80');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 20;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radius);
            gradient.addColorStop(0, enemy.color);
            gradient.addColorStop(1, this.darkenColor(enemy.color, 0.5));
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.ctx.rotate(enemy.angle);
            this.ctx.font = `${enemy.radius * 1.2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(enemy.type, 0, 0);
            
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.translate(enemy.x, enemy.y);
            
            const healthBarWidth = enemy.radius * 2;
            const healthBarHeight = 8;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(
                -healthBarWidth / 2,
                -enemy.radius - 15,
                healthBarWidth,
                healthBarHeight
            );
            
            const healthColor = healthPercent > 0.5 ? '#44FF44' : healthPercent > 0.25 ? '#FFFF44' : '#FF4444';
            this.ctx.fillStyle = healthColor;
            this.ctx.fillRect(
                -healthBarWidth / 2,
                -enemy.radius - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                Math.ceil(enemy.health),
                0,
                -enemy.radius - 20
            );
            
            this.ctx.restore();
        });
    }
    
    drawChests() {
        this.chests.forEach(chest => {
            this.ctx.save();
            this.ctx.translate(chest.x, chest.y + chest.bobOffset);
            
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 25;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, chest.radius, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, chest.radius);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, '#8B4513');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.ctx.font = `${chest.radius * 1.2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('📦', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawPowerups() {
        this.powerups.forEach(powerup => {
            this.ctx.save();
            this.ctx.translate(powerup.x, powerup.y + powerup.bobOffset);
            
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = powerup.color + '40';
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.ctx.font = `${powerup.radius * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerup.icon, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawDamageNumbers() {
        this.damageNumbers.forEach(dn => {
            this.ctx.save();
            this.ctx.globalAlpha = dn.alpha;
            this.ctx.font = dn.isCrit ? 'bold 24px Arial' : 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = dn.isCrit ? '#FFD700' : '#FF4444';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            
            const text = dn.isCrit ? `暴击! ${dn.value}` : `${dn.value}`;
            this.ctx.strokeText(text, dn.x, dn.y);
            this.ctx.fillText(text, dn.x, dn.y);
            
            this.ctx.restore();
        });
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    updateUI() {
        const healthPercent = (this.playerStats.health / this.playerStats.maxHealth) * 100;
        document.getElementById('healthBar').style.width = `${healthPercent}%`;
        document.getElementById('healthText').textContent = 
            `${Math.max(0, Math.ceil(this.playerStats.health))} / ${this.playerStats.maxHealth}`;
        
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('goldDisplay').textContent = this.gold;
        document.getElementById('scoreDisplay').textContent = this.score;
    }
}

window.addEventListener('load', () => {
    window.game = new DragonShooterGame();
});
