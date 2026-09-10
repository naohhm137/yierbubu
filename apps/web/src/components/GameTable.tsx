import React, { useState, useMemo } from 'react';
import { useGame } from '../GameContext.js';
import { getCard, getCharacter, getScene, categoryName, type Card, type PlayerState } from '@yierbubu/shared';

type PendingAction =
  | { type: 'playCard'; cardId: string }
  | { type: 'useSkill' }
  | { type: 'gift' }
  | { type: 'exchange' }
  | null;

export function GameTable() {
  const { room, privateView, playerId, doAction } = useGame();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [showCardDetail, setShowCardDetail] = useState<Card | null>(null);

  if (!room || !privateView) return null;

  const me = room.players.find((p) => p.id === playerId);
  const isMyTurn = room.activePlayerId === playerId && me?.status === 'active';
  const isDream = me?.status === 'dream';
  const scene = room.sceneId ? getScene(room.sceneId) : null;
  const myHand = privateView.hand || [];
  const activePlayer = room.players.find((p) => p.id === room.activePlayerId);

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
      setPendingAction({ type: 'playCard', cardId });
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (!pendingAction) return;
    if (pendingAction.type === 'playCard') {
      doAction('playCard', { cardId: pendingAction.cardId, targetId });
    } else if (pendingAction.type === 'useSkill') {
      doAction('useSkill', { targetId });
    } else if (pendingAction.type === 'gift') {
      if (selectedCard) {
        doAction('gift', { cardId: selectedCard, targetId });
      }
    } else if (pendingAction.type === 'exchange') {
      if (selectedCard) {
        doAction('exchange', { cardId: selectedCard, targetId });
      }
    }
    setPendingAction(null);
    setSelectedCard(null);
  };

  const handleSkill = () => {
    if (!isMyTurn || me?.usedSkillThisTurn) return;
    const char = me?.characterId ? getCharacter(me.characterId) : null;
    // 检查技能是否需要目标
    const needsTarget = char?.skill.code !== 'timid_ghost' && char?.skill.code !== 'dream_painter' && char?.skill.code !== 'toy_repair' && char?.skill.code !== 'star_singer' && char?.skill.code !== 'naughty_dumpling';
    if (needsTarget) {
      setPendingAction({ type: 'useSkill' });
    } else {
      doAction('useSkill');
    }
  };

  const handleGift = () => {
    if (!isMyTurn || !selectedCard) return;
    setPendingAction({ type: 'gift' });
  };

  const handleExchange = () => {
    if (!isMyTurn || !selectedCard) return;
    setPendingAction({ type: 'exchange' });
  };

  const needsTarget = pendingAction !== null;
  const targetablePlayers = room.players.filter((p) => p.id !== playerId && p.status === 'active');

  const myChar = me?.characterId ? getCharacter(me.characterId) : null;

  return (
    <div className="game-screen">
      {/* 顶部栏 */}
      <div className="game-top-bar">
        <div className="game-round-info">
          <span>🎲 第 {room.round}/{room.maxRounds} 轮</span>
          {scene && (
            <div className="scene-card-display">
              {scene.icon} {scene.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-bubu)' }}>
            {activePlayer ? `轮到 ${activePlayer.name}` : ''}
          </span>
          {isMyTurn && <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>● 你的回合</span>}
        </div>
      </div>

      <div className="game-main-area">
        {/* 中央桌面 */}
        <div className="game-table-center">
          {/* 场景说明 */}
          {scene && (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-md)',
              background: `linear-gradient(135deg, ${scene.color}33, ${scene.color}11)`,
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-sm)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 4 }}>
                {scene.icon} {scene.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>{scene.rule}</div>
            </div>
          )}

          {/* 玩家面板 */}
          <div className="players-around">
            {room.players.map((p) => {
              const char = p.characterId ? getCharacter(p.characterId) : null;
              const isActive = p.id === room.activePlayerId;
              const isBonded = me?.bonds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`player-panel ${isActive ? 'active' : ''} ${p.status === 'dream' ? 'dream' : ''} ${isBonded ? 'bonded' : ''}`}
                  onClick={() => needsTarget && handleTargetSelect(p.id)}
                  style={{ cursor: needsTarget ? 'pointer' : 'default' }}
                >
                  {char && <img src={char.avatar} alt={char.name} className="player-avatar" />}
                  <div className="player-name">{p.name}{p.isBot && ' 🤖'}</div>
                  <div className="player-stats">
                    <span className="stat-vitality">❤️{p.vitality}</span>
                    <span className="stat-friendship">💕{p.friendship}</span>
                    {p.shield > 0 && <span className="stat-shield">🛡️{p.shield}</span>}
                  </div>
                  {p.status === 'dream' && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-faint)' }}>💤 梦境旁观者</div>
                  )}
                  {p.id === playerId && p.identityId && (
                    <div className="player-identity-badge" style={{
                      background: p.identityId === 'guide' ? '#4A90D9' :
                        p.identityId === 'guardian' ? '#32CD32' :
                        p.identityId === 'trickster' ? '#FF6347' : '#9370DB'
                    }}>
                      {p.identityId === 'guide' ? '引路人' :
                       p.identityId === 'guardian' ? '守护伙伴' :
                       p.identityId === 'trickster' ? '捣蛋客' : '追梦者'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 我的状态 */}
          {me && myChar && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'var(--color-bg-soft)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'auto',
            }}>
              <img src={myChar.avatar} alt={myChar.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)' }}>{myChar.name} · {myChar.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
                  技能：{myChar.skill.name} — {myChar.skill.effect.slice(0, 30)}...
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                <div className="stat-vitality">❤️ {me.vitality}/{me.maxVitality}</div>
                <div className="stat-friendship">💕 {me.friendship}/6</div>
              </div>
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="game-sidebar">
          <div className="wish-progress">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>⭐ 大心愿星修复</div>
            <div className="wish-bar">
              <div className="wish-bar-fill" style={{ width: `${(room.wishProgress / 4) * 100}%` }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)', marginTop: 4 }}>
              {room.wishProgress}/4 · 碎片 {room.wishFragments}
            </div>
          </div>

          <div className="action-log">
            <div className="action-log-title">📜 行动记录</div>
            {room.actionLog.slice(-15).reverse().map((log) => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 手牌区 */}
      <div className="hand-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <span style={{ fontFamily: 'var(--font-display)' }}>🃏 我的手牌 ({myHand.length})</span>
          {selectedCard && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-bubu)' }}>
              已选：{getCard(selectedCard)?.name} — 选择操作或点击其他牌
            </span>
          )}
        </div>

        <div className="hand-cards">
          {myHand.length === 0 && (
            <div style={{ color: 'var(--color-ink-faint)', padding: 'var(--space-lg)' }}>手牌为空</div>
          )}
          {myHand.map((cardId) => {
            const card = getCard(cardId);
            if (!card) return null;
            const isBanned = room.bannedCategory === card.category;
            return (
              <div
                key={cardId}
                className={`card card-${card.category} ${selectedCard === cardId ? 'selected' : ''} ${isBanned ? 'disabled' : ''}`}
                onClick={() => !isBanned && handleCardClick(cardId)}
                onDoubleClick={() => setShowCardDetail(card)}
              >
                {card.cost?.friendship && <div className="card-cost">💕{card.cost.friendship}</div>}
                <div className="card-name">{card.name}</div>
                <div className="card-category">{categoryName(card.category)}</div>
                <div className="card-desc">{card.description}</div>
              </div>
            );
          })}
        </div>

        {/* 操作栏 */}
        <div className="action-bar">
          <button className="action-btn action-draw" disabled={!isMyTurn || me?.hasDrawnThisTurn} onClick={() => doAction('draw')}>
            📥 抽牌
          </button>
          <button
            className="action-btn action-skill"
            disabled={!isMyTurn || me?.usedSkillThisTurn}
            onClick={handleSkill}
          >
            ✨ 技能
          </button>
          <button
            className="action-btn action-gift"
            disabled={!isMyTurn || !selectedCard}
            onClick={handleGift}
          >
            🎁 赠送
          </button>
          <button
            className="action-btn action-exchange"
            disabled={!isMyTurn || !selectedCard}
            onClick={handleExchange}
          >
            🔄 交换
          </button>
          <button className="action-btn action-defend" disabled={!isMyTurn} onClick={() => doAction('defend')}>
            🛡️ 防守
          </button>
          <button className="action-btn action-hoard" disabled={!isMyTurn} onClick={() => doAction('hoard')}>
            💫 积蓄
          </button>
          {isDream && (
            <button
              className="action-btn"
              style={{ background: '#DDA0DD', color: 'white' }}
              disabled={me?.dreamHelpUsed}
              onClick={() => {
                const target = targetablePlayers[0];
                if (target) doAction('dreamHelp', { targetId: target.id });
              }}
            >
              💤 梦境帮助
            </button>
          )}
          <button className="action-btn action-end" disabled={!isMyTurn} onClick={() => doAction('endTurn')}>
            ⏭️ 结束回合
          </button>
        </div>
      </div>

      {/* 目标选择浮层 */}
      {needsTarget && (
        <div className="target-overlay" onClick={() => { setPendingAction(null); setSelectedCard(null); }}>
          <div className="target-panel" onClick={(e) => e.stopPropagation()}>
            <div className="target-title">
              {pendingAction?.type === 'playCard' && '选择目标玩家'}
              {pendingAction?.type === 'useSkill' && '选择技能目标'}
              {pendingAction?.type === 'gift' && '选择赠送对象'}
              {pendingAction?.type === 'exchange' && '选择交换对象'}
            </div>
            <div className="target-options">
              {targetablePlayers.map((p) => {
                const char = p.characterId ? getCharacter(p.characterId) : null;
                return (
                  <div key={p.id} className="target-option" onClick={() => handleTargetSelect(p.id)}>
                    {char && <img src={char.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', verticalAlign: 'middle', marginRight: 8 }} />}
                    {p.name}
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 'var(--space-md)' }} onClick={() => { setPendingAction(null); setSelectedCard(null); }}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 卡牌详情 */}
      {showCardDetail && (
        <div className="target-overlay" onClick={() => setShowCardDetail(null)}>
          <div className="target-panel" onClick={(e) => e.stopPropagation()}>
            <div className="target-title">{showCardDetail.name}</div>
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="card-category">{categoryName(showCardDetail.category)}</span>
            </div>
            <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>{showCardDetail.description}</p>
            {showCardDetail.hint && <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>💡 {showCardDetail.hint}</p>}
            <button className="btn btn-ghost" onClick={() => setShowCardDetail(null)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
