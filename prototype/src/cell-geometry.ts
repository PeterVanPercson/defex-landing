import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { finishes as M } from './finishes.ts';
import { createCobot, ArmCable } from './cobot.ts';
import { plugHousing, contactCenters } from './mechanism.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HEADER, NEST, REJECT, TURNOVER, UPCAM, processFrame } from './process.ts';
import { HARNESS_POINTS, WIRE_RADIUS, dressHarness, setHarnessObstacles } from './harness.ts';
import { CHAMFER, CYCLE_END, GRIP_RAISE, INDEX_START, LIFT_DOWN, LINE_X, PALLET_PITCH, PALLET_SIZE, PALLET_Y, SHROUD_CLEARANCE, TOTE_SLOTS } from './line.ts';
import type { LineFrame } from './line.ts';

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
const jig=new T.MeshStandardMaterial({color:0x6d7174,metalness:.3,roughness:.42,name:'Cast jig plate'});
const top=new T.MeshStandardMaterial({color:0x3a3d40,roughness:.6,metalness:0,envMapIntensity:1,name:'Phenolic worktop'});
const cabinet=new T.MeshStandardMaterial({color:0x44494c,roughness:.5,metalness:.2,name:'Powder coated steel'});
const lensGlass=new T.MeshPhysicalMaterial({color:0x14272d,metalness:.25,roughness:.06,clearcoat:1,name:'Coated lens glass'});
const windowGlass=new T.MeshPhysicalMaterial({color:0xeef6f8,metalness:0,roughness:.03,transparent:true,opacity:.1,depthWrite:false,envMapIntensity:.9,name:'Protective window glass'});
// Twelve SMD LEDs behind a frosted diffuser: when lit it glows evenly with faint beads over each LED.
const ledBeads=(()=>{
  const n=64,data=new Uint8Array(n*n*4);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x=(i+.5)/n*2-1,y=(j+.5)/n*2-1,r=Math.hypot(x,y),a=Math.atan2(y,x),d=Math.abs(((a/(Math.PI*2)*12)%1+1)%1-.5)*2;
    const v=Math.round(255*Math.min(1,(.74+.26*Math.exp(-(((1-d)*3.2)**2)))*Math.min(1,Math.max(0,1-Math.abs(r-.81)/.2))*1.06));
    const k=(j*n+i)*4;data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;
  }
  const t=new T.DataTexture(data,n,n);t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;
})();
// Off: a dark frosted diffuser with a soft sheen. Lit: cool white, tone mapped so it glows without clipping.
export function ringLightMaterial(beads=true){
  return new T.MeshStandardMaterial({color:0x1b1e20,roughness:.42,metalness:0,emissive:0xdff3ff,emissiveMap:beads?ledBeads:null,emissiveIntensity:0,name:'LED ring light diffuser'});
}
// A lathe about local Y stood on Z: profile points are [radius, z].
function ring(parent:T.Object3D,name:string,profile:number[][],pos:number[],mat:T.Material,sides=48){
  const o=new T.Mesh(cached(`l${profile}/${sides}`,()=>new T.LatheGeometry(profile.map(([r,z])=>new T.Vector2(r,z)),sides)),mat);
  o.name=name;o.rotation.x=Math.PI/2;o.position.set(...pos as [number,number,number]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}
function flatRing(parent:T.Object3D,name:string,r0:number,r1:number,pos:number[],mat:T.Material,down=false){
  const o=new T.Mesh(cached(`r${r0}/${r1}`,()=>new T.RingGeometry(r0,r1,48,1)),mat);o.name=name;o.position.set(...pos as [number,number,number]);if(down)o.rotation.x=Math.PI;o.receiveShadow=true;parent.add(o);return o;
}
// The upward-looking grip-check camera: a compact 18 mm board camera on a machined adapter plate,
// an M12 lens inside a low annular ring light, a protective window on top at UPCAM[2], and its M8 cable
// clipped along the plate to a grommet in the worktop.
function createUpCamera(){
  const [cx,cy,top]=UPCAM;
  const g=new T.Group();g.name='Grip check camera';g.position.set(cx,cy,0);
  const plate=1.2,ringH=Math.min(3.4,top*.34),bodyTop=Math.max(plate+2.6,top-ringH),front=.8,bodyH=bodyTop-plate-front;
  box(g,'Camera adapter plate',[22,22,plate],[0,0,plate/2],M.silver,.5);
  for(const x of [-9.9,9.9])for(const y of [-9.9,9.9]){cyl(g,'Adapter cap screw',.85,.7,[x,y,plate+.35],M.dark,20);cyl(g,'Cap screw socket',.4,.06,[x,y,plate+.71],M.bore,6);}
  box(g,'Board camera housing',[18,18,bodyH],[0,0,plate+bodyH/2],M.base,.7);
  box(g,'Camera front plate',[18,18,front],[0,0,bodyTop-front/2],M.dark,.35);
  for(const s of [-1,1])for(const k of [.33,.66]){
    box(g,'Housing cooling groove',[14,.2,.22],[0,s*9.02,plate+bodyH*k],M.bore,0);
    box(g,'Housing cooling groove',[.2,14,.22],[s*9.02,0,plate+bodyH*k],M.bore,0);
  }
  const status=new T.MeshStandardMaterial({color:0x163a22,emissive:0x2bd36a,emissiveIntensity:.8,roughness:.3,name:'Camera power LED'});
  box(g,'Camera power LED',[1.1,.16,.7],[5.5,-9.05,bodyTop-front-.8],status,0);
  // M8 connector on the -x face, its cable away from the turnover cradle.
  const zc=plate+bodyH/2;
  const socket=cyl(g,'M8 camera socket',1.9,1,[-9.5,0,zc],M.silver,24);socket.rotation.set(0,0,Math.PI/2);
  const nut=cyl(g,'M8 coupling nut',2.25,2,[-11,0,zc],M.edge,12);nut.rotation.set(0,0,Math.PI/2);
  const boot=cyl(g,'M8 cable overmould',1.75,4,[-14,0,zc],M.rubber,24);boot.rotation.set(0,0,Math.PI/2);
  // The ring light: a black housing with a bezel, the LED diffuser in its floor, a baffle round the lens.
  const floor=top-1.1;
  ring(g,'Ring light housing',[[4.5,bodyTop],[8.5,bodyTop],[8.5,top-.3],[8.42,top-.08],[8.15,top],[7.9,top],[7.9,floor],[4.9,floor],[4.9,top-.7],[4.5,top-.7],[4.5,bodyTop]],[0,0,0],M.dark,64);
  const light=ringLightMaterial();
  flatRing(g,'Ring light LEDs',4.95,7.85,[0,0,floor+.02],light);
  cyl(g,'M12 lens barrel',4.4,top-.8-bodyTop,[0,0,(top-.8+bodyTop)/2],M.dark,40);
  flatRing(g,'Lens retaining ring',2.7,4.4,[0,0,top-.79],M.dark);
  flatRing(g,'Lens front chamfer',3.6,3.75,[0,0,top-.785],M.edge);
  cyl(g,'Camera lens glass',2.7,.12,[0,0,top-.8],lensGlass,40);
  const glass=cyl(g,'Protective window',7.9,.3,[0,0,top-.35],windowGlass,64);glass.castShadow=false;
  tube(g,[[-16,0,zc],[-18.6,-.3,zc-.6],[-20.5,-2.2,1.5],[-21,-8,1.3],[-21,-40,1.3],[-21,-80,1.3],[-21,-108.6,1.3],[-21,-112.6,-.2],[-21,-114.3,-4],[-21,-114.6,-9],[-21,-117,-10.7],[-21,-132,-10.7],[-21,-141,-11],[-21,-144,-13.5]],1.25,M.rubber);
  for(const y of [-30,-84]){
    box(g,'Cable clip base',[10,4,.6],[-21,y,.3],M.dark,.2);
    box(g,'Cable clip saddle',[3.6,4,3.3],[-21,y,1.65],M.dark,.5);
    for(const x of [-25,-17])cyl(g,'Clip screw',.8,.6,[x,y,.9],M.silver,16);
  }
  ring(g,'Worktop cable grommet',[[5.4,-12],[5.4,-11.3],[5,-10.9],[3.4,-10.9],[3,-11.2],[3,-12]],[-21,-144,0],M.rubber,40);
  cyl(g,'Grommet bore',2.95,.1,[-21,-144,-11.9],M.bore,32);
  return {group:g,light};
}

const palletMetal=new T.MeshStandardMaterial({color:0x7b8186,metalness:.55,roughness:.42,name:'Anodised pallet plate'});
const linerMat=new T.MeshStandardMaterial({color:0x1b1d1e,roughness:.9,name:'Lift well liner'});
const toteMat=new T.MeshStandardMaterial({color:0x2c2e30,roughness:.78,name:'Conductive tote'});
const esdLabel=new T.MeshStandardMaterial({color:0xd6ae1c,roughness:.6,name:'ESD label'});
const rejectRed=new T.MeshStandardMaterial({color:0xa3241c,roughness:.46,metalness:.08,name:'Red powder coat'});
const rejectLid=new T.MeshStandardMaterial({color:0x7e1a14,roughness:.5,metalness:.08,name:'Red powder coat lid'});
const tagLabel=new T.MeshStandardMaterial({color:0xe6e8e3,roughness:.7,name:'Tag label'});
const sharedMaterials=[pcbMaterial,grey,solder,ink,jig,top,cabinet,lensGlass,windowGlass,palletMetal,linerMat,toteMat,esdLabel,rejectRed,rejectLid,tagLabel];

// The header shroud's walls: 1.2 thick, 7.7 tall from z 10.3, with a CHAMFER x 45 degree lead-in on the inner top edge.
// Built facing +x with the inner face at x 0 and run along y; the caller turns it about z.
function shroudWall(parent:T.Object3D,length:number,pos:number[],turn:number){
  const g=cached(`w${length}`,()=>{
    const s=new T.Shape();s.moveTo(0,0);s.lineTo(1.2,0);s.lineTo(1.2,7.7);s.lineTo(CHAMFER,7.7);s.lineTo(0,7.7-CHAMFER);s.closePath();
    const e=new T.ExtrudeGeometry(s,{depth:length,bevelEnabled:false,curveSegments:1,steps:1});e.rotateX(Math.PI/2);e.translate(0,length/2,0);return e;
  });
  const o=new T.Mesh(g,M.polymer);o.name='Molded PBT header';o.position.set(...pos as [number,number,number]);o.rotation.z=turn;o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}

// The board and its header. The pcb goes into `pcbParent`, the header into `headerParent`.
function buildBoard(pcbParent:T.Object3D,headerParent:T.Object3D,pins:number,extra:number){
  const pcb=new T.Group();pcb.name='Circuit board';pcbParent.add(pcb);
  box(pcb,'Green FR4 board',[58,44,1.6],[0,0,8.8],pcbMaterial,.2);
  for(const x of [-25,25])for(const y of [-18,18]){cyl(pcb,'Board mounting ring',2,.07,[x,y,9.64],M.gold,24);cyl(pcb,'Board mounting hole',1.15,.1,[x,y,9.69],M.bore,20);}
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
  const header=new T.Group();headerParent.add(header);header.name='Board header';
  const housing=new T.Group();header.add(housing);
  // The opening leaves SHROUD_CLEARANCE round the housing on every side; a latch slot splits the -y wall.
  const ix=7.5+extra+SHROUD_CLEARANCE,iy=3.6+SHROUD_CLEARANCE,ox=ix+1.2,oy=iy+1.2,slot=1.6;
  for(const s of [-1,1])shroudWall(housing,2*oy,[s*ix,0,10.3],s>0?0:Math.PI);
  shroudWall(housing,2*ix,[0,iy,10.3],Math.PI/2);
  for(const s of [-1,1])shroudWall(housing,ix-slot,[s*(ix+slot)/2,-iy,10.3],-Math.PI/2);
  box(housing,'Header seating floor',[2*ox,2*oy,1.2],[0,0,10.5],M.polymer,.15);
  // The catch bridges the latch slot outside the wall, just under the shroud's top.
  box(housing,'Latch catch',[2*slot+2,1,1.2],[0,-oy-.5,17],M.polymer,.15);
  for(const [x,y] of contactCenters(pins)){cyl(header,'Gold header pin',.35,5.5,[x,y,13.3],M.gold,16);cyl(pcb,'Header solder pad',.9,.08,[x,y,9.7],solder,16);}
  return {pcb,header,housing};
}

// Everything a pallet carries apart from the product: the plate, the board fixture, the housing nest, the cable
// comb and the test adapter the far end of the harness plugs into. Pallet-local coordinates equal the cell's at WORK.
function buildPalletHardware(parent:T.Object3D,pins:number){
  const plate=new T.Group();plate.name='Pallet';parent.add(plate);
  box(plate,'Anodised pallet plate',[...PALLET_SIZE],[LINE_X.work,PALLET_Y,-PALLET_SIZE[2]/2],palletMetal,1.2);
  // Hardened bushings for the station's locating pins, and the pallet's RFID tag.
  for(const [x,y] of [[-160,-27],[40,68]]){flatRing(plate,'Locating bushing',2.6,4.6,[x,y,.03],M.silver);cyl(plate,'Locating bushing bore',2.6,.1,[x,y,-.03],M.bore,24);}
  box(plate,'Pallet RFID tag',[14,9,.5],[-135,-28,.25],M.dark,.2);box(plate,'RFID tag label',[10,5,.08],[-135,-28,.54],tagLabel,0);
  const fixture=new T.Group();fixture.name='Board fixture';parent.add(fixture);
  box(fixture,'Black fixture base',[94,72,5],[0,0,2.5],M.body,.9);
  box(fixture,'Board nest insert',[66,54,3],[0,0,6.5],M.polymer,.35);
  for(const x of [-41,41])for(const y of [-32,32])bolt(fixture,x,y,5.1);
  for(const [x,y] of [[-25,-18],[25,18]])cyl(fixture,'Locating dowel pin',1,6,[x,y,9],M.silver,24);
  for(const [x,y] of [[-34,8],[34,-8]]){
    box(fixture,'Fixture clamp',[14,9,3],[x,y,10.7],M.dark,.4);bolt(fixture,x,y,12.2,2.1);
    box(fixture,'Soft clamp shoe',[4,9,1],[x-Math.sign(x)*5,y,9.8],M.rubber,.15);
  }
  const nest=new T.Group();nest.name='Housing nest';nest.position.set(NEST[0],NEST[1],0);parent.add(nest);
  box(nest,'Quick-change nest plate',[44,44,5],[0,0,2.5],M.body,.6);
  for(const x of [-17,17])for(const y of [-17,17])bolt(nest,x,y,5.2,1.8);
  // The guides stand 0.1 mm off the housing ends and rise past its lower edge, so they locate X.
  for(const x of [-8.6,8.6])box(nest,'Nest end guide',[2,11,11],[x,0,10.5],M.polymer,.4);
  for(const x of [-6.8,6.8])box(nest,'Housing support rail',[1.2,7.2,7],[x,0,8.5],M.polymer,.2);
  box(nest,'Housing recess',[16.8,8.9,.25],[0,0,5.15],M.bore,.3);
  // Both ledges are split: the near one clears the latch, the far one lets the wires pass under the face-up housing.
  for(const x of [-5.3,5.3])box(nest,'Nest locating ledge',[7.4,2,4],[x,-5.5,14],M.polymer,.3);
  for(const x of [-7.5,7.5])box(nest,'Nest locating ledge',[3,2,4],[x,5.5,14],M.polymer,.3);
  const comb=new T.Group();comb.name='Cable comb';comb.position.set(-104,38,0);parent.add(comb);
  box(comb,'Cable comb base',[pins*3+8,14,8],[0,0,4],M.polymer,.6);
  for(let i=0;i<=pins;i++)box(comb,'Cable comb tooth',[1.3,13,7],[-pins*1.5+i*3,0,10],M.polymer,.25);
  for(const s of [-1,1])bolt(comb,s*16,0,1,1.8);
  // The far end of the harness plugs in here; the tester's dock head contacts its rear face (y 74).
  const adapter=new T.Group();adapter.name='Test adapter';parent.add(adapter);
  box(adapter,'Pallet tester connector',[30,10,14],[-104,69,7],M.dark,.5);
  for(let i=0;i<pins;i++){const f=cyl(adapter,'Adapter wire ferrule',.7,1,[-104+(i-(pins-1)/2)*3,63.5,9],M.rubber,12);f.rotation.x=0;}
  for(const s of [-1,1])cyl(adapter,'Adapter screw',1.1,.6,[-104+s*12,69,14.3],M.silver,16);
  return {plate,fixture,nest,comb,adapter};
}

// A pallet's product as it rides the line: the board with its header, and the harness with its housing either
// fresh in the nest or seated on the header. Static: the wires are dressed once, merged into one mesh.
const WIRE_COLOURS=[0x9c6534,0x2c3234,0xc4b99e,0x697960,0x596c82,0x864d49,0x9c9b82,0x415451];
function staticHarness(parent:T.Object3D,pins:number,plug:T.Vector3,turn:number){
  const points=Array.from({length:HARNESS_POINTS},()=>new T.Vector3()),contacts=contactCenters(pins),parts:T.BufferGeometry[]=[];
  for(let i=0;i<pins;i++){
    dressHarness(points,plug,turn,0,contacts[i],i,pins);
    const cable=new ArmCable(M.rubber,HARNESS_POINTS,WIRE_RADIUS,320);cable.update(points);
    const g=cable.geometry,n=g.attributes.position.count,c=new T.Color(WIRE_COLOURS[i]),a=new Float32Array(n*3);
    for(let k=0;k<n;k++)c.toArray(a,k*3);g.setAttribute('color',new T.BufferAttribute(a,3));parts.push(g);
  }
  const merged=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());
  const o=new T.Mesh(merged,new T.MeshStandardMaterial({vertexColors:true,roughness:.65}));o.name='Harness wires';o.castShadow=true;o.receiveShadow=true;parent.add(o);
  return o;
}

