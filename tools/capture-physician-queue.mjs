// Film the current frontends using offline API fixtures. No live credentials.
// The prescriber's deterioration queue, second level.
//
// This is the only honest route from this story to a physician. reaches_physician()
// in the backend has two doors: a pairing rule (nurse concern AND vitals agreeing),
// or `auto_escalated` on any rule — the nursing tier was given its SLA window and
// did not answer, so it escalates past the people who did not respond. The film's
// follow-up is rule "news_high", which is not a pairing rule, so the door it goes
// through is the second one. sweep_sla_breaches() is the mechanism; the org window
// is worry_sla_minutes = 20. There is no repeating page and no named physician:
// no patient-to-prescriber assignment exists, so the queue goes to every
// prescriber in the org. Nothing here prescribes anything.
import {chromium} from 'playwright-core';
import {readFileSync, mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'build/footage/physician-queue/';
mkdirSync(out, {recursive:true});
const fixture = JSON.parse(readFileSync(root+'remotion/public/reassessment/fixtures.json'));
// Two minutes past the 21:31:25 SLA deadline, so the overdue state is earned.
const CLOCK = '2026-10-31T21:33:25.136287+00:00';
const open = {...fixture.review, status:'open', acknowledged_at:null, assessed_at:null, ack_by:null, assess_by:null};
const overdue = {...open, status:'auto_escalated'};
/* Filmed as a transition, not an end state. useEscalationAlerts() is mounted at
   the App root with no role gate and reads the same /patients/mine poll a nurse
   reads, so a prescriber gets the identical in-app notice. escalationEvents()
   raises it on exactly this change — status becoming auto_escalated — at
   severity "critical", and critical notices have no TTL, so it stays up.
   Before the flip, reaches_physician() is false for an open news_high rule, so
   the queue correctly shows its empty state: vitals-only escalations stay with
   the nursing tier. The row and the notice arrive together on the same poll. */
let phase = 'open';
const review = () => phase === 'open' ? open : overdue;
const reaches = () => phase !== 'open';
const beds = Array.from({length:8},(_,i)=>602+i).flatMap((room,i)=>(i<4?['A','B']:['B']).map(letter=>({id:`bed-${room}-${letter}`,org_id:'a',unit_id:'u1',room:String(room),bed:room===609?'9B':`${room}-${letter}`,occupied:room===609})));
const errors = [], unexpected = [];
const chrome = '/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({executablePath:chrome, args:['--hide-scrollbars']});
const manifest = {browserOnly:true, noLiveWrites:true, nurse:{}, charge:{}, prescriber:{}};

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
  const env = readFileSync(root+`../${port===5173?'nursing-app':'nursing-dashboard'}/.env.local`,'utf8');
  const url = env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
  if(!url)throw Error('Supabase URL configuration missing');
  const key=`sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
  const user={id:'doc-demo',email:'prescriber@demo.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:fixture.generatedAt};
  const expires=Math.floor(Date.now()/1000)+3600;
  const token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'+Buffer.from(JSON.stringify({sub:user.id,exp:expires,role:'authenticated'})).toString('base64url')+'.rehearsal';
  await ctx.addInitScript(({key,user,token,expires})=>localStorage.setItem(key,JSON.stringify({access_token:token,refresh_token:'offline-demo',expires_at:expires,expires_in:3600,token_type:'bearer',user})),{key,user,token,expires});
  await ctx.addInitScript(cursor);
  await ctx.route(/https:\/\/.*\.supabase\.co\//, route=>route.abort());
  await ctx.route('**/api/v1/**',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname, method=req.method();
    let body;
    const signal=fixture.submitted.worry_signal;
    const risk={...fixture.submitted.risk, worry_level:4, inputs:{}};
    const patient={...fixture.patient,risk_score:risk.score,risk_components:{worry:risk.worry_component,vitals:risk.vitals_component,trend:risk.trend_component},risk_inputs:{},latest_vitals:fixture.vitals.at(-1),latest_news:risk.latest_news,news_band:risk.news_band,news_alert:{score:risk.latest_news,band:risk.news_band,single_red_parameters:[]},latest_worry:signal,open_escalation:review(),escalation_rule_label:review().rule_label,
      // Mirrors reaches_physician(): an open news_high rule does not qualify,
      // auto_escalated always does.
      escalation_reaches_physician:reaches()};
    if(method==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    if(method==='GET'&&path==='/api/v1/me') body={user:{id:user.id,email:user.email,full_name:'On-call prescriber',role:'prescriber',unit_id:'u1',is_org_wide:true},organization:{id:'a',name:'Mercy General · Demo',slug:'demo',worry_sla_minutes:20},unit:{id:'u1',name:'6 North Telemetry'}};
    else if(method==='GET'&&path==='/api/v1/beds')body={beds};
    else if(method==='GET'&&path==='/api/v1/admin/units')body={units:[{id:'u1',name:'6 North Telemetry'}]};
    else if(method==='GET'&&(path==='/api/v1/patients/mine'||path==='/api/v1/dashboard/patients'))body={patients:[patient]};
    else if(method==='GET'&&path==='/api/v1/patients/p1')body={patient,vitals:fixture.vitals,vital_bands:fixture.vitalBands,nurse_notes:[],worry_signals:[signal],escalations:[review()],risk,risk_history:[]};
    // The server filters this queue through reaches_physician(); mirror it.
    else if(method==='GET'&&path==='/api/v1/dashboard/escalations')body={escalations:reaches()?[overdue]:[]};
    else if(method==='GET'&&path==='/api/v1/dashboard/summary')body={active_patients:1,open_escalations:1,sla_breaches:reaches()?1:0};
    // No medication in this film: the prescriber has nothing to approve.
    else if(method==='GET'&&path==='/api/v1/medication/reviews')body={reviews:[]};
    else {unexpected.push({method,path});return route.fulfill({status:501,json:{error:'Unimplemented rehearsal request'}});}
    await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*'},json:body});
  });
  const page=await ctx.newPage();
  // install(), not setFixedTime: the 15s patient poll has to be driven on demand.
  await page.clock.install({time:new Date(CLOCK)});
  page.on('pageerror',e=>errors.push({role,error:e.message}));
  const start=Date.now();
  const mark=name=>{manifest[role][name]=(Date.now()-start)/1000;};
  await page.goto(`http://localhost:${port}/alerts`);
  return {page,ctx,mark};
}

