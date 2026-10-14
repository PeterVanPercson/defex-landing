import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,HEADER,UPCAM } from '../src/process.ts';
import type { CycleCase,ProcessFrame } from '../src/process.ts';
import { applyLine,createCell,DOCK_STROKE,poseLatch,posePlunger,RELEASE_GAP } from '../src/cell-geometry.ts';
import { dressHarness } from '../src/harness.ts';
import { contactCenters } from '../src/mechanism.ts';
import { CHAMFER,CLEAR_SPAN,GRIP_RAISE,INDEX_START,CYCLE_END,SHROUD_CLEARANCE } from '../src/line.ts';
import type { LineState } from '../src/line.ts';

// Sampled interpenetration of the rendered meshes over the scripted cycle. Each mesh is tested in its own
// frame as a box (its geometry bounds) or an exact cylinder; moving meshes are sampled on their surfaces.
const LIMIT=.3;
const cases:CycleCase[]=['pass','search','half-seat','open','short'];
// Unit 8 of a running line: the last unit passed, so the unload pallet carries a finished unit.
const RUNNING:LineState={unit:8,passed:7,rejected:0,prev:'pass'};
const cell=createCell(6);cell.header.position.set(HEADER[0],HEADER[1],0);
const under=(o:T.Object3D,root:T.Object3D)=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(x===root)return true;return false;};
const shown=(o:T.Object3D)=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(!x.visible)return false;return true;};
const meshes=(root:T.Object3D)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
const wire=(o:T.Mesh)=>cell.wires.some(w=>w.mesh===o);
const bench=(o:T.Mesh)=>under(o,cell.bench);
const units=Object.values(cell.units).map(u=>u.group);
// The rest of the line, far from where the tool works: tested on its own below.
const line=(o:T.Mesh)=>units.some(g=>under(o,g))||[cell.tote.group,cell.tote.out.group,cell.tote.spare.group,cell.rejectBin,cell.picker.root].some(g=>under(o,g))||cell.tote.shutters.includes(o);
// The upward camera's whole allowed footprint, 22 x 22 mm up to its window, as a solid block.
const upcam=new T.Mesh(new T.BoxGeometry(22,22,UPCAM[2]));upcam.name='Upward camera footprint';upcam.position.set(UPCAM[0],UPCAM[1],UPCAM[2]/2);cell.root.add(upcam);
const statics=meshes(cell.root).filter(o=>!under(o,cell.plug)&&!under(o,cell.tool.root)&&!under(o,cell.arm.root)&&!wire(o)&&!line(o)&&o.geometry.type!=='TubeGeometry');
const plugParts=meshes(cell.plug),toolParts=meshes(cell.tool.root);
const samples=new Map<T.Mesh,T.Vector3[]>();
function sample(m:T.Mesh){
  let pts=samples.get(m);if(pts)return pts;
  m.geometry.computeBoundingBox();
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,pos=g.attributes.position;pts=[];
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),step=Math.max(1,Math.floor(pos.count/3/200));
  for(let i=0;i<pos.count;i++)pts.push(new T.Vector3().fromBufferAttribute(pos,i));
  for(let t=0;t<pos.count/3;t+=step){a.fromBufferAttribute(pos,3*t);b.fromBufferAttribute(pos,3*t+1);c.fromBufferAttribute(pos,3*t+2);for(const [u,v] of [[1/3,1/3],[.5,0],[0,.5],[.5,.5]])pts.push(a.clone().multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v));}
  samples.set(m,pts);return pts;
}
for(const m of [...statics,...plugParts,...toolParts])sample(m);
const inverse=new Map<T.Mesh,T.Matrix4>(),q=new T.Vector3(),w=new T.Vector3();
const invert=(m:T.Mesh)=>{let i=inverse.get(m);if(!i)inverse.set(m,i=new T.Matrix4());return i.copy(m.matrixWorld).invert();};
function depth(mesh:T.Mesh,point:T.Vector3,r=0){
  q.copy(point).applyMatrix4(inverse.get(mesh)!);const g=mesh.geometry as T.BufferGeometry & {parameters?:{radiusTop:number;height:number}};
  if(g.type==='CylinderGeometry')return Math.min(g.parameters!.radiusTop+r-Math.hypot(q.x,q.z),g.parameters!.height/2+r-Math.abs(q.y));
  const bb=g.boundingBox!;return Math.min(q.x-bb.min.x+r,bb.max.x+r-q.x,q.y-bb.min.y+r,bb.max.y+r-q.y,q.z-bb.min.z+r,bb.max.z+r-q.z);
}
function penetration(a:T.Mesh,b:T.Mesh){
  let best=0;
  for(const s of sample(a)){w.copy(s).applyMatrix4(a.matrixWorld);best=Math.max(best,depth(b,w));}
  for(const s of sample(b)){w.copy(s).applyMatrix4(b.matrixWorld);best=Math.max(best,depth(a,w));}
  return best;
}
const flange=new T.Vector3(),cableEnd=new T.Vector3();
function pose(f:ProcessFrame){
  cell.tool.root.position.set(...f.tool);cell.plug.position.set(...f.plug);cell.plug.rotation.y=f.rotation;cell.rotator.rotation.y=f.cradle;poseLatch(cell.latch,f.latch);posePlunger(cell.tool.plunger,f.latch);
  cell.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);cell.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);
  applyLine(cell,f);
  cell.arm.set(flange.copy(cell.tool.root.position).add(new T.Vector3(0,0,80)).divideScalar(5),0,cableEnd.copy(cell.tool.gland).add(cell.tool.root.position).add(new T.Vector3(3,0,0)).divideScalar(5));
  cell.root.updateMatrixWorld(true);for(const m of [...statics,...plugParts,...toolParts])invert(m);
}
// World boxes of the statics that never move, computed once; the cradle and the dock head are boxed each pose.
const moving=(o:T.Object3D)=>under(o,cell.rotator)||o===cell.dockHead;
cell.root.updateMatrixWorld(true);
const fixedBoxes=new Map(statics.filter(o=>!moving(o)).map(o=>[o,new T.Box3().setFromObject(o)]));
const staticBox=(o:T.Mesh,out:T.Box3)=>fixedBoxes.get(o)??out.setFromObject(o);
const box=new T.Box3(),other=new T.Box3();
// Every 0.2 %, plus every 0.01 % through the turnover and the presses, where the clearances are tight.
function* progress(kind:CycleCase){for(let i=0;i<=500;i++)yield i/5;for(let i=2300;i<=3400;i+=2)yield i/100;for(let i=5000;i<=6200;i+=kind==='search'?1:4)yield i/100;}

