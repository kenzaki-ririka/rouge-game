// src/components/StatsPanel.tsx - 角色状态面板

import React from 'react';
import { Player } from '../types';
import { SKILL_LIBRARY } from '../data/skills';
import { getEffectiveAttack, getEffectiveDefense, getEffectiveMoveSpeed, getEffectiveAttackSpeed } from '../core/CombatSystem';

interface StatsPanelProps {
  player: Player;
  floor: number;
}

interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label, colorClass }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;

  return (
    <div className="stat-bar">
      <label className="stat-label">{label}</label>
      <div className="progress-bar-bg">
        <div
          className={`progress-bar ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="stat-value">{current} / {max}</p>
    </div>
  );
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ player }) => {
  const effectiveAttack = getEffectiveAttack(player);
  const effectiveDefense = getEffectiveDefense(player);
  const effectiveMoveSpeed = getEffectiveMoveSpeed(player);
  const effectiveAttackSpeed = getEffectiveAttackSpeed(player);

  return (
    <div className="stats-panel panel">
      <h2 className="panel-title">英雄状态</h2>

      {/* 进度条 */}
      <div className="stat-bars">
        <ProgressBar
          current={player.hp}
          max={player.maxHp}
          label="生命值 (HP)"
          colorClass="hp-bar"
        />
        <ProgressBar
          current={player.mp}
          max={player.maxMp}
          label="魔法值 (MP)"
          colorClass="mp-bar"
        />
        <ProgressBar
          current={player.torch}
          max={player.maxTorch}
          label="火把值"
          colorClass="torch-bar"
        />
        <ProgressBar
          current={player.exp}
          max={player.nextLevelExp}
          label="经验值 (EXP)"
          colorClass="exp-bar"
        />
      </div>

      {/* 属性列表 */}
      <div className="stat-list">
        <div className="stat-row">
          <span>移速:</span>
          <span className="stat-highlight">{effectiveMoveSpeed}</span>
          <span>攻速:</span>
          <span className="stat-highlight">{effectiveAttackSpeed}</span>
        </div>
        <div className="stat-row">
          <span>攻击:</span>
          <span className="stat-highlight">{effectiveAttack}</span>
          <span>防御:</span>
          <span className="stat-highlight">{effectiveDefense}</span>
        </div>
        <div className="stat-row">
          <span>暴击率/伤:</span>
          <span className="stat-highlight">{player.critChance}% / {player.critDamage}%</span>
        </div>
        <div className="stat-row">
          <span>闪避:</span>
          <span className="stat-highlight">{player.evasion}%</span>
          <span>幸运:</span>
          <span className="stat-highlight">{player.luck}</span>
        </div>
        <div className="stat-row">
          <span>吸血:</span>
          <span className="stat-highlight">{player.lifesteal > 0 ? `${(player.lifesteal * 2).toFixed(0)}%` : '0%'}</span>
          <span>反伤:</span>
          <span className="stat-highlight">{player.thorns}</span>
        </div>
        <div className="stat-row">
          <span>HP回复:</span>
          <span className="stat-highlight">{player.hpRegen > 0 ? `${player.hpRegen}/100t` : '无'}</span>
          <span>MP回复:</span>
          <span className="stat-highlight">{player.mpRegen > 0 ? `${player.mpRegen}/100t` : '无'}</span>
        </div>
        <div className="stat-row gold-row">
          <span>💰 金币:</span>
          <span className="gold-value">{player.gold}</span>
        </div>
        <div className="stat-row">
          <span>🏹 箭矢:</span>
          <span className="stat-highlight">{player.arrows} / {player.maxArrows}</span>
        </div>
      </div>

      {/* 技能列表 */}
      <div className="skills-section">
        <h3 className="skills-title">技能 ({player.skillIds.length}/{player.skillSlots})</h3>
        <div className="skills-list">
          {player.skillIds.map((skillId, index) => {
            const skill = SKILL_LIBRARY[skillId];
            if (!skill || index >= player.skillSlots) return null;

            return (
              <div key={skillId} className="skill-item">
                <kbd className="skill-key">{index + 1}</kbd>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-cost">(MP: {skill.cost})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 效果列表 */}
      {player.effects.length > 0 && (
        <div className="effects-section">
          <h3 className="effects-title">当前效果</h3>
          <div className="effects-list">
            {player.effects.map((effect, index) => (
              <div key={index} className="effect-item">
                <span className="effect-name">{effect.name}</span>
                <span className="effect-duration">({effect.duration})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
