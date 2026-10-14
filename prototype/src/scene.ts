import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { applyLine, createCell, disposeCell, dressLiveHarness, factoryEnvironment, mergeStatic, poseLatch, posePlunger, REST_LINE, tracksReady } from './cell-geometry.ts';
import { createHall, FLOOR } from './hall.ts';
import { PoseStream, damping, settleSpring, isClick, isDrag, lensShift, idleWait, spreadSee } from './motion.ts';
import * as Process from './process.ts';
import { processFrame, HEADER, UPCAM } from './process.ts';
import type { ProcessFrame } from './process.ts';
import type { Configuration } from './model.ts';
import type { Snapshot } from './engine.ts';
import type { PartId } from './parts.ts';
import { PARTS } from './parts.ts';
import { batchStaticMeshes } from './batching.ts';
import { GRIP_RAISE, INDEX_START, PICK, opSeconds } from './line.ts';
import type { LineFrame, Shot as LineShot } from './line.ts';
// The overview shots: the cycle's, and 'pack', the work shot opened up while the picker packs a unit (scene only).
type Shot=LineShot|'pack';

export type View='overview'|'side'|'top'|'connector'|'part';
export type Mode='machine'|'inside'|'parts';
// onSettle: the shot the guided camera has arrived at ('close' for the close-ups, 'free' while the person has it).
export interface Hud {labels:HTMLElement;tooltip:HTMLElement;onPick?:(id:PartId)=>void;onDirector?:(on:boolean)=>void;onFree?:(free:boolean)=>void;onSettle?:(shot:Shot|'close'|'free')=>void}
// A camera the person turned and then left alone this long glides back to the guided shots.
export const IDLE_MS=8000;
// Rendering tiers, one chosen under the loader and kept for the session (never switched mid-play).
export interface Tier {ratio:number;ao:boolean;bokeh:boolean}
export const TIERS:{desktop:Tier[];phone:Tier[]}={
  desktop:[{ratio:2,ao:true,bokeh:true},{ratio:1.5,ao:true,bokeh:true},{ratio:1.25,ao:true,bokeh:false},{ratio:1,ao:false,bokeh:false}],
  phone:[{ratio:1.5,ao:true,bokeh:false},{ratio:1.25,ao:true,bokeh:false},{ratio:1,ao:false,bokeh:false}],
};
// A tier holds 60 fps if its worst frame (close-up, AO, defocus, a shadow redraw), drawn and waited for, takes
// 18 ms or less: a playing frame overlaps its CPU and GPU work, so it then costs well under 16.7 ms.
const BUDGET=18;
export class WorkcellScene {
  renderer:T.WebGLRenderer;
  scene=new T.Scene(); camera=new T.PerspectiveCamera(25,1,30,150000);
  controls:OrbitControls; composer:EffectComposer; ao:GTAOPass; bokeh:BokehPass;
  rig=createCell(); hall=createHall(); config:Configuration;
  poses=new PoseStream(); state:Snapshot|null=null; playing=false; afterRender:(()=>void)|null=null;
  mode:Mode='machine'; viewMode:View='overview'; focus:PartId='socket';
  process:ProcessFrame|null=processFrame(0); director=false; disposed=false;
  // Resolves once every shader is compiled, the tier is chosen and the first frames are on screen.
  ready:Promise<void>;
  // The tier index (0 best) and the program count right after the warm-up, for QA.
  quality=0; warmPrograms=0;
  private container:HTMLElement; private hud:Hud|null; private embed:boolean;
  private frame=0; private last=0; private width=1; private height=1; private warming=true; private rendered=0;
  private cameraMoving=true; private spread=0; private renderedPose=''; private dressed=''; private lineKey='';
  // The guided camera's goal: target, position, lens and a lens shift (a fraction of the frame) that lets a shot keep
  // its composition while it turns about a point on the bench.
  private target=new T.Vector3();private position=new T.Vector3();private shift=new T.Vector2();
  // Where the guided camera is (the spring's state): the person's clicks and the first pixels of a drag never move it.
  private camPos=new T.Vector3();private camTgt=new T.Vector3();
  private velP=new T.Vector3();private velT=new T.Vector3();private lensVel=0;private shown=new T.Vector2();private shiftVel=new T.Vector2();
  private ro:ResizeObserver;private io:IntersectionObserver;private visible=true;
  // Phones and narrow screens get a lighter pipeline: fewer pixels, a smaller shadow map, no defocus.
  private light=matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  private tiers=this.light?TIERS.phone:TIERS.desktop;private tier:Tier=this.tiers[0];
  private labels=new Map<PartId,HTMLElement>();
  private basePose=[0,0,42,0];private band:Shot='wide';
  // The shot the frame asks for: while the picker lifts a finished unit high over the tote and packs it (op-time
  // from its lift to the jaws opening), the work shot opens up to hold the board at its highest and the tote.
  private shotFor(f:ProcessFrame):Shot{
    if(f.shot!=='work'||!(f as Partial<LineFrame>).pack||f.progress>=INDEX_START)return f.shot;
    const t=opSeconds((f as Partial<LineFrame>).lineProgress??f.progress);return t>=PACK_FROM&&t<PICK.open?'pack':'work';
  }
  // Set by a real drag, pinch or ctrl-wheel; the Guided view chip, a dock button or a quiet shot change clears it.
  free=false;
  private lastInput=-1e9;private lastProgress=0;private followed=new T.Vector3();private scrubbing=false;
  private gesture:{id:number;x:number;y:number;t:number;button:number;touch:boolean;dragged:boolean;pos:T.Vector3;tgt:T.Vector3}|null=null;
  private touches=new Set<number>();private hoverAt=0;private hoverTimer=0;private hovered:PartId|null=null;
  private fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  private lens=35;private shownLens=35;
  // Defocus eases in and out with the camera instead of switching in one frame.
  private blur=0;
  // Try it yourself: after a pass the hand lets go of the seated plug and lifts clear (letGo 0 holding .. 1 clear).
  // Before the engine moves the plug again (a new run, a reset, a new setup) it comes back down and closes on it.
  private letGo=0;private regripping=false;private deferredSetup=false;
  // The overview shot the cycle asks for: the opening photo, the work at the bench, the whole line, or a held reject.
  private shot():Shot{return this.process?.shot??'work';}
  // 1 while the close-up's focus is up at the wrist camera over the header (the board check), 0 at the plug.
  private boardWeight(){const f=this.process;if(!f?.focus)return 0;return 1-T.MathUtils.smoothstep(Math.hypot(f.focus[0]-HEADER[0]+9,f.focus[1]-HEADER[1]+1.6,f.focus[2]-64),4,60);}
  private focalPoint=new T.Vector3();private headerAt=new T.Vector3();
  private ray=new T.Raycaster();
  private reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Additive cards that suggest each ring light's spill: no lights, no shadows, hidden from AO and defocus.
  private glow=createGlow();
  // What fades or turns see-through at runtime: the live plug and wires, the header's shroud, each unit's housings.
  private plugMaterials:T.Material[]=[];private wireMaterials:T.Material[]=[];private shroud:T.Material[]=[];
  private unitCuts:{group:T.Object3D;materials:T.Material[]}[]=[];private plugSee=1;private wiresSee=1;private cut=1;
  private key:T.DirectionalLight;
  constructor(container:HTMLElement,config:Configuration,hud:Hud|null=null,embed=false){
    this.container=container;this.config=config;this.hud=hud;this.embed=embed;
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    // Synchronous link checks stall every compile; production trusts the shaders the warm-up already built.
    this.renderer.debug.checkShaderErrors=import.meta.env.DEV;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.tier.ratio));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.NeutralToneMapping;this.renderer.toneMappingExposure=1;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');
    this.renderer.domElement.style.opacity='0';
    this.renderer.domElement.setAttribute('aria-label','Interactive rendered connector workcell in an empty factory hall. White six-joint arm, two-finger gripper, six-wire harness, green circuit board, fixture, tester and reject tray.');
    this.camera.up.set(0,0,1);this.scene.background=new T.Color(0xb8bbbb);this.scene.fog=new T.FogExp2(0xb8bbbb,.0000105);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    // A pinch (ctrlKey wheel, deltaY = 100 ln scale) at zoomSpeed 1.95 scales the distance by the pinch itself.
    Object.assign(this.controls,{enableDamping:true,dampingFactor:.08,enablePan:false,minDistance:150,maxDistance:3500,minPolarAngle:.015,maxPolarAngle:Math.PI*.49,rotateSpeed:.45,zoomSpeed:1.95,zoomToCursor:true});
    this.controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_ROTATE};if(embed)this.controls.enableZoom=false;
    this.renderer.domElement.style.touchAction='pan-y';this.renderer.domElement.style.cursor='grab';
    this.controls.addEventListener('change',this.wake);
    container.addEventListener('wheel',this.wheel,{capture:true,passive:true});
    const canvas=this.renderer.domElement;
    canvas.addEventListener('pointerdown',this.pointerDown,{capture:true});canvas.addEventListener('pointermove',this.pointerMove);
    canvas.addEventListener('pointerup',this.pointerUp);canvas.addEventListener('pointercancel',this.pointerUp);canvas.addEventListener('pointerleave',this.pointerLeave);
    canvas.addEventListener('webglcontextlost',this.contextLost);
    const env=factoryEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);
    this.scene.environment=pmrem.fromScene(env,.02).texture;this.scene.environmentIntensity=.9;env.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();[o.material].flat().forEach(m=>m.dispose());}});this.scene.environmentRotation.x=Math.PI/2;pmrem.dispose();
    // Hall lighting falls almost straight down; a cooler light comes in from the windows behind. The key is a little
    // stronger and the sky fill weaker than the hall alone would give, so the bench reads in light and shade.
    const key=this.key=new T.DirectionalLight(0xffffff,2.5);key.position.set(-260,-420,1500);key.target.position.set(-40,0,60);key.castShadow=true;
    key.shadow.mapSize.setScalar(this.light?2048:4096);key.shadow.normalBias=.12;key.shadow.bias=-.0001;key.shadow.radius=3;fitShadow(key);
    this.scene.add(key,key.target);const fill=new T.HemisphereLight(0xf3f6f7,0x5d625f,.27);fill.position.set(0,0,1000);this.scene.add(fill);
    const windowLight=new T.DirectionalLight(0xeaf1f6,.62);windowLight.position.set(300,1400,700);this.scene.add(windowLight);
    this.scene.add(this.hall,this.rig.root,this.glow.root);
    this.batchRig();this.tagParts();
    this.composer=new EffectComposer(this.renderer,new T.WebGLRenderTarget(1,1,{samples:this.light?2:4,type:T.HalfFloatType}));
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.ao=new GTAOPass(this.scene,this.camera,1,1);this.ao.blendIntensity=.55;
    this.ao.updateGtaoMaterial({radius:10,distanceExponent:1.6,thickness:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:false});this.ao.updatePdMaterial({radius:3,rings:2,samples:8});this.composer.addPass(this.ao);
    this.bokeh=new BokehPass(this.scene,this.camera,{focus:1200,aperture:.000007,maxblur:.003});
    // Thin-lens defocus in scene millimetres.
    this.bokeh.materialBokeh.fragmentShader=this.bokeh.materialBokeh.fragmentShader.replace('float factor = ( focus + viewZ );','float factor = ( focus + viewZ ) / max( -viewZ, 1.0 );');
    this.composer.addPass(this.bokeh);this.composer.addPass(new OutputPass());
    // AO is the costly pass: on a dense screen it works at CSS-pixel resolution (denoised, then blended in at full).
    const aoSize=this.ao.setSize.bind(this.ao);this.ao.setSize=(w:number,h:number)=>{const k=1/Math.max(1,this.renderer.getPixelRatio());aoSize(Math.round(w*k),Math.round(h*k));};
    // AO and the defocus depth see neither the glow cards nor anything part-faded, so a fading part leaves no dark
    // outline behind it.
    for(const pass of [this.ao,this.bokeh]){const render=pass.render.bind(pass);pass.render=(...args)=>{const shown=this.glow.root.visible,hidden=this.hideFaded();this.glow.root.visible=false;render(...args);this.glow.root.visible=shown;for(const o of hidden)o.visible=true;};}
    this.configure(config);this.applyProcess(this.process!);
    this.ro=new ResizeObserver(this.layout);this.ro.observe(container);
    this.io=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;this.wake();});this.io.observe(container);document.addEventListener('visibilitychange',this.wake);
    if(import.meta.env.DEV)(window as unknown as {scene:WorkcellScene}).scene=this;
    this.layout();this.snap();
    if(import.meta.env.DEV)performance.mark('scene-built');
    this.ready=this.warmUp().catch(error=>console.warn('warm-up',error)).finally(()=>{this.warming=false;this.renderer.domElement.style.opacity='';});
  }
  // Resolves once the cell's simulated harnesses (packing and posting) are built: they build in slices under the
  // loader, and a frame that needs one sooner would finish them at once and stall. A build finished that way does
  // not resolve tracksReady, so the post's track appearing counts too.
  // Whether the rope tracks have finished building (they build in idle slices after the reveal).
  tracksDone(){return !!(this.rig as {post?:{track?:unknown}}).post?.track;}
  tracksBuilt(){
    const rig=this.rig as {post?:{track?:unknown}};
    return new Promise<void>(resolve=>{let done=false;const end=()=>{if(!done){done=true;resolve();}};tracksReady(this.rig).then(end);
      const poll=()=>{if(done||this.disposed)return;if(rig.post?.track)end();else setTimeout(poll,100);};poll();});
  }
  // dev only: frame a shot by hand from the console
  frameShot(target:number[],dir:number[],dist:number,lens:number){this.lens=lens;this.target.set(target[0],target[1],target[2]);this.position.copy(this.target).addScaledVector(new T.Vector3(dir[0],dir[1],dir[2]).normalize(),dist);this.shift.set(0,0);this.snap();this.wake();}
  wheel=(e:WheelEvent)=>{if(!e.ctrlKey&&!e.metaKey){e.stopPropagation();return;}if(this.controls.enableZoom){this.takeOver();this.noteInput();}};
  // Every touch of the camera restarts the idle wait; once it runs out with no pointer down, the guided view comes back.
  private idleTimer=0;
  private noteInput(){this.lastInput=performance.now();if(this.free)this.armIdle(IDLE_MS);}
  private armIdle(wait:number){clearTimeout(this.idleTimer);this.idleTimer=window.setTimeout(this.idleCheck,wait);}
  private idleCheck=()=>{
    this.idleTimer=0;if(!this.free||this.disposed)return;
    const wait=idleWait(performance.now()-this.lastInput,!!this.gesture||this.touches.size>0,IDLE_MS);
    if(wait>0){this.armIdle(wait);return;}
    this.guided();
  };
  contextLost=(e:Event)=>{e.preventDefault();this.container.dispatchEvent(new CustomEvent('renderer-lost'));};
  pointerDown=(e:PointerEvent)=>{
    this.noteInput();this.showTooltip(null);
    if(e.pointerType==='touch'){this.touches.add(e.pointerId);if(this.touches.size>1){if(this.gesture)this.gesture.dragged=true;this.takeOver();return;}}
    if(this.gesture)return;
    this.gesture={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),button:e.button,touch:e.pointerType==='touch',dragged:false,pos:this.camera.position.clone(),tgt:this.controls.target.clone()};
  };
  pointerMove=(e:PointerEvent)=>{
    const g=this.gesture;
    if(g){if(e.pointerId!==g.id)return;this.noteInput();
      if(!g.dragged&&e.buttons&&isDrag(e.clientX-g.x,e.clientY-g.y,g.touch)){g.dragged=true;this.takeOver();this.renderer.domElement.style.cursor='grabbing';}return;}
    if(this.free)this.noteInput();
    if(e.pointerType==='mouse'&&this.fine&&!e.buttons)this.hover(e.clientX,e.clientY);
  };
  pointerUp=(e:PointerEvent)=>{
    this.touches.delete(e.pointerId);if(this.free)this.noteInput();
    const g=this.gesture;if(!g||e.pointerId!==g.id)return;this.gesture=null;if(g.dragged)this.renderer.domElement.style.cursor='grab';
    // The page scroll took the swipe: put back what the first few pixels of it turned.
    if(e.type==='pointercancel'){if(!g.dragged){this.camera.position.copy(g.pos);this.controls.target.copy(g.tgt);this.stopOrbit();this.wake();}return;}
    if(g.dragged||!isClick(g.button,performance.now()-g.t,e.clientX-g.x,e.clientY-g.y))return;
    const id=this.pickAt(e.clientX,e.clientY);if(!id)return;
    if(this.hud?.onPick)this.hud.onPick(id);else this.pick(id);
  };
  pointerLeave=()=>{if(!this.gesture)this.showTooltip(null);};
  // The connector and the gripper move all cycle, so a pick of either follows them in the close-up.
  pick(id:PartId){if(id==='connector'||id==='gripper')this.view('connector');else this.focusPart(id);}
  // The first opaque surface under the pointer decides; a part behind the bench is not picked through it.
  pickAt(x:number,y:number):PartId|null{
    const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);
    for(const h of this.ray.intersectObject(this.rig.root,true)){
      let o:T.Object3D|null=h.object,shown=true;while(o){if(!o.visible){shown=false;break;}o=o.parent;}if(!shown)continue;
      const m=(h.object as T.Mesh).material as T.Material;if(m.transparent&&m.opacity<.5)continue;
      return (h.object.userData.part as PartId)??null;
    }
    return null;
  }
  private hover(x:number,y:number){
    const now=performance.now();clearTimeout(this.hoverTimer);
    if(now-this.hoverAt<90){this.hoverTimer=window.setTimeout(()=>this.hover(x,y),90-(now-this.hoverAt));return;}
    this.hoverAt=now;const id=this.pickAt(x,y);this.renderer.domElement.style.cursor=id?'pointer':'grab';
    this.showTooltip(id,x,y);
  }
  private showTooltip(id:PartId|null,x=0,y=0){
    const tip=this.hud?.tooltip;this.hovered=id;if(!tip)return;
    if(!id){tip.classList.remove('visible');if(!this.gesture)this.renderer.domElement.style.cursor='grab';return;}
    const r=this.container.getBoundingClientRect(),name=PARTS.find(p=>p.id===id)?.name??id,strong=tip.querySelector('strong'),p=tip.querySelector('p');
    if(strong&&strong.textContent!==name)strong.textContent=name;if(p)p.hidden=true;
    tip.style.transform=`translate(${Math.round(x-r.left+14)}px,${Math.round(y-r.top+16)}px)`;tip.classList.add('visible');
  }
  // The person takes the camera: the guided move stops where it is and their orbit starts from there.
  private takeOver(){
    if(this.free)return;this.free=true;this.director=false;this.cameraMoving=false;this.velP.set(0,0,0);this.velT.set(0,0,0);this.lensVel=0;this.shiftVel.set(0,0);
    this.lens=this.shownLens;this.followed.copy(this.target);this.showTooltip(null);this.hud?.onFree?.(true);this.settle('free');this.noteInput();this.wake();
  }
  // Back to the guided camera, from wherever the person left it.
  guided(){if(this.release())this.goal();}
  private release(){if(!this.free)return false;this.free=false;this.carry.set(0,0,0);clearTimeout(this.idleTimer);this.idleTimer=0;this.camPos.copy(this.camera.position);this.camTgt.copy(this.controls.target);this.hud?.onFree?.(false);return true;}
  private stopOrbit(){const c=this.controls as unknown as {_sphericalDelta:T.Spherical;_scale:number;_panOffset:T.Vector3};c._sphericalDelta.set(0,0,0);c._scale=1;c._panOffset.set(0,0,0);}
  // While the slider is held, the camera keeps the shot it had; on release it goes to the one the frame asks for.
  setScrubbing(on:boolean){if(this.scrubbing===on)return;this.scrubbing=on;this.lastInput=performance.now();if(!on&&this.process&&this.shotFor(this.process)!==this.band){this.band=this.shotFor(this.process);if(!this.free)this.goal();}}
  private ensureVariant(pins:number){
    if(this.rig.pins===pins)return;
    disposeCell(this.rig.root);this.scene.remove(this.rig.root);this.rig=createCell(pins);this.scene.add(this.rig.root);
    this.batchRig();this.tagParts();
    this.renderedPose=this.dressed=this.lineKey='';
  }
  private partGroups():Record<PartId,T.Object3D>{return {arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};}
  private tagParts(){for(const [id,g] of Object.entries(this.partGroups())){g.traverse(o=>o.userData.part=id);if(!this.labels.has(id as PartId)){const label=document.createElement('div');label.className='cell-label';label.textContent=PARTS.find(p=>p.id===id)?.name??id;label.hidden=true;this.hud?.labels.append(label);this.labels.set(id as PartId,label);}}}
  // Static hardware merges by material; only the moving parts keep their own meshes.
  private batchRig(){
    const r=this.rig,own=(m:T.Material)=>{const c=m.clone();c.userData.canFade=true;return c;};
    for(const g of [r.bench,r.plate,r.fixture,r.nest,r.comb,r.adapter,r.bin,r.upcam,r.tool.root,r.plug])batchStaticMeshes(g,new Set());
    // Each unit's housings get their own see-through material before the unit merges, so the Inside view cuts the
    // queue and finished units' housings as it does the live one and nothing changes when a unit indexes in.
    this.unitCuts=[];
    for(const u of Object.values(r.units))for(const g of [u.board,u.harness]){
      const copies=new Map<T.Material,T.Material>();
      g.traverse(o=>{if(o instanceof T.Mesh&&/PBT header|Header seating floor|Latch catch|connector housing/.test(o.name)){const m=o.material as T.Material;if(!copies.has(m))copies.set(m,own(m));o.material=copies.get(m)!;}});
      this.unitCuts.push({group:g,materials:[...copies.values()]});
    }
    // The totes' slotted insert is a grey conductive foam, a few shades lighter than the black shell, so the wires
    // piled in each slot read against it instead of vanishing into the dark tote.
    const foam=new T.MeshStandardMaterial({color:TOTE_FOAM,roughness:.92,name:'Conductive foam insert'});
    for(const g of [r.tote.shell,r.tote.out.shell,r.tote.spare.shell])g.traverse(o=>{if(o instanceof T.Mesh&&o.name==='Slotted insert')o.material=foam;});
    for(const g of [r.tote.shell,r.tote.out.shell,r.tote.spare.shell,r.rejectBin,...Object.values(r.units).flatMap(u=>[u.hardware,u.board,u.harness])])mergeStatic(g);
    // The picker's post and beam merge; its carriages, head and jaws keep their own groups (only siblings merge).
    batchStaticMeshes(r.picker.root,new Set());
    batchStaticMeshes(r.tester,new Set([r.dockHead]));
    // The live plug, its wires and the header's shroud get their own materials: the plug and wires fade as a cleared
    // reject's harness is taken away, and Inside sees through the housings.
    this.plugMaterials=[];this.shroud=[];
    r.plug.traverse(o=>{if(o instanceof T.Mesh){if(!o.userData.unique){o.material=own(o.material as T.Material);o.userData.unique=true;}const m=o.material as T.Material;m.userData.cut=o.name.includes('housing');this.plugMaterials.push(m);}});
    r.housing.traverse(o=>{if(o instanceof T.Mesh){if(!o.userData.unique){o.material=own(o.material as T.Material);o.userData.unique=true;}this.shroud.push(o.material as T.Material);}});
    this.wireMaterials=r.wires.map(w=>{const m=w.mesh.material as T.Material;m.userData.canFade=true;return m;});
    // A fading part's shadow thins with it: its shadow-map draw drops texels by its opacity (soft after the filter),
    // so no shadow switches off in one frame. Both depth materials are drawn in the warm-up.
    r.plug.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.customDepthMaterial=this.plugDepth;}});
    for(const w of r.wires){w.mesh.castShadow=true;w.mesh.customDepthMaterial=this.wiresDepth;}
    this.harnessOut=-1;this.shadowSee='';
  }
  private plugDepth=new T.MeshDepthMaterial({alphaHash:true});private wiresDepth=new T.MeshDepthMaterial({alphaHash:true});private shadowSee='';
  private harnessOut=0;private harnessSee=1;
  // A frame that still asks for the harness to go (an older cycle) fades it; the robot's post into the bin needs none.
  private fadeHarness(out:number){
    if(Math.abs(out-this.harnessOut)<1e-4)return;this.harnessOut=out;
    this.harnessSee=1-T.MathUtils.smoothstep(out,0,1);
  }
  // Every material that fades or is cut, set from the live fades and the Inside view. A fading solid keeps writing
  // depth, so its own far side and what is inside it stay hidden behind its near side as it thins: no frame shows
  // its inside at full strength. Inside's cut (a steady see-through view) draws without depth, as it always has.
  private seeThrough(){
    const cut=this.cut;
    const set=(m:T.Material,see:number,solid:boolean)=>{const fading=see<.998;if(m.transparent!==fading){m.transparent=fading;m.needsUpdate=true;}m.opacity=see;m.depthWrite=solid||!fading;};
    const inside=cut<.998;
    for(const m of this.plugMaterials)set(m,this.plugSee*(m.userData.cut?cut:1),!(inside&&m.userData.cut));
    for(const m of this.wireMaterials)set(m,this.wiresSee,true);
    for(const m of this.shroud)set(m,cut,!inside);
    for(const {group,materials} of this.unitCuts){const f=group.userData.fade??1;for(const m of materials)set(m,f*cut,!inside);}
    this.rig.plug.userData.fade=this.plugSee;
    for(const w of this.rig.wires)w.mesh.userData.fade=this.wiresSee;
    this.plugDepth.opacity=this.plugSee;this.wiresDepth.opacity=this.wiresSee;
    const key=this.plugSee.toFixed(3)+this.wiresSee.toFixed(3);if(key!==this.shadowSee){this.shadowSee=key;this.renderer.shadowMap.needsUpdate=true;}
  }
  private hideFaded(){const hidden:T.Object3D[]=[];this.rig.root.traverse(o=>{const f=o.userData.fade;if(o.visible&&f!==undefined&&f<.98){o.visible=false;hidden.push(o);}});return hidden;}
  // A new setup moves the header only once the plug is off it: while a passed plug sits seated the engine first lifts
  // it out and home, and the header follows when the engine is ready again.
  configure(config:Configuration){
    this.config=config;
    if(!this.process&&(this.state?.released||this.regripping||this.state?.phase==='reset')){this.deferredSetup=true;this.wake();return;}
    this.deferredSetup=false;
    if(!this.process){this.ensureVariant(config.variant==='eight'?8:6);this.rig.header.position.set(config.offsetX,config.offsetY,0);this.rig.header.rotation.z=config.yaw*Math.PI/180;}this.wake();
  }
  update(state:Snapshot,epoch:number,playing=false,_speed=1){
    this.state=state;this.playing=playing;if(!state.released)this.regripping=false;
    // The plug is out and home once the engine has left its reset (a queued run goes straight on to its approach).
    if(this.deferredSetup&&!state.released&&!this.regripping&&state.phase!=='reset'&&state.phase!=='complete')this.configure(this.config);
    if(!this.process){this.poses.push(state.pose,performance.now(),epoch);this.wake();}
  }
  // Close the hand on a released plug before the engine moves it; returns the milliseconds that takes.
  regrip(){this.regripping=true;this.wake();return this.process?0:Math.ceil(this.letGo*REGRIP_MS);}
  setProcess(f:ProcessFrame|null){
    this.process=f;
    // Under the loader every part is shown for the shader warm-up; the frame is applied once it is done.
    if(this.warming)return;
    if(f){this.ensureVariant(6);this.rig.header.position.set(HEADER[0],HEADER[1],0);this.rig.header.rotation.z=0;this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=0;}
    else{applyLine(this.rig,REST_LINE);this.fadeHarness(0);poseLatch(this.rig.latch,0);posePlunger(this.rig.tool.plunger,0);this.lineKey='';this.configure(this.config);}
    if(f){
      this.applyProcess(f);
      const want=this.shotFor(f),changed=!this.scrubbing&&want!==this.band,nextUnit=this.lastProgress-f.progress>50;if(changed)this.band=want;this.lastProgress=f.progress;
      // A camera the person left alone for 8 s goes back to the guided shots at the next shot change or unit.
      if((changed||nextUnit)&&this.free&&!this.gesture&&performance.now()-this.lastInput>8000)this.guided();
      else if(this.viewMode==='connector'||this.mode==='parts'||changed&&this.viewMode==='overview')this.goal();
    }else if(this.state)this.poses.push(this.state.pose,performance.now(),Date.now());
    this.wake();
  }
  private applyProcess(f:ProcessFrame){
    this.rig.tool.root.position.set(...f.tool);this.rig.plug.position.set(...f.plug);this.rig.plug.rotation.y=f.rotation;this.rig.rotator.rotation.y=f.cradle;
    this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);
    this.rig.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);poseLatch(this.rig.latch,f.latch);posePlunger(this.rig.tool.plunger,f.latch);
    this.lineKey=applyLine(this.rig,{...REST_LINE,...(f as Partial<LineFrame>)} as LineFrame&{progress:number});this.fadeHarness((f as {harnessOut?:number}).harnessOut??0);
    this.rig.indicator.color.setHex(f.accepted===true?0x379761:f.accepted===false?0xb2402c:0x273c31);
    this.rig.indicator.emissive.setHex(f.accepted===true?0x248440:f.accepted===false?0xa0301c:0x000000);this.rig.indicator.emissiveIntensity=f.accepted===null?0:.9;
    this.lights(f.headerCheck,f.graspCheck,f.camera,f.plug[2]-(Math.abs(f.rotation)<.5?4.05:8.25));
  }
  // The two ring lights: cool white while each camera measures, a dark diffuser otherwise.
  private lights(board:number,grip:number,armed:boolean,plugUnderside=UPCAM[2]+30){
    const level=(v:number)=>Math.max(0,Math.min(1,v||0));
    this.rig.wristLight.emissiveIntensity=1.5*level(board);this.rig.upcamLight.emissiveIntensity=1.5*level(grip);
    this.rig.wristStatus.emissiveIntensity=armed?1.2:0;
    this.glow.cone.visible=level(grip)>0;this.glow.coneMaterial.opacity=.04*level(grip);
    // The cone stops at the plug's underside, so it never draws over the plug or the fingers.
    const h=Math.max(4,Math.min(40,plugUnderside-UPCAM[2]-.3));this.glow.cone.scale.set(1,h,1);this.glow.cone.position.z=UPCAM[2]+h/2;
    this.glow.pool.visible=level(board)>0;this.glow.pool.position.z=9.76+this.rig.fixture.position.z;this.glow.poolMaterial.opacity=.32*level(board);
    this.glow.root.visible=this.glow.cone.visible||this.glow.pool.visible;
  }
  private poseRig(){
    const tool=this.rig.tool.root,plug=this.rig.plug,flange=tool.position.clone().add(new T.Vector3(0,0,80)).divideScalar(5);
    const key=[...tool.position.toArray(),...plug.position.toArray(),plug.rotation.y,plug.rotation.z,tool.rotation.z,this.spread,this.rig.latch.rotation.x,...this.rig.tool.fingers.map(g=>g.position.x),...this.rig.cradleJaws.map(g=>g.position.y),this.rig.rotator.rotation.y].map(v=>v.toFixed(4)).join()+this.lineKey;
    if(key===this.renderedPose)return;this.renderedPose=key;
    const cableEnd=this.rig.tool.gland.clone().applyAxisAngle(new T.Vector3(0,0,1),tool.rotation.z).add(tool.position).add(new T.Vector3(3,0,0)).divideScalar(5);
    this.rig.arm.set(flange,tool.rotation.z,cableEnd);
    // The wires are dressed in the pallet's frame, so the index carries them along without dressing them again.
    const shown=this.rig.plug.visible&&this.wiresSee>.01;
    if(shown)this.dressed=dressLiveHarness(this.rig,this.dressed);
    for(const w of this.rig.wires)w.mesh.visible=shown;
    this.renderer.shadowMap.needsUpdate=true;
  }
  setMode(mode:Mode){this.mode=mode;this.goal();}
  setInspect(on:boolean){this.setMode(on?'inside':'machine');}
  view(mode:View|'cell'|'close'){this.viewMode=mode==='cell'?'overview':mode==='close'?'connector':mode;this.director=false;this.release();this.goal();}
  focusPart(id:PartId){this.focus=id;this.viewMode='part';this.release();this.goal();}
  direct(on:boolean){this.director=on;this.hud?.onDirector?.(on);if(on){this.viewMode='connector';this.release();this.goal();}}
  hold(_on:boolean){}
  offline(){this.playing=false;this.wake();}
  // The guided camera's goal for the current view, mode and shot. Followed views (the close-up, Parts) are asked
  // again every frame; a person's free camera only takes the close-up's follow from it.
  private goal(){
    const f=this.process,close=this.viewMode==='connector',parts=this.mode==='parts';
    const shot:Shot=parts||this.viewMode!=='overview'?'work':this.band;this.goalShot=this.viewMode==='overview'&&!parts?shot:'close';
    const portrait=this.width<this.height,fit=Math.max(1,1.12/(this.width/this.height));
    const look=new T.Vector3();let def:ShotDef|null=null;
    this.shift.set(0,0);
    if(close){
      this.lens=100;const lensScale=this.lensScale(100);
      // The close-up follows the cycle's focus: the plug, and during the index the next unit's housing coming in.
      // While the robot posts a reject it follows the plug itself, up over the bin and down into it.
      const at=this.closeAt(f),post=this.posting(f);
      let z=Math.max(29,at[2]+15);
      // Over the grip camera the shot drops to frame the plug and the camera under it together.
      if(f){const w=T.MathUtils.smoothstep(30-Math.hypot(at[0]-UPCAM[0],at[1]-UPCAM[1]),4,26);z+=(Math.max(UPCAM[2]+8,(at[2]+UPCAM[2])/2+2)-z)*w;}
      // While the wrist camera reads the board the focus moves up to the camera; the shot widens a little to show
      // its lit ring and the header under it together.
      const board=this.boardWeight();
      this.target.set(at[0],at[1],z+(at[2]-z)*board+(parts?55:0));
      // Over the turnover the cradle's actuator stands between the usual view and the housing, so the shot rises
      // to look down past it, and comes back down for the grip check.
      const p=f?.progress??0,turn=T.MathUtils.smoothstep(p,CLOSE.from-CLOSE.ramp,CLOSE.from)*(1-T.MathUtils.smoothstep(p,CLOSE.to,CLOSE.to+CLOSE.ramp));
      const dir=new T.Vector3(...CLOSE.dir).normalize().lerp(new T.Vector3(...CLOSE.turn).normalize(),turn).normalize();
      this.position.copy(this.target).addScaledVector(dir,CLOSE.dist*fit*lensScale*(1+CLOSE.board*board));
      // On a phone the slider and dock take the bottom of the frame: the subject sits higher.
      if(portrait)this.shift.y=.09;
      // Carried along: the camera moves with the plug as it is carried, rigidly, so a fast lift never runs it out of
      // the frame; the spring only settles the framing.
      if(post&&this.carried&&!this.free)this.carry.add(this.target).sub(this.carried);
      if(post)(this.carried??=new T.Vector3()).copy(this.target);else this.carried=null;
    }else if(this.viewMode==='part'){
      const v=PART_VIEW[this.focus]??PART_VIEW.socket;this.lens=v.lens;
      const bounds=new T.Box3().setFromObject(this.partGroups()[this.focus]),sphere=bounds.getBoundingSphere(new T.Sphere());this.target.copy(sphere.center);
      const tanV=this.camera.getFilmHeight()/2/this.lens,tanH=this.camera.getFilmWidth()/2/this.lens,half=Math.atan(Math.min(tanV,tanH));
      const d=Math.max(160,sphere.radius*v.fill/Math.sin(half));
      this.position.copy(this.target).addScaledVector(new T.Vector3(...v.dir).normalize(),d);
    }else{
      def=parts?SHOTS.parts:shot==='wide'?SHOTS.wide:shot==='line'?SHOTS.line:shot==='reject'?SHOTS.reject:shot==='pack'?SHOTS.pack:SHOTS.work;
      const t=portrait&&def.pt?def.pt:def.t,dir=this.viewMode==='top'?[0,-.02,1]:this.viewMode==='side'?[.7,-1,.13]:portrait&&def.pdir?def.pdir:def.dir;
      this.lens=portrait&&def.plens?def.plens:def.lens;
      this.target.set(t[0],t[1],t[2]);
      // Parts follows the plug across the bench, so a held reject's harness is in the middle of it too.
      if(parts&&f){this.target.x+=(f.plug[0]-HEADER[0])*.6;this.target.y+=(f.plug[1]-HEADER[1])*.5;}
      const d=def.dist*(portrait?def.pdist??1:!portrait&&this.height<=500?def.ldist??1:1)*fit**.5*Math.max(1,this.width/this.height/1.6)**(portrait?0:def.wide??0);
      const lk=portrait&&def.plook?def.plook:def.look;
      if(lk){look.set(lk[0],lk[1],lk[2]);this.position.copy(look).addScaledVector(new T.Vector3(...dir).normalize(),d);}
      else this.position.copy(this.target).addScaledVector(new T.Vector3(...dir).normalize(),d);
    }
    // The opening photo looks at a point above the bench but turns about the bench: a lens shift keeps the photo.
    if(def&&(portrait&&def.plook||!portrait&&def.look))this.shift.copy(lensShift(this.position,this.target,look,this.camera.getFilmWidth(),this.camera.getFilmHeight(),this.lens));
    if(def?.lsx&&!portrait&&this.height<=500)this.shift.x+=def.lsx;
    if(this.free){
      if(close){const d=this.target.clone().sub(this.followed);this.camera.position.add(d);this.controls.target.add(d);}
      this.followed.copy(this.target);this.wake();return;
    }
    this.followed.copy(this.target);this.cameraMoving=true;this.wake();
  }
  private carry=new T.Vector3();private carried:T.Vector3|null=null;
  private posting(f:ProcessFrame|null){return ((f as {post?:number}|null)?.post??-1)>=0;}
  private closeAt(f:ProcessFrame|null):[number,number,number]{return f?this.posting(f)?[f.plug[0],f.plug[1],f.plug[2]]:f.focus??f.plug:[0,0,15];}
  private lensScale(lens:number){return Math.tan(25*Math.PI/360)/(this.camera.getFilmHeight()/2/lens);}
  // Put the camera on its goal at once (the first frame, a hand-framed shot, reduced motion).
  private goalShot:Shot|'close'='wide';private settledShot='';
  private settle(shot:Shot|'close'|'free'){if(shot!==this.settledShot){this.settledShot=shot;this.hud?.onSettle?.(shot);}}
  private snap(){
    if(!this.free)this.settle(this.goalShot);
    this.shownLens=this.lens;this.camera.setFocalLength(this.lens);this.shown.copy(this.shift);this.applyOffset();
    this.camPos.copy(this.position);this.camTgt.copy(this.target);this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.camera.lookAt(this.target);
    this.velP.set(0,0,0);this.velT.set(0,0,0);this.lensVel=0;this.shiftVel.set(0,0);this.cameraMoving=false;
  }
  // Wide screens shift the frame left of the readout; it eases in over 900..1150 px instead of jumping at 1000.
  private applyOffset(){
    const w=this.width,h=this.height,side=this.embed?0:-.075*T.MathUtils.smoothstep(w,900,1150);
    this.camera.setViewOffset(w,h,w*(side+this.shown.x),h*(.01+this.shown.y),w,h);
  }
  layout=()=>{
    const r=this.container.getBoundingClientRect();if(!r.width||!r.height)return;
    this.width=r.width;this.height=r.height;this.camera.aspect=r.width/r.height;this.camera.filmGauge=36;
    this.renderer.setSize(r.width,r.height);this.composer.setSize(r.width,r.height);this.applyOffset();
    // A person's own camera stays where they put it; only the frame's shape changes.
    if(this.free){this.camera.updateProjectionMatrix();this.wake();}else this.goal();
  };
  private applyTier(i:number){
    this.quality=i;this.tier=this.tiers[i];const ratio=Math.min(devicePixelRatio,this.tier.ratio);
    this.renderer.setPixelRatio(ratio);this.composer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height);this.composer.setSize(this.width,this.height);
  }
  // Under the loader: compile every shader variant the session can need, then benchmark the worst frame once and
  // keep that tier. The orb keeps animating between steps (compileAsync and one frame per step).
  private async warmUp(){
    const r=this.renderer,next=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    await next();
    const hidden:T.Object3D[]=[],fading=new Map<T.Material,boolean>();
    this.scene.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}const m=(o as T.Mesh).material;if(m)for(const x of [m].flat())if(x.userData.canFade)fading.set(x,x.transparent);});
    const ao=this.ao.enabled,bokeh=this.bokeh.enabled;
    const render=(withAO:boolean,withBokeh:boolean)=>{this.ao.enabled=withAO;this.bokeh.enabled=withBokeh;r.shadowMap.needsUpdate=true;this.composer.render();};
    // A few meshes at a time, with a frame between, so no single step holds the loader's animation for long; each
    // batch is also drawn unculled into a one-pixel target so its buffers and textures go up now, not mid-play.
    const tiny=new T.WebGLRenderTarget(1,1),meshes:T.Mesh[]=[];this.scene.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
    const whole=async(draw:()=>void)=>{const culled=meshes.filter(m=>m.frustumCulled);for(const m of culled)m.frustumCulled=false;try{draw();}finally{for(const m of culled)m.frustumCulled=true;}};
    const compile=async(list:T.Mesh[])=>{
      for(let i=0;i<list.length;i+=8){
        const batch=new Set(list.slice(i,i+8)),culled:T.Object3D[]=[];
        for(const m of meshes){m.visible=batch.has(m);if(m.visible&&m.frustumCulled){m.frustumCulled=false;culled.push(m);}}
        // compiled for a render target, as the composer draws (no tone mapping, linear output); the first draw
        // also creates the shadow map, so no shader samples a missing one
        r.setRenderTarget(tiny);await r.compileAsync(this.scene,this.camera);
        // every batch also goes through the shadow pass, so each caster's shadow draw is set up now as well
        r.setRenderTarget(tiny);r.shadowMap.needsUpdate=true;r.render(this.scene,this.camera);r.setRenderTarget(null);
        for(const m of culled)m.frustumCulled=true;await next();
      }
      for(const m of meshes)m.visible=true;
    };
    try{
      // The first frames also link the post passes and the shadow pass and allocate their targets: one per frame.
      // The full frames draw every mesh, unculled, through every pass (shadow, AO, defocus depth): a part first seen
      // later (a tote coming in from the store, the transfer, the full slots) then has nothing left to set up.
      await compile(meshes);await whole(()=>{render(false,false);});await next();await whole(()=>render(true,false));await next();await whole(()=>render(true,!this.light));await next();
      for(const m of fading.keys()){m.transparent=!fading.get(m);m.needsUpdate=true;}
      await compile(meshes.filter(m=>[m.material].flat().some(x=>fading.has(x))));await whole(()=>render(true,!this.light));await next();render(false,false);await next();
    }finally{
      for(const [m,was] of fading){m.transparent=was;m.needsUpdate=true;}
      for(const o of hidden)o.visible=false;this.ao.enabled=ao;this.bokeh.enabled=bokeh;
    }
    tiny.dispose();render(true,!this.light);render(false,false);await next();
    this.warmPrograms=r.info.programs?.length??0;
    const forced=Number(new URLSearchParams(location.search).get('tier'));
    if(Number.isInteger(forced)&&forced>=0&&forced<this.tiers.length&&new URLSearchParams(location.search).has('tier'))this.applyTier(forced);
    else await this.benchmark();
    this.warmPrograms=r.info.programs?.length??0;
    this.warming=false;this.renderedPose='';const f=this.process;if(f)this.setProcess(f);this.snap();
    const start=this.rendered;while(this.rendered<start+3&&!this.disposed){this.wake();await next();if(document.hidden)break;}
  }
  private async benchmark(){
    const r=this.renderer,gl=r.getContext(),pixel=new Uint8Array(4),next=()=>new Promise<number>(resolve=>requestAnimationFrame(resolve));
    const view=this.viewMode;this.viewMode='connector';this.goal();this.snap();this.camera.updateMatrixWorld();
    // Each worst frame is drawn and waited for (a one-pixel read), one per animation frame so the loader keeps moving:
    // its CPU and GPU time together, with no overlap, so the budget allows for the overlap a playing frame gets.
    const measure=async(frames:number)=>{
      const ms:number[]=[];
      for(let i=0;i<frames;i++){await next();const t=performance.now();this.ao.enabled=this.tier.ao;this.bokeh.enabled=this.tier.bokeh;r.shadowMap.needsUpdate=true;this.composer.render();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=4)ms.push(performance.now()-t);}
      ms.sort((a,b)=>a-b);return ms[Math.floor(ms.length/2)];
    };
    const times:number[]=[];
    for(let i=0;i<this.tiers.length;i++){this.applyTier(i);const t=await measure(i?24:40);times.push(+t.toFixed(1));if(t<=BUDGET||i===this.tiers.length-1)break;}
    this.benchmarkMs=times;this.viewMode=view;this.goal();
  }
  benchmarkMs:number[]=[];
  wake=()=>{if(!this.frame&&!this.disposed&&!document.hidden&&this.visible&&!this.warming)this.frame=requestAnimationFrame(this.animate);};
  private animate=(now:number)=>{
    this.frame=0;if(this.disposed||document.hidden||!this.visible||this.warming)return;
    // After an idle stretch (the loop sleeps when nothing moves) the first frame counts as one frame, not the gap.
    const gap=now-(this.last||now-16),dt=gap>100?1000/60:Math.min(50,gap);this.last=now;
    if(!this.process){const pose=this.poses.sample(now);if(pose)this.basePose=[pose[0]*1000,pose[1]*1000,pose[2]*1000,pose[3]];
      this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=this.basePose[3];this.rig.plug.rotation.y=0;
      const away=this.state?.released&&!this.regripping?1:0;this.letGo=away>this.letGo?Math.min(1,this.letGo+dt/REGRIP_MS):Math.max(0,this.letGo-dt/REGRIP_MS);
      const open=T.MathUtils.smootherstep(this.letGo,0,.35);this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*7*open);
      this.rig.indicator.emissive.setHex(0);this.rig.indicator.color.setHex(this.state?.accepted===true?0x379761:0x273c31);this.lights(0,0,false);}
    const targetSpread=this.mode==='parts'?1:0,oldSpread=this.spread;this.spread+=(targetSpread-this.spread)*damping(dt,190);if(Math.abs(targetSpread-this.spread)<.001)this.spread=targetSpread;
    // Inside thins the housings over a third of a second instead of in one frame.
    const cutGoal=this.mode==='inside'?.32:1,oldCut=this.cut;this.cut+=(cutGoal-this.cut)*damping(dt,110);if(Math.abs(cutGoal-this.cut)<.002)this.cut=cutGoal;
    // Pulled apart, the live wires fade out over the first part of the spread (they follow the plug up meanwhile)
    // and back in over the last part of the return.
    this.plugSee=this.harnessSee;this.wiresSee=this.harnessSee*spreadSee(this.spread);
    this.rig.header.position.z=this.spread*SPREAD.header;this.rig.fixture.position.z=this.spread*SPREAD.fixture;this.rig.tester.position.x=this.spread*SPREAD.tester;
    if(this.process)this.applyProcess(this.process);else{this.rig.plug.position.set(this.basePose[0],this.basePose[1],this.basePose[2]);this.rig.tool.root.position.copy(this.rig.plug.position);this.rig.tool.root.position.z+=GRIP_RAISE+LET_GO_LIFT*T.MathUtils.smootherstep(this.letGo,.4,1);}
    // Exploded, the tool lifts clear and an unheld plug rises halfway; a plug in the closed fingers stays in them.
    const held=this.process?1-this.process.jaw:this.letGo>0?0:1;
    this.rig.tool.root.position.z+=this.spread*SPREAD.tool;this.rig.plug.position.z+=this.spread*(SPREAD.plug+(SPREAD.tool-SPREAD.plug)*held);
    this.seeThrough();this.poseRig();
    if(!this.free){
      if(this.cameraMoving)this.glide(dt/1000);
      // The guided camera owns the view: drop whatever a click or the first pixels of a drag fed the controls.
      this.stopOrbit();this.camera.position.copy(this.camPos);this.controls.target.copy(this.camTgt);this.camera.lookAt(this.camTgt);
    }
    const orbit=this.free?this.controls.update():false,uniforms=this.bokeh.uniforms as Record<string,{value:number}>;
    const f=this.process,close=this.viewMode==='connector';
    this.focalPoint.copy(this.viewMode==='part'?this.controls.target:this.rig.plug.position);
    if(close&&f?.focus)this.focalPoint.set(...this.closeAt(f));
    if(this.viewMode!=='part'){
      const plug=this.focalPoint.clone(),header=this.rig.header.getWorldPosition(this.headerAt);
      const overHeader=Math.hypot(plug.x-header.x,plug.y-header.y)<5&&Math.abs(this.rig.plug.rotation.y)<.01;
      this.focalPoint.y-=overHeader?5.25:3.6;
      this.focalPoint.z=overHeader?Math.max(18,plug.z-4):plug.z+2;
      // Checking the board, the sharp plane is the header the wrist camera is reading.
      if(close)this.focalPoint.lerp(this.headerAt.set(header.x,header.y,14),this.boardWeight());
    }
    this.focalPoint.applyMatrix4(this.camera.matrixWorldInverse);
    const focus=Math.max(101,-this.focalPoint.z);uniforms.focus.value=focus;
    // Deep focus on the wide shots, like the photo; f/8 on the close-ups, deep enough that the whole subject is sharp.
    const blur=this.tier.bokeh&&this.mode==='machine'&&(this.viewMode==='connector'||this.viewMode==='part')?1:0;
    this.blur+=(blur-this.blur)*damping(dt,260);if(Math.abs(blur-this.blur)<.01)this.blur=blur;
    const lens=this.camera.getFocalLength();uniforms.aperture.value=this.blur*lens*lens/(8*Math.max(1,focus-lens)*this.camera.getFilmWidth()*.8);
    this.bokeh.enabled=this.blur>0;this.ao.enabled=this.tier.ao&&this.mode!=='inside';
    this.placeLabels();
    this.composer.render();this.rendered++;this.afterRender?.();
    if(this.playing&&!this.process||this.cameraMoving||orbit||oldSpread!==this.spread||oldCut!==this.cut||this.blur>0&&this.blur<1||this.poses.pending(now)&&!this.process||!this.process&&this.letGo!==(this.state?.released&&!this.regripping?1:0)||this.afterRender)this.wake();
  };
  // A critically damped spring on the camera, its target, lens and shift: every move eases in and out, keeps its
  // speed when the goal changes under it, and ends below 0.02 mm, so the last frame is no visible step.
  private glide(seconds:number){
    // The close-up follows a moving plug closely; a long move into it (from the whole bench) starts slower.
    const far=T.MathUtils.smoothstep(this.camPos.distanceTo(this.position),60,500);
    const k=this.reduceMotion?400:this.viewMode==='connector'?7-3.6*far:this.viewMode==='part'?4.2:3;
    const step=(v:T.Vector3,vel:T.Vector3,goal:T.Vector3)=>{for(const a of ['x','y','z'] as const){const s=settleSpring(v[a],vel[a],goal[a],seconds,k);v[a]=s.position;vel[a]=s.velocity;}};
    this.camPos.add(this.carry);this.camTgt.add(this.carry);this.carry.set(0,0,0);
    step(this.camPos,this.velP,this.position);step(this.camTgt,this.velT,this.target);
    const l=settleSpring(this.shownLens,this.lensVel,this.lens,seconds,k);this.shownLens=l.position;this.lensVel=l.velocity;this.camera.setFocalLength(this.shownLens);
    for(const a of ['x','y'] as const){const s=settleSpring(this.shown[a],this.shiftVel[a],this.shift[a],seconds,k);this.shown[a]=s.position;this.shiftVel[a]=s.velocity;}
    this.applyOffset();
    // Arrived to the eye (within a few millimetres and all but still; the spring's last fraction takes seconds): the
    // shot counts as reached, and only then does the headline come back.
    if(this.camPos.distanceTo(this.position)<6&&this.camTgt.distanceTo(this.target)<3&&this.velP.length()<15&&Math.abs(this.shownLens-this.lens)<.2)this.settle(this.goalShot);
    const done=this.camPos.distanceTo(this.position)<.02&&this.velP.length()<.05&&this.camTgt.distanceTo(this.target)<.02&&this.velT.length()<.05
      &&Math.abs(this.shownLens-this.lens)<.002&&Math.abs(this.lensVel)<.01&&this.shown.distanceTo(this.shift)<1e-5;
    if(done)this.snap();
  }
  // Part labels at each part's centre; on a crowded screen (a phone) they step down a column with a leader line.
  private placeLabels(){
    const groups=this.partGroups(),shown=this.mode==='parts',spots:{label:HTMLElement;x:number;y:number;id:PartId}[]=[];
    for(const [id,label] of this.labels){label.hidden=!shown;if(!shown)continue;
      const p=new T.Box3().setFromObject(groups[id]).getCenter(new T.Vector3()).project(this.camera);
      // the tester's label sits above it, clear of the socket's
      spots.push({label,id,x:(p.x*.5+.5)*this.width,y:(-p.y*.5+.5)*this.height-(id==='tester'?34:0)});}
    if(!shown)return;
    spots.sort((a,b)=>a.y-b.y);const placed:{x:number;y:number;w:number}[]=[];
    for(const s of spots){
      const w=s.label.offsetWidth||80,h=(s.label.offsetHeight||28)+6;let y=s.y;
      for(const q of placed)if(Math.abs(q.x-s.x)<Math.max(q.w,w)&&y<q.y+h)y=q.y+h;
      placed.push({x:s.x,y,w});const lead=Math.round(y-s.y);
      s.label.style.transform=`translate(${s.x}px,${y}px)`;s.label.style.setProperty('--lead',`${lead}px`);s.label.classList.toggle('led',lead>2);
    }
  }
  dispose(){const c=this.renderer.domElement;this.disposed=true;cancelAnimationFrame(this.frame);clearTimeout(this.hoverTimer);clearTimeout(this.idleTimer);this.plugDepth.dispose();this.wiresDepth.dispose();this.ro.disconnect();this.io.disconnect();this.controls.dispose();disposeCell(this.rig.root);this.scene.environment?.dispose();this.composer.dispose();this.ao.dispose();this.bokeh.dispose();this.renderer.dispose();document.removeEventListener('visibilitychange',this.wake);this.container.removeEventListener('wheel',this.wheel,{capture:true});c.removeEventListener('pointerdown',this.pointerDown,{capture:true});c.remove();this.labels.forEach(l=>l.remove());}
}

