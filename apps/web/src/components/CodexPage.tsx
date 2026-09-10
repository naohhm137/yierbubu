import React, { useState } from 'react';
import { useGame } from '../GameContext.js';
import { categoryName, type Character, type Card } from '@yierbubu/shared';

export function CodexPage() {
  const { setScreen, characters, cards } = useGame();
  const [tab, setTab] = useState<'characters' | 'cards'>('characters');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  return (
    <div className="info-screen">
      <div className="info-back">
        <button className="btn btn-ghost" onClick={() => setScreen('menu')}>← 返回主菜单</button>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        🎨 图鉴
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button
          className={`btn ${tab === 'characters' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('characters')}
        >👤 角色图鉴</button>
        <button
          className={`btn ${tab === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('cards')}
        >🃏 卡牌图鉴</button>
      </div>

      {tab === 'characters' && (
        <div className="codex-grid">
          {characters.map((char) => (
            <div key={char.id} className="codex-character" onClick={() => setSelectedChar(char)}>
              <img src={char.avatar} alt={char.name} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{char.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>{char.title}</div>
              {char.isProtagonist && <div style={{ fontSize: '0.75rem', color: 'var(--color-bubu)' }}>⭐ 主角</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'cards' && (
        <div className="codex-cards">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card card-${card.category}`}
              style={{ width: '100%', height: 'auto', minHeight: 160, cursor: 'pointer' }}
              onClick={() => setSelectedCard(card)}
            >
              <div className="card-name">{card.name}</div>
              <div className="card-category">{categoryName(card.category)}</div>
              <div className="card-desc">{card.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* 角色详情 */}
      {selectedChar && (
        <div className="target-overlay" onClick={() => setSelectedChar(null)}>
          <div className="target-panel" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <img src={selectedChar.avatar} alt={selectedChar.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: 'var(--shadow-md)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 'var(--space-md)' }}>{selectedChar.name}</h2>
            <div style={{ color: 'var(--color-ink-soft)', marginBottom: 'var(--space-md)' }}>{selectedChar.title} · {selectedChar.species}</div>
            <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-sm)' }}><strong>性格：</strong>{selectedChar.personality}</p>
            <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-sm)' }}><strong>背景：</strong>{selectedChar.background}</p>
            <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-sm)' }}><strong>玩法：</strong>{selectedChar.playStyle}</p>
            <div style={{ background: 'var(--color-bg-soft)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', margin: 'var(--space-md) 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-moon)' }}>✨ {selectedChar.skill.name}</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{selectedChar.skill.effect}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: 4 }}>
                费用：{selectedChar.skill.cost} · 冷却：{selectedChar.skill.cooldown}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
              ❤️ 活力 {selectedChar.baseVitality} · 💕 初始友情 {selectedChar.baseFriendship} · 🃏 手牌上限 {selectedChar.handLimit}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 'var(--space-md)' }} onClick={() => setSelectedChar(null)}>关闭</button>
          </div>
        </div>
      )}

      {/* 卡牌详情 */}
      {selectedCard && (
        <div className="target-overlay" onClick={() => setSelectedCard(null)}>
          <div className="target-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>{selectedCard.name}</h2>
            <div className="card-category" style={{ display: 'inline-block', margin: 'var(--space-sm) 0' }}>{categoryName(selectedCard.category)}</div>
            <p style={{ lineHeight: 1.8, margin: 'var(--space-md) 0' }}>{selectedCard.description}</p>
            {selectedCard.hint && <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>💡 {selectedCard.hint}</p>}
            <button className="btn btn-ghost" onClick={() => setSelectedCard(null)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
