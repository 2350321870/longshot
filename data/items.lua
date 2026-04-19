-- 道具和宝箱掉落配置

powerups = {
    {
        id = "gold",
        name = "金币",
        description = "基础货币，可用于购买升级",
        icon = "💰",
        color = "#FFD700",
        rarity = "common",
        effect = function(game, powerup)
            game.gold = game.gold + 10
            game.score = game.score + 10
            game.updateUI()
        end
    },
    {
        id = "gold_medium",
        name = "中型金币",
        description = "价值25的金币",
        icon = "💰",
        color = "#FFA500",
        rarity = "uncommon",
        effect = function(game, powerup)
            game.gold = game.gold + 25
            game.score = game.score + 25
            game.updateUI()
        end
    },
    {
        id = "gold_large",
        name = "大型金币",
        description = "价值50的金币",
        icon = "💎",
        color = "#FFD700",
        rarity = "rare",
        effect = function(game, powerup)
            game.gold = game.gold + 50
            game.score = game.score + 50
            game.updateUI()
        end
    },
    {
        id = "health_pack",
        name = "生命包",
        description = "恢复20点生命值",
        icon = "💊",
        color = "#FF6B6B",
        rarity = "common",
        effect = function(game, powerup)
            game.playerStats.health = math.min(
                game.playerStats.health + 20,
                game.playerStats.maxHealth
            )
            game.updateUI()
        end
    },
    {
        id = "health_pack_large",
        name = "大型生命包",
        description = "恢复50点生命值",
        icon = "❤️",
        color = "#FF4444",
        rarity = "uncommon",
        effect = function(game, powerup)
            game.playerStats.health = math.min(
                game.playerStats.health + 50,
                game.playerStats.maxHealth
            )
            game.updateUI()
        end
    },
    {
        id = "damage_boost",
        name = "伤害提升",
        description = "10秒内伤害提升50%",
        icon = "⚔️",
        color = "#FF4444",
        rarity = "uncommon",
        duration = 10,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "damage_boost",
                multiplier = 1.5,
                startTime = game.currentTime,
                duration = 10
            })
        end
    },
    {
        id = "speed_boost",
        name = "速度提升",
        description = "8秒内移动速度提升30%",
        icon = "💨",
        color = "#00CED1",
        rarity = "uncommon",
        duration = 8,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "speed_boost",
                multiplier = 1.3,
                startTime = game.currentTime,
                duration = 8
            })
        end
    },
    {
        id = "fire_rate_boost",
        name = "攻速提升",
        description = "12秒内射击速度提升40%",
        icon = "🔥",
        color = "#FF6B35",
        rarity = "rare",
        duration = 12,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "fire_rate_boost",
                multiplier = 0.6,
                startTime = game.currentTime,
                duration = 12
            })
        end
    },
    {
        id = "invincible",
        name = "无敌护盾",
        description = "5秒内处于无敌状态",
        icon = "🛡️",
        color = "#4169E1",
        rarity = "rare",
        duration = 5,
        effect = function(game, powerup)
            game.player.invincible = 5
        end
    },
    {
        id = "magnet_temporary",
        name = "超级磁铁",
        description = "15秒内大幅增强道具吸引范围",
        icon = "🧲",
        color = "#8B008B",
        rarity = "uncommon",
        duration = 15,
        effect = function(game, powerup)
            table.insert(game.activeBuffs, {
                type = "magnet_boost",
                multiplier = 3,
                startTime = game.currentTime,
                duration = 15
            })
        end
    }
}

-- 宝箱掉落配置
chestDrops = {
    minItems = 1,
    maxItems = 3,
    baseGold = 20,
    bonusGoldChance = 0.5,
    bonusGoldAmount = 30,
    powerupChance = 0.7,
    skillUnlockChance = 0.1
}

-- 敌人掉落配置
enemyDrops = {
    baseDropChance = 0.3,
    goldChance = 0.6,
    healthChance = 0.25,
    powerupChance = 0.15
}

-- 获取随机道具
function getRandomPowerup()
    local roll = math.random()
    local cumulative = 0
    
    for i, powerup in ipairs(powerups) do
        local weight = 1
        if powerup.rarity == "common" then weight = 50
        elseif powerup.rarity == "uncommon" then weight = 30
        elseif powerup.rarity == "rare" then weight = 15
        elseif powerup.rarity == "legendary" then weight = 5
        end
        
        cumulative = cumulative + weight
        if roll * 100 <= cumulative then
            return powerup
        end
    end
    
    return powerups[1]
end

-- 根据稀有度获取道具
function getPowerupsByRarity(rarity)
    local result = {}
    for i, powerup in ipairs(powerups) do
        if powerup.rarity == rarity then
            table.insert(result, powerup)
        end
    end
    return result
end

return {
    powerups = powerups,
    chestDrops = chestDrops,
    enemyDrops = enemyDrops,
    getRandomPowerup = getRandomPowerup,
    getPowerupsByRarity = getPowerupsByRarity
}
