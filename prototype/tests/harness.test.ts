import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { dressHarness,curveLength,HARNESS_LENGTH } from '../src/harness.ts';
import { processFrame } from '../src/process.ts';
import { contactCenters } from '../src/mechanism.ts';

test('harness wires stay attached, take up slack without stretching, and clear the tooling plate',()=>{
  const points=Array.from({length:10},()=>new T.Vector3());
  let min=Infinity,max=0;
  for(const kind of ['search','half-seat','open','short'] as const)for(let p=0;p<=100;p+=.5){
    const f=processFrame(p,kind),plug=new T.Vector3(...f.plug);
    for(let i=0;i<6;i++){
      const contact=contactCenters(6)[i];dressHarness(points,plug,f.rotation,0,contact,i);
      const start=new T.Vector3(contact[0],contact[1],8.3).applyAxisAngle(new T.Vector3(0,1,0),f.rotation).add(plug);
      assert.ok(points[0].distanceTo(start)<1e-9);assert.deepEqual(points.at(-1)!.toArray(),[-111.5+i*3,78,17]);
      const curve=new T.CatmullRomCurve3(points,false,'centripetal'),length=curveLength(curve,512);
      min=Math.min(min,length);max=Math.max(max,length);
      assert.ok(Math.abs(length-HARNESS_LENGTH)<.6,`${kind} ${p}: length ${length}`);
      for(let j=0;j<=128;j++){
        const point=curve.getPoint(j/128);assert.ok(point.z>.48,`${kind} ${p}: cable below plate`);
        assert.ok(point.x> -289&&point.x<319&&point.y> -206&&point.y<262);
      }
    }
  }
  assert.ok(max-min<.6);
});

test('both connector variants terminate within their tester connector and comb channels',()=>{
  for(const pins of [6,8])for(let i=0;i<pins;i++){
    const points=Array.from({length:10},()=>new T.Vector3());dressHarness(points,new T.Vector3(0,0,29),0,0,contactCenters(pins)[i],i,pins);
    const expected=-104+(i-(pins-1)/2)*3;
    assert.equal(points[7].x,expected);assert.equal(points[9].x,expected);assert.ok(Math.abs(expected+104)<(pins*3+6)/2-.7);
  }
});
