import React, { useState, useMemo } from 'react';
import { useGame } from '../GameContext.js';
import { getCard, getCharacter, getScene, categoryName, type Card } from '@yierbubu/shared';
import { GameCanvas } from './three/GameCanvas.js';
import './GameTable3D.css';

type PendingAction =
  | { type: 'playCard'; cardId: string }
  | { type: 'useSkill' }
  | { type: 'gift' }
  | { type: 'exchange' }
  | null;

export function GameTable3D() {
  const { room, privateView, playerId, doAction } = useGame();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [showCardDetail, setShowCardDetail] = useState<Card | null>(null);
  const [showLog, setShowLog] = useState(false);

  if (!room || !privateView) return null;

  const me = room.players.find((p) => p.id === playerId);
  const isMyTurn = room.activePlayerId === playerId && me?.status === 'active';
  const isDream = me?.status === 'dream';
  const scene = room.sceneId ? getScene(room.sceneId) : null;
  const myHand = privateView.hand || [];
  const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
  const myChar = me?.characterId ? getCharacter(me.characterId) : null;

  const handlePlayCard = (cardId: string) => {
    if (!isMyTurn) return;
    const card = getCard(cardId);
    if (!card) return;

    // 检查是否需要目标
    const needsTarget = card.effects.some(
      (e) => e.target === 'other' || e.target === 'any'
    );

    if (needsTarget) {
      setSelectedCard(cardId);
      setPendingAction({ type: 'playCard', cardId });
    } else {
      doAction('playCard', { cardId });
      setSelectedCard(null);
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

  // 手牌转换为 Card 对象（3D 组件需要）
  const handCards = useMemo(() => {
    return myHand.map((id) => getCard(id)).filter(Boolean) as Card[];
  }, [myHand]);

  return (
    <div className="game3d-container">
      {/* 3D 主场景 */}
      <div className="game3d-canvas-wrapper">
        <GameCanvas
          room={room}
          privateView={privateView}
          onPlayCard={handlePlayCard}
          onUseSkill={handleSkill}
          onEndTurn={() => doAction('endTurn')}
        />
      </div>

      {/* 顶部 UI 覆盖层 */}
      <div className="game3d-top-bar">
        <div className="game3d-round-info">
          <span className="game3d-round">第 {room.round}/{room.maxRounds} 轮</span>
          {scene && (
            <div className="game3d-scene-badge" style={{ background: scene.color + '44' }}>
              {scene.icon} {scene.name}
            </div>
          )}
        </div>
        <div className="game3d-turn-info">
          {activePlayer && <span className="game3d-active-player">轮到 {activePlayer.name}</span>}
          {isMyTurn && <span className="game3d-my-turn">● 你的回合</span>}
        </div>
        <button className="game3d-log-btn" onClick={() => setShowLog(!showLog)}>
          📜
        </button>
      </div>

      {/* 心愿进度 — 左上角 */}
      <div className="game3d-wish-panel">
        <div className="game3d-wish-title">⭐ 大心愿星</div>
        <div className="game3d-wish-bar">
          <div className="game3d-wish-fill" style={{ width: `${(room.wishProgress / 4) * 100}%` }} />
        </div>
        <div className="game3d-wish-text">{room.wishProgress}/4 · 碎片 {room.wishFragments}</div>
      </div>

      {/* 我的状态 — 左下角 */}
      {me && myChar && (
        <div className="game3d-my-status">
          <img src={myChar.avatar} alt={myChar.name} className="game3d-my-avatar" />
          <div className="game3d-my-info">
            <div className="game3d-my-name">{myChar.name}</div>
            <div className="game3d-my-stats">
              <span className="game3d-stat-heart">❤️ {me.vitality}</span>
              <span className="game3d-stat-friend">💕 {me.friendship}/6</span>
              {me.shield > 0 && <span className="game3d-stat-shield">🛡️ {me.shield}</span>}
            </div>
          </div>
          {me.identityId && (
            <div className={`game3d-identity-badge identity-${me.identityId}`}>
              {me.identityId === 'guide' ? '引路人' :
               me.identityId === 'guardian' ? '守护伙伴' :
               me.identityId === 'trickster' ? '捣蛋客' : '追梦者'}
            </div>
          )}
        </div>
      )}

      {/* 日志面板 — 可折叠 */}
      {showLog && (
        <div className="game3d-log-panel">
          <div className="game3d-log-title">📜 行动记录</div>
          <div className="game3d-log-list">
            {room.actionLog.slice(-15).reverse().map((log) => (
              <div key={log.id} className={`game3d-log-entry game3d-log-${log.type}`}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="game3d-action-bar">
        <div className="game3d-action-hint">
          {selectedCard ? (
            <span>已选：{getCard(selectedCard)?.name} — 点击操作按钮</span>
          ) : isMyTurn ? (
            <span>点击手牌选中，或使用技能</span>
          ) : (
            <span>等待 {activePlayer?.name} 行动...</span>
          )}
        </div>
        <div className="game3d-action-buttons">
          <button
            className="game3d-btn game3d-btn-draw"
            disabled={!isMyTurn || me?.hasDrawnThisTurn}
            onClick={() => doAction('draw')}
          >
            📥 抽牌
          </button>
          <button
            className="game3d-btn game3d-btn-skill"
            disabled={!isMyTurn || me?.usedSkillThisTurn}
            onClick={handleSkill}
          >
            ✨ 技能
          </button>
          <button
            className="game3d-btn game3d-btn-gift"
            disabled={!isMyTurn || !selectedCard}
            onClick={handleGift}
          >
            🎁 赠送
          </button>
          <button
            className="game3d-btn game3d-btn-exchange"
            disabled={!isMyTurn || !selectedCard}
            onClick={handleExchange}
          >
            🔄 交换
          </button>
          <button
            className="game3d-btn game3d-btn-defend"
            disabled={!isMyTurn}
            onClick={() => doAction('defend')}
          >
            🛡️ 防守
          </button>
          <button
            className="game3d-btn game3d-btn-hoard"
            disabled={!isMyTurn}
            onClick={() => doAction('hoard')}
          >
            💫 积蓄
          </button>
          {isDream && (
            <button
              className="game3d-btn game3d-btn-dream"
              disabled={me?.dreamHelpUsed}
              onClick={() => {
                const target = targetablePlayers[0];
                if (target) doAction('dreamHelp', { targetId: target.id });
              }}
            >
              💤 梦境帮助
            </button>
          )}
          <button
            className="game3d-btn game3d-btn-end"
            disabled={!isMyTurn}
            onClick={() => doAction('endTurn')}
          >
            ⏭️ 结束回合
          </button>
        </div>
      </div>

      {/* 目标选择浮层 */}
      {needsTarget && (
        <div className="game3d-target-overlay" onClick={() => { setPendingAction(null); setSelectedCard(null); }}>
          <div className="game3d-target-panel" onClick={(e) => e.stopPropagation()}>
            <div className="game3d-target-title">
              {pendingAction?.type === 'playCard' && '选择目标玩家'}
              {pendingAction?.type === 'useSkill' && '选择技能目标'}
              {pendingAction?.type === 'gift' && '选择赠送对象'}
              {pendingAction?.type === 'exchange' && '选择交换对象'}
            </div>
            <div className="game3d-target-options">
              {targetablePlayers.map((p) => {
                const char = p.characterId ? getCharacter(p.characterId) : null;
                return (
                  <div key={p.id} className="game3d-target-option" onClick={() => handleTargetSelect(p.id)}>
                    {char && <img src={char.avatar} alt="" className="game3d-target-avatar" />}
                    <span>{p.name}</span>
                    <span className="game3d-target-stats">❤️{p.vitality} 💕{p.friendship}</span>
                  </div>
                );
              })}
            </div>
            <button className="game3d-btn game3d-btn-cancel" onClick={() => { setPendingAction(null); setSelectedCard(null); }}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 场景规则提示 */}
      {scene && (
        <div className="game3d-scene-tip">
          <strong>{scene.icon} {scene.name}</strong>
          <p>{scene.rule}</p>
        </div>
      )}
    </div>
  );
}
