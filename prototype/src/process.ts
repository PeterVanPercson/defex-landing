import { probePoints } from './model.ts';

export type CycleCase = 'search' | 'latched' | 'half-seat' | 'open' | 'short';
export type Check = 'pending' | 'pass' | 'fail';
type Point = [number, number, number];
export const CYCLE_STEPS = [
  ['Load the cell', 0, 'Operator loads the harness face up, routes its slack through the comb, plugs the far end into the tester and clamps the board on two locating pins. The arm waits clear of the board.', 'Planned hardware'],
  ['Find the header', 10, 'The wrist camera measures where this board’s header sits against the taught fixture target. The estimate is good to about a millimetre, so the press still checks depth and force.', 'Planned vision'],
  ['Pick the housing', 20, 'Hover above the nest, then descend straight down. Two aluminium fingers grip the housing side walls over 5 mm; the latch and wires stay clear.', 'Planned handling'],
  ['Turn over and regrip', 30, 'Lower the face-up connector straight into the turnover cradle, which clamps it. Release, retract, turn it over and regrip on the wire end, where the back stop takes the insertion load. Then lift clear and carry it level.', 'Planned handling'],
  ['Approach', 40, 'Move quickly to a hover point over the header: the saved fixture correction when there is one, otherwise the camera’s estimate. Then slow down above the header.', 'Simplified simulation'],
  ['Press', 50, 'Press straight down. Seating requires the specified depth and the latch force signature: peak, drop, then stop.', 'Simplified simulation'],
  ['Search', 56, 'Retract clear before each lateral shift, then try the next ring offset, with at most 48 tries. Save a correction only after all checks pass.', 'Simplified simulation'],
  ['Pull check', 66, 'Apply a controlled upward pull. A moving plug fails, even if it could pass continuity.', 'Ideal latch model'],
  ['Continuity', 76, 'Check each wire from the harness far end to the board for opens and shorts.', 'Injected fault illustration'],
  ['Release', 90, 'Open the fingers and retract vertically, leaving an accepted connector seated, then return home. Log all three checks; the operator unloads the unit.', 'Planned handling'],
] as const;
export const NEST = [-100, -14, 20.1] as const;
export const TURNOVER = [-45, -95, 38] as const;
// Waiting pose: behind the fixture, clear of where the operator's hands go.
export const HOME = [0, 75, 160] as const;
export const REJECT = [-125, -90, 9.5] as const;
export const HEADER = [1.2, .65] as const;
export const EXAMPLE_LIMITS = { press: 5, pull: 2.5, extraction: 6 } as const;
// The camera's estimate of the header, 0.7 mm short in X of where it really is.
export const VISION = [HEADER[0] - .7, HEADER[1]] as const;
// The contact experiment's ordered ring points, in scene millimetres, centred on the camera estimate.
export const SEARCH_POINTS = probePoints().map(([x,y]) => [VISION[0]+x*1000,VISION[1]+y*1000] as [number,number]);
export const FIT_INDEX = 1;
export const FIT = SEARCH_POINTS[FIT_INDEX];
// Tool heights, scene mm. The plug's mating face is 4.05 below the tool origin once turned over.
export const SEATED = 15.1, HALF_SEATED = SEATED + 1.8, BLOCKED = 21.8, CLEAR = 26, SLOW = 25;
// The tool height at which the plug's face meets the top of the header shroud (z 18).
const FIRST_CONTACT = 22;
const EXTRACTION_PEAK = 4.2, LOOSE_EXTRACTION = 1.2, PRESS_LIMIT = 4.6;
const LATCHED_SEAT = 56;
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const smooth = (x:number) => {const t=clamp(x);return clamp(t*t*t*(10+t*(-15+6*t)));};
const mix = (a:readonly number[],b:readonly number[],t:number) => a.map((v,i)=>v+(b[i]-v)*smooth(t)) as Point;
const atFit = (z:number):Point => [FIT[0],FIT[1],z];
const atVision = (z:number):Point => [VISION[0],VISION[1],z];

