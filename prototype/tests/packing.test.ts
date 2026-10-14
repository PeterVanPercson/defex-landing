import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,HEADER } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { applyLine,createCell,packing,totes,PIVOT,TILT,TOTE } from '../src/cell-geometry.ts';
import { CYCLE_END,INDEX_START,PICK,SWAP,TOTE_SLOTS,opSeconds } from '../src/line.ts';
import type { LineState } from '../src/line.ts';
import { WIRE_RADIUS } from '../src/harness.ts';

// The packing end: the unload picker, the unit it carries and the totes, sampled through the operator side's first
// seconds of a unit, against the bench, the pallets, the totes, the packed units and the arm.
const LIMIT=.3;
const cell=createCell(6);
const meshes=(root:T.Object3D)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
const shown=(o:T.Object3D)=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(!x.visible)return false;return true;};
const samples=new Map<T.BufferGeometry,T.Vector3[]>();
function sample(m:T.Mesh){
  let pts=samples.get(m.geometry);if(pts)return pts;
  m.geometry.computeBoundingBox();
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,pos=g.attributes.position;pts=[];
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),step=Math.max(1,Math.floor(pos.count/3/300));
  for(let i=0;i<pos.count;i++)pts.push(new T.Vector3().fromBufferAttribute(pos,i));
  for(let t=0;t<pos.count/3;t+=step){a.fromBufferAttribute(pos,3*t);b.fromBufferAttribute(pos,3*t+1);c.fromBufferAttribute(pos,3*t+2);for(const [u,v] of [[1/3,1/3],[.5,0],[0,.5],[.5,.5]])pts.push(a.clone().multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v));}
  samples.set(m.geometry,pts);return pts;
}
const q=new T.Vector3(),w=new T.Vector3(),inv=new T.Matrix4();
function depth(mesh:T.Mesh,point:T.Vector3,r=0){
  q.copy(point).applyMatrix4(inv.copy(mesh.matrixWorld).invert());const g=mesh.geometry as T.BufferGeometry & {parameters?:{radiusTop:number;height:number}};
  if(!g.boundingBox)g.computeBoundingBox();
  if(g.type==='CylinderGeometry')return Math.min(g.parameters!.radiusTop+r-Math.hypot(q.x,q.z),g.parameters!.height/2+r-Math.abs(q.y));
  const bb=g.boundingBox!;return Math.min(q.x-bb.min.x+r,bb.max.x+r-q.x,q.y-bb.min.y+r,bb.max.y+r-q.y,q.z-bb.min.z+r,bb.max.z+r-q.z);
}
function penetration(a:T.Mesh,b:T.Mesh){
  let best=0;const ia=new T.Matrix4().copy(a.matrixWorld).invert(),ib=new T.Matrix4().copy(b.matrixWorld).invert();
  const d=(m:T.Mesh,im:T.Matrix4,p:T.Vector3)=>{q.copy(p).applyMatrix4(im);const g=m.geometry as T.BufferGeometry & {parameters?:{radiusTop:number;height:number}};if(g.type==='CylinderGeometry')return Math.min(g.parameters!.radiusTop-Math.hypot(q.x,q.z),g.parameters!.height/2-Math.abs(q.y));const bb=g.boundingBox!;return Math.min(q.x-bb.min.x,bb.max.x-q.x,q.y-bb.min.y,bb.max.y-q.y,q.z-bb.min.z,bb.max.z-q.z);};
  for(const s of sample(a)){w.copy(s).applyMatrix4(a.matrixWorld);best=Math.max(best,d(b,ib,w));}
  for(const s of sample(b)){w.copy(s).applyMatrix4(b.matrixWorld);best=Math.max(best,d(a,ia,w));}
  return best;
}
// Seconds of the op side -> its progress (the op clock is monotonic).
const op=(t:number)=>{let lo=0,hi=INDEX_START;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(opSeconds(mid)<t)lo=mid;else hi=mid;}return hi;};
const flange=new T.Vector3(),cableEnd=new T.Vector3();
function pose(p:number,kind:CycleCase,line:LineState){
  const f=processFrame(p,kind,line);
  cell.tool.root.position.set(...f.tool);cell.plug.position.set(...f.plug);cell.plug.rotation.y=f.rotation;cell.header.position.set(HEADER[0],HEADER[1],0);
  applyLine(cell,{...f,progress:p});
  cell.arm.set(flange.copy(cell.tool.root.position).add(new T.Vector3(0,0,80)).divideScalar(5),0,cableEnd.copy(cell.tool.gland).add(cell.tool.root.position).add(new T.Vector3(3,0,0)).divideScalar(5));
  cell.root.updateMatrixWorld(true);return f;
}
// Ghost copies of the carried unit at the slots already packed: the packed meshes merge every slot into one draw,
// so each packed unit is checked as its own copy.
const ghosts=Array.from({length:TOTE_SLOTS},()=>{const g=cell.units.carried.group.clone(true);g.visible=true;cell.root.add(g);g.traverse(o=>{if(o instanceof T.Mesh&&o.name.startsWith('Carried wire'))o.visible=false;});return g;});
function placeGhosts(n:number,tote:T.Object3D){
  ghosts.forEach((g,i)=>{g.visible=i<n;if(!g.visible)return;
    const m=packing(PICK.placed+.01,i).P,at=new T.Matrix4().makeTranslation(m.x-TOTE.F[0]+tote.position.x,m.y-TOTE.F[1]+tote.position.y,m.z).multiply(new T.Matrix4().makeRotationY(TILT)).multiply(new T.Matrix4().makeTranslation(-PIVOT[0],-PIVOT[1],-PIVOT[2]));
    at.decompose(g.position,g.quaternion,g.scale);});
  cell.root.updateMatrixWorld(true);
}
const benchParts=meshes(cell.bench),pickerParts=meshes(cell.picker.root),armParts=meshes(cell.arm.root).filter(o=>o.name!=='Arm cable');
const carriedParts=meshes(cell.units.carried.board);
const lines:[string,LineState][]=[['slot 0 after a swap',{unit:TOTE_SLOTS+2,passed:TOTE_SLOTS+1,rejected:0,prev:'pass'}],['slot 3',{unit:5,passed:4,rejected:0,prev:'pass'}],['the last slot',{unit:TOTE_SLOTS+1,passed:TOTE_SLOTS,rejected:0,prev:'pass'}]];
const times=function*(){for(let t=0;t<=PICK.home+.3;t+=.02)yield t;};

