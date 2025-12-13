// src/data/skills.ts - 技能定义和效果

import {
  Skill,
  SkillDefinition,
  SkillEffectFunction,
  Player,
  Enemy,
  Position,
} from '../types';

// ==================== 辅助函数 ====================

/**
 * 切比雪夫距离（棋盘距离）
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

/**
 * 欧几里得距离
 */
export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * 查找范围内最近的敌人
 */
function findNearestEnemy(
  caster: Player,
  enemies: Enemy[],
  maxRange: number
): Enemy | null {
  let nearest: Enemy | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    const dist = euclideanDistance(caster.x, caster.y, enemy.x, enemy.y);
    if (dist <= maxRange && dist < nearestDist) {
      nearest = enemy;
      nearestDist = dist;
    }
  }

  return nearest;
}

/**
 * 获取范围内的所有敌人
 */
function getEnemiesInRange(
  centerX: number,
  centerY: number,
  enemies: Enemy[],
  range: number,
  useChebysev = true
): Enemy[] {
  return enemies.filter(enemy => {
    const dist = useChebysev
      ? chebyshevDistance(centerX, centerY, enemy.x, enemy.y)
      : euclideanDistance(centerX, centerY, enemy.x, enemy.y);
    return dist <= range;
  });
}

// ==================== 技能效果实现 ====================

