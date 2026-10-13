import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { applyLine, createCell, disposeCell, dressLiveHarness, factoryEnvironment, mergeStatic, poseLatch, posePlunger, REST_LINE } from './cell-geometry.ts';
import { createHall } from './hall.ts';
import { PoseStream, damping } from './motion.ts';
import { processFrame, HEADER, REJECT, UPCAM } from './process.ts';
import type { ProcessFrame } from './process.ts';
import type { Configuration } from './model.ts';
import type { Snapshot } from './engine.ts';
import type { PartId } from './parts.ts';
import { PARTS } from './parts.ts';
import { batchStaticMeshes } from './batching.ts';
import { GRIP_RAISE } from './line.ts';
import type { LineFrame, Shot } from './line.ts';

export type View='overview'|'side'|'top'|'connector'|'part';
export type Mode='machine'|'inside'|'parts';
export interface Hud {labels:HTMLElement;tooltip:HTMLElement;onPick?:(id:PartId)=>void;onDirector?:(on:boolean)=>void}
export class WorkcellScene {
  renderer:T.WebGLRenderer;
  scene=new T.Scene(); camera=new T.PerspectiveCamera(25,1,30,150000);
  controls:OrbitControls; composer:EffectComposer; ao:GTAOPass; bokeh:BokehPass;
  rig=createCell(); hall=createHall(); config:Configuration;
  poses=new PoseStream(); state:Snapshot|null=null; playing=false; afterRender:(()=>void)|null=null;
  mode:Mode='machine'; viewMode:View='overview'; focus:PartId='socket';
  process:ProcessFrame|null=processFrame(0); director=false; disposed=false;
  private container:HTMLElement; private hud:Hud|null; private embed:boolean;
  private frame=0; private last=0; private width=1; private height=1;
  private cameraMoving=true; private spread=0; private cut=0; private renderedPose=''; private dressed=''; private lineKey='';
  private target=new T.Vector3();private position=new T.Vector3();private ro:ResizeObserver;private io:IntersectionObserver;private visible=true;
  // Phones and narrow screens get a lighter pipeline: fewer pixels, a smaller shadow map, no defocus.
  private light=matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  private labels=new Map<PartId,HTMLElement>();
  private basePose=[0,0,42,0];private band:Shot='wide';
  // Set once the viewer drags the camera; a played cycle then leaves it where they put it.
  private free=false;
  private lens=35;private shownLens=35;
  // A slow GPU (an old laptop, a projector at 4K) steps down: defocus off, then ambient occlusion and pixels.
  private quality=0;private slowFrames=0;private seenFrames=0;private seenTime=0;private born=performance.now();
  // Whether the frame now asked for follows straight on from the last one (see animate), and when that one began.
  private chained=false;private inFrame=false;private frameEnded=0;
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
  private ray=new T.Raycaster();private down=[0,0];
  private reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Additive cards that suggest each ring light's spill: no lights, no shadows, hidden from AO and defocus.
  private glow=createGlow();
  constructor(container:HTMLElement,config:Configuration,hud:Hud|null=null,embed=false){
    this.container=container;this.config=config;this.hud=hud;this.embed=embed;
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.light?1.5:1.75));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.NeutralToneMapping;this.renderer.toneMappingExposure=1;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');
    this.renderer.domElement.setAttribute('aria-label','Interactive rendered connector workcell in an empty factory hall. White six-joint arm, two-finger gripper, six-wire harness, green circuit board, fixture, tester and reject tray.');
    this.camera.up.set(0,0,1);this.scene.background=new T.Color(0xc4c5c5);this.scene.fog=new T.FogExp2(0xc4c5c5,.0000105);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    Object.assign(this.controls,{enableDamping:true,dampingFactor:.08,enablePan:false,minDistance:150,maxDistance:8000,minPolarAngle:.06,maxPolarAngle:Math.PI*.49,rotateSpeed:.45,zoomSpeed:.6});
    this.controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_ROTATE};if(embed)this.controls.enableZoom=false;
    this.renderer.domElement.style.touchAction='pan-y';
    this.controls.addEventListener('start',()=>{this.cameraMoving=false;this.director=false;this.free=true;});this.controls.addEventListener('change',this.wake);
    container.addEventListener('wheel',this.wheel,{capture:true,passive:true});
    this.renderer.domElement.addEventListener('pointerdown',this.pointerDown);this.renderer.domElement.addEventListener('pointerup',this.pointerUp);
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);
    const env=factoryEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);
    this.scene.environment=pmrem.fromScene(env,.02).texture;this.scene.environmentIntensity=.9;env.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();[o.material].flat().forEach(m=>m.dispose());}});this.scene.environmentRotation.x=Math.PI/2;pmrem.dispose();
    // Hall lighting falls almost straight down; a cooler light comes in from the windows behind.
    const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(-260,-420,1500);key.target.position.set(-40,0,60);key.castShadow=true;
    key.shadow.mapSize.setScalar(2048);Object.assign(key.shadow.camera,{left:-900,right:900,top:900,bottom:-900,near:300,far:2900});key.shadow.normalBias=.12;key.shadow.bias=-.0001;key.shadow.radius=8;
    this.scene.add(key,key.target);const fill=new T.HemisphereLight(0xf3f6f7,0x5d625f,.35);fill.position.set(0,0,1000);this.scene.add(fill);
    const windowLight=new T.DirectionalLight(0xeaf1f6,.7);windowLight.position.set(300,1400,700);this.scene.add(windowLight);
    this.scene.add(this.hall,this.rig.root,this.glow.root);
    this.batchRig();
    const groups:Record<PartId,T.Object3D>={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,g] of Object.entries(groups)){g.traverse(o=>o.userData.part=id);const label=document.createElement('div');label.className='cell-label';label.textContent=PARTS.find(p=>p.id===id)?.name??id;hud?.labels.append(label);this.labels.set(id as PartId,label);}
    this.composer=new EffectComposer(this.renderer,new T.WebGLRenderTarget(1,1,{samples:this.light?2:4,type:T.HalfFloatType}));
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.ao=new GTAOPass(this.scene,this.camera,1,1);this.ao.blendIntensity=.55;
    this.ao.updateGtaoMaterial({radius:10,distanceExponent:1.6,thickness:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:false});this.ao.updatePdMaterial({radius:3,rings:2,samples:8});this.composer.addPass(this.ao);
    this.bokeh=new BokehPass(this.scene,this.camera,{focus:1200,aperture:.000007,maxblur:.006});
    // Thin-lens defocus in scene millimetres, using the guideline's 100 mm f/2.8 lens.
    this.bokeh.materialBokeh.fragmentShader=this.bokeh.materialBokeh.fragmentShader.replace('float factor = ( focus + viewZ );','float factor = ( focus + viewZ ) / max( -viewZ, 1.0 );');
    this.composer.addPass(this.bokeh);this.composer.addPass(new OutputPass());
    for(const pass of [this.ao,this.bokeh]){const render=pass.render.bind(pass);pass.render=(...args)=>{const shown=this.glow.root.visible;this.glow.root.visible=false;render(...args);this.glow.root.visible=shown;};}
    this.configure(config);this.applyProcess(this.process!);
    this.ro=new ResizeObserver(this.layout);this.ro.observe(container);
    this.io=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;this.wake();});this.io.observe(container);document.addEventListener('visibilitychange',this.wake);
    if(import.meta.env.DEV)(window as unknown as {scene:WorkcellScene}).scene=this;
    this.layout();this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.controls.update();this.wake();
  }
  // dev only: frame a shot by hand from the console
  frameShot(target:number[],dir:number[],dist:number,lens:number){this.lens=this.shownLens=lens;this.camera.setFocalLength(lens);this.target.set(target[0],target[1],target[2]);this.position.copy(this.target).addScaledVector(new T.Vector3(dir[0],dir[1],dir[2]).normalize(),dist);this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.controls.update();this.cameraMoving=false;this.wake();}
  wheel=(e:WheelEvent)=>{if(!e.ctrlKey&&!e.metaKey)e.stopPropagation();};
  contextLost=(e:Event)=>{e.preventDefault();this.container.dispatchEvent(new CustomEvent('renderer-lost'));};
  pointerDown=(e:PointerEvent)=>{this.down=[e.clientX,e.clientY];};
  pointerUp=(e:PointerEvent)=>{
    if(Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;
    const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
    const hit=this.ray.intersectObject(this.rig.root,true).find(h=>h.object.userData.part);if(hit){this.focusPart(hit.object.userData.part);this.hud?.onPick?.(hit.object.userData.part);}
  };
  private ensureVariant(pins:number){
    if(this.rig.pins===pins)return;
    disposeCell(this.rig.root);this.scene.remove(this.rig.root);this.rig=createCell(pins);this.scene.add(this.rig.root);
    this.batchRig();
    const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,g] of Object.entries(groups))g.traverse(o=>o.userData.part=id);
    this.renderedPose=this.dressed=this.lineKey='';this.cut=-1;
  }
  // Static hardware merges by material; only the moving parts keep their own meshes.
  private batchRig(){
    const r=this.rig;
    for(const g of [r.bench,r.plate,r.fixture,r.nest,r.comb,r.adapter,r.bin,r.upcam,r.tool.root,r.plug])batchStaticMeshes(g,new Set());
    for(const g of [r.tote.shell,r.rejectBin,...Object.values(r.units).flatMap(u=>[u.hardware,u.board,u.harness])])mergeStatic(g);
    batchStaticMeshes(r.tester,new Set([r.dockHead]));
    // The live plug gets its own materials, so a cleared reject's harness can fade as it is taken to the bin.
    r.plug.traverse(o=>{if(o instanceof T.Mesh&&!o.userData.unique){o.material=(o.material as T.Material).clone();o.userData.unique=true;}});
    this.harnessOut=0;
  }
  private harnessOut=0;private wiresSee=1;
  private fadeHarness(out:number){
    if(Math.abs(out-this.harnessOut)<1e-4)return;this.harnessOut=out;
    // The wires are unplugged from the adapter and gathered first; the plug itself fades only as it drops into the bin.
    const set=(m:T.Material,see:number)=>{const fading=see<.998;if(m.transparent!==fading){m.transparent=fading;m.needsUpdate=true;}m.opacity=see;m.depthWrite=!fading;};
    const wires=1-T.MathUtils.smoothstep(out,0,.22),plug=1-T.MathUtils.smoothstep(out,.86,1),fading=out>.002;this.wiresSee=wires;
    for(const w of this.rig.wires){set(w.mesh.material as T.Material,wires);w.mesh.castShadow=wires>.5;}
    this.rig.plug.traverse(o=>{if(o instanceof T.Mesh){set(o.material as T.Material,plug);o.castShadow=plug>.5;}});
    // Put back the see-through housing if the inside view is on.
    if(!fading)this.cut=-1;
    this.renderer.shadowMap.needsUpdate=true;
  }
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
  setProcess(f:ProcessFrame|null){this.process=f;if(f){this.ensureVariant(6);this.rig.header.position.set(HEADER[0],HEADER[1],0);this.rig.header.rotation.z=0;this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=0;}else{applyLine(this.rig,REST_LINE);this.fadeHarness(0);poseLatch(this.rig.latch,0);posePlunger(this.rig.tool.plunger,0);this.lineKey='';this.configure(this.config);}if(f){this.applyProcess(f);const band=this.shot();if(!this.free&&(this.viewMode==='connector'||(this.viewMode==='overview'&&band!==this.band)))this.goal();this.band=band;}else if(this.state)this.poses.push(this.state.pose,performance.now(),Date.now());this.wake();}
  private applyProcess(f:ProcessFrame){
    this.rig.tool.root.position.set(...f.tool);this.rig.plug.position.set(...f.plug);this.rig.plug.rotation.y=f.rotation;this.rig.rotator.rotation.y=f.cradle;
    this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);
    this.rig.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);poseLatch(this.rig.latch,f.latch);posePlunger(this.rig.tool.plunger,f.latch);
    this.lineKey=applyLine(this.rig,{...REST_LINE,...(f as Partial<LineFrame>)} as LineFrame&{progress:number});this.fadeHarness(f.harnessOut??0);
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
    const cableEnd=this.rig.tool.gland.clone().applyAxisAngle(new T.Vector3(0,0,1),tool.rotation.z).add(tool.position).add(new T.Vector3(3,0,0)).divideScalar(5);
    this.rig.arm.set(flange,tool.rotation.z,cableEnd);
    const key=[...tool.position.toArray(),...plug.position.toArray(),plug.rotation.y,plug.rotation.z,tool.rotation.z,this.spread,this.rig.latch.rotation.x,...this.rig.tool.fingers.map(g=>g.position.x),...this.rig.cradleJaws.map(g=>g.position.y),this.rig.rotator.rotation.y].map(v=>v.toFixed(4)).join()+this.lineKey;
    if(key===this.renderedPose)return;this.renderedPose=key;
    // The wires are dressed in the pallet's frame, so the index carries them along without dressing them again.
    const shown=this.spread<.01&&this.rig.plug.visible&&this.wiresSee>.01;
    if(shown)this.dressed=dressLiveHarness(this.rig,this.dressed);
    for(const w of this.rig.wires)w.mesh.visible=shown;
    this.renderer.shadowMap.needsUpdate=true;
  }
  setMode(mode:Mode){this.mode=mode;this.wake();}
  setInspect(on:boolean){this.setMode(on?'inside':'machine');}
  view(mode:View|'cell'|'close'){this.viewMode=mode==='cell'?'overview':mode==='close'?'connector':mode;this.director=false;this.free=false;this.goal();}
  focusPart(id:PartId){this.focus=id;this.viewMode='part';this.free=false;this.goal();}
  direct(on:boolean){this.director=on;this.hud?.onDirector?.(on);if(on){this.viewMode='connector';this.free=false;this.goal();}}
  hold(_on:boolean){}
  offline(){this.playing=false;this.wake();}
  private goal(){
    const close=this.viewMode==='connector'||this.viewMode==='part';
    const shot=this.mode==='parts'||this.viewMode!=='overview'?'work':this.shot();
    this.lens=close?100:shot==='wide'||shot==='line'||this.mode==='parts'?35:50;
    this.camera.setFocalLength(this.lens);
    const fit=Math.max(1,1.12/(this.width/this.height));
    const lensScale=Math.tan(25*Math.PI/360)/Math.tan(this.camera.fov*Math.PI/360);this.camera.setFocalLength(this.shownLens);
    if(this.viewMode==='connector'){
      // The close-up follows the cycle's focus: the plug, and during the index the next unit's housing coming in.
      const f=this.process,at=f?.focus??f?.plug??[0,0,15];
      let z=Math.max(29,at[2]+15);
      // Over the grip camera the shot drops to frame the plug and the camera under it together.
      if(f){const w=T.MathUtils.smoothstep(30-Math.hypot(at[0]-UPCAM[0],at[1]-UPCAM[1]),4,26);z+=(Math.max(UPCAM[2]+8,(at[2]+UPCAM[2])/2+2)-z)*w;}
      // While the wrist camera reads the board the focus moves up to the camera; the shot widens to show its lit
      // ring and the header under it together.
      const board=this.boardWeight();
      this.target.set(at[0],at[1],z+(at[2]-z)*board+(this.mode==='parts'?55:0));
      this.position.copy(this.target).add(new T.Vector3(100,-175,60).multiplyScalar(fit*lensScale*(1+1.2*board)));
    }else if(this.viewMode==='part'){
      const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
      const bounds=new T.Box3().setFromObject(groups[this.focus]);bounds.getCenter(this.target);
      const d=Math.max(100,bounds.getSize(new T.Vector3()).length()*2.4)*fit*lensScale;this.position.copy(this.target).addScaledVector(new T.Vector3(.4,-.85,.35).normalize(),d);
    }else{
      // The home page's photo: low and side on, the arm's base on the right, the hall behind.
      // Once the arm moves the camera rises to a three-quarter view of the whole bench.
      // Between units the camera turns front on to the whole line, the tote and the reject bin; a held reject is
      // framed from the front, clear of the cradle, with the locked bin it will be cleared into.
      const portrait=this.width<this.height,wide=shot==='wide';
      const parts=this.mode==='parts';
      if(shot==='line'){
        // High enough that the cabinet front foreshortens and the bench, the four stations and the tote fill the frame.
        this.target.set(portrait?28:LINE_SHOT.x,portrait?-30:LINE_SHOT.y,portrait?20:LINE_SHOT.z);
        this.position.copy(this.target).addScaledVector(LINE_SHOT.dir,LINE_SHOT.dist*(portrait?LINE_SHOT.portrait:1));
      }else if(shot==='reject'){
        // The tray with the rejected unit and the locked bin it is cleared into, from the front right.
        this.target.set(REJECT[0]-(portrait?30:60),REJECT[1]-(portrait?55:75),portrait?40:30);
        this.position.copy(this.target).addScaledVector(new T.Vector3(.9,-1,1).normalize(),780*(portrait?1.55:1));
      }else{
        if(wide)this.target.set(-30,portrait?20:40,portrait?260:190);else if(parts)this.target.set(-30,30,portrait?220:170);else this.target.set(-45,portrait?-10:-20,portrait?115:75);
        const d=(wide?1280:parts?1150:1000)*(portrait?(wide?.68:.85):1)*fit**.5;
        const dir=this.viewMode==='top'?new T.Vector3(0,-.02,1):this.viewMode==='side'?new T.Vector3(.7,-1,.13):wide?new T.Vector3(1,-.22,.035):new T.Vector3(1,-.45,.35);
        this.position.copy(this.target).addScaledVector(dir.normalize(),d);
      }
    }
    this.cameraMoving=true;this.wake();
  }
  layout=()=>{
    const r=this.container.getBoundingClientRect();if(!r.width||!r.height)return;
    this.width=r.width;this.height=r.height;this.camera.aspect=r.width/r.height;this.camera.filmGauge=36;
    this.renderer.setSize(r.width,r.height);this.composer.setSize(r.width,r.height);
    this.camera.setViewOffset(r.width,r.height,r.width>1000&&!this.embed?-r.width*.075:0,r.height*.01,r.width,r.height);this.goal();
  };
  private watchSpeed(gap:number){
    this.seenFrames++;this.seenTime+=gap;if(gap>25)this.slowFrames++;
    if(this.seenFrames<40&&(this.seenTime<1500||this.seenFrames<4))return;
    if(this.slowFrames>this.seenFrames*.6&&this.quality<3){this.quality++;if(this.quality>=2){this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality>=3?1:1.25));this.renderer.setSize(this.width,this.height);this.composer.setSize(this.width,this.height);}}
    this.seenFrames=this.slowFrames=this.seenTime=0;
  }
  wake=()=>{if(!this.frame&&!this.disposed&&!document.hidden&&this.visible){this.chained=this.inFrame||performance.now()-this.frameEnded<6;this.frame=requestAnimationFrame(this.animate);}};
  private animate=(now:number)=>{
    this.frame=0;if(this.disposed||document.hidden||!this.visible)return;
    // Only time frames that run back to back: asked for from inside the last frame, or by the player in the same tick.
    // An idle gap between wakes (a slow scrub, a pause) is not a slow frame, and nothing counts while shaders compile.
    this.inFrame=true;
    if(this.last&&this.chained&&now-this.last<3000&&now-this.born>1500)this.watchSpeed(now-this.last);const dt=Math.min(50,now-(this.last||now-16));this.last=now;
    if(!this.process){const pose=this.poses.sample(now);if(pose)this.basePose=[pose[0]*1000,pose[1]*1000,pose[2]*1000,pose[3]];
      this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=this.basePose[3];this.rig.plug.rotation.y=0;
      const away=this.state?.released&&!this.regripping?1:0;this.letGo=away>this.letGo?Math.min(1,this.letGo+dt/REGRIP_MS):Math.max(0,this.letGo-dt/REGRIP_MS);
      const open=T.MathUtils.smootherstep(this.letGo,0,.35);this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*7*open);
      this.rig.indicator.emissive.setHex(0);this.rig.indicator.color.setHex(this.state?.accepted===true?0x379761:0x273c31);this.lights(0,0,false);}
    const targetSpread=this.mode==='parts'?1:0,oldSpread=this.spread;this.spread+=(targetSpread-this.spread)*damping(dt,190);if(Math.abs(targetSpread-this.spread)<.001)this.spread=targetSpread;
    this.rig.header.position.z=this.spread*18;this.rig.fixture.position.z=this.spread*5;this.rig.tester.position.x=this.spread*70;
    if(this.process)this.applyProcess(this.process);else{this.rig.plug.position.set(this.basePose[0],this.basePose[1],this.basePose[2]);this.rig.tool.root.position.copy(this.rig.plug.position);this.rig.tool.root.position.z+=GRIP_RAISE+LET_GO_LIFT*T.MathUtils.smootherstep(this.letGo,.4,1);}
    // Exploded, the tool lifts 120 mm and an unheld plug 55 mm; a plug in the closed fingers stays in them.
    const held=this.process?1-this.process.jaw:this.letGo>0?0:1;
    this.rig.tool.root.position.z+=this.spread*120;this.rig.plug.position.z+=this.spread*(55+65*held);
    const cut=this.mode==='inside';if(Number(cut)!==this.cut){this.cut=Number(cut);for(const group of [this.rig.housing,this.rig.plug])group.traverse(o=>{if(o instanceof T.Mesh&&(o.name.includes('housing')||o.name.includes('PBT'))){const m=o.material as T.MeshStandardMaterial;if(!o.userData.unique){o.material=m.clone();o.userData.unique=true;}const material=o.material as T.MeshStandardMaterial;material.transparent=cut;material.opacity=cut?.32:1;material.depthWrite=!cut;material.needsUpdate=true;}});}
    this.poseRig();
    if(this.cameraMoving){const a=this.reduceMotion?1:damping(dt,this.viewMode==='overview'?650:260);this.camera.position.lerp(this.position,a);this.controls.target.lerp(this.target,a);
      this.shownLens+=(this.lens-this.shownLens)*a;this.camera.setFocalLength(this.shownLens);
      if(this.camera.position.distanceTo(this.position)<Math.max(.4,this.position.distanceTo(this.target)*.0008)&&this.controls.target.distanceTo(this.target)<Math.max(.2,this.position.distanceTo(this.target)*.0004)&&Math.abs(this.lens-this.shownLens)<.02){this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.shownLens=this.lens;this.camera.setFocalLength(this.lens);this.cameraMoving=false;}}
    const orbit=this.controls.update(),uniforms=this.bokeh.uniforms as Record<string,{value:number}>;
    const f=this.process,close=this.viewMode==='connector';
    this.focalPoint.copy(this.viewMode==='part'?this.controls.target:this.rig.plug.position);
    if(close&&f?.focus)this.focalPoint.set(...f.focus);
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
    // Deep focus on the wide shots, like the photo; a shallow lens only for the close-ups, eased in and out.
    const blur=!this.light&&this.quality<1&&this.mode==='machine'&&(this.viewMode==='connector'||this.viewMode==='part')?1:0;
    this.blur+=(blur-this.blur)*damping(dt,260);if(Math.abs(blur-this.blur)<.01)this.blur=blur;
    const lens=this.camera.getFocalLength(),stop=this.viewMode==='connector'?2.8:5.6;uniforms.aperture.value=this.blur*lens*lens/(stop*Math.max(1,focus-lens)*this.camera.getFilmWidth()*.8);
    this.bokeh.enabled=this.blur>0;this.ao.enabled=this.quality<2&&this.mode!=='inside';
    const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,label] of this.labels){label.hidden=this.mode!=='parts';if(!label.hidden){const point=new T.Box3().setFromObject(groups[id]).getCenter(new T.Vector3()).project(this.camera);// the tester's label sits above it, clear of the socket's
        label.style.transform=`translate(${(point.x*.5+.5)*this.width}px,${(-point.y*.5+.5)*this.height-(id==='tester'?34:0)}px)`;}}
    this.composer.render();this.afterRender?.();if(this.playing&&!this.process||this.cameraMoving||orbit||oldSpread!==this.spread||this.blur>0&&this.blur<1||this.poses.pending(now)&&!this.process||!this.process&&this.letGo!==(this.state?.released&&!this.regripping?1:0)||this.afterRender)this.wake();this.inFrame=false;this.frameEnded=performance.now();
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.ro.disconnect();this.io.disconnect();this.controls.dispose();disposeCell(this.rig.root);this.scene.environment?.dispose();this.composer.dispose();this.ao.dispose();this.bokeh.dispose();this.renderer.dispose();document.removeEventListener('visibilitychange',this.wake);this.container.removeEventListener('wheel',this.wheel,{capture:true});this.renderer.domElement.remove();this.labels.forEach(l=>l.remove());}
}

// The between-units shot of the whole line (dev: tune it live through window.LINE_SHOT).
const LINE_SHOT={x:20,y:-10,z:10,dir:new T.Vector3(.12,-1,1.05).normalize(),dist:1300,portrait:1.7};
if(import.meta.env.DEV)(globalThis as unknown as {LINE_SHOT:typeof LINE_SHOT}).LINE_SHOT=LINE_SHOT;
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
