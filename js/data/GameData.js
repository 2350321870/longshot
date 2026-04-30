(function() {
    'use strict';

    const GameData = {
        
        getDefaultSaveData: function() {
            return {
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
        },
        
        characterConfig: {
            default: {
                id: 'default',
                name: '默认勇者',
                icon: '👦',
                color: '#4488ff',
                unlocked: true,
                price: 0,
                stats: { health: 0, damage: 0, speed: 0 },
                description: '初始角色，均衡属性',
                passive: {
                    id: 'beginner_luck',
                    name: '新手运气',
                    description: '每30秒必定触发一次暴击',
                    cooldown: 30,
                    type: 'guaranteed_crit'
                }
            },
            archer: {
                id: 'archer',
                name: '弓箭手',
                icon: '🏹',
                color: '#44cc44',
                unlocked: false,
                price: 500,
                stats: { health: -10, damage: 5, speed: 0.1 },
                description: '高伤害高速度，但血量较低',
                passive: {
                    id: 'precision',
                    name: '精准射击',
                    description: '移动速度的20%转化为暴击伤害',
                    conversionRate: 0.2,
                    type: 'speed_to_crit_damage'
                }
            },
            warrior: {
                id: 'warrior',
                name: '战士',
                icon: '⚔️',
                color: '#ff4444',
                unlocked: false,
                price: 500,
                stats: { health: 30, damage: 0, speed: -0.05 },
                description: '高血量，适合持久战',
                passive: {
                    id: 'toughness',
                    name: '坚韧',
                    description: '每损失20%生命值，获得10%伤害减免',
                    threshold: 0.20,
                    reductionPerThreshold: 0.10,
                    type: 'health_based_reduction'
                }
            },
            mage: {
                id: 'mage',
                name: '法师',
                icon: '🧙',
                color: '#aa44ff',
                unlocked: false,
                price: 800,
                stats: { health: -20, damage: 10, speed: 0.05 },
                description: '最高伤害，但非常脆弱',
                passive: {
                    id: 'arcane_boost',
                    name: '奥术增幅',
                    description: '主动技能伤害+30%，冷却-15%',
                    skillDamageBonus: 0.30,
                    cooldownReduction: 0.15,
                    type: 'skill_enhancement'
                }
            },
            knight: {
                id: 'knight',
                name: '骑士',
                icon: '🛡️',
                color: '#ffaa00',
                unlocked: false,
                price: 800,
                stats: { health: 50, damage: 0, speed: -0.1 },
                description: '坦克角色，血量极高',
                passive: {
                    id: 'shield_wall',
                    name: '盾墙',
                    description: '获得一个可吸收50伤害的护盾，每20秒刷新',
                    shieldAmount: 50,
                    shieldCooldown: 20,
                    type: 'periodic_shield'
                }
            }
        },
        
        levelRewards: {
            3: { type: 'gold', amount: 100, name: '金币x100', icon: '💰' },
            6: { type: 'gold', amount: 200, name: '金币x200', icon: '💰' },
            9: { type: 'gold', amount: 500, name: '金币x500', icon: '👑' }
        },
        
        equipmentConfig: {
            weapon: {
                name: '武器',
                icon: '⚔️',
                basePrice: 100,
                upgradePrice: 80,
                buyDescription: '购买：永久增加基础伤害+5',
                upgradeDescription: '强化：每级伤害+3',
                slot: 'weapon',
                possibleAffixes: ['damage', 'crit_chance', 'crit_damage', 'attack_speed', 'pierce']
            },
            armor: {
                name: '护甲',
                icon: '🛡️',
                basePrice: 100,
                upgradePrice: 80,
                buyDescription: '购买：永久增加最大生命+20',
                upgradeDescription: '强化：每级最大生命+10',
                slot: 'armor',
                possibleAffixes: ['health', 'damage_reduction', 'regen', 'max_health']
            },
            boots: {
                name: '靴子',
                icon: '👟',
                basePrice: 80,
                upgradePrice: 60,
                buyDescription: '购买：永久增加移动速度+10%',
                upgradeDescription: '强化：每级速度+5%',
                slot: 'boots',
                possibleAffixes: ['speed', 'dodge', 'move_speed_attack']
            },
            ring: {
                name: '戒指',
                icon: '💍',
                basePrice: 150,
                upgradePrice: 100,
                buyDescription: '购买：暴击几率+5%',
                upgradeDescription: '强化：每级暴击几率+2%',
                slot: 'ring',
                possibleAffixes: ['crit_chance', 'crit_damage', 'skill_damage', 'cooldown_reduction']
            }
        },
        
        qualityConfig: {
            common: {
                name: '普通',
                color: '#ffffff',
                borderColor: '#aaaaaa',
                affixCount: 0,
                statMultiplier: 1.0,
                dropRate: 0.50
            },
            uncommon: {
                name: '优秀',
                color: '#44ff44',
                borderColor: '#22cc22',
                affixCount: 1,
                statMultiplier: 1.2,
                dropRate: 0.30
            },
            rare: {
                name: '稀有',
                color: '#4488ff',
                borderColor: '#2266cc',
                affixCount: 2,
                statMultiplier: 1.5,
                dropRate: 0.15
            },
            epic: {
                name: '史诗',
                color: '#aa44ff',
                borderColor: '#8822cc',
                affixCount: 3,
                statMultiplier: 2.0,
                dropRate: 0.04
            },
            legendary: {
                name: '传说',
                color: '#ffaa00',
                borderColor: '#cc8800',
                affixCount: 4,
                statMultiplier: 3.0,
                dropRate: 0.01
            }
        },
        
        affixConfig: {
            damage: {
                name: '攻击强化',
                description: '增加攻击伤害',
                stat: 'bulletDamage',
                baseValue: 3,
                valuePerQuality: 1,
                displayFormat: '+{value} 伤害'
            },
            crit_chance: {
                name: '精准',
                description: '增加暴击几率',
                stat: 'critChanceBonus',
                baseValue: 0.03,
                valuePerQuality: 0.015,
                displayFormat: '+{value}% 暴击'
            },
            crit_damage: {
                name: '致命一击',
                description: '增加暴击伤害',
                stat: 'critDamageBonus',
                baseValue: 0.15,
                valuePerQuality: 0.075,
                displayFormat: '+{value}% 暴击伤害'
            },
            attack_speed: {
                name: '急速',
                description: '增加攻击速度',
                stat: 'attackSpeedBonus',
                baseValue: 0.10,
                valuePerQuality: 0.05,
                displayFormat: '+{value}% 攻速'
            },
            pierce: {
                name: '穿透',
                description: '增加子弹穿透数量',
                stat: 'bulletPierceBonus',
                baseValue: 1,
                valuePerQuality: 0,
                displayFormat: '+{value} 穿透'
            },
            health: {
                name: '生命强化',
                description: '增加当前生命值',
                stat: 'currentHealthBonus',
                baseValue: 15,
                valuePerQuality: 8,
                displayFormat: '+{value} 生命'
            },
            max_health: {
                name: '生命上限',
                description: '增加最大生命值',
                stat: 'maxHealth',
                baseValue: 20,
                valuePerQuality: 10,
                displayFormat: '+{value} 最大生命'
            },
            damage_reduction: {
                name: '坚韧',
                description: '减少受到的伤害',
                stat: 'damageReduction',
                baseValue: 0.05,
                valuePerQuality: 0.025,
                displayFormat: '+{value}% 减伤'
            },
            regen: {
                name: '回复',
                description: '每秒恢复生命值',
                stat: 'healthRegen',
                baseValue: 2,
                valuePerQuality: 1,
                displayFormat: '+{value}/秒 回复'
            },
            speed: {
                name: '迅捷',
                description: '增加移动速度',
                stat: 'moveSpeedBonus',
                baseValue: 0.08,
                valuePerQuality: 0.04,
                displayFormat: '+{value}% 移速'
            },
            dodge: {
                name: '闪避',
                description: '有几率完全闪避攻击',
                stat: 'dodgeChance',
                baseValue: 0.05,
                valuePerQuality: 0.025,
                displayFormat: '+{value}% 闪避'
            },
            move_speed_attack: {
                name: '疾风',
                description: '移速转化为攻击伤害',
                stat: 'speedToDamage',
                baseValue: 0.15,
                valuePerQuality: 0.075,
                displayFormat: '+{value}% 移速转伤害'
            },
            skill_damage: {
                name: '奥术增幅',
                description: '增加技能伤害',
                stat: 'skillDamageBonus',
                baseValue: 0.10,
                valuePerQuality: 0.05,
                displayFormat: '+{value}% 技能伤害'
            },
            cooldown_reduction: {
                name: '冷却缩减',
                description: '减少技能冷却时间',
                stat: 'cooldownReduction',
                baseValue: 0.08,
                valuePerQuality: 0.04,
                displayFormat: '+{value}% 冷却缩减'
            }
        },
        
        itemsConfig: [
            { id: 'pistol', name: '手枪', icon: '🔫', rarity: 'common', baseDamage: 5 },
            { id: 'shotgun', name: '霰弹枪', icon: '🔫', rarity: 'uncommon', baseDamage: 8 },
            { id: 'rifle', name: '步枪', icon: '🎯', rarity: 'rare', baseDamage: 12 },
            { id: 'sniper', name: '狙击枪', icon: '🔭', rarity: 'epic', baseDamage: 18 },
            { id: 'cannon', name: '加农炮', icon: '💣', rarity: 'legendary', baseDamage: 25 }
        ],
        
        gachaPool: [
            { id: 'gold_small', name: '少量金币', icon: '💰', desc: '获得50金币', rarity: 'common', weight: 40 },
            { id: 'gold_medium', name: '中型金币', icon: '💰', desc: '获得100金币', rarity: 'uncommon', weight: 25 },
            { id: 'gold_large', name: '大型金币', icon: '💎', desc: '获得300金币', rarity: 'rare', weight: 10 },
            { id: 'health_boost', name: '生命强化', icon: '❤️', desc: '永久+10最大生命', rarity: 'uncommon', weight: 15 },
            { id: 'damage_boost', name: '伤害强化', icon: '💥', desc: '永久+2伤害', rarity: 'uncommon', weight: 15 },
            { id: 'speed_boost', name: '速度强化', icon: '⚡', desc: '永久+5%速度', rarity: 'uncommon', weight: 15 },
            { id: 'legendary_gold', name: '传说金币', icon: '👑', desc: '获得1000金币', rarity: 'legendary', weight: 3 },
            { id: 'level_unlock', name: '关卡解锁', icon: '🔓', desc: '解锁下一关', rarity: 'rare', weight: 5 }
        ],
        
        levelConfigs: {
            1: { enemyCount: 8, enemyHealth: 100, enemySpeed: 0.8, enemyDamage: 5, dropChance: 0.3, segments: 20, chestDropChance: 0.6 },
            2: { enemyCount: 10, enemyHealth: 150, enemySpeed: 0.9, enemyDamage: 6, dropChance: 0.35, segments: 25, chestDropChance: 0.6 },
            3: { enemyCount: 12, enemyHealth: 200, enemySpeed: 1.0, enemyDamage: 8, dropChance: 0.4, segments: 30, unlockAbility: true, chestDropChance: 0.65 },
            4: { enemyCount: 15, enemyHealth: 300, enemySpeed: 1.1, enemyDamage: 10, dropChance: 0.4, segments: 35, chestDropChance: 0.65 },
            5: { enemyCount: 18, enemyHealth: 400, enemySpeed: 1.2, enemyDamage: 12, dropChance: 0.45, segments: 40, chestDropChance: 0.7 },
            6: { enemyCount: 20, enemyHealth: 500, enemySpeed: 1.3, enemyDamage: 15, dropChance: 0.5, segments: 45, unlockAbility: true, chestDropChance: 0.7 },
            7: { enemyCount: 25, enemyHealth: 600, enemySpeed: 1.4, enemyDamage: 18, dropChance: 0.5, segments: 50, chestDropChance: 0.75 },
            8: { enemyCount: 28, enemyHealth: 700, enemySpeed: 1.5, enemyDamage: 22, dropChance: 0.55, segments: 55, chestDropChance: 0.75 },
            9: { enemyCount: 30, enemyHealth: 800, enemySpeed: 1.6, enemyDamage: 26, dropChance: 0.6, segments: 60, unlockAbility: true, chestDropChance: 0.8 }
        },
        
        battleSkills: [
            { id: "bullet_count", name: "多重射击", description: "子弹数量+1，范围+15°", icon: "🎯", rarity: "A" },
            { id: "fire_rate", name: "快速射击", description: "射击速度提升20%", icon: "⚡", rarity: "B" },
            { id: "damage", name: "龙之力", description: "子弹伤害+50%", icon: "💥", rarity: "A" },
            { id: "health", name: "生命恢复", description: "恢复30点生命值", icon: "❤️", rarity: "B" },
            { id: "max_health", name: "生命强化", description: "最大生命值+25", icon: "💗", rarity: "B" },
            { id: "bullet_size", name: "巨型子弹", description: "子弹体积变大", icon: "🔵", rarity: "B" },
            { id: "speed", name: "加速移动", description: "移动速度+15%", icon: "🏃", rarity: "B" },
            { id: "pierce", name: "穿透子弹", description: "子弹可穿透敌人", icon: "🎯", rarity: "A" },
            { id: "crit_chance", name: "暴击专精", description: "暴击几率+10%", icon: "⭐", rarity: "B" },
            { id: "crit_damage", name: "暴击强化", description: "暴击伤害+50%", icon: "💫", rarity: "A" },
            { id: "magnet", name: "磁铁效果", description: "自动吸引道具范围+50", icon: "🧲", rarity: "B" },
            { id: "rain_of_needles", name: "暴雨梨花针", description: "发射针雨攻击龙，击中后爆开", icon: "🗡️", rarity: "A", type: "active", cooldown: 1.0, baseDamage: 20, burstCount: 5, projectileCount: 8, spread: 45 },
            { id: "thunder_dragon", name: "雷龙", description: "召唤雷龙释放闪电链攻击敌人", icon: "⚡", rarity: "A", type: "active", cooldown: 4.0, baseDamage: 30, duration: 6.0, moveSpeed: 180, lightningFrequency: 0.25, chainCount: 5, chainDamageReduction: 0.75 },
            { id: "ice_storm", name: "冰雪", description: "全屏下冰雹雪，减速并伤害龙", icon: "❄️", rarity: "A", type: "active", cooldown: 1.5, baseDamage: 15, slowDuration: 2.0, slowAmount: 0.5, hailRate: 0.3 }
        ],
        
        powerupTypes: [
            { id: "gold", name: "金币", icon: "💰", color: "#FFD700", value: 10 },
            { id: "health_pack", name: "生命包", icon: "💊", color: "#FF6B6B" },
            { id: "damage_boost", name: "伤害提升", icon: "⚔️", color: "#FF4444", duration: 10 },
            { id: "speed_boost", name: "速度提升", icon: "💨", color: "#00CED1", duration: 8 }
        ],
        
        dailyTaskPool: [
            { id: 'kill_10', type: 'kill_enemies', name: '小试牛刀', description: '击败 10 个敌人', target: 10, rewards: { gold: 30, diamonds: 0 } },
            { id: 'kill_20', type: 'kill_enemies', name: '屠龙勇士', description: '击败 20 个敌人', target: 20, rewards: { gold: 50, diamonds: 0 } },
            { id: 'kill_30', type: 'kill_enemies', name: '屠戮者', description: '击败 30 个敌人', target: 30, rewards: { gold: 80, diamonds: 1 } },
            { id: 'kill_50', type: 'kill_enemies', name: '百人斩序曲', description: '击败 50 个敌人', target: 50, rewards: { gold: 120, diamonds: 2 } },
            { id: 'collect_100g', type: 'collect_gold', name: '淘金者', description: '收集 100 金币', target: 100, rewards: { gold: 20, diamonds: 0 } },
            { id: 'collect_200g', type: 'collect_gold', name: '守财奴', description: '收集 200 金币', target: 200, rewards: { gold: 50, diamonds: 1 } },
            { id: 'collect_500g', type: 'collect_gold', name: '小财主', description: '收集 500 金币', target: 500, rewards: { gold: 100, diamonds: 2 } },
            { id: 'complete_1', type: 'complete_levels', name: '通关达人', description: '完成 1 个关卡', target: 1, rewards: { gold: 40, diamonds: 0 } },
            { id: 'complete_3', type: 'complete_levels', name: '连战连胜', description: '完成 3 个关卡', target: 3, rewards: { gold: 100, diamonds: 2 } },
            { id: 'complete_5', type: 'complete_levels', name: '连战连捷', description: '完成 5 个关卡', target: 5, rewards: { gold: 200, diamonds: 3 } },
            { id: 'use_skill_5', type: 'use_skills', name: '技能大师', description: '使用技能 5 次', target: 5, rewards: { gold: 25, diamonds: 0 } },
            { id: 'use_skill_10', type: 'use_skills', name: '法术连击', description: '使用技能 10 次', target: 10, rewards: { gold: 60, diamonds: 1 } },
            { id: 'use_skill_20', type: 'use_skills', name: '技能狂人', description: '使用技能 20 次', target: 20, rewards: { gold: 100, diamonds: 2 } },
            { id: 'open_chest_3', type: 'open_chests', name: '寻宝者', description: '打开 3 个宝箱', target: 3, rewards: { gold: 35, diamonds: 0 } },
            { id: 'open_chest_5', type: 'open_chests', name: '探险家', description: '打开 5 个宝箱', target: 5, rewards: { gold: 70, diamonds: 1 } },
            { id: 'open_chest_10', type: 'open_chests', name: '宝藏猎人', description: '打开 10 个宝箱', target: 10, rewards: { gold: 150, diamonds: 3 } },
            { id: 'collect_300g_single', type: 'collect_gold_single', name: '一掷千金', description: '单局收集 300 金币', target: 300, rewards: { gold: 80, diamonds: 2 } },
            { id: 'kill_15_single', type: 'kill_enemies_single', name: '单局屠杀', description: '单局击败 15 个敌人', target: 15, rewards: { gold: 60, diamonds: 1 } },
            { id: 'complete_level_5', type: 'complete_specific_level', name: '挑战第5关', description: '完成第 5 关', target: 5, rewards: { gold: 150, diamonds: 3 } },
            { id: 'complete_level_10', type: 'complete_specific_level', name: '挑战第10关', description: '完成第 10 关', target: 10, rewards: { gold: 300, diamonds: 5 } }
        ],
        
        achievements: [
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
            { id: 'perfect_3', name: '完美通关', description: '达成 3 次完美通关（不死通关）', icon: '🌟', type: 'perfect_levels', target: 3, achievementPoints: 50, rewards: { gold: 500, diamonds: 25 } },
            { id: 'perfect_10', name: '不死战神', description: '达成 10 次完美通关', icon: '⭐', type: 'perfect_levels', target: 10, achievementPoints: 120, rewards: { gold: 1200, diamonds: 60 } },
            { id: 'play_50', name: '游戏迷', description: '累计游戏 50 次', icon: '🎮', type: 'total_plays', target: 50, achievementPoints: 25, rewards: { gold: 250, diamonds: 12 } },
            { id: 'play_200', name: '游戏狂', description: '累计游戏 200 次', icon: '🎯', type: 'total_plays', target: 200, achievementPoints: 80, rewards: { gold: 800, diamonds: 40 } },
            { id: 'deaths_50', name: '屡败屡战', description: '累计死亡 50 次', icon: '💔', type: 'total_deaths', target: 50, achievementPoints: 15, rewards: { gold: 150, diamonds: 8 } },
            { id: 'powerups_100', name: '道具收集者', description: '累计收集 100 个道具', icon: '🎁', type: 'total_powerups', target: 100, achievementPoints: 20, rewards: { gold: 200, diamonds: 10 } },
            { id: 'powerups_500', name: '道具达人', description: '累计收集 500 个道具', icon: '🎊', type: 'total_powerups', target: 500, achievementPoints: 60, rewards: { gold: 600, diamonds: 30 } }
        ],
        
        get achievementShopItems() {
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
        },
        
        shopItems: [
            { id: 'smallGold', name: '小金币包', icon: '💰', price: 50, description: '获得 100 金币', type: 'gold', amount: 100 },
            { id: 'mediumGold', name: '中金币包', icon: '💎', price: 200, description: '获得 500 金币', type: 'gold', amount: 500 },
            { id: 'largeGold', name: '大金币包', icon: '👑', price: 500, description: '获得 1500 金币', type: 'gold', amount: 1500 },
            { id: 'energy', name: '体力恢复', icon: '⚡', price: 100, description: '恢复 10 点体力', type: 'energy', amount: 10 }
        ],
        
        generateDailyTasks: function() {
            const shuffled = [...this.dailyTaskPool].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, 3);
            
            return {
                date: new Date().toDateString(),
                tasks: selected.map(t => ({
                    ...t,
                    progress: 0,
                    completed: false,
                    claimed: false
                }))
            };
        },
        
        getRandomGachaItem: function() {
            const totalWeight = this.gachaPool.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const item of this.gachaPool) {
                random -= item.weight;
                if (random <= 0) {
                    return item;
                }
            }
            
            return this.gachaPool[0];
        },
        
        getBaseStats: function(permanentUpgrades) {
            const upgrades = permanentUpgrades || {};
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
    };

    if (typeof window !== 'undefined') {
        window.GameData = GameData;
    }

})();
