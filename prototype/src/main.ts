import './style.css';
import { WorkcellScene } from './scene.ts';
import type { Mode, View } from './scene.ts';
import type { PartId } from './parts.ts';
import { DemoRecorder } from './recording.ts';
import { setupDock } from './dock.ts';
import { DEFAULT_CONFIG, METHOD_NAMES as names, modelXML } from './model.ts';
import type { Configuration, Controller } from './model.ts';
import type { Sample, Snapshot, Trial } from './engine.ts';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const all=<T extends HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const text=(id:string,value:string)=>{const node=el(id);if(node.textContent!==value)node.textContent=value;};
const send=(data:object)=>worker.postMessage(data);
const descriptions:Record<Controller,string>={
  fixed:'Follow the original path. Stop if the socket blocks it.',
  search:'Back off on contact, try a new position, and save the fit when both tests pass.',
  reuse:'Use the last successful position. Test the connection and lock again.',
};
const settingInputs=all<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('.console input,.console select:not(#speed),[data-preset],[data-controller],#forget');
const controllerButtons=all<HTMLButtonElement>('[data-controller]');
const phaseLabels=all('[data-phase]');
const cameraButtons=all<HTMLButtonElement>('[data-view]');
const modeButtons=all<HTMLButtonElement>('[data-mode]');
const partButtons=all<HTMLButtonElement>('[data-part]');
const presetButtons=all<HTMLButtonElement>('[data-preset]');
const reuseButton=document.querySelector<HTMLButtonElement>('[data-controller="reuse"]')!;
const isEmbed=new URLSearchParams(location.search).has('embed');
let config:Configuration={...DEFAULT_CONFIG};
let currentView:View|'part'='overview';
let currentMode:Mode='machine';
const syncModes=()=>modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===currentMode&&(currentMode!=='machine'||currentView==='overview'))));
let controller:Controller='fixed';
let ready=false,playing=false;
let state:Snapshot|null=null;
let samples:Sample[]=[];
let sampleEpoch=-1;
let scene:WorkcellScene|null=null;
let tourIndex=-1,tourPaused=false,tourPending=false,halted=false;
let tourTimer:ReturnType<typeof setTimeout>|null=null,tourDeadline=0,tourDelay=0;
let configTimer:ReturnType<typeof setTimeout>|null=null;
let recorder:DemoRecorder|null=null;
let lastChartDraw=0,trialCount=0;
const worker=new Worker(new URL('./simulation.worker.ts',import.meta.url),{type:'module'});
if(isEmbed)document.body.classList.add('embed');
// Let the worker start fetching the physics engine before the scene build ties up this thread.
await new Promise(resolve=>setTimeout(resolve));

if(new URLSearchParams(location.search).get('view')!=='schematic'){
  try{scene=new WorkcellScene(el('scene'),config,{labels:el('labels'),tooltip:el('tooltip'),onDirector:on=>document.body.classList.toggle('focused',on||currentView!=='overview'),onPick:()=>{currentView='part';document.body.classList.add('focused');cameraButtons.forEach(b=>b.setAttribute('aria-pressed','false'));syncModes();}},isEmbed);}
  catch(error){console.warn('3D renderer unavailable',error);}
}else text('fallback-title','Live side view of the simulation.');
function useSchematic(){
  scene?.dispose();scene=null;
  el('scene').replaceChildren();el('labels').replaceChildren();
  // Without the 3D view only the demo button means anything.
  el('fallback').hidden=false;[...cameraButtons,...modeButtons,...all('.dock-sep,.control-hint')].forEach(n=>n.hidden=true);
  el<HTMLButtonElement>('save-video').disabled=true;
  el('tooltip').classList.remove('visible');
  document.body.classList.remove('focused','exploded');
  if(state)updateSchematic(state);
}
if(!scene)useSchematic();
el('scene').addEventListener('renderer-lost',()=>{finishRecording();useSchematic();});

