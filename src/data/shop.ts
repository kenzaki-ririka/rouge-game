// src/data/shop.ts - 商店系统数据

import { ShopItem, Player } from '../types';
import { getAvailableSkillIds } from './skills';

// 重导出ShopItem类型
export type { ShopItem } from '../types';

// ==================== 消耗品 ====================

const consumables: ShopItem[] = [
  {
    id: 'potion_small',
    name: '治疗药水',
    description: '恢复30%最大生命值',
    price: 30,
    category: 'consumable',
    effect: (player) => {
      const healAmount = Math.floor(player.maxHp * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
    },
  },
  {
    id: 'potion_large',
    name: '高级治疗药水',
    description: '恢复60%最大生命值',
    price: 60,
    category: 'consumable',
    effect: (player) => {
      const healAmount = Math.floor(player.maxHp * 0.6);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
    },
  },
  {
    id: 'mana_potion',
    name: '魔法药水',
    description: '恢复全部魔法值',
    price: 25,
    category: 'consumable',
    effect: (player) => {
      player.mp = player.maxMp;
    },
  },
  {
    id: 'oil_premium',
    name: '高级灯油',
    description: '恢复80%火把值',
    price: 40,
    category: 'consumable',
    effect: (player) => {
      const torchGain = Math.floor(player.maxTorch * 0.8);
      player.torch = Math.min(player.maxTorch, player.torch + torchGain);
    },
  },
  {
    id: 'elixir',
    name: '万能药剂',
    description: '完全恢复HP、MP和火把值',
    price: 150,
    category: 'consumable',
    effect: (player) => {
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.torch = player.maxTorch;
    },
  },
];

// ==================== 永久强化 ====================

const permanentUpgrades: ShopItem[] = [
  {
    id: 'whetstone',
    name: '锋利磨刀石',
    description: '永久增加3点攻击力',
    price: 100,
    category: 'permanent',
    effect: (player) => {
      player.attack += 3;
    },
  },
  {
    id: 'armor_plate',
    name: '护甲片',
    description: '永久增加2点防御力',
    price: 80,
    category: 'permanent',
    effect: (player) => {
      player.defense += 2;
    },
  },
  {
    id: 'swift_boots',
    name: '疾风靴',
    description: '永久增加2点速度',
    price: 120,
    category: 'permanent',
    effect: (player) => {
      player.speed += 2;
    },
  },
  {
    id: 'life_crystal',
    name: '生命水晶',
    description: '永久增加30点最大生命值',
    price: 90,
    category: 'permanent',
    effect: (player) => {
      player.maxHp += 30;
      player.hp += 30; // 同时增加当前生命
    },
  },
  {
    id: 'mana_crystal',
    name: '魔力水晶',
    description: '永久增加10点最大魔法值',
    price: 70,
    category: 'permanent',
    effect: (player) => {
      player.maxMp += 10;
      player.mp += 10;
    },
  },
  {
    id: 'lucky_coin',
    name: '幸运金币',
    description: '永久增加3点幸运',
    price: 60,
    category: 'permanent',
    effect: (player) => {
      player.luck += 3;
    },
  },
  {
    id: 'vampiric_fang',
    name: '吸血獠牙',
    description: '永久增加2点吸血',
    price: 150,
    category: 'permanent',
    effect: (player) => {
      player.lifesteal += 2;
    },
  },
  {
    id: 'thorn_ring',
    name: '荆棘指环',
    description: '永久增加3点反伤',
    price: 100,
    category: 'permanent',
    effect: (player) => {
      player.thorns += 3;
    },
  },
  {
    id: 'crit_lens',
    name: '精准透镜',
    description: '永久增加3%暴击率',
    price: 110,
    category: 'permanent',
    effect: (player) => {
      player.critChance += 3;
    },
  },
  {
    id: 'power_gem',
    name: '力量宝石',
    description: '永久增加15%暴击伤害',
    price: 130,
    category: 'permanent',
    effect: (player) => {
      player.critDamage += 15;
    },
  },
  {
    id: 'torch_holder',
    name: '稳固火把架',
    description: '永久增加50点最大火把值',
    price: 50,
    category: 'permanent',
    effect: (player) => {
      player.maxTorch += 50;
    },
  },
  {
    id: 'regeneration_ring',
    name: '再生指环',
    description: '永久增加1点生命回复',
    price: 200,
    category: 'permanent',
    effect: (player) => {
      player.hpRegen += 1;
    },
  },
];

// ==================== 特殊物品 ====================

const specialItems: ShopItem[] = [
  {
    id: 'skill_slot',
    name: '技能卷轴',
    description: '增加1个技能栏位',
    price: 200,
    category: 'special',
    effect: (player) => {
      player.skillSlots += 1;
    },
    canBuy: (player) => player.skillSlots < 6,
  },
  {
    id: 'skill_reset',
    name: '遗忘药水',
    description: '重置所有已学技能，可重新选择',
    price: 250,
    category: 'special',
    effect: (player) => {
      // 清空技能，需要在购买后触发技能选择界面
      player.skillIds = [];
    },
    canBuy: (player) => player.skillIds.length > 0,
  },
  {
    id: 'random_skill',
    name: '神秘卷轴',
    description: '随机学习一个新技能（如果有空位）',
    price: 150,
    category: 'special',
    effect: (player) => {
      if (player.skillIds.length >= player.skillSlots) {
        return; // 没有空位
      }
      
      const availableSkills = getAvailableSkillIds().filter(
        id => !player.skillIds.includes(id)
      );
      
      if (availableSkills.length > 0) {
        const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        player.skillIds.push(randomSkill);
      }
    },
    canBuy: (player) => {
      const availableSkills = getAvailableSkillIds().filter(
        id => !player.skillIds.includes(id)
      );
      return player.skillIds.length < player.skillSlots && availableSkills.length > 0;
    },
  },
  {
    id: 'level_up',
    name: '经验宝珠',
    description: '立即获得升级所需经验的50%',
    price: 180,
    category: 'special',
    effect: (player) => {
      const expGain = Math.floor(player.nextLevelExp * 0.5);
      player.exp += expGain;
    },
  },
];

// ==================== 商店系统 ====================

export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...consumables,
  ...permanentUpgrades,
  ...specialItems,
];

