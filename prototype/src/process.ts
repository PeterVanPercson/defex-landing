import { probePoints } from './model.ts';

export type CycleCase = 'pass' | 'search' | 'half-seat' | 'open' | 'short';
export type Check = 'pending' | 'pass' | 'fail';
type Point = [number, number, number];
type XY = readonly [number, number];
export const CYCLE_STEPS = [
  ['Load the cell', 0, 'The operator loads the board and the harness. The arm waits at home.', 'Planned hardware'],
  ['Check the board', 2, 'The wrist camera measures where this board’s header sits.', 'Planned vision'],
  ['Pick the housing', 12, 'Come straight down over the nest and grip the housing by its side walls.', 'Planned handling'],
  ['Turn over and regrip', 23, 'Set the housing in the cradle, turn it over and regrip it at the wire end.', 'Planned handling'],
  ['Check the grip', 34, 'An upward camera measures where the plug sits in the fingers.', 'Planned vision'],
  ['Align', 43, 'Move fast to just above the header, aimed by both measurements. Then slow down.', 'Simplified simulation'],
  ['Press', 50, 'Press gently. The chamfer guides the last fraction of a millimetre.', 'Simplified simulation'],
  ['Pull check', 62, 'Pull up gently. A plug that moves fails.', 'Ideal latch model'],
  ['Continuity', 72, 'Test each wire for opens and shorts.', 'Injected fault illustration'],
  ['Release', 86, 'Open the fingers and lift straight up. The plug stays seated.', 'Planned handling'],
] as const;
export const NEST = [-100, -14, 20.1] as const;
export const TURNOVER = [-45, -95, 38] as const;
// Waiting pose: behind the fixture, clear of where the operator's hands go.
export const HOME = [0, 75, 160] as const;
export const REJECT = [-125, -90, 9.5] as const;
// The upward-looking camera that checks the plug in the fingers: centre x, y and the top of its ring light (scene mm).
export const UPCAM = [-62, -48, 10] as const;
// Where this board's header really is.
export const HEADER = [1.2, .65] as const;
export const EXAMPLE_LIMITS = { press: 5, pull: 2.5, extraction: 6 } as const;
// The taught header position. This board's header is soldered 0.14 mm X, -0.11 mm Y off it.
export const NOMINAL = [HEADER[0] - .14, HEADER[1] + .11] as const;
// Where the housing really sits in the fingers from the regrip on, off the tool centre. The fingers close
// along X and centre it there, so most of the offset lies along the finger faces.
export const GRASP = [-.05, .3] as const;
// What the cameras read on this unit: the header's offset from nominal and the plug's offset in the fingers.
// Each reading is a little off, which leaves a quarter-millimetre for the chamfer.
const SEEN_GRASP = [.15, .29] as const;
// In the search case a glare throws the board reading out, so the plug arrives 1.1 mm off the header.
const GLARE = [1.1 * Math.cos(Math.PI * 11 / 9), 1.1 * Math.sin(Math.PI * 11 / 9)] as const;
export function seenHeader(kind:CycleCase):[number,number] {
  if(kind!=='search')return [.08,-.16];
  return [HEADER[0]+GLARE[0]-GRASP[0]+SEEN_GRASP[0]-NOMINAL[0],HEADER[1]+GLARE[1]-GRASP[1]+SEEN_GRASP[1]-NOMINAL[1]];
}
export function seenGrasp():[number,number] { return [...SEEN_GRASP]; }
// The tool position the arm aims for: the measured header, less the measured grip offset.
export function aim(kind:CycleCase):[number,number] {
  const h=seenHeader(kind);
  return [NOMINAL[0]+h[0]-SEEN_GRASP[0],NOMINAL[1]+h[1]-SEEN_GRASP[1]];
}
// The tool position that puts the plug exactly on the header.
export const SEAT_TOOL = [HEADER[0] - GRASP[0], HEADER[1] - GRASP[1]] as const;
// How far off the header the plug's face can land and still be guided in by the lead-in chamfer.
export const CAPTURE = .5;
export const offHeader = (tool:XY) => Math.hypot(tool[0]+GRASP[0]-HEADER[0], tool[1]+GRASP[1]-HEADER[1]);
// The fallback search's ordered ring points, as tool positions centred on the measured aim, in scene mm.
export const SEARCH_POINTS = probePoints().map(([x,y]) => [aim('search')[0]+x*1000, aim('search')[1]+y*1000] as [number,number]);
// Presses in the search case: every point up to the first inside the chamfer's reach.
export const SEARCH_TRIES = SEARCH_POINTS.findIndex(p => offHeader(p) <= CAPTURE) + 1;
// Tool heights, scene mm. The plug's mating face is 4.05 below the tool origin once turned over.
export const SEATED = 15.1, HALF_SEATED = SEATED + 1.8, BLOCKED = 21.8, CLEAR = 26, SLOW = 25;
// The tool height at which the plug's face meets the top of the header shroud (z 18), and the travel
// past it over which the chamfer slides the plug onto the header.
export const FIRST_CONTACT = 22, SLIDE = 1.5;
// The grip check hovers the plug's face 26 mm over the upward camera.
export const GRIP_CHECK_Z = UPCAM[2] + 30;
export const LATCH_PEAK = 3.4;
const EXTRACTION_PEAK = 4.2, LOOSE_EXTRACTION = 1.2, PRESS_LIMIT = 4.6, BLOCKED_FORCE = 4.4;
const PRESS = 50, PRESSED = 57, SEARCH_SEAT = 58, PULL = 62, CONTACTS = 72, RELEASE = 86;
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const smooth = (x:number) => {const t=clamp(x);return clamp(t*t*t*(10+t*(-15+6*t)));};
const mix = (a:readonly number[],b:readonly number[],t:number) => a.map((v,i)=>v+(b[i]-v)*smooth(t)) as Point;
const at = (xy:XY,z:number):Point => [xy[0],xy[1],z];
// A ring-light pulse over u = 0..1: up, held while the camera measures, down.
const pulse = (u:number) => u<=0||u>=1?0:smooth(u/.2)*(1-smooth((u-.8)/.2));
const mm = (v:XY) => `${Math.hypot(v[0],v[1]).toFixed(2)} mm`;

