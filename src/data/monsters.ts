// src/data/monsters.ts - 怪物定义数据 (DEPRECATED - use ConfigManager instead)
// This file is kept for backwards compatibility but ConfigManager should be used for new code.

import { MonsterDefinition } from '../types';

export const MONSTER_DEFINITIONS: Record<string, MonsterDefinition> = {
  goblin: {
    id: 'goblin',
    name: '哥布林',
    char: 'g',
    minFloor: 1,
    maxFloor: 3,
    stats: {
      hp: [12, 2],
      attack: [3, 1],
      defense: [1, 0],
      evasion: 5,
      exp: [5, 1],
      moveSpeed: 10,
      attackSpeed: 10,
    },
    special: 'none',
    attackRange: 1,
  },

  slime: {
    id: 'slime',
    name: '黏液怪',
    char: 'm',
    minFloor: 1,
    maxFloor: 2,
    stats: {
      hp: [15, 3],
      attack: [2, 1],
      defense: [0, 0],
      evasion: 0,
      exp: [4, 1],
      moveSpeed: 5,
      attackSpeed: 8,
    },
    special: 'split',
    attackRange: 1,
  },

  mini_slime: {
    id: 'mini_slime',
    name: '小黏液怪',
    char: 'm',
    minFloor: 99,
    maxFloor: 99,
    stats: {
      hp: [5, 0],
      attack: [2, 0],
      defense: [0, 0],
      evasion: 0,
      exp: [1, 0],
      moveSpeed: 8,
      attackSpeed: 8,
    },
    special: 'none',
    attackRange: 1,
  },

  bat: {
    id: 'bat',
    name: '洞穴蝙蝠',
    char: 'b',
    minFloor: 2,
    maxFloor: 4,
    stats: {
      hp: [10, 2],
      attack: [4, 1],
      defense: [0, 0],
      evasion: 30,
      exp: [8, 1],
      moveSpeed: 15,
      attackSpeed: 12,
    },
    special: 'erratic',
    attackRange: 1,
  },

  skeleton: {
    id: 'skeleton',
    name: '骷髅兵',
    char: 's',
    minFloor: 3,
    maxFloor: 5,
    stats: {
      hp: [25, 3],
      attack: [5, 1],
      defense: [2, 1],
      evasion: 0,
      exp: [10, 2],
      moveSpeed: 8,
      attackSpeed: 9,
    },
    special: 'none',
    attackRange: 1,
  },

  shaman: {
    id: 'shaman',
    name: '哥布林萨满',
    char: 'S',
    minFloor: 3,
    maxFloor: 5,
    stats: {
      hp: [18, 2],
      attack: [3, 1],
      defense: [1, 0],
      evasion: 5,
      exp: [12, 1],
      moveSpeed: 9,
      attackSpeed: 8,
    },
    special: 'heal',
    attackRange: 1,
  },

  dire_wolf: {
    id: 'dire_wolf',
    name: '恐狼',
    char: 'w',
    minFloor: 3,
    maxFloor: 6,
    stats: {
      hp: [30, 4],
      attack: [7, 1],
      defense: [2, 1],
      evasion: 10,
      exp: [20, 2],
      moveSpeed: 12,
      attackSpeed: 11,
    },
    special: 'none',
    attackRange: 1,
  },

  orc: {
    id: 'orc',
    name: '兽人战士',
    char: 'O',
    minFloor: 4,
    maxFloor: 7,
    stats: {
      hp: [40, 5],
      attack: [8, 1],
      defense: [3, 1],
      evasion: 0,
      exp: [25, 2],
      moveSpeed: 7,
      attackSpeed: 8,
    },
    special: 'none',
    attackRange: 1,
  },

  golem: {
    id: 'golem',
    name: '岩石魔像',
    char: 'G',
    minFloor: 5,
    maxFloor: 8,
    stats: {
      hp: [50, 4],
      attack: [6, 1],
      defense: [8, 1],
      evasion: 0,
      exp: [30, 1],
      moveSpeed: 4,
      attackSpeed: 5,
    },
    special: 'none',
    attackRange: 1,
  },

  shadow_stalker: {
    id: 'shadow_stalker',
    name: '暗影潜伏者',
    char: 'h',
    minFloor: 6,
    maxFloor: 9,
    stats: {
      hp: [35, 3],
      attack: [9, 2],
      defense: [2, 1],
      evasion: 40,
      exp: [40, 3],
      moveSpeed: 14,
      attackSpeed: 13,
    },
    special: 'none',
    attackRange: 1,
  },

  fire_imp: {
    id: 'fire_imp',
    name: '火焰小鬼',
    char: 'i',
    minFloor: 4,
    maxFloor: 7,
    stats: {
      hp: [20, 2],
      attack: [10, 2],
      defense: [1, 0],
      evasion: 20,
      exp: [18, 2],
      moveSpeed: 13,
      attackSpeed: 11,
    },
    special: 'none',
    attackRange: 1,
  },

  necromancer: {
    id: 'necromancer',
    name: '死灵法师',
    char: 'N',
    minFloor: 7,
    maxFloor: 10,
    stats: {
      hp: [45, 3],
      attack: [7, 1],
      defense: [3, 1],
      evasion: 10,
      exp: [50, 3],
      moveSpeed: 8,
      attackSpeed: 7,
    },
    special: 'heal',
    attackRange: 1,
  },

  dragon_whelp: {
    id: 'dragon_whelp',
    name: '幼龙',
    char: 'D',
    minFloor: 8,
    maxFloor: 99,
    stats: {
      hp: [80, 5],
      attack: [12, 2],
      defense: [5, 1],
      evasion: 15,
      exp: [80, 5],
      moveSpeed: 10,
      attackSpeed: 10,
    },
    special: 'none',
    attackRange: 1,
  },
};

/**
 * 获取指定层可生成的怪物列表
 * @deprecated Use gameConfig.getAvailableMonsters() instead
 */
export function getAvailableMonsters(floor: number): MonsterDefinition[] {
  return Object.values(MONSTER_DEFINITIONS).filter(
    m => floor >= m.minFloor && floor <= m.maxFloor
  );
}

/**
 * 随机选择一个怪物
 * @deprecated Use gameConfig.getRandomMonster() instead
 */
export function getRandomMonster(floor: number): MonsterDefinition | null {
  const available = getAvailableMonsters(floor);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
