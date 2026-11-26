const wait=()=>new Promise(resolve=>requestAnimationFrame(resolve));

export class Camera {
  stream=null; model=null; modelPromise=null; generation=0; state='off';
  constructor(video,{frame,change}){this.video=video;this.frame=frame;this.change=change;}
  notify(state,message){this.state=state;this.change(state,message);}
  async start(){
    if(this.state!=='off')return;
    if(!navigator.mediaDevices?.getUserMedia){
      this.notify('off','请在 Chrome 或 Edge 的独立标签页中打开。');return;
    }
    const attempt=++this.generation;
    this.notify('loading','请允许浏览器访问摄像头。');
    let loadingModel=false;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({
        audio:false,video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:30,max:30},facingMode:'user'},
      });
      if(attempt!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;
      this.video.srcObject=stream;
      stream.getVideoTracks()[0].addEventListener('ended',()=>{if(attempt===this.generation)this.stop('摄像头已断开。');},{once:true});
      await this.video.play();
      if(attempt!==this.generation)return;
      loadingModel=true;
      this.notify('loading','正在加载手势识别…');
      this.modelPromise??=import('./tracker.js?v=5-5').then(m=>m.createDetector()).catch(e=>{this.modelPromise=null;throw e;});
      this.model=await this.modelPromise;
      if(attempt!==this.generation)return;
      this.model.reset();
      this.notify('live','把一只手完整放进镜头。');
      await this.loop(attempt);
    }catch(e){
      if(attempt!==this.generation)return;
      const errors={NotAllowedError:'摄像头权限未开启。请在地址栏检查权限。',NotFoundError:'没有找到摄像头。',NotReadableError:'摄像头可能正被其他应用占用。'};
      this.stop(loadingModel?'手势识别暂时无法启动，可以重新开启摄像头。':errors[e.name]||'摄像头暂时无法启动。');
    }
  }
  stop(message='摄像头已关闭。'){
    this.generation++;
    this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.srcObject=null;
    this.notify('off',message);
  }
  async loop(attempt){
    let last=-1,frameTime=0;
    while(attempt===this.generation){
      await wait();
      if(attempt!==this.generation)break;
      const now=performance.now();
      if(this.video.readyState<2||this.video.currentTime===last||now-frameTime<30)continue;
      last=this.video.currentTime;frameTime=now;
      const points=await this.model.detect(this.video);
      if(attempt===this.generation)this.frame(points,now,this.video.videoWidth/this.video.videoHeight);
    }
  }
}
