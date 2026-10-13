import { probePoints } from './model.ts';

export type CycleCase = 'search' | 'latched' | 'half-seat' | 'open' | 'short';
export type Check = 'pending' | 'pass' | 'fail';
type Point = [number, number, number];
export const CYCLE_STEPS = [
  ['Load the cell', 0, 'Operator loads the harness face up, routes its slack through the comb, plugs the far end into the tester and clamps the board on two locating pins.', 'Planned hardware'],
  ['Find the header', 10, 'The wrist camera checks the header position against the taught fixture target and corrects for where this board sits.', 'Planned vision'],
  ['Pick the housing', 20, 'Two aluminium fingers grip the housing side walls. The back stop takes the insertion load; the latch and wires stay clear.', 'Planned handling'],
  ['Turn over, regrip and carry', 30, 'Place the face-up connector in the turnover cradle. Release, retract, turn it over and regrip. Then carry it level, checking the grasp and keeping the cable clear.', 'Planned handling'],
  ['Approach', 40, 'Move quickly to a hover point, apply this fixture’s saved correction, then slow down above the header.', 'Simplified simulation'],
  ['Press', 50, 'Press straight down. Seating requires the specified depth and the latch force signature: peak, drop, then stop.', 'Simplified simulation'],
  ['Search if blocked', 60, 'Retract clear before each lateral shift. Search rings of offsets, with at most 48 tries. Save a correction only after all checks pass.', 'Simplified simulation'],
  ['Pull check', 75, 'Apply a controlled upward pull. A moving plug fails, even if it could pass continuity.', 'Ideal latch model'],
  ['Continuity', 85, 'Check each wire from the harness far end to the board for opens and shorts.', 'Injected fault illustration'],
  ['Release and log', 95, 'Open the fingers and retract vertically, leaving an accepted connector seated. Log all three checks; the operator unloads the unit.', 'Planned handling'],
] as const;
export const NEST = [-100, -14, 20.1] as const;
export const TURNOVER = [-45, -95, 38] as const;
export const HOME = [-10, 10, 145] as const;
export const REJECT = [-125, -90, 9.5] as const;
export const HEADER = [1.2, .65] as const;
export const EXAMPLE_LIMITS = { press: 5, pull: 2.5, extraction: 4 } as const;
// Use the contact experiment's ordered ring points, in scene millimetres.
export const SEARCH_POINTS = probePoints().map(([x,y]) => [x*1000,y*1000] as [number,number]);
export const FIT_INDEX = 14;
export const FIT = SEARCH_POINTS[FIT_INDEX];
export const SEATED = 15.1, BLOCKED = 25.8, CLEAR = 30;
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const smooth = (x:number) => {const t=clamp(x);return t*t*t*(10+t*(-15+6*t));};
const mix = (a:readonly number[],b:readonly number[],t:number) => a.map((v,i)=>v+(b[i]-v)*smooth(t)) as Point;
const atFit = (z:number):Point => [FIT[0],FIT[1],z];

export interface Checks { seated:Check; pull:Check; contacts:Check[]; contactFaults:(string|null)[] }
export interface ProcessFrame extends Checks {
  progress:number; step:number; title:string; scope:string; rotation:number; cradle:number; cradleGrip:number;
  tool:Point; plug:Point; jaw:number; accepted:boolean|null; force:number; pullForce:number; extractionForce:number;
  depth:number; tries:number; retry:number; message:string; rejected:boolean; camera:boolean; priorFailure:string|null;
}
export function recoveryStart(kind:CycleCase):number|null {
  return kind==='half-seat'?83:kind==='open'?89.2:kind==='short'?87.8:null;
}
export function seatPoints(kind:CycleCase):number[] {
  const first=kind==='latched'?58:73.94,start=recoveryStart(kind);
  return start===null?[first]:[first,start+(100-start)*.41];
}
function emptyChecks():Checks {
  return {seated:'pending',pull:'pending',contacts:Array(6).fill('pending'),contactFaults:Array(6).fill(null)};
}
function faultReason(kind:CycleCase):string {
  return kind==='half-seat'?'The plug moved during the pull check':kind==='open'?'Contact 3 is open':'Contacts 2 and 5 are shorted';
}

