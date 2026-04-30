(function() {
    'use strict';

    class PluginManager {
        constructor() {
            this.plugins = new Map();
            this.game = null;
        }

        setGame(game) {
            this.game = game;
        }

        register(plugin) {
            if (!plugin.id) {
                throw new Error('Plugin must have an id');
            }
            
            if (this.plugins.has(plugin.id)) {
                console.warn(`Plugin ${plugin.id} is already registered`);
                return false;
            }

            this.plugins.set(plugin.id, plugin);
            
            if (this.game && plugin.onRegister) {
                plugin.onRegister(this.game);
            }
            
            return true;
        }

        unregister(pluginId) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) return false;
            
            if (plugin.onUnregister && this.game) {
                plugin.onUnregister(this.game);
            }
            
            this.plugins.delete(pluginId);
            return true;
        }

        get(pluginId) {
            return this.plugins.get(pluginId);
        }

        has(pluginId) {
            return this.plugins.has(pluginId);
        }

        enable(pluginId) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) return false;
            
            if (plugin.onEnable && this.game) {
                plugin.onEnable(this.game);
            }
            
            plugin.enabled = true;
            return true;
        }

        disable(pluginId) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) return false;
            
            if (plugin.onDisable && this.game) {
                plugin.onDisable(this.game);
            }
            
            plugin.enabled = false;
            return true;
        }

        getAll() {
            return Array.from(this.plugins.values());
        }

        getEnabled() {
            return this.getAll().filter(p => p.enabled !== false);
        }

        emitToAll(methodName, ...args) {
            for (const plugin of this.getEnabled()) {
                if (typeof plugin[methodName] === 'function') {
                    try {
                        plugin[methodName](...args);
                    } catch (e) {
                        console.error(`Plugin ${plugin.id} error in ${methodName}:`, e);
                    }
                }
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.PluginManager = PluginManager;
    }

})();
