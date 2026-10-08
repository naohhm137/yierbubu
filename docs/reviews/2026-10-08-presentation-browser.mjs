import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const output = 'docs/reviews/presentation-2026-10-08';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const failures = [];
const evidence = {};
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', error => failures.push(error.message));
async function captureSocket(target) {
  await target.evaluate(async () => {
    const { getSocket } = await import('/src/socket.ts');
    const socket = getSocket();
    window.practicePackets = [];
    const emit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => { window.practicePackets.push({ event, data: args[0] }); return emit(event, ...args); };
    socket.on('roomState', data => { window.latestRoom = data; });
  });
}
async function noOverflow(target) {
  return target.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > innerWidth }));
}
try {
  await page.goto('http://localhost:5173');
  await page.getByText('已连接', { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/menu-desktop.png`, fullPage: true });
  evidence.desktop = await noOverflow(page);
  assert.equal(await page.locator('.menu-content').evaluate(element => getComputedStyle(element).opacity), '1');
  evidence.input = await page.locator('#player-name').evaluate(element => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, width: element.getBoundingClientRect().width }));
  await captureSocket(page);
  await page.getByRole('button', { name: '先练习一局' }).evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => window.latestRoom?.public.phase === 'playing');
  evidence.practice = await page.evaluate(() => ({ packets: window.practicePackets, players: window.latestRoom.public.players.map(player => ({ name: player.name, isBot: player.isBot, characterId: player.characterId })), phase: window.latestRoom.public.phase }));
  assert.deepEqual(evidence.practice.packets.map(packet => packet.event), ['createRoom', 'selectCharacter', 'fillBots', 'startGame']);
  assert.equal(evidence.practice.players.length, 5);
  assert.equal(evidence.practice.players.filter(player => player.isBot).length, 4);
  assert.equal(evidence.practice.players.find(player => !player.isBot).characterId, 'yier');
  await page.locator('.game3d-container').waitFor({ timeout: 30000 });
  await page.screenshot({ path: `${output}/practice-desktop.png`, fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', error => failures.push(error.message));
  await mobile.goto('http://localhost:5173');
  await mobile.getByText('已连接', { exact: true }).waitFor();
  await mobile.screenshot({ path: `${output}/menu-mobile.png`, fullPage: true });
  evidence.mobile = await noOverflow(mobile);
  assert.equal(await mobile.locator('.menu-content').evaluate(element => getComputedStyle(element).opacity), '1');
  await mobile.getByRole('button', { name: '加入房间', exact: true }).click();
  await mobile.locator('#room-code').fill('NOTFOUND');
  await mobile.getByRole('button', { name: '进入房间', exact: true }).click();
  await mobile.getByRole('alert').waitFor();
  assert.equal(await mobile.locator('#player-name').evaluate(element => element === document.activeElement), true);
  await mobile.locator('#player-name').fill('加入测试');
  await mobile.getByRole('button', { name: '进入房间', exact: true }).click();
  await mobile.locator('.error-toast').waitFor();
  assert.equal(await mobile.locator('.menu-screen-premium').count(), 1);
  evidence.failedJoinRecovery = 'Invalid room keeps editable menu form';
  await mobile.getByRole('button', { name: '返回', exact: true }).click();
  await mobile.getByRole('button', { name: '怎么玩', exact: true }).click();
  await mobile.getByRole('heading', { name: '茶会怎么玩', exact: true }).waitFor();
  await mobile.locator('.rules-skill-list summary').click();
  assert.equal(await mobile.locator('.rules-skill-list dt').count(), 12);
  evidence.rulesMobile = await noOverflow(mobile);
  await mobile.screenshot({ path: `${output}/rules-mobile.png`, fullPage: true });
  await mobile.getByRole('button', { name: '返回茶会', exact: true }).first().click();
  await mobile.setViewportSize({ width: 320, height: 740 });
  evidence.narrowMobile = await noOverflow(mobile);
  assert.equal(evidence.narrowMobile.overflow, false);
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.locator('#player-name').fill('规则测试');
  await captureSocket(mobile);
  await mobile.locator('#player-name').press('Enter');
  await mobile.locator('.lobby-screen-premium').waitFor();
  await mobile.locator('.lobby-rules-btn').click();
  await mobile.getByRole('button', { name: '返回大厅', exact: true }).first().waitFor();
  await mobile.evaluate(async () => { const { getSocket } = await import('/src/socket.ts'); getSocket().emit('fillBots', { count: 4 }); });
  await mobile.waitForFunction(() => window.latestRoom.public.players.length === 5);
  assert.equal(await mobile.getByRole('heading', { name: '茶会怎么玩', exact: true }).count(), 1);
  await mobile.evaluate(async () => { const { getSocket } = await import('/src/socket.ts'); getSocket().emit('startGame'); });
  await mobile.waitForFunction(() => window.latestRoom.public.phase === 'playing');
  await mobile.getByRole('button', { name: '返回对局', exact: true }).first().waitFor();
  assert.equal(await mobile.getByRole('heading', { name: '茶会怎么玩', exact: true }).count(), 1);
  await mobile.getByRole('button', { name: '返回对局', exact: true }).first().click();
  await mobile.locator('.game3d-container').waitFor({ timeout: 30000 });
  evidence.returnFromRules = 'menu→rules→menu, lobby→rules held across fill/start broadcasts→game';
  await mobile.close();

  const rejected = await browser.newPage();
  await rejected.goto('http://localhost:5173');
  await rejected.getByText('已连接', { exact: true }).waitFor();
  await rejected.evaluate(async () => {
    const { getSocket } = await import('/src/socket.ts'); const socket = getSocket(); const emit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => emit(event, ...(event === 'fillBots' ? [{ count: 0 }] : args));
  });
  await rejected.getByRole('button', { name: '先练习一局' }).click();
  await rejected.locator('.lobby-screen-premium').waitFor();
  await rejected.locator('.error-toast').waitFor();
  evidence.rejectedPracticeRecovery = 'Real server rejection for invalid fillBots returns to created lobby';
  await rejected.close();

  const timedOut = await browser.newPage();
  await timedOut.clock.install();
  await timedOut.goto('http://localhost:5173');
  await timedOut.getByText('已连接', { exact: true }).waitFor();
  await timedOut.evaluate(async () => {
    const { getSocket } = await import('/src/socket.ts'); const socket = getSocket(); const emit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => event === 'startGame' ? socket : emit(event, ...args);
    socket.on('roomState', data => { window.latestRoom = data; });
  });
  await timedOut.getByRole('button', { name: '先练习一局' }).click();
  await timedOut.waitForFunction(() => window.latestRoom?.public.players.length === 5);
  await timedOut.clock.fastForward(15001);
  await timedOut.locator('.lobby-screen-premium').waitFor();
  await timedOut.getByText('练习准备超时，可在大厅继续或返回重试', { exact: false }).waitFor();
  evidence.practiceTimeoutRecovery = 'Dropped startGame packet, advanced 15 seconds, returned to existing lobby';
  await timedOut.close();
  evidence.pageErrors = failures;
  assert.equal(evidence.desktop.overflow, false);
  assert.equal(evidence.mobile.overflow, false);
  assert.equal(evidence.rulesMobile.overflow, false);
  assert.deepEqual(failures, []);
  writeFileSync(`${output}/checks.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally { await browser.close(); }
