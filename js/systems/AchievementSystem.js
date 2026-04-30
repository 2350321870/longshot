(function() {
    'use strict';

    class AchievementSystem {
        constructor(game, saveManager) {
            this.game = game;
            this.saveManager = saveManager;
            this.achievements = [];
            this.shopItems = [];
            this.isInitialized = false;
            this.onAchievementUnlocked = null;
        }

        init() {
            if (this.isInitialized) return;
            
            this.loadAchievementData();
            this.loadShopItems();
            this.isInitialized = true;
            
            console.log('AchievementSystem initialized');
        }

        loadAchievementData() {
            if (typeof GameData !== 'undefined' && GameData.achievements) {
                this.achievements = GameData.achievements;
            } else {
                this.achievements = this.getDefaultAchievements();
            }
        }

        loadShopItems() {
            if (typeof GameData !== 'undefined' && GameData.achievementShopItems) {
                this.shopItems = GameData.achievementShopItems;
            } else {
                this.shopItems = this.getDefaultShopItems();
            }
        }

        getDefaultAchievements() {
            return [
                { id: 'first_clear', name: '初出茅庐', description: '首次通关任意关卡', icon: '🏆', type: 'first_clear', target: 1, achievementPoints: 10, rewards: { gold: 100, diamonds: 5 } },
                { id: 'clear_5', name: '渐入佳境', description: '通关 5 个关卡', icon: '⭐', type: 'total_cleared', target: 5, achievementPoints: 20, rewards: { gold: 200, diamonds: 10 } },
                { id: 'clear_20', name: '屠龙大师', description: '通关 20 个关卡', icon: '👑', type: 'total_cleared', target: 20, achievementPoints: 50, rewards: { gold: 500, diamonds: 25 } },
                { id: 'kill_100', name: '百人斩', description: '累计击败 100 个敌人', icon: '⚔️', type: 'total_kills', target: 100, achievementPoints: 15, rewards: { gold: 150, diamonds: 8 } },
                { id: 'kill_500', name: '千人斩', description: '累计击败 500 个敌人', icon: '🗡️', type: 'total_kills', target: 500, achievementPoints: 40, rewards: { gold: 400, diamonds: 20 } },
                { id: 'gold_1000', name: '小富翁', description: '累计获得 1000 金币', icon: '💰', type: 'total_gold', target: 1000, achievementPoints: 25, rewards: { gold: 100, diamonds: 10 } },
                { id: 'gold_10000', name: '大富翁', description: '累计获得 10000 金币', icon: '💎', type: 'total_gold', target: 10000, achievementPoints: 60, rewards: { gold: 1000, diamonds: 50 } },
                { id: 'unlock_2_chars', name: '角色收集者', description: '解锁 2 个角色', icon: '👥', type: 'characters_unlocked', target: 2, achievementPoints: 30, rewards: { gold: 300, diamonds: 15 } },
                { id: 'unlock_all_chars', name: '全角色解锁', description: '解锁所有角色', icon: '🎭', type: 'characters_unlocked', target: 5, achievementPoints: 100, rewards: { gold: 1000, diamonds: 100 } },
                { id: 'reach_level_10', name: '深入险境', description: '达到第 10 关', icon: '🏰', type: 'max_reached_level', target: 10, achievementPoints: 35, rewards: { gold: 350, diamonds: 20 } },
                { id: 'reach_level_30', name: '深渊探索者', description: '达到第 30 关', icon: '🌑', type: 'max_reached_level', target: 30, achievementPoints: 80, rewards: { gold: 800, diamonds: 50 } },
                { id: 'equip_legendary', name: '传说装备', description: '装备 1 件传说品质物品', icon: '✨', type: 'equip_quality', target: 'legendary', achievementPoints: 50, rewards: { gold: 500, diamonds: 30 } },
                { id: 'full_equip', name: '装备大师', description: '4 个装备槽全部装备物品', icon: '🛡️', type: 'full_equipment', target: 1, achievementPoints: 45, rewards: { gold: 450, diamonds: 25 } },
                { id: 'kill_1000', name: '万人斩', description: '累计击败 1000 个敌人', icon: '⚔️', type: 'total_kills', target: 1000, achievementPoints: 80, rewards: { gold: 800, diamonds: 40 } },
                { id: 'kill_5000', name: '战神', description: '累计击败 5000 个敌人', icon: '🗡️', type: 'total_kills', target: 5000, achievementPoints: 150, rewards: { gold: 2000, diamonds: 100 } },
                { id: 'gold_50000', name: '富可敌国', description: '累计获得 50000 金币', icon: '🏦', type: 'total_gold', target: 50000, achievementPoints: 100, rewards: { gold: 5000, diamonds: 100 } },
                { id: 'skills_100', name: '法术学徒', description: '累计使用技能 100 次', icon: '✨', type: 'total_skills', target: 100, achievementPoints: 20, rewards: { gold: 200, diamonds: 10 } },
                { id: 'skills_500', name: '法术大师', description: '累计使用技能 500 次', icon: '🌟', type: 'total_skills', target: 500, achievementPoints: 60, rewards: { gold: 600, diamonds: 30 } },
                { id: 'chests_50', name: '寻宝达人', description: '累计打开 50 个宝箱', icon: '📦', type: 'total_chests', target: 50, achievementPoints: 25, rewards: { gold: 250, diamonds: 12 } },
                { id: 'chests_200', name: '宝藏猎人', description: '累计打开 200 个宝箱', icon: '💎', type: 'total_chests', target: 200, achievementPoints: 80, rewards: { gold: 800, diamonds: 40 } },
                { id: 'damage_100000', name: '伤害输出', description: '累计造成 100000 点伤害', icon: '💥', type: 'total_damage', target: 100000, achievementPoints: 35, rewards: { gold: 350, diamonds: 18 } },
                { id: 'damage_1000000', name: '毁灭者', description: '累计造成 1000000 点伤害', icon: '💣', type: 'total_damage', target: 1000000, achievementPoints: 120, rewards: { gold: 1200, diamonds: 60 } },
                { id: 'play_time_1h', name: '游戏新手', description: '累计游戏时间 1 小时', icon: '⏱️', type: 'play_time', target: 3600, achievementPoints: 20, rewards: { gold: 200, diamonds: 10 } },
                { id: 'play_time_10h', name: '游戏达人', description: '累计游戏时间 10 小时', icon: '⌛', type: 'play_time', target: 36000, achievementPoints: 80, rewards: { gold: 800, diamonds: 40 } },
                { id: 'revives_10', name: '不屈不挠', description: '累计使用复活 10 次', icon: '💀', type: 'total_revives', target: 10, achievementPoints: 15, rewards: { gold: 150, diamonds: 8 } },
                { id: 'boss_5', name: 'BOSS猎人', description: '累计击败 5 个 BOSS', icon: '👹', type: 'total_bosses', target: 5, achievementPoints: 40, rewards: { gold: 400, diamonds: 20 } },
                { id: 'boss_20', name: 'BOSS终结者', description: '累计击败 20 个 BOSS', icon: '👺', type: 'total_bosses', target: 20, achievementPoints: 100, rewards: { gold: 1000, diamonds: 50 } },
                { id: 'perfect_3', name: '完美通关', description: '达成 3 次完美通关', icon: '🌟', type: 'perfect_levels', target: 3, achievementPoints: 50, rewards: { gold: 500, diamonds: 25 } },
                { id: 'perfect_10', name: '不死战神', description: '达成 10 次完美通关', icon: '⭐', type: 'perfect_levels', target: 10, achievementPoints: 120, rewards: { gold: 1200, diamonds: 60 } },
                { id: 'play_50', name: '游戏迷', description: '累计游戏 50 次', icon: '🎮', type: 'total_plays', target: 50, achievementPoints: 25, rewards: { gold: 250, diamonds: 12 } },
                { id: 'play_200', name: '游戏狂', description: '累计游戏 200 次', icon: '🎯', type: 'total_plays', target: 200, achievementPoints: 80, rewards: { gold: 800, diamonds: 40 } },
                { id: 'deaths_50', name: '屡败屡战', description: '累计死亡 50 次', icon: '💔', type: 'total_deaths', target: 50, achievementPoints: 15, rewards: { gold: 150, diamonds: 8 } },
                { id: 'powerups_100', name: '道具收集者', description: '累计收集 100 个道具', icon: '🎁', type: 'total_powerups', target: 100, achievementPoints: 20, rewards: { gold: 200, diamonds: 10 } },
                { id: 'powerups_500', name: '道具达人', description: '累计收集 500 个道具', icon: '🎊', type: 'total_powerups', target: 500, achievementPoints: 60, rewards: { gold: 600, diamonds: 30 } }
            ];
        }

        getDefaultShopItems() {
            return [
                { id: 'skill_damage', name: '技能强化', description: '技能伤害 +5%（永久生效）', icon: '⚡', price: 100, reward: { type: 'permanent', stat: 'skillDamage', amount: 1, effectText: '技能伤害 +5%' }, limit: 20, category: 'power' },
                { id: 'crit_chance', name: '致命精准', description: '暴击几率 +2%（永久生效）', icon: '🎯', price: 150, reward: { type: 'permanent', stat: 'critChance', amount: 1, effectText: '暴击几率 +2%' }, limit: 25, category: 'power' },
                { id: 'crit_damage', name: '暴击伤害', description: '暴击伤害 +5%（永久生效）', icon: '💥', price: 120, reward: { type: 'permanent', stat: 'critDamage', amount: 1, effectText: '暴击伤害 +5%' }, limit: 30, category: 'power' },
                { id: 'enemy_slow', name: '时间延缓', description: '敌人移动速度 -2%（永久生效）', icon: '⏳', price: 200, reward: { type: 'permanent', stat: 'enemySlow', amount: 1, effectText: '敌人减速 +2%' }, limit: 15, category: 'survival' },
                { id: 'extra_revives', name: '不屈意志', description: '每局额外复活 +1（永久生效）', icon: '💀', price: 500, reward: { type: 'permanent', stat: 'extraRevives', amount: 1, effectText: '额外复活 +1' }, limit: 10, category: 'survival' },
                { id: 'damage_reduction', name: '铁甲护体', description: '受到伤害 -2%（永久生效）', icon: '🛡️', price: 180, reward: { type: 'permanent', stat: 'damageReduction', amount: 1, effectText: '伤害减免 +2%' }, limit: 20, category: 'survival' },
                { id: 'gold_bonus', name: '财富祝福', description: '金币获取 +3%（永久生效）', icon: '💰', price: 100, reward: { type: 'permanent', stat: 'goldBonus', amount: 1, effectText: '金币加成 +3%' }, limit: 30, category: 'resource' },
                { id: 'exp_bonus', name: '经验祝福', description: '经验获取 +3%（永久生效）', icon: '⭐', price: 100, reward: { type: 'permanent', stat: 'expBonus', amount: 1, effectText: '经验加成 +3%' }, limit: 30, category: 'resource' },
                { id: 'bullet_damage', name: '攻击强化', description: '子弹伤害 +2（永久生效）', icon: '🗡️', price: 150, reward: { type: 'permanent', stat: 'bulletDamage', amount: 1, effectText: '子弹伤害 +2' }, limit: 25, category: 'power' },
                { id: 'max_health', name: '生命强化', description: '最大生命值 +10（永久生效）', icon: '❤️', price: 120, reward: { type: 'permanent', stat: 'maxHealth', amount: 1, effectText: '最大生命 +10' }, limit: 30, category: 'survival' },
                { id: 'move_speed', name: '迅捷步法', description: '移动速度 +2%（永久生效）', icon: '👟', price: 100, reward: { type: 'permanent', stat: 'moveSpeed', amount: 1, effectText: '移动速度 +2%' }, limit: 25, category: 'survival' },
                { id: 'attack_speed', name: '疾风之息', description: '攻击速度 +3%（永久生效）', icon: '💨', price: 150, reward: { type: 'permanent', stat: 'attackSpeed', amount: 1, effectText: '攻击速度 +3%' }, limit: 20, category: 'power' },
                { id: 'health_regen', name: '生命回复', description: '每秒回复生命 +1（永久生效）', icon: '💚', price: 200, reward: { type: 'permanent', stat: 'healthRegen', amount: 1, effectText: '每秒回复 +1' }, limit: 15, category: 'survival' },
                { id: 'bullet_pierce', name: '穿透之力', description: '子弹穿透 +1（永久生效）', icon: '🎯', price: 250, reward: { type: 'permanent', stat: 'bulletPierce', amount: 1, effectText: '穿透 +1' }, limit: 10, category: 'power' },
                { id: 'gold_pack_small', name: '小金币包', description: '获得 500 金币', icon: '💰', price: 50, reward: { type: 'gold', amount: 500 }, limit: 99, category: 'instant' },
                { id: 'gold_pack_medium', name: '中金币包', description: '获得 2000 金币', icon: '💎', price: 150, reward: { type: 'gold', amount: 2000 }, limit: 99, category: 'instant' },
                { id: 'gold_pack_large', name: '大金币包', description: '获得 10000 金币', icon: '👑', price: 500, reward: { type: 'gold', amount: 10000 }, limit: 99, category: 'instant' },
                { id: 'random_character', name: '随机角色', description: '随机解锁一个未拥有的角色', icon: '🎭', price: 1000, reward: { type: 'random_character' }, limit: 9, category: 'special' }
            ];
        }

        checkAchievements() {
            const sm = this.saveManager || this.game;
            if (!sm) return;
            
            const stats = sm.getStatistics ? sm.getStatistics() : (sm.saveData?.statistics || {});
            const saveData = sm.saveData || sm;
            
            const newlyUnlocked = [];
            
            for (const achievement of this.achievements) {
                if (sm.isAchievementUnlocked && sm.isAchievementUnlocked(achievement.id)) {
                    continue;
                }
                if (saveData.unlockedAchievements?.includes(achievement.id)) {
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
                        isUnlocked = (sm.getUnlockedCharacters ? sm.getUnlockedCharacters().length : (saveData.unlockedCharacters?.length || 0)) >= achievement.target;
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
                    case 'total_damage':
                        isUnlocked = (stats.totalDamageDealt || 0) >= achievement.target;
                        break;
                    case 'total_powerups':
                        isUnlocked = (stats.totalPowerupsCollected || 0) >= achievement.target;
                        break;
                    case 'total_revives':
                        isUnlocked = (stats.totalRevivesUsed || 0) >= achievement.target;
                        break;
                    case 'play_time':
                        isUnlocked = (stats.totalGameTime || 0) >= achievement.target;
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
                    if (sm.unlockAchievement) {
                        sm.unlockAchievement(achievement.id);
                    } else if (saveData.unlockedAchievements) {
                        saveData.unlockedAchievements.push(achievement.id);
                    }
                    
                    if (sm.addAchievementPoints) {
                        sm.addAchievementPoints(achievement.achievementPoints);
                    } else if (saveData.achievementPoints !== undefined) {
                        saveData.achievementPoints += achievement.achievementPoints;
                    }
                    
                    newlyUnlocked.push(achievement);
                }
            }
            
            if (this.game && this.game.saveGameData) {
                this.game.saveGameData();
            }
            
            if (newlyUnlocked.length > 0 && this.onAchievementUnlocked) {
                newlyUnlocked.forEach((achievement, index) => {
                    setTimeout(() => {
                        this.onAchievementUnlocked(achievement);
                    }, index * 4500);
                });
            }
            
            return newlyUnlocked;
        }

        hasEquippedQuality(quality) {
            const sm = this.saveManager || this.game;
            if (!sm || !sm.saveData?.equipment) return false;
            
            const equipment = sm.saveData.equipment;
            
            for (const slot of Object.values(equipment)) {
                if (slot.equippedItem && slot.equippedItem.quality === quality) {
                    return true;
                }
            }
            return false;
        }

        hasFullEquipment() {
            const sm = this.saveManager || this.game;
            if (!sm || !sm.saveData?.equipment) return false;
            
            const equipment = sm.saveData.equipment;
            
            let equippedCount = 0;
            for (const slot of Object.values(equipment)) {
                if (slot.equippedItem) {
                    equippedCount++;
                }
            }
            return equippedCount >= 4;
        }

        getAchievementProgress(achievement) {
            const sm = this.saveManager || this.game;
            if (!sm) return 0;
            
            const stats = sm.getStatistics ? sm.getStatistics() : (sm.saveData?.statistics || {});
            const saveData = sm.saveData || sm;
            
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
                    return sm.getUnlockedCharacters ? sm.getUnlockedCharacters().length : (saveData.unlockedCharacters?.length || 0);
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
                case 'total_damage':
                    return stats.totalDamageDealt || 0;
                case 'total_powerups':
                    return stats.totalPowerupsCollected || 0;
                case 'total_revives':
                    return stats.totalRevivesUsed || 0;
                case 'play_time':
                    return stats.totalGameTime || 0;
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

        getAchievementById(achievementId) {
            return this.achievements.find(a => a.id === achievementId);
        }

        claimAchievementReward(achievementId) {
            const sm = this.saveManager || this.game;
            if (!sm) return { success: false, message: '系统错误' };
            
            if (sm.isAchievementClaimed && sm.isAchievementClaimed(achievementId)) {
                return { success: false, message: '已领取过奖励' };
            }
            if (sm.saveData?.claimedAchievements?.includes(achievementId)) {
                return { success: false, message: '已领取过奖励' };
            }
            
            const achievement = this.getAchievementById(achievementId);
            if (!achievement) {
                return { success: false, message: '成就不存在' };
            }
            
            if (sm.isAchievementUnlocked && !sm.isAchievementUnlocked(achievementId)) {
                return { success: false, message: '成就未解锁' };
            }
            if (!sm.saveData?.unlockedAchievements?.includes(achievementId)) {
                return { success: false, message: '成就未解锁' };
            }
            
            if (sm.claimAchievementReward) {
                sm.claimAchievementReward(achievementId);
            } else if (sm.saveData?.claimedAchievements) {
                sm.saveData.claimedAchievements.push(achievementId);
            }
            
            if (achievement.rewards) {
                if (achievement.rewards.gold) {
                    if (sm.addGold) {
                        sm.addGold(achievement.rewards.gold);
                    } else if (sm.saveData) {
                        sm.saveData.gold += achievement.rewards.gold;
                    }
                }
                if (achievement.rewards.diamonds) {
                    if (sm.addDiamonds) {
                        sm.addDiamonds(achievement.rewards.diamonds);
                    } else if (sm.saveData) {
                        sm.saveData.diamonds += achievement.rewards.diamonds;
                    }
                }
            }
            
            if (this.game && this.game.saveGameData) {
                this.game.saveGameData();
            }
            
            return {
                success: true,
                message: '奖励领取成功',
                name: achievement.name,
                rewards: achievement.rewards,
                achievementPoints: achievement.achievementPoints
            };
        }

        getAchievementPoints() {
            const sm = this.saveManager || this.game;
            if (!sm) return 0;
            
            if (sm.getAchievementPoints) {
                return sm.getAchievementPoints();
            }
            return sm.saveData?.achievementPoints || 0;
        }

        getSortedAchievements() {
            const achievements = this.getAchievementsWithProgress();
            const sm = this.saveManager || this.game;
            
            return achievements.sort((a, b) => {
                const aUnlocked = sm?.isAchievementUnlocked ? sm.isAchievementUnlocked(a.id) : sm?.saveData?.unlockedAchievements?.includes(a.id);
                const bUnlocked = sm?.isAchievementUnlocked ? sm.isAchievementUnlocked(b.id) : sm?.saveData?.unlockedAchievements?.includes(b.id);
                const aClaimed = sm?.isAchievementClaimed ? sm.isAchievementClaimed(a.id) : sm?.saveData?.claimedAchievements?.includes(a.id);
                const bClaimed = sm?.isAchievementClaimed ? sm.isAchievementClaimed(b.id) : sm?.saveData?.claimedAchievements?.includes(b.id);
                
                const aClaimable = aUnlocked && !aClaimed;
                const bClaimable = bUnlocked && !bClaimed;
                
                if (aClaimable && !bClaimable) return -1;
                if (!aClaimable && bClaimable) return 1;
                
                const aProgress = a.progress / Math.max(a.target, 1);
                const bProgress = b.progress / Math.max(b.target, 1);
                
                return bProgress - aProgress;
            });
        }

        getShopItems() {
            return this.shopItems;
        }

        getShopItemsByCategory(category) {
            if (!category) return this.shopItems;
            return this.shopItems.filter(item => item.category === category);
        }

        exchangeShopItem(itemId) {
            const sm = this.saveManager || this.game;
            if (!sm) return { success: false, message: '系统错误' };
            
            const item = this.shopItems.find(i => i.id === itemId);
            if (!item) {
                return { success: false, message: '商品不存在' };
            }
            
            const currentPoints = this.getAchievementPoints();
            if (currentPoints < item.price) {
                return { success: false, message: '成就点不足' };
            }
            
            const exchangeCount = sm?.getAchievementShopExchangeCount ? 
                sm.getAchievementShopExchangeCount(itemId) : 
                (sm?.saveData?.achievementShopExchangeCount?.[itemId] || 0);
            
            if (exchangeCount >= item.limit) {
                return { success: false, message: '已达到兑换上限' };
            }
            
            if (sm.spendAchievementPoints) {
                sm.spendAchievementPoints(item.price);
            } else if (sm.saveData) {
                sm.saveData.achievementPoints -= item.price;
            }
            
            if (sm.incrementAchievementShopExchangeCount) {
                sm.incrementAchievementShopExchangeCount(itemId);
            } else if (sm.saveData) {
                if (!sm.saveData.achievementShopExchangeCount) {
                    sm.saveData.achievementShopExchangeCount = {};
                }
                sm.saveData.achievementShopExchangeCount[itemId] = (sm.saveData.achievementShopExchangeCount[itemId] || 0) + 1;
            }
            
            if (item.reward) {
                switch (item.reward.type) {
                    case 'permanent':
                        if (sm.addPermanentUpgrade) {
                            sm.addPermanentUpgrade(item.reward.stat, item.reward.amount);
                        } else if (sm.saveData?.permanentUpgrades) {
                            sm.saveData.permanentUpgrades[item.reward.stat] = (sm.saveData.permanentUpgrades[item.reward.stat] || 0) + item.reward.amount;
                        }
                        break;
                    case 'gold':
                        if (sm.addGold) {
                            sm.addGold(item.reward.amount);
                        } else if (sm.saveData) {
                            sm.saveData.gold += item.reward.amount;
                        }
                        break;
                    case 'random_character':
                        return {
                            success: true,
                            message: '随机角色功能需要在游戏中实现',
                            needRandomCharacter: true,
                            item: item
                        };
                }
            }
            
            if (this.game && this.game.saveGameData) {
                this.game.saveGameData();
            }
            
            return {
                success: true,
                message: '兑换成功',
                item: item,
                effectText: item.reward?.effectText || `获得 ${item.name}`
            };
        }

        getShopItemExchangeCount(itemId) {
            const sm = this.saveManager || this.game;
            if (!sm) return 0;
            
            if (sm.getAchievementShopExchangeCount) {
                return sm.getAchievementShopExchangeCount(itemId);
            }
            return sm.saveData?.achievementShopExchangeCount?.[itemId] || 0;
        }

        reset() {
        }

        setOnAchievementUnlocked(callback) {
            this.onAchievementUnlocked = callback;
        }
    }

    if (typeof window !== 'undefined') {
        window.AchievementSystem = AchievementSystem;
    }

})();