function updateSchematic(s:Snapshot){
  el('schematic-socket').setAttribute('transform',`translate(${s.config.offsetX*5} 0)`);
  el('schematic-plug').setAttribute('transform',`translate(${210+s.pose[0]*5000} ${270-s.pose[2]*5000})`);
  const half=s.config.variant==='eight'?40:30;
  el('schematic-wall-left').setAttribute('x',String(210-half-20));
  el('schematic-wall-right').setAttribute('x',String(210+half));
  el('schematic-seat').setAttribute('x',String(210-half-20));
  el('schematic-seat').setAttribute('width',String(2*half+40));
  el('schematic-housing').setAttribute('x',String(-half+2));
  el('schematic-housing').setAttribute('width',String(2*half-4));
  el('schematic-housing').setAttribute('fill',s.accepted===true?'#c2d9b6':s.accepted===false?'#e1b5a1':'#f5f0dd');
}

const preset=(name:string):Configuration=>({...DEFAULT_CONFIG,...(name==='shifted'?{}:{offsetX:0,offsetY:0,yaw:0}),fault:name==='open'?'open':name==='latch'?'latch':'none'});
const signed=(n:number,places=2)=>{const v=Math.abs(n)<.5*10**-places?0:n;return `${v>=0?'+':''}${v.toFixed(places)}`;};
function syncConfig(){
  for(const key of ['offsetX','offsetY','yaw','friction'] as const){
    el<HTMLInputElement>(key).value=String(config[key]);
    text(`${key}-value`,key==='yaw'?`${signed(config[key],1)}°`:key==='friction'?config[key].toFixed(2):`${signed(config[key])} mm`);
  }
  el<HTMLSelectElement>('variant').value=config.variant;el<HTMLSelectElement>('fault').value=config.fault;
  for(const b of presetButtons){const p=preset(b.dataset.preset!);b.setAttribute('aria-pressed',String(['offsetX','offsetY','yaw','fault'].every(k=>p[k as keyof Configuration]===config[k as keyof Configuration])));}
}
function commitConfig(){
  if(configTimer)clearTimeout(configTimer);configTimer=null;
  send({type:'config',config});samples=[];drawChart();
}
// 'soon': a slider is still moving, so send once it rests. 'with-run': the next run carries it.
function configure(next:Configuration,commit:'now'|'soon'|'with-run'='now'){
  config={...next};syncConfig();scene?.configure(config);
  if(configTimer)clearTimeout(configTimer);configTimer=null;
  if(commit==='soon')configTimer=setTimeout(commitConfig,130);
  else if(commit==='now')commitConfig();
}
function choose(next:Controller){
  controller=next;controllerButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.controller===next)));
  text('controller-description',descriptions[next]);
}
function dismissEnd(){if(tourIndex<0){el('endcard').hidden=true;document.body.classList.remove('ended');}}
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function showStage(){
  const stage=document.querySelector('.stage')!;
  if(Math.abs(stage.getBoundingClientRect().top)>8)stage.scrollIntoView({block:'start',behavior:still()?'auto':'smooth'});
}
function selectView(view:View,scroll=true){
  dismissEnd();if(scroll)showStage();currentView=view;scene?.view(view);document.body.classList.toggle('focused',view!=='overview');cameraButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));syncModes();
}
function selectMode(mode:Mode,scroll=true){
  dismissEnd();currentMode=mode;scene?.setMode(mode);document.body.classList.toggle('exploded',mode==='parts');
  selectView(mode==='inside'?'connector':'overview',scroll);
  if(mode==='parts')scene?.direct(false);
}
function showPart(id:PartId){
  if(!scene)return;
  currentView='part';scene.focusPart(id);document.body.classList.add('focused');cameraButtons.forEach(b=>b.setAttribute('aria-pressed','false'));syncModes();
  const stage=document.querySelector('.stage')!;
  if(stage.getBoundingClientRect().bottom<innerHeight*0.6)stage.scrollIntoView({behavior:still()?'auto':'smooth'});
}
function finishRecording(){
  if(!recorder)return;
  if(scene)scene.afterRender=null;
  recorder.stop();recorder=null;
  el<HTMLButtonElement>('save-video').disabled=!ready||!scene||typeof MediaRecorder==='undefined';
  recordLabel(false);
}
function recordLabel(on:boolean){
  const button=el('save-video');
  button.firstChild!.textContent=on?'Recording… ':'Record demo ';button.querySelector('span')!.hidden=on;
}
function stopTour(){
  if(tourTimer)clearTimeout(tourTimer);
  tourTimer=null;tourIndex=-1;tourPaused=false;tourPending=false;
  el('tour-story').hidden=true;document.body.classList.remove('tour-active');scene?.hold(false);
  finishRecording();refreshControls();
}
// Runs always play on the assembled machine, with the camera following the plug.
function film(){
  if(!scene)return;
  if(currentMode==='parts')selectMode('machine',false);
  currentView='overview';cameraButtons.forEach(b=>b.setAttribute('aria-pressed','false'));syncModes();scene.direct(true);
}
// Running from the experiment controls keeps the page where it is: the result, tests and force plot are all there.
function run(withConfig=false){
  if(configTimer)commitConfig();halted=false;
  if(tourIndex<0){el('endcard').hidden=true;document.body.classList.remove('ended');}
  film();send({type:'run',controller,...(withConfig?{config}:{})});
}
function reset(){halted=false;stopTour();dismissEnd();send({type:'reset'});selectView('overview',false);scene?.direct(false);}
function pause(){
  if(tourIndex>=0){
    tourPaused=true;
    if(tourTimer){clearTimeout(tourTimer);tourTimer=null;tourDelay=Math.max(0,tourDeadline-performance.now());}
  }
  playing=false;send({type:'pause'});recorder?.pause();refreshControls();
}
function resume(){
  if(currentMode==='parts')selectMode('machine',false);
  if(tourIndex>=0){tourPaused=false;if(tourPending)scheduleNext(tourDelay);else send({type:'resume'});}
  else send({type:'resume'});
  recorder?.resume();refreshControls();
}
function togglePlayback(){
  if(!ready)return;
  if(tourIndex>=0){tourPaused?resume():pause();return;}
  if(playing)pause();
  else if(state&&state.phase!=='ready'&&state.phase!=='complete')resume();
  else run();
}