export interface Checks { seated:Check; pull:Check; contacts:Check[]; contactFaults:(string|null)[] }
export interface ProcessFrame extends Checks {
  progress:number; step:number; title:string; scope:string; rotation:number; cradle:number; cradleGrip:number;
  tool:Point; plug:Point; jaw:number; accepted:boolean|null; force:number; pullForce:number; extractionForce:number;
  // latch: 0 engaged and free, 1 held released for extraction
  latch:number;
  depth:number; tries:number; retry:number; message:string; rejected:boolean; camera:boolean; priorFailure:string|null;
  // 0..1: the wrist camera's ring light while it measures this board's header, and the upward camera's while it measures the grip
  headerCheck:number; graspCheck:number;
  // a short measured value shown beside the step title, e.g. '0.32 mm', or ''
  detail:string;
}
export function recoveryStart(kind:CycleCase):number|null {
  return kind==='half-seat'?70:kind==='open'?78:kind==='short'?76:null;
}
// Where each press ends: the first attempt's, then the retry's.
export function seatPoints(kind:CycleCase):number[] {
  const first=kind==='search'?SEARCH_SEAT+4*.6:PRESSED,start=recoveryStart(kind);
  return start===null?[first]:[first,start+(100-start)*.32];
}
function emptyChecks():Checks {
  return {seated:'pending',pull:'pending',contacts:Array(6).fill('pending'),contactFaults:Array(6).fill(null)};
}
function faultReason(kind:CycleCase):string {
  return kind==='half-seat'?'Half-seated: 1.8 mm short, and it moved under the pull':kind==='open'?'Contact 3 is open':'Contacts 2 and 5 are shorted';
}

