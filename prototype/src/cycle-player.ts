import { CYCLE_STEPS, EXAMPLE_LIMITS, processFrame, processRecord, recoveryStart, seatPoints } from './process.ts';
import type { CycleCase, ProcessFrame, ProcessRecord } from './process.ts';
import { CLEAR_SECONDS, CLEAR_SPAN, CYCLE_END, FIRST_UNIT, INDEX_START } from './line.ts';
import type { LineState } from './line.ts';
import type { WorkcellScene } from './scene.ts';

// Milliseconds per percent of the cycle, by step: the arm is moving within half a second of Play, each
// camera check holds its ring light for about 1.3 s, the cradle places end slowly and the press keeps time to
// read. The index to the next unit takes 3.2 s, so a pass takes about 25 s; the fallback search spends longer
// in the press, and a reject's retry takes about 11 s.
export const PACE=[120,240,220,390,250,250,200,180,150,160,400];
// A cleared reject: the first CLEAR_SPAN of its index is the robot posting the harness into the bin, CLEAR_SECONDS
// (line.ts); the bare board's index over the rest takes as long as a pass's whole index, so the pallets move at the
// same speed either way.
const SEARCH_PRESS=500,RETRY_MS=11000,CLEAR_MS=CLEAR_SECONDS*1000/(CLEAR_SPAN*(CYCLE_END-INDEX_START)),REJECT_INDEX=PACE[10]/(1-CLEAR_SPAN);
export const isReject=(kind:CycleCase)=>recoveryStart(kind)!==null;
export function pace(p:number,kind:CycleCase){
  if(p>=INDEX_START)return isReject(kind)?p<INDEX_START+CLEAR_SPAN*(CYCLE_END-INDEX_START)?CLEAR_MS:REJECT_INDEX:PACE[10];
  const start=recoveryStart(kind);
  if(start!==null&&p>=start)return RETRY_MS/(100-start);
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  return kind==='search'&&step===6?SEARCH_PRESS:PACE[step];
}
// Seconds a played cycle takes, as the player's clock runs it.
export function cycleSeconds(kind:CycleCase,from=0,to=CYCLE_END){
  let ms=0;for(let p=from;p<to;p+=.01)ms+=.01*pace(p+.005,kind);
  return ms/1000;
}

