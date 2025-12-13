// src/hooks/useGame.ts - 游戏状态管理

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState,
  GameScreen,
  Player,
  Enemy,
  LogType,
  PlayerBaseStats,
  LevelUpOption,
} from '../types';
import {
  ACTION_COST,
  FOV_RADIUS,
  FOG_OF_WAR_ENABLED,
  REGEN_TICK_INTERVAL,
  isShopFloor,
  ARROW_DAMAGE,
  ARROW_RANGE,
} from '../constants';
import {
  generateMap,
  createFovMap,
  computeFov,
  isWalkable,
  isPositionEmpty as mapIsPositionEmpty,
} from '../core/MapGenerator';
import {
  createPlayer,
  placeEntities,
  handleItemPickup,
  canLevelUp,
  performLevelUp,
  getLevelUpOptions,
  handleMonsterSplit,
} from '../core/EntityManager';
import {
  performAttack,
  processEnemyTurn,
  updateEffects,
  processStun,
  getEffectiveMoveSpeed,
} from '../core/CombatSystem';
import { SKILL_LIBRARY } from '../data/skills';
import { DEFAULT_DIFFICULTY } from '../data/difficulty';
import { getShopInventory, ShopItem, buyItem, canBuyItem } from '../data/shop';

// ==================== 初始状态 ====================

const createInitialState = (): GameState => ({
  screen: 'start',
  player: null,
  enemies: [],
  items: [],
  gameMap: [],
  fovMap: [],
  floor: 1,
  turnCount: 0,
  isPlayerTurn: false,
  gameActive: false,
  logs: [],
  visualEffects: [],
  groundEffects: [],
  arrowProjectile: null,
});

// ==================== 日志ID计数器 ====================

let logIdCounter = 0;

