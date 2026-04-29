(function() {
    'use strict';

    class SaveManager {
        constructor(storageKey = 'dragonShooterSave') {
            this.storageKey = storageKey;
            this.currentVersion = 1;
            this.saveData = null;
            this.onSaveCallback = null;
        }

        init() {
            this.saveData = this.load();
            if (!this.saveData) {
                this.saveData = this.getDefaultSaveData();
                this.save(this.saveData);
            }
            this.updateEnergy();
            return this.saveData;
        }

        getDefaultSaveData() {
            return {
                version: this.currentVersion,
                gold: 100,
                diamonds: 0,
                maxUnlockedLevel: 1,
                highestLevelPassed: 0,
                energy: 30,
                maxEnergy: 30,
                lastEnergyTime: Date.now(),
                equipment: {
                    weapon: { level: 0, owned: false, equippedItem: null },
                    armor: { level: 0, owned: false, equippedItem: null },
                    boots: { level: 0, owned: false, equippedItem: null },
                    ring: { level: 0, owned: false, equippedItem: null }
                },
                permanentUpgrades: {
                    bulletDamage: 0,
                    maxHealth: 0,
                    moveSpeed: 0,
                    skillDamage: 0,
                    critChance: 0,
                    critDamage: 0,
                    enemySlow: 0,
                    extraRevives: 0,
                    goldBonus: 0,
                    expBonus: 0,
                    damageReduction: 0,
                    attackSpeed: 0,
                    healthRegen: 0,
                    bulletPierce: 0
                },
                unlockedItems: ['pistol'],
                equippedItems: [],
                itemLevels: { pistol: 1 },
                claimedRewards: {},
                selectedCharacter: 'default',
                unlockedCharacters: ['default'],
                inventory: [],
                dailyTasks: null,
                unlockedAchievements: [],
                claimedAchievements: [],
                achievementPoints: 0,
                achievementShopExchangeCount: {},
                statistics: {
                    totalKills: 0,
                    totalCleared: 0,
                    totalGoldEarned: 0,
                    firstClearDate: null,
                    totalSkillsUsed: 0,
                    totalChestsOpened: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalPowerupsCollected: 0,
                    totalRevivesUsed: 0,
                    totalGameTime: 0,
                    highestSingleDamage: 0,
                    totalBossKills: 0,
                    perfectLevels: 0,
                    totalPlayCount: 0,
                    totalDeaths: 0
                }
            };
        }

        load() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    return this.migrate(data);
                }
            } catch (e) {
                console.error('Failed to load save:', e);
            }
            return null;
        }

        save(data) {
            try {
                if (data) {
                    this.saveData = data;
                }
                localStorage.setItem(this.storageKey, JSON.stringify(this.saveData));
                if (this.onSaveCallback) {
                    this.onSaveCallback(this.saveData);
                }
                return true;
            } catch (e) {
                console.error('Failed to save:', e);
                return false;
            }
        }

        migrate(data) {
            const defaultData = this.getDefaultSaveData();
            
            if (!data.version || data.version < 1) {
                console.log('Migrating save data to version 1');
                
                if (!data.unlockedCharacters) {
                    data.unlockedCharacters = ['default'];
                }
                if (!data.selectedCharacter) {
                    data.selectedCharacter = 'default';
                }
                
                if (data.dailyTasks && !Array.isArray(data.dailyTasks)) {
                    if (!data.dailyTasks.tasks) {
                        data.dailyTasks = null;
                    }
                }
                
                if (!data.permanentUpgrades) {
                    data.permanentUpgrades = {};
                }
                if (!data.permanentUpgrades.skillDamage) data.permanentUpgrades.skillDamage = 0;
                if (!data.permanentUpgrades.critChance) data.permanentUpgrades.critChance = 0;
                if (!data.permanentUpgrades.critDamage) data.permanentUpgrades.critDamage = 0;
                if (!data.permanentUpgrades.enemySlow) data.permanentUpgrades.enemySlow = 0;
                if (!data.permanentUpgrades.extraRevives) data.permanentUpgrades.extraRevives = 0;
                if (!data.permanentUpgrades.goldBonus) data.permanentUpgrades.goldBonus = 0;
                if (!data.permanentUpgrades.expBonus) data.permanentUpgrades.expBonus = 0;
                if (!data.permanentUpgrades.damageReduction) data.permanentUpgrades.damageReduction = 0;
                if (!data.permanentUpgrades.attackSpeed) data.permanentUpgrades.attackSpeed = 0;
                if (!data.permanentUpgrades.healthRegen) data.permanentUpgrades.healthRegen = 0;
                if (!data.permanentUpgrades.bulletPierce) data.permanentUpgrades.bulletPierce = 0;
                
                if (!data.statistics) {
                    data.statistics = {};
                }
                if (!data.statistics.totalGameTime) data.statistics.totalGameTime = 0;
                if (!data.statistics.highestSingleDamage) data.statistics.highestSingleDamage = 0;
                if (!data.statistics.totalBossKills) data.statistics.totalBossKills = 0;
                if (!data.statistics.perfectLevels) data.statistics.perfectLevels = 0;
                if (!data.statistics.totalPlayCount) data.statistics.totalPlayCount = 0;
                if (!data.statistics.totalDeaths) data.statistics.totalDeaths = 0;
            }
            
            return this.deepMerge(defaultData, data);
        }

        deepMerge(target, source) {
            const result = { ...target };
            
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        result[key] = this.deepMerge(target[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        }

        clear() {
            try {
                localStorage.removeItem(this.storageKey);
                this.saveData = this.getDefaultSaveData();
                return true;
            } catch (e) {
                console.error('Failed to clear save:', e);
                return false;
            }
        }

        export() {
            return this.saveData;
        }

        import(data) {
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Invalid import data:', e);
                    return false;
                }
            }
            
            this.saveData = this.migrate(data);
            return this.save(this.saveData);
        }

        updateEnergy() {
            if (!this.saveData) return 0;
            
            const now = Date.now();
            const elapsed = now - this.saveData.lastEnergyTime;
            const energyToRecover = Math.floor(elapsed / 60000);
            
            if (energyToRecover > 0) {
                this.saveData.energy = Math.min(this.saveData.maxEnergy, this.saveData.energy + energyToRecover);
                this.saveData.lastEnergyTime = now;
                this.save();
            }
            
            return this.saveData.energy;
        }

        consumeEnergy(amount) {
            if (!this.saveData) return false;
            
            if (this.saveData.energy >= amount) {
                this.saveData.energy -= amount;
                this.saveData.lastEnergyTime = Date.now();
                this.save();
                return true;
            }
            return false;
        }

        addEnergy(amount) {
            if (!this.saveData) return false;
            
            this.saveData.energy = Math.min(this.saveData.maxEnergy, this.saveData.energy + amount);
            this.save();
            return true;
        }

        getEnergy() {
            if (!this.saveData) return 0;
            this.updateEnergy();
            return this.saveData.energy;
        }

        getTodayString() {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }

        checkDailyTasksRefresh(taskPool) {
            if (!this.saveData) return;
            
            const today = this.getTodayString();
            const savedDate = this.saveData.dailyTasks?.date;
            
            if (!savedDate || savedDate !== today) {
                this.generateDailyTasks(taskPool);
            }
        }

        generateDailyTasks(taskPool) {
            if (!this.saveData || !taskPool) return;
            
            const today = this.getTodayString();
            const shuffled = [...taskPool].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, 3);
            
            this.saveData.dailyTasks = {
                date: today,
                tasks: selected.map(t => ({
                    ...t,
                    progress: 0,
                    completed: false,
                    claimed: false
                }))
            };
            
            this.save();
        }

        updateTaskProgress(type, amount = 1) {
            if (!this.saveData || !this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) return false;
            
            let hasUpdates = false;
            
            for (const task of this.saveData.dailyTasks.tasks) {
                if (task.type === type && !task.completed) {
                    task.progress += amount;
                    if (task.progress >= task.target) {
                        task.completed = true;
                    }
                    hasUpdates = true;
                }
            }
            
            if (hasUpdates) {
                this.save();
            }
            return hasUpdates;
        }

        claimTaskReward(taskId) {
            if (!this.saveData || !this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) {
                return { success: false, message: '没有可领取的任务' };
            }
            
            const task = this.saveData.dailyTasks.tasks.find(t => t.id === taskId);
            if (!task) {
                return { success: false, message: '任务不存在' };
            }
            if (!task.completed) {
                return { success: false, message: '任务未完成' };
            }
            if (task.claimed) {
                return { success: false, message: '已领取过奖励' };
            }
            
            task.claimed = true;
            
            if (task.rewards) {
                if (task.rewards.gold) {
                    this.saveData.gold += task.rewards.gold;
                }
                if (task.rewards.diamonds) {
                    this.saveData.diamonds += task.rewards.diamonds;
                }
            }
            
            this.save();
            return { 
                success: true, 
                message: '奖励领取成功',
                rewards: task.rewards
            };
        }

        getDailyTasks() {
            if (!this.saveData) return [];
            this.checkDailyTasksRefresh([]);
            return this.saveData.dailyTasks?.tasks || [];
        }

        updateStatistics(type, amount = 1) {
            if (!this.saveData || !this.saveData.statistics) return;
            
            const stats = this.saveData.statistics;
            
            switch (type) {
                case 'kill':
                    stats.totalKills += amount;
                    this.updateTaskProgress('kill_enemies', amount);
                    break;
                case 'clear':
                    stats.totalCleared += amount;
                    if (!stats.firstClearDate) {
                        stats.firstClearDate = this.getTodayString();
                    }
                    this.updateTaskProgress('complete_levels', amount);
                    break;
                case 'gold':
                    stats.totalGoldEarned += amount;
                    this.updateTaskProgress('collect_gold', amount);
                    break;
                case 'skill_use':
                    stats.totalSkillsUsed += amount;
                    this.updateTaskProgress('use_skills', amount);
                    break;
                case 'chest_open':
                    stats.totalChestsOpened += amount;
                    this.updateTaskProgress('open_chests', amount);
                    break;
                case 'damage_dealt':
                    stats.totalDamageDealt += amount;
                    if (amount > stats.highestSingleDamage) {
                        stats.highestSingleDamage = amount;
                    }
                    break;
                case 'damage_taken':
                    stats.totalDamageTaken += amount;
                    break;
                case 'powerup_collect':
                    stats.totalPowerupsCollected += amount;
                    break;
                case 'revive_use':
                    stats.totalRevivesUsed += amount;
                    break;
                case 'game_time':
                    stats.totalGameTime += amount;
                    break;
                case 'boss_kill':
                    stats.totalBossKills += amount;
                    break;
                case 'perfect_level':
                    stats.perfectLevels += amount;
                    break;
                case 'play_count':
                    stats.totalPlayCount += amount;
                    break;
                case 'death':
                    stats.totalDeaths += amount;
                    break;
            }
            
            this.save();
        }

        getStatistics() {
            if (!this.saveData) return {};
            return { ...this.saveData.statistics };
        }

        addGold(amount) {
            if (!this.saveData) return false;
            
            const bonusMultiplier = 1 + (this.saveData.permanentUpgrades.goldBonus || 0) * 0.03;
            const finalAmount = Math.floor(amount * bonusMultiplier);
            
            this.saveData.gold += finalAmount;
            this.updateStatistics('gold', finalAmount);
            this.save();
            return true;
        }

        addDiamonds(amount) {
            if (!this.saveData) return false;
            
            this.saveData.diamonds += amount;
            this.save();
            return true;
        }

        spendGold(amount) {
            if (!this.saveData || this.saveData.gold < amount) return false;
            
            this.saveData.gold -= amount;
            this.save();
            return true;
        }

        unlockLevel(level) {
            if (!this.saveData) return false;
            
            if (level > this.saveData.maxUnlockedLevel) {
                this.saveData.maxUnlockedLevel = level;
                this.save();
                return true;
            }
            return false;
        }

        setHighestLevelPassed(level) {
            if (!this.saveData) return false;
            
            if (level > this.saveData.highestLevelPassed) {
                this.saveData.highestLevelPassed = level;
                this.save();
                return true;
            }
            return false;
        }

        unlockCharacter(charId) {
            if (!this.saveData) return false;
            
            if (!this.saveData.unlockedCharacters.includes(charId)) {
                this.saveData.unlockedCharacters.push(charId);
                this.save();
                return true;
            }
            return false;
        }

        selectCharacter(charId) {
            if (!this.saveData) return false;
            
            if (this.saveData.unlockedCharacters.includes(charId)) {
                this.saveData.selectedCharacter = charId;
                this.save();
                return true;
            }
            return false;
        }

        getSelectedCharacter() {
            if (!this.saveData) return 'default';
            return this.saveData.selectedCharacter;
        }

        getUnlockedCharacters() {
            if (!this.saveData) return ['default'];
            return [...this.saveData.unlockedCharacters];
        }

        getBaseStats() {
            if (!this.saveData) {
                return {
                    bulletDamage: 5,
                    maxHealth: 100,
                    moveSpeed: 1,
                    attackSpeed: 1,
                    skillDamageBonus: 1,
                    critChanceBonus: 0,
                    critDamageBonus: 0,
                    enemySlowMultiplier: 1,
                    extraRevives: 0,
                    goldBonusMultiplier: 1,
                    expBonusMultiplier: 1,
                    damageReduction: 0,
                    healthRegen: 0,
                    bulletPierceBonus: 0
                };
            }
            
            const upgrades = this.saveData.permanentUpgrades || {};
            return {
                bulletDamage: 5 + (upgrades.bulletDamage || 0) * 2,
                maxHealth: 100 + (upgrades.maxHealth || 0) * 10,
                moveSpeed: 1 + (upgrades.moveSpeed || 0) * 0.02,
                attackSpeed: 1 + (upgrades.attackSpeed || 0) * 0.03,
                skillDamageBonus: 1 + (upgrades.skillDamage || 0) * 0.05,
                critChanceBonus: (upgrades.critChance || 0) * 0.02,
                critDamageBonus: (upgrades.critDamage || 0) * 0.05,
                enemySlowMultiplier: 1 - (upgrades.enemySlow || 0) * 0.02,
                extraRevives: (upgrades.extraRevives || 0),
                goldBonusMultiplier: 1 + (upgrades.goldBonus || 0) * 0.03,
                expBonusMultiplier: 1 + (upgrades.expBonus || 0) * 0.03,
                damageReduction: (upgrades.damageReduction || 0) * 0.02,
                healthRegen: (upgrades.healthRegen || 0),
                bulletPierceBonus: (upgrades.bulletPierce || 0)
            };
        }

        getPermanentUpgrade(statName) {
            if (!this.saveData || !this.saveData.permanentUpgrades) return 0;
            return this.saveData.permanentUpgrades[statName] || 0;
        }

        addPermanentUpgrade(statName, amount = 1) {
            if (!this.saveData) return false;
            
            if (!this.saveData.permanentUpgrades) {
                this.saveData.permanentUpgrades = {};
            }
            
            if (this.saveData.permanentUpgrades[statName] === undefined) {
                this.saveData.permanentUpgrades[statName] = 0;
            }
            
            this.saveData.permanentUpgrades[statName] += amount;
            this.save();
            return true;
        }

        getAchievementShopExchangeCount(itemId) {
            if (!this.saveData || !this.saveData.achievementShopExchangeCount) return 0;
            return this.saveData.achievementShopExchangeCount[itemId] || 0;
        }

        incrementAchievementShopExchangeCount(itemId) {
            if (!this.saveData) return false;
            
            if (!this.saveData.achievementShopExchangeCount) {
                this.saveData.achievementShopExchangeCount = {};
            }
            
            if (this.saveData.achievementShopExchangeCount[itemId] === undefined) {
                this.saveData.achievementShopExchangeCount[itemId] = 0;
            }
            
            this.saveData.achievementShopExchangeCount[itemId]++;
            this.save();
            return true;
        }

        addAchievementPoints(amount) {
            if (!this.saveData) return false;
            
            this.saveData.achievementPoints = (this.saveData.achievementPoints || 0) + amount;
            this.save();
            return true;
        }

        spendAchievementPoints(amount) {
            if (!this.saveData || (this.saveData.achievementPoints || 0) < amount) return false;
            
            this.saveData.achievementPoints -= amount;
            this.save();
            return true;
        }

        getAchievementPoints() {
            if (!this.saveData) return 0;
            return this.saveData.achievementPoints || 0;
        }

        isAchievementUnlocked(achievementId) {
            if (!this.saveData || !this.saveData.unlockedAchievements) return false;
            return this.saveData.unlockedAchievements.includes(achievementId);
        }

        unlockAchievement(achievementId) {
            if (!this.saveData) return false;
            
            if (!this.saveData.unlockedAchievements) {
                this.saveData.unlockedAchievements = [];
            }
            
            if (!this.saveData.unlockedAchievements.includes(achievementId)) {
                this.saveData.unlockedAchievements.push(achievementId);
                this.save();
                return true;
            }
            return false;
        }

        getUnlockedAchievements() {
            if (!this.saveData) return [];
            return [...(this.saveData.unlockedAchievements || [])];
        }

        isAchievementClaimed(achievementId) {
            if (!this.saveData || !this.saveData.claimedAchievements) return false;
            return this.saveData.claimedAchievements.includes(achievementId);
        }

        claimAchievementReward(achievementId) {
            if (!this.saveData) return false;
            
            if (!this.saveData.claimedAchievements) {
                this.saveData.claimedAchievements = [];
            }
            
            if (!this.saveData.claimedAchievements.includes(achievementId)) {
                this.saveData.claimedAchievements.push(achievementId);
                this.save();
                return true;
            }
            return false;
        }

        getClaimedAchievements() {
            if (!this.saveData) return [];
            return [...(this.saveData.claimedAchievements || [])];
        }

        setOnSaveCallback(callback) {
            this.onSaveCallback = callback;
        }
    }

    if (typeof window !== 'undefined') {
        window.SaveManager = SaveManager;
    }

})();