export function processFrame(value:number,kind:CycleCase='search'):ProcessFrame {
  const p=Math.max(0,Math.min(100,value));
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  const rotation=p<34?Math.PI:p<36?Math.PI*(1-smooth((p-34)/2)):0;
  const f:ProcessFrame={
    ...emptyChecks(),progress:p,step,title:CYCLE_STEPS[step][0],scope:CYCLE_STEPS[step][3],rotation,cradle:rotation,
    cradleGrip:p<31.8?1:p<32?1-smooth((p-31.8)/.2):p<38?0:smooth((p-38)/.2),
    tool:[...HOME],plug:[...NEST],jaw:1,accepted:null,force:0,pullForce:0,extractionForce:0,
    depth:0,tries:1,retry:0,message:CYCLE_STEPS[step][2],rejected:false,camera:p>=10&&p<20,priorFailure:null,
  };
  const pickup=[NEST[0],NEST[1],NEST[2]-4.3],cradleUp=[TURNOVER[0],TURNOVER[1],TURNOVER[2]-4.3];
  if(p<10)f.tool=[...HOME];
  else if(p<20){
    f.tool=mix(HOME,[HEADER[0]-34,HEADER[1]-5,95],(p-10)/8);
    if(p>=18)f.message='Header registered against the fixture: the illustrated correction is +1.20 mm X, +0.65 mm Y.';
  }
  else if(p<25)f.tool=mix([HEADER[0]-34,HEADER[1]-5,95],pickup,(p-20)/5);
  else if(p<28){f.tool=[...pickup] as Point;f.jaw=1-smooth((p-25)/3);}
  else if(p<30){
    f.tool=mix(pickup,[NEST[0],NEST[1],85.7],(p-28)/2);f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];
    f.message='The housing is held between the side fingers. The planned grasp check verifies its position before transport.';
  }
  else if(p<32){f.tool=mix([NEST[0],NEST[1],85.7],cradleUp,(p-30)/2);f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];}
  else if(p<33){f.tool=[...cradleUp] as Point;f.plug=[...TURNOVER];f.jaw=smooth(p-32);}
  else if(p<34){f.tool=mix(cradleUp,[TURNOVER[0],TURNOVER[1],100],p-33);f.plug=[...TURNOVER];}
  else if(p<36){f.tool=[TURNOVER[0],TURNOVER[1],100];f.plug=[...TURNOVER];}
  else if(p<37){f.tool=mix([TURNOVER[0],TURNOVER[1],100],TURNOVER,p-36);f.plug=[...TURNOVER];}
  else if(p<38){f.tool=[...TURNOVER];f.plug=[...TURNOVER];f.jaw=1-smooth(p-37);}
  else if(p<39){f.tool=mix(TURNOVER,[TURNOVER[0],TURNOVER[1],90],(p-38.2)/.8);f.jaw=0;f.plug=[...f.tool];}
  else if(p<40){f.tool=mix([TURNOVER[0],TURNOVER[1],90],[0,0,65],p-39);f.jaw=0;f.plug=[...f.tool];}
  else if(p<50){
    const xy=kind==='latched'?FIT:[0,0],hover=[xy[0],xy[1],38];
    f.tool=p<44?mix([0,0,65],hover,(p-40)/4):mix(hover,[xy[0],xy[1],29],(p-44)/6);
    f.jaw=0;f.plug=[...f.tool];
  }else insertion(f,p,kind);
  const start=recoveryStart(kind);
  if(start!==null&&p>=start)retryAndReject(f,p,start,kind);
  f.depth=Math.hypot(f.plug[0]-HEADER[0],f.plug[1]-HEADER[1])<3?Math.max(0,26-f.plug[2]):0;
  return f;
}

function insertion(f:ProcessFrame,p:number,kind:CycleCase){
  f.jaw=0;
  if(p<60){
    if(kind==='latched'){
      f.tool=atFit(29-(29-SEATED)*smooth((p-50)/8));f.force=seatForce((p-50)/8);
      if(p>=58)f.seated='pass';
    }else{
      f.tool=[0,0,29-(29-BLOCKED)*smooth((p-50)/5)];f.force=4.4*smooth((p-54)/2);
      if(p>=56)f.message='The first try is blocked at the header edge. Depth is short of the seat; retract before searching.';
    }
  }else if(p<74&&kind!=='latched'){
    const k=Math.min(FIT_INDEX-1,Math.floor(p-60)),u=p-60-k;
    const a=SEARCH_POINTS[k],b=SEARCH_POINTS[k+1],last=k===FIT_INDEX-1;
    f.tool=u<.22?mix([a[0],a[1],BLOCKED],[a[0],a[1],CLEAR],u/.22):u<.48?mix([a[0],a[1],CLEAR],[b[0],b[1],CLEAR],(u-.22)/.26):mix([b[0],b[1],CLEAR],[b[0],b[1],last?SEATED:BLOCKED],(u-.48)/.46);
    f.tries=k+1+(u>=.48?1:0);
    f.force=u<.22?3.6*(1-smooth(u/.12)):u<.48?0:last?seatForce((u-.48)/.46):3.6*smooth((u-.7)/.24);
    if(last&&u>=.94)f.seated='pass';
    f.message=u<.22?'Retract vertically until the connector clears the header.':u<.48?`Move to the next ring point: ${b[0].toFixed(2)} mm X, ${b[1].toFixed(2)} mm Y. The plug stays above the header.`:`Try ${f.tries} of 48. Press straight down at this ring point; check depth and the force signature.`;
  }else{
    f.tool=atFit(SEATED);f.tries=kind==='latched'?1:FIT_INDEX+1;f.seated='pass';
    if(p<75)f.force=kind==='latched'?0:1.4*(1-smooth((p-74)/.75));
  }
  if(kind==='latched'&&p>=60&&p<75)f.message='The saved fixture correction seats this connector on the first try. No XY search is needed.';
  if(p>=75&&p<85){
    f.pullForce=EXAMPLE_LIMITS.pull*smooth((p-75)/7);
    if(kind==='half-seat')f.tool[2]+=1.8*smooth((p-76)/6);
    if(p>=82){f.pull=kind==='half-seat'?'fail':'pass';if(kind==='half-seat')f.message='The plug moved under the pull: half-seat detected. Stop this attempt before the wiring check.';}
  }
  if(p>=85){f.pull='pass';checkContacts(f,p,kind);}
  f.plug=[...f.tool];
  if(p>=95&&recoveryStart(kind)===null){
    f.pull='pass';f.seated='pass';f.contacts.fill('pass');f.accepted=true;f.plug=atFit(SEATED);
    f.jaw=smooth((p-95)/1.5);f.tool=atFit(SEATED+62*smooth((p-96.5)/3.5));f.force=0;f.pullForce=0;
    f.message='All three checks passed. Save this fixture correction, open the fingers, then retract straight up. The plug stays seated for the operator to unload.';
  }
}

