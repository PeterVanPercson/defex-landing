import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { finishes as M } from './finishes.ts';
import { createCobot, ArmCable } from './cobot.ts';
import { plugHousing, contactCenters } from './mechanism.ts';
import { NEST, REJECT, TURNOVER } from './process.ts';

const geometry=new Map<string,T.BufferGeometry>();
function cached(key:string,make:()=>T.BufferGeometry){if(!geometry.has(key))geometry.set(key,make());return geometry.get(key)!;}
export function box(parent:T.Object3D,name:string,size:number[],pos:number[],mat:T.Material,r=.3){
  const radius=Math.min(r,...size.map(v=>v*.3));
  const g=cached(`b${size}/${radius}`,()=>radius?new RoundedBoxGeometry(size[0],size[1],size[2],2,radius):new T.BoxGeometry(...size as [number,number,number]));
  const o=new T.Mesh(g,mat);o.name=name;o.position.set(...pos as [number,number,number]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}
export function cyl(parent:T.Object3D,name:string,r:number,h:number,pos:number[],mat:T.Material,sides=32){
  const o=new T.Mesh(cached(`c${r}/${h}/${sides}`,()=>new T.CylinderGeometry(r,r,h,sides)),mat);o.name=name;o.rotation.x=Math.PI/2;o.position.set(...pos as [number,number,number]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}
function bolt(parent:T.Object3D,x:number,y:number,z:number,r=2.4){cyl(parent,'Machined washer',r+.65,.5,[x,y,z],M.silver);cyl(parent,'Socket screw',r,1.5,[x,y,z+.7],M.silver,24);cyl(parent,'Hex socket recess',r*.46,.08,[x,y,z+1.49],M.bore,6);}
function tube(parent:T.Object3D,points:number[][],r:number,mat:T.Material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number])));const o=new T.Mesh(new T.TubeGeometry(curve,40,r,8,false),mat);o.castShadow=true;parent.add(o);return o;}
const pcbMaterial=new T.MeshPhysicalMaterial({color:0x164c38,metalness:.12,roughness:.48,clearcoat:.25,clearcoatRoughness:.4});
const grey=new T.MeshStandardMaterial({color:0x969b99,metalness:.15,roughness:.5});
const solder=new T.MeshStandardMaterial({color:0xadada5,metalness:1,roughness:.28});
const ink=new T.MeshStandardMaterial({color:0xbdcab4,roughness:.85});

