import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { finishes as M } from './finishes.ts';
import { createCobot, ArmCable } from './cobot.ts';
import { plugHousing, contactCenters } from './mechanism.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HEADER, NEST, REJECT, TURNOVER, UPCAM, processFrame } from './process.ts';
import { HARNESS_LENGTH, HARNESS_POINTS, WIRE_RADIUS, bundleSlot, dressHarness, setHarnessObstacles } from './harness.ts';
import { FLOOR } from './hall.ts';
import { CHAMFER, GRIP_RAISE, INDEX_START, LIFT_DOWN, LINE_X, LOAD, PALLET_PITCH, PALLET_SIZE, PALLET_Y, PICK, SHROUD_CLEARANCE, SWAP, TOTE_SLOTS, UNLOAD, opSeconds } from './line.ts';
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
// The tester's dock: its stroke, how far the tester stands back for it, and its locating pin (cell x, z).
export const DOCK_STROKE=8,DOCK_BACK=8,DOCK_PIN=[-96,7] as const;
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
  // Clipped along the plate to its front edge, where it goes down through a cable gland into the bench's cable
  // port: a small junction box on the worktop against the plate's edge, wired on through the worktop.
  tube(g,[[-16,0,zc],[-18.6,-.3,zc-.6],[-20.5,-2.2,1.5],[-21,-8,1.3],[-21,-40,1.3],[-21,-80,1.3],[-21,-100,1.3],[-21,-108,2.2],[-21,-113,5.5],[-21,-117.2,10.6],[-21,-120.6,12.4],[-21,-122,11.3],[-21,-122,9.6]],1.25,M.rubber);
  for(const y of [-30,-84]){
    box(g,'Cable clip base',[10,4,.6],[-21,y,.3],M.dark,.2);
    box(g,'Cable clip saddle',[3.6,4,3.3],[-21,y,1.65],M.dark,.5);
    for(const x of [-25,-17])cyl(g,'Clip screw',.8,.6,[x,y,.9],M.silver,16);
  }
  // The port's box stands on the worktop (z -12) just clear of the jig plate's front face (y -112 here).
  box(g,'Cable port box',[24,22,16],[-21,-123.2,-4],M.body,1.2);
  box(g,'Cable port lid',[25,23,1.2],[-21,-123.2,4.6],M.dark,.4);
  for(const x of [-30.5,-11.5])for(const y of [-114.8,-131.6])cyl(g,'Port lid screw',.9,.5,[x,y,5.45],M.silver,16);
  cyl(g,'Cable gland locknut',4.4,1.4,[-21,-122,5.9],M.edge,6);
  cyl(g,'Cable gland body',3.6,2.4,[-21,-122,7.8],M.dark,24);
  ring(g,'Cable gland dome',[[3.4,9],[3.2,9.7],[2.4,10.1],[1.35,10.2],[1.35,9]],[-21,-122,0],M.rubber,32);
  return {group:g,light};
}

const palletMetal=new T.MeshStandardMaterial({color:0x7b8186,metalness:.55,roughness:.42,name:'Anodised pallet plate'});
const linerMat=new T.MeshStandardMaterial({color:0x1b1d1e,roughness:.9,name:'Lift well liner'});
const toteMat=new T.MeshStandardMaterial({color:0x2c2e30,roughness:.78,name:'Conductive tote'});
const esdLabel=new T.MeshStandardMaterial({color:0xd6ae1c,roughness:.6,name:'ESD label'});
const rejectRed=new T.MeshStandardMaterial({color:0xa3241c,roughness:.46,metalness:.08,name:'Red powder coat'});
const rejectLid=new T.MeshStandardMaterial({color:0x7e1a14,roughness:.5,metalness:.08,name:'Red powder coat lid'});
const tagLabel=new T.MeshStandardMaterial({color:0xe6e8e3,roughness:.7,name:'Tag label'});
const storeMat=new T.MeshStandardMaterial({color:0x3b4043,roughness:.55,metalness:.2,name:'Tote store panels'});
const rollerMat=new T.MeshStandardMaterial({color:0x6c7175,metalness:.7,roughness:.48,name:'Zinc plated roller'});
const frameMat=new T.MeshStandardMaterial({color:0x50565a,metalness:.4,roughness:.5,name:'Conveyor frame'});
const shutterMat=new T.MeshStandardMaterial({color:0x5b6164,roughness:.45,metalness:.5,name:'Roller shutter'});
const sharedMaterials=[pcbMaterial,grey,solder,ink,jig,top,cabinet,lensGlass,windowGlass,palletMetal,linerMat,toteMat,esdLabel,rejectRed,rejectLid,tagLabel,storeMat,shutterMat,rollerMat,frameMat];

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
  // Two swing clamps hold the board down at its corners. At the unload station they lift and swing clear.
  const clamps=[[-34,8],[34,-8]].map(([x,y])=>{
    const c=new T.Group();c.name='Swing clamp';c.position.set(x,y,0);fixture.add(c);
    box(c,'Fixture clamp',[14,9,3],[0,0,10.7],M.dark,.4);bolt(c,0,0,12.2,2.1);
    box(c,'Soft clamp shoe',[4,9,1],[-Math.sign(x)*5,0,9.8],M.rubber,.15);
    return c;
  });
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
  // The bushing the dock head's locating pin goes into.
  const bush=cyl(adapter,'Dock pin bushing',2.7,.4,[DOCK_PIN[0],73.79,DOCK_PIN[1]],M.silver,24);bush.rotation.x=0;
  const bore=cyl(adapter,'Dock pin bore',1.75,.1,[DOCK_PIN[0],73.96,DOCK_PIN[1]],M.bore,20);bore.rotation.x=0;
  return {plate,fixture,nest,comb,adapter,clamps};
}

