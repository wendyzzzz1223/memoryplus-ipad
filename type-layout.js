import {createLanguageSwitch} from './i18n.js?v=5-5';
export function setTypeScale(stage, size) {
 const factor = {标准: .91, 大号: 1, 特大号: 1.09}[size] ?? 1;
 stage.dataset.font = size;
 stage.style.setProperty('--type-scale', factor);
 const text = [...stage.querySelectorAll('p, span, h1, h2, h3, label, li, small, strong, button')].filter(node =>
  !node.closest('.type-settings') &&
  [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()));
 // Read the original sizes together before applying any sizes, so nested text is never scaled twice.
 const original = text.map(node => {
  node.style.removeProperty('font-size');
  return node;
 });
 const metrics = original.map(node => [node, parseFloat(getComputedStyle(node).fontSize)]);
 for (const [node, size] of metrics) node.style.fontSize = size * factor + 'px';
}
export function showTypeSettings(stage, preferences, updateSize, speak, back) {
 const logo = stage.querySelector('[data-name="阿尔兹PPT 1"] img')?.getAttribute('src');
 stage.innerHTML = '<main class="type-settings"><header><div class="settings-logo"></div><button type="button" class="settings-back">← 返回</button></header><h1>显示与辅助设置</h1><section><h2>字体大小调节</h2><div class="type-choices" role="group" aria-label="字体大小"></div><p class="type-sample">这是为您精心设计的字体大小。我们希望每一个字都能让您看得清清楚楚，读起来舒舒服服。</p></section><section><h2>语音朗读助手</h2><div class="speech-settings"></div><button type="button" class="speech-test">试听一下效果</button></section><section><h2>健康报告共享</h2><label class="share-demo"><input type="checkbox"><span>向家人展示报告的演示设置</span></label></section><footer><button type="button" class="settings-confirm">这个大小看得清</button></footer></main>';
 const page = stage.firstElementChild;
 if (logo) {
  const image = new Image();
  image.src = logo;
  image.alt = '忆家';
  page.querySelector('.settings-logo').append(image);
 }
 const languageSection=document.createElement('section');languageSection.className='language-setting';
 languageSection.innerHTML='<div><h2>设置语言</h2><p>选择界面与播报的语言。</p><p>所有页面会使用所选语言，下次打开时保留。</p></div>';
 languageSection.append(createLanguageSwitch('settings'));page.querySelector('h1').after(languageSection);
 const choices = page.querySelector('.type-choices');
 for (const size of ['标准', '大号', '特大号']) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = size;
  button.setAttribute('aria-pressed', String(size === preferences.font));
  button.onclick = () => {
   preferences.font = size;
   localStorage.setItem('yijia-font', size);
   updateSize();
   for (const choice of choices.children) choice.setAttribute('aria-pressed', String(choice === button));
  };
  choices.append(button);
 }
 const fields = page.querySelector('.speech-settings');
 for (const [key, title, start, end, min, max] of [
  ['rate', '语速调节', '慢', '快', .55, 1.25],
  ['volume', '音量大小', '小', '大', 0, 1]
 ]) {
  const field = document.createElement('label');
  field.innerHTML = '<strong>'+title+'</strong><input class="speech-range" type="range"><span class="range-ends"><span>'+start+'</span><span>'+end+'</span></span>';
  const input = field.querySelector('input');
  Object.assign(input,{min,max,step:.05,value:preferences[key]});
  input.setAttribute('aria-label', title);
  const paint = () => input.style.setProperty('--range', (input.value-min)/(max-min)*100+'%');
  input.oninput = () => {
   preferences[key] = Number(input.value);
   localStorage.setItem('yijia-'+key, input.value);
   paint();
  };
  paint();
  fields.append(field);
 }
 const share=page.querySelector('.share-demo input');
 share.checked=localStorage.getItem('yijia-share-demo')==='true';
 share.onchange=()=>localStorage.setItem('yijia-share-demo',String(share.checked));
 page.querySelector('.settings-back').onclick = back;
 page.querySelector('.settings-confirm').onclick = back;
 page.querySelector('.speech-test').onclick = () => speak('您好，欢迎使用忆家。');
 return page;
}
