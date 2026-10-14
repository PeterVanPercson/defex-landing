import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,HEADER } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { applyLine,createCell,packing,slotPivot,totes,BRUSH,HARNESS_POCKET,INSERT_TOP,PIVOT,TILT,TOTE } from '../src/cell-geometry.ts';
import { sampleRope } from '../src/rope.ts';
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
const lines:[string,LineState][]=[['slot 0 after a swap',{unit:TOTE_SLOTS+2,passed:TOTE_SLOTS+1,rejected:0,prev:'pass'}],['slot 1',{unit:3,passed:2,rejected:0,prev:'pass'}],['the last slot',{unit:TOTE_SLOTS+1,passed:TOTE_SLOTS,rejected:0,prev:'pass'}]];
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

// The six carried wires as drawn, in cell coordinates, and points along their tubes' curves.
const carriedCurves=()=>cell.carried.wires.map(w=>new T.CatmullRomCurve3(w.curve.points.map(p=>p.clone()),false,'centripetal'));
const curveLength=(c:T.CatmullRomCurve3)=>{let L=0;const a=c.getPoint(0),b=new T.Vector3();for(let j=1;j<=400;j++){c.getPoint(j/400,b);L+=a.distanceTo(b);a.copy(b);}return L;};
const slotOf=(line:LineState)=>processFrame(op(1),'pass',line).tote;
const polyline=(c:Float64Array,n:number)=>{let L=0;for(let i=1;i<n;i++)L+=Math.hypot(c[i*3]-c[i*3-3],c[i*3+1]-c[i*3-2],c[i*3+2]-c[i*3-1]);return L;};

test('the harness hangs from its plug as the board is lifted, carried and lowered, and never passes through anything',()=>{
  // what the wires can meet (each drawn wire within 0.9 mm, less than its own thickness, where the bundle meets a surface
  // steeply): the bench and the tote line, the reject tray and bin, the unload pallet, the tote and the
  // units already packed, the picker, and the carried board itself (its housing apart, where the wires leave it)
  const worst=new Map<string,number>(),where=new Map<string,string>();let checked=0;const R=WIRE_RADIUS,LIMIT_WIRE=.9;
  for(const [name,line] of lines)for(let t=PICK.closed;t<PICK.open;t+=.05){
    const p=op(t);pose(p,'pass',line);const slot=slotOf(line);placeGhosts(slot,cell.tote.group);
    assert.ok(cell.carried.wires.every(w=>w.mesh.visible),`${name}: wires shown while carried at ${t}`);
    // the wires leave the housing where they were dressed into it
    const local=new T.Matrix4().copy(cell.units.carried.group.matrixWorld).invert();
    cell.carried.wires.forEach((w,i)=>assert.ok(w.curve.points[0].clone().applyMatrix4(local).distanceTo(cell.carried.dressed[i][0])<1e-6,`${name}: wire ${i+1} leaves its housing at ${t}`));
    const targets=[...benchParts,...meshes(cell.units.unload.group),...meshes(cell.tote.group),...meshes(cell.rejectBin),...meshes(cell.bin),...pickerParts,...carriedParts,...ghosts.flatMap(g=>meshes(g))].filter(o=>shown(o)&&o.name!=='Packed units'&&!/comb tooth/i.test(o.name)&&o.geometry.type!=='TubeGeometry');
    const boxes=targets.map(o=>new T.Box3().setFromObject(o).expandByScalar(R));
    carriedCurves().forEach((curve,i)=>{for(let j=6;j<=294;j++){const u=j/300,point=curve.getPoint(u);for(let k=0;k<targets.length;k++){if(!boxes[k].containsPoint(point))continue;const m=targets[k];
      // the wires leave their housing, and their far ends sit in the tester connector's grommets until drawn out
      if(/connector housing|Wire entry seal/.test(m.name)&&u<.04||u>.93&&/tester connector|ferrule|Ferrule/i.test(m.name))continue;
      checked++;const d=depth(m,point,R);if(d>LIMIT_WIRE){const key=`${name}: wire ${i+1} / ${m.name}`;if(d>(worst.get(key)??0)){worst.set(key,d);where.set(key,`u ${u.toFixed(3)} t ${t.toFixed(2)}`);}}}}});
  }
  ghosts.forEach(g=>g.visible=false);
  assert.ok(checked>1000,`${checked} wire points near something`);
  assert.deepEqual([...worst].slice(0,14).map(([k,d])=>`${k}: ${d.toFixed(2)} mm (${where.get(k)})`),[]);
});

