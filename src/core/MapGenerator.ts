// src/core/MapGenerator.ts - 地图生成系统

import { TileType, Room, Position, FovTile, Item, Enemy, Player } from '../types';
import { 
  MAP_WIDTH, 
  MAP_HEIGHT, 
  MAX_ROOMS, 
  MIN_ROOM_SIZE, 
  MAX_ROOM_SIZE,
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
 * 检查两个房间是否重叠
 */
function roomsIntersect(r1: Room, r2: Room): boolean {
  return (
    r1.x <= r2.x + r2.w + 1 &&
    r1.x + r1.w + 1 >= r2.x &&
    r1.y <= r2.y + r2.h + 1 &&
    r1.y + r1.h + 1 >= r2.y
  );
}

/**
 * 获取房间中心点
 */
function getRoomCenter(room: Room): Position {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

/**
 * 在地图上挖出房间
 */
function carveRoom(map: TileType[][], room: Room): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        map[y][x] = TileType.FLOOR;
      }
    }
  }
}

/**
 * 挖水平走廊
 */
function carveHorizontalTunnel(map: TileType[][], x1: number, x2: number, y: number): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  
  for (let x = startX; x <= endX; x++) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
      map[y][x] = TileType.FLOOR;
    }
  }
}

/**
 * 挖垂直走廊
 */
function carveVerticalTunnel(map: TileType[][], y1: number, y2: number, x: number): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  
  for (let y = startY; y <= endY; y++) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
      map[y][x] = TileType.FLOOR;
    }
  }
}

/**
 * 生成随机地图
 */
export function generateMap(): { map: TileType[][]; rooms: Room[] } {
  const map = createEmptyMap();
  const rooms: Room[] = [];
  
  for (let i = 0; i < MAX_ROOMS; i++) {
    // 随机房间大小
    const w = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
    const h = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
    
    // 随机房间位置
    const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
    
    const newRoom: Room = { x, y, w, h };
    
    // 检查是否与现有房间重叠
    const overlaps = rooms.some(room => roomsIntersect(newRoom, room));
    
    if (!overlaps) {
      carveRoom(map, newRoom);
      
      // 如果不是第一个房间，连接到前一个房间
      if (rooms.length > 0) {
        const prevRoom = rooms[rooms.length - 1];
        const prevCenter = getRoomCenter(prevRoom);
        const newCenter = getRoomCenter(newRoom);
        
        // 随机选择先水平还是先垂直
        if (Math.random() < 0.5) {
          carveHorizontalTunnel(map, prevCenter.x, newCenter.x, prevCenter.y);
          carveVerticalTunnel(map, prevCenter.y, newCenter.y, newCenter.x);
        } else {
          carveVerticalTunnel(map, prevCenter.y, newCenter.y, prevCenter.x);
          carveHorizontalTunnel(map, prevCenter.x, newCenter.x, newCenter.y);
        }
      }
      
      rooms.push(newRoom);
    }
  }
  
  return { map, rooms };
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
export function generateItemType(): 'gold' | 'potion' | 'oil' {
  const roll = Math.random();
  
  if (roll < ITEM_SPAWN_RATES.GOLD) {
    return 'gold';
  } else if (roll < ITEM_SPAWN_RATES.GOLD + ITEM_SPAWN_RATES.OIL) {
    return 'oil';
  } else {
    return 'potion';
  }
}
