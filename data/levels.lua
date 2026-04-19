-- 关卡配置表
-- 每3个关卡解锁新能力

levels = {
    [1] = {
        enemyCount = 10,
        enemyHealth = 50,
        enemySpeed = 1,
        enemyDamage = 5,
        dropChance = 0.3,
        unlockAbility = false
    },
    [2] = {
        enemyCount = 15,
        enemyHealth = 60,
        enemySpeed = 1.1,
        enemyDamage = 6,
        dropChance = 0.35,
        unlockAbility = false
    },
    [3] = {
        enemyCount = 20,
        enemyHealth = 75,
        enemySpeed = 1.2,
        enemyDamage = 8,
        dropChance = 0.4,
        unlockAbility = true
    },
    [4] = {
        enemyCount = 25,
        enemyHealth = 90,
        enemySpeed = 1.3,
        enemyDamage = 10,
        dropChance = 0.4,
        unlockAbility = false
    },
    [5] = {
        enemyCount = 30,
        enemyHealth = 110,
        enemySpeed = 1.4,
        enemyDamage = 12,
        dropChance = 0.45,
        unlockAbility = false
    },
    [6] = {
        enemyCount = 35,
        enemyHealth = 130,
        enemySpeed = 1.5,
        enemyDamage = 15,
        dropChance = 0.5,
        unlockAbility = true
    },
    [7] = {
        enemyCount = 40,
        enemyHealth = 160,
        enemySpeed = 1.6,
        enemyDamage = 18,
        dropChance = 0.5,
        unlockAbility = false
    },
    [8] = {
        enemyCount = 45,
        enemyHealth = 190,
        enemySpeed = 1.7,
        enemyDamage = 22,
        dropChance = 0.55,
        unlockAbility = false
    },
    [9] = {
        enemyCount = 50,
        enemyHealth = 230,
        enemySpeed = 1.8,
        enemyDamage = 26,
        dropChance = 0.6,
        unlockAbility = true
    }
}

-- 获取关卡配置（支持无限关卡）
function getLevelConfig(levelNum)
    local baseLevel = ((levelNum - 1) % 6) + 1
    local multiplier = math.floor((levelNum - 1) / 6) + 1
    
    local baseConfig = levels[baseLevel] or levels[1]
    
    return {
        enemyCount = baseConfig.enemyCount + (multiplier - 1) * 10,
        enemyHealth = math.floor(baseConfig.enemyHealth * (1 + (multiplier - 1) * 0.3)),
        enemySpeed = baseConfig.enemySpeed + (multiplier - 1) * 0.1,
        enemyDamage = math.floor(baseConfig.enemyDamage * (1 + (multiplier - 1) * 0.2)),
        dropChance = math.min(baseConfig.dropChance + (multiplier - 1) * 0.05, 0.7),
        unlockAbility = baseConfig.unlockAbility or false
    }
end

return getLevelConfig
