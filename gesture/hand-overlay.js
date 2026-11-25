// Use the same contain-fit rectangle for video, foreground pixels and the pen.
export function videoFrame(rect,aspect=4/3){
  const width=Math.min(rect.width,rect.height*aspect),height=width/aspect;
  return {left:rect.left+(rect.width-width)/2,top:rect.top+(rect.height-height)/2,width,height};
}
const fingers=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
const limbs=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]];
function capsule(ctx,a,b,r){
  const angle=Math.atan2(b.y-a.y,b.x-a.x),x=Math.sin(angle)*r,y=-Math.cos(angle)*r;
  ctx.moveTo(a.x+x,a.y+y);ctx.lineTo(b.x+x,b.y+y);
  ctx.arc(b.x,b.y,r,angle-Math.PI/2,angle+Math.PI/2);
  ctx.lineTo(a.x-x,a.y-y);ctx.arc(a.x,a.y,r,angle+Math.PI/2,angle+3*Math.PI/2);ctx.closePath();
}
export function paintHandOverlay({canvas,ctx,video,view,points,foreground}){
  const vw=video.videoWidth||640,vh=video.videoHeight||480;
  if(canvas.width!==vw*2||canvas.height!==vh*2){canvas.width=vw*2;canvas.height=vh*2;}
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);if(!points)return;
  const p=points.map(p=>({x:(1-p.x)*w,y:p.y*h}));
  // Only replace the part of the tile occupied by the hand; prompts stay readable.
  // A landmark-derived contour is approximate, but all foreground pixels are live video.
  if(foreground&&video.readyState>=2){
    const f=videoFrame(view.getBoundingClientRect(),vw/vh),r=foreground.getBoundingClientRect();
    ctx.save();ctx.beginPath();ctx.rect((r.left-f.left)/f.width*w,(r.top-f.top)/f.height*h,r.width/f.width*w,r.height/f.height*h);ctx.clip();
    const scale=Math.max(Math.hypot(p[0].x-p[9].x,p[0].y-p[9].y),Math.hypot(p[5].x-p[17].x,p[5].y-p[17].y));
    ctx.beginPath();const palm=[0,1,2,5,9,13,17];
    ctx.moveTo(p[0].x,p[0].y);for(const i of palm.slice(1))ctx.lineTo(p[i].x,p[i].y);ctx.closePath();
    for(const chain of fingers)for(let i=0;i<chain.length-1;i++)capsule(ctx,p[chain[i]],p[chain[i+1]],Math.max(4,scale*(chain[0]===1?.105:.078)));
    ctx.clip();ctx.translate(w,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,w,h);ctx.restore();
  }
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#88f1ce';ctx.lineWidth=4;ctx.beginPath();
  for(const [i,...chain] of limbs){ctx.moveTo(p[i].x,p[i].y);for(const j of chain)ctx.lineTo(p[j].x,p[j].y);}ctx.stroke();
  ctx.fillStyle='#ffc783';for(const i of [4,8,12,16,20]){ctx.beginPath();ctx.arc(p[i].x,p[i].y,6,0,2*Math.PI);ctx.fill();}
}
