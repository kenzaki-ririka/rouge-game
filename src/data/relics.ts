// src/data/relics.ts - 遗物定义

import { RelicDefinition, RelicContext } from '../types/relics';

// ==================== 遗物效果实现 ====================

export const RELIC_DEFINITIONS: Record<string, RelicDefinition> = {
    // ---------- 普通遗物 (Common) ----------

    blood_stone: {
        id: 'blood_stone',
        name: '血之石',
        description: '击杀敌人时恢复5点生命',
        rarity: 'common',
        trigger: 'onKill',
        icon: '💎',
        effect: (_ctx: RelicContext) => ({
            bonusHeal: 5,
            triggerMessage: '血之石发光，恢复了5点生命！',
        }),
    },

    gold_magnet: {
        id: 'gold_magnet',
        name: '金币磁铁',
        description: '获得金币时额外获得20%',
        rarity: 'common',
        trigger: 'onGoldGain',
        icon: '🧲',
        effect: (ctx: RelicContext) => ({
            bonusGold: Math.floor((ctx.goldAmount || 0) * 0.2),
            triggerMessage: '金币磁铁吸引了更多金币！',
        }),
    },

    iron_skin: {
        id: 'iron_skin',
        name: '铁皮护符',
        description: '受到伤害时减少2点伤害',
        rarity: 'common',
        trigger: 'onDamageTaken',
        icon: '🛡️',
        effect: (_ctx: RelicContext) => ({
            bonusDamage: -2, // 负数表示减少受到的伤害
        }),
    },

    // ---------- 稀有遗物 (Uncommon) ----------

    berserker_heart: {
        id: 'berserker_heart',
        name: '狂战士之心',
        description: '生命值低于30%时，攻击力翻倍',
        rarity: 'uncommon',
        trigger: 'onAttack',
        icon: '❤️‍🔥',
        effect: (ctx: RelicContext) => {
            const isLowHp = ctx.player.hp < ctx.player.maxHp * 0.3;
            return {
                damageModifier: isLowHp ? 2.0 : 1.0,
                triggerMessage: isLowHp ? '狂战士之心燃烧！伤害翻倍！' : undefined,
            };
        },
    },

    midas_touch: {
        id: 'midas_touch',
        name: '点金手',
        description: '击杀敌人时获得额外金币，数量等于你的幸运值',
        rarity: 'uncommon',
        trigger: 'onKill',
        icon: '✋',
        effect: (ctx: RelicContext) => ({
            bonusGold: ctx.player.luck,
            triggerMessage: `点金手闪耀，获得${ctx.player.luck}额外金币！`,
        }),
    },

    vampiric_blade: {
        id: 'vampiric_blade',
        name: '吸血之刃',
        description: '攻击时恢复造成伤害的10%生命',
        rarity: 'uncommon',
        trigger: 'onAttack',
        icon: '🗡️',
        effect: (ctx: RelicContext) => ({
            bonusHeal: Math.floor((ctx.damage || 0) * 0.1),
            triggerMessage: '吸血之刃吸取了生命力！',
        }),
    },

    executioner_axe: {
        id: 'executioner_axe',
        name: '处刑者之斧',
        description: '对生命值低于20%的敌人造成双倍伤害',
        rarity: 'uncommon',
        trigger: 'onAttack',
        icon: '🪓',
        effect: (ctx: RelicContext) => {
            const isLowHp = ctx.target && ctx.target.hp < ctx.target.maxHp * 0.2;
            return {
                damageModifier: isLowHp ? 2.0 : 1.0,
                triggerMessage: isLowHp ? '处刑者之斧执行处决！' : undefined,
            };
        },
    },

    // ---------- 稀有遗物 (Rare) ----------

    wealth_is_power: {
        id: 'wealth_is_power',
        name: '财富即力量',
        description: '每100金币增加5点攻击力（被动）',
        rarity: 'rare',
        trigger: 'passive',
        icon: '💰',
        effect: (ctx: RelicContext) => ({
            bonusDamage: Math.floor(ctx.player.gold / 100) * 5,
        }),
    },

    glass_cannon: {
        id: 'glass_cannon',
        name: '玻璃大炮',
        description: '造成的伤害+50%，但受到的伤害也+50%',
        rarity: 'rare',
        trigger: 'onAttack',
        icon: '💥',
        effect: () => ({
            damageModifier: 1.5,
        }),
    },

    glass_cannon_defense: {
        id: 'glass_cannon_defense',
        name: '玻璃大炮（防御面）',
        description: '（玻璃大炮的另一面效果）',
        rarity: 'rare',
        trigger: 'onDamageTaken',
        icon: '💥',
        effect: () => ({
            damageModifier: 1.5,
        }),
    },

    soul_collector: {
        id: 'soul_collector',
        name: '灵魂收集者',
        description: '击杀敌人时，永久增加1点最大生命值',
        rarity: 'rare',
        trigger: 'onKill',
        icon: '👻',
        effect: (ctx: RelicContext) => {
            ctx.player.maxHp += 1;
            return {
                triggerMessage: '灵魂收集者收集了一个灵魂！最大生命+1',
            };
        },
    },

    chain_lightning: {
        id: 'chain_lightning',
        name: '连锁闪电',
        description: '攻击时有20%概率对周围敌人造成5点伤害',
        rarity: 'rare',
        trigger: 'onAttack',
        icon: '⚡',
        effect: (ctx: RelicContext) => {
            const triggers = Math.random() < 0.2;
            if (triggers && ctx.enemies) {
                // 对所有敌人造成伤害（除了目标）
                ctx.enemies.forEach(e => {
                    if (e !== ctx.target) {
                        e.hp -= 5;
                    }
                });
            }
            return {
                triggerMessage: triggers ? '连锁闪电弹射！' : undefined,
            };
        },
    },

    // ---------- 传说遗物 (Legendary) ----------

    infinity_gauntlet: {
        id: 'infinity_gauntlet',
        name: '无尽手套',
        description: '每层获得的所有属性提升翻倍',
        rarity: 'legendary',
        trigger: 'onLevelUp',
        icon: '🧤',
        effect: () => ({
            triggerMessage: '无尽手套的力量觉醒！',
            // 实际效果需要在升级逻辑中处理
        }),
    },

    phoenix_feather: {
        id: 'phoenix_feather',
        name: '凤凰羽毛',
        description: '死亡时复活一次，恢复50%生命值（每层限一次）',
        rarity: 'legendary',
        trigger: 'onDamageTaken',
        icon: '🪶',
        effect: (ctx: RelicContext) => {
            // 如果这次伤害会导致死亡
            if (ctx.player.hp <= 0) {
                ctx.player.hp = Math.floor(ctx.player.maxHp * 0.5);
                return {
                    preventDamage: true,
                    triggerMessage: '凤凰羽毛燃烧！你从灰烬中重生！',
                };
            }
            return {};
        },
    },

    time_loop: {
        id: 'time_loop',
        name: '时间回环',
        description: '使用技能时有30%概率不消耗魔法',
        rarity: 'legendary',
        trigger: 'onSkillUse',
        icon: '⏰',
        effect: (ctx: RelicContext) => {
            const triggers = Math.random() < 0.3;
            // 实际实现需要在技能使用逻辑中处理 - 通过ctx.skillId获取技能ID
            void ctx; // Suppress unused warning
            return {
                triggerMessage: triggers ? '时间回环！魔法未被消耗！' : undefined,
            };
        },
    },

    greed_incarnate: {
        id: 'greed_incarnate',
        name: '贪婪化身',
        description: '金币获取+100%，但商店价格也+50%',
        rarity: 'legendary',
        trigger: 'onGoldGain',
        icon: '🐉',
        effect: (ctx: RelicContext) => ({
            bonusGold: ctx.goldAmount || 0, // 翻倍
            triggerMessage: '贪婪化身吞噬了更多金币！',
        }),
    },
};

// ==================== 辅助函数 ====================

/**
 * 获取所有遗物
 */
export function getAllRelics(): RelicDefinition[] {
    return Object.values(RELIC_DEFINITIONS);
}

/**
 * 按稀有度获取遗物
 */
export function getRelicsByRarity(rarity: string): RelicDefinition[] {
    return getAllRelics().filter(r => r.rarity === rarity);
}

/**
 * 获取随机遗物
 */
export function getRandomRelic(weights = { common: 50, uncommon: 30, rare: 15, legendary: 5 }): RelicDefinition | null {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;

    for (const [rarity, weight] of Object.entries(weights)) {
        roll -= weight;
        if (roll <= 0) {
            const relicsOfRarity = getRelicsByRarity(rarity);
            if (relicsOfRarity.length > 0) {
                return relicsOfRarity[Math.floor(Math.random() * relicsOfRarity.length)];
            }
        }
    }

    return null;
}
