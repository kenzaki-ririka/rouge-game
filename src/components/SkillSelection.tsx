// src/components/SkillSelection.tsx - 技能选择界面

import React, { useState, useCallback } from 'react';
import { SKILL_LIBRARY, getAvailableSkillIds } from '../data/skills';

interface SkillSelectionProps {
  maxSlots: number;
  currentSkills?: string[];
  onConfirm: (skillIds: string[]) => void;
}

export const SkillSelection: React.FC<SkillSelectionProps> = ({
  maxSlots,
  currentSkills = [],
  onConfirm,
}) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentSkills);
  
  const availableSkillIds = getAvailableSkillIds();
  
  const handleToggleSkill = useCallback((skillId: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      
      if (prev.length >= maxSlots) {
        return prev;
      }
      
      return [...prev, skillId];
    });
  }, [maxSlots]);
  
  const handleConfirm = useCallback(() => {
    if (selectedSkills.length > 0) {
      onConfirm(selectedSkills);
    }
  }, [selectedSkills, onConfirm]);
  
  return (
    <div className="modal-overlay">
      <div className="skill-selection-screen">
        <h2 className="screen-title">选择技能</h2>
        <p className="selection-hint">
          已选择 <span className="highlight">{selectedSkills.length}</span> / {maxSlots} 个技能
        </p>
        
        <div className="skills-grid">
          {availableSkillIds.map(skillId => {
            const skill = SKILL_LIBRARY[skillId];
            if (!skill) return null;
            
            const isSelected = selectedSkills.includes(skillId);
            const canSelect = isSelected || selectedSkills.length < maxSlots;
            
            return (
              <div
                key={skillId}
                className={`skill-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                onClick={() => canSelect && handleToggleSkill(skillId)}
              >
                <div className="skill-header">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-cost">MP: {skill.cost}</span>
                </div>
                <p className="skill-desc">{skill.description}</p>
                <span className={`skill-type type-${skill.type}`}>{skill.type}</span>
              </div>
            );
          })}
        </div>
        
        <button
          className="btn-primary btn-confirm"
          onClick={handleConfirm}
          disabled={selectedSkills.length === 0}
        >
          确认选择
        </button>
      </div>
    </div>
  );
};