// A pallet's product as it rides the line: the board with its header, and the harness with its housing either
// fresh in the nest or seated on the header. Static: the wires are dressed once, merged into one mesh.
const WIRE_COLOURS=[0x9c6534,0x2c3234,0xc4b99e,0x697960,0x596c82,0x864d49,0x9c9b82,0x415451];
// Rings per wire tube, about 2.2 mm of wire each: smooth in the close-up, and the same for the live wires and every
// unit copy, so a unit that changes hands at 108 -> 0 draws exactly alike.
export const WIRE_SEGMENTS=200,LIVE_SEGMENTS=WIRE_SEGMENTS;
// One vertex-coloured material for every unit copy's wires, and one nylon for their housings, so a carried unit and
// the packed copy it becomes draw exactly alike.
const wireMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.65,name:'Harness wire insulation'});
const unitNylon=M.ivory.clone();unitNylon.name='Molded nylon';
function colourWire(g:T.BufferGeometry,i:number){const n=g.attributes.position.count,c=new T.Color(WIRE_COLOURS[i]),a=new Float32Array(n*3);for(let k=0;k<n;k++)c.toArray(a,k*3);g.setAttribute('color',new T.BufferAttribute(a,3));}
function dressedWires(pins:number,plug:T.Vector3,turn:number){
  const contacts=contactCenters(pins);
  return Array.from({length:pins},(_,i)=>{const points=Array.from({length:HARNESS_POINTS},()=>new T.Vector3());dressHarness(points,plug,turn,0,contacts[i],i,pins);return points;});
}
// Static wires through these points, merged into one vertex-coloured mesh.
function wireMesh(wires:T.Vector3[][],name='Harness wires'){
  const parts=wires.map((points,i)=>{const cable=new ArmCable(wireMaterial,HARNESS_POINTS,WIRE_RADIUS,WIRE_SEGMENTS);cable.update(points);colourWire(cable.geometry,i);return cable.geometry;});
  const o=new T.Mesh(mergeGeometries(parts,false)!,wireMaterial);parts.forEach(g=>g.dispose());o.name=name;o.castShadow=o.receiveShadow=true;return o;
}
function staticHarness(parent:T.Object3D,pins:number,plug:T.Vector3,turn:number){const o=wireMesh(dressedWires(pins,plug,turn));parent.add(o);return o;}

// Where a finished unit's plug sits: seated on the header, as the robot leaves it.
const seatedPlug=()=>{const end=processFrame(INDEX_START,'pass');return {at:new T.Vector3(...end.plug),turn:end.rotation};};
export interface PalletUnit {group:T.Group;hardware:T.Group;board:T.Group;harness:T.Group;clamps:T.Group[]}
// One of the static units on the line (UNLOAD, QUEUE, LOAD): the pallet's hardware plus its own copy of the product.
// The fixture's swing clamps are kept out of the hardware so the unload station can open them.
function createUnit(pins:number,extra:number,seated:boolean):PalletUnit{
  const group=new T.Group();group.name=seated?'Finished unit':'Next unit';
  const hardware=new T.Group();hardware.name='Unit pallet';group.add(hardware);const {clamps}=buildPalletHardware(hardware,pins);
  for(const c of clamps)group.add(c);
  const board=new T.Group();board.name='Unit board';group.add(board);
  const {header}=buildBoard(board,board,pins,extra);header.position.set(HEADER[0],HEADER[1],0);
  const harness=new T.Group();harness.name='Unit harness';group.add(harness);
  const seat=seatedPlug(),at=seated?seat.at:new T.Vector3(...NEST),turn=seated?seat.turn:Math.PI;
  const plug=createPlug(pins,unitNylon);plug.position.copy(at);plug.rotation.y=turn;harness.add(plug);
  staticHarness(harness,pins,at,turn);
  return {group,hardware,board,harness,clamps};
}

