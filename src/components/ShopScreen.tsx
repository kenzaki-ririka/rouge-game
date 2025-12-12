// src/components/ShopScreen.tsx - 商店界面

import React, { useMemo } from 'react';
import { Player } from '../types';
import { ShopItem, canBuyItem, getCategoryName } from '../data/shop';

interface ShopScreenProps {
  player: Player;
  items: ShopItem[];
  onPurchase: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  player,
  items,
  onPurchase,
  onClose,
}) => {
  // 按类别分组物品
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShopItem[]> = {
      consumable: [],
      permanent: [],
      special: [],
    };
    
    items.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    
    return groups;
  }, [items]);
  
  return (
    <div className="modal-overlay">
      <div className="shop-screen">
        <div className="shop-header">
          <h2 className="shop-title">🏪 神秘商人</h2>
          <div className="shop-gold">
            <span>💰 {player.gold}</span>
          </div>
        </div>
        
        <p className="shop-greeting">
          "欢迎光临，冒险者...我这里有一些好东西..."
        </p>
        
        <div className="shop-categories">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category} className="shop-category">
                <h3 className="category-title">{getCategoryName(category as ShopItem['category'])}</h3>
                <div className="shop-items">
                  {categoryItems.map(item => {
                    const canBuy = canBuyItem(player, item);
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`shop-item ${!canBuy ? 'disabled' : ''}`}
                      >
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <p className="item-desc">{item.description}</p>
                        </div>
                        <div className="item-actions">
                          <span className="item-price">💰 {item.price}</span>
                          <button
                            className="btn-buy"
                            onClick={() => onPurchase(item)}
                            disabled={!canBuy}
                          >
                            {canBuy ? '购买' : (player.gold < item.price ? '金币不足' : '不可用')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <button className="btn-secondary btn-close-shop" onClick={onClose}>
          离开商店 (ESC/B)
        </button>
      </div>
    </div>
  );
};
