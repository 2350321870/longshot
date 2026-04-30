(function() {
    'use strict';

    class BaseSystem {
        constructor() {
            this.enabled = true;
            this.game = null;
        }

        setGame(game) {
            this.game = game;
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
    }

    if (typeof window !== 'undefined') {
        window.BaseSystem = BaseSystem;
    }

})();
