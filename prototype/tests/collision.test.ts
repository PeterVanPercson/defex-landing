import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,HEADER } from '../src/process.ts';
import type { CycleCase,ProcessFrame } from '../src/process.ts';
import { createCell,poseLatch } from '../src/cell-geometry.ts';
import { dressHarness } from '../src/harness.ts';
import { contactCenters } from '../src/mechanism.ts';

// Sampled interpenetration of the rendered meshes over the scripted cycle. Each mesh is tested in its own
// frame as a box (its geometry bounds) or an exact cylinder; moving meshes are sampled on their surfaces.
const LIMIT=.3;
const cases:CycleCase[]=['search','latched','half-seat','open','short'];
const cell=createCell(6);cell.header.position.set(HEADER[0],HEADER[1],0);
const under=(o:T.Object3D,root:T.Object3D)=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(x===root)return true;return false;};
const meshes=(root:T.Object3D)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
const wire=(o:T.Mesh)=>cell.wires.some(w=>w.mesh===o);
const bench=(o:T.Mesh)=>under(o,cell.bench);
const statics=meshes(cell.root).filter(o=>!under(o,cell.plug)&&!under(o,cell.tool.root)&&!under(o,cell.arm.root)&&!wire(o)&&o.geometry.type!=='TubeGeometry');
const plugParts=meshes(cell.plug),toolParts=meshes(cell.tool.root);
const samples=new Map<T.Mesh,T.Vector3[]>();
for(const m of [...statics,...plugParts,...toolParts]){
  m.geometry.computeBoundingBox();
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,pos=g.attributes.position,pts:T.Vector3[]=[];
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),step=Math.max(1,Math.floor(pos.count/3/200));
  for(let i=0;i<pos.count;i++)pts.push(new T.Vector3().fromBufferAttribute(pos,i));
  for(let t=0;t<pos.count/3;t+=step){a.fromBufferAttribute(pos,3*t);b.fromBufferAttribute(pos,3*t+1);c.fromBufferAttribute(pos,3*t+2);for(const [u,v] of [[1/3,1/3],[.5,0],[0,.5],[.5,.5]])pts.push(a.clone().multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v));}
  samples.set(m,pts);
}
const inverse=new Map<T.Mesh,T.Matrix4>(),q=new T.Vector3(),w=new T.Vector3();
function depth(mesh:T.Mesh,point:T.Vector3,r=0){
  q.copy(point).applyMatrix4(inverse.get(mesh)!);const g=mesh.geometry as T.BufferGeometry & {parameters?:{radiusTop:number;height:number}};
  if(g.type==='CylinderGeometry')return Math.min(g.parameters!.radiusTop+r-Math.hypot(q.x,q.z),g.parameters!.height/2+r-Math.abs(q.y));
  const bb=g.boundingBox!;return Math.min(q.x-bb.min.x+r,bb.max.x+r-q.x,q.y-bb.min.y+r,bb.max.y+r-q.y,q.z-bb.min.z+r,bb.max.z+r-q.z);
}
function penetration(a:T.Mesh,b:T.Mesh){
  let best=0;
  for(const s of samples.get(a)!){w.copy(s).applyMatrix4(a.matrixWorld);best=Math.max(best,depth(b,w));}
  for(const s of samples.get(b)!){w.copy(s).applyMatrix4(b.matrixWorld);best=Math.max(best,depth(a,w));}
  return best;
}
function pose(f:ProcessFrame){
  cell.tool.root.position.set(...f.tool);cell.plug.position.set(...f.plug);cell.plug.rotation.y=f.rotation;cell.rotator.rotation.y=f.cradle;poseLatch(cell.latch,f.latch);
  cell.tool.fingers.forEach((g,i)=>g.position.x=(i?1:-1)*f.jaw*7);cell.cradleJaws.forEach((g,i)=>g.position.y=(i?1:-1)*f.cradleGrip*5);
  cell.root.updateMatrixWorld(true);for(const m of [...statics,...plugParts,...toolParts])inverse.set(m,m.matrixWorld.clone().invert());
}
const box=new T.Box3(),other=new T.Box3();
function* progress(kind:CycleCase){for(let i=0;i<=500;i++)yield i/5;if(kind==='search')for(let i=2800;i<=4000;i++)yield i/100;}

test('the connector and the gripper never pass through the cell or each other',()=>{
  const worst=new Map<string,number>();
  for(const kind of cases)for(const p of progress(kind)){
    const f=processFrame(p,kind);pose(f);
    for(const [mover,pairs] of [[plugParts,statics],[toolParts,statics],[toolParts,plugParts]] as const)for(const a of mover){
      box.setFromObject(a).expandByScalar(.5);
      for(const b of pairs){
        if(mover===plugParts&&/Gold header pin|Header solder pad/.test(b.name)||bench(b))continue;
        if(!box.intersectsBox(other.setFromObject(b)))continue;
        const d=penetration(a,b);if(d>LIMIT){const key=`${kind} ${a.name} / ${b.name} at ${p}`;worst.set(key,d);}
      }
    }
  }
  assert.deepEqual([...worst].slice(0,8).map(([k,d])=>`${k}: ${d.toFixed(2)} mm`),[]);
});

test('the harness wires never pass through the cell, the gripper or their own housing',()=>{
  const points=Array.from({length:10},()=>new T.Vector3()),contacts=contactCenters(6),wires=new Map<string,[number,number]>();
  const targets=[...statics,...toolParts,...plugParts];
  for(const kind of cases)for(const p of progress(kind)){
    if(kind!=='search'&&p%1!==0&&p<50)continue;
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
