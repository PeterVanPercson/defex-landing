import { CYCLE_STEPS, processFrame } from './process.ts';
import type { CycleCase, ProcessFrame } from './process.ts';
import type { WorkcellScene } from './scene.ts';
export function setupCycle(scene:WorkcellScene,onActivate:()=>void){
  const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
  let progress=44,kind:CycleCase='search',playing=false,active=true,request=0,last=0,lastContacts='',traceKind='';
  const slider=byId<HTMLInputElement>('cycle-scrub'),play=byId<HTMLButtonElement>('cycle-play');
  const steps=byId('process-steps');
  steps.innerHTML=CYCLE_STEPS.map((s,i)=>`<button data-cycle-step="${i}" aria-current="false"><span>${String(i+1).padStart(2,'0')}</span><strong>${s[0]}</strong><small>${s[1]}–${i<9?CYCLE_STEPS[i+1][1]:100}%</small></button>`).join('');
  const draw=()=>{
    if(!active)return;const f=processFrame(progress,kind);scene.setProcess(f);slider.value=String(progress);
    byId('cycle-percent').textContent=`${Math.round(progress)}%`;byId('cycle-title').textContent=CYCLE_STEPS[f.step][0];
    byId('cycle-index').textContent=`${String(f.step+1).padStart(2,'0')} / 10`;
    byId('cycle-copy').textContent=f.message;byId('cycle-scope').textContent=CYCLE_STEPS[f.step][3];
    byId('cycle-force').textContent=`${f.force.toFixed(1)} N`;byId('cycle-depth').textContent=`${f.depth.toFixed(1)} mm`;
    byId('cycle-pull').textContent=`${f.pullForce.toFixed(1)} / 2.5 N`;
    byId('cycle-tries').textContent=f.retry?'Retry 1 / 1':`${f.tries} / 48`;
    for(const [id,value] of [['seat-result',f.seated],['pull-result',f.pull],['wiring-result',f.contacts.includes('fail')?'fail':f.contacts.every(x=>x==='pass')?'pass':'pending']]){byId(id).textContent=value==='pending'?'—':value.toUpperCase();byId(id).dataset.result=value;}
    if(lastContacts!==f.contacts.join()){lastContacts=f.contacts.join();byId('contact-results').innerHTML=f.contacts.map((v,i)=>`<span data-result="${v}" aria-label="Contact ${i+1}: ${v}"><small>${i+1}</small>${v==='pending'?'·':v==='pass'?'✓':'×'}</span>`).join('');}
    byId('cycle-verdict').textContent=f.accepted===true?'All three checks passed':f.accepted===false?'Rejected · operator action required':f.retry?'Check failed · one retry':f.step<5?'Preparing the unit':'Checks in progress';
    byId('cycle-verdict').dataset.result=f.accepted===true?'pass':f.accepted===false?'fail':'pending';
    for(const button of steps.querySelectorAll('button'))button.setAttribute('aria-current',String(Number(button.dataset.cycleStep)===f.step));
    play.textContent=playing?'Pause cycle':'Play full cycle';play.setAttribute('aria-pressed',String(playing));
    const tour=byId('tour');tour.dataset.playing=String(playing);tour.setAttribute('aria-label',playing?'Pause full cycle':'Play full cycle');tour.setAttribute('aria-pressed',String(playing));byId('tour-label').textContent=playing?'Pause full cycle':'Play full cycle';
    drawTrace(f);
  };
  function drawTrace(f:ProcessFrame){
    const trace=byId<SVGElement&HTMLElement>('cycle-trace'),cursor=byId<SVGElement&HTMLElement>('cycle-cursor');
    if(traceKind!==kind){traceKind=kind;const points=Array.from({length:201},(_,i)=>{const sample=processFrame(i*.5,kind);return `${i*1.5},${42-sample.force*7.8}`;});
    trace.setAttribute('points',points.join(' '));const x=kind==='latched'?180:216;byId('cycle-seat-point').setAttribute('transform',`translate(${x} 0)`);}cursor.setAttribute('x1',String(f.progress*3));cursor.setAttribute('x2',String(f.progress*3));
  }
  function stop(){playing=false;cancelAnimationFrame(request);request=0;draw();}
  function activate(){if(!active){active=true;document.body.classList.add('process-mode');onActivate();}document.body.classList.remove('tour-active');}
  function tick(now:number){if(!playing)return;progress=Math.min(100,progress+Math.min(80,now-last)/600);last=now;draw();if(progress<100)request=requestAnimationFrame(tick);else{stop();log(processFrame(100,kind));}}
  function toggle(){activate();if(playing){stop();return;}onActivate();if(progress>=100||progress===44)progress=0;playing=true;last=performance.now();draw();request=requestAnimationFrame(tick);}
  function showStage(){document.querySelector('.stage')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function log(f:ProcessFrame){const row=document.createElement('li');row.textContent=`Illustration ${kind} · seat ${f.seated} · pull ${f.pull} · contacts ${f.contacts.join(', ')} · ${f.accepted?'accepted':'rejected'}${f.retry?' after one retry':''}.`;byId('cycle-log').prepend(row);}
  slider.addEventListener('input',()=>{activate();const value=Number(slider.value);stop();progress=value;draw();});
  play.addEventListener('click',toggle);
  byId('cycle-reset').addEventListener('click',()=>{activate();stop();progress=0;draw();});
  steps.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-cycle-step]');if(button){activate();stop();progress=CYCLE_STEPS[Number(button.dataset.cycleStep)][1];draw();showStage();}});
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-cycle-case]'))button.addEventListener('click',()=>{activate();stop();kind=button.dataset.cycleCase as CycleCase;progress=0;for(const b of document.querySelectorAll('[data-cycle-case]'))b.setAttribute('aria-pressed',String(b===button));draw();showStage();});
  for(const id of ['tour','embed-run'])byId(id).addEventListener('click',e=>{if(!active)return;e.stopImmediatePropagation();toggle();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});
  document.addEventListener('keydown',e=>{if(!active||['INPUT','SELECT','TEXTAREA','BUTTON'].includes((e.target as HTMLElement).tagName))return;if(document.querySelector('.stage')!.getBoundingClientRect().bottom<innerHeight*.35)return;if(e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();toggle();}else if(e.key.toLowerCase()==='r'){e.stopImmediatePropagation();stop();progress=0;draw();}},true);
  document.body.classList.add('process-mode');draw();
  return {refresh:draw,deactivate(){stop();active=false;document.body.classList.remove('process-mode');scene.setProcess(null);},isActive:()=>active};
}
