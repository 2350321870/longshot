-- 技能配置表
-- 玩家击败敌人后可以选择的技能升级
-- 稀有度: A (高品质, 强力技能), B (普通品质)

skills = {
    {
        id = "bullet_count",
        name = "龙之力",
        description = "子弹数量+1",
        icon = "🎯",
        rarity = "A",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.bulletCount = stats.bulletCount + 1
            return stats
        end
    },
    {
        id = "damage",
        name = "龙之力",
        description = "子弹伤害+50%",
        icon = "💥",
        rarity = "A",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.bulletDamage = math.floor(stats.bulletDamage * 1.5)
            return stats
        end
    },
    {
        id = "fire_rate",
        name = "龙之力",
        description = "射击速度+20%",
        icon = "⚡",
        rarity = "A",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.fireRate = stats.fireRate * 0.8
            return stats
        end
    },
    {
        id = "max_health",
        name = "龙之力",
        description = "最大生命值+25",
        icon = "💗",
        rarity = "A",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.maxHealth = stats.maxHealth + 25
            stats.health = stats.health + 25
            return stats
        end
    },
    {
        id = "pierce",
        name = "龙之力",
        description = "子弹可穿透敌人",
        icon = "🎯",
        rarity = "A",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.bulletPierce = stats.bulletPierce + 1
            return stats
        end
    },
    {
        id = "bullet_spread",
        name = "扇形射击",
        description = "子弹覆盖范围扩大",
        icon = "🌟",
        rarity = "B",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.bulletSpread = stats.bulletSpread + 15
            return stats
        end
    },
    {
        id = "health",
        name = "生命恢复",
        description = "恢复30点生命值",
        icon = "❤️",
        rarity = "B",
        maxLevel = 99,
        applyEffect = function(stats, level)
            stats.health = math.min(stats.health + 30, stats.maxHealth)
            return stats
        end
    },
    {
        id = "bullet_size",
        name = "巨型子弹",
        description = "子弹体积变大",
        icon = "🔵",
        rarity = "B",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.bulletSize = stats.bulletSize + 3
            return stats
        end
    },
    {
        id = "speed",
        name = "加速移动",
        description = "移动速度+15%",
        icon = "🏃",
        rarity = "B",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.speed = stats.speed * 1.15
            return stats
        end
    },
    {
        id = "crit_chance",
        name = "暴击专精",
        description = "暴击几率+10%",
        icon = "⭐",
        rarity = "B",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.criticalChance = stats.criticalChance + 0.1
            return stats
        end
    },
    {
        id = "crit_damage",
        name = "暴击强化",
        description = "暴击伤害+50%",
        icon = "💫",
        rarity = "B",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.criticalDamage = stats.criticalDamage + 0.5
            return stats
        end
    },
    {
        id = "magnet",
        name = "磁铁效果",
        description = "自动吸引道具范围+50",
        icon = "🧲",
        rarity = "B",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.magnetRange = stats.magnetRange + 50
            return stats
        end
    },
    {
        id = "bullet_speed",
        name = "飞速子弹",
        description = "子弹飞行速度+20%",
        icon = "🚀",
        rarity = "B",
        maxLevel = 5,
        applyEffect = function(stats, level)
            stats.bulletSpeed = stats.bulletSpeed * 1.2
            return stats
        end
    },
    {
        id = "life_steal",
        name = "生命汲取",
        description = "每次击杀恢复5点生命",
        icon = "💀",
        rarity = "B",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.lifeSteal = (stats.lifeSteal or 0) + 5
            return stats
        end
    },
    {
        id = "bounce",
        name = "弹跳子弹",
        description = "子弹可在敌人间弹跳",
        icon = "🔄",
        rarity = "B",
        maxLevel = 3,
        applyEffect = function(stats, level)
            stats.bulletBounce = stats.bulletBounce + 1
            return stats
        end
    }
}

-- 获取随机技能
function getRandomSkills(count, excludeIds)
    excludeIds = excludeIds or {}
    local available = {}
    
    for i, skill in ipairs(skills) do
        local excluded = false
        for _, excludeId in ipairs(excludeIds) do
            if skill.id == excludeId then
                excluded = true
                break
            end
        end
        if not excluded then
            table.insert(available, skill)
        end
    end
    
    local result = {}
    for i = 1, math.min(count, #available) do
        local idx = math.random(1, #available)
        table.insert(result, available[idx])
        table.remove(available, idx)
    end
    
    return result
end

-- 根据稀有度获取技能
function getSkillsByRarity(rarity)
    local result = {}
    for i, skill in ipairs(skills) do
        if skill.rarity == rarity then
            table.insert(result, skill)
        end
    end
    return result
end

return {
    skills = skills,
    getRandomSkills = getRandomSkills,
    getSkillsByRarity = getSkillsByRarity
}
