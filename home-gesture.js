import {thumbFlex,ThumbPress} from './home-thumb.js?v=5-5';
import {readHand} from './gesture/interaction.js?v=5-5';
import {homeLessons,tilted,practiceMatches,GestureGate} from './home-gesture-logic.js?v=5-5';
const bones=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]];
const handIcon=(type='open')=>{
 const paths={
  open:'M33 114V86L18 66Q11 52 24 52L38 66V27Q38 15 48 23V12Q53 2 60 12V8Q68 0 72 10V20Q81 9 85 23V40Q98 29 99 43V85Q99 110 80 117Z',
  fist:'M31 114V77Q21 66 27 56Q33 48 41 56V47Q47 36 55 45Q63 36 71 45Q81 39 87 50Q98 46 101 60V88Q100 109 81 117Z',
  point:'M35 115V88L22 71Q15 57 27 56L40 68V18Q40 5 52 12V64Q59 50 69 58Q78 51 85 62Q96 56 100 70V90Q98 111 80 118Z',
  thumb:'M36 114V61L52 39L58 16Q63 5 71 16L69 50H91Q103 51 100 65L91 105Q88 116 76 117Z'
 };
 return '<svg viewBox="0 0 120 130" aria-hidden="true"><path d="'+(paths[type]||paths.open)+'" fill="#edd0ad" stroke="#6d8975" stroke-width="3" stroke-linejoin="round"/><path d="M43 82q15-17 34 0M39 113h43" fill="none" stroke="#b89577" stroke-width="3"/></svg>';
};
const pressIcon=()=>'<svg class="home5-thumb-demo" viewBox="0 0 260 240" aria-label="握住遥控器，用拇指按红色按钮"><rect x="104" y="25" width="87" height="173" rx="20" fill="#334c42"/><circle class="demo-power" cx="130" cy="56" r="15" fill="#de865d"/><path d="M137 112h31m-31 24h31m-31 24h31" stroke="#8da69b" stroke-width="10" stroke-linecap="round"/><path d="M95 219l-24-55q-14-44 10-74l21-20 7 54 18 63 33 32" fill="#dfb998" stroke="#957455" stroke-width="3"/><path class="demo-thumb" d="M91 137q-8-47 18-67l14-11q14-9 22 5t-8 23l-16 13 4 31" fill="#dfb998" stroke="#957455" stroke-width="3" stroke-linecap="round"/></svg>';
export function mountHomeGesture(root,api){
 const panel=document.createElement('div');panel.className='hg-camera';panel.hidden=true;
 panel.innerHTML='<div class="hg-preview"><video autoplay playsinline muted aria-label="双手摄像头画面"></video><canvas width="640" height="480" aria-hidden="true"></canvas></div><p role="status">摄像头未开启</p><div><button data-camera>开启摄像头</button><button data-preview>收起画面</button><button data-click>用点击版</button></div>';
 const lesson=document.createElement('section');lesson.className='hg-teaching';lesson.hidden=true;lesson.setAttribute('aria-label','我的家手势学习');
 const cursor=document.createElement('div');cursor.className='hg-pointer';cursor.hidden=true;root.append(panel,lesson,cursor);
 const video=panel.querySelector('video'),canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d'),status=panel.querySelector('p');
 let requiresRelease=false;let stopped=false,enabled=false,stream=null,detector=null,attempt=0,loading=false,teaching=false,lessonIndex=0,learned=false,history={},matchedAt=0,lessonDone=false,trackedDrawing=false,lastSeen=0,hover=null,heldTarget=null,lastAction=0,lastPoint={x:.5,y:.5},lookPoint=null;
 let previousMain=null,nearObject=null,nearAt=0,remoteWasHeld=false,demoMode=false,lessonSteps=homeLessons.map((_,i)=>i);
 const thumbPress=new ThumbPress(),releaseGate=new GestureGate();
 const gate=new GestureGate(),hintGate=new GestureGate(),confirmGate=new GestureGate();
 function say(text){status.textContent=text;}
 function stopCamera(){attempt++;stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;loading=false;cursor.hidden=true;ctx.clearRect(0,0,640,480);panel.querySelector('[data-camera]').textContent='开启摄像头';gate.reset();api.follow(null);api.thumb?.(0);thumbPress.reset();previousMain=null;if(trackedDrawing){api.draw('cancel');trackedDrawing=false;}}
 function useClick(){enabled=false;teaching=false;lesson.hidden=true;panel.hidden=true;stopCamera();api.changed(false);}
 function choice(){lesson.hidden=false;teaching=false;lesson.innerHTML='<div class="hg-choice"><span class="home5-eyebrow">我的家 5.0</span><h2>像在家一样，拿起遥控器</h2><p>可以随时换一种方式。</p><div><button data-choose-click>点击版<span>点屏幕或用鼠标</span></button><button data-choose-hand>手势版<span>先学拿起，再学拇指按键</span></button></div><button class="home5-try" data-demo>先用点击试遥控器</button></div>';lesson.querySelector('[data-demo]').onclick=()=>{useClick();api.demo();};lesson.querySelector('[data-choose-click]').onclick=useClick;lesson.querySelector('[data-choose-hand]').onclick=()=>startTeaching(true);}
 function renderLesson(){
  const item=homeLessons[lessonSteps[lessonIndex]];history={};matchedAt=0;lessonDone=false;gate.reset();
  lesson.innerHTML='<div class="hg-lesson"><header><span>动作学习 '+(lessonIndex+1)+' / '+lessonSteps.length+'</span><button data-replay>再听一遍</button></header><h2>'+item.title+'</h2><div class="hg-demo '+item.kind+'">'+(item.kind==='press'?pressIcon():handIcon(item.kind==='point'?'point':item.kind==='thumb'?'thumb':item.kind==='grab'||item.kind==='carry'?'fist':'open'))+((item.kind==='open'||item.kind==='look'||item.kind==='thumb'||item.kind==='carry'||item.kind==='pour')?handIcon(item.kind==='thumb'?'thumb':item.kind==='carry'?'fist':'open'):'')+'</div><p class="hg-lesson-copy">'+item.text+'</p><p class="hg-practice-feedback" role="status">点「开启摄像头」，跟着练一练；也可以先看教学。</p><footer><button data-prev '+(lessonIndex===0?'disabled':'')+'>上一个动作</button><button data-next>'+(lessonIndex===lessonSteps.length-1?'开始生活练习':'下一个动作')+'</button><button data-skip>先开始练习</button><button data-leave>改用点击版</button></footer></div>';
  lesson.querySelector('[data-replay]').onclick=()=>api.speak(item.title+'。'+item.text);
  lesson.querySelector('[data-prev]').onclick=()=>{lessonIndex--;renderLesson();};
  lesson.querySelector('[data-next]').onclick=()=>{if(lessonIndex<lessonSteps.length-1){lessonIndex++;renderLesson();}else finishTeaching();};
  lesson.querySelector('[data-skip]').onclick=finishTeaching;lesson.querySelector('[data-leave]').onclick=useClick;
  api.speak(item.title+'。'+item.text);
 }
 function startTeaching(short=false){demoMode=short;lessonSteps=short?[3,4]:homeLessons.map((_,i)=>i);enabled=true;teaching=true;learned=false;lessonIndex=0;panel.hidden=false;lesson.hidden=false;root.classList.add('home-gesture-enabled');api.changed(true);renderLesson();}
 function finishTeaching(){teaching=false;learned=true;if(demoMode)api.demo();thumbPress.reset();lesson.hidden=true;say(stream?'准备好了。伸食指指向物品。':'点击「开启摄像头」开始手势操作。');api.speak('现在开始生活练习。不会做时，可以点提示，或改用点击版。');}
 async function startCamera(){
  if(stream||loading){stopCamera();say('摄像头已关闭。');return;}
  if(!navigator.mediaDevices?.getUserMedia){say('当前浏览器不能开启摄像头，可以使用点击版。');return;}
  const current=++attempt;loading=true;say('请允许使用摄像头，画面只在本机处理。');panel.querySelector('[data-camera]').textContent='取消开启';
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:15,max:20},facingMode:'user'}});
   if(current!==attempt||stopped){media.getTracks().forEach(t=>t.stop());return;}
   stream=media;video.srcObject=media;await video.play();say('正在加载双手识别…');
   detector??=await import('./gesture/tracker.js?v=5-5').then(m=>m.createDetector());
   if(current!==attempt||stopped){if(stopped)detector?.dispose?.();return;}
   loading=false;panel.querySelector('[data-camera]').textContent='关闭摄像头';say('请把双手放进画面，坐着练习就可以。');
   for(const track of stream.getVideoTracks())track.addEventListener('ended',()=>{if(current===attempt){stopCamera();say('摄像头已断开，可重新开启或改用点击版。');}},{once:true});
   let last=0;
   while(current===attempt&&!stopped){await new Promise(resolve=>requestAnimationFrame(resolve));const now=performance.now();if(now-last<110||video.readyState<2)continue;last=now;const points=await detector.detectMany(video);if(current===attempt)process(points,performance.now());}
  }catch(error){if(current!==attempt)return;stopCamera();say(error.name==='NotAllowedError'?'摄像头未获允许，可以改用点击版。':'识别暂时没有启动，请重新开启或改用点击版。');}
 }
 function drawPreview(hands){
  ctx.clearRect(0,0,640,480);ctx.lineWidth=3;
  hands.forEach((points,index)=>{ctx.strokeStyle=index?'#f0b271':'#9fd9c0';for(const bone of bones){ctx.beginPath();bone.forEach((p,i)=>{const x=(1-points[p].x)*640,y=points[p].y*480;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}});
 }
 function process(points,now){
  drawPreview(points);if(!points.length){cursor.hidden=true;gate.reset();matchedAt=0;if(now-lastSeen>350){thumbPress.reset();api.thumb?.(0);previousMain=null;api.pour?.(false);api.follow(null);if(trackedDrawing){api.draw('cancel');trackedDrawing=false;}say('没有看清手，请把手放回镜头。');}return;}
  lastSeen=now;const aspect=(video.videoWidth||640)/(video.videoHeight||480);const poses=points.map(p=>({...readHand(p,aspect),thumbSignal:thumbFlex(p,aspect),tilted:tilted(p),tiltAngle:Math.max(-1,Math.min(1,Math.atan2(p[9].x-p[0].x,-(p[9].y-p[0].y))))})).sort((a,b)=>a.palm.x-b.palm.x);
  if(teaching){const okay=practiceMatches(homeLessons[lessonSteps[lessonIndex]].kind,poses,history);if(okay){matchedAt||=now;if(now-matchedAt>600){lessonDone=true;lesson.querySelector('.hg-practice-feedback').textContent='做到了！可以点「'+(lessonIndex===lessonSteps.length-1?'开始生活练习':'下一个动作')+'」。';}}else matchedAt=0;return;}
  if(!enabled||!learned)return;
  const state=api.state(),two=poses.length===2;
  const main=previousMain?poses.reduce((a,b)=>Math.hypot(a.palm.x-previousMain.x,a.palm.y-previousMain.y)<Math.hypot(b.palm.x-previousMain.x,b.palm.y-previousMain.y)?a:b):poses.at(-1);previousMain={...main.palm};
  api.follow(main,{twoHands:two,poses});
  if(hintGate.update(!state.remote&&poses.some(p=>p.thumb==='down')?'hint':'',now,900)){api.hint();return;}
  if(confirmGate.update(state.stage==='route'&&state.valid&&poses.some(p=>p.thumb==='up')?'go':'',now,850)){api.go();return;}
  if(main.pointing)lastPoint={...main.tip};const p=main.pointing?main.tip:main.palm;
  const rect=api.sceneRect(),x=rect.left+p.x*rect.width,y=rect.top+p.y*rect.height,frame=root.getBoundingClientRect();
  cursor.hidden=false;cursor.style.left=((x-frame.left)/frame.width*1366)+'px';cursor.style.top=((y-frame.top)/frame.height*1024)+'px';
  if(state.stage==='route'){
   if(main.pointing){if(!trackedDrawing)trackedDrawing=api.draw('start',p);else api.draw('move',p);say('食指正在画路线。画完收起食指，再竖起拇指出发。');}
   else if(trackedDrawing){api.draw('end',p);trackedDrawing=false;say(api.state().valid?'路线好了，竖起拇指或点「走过去」。':'点「提示」看看路线，再慢慢画。');}
   return;
  }
  if(state.remote){
    cursor.hidden=true;hover?.classList.remove('hg-hover');hover=null;
    if(!remoteWasHeld){thumbPress.reset();releaseGate.reset();remoteWasHeld=true;}
    if(main.open){api.thumb?.(0);thumbPress.reset();if(releaseGate.update('release',now,700)){api.releaseRemote();remoteWasHeld=false;}say('张开手掌停一下，把遥控器放回茶几。');return;}
    releaseGate.reset();
    if(state.busy){thumbPress.reset();return;}
    if(state.done){thumbPress.reset();api.thumb?.(main.thumbSignal.bent?1:0);return;}
    const press=thumbPress.update(main.thumbSignal,now);api.thumb?.(press.amount);
    api.remoteStatus?.(press.ready?'握稳了，拇指轻轻弯一下':press.phase==='pressed'?'按下了，拇指放松再试':'拇指先放松伸开，四根手指握住');
    if(press.fire)api.pressRemote();
    say(press.ready?'拇指轻轻弯一下，按遥控器。':'拇指先放松，再轻轻弯一下。');return;
  }
  if(remoteWasHeld){remoteWasHeld=false;thumbPress.reset();api.thumb?.(0);}
  if(state.busy||state.done)return;
  if(two&&poses.every(p=>p.open)&&state.action==='normal'&&!state.held){
    const center={x:(poses[0].palm.x+poses[1].palm.x)/2,y:(poses[0].palm.y+poses[1].palm.y)/2};
    if(lookPoint){const dx=center.x-lookPoint.x,dy=center.y-lookPoint.y;api.look?.(Math.abs(dx)>.006?Math.max(-.025,Math.min(.025,dx)):0,Math.abs(dy)>.006?Math.max(-.025,Math.min(.025,dy)):0);}lookPoint=center;say('正在看四周。握拳或收起一只手，就停下。');return;
  }else lookPoint=null;
  const candidates=[...root.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length&&!b.closest('.hg-camera,.hg-teaching'));
  const target=candidates.find(b=>{const r=b.getBoundingClientRect();return x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12;});
  hover?.classList.remove('hg-hover');hover=target;hover?.classList.add('hg-hover');
  // Two hands have distinct jobs; no single-hand stand-in completes these actions.
  if(state.action==='pour'){
   const pouring=two&&poses.some(p=>p.closed)&&poses.some(p=>p.tilted);api.pour?.(pouring);say(pouring?'正在倒水，慢慢来。':'一只手扶杯，另一只手慢慢向旁边倾斜。');return;
  }
  if(state.action==='place-bowl'){
   if(two&&poses.every(p=>p.closed)){
     history.carrying=true;const center={x:(poses[0].palm.x+poses[1].palm.x)/2,y:(poses[0].palm.y+poses[1].palm.y)/2};history.origin??=center;
     if(Math.hypot(center.x-history.origin.x,center.y-history.origin.y)>.045)history.moved=true;
     say(history.moved?'对准「放碗处」，双手一起张开。':'双手捧稳，慢慢抬起一点。');
   }
   const place=candidates.find(button=>button.dataset.homeTarget==='tableplace'),placeRect=place?.getBoundingClientRect();
   const nearPlace=placeRect&&Math.hypot(x-(placeRect.left+placeRect.width/2),y-(placeRect.top+placeRect.height/2))<150*frame.width/1366;
   if(gate.update(two&&(history.carrying||state.held)&&history.moved&&nearPlace&&poses.every(p=>p.open)?'place-bowl':'',now,650)){api.apply('place-bowl');history={};lastAction=now;}return;
  }
  if(state.action==='take-bowl'){
   if(gate.update(two&&poses.every(p=>p.closed)&&target?.dataset.homeTarget==='bowl'?'take-bowl':'',now,650)){api.apply('take-bowl');history={carrying:true,origin:{x:(poses[0].palm.x+poses[1].palm.x)/2,y:(poses[0].palm.y+poses[1].palm.y)/2}};lastAction=now;}say('双手移向饭碗，轻轻握住。');return;
  }
  if(requiresRelease){if(main.open||main.pointing)requiresRelease=false;else return;}
  if(now-lastAction<1100){gate.reset();return;}
  const picked=api.pick?.(p)||target?.dataset.homeTarget;
  if(picked){nearObject=picked;nearAt=now;}
  const isObject=picked||(main.closed&&now-nearAt<650?nearObject:null);
  if(gate.update((isObject&&main.closed)||(target&&main.pointing&&!isObject)?(isObject?'object:'+isObject:'button:'+(target.getAttribute('aria-label')||target.textContent)):'',now,main.closed?320:950)){
   if(isObject)api.choose(isObject);else target.click();lastAction=now;requiresRelease=true;heldTarget=isObject;nearObject=null;
  }
  if(isObject){const objectButton=candidates.find(b=>b.dataset.homeTarget===isObject);objectButton?.classList.add('hg-hover');hover=objectButton||hover;}
  say((target||isObject)?(main.closed?'握住了，停一下。':'对准后握拳；普通按钮可伸食指停一下。'):'移动手，把光标对准想操作的物品。');
 }
 panel.querySelector('[data-camera]').onclick=startCamera;panel.querySelector('[data-click]').onclick=useClick;
 panel.querySelector('[data-preview]').onclick=()=>{const preview=panel.querySelector('.hg-preview');preview.hidden=!preview.hidden;panel.querySelector('[data-preview]').textContent=preview.hidden?'展开画面':'收起画面';};
 return {choose:choice,teach:()=>startTeaching(false),demo:()=>{if(enabled)startTeaching(true);else{lesson.hidden=true;api.demo();}},stop(){stopped=true;enabled=false;stopCamera();detector?.dispose?.();hover?.classList.remove('hg-hover');panel.remove();lesson.remove();cursor.remove();}};
}