test('the harness keeps its length, comes to rest in its own slot before the jaws open, and the packed copy is exactly it',()=>{
  for(const [name,line] of lines){
    const slot=slotOf(line),track=cell.carried.tracks[slot],dressed=cell.carried.dressed.map(w=>curveLength(new T.CatmullRomCurve3(w,false,'centripetal')));
    // The bundle itself never stretches (its centreline within 2.5 % of its length), and each drawn wire keeps to within
    // 10 %: drawn round the bundle's centre, the wire on the inside of a coil in the pile runs that much shorter.
    const n0=track.rope.n,c0=new Float64Array(n0*3);sampleRope(track.rope,PICK.closed,c0);const length0=polyline(c0,n0);
    for(let t=PICK.closed;t<PICK.open;t+=.1){
      pose(op(t),'pass',line);carriedCurves().forEach((c,i)=>{const L=curveLength(c);assert.ok(Math.abs(L/dressed[i]-1)<.1,`${name}: wire ${i+1} ${L.toFixed(1)} mm of ${dressed[i].toFixed(1)} at ${t.toFixed(2)}`);});
      const c1=new Float64Array(n0*3);sampleRope(track.rope,t,c1);const L=polyline(c1,n0);assert.ok(Math.abs(L/length0-1)<.025,`${name}: bundle ${L.toFixed(1)} mm of ${length0.toFixed(1)} at ${t.toFixed(2)}`);
    }
    // at rest: no part of the harness moves more than 2.5 mm over the last quarter second
    const n=track.rope.n,a=new Float64Array(n*3),b=new Float64Array(n*3);sampleRope(track.rope,PICK.open-.25,a);sampleRope(track.rope,PICK.open,b);
    let moved=0;for(let i=0;i<n;i++)moved=Math.max(moved,Math.hypot(a[i*3]-b[i*3],a[i*3+1]-b[i*3+1],a[i*3+2]-b[i*3+2]));
    assert.ok(moved<2.5,`${name}: still moving ${moved.toFixed(2)} mm`);
    // in its slot: between the dividers (or the tote's wall), inside the tote, on the insert
    const [sx]=slotPivot(slot),hi=sx+.8+HARNESS_POCKET,lo=sx-.8-(TOTE.pitch-.8-HARNESS_POCKET-1.6),[,d]=TOTE.size;
    pose(op(PICK.open-1e-6),'pass',line);const tote=cell.tote.group.position;
    for(const c of carriedCurves())for(const q of c.getPoints(300)){const x=q.x-tote.x,y=q.y-tote.y,z=q.z-tote.z;
      assert.ok(x<hi-WIRE_RADIUS+.9&&x>lo+WIRE_RADIUS-.9&&Math.abs(y)<d/2-2.5-WIRE_RADIUS+.9&&z>INSERT_TOP+WIRE_RADIUS-.9,`${name}: wire at ${[x,y,z].map(v=>v.toFixed(1))} outside slot ${slot} (${lo.toFixed(1)}..${hi.toFixed(1)})`);}
    // handed over: the packed copy's wire vertices are the carried wires' own, to a hundredth of a mm
    const carried=cell.carried.wires.map(w=>Array.from(w.geometry.attributes.position.array as Float32Array));
    pose(op(PICK.open),'pass',line);
    const entry=cell.tote.slots.fill.find(x=>(x.mesh.material as T.MeshStandardMaterial).vertexColors)!;
    const pos=entry.mesh.geometry.attributes.position,start=entry.counts[slot];let k=start,worst=0;
    for(const wire of carried){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(wire),3));g.setIndex(cell.carried.wires[0].geometry.index);const flat=g.toNonIndexed().attributes.position;
      for(let v=0;v<flat.count;v++,k++)worst=Math.max(worst,Math.abs(flat.getX(v)-tote.x-pos.getX(k)),Math.abs(flat.getY(v)-tote.y-pos.getY(k)),Math.abs(flat.getZ(v)-tote.z-pos.getZ(k)));}
    assert.equal(k,entry.counts[slot+1],`${name}: slot ${slot} copy has the carried wires' vertices`);
    assert.ok(worst<.01,`${name}: packed copy differs by ${worst.toFixed(4)} mm`);
  }
  // packed units stand inside the tote's rim
  for(const x of cell.tote.slots.fill){x.mesh.geometry.computeBoundingBox();assert.ok(x.mesh.geometry.boundingBox!.max.z<TOTE.size[2]+1,`${(x.mesh.material as T.Material).name} stands ${x.mesh.geometry.boundingBox!.max.z.toFixed(1)} above the tote floor`);}
});

