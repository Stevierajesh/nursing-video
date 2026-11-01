// Film the current frontends using offline API fixtures. No live credentials.
import {chromium} from 'playwright-core';
import {readFileSync, mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'build/footage/response-prototype/';
mkdirSync(out, {recursive:true});
const fixture = JSON.parse(readFileSync(root+'remotion/public/response-prototype/fixtures.json'));
let phase = 'initial';
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
    const review=phase==='initial'?null:phase==='assessed'?fixture.assessed:phase==='acknowledged'?fixture.acknowledged:fixture.review;
    const signal=phase==='initial'?null:fixture.submitted.worry_signal;
    const risk=phase==='initial'?fixture.initialRisk:{...fixture.submitted.risk,worry_level:4,inputs:{}};
    const patient={...fixture.patient,risk_score:risk.score,risk_components:{worry:risk.worry_component,vitals:risk.vitals_component,trend:risk.trend_component},risk_inputs:{},latest_vitals:fixture.vitals.at(-1),latest_news:0,news_band:'none',news_alert:{score:0,band:'none',single_red_parameters:[]},latest_worry:signal,open_escalation:phase==='assessed'?null:review,escalation_rule_label:review?.rule_label??null,escalation_reaches_physician:false};
    if(method==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    if(method==='GET'&&path==='/api/v1/me') body={user:{id:user.id,email:user.email,full_name:role==='nurse'?'Sally Osborn':'Charge nurse',role:role==='nurse'?'nurse':'charge_nurse',unit_id:'u1',is_org_wide:role!=='nurse'},organization:{id:'a',name:'Mercy General · Demo',slug:'demo',worry_sla_minutes:20},unit:{id:'u1',name:'6 North Telemetry'}};
    else if(method==='GET'&&(path==='/api/v1/patients/mine'||path==='/api/v1/dashboard/patients'))body={patients:[patient]};
    else if(method==='GET'&&path==='/api/v1/patients/p1')body={patient,vitals:fixture.vitals,vital_bands:{},nurse_notes:[],worry_signals:signal?[signal]:[],escalations:review?[review]:[],risk,risk_history:[]};
    else if(method==='GET'&&path==='/api/v1/dashboard/escalations')body={escalations:review?[review]:[]};
    else if(method==='GET'&&path==='/api/v1/dashboard/summary')body={active_patients:1,open_escalations:review?1:0,sla_breaches:0};
    else if(method==='POST'&&path==='/api/v1/worry'){
      const data=req.postDataJSON();
      if(data.level!==4||data.note!==fixture.note||data.reasons.length!==0)throw Error('Unexpected demo submission');
      phase='submitted';body=fixture.submitted;
    }else if(method==='POST'&&path==='/api/v1/escalations/demo-review/acknowledge'){
      phase='acknowledged';body={escalation:fixture.acknowledged};
    }else if(method==='POST'&&path==='/api/v1/escalations/demo-review/assess'){
      if(req.postDataJSON().note!==fixture.assessmentNote)throw Error('Unexpected assessment note');
      phase='assessed';body={escalation:fixture.assessed};
    }else {unexpected.push({method,path});return route.fulfill({status:501,json:{error:'Unimplemented rehearsal request'}});}
    await route.fulfill({status:method==='POST'&&path==='/api/v1/worry'?201:200,headers:{'Access-Control-Allow-Origin':'*'},json:body});
  });
  const page=await ctx.newPage();
  // Keep on-screen demo timestamps fixed while real timers/polling continue.
  await page.clock.setFixedTime(new Date(fixture.generatedAt));
  page.on('pageerror',e=>errors.push({role,error:e.message}));
  const start=Date.now();
  const mark=name=>{manifest[role][name]=(Date.now()-start)/1000;};
  let px=600,py=420;
  const tap=async loc=>{
    await loc.scrollIntoViewIfNeeded();const box=await loc.boundingBox();
    const tx=box.x+box.width/2,ty=box.y+box.height/2,ox=px,oy=py;
    for(let i=1;i<=24;i++){px=ox+(tx-ox)*i/24;py=oy+(ty-oy)*i/24;await page.mouse.move(px,py);await page.evaluate(([x,y])=>window.__cursor(x,y),[px,py]);await page.waitForTimeout(18);}
    await page.evaluate(([x,y])=>window.__cursor(x,y,true),[px,py]);await loc.click();await page.waitForTimeout(120);await page.evaluate(([x,y])=>window.__cursor(x,y),[px,py]);
  };
  await page.goto(`http://localhost:${port}/${role==='nurse'?'worry/p1':role==='chargeApp'?'respond/p1':''}`);
  return {page,ctx,mark,tap};
}

