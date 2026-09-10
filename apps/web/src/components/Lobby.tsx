import React, { useState } from 'react';
import { useGame } from '../GameContext.js';
import { getCharacter, CHARACTERS } from '@yierbubu/shared';

export function Lobby() {
  const { room, roomId, playerId, leaveRoom, setReady, fillBots, removeBot, startGame, setScreen } = useGame();
  const [showCharSelect, setShowCharSelect] = useState(false);
  if (!room) return null;

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const canStart = isHost && room.players.length >= 4;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId || '');
  };

  return (
    <div className="lobby-screen-premium">
      {/* 背景 */}
      <div className="lobby-bg" />

      <div className="lobby-content">
        {/* 顶部栏 */}
        <div className="lobby-topbar">
          <button className="lobby-back-btn" onClick={leaveRoom}>
            ← 离开
          </button>
          <div className="lobby-room-code" onClick={copyRoomCode}>
            <span className="room-code-label">房间号</span>
            <span className="room-code-value">{roomId}</span>
            <span className="room-code-copy">📋</span>
          </div>
          <button className="lobby-rules-btn" onClick={() => setScreen('rules')}>
            📖 规则
          </button>
        </div>

        {/* 标题 */}
        <div className="lobby-title-block">
          <h2 className="lobby-title">萌境牌局</h2>
          <p className="lobby-subtitle">{room.players.length}/8 名玩家已加入</p>
        </div>

        {/* 玩家网格 */}
        <div className="lobby-players-grid">
          {room.players.map((p) => {
            const char = p.characterId ? getCharacter(p.characterId) : null;
            const isMe = p.id === playerId;
            return (
              <div
                key={p.id}
                className={`lobby-player-card-premium ${p.ready ? 'ready' : ''} ${isMe ? 'is-me' : ''} ${p.id === room.hostId ? 'is-host' : ''}`}
              >
                {/* 房主标记 */}
                {p.id === room.hostId && <div className="player-host-badge">👑</div>}

                {/* 头像 */}
                <div className="player-avatar-container">
                  {char ? (
                    <img src={char.avatar} alt={char.name} className="player-avatar" />
                  ) : (
                    <div className="player-avatar player-avatar-empty">
                      <span>?</span>
                    </div>
                  )}
                  {p.ready && <div className="player-ready-check">✓</div>}
                </div>

                {/* 信息 */}
                <div className="player-info">
                  <div className="player-name">
                    {p.name}{p.isBot && ' 🤖'}
                    {isMe && <span className="player-me-tag">我</span>}
                  </div>
                  <div className="player-char-name">
                    {char ? char.name : '未选择角色'}
                  </div>
                  <div className={`player-status ${p.ready ? 'ready' : ''}`}>
                    {p.ready ? '已准备' : '等待中'}
                  </div>
                </div>

                {/* 移除机器人 */}
                {p.isBot && isHost && (
                  <button className="player-remove-btn" onClick={() => removeBot(p.id)}>
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* 空位 */}
          {Array.from({ length: Math.max(0, 8 - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="lobby-player-card-premium empty-slot">
              <div className="empty-slot-icon">+</div>
              <div className="empty-slot-text">等待加入</div>
            </div>
          ))}
        </div>

        {/* 底部控制 */}
        <div className="lobby-bottom-controls">
          {!isHost && (
            <>
              {!me?.ready ? (
                <button className="btn-premium btn-primary-premium btn-ready" onClick={() => setReady(true)}>
                  ✓ 准备
                </button>
              ) : (
                <button className="btn-premium btn-ghost-premium btn-ready" onClick={() => setReady(false)}>
                  取消准备
                </button>
              )}
            </>
          )}

          {isHost && (
            <div className="host-controls">
              <div className="bot-buttons">
                <button className="btn-premium btn-secondary-premium btn-sm" onClick={() => fillBots(1)} disabled={room.players.length >= 8}>
                  🤖 +1
                </button>
                <button className="btn-premium btn-secondary-premium btn-sm" onClick={() => fillBots(3)} disabled={room.players.length >= 6}>
                  🤖 +3
                </button>
              </div>
              <button
                className={`btn-premium btn-primary-premium btn-start ${canStart ? '' : 'disabled'}`}
                onClick={startGame}
                disabled={!canStart}
              >
                🎮 开始游戏
              </button>
            </div>
          )}
        </div>

        {isHost && room.players.length < 4 && (
          <p className="lobby-hint">
            至少需要 4 名玩家才能开始（可添加机器人补位）
          </p>
        )}
      </div>
    </div>
  );
}
