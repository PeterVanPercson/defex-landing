import type { Snapshot, Sample } from './engine.ts';

export class DemoRecorder {
  canvas=document.createElement('canvas');
  context:CanvasRenderingContext2D;
  recorder:MediaRecorder;
  chunks:BlobPart[]=[];
  frame=0;
  started=performance.now();
  title='Connector assembly, in simulation.';
  description='A computed insertion, test and reset experiment.';
  state:Snapshot|null=null;
  speed=2;
  samples:Sample[]=[];
  source:HTMLCanvasElement;
  onFinish:(blob:Blob,extension:string)=>void;
  stream:MediaStream;

  constructor(source:HTMLCanvasElement,onFinish:(blob:Blob,extension:string)=>void){
    this.source=source;this.onFinish=onFinish;this.canvas.width=1600;this.canvas.height=900;this.context=this.canvas.getContext('2d')!;
    this.stream=this.canvas.captureStream(30);
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mime)throw new Error('This browser cannot export a video.');
    this.recorder=new MediaRecorder(this.stream,{mimeType:mime,videoBitsPerSecond:5_000_000});
    this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};
    this.recorder.onstop=()=>{cancelAnimationFrame(this.frame);this.stream.getTracks().forEach(t=>t.stop());this.onFinish(new Blob(this.chunks,{type:mime}),mime.startsWith('video/mp4')?'mp4':'webm');};
    this.draw();this.recorder.start(500);
  }
  pause(){if(this.recorder.state==='recording')this.recorder.pause();}
  resume(){if(this.recorder.state==='paused')this.recorder.resume();}
  stop(){if(this.recorder.state!=='inactive')this.recorder.stop();}
  draw=()=>{
    const c=this.context,s=this.state;
    c.fillStyle='#f3f1eb';c.fillRect(0,0,1600,900);
    c.fillStyle='#252b28';c.font='bold 38px Arial';c.fillText('defex',44,53);c.fillStyle='#db582e';c.beginPath();c.arc(151,32,4,0,Math.PI*2);c.fill();
    c.font='13px monospace';c.fillStyle='#75806a';c.fillText('INTERACTIVE SOFTWARE PROTOTYPE',1080,45);
    c.strokeStyle='#d2d6c8';c.beginPath();c.moveTo(44,76);c.lineTo(1556,76);c.stroke();
    c.fillStyle='#252b28';c.font='35px Georgia';c.fillText(this.title,44,130);
    c.fillStyle='#737c6b';c.font='16px Arial';c.fillText(this.description,44,164);
    c.fillStyle='#e8e6df';c.fillRect(44,194,1035,585);
    const ratio=Math.min(1035/this.source.width,585/this.source.height),w=this.source.width*ratio,h=this.source.height*ratio;
    c.drawImage(this.source,44+(1035-w)/2,194+(585-h)/2,w,h);
    c.fillStyle='#f4f3eb';c.fillRect(64,214,131,29);c.fillStyle='#65735b';c.font='11px monospace';c.fillText(`SIMULATION · ${this.speed}×`,75,233);
    const x=1130;
    c.fillStyle='#75806a';c.font='12px monospace';c.fillText('CURRENT ATTEMPT',x,221);
    const controllers={fixed:'Fixed path',search:'Contact search',reuse:'Reused correction'};
    c.fillStyle='#252b28';c.font='26px Georgia';c.fillText(s?controllers[s.controller]:'Preparing',x,263);
    const values=[['SEARCH PROBES',String(s?.probes??0)],['SIMULATION TIME',`${(s?.time??0).toFixed(1)} s`],['AXIAL FORCE',`${(s?.force??0).toFixed(2)} N`],['ELECTRICAL CHECK',s?.continuity===true?'PASS':s?.continuity===false?'FAIL':'NOT TESTED'],['RETENTION CHECK',s?.retention===true?'PASS':s?.retention===false?'FAIL':'NOT TESTED']];
    values.forEach(([name,value],i)=>{const y=315+i*66;c.strokeStyle='#d3d8c9';c.beginPath();c.moveTo(x,y+36);c.lineTo(1547,y+36);c.stroke();c.font='11px monospace';c.fillStyle='#89937c';c.fillText(name,x,y);c.font='19px monospace';c.fillStyle=value==='FAIL'?'#b34c30':value==='PASS'?'#397457':'#252b28';c.fillText(value,x,y+25);});
    c.font='22px Georgia';c.fillStyle=s?.accepted===true?'#397457':s?.accepted===false?'#b34c30':'#69745d';c.fillText(s?.accepted===true?'Accepted in simulation':s?.accepted===false?'Rejected in simulation':'Attempt in progress',x,691);
    c.font='13px Arial';c.fillStyle='#79836e';c.fillText(s?.reason??'',x,718);
    c.font='12px monospace';c.fillStyle='#8a917e';c.fillText('ILLUSTRATIVE GEOMETRY / MODELED TESTS',44,817);
    c.font='15px Arial';c.fillStyle='#6c765f';c.fillText('Rigid-body contact. Ideal electrical and latch models. Deterministic search, not a trained robot policy.',44,849);
    c.fillText('No physical robot or factory performance is demonstrated here.',44,875);
    this.frame=requestAnimationFrame(this.draw);
  };
}
