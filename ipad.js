import {initLocalization,createLanguageSwitch,getLanguage,translate,applyLanguage} from './i18n.js?v=granddaughter-5-4';
import {openGestureTraining,availableGames} from './training-input.js';
import {setTypeScale, showTypeSettings} from './type-layout.js';
import {ad8,tasks,referral} from './assessment.js';
import {screens} from './screens.js?v=granddaughter-5-4';
import {identity,turnTile,tileUpright,cssMatrix,nextTileTurn,tileFace} from './interaction.js';

import {decorate, familyMatch, familyActivity, trendControls} from './v2.js?v=report-layout-5';

const preferences={input:localStorage.getItem('yijia-training-input')==='gesture'?'gesture':'click',mode:localStorage.getItem('yijia-mode')||'medical',font:localStorage.getItem('yijia-font')||'大号',rate:Number(localStorage.getItem('yijia-rate')||.82),volume:Number(localStorage.getItem('yijia-volume')||1)};
const immersive={'111:100':'111:154','111:207':'111:1006','111:671':'111:1045','111:1632':'112:54','111:2878':'112:120'};
const gameName={sort:'理牌入列',memory:'记忆翻牌',find:'麻将找牌',speed:'眼疾手快',trace:'绘制牌面',rotate:'转正麻将'};

const trainingRules={
 sort:'先看看手里这张新牌。再看看下面的牌，从小到大排好了。把新牌拖到合适的空位里，或者点一下那个空位。慢慢来。',
 memory:'先记住要找的麻将牌放在哪里。等牌翻过去，就点一下你记得的那个位置。',
 find:'先看上方给出的麻将牌。再从下面找出所有一模一样的牌，找到一张，就点一下。',
 speed:'看到发财牌，就点一下。每次点对，牌的位置会换一换。留意新的位置，继续找发财。',
 trace:'沿着牌面上的浅色线条，用手指慢慢描。画好了，就点提交本题。三张都画完后，可以一起看得分。',
 rotate:'看看右边的示例牌。滑动牌面，或点上下左右的按钮，每次转九十度。把有图案的一面转向自己，再把牌立正。',
};

