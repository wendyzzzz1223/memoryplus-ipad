import {initLocalization,getLanguage,translate} from './i18n.js?v=granddaughter-5-4';
import {openHome3D} from './home3d.js';
function speak(text){if(!window.speechSynthesis)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(translate(text));utterance.lang=getLanguage()==='en'?'en-GB':'zh-CN';utterance.rate=.85;speechSynthesis.speak(utterance);}
openHome3D(speak);document.querySelector('#loading')?.remove();
const observer=new MutationObserver(()=>{if(!document.querySelector('.home3d')){observer.disconnect();location.href='./index.html';}});observer.observe(document.body,{childList:true,subtree:true});

initLocalization();