function checkContacts(f:Checks,p:number,kind:CycleCase){
  for(let i=0;i<6;i++){
    if(p<85.6+i*1.4)break;
    if(kind==='open'&&i===2){f.contacts[i]='fail';f.contactFaults[i]='open';break;}
    if(kind==='short'&&i===1){f.contacts[1]=f.contacts[4]='fail';f.contactFaults[1]='short to 5';f.contactFaults[4]='short to 2';break;}
    f.contacts[i]='pass';
  }
}
function seatForce(u:number){
  if(u<0)return 0;
  if(u<.65)return 3.4*smooth(u/.65);
  if(u<.82)return 3.4-(3.4-.9)*smooth((u-.65)/.17);
  return .9+.5*smooth((u-.82)/.18);
}
function retryAndReject(f:ProcessFrame,p:number,start:number,kind:CycleCase){
  const u=(p-start)/(100-start),half=kind==='half-seat',failedZ=half?SEATED+1.8:SEATED;
  Object.assign(f,emptyChecks());f.retry=1;f.accepted=null;f.force=0;f.pullForce=0;f.priorFailure=faultReason(kind);
  f.scope='One fresh attempt · illustrative signals';
  if(u<.23){
    f.step=4;f.title='Retry · fresh approach';
    f.tool=u<.12?mix(atFit(failedZ),atFit(33),u/.12):mix(atFit(33),atFit(29),(u-.12)/.11);
    f.message=`${f.priorFailure}. The first attempt is retained in the log. Reset all checks and approach again.`;
  }else if(u<.44){
    f.step=5;f.title='Retry · press';f.tool=mix(atFit(29),atFit(SEATED),(u-.23)/.18);
    f.force=seatForce((u-.23)/.18)*(1-smooth((u-.41)/.03));if(u>=.41)f.seated='pass';
    f.message='Attempt 2: press straight down again. A new depth and force check must pass before the pull test.';
  }else{
    f.seated='pass';f.tool=atFit(SEATED);f.step=7;f.title='Retry · pull check';
    f.pullForce=u<.6?EXAMPLE_LIMITS.pull*smooth((u-.44)/.14)*(1-smooth((u-.58)/.02)):0;
    if(half)f.tool[2]+=1.8*smooth((u-.44)/.14);
    if(u>=.58)f.pull=half?'fail':'pass';
    f.message='Attempt 2: apply a new controlled pull. The wiring check remains untested until this passes.';
    if(!half&&u>=.58){
      f.step=8;f.title='Retry · continuity';checkContacts(f,85+(u-.58)/.1*10,kind);
      f.message='Attempt 2: the pull passed. Test the wires again for opens and shorts, stopping at the first fault.';
    }
    if(f.pull==='fail'||f.contacts.includes('fail')){
      f.accepted=false;f.title='Second failure · reject';
      f.message=`${faultReason(kind)} again. No further retry. Extract under a force limit, tag the unit and retain both attempts.`;
    }
  }
  if(u>=.68){
    f.step=9;f.title=u<.96?'Extract and reject':'Await operator';f.scope='Planned handling · illustrative forces';
    f.tool=u<.8?mix(atFit(failedZ),atFit(70),(u-.68)/.12):u<.9?mix(atFit(70),[REJECT[0],REJECT[1],70],(u-.8)/.1):u<.96?mix([REJECT[0],REJECT[1],70],REJECT,(u-.9)/.06):[...REJECT];
    f.extractionForce=u<.8?2.8*Math.sin(clamp((u-.68)/.12)*Math.PI):0;f.pullForce=0;
  }
  f.plug=[...f.tool];
  if(u>=.96){
    f.rejected=true;f.jaw=smooth((u-.96)/.015);f.plug=[...REJECT];
    f.tool=[REJECT[0],REJECT[1],REJECT[2]+30*smooth((u-.975)/.025)];
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
