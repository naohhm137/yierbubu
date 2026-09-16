import React, { useState, useMemo } from 'react';
import { useGame } from '../GameContext.js';
import { getCard, getCharacter, getScene, categoryName, type Card } from '@yierbubu/shared';
import { GameCanvas } from './three/GameCanvas.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { sfx } from '../utils/sfx.js';
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
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);
  const handCards = useMemo(() => (privateView?.hand ?? []).map((id) => getCard(id)).filter(Boolean) as Card[], [privateView?.hand]);
  const [screenEffect, setScreenEffect] = useState<'damage' | 'heal' | 'friendship' | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem('yierbubu_tutorial_done'); } catch { return true; }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const prevVitality = React.useRef(4);
  const prevFriendship = React.useRef(0);

  React.useEffect(() => {
    // 最长等待8秒，超时后强制显示场景（避免一直黑屏）
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLoadTimeout(true);
    }, 8000);
    // 模拟加载进度
    const progressTimer = setInterval(() => {
      setLoadProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 8;
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const handleCanvasReady = () => {
    setLoadProgress(100);
    setTimeout(() => setIsLoading(false), 300);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem('yierbubu_tutorial_done', '1'); } catch {}
  };

  // 检测活力/友情变化触发效果
  React.useEffect(() => {
    if (!room) return;
    const me = room.players.find((p) => p.id === playerId);
    if (!me) return;
    if (me.vitality < prevVitality.current) {
      setScreenEffect('damage');
      sfx.damage();
      setTimeout(() => setScreenEffect(null), 400);
    } else if (me.vitality > prevVitality.current) {
      setScreenEffect('heal');
      sfx.heal();
      setTimeout(() => setScreenEffect(null), 500);
    }
    if (me.friendship > prevFriendship.current) {
      setScreenEffect('friendship');
      sfx.friendship();
      setTimeout(() => setScreenEffect(null), 600);
    }
    prevVitality.current = me.vitality;
    prevFriendship.current = me.friendship;
  }, [room, playerId]);

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

    if (selectedCard !== cardId) {
      setSelectedCard(cardId);
      setPendingAction(null);
      sfx.click();
      return;
    }

    // 检查是否需要目标
    const needsTarget = card.effects.some((e) => e.target === 'other' || e.target === 'any');

    if (needsTarget) {
      setSelectedCard(cardId);
      setPendingAction({ type: 'playCard', cardId });
      sfx.select();
    } else {
      doAction('playCard', { cardId });
      setSelectedCard(null);
      setPendingAction(null);
      sfx.play();
    }
  };

  const handleSelectTarget = (targetId: string) => {
    if (!pendingAction) return;
    if (pendingAction.type === 'playCard') {
      doAction('playCard', { cardId: pendingAction.cardId, targetId });
      sfx.play();
    } else if (pendingAction.type === 'useSkill') {
      doAction('useSkill', { targetId });
      sfx.skill();
    } else if (pendingAction.type === 'gift') {
      if (selectedCard) doAction('gift', { cardId: selectedCard, targetId });
      sfx.friendship();
    } else if (pendingAction.type === 'exchange') {
      if (selectedCard) doAction('exchange', { cardId: selectedCard, targetId });
      sfx.click();
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

  return (
    <div className="game3d-container">
      {isLoading && (
        <div className="game3d-loading">
          <div className="game3d-loading-spinner" />
          <div className="game3d-loading-text">正在进入萌境...</div>
          <div className="game3d-loading-sub">
            {loadTimeout ? '加载时间较长，正在尝试进入...' : '加载3D场景和角色中，请稍候'}
          </div>
          <div className="game3d-loading-bar">
            <div className="game3d-loading-bar-fill" style={{ width: `${Math.min(loadProgress, 100)}%` }} />
          </div>
          <div className="game3d-loading-percent">{Math.floor(Math.min(loadProgress, 100))}%</div>
          {loadTimeout && (
            <button className="game3d-btn game3d-btn-end" style={{ marginTop: 16 }} onClick={() => setIsLoading(false)}>
              直接进入
            </button>
          )}
        </div>
      )}

      <div className="game3d-canvas-wrapper">
        <ErrorBoundary>
          <GameCanvas
            room={room}
            privateView={privateView}
            onPlayCard={handlePlayCard}
            onUseSkill={handleSkill}
            onEndTurn={() => doAction('endTurn')}
            onSelectTarget={handleSelectTarget}
            targetMode={targetMode}
            selectedCardId={selectedCard}
            onReady={handleCanvasReady}
            bannedCategory={room.bannedCategory}
          />
        </ErrorBoundary>
      </div>

      {/* 新手引导 */}
      {showTutorial && (
        <div className="game3d-tutorial-overlay" onClick={closeTutorial}>
          <div className="game3d-tutorial-box" onClick={(e) => e.stopPropagation()}>
            <div className="game3d-tutorial-title">🌟 欢迎来到萌境奇旅！</div>
            <div className="game3d-tutorial-steps">
              <div className={`game3d-tutorial-step ${tutorialStep >= 0 ? 'active' : ''}`}>
                <span className="step-num">1</span>
                <span>点击「📥 抽牌」获得新卡牌</span>
              </div>
              <div className={`game3d-tutorial-step ${tutorialStep >= 1 ? 'active' : ''}`}>
                <span className="step-num">2</span>
                <span>点击手牌选中，再次点击打出（部分牌需选目标）</span>
              </div>
              <div className={`game3d-tutorial-step ${tutorialStep >= 2 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>点击「✨ 技能」使用角色专属技能</span>
              </div>
              <div className={`game3d-tutorial-step ${tutorialStep >= 3 ? 'active' : ''}`}>
                <span className="step-num">4</span>
                <span>拖拽屏幕可360°旋转视角，观察其他玩家</span>
              </div>
              <div className={`game3d-tutorial-step ${tutorialStep >= 4 ? 'active' : ''}`}>
                <span className="step-num">5</span>
                <span>完成行动后点击「⏭️ 结束回合」</span>
              </div>
            </div>
            <div className="game3d-tutorial-tip">
              💡 目标：修复大心愿星！注意隐藏身份，小心捣蛋客！
            </div>
            <button className="game3d-btn game3d-btn-primary" onClick={closeTutorial}>
              开始游戏！
            </button>
          </div>
        </div>
      )}

      {/* 屏幕效果反馈 */}
      {screenEffect && (
        <div className={`game3d-screen-effect game3d-effect-${screenEffect}`} />
      )}

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
            <div className="game3d-target-options">
              {room.players.filter(p => p.status === 'active' && (p.id !== playerId || (pendingAction?.type === 'playCard' && getCard(pendingAction.cardId)?.effects.some(e => e.target === 'any')))).map(p => <button key={p.id} onClick={() => handleSelectTarget(p.id)}>{p.name}</button>)}
            </div>
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
          <button className="game3d-icon-btn" onClick={() => { sfx.toggleBgm(); }} title="背景音乐">🎵</button>
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

      {/* 卡牌详情弹窗 — 选中卡牌时显示 */}
      {selectedCard && !targetMode && (
        <div className="game3d-card-detail">
          {(() => {
            const card = getCard(selectedCard);
            if (!card) return null;
            const catNames: Record<string, string> = { interact: '互动牌', guard: '守护牌', vitality: '活力牌', adventure: '奇遇牌', item: '道具牌', friendship: '友情牌' };
            return (
              <>
                <div className="game3d-card-detail-name">{card.name}</div>
                <div className="game3d-card-detail-cat">{catNames[card.category] || '卡牌'}</div>
                <div className="game3d-card-detail-desc">{card.description}</div>
                {card.cost?.friendship ? <div className="game3d-card-detail-cost">消耗 💕 {card.cost.friendship}</div> : null}
                <div className="game3d-card-detail-hint">再次点击打出 · 或选择操作</div>
              </>
            );
          })()}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="game3d-hand" aria-label="你的手牌">
        {handCards.map((card,index) => <button key={`${card.id}-${index}`} className={`game3d-hand-card ${selectedCard === card.id ? 'selected' : ''}`} aria-pressed={selectedCard === card.id} disabled={!isMyTurn} onClick={() => handlePlayCard(card.id)}>
          <strong>{card.name}</strong><small>{categoryName(card.category)}</small><span>{card.description}</span>
        </button>)}
      </div>
      <div className="game3d-action-bar">
        <div className="game3d-action-hint">
          {targetMode ? (
            <span className="game3d-hint-target">选择角色或上方名字，点击“取消”退出</span>
          ) : selectedCard ? (
            <span>已选：{getCard(selectedCard)?.name} — 再次点击打出，或选择操作</span>
          ) : isMyTurn ? (
            <span>点击手牌选中，或使用技能</span>
          ) : (
            <span>等待 {activePlayer?.name} 行动...</span>
          )}
        </div>
        <div className="game3d-action-buttons">
          <div className="game3d-action-primary">
            {selectedCard && !targetMode && (
              <button className="game3d-btn game3d-btn-end game3d-btn-primary" onClick={() => handlePlayCard(selectedCard)}>
                🎴 打出所选
              </button>
            )}
            <button className="game3d-btn game3d-btn-draw" disabled={!isMyTurn || me?.hasDrawnThisTurn} onClick={() => { doAction('draw'); sfx.draw(); }}>
              📥 抽牌
            </button>
            <button className="game3d-btn game3d-btn-skill" disabled={!isMyTurn || me?.usedSkillThisTurn} onClick={() => { setShowSkillDetail(true); sfx.click(); }}>
              ✨ 技能
            </button>
          </div>
          <div className="game3d-action-secondary">
            <button className="game3d-btn game3d-btn-gift game3d-btn-sm" disabled={!isMyTurn || !selectedCard} onClick={handleGift}>
              🎁
            </button>
            <button className="game3d-btn game3d-btn-exchange game3d-btn-sm" disabled={!isMyTurn || !selectedCard} onClick={handleExchange}>
              🔄
            </button>
            <button className="game3d-btn game3d-btn-defend game3d-btn-sm" disabled={!isMyTurn} onClick={() => { doAction('defend'); sfx.click(); }}>
              🛡️
            </button>
            <button className="game3d-btn game3d-btn-hoard game3d-btn-sm" disabled={!isMyTurn} onClick={() => { doAction('hoard'); sfx.click(); }}>
              💫
            </button>
            {isDream && (
              <button className="game3d-btn game3d-btn-dream game3d-btn-sm" disabled={me?.dreamHelpUsed} onClick={() => {
                const target = room.players.find((p) => p.id !== playerId && p.status === 'active');
                if (target) doAction('dreamHelp', { targetId: target.id });
              }}>
                💤
              </button>
            )}
          </div>
          <button className="game3d-btn game3d-btn-end game3d-btn-primary" disabled={!isMyTurn} onClick={() => { doAction('endTurn'); sfx.click(); }}>
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
