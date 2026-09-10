import React, { useState } from 'react';
import { useGame } from '../GameContext.js';

export function MainMenu() {
  const { playerName, setPlayerName, createRoom, joinRoom, setScreen } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = () => {
    if (joinCode.trim()) {
      joinRoom(joinCode.trim());
    }
  };

  return (
    <div className="menu-screen">
      <div className="menu-characters">
        <img src="/characters/yier.png" alt="一二" className="menu-char" />
        <img src="/characters/bubu.png" alt="布布" className="menu-char" />
      </div>

      <h1 className="menu-title">一二布布<br />萌境奇旅</h1>
      <p className="menu-subtitle">✨ Q萌身份推理卡牌游戏 · 4-8人欢乐局 ✨</p>

      <div className="menu-form">
        <input
          className="input-cute"
          type="text"
          placeholder="输入你的名字"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={12}
        />

        {!showJoin ? (
          <div className="menu-buttons">
            <button className="btn btn-primary btn-lg" onClick={createRoom}>
              🏠 创建房间
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setShowJoin(true)}>
              🚪 加入房间
            </button>
          </div>
        ) : (
          <div className="menu-buttons">
            <input
              className="input-cute"
              type="text"
              placeholder="输入房间号"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
              style={{ letterSpacing: '4px', textAlign: 'center' }}
            />
            <button className="btn btn-primary btn-lg" onClick={handleJoin}>
              进入房间
            </button>
            <button className="btn btn-ghost" onClick={() => setShowJoin(false)}>
              返回
            </button>
          </div>
        )}
      </div>

      <div className="menu-links">
        <span className="menu-link" onClick={() => setScreen('rules')}>📖 规则说明</span>
        <span className="menu-link" onClick={() => setScreen('codex')}>🎨 角色图鉴</span>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)', marginTop: 'var(--space-md)' }}>
        私人试玩版本 · 仅供朋友之间游玩 · 不进行商业发行
      </p>
    </div>
  );
}
