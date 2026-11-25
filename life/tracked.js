const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Mirror coordinates are already supplied by handSample; account for cover-cropping before placing the handle.
export function trackedJug(point,angle,frame,aspect=4/3){
 const width=Math.max(frame.width,frame.height*aspect),height=width/aspect;
 const scale=Math.min(frame.width/1000,frame.height/700);
 const x=clamp(((frame.width-width)/2+point.x*width-(frame.width-scale*1000)/2)/scale,130,810);
 const y=clamp(((frame.height-height)/2+point.y*height-(frame.height-scale*700)/2)/scale,145,540);
 const rotation=clamp(angle,-.85,.85),factor=.72;
 const dx=(575-250)*factor,dy=(135-195)*factor;
 return {x,y,rotation,transform:`translate(${x} ${y}) rotate(${rotation*180/Math.PI}) scale(${factor}) translate(-250 -195)`,spout:{x:x+Math.cos(rotation)*dx-Math.sin(rotation)*dy,y:y+Math.sin(rotation)*dx+Math.cos(rotation)*dy}};
}
