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
  quickPractice: () => void;
  preparingPractice: boolean;
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
  const [preparingPractice, setPreparingPractice] = useState(false);
  const practiceRef = useRef<{ stage: 'creating' | 'selecting' | 'filling' | 'starting'; roomId?: string } | null>(null);
  const practiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomPhaseRef = useRef<string | null>(null);

  const finishPractice = useCallback(() => {
    practiceRef.current = null;
    setPreparingPractice(false);
    if (practiceTimerRef.current) clearTimeout(practiceTimerRef.current);
    practiceTimerRef.current = null;
  }, []);

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id ?? null);
    });
    socket.on('disconnect', () => {
      setConnected(false);
      if (practiceRef.current) {
        finishPractice();
        setError('连接中断，请连接恢复后重新开始练习');
        setScreen('menu');
      }
    });
    socket.on('roomCreated', (data: { roomId: string }) => {
      setRoomId(data.roomId);
      if (practiceRef.current?.stage === 'creating') {
        practiceRef.current = { stage: 'selecting', roomId: data.roomId };
        socket.emit('selectCharacter', { characterId: 'yier' });
      } else {
        setScreen('lobby');
      }
    });
    socket.on('roomState', (data: { public: PublicRoomView; private?: PrivatePlayerView }) => {
      setRoomId(data.public.roomId);
      setRoom(data.public);
      if (data.private) setPrivateView(data.private);
      const practice = practiceRef.current;
      if (practice?.roomId === data.public.roomId) {
        if (data.public.phase === 'playing') {
          finishPractice();
          setScreen('game');
        } else if (data.public.phase === 'lobby') {
          const self = data.public.players.find(player => player.id === socket.id);
          if (practice.stage === 'selecting' && self?.characterId === 'yier') {
            practice.stage = 'filling';
            socket.emit('fillBots', { count: 4 });
          } else if (practice.stage === 'filling' && data.public.players.length === 5) {
            practice.stage = 'starting';
            socket.emit('startGame');
          }
        }
      }
      const phaseKey = `${data.public.roomId}:${data.public.phase}`;
      if (roomPhaseRef.current !== phaseKey) {
        roomPhaseRef.current = phaseKey;
        setScreen(current => {
          if (current === 'rules' || current === 'codex' || practiceRef.current) return current;
          return data.public.phase === 'playing' ? 'game' : data.public.phase === 'finished' ? 'result' : 'lobby';
        });
      }
    });
    socket.on('error', (data: { message: string }) => {
      if (practiceRef.current) {
        const hasRoom = !!practiceRef.current.roomId;
        finishPractice();
        setScreen(hasRoom ? 'lobby' : 'menu');
      }
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
  }, [finishPractice]);

  useEffect(() => () => {
    if (practiceTimerRef.current) clearTimeout(practiceTimerRef.current);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const createRoom = useCallback(() => {
    if (!playerName.trim()) { setError('请输入你的名字'); return; }
    socketRef.current.emit('createRoom', { playerName: playerName.trim() });
  }, [playerName]);

  const quickPractice = useCallback(() => {
    const socket = socketRef.current;
    if (!socket.connected) { setError('还未连接，请稍后再试'); return; }
    if (practiceRef.current) return;
    const name = playerName.trim() || '茶会新朋友';
    setPlayerName(name);
    setError(null);
    practiceRef.current = { stage: 'creating' };
    setPreparingPractice(true);
    practiceTimerRef.current = setTimeout(() => {
      const hasRoom = !!practiceRef.current?.roomId;
      finishPractice();
      setError(hasRoom ? '练习准备超时，可在大厅继续或返回重试' : '创建练习房间超时，请重试');
      setScreen(hasRoom ? 'lobby' : 'menu');
    }, 15000);
    socket.emit('createRoom', { playerName: name });
  }, [playerName, finishPractice]);

  const joinRoom = useCallback((id: string) => {
    if (!playerName.trim()) { setError('请输入你的名字'); return; }
    socketRef.current.emit('joinRoom', { roomId: id, playerName: playerName.trim() });
  }, [playerName]);

  const leaveRoom = useCallback(() => {
    finishPractice();
    roomPhaseRef.current = null;
    socketRef.current.emit('leaveRoom');
    setRoomId(null);
    setRoom(null);
    setPrivateView(null);
    setScreen('menu');
  }, [finishPractice]);

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
      createRoom, quickPractice, preparingPractice, joinRoom, leaveRoom, setReady, fillBots, removeBot,
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