test('the picker comes down, takes the finished unit, packs it on edge in its slot and goes home, clear of everything',()=>{
  const worst=new Map<string,number>();let checked=0;
  for(const [name,line] of lines)for(const t of times()){
    const p=op(t);pose(p,'pass',line);
    const slot=processFrame(p,'pass',line).tote-(t>=PICK.open?1:0);
    placeGhosts(Math.max(0,slot),cell.tote.group);
    const others=[...benchParts,...meshes(cell.units.unload.group),...meshes(cell.tote.group),...meshes(cell.tote.out.group),...meshes(cell.tote.spare.group),...armParts,...meshes(cell.rejectBin),...meshes(cell.bin),...ghosts.flatMap(g=>meshes(g))].filter(o=>shown(o)&&o.name!=='Packed units');
    const boxes=others.map(o=>new T.Box3().setFromObject(o));
    const movers=[...pickerParts,...(shown(cell.units.carried.group)?carriedParts:[])];
    for(const a of movers){
      const b=new T.Box3().setFromObject(a).expandByScalar(.5);
      for(let k=0;k<others.length;k++){
        const o=others[k];if(!b.intersectsBox(boxes[k]))continue;
        // the clamp's shoes hold the board's edges, and the board leaves its pallet's dowels through its holes
        if(a.name==='Edge clamp shoe'&&/FR4/.test(o.name)||/FR4|Board mounting/.test(a.name)&&o.name==='Locating dowel pin')continue;
        checked++;const d=penetration(a,o);if(d>LIMIT){const key=`${name}: ${a.name} / ${o.name}`;if(d>(worst.get(key)??0))worst.set(key,d);}
      }
    }
  }
  assert.ok(checked>1000,`${checked} pairs`);
  assert.deepEqual([...worst].slice(0,10).map(([k,d])=>`${k}: ${d.toFixed(2)} mm`),[]);
});

