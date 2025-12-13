// src/config/ConfigManager.ts - 配置管理器

import balanceConfig from './balance.json';
import monstersConfig from './monsters.json';
import skillsConfig from './skills.json';

// ==================== 类型定义 ====================

export interface BalanceConfig {
    player: {
        defaults: {
            maxHp: number;
            maxMp: number;
            maxTorch: number;
            attack: number;
            defense: number;
            moveSpeed: number;
            attackSpeed: number;
            critChance: number;
            critDamage: number;
            evasion: number;
            luck: number;
            hpRegen: number;
            mpRegen: number;
            lifesteal: number;
            thorns: number;
            skillSlots: number;
            arrows: number;
            maxArrows: number;
        };
        statAllocationPoints: number;
        statSteps: Record<string, number>;
    };
    combat: {
        actionCost: number;
        arrowDamage: number;
        arrowRange: number;
    };
    progression: {
        initialNextLevelExp: number;
        levelUpExpMultiplier: number;
        levelUpHealPercent: number;
        regenTickInterval: number;
    };
    torch: {
        consumptionRate: number;
        oilRestorePercent: number;
    };
    items: {
        goldBase: number;
        goldPerFloor: number;
        potionHealPercent: number;
        arrowPickupCount: number;
        spawnRates: {
            gold: number;
            oil: number;
            potion: number;
            arrow: number;
        };
    };
    map: {
        width: number;
        height: number;
        tileSize: number;
        fovRadius: number;
        fogOfWarEnabled: boolean;
        pillarsCount: number;
        wallSegmentsCount: number;
    };
    shop: {
        floors: number[];
    };
}

export interface MonsterConfig {
    id: string;
    name: string;
    char: string;
    minFloor: number;
    maxFloor: number;
    stats: {
        hp: [number, number];
        attack: [number, number];
        defense: [number, number];
        evasion: number;
        exp: [number, number];
        moveSpeed: number;
        attackSpeed: number;
    };
    special: string;
    attackRange: number;
}

export interface SkillConfig {
    id: string;
    name: string;
    cost: number;
    type: string;
    description: string;
    damage?: number;
    damagePerLevel?: number;
    damagePerTurn?: number;
    instantDamage?: number;
    radius?: number;
    range?: number;
    duration?: number;
    healPercent?: number;
    torchRestorePercent?: number;
    stunChance?: number;
    stunDuration?: number;
    slowPercent?: number;
    attackBonus?: number;
    defenseBonus?: number;
    distance?: number;
}

// ==================== 配置管理器 ====================

class ConfigManager {
    private balance: BalanceConfig;
    private monsters: Record<string, MonsterConfig>;
    private skills: Record<string, SkillConfig>;

    constructor() {
        this.balance = balanceConfig as unknown as BalanceConfig;
        this.monsters = monstersConfig as unknown as Record<string, MonsterConfig>;
        this.skills = skillsConfig as unknown as Record<string, SkillConfig>;
    }

    // ==================== Balance Getters ====================

    getPlayerDefaults() {
        return this.balance.player.defaults;
    }

    getStatAllocationPoints() {
        return this.balance.player.statAllocationPoints;
    }

    getStatSteps() {
        return this.balance.player.statSteps;
    }

    getCombat() {
        return this.balance.combat;
    }

    getProgression() {
        return this.balance.progression;
    }

    getTorch() {
        return this.balance.torch;
    }

    getItems() {
        return this.balance.items;
    }

    getMap() {
        return this.balance.map;
    }

    getShop() {
        return this.balance.shop;
    }

    // ==================== Monster Getters ====================

    getMonster(id: string): MonsterConfig | undefined {
        return this.monsters[id];
    }

    getAvailableMonsters(floor: number): MonsterConfig[] {
        return Object.values(this.monsters).filter(
            m => floor >= m.minFloor && floor <= m.maxFloor
        );
    }

    getRandomMonster(floor: number): MonsterConfig | null {
        const available = this.getAvailableMonsters(floor);
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ==================== Skill Getters ====================

    getSkill(id: string): SkillConfig | undefined {
        return this.skills[id];
    }

    getAllSkills(): SkillConfig[] {
        return Object.values(this.skills);
    }

    getAllSkillIds(): string[] {
        return Object.keys(this.skills);
    }
}

// 单例导出
export const gameConfig = new ConfigManager();

// 便捷导出
export const CONFIG = {
    get player() { return gameConfig.getPlayerDefaults(); },
    get combat() { return gameConfig.getCombat(); },
    get progression() { return gameConfig.getProgression(); },
    get torch() { return gameConfig.getTorch(); },
    get items() { return gameConfig.getItems(); },
    get map() { return gameConfig.getMap(); },
    get shop() { return gameConfig.getShop(); },
};
