import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,processRecord,turnoverClock,recoveryStart,seatPoints,aim,offHeader,CYCLE_STEPS,NEST,TURNOVER,REJECT,HEADER,HOME,UPCAM,GRASP,SEAT_TOOL,SEARCH_POINTS,SEARCH_TRIES,CAPTURE,SEATED,HALF_SEATED,CLEAR,FIRST_CONTACT,SLIDE,EXAMPLE_LIMITS } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { cycleSeconds,pace } from '../src/cycle-player.ts';
import { solveArm,UPPER,FORE } from '../src/cobot.ts';
import { createCell } from '../src/cell-geometry.ts';
const cases:CycleCase[]=['pass','search','half-seat','open','short'];
const distance=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));
const flat=(a:readonly number[],b:readonly number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
// The turnover runs on its own 30..39 clock inside its step.
const old=(q:number)=>{let lo=23,hi=34;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(turnoverClock(mid)<q)lo=mid;else hi=mid;}return hi;};
const tray=[REJECT[0]-GRASP[0],REJECT[1]-GRASP[1],REJECT[2]];

test('ten steps: measure the board, pick, turn over, measure the grip, press, then the checks',()=>{
  assert.equal(CYCLE_STEPS.length,10);
  assert.deepEqual(CYCLE_STEPS.map(s=>s[1]),[0,2,12,23,34,43,50,62,72,86]);
  assert.deepEqual(CYCLE_STEPS.map(s=>s[0]),['Load the cell','Check the board','Pick the housing','Turn over and regrip','Check the grip','Align','Press','Pull check','Continuity','Release']);
  assert.equal(processFrame(66).step,7);assert.equal(processFrame(80).step,8);assert.equal(processFrame(99).step,9);
  for(const [title,,message] of CYCLE_STEPS){assert.ok(title.split(' ').length<=4);assert.ok(message.split(/[.:] /).length<=2,message);}
});
test('no step or message mentions a saved correction, learning or a reused fit',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=.1){
    const f=processFrame(p,kind),text=`${f.title} ${f.message} ${f.detail}`.toLowerCase();
    for(const word of ['correction','learn','teach','self-','reuse','assembly','fixture correction'])assert.ok(!text.includes(word),`${kind} ${p}: ${text}`);
  }
});
test('the face-up load turns over only while supported by the cradle and clear of the open gripper',()=>{
  assert.equal(processFrame(0).rotation,Math.PI);assert.deepEqual(processFrame(0).plug,[...NEST]);
  for(let p=old(34);p<=old(36);p+=.025){const f=processFrame(p);assert.deepEqual(f.plug,[...TURNOVER]);assert.equal(f.jaw,1);assert.equal(f.cradleGrip,0);assert.ok(f.tool[2]-f.plug[2]>=61);}
  assert.equal(processFrame(40).rotation,0);assert.equal(processFrame(old(38)).jaw,0);
  // the cradle clamps only after the housing has arrived, and lets go only after the fingers close
  assert.ok(processFrame(old(31.99)).cradleGrip>0);assert.equal(processFrame(old(31.99)).jaw,0);
  assert.equal(processFrame(old(32.3)).cradleGrip,0);assert.equal(processFrame(old(32.3)).jaw,0);
  assert.ok(processFrame(old(38.2)).cradleGrip>0);
});
test('the pick, the cradle and the header are approached and left straight up and down',()=>{
  for(const [from,to] of [[15.5,18],[old(31.4),old(32)],[47,50]] as const){
    const a=processFrame(from),b=processFrame(to);
    for(let p=from;p<=to;p+=.01){const f=processFrame(p);assert.ok(flat(f.tool,b.tool)<1e-9,`not vertical at ${p}`);}
    assert.ok(a.tool[2]-b.tool[2]>=15);
  }
  for(let p=88;p<=92;p+=.01)assert.ok(flat(processFrame(p).tool,SEAT_TOOL)<1e-9);
});
test('all process paths are finite, continuous and within rigid-arm reach',()=>{
  for(const kind of cases){
    let previous=processFrame(0,kind),pose=solveArm(new T.Vector3(...previous.tool).add(new T.Vector3(0,0,80)).divideScalar(5));
    for(let i=1;i<=10000;i++){
      const f=processFrame(i/100,kind);
      assert.ok([...f.tool,...f.plug,f.rotation,f.jaw,f.latch,f.force,f.headerCheck,f.graspCheck].every(Number.isFinite));
      assert.ok(distance(f.tool,previous.tool)<3,`${kind} tool jump at ${i/100}`);
      assert.ok(distance(f.plug,previous.plug)<3,`${kind} plug jump at ${i/100}`);
      const yaw=pose.yaw;solveArm(new T.Vector3(...f.tool).add(new T.Vector3(0,0,80)).divideScalar(5),pose);
      assert.ok(Math.abs(pose.yaw-yaw)<.01,`${kind} base turns ${pose.yaw-yaw} at ${i/100}`);
      assert.ok(pose.reach<.9,`${kind} unreachable at ${i/100}`);
      assert.ok(Math.abs(pose.shoulder.distanceTo(pose.elbow)-UPPER)<1e-6);
      assert.ok(Math.abs(pose.elbow.distanceTo(pose.wrist)-FORE)<1e-6);
      previous=f;
    }
  }
});
test('progress is monotonic and the poses never jump between neighbouring samples',()=>{
  for(const kind of cases){
    const start=recoveryStart(kind)??101;let previous=processFrame(0,kind);
    for(let i=1;i<=2000;i++){
      const p=i*.05,f=processFrame(p,kind);
      assert.ok(f.progress>previous.progress);
      if(p<start)assert.ok(f.step>=previous.step,`${kind} step goes back at ${p}`);
      // a few mm at most per 0.05 % through the cycle, and the retry's longer percent never moves the tool faster
      // than about 350 mm/s at playback pace
      const jump=distance(f.tool,previous.tool),limit=p<start?5:8;
      assert.ok(jump<limit,`${kind} tool jumps ${jump.toFixed(2)} mm at ${p}`);
      assert.ok(distance(f.plug,previous.plug)<limit,`${kind} plug jumps at ${p}`);
      assert.ok(jump/(.05*pace(p-.025,kind))<.35,`${kind} tool at ${(jump/(.05*pace(p-.025,kind))*1000).toFixed(0)} mm/s at ${p}`);
      assert.ok(Math.abs(f.jaw-previous.jaw)<.25&&Math.abs(f.force-previous.force)<1.5,`${kind} jaw or force jumps at ${p}`);
      previous=f;
    }
  }
});
test('the plug moves only in a closed hand, sits off centre in the fingers from the regrip on, and the hand starts and ends at home',()=>{
  for(const kind of cases){
    let previous=processFrame(0,kind);
    for(let i=1;i<=10000;i++){
      const p=i/100,f=processFrame(p,kind);
      if(distance(f.plug,previous.plug)>1e-9)assert.ok(f.jaw<1e-6&&previous.jaw<1e-6,`${kind} plug moves with open fingers at ${p}`);
      if(f.jaw<1e-6&&f.rotation===Math.PI)assert.ok(distance(f.plug,[f.tool[0],f.tool[1],f.tool[2]+4.3])<1e-6,`${kind} closed hand without the plug at ${p}`);
      if(f.jaw<1e-6&&f.rotation===0){assert.ok(Math.abs(f.plug[2]-f.tool[2])<1e-9&&flat(f.plug,f.tool)<=Math.hypot(...GRASP)+1e-9,`${kind} closed hand without the plug at ${p}`);}
      if(p>=34&&p<50)assert.ok(distance([f.plug[0]-f.tool[0],f.plug[1]-f.tool[1]],GRASP)<1e-9,`${kind} grip offset at ${p}`);
      previous=f;
    }
    assert.deepEqual(processFrame(0,kind).tool,[...HOME]);assert.ok(distance(processFrame(100,kind).tool,HOME)<1e-9);
  }
});
test('the wrist camera measures the board while the arm holds still over the header',()=>{
  for(const kind of cases){
    const pulse=Array.from({length:1001},(_,i)=>processFrame(i/100*1.2,kind)).filter(f=>f.headerCheck>0);
    assert.ok(pulse.length>0);assert.ok(Math.max(...pulse.map(f=>f.headerCheck))>.999);
    for(const f of pulse){assert.equal(f.step,1);assert.equal(f.camera,true);assert.ok(distance(f.tool,pulse[0].tool)<1e-9);assert.equal(f.graspCheck,0);}
    assert.equal(processFrame(11.9,kind).detail,kind==='search'?'0.97 mm · glare':'0.18 mm');assert.equal(processFrame(12,kind).headerCheck,0);
  }
  for(let p=0;p<100;p+=.1){const f=processFrame(p);assert.equal(f.camera,f.step===1);if(f.step!==1)assert.equal(f.headerCheck,0);}
});
test('the upward camera measures the grip with the plug hovering at least 20 mm over it',()=>{
  for(const kind of cases){
    const pulse=Array.from({length:901},(_,i)=>processFrame(34+i/100,kind)).filter(f=>f.graspCheck>0);
    assert.ok(Math.max(...pulse.map(f=>f.graspCheck))>.999);
    for(const f of pulse){
      assert.equal(f.step,4);assert.equal(f.jaw,0);assert.ok(distance(f.tool,pulse[0].tool)<1e-9);
      assert.ok(flat(f.tool,UPCAM)<1e-9);assert.ok(f.plug[2]-4.05-UPCAM[2]>=20,`face ${f.plug[2]-4.05}`);
    }
    assert.equal(processFrame(42.9,kind).detail,'0.33 mm');
  }
  for(let p=0;p<100;p+=.1){const f=processFrame(p);if(f.step!==4)assert.equal(f.graspCheck,0);}
});
test('the camera pulses are readable and a pass takes about 21 s, with the arm moving within half a second',()=>{
  assert.ok(cycleSeconds('pass')>=20&&cycleSeconds('pass')<=22,`${cycleSeconds('pass')} s`);
  for(const kind of cases)assert.ok(cycleSeconds(kind)<=31,`${kind} ${cycleSeconds(kind)} s`);
  const moving=Array.from({length:1000},(_,i)=>i/100).find(p=>distance(processFrame(p).tool,HOME)>.5)!;
  assert.ok(cycleSeconds('pass',0,moving)<.5);
  for(const check of ['headerCheck','graspCheck'] as const){
    const lit=Array.from({length:10001},(_,i)=>i/100).filter(p=>processFrame(p)[check]>0);
    const s=cycleSeconds('pass',lit[0],lit.at(-1)!);assert.ok(s>=.6&&s<=.9,`${check} ${s} s`);
  }
});
test('the pass case seats on the first press, in one smooth stroke with the latch signature',()=>{
  const press=Array.from({length:1201},(_,i)=>processFrame(50+i/100,'pass'));
  for(let i=1;i<press.length;i++){assert.ok(press[i].tool[2]<=press[i-1].tool[2]+1e-9,'the press never backs off');assert.equal(press[i].tries,1);assert.notEqual(press[i].title,'Search');}
  assert.ok(Math.abs(processFrame(57,'pass').tool[2]-SEATED)<1e-9);assert.equal(processFrame(57,'pass').seated,'pass');assert.equal(processFrame(56.9,'pass').seated,'pending');
  assert.deepEqual(seatPoints('pass'),[57]);
  const force=press.map(f=>f.force),top=Math.max(...force),peak=force.indexOf(top);
  assert.ok(Math.abs(top-3.4)<.01);assert.ok(force.slice(peak).some(v=>v<top-2),'the latch drop');
  // a small contact rise as the chamfer guides the plug, before the latch peak
  const sliding=press.filter(f=>f.tool[2]<FIRST_CONTACT&&f.tool[2]>FIRST_CONTACT-SLIDE);assert.ok(sliding.some(f=>f.force>.3&&f.force<1));
  assert.equal(processFrame(58,'pass').detail,'latch 3.4 N');
  for(let p=0;p<=100;p+=.1)assert.ok(processFrame(p,'pass').force<3.41);
});
test('the chamfer slides the plug onto the header over the first 1.5 mm of travel, ending exactly on it',()=>{
  for(const kind of ['pass','half-seat','open','short'] as const){
    const arrive=processFrame(50,kind);assert.ok(flat(arrive.tool,aim(kind))<1e-9);
    const off=offHeader(arrive.tool);assert.ok(off>.2&&off<.3,`residual ${off}`);assert.ok(off<=CAPTURE);
    let previous=arrive,slid=false;
    for(let p=50.005;p<62;p+=.005){
      const f=processFrame(p,kind);
      if(flat(f.tool,previous.tool)>1e-9){assert.ok(f.tool[2]<=FIRST_CONTACT+1e-9&&previous.tool[2]>=FIRST_CONTACT-SLIDE-1e-9,`${kind} lateral move at ${f.tool[2]}`);slid=true;}
      if(f.tool[2]<=FIRST_CONTACT-SLIDE)assert.ok(flat(f.plug,HEADER)<1e-9,`${kind} not on the header at ${p}`);
      previous=f;
    }
    assert.ok(slid);
    assert.ok(flat(processFrame(61.9,kind).plug,HEADER)<1e-9);assert.ok(flat(processFrame(61.9,kind).tool,SEAT_TOOL)<1e-9);
  }
});
test('the fallback search: blocked short on the shroud top, a few points tried clear of the header, then seated',()=>{
  assert.ok(SEARCH_TRIES>=2&&SEARCH_TRIES<=4);
  assert.ok(flat(SEARCH_POINTS[0],aim('search'))<1e-9);assert.ok(offHeader(aim('search'))>1);
  for(let k=0;k<SEARCH_TRIES-1;k++)assert.ok(offHeader(SEARCH_POINTS[k])>CAPTURE);
  assert.ok(offHeader(SEARCH_POINTS[SEARCH_TRIES-1])<=CAPTURE);
  const blocked=processFrame(52.2,'search');assert.equal(blocked.seated,'pending');assert.ok(blocked.depth>0&&blocked.depth<.3);
  assert.ok(blocked.force>3&&blocked.force<EXAMPLE_LIMITS.press);assert.ok(flat(blocked.tool,aim('search'))<1e-9);
  let previous=processFrame(50,'search'),tries=new Set<number>();
  for(let p=50.005;p<62;p+=.005){
    const f=processFrame(p,'search');tries.add(f.tries);
    const lateral=flat(f.tool,previous.tool)>1e-9;
    if(lateral&&f.tool[2]<CLEAR-.01)assert.ok(f.tool[2]<=FIRST_CONTACT+1e-9&&previous.tool[2]>=FIRST_CONTACT-SLIDE-1e-9&&f.tries===SEARCH_TRIES,`lateral move low at ${p}`);
    if(f.seated==='pending'&&f.tries<SEARCH_TRIES)assert.ok(f.depth<.3,`no slide-in until the last point at ${p}`);
    previous=f;
  }
  assert.deepEqual([...tries].sort(),Array.from({length:SEARCH_TRIES},(_,i)=>i+1));
  const seated=processFrame(61.9,'search');assert.equal(seated.seated,'pass');assert.ok(flat(seated.plug,HEADER)<1e-9);assert.equal(seated.detail,'latch 3.4 N');
  assert.match(seated.message,/rare/);assert.match(seated.message,/flagged in the log/);
  const end=processFrame(100,'search');assert.equal(end.accepted,true);assert.ok(end.contacts.every(c=>c==='pass'));
  const force=Array.from({length:401},(_,i)=>processFrame(58+i/100,'search').force),top=Math.max(...force);
  assert.ok(Math.abs(top-3.4)<.01);assert.ok(force.slice(force.indexOf(top)).some(v=>v<top-2));
});
test('a passing cycle leaves the connector seated on the header while the open tool retracts and returns home',()=>{
  for(const kind of ['pass','search'] as const){
    const f=processFrame(100,kind);assert.equal(f.accepted,true);assert.equal(f.seated,'pass');assert.equal(f.pull,'pass');assert.ok(f.contacts.every(x=>x==='pass'));
    assert.deepEqual(f.plug,[...HEADER,SEATED]);assert.equal(f.jaw,1);assert.ok(f.tool[2]-f.plug[2]>60);
  }
});
test('a half-seat, open contact or short retries once, then ends rejected in the tray',()=>{
  for(const kind of ['half-seat','open','short'] as const){
    for(let i=0;i<=1000;i++)assert.notEqual(processFrame(i/10,kind).accepted,true);
    const f=processFrame(100,kind);assert.equal(f.accepted,false);assert.equal(f.retry,1);assert.equal(f.rejected,true);assert.equal(f.depth,0);assert.deepEqual(f.plug,[...REJECT]);
    assert.equal(kind==='half-seat'?f.pull:f.contacts[kind==='open'?2:1],'fail');assert.equal(processFrame(99,kind).title,'Rejected');
  }
});
test('a half-seat stops short with no latch drop, then moves under the pull',()=>{
  const press=Array.from({length:701},(_,i)=>processFrame(50+i/100,'half-seat'));
  const peak=Math.max(...press.map(f=>f.force)),after=press.findIndex(f=>f.force===peak);
  assert.ok(press.slice(0,after).every((f,i)=>i===0||f.force>=press[i-1].force-1e-9),'force rises without a drop');
  assert.ok(Math.abs(processFrame(61.9,'half-seat').tool[2]-HALF_SEATED)<1e-9);assert.equal(processFrame(61.9,'half-seat').seated,'pending');
  const pulled=processFrame(69,'half-seat');assert.equal(pulled.pull,'fail');assert.equal(pulled.seated,'fail');assert.ok(pulled.plug[2]-HALF_SEATED>1.7);
});
test('each retry clears previous outcomes and runs seating, pull, then electrical checks',()=>{
  for(const kind of ['half-seat','open','short'] as const){
    const start=recoveryStart(kind)!,half=kind==='half-seat';
    const frame=(u:number)=>processFrame(start+(100-start)*u,kind);
    const before=processFrame(start-.01,kind);assert.ok(before.pull==='fail'||before.contacts.includes('fail'));
    for(const u of [0,.1,.18,.3]){
      const f=frame(u);assert.equal(f.seated,'pending');assert.equal(f.pull,'pending');assert.ok(f.contacts.every(c=>c==='pending'));assert.equal(f.accepted,null);
    }
    const seated=frame(.33);assert.equal(seated.seated,half?'pending':'pass');assert.equal(seated.pull,'pending');assert.ok(seated.contacts.every(c=>c==='pending'));
    const pulled=frame(.441);assert.equal(pulled.pull,half?'fail':'pass');assert.ok(pulled.contacts.every(c=>c==='pending'));
    if(half)assert.ok(frame(.55).contacts.every(c=>c==='pending'));
    else {assert.equal(frame(.475).contacts[0],'pass');assert.ok(frame(.55).contacts.includes('fail'));}
    assert.equal(frame(.6).title,'Reject');
  }
});
test('an electrical fault stops further testing and identifies the affected contacts',()=>{
  const open=processFrame(77.5,'open');assert.deepEqual(open.contacts,['pass','pass','fail','pending','pending','pending']);assert.equal(open.contactFaults[2],'open');
  const short=processFrame(75.5,'short');assert.deepEqual(short.contacts,['pass','fail','pending','pending','fail','pending']);assert.equal(short.contactFaults[1],'short to 5');assert.equal(short.contactFaults[4],'short to 2');
});
test('example force limits bound every attempt and extraction, with no pull before a completed press',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=.05){
    const f=processFrame(p,kind);
    assert.ok(f.force>=0&&f.force<=EXAMPLE_LIMITS.press);assert.ok(f.pullForce>=0&&f.pullForce<=EXAMPLE_LIMITS.pull);assert.ok(f.extractionForce>=0&&f.extractionForce<=EXAMPLE_LIMITS.extraction);
    if(f.pullForce>0)assert.ok(f.seated==='pass'||kind==='half-seat',`${kind} pull before seating at ${p}`);
  }
});
test('a latched plug is only lifted out with its latch held released, above the pull-test force',()=>{
  for(const kind of ['open','short'] as const){
    let peak=0,previous=processFrame(0,kind);
    for(let i=1;i<=10000;i++){
      const p=i/100,f=processFrame(p,kind);
      if(f.plug[2]>previous.plug[2]+1e-9&&f.plug[2]<22&&flat(f.plug,HEADER)<1e-6)assert.equal(f.latch,1,`${kind} pulled out latched at ${p}`);
      peak=Math.max(peak,f.extractionForce);previous=f;
    }
    assert.ok(peak>EXAMPLE_LIMITS.pull,`${kind} extraction ${peak} N`);
  }
  for(let p=0;p<=100;p+=.1)assert.equal(processFrame(p,'half-seat').latch,0);
});
test('a release opens the fingers before moving away, on both pass and reject',()=>{
  for(const kind of ['pass','search'] as const){const start=processFrame(86,kind),open=processFrame(88,kind),lifted=processFrame(99,kind);assert.equal(start.jaw,0);assert.ok(open.jaw>.999);assert.ok(distance(open.tool,start.tool)<1e-6);assert.ok(lifted.tool[2]>open.tool[2]);assert.deepEqual(lifted.plug,start.plug);}
  for(const kind of ['half-seat','open','short'] as const){const start=recoveryStart(kind)!;const open=processFrame(start+(100-start)*.83,kind);assert.equal(open.jaw,1);assert.ok(distance(open.tool,tray)<1e-9);assert.deepEqual(open.plug,[...REJECT]);}
});
test('unit records keep both failed attempts, what the cameras measured, the search flag and complete force traces',()=>{
  for(const kind of cases){
    const record=processRecord(3,kind,'2026-10-12T00:00:00.000Z');assert.equal(record.source,'scripted illustration');assert.equal(record.id,3);assert.equal(record.trace.length,1001);
    const failed=['half-seat','open','short'].includes(kind);assert.equal(record.attempts.length,failed?2:1);assert.equal(record.accepted,!failed);
    assert.equal(record.flag!==null,kind==='search');assert.equal(Math.hypot(...record.measured.grip).toFixed(2),'0.33');
    for(const attempt of record.attempts){assert.equal(attempt.seated,kind==='half-seat'?'fail':'pass');assert.equal(attempt.result,failed?'failed':'accepted');if(kind==='half-seat'){assert.equal(attempt.pull,'fail');assert.ok(attempt.contacts.every(c=>c==='pending'));}else {assert.equal(attempt.pull,'pass');assert.equal(attempt.contacts.includes('fail'),failed);}}
  }
});
test('the fingers grip 5 mm of the housing and still clear the header when seated',()=>{
  const cell=createCell();cell.tool.root.position.set(...SEAT_TOOL,SEATED);cell.plug.position.set(...HEADER,SEATED);cell.root.updateMatrixWorld(true);
  const headerTop=new T.Box3().setFromObject(cell.housing).max.z,plugTop=new T.Box3().setFromObject(cell.plug.children[0]).max.z;
  for(const finger of cell.tool.fingers){
    const bottom=new T.Box3().setFromObject(finger).min.z;assert.ok(bottom>headerTop,`finger ${bottom} versus header ${headerTop}`);
    const face=new T.Box3().setFromObject(finger.getObjectByName('Housing contact face')!);assert.ok(Math.min(face.max.z,plugTop)-face.min.z>5);
  }
  assert.equal(cell.wires.length,6);assert.equal(cell.tool.fingers.length,2);
});
test('the blocked connector visibly reaches the top of the header rather than hovering above it',()=>{
  const cell=createCell(),f=processFrame(52.2,'search');cell.plug.position.set(...f.plug);cell.header.position.set(...HEADER,0);cell.root.updateMatrixWorld(true);
  const header=new T.Box3().setFromObject(cell.housing),plug=new T.Box3().setFromObject(cell.plug);
  assert.ok(Math.abs(header.max.z-18)<1e-5);assert.ok(plug.min.z<=header.max.z);assert.ok(plug.min.z>header.max.z-.3);assert.ok(plug.intersectsBox(header));assert.equal(f.seated,'pending');
});
test('the upward camera fits in 22 x 22 mm on the plate, clear of the other stations',()=>{
  const cell=createCell();cell.root.updateMatrixWorld(true);
  const foot=new T.Box3(new T.Vector3(UPCAM[0]-11,UPCAM[1]-11,0),new T.Vector3(UPCAM[0]+11,UPCAM[1]+11,UPCAM[2]));
  const comb=new T.Box3();cell.root.traverse(o=>{if(o.name==='Cable comb base')comb.expandByObject(o);});
  for(const [name,box] of [['nest',new T.Box3().setFromObject(cell.nest)],['cradle',new T.Box3().setFromObject(cell.turnover)],['reject tray',new T.Box3().setFromObject(cell.bin)],['fixture',new T.Box3().setFromObject(cell.fixture)],['tester',new T.Box3().setFromObject(cell.tester)],['comb',comb]] as const)
    assert.ok(!foot.intersectsBox(box),`the camera overlaps the ${name}`);
  const plate=new T.Box3();cell.root.traverse(o=>{if(o.name==='Aluminium jig plate')plate.expandByObject(o);});
  assert.ok(plate.containsPoint(new T.Vector3(UPCAM[0],UPCAM[1],plate.max.z)));
});
