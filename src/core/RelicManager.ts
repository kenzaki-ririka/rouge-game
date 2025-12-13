// src/core/RelicManager.ts - 遗物管理器

import { Player, Enemy } from '../types';
import {
    RelicTrigger,
    RelicContext,
    RelicEffectResult,
    OwnedRelic
} from '../types/relics';
import { RELIC_DEFINITIONS } from '../data/relics';

/**
 * 遗物管理器 - 处理遗物触发和效果
 */
export class RelicManager {
    /**
     * 触发特定类型的遗物效果
     */
    static triggerRelics(
        trigger: RelicTrigger,
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[],
        additionalContext: Partial<RelicContext> = {}
    ): RelicEffectResult[] {
        const results: RelicEffectResult[] = [];

        for (const ownedRelic of relics) {
            const definition = RELIC_DEFINITIONS[ownedRelic.id];
            if (!definition) continue;

            // 检查触发条件是否匹配
            if (definition.trigger !== trigger) continue;

            // 构建上下文
            const context: RelicContext = {
                player,
                enemies,
                ...additionalContext,
            };

            // 执行效果
            const result = definition.effect(context);

            // 如果有叠加层数，效果也可以叠加
            if (ownedRelic.stacks && ownedRelic.stacks > 1) {
                if (result.bonusDamage) result.bonusDamage *= ownedRelic.stacks;
                if (result.bonusGold) result.bonusGold *= ownedRelic.stacks;
                if (result.bonusHeal) result.bonusHeal *= ownedRelic.stacks;
            }

            results.push(result);
        }

        return results;
    }

    /**
     * 计算被动遗物的总加成
     */
    static getPassiveBonuses(
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[]
    ): { bonusAttack: number; bonusDefense: number } {
        let bonusAttack = 0;
        let bonusDefense = 0;

        const results = this.triggerRelics('passive', player, relics, enemies);

        for (const result of results) {
            if (result.bonusDamage) bonusAttack += result.bonusDamage;
        }

        return { bonusAttack, bonusDefense };
    }

    /**
     * 处理攻击触发的遗物
     * @returns 伤害修正系数和额外伤害
     */
    static processAttackRelics(
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[],
        target: Enemy,
        baseDamage: number
    ): { finalDamage: number; messages: string[] } {
        const messages: string[] = [];
        let damageMultiplier = 1.0;
        let bonusDamage = 0;
        let healAmount = 0;

        const results = this.triggerRelics('onAttack', player, relics, enemies, {
            target,
            damage: baseDamage,
        });

        for (const result of results) {
            if (result.damageModifier) damageMultiplier *= result.damageModifier;
            if (result.bonusDamage) bonusDamage += result.bonusDamage;
            if (result.bonusHeal) healAmount += result.bonusHeal;
            if (result.triggerMessage) messages.push(result.triggerMessage);
        }

        // 同时计算被动加成
        const passives = this.getPassiveBonuses(player, relics, enemies);
        bonusDamage += passives.bonusAttack;

        const finalDamage = Math.floor((baseDamage + bonusDamage) * damageMultiplier);

        // 应用治疗
        if (healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
        }

        return { finalDamage, messages };
    }

    /**
     * 处理击杀触发的遗物
     */
    static processKillRelics(
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[],
        killedEnemy: Enemy
    ): { bonusGold: number; messages: string[] } {
        const messages: string[] = [];
        let bonusGold = 0;
        let healAmount = 0;

        const results = this.triggerRelics('onKill', player, relics, enemies, {
            target: killedEnemy,
        });

        for (const result of results) {
            if (result.bonusGold) bonusGold += result.bonusGold;
            if (result.bonusHeal) healAmount += result.bonusHeal;
            if (result.triggerMessage) messages.push(result.triggerMessage);
        }

        // 应用治疗
        if (healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
        }

        return { bonusGold, messages };
    }

    /**
     * 处理受到伤害触发的遗物
     */
    static processDamageRelics(
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[],
        incomingDamage: number
    ): { finalDamage: number; preventDamage: boolean; messages: string[] } {
        const messages: string[] = [];
        let damageModifier = 1.0;
        let damageReduction = 0;
        let preventDamage = false;

        const results = this.triggerRelics('onDamageTaken', player, relics, enemies, {
            damage: incomingDamage,
        });

        for (const result of results) {
            if (result.damageModifier) damageModifier *= result.damageModifier;
            if (result.bonusDamage) damageReduction -= result.bonusDamage; // 负数表示减伤
            if (result.preventDamage) preventDamage = true;
            if (result.triggerMessage) messages.push(result.triggerMessage);
        }

        const finalDamage = preventDamage ? 0 : Math.max(0, Math.floor((incomingDamage - damageReduction) * damageModifier));

        return { finalDamage, preventDamage, messages };
    }

    /**
     * 处理金币获取触发的遗物
     */
    static processGoldRelics(
        player: Player,
        relics: OwnedRelic[],
        enemies: Enemy[],
        baseGold: number
    ): { finalGold: number; messages: string[] } {
        const messages: string[] = [];
        let bonusGold = 0;

        const results = this.triggerRelics('onGoldGain', player, relics, enemies, {
            goldAmount: baseGold,
        });

        for (const result of results) {
            if (result.bonusGold) bonusGold += result.bonusGold;
            if (result.triggerMessage) messages.push(result.triggerMessage);
        }

        return { finalGold: baseGold + bonusGold, messages };
    }
}