export function createCell(pins=6){
  const halfX=pins===8?9.5:7.5, extra=halfX-7.5;
  const root=new T.Group();root.name='Connector workcell';
  const bench=new T.Group();root.add(bench);
  box(bench,'Black tooling plate',[610,470,18],[15,28,-9],M.base,2);
  box(bench,'Machined plate edge',[611,471,2],[15,28,-19],M.dark,.5);
  box(bench,'Bench frame',[600,455,58],[15,28,-49],M.body,2);
  for(const x of [-252,282])for(const y of [-162,218]){
    box(bench,'Bench leg',[40,40,640],[x,y,-398],M.body,1.8);
    for(const d of [-1,1])box(bench,'Extrusion slot',[2,40.1,628],[x+d*11,y,-398],M.dark,.1);
    cyl(bench,'Leveling foot',27,8,[x,y,-720],M.rubber);
    bolt(bench,x,y,.2,4);
  }
  for(let x=-245;x<=270;x+=35)for(let y=-150;y<=230;y+=35){
    if((Math.abs(x)<64&&Math.abs(y)<50)||(x>148&&y>95)||(x<-64&&x>-165&&y>-145&&y<155))continue;
    cyl(bench,'Counterbored tooling hole',2.9,.12,[x,y,.08],M.edge,16);cyl(bench,'Threaded bore',2.4,.16,[x,y,.15],M.bore,16);
  }
  const fixture=new T.Group();root.add(fixture);
  box(fixture,'Black fixture base',[94,78,5],[0,0,2.5],M.body,.9);
  box(fixture,'Board nest insert',[66,54,3],[0,0,6.5],M.polymer,.35);
  for(const x of [-41,41])for(const y of [-33,33])bolt(fixture,x,y,5.1);
  const pcb=new T.Group();fixture.add(pcb);
  box(pcb,'Green FR4 board',[58,44,1.6],[0,0,8.8],pcbMaterial,.2);
  for(const x of [-25,25])for(const y of [-18,18]){cyl(pcb,'Board mounting ring',2,.07,[x,y,9.64],M.gold,24);cyl(pcb,'Board mounting hole',1.15,.1,[x,y,9.69],M.bore,20);}
  for(const [x,y] of [[-25,-18],[25,18]])cyl(fixture,'Locating dowel pin',1,6,[x,y,9],M.silver,24);
  for(const [x,y] of [[-34,8],[34,-8]]){
    box(fixture,'Fixture clamp',[14,9,3],[x,y,10.7],M.dark,.4);bolt(fixture,x,y,12.2,2.1);
    box(fixture,'Soft clamp shoe',[4,9,1],[x-Math.sign(x)*5,y,9.8],M.rubber,.15);
  }
  for(let i=0;i<pins;i++){
    const x=-8+i*3.2;
    box(pcb,'Copper trace',[.3,8,.04],[x,-11,9.62],M.gold,0);
    box(pcb,'PCB trace mask',[.2,8,.05],[x+.04,-11,9.65],pcbMaterial,0);
    cyl(pcb,'Plated via',.43,.05,[x,-15.2,9.65],M.gold,12);
    cyl(pcb,'Via bore',.21,.08,[x,-15.2,9.7],M.bore,12);
  }
  box(pcb,'Small controller package',[5.5,7,1],[17,6,10.15],M.polymer,.2);
  for(let i=0;i<pins;i++)for(const side of [-1,1])box(pcb,'Package lead',[1.1,.45,.3],[17+side*3.3,3.5+i,9.85],solder,.05);
  for(const [x,y] of [[-19,6],[-20,-6],[13,-10],[20,-10],[-12,14]]){
    box(pcb,'Passive component',[2.1,1,.8],[x,y,10],M.dark,.1);
    for(const s of [-1,1])box(pcb,'Solder fillet',[.45,1.1,.5],[x+s*1.1,y,9.84],solder,.12);
  }
  // Sparse board markings follow the components; no arbitrary lettering or extra pins.
  for(const [x,y] of [[17,6],[-19,6],[-20,-6]])for(const s of [-1,1])box(pcb,'Silkscreen footprint',[.14,4,.02],[x+s*4,y,9.68],ink,0);
  const header=new T.Group();root.add(header);header.name='Board header';
  const housing=new T.Group();header.add(housing);
  for(const [sz,ps] of [[[1.2,10.4,10.8],[-8.5-extra,0,15.7]],[[1.2,10.4,10.8],[8.5+extra,0,15.7]],[[15.8+2*extra,1.2,10.8],[0,4.65,15.7]],[[6.2+extra,1.2,10.8],[-4.8-extra/2,-4.65,15.7]],[[6.2+extra,1.2,10.8],[4.8+extra/2,-4.65,15.7]]])box(housing,'Molded PBT header',sz,ps,M.polymer,.2);
  box(housing,'Header seating floor',[17+2*extra,10.4,1.2],[0,0,10.5],M.polymer,.15);
  box(housing,'Latch catch',[3.2,1,1.3],[0,-5.2,13.5],M.polymer,.15);
  for(const [x,y] of contactCenters(pins)){cyl(header,'Gold header pin',.35,5.5,[x,y,13.3],M.gold,16);cyl(pcb,'Header solder pad',.9,.08,[x,y,9.7],solder,16);}

  const nest=new T.Group();nest.position.set(NEST[0],NEST[1],0);root.add(nest);
  box(nest,'Quick-change nest plate',[44,44,5],[0,0,2.5],M.body,.6);
  for(const x of [-17,17])for(const y of [-17,17])bolt(nest,x,y,5.2,1.8);
  for(const x of [-12,12])box(nest,'Nest outer guide',[4,22,7],[x,0,8.5],M.polymer,.6);
  for(const x of [-6.8,6.8])box(nest,'Housing support rail',[1.2,7.2,7],[x,0,8.5],M.polymer,.2);
  box(nest,'Housing recess',[16.8,8.9,.25],[0,0,5.15],M.bore,.3);
  for(const s of [-1,1])box(nest,'Nest locating ledge',[18,2,4],[0,s*5.5,14],M.polymer,.3);
  const comb=new T.Group();comb.position.set(-104,38,0);root.add(comb);
  box(comb,'Cable comb base',[26,14,8],[0,0,4],M.polymer,.6);
  for(let i=0;i<7;i++)box(comb,'Cable comb tooth',[1.3,13,7],[-9+i*3,0,10],M.polymer,.25);
  for(const s of [-1,1])bolt(comb,s*16,0,1,1.8);

  const tester=new T.Group();root.add(tester);
  box(tester,'Grey continuity tester',[78,57,35],[-104,110,18],grey,3);
  box(tester,'Tester gasket seam',[78.2,57.2,.65],[-104,110,15],M.rubber,.2);
  for(const x of [-136,-72])for(const y of [90,130])bolt(tester,x,y,35.7,1.4);
  const indicator=new T.MeshStandardMaterial({color:0x273c31,roughness:.28,metalness:.05,emissive:0x125832,emissiveIntensity:0});
  cyl(tester,'Indicator bezel',4.3,1.3,[-104,99,36],M.dark,32);cyl(tester,'Single pass indicator',3.2,1.1,[-104,99,36.9],indicator,32);
  box(tester,'Harness tester connector',[24,6,11],[-104,79,16],M.dark,.5);
  for(let i=0;i<pins;i++)cyl(tester,'Harness wire ferrule',.7,1,[-111.5+i*3,78,17],M.rubber,12);
  box(tester,'Board test connector',[12,7,7],[-63,118,13],M.dark,.3);
  tube(tester,[[-62,118,13],[-39,114,9],[-35,50,3],[-22,28,6],[-20,22,8]],1.7,M.rubber);
  const bin=new T.Group();bin.position.set(REJECT[0],REJECT[1],0);root.add(bin);
  box(bin,'Reject tray base',[69,53,3],[0,0,1.5],M.body,1);
  for(const s of [-1,1]){box(bin,'Reject tray wall',[2.5,53,22],[s*33,0,12],M.body,.7);box(bin,'Reject tray wall',[65,2.5,22],[0,s*25,12],M.body,.7);}
  box(bin,'Reject tray liner',[61,45,3],[0,0,4],M.rubber,.5);
  const eStop=new T.Group();eStop.position.set(235,-135,0);root.add(eStop);
  box(eStop,'Emergency stop base',[38,38,18],[0,0,9],new T.MeshStandardMaterial({color:0xc9aa35,roughness:.65}),2);
  cyl(eStop,'Emergency stop collar',12,5,[0,0,20],M.dark,40);
  cyl(eStop,'Emergency stop button',15,8,[0,0,26],new T.MeshStandardMaterial({color:0x8f3024,roughness:.65}),40);
  const turnover=new T.Group();turnover.name='Turnover cradle';turnover.position.set(TURNOVER[0],TURNOVER[1],0);root.add(turnover);
  box(turnover,'Turnover base',[52,56,5],[0,0,2.5],M.body,.7);
  for(const y of [-22,22]){box(turnover,'Turnover bearing support',[20,6,30],[0,y,20],M.silver,.6);const bearing=cyl(turnover,'Turnover bearing',7,8,[0,y,38],M.dark,40);bearing.rotation.x=0;}
  const rotator=new T.Group();rotator.position.z=TURNOVER[2];turnover.add(rotator);
  for(const y of [-12,12]){const shaft=cyl(rotator,'Cradle axle',3,22,[0,y,0],M.edge,32);shaft.rotation.x=0;}
  const cradleJaws:T.Group[]=[];
  for(const y of [-6.3,6.3]){
    const jaw=new T.Group();rotator.add(jaw);cradleJaws.push(jaw);
    box(jaw,'Turnover clamping jaw',[11,3,10],[0,y,0],M.dark,.5);
    for(const x of [-4,4])box(jaw,'Housing turnover pad',[2,1.7,8],[x,y-Math.sign(y)*1.6,0],M.rubber,.2);
  }
  box(turnover,'Turnover actuator',[22,22,22],[0,39,38],M.body,1);
  tube(turnover,[[10,39,38],[18,42,28],[20,40,4],[12,26,2]],1.2,M.rubber);
  const arm=createCobot(M);arm.root.scale.setScalar(5);root.add(arm.root);
  const tool=createPrecisionTool(extra);root.add(tool.root);
  const plug=createPlug(pins);root.add(plug);
  const wires=Array.from({length:pins},(_,i)=>{const mat=new T.MeshStandardMaterial({color:[0x9c6534,0x2c3234,0xc4b99e,0x697960,0x596c82,0x864d49,0x9c9b82,0x415451][i],roughness:.65});const w=new ArmCable(mat,7,.48,96);w.mesh.name=`Harness wire ${i+1}`;root.add(w.mesh);return w;});
  return {root,bench,fixture,header,housing,pcb,nest,tester,bin,arm,tool,plug,wires,indicator,turnover,rotator,cradleJaws,pins};
}
export function createPlug(pins=6){
  const halfX=pins===8?9.5:7.5;
  const group=new T.Group();group.name='Six-wire connector';
  const material=M.ivory.clone();
  const body=new T.Mesh(plugHousing(halfX,3.6,pins),material);body.geometry.scale(1,1,12/7.8);body.position.z=-3.9;body.castShadow=body.receiveShadow=true;body.name='Nylon connector housing';group.add(body);
  for(const [x,y] of contactCenters(pins)){
    const ring=new T.Mesh(new T.RingGeometry(.36,.57,16),M.gold);ring.position.set(x,y,-4.01);ring.rotation.x=Math.PI;group.add(ring);
    cyl(group,'Wire entry seal',.62,.18,[x,y,8.25],M.ivory,20);
  }
  for(const s of [-1,1])box(group,'Molded keying rib',[.5,.45,5],[s*6.3,-3.65,-.3],M.ivory,.1);
  box(group,'Free latch beam',[2,.55,5],[0,-4,-.3],M.ivory,.12);box(group,'Latch hook',[2.3,1,1],[0,-4.35,-2.6],M.ivory,.12);
  return group;
}
function createPrecisionTool(extra=0){
  const root=new T.Group();root.name='Parallel gripper and custom fingers';
  cyl(root,'Tool coupling',19,7,[0,0,76.5],M.edge,64);
  cyl(root,'Six-axis force sensor',18,12,[0,0,67],M.dark,64);
  cyl(root,'Sensor face',18.5,1,[0,0,60.5],M.silver,64);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;bolt(root,Math.cos(a)*15,Math.sin(a)*15,79.5,1.4);}
  box(root,'Black parallel gripper',[53,31,24],[0,0,47.5],M.body,1.4);
  box(root,'Ground guide rail',[42,25,3],[0,0,34.5],M.dark,.3);
  box(root,'Gripper guide slot',[42,.7,3],[0,-15.62,44],M.bore,.2);
  for(const x of [-23,23])for(const z of [41,54]){
    const head=cyl(root,'Gripper front fastener',1.6,.5,[x,-15.7,z],M.silver,24);head.rotation.x=0;
    const recess=cyl(root,'Gripper fastener socket',.7,.07,[x,-16,z],M.dark,6);recess.rotation.x=0;
  }
  const fingers=[-1,1].map(s=>{
    const g=new T.Group();g.position.x=s*extra;g.userData.extra=s*extra;root.add(g);
    box(g,'Moving jaw carriage',[11,20,7],[s*14,0,30],M.dark,.45);
    box(g,'Brushed aluminium finger',[5.4,10,19],[s*13,0,18.5],M.silver,.5);
    box(g,'Custom fingertip',[5.1,6.6,2],[s*10.5,0,7.5],M.silver,.32);
    box(g,'Housing contact face',[.35,5.2,1.8],[s*7.68,0,7.4],M.rubber,.05);
    box(g,'Insertion back stop',[1.6,2,1.2],[s*6.9,-2,8.8],M.silver,.12);
    for(const z of [16,24]){const b=cyl(g,'Finger mounting screw',1.5,.4,[s*13,-5.2,z],M.dark,20);b.rotation.x=0;}
    return g;
  });
  const camera=new T.Group();root.add(camera);
  box(camera,'Wrist camera bracket',[18,5,4],[29,3,61],M.silver,.3);
  box(camera,'Wrist camera',[16,17,22],[34,5,45],M.dark,1.2);
  cyl(camera,'Camera lens barrel',5.8,6,[34,5,31],M.dark,40);
  cyl(camera,'Camera lens glass',4.3,.4,[34,5,27.8],new T.MeshPhysicalMaterial({color:0x14272d,metalness:.25,roughness:.06,clearcoat:1}),40);
  tube(root,[[34,12,51],[31,21,58],[23,19,63],[24,16,70]],1.1,M.rubber);
  const gland=new T.Vector3(28,9,50);
  const g=cyl(root,'Gripper cable gland',3,6,gland.toArray(),M.edge,32);g.rotation.z=Math.PI/2;g.rotation.x=0;
  return {root,fingers,gland};
}

