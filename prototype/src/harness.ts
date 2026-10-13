import * as T from 'three';

export const HARNESS_LENGTH = 460;
const Y=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1);

// Geometric cable dressing, not a cable dynamics model. A service loop takes up
// the slack so the visible wires do not stretch when the housing moves.
export function dressHarness(points:T.Vector3[],plug:T.Vector3,turn:number,yaw:number,contact:number[],index:number,pins=6){
  const lane=(index-(pins-1)/2)*.65,terminalX=-104+(index-(pins-1)/2)*3;
  points[0].set(contact[0],contact[1],8.3).applyAxisAngle(Y,turn).applyAxisAngle(Z,yaw).add(plug);
  points[1].set(contact[0],contact[1]+9,9).applyAxisAngle(Y,turn).applyAxisAngle(Z,yaw).add(plug);
  points[2].set(plug.x-16+lane,plug.y+24,Math.max(25,plug.z+17));
  points[3].set(-65+lane,46,8);
  points[6].set(-131+lane,21,8);
  points[7].set(terminalX,38,10.5);points[8].set(terminalX,60,11.5);points[9].set(terminalX,78,17);
  const curve=new T.CatmullRomCurve3(points,false,'centripetal');
  const shape=(slack:number)=>{points[4].set(-95-slack+lane,58,6);points[5].set(-155-slack+lane,5,6);};
  let low=0,high=120;
  for(let j=0;j<10;j++){
    const mid=(low+high)/2;shape(mid);
    if(curveLength(curve)<HARNESS_LENGTH)low=mid;else high=mid;
  }
  shape((low+high)/2);
}

export function curveLength(curve:T.CatmullRomCurve3,samples=128){
  const a=new T.Vector3(),b=new T.Vector3();curve.getPoint(0,a);let length=0;
  for(let j=1;j<=samples;j++){curve.getPoint(j/samples,b);length+=a.distanceTo(b);a.copy(b);}
  return length;
}
