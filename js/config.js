/**
 * 游戏配置文件
 * 包含龙、关卡、敌人、掉落等核心配置
 */
const GameConfig = {
    
    // ==========================================
    // 龙敌人配置
    // ==========================================
    dragon: {
        baseSegments: 300,                   // 第1关龙的基础节数
        segmentsPerLevel: 5,                 // 每关增加的节数
        maxSegments: 800,                     // 龙的最大节数限制
        segmentSpacing: 46,                  // 每节之间的间距（像素）
        
        baseHealthPerSegment: 150,            // 每节基础血量
        healthPerLevel: 50,                   // 每关增加的每节血量
        healthDistributionFrontMultiplier: 0.5,   // 头部血量倍数（0.5 = 50%基础血量）
        healthDistributionBackMultiplier: 3.0,    // 尾部血量倍数（3.0 = 300%基础血量）
        
        segmentsPerSkillSelectionEarly: 4,   // 早期：每多少段可获得一次技能选择
        segmentsPerSkillSelectionMid: 6,     // 中期：每多少段可获得一次技能选择
        segmentsPerSkillSelectionLate: 8,    // 后期：每多少段可获得一次技能选择
        
        moveSpeed: 1                          // 龙的基础移动速度倍数
    },
    
    // ==========================================
    // 关卡配置
    // ==========================================
    level: {
        channelCount: 10,                    // 垂直通道数量
        channelHeight: 50,                   // 每条通道的高度
        leftPadding: 80,                     // 左侧内边距
        rightPadding: 80,                    // 右侧内边距
        topPadding: 20,                      // 顶部内边距
        turnRadius: 20,                      // 龙转弯的半径
        reviveCount: 3                       // 每局游戏可复活次数
    },
    
    // ==========================================
    // 敌人配置
    // ==========================================
    enemy: {
        // 敌人移动速度档位
        speeds: {
            normal: 0.8,                     // 普通速度
            medium: 1.0,                     // 中等速度
            fast: 1.2                        // 快速
        },
        
        // 敌人伤害档位
        damages: {
            normal: 5,                        // 普通伤害
            medium: 8,                        // 中等伤害
            high: 12                          // 高伤害
        }
    },
    
    // ==========================================
    // 掉落配置
    // ==========================================
    drop: {
        chestDropChance: 0.6,               // 宝箱掉落概率
        dropChance: 0.3,                     // 道具掉落概率
        powerupChanceMultiplier: 0.5         // 强化道具概率倍数
    }
};

// 将配置暴露到全局作用域
if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
}