export interface Checks { seated:Check; pull:Check; contacts:Check[]; contactFaults:(string|null)[] }
export interface ProcessFrame extends Checks {
  progress:number; step:number; title:string; scope:string; rotation:number; cradle:number; cradleGrip:number;
  tool:Point; plug:Point; jaw:number; accepted:boolean|null; force:number; pullForce:number; extractionForce:number;
  // latch: 0 engaged and free, 1 held released for extraction
  latch:number;
  depth:number; tries:number; retry:number; message:string; rejected:boolean; camera:boolean; priorFailure:string|null;
}
export function recoveryStart(kind:CycleCase):number|null {
  return kind==='half-seat'?74:kind==='open'?82:kind==='short'?80:null;
}
// Where each press ends: the first attempt's, then the retry's.
export function seatPoints(kind:CycleCase):number[] {
  const first=kind==='latched'?LATCHED_SEAT:64,start=recoveryStart(kind);
  return start===null?[first]:[first,start+(100-start)*.32];
}
function emptyChecks():Checks {
  return {seated:'pending',pull:'pending',contacts:Array(6).fill('pending'),contactFaults:Array(6).fill(null)};
}
function faultReason(kind:CycleCase):string {
  return kind==='half-seat'?'Half-seat: the press stopped 1.8 mm short with no latch drop, and the plug moved under the pull':kind==='open'?'Contact 3 is open':'Contacts 2 and 5 are shorted';
}

export function processFrame(value:number,kind:CycleCase='search'):ProcessFrame {
  const p=Math.max(0,Math.min(100,value));
  // A saved correction seats on the first press, so this case skips the search step.
  if(kind==='latched'&&p>=LATCHED_SEAT){const f=frameAt(66+(p-LATCHED_SEAT)*34/(100-LATCHED_SEAT),kind);f.progress=p;return f;}
  return frameAt(p,kind);
}

function frameAt(p:number,kind:CycleCase):ProcessFrame {
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  const rotation=p<34?Math.PI:p<36?Math.PI*(1-smooth((p-34)/2)):0;
  const f:ProcessFrame={
    ...emptyChecks(),progress:p,step,title:CYCLE_STEPS[step][0],scope:CYCLE_STEPS[step][3],rotation,cradle:rotation,
    // 1 opens the cradle jaws 5 mm each side; 2.5 mm clears the housing and keeps them out of the harness.
    cradleGrip:.5*(p<32?1:p<32.3?1-smooth((p-32)/.3):p<38?0:smooth((p-38)/.2)),
    tool:[...HOME],plug:[...NEST],jaw:1,accepted:null,force:0,pullForce:0,extractionForce:0,latch:0,
    depth:0,tries:1,retry:0,message:CYCLE_STEPS[step][2],rejected:false,camera:p>=10&&p<20,priorFailure:null,
  };
  const camera:Point=[-34,-5,95];
  const pickup:Point=[NEST[0],NEST[1],NEST[2]-4.3],nestHover:Point=[NEST[0],NEST[1],60],nestLift:Point=[NEST[0],NEST[1],85.7];
  const cradleSide:Point=[TURNOVER[0]-40,TURNOVER[1],85.7],cradleHover:Point=[TURNOVER[0],TURNOVER[1],85.7],cradleUp:Point=[TURNOVER[0],TURNOVER[1],TURNOVER[2]-4.3];
  const carry=()=>{f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];};
  if(p<10)f.tool=[...HOME];
  else if(p<20){
    f.tool=mix(HOME,camera,(p-10)/8);
    if(p>=18)f.message=`Header found ${VISION[0].toFixed(2)} mm X, ${VISION[1].toFixed(2)} mm Y from the taught target, give or take about a millimetre. The approach aims there.`;
  }
  else if(p<23)f.tool=mix(camera,nestHover,(p-20)/3);
  else if(p<25)f.tool=mix(nestHover,pickup,(p-23)/2);
  else if(p<28){f.tool=[...pickup];f.jaw=1-smooth((p-25)/3);}
  else if(p<30){
    f.tool=mix(pickup,nestLift,(p-28)/2);carry();
    f.message='The housing is held between the side fingers. The planned grasp check verifies its position before transport.';
  }
  // The hanging harness must not sweep the cradle, so arrive over it along X from its open (-x) side.
  else if(p<30.9){f.tool=mix(nestLift,cradleSide,(p-30)/.9);carry();}
  else if(p<31.4){f.tool=mix(cradleSide,cradleHover,(p-30.9)/.5);carry();}
  else if(p<32){f.tool=mix(cradleHover,cradleUp,(p-31.4)/.6);carry();}
  else if(p<32.3){f.tool=[...cradleUp];f.plug=[...TURNOVER];f.jaw=0;}
  else if(p<33){f.tool=[...cradleUp];f.plug=[...TURNOVER];f.jaw=smooth((p-32.3)/.7);}
  else if(p<34){f.tool=mix(cradleUp,[TURNOVER[0],TURNOVER[1],100],p-33);f.plug=[...TURNOVER];}
  else if(p<36){f.tool=[TURNOVER[0],TURNOVER[1],100];f.plug=[...TURNOVER];}
  else if(p<37){f.tool=mix([TURNOVER[0],TURNOVER[1],100],TURNOVER,p-36);f.plug=[...TURNOVER];}
  else if(p<38){f.tool=[...TURNOVER];f.plug=[...TURNOVER];f.jaw=1-smooth(p-37);}
  else if(p<39){f.tool=mix(TURNOVER,[TURNOVER[0],TURNOVER[1],90],(p-38.2)/.8);f.jaw=0;f.plug=[...f.tool];}
  else{
    const xy=kind==='latched'?FIT:VISION;
    if(p<40)f.tool=mix([TURNOVER[0],TURNOVER[1],90],[xy[0],xy[1],65],p-39);
    else if(p<50)f.tool=p<44?mix([xy[0],xy[1],65],[xy[0],xy[1],38],(p-40)/4):mix([xy[0],xy[1],38],[xy[0],xy[1],SLOW],(p-44)/6);
    if(p<50){f.jaw=0;f.plug=[...f.tool];}else insertion(f,p,kind);
  }
  const start=recoveryStart(kind);
  if(start!==null&&p>=start)retryAndReject(f,p,start,kind);
  f.depth=Math.hypot(f.plug[0]-HEADER[0],f.plug[1]-HEADER[1])<3&&f.plug[2]<FIRST_CONTACT?FIRST_CONTACT-f.plug[2]:0;
  return f;
}

