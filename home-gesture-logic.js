export const homeLessons=[
 {title:'把双手放进镜头',text:'张开双手，停一会儿。坐着练习就可以。',kind:'open'},
 {title:'双手移动看四周',text:'张开双手，一起慢慢向左或向右移动，就像转头看看房间。',kind:'look'},
 {title:'用食指指一指',text:'伸食指画路线，收起食指结束。指向普通按钮停一下，就能点按。',kind:'point'},
 {title:'握拳拿起，张手放下',text:'先握拳，轻轻移动，再张开手。用来拿物品、拉开门或抽屉。',kind:'grab'},
 {title:'用大拇指按遥控器',text:'四根手指握住遥控器，拇指先放松伸开，再轻轻弯一下，按下开机键。不要竖大拇指。',kind:'press'},
 {title:'双手一起捧住',text:'两只手轻轻握住，向上抬一点，再一起张开。用来拿碗、放碗。',kind:'carry'},
 {title:'拇指向上出发，向下看提示',text:'路线画好后，拇指向上停一下就出发。拇指向下可以看提示，也能直接点按钮。',kind:'thumb'},
 {title:'一手扶杯，一手倒水',text:'一只手握住杯子，另一只手慢慢向旁边倾斜。只操作屏幕里的水壶。',kind:'pour'}
];
export function tilted(points){if(!points?.[9]||!points?.[0])return false;const dx=points[9].x-points[0].x,dy=points[9].y-points[0].y;return Math.abs(dx)>Math.abs(dy)*.8&&Math.hypot(dx,dy)>.03;}
export function practiceMatches(kind,poses,history){
 if(kind==='open')return poses.length===2&&poses.every(p=>p.open);
 if(kind==='look'){if(poses.length!==2||!poses.every(p=>p.open))return false;const x=(poses[0].palm.x+poses[1].palm.x)/2;history.lookX??=x;return Math.abs(x-history.lookX)>.055;}
 if(kind==='press'){if(poses.some(p=>p.thumbSignal?.openness>.42&&!p.thumbSignal?.bent))history.relaxed=true;return !!history.relaxed&&poses.some(p=>p.thumbSignal?.bent);}
 if(kind==='point')return poses.some(p=>p.pointing);
 if(kind==='thumb'){if(poses.some(p=>p.thumb==='up'))history.up=true;if(poses.some(p=>p.thumb==='down'))history.down=true;return !!history.up&&!!history.down;}
 if(kind==='grab'){if(poses.some(p=>p.closed))history.grabbed=true;return !!history.grabbed&&poses.some(p=>p.open);}
 if(kind==='carry'){
  if(poses.length<2)return false;
  if(poses.every(p=>p.closed)){history.carryY??=(poses[0].palm.y+poses[1].palm.y)/2;if((poses[0].palm.y+poses[1].palm.y)/2<history.carryY-.05)history.lifted=true;}
  return !!history.lifted&&poses.every(p=>p.open);
 }
 return poses.length===2&&poses.some(p=>p.closed)&&poses.some(p=>p.tilted);
}
export class GestureGate{
 key='';since=0;latched=false;
 update(key,now,delay=650){if(!key){this.key='';this.latched=false;return false;}if(key!==this.key){this.key=key;this.since=now;this.latched=false;}if(!this.latched&&now-this.since>=delay){this.latched=true;return true;}return false;}
 reset(){this.key='';this.latched=false;this.since=0;}
}
