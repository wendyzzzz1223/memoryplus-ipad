const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const activities=[
 {id:'water',title:'给花浇水',short:'半握手，慢慢抬起',instruction:'假装握住水壶，慢慢抬起手。',detail:'手指轻轻弯着，像拿着一个小水壶。',steps:['轻轻握住','慢慢抬起','给花浇水'],success:'花儿喝到水啦！',kind:'fill'},
 {id:'pour',title:'倒一杯水',short:'半握手，向一侧倾斜',instruction:'假装握住水壶，向旁边倾斜。',detail:'把手轻轻歪一点，水就会流进杯子。',steps:['轻轻握住','歪一歪手','慢慢倒水'],success:'水倒好了！',kind:'fill'},
 {id:'fridge',title:'拉开冰箱门',short:'向前伸，再向旁边拉',instruction:'假装握住把手，向前伸，再往旁边拉。',detail:'左右手都可以，轻轻画出一段弧线。',steps:['轻轻握住','向前伸手','向旁边拉'],success:'冰箱门打开啦！',kind:'pull'},
 {id:'wipe',title:'擦一擦桌子',short:'放平手掌，左右擦一擦',instruction:'假装拿着抹布，左右擦一擦。',detail:'张手或轻轻握着都可以，来回擦几下。',steps:['放平手掌','左右来回擦','桌面变干净'],success:'桌子擦干净啦！',kind:'wipe'},
 {id:'stir',title:'搅拌一杯茶',short:'半握手，慢慢画两个圈',instruction:'假装拿着小勺，慢慢画两个圈。',detail:'顺着或反着画都可以，圈不用画得很圆。',steps:['轻轻握住','慢慢画圈','搅拌均匀'],success:'搅拌好了！',kind:'circle'},
 {id:'drawer',title:'拉开抽屉',short:'向前伸，再往身边拉',instruction:'假装握住把手，往自己身边拉。',detail:'先向前伸一点，再慢慢收回手。',steps:['轻轻握住','向前伸手','往身边拉'],success:'抽屉拉开啦！',kind:'pull'}
];
// Relaxed curl is accepted; a tightly closed fist is never required. Coordinates are mirrored.
export function handSample(points,aspect=4/3){
 if(!points?.[20]||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const p=points.map(p=>({x:p.x*aspect,y:p.y}));
 const bases=[0,5,9,13,17],center={x:1-bases.reduce((s,i)=>s+points[i].x,0)/5,y:bases.reduce((s,i)=>s+points[i].y,0)/5};
 let curved=0,extended=0;
 for(const [a,b,c,d] of [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]){
  const span=dist(p[d],p[a])/Math.max(.001,dist(p[a],p[b])+dist(p[b],p[c])+dist(p[c],p[d]));
  const u={x:p[a].x-p[b].x,y:p[a].y-p[b].y},v={x:p[d].x-p[b].x,y:p[d].y-p[b].y};
  const cosine=(u.x*v.x+u.y*v.y)/Math.max(.00001,Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y));
  if(span<.94||cosine>-.90)curved++;else extended++;
 }
 const size=Math.max(dist(p[0],p[9]),dist(p[5],p[17]));
 if(size<.035||size>.65)return null;
 return {center,size,grip:curved>=2,open:extended>=3,angle:Math.atan2(-(p[9].x-p[0].x),-(p[9].y-p[0].y))};
}
const angleGap=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export class MotionPractice{
 constructor(id,easy=true){this.id=id;this.easy=easy;this.reset();}
 reset(){this.progress=0;this.origin=null;this.pending=null;this.count=0;this.last=null;this.lastAt=null;this.flow=false;this.reached=false;this.pullStart=null;this.path=[];this.leg=0;this.direction=0;this.anchor=null;this.phase=0;this.message='半握着手，放进画面就可以。';}
 pause(){this.flow=false;this.lastAt=null;this.last=null;this.origin=null;this.pending=null;this.count=0;this.reached=false;this.pullStart=null;this.anchor=null;this.path=[];this.direction=0;this.phase=0;}
 result(active=false){return {progress:this.progress,active,phase:this.progress>=1?3:this.phase,done:this.progress>=1,message:this.message,flow:this.flow};}
 update(sample,now){
  if(this.progress>=1)return this.result();
  const dt=this.lastAt===null?0:Math.min(.14,Math.max(0,(now-this.lastAt)/1000));this.lastAt=now;this.flow=false;
  if(!sample){this.pause();this.message='没看清手，把手放回画面就能继续。';return this.result();}
  const allowed=this.id==='wipe'?(sample.open||sample.grip):sample.grip;
  if(!allowed){this.last=null;this.pending=null;this.count=0;this.message=this.id==='wipe'?'把手掌放平，像拿着抹布。':'手指轻轻弯着就好，不用握紧。';return this.result();}
  if(!this.origin){
   this.pending??={...sample.center,size:sample.size,angle:sample.angle,at:now};this.count++;
   this.message='看见手了，放松停一下。';
   if(this.count<3||now-this.pending.at<180)return this.result();
   this.origin={...sample.center,size:sample.size,angle:sample.angle};this.anchor={...sample.center};this.phase=1;
  }
  const c=sample.center,o=this.origin,dy=o.y-c.y,side=Math.abs(c.x-o.x),tilt=Math.abs(angleGap(sample.angle,o.angle));
  const factor=this.easy?.78:1;
  let active=false;
  if(this.id==='water'||this.id==='pour'){
   active=this.id==='water'?(dy>.075*factor||tilt>.36*factor):(tilt>.32*factor);
   this.phase=active?2:1;this.flow=active;
   this.message=active?(this.id==='water'?'正在浇水，慢慢来。':'正在倒水，慢慢来。'):(this.id==='water'?'手看见了，像拿水壶一样慢慢抬起。':'手看见了，向旁边轻轻歪一点。');
   if(active)this.progress=clamp(this.progress+dt/3.1);
  }else if(this.id==='fridge'||this.id==='drawer'){
   if(!this.reached){
    this.message='握着手，向前伸一点。';
    // Apparent palm size and wrist displacement are proxies for a reach, not elbow-angle measurement.
    if(sample.size>o.size*(1+.12*factor)||dy>.055*factor){this.reached=true;this.pullStart={...c,size:sample.size};this.phase=2;}
   }else{
    const start=this.pullStart;
    const motion=this.id==='fridge'?Math.abs(c.x-start.x)/(.20*factor):Math.max((c.y-start.y)/(.145*factor),(start.size/Math.max(.01,sample.size)-1)/(.22*factor));
    if(this.id==='fridge')this.message='现在向旁边慢慢拉，门跟着手打开。';else this.message='现在把手往自己身边收，抽屉跟着拉开。';
    const target=clamp(motion);this.progress=Math.max(this.progress,Math.min(this.progress+dt*1.8,target));active=motion>.03;
   }
  }else if(this.id==='wipe'){
   const dx=c.x-this.anchor.x;this.message='对了，左右来回擦一擦。';this.phase=2;
   if(Math.abs(dx)>.085*factor){const direction=Math.sign(dx);if(this.direction===0||direction!==this.direction){this.leg++;this.direction=direction;this.progress=clamp(this.leg/4);}this.anchor={...c};active=true;}
  }else if(this.id==='stir'){
   if(!this.last||dist(c,this.last)>.009){this.path.push({...c});if(this.path.length>220)this.path.shift();}
   this.phase=2;this.message='慢慢画圈，不用画得很圆。';
   if(this.path.length>9){
    const xs=this.path.map(p=>p.x),ys=this.path.map(p=>p.y),width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
    if(width>.07*factor&&height>.06*factor){
     const center={x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2};let turn=0;
     for(let i=1;i<this.path.length;i++){const a=this.path[i-1],b=this.path[i];turn+=angleGap(Math.atan2(b.y-center.y,b.x-center.x),Math.atan2(a.y-center.y,a.x-center.x));}
     this.progress=Math.max(this.progress,clamp(Math.abs(turn)/(Math.PI*2*1.65)));active=true;
    }
   }
  }
  this.last={...c};if(this.progress>=1){this.message=activities.find(a=>a.id===this.id).success;this.flow=false;}
  return this.result(active);
 }
}
