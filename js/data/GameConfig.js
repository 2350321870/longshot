(function() {
    'use strict';

    const GameConfig = {
        enemyTypes: {
            dragon: {
                name: '青龙',
                color: '#44aaff',
                health: 100,
                speed: 0.8,
                damage: 5,
                goldValue: 10,
                scoreValue: 100,
                xpValue: 10
            },
            phoenix: {
                name: '朱雀',
                color: '#ff4444',
                health: 80,
                speed: 1.2,
                damage: 5,
                goldValue: 12,
                scoreValue: 120,
                xpValue: 12
            },
            turtle: {
                name: '玄武',
                color: '#44aa44',
                health: 200,
                speed: 0.4,
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
                speed: 1.5,
                damage: 12,
                goldValue: 30,
                scoreValue: 160,
                xpValue: 16
            },
            boss_dragon: {
                name: '龙王',
                color: '#ff00ff',
                health: 1000,
                speed: 0.6,
                damage: 30,
                goldValue: 200,
                scoreValue: 1000,
                xpValue: 100,
                isBoss: true
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

        skillData: {
            fireball: {
                id: 'fireball',
                name: '火球术',
                description: '发射一枚火球，造成大范围伤害',
                icon: '🔥',
                type: 'active',
                rarity: 'common',
                tier: 1,
                price: 0,
                unlocked: true,
                cooldown: 8,
                damage: 50,
                radius: 100,
                maxDistance: 500,
                color: '#ff6600',
                effects: [
                    { type: 'damage', value: 50 },
                    { type: 'aoe_radius', value: 100 }
                ]
            },
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
                stunChance: 0.3,
                stunDuration: 1.5,
                color: '#ffff00',
                effects: [
                    { type: 'damage', value: 35 },
                    { type: 'stun_chance', value: 0.3 }
                ]
            },
            iceWall: {
                id: 'iceWall',
                name: '冰霜护盾',
                description: '生成冰霜护盾吸收伤害，减速接触敌人',
                icon: '❄️',
                type: 'active',
                rarity: 'rare',
                tier: 2,
                price: 100,
                unlocked: false,
                cooldown: 15,
                shieldAmount: 100,
                slowEffect: 0.3,
                slowDuration: 5,
                color: '#00ccff',
                effects: [
                    { type: 'shield', value: 100 },
                    { type: 'slow_effect', value: 0.3 }
                ]
            },
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
                healAmount: 50,
                color: '#44ff44',
                effects: [
                    { type: 'heal', value: 50 }
                ]
            },
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
                dashDistance: 200,
                invulnerableDuration: 0.5,
                color: '#88ffaa',
                effects: [
                    { type: 'invulnerable', value: 0.5 }
                ]
            },
            vortex: {
                id: 'vortex',
                name: '风暴漩涡',
                description: '在目标位置生成漩涡，持续牵引敌人',
                icon: '🌀',
                type: 'active',
                rarity: 'epic',
                tier: 3,
                price: 200,
                unlocked: false,
                cooldown: 20,
                pullRadius: 200,
                pullDuration: 4,
                damagePerSecond: 10,
                color: '#aa66ff',
                effects: [
                    { type: 'aoe_pull', value: 200 },
                    { type: 'dot_damage', value: 10 }
                ]
            },
            meteor: {
                id: 'meteor',
                name: '陨石天降',
                description: '召唤陨石轰击战场，造成巨额伤害',
                icon: '☄️',
                type: 'active',
                rarity: 'legendary',
                tier: 4,
                price: 500,
                unlocked: false,
                cooldown: 25,
                damage: 200,
                radius: 150,
                burnDamage: 30,
                burnDuration: 5,
                color: '#ff4400',
                effects: [
                    { type: 'damage', value: 200 },
                    { type: 'burn_effect', value: 30 }
                ]
            },
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
                stopDuration: 3,
                color: '#aaffff',
                effects: [
                    { type: 'stun_all', value: 3 }
                ]
            },
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
                width: 100,
                length: 800,
                color: '#6666ff',
                effects: [
                    { type: 'line_damage', value: 150 },
                    { type: 'stun_chance', value: 0.5 }
                ]
            },
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
                freezeChance: 0.4,
                freezeDuration: 2,
                color: '#aaddff',
                effects: [
                    { type: 'aoe_damage', value: 80 },
                    { type: 'freeze_chance', value: 0.4 }
                ]
            },
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
                needleCount: 20,
                poisonDamage: 15,
                poisonDuration: 5,
                color: '#88ff88',
                effects: [
                    { type: 'multi_projectile', value: 20 },
                    { type: 'poison_effect', value: 15 }
                ]
            },
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
                attackSpeedBonus: 1,
                color: '#ff4444',
                effects: [
                    { type: 'attack_speed_buff', value: 1 }
                ]
            },
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
                damageReduction: 0.5,
                color: '#8888ff',
                effects: [
                    { type: 'damage_reduction_buff', value: 0.5 }
                ]
            },
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
                lifestealBonus: 0.3,
                color: '#880000',
                effects: [
                    { type: 'lifesteal_buff', value: 0.3 }
                ]
            },
            eagleEye: {
                id: 'eagleEye',
                name: '鹰眼',
                description: '解锁鹰眼视野，提升暴击几率',
                icon: '🦅',
                type: 'passive',
                rarity: 'common',
                tier: 1,
                price: 80,
                unlocked: false,
                effects: [
                    { type: 'crit_chance', value: 0.05 }
                ]
            },
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
                    { type: 'kill_heal', value: 10 }
                ]
            },
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
                    { type: 'max_health', value: 50 }
                ]
            },
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
                    { type: 'dodge_chance', value: 0.15 }
                ]
            },
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
                    { type: 'cooldown_reduction', value: 0.2 }
                ]
            },
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
                    { type: 'revive', value: 1 }
                ]
            },
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
                    { type: 'execute_damage', value: 0.5 }
                ]
            },
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
                    { type: 'combo_damage_bonus', value: 0.1 }
                ]
            },
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
                    { type: 'skill_damage', value: 0.3 }
                ]
            },
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
                    { type: 'damage_reduction', value: 0.2 },
                    { type: 'regeneration', value: 5 }
                ]
            }
        },

        characters: {
            default: {
                id: 'default',
                name: '弓箭手',
                description: '平衡型角色，适合新手',
                color: '#4488ff',
                price: 0,
                unlocked: true,
                stats: {
                    health: 0,
                    damage: 0,
                    speed: 0
                },
                passive: null,
                startSkill: null
            },
            warrior: {
                id: 'warrior',
                name: '战士',
                description: '高生命值，近战专家',
                color: '#ff4444',
                price: 500,
                unlocked: false,
                stats: {
                    health: 100,
                    damage: 0,
                    speed: -0.1
                },
                passive: {
                    type: 'health_based_reduction',
                    description: '每损失25%生命值，获得10%减伤',
                    threshold: 0.25,
                    reductionPerThreshold: 0.1
                },
                startSkill: 'fortify'
            },
            assassin: {
                id: 'assassin',
                name: '刺客',
                description: '高暴击，高移动速度',
                color: '#aa44ff',
                price: 800,
                unlocked: false,
                stats: {
                    health: -50,
                    damage: 5,
                    speed: 0.2
                },
                passive: {
                    type: 'backstab_damage',
                    description: '从后方攻击造成150%伤害'
                },
                startSkill: 'dash'
            },
            mage: {
                id: 'mage',
                name: '法师',
                description: '技能伤害提升，冷却减少',
                color: '#44aaff',
                price: 600,
                unlocked: false,
                stats: {
                    health: -30,
                    damage: 0,
                    speed: 0
                },
                passive: {
                    type: 'skill_mastery',
                    description: '技能伤害+20%，冷却-15%',
                    skillDamageBonus: 0.2,
                    cooldownReduction: 0.15
                },
                startSkill: 'fireball'
            }
        },

        difficultyPresets: {
            easy: {
                id: 'easy',
                name: '简单',
                description: '适合休闲玩家',
                healthMultiplier: 0.7,
                speedMultiplier: 0.8,
                damageMultiplier: 0.8,
                goldMultiplier: 1.2,
                xpMultiplier: 1.2,
                waveInterval: 1.5
            },
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
            hard: {
                id: 'hard',
                name: '困难',
                description: '挑战你的极限',
                healthMultiplier: 1.3,
                speedMultiplier: 1.1,
                damageMultiplier: 1.2,
                goldMultiplier: 1.5,
                xpMultiplier: 1.5,
                waveInterval: 1
            },
            nightmare: {
                id: 'nightmare',
                name: '噩梦',
                description: '只有真正的强者才能生存',
                healthMultiplier: 1.8,
                speedMultiplier: 1.2,
                damageMultiplier: 1.5,
                goldMultiplier: 2,
                xpMultiplier: 2,
                waveInterval: 0.8
            }
        }
    };

    function generateWaveTypes(totalWaves = 10) {
        const waveTypes = [];
        const enemyTypeKeys = ['dragon', 'phoenix', 'tiger', 'turtle', 'qilin'];
        
        for (let i = 0; i < totalWaves; i++) {
            const waveNumber = i + 1;
            const isBossWave = waveNumber % 5 === 0 && waveNumber > 0;
            let waveType = 'normal';
            let specialConfig = null;
            
            if (!isBossWave) {
                const rand = Math.random();
                if (rand < 0.2) {
                    waveType = 'speed';
                    specialConfig = {
                        speedMultiplier: 1.5,
                        enemyCount: Math.floor(5 + waveNumber * 1.5)
                    };
                } else if (rand < 0.35) {
                    waveType = 'swarm';
                    specialConfig = {
                        healthMultiplier: 0.6,
                        enemyCount: Math.floor(10 + waveNumber * 2.5)
                    };
                } else if (rand < 0.45) {
                    waveType = 'tank';
                    specialConfig = {
                        healthMultiplier: 2,
                        speedMultiplier: 0.7,
                        enemyCount: Math.floor(3 + waveNumber * 0.8)
                    };
                }
            }
            
            const baseEnemyCount = isBossWave ? 
                Math.floor(3 + waveNumber * 0.5) :
                Math.floor(5 + waveNumber * (isBossWave ? 0.5 : 1.2));
            
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
            
            waveTypes.push({
                wave: waveNumber,
                type: waveType,
                isBossWave: isBossWave,
                enemyCount: specialConfig?.enemyCount || baseEnemyCount,
                enemyTypes: enemyTypes,
                specialConfig: specialConfig,
                bossType: isBossWave ? (waveNumber === 10 ? 'boss_phoenix' : 'boss_dragon') : null
            });
        }
        
        return waveTypes;
    }

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

    function getDefaultSaveData() {
        return {
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
            musicVolume: 0.5,
            
            dailyTasks: generateDailyTasks(),
            lastDailyReward: null
        };
    }

    if (typeof window !== 'undefined') {
        window.GameConfig = GameConfig;
        window.generateWaveTypes = generateWaveTypes;
        window.generateDailyTasks = generateDailyTasks;
        window.getDefaultSaveData = getDefaultSaveData;
    }

})();
