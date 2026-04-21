(function() {
    'use strict';

    const MODULES = [
        'js/core/EventBus.js',
        'js/core/PluginManager.js',
        'js/core/BaseEntity.js',
        'js/core/GameCore.js',
        'js/systems/BaseSystem.js',
        'js/systems/CollisionSystem.js',
        'js/systems/ParticleSystem.js',
        'js/systems/EffectSystem.js',
        'js/systems/UIManager.js',
        'js/storage/SaveManager.js',
        'js/data/GameConfig.js',
        'js/plugins/BasePlugin.js',
        'js/plugins/ComboPlugin.js',
        'js/plugins/ScreenShakePlugin.js',
        'js/entities/Player.js',
        'js/entities/Enemy.js',
        'js/entities/Bullet.js',
        'js/skills/index.js',
        'js/config.js',
        'js/game.js'
    ];

    let loadedCount = 0;
    let gameInstance = null;

    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src + '?v=' + Date.now();
        script.onload = function() {
            loadedCount++;
            console.log(`Loaded: ${src}`);
            if (callback) callback();
        };
        script.onerror = function() {
            console.error('Failed to load:', src);
            loadedCount++;
            if (callback) callback();
        };
        document.head.appendChild(script);
    }

    function loadModulesSequentially(index = 0) {
        if (index >= MODULES.length) {
            onAllModulesLoaded();
            return;
        }

        loadScript(MODULES[index], function() {
            loadModulesSequentially(index + 1);
        });
    }

    function onAllModulesLoaded() {
        console.log('All modules loaded. Initializing game...');
        
        if (window.GameCore) {
            try {
                gameInstance = new GameCore();
                if (gameInstance.init) {
                    gameInstance.init();
                }
                console.log('GameCore initialized successfully!');
                
                window.GameAPI.GameCore = GameCore;
                window.GameAPI.useNewCore = true;
            } catch (e) {
                console.error('Failed to initialize GameCore, falling back to DragonShooterGame:', e);
                fallbackToLegacyGame();
            }
        } else if (window.DragonShooterGame) {
            fallbackToLegacyGame();
        } else {
            console.error('No game implementation found! Neither GameCore nor DragonShooterGame.');
        }
    }
    
    function fallbackToLegacyGame() {
        if (!window.DragonShooterGame) {
            console.error('DragonShooterGame not found!');
            return;
        }
        
        try {
            gameInstance = new DragonShooterGame();
            if (gameInstance.init) {
                gameInstance.init();
            }
            console.log('DragonShooterGame (Legacy) initialized successfully!');
            window.GameAPI.useNewCore = false;
        } catch (e) {
            console.error('Failed to initialize DragonShooterGame:', e);
        }
    }

    function createGlobalAPI() {
        window.GameAPI = {
            getInstance: function() {
                return gameInstance;
            },
            
            getConfig: function() {
                return window.GameConfig || {};
            },
            
            getSaveData: function() {
                if (gameInstance && gameInstance.saveData) {
                    return gameInstance.saveData;
                }
                return null;
            },
            
            saveGame: function() {
                if (gameInstance && gameInstance.saveGame) {
                    return gameInstance.saveGame();
                }
                return false;
            },
            
            loadGame: function() {
                if (gameInstance && gameInstance.loadGame) {
                    return gameInstance.loadGame();
                }
                return false;
            },
            
            clearSave: function() {
                if (confirm('确定要清除所有存档数据吗？此操作不可恢复！')) {
                    try {
                        localStorage.removeItem('dragonShooterSave');
                        location.reload();
                        return true;
                    } catch (e) {
                        console.error('Failed to clear save:', e);
                        return false;
                    }
                }
                return false;
            },
            
            getModuleStatus: function() {
                return {
                    total: MODULES.length,
                    loaded: loadedCount,
                    modules: MODULES
                };
            }
        };
    }

    createGlobalAPI();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadModulesSequentially();
        });
    } else {
        loadModulesSequentially();
    }

})();
