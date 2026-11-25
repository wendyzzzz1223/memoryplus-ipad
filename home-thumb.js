// Rotation- and hand-size-independent thumb flexion from the camera landmarks.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function thumbFlex(points,aspect=4/3){
 if(!points?.[20])return {valid:false,openness:0,bent:false};
 const p=points.map(p=>({x:p.x*aspect,y:p.y}));
 const size=Math.max(distance(p[0],p[9]),distance(p[5],p[17]),.02);
 const a={x:p[2].x-p[3].x,y:p[2].y-p[3].y},b={x:p[4].x-p[3].x,y:p[4].y-p[3].y};
 const straight=-(a.x*b.x+a.y*b.y)/Math.max(.00001,Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y));
 const openness=distance(p[4],p[5])/size;
 return {valid:true,openness,bent:straight<.62||openness<.32,straight};
}
// One press per release→bend cycle. Tracking loss disarms, so reacquiring a fist cannot turn on a device.
export class ThumbPress{
 reset(){this.phase='release';this.since=null;this.baseline=0;this.amount=0;}
 constructor(){this.reset();}
 update(signal,now){
  if(!signal?.valid){this.reset();return {fire:false,amount:0,ready:false};}
  let fire=false;
  if(this.phase==='release'){
   const relaxed=!signal.bent&&signal.openness>.42;
   if(!relaxed)this.since=null;
   else {this.since??=now;this.baseline=Math.max(this.baseline,signal.openness);if(now-this.since>=220){this.phase='armed';this.since=null;}}
  }else if(this.phase==='armed'){
   const delta=this.baseline-signal.openness;
   this.amount=Math.max(0,Math.min(1,delta/.22));
   const bent=signal.bent||delta>Math.max(.12,this.baseline*.22);
   if(!bent){this.since=null;this.baseline=Math.max(this.baseline*.995,signal.openness);}
   else {this.since??=now;if(now-this.since>=130){fire=true;this.phase='pressed';this.since=null;this.amount=1;}}
  }else{
   this.amount=1;
   if(!signal.bent&&signal.openness>this.baseline*.87){this.phase='release';this.since=now;this.amount=0;this.baseline=signal.openness;}
  }
  return {fire,amount:this.amount,ready:this.phase==='armed',phase:this.phase};
 }
}
