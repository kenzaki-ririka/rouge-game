// src/core/CombatSystem.ts - 战斗系统

import { Player, Enemy, Entity } from '../types';
import { FOV_RADIUS } from '../constants';

export interface CombatResult {
  hit: boolean;
  damage: number;
  isCrit: boolean;
  evaded: boolean;
  lifestealHealed: number;
  thornsDamage: number;
  attackerDied: boolean;
  defenderDied: boolean;
}

/**
 * 获取实体的有效攻击力（包含效果加成）
 */
export function getEffectiveAttack(entity: Entity): number {
  let attack = entity.attack;

  entity.effects?.forEach(effect => {
    if (effect.attack) {
      attack += effect.attack;
    }
  });

  return Math.max(0, attack);
}

/**
 * 获取实体的有效防御力（包含效果加成）
 */
export function getEffectiveDefense(entity: Entity): number {
  let defense = entity.defense;

  entity.effects?.forEach(effect => {
    if (effect.defense) {
      defense += effect.defense;
    }
  });

  return Math.max(0, defense);
}

/**
 * 获取实体的有效移动速度（包含效果加成）
 */
export function getEffectiveMoveSpeed(entity: Entity): number {
  let speed = entity.moveSpeed;

  entity.effects?.forEach(effect => {
    if (effect.moveSpeed) {
      speed += effect.moveSpeed;
    }
  });

  return Math.max(1, speed); // 最低速度为1
}

/**
 * 获取实体的有效攻击速度（包含效果加成）
 */
export function getEffectiveAttackSpeed(entity: Entity): number {
  let speed = entity.attackSpeed;

  entity.effects?.forEach(effect => {
    if (effect.attackSpeed) {
      speed += effect.attackSpeed;
    }
  });

  return Math.max(1, speed); // 最低速度为1
}

/**
 * 执行攻击
 */
export function performAttack(
  attacker: Entity,
  defender: Entity,
  _isPlayerAttacking: boolean
): CombatResult {
  const result: CombatResult = {
    hit: true,
    damage: 0,
    isCrit: false,
    evaded: false,
    lifestealHealed: 0,
    thornsDamage: 0,
    attackerDied: false,
    defenderDied: false,
  };

  // 闪避判定
  if (defender.evasion > 0 && Math.random() * 100 < defender.evasion) {
    result.hit = false;
    result.evaded = true;
    return result;
  }

  // 计算伤害
  const attackPower = getEffectiveAttack(attacker);
  const defensePower = getEffectiveDefense(defender);
  let damage = Math.max(0, attackPower - defensePower);

  // 暴击判定（只有玩家可以暴击）
  if ('critChance' in attacker) {
    const player = attacker as Player;
    if (player.critChance > 0 && Math.random() * 100 < player.critChance) {
      damage = Math.floor(damage * (player.critDamage / 100));
      result.isCrit = true;
    }
  }

  result.damage = damage;
  defender.hp -= damage;

  // 吸血效果（只有玩家可以吸血）
  if ('lifesteal' in attacker && (attacker as Player).lifesteal > 0) {
    const player = attacker as Player;
    const healAmount = Math.ceil(damage * (player.lifesteal / 50));
    const actualHeal = Math.min(healAmount, player.maxHp - player.hp);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    result.lifestealHealed = actualHeal;
  }

  // 反伤效果
  if ('thorns' in defender && (defender as Player).thorns > 0) {
    const thornsDamage = (defender as Player).thorns;
    attacker.hp -= thornsDamage;
    result.thornsDamage = thornsDamage;

    if (attacker.hp <= 0) {
      result.attackerDied = true;
    }
  }

  // 检查防御者是否死亡
  if (defender.hp <= 0) {
    result.defenderDied = true;
  }

  return result;
}

/**
 * 处理敌人AI行动
 */
export function processEnemyTurn(
  enemy: Enemy,
  player: Player,
  allEnemies: Enemy[],
  isWalkable: (x: number, y: number) => boolean,
  isPositionEmpty: (x: number, y: number) => boolean,
  performAttackCallback: (attacker: Enemy, defender: Player) => void
): { moved: boolean; attacked: boolean; healed: boolean } {
  const result = { moved: false, attacked: false, healed: false };

  if (enemy.hp <= 0) return result;

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy);

  // 只有在视野范围内才行动
  if (distance >= FOV_RADIUS) {
    return result;
  }

  // 萨满特殊行为：治疗附近受伤的友军
  if (enemy.special === 'heal' && distance < 5) {
    const woundedAlly = allEnemies.find(e =>
      e.hp < e.maxHp &&
      e !== enemy &&
      Math.hypot(e.x - enemy.x, e.y - enemy.y) < 4
    );

    if (woundedAlly) {
      const healAmount = 10;
      woundedAlly.hp = Math.min(woundedAlly.maxHp, woundedAlly.hp + healAmount);
      result.healed = true;
      return result;
    }
  }

  // 相邻时攻击
  if (distance < 2) {
    performAttackCallback(enemy, player);
    result.attacked = true;
    return result;
  }

  // 移动向玩家
  let moveX = Math.sign(dx);
  let moveY = Math.sign(dy);

  // 不规则移动特性
  if (enemy.special === 'erratic' && Math.random() < 0.5) {
    moveX = Math.floor(Math.random() * 3) - 1;
    moveY = Math.floor(Math.random() * 3) - 1;
  }

  const newX = enemy.x + moveX;
  const newY = enemy.y + moveY;

  // 尝试移动
  if (isWalkable(newX, newY) && isPositionEmpty(newX, newY)) {
    enemy.x = newX;
    enemy.y = newY;
    result.moved = true;
  } else {
    // 尝试只在一个方向移动
    if (moveX !== 0 && isWalkable(enemy.x + moveX, enemy.y) && isPositionEmpty(enemy.x + moveX, enemy.y)) {
      enemy.x += moveX;
      result.moved = true;
    } else if (moveY !== 0 && isWalkable(enemy.x, enemy.y + moveY) && isPositionEmpty(enemy.x, enemy.y + moveY)) {
      enemy.y += moveY;
      result.moved = true;
    }
  }

  return result;
}

/**
 * 更新实体效果持续时间
 */
export function updateEffects(entity: Entity): string[] {
  const expiredEffects: string[] = [];

  if (!entity.effects) {
    entity.effects = [];
    return expiredEffects;
  }

  entity.effects = entity.effects.filter(effect => {
    effect.duration--;

    if (effect.duration <= 0) {
      expiredEffects.push(effect.name);

      // 处理效果结束时的特殊逻辑
      if (effect.name === 'entangled' && effect.moveSpeed) {
        // 恢复速度时不需要做任何事，因为getEffectiveMoveSpeed会处理
      }

      return false;
    }

    return true;
  });

  return expiredEffects;
}

/**
 * 处理眩晕状态
 */
export function processStun(entity: Entity): boolean {
  if (entity.stunned > 0) {
    entity.stunned--;
    return true; // 本回合被眩晕，跳过行动
  }
  return false;
}
