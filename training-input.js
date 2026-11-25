export const gestureGames={sort:'sort',trace:'trace',rotate:'turn',number:'number'};
export function availableGames(input){return input==='gesture'?['sort','trace','rotate','number']:['memory','sort','speed','find','trace','rotate'];}
export function openGestureTraining(game,{onExit,onClickMode}={}){
 const lesson=gestureGames[game];if(!lesson)throw new Error('该项目暂未开放手势版');
 const shell=document.createElement('section');shell.className='gesture-training-shell';shell.setAttribute('aria-label','手势训练');
 const iframe=document.createElement('iframe');iframe.title='忆家手势训练';iframe.allow='camera';iframe.src='./gesture/index.html?embedded=1&lesson='+lesson;
 shell.append(iframe);document.body.append(shell);let closed=false;
 const fit=()=>{const scale=Math.min(innerWidth/1366,innerHeight/1024);iframe.style.transform='translate(-50%,-50%) scale('+scale+')';};fit();
 const close=()=>{if(closed)return;closed=true;removeEventListener('message',receive);removeEventListener('resize',fit);shell.remove();};
 function receive(event){if(event.source!==iframe.contentWindow||event.origin!==location.origin)return;
  if(event.data?.type==='yijia-gesture-exit'){close();onExit?.();}
  if(event.data?.type==='yijia-gesture-click'){close();onClickMode?.();}
 }
 addEventListener('message',receive);addEventListener('resize',fit);return close;
}