for(const b of presetButtons)b.addEventListener('click',()=>{stopTour();configure({...preset(b.dataset.preset!),variant:config.variant});});
for(const key of ['offsetX','offsetY','yaw','friction'] as const){
  el<HTMLInputElement>(key).addEventListener('input',()=>{stopTour();configure({...config,[key]:Number(el<HTMLInputElement>(key).value)},'soon');});
  el<HTMLInputElement>(key).addEventListener('change',()=>{if(configTimer)commitConfig();});
}
el('variant').addEventListener('change',()=>{stopTour();configure({...config,variant:el<HTMLSelectElement>('variant').value as Configuration['variant']});});
el('fault').addEventListener('change',()=>{stopTour();configure({...config,fault:el<HTMLSelectElement>('fault').value as Configuration['fault']});});
for(const b of controllerButtons)b.addEventListener('click',()=>{stopTour();choose(b.dataset.controller as Controller);});
// A double click is one press: the second click would pause what the first started.
el('run').addEventListener('click',e=>{if(e.detail<2)togglePlayback();});
el('reset').addEventListener('click',reset);
el('speed').addEventListener('change',()=>send({type:'speed',speed:Number(el<HTMLSelectElement>('speed').value)}));
el('forget').addEventListener('click',()=>{stopTour();send({type:'forget'});if(controller==='reuse')choose('fixed');});
for(const b of cameraButtons)b.addEventListener('click',()=>selectView(currentView===b.dataset.view?'overview':b.dataset.view as View));
for(const b of modeButtons)b.addEventListener('click',()=>selectMode(b.dataset.mode as Mode));
for(const b of partButtons)b.addEventListener('click',()=>showPart(b.dataset.part as PartId));
el('retry').addEventListener('click',()=>location.reload());
el('stage-retry').addEventListener('click',()=>location.reload());

const notes=el<HTMLDialogElement>('notes');
all('[data-open-notes]').forEach(b=>b.addEventListener('click',()=>notes.showModal()));
el('close-notes').addEventListener('click',()=>notes.close());
notes.addEventListener('click',e=>{if(e.target===notes){const r=notes.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)notes.close();}});
function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function download(content:string,name:string,type:string){downloadBlob(new Blob([content],{type}),name);}
el('export').addEventListener('click',()=>send({type:'export'}));
el('download-model').addEventListener('click',()=>download(modelXML(config),'defex-illustrative-connector.xml','application/xml'));

