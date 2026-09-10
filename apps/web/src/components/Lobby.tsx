import React from 'react';
import { useGame } from '../GameContext.js';
import { getCharacter } from '@yierbubu/shared';

export function Lobby() {
  const { room, roomId, playerId, leaveRoom, setReady, fillBots, removeBot, startGame } = useGame();
  if (!room) return null;

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const allReady = room.players.every((p) => p.ready || p.isBot);
  const canStart = isHost && room.players.length >= 4;

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>← 离开</button>
        <div className="room-code-display">
          🏠 {roomId}
        </div>
        <div style={{ width: 80 }} />
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
        房间大厅 ({room.players.length}/8)
      </h2>

      <div className="lobby-players">
        {room.players.map((p) => {
          const char = p.characterId ? getCharacter(p.characterId) : null;
          return (
            <div key={p.id} className={`lobby-player-card ${p.ready ? 'ready' : ''} ${p.id === room.hostId ? 'is-host' : ''}`}>
              {char ? (
                <img src={char.avatar} alt={char.name} className="lobby-player-avatar" />
              ) : (
                <div className="lobby-player-avatar" style={{
                  background: 'var(--color-bg-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem',
                }}>❓</div>
              )}
              <div className="lobby-player-name">{p.name}{p.isBot && ' 🤖'}</div>
              <div className={`lobby-player-status ${p.ready ? 'ready' : ''}`}>
                {p.ready ? '✓ 已准备' : '等待中...'}
              </div>
              {p.isBot && isHost && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 8, padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={() => removeBot(p.id)}
                >移除</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="lobby-controls">
        {!me?.ready && !isHost && (
          <button className="btn btn-primary btn-lg" onClick={() => setReady(true)}>
            ✓ 准备
          </button>
        )}
        {me?.ready && !isHost && (
          <button className="btn btn-ghost btn-lg" onClick={() => setReady(false)}>
            取消准备
          </button>
        )}
        {isHost && (
          <>
            <button className="btn btn-secondary" onClick={() => fillBots(1)} disabled={room.players.length >= 8}>
              🤖 +1 机器人
            </button>
            <button className="btn btn-secondary" onClick={() => fillBots(3)} disabled={room.players.length >= 6}>
              🤖 +3 机器人
            </button>
            <button
              className={`btn btn-warm btn-lg ${canStart ? '' : ''}`}
              onClick={startGame}
              disabled={!canStart}
            >
              🎮 开始游戏
            </button>
          </>
        )}
      </div>

      {isHost && room.players.length < 4 && (
        <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem' }}>
          至少需要 4 名玩家才能开始（可添加机器人补位）
        </p>
      )}
    </div>
  );
}
