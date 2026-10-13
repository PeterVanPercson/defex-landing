import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createCell, disposeCell, factoryEnvironment, poseLatch } from './cell-geometry.ts';
import { createHall } from './hall.ts';
import { PoseStream, damping } from './motion.ts';
import { processFrame, HEADER } from './process.ts';
import type { ProcessFrame } from './process.ts';
import type { Configuration } from './model.ts';
import type { Snapshot } from './engine.ts';
import type { PartId } from './parts.ts';
import { PARTS } from './parts.ts';
import { contactCenters } from './mechanism.ts';
import { batchStaticMeshes } from './batching.ts';
import { dressHarness } from './harness.ts';

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
  private cameraMoving=true; private spread=0; private cut=0; private renderedPose='';
  private target=new T.Vector3();private position=new T.Vector3();private ro:ResizeObserver;private io:IntersectionObserver;private visible=true;
  // Phones and narrow screens get a lighter pipeline: fewer pixels, a smaller shadow map, no defocus.
  private light=matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  private wirePoints=Array.from({length:10},()=>new T.Vector3());
  private labels=new Map<PartId,HTMLElement>();
  private basePose=[0,0,42,0];private band=true;
  // Set once the viewer drags the camera; a played cycle then leaves it where they put it.
  private free=false;
  private lens=35;private shownLens=35;
  // A slow GPU (an old laptop, a projector at 4K) steps down: defocus off, then ambient occlusion and pixels.
  private quality=0;private slowFrames=0;private seenFrames=0;private seenTime=0;
  private isWide(){const p=this.process?.progress;return this.mode!=='parts'&&p!==undefined&&(p<10||p>=96);}
  private focalPoint=new T.Vector3();
  private ray=new T.Raycaster();private down=[0,0];
  private reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(container:HTMLElement,config:Configuration,hud:Hud|null=null,embed=false){
    this.container=container;this.config=config;this.hud=hud;this.embed=embed;
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.light?1.5:1.75));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.NeutralToneMapping;this.renderer.toneMappingExposure=1;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');
    this.renderer.domElement.setAttribute('aria-label','Interactive rendered connector workcell in an empty factory hall. White six-joint arm, two-finger gripper, six-wire harness, green circuit board, fixture, tester and reject tray.');
    this.camera.up.set(0,0,1);this.scene.background=new T.Color(0xc4c5c5);this.scene.fog=new T.FogExp2(0xc4c5c5,.000006);
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
    this.scene.add(this.hall,this.rig.root);
    for(const g of [this.rig.bench,this.rig.fixture,this.rig.nest,this.rig.bin])batchStaticMeshes(g,new Set());
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
    for(const g of [this.rig.bench,this.rig.fixture,this.rig.nest,this.rig.bin])batchStaticMeshes(g,new Set());
    const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,g] of Object.entries(groups))g.traverse(o=>o.userData.part=id);
    this.renderedPose='';this.cut=-1;
  }
  configure(config:Configuration){this.config=config;if(!this.process){this.ensureVariant(config.variant==='eight'?8:6);this.rig.header.position.set(config.offsetX,config.offsetY,0);this.rig.header.rotation.z=config.yaw*Math.PI/180;}this.wake();}
  update(state:Snapshot,epoch:number,playing=false,_speed=1){this.state=state;this.playing=playing;if(!this.process){this.poses.push(state.pose,performance.now(),epoch);this.wake();}}
  setProcess(f:ProcessFrame|null){this.process=f;if(f){this.ensureVariant(6);this.rig.header.position.set(HEADER[0],HEADER[1],0);this.rig.header.rotation.z=0;this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=0;}else this.configure(this.config);if(f){this.applyProcess(f);const band=this.isWide();if(!this.free&&(this.viewMode==='connector'||(this.viewMode==='overview'&&band!==this.band)))this.goal();this.band=band;}else if(this.state)this.poses.push(this.state.pose,performance.now(),Date.now());this.wake();}
  private applyProcess(f:ProcessFrame){
    this.rig.tool.root.position.set(...f.tool);this.rig.plug.position.set(...f.plug);this.rig.plug.rotation.y=f.rotation;this.rig.rotator.rotation.y=f.cradle;
    this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);
    this.rig.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);poseLatch(this.rig.latch,f.latch);
    this.rig.indicator.color.setHex(f.accepted===true?0x379761:f.accepted===false?0xb2402c:0x273c31);
    this.rig.indicator.emissive.setHex(f.accepted===true?0x248440:f.accepted===false?0xa0301c:0x000000);this.rig.indicator.emissiveIntensity=f.accepted===null?0:.9;
  }
  private poseRig(){
    const tool=this.rig.tool.root,plug=this.rig.plug,flange=tool.position.clone().add(new T.Vector3(0,0,80)).divideScalar(5);
    const cableEnd=this.rig.tool.gland.clone().applyAxisAngle(new T.Vector3(0,0,1),tool.rotation.z).add(tool.position).add(new T.Vector3(3,0,0)).divideScalar(5);
    this.rig.arm.set(flange,tool.rotation.z,cableEnd);
    const key=[...tool.position.toArray(),...plug.position.toArray(),plug.rotation.y,plug.rotation.z,tool.rotation.z,this.spread].map(v=>v.toFixed(4)).join();
    if(key===this.renderedPose)return;this.renderedPose=key;
    const contacts=contactCenters(this.rig.pins);
    for(let i=0;i<this.rig.pins;i++){
      dressHarness(this.wirePoints,plug.position,plug.rotation.y,plug.rotation.z,contacts[i],i,this.rig.pins);
      this.rig.wires[i].update(this.wirePoints);this.rig.wires[i].mesh.visible=this.spread<.01;
    }
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
    this.lens=close?100:this.isWide()||this.mode==='parts'?35:50;
    this.camera.setFocalLength(this.lens);
    const fit=Math.max(1,1.12/(this.width/this.height));
    const lensScale=Math.tan(25*Math.PI/360)/Math.tan(this.camera.fov*Math.PI/360);this.camera.setFocalLength(this.shownLens);
    if(this.viewMode==='connector'){
      const f=this.process;
      this.target.set(f?.plug[0]??0,f?.plug[1]??0,Math.max(29,(f?.plug[2]??15)+15)+(this.mode==='parts'?55:0));
      this.position.copy(this.target).add(new T.Vector3(100,-175,60).multiplyScalar(fit*lensScale));
    }else if(this.viewMode==='part'){
      const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
      const bounds=new T.Box3().setFromObject(groups[this.focus]);bounds.getCenter(this.target);
      const d=Math.max(100,bounds.getSize(new T.Vector3()).length()*2.4)*fit*lensScale;this.position.copy(this.target).addScaledVector(new T.Vector3(.4,-.85,.35).normalize(),d);
    }else{
      // The home page's photo: low and side on, the arm's base on the right, the hall behind.
      // Once the arm moves the camera rises to a three-quarter view of the whole bench.
      const portrait=this.width<this.height,wide=this.isWide();
      const parts=this.mode==='parts';
      if(wide)this.target.set(-30,portrait?20:40,portrait?260:190);else if(parts)this.target.set(-30,30,portrait?220:170);else this.target.set(-45,portrait?-10:-20,portrait?115:75);
      const d=(wide?1280:parts?1150:1000)*(portrait?(wide?.68:.85):1)*fit**.5;
      const dir=this.viewMode==='top'?new T.Vector3(0,-.02,1):this.viewMode==='side'?new T.Vector3(.7,-1,.13):wide?new T.Vector3(1,-.22,.035):new T.Vector3(1,-.45,.35);
      this.position.copy(this.target).addScaledVector(dir.normalize(),d);
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
  wake=()=>{if(!this.frame&&!this.disposed&&!document.hidden&&this.visible)this.frame=requestAnimationFrame(this.animate);};
  private animate=(now:number)=>{
    this.frame=0;if(this.disposed||document.hidden||!this.visible)return;const raw=now-this.last;if(this.last&&raw<3000)this.watchSpeed(raw);const dt=Math.min(50,now-(this.last||now-16));this.last=now;
    if(!this.process){const pose=this.poses.sample(now);if(pose)this.basePose=[pose[0]*1000,pose[1]*1000,pose[2]*1000,pose[3]];
      this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=this.basePose[3];this.rig.plug.rotation.y=0;this.rig.tool.fingers.forEach(g=>g.position.x=g.userData.extra||0);
      this.rig.indicator.emissive.setHex(0);this.rig.indicator.color.setHex(this.state?.accepted===true?0x379761:0x273c31);}
    const targetSpread=this.mode==='parts'?1:0,oldSpread=this.spread;this.spread+=(targetSpread-this.spread)*damping(dt,190);if(Math.abs(targetSpread-this.spread)<.001)this.spread=targetSpread;
    this.rig.header.position.z=this.spread*18;this.rig.fixture.position.z=this.spread*5;this.rig.tester.position.x=this.spread*70;
    if(this.process)this.applyProcess(this.process);else{this.rig.tool.root.position.set(this.basePose[0],this.basePose[1],this.basePose[2]);this.rig.plug.position.copy(this.rig.tool.root.position);}
    this.rig.tool.root.position.z+=this.spread*120;this.rig.plug.position.z+=this.spread*55;
    const cut=this.mode==='inside';if(Number(cut)!==this.cut){this.cut=Number(cut);for(const group of [this.rig.housing,this.rig.plug])group.traverse(o=>{if(o instanceof T.Mesh&&(o.name.includes('housing')||o.name.includes('PBT'))){const m=o.material as T.MeshStandardMaterial;if(!o.userData.unique){o.material=m.clone();o.userData.unique=true;}const material=o.material as T.MeshStandardMaterial;material.transparent=cut;material.opacity=cut?.32:1;material.depthWrite=!cut;material.needsUpdate=true;}});}
    this.poseRig();
    if(this.cameraMoving){const a=this.reduceMotion?1:damping(dt,this.viewMode==='overview'?650:260);this.camera.position.lerp(this.position,a);this.controls.target.lerp(this.target,a);
      this.shownLens+=(this.lens-this.shownLens)*a;this.camera.setFocalLength(this.shownLens);
      if(this.camera.position.distanceTo(this.position)<.4&&this.controls.target.distanceTo(this.target)<.2&&Math.abs(this.lens-this.shownLens)<.02){this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.shownLens=this.lens;this.camera.setFocalLength(this.lens);this.cameraMoving=false;}}
    const orbit=this.controls.update(),uniforms=this.bokeh.uniforms as Record<string,{value:number}>;
    this.focalPoint.copy(this.viewMode==='part'?this.controls.target:this.rig.plug.position);
    if(this.viewMode!=='part'){
      const plug=this.rig.plug.position,header=this.rig.header.position;
      const overHeader=Math.hypot(plug.x-header.x,plug.y-header.y)<5&&Math.abs(this.rig.plug.rotation.y)<.01;
      this.focalPoint.y-=overHeader?5.25:3.6;
      this.focalPoint.z=overHeader?Math.max(18,plug.z-4):plug.z+2;
    }
    this.focalPoint.applyMatrix4(this.camera.matrixWorldInverse);
    const focus=Math.max(101,-this.focalPoint.z);uniforms.focus.value=focus;
    const lens=this.camera.getFocalLength(),stop=this.viewMode==='connector'?2.8:5.6;uniforms.aperture.value=lens*lens/(stop*Math.max(1,focus-lens)*this.camera.getFilmWidth()*.8);
    // Deep focus on the wide shots, like the photo; a shallow lens only for the close-ups.
    this.bokeh.enabled=!this.light&&this.quality<1&&this.mode==='machine'&&(this.viewMode==='connector'||this.viewMode==='part');this.ao.enabled=this.quality<2&&this.mode!=='inside';
    const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,label] of this.labels){label.hidden=this.mode!=='parts';if(!label.hidden){const point=new T.Box3().setFromObject(groups[id]).getCenter(new T.Vector3()).project(this.camera);// the tester's label sits above it, clear of the socket's
        label.style.transform=`translate(${(point.x*.5+.5)*this.width}px,${(-point.y*.5+.5)*this.height-(id==='tester'?34:0)}px)`;}}
    this.composer.render();this.afterRender?.();if(this.playing&&!this.process||this.cameraMoving||orbit||oldSpread!==this.spread||this.poses.pending(now)&&!this.process||this.afterRender)this.wake();
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.ro.disconnect();this.io.disconnect();this.controls.dispose();disposeCell(this.rig.root);this.scene.environment?.dispose();this.composer.dispose();this.ao.dispose();this.bokeh.dispose();this.renderer.dispose();document.removeEventListener('visibilitychange',this.wake);this.container.removeEventListener('wheel',this.wheel,{capture:true});this.renderer.domElement.remove();this.labels.forEach(l=>l.remove());}
}
