// src/core/MapGenerator.ts - 地图生成系统

import { TileType, Room, Position, FovTile, Item, Enemy, Player } from '../types';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  FOV_RADIUS,
  ITEM_SPAWN_RATES,
} from '../constants';

/**
 * 创建空地图（全部是墙）
 */
export function createEmptyMap(): TileType[][] {
  return Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TileType.WALL)
  );
}

/**
 * 创建全地板地图
 */
function createFloorMap(): TileType[][] {
  return Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TileType.FLOOR)
  );
}

/**
 * 添加边界墙
 */
function addBorderWalls(map: TileType[][]): void {
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[0][x] = TileType.WALL;
    map[MAP_HEIGHT - 1][x] = TileType.WALL;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y][0] = TileType.WALL;
    map[y][MAP_WIDTH - 1] = TileType.WALL;
  }
}

/**
 * 添加随机柱子（单格墙体）
 */
function addRandomPillars(map: TileType[][], count: number): void {
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 10;

  while (placed < count && attempts < maxAttempts) {
    attempts++;
    const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;

    // 确保周围不会完全被阻挡
    if (map[y][x] === TileType.FLOOR) {
      // 检查周围8格是否至少有6格是地板
      let floorCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (map[y + dy]?.[x + dx] === TileType.FLOOR) floorCount++;
        }
      }

      if (floorCount >= 6) {
        map[y][x] = TileType.WALL;
        placed++;
      }
    }
  }
}

/**
 * 添加随机断墙（3-6格的墙体段）
 */
function addRandomWallSegments(map: TileType[][], count: number): void {
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 20;

  while (placed < count && attempts < maxAttempts) {
    attempts++;

    const isHorizontal = Math.random() < 0.5;
    const length = Math.floor(Math.random() * 4) + 3; // 3-6格

    const x = Math.floor(Math.random() * (MAP_WIDTH - length - 4)) + 2;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - length - 4)) + 2;

    // 检查这段墙是否可以放置
    let canPlace = true;
    const wallTiles: Position[] = [];

    for (let i = 0; i < length; i++) {
      const wx = isHorizontal ? x + i : x;
      const wy = isHorizontal ? y : y + i;

      if (map[wy]?.[wx] !== TileType.FLOOR) {
        canPlace = false;
        break;
      }

      // 检查不要离边界太近
      if (wx < 2 || wx >= MAP_WIDTH - 2 || wy < 2 || wy >= MAP_HEIGHT - 2) {
        canPlace = false;
        break;
      }

      wallTiles.push({ x: wx, y: wy });
    }

    if (canPlace && wallTiles.length === length) {
      // 放置墙体段
      wallTiles.forEach(tile => {
        map[tile.y][tile.x] = TileType.WALL;
      });
      placed++;
    }
  }
}

/**
 * 使用泛洪填充检查连通性
 */
function isMapConnected(map: TileType[][]): { connected: boolean; floorTiles: Position[] } {
  const visited: boolean[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  );

  // 找到第一个地板格子作为起点
  let startPos: Position | null = null;
  const allFloors: Position[] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x] === TileType.FLOOR) {
        allFloors.push({ x, y });
        if (!startPos) startPos = { x, y };
      }
    }
  }

  if (!startPos) return { connected: true, floorTiles: [] };

  // BFS泛洪填充
  const queue: Position[] = [startPos];
  let reachableCount = 0;

  while (queue.length > 0) {
    const pos = queue.shift()!;

    if (visited[pos.y][pos.x]) continue;
    visited[pos.y][pos.x] = true;
    reachableCount++;

    // 检查四个方向
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;

      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
        !visited[ny][nx] && map[ny][nx] === TileType.FLOOR) {
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return {
    connected: reachableCount === allFloors.length,
    floorTiles: allFloors
  };
}

/**
 * 生成开放式地图（四通八达，带障碍物）
 */
