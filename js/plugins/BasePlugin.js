(function() {
    'use strict';

    class BasePlugin {
        constructor(options = {}) {
            this.id = options.id || this.constructor.name;
            this.enabled = true;
            this.options = options;
            this.game = null;
        }

        onRegister(game) {
            this.game = game;
            this.init();
        }

        onUnregister(game) {
            this.destroy();
        }

        onEnable(game) {
        }

        onDisable(game) {
        }

        init() {
        }

        update(dt) {
        }

        render(ctx) {
        }

        destroy() {
        }

        emit(event, ...args) {
            if (this.game && this.game.events) {
                this.game.events.emit(event, ...args);
            }
        }

        on(event, callback) {
            if (this.game && this.game.events) {
                this.game.events.on(event, callback);
            }
        }

        off(event, callback) {
            if (this.game && this.game.events) {
                this.game.events.off(event, callback);
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.BasePlugin = BasePlugin;
    }

})();
