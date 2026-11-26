import {getLanguage} from './i18n.js?v=5-5';
const byName=(root,name)=>root.querySelector('[data-name="'+name+'"]');
const byId=(root,id)=>root.querySelector('[data-node-id="'+id+'"]');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
export function decorate(stage){
 const report=stage.querySelector('[data-name^="周报趋势老年版"]');
 const summary=report&&byName(report,'Summary Pills');
 if(summary){
  const card=summary.parentElement;
  card.classList.add('trend-report-card');
  summary.classList.add('trend-summary-grid');
  const legends=[...card.querySelectorAll('[data-name^="Legend "]')];
  const group=legends[0]?.parentElement;
  group?.classList.add('trend-legend-grid');
  for(const legend of legends){
   const label=legend.nextElementSibling;
   if(label?.tagName==='P')legend.append(label);
   legend.classList.add('trend-legend-item');
  }
  const narrative=byId(report,'113:5059');
  narrative?.classList.add('trend-report-narrative');
  narrative?.parentElement.classList.add('trend-report-summary-card');
 }
 for(const module of stage.querySelectorAll('[data-name^="Section - Hero:"],[data-name^="Section - Family"]')){
  module.classList.add('tilt-module');
  module.onpointermove=e=>{
   if(e.pointerType!=='mouse'||!finePointer.matches||reduced.matches)return;
   const b=module.getBoundingClientRect();
   module.style.setProperty('--rx',(0.5-(e.clientY-b.top)/b.height)*7+'deg');
   module.style.setProperty('--ry',((e.clientX-b.left)/b.width-0.5)*7+'deg');
  };
  module.onpointerleave=()=>{module.style.removeProperty('--rx');module.style.removeProperty('--ry');};
 }
}

