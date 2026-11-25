export const ad8=[
 ['您的判断力和以前相比有变化吗？','比如算账变困难、常作出错误决定，或容易迷路。'],
 ['您对原来喜欢的事没那么感兴趣了吗？','比如较少参加活动，或很少出门。'],
 ['您是否经常重复同一件事？','比如反复问同一个问题，或重复说同一句话。'],
 ['您学习使用日常工具或家用电器时有困难吗？','例如遥控器或微波炉。'],
 ['您是否记不清现在是几月或哪一年？',''],
 ['您处理自己的财务时有困难吗？','比如忘记付账单，或不记得怎样使用存折。'],
 ['您是否容易忘记和别人约好的事？','例如忘记家庭聚会或拜访计划。'],
 ['您的日常记忆或思考能力出现了变化吗？','例如找不到刚放下的物品，或忘记服药和计划要买的东西。']
];
const words='面孔、丝绒、寺庙、菊花、红色';
const digits='52139411806215194511141905112';
export const tasks=[
 {title:'请按数字和汉字交替的顺序连线。',hint:'从 1 开始，按 1 → 甲 → 2 → 乙 的顺序继续。',kind:'trail'},
 {title:'请照着示例画一个立方体。',kind:'draw',asset:'cube'},
 {title:'请画一个钟，标出 11 点 10 分。',hint:'请画出轮廓、数字和指针。',kind:'draw'},
 {title:'请依次说出图中三种动物的名称。',kind:'text',asset:'animals',fields:['第一张','第二张','第三张']},
 {title:'请听五个词，并在每次听完后复述。',hint:'共练习两次。稍后还会请您回忆这些词。',kind:'text',audio:words,fields:['第一次复述','第二次复述']},
 {title:'请听数字。第一组按原顺序复述，第二组倒着复述。',kind:'text',audio:'第一组。2，1，8，5，4。第二组。7，4，2。',fields:['第一组','第二组']},
 {title:'听到数字 1 时，点一下按钮。',hint:'先点「播放题目」开始。',kind:'tap',audio:digits},
 {title:'从 100 开始连续减 7，写下五次的结果。',kind:'text',fields:['第一次','第二次','第三次','第四次','第五次'],numeric:true},
 {title:'请复述两句话，再在一分钟内说出尽可能多的「yi」同音字开头的词。',kind:'text',audio:'我只知道今天小张来帮忙。狗在房间时，猫总躲在沙发下面。',fields:['第一句','第二句','用「yi」开头的词']},
 {title:'请说说每对物品有什么共同点。',kind:'text',fields:['火车和自行车','手表和直尺']},
 {title:'请回忆刚才听过的五个词，再回答今天的时间和地点。',kind:'text',fields:['记得的词','日期','月份','年份','星期几','地点','城市']}
];
export function referral(stage,back){
 const root=document.createElement('section');root.className='referral-view';
 root.innerHTML='<header><button class="outline" type="button">← 返回报告</button><div><h1>忆家 · 医生阅览室</h1><span>模拟对话</span></div></header><main><div class="chat outgoing"><small>王爷爷</small><div class="report-file"><span aria-hidden="true">▤</span><div><strong>王爷爷的认知自查报告</strong><p>评估报告 · 示例文件</p></div></div></div><div class="chat"><small>忆家官方</small><p>稍等，王爷爷，这边已同步给医院，正在分配医生。</p></div><div class="chat-time">3 小时后</div><div class="chat"><small>周医生 · 记忆门诊</small><p>根据您的报告，您目前的整体认知表现还可以，记忆力和视空间能力有些退化。建议您有空来医院详细就诊。</p></div><div class="chat outgoing"><small>女儿涵涵</small><p>好的，谢谢医生。我们已经预约了周六您的号。</p></div></main>';
 const avatars=[
  ['assets/113-3801-af0f1.png','王爷爷'],['assets/113-3769-d64b7.png','忆家官方'],
  [null,'周医生'],['assets/113-5164-a4390.png','女儿涵涵']
 ];
 root.querySelectorAll('.chat').forEach((message,index)=>{
  const [src,name]=avatars[index];
  const row=document.createElement('div');
  row.className='chat-row'+(message.classList.contains('outgoing')?' outgoing':'');
  const avatar=document.createElement('span');avatar.className='chat-avatar';avatar.setAttribute('aria-hidden','true');
  if(src){const img=new Image();img.src=src;img.alt='';avatar.append(img);}
  else avatar.textContent=name.slice(0,1);
  if(index===1)avatar.classList.add('official-avatar');
  message.before(row);row.append(avatar,message);
 });
 root.querySelector('button').onclick=back;stage.append(root);
}