test('the connector and the gripper never pass through the cell or each other',()=>{
  const worst=new Map<string,number>();
  for(const kind of cases)for(const p of progress(kind)){
    const f=processFrame(p,kind);pose(f);
    for(const [mover,pairs] of [[plugParts,statics],[toolParts,statics],[toolParts,plugParts]] as const)for(const a of mover){
      box.setFromObject(a).expandByScalar(.5);
      for(const b of pairs){
        if(mover===plugParts&&/Gold header pin|Header solder pad/.test(b.name)||bench(b))continue;
        if(!box.intersectsBox(pairs===statics?staticBox(b,other):other.setFromObject(b)))continue;
        const d=penetration(a,b);if(d>LIMIT){const key=`${kind} ${a.name} / ${b.name} at ${p}`;worst.set(key,d);}
      }
    }
  }
  assert.deepEqual([...worst].slice(0,8).map(([k,d])=>`${k}: ${d.toFixed(2)} mm`),[]);
});

test('the harness wires never pass through the cell, the gripper or their own housing',()=>{
  const points=Array.from({length:10},()=>new T.Vector3()),contacts=contactCenters(6),wires=new Map<string,[number,number]>();
  const targets=[...statics,...toolParts,...plugParts];
  const harnessProgress=function*(kind:CycleCase){for(let i=0;i<=500;i++)if(i>=250||i%5===0)yield i/5;if(kind==='search')for(let i=500;i<=620;i++)yield i/10;};
  for(const kind of cases)for(const p of harnessProgress(kind)){
    const f=processFrame(p,kind);pose(f);
    const bounds=targets.map(m=>new T.Box3().setFromObject(m).expandByScalar(.48));
    for(let i=0;i<6;i++){
      dressHarness(points,new T.Vector3(...f.plug),f.rotation,0,contacts[i],i,6);
      const curve=new T.CatmullRomCurve3(points,false,'centripetal');
      for(let j=2;j<=238;j++){
        const u=j/240,point=curve.getPoint(u);
        for(let k=0;k<targets.length;k++){
          const m=targets[k];if(!bounds[k].containsPoint(point))continue;
          if(plugParts.includes(m)&&u<.012||u>.93&&/tester connector|ferrule/i.test(m.name))continue;
          const d=depth(m,point,.48),key=`${kind} wire ${i+1} / ${m.name}`;if(d>LIMIT&&d>(wires.get(key)?.[0]??0))wires.set(key,[d,p]);
        }
      }
    }
  }
  assert.deepEqual([...wires].slice(0,12).map(([k,[d,p]])=>`${k}: ${d.toFixed(2)} mm at ${p}`),[]);
});

