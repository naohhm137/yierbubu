import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base=process.env.VERIFY_BASE || 'http://localhost:3002';
const out='art/verification/2026-10-08';
const online=base.startsWith('https:');
const hash=b=>createHash('sha256').update(b).digest('hex');
const health=await fetch(`${base}/api/health`,{signal:AbortSignal.timeout(45000)}).then(r=>r.json());
assert.equal(health.status,'ok');
const assets={};
for(const path of ['models/studio/yier.glb','models/studio/bubu.glb','models/studio/table-scene.glb','studio/duo-cover.webp']) {
 const r=await fetch(`${base}/${path}`,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path);
 const bytes=Buffer.from(await r.arrayBuffer());const local=readFileSync(`apps/web/public/${path}`);
 assert.equal(hash(bytes),hash(local),`deployed asset differs: ${path}`);assets[path]={bytes:bytes.length,sha256:hash(bytes)};
}
const index=await fetch(base).then(r=>r.text());
const localIndex=readFileSync('apps/web/dist/index.html','utf8');
assert.equal(index.match(/src="([^"]+\.js)"/)?.[1],localIndex.match(/src="([^"]+\.js)"/)?.[1],'entry bundle differs');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const views=[];
try {
 for(const mobile of [false,true]) {
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('yierbubu_tutorial_done','1'));
  await page.goto(base,{timeout:45000});await page.getByText('已连接',{exact:true}).waitFor({timeout:45000});
  await page.getByRole('button',{name:'先练习一局'}).click();
  await page.locator('.game3d-container').waitFor({timeout:30000});
  await page.locator('.game3d-loading').waitFor({state:'hidden',timeout:45000});
  await page.getByRole('button',{name:'防守',exact:false}).click();
  await page.waitForFunction(()=>document.querySelector('.game3d-btn-hoard')?.disabled===true);
  assert.equal(await page.getByRole('button',{name:'结束回合',exact:false}).isEnabled(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/${online?'online':'production'}-${mobile?'mobile':'desktop'}.png`});
  views.push({mobile,practice:true,defend:true,errors,overflow});await page.close();
 }
 const result={base,checkedAt:new Date().toISOString(),health,assets,entry:index.match(/src="([^"]+\.js)"/)?.[1],views};
 writeFileSync(`${out}/${online?'online':'production'}-release.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();}
