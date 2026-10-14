import test from 'node:test';
import assert from 'node:assert/strict';
import { processFrame,NEST,HEADER,HOME,PLUG_SEATED } from '../src/process.ts';
import type { CycleCase,ProcessFrame } from '../src/process.ts';
import { advanceRun,cycleSeconds,finished,isReject,nextLine,pace,PACE,restartRun,runEnd,runFrame,sameSoFar,startRun,tally,verdict } from '../src/cycle-player.ts';
import type { LineRun } from '../src/cycle-player.ts';
import { CLEAR_SPAN,CYCLE_END,FIRST_UNIT,INDEX_START,LIFT_DOWN,LINE_X,LOAD,OP_PACE,PALLET_PITCH,PICK,SWAP,TOTE_SLOTS,UNLOAD,opSeconds } from '../src/line.ts';
import type { LineState } from '../src/line.ts';

const close=(a:number,b:number,what:string)=>assert.ok(Math.abs(a-b)<1e-9,`${what}: ${a} vs ${b}`);
const near=(a:readonly number[],b:readonly number[],what:string)=>a.forEach((v,i)=>close(v,b[i],`${what}[${i}]`));
// The four pallets by role, as the scene places them (x relative to the work station).
function pallets(f:ProcessFrame){
  return {
    live:{x:-f.shift,z:0},
    queue:{x:PALLET_PITCH-f.shift,z:0},
    load:{x:2*PALLET_PITCH-f.shift,z:f.loadZ},
    unload:{x:-PALLET_PITCH,z:f.unloadZ,unit:f.unloadUnit},
  };
}
const units:[CycleCase,LineState][]=[['pass',FIRST_UNIT],['pass',{unit:8,passed:7,rejected:0,prev:'pass'}],['open',{unit:5,passed:3,rejected:1,prev:'pass'}],['half-seat',{unit:2,passed:0,rejected:1,prev:'reject'}],['search',{unit:9,passed:8,rejected:0,prev:'pass'}]];

test('the line is laid out on one pitch, and the index runs from 100 to 108 in 3.2 s',()=>{
  assert.equal(LINE_X.work-LINE_X.unload,PALLET_PITCH);assert.equal(LINE_X.queue-LINE_X.work,PALLET_PITCH);assert.equal(LINE_X.load-LINE_X.queue,PALLET_PITCH);
  close(cycleSeconds('pass',INDEX_START,CYCLE_END),3.2,'index seconds');
  const f0=processFrame(100),f1=processFrame(108),mid=processFrame(104);
  close(f0.shift,0,'shift at 100');close(f1.shift,PALLET_PITCH,'shift at 108');assert.ok(mid.shift>0&&mid.shift<PALLET_PITCH);
  // the tester lets go before the pallets move and docks again once they stop
  for(let p=100;p<=108;p+=.01){const f=processFrame(p);if(f.shift>1e-9&&f.shift<PALLET_PITCH-1e-9)close(f.dock,0,`dock while moving at ${p}`);}
  close(processFrame(50).dock,1,'docked while working');close(f1.dock,1,'docked at 108');
});

