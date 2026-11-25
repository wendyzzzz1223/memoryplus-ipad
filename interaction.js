export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const center=points=>({x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length});
const fingers=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
function straight(a,b,c){
  const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;
  return (ux*vx+uy*vy)/Math.max(.000001,Math.hypot(ux,uy)*Math.hypot(vx,vy));
}

export function readHand(points,aspect){
  const p=points.map(p=>({x:p.x*aspect,y:p.y}));
  const palm=center([p[0],p[5],p[9],p[13],p[17]]);
  const scale=Math.max(.018,gap(p[0],p[9]),gap(p[5],p[17]));
  const states=fingers.map(([base,joint,end,tip])=>{
    const spread=gap(p[tip],p[base])/Math.max(.006,gap(p[joint],p[base])+gap(p[end],p[joint])+gap(p[tip],p[end]));
    if(spread>.83 && straight(p[base],p[joint],p[tip])<-.64)return 'up';
    if(spread<.72 || straight(p[base],p[joint],p[tip])>-.38)return 'down';
    return 'mid';
  });
  const [index,middle,ring,pinky]=states;
  const up=states.filter(x=>x==='up').length;
  const down=states.filter(x=>x==='down').length;
  const thumbAway=gap(p[4],p[5])/scale;
  const thumbOpen=thumbAway>.66&&straight(p[2],p[3],p[4])<-.56;
  const thumbDX=p[4].x-p[2].x,thumbDY=p[4].y-p[2].y;
  const fingerTips=[p[8],p[12],p[16],p[20]];
  const foldedCenter=center(fingerTips);
  const vertical=Math.abs(thumbDY)>=Math.abs(thumbDX);
  const axis=vertical?thumbDY:thumbDX;
  const cross=vertical?thumbDX:thumbDY;
  const separation=vertical?p[4].y-foldedCenter.y:p[4].x-foldedCenter.x;
  let thumb=null;
  if(up===0&&down>=3&&Math.abs(axis)>Math.max(.29*scale,Math.abs(cross)*1.12)
    && straight(p[2],p[3],p[4])<-.53 && separation*Math.sign(axis)>.35*scale){
    // The preview is mirrored, so horizontal gestures follow the on-screen hand.
    thumb=vertical?(axis<0?'up':'down'):(axis<0?'right':'left');
  }
  const allTips=[p[4],...fingerTips];
  const tipCenter=center(allTips);
  const together=Math.max(...allTips.map(t=>gap(t,tipCenter)))/scale<.48&&gap(p[4],p[12])/scale<.48;
  const fist=down>=3&&up===0&&gap(p[8],p[5])/scale<.75;
  const spreadV=gap(p[8],p[12])/scale>.28;
  const v=index==='up'&&middle==='up'&&ring==='down'&&pinky==='down'&&spreadV&&!thumbOpen;
  const threeTipGap=Math.max(gap(p[4],p[8]),gap(p[4],p[12]),gap(p[8],p[12]))/scale;
  let number=0;
  // Chinese seven: THREE pinched tips, visibly ahead of the two curled fingers.
  const pinchCenter=center([p[4],p[8],p[12]]);
  const foldedPair=center([p[16],p[20]]);
  const chineseSeven=ring==='down'&&pinky==='down'&&threeTipGap<.43
    &&gap(p[12],p[9])/scale>.45&&gap(pinchCenter,foldedPair)/scale>.28;
  if(chineseSeven)number=7;
  else if(up===4&&!thumbOpen)number=4;
  else if(up===3&&down===1&&!thumbOpen)number=3;
  else if(v)number=2;
  else if(up===4&&thumbOpen)number=5;
  else if(pinky==='up'&&down===3&&thumbOpen)number=6;
  else if(index==='up'&&down===3)number=thumbOpen?8:1;
  return {
    palm:{x:1-palm.x/aspect,y:palm.y},
    tip:{x:1-points[8].x,y:points[8].y},
    thumb,number,
    pointing:index==='up'&&middle!=='up'&&ring!=='up'&&pinky!=='up',
    indexBent:index==='down',
    closed:fist||together,
    open:up>=3&&down===0&&!together,
  };
}

// A posture must be seen in consecutive frames, not a single confident guess.
export class Hold {
  value=null; since=0; last=0; fired=false; frames=0;
  reset(){this.value=null;this.fired=false;this.frames=0;}
  read(value,now,ms){
    if(!value){this.reset();return {fire:false,progress:0};}
    if(value!==this.value||now-this.last>260){
      this.value=value;this.since=now;this.fired=false;this.frames=0;
    }
    this.last=now;
    this.frames++;
    const progress=this.frames<2?0:clamp((now-this.since)/ms);
    const fire=progress>=1&&!this.fired&&this.frames>=3;
    if(fire)this.fired=true;
    return {fire,progress};
  }
}