export interface PalletUnit {group:T.Group;hardware:T.Group;board:T.Group;harness:T.Group;fades:{board:T.Material[];harness:T.Material[]};shown:[number,number]}
// One of the static units on the line (UNLOAD, QUEUE, LOAD): the pallet's hardware plus its own copy of the product,
// with its own materials so the product can fade in and out.
function createUnit(pins:number,extra:number,seated:boolean):PalletUnit{
  const group=new T.Group();group.name=seated?'Finished unit':'Next unit';
  const hardware=new T.Group();hardware.name='Unit pallet';group.add(hardware);buildPalletHardware(hardware,pins);
  const board=new T.Group();board.name='Unit board';group.add(board);
  const {header}=buildBoard(board,board,pins,extra);header.position.set(HEADER[0],HEADER[1],0);
  const harness=new T.Group();harness.name='Unit harness';group.add(harness);
  const end=processFrame(INDEX_START,'pass'),at=seated?new T.Vector3(...end.plug):new T.Vector3(...NEST),turn=seated?end.rotation:Math.PI;
  const plug=createPlug(pins);plug.position.copy(at);plug.rotation.y=turn;harness.add(plug);
  staticHarness(harness,pins,at,turn);
  const own=(g:T.Object3D)=>{const copies=new Map<T.Material,T.Material>();g.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.Material;if(!copies.has(m))copies.set(m,m.clone());o.material=copies.get(m)!;}});return [...copies.values()];};
  return {group,hardware,board,harness,fades:{board:own(board),harness:own(harness)},shown:[1,1]};
}
function fadeTo(materials:T.Material[],group:T.Object3D,v:number){
  group.visible=v>.002;
  for(const m of materials){const see=v<.998;if(m.transparent!==see){m.transparent=see;m.needsUpdate=true;}m.opacity=v;m.depthWrite=!see;}
  group.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=v>.5;});
}

