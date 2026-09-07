import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const HAS_DOM=typeof window!=='undefined'&&typeof document!=='undefined';
const HTMLElementBase=HAS_DOM?HTMLElement:class{};
const SCRIPT_BASE=HAS_DOM?(()=>{try{return new URL('.',document.currentScript?.src||document.baseURI).href;}catch{return './';}})():'';
const TAU=Math.PI*2;
const INITIAL_THETA=-13*Math.PI/180;
const BASE_FOV=22.89519252737121;
const BASE_ASPECT=16/9;
const ICONS={play:'<path d="m9 5 10 7-10 7Z"/>',pause:'<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',replay:'<path d="M4 10a8 8 0 1 1 1.8 7M4 4v6h6"/>'};
const svg=(kind)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[kind]}</svg>`;
const CSS=`
:host{display:block;position:relative;width:100%;aspect-ratio:var(--defex-aspect-ratio,16/9);min-height:160px;isolation:isolate;contain:layout style paint;color:#262829;font-family:Inter,Arial,sans-serif;border-radius:inherit;--stage:linear-gradient(180deg,#c3c2c0 0%,#c2c1bf 25%,#bdbcb8 50%,#c9c8c4 75%,#e5e4e2 100%)}
*{box-sizing:border-box}.stage{position:absolute;inset:0;overflow:hidden;background:var(--defex-background,var(--stage));border-radius:inherit;touch-action:pan-y pinch-zoom;outline:none;user-select:none;-webkit-user-select:none}.stage:focus-visible{outline:2px solid var(--defex-accent,#ff5e29);outline-offset:-4px}.stage[data-phase=interactive]{cursor:grab}.stage.dragging{cursor:grabbing}.canvas,.video,.poster{position:absolute;inset:0;width:100%;height:100%;display:block}.canvas{z-index:1}.video,.poster{object-fit:contain;pointer-events:none;background:var(--defex-background,var(--stage));transition:opacity .72s cubic-bezier(.22,.61,.36,1)}.video{z-index:2}.poster{z-index:3}.controls{position:absolute;z-index:5;right:clamp(12px,2.5vw,28px);bottom:clamp(12px,2.5vw,25px);display:flex;gap:8px;opacity:0;pointer-events:none;transition:opacity .35s}.controls.show{opacity:1;pointer-events:auto}.button{appearance:none;display:flex;align-items:center;justify-content:center;gap:7px;height:36px;padding:0 13px;border:1px solid rgba(40,42,43,.14);border-radius:999px;background:rgba(248,247,243,.72);color:#292d2f;font:500 11px/1 Inter,Arial,sans-serif;cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .15s,border-color .15s}.button:hover{background:#f7f6f2;border-color:rgba(40,42,43,.3)}.button:focus-visible{outline:2px solid var(--defex-accent,#ff5e29);outline-offset:3px}.button svg{width:14px;height:14px;flex:none}.hint{position:absolute;left:clamp(12px,2.5vw,28px);bottom:clamp(16px,2.5vw,34px);z-index:4;font:400 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.01em;color:#454947;opacity:0;pointer-events:none;transition:opacity .45s}.hint.show{opacity:.72}.status{position:absolute;z-index:6;left:50%;bottom:24px;transform:translateX(-50%);font:400 12px/1.4 Inter,Arial,sans-serif;color:#353a3b;text-align:center;max-width:85%;padding:8px 13px;border-radius:18px;background:rgba(249,248,243,.86)}.status:empty{display:none}.start{position:absolute;z-index:7;left:50%;top:50%;transform:translate(-50%,-50%);height:46px;padding:0 19px;font-size:13px;background:rgba(252,251,248,.94)}.start[hidden]{display:none}:host([controls=false]) .controls,:host([controls=false]) .hint{display:none}:host([controls=false]) .canvas,:host([controls=false]) .video,:host([controls=false]) .poster{height:100%;bottom:0}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.canvas{background:var(--defex-background,var(--stage))}
@container(max-width:520px){.canvas,.video,.poster{height:calc(100% - 44px);bottom:44px}.button{height:33px;padding:0 11px}.hint{display:none}.controls{gap:7px;bottom:5px;right:50%;transform:translateX(50%)}.button .label{font-size:10px}}
@media(prefers-reduced-motion:reduce){.video,.poster,.controls,.hint{transition:none}}
`;

export class DefexRobot extends HTMLElementBase{
  static observedAttributes=['auto-rotate','rotation-duration','quality'];
  constructor(){
    super();if(!HAS_DOM)return;
    this.attachShadow({mode:'open'});this._generation=0;this._phase='idle';this._theta=INITIAL_THETA;this._targetTheta=INITIAL_THETA;
  }
  connectedCallback(){if(!this._connected){this._connected=true;this._boot();}}
  disconnectedCallback(){this._connected=false;this._cleanup();}
  attributeChangedCallback(name,oldValue,newValue){
    if(oldValue===newValue||!this._connected)return;
    if(name==='auto-rotate')this.setAutoRotate(newValue!=='false');
    if(name==='quality')this._resize?.();
  }
  _phaseTo(phase){this._phase=phase;if(this._stage)this._stage.dataset.phase=phase;this.dispatchEvent(new CustomEvent('defex-statechange',{detail:{phase},bubbles:true,composed:true}));}
  _asset(attribute,key,fallback){return this.getAttribute(attribute)||window.DefexRobotAssets?.[key]||new URL(`assets/${fallback}`,SCRIPT_BASE).href;}
  async _boot(){
    this.style.containerType='inline-size';
    const generation=++this._generation;this._controller=new AbortController();const signal=this._controller.signal;
    this.ready=new Promise(resolve=>{this._resolveReady=resolve;});
    this._modelReady=false;this._modelFailed=false;this._contextLost=false;this._introError=false;this._resumeVideo=false;this._introFinished=false;this._introStarted=false;this._visible=true;this._documentHidden=document.hidden;this._hovering=false;this._dragging=false;
    this._theta=INITIAL_THETA;this._targetTheta=INITIAL_THETA;this._resumeAt=0;this._lastTime=0;this._dirty=true;this._timers=[];
    this._scrollDriven=this.hasAttribute('scroll-driven');this._scrollEngaged=false;this._scrollProgress=0;
    this._motion=window.matchMedia('(prefers-reduced-motion: reduce)');this._reduced=this._motion.matches;
    this._userPaused=this.getAttribute('auto-rotate')==='false'||this._reduced;
    this.shadowRoot.innerHTML=`<style>${CSS}</style><div class="stage" data-phase="loading" tabindex="0" role="group" aria-label="Interactive Defex robot. Drag or use the left and right arrow keys to rotate."><div class="canvas" part="canvas"></div><video class="video" part="video" muted playsinline preload="auto" disablepictureinpicture aria-hidden="true"></video><img class="poster" alt="" aria-hidden="true"><p class="hint" part="hint">Move to explore · 360°</p><div class="controls" part="controls"><button class="button replay" type="button" aria-label="Replay the complete introduction">${svg('replay')}<span class="label">Replay</span></button><button class="button rotation" type="button" aria-pressed="false">${svg('pause')}<span class="label">Pause</span></button></div><div class="status" role="status" aria-live="polite"></div><button class="button start" type="button" hidden>${svg('play')}<span>Play introduction</span></button></div>`;
    const $=s=>this.shadowRoot.querySelector(s);
    this._stage=$('.stage');this._canvasHost=$('.canvas');this._video=$('video');this._poster=$('.poster');this._controls=$('.controls');this._hint=$('.hint');this._status=$('.status');this._start=$('.start');this._rotationButton=$('.rotation');
    this._poster.src=this._asset('poster-src','poster','defex-poster.jpg');this._video.poster=this._poster.src;
    this._video.muted=true;this._video.defaultMuted=true;this._video.playsInline=true;this._video.src=this._asset('video-src','video','defex-intro.mp4');
    this._phaseTo('loading');this._status.textContent='';this._bind(signal);
    this._video.addEventListener('canplay',()=>this._maybeStart(),{signal});
    this._video.addEventListener('loadedmetadata',()=>{if(this._scrollEngaged)this.setScrollProgress(this._scrollProgress);},{signal});
    this._video.addEventListener('seeked',()=>{if(this._scrollEngaged&&this._phase==='scroll')this._seekScrollFrame();},{signal});
    this._video.addEventListener('timeupdate',()=>{
      if(this._scrollDriven&&!this._scrollEngaged&&!this._reduced&&this._video.currentTime>=1.65){this._video.pause();this._phaseTo('scroll');}
    },{signal});
    this._video.addEventListener('playing',()=>{this._poster.style.opacity='0';this._start.hidden=true;this._status.textContent='';},{signal});
    this._video.addEventListener('ended',()=>{this._introFinished=true;this._phaseTo('waiting');if(this._modelReady)this._handoff();else if(this._modelFailed)this._fallbackControls();else this._status.textContent='Preparing the 3D view…';},{signal});
    this._video.addEventListener('error',()=>{this._introFinished=true;this._introError=true;if(this._modelReady)this._handoff();else this._status.textContent='Preparing the 3D view…';},{signal});
    this._start.addEventListener('click',()=>this.replay(),{signal});$('.replay').addEventListener('click',()=>this.replay(),{signal});
    this._rotationButton.addEventListener('click',()=>this.setAutoRotate(this._userPaused),{signal});
    this._io=new IntersectionObserver(entries=>{this._visible=entries[0]?.isIntersecting??true;this._syncVisibility();},{threshold:.02});this._io.observe(this);
    this._ro=new ResizeObserver(()=>this._resize());this._ro.observe(this);
    document.addEventListener('visibilitychange',()=>{this._documentHidden=document.hidden;this._syncVisibility();},{signal});
    this._motion.addEventListener('change',e=>{this._reduced=e.matches;if(e.matches){this.setAutoRotate(false);if(!this._introFinished){this._video.pause();this._introFinished=true;if(this._modelReady)this._handoff();}}},{signal});
    this._updateControls();this._maybeStart();
    this._raf=requestAnimationFrame(t=>this._tick(t));
    try{
      await this._load3D(signal);
      if(generation!==this._generation||!this._connected)return;
      this._modelReady=true;this._resolveReady({interactive:true});this.dispatchEvent(new CustomEvent('defex-ready',{detail:{interactive:true},bubbles:true,composed:true}));
      if(this._reduced||this.getAttribute('intro')==='false')this._introFinished=true;
      if(this._introFinished)this._handoff();else if(this._scrollEngaged)this.setScrollProgress(this._scrollProgress);else this._maybeStart();
    }catch(error){
      if(signal.aborted)return;
      this._modelFailed=true;this._resolveReady({interactive:false,error:String(error.message||error)});
      this.dispatchEvent(new CustomEvent('defex-error',{detail:{code:'WEBGL_OR_MODEL_UNAVAILABLE',message:String(error.message||error)},bubbles:true,composed:true}));
      if(this._introFinished)this._fallbackControls();else this._maybeStart();
    }
  }
  async _load3D(signal){
    const bufferPromise=fetch(this._asset('model-src','model','defex-robot.glb'),{signal}).then(r=>{if(!r.ok)throw new Error(`Model request failed (${r.status})`);return r.arrayBuffer();});
    bufferPromise.catch(()=>{});
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',precision:'highp',stencil:false});
    this._renderer=renderer;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.35;
    renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    renderer.transmissionResolutionScale=1;
    renderer.domElement.setAttribute('aria-hidden','true');this._canvasHost.append(renderer.domElement);
    this._scene=new THREE.Scene();this._camera=new THREE.PerspectiveCamera(BASE_FOV,BASE_ASPECT,.04,120);
    this._camera.position.set(-1.6196476221,3.1300001144,7.0154643059);this._target=new THREE.Vector3(0,2.42,0);this._camera.lookAt(this._target);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();this._environment=pmrem.fromScene(room,.04).texture;this._scene.environment=this._environment;room.dispose();pmrem.dispose();
    this._scene.add(new THREE.HemisphereLight(0xf4f8ff,0xa5a19b,.65));
    const addLight=(color,intensity,position)=>{const l=new THREE.DirectionalLight(color,intensity);l.position.set(...position);l.target.position.set(0,2.2,0);this._scene.add(l,l.target);return l;};
    const key=addLight(0xfff6ec,3.1,[-3.8,6.8,4.1]);addLight(0xe9f2ff,1.5,[4,4.1,1.8]);addLight(0xffffff,2.6,[.4,5.8,-2.7]);
    key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.camera.near=.1;key.shadow.camera.far=18;key.shadow.normalBias=.012;key.shadow.bias=-.00008;key.shadow.radius=3;
    const data=await bufferPromise;if(signal.aborted)return;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf=await loader.parseAsync(data,'');if(signal.aborted){this._disposeModel(gltf.scene);return;}
    this._model=gltf.scene;
    this._model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.envMapIntensity=1.2;m.dithering=true;if(m.name.startsWith('Warm ceramic'))m.roughness=.27;if(m.name.startsWith('Secondary satin'))m.roughness=.31;}}});
    this._scene.add(this._model);this._resize();renderer.shadowMap.needsUpdate=true;
    renderer.compile(this._scene,this._camera);
    if(signal.aborted)return;renderer.render(this._scene,this._camera);this._dirty=false;
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this._contextLost=true;this._poster.style.opacity='1';this._status.textContent='3D is paused. Scroll to continue the film.';this._fallbackControls();},{signal});
    renderer.domElement.addEventListener('webglcontextrestored',()=>{this._contextLost=false;renderer.shadowMap.needsUpdate=true;this._dirty=true;this._poster.style.opacity='0';this._status.textContent='';this._phaseTo('interactive');},{signal});
  }
  _resize(){
    if(!this._renderer||!this._camera)return;
    const r=this._canvasHost.getBoundingClientRect();const w=Math.max(1,Math.round(r.width));const h=Math.max(1,Math.round(r.height));
    const high=this.getAttribute('quality')!=='balanced';const cap=high?4_200_000:2_600_000;
    const requested=Math.min(Math.max(window.devicePixelRatio||1,high?1.5:1.15),high?2:1.5);
    const dpr=Math.max(.8,Math.min(requested,Math.sqrt(cap/(w*h))));
    this._renderer.setPixelRatio(dpr);this._renderer.setSize(w,h);const aspect=w/h;
    this._camera.aspect=aspect;this._camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV/2))*Math.max(1,BASE_ASPECT/aspect)));
    this._camera.updateProjectionMatrix();this._dirty=true;
  }
  _maybeStart(){
    if(!this._connected||this._introStarted||this._introFinished||!this._visible||this._documentHidden)return;
    if(this._reduced||this.getAttribute('intro')==='false'){this._introFinished=true;if(this._modelReady)this._handoff();return;}
    if(this._scrollEngaged){this.setScrollProgress(this._scrollProgress);return;}
    if(this._video.readyState<2)return;
    this._introStarted=true;this._phaseTo('intro');this._video.play().catch(()=>{this._start.hidden=false;this._status.textContent='';});
  }
  _handoff(){
    if(!this._modelReady||this._phase==='transition'||this._phase==='interactive')return;
    this._video.pause();this._theta=INITIAL_THETA;this._targetTheta=INITIAL_THETA;this._positionCamera();this._renderer.render(this._scene,this._camera);
    this._phaseTo('transition');this._status.textContent='';this._start.hidden=true;this._poster.style.opacity='0';this._video.style.opacity='0';
    const delay=this._reduced?0:760;
    this._timers.push(setTimeout(()=>{if(!this._connected||this._phase!=='transition')return;this._phaseTo('interactive');this._resumeAt=performance.now()+350;this._autoRampAt=this._resumeAt;this._controls.classList.add('show');this._hint.classList.add('show');this.dispatchEvent(new CustomEvent('defex-intro-complete',{bubbles:true,composed:true}));},delay));
  }
  _fallbackControls(){this._controls.classList.add('show');this._rotationButton.hidden=true;if(!this._contextLost)this._status.textContent='Drag rotation is unavailable in this browser. You can still scroll through the film.';}
  _syncVisibility(){
    if(!this._video)return;const hidden=!this._visible||this._documentHidden;
    if(hidden&&!this._video.paused){this._resumeVideo=true;this._video.pause();}
    if(!hidden){if(this._resumeVideo&&this._phase==='intro'){this._resumeVideo=false;this._video.play().catch(()=>{this._start.hidden=false;});}else this._maybeStart();this._dirty=true;}
  }
  _bind(signal){
    const usable=e=>this._phase==='interactive'&&!e.target.closest?.('button');
    this._stage.addEventListener('pointerenter',e=>{if(!usable(e)||e.pointerType!=='mouse'||this.getAttribute('hover')==='false')return;this._hovering=true;this._anchorX=e.clientX;this._anchorTheta=this._targetTheta;},{signal});
    this._stage.addEventListener('pointermove',e=>{
      if(!usable(e))return;
      const hover=e.pointerType==='mouse'&&this.getAttribute('hover')!=='false';
      if(!this._dragging&&!hover)return;
      if(hover&&!this._hovering){this._hovering=true;this._anchorX=e.clientX;this._anchorTheta=this._targetTheta;}
      const width=Math.max(1,this.getBoundingClientRect().width);
      this._targetTheta=this._anchorTheta-(e.clientX-this._anchorX)/width*TAU;
      this._resumeAt=performance.now()+1300;this._dirty=true;
      if(this._dragging&&e.cancelable)e.preventDefault();
    },{signal,passive:false});
    this._stage.addEventListener('pointerdown',e=>{if(!usable(e)||e.button>0)return;this._dragging=true;this._anchorX=e.clientX;this._anchorTheta=this._targetTheta;this._stage.classList.add('dragging');try{this._stage.setPointerCapture(e.pointerId);}catch{}},{signal});
    const end=e=>{this._dragging=false;this._stage.classList.remove('dragging');this._anchorX=e.clientX;this._anchorTheta=this._targetTheta;this._resumeAt=performance.now()+1200;this._autoRampAt=this._resumeAt;try{if(this._stage.hasPointerCapture(e.pointerId))this._stage.releasePointerCapture(e.pointerId);}catch{}};
    this._stage.addEventListener('pointerup',end,{signal});this._stage.addEventListener('pointercancel',end,{signal});
    this._stage.addEventListener('pointerleave',()=>{if(this._dragging)return;this._hovering=false;this._resumeAt=performance.now()+1100;this._autoRampAt=this._resumeAt;},{signal});
    this._stage.addEventListener('keydown',e=>{if(this._phase!=='interactive'||e.target.closest?.('button'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this._targetTheta+=(e.key==='ArrowLeft'?1:-1)*Math.PI/12;this._resumeAt=performance.now()+4000;this._autoRampAt=this._resumeAt;this._dirty=true;}if(e.key===' '&&this.getAttribute('controls')!=='false'){e.preventDefault();this.setAutoRotate(this._userPaused);}if(e.key.toLowerCase()==='r'&&!this._scrollDriven){e.preventDefault();this.replay();}},{signal});
  }
  _positionCamera(){if(!this._camera)return;this._camera.position.set(Math.sin(this._theta)*7.2,3.1300001144,Math.cos(this._theta)*7.2);this._camera.lookAt(this._target);}
  _tick(now){
    if(!this._connected)return;this._raf=requestAnimationFrame(t=>this._tick(t));
    const dt=Math.min(.05,this._lastTime?(now-this._lastTime)/1000:0);this._lastTime=now;
    if(!this._visible||this._documentHidden||this._contextLost||!this._modelReady)return;
    if(this._phase==='interactive'){
      if(!this._userPaused&&!this._hovering&&!this._dragging&&now>this._resumeAt){const duration=Math.max(20,Math.min(300,Number(this.getAttribute('rotation-duration'))||80));const ramp=Math.min(1,Math.max(0,(now-(this._autoRampAt||0))/1300));this._targetTheta+=TAU/duration*dt*ramp;}
      const previous=this._theta;this._theta+=(this._targetTheta-this._theta)*(1-Math.exp(-dt*8));
      if(Math.abs(this._theta-previous)>.000002){this._positionCamera();this._dirty=true;}
    }
    if(this._dirty&&(this._phase==='interactive'||this._phase==='transition')){this._renderer.render(this._scene,this._camera);this._dirty=false;}
  }
  _updateControls(){if(!this._rotationButton)return;this._rotationButton.setAttribute('aria-pressed',String(this._userPaused));this._rotationButton.setAttribute('aria-label',this._userPaused?'Start automatic rotation':'Pause automatic rotation');this._rotationButton.innerHTML=`${svg(this._userPaused?'play':'pause')}<span class="label">${this._userPaused?'Rotate':'Pause'}</span>`;}
  setScrollProgress(progress){
    if(!this._scrollDriven||this._reduced||!this._video)return;
    this._scrollProgress=THREE.MathUtils.clamp(Number(progress)||0,0,1);
    if(this._scrollProgress===0&&!this._scrollEngaged)return;
    this._scrollEngaged=true;this._introStarted=true;this._video.pause();this._start.hidden=true;
    if(this._video.readyState<1)return;
    if(this._scrollProgress>=.999&&this._modelReady&&!this._contextLost){this._introFinished=true;this._handoff();return;}
    if(this._phase!=='scroll'){
      this._timers.forEach(clearTimeout);this._timers=[];this._phaseTo('scroll');
      this._introFinished=false;this._video.style.opacity='1';this._poster.style.opacity='0';
    }
    this._seekScrollFrame();
  }
  _seekScrollFrame(){
    if(this._video.seeking||!Number.isFinite(this._video.duration))return;
    const time=Math.min(this._video.duration-.04,1.65+this._scrollProgress*3.30);
    if(Math.abs(this._video.currentTime-time)>.025)this._video.currentTime=time;
  }
  setAutoRotate(enabled){this._userPaused=!enabled;this._resumeAt=performance.now()+150;this._autoRampAt=this._resumeAt;this._updateControls();}
  rotateTo(degrees,{immediate=false}={}){this._targetTheta=INITIAL_THETA+Number(degrees)*Math.PI/180;this._resumeAt=performance.now()+4000;this._autoRampAt=this._resumeAt;if(immediate){this._theta=this._targetTheta;this._positionCamera();}this._dirty=true;}
  replay(){
    if(!this._video)return;this._timers.forEach(clearTimeout);this._timers=[];this._introFinished=false;this._introStarted=true;this._phaseTo('intro');this._controls.classList.remove('show');this._hint.classList.remove('show');this._hovering=false;this._dragging=false;this._status.textContent='';this._video.style.opacity='1';this._poster.style.opacity='1';this._start.hidden=true;
    this._theta=INITIAL_THETA;this._targetTheta=INITIAL_THETA;this._positionCamera();this._dirty=true;this._video.currentTime=0;this._video.play().catch(()=>{this._start.hidden=false;});
  }
  pause(){if(this._phase==='intro')this._video.pause();else this.setAutoRotate(false);}
  resume(){if(this._phase==='intro')this._video.play().catch(()=>{this._start.hidden=false;});else this.setAutoRotate(true);}
  getState(){return{phase:this._phase,ready:!!this._modelReady,autoRotate:!this._userPaused,hovering:!!this._hovering,rotationDegrees:(this._theta-INITIAL_THETA)*180/Math.PI,videoTime:this._video?.currentTime||0,reducedMotion:!!this._reduced,visible:!!this._visible,pixelRatio:this._renderer?.getPixelRatio()||0,drawCalls:this._renderer?.info.render.calls||0};}
  _disposeModel(root){if(!root)return;const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});for(const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());}
  _cleanup(){
    ++this._generation;this._controller?.abort();cancelAnimationFrame(this._raf);this._timers?.forEach(clearTimeout);this._io?.disconnect();this._ro?.disconnect();
    if(this._video){this._video.pause();this._video.removeAttribute('src');this._video.load();}
    this._disposeModel(this._model);this._environment?.dispose();if(this._renderer){this._renderer.dispose();this._renderer.forceContextLoss();}
    this._renderer=null;this._model=null;this._scene=null;this._modelReady=false;this._resolveReady?.({interactive:false,disconnected:true});
  }
}
export function registerDefexRobot(){if(HAS_DOM&&!customElements.get('defex-robot'))customElements.define('defex-robot',DefexRobot);}
registerDefexRobot();
