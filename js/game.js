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
                totalGameTime: 0,
                highestSingleDamage: 0,
                totalBossKills: 0,
                perfectLevels: 0,
                totalPlayCount: 0,
                totalDeaths: 0
            }
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
        };
        
        this.qualityConfig = {
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
        };
        
        this.affixConfig = {
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
            { id: "bullet_count", name: "龙之力", description: "子弹数量+1，范围+15°", icon: "🎯", rarity: "A" },
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
        ];

        this.powerupTypes = [
            { id: "gold", name: "金币", icon: "💰", color: "#FFD700", value: 10 },
            { id: "health_pack", name: "生命包", icon: "💊", color: "#FF6B6B" },
            { id: "damage_boost", name: "伤害提升", icon: "⚔️", color: "#FF4444", duration: 10 },
            { id: "speed_boost", name: "速度提升", icon: "💨", color: "#00CED1", duration: 8 }
        ];
        
        this.dailyTaskPool = [
            {
                id: 'kill_10',
                type: 'kill_enemies',
                name: '小试牛刀',
                description: '击败 10 个敌人',
                target: 10,
                rewards: { gold: 30, diamonds: 0 }
            },
            {
                id: 'kill_20',
                type: 'kill_enemies',
                name: '屠龙勇士',
                description: '击败 20 个敌人',
                target: 20,
                rewards: { gold: 50, diamonds: 0 }
            },
            {
                id: 'kill_30',
                type: 'kill_enemies',
                name: '屠戮者',
                description: '击败 30 个敌人',
                target: 30,
                rewards: { gold: 80, diamonds: 1 }
            },
            {
                id: 'kill_50',
                type: 'kill_enemies',
                name: '百人斩序曲',
                description: '击败 50 个敌人',
                target: 50,
                rewards: { gold: 120, diamonds: 2 }
            },
            {
                id: 'collect_100g',
                type: 'collect_gold',
                name: '淘金者',
                description: '收集 100 金币',
                target: 100,
                rewards: { gold: 20, diamonds: 0 }
            },
            {
                id: 'collect_200g',
                type: 'collect_gold',
                name: '守财奴',
                description: '收集 200 金币',
                target: 200,
                rewards: { gold: 50, diamonds: 1 }
            },
            {
                id: 'collect_500g',
                type: 'collect_gold',
                name: '小财主',
                description: '收集 500 金币',
                target: 500,
                rewards: { gold: 100, diamonds: 2 }
            },
            {
                id: 'complete_1',
                type: 'complete_levels',
                name: '通关达人',
                description: '完成 1 个关卡',
                target: 1,
                rewards: { gold: 40, diamonds: 0 }
            },
            {
                id: 'complete_3',
                type: 'complete_levels',
                name: '连战连胜',
                description: '完成 3 个关卡',
                target: 3,
                rewards: { gold: 100, diamonds: 2 }
            },
            {
                id: 'complete_5',
                type: 'complete_levels',
                name: '连战连捷',
                description: '完成 5 个关卡',
                target: 5,
                rewards: { gold: 200, diamonds: 3 }
            },
            {
                id: 'use_skill_5',
                type: 'use_skills',
                name: '技能大师',
                description: '使用技能 5 次',
                target: 5,
                rewards: { gold: 25, diamonds: 0 }
            },
            {
                id: 'use_skill_10',
                type: 'use_skills',
                name: '法术连击',
                description: '使用技能 10 次',
                target: 10,
                rewards: { gold: 60, diamonds: 1 }
            },
            {
                id: 'use_skill_20',
                type: 'use_skills',
                name: '技能狂人',
                description: '使用技能 20 次',
                target: 20,
                rewards: { gold: 100, diamonds: 2 }
            },
            {
                id: 'open_chest_3',
                type: 'open_chests',
                name: '寻宝者',
                description: '打开 3 个宝箱',
                target: 3,
                rewards: { gold: 35, diamonds: 0 }
            },
            {
                id: 'open_chest_5',
                type: 'open_chests',
                name: '探险家',
                description: '打开 5 个宝箱',
                target: 5,
                rewards: { gold: 70, diamonds: 1 }
            },
            {
                id: 'open_chest_10',
                type: 'open_chests',
                name: '宝藏猎人',
                description: '打开 10 个宝箱',
                target: 10,
                rewards: { gold: 150, diamonds: 3 }
            },
            {
                id: 'collect_300g_single',
                type: 'collect_gold_single',
                name: '一掷千金',
                description: '单局收集 300 金币',
                target: 300,
                rewards: { gold: 80, diamonds: 2 }
            },
            {
                id: 'kill_15_single',
                type: 'kill_enemies_single',
                name: '单局屠杀',
                description: '单局击败 15 个敌人',
                target: 15,
                rewards: { gold: 60, diamonds: 1 }
            },
            {
                id: 'complete_level_5',
                type: 'complete_specific_level',
                name: '挑战第5关',
                description: '完成第 5 关',
                target: 5,
                rewards: { gold: 150, diamonds: 3 }
            },
            {
                id: 'complete_level_10',
                type: 'complete_specific_level',
                name: '挑战第10关',
                description: '完成第 10 关',
                target: 10,
                rewards: { gold: 300, diamonds: 5 }
            }
        ];
        
        this.achievements = [
            {
                id: 'first_clear',
                name: '初出茅庐',
                description: '首次通关任意关卡',
                icon: '🏆',
                type: 'first_clear',
                target: 1,
                achievementPoints: 10,
                rewards: { gold: 100, diamonds: 5 }
            },
            {
                id: 'clear_5',
                name: '渐入佳境',
                description: '通关 5 个关卡',
                icon: '⭐',
                type: 'total_cleared',
                target: 5,
                achievementPoints: 20,
                rewards: { gold: 200, diamonds: 10 }
            },
            {
                id: 'clear_20',
                name: '屠龙大师',
                description: '通关 20 个关卡',
                icon: '👑',
                type: 'total_cleared',
                target: 20,
                achievementPoints: 50,
                rewards: { gold: 500, diamonds: 25 }
            },
            {
                id: 'kill_100',
                name: '百人斩',
                description: '累计击败 100 个敌人',
                icon: '⚔️',
                type: 'total_kills',
                target: 100,
                achievementPoints: 15,
                rewards: { gold: 150, diamonds: 8 }
            },
            {
                id: 'kill_500',
                name: '千人斩',
                description: '累计击败 500 个敌人',
                icon: '🗡️',
                type: 'total_kills',
                target: 500,
                achievementPoints: 40,
                rewards: { gold: 400, diamonds: 20 }
            },
            {
                id: 'gold_1000',
                name: '小富翁',
                description: '累计获得 1000 金币',
                icon: '💰',
                type: 'total_gold',
                target: 1000,
                achievementPoints: 25,
                rewards: { gold: 100, diamonds: 10 }
            },
            {
                id: 'gold_10000',
                name: '大富翁',
                description: '累计获得 10000 金币',
                icon: '💎',
                type: 'total_gold',
                target: 10000,
                achievementPoints: 60,
                rewards: { gold: 1000, diamonds: 50 }
            },
            {
                id: 'unlock_2_chars',
                name: '角色收集者',
                description: '解锁 2 个角色',
                icon: '👥',
                type: 'characters_unlocked',
                target: 2,
                achievementPoints: 30,
                rewards: { gold: 300, diamonds: 15 }
            },
            {
                id: 'unlock_all_chars',
                name: '全角色解锁',
                description: '解锁所有角色',
                icon: '🎭',
                type: 'characters_unlocked',
                target: 5,
                achievementPoints: 100,
                rewards: { gold: 1000, diamonds: 100 }
            },
            {
                id: 'reach_level_10',
                name: '深入险境',
                description: '达到第 10 关',
                icon: '🏰',
                type: 'max_reached_level',
                target: 10,
                achievementPoints: 35,
                rewards: { gold: 350, diamonds: 20 }
            },
            {
                id: 'reach_level_30',
                name: '深渊探索者',
                description: '达到第 30 关',
                icon: '🌑',
                type: 'max_reached_level',
                target: 30,
                achievementPoints: 80,
                rewards: { gold: 800, diamonds: 50 }
            },
            {
                id: 'equip_legendary',
                name: '传说装备',
                description: '装备 1 件传说品质物品',
                icon: '✨',
                type: 'equip_quality',
                target: 'legendary',
                achievementPoints: 50,
                rewards: { gold: 500, diamonds: 30 }
            },
            {
                id: 'full_equip',
                name: '装备大师',
                description: '4 个装备槽全部装备物品',
                icon: '🛡️',
                type: 'full_equipment',
                target: 1,
                achievementPoints: 45,
                rewards: { gold: 450, diamonds: 25 }
            },
            {
                id: 'kill_1000',
                name: '万人斩',
                description: '累计击败 1000 个敌人',
                icon: '⚔️',
                type: 'total_kills',
                target: 1000,
                achievementPoints: 80,
                rewards: { gold: 800, diamonds: 40 }
            },
            {
                id: 'kill_5000',
                name: '战神',
                description: '累计击败 5000 个敌人',
                icon: '🗡️',
                type: 'total_kills',
                target: 5000,
                achievementPoints: 150,
                rewards: { gold: 2000, diamonds: 100 }
            },
            {
                id: 'gold_50000',
                name: '富可敌国',
                description: '累计获得 50000 金币',
                icon: '🏦',
                type: 'total_gold',
                target: 50000,
                achievementPoints: 100,
                rewards: { gold: 5000, diamonds: 100 }
            },
            {
                id: 'skills_100',
                name: '法术学徒',
                description: '累计使用技能 100 次',
                icon: '✨',
                type: 'total_skills',
                target: 100,
                achievementPoints: 20,
                rewards: { gold: 200, diamonds: 10 }
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
        
        this.checkDailyTasksRefresh();
        this.checkAchievements();
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
    
    getTodayString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    checkDailyTasksRefresh() {
        if (!this.dailyTaskPool) return;
        
        const today = this.getTodayString();
        const savedDate = this.saveData.dailyTasks?.date;
        
        if (!savedDate || savedDate !== today) {
            this.generateDailyTasks();
        }
    }
    
    generateDailyTasks() {
        if (!this.dailyTaskPool) return;
        
        const today = this.getTodayString();
        const shuffled = [...this.dailyTaskPool].sort(() => Math.random() - 0.5);
        
        const taskCount = 4 + Math.floor(Math.random() * 2);
        const selectedTasks = shuffled.slice(0, taskCount);
        
        this.saveData.dailyTasks = {
            date: today,
            tasks: selectedTasks.map(task => ({
                ...task,
                progress: 0,
                completed: false,
                claimed: false
            }))
        };
        
        this.saveGameData();
    }
    
    updateTaskProgress(type, amount = 1) {
        if (!this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) return;
        
        let hasUpdates = false;
        
        for (const task of this.saveData.dailyTasks.tasks) {
            if (task.type === type && !task.completed) {
                task.progress = Math.min(task.progress + amount, task.target);
                
                if (task.progress >= task.target) {
                    task.completed = true;
                }
                
                hasUpdates = true;
            }
        }
        
        if (hasUpdates) {
            this.saveGameData();
        }
    }
    
    claimTaskReward(taskId) {
        if (!this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) return false;
        
        const task = this.saveData.dailyTasks.tasks.find(t => t.id === taskId);
        if (!task || !task.completed || task.claimed) return false;
        
        task.claimed = true;
        
        if (task.rewards) {
            if (task.rewards.gold) {
                this.saveData.gold += task.rewards.gold;
            }
            if (task.rewards.diamonds) {
                this.saveData.diamonds += task.rewards.diamonds;
            }
        }
        
        this.saveGameData();
        return true;
    }
    
    getDailyTasks() {
        this.checkDailyTasksRefresh();
        return this.saveData.dailyTasks?.tasks || [];
    }
    
    checkAchievements() {
        if (!this.achievements) return;
        
        if (!this.saveData.achievementProgress) {
            this.saveData.achievementProgress = {};
            this.saveData.unlockedAchievements = [];
            this.saveData.claimedAchievements = [];
            this.saveData.statistics = {
                totalKills: 0,
                totalCleared: 0,
                totalGoldEarned: 0,
                firstClearDate: null
            };
        }
        
        const stats = this.saveData.statistics;
        const newlyUnlocked = [];
        
        for (const achievement of this.achievements) {
            if (this.saveData.unlockedAchievements.includes(achievement.id)) continue;
            
            let isUnlocked = false;
            
            switch (achievement.type) {
                case 'first_clear':
                    isUnlocked = stats.firstClearDate !== null;
                    break;
                case 'total_cleared':
                    isUnlocked = stats.totalCleared >= achievement.target;
                    break;
                case 'total_kills':
                    isUnlocked = stats.totalKills >= achievement.target;
                    break;
                case 'total_gold':
                    isUnlocked = stats.totalGoldEarned >= achievement.target;
                    break;
                case 'characters_unlocked':
                    isUnlocked = (this.saveData.unlockedCharacters?.length || 0) >= achievement.target;
                    break;
                case 'max_reached_level':
                    isUnlocked = (this.saveData.maxUnlockedLevel || 1) >= achievement.target;
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
                this.saveData.unlockedAchievements.push(achievement.id);
                newlyUnlocked.push(achievement);
                
                if (!this.saveData.achievementPoints) {
                    this.saveData.achievementPoints = 0;
                }
                this.saveData.achievementPoints += achievement.achievementPoints;
            }
        }
        
        this.saveGameData();
        
        if (newlyUnlocked.length > 0) {
            newlyUnlocked.forEach((achievement, index) => {
                setTimeout(() => {
                    this.showAchievementNotification(achievement);
                }, index * 4500);
            });
        }
    }
    
    hasEquippedQuality(quality) {
        const equipment = this.saveData.equipment;
        if (!equipment) return false;
        
        for (const slot of Object.values(equipment)) {
            if (slot.equippedItem && slot.equippedItem.quality === quality) {
                return true;
            }
        }
        return false;
    }
    
    hasFullEquipment() {
        const equipment = this.saveData.equipment;
        if (!equipment) return false;
        
        let equippedCount = 0;
        for (const slot of Object.values(equipment)) {
            if (slot.equippedItem) {
                equippedCount++;
            }
        }
        return equippedCount >= 4;
    }
    
    updateStatistics(type, amount = 1) {
        if (!this.saveData.statistics) {
            this.saveData.statistics = {
                totalKills: 0,
                totalCleared: 0,
                totalGoldEarned: 0,
                firstClearDate: null
            };
        }
        
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
            case 'play_game':
                stats.totalPlayCount += amount;
                break;
            case 'death':
                stats.totalDeaths += amount;
                break;
        }
        
        this.saveGameData();
        this.checkAchievements();
    }
    
    claimAchievementReward(achievementId) {
        if (!this.saveData.claimedAchievements) {
            this.saveData.claimedAchievements = [];
        }
        
        if (this.saveData.claimedAchievements.includes(achievementId)) return false;
        if (!this.saveData.unlockedAchievements?.includes(achievementId)) return false;
        
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return false;
        
        this.saveData.claimedAchievements.push(achievementId);
        
        if (achievement.rewards) {
            if (achievement.rewards.gold) {
                this.saveData.gold += achievement.rewards.gold;
            }
            if (achievement.rewards.diamonds) {
                this.saveData.diamonds += achievement.rewards.diamonds;
            }
        }
        
        this.saveGameData();
        return true;
    }
    
    getAchievementsWithProgress() {
        if (!this.saveData.achievementProgress) {
            this.saveData.achievementProgress = {};
            this.saveData.unlockedAchievements = [];
            this.saveData.claimedAchievements = [];
        }
        
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.saveData.unlockedAchievements.includes(achievement.id),
            claimed: this.saveData.claimedAchievements.includes(achievement.id),
            progress: this.getAchievementProgress(achievement)
        }));
    }
    
    getAchievementProgress(achievement) {
        const stats = this.saveData.statistics || {};
        
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
                return this.saveData.unlockedCharacters?.length || 0;
            case 'max_reached_level':
                return this.saveData.maxUnlockedLevel || 1;
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
        
        this.skillLevels = {};
        this.skillCooldowns = {};
        this.activeSkills = [];
        
        this.needles = [];
        this.thunderDragon = null;
        this.thunderDragonTimer = 0;
        this.hailStones = [];
        this.iceStormActive = false;
        this.iceStormTimer = 0;
        this.slowEffects = [];
        
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.comboSystem = {
            currentCombo: 0,
            maxCombo: 0,
            comboTimer: 0,
            comboTimeout: 2.0,
            comboMultiplier: 1.0,
            killsInCombo: 0
        };
        this.bulletTrails = [];
        this.glowEffects = [];
        this.floatingTexts = [];
        this.deathExplosions = [];
        
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
            bulletPierce: 0 + (baseStats.bulletPierceBonus || 0),
            criticalChance: 0.05 + baseStats.critChanceBonus,
            criticalDamage: 1.5 + (baseStats.critDamageBonus || 0),
            bulletBounce: 0,
            magnetRange: 50,
            attackSpeedBonus: baseStats.attackSpeedBonus || 0,
            damageReduction: baseStats.damageReduction || 0,
            healthRegen: baseStats.healthRegen || 0,
            dodgeChance: baseStats.dodgeChance || 0,
            speedToDamage: baseStats.speedToDamage || 0,
            skillDamageBonus: baseStats.skillDamageBonus || 0,
            cooldownReduction: baseStats.cooldownReduction || 0
        };
        
        this.unlockedSkills = [];
        this.activeBuffs = [];
        
        this.targetPosition = null;
        this.isMoving = false;
        
        this.path = [];
        this.pathBoundaries = {
            leftBound: 0,
            rightBound: 0,
            channelLines: []
        };
    }
    
    generatePath() {
        const cfg = window.GameConfig || {};
        const levelCfg = cfg.level || {};
        
        const channelCount = levelCfg.channelCount || 5;
        const channelHeight = levelCfg.channelHeight || 120;
        const leftPadding = levelCfg.leftPadding || 50;
        const rightPadding = levelCfg.rightPadding || 50;
        const topPadding = levelCfg.topPadding || 80;
        const turnRadius = levelCfg.turnRadius || 40;
        
        const path = [];
        const leftBound = leftPadding;
        const rightBound = this.width - rightPadding;
        
        this.pathBoundaries = {
            leftBound: leftBound,
            rightBound: rightBound,
            channelLines: [],
            channels: []
        };
        
        for (let i = 0; i < channelCount; i++) {
            const isRightToLeft = i % 2 === 0;
            const rowY = topPadding + i * channelHeight;
            
            this.pathBoundaries.channels.push({
                rowY: rowY,
                isEvenRow: !isRightToLeft
            });
            
            if (i > 0) {
                this.pathBoundaries.channelLines.push(rowY);
            }
            
            if (i === 0) {
                path.push({ x: rightBound, y: -50, distance: 0 });
                path.push({ x: rightBound, y: rowY, distance: 50 });
            }
            
            const prevPoint = path[path.length - 1];
            const baseDistance = prevPoint ? prevPoint.distance : 0;
            
            if (isRightToLeft) {
                if (i > 0) {
                    const startX = rightBound;
                    const startY = rowY;
                    const dist = baseDistance;
                    path.push({ x: startX, y: startY, distance: dist });
                }
                
                const endX = leftBound;
                const endY = rowY;
                const segmentLength = Math.abs(endX - (path[path.length - 1].x));
                path.push({ x: endX, y: endY, distance: path[path.length - 1].distance + segmentLength });
            } else {
                if (i > 0) {
                    const startX = leftBound;
                    const startY = rowY;
                    const dist = baseDistance;
                    path.push({ x: startX, y: startY, distance: dist });
                }
                
                const endX = rightBound;
                const endY = rowY;
                const segmentLength = Math.abs(endX - (path[path.length - 1].x));
                path.push({ x: endX, y: endY, distance: path[path.length - 1].distance + segmentLength });
            }
            
            if (i < channelCount - 1) {
                const nextRowY = rowY + channelHeight;
                const pointsInTurn = 12;
                const arcLength = (Math.PI * turnRadius) / 2;
                const stepDistance = arcLength / pointsInTurn;
                
                const lastPoint = path[path.length - 1];
                let currentDist = lastPoint.distance;
                
                if (isRightToLeft) {
                    for (let j = 1; j <= pointsInTurn; j++) {
                        const angle = (Math.PI / pointsInTurn) * j;
                        const x = leftBound + turnRadius * Math.sin(angle);
                        const y = rowY + turnRadius * (1 - Math.cos(angle));
                        currentDist += stepDistance;
                        path.push({ x, y, distance: currentDist });
                    }
                } else {
                    for (let j = 1; j <= pointsInTurn; j++) {
                        const angle = (Math.PI / pointsInTurn) * j;
                        const x = rightBound - turnRadius * Math.sin(angle);
                        const y = rowY + turnRadius * (1 - Math.cos(angle));
                        currentDist += stepDistance;
                        path.push({ x, y, distance: currentDist });
                    }
                }
            }
        }
        
        let totalDist = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i-1].x;
            const dy = path[i].y - path[i-1].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            totalDist += dist;
            path[i].distance = totalDist;
        }
        
        this.totalPathLength = totalDist;
        
        return path;
    }
    
    getPointAtDistance(distance) {
        if (!this.path || this.path.length < 2) return null;
        
        if (distance < 0) return null;
        
        if (distance >= this.totalPathLength) {
            const lastPoint = this.path[this.path.length - 1];
            return { x: lastPoint.x, y: lastPoint.y, isEnd: true };
        }
        
        for (let i = 1; i < this.path.length; i++) {
            const prevPoint = this.path[i - 1];
            const currPoint = this.path[i];
            
            if (distance >= prevPoint.distance && distance <= currPoint.distance) {
                const segmentDist = currPoint.distance - prevPoint.distance;
                if (segmentDist <= 0) return { x: currPoint.x, y: currPoint.y };
                
                const ratio = (distance - prevPoint.distance) / segmentDist;
                return {
                    x: prevPoint.x + (currPoint.x - prevPoint.x) * ratio,
                    y: prevPoint.y + (currPoint.y - prevPoint.y) * ratio
                };
            }
        }
        
        return null;
    }
    
    getBaseStats() {
        let stats = {
            bulletDamage: 0,
            maxHealth: 0,
            moveSpeedBonus: 0,
            critChanceBonus: 0,
            critDamageBonus: 0,
            attackSpeedBonus: 0,
            bulletPierceBonus: 0,
            damageReduction: 0,
            healthRegen: 0,
            dodgeChance: 0,
            speedToDamage: 0,
            skillDamageBonus: 0,
            cooldownReduction: 0
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
        
        const equipStats = this.getTotalEquipStats();
        for (const [key, value] of Object.entries(equipStats)) {
            if (stats[key] !== undefined) {
                stats[key] += value;
            }
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
        document.getElementById('reviveBtn').addEventListener('click', () => this.revive());
        document.getElementById('cancelReviveBtn').addEventListener('click', () => this.cancelRevive());
        
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
        
        document.querySelectorAll('.achievement-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                this.renderAchievementsTab(filter);
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
        document.getElementById('tasksTab').classList.toggle('hidden', tab !== 'tasks');
        document.getElementById('achievementsTab').classList.toggle('hidden', tab !== 'achievements');
        
        if (tab === 'battle') {
            this.renderBattleTab();
        } else if (tab === 'character') {
            this.renderCharacterTab();
        } else if (tab === 'shop') {
            this.renderShopTab();
        } else if (tab === 'equipment') {
            this.renderEquipmentTab();
        } else if (tab === 'tasks') {
            this.renderTasksTab();
        } else if (tab === 'achievements') {
            this.renderAchievementsTab();
        }
    }
    
    renderBattleTab() {
        this.renderLevelGrid();
        this.renderLevelRewards();
    }
    
    renderTasksTab() {
        const list = document.getElementById('tasksList');
        list.innerHTML = '';
        
        this.checkDailyTasksRefresh();
        
        this.syncSpecificLevelTaskProgress();
        
        const dailyTasks = this.saveData.dailyTasks?.tasks || [];
        if (dailyTasks.length === 0) {
            list.innerHTML = '<div style="color: #aaa; text-align: center; padding: 40px;">暂无每日任务</div>';
            return;
        }
        
        dailyTasks.forEach(task => {
            const isCompleted = task.progress >= task.target;
            const isClaimed = task.claimed === true;
            const progress = Math.min(task.progress, task.target);
            const progressPercent = (progress / task.target) * 100;
            
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`;
            
            let rewardsHtml = '';
            if (task.rewards.gold > 0) {
                rewardsHtml += `💰${task.rewards.gold}`;
            }
            if (task.rewards.diamonds > 0) {
                if (rewardsHtml) rewardsHtml += ' ';
                rewardsHtml += `💎${task.rewards.diamonds}`;
            }
            
            let actionHtml = '';
            if (isClaimed) {
                actionHtml = '<div class="task-claimed-text">✓ 已领取</div>';
            } else if (isCompleted) {
                actionHtml = `<button class="task-claim-btn" data-task-id="${task.id}">领取奖励</button>`;
            } else {
                actionHtml = `<div class="task-progress-text ${isCompleted ? 'completed' : ''}">${progress}/${task.target}</div>`;
            }
            
            taskItem.innerHTML = `
                <div class="task-header">
                    <div class="task-name">${task.name}</div>
                    <div class="task-rewards">${rewardsHtml}</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-progress-container">
                    <div class="task-progress-bar">
                        <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    ${actionHtml}
                </div>
            `;
            
            list.appendChild(taskItem);
        });
        
        list.querySelectorAll('.task-claim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.taskId;
                this.claimTaskReward(taskId);
            });
        });
        
        this.updateTasksRefreshTime();
    }
    
    updateTasksRefreshTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timeEl = document.getElementById('tasksRefreshTime');
        if (timeEl) {
            timeEl.textContent = `刷新时间: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    claimTaskReward(taskId) {
        if (!this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) {
            this.showToast('任务数据错误！');
            return;
        }
        
        const task = this.saveData.dailyTasks.tasks.find(t => t.id === taskId);
        if (!task) {
            this.showToast('任务不存在！');
            return;
        }
        
        if (task.progress < task.target) {
            this.showToast('任务未完成！');
            return;
        }
        
        if (task.claimed) {
            this.showToast('奖励已领取！');
            return;
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
        
        this.saveGameData();
        this.renderTasksTab();
        this.showToast(`领取成功！${task.rewards.gold ? `💰${task.rewards.gold}` : ''} ${task.rewards.diamonds ? `💎${task.rewards.diamonds}` : ''}`);
    }
    
    renderAchievementsTab(filter = 'all') {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '';
        
        if (filter === 'stats') {
            this.renderStatisticsTab(list);
            return;
        }
        
        const achievements = this.getAchievementsWithProgress();
        
        let filteredAchievements = achievements;
        if (filter === 'unlocked') {
            filteredAchievements = achievements.filter(a => a.unlocked);
        } else if (filter === 'locked') {
            filteredAchievements = achievements.filter(a => !a.unlocked);
        }
        
        const totalPoints = this.saveData.achievementPoints || 0;
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        
        document.getElementById('totalAchievementPoints').textContent = totalPoints;
        document.getElementById('unlockedAchievements').textContent = unlockedCount;
        document.getElementById('totalAchievements').textContent = achievements.length;
        
        if (filteredAchievements.length === 0) {
            list.innerHTML = '<div style="color: #aaa; text-align: center; padding: 40px;">暂无成就</div>';
            return;
        }
        
        filteredAchievements.forEach(achievement => {
            const isClaimed = achievement.claimed;
            const progress = achievement.progress;
            const target = achievement.target;
            const progressPercent = Math.min(100, (progress / target) * 100);
            
            const achievementItem = document.createElement('div');
            achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            let rewardsHtml = '';
            if (achievement.rewards.gold) {
                rewardsHtml += `💰${achievement.rewards.gold}`;
            }
            if (achievement.rewards.diamonds) {
                if (rewardsHtml) rewardsHtml += ' ';
                rewardsHtml += `💎${achievement.rewards.diamonds}`;
            }
            
            let actionHtml = '';
            if (achievement.unlocked && isClaimed) {
                actionHtml = '<div class="achievement-claimed-text">✓ 已领取</div>';
            } else if (achievement.unlocked) {
                actionHtml = `<button class="achievement-claim-btn" data-achievement-id="${achievement.id}">领取奖励</button>`;
            } else {
                actionHtml = `<div class="achievement-progress-text">进度: ${progress}/${target}</div>`;
            }
            
            achievementItem.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${!achievement.unlocked ? `
                        <div class="task-progress-container" style="margin-top: 8px;">
                            <div class="task-progress-bar">
                                <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="achievement-footer">
                        <div>
                            <span class="achievement-points-text">🏆 ${achievement.achievementPoints} 成就点</span>
                            ${rewardsHtml ? `<span class="achievement-rewards"> | ${rewardsHtml}</span>` : ''}
                        </div>
                        ${actionHtml}
                    </div>
                </div>
            `;
            
            list.appendChild(achievementItem);
        });
        
        list.querySelectorAll('.achievement-claim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const achievementId = btn.dataset.achievementId;
                this.claimAchievementReward(achievementId);
            });
        });
        
        document.querySelectorAll('.achievement-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
    }
    
    renderStatisticsTab(list) {
        const stats = this.saveData.statistics || {};
        const achievements = this.getAchievementsWithProgress();
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const totalPoints = this.saveData.achievementPoints || 0;
        
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num || 0;
        };
        
        const formatTime = (seconds) => {
            if (!seconds) return '0 分钟';
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                return `${hours} 小时 ${minutes % 60} 分钟`;
            }
            return `${minutes} 分钟`;
        };
        
        list.innerHTML = `
            <div class="stats-header">
                <div class="stats-title">📊 游戏统计</div>
                <div class="stats-summary">
                    <div class="summary-item">
                        <div class="summary-value">${totalPoints}</div>
                        <div class="summary-label">总成就点</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${unlockedCount}/${achievements.length}</div>
                        <div class="summary-label">成就解锁</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <div class="stats-section-title">🎮 战斗统计</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⚔️</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalKills)}</div>
                            <div class="stat-label">总击杀数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalCleared)}</div>
                            <div class="stat-label">通关次数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💥</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalDamageDealt)}</div>
                            <div class="stat-label">总输出伤害</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.highestSingleDamage)}</div>
                            <div class="stat-label">最高单次伤害</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🛡️</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalDamageTaken)}</div>
                            <div class="stat-label">总承受伤害</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👑</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalBossKills)}</div>
                            <div class="stat-label">Boss 击杀</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <div class="stats-section-title">🎯 活动统计</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">✨</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalSkillsUsed)}</div>
                            <div class="stat-label">技能使用次数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalChestsOpened)}</div>
                            <div class="stat-label">宝箱开启</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💎</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalPowerupsCollected)}</div>
                            <div class="stat-label">道具收集</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalGoldEarned)}</div>
                            <div class="stat-label">总获得金币</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.perfectLevels)}</div>
                            <div class="stat-label">完美通关</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <div class="stats-section-title">📈 游戏统计</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🎮</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalPlayCount)}</div>
                            <div class="stat-label">游戏次数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatTime(stats.totalGameTime)}</div>
                            <div class="stat-label">游戏时长</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💀</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalDeaths)}</div>
                            <div class="stat-label">死亡次数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔄</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatNumber(stats.totalRevivesUsed)}</div>
                            <div class="stat-label">复活次数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🚀</div>
                        <div class="stat-info">
                            <div class="stat-value">第 ${this.saveData.maxUnlockedLevel || 1} 关</div>
                            <div class="stat-label">最高到达关卡</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.achievement-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'stats');
        });
    }
    
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        if (!notification) return;
        
        document.getElementById('achievementNotifIcon').textContent = achievement.icon;
        document.getElementById('achievementNotifName').textContent = achievement.name;
        document.getElementById('achievementNotifPoints').textContent = `+${achievement.achievementPoints} 成就点`;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    renderCharacterTab() {
        const grid = document.getElementById('characterGrid');
        grid.innerHTML = '';
        
        if (!this.saveData.unlockedCharacters) {
            this.saveData.unlockedCharacters = ['default'];
        }
        if (!this.saveData.selectedCharacter) {
            this.saveData.selectedCharacter = 'default';
        }
        
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
            
            let passiveHtml = '';
            if (config.passive) {
                passiveHtml = `
                    <div class="character-passive">
                        <div class="passive-title">🎯 ${config.passive.name}</div>
                        <div class="passive-desc">${config.passive.description}</div>
                    </div>
                `;
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
                ${passiveHtml}
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
    
    getCharacterPassive() {
        const charId = this.saveData.selectedCharacter || 'default';
        return this.characterConfig[charId]?.passive || null;
    }
    
    getRandomQuality(levelBonus = 0) {
        const rand = Math.random() - levelBonus * 0.02;
        
        if (rand <= this.qualityConfig.legendary.dropRate) return 'legendary';
        if (rand <= this.qualityConfig.legendary.dropRate + this.qualityConfig.epic.dropRate) return 'epic';
        if (rand <= this.qualityConfig.legendary.dropRate + this.qualityConfig.epic.dropRate + this.qualityConfig.rare.dropRate) return 'rare';
        if (rand <= this.qualityConfig.legendary.dropRate + this.qualityConfig.epic.dropRate + this.qualityConfig.rare.dropRate + this.qualityConfig.uncommon.dropRate) return 'uncommon';
        return 'common';
    }
    
    generateAffixValue(affixId, quality) {
        const affix = this.affixConfig[affixId];
        const qualityConfig = this.qualityConfig[quality];
        if (!affix || !qualityConfig) return 0;
        
        const qualityIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(quality);
        const value = affix.baseValue + affix.valuePerQuality * qualityIndex;
        const variance = 0.8 + Math.random() * 0.4;
        
        return value * qualityConfig.statMultiplier * variance;
    }
    
    formatAffixValue(affixId, value) {
        const affix = this.affixConfig[affixId];
        if (!affix) return '';
        
        let displayValue;
        if (affix.stat === 'critChanceBonus' || affix.stat === 'critDamageBonus' || 
            affix.stat === 'attackSpeedBonus' || affix.stat === 'moveSpeedBonus' ||
            affix.stat === 'damageReduction' || affix.stat === 'dodgeChance' ||
            affix.stat === 'speedToDamage' || affix.stat === 'skillDamageBonus' ||
            affix.stat === 'cooldownReduction') {
            displayValue = Math.round(value * 100);
        } else {
            displayValue = Math.round(value);
        }
        
        return affix.displayFormat.replace('{value}', displayValue);
    }
    
    generateAffixes(slot, quality, count) {
        const equipConfig = this.equipmentConfig[slot];
        if (!equipConfig || count <= 0) return [];
        
        const possibleAffixes = [...equipConfig.possibleAffixes];
        const selectedAffixes = [];
        
        for (let i = 0; i < count && possibleAffixes.length > 0; i++) {
            const index = Math.floor(Math.random() * possibleAffixes.length);
            const affixId = possibleAffixes.splice(index, 1)[0];
            const value = this.generateAffixValue(affixId, quality);
            
            selectedAffixes.push({
                id: affixId,
                value: value,
                display: this.formatAffixValue(affixId, value)
            });
        }
        
        return selectedAffixes;
    }
    
    generateRandomEquipment(slot, levelBonus = 0) {
        const quality = this.getRandomQuality(levelBonus);
        const qualityConfig = this.qualityConfig[quality];
        const equipConfig = this.equipmentConfig[slot];
        
        if (!equipConfig) return null;
        
        const affixes = this.generateAffixes(slot, quality, qualityConfig.affixCount);
        
        return {
            id: `equip_${slot}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            slot: slot,
            quality: quality,
            name: this.generateEquipmentName(slot, quality),
            icon: equipConfig.icon,
            affixes: affixes,
            baseStats: this.generateBaseStats(slot, quality),
            level: 0,
            equipped: false
        };
    }
    
    generateEquipmentName(slot, quality) {
        const equipConfig = this.equipmentConfig[slot];
        const qualityConfig = this.qualityConfig[quality];
        
        const prefixes = {
            common: ['破旧', '普通'],
            uncommon: ['精良', '优质'],
            rare: ['华丽', '稀有'],
            epic: ['史诗', '传说'],
            legendary: ['神话', '至尊']
        };
        
        const suffixes = {
            common: [''],
            uncommon: [''],
            rare: ['之力', '之护', '之迅捷'],
            epic: ['大师', '宗师'],
            legendary: ['永恒', '不朽', '混沌']
        };
        
        const prefix = prefixes[quality]?.[Math.floor(Math.random() * prefixes[quality].length)] || '';
        const suffix = suffixes[quality]?.[Math.floor(Math.random() * suffixes[quality].length)] || '';
        
        if (quality === 'common' || quality === 'uncommon') {
            return `${prefix}${equipConfig.name}`;
        }
        return `${prefix}${equipConfig.name}${suffix}`;
    }
    
    generateBaseStats(slot, quality) {
        const qualityConfig = this.qualityConfig[quality];
        const multiplier = qualityConfig.statMultiplier;
        
        const baseStatsBySlot = {
            weapon: { bulletDamage: Math.floor(5 * multiplier) },
            armor: { maxHealth: Math.floor(20 * multiplier) },
            boots: { moveSpeedBonus: 0.10 * multiplier },
            ring: { critChanceBonus: 0.05 * multiplier }
        };
        
        return baseStatsBySlot[slot] || {};
    }
    
    getAffixTotalValue(stat) {
        let total = 0;
        
        for (const [slot, equip] of Object.entries(this.saveData.equipment)) {
            if (equip.owned && equip.equippedItem) {
                for (const affix of equip.equippedItem.affixes) {
                    const affixConfig = this.affixConfig[affix.id];
                    if (affixConfig && affixConfig.stat === stat) {
                        total += affix.value;
                    }
                }
                if (equip.equippedItem.baseStats) {
                    for (const [key, value] of Object.entries(equip.equippedItem.baseStats)) {
                        if (key === stat) {
                            total += value;
                        }
                    }
                }
            }
        }
        
        return total;
    }
    
    addEquipmentToInventory(equip) {
        if (!this.saveData.inventory) {
            this.saveData.inventory = [];
        }
        
        this.saveData.inventory.push(equip);
        this.saveGameData();
    }
    
    equipItem(equipId) {
        if (!this.saveData.inventory) return false;
        
        const equipIndex = this.saveData.inventory.findIndex(e => e.id === equipId);
        if (equipIndex === -1) return false;
        
        const equip = this.saveData.inventory[equipIndex];
        const slot = equip.slot;
        
        const slotData = this.saveData.equipment[slot];
        if (slotData && slotData.equippedItem) {
            this.saveData.inventory.push(slotData.equippedItem);
        }
        
        slotData.equippedItem = equip;
        this.saveData.inventory.splice(equipIndex, 1);
        slotData.equippedItem.equipped = true;
        
        this.saveGameData();
        return true;
    }
    
    unequipItem(slot) {
        const slotData = this.saveData.equipment[slot];
        if (!slotData || !slotData.equippedItem) return false;
        
        if (!this.saveData.inventory) {
            this.saveData.inventory = [];
        }
        
        slotData.equippedItem.equipped = false;
        this.saveData.inventory.push(slotData.equippedItem);
        slotData.equippedItem = null;
        
        this.saveGameData();
        return true;
    }
    
    getTotalEquipStats() {
        let stats = {
            bulletDamage: 0,
            maxHealth: 0,
            moveSpeedBonus: 0,
            critChanceBonus: 0,
            critDamageBonus: 0,
            attackSpeedBonus: 0,
            bulletPierceBonus: 0,
            currentHealthBonus: 0,
            damageReduction: 0,
            healthRegen: 0,
            dodgeChance: 0,
            speedToDamage: 0,
            skillDamageBonus: 0,
            cooldownReduction: 0
        };
        
        for (const [slot, equip] of Object.entries(this.saveData.equipment)) {
            if (equip.owned && equip.equippedItem) {
                const item = equip.equippedItem;
                
                for (const [key, value] of Object.entries(item.baseStats || {})) {
                    if (stats[key] !== undefined) {
                        stats[key] += value;
                    }
                }
                
                for (const affix of item.affixes) {
                    const affixConfig = this.affixConfig[affix.id];
                    if (affixConfig && stats[affixConfig.stat] !== undefined) {
                        stats[affixConfig.stat] += affix.value;
                    }
                }
            }
        }
        
        return stats;
    }
    
    initCharacterPassive() {
        this.characterPassiveState = {};
        const passive = this.getCharacterPassive();
        if (!passive) return;
        
        const now = Date.now() / 1000;
        
        switch (passive.type) {
            case 'guaranteed_crit':
                this.characterPassiveState = {
                    lastGuaranteedCritTime: now,
                    guaranteedCritReady: false
                };
                break;
            case 'periodic_shield':
                this.characterPassiveState = {
                    lastShieldTime: now,
                    shieldAmount: passive.shieldAmount,
                    currentShield: passive.shieldAmount
                };
                break;
            case 'speed_to_crit_damage':
                this.characterPassiveState = {
                    conversionRate: passive.conversionRate
                };
                break;
            case 'health_based_reduction':
                this.characterPassiveState = {
                    threshold: passive.threshold,
                    reductionPerThreshold: passive.reductionPerThreshold
                };
                break;
            case 'skill_enhancement':
                this.characterPassiveState = {
                    skillDamageBonus: passive.skillDamageBonus,
                    cooldownReduction: passive.cooldownReduction
                };
                break;
        }
    }
    
    applyCharacterPassiveToCrit(isCrit) {
        const passive = this.getCharacterPassive();
        if (!passive || passive.type !== 'guaranteed_crit') return isCrit;
        
        const now = Date.now() / 1000;
        if (!this.characterPassiveState) return isCrit;
        
        const elapsed = now - this.characterPassiveState.lastGuaranteedCritTime;
        if (elapsed >= passive.cooldown || this.characterPassiveState.guaranteedCritReady) {
            this.characterPassiveState.lastGuaranteedCritTime = now;
            this.characterPassiveState.guaranteedCritReady = false;
            return true;
        }
        
        return isCrit;
    }
    
    getCritDamageBonusFromPassive() {
        const passive = this.getCharacterPassive();
        if (!passive || passive.type !== 'speed_to_crit_damage') return 0;
        
        const conversionRate = this.characterPassiveState?.conversionRate || 0.2;
        const speedBonus = (this.playerStats.speed / 5 - 1);
        return speedBonus * conversionRate;
    }
    
    getDamageReductionFromPassive() {
        const passive = this.getCharacterPassive();
        if (!passive || passive.type !== 'health_based_reduction') return 0;
        
        const threshold = this.characterPassiveState?.threshold || 0.20;
        const reductionPerThreshold = this.characterPassiveState?.reductionPerThreshold || 0.10;
        
        const healthPercent = this.playerStats.health / this.playerStats.maxHealth;
        const healthLost = 1 - healthPercent;
        const thresholdsPassed = Math.floor(healthLost / threshold);
        
        return thresholdsPassed * reductionPerThreshold;
    }
    
    getSkillDamageBonusFromPassive() {
        const passive = this.getCharacterPassive();
        let bonus = 0;
        
        if (passive && passive.type === 'skill_enhancement') {
            bonus += this.characterPassiveState?.skillDamageBonus || 0;
        }
        
        if (this.playerStats && this.playerStats.skillDamageBonus) {
            bonus += this.playerStats.skillDamageBonus;
        }
        
        return bonus;
    }
    
    getCooldownReductionFromPassive() {
        let reduction = 0;
        
        const passive = this.getCharacterPassive();
        if (passive && passive.type === 'skill_enhancement') {
            reduction += this.characterPassiveState?.cooldownReduction || 0;
        }
        
        if (this.playerStats && this.playerStats.cooldownReduction) {
            reduction += this.playerStats.cooldownReduction;
        }
        
        return Math.min(0.5, reduction);
    }
    
    takeDamageWithPassive(amount) {
        const dodgeChance = this.playerStats.dodgeChance || 0;
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
            this.createHitParticles(this.player.x, this.player.y, '#00FFFF');
            return;
        }
        
        const passive = this.getCharacterPassive();
        
        if (passive && passive.type === 'periodic_shield' && this.characterPassiveState) {
            const shield = this.characterPassiveState.currentShield || 0;
            if (shield > 0) {
                const absorbed = Math.min(shield, amount);
                this.characterPassiveState.currentShield -= absorbed;
                amount -= absorbed;
                
                if (amount <= 0) {
                    this.createHitParticles(this.player.x, this.player.y, '#00FFFF');
                    return;
                }
            }
        }
        
        const passiveReduction = this.getDamageReductionFromPassive();
        const equipReduction = this.playerStats.damageReduction || 0;
        const totalReduction = Math.min(0.9, passiveReduction + equipReduction);
        
        if (totalReduction > 0) {
            amount = Math.max(1, Math.floor(amount * (1 - totalReduction)));
        }
        
        this.takeDamage(amount);
    }
    
    updateCharacterPassive(dt, currentTime) {
        const passive = this.getCharacterPassive();
        if (!passive || !this.characterPassiveState) return;
        
        const now = currentTime || (Date.now() / 1000);
        
        if (passive.type === 'guaranteed_crit') {
            const elapsed = now - this.characterPassiveState.lastGuaranteedCritTime;
            if (elapsed >= passive.cooldown && !this.characterPassiveState.guaranteedCritReady) {
                this.characterPassiveState.guaranteedCritReady = true;
            }
        }
        
        if (passive.type === 'periodic_shield') {
            const elapsed = now - this.characterPassiveState.lastShieldTime;
            const maxShield = this.characterPassiveState.shieldAmount || 50;
            const currentShield = this.characterPassiveState.currentShield || 0;
            
            if (elapsed >= passive.shieldCooldown && currentShield < maxShield) {
                this.characterPassiveState.currentShield = maxShield;
                this.characterPassiveState.lastShieldTime = now;
            }
        }
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
        
        if (!this.levelRewards) return;
        
        const rewardLevels = Object.keys(this.levelRewards).map(Number).sort((a, b) => a - b);
        
        if (!this.saveData.claimedRewards) {
            this.saveData.claimedRewards = {};
        }
        
        for (const level of rewardLevels) {
            const reward = this.levelRewards[level];
            const isPassed = this.saveData.highestLevelPassed >= level;
            const isClaimed = this.saveData.claimedRewards[level] === true;
            
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
        this.updateStatistics('play_game', 1);
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
        this.showToast('技能仅可通过击毁宝箱血条获取！');
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
        
        this.path = this.generatePath();
        
        const cfg = window.GameConfig || {};
        const levelCfg = cfg.level || {};
        this.reviveCount = levelCfg.reviveCount || 3;
        this.maxReviveCount = this.reviveCount;
        
        this.initCharacterPassive();
        
        const baseStats = this.getBaseStats();
        this.playerStats.maxHealth = 100 + baseStats.maxHealth;
        this.playerStats.health = 100 + baseStats.maxHealth;
        this.playerStats.speed = 5 * (1 + baseStats.moveSpeedBonus);
        this.playerStats.bulletDamage = 10 + baseStats.bulletDamage;
        this.playerStats.criticalChance = 0.05 + baseStats.critChanceBonus;
        
        this.initPlayer();
        
        const config = this.getLevelConfig(levelNum);
        this.totalEnemiesInLevel = 1;
        this.enemiesInLevel = 0;
        
        this.spawnDragon(config);
        this.enemiesInLevel++;
        
        document.getElementById('mainScreen').classList.add('hidden');
        document.getElementById('bottomNav').classList.add('hidden');
        document.getElementById('topBar').classList.add('hidden');
        
        document.getElementById('battleInfo').classList.remove('hidden');
        document.getElementById('battleUI').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
        document.getElementById('fenceBar').classList.remove('hidden');
        
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
        const cycle = Math.max(1, Math.floor((levelNum - 1) / 9) + 1);
        
        const baseConfig = this.levelConfigs[baseLevel] || this.levelConfigs[9];
        
        const healthMultiplier = 1 + (cycle - 1) * 0.25;
        const speedMultiplier = 1 + (cycle - 1) * 0.05;
        const damageMultiplier = 1 + (cycle - 1) * 0.15;
        
        return {
            enemyCount: baseConfig.enemyCount,
            enemyHealth: Math.floor(baseConfig.enemyHealth * healthMultiplier),
            enemySpeed: baseConfig.enemySpeed * speedMultiplier,
            enemyDamage: Math.floor(baseConfig.enemyDamage * damageMultiplier),
            dropChance: Math.min(baseConfig.dropChance + (cycle - 1) * 0.03, 0.7),
            segments: baseConfig.segments + (cycle - 1) * 10,
            chestDropChance: Math.min(baseConfig.chestDropChance + (cycle - 1) * 0.01, 0.9),
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
        if (!this._gameTimeAccumulator) {
            this._gameTimeAccumulator = 0;
        }
        this._gameTimeAccumulator += dt;
        if (this._gameTimeAccumulator >= 1) {
            const seconds = Math.floor(this._gameTimeAccumulator);
            this.updateStatistics('game_time', seconds);
            this._gameTimeAccumulator -= seconds;
        }
        
        this.updateCharacterPassive(dt, this.currentTime);
        this.updatePlayer(dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.updateChests(dt);
        this.updatePowerups(dt);
        this.updateParticles(dt);
        this.updateDamageNumbers(dt);
        this.updateBuffs(dt);
        this.updateSpawning(dt);
        this.updateSkills(dt);
        this.updateScreenShake(dt);
        this.updateComboSystem(dt);
        this.updateBulletTrails(dt);
        this.updateDeathExplosions(dt);
        this.updateFloatingTexts(dt);
        this.updateGlowEffects(dt);
        this.checkLevelComplete();
    }
    
    updateSkills(dt) {
        this.updateSkillCooldowns(dt);
        this.autoUseSkills();
        this.updateRainOfNeedles(dt);
        this.updateThunderDragon(dt);
        this.updateIceStorm(dt);
        this.updateSlowEffects(dt);
    }
    
    autoUseSkills() {
        for (const skillId of this.activeSkills) {
            if (this.skillCooldowns[skillId] <= 0) {
                this.useSkill(skillId);
            }
        }
    }
    
    updateSkillCooldowns(dt) {
        const cooldownReduction = this.getCooldownReductionFromPassive();
        const dtMultiplier = 1 + cooldownReduction;
        
        for (const skillId in this.skillCooldowns) {
            if (this.skillCooldowns[skillId] > 0) {
                this.skillCooldowns[skillId] -= dt * dtMultiplier;
            }
        }
    }
    
    useSkill(skillId) {
        if (this.skillCooldowns[skillId] > 0) return false;
        
        const stats = this.getSkillStats(skillId);
        if (!stats) return false;
        
        this.skillCooldowns[skillId] = stats.cooldown;
        
        switch (skillId) {
            case 'rain_of_needles':
                this.launchRainOfNeedles(stats);
                break;
            case 'thunder_dragon':
                this.launchThunderDragon(stats);
                break;
            case 'ice_storm':
                this.launchIceStorm(stats);
                break;
        }
        
        this.updateStatistics('skill_use', 1);
        
        return true;
    }
    
    launchRainOfNeedles(stats) {
        if (!this.player) return;
        
        const startX = this.player.x;
        const startY = this.player.y;
        
        const skillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
        const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
        
        for (let i = 0; i < stats.projectileCount; i++) {
            const spreadRad = stats.spread * Math.PI / 180;
            const startAngle = -Math.PI / 2 - spreadRad / 2;
            const angleStep = stats.projectileCount > 1 ? spreadRad / (stats.projectileCount - 1) : 0;
            const angle = startAngle + i * angleStep;
            
            let isCrit = Math.random() < this.playerStats.criticalChance;
            isCrit = this.applyCharacterPassiveToCrit(isCrit);
            
            const critMultiplier = isCrit ? (this.playerStats.criticalDamage + critDamageBonusFromPassive) : 1;
            
            const finalDamage = Math.floor(stats.damage * critMultiplier * skillDamageBonus);
            
            this.needles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage: finalDamage,
                isCrit: isCrit,
                burstCount: stats.burstCount,
                radius: 4,
                color: isCrit ? '#FFD700' : '#00FF00'
            });
        }
        
        this.addScreenShake(1.5, 0.1);
        
        this.glowEffects.push({
            x: startX,
            y: startY,
            radius: 20,
            maxRadius: 60,
            color: '#00FF00',
            lifetime: 0.2,
            maxLifetime: 0.2
        });
    }
    
    updateRainOfNeedles(dt) {
        for (let i = this.needles.length - 1; i >= 0; i--) {
            const needle = this.needles[i];
            
            needle.x += needle.vx * dt;
            needle.y += needle.vy * dt;
            
            let hit = false;
            for (const enemy of this.enemies) {
                if (enemy.isWinding && enemy.segments) {
                    for (const segment of enemy.segments) {
                        const dx = needle.x - segment.x;
                        const dy = needle.y - segment.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < needle.radius + 15) {
                            hit = true;
                            
                            if (segment.health > 0) {
                                segment.health -= needle.damage;
                                enemy.health -= needle.damage;
                                
                                const segRadius = segment.index === 0 ? 22 : 18;
                                this.damageNumbers.push({
                                    x: segment.x,
                                    y: segment.y - segRadius,
                                    value: needle.damage,
                                    isCrit: needle.isCrit,
                                    lifetime: 1,
                                    vy: -2
                                });
                                
                                this.createHitParticles(needle.x, needle.y, needle.color);
                            }
                            
                            this.burstNeedles(needle);
                            break;
                        }
                    }
                }
                if (hit) break;
            }
            
            if (hit) {
                this.needles.splice(i, 1);
                continue;
            }
            
            if (needle.x < -50 || needle.x > this.width + 50 || 
                needle.y < -50 || needle.y > this.height + 50) {
                this.needles.splice(i, 1);
            }
        }
    }
    
    burstNeedles(needle) {
        const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
        
        for (let i = 0; i < needle.burstCount; i++) {
            const angle = (Math.PI * 2 / needle.burstCount) * i;
            
            let isCrit = Math.random() < this.playerStats.criticalChance;
            isCrit = this.applyCharacterPassiveToCrit(isCrit);
            
            const critMultiplier = isCrit ? (this.playerStats.criticalDamage + critDamageBonusFromPassive) : 1;
            
            this.needles.push({
                x: needle.x,
                y: needle.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                damage: Math.floor(needle.damage * 0.5 * critMultiplier),
                isCrit: isCrit,
                burstCount: 0,
                radius: 3,
                color: isCrit ? '#FFD700' : '#90EE90'
            });
        }
        
        this.createHitParticles(needle.x, needle.y, '#00FF00');
    }
    
    launchThunderDragon(stats) {
        const startX = Math.random() * 0.6 + 0.2;
        const startY = Math.random() * 0.6 + 0.2;
        
        const skillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
        
        const dragonX = this.width * startX;
        const dragonY = this.height * startY;
        
        const bodySegments = [];
        const segmentCount = 12;
        for (let i = 0; i < segmentCount; i++) {
            bodySegments.push({
                x: dragonX,
                y: dragonY,
                targetX: dragonX,
                targetY: dragonY,
                angle: 0,
                scale: 1 - (i / segmentCount) * 0.8
            });
        }
        
        this.thunderDragon = {
            x: dragonX,
            y: dragonY,
            vx: (Math.random() > 0.5 ? 1 : -1) * stats.moveSpeed,
            vy: (Math.random() > 0.5 ? 1 : -1) * stats.moveSpeed * 0.6,
            angle: Math.atan2((Math.random() > 0.5 ? 1 : -1) * stats.moveSpeed * 0.6, (Math.random() > 0.5 ? 1 : -1) * stats.moveSpeed),
            targetAngle: 0,
            damage: stats.damage,
            skillDamageBonus: skillDamageBonus,
            lightningTimer: 0,
            lightningFrequency: stats.lightningFrequency,
            duration: stats.duration,
            elapsed: 0,
            targetChangeTimer: 0,
            bodySegments: bodySegments,
            bodySegmentCount: segmentCount,
            lightningEffects: [],
            chainLightningEffects: [],
            pulsePhase: 0,
            roarPhase: 0,
            chainCount: stats.chainCount || 5,
            chainDamageReduction: stats.chainDamageReduction || 0.75,
            chainRange: 250
        };
        this.thunderDragonTimer = stats.duration;
        
        this.addScreenShake(5, 0.3);
        
        this.createKillExplosion(dragonX, dragonY, '#FFFF00', 3);
    }
    
    updateThunderDragon(dt) {
        if (!this.thunderDragon || this.thunderDragonTimer <= 0) {
            this.thunderDragon = null;
            return;
        }
        
        this.thunderDragon.elapsed += dt;
        this.thunderDragonTimer -= dt;
        this.thunderDragon.pulsePhase += dt * 8;
        this.thunderDragon.roarPhase += dt * 4;
        
        if (this.thunderDragon.elapsed >= this.thunderDragon.duration) {
            this.thunderDragon = null;
            return;
        }
        
        this.thunderDragon.targetChangeTimer += dt;
        if (this.thunderDragon.targetChangeTimer > 1.5 + Math.random() * 2) {
            this.thunderDragon.targetChangeTimer = 0;
            
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            for (const enemy of this.enemies) {
                if (enemy.isWinding && enemy.segments && enemy.segments.length > 0) {
                    const dx = enemy.segments[0].x - this.thunderDragon.x;
                    const dy = enemy.segments[0].y - this.thunderDragon.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy.segments[0];
                    }
                }
            }
            
            if (nearestEnemy && Math.random() < 0.7) {
                const targetAngle = Math.atan2(
                    nearestEnemy.y - this.thunderDragon.y,
                    nearestEnemy.x - this.thunderDragon.x
                );
                this.thunderDragon.targetAngle = targetAngle;
            } else {
                this.thunderDragon.targetAngle += (Math.random() - 0.5) * Math.PI * 1.5;
            }
        }
        
        const currentAngle = this.thunderDragon.angle;
        let angleDiff = this.thunderDragon.targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.thunderDragon.angle += angleDiff * dt * 3;
        
        const speed = 180;
        this.thunderDragon.vx = Math.cos(this.thunderDragon.angle) * speed;
        this.thunderDragon.vy = Math.sin(this.thunderDragon.angle) * speed;
        
        this.thunderDragon.x += this.thunderDragon.vx * dt;
        this.thunderDragon.y += this.thunderDragon.vy * dt;
        
        const margin = 80;
        if (this.thunderDragon.x < margin) {
            this.thunderDragon.x = margin;
            this.thunderDragon.targetAngle = Math.PI - this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
        }
        if (this.thunderDragon.x > this.width - margin) {
            this.thunderDragon.x = this.width - margin;
            this.thunderDragon.targetAngle = Math.PI - this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
        }
        if (this.thunderDragon.y < margin + 30) {
            this.thunderDragon.y = margin + 30;
            this.thunderDragon.targetAngle = -this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
        }
        if (this.thunderDragon.y > this.height - margin) {
            this.thunderDragon.y = this.height - margin;
            this.thunderDragon.targetAngle = -this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
        }
        
        const segments = this.thunderDragon.bodySegments;
        const followDelay = 0.08;
        
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            
            let targetX, targetY;
            if (i === 0) {
                targetX = this.thunderDragon.x;
                targetY = this.thunderDragon.y;
            } else {
                const prevSeg = segments[i - 1];
                targetX = prevSeg.x;
                targetY = prevSeg.y;
            }
            
            const dx = targetX - seg.x;
            const dy = targetY - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const idealDist = 12;
            if (dist > idealDist) {
                const ratio = (dist - idealDist) / dist * 0.8;
                seg.x += dx * ratio;
                seg.y += dy * ratio;
            }
            
            if (i === 0) {
                seg.angle = this.thunderDragon.angle;
            } else {
                const angleToPrev = Math.atan2(segments[i - 1].y - seg.y, segments[i - 1].x - seg.x);
                let angleDiff2 = angleToPrev - seg.angle;
                while (angleDiff2 > Math.PI) angleDiff2 -= Math.PI * 2;
                while (angleDiff2 < -Math.PI) angleDiff2 += Math.PI * 2;
                seg.angle += angleDiff2 * 0.3;
            }
        }
        
        this.thunderDragon.lightningTimer += dt;
        if (this.thunderDragon.lightningTimer >= this.thunderDragon.lightningFrequency) {
            this.thunderDragon.lightningTimer = 0;
            this.strikeThunder();
            this.addScreenShake(2, 0.1);
        }
        
        if (Math.random() < 0.15) {
            this.addDragonLightning();
        }
    }
    
    addDragonLightning() {
        if (!this.thunderDragon) return;
        
        const segments = this.thunderDragon.bodySegments;
        const headSeg = segments[0];
        
        const startSegmentIdx = Math.floor(Math.random() * segments.length);
        const startSeg = segments[startSegmentIdx];
        
        const angle = Math.random() * Math.PI * 2;
        const length = 30 + Math.random() * 60;
        
        this.thunderDragon.lightningEffects.push({
            startX: startSeg.x,
            startY: startSeg.y,
            endX: startSeg.x + Math.cos(angle) * length,
            endY: startSeg.y + Math.sin(angle) * length,
            life: 0.15,
            maxLife: 0.15,
            segments: this.generateLightningPath(
                startSeg.x, startSeg.y,
                startSeg.x + Math.cos(angle) * length,
                startSeg.y + Math.sin(angle) * length,
                4
            ),
            color: Math.random() < 0.5 ? '#FFFFFF' : '#87CEEB'
        });
    }
    
    generateLightningPath(x1, y1, x2, y2, segments) {
        const path = [{ x: x1, y: y1 }];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        for (let i = 1; i < segments; i++) {
            const ratio = i / segments;
            const baseX = x1 + dx * ratio;
            const baseY = y1 + dy * ratio;
            const offset = (Math.random() - 0.5) * dist * 0.15;
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            
            path.push({
                x: baseX + Math.cos(perpAngle) * offset,
                y: baseY + Math.sin(perpAngle) * offset
            });
        }
        
        path.push({ x: x2, y: y2 });
        return path;
    }
    
    strikeThunder() {
        if (!this.thunderDragon) return;
        
        const headSeg = this.thunderDragon.bodySegments && this.thunderDragon.bodySegments[0];
        const startX = headSeg ? headSeg.x : this.thunderDragon.x;
        const startY = headSeg ? headSeg.y : this.thunderDragon.y;
        
        const chainCount = this.thunderDragon.chainCount || 5;
        const chainRange = this.thunderDragon.chainRange || 250;
        const chainDamageReduction = this.thunderDragon.chainDamageReduction || 0.75;
        
        let isCrit = Math.random() < this.playerStats.criticalChance;
        isCrit = this.applyCharacterPassiveToCrit(isCrit);
        
        const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
        const critMultiplier = isCrit ? (this.playerStats.criticalDamage + critDamageBonusFromPassive) : 1;
        const skillDamageBonus = this.thunderDragon.skillDamageBonus || 1;
        const baseDamage = Math.floor(this.thunderDragon.damage * critMultiplier * skillDamageBonus);
        
        const chainTargets = [];
        const hitSegmentPairs = [];
        
        let currentX = startX;
        let currentY = startY;
        let currentDamage = baseDamage;
        let currentChainIndex = 0;
        
        const allSegments = [];
        for (const enemy of this.enemies) {
            if (enemy.isWinding && enemy.segments && enemy.segments.length > 0) {
                for (const segment of enemy.segments) {
                    allSegments.push({ enemy, segment });
                }
            }
        }
        
        while (currentChainIndex < chainCount) {
            let nearestPair = null;
            let nearestDist = Infinity;
            
            for (const segPair of allSegments) {
                const { segment } = segPair;
                
                const alreadyHit = hitSegmentPairs.some(hp => 
                    hp.segment === segment
                );
                if (alreadyHit) continue;
                
                if (segment.health <= 0) continue;
                
                const dx = currentX - segment.x;
                const dy = currentY - segment.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < chainRange && dist < nearestDist) {
                    nearestDist = dist;
                    nearestPair = segPair;
                }
            }
            
            if (!nearestPair) break;
            
            chainTargets.push({
                x: nearestPair.segment.x,
                y: nearestPair.segment.y,
                segment: nearestPair.segment,
                enemy: nearestPair.enemy,
                damage: currentDamage,
                chainIndex: currentChainIndex
            });
            
            hitSegmentPairs.push(nearestPair);
            
            currentX = nearestPair.segment.x;
            currentY = nearestPair.segment.y;
            currentDamage = Math.floor(currentDamage * chainDamageReduction);
            currentChainIndex++;
        }
        
        if (chainTargets.length > 0) {
            const lightningPath = [
                { x: startX, y: startY }
            ];
            
            for (const target of chainTargets) {
                lightningPath.push({ x: target.x, y: target.y });
            }
            
            this.thunderDragon.chainLightningEffects.push({
                path: lightningPath,
                life: 0.4,
                maxLife: 0.4,
                segments: []
            });
            
            for (let i = 0; i < lightningPath.length - 1; i++) {
                const startPt = lightningPath[i];
                const endPt = lightningPath[i + 1];
                
                const segPath = this.generateLightningPath(
                    startPt.x, startPt.y,
                    endPt.x, endPt.y,
                    6
                );
                
                if (this.thunderDragon.chainLightningEffects.length > 0) {
                    this.thunderDragon.chainLightningEffects[
                        this.thunderDragon.chainLightningEffects.length - 1
                    ].segments.push(segPath);
                }
            }
        }
        
        for (const target of chainTargets) {
            if (target.segment.health > 0) {
                target.segment.health -= target.damage;
                target.enemy.health -= target.damage;
                
                const segRadius = target.segment.index === 0 ? 22 : 18;
                this.damageNumbers.push({
                    x: target.segment.x,
                    y: target.segment.y - segRadius,
                    value: target.damage,
                    isCrit: isCrit,
                    lifetime: 1,
                    vy: -2
                });
                
                this.createThunderEffect(target.segment.x, target.segment.y);
            }
        }
        
        if (chainTargets.length > 0) {
            this.createThunderEffect(startX, startY);
            this.addScreenShake(3, 0.15);
        }
    }
    
    createThunderEffect(x, y) {
        const maxParticles = Math.max(0, 80 - this.particles.length);
        if (maxParticles <= 0) return;
        
        const particleCount = Math.min(8, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: '#FFFF00',
                lifetime: 0.35,
                maxLifetime: 0.35,
                alpha: 1
            });
        }
        
        if (maxParticles > particleCount) {
            const whiteParticleCount = Math.min(4, maxParticles - particleCount);
            for (let i = 0; i < whiteParticleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 6;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 2,
                    color: '#FFFFFF',
                    lifetime: 0.25,
                    maxLifetime: 0.25,
                    alpha: 1
                });
            }
        }
        
        this.glowEffects.push({
            x: x,
            y: y,
            radius: 30,
            maxRadius: 80,
            color: '#FFFF00',
            lifetime: 0.25,
            maxLifetime: 0.25
        });
    }
    
    createIceEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 4,
                color: '#87CEEB',
                lifetime: 0.5,
                maxLifetime: 0.5,
                alpha: 1
            });
        }
        
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 1,
                radius: 1 + Math.random() * 2,
                color: '#FFFFFF',
                lifetime: 0.6,
                maxLifetime: 0.6,
                alpha: 1
            });
        }
        
        this.glowEffects.push({
            x: x,
            y: y,
            radius: 20,
            maxRadius: 60,
            color: '#87CEEB',
            lifetime: 0.3,
            maxLifetime: 0.3
        });
    }
    
    launchIceStorm(stats) {
        this.iceStormActive = true;
        this.iceStormTimer = stats.duration || 3.0;
        this.iceStormStats = stats;
        this.iceStormSkillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
        
        this.addScreenShake(2, 0.15);
    }
    
    updateIceStorm(dt) {
        if (!this.iceStormActive || this.iceStormTimer <= 0) {
            this.iceStormActive = false;
            return;
        }
        
        this.iceStormTimer -= dt;
        
        const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
        const skillDamageBonus = this.iceStormSkillDamageBonus || 1;
        
        if (Math.random() < this.iceStormStats.hailRate) {
            let isCrit = Math.random() < this.playerStats.criticalChance;
            isCrit = this.applyCharacterPassiveToCrit(isCrit);
            
            const critMultiplier = isCrit ? (this.playerStats.criticalDamage + critDamageBonusFromPassive) : 1;
            
            this.hailStones.push({
                x: Math.random() * this.width,
                y: -20,
                vy: 200 + Math.random() * 100,
                damage: Math.floor(this.iceStormStats.damage * critMultiplier * skillDamageBonus),
                isCrit: isCrit,
                slowDuration: this.iceStormStats.slowDuration,
                slowAmount: this.iceStormStats.slowAmount,
                radius: 6,
                color: isCrit ? '#ADD8E6' : '#87CEEB'
            });
        }
        
        for (let i = this.hailStones.length - 1; i >= 0; i--) {
            const hail = this.hailStones[i];
            
            hail.y += hail.vy * dt;
            
            let hit = false;
            for (const enemy of this.enemies) {
                if (enemy.isWinding && enemy.segments) {
                    for (const segment of enemy.segments) {
                        const dx = hail.x - segment.x;
                        const dy = hail.y - segment.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < hail.radius + 15) {
                            hit = true;
                            
                            if (segment.health > 0) {
                                segment.health -= hail.damage;
                                enemy.health -= hail.damage;
                                
                                const segRadius = segment.index === 0 ? 22 : 18;
                                this.damageNumbers.push({
                                    x: segment.x,
                                    y: segment.y - segRadius,
                                    value: hail.damage,
                                    isCrit: hail.isCrit,
                                    lifetime: 1,
                                    vy: -2
                                });
                            }
                            
                            this.applySlowEffect(enemy, segment, hail.slowDuration, hail.slowAmount);
                            
                            this.createIceEffect(segment.x, segment.y);
                            break;
                        }
                    }
                }
                if (hit) break;
            }
            
            if (hit) {
                this.hailStones.splice(i, 1);
                continue;
            }
            
            if (hail.y > this.height + 50) {
                this.hailStones.splice(i, 1);
            }
        }
    }
    
    applySlowEffect(enemy, segment, duration, amount) {
        let existingEffect = this.slowEffects.find(e => e.segment === segment);
        if (existingEffect) {
            existingEffect.duration = Math.max(existingEffect.duration, duration);
            existingEffect.amount = Math.max(existingEffect.amount, amount);
        } else {
            this.slowEffects.push({
                segment: segment,
                duration: duration,
                amount: amount
            });
        }
    }
    
    updateSlowEffects(dt) {
        for (let i = this.slowEffects.length - 1; i >= 0; i--) {
            const effect = this.slowEffects[i];
            effect.duration -= dt;
            
            if (effect.duration <= 0) {
                this.slowEffects.splice(i, 1);
            }
        }
    }
    
    getSegmentSlowMultiplier(segment) {
        const effect = this.slowEffects.find(e => e.segment === segment);
        return effect ? (1 - effect.amount) : 1;
    }
    
    createIceEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: '#87CEEB',
                lifetime: 0.4,
                maxLifetime: 0.4,
                alpha: 1
            });
        }
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
        
        const healthRegen = this.playerStats.healthRegen || 0;
        if (healthRegen > 0 && this.playerStats.health < this.playerStats.maxHealth) {
            this.playerStats.health = Math.min(
                this.playerStats.maxHealth,
                this.playerStats.health + healthRegen * dt
            );
        }
        
        const attackSpeedMultiplier = 1 + (this.playerStats.attackSpeedBonus || 0);
        const effectiveFireRate = this.playerStats.fireRate / attackSpeedMultiplier;
        
        this.shootTimer += dt;
        if (this.shootTimer >= effectiveFireRate) {
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
        
        const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
        
        const speedToDamage = this.playerStats.speedToDamage || 0;
        const baseSpeedBonus = (this.playerStats.speed / 5 - 1) * speedToDamage;
        const speedDamageMultiplier = 1 + baseSpeedBonus;
        
        for (let i = 0; i < bulletCount; i++) {
            let angle = baseAngle;
            
            if (bulletCount > 1) {
                const startAngle = baseAngle - (spread * Math.PI / 180) / 2;
                const angleStep = (spread * Math.PI / 180) / (bulletCount - 1);
                angle = startAngle + i * angleStep;
            }
            
            let isCrit = Math.random() < this.playerStats.criticalChance;
            isCrit = this.applyCharacterPassiveToCrit(isCrit);
            
            const critMultiplier = (this.playerStats.criticalDamage + critDamageBonusFromPassive);
            const finalCritMultiplier = isCrit ? critMultiplier : 1;
            
            const damageBoost = this.getBuffMultiplier('damage_boost');
            const damageMultiplier = this.playerStats.damageMultiplier || 1;
            
            const finalDamage = Math.floor(this.playerStats.bulletDamage * damageMultiplier * finalCritMultiplier * damageBoost * speedDamageMultiplier);
            
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - this.player.radius,
                vx: Math.cos(angle) * this.playerStats.bulletSpeed,
                vy: Math.sin(angle) * this.playerStats.bulletSpeed,
                radius: this.playerStats.bulletSize,
                damage: finalDamage,
                isCrit: isCrit,
                pierceCount: this.playerStats.bulletPierce,
                color: isCrit ? '#FFD700' : '#00FFFF'
            });
        }
    }
    
    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            this.createBulletTrail(bullet);
            
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
            
            if (enemy.isWinding && enemy.segments && enemy.segments.length > 0 && this.path && this.path.length > 0) {
                const head = enemy.segments[0];
                
                if (enemy.currentPathIndex === undefined) {
                    enemy.currentPathIndex = 0;
                }
                
                if (enemy.pathDistance === undefined) {
                    enemy.pathDistance = 0;
                }
                
                const cfg = window.GameConfig || {};
                const dragonCfg = cfg.dragon || {};
                const moveSpeed = dragonCfg.moveSpeed || 3;
                const segmentSpacing = enemy.segmentSpacing || 35;
                
                enemy.pathDistance += moveSpeed * 60 * dt;
                
                const headPoint = this.getPointAtDistance(enemy.pathDistance);
                if (headPoint) {
                    if (headPoint.isEnd) {
                        this.dragonReachedEnd(enemy);
                        return;
                    }
                    head.x = headPoint.x;
                    head.y = headPoint.y;
                } else {
                    const currentPoint = this.path[enemy.currentPathIndex];
                    if (currentPoint) {
                        const dx = currentPoint.x - head.x;
                        const dy = currentPoint.y - head.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < moveSpeed * 60 * dt) {
                            head.x = currentPoint.x;
                            head.y = currentPoint.y;
                            enemy.currentPathIndex++;
                        } else {
                            const angle = Math.atan2(dy, dx);
                            head.x += Math.cos(angle) * moveSpeed * 60 * dt;
                            head.y += Math.sin(angle) * moveSpeed * 60 * dt;
                        }
                    }
                }
                
                enemy.x = head.x;
                enemy.y = head.y;
                
                for (let j = 1; j < enemy.segments.length; j++) {
                    const current = enemy.segments[j];
                    const segmentDistance = enemy.pathDistance - j * segmentSpacing;
                    
                    const segmentPoint = this.getPointAtDistance(segmentDistance);
                    if (segmentPoint) {
                        current.x = segmentPoint.x;
                        current.y = segmentPoint.y;
                    } else {
                        const prev = enemy.segments[j - 1];
                        const spacing = enemy.segmentSpacing || 35;
                        const followSpeed = 0.3;
                        
                        const dx = prev.x - current.x;
                        const dy = prev.y - current.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist > spacing) {
                            const angle = Math.atan2(dy, dx);
                            const targetDist = dist - spacing;
                            current.x += Math.cos(angle) * targetDist * followSpeed;
                            current.y += Math.sin(angle) * targetDist * followSpeed;
                        }
                    }
                }
            } else {
                enemy.y += enemy.speed * 60 * dt;
                enemy.angle += dt * 2;
                
                if (this.player) {
                    const dx = this.player.x - enemy.x;
                    if (Math.abs(dx) > 5) {
                        enemy.x += Math.sign(dx) * enemy.speed * 0.3 * 60 * dt;
                    }
                }
            }
            
            if (enemy.y > this.height + 100) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            if (enemy.segments && enemy.segments.length > 0) {
                let playerHit = false;
                for (const segment of enemy.segments) {
                    const segRadius = segment.index === 0 ? 22 : 18;
                    
                    const segObj = { x: segment.x, y: segment.y, radius: segRadius };
                    if (this.checkCollision(segObj, this.player)) {
                        playerHit = true;
                        break;
                    }
                }
                if (playerHit && this.player.invincible <= 0) {
                    this.takeDamageWithPassive(enemy.damage);
                    this.player.invincible = 0.5;
                }
                
                for (let j = this.bullets.length - 1; j >= 0; j--) {
                    const bullet = this.bullets[j];
                    let bulletHit = false;
                    
                    for (const segment of enemy.segments) {
                        if (segment.health <= 0) continue;
                        
                        const segRadius = segment.index === 0 ? 22 : 18;
                        
                        const segObj = { x: segment.x, y: segment.y, radius: segRadius };
                        
                        if (this.checkCircleCollision(bullet, segObj)) {
                            let actualDamage = bullet.damage;
                            if (enemy.special && enemy.special.damageReduction) {
                                actualDamage = Math.max(1, Math.floor(bullet.damage * (1 - enemy.special.damageReduction)));
                            }
                            
                            segment.health -= actualDamage;
                            enemy.health -= actualDamage;
                            
                            this.damageNumbers.push({
                                x: segment.x,
                                y: segment.y - segRadius,
                                value: actualDamage,
                                isCrit: bullet.isCrit,
                                isReduced: enemy.special && enemy.special.damageReduction > 0,
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
                            
                            const chestSegmentsDestroyed = destroyedSegments.filter(s => s.hasChest);
                            for (const chestSegment of chestSegmentsDestroyed) {
                                this.autoSelectSkill();
                            }
                        }
                        
                        for (const segment of destroyedSegments) {
                            if (segment.hasChest) {
                                this.spawnChest(segment.x, segment.y);
                            }
                            
                            if (Math.random() < levelConfig.dropChance * 0.5) {
                                this.spawnPowerup(segment.x, segment.y);
                            }
                        }
                        
                        enemy.segments = enemy.segments.filter(s => s.health > 0);
                        
                        if (enemy.segments.length === 0) {
                            this.createKillExplosion(enemy.x, enemy.y, enemy.color, 1.5);
                            this.addComboKill();
                            this.enemiesKilled++;
                            
                            const comboBonus = this.comboSystem.comboMultiplier;
                            this.score += Math.floor(enemy.maxHealth * comboBonus);
                            this.goldEarned += Math.floor(enemy.maxHealth / 5 * comboBonus);
                            
                            this.updateStatistics('kill', 1);
                            
                            if (Math.random() < levelConfig.dropChance) {
                                this.spawnPowerup(enemy.x, enemy.y);
                            }
                            
                            this.enemies.splice(i, 1);
                            
                            break;
                        }
                    }
                }
            } else {
                if (this.checkCollision(enemy, this.player)) {
                    if (this.player.invincible <= 0) {
                        this.takeDamageWithPassive(enemy.damage);
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
                            this.createKillExplosion(enemy.x, enemy.y, enemy.color, 1);
                            this.addComboKill();
                            this.enemiesKilled++;
                            
                            const comboBonus = this.comboSystem.comboMultiplier;
                            this.score += Math.floor(enemy.maxHealth * comboBonus);
                            this.goldEarned += Math.floor(enemy.maxHealth / 5 * comboBonus);
                            
                            this.updateStatistics('kill', 1);
                            
                            if (Math.random() < levelConfig.dropChance) {
                                this.spawnPowerup(enemy.x, enemy.y);
                            }
                            
                            this.enemies.splice(i, 1);
                            
                            break;
                        }
                    }
                }
            }
        }
        
        this.processDestroyedSegments(levelConfig);
        
        this.updateUI();
    }
    
    processDestroyedSegments(levelConfig) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.isWinding || !enemy.segments) continue;
            
            const destroyedSegments = enemy.segments.filter(s => s.health <= 0);
            const destroyedCount = destroyedSegments.length;
            
            if (destroyedCount > 0) {
                this.segmentsDestroyed += destroyedCount;
                
                const chestSegmentsDestroyed = destroyedSegments.filter(s => s.hasChest);
                for (const chestSegment of chestSegmentsDestroyed) {
                    this.autoSelectSkill();
                }
                
                for (const segment of destroyedSegments) {
                    if (segment.hasChest) {
                        this.spawnChest(segment.x, segment.y);
                    }
                    
                    if (Math.random() < levelConfig.dropChance * 0.5) {
                        this.spawnPowerup(segment.x, segment.y);
                    }
                    
                    this.createDeathParticles(segment.x, segment.y, enemy.color);
                }
                
                enemy.segments = enemy.segments.filter(s => s.health > 0);
                
                if (enemy.segments.length === 0) {
                    this.createDeathParticles(enemy.x, enemy.y, enemy.color);
                    this.enemiesKilled++;
                    this.score += enemy.maxHealth;
                    this.goldEarned += Math.floor(enemy.maxHealth / 5);
                    
                    this.updateStatistics('kill', 1);
                    
                    if (Math.random() < levelConfig.dropChance) {
                        this.spawnPowerup(enemy.x, enemy.y);
                    }
                    
                    this.enemies.splice(i, 1);
                }
            }
        }
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
        
        this.updateStatistics('chest_open', 1);
        
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
            
            if (dn.isCrit && !dn.critEffectTriggered) {
                this.createCritEffect(dn.x, dn.y);
                dn.critEffectTriggered = true;
            }
            
            dn.y += dn.vy * 60 * dt;
            dn.lifetime -= dt;
            dn.alpha = Math.max(0, dn.lifetime);
            
            if (!dn.scale) dn.scale = 1;
            if (dn.isCrit) {
                const scaleProgress = 1 - (dn.lifetime / 1);
                if (scaleProgress < 0.2) {
                    dn.scale = 1 + Math.sin(scaleProgress * Math.PI / 0.2) * 0.3;
                }
            }
            
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
    
    getSegmentsPerSkill() {
        const cfg = window.GameConfig || {};
        const dragonCfg = cfg.dragon || {};
        
        const early = (dragonCfg.segmentsPerSkillSelectionEarly || 3) * 6;
        const mid = (dragonCfg.segmentsPerSkillSelectionMid || 5) * 6;
        const late = (dragonCfg.segmentsPerSkillSelectionLate || 7) * 6;
        
        if (this.segmentsDestroyed < 15) return early;
        if (this.segmentsDestroyed < 40) return mid;
        return late;
    }
    
    spawnDragon(config) {
        const cfg = window.GameConfig || {};
        const dragonCfg = cfg.dragon || {};
        
        const baseSegments = dragonCfg.baseSegments || 50;
        const segmentsPerLevel = dragonCfg.segmentsPerLevel || 8;
        const maxSegments = dragonCfg.maxSegments || 150;
        const segments = Math.min(maxSegments, baseSegments + (this.currentLevel - 1) * segmentsPerLevel);
        
        const segmentSpacing = dragonCfg.segmentSpacing || 46;
        
        let startX = 50;
        let startY = 100;
        
        if (this.path && this.path.length > 0) {
            startX = this.path[0].x;
            startY = this.path[0].y;
        }
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        let totalHealth = 0;
        const baseHealthPerSegment = dragonCfg.baseHealthPerSegment || 25;
        const healthPerLevel = dragonCfg.healthPerLevel || 10;
        const frontMultiplier = dragonCfg.healthDistributionFrontMultiplier || 0.5;
        const backMultiplier = dragonCfg.healthDistributionBackMultiplier || 2.0;
        
        const baseHealth = baseHealthPerSegment + (this.currentLevel - 1) * healthPerLevel;
        
        const segmentHealths = [];
        for (let i = 0; i < segments; i++) {
            const progress = i / Math.max(1, segments - 1);
            const healthMultiplier = frontMultiplier + progress * (backMultiplier - frontMultiplier);
            const health = Math.max(1, Math.ceil(baseHealth * healthMultiplier));
            
            segmentHealths.push(health);
            totalHealth += health;
        }
        
        const dragonTypes = ['normal', 'armored', 'fast'];
        const dragonType = this.currentLevel >= 3 ? 
            dragonTypes[Math.floor(Math.random() * dragonTypes.length)] : 'normal';
        
        let dragonSpecial = {};
        let dragonDisplayColor = color;
        
        switch (dragonType) {
            case 'armored':
                dragonSpecial = { type: 'armored', damageReduction: 0.15 };
                dragonDisplayColor = '#A0A0A0';
                break;
            case 'fast':
                dragonSpecial = { type: 'fast', speedMultiplier: 1.4 };
                dragonDisplayColor = '#90EE90';
                break;
            default:
                dragonSpecial = { type: 'normal' };
        }
        
        const baseSpeed = config.enemySpeed;
        const finalSpeed = baseSpeed * (dragonSpecial.speedMultiplier || 1);
        
        const dragon = {
            x: startX,
            y: startY,
            radius: 22,
            health: totalHealth,
            maxHealth: totalHealth,
            speed: finalSpeed,
            damage: config.enemyDamage,
            angle: 0,
            color: dragonDisplayColor,
            segments: [],
            isHead: true,
            isWinding: true,
            moveDirection: 1,
            horizontalSpeed: finalSpeed * 2,
            verticalSpeed: finalSpeed * 0.5,
            leftBound: 50,
            rightBound: 0,
            segmentSpacing: segmentSpacing,
            targetX: startX,
            targetY: startY,
            currentPathIndex: 0,
            special: dragonSpecial,
            type: dragonType
        };
        
        for (let i = 0; i < segments; i++) {
            const isChestSegment = (i + 1) % 6 === 0;
            dragon.segments.push({
                x: startX,
                y: startY - i * segmentSpacing,
                health: segmentHealths[i],
                maxHealth: segmentHealths[i],
                index: i,
                isHead: i === 0,
                isTail: i === segments - 1,
                hasChest: isChestSegment
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
        
        const shakeIntensity = Math.min(10, amount);
        this.addScreenShake(shakeIntensity, 0.2);
        
        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
    }
    
    dragonReachedEnd(enemy) {
        if (this.reviveCount > 0) {
            this.gameState = 'reviving';
            document.getElementById('reviveCountDisplay').textContent = this.reviveCount;
            document.getElementById('reviveScreen').classList.add('show');
        } else {
            this.gameOver();
        }
    }
    
    revive() {
        if (this.reviveCount <= 0) return;
        
        this.reviveCount--;
        this.updateStatistics('revive', 1);
        
        for (const enemy of this.enemies) {
            if (enemy.isWinding && enemy.pathDistance !== undefined) {
                enemy.pathDistance = this.totalPathLength / 2;
            }
        }
        
        document.getElementById('reviveScreen').classList.remove('show');
        this.gameState = 'playing';
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    cancelRevive() {
        document.getElementById('reviveScreen').classList.remove('show');
        this.gameOver();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        if (this.goldEarned > 0) {
            this.saveData.gold += this.goldEarned;
            this.updateStatistics('gold', this.goldEarned);
        }
        if (this.currentLevel > this.saveData.maxUnlockedLevel) {
            this.saveData.maxUnlockedLevel = this.currentLevel;
        }
        this.updateStatistics('death', 1);
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
            this.updateStatistics('gold', this.goldEarned);
        }
        
        this.updateStatistics('clear', 1);
        
        this.updateSpecificLevelTask(this.currentLevel);
        
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
    
    updateSpecificLevelTask(clearedLevel) {
        if (!this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) return;
        
        let hasUpdates = false;
        
        for (const task of this.saveData.dailyTasks.tasks) {
            if (task.type === 'complete_specific_level' && !task.completed) {
                if (clearedLevel >= task.target) {
                    task.progress = task.target;
                    task.completed = true;
                    hasUpdates = true;
                } else {
                    task.progress = Math.max(task.progress || 0, clearedLevel);
                    hasUpdates = true;
                }
            }
        }
        
        if (hasUpdates) {
            this.saveGameData();
        }
    }
    
    syncSpecificLevelTaskProgress() {
        if (!this.saveData.dailyTasks || !this.saveData.dailyTasks.tasks) return;
        
        const highestLevel = this.saveData.highestLevelPassed || 0;
        if (highestLevel <= 0) return;
        
        let hasUpdates = false;
        
        for (const task of this.saveData.dailyTasks.tasks) {
            if (task.type === 'complete_specific_level' && !task.completed) {
                const currentProgress = task.progress || 0;
                
                if (highestLevel > currentProgress) {
                    if (highestLevel >= task.target) {
                        task.progress = task.target;
                        task.completed = true;
                    } else {
                        task.progress = highestLevel;
                    }
                    hasUpdates = true;
                }
            }
        }
        
        if (hasUpdates) {
            this.saveGameData();
        }
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
            
            let levelInfo = '';
            let upgradeInfo = '';
            
            if (skill.type === 'active') {
                const currentLevel = this.skillLevels[skill.id] || 0;
                const nextLevel = currentLevel + 1;
                const isMaxLevel = currentLevel >= 5;
                
                if (currentLevel > 0) {
                    levelInfo = `<div class="skill-level">等级 ${currentLevel}/5</div>`;
                }
                
                if (isMaxLevel) {
                    upgradeInfo = `<div class="skill-upgrade" style="color: #FFD700;">已满级 - 属性已大幅提升！</div>`;
                } else if (currentLevel > 0) {
                    upgradeInfo = `<div class="skill-upgrade">升级到 ${nextLevel} 级</div>`;
                }
            }
            
            let desc = skill.description;
            if (skill.type === 'active') {
                const currentLevel = this.skillLevels[skill.id] || 0;
                if (currentLevel > 0) {
                    const stats = this.getSkillStats(skill.id);
                    if (stats) {
                        desc += `<br><small style="color: #888;">伤害: ${stats.damage} | 冷却: ${stats.cooldown.toFixed(1)}秒</small>`;
                    }
                }
            }
            
            card.innerHTML = `
                <div class="skill-icon-box">
                    <span class="skill-rarity-badge">${skill.rarity}</span>
                    <span class="skill-icon">${skill.icon}</span>
                    ${levelInfo}
                </div>
                <div class="skill-content">
                    <div class="skill-subtitle">${skill.name}</div>
                    <div class="skill-desc">${desc}</div>
                    ${upgradeInfo}
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
        if (skill.type === 'active') {
            if (!this.skillLevels[skill.id]) {
                this.skillLevels[skill.id] = 1;
                this.activeSkills.push(skill.id);
                this.skillCooldowns[skill.id] = 0;
            } else {
                this.skillLevels[skill.id]++;
            }
        } else {
            switch (skill.id) {
                case 'bullet_count':
                    this.playerStats.bulletCount++;
                    break;
                case 'fire_rate':
                    this.playerStats.fireRate *= 0.88;
                    break;
                case 'damage':
                    this.playerStats.damageMultiplier = (this.playerStats.damageMultiplier || 1) * 1.2;
                    break;
                case 'health':
                    const healthBonus = Math.max(15, Math.floor(this.playerStats.maxHealth * 0.15));
                    this.playerStats.health = Math.min(
                        this.playerStats.health + healthBonus,
                        this.playerStats.maxHealth
                    );
                    break;
                case 'max_health':
                    const maxHealthBonus = Math.max(15, Math.floor(this.playerStats.maxHealth * 0.12));
                    this.playerStats.maxHealth += maxHealthBonus;
                    this.playerStats.health += maxHealthBonus;
                    break;
                case 'bullet_size':
                    this.playerStats.bulletSize += 3;
                    break;
                case 'speed':
                    this.playerStats.speed *= 1.12;
                    if (this.playerStats.speed > 20) this.playerStats.speed = 20;
                    break;
                case 'pierce':
                    this.playerStats.bulletPierce++;
                    break;
                case 'crit_chance':
                    this.playerStats.criticalChance = Math.min(
                        0.75,
                        this.playerStats.criticalChance + 0.05
                    );
                    break;
                case 'crit_damage':
                    this.playerStats.criticalDamage += 0.3;
                    break;
                case 'magnet':
                    this.playerStats.magnetRange += 40;
                    break;
            }
        }
        
        this.unlockedSkills.push(skill.id);
        this.updateUI();
    }
    
    getSkillStats(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return null;
        
        const level = this.skillLevels[skillId] || 1;
        const isMaxLevel = level >= 5;
        
        let stats = { ...skill, level, isMaxLevel };
        
        const baseMultiplier = 1 + (level - 1) * 0.2;
        const maxMultiplier = isMaxLevel ? 2 : 1;
        
        switch (skillId) {
            case 'rain_of_needles':
                stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                stats.projectileCount = skill.projectileCount + (level - 1) * 2;
                if (isMaxLevel) stats.projectileCount += 5;
                stats.burstCount = skill.burstCount + (level - 1) * 2;
                if (isMaxLevel) stats.burstCount += 3;
                stats.cooldown = skill.cooldown * (1 - (level - 1) * 0.1);
                if (isMaxLevel) stats.cooldown *= 0.5;
                break;
            case 'thunder_dragon':
                stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                stats.duration = skill.duration + (level - 1) * 0.5;
                if (isMaxLevel) stats.duration += 2;
                stats.moveSpeed = skill.moveSpeed * (1 + (level - 1) * 0.15);
                if (isMaxLevel) stats.moveSpeed *= 1.5;
                stats.lightningFrequency = skill.lightningFrequency * (1 - (level - 1) * 0.05);
                if (isMaxLevel) stats.lightningFrequency *= 0.5;
                stats.cooldown = skill.cooldown * (1 - (level - 1) * 0.1);
                if (isMaxLevel) stats.cooldown *= 0.5;
                break;
            case 'ice_storm':
                stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                stats.slowDuration = skill.slowDuration + (level - 1) * 0.3;
                if (isMaxLevel) stats.slowDuration += 1;
                stats.slowAmount = skill.slowAmount + (level - 1) * 0.05;
                if (isMaxLevel) stats.slowAmount = 0.8;
                stats.hailRate = skill.hailRate + (level - 1) * 0.1;
                if (isMaxLevel) stats.hailRate += 0.3;
                stats.cooldown = skill.cooldown * (1 - (level - 1) * 0.1);
                if (isMaxLevel) stats.cooldown *= 0.5;
                break;
        }
        
        return stats;
    }
    
    autoSelectSkill() {
        const availableSkills = this.getRandomSkills(3);
        
        if (availableSkills.length === 0) {
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableSkills.length);
        const selectedSkill = availableSkills[randomIndex];
        
        this.applySkill(selectedSkill);
        this.showSkillNotification(selectedSkill);
    }
    
    showSkillNotification(skill) {
        const notification = document.getElementById('skillNotification');
        if (!notification) return;
        
        const iconEl = document.getElementById('skillNotifIcon');
        const nameEl = document.getElementById('skillNotifName');
        const descEl = document.getElementById('skillNotifDesc');
        
        if (iconEl) iconEl.textContent = skill.icon || '⚡';
        if (nameEl) nameEl.textContent = skill.name;
        
        let displayDesc = skill.description;
        if (skill.type === 'active') {
            const currentLevel = this.skillLevels[skill.id] || 1;
            if (currentLevel > 1) {
                displayDesc = `升级到 ${currentLevel} 级`;
            } else if (currentLevel === 1) {
                const stats = this.getSkillStats(skill.id);
                if (stats) {
                    displayDesc += ` (伤害: ${stats.damage})`;
                }
            }
        }
        
        if (descEl) descEl.textContent = displayDesc;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    createHitParticles(x, y, color) {
        if (this.particles.length >= 80) return;
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(3, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 2,
                color: color,
                lifetime: 0.4,
                maxLifetime: 0.4,
                alpha: 1
            });
        }
    }
    
    createDeathParticles(x, y, color) {
        if (this.particles.length >= 80) return;
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(6, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: color,
                lifetime: 0.7,
                maxLifetime: 0.7,
                alpha: 1
            });
        }
    }
    
    createCollectParticles(x, y, color) {
        if (this.particles.length >= 80) return;
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(4, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 2,
                color: color,
                lifetime: 0.6,
                maxLifetime: 0.6,
                alpha: 1
            });
        }
    }
    
    createGoldParticles(x, y) {
        if (this.particles.length >= 80) return;
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(6, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 2,
                color: '#FFD700',
                lifetime: 0.8,
                maxLifetime: 0.8,
                alpha: 1
            });
        }
    }
    
    createKillExplosion(x, y, color, size = 1) {
        if (this.particles.length >= 80) {
            this.deathExplosions.push({
                x: x,
                y: y,
                radius: 5,
                maxRadius: 50 * size,
                color: color,
                lifetime: 0.3,
                maxLifetime: 0.3
            });
            this.addScreenShake(2 * size, 0.15);
            return;
        }
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(Math.floor(8 * size), maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (3 + Math.random() * 4) * size;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: (2 + Math.random() * 3) * size,
                color: color,
                lifetime: 0.6 + Math.random() * 0.3,
                maxLifetime: 0.6 + Math.random() * 0.3,
                alpha: 1
            });
        }
        
        this.deathExplosions.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 50 * size,
            color: color,
            lifetime: 0.3,
            maxLifetime: 0.3
        });
        
        this.addScreenShake(2 * size, 0.15);
    }
    
    createCritEffect(x, y) {
        if (this.particles.length >= 80) {
            this.glowEffects.push({
                x: x,
                y: y,
                radius: 20,
                maxRadius: 40,
                color: '#FFD700',
                lifetime: 0.2,
                maxLifetime: 0.2
            });
            return;
        }
        
        const maxParticles = Math.max(0, 80 - this.particles.length);
        const particleCount = Math.min(6, maxParticles);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const speed = 4 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random(),
                color: '#FFD700',
                lifetime: 0.4 + Math.random() * 0.2,
                maxLifetime: 0.4 + Math.random() * 0.2,
                alpha: 1
            });
        }
        
        this.glowEffects.push({
            x: x,
            y: y,
            radius: 20,
            maxRadius: 40,
            color: '#FFD700',
            lifetime: 0.2,
            maxLifetime: 0.2
        });
    }
    
    createBulletTrail(bullet) {
        if (!bullet.trailTimer) bullet.trailTimer = 0;
        bullet.trailTimer += 0.016;
        
        if (bullet.trailTimer >= 0.02) {
            this.bulletTrails.push({
                x: bullet.x,
                y: bullet.y,
                radius: bullet.radius * 0.8,
                color: bullet.color,
                lifetime: 0.15,
                maxLifetime: 0.15,
                alpha: 0.8
            });
            bullet.trailTimer = 0;
        }
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
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
    
    addComboKill() {
        this.comboSystem.killsInCombo++;
        this.comboSystem.comboTimer = this.comboSystem.comboTimeout;
        
        if (this.comboSystem.killsInCombo >= 3) {
            this.comboSystem.currentCombo++;
            this.comboSystem.maxCombo = Math.max(this.comboSystem.maxCombo, this.comboSystem.currentCombo);
            
            const bonusMultiplier = 1 + (this.comboSystem.currentCombo * 0.1);
            this.comboSystem.comboMultiplier = bonusMultiplier;
            
            this.floatingTexts.push({
                x: this.width / 2,
                y: this.height / 3,
                text: `${this.comboSystem.currentCombo}x 连击!`,
                color: '#FFD700',
                fontSize: 32,
                lifetime: 1.5,
                maxLifetime: 1.5,
                vy: -30,
                alpha: 1
            });
            
            this.addScreenShake(2, 0.15);
        }
    }
    
    updateComboSystem(dt) {
        if (this.comboSystem.comboTimer > 0) {
            this.comboSystem.comboTimer -= dt;
            if (this.comboSystem.comboTimer <= 0) {
                this.comboSystem.currentCombo = 0;
                this.comboSystem.killsInCombo = 0;
                this.comboSystem.comboMultiplier = 1.0;
            }
        }
    }
    
    updateBulletTrails(dt) {
        for (let i = this.bulletTrails.length - 1; i >= 0; i--) {
            const trail = this.bulletTrails[i];
            trail.lifetime -= dt;
            trail.alpha = trail.lifetime / trail.maxLifetime;
            trail.radius *= 0.98;
            
            if (trail.lifetime <= 0) {
                this.bulletTrails.splice(i, 1);
            }
        }
    }
    
    updateDeathExplosions(dt) {
        for (let i = this.deathExplosions.length - 1; i >= 0; i--) {
            const exp = this.deathExplosions[i];
            exp.lifetime -= dt;
            const progress = 1 - (exp.lifetime / exp.maxLifetime);
            exp.radius = exp.maxRadius * progress;
            exp.alpha = 1 - progress;
            
            if (exp.lifetime <= 0) {
                this.deathExplosions.splice(i, 1);
            }
        }
    }
    
    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.lifetime -= dt;
            ft.alpha = ft.lifetime / ft.maxLifetime;
            ft.y += ft.vy * dt;
            
            if (ft.lifetime <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    updateGlowEffects(dt) {
        for (let i = this.glowEffects.length - 1; i >= 0; i--) {
            const glow = this.glowEffects[i];
            glow.lifetime -= dt;
            const progress = 1 - (glow.lifetime / glow.maxLifetime);
            glow.radius = glow.maxRadius * progress;
            glow.alpha = 1 - progress;
            
            if (glow.lifetime <= 0) {
                this.glowEffects.splice(i, 1);
            }
        }
    }
    
    render() {
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        this.drawPath();
        this.drawParticles();
        this.drawBulletTrails();
        this.drawPowerups();
        this.drawChests();
        this.drawBullets();
        this.drawSkillEffects();
        this.drawEnemies();
        this.drawDeathExplosions();
        this.drawPlayer();
        this.drawGlowEffects();
        this.drawDamageNumbers();
        this.drawFloatingTexts();
        
        this.ctx.restore();
    }
    
    drawBulletTrails() {
        this.bulletTrails.forEach(trail => {
            this.ctx.save();
            this.ctx.globalAlpha = trail.alpha;
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                trail.x, trail.y, 0,
                trail.x, trail.y, trail.radius
            );
            gradient.addColorStop(0, trail.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawDeathExplosions() {
        this.deathExplosions.forEach(exp => {
            this.ctx.save();
            this.ctx.globalAlpha = exp.alpha || 1;
            
            const gradient = this.ctx.createRadialGradient(
                exp.x, exp.y, 0,
                exp.x, exp.y, exp.radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, exp.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawGlowEffects() {
        this.glowEffects.forEach(glow => {
            this.ctx.save();
            this.ctx.globalAlpha = glow.alpha || 1;
            this.ctx.shadowColor = glow.color;
            this.ctx.shadowBlur = glow.radius;
            
            this.ctx.fillStyle = glow.color;
            this.ctx.beginPath();
            this.ctx.arc(glow.x, glow.y, glow.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawFloatingTexts() {
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.font = `bold ${ft.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = ft.color;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        });
    }
    
    drawSkillEffects() {
        this.drawRainOfNeedles();
        this.drawThunderDragon();
        this.drawIceStorm();
    }
    
    drawRainOfNeedles() {
        for (const needle of this.needles) {
            this.ctx.save();
            
            const angle = Math.atan2(needle.vy, needle.vx);
            this.ctx.translate(needle.x, needle.y);
            this.ctx.rotate(angle);
            
            if (needle.isCrit) {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.shadowColor = needle.color;
                this.ctx.shadowBlur = 8;
            }
            
            this.ctx.fillStyle = needle.color;
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0);
            this.ctx.lineTo(-12, -needle.radius - 2);
            this.ctx.lineTo(-8, 0);
            this.ctx.lineTo(-12, needle.radius + 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            if (needle.isCrit) {
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    drawThunderDragon() {
        if (!this.thunderDragon) return;
        
        const time = this.currentTime;
        const segments = this.thunderDragon.bodySegments;
        const pulsePhase = this.thunderDragon.pulsePhase || 0;
        
        if (!segments || segments.length === 0) return;
        
        this.ctx.save();
        
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            const nextSeg = i < segments.length - 1 ? segments[i + 1] : null;
            const prevSeg = i > 0 ? segments[i - 1] : null;
            
            const segScale = seg.scale || (1 - (i / segments.length) * 0.8);
            const isHead = i === 0;
            const isTail = i === segments.length - 1;
            
            this.ctx.save();
            this.ctx.translate(seg.x, seg.y);
            this.ctx.rotate(seg.angle);
            
            const pulse = 0.3 + 0.2 * Math.sin(pulsePhase + i * 0.3);
            const glowSize = 30 + pulse * 20;
            
            if (isHead) {
                const auraGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize * 2);
                auraGrad.addColorStop(0, `rgba(255, 255, 100, ${0.3 + pulse * 0.2})`);
                auraGrad.addColorStop(0.5, `rgba(255, 200, 0, ${0.15 + pulse * 0.1})`);
                auraGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
                this.ctx.fillStyle = auraGrad;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, glowSize * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            if (!isTail) {
                this.ctx.shadowColor = isHead ? '#FFFF00' : '#FFD700';
                this.ctx.shadowBlur = isHead ? 25 + pulse * 15 : 15 + pulse * 10;
                
                const bodyWidth = 22 * segScale;
                const bodyHeight = 14 * segScale;
                
                const bodyGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, bodyWidth);
                if (isHead) {
                    bodyGrad.addColorStop(0, '#FFFFFF');
                    bodyGrad.addColorStop(0.2, '#FFFFAA');
                    bodyGrad.addColorStop(0.5, '#FFD700');
                    bodyGrad.addColorStop(0.8, '#FFA500');
                    bodyGrad.addColorStop(1, '#CD853F');
                } else {
                    bodyGrad.addColorStop(0, `rgba(255, 255, 200, ${0.9 + pulse * 0.1})`);
                    bodyGrad.addColorStop(0.3, `rgba(255, 215, 0, ${0.85 + pulse * 0.1})`);
                    bodyGrad.addColorStop(0.7, `rgba(255, 140, 0, ${0.8 + pulse * 0.1})`);
                    bodyGrad.addColorStop(1, 'rgba(205, 133, 63, 0.7)');
                }
                
                this.ctx.fillStyle = bodyGrad;
                this.ctx.beginPath();
                
                if (isHead) {
                    const headWidth = 28;
                    const headHeight = 20;
                    
                    this.ctx.moveTo(headWidth * 1.1, 0);
                    this.ctx.quadraticCurveTo(headWidth * 0.8, -headHeight * 1.2, 0, -headHeight);
                    this.ctx.quadraticCurveTo(-headWidth * 0.8, -headHeight * 0.8, -headWidth * 0.9, 0);
                    this.ctx.quadraticCurveTo(-headWidth * 0.8, headHeight * 0.8, 0, headHeight);
                    this.ctx.quadraticCurveTo(headWidth * 0.8, headHeight * 1.2, headWidth * 1.1, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                    
                    const nostrilGrad = this.ctx.createRadialGradient(headWidth * 0.8, -4, 0, headWidth * 0.8, -4, 5);
                    nostrilGrad.addColorStop(0, '#FFFFFF');
                    nostrilGrad.addColorStop(0.5, '#87CEEB');
                    nostrilGrad.addColorStop(1, '#4169E1');
                    this.ctx.fillStyle = nostrilGrad;
                    this.ctx.shadowColor = '#00FFFF';
                    this.ctx.shadowBlur = 10 + pulse * 10;
                    this.ctx.beginPath();
                    this.ctx.arc(headWidth * 0.8, -4, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(headWidth * 0.8, 4, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.shadowColor = '#FFFF00';
                    this.ctx.shadowBlur = 15;
                    const eyeGrad = this.ctx.createRadialGradient(headWidth * 0.2, -11, 0, headWidth * 0.2, -11, 8);
                    eyeGrad.addColorStop(0, '#FFFFFF');
                    eyeGrad.addColorStop(0.3, '#FFFF00');
                    eyeGrad.addColorStop(0.7, '#FF4500');
                    eyeGrad.addColorStop(1, '#8B0000');
                    this.ctx.fillStyle = eyeGrad;
                    this.ctx.beginPath();
                    this.ctx.ellipse(headWidth * 0.2, -11, 7, 9, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.ellipse(headWidth * 0.2, 11, 7, 9, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#000000';
                    this.ctx.shadowBlur = 0;
                    this.ctx.beginPath();
                    this.ctx.arc(headWidth * 0.25, -11, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(headWidth * 0.25, 11, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.shadowBlur = 15;
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.lineWidth = 4;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(headWidth * 0.0, -18);
                    this.ctx.quadraticCurveTo(headWidth * -0.3, -30, headWidth * -0.2, -38);
                    this.ctx.quadraticCurveTo(headWidth * -0.1, -45, headWidth * 0.05, -42);
                    this.ctx.quadraticCurveTo(headWidth * 0.0, -35, headWidth * 0.1, -22);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(headWidth * 0.0, 18);
                    this.ctx.quadraticCurveTo(headWidth * -0.3, 30, headWidth * -0.2, 38);
                    this.ctx.quadraticCurveTo(headWidth * -0.1, 45, headWidth * 0.05, 42);
                    this.ctx.quadraticCurveTo(headWidth * 0.0, 35, headWidth * 0.1, 22);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.shadowColor = '#FFFFFF';
                    this.ctx.shadowBlur = 20;
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(headWidth * -0.3, -25);
                    this.ctx.lineTo(headWidth * -0.4, -35);
                    this.ctx.lineTo(headWidth * -0.3, -40);
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(headWidth * -0.3, 25);
                    this.ctx.lineTo(headWidth * -0.4, 35);
                    this.ctx.lineTo(headWidth * -0.3, 40);
                    this.ctx.stroke();
                    
                } else if (isTail) {
                    const tailWidth = 10 * segScale;
                    const tailHeight = 6 * segScale;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(tailWidth * 0.8, 0);
                    this.ctx.quadraticCurveTo(tailWidth * 0.3, -tailHeight, -tailWidth * 2, 0);
                    this.ctx.quadraticCurveTo(tailWidth * 0.3, tailHeight, tailWidth * 0.8, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.shadowColor = '#FFFF00';
                    this.ctx.shadowBlur = 15;
                    this.ctx.fillStyle = `rgba(255, 255, 100, ${0.5 + pulse * 0.3})`;
                    this.ctx.beginPath();
                    this.ctx.arc(-tailWidth * 2, 0, 3 + pulse * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                } else {
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 5;
                    this.ctx.fillStyle = `rgba(205, 133, 63, ${0.6 + pulse * 0.2})`;
                    
                    for (let s = -1; s <= 1; s++) {
                        const sx = s * 10 * segScale;
                        const sy = (s % 2 === 0 ? 0 : 6 * segScale);
                        const scale = (s === 0 ? 1 : 0.7) * segScale;
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(sx, -bodyHeight * 0.8 * scale + sy);
                        this.ctx.lineTo(sx + 3 * scale, -bodyHeight * 1.5 * scale + sy);
                        this.ctx.lineTo(sx + 6 * scale, -bodyHeight * 0.8 * scale + sy);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(sx, bodyHeight * 0.8 * scale - sy);
                        this.ctx.lineTo(sx + 3 * scale, bodyHeight * 1.5 * scale - sy);
                        this.ctx.lineTo(sx + 6 * scale, bodyHeight * 0.8 * scale - sy);
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                    
                    this.ctx.shadowColor = '#FFFFFF';
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.2})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(-5, -bodyHeight * 0.3, 6, 3, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.ellipse(-5, bodyHeight * 0.3, 6, 3, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
            } else {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.3})`;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 8 * segScale, 5 * segScale, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        if (this.thunderDragon.lightningEffects) {
            const toRemove = [];
            for (let i = 0; i < this.thunderDragon.lightningEffects.length; i++) {
                const effect = this.thunderDragon.lightningEffects[i];
                effect.life -= 1/60;
                
                if (effect.life <= 0) {
                    toRemove.push(i);
                    continue;
                }
                
                const alpha = effect.life / effect.maxLife;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.shadowColor = effect.color || '#FFFFFF';
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = effect.color || '#FFFFFF';
                this.ctx.lineWidth = 2 + alpha * 2;
                
                this.ctx.beginPath();
                if (effect.segments && effect.segments.length > 0) {
                    this.ctx.moveTo(effect.segments[0].x, effect.segments[0].y);
                    for (let j = 1; j < effect.segments.length; j++) {
                        this.ctx.lineTo(effect.segments[j].x, effect.segments[j].y);
                    }
                } else {
                    this.ctx.moveTo(effect.startX, effect.startY);
                    this.ctx.lineTo(effect.endX, effect.endY);
                }
                this.ctx.stroke();
                
                this.ctx.globalAlpha = alpha * 0.5;
                this.ctx.lineWidth = 5;
                this.ctx.stroke();
                
                this.ctx.restore();
            }
            
            for (let i = toRemove.length - 1; i >= 0; i--) {
                this.thunderDragon.lightningEffects.splice(toRemove[i], 1);
            }
        }
        
        if (this.thunderDragon.chainLightningEffects) {
            const chainToRemove = [];
            for (let i = 0; i < this.thunderDragon.chainLightningEffects.length; i++) {
                const effect = this.thunderDragon.chainLightningEffects[i];
                effect.life -= 1/60;
                
                if (effect.life <= 0) {
                    chainToRemove.push(i);
                    continue;
                }
                
                const alpha = effect.life / effect.maxLife;
                const time = this.currentTime;
                
                this.ctx.save();
                
                if (effect.segments && effect.segments.length > 0) {
                    for (let s = 0; s < effect.segments.length; s++) {
                        const segPath = effect.segments[s];
                        if (!segPath || segPath.length < 2) continue;
                        
                        const branchCount = 2;
                        for (let b = 0; b < branchCount; b++) {
                            const branchAlpha = alpha * (0.7 - b * 0.25);
                            const offsetFactor = (b + 1) * 0.3;
                            
                            this.ctx.globalAlpha = branchAlpha;
                            this.ctx.strokeStyle = b === 0 ? '#FFFFFF' : '#87CEEB';
                            this.ctx.lineWidth = b === 0 ? 3 + alpha * 2 : 2 + alpha;
                            this.ctx.shadowColor = b === 0 ? '#FFFFFF' : '#87CEEB';
                            this.ctx.shadowBlur = b === 0 ? 20 : 12;
                            
                            this.ctx.beginPath();
                            this.ctx.moveTo(segPath[0].x, segPath[0].y);
                            
                            for (let p = 1; p < segPath.length; p++) {
                                const perpAngle = Math.atan2(
                                    segPath[p].y - segPath[p - 1].y,
                                    segPath[p].x - segPath[p - 1].x
                                ) + Math.PI / 2;
                                
                                const offset = Math.sin(time * 20 + p * 2 + b * 3) * 8 * offsetFactor;
                                
                                const midX = (segPath[p - 1].x + segPath[p].x) / 2;
                                const midY = (segPath[p - 1].y + segPath[p].y) / 2;
                                
                                this.ctx.quadraticCurveTo(
                                    midX + Math.cos(perpAngle) * offset,
                                    midY + Math.sin(perpAngle) * offset,
                                    segPath[p].x,
                                    segPath[p].y
                                );
                            }
                            this.ctx.stroke();
                            
                            if (b === 0) {
                                this.ctx.globalAlpha = branchAlpha * 0.4;
                                this.ctx.lineWidth = 8;
                                this.ctx.shadowBlur = 30;
                                this.ctx.stroke();
                            }
                        }
                        
                        for (let p = 0; p < segPath.length; p++) {
                            const sparkChance = p === 0 || p === segPath.length - 1 ? 0.8 : 0.3;
                            if (Math.random() < sparkChance) {
                                const sparkSize = (p === 0 || p === segPath.length - 1) ? 4 + alpha * 3 : 2 + alpha * 2;
                                const sparkX = segPath[p].x + (Math.random() - 0.5) * 10;
                                const sparkY = segPath[p].y + (Math.random() - 0.5) * 10;
                                
                                this.ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4);
                                this.ctx.fillStyle = Math.random() < 0.6 ? '#FFFFFF' : '#87CEEB';
                                this.ctx.shadowColor = this.ctx.fillStyle;
                                this.ctx.shadowBlur = 12;
                                this.ctx.beginPath();
                                this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                                this.ctx.fill();
                            }
                        }
                    }
                }
                
                this.ctx.restore();
            }
            
            for (let i = chainToRemove.length - 1; i >= 0; i--) {
                this.thunderDragon.chainLightningEffects.splice(chainToRemove[i], 1);
            }
        }
        
        const headSeg = segments[0];
        for (let p = 0; p < 2; p++) {
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDist = 20 + Math.random() * 40;
            const sparkX = headSeg.x + Math.cos(sparkAngle) * sparkDist;
            const sparkY = headSeg.y + Math.sin(sparkAngle) * sparkDist;
            
            this.ctx.save();
            this.ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            this.ctx.fillStyle = Math.random() < 0.5 ? '#FFFFFF' : '#87CEEB';
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(sparkX, sparkY, 2 + Math.random() * 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawIceStorm() {
        const time = this.currentTime;
        
        if (this.iceStormActive) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.1;
            for (let i = 0; i < 20; i++) {
                const x = ((time * 50 + i * 100) % (this.width + 200)) - 100;
                const y = (time * 100 + i * 50) % this.height;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }
        
        for (const hail of this.hailStones) {
            this.ctx.save();
            
            if (hail.isCrit) {
                this.ctx.shadowColor = '#FFFFFF';
                this.ctx.shadowBlur = 20;
            } else {
                this.ctx.shadowColor = '#87CEEB';
                this.ctx.shadowBlur = 10;
            }
            
            const gradient = this.ctx.createRadialGradient(
                hail.x, hail.y, 0,
                hail.x, hail.y, hail.radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, hail.color);
            gradient.addColorStop(1, '#4169E1');
            
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2 + time * 3;
                const x = hail.x + Math.cos(angle) * hail.radius;
                const y = hail.y + Math.sin(angle) * hail.radius;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            if (hail.isCrit) {
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.strokeStyle = '#ADD8E6';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.beginPath();
            this.ctx.arc(hail.x, hail.y - 5, hail.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    drawPath() {
        if (!this.path || this.path.length < 2) return;
        
        this.ctx.save();
        
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        this.ctx.stroke();
        
        if (this.pathBoundaries && this.pathBoundaries.channels) {
            const cfg = window.GameConfig || {};
            const levelCfg = cfg.level || {};
            const channelHeight = levelCfg.channelHeight || 120;
            const turnRadius = levelCfg.turnRadius || 40;
            
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            
            for (let i = 0; i < this.pathBoundaries.channels.length; i++) {
                const channel = this.pathBoundaries.channels[i];
                const rowY = channel.rowY;
                const isEvenRow = channel.isEvenRow;
                
                const nextRowY = rowY + channelHeight;
                const turnStartY = nextRowY - turnRadius;
                
                if (isEvenRow) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pathBoundaries.rightBound, rowY);
                    this.ctx.lineTo(this.pathBoundaries.rightBound, turnStartY);
                    this.ctx.stroke();
                } else {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pathBoundaries.leftBound, rowY);
                    this.ctx.lineTo(this.pathBoundaries.leftBound, turnStartY);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 1;
            
            for (const y of this.pathBoundaries.channelLines) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.pathBoundaries.leftBound, y);
                this.ctx.lineTo(this.pathBoundaries.rightBound, y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
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
                    
                    this.ctx.save();
                    this.ctx.translate(segment.x, segment.y);
                    
                    const healthPercent = segment.health / segment.maxHealth;
                    const baseHeight = i === 0 ? 28 : 22;
                    const baseWidth = i === 0 ? 60 : 50;
                    
                    const segHeight = baseHeight;
                    const segWidth = baseWidth * (0.5 + healthPercent * 0.5);
                    
                    const halfWidth = segWidth / 2;
                    const halfHeight = segHeight / 2;
                    
                    this.ctx.shadowColor = enemy.color;
                    this.ctx.shadowBlur = 15;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(-halfWidth + halfHeight, -halfHeight);
                    this.ctx.lineTo(halfWidth - halfHeight, -halfHeight);
                    this.ctx.arcTo(halfWidth, -halfHeight, halfWidth, halfHeight, halfHeight);
                    this.ctx.lineTo(halfWidth, halfHeight - halfHeight);
                    this.ctx.arcTo(halfWidth, halfHeight, -halfWidth, halfHeight, halfHeight);
                    this.ctx.lineTo(-halfWidth + halfHeight, halfHeight);
                    this.ctx.arcTo(-halfWidth, halfHeight, -halfWidth, -halfHeight, halfHeight);
                    this.ctx.lineTo(-halfWidth, -halfHeight + halfHeight);
                    this.ctx.arcTo(-halfWidth, -halfHeight, halfWidth, -halfHeight, halfHeight);
                    this.ctx.closePath();
                    
                    const gradient = this.ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
                    gradient.addColorStop(0, this.darkenColor(enemy.color, 0.3));
                    gradient.addColorStop(0.5, enemy.color);
                    gradient.addColorStop(1, this.darkenColor(enemy.color, 0.3));
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                    
                    const innerPadding = 4;
                    const innerHalfWidth = halfWidth - innerPadding;
                    const innerHalfHeight = halfHeight - innerPadding;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(-innerHalfWidth + innerHalfHeight, -innerHalfHeight);
                    this.ctx.lineTo(innerHalfWidth - innerHalfHeight, -innerHalfHeight);
                    this.ctx.arcTo(innerHalfWidth, -innerHalfHeight, innerHalfWidth, innerHalfHeight, innerHalfHeight);
                    this.ctx.lineTo(innerHalfWidth, innerHalfHeight - innerHalfHeight);
                    this.ctx.arcTo(innerHalfWidth, innerHalfHeight, -innerHalfWidth, innerHalfHeight, innerHalfHeight);
                    this.ctx.lineTo(-innerHalfWidth + innerHalfHeight, innerHalfHeight);
                    this.ctx.arcTo(-innerHalfWidth, innerHalfHeight, -innerHalfWidth, -innerHalfHeight, innerHalfHeight);
                    this.ctx.lineTo(-innerHalfWidth, -innerHalfHeight + innerHalfHeight);
                    this.ctx.arcTo(-innerHalfWidth, -innerHalfHeight, innerHalfWidth, -innerHalfHeight, innerHalfHeight);
                    this.ctx.closePath();
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    this.ctx.fill();
                    
                    const barWidth = (innerHalfWidth * 2) * healthPercent;
                    const barHeight = innerHalfHeight * 2 - 4;
                    
                    if (barWidth > 0) {
                        this.ctx.beginPath();
                        this.ctx.rect(-innerHalfWidth, -barHeight / 2, barWidth, barHeight);
                        
                        const healthColor = healthPercent > 0.5 ? '#44FF44' : healthPercent > 0.25 ? '#FFFF44' : '#FF4444';
                        const healthGradient = this.ctx.createLinearGradient(0, -barHeight / 2, 0, barHeight / 2);
                        healthGradient.addColorStop(0, healthColor);
                        healthGradient.addColorStop(0.5, this.lightenColor(healthColor, 0.3));
                        healthGradient.addColorStop(1, healthColor);
                        this.ctx.fillStyle = healthGradient;
                        this.ctx.fill();
                    }
                    
                    if (segment.hasChest) {
                        this.ctx.shadowColor = '#FFD700';
                        this.ctx.shadowBlur = 20;
                        this.ctx.strokeStyle = '#FFD700';
                        this.ctx.lineWidth = 3;
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(-halfWidth + halfHeight, -halfHeight);
                        this.ctx.lineTo(halfWidth - halfHeight, -halfHeight);
                        this.ctx.arcTo(halfWidth, -halfHeight, halfWidth, halfHeight, halfHeight);
                        this.ctx.lineTo(halfWidth, halfHeight - halfHeight);
                        this.ctx.arcTo(halfWidth, halfHeight, -halfWidth, halfHeight, halfHeight);
                        this.ctx.lineTo(-halfWidth + halfHeight, halfHeight);
                        this.ctx.arcTo(-halfWidth, halfHeight, -halfWidth, -halfHeight, halfHeight);
                        this.ctx.lineTo(-halfWidth, -halfHeight + halfHeight);
                        this.ctx.arcTo(-halfWidth, -halfHeight, halfWidth, -halfHeight, halfHeight);
                        this.ctx.closePath();
                        this.ctx.stroke();
                        
                        this.ctx.shadowBlur = 0;
                    }
                    
                    if (i === 0) {
                        this.ctx.font = `${segHeight * 0.8}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('🐲', 0, 0);
                    } else if (segment.hasChest) {
                        this.ctx.font = `${segHeight * 0.7}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('📦', 0, 0);
                    } else {
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = `bold ${Math.min(segHeight * 0.5, 14)}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        const healthText = Math.ceil(segment.health) + '/' + Math.ceil(segment.maxHealth);
                        this.ctx.fillText(healthText, 0, 0);
                    }
                    
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
            
            const scale = dn.scale || 1;
            this.ctx.translate(dn.x, dn.y);
            this.ctx.scale(scale, scale);
            
            const fontSize = dn.isCrit ? 28 : 20;
            this.ctx.font = dn.isCrit ? `bold ${fontSize}px Arial` : `bold ${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (dn.isCrit) {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
            }
            
            let textColor = '#FF4444';
            let text = `${dn.value}`;
            
            if (dn.isCrit) {
                textColor = '#FFD700';
                text = `暴击! ${dn.value}`;
            } else if (dn.isReduced) {
                textColor = '#888888';
            }
            
            this.ctx.fillStyle = textColor;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            
            this.ctx.strokeText(text, 0, 0);
            this.ctx.fillText(text, 0, 0);
            
            this.ctx.shadowBlur = 0;
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
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + amount));
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