// The lift at each end of the line: a deck carrying its own belt sections on a column out of the cabinet. It lowers
// pallets to the return tunnel under the bench and brings them back up; up, its deck closes the well.
function createLift(parent:T.Object3D,x:number){
  const g=new T.Group();g.name='Pallet lift';parent.add(g);
  for(const y of [-27,68])box(g,'Lift belt',[226,12,4],[x,y,-10],M.rubber,.8);
  box(g,'Lift deck',[224,110,4],[x,PALLET_Y,-14],M.body,.8);
  cyl(g,'Lift column',11,70,[x,PALLET_Y,-51],M.edge,40);
  return g;
}

// The outgoing tote at the left end: conductive charcoal, a slotted insert, each slot holding a passed board on
// edge with its plug seated and its harness coiled beside it.
function createTote(){
  const g=new T.Group();g.name='Outgoing tote';g.position.set(-385,-150,-12);
  const shell=new T.Group();g.add(shell);
  box(shell,'Tote floor',[150,120,3],[0,0,1.5],toteMat,1);
  for(const s of [-1,1]){box(shell,'Tote wall',[3,120,70],[s*73.5,0,35],toteMat,1);box(shell,'Tote wall',[144,3,70],[0,s*58.5,35],toteMat,1);}
  for(const s of [-1,1])box(shell,'Tote rim',[150,5,2],[0,s*58.5,70],toteMat,.8);
  box(shell,'ESD label',[26,.3,18],[38,-60.15,48],esdLabel,0);
  box(shell,'Slotted insert',[142,112,20],[0,0,13],toteMat,1);
  for(let k=0;k<=TOTE_SLOTS;k++)box(shell,'Insert divider',[1.2,104,8],[-64+16*k,0,27],toteMat,.3);
  const slots:{mesh:T.Mesh;material:T.MeshStandardMaterial}[]=[];
  const tint=(geometry:T.BufferGeometry,color:number,x:number,y:number,z:number)=>{geometry.translate(x,y,z);const n=geometry.attributes.position.count,c=new T.Color(color),a=new Float32Array(n*3);for(let k=0;k<n;k++)c.toArray(a,k*3);geometry.setAttribute('color',new T.BufferAttribute(a,3));return geometry;};
  for(let i=0;i<TOTE_SLOTS;i++){
    const x=-56+16*i,base=23,parts=[
      tint(new T.BoxGeometry(1.6,58,44),0x1d5a42,x-5,-20,base+22),
      tint(new T.BoxGeometry(7.7,17.7,9.9),0x1b1d1f,x+.35,-18.8,base+22.6),
      tint(new T.BoxGeometry(12.3,15,7.2),0xdedcd3,x+3.4,-18.8,base+22.6),
      tint(new T.TorusGeometry(14,2.2,10,48).rotateY(Math.PI/2),0x3d4648,x+4,30,base+21),
      tint(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(x+8.4,-18.8,base+22.6),new T.Vector3(x+7.6,-6,base+26),new T.Vector3(x+5,6,base+27),new T.Vector3(x+4,16,base+23)]),24,1.3,8),0x3d4648,0,0,0),
    ];
    const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.55});
    const mesh=new T.Mesh(mergeGeometries(parts,false)!,material);parts.forEach(p=>p.dispose());
    mesh.name='Packed unit';mesh.castShadow=mesh.receiveShadow=true;mesh.visible=false;g.add(mesh);slots.push({mesh,material});
  }
  return {group:g,shell,slots};
}

