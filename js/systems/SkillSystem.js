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
        }

        getSkillStats(skillId) {
            const skill = this.skillData[skillId];
            if (!skill) return null;
            
            const level = this.skillLevels[skillId] || 1;
            const multiplier = 1 + (level - 1) * 0.15;
            
            return {
                ...skill,
                damage: Math.floor((skill.damage || 0) * multiplier),
                duration: skill.duration,
                cooldown: skill.cooldown,
                projectileCount: skill.projectileCount || skill.needleCount || 10,
                spread: skill.spread || 120,
                burstCount: skill.burstCount || 3,
                moveSpeed: skill.moveSpeed || 300,
                lightningFrequency: skill.lightningFrequency || 0.5,
                chainCount: skill.chainCount || 5,
                chainDamageReduction: skill.chainDamageReduction || 0.75,
                chainRange: skill.chainRange || 250
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
            
            for (let i = 0; i < stats.projectileCount; i++) {
                const spreadRad = stats.spread * Math.PI / 180;
                const startAngle = -Math.PI / 2 - spreadRad / 2;
                const angleStep = stats.projectileCount > 1 ? spreadRad / (stats.projectileCount - 1) : 0;
                const angle = startAngle + i * angleStep;
                
                let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
                isCrit = this.applyCharacterPassiveToCrit(isCrit);
                
                const critMultiplier = isCrit ? ((this.game.playerStats?.criticalDamage || 1.5) + critDamageBonusFromPassive) : 1;
                
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
                    needle.y < -50 || needle.y > this.game.height + 50) {
                    this.needles.splice(i, 1);
                }
            }
        }

        burstNeedles(needle) {
            const critDamageBonusFromPassive = this.getCritDamageBonusFromPassive();
            
            for (let i = 0; i < needle.burstCount; i++) {
                const angle = (Math.PI * 2 / needle.burstCount) * i;
                
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
                    color: isCrit ? '#FFD700' : '#90EE90'
                });
            }
            
            if (this.game.createHitParticles) {
                this.game.createHitParticles(needle.x, needle.y, '#00FF00');
            }
        }

        launchThunderDragon(stats) {
            const startX = Math.random() * 0.6 + 0.2;
            const startY = Math.random() * 0.6 + 0.2;
            
            const skillDamageBonus = 1 + this.getSkillDamageBonusFromPassive();
            
            const dragonX = this.game.width * startX;
            const dragonY = this.game.height * startY;
            
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
                chainRange: stats.chainRange || 250
            };
            this.thunderDragonTimer = stats.duration;
            
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
            if (this.thunderDragon.x > this.game.width - margin) {
                this.thunderDragon.x = this.game.width - margin;
                this.thunderDragon.targetAngle = Math.PI - this.thunderDragon.targetAngle + (Math.random() - 0.5) * 0.5;
            }
            if (this.thunderDragon.y < margin + 30) {
                this.thunderDragon.y = margin + 30;
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
            
            if (Math.random() < 0.15) {
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
            if (!this.game.player) return;
            
            const centerX = this.game.player.x;
            const centerY = this.game.player.y;
            
            const radius = stats.radius || 200;
            const duration = stats.duration || 8;
            
            this.iceStormActive = true;
            this.iceStormTimer = duration;
            
            if (this.game.addScreenShake) {
                this.game.addScreenShake(3, 0.2);
            }
            
            if (this.game.glowEffects) {
                this.game.glowEffects.push({
                    x: centerX,
                    y: centerY,
                    radius: radius * 0.3,
                    maxRadius: radius,
                    color: '#87CEEB',
                    lifetime: 0.5,
                    maxLifetime: 0.5
                });
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
            const radius = stats?.radius || 200;
            const damage = stats?.damage || 80;
            
            if (Math.random() < 0.15) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius * 0.8;
                
                const centerX = this.game.player?.x || this.game.width / 2;
                const centerY = this.game.player?.y || this.game.height / 2;
                
                let isCrit = Math.random() < (this.game.playerStats?.criticalChance || 0.05);
                isCrit = this.applyCharacterPassiveToCrit(isCrit);
                
                this.hailStones.push({
                    x: centerX + Math.cos(angle) * dist,
                    y: centerY + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 50,
                    vy: 100 + Math.random() * 100,
                    radius: 8 + Math.random() * 6,
                    damage: Math.floor(damage * 0.1),
                    isCrit: isCrit,
                    color: '#87CEEB'
                });
            }
            
            for (let i = this.hailStones.length - 1; i >= 0; i--) {
                const hail = this.hailStones[i];
                
                hail.y += hail.vy * dt;
                hail.x += hail.vx * dt;
                
                for (const enemy of this.game.enemies) {
                    if (enemy.isWinding && enemy.segments) {
                        for (const segment of enemy.segments) {
                            const dx = hail.x - segment.x;
                            const dy = hail.y - segment.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            if (dist < hail.radius + 15) {
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
                
                if (hail.y > this.game.height + 50) {
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
    }

    if (typeof window !== 'undefined') {
        window.SkillSystem = SkillSystem;
    }

})();
