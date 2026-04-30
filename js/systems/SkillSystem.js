(function() {
    'use strict';

    class SkillSystem {
        constructor(game) {
            this.game = game;
            
            this.activeSkills = [];
            this.skillCooldowns = {};
            this.skillLevels = {};
            
            this.needles = [];
            this.thunderDragon = null;
            this.thunderDragonTimer = 0;
            this.hailStones = [];
            this.iceStormActive = false;
            this.iceStormTimer = 0;
            this.slowEffects = [];
            
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            this.loadSkillData();
            this.isInitialized = true;
            
            console.log('SkillSystem initialized');
        }

        loadSkillData() {
            const gameConfig = window.GameConfig || {};
            this.skillData = gameConfig.skillData || {};
            
            this.battleSkillMap = {};
            const gameData = window.GameData || {};
            const battleSkills = gameData.battleSkills || window.battleSkills || [];
            
            for (const skill of battleSkills) {
                this.battleSkillMap[skill.id] = skill;
            }
        }

        getSkillStats(skillId) {
            let skill = this.battleSkillMap[skillId];
            
            if (!skill) {
                const camelCaseId = skillId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                skill = this.skillData[skillId] || this.skillData[camelCaseId];
            }
            
            if (!skill) return null;
            
            const level = this.skillLevels[skillId] || 1;
            const multiplier = 1 + (level - 1) * 0.15;
            
            const baseDamage = skill.baseDamage || skill.damage || 20;
            
            return {
                ...skill,
                damage: Math.floor(baseDamage * multiplier),
                duration: skill.duration || 6,
                cooldown: skill.cooldown || 4,
                projectileCount: skill.projectileCount || skill.needleCount || 8,
                spread: skill.spread || 45,
                burstCount: skill.burstCount || 5,
                moveSpeed: skill.moveSpeed || 180,
                lightningFrequency: skill.lightningFrequency || 0.25,
                chainCount: skill.chainCount || 5,
                chainDamageReduction: skill.chainDamageReduction || 0.75,
                chainRange: skill.chainRange || 250,
                radius: skill.radius || 200,
                slowDuration: skill.slowDuration || 2,
                slowAmount: skill.slowAmount || 0.5,
                hailRate: skill.hailRate || 0.3
            };
        }

        update(dt, currentTime) {
            this.updateSkillCooldowns(dt);
            this.autoUseSkills();
            this.updateRainOfNeedles(dt);
            this.updateThunderDragon(dt, currentTime);
            this.updateIceStorm(dt);
            this.updateSlowEffects(dt);
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

        getCooldownReductionFromPassive() {
            let reduction = 0;
            const saveData = this.game.saveData;
            if (!saveData) return reduction;
            
            const characterId = saveData.selectedCharacter || 'default';
            const charConfig = window.characterConfig || {};
            const char = charConfig[characterId];
            
            if (char && char.passive && char.passive.type === 'skill_enhancement') {
                reduction += char.passive.cooldownReduction || 0;
            }
            
            return reduction;
        }

        getSkillDamageBonusFromPassive() {
            let bonus = 0;
            const saveData = this.game.saveData;
            if (!saveData) return bonus;
            
            const characterId = saveData.selectedCharacter || 'default';
            const charConfig = window.characterConfig || {};
            const char = charConfig[characterId];
            
            if (char && char.passive && char.passive.type === 'skill_enhancement') {
                bonus += char.passive.skillDamageBonus || 0;
            }
            
            return bonus;
        }

        getCritDamageBonusFromPassive() {
            let bonus = 0;
            const saveData = this.game.saveData;
            if (!saveData) return bonus;
            
            const characterId = saveData.selectedCharacter || 'default';
            const charConfig = window.characterConfig || {};
            const char = charConfig[characterId];
            
            if (char && char.passive && char.passive.type === 'speed_to_crit_damage') {
                const playerStats = this.game.playerStats || {};
                bonus += (playerStats.speed || 0) * char.passive.conversionRate;
            }
            
            return bonus;
        }

        applyCharacterPassiveToCrit(isCrit) {
            if (isCrit) return true;
            
            const saveData = this.game.saveData;
            if (!saveData) return false;
            
            const characterId = saveData.selectedCharacter || 'default';
            const charConfig = window.characterConfig || {};
            const char = charConfig[characterId];
            
            if (char && char.passive && char.passive.type === 'guaranteed_crit') {
                if (!this.game.characterPassiveState) {
                    this.game.characterPassiveState = {};
                }
                
                const state = this.game.characterPassiveState;
                if (!state.guaranteedCritTimer) {
                    state.guaranteedCritTimer = char.passive.cooldown;
                }
                
                if (state.guaranteedCritTimer <= 0) {
                    state.guaranteedCritTimer = char.passive.cooldown;
                    return true;
                }
            }
            
            return false;
        }

        autoUseSkills() {
            for (const skillId of this.activeSkills) {
                if (this.skillCooldowns[skillId] <= 0) {
                    this.useSkill(skillId);
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
                case 'rainOfNeedles':
                    this.launchRainOfNeedles(stats);
                    break;
                case 'thunder_dragon':
                case 'thunderDragon':
                    this.launchThunderDragon(stats);
                    break;
                case 'ice_storm':
                case 'iceStorm':
                    this.launchIceStorm(stats);
                    break;
            }
            
            if (this.game.updateStatistics) {
                this.game.updateStatistics('skill_use', 1);
            }
            
            return true;
        }

        launchRainOfNeedles(stats) {
            if (!this.game.player) return;
            
            const startX = this.game.player.x;
            const startY = this.game.player.y;
            
            const skillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
            const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
            
            const maxNeedles = 20;
            const currentNeedleCount = this.needles.length;
            const actualProjectileCount = Math.min(stats.projectileCount, Math.max(4, maxNeedles - currentNeedleCount));
            
            for (let i = 0; i < actualProjectileCount; i++) {
                const spreadRad = stats.spread * Math.PI / 180;
                const startAngle = -Math.PI / 2 - spreadRad / 2;
                const angleStep = actualProjectileCount > 1 ? spreadRad / (actualProjectileCount - 1) : 0;
                const angle = startAngle + i * angleStep;
                
                let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
                isCrit = this.applyCharacterPassiveToCrit(isCrit);
                
                const critMultiplier = isCrit ? ((this.game.playerStats?.criticalDamage || 1.5) + critDamageBonusFromPassive) : 1;
                
                const finalDamage = Math.floor(stats.damage * critMultiplier * skillDamageBonus);
                
                const maxBurstCount = Math.min(stats.burstCount, 2);
                
                this.needles.push({
                    x: startX,
                    y: startY,
                    vx: Math.cos(angle) * 400,
                    vy: Math.sin(angle) * 400,
                    damage: finalDamage,
                    isCrit: isCrit,
                    burstCount: maxBurstCount,
                    radius: 4,
                    color: isCrit ? '#FFD700' : '#00FF00',
                    lifetime: 3,
                    maxLifetime: 3
                });
            }
            
            if (this.game.addScreenShake) {
                this.game.addScreenShake(1.5, 0.1);
            }
            
            if (this.game.glowEffects) {
                this.game.glowEffects.push({
                    x: startX,
                    y: startY,
                    radius: 20,
                    maxRadius: 60,
                    color: '#00FF00',
                    lifetime: 0.2,
                    maxLifetime: 0.2
                });
            }
        }

        updateRainOfNeedles(dt) {
            for (let i = this.needles.length - 1; i >= 0; i--) {
                const needle = this.needles[i];
                
                needle.lifetime -= dt;
                
                needle.x += needle.vx * dt;
                needle.y += needle.vy * dt;
                
                let hit = false;
                for (const enemy of this.game.enemies) {
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
                                    if (this.game.createDamageNumber) {
                                        this.game.createDamageNumber(
                                            segment.x,
                                            segment.y - segRadius,
                                            needle.damage,
                                            needle.isCrit
                                        );
                                    }
                                    
                                    if (this.game.createHitParticles) {
                                        this.game.createHitParticles(needle.x, needle.y, needle.color);
                                    }
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
                
                if (needle.x < -50 || needle.x > this.game.width + 50 || 
                    needle.y < -50 || needle.y > this.game.height + 50 ||
                    needle.lifetime <= 0) {
                    this.needles.splice(i, 1);
                }
            }
        }

        burstNeedles(needle) {
            const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
            
            if (needle.burstCount <= 0) return;
            
            const burstCount = Math.min(needle.burstCount, 3);
            
            for (let i = 0; i < burstCount; i++) {
                const angle = (Math.PI * 2 / burstCount) * i;
                
                let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
                isCrit = this.applyCharacterPassiveToCrit(isCrit);
                
                const critMultiplier = isCrit ? ((this.game.playerStats?.criticalDamage || 1.5) + critDamageBonusFromPassive) : 1;
                
                this.needles.push({
                    x: needle.x,
                    y: needle.y,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: Math.floor(needle.damage * 0.5 * critMultiplier),
                    isCrit: isCrit,
                    burstCount: 0,
                    radius: 3,
                    color: isCrit ? '#FFD700' : '#90EE90',
                    lifetime: 1.5,
                    maxLifetime: 1.5
                });
            }
            
            if (this.game.createHitParticles) {
                this.game.createHitParticles(needle.x, needle.y, '#00FF00');
            }
        }

        launchThunderDragon(stats) {
            let dragonX, dragonY;
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            for (const enemy of this.game.enemies) {
                if (enemy.isWinding && enemy.segments && enemy.segments.length > 0) {
                    const headSeg = enemy.segments[0];
                    const dx = headSeg.x - (this.game.player?.x || this.game.width / 2);
                    const dy = headSeg.y - (this.game.player?.y || this.game.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                }
            }
            
            if (nearestEnemy && nearestEnemy.segments && nearestEnemy.segments.length > 0) {
                const headSeg = nearestEnemy.segments[0];
                dragonX = headSeg.x;
                dragonY = headSeg.y;
            } else {
                const startX = Math.random() * 0.6 + 0.2;
                const startY = Math.random() * 0.6 + 0.2;
                dragonX = this.game.width * startX;
                dragonY = this.game.height * startY;
            }
            
            const skillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
            
            const bodySegments = [];
            const segmentCount = 8;
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
                duration: stats.duration * 1.5,
                elapsed: 0,
                targetChangeTimer: 0,
                bodySegments: bodySegments,
                bodySegmentCount: segmentCount,
                lightningEffects: [],
                chainLightningEffects: [],
                pulsePhase: 0,
                roarPhase: 0,
                moveSpeed: stats.moveSpeed,
                chainCount: Math.min(stats.chainCount || 5, 3),
                chainDamageReduction: stats.chainDamageReduction || 0.75,
                chainRange: stats.chainRange || 250
            };
            this.thunderDragonTimer = stats.duration * 1.5;
            
            if (this.game.addScreenShake) {
                this.game.addScreenShake(5, 0.3);
            }
            
            if (this.game.createKillExplosion) {
                this.game.createKillExplosion(dragonX, dragonY, '#FFFF00', 3);
            }
        }

        updateThunderDragon(dt, currentTime) {
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
                
                for (const enemy of this.game.enemies) {
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
            
            const speed = this.thunderDragon.moveSpeed || 250;
            this.thunderDragon.vx = Math.cos(this.thunderDragon.angle) * speed;
            this.thunderDragon.vy = Math.sin(this.thunderDragon.angle) * speed;
            
            this.thunderDragon.x += this.thunderDragon.vx * dt;
            this.thunderDragon.y += this.thunderDragon.vy * dt;
            
            const margin = 40;
            if (this.thunderDragon.x < margin) {
                this.thunderDragon.x = margin;
                this.thunderDragon.targetAngle = Math.PI - this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
            }
            if (this.thunderDragon.x > this.game.width - margin) {
                this.thunderDragon.x = this.game.width - margin;
                this.thunderDragon.targetAngle = Math.PI - this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
            }
            if (this.thunderDragon.y < margin) {
                this.thunderDragon.y = margin;
                this.thunderDragon.targetAngle = -this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
            }
            if (this.thunderDragon.y > this.game.height - margin) {
                this.thunderDragon.y = this.game.height - margin;
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
                if (this.game.addScreenShake) {
                    this.game.addScreenShake(2, 0.1);
                }
            }
            
            const maxLightningEffects = 8;
            if (this.thunderDragon.lightningEffects && 
                this.thunderDragon.lightningEffects.length < maxLightningEffects && 
                Math.random() < 0.1) {
                this.addDragonLightning();
            }
        }

        addDragonLightning() {
            if (!this.thunderDragon) return;
            
            const segments = this.thunderDragon.bodySegments;
            
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

        generateLightningPath(x1, y1, x2, y2, segCount) {
            const path = [{ x: x1, y: y1 }];
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            for (let i = 1; i < segCount; i++) {
                const ratio = i / segCount;
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
            
            let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
            isCrit = this.applyCharacterPassiveToCrit(isCrit);
            
            const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
            const critMultiplier = isCrit ? ((this.game.playerStats?.criticalDamage || 1.5) + critDamageBonusFromPassive) : 1;
            const skillDamageBonus = this.thunderDragon.skillDamageBonus || 1;
            const baseDamage = Math.floor(this.thunderDragon.damage * critMultiplier * skillDamageBonus);
            
            const chainTargets = [];
            const hitSegmentPairs = [];
            
            let currentX = startX;
            let currentY = startY;
            let currentDamage = baseDamage;
            let currentChainIndex = 0;
            
            const allSegments = [];
            for (const enemy of this.game.enemies) {
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
                
                nearestPair.segment.health -= currentDamage;
                nearestPair.enemy.health -= currentDamage;
                
                if (this.game.createDamageNumber) {
                    this.game.createDamageNumber(
                        nearestPair.segment.x,
                        nearestPair.segment.y,
                        currentDamage,
                        isCrit
                    );
                }
                
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
                
                const time = this.game.currentTime || performance.now() / 1000;
                
                for (let s = 0; s < lightningPath.length - 1; s++) {
                    const segPath = [];
                    const p1 = lightningPath[s];
                    const p2 = lightningPath[s + 1];
                    
                    const segDx = p2.x - p1.x;
                    const segDy = p2.y - p1.y;
                    const segDist = Math.sqrt(segDx * segDx + segDy * segDy);
                    
                    const pointsPerSeg = Math.max(2, Math.floor(segDist / 50));
                    
                    for (let p = 0; p <= pointsPerSeg; p++) {
                        const t = p / pointsPerSeg;
                        const baseX = p1.x + segDx * t;
                        const baseY = p1.y + segDy * t;
                        
                        const perpAngle = Math.atan2(segDy, segDx) + Math.PI / 2;
                        const offset = Math.sin(time * 20 + p * 2) * 12;
                        
                        segPath.push({
                            x: baseX + Math.cos(perpAngle) * offset,
                            y: baseY + Math.sin(perpAngle) * offset
                        });
                    }
                    
                    this.thunderDragon.chainLightningEffects[
                        this.thunderDragon.chainLightningEffects.length - 1
                    ].segments.push(segPath);
                }
            }
        }

        launchIceStorm(stats) {
            this.iceStormActive = true;
            this.iceStormTimer = stats.duration || 8;
            
            if (this.game.addScreenShake) {
                this.game.addScreenShake(3, 0.2);
            }
        }

        updateIceStorm(dt) {
            if (!this.iceStormActive) return;
            
            this.iceStormTimer -= dt;
            
            if (this.iceStormTimer <= 0) {
                this.iceStormActive = false;
                return;
            }
            
            const stats = this.getSkillStats('ice_storm') || this.getSkillStats('iceStorm');
            const radius = stats?.radius || 300;
            const damage = stats?.damage || 80;
            
            const maxHailStones = 20;
            if (this.hailStones.length < maxHailStones && Math.random() < 0.15) {
                let hailX, hailY;
                let targetEnemy = null;
                
                for (const enemy of this.game.enemies) {
                    if (enemy.isWinding && enemy.segments && enemy.segments.length > 0) {
                        if (Math.random() < 0.6) {
                            targetEnemy = enemy.segments[0];
                            break;
                        }
                    }
                }
                
                if (targetEnemy) {
                    const offsetX = (Math.random() - 0.5) * 80;
                    const offsetY = (Math.random() - 0.5) * 80;
                    hailX = targetEnemy.x + offsetX;
                    hailY = targetEnemy.y + offsetY - 150;
                } else {
                    hailX = Math.random() * this.game.width;
                    hailY = -20;
                }
                
                let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
                isCrit = this.applyCharacterPassiveToCrit(isCrit);
                
                this.hailStones.push({
                    x: hailX,
                    y: hailY,
                    vx: (Math.random() - 0.5) * 30,
                    vy: 150 + Math.random() * 80,
                    radius: 10 + Math.random() * 8,
                    damage: Math.floor(damage * 0.15),
                    isCrit: isCrit,
                    color: '#87CEEB',
                    lifetime: 5
                });
            }
            
            for (let i = this.hailStones.length - 1; i >= 0; i--) {
                const hail = this.hailStones[i];
                
                hail.lifetime -= dt;
                hail.y += hail.vy * dt;
                hail.x += hail.vx * dt;
                
                for (const enemy of this.game.enemies) {
                    if (enemy.isWinding && enemy.segments) {
                        for (const segment of enemy.segments) {
                            const dx = hail.x - segment.x;
                            const dy = hail.y - segment.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            if (dist < hail.radius + 20) {
                                if (segment.health > 0) {
                                    segment.health -= hail.damage;
                                    enemy.health -= hail.damage;
                                    
                                    if (this.game.createDamageNumber) {
                                        this.game.createDamageNumber(
                                            segment.x,
                                            segment.y,
                                            hail.damage,
                                            hail.isCrit
                                        );
                                    }
                                }
                                
                                this.slowEffects.push({
                                    x: segment.x,
                                    y: segment.y,
                                    duration: 3,
                                    elapsed: 0,
                                    slowAmount: 0.3
                                });
                                
                                this.hailStones.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                
                if (hail.y > this.game.height + 50 || hail.lifetime <= 0) {
                    this.hailStones.splice(i, 1);
                }
            }
        }

        updateSlowEffects(dt) {
            for (let i = this.slowEffects.length - 1; i >= 0; i--) {
                const effect = this.slowEffects[i];
                effect.elapsed += dt;
                
                if (effect.elapsed >= effect.duration) {
                    this.slowEffects.splice(i, 1);
                }
            }
        }

        render(ctx) {
            this.renderRainOfNeedles(ctx);
            this.renderThunderDragon(ctx);
            this.renderIceStorm(ctx);
        }

        renderRainOfNeedles(ctx) {
            for (const needle of this.needles) {
                ctx.save();
                
                const angle = Math.atan2(needle.vy, needle.vx);
                ctx.translate(needle.x, needle.y);
                ctx.rotate(angle);
                
                if (needle.isCrit) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                } else {
                    ctx.shadowColor = needle.color;
                    ctx.shadowBlur = 8;
                }
                
                ctx.fillStyle = needle.color;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(-12, -needle.radius - 2);
                ctx.lineTo(-8, 0);
                ctx.lineTo(-12, needle.radius + 2);
                ctx.closePath();
                ctx.fill();
                
                if (needle.isCrit) {
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }

        renderThunderDragon(ctx) {
            if (!this.thunderDragon) return;
            
            const time = this.game.currentTime || performance.now() / 1000;
            const segments = this.thunderDragon.bodySegments;
            const pulsePhase = this.thunderDragon.pulsePhase || 0;
            
            if (!segments || segments.length === 0) return;
            
            ctx.save();
            
            for (let i = segments.length - 1; i >= 0; i--) {
                const seg = segments[i];
                const segScale = seg.scale || (1 - (i / segments.length) * 0.8);
                const isHead = i === 0;
                const isTail = i === segments.length - 1;
                
                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(seg.angle);
                
                const pulse = 0.3 + 0.2 * Math.sin(pulsePhase + i * 0.3);
                const glowSize = 30 + pulse * 20;
                
                if (isHead) {
                    const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize * 2);
                    auraGrad.addColorStop(0, `rgba(255, 255, 100, ${0.3 + pulse * 0.2})`);
                    auraGrad.addColorStop(0.5, `rgba(255, 200, 0, ${0.15 + pulse * 0.1})`);
                    auraGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
                    ctx.fillStyle = auraGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, glowSize * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                if (!isTail) {
                    ctx.shadowColor = isHead ? '#FFFF00' : '#FFD700';
                    ctx.shadowBlur = isHead ? 25 + pulse * 15 : 15 + pulse * 10;
                    
                    const bodyWidth = 22 * segScale;
                    const bodyHeight = 14 * segScale;
                    
                    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bodyWidth);
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
                    
                    ctx.fillStyle = bodyGrad;
                    ctx.beginPath();
                    
                    if (isHead) {
                        const headWidth = 28;
                        const headHeight = 20;
                        
                        ctx.moveTo(headWidth * 1.1, 0);
                        ctx.quadraticCurveTo(headWidth * 0.8, -headHeight * 1.2, 0, -headHeight);
                        ctx.quadraticCurveTo(-headWidth * 0.8, -headHeight * 0.8, -headWidth * 0.9, 0);
                        ctx.quadraticCurveTo(-headWidth * 0.8, headHeight * 0.8, 0, headHeight);
                        ctx.quadraticCurveTo(headWidth * 0.8, headHeight * 1.2, headWidth * 1.1, 0);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.shadowBlur = 0;
                        
                        const nostrilGrad = ctx.createRadialGradient(headWidth * 0.8, -4, 0, headWidth * 0.8, -4, 5);
                        nostrilGrad.addColorStop(0, '#FFFFFF');
                        nostrilGrad.addColorStop(0.5, '#87CEEB');
                        nostrilGrad.addColorStop(1, '#4169E1');
                        ctx.fillStyle = nostrilGrad;
                        ctx.shadowColor = '#00FFFF';
                        ctx.shadowBlur = 10 + pulse * 10;
                        ctx.beginPath();
                        ctx.arc(headWidth * 0.8, -4, 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(headWidth * 0.8, 4, 4, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.shadowColor = '#FFFF00';
                        ctx.shadowBlur = 15;
                        const eyeGrad = ctx.createRadialGradient(headWidth * 0.2, -11, 0, headWidth * 0.2, -11, 8);
                        eyeGrad.addColorStop(0, '#FFFFFF');
                        eyeGrad.addColorStop(0.3, '#FFFF00');
                        eyeGrad.addColorStop(0.7, '#FF4500');
                        eyeGrad.addColorStop(1, '#8B0000');
                        ctx.fillStyle = eyeGrad;
                        ctx.beginPath();
                        ctx.ellipse(headWidth * 0.2, -11, 7, 9, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.beginPath();
                        ctx.ellipse(headWidth * 0.2, 11, 7, 9, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = '#000000';
                        ctx.shadowBlur = 0;
                        ctx.beginPath();
                        ctx.arc(headWidth * 0.25, -11, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(headWidth * 0.25, 11, 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.shadowColor = '#FFD700';
                        ctx.shadowBlur = 15;
                        ctx.fillStyle = '#FFD700';
                        ctx.lineWidth = 4;
                        
                        ctx.beginPath();
                        ctx.moveTo(headWidth * 0.0, -18);
                        ctx.quadraticCurveTo(headWidth * -0.3, -30, headWidth * -0.2, -38);
                        ctx.quadraticCurveTo(headWidth * -0.1, -45, headWidth * 0.05, -42);
                        ctx.quadraticCurveTo(headWidth * 0.0, -35, headWidth * 0.1, -22);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.beginPath();
                        ctx.moveTo(headWidth * 0.0, 18);
                        ctx.quadraticCurveTo(headWidth * -0.3, 30, headWidth * -0.2, 38);
                        ctx.quadraticCurveTo(headWidth * -0.1, 45, headWidth * 0.05, 42);
                        ctx.quadraticCurveTo(headWidth * 0.0, 35, headWidth * 0.1, 22);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        const width = bodyWidth;
                        const height = bodyHeight;
                        
                        ctx.beginPath();
                        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                ctx.restore();
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
                    
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = effect.color;
                    ctx.shadowBlur = 15;
                    
                    ctx.beginPath();
                    if (effect.segments && effect.segments.length > 1) {
                        ctx.moveTo(effect.segments[0].x, effect.segments[0].y);
                        for (let j = 1; j < effect.segments.length; j++) {
                            ctx.lineTo(effect.segments[j].x, effect.segments[j].y);
                        }
                    } else {
                        ctx.moveTo(effect.startX, effect.startY);
                        ctx.lineTo(effect.endX, effect.endY);
                    }
                    ctx.stroke();
                    
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 5;
                    ctx.stroke();
                    
                    ctx.restore();
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
                    
                    ctx.save();
                    
                    if (effect.segments && effect.segments.length > 0) {
                        for (let s = 0; s < effect.segments.length; s++) {
                            const segPath = effect.segments[s];
                            if (!segPath || segPath.length < 2) continue;
                            
                            const branchCount = 2;
                            for (let b = 0; b < branchCount; b++) {
                                const branchAlpha = alpha * (0.7 - b * 0.25);
                                const offsetFactor = (b + 1) * 0.3;
                                
                                ctx.globalAlpha = branchAlpha;
                                ctx.strokeStyle = b === 0 ? '#FFFFFF' : '#87CEEB';
                                ctx.lineWidth = b === 0 ? 3 + alpha * 2 : 2 + alpha;
                                ctx.shadowColor = b === 0 ? '#FFFFFF' : '#87CEEB';
                                ctx.shadowBlur = b === 0 ? 20 : 12;
                                
                                ctx.beginPath();
                                ctx.moveTo(segPath[0].x, segPath[0].y);
                                
                                for (let p = 1; p < segPath.length; p++) {
                                    const perpAngle = Math.atan2(
                                        segPath[p].y - segPath[p - 1].y,
                                        segPath[p].x - segPath[p - 1].x
                                    ) + Math.PI / 2;
                                    
                                    const offset = Math.sin(time * 20 + p * 2 + b * 3) * 8 * offsetFactor;
                                    
                                    const midX = (segPath[p - 1].x + segPath[p].x) / 2;
                                    const midY = (segPath[p - 1].y + segPath[p].y) / 2;
                                    
                                    ctx.quadraticCurveTo(
                                        midX + Math.cos(perpAngle) * offset,
                                        midY + Math.sin(perpAngle) * offset,
                                        segPath[p].x,
                                        segPath[p].y
                                    );
                                }
                                ctx.stroke();
                                
                                if (b === 0) {
                                    ctx.globalAlpha = branchAlpha * 0.4;
                                    ctx.lineWidth = 8;
                                    ctx.shadowBlur = 30;
                                    ctx.stroke();
                                }
                            }
                        }
                    }
                    
                    ctx.restore();
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
                
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.random() * 0.4;
                ctx.fillStyle = Math.random() < 0.5 ? '#FFFFFF' : '#87CEEB';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            ctx.restore();
        }

        renderIceStorm(ctx) {
            const time = this.game.currentTime || performance.now() / 1000;
            
            if (this.iceStormActive) {
                ctx.save();
                ctx.globalAlpha = 0.1;
                for (let i = 0; i < 20; i++) {
                    const x = ((time * 50 + i * 100) % (this.game.width + 200)) - 100;
                    const y = (time * 100 + i * 50) % this.game.height;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            
            for (const hail of this.hailStones) {
                ctx.save();
                
                if (hail.isCrit) {
                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 20;
                } else {
                    ctx.shadowColor = '#87CEEB';
                    ctx.shadowBlur = 10;
                }
                
                const gradient = ctx.createRadialGradient(
                    hail.x, hail.y, 0,
                    hail.x, hail.y, hail.radius
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.5, hail.color);
                gradient.addColorStop(1, '#4169E1');
                
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2 + time * 3;
                    const x = hail.x + Math.cos(angle) * hail.radius;
                    const y = hail.y + Math.sin(angle) * hail.radius;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                if (hail.isCrit) {
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.strokeStyle = '#ADD8E6';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#87CEEB';
                ctx.beginPath();
                ctx.arc(hail.x, hail.y - 5, hail.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        addActiveSkill(skillId) {
            if (!this.activeSkills.includes(skillId)) {
                this.activeSkills.push(skillId);
            }
        }

        removeActiveSkill(skillId) {
            const index = this.activeSkills.indexOf(skillId);
            if (index > -1) {
                this.activeSkills.splice(index, 1);
            }
        }

        setSkillLevel(skillId, level) {
            this.skillLevels[skillId] = Math.max(1, level);
        }

        reset() {
            this.activeSkills = [];
            this.skillCooldowns = {};
            this.needles = [];
            this.thunderDragon = null;
            this.thunderDragonTimer = 0;
            this.hailStones = [];
            this.iceStormActive = false;
            this.iceStormTimer = 0;
            this.slowEffects = [];
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
                const playerStats = this.game.playerStats;
                if (!playerStats) return;

                switch (skill.id) {
                    case 'bullet_count':
                        playerStats.bulletCount++;
                        break;
                    case 'fire_rate':
                        playerStats.fireRate *= 0.88;
                        break;
                    case 'damage':
                        playerStats.damageMultiplier = (playerStats.damageMultiplier || 1) * 1.2;
                        break;
                    case 'health':
                        const healthBonus = Math.max(15, Math.floor(playerStats.maxHealth * 0.15));
                        playerStats.health = Math.min(
                            playerStats.health + healthBonus,
                            playerStats.maxHealth
                        );
                        break;
                    case 'max_health':
                        const maxHealthBonus = Math.max(15, Math.floor(playerStats.maxHealth * 0.12));
                        playerStats.maxHealth += maxHealthBonus;
                        playerStats.health += maxHealthBonus;
                        break;
                    case 'bullet_size':
                        playerStats.bulletSize += 3;
                        break;
                    case 'speed':
                        playerStats.speed *= 1.12;
                        if (playerStats.speed > 20) playerStats.speed = 20;
                        break;
                    case 'pierce':
                        playerStats.bulletPierce++;
                        break;
                    case 'crit_chance':
                        playerStats.criticalChance = Math.min(
                            0.75,
                            playerStats.criticalChance + 0.05
                        );
                        break;
                    case 'crit_damage':
                        playerStats.criticalDamage += 0.3;
                        break;
                    case 'magnet':
                        playerStats.magnetRange += 40;
                        break;
                }
            }

            if (this.game.unlockedSkills) {
                this.game.unlockedSkills.push(skill.id);
            }
            if (this.game.updateUI) {
                this.game.updateUI();
            }
        }

        getSkillStats(skillId) {
            const skill = this.game.skills?.find(s => s.id === skillId);
            if (!skill) return null;

            const level = this.skillLevels[skillId] || 1;
            const isMaxLevel = level >= 5;

            let stats = { ...skill, level, isMaxLevel };

            const baseMultiplier = 1 + (level - 1) * 0.2;
            const maxMultiplier = isMaxLevel ? 2 : 1;

            switch (skillId) {
                case 'rain_of_needles':
                case 'rainOfNeedles':
                    stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                    stats.projectileCount = (skill.projectileCount || 10) + (level - 1) * 2;
                    if (isMaxLevel) stats.projectileCount += 5;
                    stats.burstCount = (skill.burstCount || 3) + (level - 1) * 2;
                    if (isMaxLevel) stats.burstCount += 3;
                    stats.cooldown = (skill.cooldown || 15) * (1 - (level - 1) * 0.1);
                    if (isMaxLevel) stats.cooldown *= 0.5;
                    break;
                case 'thunder_dragon':
                case 'thunderDragon':
                    stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                    stats.duration = (skill.duration || 10) + (level - 1) * 0.5;
                    if (isMaxLevel) stats.duration += 2;
                    stats.moveSpeed = (skill.moveSpeed || 300) * (1 + (level - 1) * 0.15);
                    if (isMaxLevel) stats.moveSpeed *= 1.5;
                    stats.lightningFrequency = (skill.lightningFrequency || 0.5) * (1 - (level - 1) * 0.05);
                    if (isMaxLevel) stats.lightningFrequency *= 0.5;
                    stats.cooldown = (skill.cooldown || 25) * (1 - (level - 1) * 0.1);
                    if (isMaxLevel) stats.cooldown *= 0.5;
                    break;
                case 'ice_storm':
                case 'iceStorm':
                    stats.damage = Math.floor(skill.baseDamage * baseMultiplier * maxMultiplier);
                    stats.slowDuration = (skill.slowDuration || 3) + (level - 1) * 0.3;
                    if (isMaxLevel) stats.slowDuration += 1;
                    stats.slowAmount = (skill.slowAmount || 0.3) + (level - 1) * 0.05;
                    if (isMaxLevel) stats.slowAmount = 0.8;
                    stats.hailRate = (skill.hailRate || 0.3) + (level - 1) * 0.1;
                    if (isMaxLevel) stats.hailRate += 0.3;
                    stats.cooldown = (skill.cooldown || 30) * (1 - (level - 1) * 0.1);
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

        getRandomSkills(count) {
            const skills = this.game.skills || [];
            const availableSkills = skills.filter(skill => skill.type !== 'passive');

            const shuffled = [...availableSkills].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(count, shuffled.length));
        }

        showSkillNotification(skill) {
            return;
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
            }, 2000);
        }

        displaySkillSelection() {
            const availableSkills = this.getRandomSkills(3);
            const skillContainer = document.getElementById('skillCards');
            if (!skillContainer) return;

            skillContainer.innerHTML = '';

            availableSkills.forEach((skill, index) => {
                const currentLevel = this.skillLevels[skill.id] || 0;
                const nextLevel = currentLevel + 1;
                const isMaxLevel = currentLevel >= 5;

                let levelInfo = '';
                let upgradeInfo = '';

                if (currentLevel > 0) {
                    levelInfo = `<div class="skill-level">Lv.${currentLevel}</div>`;
                }

                if (isMaxLevel) {
                    upgradeInfo = `<div class="skill-upgrade" style="color: #FFD700;">已满级 - 属性已大幅提升！</div>`;
                } else if (currentLevel > 0) {
                    upgradeInfo = `<div class="skill-upgrade">升级到 ${nextLevel} 级</div>`;
                }

                let desc = skill.description;
                if (skill.type === 'active') {
                    if (currentLevel > 0) {
                        const stats = this.getSkillStats(skill.id);
                        if (stats) {
                            desc += `<br><small style="color: #888;">伤害: ${stats.damage} | 冷却: ${stats.cooldown.toFixed(1)}秒</small>`;
                        }
                    }
                }

                const card = document.createElement('div');
                card.className = 'skill-card';
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
                    if (this.game) {
                        this.game.gameState = 'playing';
                        this.game.isPaused = false;
                        this.game.lastTime = 0;
                        requestAnimationFrame((t) => this.game.gameLoop(t));
                    }
                });

                skillContainer.appendChild(card);
            });

            if (this.game) {
                document.getElementById('freeRefreshCount').textContent = this.game.freeRefreshCount || 1;
                document.getElementById('refreshBtn').disabled = (this.game.freeRefreshCount || 1) <= 0;
            }

            document.getElementById('skillSelection').classList.add('show');
        }

        refreshSkills() {
            if (this.game) {
                this.game.showToast('技能仅可通过击毁宝箱血条获取！');
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.SkillSystem = SkillSystem;
    }

})();
