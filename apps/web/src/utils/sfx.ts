// 简易音效系统 — 使用 Web Audio API 生成，无需音频文件
let audioCtx: AudioContext | null = null;
let bgmInterval: number | null = null;
let bgmEnabled = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// 简单的治愈系循环旋律（C大调）
const BGM_NOTES = [523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 587, 523];
let bgmIndex = 0;

function playBgmNote() {
  if (!bgmEnabled) return;
  const freq = BGM_NOTES[bgmIndex % BGM_NOTES.length];
  playTone(freq, 0.4, 'sine', 0.04);
  // 加一个低八度和声
  playTone(freq / 2, 0.5, 'triangle', 0.02);
  bgmIndex++;
}

export const sfx = {
  /** 按钮点击 */
  click() {
    playTone(800, 0.08, 'sine', 0.1);
  },
  /** 抽牌 */
  draw() {
    playTone(600, 0.1, 'triangle', 0.12);
    setTimeout(() => playTone(900, 0.1, 'triangle', 0.1), 60);
  },
  /** 出牌 */
  play() {
    playTone(500, 0.08, 'square', 0.08);
    setTimeout(() => playTone(700, 0.12, 'square', 0.08), 50);
  },
  /** 使用技能 */
  skill() {
    playTone(400, 0.1, 'sawtooth', 0.08);
    setTimeout(() => playTone(600, 0.1, 'sawtooth', 0.08), 80);
    setTimeout(() => playTone(800, 0.15, 'sawtooth', 0.08), 160);
  },
  /** 受伤 */
  damage() {
    playTone(200, 0.2, 'sawtooth', 0.15);
  },
  /** 治疗 */
  heal() {
    playTone(523, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.12), 200);
  },
  /** 获得友情值 */
  friendship() {
    playTone(880, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 80);
  },
  /** 回合开始 */
  turnStart() {
    playTone(440, 0.1, 'triangle', 0.1);
    setTimeout(() => playTone(554, 0.15, 'triangle', 0.1), 100);
  },
  /** 胜利 */
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'triangle', 0.15), i * 150));
  },
  /** 失败 */
  defeat() {
    const notes = [400, 350, 300, 250];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.1), i * 200));
  },
  /** 卡牌选中 */
  select() {
    playTone(1000, 0.05, 'sine', 0.08);
  },
  /** 背景音乐开关 */
  toggleBgm(): boolean {
    bgmEnabled = !bgmEnabled;
    if (bgmEnabled) {
      const ctx = getCtx();
      if (ctx?.state === 'suspended') ctx.resume();
      bgmInterval = window.setInterval(playBgmNote, 500);
    } else if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    return bgmEnabled;
  },
  isBgmOn: () => bgmEnabled,
};
