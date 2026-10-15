import './style.css';
import { CYCLE_STEPS } from './process.ts';
import { setupCycle } from './cycle-player.ts';
import { WorkcellScene } from './scene.ts';
import type { Mode, View } from './scene.ts';
import type { PartId } from './parts.ts';
import { DemoRecorder } from './recording.ts';
import { setupDock } from './dock.ts';
import { DEFAULT_CONFIG, modelXML } from './model.ts';
import type { Configuration, Controller } from './model.ts';
import type { Sample, Snapshot, Trial } from './engine.ts';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const all=<T extends HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const text=(id:string,value:string)=>{const node=el(id);if(node.textContent!==value)node.textContent=value;};
// The physics worker starts only once the stage is up (it fetches the 4.5 MB engine at once, which would take the
// bandwidth the scene needs first); what is sent before then waits for it, in order.
let worker:Worker|null=null;const unsent:object[]=[];
const send=(data:object)=>{if(worker)worker.postMessage(data);else unsent.push(data);};
// After a pass the open hand waits above the seated plug. Anything that moves the plug again (a run, a reset, a new
// setup) first closes the hand on it; what is sent meanwhile goes in order once the fingers are on the plug.
let parked:object[]|null=null;
function sendToPlug(data:object){
  if(parked){parked.push(data);return;}
  const wait=state?.released&&scene?scene.regrip():0;
  if(wait<=0){send(data);return;}
  parked=[data];setTimeout(()=>{const queue=parked??[];parked=null;queue.forEach(send);},wait);
}
const descriptions:Record<Controller,string>={
  fixed:'Straight in. Stops if blocked.',
  search:'Backs off and tries the next spot.',
};
const names:Record<Controller,string>={fixed:'No search',search:'Search'};
const settingInputs=all<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('.console input,.console select:not(#speed),[data-preset],[data-controller]');
const controllerButtons=all<HTMLButtonElement>('[data-controller]');
const phaseLabels=all('[data-phase]');
const cameraButtons=all<HTMLButtonElement>('[data-view]');
const modeButtons=all<HTMLButtonElement>('[data-mode]');
const partButtons=all<HTMLButtonElement>('[data-part]');
const presetButtons=all<HTMLButtonElement>('[data-preset]');
const isEmbed=new URLSearchParams(location.search).has('embed');
let config:Configuration={...DEFAULT_CONFIG};
let currentView:View|'part'='overview';
let currentMode:Mode='machine';
// While the person has the camera, the dock shows no camera view pressed; Inside and Parts stay on.
let free=false;
const syncModes=()=>modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===currentMode&&(currentMode!=='machine'||currentView==='overview'&&!free))));
// Inside frames the connector itself, so only Inside shows pressed, not Close-up too.
const syncCamera=()=>{cameraButtons.forEach(b=>b.setAttribute('aria-pressed',String(!free&&currentMode!=='inside'&&b.dataset.view===currentView)));syncModes();};
let controller:Controller='fixed';
let ready=false,playing=false,failed=false;
let state:Snapshot|null=null;
let samples:Sample[]=[];
let sampleEpoch=-1;
let scene:WorkcellScene|null=null;
let cyclePlayer:ReturnType<typeof setupCycle>|null=null;
let tourIndex=-1,tourPaused=false,tourPending=false,halted=false;
let tourTimer:ReturnType<typeof setTimeout>|null=null,tourDeadline=0,tourDelay=0;
let configTimer:ReturnType<typeof setTimeout>|null=null;
let recorder:DemoRecorder|null=null;
let lastChartDraw=0,trialCount=0;
if(isEmbed)document.body.classList.add('embed');