// A played line: the unit on the work pallet, how far its cycle has run, and what the line has made so far.
// operator: how far the operator side had got on this unit before the robot's cycle was restarted on it.
// next: a case chosen once this unit had its verdict, for the next unit.
export interface LineRun { progress:number; kind:CycleCase; line:LineState; held:boolean; cleared:boolean; logged:boolean; operator?:number; next?:CycleCase }
export const startRun=(kind:CycleCase='pass',line:LineState=FIRST_UNIT):LineRun=>({progress:0,kind,line,held:false,cleared:false,logged:false,operator:0});
export const runFrame=(run:LineRun)=>processFrame(run.progress,run.kind,run.line,Math.max(run.progress,run.operator??0));
// The verdict the frame on screen shows for the unit on the work pallet, if any: from the release (or the second
// failure) on, and through the index.
export function verdict(run:LineRun,f:ProcessFrame=runFrame(run)):'pass'|'reject'|null{
  return f.accepted===true?'pass':f.accepted===false?'reject':run.progress>=INDEX_START?(isReject(run.kind)?'reject':'pass'):null;
}
// The line's counters as the readout shows them: what the frame on screen shows, so a scrub back before the
// verdict shows the unit not counted yet.
export function tally(run:LineRun,f:ProcessFrame=runFrame(run)){
  const v=verdict(run,f);
  return {passed:run.line.passed+(v==='pass'?1:0),rejected:run.line.rejected+(v==='reject'?1:0)};
}
// Whether this unit is done as far as a restart or a case switch goes: it has shown its verdict, or was logged.
export const finished=(run:LineRun)=>run.logged||verdict(run)!==null;
// Restart the robot's cycle on this unit, optionally with another case. A unit that has its verdict is finished
// first (the caller logs it if it was not yet), so the restart applies to the next unit and nothing is counted
// twice; otherwise the operator side keeps its place, and a case queued for the next unit applies to this one now.
export function restartRun(run:LineRun,kind?:CycleCase):LineRun{
  if(finished(run))return startRun(kind??run.next??'pass',nextLine(run.line,run.kind));
  return {...run,kind:kind??run.next??run.kind,next:undefined,progress:0,logged:false,cleared:false,held:false,operator:Math.max(run.operator??0,Math.min(run.progress,INDEX_START))};
}
// Whether the unit's frames under `kind` match the current case's all the way to the current progress, so the case
// can change in place without restarting the robot's cycle.
const caseKey=(f:ProcessFrame)=>[...f.tool,...f.plug,f.jaw,f.rotation,f.force,f.pullForce,f.detail,f.message,f.title,f.contacts.join(),f.seated,f.pull].map(v=>typeof v==='number'?v.toFixed(4):v).join();
// Where two cases first look different on the 0.05 % grid. What the robot does does not depend on the line, so each
// pair is scanned once (setupCycle scans them in idle time, so a click never waits for it).
const divergence=new Map<string,number>();
export function divergesAt(a:CycleCase,b:CycleCase){
  const id=a<b?`${a}|${b}`:`${b}|${a}`;let at=divergence.get(id);
  if(at===undefined){at=Infinity;for(let i=0;i<=INDEX_START*20;i++){const p=i/20;if(caseKey(processFrame(p,a))!==caseKey(processFrame(p,b))){at=p;break;}}divergence.set(id,at);}
  return at;
}
export function sameSoFar(run:LineRun,kind:CycleCase){
  if(run.progress>=INDEX_START)return false;if(kind===run.kind)return true;
  return run.progress<divergesAt(run.kind,kind)-1e-9&&caseKey(processFrame(run.progress,run.kind,run.line))===caseKey(processFrame(run.progress,kind,run.line));
}
export function nextLine(line:LineState,kind:CycleCase):LineState {
  const pass=!isReject(kind);
  return {unit:line.unit+1,passed:line.passed+(pass?1:0),rejected:line.rejected+(pass?0:1),prev:pass?'pass':'reject'};
}
// How far the slider and the clock may run: a reject stops the line at 100 until a person clears it.
export const runEnd=(run:LineRun)=>isReject(run.kind)&&!run.cleared?INDEX_START:CYCLE_END;
export interface RunEvents { log?:(run:LineRun)=>void; hold?:(run:LineRun)=>void; next?:(run:LineRun)=>void }
// Play the line on by ms. At 100 the unit is logged once; a reject then holds the line; at 108 the next unit
// is in place, the counters move on and a fault case goes back to a pass, carrying the remaining time over.
export function advanceRun(from:LineRun,ms:number,events:RunEvents={}):LineRun {
  const run={...from};
  while(ms>1e-9&&!run.held){
    const boundary=run.progress<INDEX_START?INDEX_START:CYCLE_END,rate=pace(run.progress,run.kind);
    const dp=Math.min(ms/rate,.25,boundary-run.progress);
    run.progress+=dp;ms-=dp*rate;
    if(boundary-run.progress<1e-9)run.progress=boundary;
    if(run.progress>=INDEX_START&&!run.logged){run.logged=true;events.log?.(run);}
    if(run.progress>=INDEX_START&&isReject(run.kind)&&!run.cleared){run.progress=INDEX_START;run.held=true;events.hold?.(run);break;}
    if(run.progress>=CYCLE_END){
      run.line=nextLine(run.line,run.kind);run.kind=run.next??'pass';run.next=undefined;run.progress=0;run.logged=false;run.cleared=false;run.operator=0;events.next?.(run);
    }
  }
  return run;
}