// The turnover keeps its own clock, 30..39, from the collision-checked cradle sequence. Each of its moves
// gets a share of the step that suits its length, so none of them rushes.
const TURNOVER_CLOCK=[[30,23],[30.9,24.9],[31.4,25.8],[32,26.9],[32.3,27.3],[33,28],[34,29.4],[36,30.7],[37,32],[38,32.6],[38.2,32.9],[39,34]] as const;
export function turnoverClock(p:number){
  if(p<23)return 29;if(p>=34)return 39;
  const i=TURNOVER_CLOCK.findIndex(([,t])=>t>p),[q0,p0]=TURNOVER_CLOCK[i-1],[q1,p1]=TURNOVER_CLOCK[i];
  return q0+(q1-q0)*(p-p0)/(p1-p0);
}

export function processFrame(value:number,kind:CycleCase='pass'):ProcessFrame {
  const p=Math.max(0,Math.min(100,value));
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  const q=turnoverClock(p);
  const rotation=q<34?Math.PI:q<36?Math.PI*(1-smooth((q-34)/2)):0;
  const f:ProcessFrame={
    ...emptyChecks(),progress:p,step,title:CYCLE_STEPS[step][0],scope:CYCLE_STEPS[step][3],rotation,cradle:rotation,
    // 1 opens the cradle jaws 5 mm each side; 2.5 mm clears the housing and keeps them out of the harness.
    cradleGrip:.5*(q<32?1:q<32.3?1-smooth((q-32)/.3):q<38?0:smooth((q-38)/.2)),
    tool:[...HOME],plug:[...NEST],jaw:1,accepted:null,force:0,pullForce:0,extractionForce:0,latch:0,
    depth:0,tries:1,retry:0,message:CYCLE_STEPS[step][2],rejected:false,camera:step===1,priorFailure:null,headerCheck:0,graspCheck:0,detail:'',
  };
  // The wrist camera, 34 mm X and 5 mm Y off the tool centre, looks straight down at the header from 105 mm.
  const camera:Point=[-34,-5,95];
  const pickup:Point=[NEST[0],NEST[1],NEST[2]-4.3],nestHover:Point=[NEST[0],NEST[1],60],nestLift:Point=[NEST[0],NEST[1],85.7];
  const cradleSide:Point=[TURNOVER[0]-40,TURNOVER[1],85.7],cradleHover:Point=[TURNOVER[0],TURNOVER[1],85.7],cradleUp:Point=[TURNOVER[0],TURNOVER[1],TURNOVER[2]-4.3];
  const cradleLift:Point=[TURNOVER[0],TURNOVER[1],90],gripHover:Point=[UPCAM[0],UPCAM[1],GRIP_CHECK_Z];
  const carry=()=>{f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];};
  if(p<2)f.tool=[...HOME];
  else if(p<12){
    f.tool=mix(HOME,camera,(p-2)/4);f.headerCheck=pulse((p-6)/3.5);
    if(p>=9.5){
      f.detail=mm(seenHeader(kind));f.message=`This header sits ${f.detail} from nominal. The arm will aim there.`;
      if(kind==='search'){f.detail+=' · glare';f.message=`Glare on the board: a low-confidence reading of ${mm(seenHeader(kind))}. The press will check it.`;}
    }
  }
  else if(p<15.5)f.tool=mix(camera,nestHover,(p-12)/3.5);
  else if(p<18)f.tool=mix(nestHover,pickup,(p-15.5)/2.5);
  else if(p<20.5){f.tool=[...pickup];f.jaw=1-smooth((p-18)/2.5);}
  else if(p<23){f.tool=mix(pickup,nestLift,(p-20.5)/2.5);carry();f.message='The housing is held by its side walls. Lift it straight up.';}
  // The hanging harness must not sweep the cradle, so arrive over it along X from its open (-x) side.
  else if(q<30.9){f.tool=mix(nestLift,cradleSide,(q-30)/.9);carry();}
  else if(q<31.4){f.tool=mix(cradleSide,cradleHover,(q-30.9)/.5);carry();}
  else if(q<32){f.tool=mix(cradleHover,cradleUp,(q-31.4)/.6);carry();}
  else if(q<32.3){f.tool=[...cradleUp];f.plug=[...TURNOVER];f.jaw=0;}
  else if(q<33){f.tool=[...cradleUp];f.plug=[...TURNOVER];f.jaw=smooth((q-32.3)/.7);}
  else if(q<34){f.tool=mix(cradleUp,[TURNOVER[0],TURNOVER[1],100],q-33);f.plug=[...TURNOVER];}
  else if(q<36){f.tool=[TURNOVER[0],TURNOVER[1],100];f.plug=[...TURNOVER];}
  else if(q<37){f.tool=mix([TURNOVER[0],TURNOVER[1],100],TURNOVER,q-36);f.plug=[...TURNOVER];}
  else if(q<38){f.tool=[...TURNOVER];f.plug=[...TURNOVER];f.jaw=1-smooth(q-37);}
  else if(p<34){
    // As the cradle lets go the housing settles in the closed fingers, slightly off their centre.
    f.tool=mix(TURNOVER,cradleLift,(q-38.2)/.8);f.jaw=0;held(f,smooth((q-38.1)/.1));
    if(q>=38.2)f.message='Regripped at the wire end. Lift it clear of the cradle.';
  }
  else if(p<PRESS){
    f.jaw=0;
    if(p<43){
      f.tool=p<37.4?mix(cradleLift,gripHover,(p-34)/3.4):[...gripHover];f.graspCheck=pulse((p-37.6)/3);
      if(p>=40.6){f.detail=mm(SEEN_GRASP);f.message=`The plug sits ${f.detail} off centre in the fingers. The aim allows for it.`;}
    }else{
      const xy=aim(kind);
      f.tool=p<47?mix(gripHover,at(xy,GRIP_CHECK_Z),(p-43)/4):mix(at(xy,GRIP_CHECK_Z),at(xy,SLOW),(p-47)/3);
    }
    held(f);
  }
  else insertion(f,p,kind);
  const start=recoveryStart(kind);
  if(start!==null&&p>=start)retryAndReject(f,p,start,kind);
  f.depth=Math.hypot(f.plug[0]-HEADER[0],f.plug[1]-HEADER[1])<3&&f.plug[2]<FIRST_CONTACT?FIRST_CONTACT-f.plug[2]:0;
  return f;
}
// The plug in the closed fingers: off the tool centre by the grip offset (s blends it in at the regrip).
function held(f:ProcessFrame,s=1){f.plug=[f.tool[0]+GRASP[0]*s,f.tool[1]+GRASP[1]*s,f.tool[2]];}

