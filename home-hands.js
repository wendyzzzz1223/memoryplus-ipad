import * as THREE from './vendor/three/three.module.js?v=5-5';
export function createFirstPersonHands(camera){
 const rig=new THREE.Group();camera.add(rig);
 const skin=new THREE.MeshStandardMaterial({color:0xd3aa88,roughness:.8});
 const sleeve=new THREE.MeshStandardMaterial({color:0x739183,roughness:1});
 const nail=new THREE.MeshStandardMaterial({color:0xe6c7ae,roughness:.6});
 let thumbAmount=0,clickPressAt=-Infinity,controlMode='power';
 const remoteControl=()=>controlMode==='swing'?heldObject?.userData.remoteSwing||heldObject?.userData.remotePower:heldObject?.userData.remotePower;
 const joints=[],saved=new Map();let heldObject=null,kind=null,tracked=null,trackingOptions=null,secondaryObject=null;
 const hand=new THREE.Group();rig.add(hand);
 function ellipsoid(parent,x,y,z,r,sx,sy,sz,mat=skin){const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 function segment(parent,length,r){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length-2*r,5,12),skin);mesh.position.y=length/2;parent.add(mesh);return mesh;}
 ellipsoid(hand,0,-.16,0,.06,.9,2.2,.7,sleeve);ellipsoid(hand,0,-.052,0,.043,.9,1.1,.6);
 ellipsoid(hand,0,.015,0,.061,1,1.3,.45);
 for(let i=0;i<5;i++){
  const thumb=i===0,base=new THREE.Group();base.position.set(thumb?-.058:(i-2.5)*.03,thumb?-.015:.07,0);base.rotation.z=thumb?.8:(i-2.5)*-.06;hand.add(base);
  const length=thumb?.060:[0,.055,.065,.06,.046][i];segment(base,length,.012);
  const middle=new THREE.Group();middle.position.y=length;base.add(middle);segment(middle,length*.65,.0105);
  const tip=new THREE.Group();tip.position.y=length*.65;middle.add(tip);segment(tip,length*.45,.009);
  ellipsoid(tip,0,length*.3,.007,.008,.7,1.2,.17,nail);
  const end=new THREE.Object3D();end.position.y=length*.45;tip.add(end);base.name=thumb?'thumb-base':'finger-'+i;end.name=thumb?'thumb-tip':'finger-tip-'+i;
  joints.push({base,middle,tip,thumb,length,end});
 }
 const supporting=hand.clone(true);supporting.scale.x=-1;supporting.visible=false;rig.add(supporting);
 const supportGrip=new THREE.Group();supportGrip.position.set(.008,.07,.025);supporting.add(supportGrip);
 const grip=new THREE.Group();grip.position.set(.008,.012,.04);hand.add(grip);
 function restore(object,parent,position){
  const entry=saved.get(object);if(!entry)return;
  (parent||entry.parent).add(object);object.position.copy(position||entry.position);object.quaternion.copy(entry.quaternion);object.scale.copy(entry.scale);object.visible=true;
  if(object===heldObject){heldObject=null;kind=null;}if(object===secondaryObject)secondaryObject=null;
 }
 function hold(object,nextKind,secondary=false){
  if((secondary?secondaryObject:heldObject)===object)return;
  if(secondary?secondaryObject:heldObject)restore(secondary?secondaryObject:heldObject);
  if(!saved.has(object))saved.set(object,{parent:object.parent,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});
  // Measure the original mesh in its own coordinates before attaching that same mesh to the hand.
  object.removeFromParent();object.position.set(0,0,0);object.quaternion.identity();object.scale.copy(saved.get(object).scale);object.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const factor=(nextKind==='egg'?.09:nextKind==='bowl'?.15:.19)/Math.max(size.x,size.y,size.z,.01);
  object.scale.multiplyScalar(factor);object.position.copy(center).multiplyScalar(-factor);
  // Remote controls rest upright with their actual buttons facing the user.
  if(nextKind==='remote'||nextKind==='acremote'){object.rotation.x=Math.PI/2;object.position.set(0,.025,0);}
  (secondary?supportGrip:grip).add(object);object.visible=true;if(secondary)secondaryObject=object;else{heldObject=object;kind=nextKind;}
 }
 return {rig,hold,holdSecondary:(object,kind)=>hold(object,kind,true),release:restore,follow(pose,options){tracked=pose;trackingOptions=options;},
  setHeld(){},
  thumb(amount){thumbAmount=Math.max(0,Math.min(1,amount||0));},
  pressRemote(now){clickPressAt=now;},
  control(mode){controlMode=mode;},
  controlPoint(){return remoteControl()?.getWorldPosition(new THREE.Vector3())||null;},
  thumbTip(){return joints[0].end.getWorldPosition(new THREE.Vector3());}, // Held items are the real scene objects, never replacement props.
  reset(){for(const object of saved.keys())restore(object);thumbAmount=0;clickPressAt=-Infinity;tracked=null;},
  update(visible,action,now){
   rig.visible=visible&&(!!action||!!heldObject||!!tracked);hand.position.set(.23,-.28,-.7);hand.rotation.set(-.18,0,-.22);
   supporting.visible=!!secondaryObject||(!!heldObject&&kind==='bowl'&&!!trackingOptions?.twoHands);
   if(tracked&&heldObject){hand.position.x+= (tracked.palm.x-.5)*.3;hand.position.y-=(tracked.palm.y-.5)*.25;}
   if(supporting.visible){hand.position.x=secondaryObject?.17:.07;supporting.position.set(secondaryObject?-.16:-.07,hand.position.y+(secondaryObject?.08:0),-.7);supporting.rotation.set(-.18,0,.22+(secondaryObject?(trackingOptions?.poses?.[0]?.tiltAngle||0):0));}
   const isRemote=kind==='remote'||kind==='acremote';
   if(tracked&&!heldObject){hand.position.set((tracked.palm.x-.5)*.95,-(tracked.palm.y-.5)*.65,-.7);}
   if(isRemote){hand.position.set(.13+(tracked?(tracked.palm.x-.5)*.22:0),-.13-(tracked?(tracked.palm.y-.5)*.17:0),-.58);hand.rotation.set(-.10,-.12,-.12);}
   let curl=heldObject?1:tracked?.closed?1.1:0.18;
   if(action&&action.mode!=='thumb'){const t=Math.min(1,(now-action.start)/action.duration),reach=Math.sin(t*Math.PI);hand.position.lerp(action.goal,reach*.8);hand.rotation.z=-.22+reach*.15;curl=t<.5?.18+1.1*t:1.3-(t-.5)*.6;
    if(action.mode==='press')curl=.8;
   }
   for(let i=0;i<joints.length;i++){const j=joints[i],c=(action?.mode==='press'&&i===1)||(!heldObject&&tracked?.pointing&&i===1)?.08:curl;j.base.rotation.set(-c*.55,0,j.thumb?.8:(i-2.5)*-.06);j.middle.rotation.set(-c*.8,0,0);j.tip.rotation.set(-c*.5,0,0);}
   joints[0].base.position.set(isRemote?-.05:-.058,isRemote?.018:-.015,isRemote?.014:0);
   if(isRemote){
    const pulse=now-clickPressAt,amount=Math.max(thumbAmount,pulse>=0&&pulse<650?Math.sin(pulse/650*Math.PI):0);
    const button=remoteControl();
    if(button){button.position.y=button.userData.restY-amount*.012;hand.updateMatrixWorld(true);
     const target=hand.worldToLocal(button.getWorldPosition(new THREE.Vector3()));target.z+=.034*(1-amount)+.009;
     const j=joints[0],origin=j.base.position,direction=target.clone().sub(origin),d=THREE.MathUtils.clamp(direction.length(),.01,j.length*2.1-.001);direction.normalize();
     const first=j.length,second=j.length*1.1,a=(first*first+d*d-second*second)/(2*d),height=Math.sqrt(Math.max(0,first*first-a*a));
     const normal=new THREE.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
     const elbow=origin.clone().addScaledVector(direction,a).addScaledVector(normal,height);
     j.base.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),elbow.clone().sub(origin).normalize());
     const lower=target.clone().sub(elbow).normalize().applyQuaternion(j.base.quaternion.clone().invert());
     j.middle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),lower);j.tip.rotation.set(0,0,0);
    }
   }
  },
  dispose(){for(const object of saved.keys())restore(object);rig.traverse(o=>o.geometry?.dispose());skin.dispose();sleeve.dispose();nail.dispose();camera.remove(rig);}
 };
}
