// src/components/GameCanvas.tsx - 游戏渲染画布

import React, { useRef, useEffect, useCallback } from 'react';
import {
  GameState,
  TileType,
  Enemy,
} from '../types';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  COLORS,
  ENTITY_CHARS,
  FOG_OF_WAR_ENABLED,
} from '../constants';

interface GameCanvasProps {
  state: GameState;
  onEnemyHover?: (enemy: Enemy | null, x: number, y: number) => void;
  onRightClick?: (tileX: number, tileY: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ state, onEnemyHover, onRightClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 绘制游戏
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { gameMap, fovMap, player, enemies, items, visualEffects, groundEffects, arrowProjectile } = state;

    // 如果地图还未生成，不进行绘制
    if (!gameMap || gameMap.length === 0) {
      return;
    }

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置字体
    ctx.font = `${TILE_SIZE * 0.9}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 绘制地图
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = gameMap[y]?.[x];
        const fov = fovMap[y]?.[x];

        const isVisible = FOG_OF_WAR_ENABLED ? fov?.visible : true;
        const isExplored = FOG_OF_WAR_ENABLED ? fov?.explored : true;

        // 未探索区域
        if (!isExplored && FOG_OF_WAR_ENABLED) {
          ctx.fillStyle = COLORS.FOG;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          continue;
        }

        // 地板/墙壁
        let tileColor: string = tile === TileType.WALL ? COLORS.WALL : COLORS.FLOOR;

        // 不可见但已探索的区域变暗
        if (!isVisible && FOG_OF_WAR_ENABLED) {
          const r = parseInt(tileColor.slice(1, 3), 16);
          const g = parseInt(tileColor.slice(3, 5), 16);
          const b = parseInt(tileColor.slice(5, 7), 16);
          tileColor = `rgb(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.3)})`;
        }

        ctx.fillStyle = tileColor;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // 只有可见区域才绘制实体
        if (!isVisible && FOG_OF_WAR_ENABLED) continue;

        // 绘制物品
        const item = items.find(i => i.x === x && i.y === y);
        if (item) {
          ctx.fillStyle = item.type === 'portal' ? COLORS.PORTAL : COLORS.ITEM;
          let char = '';
          switch (item.type) {
            case 'portal': char = ENTITY_CHARS.PORTAL; break;
            case 'gold': char = ENTITY_CHARS.GOLD; break;
            case 'potion': char = ENTITY_CHARS.POTION; break;
            case 'oil': char = ENTITY_CHARS.OIL; break;
            case 'arrow': char = ENTITY_CHARS.ARROW; ctx.fillStyle = COLORS.ARROW; break;
          }
          ctx.fillText(char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }

        // 绘制敌人
        const enemy = enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
          ctx.fillStyle = enemy.stunned > 0 ? COLORS.ENEMY_STUNNED : COLORS.ENEMY;
          ctx.fillText(enemy.char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }

        // 绘制玩家
        if (player && player.x === x && player.y === y) {
          ctx.fillStyle = COLORS.PLAYER;
          ctx.fillText(ENTITY_CHARS.PLAYER, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }
      }
    }

    // 绘制视觉效果
    visualEffects.forEach(effect => {
      ctx.fillStyle = effect.color;
      effect.tiles.forEach(tile => {
        const fov = fovMap[tile.y]?.[tile.x];
        if (fov?.visible || !FOG_OF_WAR_ENABLED) {
          ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      });
    });

    // 绘制地面效果
    groundEffects.forEach(effect => {
      ctx.fillStyle = effect.color || COLORS.EFFECT_POISON;
      effect.tiles.forEach(tile => {
        const fov = fovMap[tile.y]?.[tile.x];
        if (fov?.visible || !FOG_OF_WAR_ENABLED) {
          ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      });
    });

    // 绘制箭矢轨迹
    if (arrowProjectile) {
      ctx.strokeStyle = COLORS.ARROW_LINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(
        arrowProjectile.startX * TILE_SIZE + TILE_SIZE / 2,
        arrowProjectile.startY * TILE_SIZE + TILE_SIZE / 2
      );
      ctx.lineTo(
        arrowProjectile.endX * TILE_SIZE + TILE_SIZE / 2,
        arrowProjectile.endY * TILE_SIZE + TILE_SIZE / 2
      );
      ctx.stroke();

      // 绘制箭头
      const angle = Math.atan2(
        arrowProjectile.endY - arrowProjectile.startY,
        arrowProjectile.endX - arrowProjectile.startX
      );
      const arrowHeadLength = 10;
      const endX = arrowProjectile.endX * TILE_SIZE + TILE_SIZE / 2;
      const endY = arrowProjectile.endY * TILE_SIZE + TILE_SIZE / 2;

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
        endY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
        endY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  }, [state]);

  // 初始化画布尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;
  }, []);

  // 绘制
  useEffect(() => {
    draw();
  }, [draw]);

  // 调整画布显示尺寸
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      // 获取容器实际尺寸
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (containerWidth === 0 || containerHeight === 0) return;

      const mapAspectRatio = MAP_WIDTH / MAP_HEIGHT;
      const containerAspectRatio = containerWidth / containerHeight;

      let finalWidth: number, finalHeight: number;

      if (containerAspectRatio > mapAspectRatio) {
        // 容器更宽，以高度为准
        finalHeight = containerHeight;
        finalWidth = finalHeight * mapAspectRatio;
      } else {
        // 容器更高，以宽度为准
        finalWidth = containerWidth;
        finalHeight = finalWidth / mapAspectRatio;
      }

      canvas.style.width = `${Math.floor(finalWidth)}px`;
      canvas.style.height = `${Math.floor(finalHeight)}px`;
    };

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(container);
    resizeCanvas();

    return () => resizeObserver.disconnect();
  }, []);

  // 鼠标悬停检测
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onEnemyHover) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / canvas.width;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
      onEnemyHover(null, 0, 0);
      return;
    }

    const fov = state.fovMap[tileY]?.[tileX];
    if (FOG_OF_WAR_ENABLED && !fov?.visible) {
      onEnemyHover(null, 0, 0);
      return;
    }

    const enemy = state.enemies.find(en => en.x === tileX && en.y === tileY);
    onEnemyHover(enemy || null, e.clientX, e.clientY);
  }, [state.enemies, state.fovMap, onEnemyHover]);

  const handleMouseLeave = useCallback(() => {
    if (onEnemyHover) {
      onEnemyHover(null, 0, 0);
    }
  }, [onEnemyHover]);

  // 右键点击处理（射箭）
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 阻止默认右键菜单

    if (!onRightClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / canvas.width;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
      onRightClick(tileX, tileY);
    }
  }, [onRightClick]);

  return (
    <div
      ref={containerRef}
      className="game-canvas-container"
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};
