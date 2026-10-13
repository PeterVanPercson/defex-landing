import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { dressHarness,curveLength,HARNESS_LENGTH,HARNESS_POINTS,WIRE_RADIUS,SLACK_LIMIT } from '../src/harness.ts';
import { processFrame } from '../src/process.ts';
import { contactCenters } from '../src/mechanism.ts';
import { createCell } from '../src/cell-geometry.ts';

createCell(6);
const cases=['pass','search','half-seat','open','short'] as const;
const dress=(p:number,kind:typeof cases[number],i:number,points=Array.from({length:10},()=>new T.Vector3()))=>{
  const f=processFrame(p,kind);const r=dressHarness(points,new T.Vector3(...f.plug),f.rotation,0,contactCenters(6)[i],i);
  return {f,r,points,curve:new T.CatmullRomCurve3(points,false,'centripetal')};
};

test('harness wires stay attached, keep their length and stay on the jig plate',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=.5)for(let i=0;i<6;i++){
    const {f,r,points,curve}=dress(p,kind,i),contact=contactCenters(6)[i];
    assert.equal(points.length,HARNESS_POINTS);
    const start=new T.Vector3(contact[0],contact[1],8.3).applyAxisAngle(new T.Vector3(0,1,0),f.rotation).add(new T.Vector3(...f.plug));
    assert.ok(points[0].distanceTo(start)<1e-9);assert.deepEqual(points.at(-1)!.toArray(),[-111.5+i*3,78,17]);
    const length=curveLength(curve,512);assert.ok(Math.abs(length-HARNESS_LENGTH)<.6,`${kind} ${p}: length ${length}`);
    assert.ok(r.amplitude>=0&&r.amplitude<=SLACK_LIMIT&&r.sag>=.5&&r.sag<=2,`${kind} ${p}: slack ${r.amplitude}, sag ${r.sag}`);
    for(let j=0;j<=400;j++){
      const point=curve.getPoint(j/400);assert.ok(point.z>WIRE_RADIUS-.05,`${kind} ${p}: cable below plate`);
      assert.ok(point.x> -175&&point.x<268&&point.y> -160&&point.y<220,`${kind} ${p}: cable at ${point.toArray()}`);
    }
  }
});

test('the slack lies on the plate as a tight bundle, west of the comb',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=2.5){
    const curves=Array.from({length:6},(_,i)=>dress(p,kind,i).curve);
    // sample the stretch of the route that always rests on the plate: west of the comb, below its leads
    for(const curve of curves){
      const lying=Array.from({length:801},(_,j)=>curve.getPoint(j/800)).filter(q=>q.x< -125&&q.y>14&&q.y<58);
      assert.ok(lying.length>20,`${kind} ${p}: no slack on the plate`);
      for(const q of lying)assert.ok(q.z<WIRE_RADIUS+1.05,`${kind} ${p}: slack lifted to ${q.z}`);
    }
    // every wire of the bundle stays within a bundle width of the first wire's path
    const reference=Array.from({length:1201},(_,j)=>curves[0].getPoint(j/1200));
    for(const curve of curves.slice(1))for(let j=0;j<=200;j++){
      const q=curve.getPoint(j/200);if(!(q.x< -125&&q.y>14&&q.y<58))continue;
      assert.ok(Math.min(...reference.map(r=>r.distanceTo(q)))<4.5,`${kind} ${p}: a wire strays from the bundle`);
    }
  }
});

test('from pick to release the pigtail leaves the wire face and runs away clear of the fingers',()=>{
  const cell=createCell(6);
  for(const kind of cases)for(let p=25;p<=90;p+=1){
    const f=processFrame(p,kind);if(f.jaw>.01)continue;
    cell.tool.root.position.set(...f.tool);cell.root.updateMatrixWorld(true);
    const body=new T.Box3().setFromObject(cell.tool.root.getObjectByName('Black parallel gripper')!);
    for(let i=0;i<6;i++){
      const {curve}=dress(p,kind,i);
      for(let j=0;j<=400;j++){const q=curve.getPoint(j/400);assert.ok(!(q.z>f.tool[2]+20&&Math.abs(q.x-f.tool[0])<26&&Math.abs(q.y-f.tool[1])<16),`${kind} ${p}: wire rises into the gripper at ${q.toArray()}`);assert.ok(!body.containsPoint(q));}
    }
  }
});

test('both connector variants terminate within their tester connector and comb channels',()=>{
  for(const pins of [6,8])for(let i=0;i<pins;i++){
    const points=Array.from({length:10},()=>new T.Vector3());dressHarness(points,new T.Vector3(0,0,29),0,0,contactCenters(pins)[i],i,pins);
    const expected=-104+(i-(pins-1)/2)*3,curve=new T.CatmullRomCurve3(points,false,'centripetal');
    assert.equal(points.at(-1)!.x,expected);assert.ok(Math.abs(expected+104)<(pins*3+6)/2-.7);
    for(let j=0;j<=800;j++){const q=curve.getPoint(j/800);if(q.x< -90&&q.y>30&&q.y<46&&q.z>8)assert.ok(Math.abs(q.x-expected)<.4,`wire ${i} leaves its comb channel at ${q.toArray()}`);}
  }
});
