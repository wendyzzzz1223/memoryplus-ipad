import {initLocalization,getLanguage,translate} from '../i18n.js?v=granddaughter-5-4';
import {openLifeActions} from '../life-actions.js?v=ipad-live-2';
function speak(text){if(!window.speechSynthesis)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(translate(text));utterance.lang=getLanguage()==='en'?'en-GB':'zh-CN';utterance.rate=.85;speechSynthesis.speak(utterance);}
// Only the user's in-app return should redirect. Page navigation also disposes the overlay.
let leaving=false,watch=null;
window.addEventListener('pagehide',()=>{leaving=true;watch?.disconnect();},{once:true});
const activity=new URLSearchParams(location.search).get('activity');openLifeActions(speak,activity);
watch=new MutationObserver(()=>{if(!leaving&&!document.querySelector('.la-shell')){watch.disconnect();location.href='./index.html';}});watch.observe(document.body,{childList:true});

initLocalization();
