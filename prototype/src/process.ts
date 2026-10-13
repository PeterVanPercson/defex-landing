export type CycleCase = 'search' | 'latched' | 'half-seat' | 'open';
export type Check = 'pending' | 'pass' | 'fail';
export const CYCLE_STEPS = [
  ['Load the cell', 0, 'Operator loads the harness, routes its slack through the comb, plugs the far end into the tester and clamps the board on two locating pins.', 'Planned hardware'],
  ['Find the header', 10, 'The wrist camera checks the header position against the taught fixture target.', 'Planned vision'],
  ['Pick the housing', 20, 'Two aluminium fingers grip the housing side walls. The back stop takes the insertion load; the latch and wires stay clear.', 'Planned handling'],
  ['Turn over, regrip and carry', 30, 'Place the face-up connector in the turnover cradle. Release, retract, turn it over and regrip. Then carry it level, checking the grasp and keeping the cable clear.', 'Planned handling'],
  ['Approach', 40, 'Move to a hover point, apply this fixture’s saved correction, then slow down above the header.', 'Simplified simulation'],
  ['Press', 50, 'Press straight down. Seating requires the specified depth and the latch force signature: peak, drop, then stop.', 'Simplified simulation'],
  ['Search if blocked', 60, 'Retract clear before each lateral shift. Search a ring of offsets, with at most 48 tries. Save a correction only after all checks pass.', 'Simplified simulation'],
  ['Pull check', 75, 'Apply a controlled upward pull. A moving plug fails, even if it could pass continuity.', 'Ideal latch model'],
  ['Continuity', 85, 'Check each wire from the harness far end to the board for opens and shorts.', 'Injected fault model'],
  ['Release and log', 95, 'Open the fingers and retract vertically, leaving an accepted connector seated. Log all three checks; the operator unloads the unit.', 'Planned handling'],
] as const;
export const NEST = [-100, -14, 20.1] as const;
export const TURNOVER = [-45, -95, 38] as const;
export const HOME = [-10, 10, 145] as const;
export const REJECT = [-125, -90, 9.5] as const;
const clamp = (x:number)=>Math.max(0,Math.min(1,x));
const smooth = (x:number)=>{const t=clamp(x);return t*t*t*(10+t*(-15+6*t));};
const mix = (a:readonly number[],b:readonly number[],t:number)=>a.map((v,i)=>v+(b[i]-v)*smooth(t)) as [number,number,number];
export interface ProcessFrame {
  progress:number; step:number; rotation:number; cradle:number; cradleGrip:number; tool:[number,number,number]; plug:[number,number,number]; jaw:number;
  seated:Check; pull:Check; contacts:Check[]; accepted:boolean|null; force:number; pullForce:number;
  depth:number; tries:number; retry:number; message:string; rejected:boolean; camera:boolean;
}
export function processFrame(value:number,kind:CycleCase='search'):ProcessFrame {
  const p=Math.max(0,Math.min(100,value));
  const step=Math.max(0,CYCLE_STEPS.filter(s=>p>=s[1]).length-1);
  const f:ProcessFrame={progress:p,step,rotation:p<34?Math.PI:p<36?Math.PI*(1-smooth((p-34)/2)):0,cradle:p<34?Math.PI:p<36?Math.PI*(1-smooth((p-34)/2)):0,cradleGrip:p<31.8?1:p<32?1-smooth((p-31.8)/.2):p<38?0:smooth((p-38)/.2),tool:[...HOME],plug:[...NEST],jaw:1,seated:'pending',pull:'pending',contacts:Array(6).fill('pending'),accepted:null,force:0,pullForce:0,depth:0,tries:1,retry:0,message:CYCLE_STEPS[step][2],rejected:false,camera:p>=10&&p<20};
  const pickup=[NEST[0],NEST[1],NEST[2]-4.3], cradleUp=[TURNOVER[0],TURNOVER[1],TURNOVER[2]-4.3];
  if(p<10)f.tool=[...HOME];
  else if(p<20)f.tool=mix(HOME,[-32.8,-4.35,95],(p-10)/8);
  else if(p<25)f.tool=mix([-32.8,-4.35,95],pickup,(p-20)/5);
  else if(p<28){f.tool=[...pickup] as [number,number,number];f.jaw=1-smooth((p-25)/3);}
  else if(p<30){f.tool=mix(pickup,[NEST[0],NEST[1],85.7],(p-28)/2);f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];}
  else if(p<32){f.tool=mix([NEST[0],NEST[1],85.7],cradleUp,(p-30)/2);f.jaw=0;f.plug=[f.tool[0],f.tool[1],f.tool[2]+4.3];}
  else if(p<33){f.tool=[...cradleUp] as [number,number,number];f.plug=[...TURNOVER];f.jaw=smooth(p-32);}
  else if(p<34){f.tool=mix(cradleUp,[TURNOVER[0],TURNOVER[1],100],p-33);f.plug=[...TURNOVER];}
  else if(p<36){f.tool=[TURNOVER[0],TURNOVER[1],100];f.plug=[...TURNOVER];}
  else if(p<37){f.tool=mix([TURNOVER[0],TURNOVER[1],100],TURNOVER,p-36);f.plug=[...TURNOVER];}
  else if(p<38){f.tool=[...TURNOVER];f.plug=[...TURNOVER];f.jaw=1-smooth(p-37);}
  else if(p<39){f.tool=mix(TURNOVER,[TURNOVER[0],TURNOVER[1],90],(p-38.2)/.8);f.jaw=0;f.plug=[...f.tool];}
  else if(p<40){f.tool=mix([TURNOVER[0],TURNOVER[1],90],[0,0,65],p-39);f.jaw=0;f.plug=[...f.tool];}
  else if(p<50){f.tool=mix([0,0,65],[kind==='latched'?1.2:0,kind==='latched'?.65:0,29],(p-40)/10);f.jaw=0;f.plug=[...f.tool];}
  else {
    f.jaw=0;
    const seatedZ=15.1;
    if(p<60){f.tool=[kind==='latched'?1.2:0,kind==='latched'?.65:0,29-(kind==='latched'?29-seatedZ:3.2)*smooth((p-50)/7)];f.force=kind==='latched'?seatForce(p-50):Math.min(4.4,Math.max(0,p-54)*1.1);}
    else if(p<72&&kind!=='latched'){
      const t=(p-60)/4,k=Math.min(2,Math.floor(t)),u=t-k;
      const locations=[[0,0],[.7,0],[.7,.7],[1.2,.65]],a=locations[k],b=locations[k+1];
      f.tool=u<.3?mix([a[0],a[1],25.8],[a[0],a[1],30],u/.3):u<.62?mix([a[0],a[1],30],[b[0],b[1],30],(u-.3)/.32):mix([b[0],b[1],30],[b[0],b[1],k===2?seatedZ:25.8],(u-.62)/.38);
      f.tries=k+2;f.force=u>.9?(k===2?seatForce((u-.62)/.38*8):3.6):0;
    } else {f.tool=[1.2,.65,seatedZ];f.tries=kind==='latched'?1:4;f.seated='pass';}
    if(kind==='latched'&&p>=60&&p<75)f.message='The saved fixture correction seats this connector on the first try. No XY search is needed.';
    if(p>=75&&p<85){f.pullForce=2.5*Math.sin(clamp((p-75)/8)*Math.PI*.5);if(kind==='half-seat')f.tool[2]+=1.8*smooth((p-76)/5);f.pull=p>=82?(kind==='half-seat'?'fail':'pass'):'pending';}
    if(p>=85){f.pull=kind==='half-seat'?'fail':'pass';for(let i=0;i<6;i++)if(p>=85+i*1.1)f.contacts[i]=kind==='open'&&i===2?'fail':'pass';}
    f.plug=[...f.tool];f.depth=Math.max(0,26-f.plug[2]);
    if(kind==='half-seat'&&p>=83){f.contacts.fill('pending');f.retry=1;f.message='Pull failed. Retry once from a fresh approach; a second failure rejects this unit.';retryAndReject(f,p,83,kind);}
    else if(kind==='open'&&p>=87.2){f.retry=1;f.message='Contact 3 failed. Retry once; a repeated electrical fault sends the unit to the reject bin.';f.contacts=['pass','pass','fail','pending','pending','pending'];retryAndReject(f,p,87.2,kind);}
    else if(p>=95){f.pull='pass';f.seated='pass';f.contacts.fill('pass');f.accepted=true;f.plug=[1.2,.65,seatedZ];f.jaw=smooth((p-95)/1.5);f.tool=[1.2,.65,seatedZ+62*smooth((p-96.5)/3.5)];f.force=0;f.pullForce=0;}
  }
  f.depth=Math.hypot(f.plug[0]-1.2,f.plug[1]-.65)<3?Math.max(0,26-f.plug[2]):0;
  return f;
}
function seatForce(p:number){return p<4?Math.max(0,p)*.85:p<5.3?3.4-(p-4)*1.8:Math.min(2,1.06+(p-5.3)*.45);}
function retryAndReject(f:ProcessFrame,p:number,start:number,kind:CycleCase){
  const u=(p-start)/(100-start);
  f.accepted=null;
  f.tool=u<.18?mix([1.2,.65,kind==='half-seat'?16.9:15.1],[1.2,.65,33],u/.18):u<.4?mix([1.2,.65,33],[1.2,.65,15.1],(u-.18)/.22):u<.55?[1.2,.65,15.1+(kind==='half-seat'?1.8*smooth((u-.4)/.15):0)]:u<.7?mix([1.2,.65,kind==='half-seat'?16.9:15.1],[1.2,.65,70],(u-.55)/.15):u<.85?mix([1.2,.65,70],[REJECT[0],REJECT[1],70],(u-.7)/.15):mix([REJECT[0],REJECT[1],70],[...REJECT],(u-.85)/.1);
  f.plug=[...f.tool];f.depth=Math.max(0,26-f.plug[2]);f.force=u<.4?1.7:0;f.pullForce=u>=.4&&u<.55?2.5:0;
  if(u>.55){f.accepted=false;f.message=kind==='half-seat'?'Second pull failed. Extract under a force limit; tag the unit and retain the trace.':'Contact 3 failed again. Extract under a force limit; tag the unit and retain the trace.';}
  if(u>.95){f.rejected=true;f.jaw=smooth((u-.95)/.05);f.plug=[...REJECT];f.tool=[REJECT[0],REJECT[1],REJECT[2]+15*smooth((u-.95)/.05)];}
}
