import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { applyLine,createCell,totes,TOTE,TRANSFER,TRANSFER_RUN } from '../src/cell-geometry.ts';
import { processFrame,CYCLE_STEPS,NEST,HEADER,HOME,PLUG_SEATED } from '../src/process.ts';
const CYCLE_STEPS_LAST=CYCLE_STEPS[CYCLE_STEPS.length-1][0];
import type { CycleCase,ProcessFrame } from '../src/process.ts';
import { advanceRun,cycleSeconds,finished,isReject,nextLine,pace,PACE,pickCase,pressedCase,queuedNote,resetRun,restartRun,restartsOnPlay,retryShown,runEnd,runFrame,sameSoFar,scrubRun,startRun,tally,verdict } from '../src/cycle-player.ts';
import type { LineRun } from '../src/cycle-player.ts';
import { CLEAR_SECONDS,CLEAR_SPAN,CYCLE_END,FIRST_UNIT,INDEX_START,LIFT_DOWN,LINE_X,LOAD,OP_PACE,PALLET_PITCH,PICK,SWAP,TOTE_SLOTS,UNLOAD,opSeconds } from '../src/line.ts';
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
  // the empty pallet goes down only once the picker has lifted the unit and most of its harness off it (the last of the
  // harness then comes off as the pallet lowers away under it), and the loaded one comes up
  close(at(PICK.raised).unloadZ,0,'still up while the unit is lifted');close(at(UNLOAD.low).unloadZ,LIFT_DOWN,'down');
  close(at(LOAD.up).loadZ,LIFT_DOWN,'load down');close(at(LOAD.top).loadZ,0,'load up');
  assert.ok(PICK.raised<UNLOAD.down&&UNLOAD.low<UNLOAD.away&&LOAD.under<LOAD.up);
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
  // the robot posts the harness into the bin (CLEAR_SECONDS), then the bare board indexes out
  run=play(run,2000,log,holds);const posting=processFrame(run.progress,run.kind,run.line);
  assert.ok(posting.liveHarness&&posting.post>0&&!posting.harnessOut&&posting.shift===0&&posting.shot==='reject','posting into the bin');
  run=play(run,CLEAR_SECONDS*1000-2000+50,log,holds);assert.equal(run.kind,'open');assert.ok(run.progress>INDEX_START);assert.ok(!processFrame(run.progress,run.kind,run.line).liveHarness,'the harness went into the bin');
  run=play(run,3300,log,holds);
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