if(new URLSearchParams(location.search).get('view')!=='schematic'){
  try{scene=new WorkcellScene(el('scene'),config,{labels:el('labels'),tooltip:el('tooltip'),onDirector:on=>document.body.classList.toggle('focused',on||currentView!=='overview'),
    // The connector and gripper move all cycle: a pick of either follows them in the close-up.
    onPick:id=>id==='connector'||id==='gripper'?selectView('connector',false):showPart(id),
    onFree:on=>{free=on;el('guided-view').hidden=!on;document.body.classList.toggle('free-view',on);syncCamera();},
    // The shot the camera has arrived at: the headline waits for it, not just for the shot the cycle asks for.
    onSettle:shot=>{document.body.dataset.cam=shot;}},isEmbed);}
  catch(error){console.warn('3D renderer unavailable',error);}
}else text('fallback-title','Live side view of the simulation.');
function useSchematic(){
  // The cycle's own listeners go with it, so Play can't run a cycle nobody sees over the schematic.
  cyclePlayer?.dispose();cyclePlayer=null;scene?.dispose();scene=null;
  el('loading').hidden=ready||failed;startWorker();
  document.body.classList.remove('process-mode');
  document.querySelector<HTMLElement>('.roll')!.hidden=true;
  el('process-steps').innerHTML=CYCLE_STEPS.map((s,i)=>`<div><span>${i+1}</span><strong>${s[0]}</strong><small>${s[2]}</small></div>`).join('');
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
  sendToPlug({type:'config',config});samples=[];drawChart();
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
  dismissEnd();if(scroll)showStage();currentView=view;scene?.view(view);document.body.classList.toggle('focused',view!=='overview');syncCamera();
}
function selectMode(mode:Mode,scroll=true){
  dismissEnd();currentMode=mode;scene?.setMode(mode);document.body.classList.toggle('exploded',mode==='parts');
  selectView(mode==='inside'?'connector':'overview',scroll);
  if(mode==='parts')scene?.direct(false);
}
function showPart(id:PartId){
  if(!scene)return;
  currentView='part';scene.focusPart(id);document.body.classList.add('focused');syncCamera();
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
// Runs always play on the whole machine, with the camera following the plug.
function film(){
  if(!scene)return;
  if(currentMode==='parts')selectMode('machine',false);
  currentView='overview';scene.direct(true);syncCamera();
}
// Every run plays framed on the stage, with the camera on the socket; the result, tests and force plot wait below.
function run(withConfig=false){
  cyclePlayer?.deactivate();
  if(configTimer)commitConfig();halted=false;
  if(tourIndex<0){el('endcard').hidden=true;document.body.classList.remove('ended');}
  showStage();film();sendToPlug({type:'run',controller,...(withConfig?{config}:{})});
}
function reset(){halted=false;stopTour();dismissEnd();sendToPlug({type:'reset'});selectView('overview',false);scene?.direct(false);}
function pause(){
  if(tourIndex>=0){
    tourPaused=true;
    if(tourTimer){clearTimeout(tourTimer);tourTimer=null;tourDelay=Math.max(0,tourDeadline-performance.now());}
  }
  playing=false;send({type:'pause'});recorder?.pause();refreshControls();
}
function resume(){
  cyclePlayer?.deactivate();
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
// A pressed view toggles back to the machine; pressed again after orbiting, it re-centres instead.
for(const b of cameraButtons)b.addEventListener('click',()=>{if(currentMode==='inside'){selectMode('machine',false);selectView(b.dataset.view as View);return;}selectView(currentView===b.dataset.view&&!free?'overview':b.dataset.view as View);});
el('guided-view').addEventListener('click',()=>scene?.guided());
// While the slider is held the camera keeps its shot; it goes to the shot the frame asks for on release.
const scrubber=el<HTMLInputElement>('cycle-scrub'),letGoOfScrub=()=>scene?.setScrubbing(false);
scrubber.addEventListener('pointerdown',()=>scene?.setScrubbing(true));scrubber.addEventListener('change',letGoOfScrub);
addEventListener('pointerup',letGoOfScrub);addEventListener('pointercancel',letGoOfScrub);
// The first time a pointer or finger comes onto the stage, say how the camera is moved; it fades after 3 s.
{const hint=el('stage-hint'),stageEl=el('scene');let shown=false;
  const apple=/Mac|iPhone|iPad|iPod/i.test((navigator as Navigator&{userAgentData?:{platform?:string}}).userAgentData?.platform||navigator.platform||navigator.userAgent);
  hint.textContent=matchMedia('(pointer: coarse)').matches?'Drag to turn · pinch to zoom':`Drag to turn · pinch or ${apple?'⌘':'Ctrl'}-scroll to zoom`;
  const show=()=>{if(shown||isEmbed||!scene)return;shown=true;hint.classList.add('visible');setTimeout(()=>hint.classList.remove('visible'),3000);};
  stageEl.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show();});stageEl.addEventListener('touchstart',show,{passive:true});}
for(const b of modeButtons)b.addEventListener('click',()=>selectMode(b.dataset.mode as Mode));
for(const b of partButtons)b.addEventListener('click',()=>showPart(b.dataset.part as PartId));
el('retry').addEventListener('click',()=>location.reload());
el('stage-retry').addEventListener('click',()=>location.reload());

const notes=el<HTMLDialogElement>('notes');
// A dialog taller than the screen scrolls its text under a soft fade; the actions stay in view below it.
{const body=notes.querySelector('dl')!,more=()=>{body.toggleAttribute('data-more',body.scrollHeight-body.scrollTop-body.clientHeight>2);};
  body.addEventListener('scroll',more,{passive:true});new ResizeObserver(more).observe(body);
  all('[data-open-notes]').forEach(b=>b.addEventListener('click',()=>{notes.showModal();body.scrollTop=0;more();}));}
