import {env,InferenceSession,Tensor} from './vendor/cpu/ort.wasm.min.js';
const asset=name=>new URL('./vendor/cpu/'+name,import.meta.url).href;
const palmIndices=[0,5,9,13,17,1,2];
const anchorCenters=[24,12].flatMap((side,i)=>Array.from({length:side*side*(i?6:2)},(_,j)=>{
  const k=Math.floor(j/(i?6:2));
  return [((k%side)+.5)/side,(Math.floor(k/side)+.5)/side];
}));

function imageInput(size){
  const surface=document.createElement('canvas');
  surface.width=size;surface.height=size;
  const ctx=surface.getContext('2d',{willReadFrequently:true});
  const rgb=new Float32Array(size*size*3);
  return {
    ctx,
    reset(){ctx.resetTransform();ctx.fillStyle='#000';ctx.fillRect(0,0,size,size);},
    tensor(){
      const rgba=ctx.getImageData(0,0,size,size).data;
      for(let i=0,j=0;i<rgba.length;i+=4){
        rgb[j++]=rgba[i]/255;rgb[j++]=rgba[i+1]/255;rgb[j++]=rgba[i+2]/255;
      }
      return new Tensor('float32',rgb,[1,size,size,3]);
    },
  };
}
async function run(net,input){
  const output=await net.run({[net.inputNames[0]]:input.tensor()});
  return net.outputNames.map(name=>output[name].data);
}
function handRegion(points){
  const a=points[0],b=points[2],angle=Math.atan2(b.x-a.x,a.y-b.y);
  const c=Math.cos(angle),s=Math.sin(angle);
  const x=points.map(p=>c*p.x+s*p.y),y=points.map(p=>-s*p.x+c*p.y);
  const left=Math.min(...x),right=Math.max(...x),top=Math.min(...y),bottom=Math.max(...y);
  const u=(left+right)/2,v=(top+bottom)/2-.4*(bottom-top);
  return {c,s,x:c*u-s*v,y:s*u+c*v,size:3*Math.max(right-left,bottom-top)};
}

export async function createDetector(){
  env.wasm.numThreads=1;env.wasm.wasmPaths=asset('');
  const options={executionProviders:['wasm']};
  const [palm,hand]=await Promise.all([
    InferenceSession.create(asset('palm_detection_mediapipe.onnx'),options),
    InferenceSession.create(asset('handpose_estimation_mediapipe.onnx'),options),
  ]);
  const pInput=imageInput(192),hInput=imageInput(224);
  let track=null,frames=0;
  async function findPalm(frame,w,h){
    const k=192/Math.max(w,h),x=(192-w*k)/2,y=(192-h*k)/2;
    pInput.reset();pInput.ctx.drawImage(frame,x,y,w*k,h*k);
    const [locations,scores]=await run(palm,pInput);
    let index=-1,score=.12;
    for(let i=0;i<scores.length;i++)if(scores[i]>score){index=i;score=scores[i];}
    if(index<0)return null;
    const [ax,ay]=anchorCenters[index];
    return Array.from({length:7},(_,i)=>({
      x:(locations[index*18+4+2*i]+192*ax-x)/k,
      y:(locations[index*18+5+2*i]+192*ay-y)/k,
    }));
  }
  async function findPalms(frame,w,h){
    const k=192/Math.max(w,h),x=(192-w*k)/2,y=(192-h*k)/2;
    pInput.reset();pInput.ctx.drawImage(frame,x,y,w*k,h*k);
    const [locations,scores]=await run(palm,pInput);const selected=[];
    const candidates=Array.from(scores, (score,index)=>({score,index})).filter(v=>v.score>.12).sort((a,b)=>b.score-a.score);
    for(const {index} of candidates){
      const [ax,ay]=anchorCenters[index];
      const points=Array.from({length:7},(_,i)=>({x:(locations[index*18+4+2*i]+192*ax-x)/k,y:(locations[index*18+5+2*i]+192*ay-y)/k}));
      const region=handRegion(points);
      if(!Number.isFinite(region.size)||region.size<20)continue;
      if(selected.some(other=>Math.hypot(other.region.x-region.x,other.region.y-region.y)<Math.max(28,.4*Math.min(other.region.size,region.size))))continue;
      selected.push({points,region});if(selected.length===4)break;
    }
    return selected.map(item=>item.points);
  }
  async function findHand(frame,palmPoints){
    const {x,y,c,s,size}=handRegion(palmPoints);
    if(!Number.isFinite(size)||size<16)return null;
    const k=224/size;
    hInput.reset();
    hInput.ctx.setTransform(k*c,-k*s,k*s,k*c,112-k*(c*x+s*y),112-k*(-s*x+c*y));
    hInput.ctx.drawImage(frame,0,0);
    const [screen,confidence]=await run(hand,hInput);
    if(confidence[0]<.60)return null;
    return Array.from({length:21},(_,i)=>{
      const u=(screen[i*3]-112)/k,v=(screen[i*3+1]-112)/k;
      return {x:x+c*u-s*v,y:y+s*u+c*v};
    });
  }
  return {
    reset(){track=null;frames=0;},
    dispose(){return Promise.allSettled([palm.release(),hand.release()]);},
    async detectMany(frame){
      const w=frame.videoWidth||frame.naturalWidth||frame.width,h=frame.videoHeight||frame.naturalHeight||frame.height;
      if(!w||!h)return [];
      const candidates=await findPalms(frame,w,h),results=[];
      for(const candidate of candidates){const points=await findHand(frame,candidate);if(!points)continue;
        if(results.some(previous=>Math.hypot(previous[0].x-points[0].x,previous[0].y-points[0].y)<Math.max(25,w*.10)))continue;
        results.push(points);if(results.length===2)break;
      }
      return results.map(points=>points.map(p=>({x:p.x/w,y:p.y/h})));
    },
    async detect(frame){
      const w=frame.videoWidth||frame.naturalWidth||frame.width,h=frame.videoHeight||frame.naturalHeight||frame.height;
      if(!w||!h)return null;
      const fresh=!track||frames%5===0;
      const previous=track?.map(i=>i);
      const keypoints=fresh?await findPalm(frame,w,h):palmIndices.map(i=>track[i]);
      let result=keypoints?await findHand(frame,keypoints):null;
      if(!result&&previous&&fresh)result=await findHand(frame,palmIndices.map(i=>previous[i]));
      track=result;frames=result?frames+1:0;
      return result?.map(p=>({x:p.x/w,y:p.y/h}))||null;
    },
  };
}