// The finished unit as the picker carries it: the same board, header and seated plug in one rigid group, and the
// wires as live tubes that are drawn up off the pallet into a coil beside the board as it is lifted. Unit-local
// coordinates, as on the pallet at WORK.
export const COIL={x:-10,y:40,top:21,pitch:2,radius:12};
function createCarried(pins:number,extra:number){
  const group=new T.Group();group.name='Carried unit';group.visible=false;
  const hardware=new T.Group(),harness=new T.Group();group.add(hardware,harness);
  const board=new T.Group();board.name='Unit board';group.add(board);
  const {header}=buildBoard(board,board,pins,extra);header.position.set(HEADER[0],HEADER[1],0);
  const seat=seatedPlug(),plug=createPlug(pins,unitNylon);plug.position.copy(seat.at);plug.rotation.y=seat.turn;board.add(plug);
  const dressed=dressedWires(pins,seat.at,seat.turn),coil=dressed.map((d,i)=>coilPoints(d,i,pins));
  const wires=dressed.map((points,i)=>{const w=new ArmCable(wireMaterial,HARNESS_POINTS,WIRE_RADIUS,WIRE_SEGMENTS);w.update(points);colourWire(w.geometry,i);w.mesh.name=`Carried wire ${i+1}`;w.mesh.receiveShadow=true;group.add(w.mesh);return w;});
  return {unit:{group,hardware,board,harness,clamps:[]} as PalletUnit,wires,dressed,coil,points:dressed.map(d=>d.map(v=>v.clone())),morph:-1};
}
// A wire's coiled shape: out of the housing's wire face, over the board's +y edge and down into a flat helix
// beside it, the bundle keeping its two rows. Same length as the dressed wire, so its far end is its own end.
function coilPoints(dressed:T.Vector3[],i:number,pins:number){
  const [col,row]=bundleSlot(i,pins),start=dressed[0],r=COIL.radius+col;
  const poly=[start.clone(),new T.Vector3(start.x,start.y+1.5,start.z+1.2),new T.Vector3(start.x*.6+COIL.x*.1+col*.3,start.y+8,start.z+1.6+row),
    new T.Vector3(start.x*.4+COIL.x*.6,19,start.z+1+row),new T.Vector3(COIL.x+r*Math.cos(-1.7),COIL.y+r*Math.sin(-1.7)+1.5,COIL.top+row+1.5)];
  let length=0;for(let k=1;k<poly.length;k++)length+=poly[k].distanceTo(poly[k-1]);
  const per=Math.hypot(r,COIL.pitch/(Math.PI*2)),from=-Math.PI/2,to=from+(HARNESS_LENGTH-length)/per;
  for(let a=from;a<to;a+=.08)poly.push(new T.Vector3(COIL.x+r*Math.cos(a),COIL.y+r*Math.sin(a),COIL.top+row-COIL.pitch*(a-from)/(Math.PI*2)));
  const points=Array.from({length:HARNESS_POINTS},()=>new T.Vector3()),total=poly.reduce((s,v,k)=>k?s+v.distanceTo(poly[k-1]):0,0);
  let k=1,done=0;points[0].copy(poly[0]);
  for(let j=1;j<HARNESS_POINTS;j++){const want=total*j/(HARNESS_POINTS-1);while(k<poly.length-1&&done+poly[k].distanceTo(poly[k-1])<want){done+=poly[k].distanceTo(poly[k-1]);k++;}const seg=poly[k].distanceTo(poly[k-1])||1;points[j].lerpVectors(poly[k-1],poly[k],Math.min(1,(want-done)/seg));}
  return points;
}

// The lift at each end of the line: a deck carrying its own belt sections on a column out of the cabinet. It lowers
// pallets to the return tunnel under the bench and brings them back up; up, its deck closes the well.
function createLift(parent:T.Object3D,x:number,belt:T.Material){
  const g=new T.Group();g.name='Pallet lift';parent.add(g);
  for(const y of [-27,68])box(g,'Lift belt',[226,12,4],[x,y,-10],belt,0);
  box(g,'Lift deck',[224,110,4],[x,PALLET_Y,-14],M.body,.8);
  cyl(g,'Lift column',11,70,[x,PALLET_Y,-51],M.edge,40);
  return g;
}
// The conveyor belts: dark rubber with a moulded cleat every BELT_PITCH mm, so a moving belt reads as moving.
// One material per belt group, each with its own texture offset; the pitch divides every run, so the seams match.
export const BELT_PITCH=8;
const beltImage=(()=>{const n=32,data=new Uint8Array(n*4*4);for(let j=0;j<4;j++)for(let i=0;i<n;i++){const u=(i+.5)/n,v=Math.round(255*(u<.18?.62:u<.26?.4:.3));const k=(j*n+i)*4;data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;}return data;})();
function beltMaterial(length:number){
  const map=new T.DataTexture(beltImage,32,4);map.wrapS=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.anisotropy=8;map.colorSpace=T.SRGBColorSpace;map.repeat.set(length/BELT_PITCH,1);map.needsUpdate=true;
  return new T.MeshStandardMaterial({color:0x4a4f50,roughness:.86,map,name:'Cleated conveyor belt'});
}

