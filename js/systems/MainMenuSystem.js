(function() {
    'use strict';

    class MainMenuSystem {
        constructor(game) {
            this.game = game;
            this.currentTab = 'battle';
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            this.setupEventListeners();
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
        }

        renderMainMenu() {
            this.game.gameState = 'mainMenu';
            
            document.getElementById('mainScreen').classList.remove('hidden');
            document.getElementById('bottomNav').classList.remove('hidden');
            document.getElementById('topBar').classList.remove('hidden');
            
            document.getElementById('battleInfo').classList.add('hidden');
            document.getElementById('battleUI').classList.add('hidden');
            document.getElementById('pauseBtn').classList.add('hidden');
            document.getElementById('fenceBar').classList.add('hidden');
            
            document.getElementById('levelUpScreen').classList.remove('show');
            document.getElementById('gameOverScreen').classList.remove('show');
            document.getElementById('skillSelection').classList.remove('show');
            document.getElementById('pauseMenu').classList.remove('show');
            document.getElementById('levelCompleteScreen').classList.remove('show');
            document.getElementById('reviveScreen').classList.remove('show');
            
            this.switchTab('battle');
            this.updateMainMenuUI();
        }

        updateMainMenuUI() {
            const saveData = this.game.saveData;
            if (!saveData) return;

            document.getElementById('energyDisplay').textContent = `${saveData.energy || 10}/${saveData.maxEnergy || 10}`;
            document.getElementById('mainGoldDisplay').textContent = saveData.gold || 0;
            
            const chapter = Math.ceil((saveData.maxUnlockedLevel || 1) / 9);
            document.getElementById('chapterTitle').textContent = `${chapter}. 屠龙第${chapter}章`;
            
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
            
            const saveData = this.game.saveData;
            const maxUnlocked = saveData.maxUnlockedLevel || 1;
            const maxLevel = 9;
            
            for (let i = 1; i <= maxLevel; i++) {
                const btn = document.createElement('div');
                const isLocked = i > maxUnlocked;
                const isCompleted = i < maxUnlocked;
                const isCurrent = i === maxUnlocked;
                
                let classes = 'level-btn';
                if (isLocked) classes += ' locked';
                if (isCurrent) classes += ' current';
                if (isCompleted) classes += ' completed';
                
                btn.className = classes;
                
                const levelNames = ['初入龙门', '蛟龙初现', '龙鳞初显', 
                                   '龙腾四海', '龙啸九天', '龙魂觉醒',
                                   '龙战于野', '飞龙在天', '亢龙有悔'];
                
                btn.innerHTML = `
                    <div class="level-number">${isLocked ? '🔒' : i}</div>
                    <div class="level-name">${levelNames[i - 1] || '关卡' + i}</div>
                `;
                
                if (!isLocked) {
                    btn.addEventListener('click', () => {
                        this.game.startLevel(i);
                    });
                }
                
                grid.appendChild(btn);
            }
        }

        renderLevelRewards() {
            const container = document.getElementById('levelRewardsList');
            if (!container) return;
            
            const rewards = this.game.levelRewards || [];
            const maxUnlocked = this.game.saveData.maxUnlockedLevel || 1;
            
            container.innerHTML = '';
            
            rewards.forEach(reward => {
                const isCompleted = reward.level < maxUnlocked;
                const isClaimable = reward.level === maxUnlocked - 1 && !reward.claimed;
                const isClaimed = reward.claimed;
                
                const card = document.createElement('div');
                let classes = 'reward-card';
                if (isClaimable) classes += ' claimable';
                if (isClaimed) classes += ' claimed';
                
                card.className = classes;
                
                let actionHtml = '';
                if (isClaimed) {
                    actionHtml = '<div class="reward-claimed-text">✓ 已领取</div>';
                } else if (isClaimable) {
                    actionHtml = `<button class="reward-claim-btn" data-level="${reward.level}">领取</button>`;
                } else {
                    actionHtml = `<div class="task-progress-text">关卡 ${reward.level}</div>`;
                }
                
                card.innerHTML = `
                    <div class="reward-info">
                        <div class="reward-icon">${reward.icon}</div>
                        <div class="reward-details">
                            <div class="reward-name">${reward.name}</div>
                            <div class="reward-requirement">通过第 ${reward.level} 关</div>
                        </div>
                    </div>
                    ${actionHtml}
                `;
                
                container.appendChild(card);
            });
            
            container.querySelectorAll('.reward-claim-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const level = parseInt(btn.dataset.level);
                    this.claimLevelReward(level);
                });
            });
        }

        claimLevelReward(level) {
            const rewards = this.game.levelRewards || [];
            const reward = rewards.find(r => r.level === level);
            
            if (!reward || reward.claimed) return;
            
            reward.claimed = true;
            
            if (reward.rewards) {
                if (reward.rewards.gold) {
                    this.game.saveData.gold += reward.rewards.gold;
                }
                if (reward.rewards.diamonds) {
                    this.game.saveData.diamonds += reward.rewards.diamonds;
                }
            }
            
            this.game.saveGameData();
            this.renderLevelRewards();
            this.showToast(`领取成功！`);
        }

        renderCharacterTab() {
            const grid = document.getElementById('characterGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const characterConfig = this.game.characterConfig || {};
            const saveData = this.game.saveData;
            
            const unlockedCharacters = saveData.unlockedCharacters || ['default'];
            const selectedCharacter = saveData.selectedCharacter || 'default';
            
            Object.keys(characterConfig).forEach(id => {
                const config = characterConfig[id];
                const isUnlocked = unlockedCharacters.includes(id);
                const isSelected = selectedCharacter === id;
                const isLocked = !isUnlocked;
                
                const card = document.createElement('div');
                let classes = 'character-card';
                if (isSelected) classes += ' selected';
                if (isLocked) classes += ' locked';
                
                card.className = classes;
                
                let buttonHtml = '';
                if (isLocked) {
                    buttonHtml = `<div class="character-price">🔒 ${config.price} 金币</div>
                        <button class="character-unlock-btn" data-char-id="${id}">解锁</button>`;
                } else if (!isSelected) {
                    buttonHtml = `<button class="character-unlock-btn" data-char-id="${id}">选择</button>`;
                } else {
                    buttonHtml = `<div class="character-price">✓ 已选择</div>`;
                }
                
                const statsHtml = Object.entries(config.stats || {}).map(([key, value]) => {
                    const isPositive = value > 0;
                    const label = this.getStatLabel(key);
                    return `<div class="character-stat ${isPositive ? 'positive' : 'negative'}">${label}: ${value > 0 ? '+' : ''}${value}</div>`;
                }).join('');
                
                card.innerHTML = `
                    <div class="character-icon">${config.icon}</div>
                    <div class="character-name">${config.name}</div>
                    <div class="character-desc">${config.description}</div>
                    <div class="character-stats">${statsHtml}</div>
                    ${buttonHtml}
                `;
                
                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('character-unlock-btn')) {
                        const charId = e.target.dataset.charId;
                        if (isLocked) {
                            this.unlockCharacter(charId);
                        } else {
                            this.selectCharacter(charId);
                        }
                    }
                });
                
                grid.appendChild(card);
            });
        }

        getStatLabel(key) {
            const labels = {
                maxHealth: '生命',
                bulletDamage: '伤害',
                moveSpeed: '速度',
                critChance: '暴击',
                critDamage: '暴伤',
                damageReduction: '减伤'
            };
            return labels[key] || key;
        }

        unlockCharacter(id) {
            const config = this.game.characterConfig[id];
            if (!config) return;
            
            if (this.game.saveData.gold < config.price) {
                this.showToast('金币不足！');
                return;
            }
            
            this.game.saveData.gold -= config.price;
            this.game.saveData.unlockedCharacters = this.game.saveData.unlockedCharacters || [];
            this.game.saveData.unlockedCharacters.push(id);
            
            this.game.saveGameData();
            this.updateMainMenuUI();
            this.renderCharacterTab();
            this.showToast(`${config.name} 解锁成功！`);
        }

        selectCharacter(id) {
            if (!this.game.saveData.unlockedCharacters.includes(id)) {
                return;
            }
            
            this.game.saveData.selectedCharacter = id;
            this.game.saveGameData();
            this.renderCharacterTab();
            this.showToast(`已选择 ${this.game.characterConfig[id].name}！`);
        }

        renderShopTab() {
            const grid = document.getElementById('shopGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const shopItems = this.game.shopItems || [];
            
            shopItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'shop-item';
                
                const canAfford = this.game.saveData.gold >= item.price;
                
                card.innerHTML = `
                    <div class="shop-icon">${item.icon}</div>
                    <div class="shop-name">${item.name}</div>
                    <div class="shop-desc">${item.description}</div>
                    <div class="shop-price">
                        <span class="shop-price-icon">💰</span>
                        <span class="shop-price-value">${item.price}</span>
                    </div>
                    <button class="shop-buy-btn" data-index="${index}" ${!canAfford ? 'disabled' : ''}>购买</button>
                `;
                
                card.querySelector('.shop-buy-btn').addEventListener('click', () => {
                    this.buyShopItem(index);
                });
                
                grid.appendChild(card);
            });
        }

        buyShopItem(index) {
            const shopItems = this.game.shopItems || [];
            const item = shopItems[index];
            
            if (!item) return;
            
            if (this.game.saveData.gold < item.price) {
                this.showToast('金币不足！');
                return;
            }
            
            this.game.saveData.gold -= item.price;
            
            if (item.effect) {
                item.effect(this.game.saveData);
            }
            
            this.game.saveGameData();
            this.renderShopTab();
            this.updateMainMenuUI();
            this.showToast(`购买成功！`);
        }

        renderEquipmentTab() {
            const equippedGrid = document.getElementById('equippedGrid');
            const unlockedGrid = document.getElementById('unlockedEquipments');
            
            if (!equippedGrid || !unlockedGrid) return;
            
            const saveData = this.game.saveData;
            const equipmentConfig = this.game.equipmentConfig || {};
            
            const equipped = saveData.equippedEquipment || [];
            const unlocked = saveData.unlockedEquipment || [];
            
            for (let i = 0; i < 4; i++) {
                const slot = document.createElement('div');
                const equipId = equipped[i];
                const equip = equipId ? equipmentConfig[equipId] : null;
                
                let classes = 'equip-slot';
                if (!equip) classes += ' equip-slot-empty';
                if (equip && equip.rarity) classes += ` rarity-${equip.rarity}`;
                
                slot.className = classes;
                
                if (equip) {
                    slot.innerHTML = `
                        <div class="equip-icon">${equip.icon}</div>
                        <div class="equip-name">${equip.name}</div>
                        <div class="equip-level">Lv.${equip.level || 1}</div>
                    `;
                } else {
                    slot.innerHTML = `
                        <div class="equip-icon">📦</div>
                        <div class="equip-name">空</div>
                    `;
                }
                
                equippedGrid.appendChild(slot);
            }
            
            unlockedGrid.innerHTML = '';
            
            unlocked.forEach(id => {
                const equip = equipmentConfig[id];
                if (!equip) return;
                
                const card = document.createElement('div');
                card.className = `equip-card owned`;
                
                card.innerHTML = `
                    <div class="equip-card-icon">${equip.icon}</div>
                    <div class="equip-card-name">${equip.name}</div>
                    <div class="equip-card-level">Lv.${equip.level || 1}</div>
                    <div class="equip-card-desc">${equip.description}</div>
                `;
                
                unlockedGrid.appendChild(card);
            });
        }

        renderTasksTab() {
            const list = document.getElementById('tasksList');
            if (!list) return;
            
            list.innerHTML = '';
            
            this.checkDailyTasksRefresh();
            this.syncSpecificLevelTaskProgress();
            
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
                if (task.rewards) {
                    if (task.rewards.gold > 0) {
                        rewardsHtml += `💰${task.rewards.gold}`;
                    }
                    if (task.rewards.diamonds > 0) {
                        if (rewardsHtml) rewardsHtml += ' ';
                        rewardsHtml += `💎${task.rewards.diamonds}`;
                    }
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

        checkDailyTasksRefresh() {
            const saveData = this.game.saveData;
            if (!saveData.dailyTasks) {
                this.generateDailyTasks();
                return;
            }
            
            const lastDate = saveData.dailyTasks.lastDate;
            const today = new Date().toDateString();
            
            if (lastDate !== today) {
                this.generateDailyTasks();
            }
        }

        generateDailyTasks() {
            const tasks = this.game.battleSkills || [];
            const dailyTasks = [];
            
            const taskTemplates = [
                { id: 'kill_10', name: '击杀敌人', description: '击杀10个敌人', target: 10, rewards: { gold: 50 } },
                { id: 'kill_20', name: '大量击杀', description: '击杀20个敌人', target: 20, rewards: { gold: 100 } },
                { id: 'play_level', name: '挑战关卡', description: '挑战1个关卡', target: 1, rewards: { gold: 30 } },
                { id: 'reach_level_10', name: '挑战第10关', description: '挑战第10关', target: 1, rewards: { gold: 200 }, type: 'level_check' }
            ];
            
            const selected = taskTemplates.slice(0, 3).map(t => ({
                ...t,
                progress: 0,
                claimed: false
            }));
            
            this.game.saveData.dailyTasks = {
                lastDate: new Date().toDateString(),
                tasks: selected
            };
        }

        syncSpecificLevelTaskProgress() {
            const saveData = this.game.saveData;
            if (!saveData.dailyTasks || !saveData.dailyTasks.tasks) return;
            
            saveData.dailyTasks.tasks.forEach(task => {
                if (task.type === 'level_check') {
                    if (task.id === 'reach_level_10') {
                        if (saveData.highestLevelPassed && saveData.highestLevelPassed >= 10) {
                            task.progress = 1;
                        }
                    }
                }
            });
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
            const saveData = this.game.saveData;
            if (!saveData.dailyTasks || !saveData.dailyTasks.tasks) {
                this.showToast('任务数据错误！');
                return;
            }
            
            const task = saveData.dailyTasks.tasks.find(t => t.id === taskId);
            if (!task) {
                this.showToast('任务不存在！');
                return;
            }
            
            if (task.progress < task.target) {
                this.showToast('任务未完成！');
                return;
            }
            
            if (task.claimed) {
                this.showToast('奖励已领取！');
                return;
            }
            
            task.claimed = true;
            
            if (task.rewards) {
                if (task.rewards.gold) {
                    saveData.gold += task.rewards.gold;
                }
                if (task.rewards.diamonds) {
                    saveData.diamonds = (saveData.diamonds || 0) + task.rewards.diamonds;
                }
            }
            
            this.game.saveGameData();
            this.renderTasksTab();
            this.showToast(`领取成功！${task.rewards.gold ? `💰${task.rewards.gold}` : ''} ${task.rewards.diamonds ? `💎${task.rewards.diamonds}` : ''}`);
        }

        renderAchievementsTab(filter = 'all') {
            const list = document.getElementById('achievementsList');
            if (!list) return;
            
            list.innerHTML = '';
            
            if (filter === 'stats') {
                this.renderStatisticsTab(list);
                return;
            }
            
            const achievements = this.getAchievementsWithProgress();
            
            let filteredAchievements = achievements;
            if (filter === 'unlocked') {
                filteredAchievements = achievements.filter(a => a.unlocked);
            } else if (filter === 'locked') {
                filteredAchievements = achievements.filter(a => !a.unlocked);
            }
            
            const totalPoints = this.game.saveData.achievementPoints || 0;
            const unlockedCount = achievements.filter(a => a.unlocked).length;
            
            const totalPointsEl = document.getElementById('totalAchievementPoints');
            const unlockedEl = document.getElementById('unlockedAchievements');
            const totalEl = document.getElementById('totalAchievements');
            
            if (totalPointsEl) totalPointsEl.textContent = totalPoints;
            if (unlockedEl) unlockedEl.textContent = unlockedCount;
            if (totalEl) totalEl.textContent = achievements.length;
            
            if (filteredAchievements.length === 0) {
                list.innerHTML = '<div style="color: #aaa; text-align: center; padding: 40px;">暂无成就</div>';
                return;
            }
            
            filteredAchievements.forEach(achievement => {
                const isClaimed = achievement.claimed;
                const progress = achievement.progress;
                const target = achievement.target;
                const progressPercent = Math.min(100, (progress / target) * 100);
                
                const achievementItem = document.createElement('div');
                achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                
                let rewardsHtml = '';
                if (achievement.rewards) {
                    if (achievement.rewards.gold) rewardsHtml += `💰${achievement.rewards.gold}`;
                    if (achievement.rewards.diamonds) rewardsHtml += ` 💎${achievement.rewards.diamonds}`;
                    if (achievement.rewards.points) rewardsHtml += ` ⭐${achievement.rewards.points}`;
                }
                
                let actionHtml = '';
                if (isClaimed) {
                    actionHtml = '<div class="task-claimed-text">✓ 已领取</div>';
                } else if (achievement.unlocked) {
                    actionHtml = `<button class="task-claim-btn" data-achievement-id="${achievement.id}">领取</button>`;
                } else {
                    actionHtml = `<div class="task-progress-text">${progress}/${target}</div>`;
                }
                
                achievementItem.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-content">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-footer">
                            <div class="achievement-points-text">${rewardsHtml}</div>
                            ${actionHtml}
                        </div>
                    </div>
                `;
                
                list.appendChild(achievementItem);
            });
            
            list.querySelectorAll('.task-claim-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const achievementId = btn.dataset.achievementId;
                    this.claimAchievementReward(achievementId);
                });
            });
        }

        getAchievementsWithProgress() {
            const saveData = this.game.saveData;
            const statistics = saveData.statistics || {};
            
            const achievementList = [
                { id: 'first_kill', name: '首次击杀', description: '击杀第一个敌人', icon: '⚔️', target: 1, rewards: { gold: 100, points: 10 } },
                { id: 'killer_100', name: '百人斩', description: '累计击杀100个敌人', icon: '💀', target: 100, rewards: { gold: 500, points: 50 } },
                { id: 'killer_1000', name: '千人斩', description: '累计击杀1000个敌人', icon: '👑', target: 1000, rewards: { gold: 2000, points: 200 } },
                { id: 'level_5', name: '初露锋芒', description: '通过第5关', icon: '🌟', target: 5, rewards: { gold: 300, points: 30 } },
                { id: 'level_10', name: '小有所成', description: '通过第10关', icon: '⭐', target: 10, rewards: { gold: 1000, points: 100 } },
                { id: 'rich_10000', name: '腰缠万贯', description: '累计获得10000金币', icon: '💰', target: 10000, rewards: { gold: 2000, points: 150 } }
            ];
            
            return achievementList.map(a => {
                let progress = 0;
                if (a.id.startsWith('killer_')) {
                    progress = statistics.totalKills || 0;
                } else if (a.id.startsWith('level_')) {
                    progress = saveData.highestLevelPassed || 0;
                } else if (a.id === 'rich_10000') {
                    progress = statistics.totalGoldEarned || 0;
                }
                
                const unlocked = progress >= a.target;
                const claimed = (saveData.claimedAchievements || []).includes(a.id);
                
                return {
                    ...a,
                    progress,
                    unlocked,
                    claimed
                };
            });
        }

        renderStatisticsTab(container) {
            const saveData = this.game.saveData;
            const statistics = saveData.statistics || {};
            
            const stats = [
                { label: '累计击杀', value: statistics.totalKills || 0, icon: '💀' },
                { label: '累计金币', value: statistics.totalGoldEarned || 0, icon: '💰' },
                { label: '游戏次数', value: statistics.gamesPlayed || 0, icon: '🎮' },
                { label: '复活次数', value: statistics.reviveCount || 0, icon: '❤️‍🔥' },
                { label: '最高关卡', value: saveData.highestLevelPassed || 0, icon: '🏆' },
                { label: '技能使用', value: statistics.skillsUsed || 0, icon: '⚡' }
            ];
            
            stats.forEach(stat => {
                const item = document.createElement('div');
                item.className = 'achievement-item';
                item.innerHTML = `
                    <div class="achievement-icon">${stat.icon}</div>
                    <div class="achievement-content">
                        <div class="achievement-name">${stat.label}</div>
                        <div class="achievement-footer">
                            <div class="achievement-points-text" style="font-size: 20px;">${stat.value}</div>
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        claimAchievementReward(achievementId) {
            const achievements = this.getAchievementsWithProgress();
            const achievement = achievements.find(a => a.id === achievementId);
            
            if (!achievement || !achievement.unlocked || achievement.claimed) {
                return;
            }
            
            const saveData = this.game.saveData;
            saveData.claimedAchievements = saveData.claimedAchievements || [];
            saveData.claimedAchievements.push(achievementId);
            
            if (achievement.rewards) {
                if (achievement.rewards.gold) {
                    saveData.gold += achievement.rewards.gold;
                }
                if (achievement.rewards.points) {
                    saveData.achievementPoints = (saveData.achievementPoints || 0) + achievement.rewards.points;
                }
            }
            
            this.game.saveGameData();
            this.renderAchievementsTab();
            this.showToast('成就奖励领取成功！');
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: #ffd700;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                z-index: 1000;
                animation: fadeInOut 1.5s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 1500);
        }

        doGacha(count) {
            const price = count === 1 ? 50 : 450;
            
            if (this.game.saveData.gold < price) {
                this.showToast('金币不足！');
                return;
            }
            
            this.game.saveData.gold -= price;
            
            const gachaPool = this.getGachaPool();
            let results = [];
            
            for (let i = 0; i < count; i++) {
                const item = this.getGachaResult(gachaPool);
                results.push(item);
                if (item.effect) {
                    item.effect(this.game.saveData);
                }
            }
            
            this.game.saveGameData();
            this.updateMainMenuUI();
            
            const lastResult = results[results.length - 1];
            const resultEl = document.getElementById('gachaResult');
            if (resultEl) {
                const iconEl = document.getElementById('gachaResultIcon');
                const nameEl = document.getElementById('gachaResultName');
                const descEl = document.getElementById('gachaResultDesc');
                
                if (iconEl) iconEl.textContent = lastResult.icon;
                if (nameEl) nameEl.textContent = lastResult.name;
                if (descEl) descEl.textContent = count === 1 ? lastResult.description : `共${count}抽，最后获得：${lastResult.description}`;
                
                resultEl.classList.add('show');
                
                setTimeout(() => {
                    resultEl.classList.remove('show');
                }, 2000);
            }
        }

        getGachaPool() {
            return [
                { name: '金币小包', description: '获得50金币', icon: '💰', weight: 40, effect: (data) => { data.gold += 50; } },
                { name: '金币中包', description: '获得100金币', icon: '💎', weight: 25, effect: (data) => { data.gold += 100; } },
                { name: '金币大包', description: '获得200金币', icon: '👑', weight: 15, effect: (data) => { data.gold += 200; } },
                { name: '能量恢复', description: '恢复满能量', icon: '⚡', weight: 10, effect: (data) => { data.energy = data.maxEnergy || 10; } },
                { name: '稀有装备', description: '获得稀有装备', icon: '🎁', weight: 5, effect: (data) => { 
                    data.unlockedEquipment = data.unlockedEquipment || [];
                    data.unlockedEquipment.push('rare_' + Date.now());
                }},
                { name: '史诗装备', description: '获得史诗装备', icon: '✨', weight: 3, effect: (data) => { 
                    data.unlockedEquipment = data.unlockedEquipment || [];
                    data.unlockedEquipment.push('epic_' + Date.now());
                }},
                { name: '传说装备', description: '获得传说装备', icon: '🌟', weight: 2, effect: (data) => { 
                    data.unlockedEquipment = data.unlockedEquipment || [];
                    data.unlockedEquipment.push('legendary_' + Date.now());
                }}
            ];
        }

        getGachaResult(pool) {
            const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const item of pool) {
                random -= item.weight;
                if (random <= 0) {
                    return item;
                }
            }
            
            return pool[0];
        }
    }

    window.MainMenuSystem = MainMenuSystem;

})();
