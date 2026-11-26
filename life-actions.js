import {activities,handSample,MotionPractice} from './life/motion.js?v=5-5';
import {sceneArt,paintScene} from './life/art.js?v=5-5';
import {trackedJug} from './life/tracked.js?v=5-5';
import {LifeCamera} from './life/camera.js?v=5-5';
const bones=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]];
const handIcon='<svg viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="77" cy="47" rx="20" ry="31" fill="none" stroke="#a8ba9d" stroke-width="3" stroke-dasharray="5 5"/><path d="M29 119l-8-33q-7-26 4-41l14-18q8-10 17-3l17 17 12-5q14-6 20 6l8 20q6 18-9 34l-26 22Z" fill="#e5bf9a" stroke="#ad8a69" stroke-width="3"/><path d="M32 61q-7-25 4-29 10-3 16 13l14 23q15 9 7 19-9 9-23-2L33 73m41-24-2 25m18-27-7 29" fill="#e5bf9a" stroke="#ad8a69" stroke-width="3" stroke-linecap="round"/></svg>';
export function openLifeActions(speak=()=>{},initial=null){
 if(document.querySelector('.la-shell'))return;
 const shell=document.createElement('section');shell.className='la-shell';shell.setAttribute('aria-label','生活动作练习');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');
 shell.innerHTML='<div class="la-app"><header class="la-header"><button class="la-back" aria-label="返回家庭客厅">‹</button><div class="la-brand"><span>Memory<span class="la-plus">+</span></span><small>生活动作练习</small></div><span class="la-context">坐着 · 空手 · 慢慢来</span><button class="la-change">换个动作</button></header><main class="la-main"></main><footer class="la-footer">画面只在本机处理 <span>不用拿真实物品</span></footer></div>';
 const previousFocus=document.activeElement;const backgrounds=[...document.body.children].filter(el=>el.tagName!=='SCRIPT').map(el=>({el,wasInert:el.hasAttribute('inert')}));backgrounds.forEach(({el})=>el.setAttribute('inert',''));
 document.body.append(shell);const app=shell.querySelector('.la-app'),main=shell.querySelector('.la-main');
 const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('aria-label','镜像摄像头画面');
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');
 const liveControls=document.createElement('section');liveControls.className='la-live-controls';liveControls.hidden=true;liveControls.setAttribute('aria-label','暂停练习');liveControls.innerHTML='<div><h2>练习已暂停</h2><button class="la-primary" data-live-resume>继续练习</button><button class="la-soft" data-live-reset>重新开始</button><button class="la-soft" data-live-stop>关闭摄像头</button></div>';shell.append(liveControls);
 const liveDescription=document.createElement('p');liveDescription.className='la-live-description';liveDescription.setAttribute('aria-live','polite');shell.append(liveDescription);
 let immersive=false,lastSpokenAt=0,lastVoiceMessage='',trackedSample=null;
 let current=null,engine=null,demoFrame=0,demoActive=false,easy=true,disposed=false,lastResult=null,lastPalm={x:.5,y:.5},manual=false,gripping=false,pointerPoint=null,pointerStart=null,manualFrame=0,confettiTimer=0;
 const label=(selector,text)=>{const el=main.querySelector(selector);if(el&&el.textContent!==text)el.textContent=text;};
 function fit(){const w=window.visualViewport?.width||innerWidth,h=window.visualViewport?.height||innerHeight;app.style.setProperty('--la-scale',Math.min(w/1366,h/1024));}
 fit();window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
 const camera=new LifeCamera(video,{frame(points,now,aspect){if(!current||demoActive||manual||camera.paused)return;drawBones(points);if(!points){trackedSample=null;lastResult=engine.update(null,now);paint(lastResult);return;}const sample=handSample(points,aspect);if(sample){lastPalm=sample.center;trackedSample=sample;}lastResult=engine.update(sample,now);paint(lastResult);},status(state,note){
  if(disposed)return;setImmersive(state==='live'&&!manual);
  main.querySelector('.la-camera')?.classList.toggle('live',state==='live');label('[data-camera]',state==='live'?'关闭摄像头':state==='loading'?'取消开启':'开启手势摄像头');label('.la-camera-state',note);
  if(state==='live'){lastSpokenAt=performance.now();lastVoiceMessage='';speak(current.instruction+'。轻点画面可以暂停。');}
  if(state==='off'){ctx.clearRect(0,0,640,480);engine?.pause();if(current&&!demoActive)paint(engine.result());}
 }});
 function setImmersive(on){
  const changed=immersive!==on;immersive=on;shell.classList.toggle('la-immersive',on);liveControls.hidden=true;
  if(on){canvas.classList.add('la-tracking-overlay');main.append(canvas);}else{canvas.classList.remove('la-tracking-overlay');main.querySelector('.la-camera')?.append(canvas);}
  const svg=main.querySelector('.la-stage svg');if(svg&&current?.id==='water'){svg.setAttribute('viewBox',on?'0 0 1000 700':'0 0 1000 440');const plant=svg.querySelector('[data-art=plant]');if(on)plant?.setAttribute('transform','translate(0 230)');else plant?.removeAttribute('transform');}
  const scene=main.querySelector('.la-scene-area');if(scene){scene.tabIndex=on?0:-1;if(on)scene.setAttribute('aria-label',current.title+'。轻点画面或按空格暂停。');else scene.removeAttribute('aria-label');}
  if(!on){camera.paused=false;liveDescription.textContent='';}
  else if(changed){liveDescription.textContent=current.instruction;scene?.focus({preventScroll:true});}
 }
 function pauseLive(){
  if(!immersive||engine.progress>=1)return;camera.paused=true;engine.pause();liveControls.hidden=false;
  paint(engine.result());liveControls.querySelector('[data-live-resume]').focus();speak('已暂停。');
 }
 function resumeLive(){
  liveControls.hidden=true;engine?.pause();camera.paused=false;
  main.querySelector('.la-scene-area')?.focus({preventScroll:true});
 }
 liveControls.querySelector('[data-live-resume]').onclick=resumeLive;
 liveControls.querySelector('[data-live-reset]').onclick=()=>{reset();resumeLive();speak(current.instruction);};
 liveControls.querySelector('[data-live-stop]').onclick=()=>{camera.stop();main.querySelector('[data-camera]')?.focus();};
 shell.addEventListener('pointerup',event=>{if(!immersive||event.target.closest('button')||engine?.progress>=1)return;if(liveControls.hidden)pauseLive();});
 shell.addEventListener('keydown',event=>{
  if(!immersive)return;
  if(event.key==='Escape'){event.preventDefault();if(liveControls.hidden)pauseLive();else resumeLive();}
  else if((event.key===' '||event.key==='Enter')&&event.target===main.querySelector('.la-scene-area')){event.preventDefault();pauseLive();}
 });
 function drawBones(points){const w=video.videoWidth||640,h=video.videoHeight||480;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);if(!points)return;ctx.lineWidth=Math.max(2,w/220);ctx.strokeStyle='#9be6c6';for(const chain of bones){ctx.beginPath();chain.forEach((i,n)=>{const x=(1-points[i].x)*w,y=points[i].y*h;n?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}ctx.fillStyle='#ffc480';for(const i of [4,8,12,16,20]){ctx.beginPath();ctx.arc((1-points[i].x)*w,points[i].y*h,w/150,0,Math.PI*2);ctx.fill();}}

 function cancelDemo(){cancelAnimationFrame(demoFrame);demoActive=false;camera.paused=false;main.classList.remove('la-demo-mode');label('[data-demo]','看动作示范');main.querySelector('.la-demo-tag')?.setAttribute('hidden','');}
 function reset(){trackedSample=null;cancelDemo();liveControls.hidden=true;cancelAnimationFrame(manualFrame);gripping=false;engine=new MotionPractice(current.id,easy);lastResult=engine.result();label('.la-camera-state',manual?'触摸体验：按住物品，再拖动。':camera.state==='live'?'半握着手，放进画面就可以。':'开启后，在 iPad 训练区里用手操作。');main.querySelector('.la-complete').hidden=true;main.querySelector('.la-progress').setAttribute('aria-valuenow','0');paint(lastResult);}
 function paint(result,demo=false){
  if(!current)return;const art=main.querySelector('.la-stage');if(!art)return;
  paintScene(art,current.id,result,lastPalm,demo);
  if(immersive&&!demo){
   label('.la-camera-state',trackedSample?'手势识别中':'请把手放入画面');
   if(current.id==='water'){
    const frame=main.getBoundingClientRect();const origin=engine.origin?.angle??trackedSample?.angle??0;
    const angle=trackedSample?Math.atan2(Math.sin(trackedSample.angle-origin),Math.cos(trackedSample.angle-origin)):0;
    const pose=trackedJug(trackedSample?.grip?lastPalm:{x:.3,y:.55},result.flow&&Math.abs(angle)<.15?.30:angle,frame,(video.videoWidth||640)/(video.videoHeight||480));
    art.querySelector('[data-art=vessel]')?.setAttribute('transform',pose.transform);
    art.querySelectorAll('[data-art=flow] path').forEach((path,i)=>{const endX=650+i*22,endY=540;path.setAttribute('d',`M${pose.spout.x} ${pose.spout.y} Q${(pose.spout.x+endX)/2} ${Math.min(pose.spout.y,endY)-25} ${endX} ${endY}`);});
   }

   if(result.message&&liveDescription.textContent!==result.message)liveDescription.textContent=result.message;
   const now=performance.now();if(!result.done&&result.message&&result.message!==lastVoiceMessage&&now-lastSpokenAt>6500){speak(result.message);lastVoiceMessage=result.message;lastSpokenAt=now;}
  }
  if(demo)return;
  const pct=Math.round(result.progress*100);const fill=main.querySelector('.la-progress-fill');fill.style.width=pct+'%';label('.la-percent',pct+'%');main.querySelector('.la-progress').setAttribute('aria-valuenow',String(pct));
  const status=result.done?current.success:manual?manualCopy():camera.state==='live'?result.message:'先看动作，再开启摄像头试一试。';label('.la-feedback',status);
  main.querySelectorAll('.la-steps span').forEach((el,i)=>{el.classList.toggle('active',i===Math.min(2,result.phase));el.classList.toggle('passed',result.done||i<result.phase);});
  const complete=main.querySelector('.la-complete');if(result.done&&complete.hidden){complete.hidden=false;label('.la-success',current.success);speak(current.success+'。可以再做一次，或者换个动作。');saveResult();clearTimeout(confettiTimer);main.querySelector('[data-again]').focus();art.classList.add('la-celebrate');confettiTimer=setTimeout(()=>art.classList.remove('la-celebrate'),1200);}
 }
 function saveResult(){try{const key='memoryplus-life-actions';const saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved)){saved[current.id]={at:new Date().toISOString(),mode:manual?'touch':'camera'};localStorage.setItem(key,JSON.stringify(saved));}}catch{}}
 function manualCopy(){return ({water:'按住水壶，向上拖一点并停住。',pour:'按住水壶，向旁边拖一点并停住。',fridge:'按住把手，先向上拖一点，再向旁边拖。',drawer:'按住把手，先向上拖一点，再向下拖。',wipe:'按住抹布，左右来回拖动。',stir:'按住勺子，慢慢画两个圈。'})[current.id];}
 function select(id){
  shell.querySelector('.la-change').hidden=false;
  cancelDemo();cancelAnimationFrame(manualFrame);gripping=false;current=activities.find(a=>a.id===id)||activities[0];camera.paused=false;
  main.className='la-main la-practice';main.innerHTML='<section class="la-direction"><span class="la-task-name">'+current.title+'</span><h1>'+current.instruction+'</h1><p>'+current.detail+'</p></section><div class="la-camera-wrap"><div class="la-camera"><div class="la-camera-empty">'+handIcon+'<span>把一只手放进画面</span></div></div><p class="la-camera-state" role="status">开启后，在 iPad 训练区里用手操作。</p><div class="la-camera-controls"><button class="la-primary" data-camera>开启手势摄像头</button><button class="la-soft" data-touch>先用触摸试一试</button><button class="la-soft la-easy" aria-pressed="'+easy+'" data-easy>小幅度 · '+(easy?'已开启':'未开启')+'</button></div></div><section class="la-scene-area"><div class="la-demo-tag" hidden>动作示范 · 不计入完成</div><div class="la-stage" aria-label="'+current.title+'，动作反馈画面">'+sceneArt(current.id)+'</div><div class="la-steps">'+current.steps.map((text,i)=>'<span><b>'+(i+1)+'</b>'+text+'</span>').join('')+'</div><p class="la-feedback" role="status"></p><div class="la-progress-row"><div class="la-progress" role="progressbar" aria-label="'+current.title+'完成进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="la-progress-fill"></div></div><span class="la-percent">0%</span></div></section><div class="la-bottom"><button class="la-soft" data-demo>看动作示范</button><button class="la-soft" data-reset>重新开始</button><button class="la-soft" data-read>再听一遍</button></div><div class="la-complete" hidden><div><span class="la-check" aria-hidden="true">✓</span><h2 class="la-success"></h2><p>做到了，休息一下也可以。</p><button class="la-primary" data-again>再做一次</button><button class="la-soft" data-another>换个动作</button></div></div>';
  const cameraBox=main.querySelector('.la-camera');cameraBox.append(video,canvas);cameraBox.classList.toggle('live',camera.state==='live');main.querySelector('.la-camera-wrap').classList.toggle('touch',manual);label('[data-camera]',camera.state==='live'?'关闭摄像头':camera.state==='loading'?'取消开启':'开启手势摄像头');
  main.querySelector('[data-camera]').onclick=()=>{if(camera.state!=='off'){camera.stop();return;}manual=false;reset();main.querySelector('.la-camera-wrap').classList.remove('touch');label('[data-touch]','先用触摸试一试');camera.start();};
  main.querySelector('[data-touch]').onclick=()=>{manual=true;camera.stop();main.querySelector('.la-camera-wrap').classList.add('touch');label('[data-touch]','触摸体验中');reset();};
  main.querySelector('[data-easy]').onclick=()=>{easy=!easy;main.querySelector('[data-easy]').setAttribute('aria-pressed',String(easy));label('[data-easy]','小幅度 · '+(easy?'已开启':'未开启'));reset();};
  main.querySelector('[data-demo]').onclick=demo;main.querySelector('[data-reset]').onclick=reset;main.querySelector('[data-again]').onclick=reset;main.querySelector('[data-another]').onclick=menu;
  main.querySelector('[data-read]').onclick=()=>speak(current.instruction+'。'+current.detail);wireTouch();reset();speak(current.instruction+'。'+current.detail);
 }
 function demo(){
  if(demoActive){cancelDemo();main.querySelector('.la-demo-tag').hidden=true;paint(engine.result());return;}
  demoActive=true;camera.paused=true;engine.pause();main.classList.add('la-demo-mode');main.querySelector('.la-demo-tag').hidden=false;label('[data-demo]','停止示范');label('.la-feedback','看一遍动作，再跟着试一试。');speak(current.instruction);const start=performance.now();
  const tick=now=>{if(!demoActive||disposed)return;const t=Math.min(1,(now-start)/9000),p=Math.max(0,Math.min(1,(t-.22)/.65));lastPalm={x:.5+Math.sin(t*Math.PI*4)*.16,y:.5+Math.cos(t*Math.PI*4)*.08};paint({progress:p,flow:t>.25&&t<.88,phase:t<.22?0:2,demoTime:t},true);main.querySelectorAll('.la-steps span').forEach((el,i)=>el.classList.toggle('active',i===(t<.22?0:t<.45?1:2)));if(t<1)demoFrame=requestAnimationFrame(tick);else{cancelDemo();main.querySelector('.la-demo-tag').hidden=true;paint(engine.result());label('.la-feedback',camera.state==='live'?'现在跟着做一做。':'看懂了，点「开启摄像头」试一试。');}};demoFrame=requestAnimationFrame(tick);
 }
 function wireTouch(){const stage=main.querySelector('.la-stage');stage.onpointerdown=e=>{if(!manual||demoActive||engine.progress>=1)return;e.preventDefault();stage.setPointerCapture(e.pointerId);gripping=true;const rect=stage.getBoundingClientRect();pointerStart=pointerPoint={x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height};
   const now=performance.now(),sample=touchSample();for(const dt of [-220,-100,0])engine.update(sample,now+dt);
   const tick=t=>{if(!gripping||disposed)return;const sample=touchSample();lastPalm=sample.center;lastResult=engine.update(sample,t);paint(lastResult);manualFrame=requestAnimationFrame(tick);};manualFrame=requestAnimationFrame(tick);
  };stage.onpointermove=e=>{if(!manual||!gripping)return;const r=stage.getBoundingClientRect();pointerPoint={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};stage.onpointerup=stage.onpointercancel=()=>{gripping=false;cancelAnimationFrame(manualFrame);if(engine&&engine.progress<1){engine.flow=false;paint(engine.result());}};
 }
 function touchSample(){return {center:{...pointerPoint},size:.16*(1+(pointerStart.y-pointerPoint.y)*.7),angle:(pointerPoint.x-pointerStart.x)*4,grip:true,open:true};}
 function menu(){cancelDemo();cancelAnimationFrame(manualFrame);gripping=false;current=null;camera.stop();main.className='la-main la-menu';
  main.innerHTML='<div class="la-menu-heading"><span>家庭客厅 · 熟悉的生活动作</span><h1>今天，想动手做点什么？</h1><p>先看一遍示范，再用手轻轻做一做。</p></div><div class="la-cards">'+activities.map(a=>'<button class="la-card" data-activity="'+a.id+'">'+sceneArt(a.id,true)+'<span class="la-card-copy"><strong>'+a.title+'</strong><span>'+a.short+'</span></span><i aria-hidden="true">试一试</i></button>').join('')+'</div>';
  main.querySelectorAll('[data-activity]').forEach(button=>button.onclick=()=>select(button.dataset.activity));shell.querySelector('.la-change').hidden=true;
 }
 async function close(){disposed=true;cancelDemo();cancelAnimationFrame(manualFrame);clearTimeout(confettiTimer);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);window.removeEventListener('pagehide',close);window.speechSynthesis?.cancel();shell.remove();backgrounds.forEach(({el,wasInert})=>{if(!wasInert)el.removeAttribute('inert');});previousFocus?.focus?.();await camera.dispose();}
 shell.addEventListener('keydown',e=>{if(e.key!=='Tab')return;if(immersive&&liveControls.hidden&&engine?.progress<1){e.preventDefault();pauseLive();return;}const complete=main.querySelector('.la-complete');const area=complete&&!complete.hidden?complete:immersive&&!liveControls.hidden?liveControls:shell;const buttons=[...area.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&(document.activeElement===first||!area.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!area.contains(document.activeElement))){e.preventDefault();first.focus();}});
 shell.querySelector('.la-back').onclick=close;shell.querySelector('.la-change').onclick=menu;
 window.addEventListener('pagehide',close,{once:true});
 if(initial)select(initial);else menu();return {close};
}
