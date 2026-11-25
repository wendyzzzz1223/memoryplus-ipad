import {translate} from './i18n.js?v=granddaughter-5-4';
import {mountHomeGesture} from './home-gesture.js';
import {frameScale,planDistance} from './home-layout.js';
import {createFirstPersonHands} from './home-hands.js';
import {homeTasks} from './home-tasks.js';
import {validateRoute,findGuideRoute} from './home-route.js';
import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {RoundedBoxGeometry} from './vendor/three/RoundedBoxGeometry.js';

export function openHome3D(speak) {
  if (document.querySelector('.home3d')) return;
  const root = document.createElement('section');
  root.className = 'home3d';
  root.setAttribute('aria-label', '我的家，三维生活任务');
  root.innerHTML = `
    <header class="home3d-header">
      <button class="home3d-back" aria-label="返回家庭客厅">‹</button>
      <div><h1>我的家 <span class="home5-badge">5.0</span></h1><p>家庭客厅 · 生活任务</p></div>
      <div class="home3d-tools"><button data-view="explore">全屋查看</button><button data-view="top">户型总览</button><button data-view="reset">回到当前操作</button><button data-home-demo>试遥控器</button><button data-home-gesture>手势教学</button><button data-settings aria-expanded="false">换一道题</button></div>
    </header>
    <section class="home3d-instruction" aria-label="当前任务指令">
      <div class="home3d-instruction-title"><small data-stage>第一阶段 · 规划路线</small><h2>去客厅看电视</h2></div>
      <p class="home3d-command" role="status"></p>
      <div class="home3d-inline-actions"><button class="home3d-primary" data-read>再听一遍</button><button class="home3d-secondary" data-hint>提示</button></div>
      <div class="home3d-progress"></div><p class="home3d-feedback" role="status"></p>
    </section>
    <div class="home3d-body">
      <div class="home3d-scene"><div class="home3d-actions"><button data-zoom="in" aria-label="放大模型">＋</button><button data-zoom="out" aria-label="缩小模型">−</button></div>
        <p class="home3d-tip"></p><div class="home3d-move" hidden aria-label="在房间内移动"><button data-move="forward" aria-label="向前走">向前</button><button data-move="left" aria-label="向左走">左移</button><button data-move="back" aria-label="向后退">后退</button><button data-move="right" aria-label="向右走">右移</button></div>
        <div class="home3d-planning"><button class="home3d-primary" data-depart disabled>走过去</button><button class="home3d-secondary" data-clear>重新画</button></div>
      </div>
      <aside class="home3d-task" hidden aria-label="任务选择与记录">
        <label class="home3d-select-label" for="home-task-choice">选择生活任务</label><select id="home-task-choice" aria-label="选择生活任务"></select>
        <button class="home3d-secondary" data-restart>重新开始本关</button>
        <section class="home3d-records"><h3>完成记录 · 本机</h3><div data-records></div></section>
      </aside>
    </div>`;
  const shell=document.createElement('div');shell.className='home3d-shell';shell.append(root);document.body.append(shell);
  function fitFrame(){root.style.setProperty('--home-frame-scale',frameScale(window.visualViewport?.width||innerWidth,window.visualViewport?.height||innerHeight));}
  fitFrame();window.addEventListener('resize',fitFrame);window.visualViewport?.addEventListener('resize',fitFrame);
  function removeFrame(){window.removeEventListener('resize',fitFrame);window.visualViewport?.removeEventListener('resize',fitFrame);shell.remove();}
  const view = root.querySelector('.home3d-scene');
  const chooser=root.querySelector('#home-task-choice');
  for(const [id,definition] of Object.entries(homeTasks)){const option=document.createElement('option');option.value=id;option.textContent=definition.title;chooser.append(option);}
  root.querySelector('[data-settings]').onclick=()=>{const panel=root.querySelector('.home3d-task');panel.hidden=!panel.hidden;root.querySelector('[data-settings]').setAttribute('aria-expanded',String(!panel.hidden));};
  let homeGesture=null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  } catch {
    view.insertAdjacentHTML('beforeend', '<div class="home3d-error">当前浏览器未能开启 3D。<br>请使用 Safari、Chrome 或 Edge 再试。</div>');
    root.querySelector('.home3d-command').textContent='当前设备无法显示三维家庭。';
    root.querySelectorAll('.home3d-tools button,.home3d-actions button,.home3d-task button,.home3d-instruction button,.home3d-planning button').forEach(button=>button.disabled=true);
    root.querySelector('.home3d-feedback').textContent='可返回家庭客厅继续使用其他功能。';
    root.querySelector('.home3d-back').onclick = removeFrame;
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  view.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36,1,.1,100);
  camera.position.set(2,22,.01);
  scene.add(camera);
  const hands=createFirstPersonHands(camera);
  let handAction=null,heldKind=null,looking=false,lookLast=null;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(2,0,0);
  controls.enabled=false;
  controls.enableDamping = true;
  controls.minDistance = 1.5;
  controls.maxDistance = 30;
  controls.minPolarAngle = .001;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.mouseButtons = {LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  const materials = new Map();
  function material(color, extra={}) {
    const key=String(color)+JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,...extra}));
    return materials.get(key);
  }
  const house = new THREE.Group();
  scene.add(house, new THREE.HemisphereLight(0xfff8e9,0x9da991,2.3));
  const sun = new THREE.DirectionalLight(0xfff0d8,3.1);
  sun.position.set(-4,13,6); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:35});
  sun.shadow.normalBias=.035;
  scene.add(sun);
  function box(parent,x,y,z,w,h,d,color,round=0) {
    const geometry=round ? new RoundedBoxGeometry(w,h,d,3,round) : new THREE.BoxGeometry(w,h,d);
    const mesh=new THREE.Mesh(geometry,material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent,x,y,z,top,bottom,height,color) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,24),material(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function sphere(parent,x,y,z,r,color,sx=1,sy=1,sz=1) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material(color));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function group(x,y,z,id) {
    const g=new THREE.Group();g.position.set(x,y,z);g.userData.id=id;house.add(g);return g;
  }
  box(house,0,-.22,0,10.3,.4,7.5,0xe9e6dc,.1);
  const floor=box(house,0,.005,0,10,.05,7.2,0xc8a67d);
  floor.userData.id='floor';
  for(let i=0;i<24;i++) {
    const z=-3.45+i*.3;
    box(house,0,.038,z,10,.008,.012,0xb49169);
    for(let j=0;j<5;j++) box(house,-4.8+j*2+(i%2)*.6,.04,z+.15,.008,.004,.28,0xb49169);
  }
  // Tiled bathroom floor, with a doorway into the central hallway.
  box(house,-3,.055,-1.95,3.9,.06,3.25,0xcbd8ce);
  for(let x=-4.8;x<-1.1;x+=.45)for(let z=-3.5;z<-.4;z+=.45)box(house,x,.092,z,.435,.012,.435,0xe1e7df);
  const walls=[];
  function wall(x,z,w,d,nx,nz) {
    const g=group(x,0,z);
    box(g,0,1.18,0,w,2.35,d,0xf0ede2);
    box(g,0,.12,0,w+.015,.15,d+.025,0xe0dacc);
    walls.push({group:g,normal:new THREE.Vector3(nx,0,nz),center:new THREE.Vector3(x,1,z)});
    return g;
  }
  const north=wall(0,-3.6,10.2,.15,0,-1);
  const south=wall(0,3.6,10.2,.15,0,1);
  const west=wall(-5,0,.15,7.2,-1,0);
  wall(5,-1.8,.15,3.6,1,0);wall(5,2.6,.15,2,1,0);
  // Separate kitchen and dining room, with a 1.25m open doorway.
  wall(-.3,-1.18,1.4,.14,0,1);wall(3.3,-1.18,3.4,.14,0,1);
  box(house,1,2.2,-1.18,1.25,.3,.18,0xb69a73);
  for(const x of [.35,1.65])box(house,x,1.05,-1.18,.07,2.1,.18,0xb69a73);
  // Child's bedroom extends east, connected through a full-size doorway.
  box(house,7,-.22,1.5,4.2,.4,4.4,0xe9e6dc,.08);
  const childFloor=box(house,7,.02,1.5,4,.06,4.2,0xc9ae88);childFloor.userData.id='floor';
  wall(7,-.6,4,.15,0,-1);wall(9,1.5,.15,4.2,1,0);wall(7,3.6,4,.15,0,1);
  box(house,5,2.2,.8,.22,.3,1.6,0xb69972);
  for(const z of [0,1.6])box(house,5,1.05,z,.22,2.1,.07,0xb69972);
  box(house,7.8,.3,2.4,1.65,.45,2.05,0xb18c65,.04);
  box(house,7.8,.6,2.4,1.6,.2,2,0xf0eadb,.07);
  box(house,7.8,.77,1.65,1.55,.15,.5,0xe8dfcd,.06);
  box(house,7.8,.75,2.7,1.6,.12,1.25,0x8eaaaf,.05);
  box(house,7.8,.9,1.34,1.7,1,.13,0xae926c,.04);
  // Desk, drawers and books give this room a different identity.
  const desk=group(7.5,0,-.05,'desk');
  box(desk,0,.82,0,2.1,.12,.8,0xc5a377,.04);
  for(const x of [-.9,.9])box(desk,x,.4,0,.08,.8,.65,0x997d59);
  const deskDrawer=new THREE.Group();deskDrawer.position.set(.55,.57,0);desk.add(deskDrawer);deskDrawer.userData.id='deskdrawer';
  box(deskDrawer,0,0,0,.75,.22,.62,0xb89367,.02);box(deskDrawer,0,.02,.34,.18,.03,.04,0x776a55);
  const book=group(8.05,.72,-.05,'book');box(book,0,0,0,.38,.06,.5,0x5c807e,.015);box(book,0,.005,.02,.34,.045,.44,0xf1e8cf);
  box(desk,-.55,1.15,-.12,.85,.55,.04,0x364842,.02);box(desk,-.55,.9,0,.45,.04,.28,0x626f65);
  cylinder(desk,.05,1.03,-.08,.08,.07,.3,0xceb57f);
  for(let i=0;i<5;i++)cylinder(desk,-.01+i*.025,1.22,-.08,.006,.006,.25,0x7f7160+i*800);
  const deskLamp=group(6.65,.9,-.12,'desklamp');cylinder(deskLamp,0,.02,0,.12,.14,.04,0xbcb4a0);cylinder(deskLamp,0,.22,0,.02,.02,.4,0x788b80);cylinder(deskLamp,0,.44,0,.09,.16,.18,0xd4b88b);
  const deskLight=new THREE.PointLight(0xffdb9c,0,3,2);deskLight.position.y=.4;deskLamp.add(deskLight);
  box(house,8.65,1.1,.55,.55,2.1,1.1,0xd5c3a1,.03);
  for(let i=0;i<3;i++)box(house,8.32,.55+i*.55,.55,.1,.04,1.05,0xa68b66);
  box(house,6.8,.36,.65,.55,.12,.5,0x8da299,.05);box(house,6.8,.7,.87,.55,.6,.08,0x8da299,.04);
  wall(-1,-2.45,.14,2.3,1,0);wall(-1,1.65,.14,3.9,1,0);
  wall(-3.9,-.25,2.2,.12,0,1);wall(-1.25,-.25,.5,.12,0,1);
  // Window and artwork move with their wall so they disappear together.
  box(north,2.8,1.42,.1,2.3,1.35,.06,0x96b7b5);
  for(const x of [1.61,2.8,3.99])box(north,x,1.42,.15,.065,1.5,.06,0xfffcf1);
  for(const y of [.7,2.15])box(north,2.8,y,.15,2.45,.065,.06,0xfffcf1);
  box(north,-3.5,1.6,.1,.9,.85,.05,0xd9bc89);
  box(north,-3.5,1.6,.14,.76,.71,.03,0xf5e8d0);
  // Bathroom vanity, mirror, toilet and shower.
  box(house,-4.22,.5,-3.04,1.15,.85,.58,0xb4946d,.04);
  box(house,-4.22,.97,-3.02,1.25,.1,.7,0xf8f4e6,.04);
  sphere(house,-4.22,1.04,-2.99,.28,0xffffff,1,.2,.7);
  cylinder(house,-4.22,1.17,-3.2,.025,.025,.3,0x7c8581);
  const mirror=box(north,-4.2,1.65,.12,.88,.8,.035,0xacc3c3,.035);
  box(house,-3.95,.63,-1.3,.65,.85,.3,0xf7f5ec,.07);
  sphere(house,-3.95,.4,-.96,.38,0xfffcf6,.9,1,1.25);
  const seat=new THREE.Mesh(new THREE.TorusGeometry(.26,.055,10,28),material(0xf9f7ee));
  seat.rotation.x=Math.PI/2;seat.position.set(-3.95,.69,-.9);house.add(seat);
  box(house,-1.7,.12,-2.8,1,.16,1.1,0xf0f1e8,.06);
  // Bedroom.
  box(house,-3.2,.33,2,2.45,.48,2.6,0xad8c64,.04);
  box(house,-3.2,.65,2.03,2.35,.25,2.5,0xfff6de,.1);
  box(house,-3.2,.85,1.12,2.3,.18,.55,0xe0ddc9,.08);
  box(house,-3.2,.85,2.55,2.36,.15,1.35,0x8faaa1,.07);
  box(house,-3.2,1.02,.72,2.5,1.25,.14,0xb49875,.05);
  box(house,-4.65,.45,1.1,.48,.75,.65,0xb7976d,.04);
  box(house,-1.6,1.1,2.85,.7,2.1,1,0xd6c5a5,.03);
  // Kitchen cabinets and appliances.
  for(const x of [-.35,.55,1.45]) {
    box(house,x,.48,-3.05,.86,.88,.8,0xe7dfcb,.025);
    box(house,x,.98,-3.05,.92,.12,.88,0xf7f2e7,.025);
    box(house,x,.55,-2.63,.06,.035,.035,0x8b7961);
    box(house,x,1.94,-3.32,.86,.65,.45,0xd1ad7e,.02);
  }
  for(const x of [.3,.75])for(const z of [-3.27,-2.92])cylinder(house,x,1.05,z,.13,.13,.02,0x3f4842);
  sphere(house,-.35,1.05,-3.05,.27,0x9eaaa0,1,.12,.8);
  cylinder(house,-.35,1.2,-3.27,.025,.025,.3,0x8a9690);
  const fridge=group(2.45,0,-3,'fridge');
  // Open-front refrigerator: separate shell, visible shelves, door bins and pull-out egg tray.
  box(fridge,0,1.1,-.36,.85,2.15,.08,0xe1e8e3,.025);
  for(const x of [-.4,.4])box(fridge,x,1.1,0,.06,2.15,.8,0xe8ece5,.02);
  for(const y of [.07,2.13])box(fridge,0,y,0,.85,.08,.8,0xe8ece5,.02);
  for(const y of [.42,.95,1.45])box(fridge,0,y,0,.74,.035,.7,0xc4d8d2,.01);
  const fridgeLight=new THREE.PointLight(0xe5f6ff,0,2,2);fridgeLight.position.set(0,1.8,.25);fridge.add(fridgeLight);
  const fridgeDoor=new THREE.Group();fridgeDoor.position.set(-.43,0,.44);fridge.add(fridgeDoor);
  box(fridgeDoor,.43,1.08,0,.84,2.08,.08,0xf7f6ed,.035);
  box(fridgeDoor,.77,1.35,.07,.04,.42,.04,0x8d9690,.01);
  for(const y of [.4,.85,1.45]){box(fridgeDoor,.43,y,-.14,.7,.07,.2,0xb4c9c1,.02);box(fridgeDoor,.43,y+.09,-.24,.7,.17,.025,0xc7d9ce);}
  // Milk and vegetables make the compartments recognizable.
  box(fridge,-.19,1.65,0,.16,.33,.18,0xf2eee0,.015);box(fridge,.08,1.62,0,.17,.28,.18,0xa8c6a4,.02);
  for(let i=0;i<3;i++)sphere(fridge,-.2+i*.19,.57,.02,.09,0x82a265,1,.8,1.3);
  const eggTray=new THREE.Group();eggTray.position.set(0,1,.02);eggTray.userData.id='eggtray';fridge.add(eggTray);
  box(eggTray,0,.025,0,.69,.05,.6,0xb1c9bd,.02);
  for(const x of [-.34,.34])box(eggTray,x,.1,0,.025,.17,.58,0xc9dcd3);
  box(eggTray,0,.11,.31,.7,.19,.035,0xc9dcd3,.015);box(eggTray,0,.11,.34,.2,.035,.04,0x819b8c);
  const eggs=[];
  for(const x of [-.2,0,.2])for(const z of [-.15,.1]){const egg=sphere(eggTray,x,.12,z,.085,0xe7caa4,.85,1.25,.85);egg.userData.id='egg';eggs.push(egg);}
  // Living room sofa faces the television across a low coffee table.
  const sofa=group(2.95,0,2.4,'sofa');
  box(sofa,0,.36,0,3.2,.52,1.1,0x6e9382,.15);
  box(sofa,0,.87,.38,3.2,.9,.28,0x8aab97,.12);
  for(const x of [-1.48,1.48])box(sofa,x,.67,0,.28,.66,1.15,0x8aa992,.12);
  for(const x of [-.88,0,.88])box(sofa,x,.69,-.12,.83,.18,.82,0xa5bfaa,.09);
  for(const x of [-1.25,1.25])for(const z of [-.34,.34])cylinder(sofa,x,.12,z,.045,.04,.22,0x766049);
  const cushion=box(sofa,-1,1,.2,.5,.48,.16,0xe8c8a3,.08);cushion.rotation.z=.2;
  const rug=box(house,2.25,.09,.75,4.1,.055,3.5,0xe6dfcb,.18);
  rug.userData.id='floor';
  const table=group(2.35,0,.65,'table');
  box(table,0,.6,0,1.65,.16,.95,0xcfae81,.12);
  for(const x of [-.62,.62])for(const z of [-.3,.3])cylinder(table,x,.32,z,.035,.045,.55,0x987953);
  cylinder(table,.48,.79,.12,.105,.08,.26,0xf3ecdb);
  cylinder(table,.48,.94,.12,.11,.11,.035,0xddd1b5);
  const remote=group(2.15,.74,.55,'remote');
  const remoteBody=box(remote,0,0,0,.2,.07,.5,0x39453e,.035);remote.rotation.y=-.3;
  const remotePower=cylinder(remote,0,.045,-.16,.038,.038,.014,0xc15b40);remotePower.userData.restY=.045;remote.userData.remotePower=remotePower;
  for(const x of [-.045,.045])for(const z of [-.05,.05,.15])cylinder(remote,x,.045,z,.018,.018,.012,0xa9b5a6);
  const television=group(3.35,0,-.78,'tv');
  box(television,0,.34,0,2.1,.56,.6,0xb79870,.06);
  box(television,0,.65,0,.65,.05,.3,0x444f48,.015);
  box(television,0,1.35,0,2.05,1.2,.09,0x303c36,.04);
  const screen=box(television,0,1.35,.053,1.9,1.05,.012,0x1c2d2c,.025);
  const screenOnMaterial=new THREE.MeshStandardMaterial({color:0x93c4b9,emissive:0x75b6a6,emissiveIntensity:.7,roughness:.3});
  // Landscape for the powered television.
  const tvPicture=new THREE.Group();television.add(tvPicture);tvPicture.visible=false;
  box(tvPicture,0,1.08,.07,1.88,.47,.01,0x729d7c);
  sphere(tvPicture,.52,1.65,.074,.12,0xffedba,1,1,.05);
  const lamp=group(4.65,0,1.5,'lamp');
  cylinder(lamp,0,.1,0,.27,.3,.08,0x9a805c);
  cylinder(lamp,0,.95,0,.03,.03,1.7,0xb49a6d);
  const shade=cylinder(lamp,0,1.9,0,.25,.43,.5,0xf4dfb1);
  const lampLight=new THREE.PointLight(0xffc77b,0,6,2);lampLight.position.set(0,1.75,0);lamp.add(lampLight);
  const aircon=group(4.82,1.95,-.2,'aircon');box(aircon,0,0,0,.27,.45,1.3,0xf8f7ef,.05);
  const acFlap=box(aircon,-.15,-.14,0,.08,.05,1.05,0x9aafa5,.01);
  const airFlow=new THREE.Group();aircon.add(airFlow);const windLines=[];
  for(let i=0;i<12;i++){
    const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.4,-.05,0),new THREE.Vector3(-.8,-.3,.04)]),12,.008,4,false),new THREE.MeshBasicMaterial({color:0xa6d7d4,transparent:true,opacity:.45}));
    line.position.set(-.15,-.15,(i%4)*.27-.4);airFlow.add(line);windLines.push(line);
  }
  const acRemote=group(3.25,.75,.6,'acremote');box(acRemote,0,0,0,.18,.06,.4,0xece9dc,.025);box(acRemote,0,.034,-.08,.12,.008,.1,0x97b3a1);const acPower=cylinder(acRemote,0,.04,.05,.03,.03,.012,0xc15b40);acPower.userData.restY=.04;acRemote.userData.remotePower=acPower;const acSwing=cylinder(acRemote,0,.04,.14,.026,.026,.012,0x6d9588);acSwing.userData.restY=.04;acRemote.userData.remoteSwing=acSwing;
  // Dining area and greenery.
  cylinder(house,.05,.75,1.9,.65,.65,.1,0xd2b186);
  cylinder(house,.05,.37,1.9,.09,.2,.73,0xb1926d);
  for(const [x,z] of [[-.72,1.9],[.7,1.9],[.05,2.7]]) {
    box(house,x,.48,z,.48,.12,.48,0x6f8c71,.05);
    box(house,x,.84,z+.18,.48,.6,.08,0x8ba28a,.03);
    for(const dx of [-.17,.17])for(const dz of [-.17,.17])cylinder(house,x+dx,.23,z+dz,.025,.025,.45,0x9b805a);
  }
  function plant(x,z) {
    cylinder(house,x,.3,z,.22,.16,.55,0xe9d8bb);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      const leaf=sphere(house,x+Math.sin(a)*.16,.85+(i%3)*.13,z+Math.cos(a)*.16,.18,0x71945e,.6,1.8,.7);
      leaf.rotation.z=Math.sin(a)*.55;
    }
  }
  plant(4.45,-3);plant(-.4,3.1);

  // Domestic surfaces and everyday belongings.
  const textures=[];
  function textureCanvas(draw) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const context=canvas.getContext('2d');draw(context);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    textures.push(texture);return texture;
  }
  const oak=textureCanvas(context=>{
    context.fillStyle='#c49c70';context.fillRect(0,0,512,512);
    for(let i=0;i<180;i++){
      const x=i*2.9;context.beginPath();context.moveTo(x,0);
      for(let y=0;y<=512;y+=24)context.lineTo(x+Math.sin(y*.027+i)*2.5,y);
      context.strokeStyle=i%3?'#b88e6170':'#e7c49370';context.lineWidth=i%4===0?2:1;context.stroke();
    }
  });
  oak.wrapS=oak.wrapT=THREE.RepeatWrapping;oak.repeat.set(7,5);
  floor.material=new THREE.MeshStandardMaterial({map:oak,roughness:.6});
  const fabric=textureCanvas(context=>{
    context.fillStyle='#afa58f';context.fillRect(0,0,512,512);
    context.strokeStyle='#e7e0ce45';context.lineWidth=1;
    for(let i=0;i<512;i+=4){context.beginPath();context.moveTo(i,0);context.lineTo(i,512);context.moveTo(0,i);context.lineTo(512,i);context.stroke();}
  });
  fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;fabric.repeat.set(3,2);
  const cloth=new THREE.MeshStandardMaterial({map:fabric,roughness:1});
  sofa.traverse(object=>{if(object.isMesh&&object.position.y>.25)object.material=cloth;});
  // Lace sofa runner and embroidered cushions.
  box(sofa,.9,.81,-.13,.5,.025,.8,0xeae5d6,.015);
  box(sofa,.9,1.22,.225,.5,.025,.42,0xeae5d6,.015);
  const pillow=box(sofa,.85,1,.15,.5,.46,.16,0xb68c63,.07);pillow.rotation.z=-.12;
  // Ceramic lidded tea mug, tea tin and a tissue box on the coffee table.
  cylinder(table,-.5,.82,.08,.11,.1,.26,0xf7f2e4);
  cylinder(table,-.5,.965,.08,.12,.12,.025,0xf6edda);
  sphere(table,-.5,1,.08,.035,0xd1b590);
  const mugHandle=new THREE.Mesh(new THREE.TorusGeometry(.075,.015,8,20),material(0xf0e5ce));
  mugHandle.position.set(-.64,.83,.08);mugHandle.rotation.y=Math.PI/2;table.add(mugHandle);
  cylinder(table,.55,.81,-.2,.11,.11,.24,0x426d5b);
  box(table,.05,.79,.23,.35,.2,.23,0xd0bba0,.02);
  box(table,.05,.92,.23,.16,.08,.035,0xfffcf2,.015);
  // Thermos flask and fruit bowl on the dining table.
  const thermos=group(.2,0,1.9,'thermos');
  cylinder(thermos,0,.98,0,.11,.13,.4,0xb77b59);
  cylinder(thermos,0,1.22,0,.075,.075,.09,0xe0c9a1);
  cylinder(house,-.2,.85,1.9,.22,.16,.08,0xd7b877);
  for(const [x,z] of [[-.3,1.9],[-.1,1.9],[-.2,2.05]])sphere(house,x,.95,z,.095,0xd99a4c);
  // Rice cooker, dish rack and tiled kitchen splashback.
  box(north,.6,1.3,.095,2.6,.48,.04,0xdfdfd1);
  const cooker=box(house,1.4,1.17,-3.02,.4,.35,.38,0xf5f1e7,.08);
  box(house,1.4,1.37,-3.02,.42,.05,.4,0x646b61,.02);
  box(house,1.4,1.15,-2.81,.15,.07,.02,0x696f65,.01);
  // Full-height curtains beside the living-room window.
  for(const x of [1.5,4.12]){
    for(let i=0;i<6;i++)cylinder(north,x+i*.035,1.3,.23,.045,.045,2.1,0xc0b8a0);
  }
  cylinder(north,2.8,2.42,.23,.025,.025,2.9,0x8e7a5e).rotation.z=Math.PI/2;
  // Chinese calendar, switch plate and framed landscape near television.
  const calendar=textureCanvas(context=>{
    context.fillStyle='#fff9e9';context.fillRect(0,0,512,512);
    context.fillStyle='#a94735';context.fillRect(0,0,512,90);
    context.fillStyle='#fff9ed';context.textAlign='center';context.font='bold 42px sans-serif';context.fillText(translate('家和万事兴'),256,60);
    context.fillStyle='#4f5147';context.font='36px sans-serif';context.fillText(translate('十一月'),256,155);
    context.font='bold 150px sans-serif';context.fillText('18',256,320);
    context.font='28px sans-serif';context.fillText(translate('星期三'),256,400);
  });
  const calendarFace=box(north,.25,1.6,.12,.5,.62,.03,0xf6f0db);
  calendarFace.material=new THREE.MeshStandardMaterial({map:calendar,roughness:.95});
  box(north,4.55,1.15,.12,.13,.2,.035,0xf5f2e9,.015);

  // Bedroom curtains, window and a warm bedside lamp.
  box(west,.1,1.45,1.7,.04,1.25,1.7,0xa8c5bf);
  for(const z of [.8,1.7,2.6])box(west,.14,1.45,z,.06,1.4,.045,0xf9f5e9);
  for(const y of [.75,2.15])box(west,.14,y,1.7,.06,.055,1.85,0xf9f5e9);
  const curtains=group(-4.77,0,1.7,'curtains');
  const curtainLeaves=[];
  for(const z of [-.87,.56]) {
    const leaf=new THREE.Group();leaf.position.z=z;curtains.add(leaf);curtainLeaves.push(leaf);
    for(let i=0;i<7;i++)cylinder(leaf,0,1.2,i*.05,.045,.045,2.15,0xc7b28e);
  }
  const bedlamp=group(-4.65,.8,1.1,'bedlamp');
  cylinder(bedlamp,0,.06,0,.14,.17,.08,0x92724f);
  cylinder(bedlamp,0,.24,0,.025,.025,.35,0xb3986c);
  const bedshade=cylinder(bedlamp,0,.48,0,.15,.24,.3,0xf0d8a6);
  const bedroomLight=new THREE.PointLight(0xffc77d,0,4,2);bedroomLight.position.set(0,.45,0);bedlamp.add(bedroomLight);
  // An empty glass placed beside the thermos.
  const cup=group(-.35,.9,1.8,'cup');
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:0xe3eee5,transparent:true,opacity:.46,roughness:.12,metalness:0,side:THREE.DoubleSide});
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(.105,.085,.26,28,1,true),glassMaterial);
  glass.position.y=.13;cup.add(glass);
  cylinder(cup,0,.015,0,.085,.085,.025,0xe0e8dc);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.105,.008,8,28),material(0xe8eee5));
  rim.rotation.x=Math.PI/2;rim.position.y=.26;cup.add(rim);
  const cupWater=cylinder(cup,0,.04,0,.09,.075,.01,0x91c8cc);
  cupWater.visible=false;

  const dishCabinet=group(-.52,0,3.08,'dishcabinet');
  box(dishCabinet,0,.48,.3,.65,.86,.05,0xb89b73,.02);
  for(const x of [-.32,.32])box(dishCabinet,x,.48,0,.04,.86,.65,0xb89b73);
  for(const y of [.08,.48,.9])box(dishCabinet,0,y,0,.65,.04,.65,0xb89b73);
  const dishDoor=new THREE.Group();dishDoor.position.set(-.34,0,-.34);dishCabinet.add(dishDoor);box(dishDoor,.33,.48,0,.65,.8,.04,0xd6bd92,.02);
  const bowl=group(-.52,.58,3.08,'bowl');const bowlMesh=new THREE.Mesh(new THREE.SphereGeometry(.16,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),material(0xf3eee0,{side:THREE.DoubleSide}));bowl.add(bowlMesh);
  const tablePlace=group(.34,.84,1.7,'tableplace');const placeRing=new THREE.Mesh(new THREE.RingGeometry(.13,.17,32),material(0xd3a171));placeRing.rotation.x=-Math.PI/2;tablePlace.add(placeRing);
  // Slippers by the bedroom door.
  for(const x of [-1.8,-1.55])box(house,x,.1,.22,.15,.08,.3,0x7b8570,.06);
  const slippers=group(4.5,0,.9);
  for(const x of [-.12,.12])box(slippers,x,.11,0,.16,.08,.32,0x8d7862,.06);

  // Avatar and collision-aware movement.
  const avatar=group(-2.8,0,-2.05);
  cylinder(avatar,0,.55,0,.18,.23,.52,0x758f7c);
  sphere(avatar,0,1.05,0,.2,0xe1ba95,.85,1.1,.9);
  sphere(avatar,0,1.16,-.025,.2,0xcdd0c5,.95,.6,1);
  const legs=[];
  for(const x of [-.095,.095]) {
    const leg=cylinder(avatar,x,.2,0,.065,.06,.4,0x555c52);legs.push(leg);
    box(avatar,x,.035,.04,.13,.08,.22,0x5b5143,.03);
    cylinder(avatar,x*2.2,.58,0,.055,.05,.43,0x819a84);
  }
  const collisions=[[-4.9,-3.55,-3.5,-2.55],[-4.4,-3.5,-1.6,-.5],[-2.3,-1.1,-3.5,-2.2],
    [-4.55,-1.75,.5,3.35],[-1.95,-1.1,2.2,3.5],[-.9,1.95,-3.55,-2.45],
    [1.9,2.95,-3.55,-2.45],[1.25,4.65,1.78,3.15],[1.35,3.3,.05,1.25],
    [2.15,4.55,-1.08,-.43],[-.65,.7,1.2,2.6],
    [-1.15,-.85,-3.6,-1.3],[-1.15,-.85,-.3,3.6],[-5,-2.8,-.4,-.1],[-1.5,-1,-.4,-.1],[-1,.35,-1.25,-1.11],[1.65,5,-1.25,-1.11],
    [4.93,5.07,-3.6,0],[4.93,5.07,1.6,3.6],[6.9,8.7,1.3,3.4],[6.4,8.6,-.48,.4],[8.32,8.98,0,1.2],[-.9,-.15,2.72,3.45]];
  function blocked(x,z) {
    return !((x>=-4.75&&x<=4.75&&z>=-3.35&&z<=3.35)||(x>=4.7&&x<=8.8&&z>=-.38&&z<=3.35))||collisions.some(([x1,x2,z1,z2])=>x>x1-.08&&x<x2+.08&&z>z1-.08&&z<z2+.08);
  }

  let path=[],onArrival=null,step=0,hasRemote=false,tvOn=false,lightOn=false,fridgeOpen=false,acOn=false,disposed=false;
  let taskId='television',task=homeTasks.television,commands=task.commands;
  let hasCup=false,pouring=0,curtainClosed=false,bedLightOn=false,curtainAmount=0;
  let eggTrayOpen=false,hasEgg=false,hasAcRemote=false,swingOn=false,deskDrawerOpen=false,hasBook=false,deskLampOn=false,dishOpen=false,hasBowl=false;
  const completionKey='yijia-home-completions-v1';
  let completions={};
  try{const saved=JSON.parse(localStorage.getItem(completionKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))completions=saved;}catch{}
  const command=root.querySelector('.home3d-command'),feedback=root.querySelector('.home3d-feedback');
  function announce(message){speak(message);}

  function renderRecords() {
    const container=root.querySelector('[data-records]');container.replaceChildren();
    for(const [id,definition] of Object.entries(homeTasks)) {
      const row=document.createElement('p');
      row.textContent=definition.title+' · '+(completions[id]?'已完成':'待体验');
      container.append(row);
    }
  }
  function completeTask() {
    if(step===commands.length-1)return;
    step=commands.length-1;completions[taskId]=new Date().toISOString();
    try{localStorage.setItem(completionKey,JSON.stringify(completions));}catch{}
    updateTask();renderRecords();feedback.textContent='本关生活步骤都完成了。';announce(commands.at(-1));
  }
  function progressTask(expected) {
    if(step!==expected)return;
    if(step===commands.length-2){completeTask();return;}
    step++;updateTask();announce(commands[step]);
  }
  function updateTask() {
    command.textContent=commands[step];
    root.querySelector('[data-stage]').textContent=step===0?'第一阶段 · 规划路线':step===commands.length-1?'任务完成':'第二阶段 · '+task.room+'操作';
    if(root.querySelector('.home3d-progress').children.length!==commands.length-1)root.querySelector('.home3d-progress').innerHTML='<i></i>'.repeat(commands.length-1);
    root.querySelectorAll('.home3d-progress i').forEach((el,i)=>el.classList.toggle('done',i<step));
    root.querySelector('[data-hint]').hidden=step===commands.length-1;
    if(step>0)root.querySelector('.home3d-tip').textContent='拖动画面看四周 · 点击物品操作';
    if(step>0&&!browsing)livingView();
    hotspots.forEach(h=>h.button.classList.remove('hinted'));
  }

  let destination={...task.destination};
  let drawn=[],drawing=false,routeResult=null,walking=false,transition=null,browsing=false;
  const drawnLine=new THREE.Group();house.add(drawnLine);
  const guide=new THREE.Group();house.add(guide);let guideCurve=null,guideUntil=0;
  const guideLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xd77424,dashSize:.17,gapSize:.1,depthTest:false,transparent:true,opacity:.75}));guideLine.renderOrder=19;guide.add(guideLine);
  const guideDots=[];const guideMaterial=new THREE.MeshBasicMaterial({color:0xd77424,depthTest:false,transparent:true,opacity:.9});
  for(let i=0;i<10;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),guideMaterial);dot.renderOrder=20;guide.add(dot);guideDots.push(dot);}guide.visible=false;
  function clearGuide(){guide.visible=false;guideCurve=null;}
  function showGuide(){
    clearGuide();
    if(step===0){
      planningView();const points=findGuideRoute({x:avatar.position.x,z:avatar.position.z},destination,blocked,task);
      if(points.length<2){feedback.textContent='请沿门口的空地走过去。';return;}
      guideCurve=new THREE.CurvePath();for(let i=1;i<points.length;i++)guideCurve.add(new THREE.LineCurve3(new THREE.Vector3(points[i-1].x,.2,points[i-1].z),new THREE.Vector3(points[i].x,.2,points[i].z)));
    }else{
      livingView();const target=hotspots.find(h=>h.target.userData.id===task.targets[step])?.target;
      if(!target)return;
      const to=new THREE.Box3().setFromObject(target===curtains?curtains.children[1]:target).getCenter(new THREE.Vector3());to.y+=.1;
      guideCurve=new THREE.LineCurve3(to.clone().add(new THREE.Vector3(0,.65,0)),to);
      hotspots.find(h=>h.target===target)?.button.classList.add('hinted');
    }
    guideLine.geometry.dispose();guideLine.geometry=new THREE.BufferGeometry().setFromPoints(guideCurve.getSpacedPoints(160));guideLine.computeLineDistances();guide.visible=true;guideUntil=step===0?Infinity:performance.now()+15000;
  }
  const planning=root.querySelector('.home3d-planning');
  const depart=root.querySelector('[data-depart]');
  function clearDrawn() {
    drawnLine.traverse(object=>{object.geometry?.dispose();});
    drawnLine.clear();
  }
  function drawLine(color=0x477c69) {
    clearDrawn();
    if(drawn.length<2)return;
    const curve=new THREE.CurvePath();
    for(let i=1;i<drawn.length;i++)curve.add(new THREE.LineCurve3(
      new THREE.Vector3(drawn[i-1].x,.145,drawn[i-1].z),
      new THREE.Vector3(drawn[i].x,.145,drawn[i].z)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,drawn.length*3),.035,6,false),material(color));
    drawnLine.add(mesh);
  }
  function planningView() {
    transition=null;browsing=false;controls.enabled=false;root.querySelector('[data-view="explore"]').textContent='全屋查看';camera.position.set(2,planDistance(view.clientWidth,view.clientHeight),.36);camera.fov=36;
    controls.target.set(2,0,.35);camera.updateProjectionMatrix();controls.update();
    root.querySelector('.home3d-tip').textContent='用手指或鼠标画路线 · 经过门口，避开墙和家具';
  }
  function livingView() {
    browsing=false;controls.enabled=false;root.querySelector('[data-view="explore"]').textContent='全屋查看';
    const poses={
      television:step===1?[[2.55,1.55,1.68],[2.15,.78,.55]]:[[2.45,1.58,1.65],[3.35,1.3,-.78]],
      water:[[.05,1.65,.65],[.05,1.02,1.82]],
      bedroom:step===1?[[-1.4,1.65,1.4],[-4.7,1.3,2.4]]:[[-1.45,1.6,1.4],[-4.6,1.28,1.1]],
      eggs:[[2.45,1.5,-1.6],[2.45,1.15,-2.95]],
      cooling:step<2?[[3.6,1.6,1.65],[3.25,.8,.6]]:[[3.1,1.55,1.35],[4.8,1.85,-.2]],
      childroom:step===1?[[7.75,1.1,1.25],[8.05,.6,.3]]:step===2?[[7.8,1.5,1.3],[8.05,.76,.45]]:[[7.5,1.6,1.1],[6.7,.9,.1]],
      tableware:step<3?[[.5,1.5,2.2],[-.5,.65,3.08]]:[[.05,1.75,2.9],[.05,.9,1.9]]
    };
    const pose=poses[taskId];transition={position:new THREE.Vector3(...pose[0]),target:new THREE.Vector3(...pose[1])};

    avatar.visible=false;
    root.querySelector('.home3d-tip').textContent='拖动画面看四周 · 点击物品操作';
    camera.fov=62;camera.updateProjectionMatrix();
  }
  function arriveDestination() {
    if(step!==0)return;
    clearGuide();walking=false;step=1;planning.hidden=true;
    updateTask();feedback.textContent='已经到'+task.destinationName+'了。';
    livingView();announce(commands[step]);
  }
  depart.onclick=()=>{
    if(!routeResult?.valid||walking)return;
    planningView();walking=true;drawing=false;depart.disabled=true;
    path=routeResult.points.map(p=>new THREE.Vector3(p.x,0,p.z));
    onArrival=arriveDestination;
    root.querySelector('[data-clear]').disabled=true;
    feedback.textContent='人物正沿您画的路线走过去。';
  };
  root.querySelector('[data-clear]').onclick=()=>{
    drawn=[];routeResult=null;depart.disabled=true;clearDrawn();
    feedback.textContent='请从'+task.startName+'的人物旁重新画。';
  };
  function toggleTV(fromRemote=false) {
    tvOn=!tvOn;screen.material=tvOn?screenOnMaterial:material(0x1c2d2c);tvPicture.visible=tvOn;
    if(taskId==='television'&&tvOn&&step===2&&hasRemote&&fromRemote)completeTask();
    return tvOn?'电视已打开。':'电视已关闭。';
  }
  function perform(target,mode,done){
    if(handAction)return;
    closeMenu();camera.updateMatrixWorld();
    const local=camera.worldToLocal(target.getWorldPosition(new THREE.Vector3()));
    const factor=.65/Math.max(.1,-local.z);
    const goal=new THREE.Vector3(THREE.MathUtils.clamp(local.x*factor,-.3,.35),THREE.MathUtils.clamp(local.y*factor,-.2,.2),-.53);
    handAction={start:performance.now(),duration:950,goal,mode,done};
    feedback.textContent=mode==='grab'?'正在伸手拿取…':mode==='pull'?'正在伸手拉开…':mode==='place'?'正在放下物品…':'正在按动开关…';
  }
  let popup;
  function closeMenu(){popup?.remove();popup=null;}
  function menu(title,description,actions,remoteMode=false) {
    closeMenu();popup=document.createElement('div');popup.className='home3d-popup';
    popup.innerHTML='<button class="home3d-dismiss" aria-label="关闭物品菜单">×</button><h3></h3><p></p>';
    popup.querySelector('h3').textContent=title;popup.querySelector('p').textContent=description;
    popup.querySelector('.home3d-dismiss').onclick=closeMenu;
    const container=document.createElement('div');if(remoteMode)container.className='remote-shape';
    for(const action of actions) {
      const button=document.createElement('button');button.textContent=action.label;
      if(action.power)button.className='power';
      button.onclick=()=>{
        if(handAction)return;
        if(['television','water','bedroom'].includes(taskId)){
          const id=task.targets[Math.min(step,task.targets.length-1)];
          const target=hotspots.find(h=>h.target.userData.id===id)?.target||table;
          perform(target,action.power?'press':'grab',action.run);
        }else action.run();
      };container.append(button);
    }
    if(remoteMode)container.insertAdjacentHTML('beforeend','<div class="remote-pad" aria-hidden="true">OK</div>');
    popup.append(container);view.append(popup);
  }
  function takeRemote(id='remote'){
    if(handAction||step===0)return;
    const isAC=id==='acremote',object=isAC?acRemote:remote;
    if(isAC?hasAcRemote:hasRemote)return;
    perform(object,'grab',()=>{
      if(isAC)hasAcRemote=true;else hasRemote=true;
      heldKind=isAC?'acremote':'remote';hands.hold(object,heldKind);
      if(taskId===(isAC?'cooling':'television'))progressTask(1);
      closeMenu();feedback.textContent='拿稳了。拇指先放松，再轻轻弯一下按键。';
    });
  }
  function pressHeldRemote(){
    if(handAction||step===0||!(heldKind==='remote'||heldKind==='acremote'))return false;
    if(step===commands.length-1)return false;
    const now=performance.now(),isAC=heldKind==='acremote';
    hands.pressRemote(now);closeMenu();
    handAction={start:now,duration:650,goal:new THREE.Vector3(),mode:'thumb',done(){
      if(isAC){
        if(taskId==='cooling'&&step===3){swingOn=true;progressTask(3);feedback.textContent='摆风已开启，看看出风口。';}
        else {acOn=true;if(taskId==='cooling')progressTask(2);feedback.textContent='空调开了。再按一次，让风摆动。';}
      }else{toggleTV(true);feedback.textContent='电视打开了！大拇指按键完成。';}
      announce(feedback.textContent);
    }};
    return true;
  }
  function releaseRemote(){
    if(handAction||!(heldKind==='remote'||heldKind==='acremote'))return;
    const isAC=heldKind==='acremote';hands.release(isAC?acRemote:remote);heldKind=null;
    if(isAC)hasAcRemote=false;else hasRemote=false;
    hands.thumb(0);feedback.textContent='遥控器放回茶几了。';
    if((taskId==='television'||taskId==='cooling')&&step===2){step=1;updateTask();}
  }
  function remoteMenu() {
    if(!hasRemote){takeRemote('remote');return;}
    pressHeldRemote();
  }

  function interact(id) {
    if(handAction)return;
    if(step===0){feedback.textContent='先在俯视图上画好路线，再点「走过去」。';return;}

    if(id==='fridge') {
      menu('冷藏冰箱',fridgeOpen?'上层是牛奶，中层是鸡蛋盒，下层是蔬菜。':'请握住把手打开冰箱。',[{label:fridgeOpen?'关上冰箱门':'打开冰箱门',run(){
        if(taskId==='eggs'&&fridgeOpen&&step<4){feedback.textContent='先打开中层鸡蛋盒，取出一枚鸡蛋。';return;}
        perform(fridge,'pull',()=>{fridgeOpen=!fridgeOpen;if(!fridgeOpen)eggTrayOpen=false;
          if(taskId==='eggs'){if(fridgeOpen)progressTask(1);else if(hasEgg)progressTask(4);}
          feedback.textContent=step===commands.length-1?commands.at(-1):fridgeOpen?'冰箱打开了，可以看到三个储物层。':'冰箱门关好了。';
        });
      }}]);return;
    }
    if(id==='eggtray') {
      if(!fridgeOpen){feedback.textContent='请先打开冰箱门。';return;}
      menu('中层 · 鸡蛋盒',eggTrayOpen?'鸡蛋盒已经拉开。':'透明蛋盒可以向外拉开。',[{label:eggTrayOpen?'推回鸡蛋盒':'拉开鸡蛋盒',run(){
        if(taskId==='eggs'&&eggTrayOpen&&!hasEgg){feedback.textContent='请先拿出一枚鸡蛋。';return;}
        perform(eggTray,'pull',()=>{eggTrayOpen=!eggTrayOpen;if(taskId==='eggs'&&eggTrayOpen)progressTask(2);feedback.textContent=eggTrayOpen?'鸡蛋盒拉开了，请拿一枚鸡蛋。':'鸡蛋盒推回去了。';});
      }}]);return;
    }
    if(id==='egg') {
      if(!fridgeOpen||!eggTrayOpen){feedback.textContent='请先打开冰箱和中层鸡蛋盒。';return;}
      menu('鸡蛋盒里的鸡蛋',hasEgg?'手里已经有一枚鸡蛋。':'从蛋盒里拿出一枚。',[{label:hasEgg?'已经拿好了':'拿一枚鸡蛋',run(){if(hasEgg)return;perform(eggTray,'grab',()=>{hasEgg=true;heldKind='egg';hands.hold(eggs[0],'egg');if(taskId==='eggs')progressTask(3);feedback.textContent='鸡蛋拿好了，请关上冰箱。';});}}]);return;
    }
    if(id==='acremote'||id==='aircon') {
      if(!hasAcRemote)takeRemote('acremote');else pressHeldRemote();return;
    }
    if(id==='deskdrawer') {
      menu('书桌右侧抽屉',deskDrawerOpen?'抽屉里有一本书。':'握住把手拉开抽屉。',[{label:deskDrawerOpen?'关上抽屉':'拉开抽屉',run(){
        if(taskId==='childroom'&&deskDrawerOpen&&!hasBook){feedback.textContent='请先取出抽屉里的书。';return;}
        perform(desk,'pull',()=>{deskDrawerOpen=!deskDrawerOpen;if(taskId==='childroom'&&deskDrawerOpen)progressTask(1);feedback.textContent=deskDrawerOpen?'抽屉打开了。':'抽屉关好了。';});
      }}]);return;
    }
    if(id==='book') {
      if(!deskDrawerOpen||hasBook)return;
      menu('抽屉里的书','把书取出来，再整理到桌面上。',[{label:'拿出这本书',run(){perform(book,'grab',()=>{hasBook=true;heldKind='book';hands.hold(book,'book');if(taskId==='childroom')progressTask(2);feedback.textContent='书拿好了，请放到桌面左侧。';});}}]);return;
    }
    if(id==='desk') {
      menu('书桌左侧',hasBook?'把手里的书放在这里。':'请先从抽屉里取出书。',[{label:'把书放到桌面左侧',run(){if(!hasBook){feedback.textContent='请先打开抽屉拿书。';return;}perform(desk,'place',()=>{hands.release(book,house,new THREE.Vector3(6.7,.92,.1));heldKind=null;deskDrawerOpen=false;if(taskId==='childroom')progressTask(3);feedback.textContent=commands.at(-1);});}}]);return;
    }
    if(id==='desklamp'){menu('书桌台灯','点击开关，照亮桌面。',[{label:deskLampOn?'关灯':'开灯',run(){perform(deskLamp,'press',()=>{deskLampOn=!deskLampOn;deskLight.intensity=deskLampOn?3:0;feedback.textContent=deskLampOn?'书桌台灯打开了。':'书桌台灯关闭了。';});}}]);return;}
    if(id==='dishcabinet') {
      menu('餐边柜',dishOpen?'里面有白色饭碗。':'拉开柜门取出饭碗。',[{label:dishOpen?'关上柜门':'打开柜门',run(){if(taskId==='tableware'&&dishOpen&&!hasBowl){feedback.textContent='请先拿出饭碗。';return;}perform(dishCabinet,'pull',()=>{dishOpen=!dishOpen;if(taskId==='tableware'&&dishOpen)progressTask(1);feedback.textContent=dishOpen?'柜门打开了。':'柜门关好了。';});}}]);return;
    }
    if(id==='bowl') {
      if(!dishOpen||hasBowl)return;menu('白色饭碗','用手拿出柜子里的饭碗。',[{label:'拿出饭碗',run(){perform(bowl,'grab',()=>{hasBowl=true;heldKind='bowl';hands.hold(bowl,'bowl');if(taskId==='tableware')progressTask(2);feedback.textContent='饭碗拿好了。';transition={position:new THREE.Vector3(.05,1.75,2.9),target:new THREE.Vector3(.05,.9,1.9)};});}}]);return;
    }
    if(id==='tableplace') {
      menu('餐桌上的摆放位置','把饭碗放在圆圈内。',[{label:'放下饭碗',run(){if(!hasBowl){feedback.textContent='请先从餐边柜取出饭碗。';return;}perform(tablePlace,'place',()=>{hands.release(bowl,house,new THREE.Vector3(.34,1,1.7));heldKind=null;dishOpen=false;if(taskId==='tableware')progressTask(3);feedback.textContent=commands.at(-1);});}}]);return;
    }
    if(id==='cup') {
      menu('餐桌上的空杯',hasCup?'杯子已经拿好了。':'拿起杯子，再用保温壶倒水。',[{label:hasCup?'查看杯子':'拿起空杯',run(){
        if(!hasCup){hasCup=true;heldKind='cup';hands.hold(cup,'cup');if(taskId==='water')progressTask(1);}
        feedback.textContent='杯子拿好了，可以倒水了。';closeMenu();
      }}]);return;
    }
    if(id==='thermos') {
      menu('保温壶','把水倒进杯子。',[{label:pouring?'正在倒水…':'往杯子里倒水',run(){
        if(!hasCup){feedback.textContent='请先拿起餐桌上的空杯。';announce(feedback.textContent);return;}
        if(pouring)return;
        hands.release(cup,house,new THREE.Vector3(-.35,.81,1.65));heldKind=null;pouring=performance.now();closeMenu();feedback.textContent='正在往杯子里倒水。';
      }}]);return;
    }
    if(id==='curtains') {
      menu('卧室窗帘',curtainClosed?'窗帘已经拉上。':'窗帘现在开着。',[{label:curtainClosed?'拉开窗帘':'拉上窗帘',run(){
        curtainClosed=!curtainClosed;
        if(taskId==='bedroom'&&curtainClosed){if(step===1)progressTask(1);else if(step===2&&bedLightOn)progressTask(2);}
        feedback.textContent=curtainClosed?'窗帘拉好了。':'窗帘拉开了。';closeMenu();
      }}]);return;
    }
    if(id==='bedlamp') {
      menu('床头灯',bedLightOn?'床头灯亮着。':'床头灯关着。',[{label:bedLightOn?'关灯':'开灯',run(){
        bedLightOn=!bedLightOn;bedroomLight.intensity=bedLightOn?4:0;
        bedshade.material=material(bedLightOn?0xffe6a6:0xf0d8a6,{emissive:bedLightOn?0xffbd65:0,emissiveIntensity:bedLightOn?.4:0});
        if(taskId==='bedroom'&&bedLightOn&&curtainClosed)progressTask(2);
        feedback.textContent=step===commands.length-1?commands.at(-1):bedLightOn?'床头灯已打开。':'床头灯已关闭。';closeMenu();
      }}]);return;
    }
    if(id==='remote'||id==='table'){remoteMenu();return;}
    if(id==='tv') {
      menu('电视',tvOn?'电视正在播放。':'电视已关闭。',[
        {label:hasRemote?'使用遥控器':'查看遥控器',run:remoteMenu},
        {label:tvOn?'关闭电视':'打开电视',run(){feedback.textContent=toggleTV();closeMenu();}}
      ]);return;
    }
    if(id==='lamp')menu('客厅落地灯',lightOn?'灯已经亮了。':'灯已关闭。',[{label:lightOn?'关灯':'开灯',run(){
      lightOn=!lightOn;lampLight.intensity=lightOn?9:0;
      shade.material=material(lightOn?0xffe6a6:0xf4dfb1,{emissive:lightOn?0xffc260:0,emissiveIntensity:lightOn?.45:0});
      feedback.textContent=lightOn?'客厅落地灯已打开。':'客厅落地灯已关闭。';closeMenu();
    }}]);

  }
  const hotspots=[];
  function hotspot(target,label,icon,offset) {
    const button=document.createElement('button');button.className='home3d-hotspot';button.textContent=({'remote':'遥控器','tv':'电视','cup':'水杯','thermos':'保温壶','curtains':'窗帘','bedlamp':'床头灯','fridge':'冰箱','eggtray':'蛋盒','egg':'鸡蛋','acremote':'遥控器','aircon':'空调','deskdrawer':'抽屉','book':'书','desk':'放好书','desklamp':'台灯','dishcabinet':'柜门','bowl':'饭碗','tableplace':'放碗处','lamp':'落地灯'})[target.userData.id]||icon;
    button.dataset.homeTarget=target.userData.id;button.setAttribute('aria-label',label);button.title=label;
    button.onclick=()=>interact(target.userData.id);view.append(button);
    hotspots.push({target,button,offset:new THREE.Vector3(...offset)});
  }
  hotspot(sofa,'走到沙发旁','⌂',[0,1.5,0]);
  hotspot(remote,'查看电视遥控器','▦',[0,.3,0]);
  hotspot(television,'电视交互菜单','▣',[0,2.1,0]);
  hotspot(lamp,'灯光开关','☼',[0,2.4,0]);
  hotspot(fridge,'冰箱交互菜单','❄',[0,2.6,0]);
  hotspot(aircon,'空调交互菜单','≈',[0,.6,0]);
  hotspot(eggTray,'中层鸡蛋盒','▤',[0,.3,.4]);
  hotspot(eggs[0],'拿一枚鸡蛋','卵',[0,.15,0]);
  hotspot(acRemote,'空调遥控器','▦',[0,.3,0]);
  hotspot(deskDrawer,'书桌抽屉','▤',[0,.1,.5]);
  hotspot(book,'抽屉里的书','书',[0,.15,0]);
  hotspot(desk,'把书放到桌面','▣',[-.8,1,0]);
  hotspot(deskLamp,'书桌台灯','☼',[0,.7,0]);
  hotspot(dishCabinet,'餐边柜','▤',[0,1,0]);
  hotspot(bowl,'取饭碗','碗',[0,.2,0]);
  hotspot(tablePlace,'放好饭碗','◎',[0,.3,0]);
  hotspot(cup,'拿起餐桌上的空杯','∪',[0,.4,0]);
  hotspot(thermos,'使用保温壶倒水','♧',[0,1.5,0]);
  hotspot(curtains,'卧室窗帘开关','▥',[.2,1.6,0]);
  hotspot(bedlamp,'床头灯开关','☼',[0,.9,0]);

  const heldButton=document.createElement('button');heldButton.className='home3d-secondary';heldButton.textContent='手中的遥控器';heldButton.hidden=true;
  heldButton.onclick=pressHeldRemote;root.querySelector('.home3d-inline-actions').append(heldButton);

  const directRemote=document.createElement('div');directRemote.className='home5-remote';directRemote.hidden=true;
  directRemote.innerHTML='<button class="home5-control" aria-label="按手中遥控器的电源键"><span aria-hidden="true">⏻</span></button><span class="home5-control-label">拇指按这里</span>';
  directRemote.querySelector('button').onclick=pressHeldRemote;view.append(directRemote);
  const releaseButton=document.createElement('button');releaseButton.className='home5-release';releaseButton.textContent='放回茶几';releaseButton.hidden=true;releaseButton.onclick=releaseRemote;view.append(releaseButton);
  const remoteStatus=document.createElement('p');remoteStatus.className='home5-remote-status';remoteStatus.hidden=true;remoteStatus.setAttribute('role','status');view.append(remoteStatus);
  const roomLabels=[];
  for(const [label,x,z] of [['卫生间',-3,-2.6],['主卧',-3,2.4],['子女房',7.1,1],['餐厅',.05,2.1],['厨房',.6,-3],['客厅',3,1.6],['从这里出发',task.start.x,task.start.z],['目的地',destination.x,destination.z]]) {
    const el=document.createElement('span');el.className='home3d-room-label';el.textContent=label;view.append(el);
    if(label==='从这里出发')el.className+=' home3d-start-label';if(label==='目的地')el.className+=' home3d-destination-label';
    roomLabels.push({el,point:new THREE.Vector3(x,.16,z)});
  }
  const goalRing=new THREE.Mesh(new THREE.RingGeometry(.4,.47,40),new THREE.MeshBasicMaterial({color:0xd89d64,side:THREE.DoubleSide}));
  goalRing.rotation.x=-Math.PI/2;goalRing.position.set(destination.x,.14,destination.z);house.add(goalRing);
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();

  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  function floorPoint(event) {
    const r=renderer.domElement.getBoundingClientRect();
    mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(mouse,camera);
    const point=new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane,point)?{x:point.x,z:point.z}:null;
  }
  let pointerStart=null;
  renderer.domElement.addEventListener('pointerdown',event=>{
    pointerStart={x:event.clientX,y:event.clientY,time:performance.now()};
    if(step>0&&!browsing&&event.button===0){looking=true;transition=null;lookLast={x:event.clientX,y:event.clientY};renderer.domElement.setPointerCapture(event.pointerId);return;}
    if(step!==0||walking||browsing||event.button!==0)return;
    const point=floorPoint(event);
    if(!point)return;
    drawing=true;drawn=[point];routeResult=null;depart.disabled=true;clearDrawn();
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove',event=>{
    if(looking&&lookLast){
      const dx=event.clientX-lookLast.x,dy=event.clientY-lookLast.y;lookLast={x:event.clientX,y:event.clientY};
      const direction=controls.target.clone().sub(camera.position);const length=Math.max(1,direction.length());
      const yaw=Math.atan2(direction.x,-direction.z)-dx*.004,pitch=THREE.MathUtils.clamp(Math.asin(direction.y/length)+dy*.003,-.95,.7);
      controls.target.copy(camera.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(length));return;
    }
    if(!drawing)return;
    const point=floorPoint(event),last=drawn.at(-1);
    if(point&&Math.hypot(point.x-last.x,point.z-last.z)>.09){drawn.push(point);drawLine();}
  });
  function endDrawing(event,cancelled=false) {
    if(!drawing)return;
    drawing=false;
    if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
    if(cancelled){routeResult=null;depart.disabled=true;feedback.textContent='绘制中断了，请重新画。';return;}
    const point=floorPoint(event);if(point)drawn.push(point);
    routeResult=validateRoute(drawn,blocked,{x:avatar.position.x,z:avatar.position.z},destination,task);
    if(routeResult.valid)drawn=routeResult.points;
    drawLine(routeResult.valid?0x477c69:0xc27c50);
    feedback.textContent=routeResult.message;depart.disabled=!routeResult.valid;
  }
  renderer.domElement.addEventListener('pointercancel',event=>{looking=false;lookLast=null;endDrawing(event,true);});
  renderer.domElement.addEventListener('pointerup',event=>{
    looking=false;lookLast=null;
    if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
    if(browsing)return;
    if(step===0){endDrawing(event);return;}
    if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7)return;
    const r=renderer.domElement.getBoundingClientRect();
    mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObject(house,true).filter(hit=>{
      let object=hit.object;while(object){if(!object.visible)return false;object=object.parent;}return true;
    });
    if(!hits.length)return;
    let target=hits[0].object;while(target&&!target.userData.id)target=target.parent;
    if(target&&target.userData.id!=='floor')interact(target.userData.id);
  });
  root.querySelector('[data-read]').onclick=()=>announce(commands[step]);

  root.querySelector('[data-hint]').onclick=()=>{
    showGuide();feedback.textContent=task.hints[step]||commands[step];
    if(step>0)hotspots.find(h=>h.target.userData.id===task.targets[step])?.button.classList.add('hinted');
    announce(feedback.textContent);
  };

  function startTask(id) {
    taskId=id;task=homeTasks[id]||homeTasks.television;commands=task.commands;destination={...task.destination};
    window.speechSynthesis?.cancel();
    hands.reset();if(homeGesture){gesturePourProgress=0;gesturePourLast=0;}clearGuide();handAction=null;heldKind=null;root.querySelector('.home3d-task').hidden=true;root.querySelector('[data-settings]').setAttribute('aria-expanded','false');
    eggTrayOpen=false;hasEgg=false;hasAcRemote=false;swingOn=false;acOn=false;deskDrawerOpen=false;hasBook=false;deskLampOn=false;dishOpen=false;hasBowl=false;
    deskLight.intensity=0;book.visible=true;book.position.set(8.05,.72,-.05);bowl.position.set(-.52,.58,3.08);acRemote.visible=true;eggs.forEach(egg=>egg.visible=true);fridgeOpen=false;
    path=[];onArrival=null;step=0;avatar.position.set(task.start.x,0,task.start.z);avatar.visible=true;
    remoteStatus.dataset.live='';hasRemote=false;remote.visible=true;hasCup=false;pouring=0;cupWater.visible=false;cupWater.scale.y=1;cup.position.set(-.35,.9,1.8);
    thermos.position.set(.2,0,1.9);thermos.rotation.z=0;curtainClosed=false;bedLightOn=false;bedroomLight.intensity=0;
    bedshade.material=material(0xf0d8a6);
    walking=false;drawing=false;drawn=[];routeResult=null;clearDrawn();planning.hidden=false;depart.disabled=true;root.querySelector('[data-clear]').disabled=false;
    tvOn=false;screen.material=material(0x1c2d2c);tvPicture.visible=false;closeMenu();
    root.querySelector('.home3d-instruction h2').textContent=task.title;
    root.querySelector('#home-task-choice').value=id;
    goalRing.position.set(destination.x,.14,destination.z);
    roomLabels.at(-2).point.set(task.start.x,.16,task.start.z);
    roomLabels.at(-1).point.set(destination.x,.16,destination.z);
    roomLabels.at(-1).el.textContent=task.destinationName;
    planningView();updateTask();renderRecords();
    feedback.textContent='从'+task.startName+'的人物旁开始，画出您想走的路线。';announce(commands[0]);
  }
  root.querySelector('[data-restart]').onclick=()=>startTask(taskId);
  root.querySelector('#home-task-choice').onchange=event=>startTask(event.target.value);
  function resetView(){if(step===0)planningView();else livingView();}
  root.querySelector('[data-view="reset"]').onclick=resetView;
  root.querySelector('[data-view="explore"]').onclick=()=>{
    if(browsing){resetView();return;}
    browsing=true;controls.enabled=true;transition=null;
    camera.position.set(16,17,18);controls.target.set(2,.3,0);camera.fov=36;camera.updateProjectionMatrix();controls.update();
    root.querySelector('[data-view="explore"]').textContent=step===0?'继续画路线':'回到'+task.room;
    root.querySelector('.home3d-tip').textContent='拖动旋转 · 双指平移、缩放 · 点击上方按钮当前操作位置';
  };

  root.querySelector('[data-view="top"]').onclick=planningView;
  root.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=> {
    const delta=camera.position.clone().sub(controls.target).multiplyScalar(b.dataset.zoom==='in'?.84:1.16);
    delta.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(delta);controls.update();
  });
  root.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{
    if(step===0||handAction)return;transition=null;clearGuide();
    const forward=controls.target.clone().sub(camera.position);forward.y=0;forward.normalize();
    const right=new THREE.Vector3(-forward.z,0,forward.x);
    const move=button.dataset.move==='forward'?forward:button.dataset.move==='back'?forward.negate():button.dataset.move==='right'?right:right.negate();move.multiplyScalar(.28);
    const next=camera.position.clone().add(move);
    if(!blocked(next.x,next.z)){camera.position.add(move);controls.target.add(move);feedback.textContent='可以拖动画面看四周，点击物品操作。';}
    else feedback.textContent='这边有家具，换个方向试试。';
  });
  function resize(){const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;if(step===0&&!browsing&&!walking){camera.position.set(2,planDistance(w,h),.36);controls.target.set(2,0,.35);}camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(view);resize();
  let frame=0,last=performance.now();
  function animate(now) {
    if(disposed)return;
    const dt=Math.min((now-last)/1000,.05);last=now;
    hands.control?.(taskId==='cooling'&&step===3?'swing':'power');hands.setHeld(heldKind);hands.update(step>0&&!browsing,handAction,now);
    if(handAction){const elapsed=(now-handAction.start)/handAction.duration;
      if(elapsed>=.52&&!handAction.contacted){handAction.contacted=true;handAction.done();}
      if(elapsed>=1)handAction=null;
    }
    if(guide.visible&&guideCurve){if(now>guideUntil)clearGuide();else guideDots.forEach((dot,i)=>dot.position.copy(guideCurve.getPoint((now*.0003+i/guideDots.length)%1)));}
    root.querySelector('.home3d-move').hidden=step===0||browsing;
    fridgeDoor.rotation.y=THREE.MathUtils.damp(fridgeDoor.rotation.y,fridgeOpen?-Math.PI*.6:0,6,dt);
    fridgeLight.intensity=fridgeOpen?1.2:0;
    eggTray.position.z=THREE.MathUtils.damp(eggTray.position.z,eggTrayOpen?.6:.02,7,dt);
    deskDrawer.position.z=THREE.MathUtils.damp(deskDrawer.position.z,deskDrawerOpen?.5:0,7,dt);
    if(!hasBook)book.position.z=-.05+deskDrawer.position.z;
    dishDoor.rotation.y=THREE.MathUtils.damp(dishDoor.rotation.y,dishOpen?Math.PI*.6:0,6,dt);
    airFlow.visible=acOn;acFlap.rotation.z=acOn?(swingOn?Math.sin(now*.0015)*.45:.18):0;
    for(let i=0;i<windLines.length;i++){const wind=windLines[i],t=(now*.00045+i/12)%1;wind.position.x=-.15-t*1.4;wind.position.y=-.15-t*(swingOn?.25+.2*Math.sin(now*.0015):.3);wind.material.opacity=(1-t)*.45;}
    if(transition){
      const amount=1-Math.exp(-dt*4);
      camera.position.lerp(transition.position,amount);controls.target.lerp(transition.target,amount);
      if(camera.position.distanceTo(transition.position)<.01){camera.position.copy(transition.position);controls.target.copy(transition.target);transition=null;}
    }
    if(browsing)controls.update();else camera.lookAt(controls.target);

    curtainAmount+=(Number(curtainClosed)-curtainAmount)*Math.min(1,dt*5);
    curtainLeaves[0].position.z=THREE.MathUtils.lerp(-.87,-.46,curtainAmount);
    curtainLeaves[1].position.z=THREE.MathUtils.lerp(.56,.16,curtainAmount);
    curtainLeaves.forEach(leaf=>leaf.scale.z=1+curtainAmount*.8);
    if(pouring) {
      const progress=Math.min(1,(now-pouring)/1500);
      thermos.rotation.z=Math.sin(progress*Math.PI)*.7;
      thermos.position.x=.2-Math.sin(progress*Math.PI)*.18;
      cupWater.visible=true;cupWater.scale.y=1+progress*15;cupWater.position.y=.04+progress*.075;
      if(progress===1){pouring=0;thermos.rotation.z=0;thermos.position.set(.2,0,1.9);if(taskId==='water')progressTask(2);feedback.textContent=taskId==='water'&&step===commands.length-1?commands.at(-1):'杯子里的水倒好了。';}
    }
    const direction=camera.position.clone().sub(controls.target).normalize();
    for(const wall of walls)wall.group.visible=wall.normal.dot(direction)<.16;
    curtains.visible=west.visible;
    if(path.length) {
      const goal=path[0],delta=goal.clone().sub(avatar.position),distance=delta.length();
      if(distance<dt*1.5){avatar.position.copy(goal);path.shift();}
      else {avatar.position.addScaledVector(delta.normalize(),dt*1.5);avatar.rotation.y=Math.atan2(delta.x,delta.z);}
      legs.forEach((leg,i)=>leg.rotation.x=Math.sin(now*.009+i*Math.PI)*.25);
      if(!path.length){legs.forEach(leg=>leg.rotation.x=0);const done=onArrival;onArrival=null;done?.();if([translate('正在走过去。'),'正在走过去。'].includes(feedback.textContent))feedback.textContent='已经到这里了。';}
    }
    for(const h of hotspots) {
      const point=h.target.localToWorld(h.offset.clone()).project(camera);
      h.button.style.left=(point.x*.5+.5)*view.clientWidth+'px';
      h.button.style.top=(-point.y*.5+.5)*view.clientHeight+'px';
      h.button.hidden=step===0||(!browsing&&!task.items.includes(h.target.userData.id))||((h.target===eggTray||h.target.userData.id==='egg')&&!fridgeOpen)||(h.target.userData.id==='egg'&&!eggTrayOpen)||(h.target===book&&!deskDrawerOpen)||(h.target===bowl&&!dishOpen)||(h.target===acRemote&&hasAcRemote)||point.z>1||Math.abs(point.x)>.95||Math.abs(point.y)>.95||(h.target===remote&&hasRemote)||(h.target===cup&&hasCup)||(h.target===book&&hasBook)||(h.target===bowl&&hasBowl)||(h.target===eggs[0]&&hasEgg);
    }
    const labelBoxes=[];
    for(const label of [roomLabels.at(-2),roomLabels.at(-1),...roomLabels.slice(0,-2)]) {
      const point=label.point.clone().project(camera);
      label.el.hidden=step!==0||browsing||Math.abs(point.x)>.95||Math.abs(point.y)>.95;
      const width=label.el.offsetWidth||label.el.textContent.length*26+32,height=label.el.offsetHeight||54;
      const x=THREE.MathUtils.clamp((point.x*.5+.5)*view.clientWidth,width/2+10,view.clientWidth-width/2-10);
      let y=(-point.y*.5+.5)*view.clientHeight+(label===roomLabels.at(-2)?54:label===roomLabels.at(-1)?-54:18);
      y=THREE.MathUtils.clamp(y,height/2+12,view.clientHeight-height/2-120);
      for(let tries=0;tries<8&&labelBoxes.some(box=>Math.abs(box.x-x)<(box.width+width)/2+8&&Math.abs(box.y-y)<(box.height+height)/2+8);tries++)y+=height+12;
      labelBoxes.push({x,y,width,height});label.el.style.left=x+'px';label.el.style.top=y+'px';

    }
    goalRing.visible=step===0;
    heldButton.hidden=true;
    const holdingRemote=(heldKind==='remote'||heldKind==='acremote')&&step>0&&!browsing;
    root.classList.toggle('home5-holding-remote',holdingRemote);root.classList.toggle('home5-pressing',handAction?.mode==='thumb');directRemote.hidden=!holdingRemote;releaseButton.hidden=!holdingRemote;remoteStatus.hidden=!holdingRemote;
    if(holdingRemote){
      camera.updateMatrixWorld(true);const control=hands.controlPoint();
      if(control){const p=control.project(camera);directRemote.style.left=(p.x*.5+.5)*view.clientWidth+'px';directRemote.style.top=(-p.y*.5+.5)*view.clientHeight+'px';}
      directRemote.querySelector('button').disabled=!!handAction||step===commands.length-1;
      const swingKey=taskId==='cooling'&&step===3;directRemote.classList.toggle('swing',swingKey);directRemote.querySelector('button span').textContent=swingKey?'≈':'⏻';
      directRemote.querySelector('.home5-control-label').textContent=taskId==='cooling'&&step===3?'拇指按摆风键':'拇指按开机键';
      releaseButton.disabled=!!handAction;remoteStatus.textContent=handAction?.mode==='thumb'?'按下了':step===commands.length-1?'完成了，可以放回遥控器':remoteStatus.dataset.live||'握住遥控器，轻轻弯一下拇指';
    }
    renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  }
  root.querySelector('.home3d-back').onclick=()=> {
    disposed=true;homeGesture?.stop();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();window.speechSynthesis?.cancel();
    const usedMaterials=new Set(materials.values());
    scene.traverse(object=>{
      object.geometry?.dispose();
      if(object.material) {
        const list=Array.isArray(object.material)?object.material:[object.material];
        list.forEach(material=>usedMaterials.add(material));
      }
    });
    usedMaterials.add(screenOnMaterial);
    usedMaterials.forEach(material=>material.dispose());
    textures.forEach(texture=>texture.dispose());
    hands.dispose();renderer.dispose();removeFrame();
  };
  startTask('television');frame=requestAnimationFrame(animate);
  let gestureLine=false,gesturePourProgress=0,gesturePourLast=0;
  function gestureFloor(point){const rect=renderer.domElement.getBoundingClientRect();return floorPoint({clientX:rect.left+point.x*rect.width,clientY:rect.top+point.y*rect.height});}
  function gestureDraw(type,point){
    if(step!==0||walking)return false;
    if(type==='cancel'){gestureLine=false;drawn=[];routeResult=null;depart.disabled=true;clearDrawn();return false;}
    const p=point?gestureFloor(point):null;
    if(type==='start'){
      if(!p||Math.hypot(p.x-avatar.position.x,p.z-avatar.position.z)>1.1)return false;
      planningView();gestureLine=true;drawn=[{x:avatar.position.x,z:avatar.position.z}];routeResult=null;depart.disabled=true;clearDrawn();return true;
    }
    if(!gestureLine)return false;
    if(type==='move'&&p){if(Math.hypot(p.x-drawn.at(-1).x,p.z-drawn.at(-1).z)>.07){drawn.push(p);drawLine();}return true;}
    if(type==='end'){
      gestureLine=false;if(p)drawn.push(p);
      routeResult=validateRoute(drawn,blocked,{x:avatar.position.x,z:avatar.position.z},destination,task);
      if(routeResult.valid)drawn=routeResult.points;drawLine(routeResult.valid?0x477c69:0xc27c50);depart.disabled=!routeResult.valid;feedback.textContent=routeResult.message;return routeResult.valid;
    }
    return false;
  }
  function gestureChoose(id){
    if(handAction||step===0)return;
    if(id==='remote'||id==='acremote'){takeRemote(id);return;}
    interact(id);
    const buttons=popup?[...popup.querySelectorAll('button')].filter(button=>!button.classList.contains('home3d-dismiss')):[];
    const action=taskId==='cooling'&&step===3?buttons[1]:buttons[0];action?.click();
  }
  homeGesture=mountHomeGesture(root,{
    speak:announce,sceneRect:()=>renderer.domElement.getBoundingClientRect(),
    state:()=>({stage:step===0?'route':'room',valid:!!routeResult?.valid,busy:!!handAction||walking||!!pouring,done:step===commands.length-1,
      remote:heldKind==='remote'||heldKind==='acremote',heldKind,
      action:heldKind==='remote'||heldKind==='acremote'?'remote-press':taskId==='water'&&step===2?'pour':taskId==='tableware'&&step===2?'take-bowl':taskId==='tableware'&&step===3?'place-bowl':'normal',held:!!heldKind}),
    draw:gestureDraw,go:()=>{if(!depart.disabled)depart.click();},hint:()=>root.querySelector('[data-hint]').click(),
    pick:point=>{
      if(step===0||handAction)return null;
      camera.updateMatrixWorld(true);let best=null,distance=.115;
      for(const h of hotspots){
        if(h.button.hidden||!task.items.includes(h.target.userData.id))continue;
        const p=new THREE.Box3().setFromObject(h.target).getCenter(new THREE.Vector3()).project(camera);
        const d=Math.hypot((p.x*.5+.5-point.x),(-p.y*.5+.5-point.y));
        if(p.z<1&&d<distance){best=h.target.userData.id;distance=d;}
      }return best;
    },
    remoteStatus:text=>{remoteStatus.textContent=text;remoteStatus.dataset.live=text;},
    choose:gestureChoose,pressRemote:pressHeldRemote,releaseRemote,thumb:amount=>hands.thumb(amount),
    demo:()=>{startTask('television');arriveDestination();},
    look:(dx,dy)=>{
      if(step===0||handAction)return;transition=null;
      const direction=controls.target.clone().sub(camera.position),length=Math.max(1,direction.length());
      const yaw=Math.atan2(direction.x,-direction.z)-dx*2,pitch=THREE.MathUtils.clamp(Math.asin(direction.y/length)+dy*1.5,-.95,.7);
      controls.target.copy(camera.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(length));
    },
    pour:active=>{
      const now=performance.now();
      if(!active||taskId!=='water'||step!==2||!hasCup){gesturePourLast=0;return;}
      if(gesturePourLast)gesturePourProgress+=Math.min(.2,(now-gesturePourLast)/1000)/2;
      gesturePourLast=now;cupWater.visible=true;cupWater.scale.y=1+Math.min(1,gesturePourProgress)*15;cupWater.position.y=.04+Math.min(1,gesturePourProgress)*.075;
      if(gesturePourProgress>=1){gesturePourProgress=0;gesturePourLast=0;progressTask(2);feedback.textContent='双手配合，水倒好了。';}
    },
    apply:action=>gestureChoose(action==='pour'?'thermos':action==='take-bowl'?'bowl':'tableplace'),
    follow:(pose,options)=>{
      hands.follow?.(pose,options);
      if(taskId==='water'&&step===2&&hasCup&&options?.twoHands)hands.holdSecondary(thermos,'thermos');
    },
    changed:on=>{if(!on){hands.follow(null);hands.thumb(0);hands.release(thermos);gesturePourLast=0;}root.classList.toggle('home-gesture-enabled',on);root.querySelector('[data-home-gesture]').textContent=on?'再学手势':'手势教学';}
  });
  root.querySelector('[data-home-demo]').onclick=()=>homeGesture.demo();
  root.querySelector('[data-home-gesture]').onclick=()=>homeGesture.teach();homeGesture.choose();

}
