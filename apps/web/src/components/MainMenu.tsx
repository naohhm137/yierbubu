import { useRef, useState } from 'react';
import { useGame } from '../GameContext.js';
import './MainMenu.css';

export function MenuIcon({ name }: { name: 'name' | 'home' | 'join' | 'arrow' | 'book' | 'bears' | 'play' | 'back' }) {
  const paths = {
    name: <><path d="M16 3l5 5L9 20H4v-5L16 3z" /><path d="M14 5l5 5" /></>,
    home: <><path d="M3 10l9-7 9 7M5 9v12h14V9" /><path d="M9 21v-8h6v8" /></>,
    join: <><path d="M13 3h7v18h-7M3 12h12M10 7l5 5-5 5" /></>,
    arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
    book: <><path d="M12 5v16M12 5C9 3 6 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-3-1-6-1-9 1z" /></>,
    bears: <><path d="M6 7a3 3 0 1 1 4-4M14 3a3 3 0 1 1 4 4" /><path d="M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" /><path d="M8 12h.01M16 12h.01M11 15h2l-1 1z" /></>,
    play: <path d="M8 4l12 8-12 8V4z" />,
    back: <path d="M20 12H4M10 6l-6 6 6 6" />,
  };
  return <svg className="menu-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function MainMenu() {
  const { playerName, setPlayerName, createRoom, quickPractice, preparingPractice, joinRoom, setScreen, connected } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [message, setMessage] = useState('');
  const [coverSrc, setCoverSrc] = useState('/studio/duo-cover.webp');
  const nameInput = useRef<HTMLInputElement>(null);
  const unavailable = !connected || preparingPractice;

  const validateName = () => {
    if (playerName.trim()) return true;
    setMessage('先写下你的名字，再和朋友一起入座');
    nameInput.current?.focus();
    return false;
  };
  const submitRoom = (event: React.FormEvent) => {
    event.preventDefault();
    if (unavailable || !validateName()) return;
    if (showJoin && !joinCode.trim()) { setMessage('请输入朋友分享的房间号'); return; }
    setMessage('');
    if (showJoin) joinRoom(joinCode.trim());
    else createRoom();
  };

  return (
    <main className="menu-screen-premium tea-menu" aria-labelledby="menu-title">
      <div className="menu-shell">
        <section className="menu-visual" aria-label="一二布布的花园茶会">
          <div className="menu-visual-frame">
            <img src={coverSrc} alt="一二和布布在花园里准备了一场温暖的茶会" width="1200" height="900"
              onError={() => { if (coverSrc !== '/characters/yierbubu_cover.jpg') setCoverSrc('/characters/yierbubu_cover.jpg'); }} />
          </div>
          <p className="menu-visual-caption">茶已经泡好，给你留了一个位置。</p>
        </section>

        <section className="menu-content">
          <header className="menu-title-block">
            <h1 id="menu-title" className="menu-title-premium"><span>一二布布</span><span>萌境奇旅</span></h1>
            <p className="menu-subtitle-premium">围坐一桌，交换好牌与小秘密。<br />陪一二和布布，把心愿慢慢拼完整。</p>
          </header>

          <form className="menu-form-premium" aria-label="房间操作" onSubmit={submitRoom}>
            <label className="menu-field-label" htmlFor="player-name">茶会怎么称呼你？</label>
            <div className="input-wrapper">
              <MenuIcon name="name" />
              <input ref={nameInput} id="player-name" className="input-premium" type="text" placeholder="你的名字"
                value={playerName} onChange={event => { setPlayerName(event.target.value); setMessage(''); }}
                maxLength={12} autoComplete="nickname" disabled={preparingPractice} aria-describedby={message ? 'menu-message' : undefined} />
            </div>
            {!showJoin ? <>
              <button type="button" className="btn-premium btn-primary-premium menu-practice" disabled={unavailable}
                onClick={() => { setMessage(''); quickPractice(); }} aria-busy={preparingPractice}>
                <MenuIcon name="play" /><span>{preparingPractice ? '正在准备茶会…' : '先练习一局'}</span><MenuIcon name="arrow" />
              </button>
              <p className="menu-practice-note" role="status">{preparingPractice ? '正在邀请四位机器人朋友入座' : '一人也能开局 · 四位机器人陪你熟悉玩法'}</p>
              <div className="menu-buttons-premium">
                <button type="submit" className="btn-premium btn-secondary-premium" disabled={unavailable}><MenuIcon name="home" /><span>创建朋友局</span></button>
                <button type="button" className="btn-premium btn-secondary-premium" disabled={unavailable} onClick={() => { setShowJoin(true); setMessage(''); }}><MenuIcon name="join" /><span>加入房间</span></button>
              </div>
            </> : <div className="menu-join-premium">
              <label className="menu-field-label" htmlFor="room-code">朋友分享的房间号</label>
              <div className="input-wrapper">
                <MenuIcon name="home" />
                <input id="room-code" className="input-premium input-code" type="text" placeholder="输入房间号" value={joinCode}
                  onChange={event => { setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setMessage(''); }}
                  maxLength={8} autoComplete="off" autoFocus />
              </div>
              <div className="menu-buttons-premium">
                <button type="submit" className="btn-premium btn-primary-premium" disabled={unavailable}><MenuIcon name="join" /><span>进入房间</span></button>
                <button type="button" className="btn-premium btn-ghost-premium" onClick={() => { setShowJoin(false); setMessage(''); }}>返回</button>
              </div>
            </div>}
            {message && <p id="menu-message" className="menu-form-message" role="alert">{message}</p>}
          </form>

          <nav className="menu-footer-links" aria-label="更多内容">
            <button type="button" className="footer-link" disabled={preparingPractice} onClick={() => setScreen('rules')}><MenuIcon name="book" /><span>怎么玩</span></button>
            <button type="button" className="footer-link" disabled={preparingPractice} onClick={() => setScreen('codex')}><MenuIcon name="bears" /><span>双熊图鉴</span></button>
          </nav>
          <p className="menu-copyright">私人试玩 · 和朋友一起游玩</p>
        </section>
      </div>
    </main>
  );
}