// Rejects go into a locked red bin; only a person with the key empties it.
function createRejectBin(){
  const g=new T.Group();g.name='Locked reject bin';g.position.set(-235,-230,-12);
  box(g,'Reject bin body',[70,60,80],[0,0,40],rejectRed,2);
  box(g,'Reject bin lid',[73,63,4],[0,0,82],rejectLid,1.2);
  box(g,'Reject posting slot',[44,9,.3],[0,4,84.1],M.bore,0);
  box(g,'Bin hasp',[9,2,15],[0,-31.4,74],M.silver,.4);
  box(g,'Padlock body',[12,5,11],[0,-33.5,63],M.silver,.8);
  const shackle=new T.Mesh(cached('padlock',()=>new T.TorusGeometry(3.6,.8,10,24,Math.PI)),M.edge);shackle.name='Padlock shackle';shackle.position.set(0,-33.5,68.5);shackle.rotation.x=Math.PI/2;shackle.castShadow=true;g.add(shackle);
  box(g,'Bin label',[34,.3,16],[0,-30.15,46],tagLabel,0);
  return g;
}

export function createCell(pins=6){
  const halfX=pins===8?9.5:7.5, extra=halfX-7.5;
  const root=new T.Group();root.name='Connector workcell';
  const bench=new T.Group();root.add(bench);
  // The jig plate is split round the line: the pallets run in the band y -36.5..77.5 between its two halves.
  box(bench,'Aluminium jig plate',[570,123.5,12],[-17,-98.25,-6],jig,1);
  box(bench,'Aluminium jig plate',[570,142.5,12],[-17,148.75,-6],jig,1);
  for(const x of [-292,258])for(const y of [-150,210])bolt(bench,x,y,.1,3.2);
  // The worktop is built round the two lift wells, each lined dark. Between them, under the conveyor, runs the
  // return tunnel: empty pallets go down at the left, back along it under the bench and up at the right. The wells
  // and the tunnel go WELL_FLOOR deep, so a lowered pallet and everything it carries pass under the worktop.
  for(const [x0,x1,y0,y1,z0,r] of [[-460,540,-320,-36.5,-42,2],[-460,540,77.5,380,-42,2],[-460,-406,-36.5,77.5,-42,.5],[-178,290,-36.5,77.5,TUNNEL_TOP,.5],[518,540,-36.5,77.5,-42,.5]])box(bench,'Phenolic worktop',[x1-x0,y1-y0,-12-z0],[(x0+x1)/2,(y0+y1)/2,(z0-12)/2],top,r);
  box(bench,'Return tunnel liner',[468,114,.6],[56,PALLET_Y,WELL_FLOOR+.3],linerMat,0);
  // The return conveyor along the tunnel floor: its belts meet the lift belts when a lift is down.
  const rail=LIFT_DOWN-12-(WELL_FLOOR+.6);
  for(const y of [-27,68]){box(bench,'Return conveyor rail',[468,8,rail],[56,y,WELL_FLOOR+.6+rail/2],M.edge,.3);box(bench,'Return conveyor belt',[468,12,4],[56,y,LIFT_DOWN-10],M.rubber,.8);}
  for(const [x0,x1,tunnel] of [[-406,-178,1],[290,518,-1]]){
    const cx=(x0+x1)/2,w=x1-x0;
    box(bench,'Lift well liner',[w,114,.6],[cx,PALLET_Y,WELL_FLOOR+.3],linerMat,0);
    for(const s of [-1,1]){
      // The side liners leave the pallet 0.2 mm a side; their backs sit just inside the worktop's cut faces.
      box(bench,'Lift well liner',[w,.3,-12.2-WELL_FLOOR-.6],[cx,PALLET_Y+s*56.85,(WELL_FLOOR+.6-12.2)/2],linerMat,0);
      // The wall on the tunnel side stops short of the floor: that is the tunnel's mouth.
      const z0=s===tunnel?TUNNEL_TOP:WELL_FLOOR+.6;box(bench,'Lift well liner',[1,112,-12.2-z0],[cx+s*(w/2-.5),PALLET_Y,(z0-12.2)/2],linerMat,0);
    }
  }
  // The conveyor: two belts between the lifts, side guides where the jig plate does not already guide the pallets.
  for(const y of [-27,68])box(bench,'Conveyor belt',[468,12,4],[56,y,-10],M.rubber,.8);
  for(const y of [-38.5,79.5])for(const [x0,x1] of [[-430,-302],[268,530]])box(bench,'Conveyor side guide',[x1-x0,4,12],[(x0+x1)/2,y,-6],M.silver,.6);
  const lifts={unload:createLift(bench,LINE_X.unload),load:createLift(bench,LINE_X.load)};
  // The cabinet's top steps down under the line band for the wells and the tunnel; an apron closes it round them.
  box(bench,'Cabinet body',[970,660,672+WELL_FLOOR],[40,40,(WELL_FLOOR-672)/2],cabinet,3);
  for(const [x0,x1,y0,y1] of [[-445,525,-290,-36.5],[-445,525,77.5,370],[-445,-406,-36.5,77.5],[518,525,-36.5,77.5]])box(bench,'Cabinet apron',[x1-x0,y1-y0,-42-WELL_FLOOR],[(x0+x1)/2,(y0+y1)/2,(WELL_FLOOR-42)/2],cabinet,0);
  box(bench,'Cabinet plinth',[930,600,60],[40,50,-705],M.rubber,1);
  for(const [x,w] of [[-210,450],[275,450]])for(const [z,h] of [[-110,120],[-240,120],[-400,180],[-590,180]]){
    box(bench,'Drawer front',[w,6,h],[x+5,-292,z],cabinet,2.5);
    box(bench,'Drawer pull',[w*.45,10,8],[x+5,-299,z+h/2-22],M.silver,3);
    box(bench,'Drawer label slot',[46,3,16],[x+5-w*.36,-296,z+h/2-22],M.dark,1);
  }
  // The live pallet at WORK: the unit the robot is working on.
  const pallet=new T.Group();pallet.name='Live pallet';root.add(pallet);
  const {plate,fixture,nest,comb,adapter}=buildPalletHardware(pallet,pins);
  const {pcb,header,housing}=buildBoard(fixture,pallet,pins,extra);

  const tester=new T.Group();root.add(tester);
  box(tester,'Grey continuity tester',[78,57,35],[-104,110,18],grey,3);
  box(tester,'Tester gasket seam',[78.2,57.2,.65],[-104,110,15],M.rubber,.2);
  for(const x of [-136,-72])for(const y of [90,130])bolt(tester,x,y,35.7,1.4);
  const indicator=new T.MeshStandardMaterial({color:0x273c31,roughness:.28,metalness:.05,emissive:0x125832,emissiveIntensity:0});
  cyl(tester,'Indicator bezel',4.3,1.3,[-104,99,36],M.dark,32);cyl(tester,'Single pass indicator',3.2,1.1,[-104,99,36.9],indicator,32);
  // The dock: a slide on the tester's front pushes a spring-pin head onto the pallet adapter's rear face.
  box(tester,'Dock slide body',[34,4,12],[-104,79.5,10],M.silver,.5);
  const dockHead=box(tester,'Dock contact head',[28,3,9],[-104,75.5,9],M.dark,.4);
  const bin=new T.Group();bin.position.set(REJECT[0],REJECT[1],0);root.add(bin);
  box(bin,'Reject tray base',[69,53,3],[0,0,1.5],M.body,1);
  // Walls 12 mm high: the harness of a rejected unit leaves over the far wall without touching it.
  for(const s of [-1,1]){box(bin,'Reject tray wall',[2.5,53,12],[s*33,0,7],M.body,.7);box(bin,'Reject tray wall',[65,2.5,12],[0,s*25,7],M.body,.7);}
  box(bin,'Reject tray liner',[61,45,3],[0,0,4],M.rubber,.5);
  const turnover=new T.Group();turnover.name='Turnover cradle';turnover.position.set(TURNOVER[0],TURNOVER[1],0);root.add(turnover);
  // Cantilevered from the -y side: the harness leaves the housing towards +y, so that side stays open.
  box(turnover,'Turnover base',[52,74,5],[0,-12,2.5],M.body,.7);
  box(turnover,'Turnover bearing support',[20,6,30],[0,-22,20],M.silver,.6);
  const bearing=cyl(turnover,'Turnover bearing',7,8,[0,-22,38],M.dark,40);bearing.rotation.x=0;
  const rotator=new T.Group();rotator.position.z=TURNOVER[2];turnover.add(rotator);
  // In the rotator's frame the housing spans x ±7.5, y ±3.6, z -4.05..8.25 at every angle.
  const shaft=cyl(rotator,'Cradle axle',3,11,[0,-20.5,0],M.edge,32);shaft.rotation.x=0;
  box(rotator,'Cradle hub',[16,4,12],[0,-15,0],M.dark,.6);
  box(rotator,'Cradle slide block',[3,6,3],[-8.5,-14,2.15],M.dark,.3);
  const cradleJaws:T.Group[]=[];
  for(const y of [-6.3,6.3]){
    const jaw=new T.Group();rotator.add(jaw);cradleJaws.push(jaw);
    // The latch-side jaw has a relief in its middle for the latch and the tool's release plunger.
    if(y<0){for(const x of [-3.55,3.55])box(jaw,'Turnover clamping jaw',[3.9,2,10],[x,y+.5,0],M.dark,.4);box(jaw,'Turnover clamping jaw',[11,1,10],[0,y-1,0],M.dark,.3);}
    else box(jaw,'Turnover clamping jaw',[11,3,10],[0,y,0],M.dark,.5);
    for(const x of [-4,4])box(jaw,'Housing turnover pad',[2,1.7,8],[x,y-Math.sign(y)*1.85,0],M.rubber,.2);
    // The open-side jaw rides on a carrier bar back into the hub's slide block. The bar passes the housing's
    // end in the 1.3 mm band (z 1.5..2.8) that the closed fingers leave free both when placing and regripping.
    if(y>0){box(jaw,'Jaw carrier web',[2.2,3,4],[-6.5,y,1],M.dark,.3);box(jaw,'Jaw carrier bar',[1.8,23.8,1.2],[-8.5,-4.1,2.15],M.silver,.2);}
  }
  box(turnover,'Turnover actuator',[22,22,22],[0,-36,38],M.body,1);
  tube(turnover,[[10,-36,38],[18,-39,28],[20,-37,4],[12,-23,2]],1.2,M.rubber);
  const {group:upcam,light:upcamLight}=createUpCamera();root.add(upcam);
  const arm=createCobot(M);arm.root.scale.setScalar(5);root.add(arm.root);
  const tool=createPrecisionTool(extra);root.add(tool.root);
  const plug=createPlug(pins);root.add(plug);
  const wires=Array.from({length:pins},(_,i)=>{const mat=new T.MeshStandardMaterial({color:WIRE_COLOURS[i],roughness:.65});const w=new ArmCable(mat,HARNESS_POINTS,WIRE_RADIUS,320);w.mesh.name=`Harness wire ${i+1}`;root.add(w.mesh);return w;});
  const latch=plug.userData.latch as T.Group;
  // What the hanging harness can come to rest on: the fixed hardware and the live pallet at WORK.
  root.updateMatrixWorld(true);
  const rests:T.Box3[]=[];
  for(const g of [fixture,header,nest,comb,adapter,tester,bin,turnover,upcam])g.traverse(o=>{if(o instanceof T.Mesh&&!(o.geometry instanceof T.TubeGeometry)){for(let p:T.Object3D|null=o;p;p=p.parent)if(p===rotator)return;rests.push(new T.Box3().setFromObject(o));}});
  setHarnessObstacles(rests);
  // The rest of the line, built after the live harness field so their wires dress the same way.
  const units={unload:createUnit(pins,extra,true),queue:createUnit(pins,extra,false),load:createUnit(pins,extra,false)};
  for(const u of Object.values(units))root.add(u.group);
  const tote=createTote();root.add(tote.group);
  const rejectBin=createRejectBin();root.add(rejectBin);
  const rig={root,bench,pallet,plate,fixture,header,housing,pcb,nest,comb,adapter,tester,dockHead,bin,arm,tool,plug,latch,wires,indicator,turnover,rotator,cradleJaws,pins,upcam,upcamLight,wristLight:tool.light,wristStatus:tool.status,units,lifts,tote,rejectBin};
  applyLine(rig,REST_LINE);
  return rig;
}
export type Cell=ReturnType<typeof createCell>;

