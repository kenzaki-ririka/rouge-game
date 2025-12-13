// src/components/CharCreation.tsx - 角色创建界面

import React, { useState, useCallback } from 'react';
import { PlayerBaseStats } from '../types';
import { gameConfig } from '../config/ConfigManager';

interface CharCreationProps {
  onConfirm: (name: string, stats: Partial<PlayerBaseStats>) => void;
}

const STAT_CONFIGS: Array<{
  key: keyof PlayerBaseStats;
  name: string;
}> = [
    { key: 'maxHp', name: '生命' },
    { key: 'defense', name: '防御' },
    { key: 'attack', name: '攻击' },
    { key: 'moveSpeed', name: '移动速度' },
    { key: 'attackSpeed', name: '攻击速度' },
    { key: 'critChance', name: '暴击率' },
    { key: 'critDamage', name: '暴击伤害' },
    { key: 'evasion', name: '闪避' },
    { key: 'maxMp', name: '魔法' },
    { key: 'luck', name: '幸运' },
    { key: 'maxTorch', name: '火把' },
    { key: 'hpRegen', name: '生命回复' },
    { key: 'mpRegen', name: '魔法回复' },
    { key: 'lifesteal', name: '吸血' },
    { key: 'thorns', name: '反伤' },
    { key: 'skillSlots', name: '技能数' },
  ];

export const CharCreation: React.FC<CharCreationProps> = ({ onConfirm }) => {
  const defaults = gameConfig.getPlayerDefaults();
  const statSteps = gameConfig.getStatSteps();
  const allocationPoints = gameConfig.getStatAllocationPoints();

  const [name, setName] = useState('英雄');
  const [points, setPoints] = useState(allocationPoints);
  const [stats, setStats] = useState<Record<keyof PlayerBaseStats, number>>(() => {
    const initial: Record<string, number> = {};
    STAT_CONFIGS.forEach(({ key }) => {
      initial[key] = (defaults as Record<string, number>)[key] ?? 0;
    });
    return initial as Record<keyof PlayerBaseStats, number>;
  });

  const handleIncrease = useCallback((key: keyof PlayerBaseStats) => {
    if (points <= 0) return;

    const step = statSteps[key] || 1;
    setStats(prev => ({ ...prev, [key]: prev[key] + step }));
    setPoints(prev => prev - 1);
  }, [points, statSteps]);

  const handleDecrease = useCallback((key: keyof PlayerBaseStats) => {
    const baseValue = (defaults as Record<string, number>)[key] ?? 0;
    if (stats[key] <= baseValue) return;

    const step = statSteps[key] || 1;
    setStats(prev => ({ ...prev, [key]: prev[key] - step }));
    setPoints(prev => prev + 1);
  }, [stats, defaults, statSteps]);

  const handleRandomize = useCallback(() => {
    // 重置到基础值
    const newStats: Record<string, number> = {};
    STAT_CONFIGS.forEach(({ key }) => {
      newStats[key] = (defaults as Record<string, number>)[key] ?? 0;
    });

    // 随机分配点数
    let remaining = allocationPoints;
    while (remaining > 0) {
      const randomConfig = STAT_CONFIGS[Math.floor(Math.random() * STAT_CONFIGS.length)];
      const step = statSteps[randomConfig.key] || 1;
      newStats[randomConfig.key] += step;
      remaining--;
    }

    setStats(newStats as Record<keyof PlayerBaseStats, number>);
    setPoints(0);
  }, [defaults, allocationPoints, statSteps]);

  const handleConfirm = useCallback(() => {
    onConfirm(name, stats);
  }, [name, stats, onConfirm]);

  return (
    <div className="modal-overlay">
      <div className="char-creation-screen">
        <h2 className="screen-title">创建你的英雄</h2>

        <div className="creation-form">
          {/* 名称输入 */}
          <div className="name-input-group">
            <label htmlFor="hero-name">英雄之名</label>
            <input
              id="hero-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入你的名字..."
              className="name-input"
            />
          </div>

          {/* 点数显示 */}
          <div className="points-header">
            <p>
              你拥有 <span className="points-value">{points}</span> 个属性点
            </p>
            <button className="btn-secondary" onClick={handleRandomize}>
              随机分配
            </button>
          </div>

          {/* 属性分配 */}
          <div className="stats-allocation">
            {STAT_CONFIGS.map(({ key, name: statName }) => (
              <div key={key} className="stat-alloc-row">
                <span className="stat-name">{statName}</span>
                <div className="stat-controls">
                  <button
                    className="btn-stat"
                    onClick={() => handleDecrease(key)}
                    disabled={stats[key] <= ((defaults as Record<string, number>)[key] ?? 0)}
                  >
                    −
                  </button>
                  <span className="stat-value">{stats[key]}</span>
                  <button
                    className="btn-stat"
                    onClick={() => handleIncrease(key)}
                    disabled={points <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn-primary btn-confirm"
          onClick={handleConfirm}
          disabled={points > 0}
        >
          选择技能
        </button>

        {points > 0 && (
          <p className="hint-text">请分配完所有属性点</p>
        )}
      </div>
    </div>
  );
};