const skillEffects: Record<string, SkillEffectFunction> = {
  // 火球术 - AOE伤害
  fireball: (caster, target, context) => {
    const { enemies, killEntity, addLog, updateGame } = context;

    // 如果没有指定目标，自动选择最近的敌人
    let targetPos: Position;
    if (!target) {
      const nearest = findNearestEnemy(caster, enemies, 5);
      if (!nearest) {
        addLog('火球没有有效目标。', 'system');
        return false;
      }
      targetPos = { x: nearest.x, y: nearest.y };
    } else if ('hp' in target) {
      targetPos = { x: target.x, y: target.y };
    } else {
      targetPos = target;
    }

    const damage = 10 + caster.level * 2;
    const radius = 2;

    addLog(`一颗火球在 (${targetPos.x}, ${targetPos.y}) 爆炸！`, 'skill');

    let hitCount = 0;
    const affectedEnemies = getEnemiesInRange(targetPos.x, targetPos.y, enemies, radius);

    for (const enemy of affectedEnemies) {
      enemy.hp -= damage;
      addLog(`爆炸冲击了 ${enemy.name}，造成 ${damage} 点真实伤害！`, 'player');
      hitCount++;

      if (enemy.hp <= 0) {
        killEntity(enemy);
      }
    }

    updateGame();
    return hitCount > 0;
  },

  // 治疗术 - 恢复生命
  heal: (caster, _target, context) => {
    const { addLog, updateGame } = context;

    const healAmount = Math.floor(caster.maxHp * 0.3);
    const actualHeal = Math.min(healAmount, caster.maxHp - caster.hp);
    caster.hp = Math.min(caster.maxHp, caster.hp + healAmount);

    addLog(`一道圣光治愈了你，恢复了 ${actualHeal} 点生命。`, 'skill');
    updateGame();
    return true;
  },

  // 旋风斩 - 周围AOE
  whirlwind: (caster, _target, context) => {
    const { enemies, killEntity, addLog, updateGame } = context;

    const damage = 8 + caster.level;
    const affectedEnemies = getEnemiesInRange(caster.x, caster.y, enemies, 1);

    if (affectedEnemies.length === 0) {
      addLog('旋风斩周围没有敌人。', 'system');
      return false;
    }

    addLog('你如旋风般挥舞武器！', 'skill');

    for (const enemy of affectedEnemies) {
      enemy.hp -= damage;
      addLog(`旋风斩击中了 ${enemy.name}，造成 ${damage} 点伤害！`, 'player');

      if (enemy.hp <= 0) {
        killEntity(enemy);
      }
    }

    updateGame();
    return true;
  },

  // 盾牌猛击 - 单体伤害+眩晕
  shield_bash: (caster, target, context) => {
    const { enemies, killEntity, addLog, updateGame } = context;

    // 自动选择目标
    let targetEnemy: Enemy | null = null;
    if (target && 'hp' in target) {
      targetEnemy = target;
    } else {
      targetEnemy = findNearestEnemy(caster, enemies, 1.5);
    }

    if (!targetEnemy || chebyshevDistance(caster.x, caster.y, targetEnemy.x, targetEnemy.y) > 1) {
      addLog('盾牌猛击没有有效目标。', 'system');
      return false;
    }

    const damage = 5 + caster.level;
    targetEnemy.hp -= damage;
    addLog(`盾牌猛击击中了 ${targetEnemy.name}，造成 ${damage} 点伤害！`, 'player');

    // 70%概率眩晕
    if (Math.random() < 0.7) {
      targetEnemy.stunned = 30; // AP单位的眩晕
      addLog(`${targetEnemy.name} 被击晕了！`, 'skill');
    }

    if (targetEnemy.hp <= 0) {
      killEntity(targetEnemy);
    }

    updateGame();
    return true;
  },

  // 战斗怒吼 - Buff
  battle_shout: (caster, _target, context) => {
    const { addLog, updateGame } = context;

    caster.effects.push({
      name: 'battle_shout',
      duration: 5,
      attack: 5,
      defense: 3,
    });

    addLog('你发出战斗怒吼，攻击力和防御力提升了！', 'skill');
    updateGame();
    return true;
  },

  // 冲刺 - 需要方向输入
  dash: (_caster, _target, context) => {
    const { addLog } = context;
    addLog('请使用方向键选择冲刺方向。', 'system');
    return 'prompt_direction';
  },

  // 光芒 - 恢复火把值
  radiance: (caster, _target, context) => {
    const { addLog, updateGame } = context;

    const torchGain = Math.floor(caster.maxTorch * 0.5);
    const actualGain = Math.min(torchGain, caster.maxTorch - caster.torch);
    caster.torch = Math.min(caster.maxTorch, caster.torch + torchGain);

    addLog(`你释放出一道光芒，恢复了 ${actualGain} 点火把值。`, 'skill');
    updateGame();
    return true;
  },

  // 毒雾 - 地面持续伤害
  toxic_mist: (caster, target, context) => {
    const { enemies, addLog, updateGame, isWalkable, addGroundEffect, killEntity } = context;

    // 确定目标位置
    let targetPos: Position;
    if (!target) {
      const nearest = findNearestEnemy(caster, enemies, 5);
      if (!nearest) {
        addLog('毒雾没有有效目标区域。', 'system');
        return false;
      }
      targetPos = { x: nearest.x, y: nearest.y };
    } else if ('hp' in target) {
      targetPos = { x: target.x, y: target.y };
    } else {
      targetPos = target;
    }

    addLog(`一片毒雾在 (${targetPos.x}, ${targetPos.y}) 升起...`, 'skill');

    // 创建毒雾区域
    const mistTiles: Position[] = [];
    const radius = 3;

    for (let x = targetPos.x - radius; x <= targetPos.x + radius; x++) {
      for (let y = targetPos.y - radius; y <= targetPos.y + radius; y++) {
        if (isWalkable(x, y) && chebyshevDistance(targetPos.x, targetPos.y, x, y) <= radius) {
          mistTiles.push({ x, y });
        }
      }
    }

    // 对区域内敌人造成即时伤害
    const poisonDamage = 5 + caster.level;
    const affectedEnemies = getEnemiesInRange(targetPos.x, targetPos.y, enemies, radius);

    for (const enemy of affectedEnemies) {
      enemy.hp -= poisonDamage;
      addLog(`毒雾侵蚀了 ${enemy.name}，造成 ${poisonDamage} 点毒素伤害！`, 'skill');

      if (enemy.hp <= 0) {
        killEntity(enemy);
      }
    }

    // 创建地面效果
    const groundEffect = {
      tiles: mistTiles,
      duration: 5,
      damage: 3,
      name: '毒雾',
      color: 'rgba(100, 200, 50, 0.4)',
      effect: (entity: { hp: number }) => {
        entity.hp -= 3;
      },
    };

    addGroundEffect(groundEffect);
    updateGame();
    return true;
  },

  // 冰冻 - 控制技能
  freeze: (caster, target, context) => {
    const { enemies, addLog, updateGame } = context;

    let targetEnemy: Enemy | null = null;
    if (target && 'hp' in target) {
      targetEnemy = target;
    } else {
      targetEnemy = findNearestEnemy(caster, enemies, 5);
    }

    if (!targetEnemy || chebyshevDistance(caster.x, caster.y, targetEnemy.x, targetEnemy.y) > 5) {
      addLog('冰冻没有有效目标。', 'system');
      return false;
    }

    addLog(`${targetEnemy.name} 被一层寒冰覆盖了！`, 'skill');
    targetEnemy.stunned = 80; // 较长时间的冻结

    updateGame();
    return true;
  },

  // 缠绕 - 减速
  entangle: (caster, target, context) => {
    const { enemies, addLog, updateGame } = context;

    let targetEnemy: Enemy | null = null;
    if (target && 'hp' in target) {
      targetEnemy = target;
    } else {
      targetEnemy = findNearestEnemy(caster, enemies, 5);
    }

    if (!targetEnemy || chebyshevDistance(caster.x, caster.y, targetEnemy.x, targetEnemy.y) > 5) {
      addLog('缠绕没有有效目标。', 'system');
      return false;
    }

    addLog(`藤蔓从地下伸出，缠住了 ${targetEnemy.name}！`, 'skill');

    // 减速效果 - 影响移动速度
    const speedReduction = Math.floor(targetEnemy.moveSpeed * 0.5);
    targetEnemy.effects.push({
      name: 'entangled',
      duration: 10,
      moveSpeed: -speedReduction,
    });

    updateGame();
    return true;
  },

  // 闪电 - 高伤害单体
  lightning: (caster, target, context) => {
    const { enemies, killEntity, addLog, updateGame } = context;

    let targetEnemy: Enemy | null = null;
    if (target && 'hp' in target) {
      targetEnemy = target;
    } else {
      targetEnemy = findNearestEnemy(caster, enemies, 7);
    }

    if (!targetEnemy || chebyshevDistance(caster.x, caster.y, targetEnemy.x, targetEnemy.y) > 7) {
      addLog('闪电没有有效目标。', 'system');
      return false;
    }

    const damage = 20 + caster.level * 3;
    targetEnemy.hp -= damage;

    addLog(`一道闪电击中了 ${targetEnemy.name}，造成 ${damage} 点真实伤害！`, 'skill');

    if (targetEnemy.hp <= 0) {
      killEntity(targetEnemy);
    }

    updateGame();
    return true;
  },

  // 魔法飞弹 - 必中
  magic_missile: (caster, target, context) => {
    const { enemies, killEntity, addLog, updateGame } = context;

    let targetEnemy: Enemy | null = null;
    if (target && 'hp' in target) {
      targetEnemy = target;
    } else {
      targetEnemy = findNearestEnemy(caster, enemies, 6);
    }

    if (!targetEnemy) {
      addLog('魔法飞弹没有有效目标。', 'system');
      return false;
    }

    const damage = 5 + caster.level;
    targetEnemy.hp -= damage;

    addLog(`魔法飞弹击中了 ${targetEnemy.name}，造成 ${damage} 点魔法伤害！`, 'player');

    if (targetEnemy.hp <= 0) {
      killEntity(targetEnemy);
    }

    updateGame();
    return true;
  },

  // 烈焰领域 - 范围火焰伤害
  flame_zone: (caster, target, context) => {
    const { enemies, addLog, updateGame, isWalkable, addGroundEffect, killEntity } = context;

    // 确定目标位置
    let targetPos: Position;
    if (!target) {
      const nearest = findNearestEnemy(caster, enemies, 5);
      if (!nearest) {
        addLog('烈焰领域没有有效目标区域。', 'system');
        return false;
      }
      targetPos = { x: nearest.x, y: nearest.y };
    } else if ('hp' in target) {
      targetPos = { x: target.x, y: target.y };
    } else {
      targetPos = target;
    }

    addLog(`烈焰在 (${targetPos.x}, ${targetPos.y}) 燃起！`, 'skill');

    // 创建火焰区域
    const flameTiles: Position[] = [];
    const radius = 2;

    for (let x = targetPos.x - radius; x <= targetPos.x + radius; x++) {
      for (let y = targetPos.y - radius; y <= targetPos.y + radius; y++) {
        if (isWalkable(x, y) && chebyshevDistance(targetPos.x, targetPos.y, x, y) <= radius) {
          flameTiles.push({ x, y });
        }
      }
    }

    // 对区域内敌人造成即时伤害
    const fireDamage = 12 + caster.level * 2;
    const affectedEnemies = getEnemiesInRange(targetPos.x, targetPos.y, enemies, radius);

    for (const enemy of affectedEnemies) {
      enemy.hp -= fireDamage;
      addLog(`烈焰灼烧了 ${enemy.name}，造成 ${fireDamage} 点火焰伤害！`, 'skill');

      if (enemy.hp <= 0) {
        killEntity(enemy);
      }
    }

    // 创建地面效果
    const groundEffect = {
      tiles: flameTiles,
      duration: 3,
      damage: 5,
      name: '烈焰领域',
      color: 'rgba(255, 100, 0, 0.5)',
      effect: (entity: { hp: number }) => {
        entity.hp -= 5;
      },
    };

    addGroundEffect(groundEffect);
    updateGame();
    return true;
  },
};

