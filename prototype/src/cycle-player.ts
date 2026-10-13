import { CYCLE_STEPS, EXAMPLE_LIMITS, processFrame, processRecord, recoveryStart, seatPoints } from './process.ts';
import type { CycleCase, ProcessFrame, ProcessRecord } from './process.ts';
import type { WorkcellScene } from './scene.ts';

// Milliseconds per percent of the cycle, by step: the arm is moving within half a second of Play, each
// camera check holds its ring light for about 0.8 s and the press keeps time to read. A pass takes about
// 21 s; the fallback search spends longer in the press, and a reject's retry takes about 11 s.
const PACE=[120,240,220,320,250,250,200,180,150,160];
const SEARCH_PRESS=500,RETRY_MS=11000;
export function pace(p:number,kind:CycleCase){
  const start=recoveryStart(kind);
  if(start!==null&&p>=start)return RETRY_MS/(100-start);
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  return kind==='search'&&step===6?SEARCH_PRESS:PACE[step];
}
// Seconds a played cycle takes, as the player's clock runs it.
export function cycleSeconds(kind:CycleCase,from=0,to=100){
  let ms=0;for(let p=from;p<to;p+=.01)ms+=.01*pace(p+.005,kind);
  return ms/1000;
}

export function setupCycle(scene:WorkcellScene,onActivate:()=>void,onEnter:()=>void=()=>{}){
  const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
  const slider=byId<HTMLInputElement>('cycle-scrub'),play=byId<HTMLButtonElement>('cycle-play');
  const reset=byId<HTMLButtonElement>('cycle-reset'),clearFault=byId<HTMLButtonElement>('cycle-clear-fault');
  const caseButtons=[...document.querySelectorAll<HTMLButtonElement>('[data-cycle-case]')];
  const records:ProcessRecord[]=[];
  let progress=0,kind:CycleCase='pass',playing=false,active=true,request=0,last=0,lastContacts='',traceKind='';
  let faultLocked=false,logged=false,started=false;
  const steps=byId('process-steps');
  steps.innerHTML=CYCLE_STEPS.map((s,i)=>`<button data-cycle-step="${i}" aria-current="false"><span>${String(i+1).padStart(2,'0')}</span><strong>${s[0]}</strong></button>`).join('');

  const draw=()=>{
    if(!active)return;
    const f=processFrame(progress,kind);scene.setProcess(f);slider.value=String(progress);slider.style.setProperty('--p',`${progress}%`);
    byId('cycle-percent').textContent=`${Math.round(progress)}%`;
    byId('cycle-title').textContent=f.accepted===true&&progress>=95?'Passed':f.rejected?'Rejected':f.title;byId('cycle-index').textContent=f.retry?'2nd':String(f.step+1).padStart(2,'0');
    const d=document.getElementById('cycle-detail');if(d){d.textContent=f.detail;d.hidden=!f.detail;}
    byId('cycle-copy').textContent=f.message;byId('cycle-scope').textContent=f.scope;
    byId('cycle-force').textContent=`${f.force.toFixed(1)} / ${EXAMPLE_LIMITS.press.toFixed(1)} N`;
    byId('cycle-depth').textContent=`${f.depth.toFixed(1)} mm`;
    byId('cycle-pull').textContent=`${f.pullForce.toFixed(1)} / ${EXAMPLE_LIMITS.pull.toFixed(1)} N`;
    byId('cycle-extraction').textContent=`${f.extractionForce.toFixed(1)} / ${EXAMPLE_LIMITS.extraction.toFixed(1)} N`;
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
    byId('cycle-verdict').textContent=f.accepted===true?(kind==='search'?'All three checks passed · flagged: search used':'All three checks passed'):f.accepted===false?'Rejected · operator action required':f.retry?'Attempt 2 · fresh checks':failed?'Check failed · stop this attempt':f.step===1||f.step===4?'Measuring this unit':f.step<6?'Preparing the unit':'Checks in progress';
    byId('cycle-verdict').dataset.result=f.accepted===true?'pass':f.accepted===false||failed?'fail':'pending';
    for(const button of steps.querySelectorAll('button'))button.setAttribute('aria-current',String(Number(button.dataset.cycleStep)===f.step));
    play.textContent=playing?'Pause':'Play';play.setAttribute('aria-pressed',String(playing));play.disabled=faultLocked;
    reset.disabled=faultLocked;clearFault.hidden=!faultLocked;
    for(const button of caseButtons)button.disabled=faultLocked;slider.disabled=faultLocked;for(const button of steps.querySelectorAll('button'))button.disabled=faultLocked;
    const tour=byId<HTMLButtonElement>('tour');tour.dataset.playing=String(playing);tour.disabled=faultLocked;
    tour.setAttribute('aria-label',faultLocked?'Clear the reject first':playing?'Pause':'Play');tour.setAttribute('aria-pressed',String(playing));
    byId('tour-label').textContent=faultLocked?'Clear the reject first':playing?'Pause':'Play';
    byId<HTMLButtonElement>('embed-run').disabled=faultLocked;
    drawTrace(f);
  };
  function drawTrace(f:ProcessFrame){
    if(traceKind!==kind){
      traceKind=kind;
      byId('cycle-trace').setAttribute('points',Array.from({length:1001},(_,i)=>{const sample=processFrame(i/10,kind);return `${i*.3},${traceY(sample)}`;}).join(' '));
      byId('cycle-seat-points').innerHTML=seatPoints(kind).map((p,i)=>`<g data-progress="${p}" transform="translate(${p*3} 0)"><line y1="4" y2="49" stroke="#426950" stroke-dasharray="2 2" opacity=".5"/><text x="-3" y="8" text-anchor="end" fill="#426950" font-size="8">seat ${i+1}</text></g>`).join('');
    }
    byId('cycle-trace-window').setAttribute('width',String(f.progress*3));
    byId('cycle-cursor').setAttribute('x1',String(f.progress*3));byId('cycle-cursor').setAttribute('x2',String(f.progress*3));
    for(const mark of byId('cycle-seat-points').children)mark.setAttribute('visibility',f.progress>=Number((mark as SVGElement).dataset.progress)?'visible':'hidden');
  }
  function traceY(f:ProcessFrame){return 29-(f.force-f.pullForce-f.extractionForce)*4.5;}
  function stop(){playing=false;cancelAnimationFrame(request);request=0;draw();}
  function activate(){if(!active){active=true;document.body.classList.add('process-mode');onActivate();onEnter();}document.body.classList.remove('tour-active');}
  function finish(){
    if(!logged){logged=true;log();}
    faultLocked=processFrame(100,kind).accepted===false;stop();
  }
  function tick(now:number){
    if(!playing)return;
    progress=Math.min(100,progress+Math.min(80,now-last)/pace(progress,kind));last=now;draw();
    if(progress<100)request=requestAnimationFrame(tick);else finish();
  }
  function toggle(){
    // Bring the stage back first, so a held reject shows its Clear reject button again.
    activate();if(faultLocked){draw();return;}if(playing){stop();return;}onActivate();
    if(progress>=100||!started){progress=0;logged=false;}started=true;
    playing=true;last=performance.now();draw();request=requestAnimationFrame(tick);
  }
  function restart(){if(faultLocked)return;activate();stop();progress=0;logged=false;draw();}
  function showStage(){document.querySelector('.stage')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function log(){
    const record=processRecord(records.length+1,kind);records.push(record);
    const row=document.createElement('li'),title=document.createElement('strong');
    title.textContent=`Illustrated unit ${String(record.id).padStart(3,'0')} · ${record.case} · ${record.accepted?'accepted':'rejected / operator clear required'}${record.flag?` · flagged: ${record.flag.toLowerCase()}`:''}`;row.append(title);
    const measured=document.createElement('p');measured.textContent=`Measured: header ${Math.hypot(...record.measured.header).toFixed(2)} mm from nominal, grip ${Math.hypot(...record.measured.grip).toFixed(2)} mm off centre.`;row.append(measured);
    for(const attempt of record.attempts){
      const line=document.createElement('p');
      const contacts=attempt.contacts.map((result,i)=>`${i+1} ${attempt.contactFaults[i]??(result==='pending'?'untested':result)}`).join(', ');
      line.textContent=`Attempt ${attempt.number}: seat ${attempt.seated}, pull ${attempt.pull}; contacts ${contacts}. ${attempt.reason??'All three checks passed.'}`;row.append(line);
    }
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 300 52');svg.setAttribute('class','record-trace');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Illustrated force trace for unit ${record.id}, including ${record.attempts.length} attempt${record.attempts.length>1?'s':''}`);
    const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',record.trace.map(s=>`${s.progress*3},${29-(s.press-s.pull-s.extraction)*4.5}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','1.2');svg.append(line);row.append(svg);
    byId('cycle-log').prepend(row);byId<HTMLButtonElement>('cycle-export').disabled=false;
    byId('cycle-log-status').textContent=`${records.length} illustrated unit${records.length>1?'s':''} recorded during this visit. Download to retain the checks and force traces.`;
  }
  // Scrubbing only looks; a unit is recorded, and a reject held, only when a played cycle ends.
  slider.addEventListener('input',()=>{if(faultLocked)return;started=true;activate();const value=Number(slider.value);stop();progress=value;draw();});
  play.addEventListener('click',toggle);reset.addEventListener('click',restart);
  clearFault.addEventListener('click',()=>{faultLocked=false;restart();byId('cycle-log-status').textContent='Fault cleared by the viewer. Previous unit records and traces are retained below.';});
  byId('cycle-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({source:'Defex scripted cycle illustration',measurements:false,units:records},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='defex-illustrated-unit-traces.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  steps.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-cycle-step]');if(button&&!faultLocked){started=true;activate();stop();progress=CYCLE_STEPS[Number(button.dataset.cycleStep)][1];draw();showStage();}});
  for(const button of caseButtons)button.addEventListener('click',()=>{
    // A switch while playing starts the new case at once.
    if(faultLocked)return;const wasPlaying=playing;activate();stop();kind=button.dataset.cycleCase as CycleCase;progress=0;logged=false;started=true;
    for(const b of caseButtons)b.setAttribute('aria-pressed',String(b===button));draw();showStage();if(wasPlaying)toggle();
  });
  // The one play button always plays the full cycle, even after a contact experiment ran.
  for(const id of ['tour','embed-run'])byId(id).addEventListener('click',e=>{e.stopImmediatePropagation();if(e.detail<2)toggle();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});
  document.body.classList.add('process-mode');draw();
  return {refresh:draw,toggle,restart,deactivate(){stop();active=false;document.body.classList.remove('process-mode');scene.setProcess(null);},isActive:()=>active};
}
