import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='art/verification/2026-10-08';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const evidence={};
let currentPage;
try {
 for (const mobile of [false,true]) {
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile});
  currentPage=page;
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('framenavigated',()=>console.log('NAV',page.url()));
  await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});
  await page.getByText('已连接',{exact:true}).waitFor();
  await page.evaluate(async()=>{const {getSocket}=await import('/src/socket.ts');getSocket().on('roomState',r=>window.testRoom=r);});
  await page.getByRole('button',{name:'先练习一局'}).click();
  await page.waitForFunction(()=>window.testRoom?.public.phase==='playing');
  await page.locator('.game3d-container').waitFor({state:'visible'});
  await page.locator('.game3d-loading').waitFor({state:'hidden',timeout:30000});
  if (await page.getByRole('button',{name:'开始游戏！',exact:true}).isVisible()) await page.getByRole('button',{name:'开始游戏！',exact:true}).click();
  await page.waitForFunction(async()=>{
    const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');const root=_roots.get(document.querySelector('canvas'));
    if(!root)return false;let models=0;root.store.getState().scene.traverse(o=>{if(o.name==='BearRig')models++;});window.testStore=root.store;return models===5;
  },null,{timeout:30000});
  const angles=[];
  for (const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
   const stats=await page.evaluate(async a=>{
    const s=window.testStore.getState();
    const control=s.controls;
    // R3F controls do not set the store unless makeDefault: locate via current camera.
    const radius=Math.hypot(s.camera.position.x,s.camera.position.z);s.camera.position.set(Math.sin(a)*radius,s.camera.position.y,Math.cos(a)*radius);s.camera.lookAt(0,.9,0);
    let models=0,textured=0,skin=0; s.scene.traverse(o=>{if(o.name==='BearRig')models++;if(o.isSkinnedMesh)skin++;if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];textured+=mats.filter(m=>m.normalMap).length;}});
    return {angle:a,models,skin,textured,triangles:s.gl.info.render.triangles,room:window.testRoom.public.phase};
   },angle);
   await page.screenshot({path:`${out}/game-${mobile?'mobile':'desktop'}-${Math.round(angle*180/Math.PI)}.png`});
   angles.push(stats);assert.equal(stats.models,5);assert.ok(stats.textured>=25);
  }
  await page.getByRole('button',{name:'坐席视角',exact:true}).click();
  await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/game-${mobile?'mobile':'desktop'}-seated.png`});
  await page.getByRole('button',{name:'全桌视角',exact:true}).click();
  await page.getByRole('button',{name:'防守',exact:false}).click();
  await page.waitForFunction(()=>{const r=window.testRoom;return r.public.players.find(p=>p.id===r.private.playerId)?.hasActedThisTurn;});
  assert.equal(await page.getByRole('button',{name:'积蓄',exact:false}).isEnabled(),false);
  assert.equal(await page.getByRole('button',{name:'结束回合',exact:false}).isEnabled(),true);
  await page.getByRole('button',{name:'结束回合',exact:false}).click();
  evidence[mobile?'mobile':'desktop']={angles,errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
  assert.deepEqual(errors,[]);await page.close();
 }
 writeFileSync(`${out}/game-browser.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
} catch(error) {
 if(currentPage){console.log(await currentPage.locator('body').innerText());await currentPage.screenshot({path:`${out}/game-failure.png`});}
 throw error;
} finally {await browser.close();}