// The line at rest, as at the start of the first unit: an empty pallet waiting at UNLOAD, the next unit queued,
// the load lift down.
export const REST_LINE:LineFrame={shift:0,dock:1,liveHarness:true,unloadZ:0,unloadUnit:'none',unloadFade:1,loadZ:LIFT_DOWN,loadBoard:0,loadHarness:0,tote:0,toteIn:0,shot:'wide',focus:[...NEST],unitLabel:'',lineNote:''};
const lineSmooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
// How far an empty pallet travels along the return tunnel to be out of sight under the bench.
export const RETURN_RUN=240;
// Lowered to LIFT_DOWN, a pallet's tallest hardware (the nest guides, 16 mm up) is 3 mm under the tunnel's roof.
export const TUNNEL_TOP=LIFT_DOWN+19,WELL_FLOOR=LIFT_DOWN-20;
// Pose the line for one frame: the live pallet and its harness, the three static units, the lifts, the tester's dock
// head and the tote. Returns a key that changes whenever anything visible moved, for the shadow map.
export interface LineRig {pallet:T.Object3D;plug:T.Object3D;wires:{mesh:T.Mesh}[];units:Record<'unload'|'queue'|'load',PalletUnit>;lifts:{unload:T.Object3D;load:T.Object3D};dockHead:T.Object3D;tote:{slots:{mesh:T.Mesh;material:T.MeshStandardMaterial}[]}}
export function applyLine(rig:LineRig,f:LineFrame&{progress?:number}){
  // The index runs on the robot's clock; the operator side (lifts, return run) on its own, which a restart of
  // the robot's cycle does not rewind.
  const s=f.shift,p=f.progress??0,op=f.lineProgress??p,index=Math.max(0,Math.min(1,(p-INDEX_START)/(CYCLE_END-INDEX_START)));
  rig.pallet.position.x=-s;
  rig.plug.visible=f.liveHarness;
  for(const w of rig.wires)w.mesh.position.x=-s;
  const {unload,queue,load}=rig.units;
  // Down at the bottom of its lift, an empty pallet runs off into the return tunnel under the bench; the next one
  // runs in from it at the load end before its lift brings it up.
  const down=(z:number)=>z<=LIFT_DOWN+.01,indexing=p>=INDEX_START;
  const away=down(f.unloadZ)?indexing?1:lineSmooth((op-8)/5):0,coming=down(f.loadZ)&&!indexing?1-lineSmooth((op-11)/8):0;
  unload.group.position.set(LINE_X.unload-LINE_X.work+RETURN_RUN*away,0,f.unloadZ);
  queue.group.position.set(PALLET_PITCH-s,0,0);
  load.group.position.set(2*PALLET_PITCH-s-RETURN_RUN*coming,0,f.loadZ);
  unload.group.visible=away<.999;load.group.visible=coming<.999;
  const show=(u:PalletUnit,board:number,harness:number)=>{if(u.shown[0]!==board)fadeTo(u.fades.board,u.board,board);if(u.shown[1]!==harness)fadeTo(u.fades.harness,u.harness,harness);u.shown=[board,harness];};
  show(unload,f.unloadUnit==='none'?0:f.unloadFade,f.unloadUnit==='finished'?f.unloadFade:0);
  show(queue,1,1);show(load,f.loadBoard,f.loadHarness);
  // Each lift waits up, its deck closing the well. The unload lift comes back up once its empty pallet has run off;
  // the load lift goes down for the next pallet just before it runs in.
  rig.lifts.unload.position.z=index>0?0:op>=8?LIFT_DOWN*(1-lineSmooth((op-13)/5)):f.unloadZ;
  rig.lifts.load.position.z=index>0?0:op<20?LIFT_DOWN*lineSmooth((op-4)/6):f.loadZ;
  rig.dockHead.position.y=77-1.5*f.dock;
  rig.tote.slots.forEach((slot,i)=>{
    const v=i<f.tote?1:i===f.tote?f.toteIn:0;slot.mesh.visible=v>.002;slot.mesh.castShadow=v>.5;
    const see=v<.998;if(slot.material.transparent!==see){slot.material.transparent=see;slot.material.needsUpdate=true;}slot.material.opacity=v;slot.material.depthWrite=!see;
  });
  return [s,f.dock,f.liveHarness,f.unloadZ,f.unloadUnit,f.unloadFade,f.loadZ,f.loadBoard,f.loadHarness,f.tote,f.toteIn,rig.lifts.unload.position.z,rig.lifts.load.position.z].map(v=>typeof v==='number'?v.toFixed(3):String(v)).join();
}

