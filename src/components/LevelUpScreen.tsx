// src/components/LevelUpScreen.tsx - 升级选择界面

import React from 'react';
import { LevelUpOption } from '../types';

interface LevelUpScreenProps {
  playerLevel: number;
  options: LevelUpOption[];
  onSelect: (option: LevelUpOption) => void;
}

export const LevelUpScreen: React.FC<LevelUpScreenProps> = ({
  playerLevel,
  options,
  onSelect,
}) => {
  return (
    <div className="modal-overlay">
      <div className="levelup-screen">
        <h2 className="levelup-title">🎉 等级提升！</h2>
        <p className="levelup-level">达到 Lv.{playerLevel}</p>
        <p className="levelup-hint">选择一项强化：</p>
        
        <div className="levelup-options">
          {options.map((option, index) => (
            <button
              key={option.id}
              className="levelup-option"
              onClick={() => onSelect(option)}
            >
              <span className="option-key">{index + 1}</span>
              <span className="option-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