// One compliant press from a hover point. Once the plug's face meets the shroud the chamfer slides the plug
// and the tool onto the header over the first SLIDE mm of travel; then the latch signature, or a stall.
function press(f:ProcessFrame,from:XY,fromZ:number,target:number,u:number,half:boolean){
  const z=fromZ-(fromZ-target)*smooth(u),slide=smooth((FIRST_CONTACT-z)/SLIDE),t=travel(z,target);
  f.tool=[from[0]+(SEAT_TOOL[0]-from[0])*slide,from[1]+(SEAT_TOOL[1]-from[1])*slide,z];
  f.force=Math.max(half?pressStall(t):seatForce(t),chamfer(t));
  if(!half&&t>=.82)f.detail=`latch ${LATCH_PEAK.toFixed(1)} N`;
}
// A press that lands on the flat top of the shroud: the force climbs as soon as the face touches, and the
// depth stays short.
function blocked(f:ProcessFrame,xy:XY,z:number){f.tool=at(xy,z);f.force=BLOCKED_FORCE*clamp((FIRST_CONTACT-z)/(FIRST_CONTACT-BLOCKED));}

function insertion(f:ProcessFrame,p:number,kind:CycleCase){
  const half=kind==='half-seat',target=half?HALF_SEATED:SEATED;
  f.jaw=0;
  if(p<PULL){
    if(kind==='search')search(f,p);
    else if(p<PRESSED)press(f,aim(kind),SLOW,target,(p-PRESS)/(PRESSED-PRESS),half);
    else{
      press(f,aim(kind),SLOW,target,1,half);f.force*=1-smooth(p-PRESSED);
      if(half){f.detail='1.8 mm short';f.message='The press reached its limit 1.8 mm short, with no latch drop. The pull check decides.';}
      else{f.seated='pass';f.message='Seated in one press: full depth and the latch signature.';}
    }
  }else{
    f.tool=at(SEAT_TOOL,target);f.tries=kind==='search'?SEARCH_TRIES:1;f.seated=half?'pending':'pass';
    if(p<CONTACTS){
      f.pullForce=EXAMPLE_LIMITS.pull*smooth((p-PULL)/5)*(1-smooth((p-70)/1.5));
      if(half)f.tool[2]+=1.8*smooth((p-PULL-1)/5);
      if(p>=68){
        f.pull=half?'fail':'pass';
        if(half){f.seated='fail';f.detail=faultTag(kind);f.message='The plug moved 1.8 mm under the pull: it never latched. Stop before the wire test.';}
        else{f.detail=`held ${EXAMPLE_LIMITS.pull.toFixed(1)} N`;f.message='It held under the pull. Now the wires.';}
      }
    }else{
      f.pull='pass';checkContacts(f,p,kind);
      const done=f.contacts.filter(c=>c!=='pending').length;
      f.detail=f.contacts.includes('fail')?faultTag(kind):done?`${f.contacts.filter(c=>c==='pass').length}/6 wires`:'';
      if(p>=CONTACTS+12&&f.contacts.every(c=>c==='pass'))f.message='All six wires pass: no opens, no shorts.';
    }
  }
  held(f);
  if(p>=RELEASE&&recoveryStart(kind)===null){
    f.pull='pass';f.seated='pass';f.contacts.fill('pass');f.accepted=true;f.plug=[HEADER[0],HEADER[1],SEATED];f.force=0;f.pullForce=0;
    f.jaw=smooth((p-RELEASE)/2);
    f.tool=p<92?at(SEAT_TOOL,SEATED+62*smooth((p-88)/4)):mix(at(SEAT_TOOL,SEATED+62),HOME,(p-92)/8);
    f.message=p<92?'All three checks passed. Open the fingers and lift straight up; the plug stays seated.':'Return home. The operator unloads the unit.';
  }
}

