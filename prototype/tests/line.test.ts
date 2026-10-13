import test from 'node:test';
import assert from 'node:assert/strict';
import { processFrame,NEST,HEADER,HOME,PLUG_SEATED } from '../src/process.ts';
import type { CycleCase,ProcessFrame } from '../src/process.ts';
import { advanceRun,cycleSeconds,isReject,nextLine,restartRun,runEnd,runFrame,sameSoFar,startRun,tally } from '../src/cycle-player.ts';
import type { LineRun } from '../src/cycle-player.ts';
import { CYCLE_END,FIRST_UNIT,INDEX_START,LIFT_DOWN,LINE_X,PALLET_PITCH,TOTE_SLOTS } from '../src/line.ts';
import type { LineState } from '../src/line.ts';

const close=(a:number,b:number,what:string)=>assert.ok(Math.abs(a-b)<1e-9,`${what}: ${a} vs ${b}`);
const near=(a:readonly number[],b:readonly number[],what:string)=>a.forEach((v,i)=>close(v,b[i],`${what}[${i}]`));
// The four pallets by role, as the scene places them (x relative to the work station).
function pallets(f:ProcessFrame){
  return {
    live:{x:-f.shift,z:0},
    queue:{x:PALLET_PITCH-f.shift,z:0},
    load:{x:2*PALLET_PITCH-f.shift,z:f.loadZ,board:f.loadBoard,harness:f.loadHarness},
    unload:{x:-PALLET_PITCH,z:f.unloadZ,unit:f.unloadUnit,fade:f.unloadFade},
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
    close(a.live.x,b.unload.x,`${kind} unload x`);close(b.unload.z,0,'unload up');close(b.unload.fade,1,'unload shown');
    assert.equal(b.unload.unit,isReject(kind)?'board':'finished');assert.equal(end.liveHarness,!isReject(kind));
    if(!isReject(kind))near(end.plug,[HEADER[0]-PALLET_PITCH,HEADER[1],PLUG_SEATED],`${kind} finished plug`);
    // the old unload pallet is down its lift, out of sight, and comes back as the empty load pallet
    close(end.unloadZ,LIFT_DOWN,'old unload down');close(start.loadZ,LIFT_DOWN,'load down');close(start.loadBoard,0,'load empty');close(start.loadHarness,0,'load empty');
    // queue has become work and load has become queue, each carrying a fresh unit
    close(a.queue.x,0,'queue at work');near(start.plug,NEST,'fresh plug in the nest');close(start.rotation,Math.PI,'face up');
    close(a.load.x,b.queue.x,'load at queue');close(a.load.z,0,'load up');close(end.loadBoard,1,'board loaded');close(end.loadHarness,1,'harness loaded');
    // the robot and the cell are where the next unit starts
    near(end.tool,HOME,'tool home');near(start.tool,HOME,'tool home');
    for(const key of ['jaw','cradle','cradleGrip','latch','dock','tote','toteIn','force','pullForce','extractionForce','depth','headerCheck','graspCheck'] as const)close(end[key],start[key],`${kind} ${key}`);
    for(const key of ['accepted','rejected','seated','pull','camera','retry'] as const)assert.equal(end[key],start[key],`${kind} ${key}`);
    assert.deepEqual(end.contacts,start.contacts);
    near(end.focus,start.focus,`${kind} focus`);near(start.focus,NEST,'focus on the next unit');
  }
});

test('the operator side runs while the robot works: unload, return lift, load',()=>{
  const line={unit:4,passed:3,rejected:0,prev:'pass'} as const;
  const at=(p:number)=>processFrame(p,'pass',line);
  close(at(1).unloadFade,1,'shown');close(at(4).unloadFade,0,'packed');close(at(4).unloadZ,0,'still up');close(at(8).unloadZ,LIFT_DOWN,'down before the pick');
  close(at(19).loadZ,LIFT_DOWN,'load down');close(at(28).loadZ,0,'load up');close(at(29).loadBoard,0,'no board yet');close(at(34).loadBoard,1,'board');close(at(35).loadHarness,0,'no harness yet');close(at(42).loadHarness,1,'harness');
  assert.equal(processFrame(1).unloadUnit,'none');
});

