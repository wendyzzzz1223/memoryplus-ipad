import {clamp,gap,readHand,Hold,SteadyPoint,Swipe,identity,turnTile,tileFace,tileUpright,nextTileTurn,cssMatrix,traceResult} from './interaction.js';
import {Camera} from './camera.js';
import {paintHandOverlay,videoFrame} from './hand-overlay.js';

const params=new URLSearchParams(location.search);const embedded=params.get('embedded')==='1';
function leaveEmbedded(type='yijia-gesture-exit'){camera.stop();parent.postMessage({type},location.origin);}
const $=id=>document.getElementById(id);
const gameEl=$('game'), pointer=$('pointer'), camButton=$('camera'), camStatus=$('camera-status');
const canvas=$('landmarks'), ctx=canvas.getContext('2d');
const names={sort:'理牌入列',trace:'描麻将牌面',turn:'转正麻将',number:'看牌比数字'};
const tiles={b1:'一条',b5:'五条',b8:'八条',w6:'六万',w9:'九万',w1:'一万',w2:'二万',w3:'三万',w4:'四万',w5:'五万',w7:'七万',b2:'二条',b3:'三条',b4:'四条',b6:'六条',b7:'七条',b9:'九条',d1:'一筒',d2:'二筒',d3:'三筒',d4:'四筒',d6:'六筒',d8:'八筒',red:'红中',green:'发财'};
const cards=[
  ['sort','w3','并指抓牌，握拳移动，张手放下'],
  ['trace','red','伸食指沿着牌面描画'],
  ['turn','green','上下左右挥手，转动立体麻将'],
  ['number','b7','看牌面，比出对应的数字'],
];
const lessons={
  sort:[
    {tile:'w3',rack:['w1','w2','w4','w5','w7'],slot:2,hint:'二万和四万之间'},
    {tile:'b6',rack:['b2','b3','b4','b7','b9'],slot:3,hint:'四条和七条之间'},
    {tile:'d4',rack:['d1','d2','d3','d6','d8'],slot:3,hint:'三筒和六筒之间'},
    {tile:'w5',rack:['w1','w3','w4','w6','w7','w9'],slot:3,hint:'四万和六万之间'},
    {tile:'b5',rack:['b1','b2','b4','b6','b8','b9'],slot:3,hint:'四条和六条之间'},
    {tile:'d6',rack:['d1','d2','d3','d4','d8'],slot:4,hint:'四筒和八筒之间'},
  ],
  trace:[
    {tile:'d1',paths:['M168 104 a95 95 0 1 1 0 190 a95 95 0 1 1 0 -190']},
    {tile:'b2',paths:['M168 75 V175','M168 218 V318']},
    {tile:'red',paths:['M100 150 H235 V226 H100 Z','M168 92 V306']},
    {tile:'d2',paths:['M159 65 a56 56 0 1 1 0 112 a56 56 0 1 1 0 -112','M159 193 a56 56 0 1 1 0 112 a56 56 0 1 1 0 -112']},
    {tile:'w1',paths:['M89 109 L224 98']},
    {tile:'w3',paths:['M124 76 H205','M110 103 H211','M89 131 H217']},
  ],
  turn:[
    {tile:'red',start:['right']},
    {tile:'w7',start:['up']},
    {tile:'green',start:['left','down']},
    {tile:'d4',start:['right','right']},
    {tile:'b6',start:['down','right']},
    {tile:'w9',start:['left','down','right']},
  ],
  number:[
    {tile:'w3',value:3,show:'三',hint:'伸三根手指，拇指收起。'},
    {tile:'d4',value:4,show:'四',hint:'伸四根手指，拇指收起。'},
    {tile:'b7',value:7,show:'七',hint:'拇指、食指和中指的指尖捏在一起，无名指和小指收起。'},
    {tile:'b2',value:2,show:'二',hint:'伸食指和中指，比出 V。'},
    {tile:'w1',value:1,show:'一',hint:'只伸出食指。'},
    {tile:'b5',value:5,show:'五',hint:'张开手掌，伸出五根手指。'},
    {tile:'d6',value:6,show:'六',hint:'伸出拇指和小指，其他手指收起。'},
    {tile:'d8',value:8,show:'八',hint:'伸出拇指和食指，做出 L 形。'},
  ],
};
const numberGuide='./guide/chinese-number-gestures-p3.png';
const numberOptions=lessons.number.map(lesson=>lesson.value).sort((a,b)=>a-b);
const guideWindows={1:'80 30 160 255',2:'245 30 150 255',3:'405 30 140 255',4:'540 30 155 255',5:'690 30 255 255',6:'70 530 170 225',7:'230 530 175 225',8:'410 530 185 225',9:'595 525 180 230',10:'770 540 175 215'};
const help={
  menu:['用拇指朝上、下、左、右选择练习。','保持同一手势 3 秒，进入高亮的练习。'],
  sort:['把光标移到新牌附近，五指并拢或握拳。','保持握拳，把牌移向下方空位。','空位亮起后，张开手掌放下。'],
  trace:['只伸食指，其他手指放松弯曲。','从橙点开始，沿虚线慢慢描。','弯一下食指抬笔，移到下一段再伸直。'],
  turn:['张开手掌，在镜头里停一下。','上下左右任选方向挥一下，每次转 90°。','对照右图，正面朝前、牌身竖直才过关。'],
  guide:['先看图里的 1 到 10。','用一只手跟着图试一试。','准备好后，竖起大拇指或点「开始答题」。'],
  number:['先看牌面，试着自己比出数字。','把手掌朝向摄像头，手势停约半秒。'],
};
const limbs=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]];
const directions={left:'左',right:'右',up:'上',down:'下'};
const tileSrc=key=>'./tiles/'+key+'.png';
const img=(key,cls='')=>'<img class="'+cls+'" src="'+tileSrc(key)+'" alt="'+tiles[key]+'" draggable="false">';
const button=(id,text,primary=false)=>'<button id="'+id+'" class="button'+(primary?' primary':'')+'">'+text+'</button>';
const horizontalHold=new Hold(), horizontalRelease=new Hold(), menuDwell=new Hold();
let horizontalLatch=null,menuGesture=null,menuIndex=0;
const savedQuestions=new Map();
const holds={advance:new Hold(),releaseThumb:new Hold(),hint:new Hold(),grab:new Hold(),drop:new Hold(),answer:new Hold()};
const palmFilter=new SteadyPoint(),penFilter=new SteadyPoint(),swipes=new Swipe();
let mode='menu',index=0,done=false,canThumb=false,roundTime=0,lastHand=-Infinity,grip=null,mouse=null,picked=false,strokes=[],penDown=false,lastPoint=null,lastPenAt=0,lastPointAt=0,matrix=identity(),lastTurn=-Infinity,lastDirection='',lastOpenPalm=-Infinity,answerShown=0,lastThumbUp=false;
const current=()=>lessons[mode]?.[index];
function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function say(value,warning=false){
  const message=$('message');text(message,value);message?.classList.toggle('warn',warning);
}
function cameraSay(value,progress=0){
  text(camStatus,value);
  $('meter').hidden=!progress;
  $('meter').firstElementChild.style.width=Math.round(progress*100)+'%';
}
function clearGrip(){
  grip?.ghost.remove();grip=null;
  $('pickup')?.classList.remove('held','ready');
  gameEl.querySelectorAll('.slot.hot').forEach(el=>el.classList.remove('hot'));
}
function clearHands(){
  Object.values(holds).forEach(h=>h.reset());palmFilter.reset();penFilter.reset();swipes.reset();
  pointer.style.display='none';penDown=false;lastPoint=null;lastPointAt=0;
}
function select(next){
  if(embedded&&next==='menu'){leaveEmbedded();return;}
  mode=next==='number'?'guide':next;
  index=0;savedQuestions.clear();
  menuGesture=null;menuDwell.reset();horizontalHold.reset();
  render();
}
function startNumbers(){mode='number';render();}
function renderGuide(){
  gameEl.innerHTML='<header class="bar"><button class="back" id="back" aria-label="返回练习选择">‹</button><h1>看牌比数字</h1></header>'+
    '<div class="task"><h2>先看看数字手势</h2><p>从一到十，用一只手跟着图试一试。</p></div>'+
    '<div class="guide-art"><img src="'+numberGuide+'" alt="中国数字手势图，展示数字一到十的单手动作"></div>'+
    '<p id="hint-note" class="gesture-hint" role="status" hidden></p>'+
    '<div class="guide-start"><span>👍 准备好了，就竖起大拇指</span>'+button('start-number','开始答题',true)+'</div>';
  $('back').onclick=()=>select('menu');
  $('start-number').onclick=startNumbers;
  canThumb=!lastThumbUp;
}
function render(saved){
  clearGrip();clearHands();
  done=false;canThumb=false;mouse=null;picked=false;roundTime=performance.now();lastTurn=-Infinity;lastOpenPalm=-Infinity;answerShown=0;
  gameEl.className='game '+mode;


  if(mode==='menu'){
    gameEl.innerHTML='<div class="hero"><span class="tag">YIJIA · MAHJONG PRACTICE</span><h1>选一个麻将练习</h1><p>拇指朝上、下、左、右选练习，保持 3 秒进入。</p><p id="menu-countdown" class="menu-countdown" role="status" hidden></p></div><div class="cards">'+cards.map(([key,tile,desc],n)=>'<button class="card" data-game="'+key+'"><span><span class="tag">练习 0'+(n+1)+'</span><h2>'+names[key]+'</h2><p>'+desc+'</p><span class="go" aria-hidden="true">开始 →</span></span>'+img(tile)+'</button>').join('')+'</div>';
    gameEl.querySelectorAll('[data-game]').forEach(el=>el.onclick=()=>select(el.dataset.game));
    updateMenuSelection(0);
    return;
  }
  if(mode==='guide'){renderGuide();return;}
  if(mode==='sort')renderSort();
  if(mode==='trace')renderTrace();
  if(mode==='turn')renderTurn();
  if(mode==='number')renderNumber();
  $('back').onclick=()=>select('menu');$('next').onclick=advance;
  if(!saved)return;
  if(mode==='trace'){
    strokes.forEach((stroke,i)=>stroke.samples.forEach((sample,j)=>{
      if(saved.trace[i][j])inkSample(sample);
    }));
    refreshTrace();
  }else if(mode==='turn'){
    matrix=saved.matrix;
    showTile();
    if(saved.done)finishTurn();
  }else if(mode==='sort'&&saved.done){
    place(gameEl.querySelector('[data-slot="'+current().slot+'"]'));
  }else if(mode==='number'&&saved.done){
    answer(current().value);
  }
}
function frame(title,subtitle,play,controls='',tail=''){
  const list=lessons[mode];
  const next=index===list.length-1?'完成':'下一题';
  gameEl.innerHTML='<header class="bar"><button class="back" id="back" aria-label="返回练习选择">‹</button><h1>'+names[mode]+'</h1><span class="round">第 '+(index+1)+' / '+list.length+' 题</span></header>'+
    '<div class="task"><h2>'+title+'</h2><p>'+subtitle+'</p><div class="rounds" aria-hidden="true">'+list.map((_,i)=>'<i class="'+(i===index?'current':savedQuestions.get(i)?.done?'passed':'')+'"></i>').join('')+'</div></div><div class="playfield">'+play+'</div><p class="message" id="message" role="status"></p>'+
    (controls?'<div class="buttons">'+controls+'</div>':'')+
    '<div id="advance" class="advance" hidden><span id="thumb-prompt">👍 '+(next==='完成'?'竖起大拇指完成练习':'竖起大拇指进入下一题')+'</span>'+button('next',next,true)+'</div>'+
    '<div id="hint-note" class="gesture-hint" role="status" hidden></div>'+tail;
}
function finish(value){
  if(done)return;
  done=true;roundTime=performance.now();canThumb=!lastThumbUp;
  holds.advance.reset();holds.releaseThumb.reset();
  say(value);$('advance').hidden=false;
  $('hint-note').hidden=true;
  gameEl.classList.add('completed');
  gameEl.querySelector('.rounds .current')?.classList.add('passed');
}
function moveQuestion(direction){
  const target=index+direction;
  if(target<0){cameraSay('已经是第一题。');return;}
  if(target>=lessons[mode].length){
    if(done)select('menu');
    else cameraSay('完成最后一题后再继续。');
    return;
  }
  savedQuestions.set(index,{
    done,
    trace:mode==='trace'?strokes.map(stroke=>stroke.samples.map(sample=>sample.hit)):null,
    matrix:mode==='turn'?matrix:null,
  });
  index=target;
  render(savedQuestions.get(index));
}
function advance(){
  if(done)moveQuestion(1);
}
function renderSort(){
  const lesson=current();
  const slot=i=>'<button class="slot" data-slot="'+i+'" aria-label="第 '+(i+1)+' 个空位"></button>';
  const rack=lesson.rack.map((tile,i)=>slot(i)+img(tile)).join('')+slot(lesson.rack.length);
  frame('摸到新牌','把「'+tiles[lesson.tile]+'」放进牌列的正确位置。','<div class="sort-stage"><span class="glow"></span><button id="pickup" class="pickup" aria-label="拿起'+tiles[lesson.tile]+'">'+img(lesson.tile)+'</button></div>','',
    '<div id="rack" class="table" aria-label="麻将牌列">'+rack+'</div>');
  say('靠近新牌，五指并拢抓牌。');
  const pickup=$('pickup');
  pickup.onpointerdown=e=>{
    if(e.button!==0||done||grip)return;
    e.preventDefault();pickup.setPointerCapture(e.pointerId);
    const at=xy(e);mouse={id:e.pointerId,start:at};grab(at,'mouse');
  };
  pickup.onclick=e=>{if(e.detail===0&&!done&&!grip)pick();};
  gameEl.querySelectorAll('[data-slot]').forEach(el=>el.onclick=()=>{if(picked&&!done&&!grip)place(el);else if(!done&&!grip)say('先拿起桌上的新牌。');});
}
function pick(){picked=true;$('pickup').classList.add('selected');say('已拿起。请选择下方空位。');}
const xy=e=>({x:e.clientX,y:e.clientY});
function inside(p,rect,px=0,py=px){return p.x>=rect.left-px&&p.x<=rect.right+px&&p.y>=rect.top-py&&p.y<=rect.bottom+py;}
function grab(point,source){
  const ghost=document.createElement('img');ghost.className='ghost';ghost.alt='';ghost.src=tileSrc(current().tile);
  document.body.append(ghost);grip={ghost,source,slot:null};
  $('pickup').classList.add('held');moveGrip(point);
  say(source==='hand'?'已抓住。握拳移动到空位，再张开手。':'已拿起。拖到正确的空位。');
}
function closestSlot(point,old){
  const rack=$('rack');
  if(!inside(point,rack.getBoundingClientRect(),18,24))return null;
  const slots=[...rack.querySelectorAll('.slot')];
  const distance=slot=>{const r=slot.getBoundingClientRect();return Math.abs(point.x-r.left-r.width/2);};
  const nearest=slots.reduce((a,b)=>distance(a)<distance(b)?a:b);
  return old&&distance(old)<distance(nearest)+13?old:nearest;
}
function moveGrip(point){
  grip.ghost.style.left=point.x+'px';grip.ghost.style.top=point.y+'px';
  grip.slot=closestSlot(point,grip.slot);
  gameEl.querySelectorAll('.slot').forEach(el=>el.classList.toggle('hot',el===grip.slot));
}
function drop(){
  const slot=grip.slot;clearGrip();
  if(slot)place(slot);else say('移到牌列旁，等空位亮起后再放。',true);
}
function place(slot){
  if(+slot.dataset.slot!==current().slot){say('再找找'+current().hint+'。',true);return;}
  const placed=document.createElement('img');placed.src=tileSrc(current().tile);placed.alt=tiles[current().tile];
  slot.replaceWith(placed);
  $('pickup').style.visibility='hidden';
  gameEl.querySelectorAll('.slot').forEach(el=>el.disabled=true);
  finish('放对了！');
  const message=$('message'),detail=document.createElement('small');
  detail.textContent='「'+tiles[current().tile]+'」已入列';
  message.append(detail);
  document.querySelector('.sort-stage').append(message);
}
function renderTrace(){
  const lesson=current();
  const svg='<svg id="guide" viewBox="0 0 336 405" aria-hidden="true"><g id="routes" fill="none" stroke="#9f805b" stroke-width="4" stroke-dasharray="6 9" stroke-linecap="round">'+lesson.paths.map(d=>'<path d="'+d+'"/>').join('')+'</g><g id="ink"></g><circle id="trace-hint" class="trace-hint" r="9"/></svg>';
  frame('描出「'+tiles[lesson.tile]+'」','伸出食指，从橙点沿着虚线描。','<div class="trace-area"><div class="badge"><strong id="percent">0%</strong>描画进度</div><div class="pad" id="pad">'+img(lesson.tile)+svg+'</div><div class="badge">牌面示例'+img(lesson.tile)+'</div></div>',button('retry','重新描画'));
  const paths=[...$('routes').querySelectorAll('path')];
  strokes=paths.map(path=>{
    const length=path.getTotalLength(),steps=Math.ceil(length/8);
    const samples=Array.from({length:steps},(_,i)=>{
      const a=path.getPointAtLength(length*i/steps),b=path.getPointAtLength(length*(i+1)/steps);
      return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,a,b,hit:false};
    });
    return {samples};
  });
  refreshTrace();
  $('retry').onclick=()=>render();
  $('pad').onpointerdown=e=>{
    if(e.button!==0||done||penDown)return;
    e.preventDefault();$('pad').setPointerCapture(e.pointerId);
    mouse={id:e.pointerId};lastPoint=null;draw(xy(e),performance.now());
  };
}
function refreshTrace(){
  const {done,percent,next:target}=traceResult(strokes);
  text($('percent'),percent+'%');
  const hint=$('trace-hint');
  if(target){hint.setAttribute('cx',target.x);hint.setAttribute('cy',target.y);}
  else{
    for(const stroke of strokes)for(const sample of stroke.samples)inkSample(sample);
    hint.setAttribute('visibility','hidden');
    $('pad').classList.add('complete');
    finish('描好了！竖起大拇指或向右继续。');
  }
  if(!done)say(percent>=75?'还有虚线没描完。跟着橙点补上。':'食指伸直落笔，沿虚线描完整。');
}
function inkSample(sample){
  if(sample.hit)return;
  sample.hit=true;
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1',sample.a.x);line.setAttribute('y1',sample.a.y);
  line.setAttribute('x2',sample.b.x);line.setAttribute('y2',sample.b.y);
  line.setAttribute('class','trace-ink');$('ink').append(line);
}
function draw(point,now){
  if(done)return;
  const r=$('guide').getBoundingClientRect();
  if(!inside(point,r)){lastPoint=null;return;}
  const p={x:(point.x-r.left)/r.width*336,y:(point.y-r.top)/r.height*405};
  const length=lastPoint?gap(p,lastPoint):0;
  const steps=lastPoint&&length<105&&now-lastPointAt<250?Math.max(1,Math.ceil(length/4)):0;
  let changed=false;
  for(let i=0;i<=steps;i++){
    const q=steps?{x:lastPoint.x+(p.x-lastPoint.x)*i/steps,y:lastPoint.y+(p.y-lastPoint.y)*i/steps}:p;
    let nearest=null,nearestStroke=null,nearestIndex=0,best=41;
    for(const stroke of strokes){
      for(const [sampleIndex,sample] of stroke.samples.entries()){
        const distance=gap(q,sample);
        if(distance>=best)continue;
        best=distance;nearest=sample;nearestStroke=stroke;nearestIndex=sampleIndex;
      }
    }
    if(!nearest)continue;
    const touched=nearestStroke.samples.slice(Math.max(0,nearestIndex-1),nearestIndex+2);
    // At crossings, credit both strokes only when the pointer actually reaches the junction.
    if(best<10){
      for(const stroke of strokes){
        if(stroke===nearestStroke)continue;
        for(const sample of stroke.samples)if(gap(q,sample)<9)touched.push(sample);
      }
    }
    for(const sample of touched){
      if(sample.hit)continue;
      inkSample(sample);changed=true;
    }
  }
  lastPoint=p;lastPointAt=now;
  if(changed)refreshTrace();
}
function renderTurn(){
  const lesson=current();matrix=lesson.start.reduce(turnTile,identity());
  const model='<div class="perspective"><span class="glow"></span><div class="body3d" id="body3d" role="img" aria-label="立体麻将"><div class="tile3d" id="tile3d">'+img(lesson.tile,'face front')+['rear','side-left','side-right','top-face','bottom-face'].map(side=>'<span class="face '+side+'"></span>').join('')+'</div></div></div>';
  const controls=Object.entries(directions).map(([direction,label])=>button('turn-'+direction,'向'+label+'转')).join('');
  frame('把麻将牌转正、立起来','照着右图，让正面朝前，牌身竖直。','<div class="turn-area"><div class="badge"><strong>↔ ↕</strong>四向挥手</div>'+model+'<div class="badge">正面示例'+img(lesson.tile)+'</div></div>',controls);
  Object.keys(directions).forEach(key=>$('turn-'+key).onclick=()=>rotate(key));
  showTile();
}
function showTile(){
  $('tile3d').style.transform=cssMatrix(matrix);
  const face=tileFace(matrix);
  $('body3d').setAttribute('aria-label','立体麻将，'+face);
  say(face+' · 四向挥手转一面');
}
function rotate(direction){
  if(mode!=='turn'||done)return;
  matrix=turnTile(matrix,direction);showTile();
  if(tileUpright(matrix)){
    finishTurn();
  }else if(!$('hint-note').hidden){
    showHint();
  }
}
function finishTurn(){
  Object.keys(directions).forEach(key=>$('turn-'+key).disabled=true);
  finish('转正了！正面朝前，牌身竖直。');
}
function renderNumber(){
  const lesson=current();
  const gesture='<figure id="number-example" class="number-example" hidden><figcaption>跟着图做</figcaption>'+
    '<svg viewBox="'+guideWindows[lesson.value]+'" role="img" aria-label="数字 '+lesson.value+' 的手势：'+lesson.hint+'"><image href="'+numberGuide+'" width="1005" height="1006"/></svg>'+
    '<span>'+lesson.show+' · '+lesson.value+'</span></figure>';
  const panel='<div class="number-area"><div class="badge number-ref"><b id="number-read">—</b>识别到的数字</div><div class="number-tile">'+img(lesson.tile)+'<strong>'+tiles[lesson.tile]+'</strong></div>'+gesture+'</div>';
  frame('看麻将，比数字','用一只手比出这张牌的数字。',panel,numberOptions.map(n=>button('number-'+n,''+n)).join(''));
  numberOptions.forEach(n=>$('number-'+n).onclick=()=>answer(n));
  say('保持手势一会儿，等数字被识别。');
}
function answer(n){
  if(done)return;
  text($('number-read'),String(n));
  if(n===current().value){
    numberOptions.forEach(n=>$('number-'+n).disabled=true);
    finish('比对了！这是数字 '+n+'。');
  }else{
    say('识别到 '+n+'。再看看牌上的数字，试一次。',true);
  }
}
gameEl.onpointermove=e=>{
  if(e.pointerId!==mouse?.id)return;
  if(mode==='sort'&&grip)moveGrip(xy(e));
  if(mode==='trace')draw(xy(e),performance.now());
};
gameEl.onpointerup=e=>{
  if(e.pointerId!==mouse?.id)return;
  if(mode==='sort'&&grip){
    if(gap(xy(e),mouse.start)>6){moveGrip(xy(e));drop();}else{clearGrip();pick();}
  }
  mouse=null;lastPoint=null;
};
gameEl.onpointercancel=e=>{if(e.pointerId===mouse?.id){mouse=null;clearGrip();lastPoint=null;}};
document.addEventListener('keydown',e=>{
  const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];
  if(mode==='turn'&&direction&&!e.repeat){e.preventDefault();rotate(direction);}
});

