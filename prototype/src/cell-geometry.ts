import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { finishes as M } from './finishes.ts';
import { createCobot, ArmCable } from './cobot.ts';
import { plugHousing, contactCenters } from './mechanism.ts';
import { NEST, REJECT, TURNOVER, UPCAM } from './process.ts';
import { HARNESS_POINTS, WIRE_RADIUS, setHarnessObstacles } from './harness.ts';

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

export function createCell(pins=6){
  const halfX=pins===8?9.5:7.5, extra=halfX-7.5;
  const root=new T.Group();root.name='Connector workcell';
  const bench=new T.Group();root.add(bench);
  box(bench,'Aluminium jig plate',[570,380,12],[-17,30,-6],jig,1);
  for(const x of [-292,258])for(const y of [-150,210])bolt(bench,x,y,.1,3.2);
  box(bench,'Phenolic worktop',[1000,700,30],[40,30,-27],top,2);
  box(bench,'Cabinet body',[970,660,630],[40,40,-357],cabinet,3);
  box(bench,'Cabinet plinth',[930,600,60],[40,50,-705],M.rubber,1);
  for(const [x,w] of [[-210,450],[275,450]])for(const [z,h] of [[-110,120],[-240,120],[-400,180],[-590,180]]){
    box(bench,'Drawer front',[w,6,h],[x+5,-292,z],cabinet,2.5);
    box(bench,'Drawer pull',[w*.45,10,8],[x+5,-299,z+h/2-22],M.silver,3);
    box(bench,'Drawer label slot',[46,3,16],[x+5-w*.36,-296,z+h/2-22],M.dark,1);
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
  for(const [sz,ps] of [[[1.2,10.4,7.7],[-8.5-extra,0,14.15]],[[1.2,10.4,7.7],[8.5+extra,0,14.15]],[[15.8+2*extra,1.2,7.7],[0,4.65,14.15]],[[6.2+extra,1.2,7.7],[-4.8-extra/2,-4.65,14.15]],[[6.2+extra,1.2,7.7],[4.8+extra/2,-4.65,14.15]]])box(housing,'Molded PBT header',sz,ps,M.polymer,.2);
  box(housing,'Header seating floor',[17+2*extra,10.4,1.2],[0,0,10.5],M.polymer,.15);
  box(housing,'Latch catch',[3.2,1,1.3],[0,-5.2,13.5],M.polymer,.15);
  for(const [x,y] of contactCenters(pins)){cyl(header,'Gold header pin',.35,5.5,[x,y,13.3],M.gold,16);cyl(pcb,'Header solder pad',.9,.08,[x,y,9.7],solder,16);}

  const nest=new T.Group();nest.position.set(NEST[0],NEST[1],0);root.add(nest);
  box(nest,'Quick-change nest plate',[44,44,5],[0,0,2.5],M.body,.6);
  for(const x of [-17,17])for(const y of [-17,17])bolt(nest,x,y,5.2,1.8);
  // The guides stand 0.1 mm off the housing ends and rise past its lower edge, so they locate X.
  for(const x of [-8.6,8.6])box(nest,'Nest end guide',[2,11,11],[x,0,10.5],M.polymer,.4);
  for(const x of [-6.8,6.8])box(nest,'Housing support rail',[1.2,7.2,7],[x,0,8.5],M.polymer,.2);
  box(nest,'Housing recess',[16.8,8.9,.25],[0,0,5.15],M.bore,.3);
  box(nest,'Nest locating ledge',[18,2,4],[0,-5.5,14],M.polymer,.3);
  // The far ledge is split so the wires leaving the underside of the face-up housing pass between its halves.
  for(const x of [-7.5,7.5])box(nest,'Nest locating ledge',[3,2,4],[x,5.5,14],M.polymer,.3);
  const comb=new T.Group();comb.position.set(-104,38,0);root.add(comb);
  box(comb,'Cable comb base',[pins*3+8,14,8],[0,0,4],M.polymer,.6);
  for(let i=0;i<=pins;i++)box(comb,'Cable comb tooth',[1.3,13,7],[-pins*1.5+i*3,0,10],M.polymer,.25);
  for(const s of [-1,1])bolt(comb,s*16,0,1,1.8);

  const tester=new T.Group();root.add(tester);
  box(tester,'Grey continuity tester',[78,57,35],[-104,110,18],grey,3);
  box(tester,'Tester gasket seam',[78.2,57.2,.65],[-104,110,15],M.rubber,.2);
  for(const x of [-136,-72])for(const y of [90,130])bolt(tester,x,y,35.7,1.4);
  const indicator=new T.MeshStandardMaterial({color:0x273c31,roughness:.28,metalness:.05,emissive:0x125832,emissiveIntensity:0});
  cyl(tester,'Indicator bezel',4.3,1.3,[-104,99,36],M.dark,32);cyl(tester,'Single pass indicator',3.2,1.1,[-104,99,36.9],indicator,32);
  box(tester,'Harness tester connector',[pins*3+6,6,11],[-104,79,16],M.dark,.5);
  for(let i=0;i<pins;i++)cyl(tester,'Harness wire ferrule',.7,1,[-104+(i-(pins-1)/2)*3,78,17],M.rubber,12);
  box(tester,'Board test connector',[12,7,7],[-63,118,13],M.dark,.3);
  tube(tester,[[-62,118,13],[-39,114,9],[-35,50,3],[-22,28,6],[-20,22,8]],1.7,M.rubber);
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
    box(jaw,'Turnover clamping jaw',[11,3,10],[0,y,0],M.dark,.5);
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
  const wires=Array.from({length:pins},(_,i)=>{const mat=new T.MeshStandardMaterial({color:[0x9c6534,0x2c3234,0xc4b99e,0x697960,0x596c82,0x864d49,0x9c9b82,0x415451][i],roughness:.65});const w=new ArmCable(mat,HARNESS_POINTS,WIRE_RADIUS,320);w.mesh.name=`Harness wire ${i+1}`;root.add(w.mesh);return w;});
  const latch=plug.userData.latch as T.Group;
  // What the hanging harness can come to rest on: the fixed hardware on the plate.
  root.updateMatrixWorld(true);
  const rests:T.Box3[]=[];
  for(const g of [fixture,header,nest,comb,tester,bin,turnover,upcam])g.traverse(o=>{if(o instanceof T.Mesh&&!(o.geometry instanceof T.TubeGeometry)){for(let p:T.Object3D|null=o;p;p=p.parent)if(p===rotator)return;rests.push(new T.Box3().setFromObject(o));}});
  setHarnessObstacles(rests);
  return {root,bench,fixture,header,housing,pcb,nest,tester,bin,arm,tool,plug,latch,wires,indicator,turnover,rotator,cradleJaws,pins,upcam,upcamLight,wristLight:tool.light,wristStatus:tool.status};
}
// Hold the latch released (1) or let it spring back (0).
export function poseLatch(latch:T.Object3D,released:number){latch.rotation.x=.13*released;}
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
  // The beam pivots at its root (z 2.2); latch.rotation.x = 0.13 holds the hook 0.6 mm inward, released.
  const latch=new T.Group();latch.name='Connector latch';latch.position.set(0,-4,2.2);group.add(latch);
  box(latch,'Free latch beam',[2,.55,5],[0,0,-2.5],M.ivory,.12);box(latch,'Latch hook',[2.3,1,1],[0,-.35,-4.8],M.ivory,.12);
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
  const fingers=[-1,1].map(s=>{
    const g=new T.Group();g.position.x=s*extra;g.userData.extra=s*extra;root.add(g);
    box(g,'Moving jaw carriage',[11,20,7],[s*14,0,30],M.dark,.45);
    box(g,'Brushed aluminium finger',[5.4,10,19],[s*13,0,18.5],M.silver,.5);
    box(g,'Custom fingertip',[5.1,6.6,6],[s*10.5,0,6],M.silver,.32);
    box(g,'Housing contact face',[.35,5.2,5.8],[s*7.68,0,5.9],M.rubber,.05);
    box(g,'Insertion back stop',[1.6,2,1.2],[s*6.9,-2,8.8],M.silver,.12);
    for(const z of [16,24]){const b=cyl(g,'Finger mounting screw',1.5,.4,[s*13,-5.2,z],M.dark,20);b.rotation.x=0;}
    return g;
  });
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
  return {root,fingers,gland,light,status};
}