// The overview shots (dev: tune them live through window.SHOTS). t: the point the camera turns about; look: where
// it points, when that differs (a lens shift keeps the composition); p*: the portrait versions.
// lsx, ldist: on a phone held sideways, a lens shift (a fraction of the width) that keeps the subject clear of the
// readouts down the left side, and a longer stand-off for the short frame. wide: how much further a frame wider than
// 16:10 stands off (an exponent of the excess), for a shot whose subject is tall.
interface ShotDef {t:number[];dir:number[];dist:number;lens:number;look?:number[];pt?:number[];pdir?:number[];pdist?:number;plens?:number;plook?:number[];lsx?:number;ldist?:number;wide?:number}
const REJECT_FIT=5.2,TOTE_FOAM=0x55595a,PACK_FROM=1;
const SHOTS:Record<'wide'|'work'|'line'|'reject'|'parts'|'pack',ShotDef>={
  // The home page's photo: low and side on, the arm's base on the right, the hall behind; it turns about the bench.
  wide:{t:[-30,40,60],look:[-30,40,190],dir:[1,-.22,.035],dist:1280,lens:35,pt:[-30,20,80],plook:[-30,20,260],pdist:.68},
  // The work: the picker's post and beam, the totes and unload station on the left, the work pallet and the queue on
  // the right, from the front.
  work:{t:[-95,-5,95],dir:[.32,-1,.86],dist:1620,lens:50,pt:[20,-10,30],pdir:[.4,-1,1.1],pdist:.55,plens:35},
  // A full tote swapped at the bench end: beds F and E, the lane out to the store, and the picker head over the new
  // tote up to its placing the next board in a slot, the board's lift to the picker's travel height included (the shot
  // holds until the jaws open).
  line:{t:[-380,-150,300],dir:[.15,-1,.7],dist:1950,lens:50,pt:[-390,-160,240],pdir:[.2,-1,.8],pdist:.6,plens:35,wide:1,ldist:1.12},
  // The held reject and its post: the tray, the locked bin and the arm's carry up and over to it, whole.
  reject:rejectShot(),
  // The work while a unit is packed: the same side, a little further back and higher, so the board lifted to the
  // picker's travel height (about z 650) and the tote stay in frame; the robot's work stays where it was.
  pack:{t:[-165,-30,300],dir:[.32,-1,.64],dist:2080,lens:50,pt:[-170,-60,260],pdir:[.4,-1,.7],pdist:.58,plens:35,ldist:1.08,lsx:-.06,wide:1},
  // Parts: the cell pulled apart round the plug.
  parts:{t:[0,40,210],dir:[.8,-1,.45],dist:900,lens:35,pdist:.8},
};
// The reject shot is fitted to the post's own extents (the tray, the bin and the height the tool carries the harness
// at), so it follows the process's numbers: a box round them, seen from the front and a little above, low enough to
// read the height of the carry; on a phone held sideways the box sits right of the readouts.
function rejectShot():ShotDef{
  const P=Process as unknown as {REJECT:readonly number[];REJECT_BIN?:{x:number;y:number};POST_Z?:number};
  const tray=P.REJECT,bin=P.REJECT_BIN??{x:-235,y:-230},top=(P.POST_Z??200)+130;
  const lo=[Math.min(tray[0],bin.x)-45,Math.min(tray[1],bin.y)-40,0],hi=[Math.max(tray[0],bin.x)+45,Math.max(tray[1],bin.y)+40,top];
  const c=lo.map((v,i)=>(v+hi[i])/2),r=Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2;
  return {t:c,dir:[.5,-1,.6],dist:r*REJECT_FIT,lens:50,pt:c,pdir:[.5,-1,.7],pdist:.55,plens:35,lsx:-.12,ldist:1.12,wide:1};
}
// The close-up: its usual side, the higher side it rises to over the turnover (the cradle's actuator would hide the
// housing), and how far it stands off.
const CLOSE={dir:[100,-175,60],turn:[120,-130,170],from:22,to:33,ramp:3,dist:Math.hypot(100,-175,60),board:.6};
// Picked parts: from where, with which lens, and how much of the frame they fill (the arm on a normal lens).
const PART_VIEW:Partial<Record<PartId,{dir:number[];lens:number;fill:number}>>&{socket:{dir:number[];lens:number;fill:number}}={
  arm:{dir:[.55,-1,.3],lens:50,fill:1.05},socket:{dir:[.4,-.85,.55],lens:100,fill:2.3},tester:{dir:[.9,-.3,.55],lens:100,fill:1.2},
};
// How far Parts pulls the cell apart, in mm: the header up, the fixture, the tester sideways, the tool and the plug up.
const SPREAD={header:36,fixture:10,tester:140,tool:190,plug:100};
if(import.meta.env.DEV)Object.assign(globalThis,{SHOTS,CLOSE,PART_VIEW,SPREAD});
// The key light's shadow covers the bench, the line, the tote and bin and their shadows on the floor, no more: up to
// the top of the picker's post (1015 mm; its head and the lifted board stay below it), and along the tote lane as far
// as the line shot sees (a full tote keeps its shadow until it leaves the frame), so no shadow is clipped.
const SHADOW_TOP=1040,SHADOW_LEFT=-780;
function fitShadow(key:T.DirectionalLight){
  const c=key.shadow.camera;c.position.copy(key.position);c.lookAt(key.target.position);c.updateMatrixWorld();
  const inv=c.matrixWorldInverse,b=new T.Box3();
  for(const x of [SHADOW_LEFT,560])for(const y of [-340,400])for(const z of [FLOOR,SHADOW_TOP])b.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(inv));
  Object.assign(c,{left:b.min.x-20,right:b.max.x+20,bottom:b.min.y-20,top:b.max.y+20,near:Math.max(1,-b.max.z-50),far:-b.min.z+50});c.updateProjectionMatrix();
}
// Opening the fingers on a seated plug and lifting 60 mm clear takes 0.9 s, and closing on it again the same.
const REGRIP_MS=900,LET_GO_LIFT=60;
function fade(size:number,value:(u:number,v:number)=>number){
  const data=new Uint8Array(size*size*4);
  for(let j=0;j<size;j++)for(let i=0;i<size;i++){const k=(j*size+i)*4;data[k]=data[k+1]=data[k+2]=Math.round(255*Math.max(0,Math.min(1,value((i+.5)/size,(j+.5)/size))));data[k+3]=255;}
  const t=new T.DataTexture(data,size,size);t.magFilter=t.minFilter=T.LinearFilter;t.needsUpdate=true;return t;
}
function createGlow(){
  const root=new T.Group();root.name='Ring light spill';root.visible=false;
  const additive={color:0xdff3ff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false};
  // Above the grip camera: a faint, short cone of cool light that dies out within 30 mm.
  const coneMaterial=new T.MeshBasicMaterial({...additive,side:T.DoubleSide,opacity:0,alphaMap:fade(16,(_u,v)=>(1-.8*v)**1.6)});
  const cone=new T.Mesh(new T.CylinderGeometry(10.5,7.6,1,48,1,true),coneMaterial);cone.name='Grip camera light cone';
  cone.rotation.x=Math.PI/2;cone.position.set(UPCAM[0],UPCAM[1],UPCAM[2]+15);cone.renderOrder=2;
  // On the board under the wrist camera: a soft pool, brightest over the header.
  const poolMaterial=new T.MeshBasicMaterial({...additive,opacity:0,polygonOffset:true,polygonOffsetFactor:-4,alphaMap:fade(64,(u,v)=>{const r=Math.hypot((u-.5)*58,(v-.5)*44);return Math.exp(-((r/16)**2));})});
  const pool=new T.Mesh(new T.PlaneGeometry(58,44),poolMaterial);pool.name='Wrist ring light pool';pool.position.set(0,0,9.76);pool.renderOrder=2;
  for(const o of [cone,pool]){o.visible=false;o.castShadow=o.receiveShadow=false;o.frustumCulled=true;root.add(o);}
  return {root,cone,coneMaterial,pool,poolMaterial};
}