// Dress the live wires round the plug in pallet-local coordinates. The wire meshes ride with the pallet (applyLine),
// so an index moves them without dressing them again. Returns the dressing key; nothing is redone when it is `last`.
const livePoints=Array.from({length:10},()=>new T.Vector3()),liveAt=new T.Vector3();
export function dressLiveHarness(rig:{plug:T.Object3D;pallet:T.Object3D;wires:ArmCable[];pins:number},last=''){
  liveAt.copy(rig.plug.position);liveAt.x-=rig.pallet.position.x;
  const key=[liveAt.x,liveAt.y,liveAt.z,rig.plug.rotation.y,rig.plug.rotation.z].map(v=>v.toFixed(4)).join();
  if(key===last)return key;
  const contacts=contactCenters(rig.pins);
  for(let i=0;i<rig.pins;i++){dressHarness(livePoints,liveAt,rig.plug.rotation.y,rig.plug.rotation.z,contacts[i],i,rig.pins);rig.wires[i].update(livePoints);}
  return key;
}

// The release plunger on the tool and the latch it presses. Over `released` 0..1 the plunger's blade closes the
// RELEASE_GAP to the latch's press tab, then pushes the tab RELEASE_TRAVEL in; the beam pivots at its root by
// the face, so the hook moves in about 0.33 mm and clears the header's catch.
export const RELEASE_GAP=.3,RELEASE_TRAVEL=.7,LATCH_ARM=9.3;
export function poseLatch(latch:T.Object3D,released:number){latch.rotation.x=-Math.max(0,released*(RELEASE_GAP+RELEASE_TRAVEL)-RELEASE_GAP)/LATCH_ARM;}
export function posePlunger(plunger:T.Object3D,released:number){plunger.position.y=released*(RELEASE_GAP+RELEASE_TRAVEL);}
export function createPlug(pins=6){
  const halfX=pins===8?9.5:7.5;
  const group=new T.Group();group.name='Six-wire connector';
  const material=M.ivory.clone();
  const body=new T.Mesh(plugHousing(halfX,3.6,pins),material);body.geometry.scale(1,1,12/7.8);body.position.z=-3.9;body.castShadow=body.receiveShadow=true;body.name='Nylon connector housing';group.add(body);
  for(const [x,y] of contactCenters(pins)){
    const ring=new T.Mesh(cached('contact ring',()=>new T.RingGeometry(.36,.57,16)),M.gold);ring.position.set(x,y,-4.01);ring.rotation.x=Math.PI;group.add(ring);
    cyl(group,'Wire entry seal',.62,.18,[x,y,8.25],M.ivory,20);
  }
  for(const s of [-1,1])box(group,'Molded keying rib',[.5,.45,5],[s*6.3,-3.65,-.3],M.ivory,.1);
  // A cantilever latch on the -y face, rooted just above the mating face. Its hook catches under the header's
  // catch; its press tab stands above the header's top once seated, where the tool's plunger can reach it.
  const latch=new T.Group();latch.name='Connector latch';latch.position.set(0,-4.6,-3.4);group.add(latch);
  box(latch,'Latch root',[2,1.05,.8],[0,.525,.4],M.ivory,.1);
  box(latch,'Free latch beam',[2,.6,8.6],[0,0,4.3],M.ivory,.12);
  box(latch,'Latch hook',[2.3,.85,1],[0,-.125,4.2],M.ivory,.12);
  box(latch,'Latch press tab',[2.4,.9,1.8],[0,-.4,9.3],M.ivory,.15);
  group.userData.latch=latch;
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
  // Turned over, the housing sits GRIP_RAISE below the tool origin: the fingertips (z 3..9) hold its upper 3.75 mm
  // and the back stop sits on its wire face, so seated the fingertips stay 1.6 mm over the header.
  const fingers=[-1,1].map(s=>{
    const g=new T.Group();g.position.x=s*extra;g.userData.extra=s*extra;root.add(g);
    box(g,'Moving jaw carriage',[11,20,7],[s*14,0,30],M.dark,.45);
    box(g,'Brushed aluminium finger',[5.4,10,19],[s*13,0,18.5],M.silver,.5);
    box(g,'Custom fingertip',[5.1,6.6,6],[s*10.5,0,6],M.silver,.32);
    box(g,'Housing contact face',[.35,5.2,4],[s*7.68,0,5],M.rubber,.05);
    box(g,'Insertion back stop',[1.6,2,1.2],[s*6.9,-2,8.8-GRIP_RAISE],M.silver,.12);
    for(const z of [16,24]){const b=cyl(g,'Finger mounting screw',1.5,.4,[s*13,-5.2,z],M.dark,20);b.rotation.x=0;}
    return g;
  });
  // The latch release: a compact air cylinder on a bracket under the gripper's front face. Its blade hangs just
  // outside the latch's press tab and pushes it in to hold the latch open for a lift-out.
  box(root,'Release cylinder bracket',[6,1.6,26],[0,-16.3,23],M.silver,.3);
  const barrel=cyl(root,'Release air cylinder',2.2,7,[0,-12,11.8],M.edge,32);barrel.rotation.x=0;
  cyl(root,'Release air fitting',.9,1.6,[0,-13.5,14.6],M.silver,16);
  const plunger=new T.Group();plunger.name='Release plunger';root.add(plunger);
  const rod=cyl(plunger,'Release plunger rod',.5,2.4,[0,-7.3,11.8],M.silver,16);rod.rotation.x=0;
  box(plunger,'Release blade',[1.4,.8,8.5],[0,-5.85,8.25],M.dark,.15);
  const camera=new T.Group();root.add(camera);
  box(camera,'Wrist camera bracket',[18,5,4],[29,3,61],M.silver,.3);
  box(camera,'Wrist camera',[16,17,22],[34,5,45],M.dark,1.2);
  cyl(camera,'Camera lens barrel',5.8,6,[34,5,31],M.dark,40);
  cyl(camera,'Camera lens glass',4.3,.4,[34,5,27.8],lensGlass,40);
  // A low ring light round the lens nose, flush under the body, its LEDs facing down at the board.
  ring(camera,'Wrist ring light housing',[[6,34],[6,29.2],[6.4,29.2],[6.4,29.7],[7.5,29.7],[7.5,29.2],[7.72,29.2],[7.95,29.42],[8,29.7],[8,34],[6,34]],[34,5,0],M.dark,64);
  // The frosted diffuser stands 0.5 mm proud of the housing, so its lit edge shows from above the bench.
  const light=ringLightMaterial(false);
  ring(camera,'Wrist ring light diffuser',[[6.45,29.7],[6.45,28.7],[7.5,28.7],[7.5,29.7]],[34,5,0],light,64);
  const status=new T.MeshStandardMaterial({color:0x17251c,emissive:0x2bd36a,emissiveIntensity:0,roughness:.3,name:'Camera status LED'});
  box(camera,'Camera status LED',[.16,1.2,.9],[42.06,10.2,53.6],status,0);
  tube(root,[[34,12,51],[31,21,58],[23,19,63],[24,16,70]],1.1,M.rubber);
  const gland=new T.Vector3(28,9,50);
  const g=cyl(root,'Gripper cable gland',3,6,gland.toArray(),M.edge,32);g.rotation.z=Math.PI/2;g.rotation.x=0;
  return {root,fingers,plunger,gland,light,status};
}

