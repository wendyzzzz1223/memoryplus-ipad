'use strict';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const notice = document.querySelector('#notice');
const asset = (name) => 'assets/' + name;
const images = {
  logo: asset('6463-imgPpt2.png'), elder: asset('6777-imgAvatar.png'),
  daughter: asset('7384-imgRectangle.png'), group: asset('8167-imgPhoto2020.png'),
  portrait: asset('7951-imgPortraitImage.png')
};
const starter = {
  joined: false, name: '王雪', phone: '', elder: '王建国', age: 72, relation: '女儿', health: '',
  messages: [
    {by:'儿子', text:'今天记得吃药哦，多穿件衣服', time:'09:12'},
    {by:'女儿（我）', text:'爸，今天的认知训练还没做记得做哦！', time:'10:30'}
  ],
  meds: [
    {id:'bp', name:'降压药 - 依那普利', dose:1, unit:'片', frequency:'每天', times:['08:00','15:00'], alarm:true},
    {id:'as', name:'阿司匹林 - 肠溶片', dose:1, unit:'片', frequency:'每天', times:['08:00'], alarm:true},
    {id:'vd', name:'维生素D3', dose:2, unit:'粒', frequency:'每天', times:['12:00'], alarm:false}
  ],
  family: ['儿子','配偶','孙子'], photos: [], labels:['本人','老婆','女儿','女婿','儿子','儿媳妇','孙子'],
  alerts:true, share:true, font:'大', voice:'温柔女声', otherElders:[], activeElder:'primary'
};
const key = 'yijia-family-demo-v1';
let state = structuredClone(starter);
try { Object.assign(state, JSON.parse(localStorage.getItem(key) || '{}')); } catch {}
let mode = '验证码登录', invite = '', inviteCode = '', loginCode = '', recording, pendingPhoto = '', selectedPhoto = 0, editingMedicine = false;
let statusTimer;
const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
const pathname = () => location.hash.slice(1) || (state.joined ? 'home' : 'login');
const go = (page) => { if (pathname() === page) render(false); else location.hash = page; };
const id = () => globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random();
const toast = (message) => {
  notice.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { notice.textContent = ''; }, 3000);
};
function save(patch) {
  const next = {...state,...patch};
  try { localStorage.setItem(key, JSON.stringify(next)); state = next; return true; }
  catch { toast('本机空间不足，保存未完成'); return false; }
}
const img = (url, label='', cls='') => `<img class="${cls}" src="${esc(url)}" alt="${esc(label)}">`;
const icon = (name) => img(asset('6777-img'+name+'.svg'),'','ico');
const avatar = (who) => img(who==='elder' ? currentElder().avatar || images.elder : state.userAvatar || images.daughter,'','avatar');
const cmd = (label, action, style='link', extra='') => `<button type="button" class="${style}" data-action="${action}" ${extra}>${label}</button>`;
const cta = (label, page, css='button wide') => `<a class="${css}" href="#${page}">${label}</a>`;
const submit = (label) => `<button type="submit" class="button wide">${label}</button>`;
const block = (body, cls='') => `<section class="card ${cls}">${body}</section>`;
const header = (title, back) => `<header class="top">${back ? `<a class="back" href="#${back}" aria-label="返回">‹</a>` : '<span></span>'}<h1>${title}</h1><span></span></header>`;
const section = (label, symbol, end='') => `<div class="heading"><span class="iconbox">${icon(symbol)}</span><h2>${label}</h2>${end}</div>`;
const row = (label, page, symbol='User', tail='') => `<a class="menu" href="#${page}"><span class="iconbox">${icon(symbol)}</span><strong>${label}</strong><small>${tail}</small><span aria-hidden="true">›</span></a>`;
const field = (title, name, value='', attrs='') => `<label class="field">${title}<input name="${name}" value="${esc(value)}" ${attrs}></label>`;
const area = (title, name, value='', placeholder='') => `<label class="field">${title}<textarea name="${name}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
const checkbox = (label, name, checked) => `<label class="row"><input type="checkbox" name="${name}" ${checked?'checked':''}>${label}</label>`;
const pick = (title, name, options, value) => `<label class="field">${title}<select name="${name}">${options.map(o=>`<option ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
const choices = (title, name, options, value, type='radio') => `<fieldset><legend>${title}</legend><div class="choices">${options.map(o=>`<label><input type="${type}" name="${name}" value="${esc(o)}" ${(Array.isArray(value)?value.includes(o):value===o)?'checked':''}><span class="chip">${esc(o)}</span></label>`).join('')}</div></fieldset>`;
const form = (name, body) => `<form data-form="${name}">${body}</form>`;
const sample = '<p class="sample">作品集演示 · 使用示例数据</p>';
const tabs = [
  ['home','首页','Home'],['trend','变化','Activity'],['room','数字客厅','Tv1'],['me','我的','User']
];
const parents = {report:'trend', messages:'room', meds:'room', medicine:'room', album:'room', story:'room', portrait:'room', elders:'me', family:'me', voice:'me', settings:'me'};
const onboarding = ['login','profile','elder','relation','invite','waiting','success'];
const nav = (page) => `<nav class="tabbar" aria-label="主导航">${tabs.map(([route,label,symbol])=>`<a href="#${route}" ${(parents[page]||page)===route?'aria-current="page"':''}>${icon(symbol)}${label}</a>`).join('')}</nav>`;
const progress = (step) => `<div class="step" aria-label="进度 ${step} / 5">${Array.from({length:5},(_,i)=>`<span class="${i<step?'done':''}"></span>`).join('')}</div>`;
const roles = ['女儿','儿子','配偶','孙女','孙子','其他家属'];
const elderRoles = ['本人','老婆','丈夫','女儿','女婿','儿子','儿媳妇','孙子','孙女','其他家人'];
const currentElder = () => state.otherElders.find(e=>e.id===state.activeElder) ||
  {id:'primary',name:state.elder,age:state.age,health:state.health,avatar:state.elderAvatar,gender:state.elderGender};
const messages = () => state.activeElder==='primary' ? state.messages : (currentElder().messages || []);
const medicines = () => state.activeElder==='primary' ? state.meds : (currentElder().meds || []);
function saveElderList(prop, entries) {
  if (state.activeElder==='primary') return save({[prop]:entries});
  return save({otherElders:state.otherElders.map(e=>e.id===state.activeElder?{...e,[prop]:entries}:e)});
}
function openBox(title, body) {
  dialog.innerHTML = '<h2>'+title+'</h2>'+body+cmd('关闭','close','button secondary wide');
  if (!dialog.open) dialog.showModal();
}
function onboardingPage(page) {
  if (page==='login') return `<div class="hero">${img(images.logo,'忆家')}<h1>忆家 · 家人端</h1><p class="muted">守护长辈认知健康，爱不遗忘</p></div>
      <div class="choices">${['验证码登录','密码登录'].map((item,i)=>cmd(item,'mode-'+i,'chip',`aria-pressed="${mode===item}"`)).join('')}</div>
      ${form('login',field('手机号码','phone',state.phone,'inputmode="tel" autocomplete="tel" placeholder="请输入您的手机号" pattern="[0-9]{11}" required')+
        (mode==='验证码登录'?field('验证码','code','','inputmode="numeric" placeholder="请输入演示验证码" required')+cmd('获取验证码','code','chip'):field('演示密码','password','','type="password" autocomplete="off" minlength="6" required'))+
        '<div class="divider"></div>'+checkbox('我已阅读并同意演示说明','agree',false)+submit('进入忆家'))}
      ${cmd('微信快捷登录 · 演示','wechat','button secondary wide')}${cta('直接体验王建国家庭','home','button secondary wide')}${sample}`;
  if (page==='profile') return header('填写您的信息','login')+progress(1)+form('profile',block(`${field('上传您的头像','avatar','','type="file" accept="image/*"')}${field('您的姓名 / 昵称','name',state.name,'required maxlength="20"')}${choices('您的性别','gender',['男','女'],state.gender||'女')}${field('手机号码','phone',state.phone,'readonly')}`)+submit('下一步'));
  if (page==='elder') return header('添加老人信息','profile')+progress(2)+form('elder',block(field('上传长辈头像','avatar','','type="file" accept="image/*"')+field('长辈姓名','name',state.elder,'required maxlength="20"')+field('长辈年龄','age',state.age,'type="number" min="1" max="120" required')+choices('长辈性别','gender',['男','女'],state.elderGender||'男')+area('基础健康状况','health',state.health))+submit('下一步'));
  if (page==='relation') return header('选择与老人关系','elder')+progress(3)+block(form('relation',choices('您是老人的哪位家属？','relation',roles,state.relation)+submit('下一步')));
  if (page==='invite') return header('关联长辈端','relation')+progress(4)+block(`<div class="identity">${avatar('elder')}<div><h2>${esc(state.elder)}</h2><p class="muted">已成功创建长辈档案</p></div></div>`)+form('invite',block(choices('选择设备关联方式','invite',['微信快速邀请','生成六位邀请码'],invite||'生成六位邀请码')+'<p class="muted small">演示邀请只在当前浏览器执行。可在下一步模拟长辈确认。</p>')+submit('邀请老人加入'));
  if (page==='waiting') return header('等待绑定确认','invite')+progress(5)+block(`<h2>等待长辈确认中…</h2><p class="muted">演示邀请码</p><h1>${esc(inviteCode || '未生成')}</h1>${cmd('重新发送绑定邀请','resend','chip')}`)+cmd('模拟长辈接受邀请','accept','button wide');
  return header('绑定成功','invite')+`<div class="hero">${avatar('elder')}<h1>绑定成功！</h1><p>${esc(state.elder)} 已接受您的家庭关联。</p></div>`+cta('进入首页','home');
}
const msg = (m) => `<div class="msg"><div class="between"><strong>${esc(m.by)}</strong><small>${esc(m.time)}</small></div><p>${esc(m.text)}</p></div>`;
const scores = ['学习/记忆力','注意力','执行力','视空间功能'];
function home() {
  return `<div class="identity">${avatar('elder')}<div><h1>${esc(currentElder().name)}</h1><p class="muted">家庭守护 · ${esc(state.relation)}</p></div><span class="tag">示例档案</span></div>
  <a class="strip action" href="#meds">最近更新 · ${state.activeElder==='primary'?'今日已服用 2/3 次药物，下次 15:00':medicines().length+' 项服药记录'}</a>
  <a class="card action" href="#trend">${section('今日认知评估','Brain')}<div class="grid">${scores.map((s,i)=>`<div class="score"><h3>${s}</h3><b>${state.activeElder==='primary'?[78,72,69,68][i]:'—'}</b></div>`).join('')}</div></a>
  ${block(section('家庭留言板','MessageSquare',cta('查看全部 ›','messages','link'))+(messages().slice(-2).map(msg).join('')||'<p class="muted">还没有留言</p>')+cta('＋ 发送新留言','messages'))}
  <a class="card action" href="#meds">${section('服药管理','Pill','<span class="small">设置与详情 ›</span>')}<div class="between"><p>药箱内 ${medicines().length} 种药品</p><span class="tag">查看日程</span></div></a>
  <a class="card action" href="#trend">${section('今日认知训练','Tv','<span class="tag">示例记录</span>')}<p>${state.activeElder==='primary'?'已训练 15 分钟 · 记忆强化、注意力':'暂无训练记录'}</p></a>${sample}`;
}
const series = [
  ['记忆力','#dc8c26',[74,77,75,73]],['注意力','#1b8982',[59,70,65,79]],
  ['执行力','#305d38',[65,61,77,73]],['视空间功能','#f0632d',[63,62,65,63]]
];
let showLines = series.map(()=>true);
function trend() {
  return `<div class="between"><div><h1>本周认知周报</h1><small>2026年7月20日 – 7月27日</small></div><span class="tag">${esc(currentElder().name)}</span></div><br>
  ${state.activeElder!=='primary' ? block('<p>该档案暂无周报。</p>') : block(section('能力变化','Activity')+`<svg class="chart" viewBox="0 0 380 152" role="img" aria-label="认知能力趋势图">
     ${[28,65,102,138].map(y=>`<line x1="6" x2="374" y1="${y}" y2="${y}" stroke="#e4e9e5" stroke-dasharray="4 4"/>`).join('')}
     ${series.map(([,color,points],i)=>showLines[i]?`<polyline points="${points.map((p,j)=>[14+j*116,135-(p-55)*4].join(',')).join(' ')}" stroke="${color}" stroke-width="3" fill="none"/>`:'').join('')}
     </svg><div class="between small muted"><span>周一</span><span>周三</span><span>周五</span><span>周日</span></div>
     <div class="choices">${series.map(([label],i)=>cmd(label,'line-'+i,'chip',`aria-pressed="${showLines[i]}"`)).join('')}</div>`)+
     `<div class="grid metrics">${['记忆力 3% ↓','注意力 5% ↑','执行力 2% ↑','视空间功能 0% →'].map((s,i)=>`<div class="score"><h3>${s}</h3><small>${['需多练习','提升明显','稳步提升','保持稳定'][i]}</small></div>`).join('')}</div><br>`+
     block('<h2>整体变化 · 稳步改善</h2><p class="muted">示例中，注意力和执行力有所改善，记忆力略有波动。</p>')+
     block('<h2>本周陪伴建议</h2><p class="muted">一起翻看旧照片，或安排一次家庭聊天。</p>')+
     `<a class="card action between" href="#report"><div><h2>上次评估结果</h2><small>2026年7月21日</small></div><span class="tag">72 分 · 查看详情 ›</span></a>`}${sample}`;
}
function report() {
  return header('认知评估报告','trend')+block('<span class="tag">示例报告</span><h1>综合评分 72 分</h1><p class="muted">最近评估日期 · 2026年7月21日</p>')+
    scores.concat('语言与表达').map((s,i)=>block(`<div class="between"><h2>${s}</h2><span class="tag">${[78,72,69,68,73][i]} 分</span></div>`,'flat')).join('')+sample;
}
function room() {
  const art = (name) => img(asset('7951-img'+name+'.svg'));
  return `<h1>数字客厅</h1><p class="muted">管理照片、留言和服药提醒</p><br><div class="room">
    <div class="rug">${art('CozyRug')}</div><button class="portrait" data-action="nav-portrait" aria-label="全家福设置">${img(images.portrait)}</button>
    <div class="sofa">${art('Group994')}</div><button class="clock" data-action="nav-trend" aria-label="查看周报">${art('')}</button>
    <div class="table">${art('Group995')}</div><button class="phone" data-action="nav-messages" aria-label="家人留言板">${art('1')}</button>
    <button class="album" data-action="nav-album" aria-label="我的相册">${img(images.portrait)}<span>相册</span></button>
    <button class="med" data-action="nav-meds" aria-label="服药管理">＋</button>
    </div><div class="room-links">${row('我的相册','album','Tv')}${row('全家福设置','portrait','Tv1')}${row('服药管理','meds','Pill')}${row('家人留言板','messages','MessageSquare')}</div>`;
}
const templates = ['吃药提醒','训练提醒','就医提醒','天气提醒','关心问候','日程提醒'];
const templateText = ['爸，别忘了按您原定的时间服药哦。','爸，今天有空可以做一会儿认知训练。','爸，记得查看下次就医的时间。','爸，出门前记得看看天气。','爸，今天过得怎么样？','爸，记得看看今天的日程。'];
function messagePage() {
  return header('家人留言板','room')+block(form('message',area('给长辈留言','text','','写下想说的话…')+
    `<div class="choices">${templates.map((s,i)=>cmd(s,'template-'+i,'chip')).join('')}</div>`+submit('发送')))+
    (messages().slice().reverse().map(m=>block(msg(m),'flat')).join('')||'<p class="muted">还没有留言</p>')+sample;
}
function meds() {
  return header('服药管理','room')+cta('＋ 添加新药品','medicine')+
    `<div class="between"><h2>${esc(currentElder().name)}的药箱（${medicines().length}）</h2>${cmd(editingMedicine?'完成':'编辑列表','edit-meds')}</div><br>`+
    medicines().map(m=>block(`<div class="between"><h2>${esc(m.name)}</h2><span class="tag">${m.alarm?'提醒开启':'提醒关闭'}</span></div>
      <p class="muted">${esc(m.frequency)} · ${m.times.map(esc).join('、')}</p><p>每次 ${esc(m.dose)} ${esc(m.unit)}</p>${m.notes?`<small>${esc(m.notes)}</small>`:''}
      <div class="choices">${cta('编辑','medicine/'+m.id,'chip')}${editingMedicine?cmd('删除','delete-med-'+m.id,'link danger'):''}</div>`,'flat')).join('')+
    '<p class="sample">提醒设置保存在本机，演示页不会在后台响铃。</p>';
}
const timeInput = (value) => `<div class="row"><input type="time" name="time" aria-label="服药时间" value="${esc(value)}" required>${cmd('移除','remove-time','link')}</div>`;
function medicine(edit) {
  const m = medicines().find(item=>item.id===edit) || {name:'',dose:1,unit:'片',frequency:'每天',times:['08:00'],alarm:true,notes:''};
  return header(edit?'编辑药品':'添加新药品','meds')+form('medicine',
    block(field('药品名称','name',m.name,'required maxlength="60"'),'flat')+
    block('<h2>服用剂量与频率</h2><br><div class="grid">'+field('单次剂量','dose',m.dose,'type="number" min="0.01" step="any" required')+pick('剂量单位','unit',['片','粒','袋','毫升','支'],m.unit)+'</div>'+
    pick('服用频率','frequency',['每天','隔天一次','每周','必要时服用'],m.frequency),'flat')+
    block('<h2>服药时间设置</h2><br><div class="times">'+m.times.map(timeInput).join('')+'</div>'+cmd('＋ 添加新的服药时间','add-time','button secondary wide')+'<hr class="divider">'+checkbox('开启服药提醒闹钟','alarm',m.alarm),'flat')+
    block(area('添加备注信息','notes',m.notes||'','填写现有医嘱中的服药注意事项'),'flat')+submit('✓ 保存此药品'));
}
const demoPhotos = [1,3,2,4,5].map((n,i)=>({src:asset('8109-imgThumb'+n+'.png'), title:['一张老照片','一家人的回忆','那天的合影','一起出游','家庭时光'][i]}));
const allPhotos = () => [...demoPhotos,...state.photos];
function album() {
  const photos=allPhotos();
  return header('我的相册','room')+cta('＋ 添加照片故事','story')+
    `<div class="between"><h2>已添加的照片</h2><small>${photos.length} 张</small></div><br><div class="gallery">${photos.map((p,i)=>cmd(img(p.src,p.title)+`<span>${esc(p.title)}</span>`,'photo-'+i,'')).join('')}</div>`;
}
function story() {
  return header('添加照片故事','album')+form('story',block(
    field('上传具有回忆价值的老照片','photo','','type="file" accept="image/jpeg,image/png,image/webp" required')+
    '<img class="photo" alt="照片预览" hidden>'+
    field('照片拍摄时间','date','','type="month"')+field('照片中的地点','place','','maxlength="60" placeholder="例如：北京北海公园"')+
    choices('照片中的人物','people',elderRoles.slice(0,9),[],'checkbox')+area('文字回忆故事','story','','写下关于这张老照片的小故事…'))+submit('保存故事'));
}
const pins = [[20,67],[38,67],[50,48],[58,71],[70,68],[79,73],[87,62]];
function portrait() {
  return header('全家福设置','room')+form('portrait',`<div class="photo-wrap">${img(pendingPhoto||state.portrait||images.group,'全家福','photo')}
    ${pins.map(([x,y],i)=>cmd(i+1,'pin-'+i,'pin',`aria-label="编辑标记区域 ${i+1}" style="left:${x}%;top:${y}%"`)).join('')}</div><br>
    <h2>照片标记人物</h2><br>`+
    state.labels.map((role,i)=>block(pick('标记区域 '+(i+1),'person',elderRoles,role),'flat')).join('')+
    field('更换全家福照片','photo','','type="file" accept="image/jpeg,image/png,image/webp"')+submit('保存位置及人物设置'));
}
function me() {
  return header('我的')+block(`<div class="row">${avatar('user')}<div><h2>${esc(state.name)} <span class="tag">${esc(state.relation)}</span></h2><small>手机号 · ${state.phone?esc(state.phone.slice(0,3)+' **** '+state.phone.slice(-4)):'138 **** 5678'}</small></div></div>`,'profile')+
    row('我管理的老人','elders','User',esc(currentElder().name))+row('家庭成员管理','family','User',(state.family.length+1)+' 位成员')+
    row('家人语音录制','voice','MessageSquare',esc(state.voice))+row('设置','settings','Activity')+
    block('<h2>忆家温馨小贴士</h2><p>今天有空，可以和长辈聊聊最近发生的趣事。</p>','peach');
}
function elders(edit) {
  if (edit) {
    const e=edit==='primary'?{name:state.elder, age:state.age, health:state.health}:state.otherElders.find(item=>item.id===edit)||{};
    return header(edit==='new'?'新增长辈档案':'档案修改','elders')+form('edit-elder',block(field('长辈姓名','name',e.name,'required maxlength="20"')+field('长辈年龄','age',e.age,'type="number" min="1" max="120" required')+area('基础健康状况','health',e.health))+submit('保存档案'));
  }
  return header('我管理的老人','me')+[{id:'primary',name:state.elder,age:state.age,avatar:state.elderAvatar,health:state.health},...state.otherElders].map(e=>block(
    `<div class="row">${img(e.avatar||images.elder,'','avatar')}<div><h2>${esc(e.name)}</h2><small>${esc(e.age)} 岁</small></div></div><p>${esc(e.health)}</p>
    <div class="choices">${state.activeElder===e.id?'<span class="tag">当前主界面查看</span>':cmd('切换为管理该老人','switch-elder-'+e.id,'chip')}${cta('档案修改','elders/'+e.id,'chip')}</div>`,'flat')).join('')+cta('＋ 新增长辈档案','elders/new');
}
function family() {
  return header('家庭成员管理','me')+block(`<h2>当前家庭成员 · ${state.family.length+1} 位</h2><hr class="divider">
    <p>${esc(state.name)}（我） <span class="tag">主管理员</span></p>
    ${state.family.map((member,i)=>`<hr class="divider"><div class="between"><strong>${esc(member)}</strong>${cmd('移除','remove-member-'+i,'link danger')}</div>`).join('')}`)+
    block(form('member',field('邀请新家属加入群组','name','','required maxlength="20" placeholder="输入家属姓名"')+submit('添加演示成员')));
}
function voicePage() {
  const options=['女儿声音','儿子声音','温柔女声','沉稳男声'];
  return header('家人语音录制','me')+block('<p>录下一段问候，可以在此试听和选用。</p>','profile')+
    options.map((s,i)=>block(`<div class="between"><h2>${s}</h2>${state.voice===s?'<span class="tag">使用中</span>':''}</div>
      <div class="choices">${cmd('播放试听','listen-'+i,'chip')}${i<2?cmd('录制','record-'+i,'chip'):''}${cmd('选用','voice-'+i,'chip')}</div>`,'flat')).join('')+sample;
}
function settings() {
  return header('设置','me')+block(form('settings',
    '<h2>设备与数据</h2><br>'+checkbox('长辈档案共享（演示）','share',state.share)+'<hr class="divider">'+
    checkbox('接收提醒（演示）','alerts',state.alerts)+'<hr class="divider">'+pick('显示字号','font',['标准','大','特大'],state.font)+submit('保存设置')))+
    block(`<div class="between"><h2>关于忆家</h2><span class="tag">子女端 · 演示版</span></div>`,'flat')+cmd('退出当前账号','logout','button secondary wide');
}
const pages={home,trend,report,room,messages:messagePage,meds,medicine,album,story,portrait,me,elders,family,voice:voicePage,settings};
function render(focus=true) {
  const [page, param] = pathname().split('/');
  if (renderDesign(page,param,focus)) return;
  const login = onboarding.includes(page);
  const body = login ? onboardingPage(page) : (Object.hasOwn(pages,page) ? pages[page] : home)(param);
  app.innerHTML=`<div class="shell ${page==='room'?'room-page':''}" data-font="${esc(state.font)}"><main class="main" tabindex="-1">${body}</main>${login?'':nav(page)}</div>`;
  document.title=(app.querySelector('h1')?.textContent||'子女端')+' · 忆家';
  if(focus) { window.scrollTo(0,0); app.querySelector('main').focus({preventScroll:true}); }
}
async function photoData(file) {
  if (!file || !file.size) return '';
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>10*1024*1024) throw Error('请选择 10 MB 内的 JPG、PNG 或 WebP 照片');
  const url=URL.createObjectURL(file);
  try {
    const photo=new Image(); photo.src=url; await photo.decode();
    const scale=Math.min(1,1000/Math.max(photo.naturalWidth,photo.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.round(photo.naturalWidth*scale); canvas.height=Math.round(photo.naturalHeight*scale);
    canvas.getContext('2d').drawImage(photo,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',.82);
  } finally { URL.revokeObjectURL(url); }
}
const voiceNames=['女儿声音','儿子声音','温柔女声','沉稳男声'];
function playVoice(i) {
  const recording=state.recordings?.[i];
  if(recording) {
    openBox('语音试听',`<audio src="${esc(recording)}" controls autoplay></audio>`); return;
  }
  if(i<2) { toast('请先录制一段家人语音'); return; }
  if(!window.speechSynthesis) { toast('当前浏览器不支持语音试听'); return; }
  const speech=new SpeechSynthesisUtterance('您好，今天也记得留一点时间陪自己做喜欢的事。');
  speech.lang='zh-CN'; speech.rate=.88; speech.pitch=i===3?.8:1.06;
  speech.onerror=()=>toast('当前设备无法播放中文语音');
  speechSynthesis.cancel(); speechSynthesis.speak(speech);
}
async function record(i) {
  if(i===0||i===1){startVoiceDemo(i);return;}
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined') { toast('请在 HTTPS 网页中使用支持麦克风的浏览器'); return; }
  if(recording) return;
  recording={};
  let stream;
  try {
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const recorder=new MediaRecorder(stream), chunks=[];
    const timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},20000);
    recording={recorder,timer};
    recorder.ondataavailable=(e)=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      clearTimeout(timer); stream.getTracks().forEach(track=>track.stop()); recording=null;
      const reader=new FileReader();
      reader.onload=()=>{if(save({recordings:{...state.recordings,[i]:reader.result}}))toast('录音已保存在本机');};
      if(chunks.length)reader.readAsDataURL(new Blob(chunks,{type:recorder.mimeType}));
      if(dialog.open)dialog.close();
    };
    recorder.start(); openBox('正在录音','<p>最多录制 20 秒。</p>'+cmd('停止并保存','stop-recording','button wide'));
  } catch { stream?.getTracks().forEach(track=>track.stop()); recording=null; toast('无法使用麦克风，请检查浏览器权限'); }
}
dialog.addEventListener('close',()=>{if(recording?.recorder?.state==='recording')recording.recorder.stop();});
document.addEventListener('change',async (e)=>{
  if(e.target.type!=='file' || e.target.name!=='photo' || !e.target.files[0])return;
  try {
    const src=await photoData(e.target.files[0]);
    if(!e.target.isConnected)return;
    const preview=e.target.form.querySelector('img.photo');
    if(e.target.form.dataset.form==='portrait')pendingPhoto=src;
    preview.src=src; preview.hidden=false;
  } catch (error) { e.target.value=''; toast(error.message); }
});
document.addEventListener('click',(e)=>{
  const button=e.target.closest('button[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action.startsWith('nav-'))return go(action.slice(4));
  if(action.startsWith('mode-')){const phone=app.querySelector('[name=phone]').value; mode=['验证码登录','密码登录'][+action.slice(5)]; render(false); app.querySelector('[name=phone]').value=phone; return;}
  if(action==='code'){
    const phone=app.querySelector('[name=phone]');
    if(!phone.reportValidity())return;
    loginCode=String(Math.floor(100000+Math.random()*900000)); toast('演示验证码 '+loginCode); return;
  }
  if(action==='wechat')return go('profile');
  if(action==='accept'){if(!inviteCode){go('invite');return;} if(save({joined:true}))go('success');return;}
  if(action==='resend'){if(!inviteCode){go('invite');return;}toast('演示邀请码 '+inviteCode);return;}
  if(action==='close')return dialog.close();
  if(action.startsWith('line-')){const i=+action.slice(5);showLines[i]=!showLines[i];render(false);app.querySelector(`[data-action="${action}"]`).focus();return;}
  if(action.startsWith('template-')){const field=app.querySelector('[name=text]');field.value=templateText[+action.slice(9)];field.focus();return;}
  if(action==='edit-meds'){editingMedicine=!editingMedicine;render(false);return;}
  if(action.startsWith('delete-med-')){const medicineId=action.slice(11);if(confirm('删除该药品？')&&saveElderList('meds',medicines().filter(m=>m.id!==medicineId)))render(false);return;}
  if(action==='add-time'){const group=app.querySelector('.times');group.insertAdjacentHTML('beforeend',timeInput('12:00'));group.lastElementChild.querySelector('input').focus();return;}
  if(action==='remove-time'){const line=button.closest('.row');if(line.parentElement.children.length>1)line.remove();else toast('请保留至少一个服药时间');return;}
  if(action.startsWith('photo-')){
    selectedPhoto=+action.slice(6); const p=allPhotos()[selectedPhoto];
    return openBox(esc(p.title),img(p.src,p.title,'photo')+`<p class="muted">${[p.date,p.place,...(p.people||[])].filter(Boolean).map(esc).join(' · ')}</p><p>${esc(p.story)}</p>`);
  }
  if(action.startsWith('pin-')){const target=app.querySelectorAll('[name=person]')[+action.slice(4)];target.focus();return;}
  if(action.startsWith('switch-elder-')){if(save({activeElder:action.slice(13)}))go('home');return;}
  if(action.startsWith('remove-member-')){
    if(confirm('移除该家庭成员？')&&save({family:state.family.filter((_,i)=>i!==+action.slice(14))}))render(false);return;
  }
  if(action.startsWith('listen-'))return playVoice(+action.slice(7));
  if(action.startsWith('record-'))return record(+action.slice(7));
  if(action==='stop-recording'){if(recording?.recorder?.state==='recording')recording.recorder.stop();return;}
  if(action.startsWith('voice-')){
    const i=+action.slice(6);
    if(i<2&&!state.recordings?.[i]){toast('请先录制这位家人的声音');return;}
    if(save({voice:voiceNames[i]}))render(false);return;
  }
  if(action==='logout'&&save({joined:false}))go('login');
});
document.addEventListener('submit',async (e)=>{
  const f=e.target;
  if(!f.dataset.form)return;
  e.preventDefault();
  if(f.dataset.busy)return;
  const data=new FormData(f), value=(k)=>String(data.get(k)||'').trim(), [,param]=pathname().split('/');
  f.dataset.busy='true';
  try {
    switch(f.dataset.form) {
      case 'login':
        if(mode==='验证码登录'&&(!loginCode||value('code')!==loginCode)){toast('请输入页面生成的演示验证码');break;}
        if(save({phone:value('phone')}))go('profile');break;
      case 'profile': {
        if(!value('name')){toast('请输入姓名');break;}
        const src=await photoData(data.get('avatar'));
        if(save({name:value('name'),gender:value('gender'),...(src?{userAvatar:src}:{})}))go('elder');break;
      }
      case 'elder': {
        if(!value('name')){toast('请输入长辈姓名');break;}
        const src=await photoData(data.get('avatar'));
        if(save({elder:value('name'),age:value('age'),elderGender:value('gender'),health:value('health'),...(src?{elderAvatar:src}:{})}))go('relation');break;
      }
      case 'relation': if(save({relation:value('relation')}))go('invite');break;
      case 'invite': invite=value('invite');inviteCode=String(Math.floor(100000+Math.random()*900000));go('waiting');break;
      case 'message': {
        if(!value('text')){toast('请先填写留言');break;}
        const time=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
        if(saveElderList('messages',[...messages(),{by:state.name+'（我）',text:value('text'),time}])){render(false);toast('留言已加入演示留言板');}break;
      }
      case 'medicine': {
        if(!value('name')){toast('请输入药品名称');break;}
        const m={id:param||id(),name:value('name'),dose:value('dose'),unit:value('unit'),frequency:value('frequency'),times:[...new Set(data.getAll('time'))].sort(),alarm:data.has('alarm'),notes:value('notes')};
        const list=medicines();
        if(saveElderList('meds',list.some(x=>x.id===m.id)?list.map(x=>x.id===m.id?m:x):[...list,m])){go('meds');toast('药品已保存');}break;
      }
      case 'story': {
        const src=await photoData(data.get('photo'));
        if(!src){toast('请添加一张照片');break;}
        const p={src,title:value('place')||'照片故事',date:value('date'),place:value('place'),people:data.getAll('people'),story:value('story')};
        if(save({photos:[...state.photos,p]})){go('album');toast('照片故事已保存在本机');}break;
      }
      case 'portrait': {
        const src=await photoData(data.get('photo'));
        if(save({labels:data.getAll('person'),...(src?{portrait:src}:{})})){pendingPhoto='';go('room');toast('全家福设置已保存');}break;
      }
      case 'edit-elder': {
        if(!value('name')){toast('请输入长辈姓名');break;}
        const p={name:value('name'),age:value('age'),health:value('health')};
        if(param==='primary'){if(save({elder:p.name,age:p.age,health:p.health}))go('elders');break;}
        const next=param==='new'?[...state.otherElders,{...p,id:id()}]:state.otherElders.map(x=>x.id===param?{...x,...p}:x);
        if(save({otherElders:next}))go('elders');break;
      }
      case 'member':
        if(!value('name')||state.family.includes(value('name'))){toast('请输入新的家庭成员姓名');break;}
        if(save({family:[...state.family,value('name')]}))render(false);break;
      case 'settings':
        if(save({alerts:data.has('alerts'),share:data.has('share'),font:value('font')})){render(false);toast('设置已保存');}break;
    }
  } catch(error) { toast(error.message); }
  finally { delete f.dataset.busy; }
});
window.addEventListener('hashchange',()=>{pendingPhoto=''; if(dialog.open)dialog.close(); render();});
startDesign();
render(false);