function insertion(f:ProcessFrame,p:number,kind:CycleCase){
  const half=kind==='half-seat',latched=kind==='latched',target=half?HALF_SEATED:SEATED;
  f.jaw=0;
  if(p<56){
    if(latched){
      f.tool=atFit(SLOW-(SLOW-SEATED)*smooth((p-50)/6));f.force=seatForce(travel(f.tool[2],SEATED));
      if(p>=54)f.message='The saved fixture correction seats this connector on the first try. No XY search is needed.';
    }else{
      f.tool=atVision(SLOW-(SLOW-BLOCKED)*smooth((p-50)/4));f.force=4.4*smooth((p-53)/2);
      if(p>=55)f.message='The first try is blocked at the header edge. Depth is short of the seat; retract before searching.';
    }
  }else if(p<66&&!latched){
    const a=VISION,b=FIT;
    if(p<58){
      f.tool=mix(atVision(BLOCKED),atVision(CLEAR),(p-56)/2);f.force=4.4*(1-smooth((p-56)/.6));
      f.message='Retract vertically until the connector clears the header.';
    }else if(p<60){
      f.tool=mix([a[0],a[1],CLEAR],[b[0],b[1],CLEAR],(p-58)/2);
      f.message=`Move to the next ring point: ${(b[0]-a[0]).toFixed(2)} mm X, ${(b[1]-a[1]).toFixed(2)} mm Y from the estimate. The plug stays above the header.`;
    }else{
      f.tries=2;f.tool=mix(atFit(CLEAR),atFit(target),(p-60)/4);
      f.force=(half?pressStall(travel(f.tool[2],target)):seatForce(travel(f.tool[2],target)))*(1-smooth((p-64)/.75));
      if(p<64)f.message='Try 2 of 48. Press straight down at this ring point; check depth and the force signature.';
      else if(half)f.message='The press reached its force limit 1.8 mm short of the seat, with no latch drop. The pull check decides.';
      else {f.seated='pass';f.message='Full depth with the latch force drop: seated. Hold the position for the pull check.';}
    }
    f.tries=p<60?1:2;
  }else{
    f.tool=atFit(target);f.tries=latched?1:2;f.seated=half?'pending':'pass';
    if(latched)f.force=1.4*(1-smooth((p-66)/.75));
  }
  if(p>=66&&p<76){
    f.pullForce=EXAMPLE_LIMITS.pull*smooth((p-66)/7);
    if(half)f.tool[2]+=1.8*smooth((p-67)/6);
    if(p>=73){f.pull=half?'fail':'pass';if(half){f.seated='fail';f.message='The plug moved 1.8 mm under the pull: it never latched. Stop this attempt before the wiring check.';}}
  }
  if(p>=76){f.pull='pass';checkContacts(f,p,kind);}
  f.plug=[...f.tool];
  if(p>=90&&recoveryStart(kind)===null){
    f.pull='pass';f.seated='pass';f.contacts.fill('pass');f.accepted=true;f.plug=atFit(SEATED);f.force=0;f.pullForce=0;
    f.jaw=smooth((p-90)/1.5);
    f.tool=p<95?atFit(SEATED+62*smooth((p-91.5)/3.5)):mix(atFit(SEATED+62),HOME,(p-95)/5);
    f.message=p<95?'All three checks passed. Save this fixture correction, open the fingers, then retract straight up. The plug stays seated for the operator to unload.':'Return home, clear of the board, for the next unit.';
  }
}

