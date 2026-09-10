import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from './socket.js';
import type {
  PublicRoomView, PrivatePlayerView, ActionType, ActionParams,
  Character, Card,
} from '@yierbubu/shared';
import { CHARACTERS, CARDS } from '@yierbubu/shared';

export type Screen = 'menu' | 'lobby' | 'game' | 'rules' | 'codex' | 'result';

interface GameContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  roomId: string | null;
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  room: PublicRoomView | null;
  privateView: PrivatePlayerView | null;
  error: string | null;
  clearError: () => void;
  characters: Character[];
  cards: Card[];
  // 操作
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  fillBots: (count: number) => void;
  removeBot: (playerId: string) => void;
  selectCharacter: (characterId: string) => void;
  startGame: () => void;
  doAction: (action: ActionType, params?: ActionParams) => void;
  restart: () => void;
  connected: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState<PublicRoomView | null>(null);
  const [privateView, setPrivateView] = useState<PrivatePlayerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id ?? null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('roomCreated', (data: { roomId: string }) => {
      setRoomId(data.roomId);
      setScreen('lobby');
    });
    socket.on('roomState', (data: { public: PublicRoomView; private?: PrivatePlayerView }) => {
      setRoom(data.public);
      if (data.private) setPrivateView(data.private);
      if (data.public.phase === 'playing' && screen !== 'game' && screen !== 'result') {
        setScreen('game');
      }
      if (data.public.phase === 'finished') {
        setScreen('result');
      }
    });
    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3500);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomCreated');
      socket.off('roomState');
      socket.off('error');
    };
  }, [screen]);

  const clearError = useCallback(() => setError(null), []);

  const createRoom = useCallback(() => {
    if (!playerName.trim()) { setError('请输入你的名字'); return; }
    socketRef.current.emit('createRoom', { playerName: playerName.trim() });
  }, [playerName]);

  const joinRoom = useCallback((id: string) => {
    if (!playerName.trim()) { setError('请输入你的名字'); return; }
    socketRef.current.emit('joinRoom', { roomId: id, playerName: playerName.trim() });
    setRoomId(id.toUpperCase());
    setScreen('lobby');
  }, [playerName]);

  const leaveRoom = useCallback(() => {
    socketRef.current.emit('leaveRoom');
    setRoomId(null);
    setRoom(null);
    setPrivateView(null);
    setScreen('menu');
  }, []);

  const setReady = useCallback((ready: boolean) => {
    socketRef.current.emit('setReady', { ready });
  }, []);

  const fillBots = useCallback((count: number) => {
    socketRef.current.emit('fillBots', { count });
  }, []);

  const removeBot = useCallback((pid: string) => {
    socketRef.current.emit('removeBot', { playerId: pid });
  }, []);

  const selectCharacter = useCallback((characterId: string) => {
    socketRef.current.emit('selectCharacter', { characterId });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current.emit('startGame');
  }, []);

  const doAction = useCallback((action: ActionType, params: ActionParams = {}) => {
    socketRef.current.emit('action', { action, params });
  }, []);

  const restart = useCallback(() => {
    socketRef.current.emit('restart');
  }, []);

  return (
    <GameContext.Provider value={{
      screen, setScreen, roomId, playerId, playerName, setPlayerName,
      room, privateView, error, clearError,
      characters: CHARACTERS, cards: CARDS,
      createRoom, joinRoom, leaveRoom, setReady, fillBots, removeBot,
      selectCharacter, startGame, doAction, restart, connected,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
