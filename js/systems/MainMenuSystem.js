(function() {
    'use strict';

    class MainMenuSystem {
        constructor(game) {
            this.game = game;
            this.currentTab = 'battle';
            this.isInitialized = false;
            this.tasksRefreshInterval = null;
        }

        init() {
            if (this.isInitialized) return;
            
            this.setupEventListeners();
            this.startTasksRefreshTimer();
            this.isInitialized = true;
            
            console.log('MainMenuSystem initialized');
        }

        setupEventListeners() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const tab = item.dataset.tab;
                    this.switchTab(tab);
                });
            });

            document.querySelectorAll('.achievement-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const filter = tab.dataset.filter;
                    this.renderAchievementsTab(filter);
                });
            });

            const closeGachaBtn = document.getElementById('closeGachaResult');
            if (closeGachaBtn) {
                closeGachaBtn.addEventListener('click', () => {
                    document.getElementById('gachaResult').classList.remove('show');
                });
            }

            if (document.getElementById('gachaSingleBtn')) {
                document.getElementById('gachaSingleBtn').addEventListener('click', () => this.doGacha(1));
            }
            if (document.getElementById('gachaTenBtn')) {
                document.getElementById('gachaTenBtn').addEventListener('click', () => this.doGacha(10));
            }

            const startGameBtn = document.getElementById('startGameBtn');
            if (startGameBtn) {
                startGameBtn.addEventListener('click', () => {
                    const maxLevel = this.game.saveData.maxUnlockedLevel || 1;
                    this.game.startLevel(maxLevel);
                });
            }
        }

        startTasksRefreshTimer() {
            this.updateTasksRefreshTime();
            this.tasksRefreshInterval = setInterval(() => {
                this.updateTasksRefreshTime();
            }, 1000);
        }

        stopTasksRefreshTimer() {
            if (this.tasksRefreshInterval) {
                clearInterval(this.tasksRefreshInterval);
                this.tasksRefreshInterval = null;
            }
        }

        renderMainMenu() {
            this.game.gameState = 'mainMenu';
            
            const mainScreen = document.getElementById('mainScreen');
            const bottomNav = document.getElementById('bottomNav');
            const topBar = document.getElementById('topBar');
            
            if (mainScreen) mainScreen.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
            if (topBar) topBar.classList.remove('hidden');
            
            const battleInfo = document.getElementById('battleInfo');
            const battleUI = document.getElementById('battleUI');
            const pauseBtn = document.getElementById('pauseBtn');
            const fenceBar = document.getElementById('fenceBar');
            
            if (battleInfo) battleInfo.classList.add('hidden');
            if (battleUI) battleUI.classList.add('hidden');
            if (pauseBtn) pauseBtn.classList.add('hidden');
            if (fenceBar) fenceBar.classList.add('hidden');
            
            const levelUpScreen = document.getElementById('levelUpScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            const skillSelection = document.getElementById('skillSelection');
            const pauseMenu = document.getElementById('pauseMenu');
            const reviveScreen = document.getElementById('reviveScreen');
            
            if (levelUpScreen) levelUpScreen.classList.remove('show');
            if (gameOverScreen) gameOverScreen.classList.remove('show');
            if (skillSelection) skillSelection.classList.remove('show');
            if (pauseMenu) pauseMenu.classList.remove('show');
            if (reviveScreen) reviveScreen.classList.remove('show');
            
            this.switchTab('battle');
            this.updateMainMenuUI();
        }

        updateMainMenuUI() {
            const saveData = this.game.saveData;
            if (!saveData) return;

            const energyDisplay = document.getElementById('energyDisplay');
            const mainGoldDisplay = document.getElementById('mainGoldDisplay');
            const chapterTitle = document.getElementById('chapterTitle');

            if (energyDisplay) {
                energyDisplay.textContent = `${saveData.energy || 10}/${saveData.maxEnergy || 10}`;
            }
            if (mainGoldDisplay) {
                mainGoldDisplay.textContent = saveData.gold || 0;
            }
            
            const chapter = Math.ceil((saveData.maxUnlockedLevel || 1) / 9);
            if (chapterTitle) {
                chapterTitle.textContent = `${chapter}. 屠龙第${chapter}章`;
            }
            
            if (this.currentTab === 'battle') {
                this.renderBattleTab();
            }
        }

        switchTab(tab) {
            this.currentTab = tab;
            
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tab);
            });
            
            const tabs = ['battle', 'shop', 'character', 'equipment', 'tasks', 'achievements'];
            tabs.forEach(t => {
                const el = document.getElementById(t + 'Tab');
                if (el) {
                    el.classList.toggle('hidden', t !== tab);
                }
            });
            
            if (tab === 'battle') {
                this.renderBattleTab();
            } else if (tab === 'character') {
                this.renderCharacterTab();
            } else if (tab === 'shop') {
                this.renderShopTab();
            } else if (tab === 'equipment') {
                this.renderEquipmentTab();
            } else if (tab === 'tasks') {
                this.renderTasksTab();
            } else if (tab === 'achievements') {
                this.renderAchievementsTab();
            }
        }

        renderBattleTab() {
            this.renderLevelGrid();
            this.renderLevelRewards();
        }

        renderLevelGrid() {
            const grid = document.getElementById('levelGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const maxLevel = this.game.saveData.maxUnlockedLevel || 1;
            const highestPassed = this.game.saveData.highestLevelPassed || 0;
            
            const levelsPerRow = 3;
            const totalLevels = Math.max(maxLevel + 3, 9);
            
            for (let i = 0; i < totalLevels; i++) {
                const level = i + 1;
                const isUnlocked = level <= maxLevel;
                const isPassed = level <= highestPassed;
                
                const cell = document.createElement('div');
                cell.className = `level-cell ${isUnlocked ? '' : 'locked'} ${isPassed ? 'passed' : ''}`;
                
                if (isUnlocked) {
                    cell.innerHTML = `
                        <div class="level-number">${level}</div>
                        <button class="level-play-btn" data-level="${level}">
                            ${isPassed ? '🔄' : '▶️'}
                        </button>
                    `;
                    
                    cell.querySelector('.level-play-btn').addEventListener('click', () => {
                        this.game.startLevel(level);
                    });
                } else {
                    cell.innerHTML = '<div class="level-locked">🔒</div>';
                }
                
                grid.appendChild(cell);
            }
        }

        renderLevelRewards() {
            const rewardsEl = document.getElementById('progressRewards');
            if (!rewardsEl) return;
            
            rewardsEl.innerHTML = '';
            
            const levelRewards = GameData.levelRewards;
            const currentLevel = this.game.saveData.maxUnlockedLevel || 1;
            
            for (const [level, reward] of Object.entries(levelRewards)) {
                const lvl = parseInt(level);
                const isUnlocked = lvl <= currentLevel;
                
                const rewardItem = document.createElement('div');
                rewardItem.className = `reward-item ${isUnlocked ? 'unlocked' : ''}`;
                rewardItem.innerHTML = `
                    <div class="reward-level">第${lvl}关</div>
                    <div class="reward-content">${reward.icon} ${reward.name}</div>
                `;
                
                rewardsEl.appendChild(rewardItem);
            }
        }

        renderCharacterTab() {
            const list = document.getElementById('characterGrid');
            if (!list) return;
            
            list.innerHTML = '';
            
            const characters = GameData.characterConfig;
            const saveData = this.game.saveData;
            const unlockedChars = saveData.unlockedCharacters || ['default'];
            const selectedChar = saveData.selectedCharacter || 'default';
            
            for (const [charId, char] of Object.entries(characters)) {
                const isUnlocked = unlockedChars.includes(charId);
                const isSelected = charId === selectedChar;
                
                const charItem = document.createElement('div');
                charItem.className = `character-item ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`;
                
                let actionHtml = '';
                if (!isUnlocked) {
                    actionHtml = `<button class="char-unlock-btn" data-char="${charId}">💰 ${char.price}</button>`;
                } else if (!isSelected) {
                    actionHtml = `<button class="char-select-btn" data-char="${charId}">选择</button>`;
                } else {
                    actionHtml = '<div class="char-selected-badge">✓ 已选择</div>';
                }
                
                charItem.innerHTML = `
                    <div class="char-icon" style="color: ${char.color}">${char.icon}</div>
                    <div class="char-name">${char.name}</div>
                    <div class="char-desc">${char.description}</div>
                    <div class="char-passive">
                        <div class="passive-name">${char.passive.name}</div>
                        <div class="passive-desc">${char.passive.description}</div>
                    </div>
                    ${actionHtml}
                `;
                
                list.appendChild(charItem);
            }
            
            list.querySelectorAll('.char-unlock-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const charId = btn.dataset.char;
                    this.unlockCharacter(charId);
                });
            });
            
            list.querySelectorAll('.char-select-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const charId = btn.dataset.char;
                    this.selectCharacter(charId);
                });
            });
        }

        unlockCharacter(charId) {
            const char = GameData.characterConfig[charId];
            if (!char) return;
            
            if (this.game.saveData.gold >= char.price) {
                this.game.saveData.gold -= char.price;
                if (!this.game.saveData.unlockedCharacters.includes(charId)) {
                    this.game.saveData.unlockedCharacters.push(charId);
                }
                this.game.saveGameData();
                this.game.showToast(`解锁 ${char.name}！`);
                this.renderCharacterTab();
            } else {
                this.game.showToast('金币不足！');
            }
        }

        selectCharacter(charId) {
            if (this.game.saveData.unlockedCharacters.includes(charId)) {
                this.game.saveData.selectedCharacter = charId;
                this.game.saveGameData();
                this.game.showToast(`选择 ${GameData.characterConfig[charId].name}！`);
                this.renderCharacterTab();
            }
        }

        renderShopTab() {
            this.renderShopItems();
            this.renderUpgradeItems();
        }

        renderShopItems() {
            const grid = document.getElementById('shopGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const shopItems = GameData.shopItems;
            
            for (const item of shopItems) {
                const canBuy = this.game.saveData.gold >= item.price;
                const card = document.createElement('div');
                card.className = 'shop-item';
                card.innerHTML = `
                    <div class="shop-icon">${item.icon}</div>
                    <div class="shop-name">${item.name}</div>
                    <div class="shop-desc">${item.description}</div>
                    <div class="shop-price">
                        <span class="shop-price-icon">💰</span>
                        <span class="shop-price-value">${item.price}</span>
                    </div>
                    <button class="shop-buy-btn" data-id="${item.id}" ${!canBuy ? 'disabled' : ''}>
                        购买
                    </button>
                `;
                grid.appendChild(card);
            }
            
            grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    this.buyShopItem(id);
                });
            });
        }

        buyShopItem(id) {
            const shopItems = GameData.shopItems;
            const item = shopItems.find(i => i.id === id);
            if (!item) return;
            
            if (this.game.saveData.gold >= item.price) {
                this.game.saveData.gold -= item.price;
                
                if (item.type === 'gold') {
                    this.game.saveData.gold += item.amount;
                    this.game.showToast(`获得 ${item.amount} 金币！`);
                } else if (item.type === 'energy') {
                    this.game.saveData.energy = Math.min(this.game.saveData.maxEnergy, this.game.saveData.energy + item.amount);
                    this.game.showToast(`恢复 ${item.amount} 体力！`);
                }
                
                this.game.saveGameData();
                this.updateMainMenuUI();
                this.renderShopTab();
            } else {
                this.game.showToast('金币不足！');
            }
        }

        renderUpgradeItems() {
            const grid = document.getElementById('upgradeGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const upgrades = [
                { id: 'bulletDamage', name: '攻击强化', icon: '💥', basePrice: 100, description: '永久提升子弹伤害 +5' },
                { id: 'maxHealth', name: '生命强化', icon: '❤️', basePrice: 100, description: '永久提升最大生命值 +20' },
                { id: 'moveSpeed', name: '速度强化', icon: '🏃', basePrice: 100, description: '永久提升移动速度 +5%' }
            ];
            
            for (const upgrade of upgrades) {
                const currentLevel = this.game.saveData.permanentUpgrades[upgrade.id] || 0;
                const price = upgrade.basePrice * (currentLevel + 1);
                const canBuy = this.game.saveData.gold >= price;
                
                const card = document.createElement('div');
                card.className = 'upgrade-item';
                card.innerHTML = `
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                    <div class="upgrade-level">当前等级: Lv.${currentLevel}</div>
                    <div class="upgrade-price">
                        <span class="upgrade-price-icon">💰</span>
                        <span class="upgrade-price-value">${price}</span>
                    </div>
                    <button class="upgrade-btn" data-id="${upgrade.id}" ${!canBuy ? 'disabled' : ''}>
                        强化
                    </button>
                `;
                grid.appendChild(card);
            }
            
            grid.querySelectorAll('.upgrade-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    this.upgradePermanent(id);
                });
            });
        }

        upgradePermanent(id) {
            const basePrices = {
                bulletDamage: 100,
                maxHealth: 100,
                moveSpeed: 100
            };
            
            const currentLevel = this.game.saveData.permanentUpgrades[id] || 0;
            const price = basePrices[id] * (currentLevel + 1);
            
            if (this.game.saveData.gold >= price) {
                this.game.saveData.gold -= price;
                this.game.saveData.permanentUpgrades[id] = currentLevel + 1;
                this.game.saveGameData();
                this.updateMainMenuUI();
                this.renderUpgradeItems();
                
                const names = {
                    bulletDamage: '攻击强化',
                    maxHealth: '生命强化',
                    moveSpeed: '速度强化'
                };
                this.game.showToast(`${names[id]} 升级到 Lv.${currentLevel + 1}！`);
            } else {
                this.game.showToast('金币不足！');
            }
        }

        renderEquipmentTab() {
            this.renderEquipUpgradeGrid();
            this.renderEquipmentUI();
        }

        renderEquipUpgradeGrid() {
            const grid = document.getElementById('equipGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const equipmentConfig = GameData.equipmentConfig;
            
            for (const [key, config] of Object.entries(equipmentConfig)) {
                const equip = this.game.saveData.equipment[key];
                const owned = equip.owned;
                const level = equip.level || 0;
                
                const card = document.createElement('div');
                card.className = `equip-card ${owned ? 'owned' : ''}`;
                
                let actionHtml = '';
                let priceHtml = '';
                
                if (!owned) {
                    priceHtml = `<div class="equip-card-price">
                        <span class="equip-card-price-value">💰 ${config.basePrice}</span>
                    </div>`;
                    actionHtml = `<button class="equip-card-btn" data-type="${key}" data-action="buy">购买</button>`;
                } else {
                    const upgradePrice = config.upgradePrice * (level + 1);
                    priceHtml = `<div class="equip-card-price">
                        <span class="equip-card-price-value">💰 ${upgradePrice}</span>
                    </div>`;
                    actionHtml = `<button class="equip-card-btn" data-type="${key}" data-action="upgrade">强化</button>`;
                }
                
                card.innerHTML = `
                    <div class="equip-card-icon">${config.icon}</div>
                    <div class="equip-card-name">${config.name}</div>
                    <div class="equip-card-level">${owned ? `Lv.${level}` : '未拥有'}</div>
                    <div class="equip-card-desc">${owned ? config.upgradeDescription : config.buyDescription}</div>
                    ${priceHtml}
                    ${actionHtml}
                `;
                
                grid.appendChild(card);
            }
            
            grid.querySelectorAll('.equip-card-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    const action = btn.dataset.action;
                    this.handleEquipUpgrade(type, action);
                });
            });
        }

        handleEquipUpgrade(type, action) {
            const config = GameData.equipmentConfig[type];
            const equip = this.game.saveData.equipment[type];
            
            if (action === 'buy') {
                if (this.game.saveData.gold >= config.basePrice) {
                    this.game.saveData.gold -= config.basePrice;
                    equip.owned = true;
                    equip.level = 0;
                    this.game.saveGameData();
                    this.game.showToast(`购买 ${config.name}！`);
                    this.renderEquipUpgradeGrid();
                } else {
                    this.game.showToast('金币不足！');
                }
            } else if (action === 'upgrade') {
                const upgradePrice = config.upgradePrice * (equip.level + 1);
                if (this.game.saveData.gold >= upgradePrice) {
                    this.game.saveData.gold -= upgradePrice;
                    equip.level = (equip.level || 0) + 1;
                    this.game.saveGameData();
                    this.game.showToast(`${config.name} 强化到 Lv.${equip.level}！`);
                    this.renderEquipUpgradeGrid();
                } else {
                    this.game.showToast('金币不足！');
                }
            }
        }

        renderEquipmentUI() {
            const equipUI = document.getElementById('equipmentUI');
            if (!equipUI) return;
            
            equipUI.innerHTML = '';
            
            const equipmentConfig = GameData.equipmentConfig;
            
            for (const [key, config] of Object.entries(equipmentConfig)) {
                const equip = this.game.saveData.equipment[key];
                const equippedItem = equip.equippedItem;
                
                const slotEl = document.createElement('div');
                slotEl.className = `equip-slot ${equippedItem ? 'equipped' : ''}`;
                slotEl.innerHTML = `
                    <div class="slot-icon">${config.icon}</div>
                    <div class="slot-name">${config.name}</div>
                    <div class="slot-item">${equippedItem ? `${equippedItem.name} (${this.getQualityName(equippedItem.quality)})` : '空'}</div>
                `;
                
                equipUI.appendChild(slotEl);
            }
        }

        getQualityName(quality) {
            const qualityConfig = GameData.qualityConfig;
            return qualityConfig[quality]?.name || quality;
        }

        renderTasksTab() {
            const list = document.getElementById('tasksList');
            if (!list) return;
            
            list.innerHTML = '';
            
            this.game.saveManager.checkDailyTasksRefresh(GameData.dailyTaskPool);
            
            const dailyTasks = this.game.saveData.dailyTasks?.tasks || [];
            if (dailyTasks.length === 0) {
                list.innerHTML = '<div style="color: #aaa; text-align: center; padding: 40px;">暂无每日任务</div>';
                return;
            }
            
            dailyTasks.forEach(task => {
                const isCompleted = task.progress >= task.target;
                const isClaimed = task.claimed === true;
                const progress = Math.min(task.progress, task.target);
                const progressPercent = (progress / task.target) * 100;
                
                const taskItem = document.createElement('div');
                taskItem.className = `task-item ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`;
                
                let rewardsHtml = '';
                if (task.rewards.gold > 0) {
                    rewardsHtml += `💰${task.rewards.gold}`;
                }
                if (task.rewards.diamonds > 0) {
                    if (rewardsHtml) rewardsHtml += ' ';
                    rewardsHtml += `💎${task.rewards.diamonds}`;
                }
                
                let actionHtml = '';
                if (isClaimed) {
                    actionHtml = '<div class="task-claimed-text">✓ 已领取</div>';
                } else if (isCompleted) {
                    actionHtml = `<button class="task-claim-btn" data-task-id="${task.id}">领取奖励</button>`;
                } else {
                    actionHtml = `<div class="task-progress-text ${isCompleted ? 'completed' : ''}">${progress}/${task.target}</div>`;
                }
                
                taskItem.innerHTML = `
                    <div class="task-header">
                        <div class="task-name">${task.name}</div>
                        <div class="task-rewards">${rewardsHtml}</div>
                    </div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-progress-container">
                        <div class="task-progress-bar">
                            <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        ${actionHtml}
                    </div>
                `;
                
                list.appendChild(taskItem);
            });
            
            list.querySelectorAll('.task-claim-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const taskId = btn.dataset.taskId;
                    this.claimTaskReward(taskId);
                });
            });
            
            this.updateTasksRefreshTime();
        }

        updateTasksRefreshTime() {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const diff = tomorrow - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const timeEl = document.getElementById('tasksRefreshTime');
            if (timeEl) {
                timeEl.textContent = `刷新时间: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        claimTaskReward(taskId) {
            const result = this.game.saveManager?.claimTaskReward(taskId);
            if (result) {
                if (result.success) {
                    let rewardText = '';
                    if (result.rewards?.gold) {
                        rewardText += `💰${result.rewards.gold}`;
                    }
                    if (result.rewards?.diamonds) {
                        if (rewardText) rewardText += ' ';
                        rewardText += `💎${result.rewards.diamonds}`;
                    }
                    this.game.showToast(`领取成功！${rewardText}`);
                } else {
                    this.game.showToast(result.message);
                }
            }
            this.renderTasksTab();
        }

        renderAchievementsTab(filter = 'all') {
            const list = document.getElementById('achievementsList');
            if (!list) return;
            
            list.innerHTML = '';
            
            if (filter === 'stats') {
                this.renderStatisticsTab(list);
                return;
            }
            
            if (filter === 'shop') {
                this.renderAchievementShop(list);
                return;
            }
            
            const achievements = this.game.achievementSystem.getSortedAchievements();
            
            let filteredAchievements = achievements;
            if (filter === 'unlocked') {
                filteredAchievements = achievements.filter(a => {
                    return this.game.saveManager.isAchievementUnlocked(a.id);
                });
            } else if (filter === 'locked') {
                filteredAchievements = achievements.filter(a => {
                    return !this.game.saveManager.isAchievementUnlocked(a.id);
                });
            }
            
            const totalPoints = this.game.saveManager.getAchievementPoints();
            const unlockedCount = achievements.filter(a => this.game.saveManager.isAchievementUnlocked(a.id)).length;
            const claimableCount = achievements.filter(a => {
                const unlocked = this.game.saveManager.isAchievementUnlocked(a.id);
                const claimed = this.game.saveManager.isAchievementClaimed(a.id);
                return unlocked && !claimed;
            }).length;
            
            const totalAchievementPointsEl = document.getElementById('totalAchievementPoints');
            const unlockedAchievementsEl = document.getElementById('unlockedAchievements');
            const totalAchievementsEl = document.getElementById('totalAchievements');
            
            if (totalAchievementPointsEl) {
                totalAchievementPointsEl.textContent = totalPoints;
            }
            if (unlockedAchievementsEl) {
                unlockedAchievementsEl.textContent = unlockedCount;
            }
            if (totalAchievementsEl) {
                totalAchievementsEl.textContent = achievements.length;
            }
            
            if (claimableCount > 0) {
                const claimableBadge = document.createElement('div');
                claimableBadge.className = 'claimable-badge';
                claimableBadge.innerHTML = `🎁 ${claimableCount} 可领取`;
                list.appendChild(claimableBadge);
            }
            
            filteredAchievements.forEach(achievement => {
                const isUnlocked = this.game.saveManager.isAchievementUnlocked(achievement.id);
                const isClaimed = this.game.saveManager.isAchievementClaimed(achievement.id);
                const progress = this.game.achievementSystem.getAchievementProgress(achievement);
                const progressPercent = Math.min((progress / Math.max(achievement.target, 1)) * 100, 100);
                
                const achievementItem = document.createElement('div');
                achievementItem.className = `achievement-item ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''} ${isUnlocked && !isClaimed ? 'claimable' : ''}`;
                
                let rewardsHtml = '';
                if (achievement.rewards) {
                    if (achievement.rewards.gold > 0) {
                        rewardsHtml += `💰 ${achievement.rewards.gold}`;
                    }
                    if (achievement.rewards.diamonds > 0) {
                        if (rewardsHtml) rewardsHtml += ' | ';
                        rewardsHtml += `💎 ${achievement.rewards.diamonds}`;
                    }
                }
                
                let actionHtml = '';
                if (isClaimed) {
                    actionHtml = '<div class="achievement-claimed-text">✓ 已领取</div>';
                } else if (isUnlocked) {
                    actionHtml = `<button class="achievement-claim-btn" data-achievement-id="${achievement.id}">领取奖励</button>`;
                }
                
                achievementItem.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">
                            ${achievement.name}
                            ${isUnlocked && !isClaimed ? '<span class="new-badge">NEW</span>' : ''}
                        </div>
                        <div class="achievement-desc">${achievement.description}</div>
                        ${!isUnlocked ? `
                            <div class="achievement-progress-bar">
                                <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="achievement-progress-text">${progress} / ${achievement.target}</div>
                        ` : ''}
                    </div>
                    <div class="achievement-footer">
                        <div>
                            <span class="achievement-points-text">🏆 ${achievement.achievementPoints} 成就点</span>
                            ${rewardsHtml ? `<span class="achievement-rewards"> | ${rewardsHtml}</span>` : ''}
                        </div>
                        ${actionHtml}
                    </div>
                `;
                
                list.appendChild(achievementItem);
            });
            
            list.querySelectorAll('.achievement-claim-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const achievementId = btn.dataset.achievementId;
                    const achievementItem = btn.closest('.achievement-item');
                    
                    btn.disabled = true;
                    btn.textContent = '领取中...';
                    btn.classList.add('claiming');
                    
                    const result = this.game.achievementSystem.claimAchievementReward(achievementId);
                    
                    if (result.success) {
                        achievementItem.classList.remove('claimable');
                        achievementItem.classList.add('claimed');
                        
                        const nameEl = achievementItem.querySelector('.achievement-name');
                        if (nameEl) {
                            const badge = nameEl.querySelector('.new-badge');
                            if (badge) badge.remove();
                        }
                        
                        btn.outerHTML = '<div class="achievement-claimed-text">✓ 已领取</div>';
                        
                        this.showAchievementClaimToast(result);
                        
                        this.updateAchievementHeader();
                        
                        setTimeout(() => {
                            this.renderAchievementsTab(filter);
                        }, 1000);
                    } else {
                        btn.disabled = false;
                        btn.textContent = '领取奖励';
                        btn.classList.remove('claiming');
                    }
                });
            });
            
            document.querySelectorAll('.achievement-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === filter);
            });
        }

        renderStatisticsTab(list) {
            const stats = this.game.saveManager.getStatistics();
            const achievements = this.game.achievementSystem.getAchievementsWithProgress();
            const unlockedCount = achievements.filter(a => this.game.saveManager.isAchievementUnlocked(a.id)).length;
            const totalPoints = this.game.saveManager.getAchievementPoints();
            
            const formatNumber = (num) => {
                if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                return num || 0;
            };
            
            const formatTime = (seconds) => {
                if (!seconds) return '0 分钟';
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                if (hours > 0) {
                    return `${hours} 小时 ${minutes % 60} 分钟`;
                }
                return `${minutes} 分钟`;
            };
            
            list.innerHTML = `
                <div class="stats-header">
                    <div class="stats-title">📊 游戏统计</div>
                    <div class="stats-summary">
                        <div class="summary-item">
                            <div class="summary-value">${totalPoints}</div>
                            <div class="summary-label">总成就点</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${unlockedCount}/${achievements.length}</div>
                            <div class="summary-label">成就解锁</div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">🎮 战斗统计</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">⚔️</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalKills)}</div>
                                <div class="stat-label">总击杀数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🏆</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalCleared)}</div>
                                <div class="stat-label">通关次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💥</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalDamageDealt)}</div>
                                <div class="stat-label">总输出伤害</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🔥</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.highestSingleDamage)}</div>
                                <div class="stat-label">最高单次伤害</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🛡️</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalDamageTaken)}</div>
                                <div class="stat-label">总承受伤害</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👑</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalBossKills)}</div>
                                <div class="stat-label">Boss 击杀</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">🎯 活动统计</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">✨</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalSkillsUsed)}</div>
                                <div class="stat-label">技能使用次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📦</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalChestsOpened)}</div>
                                <div class="stat-label">宝箱开启</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💎</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalPowerupsCollected)}</div>
                                <div class="stat-label">道具收集</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalGoldEarned)}</div>
                                <div class="stat-label">总获得金币</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⭐</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.perfectLevels)}</div>
                                <div class="stat-label">完美通关</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">📈 游戏统计</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🎮</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalPlayCount)}</div>
                                <div class="stat-label">游戏次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatTime(stats.totalGameTime)}</div>
                                <div class="stat-label">游戏时长</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💀</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalDeaths)}</div>
                                <div class="stat-label">死亡次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🔄</div>
                            <div class="stat-info">
                                <div class="stat-value">${formatNumber(stats.totalRevivesUsed)}</div>
                                <div class="stat-label">复活次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🚀</div>
                            <div class="stat-info">
                                <div class="stat-value">第 ${this.game.saveData.maxUnlockedLevel || 1} 关</div>
                                <div class="stat-label">最高到达关卡</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.querySelectorAll('.achievement-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === 'stats');
            });
        }

        renderAchievementShop(list) {
            const shopItems = this.game.achievementSystem.getShopItems();
            const totalPoints = this.game.saveManager.getAchievementPoints();
            
            const totalAchievementPointsEl = document.getElementById('totalAchievementPoints');
            const unlockedAchievementsEl = document.getElementById('unlockedAchievements');
            const totalAchievementsEl = document.getElementById('totalAchievements');
            
            if (totalAchievementPointsEl) {
                totalAchievementPointsEl.textContent = totalPoints;
            }
            if (unlockedAchievementsEl) {
                unlockedAchievementsEl.textContent = '-';
            }
            if (totalAchievementsEl) {
                totalAchievementsEl.textContent = '-';
            }
            
            const shopGrid = document.createElement('div');
            shopGrid.id = 'achievementShopGrid';
            shopGrid.className = 'achievement-shop-grid';
            
            shopItems.forEach(item => {
                const exchangeCount = this.game.saveManager.getAchievementShopExchangeCount(item.id);
                const canExchange = totalPoints >= item.price && exchangeCount < item.limit;
                const isSoldOut = exchangeCount >= item.limit;
                
                const shopItem = document.createElement('div');
                shopItem.className = `achievement-shop-item ${canExchange ? 'can-exchange' : ''} ${isSoldOut ? 'sold-out' : ''}`;
                shopItem.innerHTML = `
                    <div class="shop-item-icon">${item.icon}</div>
                    <div class="shop-item-info">
                        <div class="shop-item-name">${item.name}</div>
                        <div class="shop-item-desc">${item.description}</div>
                        <div class="shop-item-stock">剩余: ${item.limit - exchangeCount}/${item.limit}</div>
                    </div>
                    <div class="shop-item-price">
                        <span class="price-icon">🏆</span>
                        <span class="price-value">${item.price}</span>
                    </div>
                    <button class="shop-exchange-btn" data-item-id="${item.id}" ${!canExchange ? 'disabled' : ''}>
                        ${isSoldOut ? '已售罄' : '兑换'}
                    </button>
                `;
                
                shopGrid.appendChild(shopItem);
            });
            
            list.appendChild(shopGrid);
            
            shopGrid.querySelectorAll('.shop-exchange-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const itemId = btn.dataset.itemId;
                    this.exchangeShopItem(itemId);
                });
            });
            
            document.querySelectorAll('.achievement-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === 'shop');
            });
        }

        exchangeShopItem(itemId) {
            const result = this.game.achievementSystem.exchangeShopItem(itemId);
            if (result.success) {
                this.game.showToast(`兑换成功！${result.effectText}`);
                this.renderAchievementsTab('shop');
            } else {
                this.game.showToast(result.message);
            }
        }

        showAchievementClaimToast(result) {
            if (!result) return;
            
            let rewardText = '';
            if (result.rewards?.gold > 0) {
                rewardText += `💰${result.rewards.gold}`;
            }
            if (result.rewards?.diamonds > 0) {
                if (rewardText) rewardText += ' ';
                rewardText += `💎${result.rewards.diamonds}`;
            }
            
            this.game.showToast(`🎉 成就「${result.name}」奖励领取成功！${rewardText}`);
        }

        updateAchievementHeader() {
            const totalPoints = this.game.saveManager.getAchievementPoints();
            const achievements = this.game.achievementSystem.getAchievementsWithProgress();
            const unlockedCount = achievements.filter(a => this.game.saveManager.isAchievementUnlocked(a.id)).length;
            
            const totalAchievementPointsEl = document.getElementById('totalAchievementPoints');
            const unlockedAchievementsEl = document.getElementById('unlockedAchievements');
            const totalAchievementsEl = document.getElementById('totalAchievements');
            
            if (totalAchievementPointsEl) {
                totalAchievementPointsEl.textContent = totalPoints;
            }
            if (unlockedAchievementsEl) {
                unlockedAchievementsEl.textContent = unlockedCount;
            }
            if (totalAchievementsEl) {
                totalAchievementsEl.textContent = achievements.length;
            }
        }

        doGacha(count) {
            const cost = count === 1 ? 50 : 450;
            
            if (this.game.saveData.gold < cost) {
                this.game.showToast('金币不足！');
                return;
            }
            
            this.game.saveData.gold -= cost;
            
            const results = [];
            for (let i = 0; i < count; i++) {
                const item = GameData.getRandomGachaItem();
                results.push(item);
                
                if (item.type === 'gold') {
                    this.game.saveData.gold += item.amount;
                } else if (item.type === 'health_boost') {
                    this.game.saveData.permanentUpgrades.maxHealth = 
                        (this.game.saveData.permanentUpgrades.maxHealth || 0) + 1;
                } else if (item.type === 'damage_boost') {
                    this.game.saveData.permanentUpgrades.bulletDamage = 
                        (this.game.saveData.permanentUpgrades.bulletDamage || 0) + 1;
                } else if (item.type === 'speed_boost') {
                    this.game.saveData.permanentUpgrades.moveSpeed = 
                        (this.game.saveData.permanentUpgrades.moveSpeed || 0) + 1;
                } else if (item.type === 'level_unlock') {
                    this.game.saveData.maxUnlockedLevel += 1;
                }
            }
            
            this.game.saveGameData();
            this.updateMainMenuUI();
            
            this.showGachaResult(results);
        }

        showGachaResult(results) {
            const resultEl = document.getElementById('gachaResult');
            const resultGrid = document.getElementById('gachaResultGrid');
            
            resultGrid.innerHTML = '';
            
            results.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = `gacha-item gacha-${item.rarity}`;
                itemEl.innerHTML = `
                    <div class="gacha-icon">${item.icon}</div>
                    <div class="gacha-name">${item.name}</div>
                    <div class="gacha-desc">${item.desc}</div>
                `;
                resultGrid.appendChild(itemEl);
            });
            
            resultEl.classList.add('show');
        }

        destroy() {
            this.stopTasksRefreshTimer();
            this.isInitialized = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.MainMenuSystem = MainMenuSystem;
    }

})();