// Bake everything under a static group into one mesh per material, in the group's own frame. For the parts of the
// line that only ever move as a whole (the static units, the tote, the reject bin), so each costs a few draws.
export function mergeStatic(root:T.Object3D){
  root.updateMatrixWorld(true);
  const toRoot=new T.Matrix4().copy(root.matrixWorld).invert(),groups=new Map<string,{material:T.Material;cast:boolean;receive:boolean;parts:T.BufferGeometry[]}>();
  const found:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material))found.push(o);});
  for(const mesh of found){
    const g=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(new T.Matrix4().multiplyMatrices(toRoot,mesh.matrixWorld));
    for(const name of Object.keys(g.attributes))if(!['position','normal','color'].includes(name))g.deleteAttribute(name);
    const material=mesh.material as T.Material,key=`${material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${g.attributes.color?'c':''}`;
    if(!groups.has(key))groups.set(key,{material,cast:mesh.castShadow,receive:mesh.receiveShadow,parts:[]});groups.get(key)!.parts.push(g);
    mesh.removeFromParent();
  }
  for(const o of [...root.children])if(!(o instanceof T.Mesh))root.remove(o);
  for(const {material,cast,receive,parts} of groups.values()){
    const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!geometry)continue;
    const merged=new T.Mesh(geometry,material);merged.name=`${root.name} / ${material.name||'part'}`;merged.castShadow=cast;merged.receiveShadow=receive;root.add(merged);
  }
}