test('the picker, parked, stays clear of the arm through every case and the index',()=>{
  const worst=new Map<string,number>();
  for(const kind of ['pass','open','search'] as CycleCase[])for(let p=0;p<=CYCLE_END;p+=.5){
    pose(p,kind,{unit:3,passed:1,rejected:1,prev:'reject'});
    for(const a of pickerParts){const b=new T.Box3().setFromObject(a).expandByScalar(5);for(const o of armParts){if(!b.intersectsBox(new T.Box3().setFromObject(o)))continue;const d=penetration(a,o);worst.set(`${kind} ${a.name} / ${o.name} at ${p}`,d);}}
  }
  assert.deepEqual([...worst.keys()].slice(0,6),[],'5 mm or more from the arm');
});

test('placed, the unit stands exactly where its packed copy appears, and nothing pops at the release',()=>{
  for(const [name,line] of lines){
    const before=pose(op(PICK.open-.001),'pass',line),slot=before.tote;
    const carried=new T.Box3();for(const m of carriedParts)carried.union(new T.Box3().setFromObject(m));
    assert.ok(shown(cell.units.carried.group),`${name}: still carried just before the release`);
    const after=pose(op(PICK.open),'pass',line);assert.equal(after.tote,slot+1);
    assert.ok(!shown(cell.units.carried.group),`${name}: handed over at the release`);
    placeGhosts(slot+1,cell.tote.group);
    const ghost=new T.Box3();for(const m of meshes(ghosts[slot]))if(m.visible&&!m.name.startsWith('Carried wire'))ghost.union(new T.Box3().setFromObject(m));
    for(const k of ['min','max'] as const)assert.ok(carried[k].distanceTo(ghost[k])<1e-6,`${name}: carried ${carried[k].toArray()} vs packed ${ghost[k].toArray()}`);
    // the packed meshes draw exactly the slots filled, and the slot's copy is the carried geometry
    const slots=cell.tote.slots!.fill;for(const s of slots)assert.equal(s.mesh.geometry.drawRange.count,s.counts[slot+1]);
  }
});

test('the harness is drawn up off the pallet into its coil beside the board, its ends never parting from the plug',()=>{
  const line=lines[1][1];
  for(const t of times()){
    pose(op(t),'pass',line);if(!shown(cell.units.carried.group))continue;
    const plug=cell.units.carried.board.getObjectByName('Nylon connector housing')!;plug.updateMatrixWorld(true);
    for(const w of cell.carried.wires){
      const first=w.curve.points[0].clone().applyMatrix4(w.mesh.matrixWorld),local=first.clone().applyMatrix4(new T.Matrix4().copy(cell.units.carried.group.matrixWorld).invert());
      assert.ok(local.distanceTo(cell.carried.coil[cell.carried.wires.indexOf(w)][0])<1e-6,`wire leaves the housing at ${t}`);
      for(const p of w.curve.getPoints(160)){p.applyMatrix4(w.mesh.matrixWorld);assert.ok(p.z>-12+WIRE_RADIUS-.05,`wire under the worktop at ${t}`);}
    }
  }
  // coiled, every wire lies inside its slot in the tote
  pose(op(PICK.placed+.05),'pass',line);const tote=cell.tote.group,[w0]=TOTE.size;
  for(const w of cell.carried.wires)for(const p of w.curve.getPoints(200)){p.applyMatrix4(w.mesh.matrixWorld).sub(tote.position);assert.ok(Math.abs(p.x)<w0/2-2.5&&Math.abs(p.y)<TOTE.size[1]/2-2.5&&p.z>23,`coil at ${p.toArray()}`);}
});

