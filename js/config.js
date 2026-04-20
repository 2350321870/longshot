const GameConfig = {
    dragon: {
        segments: 1000,
        segmentSpacing: 20,
        baseHealthPerLevel: 50,
        healthMultiplier: 1.1,
        segmentsPerSkillSelection: 5,
        moveSpeed: 1
    },
    
    level: {
        channelCount: 10,
        channelHeight: 50,
        leftPadding: 80,
        rightPadding: 80,
        topPadding: 60,
        turnRadius: 80
    },
    
    enemy: {
        speeds: {
            normal: 0.8,
            medium: 1.0,
            fast: 1.2
        },
        damages: {
            normal: 5,
            medium: 8,
            high: 12
        }
    },
    
    drop: {
        chestDropChance: 0.6,
        dropChance: 0.3,
        powerupChanceMultiplier: 0.5
    }
};

if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
}
