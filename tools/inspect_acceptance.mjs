import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const out = 'art/verification/2026-10-08';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const evidence = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('yierbubu_tutorial_done','1'));
  await page.goto('http://localhost:5173');
  await page.getByText('已连接',{exact:true}).waitFor();
  await page.evaluate(async () => { const {getSocket} = await import('/src/socket.ts'); window.acceptSocket=getSocket(); window.acceptSocket.on('roomState',r=>window.acceptRoom=r); });
  await page.getByRole('button',{name:'先练习一局'}).click();
  await page.waitForFunction(()=>window.acceptRoom?.public.phase==='playing');
  const turns = [];
  const deadline = Date.now()+150000;
  let lastTurn = '';
  while (Date.now()<deadline) {
    const state = await page.evaluate(()=> {const r=window.acceptRoom;return {phase:r.public.phase,round:r.public.round,active:r.public.activePlayerId,me:r.private.playerId,status:r.public.players.find(p=>p.id===r.private.playerId)?.status};});
    if (state.phase==='finished') break;
    const key = `${state.round}:${state.active}`;
    if (state.active===state.me && state.status==='active' && key!==lastTurn) {
      await page.getByRole('button',{name:'结束回合',exact:false}).click();lastTurn=key;turns.push(state.round);
    }
    await page.waitForTimeout(200);
  }
  await page.locator('.result-screen').waitFor({timeout:5000});
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.result-card')).opacity)>.95);
  await page.screenshot({path:`${out}/complete-game-result.png`});
  const result = await page.evaluate(()=>window.acceptRoom.public);
  assert.equal(result.phase,'finished');assert.ok(result.winnerData);assert.ok(turns.length>0);
  await page.getByRole('button',{name:'再来一局',exact:false}).click();
  await page.waitForFunction(()=>window.acceptRoom?.public.phase==='playing' && window.acceptRoom.public.round===1);
  evidence.completeGame={turns,roundReached:result.winnerData.roundReached,restarted:true,errors};assert.deepEqual(errors,[]);
  writeFileSync(`${out}/acceptance-browser.json`,JSON.stringify(evidence,null,2));
  await page.close();
  for (const failure of [false,true]) {
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await p.addInitScript(()=>localStorage.setItem('yierbubu_tutorial_done','1'));
    if(failure) await p.route('**/models/studio/yier.glb',route=>route.fulfill({status:404,body:'missing asset'}));
    await p.goto('http://localhost:5173');await p.getByText('已连接',{exact:true}).waitFor();
    await p.getByRole('button',{name:'先练习一局'}).click();
    await p.locator('.game3d-container').waitFor({state:'visible'});
    await p.locator('.game3d-loading').waitFor({state:'hidden',timeout:30000});
    await p.waitForFunction(async()=>{const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');return !!_roots.get(document.querySelector('canvas'));});
    const stats=await p.evaluate(async()=>{const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');const s=_roots.get(document.querySelector('canvas')).store.getState();window.acceptStore=s;let rigs=0;s.scene.traverse(o=>{if(o.name==='BearRig')rigs++;});return {rigs,overflow:document.documentElement.scrollWidth>innerWidth};});
    assert.equal(stats.rigs,failure?4:5);assert.equal(stats.overflow,false);
    const transforms=()=>{const values=[];window.acceptStore.scene.traverse(o=>{if(o.isBone)values.push(...o.position.toArray(),...o.quaternion.toArray());});return values;};
    const first=await p.evaluate(transforms);await p.waitForTimeout(500);const second=await p.evaluate(transforms);assert.deepEqual(second,first);
    await p.screenshot({path:`${out}/${failure?'model-fallback':'reduced-motion'}.png`});
    evidence[failure?'modelFallback':'reducedMotion']={...stats,bonesStable:true};await p.close();
  }
  writeFileSync(`${out}/acceptance-browser.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
} finally {await browser.close();}