// The index, p 100..108: every pallet and what it carries against the fixed stations (the camera footprint, the
// tester and its retracted dock head, the cradle, the reject tray, the tote, the reject bin), against the tool and
// the arm waiting at home, and against each other. A cleared reject indexes its bare board out.
const indexing=function*(){for(let i=0;i<=160;i++)yield INDEX_START+i*(CYCLE_END-INDEX_START)/160;};
const lineStatics=[...meshes(cell.tester),...meshes(cell.turnover),...meshes(cell.bin),...meshes(cell.upcam),upcam,...meshes(cell.tote.group),...meshes(cell.rejectBin),...meshes(cell.picker.root),...toolParts,...meshes(cell.arm.root).filter(o=>o.name!=='Arm cable')];
// Docked, the dock head's locating pin sits in the adapter's bushing bore.
const seated=(a:T.Mesh,b:T.Mesh)=>/Pallet tester connector|Dock pin bushing|Dock pin bore/.test(a.name)&&b.name==='Dock locating pin';
const carriers=()=>[{name:'live pallet',root:cell.pallet,extra:shown(cell.plug)?plugParts:[]},...Object.entries(cell.units).map(([name,u])=>({name,root:u.group,extra:[] as T.Mesh[]}))];
test('pallets index through the cell clear of every station, the arm at home and each other',()=>{
  const worst=new Map<string,number>(),touching=new Set<string>();let carried=0,camera=Infinity;const foot=new T.Box3().setFromObject(upcam);
  for(const [kind,state] of [['pass',RUNNING],['open',RUNNING]] as const)for(const p of indexing()){
    const f=processFrame(p,kind,state);pose(f);
    // a cleared reject's harness is taken to the bin over the first CLEAR_SPAN of the index, before the pallets move
    if(p>INDEX_START)assert.equal(f.liveHarness,kind==='pass'||(p-INDEX_START)/(CYCLE_END-INDEX_START)<CLEAR_SPAN,`${kind} ${p}: live harness`);
    if(kind!=='pass'&&f.liveHarness&&p>INDEX_START)assert.equal(f.shift,0,`${kind} ${p}: the pallet waits for the harness to go`);
    for(const m of lineStatics)invert(m);
    const groups=carriers().filter(c=>shown(c.root)).map(c=>{const parts=[...meshes(c.root).filter(shown),...c.extra];const all=new T.Box3();for(const m of parts)all.union(box.setFromObject(m));return {...c,parts,all};});
    for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const a=groups[i].all.clone().expandByScalar(-.01),b=groups[j].all.clone().expandByScalar(-.01);
      if(a.intersectsBox(b))touching.add(`${kind} ${groups[i].name} / ${groups[j].name} at ${p.toFixed(2)}`);
    }
    carried+=groups.length;
    const near=lineStatics.filter(shown).map(m=>({m,b:new T.Box3().setFromObject(m)}));
    for(const g of groups){
      const zone=g.all.clone().expandByScalar(.5),hits=near.filter(s=>zone.intersectsBox(s.b));if(!hits.length)continue;
      for(const a of g.parts){
        box.setFromObject(a);
        // The tightest pass: the nest and the fixture go by the camera's footprint with 1 mm to spare.
        if(box.max.x>foot.min.x&&box.min.x<foot.max.x&&box.min.z<foot.max.z)camera=Math.min(camera,box.min.y-foot.max.y);
        box.expandByScalar(.5);invert(a);
        for(const s of hits){if(!box.intersectsBox(s.b)||seated(a,s.m))continue;const d=penetration(a,s.m);if(d>LIMIT)worst.set(`${kind} ${g.name} ${a.name} / ${s.m.name} at ${p.toFixed(2)}`,d);}
      }
    }
  }
  assert.ok(carried>=3*322,`${carried} pallet poses`);assert.ok(camera>=.99&&camera<1.5,`camera clearance ${camera}`);
  assert.deepEqual([...touching].slice(0,6),[]);
  assert.deepEqual([...worst].slice(0,8).map(([k,d])=>`${k}: ${d.toFixed(2)} mm`),[]);
});

