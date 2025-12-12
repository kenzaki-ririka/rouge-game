// src/core/EntityManager.ts - 实体创建和管理

import {
  Player,
  Enemy,
  Item,
  TileType,
  Room,
  PlayerBaseStats,
  DifficultyMultipliers,
} from '../types';
import {
  DEFAULT_PLAYER_STATS,
  ITEM_EFFECTS,
} from '../constants';
import { MONSTER_DEFINITIONS, getRandomMonster } from '../data/monsters';
import { DEFAULT_DIFFICULTY } from '../data/difficulty';
import {
  getRandomPositionInRoom,
  isWalkable,
  isPositionEmpty,
  generateItemType,
} from './MapGenerator';

// ==================== 玩家创建 ====================

/**
 * 创建新玩家
 */
export function createPlayer(
  name: string,
  stats: Partial<PlayerBaseStats>,
  skillIds: string[],
  x: number = 0,
  y: number = 0
): Player {
  const baseStats = { ...DEFAULT_PLAYER_STATS, ...stats };

  return {
    name: name || '英雄',
    x,
    y,
    hp: baseStats.maxHp,
    maxHp: baseStats.maxHp,
    mp: baseStats.maxMp,
    maxMp: baseStats.maxMp,
    torch: baseStats.maxTorch,
    maxTorch: baseStats.maxTorch,
    attack: baseStats.attack,
    defense: baseStats.defense,
    speed: baseStats.speed,
    evasion: baseStats.evasion,
    critChance: baseStats.critChance,
    critDamage: baseStats.critDamage,
    luck: baseStats.luck,
    hpRegen: baseStats.hpRegen,
    mpRegen: baseStats.mpRegen,
    lifesteal: baseStats.lifesteal,
    thorns: baseStats.thorns,
    skillSlots: baseStats.skillSlots,
    skillIds,
    level: 1,
    exp: 0,
    nextLevelExp: 10,
    gold: 0,
    ap: 0,
    effects: [],
    stunned: 0,
    isDashing: false,
    arrows: baseStats.arrows,
    maxArrows: baseStats.maxArrows,
  };
}

// ==================== 敌人创建 ====================

/**
 * 创建敌人
 */
export function createEnemy(
  x: number,
  y: number,
  floor: number,
  typeId?: string,
  difficulty: DifficultyMultipliers = DEFAULT_DIFFICULTY
): Enemy | null {
  const definition = typeId
    ? MONSTER_DEFINITIONS[typeId]
    : getRandomMonster(floor);

  if (!definition) return null;

  const stats = definition.stats;

  // 计算属性值
  const hp = Math.floor(
    (stats.hp[0] + floor * stats.hp[1]) * difficulty.hp_multiplier
  );
  const attack = Math.floor(
    (stats.attack[0] + floor * stats.attack[1]) * difficulty.attack_multiplier
  );
  const defense = Math.floor(
    (stats.defense[0] + floor * stats.defense[1]) * difficulty.defense_multiplier
  );
  const exp = Math.floor(
    (stats.exp[0] + floor * stats.exp[1]) * difficulty.exp_multiplier
  );
  const speed = Math.floor(stats.speed * difficulty.speed_multiplier);

  return {
    name: definition.name,
    char: definition.char,
    x,
    y,
    hp,
    maxHp: hp,
    attack,
    defense,
    speed,
    evasion: stats.evasion,
    exp,
    special: definition.special,
    ap: 0,
    effects: [],
    stunned: 0,
  };
}

// ==================== 物品创建 ====================

/**
 * 创建物品
 */
export function createItem(x: number, y: number, type: Item['type']): Item {
  return { x, y, type };
}

// ==================== 关卡实体放置 ====================

/**
 * 放置所有实体到新关卡
 */
