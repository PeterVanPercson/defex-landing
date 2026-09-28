import './style.css';
import { WorkcellScene } from './scene.ts';
import { DemoRecorder } from './recording.ts';
import { DEFAULT_CONFIG, modelXML } from './model.ts';
import type { Configuration, Controller } from './model.ts';
import type { Sample, Snapshot, Trial } from './engine.ts';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const all=<T extends HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const text=(id:string,value:string)=>{const node=el(id);if(node.textContent!==value)node.textContent=value;};
const send=(data:object)=>worker.postMessage(data);
const names:Record<Controller,string>={fixed:'Fixed path',search:'Find a fit',reuse:'Reuse fit'};
const descriptions:Record<Controller,string>={
  fixed:'Follow the original path. Stop if the socket blocks it.',
  search:'Back off on contact, try a new position, and save the fit when both tests pass.',
  reuse:'Use the last successful position. Test the connection and lock again.',
};
const settingInputs=all<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('.controls input,.controls select,[data-preset],[data-controller],#forget');
const controllerButtons=all<HTMLButtonElement>('[data-controller]');
const phaseLabels=all('[data-phase]');
const cameraButtons=all<HTMLButtonElement>('[data-view]');
const presetButtons=all<HTMLButtonElement>('[data-preset]');
const reuseButton=document.querySelector<HTMLButtonElement>('[data-controller="reuse"]')!;
const isEmbed=new URLSearchParams(location.search).has('embed');
let config:Configuration={...DEFAULT_CONFIG};
let controller:Controller='fixed';
let ready=false,playing=false;
let state:Snapshot|null=null;
let samples:Sample[]=[];
let sampleEpoch=-1;
let scene:WorkcellScene|null=null;
let tourIndex=-1,tourPaused=false,tourPending=false;
let tourTimer:ReturnType<typeof setTimeout>|null=null,tourDeadline=0,tourDelay=0;
let configTimer:ReturnType<typeof setTimeout>|null=null;
let recorder:DemoRecorder|null=null;
let lastChartDraw=0;
const trials:Trial[]=[];
const worker=new Worker(new URL('./simulation.worker.ts',import.meta.url),{type:'module'});
if(isEmbed)document.body.classList.add('embed');

if(new URLSearchParams(location.search).get('view')!=='schematic'){
  try{scene=new WorkcellScene(el('scene'),config);scene.view('cell');}
  catch(error){console.warn('3D renderer unavailable',error);}
}else text('fallback-title','Live side view of the simulation.');
if(!scene){el('fallback').hidden=false;cameraButtons.forEach(b=>b.disabled=true);el<HTMLInputElement>('inspect').disabled=true;}

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
const signed=(n:number,places=2)=>`${n>=0?'+':''}${n.toFixed(places)}`;
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
function configure(next:Configuration,preview=false){
  config={...next};syncConfig();scene?.configure(config);
  if(configTimer)clearTimeout(configTimer);
  if(preview)configTimer=setTimeout(commitConfig,130);
  else commitConfig();
}
function choose(next:Controller){
  controller=next;controllerButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.controller===next)));
  text('controller-description',descriptions[next]);
}
function selectView(view:'cell'|'close'|'top'){
  scene?.view(view);cameraButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
}
function finishRecording(){
  if(!recorder)return;
  recorder.stop();recorder=null;
  el<HTMLButtonElement>('save-video').disabled=!ready||!scene;
  text('save-video','Record demo ↓');
}
function stopTour(){
  if(tourTimer)clearTimeout(tourTimer);
  tourTimer=null;tourIndex=-1;tourPaused=false;tourPending=false;
  el('tour-story').hidden=true;document.body.classList.remove('tour-active');
  finishRecording();refreshControls();
}
function run(){if(configTimer)commitConfig();send({type:'run',controller});}
function reset(){stopTour();send({type:'reset'});}
function pause(){
  if(tourIndex>=0){
    tourPaused=true;
    if(tourTimer){clearTimeout(tourTimer);tourTimer=null;tourDelay=Math.max(0,tourDeadline-performance.now());}
  }
  playing=false;send({type:'pause'});recorder?.pause();refreshControls();
}
function resume(){
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
  el<HTMLInputElement>(key).addEventListener('input',()=>{stopTour();configure({...config,[key]:Number(el<HTMLInputElement>(key).value)},true);});
  el<HTMLInputElement>(key).addEventListener('change',()=>{if(configTimer)commitConfig();});
}
el('variant').addEventListener('change',()=>{stopTour();configure({...config,variant:el<HTMLSelectElement>('variant').value as Configuration['variant']});});
el('fault').addEventListener('change',()=>{stopTour();configure({...config,fault:el<HTMLSelectElement>('fault').value as Configuration['fault']});});
for(const b of controllerButtons)b.addEventListener('click',()=>{stopTour();choose(b.dataset.controller as Controller);});
el('run').addEventListener('click',togglePlayback);
el('reset').addEventListener('click',reset);
el('speed').addEventListener('change',()=>send({type:'speed',speed:Number(el<HTMLSelectElement>('speed').value)}));
el('forget').addEventListener('click',()=>{stopTour();send({type:'forget'});if(controller==='reuse')choose('fixed');});
el('inspect').addEventListener('change',()=>scene?.setInspect(el<HTMLInputElement>('inspect').checked));
for(const b of cameraButtons)b.addEventListener('click',()=>selectView(b.dataset.view as 'cell'|'close'|'top'));
el('retry').addEventListener('click',()=>location.reload());