export function generateOpenMap(): { map: TileType[][]; rooms: Room[] } {
  let map: TileType[][];
  let attempts = 0;
  const maxAttempts = 10;

  do {
    attempts++;
    map = createFloorMap();
    addBorderWalls(map);

    // 添加障碍物（根据尝试次数适当减少）
    const pillarCount = Math.max(20, 40 - attempts * 2);
    const segmentCount = Math.max(8, 15 - attempts);

    addRandomWallSegments(map, segmentCount);
    addRandomPillars(map, pillarCount);

  } while (!isMapConnected(map).connected && attempts < maxAttempts);

  // 创建虚拟房间用于兼容现有系统
  // 第一个房间在左上角，最后一个在右下角
  const rooms: Room[] = [
    { x: 3, y: 3, w: 6, h: 6 },  // 起始区域
    { x: MAP_WIDTH - 10, y: MAP_HEIGHT - 10, w: 6, h: 6 },  // 结束区域
  ];

  // 添加一些中间区域作为敌人生成点
  const midRooms = [
    { x: Math.floor(MAP_WIDTH / 2) - 3, y: Math.floor(MAP_HEIGHT / 2) - 3, w: 6, h: 6 },
    { x: MAP_WIDTH - 15, y: 5, w: 6, h: 6 },
    { x: 5, y: MAP_HEIGHT - 12, w: 6, h: 6 },
    { x: Math.floor(MAP_WIDTH / 3), y: Math.floor(MAP_HEIGHT / 3), w: 5, h: 5 },
    { x: Math.floor(MAP_WIDTH * 2 / 3), y: Math.floor(MAP_HEIGHT * 2 / 3), w: 5, h: 5 },
  ];

  // 将中间区域插入到第一个和最后一个之间
  rooms.splice(1, 0, ...midRooms);

  return { map, rooms };
}

/**
 * 生成随机地图（现在使用开放式地图）
 */
export function generateMap(): { map: TileType[][]; rooms: Room[] } {
  return generateOpenMap();
}


/**
 * 检查位置是否可行走
 */
export function isWalkable(map: TileType[][], x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return false;
  }
  return map[y][x] === TileType.FLOOR;
}

/**
 * 检查位置是否为空（没有玩家、敌人、物品）
 */
export function isPositionEmpty(
  x: number,
  y: number,
  player: Player | null,
  enemies: Enemy[],
  items: Item[]
): boolean {
  if (player && player.x === x && player.y === y) return false;
  if (enemies.some(e => e.x === x && e.y === y)) return false;
  if (items.some(i => i.x === x && i.y === y)) return false;
  return true;
}

/**
 * 在房间内获取随机可用位置
 */
export function getRandomPositionInRoom(
  room: Room,
  map: TileType[][],
  player: Player | null,
  enemies: Enemy[],
  items: Item[]
): Position | null {
  const attempts = 20;

  for (let i = 0; i < attempts; i++) {
    const x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
    const y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;

    if (isWalkable(map, x, y) && isPositionEmpty(x, y, player, enemies, items)) {
      return { x, y };
    }
  }

  return null;
}

/**
 * 获取相邻可用位置（用于分裂怪物等）
 */
export function getAdjacentEmptyPosition(
  x: number,
  y: number,
  map: TileType[][],
  player: Player | null,
  enemies: Enemy[],
  items: Item[]
): Position | null {
  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

  // 随机打乱方向
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }

  for (const [dx, dy] of directions) {
    const newX = x + dx;
    const newY = y + dy;

    if (isWalkable(map, newX, newY) && isPositionEmpty(newX, newY, player, enemies, items)) {
      return { x: newX, y: newY };
    }
  }

  return null;
}

// ==================== 视野系统 ====================

/**
 * 初始化视野地图
 */
export function createFovMap(): FovTile[][] {
  return Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => ({
      visible: false,
      explored: false,
    }))
  );
}

/**
 * 计算视野（射线投射法）
 */
export function computeFov(
  map: TileType[][],
  fovMap: FovTile[][],
  playerX: number,
  playerY: number,
  radius: number = FOV_RADIUS
): void {
  // 重置所有可见性
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      fovMap[y][x] = { ...fovMap[y][x], visible: false };
    }
  }

  // 360度射线投射
  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    castRay(map, fovMap, playerX, playerY, dx, dy, radius);
  }
}

/**
 * 投射单条射线
 */
function castRay(
  map: TileType[][],
  fovMap: FovTile[][],
  startX: number,
  startY: number,
  dx: number,
  dy: number,
  maxDistance: number
): void {
  for (let d = 0; d <= maxDistance; d++) {
    const x = Math.round(startX + dx * d);
    const y = Math.round(startY + dy * d);

    // 越界检查
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return;
    }

    // 标记为可见和已探索
    fovMap[y][x] = { visible: true, explored: true };

    // 如果遇到墙壁，停止射线
    if (map[y][x] === TileType.WALL) {
      return;
    }
  }
}

/**
 * 生成物品类型
 */
export function generateItemType(): 'gold' | 'potion' | 'oil' | 'arrow' {
  const roll = Math.random();

  if (roll < ITEM_SPAWN_RATES.GOLD) {
    return 'gold';
  } else if (roll < ITEM_SPAWN_RATES.GOLD + ITEM_SPAWN_RATES.OIL) {
    return 'oil';
  } else if (roll < ITEM_SPAWN_RATES.GOLD + ITEM_SPAWN_RATES.OIL + ITEM_SPAWN_RATES.POTION) {
    return 'potion';
  } else {
    return 'arrow';
  }
}