export function placeEntities(
  rooms: Room[],
  map: TileType[][],
  floor: number,
  playerLuck: number,
  difficulty: DifficultyMultipliers = DEFAULT_DIFFICULTY
): {
  playerStart: { x: number; y: number };
  enemies: Enemy[];
  items: Item[];
} {
  const enemies: Enemy[] = [];
  const items: Item[] = [];

  if (rooms.length === 0) {
    return { playerStart: { x: 1, y: 1 }, enemies, items };
  }

  // 玩家起始位置：第一个房间中心
  const firstRoom = rooms[0];
  const playerStart = {
    x: Math.floor(firstRoom.x + firstRoom.w / 2),
    y: Math.floor(firstRoom.y + firstRoom.h / 2),
  };

  // 创建临时玩家对象用于位置检测
  const tempPlayer: Player = {
    ...createPlayer('temp', {}, []),
    x: playerStart.x,
    y: playerStart.y,
  };

  // 传送门：最后一个房间中心
  const lastRoom = rooms[rooms.length - 1];
  const portalPos = {
    x: Math.floor(lastRoom.x + lastRoom.w / 2),
    y: Math.floor(lastRoom.y + lastRoom.h / 2),
  };
  items.push(createItem(portalPos.x, portalPos.y, 'portal'));

  // 在中间房间放置敌人和物品
  for (let i = 1; i < rooms.length - 1; i++) {
    const room = rooms[i];

    // 敌人数量大幅增加（更高密度）
    const numEnemies = Math.floor(Math.random() * (floor + 4)) + 3;

    for (let j = 0; j < numEnemies; j++) {
      const pos = getRandomPositionInRoom(room, map, tempPlayer, enemies, items);
      if (pos) {
        const enemy = createEnemy(pos.x, pos.y, floor, undefined, difficulty);
        if (enemy) {
          enemies.push(enemy);
        }
      }
    }

    // 物品数量受幸运影响
    const numItems = Math.floor(Math.random() * (2 + playerLuck / 10));

    for (let j = 0; j < numItems; j++) {
      const pos = getRandomPositionInRoom(room, map, tempPlayer, enemies, items);
      if (pos) {
        const itemType = generateItemType();
        items.push(createItem(pos.x, pos.y, itemType));
      }
    }
  }

  return { playerStart, enemies, items };
}

// ==================== 物品效果 ====================

/**
 * 处理物品拾取
 */
export function handleItemPickup(
  player: Player,
  item: Item,
  floor: number
): { consumed: boolean; message: string } {
  switch (item.type) {
    case 'gold': {
      const goldAmount = ITEM_EFFECTS.GOLD_BASE + floor * ITEM_EFFECTS.GOLD_PER_FLOOR;
      player.gold += goldAmount;
      return { consumed: true, message: `你捡到了 ${goldAmount} 枚金币。` };
    }

    case 'potion': {
      const healAmount = Math.floor(player.maxHp * ITEM_EFFECTS.POTION_HEAL_PERCENT);
      const actualHeal = Math.min(healAmount, player.maxHp - player.hp);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      return { consumed: true, message: `你喝下治疗药水，恢复了 ${actualHeal} 点生命。` };
    }

    case 'oil': {
      const torchAmount = Math.floor(player.maxTorch * ITEM_EFFECTS.OIL_RESTORE_PERCENT);
      const actualRestore = Math.min(torchAmount, player.maxTorch - player.torch);
      player.torch = Math.min(player.maxTorch, player.torch + torchAmount);
      return { consumed: true, message: `你补充了灯油，火把恢复了 ${actualRestore} 点。` };
    }

    case 'arrow': {
      const arrowAmount = ITEM_EFFECTS.ARROW_PICKUP_COUNT;
      const actualPickup = Math.min(arrowAmount, player.maxArrows - player.arrows);
      if (actualPickup > 0) {
        player.arrows = Math.min(player.maxArrows, player.arrows + arrowAmount);
        return { consumed: true, message: `你捡到了 ${actualPickup} 支箭矢。` };
      }
      return { consumed: false, message: '箭矢已满，无法拾取。' };
    }

    case 'portal':
      return { consumed: false, message: '传送门...' };

    default:
      return { consumed: false, message: '' };
  }
}

