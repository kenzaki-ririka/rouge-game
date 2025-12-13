// src/types/relics.ts - 遗物系统类型定义

import { Player, Enemy } from './index';

// ==================== 遗物触发时机 ====================

export type RelicTrigger =
    | 'onAttack'        // 攻击时
    | 'onKill'          // 击杀敌人时
    | 'onDamageTaken'   // 受到伤害时
    | 'onHeal'          // 治疗时
    | 'onTurnStart'     // 回合开始时
    | 'onTurnEnd'       // 回合结束时
    | 'onLevelUp'       // 升级时
    | 'onGoldGain'      // 获得金币时
    | 'onSkillUse'      // 使用技能时
    | 'passive';        // 被动效果（始终生效）

// ==================== 遗物稀有度 ====================

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

// ==================== 遗物效果上下文 ====================

export interface RelicContext {
    player: Player;
    enemies: Enemy[];
    target?: Enemy;        // 当前目标（攻击/技能目标）
    damage?: number;       // 造成/受到的伤害
    goldAmount?: number;   // 金币数量
    healAmount?: number;   // 治疗量
    skillId?: string;      // 使用的技能ID
}

// ==================== 遗物效果函数 ====================

export type RelicEffectFunction = (context: RelicContext) => RelicEffectResult;

export interface RelicEffectResult {
    damageModifier?: number;      // 伤害加成（乘数）
    bonusDamage?: number;         // 额外伤害（固定值）
    bonusGold?: number;           // 额外金币
    bonusHeal?: number;           // 额外治疗
    preventDamage?: boolean;      // 是否阻止伤害
    triggerMessage?: string;      // 触发时显示的消息
}

// ==================== 遗物定义 ====================

export interface RelicDefinition {
    id: string;
    name: string;
    description: string;
    rarity: RelicRarity;
    trigger: RelicTrigger;
    effect: RelicEffectFunction;
    icon?: string;                // 图标字符
}

// ==================== 玩家拥有的遗物 ====================

export interface OwnedRelic {
    id: string;
    stacks?: number;    // 某些遗物可以叠加
}

// ==================== 遗物商店价格 ====================

export const RELIC_PRICES: Record<RelicRarity, number> = {
    common: 50,
    uncommon: 100,
    rare: 200,
    legendary: 400,
};

// ==================== 稀有度颜色 ====================

export const RELIC_COLORS: Record<RelicRarity, string> = {
    common: '#ffffff',
    uncommon: '#4caf50',
    rare: '#2196f3',
    legendary: '#ff9800',
};