function checkContacts(f:Checks,p:number,kind:CycleCase){
  for(let i=0;i<6;i++){
    if(p<77+i*2)break;
    if(kind==='open'&&i===2){f.contacts[i]='fail';f.contactFaults[i]='open';break;}
    if(kind==='short'&&i===1){f.contacts[1]=f.contacts[4]='fail';f.contactFaults[1]='short to 5';f.contactFaults[4]='short to 2';break;}
    f.contacts[i]='pass';
  }
}
// Peak, drop as the latch snaps over, then the stop.
function seatForce(u:number){
  if(u<=0)return 0;
  if(u<.65)return 3.4*smooth(u/.65);
  if(u<.82)return 3.4-(3.4-.9)*smooth((u-.65)/.17);
  return .9+.5*smooth((u-.82)/.18);
}
// Press force follows the plug's travel from first contact with the shroud to the target depth.
function travel(z:number,target:number){return clamp((FIRST_CONTACT-z)/(FIRST_CONTACT-target));}
// A half-seat: the force climbs to the press limit and never drops.
function pressStall(u:number){return u<=0?0:PRESS_LIMIT*smooth(u/.85);}
function extraction(u:number,peak:number){return peak*Math.sin(Math.PI*clamp(u));}

function retryAndReject(f:ProcessFrame,p:number,start:number,kind:CycleCase){
  const u=(p-start)/(100-start),half=kind==='half-seat',failedZ=half?HALF_SEATED+1.8:SEATED,target=half?HALF_SEATED:SEATED;
  const peak=half?LOOSE_EXTRACTION:EXTRACTION_PEAK;
  Object.assign(f,emptyChecks());f.retry=1;f.accepted=null;f.force=0;f.pullForce=0;f.extractionForce=0;f.latch=0;f.priorFailure=faultReason(kind);f.jaw=0;f.tries=2;
  f.scope='One fresh attempt · illustrative signals';
  if(u<.18){
    f.step=4;f.title='Retry';
    f.tool=u<.03?atFit(failedZ):u<.1?mix(atFit(failedZ),atFit(33),(u-.03)/.07):mix(atFit(33),atFit(SLOW),(u-.1)/.08);
    f.extractionForce=u<.06?extraction((u-.03)/.03,peak):0;
    if(!half)f.latch=u<.03?smooth(u/.03):u<.1?1:1-smooth((u-.1)/.02);
    f.message=half?`${f.priorFailure}. The first attempt is retained in the log. Lift it out, reset all checks and approach again.`:`${f.priorFailure}. The first attempt is retained in the log. Hold the latch released, lift the plug out under the force limit, reset all checks and approach again.`;
  }else if(u<.34){
    f.step=5;f.title='Retry: press';f.tool=mix(atFit(SLOW),atFit(target),(u-.18)/.14);
    f.force=(half?pressStall(travel(f.tool[2],target)):seatForce(travel(f.tool[2],target)))*(1-smooth((u-.32)/.02));
    if(u>=.32&&!half)f.seated='pass';
    f.message=half?'Attempt 2: press straight down again. The force again reaches the limit short of the seat, with no latch drop.':'Attempt 2: press straight down again. A new depth and force check must pass before the pull test.';
  }else{
    f.tool=atFit(target);f.seated=half?'pending':'pass';f.step=7;f.title='Retry: pull check';
    f.pullForce=u<.48?EXAMPLE_LIMITS.pull*smooth((u-.34)/.1)*(1-smooth((u-.46)/.02)):0;
    if(half)f.tool[2]+=1.8*smooth((u-.35)/.09);
    if(u>=.44){f.pull=half?'fail':'pass';if(half)f.seated='fail';}
    f.message='Attempt 2: apply a new controlled pull. The wiring check remains untested until this passes.';
    if(!half&&u>=.46){
      f.step=8;f.title='Retry: continuity';checkContacts(f,76+(u-.46)/.1*14,kind);
      f.message='Attempt 2: the pull passed. Test the wires again for opens and shorts, stopping at the first fault.';
    }
    if(f.pull==='fail'||f.contacts.includes('fail')){
      f.accepted=false;f.title='Failed twice';
      f.message=`${faultReason(kind)} again. No further retry. ${half?'Lift it out':'Hold the latch released and extract it under the force limit'}, tag the unit and retain both attempts.`;
    }
  }
  if(u>=.56){
    f.step=9;f.title=u<.81?'Reject':'Rejected';f.scope='Planned handling · illustrative forces';
    f.tool=u<.58?atFit(failedZ):u<.66?mix(atFit(failedZ),atFit(70),(u-.58)/.08):u<.75?mix(atFit(70),[REJECT[0],REJECT[1],70],(u-.66)/.09):u<.81?mix([REJECT[0],REJECT[1],70],REJECT,(u-.75)/.06):[...REJECT];
    f.extractionForce=u<.61?extraction((u-.58)/.03,peak):0;f.pullForce=0;
    f.latch=half?0:u<.58?smooth((u-.56)/.02):u<.66?1:1-smooth((u-.66)/.02);
  }
  f.plug=[...f.tool];
  if(u>=.81){
    f.rejected=true;f.jaw=smooth((u-.81)/.02);f.plug=[...REJECT];
    const lifted:Point=[REJECT[0],REJECT[1],REJECT[2]+30];
    f.tool=u<.83?[...REJECT]:u<.87?mix(REJECT,lifted,(u-.83)/.04):mix(lifted,HOME,(u-.87)/.13);
    f.message='Rejected unit in the tray. Both attempts and the force trace are retained. A person must clear the fault before the next unit.';
  }
}

