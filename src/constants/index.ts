// src/constants/index.ts - 游戏常量

// ==================== 地图设置 ====================

export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 40;
export const TILE_SIZE = 24;

// ==================== 游戏机制 ====================

export const ACTION_COST = 100;
export const FOV_RADIUS = 8;
export const FOG_OF_WAR_ENABLED = true;

// ==================== 房间生成 ====================

export const MAX_ROOMS = 15;
export const MIN_ROOM_SIZE = 4;
export const MAX_ROOM_SIZE = 8;

// ==================== 商店层数 ====================

export const SHOP_FLOORS = [1, 4, 7, 10, 13, 16, 19]; // 可以继续扩展
export const getShopFloors = (maxFloor: number): number[] => {
  const floors: number[] = [];
  for (let i = 1; i <= maxFloor; i += 3) {
    floors.push(i);
  }
  return floors;
};
export const isShopFloor = (floor: number): boolean => {
  return floor === 1 || (floor - 1) % 3 === 0;
};

// ==================== 实体符号 ====================

export const ENTITY_CHARS = {
  PLAYER: '@',
  PORTAL: 'H',
  GOLD: '$',
  POTION: '!',
  OIL: 'o',
  SHOP: '¥',
  ARROW: '↗',
} as const;

// ==================== 颜色主题 ====================

export const COLORS = {
  // 地图
  WALL: '#6b4f3a',
  FLOOR: '#3d2e20',
  FOG: '#000000',

  // 实体
  PLAYER: '#ffc107',
  ENEMY: '#f44336',
  ENEMY_STUNNED: '#ffff00',
  PORTAL: '#9c27b0',
  ITEM: '#03a9f4',
  SHOP: '#4caf50',

  // UI
  HP_BAR: ['#d32f2f', '#f44336'],
  MP_BAR: ['#1976d2', '#2196f3'],
  TORCH_BAR: ['#f57f17', '#ffb300'],
  EXP_BAR: ['#673ab7', '#9575cd'],

  // 日志
  LOG_PLAYER: '#90ee90',
  LOG_ENEMY: '#f08080',
  LOG_SYSTEM: '#add8e6',
  LOG_ITEM: '#ffc107',
  LOG_SKILL: '#da70d6',

  // 效果
  EFFECT_FIRE: 'rgba(255, 100, 0, 0.4)',
  EFFECT_POISON: 'rgba(0, 255, 0, 0.3)',
  EFFECT_ICE: 'rgba(100, 200, 255, 0.4)',

  // 箭矢
  ARROW: '#8bc34a',
  ARROW_LINE: 'rgba(139, 195, 74, 0.8)',
} as const;

// ==================== 升级经验公式 ====================

export const LEVEL_UP_EXP_MULTIPLIER = 1.6;
export const INITIAL_NEXT_LEVEL_EXP = 10;

// ==================== 回复机制 ====================

export const REGEN_TICK_INTERVAL = 100; // 每100 turnCount触发一次回复
export const LEVEL_UP_HEAL_PERCENT = 0.15;

// ==================== 物品效果 ====================

export const ITEM_EFFECTS = {
  GOLD_BASE: 10,
  GOLD_PER_FLOOR: 5,
  POTION_HEAL_PERCENT: 0.2,
  OIL_RESTORE_PERCENT: 0.5,
  ARROW_PICKUP_COUNT: 3,
} as const;

// ==================== 物品生成概率 ====================

export const ITEM_SPAWN_RATES = {
  GOLD: 0.5,
  OIL: 0.2,
  POTION: 0.15,
  ARROW: 0.15,
} as const;

// ==================== 默认玩家属性 ====================

export const DEFAULT_PLAYER_STATS = {
  maxHp: 200,
  maxMp: 30,
  maxTorch: 500,
  attack: 20,
  defense: 0,
  speed: 10,
  critChance: 5,
  critDamage: 200,
  evasion: 5,
  luck: 10,
  hpRegen: 0,
  mpRegen: 0,
  lifesteal: 0,
  thorns: 0,
  skillSlots: 2,
  arrows: 5,
  maxArrows: 20,
} as const;

// ==================== 箭矢设置 ====================

export const ARROW_DAMAGE = 15;
export const ARROW_RANGE = 8;

// ==================== 属性点分配 ====================

export const STAT_ALLOCATION_POINTS = 10;

export const STAT_STEPS: Record<string, number> = {
  maxHp: 20,
  maxMp: 5,
  maxTorch: 20,
  attack: 2,
  defense: 1,
  speed: 1,
  critChance: 1,
  critDamage: 5,
  evasion: 1,
  luck: 1,
  hpRegen: 1,
  mpRegen: 1,
  lifesteal: 1,
  thorns: 2,
  skillSlots: 1,
};

// ==================== 键位映射 ====================

export const KEY_BINDINGS = {
  UP: ['ArrowUp', 'w', 'W', 'k'],
  DOWN: ['ArrowDown', 's', 'S', 'j'],
  LEFT: ['ArrowLeft', 'a', 'A', 'h'],
  RIGHT: ['ArrowRight', 'd', 'D', 'l'],
  SKILL_1: ['1'],
  SKILL_2: ['2'],
  SKILL_3: ['3'],
  SKILL_4: ['4'],
  SKILL_5: ['5'],
  SKILL_6: ['6'],
  SKILL_7: ['7'],
  SKILL_8: ['8'],
  SKILL_9: ['9'],
  WAIT: ['.', 'Space'],
  SHOP: ['b', 'B'],
} as const;