/**
 * 获取当前楼层可用的商店物品
 * 随机选择一部分物品
 */
export function getShopInventory(floor: number, count = 8): ShopItem[] {
  // 根据楼层决定可用物品
  const availableItems = ALL_SHOP_ITEMS.filter(item => {
    // 基础物品始终可用
    if (item.category === 'consumable') return true;
    
    // 永久强化从第1层开始部分可用
    if (item.category === 'permanent') {
      // 随着楼层增加，更多物品解锁
      const unlockChance = Math.min(0.3 + floor * 0.1, 1);
      return Math.random() < unlockChance;
    }
    
    // 特殊物品从第4层开始可用
    if (item.category === 'special') {
      return floor >= 4;
    }
    
    return true;
  });
  
  // 随机选择指定数量的物品
  const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 检查玩家是否可以购买物品
 */
export function canBuyItem(player: Player, item: ShopItem): boolean {
  if (player.gold < item.price) return false;
  if (item.canBuy && !item.canBuy(player)) return false;
  return true;
}

/**
 * 执行购买
 */
export function buyItem(player: Player, item: ShopItem): boolean {
  if (!canBuyItem(player, item)) return false;
  
  player.gold -= item.price;
  item.effect(player);
  return true;
}

/**
 * 获取物品分类显示名称
 */
export function getCategoryName(category: ShopItem['category']): string {
  const names = {
    consumable: '消耗品',
    permanent: '永久强化',
    special: '特殊物品',
  };
  return names[category];
}
