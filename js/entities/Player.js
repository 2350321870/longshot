(function() {
    'use strict';

    class Player extends BaseEntity {
        constructor(game) {
            super();
            this.game = game;
            
            this.health = 100;
            this.maxHealth = 100;
            this.shield = 0;
            this.maxShield = 0;
            this.bulletDamage = 10;
            this.bulletSpeed = 500;
            this.fireRate = 0.15;
            this.lastShotTime = 0;
            this.moveSpeed = 0.3;
            this.critChance = 0.05;
            this.critMultiplier = 2;
            
            this.isInvincible = false;
            this.invincibleTimer = 0;
            this.isBlind = false;
            this.blindTimer = 0;
            this.isFrozen = false;
            this.frozenTimer = 0;
            this.isBurning = false;
            this.burnTimer = 0;
            this.burnDamage = 0;
            
            this.damageReduction = 0;
            this.armor = 0;
            this.dodgeChance = 0;
            this.lifesteal = 0;
            
            this.skills = {};
            this.activeSkills = [];
            this.passiveSkills = [];
            
            this.targetX = 0;
            this.targetY = 0;
            this.isMoving = false;
            
            this.slowEffects = [];
            this.regeneration = 0;
            this.bonusProjectiles = 0;
            this.pierce = 0;
            this.projectileBounce = 0;
            this.extraCritDamage = 0;
            this.burnChance = 0;
            this.freezeChance = 0;
            this.blindChance = 0;
            this.poisonChance = 0;
            this.chainLightning = 0;
            this.splashRadius = 0;
            this.splashDamage = 0;
            this.homingBullets = false;
            this.bulletSize = 1;
            this.bulletRange = 0;
            this.attackSpeed = 1;
            this.extraGold = 0;
            this.extraXP = 0;
            this.magnetRange = 0;
            this.thorns = 0;
            this.reviveCount = 3;
            
            this.characterId = 'default';
            this.characterConfig = null;
            
            this.inputX = 0;
            this.inputY = 0;
        }

        init(options = {}) {
            const canvas = this.game.canvas;
            this.x = canvas.width * 0.15;
            this.y = canvas.height / 2;
            this.targetX = this.x;
            this.targetY = this.y;
            this.radius = 25;
            
            this.health = options.maxHealth || 100;
            this.maxHealth = options.maxHealth || 100;
            this.bulletDamage = options.bulletDamage || 10;
            this.moveSpeed = options.moveSpeed || 0.3;
            this.reviveCount = 3;
            
            this.isInvincible = false;
            this.invincibleTimer = 0;
            this.slowEffects = [];
            
            this.skills = {};
            this.activeSkills = [];
            this.passiveSkills = [];
            
            if (this.game.saveData) {
                const charId = this.game.saveData.selectedCharacter || 'default';
                this.setCharacter(charId);
            }
        }

        setCharacter(characterId) {
            this.characterId = characterId;
            
            if (this.game.characterConfig && this.game.characterConfig[characterId]) {
                this.characterConfig = this.game.characterConfig[characterId];
                
                if (this.characterConfig.stats) {
                    const stats = this.characterConfig.stats;
                    if (stats.health) {
                        this.maxHealth += stats.health;
                        this.health += stats.health;
                    }
                    if (stats.damage) {
                        this.bulletDamage += stats.damage;
                    }
                    if (stats.speed) {
                        this.moveSpeed += stats.speed;
                    }
                }
            }
        }

        update(dt, currentTime) {
            this.updateInvincibility(dt);
            this.updateStatusEffects(dt);
            this.updateSlowEffects(dt);
            this.updateRegeneration(dt);
            
            if (this.characterConfig && this.characterConfig.passive) {
                this.updateCharacterPassive(dt, currentTime);
            }
        }

        updateInvincibility(dt) {
            if (this.isInvincible) {
                this.invincibleTimer -= dt;
                if (this.invincibleTimer <= 0) {
                    this.isInvincible = false;
                }
            }
        }

        updateStatusEffects(dt) {
            if (this.isBlind) {
                this.blindTimer -= dt;
                if (this.blindTimer <= 0) {
                    this.isBlind = false;
                }
            }
            
            if (this.isFrozen) {
                this.frozenTimer -= dt;
                if (this.frozenTimer <= 0) {
                    this.isFrozen = false;
                }
            }
            
            if (this.isBurning) {
                this.burnTimer -= dt;
                this.takeDamage(this.burnDamage * dt);
                if (this.burnTimer <= 0) {
                    this.isBurning = false;
                    this.burnDamage = 0;
                }
            }
        }

        updateSlowEffects(dt) {
            for (let i = this.slowEffects.length - 1; i >= 0; i--) {
                this.slowEffects[i].timer -= dt;
                if (this.slowEffects[i].timer <= 0) {
                    this.slowEffects.splice(i, 1);
                }
            }
        }

        updateRegeneration(dt) {
            if (this.regeneration > 0 && this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + this.regeneration * dt);
            }
        }

        updateCharacterPassive(dt, currentTime) {
            if (!this.characterConfig || !this.characterConfig.passive) return;
            
            const passive = this.characterConfig.passive;
            
            if (passive.type === 'health_based_reduction') {
                const healthPercent = this.health / this.maxHealth;
                const thresholdsLost = Math.floor((1 - healthPercent) / passive.threshold);
                this.damageReduction = thresholdsLost * passive.reductionPerThreshold;
            }
        }

        moveTo(targetX, targetY) {
            this.targetX = targetX;
            this.targetY = targetY;
            this.isMoving = true;
        }

        stopMoving() {
            this.isMoving = false;
        }

        updateMovement(dt, inputX, inputY) {
            if (this.isFrozen) return;
            
            let speedMultiplier = 1;
            for (const slow of this.slowEffects) {
                speedMultiplier = Math.min(speedMultiplier, 1 - slow.amount);
            }
            
            const speed = this.moveSpeed * speedMultiplier;
            const canvas = this.game.canvas;
            
            if (inputX !== 0 || inputY !== 0) {
                const len = Math.sqrt(inputX * inputX + inputY * inputY);
                this.x += (inputX / len) * speed * dt * 60;
                this.y += (inputY / len) * speed * dt * 60;
                this.isMoving = true;
            } else if (this.isMoving) {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 5) {
                    this.x += (dx / dist) * speed * dt * 60;
                    this.y += (dy / dist) * speed * dt * 60;
                } else {
                    this.isMoving = false;
                }
            }
            
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius - 40, this.y));
        }

        canShoot(currentTime) {
            const cooldown = this.fireRate / this.attackSpeed;
            return currentTime - this.lastShotTime >= cooldown && !this.isBlind;
        }

        shoot(targetX, targetY, currentTime) {
            if (!this.canShoot(currentTime)) return [];
            
            this.lastShotTime = currentTime;
            
            const bullets = [];
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            
            let isCrit = Math.random() < this.critChance;
            
            if (this.game.guaranteedCritNextShot) {
                isCrit = true;
                this.game.guaranteedCritNextShot = false;
            }
            
            const projectileCount = 1 + this.bonusProjectiles;
            
            for (let i = 0; i < projectileCount; i++) {
                let bulletAngle = angle;
                
                if (projectileCount > 1) {
                    const spread = 0.2;
                    bulletAngle = angle + (i - (projectileCount - 1) / 2) * spread;
                }
                
                const damage = isCrit ? 
                    this.bulletDamage * (this.critMultiplier + this.extraCritDamage) : 
                    this.bulletDamage;
                
                bullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(bulletAngle) * this.bulletSpeed,
                    vy: Math.sin(bulletAngle) * this.bulletSpeed,
                    damage: damage,
                    isCrit: isCrit,
                    radius: 8 * this.bulletSize,
                    pierce: this.pierce,
                    bounce: this.projectileBounce,
                    chainLightning: this.chainLightning,
                    splashRadius: this.splashRadius,
                    splashDamage: this.splashDamage,
                    homing: this.homingBullets,
                    burnChance: this.burnChance,
                    freezeChance: this.freezeChance,
                    blindChance: this.blindChance,
                    poisonChance: this.poisonChance,
                    maxRange: this.bulletRange > 0 ? this.bulletRange : null,
                    traveledDistance: 0,
                    enemiesHit: []
                });
            }
            
            return bullets;
        }

        takeDamage(amount) {
            if (this.isInvincible) return 0;
            
            let finalDamage = amount;
            
            if (this.damageReduction > 0) {
                finalDamage *= (1 - this.damageReduction);
            }
            
            if (this.armor > 0) {
                finalDamage = Math.max(1, finalDamage - this.armor);
            }
            
            if (this.dodgeChance > 0 && Math.random() < this.dodgeChance) {
                return 0;
            }
            
            if (this.shield > 0) {
                const shieldDamage = Math.min(this.shield, finalDamage);
                this.shield -= shieldDamage;
                finalDamage -= shieldDamage;
            }
            
            this.health = Math.max(0, this.health - finalDamage);
            
            return finalDamage;
        }

        heal(amount) {
            const oldHealth = this.health;
            this.health = Math.min(this.maxHealth, this.health + amount);
            return this.health - oldHealth;
        }

        addShield(amount, duration = 5) {
            this.maxShield = Math.max(this.maxShield, this.shield + amount);
            this.shield = Math.min(this.maxShield, this.shield + amount);
        }

        addSlowEffect(amount, duration) {
            this.slowEffects.push({
                amount: Math.min(amount, 0.9),
                timer: duration
            });
        }

        addSkill(skillId, skillData) {
            this.skills[skillId] = skillData;
            
            if (skillData.type === 'active') {
                this.activeSkills.push(skillId);
            } else {
                this.passiveSkills.push(skillId);
            }
            
            this.applySkillEffects(skillData);
        }

        applySkillEffects(skillData) {
            if (!skillData.effects) return;
            
            for (const effect of skillData.effects) {
                switch (effect.type) {
                    case 'bullet_damage':
                        this.bulletDamage += effect.value;
                        break;
                    case 'max_health':
                        this.maxHealth += effect.value;
                        this.health += effect.value;
                        break;
                    case 'move_speed':
                        this.moveSpeed += effect.value;
                        break;
                    case 'crit_chance':
                        this.critChance = Math.min(1, this.critChance + effect.value);
                        break;
                    case 'crit_multiplier':
                        this.critMultiplier += effect.value;
                        break;
                    case 'attack_speed':
                        this.attackSpeed += effect.value;
                        break;
                    case 'bonus_projectiles':
                        this.bonusProjectiles += effect.value;
                        break;
                    case 'pierce':
                        this.pierce += effect.value;
                        break;
                    case 'lifesteal':
                        this.lifesteal += effect.value;
                        break;
                    case 'damage_reduction':
                        this.damageReduction = Math.min(0.8, this.damageReduction + effect.value);
                        break;
                    case 'dodge_chance':
                        this.dodgeChance = Math.min(0.5, this.dodgeChance + effect.value);
                        break;
                    case 'regeneration':
                        this.regeneration += effect.value;
                        break;
                    case 'burn_chance':
                        this.burnChance = Math.min(1, this.burnChance + effect.value);
                        break;
                    case 'freeze_chance':
                        this.freezeChance = Math.min(1, this.freezeChance + effect.value);
                        break;
                    case 'splash_damage':
                        this.splashDamage = Math.max(this.splashDamage, effect.value);
                        this.splashRadius = Math.max(this.splashRadius, effect.radius || 80);
                        break;
                    case 'chain_lightning':
                        this.chainLightning = Math.max(this.chainLightning, effect.count);
                        break;
                    case 'extra_gold':
                        this.extraGold += effect.value;
                        break;
                    case 'extra_xp':
                        this.extraXP += effect.value;
                        break;
                    case 'magnet_range':
                        this.magnetRange += effect.value;
                        break;
                    case 'thorns':
                        this.thorns += effect.value;
                        break;
                    case 'bullet_size':
                        this.bulletSize += effect.value;
                        break;
                    case 'bullet_range':
                        this.bulletRange += effect.value;
                        break;
                }
            }
        }

        isDead() {
            return this.health <= 0;
        }

        canRevive() {
            return this.reviveCount > 0;
        }

        revive(healthPercent = 0.3) {
            if (!this.canRevive()) return false;
            
            this.reviveCount--;
            this.health = this.maxHealth * healthPercent;
            this.isInvincible = true;
            this.invincibleTimer = 2;
            
            return true;
        }

        render(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            
            if (this.isFrozen) {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            if (this.isBurning) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            let bodyColor = '#4488ff';
            if (this.characterConfig && this.characterConfig.color) {
                bodyColor = this.characterConfig.color;
            }
            
            const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, this.radius);
            gradient.addColorStop(0, '#88aaff');
            gradient.addColorStop(1, bodyColor);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#2244aa';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-8, -5, 8, 0, Math.PI * 2);
            ctx.arc(8, -5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-8, -5, 4, 0, Math.PI * 2);
            ctx.arc(8, -5, 4, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.shield > 0) {
                ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }

    if (typeof window !== 'undefined') {
        window.Player = Player;
    }

})();
