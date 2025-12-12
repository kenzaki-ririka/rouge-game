// src/data/difficulty.ts - 难度设置

import { DifficultyMultipliers } from '../types';

export const DEFAULT_DIFFICULTY: DifficultyMultipliers = {
  hp_multiplier: 1.0,
  attack_multiplier: 1.0,
  defense_multiplier: 1.0,
  exp_multiplier: 1.0,
  speed_multiplier: 1.0,
};

// 未来可扩展的难度预设
export const DIFFICULTY_PRESETS: Record<string, DifficultyMultipliers> = {
  easy: {
    hp_multiplier: 0.8,
    attack_multiplier: 0.8,
    defense_multiplier: 0.8,
    exp_multiplier: 1.2,
    speed_multiplier: 0.9,
  },
  normal: DEFAULT_DIFFICULTY,
  hard: {
    hp_multiplier: 1.3,
    attack_multiplier: 1.2,
    defense_multiplier: 1.2,
    exp_multiplier: 0.9,
    speed_multiplier: 1.1,
  },
  nightmare: {
    hp_multiplier: 1.6,
    attack_multiplier: 1.4,
    defense_multiplier: 1.4,
    exp_multiplier: 0.8,
    speed_multiplier: 1.2,
  },
};
