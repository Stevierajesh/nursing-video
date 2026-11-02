// Film the current frontends using offline API fixtures. No live credentials.
// The ward map at the second escalation. The reassessment fixture carries
// NEWS 8 in the high band with an open news_high escalation, so patientPriority
// returns rank 3 and UnitFloorPlan marks room 609 room-risk-high (red) rather
// than the amber room-concern-pending used for a pending nurse concern.
import {chromium} from 'playwright-core';
import {readFileSync, mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'build/footage/escalation-map/';
mkdirSync(out, {recursive:true});
const fixture = JSON.parse(readFileSync(root+'remotion/public/reassessment/fixtures.json'));
const beds = Array.from({length:8},(_,i)=>602+i).flatMap((room,i)=>(i<4?['A','B']:['B']).map(letter=>({id:`bed-${room}-${letter}`,org_id:'a',unit_id:'u1',room:String(room),bed:room===609?'9B':`${room}-${letter}`,occupied:room===609})));
const errors = [], unexpected = [];
const chrome = '/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({executablePath:chrome, args:['--hide-scrollbars']});
const manifest = {browserOnly:true, noLiveWrites:true, nurse:{}, charge:{}};
const contexts = [];

function cursor() {
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:600px;top:420px;width:30px;height:34px;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 2px 3px #0005);transform-origin:3px 3px';
  host.innerHTML='<svg viewBox="0 0 32 36"><path d="M3 2V27L10 21L16 33L21 30L15 19L26 18Z" fill="white" stroke="#182838" stroke-width="2"/></svg>';
  const attach=()=>{if(document.documentElement&&!host.isConnected)document.documentElement.append(host);};
  new MutationObserver(attach).observe(document,{childList:true,subtree:true});
  window.__cursor=(x,y,pressed=false)=>{attach();host.style.left=x+'px';host.style.top=y+'px';host.style.scale=pressed?'.8':'1';};
  attach();
}

async function makePage(role, port) {
  manifest[role] ??= {};
  const ctx=await browser.newContext({viewport:{width:1366,height:1024},deviceScaleFactor:1,colorScheme:'light',recordVideo:{dir:out,size:{width:1366,height:1024}},serviceWorkers:'block'});
  contexts.push(ctx);
  const env = readFileSync(root+`../${port===5173?'nursing-app':'nursing-dashboard'}/.env.local`,'utf8');
  const url = env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
  if(!url)throw Error('Supabase URL configuration missing');
  const key=`sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
  const user={id:role==='nurse'?'n1':'charge-demo',email:`${role}@demo.invalid`,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:fixture.generatedAt};
  const expires=Math.floor(Date.now()/1000)+3600;
  const token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'+Buffer.from(JSON.stringify({sub:user.id,exp:expires,role:'authenticated'})).toString('base64url')+'.rehearsal';
  await ctx.addInitScript(({key,user,token,expires})=>localStorage.setItem(key,JSON.stringify({access_token:token,refresh_token:'offline-demo',expires_at:expires,expires_in:3600,token_type:'bearer',user})),{key,user,token,expires});
  await ctx.addInitScript(cursor);
  await ctx.route(/https:\/\/.*\.supabase\.co\//, route=>route.abort());
  await ctx.route('**/api/v1/**',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname, method=req.method();
    let body;
    // Fixed at the post-reassessment state: the follow-up review is open.
    const review=fixture.review;
    const signal=fixture.submitted.worry_signal;
    const risk={...fixture.submitted.risk,worry_level:4,inputs:{}};
    const patient={...fixture.patient,risk_score:risk.score,risk_components:{worry:risk.worry_component,vitals:risk.vitals_component,trend:risk.trend_component},risk_inputs:{},latest_vitals:fixture.vitals.at(-1),latest_news:risk.latest_news,news_band:risk.news_band,news_alert:{score:risk.latest_news,band:risk.news_band,single_red_parameters:[]},latest_worry:signal,open_escalation:review,escalation_rule_label:review?.rule_label??null,escalation_reaches_physician:false};
    if(method==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    if(method==='GET'&&path==='/api/v1/me') body={user:{id:user.id,email:user.email,full_name:role==='nurse'?'Sally Osborn':'Charge nurse',role:role==='nurse'?'nurse':'charge_nurse',unit_id:'u1',is_org_wide:role!=='nurse'},organization:{id:'a',name:'Mercy General · Demo',slug:'demo',worry_sla_minutes:20},unit:{id:'u1',name:'6 North Telemetry'}};
    else if(method==='GET'&&path==='/api/v1/beds')body={beds};
    else if(method==='GET'&&path==='/api/v1/admin/units')body={units:[{id:'u1',name:'6 North Telemetry'}]};
    else if(method==='GET'&&(path==='/api/v1/patients/mine'||path==='/api/v1/dashboard/patients'))body={patients:[patient]};
    else if(method==='GET'&&path==='/api/v1/patients/p1')body={patient,vitals:fixture.vitals,vital_bands:fixture.vitalBands,nurse_notes:[],worry_signals:signal?[signal]:[],escalations:review?[review]:[],risk,risk_history:[]};
    else if(method==='GET'&&path==='/api/v1/dashboard/escalations')body={escalations:review?[review]:[]};
    else if(method==='GET'&&path==='/api/v1/dashboard/summary')body={active_patients:1,open_escalations:review?1:0,sla_breaches:0};
    else {unexpected.push({method,path});return route.fulfill({status:501,json:{error:'Unimplemented rehearsal request'}});}
    await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*'},json:body});
  });
  const page=await ctx.newPage();
  // Keep on-screen demo timestamps fixed while real timers/polling continue.
  await page.clock.setFixedTime(new Date(fixture.generatedAt));
  page.on('pageerror',e=>errors.push({role,error:e.message}));
  const start=Date.now();
  const mark=name=>{manifest[role][name]=(Date.now()-start)/1000;};
  await page.goto(`http://localhost:${port}/`);
  return {page,ctx,mark};
}

try {
  const map=await makePage('nurse',5173);
  await map.page.goto('http://localhost:5173/');
  const room=map.page.getByRole('button',{name:'Select room 609, 1 beds',exact:true});
  await room.waitFor();
  await map.page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await map.page.waitForTimeout(350);
  await map.page.mouse.move(850,550);await map.page.mouse.down();
  await map.page.mouse.move(505,380,{steps:30});await map.page.mouse.up();
  // Reframe the real viewport so the highlighted room and its neighbours fit.
  await map.page.evaluate(()=>window.__cursor(-100,-100));
  const box=await room.boundingBox();
  const state=await room.evaluate(el=>({red:el.parentElement.classList.contains('room-risk-high'),pulse:el.parentElement.classList.contains('room-concern-pending')}));
  const flashStyle=await room.evaluate(el=>{const s=getComputedStyle(el.parentElement,'::after');return {animation:s.animationName,border:s.borderTopWidth,color:s.borderTopColor};});
  manifest.flashStyle=flashStyle;
  // The escalated room must be the red high-risk state, not the amber concern.
  if(!state.red||state.pulse)throw Error('Expected red high-risk room 609');
  if(flashStyle.animation!=='room-risk-flash'||flashStyle.border!=='3px')throw Error('Missing red high-risk flash styles');
  map.mark('ready');manifest.room=box;manifest.alertState=state;
  await map.page.screenshot({path:out+'map.png'});
  // room-risk-flash cycles background alpha and never reaches zero, so sample
  // the fill rather than asserting a full on/off blink as the amber map does.
  const flashFills=[];
  for(let i=0;i<10;i++) {
    flashFills.push(await room.evaluate(el=>getComputedStyle(el.parentElement,'::after').backgroundColor));
    await map.page.waitForTimeout(180);
  }
  if(new Set(flashFills).size<2)throw Error('Room highlight must visibly change');
  manifest.flashFills=flashFills;
  await map.page.waitForTimeout(7000);
  if(errors.length||unexpected.length)throw Error(JSON.stringify({errors,unexpected}));
  const video=map.page.video();await map.ctx.close();
  mkdirSync(root+'remotion/public/escalation-map/',{recursive:true});
  copyFileSync(await video.path(),root+'remotion/public/escalation-map/nurse.webm');
  writeFileSync(root+'remotion/public/escalation-map/capture.json',JSON.stringify({...manifest,errors,unexpected},null,2));
  console.log(JSON.stringify(manifest,null,2));
}finally{await browser.close();}
