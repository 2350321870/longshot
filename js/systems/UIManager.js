(function() {
    'use strict';

    class UIManager extends BaseSystem {
        constructor() {
            super();
            this.uiElements = [];
            this.paused = false;
            this.currentScreen = 'main_menu';
            this.selectedTab = 'hero';
            this.screenShake = { x: 0, y: 0 };
        }

        setGame(game) {
            super.setGame(game);
        }

        render(ctx, canvas) {
            if (this.paused) {
                return;
            }

            this.renderHUD(ctx);
            this.renderSkillButtons(ctx);
        }

        renderHUD(ctx) {
            this.renderTopBar(ctx);
            this.renderBossHealthBar(ctx);
            this.renderWaveInfo(ctx);
        }

        renderTopBar(ctx) {
            const player = this.game.player;
            if (!player) return;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(20, 20, 280, 70);

            const healthPercent = player.health / player.maxHealth;
            ctx.fillStyle = 'rgba(80, 20, 20, 0.8)';
            ctx.fillRect(30, 30, 240, 20);
            ctx.fillStyle = healthPercent > 0.3 ? '#44ff44' : '#ff4444';
            ctx.fillRect(30, 30, 240 * healthPercent, 20);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, 240, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`生命: ${Math.ceil(player.health)}/${player.maxHealth}`, 35, 45);

            if (this.game.shield > 0) {
                const shieldPercent = this.game.shield / this.game.maxShield;
                ctx.fillStyle = 'rgba(20, 60, 100, 0.8)';
                ctx.fillRect(30, 55, 240, 10);
                ctx.fillStyle = '#66ccff';
                ctx.fillRect(30, 55, 240 * shieldPercent, 10);
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(30, 55, 240, 10);
                ctx.fillStyle = '#88ccff';
                ctx.font = '10px Arial';
                ctx.fillText(`护盾: ${Math.ceil(this.game.shield)}/${this.game.maxShield}`, 35, 63);
            }

            const skillCount = Object.keys(this.game.unlockedSkills || {}).length;
            ctx.fillStyle = 'rgba(100, 50, 150, 0.8)';
            ctx.fillRect(30, 75, 240, 8);
            ctx.fillStyle = '#aa66ff';
            ctx.fillRect(30, 75, 240 * (skillCount / 100), 8);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.game.canvas.width - 200, 20, 180, 60);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`💰 ${Math.floor(this.game.gold || 0)}`, this.game.canvas.width - 30, 45);

            ctx.fillStyle = '#ff6600';
            ctx.fillText(`⚔️ 第${this.game.currentWave || 1}波`, this.game.canvas.width - 30, 68);

            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`波次进度: ${this.game.currentWave || 1}/${this.game.totalWaves || 10}`, this.game.canvas.width / 2, 35);
        }

        renderBossHealthBar(ctx) {
            const enemies = this.game.enemies || [];
            const boss = enemies.find(e => e.isBoss && !e.isDestroyed);
            
            if (boss) {
                const barWidth = 400;
                const barHeight = 30;
                const barX = (this.game.canvas.width - barWidth) / 2;
                const barY = 80;

                ctx.fillStyle = 'rgba(50, 10, 10, 0.9)';
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 30);

                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(barX - 10, barY - 10, barWidth + 20, barHeight + 30);

                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`👑 BOSS`, this.game.canvas.width / 2, barY);

                ctx.fillStyle = 'rgba(80, 0, 0, 0.8)';
                ctx.fillRect(barX, barY + 5, barWidth, barHeight);

                const healthPercent = boss.health / boss.maxHealth;
                const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#ff4400');
                gradient.addColorStop(1, '#ff0000');
                ctx.fillStyle = gradient;
                ctx.fillRect(barX, barY + 5, barWidth * healthPercent, barHeight);

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY + 5, barWidth, barHeight);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.ceil(boss.health)} / ${boss.maxHealth}`, this.game.canvas.width / 2, barY + 25);
            }
        }

        renderWaveInfo(ctx) {
            const canvas = this.game.canvas;
            ctx.save();
            ctx.translate(canvas.width - 200, 100);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(-10, -10, 190, 120);
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-10, -10, 190, 120);

            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('波次信息', 0, 5);

            ctx.fillStyle = '#888';
            ctx.font = '11px Arial';
            ctx.fillText(`剩余敌人: ${this.game.remainingEnemies || 0}`, 0, 25);
            ctx.fillText(`已击杀: ${this.game.totalKills || 0}`, 0, 42);
            ctx.fillText(`击杀奖励: +${Math.floor(this.game.goldPerKill || 0)} 💰`, 0, 59);

            if (this.game.combo) {
                ctx.fillStyle = this.game.combo >= 10 ? '#ff4444' : '#ffaa00';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`🔥 连击 x${this.game.combo}`, 0, 82);
                ctx.fillStyle = '#888';
                ctx.font = '11px Arial';
                ctx.fillText(`连击加成: +${Math.floor((this.game.comboMultiplier || 1) - 1) * 100}%`, 0, 98);
            }

            ctx.restore();
        }

        renderSkillButtons(ctx) {
            if (this.game.gameState !== 'playing') return;

            const buttons = this.game.getSkillCooldowns ? this.game.getSkillCooldowns() : [];
            const startX = 20;
            const startY = this.game.canvas.height - 80;
            const spacing = 70;

            for (let i = 0; i < buttons.length; i++) {
                const btn = buttons[i];
                const x = startX + i * spacing;
                const y = startY;
                const size = 60;

                ctx.fillStyle = btn.onCooldown ? 'rgba(50, 50, 50, 0.8)' : 'rgba(80, 80, 100, 0.8)';
                ctx.fillRect(x, y, size, size);

                ctx.strokeStyle = btn.onCooldown ? 'rgba(100, 100, 100, 0.5)' : 'rgba(150, 150, 200, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, size, size);

                if (btn.onCooldown) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    const cooldownPercent = btn.remaining / btn.cooldown;
                    ctx.fillRect(x, y + size * (1 - cooldownPercent), size, size * cooldownPercent);
                }

                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = btn.onCooldown ? '#888' : '#fff';
                ctx.fillText(btn.icon, x + size / 2, y + size / 2 - 8);

                ctx.font = '10px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText(`[${i + 1}]`, x + size / 2, y + size / 2 + 20);

                if (btn.onCooldown) {
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#ff8888';
                    ctx.fillText(`${Math.ceil(btn.remaining)}s`, x + size / 2, y + size / 2 - 8);
                }
            }
        }

        renderPauseOverlay(ctx, canvas) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2 - 80);

            ctx.font = '20px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('点击继续游戏', canvas.width / 2, canvas.height / 2);
            ctx.fillText('按 ESC 退出到主菜单', canvas.width / 2, canvas.height / 2 + 40);
        }

        renderWaveAnnouncement(ctx, canvas) {
            if (!this.game.waveAnnouncement) return;

            const wave = this.game.waveAnnouncement.wave;
            const elapsed = this.game.waveAnnouncement.elapsed;
            const duration = this.game.waveAnnouncement.duration;

            if (elapsed >= duration) {
                this.game.waveAnnouncement = null;
                return;
            }

            const progress = elapsed / duration;
            const fadeIn = Math.min(1, progress * 5);
            const fadeOut = Math.max(0, 1 - (progress - 0.7) / 0.3);
            const alpha = fadeIn * fadeOut;

            ctx.save();
            ctx.globalAlpha = alpha;

            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, 300
            );
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ff6600';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText(`第 ${wave} 波`, canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText(`第 ${wave} 波`, canvas.width / 2, canvas.height / 2 - 50);

            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            
            const waveTypes = this.game.waveTypes || [];
            const waveType = waveTypes[wave - 1];
            let waveText = '准备战斗!';
            
            if (waveType) {
                if (waveType.isBossWave) {
                    waveText = '⚠️ BOSS 来袭! ⚠️';
                } else if (waveType.type === 'speed') {
                    waveText = '🔥 加速挑战! 🔥';
                } else if (waveType.type === 'swarm') {
                    waveText = '🐜 虫群来袭! 🐜';
                }
            }
            
            ctx.strokeText(waveText, canvas.width / 2, canvas.height / 2 + 30);
            ctx.fillText(waveText, canvas.width / 2, canvas.height / 2 + 30);

            ctx.restore();
        }

        showWaveAnnouncement(wave, duration = 2) {
            this.game.waveAnnouncement = {
                wave: wave,
                duration: duration,
                elapsed: 0
            };
        }

        setPaused(paused) {
            this.paused = paused;
        }

        setCurrentScreen(screen) {
            this.currentScreen = screen;
        }

        getCurrentScreen() {
            return this.currentScreen;
        }

        handleClick(x, y) {
            return this.handleScreenClick(x, y);
        }

        handleScreenClick(x, y) {
            return false;
        }

        handleKeyDown(key) {
        }

        clear() {
            this.uiElements = [];
            this.paused = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.UIManager = UIManager;
    }

})();
