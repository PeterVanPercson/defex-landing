import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { dimensions } from './model.ts';
import type { Configuration } from './model.ts';
import type { Snapshot, Sample } from './engine.ts';
import { PoseStream, damping } from './motion.ts';

const ivory=new THREE.MeshStandardMaterial({color:0xe5e3d7,roughness:0.34,metalness:0.03});
const graphite=new THREE.MeshStandardMaterial({color:0x252b2d,roughness:0.32,metalness:0.55});
const silver=new THREE.MeshStandardMaterial({color:0xb1b8b9,roughness:0.29,metalness:0.85});
const black=new THREE.MeshStandardMaterial({color:0x151a1c,roughness:0.62,metalness:0.1});
const orange=new THREE.MeshStandardMaterial({color:0xee5b2b,roughness:0.45,metalness:0.15});
const gold=new THREE.MeshStandardMaterial({color:0xc3a46b,roughness:0.22,metalness:0.85});

function box(parent:THREE.Object3D, name:string, size:number[], pos:number[], material:THREE.Material, radius=0.3) {
  const geo=radius?new RoundedBoxGeometry(size[0],size[1],size[2],2,radius):new THREE.BoxGeometry(size[0],size[1],size[2]);
  const mesh=new THREE.Mesh(geo,material);mesh.name=name;mesh.position.set(pos[0],pos[1],pos[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function cylinder(parent:THREE.Object3D, radius:number,height:number,pos:number[],material:THREE.Material,segments=24) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material);
  mesh.rotation.x=Math.PI/2;mesh.position.set(pos[0],pos[1],pos[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function screw(parent:THREE.Object3D,x:number,y:number,z:number) {
  cylinder(parent,1.4,0.45,[x,y,z],silver);
  cylinder(parent,0.58,0.1,[x,y,z+0.26],black,6);
}
function line(parent:THREE.Object3D,points:THREE.Vector3[],color:number,opacity=1) {
  const obj=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));parent.add(obj);return obj;
}
function cable(parent:THREE.Object3D, points:number[][], color:number, radius=.32) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,7,false),new THREE.MeshStandardMaterial({color,roughness:.65}));mesh.castShadow=true;parent.add(mesh);
}

export class WorkcellScene {
  renderer:THREE.WebGLRenderer;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(33,1,.1,1000);
  controls:OrbitControls;
  cell=new THREE.Group();
  socket=new THREE.Group();
  tool=new THREE.Group();
  carriage=new THREE.Group();
  plug=new THREE.Group();
  fixture=new THREE.Group();
  trail:THREE.Line;
  socketCover:THREE.Mesh[]=[];
  plugCover:THREE.Mesh[]=[];
  ledMaterial=new THREE.MeshStandardMaterial({color:0xe7aa45,emissive:0xc77917,emissiveIntensity:.5,roughness:.4});
  config:Configuration;
  inspect=false;
  targetCamera:THREE.Vector3|null=null;
  targetLook:THREE.Vector3|null=null;
  poses=new PoseStream();
  lastFrame=0;
  trailPositions=new Float32Array(1500);
  trailStart=-1;
  trailCount=0;
  lastVariant:Configuration['variant']|null=null;
  connectorMaterials=new Set<THREE.Material>();
  resizeObserver:ResizeObserver;
  frame=0;