try {
  const charge=await makePage('charge',5174);
  await charge.page.getByText('Active patients',{exact:true}).waitFor();
  const nurse=await makePage('nurse',5173);
  await nurse.page.getByRole('heading',{name:'How worried are you?',exact:true}).waitFor();
  nurse.mark('baseline');await nurse.page.screenshot({path:out+'baseline.png'});await nurse.page.waitForTimeout(1800);
  nurse.mark('selection');await nurse.tap(nurse.page.getByRole('button',{name:'Very worried',exact:true}));
  await nurse.page.waitForTimeout(500);
  // The note supplies the observed findings; no optional reason chip is selected.
  await nurse.page.waitForTimeout(1000);
  nurse.mark('note');const field=nurse.page.getByPlaceholder('In your words — this goes to the charge nurse.');
  await nurse.tap(field);await field.pressSequentially(fixture.note,{delay:26});
  await nurse.page.waitForTimeout(800);nurse.mark('submit');await nurse.tap(nurse.page.getByRole('button',{name:'Submit score',exact:true}));
  await nurse.page.getByText('Yellow · review requested',{exact:true}).waitFor();
  nurse.mark('result');await nurse.page.screenshot({path:out+'result.png'});await nurse.page.waitForTimeout(5000);
  const notices=charge.page.getByRole('complementary',{name:'Clinical review notifications'});
  await notices.getByText('Yellow · Very worried',{exact:true}).waitFor({timeout:20000});
  charge.mark('popup');await charge.page.screenshot({path:out+'popup.png'});await charge.page.waitForTimeout(3000);
  charge.mark('acknowledge');await charge.tap(notices.getByRole('button',{name:'Acknowledge',exact:true}));
  if(phase!=='acknowledged')throw Error('Acknowledgment was not intercepted');
  charge.mark('acknowledged');await charge.page.waitForTimeout(600);
  await charge.tap(charge.page.getByRole('link',{name:'Response queue',exact:true}));
  await charge.page.getByText('Acknowledged by',{exact:false}).waitFor();
  charge.mark('queue');await charge.page.screenshot({path:out+'queue.png'});await charge.page.waitForTimeout(5000);
  if(errors.length||unexpected.length)throw Error(JSON.stringify({errors,unexpected}));
  for(const [role,capture] of [['nurse',nurse],['charge',charge]]){
    manifest[role].end=Date.now();const video=capture.page.video();await capture.ctx.close();
    const path=await video.path();copyFileSync(path,root+`remotion/public/response-prototype/${role}.webm`);
    manifest[role].video=`response-prototype/${role}.webm`;
  }
  writeFileSync(root+'remotion/public/response-prototype/capture.json',JSON.stringify({...manifest,errors,unexpected},null,2));
  console.log(JSON.stringify(manifest,null,2));
} catch(error) {
  for(const [i,ctx] of contexts.entries())for(const page of ctx.pages()){
    await page.screenshot({path:out+`failure-${i}.png`}).catch(()=>{});
    writeFileSync(out+`failure-${i}.txt`,await page.locator('body').innerText().catch(()=>''));
  }
  throw error;
} finally {await browser.close();}
