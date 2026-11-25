import english from './translations.en.js?v=granddaughter-5-4';
const STORAGE_KEY='memoryplus-language';
let language='zh';
try {language=localStorage.getItem(STORAGE_KEY)==='en'?'en':'zh';} catch {}
const originals=new WeakMap(), attributeOriginals=new WeakMap(), brandOriginals=new WeakMap();
const listeners=new Set();
export const getLanguage=()=>language;
export function translate(source){
 if(language!=='en'||typeof source!=='string')return source;
 const key=source.replace(/\s+/g,' ').trim();
 if(english[key])return source.replace(source.trim(),english[key]);
 const rules=[
  [/^第\s*(\d+)\s*\/\s*(\d+)\s*题$/,(_,a,b)=>`Question ${a} / ${b}`],
  [/^第\s*(\d+)\s*题$/,(_,a)=>`Question ${a}`],
  [/^(\d+)\s*位家人已上线$/,(_,n)=>`${n} family members online`],
  [/^(\d+)\s*分钟前发送$/,(_,n)=>`Sent ${n} minutes ago`],
  [/^(\d+)\s*天$/,(_,n)=>`${n} days`],
  [/^(\d+)\s*分钟$/,(_,n)=>`${n} minutes`],
  [/^当前得分[：:]?\s*(\d+)$/,(_,n)=>`Score: ${n}`],
  [/^得分[：:]?\s*(\d+)$/,(_,n)=>`Score: ${n}`],
  [/^已配对\s*(\d+)\s*\/\s*(\d+)$/,(_,n,m)=>`Matched ${n} / ${m}`],
  [/^已经到(.+)了。$/,(_,place)=>`You have arrived ${english[place]?'at '+english[place].toLowerCase():'at your destination'}.`],
  [/^从(.+)的人物旁开始，画出您想走的路线。$/,()=>`Start beside the person and draw your route.`],
  [/^(.+) · (已完成|待体验)$/,(_,title,state)=>`${english[title]||title} · ${english[state]}`]
 ];
 for(const [re,fn] of rules)if(re.test(key))return key.replace(re,fn);
 return source;
}
export function setLanguage(value){
 const next=value==='en'?'en':'zh';
 if(language===next)return;
 language=next;
 try{localStorage.setItem(STORAGE_KEY,language);}catch{}
 window.speechSynthesis?.cancel();
 applyLanguage();
 for(const listener of listeners)listener(language);
 window.dispatchEvent(new CustomEvent('memoryplus-languagechange',{detail:{language}}));
}
export function onLanguageChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function createLanguageSwitch(context='home'){
 const host=document.createElement('div');host.className='language-switch language-switch--'+context;
 host.dataset.noTranslate='';host.setAttribute('role','group');
 host.innerHTML='<svg class="language-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"/></svg><button type="button" class="language-label" data-language="zh" lang="zh-CN">中文</button><button type="button" class="language-track" role="switch"><span class="language-thumb"></span></button><button type="button" class="language-label" data-language="en" lang="en">English</button>';
 const control=host.querySelector('.language-track');
 const sync=()=>{host.dataset.language=language;host.setAttribute('aria-label',language==='en'?'Interface language':'界面语言');control.setAttribute('aria-checked',String(language==='en'));control.setAttribute('aria-label',language==='en'?'English on. Switch to Chinese.':'开启英文，切换界面语言');for(const b of host.querySelectorAll('[data-language]'))b.setAttribute('aria-pressed',String(b.dataset.language===language));};
 control.onclick=()=>setLanguage(language==='zh'?'en':'zh');
 host.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.language));
 let start=null,suppress=false;
 host.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY,id:e.pointerId};});
 host.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)){suppress=true;setLanguage(dx>0?'en':'zh');setTimeout(()=>suppress=false,350);e.preventDefault();}});
 host.addEventListener('pointercancel',()=>{start=null;});
 host.addEventListener('click',e=>{if(suppress){e.stopImmediatePropagation();e.preventDefault();suppress=false;}},true);
 host.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setLanguage(e.key==='ArrowRight'?'en':'zh');}});
 const listener=()=>{if(host.isConnected)sync();else listeners.delete(listener);};listeners.add(listener);sync();return host;
}
function localizeText(node){
 const parent=node.parentElement;
 if(!parent||parent.closest('script,style,svg,canvas,[data-no-translate]')||!node.nodeValue.trim())return;
 const old=originals.get(node),current=node.nodeValue;
 const source=old&&current===old.output?old.source:current;
 const weekday=language==='en'&&parent.closest('[data-node-id="113:5164"]')?({'一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat','日':'Sun'}[source.trim()]):null;
 const output=weekday||translate(source);
 originals.set(node,{source,output});if(output!==current)node.nodeValue=output;
}
function localizeAttributes(element){
 if(element.closest('[data-no-translate]'))return;
 let state=attributeOriginals.get(element);if(!state){state={};attributeOriginals.set(element,state);}
 for(const key of ['aria-label','title','placeholder','alt']){
  if(!element.hasAttribute(key))continue;
  const current=element.getAttribute(key),old=state[key];const source=old&&current===old.output?old.source:current;
  const output=translate(source);state[key]={source,output};if(current!==output)element.setAttribute(key,output);
 }
}
function localizeBrands(){
 document.querySelectorAll('[data-name="阿尔兹PPT 1"] img,.settings-logo img').forEach(img=>{
  if(!brandOriginals.has(img))brandOriginals.set(img,{src:img.getAttribute('src'),alt:img.getAttribute('alt')});
  const original=brandOriginals.get(img),src=language==='en'?new URL('./assets/memoryplus-logo-en.png',import.meta.url).href:original.src;
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  const alt=language==='en'?'Memory+':'忆家';if(img.alt!==alt)img.alt=alt;img.classList.toggle('localized-brand',language==='en');
 });
}
function processTree(root){
 if(root.nodeType===Node.TEXT_NODE){localizeText(root);return;}
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 localizeAttributes(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))localizeText(node);
 root.querySelectorAll('[aria-label],[title],[placeholder],img[alt]').forEach(localizeAttributes);
}
export function applyLanguage(){
 document.documentElement.lang=language==='en'?'en':'zh-CN';
 document.documentElement.dataset.language=language;
 document.title=language==='en'?'Memory+ · iPad 5.0':'忆家 · iPad 5.0';
 processTree(document.body);localizeBrands();
}
export function initLocalization(){
 applyLanguage();let queued=false;const pending=new Set();
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='childList')r.addedNodes.forEach(n=>pending.add(n));else pending.add(r.target);}if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;const nodes=[...pending];pending.clear();for(const n of nodes)if(n.isConnected)processTree(n);localizeBrands();});}});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
 window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)setLanguage(e.newValue);});return()=>observer.disconnect();
}