// The packing end of the bench. The picker packs each passed unit on edge into the conductive tote on the roller
// bed F; an empty tote waits on the bed E in front of it. A full tote rolls off the bench end along lane A into the
// tote store, the empty one rolls back into F, and the store sends a new empty along lane B to E.
export const TOTE={F:[-383,-110],E:[-383,-245],z:-6,size:[149,120,70],pitch:18,face:-1080,store:-1190};
// The picker's head point is the pivot its edge clamp tilts the board about: on the board's mid-plane near its +x
// edge, clear of the harness, which leaves the board toward -x. TILT stands the board on edge, components to -x.
export const PIVOT=[25,0,8.8] as const,TILT=-Math.PI/2;
const PICK_AT=[LINE_X.unload-LINE_X.work+PIVOT[0],PIVOT[1],PIVOT[2]] as const,TRAVEL_Z=145;
// Slot i's pivot point in the tote's frame: the board stands on the insert, its back 0.4 mm inside the slot's +x
// side and its parts toward -x, so the tote fills from its +x end and the picker always reaches into empty slots.
const slotPivot=(i:number)=>[TOTE.size[0]/2-2.5-TOTE.pitch*(i+1)+16.8,-16.5,77.2] as const;
function createTote(name:string){
  const g=new T.Group();g.name=name;
  const shell=new T.Group();g.add(shell);
  const [w,d,h]=TOTE.size;
  box(shell,'Tote floor',[w,d,3],[0,0,1.5],toteMat,1);
  for(const s of [-1,1]){box(shell,'Tote wall',[2.5,d,h],[s*(w/2-1.25),0,h/2],toteMat,1);box(shell,'Tote wall',[w-5,2.5,h],[0,s*(d/2-1.25),h/2],toteMat,1);}
  for(const s of [-1,1])box(shell,'Tote rim',[w,4,2],[0,s*(d/2-2),h],toteMat,.8);
  box(shell,'ESD label',[26,.3,18],[38,-d/2-.15,48],esdLabel,0);
  box(shell,'Slotted insert',[w-5,d-5,20],[0,0,13],toteMat,1);
  // Low ribs between the slots keep each board upright; the units' parts stand clear above them.
  for(let k=1;k<TOTE_SLOTS;k++)box(shell,'Insert rib',[.6,96,6],[-w/2+2.5+TOTE.pitch*k+.5,-8,26],toteMat,.2);
  return {group:g,shell};
}
// Each slot's packed copy of the carried unit, built once from it: per material, every slot's copy in slot order, so
// the first n slots are one draw range. The out tote keeps its own full set.
function slotSet(carried:{unit:PalletUnit},coil:T.Vector3[][]){
  const tilt=new T.Matrix4().makeRotationY(TILT),pivot=new T.Matrix4().makeTranslation(-PIVOT[0],-PIVOT[1],-PIVOT[2]);
  const root=carried.unit.group;root.updateMatrixWorld(true);const toRoot=new T.Matrix4().copy(root.matrixWorld).invert();
  const parts=new Map<T.Material,{geometry:T.BufferGeometry;cast:boolean}[]>();
  root.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&!(o.name.startsWith('Carried wire'))){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(new T.Matrix4().multiplyMatrices(toRoot,o.matrixWorld));for(const a of Object.keys(g.attributes))if(!['position','normal'].includes(a))g.deleteAttribute(a);(parts.get(o.material)??parts.set(o.material,[]).get(o.material)!).push({geometry:g,cast:o.castShadow});}});
  const coiled=wireMesh(coil);parts.set(wireMaterial,[{geometry:coiled.geometry.toNonIndexed(),cast:true}]);coiled.geometry.dispose();
  return [...parts].map(([material,list])=>{
    const slots=Array.from({length:TOTE_SLOTS},(_,i)=>{const [x,y,z]=slotPivot(i),m=new T.Matrix4().makeTranslation(x,y,z).multiply(tilt).multiply(pivot);return mergeGeometries(list.map(p=>p.geometry.clone().applyMatrix4(m)),false)!;});
    const counts=[0];for(const g of slots)counts.push(counts.at(-1)!+g.attributes.position.count);
    const geometry=mergeGeometries(slots,false)!;slots.forEach(g=>g.dispose());
    const mesh=new T.Mesh(geometry,material);mesh.name='Packed units';mesh.castShadow=mesh.receiveShadow=true;
    return {mesh,counts};
  });
}
function createToteLine(bench:T.Object3D,root:T.Object3D){
  const g=new T.Group();g.name='Tote conveyor';bench.add(g);
  const [F,E]=[TOTE.F,TOTE.E],x0=-308,x1=TOTE.face-2,rollerZ=TOTE.z-3,leg=(x:number,y:number)=>box(g,'Conveyor leg',[24,24,-18-FLOOR],[x,y,(FLOOR-18)/2],frameMat,1);
  for(const [,y] of [F,E]){
    for(const s of [-1,1])box(g,'Roller side frame',[x0-x1,4,5.5],[(x0+x1)/2,y+s*62,-9.25],frameMat,.6);
    for(let x=x0-9;x>x1;x-=18.75){const r=cyl(g,'Conveyor roller',3,118,[x,y,rollerZ],rollerMat,16);r.rotation.x=0;}
    // Off the bench end the lanes stand on legs.
    for(const x of [-560,-1000])for(const s of [-1,1])leg(x,y+s*52);
  }
  // The tote store: a closed cabinet the lanes run into, a shutter over each mouth.
  const st=new T.Group();st.name='Tote store';g.add(st);
  const fx=TOTE.face,back=-1290,y0=-322,y1=-34,top=190,mouth=[TOTE.z,TOTE.z+92],cx=(fx+back)/2,lw=fx-back;
  box(st,'Tote store wall',[8,y1-y0,top-FLOOR],[back+4,(y0+y1)/2,(top+FLOOR)/2],storeMat,2);
  for(const y of [y0+4,y1-4])box(st,'Tote store wall',[lw,8,top-FLOOR],[cx,y,(top+FLOOR)/2],storeMat,2);
  box(st,'Tote store top',[lw,y1-y0,8],[cx,(y0+y1)/2,top-4],storeMat,2);
  box(st,'Tote store base',[lw,y1-y0,mouth[0]-FLOOR],[cx,(y0+y1)/2,(mouth[0]+FLOOR)/2],storeMat,1);
  box(st,'Tote store face',[5,y1-y0,top-mouth[1]],[fx-2.5,(y0+y1)/2,(top+mouth[1])/2],storeMat,1);
  box(st,'Tote store divider',[lw,(F[1]-63)-(E[1]+63),mouth[1]-mouth[0]],[cx,((F[1]-63)+(E[1]+63))/2,(mouth[0]+mouth[1])/2],storeMat,.5);
  box(st,'Tote store liner',[lw-10,y1-y0-10,.6],[cx,(y0+y1)/2,mouth[0]+.3],linerMat,0);
  const shutters=[F,E].map(([,y])=>{return box(root,'Tote store shutter',[3,126,mouth[1]-mouth[0]-.2],[fx-9,y,(mouth[0]+mouth[1])/2],shutterMat,.5);});
  const totes={fill:createTote('Outgoing tote'),out:createTote('Full tote'),spare:createTote('Empty tote')};
  for(const t of Object.values(totes))root.add(t.group);
  return {totes,shutters,mouth};
}