function screenPoint(point,el,extra=0){
  const r=el.getBoundingClientRect();
  if (el === gameEl && camera.state === 'live') {
    const frame=videoFrame($('view').getBoundingClientRect(),$('video').videoWidth/$('video').videoHeight||4/3);
    return {x:frame.left+point.x*frame.width,y:frame.top+point.y*frame.height};
  }
  return {x:r.left+(clamp((point.x-.13)/.74)*(1+extra*2)-extra)*r.width,y:r.top+(clamp((point.y-.13)/.74)*(1+extra*2)-extra)*r.height};
}
function movePointer(point,active){
  pointer.style.left=point.x+'px';pointer.style.top=point.y+'px';
  pointer.style.display='block';pointer.classList.toggle('active',active);
}
function drawLandmarks(points){
  paintHandOverlay({canvas,ctx,video:$('video'),view:$('view'),points,
    foreground:mode==='trace'?$('pad'):null});
}
function lostHand(now){
  if(now-lastHand<260)return;
  clearHands();lastThumbUp=false;if(done||mode==='guide')canThumb=true;
  if(grip?.source==='hand'&&now-lastHand>800){clearGrip();say('手离开了画面，牌回到桌面。');}
  cameraSay('等候手势 · 请把整只手放进镜头。');
}
function trackSort(pose,now){
  const at=screenPoint(palmFilter.update(pose.palm,now),gameEl);
  movePointer(at,grip?.source==='hand');
  if(mouse)return;
  if(!grip){
    const ready=inside(at,$('pickup').getBoundingClientRect(),76,57);
    $('pickup').classList.toggle('ready',ready);
    const hold=holds.grab.read(ready&&pose.closed,now,115);
    if(hold.fire){grab(at,'hand');holds.drop.reset();}
    cameraSay(ready?'并拢五指或握拳，抓住新牌。':'移动橙色光标，靠近桌上的新牌。',hold.progress);
  }else if(grip.source==='hand'){
    // Freeze the selected slot as fingers open so changes in hand shape cannot move the tile.
    if(!pose.open||!grip.slot)moveGrip(at);
    const hold=holds.drop.read(pose.open,now,145);
    cameraSay(grip.slot?'空位已高亮 · 张手放下':'保持握拳 · 移到下方空位',hold.progress);
    if(hold.fire){drop();holds.grab.reset();}
  }
}
function trackTrace(pose,now){
  const at=camera.state==='live'?screenPoint(pose.tip,gameEl):screenPoint(penFilter.update(pose.tip,now,52),$('guide'),.18);
  movePointer(at,penDown);
  if(mouse)return;
  if(pose.pointing)lastPenAt=now;
  if(pose.indexBent||(!pose.pointing&&now-lastPenAt>140)){
    penDown=false;lastPoint=null;
  }else if(pose.pointing&&!penDown){
    penDown=true;lastPoint=null;
  }
  if(penDown)draw(at,now);
  cameraSay(penDown?'描画中 · 沿虚线慢慢描':'只伸食指开始描画。');
}
function trackTurn(pose,now){
  if(pose.open)lastOpenPalm=now;
  const direction=swipes.update(now-lastOpenPalm<170&&!pose.closed?pose.palm:null,now);
  if(direction){lastTurn=now;lastDirection=direction;rotate(direction);}
  cameraSay(now-lastTurn<780?'已识别 · 向'+directions[lastDirection]+'挥一次':pose.open?'已识别手掌 · 可以上下左右挥':'张开手掌，再上下左右挥动。');
}
function trackNumber(pose,now){
  const hold=holds.answer.read(pose.number,now,470);
  if(hold.progress>.25&&answerShown!==pose.number){
    answerShown=pose.number;text($('number-read'),String(pose.number));
  }
  cameraSay(pose.number?'识别到 '+pose.number+' · 保持一下':'请把数字手势朝向摄像头。',hold.progress);
  if(hold.fire)answer(pose.number);
}
function swipeIllustration(direction){
  const angle={right:0,down:90,left:180,up:-90}[direction];
  return '<svg class="swipe-illustration" viewBox="0 0 132 118" aria-hidden="true"><g transform="translate(0 15)">'+
    '<g transform="rotate('+angle+' 66 44)" fill="none" stroke="#2e6651" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M15 44h102m-16-13 16 13-16 13"/><path d="M20 33h12m-12 22h12" stroke-width="3" opacity=".65"/></g>'+
    '<path d="M54 76c-3-7-12-15-17-22-5-8 0-13 6-10l7 7V25c0-6 9-6 9 0v14-23c0-6 9-6 9 0v23-19c0-6 9-6 9 0v21-13c0-6 9-5 9 1v19c0 12-2 19-7 28Z" fill="#ffcf9f" stroke="#603e28" stroke-width="3" stroke-linejoin="round"/></g></svg>';
}