test('the loop is seamless: 108 of one unit is 0 of the next, after a pass and after a cleared reject',()=>{
  for(const [kind,line] of units){
    const end=processFrame(CYCLE_END,kind,line),next=nextLine(line,kind),start=processFrame(0,'pass',next);
    const a=pallets(end),b=pallets(start);
    // the live pallet has become the unload pallet: same place, the right contents, fully shown
    close(a.live.x,b.unload.x,`${kind} unload x`);close(b.unload.z,0,'unload up');
    assert.equal(b.unload.unit,isReject(kind)?'board':'finished');assert.equal(end.liveHarness,!isReject(kind));
    if(!isReject(kind))near(end.plug,[HEADER[0]-PALLET_PITCH,HEADER[1],PLUG_SEATED],`${kind} finished plug`);
    // the old unload pallet is down its lift, out of sight, and comes back as the empty load pallet
    close(end.unloadZ,LIFT_DOWN,'old unload down');close(start.loadZ,LIFT_DOWN,'load down');
    // queue has become work and load has become queue, each carrying a fresh unit
    close(a.queue.x,0,'queue at work');near(start.plug,NEST,'fresh plug in the nest');close(start.rotation,Math.PI,'face up');
    close(a.load.x,b.queue.x,'load at queue');close(a.load.z,0,'load up');
    // the robot and the cell are where the next unit starts
    near(end.tool,HOME,'tool home');near(start.tool,HOME,'tool home');
    for(const key of ['jaw','cradle','cradleGrip','latch','dock','force','pullForce','extractionForce','depth','headerCheck','graspCheck'] as const)close(end[key],start[key],`${kind} ${key}`);
    for(const key of ['accepted','rejected','seated','pull','camera','retry'] as const)assert.equal(end[key],start[key],`${kind} ${key}`);
    // the tote on the bed: at the start of a swap unit the full one is still there, as at the end of the last unit
    close(end.tote,start.swap?TOTE_SLOTS:start.tote,`${kind} units in the tote on the bed`);
    assert.deepEqual(end.contacts,start.contacts);
    near(end.focus,start.focus,`${kind} focus`);near(start.focus,NEST,'focus on the next unit');
  }
});

test('the operator side runs on its own clock while the robot works: pick, unload lift, load lift',()=>{
  const line={unit:4,passed:3,rejected:0,prev:'pass'} as const;
  // seconds from the start of the unit, as played: the op-side moves keep their speed across the robot's steps
  const op=(t:number)=>{let lo=0,hi=INDEX_START;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(opSeconds(mid)<t)lo=mid;else hi=mid;}return hi;};
  for(const p of [0,1,2,7,12,23,30,40,50])assert.ok(Math.abs(opSeconds(p)-cycleSeconds('pass',0,p))<.01,`op seconds at ${p}`);
  const at=(t:number)=>processFrame(op(t),'pass',line);
  // the empty pallet goes down only once the picker has lifted the unit off it, and the loaded one comes up
  close(at(PICK.lifted).unloadZ,0,'still up while the unit is lifted');close(at(UNLOAD.low).unloadZ,LIFT_DOWN,'down');
  close(at(LOAD.up).loadZ,LIFT_DOWN,'load down');close(at(LOAD.top).loadZ,0,'load up');
  assert.ok(PICK.lifted<UNLOAD.down&&UNLOAD.low<UNLOAD.away&&LOAD.under<LOAD.up);
  assert.equal(processFrame(1).unloadUnit,'none');assert.equal(at(1).pack,true);assert.equal(processFrame(1,'pass',{unit:4,passed:2,rejected:1,prev:'reject'}).pack,false);
  assert.deepEqual(OP_PACE.map(([p,ms])=>[p,ms]),OP_PACE.map(([p])=>[p,pace(p+.001,'pass')]),'the op clock keeps the player\'s pace');
  assert.equal(PACE[0],OP_PACE[0][1]);
});