const notes=el<HTMLDialogElement>('notes');
all('[data-open-notes]').forEach(b=>b.addEventListener('click',()=>notes.showModal()));
el('close-notes').addEventListener('click',()=>notes.close());
notes.addEventListener('click',e=>{if(e.target===notes){const r=notes.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)notes.close();}});
function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function download(content:string,name:string,type:string){downloadBlob(new Blob([content],{type}),name);}
el('export').addEventListener('click',()=>send({type:'export'}));
el('download-model').addEventListener('click',()=>download(modelXML(config),'defex-illustrative-connector.xml','application/xml'));

const stories=[
  ['A small shift stops the fixed path.','The connector hits the socket edge and backs off.'],
  ['Try again, a little to the side.','The search changes position after each blocked attempt.'],
  ['Keep the fit that passed.','Use the saved position, then run both tests again.'],
  ['A good fit can hide a bad connection.','This time, an open circuit fails the electrical test.'],
];
function tourStep(){
  if(tourIndex<0)return;
  tourPending=false;tourTimer=null;
  text('tour-index',`${tourIndex+1} / 4`);text('tour-title',stories[tourIndex][0]);text('tour-description',stories[tourIndex][1]);
  if(recorder){recorder.title=stories[tourIndex][0];recorder.description=stories[tourIndex][1];}
  configure(preset(tourIndex===3?'open':'shifted'));
  choose((['fixed','search','reuse','fixed'] as Controller[])[tourIndex]);run();
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
      text('tour-label','Replay demo');
      outcome('idle','Demo complete. Your turn.','Choose a scenario and compare the two insertion methods.');
    }
  },delay);
  refreshControls();
}
function startTour(){
  stopTour();tourIndex=0;
  el('tour-story').hidden=false;document.body.classList.add('tour-active');
  el<HTMLSelectElement>('speed').value='2';send({type:'speed',speed:2});selectView('close');tourStep();refreshControls();
}
el('tour').addEventListener('click',()=>tourIndex>=0?togglePlayback():startTour());
el('embed-run').addEventListener('click',startTour);
el('save-video').addEventListener('click',()=>{
  stopTour();if(!scene)return;
  try{
    startTour();
    recorder=new DemoRecorder(scene.renderer.domElement,(blob,ext)=>downloadBlob(blob,`defex-connector-simulation.${ext}`));
    recorder.title=stories[0][0];recorder.description=stories[0][1];
    el<HTMLButtonElement>('save-video').disabled=true;text('save-video','Recording…');
  }catch(e){outcome('fail','Couldn’t record the demo.',e instanceof Error?e.message:String(e));}
});
el('stop-tour').addEventListener('click',()=>{stopTour();send({type:'reset'});});

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
  el<HTMLButtonElement>('tour').disabled=!ready;el<HTMLButtonElement>('embed-run').disabled=!ready;
  if(tourIndex>=0){text('tour-label',tourPaused?'Resume demo':'Pause demo');text('tour-icon',tourPaused?'▶':'Ⅱ');}
  else{text('tour-label','Play demo');text('tour-icon','▶');}
  for(const input of settingInputs)input.disabled=!ready||unfinished||tourIndex>=0;
  reuseButton.disabled=!ready||unfinished||tourIndex>=0||!state?.calibration;
  reuseButton.title=state?.calibration?'Use the last accepted correction':'Run a successful search to save a fit';
  el('memory').hidden=!state?.calibration;
  if(state?.calibration)text('memory-value',`X ${signed(state.calibration[0]*1000)} / Y ${signed(state.calibration[1]*1000)} mm`);
  text('engine-status',!ready?'Loading…':tourPaused?'Paused':tourPending?'Next step…':playing?'Running':unfinished?'Paused':state?.phase==='complete'?'Complete':'Ready');
}
function renderState(s:Snapshot,isPlaying:boolean,speed:number){
  state=s;playing=isPlaying;
  if(recorder){recorder.state=s;recorder.samples=samples;recorder.speed=speed;}
  scene?.update(s,samples,sampleEpoch);if(!scene)updateSchematic(s);
  text('force',s.force.toFixed(1));text('depth',s.depth.toFixed(1));text('probes',s.phase==='ready'?'—':String(s.probes));text('elapsed',s.time.toFixed(1));
  const phase=['approach','backoff','move'].includes(s.phase)?'insert':s.phase;
  phaseLabels.forEach(n=>n.classList.toggle('active',n.dataset.phase===phase));
  checks('electrical-check',s.continuity,s.phase==='electrical');checks('retention-check',s.retention,s.phase==='retention');
  refreshControls();
  if(s.phase==='ready')outcome('idle','Ready when you are.','Run one attempt, or play the four-step demo.');
  else if(s.accepted!==null)outcome(s.accepted?'pass':'fail',s.accepted?'Both tests passed.':s.continuity===false?'Connection failed.':s.retention===false?'Lock failed.':'The connector couldn’t seat.',s.phase==='reset'?'Returning to the start.':s.accepted?'This fit passed the simulated connection and pull tests.':s.reason);
  else if(s.phase==='backoff'||s.phase==='move')outcome('idle',`Attempt ${s.probes} was blocked.`,'Back off and try the next position.');
  else if(s.phase==='electrical')outcome('idle','Check the connection.','Testing the simulated electrical contact.');
  else if(s.phase==='retention')outcome('idle','Give it a pull.','Checking whether the lock holds.');
  else outcome('idle',controller==='search'?`Trying position ${s.probes}.`:'Inserting the connector.','Watching for contact with the socket.');
  if(performance.now()-lastChartDraw>80||!playing)drawChart();
}
function outcome(status:string,title:string,copy:string){
  el('outcome').dataset.status=status;text('outcome-title',title);text('outcome-copy',copy);
  const symbol=document.querySelector('.outcome-symbol')!,value=status==='pass'?'✓':status==='fail'?'×':'↗';
  if(symbol.textContent!==value)symbol.textContent=value;
}
function record(trial:Trial){
  trials.push(trial);text('record-count',String(trials.length).padStart(2,'0'));el<HTMLButtonElement>('export').disabled=false;
  const body=el('records-body');body.querySelector('.empty-row')?.remove();const row=document.createElement('tr');
  const values=[String(trial.id).padStart(2,'0'),names[trial.controller],`${trial.config.variant==='six'?'6':'8'} contacts · X ${signed(trial.config.offsetX)} / Y ${signed(trial.config.offsetY)} mm`,String(trial.probes),`${trial.duration.toFixed(2)} s`,`${trial.peakForce.toFixed(2)} N`];
  values.forEach(v=>{const cell=document.createElement('td');cell.textContent=v;row.append(cell);});
  const result=document.createElement('td'),tag=document.createElement('span'),reason=document.createElement('small');
  tag.className=trial.accepted?'accepted':'rejected';tag.textContent=trial.accepted?'✓ Passed':'× Failed';reason.textContent=trial.reason;
  result.append(tag,reason);row.append(result);body.prepend(row);
  if(tourIndex>=0){
    const expected=tourIndex===1||tourIndex===2;
    if(trial.accepted!==expected){stopTour();outcome('fail','Demo stopped.',`Unexpected result: ${trial.reason}. See the attempt below.`);return;}
    scheduleNext(tourIndex<3?1100:1700);
  }
}
function drawChart(){
  lastChartDraw=performance.now();
  if(isEmbed||!document.querySelector<HTMLDetailsElement>('.measurements')!.open)return;
  const canvas=el<HTMLCanvasElement>('force-chart'),r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const ratio=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(r.width*ratio)||canvas.height!==Math.round(r.height*ratio)){canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);}
  const ctx=canvas.getContext('2d')!;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,r.width,r.height);
  const width=r.width,height=r.height-6,max=samples.reduce((v,p)=>Math.max(v,p.force),6),end=Math.max(2,samples.at(-1)?.t??0),start=samples[0]?.t??0;
  ctx.lineWidth=1;ctx.strokeStyle='#dcdfd3';ctx.setLineDash([2,4]);
  for(let i=0;i<3;i++){const y=5+i*(height-5)/2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.setLineDash([]);
  if(samples.length>1){ctx.beginPath();samples.forEach((p,i)=>{const x=(p.t-start)/(end-start)*width,y=height-p.force/max*(height-7);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#d75c30';ctx.lineWidth=1.4;ctx.stroke();}
  text('chart-zero',`${start.toFixed(0)} s`);text('chart-end',`${(samples.at(-1)?.t??0).toFixed(1)} s`);
}
new ResizeObserver(drawChart).observe(el('force-chart'));
document.querySelector('.measurements')!.addEventListener('toggle',drawChart);
function error(message:string){
  ready=false;playing=false;stopTour();el('loading').hidden=true;el('retry').hidden=false;
  el<HTMLButtonElement>('save-video').disabled=true;
  text('engine-status','Unavailable');el('engine-status').classList.add('error-notice');
  outcome('fail','Couldn’t start the simulation.',message);
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
    if(data.samples.length)samples=samples.concat(data.samples).slice(-1500);
    renderState(data.state,data.playing,data.speed);
  }
  if(data.type==='trial'&&data.trial)record(data.trial);
  if(data.type==='error')error(data.message);
  if(data.type==='export')download(JSON.stringify(data.report,null,2),'defex-simulation-records.json','application/json');
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(playing||(tourIndex>=0&&!tourPaused)))pause();});
document.addEventListener('keydown',e=>{
  if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||notes.open||!ready)return;
  if(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,button,a,summary,[contenteditable]'))return;
  if(e.code==='Space'){e.preventDefault();togglePlayback();}
  if(e.code==='KeyR'){e.preventDefault();reset();}
});
settingInputs.forEach(input=>input.disabled=true);syncConfig();send({type:'init',config});