// The demo ends on the saved fit passing first time. The open circuit comes third,
// and only a search saves a fit, so step 4 still has the one step 2 found.
const stories=[
  ['01 — The fixed path meets an offset.','The tool detects contact and retracts.'],
  ['02 — Search using contact feedback.','A deterministic search finds an offset that passes both checks.'],
  ['03 — Reject the open circuit.','The injected open circuit fails the connection check.'],
  ['04 — Repeat with the saved offset.','The saved offset succeeds in one simulated attempt.'],
];
const tourMethods:Controller[]=['fixed','search','fixed','reuse'],tourPasses=[false,true,false,true];
function tourStep(){
  if(tourIndex<0)return;
  tourPending=false;tourTimer=null;
  text('tour-index',`${tourIndex+1} / 4`);document.querySelectorAll('.tour-dots i').forEach((d,i)=>d.classList.toggle('on',i<=tourIndex));text('tour-title',stories[tourIndex][0]);text('tour-description',stories[tourIndex][1]);
  if(recorder){recorder.title=stories[tourIndex][0];recorder.description=stories[tourIndex][1];}
  configure(preset(tourIndex===2?'open':'shifted'),'with-run');
  choose(tourMethods[tourIndex]);run(true);
}
function scheduleNext(delay:number){
  tourPending=true;tourDelay=delay;
  if(tourPaused)return;
  tourDeadline=performance.now()+delay;
  tourTimer=setTimeout(()=>{
    tourTimer=null;
    if(tourIndex<3){tourIndex++;tourStep();}
    else{
      stopTour();
      el('endcard').hidden=false;document.body.classList.add('ended');
      outcome('idle','Demo complete. Your turn.','Pick a scenario below and run it yourself.');
    }
  },delay);
  refreshControls();
}
function startTour(){
  stopTour();el('endcard').hidden=true;document.body.classList.remove('ended');selectMode('machine',false);tourIndex=0;
  el('tour-story').hidden=false;document.body.classList.add('tour-active');
  // The camera stays on the socket from step to step instead of pulling back to the whole machine.
  showStage();scene?.hold(true);film();tourStep();refreshControls();
}
el('replay').addEventListener('click',e=>{if(e.detail<2)startTour();});
el('tour').addEventListener('click',e=>{if(e.detail<2)tourIndex>=0?togglePlayback():startTour();});
el('embed-run').addEventListener('click',e=>{if(e.detail<2)startTour();});
all<HTMLButtonElement>('[data-start-tour]').forEach(b=>b.addEventListener('click',()=>{if(tourIndex<0)startTour();}));
el('save-video').addEventListener('click',()=>{
  stopTour();if(!scene)return;
  try{
    startTour();
    recorder=new DemoRecorder(scene.renderer.domElement,(blob,ext)=>downloadBlob(blob,`defex-connector-simulation.${ext}`));
    recorder.title=stories[0][0];recorder.description=stories[0][1];
    scene.afterRender=()=>recorder?.draw(); scene.wake();
    el<HTMLButtonElement>('save-video').disabled=true;recordLabel(true);
  }catch(e){stopTour();send({type:'pause'});outcome('fail','Couldn’t record the demo.',e instanceof Error?e.message:String(e));}
});
el('stop-tour').addEventListener('click',reset);

