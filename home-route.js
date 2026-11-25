const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function inArrival(point,destination,options={}){
 const area=options.arrivalArea;
 return area?point.x>=area[0]&&point.x<=area[1]&&point.z>=area[2]&&point.z<=area[3]:distance(point,destination)<=(options.arrivalRadius??1.05);
}
export function validateRoute(points,blocked,start,destination,options={}){
 if(points.length<2)return {valid:false,message:'从橙色「从这里出发」开始，画到目标房间。'};
 let drawn=points;
 if(distance(drawn[0],start)>1.1&&distance(drawn.at(-1),start)<=1.1)drawn=[...drawn].reverse();
 if(distance(drawn[0],start)>1.1)return {valid:false,message:'请从橙色「从这里出发」旁开始画。'};
 const route=[start,...drawn],sampled=[];
 for(let i=1;i<route.length;i++){
  const from=route[i-1],to=route[i],count=Math.max(1,Math.ceil(distance(from,to)/.06));
  for(let j=0;j<=count;j++){
   const t=j/count,p={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t};
   if(blocked(p.x,p.z))return {valid:false,message:'这里有墙或家具。点「提示」看看从哪里走。'};
   if(!sampled.length||distance(sampled.at(-1),p)>.0001)sampled.push(p);
   // Stop when the route enters the destination area, even if the user keeps drawing onto a bed.
   if(sampled.length>3&&distance(p,start)>.35&&inArrival(p,destination,options))return {valid:true,points:sampled,message:'已经画到目标区域了，点「走过去」即可。'};
  }
 }
 return {valid:false,message:'再往目标房间画一点，进入房间的空地就可以。'};
}
// A collision-aware guide is shown only after the user asks for help.
export function findGuideRoute(start,destination,blocked,options={}){
 const spacing=.16,key=(x,z)=>x+','+z;
 const source={x:Math.round(start.x/spacing),z:Math.round(start.z/spacing)};
 const queue=[source],seen=new Map([[key(source.x,source.z),null]]);let found=null;
 for(let head=0;head<queue.length&&head<18000;head++){
  const node=queue[head],p={x:node.x*spacing,z:node.z*spacing};
  if(inArrival(p,destination,options)&&distance(p,start)>.35){found=node;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const n={x:node.x+dx,z:node.z+dz},k=key(n.x,n.z),x=n.x*spacing,z=n.z*spacing;
   if(seen.has(k)||x< -5||x>9||z< -3.6||z>3.6||blocked(x,z)||blocked((x+p.x)/2,(z+p.z)/2))continue;
   seen.set(k,node);queue.push(n);
  }
 }
 if(!found)return [];
 const path=[];let node=found;while(node){path.unshift({x:node.x*spacing,z:node.z*spacing});node=seen.get(key(node.x,node.z));}
 path[0]={...start};return path;
}
