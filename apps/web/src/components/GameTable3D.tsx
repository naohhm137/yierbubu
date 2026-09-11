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
  const [showRules, setShowRules] = useState(false);
  const [showSkillDetail, setShowSkillDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // 回合切换提示
  React.useEffect(() => {
    if (room && room.activePlayerId === playerId) {
      setTurnBanner('轮到你了！');
      const t = setTimeout(() => setTurnBanner(null), 2500);
      return () => clearTimeout(t);
    }
  }, [room?.activePlayerId, playerId]);

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

    // 如果已选中同一张牌，取消选中
    if (selectedCard === cardId) {
      setSelectedCard(null);
      setPendingAction(null);
      return;
    }

    // 检查是否需要目标
    const needsTarget = card.effects.some((e) => e.target === 'other' || e.target === 'any');

    if (needsTarget) {
      setSelectedCard(cardId);
      setPendingAction({ type: 'playCard', cardId });
    } else {
      doAction('playCard', { cardId });
      setSelectedCard(null);
      setPendingAction(null);
    }
  };

  const handleSelectTarget = (targetId: string) => {
    if (!pendingAction) return;
    if (pendingAction.type === 'playCard') {
      doAction('playCard', { cardId: pendingAction.cardId, targetId });
    } else if (pendingAction.type === 'useSkill') {
      doAction('useSkill', { targetId });
    } else if (pendingAction.type === 'gift') {
      if (selectedCard) doAction('gift', { cardId: selectedCard, targetId });
    } else if (pendingAction.type === 'exchange') {
      if (selectedCard) doAction('exchange', { cardId: selectedCard, targetId });
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

  const cancelTarget = () => {
    setPendingAction(null);
    setSelectedCard(null);
  };

  const targetMode = pendingAction !== null;

  const handCards = useMemo(() => myHand.map((id) => getCard(id)).filter(Boolean) as Card[], [myHand]);

  return (
    <div className="game3d-container">
      {isLoading && (
        <div className="game3d-loading">
          <div className="game3d-loading-spinner" />
          <div className="game3d-loading-text">正在进入萌境...</div>
          <div className="game3d-loading-sub">加载3D场景和角色中</div>
        </div>
      )}

      <div className="game3d-canvas-wrapper">
        <GameCanvas
          room={room}
          privateView={privateView}
          onPlayCard={handlePlayCard}
          onUseSkill={handleSkill}
          onEndTurn={() => doAction('endTurn')}
          onSelectTarget={handleSelectTarget}
          targetMode={targetMode}
          selectedCardId={selectedCard}
        />
      </div>

      {/* 回合横幅 */}
      {turnBanner && (
        <div className="game3d-turn-banner">
          <span className="game3d-turn-banner-text">{turnBanner}</span>
        </div>
      )}

      {/* 目标选择提示 */}
      {targetMode && (
        <div className="game3d-target-hint" onClick={cancelTarget}>
          <div className="game3d-target-hint-text" onClick={(e) => e.stopPropagation()}>
            {pendingAction?.type === 'playCard' && '🎯 点击3D角色选择目标'}
            {pendingAction?.type === 'useSkill' && '✨ 点击3D角色选择技能目标'}
            {pendingAction?.type === 'gift' && '🎁 点击3D角色选择赠送对象'}
            {pendingAction?.type === 'exchange' && '🔄 点击3D角色选择交换对象'}
            <button className="game3d-target-cancel-btn" onClick={cancelTarget}>取消</button>
          </div>
        </div>
      )}

      {/* 顶部 UI */}
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
        <div className="game3d-top-btns">
          <button className="game3d-icon-btn" onClick={() => setShowLog(!showLog)} title="行动记录">📜</button>
          <button className="game3d-icon-btn" onClick={() => setShowRules(!showRules)} title="规则">❓</button>
        </div>
      </div>

      {/* 心愿进度 */}
      <div className="game3d-wish-panel">
        <div className="game3d-wish-title">⭐ 大心愿星</div>
        <div className="game3d-wish-bar">
          <div className="game3d-wish-fill" style={{ width: `${(room.wishProgress / 4) * 100}%` }} />
        </div>
        <div className="game3d-wish-text">{room.wishProgress}/4 · 碎片 {room.wishFragments}</div>
      </div>

      {/* 我的状态 */}
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
              {me.identityId === 'guide' ? '引路人' : me.identityId === 'guardian' ? '守护伙伴' : me.identityId === 'trickster' ? '捣蛋客' : '追梦者'}
            </div>
          )}
        </div>
      )}

      {/* 日志面板 */}
      {showLog && (
        <div className="game3d-log-panel">
          <div className="game3d-log-title">📜 行动记录</div>
          <div className="game3d-log-list">
            {room.actionLog.slice(-15).reverse().map((log) => (
              <div key={log.id} className={`game3d-log-entry game3d-log-${log.type}`}>{log.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* 规则面板 */}
      {showRules && (
        <div className="game3d-rules-panel">
          <div className="game3d-rules-header">
            <div className="game3d-rules-title">📖 快速规则</div>
            <button className="game3d-rules-close" onClick={() => setShowRules(false)}>✕</button>
          </div>
          <div className="game3d-rules-content">
            <div className="game3d-rule-item"><strong>🎯 目标</strong><p>修复大心愿星（完成4个心愿任务），或阻止修复。每个身份有不同胜利条件。</p></div>
            <div className="game3d-rule-item"><strong>🔄 回合</strong><p>每回合：翻场景牌 → 补手牌 → 依次行动。你的回合可以抽牌、出牌、用技能、赠送/交换卡牌。</p></div>
            <div className="game3d-rule-item"><strong>❤️ 活力</strong><p>活力归零进入"梦境旁观者"状态，仍可每轮帮助一次。</p></div>
            <div className="game3d-rule-item"><strong>💕 友情值</strong><p>帮助他人获得友情值（上限6），可用于发动强力技能、抵消负面效果、救回队友。</p></div>
            <div className="game3d-rule-item"><strong>🎭 身份</strong><p>引路人：修复心愿星 | 守护伙伴：保护引路人 | 捣蛋客：阻止修复 | 追梦者：完成个人秘密目标</p></div>
            <div className="game3d-rule-item"><strong>✨ 技能</strong><p>每个角色有独特技能，每回合可用一次。点击"技能"按钮后选择目标。</p></div>
            <div className="game3d-rule-item"><strong>🖱️ 操作</strong><p>点击手牌选中（金色高亮），再次点击打出。需要目标的牌会进入目标选择模式，点击3D角色即可。拖动屏幕可360°旋转视角。</p></div>
          </div>
        </div>
      )}

      {/* 技能详情弹窗 */}
      {showSkillDetail && myChar && (
        <div className="game3d-skill-popup" onClick={() => setShowSkillDetail(false)}>
          <div className="game3d-skill-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="game3d-skill-popup-name">✨ {myChar.skill.name}</div>
            <div className="game3d-skill-popup-desc">{myChar.skill.effect}</div>
            <div className="game3d-skill-popup-cost">
              {myChar.skill.cost ? `消耗：${myChar.skill.cost}` : '无消耗'}
              {myChar.skill.cooldown ? ` · ${myChar.skill.cooldown}` : ' · 每回合1次'}
            </div>
            <button className="game3d-btn game3d-btn-skill" onClick={() => { handleSkill(); setShowSkillDetail(false); }} disabled={!isMyTurn || me?.usedSkillThisTurn}>
              {me?.usedSkillThisTurn ? '本回合已用' : '使用技能'}
            </button>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="game3d-action-bar">
        <div className="game3d-action-hint">
          {targetMode ? (
            <span className="game3d-hint-target">👆 点击3D角色选择目标，或点击空白处取消</span>
          ) : selectedCard ? (
            <span>已选：{getCard(selectedCard)?.name} — 再次点击打出，或选择操作</span>
          ) : isMyTurn ? (
            <span>点击手牌选中，或使用技能</span>
          ) : (
            <span>等待 {activePlayer?.name} 行动...</span>
          )}
        </div>
        <div className="game3d-action-buttons">
          <button className="game3d-btn game3d-btn-draw" disabled={!isMyTurn || me?.hasDrawnThisTurn} onClick={() => doAction('draw')}>
            📥 抽牌
          </button>
          <button className="game3d-btn game3d-btn-skill" disabled={!isMyTurn || me?.usedSkillThisTurn} onClick={() => setShowSkillDetail(true)}>
            ✨ 技能
          </button>
          <button className="game3d-btn game3d-btn-gift" disabled={!isMyTurn || !selectedCard} onClick={handleGift}>
            🎁 赠送
          </button>
          <button className="game3d-btn game3d-btn-exchange" disabled={!isMyTurn || !selectedCard} onClick={handleExchange}>
            🔄 交换
          </button>
          <button className="game3d-btn game3d-btn-defend" disabled={!isMyTurn} onClick={() => doAction('defend')}>
            🛡️ 防守
          </button>
          <button className="game3d-btn game3d-btn-hoard" disabled={!isMyTurn} onClick={() => doAction('hoard')}>
            💫 积蓄
          </button>
          {isDream && (
            <button className="game3d-btn game3d-btn-dream" disabled={me?.dreamHelpUsed} onClick={() => {
              const target = room.players.find((p) => p.id !== playerId && p.status === 'active');
              if (target) doAction('dreamHelp', { targetId: target.id });
            }}>
              💤 梦境帮助
            </button>
          )}
          <button className="game3d-btn game3d-btn-end" disabled={!isMyTurn} onClick={() => doAction('endTurn')}>
            ⏭️ 结束回合
          </button>
        </div>
      </div>

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
