import './style.css';
import { WorkcellScene } from './scene.ts';
import { DemoRecorder } from './recording.ts';
import { DEFAULT_CONFIG, modelXML } from './model.ts';
import type { Configuration, Controller } from './model.ts';
import type { Sample, Snapshot, Trial } from './engine.ts';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const all=<T extends HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const send=(data:object)=>worker.postMessage(data);
const names:Record<Controller,string>={fixed:'Fixed path',search:'Contact search',reuse:'Reused correction'};
const descriptions:Record<Controller,string>={fixed:'Insert along the nominal path. Stop when contact blocks the motion.',search:'Retract after blocked contact, then try another XY offset. Save a correction only after both checks pass.',reuse:'Insert using the last accepted XY correction. Check the result again.'};
let config:Configuration={...DEFAULT_CONFIG};
let controller:Controller='fixed';
let ready=false,playing=false;
let state:Snapshot|null=null;
let samples:Sample[]=[];
let scene:WorkcellScene|null=null;
let tourIndex=-1,tourTimer:ReturnType<typeof setTimeout>|null=null;
let recorder:DemoRecorder|null=null;
const trials:Trial[]=[];
const worker=new Worker(new URL('./simulation.worker.ts',import.meta.url),{type:'module'});
if(new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');

if(new URLSearchParams(location.search).get('view')!=='schematic'){try{scene=new WorkcellScene(el('scene'),config);scene.view('cell');}catch(error){console.warn('3D renderer unavailable',error);}}else{el('fallback-title').textContent='Live side view of the simulation.';}
if(!scene){el('fallback').hidden=false;all<HTMLButtonElement>('[data-view]').forEach(b=>b.disabled=true);el<HTMLInputElement>('inspect').disabled=true;}
function updateSchematic(s:Snapshot){const socket=el('schematic-socket'),plug=el('schematic-plug');socket.setAttribute('transform',`translate(${s.config.offsetX*5} 0)`);plug.setAttribute('transform',`translate(${210+s.pose[0]*5000} ${270-s.pose[2]*5000})`);const half=s.config.variant==='eight'?40:30;el('schematic-wall-left').setAttribute('x',String(210-half-20));el('schematic-wall-right').setAttribute('x',String(210+half));el('schematic-seat').setAttribute('x',String(210-half-20));el('schematic-seat').setAttribute('width',String(2*half+40));el('schematic-housing').setAttribute('x',String(-half+2));el('schematic-housing').setAttribute('width',String(2*half-4));el('schematic-housing').setAttribute('fill',s.accepted===true?'#c2d9b6':s.accepted===false?'#e1b5a1':'#f5f0dd');}

const preset=(name:string):Configuration=>({...DEFAULT_CONFIG,...(name==='shifted'?{}:{offsetX:0,offsetY:0,yaw:0}),fault:name==='open'?'open':name==='latch'?'latch':'none'});
const signed=(n:number,places=2)=>`${n>=0?'+':''}${n.toFixed(places)}`;

function syncConfig(){
  for(const key of ['offsetX','offsetY','yaw','friction'] as const){el<HTMLInputElement>(key).value=String(config[key]);el(`${key}-value`).textContent=key==='yaw'?`${signed(config[key],1)}°`:key==='friction'?config[key].toFixed(2):`${signed(config[key])} mm`;}
  el<HTMLSelectElement>('variant').value=config.variant;el<HTMLSelectElement>('fault').value=config.fault;
  for(const b of all<HTMLButtonElement>('[data-preset]')){const p=preset(b.dataset.preset!);b.setAttribute('aria-pressed',String(['offsetX','offsetY','yaw','fault'].every(k=>p[k as keyof Configuration]===config[k as keyof Configuration])));}
}
function configure(next:Configuration){config={...next};syncConfig();scene?.configure(config);send({type:'config',config});samples=[];drawChart();}
function choose(next:Controller){controller=next;all('[data-controller]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.controller===next)));el('controller-description').textContent=descriptions[next];}
function stopTour(){if(tourTimer)clearTimeout(tourTimer);tourTimer=null;tourIndex=-1;el('tour-story').hidden=true;document.body.classList.remove('tour-active');el<HTMLButtonElement>('tour').disabled=!ready;el<HTMLButtonElement>('embed-run').disabled=!ready;if(state)renderState(state,playing,Number(el<HTMLSelectElement>('speed').value));if(recorder){recorder.stop();recorder=null;el<HTMLButtonElement>('save-video').disabled=false;el('save-video').textContent='Save demo video ↓';}}
function run(){send({type:'run',controller});}

for(const b of all<HTMLButtonElement>('[data-preset]'))b.addEventListener('click',()=>{stopTour();configure({...preset(b.dataset.preset!),variant:config.variant});});
for(const key of ['offsetX','offsetY','yaw','friction'] as const)el<HTMLInputElement>(key).addEventListener('input',()=>{stopTour();configure({...config,[key]:Number(el<HTMLInputElement>(key).value)});});
el('variant').addEventListener('change',()=>{stopTour();configure({...config,variant:el<HTMLSelectElement>('variant').value as Configuration['variant']});});
el('fault').addEventListener('change',()=>{stopTour();configure({...config,fault:el<HTMLSelectElement>('fault').value as Configuration['fault']});});
for(const b of all<HTMLButtonElement>('[data-controller]'))b.addEventListener('click',()=>{stopTour();choose(b.dataset.controller as Controller);});
el('run').addEventListener('click',()=>{stopTour();if(playing)send({type:'pause'});else if(state&&state.phase!=='ready'&&state.phase!=='complete')send({type:'resume'});else run();});
el('reset').addEventListener('click',()=>{stopTour();send({type:'reset'});});
el('speed').addEventListener('change',()=>send({type:'speed',speed:Number(el<HTMLSelectElement>('speed').value)}));
el('forget').addEventListener('click',()=>{stopTour();send({type:'forget'});if(controller==='reuse')choose('fixed');});
el('inspect').addEventListener('change',()=>scene?.setInspect(el<HTMLInputElement>('inspect').checked));
for(const b of all<HTMLButtonElement>('[data-view]'))b.addEventListener('click',()=>{scene?.view(b.dataset.view as 'cell'|'close'|'top');all('[data-view]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));});
const notes=el<HTMLDialogElement>('notes');all('[data-open-notes]').forEach(b=>b.addEventListener('click',()=>notes.showModal()));el('close-notes').addEventListener('click',()=>notes.close());notes.addEventListener('click',e=>{if(e.target===notes){const r=notes.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)notes.close();}});
function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
el('export').addEventListener('click',()=>send({type:'export'}));el('download-model').addEventListener('click',()=>download(modelXML(config),'defex-illustrative-connector.xml','application/xml'));

const stories=[
  ['The fixed path meets a shifted socket.','Contact stops the insertion before the connector is seated.'],
  ['Search for an offset that fits.','Each blocked probe retracts. Only an electrically connected, retained assembly is accepted.'],
  ['Use the successful correction again.','The same socket, with the accepted XY offset saved from the previous search.'],
  ['A seated connector can still fail.','An injected open circuit fails the electrical test, even when the mechanical lock passes.'],
];
function tourStep(){
  if(tourIndex<0)return;
  el('tour-index').textContent=`0${tourIndex+1} / 04`;el('tour-title').textContent=stories[tourIndex][0];el('tour-description').textContent=stories[tourIndex][1];
  if(recorder){recorder.title=stories[tourIndex][0];recorder.description=stories[tourIndex][1];}
  configure(preset(tourIndex===3?'open':'shifted'));
  choose((['fixed','search','reuse','fixed'] as Controller[])[tourIndex]);
  run();
}
function startTour(){tourIndex=0;el('tour-story').hidden=false;document.body.classList.add('tour-active');el<HTMLButtonElement>('tour').disabled=true;el<HTMLButtonElement>('embed-run').disabled=true;el<HTMLSelectElement>('speed').value='2';send({type:'speed',speed:2});scene?.view('close');all('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='close')));tourStep();}
el('tour').addEventListener('click',()=>{stopTour();startTour();});
el('embed-run').addEventListener('click',()=>{stopTour();startTour();});
el('save-video').addEventListener('click',()=>{stopTour();if(!scene)return;try{recorder=new DemoRecorder(scene.renderer.domElement,(blob,ext)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`defex-connector-simulation.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});el<HTMLButtonElement>('save-video').disabled=true;el('save-video').textContent='Recording the experiment…';startTour();}catch(e){outcome('fail','Video export unavailable.',e instanceof Error?e.message:String(e));}});
el('stop-tour').addEventListener('click',()=>{stopTour();send({type:'pause'});});

function checks(id:string,value:boolean|null,testing:boolean){const node=el(id);node.textContent=value===true?'PASS':value===false?'FAIL':testing?'TESTING':'NOT TESTED';node.dataset.status=value===true?'pass':value===false?'fail':testing?'testing':'idle';}
function renderState(s:Snapshot,isPlaying:boolean,speed:number){
  state=s;playing=isPlaying;el<HTMLSelectElement>('speed').disabled=!ready;
  if(recorder){recorder.state=s;recorder.samples=samples;}
  scene?.update(s,samples);if(!scene)updateSchematic(s);
  el('force').textContent=s.force.toFixed(1);el('depth').textContent=s.depth.toFixed(1);el('probes').textContent=s.phase==='ready'?'—':String(s.probes);el('elapsed').textContent=s.time.toFixed(1);
  const phase=['approach','backoff','move'].includes(s.phase)?'insert':s.phase;
  all('[data-phase]').forEach(n=>n.classList.toggle('active',n.dataset.phase===phase));
  checks('electrical-check',s.continuity,s.phase==='electrical');checks('retention-check',s.retention,s.phase==='retention');
  const unfinished=s.phase!=='complete'&&s.phase!=='ready';
  el('run').innerHTML=playing?'Pause <span>Ⅱ</span>':unfinished?'Resume <span>▶</span>':'Run attempt <span>↗</span>';
  el<HTMLButtonElement>('run').disabled=!ready;
  el<HTMLButtonElement>('reset').disabled=!ready;
  for(const input of all<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('.controls input,.controls select:not(#speed),[data-preset],[data-controller],#forget'))input.disabled=!ready||unfinished||tourIndex>=0;
  const reuse=document.querySelector<HTMLButtonElement>('[data-controller="reuse"]')!;reuse.disabled=!ready||unfinished||tourIndex>=0||!s.calibration;
  el('memory').hidden=!s.calibration;if(s.calibration)el('memory-value').textContent=`X ${signed(s.calibration[0]*1000)} / Y ${signed(s.calibration[1]*1000)} mm`;
  el('engine-status').textContent=playing?`PHYSICS RUNNING · ${speed}×`:unfinished?'PAUSED':s.phase==='complete'?'ATTEMPT RECORDED':'PHYSICS READY';
  if(s.phase==='ready')outcome('idle','Ready for an attempt.',descriptions[controller]);
  else if(s.accepted!==null)outcome(s.accepted?'pass':'fail',s.accepted?'Accepted in simulation.':'Rejected in simulation.',s.reason+(s.phase==='reset'?' · Retracting.':''));
  else if(s.phase==='backoff'||s.phase==='move')outcome('idle',`Contact blocked probe ${s.probes}.`,'Retracting and moving to the next search position.');
  else if(s.phase==='electrical')outcome('idle','Checking the connection.','Modeled continuity requires seating and no open-circuit fault.');
  else if(s.phase==='retention')outcome('idle','Pulling against the latch.','An upward motion tests the idealized retention constraint.');
  else outcome('idle',controller==='search'?`Trying probe ${s.probes}.`:'Inserting the connector.','Motion and axial forces are computed by MuJoCo.');
  drawChart();
}
function outcome(status:string,title:string,copy:string){el('outcome').dataset.status=status;if(el('outcome-title').textContent!==title)el('outcome-title').textContent=title;if(el('outcome-copy').textContent!==copy)el('outcome-copy').textContent=copy;document.querySelector('.outcome-symbol')!.textContent=status==='pass'?'✓':status==='fail'?'×':'↗';}
function record(trial:Trial){
  trials.push(trial);el('record-count').textContent=String(trials.length).padStart(2,'0');el<HTMLButtonElement>('export').disabled=false;
  const body=el('records-body');body.querySelector('.empty-row')?.remove();const row=document.createElement('tr');
  const values=[String(trial.id).padStart(2,'0'),names[trial.controller],`${trial.config.variant==='six'?'6':'8'} contacts · X ${signed(trial.config.offsetX)} / Y ${signed(trial.config.offsetY)} mm`,String(trial.probes),`${trial.duration.toFixed(2)} s`,`${trial.peakForce.toFixed(2)} N`];
  values.forEach(v=>{const cell=document.createElement('td');cell.textContent=v;row.append(cell);});const result=document.createElement('td');const tag=document.createElement('span');tag.className=trial.accepted?'accepted':'rejected';tag.textContent=trial.accepted?'✓ Accepted':'× Rejected';const reason=document.createElement('small');reason.textContent=trial.reason;result.append(tag,reason);row.append(result);body.prepend(row);
  if(tourIndex>=0){
    const expected=tourIndex===1||tourIndex===2;
    if(trial.accepted!==expected){stopTour();outcome('fail','Experiment stopped.',`Unexpected result: ${trial.reason}. Inspect the record before continuing.`);return;}
    if(tourIndex<3){tourTimer=setTimeout(()=>{tourIndex++;tourStep();},1300);}
    else{tourTimer=setTimeout(()=>{stopTour();},2200);}
  }
}
function drawChart(){
  const canvas=el<HTMLCanvasElement>('force-chart'),r=canvas.getBoundingClientRect();if(!r.width)return;
  const ratio=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(r.width*ratio)||canvas.height!==Math.round(r.height*ratio)){canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);}
  const ctx=canvas.getContext('2d')!;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,r.width,r.height);
  const width=r.width,height=r.height-6,max=Math.max(6,...samples.map(p=>p.force)),end=Math.max(2,samples.at(-1)?.t??0),start=samples[0]?.t??0;
  ctx.lineWidth=1;ctx.strokeStyle='#dcdfd3';ctx.setLineDash([2,4]);for(let i=0;i<3;i++){const y=5+i*(height-5)/2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.setLineDash([]);
  if(samples.length>1){ctx.beginPath();samples.forEach((p,i)=>{const x=(p.t-start)/(end-start)*width,y=height-p.force/max*(height-7);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#d75c30';ctx.lineWidth=1.4;ctx.stroke();}
  el('chart-zero').textContent=`${start.toFixed(0)} s`;el('chart-end').textContent=`${(samples.at(-1)?.t??0).toFixed(1)} s`;
}
new ResizeObserver(drawChart).observe(el('force-chart'));
function error(message:string){ready=false;playing=false;stopTour();el('loading').hidden=true;el('engine-status').textContent='PHYSICS UNAVAILABLE';el('engine-status').classList.add('error-notice');outcome('fail','The simulation could not start.',message);el<HTMLButtonElement>('run').disabled=true;el<HTMLButtonElement>('reset').disabled=true;el<HTMLButtonElement>('tour').disabled=true;}
worker.onerror=e=>error(e.message||'Reload the page to try again.');
worker.onmessage=({data})=>{
  if(data.type==='ready'){ready=true;el('loading').hidden=true;el<HTMLButtonElement>('tour').disabled=false;el<HTMLButtonElement>('embed-run').disabled=false;el<HTMLButtonElement>('save-video').disabled=!scene||typeof MediaRecorder==='undefined';}
  if(data.type==='state'){samples=data.samples;renderState(data.state,data.playing,data.speed);}
  if(data.type==='trial'&&data.trial)record(data.trial);
  if(data.type==='error')error(data.message);
  if(data.type==='export')download(JSON.stringify(data.report,null,2),'defex-simulation-records.json','application/json');
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stopTour();send({type:'pause'});}});
for(const input of all<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('.controls input,.controls select,[data-preset],[data-controller]'))input.disabled=true;
syncConfig();send({type:'init',config});
