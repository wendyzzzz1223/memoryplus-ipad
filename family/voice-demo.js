'use strict';

// Portfolio simulation: no microphone access, audio upload or voice cloning.
let voiceDemoSession = null;
const voiceDemoSample = '爸，今天也记得做一会儿练习。慢慢来，我一直陪着您。';
const voiceDemoMic = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="17" y="6" width="14" height="25" rx="7"/><path d="M11 23v2a13 13 0 0 0 26 0v-2M24 38v6M17 44h14"/></svg>';

function decorateVoiceDemo() {
  const content = nd(7747);
  if (!content) return;
  content.classList.add('voice-settings');
  content.innerHTML = '<section class="voice-intro"><h2>让问候多一份熟悉</h2><p>为长辈选一种声音，用于问候和日常提醒。</p><span class="voice-demo-label">模拟演示 · 无需麦克风</span></section>' +
    voiceNames.map((name, i) => {
      const ready = !!state.voiceDemos?.[i]?.ready;
      const active = state.voice === name;
      return `<section class="voice-choice ${active ? 'is-selected' : ''}"><div class="voice-choice-heading"><span class="voice-small-icon">${voiceDemoMic}</span><h2>${esc(name)}</h2>${active ? '<span class="voice-status">使用中</span>' : ''}</div><p>${i < 2 ? (ready ? '模拟学习已完成，可以试听或重新录制。' : '录一段问候，再体验 AI 学习声音的过程。') : (i === 2 ? '普通话，温柔亲切' : '普通话，沉稳自然')}</p><div class="voice-choice-actions">${i < 2 ? `<button type="button" class="button ${ready ? 'secondary' : ''}" data-voice-demo="record-${i}">${ready ? '重新录制' : '模拟录制声音'}</button>${ready ? `<button type="button" class="button secondary" data-voice-demo="preview-${i}">试听示例</button>` : ''}` : `<button type="button" class="button secondary" data-voice-demo="preview-${i}">播放试听</button>`}${(ready || i > 1) && !active ? `<button type="button" class="button" data-voice-demo="use-${i}">设为使用声音</button>` : ''}</div></section>`;
    }).join('');
}

function voiceDemoPreview(i) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    toast('当前设备不支持语音试听，可以继续体验设置流程。');
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(voiceDemoSample);
  utterance.lang = 'zh-CN'; utterance.rate = .88; utterance.pitch = i === 1 || i === 3 ? .85 : 1.05;
  utterance.onerror = event => {if (!['canceled', 'interrupted'].includes(event.error)) toast('当前设备没有可用的中文语音。');};
  speechSynthesis.speak(utterance);
  toast(i < 2 ? '正在播放系统语音示例，并非录制或复刻的声音。' : '正在播放系统语音示例。');
}

function stopVoiceDemo() {
  if (!voiceDemoSession) return;
  clearInterval(voiceDemoSession.timer);
  voiceDemoSession = null;
  dialog.classList.remove('voice-demo-dialog');
  dialog.removeAttribute('aria-labelledby');
  if (window.speechSynthesis) speechSynthesis.cancel();
}

function startVoiceDemo(i) {
  if (i !== 0 && i !== 1) return;
  if (dialog.open) dialog.close();
  stopVoiceDemo();
  voiceDemoSession = {index:i, phase:'ready', elapsed:0, progress:0, duration:12};
  dialog.classList.add('voice-demo-dialog');
  dialog.setAttribute('aria-labelledby', 'voice-demo-title');
  paintVoiceDemo();
  dialog.showModal();
}