// Play starts the next unit only from the very end of this one. Anywhere before, it plays on from where it is, so a
// reject scrubbed to 100 is logged and holds the line for Clear reject, as a played one does.
export const restartsOnPlay=(run:LineRun)=>run.progress>=CYCLE_END;
// Reset: a reject that has its verdict but has not been cleared goes to the held line (only Clear reject moves it
// on); anything else restarts as restartRun does.
export function resetRun(run:LineRun):LineRun{
  if(isReject(run.kind)&&!run.cleared&&finished(run))return {...run,progress:INDEX_START,held:true};
  return restartRun(run);
}
// A case picked while the robot works applies at once only while this unit has done nothing that would differ;
// otherwise, and once the unit has its verdict, it is queued for the next unit, so the arm never jumps.
export function pickCase(run:LineRun,kind:CycleCase):LineRun{
  if(finished(run))return {...run,next:kind};
  if(kind===run.kind)return {...run,next:undefined};
  return sameSoFar(run,kind)?{...run,kind,next:undefined}:{...run,next:kind};
}
// A scrub only looks. One back into a unit that has no verdict yet drops a case queued for the next unit.
export function scrubRun(run:LineRun,value:number):LineRun{
  const r={...run,progress:Math.min(value,runEnd(run))};
  return finished(r)?r:{...r,next:undefined};
}
// The case the buttons show pressed: one queued for the next unit, else what this unit runs.
export const pressedCase=(run:LineRun):CycleCase=>run.next??run.kind;
export const CASE_NAMES:Record<CycleCase,string>={pass:'Pass',search:'Needs a search','half-seat':'Half-seated',open:'Open wire',short:'Shorted wires'};
export const queuedNote=(run:LineRun)=>run.next?`${CASE_NAMES[run.next]} next`:'';
// The step's retry tag: through the second attempt, gone once the unit is rejected and through the index.
export const retryShown=(f:ProcessFrame)=>!!f.retry&&!f.rejected&&f.accepted!==false&&f.step!==CYCLE_STEPS.length-1;