try {
  const doc=await makePage('prescriber',5173);
  await doc.page.evaluate(()=>window.__cursor(-100,-100));
  // Before: nothing has reached a physician yet.
  await doc.page.getByText(/Nothing has been escalated to a physician/).waitFor({timeout:15000});
  doc.mark('empty');
  await doc.page.screenshot({path:out+'1-empty.png'});
  // Let the first completed poll become the baseline snapshot, otherwise every
  // open escalation would announce itself on sign-in and nothing would change.
  await doc.page.waitForTimeout(1200);

  // The SLA window lapses. The next poll carries auto_escalated.
  phase='overdue';
  await doc.page.clock.fastForward(16_000);
  const notice=doc.page.getByText('Bed 9B · Room 609 — escalation overdue',{exact:true});
  await notice.waitFor({timeout:15000});
  await doc.page.getByText('Timmy Buttons has not received the required response. Open to assess.',{exact:true}).waitFor({timeout:15000});
  doc.mark('notice');
  manifest.notice=await notice.boundingBox();
  await doc.page.screenshot({path:out+'2-notice.png'});

  const badge=doc.page.getByText('Nursing tier did not respond',{exact:true});
  await badge.waitFor({timeout:15000});
  await doc.page.getByText('Room 609 · Timmy Buttons',{exact:true}).waitFor({timeout:15000});
  doc.mark('queue');
  manifest.badge=await badge.boundingBox();
  await doc.page.screenshot({path:out+'3-queue.png'});
  await doc.page.waitForTimeout(7000);
  if(errors.length||unexpected.length)throw Error(JSON.stringify({errors,unexpected}));
  const video=doc.page.video();await doc.ctx.close();
  mkdirSync(root+'remotion/public/physician-queue/',{recursive:true});
  copyFileSync(await video.path(),root+'remotion/public/physician-queue/prescriber.webm');
  writeFileSync(root+'remotion/public/physician-queue/capture.json',JSON.stringify({...manifest,errors,unexpected},null,2));
  console.log(JSON.stringify(manifest,null,2));
}finally{await browser.close();}