test('a full tote rolls off into the store and an empty one rolls in, the totes and shutters never meeting',()=>{
  const line=lines[0][1],worst=new Map<string,number>(),shutters=cell.tote.shutters;
  let full=0;
  for(let t=0;t<=8;t+=.01){
    const p=op(Math.min(t,opSeconds(INDEX_START-.01)));pose(p,'pass',line);
    const groups=[cell.tote.group,cell.tote.out.group,cell.tote.spare.group].filter(shown);
    const box=(g:T.Object3D)=>{const b=new T.Box3();for(const m of meshes(g.children[0]))b.union(new T.Box3().setFromObject(m));return b;};
    for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)if(box(groups[i]).expandByScalar(-.01).intersectsBox(box(groups[j])))worst.set(`totes ${i}/${j} at ${t.toFixed(2)}`,1);
    for(const g of groups)for(const s of shutters){if(box(g).intersectsBox(new T.Box3().setFromObject(s)))worst.set(`a tote in a shutter at ${t.toFixed(2)}`,1);}
    if(shown(cell.tote.out.group))full++;
    // a tote is hidden only inside the store, behind a closed shutter
    for(const [g,s] of [[cell.tote.out.group,shutters[0]],[cell.tote.spare.group,shutters[1]]] as const)if(!shown(g)&&t>0)assert.ok(g.position.x+TOTE.size[0]/2<TOTE.face&&Math.abs(s.position.z-(cell.tote.mouth[0]+cell.tote.mouth[1])/2)<1e-6,`hidden outside the store at ${t}`);
  }
  assert.ok(full>100);assert.deepEqual([...worst.keys()].slice(0,6),[]);
  // the moves: the full tote leaves F before the empty one arrives, and the empty one is in F before the picker comes over
  const at=(t:number)=>totes(t,true);
  assert.ok(Math.abs(at(SWAP.done).fill[1]-TOTE.F[1])<1e-6&&SWAP.done<PICK.over);
  assert.deepEqual(at(0).fill,[TOTE.F[0],TOTE.E[1]]);assert.deepEqual(at(0).out,[TOTE.F[0],TOTE.F[1]]);assert.equal(at(0).spare,null);
  assert.deepEqual(totes(0,false),{...totes(0,false),fill:[TOTE.F[0],TOTE.F[1]],spare:[TOTE.E[0],TOTE.E[1]],out:null});
  assert.deepEqual(at(opSeconds(INDEX_START)).fill,[TOTE.F[0],TOTE.F[1]]);assert.deepEqual(at(opSeconds(INDEX_START)).spare,[TOTE.E[0],TOTE.E[1]]);assert.equal(at(opSeconds(INDEX_START)).out,null);
});

test('108 of a unit shows the line exactly as 0 of the next: units, picker, totes and packed slots',()=>{
  const world=()=>{const list:string[]=[];cell.root.updateMatrixWorld(true);cell.root.traverse(o=>{if(o instanceof T.Mesh&&shown(o)&&o.name!=='Harness wires'&&!cell.wires.some(w=>w.mesh===o)&&!ghosts.some(g=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(x===g)return true;return false;})){
    const b=new T.Box3().setFromObject(o),r=o.geometry.drawRange;list.push(`${(o.material as T.Material).name}|${o.geometry.attributes.position.count}|${Math.min(r.count,o.geometry.attributes.position.count)}|${[...b.min.toArray(),...b.max.toArray()].map(v=>v.toFixed(2)).join(',')}`);}});return list.sort();};
  ghosts.forEach(g=>g.visible=false);
  for(const [kind,line] of [['pass',{unit:TOTE_SLOTS+1,passed:TOTE_SLOTS,rejected:0,prev:'pass'}],['pass',{unit:4,passed:3,rejected:0,prev:'pass'}],['open',{unit:6,passed:4,rejected:1,prev:'pass'}],['pass',{unit:1,passed:0,rejected:0,prev:'none'}]] as [CycleCase,LineState][]){
    pose(CYCLE_END,kind,line);ghosts.forEach(g=>g.visible=false);const end=world(),belts=Object.values(cell.belts).map(m=>((m.map!.offset.x%1)+1)%1);
    const next={unit:line.unit+1,passed:line.passed+(kind==='pass'?1:0),rejected:line.rejected+(kind==='pass'?0:1),prev:kind==='pass'?'pass':'reject'} as LineState;
    pose(0,'pass',next);ghosts.forEach(g=>g.visible=false);const start=world();
    Object.values(cell.belts).forEach((m,i)=>{const d=Math.abs(((m.map!.offset.x%1)+1)%1-belts[i]);assert.ok(Math.min(d,1-d)<1e-6,`belt ${i} jumps by ${d}`);});
    const a=end.filter(x=>!start.includes(x)),b=start.filter(x=>!end.includes(x));
    assert.deepEqual([a.slice(0,4),b.slice(0,4)],[[],[]],`${kind} unit ${line.unit}`);
  }
});
