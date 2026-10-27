(() => {
  'use strict';
  const THREE = window.THREE, CANNON = window.CANNON;
  const canvasHost = document.body;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9bc5df); scene.fog = new THREE.Fog(0x9bc5df, 45, 110);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 150);
  camera.position.set(28, 22, 34);
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; canvasHost.prepend(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6e774f, 1.1));
  const sun = new THREE.DirectionalLight(0xffedc4, 1.15); sun.position.set(-16, 32, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = sun.shadow.camera.bottom = -35; sun.shadow.camera.right = sun.shadow.camera.top = 35; scene.add(sun);
  const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.target.set(0, 4, 0); controls.minDistance = 25; controls.maxDistance = 70; controls.maxPolarAngle = Math.PI / 2.1; controls.enablePan = false; controls.update();
  const world = new CANNON.World(); world.gravity.set(0, -20, 0); world.broadphase = new CANNON.SAPBroadphase(world); world.solver.iterations = 8; world.allowSleep = true;
  const stone = new CANNON.Material('stone'), earth = new CANNON.Material('earth'); world.addContactMaterial(new CANNON.ContactMaterial(stone, stone, { friction: .85, restitution: .03 })); world.addContactMaterial(new CANNON.ContactMaterial(stone, earth, { friction: .9, restitution: .03 }));
  const ground = new CANNON.Body({ mass: 0, material: earth, shape: new CANNON.Plane() }); ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(ground);
  const stoneColors = [0xb9b3a1,0xc8c0aa,0xaaa999,0xd0c9b4,0x9fa298];
  const mats = stoneColors.map(c => new THREE.MeshStandardMaterial({ color:c, roughness:1 }));
  const roofMat = new THREE.MeshStandardMaterial({color:0x9f4632,roughness:1}), wood = new THREE.MeshStandardMaterial({color:0x5a351d,roughness:1}), grass = new THREE.MeshStandardMaterial({color:0x79a85a,roughness:1}), dark = new THREE.MeshStandardMaterial({color:0x263c35,roughness:1});
  const blocks = [], decor = [], shots = [], people = []; let level = 1, fired = 0, active = false, ended = false, initial = 0, announceUntil = 0;
  const $ = id => document.getElementById(id);
  const terrain = new THREE.Mesh(new THREE.BoxGeometry(80,2,80), grass); terrain.position.y=-1.05; terrain.receiveShadow=true; scene.add(terrain);
  function fixed(mesh, permanent=false) { mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); if(!permanent)decor.push(mesh); return mesh; }
  function box(x,y,z,w,h,d,mat=wood,permanent=false){const m=fixed(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),permanent);m.position.set(x,y,z);return m;}
  const water=new THREE.MeshStandardMaterial({color:0x4a93a0,roughness:.28,metalness:.1}), dirt=new THREE.MeshStandardMaterial({color:0x9c8c62,roughness:1}), canvas=new THREE.MeshStandardMaterial({color:0xc3a773,roughness:1}), blue=new THREE.MeshStandardMaterial({color:0x2c5d83,roughness:1}), red=new THREE.MeshStandardMaterial({color:0x9b4233,roughness:1});
  for(const z of [-13,13])box(0,.02,z,31,.045,2.8,water,true);
  for(const x of [-13,13])box(x,.02,0,2.8,.045,26,water,true);
  box(0,.06,19,4,.09,15,dirt,true);
  for(let z=12;z<16;z+=.55)box(0,.18,z,4.2,.2,.43,wood,true);
  for(const x of [-2.1,2.1])box(x,.55,13.6,.15,.85,3.8,wood,true);
  function tree(x,z,s){box(x,.55*s,z,.35*s,1.1*s,.35*s,wood,true);const crown=fixed(new THREE.Mesh(new THREE.IcosahedronGeometry(1.15*s,1),new THREE.MeshStandardMaterial({color:0x386b3f,flatShading:true})),true);crown.position.set(x,1.9*s,z)}
  for(let i=0;i<45;i++){const a=i*2.399, r=22+(i%6)*2.5, x=Math.sin(a)*r,z=Math.cos(a)*r;if(z>14&&Math.abs(x)<8)continue;tree(x,z,.65+(i%4)*.13)}
  function tent(x,z,color){box(x,.12,z,3,.24,2.5,dirt,true);const roof=fixed(new THREE.Mesh(new THREE.ConeGeometry(2.2,2.1,4),color),true);roof.position.set(x,1.2,z);roof.rotation.y=Math.PI/4;for(const dx of [-1.25,1.25])for(const dz of [-1,1])box(x+dx,.45,z+dz,.08,.9,.08,wood,true)}
  for(const [x,z,c] of [[-8,22,canvas],[-13,26,red],[8,23,blue],[12,27,canvas]])tent(x,z,c);
  for(const x of [-11,-9,9,11])for(const z of [18,19,20])box(x,.38,z,.14,.76,.14,wood,true);
  for(const [x,z] of [[-6,20],[-5,21],[6,20],[7,22]]){const barrel=fixed(new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.65,10),wood),true);barrel.position.set(x,.34,z)}
  for(let i=0;i<35;i++){const a=i*2.37,r=18+i%5*3,x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x)<5&&z>13)continue;const rock=fixed(new THREE.Mesh(new THREE.DodecahedronGeometry(.25+i%3*.13,0),mats[i%5]),true);rock.position.set(x,.18,z)}
  const skin=new THREE.MeshStandardMaterial({color:0xe0b88b,roughness:1}), iron=new THREE.MeshStandardMaterial({color:0x666d69,metalness:.35,roughness:.7});
  function person(x,y,z,uniform,guard=false){
    const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);
    const part=(geo,mat,px,py,pz,parent=group)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=true;parent.add(m);return m};
    part(new THREE.BoxGeometry(.43,.58,.26),uniform,0,.85,0);
    part(new THREE.SphereGeometry(.18,8,6),skin,0,1.3,0);
    part(new THREE.CylinderGeometry(.22,.19,.13,8),iron,0,1.49,0);
    const limbs=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.31,1.06,0);group.add(arm);part(new THREE.BoxGeometry(.13,.48,.14),uniform,0,-.24,0,arm);
      const leg=new THREE.Group();leg.position.set(side*.13,.57,0);group.add(leg);part(new THREE.BoxGeometry(.15,.5,.17),dark,0,-.26,0,leg);limbs.push(arm,leg);
    }
    if(guard){part(new THREE.BoxGeometry(.07,1.7,.07),wood,.48,1.05,0);part(new THREE.ConeGeometry(.11,.25,4),iron,.48,2,0)}
    people.push({group,limbs,x,z,phase:people.length*1.7,guard});
  }
  function brick(x,y,z,w,h,d){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w-.035,h-.025,d-.035),mats[blocks.length%5]); mesh.castShadow=mesh.receiveShadow=true; scene.add(mesh);const mass=Math.max(2,w*h*d*3);const body=new CANNON.Body({mass:0,material:stone,shape:new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)),position:new CANNON.Vec3(x,y,z),linearDamping:.18,angularDamping:.34,allowSleep:true});body.sleepSpeedLimit=.12;body.sleepTimeLimit=1;world.addBody(body);blocks.push({mesh,body,mass,x,y,z,fallen:false});return body}
  function wall(axis,side,len,rows){const cols=Math.round(len/1.45), span=cols*1.45;for(let row=0;row<=rows;row++)for(let col=0;col<cols;col++){if(row===rows&&col%2)continue;if(axis==='z'&&side>0&&Math.abs(col-cols/2)<1&&row<4)continue;const p=(col+.5)*1.45-span/2+(row%2?.25:0);if(axis==='z')brick(p,(row+.5)*.78,side,1.45,.78,1.25);else brick(side,(row+.5)*.78,p,1.25,.78,1.45);if(row===3&&col%3===0){const slit=new THREE.Mesh(new THREE.BoxGeometry(axis==='z'?.16:.035,.42,axis==='z'?.035:.16),dark);if(axis==='z')slit.position.set(0,0,side>0?.64:-.64);else slit.position.set(side>0?.64:-.64,0,0);blocks[blocks.length-1].mesh.add(slit)}}}
  function tower(cx,cz,rows){for(let row=0;row<rows;row++)for(let i=0;i<8;i++){const a=i*Math.PI/4+(row%2)*Math.PI/8;const x=cx+Math.cos(a)*1.8,z=cz+Math.sin(a)*1.8;brick(x,(row+.5)*.78,z,1.25,.78,1.15)}const roof=fixed(new THREE.Mesh(new THREE.ConeGeometry(2.65,3.2,8),roofMat));roof.position.set(cx,rows*.78+1.5,cz);box(cx,rows*.78+3.3,cz,.08,1,.08,iron);const flag=box(cx+.45,rows*.78+3.48,cz,.9,.42,.05,cx<0?red:blue);flag.rotation.z=-.1}
  function castle(){
    const rows=5+level;
    wall('z',8.5,14,rows);wall('z',-8.5,14,rows);wall('x',-8.5,14,rows);wall('x',8.5,14,rows);
    for(const x of [-8.5,8.5])for(const z of [-8.5,8.5])tower(x,z,rows+2);
    for(let i=-1;i<=1;i++)box(i*.72,1.7,8.58,.1,3.4,.15,iron);
    for(let i=0;i<4;i++)box(0,.5+i*.75,8.61,2.5,.09,.15,iron);
    box(0,.18,0,5,.36,5,dirt);
    for(let row=0;row<5;row++)for(let col=0;col<4;col++)for(const side of [-1,1]){
      brick(-2.1+col*1.4,(row+.5)*.75,side*2.2,1.4,.75,.75);
      brick(side*2.2,(row+.5)*.75,-2.1+col*1.4,.75,.75,1.4);
    }
    const keep=fixed(new THREE.Mesh(new THREE.ConeGeometry(3.75,3,4),roofMat));keep.position.set(0,5.2,0);keep.rotation.y=Math.PI/4;
    box(0,5.9,0,.09,2,.09,iron);box(.55,6.45,0,1.1,.55,.05,red);
    for(const x of [-5,-2,2,5])person(x,rows*.78-.05,7.45,blue,true);
    for(const x of [-6,6])person(x,0,4,blue,true);
    for(const [x,z] of [[-10,20],[-12,23],[-6,26],[6,21],[10,24],[13,25],[2,20],[-2,21]])person(x,0,z,x<0?red:blue);
    initial=blocks.length;
  }
  const catapult = new THREE.Group(); scene.add(catapult); catapult.position.set(0,0,25);const make=(geo,mat,x,y,z,parent=catapult)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
  make(new THREE.BoxGeometry(3, .35, 4),wood,0,1,0);for(const x of [-1.65,1.65])for(const z of [-1.4,1.4]){const wheel=make(new THREE.CylinderGeometry(.8,.8,.3,12),wood,x,.85,z);wheel.rotation.z=Math.PI/2}for(const x of [-1.1,1.1]){const beam=make(new THREE.BoxGeometry(.3,2.8,.3),wood,x,2,0);beam.rotation.z=x<0?-.3:.3}const arm=new THREE.Group();arm.position.set(0,2.5,0);catapult.add(arm);make(new THREE.BoxGeometry(.28,.28,5),wood,0,.2,-1,arm);make(new THREE.CylinderGeometry(.78,.6,.35,10),dark,0,.25,-3.25,arm);
  const aimLine = new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xffefb4,dashSize:.45,gapSize:.25,transparent:true,opacity:.8}));scene.add(aimLine);
  function launch(){const yaw=+$('yaw').value*Math.PI/180, angle=+$('angle').value*Math.PI/180, power=+$('power').value;return new THREE.Vector3(Math.sin(yaw)*Math.cos(angle),Math.sin(angle),-Math.cos(yaw)*Math.cos(angle)).multiplyScalar(power)}
  function updateAim(){for(const id of ['yaw','angle','power'])$(id+'Value').textContent=$(id).value+(id==='power'?'':'°');const v=launch(),pts=[];for(let t=0;t<2.8;t+=.07){const p=new THREE.Vector3(0,2,25).addScaledVector(v,t);p.y-=10*t*t;if(p.y<0)break;pts.push(p)}aimLine.geometry.dispose();aimLine.geometry=new THREE.BufferGeometry().setFromPoints(pts);aimLine.computeLineDistances()}
  function message(s,ms=1800){$('message').textContent=s;announceUntil=performance.now()+ms}
  function blast(p){for(const b of blocks){const dx=b.body.position.x-p.x,dy=b.body.position.y-p.y,dz=b.body.position.z-p.z,dist=Math.hypot(dx,dy,dz);if(dist>4.5)continue;const force=(4.5-dist)*b.mass*8;b.body.type=CANNON.Body.DYNAMIC;b.body.mass=b.mass;b.body.updateMassProperties();b.body.wakeUp();b.body.applyImpulse(new CANNON.Vec3(dx/(dist||1)*force,Math.max(.2,dy/(dist||1))*force,dz/(dist||1)*force),b.body.position)}}
  function fire(){if(ended||active||fired>=8)return;fired++;active=true;$('fire').disabled=true;const mesh=new THREE.Mesh(new THREE.SphereGeometry(.6,16,12),new THREE.MeshStandardMaterial({color:0x262b29,roughness:1}));mesh.castShadow=true;scene.add(mesh);const body=new CANNON.Body({mass:65,material:stone,shape:new CANNON.Sphere(.6),position:new CANNON.Vec3(0,2,25),linearDamping:.005});const v=launch();body.velocity.set(v.x,v.y,v.z);world.addBody(body);let hit=false;body.addEventListener('collide',e=>{if(hit||!blocks.some(b=>b.body===e.body))return;hit=true;blast(body.position);message('성벽 명중!');});shots.push({mesh,body,born:performance.now()});arm.rotation.x=-.7;setTimeout(()=>arm.rotation.x=0,330);updateHud()}
  function updateHud(){const fallen=blocks.filter(b=>b.fallen).length;const damage=Math.round(fallen/initial*100);$('stage').textContent=`성채 ${level} / 3`;$('shots').textContent=`포탄 ${fired} / 8`;$('health').textContent=`성벽 붕괴 ${damage}% · 목표 12%`;if(damage>=12&&!ended){ended=true;message(level===3?'그레이무어 함락! 승리':'성벽 돌파! 다음 성채로 진격',4000);$('fire').textContent=level===3?'처음부터':'다음 성채';$('fire').disabled=false}else if(fired>=8&&!active&&!ended){ended=true;message('포탄 소진 · 다시 도전',4000);$('fire').textContent='재도전';$('fire').disabled=false}}
  function clearLevel(){for(const b of blocks){world.removeBody(b.body);scene.remove(b.mesh);b.mesh.traverse(m=>m.geometry?.dispose())}blocks.length=0;for(const s of shots){world.removeBody(s.body);scene.remove(s.mesh);s.mesh.geometry.dispose()}shots.length=0;for(const m of decor){scene.remove(m);m.geometry.dispose()}decor.length=0;for(const p of people){scene.remove(p.group);p.group.traverse(m=>m.geometry?.dispose())}people.length=0}
  function start(next=false){if(next)level=level===3?1:level+1;else level=1;clearLevel();castle();fired=0;active=false;ended=false;$('fire').textContent='● 발사';$('fire').disabled=false;message(level===1?'투석기로 성벽을 무너뜨리세요':`성채 ${level} 공격!`,2200);updateHud()}
  $('fire').onclick=()=>ended?start($('fire').textContent!=='재도전'):fire();$('reset').onclick=()=>start(false);for(const id of ['yaw','angle','power'])$(id).addEventListener('input',updateAim);window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();$('fire').click()}});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  start();updateAim();let last=performance.now(),hudAt=0;
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;world.step(1/60,dt,3);for(const b of blocks){b.mesh.position.copy(b.body.position);b.mesh.quaternion.copy(b.body.quaternion);if(!b.fallen&&(Math.hypot(b.body.position.x-b.x,b.body.position.y-b.y,b.body.position.z-b.z)>1.5||b.body.position.y<-.3))b.fallen=true}for(const p of people){const step=Math.sin(now*.003+p.phase);p.group.position.x=p.x+Math.sin(now*.0006+p.phase)*(p.guard?.1:.45);p.group.position.z=p.z+(fired&&!p.guard?Math.min(fired*.35,2):0);p.group.rotation.y=Math.sin(now*.0005+p.phase)*.3;p.limbs[0].rotation.x=step*.35;p.limbs[1].rotation.x=-step*.4;p.limbs[2].rotation.x=-step*.35;p.limbs[3].rotation.x=step*.4}for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.mesh.position.copy(s.body.position);if(now-s.born>5200||s.body.position.y<-.6){world.removeBody(s.body);scene.remove(s.mesh);s.mesh.geometry.dispose();shots.splice(i,1);active=false;$('fire').disabled=false}}if(now>hudAt){updateHud();hudAt=now+250}if(now>announceUntil&&$('message').textContent)$('message').textContent='';controls.update();renderer.render(scene,camera)}requestAnimationFrame(frame);
})();