test('docked, the tester head meets the adapter with its pin in the bushing; retracted 8 mm, it clears every passing adapter',()=>{
  const head=new T.Box3(),adapter=new T.Box3();
  const adapters=()=>carriers().filter(c=>shown(c.root)).flatMap(c=>meshes(c.root).filter(m=>m.name==='Pallet tester connector'));
  for(const p of [0,50,99.9]){
    pose(processFrame(p,'pass',RUNNING));head.setFromObject(cell.dockHead.getObjectByName('Dock contact head')!);adapter.setFromObject(cell.pallet.getObjectByName('Pallet tester connector')!);
    assert.ok(Math.abs(head.min.y-adapter.max.y)<.02,`docked gap ${head.min.y-adapter.max.y} at ${p}`);
    assert.ok(head.min.x>adapter.min.x-.01&&head.max.x<adapter.max.x+.01);
    const pin=new T.Box3().setFromObject(cell.dockHead.getObjectByName('Dock locating pin')!),bore=new T.Box3().setFromObject(cell.pallet.getObjectByName('Dock pin bore')!);
    assert.ok(pin.min.y<adapter.max.y-4&&Math.abs((pin.min.x+pin.max.x)/2-(bore.min.x+bore.max.x)/2)<1e-6&&Math.abs((pin.min.z+pin.max.z)/2-(bore.min.z+bore.max.z)/2)<1e-6,'the pin is in the bushing');
  }
  pose(processFrame(104,'pass',RUNNING));assert.equal(cell.dockHead.position.y,DOCK_STROKE);
  let checked=0;
  for(const p of indexing()){
    const f=processFrame(p,'pass',RUNNING);if(f.shift<=0||f.shift>=232)continue;
    assert.ok(f.dock<1e-6,`the head is still out at ${p} while the pallets move (${f.dock})`);
    pose(f);head.setFromObject(cell.dockHead);
    for(const m of adapters()){adapter.setFromObject(m);if(adapter.max.x<head.min.x||adapter.min.x>head.max.x)continue;checked++;assert.ok(head.min.y-adapter.max.y>=1.5-1e-6,`retracted gap ${head.min.y-adapter.max.y} at ${p}`);}
  }
  assert.ok(checked>20);
});

