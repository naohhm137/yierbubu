import React from 'react';
import { useGame } from '../GameContext.js';
import { getCharacter, getIdentity, IDENTITY_MAP } from '@yierbubu/shared';

export function ResultScreen() {
  const { room, privateView, restart, setScreen, leaveRoom } = useGame();
  if (!room || !room.winnerData) return null;

  const winner = room.winnerData;
  const myIdentity = privateView?.identityId;

  const identityColors: Record<string, string> = {
    guide: '#4A90D9',
    guardian: '#32CD32',
    trickster: '#FF6347',
    dreamer: '#9370DB',
  };

  return (
    <div className="result-screen">
      <h1 className="result-title">🎉 游戏结束 🎉</h1>

      <div className="result-card">
        <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          {winner.guideWin ? '✨ 大心愿星修复成功！' : '💔 大心愿星未能修复...'}
        </h2>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)', color: 'var(--color-ink-soft)' }}>
          心愿进度：{winner.finalWishProgress}/4 · 心愿碎片：{winner.finalFragments} · 回合数：{winner.roundReached}
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-sm)' }}>身份揭晓</h3>
        <div className="result-identities">
          {room.players.map((p) => {
            const char = p.characterId ? getCharacter(p.characterId) : null;
            const identity = p.identityId ? IDENTITY_MAP[p.identityId] : null;
            const isWinner = p.identityId ? winner.winningIdentities.includes(p.identityId as any) : false;
            return (
              <div key={p.id} className={`result-identity-item ${isWinner ? 'winner' : ''}`}>
                {char && <img src={char.avatar} alt={char.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />}
                <div style={{ fontFamily: 'var(--font-display)', marginTop: 4 }}>{p.name}</div>
                {identity && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: identityColors[p.identityId!] || 'gray',
                    fontWeight: 700,
                    marginTop: 2,
                  }}>
                    {identity.name}
                  </div>
                )}
                {isWinner && <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>🏆 胜利</div>}
              </div>
            );
          })}
        </div>

        {winner.keyEvents.length > 0 && (
          <>
            <h3 style={{ fontFamily: 'var(--font-display)', margin: 'var(--space-md) 0 var(--space-sm)' }}>关键事件</h3>
            <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
              {winner.keyEvents.slice(-5).map((evt, i) => (
                <li key={i}>{evt}</li>
              ))}
            </ul>
          </>
        )}

        {myIdentity && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-md)' }}>
            你的身份是 <strong style={{ color: identityColors[myIdentity] }}>{IDENTITY_MAP[myIdentity]?.name}</strong>
            {winner.winningIdentities.includes(myIdentity) ? '，你赢了！🎊' : '，再接再厉！'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button className="btn btn-primary btn-lg" onClick={restart}>🔄 再来一局</button>
        <button className="btn btn-ghost btn-lg" onClick={() => { leaveRoom(); setScreen('menu'); }}>🏠 返回主菜单</button>
      </div>
    </div>
  );
}