export interface ProcessRecord {
  id:number; recordedAt:string; source:'scripted illustration'; case:CycleCase; accepted:boolean;
  limits:typeof EXAMPLE_LIMITS; correction:[number,number]|null;
  attempts:(Checks & {number:number; result:'accepted'|'failed'; reason:string|null})[];
  trace:{progress:number; press:number; pull:number; extraction:number; depth:number; attempt:number}[];
}
export function processRecord(id:number,kind:CycleCase,recordedAt=new Date().toISOString()):ProcessRecord {
  const end=processFrame(100,kind),start=recoveryStart(kind);
  const result=(f:ProcessFrame,number:number)=>({number,seated:f.seated,pull:f.pull,contacts:f.contacts,contactFaults:f.contactFaults,result:f.accepted===true?'accepted' as const:'failed' as const,reason:f.accepted===true?null:faultReason(kind)});
  const attempts=start===null?[result(end,1)]:[result(processFrame(start-.001,kind),1),result(end,2)];
  return {
    id,recordedAt,source:'scripted illustration',case:kind,accepted:end.accepted===true,limits:EXAMPLE_LIMITS,
    correction:end.accepted===true?[...FIT]:null,attempts,
    trace:Array.from({length:1001},(_,i)=>{const f=processFrame(i/10,kind);return {progress:f.progress,press:f.force,pull:f.pullForce,extraction:f.extractionForce,depth:f.depth,attempt:f.retry+1};}),
  };
}