test('the tote fills one passed unit per pack and swaps full for empty',()=>{
  const packed=(passed:number,prev:'pass'|'reject'|'none',p:number)=>processFrame(p,'pass',{unit:passed+2,passed,rejected:0,prev});
  assert.equal(packed(3,'pass',.5).tote,2);close(packed(3,'pass',2.5).toteIn,.5,'fading in');assert.equal(packed(3,'pass',2.5).tote,2);assert.equal(packed(3,'pass',5).tote,3);
  assert.equal(packed(3,'reject',10).tote,3,'a bare board never goes in the tote');
  assert.equal(packed(TOTE_SLOTS,'none',50).tote,TOTE_SLOTS,'full');
  const swap=packed(TOTE_SLOTS+1,'pass',2.5);assert.equal(swap.tote,0);assert.ok(swap.toteIn>0);assert.equal(swap.lineNote,'Full tote out, empty tote in');
  assert.equal(packed(TOTE_SLOTS+1,'pass',.5).tote,TOTE_SLOTS,'still the full tote before the pack');
  assert.equal(packed(TOTE_SLOTS+1,'pass',20).lineNote,'');
});

test('the shot: the hero only at the very start, the work shot while working, the line from the end of a pass, and the tray for a held reject',()=>{
  assert.equal(processFrame(1).shot,'wide');assert.equal(processFrame(1,'pass',{unit:2,passed:1,rejected:0,prev:'pass'}).shot,'work');
  assert.equal(processFrame(50).shot,'work');assert.equal(processFrame(98).shot,'line');assert.equal(processFrame(104).shot,'line');
  assert.equal(processFrame(100,'open').shot,'reject');assert.equal(processFrame(90,'open').shot,'work');assert.equal(processFrame(104,'open').shot,'line');
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
  // the person takes the harness to the bin (about 2 s), then the bare board indexes out
  run=play(run,1000,log,holds);const clearing=processFrame(run.progress,run.kind,run.line);
  assert.ok(clearing.liveHarness&&clearing.harnessOut!>0&&clearing.harnessOut!<1&&clearing.shift===0&&clearing.shot==='reject','clearing into the bin');
  run=play(run,1300,log,holds);assert.equal(run.kind,'open');assert.ok(run.progress>INDEX_START);assert.ok(!processFrame(run.progress,run.kind,run.line).liveHarness,'the harness went to the bin');
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
  for(const key of ['unloadZ','unloadFade','loadZ','loadBoard','loadHarness','tote','toteIn'] as const)close(after[key],before[key],key);
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

test('a cleared reject is carried to the bin over about 2 s before the pallets move, framed on the tray',()=>{
  close(cycleSeconds('open',INDEX_START,INDEX_START+.8),2.08,'clearing seconds');
  for(let p=100.05;p<100.8;p+=.05){const f=processFrame(p,'open');assert.equal(f.shift,0);assert.equal(f.shot,'reject');assert.ok(f.liveHarness);}
  const f=processFrame(100.4,'open');assert.ok(f.harnessOut!>0&&f.harnessOut!<1);assert.ok(f.plug[2]>processFrame(100,'open').plug[2],'lifted out of the tray');
  const posted=processFrame(100.79,'open').plug;assert.ok(Math.hypot(posted[0]+235,posted[1]+226)<1,'over the bin slot');
  assert.equal(processFrame(101,'open').liveHarness,false);assert.equal(processFrame(101,'open').shot,'line');
});

test('a unit that has shown its verdict stays counted through a scrub back, a restart or a case switch',()=>{
  const line={unit:5,passed:3,rejected:1,prev:'pass'} as const;
  const shown={...startRun('pass',line),progress:30,verdict:'pass'} as LineRun;
  assert.deepEqual(tally(shown),{passed:4,rejected:1},'scrubbed back');
  assert.deepEqual(tally(restartRun(shown)),{passed:4,rejected:1},'reset');
  assert.deepEqual(tally(restartRun(shown,'open')),{passed:4,rejected:1},'case switch, until a newer verdict');
  assert.deepEqual(tally(startRun('pass',line)),{passed:3,rejected:1},'no verdict yet');
});