// The unload picker: a gantry beam from a post at the bench end, an X carriage, a Y rail out over the tote, a Y carriage with a vertical air cylinder and, on its rod, an edge clamp whose two jaws grip the board's long
// edges and whose pads tilt the board on edge about PIVOT.
function createPicker(){
  const root=new T.Group();root.name='Unload picker';
  // The post stands on the floor beyond the bench end, out of the line of sight of the close-ups at the stations.
  const post=[-498,150],beam=[-513,-182],beamY=150,beamZ=395;
  box(root,'Picker post',[30,30,beamZ+12-FLOOR],[post[0],post[1],(beamZ+12+FLOOR)/2],M.silver,1.5);
  box(root,'Picker post foot',[60,60,8],[post[0],post[1],FLOOR+4],M.dark,1);
  box(root,'Post to bench bracket',[36,26,8],[-466,post[1],-46.5],M.dark,.8);
  box(root,'Picker X beam',[beam[1]-beam[0],24,24],[(beam[0]+beam[1])/2,beamY,beamZ],M.silver,1.5);
  box(root,'Beam end cap',[3,26,26],[beam[0]-1.5,beamY,beamZ],M.dark,.6);
  const x=new T.Group();x.name='Picker X carriage';root.add(x);
  box(x,'X carriage',[30,32,18],[0,beamY,beamZ-21],M.dark,1);
  box(x,'Picker Y rail',[18,beamY+165,18],[0,(beamY-165)/2,beamZ-39],M.silver,1.2);
  box(x,'Y rail end cap',[20,3,20],[0,-166.5,beamZ-39],M.dark,.6);
  const y=new T.Group();y.name='Picker Y carriage';x.add(y);
  const cylTop=beamZ-48,cylBottom=190;
  box(y,'Y carriage',[30,34,14],[0,0,cylTop+7-14],M.dark,1);
  const body=cyl(y,'Picker air cylinder',11,cylTop-14-cylBottom,[0,0,(cylTop-14+cylBottom)/2],M.edge,32);body.rotation.x=Math.PI/2;
  cyl(y,'Cylinder end cap',12,6,[0,0,cylBottom],M.dark,24);
  const head=new T.Group();head.name='Picker head';y.add(head);
  cyl(head,'Piston rod',4.5,150,[0,0,40+75],M.silver,24);
  box(head,'Clamp body',[16,72,10],[0,0,35],M.dark,1);
  box(head,'Clamp slide',[10,74,3],[0,0,28.5],M.silver,.4);
  const jaws=[-1,1].map(s=>{
    const jaw=new T.Group();jaw.name='Clamp jaw';head.add(jaw);
    box(jaw,'Clamp jaw arm',[8,3,34],[0,s*9,13.5],M.silver,.5);
    const pad=new T.Group();pad.name='Tilting pad';jaw.add(pad);
    box(pad,'Edge clamp shoe',[8,5.5,3.4],[0,s*2.75,1],M.rubber,.3);
    const disc=cyl(pad,'Pad pivot',3.5,2,[0,s*6.5,0],M.edge,24);disc.rotation.x=0;
    if(s>0){const drive=cyl(jaw,'Tilt actuator',6,6,[0,s*13.5,17],M.dark,28);drive.rotation.x=0;}
    return {jaw,pad,side:s};
  });
  return {root,x,y,head,jaws};
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
  const belts={line:beltMaterial(468),unload:beltMaterial(226),load:beltMaterial(226),tunnel:beltMaterial(468)};
  // The return conveyor along the tunnel floor: its belts meet the lift belts when a lift is down.
  const rail=LIFT_DOWN-12-(WELL_FLOOR+.6);
  for(const y of [-27,68]){box(bench,'Return conveyor rail',[468,8,rail],[56,y,WELL_FLOOR+.6+rail/2],M.edge,.3);box(bench,'Return conveyor belt',[468,12,4],[56,y,LIFT_DOWN-10],belts.tunnel,0);}
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
  for(const y of [-27,68])box(bench,'Conveyor belt',[468,12,4],[56,y,-10],belts.line,0);
  for(const y of [-38.5,79.5])for(const [x0,x1] of [[-430,-302],[268,530]])box(bench,'Conveyor side guide',[x1-x0,4,12],[(x0+x1)/2,y,-6],M.silver,.6);
  const lifts={unload:createLift(bench,LINE_X.unload,belts.unload),load:createLift(bench,LINE_X.load,belts.load)};
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

  // The tester stands back from the line by the dock's stroke; its own frame is the cell's shifted DOCK_BACK in y.
  const tester=new T.Group();tester.position.y=DOCK_BACK;root.add(tester);
  box(tester,'Grey continuity tester',[78,57,35],[-104,110,18],grey,3);
  box(tester,'Tester gasket seam',[78.2,57.2,.65],[-104,110,15],M.rubber,.2);
  for(const x of [-136,-72])for(const y of [90,130])bolt(tester,x,y,35.7,1.4);
  const indicator=new T.MeshStandardMaterial({color:0x273c31,roughness:.28,metalness:.05,emissive:0x125832,emissiveIntensity:0});
  cyl(tester,'Indicator bezel',4.3,1.3,[-104,99,36],M.dark,32);cyl(tester,'Single pass indicator',3.2,1.1,[-104,99,36.9],indicator,32);
  // The dock: a spring-pin head on two guide rods out of the tester's front. Docked, its face sits on the pallet
  // adapter's rear face (cell y 74) with its locating pin in the adapter's bushing; retracted it is DOCK_STROKE back.
  const dockHead=new T.Group();dockHead.name='Dock head';tester.add(dockHead);
  const face=74-DOCK_BACK;
  box(dockHead,'Dock contact head',[28,5,10],[-104,face+2.5,DOCK_PIN[1]],M.dark,.5);
  const pin=cyl(dockHead,'Dock locating pin',1.5,4.4,[DOCK_PIN[0],face-2.2,DOCK_PIN[1]],M.silver,20);pin.rotation.x=0;
  const tip=new T.Mesh(cached('dock pin tip',()=>new T.CylinderGeometry(1.5,.6,1,20)),M.silver);tip.name='Dock locating pin';tip.position.set(DOCK_PIN[0],face-4.9,DOCK_PIN[1]);tip.castShadow=true;dockHead.add(tip);
  for(const x of [-116,-92]){const rod=cyl(dockHead,'Dock guide rod',1.4,22,[x,face+16,DOCK_PIN[1]],M.edge,20);rod.rotation.x=0;}
  for(const x of [-116,-92]){const b=cyl(tester,'Guide rod bushing',2.6,1,[x,81.5-.5,DOCK_PIN[1]],M.silver,24);b.rotation.x=0;}
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
  const wires=Array.from({length:pins},(_,i)=>{const mat=new T.MeshStandardMaterial({color:WIRE_COLOURS[i],roughness:.65});const w=new ArmCable(mat,HARNESS_POINTS,WIRE_RADIUS,LIVE_SEGMENTS);w.mesh.name=`Harness wire ${i+1}`;w.mesh.receiveShadow=true;root.add(w.mesh);return w;});
  const latch=plug.userData.latch as T.Group;
  // What the hanging harness can come to rest on: the fixed hardware and the live pallet at WORK.
  root.updateMatrixWorld(true);
  const rests:T.Box3[]=[];
  for(const g of [fixture,header,nest,comb,adapter,tester,bin,turnover,upcam])g.traverse(o=>{if(o instanceof T.Mesh&&!(o.geometry instanceof T.TubeGeometry)){for(let p:T.Object3D|null=o;p;p=p.parent)if(p===rotator)return;rests.push(new T.Box3().setFromObject(o));}});
  setHarnessObstacles(rests);
  // The rest of the line, built after the live harness field so their wires dress the same way.
  const carried=createCarried(pins,extra);
  const units={unload:createUnit(pins,extra,true),queue:createUnit(pins,extra,false),load:createUnit(pins,extra,false),carried:carried.unit};
  for(const u of Object.values(units))root.add(u.group);
  const toteLine=createToteLine(bench,root),picker=createPicker();root.add(picker.root);
  const tote={...toteLine.totes.fill,out:toteLine.totes.out,spare:toteLine.totes.spare,shutters:toteLine.shutters,mouth:toteLine.mouth} as LineRig['tote'];
  const rejectBin=createRejectBin();root.add(rejectBin);
  const rig={root,bench,pallet,plate,fixture,header,housing,pcb,nest,comb,adapter,tester,dockHead,bin,arm,tool,plug,latch,wires,indicator,turnover,rotator,cradleJaws,pins,upcam,upcamLight,wristLight:tool.light,wristStatus:tool.status,units,lifts,tote,rejectBin,belts,picker,carried};
  applyLine(rig,REST_LINE);
  return rig;
}
export type Cell=ReturnType<typeof createCell>;

