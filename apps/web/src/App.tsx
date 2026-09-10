import React from 'react';
import { GameProvider, useGame } from './GameContext.js';
import { MainMenu } from './components/MainMenu.js';
import { Lobby } from './components/Lobby.js';
import { GameTable3D } from './components/GameTable3D.js';
import { ResultScreen } from './components/ResultScreen.js';
import { RulesPage } from './components/RulesPage.js';
import { CodexPage } from './components/CodexPage.js';
import './styles.css';

function Background() {
  const elements = ['⭐', '☁️', '🎀', '✨', '🍬', '🌈', '💫', '🎈'];
  return (
    <div className="app-bg">
      {elements.map((emoji, i) => (
        <div
          key={i}
          className="floating-element"
          style={{
            left: `${(i * 13 + 5) % 95}%`,
            top: `${(i * 17 + 10) % 85}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${5 + (i % 3)}s`,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { screen, error, connected } = useGame();

  return (
    <>
      {screen !== 'game' && <Background />}
      {error && <div className="error-toast">⚠️ {error}</div>}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50 }}>
        <div className="connection-status">
          <span className={`connection-dot ${connected ? '' : 'disconnected'}`} />
          {connected ? '已连接' : '连接中...'}
        </div>
      </div>
      {screen === 'menu' && <MainMenu />}
      {screen === 'lobby' && <Lobby />}
      {screen === 'game' && <GameTable3D />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'rules' && <RulesPage />}
      {screen === 'codex' && <CodexPage />}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
