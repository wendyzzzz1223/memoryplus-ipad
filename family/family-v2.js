'use strict';
const designRoutes = {
  login:[6463,1124], profile:[6512,1124], elder:[6559,1124], relation:[6610,1124],
  invite:[6671,1124], waiting:[6735,1124], success:[6427,1124],
  home:[6777,1322], trend:[6986,1657], report:[7210,1214],
  room:[7951,517], 'room-help':[8028,517], album:[8109,1124],
  story:[6900,1188], portrait:[8167,1249], meds:[7293,1124],
  medicine:[7816,1911], messages:[7123,1124], me:[7384,1124],
  elders:[7648,1124], family:[7474,1124], voice:[7729,1124], settings:[7569,1124],
};
const v2Values={agreed:true, gender:'女', elderGender:'男', role:null, inviteIndex:1, medicineTimes:['08:00','15:00'], unit:'片', frequency:'每天', alarm:true};
let designRoot, queuedPhoto;
const dn=(name,scope=designRoot)=>scope?.querySelector('[data-name="'+name+'"]');
const nd=(n)=>designRoot?.querySelector('[data-node-id="113:'+n+'"]');
const dns=(name)=>[...designRoot.querySelectorAll('[data-name="'+name+'"]')];
const setText=(n,value)=>{const el=nd(n);if(el)el.textContent=value;};
function bind(el,key,label,role='button') {
  if(!el)return;
  el.dataset.v2=key;
  el.tabIndex=0;
  el.setAttribute('role',role);
  el.setAttribute('aria-label',label || el.textContent.trim());
  if(role==='link') el.dataset.destination=key.slice(3);
  return el;
}
const on=(n,key,label,role)=>bind(nd(n),key,label,role);
const route=(el,page,label)=>bind(el,'go-'+page,label,'link');
function mark(el,on) {
  if(!el)return;
  el.dataset.on=String(on); el.setAttribute('aria-pressed',String(on));
}
function replaceInput(n,name,value='',opts={}) {
  const el=nd(n);
  if(!el)return;
  const input=document.createElement(opts.multiline?'textarea':'input');
  input.className=el.className+' figma-input';
  input.name=name;
  input.setAttribute('aria-label',opts.label||el.textContent.trim());
  if(!opts.multiline)input.type=opts.type||'text';
  input.placeholder=opts.placeholder??el.textContent.trim();
  input.value=value??'';
  if(opts.max)input.maxLength=opts.max;
  if(opts.type==='date'||opts.type==='time'||opts.type==='file')input.placeholder='';
  el.replaceWith(input);
  return input;
}
const val=(name)=>designRoot.querySelector('[name="'+name+'"]')?.value?.trim()||'';
function filePick(accept,fn) {
  const chooser=document.createElement('input'); chooser.type='file'; chooser.accept=accept;
  chooser.onchange=async()=>{
    try {const photo=await photoData(chooser.files[0]); if(photo)fn(photo);}
    catch(error){toast(error.message);}
  };
  chooser.click();
}
const sectionTitle={login:'忆家 · 家人端',profile:'填写您的信息',elder:'添加老人信息',relation:'选择与老人关系',invite:'关联长辈端',waiting:'等待绑定确认',success:'绑定成功',home:'首页',trend:'本周认知周报',report:'认知评估报告',room:'数字客厅','room-help':'数字客厅',album:'我的相册',story:'添加照片故事',portrait:'全家福设置',meds:'服药管理',medicine:'药品设置',messages:'家人留言板',me:'我的',elders:'我管理的老人',family:'家庭成员管理',voice:'家人语音录制',settings:'设置'};
const designBack={profile:'login',elder:'profile',relation:'elder',invite:'relation',waiting:'invite',report:'trend',album:'room',story:'album',portrait:'room',meds:'room',medicine:'meds',messages:'room',elders:'me',family:'me',voice:'me',settings:'me'};
function fitDesign() {
  const viewport=app.querySelector('.figma-viewport');
  if(!viewport)return;
  const width=Number(viewport.dataset.width);
  viewport.style.setProperty('--fit',Math.min(1,viewport.clientWidth/width));
}
function renderDesign(page,param,focus) {
  if(!Object.hasOwn(designRoutes,page)||page==='elders'&&param)return false;
  const [frame,height]=designRoutes[page], isRoom=page.startsWith('room'), width=isRoom?1124:517;
  const extras=page==='login'?'<div class="figma-extras"><a class="button secondary" href="#home">直接体验王建国家庭</a></div>':page==='waiting'?'<div class="figma-extras"><button class="button secondary" data-v2="accept">模拟长辈接受邀请</button><p>作品集演示 · 邀请与确认在本机模拟</p></div>':'';
  app.innerHTML=`<main class="figma-viewport ${isRoom?'landscape':''}" tabindex="-1" aria-label="${sectionTitle[page]}" data-width="${width}" style="--canvas-width:${width}px;--canvas-height:${height}px"><div class="figma-stage">${figmaFrames[frame]}</div>${extras}</main>`;
  designRoot=app.querySelector('.figma-stage>div');
  fitDesign();
  document.title=sectionTitle[page]+' · 忆家子女端 2.0';
  const back=dn('back-icon')||dn('chevron-left')?.parentElement;
  if(designBack[page])route(back,designBack[page],'返回');
  const bar=dn('tab-bar');
  if(bar){
    bar.setAttribute('role','navigation');
    bar.setAttribute('aria-label','主导航');
    const tabsMap={'首页':'home','变化':'trend','数字客厅':'room','我的':'me'};
    for(const el of bar.querySelectorAll('p')) {
      const r=tabsMap[el.textContent.trim()];
      if(r)route(el.parentElement,r,el.textContent.trim());
    }
  }
  decorateDesign(page,param);
  if(focus){window.scrollTo(0,0);app.querySelector('main').focus({preventScroll:true});}
  return true;
}
function designForm(page) {
  if(page==='login'){
    const phone=replaceInput(6487,'phone',state.phone,{label:'手机号码',type:'tel',max:11});
    phone.inputMode='numeric';
    const verification=mode==='验证码登录';
    setText(6489,verification?'验证码':'密码');
    replaceInput(6491,verification?'code':'password','',{type:verification?'text':'password',label:verification?'验证码':'密码',placeholder:verification?'请输入验证码':'请输入演示密码'});
    if(!verification)dn('get-code-btn').hidden=true;
    on(6481,'login-mode-0','验证码登录');on(6483,'login-mode-1','密码登录');
    if(!verification){nd(6481).style.color='#7a8c88';nd(6483).style.color='#208a83';}
    bind(dn('get-code-btn'),'get-code','获取验证码');
    on(6495,'login-submit','进入忆家');on(6503,'go-profile','微信一键快捷登录','link');
    const check=dn('check');
    bind(check,'agreement','同意演示说明','checkbox')?.setAttribute('aria-checked',String(v2Values.agreed));
    for(const label of ['用户协议','隐私政策']){
      const link=[...designRoot.querySelectorAll('span')].find(e=>e.textContent.trim()===label);
      bind(link,'policy',label);
    }
  }
  if(page==='profile'||page==='elder'){
    const isElder=page==='elder';
    replaceInput(isElder?6587:6540,'name','',{label:isElder?'长辈姓名':'姓名或昵称',max:20});
    if(isElder){
      replaceInput(6591,'age','',{label:'长辈年龄',type:'number'});replaceInput(6603,'health',state.health,{label:'基础健康状况',multiline:true});
    }else if(state.phone) setText(6551,state.phone.slice(0,3)+' **** '+state.phone.slice(-4));
    const initial=isElder?v2Values.elderGender:v2Values.gender;
    for(const [index,n] of (isElder?[6597,6599]:[6545,6547]).entries()){
      const label=index?'女':'男';
      mark(bind(nd(n).parentElement,'gender-'+label,label),label===initial);
    }
    bind(dn('avatar-upload'),'avatar-'+page,'上传头像');
    bind(dn('button'),'submit-'+page,'下一步');
  }
  if(page==='relation'){
    dns('relation-card').forEach((el,i)=>mark(bind(el,'relation-'+i,roles[i]),(v2Values.role||state.relation)===roles[i]));
    bind(dn('button'),'submit-relation','下一步');
  }
  if(page==='invite'){
    setText(6693,state.elder+'（长辈）');
    dns('invite-method').forEach((el,i)=>bind(el,'invite-'+i,['微信快速邀请','生成六位邀请码','二维码扫码邀请'][i]).setAttribute('aria-pressed','false'));
    bind(dn('button'),'issue-invite','邀请老人加入');
  }
  if(page==='waiting'){
    on(6765,'resend-code');on(6769,'bindings-info');on(6773,'go-invite',undefined,'link');
  }
  if(page==='success'){
    if(state.elder!=='王建国')setText(6456,state.elder+' 已接受您的家庭关联。');
    bind(dn('button'),'go-home','进入首页','link');
  }
}
function decorateDesign(page,param) {
  if(onboarding.includes(page)){designForm(page);return;}
  if(page==='home'){
    const elder=currentElder();
    if(elder.name!=='王建国')setText(6783,'长辈 • '+elder.name);
    if(elder.avatar)dn('avatar')?.querySelector('img')?.setAttribute('src',elder.avatar);
    route(dn('Cognitive-Radar-Card'),'trend','今日认知评估');
    route(dn('quick-notice'),'meds','查看服药更新');
    route(dn('Medicine-Card'),'meds','服药管理');
    route(dn('Training-Card'),'trend','今日认知训练');
    on(6824,'go-messages','查看全部留言','link');route(dn('action'),'messages','发送新留言');
    const list=messages().slice(-2);
    if(messages()!==starter.messages&&list.length===2){
      const slots=[[6832,6833,6834],[6840,6841,6842]];
      slots.forEach(([name,time,body],i)=>{setText(name,list[i].by);setText(time,list[i].time);setText(body,list[i].text);setText([6829,6837][i],list[i].by.slice(0,1));});
    }
  }
  if(page==='trend'){
    route(dn('last-assessment-card'),'report','查看评估详情');
    ['memory','lang','attn','exec'].forEach(name=>bind(dn('leg-'+name),'legend-'+name).setAttribute('aria-pressed',String(v2Values['show-'+name]!==false)));
    applyCurves();
  }
  if(page==='report')bind(dn('icon-right'),'report-share','分享报告');
  if(page.startsWith('room')){
    bind(dn('Framed Family Portrait'),'portrait-open','全家福设置');
    bind(dn('Family Photo Album'),'room-album','相册');
    bind(dn('钟表'),'go-trend','查看周报','link');
    bind(dn('电话'),'go-messages','家人留言板','link');
    bind(dn('Box Body')?.closest('[data-motion-for]')||dn('Box Body')?.parentElement,'go-meds','服药管理','link');
  }
  if(page==='album'){
    route(dn('upload-area'),'story','添加照片故事');
    const order=[1,3,2,4,5];const original=order.map(n=>dn('thumb-'+n));
    original.forEach((el,i)=>bind(el,'asset-photo-'+i,'查看相册照片 '+(i+1)));
    const add=dn('photo-grid')?.querySelector('[data-name="plus"]')?.parentElement;
    route(add,'story','添加照片');
    if(state.photos.length)setText(8136,(5+state.photos.length)+' 张');
    if(state.photos.length){
      const grid=dn('photo-grid');
      const custom=document.createElement('div');custom.className='gallery';custom.dataset.added='';
      custom.innerHTML=state.photos.map((p,i)=>cmd(img(p.src,p.title)+`<span>${esc(p.title)}</span>`,'photo-'+(5+i),'')).join('');
      grid?.after(custom);
      renderExtrasHeight(1124+Math.ceil(state.photos.length/2)*190);
    }
  }
  if(page==='story'){
    bind(nd(6923)?.parentElement?.parentElement,'pick-story','上传照片');
    replaceInput(6929,'date','',{type:'date',label:'照片拍摄时间'});
    replaceInput(6935,'place','',{label:'照片中的地点',max:60});
    replaceInput(6954,'story','',{label:'文字回忆故事',multiline:true});
    [6942,6944,6946,6948,6950].forEach((n,i)=>on(n,'story-person-'+i));
    on(6960,'record-story','录制语音讲述');on(6967,'save-story','保存照片故事');
  }
  if(page==='portrait'){
    if(state.portrait)(dn('photo-2020')?.querySelector('img')||dn('photo-area')?.querySelector('img'))?.setAttribute('src',state.portrait);
    [8201,8212,8223,8234,8242,8253,8267].forEach((n,i)=>{
      if(state.labels[i]!==starter.labels[i])setText(n,state.labels[i]);
      bind(nd(n)?.parentElement?.parentElement,'person-'+i,'编辑标记区域 '+(i+1));
    });
    [8282,8274,8272,8284,8280,8276,8278].forEach((n,i)=>bind(nd(n)?.parentElement,'person-'+i,'标记区域 '+(i+1)));
    on(8288,'save-portrait');on(8289,'pick-portrait');
  }
  if(page==='meds')hydrateMeds();
  if(page==='medicine')hydrateMedicine(param);
  if(page==='messages')hydrateMessages();
  if(page==='me'){
    [7416,7427,7438,7449].forEach((n,i)=>route(nd(n).parentElement.parentElement,['elders','family','voice','settings'][i]));
    setText(7405,state.name);setText(7407,state.relation);setText(7418,currentElder().name);setText(7429,(state.family.length+1)+'位成员');
    if(state.userAvatar)nd(7405)?.closest('[data-node-id="113:7400"]')?.querySelector('img')?.setAttribute('src',state.userAvatar);
    if(state.voice!=='温柔女声')setText(7440,'当前：'+state.voice);
  }
  if(page==='elders'){
    on(7686,'go-elders/primary','修改王建国档案','link');on(7704,'demo-elder','切换为管理该老人');on(7706,'edit-demo-elder','修改张桂兰档案');on(7711,'go-elders/new','新增绑定老人','link');
    setText(7674,state.elder);
    if(state.otherElders.some(e=>e.id!=='guilan')){
      const extra=document.createElement('div');extra.className='v2-list-addendum';
      extra.innerHTML=state.otherElders.filter(e=>e.id!=='guilan').map(e=>row(esc(e.name),'elders/'+e.id,'User','编辑')).join('');
      nd(7711)?.parentElement?.after(extra);
    }
  }
  if(page==='family'){
    setText(7496,(state.family.length+1)+' 位成员');setText(7504,state.name+'（我）');
    [7522,7535,7548].forEach((n,i)=>on(n,'family-remove-'+i));
    on(7550,'family-add','邀请新家属加入群组');
    state.family.filter(name=>!starter.family.includes(name)).forEach(name=>{
      const added=document.createElement('p');added.textContent=name;nd(7550)?.parentElement?.before(added);
    });
    [7516,7529,7542].forEach((n,i)=>{if(!state.family.includes(starter.family[i]))nd(n)?.parentElement?.parentElement?.parentElement?.remove();});
  }
  if(page==='voice'){
    decorateVoiceDemo();
  }
  if(page==='settings'){
    [7592,7596,7600,7607,7611,7618,7623,7629].forEach((n,i)=>on(n,['settings-permission','settings-devices','settings-privacy','settings-alerts','settings-font','settings-cache','settings-about','settings-exit'][i]));
    setText(7613,state.font);
  }
}
function renderExtrasHeight(height) {
  app.querySelector('.figma-viewport').style.setProperty('--canvas-height',height+'px');
}
function applyCurves() {
  for(const name of ['memory','lang','attn','exec']){
    for(const el of designRoot.querySelectorAll('[data-name^="'+name+'-line-"]'))el.style.visibility=v2Values['show-'+name]===false?'hidden':'';
  }
}
function hydrateMeds() {
  route(dn('add-btn'),'medicine','添加新药品');on(7318,'edit-list','编辑列表');
  const list=medicines(), cards=dns('med-card'), parent=cards[0].parentElement;
  const prototype=cards[0].cloneNode(true);
  setText(7317,currentElder().name+'的药箱 ('+list.length+')');
  for(const [i,m] of list.entries()){
    const card=cards[i]||prototype.cloneNode(true);
    if(!cards[i]){card.removeAttribute('data-node-id');parent.append(card);}
    const paragraphs=card.querySelectorAll('p');
    paragraphs[0].textContent=m.name;
    const initial=starter.meds.find(item=>item.id===m.id);
    if(!initial||m.times.join()!==initial.times.join()||m.frequency!==initial.frequency)paragraphs[1].textContent=m.frequency+' · '+m.times.join('、');
    if(!initial||+m.dose!==+initial.dose||m.unit!==initial.unit)paragraphs[2].textContent='剂量：每次 '+m.dose+' '+m.unit;
    route(paragraphs[0],'medicine/'+m.id,'编辑 '+m.name);
    const sw=bind(dn('toggle-switch',card),'med-toggle-'+m.id,'服药提醒 '+m.name,'switch');
    sw.setAttribute('aria-checked',String(m.alarm));sw.dataset.switch=String(m.alarm);
    if(editingMedicine){
      const remove=document.createElement('button');remove.type='button';remove.className='link danger';remove.textContent='删除';
      remove.dataset.action='delete-med-'+m.id;card.append(remove);
    }
  }
  cards.slice(list.length).forEach(card=>card.remove());
  if(list.length>4){
    const bar=dn('tab-bar'), offset=(list.length-4)*122;
    bar.style.top=1023.52+offset+'px';renderExtrasHeight(1124+offset);
  }
}
function hydrateMedicine(param) {
  const m=medicines().find(item=>item.id===param);
  const name=replaceInput(7842,'med-name',m?.name||'',{label:'药品名称',max:60});
  name.placeholder='阿司匹林 - 肠溶片';
  replaceInput(7853,'dose',m?.dose??1,{label:'单次剂量',type:'number'}).step='any';
  replaceInput(7927,'notes',m?.notes||'',{label:'备注',multiline:true});
  if(v2Values.edit!==param || !v2Values.editInitialized){
    v2Values.edit=param;v2Values.editInitialized=true;
    v2Values.unit=m?.unit||'片';v2Values.frequency=m?.frequency||'每天';v2Values.alarm=m?.alarm??true;
    v2Values.medicineTimes=m?.times.slice()||['08:00','15:00'];
  }
  setText(7857,v2Values.unit);setText(7874,v2Values.frequency);
  const units=['片','粒','袋','毫升','支'], frequencies=['每天','隔天一次','每周','必要时服用'];
  [7862,7864,7866,7868,7870].forEach((n,i)=>mark(bind(nd(n).parentElement,'unit-'+units[i],units[i]),units[i]===v2Values.unit));
  [7879,7881,7883,7885].forEach((n,i)=>mark(bind(nd(n).parentElement,'frequency-'+frequencies[i],frequencies[i]),frequencies[i]===v2Values.frequency));
  const sw=bind(dn('toggle-switch'),'edit-alarm','开启服药提醒闹钟','switch');
  sw.setAttribute('aria-checked',String(v2Values.alarm));sw.dataset.switch=String(v2Values.alarm);
  renderTimes();
  bind(dn('add-time-btn'),'add-v2-time','添加新的服药时间');bind(dn('save-btn'),'save-med','保存此药品');
}
function renderTimes() {
  const list=dn('time-list');
  if(!list.cacheFirst)list.cacheFirst=list.firstElementChild.cloneNode(true);
  list.replaceChildren();
  v2Values.medicineTimes.forEach((time,i)=>{
    const newRow=list.cacheFirst.cloneNode(true), ps=newRow.querySelectorAll('p'), input=document.createElement('input');
    ps[0].textContent='时间 '+(i+1);input.className=ps[1].className+' figma-input';input.type='time';input.value=time;
    input.name='v2-time';input.setAttribute('aria-label','服药时间 '+(i+1));
    ps[1].replaceWith(input);
    bind(dn('edit-3',newRow),'focus-time-'+i,'编辑时间 '+(i+1));
    bind(dn('trash-2',newRow),'remove-v2-time-'+i,'移除时间 '+(i+1));
    list.append(newRow);
  });
}
function hydrateMessages() {
  replaceInput(7141,'v2-message','',{label:'给长辈留言',multiline:true,max:300});
  [7145,7147,7149,7151,7153,7155].forEach((n,i)=>bind(nd(n).parentElement,'v2-template-'+i,templates[i]));
  bind(nd(7157).parentElement,'send-message','发送');
  bind(dn('voice-bubble'),'example-voice','播放示例语音');
  const extra=messages().filter(m=>!starter.messages.some(item=>item.text===m.text));
  if(extra.length){
    const list=dn('message-list'), sample=dns('message-item')[0];
    extra.slice().reverse().forEach(m=>{
      const card=sample.cloneNode(true), ps=card.querySelectorAll('p');
      ps[0].textContent=m.by;ps[1].textContent=m.time;ps[2].textContent=m.text;ps[2].style.whiteSpace='normal';
      list.insertBefore(card,list.firstElementChild);
    });
    const bar=dn('bottom-navigation-panel');bar.style.top=1021+extra.length*100+'px';
    renderExtrasHeight(1124+extra.length*100);
  }
}
function captureTimes() {
  v2Values.medicineTimes=[...designRoot.querySelectorAll('input[name="v2-time"]')].map(input=>input.value);
}
function currentRoute() {return pathname().split('/')[0];}
function draftToggle(el,flag) {
  el.setAttribute('aria-checked',String(flag));el.dataset.switch=String(flag);
}
function writeDesignMessage() {
  if(!val('v2-message')){toast('请先填写留言');return;}
  const time=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  if(saveElderList('messages',[...messages(),{by:state.name+'（我）',text:val('v2-message'),time}])){render(false);toast('留言已加入本机演示');}
}
function speakExample() {
  if(!window.speechSynthesis){toast('当前浏览器不支持语音试听');return;}
  const utterance=new SpeechSynthesisUtterance('我今天已经完成训练啦，晚点一起看看相册。');
  utterance.lang='zh-CN';utterance.rate=.88;speechSynthesis.cancel();speechSynthesis.speak(utterance);
}
function handleDesign(key,el) {
  const page=currentRoute();
  if(key.startsWith('go-')){go(key.slice(3));return;}
  if(key==='portrait-open'){go('portrait');return;}
  if(key==='room-album'){go('album');return;}
  if(key==='agreement'){v2Values.agreed=!v2Values.agreed;el.setAttribute('aria-checked',String(v2Values.agreed));return;}
  if(key==='policy'){openBox('演示说明','<p>这是作品集演示。填写的信息保存在当前浏览器。请使用示例号码和资料。</p>');return;}
  if(key.startsWith('login-mode-')){
    const phone=val('phone');mode=key.endsWith('0')?'验证码登录':'密码登录';
    render(false);designRoot.querySelector('[name=phone]').value=phone;return;
  }
  if(key==='get-code'){
    if(!/^\d{11}$/.test(val('phone'))){toast('请输入 11 位演示手机号');return;}
    loginCode=String(Math.floor(100000+Math.random()*900000));openBox('演示验证码','<p>'+loginCode+'</p>');return;
  }
  if(key==='login-submit'){
    const phone=val('phone');
    if(!v2Values.agreed||!/^\d{11}$/.test(phone)){toast('请填写 11 位演示手机号并阅读演示说明');return;}
    if(mode==='验证码登录'&&(!loginCode||val('code')!==loginCode)){toast('请输入刚获取的演示验证码');return;}
    if(mode==='密码登录'&&val('password').length<6){toast('请输入至少 6 位演示密码');return;}
    if(save({phone}))go('profile');return;
  }
  if(key.startsWith('gender-')){
    const gender=key.slice(7);
    v2Values[page==='elder'?'elderGender':'gender']=gender;
    designRoot.querySelectorAll('[data-v2^=gender]').forEach(chip=>mark(chip,chip===el));return;
  }
  if(key.startsWith('avatar-')){
    filePick('image/jpeg,image/png,image/webp',src=>{
      if(currentRoute()!==page)return;
      v2Values[page+'Avatar']=src;
      const target=dn('avatar-inner');
      target.innerHTML=img(src,'头像预览','avatar');
    });return;
  }
  if(key==='submit-profile'||key==='submit-elder'){
    const name=val('name'), age=+val('age');
    if(!name||page==='elder'&&(!Number.isInteger(age)||age<1||age>120)){toast('请填写姓名及有效资料');return;}
    const avatar=v2Values[page+'Avatar'];
    const change=page==='elder'?{elder:name,age,elderGender:v2Values.elderGender,health:val('health'),...(avatar?{elderAvatar:avatar}:{})}:{name,gender:v2Values.gender,...(avatar?{userAvatar:avatar}:{})};
    if(save(change))go(page==='elder'?'relation':'elder');return;
  }
  if(key.startsWith('relation-')){
    v2Values.role=roles[+key.slice(9)];dns('relation-card').forEach(card=>mark(card,card===el));return;
  }
  if(key==='submit-relation'){if(save({relation:v2Values.role||state.relation}))go('invite');return;}
  if(key.startsWith('invite-')){
    v2Values.inviteIndex=+key.slice(7);dns('invite-method').forEach(card=>card.setAttribute('aria-pressed',String(card===el)));return;
  }
  if(key==='issue-invite'){
    inviteCode=String(Math.floor(100000+Math.random()*900000));go('waiting');toast('本机演示邀请码 '+inviteCode);return;
  }
  if(key==='resend-code'){toast(inviteCode?'本机演示邀请码 '+inviteCode:'请先生成邀请码');return;}
  if(key==='bindings-info'){openBox('绑定步骤','<p>生成邀请码后，在等待画板下方点「模拟长辈接受邀请」，即可完成演示。</p>');return;}
  if(key==='accept'){if(!inviteCode){go('invite');return;}if(save({joined:true}))go('success');return;}
  if(key.startsWith('legend-')){
    const name=key.slice(7), field='show-'+name;
    v2Values[field]=v2Values[field]===false;el.setAttribute('aria-pressed',String(v2Values[field]));applyCurves();return;
  }
  if(key==='report-share'){openBox('分享报告','<p>当前为示例报告，您可以复制本页地址用于同一预览环境。</p>');return;}
  if(key.startsWith('asset-photo-')){
    const p=el.querySelector('img');
    openBox('相册照片',img(p.src,'相册照片','photo'));return;
  }
  if(key==='pick-story'){
    filePick('image/jpeg,image/png,image/webp',src=>{
      if(currentRoute()!=='story')return;
      queuedPhoto=src;el.style.backgroundImage='url("'+src+'")';el.style.backgroundSize='cover';el.style.backgroundPosition='center';
      el.setAttribute('aria-label','重新选择照片');
    });return;
  }
  if(key.startsWith('story-person-')){mark(el,el.dataset.on!=='true');return;}
  if(key==='record-story'){record('story');return;}
  if(key==='save-story'){
    if(!queuedPhoto){toast('请先上传照片');return;}
    const people=[...designRoot.querySelectorAll('[data-v2^=story-person][data-on=true]')].map(e=>e.textContent.trim());
    const photo={src:queuedPhoto,title:val('place')||'照片故事',date:val('date'),place:val('place'),story:val('story'),people,voice:state.recordings?.story};
    if(save({photos:[...state.photos,photo]})){queuedPhoto='';go('album');toast('照片故事已保存在本机');}return;
  }
  if(key==='pick-portrait'){
    filePick('image/jpeg,image/png,image/webp',src=>{
      if(currentRoute()!=='portrait')return;
      pendingPhoto=src;(dn('photo-2020')?.querySelector('img')||dn('photo-area')?.querySelector('img'))?.setAttribute('src',src);
    });return;
  }
  if(key.startsWith('person-')){
    const i=+key.slice(7);
    openBox('标记区域 '+(i+1),`<div class="choices">${elderRoles.map(label=>`<button class="chip" data-v2="choose-person-${i}" data-label="${esc(label)}">${esc(label)}</button>`).join('')}</div>`);return;
  }
  if(key.startsWith('choose-person-')){
    const i=+key.slice(14);v2Values.labels??=state.labels.slice();v2Values.labels[i]=el.dataset.label;
    setText([8201,8212,8223,8234,8242,8253,8267][i],el.dataset.label);dialog.close();return;
  }
  if(key==='save-portrait'){
    if(save({labels:v2Values.labels||state.labels,...(pendingPhoto?{portrait:pendingPhoto}:{})})){pendingPhoto='';go('room');toast('全家福设置已保存');}return;
  }
  if(key==='edit-list'){editingMedicine=!editingMedicine;render(false);return;}
  if(key.startsWith('med-toggle-')){
    const id=key.slice(11), medicinesNext=medicines().map(m=>m.id===id?{...m,alarm:!m.alarm}:m);
    if(saveElderList('meds',medicinesNext))draftToggle(el,medicinesNext.find(m=>m.id===id).alarm);return;
  }
  if(key.startsWith('unit-')||key.startsWith('frequency-')){
    const [field,value]=key.split('-');
    v2Values[field]=value;setText(field==='unit'?7857:7874,value);
    designRoot.querySelectorAll('[data-v2^="'+field+'-"]').forEach(item=>mark(item,item===el));return;
  }
  if(key==='edit-alarm'){v2Values.alarm=!v2Values.alarm;draftToggle(el,v2Values.alarm);return;}
  if(key.startsWith('focus-time-')){designRoot.querySelectorAll('[name="v2-time"]')[+key.slice(11)]?.focus();return;}
  if(key==='add-v2-time'||key.startsWith('remove-v2-time-')){
    captureTimes();
    if(key==='add-v2-time')v2Values.medicineTimes.push('12:00');
    else if(v2Values.medicineTimes.length>1)v2Values.medicineTimes.splice(+key.slice(15),1);
    else {toast('请保留至少一个服药时间');return;}
    renderTimes();return;
  }
  if(key==='save-med'){
    captureTimes();
    const [,param]=pathname().split('/');
    const name=val('med-name'), dose=+val('dose');
    if(!name||dose<=0||!Number.isFinite(dose)||v2Values.medicineTimes.some(t=>!t)){toast('请填写药名、有效剂量和服药时间');return;}
    const m={id:param||id(),name,dose,unit:v2Values.unit,frequency:v2Values.frequency,notes:val('notes'),alarm:v2Values.alarm,times:[...new Set(v2Values.medicineTimes)].sort()};
    const list=medicines();
    if(saveElderList('meds',param?list.map(item=>item.id===param?m:item):[...list,m])){go('meds');toast('药品已保存');}return;
  }
  if(key.startsWith('v2-template-')){
    const field=designRoot.querySelector('[name="v2-message"]');field.value=templateText[+key.slice(12)];field.focus();return;
  }
  if(key==='send-message'){writeDesignMessage();return;}
  if(key==='example-voice'){speakExample();return;}
  if(key==='demo-elder'||key==='edit-demo-elder'){
    const otherElders=state.otherElders.some(e=>e.id==='guilan')?state.otherElders:[...state.otherElders,{id:'guilan',name:'张桂兰',age:69,health:'示例档案'}];
    if(save({otherElders,...(key==='demo-elder'?{activeElder:'guilan'}:{})}))go(key==='demo-elder'?'home':'elders/guilan');return;
  }
  if(key==='family-add'){
    openBox('邀请家属',form('member',field('姓名','name','','required maxlength="20"')+submit('添加演示成员')));return;
  }
  if(key.startsWith('family-remove-')){
    const name=starter.family[+key.slice(14)];
    if(confirm('移除 '+name+'？')&&save({family:state.family.filter(e=>e!==name)}))render(false);return;
  }
  if(key.startsWith('listen-v2-')){const i=+key.slice(10);if(i===0&&!state.recordings?.[0])speakExample();else playVoice(i);return;}
  if(key.startsWith('record-v2-')){record(+key.slice(10));return;}
  if(key==='settings-alerts'){if(save({alerts:!state.alerts}))toast(state.alerts?'本机提醒已开启':'本机提醒已关闭');return;}
  if(key==='settings-font'){
    openBox('字号调节',`<div class="choices">${['标准','大','特大'].map(label=>`<button class="chip" data-v2="font-${label}">${label}</button>`).join('')}</div>`);return;
  }
  if(key.startsWith('font-')){if(save({font:key.slice(5)})){dialog.close();setText(7613,state.font);}return;}
  if(key==='settings-exit'){if(save({joined:false}))go('login');return;}
  if(key.startsWith('settings-')){
    const label=el.getAttribute('aria-label');
    openBox(esc(label),'<p>忆家子女端 2.0 · 作品集演示。此处展示本机演示状态。</p>');return;
  }
}
function startDesign() {
  window.addEventListener('resize',fitDesign);
  window.addEventListener('hashchange',()=>{queuedPhoto='';v2Values.labels=null;v2Values.editInitialized=false;},true);
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-v2]');
    if(target){event.preventDefault();handleDesign(target.dataset.v2,target);}
  });
  document.addEventListener('keydown',event=>{
    const target=event.target.closest('[data-v2][role]');
    if(target&&['Enter',' '].includes(event.key)){event.preventDefault();target.click();}
    if(event.key==='Enter'&&event.target.matches('.figma-input[name=code],.figma-input[name=password]'))handleDesign('login-submit',event.target);
  });
  dialog.addEventListener('submit',event=>{
    if(event.target.dataset.form==='member'&&dialog.open)dialog.close();
  });
}