function modal(title,fill){
 const d=document.createElement('dialog');
 d.className='demo-dialog v2-dialog';
 const h=document.createElement('h2');h.textContent=title;d.append(h);fill(d);
 const close=document.createElement('button');close.textContent='关闭';close.onclick=()=>d.close();d.append(close);
 d.addEventListener('close',()=>d.remove(),{once:true});document.body.append(d);d.showModal();
}
export function familyActivity(speak){
 modal('家人动态',panel=>{
  panel.innerHTML+='<div class="activity"><strong>女儿涵涵</strong><p>上线提醒您吃药。</p></div><div class="activity"><strong>孙子小明</strong><p>给您发了一段语音。</p><button class="activity-play">播放语音</button></div>';
  panel.querySelector('.activity-play').onclick=()=>speak('爷爷，别忘记做今天的认知训练。我晚上回家给你打电话。');
 });
}
export function familyMatch(stage,back,action){
 const root=stage.firstElementChild;root.classList.add('figma-family-match');
 const copy=(zh,en)=>getLanguage()==='en'?en:zh;
 const photo=byName(stage,'photo-2020');
 const hotspots=[...photo.parentElement.children].filter(n=>n!==photo&&/^113:48(3[7-9]|4[0-2])$/.test(n.dataset.nodeId??''));
 hotspots.forEach(n=>n.classList.add('match-spot'));
 const roles=[...byName(stage,'col-roles').children];
 const mapping=[5,2,0,3,1,4];
 const result=document.createElement('p');
 result.className='match-status';result.setAttribute('role','status');
 result.textContent=copy('把称呼拖到照片里对应的空位。','Drag a family label to its matching space, or tap a space and then a label.');
 const backButton=document.createElement('button');backButton.className='match-back';backButton.textContent='← 返回客厅';backButton.onclick=back;
 root.append(backButton,result);
 let active=-1,matched=0;
 function match(slotIndex,roleIndex){
  const slot=hotspots[slotIndex],role=roles[roleIndex];
  if(!slot||!role||slot.dataset.matched||role.dataset.matched)return;
  if(mapping[slotIndex]!==roleIndex){result.textContent=copy('再看看，这位家人是谁？','Take another look. Which family member is this?');return;}
  slot.textContent=role.textContent.trim();slot.dataset.matched='true';role.dataset.matched='true';
  slot.classList.remove('focused-spot');active=-1;matched++;
  result.textContent=matched===6?copy('全家福配对完成！','Family photo match complete!'):copy('已配对 ','Matched ')+matched+' / 6';
 }
 hotspots.forEach((slot,i)=>action(slot,()=>{
  if(slot.dataset.matched)return;
  active=i;hotspots.forEach((h,j)=>h.classList.toggle('focused-spot',i===j));
 },'第 '+(i+1)+' 个空位'));
 roles.forEach((role,i)=>{
  action(role,()=>{
   if(role.dataset.matched)return;
   if(active<0){result.textContent=copy('把称呼拖到空位，或先点空位再选称呼。','Tap a space first, then choose a family label. You can also drag a label.');return;}
   match(active,i);
  },role.textContent.trim());
  role.classList.add('match-role');
  let drag;
  function clear(){
   drag?.ghost?.remove();
   hotspots.forEach(slot=>slot.classList.remove('drag-over'));
   drag=null;
  }
  role.onpointerdown=e=>{
   if(e.button!==0||role.dataset.matched)return;
   drag={x:e.clientX,y:e.clientY};
   role.setPointerCapture(e.pointerId);
  };
  const hit=e=>hotspots.findIndex(slot=>{
   const r=slot.getBoundingClientRect();
   return !slot.dataset.matched&&e.clientX>=r.left-8&&e.clientX<=r.right+8&&e.clientY>=r.top-8&&e.clientY<=r.bottom+8;
  });
  role.onpointermove=e=>{
   if(!drag)return;
   if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
   if(!drag.ghost){
    drag.ghost=document.createElement('div');
    drag.ghost.className='match-ghost';
    drag.ghost.textContent=role.textContent.trim();
    document.body.append(drag.ghost);
   }
   drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
   const target=hit(e);hotspots.forEach((slot,index)=>slot.classList.toggle('drag-over',index===target));
  };
  role.onpointerup=e=>{
   if(!drag?.ghost){clear();return;}
   const target=hit(e);clear();
   if(target>=0)match(target,i);
   else result.textContent='请把称呼放到照片里的空位。';
  };
  role.onpointercancel=clear;
  role.onlostpointercapture=clear;
 });

}
export function trendControls(stage,action){
 const series=[
  {legend:'Legend 4',tile:'Pill 2',line:'113:5019'},
  {legend:'Legend 3',tile:'Pill 3',line:'113:5018'},
  {legend:'Legend 2',tile:'Pill 1',line:'113:5017'},
  {legend:'Legend 1',tile:'Pill 4',line:'113:5016'}
 ].map(({legend,tile,line})=>[byName(stage,legend),byName(stage,tile),byId(stage,line)]);
 const summary=byName(stage,'Summary Pills');let selected=-1;
 if(!summary)return;
 function choose(index){
  const card=series[index][1];
  selected=selected===index?-1:index;
  summary.classList.toggle('focused-trend',selected>=0);
  series.forEach(([legend,tile,line],i)=>{
   const matches=i===selected;
   if(line){line.classList.add('trend-line');line.classList.toggle('muted-trend',selected>=0&&!matches);}
   if(legend){legend.classList.toggle('inactive-trend',selected>=0&&!matches);legend.setAttribute('aria-pressed',String(matches));}
   if(tile){tile.classList.toggle('trend-focus',matches);tile.hidden=selected>=0&&!matches;tile.setAttribute('aria-pressed',String(matches));}
  });
  if(!reduced.matches){
   summary.animate([{opacity:.48},{opacity:1}],{duration:240,easing:'ease-out'});
   if(selected>=0)card.animate([{scale:.98},{scale:1}],{duration:280,easing:'ease-out'});
  }
 }
 series.forEach(([legend,tile],i)=>{
  for(const n of [legend,tile])if(n){n.setAttribute('aria-pressed','false');action(n,()=>choose(i),n.textContent.trim());}
 });
}
