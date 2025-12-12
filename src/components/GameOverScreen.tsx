// src/components/GameOverScreen.tsx - 游戏结束界面

import React from 'react';
import { Player } from '../types';

interface GameOverScreenProps {
  player: Player | null;
  floor: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  player,
  floor,
  onRestart,
}) => {
  return (
    <div className="modal-overlay gameover-overlay">
      <div className="gameover-screen">
        <h2 className="gameover-title">💀 你死了</h2>
        
        <div className="gameover-stats">
          <p className="stat-line">
            <span>英雄:</span>
            <span>{player?.name || '无名英雄'}</span>
          </p>
          <p className="stat-line">
            <span>达到层数:</span>
            <span className="highlight">{floor}</span>
          </p>
          <p className="stat-line">
            <span>最终等级:</span>
            <span className="highlight">{player?.level || 1}</span>
          </p>
          <p className="stat-line">
            <span>累计金币:</span>
            <span className="gold">{player?.gold || 0}</span>
          </p>
        </div>
        
        <div className="gameover-message">
          <p>黑暗吞噬了一切...</p>
          <p>但地城依然在等待新的冒险者。</p>
        </div>
        
        <button className="btn-primary btn-restart" onClick={onRestart}>
          再次挑战
        </button>
      </div>
    </div>
  );
};