test('seated, the fingertips clear the header by 1.5 mm or more and still hold 3.5 mm of the housing',()=>{
  for(const kind of ['pass','search'] as const)for(let p=50;p<92;p+=.25){
    const f=processFrame(p,kind);if(f.seated!=='pass'||f.jaw>.01||f.retry)continue;
    pose(f);
    const headerTop=Math.max(...meshes(cell.housing).filter(m=>m.name!=='Latch catch').map(m=>new T.Box3().setFromObject(m).max.z));
    const body=new T.Box3().setFromObject(cell.plug.getObjectByName('Nylon connector housing')!);
    for(const finger of cell.tool.fingers){
      const tip=new T.Box3().setFromObject(finger.getObjectByName('Custom fingertip')!),face=new T.Box3().setFromObject(finger.getObjectByName('Housing contact face')!);
      assert.ok(tip.min.z-headerTop>=1.5-1e-6,`${kind} ${p}: fingertip ${tip.min.z.toFixed(3)} over header ${headerTop.toFixed(3)}`);
      assert.ok(Math.min(face.max.z,body.max.z)-Math.max(face.min.z,body.min.z)>=3.5,`${kind} ${p}: grip ${Math.min(face.max.z,body.max.z)-Math.max(face.min.z,body.min.z)}`);
    }
  }
  assert.equal(GRIP_RAISE,1.5);
});

test('placing and regripping in the cradle, the fingers keep 1 mm or more from the jaw carrier bar',()=>{
  const bar=cell.turnover.getObjectByName('Jaw carrier bar')!,parts=cell.tool.fingers.flatMap(g=>meshes(g));
  const gap=(a:T.Box3,b:T.Box3)=>Math.hypot(Math.max(a.min.x-b.max.x,b.min.x-a.max.x,0),Math.max(a.min.y-b.max.y,b.min.y-a.max.y,0),Math.max(a.min.z-b.max.z,b.min.z-a.max.z,0));
  let best=Infinity;
  for(const kind of ['pass','search'] as const)for(let p=23;p<=35;p+=.02){pose(processFrame(p,kind));const b=new T.Box3().setFromObject(bar);for(const m of parts)best=Math.min(best,gap(box.setFromObject(m),b));}
  assert.ok(best>=1,`closest ${best.toFixed(2)} mm`);
});

test('the latch tab stands above the seated header, and the tool plunger pushes it until the hook clears the catch',()=>{
  const f=processFrame(60,'pass');pose(f);
  const box3=(name:string,root:T.Object3D)=>new T.Box3().setFromObject(root.getObjectByName(name)!);
  const headerTop=box3('Header seating floor',cell.housing).max.z+6.9;
  assert.ok(box3('Latch press tab',cell.plug).min.z>headerTop+1,'the press tab is above the header');
  assert.ok(box3('Release blade',cell.tool.root).min.z>headerTop+1,'the plunger stays above the header');
  const catchFace=box3('Latch catch',cell.housing).max.y;
  for(const released of [0,.25,1]){
    poseLatch(cell.latch,released);posePlunger(cell.tool.plunger,released);cell.root.updateMatrixWorld(true);
    const hook=box3('Latch hook',cell.plug),tab=box3('Latch press tab',cell.plug),blade=box3('Release blade',cell.tool.root);
    const gap=tab.min.y-blade.max.y;
    if(released===0){assert.ok(hook.min.y<catchFace-.15,'engaged, the hook is under the catch');assert.ok(Math.abs(gap-RELEASE_GAP)<.06,`rest gap ${gap}`);}
    else if(released===1){assert.ok(hook.min.y>catchFace+.05,`released, the hook clears the catch (${hook.min.y} vs ${catchFace})`);assert.ok(gap>-.12&&gap<.05,`the blade is on the tab (${gap})`);}
    else assert.ok(gap>0,'the latch does not move before the blade reaches it');
  }
});

