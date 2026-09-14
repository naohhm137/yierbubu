import { useState } from 'react';
import { useGame } from '../GameContext.js';

const Icon = ({ children }: { children: string }) => <span aria-hidden="true" className="menu-icon">{children}</span>;

export function MainMenu() {
  const { playerName, setPlayerName, createRoom, joinRoom, setScreen } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [message, setMessage] = useState('');
  const startCreate = () => { if (!playerName.trim()) { setMessage('先写下你的名字，再创建房间'); return; } setMessage(''); createRoom(); };
  const handleJoin = () => { if (!joinCode.trim()) { setMessage('请输入 5 位房间号'); return; } joinRoom(joinCode.trim()); };
  return <main className="menu-screen-premium" aria-labelledby="menu-title">
    <div className="menu-content visible">
      <div className="menu-hero" aria-hidden="true"><figure className="menu-char-wrapper"><span className="menu-char-glow" /><img src="/characters/yier.png" alt="" className="menu-char menu-char-yier" /></figure><figure className="menu-char-wrapper"><span className="menu-char-glow bubu" /><img src="/characters/bubu.png" alt="" className="menu-char menu-char-bubu" /></figure></div>
      <header className="menu-title-block"><p className="menu-kicker"><Icon>✦</Icon> 私人朋友局 · 练习版本</p><h1 id="menu-title" className="menu-title-premium"><span>一二布布</span><span>萌境奇旅</span></h1><p className="menu-subtitle-premium">把友情、秘密和一点点淘气，洗进同一副牌里。</p></header>
      <section className="menu-form-premium" aria-label="房间操作"><label className="input-wrapper" htmlFor="player-name"><Icon>✎</Icon><span className="sr-only">你的名字</span><input id="player-name" className="input-premium" type="text" placeholder="输入你的名字" value={playerName} onChange={event => { setPlayerName(event.target.value); setMessage(''); }} maxLength={12} autoComplete="nickname" /></label>
        {!showJoin ? <div className="menu-buttons-premium"><button type="button" className="btn-premium btn-primary-premium" onClick={startCreate}><Icon>⌂</Icon><span>创建房间</span><span aria-hidden="true">→</span></button><button type="button" className="btn-premium btn-secondary-premium" onClick={() => { setShowJoin(true); setMessage(''); }}><Icon>↪</Icon><span>加入房间</span></button></div> : <div className="menu-join-premium"><label className="input-wrapper" htmlFor="room-code"><Icon>⌕</Icon><span className="sr-only">房间号</span><input id="room-code" className="input-premium input-code" type="text" placeholder="输入 5 位房间号" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} maxLength={5} autoComplete="off" /></label><div className="menu-buttons-premium"><button type="button" className="btn-premium btn-primary-premium" onClick={handleJoin}><Icon>↪</Icon><span>进入房间</span><span aria-hidden="true">→</span></button><button type="button" className="btn-premium btn-ghost-premium" onClick={() => { setShowJoin(false); setMessage(''); }}>返回</button></div></div>}
        {message && <p className="menu-form-message" role="alert">{message}</p>}
      </section>
      <nav className="menu-footer-links" aria-label="更多内容"><button type="button" className="footer-link" onClick={() => setScreen('rules')}><Icon>▤</Icon><span>规则说明</span></button><span className="link-divider" aria-hidden="true">·</span><button type="button" className="footer-link" onClick={() => setScreen('codex')}><Icon>✦</Icon><span>角色图鉴</span></button></nav><p className="menu-copyright">私人试玩版本 · 仅供朋友之间游玩</p>
    </div>
  </main>;
}