test('the tote fills one passed unit per pack, and a full one is swapped before the next pack',()=>{
  const op=(t:number)=>{let lo=0,hi=INDEX_START;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(opSeconds(mid)<t)lo=mid;else hi=mid;}return hi;};
  const packed=(passed:number,prev:'pass'|'reject'|'none',t:number)=>processFrame(op(t),'pass',{unit:passed+2,passed,rejected:0,prev});
  assert.equal(packed(3,'pass',PICK.open-.01).tote,2,'two in, the third still in the picker');assert.equal(packed(3,'pass',PICK.open).tote,3,'released into its slot');
  assert.equal(packed(3,'reject',10).tote,3,'a bare board never goes in the tote');assert.equal(packed(3,'reject',10).pack,false);
  assert.equal(packed(TOTE_SLOTS,'none',5).tote,TOTE_SLOTS,'full');assert.equal(packed(TOTE_SLOTS,'none',5).swap,false,'nothing to pack, nothing to swap');
  const swap=(t:number)=>packed(TOTE_SLOTS+1,'pass',t);
  assert.equal(swap(0).swap,true);assert.equal(swap(0).tote,0,'the empty one is the tote being filled');assert.equal(swap(PICK.open).tote,1);
  assert.equal(swap(SWAP.out-.01).lineNote,'');assert.equal(swap((SWAP.out+SWAP.done)/2).lineNote,'Full tote out, empty tote in');assert.equal(swap(SWAP.done).lineNote,'');
  assert.ok(SWAP.done<PICK.over,'the empty tote is in place before the picker comes over it');
  assert.equal(packed(TOTE_SLOTS+2,'pass',2).swap,false);assert.equal(packed(TOTE_SLOTS+2,'pass',2).tote,1);
});

test('the shot: the hero only at the very start, the work through a pass and its index, the line only for a tote swap, the tray for a reject',()=>{
  const op=(t:number)=>{let lo=0,hi=INDEX_START;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(opSeconds(mid)<t)lo=mid;else hi=mid;}return hi;};
  assert.equal(processFrame(1).shot,'wide');assert.equal(processFrame(1,'pass',{unit:2,passed:1,rejected:0,prev:'pass'}).shot,'work');
  for(const p of [3,50,90,98,100,104,107.9])assert.equal(processFrame(p,'pass',{unit:3,passed:2,rejected:0,prev:'pass'}).shot,'work',`pass ${p}`);
  const swap={unit:TOTE_SLOTS+2,passed:TOTE_SLOTS+1,rejected:0,prev:'pass'} as const;
  assert.equal(processFrame(op(SWAP.out),'pass',swap).shot,'line');assert.equal(processFrame(op(PICK.open-.05),'pass',swap).shot,'line','until the first unit is in the empty tote');
  assert.equal(processFrame(op(PICK.open+.05),'pass',swap).shot,'work');assert.equal(processFrame(50,'pass',swap).shot,'work');
  assert.equal(processFrame(100,'open').shot,'reject');assert.equal(processFrame(90,'open').shot,'work');assert.equal(processFrame(100.5,'open').shot,'reject','cleared on the tray');assert.equal(processFrame(104,'open').shot,'work');
  // the close-up looks at the wrist camera and the header together while the board is measured
  const board=processFrame(8);assert.ok(board.focus[2]>40&&Math.hypot(board.focus[0]-HEADER[0],board.focus[1]-HEADER[1])<12);
  near(processFrame(60).focus,processFrame(60).plug,'focus on the plug');
});

