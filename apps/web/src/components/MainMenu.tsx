import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../GameContext.js';

export function MainMenu() {
  const { playerName, setPlayerName, createRoom, joinRoom, setScreen } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoin = () => {
    if (joinCode.trim()) {
      joinRoom(joinCode.trim());
    }
  };

  // 生成漂浮星星
  const stars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 3,
  }));

  return (
    <div className="menu-screen-premium">
      {/* 动态背景层 */}
      <div className="menu-bg-gradient" />
      <div className="menu-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* 漂浮星星 */}
      <div className="menu-stars">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star-particle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className={`menu-content ${mounted ? 'visible' : ''}`}>
        {/* 角色展示区 */}
        <div className="menu-hero">
          <div className="menu-char-wrapper">
            <div className="menu-char-glow" />
            <img src="/characters/yier.png" alt="一二" className="menu-char menu-char-yier" />
          </div>
          <div className="menu-char-wrapper">
            <div className="menu-char-glow bubu" />
            <img src="/characters/bubu.png" alt="布布" className="menu-char menu-char-bubu" />
          </div>
        </div>

        {/* 标题 */}
        <div className="menu-title-block">
          <h1 className="menu-title-premium">
            <span className="title-line-1">一二布布</span>
            <span className="title-line-2">萌境奇旅</span>
          </h1>
          <div className="menu-divider">
            <span className="divider-star">✦</span>
          </div>
          <p className="menu-subtitle-premium">
            Q萌身份推理卡牌游戏 · 4-8人欢乐局
          </p>
        </div>

        {/* 表单区 */}
        <div className="menu-form-premium">
          <div className="input-wrapper">
            <span className="input-icon">✏️</span>
            <input
              className="input-premium"
              type="text"
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
          </div>

          {!showJoin ? (
            <div className="menu-buttons-premium">
              <button className="btn-premium btn-primary-premium" onClick={createRoom}>
                <span className="btn-icon">🏠</span>
                <span className="btn-text">创建房间</span>
                <span className="btn-shine" />
              </button>
              <button className="btn-premium btn-secondary-premium" onClick={() => setShowJoin(true)}>
                <span className="btn-icon">🚪</span>
                <span className="btn-text">加入房间</span>
                <span className="btn-shine" />
              </button>
            </div>
          ) : (
            <div className="menu-join-premium">
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  className="input-premium input-code"
                  type="text"
                  placeholder="房间号"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={5}
                />
              </div>
              <div className="menu-buttons-premium">
                <button className="btn-premium btn-primary-premium" onClick={handleJoin}>
                  <span className="btn-text">进入房间</span>
                </button>
                <button className="btn-premium btn-ghost-premium" onClick={() => setShowJoin(false)}>
                  <span className="btn-text">返回</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部链接 */}
        <div className="menu-footer-links">
          <button className="footer-link" onClick={() => setScreen('rules')}>
            <span className="link-icon">📖</span>
            <span>规则说明</span>
          </button>
          <span className="link-divider">·</span>
          <button className="footer-link" onClick={() => setScreen('codex')}>
            <span className="link-icon">🎨</span>
            <span>角色图鉴</span>
          </button>
        </div>

        <p className="menu-copyright">
          私人试玩版本 · 仅供朋友之间游玩 · 不进行商业发行
        </p>
      </div>
    </div>
  );
}
