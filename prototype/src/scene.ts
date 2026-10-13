import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createCell, createHall, disposeCell } from './cell-geometry.ts';
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
  scene=new T.Scene(); camera=new T.PerspectiveCamera(25,1,1,16000);
  controls:OrbitControls; composer:EffectComposer; ao:GTAOPass; bokeh:BokehPass;
  rig=createCell(); hall=createHall(); config:Configuration;
  poses=new PoseStream(); state:Snapshot|null=null; playing=false; afterRender:(()=>void)|null=null;
  mode:Mode='machine'; viewMode:View='overview'; focus:PartId='socket';
  process:ProcessFrame|null=processFrame(44); director=false; disposed=false;
  private container:HTMLElement; private hud:Hud|null; private embed:boolean;
  private frame=0; private last=0; private width=1; private height=1;
  private cameraMoving=true; private spread=0; private cut=0; private renderedPose='';
  private target=new T.Vector3();private position=new T.Vector3();private ro:ResizeObserver;
  private wirePoints=Array.from({length:10},()=>new T.Vector3());
  private labels=new Map<PartId,HTMLElement>();
  private basePose=[0,0,42,0];
  private focalPoint=new T.Vector3();
  private ray=new T.Raycaster();private down=[0,0];
  private reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(container:HTMLElement,config:Configuration,hud:Hud|null=null,embed=false){
    this.container=container;this.config=config;this.hud=hud;this.embed=embed;
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.92;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('role','img');
    this.renderer.domElement.setAttribute('aria-label','Interactive rendered connector workcell in an empty factory hall. White six-joint arm, two-finger gripper, six-wire harness, green circuit board, fixture, tester and reject tray.');
    this.camera.up.set(0,0,1);this.scene.background=new T.Color(0xcbd2d0);this.scene.fog=new T.FogExp2(0xcbd2d0,.000045);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    Object.assign(this.controls,{enableDamping:true,dampingFactor:.08,enablePan:false,minDistance:150,maxDistance:8000,minPolarAngle:.06,maxPolarAngle:Math.PI*.49,rotateSpeed:.45,zoomSpeed:.6});
    this.controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_ROTATE};if(embed)this.controls.enableZoom=false;
    this.renderer.domElement.style.touchAction='pan-y';
    this.controls.addEventListener('start',()=>{this.cameraMoving=false;this.director=false;});this.controls.addEventListener('change',this.wake);
    container.addEventListener('wheel',this.wheel,{capture:true,passive:true});
    this.renderer.domElement.addEventListener('pointerdown',this.pointerDown);this.renderer.domElement.addEventListener('pointerup',this.pointerUp);
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);
    const env=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);
    this.scene.environment=pmrem.fromScene(env,.035).texture;this.scene.environmentIntensity=.58;this.scene.environmentRotation.x=Math.PI/2;env.dispose();pmrem.dispose();
    const key=new T.DirectionalLight(0xfff7ea,2.1);key.position.set(-550,-250,1100);key.target.position.set(0,0,80);key.castShadow=true;
    key.shadow.mapSize.set(4096,4096);Object.assign(key.shadow.camera,{left:-520,right:520,top:600,bottom:-600,near:100,far:2300});key.shadow.normalBias=.12;key.shadow.bias=-.000035;
    this.scene.add(key,key.target);const fill=new T.HemisphereLight(0xe6eef4,0x485249,.55);fill.position.set(0,0,1000);this.scene.add(fill);
    const rim=new T.DirectionalLight(0xe7eff6,.9);rim.position.set(250,550,600);this.scene.add(rim);
    this.scene.add(this.hall,this.rig.root);
    for(const g of [this.rig.bench,this.rig.fixture,this.rig.nest,this.rig.bin,this.hall])batchStaticMeshes(g,new Set());
    const groups:Record<PartId,T.Object3D>={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,g] of Object.entries(groups)){g.traverse(o=>o.userData.part=id);const label=document.createElement('div');label.className='cell-label';label.textContent=PARTS.find(p=>p.id===id)?.name??id;hud?.labels.append(label);this.labels.set(id as PartId,label);}
    this.composer=new EffectComposer(this.renderer,new T.WebGLRenderTarget(1,1,{samples:4,type:T.HalfFloatType}));
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.ao=new GTAOPass(this.scene,this.camera,1,1);this.ao.blendIntensity=.55;
    this.ao.updateGtaoMaterial({radius:10,distanceExponent:1.6,thickness:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:false});this.ao.updatePdMaterial({radius:3,rings:2,samples:8});this.composer.addPass(this.ao);
    this.bokeh=new BokehPass(this.scene,this.camera,{focus:1200,aperture:.000007,maxblur:.014});
    // Thin-lens defocus in scene millimetres, using the guideline's 100 mm f/2.8 lens.
    this.bokeh.materialBokeh.fragmentShader=this.bokeh.materialBokeh.fragmentShader.replace('float factor = ( focus + viewZ );','float factor = ( focus + viewZ ) / max( -viewZ, 1.0 );');
    this.composer.addPass(this.bokeh);this.composer.addPass(new OutputPass());
    this.configure(config);this.applyProcess(this.process!);
    this.ro=new ResizeObserver(this.layout);this.ro.observe(container);document.addEventListener('visibilitychange',this.wake);
    this.layout();this.camera.position.copy(this.position);this.controls.target.copy(this.target);this.controls.update();this.wake();
  }
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
  setProcess(f:ProcessFrame|null){this.process=f;if(f){this.ensureVariant(6);this.rig.header.position.set(HEADER[0],HEADER[1],0);this.rig.header.rotation.z=0;this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=0;}else this.configure(this.config);if(f){this.applyProcess(f);if(this.viewMode==='connector')this.goal();}else if(this.state)this.poses.push(this.state.pose,performance.now(),Date.now());this.wake();}
  private applyProcess(f:ProcessFrame){
    this.rig.tool.root.position.set(...f.tool);this.rig.plug.position.set(...f.plug);this.rig.plug.rotation.y=f.rotation;this.rig.rotator.rotation.y=f.cradle;
    this.rig.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);
    this.rig.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);
    this.rig.indicator.color.setHex(f.accepted===true?0x379761:0x273c31);
    this.rig.indicator.emissive.setHex(f.accepted===true?0x248440:0x000000);this.rig.indicator.emissiveIntensity=f.accepted===null?0:.3;
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
  view(mode:View|'cell'|'close'){this.viewMode=mode==='cell'?'overview':mode==='close'?'connector':mode;this.director=false;this.goal();}
  focusPart(id:PartId){this.focus=id;this.viewMode='part';this.goal();}
  direct(on:boolean){this.director=on;this.hud?.onDirector?.(on);if(on){this.viewMode='connector';this.goal();}}
  hold(_on:boolean){}
  offline(){this.playing=false;this.wake();}
  private goal(){
    const fit=Math.max(1,1.12/(this.width/this.height));
    const lensScale=Math.tan(25*Math.PI/360)/Math.tan(this.camera.fov*Math.PI/360);
    if(this.viewMode==='connector'){
      const f=this.process;
      this.target.set(f?.plug[0]??0,f?.plug[1]??0,Math.max(29,(f?.plug[2]??15)+15));
      this.position.copy(this.target).add(new T.Vector3(100,-175,60).multiplyScalar(fit*lensScale));
    }else if(this.viewMode==='part'){
      const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
      const bounds=new T.Box3().setFromObject(groups[this.focus]);bounds.getCenter(this.target);
      const d=Math.max(100,bounds.getSize(new T.Vector3()).length()*2.4)*fit*lensScale;this.position.copy(this.target).addScaledVector(new T.Vector3(.4,-.85,.35).normalize(),d);
    }else{
      this.target.set(10,25,200);const d=Math.max(1490,1270*fit)*(this.mode==='parts'?1.2:1)*lensScale;
      const dir=this.viewMode==='top'?new T.Vector3(0,-.02,1):this.viewMode==='side'?new T.Vector3(.7,-1,.13):new T.Vector3(.52,-1,.12);
      this.position.copy(this.target).addScaledVector(dir.normalize(),d);
    }
    this.cameraMoving=true;this.wake();
  }
  layout=()=>{
    const r=this.container.getBoundingClientRect();if(!r.width||!r.height)return;
    this.width=r.width;this.height=r.height;this.camera.aspect=r.width/r.height;this.camera.filmGauge=36;this.camera.setFocalLength(100);
    this.renderer.setSize(r.width,r.height);this.composer.setSize(r.width,r.height);
    this.camera.setViewOffset(r.width,r.height,r.width>1000&&!this.embed?-r.width*.075:0,r.height*.01,r.width,r.height);this.goal();
  };
  wake=()=>{if(!this.frame&&!this.disposed&&!document.hidden)this.frame=requestAnimationFrame(this.animate);};
  private animate=(now:number)=>{
    this.frame=0;if(this.disposed||document.hidden)return;const dt=Math.min(50,now-(this.last||now-16));this.last=now;
    if(!this.process){const pose=this.poses.sample(now);if(pose)this.basePose=[pose[0]*1000,pose[1]*1000,pose[2]*1000,pose[3]];
      this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=this.basePose[3];this.rig.plug.rotation.y=0;this.rig.tool.fingers.forEach(g=>g.position.x=g.userData.extra||0);
      this.rig.indicator.emissive.setHex(0);this.rig.indicator.color.setHex(this.state?.accepted===true?0x379761:0x273c31);}
    const targetSpread=this.mode==='parts'?1:0,oldSpread=this.spread;this.spread+=(targetSpread-this.spread)*damping(dt,190);if(Math.abs(targetSpread-this.spread)<.001)this.spread=targetSpread;
    this.rig.header.position.z=this.spread*18;this.rig.fixture.position.z=this.spread*5;this.rig.tester.position.x=this.spread*70;
    if(this.process)this.applyProcess(this.process);else{this.rig.tool.root.position.set(this.basePose[0],this.basePose[1],this.basePose[2]);this.rig.plug.position.copy(this.rig.tool.root.position);}
    this.rig.tool.root.position.z+=this.spread*120;this.rig.plug.position.z+=this.spread*55;
    const cut=this.mode==='inside';if(Number(cut)!==this.cut){this.cut=Number(cut);for(const group of [this.rig.housing,this.rig.plug])group.traverse(o=>{if(o instanceof T.Mesh&&(o.name.includes('housing')||o.name.includes('PBT'))){const m=o.material as T.MeshStandardMaterial;if(!o.userData.unique){o.material=m.clone();o.userData.unique=true;}const material=o.material as T.MeshStandardMaterial;material.transparent=cut;material.opacity=cut?.15:1;material.depthWrite=!cut;material.needsUpdate=true;}});}
    this.poseRig();
    if(this.cameraMoving){const a=this.reduceMotion?1:damping(dt,200);this.camera.position.lerp(this.position,a);this.controls.target.lerp(this.target,a);if(this.camera.position.distanceTo(this.position)<.04)this.cameraMoving=false;}
    const orbit=this.controls.update(),uniforms=this.bokeh.uniforms as Record<string,{value:number}>;
    this.focalPoint.copy(this.viewMode==='part'?this.controls.target:this.rig.plug.position);
    if(this.viewMode!=='part'){
      const plug=this.rig.plug.position,header=this.rig.header.position;
      const overHeader=Math.hypot(plug.x-header.x,plug.y-header.y)<5&&Math.abs(this.rig.plug.rotation.y)<.01;
      this.focalPoint.y-=overHeader?5.25:3.6;
      this.focalPoint.z=overHeader?Math.max(22,plug.z-4):plug.z+2;
    }
    this.focalPoint.applyMatrix4(this.camera.matrixWorldInverse);
    const focus=Math.max(101,-this.focalPoint.z);uniforms.focus.value=focus;
    uniforms.aperture.value=10000/(2.8*(focus-100)*this.camera.getFilmWidth()*.8);
    this.bokeh.enabled=this.mode!=='inside'&&this.mode!=='parts';this.ao.enabled=this.mode!=='inside';
    const groups={arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester};
    for(const [id,label] of this.labels){label.hidden=this.mode!=='parts';if(!label.hidden){const point=new T.Box3().setFromObject(groups[id]).getCenter(new T.Vector3()).project(this.camera);label.style.transform=`translate(${(point.x*.5+.5)*this.width}px,${(-point.y*.5+.5)*this.height}px)`;}}
    this.composer.render();this.afterRender?.();if(this.playing&&!this.process||this.cameraMoving||orbit||oldSpread!==this.spread||this.poses.pending(now)&&!this.process||this.afterRender)this.wake();
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.ro.disconnect();this.controls.dispose();disposeCell(this.rig.root);this.scene.environment?.dispose();this.composer.dispose();this.ao.dispose();this.bokeh.dispose();this.renderer.dispose();document.removeEventListener('visibilitychange',this.wake);this.container.removeEventListener('wheel',this.wheel,{capture:true});this.renderer.domElement.remove();this.labels.forEach(l=>l.remove());}
}
