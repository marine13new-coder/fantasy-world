(() => {
  'use strict';
  const T = window.THREE, C = window.CANNON, settings = window.SiegeSettings;
  const $ = id => document.getElementById(id);
  const scene = new T.Scene(); scene.background = new T.Color(0x9cc8df); scene.fog = new T.Fog(0x9cc8df, 60, 130);
  const camera = new T.PerspectiveCamera(55, innerWidth/innerHeight, .1, 180);
  const renderer = new T.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; document.body.prepend(renderer.domElement);
  scene.add(new T.HemisphereLight(0xffffff,0x74865b,1.15));
  const sun=new T.DirectionalLight(0xffedc4,1.2);sun.position.set(-22,36,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=sun.shadow.camera.bottom=-55;sun.shadow.camera.right=sun.shadow.camera.top=55;scene.add(sun);
  const orbit=new T.OrbitControls(camera,renderer.domElement);orbit.enablePan=false;orbit.minDistance=19;orbit.maxDistance=100;orbit.maxPolarAngle=Math.PI/2.05;
  const world=new C.World();world.gravity.set(0,-20,0);world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=8;world.allowSleep=true;
  const stone=new C.Material('stone'),soil=new C.Material('soil');world.addContactMaterial(new C.ContactMaterial(stone,stone,{friction:.8,restitution:.04}));world.addContactMaterial(new C.ContactMaterial(stone,soil,{friction:.9,restitution:.02}));
  const ground=new C.Body({mass:0,material:soil,shape:new C.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(ground);
  const groundMesh=new T.Mesh(new T.BoxGeometry(120,2,120),new T.MeshStandardMaterial({color:0x78a45f,roughness:1}));groundMesh.position.y=-1.08;groundMesh.receiveShadow=true;scene.add(groundMesh);
  const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=128;const st=stoneCanvas.getContext('2d');st.fillStyle='#d1cbb9';st.fillRect(0,0,128,128);for(let i=0;i<420;i++){const x=(i*73)%128,y=(i*37+i*i*11)%128,a=(i%4+1)*.02;st.fillStyle=`rgba(70,63,52,${a})`;st.fillRect(x,y,1+i%3,1+i%2)}for(let i=0;i<12;i++){st.strokeStyle='rgba(70,64,55,.13)';st.beginPath();const x=(i*39)%128,y=(i*67)%128;st.moveTo(x,y);st.lineTo(x+5,y+2);st.lineTo(x+7,y+5);st.stroke()}const stoneTexture=new T.CanvasTexture(stoneCanvas);
  const stoneColors=[0xc9c4b5,0xb9b6a9,0xd1caba,0xaaa99e,0xc1bbab];const brickMats=stoneColors.map(color=>new T.MeshStandardMaterial({color,map:stoneTexture,roughness:1}));
  const mat=(color,roughness=1)=>new T.MeshStandardMaterial({color,roughness});
  const wood=mat(0x603c22),iron=new T.MeshStandardMaterial({color:0x565e60,metalness:.45,roughness:.6}),roofMat=mat(0x9f4932),dark=mat(0x2d3532),dirt=mat(0x9e906a),water=new T.MeshStandardMaterial({color:0x4b98ab,roughness:.25,metalness:.1,transparent:true,opacity:.84}),red=mat(0xa64d39),blue=mat(0x305f85),canvasMat=mat(0xc7ac7b),skin=mat(0xdfb68a),leaf=mat(0x406f43);
  const entities=[],blocks=[],people=[],shots=[],waterZones=[];let config,launcherZ,weaponEntity,shotsFired=0,lastShot=-Infinity,announced=false,noticeUntil=0;
  const weapons={
    catapult:{name:'투석기',speed:22,angle:30,radius:.55,mass:65,blast:4.5,force:8},
    trebuchet:{name:'트레뷰셋',speed:25,angle:44,radius:.72,mass:110,blast:5.7,force:10},
    ballista:{name:'발리스타',speed:38,angle:12,radius:.25,mass:28,blast:2.8,force:9},
    cannon:{name:'대포',speed:34,angle:16,radius:.42,mass:95,blast:4.1,force:13}
  };
  function meshBox(w,h,d,material){return new T.Mesh(new T.BoxGeometry(w,h,d),material)}
  function addRigid(mesh,dim,mass,score=false){
    mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
    const body=new C.Body({mass:0,material:stone,shape:new C.Box(new C.Vec3(dim[0]/2,dim[1]/2,dim[2]/2)),position:new C.Vec3(mesh.position.x,mesh.position.y,mesh.position.z),linearDamping:.16,angularDamping:.35,allowSleep:true});
    body.sleepSpeedLimit=.16;body.sleepTimeLimit=.7;world.addBody(body);
    const entry={mesh,body,mass,score,x:mesh.position.x,y:mesh.position.y,z:mesh.position.z,fallen:false};entities.push(entry);if(score)blocks.push(entry);
    body.addEventListener('collide',e=>{if(body.type!==C.Body.STATIC||!e.body.velocity||e.body.velocity.length()<3.3)return;activate(entry);const v=e.body.velocity;body.applyImpulse(new C.Vec3(v.x*mass*.18,Math.max(v.y,1)*mass*.18,v.z*mass*.18),body.position)});
    return entry;
  }
  function activate(e){if(e.body.type===C.Body.DYNAMIC)return;e.body.type=C.Body.DYNAMIC;e.body.mass=e.mass;e.body.updateMassProperties();e.body.wakeUp()}
  function box(x,y,z,w,h,d,material=wood,mass=6){const m=meshBox(w,h,d,material);m.position.set(x,y,z);return addRigid(m,[w,h,d],mass)}
  function visual(mesh){scene.add(mesh);return mesh}
  function remove(e){world.removeBody(e.body);scene.remove(e.mesh);e.mesh.traverse(n=>n.geometry?.dispose());const i=entities.indexOf(e);if(i>=0)entities.splice(i,1)}
  function clear(){for(const e of [...entities])remove(e);blocks.length=0;people.length=0;for(const s of shots){world.removeBody(s.body);scene.remove(s.mesh);s.mesh.geometry.dispose()}shots.length=0;for(const z of waterZones){scene.remove(z.mesh);z.mesh.geometry.dispose()}waterZones.length=0;weaponEntity=null}
  function stoneBlock(x,y,z,w,h,d,slit=false){const mesh=meshBox(w-.025,h-.018,d-.025,brickMats[blocks.length%5]);mesh.position.set(x,y,z);if(slit){const mark=meshBox(.09,h*.55,.035,dark);mark.position.set(0,0,d/2);mesh.add(mark)}return addRigid(mesh,[w,h,d],Math.max(1.5,w*h*d*4),true)}
  function wall(axis,side,half,rows,b,bh){const limit=half-(.55+half*.19)*.6,count=Math.ceil(limit*2/b),step=limit*2/count;for(let row=0;row<=rows;row++)for(let col=0;col<count;col++){
    if(row===rows&&col%2)continue;const p=-limit+(col+.5)*step+(row%2?.08:0);if(axis==='z'&&side>0&&Math.abs(p)<1.25&&row<Math.ceil(2.6/bh))continue;
    const x=axis==='z'?p:side*half,z=axis==='z'?side*half:p;stoneBlock(x,(row+.5)*bh,z,axis==='z'?step:.68,bh,axis==='z'?.68:step,row===Math.floor(rows*.55)&&col%4===0&&axis==='z'&&side>0);
  }}
  function tower(x,z,rows,b,bh,r){const sides=Math.max(8,Math.ceil(Math.PI*2*r/b));for(let row=0;row<rows;row++)for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides+(row%2)*Math.PI/sides;stoneBlock(x+Math.cos(a)*r,(row+.5)*bh,z+Math.sin(a)*r,b*.9,bh,b*.8)}
    const roof=new T.Mesh(new T.ConeGeometry(r+1,2.6,8),roofMat);roof.position.set(x,rows*bh+1.25,z);addRigid(roof,[(r+1)*1.7,2.6,(r+1)*1.7],45);
    box(x,rows*bh+2.9,z,.09,1,.09,iron,3);box(x+.5,rows*bh+3.15,z,1,.45,.06,x<0?red:blue,2);
  }
  function person(x,y,z,uniform,guard=false){const group=new T.Group();group.position.set(x,y+.75,z);const part=(geo,material,px,py,pz,parent=group)=>{const m=new T.Mesh(geo,material);m.position.set(px,py,pz);m.castShadow=true;parent.add(m);return m};
    part(new T.BoxGeometry(.42,.55,.25),uniform,0,.08,0);part(new T.SphereGeometry(.18,8,6),skin,0,.51,0);part(new T.CylinderGeometry(.22,.18,.12,8),iron,0,.67,0);const limbs=[];
    for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.3,.32,0);group.add(arm);part(new T.BoxGeometry(.13,.48,.14),uniform,0,-.24,0,arm);const leg=new T.Group();leg.position.set(side*.12,-.22,0);group.add(leg);part(new T.BoxGeometry(.14,.5,.17),dark,0,-.25,0,leg);limbs.push(arm,leg)}
    if(guard){part(new T.BoxGeometry(.07,1.55,.07),wood,.46,.15,0);part(new T.ConeGeometry(.1,.25,4),iron,.46,1.04,0);part(new T.BoxGeometry(.36,.46,.08),blue,-.44,-.08,.02)}
    const e=addRigid(group,[.65,1.5,.5],8);e.person=true;e.limbs=limbs;e.phase=people.length*1.7;people.push(e);return e;
  }
  function tree(x,z,s){const group=new T.Group();group.position.set(x,1.35*s,z);const trunk=meshBox(.32*s,1.55*s,.32*s,wood);trunk.position.y=-.55*s;group.add(trunk);for(let j=0;j<3;j++){const crown=new T.Mesh(new T.IcosahedronGeometry((.7+j*.16)*s,1),leaf);crown.position.set((j-1)*.3*s,.15*s+(j%2)*.5*s,(j%2)*.2*s);group.add(crown)}addRigid(group,[2*s,2.7*s,2*s],25*s)}
  function tent(x,z,color){box(x,.12,z,3,.24,2.5,dirt,20);const roof=new T.Mesh(new T.ConeGeometry(2.15,2.1,4),color);roof.position.set(x,1.3,z);roof.rotation.y=Math.PI/4;addRigid(roof,[3,2,2.5],20);for(const dx of [-1.25,1.25])for(const dz of [-1,1])box(x+dx,.55,z+dz,.08,1.1,.08,wood,2)}
  function environment(){const h=config.half,moat=h+3.8;function channel(x,z,w,d){const mesh=new T.Mesh(new T.BoxGeometry(w,.04,d),water);mesh.position.set(x,.025,z);visual(mesh);waterZones.push({mesh,x,z,w,d})}for(const z of [-moat,moat])channel(0,z,moat*2+3,2.7);for(const x of [-moat,moat])channel(x,0,2.7,moat*2);
    launcherZ=h+18;box(0,.055,h+10,4,.11,15,dirt,80);for(let z=moat-1.2;z<moat+1.3;z+=.48)box(0,.19,z,4.3,.22,.42,wood,5);for(const x of [-2.2,2.2])box(x,.58,moat,.14,.85,3.5,wood,8);
    for(let i=0;i<50;i++){const a=i*2.399,r=h+11+i%6*3,x=Math.sin(a)*r,z=Math.cos(a)*r;if(z>h+8&&Math.abs(x)<7)continue;tree(x,z,.6+i%4*.12)}
    for(const [x,z,m] of [[-8,launcherZ-3,red],[-12,launcherZ+3,canvasMat],[8,launcherZ-2,blue],[12,launcherZ+3,canvasMat]])tent(x,z,m);
    for(const x of [-11,-9,9,11])for(const z of [launcherZ-6,launcherZ-5])box(x,.38,z,.14,.76,.14,wood,3);
    for(const [x,z] of [[-6,launcherZ],[6,launcherZ+1],[-7,launcherZ+3]]){const barrel=new T.Mesh(new T.CylinderGeometry(.34,.34,.65,10),wood);barrel.position.set(x,.36,z);addRigid(barrel,[.7,.7,.7],8)}
    for(let i=0;i<28;i++){const a=i*2.37,r=h+9+i%5*2.3,x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x)<5&&z>h+7)continue;const rock=new T.Mesh(new T.DodecahedronGeometry(.24+i%3*.12),brickMats[i%5]);rock.position.set(x,.25,z);addRigid(rock,[.65,.5,.65],5)}
    for(const [x,z] of [[-9,launcherZ-1],[-11,launcherZ+2],[-5,launcherZ+4],[6,launcherZ],[10,launcherZ+1],[12,launcherZ+4],[2,launcherZ+3]])person(x,0,z,x<0?red:blue);
  }
  function castle(){const {half:h,rows,bh=0.48,brick:b}=config,r=.55+h*.19;for(const side of [-1,1]){wall('z',side,h,rows,b,bh);wall('x',side,h,rows,b,bh)}for(const x of [-h,h])for(const z of [-h,h])tower(x,z,rows+4,b,bh,r);
    for(let i=-1;i<=1;i++)box(i*.72,1.4,h+.38,.1,2.8,.15,iron,7);for(let i=0;i<4;i++)box(0,.45+i*.65,h+.43,2.5,.09,.15,iron,4);
    const kh=Math.max(2.2,h*.34),kr=Math.ceil(rows*.63),cols=Math.ceil(kh*2/b),step=kh*2/cols;box(0,.16,0,kh*2,.32,kh*2,dirt,75);
    for(let row=0;row<kr;row++)for(let col=0;col<cols;col++)for(const side of [-1,1]){const p=-kh+(col+.5)*step;stoneBlock(p,(row+.5)*bh,side*kh,step,bh,.65);stoneBlock(side*kh,(row+.5)*bh,p,.65,bh,step)}
    const keep=new T.Mesh(new T.ConeGeometry(kh*1.5,2.8,4),roofMat);keep.position.set(0,kr*bh+1.25,0);keep.rotation.y=Math.PI/4;addRigid(keep,[kh*2.4,2.8,kh*2.4],65);box(0,kr*bh+2.9,0,.1,1,.1,iron,3);box(.6,kr*bh+3.15,0,1.2,.45,.06,red,2);
    for(const x of [-h*.5,0,h*.5])person(x,rows*bh,h-.65,blue,true);for(const x of [-h*.6,h*.6])person(x,0,h*.35,blue,true);
    console.assert(blocks.length>100&&people.length>0,'Castle construction incomplete');
  }
  function weaponModel(){if(weaponEntity)remove(weaponEntity);const id=$('weapon').value,group=new T.Group();group.position.set(0,1,launcherZ);const part=(geo,material,x,y,z)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;group.add(m);return m};
    part(new T.BoxGeometry(3.2,.35,4.3),wood,0,0,0);for(const x of [-1.6,1.6])for(const z of [-1.5,1.5]){const wheel=part(new T.CylinderGeometry(.75,.75,.28,12),wood,x,-.2,z);wheel.rotation.z=Math.PI/2}
    if(id==='catapult'||id==='trebuchet'){for(const x of [-1,1]){const beam=part(new T.BoxGeometry(.3,id==='trebuchet'?4:2.6,.3),wood,x,id==='trebuchet'?1.8:1.1,0);beam.rotation.z=x<0?-.25:.25}const arm=part(new T.BoxGeometry(.3,.3,id==='trebuchet'?7:5),wood,0,2,id==='trebuchet'?-1.1:-.6);arm.rotation.x=.15;part(new T.BoxGeometry(1.2,1.3,1.2),iron,0,.15,2)}
    else if(id==='ballista'){for(const x of [-1.7,1.7]){const bow=part(new T.BoxGeometry(.22,.22,2.5),wood,x,1,-2);bow.rotation.y=x<0?-.65:.65}part(new T.BoxGeometry(.35,.25,4.8),wood,0,1,-1.4);part(new T.ConeGeometry(.22,.7,6),iron,0,1,-3.9).rotation.x=-Math.PI/2}
    else {const barrel=part(new T.CylinderGeometry(.5,.65,4.1,12),iron,0,1.05,-1.1);barrel.rotation.x=Math.PI/2;part(new T.CylinderGeometry(.68,.68,.25,12),dark,0,1.05,-3.2).rotation.x=Math.PI/2}
    weaponEntity=addRigid(group,[3.7,3.6,5.5],180);updateAim();
  }
  function origin(){return new T.Vector3(weaponEntity?.body.position.x||0,2.4,launcherZ-3.5)}
  function velocity(){const yaw=+$('yaw').value*Math.PI/180,angle=+$('angle').value*Math.PI/180,power=+$('power').value;return new T.Vector3(Math.sin(yaw)*Math.cos(angle),Math.sin(angle),-Math.cos(yaw)*Math.cos(angle)).multiplyScalar(power)}
  const aimLine=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xffe4aa,dashSize:.4,gapSize:.3,transparent:true,opacity:.85}));scene.add(aimLine);
  function updateAim(){for(const id of ['yaw','angle','power'])$(id+'Value').textContent=$(id).value+(id==='power'?'':'°');if(!weaponEntity)return;const v=velocity(),o=origin(),pts=[];for(let t=0;t<3;t+=.06){const p=o.clone().addScaledVector(v,t);p.y-=10*t*t;if(p.y<0)break;pts.push(p)}aimLine.geometry.dispose();aimLine.geometry=new T.BufferGeometry().setFromPoints(pts);aimLine.computeLineDistances()}
  function announce(text,time=1800){$('message').textContent=text;noticeUntil=performance.now()+time}
  function blast(p,weapon){for(const e of entities){const dx=e.body.position.x-p.x,dy=e.body.position.y-p.y,dz=e.body.position.z-p.z,flat=Math.hypot(dx,dz),dist=Math.hypot(flat,dy);if(flat>weapon.blast||Math.abs(dy)>weapon.blast*1.8)continue;activate(e);const impulse=(weapon.blast-flat+1)*weapon.force*e.mass*.7;const d=dist||1;e.body.applyImpulse(new C.Vec3(dx/d*impulse,Math.max(.2,dy/d)*impulse,dz/d*impulse),e.body.position)}}
  function fire(){const now=performance.now();if(now-lastShot<700)return;lastShot=now;shotsFired++;const id=$('weapon').value,w=weapons[id],o=origin(),v=velocity();let mesh;
    if(id==='ballista'){mesh=new T.Mesh(new T.CylinderGeometry(.11,.15,2,8),wood);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize())}else mesh=new T.Mesh(new T.SphereGeometry(w.radius,14,10),id==='cannon'?iron:dark);
    mesh.position.copy(o);mesh.castShadow=true;scene.add(mesh);const body=new C.Body({mass:w.mass,material:stone,shape:new C.Sphere(w.radius),position:new C.Vec3(o.x,o.y,o.z),linearDamping:.005});body.velocity.set(v.x,v.y,v.z);world.addBody(body);
    let hit=false;body.addEventListener('collide',e=>{if(hit||e.body===weaponEntity?.body)return;hit=true;blast(body.position,w);announce('충격! 블록과 주변 물체가 무너집니다')});shots.push({body,mesh,born:now});updateHud()}
  function updateHud(){const moved=blocks.filter(b=>b.fallen).length,percent=blocks.length?Math.round(moved/blocks.length*100):0;$('stage').textContent=`${{small:'작은 성',medium:'보통 성',large:'큰 성',huge:'아주 큰 성',custom:'맞춤 성'}[$('preset').value]} · ${blocks.length.toLocaleString()}개 블록`;$('shots').textContent=`${weapons[$('weapon').value].name} · 발사 ${shotsFired}회`;$('health').textContent=`무너진 블록 ${moved.toLocaleString()}개 (${percent}%)`;if(percent>=25&&!announced){announced=true;announce('성채가 크게 무너졌습니다!',2800)}}
  function build(){config=settings.resolve({half:$('half').value,rows:$('rows').value,brick:$('brick').value});$('limit').textContent=config.limited?`블록 ${config.brick.toFixed(2)}로 자동 조절 · 최대 5,000개 물리 블록`:'';clear();environment();castle();weaponModel();shotsFired=0;announced=false;camera.position.set(config.half*2.8+4,config.half*2+4,launcherZ+config.half*1.5+2);orbit.target.set(0,config.rows*.25,0);orbit.update();updateAim();updateHud();announce('성채 준비 완료 · 공성병기를 발사하세요')}
  function displaySettings(){const p=$('preset').value;if(p!=='custom'){const v=settings.presets[p];$('half').value=v.half;$('rows').value=v.rows;$('brick').value=v.brick}$('halfValue').textContent=+$('half').value*2;$('rowsValue').textContent=$('rows').value;$('brickValue').textContent=(+$('brick').value).toFixed(2)}
  $('preset').addEventListener('change',()=>{displaySettings();build()});for(const id of ['half','rows','brick'])$(id).addEventListener('input',()=>{$('preset').value='custom';displaySettings()});$('build').onclick=build;$('reset').onclick=build;
  $('weapon').addEventListener('change',()=>{const w=weapons[$('weapon').value];$('angle').value=w.angle;$('power').value=w.speed;weaponModel();updateHud();announce(`${w.name} 준비 완료`)});for(const id of ['yaw','angle','power'])$(id).addEventListener('input',updateAim);$('fire').onclick=fire;window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,select,button,summary')){e.preventDefault();fire()}});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  displaySettings();build();let last=performance.now(),hudAt=0;
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;world.step(1/60,dt,3);
    for(const e of entities){if(e.body.type===C.Body.DYNAMIC){e.mesh.position.copy(e.body.position);e.mesh.quaternion.copy(e.body.quaternion);if(e.score&&!e.fallen&&Math.hypot(e.body.position.x-e.x,e.body.position.y-e.y,e.body.position.z-e.z)>1.1)e.fallen=true}else if(e.person){const step=Math.sin(now*.004+e.phase);e.limbs[0].rotation.x=step*.32;e.limbs[1].rotation.x=-step*.38;e.limbs[2].rotation.x=-step*.32;e.limbs[3].rotation.x=step*.38}}
    for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.mesh.position.copy(s.body.position);if(now-s.born>6500||s.body.position.y<-.7){world.removeBody(s.body);scene.remove(s.mesh);s.mesh.geometry.dispose();shots.splice(i,1)}}
    for(const e of entities)if(e.body.type===C.Body.DYNAMIC&&e.body.position.y<.9&&waterZones.some(z=>Math.abs(e.body.position.x-z.x)<z.w/2&&Math.abs(e.body.position.z-z.z)<z.d/2)){e.body.velocity.x*=.985;e.body.velocity.z*=.985}
    if(now>hudAt){updateHud();hudAt=now+300}if(now>noticeUntil&&$('message').textContent)$('message').textContent='';orbit.update();renderer.render(scene,camera)
  }requestAnimationFrame(frame);
})();
