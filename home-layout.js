export const IPAD_FRAME={width:1366,height:1024};
export function frameScale(width,height){return Math.min(width/IPAD_FRAME.width,height/IPAD_FRAME.height);}
// Include wall height and leave room below the floor plan for the departure controls.
export function planDistance(width,height,fov=36){
 const aspect=width/Math.max(1,height);
 const halfSpan=Math.max(14.5/(aspect*.9),7.7/.8)/2;
 return 2.4+halfSpan/Math.tan(fov*Math.PI/360);
}
