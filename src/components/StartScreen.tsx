// src/components/StartScreen.tsx - 开始画面

import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="modal-overlay">
      <div className="start-screen">
        <h1 className="game-title">地城幽光</h1>
        <h2 className="game-subtitle">HERO AWAKENING</h2>
        
        <p className="game-intro">
          你在一座死寂的古代地城深处醒来，失去了所有记忆。
          周围只有冰冷的石壁和远处传来的未知嘶吼。
          你的唯一本能是：探索、战斗、活下去。
          拿起你手边的武器，揭开这个地方的秘密，找回你自己。
        </p>
        
        <button className="btn-primary btn-start" onClick={onStart}>
          开始冒险
        </button>
        
        <div className="controls-hint">
          <h3>操作说明</h3>
          <div className="controls-grid">
            <div><kbd>↑↓←→</kbd> 或 <kbd>WASD</kbd> 移动/攻击</div>
            <div><kbd>1-9</kbd> 使用技能</div>
            <div><kbd>B</kbd> 打开商店</div>
            <div><kbd>.</kbd> 或 <kbd>空格</kbd> 等待</div>
          </div>
        </div>
      </div>
    </div>
  );
};
