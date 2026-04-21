(function() {
    'use strict';

    class ComboPlugin extends BasePlugin {
        constructor() {
            super('combo', '连击系统', '追踪击杀并提供连击奖励');
            this.version = '1.0.0';
            
            this.comboSystem = {
                currentCombo: 0,
                maxCombo: 0,
                comboTimer: 0,
                comboTimeout: 2.0,
                comboMultiplier: 1.0,
                killsInCombo: 0
            };
        }

        onRegister(game) {
            super.onRegister(game);
            this.comboSystem = {
                currentCombo: 0,
                maxCombo: 0,
                comboTimer: 0,
                comboTimeout: 2.0,
                comboMultiplier: 1.0,
                killsInCombo: 0
            };
            this.log('连击系统已注册');
        }

        onEnable() {
            super.onEnable();
            this.comboSystem.currentCombo = 0;
            this.comboSystem.maxCombo = 0;
            this.comboSystem.killsInCombo = 0;
            this.comboSystem.comboTimer = 0;
            this.comboSystem.comboMultiplier = 1.0;
            this.log('连击系统已激活');
        }

        update(dt) {
            if (!this.enabled) return;
            this.updateComboSystem(dt);
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

        addComboKill() {
            if (!this.enabled) return;
            
            this.comboSystem.killsInCombo++;
            this.comboSystem.comboTimer = this.comboSystem.comboTimeout;
            
            if (this.comboSystem.killsInCombo >= 3) {
                this.comboSystem.currentCombo++;
                this.comboSystem.maxCombo = Math.max(this.comboSystem.maxCombo, this.comboSystem.currentCombo);
                
                const bonusMultiplier = 1 + (this.comboSystem.currentCombo * 0.1);
                this.comboSystem.comboMultiplier = bonusMultiplier;
                
                if (this.game && this.game.floatingTexts) {
                    this.game.floatingTexts.push({
                        x: this.game.width / 2,
                        y: this.game.height / 3,
                        text: `${this.comboSystem.currentCombo}x 连击!`,
                        color: '#FFD700',
                        fontSize: 32,
                        lifetime: 1.5,
                        maxLifetime: 1.5,
                        vy: -30,
                        alpha: 1
                    });
                }
                
                if (this.game && this.game.addScreenShake) {
                    this.game.addScreenShake(2, 0.15);
                }
            }
        }

        getCurrentCombo() {
            return this.comboSystem.currentCombo;
        }

        getMaxCombo() {
            return this.comboSystem.maxCombo;
        }

        getComboMultiplier() {
            return this.comboSystem.comboMultiplier;
        }

        reset() {
            this.comboSystem.currentCombo = 0;
            this.comboSystem.maxCombo = 0;
            this.comboSystem.killsInCombo = 0;
            this.comboSystem.comboTimer = 0;
            this.comboSystem.comboMultiplier = 1.0;
        }

        onDisable() {
            super.onDisable();
            this.reset();
            this.log('连击系统已禁用');
        }

        getStats() {
            return {
                currentCombo: this.comboSystem.currentCombo,
                maxCombo: this.comboSystem.maxCombo,
                comboMultiplier: this.comboSystem.comboMultiplier
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.ComboPlugin = ComboPlugin;
    }

})();