test('a cleared reject: the robot posts the harness into the locked bin, nothing fades, then the board indexes on',()=>{
  const span=CLEAR_SPAN*(CYCLE_END-INDEX_START);
  close(cycleSeconds('open',INDEX_START,INDEX_START+span),CLEAR_SECONDS,'posting seconds');
  for(let p=INDEX_START+.02;p<INDEX_START+span;p+=.05){
    const f=processFrame(p,'open');assert.equal(f.shift,0,`the pallet waits at ${p}`);assert.equal(f.shot,'reject');assert.ok(f.liveHarness);assert.ok(!f.harnessOut,'nothing fades');
    assert.equal(f.message,'The robot posts the rejected harness into the locked bin.');assert.equal(f.title,'Post the reject');assert.ok(f.post>0);
  }
  for(let p=0;p<=CYCLE_END;p+=.25)for(const kind of ['pass','open','short','half-seat'] as const)assert.ok(!processFrame(p,kind).harnessOut,`${kind} fades at ${p}`);
  const after=processFrame(INDEX_START+span+.01,'open');assert.equal(after.liveHarness,false);assert.equal(after.post,-1);assert.equal(after.title,CYCLE_STEPS_LAST);
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

test('Play on a reject scrubbed to its end logs it and holds for Clear reject; only 108 starts the next unit',()=>{
  const line={unit:3,passed:2,rejected:0,prev:'pass'} as const;
  const at100={...startRun('open',line),progress:INDEX_START};
  assert.equal(restartsOnPlay(at100),false,'an uncleared reject at 100 is not finished');
  const log:number[]=[],holds:number[]=[],r=play(at100,200,log,holds);
  assert.equal(r.held,true);assert.equal(r.line.unit,3);assert.equal(r.progress,INDEX_START);assert.deepEqual(log,[3]);assert.deepEqual(holds,[3]);
  assert.equal(restartsOnPlay({...startRun('pass',line),progress:CYCLE_END}),true);
  assert.equal(restartsOnPlay({...startRun('pass',line),progress:INDEX_START}),false,'a pass at 100 plays its index');
  // Reset (and so the Next unit pill, which scrubs to 100): an uncleared reject that has its verdict goes to the held line
  for(const p of [96,INDEX_START]){const h=resetRun({...startRun('open',line),progress:p});assert.equal(h.held,true);assert.equal(h.progress,INDEX_START);assert.equal(h.line.unit,3);}
  // a pass with its verdict, or a cleared reject, resets onto the next unit as before
  assert.equal(resetRun({...startRun('pass',line),progress:90}).line.unit,4);
  assert.equal(resetRun({...startRun('open',line),progress:104,cleared:true,logged:true}).line.unit,4);
});

test('a case picked for the next unit is dropped when the viewer scrubs back into this one',()=>{
  let run=pickCase({...startRun('pass'),progress:90},'open');
  assert.equal(run.next,'open');assert.equal(run.kind,'pass');assert.equal(pressedCase(run),'open');
  run=scrubRun(run,30);assert.equal(run.next,undefined);assert.equal(pressedCase(run),'pass');assert.equal(run.progress,30);
  const kinds:CycleCase[]=[];advanceRun(run,30000,{next:x=>kinds.push(x.kind)});assert.equal(kinds[0],'pass','the next unit runs what the buttons show');
  // a click on the current case of an unfinished unit also drops a queued one
  assert.equal(pickCase({...startRun('pass'),progress:60,next:'search'},'pass').next,undefined);
  // a scrub that stays past the verdict keeps it; a scrub of an uncleared reject stops at 100
  assert.equal(scrubRun({...startRun('pass'),progress:95,next:'open'},92).next,'open');
  assert.equal(scrubRun(startRun('open'),CYCLE_END).progress,INDEX_START);
});

test('a case that would differ from what the robot already did is queued for the next unit, never jumped to',()=>{
  const mid={...startRun('pass'),progress:50},r=pickCase(mid,'search');
  assert.equal(r.progress,50);assert.equal(r.kind,'pass');assert.equal(r.next,'search');assert.equal(r.line.unit,1);
  near(runFrame(r).tool,runFrame(mid).tool,'the arm stays where it is');near(runFrame(r).plug,runFrame(mid).plug,'and so does the plug');
  assert.equal(pressedCase(r),'search');assert.equal(queuedNote(r),'Needs a search next');assert.equal(queuedNote(mid),'');
  // in place while nothing differs yet
  const same=pickCase(mid,'open');assert.equal(same.kind,'open');assert.equal(same.next,undefined);assert.equal(same.progress,50);
  // played on, the queued case runs on the next unit
  const kinds:CycleCase[]=[];advanceRun(r,30000,{next:x=>kinds.push(x.kind)});assert.equal(kinds[0],'search');
  // Reset restarts this unit, with the queued case
  const reset=resetRun(r);assert.equal(reset.kind,'search');assert.equal(reset.next,undefined);assert.equal(reset.line.unit,1);assert.equal(reset.progress,0);
});

test('the retry tag shows through the second attempt and goes once the unit is rejected',()=>{
  for(const kind of ['open','short','half-seat'] as const){
    let shown=0;
    for(let p=0;p<=CYCLE_END;p+=.05){
      const f=processFrame(p,kind);if(retryShown(f))shown++;
      if(f.rejected||f.accepted===false||p>=INDEX_START)assert.equal(retryShown(f),false,`${kind} retry tag at ${p.toFixed(2)}`);
      if(!f.retry)assert.equal(retryShown(f),false);
    }
    assert.ok(shown>20,`${kind}: the tag shows on the retry`);
  }
});

test('a cleared reject runs for CLEAR_SECONDS before the board indexes on',()=>{
  close(cycleSeconds('open',INDEX_START,INDEX_START+CLEAR_SPAN*(CYCLE_END-INDEX_START)),CLEAR_SECONDS,'clear seconds');
  close(cycleSeconds('pass',INDEX_START,CYCLE_END),3.2,'a pass indexes in 3.2 s');
  // after the post the bare board's index takes as long as a pass's, so the pallets move at one speed
  for(const kind of ['open','short','half-seat'] as const)close(cycleSeconds(kind,INDEX_START+CLEAR_SPAN*(CYCLE_END-INDEX_START),CYCLE_END),3.2,`${kind} index after the post`);
});

// The tote swap's right-angle transfer, posed through a swap unit on the real cell.
const swapCell=createCell(6),swapLine:LineState={unit:TOTE_SLOTS+2,passed:TOTE_SLOTS+1,rejected:0,prev:'pass'};
const opAt=(t:number)=>{let lo=0,hi=INDEX_START;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(opSeconds(mid)<t)lo=mid;else hi=mid;}return hi;};
const meshesOf=(root:T.Object3D)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
const isUnder=(o:T.Object3D,roots:T.Object3D[])=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(roots.includes(x))return true;return false;};
const visible=(o:T.Object3D)=>{for(let x:T.Object3D|null=o;x;x=x.parent)if(!x.visible)return false;return true;};
const worldBox=(m:T.Object3D)=>new T.Box3().setFromObject(m);
function poseSwap(t:number){const f=processFrame(opAt(t),'pass',swapLine);applyLine(swapCell,f);swapCell.root.updateMatrixWorld(true);return f;}

