(function() {
    'use strict';

    class ScreenShakePlugin extends BasePlugin {
        constructor() {
            super('screenShake', '屏幕震动', '提供屏幕震动反馈效果');
            this.version = '1.0.0';
            
            this.shakeData = {
                x: 0,
                y: 0,
                intensity: 0,
                duration: 0
            };
        }

        onRegister(game) {
            super.onRegister(game);
            this.shakeData = {
                x: 0,
                y: 0,
                intensity: 0,
                duration: 0
            };
            this.log('屏幕震动系统已注册');
        }

        onEnable() {
            super.onEnable();
            this.reset();
            this.log('屏幕震动系统已激活');
        }

        update(dt) {
            if (!this.enabled) return;
            this.updateScreenShake(dt);
        }

        updateScreenShake(dt) {
            if (this.shakeData.duration > 0) {
                this.shakeData.duration -= dt;
                const shake = this.shakeData.intensity * (this.shakeData.duration / 0.3);
                this.shakeData.x = (Math.random() - 0.5) * shake * 2;
                this.shakeData.y = (Math.random() - 0.5) * shake * 2;
            } else {
                this.shakeData.x = 0;
                this.shakeData.y = 0;
            }
        }

        addScreenShake(intensity, duration) {
            if (!this.enabled) return;
            
            this.shakeData.intensity = Math.max(this.shakeData.intensity, intensity);
            this.shakeData.duration = Math.max(this.shakeData.duration, duration);
        }

        getShakeOffset() {
            return {
                x: this.shakeData.x,
                y: this.shakeData.y
            };
        }

        getX() {
            return this.shakeData.x;
        }

        getY() {
            return this.shakeData.y;
        }

        applyToContext(ctx) {
            if (this.shakeData.x !== 0 || this.shakeData.y !== 0) {
                ctx.translate(this.shakeData.x, this.shakeData.y);
            }
        }

        reset() {
            this.shakeData.x = 0;
            this.shakeData.y = 0;
            this.shakeData.intensity = 0;
            this.shakeData.duration = 0;
        }

        onDisable() {
            super.onDisable();
            this.reset();
            this.log('屏幕震动系统已禁用');
        }

        getStats() {
            return {
                shaking: this.shakeData.duration > 0,
                intensity: this.shakeData.intensity,
                offset: {
                    x: this.shakeData.x,
                    y: this.shakeData.y
                }
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.ScreenShakePlugin = ScreenShakePlugin;
    }

})();
