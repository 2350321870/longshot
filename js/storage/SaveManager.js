(function() {
    'use strict';

    class SaveManager {
        constructor(storageKey = 'dragonShooterSave') {
            this.storageKey = storageKey;
            this.currentVersion = 1;
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
                    moveSpeed: 0
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
                    playTime: 0
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
                localStorage.setItem(this.storageKey, JSON.stringify(data));
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
                return true;
            } catch (e) {
                console.error('Failed to clear save:', e);
                return false;
            }
        }

        export() {
            return this.load();
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
            
            return this.save(data);
        }
    }

    if (typeof window !== 'undefined') {
        window.SaveManager = SaveManager;
    }

})();
