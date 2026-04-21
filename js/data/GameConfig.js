(function() {
    'use strict';

    // ==========================================
    // 游戏核心配置文件
    // 包含敌人类型、技能数据、角色数据、难度预设等
    // ==========================================
    const GameConfig = {
        
        // ==========================================
        // 敌人类型配置
        // ==========================================
        enemyTypes: {
            
            // 普通敌人
            dragon: {
                name: '青龙',
                color: '#44aaff',
                health: 1000,              // 血量
                speed: 0.8,               // 移动速度
                damage: 5,                // 伤害
                goldValue: 0,            // 金币掉落
                scoreValue: 100,          // 得分
                xpValue: 10               // 经验值
            },
            
            phoenix: {
                name: '朱雀',
                color: '#ff4444',
                health: 80,
                speed: 1.2,               // 快速敌人
                damage: 5,
                goldValue: 12,
                scoreValue: 120,
                xpValue: 12
            },
            
            turtle: {
                name: '玄武',
                color: '#44aa44',
                health: 200,              // 高血量
                speed: 0.4,               // 慢速
                damage: 10,
                goldValue: 25,
                scoreValue: 150,
                xpValue: 15
            },
            
            tiger: {
                name: '白虎',
                color: '#aaaaaa',
                health: 150,
                speed: 1.0,
                damage: 8,
                goldValue: 20,
                scoreValue: 130,
                xpValue: 13
            },
            
            qilin: {
                name: '麒麟',
                color: '#ffaa00',
                health: 120,
                speed: 1.5,               // 最快敌人
                damage: 12,
                goldValue: 30,
                scoreValue: 160,
                xpValue: 16
            },
            
            // BOSS 敌人
            boss_dragon: {
                name: '龙王',
                color: '#ff00ff',
                health: 1000,             // 超高血量
                speed: 0.6,
                damage: 30,
                goldValue: 200,
                scoreValue: 1000,
                xpValue: 100,
                isBoss: true              // 标记为BOSS
            },
            
            boss_phoenix: {
                name: '凤凰皇',
                color: '#ff6600',
                health: 800,
                speed: 1.0,
                damage: 35,
                goldValue: 250,
                scoreValue: 1200,
                xpValue: 120,
                isBoss: true
            }
        },

        // ==========================================
        // 技能数据配置
        // ==========================================
        skillData: {
            
            // ==========================================
            // 主动技能 (type: active)
            // ==========================================
            
            // 火球术 - 普通品质
            fireball: {
                id: 'fireball',
                name: '火球术',
                description: '发射一枚火球，造成大范围伤害',
                icon: '🔥',
                type: 'active',           // 主动技能
                rarity: 'common',         // 品质：普通
                tier: 1,                  // 等级
                price: 0,                 // 购买价格（0=免费）
                unlocked: true,           // 是否解锁
                cooldown: 8,              // 冷却时间（秒）
                damage: 50,               // 伤害
                radius: 100,              // 伤害范围半径
                maxDistance: 500,         // 最大发射距离
                color: '#ff6600',
                effects: [
                    { type: 'damage', value: 50 },
                    { type: 'aoe_radius', value: 100 }
                ]
            },
            
            // 落雷 - 普通品质
            thunder: {
                id: 'thunder',
                name: '落雷',
                description: '召唤落雷击中目标，有几率眩晕',
                icon: '⚡',
                type: 'active',
                rarity: 'common',
                tier: 1,
                price: 50,
                unlocked: false,
                cooldown: 5,
                damage: 35,
                stunChance: 0.3,         // 眩晕概率 30%
                stunDuration: 1.5,        // 眩晕持续时间
                color: '#ffff00',
                effects: [
                    { type: 'damage', value: 35 },
                    { type: 'stun_chance', value: 0.3 }
                ]
            },
            
            // 冰霜护盾 - 稀有品质
            iceWall: {
                id: 'iceWall',
                name: '冰霜护盾',
                description: '生成冰霜护盾吸收伤害，减速接触敌人',
                icon: '❄️',
                type: 'active',
                rarity: 'rare',           // 品质：稀有
                tier: 2,
                price: 100,
                unlocked: false,
                cooldown: 15,
                shieldAmount: 100,        // 护盾可吸收伤害
                slowEffect: 0.3,          // 减速效果 30%
                slowDuration: 5,          // 减速持续时间
                color: '#00ccff',
                effects: [
                    { type: 'shield', value: 100 },
                    { type: 'slow_effect', value: 0.3 }
                ]
            },
            
            // 治愈之光 - 稀有品质
            heal: {
                id: 'heal',
                name: '治愈之光',
                description: '恢复生命值',
                icon: '💚',
                type: 'active',
                rarity: 'rare',
                tier: 2,
                price: 80,
                unlocked: false,
                cooldown: 12,
                healAmount: 50,           // 恢复血量
                color: '#44ff44',
                effects: [
                    { type: 'heal', value: 50 }
                ]
            },
            
            // 疾风步 - 稀有品质
            dash: {
                id: 'dash',
                name: '疾风步',
                description: '向鼠标方向冲刺，短暂无敌',
                icon: '💨',
                type: 'active',
                rarity: 'rare',
                tier: 2,
                price: 120,
                unlocked: false,
                cooldown: 6,
                dashDistance: 200,        // 冲刺距离
                invulnerableDuration: 0.5, // 无敌时间
                color: '#88ffaa',
                effects: [
                    { type: 'invulnerable', value: 0.5 }
                ]
            },
            
            // 风暴漩涡 - 史诗品质
            vortex: {
                id: 'vortex',
                name: '风暴漩涡',
                description: '在目标位置生成漩涡，持续牵引敌人',
                icon: '🌀',
                type: 'active',
                rarity: 'epic',           // 品质：史诗
                tier: 3,
                price: 200,
                unlocked: false,
                cooldown: 20,
                pullRadius: 200,          // 牵引范围
                pullDuration: 4,          // 持续时间
                damagePerSecond: 10,      // 每秒伤害
                color: '#aa66ff',
                effects: [
                    { type: 'aoe_pull', value: 200 },
                    { type: 'dot_damage', value: 10 }
                ]
            },
            
            // 陨石天降 - 传说品质
            meteor: {
                id: 'meteor',
                name: '陨石天降',
                description: '召唤陨石轰击战场，造成巨额伤害',
                icon: '☄️',
                type: 'active',
                rarity: 'legendary',      // 品质：传说
                tier: 4,
                price: 500,
                unlocked: false,
                cooldown: 25,
                damage: 200,
                radius: 150,
                burnDamage: 30,           // 燃烧伤害
                burnDuration: 5,          // 燃烧持续时间
                color: '#ff4400',
                effects: [
                    { type: 'damage', value: 200 },
                    { type: 'burn_effect', value: 30 }
                ]
            },
            
            // 时间静止 - 传说品质
            timeStop: {
                id: 'timeStop',
                name: '时间静止',
                description: '短暂停止时间内所有敌人的行动',
                icon: '⏸️',
                type: 'active',
                rarity: 'legendary',
                tier: 4,
                price: 600,
                unlocked: false,
                cooldown: 30,
                stopDuration: 3,          // 静止时间
                color: '#aaffff',
                effects: [
                    { type: 'stun_all', value: 3 }
                ]
            },
            
            // 雷龙 - 传说品质
            thunderDragon: {
                id: 'thunderDragon',
                name: '雷龙',
                description: '召唤雷龙对直线范围造成毁灭性伤害',
                icon: '🐉',
                type: 'active',
                rarity: 'legendary',
                tier: 4,
                price: 400,
                unlocked: false,
                cooldown: 18,
                damage: 150,
                width: 100,              // 攻击宽度
                length: 800,             // 攻击长度
                color: '#6666ff',
                effects: [
                    { type: 'line_damage', value: 150 },
                    { type: 'stun_chance', value: 0.5 }
                ]
            },
            
            // 暴风雪 - 传说品质
            iceStorm: {
                id: 'iceStorm',
                name: '暴风雪',
                description: '召唤暴风雪，持续伤害并冻结范围内敌人',
                icon: '🌨️',
                type: 'active',
                rarity: 'legendary',
                tier: 4,
                price: 450,
                unlocked: false,
                cooldown: 22,
                damage: 80,
                radius: 200,
                duration: 3,
                freezeChance: 0.4,       // 冻结概率
                freezeDuration: 2,        // 冻结持续时间
                color: '#aaddff',
                effects: [
                    { type: 'aoe_damage', value: 80 },
                    { type: 'freeze_chance', value: 0.4 }
                ]
            },
            
            // 飞针如雨 - 史诗品质
            rainOfNeedles: {
                id: 'rainOfNeedles',
                name: '飞针如雨',
                description: '向周围发射大量毒针，造成伤害并中毒',
                icon: '🎯',
                type: 'active',
                rarity: 'epic',
                tier: 3,
                price: 300,
                unlocked: false,
                cooldown: 12,
                damage: 40,
                needleCount: 20,         // 针的数量
                poisonDamage: 15,         // 中毒伤害
                poisonDuration: 5,        // 中毒持续时间
                color: '#88ff88',
                effects: [
                    { type: 'multi_projectile', value: 20 },
                    { type: 'poison_effect', value: 15 }
                ]
            },
            
            // 精准射击 - 稀有品质
            preciseShot: {
                id: 'preciseShot',
                name: '精准射击',
                description: '下一次攻击必定暴击',
                icon: '🎯',
                type: 'active',
                rarity: 'rare',
                tier: 2,
                price: 150,
                unlocked: false,
                cooldown: 10,
                color: '#ffd700',
                effects: [
                    { type: 'guaranteed_crit', value: 1 }
                ]
            },
            
            // 狂暴 - 史诗品质
            rage: {
                id: 'rage',
                name: '狂暴',
                description: '进入狂暴状态，大幅提升攻击速度',
                icon: '😤',
                type: 'active',
                rarity: 'epic',
                tier: 3,
                price: 250,
                unlocked: false,
                cooldown: 25,
                duration: 8,
                attackSpeedBonus: 1,     // 攻速加成 100%
                color: '#ff4444',
                effects: [
                    { type: 'attack_speed_buff', value: 1 }
                ]
            },
            
            // 坚守 - 稀有品质
            fortify: {
                id: 'fortify',
                name: '坚守',
                description: '进入坚守姿态，获得伤害减免',
                icon: '🛡️',
                type: 'active',
                rarity: 'rare',
                tier: 2,
                price: 130,
                unlocked: false,
                cooldown: 18,
                duration: 6,
                damageReduction: 0.5,    // 伤害减免 50%
                color: '#8888ff',
                effects: [
                    { type: 'damage_reduction_buff', value: 0.5 }
                ]
            },
            
            // 嗜血 - 史诗品质
            bloodlust: {
                id: 'bloodlust',
                name: '嗜血',
                description: '激活嗜血本能，攻击附带吸血效果',
                icon: '🩸',
                type: 'active',
                rarity: 'epic',
                tier: 3,
                price: 280,
                unlocked: false,
                cooldown: 20,
                duration: 10,
                lifestealBonus: 0.3,     // 吸血 30%
                color: '#880000',
                effects: [
                    { type: 'lifesteal_buff', value: 0.3 }
                ]
            },
            
            // ==========================================
            // 被动技能 (type: passive)
            // ==========================================
            
            // 鹰眼 - 普通品质
            eagleEye: {
                id: 'eagleEye',
                name: '鹰眼',
                description: '解锁鹰眼视野，提升暴击几率',
                icon: '🦅',
                type: 'passive',          // 被动技能
                rarity: 'common',
                tier: 1,
                price: 80,
                unlocked: false,
                effects: [
                    { type: 'crit_chance', value: 0.05 }  // 暴击几率 +5%
                ]
            },
            
            // 狂战士 - 稀有品质
            berserker: {
                id: 'berserker',
                name: '狂战士',
                description: '生命值越低，造成伤害越高',
                icon: '⚔️',
                type: 'passive',
                rarity: 'rare',
                tier: 2,
                price: 150,
                unlocked: false,
                effects: [
                    { type: 'low_hp_damage_bonus', value: 0.5 }
                ]
            },
            
            // 吸血鬼 - 稀有品质
            vampire: {
                id: 'vampire',
                name: '吸血鬼',
                description: '每次击杀敌人恢复生命值',
                icon: '🧛',
                type: 'passive',
                rarity: 'rare',
                tier: 2,
                price: 180,
                unlocked: false,
                effects: [
                    { type: 'kill_heal', value: 10 }     // 击杀恢复10点血
                ]
            },
            
            // 泰坦 - 稀有品质
            titan: {
                id: 'titan',
                name: '泰坦',
                description: '大幅增加最大生命值',
                icon: '🗿',
                type: 'passive',
                rarity: 'rare',
                tier: 2,
                price: 160,
                unlocked: false,
                effects: [
                    { type: 'max_health', value: 50 }    // 最大生命值 +50
                ]
            },
            
            // 暗影 - 史诗品质
            shadow: {
                id: 'shadow',
                name: '暗影',
                description: '有几率闪避敌人攻击',
                icon: '👤',
                type: 'passive',
                rarity: 'epic',
                tier: 3,
                price: 220,
                unlocked: false,
                effects: [
                    { type: 'dodge_chance', value: 0.15 } // 闪避几率 15%
                ]
            },
            
            // 贤者 - 史诗品质
            sage: {
                id: 'sage',
                name: '贤者',
                description: '减少所有技能冷却时间',
                icon: '🧙',
                type: 'passive',
                rarity: 'epic',
                tier: 3,
                price: 250,
                unlocked: false,
                effects: [
                    { type: 'cooldown_reduction', value: 0.2 } // 冷却减少 20%
                ]
            },
            
            // 凤凰 - 传说品质
            phoenix: {
                id: 'phoenix',
                name: '凤凰',
                description: '死亡后自动复活',
                icon: '🔥',
                type: 'passive',
                rarity: 'legendary',
                tier: 4,
                price: 500,
                unlocked: false,
                effects: [
                    { type: 'revive', value: 1 }          // 复活次数 +1
                ]
            },
            
            // 刽子手 - 稀有品质
            executioner: {
                id: 'executioner',
                name: '刽子手',
                description: '对低血量敌人造成额外伤害',
                icon: '🪓',
                type: 'passive',
                rarity: 'rare',
                tier: 2,
                price: 170,
                unlocked: false,
                effects: [
                    { type: 'execute_damage', value: 0.5 } // 斩杀伤害 +50%
                ]
            },
            
            // 狙击手 - 史诗品质
            sniper: {
                id: 'sniper',
                name: '狙击手',
                description: '距离目标越远，伤害越高',
                icon: '🎯',
                type: 'passive',
                rarity: 'epic',
                tier: 3,
                price: 240,
                unlocked: false,
                effects: [
                    { type: 'distance_damage_bonus', value: 0.5 }
                ]
            },
            
            // 角斗士 - 史诗品质
            gladiator: {
                id: 'gladiator',
                name: '角斗士',
                description: '连续击杀敌人获得伤害加成',
                icon: '⚔️',
                type: 'passive',
                rarity: 'epic',
                tier: 3,
                price: 260,
                unlocked: false,
                effects: [
                    { type: 'combo_damage_bonus', value: 0.1 } // 连击伤害 +10%
                ]
            },
            
            // 符文大师 - 传说品质
            runeMaster: {
                id: 'runeMaster',
                name: '符文大师',
                description: '技能伤害大幅提升',
                icon: '🔮',
                type: 'passive',
                rarity: 'legendary',
                tier: 4,
                price: 450,
                unlocked: false,
                effects: [
                    { type: 'skill_damage', value: 0.3 }   // 技能伤害 +30%
                ]
            },
            
            // 不朽 - 传说品质
            immortal: {
                id: 'immortal',
                name: '不朽',
                description: '获得巨额减伤和生命恢复',
                icon: '💎',
                type: 'passive',
                rarity: 'legendary',
                tier: 4,
                price: 550,
                unlocked: false,
                effects: [
                    { type: 'damage_reduction', value: 0.2 }, // 伤害减免 20%
                    { type: 'regeneration', value: 5 }          // 每秒恢复5点血
                ]
            }
        },

        // ==========================================
        // 角色数据配置
        // ==========================================
        characters: {
            
            // 默认角色 - 弓箭手
            default: {
                id: 'default',
                name: '弓箭手',
                description: '平衡型角色，适合新手',
                color: '#4488ff',
                price: 0,
                unlocked: true,
                stats: {
                    health: 0,              // 生命值加成
                    damage: 0,              // 伤害加成
                    speed: 0                // 移动速度加成
                },
                passive: null,             // 无被动技能
                startSkill: null           // 无初始技能
            },
            
            // 战士
            warrior: {
                id: 'warrior',
                name: '战士',
                description: '高生命值，近战专家',
                color: '#ff4444',
                price: 500,
                unlocked: false,
                stats: {
                    health: 100,           // +100 生命值
                    damage: 0,
                    speed: -0.1            // -10% 移动速度
                },
                passive: {
                    type: 'health_based_reduction',
                    description: '每损失25%生命值，获得10%减伤',
                    threshold: 0.25,
                    reductionPerThreshold: 0.1
                },
                startSkill: 'fortify'      // 初始技能：坚守
            },
            
            // 刺客
            assassin: {
                id: 'assassin',
                name: '刺客',
                description: '高暴击，高移动速度',
                color: '#aa44ff',
                price: 800,
                unlocked: false,
                stats: {
                    health: -50,           // -50 生命值
                    damage: 5,             // +5 伤害
                    speed: 0.2             // +20% 移动速度
                },
                passive: {
                    type: 'backstab_damage',
                    description: '从后方攻击造成150%伤害'
                },
                startSkill: 'dash'          // 初始技能：疾风步
            },
            
            // 法师
            mage: {
                id: 'mage',
                name: '法师',
                description: '技能伤害提升，冷却减少',
                color: '#44aaff',
                price: 600,
                unlocked: false,
                stats: {
                    health: -30,           // -30 生命值
                    damage: 0,
                    speed: 0
                },
                passive: {
                    type: 'skill_mastery',
                    description: '技能伤害+20%，冷却-15%',
                    skillDamageBonus: 0.2,
                    cooldownReduction: 0.15
                },
                startSkill: 'fireball'      // 初始技能：火球术
            }
        },

        // ==========================================
        // 难度预设配置
        // ==========================================
        difficultyPresets: {
            
            // 简单难度
            easy: {
                id: 'easy',
                name: '简单',
                description: '适合休闲玩家',
                healthMultiplier: 0.7,     // 敌人血量 ×0.7
                speedMultiplier: 0.8,      // 敌人速度 ×0.8
                damageMultiplier: 0.8,     // 敌人伤害 ×0.8
                goldMultiplier: 1.2,       // 金币收益 ×1.2
                xpMultiplier: 1.2,         // 经验收益 ×1.2
                waveInterval: 1.5          // 波次间隔 1.5秒
            },
            
            // 普通难度
            normal: {
                id: 'normal',
                name: '普通',
                description: '标准游戏体验',
                healthMultiplier: 1,
                speedMultiplier: 1,
                damageMultiplier: 1,
                goldMultiplier: 1,
                xpMultiplier: 1,
                waveInterval: 1.2
            },
            
            // 困难难度
            hard: {
                id: 'hard',
                name: '困难',
                description: '挑战你的极限',
                healthMultiplier: 1.3,     // 敌人血量 ×1.3
                speedMultiplier: 1.1,
                damageMultiplier: 1.2,
                goldMultiplier: 1.5,       // 金币收益 ×1.5
                xpMultiplier: 1.5,
                waveInterval: 1
            },
            
            // 噩梦难度
            nightmare: {
                id: 'nightmare',
                name: '噩梦',
                description: '只有真正的强者才能生存',
                healthMultiplier: 1.8,     // 敌人血量 ×1.8
                speedMultiplier: 1.2,
                damageMultiplier: 1.5,
                goldMultiplier: 2,         // 金币收益 ×2
                xpMultiplier: 2,
                waveInterval: 0.8
            }
        }
    };

    // ==========================================
    // 生成波次类型配置
    // ==========================================
    function generateWaveTypes(totalWaves = 10) {
        const waveTypes = [];
        const enemyTypeKeys = ['dragon', 'phoenix', 'tiger', 'turtle', 'qilin'];
        
        for (let i = 0; i < totalWaves; i++) {
            const waveNumber = i + 1;
            const isBossWave = waveNumber % 5 === 0 && waveNumber > 0;
            let waveType = 'normal';
            let specialConfig = null;
            
            // 随机生成特殊波次类型
            if (!isBossWave) {
                const rand = Math.random();
                if (rand < 0.2) {
                    // 速度波：敌人速度增加
                    waveType = 'speed';
                    specialConfig = {
                        speedMultiplier: 1.5,
                        enemyCount: Math.floor(5 + waveNumber * 1.5)
                    };
                } else if (rand < 0.35) {
                    // 虫群波：敌人数量多但血量低
                    waveType = 'swarm';
                    specialConfig = {
                        healthMultiplier: 0.6,
                        enemyCount: Math.floor(10 + waveNumber * 2.5)
                    };
                } else if (rand < 0.45) {
                    // 坦克波：敌人血量高但速度慢
                    waveType = 'tank';
                    specialConfig = {
                        healthMultiplier: 2,
                        speedMultiplier: 0.7,
                        enemyCount: Math.floor(3 + waveNumber * 0.8)
                    };
                }
            }
            
            // 计算基础敌人数
            const baseEnemyCount = isBossWave ? 
                Math.floor(3 + waveNumber * 0.5) :
                Math.floor(5 + waveNumber * (isBossWave ? 0.5 : 1.2));
            
            // 随机选择敌人类型
            const enemyTypes = [];
            const availableTypes = enemyTypeKeys.slice(0, Math.min(2 + Math.floor(waveNumber / 3), enemyTypeKeys.length));
            
            for (let j = 0; j < 3; j++) {
                if (Math.random() < 0.3 + waveNumber * 0.03) {
                    enemyTypes.push(availableTypes[Math.floor(Math.random() * availableTypes.length)]);
                }
            }
            if (enemyTypes.length === 0) {
                enemyTypes.push(availableTypes[0]);
            }
            
            // 构建波次配置
            waveTypes.push({
                wave: waveNumber,
                type: waveType,
                isBossWave: isBossWave,
                enemyCount: specialConfig?.enemyCount || baseEnemyCount,
                enemyTypes: enemyTypes,
                specialConfig: specialConfig,
                // BOSS类型：第5关龙王，第10关凤凰皇
                bossType: isBossWave ? (waveNumber === 10 ? 'boss_phoenix' : 'boss_dragon') : null
            });
        }
        
        return waveTypes;
    }

    // ==========================================
    // 生成每日任务
    // ==========================================
    function generateDailyTasks() {
        const taskTemplates = [
            { id: 'kill_dragons', name: '击杀青龙', target: 10, reward: { type: 'gold', amount: 50 } },
            { id: 'kill_phoenix', name: '击杀朱雀', target: 8, reward: { type: 'gold', amount: 60 } },
            { id: 'kill_tigers', name: '击杀白虎', target: 6, reward: { type: 'gold', amount: 70 } },
            { id: 'kill_turtles', name: '击杀玄武', target: 5, reward: { type: 'gold', amount: 80 } },
            { id: 'kill_qilin', name: '击杀麒麟', target: 4, reward: { type: 'gold', amount: 100 } },
            { id: 'kill_boss', name: '击败BOSS', target: 1, reward: { type: 'gold', amount: 200 } },
            { id: 'complete_waves', name: '完成波次', target: 5, reward: { type: 'gold', amount: 80 } },
            { id: 'reach_combo', name: '达成连击', target: 10, reward: { type: 'gold', amount: 60 } },
            { id: 'use_skills', name: '使用技能', target: 15, reward: { type: 'gold', amount: 50 } },
            { id: 'deal_damage', name: '造成伤害', target: 5000, reward: { type: 'gold', amount: 75 } }
        ];

        // 随机选择3个任务
        const shuffled = [...taskTemplates].sort(() => Math.random() - 0.5);
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
    }

    // ==========================================
    // 获取默认存档数据
    // ==========================================
    function getDefaultSaveData() {
        return {
            totalGold: 0,              // 总金币
            highScore: 0,              // 最高分
            totalKills: 0,             // 总击杀数
            totalWavesCompleted: 0,    // 总完成波次
            gamesPlayed: 0,            // 游戏次数
            
            unlockedCharacters: ['default'],  // 已解锁角色
            selectedCharacter: 'default',     // 当前选择角色
            
            unlockedSkills: {},        // 已解锁技能
            equippedSkills: [],        // 已装备技能
            
            difficulty: 'normal',      // 难度设置
            soundEnabled: true,        // 音效开关
            musicEnabled: true,        // 音乐开关
            sfxVolume: 1,              // 音效音量
            musicVolume: 0.5,          // 音乐音量
            
            dailyTasks: generateDailyTasks(),  // 每日任务
            lastDailyReward: null      // 最后领取每日奖励时间
        };
    }

    // 将配置和函数暴露到全局作用域
    if (typeof window !== 'undefined') {
        window.GameConfig = GameConfig;
        window.generateWaveTypes = generateWaveTypes;
        window.generateDailyTasks = generateDailyTasks;
        window.getDefaultSaveData = getDefaultSaveData;
    }

})();
