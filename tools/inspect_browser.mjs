import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='art/verification/2026-10-08';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')errors.push(`${msg.type()}: ${msg.text()}`);});
await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'双熊图鉴',exact:true}).click();
await page.getByRole('button',{name:'查看一二的角色详情',exact:true}).click();
await page.getByRole('button',{name:'向左旋转',exact:true}).waitFor();
try {
  await page.waitForFunction(()=>!document.querySelector('button[aria-label="向左旋转"]')?.disabled,null,{timeout:30000});
} catch (error) {
  await page.screenshot({path:`${out}/preview-failure.png`});
  console.log(JSON.stringify({errors,body:await page.locator('body').innerText()}));
  await browser.close();throw error;
}
await page.screenshot({path:`${out}/yier-preview.png`});
const state=await page.evaluate(async()=>{
  const { _roots }=await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const canvas=document.querySelector('canvas');const s=_roots.get(canvas).store.getState();
  let skins=0,details=0; s.scene.traverse(o=>{if(o.isSkinnedMesh)skins++;if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.normalMap)details++;}});
  return {skins,details,triangles:s.gl.info.render.triangles,camera:s.camera.position.toArray(),clips:s.scene.children.length};
});
await page.getByRole('button',{name:'向左旋转',exact:true}).click();
await page.screenshot({path:`${out}/yier-turned.png`});
writeFileSync(`${out}/preview-browser.json`,JSON.stringify({state,errors},null,2));
console.log(JSON.stringify({state,errors}));await browser.close();