// ==================== Hook ====================

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [levelUpOptions, setLevelUpOptions] = useState<LevelUpOption[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [pendingSkillSelection, setPendingSkillSelection] = useState<{
    count: number;
    callback: (skillIds: string[]) => void;
  } | null>(null);

  // 使用ref来存储最新状态，避免闭包问题
  const stateRef = useRef(state);
  stateRef.current = state;

  // ==================== 日志系统 ====================

  const addLog = useCallback((message: string, type: LogType) => {
    setState(prev => ({
      ...prev,
      logs: [
        {
          id: ++logIdCounter,
          message,
          type,
          timestamp: Date.now(),
        },
        ...prev.logs.slice(0, 199), // 保持最多200条日志
      ],
    }));
  }, []);

  // ==================== 屏幕切换 ====================

  const setScreen = useCallback((screen: GameScreen) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  // ==================== 游戏初始化 ====================

  const startGame = useCallback((
    name: string,
    stats: Partial<PlayerBaseStats>,
    skillIds: string[]
  ) => {
    // 生成地图
    const { map, rooms } = generateMap();
    const fovMap = createFovMap();

    // 放置实体
    const { playerStart, enemies, items } = placeEntities(
      rooms,
      map,
      1,
      stats.luck || 10,
      DEFAULT_DIFFICULTY
    );

    // 创建玩家
    const player = createPlayer(name, stats, skillIds, playerStart.x, playerStart.y);

    // 计算初始视野
    if (FOG_OF_WAR_ENABLED) {
      computeFov(map, fovMap, player.x, player.y, FOV_RADIUS);
    }

    // 清空日志
    logIdCounter = 0;

    setState({
      screen: 'playing',
      player,
      enemies,
      items,
      gameMap: map,
      fovMap,
      floor: 1,
      turnCount: 0,
      isPlayerTurn: true,
      gameActive: true,
      logs: [],
      visualEffects: [],
      groundEffects: [],
      arrowProjectile: null,
    });

    // 初始日志
    setTimeout(() => {
      addLog('你在潮湿的石地上苏醒...', 'system');
      addLog(`欢迎来到地城，${name}。你的任务是活下去。`, 'system');

      // 第一层有商店
      if (isShopFloor(1)) {
        addLog('你注意到角落里有一个神秘商人...', 'system');
      }
    }, 100);
  }, [addLog]);

  // ==================== 进入下一层 ====================

  const nextFloor = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.player) return;

    const newFloor = currentState.floor + 1;
    const { map, rooms } = generateMap();
    const fovMap = createFovMap();

    const { playerStart, enemies, items } = placeEntities(
      rooms,
      map,
      newFloor,
      currentState.player.luck,
      DEFAULT_DIFFICULTY
    );

    const player = { ...currentState.player, x: playerStart.x, y: playerStart.y };

    if (FOG_OF_WAR_ENABLED) {
      computeFov(map, fovMap, player.x, player.y, FOV_RADIUS);
    }

    setState(prev => ({
      ...prev,
      gameMap: map,
      fovMap,
      floor: newFloor,
      player,
      enemies,
      items,
      visualEffects: [],
      groundEffects: [],
      arrowProjectile: null,
    }));

    addLog(`你穿过了传送门...来到了地城第 ${newFloor} 层。`, 'system');

    if (isShopFloor(newFloor)) {
      addLog('这一层似乎有一个神秘商人...按 B 键打开商店。', 'system');
    }
  }, [addLog]);

  // ==================== 实体死亡处理 ====================

  const killEntity = useCallback((entity: Player | Enemy) => {
    const currentState = stateRef.current;

    // 玩家死亡
    if ('skillIds' in entity) {
      setState(prev => ({
        ...prev,
        screen: 'gameOver',
        gameActive: false,
      }));
      addLog('黑暗吞噬了你的意识...', 'system');
      return;
    }

    // 敌人死亡
    const enemy = entity as Enemy;
    addLog(`${enemy.name} 已被击败。`, 'system');
    addLog(`你获得了 ${enemy.exp} 点经验。`, 'item');

    // 处理分裂
    const newEnemies = handleMonsterSplit(
      enemy,
      currentState.gameMap,
      currentState.player!,
      currentState.enemies,
      currentState.items,
      currentState.floor,
      DEFAULT_DIFFICULTY
    );

    if (newEnemies.length > 0) {
      addLog(`${enemy.name}分裂了！`, 'enemy');
    }

    setState(prev => {
      if (!prev.player) return prev;

      const updatedPlayer = { ...prev.player, exp: prev.player.exp + enemy.exp };
      const remainingEnemies = prev.enemies.filter(e => e !== enemy);

      return {
        ...prev,
        player: updatedPlayer,
        enemies: [...remainingEnemies, ...newEnemies],
      };
    });

    // 检查升级
    setTimeout(() => {
      const latestState = stateRef.current;
      if (latestState.player && canLevelUp(latestState.player)) {
        const playerCopy = { ...latestState.player };
        performLevelUp(playerCopy);

        setState(prev => ({
          ...prev,
          player: playerCopy,
          screen: 'levelUp',
        }));

        setLevelUpOptions(getLevelUpOptions());
        addLog('升级了！恢复了少量生命。', 'system');
      }
    }, 50);
  }, [addLog]);

  // ==================== 升级选择 ====================

  const selectLevelUpOption = useCallback((option: LevelUpOption) => {
    setState(prev => {
      if (!prev.player) return prev;

      const updatedPlayer = { ...prev.player };
      option.apply(updatedPlayer);

      addLog(`你强化了: ${option.text}`, 'system');

      // 如果选择了技能栏位，需要触发技能选择
      if (option.id === 'skillSlots') {
        setPendingSkillSelection({
          count: 1,
          callback: (newSkills) => {
            setState(p => {
              if (!p.player) return p;
              return {
                ...p,
                player: {
                  ...p.player,
                  skillIds: [...p.player.skillIds, ...newSkills],
                },
                screen: 'playing',
              };
            });
          },
        });

        return {
          ...prev,
          player: updatedPlayer,
          screen: 'skillSelection',
        };
      }

      return {
        ...prev,
        player: updatedPlayer,
        screen: 'playing',
      };
    });
  }, [addLog]);

  // ==================== 技能选择 ====================

  const selectSkills = useCallback((skillIds: string[]) => {
    if (pendingSkillSelection) {
      pendingSkillSelection.callback(skillIds);
      setPendingSkillSelection(null);
    }
  }, [pendingSkillSelection]);

  // ==================== 商店系统 ====================

  const openShop = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.gameActive || !currentState.player) return;

    const items = getShopInventory(currentState.floor);
    setShopItems(items);
    setState(prev => ({ ...prev, screen: 'shop' }));
  }, []);

  const closeShop = useCallback(() => {
    setState(prev => ({ ...prev, screen: 'playing' }));
  }, []);

  const purchaseItem = useCallback((item: ShopItem) => {
    setState(prev => {
      if (!prev.player) return prev;

      if (!canBuyItem(prev.player, item)) {
        addLog('无法购买该物品。', 'system');
        return prev;
      }

      const updatedPlayer = { ...prev.player };
      buyItem(updatedPlayer, item);

      addLog(`购买了 ${item.name}！`, 'item');

      // 如果是技能重置，需要触发技能选择
      if (item.id === 'skill_reset') {
        setPendingSkillSelection({
          count: updatedPlayer.skillSlots,
          callback: (newSkills) => {
            setState(p => {
              if (!p.player) return p;
              return {
                ...p,
                player: {
                  ...p.player,
                  skillIds: newSkills,
                },
                screen: 'playing',
              };
            });
          },
        });

        return {
          ...prev,
          player: updatedPlayer,
          screen: 'skillSelection',
        };
      }

      return {
        ...prev,
        player: updatedPlayer,
      };
    });
  }, [addLog]);

  // ==================== 玩家移动/攻击 ====================

  const movePlayer = useCallback((dx: number, dy: number) => {
    const currentState = stateRef.current;
    if (!currentState.isPlayerTurn || !currentState.gameActive || !currentState.player) return;
    if (currentState.screen !== 'playing') return;

    const player = currentState.player;
    const newX = player.x + dx;
    const newY = player.y + dy;

    // 检查是否攻击敌人
    const targetEnemy = currentState.enemies.find(e => e.x === newX && e.y === newY);

    if (targetEnemy) {
      // 攻击敌人
      const result = performAttack(player, targetEnemy, true);

      if (result.evaded) {
        addLog(`${targetEnemy.name} 闪开了你的攻击！`, 'system');
      } else {
        const critText = result.isCrit ? '暴击' : '';
        addLog(`你对${targetEnemy.name}造成了${result.damage}点${critText}伤害。`, 'player');

        if (result.lifestealHealed > 0) {
          addLog(`你吸取了${result.lifestealHealed}点生命。`, 'player');
        }

        if (result.defenderDied) {
          killEntity(targetEnemy);
        }
      }

      commitPlayerAction();
    } else if (isWalkable(currentState.gameMap, newX, newY)) {
      // 移动
      setState(prev => {
        if (!prev.player) return prev;

        const updatedPlayer = { ...prev.player, x: newX, y: newY };
        const updatedFov = [...prev.fovMap.map(row => [...row])];

        if (FOG_OF_WAR_ENABLED) {
          computeFov(prev.gameMap, updatedFov, newX, newY, FOV_RADIUS);
        }

        return {
          ...prev,
          player: updatedPlayer,
          fovMap: updatedFov,
        };
      });

      // 检查物品
      const itemAtPos = currentState.items.find(i => i.x === newX && i.y === newY);
      if (itemAtPos) {
        if (itemAtPos.type === 'portal') {
          nextFloor();
          return;
        }

        const { consumed, message } = handleItemPickup(player, itemAtPos, currentState.floor);
        if (consumed) {
          addLog(message, 'item');
          setState(prev => ({
            ...prev,
            items: prev.items.filter(i => i !== itemAtPos),
          }));
        }
      }

      commitPlayerAction();
    }
  }, [addLog, killEntity, nextFloor]);

  // ==================== 使用技能 ====================

  const useSkill = useCallback((skillIndex: number) => {
    const currentState = stateRef.current;
    if (!currentState.isPlayerTurn || !currentState.gameActive || !currentState.player) return;
    if (currentState.screen !== 'playing') return;

    const player = currentState.player;

    if (skillIndex >= player.skillSlots || skillIndex >= player.skillIds.length) {
      return;
    }

    const skillId = player.skillIds[skillIndex];
    const skill = SKILL_LIBRARY[skillId];

    if (!skill) {
      addLog('无效技能。', 'system');
      return;
    }

    if (player.mp < skill.cost) {
      addLog('魔法值不足！', 'enemy');
      return;
    }

    // 创建技能上下文
    const skillContext = {
      player,
      enemies: currentState.enemies,
      gameMap: currentState.gameMap,
      killEntity,
      addLog,
      updateGame: () => {
        setState(prev => ({ ...prev })); // 触发重渲染
      },
      isWalkable: (x: number, y: number) => isWalkable(currentState.gameMap, x, y),
      addGroundEffect: (effect: typeof currentState.groundEffects[0]) => {
        setState(prev => ({
          ...prev,
          groundEffects: [...prev.groundEffects, effect],
        }));
      },
    };

    const result = skill.effect(player, null, skillContext);

    if (result === 'prompt_direction') {
      setState(prev => ({
        ...prev,
        player: prev.player ? {
          ...prev.player,
          isDashing: true,
          mp: prev.player.mp - skill.cost, // 先扣除MP
        } : null,
      }));
      addLog(`准备冲刺，请选择方向...`, 'skill');
      return;
    }

    if (result) {
      setState(prev => {
        if (!prev.player) return prev;
        return {
          ...prev,
          player: { ...prev.player, mp: prev.player.mp - skill.cost },
        };
      });

      addLog(`你施放了【${skill.name}】！`, 'skill');
      commitPlayerAction();
    }
  }, [addLog, killEntity]);

  // ==================== 射箭系统 ====================

  const shootArrow = useCallback((targetX: number, targetY: number) => {
    const currentState = stateRef.current;
    if (!currentState.isPlayerTurn || !currentState.gameActive || !currentState.player) return;
    if (currentState.screen !== 'playing') return;

    const player = currentState.player;

    // 检查是否有箭矢
    if (player.arrows <= 0) {
      addLog('你没有箭矢了！', 'system');
      return;
    }

    // 检查目标位置是否有敌人
    const targetEnemy = currentState.enemies.find(e => e.x === targetX && e.y === targetY);
    if (!targetEnemy) {
      addLog('那里没有目标！', 'system');
      return;
    }

    // 检查距离
    const distance = Math.hypot(targetX - player.x, targetY - player.y);
    if (distance > ARROW_RANGE) {
      addLog('目标太远了！', 'system');
      return;
    }

    // 检查视野
    const fov = currentState.fovMap[targetY]?.[targetX];
    if (FOG_OF_WAR_ENABLED && !fov?.visible) {
      addLog('你看不到那里！', 'system');
      return;
    }

    // 创建箭矢轨迹用于渲染
    const arrowProjectile = {
      startX: player.x,
      startY: player.y,
      endX: targetX,
      endY: targetY,
      timestamp: Date.now(),
    };

    // 应用伤害
    const damage = ARROW_DAMAGE;
    targetEnemy.hp -= damage;

    addLog(`箭矢命中了 ${targetEnemy.name}，造成 ${damage} 点伤害！`, 'player');

    // 更新状态
    setState(prev => {
      if (!prev.player) return prev;

      const updatedPlayer = {
        ...prev.player,
        arrows: prev.player.arrows - 1,
      };

      return {
        ...prev,
        player: updatedPlayer,
        arrowProjectile,
      };
    });

    // 检查敌人是否死亡
    if (targetEnemy.hp <= 0) {
      killEntity(targetEnemy);
    }

    // 延迟清除箭矢轨迹
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        arrowProjectile: null,
      }));
    }, 300);

    commitPlayerAction();
  }, [addLog, killEntity]);

  // ==================== 提交玩家行动 ====================

  const commitPlayerAction = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;

      return {
        ...prev,
        player: { ...prev.player, ap: prev.player.ap - ACTION_COST },
        isPlayerTurn: false,
      };
    });

    // 触发游戏循环
    setTimeout(() => processGameLoop(), 50);
  }, []);

  // ==================== 游戏主循环 ====================

  const processGameLoop = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.gameActive || !currentState.player) return;

    let player = { ...currentState.player };
    let enemies = [...currentState.enemies];
    let turnCount = currentState.turnCount;
    let shouldContinue = true;

    // 循环直到轮到玩家
    while (shouldContinue) {
      // 获取所有行动者并按AP排序
      const actors = [player, ...enemies].sort((a, b) => b.ap - a.ap);
      let actor = actors[0];

      // AP不足时累加
      if (actor.ap < ACTION_COST) {
        while (actor.ap < ACTION_COST) {
          turnCount++;

          // 所有存活实体增加AP
          if (player.hp > 0) {
            player.ap += getEffectiveMoveSpeed(player);
          }
          enemies.forEach(e => {
            if (e.hp > 0) {
              e.ap += getEffectiveMoveSpeed(e);
            }
          });

          // 重新获取最高AP者
          const allActors = [player, ...enemies].sort((a, b) => b.ap - a.ap);
          actor = allActors[0];
        }
      }

      // 处理效果
      const expiredEffects = updateEffects(actor);
      expiredEffects.forEach(effect => {
        if (actor === player) {
          addLog(`${effect} 效果已消失。`, 'system');
        }
      });

      // 处理眩晕
      if (processStun(actor)) {
        if ('skillIds' in actor) {
          addLog('你从眩晕中恢复过来。', 'system');
        } else {
          addLog(`${(actor as Enemy).name} 从眩晕中恢复过来。`, 'system');
        }
        actor.ap -= ACTION_COST;
        continue;
      }

      // 玩家回合
      if ('skillIds' in actor) {
        // 玩家回合开始前的处理
        // HP/MP回复
        if (turnCount % REGEN_TICK_INTERVAL === 0) {
          if (player.hpRegen > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + player.hpRegen);
            addLog(`你恢复了${player.hpRegen}点生命。`, 'player');
          }
          if (player.mpRegen > 0 && player.mp < player.maxMp) {
            player.mp = Math.min(player.maxMp, player.mp + player.mpRegen);
            addLog(`你恢复了${player.mpRegen}点魔法。`, 'player');
          }
        }

        // 火把消耗
        player.torch--;
        if (player.torch <= 0) {
          setState(prev => ({
            ...prev,
            player,
            enemies,
            turnCount,
            screen: 'gameOver',
            gameActive: false,
          }));
          addLog('火把熄灭了，你被黑暗吞噬...', 'system');
          return;
        }

        // 处理地面效果
        const groundEffectsToKeep = currentState.groundEffects.filter(effect => {
          // 对站在效果区域的敌人造成伤害
          enemies.forEach(enemy => {
            const isOnEffect = effect.tiles.some(tile => tile.x === enemy.x && tile.y === enemy.y);
            if (isOnEffect && effect.damage) {
              enemy.hp -= effect.damage;
              addLog(`${enemy.name} 受到 ${effect.name} 伤害 ${effect.damage} 点！`, 'skill');

              if (enemy.hp <= 0) {
                addLog(`${enemy.name} 被 ${effect.name} 击败了！`, 'system');
              }
            }
          });

          // 减少持续时间
          effect.duration--;
          return effect.duration > 0;
        });

        // 移除死亡敌人
        enemies = enemies.filter(e => e.hp > 0);

        // 更新状态并等待玩家输入
        setState(prev => ({
          ...prev,
          player,
          enemies,
          turnCount,
          isPlayerTurn: true,
          groundEffects: groundEffectsToKeep,
        }));

        shouldContinue = false;
      } else {
        // 敌人回合
        const enemy = actor as Enemy;

        const isPositionEmptyForEnemy = (x: number, y: number) => {
          if (player.x === x && player.y === y) return false;
          return !enemies.some(e => e !== enemy && e.x === x && e.y === y);
        };

        const enemyAttackCallback = (attacker: Enemy, defender: Player) => {
          const result = performAttack(attacker, defender, false);

          if (result.evaded) {
            addLog(`你灵巧地躲开了 ${attacker.name} 的攻击！`, 'system');
          } else {
            addLog(`${attacker.name}对你造成了${result.damage}点伤害。`, 'enemy');

            if (result.thornsDamage > 0) {
              addLog(`${attacker.name}受到了${result.thornsDamage}点反伤。`, 'enemy');
              if (result.attackerDied) {
                // 敌人被反伤杀死
                enemies = enemies.filter(e => e !== attacker);
                addLog(`${attacker.name} 被反伤击败了。`, 'system');
              }
            }

            player = { ...player, hp: defender.hp };

            if (result.defenderDied) {
              setState(prev => ({
                ...prev,
                player,
                enemies,
                turnCount,
                screen: 'gameOver',
                gameActive: false,
              }));
              addLog('黑暗吞噬了你的意识...', 'system');
              return;
            }
          }
        };

        processEnemyTurn(
          enemy,
          player,
          enemies,
          (x, y) => isWalkable(currentState.gameMap, x, y),
          isPositionEmptyForEnemy,
          enemyAttackCallback
        );

        enemy.ap -= ACTION_COST;
      }
    }
  }, [addLog]);

  // ==================== 键盘输入处理 ====================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentState = stateRef.current;

    // 商店界面按ESC关闭
    if (currentState.screen === 'shop') {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        closeShop();
      }
      return;
    }

    // 非游戏状态不处理
    if (currentState.screen !== 'playing' || !currentState.isPlayerTurn || !currentState.gameActive) {
      return;
    }

    const player = currentState.player;
    if (!player) return;

    // 冲刺状态的方向选择
    if (player.isDashing) {
      let dx = 0, dy = 0;

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dy = -1; break;
        case 'ArrowDown': case 's': case 'S': dy = 1; break;
        case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
        case 'ArrowRight': case 'd': case 'D': dx = 1; break;
        default:
          addLog('冲刺取消，魔法值已返还。', 'system');
          setState(prev => ({
            ...prev,
            player: prev.player ? {
              ...prev.player,
              isDashing: false,
              mp: prev.player.mp + 5, // 返还冲刺的5点MP
            } : null,
          }));
          return;
      }

      e.preventDefault();

      // 执行冲刺（移动2格）
      let newX = player.x, newY = player.y;
      for (let i = 0; i < 2; i++) {
        const nextX = newX + dx;
        const nextY = newY + dy;
        if (isWalkable(currentState.gameMap, nextX, nextY) &&
          mapIsPositionEmpty(nextX, nextY, null, currentState.enemies, currentState.items)) {
          newX = nextX;
          newY = nextY;
        } else {
          break;
        }
      }

      setState(prev => {
        if (!prev.player) return prev;

        const updatedPlayer = { ...prev.player, x: newX, y: newY, isDashing: false };
        const updatedFov = [...prev.fovMap.map(row => [...row])];

        if (FOG_OF_WAR_ENABLED) {
          computeFov(prev.gameMap, updatedFov, newX, newY, FOV_RADIUS);
        }

        return {
          ...prev,
          player: updatedPlayer,
          fovMap: updatedFov,
        };
      });

      addLog('你向前冲刺！', 'skill');
      commitPlayerAction();
      return;
    }

    // 技能键 1-9
    if (e.key >= '1' && e.key <= '9') {
      const skillIndex = parseInt(e.key) - 1;
      useSkill(skillIndex);
      return;
    }

    // 商店键
    if (e.key === 'b' || e.key === 'B') {
      if (isShopFloor(currentState.floor)) {
        openShop();
      } else {
        addLog('这一层没有商店。', 'system');
      }
      return;
    }

    // 等待键
    if (e.key === '.' || e.key === ' ') {
      e.preventDefault();
      addLog('你等待了一回合。', 'system');
      commitPlayerAction();
      return;
    }

    // 移动键
    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': dy = -1; break;
      case 'ArrowDown': case 's': case 'S': dy = 1; break;
      case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
      case 'ArrowRight': case 'd': case 'D': dx = 1; break;
      default: return;
    }

    e.preventDefault();
    movePlayer(dx, dy);
  }, [movePlayer, useSkill, openShop, closeShop, addLog, commitPlayerAction]);

  // ==================== 注册键盘事件 ====================

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ==================== 返回值 ====================

  return {
    state,
    setScreen,
    startGame,
    addLog,
    movePlayer,
    useSkill,
    shootArrow,
    selectLevelUpOption,
    selectSkills,
    openShop,
    closeShop,
    purchaseItem,
    levelUpOptions,
    shopItems,
    pendingSkillSelection,
  };
}
