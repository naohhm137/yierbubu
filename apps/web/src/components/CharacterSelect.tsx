import React from 'react';
import { CHARACTERS } from '@yierbubu/shared';
import type { Character } from '@yierbubu/shared';

interface CharacterSelectProps {
  selectedId?: string;
  takenIds: string[];
  onSelect: (characterId: string) => void;
  onClose: () => void;
}

export function CharacterSelect({ selectedId, takenIds, onSelect, onClose }: CharacterSelectProps) {
  return (
    <div className="char-select-overlay" onClick={onClose}>
      <div className="char-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="char-select-header">
          <h2>选择你的角色</h2>
          <button className="char-select-close" onClick={onClose}>✕</button>
        </div>
        <p className="char-select-subtitle">每个角色拥有独特技能，选择适合你的玩法</p>

        <div className="char-select-grid">
          {CHARACTERS.map((char: Character) => {
            const isTaken = takenIds.includes(char.id) && char.id !== selectedId;
            const isSelected = char.id === selectedId;
            const isMain = char.id === 'yier' || char.id === 'bubu';

            return (
              <div
                key={char.id}
                className={`char-select-card ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''} ${isMain ? 'main-char' : ''}`}
                onClick={() => !isTaken && onSelect(char.id)}
              >
                {isMain && <div className="char-main-badge">主角</div>}
                {isTaken && <div className="char-taken-overlay">已被选择</div>}

                <div className="char-select-avatar-wrap">
                  <img src={char.avatar} alt={char.name} className="char-select-avatar" />
                </div>

                <div className="char-select-info">
                  <div className="char-select-name">{char.name}</div>
                  <div className="char-select-role">{char.playStyle}</div>
                  <div className="char-select-skill">
                    <span className="skill-icon">✨</span>
                    {char.skill?.name}
                  </div>
                  <div className="char-select-skill-desc">
                    {char.skill?.effect?.slice(0, 30)}...
                  </div>
                </div>

                {isSelected && <div className="char-selected-check">✓</div>}
              </div>
            );
          })}
        </div>

        <div className="char-select-footer">
          <button className="btn-premium btn-ghost-premium" onClick={onClose}>
            随机选择
          </button>
          <button
            className="btn-premium btn-primary-premium"
            onClick={onClose}
            disabled={!selectedId}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