test('the shroud leaves 0.15 mm round the housing and has a 0.5 mm lead-in chamfer',()=>{
  cell.root.updateMatrixWorld(true);
  const plug=cell.plug.getObjectByName('Nylon connector housing') as T.Mesh;plug.geometry.computeBoundingBox();
  const half=plug.geometry.boundingBox!.max;
  const walls=meshes(cell.housing).filter(m=>m.geometry.type==='ExtrudeGeometry');assert.equal(walls.length,5);
  const inner=walls.map(m=>{const b=new T.Box3().setFromObject(m),c=b.getCenter(new T.Vector3()).sub(cell.header.position);return Math.abs(c.x)>Math.abs(c.y)*2?['x',Math.min(Math.abs(b.min.x-cell.header.position.x),Math.abs(b.max.x-cell.header.position.x))]:['y',Math.min(Math.abs(b.min.y-cell.header.position.y),Math.abs(b.max.y-cell.header.position.y))];});
  for(const [axis,face] of inner)assert.ok(Math.abs((face as number)-(axis==='x'?half.x:half.y)-SHROUD_CLEARANCE)<1e-6,`${axis} clearance ${(face as number)-(axis==='x'?half.x:half.y)}`);
  // In the wall's own frame (inner face at x 0, top at z 7.7) the top's inner edge is cut back by the chamfer.
  const pos=walls[0].geometry.attributes.position,top=Math.max(...Array.from({length:pos.count},(_,i)=>pos.getZ(i)));
  const topInner=Math.min(...Array.from({length:pos.count},(_,i)=>i).filter(i=>Math.abs(pos.getZ(i)-top)<1e-6).map(i=>pos.getX(i)));
  assert.ok(Math.abs(topInner-CHAMFER)<1e-6&&CHAMFER===.5,`chamfer ${topInner}`);
});

// The operator side over the whole unit: pallets go down the unload lift, run back along the return tunnel under
// the worktop, come up the load lift and index on. Every pallet, its hardware and its product stay clear of the
// worktop, the well liners, the tunnel and the conveyor, after a pass, after a cleared reject and on the first unit.
test('pallets ride the lifts and the return tunnel clear of the worktop, the well liners and the conveyor',()=>{
  const benchParts=meshes(cell.bench);for(const m of benchParts)sample(m);
  const worst=new Map<string,number>();let hidden=0,poses=0;
  const states:[CycleCase,LineState][]=[['pass',RUNNING],['open',{unit:5,passed:3,rejected:1,prev:'reject'}],['pass',{unit:1,passed:0,rejected:0,prev:'none'}]];
  for(const [kind,state] of states)for(let p=0;p<=CYCLE_END+1e-9;p+=.25){
    const f=processFrame(p,kind,state);pose(f);for(const m of benchParts)invert(m);
    const near=benchParts.map(m=>({m,b:new T.Box3().setFromObject(m)}));
    for(const c of carriers()){
      if(!shown(c.root)){hidden++;continue;}
      poses++;
      for(const a of meshes(c.root).filter(shown)){
        box.setFromObject(a).expandByScalar(.5);let checked=false;
        for(const s of near){if(!box.intersectsBox(s.b))continue;if(!checked){invert(a);sample(a);checked=true;}const d=penetration(a,s.m);if(d>LIMIT)worst.set(`${kind} unit ${state.unit} ${c.name} ${a.name} / ${s.m.name} at ${p}`,d);}
      }
    }
  }
  assert.ok(poses>600&&hidden>20,`${poses} shown and ${hidden} hidden pallet poses`);
  assert.deepEqual([...worst].slice(0,8).map(([k,d])=>`${k}: ${d.toFixed(2)} mm`),[]);
});

test('a lowered pallet and its tallest hardware pass under the return tunnel roof',()=>{
  pose(processFrame(22,'pass',RUNNING));
  const roof=meshes(cell.bench).filter(m=>m.name==='Phenolic worktop').map(m=>new T.Box3().setFromObject(m)).find(b=>b.min.x<-170&&b.max.x>280&&b.min.y<0&&b.max.y>70)!;
  const unit=new T.Box3();for(const m of meshes(cell.units.unload.hardware))unit.union(box.setFromObject(m));
  assert.ok(roof.min.z-unit.max.z>=2,`headroom ${roof.min.z-unit.max.z}`);
});
