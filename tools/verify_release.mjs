import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
const base=process.env.VERIFY_BASE || 'http://localhost:3002';
const out='art/verification/2026-10-08';
const online=base.startsWith('https:');
const ip=process.env.VERIFY_IP;
function readRemote(path) {
 return new Promise((resolve,reject)=>{
  const url=new URL(path,base);
  const request=(url.protocol==='https:'?https:http).get(url,{headers:{'cache-control':'no-cache'},...(ip?{lookup:(_host,options,callback)=>options.all?callback(null,[{address:ip,family:4}]):callback(null,ip,4)}:{})},response=>{
   const chunks=[];response.on('data',b=>chunks.push(b));response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,bytes:Buffer.concat(chunks)}));response.on('error',reject);
  });request.setTimeout(45000,()=>request.destroy(new Error('release request timed out')));request.on('error',reject);
 });
}
const hash=b=>createHash('sha256').update(b).digest('hex');
const health=JSON.parse((await readRemote('/api/health')).bytes.toString());
assert.equal(health.status,'ok');
const assets={};
for(const path of ['models/studio/yier.glb','models/studio/bubu.glb','models/studio/table-scene.glb','studio/duo-cover.webp']) {
 const r=await readRemote(`/${path}`);assert.equal(r.status,200,path);
 const bytes=r.bytes;const local=readFileSync(`apps/web/public/${path}`);
 assert.equal(hash(bytes),hash(local),`deployed asset differs: ${path}`);assets[path]={bytes:bytes.length,sha256:hash(bytes)};
}
const index=(await readRemote('/')).bytes.toString();
const localIndex=readFileSync('apps/web/dist/index.html','utf8');
const entry=index.match(/src="([^"]+\.js)"/)?.[1];assert.ok(entry);
const main=(await readRemote(entry)).bytes.toString();
const gameChunk=main.match(/GameTable3D-[a-zA-Z0-9_-]+\.js/)?.[0];assert.ok(gameChunk);
const gameSource=(await readRemote(`/assets/${gameChunk}`)).bytes.toString();
assert.ok(main.includes('先练习一局'));
assert.ok(gameSource.includes('每回合只选一次主要行动'));
assert.ok(gameSource.includes('模型仍在加载'));
const entryMatchesLocal=entry===localIndex.match(/src="([^"]+\.js)"/)?.[1];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:ip?[`--host-resolver-rules=MAP ${new URL(base).hostname} ${ip}`,'--disable-http2']:[]});
const views=[];
try {
 for(const mobile of [false,true]) {
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900}});
  let bridgedResources=0;
  if(process.env.VERIFY_HTTP_BRIDGE==='1') await page.route(`${base}/**`,async route=>{
    if(route.request().method()!=='GET' || route.request().url().includes('/socket.io/')) return route.continue();
    const response=await readRemote(route.request().url());bridgedResources++;
    return route.fulfill({status:response.status,body:response.bytes,contentType:response.headers['content-type'] || 'application/octet-stream'});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const socketUrls=[];page.on('websocket',s=>socketUrls.push(s.url()));
  const pending=new Set();page.on('request',r=>pending.add(r.url()));page.on('requestfinished',r=>pending.delete(r.url()));
  page.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url(),r.failure()?.errorText));
  await page.addInitScript(()=>localStorage.setItem('yierbubu_tutorial_done','1'));
  await page.goto(base,{timeout:45000});await page.getByText('已连接',{exact:true}).waitFor({timeout:45000});
  assert.ok(socketUrls.some(url=>new URL(url).host===new URL(base).host),'production socket must use the served origin');
  await page.getByRole('button',{name:'先练习一局'}).click();
  try {await page.locator('.game3d-container').waitFor({timeout:60000});} catch(error) {console.log(JSON.stringify({body:await page.locator('body').innerText(),errors,pending:[...pending]}));await page.screenshot({path:`${out}/online-practice-failure.png`});throw error;}
  await page.locator('.game3d-loading').waitFor({state:'hidden',timeout:45000});
  await page.getByRole('button',{name:'防守',exact:false}).click();
  await page.waitForFunction(()=>document.querySelector('.game3d-btn-hoard')?.disabled===true);
  assert.equal(await page.getByRole('button',{name:'结束回合',exact:false}).isEnabled(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/${online?'online':'production'}-${mobile?'mobile':'desktop'}.png`});
  views.push({mobile,practice:true,defend:true,errors,overflow,bridgedResources,socketUrls});await page.close();
 }
 const result={base,checkedAt:new Date().toISOString(),health,assets,entry,entryMatchesLocal,gameChunk,sourceMarkersVerified:true,views};
 writeFileSync(`${out}/${online?'online':'production'}-release.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();}
