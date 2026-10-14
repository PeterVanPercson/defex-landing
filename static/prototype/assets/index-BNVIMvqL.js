var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n={fixed:`No search`,search:`Search`},r={variant:`six`,offsetX:.95,offsetY:.55,yaw:0,friction:.35,fault:`none`},i=5e-4,a=.0151,o=.004;function s(e){return e===`six`?{halfX:.0075,halfY:.0036,socketX:.0079,socketY:.004,pins:6}:{halfX:.0095,halfY:.0036,socketX:.0099,socketY:.004,pins:8}}function c(e){let t=(e,t,n)=>Math.min(n,Math.max(t,Number.isFinite(e)?e:0));return{variant:e.variant===`eight`?`eight`:`six`,offsetX:t(e.offsetX,-2,2),offsetY:t(e.offsetY,-2,2),yaw:t(e.yaw,-5,5),friction:t(e.friction,.1,.8),fault:e.fault===`open`||e.fault===`latch`?e.fault:`none`}}function l(e){let t=c(e),n=s(t.variant);return`<mujoco model="Defex illustrative connector">
  <compiler angle="radian"/>
  <option timestep="${i}" gravity="0 0 0" integrator="implicitfast" cone="elliptic" iterations="60" tolerance="1e-10"/>
  <default>
    <geom friction="${t.friction} 0.005 0.0001" condim="3" solref="0.004 1" solimp="0.98 0.99 0.001" margin="0.00001"/>
    <joint damping="0.2" armature="0.002"/>
  </default>
  <worldbody>
    <body name="socket" pos="${t.offsetX/1e3} ${t.offsetY/1e3} 0" euler="0 0 ${t.yaw*Math.PI/180}">
      <geom name="wall_left" type="box" pos="${-n.socketX-.002} 0 0.016" size="0.002 ${n.socketY+.004} 0.006"/>
      <geom name="wall_right" type="box" pos="${n.socketX+.002} 0 0.016" size="0.002 ${n.socketY+.004} 0.006"/>
      <geom name="wall_front" type="box" pos="0 ${-n.socketY-.002} 0.016" size="${n.socketX} 0.002 0.006"/>
      <geom name="wall_back" type="box" pos="0 ${n.socketY+.002} 0.016" size="${n.socketX} 0.002 0.006"/>
      <geom name="seat" type="box" pos="0 0 0.009" size="${n.socketX+.004} ${n.socketY+.004} 0.002"/>
    </body>
    <body name="plug">
      <joint name="x" type="slide" axis="1 0 0"/>
      <joint name="y" type="slide" axis="0 1 0"/>
      <joint name="z" type="slide" axis="0 0 1"/>
      <joint name="yaw" type="hinge" axis="0 0 1" damping="0.0002" armature="0.000002"/>
      <geom name="plug_body" type="box" size="${n.halfX} ${n.halfY} ${o}" mass="0.08"/>
      <site name="tcp" pos="0 0 0"/>
    </body>
  </worldbody>
  <equality><joint name="ideal_latch" joint1="z" polycoef="${a} 0 0 0 0" active="false" solref="0.004 1"/></equality>
  <actuator>
    <position name="axis_x" joint="x" kp="1800" kv="18" forcerange="-10 10"/>
    <position name="axis_y" joint="y" kp="1800" kv="18" forcerange="-10 10"/>
    <position name="axis_z" joint="z" kp="5000" kv="25" forcerange="-12 12"/>
    <position name="axis_yaw" joint="yaw" kp="1" kv="0.02" forcerange="-0.03 0.03"/>
  </actuator>
</mujoco>`}function u(){let e=[[0,0]];for(let t of[7e-4,.0014,.0021,.0028])for(let n=0;n<12;n++)e.push([t*Math.cos(n*Math.PI/6),t*Math.sin(n*Math.PI/6)]);return e.slice(0,48)}var d=20.5,f=[224,113,8],p={unload:-292,work:-60,queue:172,load:404},m=1.5,h=.15,g=.5,_=.65,v={unit:1,passed:0,rejected:0,prev:`none`},y=.5,b=8.8,x=[[0,120],[2,240],[12,220],[23,390],[34,250],[43,250]];function S(e){let t=0;for(let n=0;n<x.length;n++){let[r,i]=x[n],a=n+1<x.length?x[n+1][0]:1/0;if(e<=r)break;t+=(Math.min(e,a)-r)*i/1e3}return t}var C={down:.05,clamp:.55,closed:.8,free:1,raised:2.25,lifted:3.35,carry:3.35,over:4.7,descend:5.2,placed:6.75,open:7.45,clear:7.9,home:8.65},w={out:.15,in:.95,across:1.2,down:2.05,done:2.3},T={down:2.3,low:3.2,away:3.3,gone:4.5,up:4.6,back:5.6},E={down:.7,low:2.1,in:2.2,under:3.9,up:4.4,top:6.6},D=t({BLOCKED:()=>ge,CAPTURE:()=>_,CARRY:()=>pe,CLEAR:()=>_e,CYCLE_END:()=>108,CYCLE_STEPS:()=>O,EXAMPLE_LIMITS:()=>re,FIRST_CONTACT:()=>ve,GRASP:()=>R,GRIP_CHECK_Z:()=>be,GRIP_RAISE:()=>m,HALF_SEATED:()=>he,HEADER:()=>I,HOME:()=>j,INDEX_START:()=>100,LATCH_PEAK:()=>28,NEST:()=>k,NOMINAL:()=>L,PLUG_CONTACT:()=>22,PLUG_SEATED:()=>fe,POST:()=>P,POST_SINK:()=>F,POST_SUNK:()=>rt,POST_SWING:()=>ee,POST_TOOL:()=>Qe,POST_Z:()=>238,REJECT:()=>M,REJECT_BIN:()=>N,SEARCH_POINTS:()=>ue,SEARCH_TRIES:()=>de,SEATED:()=>me,SEAT_TOOL:()=>ce,SLIDE:()=>ye,SLOW:()=>B,TURNOVER:()=>A,UPCAM:()=>ne,aim:()=>se,faultTag:()=>ft,feed:()=>ct,offHeader:()=>le,processFrame:()=>Ke,processRecord:()=>bt,recoveryStart:()=>Re,seatPoints:()=>ze,seenGrasp:()=>oe,seenHeader:()=>ae,turnoverClock:()=>Ue}),O=[[`Locate the unit`,0,`The unit is on its pallet, located on pins. The tester is docked.`,`Planned line`],[`Check the board`,2,`The wrist camera measures where this board’s header sits.`,`Planned vision`],[`Pick the housing`,12,`Come straight down over the nest and grip the housing by its side walls.`,`Planned handling`],[`Turn over and regrip`,23,`Set the housing in the cradle, turn it over and regrip it at the wire end.`,`Planned handling`],[`Check the grip`,34,`An upward camera measures where the plug sits in the fingers.`,`Planned vision`],[`Align`,43,`Move fast to just above the header, aimed by both measurements. Then slow down.`,`Simplified simulation`],[`Press`,50,`Press gently. The chamfer guides the last fraction of a millimetre.`,`Simplified simulation`],[`Pull check`,62,`Pull up gently. A plug that moves fails.`,`Ideal latch model`],[`Continuity`,72,`Test each wire for opens and shorts.`,`Injected fault illustration`],[`Release`,86,`Open the fingers and lift straight up. The plug stays seated.`,`Planned handling`],[`Next unit`,100,`The line moves this unit out and the next one in.`,`Planned line`]],k=[-100,-14,20.1],A=[-45,-95,38],j=[0,75,160],M=[-125,-90,9.5],N={x:-200,y:-85,lid:6,floor:-520,opening:[30,34]},P={hover:1.2,grip:1.85,closed:2.05,lifted:3.3,over:4.5,posting:4.75,posted:6.15,release:6.25,clear:6.45,sink:6.35,clamp:4.75,home:7.5},F={fast:260,ramp:.4,depth:280,slow:170,turn:.3,out:.8,z:N.floor+4.15},ee=[1.02,.44];function te(e,t,n){let[r,i]=ee,a=(r+i)/2,o=n-t-a,s=0;for(let n of[0,r/2,i/2,a])s+=.25*U((e-t-n)/o);return s}var ne=[-62,-48,10],I=[1.2,.65],re={press:60,pull:15,extraction:30},L=[I[0]-.14,I[1]+.11],R=[-.05,.3],z=[.15,.29],ie=[1.1*Math.cos(Math.PI*11/9),1.1*Math.sin(Math.PI*11/9)];function ae(e){return e===`search`?[I[0]+ie[0]-R[0]+z[0]-L[0],I[1]+ie[1]-R[1]+z[1]-L[1]]:[.08,-.16]}function oe(){return[...z]}function se(e){let t=ae(e);return[L[0]+t[0]-z[0],L[1]+t[1]-z[1]]}var ce=[I[0]-R[0],I[1]-R[1]],le=e=>Math.hypot(e[0]+R[0]-I[0],e[1]+R[1]-I[1]),ue=u().map(([e,t])=>[se(`search`)[0]+e*1e3,se(`search`)[1]+t*1e3]),de=ue.findIndex(e=>le(e)<=_)+1,fe=15.1,pe=4.3-m,me=fe+m,he=me+1.8,ge=21.8+m,_e=26+m,B=25+m,ve=22+m,ye=1.5,be=ne[2]+30+m,V=10,xe=3,H=5,Se=8,Ce=3,we=re.press,Te=45,Ee=50,De=57,Oe=58,ke=62,Ae=72,je=86,Me=e=>Math.max(0,Math.min(1,e)),U=e=>{let t=Me(e);return Me(t*t*t*(10+t*(-15+6*t)))},Ne=(e,t,n)=>e.map((e,r)=>e+(t[r]-e)*U(n)),Pe=(e,t)=>[e[0],e[1],t],Fe=(e,t,n)=>e<=0||e>=1?0:U(e/t)*(1-U((e-1+n)/n)),Ie=(e,t,n)=>e.map((e,r)=>e+(t[r]-e)*n),Le=e=>`${Math.hypot(e[0],e[1]).toFixed(2)} mm`;function Re(e){return e===`half-seat`?70:e===`open`?78:e===`short`?76:null}function ze(e){let t=e===`search`?60.4:De,n=Re(e);return n===null?[t]:[t,n+(100-n)*.32]}function Be(){return{seated:`pending`,pull:`pending`,contacts:[,,,,,,].fill(`pending`),contactFaults:[,,,,,,].fill(null)}}function Ve(e){return e===`half-seat`?`Half-seated: 1.8 mm short, and it moved under the pull`:e===`open`?`Contact 3 is open`:`Contacts 2 and 5 are shorted`}var He=[[30,23],[31.4,25.15],[31.8,26],[32,27],[32.3,27.3],[33,27.85],[34,29.1],[36,30.25],[36.8,31.27],[37,32.27],[38,32.77],[38.2,32.97],[39,34]];function Ue(e){if(e<23)return 29;if(e>=34)return 39;let t=He.findIndex(([,t])=>t>e),[n,r]=He[t-1],[i,a]=He[t];return n+(i-n)*(e-r)/(a-r)}var We=8,Ge=e=>`Unit ${String(e).padStart(3,`0`)}`;function Ke(e,t=`pass`,n=v,r=e){let i=Math.max(0,Math.min(108,e)),a=Math.min(i,100),o=Math.max(0,O.filter(e=>i>=e[1]).length-1),s=Ue(a),c=s<34?Math.PI:s<36?Math.PI*(1-U((s-34)/2)):0,l={...Be(),progress:i,step:o,title:O[o][0],scope:O[o][3],rotation:c,cradle:a<43?c:Math.PI*U((a-43)/4),cradleGrip:.5*(s<32?1:s<32.3?1-U((s-32)/.3):s<38?0:U((s-38)/.2)),tool:[...j],plug:[...k],jaw:1,accepted:null,force:0,pullForce:0,extractionForce:0,latch:0,depth:0,tries:1,retry:0,post:-1,message:O[o][2],rejected:!1,camera:o===1,priorFailure:null,headerCheck:0,graspCheck:0,detail:``,shift:0,dock:1,liveHarness:!0,unloadZ:0,unloadUnit:`none`,loadZ:-96,tote:0,pack:!1,swap:!1,shot:`work`,focus:[...k],unitLabel:Ge(n.unit),lineNote:``};o===0&&(l.message=`${l.unitLabel} is on its pallet, located on pins. The tester is docked.`);let u=[-34,-5,95],d=[k[0],k[1],k[2]-pe],f=[k[0],k[1],60],p=[k[0],k[1],85.7],h=[A[0]-40,A[1],85.7],g=[A[0],A[1],85.7],_=[A[0],A[1],A[2]-pe],y=[A[0],A[1],_[2]+We],b=[A[0],A[1],A[2]+m],x=[A[0],A[1],b[2]+We],S=[A[0],A[1],100],C=[A[0],A[1],90],w=[ne[0],ne[1],be],T=()=>{l.jaw=0,l.plug=[l.tool[0],l.tool[1],l.tool[2]+pe]};if(a<2)l.tool=[...j];else if(a<12)l.tool=Ne(j,u,(a-2)/4),l.headerCheck=Fe((a-6)/5.5,.19,.265),a>=8.3&&(l.detail=Le(ae(t)),l.message=`This header sits ${l.detail} from nominal. The arm will aim there.`,t===`search`&&(l.detail+=` · glare`,l.message=`Glare on the board: a low-confidence reading of ${Le(ae(t))}. The press will check it.`));else if(a<15.5)l.tool=Ne(u,f,(a-12)/3.5);else if(a<18)l.tool=Ne(f,d,(a-15.5)/2.5);else if(a<20.5)l.tool=[...d],l.jaw=1-U((a-18)/2.5);else if(a<23)l.tool=Ne(d,p,(a-20.5)/2.5),T(),l.message=`The housing is held by its side walls. Lift it straight up.`;else if(s<31.4)l.tool=qe(p,h,g,U((s-30)/1.4)),T();else if(s<31.8)l.tool=Ne(g,y,(s-31.4)/.4),T();else if(s<32)l.tool=Ne(y,_,(s-31.8)/.2),T();else if(s<32.3)l.tool=[..._],l.plug=[...A],l.jaw=0;else if(s<33)l.tool=[..._],l.plug=[...A],l.jaw=U((s-32.3)/.7);else if(s<34)l.tool=Ne(_,S,s-33),l.plug=[...A];else if(s<36)l.tool=[...S],l.plug=[...A];else if(s<36.8)l.tool=Ne(S,x,(s-36)/.8),l.plug=[...A];else if(s<37)l.tool=Ne(x,b,(s-36.8)/.2),l.plug=[...A];else if(s<38)l.tool=[...b],l.plug=[...A],l.jaw=1-U(s-37);else if(a<34)l.tool=Ne(b,C,(s-38.2)/.8),l.jaw=0,Je(l,U((s-38.1)/.1)),s>=38.2&&(l.message=`Regripped at the wire end. Lift it clear of the cradle.`);else if(a<Ee){if(l.jaw=0,a<43)l.tool=a<37.4?Ne(C,w,(a-34)/3.4):[...w],l.graspCheck=Fe((a-37.6)/5,.2,.28),a>=39.8&&(l.detail=Le(z),l.message=`The plug sits ${l.detail} off centre in the fingers. The aim allows for it.`);else{let e=se(t);l.tool=a<47?Ne(w,Pe(e,be),(a-43)/4):Ne(Pe(e,be),Pe(e,B),(a-47)/3)}Je(l)}else ut(l,a,t);let E=Re(t);return E!==null&&a>=E&&yt(l,a,E,t),l.depth=Math.hypot(l.plug[0]-I[0],l.plug[1]-I[1])<3&&l.plug[2]<22?22-l.plug[2]:0,Xe(l,i,t,n,Math.max(i,Math.min(100,r))),l}function qe(e,t,n,r){let i=1-r;return e.map((e,a)=>i*i*e+2*i*r*t[a]+r*r*n[a])}function Je(e,t=1){e.plug=[e.tool[0]+R[0]*t,e.tool[1]+R[1]*t,e.tool[2]-m]}var Ye=(e,t,n)=>U((e-t)/(n-t));function Xe(e,t,n,r,i){let a=Me((t-100)/8),o=t>100,s=Re(n)!==null,c=S(i),l=s&&o&&a<.5,u=s?Me((a-y)/(1-y)):a;e.shift=o?232*U((u-.12)/.76):0,e.dock=o?1-U(u/.1)+U((u-.9)/.1):1,e.harnessOut=0,e.liveHarness=!(s&&o&&!l),e.lineProgress=i,e.unloadUnit=r.prev===`pass`?`finished`:r.prev===`reject`?`board`:`none`,e.unloadZ=-96*Ye(c,T.down,T.low),e.loadZ=-96*(1-Ye(c,E.up,E.top));let d=r.passed-+(r.prev===`pass`),f=d>0&&d%4==0;e.pack=r.prev===`pass`,e.swap=e.pack&&f,e.tote=(e.swap||d===0?0:(d-1)%4+1)+(e.pack&&c>=C.open?1:0),e.swap&&c>=w.out&&c<w.done&&(e.lineNote=`Full tote out, empty tote in`),e.shot=r.unit===1&&t<2?`wide`:s&&(e.rejected&&!o||l)?`reject`:e.swap&&c>=w.out-.1&&c<C.open&&!o?`line`:`work`;let p=[I[0]-9,I[1]-1.6,64],m=[...e.plug];if(e.focus=Ie(m,p,U((t-2)/3)*(1-U((t-12)/1.5))),!o)return;e.step=O.length-1,e.title=O[e.step][0],e.scope=O[e.step][3],e.detail=``,e.depth=0,e.force=0,e.camera=!1;let h=Ge(r.unit+1).toLowerCase();if(l){ot(e,a/y*b),e.focus=[e.plug[0],e.plug[1],Math.max(N.lid,Math.min(e.plug[2],30))],e.title=`Post the reject`,e.scope=`Planned handling`,e.message=`The robot posts the rejected harness into the locked bin.`;return}s?(e.plug=it(b),e.jaw=1,e.tool=Ne(at,j,u)):e.plug=[m[0]-e.shift,m[1],m[2]],e.focus=Ie(s?it():e.plug,[k[0]+232-e.shift,k[1],k[2]],U(u/.35)),e.message=s?`Reject cleared. The board goes back for a new harness; ${h} moves in.`:`Passed. ${e.unitLabel} moves out to be packed; ${h} moves in.`,u>=.1&&(Object.assign(e,Be()),e.accepted=null,e.rejected=!1,e.retry=0,e.tries=1,e.priorFailure=null)}var Ze=[M[0]-R[0],M[1]-R[1],M[2]+m],Qe=[N.x-R[0],N.y-R[1],238],$e=N.lid-2-8.25+m,et=(()=>{let{fast:e,ramp:t,depth:n,slow:r,turn:i,out:a}=F,o=$e-m-F.z,s=e*t/2,c=(e+r)*i/2,l=r*a/2;return[[t,0,e],[(n-s)/e,e,e],[i,e,r],[(o-n-c-l)/r,r,r],[a,r,0]]})(),tt=et.reduce((e,[t])=>e+t,0),nt=e=>{let t=Math.max(0,e-P.sink),n=0;for(let[e,r,i]of et){let a=Math.min(t,e),o=a/e;if(n+=r*a+(i-r)*e*(o*o*o-o*o*o*o/2),t-=a,t<=0)break}return n},rt=P.sink+tt,it=(e=0)=>[Qe[0]+R[0],Qe[1]+R[1],$e-m-nt(e)],at=[Qe[0],Qe[1],$e+40];function ot(e,t){e.post=t,e.rejected=!1,e.accepted=!1;let n=[Ze[0],Ze[1],120],r=[Ze[0],Ze[1],210],i=[Qe[0],Qe[1],$e];e.jaw=1,e.plug=[...M],t<P.hover?e.tool=Ne(j,n,t/P.hover):t<P.grip?e.tool=Ne(n,Ze,(t-P.hover)/(P.grip-P.hover)):t<P.closed?(e.tool=[...Ze],e.jaw=1-U((t-P.grip)/(P.closed-P.grip))):t<P.release?(e.jaw=0,e.tool=t<P.lifted?Ne(Ze,r,(t-P.closed-.1)/(P.lifted-P.closed-.1)):t<P.over?Ie(r,Qe,te(t,P.lifted,P.over)):t<P.posting?[...Qe]:Ne(Qe,i,(t-P.posting)/(P.posted-P.posting)),Je(e)):(e.jaw=U((t-P.release)/(P.clear-P.release)),e.plug=it(t),e.tool=t<P.clear?[...i]:Ne(i,at,(t-P.clear)/(P.home-P.clear)))}function st(e,t,n,r,i,a){let o=ct(n,r,i),s=U((ve-o)/ye),c=gt(o,r);e.tool=[t[0]+(ce[0]-t[0])*s,t[1]+(ce[1]-t[1])*s,o],e.force=Math.max(a?_t(c):mt(c),ht(c)),!a&&c>=.82&&(e.detail=`latch ${28 .toFixed(0)} N`)}function ct(e,t,n){let r=ve+.3,i=.5,a=Math.min(e,r),o=e-a,s=Math.max(0,a-t-i),c=.5*o+s+1.5*i,l=.5*o/c,u=s/c,d=1.5*i/c;if(n<=0)return e;if(n<l){let t=n/l;return e-o*(3*t*t-2*t*t*t+.5*(t*t*t-t*t))}if(n<l+u)return a-(n-l)*c;if(n<1){let e=(n-l-u)/d;return t+i-i*(1.5*(e*e*e-2*e*e+e)+3*e*e-2*e*e*e)}return t}function lt(e,t,n){e.tool=Pe(t,n),e.force=Te*Me((ve-n)/(ve-ge))}function ut(e,t,n){let r=n===`half-seat`,i=r?he:me;if(e.jaw=0,t<ke)n===`search`?dt(e,t):t<De?st(e,se(n),B,i,(t-Ee)/7,r):(st(e,se(n),B,i,1,r),e.force*=1-U(t-De),r?(e.detail=`1.8 mm short`,e.message=`The press reached its limit 1.8 mm short, with no latch drop. The pull check decides.`):(e.seated=`pass`,e.message=`Seated in one press: full depth and the latch signature.`));else if(e.tool=Pe(ce,i),e.tries=n===`search`?de:1,e.seated=r?`pending`:`pass`,t<Ae)e.pullForce=re.pull*U((t-ke)/5)*(1-U((t-(r?68.5:70))/1.5)),r&&(e.tool[2]+=1.8*U((t-ke-1)/5)),t>=68&&(e.pull=r?`fail`:`pass`,r?(e.seated=`fail`,e.detail=ft(n),e.message=`The plug moved 1.8 mm under the pull: it never latched. Stop before the wire test.`):(e.detail=`held ${re.pull.toFixed(0)} N`,e.message=`It held under the pull. Now the wires.`));else{e.pull=`pass`,pt(e,t,n);let r=e.contacts.filter(e=>e!==`pending`).length;e.detail=e.contacts.includes(`fail`)?ft(n):r?`${e.contacts.filter(e=>e===`pass`).length}/6 wires`:``,t>=84&&e.contacts.every(e=>e===`pass`)&&(e.message=`All six wires pass: no opens, no shorts.`)}Je(e),t>=je&&Re(n)===null&&(e.pull=`pass`,e.seated=`pass`,e.contacts.fill(`pass`),e.accepted=!0,e.plug=[I[0],I[1],fe],e.force=0,e.pullForce=0,e.detail=``,e.jaw=U((t-je)/2),e.tool=t<92?Pe(ce,me+62*U((t-88)/4)):Ne(Pe(ce,me+62),j,(t-92)/8),e.message=t<92?`All three checks passed. Open the fingers and lift straight up; the plug stays seated.`:`Return home. The line moves this unit out.`)}function dt(e,t){let n=8/(de-1);if(t<Oe){let r=Math.floor((t-Ee)/n),i=(t-Ee)/n-r,a=ue[r],o=ue[r+1];if(e.tries=r+1,(r>0||i>=.5)&&(e.title=`Search`,e.detail=`point ${r+1} of ${de}`),i<.3){let t=r?_e:B;lt(e,a,t-(t-ve-.2)*U(i/.3)),r&&(e.message=`Search point ${r+1}: press gently.`)}else i<.5?(lt(e,a,ve+.2-(ve+.2-ge)*U((i-.3)/.2)),r&&(e.message=`Search point ${r+1}: press gently.`)):i<.62?(lt(e,a,ge),e.force*=1-U((i-.54)/.08),e.message=r?`Point ${r+1} is blocked too. Lift and move on.`:`Stopped on top of the header, short of depth. The plug is too far off for the chamfer.`):i<.8?(lt(e,a,ge+(_e-ge)*U((i-.62)/.18)),e.force=0,e.message=`Lift straight up, clear of the header, before moving.`):(e.tool=Ne(Pe(a,_e),Pe(o,_e),(i-.8)/.2),e.message=`Move to search point ${r+2}, above the header.`,e.detail=`point ${r+2} of ${de}`)}else{let n=(t-Oe)/4;e.tries=de,e.title=`Search`,e.detail=`point ${de} of ${de}`,st(e,ue[de-1],_e,me,n/.6,!1),e.message=`Search point ${de}: press gently.`,n>=.6&&(e.force*=1-U((n-.6)/.25),e.seated=`pass`,e.message=`Seated on point ${de}, with the latch signature. Searches are rare, so this unit is flagged in the log.`)}}function ft(e){return e===`open`?`wire 3 open`:e===`short`?`wires 2 and 5 short`:e===`half-seat`?`moved 1.8 mm`:``}function pt(e,t,n){for(let r=0;r<6&&!(t<73+r*2);r++){if(n===`open`&&r===2){e.contacts[r]=`fail`,e.contactFaults[r]=`open`;break}if(n===`short`&&r===1){e.contacts[1]=e.contacts[4]=`fail`,e.contactFaults[1]=`short to 5`,e.contactFaults[4]=`short to 2`;break}e.contacts[r]=`pass`}}function mt(e){return e<=0?0:e<.65?28*U(e/.65):e<.82?28-18*U((e-.65)/.17):V+xe*U((e-.82)/.18)}function ht(e){return e<=0?0:H*U(e/.11)}function gt(e,t){return Me((ve-e)/(ve-t))}function _t(e){return e<=0?0:we*U(e/.85)}function vt(e,t){return t*Math.sin(Math.PI*Me(e))}function yt(e,t,n,r){let i=(t-n)/(100-n),a=r===`half-seat`,o=a?he+1.8:me,s=a?he:me,c=a?Ce:Se,l=e=>Pe(ce,e);Object.assign(e,Be()),e.retry=1,e.accepted=null,e.force=0,e.pullForce=0,e.extractionForce=0,e.latch=0,e.priorFailure=Ve(r),e.jaw=0,e.tries=2,e.detail=``,e.scope=`One fresh attempt · illustrative signals`,i<.18?(e.step=5,e.title=`Lift out`,e.detail=`retry · ${ft(r)}`,e.tool=i<.03?l(o):i<.1?Ne(l(o),l(33),(i-.03)/.07):Ne(l(33),l(B),(i-.1)/.08),e.extractionForce=i<.06?vt((i-.03)/.03,c):0,a||(e.latch=i<.03?U(i/.03):i<.1?1:1-U((i-.1)/.02)),e.message=a?`${e.priorFailure}. Lift it out and try once more.`:`${e.priorFailure}. Hold the latch open, lift it out and try once more.`):i<.34?(e.step=6,e.title=`Press`,st(e,ce,B,s,(i-.18)/.14,a),e.force*=1-U((i-.32)/.02),i>=.32&&(a?e.detail=`1.8 mm short`:e.seated=`pass`),e.message=a?`Second attempt: the press again stops short, with no latch drop.`:`Second attempt: press again, with fresh depth and force checks.`):(e.tool=l(s),e.seated=a?`pending`:`pass`,e.step=7,e.title=`Pull check`,e.pullForce=i<.46?re.pull*U((i-.34)/.1)*(1-U((i-.445)/.015)):0,a&&(e.tool[2]+=1.8*U((i-.35)/.09)),i>=.44&&(e.pull=a?`fail`:`pass`,a&&(e.seated=`fail`),e.detail=a?ft(r):`held ${re.pull.toFixed(0)} N`),e.message=`Second attempt: pull again before the wire test.`,!a&&i>=.465&&(e.step=8,e.title=`Continuity`,pt(e,Ae+(i-.465)/.1*14,r),e.detail=e.contacts.filter(e=>e!==`pending`).length?`${e.contacts.filter(e=>e===`pass`).length}/6 wires`:``,e.message=`Second attempt: test the wires again.`),(e.pull===`fail`||e.contacts.includes(`fail`))&&(e.accepted=!1,e.title=`Failed twice`,e.detail=ft(r),e.message=`${Ve(r)} again. Reject the unit and keep both attempts in the log.`));let u=[M[0]-R[0],M[1]-R[1],M[2]+m];if(i>=.56&&(e.step=9,e.title=i<.81?`Reject`:`Rejected`,e.scope=`Planned handling · illustrative forces`,e.detail=ft(r),e.tool=i<.58?l(o):i<.66?Ne(l(o),l(70),(i-.58)/.08):i<.75?Ne(l(70),[u[0],u[1],70],(i-.66)/.09):i<.81?Ne([u[0],u[1],70],u,(i-.75)/.06):[...u],e.extractionForce=i<.61?vt((i-.58)/.03,c):0,e.pullForce=0,e.latch=a?0:i<.58?U((i-.56)/.02):i<.66?1:1-U((i-.66)/.02),i>=.58&&(e.message=a?`Lift it out and carry it to the reject tray.`:`Hold the latch open, lift it out and carry it to the reject tray.`)),Je(e),i>=.81){e.rejected=!0,e.jaw=U((i-.81)/.02),e.plug=[...M];let t=[u[0],u[1],u[2]+30];e.tool=i<.83?[...u]:i<.87?Ne(u,t,(i-.83)/.04):Ne(t,j,(i-.87)/.13),e.message=`The unit is in the reject tray with both attempts logged. The line stops until a person clears it.`}}function bt(e,t,n=new Date().toISOString()){let r=Ke(100,t),i=Re(t),a=(e,n)=>({number:n,seated:e.seated,pull:e.pull,contacts:e.contacts,contactFaults:e.contactFaults,result:e.accepted===!0?`accepted`:`failed`,reason:e.accepted===!0?null:Ve(t)}),o=i===null?[a(r,1)]:[a(Ke(i-.001,t),1),a(r,2)],s=e=>e.map(e=>Math.round(e*100)/100);return{id:e,recordedAt:n,source:`scripted illustration`,case:t,accepted:r.accepted===!0,limits:re,measured:{header:s(ae(t)),grip:s(z)},flag:t===`search`?`Search used: seated on point ${de}`:null,attempts:o,trace:Array.from({length:1001},(e,n)=>{let r=Ke(n/10,t);return{progress:r.progress,press:r.force,pull:r.pullForce,extraction:r.extractionForce,depth:r.depth,attempt:r.retry+1}})}}var xt=[120,240,220,390,250,250,200,180,150,160,400],St=500,Ct=11e3,wt=b*1e3/(y*8),Tt=xt[10]/(1-y),Et=e=>Re(e)!==null;function Dt(e,t){if(e>=100)return Et(t)?e<104?wt:Tt:xt[10];let n=Re(t);if(n!==null&&e>=n)return Ct/(100-n);let r=Math.max(0,O.filter(t=>e>=t[1]).length-1);return t===`search`&&r===6?St:xt[r]}var Ot=(e=`pass`,t=v)=>({progress:0,kind:e,line:t,held:!1,cleared:!1,logged:!1,operator:0}),kt=e=>Ke(e.progress,e.kind,e.line,Math.max(e.progress,e.operator??0));function At(e,t=kt(e)){return t.accepted===!0?`pass`:t.accepted===!1?`reject`:e.progress>=100?Et(e.kind)?`reject`:`pass`:null}function jt(e,t=kt(e)){let n=At(e,t);return{passed:e.line.passed+ +(n===`pass`),rejected:e.line.rejected+ +(n===`reject`)}}var Mt=e=>e.logged||At(e)!==null;function Nt(e,t){return Mt(e)?Ot(t??e.next??`pass`,Rt(e.line,e.kind)):{...e,kind:t??e.next??e.kind,next:void 0,progress:0,logged:!1,cleared:!1,held:!1,operator:Math.max(e.operator??0,Math.min(e.progress,100))}}var Pt=e=>[...e.tool,...e.plug,e.jaw,e.rotation,e.force,e.pullForce,e.detail,e.message,e.title,e.contacts.join(),e.seated,e.pull].map(e=>typeof e==`number`?e.toFixed(4):e).join(),Ft=new Map;function It(e,t){let n=e<t?`${e}|${t}`:`${t}|${e}`,r=Ft.get(n);if(r===void 0){r=1/0;for(let n=0;n<=2e3;n++){let i=n/20;if(Pt(Ke(i,e))!==Pt(Ke(i,t))){r=i;break}}Ft.set(n,r)}return r}function Lt(e,t){return e.progress>=100?!1:t===e.kind||e.progress<It(e.kind,t)-1e-9&&Pt(Ke(e.progress,e.kind,e.line))===Pt(Ke(e.progress,t,e.line))}function Rt(e,t){let n=!Et(t);return{unit:e.unit+1,passed:e.passed+ +!!n,rejected:e.rejected+ +!n,prev:n?`pass`:`reject`}}var zt=e=>Et(e.kind)&&!e.cleared?100:108;function Bt(e,t,n={}){let r={...e};for(;t>1e-9&&!r.held;){let e=r.progress<100?100:108,i=Dt(r.progress,r.kind),a=Math.min(t/i,.25,e-r.progress);if(r.progress+=a,t-=a*i,e-r.progress<1e-9&&(r.progress=e),r.progress>=100&&!r.logged&&(r.logged=!0,n.log?.(r)),r.progress>=100&&Et(r.kind)&&!r.cleared){r.progress=100,r.held=!0,n.hold?.(r);break}r.progress>=108&&(r.line=Rt(r.line,r.kind),r.kind=r.next??`pass`,r.next=void 0,r.progress=0,r.logged=!1,r.cleared=!1,r.operator=0,n.next?.(r))}return r}var Vt=e=>e.progress>=108;function Ht(e){return Et(e.kind)&&!e.cleared&&Mt(e)?{...e,progress:100,held:!0}:Nt(e)}function Ut(e,t){return Mt(e)?{...e,next:t}:t===e.kind?{...e,next:void 0}:Lt(e,t)?{...e,kind:t,next:void 0}:{...e,next:t}}function Wt(e,t){let n={...e,progress:Math.min(t,zt(e))};return Mt(n)?n:{...n,next:void 0}}var Gt=e=>e.next??e.kind,Kt={pass:`Pass`,search:`Needs a search`,"half-seat":`Half-seated`,open:`Open wire`,short:`Shorted wires`},qt=e=>e.next?`${Kt[e.next]} next`:``,Jt=e=>!!e.retry&&!e.rejected&&e.accepted!==!1&&e.step!==O.length-1;function Yt(e,t,n=()=>{}){let r=e=>document.getElementById(e),i=r(`cycle-scrub`),a=r(`cycle-play`),o=r(`cycle-reset`),s=r(`cycle-clear-fault`),c=r(`tour`),l=[...document.querySelectorAll(`[data-cycle-case]`)],u=[],d=new AbortController,f={signal:d.signal},p=Ot(),m=!1,h=!1,g=!0,_=0,v=0,y=``,b=``,x=!1,S=0,C=r(`process-steps`);C.innerHTML=O.map((e,t)=>`<button data-cycle-step="${t}" aria-current="false"><span>${String(t+1).padStart(2,`0`)}</span><strong>${e[0]}</strong></button>`).join(``);let w=e=>String(e).padStart(3,`0`),T=()=>{if(!g)return;let{progress:t,kind:n,held:u}=p,d=kt(p),f=zt(p);e.setProcess(d),document.body.dataset.shot=d.shot,i.max!==`108`&&(i.max=`108`),i.value=String(t),i.style.setProperty(`--p`,`${t/108*100}%`),i.style.setProperty(`--lock`,`${f/108*100}%`),i.dataset.locked=String(u),r(`cycle-percent`).textContent=`${Math.round(t/108*100)}%`,r(`cycle-title`).textContent=d.step===O.length-1?d.title:d.accepted===!0&&t>=95?`Passed`:d.rejected?`Rejected`:d.title,r(`cycle-index`).textContent=String(d.step+1).padStart(2,`0`);let m=document.getElementById(`cycle-retry`);m&&(m.hidden=!Jt(d));let _=document.getElementById(`cycle-detail`);_&&(_.textContent=d.detail,_.hidden=!d.detail);let v=document.getElementById(`line-status`),b=jt(p,d),x=qt(p);v&&(v.textContent=`${d.unitLabel} · ${b.passed} passed · ${b.rejected} rejected${d.lineNote?` · ${d.lineNote}`:``}${x?` · ${x}`:``}`),r(`cycle-copy`).textContent=d.message,r(`cycle-scope`).textContent=d.scope,r(`cycle-force`).textContent=`${d.force.toFixed(1)} / ${re.press.toFixed(0)} N`,r(`cycle-depth`).textContent=`${d.depth.toFixed(1)} mm`,r(`cycle-pull`).textContent=`${d.pullForce.toFixed(1)} / ${re.pull.toFixed(0)} N`,r(`cycle-extraction`).textContent=`${d.extractionForce.toFixed(1)} / ${re.extraction.toFixed(0)} N`,r(`cycle-extraction-row`).hidden=!d.retry,r(`cycle-tries`).textContent=d.retry?`Retry 1 / 1`:String(d.tries);for(let[e,t]of[[`seat-result`,d.seated],[`pull-result`,d.pull],[`wiring-result`,d.contacts.includes(`fail`)?`fail`:d.contacts.every(e=>e===`pass`)?`pass`:`pending`]])r(e).textContent=t===`pending`?`—`:t.toUpperCase(),r(e).dataset.result=t;let S=d.contacts.join()+d.contactFaults.join();y!==S&&(y=S,r(`contact-results`).innerHTML=d.contacts.map((e,t)=>`<span data-result="${e}" aria-label="Contact ${t+1}: ${d.contactFaults[t]??(e===`pending`?`untested`:`open and short checks passed`)}" title="${d.contactFaults[t]??(e===`pending`?`Untested`:`Open and short checks passed`)}"><small>${t+1}</small>${e===`pending`?`·`:e===`pass`?`✓`:`×`}</span>`).join(``)),r(`cycle-contact-note`).textContent=d.contactFaults.some(Boolean)?d.contactFaults.map((e,t)=>e?`${t+1}: ${e}`:``).filter(Boolean).join(` · `):`Per wire: continuity + isolation`;let w=d.pull===`fail`||d.contacts.includes(`fail`),T=d.step===O.length-1;r(`cycle-verdict`).textContent=T?Et(n)?`Reject cleared · the line moves on`:`The line moves the next unit in`:d.accepted===!0?n===`search`?`All three checks passed · flagged: search used`:`All three checks passed`:d.accepted===!1?`Rejected · line stopped until a person clears it`:d.step===O.length-1?`The line moves the next unit in`:d.retry?`Attempt 2 · fresh checks`:w?`Check failed · stop this attempt`:d.step===1||d.step===4?`Measuring this unit`:d.step<6?`Preparing the unit`:`Checks in progress`,r(`cycle-verdict`).dataset.result=T?`pending`:d.accepted===!0?`pass`:d.accepted===!1||w?`fail`:`pending`;for(let e of C.querySelectorAll(`button`))e.setAttribute(`aria-current`,String(Number(e.dataset.cycleStep)===d.step));a.textContent=h?`Pause`:`Play`,a.setAttribute(`aria-pressed`,String(h)),a.disabled=u,o.disabled=u,s.hidden=!u;for(let e of l)e.disabled=u;i.disabled=u;for(let e of C.querySelectorAll(`button`))e.disabled=u;c.dataset.playing=String(h),c.disabled=!1,c.setAttribute(`aria-disabled`,String(u)),c.setAttribute(`aria-label`,u?`Clear the reject first`:h?`Pause`:`Play`),c.setAttribute(`aria-pressed`,String(h)),r(`tour-label`).textContent=u?`Clear the reject first`:h?`Pause`:`Play`,r(`embed-run`).disabled=u,D(d)},E=e=>e*300/108;function D(e){b!==p.kind&&(b=p.kind,r(`cycle-trace`).setAttribute(`points`,Array.from({length:1081},(e,t)=>{let n=Ke(t/10,p.kind);return`${E(t/10).toFixed(2)},${k(n).toFixed(2)}`}).join(` `)),r(`cycle-seat-points`).innerHTML=ze(p.kind).map((e,t)=>`<g data-progress="${e}" transform="translate(${E(e).toFixed(2)} 0)"><line y1="4" y2="49" stroke="#426950" stroke-dasharray="2 2" opacity=".5"/><text x="-3" y="8" text-anchor="end" fill="#426950" font-size="8">seat ${t+1}</text></g>`).join(``)),r(`cycle-trace-window`).setAttribute(`width`,String(E(e.progress))),r(`cycle-cursor`).setAttribute(`x1`,String(E(e.progress))),r(`cycle-cursor`).setAttribute(`x2`,String(E(e.progress)));for(let t of r(`cycle-seat-points`).children)t.setAttribute(`visibility`,e.progress>=Number(t.dataset.progress)?`visible`:`hidden`)}function k(e){return 29-(e.force-e.pullForce-e.extractionForce)*.42}function A(){h=!1,cancelAnimationFrame(_),_=0,T()}function j(){g||(g=!0,document.body.classList.add(`process-mode`),t(),n()),document.body.classList.remove(`tour-active`)}function M(e=Gt(p)){for(let t of l)t.setAttribute(`aria-pressed`,String(t.dataset.cycleCase===e))}let N={log:e=>R(e),hold:()=>{h=!1},next:e=>M(e.kind)};function P(e){if(h){if(p=Bt(p,Math.min(80,e-v),N),v=e,p.held){A();return}T(),_=requestAnimationFrame(P)}}function F(){h=!0,v=performance.now(),T(),cancelAnimationFrame(_),_=requestAnimationFrame(P)}function ee(){s.classList.remove(`nudge`),s.offsetWidth,s.classList.add(`nudge`),c.classList.remove(`tip-off`),c.classList.add(`show-tip`),clearTimeout(S),S=window.setTimeout(()=>{s.classList.remove(`nudge`),c.classList.remove(`show-tip`)},1600)}function te(){if(j(),p.held){ee(),T();return}if(h){A();return}t(),(!x||Vt(p))&&(I(),p=Nt(p),M()),x=!0,F()}function ne(){if(p.held){j(),ee(),T();return}j(),A();let e=Ht(p);I(),p={...e,logged:e.held||e.logged},M(),T(),p.held&&ee()}function I(){Mt(p)&&!p.logged&&(p={...p,logged:!0},R(p))}function L(){document.querySelector(`.stage`)?.scrollIntoView({block:`start`,behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`})}function R(e){let t=bt(e.line.unit,e.kind);u.push(t);let n=document.createElement(`li`),i=document.createElement(`strong`);i.textContent=`Illustrated unit ${w(t.id)} · ${t.case} · ${t.accepted?`accepted`:`rejected / operator clear required`}${t.flag?` · flagged: ${t.flag.toLowerCase()}`:``}`,n.append(i);let a=document.createElement(`p`);a.textContent=`Measured: header ${Math.hypot(...t.measured.header).toFixed(2)} mm from nominal, grip ${Math.hypot(...t.measured.grip).toFixed(2)} mm off centre.`,n.append(a);for(let e of t.attempts){let t=document.createElement(`p`),r=e.contacts.map((t,n)=>`${n+1} ${e.contactFaults[n]??(t===`pending`?`untested`:t)}`).join(`, `);t.textContent=`Attempt ${e.number}: seat ${e.seated}, pull ${e.pull}; contacts ${r}. ${e.reason??`All three checks passed.`}`,n.append(t)}let o=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);o.setAttribute(`viewBox`,`0 0 300 52`),o.setAttribute(`class`,`record-trace`),o.setAttribute(`role`,`img`),o.setAttribute(`aria-label`,`Illustrated force trace for unit ${t.id}, including ${t.attempts.length} attempt${t.attempts.length>1?`s`:``}`);let s=document.createElementNS(`http://www.w3.org/2000/svg`,`polyline`);s.setAttribute(`points`,t.trace.map(e=>`${e.progress*3},${k({force:e.press,pullForce:e.pull,extractionForce:e.extraction}).toFixed(2)}`).join(` `)),s.setAttribute(`fill`,`none`),s.setAttribute(`stroke`,`currentColor`),s.setAttribute(`stroke-width`,`1.2`),o.append(s),n.append(o),r(`cycle-log`).prepend(n),r(`cycle-export`).disabled=!1,r(`cycle-log-status`).textContent=`${u.length} illustrated unit${u.length>1?`s`:``} recorded during this visit. Download to retain the checks and force traces.`}i.addEventListener(`input`,()=>{if(p.held)return;x=!0,j();let e=Number(i.value);A(),p=Wt(p,e),M(),T()},f),a.addEventListener(`click`,te,f),o.addEventListener(`click`,ne,f);let z=!1;s.addEventListener(`click`,()=>{if(!p.held||z)return;let t=e.tracksBuilt?.();if(t&&!e.tracksDone?.()){z=!0,s.setAttribute(`aria-busy`,`true`),t.then(()=>{z=!1,s.removeAttribute(`aria-busy`),s.click()});return}p={...p,held:!1,cleared:!0},x=!0,clearTimeout(S),s.classList.remove(`nudge`),c.classList.remove(`show-tip`),r(`cycle-log-status`).textContent=`Reject cleared by the viewer. Previous unit records and traces are retained below.`,j(),F()},f),r(`cycle-export`).addEventListener(`click`,()=>{let e=URL.createObjectURL(new Blob([JSON.stringify({source:`Defex scripted cycle illustration`,measurements:!1,units:u},null,2)],{type:`application/json`})),t=document.createElement(`a`);t.href=e,t.download=`defex-illustrated-unit-traces.json`,t.click(),setTimeout(()=>URL.revokeObjectURL(e),1e3)},f),C.addEventListener(`click`,e=>{let t=e.target.closest(`[data-cycle-step]`);t&&!p.held&&(x=!0,j(),A(),p=Wt(p,O[Number(t.dataset.cycleStep)][1]),M(),T(),L())},f);for(let e of l)e.addEventListener(`click`,()=>{if(p.held)return;let t=e.dataset.cycleCase,n=h;j(),A(),p=Ut(p,t),x=!0,M(),T(),L(),n&&F()},f);for(let e of[`tour`,`embed-run`])r(e).addEventListener(`click`,e=>{e.stopImmediatePropagation(),e.detail<2&&te()},{capture:!0,signal:d.signal});document.addEventListener(`visibilitychange`,()=>{document.hidden&&h&&A()},f);let ie=l.map(e=>e.dataset.cycleCase),ae=ie.flatMap((e,t)=>ie.slice(t+1).map(t=>[e,t])),oe=e=>`requestIdleCallback`in window?requestIdleCallback(e,{timeout:4e3}):setTimeout(e,200),se=()=>{let e=ae.shift();e&&!m&&(It(...e),oe(se))};oe(se),document.body.classList.add(`process-mode`),T();function ce(){A(),g=!1,document.body.classList.remove(`process-mode`),e.setProcess(null)}function le(){m||(ce(),m=!0,d.abort(),clearTimeout(S),s.classList.remove(`nudge`),c.classList.remove(`show-tip`))}return{refresh:()=>{m||T()},toggle:()=>{m||te()},restart:()=>{m||ne()},deactivate:ce,dispose:le,isActive:()=>g&&!m,isHeld:()=>p.held}}var Xt={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Zt={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Qt=1e3,$t=1001,en=1002,tn=1003,nn=1004,rn=1005,an=1006,on=1007,sn=1008,cn=1009,ln=1010,un=1011,dn=1012,fn=1013,pn=1014,mn=1015,hn=1016,gn=1017,_n=1018,vn=1020,yn=35902,bn=35899,xn=1021,Sn=1022,Cn=1023,wn=1026,Tn=1027,En=1028,Dn=1029,On=1030,kn=1031,An=1033,jn=33776,Mn=33777,Nn=33778,Pn=33779,Fn=35840,In=35841,Ln=35842,Rn=35843,zn=36196,Bn=37492,Vn=37496,Hn=37488,Un=37489,Wn=37490,Gn=37491,Kn=37808,qn=37809,Jn=37810,Yn=37811,Xn=37812,Zn=37813,Qn=37814,$n=37815,er=37816,tr=37817,nr=37818,rr=37819,ir=37820,ar=37821,or=36492,sr=36494,cr=36495,lr=36283,ur=36284,dr=36285,fr=36286,pr=2300,mr=2301,hr=2302,gr=2303,_r=2400,vr=2401,yr=2402,br=3200,xr=3201,Sr=`srgb`,Cr=`srgb-linear`,wr=`linear`,Tr=`srgb`,Er=7680,Dr=35044,Or=35048,kr=2e3;function Ar(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function jr(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Mr(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Nr(){let e=Mr(`canvas`);return e.style.display=`block`,e}var Pr={};function Fr(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Ir(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function Lr(...e){e=Ir(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function Rr(...e){e=Ir(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function zr(...e){let t=e.join(` `);t in Pr||(Pr[t]=!0,Lr(...e))}function Br(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var Vr={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},Hr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},Ur=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Wr=1234567,Gr=Math.PI/180,Kr=180/Math.PI;function qr(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Ur[e&255]+Ur[e>>8&255]+Ur[e>>16&255]+Ur[e>>24&255]+`-`+Ur[t&255]+Ur[t>>8&255]+`-`+Ur[t>>16&15|64]+Ur[t>>24&255]+`-`+Ur[n&63|128]+Ur[n>>8&255]+`-`+Ur[n>>16&255]+Ur[n>>24&255]+Ur[r&255]+Ur[r>>8&255]+Ur[r>>16&255]+Ur[r>>24&255]).toLowerCase()}function Jr(e,t,n){return Math.max(t,Math.min(n,e))}function Yr(e,t){return(e%t+t)%t}function Xr(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function Zr(e,t,n){return e===t?0:(n-e)/(t-e)}function Qr(e,t,n){return(1-n)*e+n*t}function $r(e,t,n,r){return Qr(e,t,1-Math.exp(-n*r))}function ei(e,t=1){return t-Math.abs(Yr(e,t*2)-t)}function ti(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function ni(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function ri(e,t){return e+Math.floor(Math.random()*(t-e+1))}function ii(e,t){return e+Math.random()*(t-e)}function ai(e){return e*(.5-Math.random())}function oi(e){e!==void 0&&(Wr=e);let t=Wr+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function si(e){return e*Gr}function ci(e){return e*Kr}function li(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function ui(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function di(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function fi(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:Lr(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function pi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function mi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var hi={DEG2RAD:Gr,RAD2DEG:Kr,generateUUID:qr,clamp:Jr,euclideanModulo:Yr,mapLinear:Xr,inverseLerp:Zr,lerp:Qr,damp:$r,pingpong:ei,smoothstep:ti,smootherstep:ni,randInt:ri,randFloat:ii,randFloatSpread:ai,seededRandom:oi,degToRad:si,radToDeg:ci,isPowerOfTwo:li,ceilPowerOfTwo:ui,floorPowerOfTwo:di,setQuaternionFromProperEuler:fi,normalize:mi,denormalize:pi},W=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Jr(this.x,e.x,t.x),this.y=Jr(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Jr(this.x,e,t),this.y=Jr(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Jr(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Jr(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},gi=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:Lr(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Jr(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(vi.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(vi.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Jr(this.x,e.x,t.x),this.y=Jr(this.y,e.y,t.y),this.z=Jr(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Jr(this.x,e,t),this.y=Jr(this.y,e,t),this.z=Jr(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Jr(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return _i.copy(this).projectOnVector(e),this.sub(_i)}reflect(e){return this.sub(_i.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Jr(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},_i=new G,vi=new gi,yi=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return zr(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(bi.makeScale(e,t)),this}rotate(e){return zr(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(bi.makeRotation(-e)),this}translate(e,t){return zr(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(bi.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},bi=new yi,xi=new yi().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Si=new yi().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ci(){let e={enabled:!0,workingColorSpace:Cr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=Ti(e.r),e.g=Ti(e.g),e.b=Ti(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Ei(e.r),e.g=Ei(e.g),e.b=Ei(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?wr:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return zr(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return zr(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Cr]:{primaries:t,whitePoint:r,transfer:wr,toXYZ:xi,fromXYZ:Si,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Sr},outputColorSpaceConfig:{drawingBufferColorSpace:Sr}},[Sr]:{primaries:t,whitePoint:r,transfer:Tr,toXYZ:xi,fromXYZ:Si,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Sr}}}),e}var wi=Ci();function Ti(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Ei(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Di,Oi=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Di===void 0&&(Di=Mr(`canvas`)),Di.width=e.width,Di.height=e.height;let t=Di.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Di}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Mr(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Ti(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ti(t[e]/255)*255):t[e]=Ti(t[e]);return{data:t,width:e.width,height:e.height}}return Lr(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},ki=0,Ai=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ki++}),this.uuid=qr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(ji(r[t].image)):e.push(ji(r[t]))}else e=ji(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function ji(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Oi.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Lr(`Texture: Unable to serialize Texture.`),{})}var Mi=0,Ni=new G,Pi=class e extends Hr{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=$t,i=$t,a=an,o=sn,s=Cn,c=cn,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Mi++}),this.uuid=qr(),this.name=``,this.source=new Ai(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new W(0,0),this.repeat=new W(1,1),this.center=new W(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new yi,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ni).x}get height(){return this.source.getSize(Ni).y}get depth(){return this.source.getSize(Ni).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Lr(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Lr(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Qt:e.x-=Math.floor(e.x);break;case $t:e.x=e.x<0?0:1;break;case en:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Qt:e.y-=Math.floor(e.y);break;case $t:e.y=e.y<0?0:1;break;case en:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Pi.DEFAULT_IMAGE=null,Pi.DEFAULT_MAPPING=300,Pi.DEFAULT_ANISOTROPY=1;var Fi=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Jr(this.x,e.x,t.x),this.y=Jr(this.y,e.y,t.y),this.z=Jr(this.z,e.z,t.z),this.w=Jr(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Jr(this.x,e,t),this.y=Jr(this.y,e,t),this.z=Jr(this.z,e,t),this.w=Jr(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Jr(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ii=class extends Hr{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Fi(0,0,e,t),this.scissorTest=!1,this.viewport=new Fi(0,0,e,t),this.textures=[];let r=new Pi({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:an,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Ai(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Li=class extends Ii{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ri=class extends Pi{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=tn,this.minFilter=tn,this.wrapR=$t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},zi=class extends Pi{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=tn,this.minFilter=tn,this.wrapR=$t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},K=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Bi.setFromMatrixColumn(e,0).length(),i=1/Bi.setFromMatrixColumn(e,1).length(),a=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Hi,e,Ui)}lookAt(e,t,n){let r=this.elements;return Ki.subVectors(e,t),Ki.lengthSq()===0&&(Ki.z=1),Ki.normalize(),Wi.crossVectors(n,Ki),Wi.lengthSq()===0&&(Math.abs(n.z)===1?Ki.x+=1e-4:Ki.z+=1e-4,Ki.normalize(),Wi.crossVectors(n,Ki)),Wi.normalize(),Gi.crossVectors(Ki,Wi),r[0]=Wi.x,r[4]=Gi.x,r[8]=Ki.x,r[1]=Wi.y,r[5]=Gi.y,r[9]=Ki.y,r[2]=Wi.z,r[6]=Gi.z,r[10]=Ki.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],N=r[3],P=r[7],F=r[11],ee=r[15];return i[0]=a*x+o*T+s*k+c*N,i[4]=a*S+o*E+s*A+c*P,i[8]=a*C+o*D+s*j+c*F,i[12]=a*w+o*O+s*M+c*ee,i[1]=l*x+u*T+d*k+f*N,i[5]=l*S+u*E+d*A+f*P,i[9]=l*C+u*D+d*j+f*F,i[13]=l*w+u*O+d*M+f*ee,i[2]=p*x+m*T+h*k+g*N,i[6]=p*S+m*E+h*A+g*P,i[10]=p*C+m*D+h*j+g*F,i[14]=p*w+m*O+h*M+g*ee,i[3]=_*x+v*T+y*k+b*N,i[7]=_*S+v*E+y*A+b*P,i[11]=_*C+v*D+y*j+b*F,i[15]=_*w+v*O+y*M+b*ee,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Bi.set(r[0],r[1],r[2]).length(),o=Bi.set(r[4],r[5],r[6]).length(),s=Bi.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Vi.copy(this);let c=1/a,l=1/o,u=1/s;return Vi.elements[0]*=c,Vi.elements[1]*=c,Vi.elements[2]*=c,Vi.elements[4]*=l,Vi.elements[5]*=l,Vi.elements[6]*=l,Vi.elements[8]*=u,Vi.elements[9]*=u,Vi.elements[10]*=u,t.setFromRotationMatrix(Vi),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=kr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=kr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Bi=new G,Vi=new K,Hi=new G(0,0,0),Ui=new G(1,1,1),Wi=new G,Gi=new G,Ki=new G,qi=new K,Ji=new gi,Yi=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(Jr(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-Jr(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(Jr(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-Jr(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(Jr(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-Jr(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:Lr(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return qi.makeRotationFromQuaternion(e),this.setFromRotationMatrix(qi,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ji.setFromEuler(this),this.setFromQuaternion(Ji,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Yi.DEFAULT_ORDER=`XYZ`;var Xi=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},Zi=0,Qi=new G,$i=new gi,ea=new K,ta=new G,na=new G,ra=new G,ia=new gi,aa=new G(1,0,0),oa=new G(0,1,0),sa=new G(0,0,1),ca={type:`added`},la={type:`removed`},ua={type:`childadded`,child:null},da={type:`childremoved`,child:null},fa=class e extends Hr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Zi++}),this.uuid=qr(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new G,n=new Yi,r=new gi,i=new G(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new K},normalMatrix:{value:new yi}}),this.matrix=new K,this.matrixWorld=new K,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Xi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return $i.setFromAxisAngle(e,t),this.quaternion.multiply($i),this}rotateOnWorldAxis(e,t){return $i.setFromAxisAngle(e,t),this.quaternion.premultiply($i),this}rotateX(e){return this.rotateOnAxis(aa,e)}rotateY(e){return this.rotateOnAxis(oa,e)}rotateZ(e){return this.rotateOnAxis(sa,e)}translateOnAxis(e,t){return Qi.copy(e).applyQuaternion(this.quaternion),this.position.add(Qi.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(aa,e)}translateY(e){return this.translateOnAxis(oa,e)}translateZ(e){return this.translateOnAxis(sa,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ea.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ta.copy(e):ta.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),na.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ea.lookAt(na,ta,this.up):ea.lookAt(ta,na,this.up),this.quaternion.setFromRotationMatrix(ea),r&&(ea.extractRotation(r.matrixWorld),$i.setFromRotationMatrix(ea),this.quaternion.premultiply($i.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(Rr(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ca),ua.child=e,this.dispatchEvent(ua),ua.child=null):Rr(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(la),da.child=e,this.dispatchEvent(da),da.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ea.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ea.multiply(e.parent.matrixWorld)),e.applyMatrix4(ea),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ca),ua.child=e,this.dispatchEvent(ua),ua.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(na,e,ra),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(na,ia,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};fa.DEFAULT_UP=new G(0,1,0),fa.DEFAULT_MATRIX_AUTO_UPDATE=!0,fa.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var q=class extends fa{constructor(){super(),this.isGroup=!0,this.type=`Group`}},pa={type:`move`},ma=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new q,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new q,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new q,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(pa)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new q;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},ha={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ga={h:0,s:0,l:0},_a={h:0,s:0,l:0};function va(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var J=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Sr){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,wi.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=wi.workingColorSpace){return this.r=e,this.g=t,this.b=n,wi.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=wi.workingColorSpace){if(e=Yr(e,1),t=Jr(t,0,1),n=Jr(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=va(i,r,e+1/3),this.g=va(i,r,e),this.b=va(i,r,e-1/3)}return wi.colorSpaceToWorking(this,r),this}setStyle(e,t=Sr){function n(t){t!==void 0&&parseFloat(t)<1&&Lr(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:Lr(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);Lr(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Sr){let n=ha[e.toLowerCase()];return n===void 0?Lr(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ti(e.r),this.g=Ti(e.g),this.b=Ti(e.b),this}copyLinearToSRGB(e){return this.r=Ei(e.r),this.g=Ei(e.g),this.b=Ei(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Sr){return wi.workingToColorSpace(ya.copy(this),e),Math.round(Jr(ya.r*255,0,255))*65536+Math.round(Jr(ya.g*255,0,255))*256+Math.round(Jr(ya.b*255,0,255))}getHexString(e=Sr){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=wi.workingColorSpace){wi.workingToColorSpace(ya.copy(this),t);let n=ya.r,r=ya.g,i=ya.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=wi.workingColorSpace){return wi.workingToColorSpace(ya.copy(this),t),e.r=ya.r,e.g=ya.g,e.b=ya.b,e}getStyle(e=Sr){wi.workingToColorSpace(ya.copy(this),e);let t=ya.r,n=ya.g,r=ya.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(ga),this.setHSL(ga.h+e,ga.s+t,ga.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ga),e.getHSL(_a);let n=Qr(ga.h,_a.h,t),r=Qr(ga.s,_a.s,t),i=Qr(ga.l,_a.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ya=new J;J.NAMES=ha;var ba=class e{constructor(e,t=25e-5){this.isFogExp2=!0,this.name=``,this.color=new J(e),this.density=t}clone(){return new e(this.color,this.density)}toJSON(){return{type:`FogExp2`,name:this.name,color:this.color.getHex(),density:this.density}}},xa=class extends fa{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Yi,this.environmentIntensity=1,this.environmentRotation=new Yi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Sa=new G,Ca=new G,wa=new G,Ta=new G,Ea=new G,Da=new G,Oa=new G,ka=new G,Aa=new G,ja=new G,Ma=new Fi,Na=new Fi,Pa=new Fi,Fa=class e{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Sa.subVectors(e,t),r.cross(Sa);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Sa.subVectors(r,t),Ca.subVectors(n,t),wa.subVectors(e,t);let a=Sa.dot(Sa),o=Sa.dot(Ca),s=Sa.dot(wa),c=Ca.dot(Ca),l=Ca.dot(wa),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ta)!==null&&Ta.x>=0&&Ta.y>=0&&Ta.x+Ta.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Ta)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Ta.x),s.addScaledVector(a,Ta.y),s.addScaledVector(o,Ta.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Ma.setScalar(0),Na.setScalar(0),Pa.setScalar(0),Ma.fromBufferAttribute(e,t),Na.fromBufferAttribute(e,n),Pa.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Ma,i.x),a.addScaledVector(Na,i.y),a.addScaledVector(Pa,i.z),a}static isFrontFacing(e,t,n,r){return Sa.subVectors(n,t),Ca.subVectors(e,t),Sa.cross(Ca).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Sa.subVectors(this.c,this.b),Ca.subVectors(this.a,this.b),Sa.cross(Ca).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Ea.subVectors(r,n),Da.subVectors(i,n),ka.subVectors(e,n);let s=Ea.dot(ka),c=Da.dot(ka);if(s<=0&&c<=0)return t.copy(n);Aa.subVectors(e,r);let l=Ea.dot(Aa),u=Da.dot(Aa);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Ea,a);ja.subVectors(e,i);let f=Ea.dot(ja),p=Da.dot(ja);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Da,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Oa.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Oa,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Ea,a).addScaledVector(Da,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ia=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Ra.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Ra.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Ra.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Ra):Ra.fromBufferAttribute(r,t),Ra.applyMatrix4(e.matrixWorld),this.expandByPoint(Ra);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),za.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),za.copy(e.boundingBox)),za.applyMatrix4(e.matrixWorld),this.union(za)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ra),Ra.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ka),qa.subVectors(this.max,Ka),Ba.subVectors(e.a,Ka),Va.subVectors(e.b,Ka),Ha.subVectors(e.c,Ka),Ua.subVectors(Va,Ba),Wa.subVectors(Ha,Va),Ga.subVectors(Ba,Ha);let t=[0,-Ua.z,Ua.y,0,-Wa.z,Wa.y,0,-Ga.z,Ga.y,Ua.z,0,-Ua.x,Wa.z,0,-Wa.x,Ga.z,0,-Ga.x,-Ua.y,Ua.x,0,-Wa.y,Wa.x,0,-Ga.y,Ga.x,0];return!Xa(t,Ba,Va,Ha,qa)||(t=[1,0,0,0,1,0,0,0,1],!Xa(t,Ba,Va,Ha,qa))?!1:(Ja.crossVectors(Ua,Wa),t=[Ja.x,Ja.y,Ja.z],Xa(t,Ba,Va,Ha,qa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ra).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ra).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(La[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),La[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),La[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),La[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),La[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),La[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),La[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),La[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(La),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},La=[new G,new G,new G,new G,new G,new G,new G,new G],Ra=new G,za=new Ia,Ba=new G,Va=new G,Ha=new G,Ua=new G,Wa=new G,Ga=new G,Ka=new G,qa=new G,Ja=new G,Ya=new G;function Xa(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Ya.fromArray(e,a);let o=i.x*Math.abs(Ya.x)+i.y*Math.abs(Ya.y)+i.z*Math.abs(Ya.z),s=t.dot(Ya),c=n.dot(Ya),l=r.dot(Ya);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Za=new G,Qa=new W,$a=0,eo=class extends Hr{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:$a++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Dr,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Qa.fromBufferAttribute(this,t),Qa.applyMatrix3(e),this.setXY(t,Qa.x,Qa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Za.fromBufferAttribute(this,t),Za.applyMatrix3(e),this.setXYZ(t,Za.x,Za.y,Za.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Za.fromBufferAttribute(this,t),Za.applyMatrix4(e),this.setXYZ(t,Za.x,Za.y,Za.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Za.fromBufferAttribute(this,t),Za.applyNormalMatrix(e),this.setXYZ(t,Za.x,Za.y,Za.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Za.fromBufferAttribute(this,t),Za.transformDirection(e),this.setXYZ(t,Za.x,Za.y,Za.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=pi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=mi(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=pi(t,this.array)),t}setX(e,t){return this.normalized&&(t=mi(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=pi(t,this.array)),t}setY(e,t){return this.normalized&&(t=mi(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=pi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=mi(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=pi(t,this.array)),t}setW(e,t){return this.normalized&&(t=mi(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=mi(t,this.array),n=mi(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=mi(t,this.array),n=mi(n,this.array),r=mi(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=mi(t,this.array),n=mi(n,this.array),r=mi(r,this.array),i=mi(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},to=class extends eo{constructor(e,t,n){super(new Uint16Array(e),t,n)}},no=class extends eo{constructor(e,t,n){super(new Uint32Array(e),t,n)}},ro=class extends eo{constructor(e,t,n){super(new Float32Array(e),t,n)}},io=new Ia,ao=new G,oo=new G,so=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?io.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ao.subVectors(e,this.center);let t=ao.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(ao,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(oo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ao.copy(e.center).add(oo)),this.expandByPoint(ao.copy(e.center).sub(oo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},co=0,lo=new K,uo=new fa,fo=new G,po=new Ia,mo=new Ia,ho=new G,go=class e extends Hr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:co++}),this.uuid=qr(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Ar(e)?no:to)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new yi().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return lo.makeRotationFromQuaternion(e),this.applyMatrix4(lo),this}rotateX(e){return lo.makeRotationX(e),this.applyMatrix4(lo),this}rotateY(e){return lo.makeRotationY(e),this.applyMatrix4(lo),this}rotateZ(e){return lo.makeRotationZ(e),this.applyMatrix4(lo),this}translate(e,t,n){return lo.makeTranslation(e,t,n),this.applyMatrix4(lo),this}scale(e,t,n){return lo.makeScale(e,t,n),this.applyMatrix4(lo),this}lookAt(e){return uo.lookAt(e),uo.updateMatrix(),this.applyMatrix4(uo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(fo).negate(),this.translate(fo.x,fo.y,fo.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new ro(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&Lr(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ia);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Rr(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];po.setFromBufferAttribute(n),this.morphTargetsRelative?(ho.addVectors(this.boundingBox.min,po.min),this.boundingBox.expandByPoint(ho),ho.addVectors(this.boundingBox.max,po.max),this.boundingBox.expandByPoint(ho)):(this.boundingBox.expandByPoint(po.min),this.boundingBox.expandByPoint(po.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Rr(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new so);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Rr(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(po.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];mo.setFromBufferAttribute(n),this.morphTargetsRelative?(ho.addVectors(po.min,mo.min),po.expandByPoint(ho),ho.addVectors(po.max,mo.max),po.expandByPoint(ho)):(po.expandByPoint(mo.min),po.expandByPoint(mo.max))}po.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)ho.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(ho));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)ho.fromBufferAttribute(a,t),o&&(fo.fromBufferAttribute(e,t),ho.add(fo)),r=Math.max(r,n.distanceToSquared(ho))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Rr(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Rr(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new eo(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new G,s[e]=new G;let c=new G,l=new G,u=new G,d=new W,f=new W,p=new W,m=new G,h=new G;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new G,y=new G,b=new G,x=new G;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new eo(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new G,i=new G,a=new G,o=new G,s=new G,c=new G,l=new G,u=new G;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)ho.fromBufferAttribute(e,t),ho.normalize(),e.setXYZ(t,ho.x,ho.y,ho.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new eo(a,r,i)}if(this.index===null)return Lr(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},_o=new G,vo=new G,yo=new yi,bo=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=_o.subVectors(n,t).cross(vo.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(_o),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||yo.getNormalMatrix(e),r=this.coplanarPoint(_o).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},xo=0,So=class extends Hr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:xo++}),this.uuid=qr(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Er,this.stencilZFail=Er,this.stencilZPass=Er,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Lr(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Lr(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new J().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new bo().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new W().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new W().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Co=new G,wo=new G,To=new G,Eo=new G,Do=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Co)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Co.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Co.copy(this.origin).addScaledVector(this.direction,t),Co.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){wo.copy(e).add(t).multiplyScalar(.5),To.copy(t).sub(e).normalize(),Eo.copy(this.origin).sub(wo);let i=e.distanceTo(t)*.5,a=-this.direction.dot(To),o=Eo.dot(this.direction),s=-Eo.dot(To),c=Eo.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(wo).addScaledVector(To,d),f}intersectSphere(e,t){if(e.radius<0)return null;Co.subVectors(e.center,this.origin);let n=Co.dot(this.direction),r=Co.dot(Co)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Co)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,N;if(y>=b&&y>=x?(w=s,D=u,A=p,N=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,N=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,N=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let P=S/w,F=C/w,ee=1/w,te=T-P*D,ne=E-F*D,I=O-P*A,re=k-F*A,L=j-P*N,R=M-F*N,z=L*re-R*I,ie=te*R-ne*L,ae=I*ne-re*te;if(r){if(z<0||ie<0||ae<0)return null}else if((z<0||ie<0||ae<0)&&(z>0||ie>0||ae>0))return null;let oe=z+ie+ae;if(oe===0)return null;let se=ee*(z*D+ie*A+ae*N);return(oe>0?se<0:se>0)?null:this.at(se/oe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Oo=class extends So{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Yi,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ko=new K,Ao=new Do,jo=new so,Mo=new G,No=new G,Po=new G,Fo=new G,Io=new G,Lo=new G,Ro=new G,zo=new G,Bo=class extends fa{constructor(e=new go,t=new Oo){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Lo.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Io.fromBufferAttribute(s,e),a?Lo.addScaledVector(Io,r):Lo.addScaledVector(Io.sub(t),r))}t.add(Lo)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),jo.copy(n.boundingSphere),jo.applyMatrix4(i),Ao.copy(e.ray).recast(e.near),!(jo.containsPoint(Ao.origin)===!1&&(Ao.intersectSphere(jo,Mo)===null||Ao.origin.distanceToSquared(Mo)>(e.far-e.near)**2))&&(ko.copy(i).invert(),Ao.copy(e.ray).applyMatrix4(ko),(n.boundingBox===null||Ao.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Ao)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Ho(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Ho(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Ho(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Ho(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Vo(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;zo.copy(s),zo.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(zo);return l<n.near||l>n.far?null:{distance:l,point:zo.clone(),object:e}}function Ho(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,No),e.getVertexPosition(c,Po),e.getVertexPosition(l,Fo);let u=Vo(e,t,n,r,No,Po,Fo,Ro);if(u){let e=new G;Fa.getBarycoord(Ro,No,Po,Fo,e),i&&(u.uv=Fa.getInterpolatedAttribute(i,s,c,l,e,new W)),a&&(u.uv1=Fa.getInterpolatedAttribute(a,s,c,l,e,new W)),o&&(u.normal=Fa.getInterpolatedAttribute(o,s,c,l,e,new G),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new G,materialIndex:0};Fa.getNormal(No,Po,Fo,t.normal),u.face=t,u.barycoord=e}return u}var Uo=class extends Pi{constructor(e=null,t=1,n=1,r,i,a,o,s,c=tn,l=tn,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Wo=new so,Go=new W(.5,.5),Ko=new G,qo=class{constructor(e=new bo,t=new bo,n=new bo,r=new bo,i=new bo,a=new bo){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=kr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Wo.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Wo.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Wo)}intersectsSprite(e){return Wo.center.set(0,0,0),Wo.radius=.7071067811865476+Go.distanceTo(e.center),Wo.applyMatrix4(e.matrixWorld),this.intersectsSphere(Wo)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ko.x=r.normal.x>0?e.max.x:e.min.x,Ko.y=r.normal.y>0?e.max.y:e.min.y,Ko.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ko)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Jo=class extends Pi{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Yo=class extends Pi{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Xo=class extends Pi{constructor(e,t,n=pn,r,i,a,o=tn,s=tn,c,l=wn,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ai(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Zo=class extends Xo{constructor(e,t=pn,n=301,r,i,a=tn,o=tn,s,c=wn){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Qo=class extends Pi{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},$o=class e extends go{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new ro(c,3)),this.setAttribute(`normal`,new ro(l,3)),this.setAttribute(`uv`,new ro(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new G;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},es=class e extends go{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new ro(u,3)),this.setAttribute(`normal`,new ro(d,3)),this.setAttribute(`uv`,new ro(f,2));function _(){let a=new G,_=new G,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new W,m=new G,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ts=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Lr(`Curve: .getPoint() not implemented.`)}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new W:new G);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new G,r=[],i=[],a=[],o=new G,s=new K;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new G)}i[0]=new G,a[0]=new G;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(Jr(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(Jr(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ns=class extends ts{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new W){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},rs=class extends ns{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function is(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var as=new G,os=new G,ss=new is,cs=new is,ls=new is,us=class extends ts{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new G){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(os.subVectors(r[0],r[1]).add(r[0]),c=os);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(as.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=as),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),ss.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),cs.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),ls.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(ss.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),cs.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),ls.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(ss.calc(s),cs.calc(s),ls.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new G().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function ds(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function fs(e,t){let n=1-e;return n*n*t}function ps(e,t){return 2*(1-e)*e*t}function ms(e,t){return e*e*t}function hs(e,t,n,r){return fs(e,t)+ps(e,n)+ms(e,r)}function gs(e,t){let n=1-e;return n*n*n*t}function _s(e,t){let n=1-e;return 3*n*n*e*t}function vs(e,t){return 3*(1-e)*e*e*t}function ys(e,t){return e*e*e*t}function bs(e,t,n,r,i){return gs(e,t)+_s(e,n)+vs(e,r)+ys(e,i)}var xs=class extends ts{constructor(e=new W,t=new W,n=new W,r=new W){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new W){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(bs(e,r.x,i.x,a.x,o.x),bs(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ss=class extends ts{constructor(e=new G,t=new G,n=new G,r=new G){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(bs(e,r.x,i.x,a.x,o.x),bs(e,r.y,i.y,a.y,o.y),bs(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Cs=class extends ts{constructor(e=new W,t=new W){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new W){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new W){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ws=class extends ts{constructor(e=new G,t=new G){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new G){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new G){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ts=class extends ts{constructor(e=new W,t=new W,n=new W){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new W){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(hs(e,r.x,i.x,a.x),hs(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Es=class extends ts{constructor(e=new G,t=new G,n=new G){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(hs(e,r.x,i.x,a.x),hs(e,r.y,i.y,a.y),hs(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ds=class extends ts{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new W){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(ds(o,s.x,c.x,l.x,u.x),ds(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new W().fromArray(n))}return this}},Os=Object.freeze({__proto__:null,ArcCurve:rs,CatmullRomCurve3:us,CubicBezierCurve:xs,CubicBezierCurve3:Ss,EllipseCurve:ns,LineCurve:Cs,LineCurve3:ws,QuadraticBezierCurve:Ts,QuadraticBezierCurve3:Es,SplineCurve:Ds}),ks=class extends ts{constructor(){super(),this.type=`CurvePath`,this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?`LineCurve`:`LineCurve3`;this.curves.push(new Os[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),r=this.getCurveLengths(),i=0;for(;i<r.length;){if(r[i]>=n){let e=r[i]-n,a=this.curves[i],o=a.getLength(),s=o===0?0:1-e/o;return a.getPointAt(s,t)}i++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let r=0,i=this.curves;r<i.length;r++){let a=i[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,s=a.getPoints(o);for(let e=0;e<s.length;e++){let r=s[e];n&&n.equals(r)||(t.push(r),n=r)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(new Os[n.type]().fromJSON(n))}return this}},As=class extends ks{constructor(e){super(),this.type=`Path`,this.currentPoint=new W,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Cs(this.currentPoint.clone(),new W(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){let i=new Ts(this.currentPoint.clone(),new W(e,t),new W(n,r));return this.curves.push(i),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,i,a){let o=new xs(this.currentPoint.clone(),new W(e,t),new W(n,r),new W(i,a));return this.curves.push(o),this.currentPoint.set(i,a),this}splineThru(e){let t=new Ds([this.currentPoint.clone()].concat(e));return this.curves.push(t),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,i,a){let o=this.currentPoint.x,s=this.currentPoint.y;return this.absarc(e+o,t+s,n,r,i,a),this}absarc(e,t,n,r,i,a){return this.absellipse(e,t,n,n,r,i,a),this}ellipse(e,t,n,r,i,a,o,s){let c=this.currentPoint.x,l=this.currentPoint.y;return this.absellipse(e+c,t+l,n,r,i,a,o,s),this}absellipse(e,t,n,r,i,a,o,s){let c=new ns(e,t,n,r,i,a,o,s);if(this.curves.length>0){let e=c.getPoint(0);e.equals(this.currentPoint)||this.lineTo(e.x,e.y)}this.curves.push(c);let l=c.getPoint(1);return this.currentPoint.copy(l),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},js=class extends As{constructor(e){super(e),this.uuid=qr(),this.type=`Shape`,this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(new As().fromJSON(n))}return this}};function Ms(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=Ns(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=Bs(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return Fs(a,o,n,s,c,l,0),o}function Ns(e,t,n,r,i){let a;if(i===uc(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=sc(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=sc(i/r|0,e[i],e[i+1],a);return a&&$s(a,a.next)&&(cc(a),a=a.next),a}function Ps(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&($s(n,n.next)||Qs(n.prev,n,n.next)===0)){if(cc(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function Fs(e,t,n,r,i,a,o){if(!e)return;!o&&a&&Gs(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?Ls(e,r,i,a):Is(e)){t.push(c.i,e.i,l.i),cc(e),e=l.next,s=l.next;continue}if(e=l,e===s){o?o===1?(e=Rs(Ps(e),t),Fs(e,t,n,r,i,a,2)):o===2&&zs(e,t,n,r,i,a):Fs(Ps(e),t,n,r,i,a,1);break}}}function Is(e){let t=e.prev,n=e,r=e.next;if(Qs(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&Xs(i,s,a,c,o,l,m.x,m.y)&&Qs(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Ls(e,t,n,r){let i=e.prev,a=e,o=e.next;if(Qs(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=qs(p,m,t,n,r),v=qs(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Xs(s,u,c,d,l,f,y.x,y.y)&&Qs(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Xs(s,u,c,d,l,f,b.x,b.y)&&Qs(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Xs(s,u,c,d,l,f,y.x,y.y)&&Qs(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Xs(s,u,c,d,l,f,b.x,b.y)&&Qs(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Rs(e,t){let n=e;do{let r=n.prev,i=n.next.next;!$s(r,i)&&ec(r,n,n.next,i)&&ic(r,i)&&ic(i,r)&&(t.push(r.i,n.i,i.i),cc(n),cc(n.next),n=e=i),n=n.next}while(n!==e);return Ps(n)}function zs(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&Zs(o,e)){let s=oc(o,e);o=Ps(o,o.next),s=Ps(s,s.next),Fs(o,t,n,r,i,a,0),Fs(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function Bs(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=Ns(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(Js(o))}i.sort(Vs);for(let e=0;e<i.length;e++)n=Hs(i[e],n);return n}function Vs(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function Hs(e,t){let n=Us(e,t);if(!n)return t;let r=oc(n,e);return Ps(r,r.next),Ps(n,n.next)}function Us(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if($s(e,n))return n;do{if($s(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&Ys(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);ic(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&Ws(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function Ws(e,t){return Qs(e.prev,e,t.prev)<0&&Qs(t.next,e,e.next)<0}function Gs(e,t,n,r){let i=e;do i.z===0&&(i.z=qs(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,Ks(i)}function Ks(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function qs(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function Js(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Ys(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function Xs(e,t,n,r,i,a,o,s){return(e!==o||t!==s)&&Ys(e,t,n,r,i,a,o,s)}function Zs(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!rc(e,t)&&(ic(e,t)&&ic(t,e)&&ac(e,t)&&(Qs(e.prev,e,t.prev)||Qs(e,t.prev,t))||$s(e,t)&&Qs(e.prev,e,e.next)>0&&Qs(t.prev,t,t.next)>0)}function Qs(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function $s(e,t){return e.x===t.x&&e.y===t.y}function ec(e,t,n,r){let i=nc(Qs(e,t,n)),a=nc(Qs(e,t,r)),o=nc(Qs(n,r,e)),s=nc(Qs(n,r,t));return!!(i!==a&&o!==s||i===0&&tc(e,n,t)||a===0&&tc(e,r,t)||o===0&&tc(n,e,r)||s===0&&tc(n,t,r))}function tc(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function nc(e){return e>0?1:e<0?-1:0}function rc(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&ec(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function ic(e,t){return Qs(e.prev,e,e.next)<0?Qs(e,t,e.next)>=0&&Qs(e,e.prev,t)>=0:Qs(e,t,e.prev)<0||Qs(e,e.next,t)<0}function ac(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function oc(e,t){let n=lc(e.i,e.x,e.y),r=lc(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function sc(e,t,n,r){let i=lc(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function cc(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function lc(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function uc(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var dc=class{static triangulate(e,t,n=2){return Ms(e,t,n)}},fc=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];pc(e),mc(n,e);let a=e.length;t.forEach(pc);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,mc(n,t[e]);let o=dc.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function pc(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function mc(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var hc=class e extends go{constructor(e=new js([new W(.5,.5),new W(-.5,.5),new W(-.5,-.5),new W(.5,-.5)]),t={}){super(),this.type=`ExtrudeGeometry`,this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,r=[],i=[];for(let t=0,n=e.length;t<n;t++){let n=e[t];a(n)}this.setAttribute(`position`,new ro(r,3)),this.setAttribute(`uv`,new ro(i,2)),this.computeVertexNormals();function a(e){let a=[],o=t.curveSegments===void 0?12:t.curveSegments,s=t.steps===void 0?1:t.steps,c=t.depth===void 0?1:t.depth,l=t.bevelEnabled===void 0||t.bevelEnabled,u=t.bevelThickness===void 0?.2:t.bevelThickness,d=t.bevelSize===void 0?u-.1:t.bevelSize,f=t.bevelOffset===void 0?0:t.bevelOffset,p=t.bevelSegments===void 0?3:t.bevelSegments,m=t.extrudePath,h=t.UVGenerator===void 0?gc:t.UVGenerator,g,_=!1,v,y,b,x;if(m){g=m.getSpacedPoints(s),_=!0,l=!1;let e=m.isCatmullRomCurve3?m.closed:!1;v=m.computeFrenetFrames(s,e),y=new G,b=new G,x=new G}l||(p=0,u=0,d=0,f=0);let S=e.extractPoints(o),C=S.shape,w=S.holes;if(!fc.isClockWise(C)){C=C.reverse();for(let e=0,t=w.length;e<t;e++){let t=w[e];fc.isClockWise(t)&&(w[e]=t.reverse())}}function T(e){let t=e[0];for(let n=1;n<=e.length;n++){let r=n%e.length,i=e[r],a=i.x-t.x,o=i.y-t.y,s=a*a+o*o,c=Math.max(Math.abs(i.x),Math.abs(i.y),Math.abs(t.x),Math.abs(t.y));if(s<=10000000000000001e-36*c*c){e.splice(r,1),n--;continue}t=i}}T(C),w.forEach(T);let E=w.length,D=C;for(let e=0;e<E;e++){let t=w[e];C=C.concat(t)}function O(e,t,n){return t||Rr(`ExtrudeGeometry: vec does not exist`),e.clone().addScaledVector(t,n)}let k=C.length;function A(e,t,n){let r,i,a,o=e.x-t.x,s=e.y-t.y,c=n.x-e.x,l=n.y-e.y,u=o*o+s*s,d=o*l-s*c;if(Math.abs(d)>2**-52){let d=Math.sqrt(u),f=Math.sqrt(c*c+l*l),p=t.x-s/d,m=t.y+o/d,h=n.x-l/f,g=n.y+c/f,_=((h-p)*l-(g-m)*c)/(o*l-s*c);r=p+o*_-e.x,i=m+s*_-e.y;let v=r*r+i*i;if(v<=2)return new W(r,i);a=Math.sqrt(v/2)}else{let e=!1;o>2**-52?c>2**-52&&(e=!0):o<-(2**-52)?c<-(2**-52)&&(e=!0):Math.sign(s)===Math.sign(l)&&(e=!0),e?(r=-s,i=o,a=Math.sqrt(u)):(r=o,i=s,a=Math.sqrt(u/2))}return new W(r/a,i/a)}let j=[];for(let e=0,t=D.length,n=t-1,r=e+1;e<t;e++,n++,r++)n===t&&(n=0),r===t&&(r=0),j[e]=A(D[e],D[n],D[r]);let M=[],N,P=j.concat();for(let e=0,t=E;e<t;e++){let t=w[e];N=[];for(let e=0,n=t.length,r=n-1,i=e+1;e<n;e++,r++,i++)r===n&&(r=0),i===n&&(i=0),N[e]=A(t[e],t[r],t[i]);M.push(N),P=P.concat(N)}let F;if(p===0)F=fc.triangulateShape(D,w);else{let e=[],t=[];for(let n=0;n<p;n++){let r=n/p,i=u*Math.cos(r*Math.PI/2),a=d*Math.sin(r*Math.PI/2)+f;for(let t=0,n=D.length;t<n;t++){let n=O(D[t],j[t],a);L(n.x,n.y,-i),r===0&&e.push(n)}for(let e=0,n=E;e<n;e++){let n=w[e];N=M[e];let o=[];for(let e=0,t=n.length;e<t;e++){let t=O(n[e],N[e],a);L(t.x,t.y,-i),r===0&&o.push(t)}r===0&&t.push(o)}}F=fc.triangulateShape(e,t)}let ee=F.length,te=d+f;for(let e=0;e<k;e++){let t=l?O(C[e],P[e],te):C[e];_?(b.copy(v.normals[0]).multiplyScalar(t.x),y.copy(v.binormals[0]).multiplyScalar(t.y),x.copy(g[0]).add(b).add(y),L(x.x,x.y,x.z)):L(t.x,t.y,0)}for(let e=1;e<=s;e++)for(let t=0;t<k;t++){let n=l?O(C[t],P[t],te):C[t];_?(b.copy(v.normals[e]).multiplyScalar(n.x),y.copy(v.binormals[e]).multiplyScalar(n.y),x.copy(g[e]).add(b).add(y),L(x.x,x.y,x.z)):L(n.x,n.y,c/s*e)}for(let e=p-1;e>=0;e--){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=D.length;e<t;e++){let t=O(D[e],j[e],r);L(t.x,t.y,c+n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];N=M[e];for(let e=0,i=t.length;e<i;e++){let i=O(t[e],N[e],r);_?L(i.x,i.y+g[s-1].y,g[s-1].x+n):L(i.x,i.y,c+n)}}}ne(),I();function ne(){let e=r.length/3;if(l){let e=0,t=k*e;for(let e=0;e<ee;e++){let n=F[e];R(n[2]+t,n[1]+t,n[0]+t)}e=s+p*2,t=k*e;for(let e=0;e<ee;e++){let n=F[e];R(n[0]+t,n[1]+t,n[2]+t)}}else{for(let e=0;e<ee;e++){let t=F[e];R(t[2],t[1],t[0])}for(let e=0;e<ee;e++){let t=F[e];R(t[0]+k*s,t[1]+k*s,t[2]+k*s)}}n.addGroup(e,r.length/3-e,0)}function I(){let e=r.length/3,t=0;re(D,t),t+=D.length;for(let e=0,n=w.length;e<n;e++){let n=w[e];re(n,t),t+=n.length}n.addGroup(e,r.length/3-e,1)}function re(e,t){let n=e.length;for(;--n>=0;){let r=n,i=n-1;i<0&&(i=e.length-1);for(let e=0,n=s+p*2;e<n;e++){let n=k*e,a=k*(e+1);z(t+r+n,t+i+n,t+i+a,t+r+a)}}}function L(e,t,n){a.push(e),a.push(t),a.push(n)}function R(e,t,i){ie(e),ie(t),ie(i);let a=r.length/3,o=h.generateTopUV(n,r,a-3,a-2,a-1);ae(o[0]),ae(o[1]),ae(o[2])}function z(e,t,i,a){ie(e),ie(t),ie(a),ie(t),ie(i),ie(a);let o=r.length/3,s=h.generateSideWallUV(n,r,o-6,o-3,o-2,o-1);ae(s[0]),ae(s[1]),ae(s[3]),ae(s[1]),ae(s[2]),ae(s[3])}function ie(e){r.push(a[e*3+0]),r.push(a[e*3+1]),r.push(a[e*3+2])}function ae(e){i.push(e.x),i.push(e.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return _c(t,n,e)}static fromJSON(t,n){let r=[];for(let e=0,i=t.shapes.length;e<i;e++){let i=n[t.shapes[e]];r.push(i)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new Os[i.type]().fromJSON(i)),new e(r,t.options)}},gc={generateTopUV:function(e,t,n,r,i){let a=t[n*3],o=t[n*3+1],s=t[r*3],c=t[r*3+1],l=t[i*3],u=t[i*3+1];return[new W(a,o),new W(s,c),new W(l,u)]},generateSideWallUV:function(e,t,n,r,i,a){let o=t[n*3],s=t[n*3+1],c=t[n*3+2],l=t[r*3],u=t[r*3+1],d=t[r*3+2],f=t[i*3],p=t[i*3+1],m=t[i*3+2],h=t[a*3],g=t[a*3+1],_=t[a*3+2];return Math.abs(s-u)<Math.abs(o-l)?[new W(o,1-c),new W(l,1-d),new W(f,1-m),new W(h,1-_)]:[new W(s,1-c),new W(u,1-d),new W(p,1-m),new W(g,1-_)]}};function _c(e,t,n){if(n.shapes=[],Array.isArray(e))for(let t=0,r=e.length;t<r;t++){let r=e[t];n.shapes.push(r.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}var vc=class e extends go{constructor(e=[new W(0,-.5),new W(.5,0),new W(0,.5)],t=12,n=0,r=Math.PI*2){super(),this.type=`LatheGeometry`,this.parameters={points:e,segments:t,phiStart:n,phiLength:r},t=Math.floor(t),r=Jr(r,0,Math.PI*2);let i=[],a=[],o=[],s=[],c=[],l=1/t,u=new G,d=new W,f=new G,p=new G,m=new G,h=0,g=0;for(let t=0;t<=e.length-1;t++)switch(t){case 0:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,m.copy(f),f.normalize(),s.push(f.x,f.y,f.z);break;case e.length-1:s.push(m.x,m.y,m.z);break;default:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,p.copy(f),f.x+=m.x,f.y+=m.y,f.z+=m.z,f.normalize(),s.push(f.x,f.y,f.z),m.copy(p)}for(let i=0;i<=t;i++){let f=n+i*l*r,p=Math.sin(f),m=Math.cos(f);for(let n=0;n<=e.length-1;n++){u.x=e[n].x*p,u.y=e[n].y,u.z=e[n].x*m,a.push(u.x,u.y,u.z),d.x=i/t,d.y=n/(e.length-1),o.push(d.x,d.y);let r=s[3*n+0]*p,l=s[3*n+1],f=s[3*n+0]*m;c.push(r,l,f)}}for(let n=0;n<t;n++)for(let t=0;t<e.length-1;t++){let r=t+n*e.length,a=r,o=r+e.length,s=r+e.length+1,c=r+1;i.push(a,o,c),i.push(s,c,o)}this.setIndex(i),this.setAttribute(`position`,new ro(a,3)),this.setAttribute(`uv`,new ro(o,2)),this.setAttribute(`normal`,new ro(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.points,t.segments,t.phiStart,t.phiLength)}},yc=class e extends go{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new ro(p,3)),this.setAttribute(`normal`,new ro(m,3)),this.setAttribute(`uv`,new ro(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},bc=class e extends go{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new G,p=new W;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new ro(s,3)),this.setAttribute(`normal`,new ro(c,3)),this.setAttribute(`uv`,new ro(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},xc=class e extends go{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new G,f=new G,p=new G;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new ro(c,3)),this.setAttribute(`normal`,new ro(l,3)),this.setAttribute(`uv`,new ro(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}},Sc=class e extends go{constructor(e=new Es(new G(-1,-1,0),new G(-1,1,0),new G(1,1,0)),t=64,n=1,r=8,i=!1){super(),this.type=`TubeGeometry`,this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:r,closed:i};let a=e.computeFrenetFrames(t,i);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new G,s=new G,c=new W,l=new G,u=[],d=[],f=[],p=[];m(),this.setIndex(p),this.setAttribute(`position`,new ro(u,3)),this.setAttribute(`normal`,new ro(d,3)),this.setAttribute(`uv`,new ro(f,2));function m(){for(let e=0;e<t;e++)h(e);h(i===!1?t:0),_(),g()}function h(i){l=e.getPointAt(i/t,l);let c=a.normals[i],f=a.binormals[i];for(let e=0;e<=r;e++){let t=e/r*Math.PI*2,i=Math.sin(t),a=-Math.cos(t);s.x=a*c.x+i*f.x,s.y=a*c.y+i*f.y,s.z=a*c.z+i*f.z,s.normalize(),d.push(s.x,s.y,s.z),o.x=l.x+n*s.x,o.y=l.y+n*s.y,o.z=l.z+n*s.z,u.push(o.x,o.y,o.z)}}function g(){for(let e=1;e<=t;e++)for(let t=1;t<=r;t++){let n=(r+1)*(e-1)+(t-1),i=(r+1)*e+(t-1),a=(r+1)*e+t,o=(r+1)*(e-1)+t;p.push(n,i,o),p.push(i,a,o)}}function _(){for(let e=0;e<=t;e++)for(let n=0;n<=r;n++)c.x=e/t,c.y=n/r,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(t){return new e(new Os[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};function Cc(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Tc(i))i.isRenderTargetTexture?(Lr(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Tc(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function wc(e){let t={};for(let n=0;n<e.length;n++){let r=Cc(e[n]);for(let e in r)t[e]=r[e]}return t}function Tc(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Ec(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Dc(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:wi.workingColorSpace}var Oc={clone:Cc,merge:wc},kc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ac=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,jc=class extends So{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=kc,this.fragmentShader=Ac,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Cc(e.uniforms),this.uniformsGroups=Ec(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new J().setHex(r.value);break;case`v2`:this.uniforms[n].value=new W().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Fi().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new yi().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new K().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Mc=class extends jc{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Nc=class extends So{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new J(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new J(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Yi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Pc=class extends Nc{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:``,PHYSICAL:``},this.type=`MeshPhysicalMaterial`,this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new W(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Jr(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new J(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new J(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new J(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:``,PHYSICAL:``},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},Fc=class extends So{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type=`MeshNormalMaterial`,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},Ic=class extends So{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=br,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Lc=class extends So{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Rc(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function zc(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Bc=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Vc=class extends Bc{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:_r,endingEnd:_r}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case vr:i=e,o=2*t-n;break;case yr:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case vr:a=e,s=2*n-t;break;case yr:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Hc=class extends Bc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Uc=class extends Bc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Wc=class extends Bc{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=qc(n,t,g,y,r);i[p]=Gc(x,o,_,b,m)}return i}};function Gc(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Kc(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function qc(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Gc(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Kc(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Jc=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Rc(t,this.TimeBufferType),this.values=Rc(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Rc(e.times,Array),values:Rc(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),zc(e.settings)&&(n.settings={inTangents:Rc(e.settings.inTangents,Array),outTangents:Rc(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Uc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Hc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Vc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Wc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case pr:t=this.InterpolantFactoryMethodDiscrete;break;case mr:t=this.InterpolantFactoryMethodLinear;break;case hr:t=this.InterpolantFactoryMethodSmooth;break;case gr:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return Lr(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return pr;case this.InterpolantFactoryMethodLinear:return mr;case this.InterpolantFactoryMethodSmooth:return hr;case this.InterpolantFactoryMethodBezier:return gr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;zc(this.settings)&&(Yc(this.settings.inTangents,e),Yc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Rr(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(Rr(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){Rr(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){Rr(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&jr(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){Rr(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===hr,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,zc(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Yc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Jc.prototype.ValueTypeName=``,Jc.prototype.TimeBufferType=Float32Array,Jc.prototype.ValueBufferType=Float32Array,Jc.prototype.DefaultInterpolation=mr;var Xc=class extends Jc{constructor(e,t,n){super(e,t,n)}};Xc.prototype.ValueTypeName=`bool`,Xc.prototype.ValueBufferType=Array,Xc.prototype.DefaultInterpolation=pr,Xc.prototype.InterpolantFactoryMethodLinear=void 0,Xc.prototype.InterpolantFactoryMethodSmooth=void 0;var Zc=class extends Jc{constructor(e,t,n,r){super(e,t,n,r)}};Zc.prototype.ValueTypeName=`color`;var Qc=class extends Jc{constructor(e,t,n,r){super(e,t,n,r)}};Qc.prototype.ValueTypeName=`number`;var $c=class extends Bc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)gi.slerpFlat(i,0,a,c-o,a,c,s);return i}},el=class extends Jc{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new $c(this.times,this.values,this.getValueSize(),e)}};el.prototype.ValueTypeName=`quaternion`,el.prototype.InterpolantFactoryMethodSmooth=void 0;var tl=class extends Jc{constructor(e,t,n){super(e,t,n)}};tl.prototype.ValueTypeName=`string`,tl.prototype.ValueBufferType=Array,tl.prototype.DefaultInterpolation=pr,tl.prototype.InterpolantFactoryMethodLinear=void 0,tl.prototype.InterpolantFactoryMethodSmooth=void 0;var nl=class extends Jc{constructor(e,t,n,r){super(e,t,n,r)}};nl.prototype.ValueTypeName=`vector`;var rl=class extends fa{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new J(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},il=class extends rl{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(fa.DEFAULT_UP),this.updateMatrix(),this.groundColor=new J(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},al=new K,ol=new G,sl=new G,cl=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new W(512,512),this.mapType=cn,this.map=null,this.mapPass=null,this.matrix=new K,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qo,this._frameExtents=new W(1,1),this._viewportCount=1,this._viewports=[new Fi(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;ol.setFromMatrixPosition(e.matrixWorld),t.position.copy(ol),sl.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(sl),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){al.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(al,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(al)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ll=new G,ul=new gi,dl=new G,fl=class extends fa{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new K,this.projectionMatrix=new K,this.projectionMatrixInverse=new K,this.coordinateSystem=kr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ll,ul,dl),dl.x===1&&dl.y===1&&dl.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ll,ul,dl.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(ll,ul,dl),dl.x===1&&dl.y===1&&dl.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ll,ul,dl.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},pl=new G,ml=new W,hl=new W,gl=class extends fl{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Kr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Gr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Kr*2*Math.atan(Math.tan(Gr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){pl.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(pl.x,pl.y).multiplyScalar(-e/pl.z),pl.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(pl.x,pl.y).multiplyScalar(-e/pl.z)}getViewSize(e,t){return this.getViewBounds(e,ml,hl),t.subVectors(hl,ml)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Gr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},_l=class extends fl{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},vl=class extends cl{constructor(){super(new _l(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},yl=class extends rl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(fa.DEFAULT_UP),this.updateMatrix(),this.target=new fa,this.shadow=new vl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},bl=-90,xl=1,Sl=class extends fa{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new gl(bl,xl,e,t);r.layers=this.layers,this.add(r);let i=new gl(bl,xl,e,t);i.layers=this.layers,this.add(i);let a=new gl(bl,xl,e,t);a.layers=this.layers,this.add(a);let o=new gl(bl,xl,e,t);o.layers=this.layers,this.add(o);let s=new gl(bl,xl,e,t);s.layers=this.layers,this.add(s);let c=new gl(bl,xl,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Cl=class extends gl{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},wl=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Tl.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Tl(){this._document.hidden===!1&&this.reset()}var El=`\\[\\]\\.:\\/`,Dl=RegExp(`[\\[\\]\\.:\\/]`,`g`),Ol=`[^\\[\\]\\.:\\/]`,kl=`[^`+El.replace(`\\.`,``)+`]`,Al=`((?:WC+[\\/:])*)`.replace(`WC`,Ol),jl=`(WCOD+)?`.replace(`WCOD`,kl),Ml=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Ol),Nl=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Ol),Pl=RegExp(`^`+Al+jl+Ml+Nl+`$`),Fl=[`material`,`materials`,`bones`,`map`],Il=class{constructor(e,t,n){let r=n||Ll.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ll=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Dl,``)}static parseTrackName(e){let t=Pl.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Fl.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Lr(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){Rr(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){Rr(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){Rr(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){Rr(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){Rr(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){Rr(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){Rr(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;Rr(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){Rr(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){Rr(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ll.Composite=Il,Ll.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Ll.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Ll.prototype.GetterByBindingType=[Ll.prototype._getValue_direct,Ll.prototype._getValue_array,Ll.prototype._getValue_arrayElement,Ll.prototype._getValue_toArray],Ll.prototype.SetterByBindingTypeAndVersioning=[[Ll.prototype._setValue_direct,Ll.prototype._setValue_direct_setNeedsUpdate,Ll.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ll.prototype._setValue_array,Ll.prototype._setValue_array_setNeedsUpdate,Ll.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ll.prototype._setValue_arrayElement,Ll.prototype._setValue_arrayElement_setNeedsUpdate,Ll.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ll.prototype._setValue_fromArray,Ll.prototype._setValue_fromArray_setNeedsUpdate,Ll.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Rl=new K,zl=class{constructor(e,t,n=0,r=1/0){this.ray=new Do(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Xi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Rr(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return Rl.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Rl),this}intersectObject(e,t=!0,n=[]){return Vl(e,this,n,t),n.sort(Bl),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)Vl(e[r],this,n,t);return n.sort(Bl),n}};function Bl(e,t){return e.distance-t.distance}function Vl(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)Vl(r[e],t,n,!0)}}var Hl=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=Jr(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Jr(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var Ul=class extends Hr{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Wl(e,t,n,r){let i=Gl(r);switch(n){case xn:return e*t;case En:return e*t/i.components*i.byteLength;case Dn:return e*t/i.components*i.byteLength;case On:return e*t*2/i.components*i.byteLength;case kn:return e*t*2/i.components*i.byteLength;case Sn:return e*t*3/i.components*i.byteLength;case Cn:return e*t*4/i.components*i.byteLength;case An:return e*t*4/i.components*i.byteLength;case jn:case Mn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Nn:case Pn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case In:case Rn:return Math.max(e,16)*Math.max(t,8)/4;case Fn:case Ln:return Math.max(e,8)*Math.max(t,8)/2;case zn:case Bn:case Hn:case Un:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Vn:case Wn:case Gn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Kn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case qn:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Jn:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Yn:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Xn:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Zn:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Qn:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case $n:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case er:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case tr:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case nr:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case rr:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case ir:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case ar:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case or:case sr:case cr:return Math.ceil(e/4)*Math.ceil(t/4)*16;case lr:case ur:return Math.ceil(e/4)*Math.ceil(t/4)*8;case dr:case fr:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Gl(e){switch(e){case cn:case ln:return{byteLength:1,components:1};case dn:case un:case hn:return{byteLength:2,components:1};case gn:case _n:return{byteLength:2,components:4};case pn:case fn:case mn:return{byteLength:4,components:1};case yn:case bn:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?Lr(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function Kl(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function ql(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Jl={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Y={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new yi},alphaMap:{value:null},alphaMapTransform:{value:new yi},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new yi}},envmap:{envMap:{value:null},envMapRotation:{value:new yi},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new yi}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new yi}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new yi},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new yi},normalScale:{value:new W(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new yi},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new yi}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new yi}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new yi}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new yi},alphaTest:{value:0},uvTransform:{value:new yi}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new W(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new yi},alphaMap:{value:null},alphaMapTransform:{value:new yi},alphaTest:{value:0}}},Yl={basic:{uniforms:wc([Y.common,Y.specularmap,Y.envmap,Y.aomap,Y.lightmap,Y.fog]),vertexShader:Jl.meshbasic_vert,fragmentShader:Jl.meshbasic_frag},lambert:{uniforms:wc([Y.common,Y.specularmap,Y.envmap,Y.aomap,Y.lightmap,Y.emissivemap,Y.bumpmap,Y.normalmap,Y.displacementmap,Y.fog,Y.lights,{emissive:{value:new J(0)},envMapIntensity:{value:1}}]),vertexShader:Jl.meshlambert_vert,fragmentShader:Jl.meshlambert_frag},phong:{uniforms:wc([Y.common,Y.specularmap,Y.envmap,Y.aomap,Y.lightmap,Y.emissivemap,Y.bumpmap,Y.normalmap,Y.displacementmap,Y.fog,Y.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Jl.meshphong_vert,fragmentShader:Jl.meshphong_frag},standard:{uniforms:wc([Y.common,Y.envmap,Y.aomap,Y.lightmap,Y.emissivemap,Y.bumpmap,Y.normalmap,Y.displacementmap,Y.roughnessmap,Y.metalnessmap,Y.fog,Y.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Jl.meshphysical_vert,fragmentShader:Jl.meshphysical_frag},toon:{uniforms:wc([Y.common,Y.aomap,Y.lightmap,Y.emissivemap,Y.bumpmap,Y.normalmap,Y.displacementmap,Y.gradientmap,Y.fog,Y.lights,{emissive:{value:new J(0)}}]),vertexShader:Jl.meshtoon_vert,fragmentShader:Jl.meshtoon_frag},matcap:{uniforms:wc([Y.common,Y.bumpmap,Y.normalmap,Y.displacementmap,Y.fog,{matcap:{value:null}}]),vertexShader:Jl.meshmatcap_vert,fragmentShader:Jl.meshmatcap_frag},points:{uniforms:wc([Y.points,Y.fog]),vertexShader:Jl.points_vert,fragmentShader:Jl.points_frag},dashed:{uniforms:wc([Y.common,Y.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Jl.linedashed_vert,fragmentShader:Jl.linedashed_frag},depth:{uniforms:wc([Y.common,Y.displacementmap]),vertexShader:Jl.depth_vert,fragmentShader:Jl.depth_frag},normal:{uniforms:wc([Y.common,Y.bumpmap,Y.normalmap,Y.displacementmap,{opacity:{value:1}}]),vertexShader:Jl.meshnormal_vert,fragmentShader:Jl.meshnormal_frag},sprite:{uniforms:wc([Y.sprite,Y.fog]),vertexShader:Jl.sprite_vert,fragmentShader:Jl.sprite_frag},background:{uniforms:{uvTransform:{value:new yi},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Jl.background_vert,fragmentShader:Jl.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new yi}},vertexShader:Jl.backgroundCube_vert,fragmentShader:Jl.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Jl.cube_vert,fragmentShader:Jl.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Jl.equirect_vert,fragmentShader:Jl.equirect_frag},distance:{uniforms:wc([Y.common,Y.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Jl.distance_vert,fragmentShader:Jl.distance_frag},shadow:{uniforms:wc([Y.lights,Y.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:Jl.shadow_vert,fragmentShader:Jl.shadow_frag}};Yl.physical={uniforms:wc([Yl.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new yi},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new yi},clearcoatNormalScale:{value:new W(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new yi},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new yi},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new yi},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new yi},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new yi},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new yi},transmissionSamplerSize:{value:new W},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new yi},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new yi},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new yi},anisotropyVector:{value:new W},anisotropyMap:{value:null},anisotropyMapTransform:{value:new yi}}]),vertexShader:Jl.meshphysical_vert,fragmentShader:Jl.meshphysical_frag};var Xl={r:0,b:0,g:0},Zl=new K,Ql=new yi;Ql.set(-1,0,0,0,1,0,0,0,1);function $l(e,t,n,r,i,a){let o=new J(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Bo(new $o(1,1,1),new jc({name:`BackgroundCubeMaterial`,uniforms:Cc(Yl.backgroundCube.uniforms),vertexShader:Yl.backgroundCube.vertexShader,fragmentShader:Yl.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Zl.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Ql),l.material.toneMapped=wi.getTransfer(i.colorSpace)!==Tr,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Bo(new yc(2,2),new jc({name:`BackgroundMaterial`,uniforms:Cc(Yl.background.uniforms),vertexShader:Yl.background.vertexShader,fragmentShader:Yl.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=wi.getTransfer(i.colorSpace)!==Tr,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Xl,Dc(e)),n.buffers.color.setClear(Xl.r,Xl.g,Xl.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function eu(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function tu(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function nu(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(Lr(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&Lr(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function ru(e){let t=this,n=null,r=0,i=!1,a=!1,o=new bo,s=new yi,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var iu=4,au=6,ou=20,su=256,cu=new _l,lu=new J,uu=null,du=0,fu=0,pu=!1,mu=new G,hu=new G,gu=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=mu}=i;uu=this._renderer.getRenderTarget(),du=this._renderer.getActiveCubeFace(),fu=this._renderer.getActiveMipmapLevel(),pu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Cu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Su(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(uu,du,fu),this._renderer.xr.enabled=pu,e.scissorTest=!1,yu(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),uu=this._renderer.getRenderTarget(),du=this._renderer.getActiveCubeFace(),fu=this._renderer.getActiveMipmapLevel(),pu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:an,minFilter:an,generateMipmaps:!1,type:hn,format:Cn,colorSpace:Cr,depthBuffer:!1},r=vu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=vu(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=_u(r)),this._blurMaterial=xu(r,e,t),this._ggxMaterial=bu(r,e,t)}return r}_compileMaterial(e){let t=new Bo(new go,e);this._renderer.compile(t,cu)}_sceneToCubeUV(e,t,n,r,i){let a=new gl(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(lu),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Bo(new $o,new Oo({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(lu),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;yu(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Cu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Su());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;yu(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,cu)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-iu?n-d+iu:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,yu(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,cu),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,yu(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,cu)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];yu(t,3*l*(r>this._lodMax-iu?r-this._lodMax+iu:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,cu)}};function _u(e){let t=[],n=[],r=e,i=e-iu+1+au;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?hu.set(1,r,n):e===1?hu.set(-n,1,-r):e===2?hu.set(-n,r,1):e===3?hu.set(-1,r,-n):e===4?hu.set(-n,-1,r):hu.set(n,r,-1),hu.toArray(l,(e*6+t)*3)}}let u=new go;u.setAttribute(`position`,new eo(c,3)),u.setAttribute(`outputDirection`,new eo(l,3)),n.push(new Bo(u,null)),r>iu&&r--}return{lodMeshes:n,sizeLods:t}}function vu(e,t,n){let r=new Li(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function yu(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function bu(e,t,n){return new jc({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:su,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:wu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function xu(e,t,n){return new jc({name:`SphericalGaussianBlur`,defines:{SAMPLES:ou,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:wu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Su(){return new jc({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:wu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Cu(){return new jc({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:wu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function wu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Tu=class extends Li{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Jo(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new $o(5,5,5),i=new jc({name:`CubemapFromEquirect`,uniforms:Cc(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Bo(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=an),new Sl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Eu(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Tu(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new gu(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new gu(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Du(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&zr(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Ou(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?no:to)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function ku(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Au(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:Rr(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function ju(e,t,n){let r=new WeakMap,i=new Fi;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Ri(h,p,m,u);g.type=mn,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new W(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Mu(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Nu={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Pu(e,t,n,r,i,a){let o=new Li(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new go;l.setAttribute(`position`,new ro([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new ro([0,2,0,0,2,0],2));let u=new Mc({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Bo(l,u),f=new _l(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new Li(t,n,{type:hn,depthBuffer:!1,stencilBuffer:!1}),c=new Li(t,n,{type:hn,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},wi.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=Nu[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var Fu=new Pi,Iu=new Xo(1,1),Lu=new Ri,Ru=new zi,zu=new Jo,Bu=[],Vu=[],Hu=new Float32Array(16),Uu=new Float32Array(9),Wu=new Float32Array(4);function Gu(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Bu[i];if(a===void 0&&(a=new Float32Array(i),Bu[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Ku(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function qu(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Ju(e,t){let n=Vu[t];n===void 0&&(n=new Int32Array(t),Vu[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Yu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Xu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ku(n,t))return;e.uniform2fv(this.addr,t),qu(n,t)}}function Zu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Ku(n,t))return;e.uniform3fv(this.addr,t),qu(n,t)}}function Qu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ku(n,t))return;e.uniform4fv(this.addr,t),qu(n,t)}}function $u(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Ku(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),qu(n,t)}else{if(Ku(n,r))return;Wu.set(r),e.uniformMatrix2fv(this.addr,!1,Wu),qu(n,r)}}function ed(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Ku(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),qu(n,t)}else{if(Ku(n,r))return;Uu.set(r),e.uniformMatrix3fv(this.addr,!1,Uu),qu(n,r)}}function td(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Ku(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),qu(n,t)}else{if(Ku(n,r))return;Hu.set(r),e.uniformMatrix4fv(this.addr,!1,Hu),qu(n,r)}}function nd(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function rd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ku(n,t))return;e.uniform2iv(this.addr,t),qu(n,t)}}function id(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ku(n,t))return;e.uniform3iv(this.addr,t),qu(n,t)}}function ad(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ku(n,t))return;e.uniform4iv(this.addr,t),qu(n,t)}}function od(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function sd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ku(n,t))return;e.uniform2uiv(this.addr,t),qu(n,t)}}function cd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ku(n,t))return;e.uniform3uiv(this.addr,t),qu(n,t)}}function ld(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ku(n,t))return;e.uniform4uiv(this.addr,t),qu(n,t)}}function ud(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(Iu.compareFunction=n.isReversedDepthBuffer()?518:515,a=Iu):a=Fu,n.setTexture2D(t||a,i)}function dd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Ru,i)}function fd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||zu,i)}function pd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Lu,i)}function md(e){switch(e){case 5126:return Yu;case 35664:return Xu;case 35665:return Zu;case 35666:return Qu;case 35674:return $u;case 35675:return ed;case 35676:return td;case 5124:case 35670:return nd;case 35667:case 35671:return rd;case 35668:case 35672:return id;case 35669:case 35673:return ad;case 5125:return od;case 36294:return sd;case 36295:return cd;case 36296:return ld;case 35678:case 36198:case 36298:case 36306:case 35682:return ud;case 35679:case 36299:case 36307:return dd;case 35680:case 36300:case 36308:case 36293:return fd;case 36289:case 36303:case 36311:case 36292:return pd}}function hd(e,t){e.uniform1fv(this.addr,t)}function gd(e,t){let n=Gu(t,this.size,2);e.uniform2fv(this.addr,n)}function _d(e,t){let n=Gu(t,this.size,3);e.uniform3fv(this.addr,n)}function vd(e,t){let n=Gu(t,this.size,4);e.uniform4fv(this.addr,n)}function yd(e,t){let n=Gu(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function bd(e,t){let n=Gu(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function xd(e,t){let n=Gu(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Sd(e,t){e.uniform1iv(this.addr,t)}function Cd(e,t){e.uniform2iv(this.addr,t)}function wd(e,t){e.uniform3iv(this.addr,t)}function Td(e,t){e.uniform4iv(this.addr,t)}function Ed(e,t){e.uniform1uiv(this.addr,t)}function Dd(e,t){e.uniform2uiv(this.addr,t)}function Od(e,t){e.uniform3uiv(this.addr,t)}function kd(e,t){e.uniform4uiv(this.addr,t)}function Ad(e,t,n){let r=this.cache,i=t.length,a=Ju(n,i);Ku(r,a)||(e.uniform1iv(this.addr,a),qu(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Iu:Fu;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function jd(e,t,n){let r=this.cache,i=t.length,a=Ju(n,i);Ku(r,a)||(e.uniform1iv(this.addr,a),qu(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Ru,a[e])}function Md(e,t,n){let r=this.cache,i=t.length,a=Ju(n,i);Ku(r,a)||(e.uniform1iv(this.addr,a),qu(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||zu,a[e])}function Nd(e,t,n){let r=this.cache,i=t.length,a=Ju(n,i);Ku(r,a)||(e.uniform1iv(this.addr,a),qu(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Lu,a[e])}function Pd(e){switch(e){case 5126:return hd;case 35664:return gd;case 35665:return _d;case 35666:return vd;case 35674:return yd;case 35675:return bd;case 35676:return xd;case 5124:case 35670:return Sd;case 35667:case 35671:return Cd;case 35668:case 35672:return wd;case 35669:case 35673:return Td;case 5125:return Ed;case 36294:return Dd;case 36295:return Od;case 36296:return kd;case 35678:case 36198:case 36298:case 36306:case 35682:return Ad;case 35679:case 36299:case 36307:return jd;case 35680:case 36300:case 36308:case 36293:return Md;case 36289:case 36303:case 36311:case 36292:return Nd}}var Fd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=md(t.type)}},Id=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Pd(t.type)}},Ld=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Rd=/(\w+)(\])?(\[|\.)?/g;function zd(e,t){e.seq.push(t),e.map[t.id]=t}function Bd(e,t,n){let r=e.name,i=r.length;for(Rd.lastIndex=0;;){let a=Rd.exec(r),o=Rd.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){zd(n,l===void 0?new Fd(s,e,t):new Id(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Ld(s),zd(n,e)),n=e}}}var Vd=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Bd(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Hd(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Ud=37297,Wd=0;function Gd(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Kd=new yi;function qd(e){wi._getMatrix(Kd,wi.workingColorSpace,e);let t=`mat3( ${Kd.elements.map(e=>e.toFixed(4))} )`;switch(wi.getTransfer(e)){case wr:return[t,`LinearTransferOETF`];case Tr:return[t,`sRGBTransferOETF`];default:return Lr(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Jd(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Gd(e.getShaderSource(t),r)}return i}function Yd(e,t){let n=qd(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Xd={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Zd(e,t){let n=Xd[t];return n===void 0?(Lr(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Qd=new G;function $d(){return wi.getLuminanceCoefficients(Qd),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Qd.x.toFixed(4)}, ${Qd.y.toFixed(4)}, ${Qd.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function ef(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(rf).join(`
`)}function tf(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function nf(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function rf(e){return e!==``}function af(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function of(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var sf=/^[ \t]*#include +<([\w\d./]+)>/gm;function cf(e){return e.replace(sf,uf)}var lf=new Map;function uf(e,t){let n=Jl[t];if(n===void 0){let e=lf.get(t);if(e!==void 0)n=Jl[e],Lr(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return cf(n)}var df=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ff(e){return e.replace(df,pf)}function pf(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function mf(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var hf={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function gf(e){return hf[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var _f={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function vf(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:_f[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var yf={302:`ENVMAP_MODE_REFRACTION`};function bf(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:yf[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var xf={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Sf(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:xf[e.combine]||`ENVMAP_BLENDING_NONE`}function Cf(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function wf(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=gf(n),l=vf(n),u=bf(n),d=Sf(n),f=Cf(n),p=ef(n),m=tf(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(rf).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(rf).join(`
`),_.length>0&&(_+=`
`)):(g=[mf(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(rf).join(`
`),_=[mf(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Jl.tonemapping_pars_fragment,n.toneMapping===0?``:Zd(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Jl.colorspace_pars_fragment,Yd(`linearToOutputTexel`,n.outputColorSpace),$d(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(rf).join(`
`)),o=cf(o),o=af(o,n),o=of(o,n),s=cf(s),s=af(s,n),s=of(s,n),o=ff(o),s=ff(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=Hd(i,i.VERTEX_SHADER,y),S=Hd(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=Jd(i,x,`vertex`),n=Jd(i,S,`fragment`);Rr(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):Lr(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Vd(i,h),T=nf(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,Ud)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Wd++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Tf=0,Ef=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Df(e),t.set(e,n)),n}},Df=class{constructor(e){this.id=Tf++,this.code=e,this.usedTimes=0}};function Of(e){return e===1030||e===37490||e===36285}function kf(e,t,n,r,i,a){let o=new Xi,s=new Ef,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&Lr(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=Yl[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),M=e.state.buffers.depth.getReversed(),N=h.isInstancedMesh===!0,P=h.isBatchedMesh===!0,F=!!i.map,ee=!!i.matcap,te=!!x,ne=!!i.aoMap,I=!!i.lightMap,re=!!i.bumpMap&&i.wireframe===!1,L=!!i.normalMap,R=!!i.displacementMap,z=!!i.emissiveMap,ie=!!i.metalnessMap,ae=!!i.roughnessMap,oe=i.anisotropy>0,se=i.clearcoat>0,ce=i.dispersion>0,le=i.retroreflectivity>0,ue=i.iridescence>0,de=i.sheen>0,fe=i.transmission>0,pe=oe&&!!i.anisotropyMap,me=se&&!!i.clearcoatMap,he=se&&!!i.clearcoatNormalMap,ge=se&&!!i.clearcoatRoughnessMap,_e=ue&&!!i.iridescenceMap,B=ue&&!!i.iridescenceThicknessMap,ve=de&&!!i.sheenColorMap,ye=de&&!!i.sheenRoughnessMap,be=!!i.specularMap,V=!!i.specularColorMap,xe=!!i.specularIntensityMap,H=fe&&!!i.transmissionMap,Se=fe&&!!i.thicknessMap,Ce=!!i.gradientMap,we=!!i.alphaMap,Te=i.alphaTest>0,Ee=!!i.alphaHash,De=!!i.extensions,Oe=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Oe=e.toneMapping);let ke={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:P,batchingColor:P&&h._colorsTexture!==null,instancing:N,instancingColor:N&&h.instanceColor!==null,instancingMorph:N&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:wi.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:F,matcap:ee,envMap:te,envMapMode:te&&x.mapping,envMapCubeUVHeight:S,aoMap:ne,lightMap:I,bumpMap:re,normalMap:L,displacementMap:R,emissiveMap:z,normalMapObjectSpace:L&&i.normalMapType===1,normalMapTangentSpace:L&&i.normalMapType===0,packedNormalMap:L&&i.normalMapType===0&&Of(i.normalMap.format),metalnessMap:ie,roughnessMap:ae,anisotropy:oe,anisotropyMap:pe,clearcoat:se,clearcoatMap:me,clearcoatNormalMap:he,clearcoatRoughnessMap:ge,dispersion:ce,retroreflection:le,iridescence:ue,iridescenceMap:_e,iridescenceThicknessMap:B,sheen:de,sheenColorMap:ve,sheenRoughnessMap:ye,specularMap:be,specularColorMap:V,specularIntensityMap:xe,transmission:fe,transmissionMap:H,thicknessMap:Se,gradientMap:Ce,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:we,alphaTest:Te,alphaHash:Ee,combine:i.combine,mapUv:F&&m(i.map.channel),aoMapUv:ne&&m(i.aoMap.channel),lightMapUv:I&&m(i.lightMap.channel),bumpMapUv:re&&m(i.bumpMap.channel),normalMapUv:L&&m(i.normalMap.channel),displacementMapUv:R&&m(i.displacementMap.channel),emissiveMapUv:z&&m(i.emissiveMap.channel),metalnessMapUv:ie&&m(i.metalnessMap.channel),roughnessMapUv:ae&&m(i.roughnessMap.channel),anisotropyMapUv:pe&&m(i.anisotropyMap.channel),clearcoatMapUv:me&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:he&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:_e&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:B&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:ve&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:ye&&m(i.sheenRoughnessMap.channel),specularMapUv:be&&m(i.specularMap.channel),specularColorMapUv:V&&m(i.specularColorMap.channel),specularIntensityMapUv:xe&&m(i.specularIntensityMap.channel),transmissionMapUv:H&&m(i.transmissionMap.channel),thicknessMapUv:Se&&m(i.thicknessMap.channel),alphaMapUv:we&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(L||oe),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(F||we),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&L===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:M,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Oe,decodeVideoTexture:F&&i.map.isVideoTexture===!0&&wi.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:z&&i.emissiveMap.isVideoTexture===!0&&wi.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:De&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(De&&i.extensions.multiDraw===!0||P)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return ke.vertexUv1s=c.has(1),ke.vertexUv2s=c.has(2),ke.vertexUv3s=c.has(3),c.clear(),ke}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=Yl[t];n=Oc.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new wf(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Af(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function jf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Mf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Nf(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||jf),r.length>1&&r.sort(t||Mf),i.length>1&&i.sort(t||Mf)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Pf(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Nf,e.set(t,[i])):n>=r.length?(i=new Nf,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Ff(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new G,color:new J};break;case`SpotLight`:n={position:new G,direction:new G,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new G,color:new J,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new G,skyColor:new J,groundColor:new J};break;case`RectAreaLight`:n={color:new J,position:new G,halfWidth:new G,halfHeight:new G}}return e[t.id]=n,n}}}function If(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Lf=0;function Rf(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function zf(e){let t=new Ff,n=If(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new G);let i=new G,a=new K,o=new K;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Rf);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Y.LTC_FLOAT_1,r.rectAreaLTC2=Y.LTC_FLOAT_2):(r.rectAreaLTC1=Y.LTC_HALF_1,r.rectAreaLTC2=Y.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Lf++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Bf(e){let t=new zf(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function Vf(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Bf(e),t.set(n,[a])):r>=i.length?(a=new Bf(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Hf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Uf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Wf=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],Gf=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],Kf=new K,qf=new G,Jf=new G;function Yf(e,t,n){let r=new qo,i=new W,a=new W,o=new Fi,s=new Ic,c=new Lc,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new jc({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new W},radius:{value:4}},vertexShader:Hf,fragmentShader:Uf}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new go;m.setAttribute(`position`,new eo(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Bo(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(Lr(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){Lr(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){Lr(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Li(i.x,i.y,{format:On,type:hn,minFilter:an,magFilter:an,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Xo(i.x,i.y,mn),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=wn,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=tn,d.map.depthTexture.magFilter=tn}else l.isPointLight?(d.map=new Tu(i.x),d.map.depthTexture=new Zo(i.x,pn)):(d.map=new Li(i.x,i.y),d.map.depthTexture=new Xo(i.x,i.y,pn)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=wn,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=an,d.map.depthTexture.magFilter=an):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=tn,d.map.depthTexture.magFilter=tn);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),qf.setFromMatrixPosition(l.matrixWorld),e.position.copy(qf),Jf.copy(e.position),Jf.add(Wf[t]),e.up.copy(Gf[t]),e.lookAt(Jf),e.updateMatrixWorld(),n.makeTranslation(-qf.x,-qf.y,-qf.z),Kf.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(Kf,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Li(i.x,i.y,{format:On,type:hn}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Xf(e,t){function n(){let t=!1,n=new Fi,r=null,i=new Fi(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ie(e.DEPTH_TEST):ae(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=Vr[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ie(e.STENCIL_TEST):ae(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,P=0,F=e.getParameter(e.VERSION);F.indexOf(`WebGL`)===-1?F.indexOf(`OpenGL ES`)!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),N=P>=2):(P=parseFloat(/^WebGL (\d)/.exec(F)[1]),N=P>=1);let ee=null,te={},ne=e.getParameter(e.SCISSOR_BOX),I=e.getParameter(e.VIEWPORT),re=new Fi().fromArray(ne),L=new Fi().fromArray(I);function R(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let z={};z[e.TEXTURE_2D]=R(e.TEXTURE_2D,e.TEXTURE_2D,1),z[e.TEXTURE_CUBE_MAP]=R(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),z[e.TEXTURE_2D_ARRAY]=R(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),z[e.TEXTURE_3D]=R(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ie(e.DEPTH_TEST),o.setFunc(3),pe(!1),me(1),ie(e.CULL_FACE),de(0);function ie(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ae(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function oe(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function se(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function ce(t){return h!==t&&(e.useProgram(t),h=t,!0)}let le={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};le[103]=e.MIN,le[104]=e.MAX;let ue={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function de(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(ae(e.BLEND),g=!1);return}if(g===!1&&(ie(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Rr(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:Rr(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:Rr(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:Rr(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(le[n],le[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(ue[r],ue[i],ue[o],ue[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function fe(t,n){t.side===2?ae(e.CULL_FACE):ie(e.CULL_FACE);let r=t.side===1;n&&(r=!r),pe(r),t.blending===1&&t.transparent===!1?de(0):de(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ge(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ie(e.SAMPLE_ALPHA_TO_COVERAGE):ae(e.SAMPLE_ALPHA_TO_COVERAGE)}function pe(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function me(t){t===0?ae(e.CULL_FACE):(ie(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function he(t){t!==k&&(N&&e.lineWidth(t),k=t)}function ge(t,n,r){t?(ie(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):ae(e.POLYGON_OFFSET_FILL)}function _e(t){t?ie(e.SCISSOR_TEST):ae(e.SCISSOR_TEST)}function B(t){t===void 0&&(t=e.TEXTURE0+M-1),ee!==t&&(e.activeTexture(t),ee=t)}function ve(t,n,r){r===void 0&&(r=ee===null?e.TEXTURE0+M-1:ee);let i=te[r];i===void 0&&(i={type:void 0,texture:void 0},te[r]=i),(i.type!==t||i.texture!==n)&&(ee!==r&&(e.activeTexture(r),ee=r),e.bindTexture(t,n||z[t]),i.type=t,i.texture=n)}function ye(){let t=te[ee];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function be(){try{e.compressedTexImage2D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function V(){try{e.compressedTexImage3D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function xe(){try{e.texSubImage2D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function H(){try{e.texSubImage3D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function Se(){try{e.compressedTexSubImage2D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function Ce(){try{e.compressedTexSubImage3D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function we(){try{e.texStorage2D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function Te(){try{e.texStorage3D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function Ee(){try{e.texImage2D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function De(){try{e.texImage3D(...arguments)}catch(e){Rr(`WebGLState:`,e)}}function Oe(t){return d[t]===void 0?e.getParameter(t):d[t]}function ke(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Ae(t){re.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),re.copy(t))}function je(t){L.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),L.copy(t))}function Me(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function U(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Ne(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},ee=null,te={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,re.set(0,0,e.canvas.width,e.canvas.height),L.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ie,disable:ae,bindFramebuffer:oe,drawBuffers:se,useProgram:ce,setBlending:de,setMaterial:fe,setFlipSided:pe,setCullFace:me,setLineWidth:he,setPolygonOffset:ge,setScissorTest:_e,activeTexture:B,bindTexture:ve,unbindTexture:ye,compressedTexImage2D:be,compressedTexImage3D:V,texImage2D:Ee,texImage3D:De,pixelStorei:ke,getParameter:Oe,updateUBOMapping:Me,uniformBlockBinding:U,texStorage2D:we,texStorage3D:Te,texSubImage2D:xe,texSubImage3D:H,compressedTexSubImage2D:Se,compressedTexSubImage3D:Ce,scissor:Ae,viewport:je,reset:Ne}}function Zf(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new W,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):Mr(`canvas`)}function g(e,t,n){let r=1,i=be(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),Lr(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&Lr(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];Lr(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||Lr(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?wr:wi.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,Lr(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function M(){let e=O;return e>=i.maxTextures&&Lr(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function N(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function P(t,i){let a=r.get(t);if(t.isVideoTexture&&ve(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)Lr(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)Lr(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ae(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function F(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){ae(a,t,i);return}t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function ee(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){ae(a,t,i);return}n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function te(t,i){let a=r.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version){oe(a,t,i);return}n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let ne={[Qt]:e.REPEAT,[$t]:e.CLAMP_TO_EDGE,[en]:e.MIRRORED_REPEAT},I={[tn]:e.NEAREST,[nn]:e.NEAREST_MIPMAP_NEAREST,[rn]:e.NEAREST_MIPMAP_LINEAR,[an]:e.LINEAR,[on]:e.LINEAR_MIPMAP_NEAREST,[sn]:e.LINEAR_MIPMAP_LINEAR},re={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function L(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&Lr(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,ne[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,ne[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,ne[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,I[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,I[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,re[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function R(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=N(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function z(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ie(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=z(n.start,r.width,4),c=z(t.start,r.width,4);n.start<=i+1&&a===c&&z(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function ae(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=R(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=wi.getPrimaries(wi.workingColorSpace),r=o.colorSpace===``?null:wi.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=ye(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);L(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===Tn,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ie(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=Wl(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else Lr(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?Lr(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=Wl(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=be(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=be(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function oe(t,o,s){if(o.image.length!==6)return;let c=R(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=wi.getPrimaries(wi.workingColorSpace),r=o.colorSpace===``?null:wi.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=ye(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);L(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?Lr(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=be(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function se(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),B(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,_e(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function ce(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;B(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,_e(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,_e(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);B(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,_e(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,_e(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function le(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),L(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else P(i.depthTexture,0);let u=l.__webglTexture,d=_e(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)B(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)B(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function ue(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)le(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?le(i.__webglFramebuffer[0],t,0):le(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),ce(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),ce(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function de(t,n,i){let a=r.get(t);n!==void 0&&se(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&ue(t)}function fe(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&B(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=_e(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),ce(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),L(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)se(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else se(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),L(c,a),se(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),L(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)se(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else se(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&ue(t)}function pe(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let me=[],he=[];function ge(t){if(t.samples>0){if(B(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(me.length=0,he.length=0,me.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(me.push(l),he.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,he)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,me))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function _e(e){return Math.min(i.maxSamples,e.samples)}function B(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function ve(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function ye(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(wi.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&Lr(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):Rr(`WebGLTextures: Unsupported texture color space:`,n)),t}function be(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=M,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=P,this.setTexture2DArray=F,this.setTexture3D=ee,this.setTextureCube=te,this.rebindTextures=de,this.setupRenderTarget=fe,this.updateRenderTargetMipmap=pe,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=ue,this.setupFrameBufferTexture=se,this.useMultisampledRTT=B,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Qf(e,t){function n(n,r=``){let i,a=wi.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var $f=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ep=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,tp=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Qo(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new jc({vertexShader:$f,fragmentShader:ep,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Bo(new yc(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},np=class extends Hr{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new tp,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new W,C=null,w=null,T=new gl;T.viewport=new Fi;let E=new gl;E.viewport=new Fi;let D=[T,E],O=new Cl,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new ma,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new ma,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new ma,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function M(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,M),r.removeEventListener(`inputsourceschange`,N);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,L.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&Lr(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&Lr(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,M),r.addEventListener(`inputsourceschange`,N),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?Tn:wn,a=_.stencil?vn:pn);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Li(d.textureWidth,d.textureHeight,{format:Cn,type:cn,depthTexture:new Xo(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Li(f.framebufferWidth,f.framebufferHeight,{format:Cn,type:cn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),L.setContext(r),L.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function N(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let P=new G,F=new G;function ee(e,t,n){P.setFromMatrixPosition(t.matrixWorld),F.setFromMatrixPosition(n.matrixWorld);let r=P.distanceTo(F),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function te(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;te(O,i);for(let e=0;e<a.length;e++)te(a[e],i);a.length===2?ee(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),ne(e,O,i)};function ne(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Kr*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let I=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new gl,o.layers.enable(n),o.viewport=new Fi,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new Qo,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}I&&I(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let L=new Kl;L.setAnimationLoop(re),this.setAnimationLoop=function(e){I=e},this.dispose=function(){}}},rp=new K,ip=new yi;ip.set(-1,0,0,0,1,0,0,0,1);function ap(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Dc(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(rp.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(ip),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function op(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return Rr(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?Lr(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):Lr(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var sp=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),cp=null;function lp(){return cp===null&&(cp=new Uo(sp,16,16,On,hn),cp.name=`DFG_LUT`,cp.minFilter=an,cp.magFilter=an,cp.wrapS=$t,cp.wrapT=$t,cp.generateMipmaps=!1,cp.needsUpdate=!0),cp}var up=class{constructor(e={}){let{canvas:t=Nr(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=cn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([An,kn,Dn]),g=new Set([cn,pn,dn,vn,gn,_n]),_=new Uint32Array(4),v=new Int32Array(4),y=new G,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Sr;let j=0,M=0,N=null,P=-1,F=null,ee=new Fi,te=new Fi,ne=null,I=new J(0),re=0,L=t.width,R=t.height,z=1,ie=null,ae=null,oe=new Fi(0,0,L,R),se=new Fi(0,0,L,R),ce=!1,le=new qo,ue=!1,de=!1,fe=new K,pe=new G,me=new Fi,he={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ge=!1;function _e(){return N===null?z:1}let B=n;function ve(e,n){return t.getContext(e,n)}let ye,be,V,xe,H,Se,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,U,Ne,Pe,Fe,Ie,Le,Re;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,Ve,!1),t.addEventListener(`webglcontextrestored`,He,!1),t.addEventListener(`webglcontextcreationerror`,Ue,!1),B===null){let t=`webgl2`;if(B=ve(t,e),B===null)throw ve(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}ze()}catch(e){throw t.removeEventListener(`webglcontextlost`,Ve,!1),t.removeEventListener(`webglcontextrestored`,He,!1),t.removeEventListener(`webglcontextcreationerror`,Ue,!1),Rr(`WebGLRenderer: `+e.message),e}function ze(){ye=new Du(B),ye.init(),Ie=new Qf(B,ye),be=new nu(B,ye,e,Ie),V=new Xf(B,ye),be.reversedDepthBuffer&&d&&V.buffers.depth.setReversed(!0),O=B.createFramebuffer(),k=B.createFramebuffer(),A=B.createFramebuffer(),xe=new Au(B),H=new Af,Se=new Zf(B,ye,V,H,be,Ie,xe),Ce=new Eu(T),we=new ql(B),Le=new eu(B,we),Te=new Ou(B,we,xe,Le),Ee=new Mu(B,Te,we,Le,xe),Ne=new ju(B,be,Se),je=new ru(H),De=new kf(T,Ce,ye,be,Le,je),Oe=new ap(T,H),ke=new Pf,Ae=new Vf(ye),U=new $l(T,Ce,V,Ee,p,s),Me=new Yf(T,Ee,be),Re=new op(B,xe,be,V),Pe=new tu(B,ye,xe),Fe=new ku(B,ye,xe),xe.programs=De.programs,T.capabilities=be,T.extensions=ye,T.properties=H,T.renderLists=ke,T.shadowMap=Me,T.state=V,T.info=xe}m!==1009&&(w=new Pu(m,t.width,t.height,o,r,i));let Be=new np(T,B);this.xr=Be,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let e=ye.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=ye.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(e){e!==void 0&&(z=e,this.setSize(L,R,!1))},this.getSize=function(e){return e.set(L,R)},this.setSize=function(e,n,r=!0){if(Be.isPresenting){Lr(`WebGLRenderer: Can't change size while VR device is presenting.`);return}L=e,R=n,t.width=Math.floor(e*z),t.height=Math.floor(n*z),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(L*z,R*z).floor()},this.setDrawingBufferSize=function(e,n,r){L=e,R=n,z=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009){Rr(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){Lr(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(ee)},this.getViewport=function(e){return e.copy(oe)},this.setViewport=function(e,t,n,r){e.isVector4?oe.set(e.x,e.y,e.z,e.w):oe.set(e,t,n,r),V.viewport(ee.copy(oe).multiplyScalar(z).round())},this.getScissor=function(e){return e.copy(se)},this.setScissor=function(e,t,n,r){e.isVector4?se.set(e.x,e.y,e.z,e.w):se.set(e,t,n,r),V.scissor(te.copy(se).multiplyScalar(z).round())},this.getScissorTest=function(){return ce},this.setScissorTest=function(e){V.setScissorTest(ce=e)},this.setOpaqueSort=function(e){ie=e},this.setTransparentSort=function(e){ae=e},this.getClearColor=function(e){return e.copy(U.getClearColor())},this.setClearColor=function(){U.setClearColor(...arguments)},this.getClearAlpha=function(){return U.getClearAlpha()},this.setClearAlpha=function(){U.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=U.getClearColor(),r=U.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,B.clearBufferuiv(B.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,B.clearBufferiv(B.COLOR,0,v))}else r|=B.COLOR_BUFFER_BIT}t&&(r|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&B.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Ve,!1),t.removeEventListener(`webglcontextrestored`,He,!1),t.removeEventListener(`webglcontextcreationerror`,Ue,!1),U.dispose(),ke.dispose(),Ae.dispose(),H.dispose(),Ce.dispose(),Ee.dispose(),Le.dispose(),Re.dispose(),De.dispose(),Be.dispose(),Be.removeEventListener(`sessionstart`,Xe),Be.removeEventListener(`sessionend`,Ze),Qe.stop()};function Ve(e){e.preventDefault(),Fr(`WebGLRenderer: Context Lost.`),E=!0}function He(){Fr(`WebGLRenderer: Context Restored.`),E=!1;let e=xe.autoReset,t=Me.enabled,n=Me.autoUpdate,r=Me.needsUpdate,i=Me.type;ze(),xe.autoReset=e,Me.enabled=t,Me.autoUpdate=n,Me.needsUpdate=r,Me.type=i}function Ue(e){Rr(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function We(e){let t=e.target;t.removeEventListener(`dispose`,We),Ge(t)}function Ge(e){Ke(e),H.remove(e)}function Ke(e){let t=H.get(e).programs;t!==void 0&&(t.forEach(function(e){De.releaseProgram(e)}),e.isShaderMaterial&&De.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=he);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=ct(e,t,n,r,i);V.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Te.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Le.setup(i,r,s,n,c);let h,g=Pe;if(c!==null&&(h=we.get(c),g=Fe,g.setIndex(h)),i.isMesh)r.wireframe===!0?(V.setLineWidth(r.wireframeLinewidth*_e()),g.setMode(B.LINES)):g.setMode(B.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),V.setLineWidth(e*_e()),i.isLineSegments?g.setMode(B.LINES):i.isLineLoop?g.setMode(B.LINE_LOOP):g.setMode(B.LINE_STRIP)}else i.isPoints?g.setMode(B.POINTS):i.isSprite&&g.setMode(B.TRIANGLES);if(i.isBatchedMesh){if(ye.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?we.get(c).bytesPerElement:1,o=H.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(B,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function qe(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),ue===!0&&je.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,it(e,t,r),e.side=0,e.needsUpdate=!0,it(e,t,r),e.side=2):it(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Ae.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),de=this.localClippingEnabled,ue=je.init(this.clippingPlanes,de),ue===!0&&je.setGlobalState(this.clippingPlanes,t),D!==null&&Me.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];qe(o,n,t,e),r.add(o)}else qe(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=H.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}ye.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Je=null;function Ye(e){Je&&Je(e)}function Xe(){Qe.stop()}function Ze(){Qe.start()}let Qe=new Kl;Qe.setAnimationLoop(Ye),typeof self<`u`&&Qe.setContext(self),this.setAnimationLoop=function(e){Je=e,Be.setAnimationLoop(e),e===null?Qe.stop():Qe.start()},Be.addEventListener(`sessionstart`,Xe),Be.addEventListener(`sessionend`,Ze),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){Rr(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Be.enabled===!0&&Be.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Be.enabled===!0&&Be.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Be.cameraAutoUpdate===!0&&Be.updateCamera(t),t=Be.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=Ae.get(e,C.length),x.init(t),x.state.textureUnits=Se.getTextureUnits(),C.push(x),fe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),le.setFromProjectionMatrix(fe,kr,t.reversedDepth),de=this.localClippingEnabled,ue=je.init(this.clippingPlanes,de),b=ke.get(e,S.length),b.init(),S.push(b),Be.enabled===!0&&Be.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&$e(e,t,-1/0,T.sortObjects)}$e(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(ie,ae),ge=Be.enabled===!1||Be.isPresenting===!1||Be.hasDepthSensing()===!1,ge&&U.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ue===!0&&je.beginShadows();let i=x.state.shadowsArray;if(Me.render(i,e,t),ue===!0&&je.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];tt(n,r,e,a)}ge&&U.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];et(b,e,n,n.viewport)}}else r.length>0&&tt(n,r,e,t),ge&&U.render(e),et(b,e,t)}N!==null&&M===0&&(Se.updateMultisampleRenderTarget(N),Se.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Le.resetDefaultState(),P=-1,F=null,C.pop(),C.length>0?(x=C[C.length-1],Se.setTextureUnits(x.state.textureUnits),ue===!0&&je.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function $e(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(le)){r&&me.setFromMatrixPosition(e.matrixWorld).applyMatrix4(fe);let i=Ee.update(e),a=e.material;a.visible&&b.push(e,i,a,n,me.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(le))){let i=Ee.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),me.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),me.copy(e.boundingSphere.center)),me.applyMatrix4(e.matrixWorld).applyMatrix4(fe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,me.z,s,t)}}else a.visible&&b.push(e,i,a,n,me.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)$e(i[e],t,n,r)}function et(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),ue===!0&&je.setGlobalState(T.clippingPlanes,n),r&&V.viewport(ee.copy(r)),i.length>0&&nt(i,t,n),a.length>0&&nt(a,t,n),o.length>0&&nt(o,t,n),V.buffers.depth.setTest(!0),V.buffers.depth.setMask(!0),V.buffers.color.setMask(!0),V.setPolygonOffset(!1)}function tt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=ye.has(`EXT_color_buffer_half_float`)||ye.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Li(1,1,{generateMipmaps:!0,type:e?hn:cn,minFilter:sn,samples:Math.max(4,be.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:wi.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||ee;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(I),re=T.getClearAlpha(),re<1&&T.setClearColor(16777215,.5),T.clear(),ge&&U.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),ue===!0&&je.setGlobalState(T.clippingPlanes,r),nt(e,n,r),Se.updateMultisampleRenderTarget(a),Se.updateRenderTargetMipmap(a),ye.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,rt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(Se.updateMultisampleRenderTarget(a),Se.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(I,re),d!==void 0&&(r.viewport=d),T.toneMapping=u}function nt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&rt(o,t,n,s,l,c)}}function rt(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function it(e,t,n){t.isScene!==!0&&(t=he);let r=H.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=De.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=De.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ce.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,We),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ot(e,s),d}else s.uniforms=De.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=De.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=je.uniform),ot(e,s),r.needsLights=ut(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function at(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Vd.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ot(e,t){let n=H.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function st(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function ct(e,t,n,r,i){t.isScene!==!0&&(t=he),Se.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:wi.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ce.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=H.get(r),y=x.state.lights;if(ue===!0&&(de===!0||e!==F)){let t=e===F&&r.id===P;je.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==je.numPlanes||v.numIntersection!==je.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=it(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(V.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==P&&(P=r.id,w=!0),v.needsLights){let e=st(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||F!==e){V.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(B,`projectionMatrix`,e.projectionMatrix),O.setValue(B,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(B,pe.setFromMatrixPosition(e.matrixWorld)),be.logarithmicDepthBuffer&&O.setValue(B,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(B,`isOrthographic`,e.isOrthographicCamera===!0),F!==e&&(F=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(B,`sunShadowMap`,y.state.sunShadowMap,Se),y.state.directionalShadowMap.length>0&&O.setValue(B,`directionalShadowMap`,y.state.directionalShadowMap,Se),y.state.spotShadowMap.length>0&&O.setValue(B,`spotShadowMap`,y.state.spotShadowMap,Se),y.state.pointShadowMap.length>0&&O.setValue(B,`pointShadowMap`,y.state.pointShadowMap,Se)),i.isSkinnedMesh){O.setOptional(B,i,`bindMatrix`),O.setOptional(B,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(B,`boneTexture`,e.boneTexture,Se))}i.isBatchedMesh&&(O.setOptional(B,i,`batchingTexture`),O.setValue(B,`batchingTexture`,i._matricesTexture,Se),O.setOptional(B,i,`batchingIdTexture`),O.setValue(B,`batchingIdTexture`,i._indirectTexture,Se),O.setOptional(B,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(B,`batchingColorTexture`,i._colorsTexture,Se));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Ne.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(B,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=lp()),w){if(O.setValue(B,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&lt(k,E),a&&r.fog===!0&&Oe.refreshFogUniforms(k,a),Oe.refreshMaterialUniforms(k,r,z,R,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}Vd.upload(B,at(v),k,Se)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Vd.upload(B,at(v),k,Se),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(B,`center`,i.center),O.setValue(B,`modelViewMatrix`,i.modelViewMatrix),O.setValue(B,`normalMatrix`,i.normalMatrix),O.setValue(B,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Re.update(n,S),Re.bind(n,S)}}return S}function lt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function ut(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=H.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),H.get(e.texture).__webglTexture=t,H.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=H.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,j=t,M=n;let r=null,i=!1,a=!1;if(e){let o=H.get(e);if(o.__useDefaultFramebuffer!==void 0){V.bindFramebuffer(B.FRAMEBUFFER,o.__webglFramebuffer),ee.copy(e.viewport),te.copy(e.scissor),ne=e.scissorTest,V.viewport(ee),V.scissor(te),V.setScissorTest(ne),P=-1;return}if(o.__webglFramebuffer===void 0)Se.setupRenderTarget(e);else if(o.__hasExternalTextures)Se.rebindTextures(e,H.get(e.texture).__webglTexture,H.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&H.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);Se.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=H.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&Se.useMultisampledRTT(e)===!1?H.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ee.copy(e.viewport),te.copy(e.scissor),ne=e.scissorTest}else ee.copy(oe).multiplyScalar(z).floor(),te.copy(se).multiplyScalar(z).floor(),ne=ce;if(n!==0&&(r=O),V.bindFramebuffer(B.FRAMEBUFFER,r)&&V.drawBuffers(e,r),V.viewport(ee),V.scissor(te),V.setScissorTest(ne),i){let r=H.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=H.get(e.textures[t]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=H.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,t.__webglTexture,n)}P=-1};function dt(e){let t=H.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=be.textureFormatReadable(e.format),t.__typeReadable=be.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){Rr(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=H.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){V.bindFramebuffer(B.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+s);let u=dt(o);if(u.__formatReadable===!1){Rr(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){Rr(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&B.readPixels(t,n,r,i,Ie.convert(c),Ie.convert(l),a)}finally{let e=N===null?null:H.get(N).__webglFramebuffer;V.bindFramebuffer(B.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=H.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){V.bindFramebuffer(B.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+s);let d=dt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.bufferData(B.PIXEL_PACK_BUFFER,a.byteLength,B.STREAM_READ),B.readPixels(t,n,r,i,Ie.convert(l),Ie.convert(u),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let p=N===null?null:H.get(N).__webglFramebuffer;V.bindFramebuffer(B.FRAMEBUFFER,p);let m=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Br(B,m,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,a),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(f),B.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;Se.setTexture2D(e,0),B.copyTexSubImage2D(B.TEXTURE_2D,n,0,0,o,s,i,a),V.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ie.convert(t.format),_=Ie.convert(t.type),v;t.isData3DTexture?(Se.setTexture3D(t,0),v=B.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(Se.setTexture2DArray(t,0),v=B.TEXTURE_2D_ARRAY):(Se.setTexture2D(t,0),v=B.TEXTURE_2D),V.activeTexture(B.TEXTURE0),V.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,t.flipY),V.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),V.pixelStorei(B.UNPACK_ALIGNMENT,t.unpackAlignment);let y=V.getParameter(B.UNPACK_ROW_LENGTH),b=V.getParameter(B.UNPACK_IMAGE_HEIGHT),x=V.getParameter(B.UNPACK_SKIP_PIXELS),S=V.getParameter(B.UNPACK_SKIP_ROWS),C=V.getParameter(B.UNPACK_SKIP_IMAGES);V.pixelStorei(B.UNPACK_ROW_LENGTH,h.width),V.pixelStorei(B.UNPACK_IMAGE_HEIGHT,h.height),V.pixelStorei(B.UNPACK_SKIP_PIXELS,l),V.pixelStorei(B.UNPACK_SKIP_ROWS,u),V.pixelStorei(B.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=H.get(e),r=H.get(t),h=H.get(n.__renderTarget),g=H.get(r.__renderTarget);V.bindFramebuffer(B.READ_FRAMEBUFFER,h.__webglFramebuffer),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(e).__webglTexture,i,d+n),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(t).__webglTexture,a,m+n)),B.blitFramebuffer(l,u,o,s,f,p,o,s,B.DEPTH_BUFFER_BIT,B.NEAREST);V.bindFramebuffer(B.READ_FRAMEBUFFER,null),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||H.has(e)){let n=H.get(e),r=H.get(t);V.bindFramebuffer(B.READ_FRAMEBUFFER,k),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,n.__webglTexture,i),T?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,r.__webglTexture,a),i===0?T?B.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):B.copyTexSubImage2D(v,a,f,p,l,u,o,s):B.blitFramebuffer(l,u,o,s,f,p,o,s,B.COLOR_BUFFER_BIT,B.NEAREST);V.bindFramebuffer(B.READ_FRAMEBUFFER,null),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?B.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h);V.pixelStorei(B.UNPACK_ROW_LENGTH,y),V.pixelStorei(B.UNPACK_IMAGE_HEIGHT,b),V.pixelStorei(B.UNPACK_SKIP_PIXELS,x),V.pixelStorei(B.UNPACK_SKIP_ROWS,S),V.pixelStorei(B.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&B.generateMipmap(v),V.unbindTexture()},this.initRenderTarget=function(e){H.get(e).__webglFramebuffer===void 0&&Se.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?Se.setTextureCube(e,0):e.isData3DTexture?Se.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?Se.setTexture2DArray(e,0):Se.setTexture2D(e,0),V.unbindTexture()},this.resetState=function(){j=0,M=0,N=null,V.reset(),Le.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return kr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=wi._getDrawingBufferColorSpace(e),t.unpackColorSpace=wi._getUnpackColorSpace()}},dp={type:`change`},fp={type:`start`},pp={type:`end`},mp=new Do,hp=new bo,gp=Math.cos(70*hi.DEG2RAD),_p=new G,vp=2*Math.PI,yp={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},bp=1e-6,xp=class extends Ul{constructor(e,t=null){super(e,t),this.state=yp.NONE,this.target=new G,this.cursor=new G,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:Xt.ROTATE,MIDDLE:Xt.DOLLY,RIGHT:Xt.PAN},this.touches={ONE:Zt.ROTATE,TWO:Zt.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new G,this._lastQuaternion=new gi,this._lastTargetPosition=new G,this._quat=new gi().setFromUnitVectors(e.up,new G(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Hl,this._sphericalDelta=new Hl,this._scale=1,this._panOffset=new G,this._rotateStart=new W,this._rotateEnd=new W,this._rotateDelta=new W,this._panStart=new W,this._panEnd=new W,this._panDelta=new W,this._dollyStart=new W,this._dollyEnd=new W,this._dollyDelta=new W,this._dollyDirection=new G,this._mouse=new W,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Cp.bind(this),this._onPointerDown=Sp.bind(this),this._onPointerUp=wp.bind(this),this._onContextMenu=jp.bind(this),this._onMouseWheel=Dp.bind(this),this._onKeyDown=Op.bind(this),this._onTouchStart=kp.bind(this),this._onTouchMove=Ap.bind(this),this._onMouseDown=Tp.bind(this),this._onMouseMove=Ep.bind(this),this._interceptControlDown=Mp.bind(this),this._interceptControlUp=Np.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=yp.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(dp),this.update(),this.state=yp.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;_p.copy(t).sub(this.target),_p.applyQuaternion(this._quat),this._spherical.setFromVector3(_p),this.autoRotate&&this.state===yp.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=vp:n>Math.PI&&(n-=vp),r<-Math.PI?r+=vp:r>Math.PI&&(r-=vp),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(_p.setFromSpherical(this._spherical),_p.applyQuaternion(this._quatInverse),t.copy(this.target).add(_p),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=_p.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new G(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new G(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=_p.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(mp.origin.copy(this.object.position),mp.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(mp.direction))<gp?this.object.lookAt(this.target):(hp.setFromNormalAndCoplanarPoint(this.object.up,this.target),mp.intersectPlane(hp,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>bp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>bp||this._lastTargetPosition.distanceToSquared(this.target)>bp?(this.dispatchEvent(dp),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?vp/60/60*this.autoRotateSpeed:vp/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){_p.setFromMatrixColumn(t,0),_p.multiplyScalar(-e),this._panOffset.add(_p)}_panUp(e,t){this.screenSpacePanning===!0?_p.setFromMatrixColumn(t,1):(_p.setFromMatrixColumn(t,0),_p.crossVectors(this.object.up,_p)),_p.multiplyScalar(e),this._panOffset.add(_p)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;_p.copy(r).sub(this.target);let i=_p.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(vp*this._rotateDelta.x/t.clientHeight),this._rotateUp(vp*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(vp*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-vp*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(vp*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-vp*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(vp*this._rotateDelta.x/t.clientHeight),this._rotateUp(vp*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new W,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Sp(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Cp(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function wp(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(pp),this.state=yp.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Tp(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Xt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=yp.DOLLY;break;case Xt.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=yp.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=yp.ROTATE}break;case Xt.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=yp.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=yp.PAN}break;default:this.state=yp.NONE}this.state!==yp.NONE&&this.dispatchEvent(fp)}function Ep(e){switch(this.state){case yp.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case yp.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case yp.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function Dp(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===yp.NONE&&(e.preventDefault(),this.dispatchEvent(fp),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(pp))}function Op(e){this.enabled!==!1&&this._handleKeyDown(e)}function kp(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Zt.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=yp.TOUCH_ROTATE;break;case Zt.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=yp.TOUCH_PAN;break;default:this.state=yp.NONE}break;case 2:switch(this.touches.TWO){case Zt.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=yp.TOUCH_DOLLY_PAN;break;case Zt.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=yp.TOUCH_DOLLY_ROTATE;break;default:this.state=yp.NONE}break;default:this.state=yp.NONE}this.state!==yp.NONE&&this.dispatchEvent(fp)}function Ap(e){switch(this._trackPointer(e),this.state){case yp.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case yp.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case yp.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case yp.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=yp.NONE}}function jp(e){this.enabled!==!1&&e.preventDefault()}function Mp(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function Np(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var Pp={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},Fp=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Ip=new _l(-1,1,1,-1,0,1),Lp=new class extends go{constructor(){super(),this.setAttribute(`position`,new ro([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new ro([0,2,0,0,2,0],2))}},Rp=class{constructor(e){this._mesh=new Bo(Lp,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ip)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},zp=class extends Fp{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof jc?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Oc.clone(e.uniforms),this.material=new jc({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Rp(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Bp=class extends Fp{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Vp=class extends Fp{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Hp=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new W);this._width=n.width,this._height=n.height,t=new Li(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:hn}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new zp(Pp),this.copyPass.material.blending=0,this.timer=new wl}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Bp!==void 0&&(r instanceof Bp?n=!0:r instanceof Vp&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new W);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Up=class extends Fp{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new J}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Wp={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new W},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new K},cameraProjectionMatrixInverse:{value:new K},cameraWorldMatrix:{value:new K},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new G(-1,-1,-1)},sceneBoxMax:{value:new G(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},Gp={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},Kp={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function qp(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=Jp(t),r=n.length,i=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],a=2*Math.PI*t/r,o=new G(Math.cos(a),Math.sin(a),0).normalize();i[e*4]=(o.x*.5+.5)*255,i[e*4+1]=(o.y*.5+.5)*255,i[e*4+2]=127,i[e*4+3]=255}let a=new Uo(i,t,t);return a.wrapS=Qt,a.wrapT=Qt,a.needsUpdate=!0,a}function Jp(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var Yp={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:Xp(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new W},cameraProjectionMatrixInverse:{value:new K},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function Xp(e,t,n){let r=Zp(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function Zp(e,t,n){let r=[];for(let i=0;i<e;i++){let a=2*Math.PI*t*i/e,o=(i/(e-1))**n;r.push(new G(Math.cos(a),Math.sin(a),o))}return r}var Qp=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,A=v-w+2*d,j=g-1+3*d,M=_-1+3*d,N=v-1+3*d,P=c&255,F=l&255,ee=u&255,te=this.perm[P+this.perm[F+this.perm[ee]]]%12,ne=this.perm[P+y+this.perm[F+b+this.perm[ee+x]]]%12,I=this.perm[P+S+this.perm[F+C+this.perm[ee+w]]]%12,re=this.perm[P+1+this.perm[F+1+this.perm[ee+1]]]%12,L=.6-g*g-_*_-v*v;L<0?r=0:(L*=L,r=L*L*this._dot3(this.grad3[te],g,_,v));let R=.6-T*T-E*E-D*D;R<0?i=0:(R*=R,i=R*R*this._dot3(this.grad3[ne],T,E,D));let z=.6-O*O-k*k-A*A;z<0?a=0:(z*=z,a=z*z*this._dot3(this.grad3[I],O,k,A));let ie=.6-j*j-M*M-N*N;return ie<0?o=0:(ie*=ie,o=ie*ie*this._dot3(this.grad3[re],j,M,N)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,A=T>E?8:0,j=w>D?4:0,M=T>D?2:0,N=+(E>D),P=O+k+A+j+M+N,F=+(a[P][0]>=3),ee=+(a[P][1]>=3),te=+(a[P][2]>=3),ne=+(a[P][3]>=3),I=+(a[P][0]>=2),re=+(a[P][1]>=2),L=+(a[P][2]>=2),R=+(a[P][3]>=2),z=+(a[P][0]>=1),ie=+(a[P][1]>=1),ae=+(a[P][2]>=1),oe=+(a[P][3]>=1),se=w-F+c,ce=T-ee+c,le=E-te+c,ue=D-ne+c,de=w-I+2*c,fe=T-re+2*c,pe=E-L+2*c,me=D-R+2*c,he=w-z+3*c,ge=T-ie+3*c,_e=E-ae+3*c,B=D-oe+3*c,ve=w-1+4*c,ye=T-1+4*c,be=E-1+4*c,V=D-1+4*c,xe=h&255,H=g&255,Se=_&255,Ce=v&255,we=o[xe+o[H+o[Se+o[Ce]]]]%32,Te=o[xe+F+o[H+ee+o[Se+te+o[Ce+ne]]]]%32,Ee=o[xe+I+o[H+re+o[Se+L+o[Ce+R]]]]%32,De=o[xe+z+o[H+ie+o[Se+ae+o[Ce+oe]]]]%32,Oe=o[xe+1+o[H+1+o[Se+1+o[Ce+1]]]]%32,ke=.6-w*w-T*T-E*E-D*D;ke<0?l=0:(ke*=ke,l=ke*ke*this._dot4(i[we],w,T,E,D));let Ae=.6-se*se-ce*ce-le*le-ue*ue;Ae<0?u=0:(Ae*=Ae,u=Ae*Ae*this._dot4(i[Te],se,ce,le,ue));let je=.6-de*de-fe*fe-pe*pe-me*me;je<0?d=0:(je*=je,d=je*je*this._dot4(i[Ee],de,fe,pe,me));let Me=.6-he*he-ge*ge-_e*_e-B*B;Me<0?f=0:(Me*=Me,f=Me*Me*this._dot4(i[De],he,ge,_e,B));let U=.6-ve*ve-ye*ye-be*be-V*V;return U<0?p=0:(U*=U,p=U*U*this._dot4(i[Oe],ve,ye,be,V)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},$p=class e extends Fp{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=qp(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new Li(this.width,this.height,{type:hn,depthBuffer:!1}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new jc({defines:Object.assign({},Wp.defines),uniforms:Oc.clone(Wp.uniforms),vertexShader:Wp.vertexShader,fragmentShader:Wp.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new Fc,this.normalMaterial.blending=0,this.pdMaterial=new jc({defines:Object.assign({},Yp.defines),uniforms:Oc.clone(Yp.uniforms),vertexShader:Yp.vertexShader,fragmentShader:Yp.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new jc({defines:Object.assign({},Gp.defines),uniforms:Oc.clone(Gp.uniforms),vertexShader:Gp.vertexShader,fragmentShader:Gp.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new jc({uniforms:Oc.clone(Pp.uniforms),vertexShader:Pp.vertexShader,fragmentShader:Pp.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new jc({uniforms:Oc.clone(Kp.uniforms),vertexShader:Kp.vertexShader,fragmentShader:Kp.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new Rp(null),this._originalClearColor=new J,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new Xo,this.depthTexture.format=Tn,this.depthTexture.type=vn,this.normalRenderTarget=new Li(this.width,this.height,{minFilter:tn,magFilter:tn,type:hn,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=Xp(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new Qp,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new Uo(r,e,e,Cn,cn);return i.wrapS=Qt,i.wrapT=Qt,i.needsUpdate=!0,i}};$p.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var em={name:`BokehShader`,defines:{DEPTH_PACKING:1,PERSPECTIVE_CAMERA:1},uniforms:{tColor:{value:null},tDepth:{value:null},focus:{value:1},aspect:{value:1},aperture:{value:.025},maxblur:{value:.01},nearClip:{value:1},farClip:{value:1e3}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		#include <common>

		varying vec2 vUv;

		uniform sampler2D tColor;
		uniform sampler2D tDepth;

		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field

		uniform float nearClip;
		uniform float farClip;

		uniform float focus;
		uniform float aspect;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}


		void main() {

			vec2 aspectcorrect = vec2( 1.0, aspect );

			float viewZ = getViewZ( getDepth( vUv ) );

			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation

			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );

			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;

			vec4 col = vec4( 0.0 );

			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;

		}`},tm=class extends Fp{constructor(e,t,n){super(),this.scene=e,this.camera=t;let r=n.focus===void 0?1:n.focus,i=n.aperture===void 0?.025:n.aperture,a=n.maxblur===void 0?1:n.maxblur;this._renderTargetDepth=new Li(1,1,{minFilter:tn,magFilter:tn,type:hn}),this._renderTargetDepth.texture.name=`BokehPass.depth`,this._materialDepth=new Ic,this._materialDepth.depthPacking=xr,this._materialDepth.blending=0;let o=Oc.clone(em.uniforms);o.tDepth.value=this._renderTargetDepth.texture,o.focus.value=r,o.aspect.value=t.aspect,o.aperture.value=i,o.maxblur.value=a,o.nearClip.value=t.near,o.farClip.value=t.far,this.materialBokeh=new jc({defines:Object.assign({},em.defines),uniforms:o,vertexShader:em.vertexShader,fragmentShader:em.fragmentShader}),this.uniforms=o,this._fsQuad=new Rp(this.materialBokeh),this._oldClearColor=new J}render(e,t,n){this.scene.overrideMaterial=this._materialDepth,e.getClearColor(this._oldClearColor);let r=e.getClearAlpha(),i=e.autoClear;e.autoClear=!1,e.setClearColor(16777215),e.setClearAlpha(1),e.setRenderTarget(this._renderTargetDepth),e.clear(),e.render(this.scene,this.camera),this.uniforms.tColor.value=n.texture,this.uniforms.nearClip.value=this.camera.near,this.uniforms.farClip.value=this.camera.far,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),e.clear(),this._fsQuad.render(e)),this.scene.overrideMaterial=null,e.setClearColor(this._oldClearColor),e.setClearAlpha(r),e.autoClear=i}setSize(e,t){this.materialBokeh.uniforms.aspect.value=e/t,this._renderTargetDepth.setSize(e,t)}dispose(){this._renderTargetDepth.dispose(),this._materialDepth.dispose(),this.materialBokeh.dispose(),this._fsQuad.dispose()}},nm={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},rm=class extends Fp{constructor(){super(),this.isOutputPass=!0,this.uniforms=Oc.clone(nm.uniforms),this.material=new Mc({name:nm.name,uniforms:this.uniforms,vertexShader:nm.vertexShader,fragmentShader:nm.fragmentShader}),this._fsQuad=new Rp(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},wi.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},im=new G;function am(e,t,n,r,i,a){let o=2*Math.PI*i/4,s=Math.max(a-2*i,0),c=Math.PI/4;im.copy(t),im[r]=0,im.normalize();let l=.5*o/(o+s),u=1-im.angleTo(e)/c;return Math.sign(im[n])===1?u*l:s/(o+s)+l+l*(1-u)}var om=class e extends $o{constructor(e=1,t=1,n=1,r=2,i=.1){let a=r*2+1;if(i=Math.min(e/2,t/2,n/2,i),super(1,1,1,a,a,a),this.type=`RoundedBoxGeometry`,this.parameters={width:e,height:t,depth:n,segments:r,radius:i},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let s=new G,c=new G,l=new G(e,t,n).divideScalar(2).subScalar(i),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,p=u.length/6,m=new G,h=.5/a;for(let r=0,a=0;r<u.length;r+=3,a+=2)switch(s.fromArray(u,r),c.copy(s),c.x-=Math.sign(c.x)*h,c.y-=Math.sign(c.y)*h,c.z-=Math.sign(c.z)*h,c.normalize(),u[r+0]=l.x*Math.sign(s.x)+c.x*i,u[r+1]=l.y*Math.sign(s.y)+c.y*i,u[r+2]=l.z*Math.sign(s.z)+c.z*i,d[r+0]=c.x,d[r+1]=c.y,d[r+2]=c.z,Math.floor(r/p)){case 0:m.set(1,0,0),f[a+0]=am(m,c,`z`,`y`,i,n),f[a+1]=1-am(m,c,`y`,`z`,i,t);break;case 1:m.set(-1,0,0),f[a+0]=1-am(m,c,`z`,`y`,i,n),f[a+1]=1-am(m,c,`y`,`z`,i,t);break;case 2:m.set(0,1,0),f[a+0]=1-am(m,c,`x`,`z`,i,e),f[a+1]=am(m,c,`z`,`x`,i,n);break;case 3:m.set(0,-1,0),f[a+0]=1-am(m,c,`x`,`z`,i,e),f[a+1]=1-am(m,c,`z`,`x`,i,n);break;case 4:m.set(0,0,1),f[a+0]=1-am(m,c,`x`,`y`,i,e),f[a+1]=1-am(m,c,`y`,`x`,i,t);break;case 5:m.set(0,0,-1),f[a+0]=am(m,c,`x`,`y`,i,e),f[a+1]=1-am(m,c,`y`,`x`,i,t)}}static fromJSON(t){return new e(t.width,t.height,t.depth,t.segments,t.radius)}};function sm(e){let t=new Uint8Array(65536),n=41,r=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296);for(let n=0;n<128;n++){let i=r();for(let a=0;a<128;a++){let o=Math.round(160+(e?i*58+r()*14:r()*60)),s=(n*128+a)*4;t[s]=t[s+1]=t[s+2]=o,t[s+3]=255}}let i=new Uo(t,128,128);return i.wrapS=i.wrapT=Qt,i.magFilter=an,i.minFilter=sn,i.generateMipmaps=!0,i.anisotropy=4,i.repeat.set(e?2:5,5),i.needsUpdate=!0,i}var cm=sm(!0),lm=sm(!1),um=(e,t,n,r,i,a=.012)=>{let o=new Nc({color:t,metalness:n,roughness:r,...i?{bumpMap:i,bumpScale:a}:{}});return o.name=e,o},X={base:um(`Anodized graphite`,3817025,1,.5,lm,.024),body:um(`Powder coated aluminium`,2632750,0,.62,lm,.027),edge:um(`Machined edge`,13949147,1,.24,cm),silver:um(`Brushed aluminium`,13159888,1,.4,cm,.018),dark:um(`Black oxide steel`,2895923,1,.42),polymer:um(`Glass-filled PBT`,1776927,0,.5),bore:um(`Tapped bore`,460808,0,1),rubber:um(`Elastomer`,1447960,0,.82,lm,.01),ivory:um(`Molded nylon`,14605523,0,.45,lm,.008),gold:um(`Contact plating`,15320190,1,.2),amber:um(`Safety marking`,13924918,0,.58)},dm=new G(-2,34,.3),fm=21.6;function pm(e,t){let n=t??{yaw:0,shoulder:new G,elbow:new G,wrist:new G,flange:new G,reach:0};n.flange.copy(e),n.wrist.set(e.x,e.y,e.z+16),n.shoulder.set(dm.x,dm.y,dm.z+38);let r=n.wrist.x-n.shoulder.x,i=n.wrist.y-n.shoulder.y,a=n.wrist.z-n.shoulder.z,o=Math.hypot(r,i),s=Math.atan2(i,r);n.yaw=t?t.yaw+hi.euclideanModulo(s-t.yaw+Math.PI,2*Math.PI)-Math.PI:s;let c=Math.min(Math.hypot(o,a),85.999);n.reach=c/86;let l=hi.clamp((c*c-2116-1600)/3680,-1,1),u=Math.acos(l),d=Math.atan2(a,o)+Math.atan2(40*Math.sin(u),46+40*Math.cos(u)),f=Math.cos(n.yaw),p=Math.sin(n.yaw);return n.elbow.set(n.shoulder.x+f*46*Math.cos(d),n.shoulder.y+p*46*Math.cos(d),n.shoulder.z+46*Math.sin(d)),n}function mm(){let e=new Pc({color:15527144,roughness:.34,metalness:0,clearcoat:.35,clearcoatRoughness:.22,envMapIntensity:1.3});e.name=`Cobot satin white`;let t=new Pc({color:1842463,roughness:.58,metalness:0,clearcoat:.12,clearcoatRoughness:.5});t.name=`Joint cap black`;let n=new Pc({color:15132643,roughness:.4,metalness:0,clearcoat:.35,clearcoatRoughness:.25});n.name=`Joint cap face`;let r=new Nc({color:14704668,roughness:.4,metalness:0});return r.name=`Flange ring orange`,{paint:e,cap:t,capFace:n,accent:r}}var hm=new G(0,1,0),gm=new G(0,0,1);function _m(e,t,n,r,i=64){let a=Math.min(r,e*.45,(n-t)*.45),o=[new W(0,t)];for(let n=0;n<=8;n++){let r=n/8*Math.PI/2;o.push(new W(e-a+Math.sin(r)*a,t+a-Math.cos(r)*a))}for(let t=0;t<=8;t++){let r=t/8*Math.PI/2;o.push(new W(e-a+Math.cos(r)*a,n-a+Math.sin(r)*a))}return o.push(new W(0,n)),new vc(o,i)}var vm=(e,t=72)=>new vc(e.map(([e,t])=>new W(e,t)),t);function ym(e){let t=[[e*.6,-.05],[e*.985,-.05],[e*.985,.25]];for(let n=0;n<=6;n++){let r=n/6*Math.PI/2;t.push([e*.985-.5+Math.cos(r)*.5,.25+Math.sin(r)*.5])}return t.push([e*.66,.75],[e*.64,.6],[e*.6,.45]),vm(t)}function bm(e){return vm([[0,.95],[e*.3,.92],[e*.5,.84],[e*.565,.74],[e*.585,.6],[e*.6,.45],[e*.6,.3]].reverse())}function xm(e,t,n,r,i=64){let a=[new W(0,0)],o=e=>{let t=hi.clamp(1-e/.3,0,1);return t*t*(3-2*t)};for(let i=0;i<=48;i++){let s=i/48;a.push(new W(n+(t-n)*o(s)+(r-n)*o(1-s),s*e))}return a.push(new W(0,e)),new vc(a,i)}var Sm=class{geometry=new go;mesh;curve;segments;sides=8;radius;p=new G;t=new G;n=new G;b=new G;ref=new G;constructor(e,t,n=.55,r=56){this.radius=n,this.segments=r,this.curve=new us(Array.from({length:t},()=>new G),!1,`centripetal`);let i=[];for(let e=0;e<r;e++)for(let t=0;t<this.sides;t++){let n=e*(this.sides+1)+t,r=n+this.sides+1;i.push(n,r,n+1,r,r+1,n+1)}let a=(r+1)*(this.sides+1)*3;this.geometry.setAttribute(`position`,new eo(new Float32Array(a),3).setUsage(Or)),this.geometry.setAttribute(`normal`,new eo(new Float32Array(a),3).setUsage(Or)),this.geometry.setIndex(i),this.mesh=new Bo(this.geometry,e),this.mesh.name=`Arm cable`,this.mesh.castShadow=!0,this.mesh.frustumCulled=!1}samples=[];last=[];update(e){let t=this.last;if(t.length===e.length*3&&e.every((e,n)=>Math.abs(e.x-t[n*3])<1e-6&&Math.abs(e.y-t[n*3+1])<1e-6&&Math.abs(e.z-t[n*3+2])<1e-6))return;this.last=e.flatMap(e=>[e.x,e.y,e.z]),e.forEach((e,t)=>this.curve.points[t].copy(e));let n=this.segments,r=this.samples;for(;r.length<=n;)r.push(new G);for(let e=0;e<=n;e++)this.curve.getPoint(e/n,r[e]);let i=this.geometry.attributes.position,a=this.geometry.attributes.normal;for(let e=0;e<=n;e++){this.p.copy(r[e]),this.t.subVectors(r[Math.min(n,e+1)],r[Math.max(0,e-1)]),this.t.lengthSq()<1e-12?this.t.set(0,0,1):this.t.normalize(),this.ref.copy(Math.abs(this.t.z)>.9?hm:gm),this.n.crossVectors(this.ref,this.t).normalize(),this.b.crossVectors(this.t,this.n).normalize();for(let t=0;t<=this.sides;t++){let n=t/this.sides*Math.PI*2,r=Math.cos(n),o=Math.sin(n),s=this.n.x*r+this.b.x*o,c=this.n.y*r+this.b.y*o,l=this.n.z*r+this.b.z*o,u=e*(this.sides+1)+t;i.setXYZ(u,this.p.x+s*this.radius,this.p.y+c*this.radius,this.p.z+l*this.radius),a.setXYZ(u,s,c,l)}}i.needsUpdate=!0,a.needsUpdate=!0,this.geometry.computeBoundingSphere()}};function Cm(){if(typeof document>`u`)return null;let e=document.createElement(`canvas`);e.width=512,e.height=128;let t=e.getContext(`2d`);t.clearRect(0,0,512,128),t.fillStyle=`#3a3c40`,t.font=`500 92px 'Helvetica Neue', Helvetica, Arial, sans-serif`,t.textAlign=`center`,t.textBaseline=`middle`,t.fillText(`defex`,256,66);let n=new Yo(e);return n.colorSpace=Sr,n.anisotropy=8,n}function wm(e){let t=mm(),n=new q;n.name=`Cobot arm`;let r=[],i=(e,t,n,i)=>{let a=new Bo(t,n);return a.name=i,a.castShadow=a.receiveShadow=!0,e.add(a),r.push(a),a},a=(e,t,n,r,a,o,s=48,c=Math.min(.9,t*.18))=>i(e,_m(t,n,r,c,s),a,o),o=(e,n,r,o)=>{a(e,n,-r/2,r/2,t.paint,`${o} housing`,72,n*.16);for(let a of[-1,1]){let s=i(e,ym(n),t.cap,`${o} cap`);s.position.y=a*r/2,a<0&&(s.rotation.x=Math.PI);let c=i(e,bm(n),t.capFace,`${o} cap face`);c.position.y=a*r/2,a<0&&(c.rotation.x=Math.PI)}},s=new q;s.position.copy(dm),n.add(s);let c=i(s,new es(9,9.4,1.6,64),e.dark,`Base flange`);c.rotation.x=Math.PI/2,c.position.z=.8;for(let t=0;t<8;t++){let n=t/8*Math.PI*2+Math.PI/8,r=i(s,new es(.62,.62,.5,16),e.edge,`Base bolt`);r.rotation.x=Math.PI/2,r.position.set(Math.cos(n)*7.7,Math.sin(n)*7.7,1.85)}let l=new q;s.add(l);let u=new q;u.rotation.x=Math.PI/2,l.add(u),a(u,6.3,1.6,2.6,t.cap,`Base seam`),a(u,6.2,2.6,33.5,t.paint,`Base column`,64),a(u,6.25,25,25.6,t.cap,`Base joint seam`,64);let d=new q;d.position.set(0,0,38),l.add(d),o(d,6.6,13,`Shoulder`);let f=new q;n.add(f),i(f,xm(46,6,4.3,5.3),t.paint,`Upper arm`);let p=new Bo(new yc(10,2.5),new Nc({map:Cm(),color:16777215,transparent:!0,opacity:typeof document>`u`?0:1,roughness:.4,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2}));p.name=`Upper arm mark`,f.add(p);let m=new q;m.position.y=46,f.add(m),o(m,5.9,11,`Elbow`);let h=new q;n.add(h),i(h,xm(40,5,3.6,4.3),t.paint,`Forearm`);let g=new q;n.add(g),o(g,4.7,9.5,`Wrist`);let _=new q;n.add(_);let v=new q;v.rotation.x=Math.PI/2,_.add(v),a(v,3.7,3.4,15,t.paint,`Wrist 2`,48),a(v,3.95,1.9,3.4,t.cap,`Wrist 3 seam`,48),a(v,3.6,.9,1.9,e.silver,`Tool flange`,48),a(v,3.85,.25,.9,t.accent,`Flange ring`,48);let y=[.3,.72].map(e=>{let n=new q;f.add(n);let r=a(n,1.25,-.9,.9,t.cap,`Cable clamp`,16);return r.rotation.z=0,n.position.set(4.55,e*46,0),n.userData.t=e,n}),b=new q;h.add(b),a(b,1.1,-.8,.8,t.cap,`Cable clamp`,16),b.position.set(3.85,22,0);let x=new Sm(e.rubber,7,.85);n.add(x.mesh);let S=pm(new G(0,0,63.6)),C=new G;new G;let w=new G,T=new K,E=new G,D=Array.from({length:7},()=>new G),O=(e,t,n)=>{C.subVectors(n,t).normalize(),w.crossVectors(C,E).normalize(),T.makeBasis(w,C,E),e.quaternion.setFromRotationMatrix(T),e.position.copy(t)};function k(e,t,r){pm(e,S),s.rotation.z=0,l.rotation.z=S.yaw,E.set(-Math.sin(S.yaw),Math.cos(S.yaw),0),O(f,S.shoulder,S.elbow),O(h,S.elbow,S.wrist),g.position.copy(S.wrist),g.quaternion.copy(h.quaternion),_.position.copy(S.flange),_.rotation.set(0,0,t);for(let e of[m])e.rotation.set(Math.PI/2,0,0);g.rotateX(Math.PI/2),g.position.copy(S.wrist),p.position.set(0,23.92,4.36),p.rotation.set(0,0,-Math.PI/2),n.updateMatrixWorld(!0),D[0].copy(S.shoulder).addScaledVector(C.set(Math.cos(S.yaw),Math.sin(S.yaw),0),-7.4).add(w.set(0,0,-6)),y[0].localToWorld(D[1].set(0,0,0)),n.worldToLocal(D[1]),y[1].localToWorld(D[2].set(0,0,0)),n.worldToLocal(D[2]),m.localToWorld(D[3].set(0,0,0)),n.worldToLocal(D[3]),D[3].z+=7.2,b.localToWorld(D[4].set(0,0,0)),n.worldToLocal(D[4]);let i=Math.cos(t),a=Math.sin(t);D[5].set(S.wrist.x+6.2*i-3*a,S.wrist.y+6.2*a+3*i,S.wrist.z-3),D[6].set(e.x+10*i-3.6*a,e.y+10*a+3.6*i,e.z-fm+14.6),r&&D[6].copy(r),x.update(D)}return k(S.flange,0),{root:n,pose:S,cable:x,meshes:r,links:{upper:f,fore:h},set:k}}function Tm(e,t,n){let r=new js,i=e,a=t,o=n;return r.moveTo(-i+o,-a),r.lineTo(i-o,-a),r.quadraticCurveTo(i,-a,i,-a+o),r.lineTo(i,a-o),r.quadraticCurveTo(i,a,i-o,a),r.lineTo(-i+o,a),r.quadraticCurveTo(-i,a,-i,a-o),r.lineTo(-i,-a+o),r.quadraticCurveTo(-i,-a,-i+o,-a),r}function Em(e,t,n){let r=Tm(e-.1,t-.1,.35);for(let[e,t]of Dm(n)){let n=new As;n.absarc(e,t,.66,0,Math.PI*2,!0),r.holes.push(n)}return new hc(r,{depth:7.8,bevelEnabled:!0,bevelThickness:.1,bevelSize:.1,bevelSegments:2,curveSegments:10,steps:1})}function Dm(e){return Array.from({length:e},(t,n)=>[(n%(e/2)-(e/2-1)/2)*3.1,n<e/2?-1.55:1.55])}function Om(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new go,l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let e in d.morphAttributes){if(!i.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;o[e]===void 0&&(o[e]=[]),o[e].push(d.morphAttributes[e])}if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=km(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=km(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function km(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new eo(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}var Am=.48,jm=.85,Mm=.98,Nm=.86,Pm=1.01,Fm=new G(0,1,0),Im=new G(0,0,1),Lm=new G(-63,40,Pm),Rm=new G(-55,30,Pm),zm=[[-74,50],[-90,58],[-118,60]],Bm=[-145,60],Vm=[-145,12],Hm=2,Um=[[-124,12.5],[-114,12],[-106,15],[-104,18.5]],Wm={x0:-230,y0:-160,nx:320,ny:270,h:new Float32Array};function Gm(e){let{x0:t,y0:n,nx:r,ny:i}=Wm,a=new Float32Array(r*i),o=2.6;for(let s of e){let e=Math.max(0,Math.floor(s.min.x-o-t)),c=Math.min(r-1,Math.ceil(s.max.x+o-t)),l=Math.max(0,Math.floor(s.min.y-o-n)),u=Math.min(i-1,Math.ceil(s.max.y+o-n));for(let t=l;t<=u;t++)for(let n=e;n<=c;n++)a[t*r+n]=Math.max(a[t*r+n],s.max.z)}let s=Math.SQRT2;for(let e=0;e<i;e++)for(let t=0;t<r;t++){let n=e*r+t;t&&(a[n]=Math.max(a[n],a[n-1]-1)),e&&(a[n]=Math.max(a[n],a[n-r]-1),t&&(a[n]=Math.max(a[n],a[n-r-1]-s)),t<r-1&&(a[n]=Math.max(a[n],a[n-r+1]-s)))}for(let e=i-1;e>=0;e--)for(let t=r-1;t>=0;t--){let n=e*r+t;t<r-1&&(a[n]=Math.max(a[n],a[n+1]-1)),e<i-1&&(a[n]=Math.max(a[n],a[n+r]-1),t<r-1&&(a[n]=Math.max(a[n],a[n+r+1]-s)),t&&(a[n]=Math.max(a[n],a[n+r-1]-s)))}Wm.h=a}function Km(e,t){let n=Math.round(e-Wm.x0),r=Math.round(t-Wm.y0);return Wm.h.length&&n>=0&&r>=0&&n<Wm.nx&&r<Wm.ny?Wm.h[r*Wm.nx+n]:0}function qm(e,t=6){let n=t/2;return[(Math.floor(e/2)-(n-1)/2)*Mm,(e%2-.5)*Nm]}var Jm={poly:[],centre:[],tangent:new G,n:new G,b:new G,v:new G,w:new G,curve:new us([],!1,`centripetal`)};function Ym(e,t){for(;t.length<=e;)t.push(new G);return t[e]}function Xm(e,t,n,r,i,a){let o=1-a;return e.set(0,0,0).addScaledVector(t,o*o*o).addScaledVector(n,3*o*o*a).addScaledVector(r,3*o*a*a).addScaledVector(i,a*a*a)}function Zm(e,t,n,r,i,a){let{tangent:o,n:s,b:c,v:l}=Jm;s.set(-1,0,0);for(let u=0;u<n.length;u++)o.subVectors(n[Math.min(u+1,n.length-1)],n[Math.max(u-1,0)]).normalize(),l.crossVectors(Im,o),l.lengthSq()>1e-6&&s.copy(l).normalize(),c.crossVectors(o,s),l.copy(s).multiplyScalar(-i[0]).addScaledVector(c,i[1]),u<r&&l.applyAxisAngle(o,a*(1-u/r)),Ym(t++,e).copy(n[u]).add(l);return t}function Qm(e,t,n){let r=t;for(let[t,n]of zm)Ym(r++,e).set(t,n,Pm);for(let t=0;t<=40;t++){let i=t/40;Ym(r++,e).set(Bm[0]-n*Math.sin(2*Math.PI*Hm*i),Bm[1]+(Vm[1]-Bm[1])*i,Pm)}for(let[t,n]of Um)Ym(r++,e).set(t,n,Pm);return r}function $m(e,t){let n=0;for(let r=1;r<t;r++)n+=e[r].distanceTo(e[r-1]);return n}function eh(e,t,n){let r=$m(t,n),i=0,a=1,o=0;e[0].copy(t[0]);for(let i=1;i<142;i++){let s=r*i/142;for(;a<n-1&&o+t[a].distanceTo(t[a-1])<s;)o+=t[a].distanceTo(t[a-1]),a++;let c=t[a].distanceTo(t[a-1])||1;e[i].lerpVectors(t[a-1],t[a],(s-o)/c)}e[142].copy(t[n-1]);for(let t=1;t<143;t++)i+=e[t].distanceTo(e[t-1]);return i}var th={key:``,amplitude:0,sag:1,points:[]};function nh(e,t,n,r,i,a,o=6,s=440){let c=[t.x,t.y,t.z,n,r,s].join();if(th.key!==c){let e=rh(th.points,t,n,r,[0,0],[0,0],-104,s,null);Object.assign(th,{key:c,amplitude:e.amplitude,sag:e.sag})}return rh(e,t,n,r,i,qm(a,o),-104+(a-(o-1)/2)*3,s,th)}function rh(e,t,n,r,i,a,o,s,c){for(;e.length<143;)e.push(new G);let{poly:l,centre:u,v:d,w:f}=Jm,p=(e,i,a,o)=>o.set(e,i,a).applyAxisAngle(Fm,n).applyAxisAngle(Im,r).add(t),m=(1+Math.cos(n))/2,h=Math.max(7.5,Math.min(t.z-8.3-10.5,30)),g=(1-m)*Math.max(0,t.z-10.4-h),_=0;p(i[0],i[1],8.3,Ym(_++,l)),p((i[0]+a[0])/2,i[1]*.5+1,9.5,Ym(_++,l)),p(0,4.5,10.4+g,Ym(0,u)),p(0,12,10.4+g,Ym(1,u));let v=Math.min(1,Math.max(0,(t.x+100)/80)),y=new G().lerpVectors(Rm,Lm,v*v*(3-2*v)),b=u[1],x=b.distanceTo(y),S=new G,C=new G,w=new G(zm[0][0],zm[0][1],Pm).sub(y).normalize(),T=p(0,1,0,new G).sub(t),E=jm*Math.max(0,b.z-Pm),D=(t,r)=>{S.copy(b).addScaledVector(T,Math.min(32,Math.max(5,.25*x))*r),S.z-=E,C.copy(y).addScaledVector(w,-Math.min(14-6*v,Math.max(4,.2*x))*r);for(let e=1;e<=24;e++){let t=Xm(Ym(2+e-1,u),b,S,C,y,e/24);t.z=Math.max(t.z,Km(t.x,t.y)+Pm+.4)}let i=Qm(u,26,t);u.length=i;let s=Zm(l,_,u,26,a,n);Ym(s,l).set((l[s-1].x+o)/2,22,l[s-1].z+.3),s++;for(let[e,t]of[[25.5,3.4],[29,8.6],[38,10.5],[50,10.5],[63.5,9]])Ym(s++,l).set(o,e,t);l.length=s;for(let e=0;e<s;e++)l[e].z=Math.max(l[e].z,.6);return eh(e,l,s)+O},O=0,k=(e,t,n)=>{for(let r=0;r<16;r++){let r=(t+n)/2;e(r)<s?t=r:n=r}return(t+n)/2},A=()=>{if(c!==null){let e=Math.max(0,c.amplitude-2),t=c.amplitude+2,n=k(e=>D(e,c.sag),e,t),r=c.sag,i=D(n,r);return Math.abs(i-s)>.05&&(n=i<s?t:e,r=k(e=>D(n,e),.5,2)),D(n,r),{amplitude:n,sag:r,shortest:0,longest:0}}let e=D(26,1),t=D(0,1),n=26,r=1;return e<s?r=k(e=>D(26,e),1,2):t>s?(n=0,r=k(e=>D(0,e),.5,1)):n=k(e=>D(e,1),0,26),D(n,r),{amplitude:n,sag:r,shortest:t,longest:e}},j=c?D(c.amplitude,c.sag):D(13,1);Jm.curve.points=e,O=ih(Jm.curve,400)-j;let M=A();for(let t=0;t<2;t++){Jm.curve.points=e;let t=ih(Jm.curve,400)-s;if(Math.abs(t)<.04)break;O+=t,M=A()}return M}function ih(e,t=128){let n=new G,r=new G;e.getPoint(0,n);let i=0;for(let a=1;a<=t;a++)e.getPoint(a/t,r),i+=n.distanceTo(r),n.copy(r);return i}var ah=9810,oh=.02,sh=2,ch=.25,lh=Array.from({length:22},(e,t)=>{let n=1;for(let e=2;e<=t;e++)n*=e;return 1/n});function uh(e){let t=0,n=e,r=1,i=e*e;for(;r<22;)t+=(r%4==1?1:-1)*n*lh[r],n*=i,r+=2;return t}function dh(e){let t=0,n=1,r=0,i=e*e;for(;r<22;)t+=(r%4==0?1:-1)*n*lh[r],n*=i,r+=2;return t}function fh(e,t){let n=dh(e),r=uh(e);return t.set(n,0,r,0,0,1,0,0,-r,0,n,0,0,0,0,1)}var ph=new G,mh=new K,hh=new K;function gh(e){let t=e.points.length,n=e.rate??1200,r=e.fps??120,i=1/n,a=e.radius?.v??1,o=e.radius?.h??1.95,s=e.friction??.35,c=e.bend??.015,l=(e.damping??.35)**+i,u=e.internal??.06,d=new Float64Array(t*3),f=new Float64Array(t*3),p=new Float64Array(t*3),m=new Float64Array(t),h=new Float64Array(t-1),g=e=>Math.round(e*1e6)/1e6;e.points.forEach((e,t)=>{f[t*3]=g(e.x),f[t*3+1]=g(e.y),f[t*3+2]=g(e.z)});for(let e=0;e<t-1;e++)h[e]=Math.hypot(f[e*3+3]-f[e*3],f[e*3+4]-f[e*3+1],f[e*3+5]-f[e*3+2]);let _=new Float64Array(Math.max(0,t-2)),v=new Float64Array(t);for(let e=0;e<t-2;e++){let t=(h[e]+h[e+1])/2,n=t/10,r=2*t*Math.cos(n/2),i=Math.hypot(f[e*3+6]-f[e*3],f[e*3+7]-f[e*3+1],f[e*3+8]-f[e*3+2]);_[e]=Math.min(r,i)}for(let e=1;e<t;e++)v[e]=v[e-1]+h[e-1];let y=new Float64Array(f);e.from?(f.set(e.from.pos),p.set(e.from.prev)):p.set(f);for(let n=0;n<t;n++)m[n]=1/(e.mass?.(n)??1);let b=new Uint8Array(t),x=new Float64Array(t).fill(1/0);for(let t of e.attached)b[t.node]=1,x[t.node]=t.until??1/0;let S=new Uint8Array(t).fill(1),C=new Float64Array(t);e.from&&(S.set(e.from.asleep),C.set(e.from.still));let w=new Float64Array(t).fill(-1/0),T=new Float64Array(t).fill(-1);for(let t of e.held??[])w[t.node]=t.until,T[t.node]=t.pulled??-1;let E=e.colliders.length,D=new Float64Array(E*12),O=new Float64Array(E*12),k=new Float64Array(E*12),A=new Float64Array(E*3),j=e.colliders.map(e=>!!e.pose),M=new Float64Array(E),N=new Float64Array(E*6),P=e.colliders.map(e=>Math.min(...e.half)<2),F=(e,t,n)=>{let r=t.elements;n.set([r[0],r[1],r[2],r[4],r[5],r[6],r[8],r[9],r[10],r[12],r[13],r[14]],e*12)},ee=e=>{let t=k,n=e*12,r=e*3;for(let i=0;i<3;i++){let a=Math.abs(t[n+i])*A[r]+Math.abs(t[n+3+i])*A[r+1]+Math.abs(t[n+6+i])*A[r+2]+o+2;N[e*6+i]=t[n+9+i]-a,N[e*6+3+i]=t[n+9+i]+a}},te=(e,t)=>{let n=t.elements,r=e*12;return n[0]===k[r]&&n[1]===k[r+1]&&n[2]===k[r+2]&&n[4]===k[r+3]&&n[5]===k[r+4]&&n[6]===k[r+5]&&n[8]===k[r+6]&&n[9]===k[r+7]&&n[10]===k[r+8]&&n[12]===k[r+9]&&n[13]===k[r+10]&&n[14]===k[r+11]},ne=(t,n,r=!1)=>{let i=e.colliders[t];i.pose?i.pose(n,mh):mh.copy(i.at),(r||!te(t,mh))&&(F(t,mh,k),F(t,hh.copy(mh).invert(),D),ee(t))};e.colliders.forEach((t,n)=>{A.set(t.half,n*3),M[n]=t.friction??s,ne(n,e.t0,!0)}),O.set(k);let I=new Float64Array(t).fill(o);for(let e=0;e<t;e++)for(let t=0;t<E;t++){let n=t*12,r=D,i=f[e*3],o=f[e*3+1],s=f[e*3+2],c=t*3,l=r[n]*i+r[n+3]*o+r[n+6]*s+r[n+9],u=r[n+1]*i+r[n+4]*o+r[n+7]*s+r[n+10],d=r[n+2]*i+r[n+5]*o+r[n+8]*s+r[n+11],p=Math.hypot(l-Math.max(-A[c],Math.min(A[c],l)),u-Math.max(-A[c+1],Math.min(A[c+1],u)),d-Math.max(-A[c+2],Math.min(A[c+2],d)));p<I[e]&&(I[e]=Math.max(a,p-1e-4))}let re=e.brush??[],L=(e,t,n)=>{let r=0;for(let{box:a,hold:o}of re)e>=a[0]&&e<=a[3]&&t>=a[1]&&t<=a[4]&&n>=a[2]&&n<=a[5]&&(r+=o*i*i);return r},R=[],z=Math.round((e.t1-e.t0)*n),ie=e.stateAt===void 0?-1:Math.round((e.stateAt-e.t0)*n),ae=0,oe,se=new Int32Array(t),ce=new Float64Array(t),le=new Float64Array(t*3),ue=new Int32Array(E),de=new Int32Array(t);for(let e=0;e<t;e++)de[e]=e;let fe=()=>{let e=Array(t*3);for(let n=0;n<t*3;n++)e[n]=f[n];R.push(e)};fe();let pe=0;return{advance:s=>{for(let g=s;g>0&&pe<z;g--){pe++;let s=e.t0+pe*i;O.set(k);for(let e=0;e<E;e++)j[e]&&ne(e,s);for(let t of e.attached)s>=x[t.node]&&b[t.node]&&(b[t.node]=0);for(let e=0;e<t;e++)if(T[e]>=0&&s>=w[e]){let n=(e===t-1?e-1:e+1)*3;Math.hypot(f[n]-y[n],f[n+1]-y[n+1],f[n+2]-y[n+2])>T[e]?T[e]=-1:w[e]=s+i}for(let t of e.attached){if(!b[t.node])continue;t.frame(s,mh),ph.copy(t.local).applyMatrix4(mh);let e=t.node*3;p[e]=f[e],p[e+1]=f[e+1],p[e+2]=f[e+2],f[e]=ph.x,f[e+1]=ph.y,f[e+2]=ph.z}for(let e=0;e<t*3;e++)d[e]=f[e]-p[e];for(let e=0;e<t;e++){if(b[e]||S[e]){if(!b[e]){let t=e*3;p[t]=f[t],p[t+1]=f[t+1],p[t+2]=f[t+2]}continue}let n=e*3;if(s<w[e]){p[n]=f[n]=y[n],p[n+1]=f[n+1]=y[n+1],p[n+2]=f[n+2]=y[n+2];continue}let r=e>0?n-3:n+3,a=e<t-1?n+3:n-3,o=(d[n]+u*((d[r]+d[a])/2-d[n]))*l,c=(d[n+1]+u*((d[r+1]+d[a+1])/2-d[n+1]))*l,m=(d[n+2]+u*((d[r+2]+d[a+2])/2-d[n+2]))*l;p[n]=f[n],p[n+1]=f[n+1],p[n+2]=f[n+2],f[n]+=o,f[n+1]+=c,f[n+2]+=m-ah*i*i}for(let e=0;e<t-1;e++)if(S[e]!==S[e+1]||S[e]&&b[e+1]||S[e+1]&&b[e]){let t=e*3,n=t+3,r=Math.hypot(f[n]-f[t],f[n+1]-f[t+1],f[n+2]-f[t+2]),a=S[e]?n:t,o=Math.hypot(d[a],d[a+1],d[a+2]);(Math.abs(r-h[e])>oh||o>sh*i)&&(S[e]=0,S[e+1]=0)}for(let e=0;e<t;e++)b[e]&&(S[e]=0);let g=e=>b[e]||S[e]||s<w[e]?0:m[e],F=e=>{for(let n=0;n<e;n++)for(let e=0;e<t-1;e++){let r=n%2?t-2-e:e,i=r*3,a=i+3,o=g(r),s=g(r+1),c=o+s;if(!c)continue;let l=f[a]-f[i],u=f[a+1]-f[i+1],d=f[a+2]-f[i+2],p=Math.hypot(l,u,d)||1e-9,m=(p-h[r])/p/c;f[i]+=l*m*o,f[i+1]+=u*m*o,f[i+2]+=d*m*o,f[a]-=l*m*s,f[a+1]-=u*m*s,f[a+2]-=d*m*s}};if(F(e.passes??4),re.length)for(let e=0;e<t;e++){if(!g(e))continue;let t=e*3,n=L(p[t],p[t+1],p[t+2]);if(!n)continue;let r=f[t]-p[t],i=f[t+1]-p[t+1],a=f[t+2]-p[t+2],o=Math.hypot(r,i,a),s=o>n?1-n/o:0;f[t]=p[t]+r*s,f[t+1]=p[t+1]+i*s,f[t+2]=p[t+2]+a*s}let ee=-1,te=t;for(let e=0;e<t&&b[e];e++)ee=e;for(let e=t-1;e>=0&&s<w[e];e--)te=e;for(let[e,n,r]of[[ee,ee+1,te],[te,ee+1,te]]){if(e<0||e>=t)continue;let i=f[e*3],a=f[e*3+1],o=f[e*3+2];for(let t=n;t<r;t++){let n=t*3,r=f[n]-i,s=f[n+1]-a,c=f[n+2]-o,l=Math.sqrt(r*r+s*s+c*c),u=Math.abs(v[t]-v[e]);if(l>u&&l>0&&g(t)){let e=u/l;f[n]=i+r*e,f[n+1]=a+s*e,f[n+2]=o+c*e}}}for(let e=0;e<t-2;e++){let t=e*3,n=t+6,r=g(e),i=g(e+2),a=r+i;if(!a)continue;let o=f[n]-f[t],s=f[n+1]-f[t+1],l=f[n+2]-f[t+2],u=Math.hypot(o,s,l)||1e-9,d=h[e]+h[e+1];if(u>=d)continue;let p=(u<_[e]?.5*(u-_[e])+c*(_[e]-d):c*(u-d))/u/a;f[t]+=o*p*r,f[t+1]+=s*p*r,f[t+2]+=l*p*r,f[n]-=o*p*i,f[n+1]-=s*p*i,f[n+2]-=l*p*i}if(pe%2==0){let e=2.5;for(let e=1;e<t;e++){let t=de[e],n=f[t*3],r=e-1;for(;r>=0&&f[de[r]*3]>n;)de[r+1]=de[r],r--;de[r+1]=t}for(let n=0;n<t;n++){let r=de[n],i=r*3,a=g(r);for(let o=n+1;o<t;o++){let t=de[o],n=t*3,s=f[n]-f[i];if(s>e)break;if(Math.abs(t-r)<4)continue;let c=f[n+1]-f[i+1];if(c>e||c<-2.5)continue;let l=f[n+2]-f[i+2],u=s*s+c*c+l*l;if(u>=6.25)continue;let d=g(t),p=a+d;if(!p)continue;let m=Math.sqrt(u)||1e-6,h=(m-e)/m/p*.5;f[i]+=s*h*a,f[i+1]+=c*h*a,f[i+2]+=l*h*a,f[n]-=s*h*d,f[n+1]-=c*h*d,f[n+2]-=l*h*d}}}let R=1/0,z=1/0,me=1/0,he=-1/0,ge=-1/0,_e=-1/0;for(let e=0;e<t;e++){let t=e*3;f[t]<R&&(R=f[t]),f[t]>he&&(he=f[t]),f[t+1]<z&&(z=f[t+1]),f[t+1]>ge&&(ge=f[t+1]),f[t+2]<me&&(me=f[t+2]),f[t+2]>_e&&(_e=f[t+2])}let B=0;for(let e=0;e<E;e++){let t=e*6;N[t]<=he&&N[t+3]>=R&&N[t+1]<=ge&&N[t+4]>=z&&N[t+2]<=_e&&N[t+5]>=me&&(ue[B++]=e)}let ve=()=>{se.fill(-1);for(let e=0;e<t;e++){let t=S[e]&&!b[e]&&!(s<w[e]);if(!g(e)&&!t)continue;let n=e*3;for(let r=0;r<B;r++){let i=ue[r],o=i*6;if(t&&!j[i]||f[n]<N[o]||f[n]>N[o+3]||f[n+1]<N[o+1]||f[n+1]>N[o+4]||f[n+2]<N[o+2]||f[n+2]>N[o+5])continue;let s=i*12,c=D,l=f[n],u=f[n+1],d=f[n+2],p=c[s]*l+c[s+3]*u+c[s+6]*d+c[s+9],m=c[s+1]*l+c[s+4]*u+c[s+7]*d+c[s+10],h=c[s+2]*l+c[s+5]*u+c[s+8]*d+c[s+11],g=i*3,_=k,v=Math.max(-A[g],Math.min(A[g],p)),y=Math.max(-A[g+1],Math.min(A[g+1],m)),b=Math.max(-A[g+2],Math.min(A[g+2],h)),x=p-v,C=m-y,w=h-b,T=Math.hypot(x,C,w),E,O,M,F;if(T>1e-9){x/=T,C/=T,w/=T,O=_[s]*x+_[s+3]*C+_[s+6]*w,M=_[s+1]*x+_[s+4]*C+_[s+7]*w,F=_[s+2]*x+_[s+5]*C+_[s+8]*w;let t=P[i]?I[e]:I[e]+(a-I[e])*Math.abs(F);if(T>=t)continue;E=t-T}else{let t=0,n=1;E=1/0;for(let e=0;e<3;e++){let r=e===0?p:e===1?m:h,i=A[g+e]-Math.abs(r);i<E&&(E=i,t=e,n=r>=0?1:-1)}O=_[s+t*3]*n,M=_[s+t*3+1]*n,F=_[s+t*3+2]*n,E+=P[i]?I[e]:I[e]+(a-I[e])*Math.abs(F)}if(t){if(E>.001)S[e]=0;else continue}f[n]+=O*E,f[n+1]+=M*E,f[n+2]+=F*E,(E>ce[e]||se[e]<0)&&(se[e]=i,ce[e]=E,le[n]=O,le[n+1]=M,le[n+2]=F)}}};ve();for(let e=0;e<t;e++){let t=se[e];if(t<0){ce[e]=0;continue}let n=e*3,r=t*12,a=0,o=0,s=0;if(j[t]){let e=D,t=f[n],i=f[n+1],c=f[n+2],l=e[r]*t+e[r+3]*i+e[r+6]*c+e[r+9],u=e[r+1]*t+e[r+4]*i+e[r+7]*c+e[r+10],d=e[r+2]*t+e[r+5]*i+e[r+8]*c+e[r+11],p=O;a=t-(p[r]*l+p[r+3]*u+p[r+6]*d+p[r+9]),o=i-(p[r+1]*l+p[r+4]*u+p[r+7]*d+p[r+10]),s=c-(p[r+2]*l+p[r+5]*u+p[r+8]*d+p[r+11])}let c=f[n]-p[n]-a,l=f[n+1]-p[n+1]-o,u=f[n+2]-p[n+2]-s,d=le[n],m=le[n+1],h=le[n+2],g=c*d+l*m+u*h,_=c-g*d,v=l-g*m,y=u-g*h,b=Math.hypot(_,v,y),x=M[t]*ah*i*i*Math.max(0,h),S=b<=x?1:x/b;f[n]-=_*S,f[n+1]-=v*S,f[n+2]-=y*S,ce[e]=0}for(let t=0;t<(e.settle??0);t++)F(2),ve(),ce.fill(0);for(let e=0;e<t;e++){if(!g(e))continue;let t=e*3,n=Math.hypot(f[t]-p[t],f[t+1]-p[t+1],f[t+2]-p[t+2]);se[e]>=0&&n<sh*i?(C[e]+=i,C[e]>=ch&&(S[e]=1,C[e]=0)):C[e]=0}for(let e=0;e<t;e++)I[e]<o&&Math.hypot(f[e*3]-y[e*3],f[e*3+1]-y[e*3+1],f[e*3+2]-y[e*3+2])>.5&&(I[e]=Math.min(o,I[e]+(o-a)*i/.2));Math.floor(pe*r/n+1e-9)>ae&&(ae++,fe()),pe===ie&&(oe={t:s,pos:new Float64Array(f),prev:new Float64Array(p),asleep:new Uint8Array(S),still:new Float64Array(C)})}return pe>=z},track:()=>{let n=new Float32Array(R.length*t*3);return R.forEach((e,r)=>n.set(e,r*t*3)),{n:t,t0:e.t0,t1:e.t0+(R.length-1)/r,fps:r,frames:n,count:R.length,state:oe}}}}function _h(e,t,n){let r=Math.max(0,Math.min(e.count-1,(t-e.t0)*e.fps)),i=Math.min(e.count-2,Math.floor(r)),a=r-i,o=e.n*3,s=i*o,c=s+o,l=e.frames;if(e.count<2){for(let e=0;e<o;e++)n[e]=l[e];return n}for(let e=0;e<o;e++)n[e]=l[s+e]+(l[c+e]-l[s+e])*a;return n}var vh=new G,yh=new G,bh=new G,xh=new G(0,0,1),Sh=new G,Ch=.5;function wh(e,t,n,r,i){Sh.copy(r);for(let r=0;r<t;r++){let a=i?t-1-r:r,o=Math.max(0,a-1)*3,s=Math.min(t-1,a+1)*3;vh.set(e[s]-e[o],e[s+1]-e[o+1],e[s+2]-e[o+2]).normalize(),yh.crossVectors(xh,vh);let c=yh.length();if(Sh.addScaledVector(vh,-Sh.dot(vh)),Sh.lengthSq()<1e-12&&Sh.set(1,0,0).addScaledVector(vh,-vh.x),Sh.normalize(),c>1e-6){yh.divideScalar(c),yh.dot(Sh)<0&&yh.negate();let e=Math.min(1,Math.max(0,(c-.8)/.15)),t=e*e*(3-2*e)*Ch;yh.multiplyScalar(t).addScaledVector(Sh,1-t).normalize()}else yh.copy(Sh);bh.crossVectors(vh,yh),n.set([yh.x,yh.y,yh.z,bh.x,bh.y,bh.z,vh.x,vh.y,vh.z],a*9),Sh.copy(yh)}return n}var Th={f:new Float64Array},Eh=new G,Dh=new G,Oh=new G,kh=new G;function Ah(e,t,n,r,i,a=0){if(wh(e,t,n,r??new G(1,0,0),!1),!i||a<=0)return n;Th.f.length<t*9&&(Th.f=new Float64Array(t*9));let o=wh(e,t,Th.f,i,!0);for(let e=0;e<t;e++){let r=e*9,i=e/(t-1),s=i*i*(3-2*i)*a;Eh.set(n[r],n[r+1],n[r+2]),Dh.set(o[r],o[r+1],o[r+2]),Oh.set(n[r+6],n[r+7],n[r+8]),Dh.addScaledVector(Oh,-Dh.dot(Oh)).normalize();let c=Math.atan2(kh.crossVectors(Eh,Dh).dot(Oh),Eh.dot(Dh))*s,l=Math.cos(c),u=Math.sin(c);kh.crossVectors(Oh,Eh),Eh.multiplyScalar(l).addScaledVector(kh,u).normalize(),bh.crossVectors(Oh,Eh),n[r]=Eh.x,n[r+1]=Eh.y,n[r+2]=Eh.z,n[r+3]=bh.x,n[r+4]=bh.y,n[r+5]=bh.z}return n}function jh(e,t,n,r,i,a,o,s=new G(1,0,0)){let c=e[0].length,l=new Int32Array(c),u=new Float64Array(e.length*c*3),d=Ah(t,n,new Float64Array(n*9),s),f=new G(d[(n-1)*9],d[(n-1)*9+1],d[(n-1)*9+2]),p=Ah(t,n,new Float64Array(n*9),s,f,1),m=a.clone().invert();for(let e=0;e<c;e++)l[e]=r(e);let h=null;o&&(h=new Float64Array(e.length*c*3).fill(NaN)),e.forEach((e,n)=>e.forEach((e,r)=>{let i=l[r],a=i*9,s=e.x-t[i*3],d=e.y-t[i*3+1],f=e.z-t[i*3+2],m=(n*c+r)*3;u[m]=s*p[a]+d*p[a+1]+f*p[a+2],u[m+1]=s*p[a+3]+d*p[a+4]+f*p[a+5],u[m+2]=s*p[a+6]+d*p[a+7]+f*p[a+8];let g=o?.(n,r);g&&h&&(h[m]=g[0],h[m+1]=g[1],h[m+2]=0)}));let g=new Float64Array(e.length*c);e.forEach((e,t)=>{for(let n=1;n<c;n++)g[t*c+n]=g[t*c+n-1]+e[n].distanceTo(e[n-1])});let _=c;if(h){for(let e=0;e<c;e++)if(!Number.isNaN(h[e*3])){_=e;break}}if(h&&_<c){let t=Math.max(i,_-Ph);e.forEach((e,n)=>{let r=(n*c+t)*3;for(let e=t;e<c;e++){let t=(n*c+e)*3;h[t]=u[r],h[t+1]=u[r+1],h[t+2]=0}}),_=t}return{wires:e.length,points:c,rigid:i,node:l,offset:u,pigtail:e.map(e=>e.slice(0,i).map(e=>e.clone().applyMatrix4(m))),gather:h,along:g,fan:_,seed:s.clone().transformDirection(m),tail:f}}var Mh={f:new Float64Array},Nh=new G,Ph=8;function Fh(e,t,n,r,i,a=0,o){Mh.f.length<n*9&&(Mh.f=new Float64Array(n*9));let s=o?Rh(t,n,o,Mh.f):Ah(t,n,Mh.f,Nh.copy(e.seed).transformDirection(r),e.tail,1-a);for(let n=0;n<e.wires;n++)for(let o=0;o<e.points;o++){let c=i[n][o];if(o<e.rigid){c.copy(e.pigtail[n][o]).applyMatrix4(r);continue}let l=e.node[o],u=l*9,d=(n*e.points+o)*3,f=e.offset[d],p=e.offset[d+1],m=e.offset[d+2];if(a>0&&e.gather&&!Number.isNaN(e.gather[d])){let t=Math.min(1,(o-e.fan)/Ph),n=a*t*t*(3-2*t);f+=(e.gather[d]-f)*n,p+=(e.gather[d+1]-p)*n,m+=(e.gather[d+2]-m)*n}c.set(t[l*3]+f*s[u]+p*s[u+3]+m*s[u+6],t[l*3+1]+f*s[u+1]+p*s[u+4]+m*s[u+7],t[l*3+2]+f*s[u+2]+p*s[u+5]+m*s[u+8])}for(let t=0;t<e.wires;t++){let n=i[t],r=Ih,a=e.points;for(;r.length<a;)r.push(0);for(let e=1;e<a;e++)r[e]=r[e-1]+n[e].distanceTo(n[e-1]);for(let e=0;e<a;e++)Lh[e]=(Lh[e]??new G).copy(n[e]);let o=1;for(let i=e.rigid;i<a;i++){let s=Math.min(Math.max(e.along[t*a+i],r[i]-Wh),r[i]+Wh,r[a-1]);for(;o<a-1&&r[o]<s;)o++;let c=r[o]-r[o-1]||1,l=Math.min(1,(s-r[o-1])/c);n[i].lerpVectors(Lh[o-1],Lh[o],l);let u=Math.min(1,Math.max(0,(i-e.fan+Uh)/Uh));u>0&&n[i].lerp(Lh[i],u*u*(3-2*u))}}return i}var Ih=[],Lh=[];function Rh(e,t,n,r){for(let i=0;i<t;i++){let a=Math.max(0,i-1)*3,o=Math.min(t-1,i+1)*3;vh.set(e[o]-e[a],e[o+1]-e[a+1],e[o+2]-e[a+2]).normalize(),yh.set(n[i*3],n[i*3+1],n[i*3+2]).addScaledVector(vh,-yh.dot(vh)).normalize(),bh.crossVectors(vh,yh),r.set([yh.x,yh.y,yh.z,bh.x,bh.y,bh.z,vh.x,vh.y,vh.z],i*9)}return r}function zh(e,t,n,r){let i=e.n,a=new Float32Array(e.count*i*3),o=new K;r(e.t0,o);let s=Ah(n,i,new Float64Array(i*9),t.seed.clone().transformDirection(o),t.tail,1),c=new Float64Array(i*3),l=new G,u=new G,d=new G;for(let e=0;e<i;e++)c[e*3]=s[e*9],c[e*3+1]=s[e*9+1],c[e*3+2]=s[e*9+2];a.set(c);let f=e.frames;for(let n=1;n<e.count;n++){let s=n*i*3;r(e.t0+n/e.fps,o);for(let e=0;e<i;e++){let n=s+Math.max(0,e-1)*3,r=s+Math.min(i-1,e+1)*3;if(l.set(f[r]-f[n],f[r+1]-f[n+1],f[r+2]-f[n+2]).normalize(),d.set(c[e*3],c[e*3+1],c[e*3+2]),e===0&&d.copy(t.seed).transformDirection(o),d.addScaledVector(l,-d.dot(l)),d.lengthSq()<1e-12&&d.set(1,0,0).addScaledVector(l,-l.x),d.normalize(),e>0){u.set(c[e*3-3],c[e*3-2],c[e*3-1]).addScaledVector(l,-u.dot(l)).normalize();let t=s+e*3,n=Math.hypot(f[t]-f[t-i*3],f[t+1]-f[t-i*3+1],f[t+2]-f[t-i*3+2]),r=Math.hypot(l.x,l.y),a=Math.min(1,Math.max(0,(r-.8)/.15)),o=(Bh*(1-a*a*(3-2*a))+Vh)*Math.min(1,n/Hh);d.multiplyScalar(1-o).addScaledVector(u,o).normalize()}let a=Math.hypot(l.x,l.y);if(a>.3){u.set(-l.y,l.x,0).divideScalar(a),u.dot(d)<0&&u.negate();let e=Math.min(1,(a-.3)/.4),t=e*e*(3-2*e)*Ch;d.multiplyScalar(1-t).addScaledVector(u,t).normalize()}c[e*3]=d.x,c[e*3+1]=d.y,c[e*3+2]=d.z}a.set(c,s)}return a}var Bh=.5,Vh=.02,Hh=.05,Uh=12,Wh=2;function Gh(e,t=new Set){for(let n of[...e.children])n instanceof Bo||Gh(n,t);let n=new Map;for(let r of e.children){if(!(r instanceof Bo)||Array.isArray(r.material)||t.has(r)||!r.visible)continue;let e=`${r.material.uuid}:${r.castShadow}:${r.receiveShadow}:${r.userData.part??``}`,i=n.get(e)??[];i.push(r),n.set(e,i)}for(let t of n.values()){if(t.length<2)continue;let n=t.map(e=>(e.updateMatrix(),(e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone()).applyMatrix4(e.matrix))),r=Om(n,!1);if(n.forEach(e=>e.dispose()),!r)continue;let i=new Bo(r,t[0].material);i.name=`${e.name||`Workcell`} / ${t[0].material.name||t[0].name}`,i.castShadow=t[0].castShadow,i.receiveShadow=t[0].receiveShadow,i.userData={...t[0].userData},e.add(i),t.forEach(t=>e.remove(t))}}var Kh=-735,qh=12e4,Jh=900,Yh=null;function Xh(){if(Yh)return Yh;let e=new Uint8Array(65536),t=.09090909090909094/2,n=e=>{let n=Math.min(e,1-e),r=Math.max(0,Math.min(1,(n-t*.15)/(t*1.7)));return r*r*(3-2*r)};for(let t=0;t<128;t++)for(let r=0;r<128;r++){let i=(t*128+r)*4,a=Math.round(255*n((r+.5)/128)*n((t+.5)/128));e[i]=e[i+1]=e[i+2]=a,e[i+3]=255}return Yh=new Uo(e,128,128),Yh.generateMipmaps=!0,Yh.minFilter=sn,Yh.magFilter=an,Yh.anisotropy=8,Yh.needsUpdate=!0,Yh}function Zh(e,t,n,r){let i=new Bo(new $o(t[0],t[1],t[2]),r);return i.position.set(n[0],n[1],n[2]),e.add(i),i}function Qh(e){let t=new q;t.name=`Hall structure`;let n=qh/2;for(let n=-54e3;n<=54e3;n+=12e3)for(let r=-55e3;r<=55e3;r+=1e4)Math.abs(n)<2500&&Math.abs(r)<2500||(Zh(t,[520,520,11235],[n,r,9765/2],e.paint),Zh(t,[700,700,140],[n,r,-665],e.paint));for(let n=-55e3;n<=55e3;n+=1e4)Zh(t,[qh,200,900],[0,n,10050],e.steel);for(let n=-54e3;n<=54e3;n+=12e3)Zh(t,[200,qh,700],[n,0,10150],e.steel);for(let r=-6e4;r<=n;r+=2250)Zh(t,[90,qh,140],[r,0,10580],e.steel);Zh(t,[qh,qh,60],[0,0,10900],e.deck);let r=new yc(Jh*1.1,Jh*1.1);for(let i=-57750;i<n;i+=4500)for(let a=-58e3;a<n;a+=4e3){let n=new Bo(r,e.panel);n.position.set(i,a,9730),n.rotation.x=Math.PI,t.add(n)}for(let r of[-1,1]){Zh(t,[qh,200,11835],[0,r*n,5182.5],e.wall),Zh(t,[200,qh,11835],[r*n,0,5182.5],e.wall);for(let n=-57e3;n<58e3;n+=6e3)Zh(t,[1800,60,1e3],[n,r*59600,4400],e.glass),Zh(t,[60,1800,1e3],[r*59600,n,4400],e.glass);for(let n=-52500;n<54e3;n+=18e3)Zh(t,[3600,60,4200],[n,r*59600,1365],e.door),Zh(t,[60,3600,4200],[r*59600,n,1365],e.door);for(let n=-55e3;n<56e3;n+=7e3){let i=(n/1e3+r*7)%3;Zh(t,[1200,1e3,150],[n,r*58400,-660],e.pallet),Zh(t,[1100,950,i>1?1300:800],[n,r*58400,-585+(i>1?650:400)],e.wrap),Zh(t,[1e3,1200,150],[r*58400,n,-660],e.pallet),Zh(t,[950,1100,i>1?900:1300],[r*58400,n,-585+(i>1?450:650)],e.wrap)}}return t}function $h(){let e=new q;e.name=`Empty factory hall`;let t=(e,t=1)=>({deck:new Nc({color:new J(6119779).multiplyScalar(t),roughness:.85,envMapIntensity:.5,side:e}),paint:new Nc({color:new J(16777215).multiplyScalar(t),roughness:.6,envMapIntensity:1.4,emissive:new J(2895149).multiplyScalar(t),side:e}),wall:new Nc({color:new J(11909047).multiplyScalar(t),roughness:.9,envMapIntensity:.5,side:e}),steel:new Nc({color:new J(9409429).multiplyScalar(t),roughness:.55,metalness:.2,envMapIntensity:.5,side:e}),panel:new Oo({color:new J(16777215).multiplyScalar(t),toneMapped:!1,side:2,alphaMap:Xh(),transparent:!0,depthWrite:!1}),glass:new Oo({color:new J(15922936).multiplyScalar(t),toneMapped:!1,side:e}),door:new Nc({color:new J(11842997).multiplyScalar(t),roughness:.6,envMapIntensity:.5,side:e}),pallet:new Nc({color:new J(10125150).multiplyScalar(t),roughness:.9,envMapIntensity:.4,side:e}),wrap:new Nc({color:new J(14276303).multiplyScalar(t),roughness:.5,envMapIntensity:.5,side:e})}),n=Qh(t(0)),r=Qh(t(1,.58));r.name=`Hall reflection`,r.scale.z=-1,r.position.z=2*Kh;let i=new Pc({color:7764347,roughness:.36,clearcoat:.5,clearcoatRoughness:.24,transparent:!0,opacity:.6,envMapIntensity:.5});i.onBeforeCompile=e=>{e.fragmentShader=e.fragmentShader.replace(`#include <dithering_fragment>`,`#include <dithering_fragment>
      float grazing = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 4.0);
      gl_FragColor.a = mix(.95, .66, grazing);`)},i.customProgramCacheKey=()=>`fresnel-floor`;let a=new Bo(new yc(qh,qh),i);return a.name=`Polished concrete floor`,a.position.z=Kh,a.receiveShadow=!0,e.add(n,r,a),Gh(n),Gh(r),e}var eg=new Map;function tg(e,t){return eg.has(e)||eg.set(e,t()),eg.get(e)}function Z(e,t,n,r,i,a=.3){let o=Math.min(a,...n.map(e=>e*.3)),s=new Bo(tg(`b${n}/${o}`,()=>o?new om(n[0],n[1],n[2],2,o):new $o(...n)),i);return s.name=t,s.position.set(...r),s.castShadow=s.receiveShadow=!0,e.add(s),s}function Q(e,t,n,r,i,a,o=32){let s=new Bo(tg(`c${n}/${r}/${o}`,()=>new es(n,n,r,o)),a);return s.name=t,s.rotation.x=Math.PI/2,s.position.set(...i),s.castShadow=s.receiveShadow=!0,e.add(s),s}function ng(e,t,n,r,i=2.4){Q(e,`Machined washer`,i+.65,.5,[t,n,r],X.silver),Q(e,`Socket screw`,i,1.5,[t,n,r+.7],X.silver,24),Q(e,`Hex socket recess`,i*.46,.08,[t,n,r+1.49],X.bore,6)}function rg(e,t,n,r){let i=new Bo(new Sc(new us(t.map(e=>new G(...e))),40,n,8,!1),r);return i.castShadow=!0,e.add(i),i}var ig=[-96,7],ag=new Pc({color:1461304,metalness:.12,roughness:.48,clearcoat:.25,clearcoatRoughness:.4}),og=new Nc({color:9870233,metalness:.15,roughness:.5}),sg=new Nc({color:11382181,metalness:1,roughness:.28}),cg=new Nc({color:12438196,roughness:.85}),lg=new Nc({color:7172468,metalness:.3,roughness:.42,name:`Cast jig plate`}),ug=new Nc({color:3816768,roughness:.6,metalness:0,envMapIntensity:1,name:`Phenolic worktop`}),dg=new Nc({color:4475212,roughness:.5,metalness:.2,name:`Powder coated steel`}),fg=new Pc({color:1320749,metalness:.25,roughness:.06,clearcoat:1,name:`Coated lens glass`}),pg=new Pc({color:15660792,metalness:0,roughness:.03,transparent:!0,opacity:.1,depthWrite:!1,envMapIntensity:.9,name:`Protective window glass`}),mg=(()=>{let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(n+.5)/64*2-1,i=(t+.5)/64*2-1,a=Math.hypot(r,i),o=Math.abs((Math.atan2(i,r)/(Math.PI*2)*12%1+1)%1-.5)*2,s=Math.round(255*Math.min(1,(.74+.26*Math.exp(-(((1-o)*3.2)**2)))*Math.min(1,Math.max(0,1-Math.abs(a-.81)/.2))*1.06)),c=(t*64+n)*4;e[c]=e[c+1]=e[c+2]=s,e[c+3]=255}let t=new Uo(e,64,64);return t.magFilter=an,t.needsUpdate=!0,t})();function hg(e=!0){return new Nc({color:1777184,roughness:.42,metalness:0,emissive:14676991,emissiveMap:e?mg:null,emissiveIntensity:0,name:`LED ring light diffuser`})}function gg(e,t,n,r,i,a=48){let o=new Bo(tg(`l${n}/${a}`,()=>new vc(n.map(([e,t])=>new W(e,t)),a)),i);return o.name=t,o.rotation.x=Math.PI/2,o.position.set(...r),o.castShadow=o.receiveShadow=!0,e.add(o),o}function _g(e,t,n,r,i,a,o=!1){let s=new Bo(tg(`r${n}/${r}`,()=>new bc(n,r,48,1)),a);return s.name=t,s.position.set(...i),o&&(s.rotation.x=Math.PI),s.receiveShadow=!0,e.add(s),s}function vg(){let[e,t,n]=ne,r=new q;r.name=`Grip check camera`,r.position.set(e,t,0);let i=1.2,a=Math.min(3.4,n*.34),o=Math.max(3.8,n-a),s=.8,c=o-i-s;Z(r,`Camera adapter plate`,[22,22,i],[0,0,i/2],X.silver,.5);for(let e of[-9.9,9.9])for(let t of[-9.9,9.9])Q(r,`Adapter cap screw`,.85,.7,[e,t,1.5499999999999998],X.dark,20),Q(r,`Cap screw socket`,.4,.06,[e,t,1.91],X.bore,6);Z(r,`Board camera housing`,[18,18,c],[0,0,i+c/2],X.base,.7),Z(r,`Camera front plate`,[18,18,s],[0,0,o-s/2],X.dark,.35);for(let e of[-1,1])for(let t of[.33,.66])Z(r,`Housing cooling groove`,[14,.2,.22],[0,e*9.02,i+c*t],X.bore,0),Z(r,`Housing cooling groove`,[.2,14,.22],[e*9.02,0,i+c*t],X.bore,0);let l=new Nc({color:1456674,emissive:2872170,emissiveIntensity:.8,roughness:.3,name:`Camera power LED`});Z(r,`Camera power LED`,[1.1,.16,.7],[5.5,-9.05,o-s-.8],l,0);let u=i+c/2;Q(r,`M8 camera socket`,1.9,1,[-9.5,0,u],X.silver,24).rotation.set(0,0,Math.PI/2),Q(r,`M8 coupling nut`,2.25,2,[-11,0,u],X.edge,12).rotation.set(0,0,Math.PI/2),Q(r,`M8 cable overmould`,1.75,4,[-14,0,u],X.rubber,24).rotation.set(0,0,Math.PI/2);let d=n-1.1;gg(r,`Ring light housing`,[[4.5,o],[8.5,o],[8.5,n-.3],[8.42,n-.08],[8.15,n],[7.9,n],[7.9,d],[4.9,d],[4.9,n-.7],[4.5,n-.7],[4.5,o]],[0,0,0],X.dark,64);let f=hg();_g(r,`Ring light LEDs`,4.95,7.85,[0,0,d+.02],f),Q(r,`M12 lens barrel`,4.4,n-.8-o,[0,0,(n-.8+o)/2],X.dark,40),_g(r,`Lens retaining ring`,2.7,4.4,[0,0,n-.79],X.dark),_g(r,`Lens front chamfer`,3.6,3.75,[0,0,n-.785],X.edge),Q(r,`Camera lens glass`,2.7,.12,[0,0,n-.8],fg,40);let p=Q(r,`Protective window`,7.9,.3,[0,0,n-.35],pg,64);p.castShadow=!1,rg(r,[[-16,0,u],[-18.6,-.3,u-.6],[-20.5,-2.2,1.5],[-21,-8,1.3],[-21,-40,1.3],[-21,-80,1.3],[-21,-100,1.3],[-21,-108,2.2],[-21,-113,5.5],[-21,-117.2,10.6],[-21,-120.6,12.4],[-21,-122,11.3],[-21,-122,9.6]],1.25,X.rubber);for(let e of[-30,-84]){Z(r,`Cable clip base`,[10,4,.6],[-21,e,.3],X.dark,.2),Z(r,`Cable clip saddle`,[3.6,4,3.3],[-21,e,1.65],X.dark,.5);for(let t of[-25,-17])Q(r,`Clip screw`,.8,.6,[t,e,.9],X.silver,16)}Z(r,`Cable port box`,[24,22,16],[-21,-123.2,-4],X.body,1.2),Z(r,`Cable port lid`,[25,23,1.2],[-21,-123.2,4.6],X.dark,.4);for(let e of[-30.5,-11.5])for(let t of[-114.8,-131.6])Q(r,`Port lid screw`,.9,.5,[e,t,5.45],X.silver,16);return Q(r,`Cable gland locknut`,4.4,1.4,[-21,-122,5.9],X.edge,6),Q(r,`Cable gland body`,3.6,2.4,[-21,-122,7.8],X.dark,24),gg(r,`Cable gland dome`,[[3.4,9],[3.2,9.7],[2.4,10.1],[1.35,10.2],[1.35,9]],[-21,-122,0],X.rubber,32),{group:r,light:f}}var yg=new Nc({color:8094086,metalness:.55,roughness:.42,name:`Anodised pallet plate`}),bg=new Nc({color:1776926,roughness:.9,name:`Lift well liner`}),xg=new Nc({color:2895408,roughness:.78,name:`Conductive tote`}),Sg=new Nc({color:14069276,roughness:.6,name:`ESD label`}),Cg=new Nc({color:10691612,roughness:.46,metalness:.08,name:`Red powder coat`}),wg=new Nc({color:8264212,roughness:.5,metalness:.08,name:`Red powder coat lid`}),Tg=new Nc({color:15132899,roughness:.7,name:`Tag label`}),Eg=new Nc({color:3883075,roughness:.55,metalness:.2,name:`Tote store panels`}),Dg=new Nc({color:7106933,metalness:.7,roughness:.48,name:`Zinc plated roller`}),Og=new Nc({color:5264986,metalness:.4,roughness:.5,name:`Conveyor frame`}),kg=new Nc({color:5988708,roughness:.45,metalness:.5,name:`Roller shutter`}),Ag=[ag,og,sg,cg,lg,ug,dg,fg,pg,yg,bg,xg,Sg,Cg,wg,Tg,Eg,kg,Dg,Og];function jg(e,t,n,r){let i=new Bo(tg(`w${t}`,()=>{let e=new js;e.moveTo(0,0),e.lineTo(1.2,0),e.lineTo(1.2,7.7),e.lineTo(g,7.7),e.lineTo(0,7.7-g),e.closePath();let n=new hc(e,{depth:t,bevelEnabled:!1,curveSegments:1,steps:1});return n.rotateX(Math.PI/2),n.translate(0,t/2,0),n}),X.polymer);return i.name=`Molded PBT header`,i.position.set(...n),i.rotation.z=r,i.castShadow=i.receiveShadow=!0,e.add(i),i}function Mg(e,t,n,r){let i=new q;i.name=`Circuit board`,e.add(i),Z(i,`Green FR4 board`,[58,44,1.6],[0,0,8.8],ag,.2);for(let e of[-25,25])for(let t of[-18,18])Q(i,`Board mounting ring`,2,.07,[e,t,9.64],X.gold,24),Q(i,`Board mounting hole`,1.15,.1,[e,t,9.69],X.bore,20);for(let e=0;e<n;e++){let t=-8+e*3.2;Z(i,`Copper trace`,[.3,8,.04],[t,-11,9.62],X.gold,0),Z(i,`PCB trace mask`,[.2,8,.05],[t+.04,-11,9.65],ag,0),Q(i,`Plated via`,.43,.05,[t,-15.2,9.65],X.gold,12),Q(i,`Via bore`,.21,.08,[t,-15.2,9.7],X.bore,12)}Z(i,`Small controller package`,[5.5,7,1],[17,6,10.15],X.polymer,.2);for(let e=0;e<n;e++)for(let t of[-1,1])Z(i,`Package lead`,[1.1,.45,.3],[17+t*3.3,3.5+e,9.85],sg,.05);for(let[e,t]of[[-19,6],[-20,-6],[13,-10],[20,-10],[-12,14]]){Z(i,`Passive component`,[2.1,1,.8],[e,t,10],X.dark,.1);for(let n of[-1,1])Z(i,`Solder fillet`,[.45,1.1,.5],[e+n*1.1,t,9.84],sg,.12)}for(let[e,t]of[[17,6],[-19,6],[-20,-6]])for(let n of[-1,1])Z(i,`Silkscreen footprint`,[.14,4,.02],[e+n*4,t,9.68],cg,0);let a=new q;t.add(a),a.name=`Board header`;let o=new q;a.add(o);let s=7.5+r+h,c=3.6+h,l=s+1.2,u=c+1.2,d=1.6;for(let e of[-1,1])jg(o,2*u,[e*s,0,10.3],e>0?0:Math.PI);jg(o,2*s,[0,c,10.3],Math.PI/2);for(let e of[-1,1])jg(o,s-d,[e*(s+d)/2,-c,10.3],-Math.PI/2);Z(o,`Header seating floor`,[2*l,2*u,1.2],[0,0,10.5],X.polymer,.15),Z(o,`Latch catch`,[5.2,1,1.2],[0,-u-.5,17],X.polymer,.15);for(let[e,t]of Dm(n))Q(a,`Gold header pin`,.35,5.5,[e,t,13.3],X.gold,16),Q(i,`Header solder pad`,.9,.08,[e,t,9.7],sg,16);return{pcb:i,header:a,housing:o}}function Ng(e,t){let n=new q;n.name=`Pallet`,e.add(n),Z(n,`Anodised pallet plate`,[...f],[p.work,d,-f[2]/2],yg,1.2);for(let[e,t]of[[-160,-27],[40,68]])_g(n,`Locating bushing`,2.6,4.6,[e,t,.03],X.silver),Q(n,`Locating bushing bore`,2.6,.1,[e,t,-.03],X.bore,24);Z(n,`Pallet RFID tag`,[14,9,.5],[-135,-28,.25],X.dark,.2),Z(n,`RFID tag label`,[10,5,.08],[-135,-28,.54],Tg,0);let r=new q;r.name=`Board fixture`,e.add(r),Z(r,`Black fixture base`,[94,72,5],[0,0,2.5],X.body,.9),Z(r,`Board nest insert`,[66,54,3],[0,0,6.5],X.polymer,.35);for(let e of[-41,41])for(let t of[-32,32])ng(r,e,t,5.1);for(let[e,t]of[[-25,-18],[25,18]])Q(r,`Locating dowel pin`,1,6,[e,t,9],X.silver,24);let i=[[-34,8],[34,-8]].map(([e,t])=>{let n=new q;return n.name=`Swing clamp`,n.position.set(e,t,0),r.add(n),Z(n,`Fixture clamp`,[14,9,3],[0,0,10.7],X.dark,.4),ng(n,0,0,12.2,2.1),Z(n,`Soft clamp shoe`,[4,9,1],[-Math.sign(e)*5,0,9.8],X.rubber,.15),n}),a=new q;a.name=`Housing nest`,a.position.set(k[0],k[1],0),e.add(a),Z(a,`Quick-change nest plate`,[44,44,5],[0,0,2.5],X.body,.6);for(let e of[-17,17])for(let t of[-17,17])ng(a,e,t,5.2,1.8);for(let e of[-8.6,8.6])Z(a,`Nest end guide`,[2,11,11],[e,0,10.5],X.polymer,.4);for(let e of[-6.8,6.8])Z(a,`Housing support rail`,[1.2,7.2,7],[e,0,8.5],X.polymer,.2);Z(a,`Housing recess`,[16.8,8.9,.25],[0,0,5.15],X.bore,.3);for(let e of[-5.3,5.3])Z(a,`Nest locating ledge`,[7.4,2,4],[e,-5.5,14],X.polymer,.3);for(let e of[-7.5,7.5])Z(a,`Nest locating ledge`,[3,2,4],[e,5.5,14],X.polymer,.3);let o=new q;o.name=`Cable comb`,o.position.set(-104,38,0),e.add(o),Z(o,`Cable comb base`,[t*3+8,14,8],[0,0,4],X.polymer,.6);for(let e=0;e<=t;e++)Z(o,`Cable comb tooth`,[1.3,13,7],[-t*1.5+e*3,0,10],X.polymer,.25);for(let e of[-1,1])ng(o,e*16,0,1,1.8);let s=new q;s.name=`Test adapter`,e.add(s),Z(s,`Pallet tester connector`,[30,10,14],[-104,69,7],X.dark,.5);for(let e=0;e<t;e++){let n=Q(s,`Adapter wire ferrule`,.7,1,[-104+(e-(t-1)/2)*3,63.5,9],X.rubber,12);n.rotation.x=0}for(let e of[-1,1])Q(s,`Adapter screw`,1.1,.6,[-104+e*12,69,14.3],X.silver,16);let c=Q(s,`Dock pin bushing`,2.7,.4,[ig[0],73.79,ig[1]],X.silver,24);c.rotation.x=0;let l=Q(s,`Dock pin bore`,1.75,.1,[ig[0],73.96,ig[1]],X.bore,20);l.rotation.x=0,Z(s,`Ferrule clamp cylinder`,[8,8,8],[-104,69,18],X.dark,1.2);let u=new q;return u.name=`Ferrule clamp`,e.add(u),Q(u,`Ferrule clamp rod`,1.2,2.6,[-104,69,23.2],X.silver,16),Z(u,`Ferrule clamp yoke`,[8,8.5,1.5],[-104,66.75,25.25],X.silver,.3),Z(u,`Ferrule clamp strap`,[8,1,12.55],[-104,62.5,19.225],X.silver,.2),Z(u,`Ferrule clamp bar`,[20,4.5,2],[-104,60.25,11.95],X.silver,.4),Z(u,`Ferrule clamp pad`,[19,4,.5],[-104,60.25,10.7],X.rubber,.1),{plate:n,fixture:r,nest:a,comb:o,adapter:s,clamps:i,ferruleClamp:u}}var Pg=[10249524,2896436,12892574,6912352,5860482,8801609,10263426,4281425],Fg=new Nc({vertexColors:!0,roughness:.65,name:`Harness wire insulation`}),Ig=X.ivory.clone();Ig.name=`Molded nylon`;function Lg(e,t){let n=e.attributes.position.count,r=new J(Pg[t]),i=new Float32Array(n*3);for(let e=0;e<n;e++)r.toArray(i,e*3);e.setAttribute(`color`,new eo(i,3))}function Rg(e,t,n){let r=Dm(e);return Array.from({length:e},(i,a)=>{let o=Array.from({length:143},()=>new G);return nh(o,t,n,0,r[a],a,e),o})}function zg(e,t=`Harness wires`){let n=e.map((e,t)=>{let n=new Sm(Fg,143,Am,200);return n.update(e),Lg(n.geometry,t),n.geometry}),r=new Bo(Om(n,!1),Fg);return n.forEach(e=>e.dispose()),r.name=t,r.castShadow=r.receiveShadow=!0,r}function Bg(e,t,n,r){let i=zg(Rg(t,n,r));return e.add(i),i}var Vg=()=>{let e=Ke(100,`pass`);return{at:new G(...e.plug),turn:e.rotation}};function Hg(e,t,n){let r=new q;r.name=n?`Finished unit`:`Next unit`;let i=new q;i.name=`Unit pallet`,r.add(i);let{clamps:a,ferruleClamp:o}=Ng(i,e);for(let e of a)r.add(e);r.add(o);let s=new q;s.name=`Unit board`,r.add(s);let{header:c}=Mg(s,s,e,t);c.position.set(I[0],I[1],0);let l=new q;l.name=`Unit harness`,r.add(l);let u=Vg(),d=n?u.at:new G(...k),f=n?u.turn:Math.PI,p=Ov(e,Ig);return p.position.copy(d),p.rotation.y=f,l.add(p),Bg(l,e,d,f),{group:r,hardware:i,board:s,harness:l,clamps:a,ferrule:o}}function Ug(e,t){let n=new q;n.name=`Carried unit`,n.visible=!1;let r=new q,i=new q;n.add(r,i);let a=new q;a.name=`Unit board`,n.add(a);let{header:o}=Mg(a,a,e,t);o.position.set(I[0],I[1],0);let s=Vg(),c=Ov(e,Ig);c.position.copy(s.at),c.rotation.y=s.turn,a.add(c);let l=Rg(e,s.at,s.turn),u=l.map((e,t)=>{let n=new Sm(Fg,143,Am,200);return n.update(e),Lg(n.geometry,t),n.mesh.name=`Carried wire ${t+1}`,n.mesh.receiveShadow=!0,n.mesh.visible=!1,n});return{unit:{group:n,hardware:r,board:a,harness:i,clamps:[],ferrule:new q},wires:u,dressed:l,points:l.map(e=>e.map(e=>e.clone())),tracks:[],key:``}}var Wg=(e,t,n)=>({rope:e,gather:e_(e),bundle:t,housing:n,twist:zh(e,t,e.frames.subarray(0,e.n*3),n)}),Gg={n:new Float64Array},Kg={c:new Float64Array};function qg(e,t,n,r=new K){let i=e.rope.n;Kg.c.length<i*3&&(Kg.c=new Float64Array(i*3));let a=_h(e.rope,t,Kg.c),o=Math.max(0,Math.min(e.rope.count-1,(t-e.rope.t0)*e.rope.fps)),s=Math.min(e.rope.count-1,Math.floor(o)),c=e.gather[s]+(e.gather[Math.min(e.rope.count-1,s+1)]-e.gather[s])*(o-s);e.housing(t,r),Gg.n.length<i*3&&(Gg.n=new Float64Array(i*3));let l=Gg.n,u=s*i*3,d=Math.min(e.rope.count-1,s+1)*i*3,f=o-s;for(let t=0;t<i*3;t++)l[t]=e.twist[u+t]+(e.twist[d+t]-e.twist[u+t])*f;return Fh(e.bundle,a,i,r,n,c,l)}var Jg=5,Yg=110,Xg=128,Zg=4,Qg=1;function $g(e,t,n){let r=e[0].length,i=Array.from({length:r},(t,n)=>e.reduce((e,t)=>e.add(t[n]),new G).divideScalar(e.length)),a=i.length,o=new Float64Array(a*3);return i.forEach((e,t)=>{o[t*3]=e.x,o[t*3+1]=e.y,o[t*3+2]=e.z}),{nodes:i,bundle:jh(e,o,a,e=>e,Jg,t,(e,t)=>{if(t<Yg)return null;let[r,i]=qm(e,n);return[-r,i]},new G(1,0,0).transformDirection(t)),attached:e=>{let n=t.clone().invert();return i.slice(0,Jg).map((t,r)=>({node:r,local:t.clone().applyMatrix4(n),frame:e}))}}}function e_(e){let t=new Float32Array(e.count),n=e.n*3,r=n-3;for(let i=0;i<e.count;i++){let a=Math.hypot(e.frames[i*n+r]-e.frames[r],e.frames[i*n+r+1]-e.frames[r+1],e.frames[i*n+r+2]-e.frames[r+2]);t[i]=Y_((a-.2)/3)}for(let n=1;n<e.count;n++)t[n]=Math.max(t[n],t[n-1]);return t}function t_(e,t,n){let r=new K;t&&(t.updateMatrixWorld(!0),r.copy(t.matrixWorld).invert());let i=e=>Math.round(e*1e6)/1e6,a=e=>(e.elements.forEach((t,n)=>e.elements[n]=i(t)),e);return e.map(e=>{e.geometry.computeBoundingBox();let t=e.geometry.boundingBox,o=t.getCenter(new G),s=t.getSize(new G).multiplyScalar(.5);o.set(i(o.x),i(o.y),i(o.z)),s.set(i(s.x),i(s.y),i(s.z));let c=a(new K().multiplyMatrices(r,e.matrixWorld).multiply(new K().makeTranslation(o.x,o.y,o.z)));return n?{name:e.name,half:[s.x,s.y,s.z],pose:(e,t)=>{n(e,t),t.multiply(c)}}:{name:e.name,half:[s.x,s.y,s.z],at:a(e.matrixWorld.clone().multiply(new K().makeTranslation(o.x,o.y,o.z)))}})}var n_=(e,t=()=>!0)=>{let n=[];return e.traverse(e=>{e instanceof Bo&&!(e.geometry instanceof Sc)&&t(e)&&n.push(e)}),n},r_=(e,t)=>new Ia().setFromObject(e).intersectsBox(t);function i_(e,t,n){let r=new q;r.name=`Pallet lift`,e.add(r);for(let e of[-27,68])Z(r,`Lift belt`,[226,12,4],[t,e,-10],n,0);return Z(r,`Lift deck`,[224,110,4],[t,d,-14],X.body,.8),Q(r,`Lift column`,11,70,[t,d,-51],X.edge,40),r}var a_=(()=>{let e=new Uint8Array(512);for(let t=0;t<4;t++)for(let n=0;n<32;n++){let r=(n+.5)/32,i=Math.round(255*(r<.18?.62:r<.26?.4:.3)),a=(t*32+n)*4;e[a]=e[a+1]=e[a+2]=i,e[a+3]=255}return e})();function o_(e,t=8){let n=new Uo(a_,32,4);return n.wrapS=Qt,n.magFilter=an,n.minFilter=sn,n.generateMipmaps=!0,n.anisotropy=8,n.colorSpace=Sr,n.repeat.set(e/t,1),n.needsUpdate=!0,new Nc({color:4869968,roughness:.86,map:n,name:`Cleated conveyor belt`})}var s_={F:[-383,-110],E:[-383,-245],z:-6,size:[149,120,86],pitch:36,face:-1080,store:-1190},c_=[25,0,8.8],l_=-Math.PI/2,u_=[p.unload-p.work+c_[0],c_[1],c_[2]],d_=e=>[s_.size[0]/2-2.5-s_.pitch*e-.4-14-.8,-16.5,77.2],f_={width:2.2,top:23,length:48},p_={thick:.8,height:57,length:114,y:0},m_=e=>s_.size[0]/2-2.5-s_.pitch*e;function h_(e){let t=new q;t.name=e;let n=new q;t.add(n);let[r,i,a]=s_.size;Z(n,`Tote floor`,[r,i,3],[0,0,1.5],xg,1);for(let e of[-1,1])Z(n,`Tote wall`,[2.5,i,a],[e*(r/2-1.25),0,a/2],xg,1),Z(n,`Tote wall`,[r-5,2.5,a],[0,e*(i/2-1.25),a/2],xg,1);for(let e of[-1,1])Z(n,`Tote rim`,[r,4,2],[0,e*(i/2-2),a],xg,.8);Z(n,`ESD label`,[26,.3,18],[38,-i/2-.15,58],Sg,0),Z(n,`Slotted insert`,[r-5,i-5,10],[0,0,8],xg,1);for(let e=1;e<4;e++)Z(n,`Slot divider`,[p_.thick,p_.length,p_.height],[m_(e),p_.y,13+p_.height/2],xg,.2);for(let e=0;e<4;e++){let[t,r]=d_(e);Z(n,`Board rib`,[f_.width,f_.length,f_.top-13],[t,r,(f_.top+13)/2],xg,.3)}return{group:t,shell:n}}function g_(e,t){let n=fh(l_,new K),r=new K().makeTranslation(-c_[0],-c_[1],-c_[2]),i=e.unit.group;i.updateMatrixWorld(!0);let a=new K().copy(i.matrixWorld).invert(),o=new Map;i.traverse(e=>{if(e instanceof Bo&&!Array.isArray(e.material)){let t=(e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone()).applyMatrix4(new K().multiplyMatrices(a,e.matrixWorld));for(let e of Object.keys(t.attributes))[`position`,`normal`].includes(e)||t.deleteAttribute(e);(o.get(e.material)??o.set(e.material,[]).get(e.material)).push({geometry:t,cast:e.castShadow})}});let s=[...o].map(([e,t])=>({material:e,slots:Array.from({length:4},(e,i)=>{let[a,o,s]=d_(i),c=new K().makeTranslation(a,o,s).multiply(n).multiply(r);return Om(t.map(e=>e.geometry.clone().applyMatrix4(c)),!1)})}));return t.length&&s.push({material:Fg,slots:t.map(e=>{let t=zg(e),n=t.geometry.toNonIndexed();return t.geometry.dispose(),n})}),s.map(({material:e,slots:t})=>{let n=[0];for(let e of t)n.push(n.at(-1)+e.attributes.position.count);let r=Om(t,!1);t.forEach(e=>e.dispose());let i=new Bo(r,e);return i.name=`Packed units`,i.castShadow=i.receiveShadow=!0,{mesh:i,counts:n}})}var __=-317,v_=18.75,y_={xs:[1,3,5,7].map(e=>__-v_*(e-.5)),width:7,depth:8,half:54,pitch:27,low:-10,stroke:10,pocket:[-448,-318],cylinders:[[3,30],[5,-30]]},b_=Math.ceil((s_.F[1]-s_.E[1])/y_.pitch-1e-9)*y_.pitch;function x_(e,t,n){let{xs:r,width:i,depth:a,half:o,low:s,pocket:[c,l]}=y_,u=(c+l)/2,d=r[0]-r[3];Z(e,`Transfer base plate`,[l-c-1,119,3],[u,t,-40.5],X.dark,.5);let f=new q;f.name=`Pop-up transfer`,f.position.set(0,t,0),e.add(f);for(let e of r){let t=Z(f,`Transfer belt`,[2*o,i,a],[e,0,s-a/2],n,2);t.rotation.z=Math.PI/2;for(let t of[-1,1])Q(f,`Transfer pulley`,3.6,9,[e,t*(o-4),s-a/2],X.edge,20).rotation.set(0,0,Math.PI/2);Z(f,`Transfer strand rail`,[5,2*o-14,4.5],[e,0,s-a-2.25],X.silver,.4)}for(let e of[-1,1])Z(f,`Transfer lift frame`,[d+12,8,4],[u,e*30,s-a-6.5],X.silver,.5);Q(f,`Transfer drive shaft`,1.5,d+8,[u,-44,s-a-6.5],X.silver,16).rotation.set(0,0,Math.PI/2),Z(f,`Transfer gear motor`,[20,16,10],[u,-28,s-a-9.5],X.body,1);for(let[n,r]of y_.cylinders){let i=__-v_*(n+.5);Q(e,`Transfer lift cylinder`,7,11,[i,t+r,-33.5],X.edge,28),Q(e,`Cylinder end cap`,7.4,1,[i,t+r,-28.5],X.dark,28),Q(f,`Cylinder piston rod`,2.5,13,[i,r,s-a-14.5],X.silver,16)}return f}function S_(e,t){let n=new q;n.name=`Tote conveyor`,e.add(n);let[r,i]=[s_.F,s_.E],a=-308,o=s_.face-2,s=s_.z-3,c=(e,t)=>Z(n,`Conveyor leg`,[24,24,-18-Kh],[e,t,(Kh-18)/2],Og,1);for(let[,e]of[r,i]){for(let t of[-1,1])Z(n,`Roller side frame`,[a-o,4,5.5],[(a+o)/2,e+t*62,-9.25],Og,.6);for(let t=__;t>o;t-=v_){let r=Q(n,`Conveyor roller`,3,118,[t,e,s],Dg,16);r.rotation.x=0}for(let t of[-560,-1e3])for(let n of[-1,1])c(t,e+n*52)}let l=new q;l.name=`Tote store`,n.add(l);let u=s_.face,d=-1290,f=[s_.z,s_.z+92],p=(u+d)/2,m=u-d;Z(l,`Tote store wall`,[8,288,190-Kh],[-1286,-178,(190+Kh)/2],Eg,2);for(let e of[-318,-38])Z(l,`Tote store wall`,[m,8,190-Kh],[p,e,(190+Kh)/2],Eg,2);Z(l,`Tote store top`,[m,288,8],[p,-178,186],Eg,2),Z(l,`Tote store base`,[m,288,f[0]-.6-Kh],[p,-178,(f[0]-.6+Kh)/2],Eg,1),Z(l,`Tote store face`,[5,288,190-f[1]],[u-2.5,-178,(190+f[1])/2],Eg,1),Z(l,`Tote store divider`,[m,r[1]-63-(i[1]+63),f[1]-f[0]],[p,(r[1]-63+(i[1]+63))/2,(f[0]+f[1])/2],Eg,.5),Z(l,`Tote store liner`,[m-10,278,.6],[p,-178,f[0]-.3],bg,0);let h=[r,i].map(([,e])=>Z(t,`Tote store shutter`,[3,126,f[1]-f[0]-.2],[u-9,e,(f[0]+f[1])/2],kg,.5)),g={fill:h_(`Outgoing tote`),out:h_(`Full tote`),spare:h_(`Empty tote`)};for(let e of Object.values(g))t.add(e.group);let _=o_(2*y_.half,y_.pitch);return{totes:g,shutters:h,mouth:f,transfer:{lifts:[x_(n,r[1],_),x_(n,i[1],_)],belt:_}}}var C_=[-330,-60,300],w_=620;function T_(){let e=new q;e.name=`Unload picker`;let t=[-498,150],n=[-513,-182],r=1002;Z(e,`Picker post`,[30,30,1014-Kh],[t[0],t[1],(1014+Kh)/2],X.silver,1.5),Z(e,`Picker post foot`,[60,60,8],[t[0],t[1],Kh+4],X.dark,1),Z(e,`Post to bench bracket`,[36,26,8],[-466,t[1],-46.5],X.dark,.8),Z(e,`Picker X beam`,[n[1]-n[0],24,24],[(n[0]+n[1])/2,150,r],X.silver,1.5),Z(e,`Beam end cap`,[3,26,26],[n[0]-1.5,150,r],X.dark,.6);let i=new q;i.name=`Picker X carriage`,e.add(i),Z(i,`X carriage`,[30,32,18],[0,150,981],X.dark,1),Z(i,`Picker Y rail`,[18,315,18],[0,-15/2,963],X.silver,1.2),Z(i,`Y rail end cap`,[20,3,20],[0,-166.5,963],X.dark,.6);let a=new q;a.name=`Picker Y carriage`,i.add(a),Z(a,`Y carriage`,[30,34,14],[0,0,947],X.dark,1);let o=Q(a,`Picker air cylinder`,11,320,[0,0,780],X.edge,32);o.rotation.x=Math.PI/2,Q(a,`Cylinder end cap`,12,6,[0,0,w_],X.dark,24);let s=new q;s.name=`Cylinder middle stage`,a.add(s),Q(s,`Cylinder stage tube`,8,310,[0,0,155],X.silver,32),Q(s,`Stage gland`,9,4,[0,0,2],X.dark,24);let c=new q;return c.name=`Picker head`,a.add(c),Q(c,`Piston rod`,4.5,310,[0,0,195],X.silver,24),Z(c,`Clamp body`,[16,72,10],[0,0,35],X.dark,1),Z(c,`Clamp slide`,[10,74,3],[0,0,28.5],X.silver,.4),{root:e,x:i,y:a,stage:s,head:c,jaws:[-1,1].map(e=>{let t=new q;t.name=`Clamp jaw`,c.add(t),Z(t,`Clamp jaw arm`,[8,3,34],[0,e*9,13.5],X.silver,.5);let n=new q;n.name=`Tilting pad`,t.add(n),Z(n,`Edge clamp shoe`,[8,5.5,3.4],[0,e*2.75,1],X.rubber,.3);let r=Q(n,`Pad pivot`,3.5,2,[0,e*6.5,0],X.edge,24);if(r.rotation.x=0,e>0){let n=Q(t,`Tilt actuator`,6,6,[0,e*13.5,17],X.dark,28);n.rotation.x=0}return{jaw:t,pad:n,side:e}})}}var E_=e=>(w_+e+40)/2,D_=[60,50],O_=N.lid-6,k_={z:[-14,-2],hold:294300},A_=[N.x-D_[0]/2-.2,N.x+D_[0]/2+.2,N.y-D_[1]/2-.2,N.y+D_[1]/2+.2];function j_(e,t,[n,r,i,a,o,s],c,l){let[u,d,f,p]=A_,m=(n,r,i,a,l)=>{r-n>1e-6&&a-i>1e-6&&Z(e,t,[r-n,a-i,s-o],[(n+r)/2,(i+a)/2,(o+s)/2],c,l)};if(d<=n||u>=r||p<=i||f>=a){m(n,r,i,a,l);return}m(n,u,i,a,0),m(d,r,i,a,0),m(u,d,i,f,0),m(u,d,p,a,0)}var M_=new Nc({color:2829872,roughness:1,name:`Brush bristles`});function N_(){let e=new q;e.name=`Locked reject bin`,e.position.set(N.x,N.y,0);let[t,n]=D_,r=N.floor-12,i=O_-r,a=new Nc({color:1316117,roughness:.95,name:`Bin interior`});for(let a of[-1,1])Z(e,`Reject bin body`,[2,n,i],[a*(t/2-1),0,r+i/2],Cg,.6),Z(e,`Reject bin body`,[t-4,2,i],[0,a*(n/2-1),r+i/2],Cg,.6);Z(e,`Reject bin floor`,[t-4,n-4,12],[0,0,N.floor-6],a,0);for(let o of[-1,1])Z(e,`Bin liner`,[.4,n-4,i-2],[o*(t/2-2-.2),0,r+2+(i-2)/2],a,0),Z(e,`Bin liner`,[t-4-.8,.4,i-2],[0,o*(n/2-2-.2),r+2+(i-2)/2],a,0);let[o,s]=N.opening,c=t+6,l=n+6,u=N.lid-O_;for(let t of[-1,1])Z(e,`Reject bin lid`,[(c-o)/2,l,u],[t*(o+c)/4,0,O_+u/2],wg,1),Z(e,`Reject bin lid`,[o,(l-s)/2,u],[0,t*(s+l)/4,O_+u/2],wg,1);for(let t of[-1,1])Z(e,`Bin opening throat`,[.6,s-1.2,16],[t*(o/2-.3),0,N.lid-8.05],a,0),Z(e,`Bin opening throat`,[o-1.2,.6,16],[0,t*(s/2-.3),N.lid-8.05],a,0);let[d,f]=k_.z;for(let t of[-1,1])Z(e,`Brush seal strip`,[o-1.2,1.6,f-d],[0,t*(s/2-1.4),(d+f)/2],X.rubber,0),Z(e,`Brush seal bristles`,[o-1.4,s/2-2.4,f-d-2],[0,t*(s/4-.1),(d+f)/2],M_,0);Z(e,`Bin hasp`,[9,2,8],[0,-l/2+1,N.lid+3],X.silver,.4),Z(e,`Padlock body`,[12,5,11],[0,-l/2-3.5,5.5],X.silver,.8);let p=new Bo(tg(`padlock`,()=>new xc(3.6,.8,10,24,Math.PI)),X.edge);return p.name=`Padlock shackle`,p.position.set(0,-l/2-1.6,N.lid+3),p.rotation.set(Math.PI/2,0,0),p.castShadow=!0,e.add(p),Z(e,`Bin label`,[18,7,.3],[0,l/2-6,N.lid+.15],Tg,0),e}function P_(e=6){let t=(e===8?9.5:7.5)-7.5,n=new q;n.name=`Connector workcell`;let r=new q;n.add(r),j_(r,`Aluminium jig plate`,[-302,268,-160,-36.5,-12,0],lg,1),j_(r,`Aluminium jig plate`,[-302,268,77.5,220,-12,0],lg,1);for(let e of[-292,258])for(let t of[-150,210])ng(r,e,t,.1,3.2);let[i,a]=y_.pocket,o=[[s_.E[1]-60,s_.E[1]+60],[s_.F[1]-60,s_.F[1]+60]];for(let[e,t,n,s,c,l]of[[a,540,-320,-36.5,-42,2],[-460,i,-320,-36.5,-42,.5],[i,a,-320,o[0][0],-42,.5],[i,a,o[0][1],o[1][0],-42,.5],[i,a,o[1][1],-36.5,-42,.5],[-460,540,77.5,380,-42,2],[-460,-406,-36.5,77.5,-42,.5],[-178,290,-36.5,77.5,Z_,.5],[518,540,-36.5,77.5,-42,.5]])j_(r,`Phenolic worktop`,[e,t,n,s,c,-12],ug,l);Z(r,`Return tunnel liner`,[468,114,.6],[56,d,Q_+.3],bg,0);let s={line:o_(468),unload:o_(226),load:o_(226),tunnel:o_(468)},c=-108-(Q_+.6);for(let e of[-27,68])Z(r,`Return conveyor rail`,[468,8,c],[56,e,Q_+.6+c/2],X.edge,.3),Z(r,`Return conveyor belt`,[468,12,4],[56,e,-106],s.tunnel,0);for(let[e,t,n]of[[-406,-178,1],[290,518,-1]]){let i=(e+t)/2,a=t-e;Z(r,`Lift well liner`,[a,114,.6],[i,d,Q_+.3],bg,0);for(let e of[-1,1]){Z(r,`Lift well liner`,[a,.3,-12.2-Q_-.6],[i,d+e*56.85,(Q_+.6-12.2)/2],bg,0);let t=e===n?Z_:Q_+.6;Z(r,`Lift well liner`,[1,112,-12.2-t],[i+e*(a/2-.5),d,(t-12.2)/2],bg,0)}}for(let e of[-27,68])Z(r,`Conveyor belt`,[468,12,4],[56,e,-10],s.line,0);for(let e of[-38.5,79.5])for(let[t,n]of[[-430,-302],[268,530]])Z(r,`Conveyor side guide`,[n-t,4,12],[(t+n)/2,e,-6],X.silver,.6);let l={unload:i_(r,p.unload,s.unload),load:i_(r,p.load,s.load)};Z(r,`Cabinet body`,[970,660,N.floor-12+672],[40,40,(N.floor-12-672)/2],dg,3),j_(r,`Cabinet body`,[-445,525,-290,370,N.floor-12,Q_],dg,0);for(let[e,t,n,i]of[[-445,525,-290,-36.5],[-445,525,77.5,370],[-445,-406,-36.5,77.5],[518,525,-36.5,77.5]])j_(r,`Cabinet apron`,[e,t,n,i,Q_,-42],dg,0);Z(r,`Cabinet plinth`,[930,600,60],[40,50,-705],X.rubber,1);for(let[e,t]of[[-210,450],[275,450]])for(let[n,i]of[[-110,120],[-240,120],[-400,180],[-590,180]])Z(r,`Drawer front`,[t,6,i],[e+5,-292,n],dg,2.5),Z(r,`Drawer pull`,[t*.45,10,8],[e+5,-299,n+i/2-22],X.silver,3),Z(r,`Drawer label slot`,[46,3,16],[e+5-t*.36,-296,n+i/2-22],X.dark,1);let u=new q;u.name=`Live pallet`,n.add(u);let{plate:f,fixture:m,nest:h,comb:g,adapter:_,ferruleClamp:v}=Ng(u,e),{pcb:y,header:b,housing:x}=Mg(m,u,e,t),S=new q;S.position.y=8,n.add(S),Z(S,`Grey continuity tester`,[78,57,35],[-104,110,18],og,3),Z(S,`Tester gasket seam`,[78.2,57.2,.65],[-104,110,15],X.rubber,.2);for(let e of[-136,-72])for(let t of[90,130])ng(S,e,t,35.7,1.4);let C=new Nc({color:2571313,roughness:.28,metalness:.05,emissive:1202226,emissiveIntensity:0});Q(S,`Indicator bezel`,4.3,1.3,[-104,99,36],X.dark,32),Q(S,`Single pass indicator`,3.2,1.1,[-104,99,36.9],C,32);let w=new q;w.name=`Dock head`,S.add(w),Z(w,`Dock contact head`,[28,5,10],[-104,68.5,ig[1]],X.dark,.5);let T=Q(w,`Dock locating pin`,1.5,4.4,[ig[0],63.8,ig[1]],X.silver,20);T.rotation.x=0;let E=new Bo(tg(`dock pin tip`,()=>new es(1.5,.6,1,20)),X.silver);E.name=`Dock locating pin`,E.position.set(ig[0],61.1,ig[1]),E.castShadow=!0,w.add(E);for(let e of[-116,-92]){let t=Q(w,`Dock guide rod`,1.4,22,[e,82,ig[1]],X.edge,20);t.rotation.x=0}for(let e of[-116,-92]){let t=Q(S,`Guide rod bushing`,2.6,1,[e,81,ig[1]],X.silver,24);t.rotation.x=0}let D=new q;D.position.set(M[0],M[1],0),n.add(D),Z(D,`Reject tray base`,[69,53,3],[0,0,1.5],X.body,1);for(let e of[-1,1])Z(D,`Reject tray wall`,[2.5,53,12],[e*33,0,7],X.body,.7),Z(D,`Reject tray wall`,[65,2.5,12],[0,e*25,7],X.body,.7);Z(D,`Reject tray liner`,[61,45,3],[0,0,4],X.rubber,.5);let O=new q;O.name=`Turnover cradle`,O.position.set(A[0],A[1],0),n.add(O),Z(O,`Turnover base`,[52,74,5],[0,-12,2.5],X.body,.7),Z(O,`Turnover bearing support`,[20,6,30],[0,-22,20],X.silver,.6);let k=Q(O,`Turnover bearing`,7,8,[0,-22,38],X.dark,40);k.rotation.x=0;let j=new q;j.position.z=A[2],O.add(j);let P=Q(j,`Cradle axle`,3,11,[0,-20.5,0],X.edge,32);P.rotation.x=0,Z(j,`Cradle hub`,[16,4,12],[0,-15,0],X.dark,.6),Z(j,`Cradle slide block`,[3,6,3],[-8.5,-14,2.15],X.dark,.3);let F=[];for(let e of[-6.3,6.3]){let t=new q;if(j.add(t),F.push(t),e<0){for(let n of[-3.55,3.55])Z(t,`Turnover clamping jaw`,[3.9,2,10],[n,e+.5,0],X.dark,.4);Z(t,`Turnover clamping jaw`,[11,1,10],[0,e-1,0],X.dark,.3)}else Z(t,`Turnover clamping jaw`,[11,3,10],[0,e,0],X.dark,.5);for(let n of[-4,4])Z(t,`Housing turnover pad`,[2,1.7,8],[n,e-Math.sign(e)*1.85,0],X.rubber,.2);e>0&&(Z(t,`Jaw carrier web`,[2.2,3,4],[-6.5,e,1],X.dark,.3),Z(t,`Jaw carrier bar`,[1.8,23.8,1.2],[-8.5,-4.1,2.15],X.silver,.2))}Z(O,`Turnover actuator`,[22,22,22],[0,-36,38],X.body,1),rg(O,[[10,-36,38],[18,-39,28],[20,-37,4],[12,-23,2]],1.2,X.rubber);let{group:ee,light:te}=vg();n.add(ee);let ne=wm(X);ne.root.scale.setScalar(5),n.add(ne.root);let I=kv(t);n.add(I.root);let re=Ov(e);n.add(re);let L=Array.from({length:e},(e,t)=>{let r=new Sm(new Nc({color:Pg[t],roughness:.65}),143,Am,200);return r.mesh.name=`Harness wire ${t+1}`,r.mesh.receiveShadow=!0,n.add(r.mesh),r}),R=re.userData.latch;n.updateMatrixWorld(!0);let z=[];for(let e of[m,b,h,g,_,S,D,O,ee])e.traverse(e=>{if(e instanceof Bo&&!(e.geometry instanceof Sc)){for(let t=e;t;t=t.parent)if(t===j)return;z.push(new Ia().setFromObject(e))}});Gm(z);let ie=Ug(e,t),ae={unload:Hg(e,t,!0),queue:Hg(e,t,!1),load:Hg(e,t,!1),carried:ie.unit};for(let e of Object.values(ae))n.add(e.group);let oe=S_(r,n),se=T_();n.add(se.root);let ce={...oe.totes.fill,out:oe.totes.out,spare:oe.totes.spare,shutters:oe.shutters,mouth:oe.mouth,transfer:oe.transfer,slots:{fill:[],out:[]}},le=N_();n.add(le);for(let e of ie.wires)n.add(e.mesh);let ue={root:n,bench:r,pallet:u,plate:f,fixture:m,header:b,housing:x,pcb:y,nest:h,comb:g,adapter:_,ferrule:v,tester:S,dockHead:w,bin:D,arm:ne,tool:I,plug:re,latch:R,wires:L,indicator:C,turnover:O,rotator:j,cradleJaws:F,pins:e,upcam:ee,upcamLight:te,wristLight:I.light,wristStatus:I.status,units:ae,lifts:l,tote:ce,rejectBin:le,belts:s,picker:se,carried:ie};ue.post={track:null,u:-1};let de=W_.get(String(e))?.finals??Array.from({length:4},(e,t)=>{let[n,r,i]=d_(t),a=new K().makeTranslation(n,r,i).multiply(fh(l_,new K)).multiply(hv);return ie.dressed.map(e=>e.map(e=>e.clone().applyMatrix4(a)))});ce.slots={fill:g_(ie,e===6?de:[]),out:g_(ie,e===6?de:[])};for(let e of ce.slots.fill)e.mesh.visible=!1,ce.group.add(e.mesh);for(let e of ce.slots.out)e.mesh.visible=!1,ce.out.group.add(e.mesh);return e===6&&L_(ue),yv(ue,J_),ue}var F_=240,I_=new WeakMap;function L_(e){let t=q_(e),n=U_(e),r=t.next(),i=n.next(),a=(function*(){for(;!r.done;)yield,r=t.next();for(;!i.done;)yield,i=n.next();let a=r.value,o=i.value;e.carried.tracks=a.tracks,e.post.track=o;for(let t of[e.tote.slots.fill,e.tote.slots.out])B_(t,a.finals)})(),o=()=>{},s={gen:a,done:!1,ready:new Promise(e=>o=e),finish:()=>{s.done=!0,o()}};I_.set(e,s);let c=s.finish;if(typeof window>`u`){for(;!a.next().done;);c();return}let l=()=>{if(s.done)return;let e=Date.now();for(;Date.now()-e<6;)if(a.next().done){c();return}setTimeout(l,0)};setTimeout(l,0)}function R_(e){let t=I_.get(e);if(t&&!t.done){for(;!t.gen.next().done;);t.finish()}}var z_=e=>I_.get(e)?.ready??Promise.resolve();function B_(e,t){let n=e.find(e=>e.mesh.material===Fg);if(!n)return;let r=n.mesh.geometry,i=r.attributes.position,a=r.attributes.normal;t.forEach((e,t)=>{let r=zg(e),o=r.geometry.toNonIndexed();r.geometry.dispose(),i.array.set(o.attributes.position.array,n.counts[t]*3),a.array.set(o.attributes.normal.array,n.counts[t]*3),o.dispose()}),i.needsUpdate=a.needsUpdate=!0,r.computeBoundingBox(),r.computeBoundingSphere()}var V_=new Map,H_=e=>100+e/b*y*8;function*U_(e){let t=String(e.pins),n=V_.get(t);if(n)return n;e.ferrule.position.z=3,e.root.updateMatrixWorld(!0);let r=NaN,i=Ke(H_(0),`open`),a=e=>(e!==r&&(r=e,i=Ke(H_(Math.min(e,b-1e-4)),`open`)),i),o=(e,t)=>{let n=a(e);return t.makeTranslation(n.plug[0],n.plug[1],n.plug[2]).multiply(fh(n.rotation,mv))},s=new Ia(new G(-330,-180,-130),new G(40,110,200)),c=t_([...n_(e.bench,e=>r_(e,s)&&!K_.test(e.name)),...n_(e.pallet,e=>!/comb tooth|tester connector|Ferrule|clamp cylinder/i.test(e.name)&&!K_.test(e.name)),...n_(e.bin),...[e.turnover,e.upcam,e.tester].flatMap(e=>n_(e,e=>!K_.test(e.name)))],null),l=t_(n_(e.rejectBin,e=>!/liner|label|padlock|hasp|shackle|brush/i.test(e.name)),null).map(e=>({...e,friction:.15})),u=(e,t)=>{let n=a(e);return t.makeTranslation(...n.tool)},d=e.tool.fingers.flatMap((e,t)=>t_(n_(e),e,(n,r)=>{let i=a(n);return r.makeTranslation(i.tool[0]+(t?1:-1)*i.jaw*7+(e.userData.extra??0),i.tool[1],i.tool[2])})),f=t_(n_(e.tool.root,e=>/Black parallel gripper|Ground guide rail|Release/.test(e.name)),e.tool.root,u),p=$g(Rg(e.pins,new G(...M),0),o(0,new K),e.pins);e.ferrule.position.z=0,e.root.updateMatrixWorld(!0);let m=p.nodes.length,h=p.attached(o),g=gh({points:p.nodes,attached:h,held:Array.from({length:m-Xg},(e,t)=>({node:Xg+t,until:P.clamp,pulled:Xg+t===m-1?.5:void 0})),colliders:[...c,...l,...d,...f],t0:0,t1:b,fps:100,mass:e=>e<Jg?12:e===m-1?Zg:1,passes:8,radius:{v:1.5,h:1.5},settle:2,brush:[{box:[N.x-N.opening[0]/2,N.y-N.opening[1]/2,k_.z[0],N.x+N.opening[0]/2,N.y+N.opening[1]/2,k_.z[1]],hold:k_.hold}]});for(;!g.advance(F_);)yield;let _=g.track(),v=1/0,[y,x]=D_;for(let e=0;e<_.count;e++){let t=!0;for(let n=0;n<m;n++){let r=e*m*3+n*3;if(_.frames[r+2]>N.lid-12||Math.abs(_.frames[r]-N.x)>y/2||Math.abs(_.frames[r+1]-N.y)>x/2){t=!1;break}}if(t){v=e/_.fps;break}}let S={...Wg(_,p.bundle,o),hiddenAt:v};return V_.set(t,S),S}var W_=new Map,G_=(e,t)=>{for(let n=e;n;n=n.parent)if(n===t)return!0;return!1},K_=/recess|bushing|bore|tag|label|ferrule$|socket$|ring|via|trace|pad$|lead|fillet|footprint|silkscreen|pin$|dowel/i;function*q_(e){let t=String(e.pins),n=W_.get(t);if(n)return n;let r=e.units.unload,i=e.carried;r.clamps.forEach((e,t)=>{e.position.z=2,e.rotation.z=(t?1:-1)*Math.PI/2}),r.ferrule.position.z=3,e.tote.group.position.set(s_.F[0],s_.F[1],s_.z),e.root.updateMatrixWorld(!0);let a=(e,t)=>{let n=-96*X_(e,T.down,T.low),r=n<=-95.99?X_(e,T.away,T.gone):0;return t.makeTranslation(p.unload-p.work+240*r,0,n)},o=(e,t)=>t.makeTranslation(0,0,e>=T.away?-96*(1-X_(e,T.up,T.back)):-96*X_(e,T.down,T.low)),s=new Ia(new G(-480,-200,-30),new G(-110,110,200)),c=e.tote.transfer.lifts,l=t_(n_(e.bench,t=>!G_(t,e.lifts.unload)&&!c.some(e=>G_(t,e))&&r_(t,s)&&!K_.test(t.name)),null),u=t_([...n_(e.bin),...n_(e.rejectBin)].filter(e=>!K_.test(e.name)),null),d=t_(n_(e.tote.shell,e=>!/label/i.test(e.name)),null),f=t_(n_(r.group,e=>!G_(e,r.board)&&!G_(e,r.harness)&&!/comb tooth/i.test(e.name)&&!K_.test(e.name)),r.group,a),m=t_(n_(e.lifts.unload),e.lifts.unload,o),h=n_(i.unit.board,e=>/FR4|connector housing|PBT header|seating floor|controller package/.test(e.name)),g=e.picker.jaws.flatMap(e=>[...n_(e.jaw,t=>!G_(t,e.pad)).map(t=>({m:t,g:e.jaw,side:e.side,pad:!1})),...n_(e.pad).map(t=>({m:t,g:e.pad,side:e.side,pad:!0}))]),_=[],v=[],y=i.dressed.map(e=>e.map(e=>e.clone().add(new G(p.unload-p.work,0,0)))),b=e=>(t,n)=>gv(t,e,n),x=e=>{let t=new K;return g.flatMap(({m:n,g:r,side:i,pad:a})=>t_([n],r,(n,r)=>{let o=fv(n,e);return r.makeTranslation(o.P.x,o.P.y+i*(22+3*(1-o.jaw)),o.P.z),a&&r.multiply(fh(o.tilt,t)),r}))},S=$g(y,gv(C.closed,0,new K),e.pins),w=C.closed+Math.floor((C.carry-C.closed)*100+1e-9)/100,E=[{node:S.nodes.length-1,until:0,pulled:.5}],D={points:S.nodes,attached:S.attached(b(0)),held:E,colliders:[...l,...u,...d,...f,...m,...t_(h,i.unit.group,b(0)),...x(0)],t0:C.closed,t1:w,fps:100,stateAt:w,settle:Qg},O=Array.from({length:4},(e,t)=>{let n=[];for(let e=0;e<t;e++){let[t,r,a]=d_(e),o=new K().makeTranslation(s_.F[0]+t,s_.F[1]+r,s_.z+a).multiply(fh(l_,new K)).multiply(hv);n.push(...t_(h,i.unit.group,(e,t)=>t.copy(o)).map(e=>{let t=new K;return e.pose(0,t),t.elements.forEach((e,n)=>t.elements[n]=Math.round(e*1e6)/1e6),{name:e.name,half:e.half,at:t}}))}return[...l,...u,...d,...f,...m,...t_(h,i.unit.group,b(t)),...x(t),...n]});r.clamps.forEach(e=>{e.position.z=0,e.rotation.z=0}),r.ferrule.position.z=0,e.root.updateMatrixWorld(!0);let k=gh(D);for(;!k.advance(F_);)yield;let A=k.track();for(let e=0;e<4;e++){let t=b(e),n=gh({points:S.nodes,attached:S.attached(t),held:E,colliders:O[e],t0:w,t1:C.open,fps:100,from:A.state,settle:Qg});for(;!n.advance(F_);)yield;let r=n.track(),i=new Float32Array(A.frames.length+r.frames.length-S.nodes.length*3);i.set(A.frames),i.set(r.frames.subarray(S.nodes.length*3),A.frames.length);let a=Wg({n:A.n,t0:A.t0,t1:r.t1,fps:100,frames:i,count:A.count+r.count-1},S.bundle,t);_.push(a);let o=y.map(e=>e.map(()=>new G));qg(a,C.open,o),v.push(o.map(e=>e.map(e=>e.sub(new G(s_.F[0],s_.F[1],s_.z)))))}let j={tracks:_,finals:v};return W_.set(t,j),j}var J_={shift:0,dock:1,liveHarness:!0,unloadZ:0,unloadUnit:`none`,loadZ:-96,tote:0,pack:!1,swap:!1,shot:`wide`,focus:[...k],unitLabel:``,lineNote:``},Y_=e=>{let t=Math.max(0,Math.min(1,e));return t*t*t*(10+t*(-15+6*t))},X_=(e,t,n)=>Y_((e-t)/(n-t)),Z_=-52,Q_=-116;function $_(e,t,n,r=.3){if(e<=t)return 0;if(e>=n)return 1;let i=n-t,a=1/(i-r),o=e-t;if(o<r)return a*o*o/(2*r);if(o>i-r){let e=i-o;return 1-a*e*e/(2*r)}return a*(o-r/2)}var ev=4,tv=[1.8,5.4],nv=e=>s_.F[0]+(s_.store-s_.F[0])*$_(e,w.out,ev),rv=e=>s_.store+(s_.E[0]-s_.store)*$_(e,tv[0],tv[1]),iv=(e,t)=>{for(let n=0;n<8;n+=.002)if(t(e(n)))return n;return 8},av=iv(nv,e=>e+s_.size[0]/2<s_.face-12),ov=iv(nv,e=>e-s_.size[0]/2<s_.face+60),sv=iv(rv,e=>e-s_.size[0]/2>s_.face+12),cv={over:[-100.35,35.03],raised:430,swing:[1.1,.48]},lv=(e,t)=>t*$_(e,C.descend,C.placed,.3);function uv(e){let[t,n]=cv.swing,r=(t+n)/2,i=C.over-C.carry-r,a=0;for(let o of[0,t/2,n/2,r])a+=.25*X_(e,C.carry+o,C.carry+o+i);return a}var dv=[];function fv(e,t){for(let n of dv)if(n.t===e&&n.slot===t)return n.m;let n=pv(e,t);return dv.unshift({t:e,slot:t,m:n}),dv.length>4&&dv.pop(),n}function pv(e,t){let n=new G(...u_),r=new G(...C_),[i,a,o]=d_(t),s=new G(s_.F[0]+i,s_.F[1]+a,s_.z+o),c=new G(s.x,s.y,s.z+130),l=r.clone(),u=0,d=0;if(!(e<C.down)){if(e<C.clamp)l.lerpVectors(r,n,X_(e,C.down,C.clamp));else if(e<C.free)l.copy(n),d=X_(e,C.clamp,C.closed),l.z+=6*X_(e,C.closed,C.free);else if(e<C.open){d=1;let t=uv(e),r=X_(e,C.free+.2,C.raised-.05),i=cv.over,a=cv.raised,o=n.x+i[0]*r,c=n.y+i[1]*r;l.set(o+(s.x-o)*t,c+(s.y-c)*t,n.z+6+(a-n.z-6)*X_(e,C.free,C.raised)+(575-a)*X_(e,C.raised+.5,C.lifted)-lv(e,575-s.z)),u=l_*X_(e,C.free+.2,C.free+.9)}else e<C.clear?(u=l_,d=1-X_(e,C.open,C.open+.15),l.lerpVectors(s,c,X_(e,C.open+.15,C.clear))):e<C.home&&(l.lerpVectors(c,r,X_(e,C.clear,C.home)),u=l_*(1-X_(e,C.clear+.05,C.home-.1)))}return{P:l,tilt:u,jaw:d,held:e>=C.closed&&e<C.open}}new K;var mv=new K,hv=new K().makeTranslation(-c_[0],-c_[1],-c_[2]);function gv(e,t,n=new K){let r=fv(e,t);return n.makeTranslation(r.P.x,r.P.y,r.P.z).multiply(fh(r.tilt,mv)).multiply(hv)}function _v(e,t){let[n,r]=[s_.F,s_.E];if(!t)return{fill:[n[0],n[1]],out:null,spare:[r[0],r[1]],shutters:[0,0],lift:0,raise:0,travel:0};let i=nv(e),a=rv(e),o=(t,n,r,i)=>X_(e,t,n)*(1-X_(e,r,i)),s=X_(e,w.in,w.across)*(1-X_(e,w.down,w.done)),c=(n[1]-r[1])*$_(e,w.across,w.down,.25);return{fill:[n[0],r[1]+c],out:e<av+.4?[i,n[1]]:null,spare:e>tv[0]-.4?[a,r[1]]:null,shutters:[o(ov-.35,ov,av,av+.35),o(tv[0]-.35,tv[0],sv,sv+.35)],lift:s,raise:Math.max(0,y_.low+y_.stroke*s-s_.z),travel:c+(b_-(n[1]-r[1]))*X_(e,w.down+.75*(w.done-w.down),w.done)}}var vv=new K;new K,new K,new G,new G;function yv(e,t){let n=t.shift,r=t.progress??0,i=S(t.lineProgress??r),a=r>=100;e.pallet.position.x=-n,e.plug.visible=t.liveHarness;let o=t.post??-1;o>=0&&e.post&&!e.post.track&&R_(e);let s=e.post?.track;e.post&&(e.post.u=s?o:-1),e.ferrule.position.z=o>=0?3*X_(o,P.clamp-.3,P.clamp)*(1-X_(o,b-.4,b)):0,o>=0&&s&&o>=s.hiddenAt&&(e.plug.visible=!1);for(let t of e.wires)t.mesh.position.x=-n;let{unload:c,queue:l,load:u,carried:d}=e.units,f=e=>e<=-95.99,m=f(t.unloadZ)?a?1:X_(i,T.away,T.gone):0,h=f(t.loadZ)&&!a?1-X_(i,E.in,E.under):0;c.group.position.set(p.unload-p.work+240*m,0,t.unloadZ),l.group.position.set(232-n,0,0),u.group.position.set(464-n-240*h,0,t.loadZ),c.group.visible=m<.999,u.group.visible=h<.999,e.lifts.unload.position.z=a?0:i>=T.away?-96*(1-X_(i,T.up,T.back)):t.unloadZ,e.lifts.load.position.z=a?0:i<E.in?-96*X_(i,E.down,E.low):t.loadZ;let g=(e,t)=>{e.map.offset.x=t/8%1};g(e.belts.line,n),g(e.belts.unload,n-240*m),g(e.belts.load,n-240*(1-h)),g(e.belts.tunnel,-240*(m+1-h)),e.dockHead.position.y=8*(1-t.dock);let _=t.pack&&t.unloadUnit===`finished`,v=Math.max(0,Math.min(3,t.tote-(_&&i>=C.open?1:0))),y=_?fv(i,v):fv(0,0);c.board.visible=t.unloadUnit!==`none`&&!(_&&i>=C.closed),c.harness.visible=t.unloadUnit===`finished`&&!(_&&i>=C.closed),c.clamps.forEach((e,t)=>{e.position.z=_?2*X_(i,.05,.2):0,e.rotation.z=(t?1:-1)*(_?Math.PI/2*X_(i,.2,.45):0)});let x=e.picker;x.x.position.x=y.P.x,x.y.position.y=y.P.y,x.head.position.z=y.P.z,x.stage.position.z=E_(y.P.z);for(let e of x.jaws)e.jaw.position.y=e.side*(22+3*(1-y.jaw)),e.pad.rotation.y=y.tilt;let w=e.carried,D=d.group;D.visible=_&&y.held,gv(i,v,vv).decompose(D.position,D.quaternion,D.scale),D.visible&&!w.tracks[v]&&R_(e);let O=D.visible?w.tracks[v]:void 0;for(let e of w.wires)e.mesh.visible=!!O;let k=``;O&&(k=`${v}:${i.toFixed(5)}`,k!==w.key&&(w.key=k,qg(O,i,w.points),w.wires.forEach((e,t)=>e.update(w.points[t])))),c.ferrule.position.z=_?3*X_(i,.05,.35)*(1-X_(i,T.down-.3,T.down)):0;let A=_v(i,_&&t.swap),j=(e,t,n)=>{e.visible=!!t,e.position.set(t?t[0]:s_.store,t?t[1]:n,s_.z)};j(e.tote.group,A.fill,s_.F[1]),j(e.tote.out.group,A.out,s_.F[1]),j(e.tote.spare.group,A.spare,s_.E[1]),e.tote.group.position.z+=A.raise;for(let t of e.tote.transfer.lifts)t.position.z=y_.stroke*A.lift;if(e.tote.transfer.belt.map.offset.x=-(A.travel/y_.pitch%1),e.tote.shutters.forEach((t,n)=>t.position.z=(e.tote.mouth[0]+e.tote.mouth[1])/2+95*A.shutters[n]),e.tote.slots){for(let n of e.tote.slots.fill)n.mesh.geometry.setDrawRange(0,n.counts[t.tote]),n.mesh.visible=t.tote>0;for(let t of e.tote.slots.out)t.mesh.visible=!!A.out}return[n,t.dock,t.liveHarness,t.unloadZ,t.unloadUnit,t.loadZ,t.tote,_,t.swap,e.lifts.unload.position.z,e.lifts.load.position.z,m,h,...y.P.toArray(),y.tilt,y.jaw,k,c.ferrule.position.z,o,e.ferrule.position.z,...[A.fill,A.out,A.spare].flat(),...A.shutters,A.lift,A.travel,_&&i<.5?i:0].map(e=>typeof e==`number`?e.toFixed(3):String(e)).join()}var bv=Array.from({length:10},()=>new G),xv=new G;function Sv(e,t=``){let n=e.post;if(n?.track&&n.u>=0){let r=`post:${n.u.toFixed(5)}`;return r===t?r:(qg(n.track,n.u,Cv),e.wires.forEach((e,t)=>e.update(Cv[t])),r)}xv.copy(e.plug.position),xv.x-=e.pallet.position.x;let r=[xv.x,xv.y,xv.z,e.plug.rotation.y,e.plug.rotation.z].map(e=>e.toFixed(4)).join();if(r===t)return r;let i=Dm(e.pins);for(let t=0;t<e.pins;t++)nh(bv,xv,e.plug.rotation.y,e.plug.rotation.z,i[t],t,e.pins),e.wires[t].update(bv);return r}var Cv=Array.from({length:8},()=>Array.from({length:143},()=>new G)),wv=.3,Tv=9.3;function Ev(e,t){e.rotation.x=-Math.max(0,t*1-wv)/Tv}function Dv(e,t){e.position.y=t*1}function Ov(e=6,t=X.ivory.clone()){let n=e===8?9.5:7.5,r=new q;r.name=`Six-wire connector`;let i=new Bo(Em(n,3.6,e),t);i.geometry.scale(1,1,12/7.8),i.position.z=-3.9,i.castShadow=i.receiveShadow=!0,i.name=`Nylon connector housing`,r.add(i);for(let[t,n]of Dm(e)){let e=new Bo(tg(`contact ring`,()=>new bc(.36,.57,16)),X.gold);e.position.set(t,n,-4.01),e.rotation.x=Math.PI,r.add(e),Q(r,`Wire entry seal`,.62,.18,[t,n,8.25],X.ivory,20)}for(let e of[-1,1])Z(r,`Molded keying rib`,[.5,.45,5],[e*6.3,-3.65,-.3],X.ivory,.1);let a=new q;return a.name=`Connector latch`,a.position.set(0,-4.6,-3.4),r.add(a),Z(a,`Latch root`,[2,1.05,.8],[0,.525,.4],X.ivory,.1),Z(a,`Free latch beam`,[2,.6,8.6],[0,0,4.3],X.ivory,.12),Z(a,`Latch hook`,[2.3,.85,1],[0,-.125,4.2],X.ivory,.12),Z(a,`Latch press tab`,[2.4,.9,1.8],[0,-.4,9.3],X.ivory,.15),r.userData.latch=a,r}function kv(e=0){let t=new q;t.name=`Parallel gripper and custom fingers`,Q(t,`Tool coupling`,19,7,[0,0,76.5],X.edge,64),Q(t,`Six-axis force sensor`,18,12,[0,0,67],X.dark,64),Q(t,`Sensor face`,18.5,1,[0,0,60.5],X.silver,64);for(let e=0;e<6;e++){let n=e/6*Math.PI*2;ng(t,Math.cos(n)*15,Math.sin(n)*15,79.5,1.4)}Z(t,`Black parallel gripper`,[53,31,24],[0,0,47.5],X.body,1.4),Z(t,`Ground guide rail`,[42,25,3],[0,0,34.5],X.dark,.3),Z(t,`Gripper guide slot`,[42,.7,3],[0,-15.62,44],X.bore,.2);for(let e of[-23,23])for(let n of[41,54]){let r=Q(t,`Gripper front fastener`,1.6,.5,[e,-15.7,n],X.silver,24);r.rotation.x=0;let i=Q(t,`Gripper fastener socket`,.7,.07,[e,-16,n],X.dark,6);i.rotation.x=0}let n=[-1,1].map(n=>{let r=new q;r.position.x=n*e,r.userData.extra=n*e,t.add(r),Z(r,`Moving jaw carriage`,[11,20,7],[n*14,0,30],X.dark,.45),Z(r,`Brushed aluminium finger`,[5.4,10,19],[n*13,0,18.5],X.silver,.5),Z(r,`Custom fingertip`,[5.1,6.6,6],[n*10.5,0,6],X.silver,.32),Z(r,`Housing contact face`,[.35,5.2,4],[n*7.68,0,5],X.rubber,.05),Z(r,`Insertion back stop`,[1.6,2,1.2],[n*6.9,-2,8.8-m],X.silver,.12);for(let e of[16,24]){let t=Q(r,`Finger mounting screw`,1.5,.4,[n*13,-5.2,e],X.dark,20);t.rotation.x=0}return r});Z(t,`Release cylinder bracket`,[6,1.6,26],[0,-16.3,23],X.silver,.3);let r=Q(t,`Release air cylinder`,2.2,7,[0,-12,11.8],X.edge,32);r.rotation.x=0,Q(t,`Release air fitting`,.9,1.6,[0,-13.5,14.6],X.silver,16);let i=new q;i.name=`Release plunger`,t.add(i);let a=Q(i,`Release plunger rod`,.5,2.4,[0,-7.3,11.8],X.silver,16);a.rotation.x=0,Z(i,`Release blade`,[1.4,.8,8.5],[0,-5.85,8.25],X.dark,.15);let o=new q;t.add(o),Z(o,`Wrist camera bracket`,[18,5,4],[29,3,61],X.silver,.3),Z(o,`Wrist camera`,[16,17,22],[34,5,45],X.dark,1.2),Q(o,`Camera lens barrel`,5.8,6,[34,5,31],X.dark,40),Q(o,`Camera lens glass`,4.3,.4,[34,5,27.8],fg,40),gg(o,`Wrist ring light housing`,[[6,34],[6,29.2],[6.4,29.2],[6.4,29.7],[7.5,29.7],[7.5,29.2],[7.72,29.2],[7.95,29.42],[8,29.7],[8,34],[6,34]],[34,5,0],X.dark,64);let s=hg(!1);gg(o,`Wrist ring light diffuser`,[[6.45,29.7],[6.45,28.7],[7.5,28.7],[7.5,29.7]],[34,5,0],s,64);let c=new Nc({color:1516828,emissive:2872170,emissiveIntensity:0,roughness:.3,name:`Camera status LED`});Z(o,`Camera status LED`,[.16,1.2,.9],[42.06,10.2,53.6],c,0),rg(t,[[34,12,51],[31,21,58],[23,19,63],[24,16,70]],1.1,X.rubber);let l=new G(28,9,50),u=Q(t,`Gripper cable gland`,3,6,l.toArray(),X.edge,32);return u.rotation.z=Math.PI/2,u.rotation.x=0,{root:t,fingers:n,plunger:i,gland:l,light:s,status:c}}function Av(e){e.updateMatrixWorld(!0);let t=new K().copy(e.matrixWorld).invert(),n=new Map,r=[];e.traverse(e=>{e instanceof Bo&&!Array.isArray(e.material)&&r.push(e)});for(let e of r){let r=(e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone()).applyMatrix4(new K().multiplyMatrices(t,e.matrixWorld));for(let e of Object.keys(r.attributes))[`position`,`normal`,`color`].includes(e)||r.deleteAttribute(e);let i=e.material,a=`${i.uuid}:${e.castShadow}:${e.receiveShadow}:${r.attributes.color?`c`:``}`;n.has(a)||n.set(a,{material:i,cast:e.castShadow,receive:e.receiveShadow,parts:[]}),n.get(a).parts.push(r),e.removeFromParent()}for(let t of[...e.children])t instanceof Bo||e.remove(t);for(let{material:t,cast:r,receive:i,parts:a}of n.values()){let n=Om(a,!1);if(a.forEach(e=>e.dispose()),!n)continue;let o=new Bo(n,t);o.name=`${e.name} / ${t.name||`part`}`,o.castShadow=r,o.receiveShadow=i,e.add(o)}}function jv(e){let t=new Set([...Object.values(X),...Ag]),n=new Set(eg.values()),r=new Set,i=new Set;e.traverse(e=>{if(e instanceof Bo){n.has(e.geometry)||r.add(e.geometry);for(let n of Array.isArray(e.material)?e.material:[e.material])t.has(n)||i.add(n)}}),r.forEach(e=>e.dispose()),i.forEach(e=>e.dispose())}function Mv(){let e=new xa,t=(e,t)=>new Oo({color:new J(e).multiplyScalar(t),side:1}),n=new Bo(new $o(60,16,60),[t(14146524,.5),t(14146524,.5),t(13225422,.6),t(8422527,.3),t(14146524,.45),t(14146524,.6)]);n.position.y=6,e.add(n);let r=new Oo({color:new J(16777215).multiplyScalar(9)});for(let t=-24;t<=24;t+=6)for(let n=-24;n<=24;n+=6){let i=new Bo(new $o(1.2,.1,1.2),r);i.position.set(t,13.8,n),e.add(i)}let i=new Oo({color:new J(15857402).multiplyScalar(4)});for(let t=-24;t<=24;t+=8){let n=new Bo(new $o(6,2.5,.1),i);n.position.set(t,10,-29.8),e.add(n)}return e}var Nv=class{frames=[];epoch=-1;delay=70;push(e,t,n){n!==this.epoch&&(this.frames=[],this.epoch=n);let r={at:t,pose:[...e]};this.frames.at(-1)?.at===t?this.frames[this.frames.length-1]=r:this.frames.push(r),this.frames.length>12&&this.frames.shift()}sample(e){if(!this.frames.length)return null;let t=e-this.delay;for(;this.frames.length>2&&this.frames[1].at<=t;)this.frames.shift();let n=this.frames[0],r=this.frames[1];if(!r||t<=n.at)return n.pose;let i=Math.max(0,Math.min(1,(t-n.at)/(r.at-n.at)));return n.pose.map((e,t)=>e+(r.pose[t]-e)*i)}pending(e){return this.frames.length>1&&e<this.frames.at(-1).at+this.delay}},Pv=(e,t)=>1-Math.exp(-e/t);function Fv(e,t,n,r,i=20){let a=e-n,o=t+i*a,s=Math.exp(-i*r);return{position:n+(a+o*r)*s,velocity:(t-i*o*r)*s}}function Iv(e,t,n){return Math.hypot(e,t)>6&&(!n||Math.abs(e)>Math.abs(t))}function Lv(e,t,n,r){return e===0&&t<300&&Math.hypot(n,r)<5}function Rv(e,t,n,r,i,a){let o=new K().lookAt(e,t,new G(0,0,1)),s=n.clone().sub(e).applyMatrix4(o.transpose()),c=-s.z;return c<=0?new W:new W(s.x/c*a/r,-s.y/c*a/i)}function zv(e,t,n=8e3){return t?Math.max(250,n-e):e>=n-1?0:Math.max(250,n-e)}var Bv=e=>{let t=Math.max(0,Math.min(1,e/.7));return 1-t*t*(3-2*t)},Vv=[{id:`arm`,name:`Arm`,line:`Six joints. Brings the connector down and feels the push back.`},{id:`gripper`,name:`Gripper`,line:`Holds the connector straight on the way down.`},{id:`connector`,name:`Connector`,line:`The part. Six or eight contacts.`},{id:`socket`,name:`Socket`,line:`Where it goes. Shift it and watch what happens.`},{id:`tester`,name:`Tester`,line:`Checks each contact after the arm tests the latch.`}],Hv=8e3,Uv={desktop:[{ratio:2,ao:!0,bokeh:!0},{ratio:1.5,ao:!0,bokeh:!0},{ratio:1.25,ao:!0,bokeh:!1},{ratio:1,ao:!1,bokeh:!1}],phone:[{ratio:1.5,ao:!0,bokeh:!1},{ratio:1.25,ao:!0,bokeh:!1},{ratio:1,ao:!1,bokeh:!1}]},Wv=18,Gv=class{renderer;scene=new xa;camera=new gl(25,1,30,15e4);controls;composer;ao;bokeh;rig=P_();hall=$h();config;poses=new Nv;state=null;playing=!1;afterRender=null;mode=`machine`;viewMode=`overview`;focus=`socket`;process=Ke(0);director=!1;disposed=!1;ready;quality=0;warmPrograms=0;container;hud;embed;frame=0;last=0;width=1;height=1;warming=!0;rendered=0;cameraMoving=!0;spread=0;renderedPose=``;dressed=``;lineKey=``;target=new G;position=new G;shift=new W;camPos=new G;camTgt=new G;velP=new G;velT=new G;lensVel=0;shown=new W;shiftVel=new W;ro;io;visible=!0;light=matchMedia(`(pointer: coarse), (max-width: 700px)`).matches;tiers=this.light?Uv.phone:Uv.desktop;tier=this.tiers[0];labels=new Map;basePose=[0,0,42,0];band=`wide`;shotFor(e){if(e.shot!==`work`||!e.pack||e.progress>=100)return e.shot;let t=S(e.lineProgress??e.progress);return t>=Jv&&t<C.open?`pack`:`work`}free=!1;lastInput=-1e9;lastProgress=0;followed=new G;scrubbing=!1;gesture=null;touches=new Set;hoverAt=0;hoverTimer=0;hovered=null;fine=matchMedia(`(hover: hover) and (pointer: fine)`).matches;lens=35;shownLens=35;blur=0;letGo=0;regripping=!1;deferredSetup=!1;shot(){return this.process?.shot??`work`}boardWeight(){let e=this.process;return e?.focus?1-hi.smoothstep(Math.hypot(e.focus[0]-I[0]+9,e.focus[1]-I[1]+1.6,e.focus[2]-64),4,60):0}focalPoint=new G;headerAt=new G;ray=new zl;reduceMotion=matchMedia(`(prefers-reduced-motion: reduce)`).matches;glow=oy();plugMaterials=[];wireMaterials=[];shroud=[];unitCuts=[];plugSee=1;wiresSee=1;cut=1;key;constructor(e,t,n=null,r=!1){this.container=e,this.config=t,this.hud=n,this.embed=r,this.renderer=new up({antialias:!0,powerPreference:`high-performance`}),this.renderer.debug.checkShaderErrors=!1,this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.tier.ratio)),this.renderer.outputColorSpace=Sr,this.renderer.toneMapping=7,this.renderer.toneMappingExposure=1,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=1,this.renderer.shadowMap.autoUpdate=!1,e.append(this.renderer.domElement),this.renderer.domElement.setAttribute(`role`,`img`),this.renderer.domElement.style.opacity=`0`,this.renderer.domElement.setAttribute(`aria-label`,`Interactive rendered connector workcell in an empty factory hall. White six-joint arm, two-finger gripper, six-wire harness, green circuit board, fixture, tester and reject tray.`),this.camera.up.set(0,0,1),this.scene.background=new J(12106683),this.scene.fog=new ba(12106683,105e-7),this.controls=new xp(this.camera,this.renderer.domElement),Object.assign(this.controls,{enableDamping:!0,dampingFactor:.08,enablePan:!1,minDistance:150,maxDistance:3500,minPolarAngle:.015,maxPolarAngle:Math.PI*.49,rotateSpeed:.45,zoomSpeed:1.95,zoomToCursor:!0}),this.controls.touches={ONE:Zt.ROTATE,TWO:Zt.DOLLY_ROTATE},r&&(this.controls.enableZoom=!1),this.renderer.domElement.style.touchAction=`pan-y`,this.renderer.domElement.style.cursor=`grab`,this.controls.addEventListener(`change`,this.wake),e.addEventListener(`wheel`,this.wheel,{capture:!0,passive:!0});let i=this.renderer.domElement;i.addEventListener(`pointerdown`,this.pointerDown,{capture:!0}),i.addEventListener(`pointermove`,this.pointerMove),i.addEventListener(`pointerup`,this.pointerUp),i.addEventListener(`pointercancel`,this.pointerUp),i.addEventListener(`pointerleave`,this.pointerLeave),i.addEventListener(`webglcontextlost`,this.contextLost);let a=Mv(),o=new gu(this.renderer);this.scene.environment=o.fromScene(a,.02).texture,this.scene.environmentIntensity=.9,a.traverse(e=>{e instanceof Bo&&(e.geometry.dispose(),[e.material].flat().forEach(e=>e.dispose()))}),this.scene.environmentRotation.x=Math.PI/2,o.dispose();let s=this.key=new yl(16777215,2.5);s.position.set(-260,-420,1500),s.target.position.set(-40,0,60),s.castShadow=!0,s.shadow.mapSize.setScalar(this.light?2048:4096),s.shadow.normalBias=.12,s.shadow.bias=-1e-4,s.shadow.radius=3,ny(s),this.scene.add(s,s.target);let c=new il(15988471,6120031,.27);c.position.set(0,0,1e3),this.scene.add(c);let l=new yl(15397366,.62);l.position.set(300,1400,700),this.scene.add(l),this.scene.add(this.hall,this.rig.root,this.glow.root),this.batchRig(),this.tagParts(),this.composer=new Hp(this.renderer,new Li(1,1,{samples:this.light?2:4,type:hn})),this.composer.addPass(new Up(this.scene,this.camera)),this.ao=new $p(this.scene,this.camera,1,1),this.ao.blendIntensity=.55,this.ao.updateGtaoMaterial({radius:10,distanceExponent:1.6,thickness:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:!1}),this.ao.updatePdMaterial({radius:3,rings:2,samples:8}),this.composer.addPass(this.ao),this.bokeh=new tm(this.scene,this.camera,{focus:1200,aperture:7e-6,maxblur:.003}),this.bokeh.materialBokeh.fragmentShader=this.bokeh.materialBokeh.fragmentShader.replace(`float factor = ( focus + viewZ );`,`float factor = ( focus + viewZ ) / max( -viewZ, 1.0 );`),this.composer.addPass(this.bokeh),this.composer.addPass(new rm);let u=this.ao.setSize.bind(this.ao);this.ao.setSize=(e,t)=>{let n=1/Math.max(1,this.renderer.getPixelRatio());u(Math.round(e*n),Math.round(t*n))};for(let e of[this.ao,this.bokeh]){let t=e.render.bind(e);e.render=(...e)=>{let n=this.glow.root.visible,r=this.hideFaded();this.glow.root.visible=!1,t(...e),this.glow.root.visible=n;for(let e of r)e.visible=!0}}this.configure(t),this.applyProcess(this.process),this.ro=new ResizeObserver(this.layout),this.ro.observe(e),this.io=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting,this.wake()}),this.io.observe(e),document.addEventListener(`visibilitychange`,this.wake),this.layout(),this.snap(),this.ready=this.warmUp().catch(e=>console.warn(`warm-up`,e)).finally(()=>{this.warming=!1,this.renderer.domElement.style.opacity=``})}tracksDone(){return!!this.rig.post?.track}tracksBuilt(){let e=this.rig;return new Promise(t=>{let n=!1,r=()=>{n||(n=!0,t())};z_(this.rig).then(r);let i=()=>{n||this.disposed||(e.post?.track?r():setTimeout(i,100))};i()})}frameShot(e,t,n,r){this.lens=r,this.target.set(e[0],e[1],e[2]),this.position.copy(this.target).addScaledVector(new G(t[0],t[1],t[2]).normalize(),n),this.shift.set(0,0),this.snap(),this.wake()}wheel=e=>{if(!e.ctrlKey&&!e.metaKey){e.stopPropagation();return}this.controls.enableZoom&&(this.takeOver(),this.noteInput())};idleTimer=0;noteInput(){this.lastInput=performance.now(),this.free&&this.armIdle(Hv)}armIdle(e){clearTimeout(this.idleTimer),this.idleTimer=window.setTimeout(this.idleCheck,e)}idleCheck=()=>{if(this.idleTimer=0,!this.free||this.disposed)return;let e=zv(performance.now()-this.lastInput,!!this.gesture||this.touches.size>0,Hv);if(e>0){this.armIdle(e);return}this.guided()};contextLost=e=>{e.preventDefault(),this.container.dispatchEvent(new CustomEvent(`renderer-lost`))};pointerDown=e=>{if(this.noteInput(),this.showTooltip(null),e.pointerType===`touch`&&(this.touches.add(e.pointerId),this.touches.size>1)){this.gesture&&(this.gesture.dragged=!0),this.takeOver();return}this.gesture||={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),button:e.button,touch:e.pointerType===`touch`,dragged:!1,pos:this.camera.position.clone(),tgt:this.controls.target.clone()}};pointerMove=e=>{let t=this.gesture;if(t){if(e.pointerId!==t.id)return;this.noteInput(),!t.dragged&&e.buttons&&Iv(e.clientX-t.x,e.clientY-t.y,t.touch)&&(t.dragged=!0,this.takeOver(),this.renderer.domElement.style.cursor=`grabbing`);return}this.free&&this.noteInput(),e.pointerType===`mouse`&&this.fine&&!e.buttons&&this.hover(e.clientX,e.clientY)};pointerUp=e=>{this.touches.delete(e.pointerId),this.free&&this.noteInput();let t=this.gesture;if(!t||e.pointerId!==t.id)return;if(this.gesture=null,t.dragged&&(this.renderer.domElement.style.cursor=`grab`),e.type===`pointercancel`){t.dragged||(this.camera.position.copy(t.pos),this.controls.target.copy(t.tgt),this.stopOrbit(),this.wake());return}if(t.dragged||!Lv(t.button,performance.now()-t.t,e.clientX-t.x,e.clientY-t.y))return;let n=this.pickAt(e.clientX,e.clientY);n&&(this.hud?.onPick?this.hud.onPick(n):this.pick(n))};pointerLeave=()=>{this.gesture||this.showTooltip(null)};pick(e){e===`connector`||e===`gripper`?this.view(`connector`):this.focusPart(e)}pickAt(e,t){let n=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new W((e-n.left)/n.width*2-1,-(t-n.top)/n.height*2+1),this.camera);for(let e of this.ray.intersectObject(this.rig.root,!0)){let t=e.object,n=!0;for(;t;){if(!t.visible){n=!1;break}t=t.parent}if(!n)continue;let r=e.object.material;if(!(r.transparent&&r.opacity<.5))return e.object.userData.part??null}return null}hover(e,t){let n=performance.now();if(clearTimeout(this.hoverTimer),n-this.hoverAt<90){this.hoverTimer=window.setTimeout(()=>this.hover(e,t),90-(n-this.hoverAt));return}this.hoverAt=n;let r=this.pickAt(e,t);this.renderer.domElement.style.cursor=r?`pointer`:`grab`,this.showTooltip(r,e,t)}showTooltip(e,t=0,n=0){let r=this.hud?.tooltip;if(this.hovered=e,!r)return;if(!e){r.classList.remove(`visible`),this.gesture||(this.renderer.domElement.style.cursor=`grab`);return}let i=this.container.getBoundingClientRect(),a=Vv.find(t=>t.id===e)?.name??e,o=r.querySelector(`strong`),s=r.querySelector(`p`);o&&o.textContent!==a&&(o.textContent=a),s&&(s.hidden=!0),r.style.transform=`translate(${Math.round(t-i.left+14)}px,${Math.round(n-i.top+16)}px)`,r.classList.add(`visible`)}takeOver(){this.free||(this.free=!0,this.director=!1,this.cameraMoving=!1,this.velP.set(0,0,0),this.velT.set(0,0,0),this.lensVel=0,this.shiftVel.set(0,0),this.lens=this.shownLens,this.followed.copy(this.target),this.showTooltip(null),this.hud?.onFree?.(!0),this.settle(`free`),this.noteInput(),this.wake())}guided(){this.release()&&this.goal()}release(){return this.free?(this.free=!1,this.carry.set(0,0,0),clearTimeout(this.idleTimer),this.idleTimer=0,this.camPos.copy(this.camera.position),this.camTgt.copy(this.controls.target),this.hud?.onFree?.(!1),!0):!1}stopOrbit(){let e=this.controls;e._sphericalDelta.set(0,0,0),e._scale=1,e._panOffset.set(0,0,0)}setScrubbing(e){this.scrubbing!==e&&(this.scrubbing=e,this.lastInput=performance.now(),!e&&this.process&&this.shotFor(this.process)!==this.band&&(this.band=this.shotFor(this.process),this.free||this.goal()))}ensureVariant(e){this.rig.pins!==e&&(jv(this.rig.root),this.scene.remove(this.rig.root),this.rig=P_(e),this.scene.add(this.rig.root),this.batchRig(),this.tagParts(),this.renderedPose=this.dressed=this.lineKey=``)}partGroups(){return{arm:this.rig.arm.root,gripper:this.rig.tool.root,connector:this.rig.plug,socket:this.rig.header,tester:this.rig.tester}}tagParts(){for(let[e,t]of Object.entries(this.partGroups()))if(t.traverse(t=>t.userData.part=e),!this.labels.has(e)){let t=document.createElement(`div`);t.className=`cell-label`,t.textContent=Vv.find(t=>t.id===e)?.name??e,t.hidden=!0,this.hud?.labels.append(t),this.labels.set(e,t)}}batchRig(){let e=this.rig,t=e=>{let t=e.clone();return t.userData.canFade=!0,t};for(let t of[e.bench,e.plate,e.fixture,e.nest,e.comb,e.adapter,e.bin,e.upcam,e.tool.root,e.plug])Gh(t,new Set);this.unitCuts=[];for(let n of Object.values(e.units))for(let e of[n.board,n.harness]){let n=new Map;e.traverse(e=>{if(e instanceof Bo&&/PBT header|Header seating floor|Latch catch|connector housing/.test(e.name)){let r=e.material;n.has(r)||n.set(r,t(r)),e.material=n.get(r)}}),this.unitCuts.push({group:e,materials:[...n.values()]})}let n=new Nc({color:qv,roughness:.92,name:`Conductive foam insert`});for(let t of[e.tote.shell,e.tote.out.shell,e.tote.spare.shell])t.traverse(e=>{e instanceof Bo&&e.name===`Slotted insert`&&(e.material=n)});for(let t of[e.tote.shell,e.tote.out.shell,e.tote.spare.shell,e.rejectBin,...Object.values(e.units).flatMap(e=>[e.hardware,e.board,e.harness])])Av(t);Gh(e.picker.root,new Set),Gh(e.tester,new Set([e.dockHead])),this.plugMaterials=[],this.shroud=[],e.plug.traverse(e=>{if(e instanceof Bo){e.userData.unique||(e.material=t(e.material),e.userData.unique=!0);let n=e.material;n.userData.cut=e.name.includes(`housing`),this.plugMaterials.push(n)}}),e.housing.traverse(e=>{e instanceof Bo&&(e.userData.unique||(e.material=t(e.material),e.userData.unique=!0),this.shroud.push(e.material))}),this.wireMaterials=e.wires.map(e=>{let t=e.mesh.material;return t.userData.canFade=!0,t}),e.plug.traverse(e=>{e instanceof Bo&&(e.castShadow=!0,e.customDepthMaterial=this.plugDepth)});for(let t of e.wires)t.mesh.castShadow=!0,t.mesh.customDepthMaterial=this.wiresDepth;this.harnessOut=-1,this.shadowSee=``}plugDepth=new Ic({alphaHash:!0});wiresDepth=new Ic({alphaHash:!0});shadowSee=``;harnessOut=0;harnessSee=1;fadeHarness(e){Math.abs(e-this.harnessOut)<1e-4||(this.harnessOut=e,this.harnessSee=1-hi.smoothstep(e,0,1))}seeThrough(){let e=this.cut,t=(e,t,n)=>{let r=t<.998;e.transparent!==r&&(e.transparent=r,e.needsUpdate=!0),e.opacity=t,e.depthWrite=n||!r},n=e<.998;for(let r of this.plugMaterials)t(r,this.plugSee*(r.userData.cut?e:1),!(n&&r.userData.cut));for(let e of this.wireMaterials)t(e,this.wiresSee,!0);for(let r of this.shroud)t(r,e,!n);for(let{group:r,materials:i}of this.unitCuts){let a=r.userData.fade??1;for(let r of i)t(r,a*e,!n)}this.rig.plug.userData.fade=this.plugSee;for(let e of this.rig.wires)e.mesh.userData.fade=this.wiresSee;this.plugDepth.opacity=this.plugSee,this.wiresDepth.opacity=this.wiresSee;let r=this.plugSee.toFixed(3)+this.wiresSee.toFixed(3);r!==this.shadowSee&&(this.shadowSee=r,this.renderer.shadowMap.needsUpdate=!0)}hideFaded(){let e=[];return this.rig.root.traverse(t=>{let n=t.userData.fade;t.visible&&n!==void 0&&n<.98&&(t.visible=!1,e.push(t))}),e}configure(e){if(this.config=e,!this.process&&(this.state?.released||this.regripping||this.state?.phase===`reset`)){this.deferredSetup=!0,this.wake();return}this.deferredSetup=!1,this.process||(this.ensureVariant(e.variant===`eight`?8:6),this.rig.header.position.set(e.offsetX,e.offsetY,0),this.rig.header.rotation.z=e.yaw*Math.PI/180),this.wake()}update(e,t,n=!1,r=1){this.state=e,this.playing=n,e.released||(this.regripping=!1),this.deferredSetup&&!e.released&&!this.regripping&&e.phase!==`reset`&&e.phase!==`complete`&&this.configure(this.config),this.process||(this.poses.push(e.pose,performance.now(),t),this.wake())}regrip(){return this.regripping=!0,this.wake(),this.process?0:Math.ceil(this.letGo*ry)}setProcess(e){if(this.process=e,!this.warming){if(e?(this.ensureVariant(6),this.rig.header.position.set(I[0],I[1],0),this.rig.header.rotation.z=0,this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=0):(yv(this.rig,J_),this.fadeHarness(0),Ev(this.rig.latch,0),Dv(this.rig.tool.plunger,0),this.lineKey=``,this.configure(this.config)),e){this.applyProcess(e);let t=this.shotFor(e),n=!this.scrubbing&&t!==this.band,r=this.lastProgress-e.progress>50;n&&(this.band=t),this.lastProgress=e.progress,(n||r)&&this.free&&!this.gesture&&performance.now()-this.lastInput>8e3?this.guided():(this.viewMode===`connector`||this.mode===`parts`||n&&this.viewMode===`overview`)&&this.goal()}else this.state&&this.poses.push(this.state.pose,performance.now(),Date.now());this.wake()}}applyProcess(e){this.rig.tool.root.position.set(...e.tool),this.rig.plug.position.set(...e.plug),this.rig.plug.rotation.y=e.rotation,this.rig.rotator.rotation.y=e.cradle,this.rig.tool.fingers.forEach((t,n)=>t.position.x=(n?1:-1)*e.jaw*7),this.rig.cradleJaws.forEach((t,n)=>t.position.y=(n?1:-1)*e.cradleGrip*5),Ev(this.rig.latch,e.latch),Dv(this.rig.tool.plunger,e.latch),this.lineKey=yv(this.rig,{...J_,...e}),this.fadeHarness(e.harnessOut??0),this.rig.indicator.color.setHex(e.accepted===!0?3643233:e.accepted===!1?11681836:2571313),this.rig.indicator.emissive.setHex(e.accepted===!0?2393152:e.accepted===!1?10498076:0),this.rig.indicator.emissiveIntensity=e.accepted===null?0:.9,this.lights(e.headerCheck,e.graspCheck,e.camera,e.plug[2]-(Math.abs(e.rotation)<.5?4.05:8.25))}lights(e,t,n,r=ne[2]+30){let i=e=>Math.max(0,Math.min(1,e||0));this.rig.wristLight.emissiveIntensity=1.5*i(e),this.rig.upcamLight.emissiveIntensity=1.5*i(t),this.rig.wristStatus.emissiveIntensity=n?1.2:0,this.glow.cone.visible=i(t)>0,this.glow.coneMaterial.opacity=.04*i(t);let a=Math.max(4,Math.min(40,r-ne[2]-.3));this.glow.cone.scale.set(1,a,1),this.glow.cone.position.z=ne[2]+a/2,this.glow.pool.visible=i(e)>0,this.glow.pool.position.z=9.76+this.rig.fixture.position.z,this.glow.poolMaterial.opacity=.32*i(e),this.glow.root.visible=this.glow.cone.visible||this.glow.pool.visible}poseRig(){let e=this.rig.tool.root,t=this.rig.plug,n=e.position.clone().add(new G(0,0,80)).divideScalar(5),r=[...e.position.toArray(),...t.position.toArray(),t.rotation.y,t.rotation.z,e.rotation.z,this.spread,this.rig.latch.rotation.x,...this.rig.tool.fingers.map(e=>e.position.x),...this.rig.cradleJaws.map(e=>e.position.y),this.rig.rotator.rotation.y].map(e=>e.toFixed(4)).join()+this.lineKey;if(r===this.renderedPose)return;this.renderedPose=r;let i=this.rig.tool.gland.clone().applyAxisAngle(new G(0,0,1),e.rotation.z).add(e.position).add(new G(3,0,0)).divideScalar(5);this.rig.arm.set(n,e.rotation.z,i);let a=this.rig.plug.visible&&this.wiresSee>.01;a&&(this.dressed=Sv(this.rig,this.dressed));for(let e of this.rig.wires)e.mesh.visible=a;this.renderer.shadowMap.needsUpdate=!0}setMode(e){this.mode=e,this.goal()}setInspect(e){this.setMode(e?`inside`:`machine`)}view(e){this.viewMode=e===`cell`?`overview`:e===`close`?`connector`:e,this.director=!1,this.release(),this.goal()}focusPart(e){this.focus=e,this.viewMode=`part`,this.release(),this.goal()}direct(e){this.director=e,this.hud?.onDirector?.(e),e&&(this.viewMode=`connector`,this.release(),this.goal())}hold(e){}offline(){this.playing=!1,this.wake()}goal(){let e=this.process,t=this.viewMode===`connector`,n=this.mode===`parts`,r=n||this.viewMode!==`overview`?`work`:this.band;this.goalShot=this.viewMode===`overview`&&!n?r:`close`;let i=this.width<this.height,a=Math.max(1,1.12/(this.width/this.height)),o=new G,s=null;if(this.shift.set(0,0),t){this.lens=100;let t=this.lensScale(100),r=this.closeAt(e),o=this.posting(e),s=Math.max(29,r[2]+15);if(e){let e=hi.smoothstep(30-Math.hypot(r[0]-ne[0],r[1]-ne[1]),4,26);s+=(Math.max(ne[2]+8,(r[2]+ne[2])/2+2)-s)*e}let c=this.boardWeight();this.target.set(r[0],r[1],s+(r[2]-s)*c+(n?55:0));let l=e?.progress??0,u=hi.smoothstep(l,Zv.from-Zv.ramp,Zv.from)*(1-hi.smoothstep(l,Zv.to,Zv.to+Zv.ramp)),d=new G(...Zv.dir).normalize().lerp(new G(...Zv.turn).normalize(),u).normalize();this.position.copy(this.target).addScaledVector(d,Zv.dist*a*t*(1+Zv.board*c)),i&&(this.shift.y=.09),o&&this.carried&&!this.free&&this.carry.add(this.target).sub(this.carried),o?(this.carried??=new G).copy(this.target):this.carried=null}else if(this.viewMode===`part`){let e=Qv[this.focus]??Qv.socket;this.lens=e.lens;let t=new Ia().setFromObject(this.partGroups()[this.focus]).getBoundingSphere(new so);this.target.copy(t.center);let n=this.camera.getFilmHeight()/2/this.lens,r=this.camera.getFilmWidth()/2/this.lens,i=Math.atan(Math.min(n,r)),a=Math.max(160,t.radius*e.fill/Math.sin(i));this.position.copy(this.target).addScaledVector(new G(...e.dir).normalize(),a)}else{s=n?Yv.parts:r===`wide`?Yv.wide:r===`line`?Yv.line:r===`reject`?Yv.reject:r===`pack`?Yv.pack:Yv.work;let t=i&&s.pt?s.pt:s.t,c=this.viewMode===`top`?[0,-.02,1]:this.viewMode===`side`?[.7,-1,.13]:i&&s.pdir?s.pdir:s.dir;this.lens=i&&s.plens?s.plens:s.lens,this.target.set(t[0],t[1],t[2]),n&&e&&(this.target.x+=(e.plug[0]-I[0])*.6,this.target.y+=(e.plug[1]-I[1])*.5);let l=s.dist*(i?s.pdist??1:!i&&this.height<=500?s.ldist??1:1)*a**.5*Math.max(1,this.width/this.height/1.6)**(i?0:s.wide??0),u=i&&s.plook?s.plook:s.look;u?(o.set(u[0],u[1],u[2]),this.position.copy(o).addScaledVector(new G(...c).normalize(),l)):this.position.copy(this.target).addScaledVector(new G(...c).normalize(),l)}if(s&&(i&&s.plook||!i&&s.look)&&this.shift.copy(Rv(this.position,this.target,o,this.camera.getFilmWidth(),this.camera.getFilmHeight(),this.lens)),s?.lsx&&!i&&this.height<=500&&(this.shift.x+=s.lsx),this.free){if(t){let e=this.target.clone().sub(this.followed);this.camera.position.add(e),this.controls.target.add(e)}this.followed.copy(this.target),this.wake();return}this.followed.copy(this.target),this.cameraMoving=!0,this.wake()}carry=new G;carried=null;posting(e){return(e?.post??-1)>=0}closeAt(e){return e?this.posting(e)?[e.plug[0],e.plug[1],e.plug[2]]:e.focus??e.plug:[0,0,15]}lensScale(e){return Math.tan(25*Math.PI/360)/(this.camera.getFilmHeight()/2/e)}goalShot=`wide`;settledShot=``;settle(e){e!==this.settledShot&&(this.settledShot=e,this.hud?.onSettle?.(e))}snap(){this.free||this.settle(this.goalShot),this.shownLens=this.lens,this.camera.setFocalLength(this.lens),this.shown.copy(this.shift),this.applyOffset(),this.camPos.copy(this.position),this.camTgt.copy(this.target),this.camera.position.copy(this.position),this.controls.target.copy(this.target),this.camera.lookAt(this.target),this.velP.set(0,0,0),this.velT.set(0,0,0),this.lensVel=0,this.shiftVel.set(0,0),this.cameraMoving=!1}applyOffset(){let e=this.width,t=this.height,n=this.embed?0:-.075*hi.smoothstep(e,900,1150);this.camera.setViewOffset(e,t,e*(n+this.shown.x),t*(.01+this.shown.y),e,t)}layout=()=>{let e=this.container.getBoundingClientRect();e.width&&e.height&&(this.width=e.width,this.height=e.height,this.camera.aspect=e.width/e.height,this.camera.filmGauge=36,this.renderer.setSize(e.width,e.height),this.composer.setSize(e.width,e.height),this.applyOffset(),this.free?(this.camera.updateProjectionMatrix(),this.wake()):this.goal())};applyTier(e){this.quality=e,this.tier=this.tiers[e];let t=Math.min(devicePixelRatio,this.tier.ratio);this.renderer.setPixelRatio(t),this.composer.setPixelRatio(t),this.renderer.setSize(this.width,this.height),this.composer.setSize(this.width,this.height)}async warmUp(){let e=this.renderer,t=()=>new Promise(e=>requestAnimationFrame(()=>e()));await t();let n=[],r=new Map;this.scene.traverse(e=>{e.visible||=(n.push(e),!0);let t=e.material;if(t)for(let e of[t].flat())e.userData.canFade&&r.set(e,e.transparent)});let i=this.ao.enabled,a=this.bokeh.enabled,o=(t,n)=>{this.ao.enabled=t,this.bokeh.enabled=n,e.shadowMap.needsUpdate=!0,this.composer.render()},s=new Li(1,1),c=[];this.scene.traverse(e=>{e instanceof Bo&&c.push(e)});let l=async e=>{let t=c.filter(e=>e.frustumCulled);for(let e of t)e.frustumCulled=!1;try{e()}finally{for(let e of t)e.frustumCulled=!0}},u=async n=>{for(let r=0;r<n.length;r+=8){let i=new Set(n.slice(r,r+8)),a=[];for(let e of c)e.visible=i.has(e),e.visible&&e.frustumCulled&&(e.frustumCulled=!1,a.push(e));e.setRenderTarget(s),await e.compileAsync(this.scene,this.camera),e.setRenderTarget(s),e.shadowMap.needsUpdate=!0,e.render(this.scene,this.camera),e.setRenderTarget(null);for(let e of a)e.frustumCulled=!0;await t()}for(let e of c)e.visible=!0};try{await u(c),await l(()=>{o(!1,!1)}),await t(),await l(()=>o(!0,!1)),await t(),await l(()=>o(!0,!this.light)),await t();for(let e of r.keys())e.transparent=!r.get(e),e.needsUpdate=!0;await u(c.filter(e=>[e.material].flat().some(e=>r.has(e)))),await l(()=>o(!0,!this.light)),await t(),o(!1,!1),await t()}finally{for(let[e,t]of r)e.transparent=t,e.needsUpdate=!0;for(let e of n)e.visible=!1;this.ao.enabled=i,this.bokeh.enabled=a}s.dispose(),o(!0,!this.light),o(!1,!1),await t(),this.warmPrograms=e.info.programs?.length??0;let d=Number(new URLSearchParams(location.search).get(`tier`));Number.isInteger(d)&&d>=0&&d<this.tiers.length&&new URLSearchParams(location.search).has(`tier`)?this.applyTier(d):await this.benchmark(),this.warmPrograms=e.info.programs?.length??0,this.warming=!1,this.renderedPose=``;let f=this.process;f&&this.setProcess(f),this.snap();let p=this.rendered;for(;this.rendered<p+3&&!this.disposed&&(this.wake(),await t(),!document.hidden););}async benchmark(){let e=this.renderer,t=e.getContext(),n=new Uint8Array(4),r=()=>new Promise(e=>requestAnimationFrame(e)),i=this.viewMode;this.viewMode=`connector`,this.goal(),this.snap(),this.camera.updateMatrixWorld();let a=async i=>{let a=[];for(let o=0;o<i;o++){await r();let i=performance.now();this.ao.enabled=this.tier.ao,this.bokeh.enabled=this.tier.bokeh,e.shadowMap.needsUpdate=!0,this.composer.render(),t.readPixels(0,0,1,1,t.RGBA,t.UNSIGNED_BYTE,n),o>=4&&a.push(performance.now()-i)}return a.sort((e,t)=>e-t),a[Math.floor(a.length/2)]},o=[];for(let e=0;e<this.tiers.length;e++){this.applyTier(e);let t=await a(e?24:40);if(o.push(+t.toFixed(1)),t<=Wv||e===this.tiers.length-1)break}this.benchmarkMs=o,this.viewMode=i,this.goal()}benchmarkMs=[];wake=()=>{!this.frame&&!this.disposed&&!document.hidden&&this.visible&&!this.warming&&(this.frame=requestAnimationFrame(this.animate))};animate=e=>{if(this.frame=0,this.disposed||document.hidden||!this.visible||this.warming)return;let t=e-(this.last||e-16),n=t>100?1e3/60:Math.min(50,t);if(this.last=e,!this.process){let t=this.poses.sample(e);t&&(this.basePose=[t[0]*1e3,t[1]*1e3,t[2]*1e3,t[3]]),this.rig.tool.root.rotation.z=this.rig.plug.rotation.z=this.basePose[3],this.rig.plug.rotation.y=0;let r=this.state?.released&&!this.regripping?1:0;this.letGo=r>this.letGo?Math.min(1,this.letGo+n/ry):Math.max(0,this.letGo-n/ry);let i=hi.smootherstep(this.letGo,0,.35);this.rig.tool.fingers.forEach((e,t)=>e.position.x=(t?1:-1)*7*i),this.rig.indicator.emissive.setHex(0),this.rig.indicator.color.setHex(this.state?.accepted===!0?3643233:2571313),this.lights(0,0,!1)}let r=+(this.mode===`parts`),i=this.spread;this.spread+=(r-this.spread)*Pv(n,190),Math.abs(r-this.spread)<.001&&(this.spread=r);let a=this.mode===`inside`?.32:1,o=this.cut;this.cut+=(a-this.cut)*Pv(n,110),Math.abs(a-this.cut)<.002&&(this.cut=a),this.plugSee=this.harnessSee,this.wiresSee=this.harnessSee*Bv(this.spread),this.rig.header.position.z=this.spread*$v.header,this.rig.fixture.position.z=this.spread*$v.fixture,this.rig.tester.position.x=this.spread*$v.tester,this.process?this.applyProcess(this.process):(this.rig.plug.position.set(this.basePose[0],this.basePose[1],this.basePose[2]),this.rig.tool.root.position.copy(this.rig.plug.position),this.rig.tool.root.position.z+=m+iy*hi.smootherstep(this.letGo,.4,1));let s=this.process?1-this.process.jaw:this.letGo>0?0:1;this.rig.tool.root.position.z+=this.spread*$v.tool,this.rig.plug.position.z+=this.spread*($v.plug+($v.tool-$v.plug)*s),this.seeThrough(),this.poseRig(),this.free||(this.cameraMoving&&this.glide(n/1e3),this.stopOrbit(),this.camera.position.copy(this.camPos),this.controls.target.copy(this.camTgt),this.camera.lookAt(this.camTgt));let c=this.free?this.controls.update():!1,l=this.bokeh.uniforms,u=this.process,d=this.viewMode===`connector`;if(this.focalPoint.copy(this.viewMode===`part`?this.controls.target:this.rig.plug.position),d&&u?.focus&&this.focalPoint.set(...this.closeAt(u)),this.viewMode!==`part`){let e=this.focalPoint.clone(),t=this.rig.header.getWorldPosition(this.headerAt),n=Math.hypot(e.x-t.x,e.y-t.y)<5&&Math.abs(this.rig.plug.rotation.y)<.01;this.focalPoint.y-=n?5.25:3.6,this.focalPoint.z=n?Math.max(18,e.z-4):e.z+2,d&&this.focalPoint.lerp(this.headerAt.set(t.x,t.y,14),this.boardWeight())}this.focalPoint.applyMatrix4(this.camera.matrixWorldInverse);let f=Math.max(101,-this.focalPoint.z);l.focus.value=f;let p=this.tier.bokeh&&this.mode===`machine`&&(this.viewMode===`connector`||this.viewMode===`part`)?1:0;this.blur+=(p-this.blur)*Pv(n,260),Math.abs(p-this.blur)<.01&&(this.blur=p);let h=this.camera.getFocalLength();l.aperture.value=this.blur*h*h/(8*Math.max(1,f-h)*this.camera.getFilmWidth()*.8),this.bokeh.enabled=this.blur>0,this.ao.enabled=this.tier.ao&&this.mode!==`inside`,this.placeLabels(),this.composer.render(),this.rendered++,this.afterRender?.(),(this.playing&&!this.process||this.cameraMoving||c||i!==this.spread||o!==this.cut||this.blur>0&&this.blur<1||this.poses.pending(e)&&!this.process||!this.process&&this.letGo!==(this.state?.released&&!this.regripping?1:0)||this.afterRender)&&this.wake()};glide(e){let t=hi.smoothstep(this.camPos.distanceTo(this.position),60,500),n=this.reduceMotion?400:this.viewMode===`connector`?7-3.6*t:this.viewMode===`part`?4.2:3,r=(t,r,i)=>{for(let a of[`x`,`y`,`z`]){let o=Fv(t[a],r[a],i[a],e,n);t[a]=o.position,r[a]=o.velocity}};this.camPos.add(this.carry),this.camTgt.add(this.carry),this.carry.set(0,0,0),r(this.camPos,this.velP,this.position),r(this.camTgt,this.velT,this.target);let i=Fv(this.shownLens,this.lensVel,this.lens,e,n);this.shownLens=i.position,this.lensVel=i.velocity,this.camera.setFocalLength(this.shownLens);for(let t of[`x`,`y`]){let r=Fv(this.shown[t],this.shiftVel[t],this.shift[t],e,n);this.shown[t]=r.position,this.shiftVel[t]=r.velocity}this.applyOffset(),this.camPos.distanceTo(this.position)<6&&this.camTgt.distanceTo(this.target)<3&&this.velP.length()<15&&Math.abs(this.shownLens-this.lens)<.2&&this.settle(this.goalShot),this.camPos.distanceTo(this.position)<.02&&this.velP.length()<.05&&this.camTgt.distanceTo(this.target)<.02&&this.velT.length()<.05&&Math.abs(this.shownLens-this.lens)<.002&&Math.abs(this.lensVel)<.01&&this.shown.distanceTo(this.shift)<1e-5&&this.snap()}placeLabels(){let e=this.partGroups(),t=this.mode===`parts`,n=[];for(let[r,i]of this.labels){if(i.hidden=!t,!t)continue;let a=new Ia().setFromObject(e[r]).getCenter(new G).project(this.camera);n.push({label:i,id:r,x:(a.x*.5+.5)*this.width,y:(-a.y*.5+.5)*this.height-(r===`tester`?34:0)})}if(!t)return;n.sort((e,t)=>e.y-t.y);let r=[];for(let e of n){let t=e.label.offsetWidth||80,n=(e.label.offsetHeight||28)+6,i=e.y;for(let a of r)Math.abs(a.x-e.x)<Math.max(a.w,t)&&i<a.y+n&&(i=a.y+n);r.push({x:e.x,y:i,w:t});let a=Math.round(i-e.y);e.label.style.transform=`translate(${e.x}px,${i}px)`,e.label.style.setProperty(`--lead`,`${a}px`),e.label.classList.toggle(`led`,a>2)}}dispose(){let e=this.renderer.domElement;this.disposed=!0,cancelAnimationFrame(this.frame),clearTimeout(this.hoverTimer),clearTimeout(this.idleTimer),this.plugDepth.dispose(),this.wiresDepth.dispose(),this.ro.disconnect(),this.io.disconnect(),this.controls.dispose(),jv(this.rig.root),this.scene.environment?.dispose(),this.composer.dispose(),this.ao.dispose(),this.bokeh.dispose(),this.renderer.dispose(),document.removeEventListener(`visibilitychange`,this.wake),this.container.removeEventListener(`wheel`,this.wheel,{capture:!0}),e.removeEventListener(`pointerdown`,this.pointerDown,{capture:!0}),e.remove(),this.labels.forEach(e=>e.remove())}},Kv=5.2,qv=5593434,Jv=1,Yv={wide:{t:[-30,40,60],look:[-30,40,190],dir:[1,-.22,.035],dist:1280,lens:35,pt:[-30,20,80],plook:[-30,20,260],pdist:.68},work:{t:[-95,-5,95],dir:[.32,-1,.86],dist:1620,lens:50,pt:[20,-10,30],pdir:[.4,-1,1.1],pdist:.55,plens:35},line:{t:[-380,-150,300],dir:[.15,-1,.7],dist:1950,lens:50,pt:[-390,-160,240],pdir:[.2,-1,.8],pdist:.6,plens:35,wide:1,ldist:1.12},reject:Xv(),pack:{t:[-165,-30,300],dir:[.32,-1,.64],dist:2080,lens:50,pt:[-170,-60,260],pdir:[.4,-1,.7],pdist:.58,plens:35,ldist:1.08,lsx:-.06,wide:1},parts:{t:[0,40,210],dir:[.8,-1,.45],dist:900,lens:35,pdist:.8}};function Xv(){let e=D,t=e.REJECT,n=e.REJECT_BIN??{x:-235,y:-230},r=(e.POST_Z??200)+130,i=[Math.min(t[0],n.x)-45,Math.min(t[1],n.y)-40,0],a=[Math.max(t[0],n.x)+45,Math.max(t[1],n.y)+40,r],o=i.map((e,t)=>(e+a[t])/2);return{t:o,dir:[.5,-1,.6],dist:Math.hypot(a[0]-i[0],a[1]-i[1],a[2]-i[2])/2*Kv,lens:50,pt:o,pdir:[.5,-1,.7],pdist:.55,plens:35,lsx:-.12,ldist:1.12,wide:1}}var Zv={dir:[100,-175,60],turn:[120,-130,170],from:22,to:33,ramp:3,dist:Math.hypot(100,-175,60),board:.6},Qv={arm:{dir:[.55,-1,.3],lens:50,fill:1.05},socket:{dir:[.4,-.85,.55],lens:100,fill:2.3},tester:{dir:[.9,-.3,.55],lens:100,fill:1.2}},$v={header:36,fixture:10,tester:140,tool:190,plug:100},ey=1040,ty=-780;function ny(e){let t=e.shadow.camera;t.position.copy(e.position),t.lookAt(e.target.position),t.updateMatrixWorld();let n=t.matrixWorldInverse,r=new Ia;for(let e of[ty,560])for(let t of[-340,400])for(let i of[Kh,ey])r.expandByPoint(new G(e,t,i).applyMatrix4(n));Object.assign(t,{left:r.min.x-20,right:r.max.x+20,bottom:r.min.y-20,top:r.max.y+20,near:Math.max(1,-r.max.z-50),far:-r.min.z+50}),t.updateProjectionMatrix()}var ry=900,iy=60;function ay(e,t){let n=new Uint8Array(e*e*4);for(let r=0;r<e;r++)for(let i=0;i<e;i++){let a=(r*e+i)*4;n[a]=n[a+1]=n[a+2]=Math.round(255*Math.max(0,Math.min(1,t((i+.5)/e,(r+.5)/e)))),n[a+3]=255}let r=new Uo(n,e,e);return r.magFilter=r.minFilter=an,r.needsUpdate=!0,r}function oy(){let e=new q;e.name=`Ring light spill`,e.visible=!1;let t={color:14676991,transparent:!0,depthWrite:!1,blending:2,fog:!1},n=new Oo({...t,side:2,opacity:0,alphaMap:ay(16,(e,t)=>(1-.8*t)**1.6)}),r=new Bo(new es(10.5,7.6,1,48,1,!0),n);r.name=`Grip camera light cone`,r.rotation.x=Math.PI/2,r.position.set(ne[0],ne[1],ne[2]+15),r.renderOrder=2;let i=new Oo({...t,opacity:0,polygonOffset:!0,polygonOffsetFactor:-4,alphaMap:ay(64,(e,t)=>{let n=Math.hypot((e-.5)*58,(t-.5)*44);return Math.exp(-((n/16)**2))})}),a=new Bo(new yc(58,44),i);a.name=`Wrist ring light pool`,a.position.set(0,0,9.76),a.renderOrder=2;for(let t of[r,a])t.visible=!1,t.castShadow=t.receiveShadow=!1,t.frustumCulled=!0,e.add(t);return{root:e,cone:r,coneMaterial:n,pool:a,poolMaterial:i}}var sy=class{canvas=document.createElement(`canvas`);context;recorder;chunks=[];lastDraw=0;started=performance.now();title=`Connector insertion, in simulation.`;description=`A computed insertion, test and reset experiment.`;state=null;speed=1;source;onFinish;stream;constructor(e,t){this.source=e,this.onFinish=t,this.canvas.width=1600,this.canvas.height=900,this.context=this.canvas.getContext(`2d`);let n=[`video/mp4;codecs=avc1.640028`,`video/mp4;codecs=avc1`,`video/mp4`,`video/webm;codecs=vp9`,`video/webm;codecs=vp8`].find(e=>MediaRecorder.isTypeSupported(e));if(!n)throw Error(`This browser cannot export a video.`);this.stream=this.canvas.captureStream(0);try{this.recorder=new MediaRecorder(this.stream,{mimeType:n,videoBitsPerSecond:8e6})}catch(e){throw this.stream.getTracks().forEach(e=>e.stop()),e}this.recorder.ondataavailable=e=>{e.data.size&&this.chunks.push(e.data)},this.recorder.onstop=()=>{this.stream.getTracks().forEach(e=>e.stop()),this.onFinish(new Blob(this.chunks,{type:n}),n.startsWith(`video/mp4`)?`mp4`:`webm`)},this.recorder.start(500)}pause(){this.recorder.state===`recording`&&this.recorder.pause()}resume(){this.recorder.state===`paused`&&this.recorder.resume()}stop(){this.recorder.state!==`inactive`&&this.recorder.stop()}draw=()=>{let e=performance.now();if(e-this.lastDraw<1e3/30-6)return;this.lastDraw=e;let t=this.context,r=this.state;t.fillStyle=`#111413`,t.fillRect(0,0,1600,900),t.fillStyle=`#f4f1ea`,t.font=`600 38px Inter, Arial`,t.fillText(`defex`,44,53),t.fillStyle=`#d5dfd3`,t.beginPath(),t.arc(151,32,4,0,Math.PI*2),t.fill(),t.font=`14.5px "EB Garamond", Georgia, serif`,t.fillStyle=`#75806a`,t.fillText(`INTERACTIVE SOFTWARE PROTOTYPE`,1080,45),t.strokeStyle=`#2a3036`,t.beginPath(),t.moveTo(44,76),t.lineTo(1556,76),t.stroke(),t.fillStyle=`#f4f1ea`,t.font=`400 34px Newsreader, Georgia, serif`,t.fillText(this.title,44,130),t.fillStyle=`#737c6b`,t.font=`18px "EB Garamond", Georgia, serif`,t.fillText(this.description,44,164),t.fillStyle=`#0d1013`,t.fillRect(44,194,1035,585);let i=Math.min(1035/this.source.width,585/this.source.height),a=this.source.width*i,o=this.source.height*i;t.drawImage(this.source,44+(1035-a)/2,194+(585-o)/2,a,o),t.fillStyle=`#1b2026`,t.fillRect(64,214,131,29),t.fillStyle=`#d6ddcd`,t.font=`12.5px "EB Garamond", Georgia, serif`,t.fillText(`SIMULATION · ${this.speed}×`,75,233);let s=1130;t.fillStyle=`#75806a`,t.font=`13.5px "EB Garamond", Georgia, serif`,t.fillText(`CURRENT ATTEMPT`,s,221),t.fillStyle=`#f4f1ea`,t.font=`400 28px "EB Garamond", Georgia, serif`,t.fillText(r?n[r.controller]??`Search`:`Preparing`,s,263),[[`TRIES`,String(r?.probes??0)],[`SIMULATION TIME`,`${(r?.time??0).toFixed(1)} s`],[`AXIAL FORCE`,`${(r?.force??0).toFixed(2)} N`],[`CONNECTION`,r?.continuity===!0?`PASS`:r?.continuity===!1?`FAIL`:`NOT TESTED`],[`LOCK`,r?.retention===!0?`PASS`:r?.retention===!1?`FAIL`:`NOT TESTED`]].forEach(([e,n],r)=>{let i=315+r*66;t.strokeStyle=`#2a3036`,t.beginPath(),t.moveTo(s,i+36),t.lineTo(1547,i+36),t.stroke(),t.font=`12.5px "EB Garamond", Georgia, serif`,t.fillStyle=`#89937c`,t.fillText(e,s,i),t.font=`21px "EB Garamond", Georgia, serif`,t.fillStyle=n===`FAIL`?`#d38b73`:n===`PASS`?`#85b997`:`#f4f1ea`,t.fillText(n,s,i+25)}),t.font=`400 24px "EB Garamond", Georgia, serif`,t.fillStyle=r?.accepted===!0?`#85b997`:r?.accepted===!1?`#d38b73`:`#69745d`,t.fillText(r?.accepted===!0?`Passed in simulation`:r?.accepted===!1?`Rejected in simulation`:`Attempt in progress`,s,691),t.font=`15px "EB Garamond", Georgia, serif`,t.fillStyle=`#79836e`,t.fillText(r?.reason??``,s,718),t.font=`13.5px "EB Garamond", Georgia, serif`,t.fillStyle=`#8a917e`,t.fillText(`ILLUSTRATIVE GEOMETRY / MODELED TESTS`,44,817),t.font=`15px Arial`,t.fillStyle=`#6c765f`,t.fillText(`Rigid-body contact. Ideal electrical and latch models. Deterministic search, not a trained robot policy.`,44,849),t.fillText(`No physical robot or factory performance is demonstrated here.`,44,875),this.stream.getVideoTracks()[0].requestFrame()}};function cy(e){let t=Array.from(e.querySelectorAll(`.dock-item`)),n=()=>matchMedia(`(hover: hover)`).matches;t.forEach(e=>{e.addEventListener(`pointerleave`,()=>e.classList.remove(`tip-off`)),e.addEventListener(`pointerdown`,()=>{n()&&e.classList.add(`tip-off`)}),e.addEventListener(`click`,()=>{n()&&e.classList.add(`tip-off`)})})}var $=e=>document.getElementById(e),ly=e=>Array.from(document.querySelectorAll(e)),uy=(e,t)=>{let n=$(e);n.textContent!==t&&(n.textContent=t)},dy=null,fy=[],py=e=>{dy?dy.postMessage(e):fy.push(e)},my=null;function hy(e){if(my){my.push(e);return}let t=Iy?.released&&zy?zy.regrip():0;if(t<=0){py(e);return}my=[e],setTimeout(()=>{let e=my??[];my=null,e.forEach(py)},t)}var gy={fixed:`Straight in. Stops if blocked.`,search:`Backs off and tries the next spot.`},_y={fixed:`No search`,search:`Search`},vy=ly(`.console input,.console select:not(#speed),[data-preset],[data-controller]`),yy=ly(`[data-controller]`),by=ly(`[data-phase]`),xy=ly(`[data-view]`),Sy=ly(`[data-mode]`),Cy=ly(`[data-part]`),wy=ly(`[data-preset]`),Ty=new URLSearchParams(location.search).has(`embed`),Ey={...r},Dy=`overview`,Oy=`machine`,ky=!1,Ay=()=>Sy.forEach(e=>e.setAttribute(`aria-pressed`,String(e.dataset.mode===Oy&&(Oy!==`machine`||Dy===`overview`&&!ky)))),jy=()=>{xy.forEach(e=>e.setAttribute(`aria-pressed`,String(!ky&&Oy!==`inside`&&e.dataset.view===Dy))),Ay()},My=`fixed`,Ny=!1,Py=!1,Fy=!1,Iy=null,Ly=[],Ry=-1,zy=null,By=null,Vy=-1,Hy=!1,Uy=!1,Wy=!1,Gy=null,Ky=0,qy=0,Jy=null,Yy=null,Xy=0,Zy=0;if(Ty&&document.body.classList.add(`embed`),new URLSearchParams(location.search).get(`view`)!==`schematic`)try{zy=new Gv($(`scene`),Ey,{labels:$(`labels`),tooltip:$(`tooltip`),onDirector:e=>document.body.classList.toggle(`focused`,e||Dy!==`overview`),onPick:e=>e===`connector`||e===`gripper`?lb(`connector`,!1):db(e),onFree:e=>{ky=e,$(`guided-view`).hidden=!e,document.body.classList.toggle(`free-view`,e),jy()},onSettle:e=>{document.body.dataset.cam=e}},Ty)}catch(e){console.warn(`3D renderer unavailable`,e)}else uy(`fallback-title`,`Live side view of the simulation.`);function Qy(){By?.dispose(),By=null,zy?.dispose(),zy=null,$(`loading`).hidden=Ny||Fy,Ub(),document.body.classList.remove(`process-mode`),document.querySelector(`.cycle-cases`).hidden=!0,$(`process-steps`).innerHTML=O.map((e,t)=>`<div><span>${t+1}</span><strong>${e[0]}</strong><small>${e[2]}</small></div>`).join(``),$(`scene`).replaceChildren(),$(`labels`).replaceChildren(),$(`fallback`).hidden=!1,[...xy,...Sy,...ly(`.dock-sep,.control-hint`)].forEach(e=>e.hidden=!0),$(`save-video`).disabled=!0,$(`tooltip`).classList.remove(`visible`),document.body.classList.remove(`focused`,`exploded`),Iy&&$y(Iy)}zy||Qy(),$(`scene`).addEventListener(`renderer-lost`,()=>{fb(),Qy()});function $y(e){$(`schematic-socket`).setAttribute(`transform`,`translate(${e.config.offsetX*5} 0)`),$(`schematic-plug`).setAttribute(`transform`,`translate(${210+e.pose[0]*5e3} ${270-e.pose[2]*5e3})`);let t=e.config.variant===`eight`?40:30;$(`schematic-wall-left`).setAttribute(`x`,String(210-t-20)),$(`schematic-wall-right`).setAttribute(`x`,String(210+t)),$(`schematic-seat`).setAttribute(`x`,String(210-t-20)),$(`schematic-seat`).setAttribute(`width`,String(2*t+40)),$(`schematic-housing`).setAttribute(`x`,String(-t+2)),$(`schematic-housing`).setAttribute(`width`,String(2*t-4)),$(`schematic-housing`).setAttribute(`fill`,e.accepted===!0?`#c2d9b6`:e.accepted===!1?`#e1b5a1`:`#f5f0dd`)}var eb=e=>({...r,...e===`shifted`?{}:{offsetX:0,offsetY:0,yaw:0},fault:e===`open`?`open`:e===`latch`?`latch`:`none`}),tb=(e,t=2)=>{let n=Math.abs(e)<.5*10**-t?0:e;return`${n>=0?`+`:``}${n.toFixed(t)}`};function nb(){for(let e of[`offsetX`,`offsetY`,`yaw`,`friction`])$(e).value=String(Ey[e]),uy(`${e}-value`,e===`yaw`?`${tb(Ey[e],1)}°`:e===`friction`?Ey[e].toFixed(2):`${tb(Ey[e])} mm`);$(`variant`).value=Ey.variant,$(`fault`).value=Ey.fault;for(let e of wy){let t=eb(e.dataset.preset);e.setAttribute(`aria-pressed`,String([`offsetX`,`offsetY`,`yaw`,`fault`].every(e=>t[e]===Ey[e])))}}function rb(){Jy&&clearTimeout(Jy),Jy=null,hy({type:`config`,config:Ey}),Ly=[],Vb()}function ib(e,t=`now`){Ey={...e},nb(),zy?.configure(Ey),Jy&&clearTimeout(Jy),Jy=null,t===`soon`?Jy=setTimeout(rb,130):t===`now`&&rb()}function ab(e){My=e,yy.forEach(t=>t.setAttribute(`aria-pressed`,String(t.dataset.controller===e))),uy(`controller-description`,gy[e])}function ob(){Vy<0&&($(`endcard`).hidden=!0,document.body.classList.remove(`ended`))}var sb=()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches;function cb(){let e=document.querySelector(`.stage`);Math.abs(e.getBoundingClientRect().top)>8&&e.scrollIntoView({block:`start`,behavior:sb()?`auto`:`smooth`})}function lb(e,t=!0){ob(),t&&cb(),Dy=e,zy?.view(e),document.body.classList.toggle(`focused`,e!==`overview`),jy()}function ub(e,t=!0){ob(),Oy=e,zy?.setMode(e),document.body.classList.toggle(`exploded`,e===`parts`),lb(e===`inside`?`connector`:`overview`,t),e===`parts`&&zy?.direct(!1)}function db(e){if(!zy)return;Dy=`part`,zy.focusPart(e),document.body.classList.add(`focused`),jy();let t=document.querySelector(`.stage`);t.getBoundingClientRect().bottom<innerHeight*.6&&t.scrollIntoView({behavior:sb()?`auto`:`smooth`})}function fb(){Yy&&(zy&&(zy.afterRender=null),Yy.stop(),Yy=null,$(`save-video`).disabled=!Ny||!zy||typeof MediaRecorder>`u`,pb(!1))}function pb(e){let t=$(`save-video`);t.firstChild.textContent=e?`Recording… `:`Record demo `,t.querySelector(`span`).hidden=e}function mb(){Gy&&clearTimeout(Gy),Gy=null,Vy=-1,Hy=!1,Uy=!1,$(`tour-story`).hidden=!0,document.body.classList.remove(`tour-active`),zy?.hold(!1),fb(),Pb()}function hb(){zy&&(Oy===`parts`&&ub(`machine`,!1),Dy=`overview`,zy.direct(!0),jy())}function gb(e=!1){By?.deactivate(),Jy&&rb(),Wy=!1,Vy<0&&($(`endcard`).hidden=!0,document.body.classList.remove(`ended`)),cb(),hb(),hy({type:`run`,controller:My,...e?{config:Ey}:{}})}function _b(){Wy=!1,mb(),ob(),hy({type:`reset`}),lb(`overview`,!1),zy?.direct(!1)}function vb(){Vy>=0&&(Hy=!0,Gy&&(clearTimeout(Gy),Gy=null,qy=Math.max(0,Ky-performance.now()))),Py=!1,py({type:`pause`}),Yy?.pause(),Pb()}function yb(){By?.deactivate(),Oy===`parts`&&ub(`machine`,!1),Vy>=0?(Hy=!1,Uy?jb(qy):py({type:`resume`})):py({type:`resume`}),Yy?.resume(),Pb()}function bb(){if(Ny){if(Vy>=0){Hy?yb():vb();return}Py?vb():Iy&&Iy.phase!==`ready`&&Iy.phase!==`complete`?yb():gb()}}for(let e of wy)e.addEventListener(`click`,()=>{mb(),ib({...eb(e.dataset.preset),variant:Ey.variant})});for(let e of[`offsetX`,`offsetY`,`yaw`,`friction`])$(e).addEventListener(`input`,()=>{mb(),ib({...Ey,[e]:Number($(e).value)},`soon`)}),$(e).addEventListener(`change`,()=>{Jy&&rb()});$(`variant`).addEventListener(`change`,()=>{mb(),ib({...Ey,variant:$(`variant`).value})}),$(`fault`).addEventListener(`change`,()=>{mb(),ib({...Ey,fault:$(`fault`).value})});for(let e of yy)e.addEventListener(`click`,()=>{mb(),ab(e.dataset.controller)});$(`run`).addEventListener(`click`,e=>{e.detail<2&&bb()}),$(`reset`).addEventListener(`click`,_b),$(`speed`).addEventListener(`change`,()=>py({type:`speed`,speed:Number($(`speed`).value)}));for(let e of xy)e.addEventListener(`click`,()=>{if(Oy===`inside`){ub(`machine`,!1),lb(e.dataset.view);return}lb(Dy===e.dataset.view&&!ky?`overview`:e.dataset.view)});$(`guided-view`).addEventListener(`click`,()=>zy?.guided());var xb=$(`cycle-scrub`),Sb=()=>zy?.setScrubbing(!1);xb.addEventListener(`pointerdown`,()=>zy?.setScrubbing(!0)),xb.addEventListener(`change`,Sb),addEventListener(`pointerup`,Sb),addEventListener(`pointercancel`,Sb);{let e=$(`stage-hint`),t=$(`scene`),n=!1,r=/Mac|iPhone|iPad|iPod/i.test(navigator.userAgentData?.platform||navigator.platform||navigator.userAgent);e.textContent=matchMedia(`(pointer: coarse)`).matches?`Drag to turn · pinch to zoom`:`Drag to turn · pinch or ${r?`⌘`:`Ctrl`}-scroll to zoom`;let i=()=>{n||Ty||!zy||(n=!0,e.classList.add(`visible`),setTimeout(()=>e.classList.remove(`visible`),3e3))};t.addEventListener(`pointerenter`,e=>{e.pointerType===`mouse`&&i()}),t.addEventListener(`touchstart`,i,{passive:!0})}for(let e of Sy)e.addEventListener(`click`,()=>ub(e.dataset.mode));for(let e of Cy)e.addEventListener(`click`,()=>db(e.dataset.part));$(`retry`).addEventListener(`click`,()=>location.reload()),$(`stage-retry`).addEventListener(`click`,()=>location.reload());var Cb=$(`notes`);{let e=Cb.querySelector(`dl`),t=()=>{e.toggleAttribute(`data-more`,e.scrollHeight-e.scrollTop-e.clientHeight>2)};e.addEventListener(`scroll`,t,{passive:!0}),new ResizeObserver(t).observe(e),ly(`[data-open-notes]`).forEach(n=>n.addEventListener(`click`,()=>{Cb.showModal(),e.scrollTop=0,t()}))}$(`close-notes`).addEventListener(`click`,()=>Cb.close()),Cb.addEventListener(`click`,e=>{if(e.target===Cb){let t=Cb.getBoundingClientRect();(e.clientX<t.left||e.clientX>t.right||e.clientY<t.top||e.clientY>t.bottom)&&Cb.close()}});function wb(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}function Tb(e,t,n){wb(new Blob([e],{type:n}),t)}$(`export`).addEventListener(`click`,()=>py({type:`export`})),$(`download-model`).addEventListener(`click`,()=>Tb(l(Ey),`defex-illustrative-connector.xml`,`application/xml`));var Eb=[[`On the chamfer: straight in.`,`Aimed right, the plug seats with no search.`],[`Off the chamfer: it stops.`,`The robot feels the edge and backs off.`],[`Fallback search: seated.`,`It tries nearby spots until the plug drops in.`],[`Open wire: rejected.`,`The open circuit fails the connection check.`]],Db=[`fixed`,`fixed`,`search`,`fixed`],Ob=[!0,!1,!0,!1],kb=[`aligned`,`shifted`,`shifted`,`open`];function Ab(){Vy<0||(Uy=!1,Gy=null,uy(`tour-index`,`${Vy+1} / 4`),document.querySelectorAll(`.tour-dots i`).forEach((e,t)=>e.classList.toggle(`on`,t<=Vy)),uy(`tour-title`,Eb[Vy][0]),uy(`tour-description`,Eb[Vy][1]),Yy&&(Yy.title=Eb[Vy][0],Yy.description=Eb[Vy][1]),ib(eb(kb[Vy]),`with-run`),ab(Db[Vy]),gb(!0))}function jb(e){Uy=!0,qy=e,!Hy&&(Ky=performance.now()+e,Gy=setTimeout(()=>{Gy=null,Vy<3?(Vy++,Ab()):(mb(),$(`endcard`).hidden=!1,document.body.classList.add(`ended`),zb(`idle`,`Your turn.`,``))},e),Pb())}function Mb(){mb(),$(`endcard`).hidden=!0,document.body.classList.remove(`ended`),ub(`machine`,!1),Vy=0,$(`tour-story`).hidden=!1,document.body.classList.add(`tour-active`),cb(),zy?.hold(!0),hb(),Ab(),Pb()}$(`physics-demo`).addEventListener(`click`,Mb),$(`replay`).addEventListener(`click`,e=>{e.detail<2&&Mb()}),$(`tour`).addEventListener(`click`,e=>{e.detail<2&&(Vy>=0?bb():Mb())}),$(`embed-run`).addEventListener(`click`,e=>{e.detail<2&&Mb()}),ly(`[data-start-tour]`).forEach(e=>e.addEventListener(`click`,()=>{Vy<0&&Mb()})),$(`save-video`).addEventListener(`click`,()=>{if(mb(),zy)try{Mb(),Yy=new sy(zy.renderer.domElement,(e,t)=>wb(e,`defex-connector-simulation.${t}`)),Yy.title=Eb[0][0],Yy.description=Eb[0][1],zy.afterRender=()=>Yy?.draw(),zy.wake(),$(`save-video`).disabled=!0,pb(!0)}catch(e){mb(),py({type:`pause`}),zb(`fail`,`Couldn’t record the demo.`,e instanceof Error?e.message:String(e))}}),$(`stop-tour`).addEventListener(`click`,_b);function Nb(e,t,n){let r=$(e);uy(e,t===!0?`Pass`:t===!1?`Fail`:n?`Testing`:`—`),r.dataset.status=t===!0?`pass`:t===!1?`fail`:n?`testing`:`idle`}function Pb(){let e=!!Iy&&Iy.phase!==`complete`&&Iy.phase!==`ready`,t=Py||Vy>=0&&!Hy;uy(`run-label`,t?`Pause`:e||Hy?`Resume`:`Run attempt`),uy(`run-icon`,t?`Ⅱ`:`▶`),$(`run`).disabled=!Ny,$(`reset`).disabled=!Ny,$(`speed`).disabled=!Ny,$(`tour`).disabled=!Ny&&!By?.isActive(),ly(`[data-start-tour]`).forEach(e=>e.disabled=!Ny),$(`embed-run`).disabled=!Ny&&!By?.isActive(),$(`tour`).setAttribute(`aria-pressed`,String(Vy>=0)),uy(`tour-label`,Vy>=0&&!Hy?`Pause`:`Play`),$(`tour`).dataset.playing=String(Vy>=0&&!Hy),$(`tour`).setAttribute(`aria-label`,Vy>=0&&!Hy?`Pause`:`Play`);for(let t of vy)t.disabled=!Ny||e||Vy>=0;uy(`engine-status`,Ny?Hy?`Paused`:Uy?`Next step…`:Py?`Running`:e?`Paused`:Iy?.phase===`complete`?`Complete`:`Ready`:`Loading…`),uy(`hud-status`,Ny?Vy>=0&&!Hy?`Demo running`:Py?`Robot running`:e||Hy?`Robot paused`:`Robot ready`:`Loading`),$(`status`).classList.toggle(`paused`,!Py)}function Fb(e,t,n){Iy=e,Py=t,Yy&&(Yy.state=e,Yy.speed=n),zy?.update(e,Ry,t,n),zy||$y(e),uy(`stage-state`,(!t&&e.phase!==`ready`&&e.phase!==`complete`?`Paused · `:``)+(e.phase===`ready`?`Ready`:e.phase===`complete`?e.accepted?`Passed`:`Rejected`:e.phase===`electrical`?`Connection test`:e.phase===`retention`?`Pull test`:e.phase===`reset`?e.accepted===!0?`Passed · retracting`:e.accepted===!1?`Rejected · retracting`:`Retracting`:e.phase===`backoff`?`Contact · retracting`:e.phase===`move`?`Try ${e.probes}`:`Inserting`)),uy(`stage-force`,`${e.force.toFixed(1)} N`),uy(`stage-depth`,`${e.depth.toFixed(1)} mm`),uy(`stage-speed`,`${n}× playback`),uy(`force`,e.force.toFixed(1)),uy(`depth`,e.depth.toFixed(1)),uy(`probes`,e.phase===`ready`?`—`:String(e.probes)),uy(`elapsed`,e.time.toFixed(1));let r=[`approach`,`backoff`,`move`].includes(e.phase)?`insert`:e.phase;Rb(e),by.forEach(e=>e.classList.toggle(`active`,e.dataset.phase===r)),Nb(`electrical-check`,e.continuity,e.phase===`electrical`),Nb(`retention-check`,e.retention,e.phase===`retention`),Pb(),By?.refresh(),Wy||Ib(e),(performance.now()-Xy>80||!Py)&&Vb()}function Ib(e){e.phase===`ready`?zb(`idle`,`Ready.`,``):e.accepted===null?e.phase===`reset`?zb(`idle`,`Resetting.`,``):e.phase===`backoff`||e.phase===`move`?zb(`idle`,`Try ${e.phase===`move`?e.probes-1:e.probes} was blocked.`,``):e.phase===`electrical`?zb(`idle`,`Testing the connection.`,``):e.phase===`retention`?zb(`idle`,`Pull test.`,``):zb(`idle`,My===`search`?`Try ${e.probes}.`:`Inserting.`,``):zb(e.accepted?`pass`:`fail`,e.accepted?`Both tests passed.`:e.continuity===!1?`Connection failed.`:e.retention===!1?`Lock failed.`:`The connector couldn’t seat.`,e.phase===`reset`||e.accepted?``:`${e.reason}.`)}var Lb={approach:[`Insert`,`The robot lowers the connector.`,.2],insert:[`Insert`,`The robot lowers the connector.`,.25],backoff:[`Blocked. Backing off.`,`The socket edge stopped it.`,.25],move:[`Trying a new spot.`,`Small step to the side.`,.25],electrical:[`Connection test`,`Is every contact in?`,.75],retention:[`Pull test`,`Does the lock hold?`,.5],reset:[`Reset`,`Back to the start.`,.92]};function Rb(e){let t=$(`journey`);t.classList.toggle(`visible`,e.phase!==`ready`);let[n,r,i]=e.phase===`complete`?[e.accepted?`Passed.`:`Rejected.`,e.accepted?`Both tests passed.`:e.reason,1]:Lb[e.phase]??[`Ready`,``,0];uy(`journey-title`,e.phase===`move`?`Try ${e.probes}.`:n),uy(`tour-live`,e.phase===`move`?`Try ${e.probes}`:n.replace(/\.$/,``)),uy(`journey-detail`,r),t.dataset.status=e.accepted===!0?`pass`:e.accepted===!1?`fail`:`run`,$(`journey-progress`).style.width=`${i*100}%`}function zb(e,t,n){$(`outcome`).dataset.status=e,uy(`outcome-title`,t),uy(`outcome-copy`,n);let r=document.querySelector(`.outcome-symbol`),i=e===`pass`?`✓`:e===`fail`?`×`:`↗`;r.textContent!==i&&(r.textContent=i)}function Bb(e){Zy++,uy(`record-count`,String(Zy).padStart(2,`0`)),$(`export`).disabled=!1;let t=$(`records-body`);t.querySelector(`.empty-row`)?.remove();let n=document.createElement(`tr`),i=e.config,a=[`${i.variant===`six`?`6`:`8`} contacts`,`X ${tb(i.offsetX)} / Y ${tb(i.offsetY)} mm`,i.yaw?`${tb(i.yaw,1)}°`:``,i.friction===r.friction?``:`friction ${i.friction.toFixed(2)}`,i.fault===`open`?`open circuit`:i.fault===`latch`?`no latch`:``];[String(e.id).padStart(2,`0`),_y[e.controller],a.filter(Boolean).join(` · `),String(e.probes),`${e.duration.toFixed(2)} s`,`${e.peakForce.toFixed(2)} N`].forEach(e=>{let t=document.createElement(`td`);t.textContent=e,n.append(t)});let o=document.createElement(`td`),s=document.createElement(`span`),c=document.createElement(`small`);if(s.className=e.accepted?`accepted`:`rejected`,s.textContent=e.accepted?`✓ Passed`:`× Rejected`,c.textContent=e.reason,o.append(s,c),n.append(o),t.prepend(n),Vy>=0){if(e.accepted!==Ob[Vy]){mb(),Wy=!0,zb(`fail`,`Demo stopped.`,`Unexpected result: ${e.reason}. See the attempt below.`);return}jb(Vy===0||Vy===3?1500:1300)}}function Vb(){if(Xy=performance.now(),Ty||!$(`force-chart`).closest(`details`).open)return;let e=$(`force-chart`),t=e.getBoundingClientRect();if(!t.width||!t.height)return;let n=Math.min(devicePixelRatio,2);(e.width!==Math.round(t.width*n)||e.height!==Math.round(t.height*n))&&(e.width=Math.round(t.width*n),e.height=Math.round(t.height*n));let r=e.getContext(`2d`);r.setTransform(n,0,0,n,0,0),r.clearRect(0,0,t.width,t.height);let i=t.width,a=t.height-6,o=Ly.reduce((e,t)=>Math.max(e,t.force),6),s=Math.max(2,Ly.at(-1)?.t??0),c=Ly[0]?.t??0;r.lineWidth=1,r.strokeStyle=`#1b3e2430`,r.setLineDash([2,4]);for(let e=0;e<3;e++){let t=5+e*(a-5)/2;r.beginPath(),r.moveTo(0,t),r.lineTo(i,t),r.stroke()}r.setLineDash([]),Ly.length>1&&(r.beginPath(),Ly.forEach((e,t)=>{let n=(e.t-c)/(s-c)*i,l=a-e.force/o*(a-7);t?r.lineTo(n,l):r.moveTo(n,l)}),r.strokeStyle=`#1f2b24`,r.lineWidth=1.6,r.stroke()),uy(`chart-zero`,`${c.toFixed(1)} s`),uy(`chart-end`,`${(Ly.at(-1)?.t??0).toFixed(1)} s`)}new ResizeObserver(Vb).observe($(`force-chart`));function Hb(e){console.error(e);let t=Ny,n=t?`The simulation stopped. Reload to start it again.`:`The physics engine didn’t load. Check your connection, then reload.`;Ny=!1,Fy=!0,Py=!1,mb(),$(`retry`).hidden=!1,zy&&By?qb.then(()=>{$(`loading`).hidden=!0}):$(`loading`).hidden=!0,zy&&(zy.playing=!1,zy.direct(!1),zy.offline()),$(`save-video`).disabled=!0,uy(`engine-status`,`Unavailable`),$(`engine-status`).classList.add(`error-notice`),zb(`fail`,t?`The simulation stopped.`:`Couldn’t start the simulation.`,n),$(`stage-error`).hidden=!!By?.isActive(),uy(`stage-error-message`,n),uy(`stage-state`,`Unavailable`),Pb(),uy(`engine-status`,`Unavailable`)}function Ub(){if(!dy){dy=new Worker(new URL(`/static/prototype/assets/simulation.worker-GEQhDzbO.js`,``+import.meta.url),{type:`module`}),dy.onerror=e=>Hb(e.message||`Reload the simulation to try again.`),dy.onmessage=Wb;for(let e of fy.splice(0))dy.postMessage(e)}}function Wb({data:e}){e.type===`ready`&&(Ny=!0,zy||($(`loading`).hidden=!0),$(`save-video`).disabled=!zy||typeof MediaRecorder>`u`,Pb()),e.type===`state`&&(e.epoch!==Ry&&(Ly=[],Ry=e.epoch),e.samples.length&&(Ly.push(...e.samples),Ly.length>4e3&&Ly.splice(0,Ly.length-4e3)),Fb(e.state,e.playing,e.speed)),e.type===`trial`&&e.trial&&Bb(e.trial),e.type===`error`&&Hb(e.message),e.type===`export`&&Tb(JSON.stringify(e.report,null,2),`defex-simulation-records.json`,`application/json`)}document.addEventListener(`visibilitychange`,()=>{document.hidden&&(Py||Vy>=0&&!Hy)&&vb()});var Gb=null,Kb=!1;document.addEventListener(`pointerdown`,e=>{Gb=e.target instanceof Element?e.target.closest(`button,a,summary`):null},!0),document.addEventListener(`keydown`,e=>{if(e.key===`Tab`&&(Gb=null),e.repeat||e.altKey||e.ctrlKey||e.metaKey||Cb.open)return;let t=!!By?.isActive();if(!Ny&&!t)return;let n=e.target instanceof HTMLElement?e.target:null;if(n?.closest(`input:not([type=range]),select,textarea,[contenteditable]`))return;if(e.code===`KeyR`){e.preventDefault(),t&&!n?.closest(`.console`)?By.restart():Ny&&_b();return}if(e.code!==`Space`)return;let r=n?.closest(`button,a,summary`);r&&r!==Gb||document.querySelector(`.stage`).getBoundingClientRect().bottom<=0&&!n?.closest(`.console`)||(e.preventDefault(),Kb=!0,t&&!n?.closest(`.console`)?By.toggle():Ny&&bb())}),document.addEventListener(`keyup`,e=>{e.code===`Space`&&Kb&&(Kb=!1,e.preventDefault())}),document.querySelector(`.tryit`).addEventListener(`toggle`,Vb),cy(document.querySelector(`.dock`));{let e=document.querySelector(`.stage`),t=document.querySelector(`.dock`),n=new ResizeObserver(()=>{let n=e.getBoundingClientRect(),r=t.getBoundingClientRect();r.width&&(e.style.setProperty(`--dock-r`,`${Math.round(r.right-n.left)}px`),e.style.setProperty(`--dock-cy`,`${Math.round(n.bottom-(r.top+r.bottom)/2)}px`))});n.observe(e),n.observe(t)}vy.forEach(e=>e.disabled=!0),nb(),py({type:`init`,config:Ey}),zy||Ub();var qb=zy?zy.ready:Promise.resolve();qb.then(()=>{zy&&By&&($(`loading`).hidden=!0),Ub()}),zy&&(By=Yt(zy,()=>{mb(),Oy===`parts`&&ub(`machine`,!1),py({type:`pause`})},()=>{$(`endcard`).hidden=!0,document.body.classList.remove(`ended`),zy?.direct(!1),lb(`overview`,!1)}));