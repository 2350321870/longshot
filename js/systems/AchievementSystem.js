(function() {
    'use strict';

    class AchievementSystem {
        constructor(game) {
            this.game = game;
            
            this.achievements = [];
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            this.loadAchievementData();
            this.isInitialized = true;
            
            console.log('AchievementSystem initialized');
        }

        loadAchievementData() {
            this.achievements = [
                {
                    id: 'first_clear',
                    name: '初次突破',
                    description: '首次通关任意关卡',
                    icon: '🎯',
                    type: 'first_clear',
                    target: 1,
                    achievementPoints: 10,
                    rewards: { gold: 100, diamonds: 5 }
                },
                {
                    id: 'clear_10',
                    name: '初窥门径',
                    description: '通关 10 个关卡',
                    icon: '⭐',
                    type: 'total_cleared',
                    target: 10,
                    achievementPoints: 20,
                    rewards: { gold: 200, diamonds: 10 }
                },
                {
                    id: 'clear_30',
                    name: '渐入佳境',
                    description: '通关 30 个关卡',
                    icon: '✨',
                    type: 'total_cleared',
                    target: 30,
                    achievementPoints: 40,
                    rewards: { gold: 400, diamonds: 20 }
                },
                {
                    id: 'kills_100',
                    name: '屠龙新手',
                    description: '累计击杀 100 个敌人',
                    icon: '🗡️',
                    type: 'total_kills',
                    target: 100,
                    achievementPoints: 15,
                    rewards: { gold: 150, diamonds: 8 }
                },
                {
                    id: 'kills_500',
                    name: '屠龙勇士',
                    description: '累计击杀 500 个敌人',
                    icon: '⚔️',
                    type: 'total_kills',
                    target: 500,
                    achievementPoints: 35,
                    rewards: { gold: 350, diamonds: 18 }
                },
                {
                    id: 'kills_1000',
                    name: '屠龙大师',
                    description: '累计击杀 1000 个敌人',
                    icon: '🔥',
                    type: 'total_kills',
                    target: 1000,
                    achievementPoints: 50,
                    rewards: { gold: 500, diamonds: 25 }
                },
                {
                    id: 'gold_1000',
                    name: '财富积累',
                    description: '累计获得 1000 金币',
                    icon: '💰',
                    type: 'total_gold',
                    target: 1000,
                    achievementPoints: 20,
                    rewards: { gold: 200, diamonds: 10 }
                },
                {
                    id: 'gold_10000',
                    name: '富甲一方',
                    description: '累计获得 10000 金币',
                    icon: '💎',
                    type: 'total_gold',
                    target: 10000,
                    achievementPoints: 45,
                    rewards: { gold: 450, diamonds: 22 }
                },
                {
                    id: 'unlock_all_characters',
                    name: '角色收藏家',
                    description: '解锁所有角色',
                    icon: '👤',
                    type: 'characters_unlocked',
                    target: 5,
                    achievementPoints: 80,
                    rewards: { gold: 800, diamonds: 40 }
                },
                {
                    id: 'reach_level_10',
                    name: '勇闯深渊',
                    description: '达到第 10 关',
                    icon: '🌊',
                    type: 'max_reached_level',
                    target: 10,
                    achievementPoints: 30,
                    rewards: { gold: 300, diamonds: 15 }
                },
                {
                    id: 'reach_level_30',
                    name: '深渊探险家',
                    description: '达到第 30 关',
                    icon: '🌊',
                    type: 'max_reached_level',
                    target: 30,
                    achievementPoints: 60,
                    rewards: { gold: 600, diamonds: 30 }
                },
                {
                    id: 'skills_100',
                    name: '法术学徒',
                    description: '累计使用技能 100 次',
                    icon: '✨',
                    type: 'total_skills',
                    target: 100,
                    achievementPoints: 25,
                    rewards: { gold: 250, diamonds: 12 }
                },
                {
                    id: 'skills_500',
                    name: '法术大师',
                    description: '累计使用技能 500 次',
                    icon: '🌟',
                    type: 'total_skills',
                    target: 500,
                    achievementPoints: 60,
                    rewards: { gold: 600, diamonds: 30 }
                },
                {
                    id: 'chests_50',
                    name: '寻宝达人',
                    description: '累计打开 50 个宝箱',
                    icon: '📦',
                    type: 'total_chests',
                    target: 50,
                    achievementPoints: 25,
                    rewards: { gold: 250, diamonds: 12 }
                },
                {
                    id: 'chests_200',
                    name: '宝藏猎人',
                    description: '累计打开 200 个宝箱',
                    icon: '💎',
                    type: 'total_chests',
                    target: 200,
                    achievementPoints: 70,
                    rewards: { gold: 700, diamonds: 35 }
                },
                {
                    id: 'damage_dealt_50000',
                    name: '伤害输出',
                    description: '累计造成 50000 点伤害',
                    icon: '💥',
                    type: 'total_damage_dealt',
                    target: 50000,
                    achievementPoints: 30,
                    rewards: { gold: 300, diamonds: 15 }
                },
                {
                    id: 'damage_dealt_500000',
                    name: '毁灭者',
                    description: '累计造成 500000 点伤害',
                    icon: '🔥',
                    type: 'total_damage_dealt',
                    target: 500000,
                    achievementPoints: 100,
                    rewards: { gold: 1000, diamonds: 50 }
                },
                {
                    id: 'highest_damage_100',
                    name: '暴击入门',
                    description: '单次造成 100 点伤害',
                    icon: '⚡',
                    type: 'highest_damage',
                    target: 100,
                    achievementPoints: 15,
                    rewards: { gold: 150, diamonds: 8 }
                },
                {
                    id: 'highest_damage_500',
                    name: '暴击大师',
                    description: '单次造成 500 点伤害',
                    icon: '💫',
                    type: 'highest_damage',
                    target: 500,
                    achievementPoints: 50,
                    rewards: { gold: 500, diamonds: 25 }
                },
                {
                    id: 'powerups_100',
                    name: '道具收集者',
                    description: '累计收集 100 个道具',
                    icon: '🎁',
                    type: 'total_powerups',
                    target: 100,
                    achievementPoints: 20,
                    rewards: { gold: 200, diamonds: 10 }
                },
                {
                    id: 'play_50',
                    name: '游戏爱好者',
                    description: '累计进行 50 局游戏',
                    icon: '🎮',
                    type: 'total_plays',
                    target: 50,
                    achievementPoints: 25,
                    rewards: { gold: 250, diamonds: 12 }
                },
                {
                    id: 'play_200',
                    name: '游戏狂人',
                    description: '累计进行 200 局游戏',
                    icon: '🕹️',
                    type: 'total_plays',
                    target: 200,
                    achievementPoints: 60,
                    rewards: { gold: 600, diamonds: 30 }
                },
                {
                    id: 'deaths_50',
                    name: '不屈战士',
                    description: '累计阵亡 50 次',
                    icon: '💀',
                    type: 'total_deaths',
                    target: 50,
                    achievementPoints: 10,
                    rewards: { gold: 100, diamonds: 5 }
                },
                {
                    id: 'revives_20',
                    name: '复活达人',
                    description: '累计使用复活 20 次',
                    icon: '🔄',
                    type: 'total_revives',
                    target: 20,
                    achievementPoints: 15,
                    rewards: { gold: 150, diamonds: 8 }
                },
                {
                    id: 'clear_50',
                    name: '屠龙宗师',
                    description: '通关 50 个关卡',
                    icon: '👑',
                    type: 'total_cleared',
                    target: 50,
                    achievementPoints: 80,
                    rewards: { gold: 800, diamonds: 40 }
                },
                {
                    id: 'clear_100',
                    name: '传说屠龙者',
                    description: '通关 100 个关卡',
                    icon: '🏆',
                    type: 'total_cleared',
                    target: 100,
                    achievementPoints: 150,
                    rewards: { gold: 2000, diamonds: 100 }
                },
                {
                    id: 'reach_level_50',
                    name: '深渊行者',
                    description: '达到第 50 关',
                    icon: '🌌',
                    type: 'max_reached_level',
                    target: 50,
                    achievementPoints: 120,
                    rewards: { gold: 1200, diamonds: 60 }
                },
                {
                    id: 'reach_level_100',
                    name: '深渊主宰',
                    description: '达到第 100 关',
                    icon: '🌟',
                    type: 'max_reached_level',
                    target: 100,
                    achievementPoints: 200,
                    rewards: { gold: 3000, diamonds: 150 }
                }
            ];
        }

        checkAchievements() {
            if (!this.game.saveData) return;
            
            const saveData = this.game.saveData;
            const stats = saveData.statistics || {};
            
            if (!saveData.unlockedAchievements) {
                saveData.unlockedAchievements = [];
            }
            
            const newlyUnlocked = [];
            
            for (const achievement of this.achievements) {
                if (saveData.unlockedAchievements.includes(achievement.id)) {
                    continue;
                }
                
                let isUnlocked = false;
                
                switch (achievement.type) {
                    case 'first_clear':
                        isUnlocked = !!stats.firstClearDate;
                        break;
                    case 'total_cleared':
                        isUnlocked = (stats.totalCleared || 0) >= achievement.target;
                        break;
                    case 'total_kills':
                        isUnlocked = (stats.totalKills || 0) >= achievement.target;
                        break;
                    case 'total_gold':
                        isUnlocked = (stats.totalGoldEarned || 0) >= achievement.target;
                        break;
                    case 'characters_unlocked':
                        isUnlocked = (saveData.unlockedCharacters?.length || 0) >= achievement.target;
                        break;
                    case 'max_reached_level':
                        isUnlocked = (saveData.maxUnlockedLevel || 1) >= achievement.target;
                        break;
                    case 'equip_quality':
                        isUnlocked = this.hasEquippedQuality(achievement.target);
                        break;
                    case 'full_equipment':
                        isUnlocked = this.hasFullEquipment();
                        break;
                    case 'total_skills':
                        isUnlocked = (stats.totalSkillsUsed || 0) >= achievement.target;
                        break;
                    case 'total_chests':
                        isUnlocked = (stats.totalChestsOpened || 0) >= achievement.target;
                        break;
                    case 'total_damage_dealt':
                        isUnlocked = (stats.totalDamageDealt || 0) >= achievement.target;
                        break;
                    case 'total_damage_taken':
                        isUnlocked = (stats.totalDamageTaken || 0) >= achievement.target;
                        break;
                    case 'total_powerups':
                        isUnlocked = (stats.totalPowerupsCollected || 0) >= achievement.target;
                        break;
                    case 'total_revives':
                        isUnlocked = (stats.totalRevivesUsed || 0) >= achievement.target;
                        break;
                    case 'total_playtime':
                        isUnlocked = Math.floor((stats.totalGameTime || 0) / 60) >= achievement.target;
                        break;
                    case 'highest_damage':
                        isUnlocked = (stats.highestSingleDamage || 0) >= achievement.target;
                        break;
                    case 'total_bosses':
                        isUnlocked = (stats.totalBossKills || 0) >= achievement.target;
                        break;
                    case 'perfect_levels':
                        isUnlocked = (stats.perfectLevels || 0) >= achievement.target;
                        break;
                    case 'total_plays':
                        isUnlocked = (stats.totalPlayCount || 0) >= achievement.target;
                        break;
                    case 'total_deaths':
                        isUnlocked = (stats.totalDeaths || 0) >= achievement.target;
                        break;
                }
                
                if (isUnlocked) {
                    saveData.unlockedAchievements.push(achievement.id);
                    newlyUnlocked.push(achievement);
                    
                    if (!saveData.achievementPoints) {
                        saveData.achievementPoints = 0;
                    }
                    saveData.achievementPoints += achievement.achievementPoints;
                }
            }
            
            if (this.game.saveGameData) {
                this.game.saveGameData();
            }
            
            if (newlyUnlocked.length > 0) {
                newlyUnlocked.forEach((achievement, index) => {
                    setTimeout(() => {
                        if (this.game.showAchievementNotification) {
                            this.game.showAchievementNotification(achievement);
                        }
                    }, index * 4500);
                });
            }
        }

        hasEquippedQuality(quality) {
            if (!this.game.saveData || !this.game.saveData.equipment) return false;
            
            const equipment = this.game.saveData.equipment;
            
            for (const slot of Object.values(equipment)) {
                if (slot.equippedItem && slot.equippedItem.quality === quality) {
                    return true;
                }
            }
            return false;
        }

        hasFullEquipment() {
            if (!this.game.saveData || !this.game.saveData.equipment) return false;
            
            const equipment = this.game.saveData.equipment;
            
            let equippedCount = 0;
            for (const slot of Object.values(equipment)) {
                if (slot.equippedItem) {
                    equippedCount++;
                }
            }
            return equippedCount >= 4;
        }

        getAchievementProgress(achievement) {
            if (!this.game.saveData) return 0;
            
            const stats = this.game.saveData.statistics || {};
            const saveData = this.game.saveData;
            
            switch (achievement.type) {
                case 'first_clear':
                    return stats.firstClearDate ? 1 : 0;
                case 'total_cleared':
                    return stats.totalCleared || 0;
                case 'total_kills':
                    return stats.totalKills || 0;
                case 'total_gold':
                    return stats.totalGoldEarned || 0;
                case 'characters_unlocked':
                    return saveData.unlockedCharacters?.length || 0;
                case 'max_reached_level':
                    return saveData.maxUnlockedLevel || 1;
                case 'equip_quality':
                    return this.hasEquippedQuality(achievement.target) ? 1 : 0;
                case 'full_equipment':
                    return this.hasFullEquipment() ? 1 : 0;
                case 'total_skills':
                    return stats.totalSkillsUsed || 0;
                case 'total_chests':
                    return stats.totalChestsOpened || 0;
                case 'total_damage_dealt':
                    return stats.totalDamageDealt || 0;
                case 'total_damage_taken':
                    return stats.totalDamageTaken || 0;
                case 'total_powerups':
                    return stats.totalPowerupsCollected || 0;
                case 'total_revives':
                    return stats.totalRevivesUsed || 0;
                case 'total_playtime':
                    return Math.floor((stats.totalGameTime || 0) / 60);
                case 'highest_damage':
                    return stats.highestSingleDamage || 0;
                case 'total_bosses':
                    return stats.totalBossKills || 0;
                case 'perfect_levels':
                    return stats.perfectLevels || 0;
                case 'total_plays':
                    return stats.totalPlayCount || 0;
                case 'total_deaths':
                    return stats.totalDeaths || 0;
                default:
                    return 0;
            }
        }

        getAchievementsWithProgress() {
            return this.achievements.map(achievement => ({
                ...achievement,
                progress: this.getAchievementProgress(achievement)
            }));
        }

        claimAchievementReward(achievementId) {
            if (!this.game.saveData) return false;
            
            const saveData = this.game.saveData;
            
            if (!saveData.claimedAchievements) {
                saveData.claimedAchievements = [];
            }
            
            if (saveData.claimedAchievements.includes(achievementId)) return false;
            if (!saveData.unlockedAchievements?.includes(achievementId)) return false;
            
            const achievement = this.achievements.find(a => a.id === achievementId);
            if (!achievement) return false;
            
            saveData.claimedAchievements.push(achievementId);
            
            if (achievement.rewards) {
                if (achievement.rewards.gold) {
                    saveData.gold += achievement.rewards.gold;
                }
                if (achievement.rewards.diamonds) {
                    saveData.diamonds += achievement.rewards.diamonds;
                }
            }
            
            if (this.game.saveGameData) {
                this.game.saveGameData();
            }
            
            return true;
        }

        reset() {
            
        }
    }

    if (typeof window !== 'undefined') {
        window.AchievementSystem = AchievementSystem;
    }

})();