const stage=document.querySelector('#stage');
const scaled=document.querySelector('#scaled');
const announcement=document.querySelector('#announcement');
const pages={invite:'113:3769',home:'113:3801',settings:'113:4023',screening:'113:4107',part1:'113:4136',part2:'113:4263',survey:'113:4310',assessment:'113:4353',report:'113:4856',living:'113:4540',medicine:'113:4414',message:'113:4664',family:'113:4831',trends:'113:4975',trendDetail:'113:5076',profile:'113:5164',done:'113:5256',album:'113:5310',training:'113:8391'};
const sorts=['111:100','111:829','111:880'];
const memories=['111:207','111:346','111:508'];
const choices=['111:245','111:385','111:245'];
const finds=['111:671','111:726','111:771'];
const speeds=['111:548','111:609','111:548'];
const traces=[['111:1632','111:1719'],['111:1758','111:1845'],['111:1884','111:1976']];
const turns=[['111:2819','111:2878','111:2940','111:3001'],['111:3062','111:3122','111:3185','111:3246'],['111:3307','111:3366','111:3428','111:3489']];
const tall={'113:4023':1901,'113:4856':1301};
const routes=['home','training','living','trends','profile'];
const nav=['首页','训练','家庭客厅','看变化','我的'];
const q=s=>stage.querySelector(s);
const all=s=>[...stage.querySelectorAll(s)];
const named=n=>q('[data-name="'+n+'"]');
let height=1024,timers=[],scale=1,stopLayout=()=>{},stopGesture=()=>{};
const time=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id);return id;};
const interval=(fn,ms)=>{const id=setInterval(fn,ms);timers.push(id);return id;};
function fit(){
 const vp=document.querySelector('#viewport'), css=getComputedStyle(vp);
 const availableWidth=vp.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
 const availableHeight=innerHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
 scale=Math.min(availableWidth/1366,availableHeight/1024);
 scaled.style.width=1366*scale+'px'; scaled.style.height=height*scale+'px';
 stage.style.transform='scale('+scale+')';
}
addEventListener('resize',fit);
function screenMarkup(id){
 return screens[id].replace('style="background-image:url(\" data-name=', 'data-name=');
}
function render(id){
 if(!screens[id])return false;
 if(activeSpeech){const current=activeSpeech;window.speechSynthesis?.cancel();current.finish();}
 stopRuleSpeech();
 stopGesture();stopGesture=()=>{};
 stopLayout();
 for(const t of timers)clearTimeout(t);
 timers=[];
 const game=/^(111|112):/.test(id);
 stage.className=game?'game '+(preferences.mode==='immersive'?'immersive':'medical'):'';
 stage.dataset.font=preferences.font;
 stage.innerHTML=screenMarkup(game&&preferences.mode==='immersive'?(immersive[id]??id):id);
 decorate(stage);
 applyFontScale();
 height=tall[id]??1024;stage.style.height=height+'px';
 document.documentElement.scrollTop=0;fit();
 return true;
}
function applyFontScale(){
 setTypeScale(stage,preferences.font);
}
function fitContent(content, extra=0){
 const adjust=()=>{
  if(!content.isConnected)return;
  height=Math.max(1024,Math.ceil(content.offsetHeight+extra));
  stage.style.height=height+'px';
  fit();
 };
 adjust();
 const observer=new ResizeObserver(adjust);
 observer.observe(content);
 stopLayout=()=>observer.disconnect();
}
function action(node,callback,label){
 if(!node)return;
 node.setAttribute('role','button');node.tabIndex=0;
 if(label)node.setAttribute('aria-label',label);
 node.onclick=e=>{e.preventDefault();e.stopPropagation();callback(e);};
 node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();node.click();}};
}
function textAction(label,callback){
 const node=all('p,span,a,button,div').find(n=>(n.textContent.trim()===label||n.textContent.trim()===translate(label))&&![...n.children].some(c=>c.textContent.trim()===label));
 if(!node)return;
 const parent=node.parentElement;
 action(parent&&parent.children.length<=2&&parent.matches('[data-name*=Button], [data-name*=button], a')?parent:node,callback,label);
}
function toolbar(items){
 const bar=document.createElement('div');bar.className='touch-toolbar';
 for(const [label,fn,primary] of items){
  const b=document.createElement('button');b.type='button';b.className=primary?'advance':'';b.textContent=label;b.onclick=fn;bar.append(b);
 }
 stage.append(bar);return bar;
}
function feedback(value,ms=0){
 q('.feedback')?.remove();const note=document.createElement('div');note.className='feedback';note.textContent=value;stage.append(note);
 announcement.textContent=value;if(ms)time(()=>note.remove(),ms);
}
function dialog(message,ruleFallback=false){
 const d=document.createElement('dialog');d.className=ruleFallback?'demo-dialog rules-dialog':'demo-dialog';d.textContent=message;
 const b=document.createElement('button');b.textContent='知道了';b.onclick=()=>d.close();d.append(b);
 d.onclose=()=>d.remove();document.body.append(d);d.showModal();
}
let ruleSpeech,activeSpeech;
const familyMessage='爷爷，别忘记做今天的认知训练。我晚上回家给你打电话，记得别忘记吃降压药哦！';
function stopRuleSpeech(){
 if(!ruleSpeech)return;
 const {button}=ruleSpeech;
 ruleSpeech=null;
 window.speechSynthesis.cancel();
 button.setAttribute('aria-pressed','false');
 button.querySelector('span').textContent=button.dataset.speechLabel;
}
function speak(text,ruleButton,playbackButton){
 const synthesis=window.speechSynthesis;
 if(!synthesis||!window.SpeechSynthesisUtterance){
  if(ruleButton)dialog(text,true);
  else feedback('此设备暂不支持朗读',1800);
  return;
 }
 if(playbackButton&&activeSpeech?.button===playbackButton){
  const current=activeSpeech;
  synthesis.cancel();
  current.finish();
  return;
 }
 activeSpeech?.finish();
 stopRuleSpeech();
 synthesis.cancel();
 if(synthesis.paused)synthesis.resume();
 if(preferences.volume<=0){feedback('请先在设置中调高音量，再播放留言。',3500);return;}
 const speech=new SpeechSynthesisUtterance(translate(text));
 speech.lang=getLanguage()==='en'?'en-GB':'zh-CN';
 speech.rate=ruleButton?Math.min(preferences.rate,.9):preferences.rate;
 speech.volume=preferences.volume;
  const voices=synthesis.getVoices();
  const isMandarin=voice=>getLanguage()==='en'?/^en(?:$|[-_])/i.test(voice.lang):/^zh[-_](CN|Hans)(?:$|[-_])/i.test(voice.lang);
  const voice=voices.find(voice=>isMandarin(voice)&&voice.localService)
   ??voices.find(voice=>isMandarin(voice))
   ??voices.find(voice=>(getLanguage()==='en'?/^en(?:$|[-_])/i:/^zh(?:$|[-_])/i).test(voice.lang)&&voice.localService);
  if(voice){speech.voice=voice;speech.lang=voice.lang;}
  speech.pitch=1.05;
 if(ruleButton){
  ruleSpeech={speech,button:ruleButton};
  ruleButton.setAttribute('aria-pressed','true');
  ruleButton.querySelector('span').textContent='停止播报';
  const finish=error=>{
   if(ruleSpeech?.speech!==speech)return;
   ruleSpeech=null;
   ruleButton.setAttribute('aria-pressed','false');
   ruleButton.querySelector('span').textContent=ruleButton.dataset.speechLabel;
   if(error&&ruleButton.isConnected)dialog(text,true);
  };
  speech.onend=()=>finish(false);
  speech.onerror=event=>finish(!['canceled','interrupted'].includes(event.error));
 }else{
  const finish=()=>{
   if(activeSpeech?.speech!==speech)return;
   activeSpeech=null;
   if(playbackButton){playbackButton.setAttribute('aria-pressed','false');playbackButton.setAttribute('aria-label',translate('播放留言'));playbackButton.querySelector('.message-play-label').textContent=translate('播放留言');}
  };
  activeSpeech={speech,button:playbackButton,finish};
  speech.onend=finish;
  speech.onerror=event=>{finish();if(!['canceled','interrupted'].includes(event.error))feedback('语音未能播放，请确认设备声音已开启并重试。',3500);};
  if(playbackButton){playbackButton.setAttribute('aria-pressed','true');playbackButton.setAttribute('aria-label',translate('停止播放'));playbackButton.querySelector('.message-play-label').textContent=translate('停止播放');}
 }
 synthesis.speak(speech);
}
function back(game){
 const backButton=named('back-button')??named('返回');
 action(backButton,()=>go('training'),'返回');
 const header=backButton?.closest('[data-name="top-bar"],[data-name="顶栏"],[data-name="沉浸式顶栏"]');
 if(!header||!trainingRules[game])return;
 addSpeechButton(header,'listen-rules','听规则',trainingRules[game]);
}
function addSpeechButton(parent,className,label,text){
 const button=document.createElement('button');
 button.type='button';
 button.className=className;
 button.dataset.speechLabel=label;
 button.setAttribute('aria-pressed','false');
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></svg><span></span>';
 button.querySelector('span').textContent=label;
 button.onclick=()=>{
  if(ruleSpeech?.button===button)stopRuleSpeech();
  else speak(text,button);
 };
 parent.append(button);
}
function questionAudio(text){
 named('Volume-notice (声音-大)')?.closest('[data-node-id="111:151"]')?.remove();
 named('Volume-notice (声音-大)')?.remove();
 addSpeechButton(stage,'listen-question','播报题目',text);
}
function go(key){
 const id=pages[key];if(!id||!render(id))return;
 all('[data-name^="Nav Item - "]').forEach(n=>{
  const label=n.dataset.name.slice(11).split(' (')[0];
  if(n.dataset.name.includes('(Active)'))n.setAttribute('aria-current','page');
  const route=routes[nav.indexOf(label)];if(route)action(n,()=>go(route),label);
 });
 const bind=(label,route)=>textAction(label,()=>go(route));
 if(key==='invite'){bind('接受邀请','settings');bind('请家人帮我设置','settings');}
 if(key==='home'){
  stage.classList.add('home-layout');
  named('Volume-notice (声音-大)')?.closest('[data-name="Button"]')?.remove();
  const streak=q('[data-node-id="113:3892"]');
  if(streak){
   const icon=streak.firstElementChild;
   streak.classList.add('practice-streak-card');
   const content=document.createElement('div');content.className='practice-streak-content';
   content.innerHTML='<h3>坚持天数</h3><p><span>已坚持</span><strong>18天</strong></p>';
   streak.replaceChildren(icon,content);
  }
  stage.append(createLanguageSwitch('home'));
  const card=(id,fn,label)=>action(q('[data-node-id="'+id+'"]'),fn,label);
  action(q('[data-name^="Section - Hero:"]'),()=>find(0),'开始练习');
  action(q('[data-name^="Section - Achievement Card"]'),()=>go('trends'),'认知活跃度');
  card('113:3870',()=>go('medicine'),'该吃药了');
  card('113:3878',()=>dialog('这是试玩演示。此处展示紧急联系人入口。'),'一键呼救');
  card('113:3892',()=>go('trends'),'坚持天数');
  action(named('Section - Family Connection'),()=>speak('爷爷，别忘记做今天的认知训练。我晚上回家给你打电话，记得别忘记吃降压药哦！'),'播放留言');

 }
 if(key==='training'){
  stage.classList.add('training-layout');
  const cards=named('Cards Grid');if(cards)fitContent(cards,277+28);
  const games={'记忆翻牌':memory,'理牌入列':sort,'眼疾手快':speed,'麻将找牌':find,'描麻将牌面':trace,'转正麻将':rotate};
  const mode=document.createElement('label');mode.className='mode-switch';
  mode.innerHTML='<span>医疗版</span><input type="checkbox" role="switch" aria-label="切换沉浸式训练"><span class="mode-track"></span><span>沉浸式</span>';
  const control=mode.querySelector('input');control.checked=preferences.mode==='immersive';
  control.onchange=()=>{preferences.mode=control.checked?'immersive':'medical';localStorage.setItem('yijia-mode',preferences.mode);};
  stage.append(mode);
  q('[data-node-id="113:8538"]')?.remove();
  const examples=[memories[0],sorts[0],speeds[0],finds[0],traces[0][0],turns[0][1]];
  const previews=[];const trainingCards=new Map();
  Object.entries(games).forEach(([name,fn],index)=>{
   const card=named('Card-'+name);
   const key=Object.keys(gameName).find(key=>gameName[key]===(name==='描麻将牌面'?'绘制牌面':name));
   trainingCards.set(key,card);
   action(card,()=>startTraining(key,fn),name==='描麻将牌面'?'绘制牌面':name);
   const area=card?.querySelector('[data-name="Tile-Area"]')??card?.firstElementChild;
   if(!area)return;
   const preview=document.createElement('div');preview.className='training-preview';
   preview.setAttribute('inert','');preview.setAttribute('aria-hidden','true');
   area.classList.add('training-preview-area');area.replaceChildren(preview);
   previews.push([preview,examples[index]]);
  });
  const updatePreviews=()=>{
   for(const [preview,id] of previews){
    preview.classList.toggle('preview-immersive',control.checked);
    preview.innerHTML=screenMarkup(control.checked?(immersive[id]??id):id);
    preview.querySelectorAll('[data-node-id]').forEach(n=>n.removeAttribute('data-node-id'));
   }
  };
  const numberCard=document.createElement('button');numberCard.type='button';numberCard.className='number-training-card';numberCard.dataset.name='Card-number';
  numberCard.innerHTML='<div class="number-training-preview"><img src="./gesture/tiles/b7.png" alt="七条麻将牌"><span>比出数字</span></div><div><h2>看牌比数字</h2><p>看看麻将牌，用一只手比出数字</p><span class="training-tag">手眼协调</span></div>';
  numberCard.onclick=()=>startTraining('number');trainingCards.set('number',numberCard);
  const selector=document.createElement('section');selector.className='training-input-selector';selector.setAttribute('aria-label','选择训练操作方式');
  selector.innerHTML='<label class="mode-switch training-method-switch"><span class="input-mode-label" data-method="click"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 3 3.5 14 3-4 4.5-.5L7 3Z"/><path d="m14 14 3.5 6M3 5l2 1M6 1l1 2M2 10h2"/></svg>点击版</span><input type="checkbox" role="switch" aria-label="切换训练操作方式：点击版或手势版"><span class="mode-track"></span><span class="input-mode-label" data-method="gesture"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-2.4 6-6 6h-1c-2.5 0-4-1.5-5.5-3.5L4 13.8a1.5 1.5 0 0 1 2.2-2L8 14"/></svg>手势版</span></label><p class="training-input-note sr" role="status"></p>';
  const inputControl=selector.querySelector('input');

  stage.append(selector);
  function startTraining(key,clickFn){
    if(preferences.input==='click'){clickFn?.(0);return;}
    if(!availableGames('gesture').includes(key))return;
    stopGesture=openGestureTraining(key,{
      onExit:()=>go('training'),
      onClickMode:()=>{preferences.input='click';localStorage.setItem('yijia-training-input','click');if(key==='number')go('training');else ({sort,trace,rotate})[key]?.(0);}
    });
  }
  function updateInput(){
    const isGesture=preferences.input==='gesture';stage.dataset.trainingInput=preferences.input;
    inputControl.checked=isGesture;selector.querySelectorAll('[data-method]').forEach(label=>label.classList.toggle('selected',label.dataset.method===preferences.input));
    const visible=availableGames(preferences.input).map(key=>trainingCards.get(key)).filter(Boolean);cards?.replaceChildren(...visible);
    mode.hidden=isGesture;
    selector.querySelector('.training-input-note').textContent=isGesture?'选择下方项目后，再开启摄像头。可随时改用点击版。':'选择下方项目开始练习，无需摄像头。';
  }
  inputControl.onchange=()=>{preferences.input=inputControl.checked?'gesture':'click';localStorage.setItem('yijia-training-input',preferences.input);updateInput();};
  control.addEventListener('change',updatePreviews);
  updatePreviews();updateInput();

 }
 if(['living','medicine','message'].includes(key)){
  stage.classList.add(key+'-layout');
  const dialogBack=()=>go('living');
  const portrait=named('Framed Family Portrait');
  if(portrait)portrait.onpointermove=e=>{
   const r=portrait.getBoundingClientRect();portrait.style.setProperty('--spot-x',((e.clientX-r.left)/r.width*100)+'%');portrait.style.setProperty('--spot-y',((e.clientY-r.top)/r.height*100)+'%');
  };
  if(key==='living'){
   const homeEntry=document.createElement('button');
   homeEntry.className='home-entry';
   homeEntry.setAttribute('aria-label','我的家，进入三维生活任务');
   homeEntry.innerHTML='<svg viewBox="0 0 150 90" aria-hidden="true"><rect x="3" y="20" width="142" height="54" rx="17" fill="#344a40" stroke="#f5f0dd" stroke-width="3"/><circle cx="121" cy="47" r="10" fill="#e6a47b"/><rect x="24" y="35" width="35" height="22" rx="7" fill="#879e89"/><circle cx="75" cy="38" r="4" fill="#ece7d3"/><circle cx="75" cy="54" r="4" fill="#ece7d3"/><circle cx="91" cy="38" r="4" fill="#ece7d3"/><circle cx="91" cy="54" r="4" fill="#ece7d3"/></svg><span>我的家</span>';
   homeEntry.onclick=async()=>{
    homeEntry.disabled=true;
    try {
     const {openHome3D}=await import('./home3d.js');
     openHome3D(speak);
    } catch {
     dialog('三维家庭暂时没有加载成功，请返回客厅后再试一次。');
    } finally {
     homeEntry.disabled=false;
    }
   };
   stage.append(homeEntry);
   const lifeEntry=document.createElement('button');lifeEntry.className='life-action-entry';lifeEntry.setAttribute('aria-label','盆栽，进入生活动作练习');
   lifeEntry.innerHTML='<svg viewBox="0 0 120 95" aria-hidden="true"><path d="M48 59q-7-35 17-49M61 46Q29 37 26 20m36 18q26-25 40-17" fill="none" stroke="#73936f" stroke-width="7" stroke-linecap="round"/><ellipse cx="36" cy="31" rx="12" ry="23" transform="rotate(-50 36 31)" fill="#9bb78d"/><ellipse cx="85" cy="29" rx="12" ry="24" transform="rotate(52 85 29)" fill="#7fa679"/><path d="M30 58h61l-8 31H39Z" fill="#c49a75"/><rect x="26" y="54" width="70" height="11" rx="5" fill="#d8ae85"/></svg><span>生活动作 · 浇花</span>';
   lifeEntry.onclick=async()=>{lifeEntry.disabled=true;try{const {openLifeActions}=await import('./life-actions.js?v=ipad-live-2');openLifeActions(speak,'water');}catch{dialog('生活动作练习暂时没有加载成功，请再试一次。');}finally{lifeEntry.disabled=false;}};stage.append(lifeEntry);

   action(named('钟表'),()=>go('screening'),'早筛测试');
   action(named('Framed Family Portrait'),()=>{render(pages.family);familyMatch(stage,()=>go('living'),action);},'全家福连连看');
   textAction('看看谁来过',()=>familyActivity(speak));
  }
  action(named('Family Photo Album'),()=>go('album'),'相册');
  action(named('电话'),()=>key==='message'?speak(familyMessage):go('message'),'电话留言');
  if(key==='message'){
   const play=q('[data-node-id="113:4800"]');
   if(play){
    play.classList.add('family-message-play');
    const label=document.createElement('span');label.className='message-play-label';label.textContent='播放留言';play.append(label);
    play.setAttribute('aria-pressed','false');
    action(play,()=>speak(familyMessage,null,play),'播放留言');
   }
  }
  const body=named('Box Body');const box=body?.parentElement.tagName.includes('MOTION')?body.parentElement.parentElement:body;if(box){box.classList.add('cabinet-medicine');action(box,()=>key==='medicine'?dialog('女儿涵涵提醒您，早上的血压药还没吃。'):go('medicine'),'药品提醒');}
  if(key!=='living')toolbar([['返回客厅',dialogBack]]);
 }
 if(key==='album'){
  textAction('点击按钮，播放家人共同回忆',()=>speak('这是1999年8月6日在北京的全家福。'));
  action(named('record-button'),()=>dialog('试玩版展示语音回忆入口。'),'录制我的回忆');
 }
 if(key==='profile'){
  action(named('action-settings'),()=>go('settings'),'设置中心');
  action(named('action-help'),()=>dialog('点击左侧导航，随时回到首页。'),'帮助与反馈');
  action(named('training-card'),()=>go('trends'),'本周训练');
  action(named('family-card'),()=>{render(pages.family);familyMatch(stage,()=>go('profile'),action);},'我的家人');
 }
 if(key==='settings'){
  const page=showTypeSettings(stage,preferences,applyFontScale,speak,()=>go('profile'));
  fitContent(page);
 }
 if(key==='trends'){
  trendControls(stage,action);
  textAction('下次评估：2月15日',()=>go('screening'));
 }
 if(key==='screening'){
  stage.classList.add('screening-layout');
  const timeBox=q('[data-node-id="113:4116"]');
  const timeParts=['113:4119','113:4120','113:4121'].map(id=>q('[data-node-id="'+id+'"]'));
  if(timeBox&&timeParts.every(Boolean)){timeBox.classList.add('screening-time');timeBox.replaceChildren(...timeParts);}
  bind('准备好了，开始吧','part1');textAction('我想先看看说明',()=>dialog('请按照自己的节奏作答。这里用于体验界面流程。'));
 }
 if(key==='part1')textAction('开始第一部分',()=>{surveyAnswers.fill(undefined);taskAnswers.fill(undefined);survey(0);});
 if(key==='part2')textAction('准备好了，开始第二部分',()=>assessment(0));
 if(key==='report'){
  applyFontScale();
  named('Primary CTA')?.remove();
  const bar=toolbar([['发送给医生',()=>{
   render(pages.home);
   referral(stage,()=>go('report'));
   applyFontScale();
  }],['开始训练',()=>go('training'),true]]);
  bar.classList.add('report-actions');
  const note=document.createElement('p');note.className='report-demo-note';note.textContent='示例报告 · 用于体验流程';stage.append(note);
 }
 if(key==='done'){bind('返回首页','home');bind('看变化','trends');}
 if(['report','album','family','part1','part2','screening'].includes(key))toolbar([['返回',()=>go(key==='album'||key==='family'?'living':'home')]]);
 applyLanguage();
}
const surveyAnswers=Array(8),taskAnswers=Array(11);
function stepHeader(index,total,title){
 const question=named('Question Card');
 const head=named('progress-header');
 const counter=[...(head?.querySelectorAll('p')??[])].find(n=>n.textContent.includes('第'));
 if(counter)counter.textContent='第 '+(index+1)+' 题，共 '+total+' 题';
 const fill=named('progress-fill');if(fill)fill.style.width=((index+1)/total*100)+'%';
 const text=question?.querySelector('p');if(text)text.textContent=title;
 return question;
}
function survey(index){
 render(pages.survey);
 const [title,hint]=ad8[index],question=stepHeader(index,8,title);
 if(hint){const note=document.createElement('p');note.className='question-hint';note.textContent=hint;question.insertBefore(note,named('play-audio'));}
 action(named('play-audio'),()=>speak(title+' '+hint),'朗读题目');
 const options=named('Options');options.classList.add('ad-options');options.replaceChildren();
 const next=named('Button - 下一题');
 for(const value of ['是','不是','无法判断']){
  const button=document.createElement('button');button.textContent=value;button.setAttribute('aria-pressed',String(surveyAnswers[index]===value));
  button.onclick=()=>{surveyAnswers[index]=value;for(const n of options.children)n.setAttribute('aria-pressed',String(n===button));next.removeAttribute('aria-disabled');};
  options.append(button);
 }
 if(!surveyAnswers[index])next.setAttribute('aria-disabled','true');
 applyFontScale();
 action(next,()=>{if(surveyAnswers[index])index<7?survey(index+1):go('part2');});
 action(named('Button - 上一题'),()=>index?survey(index-1):go('part1'));
}
function assessment(index){
 render(pages.assessment);
 const task=tasks[index],question=stepHeader(index,tasks.length,task.title);
 const root=stage.firstElementChild;
 [...root.children].filter(n=>!n.contains(question)&&!/Progress Section|Button|阿尔兹|Overlay/.test(n.dataset.name??'')).forEach(n=>n.hidden=true);
 for(const label of ['Button - 上一题','Button - 下一题'])named(label)?.remove();
 const board=document.createElement('section');board.className='task-board';
 if(task.hint){const p=document.createElement('p');p.textContent=task.hint;board.append(p);}
 if(task.asset){const img=document.createElement('img');img.src='assets/assessment-'+task.asset+'.png';img.alt=task.asset==='animals'?'三种待命名动物':'立方体示例';img.className='task-asset '+task.asset;board.append(img);}
 stage.append(board);
 const replay=()=>speak(task.audio?(task.kind==='tap'?task.audio.split('').join('。'):task.audio):task.title);
 action(named('play-audio'),replay,'播放题目');
 if(task.kind==='text'){
  const fields=document.createElement('div');fields.className='task-fields';
  task.fields.forEach((label,i)=>{const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.placeholder='请输入';input.inputMode=task.numeric?'numeric':'text';input.value=taskAnswers[index]?.[i]??'';input.oninput=()=>{(taskAnswers[index]??=[])[i]=input.value;};wrap.append(input);fields.append(wrap);});board.append(fields);
 }
 if(task.kind==='tap'){
  const tap=document.createElement('button');tap.textContent='听到 1，点这里';tap.onclick=()=>{taskAnswers[index]=(taskAnswers[index]??0)+1;tap.textContent='已点击 '+taskAnswers[index]+' 次';};board.append(tap);
 }
 if(task.kind==='draw'||task.kind==='trail'){
  const pane=document.createElement('div');pane.className='task-pad';
  if(task.kind==='trail')pane.style.backgroundImage='url(assets/assessment-trail.png)';
  const w=task.kind==='trail'?460:625;
  pane.style.width=w+'px';board.append(pane);
  const canvas=addCanvas(pane,{left:0,top:0,width:w,height:355},()=>{

  });
  const context=canvas.getContext('2d');
  if(typeof taskAnswers[index]==='string'){const img=new Image();img.onload=()=>context.drawImage(img,0,0,w,355);img.src=taskAnswers[index];}
  const clear=document.createElement('button');clear.textContent='重新画';clear.onclick=()=>{context.clearRect(0,0,w,355);taskAnswers[index]=undefined;};board.append(clear);
  board.save=()=>{taskAnswers[index]=canvas.toDataURL();};
 }
 const move=(next)=>{board.save?.();if(next<0)go('part2');else if(next>=tasks.length)go('report');else assessment(next);};
 const bar=toolbar([['上一题',()=>move(index-1)], [index===tasks.length-1?'查看报告':'下一题',()=>move(index+1),true]]);
 bar.classList.add('assessment-nav');
 if(question){const top=(question.getBoundingClientRect().bottom-stage.getBoundingClientRect().top)/scale;board.style.top=Math.max(395,top+24)+'px';}
 bar.style.position='static';board.append(bar);
 applyFontScale();
 fitContent(board,parseFloat(board.style.top)||400);
}
function completeGame(name){
 render(pages.done);
 const old=all('p').find(n=>n.textContent.includes('您完成了今天'));if(old)old.closest('div')?.remove();
 const root=stage.firstElementChild;
 const direct=[...root.children];
 for(const n of direct){if(/太棒了|已坚持打卡|周一|返回首页|看变化/.test(n.textContent))n.hidden=true;}
 const card=document.createElement('section');card.className='completion-panel';
 const title=gameName[name];
 card.innerHTML='<span class="completion-check">✓</span><h1>太棒了！</h1><p>您已完成<strong>'+title+'</strong>训练</p><p class="completion-sub">返回训练中心，继续试试其他练习。</p><div><button class="completion-main">返回训练中心</button><button class="completion-secondary">看变化</button></div>';
 card.querySelector('.completion-main').onclick=()=>go('training');
 card.querySelector('.completion-secondary').onclick=()=>go('trends');root.append(card);
}
function finish(next,name){if(next)next();else completeGame(name);}
function roundNav(round,play,enabled=true,complete){
 const bar=toolbar([['上一题',()=>play(round-1)],['下一题',()=>round===2?complete?.():play(round+1),true]]);
 bar.classList.add('round-nav');bar.children[0].disabled=round===0;bar.children[1].disabled=!enabled||(round===2&&!complete);
 return bar;
}
function roundTimer(seconds,update,expired,barAnimation){
 let remaining=seconds*1000,last=performance.now(),previous;
 const tick=()=>{
  const now=performance.now();
  const paused=Boolean(ruleSpeech||document.querySelector('.rules-dialog[open]'));
  if(!paused)remaining=Math.max(0,remaining-(now-last));
  last=now;
  if(barAnimation){
   barAnimation.currentTime=seconds*1000-remaining;
   if(paused&&barAnimation.playState==='running')barAnimation.pause();
   if(!paused&&remaining>0&&barAnimation.playState==='paused')barAnimation.play();
  }
  const value=Math.ceil(remaining/1000);
  if(value!==previous){previous=value;update(value);}
  if(!value){clearInterval(id);expired();}
 };
 const id=interval(tick,85);
 tick();
 return ()=>clearInterval(id);
}
function sort(round){
 render(sorts[round]);stage.classList.add('sort-game');back('sort');
 const sortPrompt=named('instruction-banner')?.textContent.match(/【([^】]+)】/u)?.[1];
 questionAudio(sortPrompt?'请把'+sortPrompt.trim()+'放进下方合适的空位。':'请把这张新牌放进下方合适的空位。');
 const area=named('top-right');if(area)area.lastElementChild.querySelector('p')?area.lastElementChild.querySelector('p').textContent='当前得分：'+round*10:area.lastElementChild.textContent='当前得分：'+round*10;
 const tray=named('hand-rack-tiles');const zone=named('center-table-drawing-zone');
 tray?.classList.add('v2-rack');zone?.classList.add('v2-draw-zone');named('tile-glowing-container')?.classList.add('v2-glow-wrap');named('glow')?.classList.add('v2-glow');
 const tile=q('[data-name="tile-glowing-container"] [data-name^="tile-"]');
 const slots=all('[data-name="insertion-slot"]');
 const correct=[2,3,3][round];
 let done=false;
 const timer=document.createElement('p');timer.className='sort-timer';stage.append(timer);
 const stop=roundTimer(10,left=>{timer.textContent='倒计时 '+left+' 秒';if(left<=2)slots[correct]?.classList.add('answer-pulse');},()=>{
  timer.textContent='时间到 · 试试亮起的空位';showContinue();
 });
 function showContinue(){q('.round-nav')?.remove();const bar=roundNav(round,sort,true,()=>completeGame('sort'));if(round===2)bar.lastChild.textContent='完成训练';}
 function place(index){
  if(done)return;
  if(index!==correct){feedback('再试一次，看看前后两张牌。',1300);return;}
  done=true;stop();timer.textContent='放对了！';slots[correct]?.classList.remove('answer-pulse');
  tile.style.visibility='hidden';
  const selected=slots[index];const image=tile.querySelector('img').cloneNode();selected.append(image);selected.classList.add('placed');
  tray.classList.add('has-placed');showContinue();
 }
 slots.forEach((node,index)=>action(node,()=>place(index),'放入第 '+(index+1)+' 个空位'));
 if(!tile)return;
 tile.classList.add('drag-tile');let start;
 tile.onpointerdown=e=>{if(done||e.button!==0)return;start=e;tile.setPointerCapture(e.pointerId);};
 tile.onpointermove=e=>{if(start)tile.style.translate=(e.clientX-start.clientX)/scale+'px '+(e.clientY-start.clientY)/scale+'px';};
 tile.onpointercancel=()=>{start=null;tile.style.translate='';};
 tile.onpointerup=e=>{
  if(!start)return;start=null;tile.style.translate='';
  const closest=slots.map((n,i)=>{const b=n.getBoundingClientRect();return {i,x:Math.abs(b.x+b.width/2-e.clientX),y:Math.abs(b.y+b.height/2-e.clientY)};}).sort((a,b)=>a.x-b.x)[0];
  if(closest&&closest.x<65*scale&&closest.y<100*scale)place(closest.i);
 };
}
function memory(round){
 render(memories[round]);back('memory');
 const row=named('label-wrapper');row?.classList.add('memory-label');
 const tiles=all('[data-name="cards-row"] [data-name^="tile-"]');
 const winning=[0,1,2][round]%Math.max(1,tiles.length);
 const source=tiles[winning];
 const label=source?.dataset.name.replace('tile-','').replace(/^红$/,'红中').replace(/^七$/,'七万').replace(/^三$/,'三条')??'红中';
 if(row?.querySelector('p'))row.querySelector('p').textContent='请记住【'+label+'】的位置';
 questionAudio('请记住'+label+'放在哪里。');
 memoryClock(question);
 toolbar([['开始答题',question]]).classList.add('round-nav');
 function question(){
  render(choices[round]);back('memory');
  questionAudio('刚才哪张牌是'+label+'？请点一下你记得的位置。');
  const badge=named('round-badge')?.querySelector('p');if(badge)badge.textContent='第 '+(round+1)+' / 3 局';
  const wrapper=named('label-wrapper');wrapper?.classList.add('memory-label');
  const title=wrapper?.querySelector('p');if(title)title.textContent='刚刚哪张牌是【'+label+'】？请点击';
  const rack=named('cards-row');let backs=all('[data-name="tile-back"]');
  while(rack&&backs.length&&backs.length<tiles.length){const clone=backs[0].cloneNode(true);clone.removeAttribute('data-node-id');rack.append(clone);backs.push(clone);}
  while(backs.length>tiles.length)backs.pop().remove();
  const bar=roundNav(round,memory,false,()=>completeGame('memory'));
  const advance=bar.lastChild;if(round===2)advance.textContent='完成训练';
  let locked=false;
  const hint=()=>backs[winning]?.classList.add('answer-pulse');
  const endClock=memoryClock(()=>{hint();advance.disabled=false;feedback('时间到，可以翻开提示牌。',1800);});
  backs.forEach((n,i)=>{
   const photo=tiles[i]?.querySelector('img');if(photo){
    const front=photo.cloneNode();front.className='memory-front';n.append(front);
   }
   n.classList.add('memory-tile');
   action(n,()=>{
    if(locked||n.classList.contains('flipped'))return;
    n.classList.add('flipped');
    if(i!==winning){feedback('再回想一下。',850);time(()=>n.classList.remove('flipped'),800);return;}
    locked=true;endClock();n.classList.remove('answer-pulse');n.classList.add('selected-orange');feedback('找对了！');advance.disabled=false;
   },'翻开第 '+(i+1)+' 张牌');
  });
  textAction('忘记了，提示一下',hint);
  function pulse(left){if(left<=2&&!locked)hint();}
  stage.addEventListener('memory-tick',e=>pulse(e.detail),{signal:questionSignal()});
 }
}
let memoryListener;
function questionSignal(){
 memoryListener?.abort();memoryListener=new AbortController();return memoryListener.signal;
}
function memoryClock(expired){
 const label=q('[data-name="timer-container"] p'),fill=named('bar-fill');
 return roundTimer(10,left=>{
  if(label)label.textContent='倒计时：'+left+' 秒';
  if(fill){fill.style.width=left*10+'%';fill.style.transition='width .28s ease';}
  stage.dispatchEvent(new CustomEvent('memory-tick',{detail:left}));
 },expired);
}
function find(round){
 render(finds[round]);back('find');
 const tiles=[...named('glowing-deck').querySelectorAll('[data-name^="tile-"]')];
 const correct=tiles.filter(n=>n.dataset.name.includes('-selected'));
 const target=correct[0]?.dataset.name.split('-')[1];
 questionAudio(target?'请找出所有的'+target+'。':'请找出所有和示例一样的麻将牌。');
 const progress=named('target-text-group')?.querySelector('p:last-child')??all('p').find(x=>x.textContent.includes('已选'));
 let count=0,finished=false;
 const update=()=>{const p=all('p').find(x=>x.textContent.includes('已选'))??progress;if(p)p.textContent='共 '+correct.length+' 张 · 已选 '+count+' 张';};
 named('confirm-action-button')?.remove();
 tiles.forEach(n=>{
  n.style.borderColor='#ebe6d8';
  n.querySelectorAll('[data-name*="checkmark"]').forEach(x=>x.hidden=true);
  n.classList.add('find-tile');n.setAttribute('aria-pressed','false');
  action(n,()=>{
   if(finished||n.classList.contains('selected-orange'))return;
   if(!correct.includes(n)){n.animate([{scale:1},{scale:.95},{scale:1}],{duration:230});return feedback('再找找和示例一样的牌。',900);}
   n.classList.add('selected-orange');n.style.borderColor='#ef905d';n.setAttribute('aria-pressed','true');
   n.querySelectorAll('[data-name*="checkmark"]').forEach(x=>x.hidden=false);
   count++;update();
   if(count===correct.length){finished=true;feedback('全部找到了！');time(()=>round<2?find(round+1):completeGame('find'),470);}
  },n.dataset.name.split('-')[1]+'麻将牌');
 });
 const hint=toolbar([['提示一下',()=>{const remaining=correct.filter(n=>!n.classList.contains('selected-orange'));remaining.forEach(n=>n.classList.add('answer-pulse'));time(()=>remaining.forEach(n=>n.classList.remove('answer-pulse')),1350);}]]);hint.classList.add('find-hint');hint.firstChild.prepend(bulb());update();
}
function speed(round){
 render(speeds[0]);back('speed');stage.classList.add('speed-game');questionAudio('请找出发财牌，看到一张就点一下。');let score=0,busy=false,ended=false,layout=0,lastClick=performance.now();
 const points=named('score-badge')?.querySelector('p');
 const timer=named('timer-container')?.querySelector('p');
 const fill=named('bar-fill');
 timer?.classList.add('speed-seconds');
 const badge=named('round-badge')?.querySelector('p');if(badge)badge.textContent='第 1 / 1 局';
 const tiles=all('[data-name^="tile-container-"]');
 const board=named('game-canvas');
 const tilesOnBoard=tiles.map(tile=>{
  const button=document.createElement('button');
  button.type='button';button.className='speed-tile';
  button.dataset.name=tile.dataset.name;
  button.append(...tile.children);
  tile.replaceWith(button);
  return button;
 });
 board.classList.add('speed-board');
 tiles.splice(0,tiles.length,...tilesOnBoard);
 const selectors=tiles.map(n=>n.querySelector('[data-name^="tile-body-"]').outerHTML);
 const titles=tiles.map(n=>n.dataset.name.split('-').at(-1));
 const special=tiles.findIndex(n=>n.dataset.name.includes('发财'));
 const positions=[0,1,2,3];
 const order=[0,1,3,2,1,0,2,3];
 const banner=named('instruction-banner');if(banner){banner.classList.add('speed-instructions');banner.replaceChildren(document.createTextNode('点中【发财】 +1 分\n误点其他牌 −1 分'));}
 tiles.forEach(n=>n.querySelector('[data-name="glow"]')?.remove());
 function redraw(){
  tiles.forEach((n,index)=>{
   const source=positions[index];const t=document.createElement('template');t.innerHTML=selectors[source];
   n.querySelector('[data-name^="tile-body-"]').replaceWith(t.content);n.querySelector('[data-name="label-badge"] p').textContent=titles[source];
   n.setAttribute('aria-label',titles[source]);
  });
 }
 function complete(){
  ended=true;completeGame('speed');const p=q('.completion-sub');if(p)p.textContent='本局得分 '+score+' 分。返回训练中心继续练习。';
 }
 let timerAnimation;
 if(fill){
  fill.style.width='100%';
  fill.style.transformOrigin='left center';
  timerAnimation=fill.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:60000,fill:'forwards'});
 }
 let hintUntil=0;
 roundTimer(60,left=>{
  if(timer)timer.textContent=left+' 秒';
  const inactive=performance.now()-lastClick>=10000;
  tiles.forEach((n,index)=>n.classList.toggle('answer-pulse',(inactive||performance.now()<hintUntil)&&positions[index]===special));
 },complete,timerAnimation);
 const update=()=>{if(points)points.textContent=score+' 分';const header=all('p').find(p=>p.textContent.includes('当前得分'));if(header)header.textContent='当前得分：'+score;};
 tiles.forEach((n,index)=>action(n,()=>{
  if(ended||busy)return;
  lastClick=performance.now();hintUntil=0;tiles.forEach(x=>x.classList.remove('answer-pulse'));
  if(positions[index]!==special){score--;update();n.animate([{scale:1},{scale:.93},{scale:1}],{duration:260});return;}
  score++;update();busy=true;n.classList.add('speed-hit');feedback('+1 分',300);
  time(()=>{
   n.classList.remove('speed-hit');busy=false;if(ended)return;
   const j=order[layout++%order.length];const k=j===index?(index+2)%tiles.length:j;
   [positions[index],positions[k]]=[positions[k],positions[index]];
   tiles.forEach(x=>x.classList.remove('answer-pulse'));redraw();
   named('game-canvas')?.animate([{opacity:.65},{opacity:1}],{duration:250});
  },300);
 },titles[index]));
 action(named('hint-button'),()=>{const n=tiles[positions.indexOf(special)];hintUntil=performance.now()+1500;n?.classList.add('answer-pulse');},'提醒一下');
}
function bulb(){
 const img=document.createElement('img');img.src='assets/idea.svg';img.alt='';return img;
}
function addCanvas(parent,area,onPoint){
 const canvas=document.createElement('canvas');
 canvas.width=area.width*2;canvas.height=area.height*2;canvas.setAttribute('aria-label','手指描画区');
 Object.assign(canvas.style,{position:'absolute',left:area.left+'px',top:area.top+'px',width:area.width+'px',height:area.height+'px',zIndex:6});
 parent.append(canvas);
 const context=canvas.getContext('2d');context.scale(2,2);context.lineWidth=7;context.lineCap='round';context.lineJoin='round';context.strokeStyle='#b66642';
 let last=null;
 const read=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*area.width/r.width,(e.clientY-r.top)*area.height/r.height];};
 function move(e,start=false){
  const p=read(e);if(start)last=p;if(!last)return;
  context.beginPath();context.moveTo(...last);context.lineTo(...p);context.stroke();onPoint(p,last);last=p;
 }
 canvas.onpointerdown=e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);move(e,true);};
 canvas.onpointermove=e=>{if(last)for(const sample of e.getCoalescedEvents?.()?.length?e.getCoalescedEvents():[e])move(sample);};
 canvas.onpointerup=e=>{move(e);last=null;};canvas.onpointercancel=()=>{last=null;};
 return canvas;
}
function trace(round,results=[]){
 render(traces[round][0]);back('trace');stage.classList.add('trace-game');
 const guide=named('描画路线、描过的笔迹与起点')?.querySelector('img');
 const segments=[];
 named('描画操作')?.remove();
 named('重描')?.remove();
 named('原型描画手势区域')?.remove();
 const canvas=addCanvas(stage,{left:515,top:317,width:336,height:405},(end,start)=>segments.push([start,end]));
 const ctx=canvas.getContext('2d');
 const bar=toolbar([['重新描画',()=>{segments.length=0;ctx.clearRect(0,0,336,405);}],['提交本题',submit,true]]);
 bar.classList.add('trace-actions');
 const labels=['一筒','二条','红中'];
 questionAudio('请用手指沿着线条描出'+labels[round]+'。');
 const sampleGuide=async()=>{
  if(!guide)return [];
  const response=await fetch(guide.src);
  if(!response.ok)throw Error('guide');
  const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
  const box=svg.getAttribute('viewBox').split(/\s+/).map(Number);
  svg.style.cssText='position:absolute;visibility:hidden;pointer-events:none';
  stage.append(svg);
  const samples=[];
  try{
   for(const path of svg.querySelectorAll('path[stroke]')){
    const length=path.getTotalLength();
    if(path.getAttribute('fill')!=='none'&&path.hasAttribute('fill')||length<15)continue;
    const count=Math.ceil(length/3);
    for(let i=0;i<=count;i++){
     const point=path.getPointAtLength(length*i/count);
     samples.push([(point.x-box[0])*336/box[2],7+(point.y-box[1])*383/box[3]]);
    }
   }
  }finally{svg.remove();}
  return samples;
 };
 const samplePromise=sampleGuide().catch(()=>[]);
 async function submit(){
  const submitButton=bar.lastChild;
  if(!segments.length){feedback('请先在牌面上画几笔。',1700);return;}
  bar.querySelectorAll('button').forEach(button=>button.disabled=true);
  const drawing=segments.slice();
  const samples=await samplePromise;
  if(!submitButton.isConnected)return;
  const distance=(p,a,b)=>{
   const dx=b[0]-a[0],dy=b[1]-a[1];
   const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
   return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
  };
  const coverage=samples.length?samples.filter(p=>drawing.some(([a,b])=>distance(p,a,b)<=22)).length/samples.length:0;
  const marks=drawing.filter(([a,b])=>Math.hypot(a[0]-b[0],a[1]-b[1])>.5);
  const precision=marks.length?marks.filter(([,p])=>samples.some(a=>Math.hypot(p[0]-a[0],p[1]-a[1])<=30)).length/marks.length:0;
  results.push(samples.length?Math.min(100,Math.round(100*(coverage*.8+precision*.2))):null);
  if(round<traces.length-1){trace(round+1,results);return;}
  completeGame('trace');
  const cards=document.createElement('div');cards.className='trace-scores';
  results.forEach((score,i)=>{
   const result=document.createElement('p');
   result.textContent=labels[i]+'  '+(score===null?'暂未评分':score+' 分');
   cards.append(result);
  });
  const summary=q('.completion-sub');summary.textContent='本次描画得分';
  summary.after(cards);
 }
}
function rotate(round){
 const frames=turns[round];const start=[1,2,3][round];
 render(frames[start]);back('rotate');stage.classList.add('rotate-game');
 questionAudio('请看右边的示例牌，把有图案的一面转向自己，再把牌立正。');
 const initial=named('立体麻将牌 / 牌面、侧边与牌背');
 const src=named('右侧原始麻将素材')?.querySelector('img')?.getAttribute('src');
 let matrix=Array(start).fill('right').reduce(turnTile,identity()), solved=false,active=false;
 const status=all('p').find(n=>/^(侧边|牌背|正面)朝前$/.test(n.textContent.trim()));
 status?.classList.add('rotation-status');
 const description=all('p').find(n=>n.textContent.includes('每次向左或向右转动一面'));
 if(description){description.classList.add('rotation-status');description.textContent='滑动牌面或点按方向，每次转动 90°';}
 const space=document.createElement('div');space.className='cube-space';space.hidden=false;
 const cube=document.createElement('div');cube.className='cube-body';
 const [w,h,d]=[219,292,89];
 const faces=[['front',w,h,'translateZ('+d/2+'px)'],['back',w,h,'rotateY(180deg) translateZ('+d/2+'px)'],['right',d,h,'rotateY(90deg) translateZ('+w/2+'px)'],['left',d,h,'rotateY(-90deg) translateZ('+w/2+'px)'],['top',w,d,'rotateX(90deg) translateZ('+h/2+'px)'],['bottom',w,d,'rotateX(-90deg) translateZ('+h/2+'px)']];
 for(const [face,width,height,transform] of faces){
  const div=document.createElement('div');div.className='cube-face cube-'+face;
  Object.assign(div.style,{width:width+'px',height:height+'px',transform:'translate(-50%,-50%) '+transform});
  if(face==='front'&&src){const im=document.createElement('img');im.src=src;im.alt='麻将牌正面';div.append(im);}
  cube.append(div);
 }
 cube.style.transform=cssMatrix(matrix);initial?.remove();
 const camera=document.createElement('div');camera.className='cube-camera';camera.append(cube);space.append(camera);stage.append(space);
 const zone=document.createElement('div');zone.className='tile-turn-zone';zone.style.cssText='position:absolute;left:469px;top:323px;width:428px;height:390px;z-index:5';stage.append(zone);
 let drag;
 zone.onpointerdown=e=>{drag=[e.clientX,e.clientY];zone.setPointerCapture(e.pointerId);};
 zone.onpointercancel=()=>{drag=null;};
 zone.onpointerup=e=>{if(!drag)return;const x=e.clientX-drag[0],y=e.clientY-drag[1];drag=null;if(Math.hypot(x,y)>24*scale)turn(Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up'));};
 named('向左转 90 度')?.remove();named('向右转 90 度')?.remove();
 const directions=[['left','向左转'],['up','向上转'],['down','向下转'],['right','向右转']];
 const controls=toolbar(directions.map(([dir,label])=>[label,()=>turn(dir)]));controls.classList.add('turn-controls');
 directions.forEach(([dir,label],i)=>{
  const icon=document.createElement('span');icon.className='direction-icon';
  icon.setAttribute('aria-hidden','true');icon.textContent=({left:'←',up:'↑',down:'↓',right:'→'})[dir];
  controls.children[i].prepend(icon);
 });
 const help=toolbar([['提示一下',()=>{
  const index=directions.findIndex(([dir])=>dir===nextTileTurn(matrix));
  if(index<0)return;
  controls.children[index].classList.add('answer-pulse');
  if(status)status.textContent='试试'+directions[index][1]+'一次';
  time(()=>controls.children[index]?.classList.remove('answer-pulse'),1700);
 }]]);
 help.classList.add('rotate-hint');help.firstChild.prepend(bulb());
 function turn(direction){
  if(active||solved)return;
  active=true;
  const previous=matrix;matrix=turnTile(matrix,direction);
  cube.style.transform=cssMatrix(matrix);
  const axis=(direction==='left'||direction==='right')?'Y':'X';
  const angle=({left:-90,right:90,up:90,down:-90})[direction];
  const animation=cube.animate([{transform:'rotate'+axis+'(0deg) '+cssMatrix(previous)},{transform:'rotate'+axis+'('+angle+'deg) '+cssMatrix(previous)}],{duration:270,easing:'ease-out'});
  animation.onfinish=()=>{active=false;
   if(!cube.isConnected)return;
   if(status)status.textContent=tileFace(matrix);
   if(tileUpright(matrix)){
   solved=true;
   camera.classList.add('face-aligned');
   if(description)description.hidden=true;
   feedback('转正了！');controls.remove();help.remove();toolbar([[round<2?'下一题':'完成',()=>finish(round<2?()=>rotate(round+1):null,'rotate'),true]]);
  }};
 }
}
go(location.hash==='#invite'?'invite':'home');

initLocalization();
