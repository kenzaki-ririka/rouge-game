// src/App.tsx - 主应用组件

import { useState, useCallback } from 'react';
import { useGame } from './hooks/useGame';
import { PlayerBaseStats, Enemy } from './types';

// 组件导入
import { StartScreen } from './components/StartScreen';
import { CharCreation } from './components/CharCreation';
import { SkillSelection } from './components/SkillSelection';
import { GameCanvas } from './components/GameCanvas';
import { StatsPanel } from './components/StatsPanel';
import { LogPanel } from './components/LogPanel';
import { LevelUpScreen } from './components/LevelUpScreen';
import { ShopScreen } from './components/ShopScreen';
import { GameOverScreen } from './components/GameOverScreen';

// 样式
import './styles/main.css';

function App() {
  const {
    state,
    setScreen,
    startGame,
    selectLevelUpOption,
    selectSkills,
    purchaseItem,
    closeShop,
    shootArrow,
    levelUpOptions,
    shopItems,
    pendingSkillSelection,
  } = useGame();

  // 临时保存角色创建数据
  const [charData, setCharData] = useState<{
    name: string;
    stats: Partial<PlayerBaseStats>;
  } | null>(null);

  // 敌人信息提示
  const [hoveredEnemy, setHoveredEnemy] = useState<{
    enemy: Enemy;
    x: number;
    y: number;
  } | null>(null);

  // 开始按钮 -> 进入角色创建
  const handleStartClick = useCallback(() => {
    setScreen('charCreation');
  }, [setScreen]);

  // 角色创建完成 -> 进入技能选择
  const handleCharConfirm = useCallback((name: string, stats: Partial<PlayerBaseStats>) => {
    setCharData({ name, stats });
    setScreen('skillSelection');
  }, [setScreen]);

  // 技能选择完成 -> 开始游戏
  const handleSkillConfirm = useCallback((skillIds: string[]) => {
    if (pendingSkillSelection) {
      // 这是升级或商店触发的技能选择
      selectSkills(skillIds);
    } else if (charData) {
      // 这是初始角色创建
      startGame(charData.name, charData.stats, skillIds);
      setCharData(null);
    }
  }, [charData, startGame, pendingSkillSelection, selectSkills]);

  // 重新开始游戏
  const handleRestart = useCallback(() => {
    setScreen('start');
  }, [setScreen]);

  // 敌人悬停处理
  const handleEnemyHover = useCallback((enemy: Enemy | null, x: number, y: number) => {
    if (enemy) {
      setHoveredEnemy({ enemy, x, y });
    } else {
      setHoveredEnemy(null);
    }
  }, []);

  // 根据当前屏幕渲染内容
  const renderScreen = () => {
    switch (state.screen) {
      case 'start':
        return <StartScreen onStart={handleStartClick} />;

      case 'charCreation':
        return <CharCreation onConfirm={handleCharConfirm} />;

      case 'skillSelection':
        return (
          <SkillSelection
            maxSlots={pendingSkillSelection?.count || charData?.stats?.skillSlots || 2}
            currentSkills={pendingSkillSelection ? [] : undefined}
            onConfirm={handleSkillConfirm}
          />
        );

      case 'levelUp':
        return state.player && (
          <LevelUpScreen
            playerLevel={state.player.level}
            options={levelUpOptions}
            onSelect={selectLevelUpOption}
          />
        );

      case 'shop':
        return state.player && (
          <ShopScreen
            player={state.player}
            items={shopItems}
            onPurchase={purchaseItem}
            onClose={closeShop}
          />
        );

      case 'gameOver':
        return (
          <GameOverScreen
            player={state.player}
            floor={state.floor}
            onRestart={handleRestart}
          />
        );

      default:
        return null;
    }
  };

  // 游戏主界面（playing状态时显示）
  const renderGameUI = () => {
    if (!state.player || state.screen === 'start' || state.screen === 'charCreation') {
      return null;
    }

    return (
      <div className="game-layout">
        {/* 顶部栏 */}
        <header className="game-header">
          <h1 className="header-title">地城幽光</h1>
          <div className="header-info">
            <span className="floor-info">🏰 第 {state.floor} 层</span>
            <span className="turn-info">回合: {state.turnCount}</span>
          </div>
        </header>

        {/* 主要内容区 */}
        <main className="game-main">
          {/* 左侧状态面板 */}
          <aside className="left-panel">
            <StatsPanel player={state.player} floor={state.floor} />
          </aside>

          {/* 中间游戏画布 */}
          <section className="center-panel">
            <GameCanvas
              state={state}
              onEnemyHover={handleEnemyHover}
              onRightClick={shootArrow}
            />
          </section>

          {/* 右侧（预留给Live2D） */}
          <aside className="right-panel">
            <div className="portrait-placeholder">
              <div className="portrait-frame">
                <span className="portrait-text">Live2D</span>
                <span className="portrait-hint">角色立绘区域</span>
              </div>
            </div>
          </aside>
        </main>

        {/* 底部日志 */}
        <footer className="game-footer">
          <LogPanel logs={state.logs} />
        </footer>

        {/* 敌人信息提示 */}
        {hoveredEnemy && (
          <div
            className="enemy-tooltip"
            style={{
              left: hoveredEnemy.x + 10,
              top: hoveredEnemy.y + 10,
            }}
          >
            <p className="tooltip-name">{hoveredEnemy.enemy.name}</p>
            <p>HP: {hoveredEnemy.enemy.hp}/{hoveredEnemy.enemy.maxHp}</p>
            <p>攻击: {hoveredEnemy.enemy.attack}</p>
            <p>防御: {hoveredEnemy.enemy.defense}</p>
            {hoveredEnemy.enemy.stunned > 0 && (
              <p className="tooltip-stunned">眩晕中</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      {renderGameUI()}
      {renderScreen()}
    </div>
  );
}

export default App;