export function setupCycle(scene:WorkcellScene,onActivate:()=>void,onEnter:()=>void=()=>{}){
  const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
  const slider=byId<HTMLInputElement>('cycle-scrub'),play=byId<HTMLButtonElement>('cycle-play');
  const reset=byId<HTMLButtonElement>('cycle-reset'),clearFault=byId<HTMLButtonElement>('cycle-clear-fault');
  const tour=byId<HTMLButtonElement>('tour');
  const caseButtons=[...document.querySelectorAll<HTMLButtonElement>('[data-cycle-case]')];
  const records:ProcessRecord[]=[];
  // Every listener the player adds goes with dispose().
  const ctl=new AbortController(),on={signal:ctl.signal};
  let run=startRun(),disposed=false,playing=false,active=true,request=0,last=0,lastContacts='',traceKind='',started=false,nudgeTimer=0;
  const steps=byId('process-steps');
  steps.innerHTML=CYCLE_STEPS.map((s,i)=>`<li><button data-cycle-step="${i}" aria-current="false">${s[0]}</button></li>`).join('');
  const pad=(n:number)=>String(n).padStart(3,'0');

  const draw=()=>{
    if(!active)return;
    const {progress,kind,held}=run,f=runFrame(run),end=runEnd(run);
    scene.setProcess(f);document.body.dataset.shot=f.shot;
    // The slider always spans the whole unit; while a reject holds the line, the index part is shown locked.
    if(slider.max!==String(CYCLE_END))slider.max=String(CYCLE_END);
    slider.value=String(progress);slider.style.setProperty('--p',`${progress/CYCLE_END*100}%`);
    slider.style.setProperty('--lock',`${end/CYCLE_END*100}%`);slider.dataset.locked=String(held);
    byId('cycle-percent').textContent=`${Math.round(progress/CYCLE_END*100)}%`;
    byId('cycle-title').textContent=f.step===CYCLE_STEPS.length-1?f.title:f.accepted===true&&progress>=95?'Passed':f.rejected?'Rejected':f.title;
    const retry=document.getElementById('cycle-retry');if(retry)retry.hidden=!retryShown(f);
    const d=document.getElementById('cycle-detail');if(d){d.textContent=f.detail;d.hidden=!f.detail;}
    const status=document.getElementById('line-status');
    const count=tally(run,f);
    const queued=queuedNote(run);
    if(status)status.textContent=`${count.passed} passed · ${count.rejected} rejected${f.lineNote?` · ${f.lineNote}`:''}${queued?` · ${queued}`:''}`;
    byId('cycle-copy').textContent=f.message;byId('cycle-scope').textContent=f.scope;
    byId('cycle-force').textContent=`${f.force.toFixed(1)} / ${EXAMPLE_LIMITS.press.toFixed(0)} N`;
    byId('cycle-depth').textContent=`${f.depth.toFixed(1)} mm`;
    byId('cycle-pull').textContent=`${f.pullForce.toFixed(1)} / ${EXAMPLE_LIMITS.pull.toFixed(0)} N`;
    byId('cycle-extraction').textContent=`${f.extractionForce.toFixed(1)} / ${EXAMPLE_LIMITS.extraction.toFixed(0)} N`;
    byId('cycle-extraction-row').hidden=!f.retry;
    byId('cycle-tries').textContent=f.retry?'Retry 1 / 1':String(f.tries);
    for(const [id,value] of [['seat-result',f.seated],['pull-result',f.pull],['wiring-result',f.contacts.includes('fail')?'fail':f.contacts.every(x=>x==='pass')?'pass':'pending']]){
      byId(id).textContent=value==='pending'?'—':value.toUpperCase();byId(id).dataset.result=value;
    }
    const contactKey=f.contacts.join()+f.contactFaults.join();
    if(lastContacts!==contactKey){
      lastContacts=contactKey;
      byId('contact-results').innerHTML=f.contacts.map((v,i)=>`<span data-result="${v}" aria-label="Contact ${i+1}: ${f.contactFaults[i]??(v==='pending'?'untested':'open and short checks passed')}" title="${f.contactFaults[i]??(v==='pending'?'Untested':'Open and short checks passed')}"><small>${i+1}</small>${v==='pending'?'·':v==='pass'?'✓':'×'}</span>`).join('');
    }
    byId('cycle-contact-note').textContent=f.contactFaults.some(Boolean)?f.contactFaults.map((reason,i)=>reason?`${i+1}: ${reason}`:'').filter(Boolean).join(' · '):'Per wire: continuity + isolation';
    const failed=f.pull==='fail'||f.contacts.includes('fail');
    const indexing=f.step===CYCLE_STEPS.length-1;
    byId('cycle-verdict').textContent=indexing?(isReject(kind)?'Reject cleared · the line moves on':'The line moves the next unit in'):f.accepted===true?(kind==='search'?'All three checks passed · flagged: search used':'All three checks passed'):f.accepted===false?'Rejected · line stopped until a person clears it':f.step===CYCLE_STEPS.length-1?'The line moves the next unit in':f.retry?'Attempt 2 · fresh checks':failed?'Check failed · stop this attempt':f.step===1||f.step===4?'Measuring this unit':f.step<6?'Preparing the unit':'Checks in progress';
    byId('cycle-verdict').dataset.result=indexing?'pending':f.accepted===true?'pass':f.accepted===false||failed?'fail':'pending';
    for(const button of steps.querySelectorAll('button'))button.setAttribute('aria-current',String(Number(button.dataset.cycleStep)===f.step));
    play.textContent=playing?'Pause':'Play';play.setAttribute('aria-pressed',String(playing));play.disabled=held;
    reset.disabled=held;clearFault.hidden=!held;
    for(const button of caseButtons)button.disabled=held;slider.disabled=held;for(const button of steps.querySelectorAll('button'))button.disabled=held;
    // A held reject leaves Play pressable, so a press can point at Clear reject instead of doing nothing.
    tour.dataset.playing=String(playing);tour.disabled=false;tour.setAttribute('aria-disabled',String(held));
    tour.setAttribute('aria-label',held?'Clear the reject first':playing?'Pause':'Play');tour.setAttribute('aria-pressed',String(playing));
    byId('tour-label').textContent=held?'Clear the reject first':playing?'Pause':'Play';
    byId<HTMLButtonElement>('embed-run').disabled=held;
    drawTrace(f);
  };
  const traceX=(p:number)=>p*300/CYCLE_END;
  function drawTrace(f:ProcessFrame){
    if(traceKind!==run.kind){
      traceKind=run.kind;
      byId('cycle-trace').setAttribute('points',Array.from({length:CYCLE_END*10+1},(_,i)=>{const sample=processFrame(i/10,run.kind);return `${traceX(i/10).toFixed(2)},${traceY(sample).toFixed(2)}`;}).join(' '));
      byId('cycle-seat-points').innerHTML=seatPoints(run.kind).map((p,i)=>`<g data-progress="${p}" transform="translate(${traceX(p).toFixed(2)} 0)"><line y1="4" y2="49" stroke="#426950" stroke-dasharray="2 2" opacity=".5"/><text x="-3" y="8" text-anchor="end" fill="#426950" font-size="8">seat ${i+1}</text></g>`).join('');
    }
    byId('cycle-trace-window').setAttribute('width',String(traceX(f.progress)));
    byId('cycle-cursor').setAttribute('x1',String(traceX(f.progress)));byId('cycle-cursor').setAttribute('x2',String(traceX(f.progress)));
    for(const mark of byId('cycle-seat-points').children)mark.setAttribute('visibility',f.progress>=Number((mark as SVGElement).dataset.progress)?'visible':'hidden');
  }
  // Press up, pull and extraction down, at the newton scale of the example limits.
  function traceY(f:{force:number;pullForce:number;extractionForce:number}){return 29-(f.force-f.pullForce-f.extractionForce)*.42;}
  function stop(){playing=false;cancelAnimationFrame(request);request=0;draw();}
  function activate(){if(!active){active=true;document.body.classList.add('process-mode');onActivate();onEnter();}document.body.classList.remove('tour-active');}
  // The cases roll past "This unit": the picked one sits beside it, the others fade above and below.
  const caseList=document.querySelector<HTMLElement>('.roll__list'),caseRoll=document.querySelector<HTMLElement>('.roll');
  function rollCases(at:number){if(!caseList)return;const h=caseButtons[0]?.offsetHeight||40;
    caseList.style.transform=`translateY(${(-at*h-h/2).toFixed(1)}px)`;
    caseButtons.forEach((b,i)=>{b.style.opacity=Math.max(.14,1-Math.abs(i-at)*.42).toFixed(3);});}
  function syncCases(kind=pressedCase(run)){let at=0;caseButtons.forEach((b,i)=>{const on=b.dataset.cycleCase===kind;b.setAttribute('aria-pressed',String(on));if(on)at=i;});rollCases(at);}
  const events:RunEvents={
    log:r=>log(r),
    hold:()=>{playing=false;},
    next:r=>syncCases(r.kind),
  };
  function tick(now:number){
    if(!playing)return;
    run=advanceRun(run,Math.min(80,now-last),events);last=now;
    if(run.held){stop();return;}
    draw();request=requestAnimationFrame(tick);
  }
  function go(){playing=true;last=performance.now();draw();cancelAnimationFrame(request);request=requestAnimationFrame(tick);}
  // While a reject holds the line, Play and Restart point at the one control that moves it on.
  function nudge(){
    clearFault.classList.remove('nudge');void clearFault.offsetWidth;clearFault.classList.add('nudge');tour.classList.remove('tip-off');tour.classList.add('show-tip');
    clearTimeout(nudgeTimer);nudgeTimer=window.setTimeout(()=>{clearFault.classList.remove('nudge');tour.classList.remove('show-tip');},1600);
  }
  function toggle(){
    // Bring the stage back first, so a held reject shows its Clear reject button again.
    activate();if(run.held){nudge();draw();return;}if(playing){stop();return;}onActivate();
    if(!started||restartsOnPlay(run)){finish();run=restartRun(run);syncCases();}started=true;
    go();
  }
  // Reset: an uncleared reject with its verdict is logged and holds the line for Clear reject, never skipped.
  function restart(){
    if(run.held){activate();nudge();draw();return;}activate();stop();
    const next=resetRun(run);finish();run={...next,logged:next.held||next.logged};syncCases();draw();if(run.held)nudge();
  }
  // A unit with its verdict is logged once before the line moves on past it.
  function finish(){if(finished(run)&&!run.logged){run={...run,logged:true};log(run);}}
  function showStage(){document.querySelector('.stage')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function log(r:LineRun){
    const record=processRecord(r.line.unit,r.kind);records.push(record);
    const row=document.createElement('li'),title=document.createElement('strong');
    title.textContent=`Illustrated unit ${pad(record.id)} · ${record.case} · ${record.accepted?'accepted':'rejected / a person clears it'}${record.flag?` · flagged: ${record.flag.toLowerCase()}`:''}`;row.append(title);
    const measured=document.createElement('p');measured.textContent=`Measured: header ${Math.hypot(...record.measured.header).toFixed(2)} mm from nominal, grip ${Math.hypot(...record.measured.grip).toFixed(2)} mm off centre.`;row.append(measured);
    for(const attempt of record.attempts){
      const line=document.createElement('p');
      const contacts=attempt.contacts.map((result,i)=>`${i+1} ${attempt.contactFaults[i]??(result==='pending'?'untested':result)}`).join(', ');
      line.textContent=`Attempt ${attempt.number}: seat ${attempt.seated}, pull ${attempt.pull}; contacts ${contacts}. ${attempt.reason??'All three checks passed.'}`;row.append(line);
    }
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 300 52');svg.setAttribute('class','record-trace');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Illustrated force trace for unit ${record.id}, including ${record.attempts.length} attempt${record.attempts.length>1?'s':''}`);
    const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',record.trace.map(s=>`${s.progress*3},${traceY({force:s.press,pullForce:s.pull,extractionForce:s.extraction}).toFixed(2)}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','1.2');svg.append(line);row.append(svg);
    byId('cycle-log').prepend(row);byId<HTMLButtonElement>('cycle-export').disabled=false;
    byId('cycle-log-status').textContent=`${records.length} illustrated unit${records.length>1?'s':''} recorded during this visit. Download to retain the checks and force traces.`;
  }
  // Scrubbing only looks; a unit is recorded, a reject held and the line moved on only by a played cycle.
  slider.addEventListener('input',()=>{if(run.held)return;started=true;activate();const value=Number(slider.value);stop();run=scrubRun(run,value);syncCases();draw();},on);
  play.addEventListener('click',toggle,on);reset.addEventListener('click',restart,on);
  // A person clears the reject; the robot then posts the harness into the locked bin and the bare board indexes on.
  // The post's rope track finishes building in the background after the reveal; on the rare early clear it waits.
  let clearing=false;
  clearFault.addEventListener('click',()=>{
    if(!run.held||clearing)return;
    const built=scene.tracksBuilt?.();
    if(built&&!scene.tracksDone?.()){clearing=true;clearFault.setAttribute('aria-busy','true');built.then(()=>{clearing=false;clearFault.removeAttribute('aria-busy');clearFault.click();});return;}
    run={...run,held:false,cleared:true};started=true;clearTimeout(nudgeTimer);clearFault.classList.remove('nudge');tour.classList.remove('show-tip');
    byId('cycle-log-status').textContent='Reject cleared by the viewer. Previous unit records and traces are retained below.';activate();go();
  },on);
  byId('cycle-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({source:'Defex scripted cycle illustration',measurements:false,units:records},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='defex-illustrated-unit-traces.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },on);
  steps.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-cycle-step]');if(button&&!run.held){started=true;activate();stop();run=scrubRun(run,CYCLE_STEPS[Number(button.dataset.cycleStep)][1]);syncCases();draw();showStage();}},on);
  for(const button of caseButtons)button.addEventListener('click',()=>{
    // A switch changes this unit's case in place while the unit has not yet done anything that differs; otherwise,
    // and once the unit has its verdict, it is queued for the next unit (pickCase). While playing it plays on.
    if(run.held)return;const kind=button.dataset.cycleCase as CycleCase,wasPlaying=playing;activate();stop();
    run=pickCase(run,kind);started=true;
    syncCases();draw();if(wasPlaying)go();
  },on);
  // Scroll or swipe over the roll to step through the cases; at either end the page scrolls on.
  const pressedAt=()=>caseButtons.findIndex(b=>b.getAttribute('aria-pressed')==='true');
  const stepCase=(d:number)=>{const to=caseButtons[pressedAt()+d];if(!to||to.disabled)return false;to.click();return true;};
  let wheelSum=0,wheelAt=0;
  caseRoll?.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)return;const now=performance.now(),d=Math.sign(e.deltaY);
    if(!caseButtons[pressedAt()+d])return;e.preventDefault();if(now-wheelAt<380)return;
    wheelSum+=e.deltaY;if(Math.abs(wheelSum)<40)return;wheelSum=0;if(stepCase(d))wheelAt=now;},{passive:false,signal:ctl.signal});
  let touchY=0;
  caseRoll?.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true,signal:ctl.signal});
  caseRoll?.addEventListener('touchend',e=>{const dy=touchY-e.changedTouches[0].clientY;if(Math.abs(dy)>28)stepCase(Math.sign(dy));},{passive:true,signal:ctl.signal});
  // The one play button always plays the full cycle, even after a contact experiment ran.
  for(const id of ['tour','embed-run'])byId(id).addEventListener('click',e=>{e.stopImmediatePropagation();if(e.detail<2)toggle();},{capture:true,signal:ctl.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();},on);
  // Scan the case pairs a click can ask about while the page is idle.
  const kinds=caseButtons.map(b=>b.dataset.cycleCase as CycleCase),pairs=kinds.flatMap((a,i)=>kinds.slice(i+1).map(b=>[a,b] as const));
  const idle=(cb:()=>void)=>'requestIdleCallback' in window?requestIdleCallback(cb,{timeout:4000}):setTimeout(cb,200);
  const scan=()=>{const pair=pairs.shift();if(!pair||disposed)return;divergesAt(...pair);idle(scan);};idle(scan);
  document.body.classList.add('process-mode');draw();syncCases();
  function deactivate(){stop();active=false;document.body.classList.remove('process-mode');scene.setProcess(null);}
  // For good, e.g. when the 3D view is lost: the player stops, lets go of the scene and removes every listener and
  // timer it added, so nothing it owned runs again. Safe to call more than once.
  function dispose(){if(disposed)return;deactivate();disposed=true;ctl.abort();clearTimeout(nudgeTimer);clearFault.classList.remove('nudge');tour.classList.remove('show-tip');}
  return {refresh:()=>{if(!disposed)draw();},toggle:()=>{if(!disposed)toggle();},restart:()=>{if(!disposed)restart();},deactivate,dispose,isActive:()=>active&&!disposed,isHeld:()=>run.held};
}