function play(run:LineRun,ms:number,log:number[]=[],holds:number[]=[]){
  return advanceRun(run,ms,{log:r=>log.push(r.line.unit),hold:r=>holds.push(r.line.unit)});
}
test('played, the line makes units forever: counters only go up, each unit is logged once, and a fault is one-shot',()=>{
  let run=startRun();const log:number[]=[],holds:number[]=[];
  let previous=run.line;
  // 20 units at about 25 s each, in 80 ms frames
  for(let i=0;i<6500;i++){
    run=play(run,80,log,holds);
    assert.ok(run.line.unit>=previous.unit&&run.line.passed>=previous.passed&&run.line.rejected>=previous.rejected);
    assert.equal(run.line.passed+run.line.rejected,run.line.unit-1);previous=run.line;
  }
  assert.ok(run.line.unit>=20,`made ${run.line.unit-1} units`);assert.equal(run.line.rejected,0);
  assert.deepEqual(log,Array.from({length:log.length},(_,i)=>i+1),'each unit logged once, in order');assert.equal(holds.length,0);
  // a fault: the line holds at 100 until a person clears the reject
  run={...run,kind:'open',progress:0,logged:false};const unit=run.line.unit;
  for(let i=0;i<800;i++)run=play(run,50,log,holds);
  assert.equal(run.held,true);assert.equal(run.progress,INDEX_START);assert.equal(runEnd(run),INDEX_START);assert.deepEqual(holds,[unit]);assert.equal(log.at(-1),unit);
  const heldAt={...run};run=play(run,5000,log,holds);assert.deepEqual(run,heldAt,'nothing moves while held');
  run={...run,held:false,cleared:true};assert.equal(runEnd(run),CYCLE_END);
  // the operator takes the harness (about 1 s), then the bare board indexes out
  run=play(run,500,log,holds);const clearing=processFrame(run.progress,run.kind,run.line);
  assert.ok(clearing.liveHarness&&clearing.harnessOut!>0&&clearing.harnessOut!<1&&clearing.shift===0&&clearing.shot==='reject','clearing into the bin');
  run=play(run,800,log,holds);assert.equal(run.kind,'open');assert.ok(run.progress>INDEX_START);assert.ok(!processFrame(run.progress,run.kind,run.line).liveHarness,'the harness went to the bin');
  run=play(run,3000,log,holds);
  assert.equal(run.line.unit,unit+1);assert.equal(run.line.rejected,1);assert.equal(run.line.prev,'reject');assert.equal(run.kind,'pass','faults are one-shot');assert.equal(run.cleared,false);
  assert.equal(log.filter(u=>u===unit).length,1);
  // the remainder of a frame carries over the index into the next unit
  const carry=advanceRun({...startRun(),progress:107.9},400);assert.equal(carry.line.unit,2);close(carry.progress,2.5,'40 ms to 108, then 240 ms over 0..2 and 120 ms into step 2');
});

test('the readout counts a unit as soon as it has its verdict, and carries on seamlessly into the next unit',()=>{
  const line={unit:5,passed:3,rejected:1,prev:'pass'} as const;
  const at=(kind:CycleCase,progress:number,extra:Partial<LineRun>={})=>tally({...startRun(kind,line),progress,...extra});
  assert.deepEqual(at('pass',50),{passed:3,rejected:1});assert.deepEqual(at('pass',87),{passed:4,rejected:1},'passed at release');
  assert.deepEqual(at('pass',104,{logged:true}),{passed:4,rejected:1});
  assert.deepEqual(at('open',95),{passed:3,rejected:2},'rejected once it failed twice');
  assert.deepEqual(at('open',100,{logged:true,held:true}),{passed:3,rejected:2},'counted while the line is held');
  for(const kind of ['pass','open'] as const){
    const end=at(kind,CYCLE_END,{logged:true,cleared:true}),next=tally(startRun('pass',nextLine(line,kind)));
    assert.deepEqual(end,{passed:next.passed,rejected:next.rejected},`${kind}: 108 reads as the next unit's 0`);
  }
});

test('a restart on a unit already logged and leaving finishes it first, so nothing is logged twice and faults stay one-shot',()=>{
  const line={unit:5,passed:3,rejected:1,prev:'pass'} as const;
  const leaving={...startRun('open',line),progress:104,logged:true,cleared:true};
  const r=restartRun(leaving);
  assert.equal(r.line.unit,6);assert.equal(r.line.rejected,2);assert.equal(r.kind,'pass');assert.equal(r.progress,0);assert.equal(r.logged,false);
  assert.equal(restartRun(leaving,'short').kind,'short','a case picked as it leaves applies to the next unit');
  const log:number[]=[];let run=restartRun(leaving);for(let i=0;i<400;i++)run=advanceRun(run,80,{log:x=>log.push(x.line.unit)});
  assert.deepEqual(log.slice(0,1),[6],'the next unit is logged, not the same one again');
});

