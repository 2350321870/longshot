class DragonShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'mainMenu';
        this.isPaused = false;
        this.freeRefreshCount = 1;
        this.currentTab = 'battle';
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initGameData();
        this.initGame();
        this.setupEventListeners();
        this.renderMainMenu();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    initGameData() {
        this.saveData = this.loadSaveData() || {
            gold: 100,
            diamonds: 0,
            maxUnlockedLevel: 1,
            highestLevelPassed: 0,
            energy: 30,
            maxEnergy: 30,
            lastEnergyTime: Date.now(),
            equipment: {
                weapon: { level: 0, owned: false },
                armor: { level: 0, owned: false },
                boots: { level: 0, owned: false },
                ring: { level: 0, owned: false }
            },
            permanentUpgrades: {
                bulletDamage: 0,
                maxHealth: 0,
                moveSpeed: 0
            },
            unlockedItems: ['pistol'],
            equippedItems: [],
            itemLevels: { pistol: 1 },
            claimedRewards: {},
            selectedCharacter: 'default',
            unlockedCharacters: ['default']
        };
        
        this.updateEnergy();
        
        this.characterConfig = {
            default: {
                name: '默认勇者',
                icon: '👦',
                color: '#4488ff',
                unlocked: true,
                price: 0,
                stats: { health: 0, damage: 0, speed: 0 },
                description: '初始角色，均衡属性'
            },
            archer: {
                name: '弓箭手',
                icon: '🏹',
                color: '#44cc44',
                unlocked: false,
                price: 500,
                stats: { health: -10, damage: 5, speed: 0.1 },
                description: '高伤害高速度，但血量较低'
            },
            warrior: {
                name: '战士',
                icon: '⚔️',
                color: '#ff4444',
                unlocked: false,
                price: 500,
                stats: { health: 30, damage: 0, speed: -0.05 },
                description: '高血量，适合持久战'
            },
            mage: {
                name: '法师',
                icon: '🧙',
                color: '#aa44ff',
                unlocked: false,
                price: 800,
                stats: { health: -20, damage: 10, speed: 0.05 },
                description: '最高伤害，但非常脆弱'
            },
            knight: {
                name: '骑士',
                icon: '🛡️',
                color: '#ffaa00',
                unlocked: false,
                price: 800,
                stats: { health: 50, damage: 0, speed: -0.1 },
                description: '坦克角色，血量极高'
            }
        };
        
        this.levelRewards = {
            3: { type: 'gold', amount: 100, name: '金币x100', icon: '💰' },
            6: { type: 'gold', amount: 200, name: '金币x200', icon: '💰' },
            9: { type: 'gold', amount: 500, name: '金币x500', icon: '👑' }
        };
        
        this.equipmentConfig = {
            weapon: {
                name: '武器',
                icon: '⚔️',
                basePrice: 100,
                upgradePrice: 80,
                buyDescription: '购买：永久增加基础伤害+5',
                upgradeDescription: '强化：每级伤害+3'
            },
            armor: {
                name: '护甲',
                icon: '🛡️',
                basePrice: 100,
                upgradePrice: 80,
                buyDescription: '购买：永久增加最大生命+20',
                upgradeDescription: '强化：每级最大生命+10'
            },
            boots: {
                name: '靴子',
                icon: '👟',
                basePrice: 80,
                upgradePrice: 60,
                buyDescription: '购买：永久增加移动速度+10%',
                upgradeDescription: '强化：每级速度+5%'
            },
            ring: {
                name: '戒指',
                icon: '💍',
                basePrice: 150,
                upgradePrice: 100,
                buyDescription: '购买：暴击几率+5%',
                upgradeDescription: '强化：每级暴击几率+2%'
            }
        };
        
        this.itemsConfig = [
            { id: 'pistol', name: '手枪', icon: '🔫', rarity: 'common', baseDamage: 5 },
            { id: 'shotgun', name: '霰弹枪', icon: '🔫', rarity: 'uncommon', baseDamage: 8 },
            { id: 'rifle', name: '步枪', icon: '🎯', rarity: 'rare', baseDamage: 12 },
            { id: 'sniper', name: '狙击枪', icon: '🔭', rarity: 'epic', baseDamage: 18 },
            { id: 'cannon', name: '加农炮', icon: '💣', rarity: 'legendary', baseDamage: 25 }
        ];
        
        this.gachaPool = [
            { id: 'gold_small', name: '少量金币', icon: '💰', desc: '获得50金币', rarity: 'common', weight: 40, effect: () => { this.saveData.gold += 50; } },
            { id: 'gold_medium', name: '中型金币', icon: '💰', desc: '获得100金币', rarity: 'uncommon', weight: 25, effect: () => { this.saveData.gold += 100; } },
            { id: 'gold_large', name: '大型金币', icon: '💎', desc: '获得300金币', rarity: 'rare', weight: 10, effect: () => { this.saveData.gold += 300; } },
            { id: 'health_boost', name: '生命强化', icon: '❤️', desc: '永久+10最大生命', rarity: 'uncommon', weight: 15, effect: () => { this.saveData.permanentUpgrades.maxHealth += 1; } },
            { id: 'damage_boost', name: '伤害强化', icon: '💥', desc: '永久+2伤害', rarity: 'uncommon', weight: 15, effect: () => { this.saveData.permanentUpgrades.bulletDamage += 1; } },
            { id: 'speed_boost', name: '速度强化', icon: '⚡', desc: '永久+5%速度', rarity: 'uncommon', weight: 15, effect: () => { this.saveData.permanentUpgrades.moveSpeed += 1; } },
            { id: 'legendary_gold', name: '传说金币', icon: '👑', desc: '获得1000金币', rarity: 'legendary', weight: 3, effect: () => { this.saveData.gold += 1000; } },
            { id: 'level_unlock', name: '关卡解锁', icon: '🔓', desc: '解锁下一关', rarity: 'rare', weight: 5, effect: () => { this.saveData.maxUnlockedLevel += 1; } }
        ];
        
        this.levelConfigs = {
            1: { enemyCount: 8, enemyHealth: 100, enemySpeed: 0.8, enemyDamage: 5, dropChance: 0.3, segments: 10, chestDropChance: 0.6 },
            2: { enemyCount: 10, enemyHealth: 150, enemySpeed: 0.9, enemyDamage: 6, dropChance: 0.35, segments: 12, chestDropChance: 0.6 },
            3: { enemyCount: 12, enemyHealth: 200, enemySpeed: 1.0, enemyDamage: 8, dropChance: 0.4, segments: 15, unlockAbility: true, chestDropChance: 0.65 },
            4: { enemyCount: 15, enemyHealth: 300, enemySpeed: 1.1, enemyDamage: 10, dropChance: 0.4, segments: 18, chestDropChance: 0.65 },
            5: { enemyCount: 18, enemyHealth: 400, enemySpeed: 1.2, enemyDamage: 12, dropChance: 0.45, segments: 20, chestDropChance: 0.7 },
            6: { enemyCount: 20, enemyHealth: 500, enemySpeed: 1.3, enemyDamage: 15, dropChance: 0.5, segments: 22, unlockAbility: true, chestDropChance: 0.7 },
            7: { enemyCount: 25, enemyHealth: 600, enemySpeed: 1.4, enemyDamage: 18, dropChance: 0.5, segments: 25, chestDropChance: 0.75 },
            8: { enemyCount: 28, enemyHealth: 700, enemySpeed: 1.5, enemyDamage: 22, dropChance: 0.55, segments: 28, chestDropChance: 0.75 },
            9: { enemyCount: 30, enemyHealth: 800, enemySpeed: 1.6, enemyDamage: 26, dropChance: 0.6, segments: 30, unlockAbility: true, chestDropChance: 0.8 }
        };

        this.skills = [
            { id: "bullet_count", name: "龙之力", description: "子弹数量+1", icon: "🎯", rarity: "A" },
            { id: "bullet_spread", name: "龙息", description: "子弹覆盖范围扩大", icon: "🌟", rarity: "B" },
            { id: "fire_rate", name: "快速射击", description: "射击速度提升20%", icon: "⚡", rarity: "B" },
            { id: "damage", name: "龙之力", description: "子弹伤害+50%", icon: "💥", rarity: "A" },
            { id: "health", name: "生命恢复", description: "恢复30点生命值", icon: "❤️", rarity: "B" },
            { id: "max_health", name: "生命强化", description: "最大生命值+25", icon: "💗", rarity: "B" },
            { id: "bullet_size", name: "巨型子弹", description: "子弹体积变大", icon: "🔵", rarity: "B" },
            { id: "speed", name: "加速移动", description: "移动速度+15%", icon: "🏃", rarity: "B" },
            { id: "pierce", name: "穿透子弹", description: "子弹可穿透敌人", icon: "🎯", rarity: "A" },
            { id: "crit_chance", name: "暴击专精", description: "暴击几率+10%", icon: "⭐", rarity: "B" },
            { id: "crit_damage", name: "暴击强化", description: "暴击伤害+50%", icon: "💫", rarity: "A" },
            { id: "magnet", name: "磁铁效果", description: "自动吸引道具范围+50", icon: "🧲", rarity: "B" }
        ];

        this.powerupTypes = [
            { id: "gold", name: "金币", icon: "💰", color: "#FFD700", value: 10 },
            { id: "health_pack", name: "生命包", icon: "💊", color: "#FF6B6B" },
            { id: "damage_boost", name: "伤害提升", icon: "⚔️", color: "#FF4444", duration: 10 },
            { id: "speed_boost", name: "速度提升", icon: "💨", color: "#00CED1", duration: 8 }
        ];
    }
    
    updateEnergy() {
        const now = Date.now();
        const elapsed = now - this.saveData.lastEnergyTime;
        const energyToRecover = Math.floor(elapsed / 60000);
        
        if (energyToRecover > 0) {
            this.saveData.energy = Math.min(this.saveData.maxEnergy, this.saveData.energy + energyToRecover);
            this.saveData.lastEnergyTime = now;
            this.saveGameData();
        }
        
        return this.saveData.energy;
    }
    
    consumeEnergy(amount) {
        if (this.saveData.energy >= amount) {
            this.saveData.energy -= amount;
            this.saveData.lastEnergyTime = Date.now();
            this.saveGameData();
            return true;
        }
        return false;
    }
    
    loadSaveData() {
        try {
            const saved = localStorage.getItem('dragonShooterSave');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        return null;
    }
    
    saveGameData() {
        try {
            localStorage.setItem('dragonShooterSave', JSON.stringify(this.saveData));
        } catch (e) {
            console.error('Failed to save:', e);
        }
    }
    
    initGame() {
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.dragonSegments = [];
        this.chests = [];
        this.particles = [];
        this.powerups = [];
        this.damageNumbers = [];
        
        this.score = 0;
        this.goldEarned = 0;
        this.enemiesKilled = 0;
        this.chestsOpened = 0;
        this.enemiesInLevel = 0;
        this.totalEnemiesInLevel = 0;
        
        this.segmentsDestroyed = 0;
        this.lastSkillSelectionAtSegment = 0;
        
        this.lastTime = 0;
        this.shootTimer = 0;
        this.spawnTimer = 0;
        this.chestSpawnTimer = 0;
        
        const baseStats = this.getBaseStats();
        
        this.playerStats = {
            maxHealth: 100 + baseStats.maxHealth,
            health: 100 + baseStats.maxHealth,
            speed: 5 * (1 + baseStats.moveSpeedBonus),
            bulletSpeed: 10,
            bulletDamage: 10 + baseStats.bulletDamage,
            bulletCount: 1,
            bulletSpread: 0,
            fireRate: 0.15,
            bulletSize: 8,
            bulletPierce: 0,
            criticalChance: 0.05 + baseStats.critChanceBonus,
            criticalDamage: 1.5,
            bulletBounce: 0,
            magnetRange: 50
        };
        
        this.unlockedSkills = [];
        this.activeBuffs = [];
        
        this.targetPosition = null;
        this.isMoving = false;
    }
    
    getBaseStats() {
        let stats = {
            bulletDamage: 0,
            maxHealth: 0,
            moveSpeedBonus: 0,
            critChanceBonus: 0
        };
        
        const eq = this.saveData.equipment;
        const pu = this.saveData.permanentUpgrades;
        
        if (eq.weapon.owned) {
            stats.bulletDamage += 5 + eq.weapon.level * 3;
        }
        
        if (eq.armor.owned) {
            stats.maxHealth += 20 + eq.armor.level * 10;
        }
        
        if (eq.boots.owned) {
            stats.moveSpeedBonus += 0.1 + eq.boots.level * 0.05;
        }
        
        if (eq.ring.owned) {
            stats.critChanceBonus += 0.05 + eq.ring.level * 0.02;
        }
        
        stats.bulletDamage += pu.bulletDamage * 2;
        stats.maxHealth += pu.maxHealth * 10;
        stats.moveSpeedBonus += pu.moveSpeed * 0.05;
        
        const charStats = this.getCharacterStats();
        stats.bulletDamage += charStats.damage;
        stats.maxHealth += charStats.health;
        stats.moveSpeedBonus += charStats.speed;
        
        return stats;
    }
    
    setupEventListeners() {
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('returnMainBtn').addEventListener('click', () => this.returnToMainMenu());
        document.getElementById('returnMainBtn2').addEventListener('click', () => this.returnToMainMenu());
        document.getElementById('retryBtn').addEventListener('click', () => this.retryLevel());
        
        try {
            const backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.returnToMainMenu());
            }
        } catch (e) {}
        
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshSkills());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('returnFromPauseBtn').addEventListener('click', () => this.returnToMainMenu());
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        try {
            document.getElementById('gachaSingleBtn').addEventListener('click', () => this.doGacha(1));
            document.getElementById('gachaTenBtn').addEventListener('click', () => this.doGacha(10));
        } catch (e) {}
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        
        document.getElementById('battleTab').classList.toggle('hidden', tab !== 'battle');
        document.getElementById('shopTab').classList.toggle('hidden', tab !== 'shop');
        document.getElementById('characterTab').classList.toggle('hidden', tab !== 'character');
        document.getElementById('equipmentTab').classList.toggle('hidden', tab !== 'equipment');
        document.getElementById('challengeTab').classList.toggle('hidden', tab !== 'challenge');
        
        if (tab === 'battle') {
            this.renderBattleTab();
        } else if (tab === 'character') {
            this.renderCharacterTab();
        } else if (tab === 'shop') {
            this.renderShopTab();
        } else if (tab === 'equipment') {
            this.renderEquipmentTab();
        }
    }
    
    renderBattleTab() {
        this.renderLevelGrid();
        this.renderLevelRewards();
    }
    
    renderCharacterTab() {
        const grid = document.getElementById('characterGrid');
        grid.innerHTML = '';
        
        for (const [id, config] of Object.entries(this.characterConfig)) {
            const isUnlocked = this.saveData.unlockedCharacters.includes(id);
            const isSelected = this.saveData.selectedCharacter === id;
            
            const card = document.createElement('div');
            card.className = `character-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
            
            let statsHtml = '';
            if (config.stats.health !== 0) {
                const className = config.stats.health > 0 ? 'positive' : 'negative';
                statsHtml += `<span class="character-stat ${className}">❤️${config.stats.health > 0 ? '+' : ''}${config.stats.health}</span>`;
            }
            if (config.stats.damage !== 0) {
                const className = config.stats.damage > 0 ? 'positive' : 'negative';
                statsHtml += `<span class="character-stat ${className}">💥${config.stats.damage > 0 ? '+' : ''}${config.stats.damage}</span>`;
            }
            if (config.stats.speed !== 0) {
                const className = config.stats.speed > 0 ? 'positive' : 'negative';
                statsHtml += `<span class="character-stat ${className}">🏃${config.stats.speed > 0 ? '+' : ''}${(config.stats.speed * 100).toFixed(0)}%</span>`;
            }
            
            let actionHtml = '';
            if (!isUnlocked) {
                actionHtml = `<div class="character-price">💰 ${config.price}</div>
                    <button class="character-unlock-btn" data-id="${id}">解锁</button>`;
            } else if (isSelected) {
                actionHtml = `<div style="color: #44ff44; font-weight: bold;">✓ 已选中</div>`;
            } else {
                actionHtml = `<button class="character-unlock-btn" data-id="${id}" data-select="true">选择</button>`;
            }
            
            card.innerHTML = `
                <div class="character-icon">${config.icon}</div>
                <div class="character-name">${config.name}</div>
                <div class="character-desc">${config.description}</div>
                <div class="character-stats">${statsHtml}</div>
                ${actionHtml}
            `;
            
            grid.appendChild(card);
        }
        
        grid.querySelectorAll('.character-unlock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (btn.dataset.select === 'true') {
                    this.selectCharacter(id);
                } else {
                    this.unlockCharacter(id);
                }
            });
        });
    }
    
    selectCharacter(id) {
        if (!this.saveData.unlockedCharacters.includes(id)) {
            this.showToast('角色未解锁！');
            return;
        }
        this.saveData.selectedCharacter = id;
        this.saveGameData();
        this.renderCharacterTab();
        this.showToast(`已选择 ${this.characterConfig[id].name}！`);
    }
    
    unlockCharacter(id) {
        const config = this.characterConfig[id];
        if (this.saveData.gold >= config.price) {
            this.saveData.gold -= config.price;
            if (!this.saveData.unlockedCharacters.includes(id)) {
                this.saveData.unlockedCharacters.push(id);
            }
            this.saveGameData();
            this.updateMainMenuUI();
            this.renderCharacterTab();
            this.showToast(`${config.name} 解锁成功！`);
        } else {
            this.showToast('金币不足！');
        }
    }
    
    getCharacterStats() {
        const charId = this.saveData.selectedCharacter || 'default';
        return this.characterConfig[charId]?.stats || { health: 0, damage: 0, speed: 0 };
    }
    
    renderShopTab() {
        this.renderShopItems();
        this.renderUpgradeItems();
    }
    
    renderShopItems() {
        const grid = document.getElementById('shopGrid');
        grid.innerHTML = '';
        
        const shopItems = [
            { id: 'smallGold', name: '小金币包', icon: '💰', price: 50, description: '获得 100 金币', type: 'gold', amount: 100 },
            { id: 'mediumGold', name: '中金币包', icon: '💎', price: 200, description: '获得 500 金币', type: 'gold', amount: 500 },
            { id: 'largeGold', name: '大金币包', icon: '👑', price: 500, description: '获得 1500 金币', type: 'gold', amount: 1500 },
            { id: 'energy', name: '体力恢复', icon: '⚡', price: 100, description: '恢复 10 点体力', type: 'energy', amount: 10 }
        ];
        
        for (const item of shopItems) {
            const canBuy = this.saveData.gold >= item.price;
            const card = document.createElement('div');
            card.className = 'shop-item';
            card.innerHTML = `
                <div class="shop-icon">${item.icon}</div>
                <div class="shop-name">${item.name}</div>
                <div class="shop-desc">${item.description}</div>
                <div class="shop-price">
                    <span class="shop-price-icon">💰</span>
                    <span class="shop-price-value">${item.price}</span>
                </div>
                <button class="shop-buy-btn" data-id="${item.id}" ${!canBuy ? 'disabled' : ''}>
                    购买
                </button>
            `;
            grid.appendChild(card);
        }
        
        grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.buyShopItem(id);
            });
        });
    }
    
    buyShopItem(id) {
        const shopItems = {
            smallGold: { price: 50, type: 'gold', amount: 100 },
            mediumGold: { price: 200, type: 'gold', amount: 500 },
            largeGold: { price: 500, type: 'gold', amount: 1500 },
            energy: { price: 100, type: 'energy', amount: 10 }
        };
        
        const item = shopItems[id];
        if (!item) return;
        
        if (this.saveData.gold >= item.price) {
            this.saveData.gold -= item.price;
            
            if (item.type === 'gold') {
                this.saveData.gold += item.amount;
                this.showToast(`获得 ${item.amount} 金币！`);
            } else if (item.type === 'energy') {
                this.saveData.energy = Math.min(this.saveData.maxEnergy, this.saveData.energy + item.amount);
                this.showToast(`恢复 ${item.amount} 体力！`);
            }
            
            this.saveGameData();
            this.updateMainMenuUI();
            this.renderShopTab();
        } else {
            this.showToast('金币不足！');
        }
    }
    
    renderUpgradeItems() {
        const grid = document.getElementById('upgradeGrid');
        grid.innerHTML = '';
        
        const upgrades = [
            { id: 'bulletDamage', name: '攻击强化', icon: '💥', basePrice: 100, description: '永久提升子弹伤害 +5' },
            { id: 'maxHealth', name: '生命强化', icon: '❤️', basePrice: 100, description: '永久提升最大生命值 +20' },
            { id: 'moveSpeed', name: '速度强化', icon: '🏃', basePrice: 100, description: '永久提升移动速度 +5%' }
        ];
        
        for (const upgrade of upgrades) {
            const currentLevel = this.saveData.permanentUpgrades[upgrade.id] || 0;
            const price = upgrade.basePrice * (currentLevel + 1);
            const canBuy = this.saveData.gold >= price;
            
            const card = document.createElement('div');
            card.className = 'upgrade-item';
            card.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.description}</div>
                <div class="upgrade-level">当前等级: Lv.${currentLevel}</div>
                <div class="upgrade-price">
                    <span class="upgrade-price-icon">💰</span>
                    <span class="upgrade-price-value">${price}</span>
                </div>
                <button class="upgrade-btn" data-id="${upgrade.id}" ${!canBuy ? 'disabled' : ''}>
                    强化
                </button>
            `;
            grid.appendChild(card);
        }
        
        grid.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.upgradePermanent(id);
            });
        });
    }
    
    upgradePermanent(id) {
        const basePrices = {
            bulletDamage: 100,
            maxHealth: 100,
            moveSpeed: 100
        };
        
        const currentLevel = this.saveData.permanentUpgrades[id] || 0;
        const price = basePrices[id] * (currentLevel + 1);
        
        if (this.saveData.gold >= price) {
            this.saveData.gold -= price;
            this.saveData.permanentUpgrades[id] = currentLevel + 1;
            this.saveGameData();
            this.updateMainMenuUI();
            this.renderUpgradeItems();
            
            const names = {
                bulletDamage: '攻击强化',
                maxHealth: '生命强化',
                moveSpeed: '速度强化'
            };
            this.showToast(`${names[id]} 升级到 Lv.${currentLevel + 1}！`);
        } else {
            this.showToast('金币不足！');
        }
    }
    
    renderEquipmentTab() {
        this.renderEquipUpgradeGrid();
        this.renderEquipmentUI();
    }
    
    renderEquipUpgradeGrid() {
        const grid = document.getElementById('equipGrid');
        grid.innerHTML = '';
        
        for (const [key, config] of Object.entries(this.equipmentConfig)) {
            const equip = this.saveData.equipment[key];
            const owned = equip.owned;
            const level = equip.level || 0;
            
            const card = document.createElement('div');
            card.className = `equip-card ${owned ? 'owned' : ''}`;
            
            let actionHtml = '';
            let priceHtml = '';
            
            if (!owned) {
                priceHtml = `<div class="equip-card-price">
                    <span class="equip-card-price-value">💰 ${config.basePrice}</span>
                </div>`;
                actionHtml = `<button class="equip-card-btn" data-type="${key}" data-action="buy">购买</button>`;
            } else {
                const upgradePrice = config.upgradePrice * (level + 1);
                priceHtml = `<div class="equip-card-price">
                    <span class="equip-card-price-value">💰 ${upgradePrice}</span>
                </div>`;
                actionHtml = `<button class="equip-card-btn" data-type="${key}" data-action="upgrade">强化</button>`;
            }
            
            card.innerHTML = `
                <div class="equip-card-icon">${config.icon}</div>
                <div class="equip-card-name">${config.name}</div>
                <div class="equip-card-level">${owned ? `Lv.${level}` : '未拥有'}</div>
                <div class="equip-card-desc">${owned ? config.upgradeDescription : config.buyDescription}</div>
                ${priceHtml}
                ${actionHtml}
            `;
            
            grid.appendChild(card);
        }
        
        grid.querySelectorAll('.equip-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const action = btn.dataset.action;
                this.handleEquipUpgrade(type, action);
            });
        });
    }
    
    handleEquipUpgrade(type, action) {
        const config = this.equipmentConfig[type];
        const equip = this.saveData.equipment[type];
        
        if (action === 'buy') {
            if (this.saveData.gold >= config.basePrice) {
                this.saveData.gold -= config.basePrice;
                equip.owned = true;
                equip.level = 0;
                this.saveGameData();
                this.updateMainMenuUI();
                this.renderEquipUpgradeGrid();
                this.showToast(`${config.name}购买成功！`);
            } else {
                this.showToast('金币不足！');
            }
        } else if (action === 'upgrade') {
            const price = config.upgradePrice * (equip.level + 1);
            if (this.saveData.gold >= price) {
                this.saveData.gold -= price;
                equip.level++;
                this.saveGameData();
                this.updateMainMenuUI();
                this.renderEquipUpgradeGrid();
                this.showToast(`${config.name}强化到 Lv.${equip.level}！`);
            } else {
                this.showToast('金币不足！');
            }
        }
    }
    
    renderLevelGrid() {
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 9; i++) {
            const isUnlocked = i <= this.saveData.maxUnlockedLevel;
            const isCompleted = i <= this.saveData.highestLevelPassed;
            const isCurrent = i === this.saveData.maxUnlockedLevel && isUnlocked;
            
            const btn = document.createElement('div');
            let className = 'level-btn';
            if (!isUnlocked) className += ' locked';
            if (isCompleted) className += ' completed';
            if (isCurrent) className += ' current';
            
            btn.className = className;
            btn.innerHTML = `
                <div class="level-number">${isUnlocked ? i : '🔒'}</div>
                <div class="level-name">${isCompleted ? '✓ 已通关' : (isUnlocked ? '关卡 ' + i : '未解锁')}</div>
            `;
            
            if (isUnlocked) {
                btn.addEventListener('click', () => this.startLevel(i));
            }
            
            grid.appendChild(btn);
        }
    }
    
    renderLevelRewards() {
        const container = document.getElementById('progressRewards');
        container.innerHTML = '';
        
        const rewardLevels = Object.keys(this.levelRewards).map(Number).sort((a, b) => a - b);
        
        for (const level of rewardLevels) {
            const reward = this.levelRewards[level];
            const isPassed = this.saveData.highestLevelPassed >= level;
            const isClaimed = this.saveData.claimedRewards[level];
            
            const card = document.createElement('div');
            let className = 'reward-card';
            if (isPassed && !isClaimed) {
                className += ' claimable';
            } else if (isClaimed) {
                className += ' claimed';
            }
            
            card.className = className;
            
            let actionHtml = '';
            if (isClaimed) {
                actionHtml = '<span class="reward-claimed-text">✓ 已领取</span>';
            } else if (isPassed) {
                actionHtml = `<button class="reward-claim-btn" data-level="${level}">领取</button>`;
            } else {
                actionHtml = `<button class="reward-claim-btn" disabled>通过第${level}关</button>`;
            }
            
            card.innerHTML = `
                <div class="reward-info">
                    <div class="reward-icon">${reward.icon}</div>
                    <div class="reward-details">
                        <div class="reward-name">${reward.name}</div>
                        <div class="reward-requirement">通关第 ${level} 关</div>
                    </div>
                </div>
                ${actionHtml}
            `;
            
            container.appendChild(card);
        }
        
        container.querySelectorAll('.reward-claim-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.claimLevelReward(level);
            });
        });
    }
    
    claimLevelReward(level) {
        const reward = this.levelRewards[level];
        if (!reward) return;
        
        if (this.saveData.claimedRewards[level]) {
            this.showToast('已领取过该奖励！');
            return;
        }
        
        if (this.saveData.highestLevelPassed < level) {
            this.showToast('未通关该关卡！');
            return;
        }
        
        if (reward.type === 'gold') {
            this.saveData.gold += reward.amount;
        }
        
        this.saveData.claimedRewards[level] = true;
        this.saveGameData();
        this.updateMainMenuUI();
        this.renderLevelRewards();
        this.showToast(`领取成功：${reward.name}！`);
    }
    
    renderEquipmentUI() {
        const equipped = this.saveData.equippedItems || [];
        const unlocked = this.saveData.unlockedItems || ['pistol'];
        const itemLevels = this.saveData.itemLevels || { pistol: 1 };
        
        const equippedGrid = document.getElementById('equippedGrid');
        const unlockedGrid = document.getElementById('unlockedGrid');
        const lockedGrid = document.getElementById('lockedGrid');
        
        const maxEquipped = 8;
        document.getElementById('equipCount').textContent = `${equipped.length}/${maxEquipped}`;
        
        equippedGrid.innerHTML = '';
        for (let i = 0; i < maxEquipped; i++) {
            const itemId = equipped[i];
            const slot = document.createElement('div');
            
            if (itemId) {
                const item = this.itemsConfig.find(it => it.id === itemId);
                if (item) {
                    const level = itemLevels[itemId] || 1;
                    const maxLevel = 5;
                    const progress = level / maxLevel;
                    
                    slot.className = `equip-slot rarity-${item.rarity}`;
                    slot.innerHTML = `
                        <div class="equip-icon">${item.icon}</div>
                        <div class="equip-name">${item.name}</div>
                        <div class="equip-level">Lv.${level}</div>
                        <div class="equip-progress">
                            <div class="equip-progress-fill" style="width: ${progress * 100}%"></div>
                        </div>
                        <div class="equip-progress-text">${level}/${maxLevel}</div>
                    `;
                }
            } else {
                slot.className = 'equip-slot equip-slot-empty';
                slot.innerHTML = `
                    <div class="equip-icon">+</div>
                    <div class="equip-name">空槽位</div>
                `;
            }
            
            slot.addEventListener('click', () => {
                if (itemId) {
                    this.unequipItem(itemId);
                }
            });
            
            equippedGrid.appendChild(slot);
        }
        
        unlockedGrid.innerHTML = '';
        unlocked.forEach(itemId => {
            if (equipped.includes(itemId)) return;
            
            const item = this.itemsConfig.find(it => it.id === itemId);
            if (item) {
                const level = itemLevels[itemId] || 1;
                const maxLevel = 5;
                const progress = level / maxLevel;
                
                const slot = document.createElement('div');
                slot.className = `equip-slot rarity-${item.rarity}`;
                slot.innerHTML = `
                    <div class="equip-icon">${item.icon}</div>
                    <div class="equip-name">${item.name}</div>
                    <div class="equip-level">Lv.${level}</div>
                    <div class="equip-progress">
                        <div class="equip-progress-fill" style="width: ${progress * 100}%"></div>
                    </div>
                    <div class="equip-progress-text">${level}/${maxLevel}</div>
                `;
                
                slot.addEventListener('click', () => {
                    if (equipped.length < maxEquipped) {
                        this.equipItem(itemId);
                    } else {
                        this.showToast('装备槽已满！');
                    }
                });
                
                unlockedGrid.appendChild(slot);
            }
        });
        
        lockedGrid.innerHTML = '';
        this.itemsConfig.forEach(item => {
            if (unlocked.includes(item.id)) return;
            
            const slot = document.createElement('div');
            slot.className = 'equip-slot equip-slot-empty';
            slot.innerHTML = `
                <div class="equip-icon">🔒</div>
                <div class="equip-name">${item.name}</div>
                <div class="equip-level">未解锁</div>
            `;
            
            lockedGrid.appendChild(slot);
        });
    }
    
    equipItem(itemId) {
        if (!this.saveData.equippedItems) {
            this.saveData.equippedItems = [];
        }
        
        if (this.saveData.equippedItems.length >= 8) {
            this.showToast('装备槽已满！');
            return;
        }
        
        if (!this.saveData.equippedItems.includes(itemId)) {
            this.saveData.equippedItems.push(itemId);
            this.saveGameData();
            this.renderEquipmentUI();
            this.showToast('装备成功！');
        }
    }
    
    unequipItem(itemId) {
        if (this.saveData.equippedItems) {
            const index = this.saveData.equippedItems.indexOf(itemId);
            if (index > -1) {
                this.saveData.equippedItems.splice(index, 1);
                this.saveGameData();
                this.renderEquipmentUI();
                this.showToast('已卸下装备！');
            }
        }
    }
    
    startGame() {
        this.updateEnergy();
        
        if (this.saveData.energy < 3) {
            this.showToast('体力不足！请等待恢复或使用钻石补充。');
            return;
        }
        
        this.consumeEnergy(3);
        this.freeRefreshCount = 1;
        this.startLevel(1);
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.isPaused = true;
            document.getElementById('pauseMenu').classList.add('show');
        } else if (this.isPaused) {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pauseMenu').classList.remove('show');
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    refreshSkills() {
        if (this.freeRefreshCount > 0) {
            this.freeRefreshCount--;
            this.showSkillSelection();
        } else {
            this.showToast('免费刷新次数已用完！');
        }
    }
    
    renderMainMenu() {
        this.gameState = 'mainMenu';
        
        // 显示主界面
        document.getElementById('mainScreen').classList.remove('hidden');
        document.getElementById('bottomNav').classList.remove('hidden');
        document.getElementById('topBar').classList.remove('hidden');
        
        // 隐藏战斗界面
        document.getElementById('battleInfo').classList.add('hidden');
        document.getElementById('battleUI').classList.add('hidden');
        document.getElementById('pauseBtn').classList.add('hidden');
        document.getElementById('fenceBar').classList.add('hidden');
        
        // 隐藏其他弹窗
        document.getElementById('levelUpScreen').classList.remove('show');
        document.getElementById('gameOverScreen').classList.remove('show');
        document.getElementById('skillSelection').classList.remove('show');
        document.getElementById('pauseMenu').classList.remove('show');
        
        this.switchTab('battle');
        this.updateMainMenuUI();
    }
    
    updateMainMenuUI() {
        this.updateEnergy();
        document.getElementById('energyDisplay').textContent = `${this.saveData.energy}/${this.saveData.maxEnergy}`;
        document.getElementById('mainGoldDisplay').textContent = this.saveData.gold;
        
        const chapter = Math.ceil(this.saveData.maxUnlockedLevel / 9);
        document.getElementById('chapterTitle').textContent = `${chapter}. 屠龙第${chapter}章`;
        
        if (this.currentTab === 'battle') {
            this.renderBattleTab();
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 1.5s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 1500);
    }
    
    doGacha(count) {
        const price = count === 1 ? 50 : 450;
        
        if (this.saveData.gold < price) {
            this.showToast('金币不足！');
            return;
        }
        
        this.saveData.gold -= price;
        
        let results = [];
        for (let i = 0; i < count; i++) {
            const item = this.getGachaResult();
            results.push(item);
            item.effect();
        }
        
        this.saveGameData();
        this.updateMainMenuUI();
        
        const lastResult = results[results.length - 1];
        document.getElementById('gachaResultIcon').textContent = lastResult.icon;
        document.getElementById('gachaResultName').textContent = lastResult.name;
        document.getElementById('gachaResultDesc').textContent = 
            count === 1 ? lastResult.desc : `共${count}抽，最后获得：${lastResult.desc}`;
        document.getElementById('gachaResult').classList.add('show');
        
        setTimeout(() => {
            document.getElementById('gachaResult').classList.remove('show');
        }, 2000);
    }
    
    getGachaResult() {
        const totalWeight = this.gachaPool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of this.gachaPool) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }
        
        return this.gachaPool[0];
    }
    
    startLevel(levelNum) {
        this.currentLevel = levelNum;
        this.initGame();
        
        const baseStats = this.getBaseStats();
        this.playerStats.maxHealth = 100 + baseStats.maxHealth;
        this.playerStats.health = 100 + baseStats.maxHealth;
        this.playerStats.speed = 5 * (1 + baseStats.moveSpeedBonus);
        this.playerStats.bulletDamage = 10 + baseStats.bulletDamage;
        this.playerStats.criticalChance = 0.05 + baseStats.critChanceBonus;
        
        this.initPlayer();
        
        const config = this.getLevelConfig(levelNum);
        this.totalEnemiesInLevel = config.enemyCount;
        this.enemiesInLevel = 0;
        
        // 立即生成第一条龙
        this.spawnDragon(config);
        this.enemiesInLevel++;
        
        // 隐藏主界面
        document.getElementById('mainScreen').classList.add('hidden');
        document.getElementById('bottomNav').classList.add('hidden');
        document.getElementById('topBar').classList.add('hidden');
        
        // 显示战斗界面
        document.getElementById('battleInfo').classList.remove('hidden');
        document.getElementById('battleUI').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
        document.getElementById('fenceBar').classList.remove('hidden');
        
        // 更新关卡显示
        document.getElementById('battleLevelDisplay').textContent = `当前第${this.currentLevel}关`;
        
        this.gameState = 'playing';
        this.updateUI();
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
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
        
        this.saveGameData();
        this.renderMainMenu();
    }
    
    getLevelConfig(levelNum) {
        const baseLevel = Math.min(levelNum, 9);
        const multiplier = Math.max(1, Math.floor((levelNum - 1) / 9) + 1);
        
        const baseConfig = this.levelConfigs[baseLevel] || this.levelConfigs[9];
        
        return {
            enemyCount: 1,
            enemyHealth: Math.floor(baseConfig.enemyHealth * (1 + (multiplier - 1) * 0.3)),
            enemySpeed: baseConfig.enemySpeed + (multiplier - 1) * 0.1,
            enemyDamage: Math.floor(baseConfig.enemyDamage * (1 + (multiplier - 1) * 0.2)),
            dropChance: Math.min(baseConfig.dropChance + (multiplier - 1) * 0.05, 0.7),
            segments: 1000,
            chestDropChance: Math.min(baseConfig.chestDropChance + (multiplier - 1) * 0.02, 0.9),
            unlockAbility: baseConfig.unlockAbility || false
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
    
    initPlayer() {
        this.player = {
            x: this.width / 2,
            y: this.height - 120,
            width: 40,
            height: 40,
            radius: 20,
            angle: -Math.PI / 2,
            invincible: 0
        };
    }
    
    nextLevel() {
        document.getElementById('levelUpScreen').classList.remove('show');
        const newLevel = this.currentLevel + 1;
        this.startLevel(newLevel);
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
        
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        
        if (this.isMoving && this.targetPosition) {
            const targetX = this.targetPosition.x;
            
            dx = targetX - this.player.x;
            
            const dist = Math.abs(dx);
            if (dist > 5) {
                dx = dx > 0 ? 1 : -1;
            } else {
                dx = 0;
            }
            dy = 0;
        }
        
        if (dx !== 0) {
            const speedMultiplier = this.getBuffMultiplier('speed_boost');
            const speed = this.playerStats.speed * speedMultiplier * 60 * dt;
            
            this.player.x += dx * speed;
            
            this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
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
        const levelConfig = this.getLevelConfig(this.currentLevel);
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.y += enemy.speed * 60 * dt;
            enemy.angle += dt * 2;
            
            if (this.player) {
                const dx = this.player.x - enemy.x;
                if (Math.abs(dx) > 5) {
                    enemy.x += Math.sign(dx) * enemy.speed * 0.3 * 60 * dt;
                }
            }
            
            if (enemy.y > this.height + 100) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            if (enemy.segments && enemy.segments.length > 0) {
                let playerHit = false;
                for (const segment of enemy.segments) {
                    const segX = enemy.x + segment.offsetX;
                    const segY = enemy.y + segment.offsetY;
                    const segRadius = segment.index === 0 ? 22 : 18;
                    
                    const segObj = { x: segX, y: segY, radius: segRadius };
                    if (this.checkCollision(segObj, this.player)) {
                        playerHit = true;
                        break;
                    }
                }
                if (playerHit && this.player.invincible <= 0) {
                    this.takeDamage(enemy.damage);
                    this.player.invincible = 0.5;
                }
                
                for (let j = this.bullets.length - 1; j >= 0; j--) {
                    const bullet = this.bullets[j];
                    let bulletHit = false;
                    
                    for (const segment of enemy.segments) {
                        if (segment.health <= 0) continue;
                        
                        const segX = enemy.x + segment.offsetX;
                        const segY = enemy.y + segment.offsetY;
                        const segRadius = segment.index === 0 ? 22 : 18;
                        
                        const segObj = { x: segX, y: segY, radius: segRadius };
                        
                        if (this.checkCircleCollision(bullet, segObj)) {
                            segment.health -= bullet.damage;
                            enemy.health -= bullet.damage;
                            
                            this.damageNumbers.push({
                                x: segX,
                                y: segY - segRadius,
                                value: bullet.damage,
                                isCrit: bullet.isCrit,
                                lifetime: 1,
                                vy: -2
                            });
                            
                            this.createHitParticles(bullet.x, bullet.y, bullet.color);
                            
                            bulletHit = true;
                            break;
                        }
                    }
                    
                    if (bulletHit) {
                        if (bullet.pierceCount > 0) {
                            bullet.pierceCount--;
                        } else {
                            this.bullets.splice(j, 1);
                        }
                        
                        const destroyedSegments = enemy.segments.filter(s => s.health <= 0);
                        const destroyedCount = destroyedSegments.length;
                        
                        if (destroyedCount > 0) {
                            this.segmentsDestroyed += destroyedCount;
                            
                            const cfg = window.GameConfig || {};
                            const dragonCfg = cfg.dragon || {};
                            const segmentsPerSkill = dragonCfg.segmentsPerSkillSelection || 20;
                            
                            const currentSegmentGroup = Math.floor(this.segmentsDestroyed / segmentsPerSkill);
                            const lastSegmentGroup = Math.floor(this.lastSkillSelectionAtSegment / segmentsPerSkill);
                            
                            if (currentSegmentGroup > lastSegmentGroup) {
                                this.lastSkillSelectionAtSegment = this.segmentsDestroyed;
                                this.showSkillSelection();
                            }
                        }
                        
                        for (const segment of destroyedSegments) {
                            const segX = enemy.x + segment.offsetX;
                            const segY = enemy.y + segment.offsetY;
                            
                            if (Math.random() < levelConfig.chestDropChance) {
                                this.spawnChest(segX, segY);
                            }
                            
                            if (Math.random() < levelConfig.dropChance * 0.5) {
                                this.spawnPowerup(segX, segY);
                            }
                        }
                        
                        enemy.segments = enemy.segments.filter(s => s.health > 0);
                        
                        if (enemy.segments.length === 0 || enemy.health <= 0) {
                            this.createDeathParticles(enemy.x, enemy.y, enemy.color);
                            this.enemiesKilled++;
                            this.score += enemy.maxHealth;
                            this.goldEarned += Math.floor(enemy.maxHealth / 5);
                            
                            if (Math.random() < levelConfig.dropChance) {
                                this.spawnPowerup(enemy.x, enemy.y);
                            }
                            
                            this.enemies.splice(i, 1);
                            
                            this.levelComplete();
                            break;
                        }
                    }
                }
            } else {
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
                            this.score += enemy.maxHealth;
                            this.goldEarned += Math.floor(enemy.maxHealth / 5);
                            
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
        }
        
        this.updateUI();
    }
    
    updateChests(dt) {
        const gravity = 5;
        const maxFallSpeed = 10;
        
        for (let i = this.chests.length - 1; i >= 0; i--) {
            const chest = this.chests[i];
            
            if (chest.falling) {
                chest.vy = Math.min(chest.vy + gravity * dt, maxFallSpeed);
                chest.y += chest.vy * 60 * dt;
                
                if (chest.y > this.height + chest.radius) {
                    this.chests.splice(i, 1);
                    continue;
                }
            }
            
            chest.bobOffset = Math.sin(Date.now() / 500 + i) * 5;
            
            if (this.checkCollision(chest, this.player)) {
                this.openChest(chest);
                this.chests.splice(i, 1);
            }
        }
    }
    
    openChest(chest) {
        this.chestsOpened++;
        const goldAmount = chest.goldAmount || 20;
        this.goldEarned += goldAmount;
        this.score += goldAmount * 2;
        
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
        const gravity = 4;
        const maxFallSpeed = 8;
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            if (powerup.falling) {
                powerup.vy = Math.min(powerup.vy + gravity * dt, maxFallSpeed);
                powerup.y += powerup.vy * 60 * dt;
                
                if (powerup.y > this.height + powerup.radius) {
                    this.powerups.splice(i, 1);
                    continue;
                }
            }
            
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
                this.goldEarned += 10;
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
        const config = this.getLevelConfig(this.currentLevel);
        
        this.spawnTimer += dt;
        const spawnInterval = Math.max(1.5, 4 - this.currentLevel * 0.15);
        
        if (this.spawnTimer >= spawnInterval && this.enemiesInLevel < this.totalEnemiesInLevel) {
            this.spawnDragon(config);
            this.enemiesInLevel++;
            this.spawnTimer = 0;
        }
        
        this.chestSpawnTimer += dt;
        const chestInterval = 12;
        
        if (this.chestSpawnTimer >= chestInterval && this.chests.length < 2) {
            this.spawnChest();
            this.chestSpawnTimer = 0;
        }
    }
    
    spawnDragon(config) {
        const cfg = window.GameConfig || {};
        const dragonCfg = cfg.dragon || {};
        
        const segments = dragonCfg.segments || 1000;
        const segmentSpacing = dragonCfg.segmentSpacing || 35;
        const startX = 50 + Math.random() * (this.width - 100);
        const startY = 100;
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        let totalHealth = 0;
        const healthMultiplier = dragonCfg.healthMultiplier || 1.2;
        const baseHealthPerLevel = dragonCfg.baseHealthPerLevel || 200;
        
        let firstSegmentHealth = baseHealthPerLevel * this.currentLevel;
        
        const segmentHealths = [];
        for (let i = 0; i < segments; i++) {
            const health = Math.ceil(firstSegmentHealth * Math.pow(healthMultiplier, i));
            segmentHealths.push(health);
            totalHealth += health;
        }
        
        const dragon = {
            x: startX,
            y: startY,
            radius: 22,
            health: totalHealth,
            maxHealth: totalHealth,
            speed: config.enemySpeed,
            damage: config.enemyDamage,
            angle: 0,
            color: color,
            segments: [],
            isHead: true
        };
        
        for (let i = 0; i < segments; i++) {
            dragon.segments.push({
                offsetX: 0,
                offsetY: -i * segmentSpacing,
                health: segmentHealths[i],
                maxHealth: segmentHealths[i],
                index: i
            });
        }
        
        this.enemies.push(dragon);
    }
    
    spawnChest(x, y) {
        const goldAmount = 50 + Math.floor(Math.random() * 200);
        
        this.chests.push({
            x: x || (80 + Math.random() * (this.width - 160)),
            y: y || -50,
            radius: 30,
            bobOffset: 0,
            goldAmount: goldAmount,
            vy: 0,
            falling: true
        });
    }
    
    spawnPowerup(x, y) {
        const powerupTypes = this.powerupTypes;
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
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
        
        if (this.goldEarned > 0) {
            this.saveData.gold += this.goldEarned;
        }
        if (this.currentLevel > this.saveData.maxUnlockedLevel) {
            this.saveData.maxUnlockedLevel = this.currentLevel;
        }
        this.saveGameData();
        
        document.getElementById('finalLevel').textContent = this.currentLevel;
        document.getElementById('finalGold').textContent = this.goldEarned;
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
        
        const config = this.getLevelConfig(this.currentLevel);
        
        if (this.goldEarned > 0) {
            this.saveData.gold += this.goldEarned;
        }
        if (this.currentLevel >= this.saveData.maxUnlockedLevel) {
            this.saveData.maxUnlockedLevel = Math.max(this.saveData.maxUnlockedLevel, this.currentLevel + 1);
        }
        if (this.currentLevel > this.saveData.highestLevelPassed) {
            this.saveData.highestLevelPassed = this.currentLevel;
        }
        this.saveGameData();
        
        document.getElementById('levelupStats').innerHTML = `
            <div>获得金币: <span class="gold-value">${this.goldEarned}</span></div>
            <div>得分: <span class="gold-value">${this.score}</span></div>
            <div>击败敌人: <span class="level-value">${this.enemiesKilled}</span></div>
        `;
        
        let unlockText = '';
        if (config.unlockAbility) {
            unlockText = '🎉 解锁了新能力！';
        }
        if (this.levelRewards[this.currentLevel]) {
            unlockText += ` 🎁 新奖励可领取：${this.levelRewards[this.currentLevel].name}`;
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
            const rarityClass = skill.rarity === 'A' ? 'rarity-a' : 'rarity-b';
            card.className = `skill-card ${rarityClass}`;
            
            card.innerHTML = `
                <div class="skill-icon-box">
                    <span class="skill-rarity-badge">${skill.rarity}</span>
                    <span class="skill-icon">${skill.icon}</span>
                </div>
                <div class="skill-content">
                    <div class="skill-subtitle">${skill.name}</div>
                    <div class="skill-desc">${skill.description}</div>
                </div>
                <div class="skill-index">${index + 1}</div>
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
        
        document.getElementById('freeRefreshCount').textContent = this.freeRefreshCount;
        document.getElementById('refreshBtn').disabled = this.freeRefreshCount <= 0;
        
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
                this.playerStats.bulletDamage = Math.floor(this.playerStats.bulletDamage * 1.5);
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
            
            if (enemy.segments && enemy.segments.length > 0) {
                for (let i = enemy.segments.length - 1; i >= 0; i--) {
                    const segment = enemy.segments[i];
                    const segX = enemy.x + segment.offsetX;
                    const segY = enemy.y + segment.offsetY;
                    
                    this.ctx.save();
                    this.ctx.translate(segX, segY);
                    
                    const segRadius = i === 0 ? 22 : 18;
                    
                    this.ctx.shadowColor = enemy.color;
                    this.ctx.shadowBlur = 15;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
                    
                    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, segRadius);
                    gradient.addColorStop(0, enemy.color);
                    gradient.addColorStop(1, this.darkenColor(enemy.color, 0.5));
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                    
                    if (i === 0) {
                        this.ctx.font = `${segRadius * 1.2}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('🐲', 0, 0);
                    } else {
                        this.ctx.font = `${segRadius * 0.8}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('●', 0, 0);
                    }
                    
                    const healthPercent = segment.health / segment.maxHealth;
                    const healthBarWidth = segRadius * 1.5;
                    const healthBarHeight = 5;
                    
                    this.ctx.fillStyle = '#333333';
                    this.ctx.fillRect(
                        -healthBarWidth / 2,
                        -segRadius - 10,
                        healthBarWidth,
                        healthBarHeight
                    );
                    
                    const healthColor = healthPercent > 0.5 ? '#44FF44' : healthPercent > 0.25 ? '#FFFF44' : '#FF4444';
                    this.ctx.fillStyle = healthColor;
                    this.ctx.fillRect(
                        -healthBarWidth / 2,
                        -segRadius - 10,
                        healthBarWidth * healthPercent,
                        healthBarHeight
                    );
                    
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 11px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        Math.ceil(segment.health),
                        0,
                        -segRadius - 12
                    );
                    
                    this.ctx.restore();
                }
            } else {
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
                this.ctx.fillText('🐲', 0, 0);
                
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
            }
            
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
            this.ctx.fillText('📦', 0, -5);
            
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            const goldText = `${chest.goldAmount}`;
            this.ctx.strokeText(goldText, 0, 28);
            this.ctx.fillText(goldText, 0, 28);
            
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
        const healthText = `❤️ ${Math.max(0, Math.ceil(this.playerStats.health))}/${this.playerStats.maxHealth}`;
        const battleHealthDisplay = document.getElementById('battleHealthDisplay');
        if (battleHealthDisplay) {
            battleHealthDisplay.textContent = healthText;
        }
        
        document.getElementById('goldDisplay').textContent = this.goldEarned;
        document.getElementById('scoreDisplay').textContent = this.score;
    }
}

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

window.addEventListener('load', () => {
    window.game = new DragonShooterGame();
});