function paintVoiceDemo() {
  const s = voiceDemoSession;
  if (!s) return;
  const phase = s.phase;
  const step = phase === 'success' ? 2 : phase === 'learning' ? 1 : 0;
  const titles = {ready:'录一段熟悉的问候', recording:'正在模拟录音', review:'这一段录好了', learning:'AI 正在学习声音', success:'声音设置成功', error:'暂时无法保存'};
  const details = {ready:'轻点开始，体验一次录音。',recording:'照着下面的话，轻轻说一遍。',review:'准备好了，让 AI 学习声音的特点。',learning:'正在模拟学习音色、语速和说话习惯。',success:`已选用${voiceNames[s.index]}，用于问候和日常提醒。`,error:'本机空间不足或存储不可用，请重试。'};
  const visual = phase === 'success' ? '<div class="voice-success-mark" aria-hidden="true">✓</div>' : `<div class="voice-mic-orbit ${phase === 'recording' || phase === 'learning' ? 'is-live' : ''}">${voiceDemoMic}</div>`;
  const waveform = `<div class="voice-wave ${phase === 'recording' ? 'is-live' : ''}" aria-hidden="true">${Array.from({length:23},(_,i)=>`<span style="--bar:${[12,22,35,19,43,28,51][i%7]}px;--delay:${i*.07}s"></span>`).join('')}</div>`;
  const timer = phase === 'recording' || phase === 'review' ? `<div class="voice-clock" aria-label="录音时长"><span data-voice-time>00:${String(s.elapsed).padStart(2,'0')}</span><small> / 00:12</small></div>` : '';
  const progress = phase === 'learning' ? '<div class="voice-learning-progress"><div class="voice-progress-track" role="progressbar" aria-label="模拟 AI 学习进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><div class="voice-progress-caption"><span data-voice-learning-label>正在分析声音特点</span><strong data-voice-percent>0%</strong></div></div>' : '';
  const sample = ['ready','recording','review'].includes(phase) ? `<blockquote>${esc(voiceDemoSample)}</blockquote>${waveform}${timer}` : '';
  const actions = {ready:'<button class="button wide" data-voice-demo="start">开始模拟录音</button>',recording:'<button class="button wide" data-voice-demo="stop">结束录音</button>',review:'<button class="button wide" data-voice-demo="learn">开始 AI 学习</button><button class="button secondary wide" data-voice-demo="restart">重新录制</button>',learning:'',success:'<button class="button wide" data-voice-demo="preview-current">试听示例</button><button class="button secondary wide" data-voice-demo="done">完成</button>',error:'<button class="button wide" data-voice-demo="retry-save">重新保存</button>'};
  dialog.innerHTML = `<div class="voice-dialog-heading"><span class="voice-demo-label">模拟演示</span><button class="voice-dismiss" data-voice-demo="close" aria-label="关闭语音设置">×</button></div><ol class="voice-stepper" aria-label="声音设置流程">${['录音','AI 学习','完成'].map((label,i)=>`<li class="${i<=step?'is-current':''}" ${i===step?'aria-current="step"':''}><span>${i<step?'✓':i+1}</span>${label}</li>`).join('')}</ol>${visual}<h2 id="voice-demo-title" tabindex="-1">${titles[phase]}</h2><p class="voice-dialog-detail" role="status">${esc(details[phase])}</p>${sample}${progress}${actions[phase]}<p class="voice-demo-footnote">这是交互演示，不会录制或上传声音。试听为系统语音示例，未接入真实 AI 声音复刻。</p>`;
  dialog.querySelector('[data-voice-demo="start"], [data-voice-demo="learn"], [data-voice-demo="done"], #voice-demo-title')?.focus({preventScroll:true});
}

function beginVoiceDemoRecording() {
  const s = voiceDemoSession;
  if (!s) return;
  clearInterval(s.timer);
  s.phase = 'recording'; s.elapsed = 0;
  paintVoiceDemo();
  s.timer = setInterval(() => {
    if (voiceDemoSession !== s) return;
    s.elapsed++;
    const time = dialog.querySelector('[data-voice-time]');
    if (time) time.textContent = '00:' + String(s.elapsed).padStart(2,'0');
    if (s.elapsed >= s.duration) finishVoiceDemoRecording();
  }, 1000);
}

function finishVoiceDemoRecording() {
  const s = voiceDemoSession;
  if (!s || s.phase !== 'recording') return;
  clearInterval(s.timer); s.phase = 'review'; paintVoiceDemo();
}

function beginVoiceDemoLearning() {
  const s = voiceDemoSession;
  if (!s || s.phase !== 'review') return;
  clearInterval(s.timer); s.phase = 'learning'; s.progress = 0; paintVoiceDemo();
  s.timer = setInterval(() => {
    if (voiceDemoSession !== s) return;
    s.progress = Math.min(100, s.progress + 4);
    const track = dialog.querySelector('[role="progressbar"]');
    track.setAttribute('aria-valuenow', String(s.progress));
    track.firstElementChild.style.width = s.progress + '%';
    dialog.querySelector('[data-voice-percent]').textContent = s.progress + '%';
    dialog.querySelector('[data-voice-learning-label]').textContent = s.progress < 36 ? '正在分析声音特点' : s.progress < 72 ? '正在学习语速和语调' : '正在准备问候和提醒';
    if (s.progress === 100) {clearInterval(s.timer);completeVoiceDemo();}
  }, 240);
}

function completeVoiceDemo() {
  const s = voiceDemoSession;
  if (!s) return;
  const ready = {ready:true, simulated:true, duration:s.elapsed, savedAt:new Date().toISOString()};
  if (save({voice:voiceNames[s.index], voiceDemos:{...state.voiceDemos,[s.index]:ready}})) {
    s.phase = 'success';
    if (pathname() === 'voice') render(false);
  } else s.phase = 'error';
  paintVoiceDemo();
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-voice-demo]');
  if (!target) return;
  event.preventDefault();
  const action = target.dataset.voiceDemo;
  if (action.startsWith('record-')) return startVoiceDemo(Number(action.slice(7)));
  if (action.startsWith('preview-') && action !== 'preview-current') return voiceDemoPreview(Number(action.slice(8)));
  if (action.startsWith('use-')) {
    const i = Number(action.slice(4));
    if (i < 2 && !state.voiceDemos?.[i]?.ready) return;
    if (save({voice:voiceNames[i]})) {render(false);toast('使用声音已更新');}
    return;
  }
  if (action === 'close' || action === 'done') {dialog.close();return;}
  if (action === 'start' || action === 'restart') return beginVoiceDemoRecording();
  if (action === 'stop') return finishVoiceDemoRecording();
  if (action === 'learn') return beginVoiceDemoLearning();
  if (action === 'retry-save') return completeVoiceDemo();
  if (action === 'preview-current' && voiceDemoSession) voiceDemoPreview(voiceDemoSession.index);
});
document.addEventListener('DOMContentLoaded', () => dialog.addEventListener('close', stopVoiceDemo), {once:true});
window.addEventListener('hashchange', () => {if (voiceDemoSession) {dialog.close();stopVoiceDemo();}});