export class SteadyPoint {
  point=null;
  update(next,now,slow=95){
    if(!this.point||now-this.time>270){this.point=next;this.time=now;return next;}
    const delta=gap(next,this.point);
    const dt=Math.max(12,now-this.time);
    this.time=now;
    if(delta<.0025)return this.point;
    const alpha=1-Math.exp(-dt/(delta>.05?28:slow));
    this.point={x:this.point.x+(next.x-this.point.x)*alpha,y:this.point.y+(next.y-this.point.y)*alpha};
    return this.point;
  }
  reset(){this.point=null;}
}

export class Swipe {
  samples=[]; lockedAt=-Infinity; previous=null;
  reset(){this.samples=[];this.previous=null;this.lockedAt=-Infinity;}
  update(point,now){
    if(!point){this.samples=[];this.previous=null;return null;}
    if(this.previous&&now-this.previous.t>220){this.samples=[];this.previous=null;}
    this.previous={...point,t:now};
    this.samples=this.samples.filter(x=>now-x.t<=480);
    this.samples.push(this.previous);
    if(this.lockedAt!==-Infinity){
      const recent=this.samples.filter(x=>now-x.t<=200);
      const settled=now-recent[0].t>=95&&recent.every(x=>gap(x,point)<.028);
      if(now-this.lockedAt<340||!settled)return null;
      this.lockedAt=-Infinity;this.samples=[this.previous];
    }
    for(const start of this.samples){
      if(now-start.t<55)continue;
      const x=point.x-start.x,y=point.y-start.y;
      let direction=null;
      if(Math.abs(x)>=.078&&Math.abs(x)>Math.abs(y)*1.33)direction=x>0?'right':'left';
      else if(Math.abs(y)>=.073&&Math.abs(y)>Math.abs(x)*1.33)direction=y>0?'down':'up';
      if(direction){this.samples=[];this.lockedAt=now;return direction;}
    }
    return null;
  }
}

export const identity=()=>[1,0,0,0,1,0,0,0,1];
const steps={
  right:[0,0,1,0,1,0,-1,0,0],
  left:[0,0,-1,0,1,0,1,0,0],
  up:[1,0,0,0,0,-1,0,1,0],
  down:[1,0,0,0,0,1,0,-1,0],
};
export function turnTile(matrix,direction){
  const step=steps[direction];
  return matrix.map((_,i)=>{
    const row=Math.floor(i/3)*3,col=i%3;
    return step[row]*matrix[col]+step[row+1]*matrix[col+3]+step[row+2]*matrix[col+6];
  });
}
export function tileUpright(matrix){return matrix[8]===1&&matrix[4]===1;}

export function nextTileTurn(matrix){
  if(tileUpright(matrix))return null;
  const queue=[{matrix,first:null}];
  const seen=new Set([matrix.join(',')]);
  for(const entry of queue){
    for(const direction of Object.keys(steps)){
      const next=turnTile(entry.matrix,direction),key=next.join(',');
      if(seen.has(key))continue;
      const first=entry.first??direction;
      if(tileUpright(next))return first;
      seen.add(key);queue.push({matrix:next,first});
    }
  }
  return null;
}

export function tileFace(matrix){
  if(tileUpright(matrix))return '正面朝前，牌身竖直';
  if(matrix[8]===1)return '正面已朝前，还要把牌立正';
  if(matrix[8]===-1)return '牌背朝前';
  if(matrix[6]!==0)return '侧边朝前';
  return '上下边朝前';
}
export function cssMatrix(m){
  return 'matrix3d('+[m[0],m[3],m[6],0,m[1],m[4],m[7],0,m[2],m[5],m[8],0,0,0,0,1].join(',')+')';
}

export function traceResult(strokes){
  let total=0,traced=0,next;
  let done=strokes.length>0;
  for(const {samples} of strokes){
    const missing=samples.filter(sample=>!sample.hit);
    let run=0,longest=0;
    for(const sample of samples){
      run=sample.hit?0:run+1;
      longest=Math.max(longest,run);
    }
    // Accept tiny sampling gaps at corners, while still requiring every stroke.
    done=done&&samples.length>2&&missing.length<=Math.max(1,Math.floor(samples.length*.05))&&longest<=2;
    total+=samples.length;
    traced+=samples.length-missing.length;
    next??=missing[0];
  }
  return {done,percent:done?100:total?Math.floor(100*traced/total):0,next:done?undefined:next};
}
