const GameConfig = {
    dragon: {
        baseSegments: 30,
        segmentsPerLevel: 5,
        maxSegments: 80,
        segmentSpacing: 46,
        baseHealthPerSegment: 15,
        healthPerLevel: 5,
        healthDistributionFrontMultiplier: 0.5,
        healthDistributionBackMultiplier: 2.0,
        segmentsPerSkillSelectionEarly: 2,
        segmentsPerSkillSelectionMid: 4,
        segmentsPerSkillSelectionLate: 6,
        moveSpeed: 1
    },
    
    level: {
        channelCount: 10,
        channelHeight: 50,
        leftPadding: 80,
        rightPadding: 80,
        topPadding: 20,
        turnRadius: 20,
        reviveCount: 3
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