// The rare fallback: the plug lands on the flat top of the shroud, so retract straight up, move to the next
// ring point clear of the header, and press again, until a press is inside the chamfer's reach.
function search(f:ProcessFrame,p:number){
  const span=(SEARCH_SEAT-PRESS)/(SEARCH_TRIES-1);
  if(p<SEARCH_SEAT){
    const k=Math.floor((p-PRESS)/span),v=(p-PRESS)/span-k,xy=SEARCH_POINTS[k],next=SEARCH_POINTS[k+1];
    f.tries=k+1;if(k>0||v>=.5)f.title='Search';
    // A quick approach to just above the shroud, a slow squeeze onto it, then the force is let off before lifting.
    if(v<.3){const z0=k?CLEAR:SLOW;blocked(f,xy,z0-(z0-FIRST_CONTACT-.2)*smooth(v/.3));if(k)f.message=`Search point ${k+1}: press gently.`;}
    else if(v<.5){blocked(f,xy,FIRST_CONTACT+.2-(FIRST_CONTACT+.2-BLOCKED)*smooth((v-.3)/.2));if(k)f.message=`Search point ${k+1}: press gently.`;}
    else if(v<.62){blocked(f,xy,BLOCKED);f.force*=1-smooth((v-.54)/.08);f.message=k?`Point ${k+1} is blocked too. Lift and move on.`:'Stopped on top of the header, short of depth. The plug is too far off for the chamfer.';}
    else if(v<.8){blocked(f,xy,BLOCKED+(CLEAR-BLOCKED)*smooth((v-.62)/.18));f.force=0;f.message='Lift straight up, clear of the header, before moving.';}
    else{f.tool=mix(at(xy,CLEAR),at(next,CLEAR),(v-.8)/.2);f.message=`Move to search point ${k+2}, above the header.`;}
  }else{
    const v=(p-SEARCH_SEAT)/(PULL-SEARCH_SEAT);f.tries=SEARCH_TRIES;f.title='Search';
    press(f,SEARCH_POINTS[SEARCH_TRIES-1],CLEAR,SEATED,v/.6,false);f.message=`Search point ${SEARCH_TRIES}: press gently.`;
    if(v>=.6){
      f.force*=1-smooth((v-.6)/.25);f.seated='pass';
      f.message=`Seated on point ${SEARCH_TRIES}, with the latch signature. Searches are rare, so this unit is flagged in the log.`;
    }
  }
}