function checks(id:string,value:boolean|null,testing:boolean){
  const node=el(id);text(id,value===true?'Pass':value===false?'Fail':testing?'Testing':'—');
  node.dataset.status=value===true?'pass':value===false?'fail':testing?'testing':'idle';
}
function refreshControls(){
  const unfinished=!!state&&state.phase!=='complete'&&state.phase!=='ready';
  const active=playing||(tourIndex>=0&&!tourPaused);
  text('run-label',active?'Pause':unfinished||tourPaused?'Resume':'Run attempt');text('run-icon',active?'Ⅱ':'▶');
  el<HTMLButtonElement>('run').disabled=!ready;el<HTMLButtonElement>('reset').disabled=!ready;
  el<HTMLSelectElement>('speed').disabled=!ready;
  el<HTMLButtonElement>('tour').disabled=!ready;all<HTMLButtonElement>('[data-start-tour]').forEach(b=>b.disabled=!ready);el<HTMLButtonElement>('embed-run').disabled=!ready;
  el('tour').setAttribute('aria-pressed',String(tourIndex>=0));
  text('tour-label',tourIndex>=0?(tourPaused?'Resume demo':'Pause demo'):'Play demo');
  el('tour').dataset.playing=String(tourIndex>=0&&!tourPaused);
  el('tour').setAttribute('aria-label',tourIndex>=0?(tourPaused?'Resume demo':'Pause demo'):'Play demo');
  for(const input of settingInputs)input.disabled=!ready||unfinished||tourIndex>=0;
  reuseButton.disabled=!ready||unfinished||tourIndex>=0||!state?.calibration;
  reuseButton.title=state?.calibration?'Use the last accepted correction':'Run a successful search to save a fit';
  el('memory').hidden=!state?.calibration;
  if(state?.calibration)text('memory-value',`X ${signed(state.calibration[0]*1000)} / Y ${signed(state.calibration[1]*1000)} mm`);
  const status=!ready?'Loading…':tourPaused?'Paused':tourPending?'Next step…':playing?'Running':unfinished?'Paused':state?.phase==='complete'?'Complete':'Ready';
  text('engine-status',status);
  text('hud-status',!ready?'Loading':tourIndex>=0&&!tourPaused?'Demo running':playing?'Robot running':unfinished||tourPaused?'Robot paused':'Robot ready');
  el('status').classList.toggle('paused',!playing);
}
function renderState(s:Snapshot,isPlaying:boolean,speed:number){
  state=s;playing=isPlaying;
  if(recorder){recorder.state=s;recorder.speed=speed;}
  scene?.update(s,sampleEpoch,isPlaying,speed);if(!scene)updateSchematic(s);
  text('stage-state',(!isPlaying&&s.phase!=='ready'&&s.phase!=='complete'?'Paused · ':'')+(s.phase==='ready'?'Ready':s.phase==='complete'?(s.accepted?'Passed':'Rejected'):s.phase==='electrical'?'Connection test':s.phase==='retention'?'Pull test':s.phase==='reset'?(s.accepted===true?'Passed · retracting':s.accepted===false?'Rejected · retracting':'Retracting'):s.phase==='backoff'?'Contact · retracting':s.phase==='move'?`Try ${s.probes}`:'Inserting'));
  text('stage-force',`${s.force.toFixed(1)} N`);text('stage-depth',`${s.depth.toFixed(1)} mm`);text('stage-speed',`${speed}× playback`);
  text('force',s.force.toFixed(1));text('depth',s.depth.toFixed(1));text('probes',s.phase==='ready'?'—':String(s.probes));text('elapsed',s.time.toFixed(1));
  const phase=['approach','backoff','move'].includes(s.phase)?'insert':s.phase;
  journey(s);
  phaseLabels.forEach(n=>n.classList.toggle('active',n.dataset.phase===phase));
  checks('electrical-check',s.continuity,s.phase==='electrical');checks('retention-check',s.retention,s.phase==='retention');
  refreshControls();
  if(!halted)narrate(s);
  if(performance.now()-lastChartDraw>80||!playing)drawChart();
}
function narrate(s:Snapshot){
  if(s.phase==='ready')outcome('idle','Ready when you are.','Run one attempt, or play the four-step demo.');
  else if(s.accepted!==null)outcome(s.accepted?'pass':'fail',s.accepted?'Both tests passed.':s.continuity===false?'Connection failed.':s.retention===false?'Lock failed.':'The connector couldn’t seat.',s.phase==='reset'?'Returning to the start.':s.accepted?'This fit passed the simulated connection and pull tests.':`${s.reason}.`);
  else if(s.phase==='reset')outcome('idle','Resetting.','Returning to the start.');
  // During the move, probes already counts the try about to start.
  else if(s.phase==='backoff'||s.phase==='move')outcome('idle',`Try ${s.phase==='move'?s.probes-1:s.probes} was blocked.`,'Back off and try the next position.');
  else if(s.phase==='electrical')outcome('idle','Check the connection.','Testing the simulated electrical contact.');
  else if(s.phase==='retention')outcome('idle','Give it a pull.','Checking whether the lock holds.');
  else outcome('idle',controller==='search'?`Trying position ${s.probes}.`:'Inserting the connector.','Watching for contact with the socket.');
}
const journeySteps:Record<string,[string,string,number]>={
  approach:['Insert','The robot lowers the connector.',.2],insert:['Insert','The robot lowers the connector.',.25],
  backoff:['Blocked. Backing off.','The socket edge stopped it.',.25],move:['Trying a new spot.','Small step to the side.',.25],
  electrical:['Connection test','Is every contact in?',.5],retention:['Pull test','Does the lock hold?',.75],reset:['Reset','Back to the start.',.92],
};
function journey(s:Snapshot){
  const box=el('journey');box.classList.toggle('visible',s.phase!=='ready');
  const [title,detail,progress]=s.phase==='complete'?[s.accepted?'Passed.':'Rejected.',s.accepted?(s.controller==='search'?'Both tests passed. Fit saved.':'Both tests passed.'):s.reason,1] as [string,string,number]:journeySteps[s.phase]??['Ready','',0];
  text('journey-title',s.phase==='move'?`Try ${s.probes}.`:title);text('tour-live',s.phase==='move'?`Try ${s.probes}`:title.replace(/\.$/,''));text('journey-detail',detail);
  box.dataset.status=s.accepted===true?'pass':s.accepted===false?'fail':'run';
  el('journey-progress').style.width=`${progress*100}%`;
}
function outcome(status:string,title:string,copy:string){
  el('outcome').dataset.status=status;text('outcome-title',title);text('outcome-copy',copy);
  const symbol=document.querySelector('.outcome-symbol')!,value=status==='pass'?'✓':status==='fail'?'×':'↗';
  if(symbol.textContent!==value)symbol.textContent=value;
}
function record(trial:Trial){
  trialCount++;text('record-count',String(trialCount).padStart(2,'0'));el<HTMLButtonElement>('export').disabled=false;
  const body=el('records-body');body.querySelector('.empty-row')?.remove();const row=document.createElement('tr');
  // Name every setting that differs from the default, or two rows with opposite results read the same.
  const c=trial.config,conditions=[`${c.variant==='six'?'6':'8'} contacts`,`X ${signed(c.offsetX)} / Y ${signed(c.offsetY)} mm`,c.yaw?`${signed(c.yaw,1)}°`:'',c.friction!==DEFAULT_CONFIG.friction?`friction ${c.friction.toFixed(2)}`:'',c.fault==='open'?'open circuit':c.fault==='latch'?'no latch':''];
  const values=[String(trial.id).padStart(2,'0'),names[trial.controller],conditions.filter(Boolean).join(' · '),String(trial.probes),`${trial.duration.toFixed(2)} s`,`${trial.peakForce.toFixed(2)} N`];
  values.forEach(v=>{const cell=document.createElement('td');cell.textContent=v;row.append(cell);});
  const result=document.createElement('td'),tag=document.createElement('span'),reason=document.createElement('small');
  tag.className=trial.accepted?'accepted':'rejected';tag.textContent=trial.accepted?'✓ Passed':'× Rejected';reason.textContent=trial.reason;
  result.append(tag,reason);row.append(result);body.prepend(row);
  if(tourIndex>=0){
    if(trial.accepted!==tourPasses[tourIndex]){stopTour();halted=true;outcome('fail','Demo stopped.',`Unexpected result: ${trial.reason}. See the attempt below.`);return;}
    scheduleNext(tourIndex===0||tourIndex===3?1500:1300);
  }
}
function drawChart(){
  lastChartDraw=performance.now();
  // Measuring the closed panel would force a page layout on every update.
  if(isEmbed||!el('force-chart').closest('details')!.open)return;
  const canvas=el<HTMLCanvasElement>('force-chart'),r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const ratio=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(r.width*ratio)||canvas.height!==Math.round(r.height*ratio)){canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);}
  const ctx=canvas.getContext('2d')!;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,r.width,r.height);
  const width=r.width,height=r.height-6,max=samples.reduce((v,p)=>Math.max(v,p.force),6),end=Math.max(2,samples.at(-1)?.t??0),start=samples[0]?.t??0;
  ctx.lineWidth=1;ctx.strokeStyle='#2a3036';ctx.setLineDash([2,4]);
  for(let i=0;i<3;i++){const y=5+i*(height-5)/2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.setLineDash([]);
  if(samples.length>1){ctx.beginPath();samples.forEach((p,i)=>{const x=(p.t-start)/(end-start)*width,y=height-p.force/max*(height-7);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#ff7a1a';ctx.lineWidth=1.6;ctx.stroke();}
  text('chart-zero',`${start.toFixed(1)} s`);text('chart-end',`${(samples.at(-1)?.t??0).toFixed(1)} s`);
}
new ResizeObserver(drawChart).observe(el('force-chart'));
function error(message:string){
  console.error(message);
  const loaded=ready,advice=loaded?'The simulation stopped. Reload to start it again.':'The physics engine didn’t load. Check your connection, then reload.';
  ready=false;playing=false;stopTour();el('loading').hidden=true;el('retry').hidden=false;
  if(scene){scene.playing=false;scene.direct(false);scene.offline();}
  el<HTMLButtonElement>('save-video').disabled=true;
  text('engine-status','Unavailable');el('engine-status').classList.add('error-notice');
  outcome('fail',loaded?'The simulation stopped.':'Couldn’t start the simulation.',advice);
  el('stage-error').hidden=false;text('stage-error-message',advice);text('stage-state','Unavailable');
  refreshControls();text('engine-status','Unavailable');
}
worker.onerror=e=>error(e.message||'Reload the simulation to try again.');
worker.onmessage=({data})=>{
  if(data.type==='ready'){
    ready=true;el('loading').hidden=true;
    el<HTMLButtonElement>('save-video').disabled=!scene||typeof MediaRecorder==='undefined';refreshControls();
  }
  if(data.type==='state'){
    if(data.epoch!==sampleEpoch){samples=[];sampleEpoch=data.epoch;}
    // Room for the longest search the controls allow (about 2,300 samples).
    if(data.samples.length){samples.push(...data.samples);if(samples.length>4000)samples.splice(0,samples.length-4000);}
    renderState(data.state,data.playing,data.speed);
  }
  if(data.type==='trial'&&data.trial)record(data.trial);
  if(data.type==='error')error(data.message);
  if(data.type==='export')download(JSON.stringify(data.report,null,2),'defex-simulation-records.json','application/json');
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(playing||(tourIndex>=0&&!tourPaused)))pause();});
// A control reached with Tab keeps its own Space; on one that was just clicked, Space runs the robot.
// (:focus-visible can't tell them apart: a key press makes a clicked button match it too.)
let clicked:Element|null=null,spaceTaken=false;
document.addEventListener('pointerdown',e=>{clicked=e.target instanceof Element?e.target.closest('button,a,summary'):null;},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Tab')clicked=null;
  if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||notes.open||!ready)return;
  const t=e.target instanceof HTMLElement?e.target:null;
  if(t?.closest('input:not([type=range]),select,textarea,[contenteditable]'))return;
  if(e.code==='KeyR'){e.preventDefault();reset();return;}
  if(e.code!=='Space')return;
  const control=t?.closest('button,a,summary');
  if(control&&control!==clicked)return;
  // Reading further down, Space pages down as usual, except in the experiment controls.
  if(document.querySelector('.stage')!.getBoundingClientRect().bottom<=0&&!t?.closest('.console'))return;
  e.preventDefault();spaceTaken=true;togglePlayback();
});
// A focused button would otherwise take the Space's keyup as a click.
document.addEventListener('keyup',e=>{if(e.code==='Space'&&spaceTaken){spaceTaken=false;e.preventDefault();}});
document.querySelector('.tryit')!.addEventListener('toggle',drawChart);
setupDock(document.querySelector<HTMLElement>('.dock')!);
settingInputs.forEach(input=>input.disabled=true);syncConfig();send({type:'init',config});