export function disposeCell(root:T.Object3D){
  const shared=new Set<T.Material>([...Object.values(M),pcbMaterial,grey,solder,ink,jig,top,cabinet,lensGlass,windowGlass]);
  const cachedGeometry=new Set(geometry.values()),seenGeometry=new Set<T.BufferGeometry>(),seenMaterials=new Set<T.Material>();
  root.traverse(o=>{if(o instanceof T.Mesh){if(!cachedGeometry.has(o.geometry))seenGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!shared.has(m))seenMaterials.add(m);}});
  seenGeometry.forEach(g=>g.dispose());seenMaterials.forEach(m=>m.dispose());
}

export function createHall(){
  const hall=new T.Group();hall.name='Empty factory hall';
  const paint=new T.MeshStandardMaterial({color:0xe9ebeb,roughness:.8,envMapIntensity:.5});
  const wall=new T.MeshStandardMaterial({color:0x9aa1a3,roughness:.9,envMapIntensity:.45});
  const floor=new T.MeshPhysicalMaterial({color:0x7f8584,roughness:.38,metalness:0,clearcoat:.6,clearcoatRoughness:.22});
  const steel=new T.MeshStandardMaterial({color:0x8b9194,roughness:.6,metalness:.3,envMapIntensity:.5});
  const panel=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,fog:false});
  const glass=new T.MeshBasicMaterial({color:new T.Color(0xf4f8fa),toneMapped:false});
  box(hall,'Factory floor',[30000,30000,30],[0,6000,-750],floor,0);
  for(let i=-3;i<=3;i++){box(hall,'Floor saw cut',[8,30000,1],[i*6000+1800,6000,-734.6],new T.MeshStandardMaterial({color:0x7d8281,roughness:.6}),0);box(hall,'Floor saw cut',[30000,8,1],[0,i*6000+5400,-734.6],new T.MeshStandardMaterial({color:0x7d8281,roughness:.6}),0);}
  box(hall,'Far wall',[30000,100,9000],[0,14000,3700],wall,0);box(hall,'Wall dado',[30000,60,1200],[0,13930,-150],new T.MeshStandardMaterial({color:0x5c6265,roughness:.8,envMapIntensity:.4}),0);
  for(const x of [-9600,-4800,0,4800,9600])for(const y of [3000,7500]){
    box(hall,'Factory column',[300,300,8800],[x,y,3650],paint,0);
  }
  for(const y of [3000,7500])box(hall,'Roof girder',[30000,200,500],[0,y,7600],steel,0);
  for(let x=-14400;x<=14400;x+=2400)box(hall,'Roof purlin',[120,16000,160],[x,8000,7900],steel,0);
  box(hall,'Roof deck',[30000,30000,40],[0,6000,8100],wall,0);
  for(let x=-12000;x<=12000;x+=2400)for(let y=0;y<=14400;y+=3600)box(hall,'LED high bay',[600,600,20],[x+1200,y+1200,7300],panel,0);
  for(let x=-12000;x<=12000;x+=3000){box(hall,'Clerestory window',[2200,30,700],[x,13940,6200],glass,0);box(hall,'Ribbon window',[2400,30,1100],[x+1500,13940,1800],glass,0);for(let k=-2;k<=2;k++)box(hall,'Window mullion',[50,40,1100],[x+1500+k*600,13920,1800],steel,0);box(hall,'Window transom',[2400,40,50],[x+1500,13920,1800],steel,0);}
  return hall;
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