// What failed, short enough for the readout beside the step title.
export function faultTag(kind:CycleCase):string {
  return kind==='open'?'wire 3 open':kind==='short'?'wires 2 and 5 short':kind==='half-seat'?'moved 1.8 mm':'';
}
function checkContacts(f:Checks,p:number,kind:CycleCase){
  for(let i=0;i<6;i++){
    if(p<CONTACTS+1+i*2)break;
    if(kind==='open'&&i===2){f.contacts[i]='fail';f.contactFaults[i]='open';break;}
    if(kind==='short'&&i===1){f.contacts[1]=f.contacts[4]='fail';f.contactFaults[1]='short to 5';f.contactFaults[4]='short to 2';break;}
    f.contacts[i]='pass';
  }
}
// Peak, drop as the latch snaps over, then the stop.
function seatForce(u:number){
  if(u<=0)return 0;
  if(u<.65)return LATCH_PEAK*smooth(u/.65);
  if(u<.82)return LATCH_PEAK-(LATCH_PEAK-.9)*smooth((u-.65)/.17);
  return .9+.5*smooth((u-.82)/.18);
}
// The small contact force while the chamfer slides the plug sideways onto the header.
function chamfer(u:number){return u<=0?0:.6*smooth(u/.11);}
// Press force follows the plug's travel from first contact with the shroud to the target depth.
function travel(z:number,target:number){return clamp((FIRST_CONTACT-z)/(FIRST_CONTACT-target));}
// A half-seat: the force climbs to the press limit and never drops.
function pressStall(u:number){return u<=0?0:PRESS_LIMIT*smooth(u/.85);}
function extraction(u:number,peak:number){return peak*Math.sin(Math.PI*clamp(u));}