function showHint(){
  let hint;
  if(mode==='guide')hint='可以先跟着图试一下。准备好后，竖起大拇指开始。';
  else if(done)hint='这题已经完成。竖起大拇指，或点击继续按钮。';
  else if(mode==='sort'){
    hint='试着把「'+tiles[current().tile]+'」放在'+current().hint+'。';
    gameEl.querySelector('[data-slot="'+current().slot+'"]')?.classList.add('hinted');
  }else if(mode==='trace')hint='找到牌面上的橙点，从那里沿虚线慢慢描。';
  else if(mode==='turn'){
    const next=nextTileTurn(matrix);
    const note=$('hint-note');
    note.innerHTML=swipeIllustration(next)+'<strong>向'+directions[next]+'挥手一次</strong>';
    note.hidden=false;
    return;
  }else if(mode==='number'){
    hint=current().hint+' 看着右侧的手势图试一次。';
    $('number-example').hidden=false;
    $('number-example').classList.add('hinted');
  }
  const note=$('hint-note');
  text(note,'提示 · '+hint);note.hidden=false;
}
function trackContinue(pose,now){
  const guide=mode==='guide';
  if(!canThumb){
    cameraSay('放松一下手，再重新竖起大拇指。');
    return;
  }
  const hold=holds.advance.read(pose.thumb==='up',now,520);
  cameraSay(pose.thumb==='up'?'识别到 👍 · 保持一下':guide?'准备好就竖起大拇指。':'过关了 · 👍 继续，👎 看提示。',hold.progress);
  if(hold.fire){
    if(guide)startNumbers();
    else advance();
  }
}
function updateMenuSelection(remaining){
  gameEl.querySelectorAll('[data-game]').forEach((card,i)=>{
    card.classList.toggle('menu-selected',i===menuIndex);
    if(i===menuIndex)card.setAttribute('aria-current','true');
    else card.removeAttribute('aria-current');
  });
  const countdown=$('menu-countdown');
  countdown.hidden=!remaining;
  if(remaining)text(countdown,names[cards[menuIndex][0]]+' · '+remaining+' 秒后进入');
}
function trackHorizontal(thumb,now){
  const direction=mode==='menu'||thumb==='left'||thumb==='right'?thumb:null;
  if(horizontalRelease.read(!direction,now,160).fire){
    horizontalLatch=null;menuGesture=null;
  }
  const move=horizontalHold.read(direction&&direction!==horizontalLatch?direction:null,now,230);
  if(mode==='menu'){
    if(move.fire){
      horizontalLatch=direction;
      menuGesture=direction;
      const row=Math.floor(menuIndex/2),column=menuIndex%2;
      const nextRow=clamp(row+Number(direction==='down')-Number(direction==='up'),0,1);
      const nextColumn=clamp(column+Number(direction==='right')-Number(direction==='left'),0,1);
      menuIndex=2*nextRow+nextColumn;
    }
    const dwell=menuDwell.read(direction,now,3000);
    if(dwell.fire&&direction===menuGesture){
      select(cards[menuIndex][0]);
      return true;
    }
    updateMenuSelection(direction&&direction===menuGesture?Math.max(1,Math.ceil((1-dwell.progress)*3)):0);
    cameraSay('拇指朝上、下、左、右选练习，保持 3 秒进入。',dwell.progress);
    return;
  }
  if(thumb&&thumb===horizontalLatch)return true;
  if(!direction||mode==='guide')return false;
  if(move.fire){
    horizontalLatch=direction;
    moveQuestion(direction==='right'?1:-1);
  }
  return true;
}
function onCameraFrame(points,now,aspect){
  drawLandmarks(points);
  if(!points){
    if(now-lastHand>=260){
      horizontalLatch=null;menuGesture=null;
      horizontalHold.reset();horizontalRelease.reset();menuDwell.reset();
      if(mode==='menu')updateMenuSelection(0);
    }
    lostHand(now);return;
  }
  lastHand=now;
  const pose=readHand(points,aspect||4/3);lastThumbUp=pose.thumb==='up';
  const navigating=trackHorizontal(pose.thumb,now);
  if(mode==='menu'||navigating){
    holds.advance.reset();holds.grab.reset();holds.drop.reset();holds.answer.reset();holds.hint.reset();
    penDown=false;lastPoint=null;swipes.update(null,now);pointer.style.display='none';
    return;
  }
  if((done||mode==='guide')&&!canThumb&&holds.releaseThumb.read(!lastThumbUp,now,130).fire)canThumb=true;
  const hint=holds.hint.read(pose.thumb==='down',now,440);
  if(pose.thumb==='down'){
    holds.advance.reset();
    holds.grab.reset();holds.drop.reset();holds.answer.reset();
    penDown=false;lastPoint=null;swipes.update(null,now);pointer.style.display='none';
    if(hint.fire)showHint();
    cameraSay(hint.progress>=1?'提示已显示。':'识别到 👎 · 保持一下看提示。',hint.progress);
    return;
  }
  if(done||mode==='guide'){trackContinue(pose,now);return;}
  if(now-roundTime<180)return;
  if(pose.thumb==='up'){
    holds.grab.reset();holds.drop.reset();holds.answer.reset();
    penDown=false;lastPoint=null;swipes.update(null,now);pointer.style.display='none';
    cameraSay('完成这一题后，竖起大拇指继续。');
    return;
  }
  if(mode==='sort')trackSort(pose,now);
  if(mode==='trace')trackTrace(pose,now);
  if(mode==='turn')trackTurn(pose,now);
  if(mode==='number')trackNumber(pose,now);
}
const camera=new Camera($('video'),{frame:onCameraFrame,change(state,note){
  text($('mode'),state==='live'?'手势版 · 识别中':embedded?'手势版 · 摄像头未开启':'鼠标模式');
  $('mode').classList.toggle('live',state==='live');
  $('view').classList.toggle('live',state==='live');
  document.querySelector('.layout').classList.toggle('camera-live',state==='live');
  text(camButton,state==='live'?'关闭摄像头':state==='loading'?'取消开启':'开启摄像头');
  if(state==='off'){lastThumbUp=false;horizontalLatch=null;menuGesture=null;horizontalHold.reset();horizontalRelease.reset();menuDwell.reset();if(mode==='menu')updateMenuSelection(0);clearHands();if(grip?.source==='hand')clearGrip();drawLandmarks(null);}
  cameraSay(note);
}});
camButton.onclick=()=>camera.state==='off'?camera.start():camera.stop();
$('home').onclick=()=>select('menu');
if(embedded){
 document.body.classList.add('embedded-training');
 $('home').setAttribute('aria-label','返回训练页面');$('home').innerHTML='<span>‹</span>返回训练';
 const switchButton=document.createElement('button');switchButton.className='embedded-click-mode';switchButton.textContent='改用点击版';switchButton.onclick=()=>leaveEmbedded('yijia-gesture-click');document.querySelector('.mast').append(switchButton);
 $('mode').textContent='手势版 · 摄像头未开启';
} 
window.addEventListener('pagehide',()=>camera.stop());
if(embedded&&['sort','trace','turn','number'].includes(params.get('lesson')))select(params.get('lesson'));else render();