export function disposeCell(root:T.Object3D){
  const shared=new Set<T.Material>([...Object.values(M),...sharedMaterials]);
  const cachedGeometry=new Set(geometry.values()),seenGeometry=new Set<T.BufferGeometry>(),seenMaterials=new Set<T.Material>();
  root.traverse(o=>{if(o instanceof T.Mesh){if(!cachedGeometry.has(o.geometry))seenGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!shared.has(m))seenMaterials.add(m);}});
  seenGeometry.forEach(g=>g.dispose());seenMaterials.forEach(m=>m.dispose());
}

// A factory-hall light probe made of a few emissive boxes, rendered once to a PMREM.
// y-up like RoomEnvironment; the scene rotates it to z-up.
export function factoryEnvironment(){
  const env=new T.Scene();
  const lit=(c:number,k:number)=>new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(k),side:T.BackSide});
  const room=new T.Mesh(new T.BoxGeometry(60,16,60),[lit(0xd7dbdc,.5),lit(0xd7dbdc,.5),lit(0xc9cdce,.6),lit(0x80847f,.3),lit(0xd7dbdc,.45),lit(0xd7dbdc,.6)]);room.position.y=6;env.add(room);
  const light=new T.MeshBasicMaterial({color:new T.Color(0xffffff).multiplyScalar(9)});
  for(let x=-24;x<=24;x+=6)for(let z=-24;z<=24;z+=6){const m=new T.Mesh(new T.BoxGeometry(1.2,.1,1.2),light);m.position.set(x,13.8,z);env.add(m);}
  const sky=new T.MeshBasicMaterial({color:new T.Color(0xf1f6fa).multiplyScalar(4)});
  for(let x=-24;x<=24;x+=8){const w=new T.Mesh(new T.BoxGeometry(6,2.5,.1),sky);w.position.set(x,10,-29.8);env.add(w);}
  return env;
}