function retryAndReject(f:ProcessFrame,p:number,start:number,kind:CycleCase){
  const u=(p-start)/(100-start),half=kind==='half-seat',failedZ=half?HALF_SEATED+1.8:SEATED,target=half?HALF_SEATED:SEATED;
  const peak=half?LOOSE_EXTRACTION:EXTRACTION_PEAK,seat=(z:number)=>at(SEAT_TOOL,z);
  Object.assign(f,emptyChecks());f.retry=1;f.accepted=null;f.force=0;f.pullForce=0;f.extractionForce=0;f.latch=0;f.priorFailure=faultReason(kind);f.jaw=0;f.tries=2;f.detail=faultTag(kind);
  f.scope='One fresh attempt · illustrative signals';
  if(u<.18){
    f.step=5;f.title='Retry';
    f.tool=u<.03?seat(failedZ):u<.1?mix(seat(failedZ),seat(33),(u-.03)/.07):mix(seat(33),seat(SLOW),(u-.1)/.08);
    f.extractionForce=u<.06?extraction((u-.03)/.03,peak):0;
    if(!half)f.latch=u<.03?smooth(u/.03):u<.1?1:1-smooth((u-.1)/.02);
    f.message=half?`${f.priorFailure}. Lift it out and try once more.`:`${f.priorFailure}. Hold the latch open, lift it out and try once more.`;
  }else if(u<.34){
    f.step=6;f.title='Retry: press';press(f,SEAT_TOOL,SLOW,target,(u-.18)/.14,half);f.force*=1-smooth((u-.32)/.02);
    if(u>=.32&&!half)f.seated='pass';
    f.message=half?'Second attempt: the press again stops short, with no latch drop.':'Second attempt: press again, with fresh depth and force checks.';
  }else{
    f.tool=seat(target);f.seated=half?'pending':'pass';f.step=7;f.title='Retry: pull check';
    f.pullForce=u<.48?EXAMPLE_LIMITS.pull*smooth((u-.34)/.1)*(1-smooth((u-.46)/.02)):0;
    if(half)f.tool[2]+=1.8*smooth((u-.35)/.09);
    if(u>=.44){f.pull=half?'fail':'pass';if(half)f.seated='fail';}
    f.message='Second attempt: pull again before the wire test.';
    if(!half&&u>=.46){
      f.step=8;f.title='Retry: continuity';checkContacts(f,CONTACTS+(u-.46)/.1*14,kind);
      f.message='Second attempt: test the wires again.';
    }
    if(f.pull==='fail'||f.contacts.includes('fail')){
      f.accepted=false;f.title='Failed twice';
      f.message=`${faultReason(kind)} again. Reject the unit and keep both attempts in the log.`;
    }
  }
  const tray:Point=[REJECT[0]-GRASP[0],REJECT[1]-GRASP[1],REJECT[2]];
  if(u>=.56){
    f.step=9;f.title=u<.81?'Reject':'Rejected';f.scope='Planned handling · illustrative forces';
    f.tool=u<.58?seat(failedZ):u<.66?mix(seat(failedZ),seat(70),(u-.58)/.08):u<.75?mix(seat(70),[tray[0],tray[1],70],(u-.66)/.09):u<.81?mix([tray[0],tray[1],70],tray,(u-.75)/.06):[...tray];
    f.extractionForce=u<.61?extraction((u-.58)/.03,peak):0;f.pullForce=0;
    f.latch=half?0:u<.58?smooth((u-.56)/.02):u<.66?1:1-smooth((u-.66)/.02);
    if(u>=.58)f.message=half?'Lift it out and carry it to the reject tray.':'Hold the latch open, lift it out and carry it to the reject tray.';
  }
  held(f);
  if(u>=.81){
    f.rejected=true;f.jaw=smooth((u-.81)/.02);f.plug=[...REJECT];
    const lifted:Point=[tray[0],tray[1],tray[2]+30];
    f.tool=u<.83?[...tray]:u<.87?mix(tray,lifted,(u-.83)/.04):mix(lifted,HOME,(u-.87)/.13);
    f.message='The unit is in the reject tray with both attempts logged. A person must clear it before the next unit.';
  }
}

export interface ProcessRecord {
  id:number; recordedAt:string; source:'scripted illustration'; case:CycleCase; accepted:boolean;
  limits:typeof EXAMPLE_LIMITS;
  // what the two cameras measured on this unit, mm: the header's offset from nominal and the plug's offset in the fingers
  measured:{header:[number,number]; grip:[number,number]};
  // set when the unit needed the fallback search
  flag:string|null;
  attempts:(Checks & {number:number; result:'accepted'|'failed'; reason:string|null})[];
  trace:{progress:number; press:number; pull:number; extraction:number; depth:number; attempt:number}[];
}
export function processRecord(id:number,kind:CycleCase,recordedAt=new Date().toISOString()):ProcessRecord {
  const end=processFrame(100,kind),start=recoveryStart(kind);
  const result=(f:ProcessFrame,number:number)=>({number,seated:f.seated,pull:f.pull,contacts:f.contacts,contactFaults:f.contactFaults,result:f.accepted===true?'accepted' as const:'failed' as const,reason:f.accepted===true?null:faultReason(kind)});
  const attempts=start===null?[result(end,1)]:[result(processFrame(start-.001,kind),1),result(end,2)];
  const round=(v:readonly number[])=>v.map(x=>Math.round(x*100)/100) as [number,number];
  return {
    id,recordedAt,source:'scripted illustration',case:kind,accepted:end.accepted===true,limits:EXAMPLE_LIMITS,
    measured:{header:round(seenHeader(kind)),grip:round(SEEN_GRASP)},flag:kind==='search'?`Search used: seated on point ${SEARCH_TRIES}`:null,attempts,
    trace:Array.from({length:1001},(_,i)=>{const f=processFrame(i/10,kind);return {progress:f.progress,press:f.force,pull:f.pullForce,extraction:f.extractionForce,depth:f.depth,attempt:f.retry+1};}),
  };
}