  constructor(container:HTMLElement,config:Configuration) {
    this.config=config;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D simulation of a connector in a cartesian assembly cell');
    this.scene.background=new THREE.Color(0xe8e6df);
    this.camera.up.set(0,0,1);this.camera.position.set(69,-90,65);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.target.set(0,0,28);this.controls.enableDamping=true;this.controls.dampingFactor=.08;
    this.controls.minDistance=32;this.controls.maxDistance=200;this.controls.maxPolarAngle=Math.PI*.48;
    this.controls.addEventListener('start',()=>{this.targetCamera=null;this.targetLook=null;});
    const env=new RoomEnvironment();
    const pmrem=new THREE.PMREMGenerator(this.renderer);
    this.scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x8d938a,2));
    const key=new THREE.DirectionalLight(0xfff9ed,4);key.position.set(35,-45,90);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-65,right:65,top:75,bottom:-55,near:1,far:200});
    key.shadow.normalBias=.15;key.shadow.bias=-.0001;this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xd6e3ed,2);fill.position.set(-50,35,50);this.scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshStandardMaterial({color:0xbcbdb3,roughness:.85}));floor.receiveShadow=true;floor.position.z=-.15;this.scene.add(floor);
    this.scene.add(this.cell);this.cell.add(this.fixture,this.socket,this.tool,this.carriage);
    this.buildFixed();this.buildConnector();
    this.trail=line(this.scene,[new THREE.Vector3(0,0,27)],0xe96a36,.65);
    this.trail.geometry.setAttribute('position',new THREE.BufferAttribute(this.trailPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.trail.geometry.setDrawRange(0,0);this.trail.frustumCulled=false;
    this.controls.addEventListener('change',this.invalidate);
    this.resizeObserver=new ResizeObserver(()=>{const r=container.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.invalidate();});
    this.resizeObserver.observe(container);
    document.addEventListener('visibilitychange',this.onVisibility);
    this.tool.position.z=42;
    this.invalidate();
  }

  buildFixed() {
    box(this.fixture,'Aluminium fixture',[62,48,4],[0,0,2],silver,.7);
    box(this.fixture,'Fixture footing',[59,45,1.2],[0,0,.7],graphite,.4);
    for (const x of [-26,26]) for (const y of [-19,19]) screw(this.fixture,x,y,4.25);
    for (const x of [-22,-16,16,22]) for (const y of [-12,-6,0,6,12]) cylinder(this.fixture,.52,.12,[x,y,4.1],black,12);
    box(this.fixture,'Socket carrier',[29,23,4.5],[0,0,6.25],graphite,.4);
    for (const x of [-12,12]) for (const y of [-9,9]) screw(this.fixture,x,y,8.5);
    for (const x of [-27,27]) {
      box(this.cell,'Gantry upright',[6,7,65],[x,17,36.5],graphite,.5);
      box(this.cell,'Upright face',[.7,7.1,59],[x-2.3,17,36.5],silver,.1);
      box(this.cell,'Gantry foot',[11,12,5],[x,17,6.5],graphite,.5);
      screw(this.cell,x,13,9.2);
    }
    box(this.cell,'Cross rail',[64,9,8],[0,17,69],silver,.5);
    box(this.cell,'Linear track',[55,1.2,2.2],[0,11.9,69.1],black,.1);
    box(this.cell,'Drive cover',[15,12,13],[-26,17,69],graphite,.8);
    box(this.cell,'Drive label',[5,.12,5],[-26,10.91,69],orange,.2);
    box(this.carriage,'X carriage',[13,10,11],[0,16,66.5],graphite,.45);
    box(this.carriage,'Y slide',[10,25,5],[0,6,63],silver,.4);
    box(this.carriage,'Z axis housing',[8,8,21],[0,0,55],graphite,.4);
    box(this.carriage,'Z chrome rail',[2.7,1,22],[0,-4.5,55],silver,.12);
    box(this.tool,'Tool flange',[10,11,4],[0,0,18],silver,.4);
    box(this.tool,'Parallel gripper',[16,12,6],[0,0,13],graphite,.5);
    for (const x of [-7.1,7.1]) {
      box(this.tool,'Gripper finger',[2.4,5.2,7],[x,0,12],silver,.3);
      box(this.tool,'Soft jaw insert',[.8,4.5,3],[x-Math.sign(x)*1.2,0,9.8],black,.2);
      screw(this.tool,x,0,11);
    }
    cylinder(this.tool,3.3,17,[0,0,28],silver);
    box(this.fixture,'Test module',[8,17,7],[22,-5,7.5],graphite,.6);
    box(this.fixture,'Indicator window',[4,7,.2],[22,-5,11.1],black,.2);
    cylinder(this.fixture,.8,.3,[22,-3.5,11.25],this.ledMaterial);
    for(const x of [-3,0,3]) cable(this.fixture,[[x,7,9],[x,12,8],[15,13,6],[20,3,7]],0x303638,.3);
    line(this.fixture,[new THREE.Vector3(-8,-19,4.1),new THREE.Vector3(8,-19,4.1)],0x64726d,.5);
    for(let x=-8;x<=8;x+=2) line(this.fixture,[new THREE.Vector3(x,-19,4.1),new THREE.Vector3(x,-20,4.1)],0x64726d,.5);
  }

  buildConnector() {
    const remove=(group:THREE.Group)=>{for(const child of [...group.children]){child.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});group.remove(child);}};
    remove(this.socket);remove(this.plug);this.socketCover=[];this.plugCover=[];
    this.connectorMaterials.forEach(material=>material.dispose());this.connectorMaterials.clear();
    this.tool.add(this.plug);
    const d=dimensions(this.config.variant),sx=d.socketX*1000,sy=d.socketY*1000;
    const socketMat=black.clone();
    this.connectorMaterials.add(socketMat);
    for(const side of [-1,1]) this.socketCover.push(box(this.socket,'Socket wall',[4,sy*2+8,12],[side*(sx+2),0,16],socketMat,.35));
    for(const side of [-1,1]) this.socketCover.push(box(this.socket,'Socket wall',[sx*2,4,12],[0,side*(sy+2),16],socketMat,.35));
    box(this.socket,'Socket floor',[sx*2+8,sy*2+8,4],[0,0,9],black,.2);
    for(let i=0;i<d.pins;i++) {
      const x=(i%(d.pins/2)-(d.pins/2-1)/2)*3.1,y=i<d.pins/2?-1.55:1.55;
      cylinder(this.socket,.37,5,[x,y,13],gold,16);
      cylinder(this.plug,.52,2,[x,y,-2.9],gold,16);
      cylinder(this.plug,.7,.3,[x,y,4.3],graphite,16);
      cable(this.plug,[[x,y,4.4],[x,y,7],[x*.55,2,9],[x*.3,6,11],[x*.2,9,20]],i%3===0?0xe6743c:i%3===1?0x454c4e:0xc5c1b0,.28);
    }
    const material=ivory.clone();
    this.connectorMaterials.add(material);
    this.plugCover.push(box(this.plug,'Illustrative connector housing',[d.halfX*2000,d.halfY*2000,8],[0,0,0],material,.38));
    box(this.plug,'Grasp extension',[11.2,4.4,6.5],[0,0,7.25],material,.3);
    for(const x of [-d.halfX*1000+.6,d.halfX*1000-.6]) box(this.plug,'Mold rib',[.5,.55,6],[x,-d.halfY*1000-.1,0],material,.14);
    box(this.plug,'Latch tab',[2,.7,5],[0,-d.halfY*1000-.45,-.3],ivory,.15);
    box(this.plug,'Latch hook',[2.3,1,1],[0,-d.halfY*1000-.55,-2.6],ivory,.2);
    const shared=new Set<THREE.Material>([ivory,graphite,silver,black,orange,gold]);
    for(const group of [this.socket,this.plug])group.traverse(object=>{
      if(object instanceof THREE.Mesh){const materials=Array.isArray(object.material)?object.material:[object.material];for(const mat of materials)if(!shared.has(mat))this.connectorMaterials.add(mat);}
    });
    this.socket.position.set(this.config.offsetX,this.config.offsetY,0);this.socket.rotation.z=this.config.yaw*Math.PI/180;
    this.setInspect(this.inspect);
    this.lastVariant=this.config.variant;
  }

  configure(config:Configuration) {
    this.config=config;
    if(this.lastVariant!==config.variant)this.buildConnector();
    this.socket.position.set(config.offsetX,config.offsetY,0);this.socket.rotation.z=config.yaw*Math.PI/180;
    this.invalidate();
  }
  setInspect(on:boolean) {
    this.inspect=on;
    for(const mesh of [...this.socketCover,...this.plugCover]) {
      const mat=mesh.material as THREE.MeshStandardMaterial;mat.transparent=on;mat.opacity=on ? .19 : 1;mat.depthWrite=!on;
      mat.needsUpdate=true;mesh.castShadow=!on;
    }
    this.invalidate();
  }
  view(mode:'cell'|'close'|'top') {
    const positions={cell:[110,-137,98],close:[43,-70,49],top:[.1,-.1,126]};
    this.targetCamera=new THREE.Vector3(...positions[mode]);this.targetLook=new THREE.Vector3(0,0,mode==='cell'?38:24);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(this.targetCamera);this.controls.target.copy(this.targetLook);this.targetCamera=null;this.targetLook=null;}
    this.invalidate();
  }
  update(state:Snapshot,samples:Sample[],epoch:number) {
    if(epoch!==this.poses.epoch){this.trailStart=-1;this.trailCount=0;}
    this.poses.push(state.pose,performance.now(),epoch);
    const c=state.accepted===true?0x4e9a78:state.accepted===false?0xd86b4c:state.phase==='electrical'?0xe5be5d:0x8a918b;
    this.ledMaterial.color.setHex(c);this.ledMaterial.emissive.setHex(c);
    const count=Math.min(500,Math.ceil(samples.length/3)),start=samples[0]?.t??-1;
    const from=start===this.trailStart?this.trailCount:0;
    for(let i=from;i<count;i++){const p=samples[i*3];this.trailPositions.set([p.x*1000,p.y*1000,p.z*1000],i*3);}
    this.trailStart=start;this.trailCount=count;
    if(count!==from)this.trail.geometry.attributes.position.needsUpdate=true;
    this.trail.geometry.setDrawRange(0,count>1?count:0);
    this.invalidate();
  }
  invalidate=()=>{if(!this.frame&&!document.hidden)this.frame=requestAnimationFrame(this.animate);};
  onVisibility=()=>{if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0;}else{this.lastFrame=performance.now();this.invalidate();}};
  animate=(now:number)=>{
    this.frame=0;
    const delta=Math.min(50,Math.max(1,now-this.lastFrame));this.lastFrame=now;
    const pose=this.poses.sample(now);
    if(pose){this.tool.position.set(pose[0]*1000,pose[1]*1000,pose[2]*1000);this.tool.rotation.z=pose[3];this.carriage.position.set(pose[0]*1000,pose[1]*1000,0);}
    if(this.targetCamera&&this.targetLook){
      const t=damping(delta,140);this.camera.position.lerp(this.targetCamera,t);this.controls.target.lerp(this.targetLook,t);
      if(this.camera.position.distanceTo(this.targetCamera)<.02){this.camera.position.copy(this.targetCamera);this.controls.target.copy(this.targetLook);this.targetCamera=null;this.targetLook=null;}
    }
    this.controls.dampingFactor=damping(delta,170);
    const changed=this.controls.update();this.renderer.render(this.scene,this.camera);
    if(changed||this.targetCamera||this.poses.pending(now))this.invalidate();
  };
  dispose(){cancelAnimationFrame(this.frame);document.removeEventListener('visibilitychange',this.onVisibility);this.resizeObserver.disconnect();this.controls.dispose();this.renderer.dispose();}
}