// The line at rest, as at the start of the first unit: an empty pallet waiting at UNLOAD, the next unit queued,
// the load lift down.
export const REST_LINE:LineFrame={shift:0,dock:1,liveHarness:true,unloadZ:0,unloadUnit:'none',loadZ:LIFT_DOWN,tote:0,pack:false,swap:false,shot:'wide',focus:[...NEST],unitLabel:'',lineNote:''};
const lineSmooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(10+t*(-15+6*t));};
const ease=(t:number,a:number,b:number)=>lineSmooth((t-a)/(b-a));
// How far an empty pallet travels along the return tunnel to be out of sight under the bench.
export const RETURN_RUN=240;
// Lowered to LIFT_DOWN, a pallet and the unit it carries pass under the tunnel's roof with room to spare.
export const TUNNEL_TOP=LIFT_DOWN+44,WELL_FLOOR=LIFT_DOWN-20;
// A move at conveyor speed from 0 to 1 over t0..t1 that ramps up and down over `ramp` seconds.
function conveyed(t:number,t0:number,t1:number,ramp=.3){
  if(t<=t0)return 0;if(t>=t1)return 1;
  const T1=t1-t0,v=1/(T1-ramp),u=t-t0;
  if(u<ramp)return v*u*u/(2*ramp);if(u>T1-ramp){const w=T1-u;return 1-v*w*w/(2*ramp);}
  return v*(u-ramp/2);
}
// When the swapped totes run: the full one out to the store, then a fresh empty one from the store to E.
const OUT_END=4.2,SPARE=[1.8,5.4] as const;
const outX=(t:number)=>TOTE.F[0]+(TOTE.store-TOTE.F[0])*conveyed(t,SWAP.out,OUT_END);
const spareX=(t:number)=>TOTE.store+(TOTE.E[0]-TOTE.store)*conveyed(t,SPARE[0],SPARE[1]);
// The times the totes pass each shutter, found once: the full one's +x end past the face, the empty one's -x end out.
const passing=(x:(t:number)=>number,test:(x:number)=>boolean)=>{for(let t=0;t<8;t+=.002)if(test(x(t)))return t;return 8;};
const OUT_IN=passing(outX,x=>x+TOTE.size[0]/2<TOTE.face-12),OUT_NEAR=passing(outX,x=>x-TOTE.size[0]/2<TOTE.face+60);
const SPARE_OUT=passing(spareX,x=>x-TOTE.size[0]/2>TOTE.face+12);
// The packing moves at op-side time t (s) in a unit whose last unit passed: the picker's head point, the tilt of the
// board in its pads, how far its jaws are closed, and whether it holds the unit, which it packs into slot `slot`.
export function packing(t:number,slot:number){
  const pick=new T.Vector3(...PICK_AT),park=new T.Vector3(PICK_AT[0],PICK_AT[1],TRAVEL_Z),[sx,sy,sz]=slotPivot(slot);
  const place=new T.Vector3(TOTE.F[0]+sx,TOTE.F[1]+sy,TOTE.z+sz),over=new T.Vector3(place.x,place.y,TRAVEL_Z);
  const P=park.clone();let tilt=0,jaw=0;
  if(t<PICK.down){}
  else if(t<PICK.clamp)P.lerpVectors(park,pick,ease(t,PICK.down,PICK.clamp));
  else if(t<PICK.free){P.copy(pick);jaw=ease(t,PICK.clamp,PICK.closed);P.z+=6*ease(t,PICK.closed,PICK.free);}
  else if(t<PICK.lifted){jaw=1;P.copy(pick);P.z=pick.z+6+(TRAVEL_Z-pick.z-6)*ease(t,PICK.free,PICK.lifted);}
  else if(t<PICK.over){jaw=1;P.lerpVectors(park,over,ease(t,PICK.lifted,PICK.over));tilt=TILT*ease(t,PICK.lifted+.15,PICK.over-.1);}
  else if(t<PICK.open){jaw=1;tilt=TILT;P.lerpVectors(over,place,ease(t,PICK.over,PICK.placed));}
  else if(t<PICK.clear){tilt=TILT;jaw=1-ease(t,PICK.open,PICK.open+.15);P.lerpVectors(place,over,ease(t,PICK.open+.15,PICK.clear));}
  else if(t<PICK.home){P.lerpVectors(over,park,ease(t,PICK.clear,PICK.home));tilt=TILT*(1-ease(t,PICK.clear+.1,PICK.home-.1));}
  // The harness is drawn up into its coil from the plug outward as the board comes up: 0 lying as dressed .. 1 coiled.
  return {P,tilt,jaw,held:t>=PICK.closed&&t<PICK.open,morph:ease(t,PICK.closed,PICK.lifted+.15)};
}
// The three totes at op-side time t: the one being filled (rolling in from E while a full one is swapped), the full
// one rolling out to the store, and the empty one waiting at E (in the store until it is sent out). x, y; null: hidden.
export function totes(t:number,swap:boolean){
  const [F,E]=[TOTE.F,TOTE.E];
  if(!swap)return {fill:[F[0],F[1]],out:null,spare:[E[0],E[1]],shutters:[0,0]};
  const out=outX(t),spare=spareX(t),open=(a:number,b:number,c:number,d:number)=>ease(t,a,b)*(1-ease(t,c,d));
  return {
    fill:[F[0],E[1]+(F[1]-E[1])*ease(t,SWAP.in,SWAP.done)],
    out:t<OUT_IN+.4?[out,F[1]]:null,spare:t>SPARE[0]-.4?[spare,E[1]]:null,
    shutters:[open(OUT_NEAR-.35,OUT_NEAR,OUT_IN,OUT_IN+.35),open(SPARE[0]-.35,SPARE[0],SPARE_OUT,SPARE_OUT+.35)],
  } as {fill:number[];out:number[]|null;spare:number[]|null;shutters:number[]};
}