// Every frame at the player's 60 fps, the simulated harness of the pick (each slot) and of a cleared reject's post: the
// bundle keeps its length (within 3 %), no segment of it stretches more than 15 %, and no part of it moves faster than
// 600 mm/s, so nothing whips or snaps. In the post, what is under the bin's brush seal is out of sight: its speed is
// not looked at there (it is still held to its length).
function motion(rope:{n:number;t0:number;t1:number},sample:(t:number,out:Float64Array)=>void,seen:(z:number)=>boolean){
  const n=rope.n,a=new Float64Array(n*3),b=new Float64Array(n*3),rest=new Float64Array(n-1);sample(rope.t0,a);
  let L0=0;for(let i=1;i<n;i++){rest[i-1]=Math.hypot(a[i*3]-a[i*3-3],a[i*3+1]-a[i*3-2],a[i*3+2]-a[i*3-1]);L0+=rest[i-1];}
  const worst={length:0,segment:0,speed:0,at:''};
  for(let k=1;rope.t0+k/60<rope.t1;k++){
    const t=rope.t0+k/60;sample(t,b);let L=0;
    for(let i=1;i<n;i++){const d=Math.hypot(b[i*3]-b[i*3-3],b[i*3+1]-b[i*3-2],b[i*3+2]-b[i*3-1]);L+=d;if(d/rest[i-1]-1>worst.segment){worst.segment=d/rest[i-1]-1;worst.at=`segment ${i} at ${t.toFixed(3)}`;}}
    worst.length=Math.max(worst.length,Math.abs(L/L0-1));
    for(let i=0;i<n;i++){if(!seen(b[i*3+2]))continue;const v=Math.hypot(b[i*3]-a[i*3],b[i*3+1]-a[i*3+1],b[i*3+2]-a[i*3+2])*60;if(v>worst.speed)worst.speed=v;}
    a.set(b);
  }
  return worst;
}
test('every frame of the pick and of the post, the harness keeps its length and never whips',()=>{
  type Track={rope:{n:number;t0:number;t1:number;fps:number;frames:Float32Array;count:number}};
  const tracks=(cell as unknown as {carried:{tracks:Track[]};post:{track:Track}});
  const check=(name:string,track:Track,seen:(z:number)=>boolean)=>{
    const w=motion(track.rope,(t,out)=>sampleRope(track.rope as never,t,out),seen);
    assert.ok(w.length<=.03,`${name}: length off by ${(w.length*100).toFixed(1)} %`);
    assert.ok(w.segment<=.15,`${name}: ${w.at} stretched ${(w.segment*100).toFixed(0)} %`);
    assert.ok(w.speed<=600,`${name}: ${w.speed.toFixed(0)} mm/s`);
  };
  tracks.carried.tracks.forEach((t,slot)=>check(`slot ${slot}`,t,()=>true));
  check('post',tracks.post.track,z=>z>BRUSH.z[1]-1);
});

test('the simulated harness is the same every time it is built',async()=>{
  const again=await import('../src/cell-geometry.ts?second-build'),other=again.createCell(6);
  cell.carried.tracks.forEach((track,i)=>{const b=other.carried.tracks[i].rope.frames;assert.equal(b.length,track.rope.frames.length);assert.ok(track.rope.frames.every((v,k)=>v===b[k]),`slot ${i} frames differ`);});
  const a=(cell as unknown as {post:{track:{rope:{frames:Float32Array}}}}).post.track.rope.frames,b=(other as unknown as {post:{track:{rope:{frames:Float32Array}}}}).post.track.rope.frames;
  assert.ok(a.length===b.length&&a.every((v,k)=>v===b[k]),'post frames differ');
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