export function disposeCell(root:T.Object3D){
  const shared=new Set<T.Material>([...Object.values(M),pcbMaterial,grey,solder,ink]);
  const cachedGeometry=new Set(geometry.values()),seenGeometry=new Set<T.BufferGeometry>(),seenMaterials=new Set<T.Material>();
  root.traverse(o=>{if(o instanceof T.Mesh){if(!cachedGeometry.has(o.geometry))seenGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!shared.has(m))seenMaterials.add(m);}});
  seenGeometry.forEach(g=>g.dispose());seenMaterials.forEach(m=>m.dispose());
}

export function createHall(){
  const hall=new T.Group();hall.name='Empty factory hall';
  const plaster=new T.MeshStandardMaterial({color:0xaab2ae,roughness:.9});
  const concrete=new T.MeshStandardMaterial({color:0x6a7472,roughness:.55,metalness:.04});
  box(hall,'Factory floor',[14000,18000,30],[0,1800,-750],concrete,0);
  box(hall,'Far wall',[14000,100,5800],[0,8500,2150],plaster,0);
  const beam=new T.MeshStandardMaterial({color:0x9da5a4,roughness:.7,metalness:.2});
  const windowMat=new T.MeshBasicMaterial({color:0xe5efef,toneMapped:false});
  for(const x of [-4200,-2100,0,2100,4200]){
    for(const y of [2100,4500,6900]){
      box(hall,'Factory column',[95,110,5000],[x,y,1750],plaster,4);
      box(hall,'Column footing',[150,160,180],[x,y,-645],plaster,3);
      box(hall,'Roof beam',[4400,90,110],[x,y,4230],beam,0);
    }
    box(hall,'High daylight window',[1450,20,950],[x,8435,2400],windowMat,0);
    for(let i=-2;i<=2;i++)box(hall,'Window mullion',[18,23,950],[x+i*290,8418,2400],beam,0);
    box(hall,'Window transom',[1450,24,16],[x,8418,2400],beam,0);
  }
  for(const x of [-4600,4600])box(hall,'Side wall',[100,18000,5800],[x,1800,2150],plaster,0);
  return hall;
}