test('the tote swap: pop-up transfers lift the empty tote off bed E, their belts carry it onto bed F and set it down there',()=>{
  const lifts=swapCell.tote.transfer.lifts,moving=lifts.flatMap(meshesOf);
  const totesOf=[swapCell.tote.group,swapCell.tote.out.group,swapCell.tote.spare.group];
  // what the moving parts and totes could meet near the beds: the bench, the rollers and frames, the lift cylinders
  const near=new T.Box3(new T.Vector3(-1300,-330,-60),new T.Vector3(-290,-30,120));
  const statics=meshesOf(swapCell.bench).filter(m=>!isUnder(m,lifts)&&worldBox(m).intersectsBox(near));
  const bores=new Set(['Transfer lift cylinder','Cylinder end cap']);
  const hit=(a:T.Box3,b:T.Box3)=>a.clone().expandByScalar(-.01).intersectsBox(b);
  const problems:string[]=[];let rose=0,carried=0;
  for(let t=0;t<=6;t+=.01){
    const f=poseSwap(t),tp=totes(t,true);assert.equal(f.swap,true);
    for(const m of moving){const b=worldBox(m);
      for(const s of statics)if(!(m.name==='Cylinder piston rod'&&bores.has(s.name))&&hit(b,worldBox(s)))problems.push(`${m.name} in ${s.name} at ${t.toFixed(2)}`);
      if(b.min.z<-39-1e-6||b.min.x<TRANSFER.pocket[0]||b.max.x>TRANSFER.pocket[1])problems.push(`${m.name} out of its pocket at ${t.toFixed(2)}`);
    }
    for(const g of totesOf.filter(visible)){
      const shell=meshesOf(g.children[0]).map(worldBox);
      for(const b of shell){for(const m of moving)if(hit(b,worldBox(m)))problems.push(`${g.name} on ${m.name} at ${t.toFixed(2)}`);for(const s of statics)if(hit(b,worldBox(s)))problems.push(`${g.name} in ${s.name} at ${t.toFixed(2)}`);}
    }
    // the pistons stay in their cylinders
    for(const m of moving.filter(m=>m.name==='Cylinder piston rod'))assert.ok(worldBox(m).min.z<-28.5,`rod out of its cylinder at ${t}`);
    // the tote being filled leaves the rollers only on the strands, rides them at their top and moves across only
    // while they are fully up, at their belts' speed
    const tote=swapCell.tote.group,strandTop=TRANSFER.low+TRANSFER.stroke*tp.lift;
    if(tote.position.z>TOTE.z+1e-9){rose++;close(tote.position.z,strandTop,`tote on the strands at ${t}`);}
    if(Math.abs(tote.position.y-TOTE.E[1])>1e-9&&Math.abs(tote.position.y-TOTE.F[1])>1e-9){
      carried++;close(tp.lift,1,`strands up while the tote moves across at ${t}`);
      close(tp.travel,tote.position.y-TOTE.E[1],`belt and tote together at ${t}`);
      // over strands on both sides of its middle, or with its middle over a strand
      const spans=[TOTE.E[1],TOTE.F[1]].map(c=>[c-TRANSFER.half,c+TRANSFER.half]),y=tote.position.y,under=spans.map(([a,b])=>[Math.max(a,y-TOTE.size[1]/2),Math.min(b,y+TOTE.size[1]/2)]).filter(([a,b])=>b>a);
      assert.ok(Math.min(...under.map(u=>u[0]))<y&&Math.max(...under.map(u=>u[1]))>y,`tote supported at ${t}`);
    }
    if(t<SWAP.in||t>SWAP.done)close(tp.lift,0,`strands down at ${t}`);
  }
  assert.deepEqual(problems.slice(0,6),[]);assert.ok(rose>50&&carried>50,`${rose} raised, ${carried} carried`);
  // the full tote has left F's strands before they rise; the empty one is on F's rollers before the picker comes over
  const out=totes(SWAP.in,true).out!;assert.ok(out[0]+TOTE.size[0]/2<TRANSFER.pocket[0],'the full tote is past the transfer');
  assert.deepEqual(totes(SWAP.done,true).fill,[TOTE.F[0],TOTE.F[1]]);close(totes(SWAP.done,true).raise,0,'set down');assert.ok(SWAP.done<PICK.over);
  // the belts run a whole number of cleats, so the next unit's 0 shows them as this unit's 108
  close(totes(SWAP.done,true).travel,TRANSFER_RUN,'belt run');close(TRANSFER_RUN%TRANSFER.pitch,0,'whole cleats');assert.ok(TRANSFER_RUN-(TOTE.F[1]-TOTE.E[1])<TRANSFER.pitch);
  poseSwap(opSeconds(INDEX_START));const end=swapCell.tote.transfer.belt.map!.offset.x;
  applyLine(swapCell,processFrame(0,'pass',nextLine(swapLine,'pass')));const start=swapCell.tote.transfer.belt.map!.offset.x;
  const d=Math.abs(((end-start)%1+1)%1);assert.ok(Math.min(d,1-d)<1e-9,`transfer belt jumps by ${d}`);
  for(const l of lifts)close(l.position.z,0,'down');
});

test('the transfers sit under the rollers when down: belt tops below the rollers, every strand in a roller gap',()=>{
  applyLine(swapCell,processFrame(30,'pass',{unit:4,passed:3,rejected:0,prev:'pass'}));swapCell.root.updateMatrixWorld(true);
  const rollers=meshesOf(swapCell.bench).filter(m=>m.name==='Conveyor roller').map(worldBox);
  for(const l of swapCell.tote.transfer.lifts)for(const m of meshesOf(l)){
    const b=worldBox(m);if(m.name==='Transfer belt')assert.ok(b.max.z<=TOTE.z-4+1e-9,'belt top under the rollers');
    for(const r of rollers)assert.ok(!b.clone().expandByScalar(-.01).intersectsBox(r),`${m.name} in a roller`);
  }
  // raised, the strands stand clear of the rollers' top by the tote's lift
  assert.ok(TRANSFER.low+TRANSFER.stroke-TOTE.z>=5);
});