test('restarting the robot on the same unit leaves the operator side where it got to',()=>{
  const line={unit:4,passed:3,rejected:0,prev:'pass'} as const;
  const mid={...startRun('pass',line),progress:50},before=runFrame(mid),after=runFrame(restartRun(mid,'search'));
  for(const key of ['unloadZ','loadZ','tote'] as const)close(after[key],before[key],key);
  near(after.tool,HOME,'the robot starts the unit again');
  // the clock stays monotonic: running on from the restart, the operator side never goes back
  let run=restartRun(mid,'search'),last=runFrame(run).loadZ;
  for(let i=0;i<300&&run.line.unit===4;i++){run=advanceRun(run,80);if(run.line.unit!==4)break;const f=runFrame(run);assert.ok(f.loadZ>=last-1e-9);last=f.loadZ;}
});

test('a case picked before the unit has done anything different changes in place; otherwise the robot restarts',()=>{
  const mid={...startRun('pass'),progress:50};
  assert.equal(sameSoFar(mid,'open'),true,'an open wire shows only at the wire test');
  assert.equal(sameSoFar(mid,'short'),true);
  assert.equal(sameSoFar(mid,'search'),false,'the glare shows at the board check');
  assert.equal(sameSoFar({...mid,progress:80},'open'),false,'past the wire test');
});

test('a cleared reject: the operator takes the harness out of the tray in under a second, then the board indexes on',()=>{
  const span=CLEAR_SPAN*(CYCLE_END-INDEX_START),fade=span*.8;
  close(cycleSeconds('open',INDEX_START,INDEX_START+fade),.8,'taking it out');close(cycleSeconds('open',INDEX_START,INDEX_START+span),1,'clearing seconds');
  const held=processFrame(100,'open').plug;
  for(let p=100.05;p<INDEX_START+span;p+=.05){const f=processFrame(p,'open');assert.equal(f.shift,0);assert.equal(f.shot,'reject');assert.ok(f.liveHarness);near(f.plug,held,`the plug stays in the tray at ${p}`);}
  assert.ok(processFrame(INDEX_START+fade/2,'open').harnessOut!>0&&processFrame(INDEX_START+fade/2,'open').harnessOut!<1);close(processFrame(INDEX_START+fade,'open').harnessOut!,1,'taken');
  assert.equal(processFrame(INDEX_START+fade/2,'open').message,'The operator takes the rejected harness to the locked bin.');
  assert.equal(processFrame(101,'open').liveHarness,false);
  // the bare board comes back round on its pallet: shown at unload, down the lift with it, never faded
  const next=processFrame(5,'pass',{unit:6,passed:3,rejected:2,prev:'reject'});assert.equal(next.unloadUnit,'board');assert.equal(next.pack,false);
});

test('the counters show what the frame shows: a scrub back before the verdict uncounts it, a restart after it finishes the unit',()=>{
  const line={unit:5,passed:3,rejected:1,prev:'pass'} as const;
  assert.deepEqual(tally({...startRun('pass',line),progress:30}),{passed:3,rejected:1},'scrubbed back: not counted yet');
  assert.equal(verdict({...startRun('pass',line),progress:30}),null);assert.equal(verdict({...startRun('pass',line),progress:87}),'pass');
  // after the verdict, a restart or a reset finishes this unit first and starts the next one
  const shown={...startRun('pass',line),progress:90};assert.equal(finished(shown),true);
  const r=restartRun(shown);assert.equal(r.line.unit,6);assert.equal(r.line.passed,4);assert.equal(r.progress,0);
  assert.deepEqual(tally(r),{passed:4,rejected:1},'counted once, on the next unit');
  assert.equal(restartRun(shown,'open').kind,'open','the case applies to the next unit');
  // before the verdict a restart stays on this unit
  const early={...startRun('pass',line),progress:40};assert.equal(finished(early),false);assert.equal(restartRun(early,'open').line.unit,5);
  // a unit logged and then scrubbed back is not restarted onto itself again (it would be logged twice)
  assert.equal(restartRun({...startRun('pass',line),progress:20,logged:true}).line.unit,6);
});