// Pose the line for one frame: the live pallet and its harness, the static units, the lifts, the belts, the tester's
// dock head, the picker, the unit it carries and the totes. Returns a key that changes whenever anything visible
// moved, for the shadow map.
type Tote={group:T.Group;shell:T.Group};
type Slots={mesh:T.Mesh;counts:number[]}[];
export interface LineRig {
  pallet:T.Object3D;plug:T.Object3D;wires:{mesh:T.Mesh}[];units:Record<'unload'|'queue'|'load'|'carried',PalletUnit>;lifts:{unload:T.Object3D;load:T.Object3D};dockHead:T.Object3D;
  belts:{line:T.MeshStandardMaterial;unload:T.MeshStandardMaterial;load:T.MeshStandardMaterial;tunnel:T.MeshStandardMaterial};
  picker:ReturnType<typeof createPicker>;carried:ReturnType<typeof createCarried>;
  tote:Tote&{out:Tote;spare:Tote;shutters:T.Mesh[];mouth:number[];slots?:{fill:Slots;out:Slots}};
}
const at=new T.Matrix4(),tilted=new T.Matrix4(),toLocal=new T.Matrix4(),world=new T.Vector3(),rigid=new T.Vector3();
export function applyLine(rig:LineRig,f:LineFrame&{progress?:number}){
  // The index runs on the robot's clock; the operator side (picker, lifts, return run, totes) on its own, which a
  // restart of the robot's cycle does not rewind.
  const s=f.shift,p=f.progress??0,op=f.lineProgress??p,t=opSeconds(op),indexing=p>=INDEX_START;
  rig.pallet.position.x=-s;
  rig.plug.visible=f.liveHarness;
  for(const w of rig.wires)w.mesh.position.x=-s;
  const {unload,queue,load,carried}=rig.units;
  // Down at the bottom of its lift, an empty pallet runs off into the return tunnel under the bench; the next one,
  // loaded upstream, runs in from it at the load end before its lift brings it up.
  const down=(z:number)=>z<=LIFT_DOWN+.01;
  const away=down(f.unloadZ)?indexing?1:ease(t,UNLOAD.away,UNLOAD.gone):0,coming=down(f.loadZ)&&!indexing?1-ease(t,LOAD.in,LOAD.under):0;
  unload.group.position.set(LINE_X.unload-LINE_X.work+RETURN_RUN*away,0,f.unloadZ);
  queue.group.position.set(PALLET_PITCH-s,0,0);
  load.group.position.set(2*PALLET_PITCH-s-RETURN_RUN*coming,0,f.loadZ);
  unload.group.visible=away<.999;load.group.visible=coming<.999;
  // Each lift waits up, its deck closing the well. The unload lift comes back up once its empty pallet has run off;
  // the load lift goes down for the next pallet just before it runs in.
  rig.lifts.unload.position.z=indexing?0:t>=UNLOAD.away?LIFT_DOWN*(1-ease(t,UNLOAD.up,UNLOAD.back)):f.unloadZ;
  rig.lifts.load.position.z=indexing?0:t<LOAD.in?LIFT_DOWN*ease(t,LOAD.down,LOAD.low):f.loadZ;
  // The belts run with the pallets on them; every run is a whole number of cleats, so 108 matches 0.
  const belt=(m:T.MeshStandardMaterial,d:number)=>{m.map!.offset.x=-(d/BELT_PITCH%1);};
  belt(rig.belts.line,s);belt(rig.belts.unload,s-RETURN_RUN*away);belt(rig.belts.load,s-RETURN_RUN*(1-coming));belt(rig.belts.tunnel,-RETURN_RUN*(away+1-coming));
  rig.dockHead.position.y=DOCK_STROKE*(1-f.dock);
  // The picker packs the finished unit; a bare board after a reject goes back down with its pallet.
  const pack=f.pack&&f.unloadUnit==='finished',slot=Math.max(0,Math.min(TOTE_SLOTS-1,f.tote-(pack&&t>=PICK.open?1:0)));
  const m=pack?packing(t,slot):packing(0,0);
  unload.board.visible=f.unloadUnit!=='none'&&!(pack&&t>=PICK.closed);unload.harness.visible=f.unloadUnit==='finished'&&!(pack&&t>=PICK.closed);
  unload.clamps.forEach((c,i)=>{c.position.z=pack?2*ease(t,.05,.2):0;c.rotation.z=(i?1:-1)*(pack?Math.PI/2*ease(t,.2,.45):0);});
  const pk=rig.picker;pk.x.position.x=m.P.x;pk.y.position.y=m.P.y;pk.head.position.z=m.P.z;
  for(const j of pk.jaws){j.jaw.position.y=j.side*(22+3*(1-m.jaw));j.pad.rotation.y=m.tilt;}
  // The carried unit: rigid in the pads, about the pivot.
  const c=rig.carried,cu=carried.group;cu.visible=pack&&m.held;
  at.makeTranslation(m.P.x,m.P.y,m.P.z).multiply(tilted.makeRotationY(m.tilt)).multiply(toLocal.makeTranslation(-PIVOT[0],-PIVOT[1],-PIVOT[2]));
  at.decompose(cu.position,cu.quaternion,cu.scale);
  if(cu.visible&&c.morph!==m.morph){
    // Near the plug the wires move with the board at once; further out they stay where they lie until drawn up.
    c.morph=m.morph;cu.updateMatrix();toLocal.copy(cu.matrix).invert();
    const lying=new T.Vector3(LINE_X.unload-LINE_X.work,0,0);
    c.wires.forEach((w,i)=>{const d=c.dressed[i],k=c.coil[i],out=c.points[i];
      for(let j=0;j<d.length;j++){const u=j/(d.length-1),stay=lineSmooth((j-1)/7),draw=lineSmooth(m.morph*1.6-.6*u);
        world.copy(d[j]).add(lying).applyMatrix4(toLocal);rigid.copy(d[j]).lerp(world,stay);out[j].copy(rigid).lerp(k[j],draw);}
      w.update(out);});
  }
  // The totes.
  const tp=totes(t,pack&&f.swap),place=(o:T.Object3D,xy:number[]|null,y:number)=>{o.visible=!!xy;o.position.set(xy?xy[0]:TOTE.store,xy?xy[1]:y,TOTE.z);};
  place(rig.tote.group,tp.fill,TOTE.F[1]);place(rig.tote.out.group,tp.out,TOTE.F[1]);place(rig.tote.spare.group,tp.spare,TOTE.E[1]);
  rig.tote.shutters.forEach((o,i)=>o.position.z=(rig.tote.mouth[0]+rig.tote.mouth[1])/2+95*tp.shutters[i]);
  if((f.tote>0||tp.out)&&!rig.tote.slots){rig.tote.slots={fill:slotSet(c,c.coil),out:slotSet(c,c.coil)};for(const x of rig.tote.slots.fill)rig.tote.group.add(x.mesh);for(const x of rig.tote.slots.out)rig.tote.out.group.add(x.mesh);}
  if(rig.tote.slots){for(const x of rig.tote.slots.fill){x.mesh.geometry.setDrawRange(0,x.counts[f.tote]);x.mesh.visible=f.tote>0;}for(const x of rig.tote.slots.out)x.mesh.visible=!!tp.out;}
  return [s,f.dock,f.liveHarness,f.unloadZ,f.unloadUnit,f.loadZ,f.tote,pack,f.swap,rig.lifts.unload.position.z,rig.lifts.load.position.z,away,coming,...m.P.toArray(),m.tilt,m.jaw,m.morph,...[tp.fill,tp.out,tp.spare].flat(),...tp.shutters,pack&&t<.5?t:0].map(v=>typeof v==='number'?v.toFixed(3):String(v)).join();
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
export function createPlug(pins=6,material=M.ivory.clone()){
  const halfX=pins===8?9.5:7.5;
  const group=new T.Group();group.name='Six-wire connector';
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