// ==================== 技能定义数据 ====================

export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  fireball: {
    id: 'fireball',
    name: '火球术',
    cost: 10,
    type: 'damage',
    description: '向目标区域投掷火球，对2格范围内敌人造成真实伤害。',
  },
  heal: {
    id: 'heal',
    name: '治疗术',
    cost: 15,
    type: 'heal',
    description: '恢复30%最大生命值。',
  },
  whirlwind: {
    id: 'whirlwind',
    name: '旋风斩',
    cost: 20,
    type: 'damage',
    description: '对周围1格内所有敌人造成伤害。',
  },
  shield_bash: {
    id: 'shield_bash',
    name: '盾牌猛击',
    cost: 8,
    type: 'control',
    description: '攻击相邻敌人并有70%概率击晕。',
  },
  battle_shout: {
    id: 'battle_shout',
    name: '战斗怒吼',
    cost: 12,
    type: 'buff',
    description: '5回合内攻击+5，防御+3。',
  },
  dash: {
    id: 'dash',
    name: '冲刺',
    cost: 5,
    type: 'utility',
    description: '向指定方向快速移动2格。',
  },
  radiance: {
    id: 'radiance',
    name: '光芒',
    cost: 8,
    type: 'utility',
    description: '恢复50%火把值。',
  },
  toxic_mist: {
    id: 'toxic_mist',
    name: '毒雾',
    cost: 18,
    type: 'damage',
    description: '在目标区域创建毒雾，持续造成伤害。',
  },
  freeze: {
    id: 'freeze',
    name: '冰冻',
    cost: 15,
    type: 'control',
    description: '冻结目标敌人较长时间。',
  },
  entangle: {
    id: 'entangle',
    name: '缠绕',
    cost: 10,
    type: 'control',
    description: '用藤蔓缠住敌人，大幅降低移动速度。',
  },
  lightning: {
    id: 'lightning',
    name: '闪电',
    cost: 25,
    type: 'damage',
    description: '对单个敌人造成高额真实伤害。',
  },
  magic_missile: {
    id: 'magic_missile',
    name: '魔法飞弹',
    cost: 5,
    type: 'damage',
    description: '发射一枚必中的魔法飞弹。',
  },
  flame_zone: {
    id: 'flame_zone',
    name: '烈焰领域',
    cost: 20,
    type: 'damage',
    description: '在目标区域创建火焰范围，造成高额火焰伤害。',
  },
};

// ==================== 构建完整技能库 ====================

export const SKILL_LIBRARY: Record<string, Skill> = {};

for (const id in SKILL_DEFINITIONS) {
  if (skillEffects[id]) {
    SKILL_LIBRARY[id] = {
      ...SKILL_DEFINITIONS[id],
      effect: skillEffects[id],
    };
  }
}

/**
 * 获取所有可选技能ID列表
 */
export function getAvailableSkillIds(): string[] {
  return Object.keys(SKILL_LIBRARY);
}

/**
 * 获取技能信息
 */
export function getSkill(id: string): Skill | undefined {
  return SKILL_LIBRARY[id];
}
