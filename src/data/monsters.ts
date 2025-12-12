// src/data/monsters.ts - 怪物定义数据

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
      speed: 10,
    },
    special: 'none',
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
      speed: 5,
    },
    special: 'split',
  },
  
  mini_slime: {
    id: 'mini_slime',
    name: '小黏液怪',
    char: 'm',
    minFloor: 99, // 不会自然生成
    maxFloor: 99,
    stats: {
      hp: [5, 0],
      attack: [2, 0],
      defense: [0, 0],
      evasion: 0,
      exp: [1, 0],
      speed: 8,
    },
    special: 'none',
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
      speed: 15,
    },
    special: 'erratic',
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
      speed: 8,
    },
    special: 'none',
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
      speed: 9,
    },
    special: 'heal',
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
      speed: 12,
    },
    special: 'none',
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
      speed: 7,
    },
    special: 'none',
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
      speed: 4,
    },
    special: 'none',
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
      speed: 14,
    },
    special: 'none',
  },
  
  // 新增怪物
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
      speed: 13,
    },
    special: 'none',
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
      speed: 8,
    },
    special: 'heal', // 可以复活/治疗
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
      speed: 10,
    },
    special: 'none',
  },
};

/**
 * 获取指定层可生成的怪物列表
 */
export function getAvailableMonsters(floor: number): MonsterDefinition[] {
  return Object.values(MONSTER_DEFINITIONS).filter(
    m => floor >= m.minFloor && floor <= m.maxFloor
  );
}

/**
 * 随机选择一个怪物
 */
export function getRandomMonster(floor: number): MonsterDefinition | null {
  const available = getAvailableMonsters(floor);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
