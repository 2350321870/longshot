(function() {
    'use strict';

    class WindingEnemySystem {
        constructor(game) {
            this.game = game;
            this.segmentsDestroyed = 0;
            this.lastSkillSelectionAtSegment = 0;
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            console.log('WindingEnemySystem initialized');
        }

        addDirectReward(x, y) {
            const rewardTypes = ['gold', 'health_pack', 'damage_boost', 'speed_boost'];
            const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
            
            const comboMultiplier = (this.game.comboSystem && this.game.comboSystem.comboMultiplier) || 1;
            
            switch (type) {
                case 'gold':
                    const baseGoldAmount = 10 + Math.floor(Math.random() * 20);
                    const goldAmount = Math.floor(baseGoldAmount * comboMultiplier);
                    this.game.goldEarned += goldAmount;
                    this.game.score += goldAmount;
                    if (this.game.createCollectParticles) {
                        this.game.createCollectParticles(x, y, '#FFD700');
                    }
                    if (this.game.createFloatingText) {
                        this.game.createFloatingText(x, y - 30, `+${goldAmount}💰`, '#FFD700');
                    }
                    break;
                case 'health_pack':
                    if (this.game.playerStats) {
                        const healAmount = 20;
                        const oldHealth = this.game.playerStats.health;
                        this.game.playerStats.health = Math.min(
                            this.game.playerStats.health + healAmount,
                            this.game.playerStats.maxHealth
                        );
                        const actualHeal = Math.floor(this.game.playerStats.health - oldHealth);
                        if (actualHeal > 0 && this.game.createCollectParticles) {
                            this.game.createCollectParticles(x, y, '#FF6B6B');
                        }
                        if (actualHeal > 0 && this.game.createFloatingText) {
                            this.game.createFloatingText(x, y - 30, `+${actualHeal}❤️`, '#FF6B6B');
                        }
                    }
                    break;
                case 'damage_boost':
                    if (this.game.activeBuffs) {
                        this.game.activeBuffs.push({
                            type: 'damage_boost',
                            multiplier: 1.5,
                            startTime: this.game.currentTime,
                            duration: 10
                        });
                        if (this.game.createCollectParticles) {
                            this.game.createCollectParticles(x, y, '#FF6600');
                        }
                        if (this.game.createFloatingText) {
                            this.game.createFloatingText(x, y - 30, '伤害+50%', '#FF6600');
                        }
                    }
                    break;
                case 'speed_boost':
                    if (this.game.activeBuffs) {
                        this.game.activeBuffs.push({
                            type: 'speed_boost',
                            multiplier: 1.3,
                            startTime: this.game.currentTime,
                            duration: 8
                        });
                        if (this.game.createCollectParticles) {
                            this.game.createCollectParticles(x, y, '#00CED1');
                        }
                        if (this.game.createFloatingText) {
                            this.game.createFloatingText(x, y - 30, '速度+30%', '#00CED1');
                        }
                    }
                    break;
            }
            
            if (this.game.updateStatistics) {
                this.game.updateStatistics('powerup_collect', 1);
            }
        }

        addDirectChestReward(x, y) {
            const comboMultiplier = (this.game.comboSystem && this.game.comboSystem.comboMultiplier) || 1;
            const baseGoldAmount = 50 + Math.floor(Math.random() * 200);
            const goldAmount = Math.floor(baseGoldAmount * comboMultiplier);
            this.game.goldEarned += goldAmount;
            this.game.score += Math.floor(goldAmount * 2);
            
            if (this.game.updateStatistics) {
                this.game.updateStatistics('chest_open', 1);
            }
            
            if (this.game.createGoldParticles) {
                this.game.createGoldParticles(x, y);
            }
            
            if (this.game.createFloatingText) {
                this.game.createFloatingText(x, y - 30, `+${goldAmount}💰`, '#FFD700');
            }
            
            for (let i = 0; i < 2; i++) {
                if (Math.random() < 0.7) {
                    this.addDirectReward(
                        x + (Math.random() - 0.5) * 50,
                        y + (Math.random() - 0.5) * 50
                    );
                }
            }
            
            if (this.game.updateUI) {
                this.game.updateUI();
            }
        }

        spawnDragon(config) {
            const gameConfig = window.GameConfig || {};
            const dragonConfig = gameConfig.dragon || {};
            
            const baseSegments = dragonConfig.baseSegments || 50;
            const segmentsPerLevel = dragonConfig.segmentsPerLevel || 8;
            const maxSegments = dragonConfig.maxSegments || 150;
            const segments = Math.min(maxSegments, baseSegments + (this.game.currentLevel - 1) * segmentsPerLevel);
            
            const segmentSpacing = dragonConfig.segmentSpacing || 46;
            
            let startX = 50;
            let startY = 100;
            
            if (this.game.path && this.game.path.length > 0) {
                startX = this.game.path[0].x;
                startY = this.game.path[0].y;
            }
            
            const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            let totalHealth = 0;
            const baseHealthPerSegment = dragonConfig.baseHealthPerSegment || 25;
            const healthPerLevel = dragonConfig.healthPerLevel || 10;
            const frontMultiplier = dragonConfig.healthDistributionFrontMultiplier || 0.5;
            const backMultiplier = dragonConfig.healthDistributionBackMultiplier || 2.0;
            
            const baseHealth = baseHealthPerSegment + (this.game.currentLevel - 1) * healthPerLevel;
            
            const segmentHealths = [];
            for (let i = 0; i < segments; i++) {
                const progress = i / Math.max(1, segments - 1);
                const healthMultiplier = frontMultiplier + progress * (backMultiplier - frontMultiplier);
                const health = Math.max(1, Math.ceil(baseHealth * healthMultiplier));
                
                segmentHealths.push(health);
                totalHealth += health;
            }
            
            const dragonTypes = ['normal', 'armored', 'fast'];
            const dragonType = this.game.currentLevel >= 3 ? 
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
                const isChestSegment = (i + 1) % 5 === 0;
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
            
            this.game.enemies.push(dragon);
        }

        updateEnemies(dt) {
            const levelConfig = this.game.getLevelConfig(this.game.currentLevel);
            
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const enemy = this.game.enemies[i];
                
                if (enemy.isWinding && enemy.segments && enemy.segments.length > 0 && this.game.path && this.game.path.length > 0) {
                    this.updateWindingEnemy(enemy, dt);
                } else {
                    this.updateNormalEnemy(enemy, dt);
                }
                
                if (enemy.y > this.game.height + 100) {
                    this.game.enemies.splice(i, 1);
                    continue;
                }
                
                this.checkEnemyCollision(enemy, i);
                
                if (enemy.segments && enemy.segments.length > 0) {
                    this.checkBulletCollisionWithWindingEnemy(enemy, i, levelConfig);
                } else {
                    this.checkBulletCollisionWithNormalEnemy(enemy, i, levelConfig);
                }
            }
            
            this.processDestroyedSegments(levelConfig);
        }

        updateWindingEnemy(enemy, dt) {
            const head = enemy.segments[0];
            
            if (enemy.currentPathIndex === undefined) {
                enemy.currentPathIndex = 0;
            }
            
            if (enemy.pathDistance === undefined) {
                enemy.pathDistance = 0;
            }
            
            const gameConfig = window.GameConfig || {};
            const dragonCfg = gameConfig.dragon || {};
            let moveSpeed = dragonCfg.moveSpeed || 3;
            const segmentSpacing = enemy.segmentSpacing || 35;
            
            const enemySlowLevel = this.game.saveData.permanentUpgrades?.enemySlow || 0;
            if (enemySlowLevel > 0) {
                const slowPercent = Math.min(0.5, enemySlowLevel * 0.05);
                moveSpeed *= (1 - slowPercent);
            }
            
            enemy.pathDistance += moveSpeed * 60 * dt;
            
            const headPoint = this.getPointAtDistance(enemy.pathDistance);
            if (headPoint) {
                if (headPoint.isEnd) {
                    this.game.dragonReachedEnd(enemy);
                    return;
                }
                head.x = headPoint.x;
                head.y = headPoint.y;
            } else {
                const currentPoint = this.game.path[enemy.currentPathIndex];
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
        }

        updateNormalEnemy(enemy, dt) {
            enemy.y += enemy.speed * 60 * dt;
            enemy.angle += dt * 2;
            
            if (this.game.player) {
                const dx = this.game.player.x - enemy.x;
                if (Math.abs(dx) > 5) {
                    enemy.x += Math.sign(dx) * enemy.speed * 0.3 * 60 * dt;
                }
            }
        }

        checkEnemyCollision(enemy, index) {
            if (enemy.segments && enemy.segments.length > 0) {
                let playerHit = false;
                for (const segment of enemy.segments) {
                    const segRadius = segment.index === 0 ? 22 : 18;
                    const segObj = { x: segment.x, y: segment.y, radius: segRadius };
                    if (this.game.checkCollision(segObj, this.game.player)) {
                        playerHit = true;
                        break;
                    }
                }
                if (playerHit && this.game.player.invincible <= 0) {
                    this.game.takeDamageWithPassive(enemy.damage);
                    this.game.player.invincible = 0.5;
                }
            } else {
                if (this.game.checkCollision(enemy, this.game.player)) {
                    if (this.game.player.invincible <= 0) {
                        this.game.takeDamageWithPassive(enemy.damage);
                        this.game.player.invincible = 0.5;
                    }
                }
            }
        }

        checkBulletCollisionWithWindingEnemy(enemy, enemyIndex, levelConfig) {
            for (let j = this.game.bullets.length - 1; j >= 0; j--) {
                const bullet = this.game.bullets[j];
                let bulletHit = false;
                let hitSegmentIndex = -1;
                
                for (let k = 0; k < enemy.segments.length; k++) {
                    const segment = enemy.segments[k];
                    if (segment.health <= 0) continue;
                    
                    const segRadius = segment.index === 0 ? 22 : 18;
                    const segObj = { x: segment.x, y: segment.y, radius: segRadius };
                    
                    if (this.game.checkCircleCollision(bullet, segObj)) {
                        let actualDamage = bullet.damage;
                        if (enemy.special && enemy.special.damageReduction) {
                            actualDamage = Math.max(1, Math.floor(bullet.damage * (1 - enemy.special.damageReduction)));
                        }
                        
                        segment.health -= actualDamage;
                        enemy.health -= actualDamage;
                        
                        this.game.createDamageNumber(
                            segment.x,
                            segment.y - segRadius,
                            actualDamage,
                            bullet.isCrit,
                            enemy.special && enemy.special.damageReduction > 0
                        );
                        
                        this.game.createHitParticles(bullet.x, bullet.y, bullet.color);
                        
                        bulletHit = true;
                        hitSegmentIndex = k;
                        break;
                    }
                }
                
                if (bulletHit) {
                    if (bullet.pierceCount > 0) {
                        bullet.pierceCount--;
                    } else {
                        this.game.bullets.splice(j, 1);
                    }
                    
                    const destroyedSegments = enemy.segments.filter(s => s.health <= 0);
                    const destroyedCount = destroyedSegments.length;
                    
                    if (destroyedCount > 0) {
                        this.segmentsDestroyed += destroyedCount;
                        
                        for (let k = 0; k < destroyedCount; k++) {
                            if (this.game.addComboKill) {
                                this.game.addComboKill();
                            }
                        }
                        
                        const chestSegmentsDestroyed = destroyedSegments.filter(s => s.hasChest);
                        for (const chestSegment of chestSegmentsDestroyed) {
                            if (this.game.autoSelectSkill && Math.random() < 1) {
                                this.game.autoSelectSkill();
                            }
                        }
                        
                        for (const segment of destroyedSegments) {
                            if (segment.hasChest) {
                                this.addDirectChestReward(segment.x, segment.y);
                            }
                            
                            if (Math.random() < levelConfig.dropChance * 0.5) {
                                this.addDirectReward(segment.x, segment.y);
                            }
                        }
                    }
                    
                    if (enemy.health <= 0) {
                        this.handleEnemyKill(enemy, enemyIndex, levelConfig);
                        break;
                    }
                }
            }
        }

        checkBulletCollisionWithNormalEnemy(enemy, enemyIndex, levelConfig) {
            for (let j = this.game.bullets.length - 1; j >= 0; j--) {
                const bullet = this.game.bullets[j];
                
                if (this.game.checkCircleCollision(bullet, enemy)) {
                    enemy.health -= bullet.damage;
                    
                    this.game.createDamageNumber(
                        enemy.x,
                        enemy.y - enemy.radius,
                        bullet.damage,
                        bullet.isCrit
                    );
                    
                    this.game.createHitParticles(bullet.x, bullet.y, bullet.color);
                    
                    if (bullet.pierceCount > 0) {
                        bullet.pierceCount--;
                    } else {
                        this.game.bullets.splice(j, 1);
                    }
                    
                    if (enemy.health <= 0) {
                        this.handleEnemyKill(enemy, enemyIndex, levelConfig);
                        break;
                    }
                }
            }
        }

        handleBulletHit(bullet, bulletIndex, enemy, enemyIndex, levelConfig) {
            if (bullet.pierceCount > 0) {
                bullet.pierceCount--;
            } else {
                this.game.bullets.splice(bulletIndex, 1);
            }
            
            const destroyedSegments = enemy.segments.filter(s => s.health <= 0);
            const destroyedCount = destroyedSegments.length;
            
            if (destroyedCount > 0) {
                this.segmentsDestroyed += destroyedCount;
                
                const chestSegmentsDestroyed = destroyedSegments.filter(s => s.hasChest);
                for (const chestSegment of chestSegmentsDestroyed) {
                    if (this.game.autoSelectSkill && Math.random() < 1) {
                        this.game.autoSelectSkill();
                    }
                }
                
                for (const segment of destroyedSegments) {
                    if (segment.hasChest) {
                        this.addDirectChestReward(segment.x, segment.y);
                    }
                    
                    if (Math.random() < levelConfig.dropChance * 0.5) {
                        this.addDirectReward(segment.x, segment.y);
                    }
                }
                
                enemy.segments = enemy.segments.filter(s => s.health > 0);
                
                if (enemy.segments.length === 0) {
                    this.handleEnemyKill(enemy, enemyIndex, levelConfig);
                }
            }
        }

        handleEnemyKill(enemy, enemyIndex, levelConfig) {
            this.game.createKillExplosion(enemy.x, enemy.y, enemy.color, enemy.segments ? 1.5 : 1);
            this.game.addComboKill();
            this.game.enemiesKilled++;
            
            const comboBonus = this.game.comboSystem.comboMultiplier;
            this.game.score += Math.floor(enemy.maxHealth * comboBonus);
            this.game.goldEarned += Math.floor(enemy.maxHealth / 5 * comboBonus);
            
            this.game.updateStatistics('kill', 1);
            
            if (Math.random() < levelConfig.dropChance) {
                this.addDirectReward(enemy.x, enemy.y);
            }
            
            this.game.enemies.splice(enemyIndex, 1);
        }

        getPointAtDistance(distance) {
            if (!this.game.path || this.game.path.length < 2) return null;
            
            let accumulatedDist = 0;
            for (let i = 0; i < this.game.path.length - 1; i++) {
                const p1 = this.game.path[i];
                const p2 = this.game.path[i + 1];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const segmentLength = Math.sqrt(dx * dx + dy * dy);
                
                if (accumulatedDist + segmentLength >= distance) {
                    const segmentProgress = (distance - accumulatedDist) / segmentLength;
                    return {
                        x: p1.x + dx * segmentProgress,
                        y: p1.y + dy * segmentProgress,
                        isEnd: false
                    };
                }
                
                accumulatedDist += segmentLength;
            }
            
            const lastPoint = this.game.path[this.game.path.length - 1];
            return {
                x: lastPoint.x,
                y: lastPoint.y,
                isEnd: true
            };
        }

        processDestroyedSegments(levelConfig) {
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const enemy = this.game.enemies[i];
                
                if (!enemy.isWinding || !enemy.segments) continue;
                
                const destroyedSegments = enemy.segments.filter(s => s.health <= 0);
                const destroyedCount = destroyedSegments.length;
                
                if (destroyedCount > 0) {
                    this.segmentsDestroyed += destroyedCount;
                    
                    const chestSegmentsDestroyed = destroyedSegments.filter(s => s.hasChest);
                    for (const chestSegment of chestSegmentsDestroyed) {
                        if (this.game.autoSelectSkill && Math.random() < 0.65) {
                            this.game.autoSelectSkill();
                        }
                    }
                    
                    for (const segment of destroyedSegments) {
                        if (segment.hasChest) {
                            this.addDirectChestReward(segment.x, segment.y);
                        }
                        
                        if (Math.random() < levelConfig.dropChance * 0.5) {
                            this.addDirectReward(segment.x, segment.y);
                        }
                        
                        if (this.game.createDeathParticles) {
                            this.game.createDeathParticles(segment.x, segment.y, enemy.color);
                        }
                    }
                    
                    enemy.segments = enemy.segments.filter(s => s.health > 0);
                    
                    if (enemy.segments.length === 0) {
                        if (this.game.createDeathParticles) {
                            this.game.createDeathParticles(enemy.x, enemy.y, enemy.color);
                        }
                        this.game.enemiesKilled++;
                        this.game.score += enemy.maxHealth;
                        this.game.goldEarned += Math.floor(enemy.maxHealth / 5);
                        
                        this.game.updateStatistics('kill', 1);
                        
                        if (Math.random() < levelConfig.dropChance) {
                            this.addDirectReward(enemy.x, enemy.y);
                        }
                        
                        this.game.enemies.splice(i, 1);
                    }
                }
            }
        }

        renderEnemies(ctx) {
            this.game.enemies.forEach(enemy => {
                ctx.save();
                
                if (enemy.segments && enemy.segments.length > 0) {
                    this.renderWindingEnemy(ctx, enemy);
                } else {
                    this.renderNormalEnemy(ctx, enemy);
                }
                
                ctx.restore();
            });
        }

        renderWindingEnemy(ctx, enemy) {
            for (let i = enemy.segments.length - 1; i >= 0; i--) {
                const segment = enemy.segments[i];
                
                ctx.save();
                ctx.translate(segment.x, segment.y);
                
                const healthPercent = segment.health / segment.maxHealth;
                const baseHeight = i === 0 ? 28 : 22;
                const baseWidth = i === 0 ? 60 : 50;
                
                const segHeight = baseHeight;
                const segWidth = baseWidth * (0.5 + healthPercent * 0.5);
                
                const halfWidth = segWidth / 2;
                const halfHeight = segHeight / 2;
                
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                ctx.moveTo(-halfWidth + halfHeight, -halfHeight);
                ctx.lineTo(halfWidth - halfHeight, -halfHeight);
                ctx.arcTo(halfWidth, -halfHeight, halfWidth, halfHeight, halfHeight);
                ctx.lineTo(halfWidth, halfHeight - halfHeight);
                ctx.arcTo(halfWidth, halfHeight, -halfWidth, halfHeight, halfHeight);
                ctx.lineTo(-halfWidth + halfHeight, halfHeight);
                ctx.arcTo(-halfWidth, halfHeight, -halfWidth, -halfHeight, halfHeight);
                ctx.lineTo(-halfWidth, -halfHeight + halfHeight);
                ctx.arcTo(-halfWidth, -halfHeight, halfWidth, -halfHeight, halfHeight);
                ctx.closePath();
                
                const gradient = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
                gradient.addColorStop(0, this.darkenColor(enemy.color, 0.3));
                gradient.addColorStop(0.5, enemy.color);
                gradient.addColorStop(1, this.darkenColor(enemy.color, 0.3));
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.shadowBlur = 0;
                
                const innerPadding = 4;
                const innerHalfWidth = halfWidth - innerPadding;
                const innerHalfHeight = halfHeight - innerPadding;
                
                ctx.beginPath();
                ctx.moveTo(-innerHalfWidth + innerHalfHeight, -innerHalfHeight);
                ctx.lineTo(innerHalfWidth - innerHalfHeight, -innerHalfHeight);
                ctx.arcTo(innerHalfWidth, -innerHalfHeight, innerHalfWidth, innerHalfHeight, innerHalfHeight);
                ctx.lineTo(innerHalfWidth, innerHalfHeight - innerHalfHeight);
                ctx.arcTo(innerHalfWidth, innerHalfHeight, -innerHalfWidth, innerHalfHeight, innerHalfHeight);
                ctx.lineTo(-innerHalfWidth + innerHalfHeight, innerHalfHeight);
                ctx.arcTo(-innerHalfWidth, innerHalfHeight, -innerHalfWidth, -halfHeight, innerHalfHeight);
                ctx.lineTo(-innerHalfWidth, -innerHalfHeight + innerHalfHeight);
                ctx.arcTo(-innerHalfWidth, -innerHalfHeight, halfWidth, -halfHeight, innerHalfHeight);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fill();
                
                const barWidth = (innerHalfWidth * 2) * healthPercent;
                const barHeight = innerHalfHeight * 2 - 4;
                
                if (barWidth > 0) {
                    ctx.beginPath();
                    ctx.rect(-innerHalfWidth, -barHeight / 2, barWidth, barHeight);
                    
                    const healthColor = healthPercent > 0.5 ? '#44FF44' : healthPercent > 0.25 ? '#FFFF44' : '#FF4444';
                    const healthGradient = ctx.createLinearGradient(0, -barHeight / 2, 0, barHeight / 2);
                    healthGradient.addColorStop(0, healthColor);
                    healthGradient.addColorStop(0.5, this.lightenColor(healthColor, 0.3));
                    healthGradient.addColorStop(1, healthColor);
                    ctx.fillStyle = healthGradient;
                    ctx.fill();
                }
                
                if (segment.hasChest) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    
                    ctx.beginPath();
                    ctx.moveTo(-halfWidth + halfHeight, -halfHeight);
                    ctx.lineTo(halfWidth - halfHeight, -halfHeight);
                    ctx.arcTo(halfWidth, -halfHeight, halfWidth, halfHeight, halfHeight);
                    ctx.lineTo(halfWidth, halfHeight - halfHeight);
                    ctx.arcTo(halfWidth, halfHeight, -halfWidth, halfHeight, halfHeight);
                    ctx.lineTo(-halfWidth + halfHeight, halfHeight);
                    ctx.arcTo(-halfWidth, halfHeight, -halfWidth, -halfHeight, halfHeight);
                    ctx.lineTo(-halfWidth, -halfHeight + halfHeight);
                    ctx.arcTo(-halfWidth, -halfHeight, halfWidth, -halfHeight, halfHeight);
                    ctx.closePath();
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                }
                
                if (i === 0) {
                    ctx.font = `${segHeight * 0.8}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐲', 0, 0);
                } else if (segment.hasChest) {
                    ctx.font = `${segHeight * 0.7}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('📦', 0, 0);
                } else {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = `bold ${Math.min(segHeight * 0.5, 14)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const healthText = Math.ceil(segment.health) + '/' + Math.ceil(segment.maxHealth);
                    ctx.fillText(healthText, 0, 0);
                }
                
                ctx.restore();
            }
        }

        renderNormalEnemy(ctx, enemy) {
            ctx.translate(enemy.x, enemy.y);
            
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radius);
            gradient.addColorStop(0, enemy.color);
            gradient.addColorStop(1, this.darkenColor(enemy.color, 0.5));
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            ctx.rotate(enemy.angle);
            ctx.font = `${enemy.radius * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐲', 0, 0);
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(enemy.x, enemy.y);
            
            const healthBarWidth = enemy.radius * 2;
            const healthBarHeight = 8;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(
                -healthBarWidth / 2,
                -enemy.radius - 15,
                healthBarWidth,
                healthBarHeight
            );
            
            const healthColor = healthPercent > 0.5 ? '#44FF44' : healthPercent > 0.25 ? '#FFFF44' : '#FF4444';
            ctx.fillStyle = healthColor;
            ctx.fillRect(
                -healthBarWidth / 2,
                -enemy.radius - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                Math.ceil(enemy.health),
                0,
                -enemy.radius - 20
            );
        }

        darkenColor(color, amount) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            return `rgb(${Math.floor(r * (1 - amount))}, ${Math.floor(g * (1 - amount))}, ${Math.floor(b * (1 - amount))})`;
        }

        lightenColor(color, amount) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            return `rgb(${Math.min(255, Math.floor(r + (255 - r) * amount))}, ${Math.min(255, Math.floor(g + (255 - g) * amount))}, ${Math.min(255, Math.floor(b + (255 - b) * amount))})`;
        }

        getSkillSelectionInterval() {
            const gameConfig = window.GameConfig || {};
            const dragonConfig = gameConfig.dragon || {};
            
            const early = (dragonConfig.segmentsPerSkillSelectionEarly || 3) * 6;
            const mid = (dragonConfig.segmentsPerSkillSelectionMid || 5) * 6;
            const late = (dragonConfig.segmentsPerSkillSelectionLate || 7) * 6;
            
            if (this.segmentsDestroyed < 15) return early;
            if (this.segmentsDestroyed < 40) return mid;
            return late;
        }

        reset() {
            this.segmentsDestroyed = 0;
            this.lastSkillSelectionAtSegment = 0;
        }

        update(dt) {
            this.updateEnemies(dt);
        }

        updateSpawning(dt) {
            if (!this.game || !this.game.spawnTimer) {
                this.game.spawnTimer = 0;
            }

            const levelConfig = this.game.getLevelConfig(this.game.currentLevel);
            const maxEnemies = 3;
            
            if (this.game.enemies.length < maxEnemies) {
                this.game.spawnTimer += dt;
                const spawnInterval = 2.0;
                
                if (this.game.spawnTimer >= spawnInterval) {
                    this.game.spawnTimer = 0;
                    
                    const totalEnemiesInLevel = this.game.enemies.reduce((count, e) => {
                        if (e.segments) {
                            return count + e.segments.length;
                        }
                        return count + 1;
                    }, 0) + this.game.enemiesKilled;
                    
                    if (totalEnemiesInLevel < levelConfig.segments) {
                        this.spawnDragon(levelConfig);
                    }
                }
            }
        }

        render(ctx) {
            this.renderEnemies(ctx);
        }
    }

    window.WindingEnemySystem = WindingEnemySystem;

})();