el('close-notes').addEventListener('click',()=>notes.close());
notes.addEventListener('click',e=>{if(e.target===notes){const r=notes.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)notes.close();}});
function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function download(content:string,name:string,type:string){downloadBlob(new Blob([content],{type}),name);}
el('export').addEventListener('click',()=>send({type:'export'}));
el('download-model').addEventListener('click',()=>download(modelXML(config),'defex-illustrative-connector.xml','application/xml'));

const stories=[
  ['On the chamfer: straight in.','Aimed right, the plug seats with no search.'],
  ['Off the chamfer: it stops.','The robot feels the edge and backs off.'],
  ['Fallback search: seated.','It tries nearby spots until the plug drops in.'],
  ['Open wire: rejected.','The open circuit fails the connection check.'],
];
const tourMethods:Controller[]=['fixed','fixed','search','fixed'],tourPasses=[true,false,true,false];
const tourPresets=['aligned','shifted','shifted','open'];
function tourStep(){
  if(tourIndex<0)return;
  tourPending=false;tourTimer=null;
  text('tour-index',`${tourIndex+1} / 4`);document.querySelectorAll('.tour-dots i').forEach((d,i)=>d.classList.toggle('on',i<=tourIndex));text('tour-title',stories[tourIndex][0]);text('tour-description',stories[tourIndex][1]);
  if(recorder){recorder.title=stories[tourIndex][0];recorder.description=stories[tourIndex][1];}
  configure(preset(tourPresets[tourIndex]),'with-run');
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
      outcome('idle','Your turn.','');
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
el('physics-demo').addEventListener('click',startTour);
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
  el<HTMLButtonElement>('tour').disabled=!ready&&!cyclePlayer?.isActive();all<HTMLButtonElement>('[data-start-tour]').forEach(b=>b.disabled=!ready);el<HTMLButtonElement>('embed-run').disabled=!ready&&!cyclePlayer?.isActive();
  el('tour').setAttribute('aria-pressed',String(tourIndex>=0));
  text('tour-label',tourIndex>=0&&!tourPaused?'Pause':'Play');
  el('tour').dataset.playing=String(tourIndex>=0&&!tourPaused);
  el('tour').setAttribute('aria-label',tourIndex>=0&&!tourPaused?'Pause':'Play');
  for(const input of settingInputs)input.disabled=!ready||unfinished||tourIndex>=0;
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
  cyclePlayer?.refresh();
  if(!halted)narrate(s);
  if(performance.now()-lastChartDraw>80||!playing)drawChart();
}
function narrate(s:Snapshot){
  if(s.phase==='ready')outcome('idle','Ready.','');
  else if(s.accepted!==null)outcome(s.accepted?'pass':'fail',s.accepted?'Both tests passed.':s.continuity===false?'Connection failed.':s.retention===false?'Lock failed.':'The connector couldn’t seat.',s.phase==='reset'?'':s.accepted?'':`${s.reason}.`);
  else if(s.phase==='reset')outcome('idle','Resetting.','');
  // During the move, probes already counts the try about to start.
  else if(s.phase==='backoff'||s.phase==='move')outcome('idle',`Try ${s.phase==='move'?s.probes-1:s.probes} was blocked.`,'');
  else if(s.phase==='electrical')outcome('idle','Testing the connection.','');
  else if(s.phase==='retention')outcome('idle','Pull test.','');
  else outcome('idle',controller==='search'?`Try ${s.probes}.`:'Inserting.','');
}
const journeySteps:Record<string,[string,string,number]>={
  approach:['Insert','The robot lowers the connector.',.2],insert:['Insert','The robot lowers the connector.',.25],
  backoff:['Blocked. Backing off.','The socket edge stopped it.',.25],move:['Trying a new spot.','Small step to the side.',.25],
  electrical:['Connection test','Is every contact in?',.75],retention:['Pull test','Does the lock hold?',.5],reset:['Reset','Back to the start.',.92],
};
function journey(s:Snapshot){
  const box=el('journey');box.classList.toggle('visible',s.phase!=='ready');
  const [title,detail,progress]=s.phase==='complete'?[s.accepted?'Passed.':'Rejected.',s.accepted?'Both tests passed.':s.reason,1] as [string,string,number]:journeySteps[s.phase]??['Ready','',0];
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
  ctx.lineWidth=1;ctx.strokeStyle='#1b3e2430';ctx.setLineDash([2,4]);
  for(let i=0;i<3;i++){const y=5+i*(height-5)/2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.setLineDash([]);
  if(samples.length>1){ctx.beginPath();samples.forEach((p,i)=>{const x=(p.t-start)/(end-start)*width,y=height-p.force/max*(height-7);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#1f2b24';ctx.lineWidth=1.6;ctx.stroke();}
  text('chart-zero',`${start.toFixed(1)} s`);text('chart-end',`${(samples.at(-1)?.t??0).toFixed(1)} s`);
}
new ResizeObserver(drawChart).observe(el('force-chart'));
function error(message:string){
  console.error(message);
  const loaded=ready,advice=loaded?'The simulation stopped. Reload to start it again.':'The physics engine didn’t load. Check your connection, then reload.';
  ready=false;failed=true;playing=false;stopTour();el('retry').hidden=false;
  // The scripted cycle needs no physics: the stage comes up when the scene has drawn, never as an empty grey frame.
  if(scene&&cyclePlayer)stageReady.then(()=>{el('loading').hidden=true;});else el('loading').hidden=true;
  if(scene){scene.playing=false;scene.direct(false);scene.offline();}
  el<HTMLButtonElement>('save-video').disabled=true;
  text('engine-status','Unavailable');el('engine-status').classList.add('error-notice');
  outcome('fail',loaded?'The simulation stopped.':'Couldn’t start the simulation.',advice);
  // The scripted cycle needs no physics, so it keeps the stage.
  el('stage-error').hidden=!!cyclePlayer?.isActive();text('stage-error-message',advice);text('stage-state','Unavailable');
  refreshControls();text('engine-status','Unavailable');
}
function startWorker(){
  if(worker)return;worker=new Worker(new URL('./simulation.worker.ts',import.meta.url),{type:'module'});
  worker.onerror=e=>error(e.message||'Reload the simulation to try again.');worker.onmessage=onWorker;
  for(const data of unsent.splice(0))worker.postMessage(data);
}
function onWorker({data}:MessageEvent){
  if(data.type==='ready'){
    // The worker only gates the physics controls (Try it yourself); the 3D stage came up on its own. Without the 3D
    // view the schematic needs the physics, so it waits for it.
    ready=true;if(!scene)el('loading').hidden=true;
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
  if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||notes.open)return;
  const cycle=!!cyclePlayer?.isActive();if(!ready&&!cycle)return;
  const t=e.target instanceof HTMLElement?e.target:null;
  if(t?.closest('input:not([type=range]),select,textarea,[contenteditable]'))return;
  if(e.code==='KeyR'){e.preventDefault();if(cycle&&!t?.closest('.console'))cyclePlayer!.restart();else if(ready)reset();return;}
  if(e.code!=='Space')return;
  const control=t?.closest('button,a,summary');
  if(control&&control!==clicked)return;
  // Reading further down, Space pages down as usual, except in the experiment controls.
  if(document.querySelector('.stage')!.getBoundingClientRect().bottom<=0&&!t?.closest('.console'))return;
  e.preventDefault();spaceTaken=true;
  // One owner for Space: the full cycle while it is on the stage, otherwise the experiment.
  if(cycle&&!t?.closest('.console'))cyclePlayer!.toggle();else if(ready)togglePlayback();
});
// A focused button would otherwise take the Space's keyup as a click.
document.addEventListener('keyup',e=>{if(e.code==='Space'&&spaceTaken){spaceTaken=false;e.preventDefault();}});
document.querySelector('.tryit')!.addEventListener('toggle',drawChart);
setupDock(document.querySelector<HTMLElement>('.dock')!);
// The Guided view chip sits beside the dock: where the dock ends and how high its middle is, kept up to date.
{const stage=document.querySelector<HTMLElement>('.stage')!,dock=document.querySelector<HTMLElement>('.dock')!;
  const place=()=>{const s=stage.getBoundingClientRect(),d=dock.getBoundingClientRect();if(!d.width)return;stage.style.setProperty('--dock-r',`${Math.round(d.right-s.left)}px`);stage.style.setProperty('--dock-cy',`${Math.round(s.bottom-(d.top+d.bottom)/2)}px`);};
  const ro=new ResizeObserver(place);ro.observe(stage);ro.observe(dock);}
settingInputs.forEach(input=>input.disabled=true);syncConfig();send({type:'init',config});
// Without the 3D view the schematic needs the physics at once.
if(!scene)startWorker();

// The scripted cycle needs no physics: the stage stays under the loader until the scene has compiled, chosen its
// quality and drawn its first frames, and the simulated harnesses are built (so no scrub stalls on them), however
// long the physics engine takes.
// The stage shows once the scene has compiled and drawn; the rope tracks finish in the background (Clear reject waits on
// them in the rare case it comes first).
const stageReady=scene?scene.ready:Promise.resolve();
stageReady.then(()=>{if(scene&&cyclePlayer)el('loading').hidden=true;startWorker();});
if(scene)cyclePlayer=setupCycle(scene,()=>{stopTour();if(currentMode==='parts')selectMode('machine',false);send({type:'pause'});},
  // Back from an experiment run: drop its end card and close-up camera.
  ()=>{el('endcard').hidden=true;document.body.classList.remove('ended');scene?.direct(false);selectView('overview',false);});
