// Film the current frontends using offline API fixtures. No live credentials.
// The ward map cooling down. This is the ILLUSTRATIVE beat: the app behaviour is
// real — patientPriority drops out of rank 3 and UnitFloorPlan swaps the room
// class — but the improving observations are simulated, exactly as the dashed
// projection in Act9Recovery already is. Nothing here is a recorded outcome.
//
// Three states on one continuous clip:
//   high  NEWS 8, open news_high escalation  -> room-risk-high      (red)
//   watch NEWS 2, nurse_concern acknowledged -> room-concern-pending (amber)
//   clear NEWS 1, no open escalation         -> no highlight
// UnitMap reloads on a 30s interval, so the clock is fast-forwarded between
// states rather than waited out; CSS animations are unaffected by fake timers.
import {chromium} from 'playwright-core';
import {readFileSync, mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'build/footage/deescalation-map/';
mkdirSync(out, {recursive:true});
const fixture = JSON.parse(readFileSync(root+'remotion/public/reassessment/fixtures.json'));
const beds = Array.from({length:8},(_,i)=>602+i).flatMap((room,i)=>(i<4?['A','B']:['B']).map(letter=>({id:`bed-${room}-${letter}`,org_id:'a',unit_id:'u1',room:String(room),bed:room===609?'9B':`${room}-${letter}`,occupied:room===609})));

// Taken from the recovery curve already animated in Act9Recovery.tsx, so the
// map and that scene describe the same simulated improvement.
const STAGES = {
  high:  {news:8, band:'high', score:55.0, worry:25.0, vitals:30.0, hr:129, rr:26, sbp:75,  dbp:52,
          review:() => fixture.review},
  watch: {news:2, band:'low',  score:35.0, worry:25.0, vitals:10.0, hr:101, rr:19, sbp:108, dbp:69,
          review:() => ({...fixture.initialReview, status:'acknowledged'})},
  clear: {news:1, band:'low',  score:18.0, worry:10.0, vitals:8.0,  hr:92,  rr:18, sbp:114, dbp:72,
          review:() => null},
};
let phase = 'high';
const errors = [], unexpected = [];
const chrome = '/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({executablePath:chrome, args:['--hide-scrollbars']});
const manifest = {browserOnly:true, noLiveWrites:true, illustrative:true, nurse:{}, charge:{}, stages:{}};
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
  const user={id:'n1',email:`${role}@demo.invalid`,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:fixture.generatedAt};
  const expires=Math.floor(Date.now()/1000)+3600;
  const token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'+Buffer.from(JSON.stringify({sub:user.id,exp:expires,role:'authenticated'})).toString('base64url')+'.rehearsal';
  await ctx.addInitScript(({key,user,token,expires})=>localStorage.setItem(key,JSON.stringify({access_token:token,refresh_token:'offline-demo',expires_at:expires,expires_in:3600,token_type:'bearer',user})),{key,user,token,expires});
  await ctx.addInitScript(cursor);
  await ctx.route(/https:\/\/.*\.supabase\.co\//, route=>route.abort());
  await ctx.route('**/api/v1/**',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname, method=req.method();
    let body;
    const stage=STAGES[phase];
    const review=stage.review();
    const signal=fixture.submitted.worry_signal;
    const risk={score:stage.score, worry_component:stage.worry, vitals_component:stage.vitals, trend_component:0.0,
      latest_news:stage.news, news_band:stage.band, trend_slope_per_hour:0.0, worry_level:4, inputs:{}};
    const vitals={...fixture.vitals.at(-1), heart_rate:stage.hr, resp_rate:stage.rr, systolic_bp:stage.sbp,
      diastolic_bp:stage.dbp, news_score:stage.news};
    const patient={...fixture.patient,risk_score:risk.score,risk_components:{worry:risk.worry_component,vitals:risk.vitals_component,trend:risk.trend_component},risk_inputs:{},latest_vitals:vitals,latest_news:stage.news,news_band:stage.band,news_alert:{score:stage.news,band:stage.band,single_red_parameters:[]},latest_worry:signal,open_escalation:review,escalation_rule_label:review?.rule_label??null,escalation_reaches_physician:false};
    if(method==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    if(method==='GET'&&path==='/api/v1/me') body={user:{id:user.id,email:user.email,full_name:'Sally Osborn',role:'nurse',unit_id:'u1',is_org_wide:false},organization:{id:'a',name:'Mercy General · Demo',slug:'demo',worry_sla_minutes:20},unit:{id:'u1',name:'6 North Telemetry'}};
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
  // Fake timers so the 30s map poll can be driven on demand. CSS animations are
  // compositor-driven and keep running, so the room keeps pulsing throughout.
  await page.clock.install({time:new Date(fixture.generatedAt)});
  page.on('pageerror',e=>errors.push({role,error:e.message}));
  const start=Date.now();
  const mark=name=>{manifest[role][name]=(Date.now()-start)/1000;};
  await page.goto(`http://localhost:${port}/`);
  return {page,ctx,mark};
}

const roomClass = room => room.evaluate(el=>({
  red:el.parentElement.classList.contains('room-risk-high'),
  amber:el.parentElement.classList.contains('room-concern-pending'),
}));

try {
  const map=await makePage('nurse',5173);
  const room=map.page.getByRole('button',{name:'Select room 609, 1 beds',exact:true});
  await room.waitFor();
  await map.page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await map.page.waitForTimeout(350);
  await map.page.mouse.move(850,550);await map.page.mouse.down();
  await map.page.mouse.move(505,380,{steps:30});await map.page.mouse.up();
  // Identical framing to capture-escalation-map so the two shots register.
  await map.page.evaluate(()=>window.__cursor(-100,-100));
  manifest.room=await room.boundingBox();

  const settle=async (name, expect)=>{
    for(let i=0;i<40;i++){
      const state=await roomClass(room);
      if(state.red===expect.red&&state.amber===expect.amber){manifest.stages[name]=state;return;}
      await map.page.waitForTimeout(100);
    }
    throw Error(`Room never reached ${name}: ${JSON.stringify(await roomClass(room))}`);
  };

  await settle('high',{red:true,amber:false});
  map.mark('high');
  await map.page.screenshot({path:out+'1-high.png'});
  await map.page.waitForTimeout(2200);

  phase='watch';
  await map.page.clock.fastForward(31_000);
  await settle('watch',{red:false,amber:true});
  map.mark('watch');
  await map.page.screenshot({path:out+'2-watch.png'});
  await map.page.waitForTimeout(2200);

  phase='clear';
  await map.page.clock.fastForward(31_000);
  await settle('clear',{red:false,amber:false});
  map.mark('clear');
  await map.page.screenshot({path:out+'3-clear.png'});
  await map.page.waitForTimeout(3000);

  if(errors.length||unexpected.length)throw Error(JSON.stringify({errors,unexpected}));
  const video=map.page.video();await map.ctx.close();
  mkdirSync(root+'remotion/public/deescalation-map/',{recursive:true});
  copyFileSync(await video.path(),root+'remotion/public/deescalation-map/nurse.webm');
  writeFileSync(root+'remotion/public/deescalation-map/capture.json',JSON.stringify({...manifest,errors,unexpected},null,2));
  console.log(JSON.stringify(manifest,null,2));
}finally{await browser.close();}