// ==================== 升级系统 ====================

/**
 * 检查是否可以升级
 */
export function canLevelUp(player: Player): boolean {
  return player.exp >= player.nextLevelExp;
}

/**
 * 执行升级
 */
export function performLevelUp(player: Player): void {
  player.level++;
  player.exp -= player.nextLevelExp;
  player.nextLevelExp = Math.floor(player.nextLevelExp * 1.6);

  // 恢复15%生命
  const healAmount = Math.floor(player.maxHp * 0.15);
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
}

/**
 * 获取升级选项
 */
export function getLevelUpOptions(): Array<{
  id: string;
  text: string;
  apply: (player: Player) => void;
}> {
  const allOptions = [
    { id: 'maxHp', text: '最大生命 +20', apply: (p: Player) => { p.maxHp += 20; } },
    { id: 'hpRegen', text: '生命回复 +1', apply: (p: Player) => { p.hpRegen += 1; } },
    { id: 'defense', text: '防御 +1', apply: (p: Player) => { p.defense += 1; } },
    { id: 'attack', text: '攻击 +2', apply: (p: Player) => { p.attack += 2; } },
    { id: 'speed', text: '速度 +1', apply: (p: Player) => { p.speed += 1; } },
    { id: 'critChance', text: '暴击率 +1%', apply: (p: Player) => { p.critChance += 1; } },
    { id: 'critDamage', text: '暴击伤害 +5%', apply: (p: Player) => { p.critDamage += 5; } },
    { id: 'evasion', text: '闪避 +1%', apply: (p: Player) => { p.evasion += 1; } },
    { id: 'maxMp', text: '最大魔法 +5', apply: (p: Player) => { p.maxMp += 5; } },
    { id: 'mpRegen', text: '魔法回复 +1', apply: (p: Player) => { p.mpRegen += 1; } },
    { id: 'skillSlots', text: '技能栏位 +1', apply: (p: Player) => { p.skillSlots += 1; } },
    { id: 'luck', text: '幸运 +1', apply: (p: Player) => { p.luck += 1; } },
    { id: 'lifesteal', text: '吸血 +1', apply: (p: Player) => { p.lifesteal += 1; } },
    { id: 'thorns', text: '反伤 +2', apply: (p: Player) => { p.thorns += 2; } },
    { id: 'maxTorch', text: '最大火把 +20', apply: (p: Player) => { p.maxTorch += 20; } },
  ];

  // 随机选择5个选项
  const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

// ==================== 分裂怪物 ====================

/**
 * 处理怪物分裂
 */
export function handleMonsterSplit(
  enemy: Enemy,
  map: TileType[][],
  player: Player,
  enemies: Enemy[],
  items: Item[],
  floor: number,
  difficulty: DifficultyMultipliers
): Enemy[] {
  if (enemy.special !== 'split') return [];
  if (Math.random() >= 0.5) return []; // 50%概率分裂

  const newEnemies: Enemy[] = [];

  // 尝试在周围生成2个小黏液怪
  for (let i = 0; i < 2; i++) {
    // 获取相邻空位
    const directions = [
      [0, -1], [0, 1], [-1, 0], [1, 0],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    // 随机打乱方向
    for (let j = directions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [directions[j], directions[k]] = [directions[k], directions[j]];
    }

    for (const [dx, dy] of directions) {
      const newX = enemy.x + dx;
      const newY = enemy.y + dy;

      if (
        isWalkable(map, newX, newY) &&
        isPositionEmpty(newX, newY, player, [...enemies, ...newEnemies], items)
      ) {
        const miniSlime = createEnemy(newX, newY, floor, 'mini_slime', difficulty);
        if (miniSlime) {
          newEnemies.push(miniSlime);
          break;
        }
      }
    }
  }

  return newEnemies;
}
