export class LifeCamera{
 constructor(video,{frame,status}){this.video=video;this.frame=frame;this.status=status;this.generation=0;this.state='off';this.model=null;this.modelPromise=null;this.inference=null;this.paused=false;}
 tell(state,text){this.state=state;this.status(state,text);}
 async start(){
  if(this.state!=='off')return;const attempt=++this.generation;
  if(!navigator.mediaDevices?.getUserMedia){this.tell('off','当前浏览器无法开启摄像头。可以先看动作示范。');return;}
  this.tell('loading','请允许摄像头访问。');let loadingModel=false;
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:20,max:24},facingMode:'user'}});
   if(attempt!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
   this.stream=stream;this.video.srcObject=stream;await this.video.play();if(attempt!==this.generation)return;
   stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(attempt===this.generation)this.stop('摄像头已断开，可重新开启。');},{once:true});
   loadingModel=true;this.tell('loading','正在准备手势识别…');
   this.modelPromise??=import('../gesture/tracker.js').then(m=>m.createDetector()).catch(error=>{this.modelPromise=null;throw error;});
   this.model=await this.modelPromise;if(attempt!==this.generation)return;this.model.reset();
   this.tell('live','半握着手，放进画面就可以。');let last=-1;
   while(attempt===this.generation){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    if(attempt!==this.generation)break;
    if(this.paused||this.video.readyState<2||this.video.currentTime===last)continue;last=this.video.currentTime;
    this.inference=this.model.detect(this.video);const points=await this.inference;
    if(attempt===this.generation)this.frame(points,performance.now(),this.video.videoWidth/this.video.videoHeight);
   }
  }catch(error){if(attempt!==this.generation)return;const errors={NotAllowedError:'摄像头权限没有开启，请检查地址栏权限。',NotFoundError:'没有找到摄像头，可以先看动作示范。',NotReadableError:'摄像头正被其他应用使用，请关闭后重试。'};this.stop(loadingModel?'识别未能启动，可以点「开启摄像头」重试。':errors[error.name]||'摄像头未能启动，可以重新开启。');}
 }
 stop(text='摄像头已关闭。'){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.srcObject=null;this.tell('off',text);}
 async dispose(){this.stop();await this.inference?.catch(()=>{});const model=this.model||await this.modelPromise?.catch(()=>null);await model?.dispose?.();this.model=null;}
}
