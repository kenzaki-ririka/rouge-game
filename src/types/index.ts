// src/types/index.ts - 游戏类型定义

// ==================== 基础类型 ====================

export interface Position {
  x: number;
  y: number;
}

// ==================== 效果系统 ====================

export interface Effect {
  name: string;
  duration: number;
  attack?: number;
  defense?: number;
  moveSpeed?: number;
  attackSpeed?: number;
}

// ==================== 实体类型 ====================

export interface Entity extends Position {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackSpeed: number;
  evasion: number;
  ap: number;
  effects: Effect[];
  stunned: number;
}

export interface Player extends Entity {
  mp: number;
  maxMp: number;
  torch: number;
  maxTorch: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  critChance: number;
  critDamage: number;
  luck: number;
  hpRegen: number;
  mpRegen: number;
  lifesteal: number;
  thorns: number;
  skillSlots: number;
  skillIds: string[];
  isDashing: boolean;
  arrows: number;
  maxArrows: number;
  relics: OwnedRelic[];
}

// 从relics.ts导入
import type { OwnedRelic } from './relics';

export interface Enemy extends Entity {
  char: string;
  exp: number;
  special: EnemySpecial;
  attackRange: number;
}

export type EnemySpecial = 'none' | 'split' | 'heal' | 'erratic' | 'ranged' | 'ranged_aoe';

// ==================== 物品类型 ====================

export type ItemType = 'portal' | 'gold' | 'potion' | 'oil' | 'arrow';

export interface Item extends Position {
  type: ItemType;
}

// ==================== 地图类型 ====================

export enum TileType {
  WALL = 0,
  FLOOR = 1
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FovTile {
  visible: boolean;
  explored: boolean;
}

// ==================== 技能系统 ====================

export type SkillType = 'damage' | 'heal' | 'buff' | 'control' | 'utility';

export interface SkillDefinition {
  id: string;
  name: string;
  cost: number;
  type: SkillType;
  description: string;
}

export interface Skill extends SkillDefinition {
  effect: SkillEffectFunction;
}

export interface SkillContext {
  player: Player;
  enemies: Enemy[];
  gameMap: TileType[][];
  killEntity: (entity: Player | Enemy) => void;
  addLog: (message: string, type: LogType) => void;
  updateGame: () => void;
  isWalkable: (x: number, y: number) => boolean;
  addGroundEffect: (effect: GroundEffect) => void;
}

export type SkillEffectFunction = (
  caster: Player,
  target: Position | Enemy | null,
  context: SkillContext
) => boolean | 'prompt_direction';

// ==================== 怪物定义 ====================

export interface MonsterStats {
  hp: [number, number];      // [基础值, 每层增量]
  attack: [number, number];
  defense: [number, number];
  evasion: number;
  exp: [number, number];
  moveSpeed: number;
  attackSpeed: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  char: string;
  minFloor: number;
  maxFloor: number;
  stats: MonsterStats;
  special: EnemySpecial;
  attackRange: number;
}

// ==================== 难度系统 ====================

export interface DifficultyMultipliers {
  hp_multiplier: number;
  attack_multiplier: number;
  defense_multiplier: number;
  exp_multiplier: number;
  speed_multiplier: number;
}

// ==================== 商店系统 ====================

export type ShopItemCategory = 'consumable' | 'permanent' | 'special';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  effect: (player: Player) => void;
  canBuy?: (player: Player) => boolean;
}

// ==================== 日志系统 ====================

export type LogType = 'player' | 'enemy' | 'system' | 'item' | 'skill';

export interface LogEntry {
  id: number;
  message: string;
  type: LogType;
  timestamp: number;
}

// ==================== 视觉效果 ====================

export interface VisualEffect {
  type: 'area' | 'projectile' | 'flash';
  tiles: Position[];
  color: string;
  duration: number;
}

export interface GroundEffect {
  tiles: Position[];
  duration: number;
  damage: number;
  effect: (entity: Entity) => void;
  color: string;
  name: string;
}

export interface ArrowProjectile {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timestamp: number;
}

// ==================== 游戏状态 ====================

export type GameScreen =
  | 'start'
  | 'charCreation'
  | 'skillSelection'
  | 'playing'
  | 'levelUp'
  | 'shop'
  | 'gameOver';

export interface GameState {
  screen: GameScreen;
  player: Player | null;
  enemies: Enemy[];
  items: Item[];
  gameMap: TileType[][];
  fovMap: FovTile[][];
  floor: number;
  turnCount: number;
  isPlayerTurn: boolean;
  gameActive: boolean;
  logs: LogEntry[];
  visualEffects: VisualEffect[];
  groundEffects: GroundEffect[];
  arrowProjectile: ArrowProjectile | null;
}

// ==================== 升级选项 ====================

export interface LevelUpOption {
  id: string;
  text: string;
  apply: (player: Player) => void;
}

// ==================== 角色创建 ====================

export interface StatAllocation {
  name: string;
  key: keyof PlayerBaseStats;
  base: number;
  step: number;
  value: number;
}

export interface PlayerBaseStats {
  maxHp: number;
  maxMp: number;
  maxTorch: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
  evasion: number;
  luck: number;
  hpRegen: number;
  mpRegen: number;
  lifesteal: number;
  thorns: number;
  skillSlots: number;
  arrows: number;
  maxArrows: number;
}

// ==================== 事件类型 ====================

export type GameEventType =
  | 'playerMove'
  | 'playerAttack'
  | 'playerSkill'
  | 'enemyTurn'
  | 'entityDeath'
  | 'levelUp'
  | 'floorChange'
  | 'itemPickup'
  | 'shopOpen';

export interface GameEvent {
  type: GameEventType;
  payload?: unknown;
}
