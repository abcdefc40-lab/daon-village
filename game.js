(() => {
"use strict";
const C = window.DAON_CONFIG;
const BREEDS={maltese:"말티즈",poodle:"푸들",pom:"포메라니안",bichon:"비숑",shihtzu:"시츄",golden:"골든리트리버",corgi:"웰시코기",schnauzer:"슈나우저"};
const T=32, STEP_MS=190, DOGH=76;
// ---------- 이미지 ----------
const IMG={};const load=(k,f)=>{const i=new Image();i.src="assets/"+f;IMG[k]=i;};
for(const k in BREEDS){load("dog_"+k,`dog_${k}.webp`);for(const v of["front","back","side"])load(`dog_${k}_${v}`,`dog_${k}_${v}.webp`);}
for(const v of["front","back","side"])load("groomer_"+v,`groomer_${v}.webp`);
["village","interior","shop","tree","bench","board","bush"].forEach(k=>load(k,k+".webp"));
const ok=i=>i&&i.complete&&i.naturalWidth;
const VIEW={down:"front",up:"back",left:"side",right:"side"};
// ---------- 맵 (좌표는 배경 그림 기준, 타일 32px) ----------
const SH={x:585,y:40,s:.469};const sp=(x,y)=>({x:SH.x+x*SH.s,y:SH.y+y*SH.s});
const OUT={id:"out",name:"다온 마을",w:1600,h:1200,solids:[],deco:[]};
OUT.solids.push({x:sp(100,0).x,y:0,w:840*SH.s,h:sp(0,690).y},{x:sp(210,0).x,y:0,w:230*SH.s,h:sp(0,930).y},{x:sp(790,0).x,y:0,w:135*SH.s,h:sp(0,900).y},{x:20,y:350,w:400,h:290});
[[300,200],[150,880],[1300,260],[1450,700],[480,1080],[1150,1080]].forEach(([x,y])=>{OUT.deco.push({k:"tree",x,y,h:190});OUT.solids.push({x:x-24,y:y-24,w:48,h:28});});
[[1260,500],[560,700],[1350,1000]].forEach(([x,y])=>{OUT.deco.push({k:"bush",x,y,h:90});OUT.solids.push({x:x-34,y:y-24,w:68,h:28});});
OUT.deco.push({k:"bench",x:1180,y:700,h:95});OUT.solids.push({x:1130,y:660,w:100,h:44});
OUT.deco.push({k:"board",x:1060,y:470,h:120,sign:1});OUT.solids.push({x:1022,y:440,w:76,h:32});
OUT.isDoor=(x,y)=>y===11&&x>=25&&x<=27; OUT.spawn={x:26,y:14,dir:"down"};
const IN={id:"in",name:"다온펫살롱",w:1024,h:768,solids:[]};
IN.npc={tx:20,ty:11,dir:"down"};
IN.solids.push({x:0,y:0,w:1024,h:250},{x:270,y:180,w:315,h:190},{x:740,y:180,w:284,h:200},{x:705,y:440,w:319,h:200},{x:0,y:170,w:90,h:125},{x:630,y:510,w:95,h:125},{x:940,y:610,w:84,h:90},{x:200,y:190,w:70,h:90},{x:0,y:0,w:20,h:768},{x:1004,y:0,w:20,h:768});
IN.isDoor=(x,y)=>y>=23&&x>=11&&x<=17; IN.spawn={x:15,y:21,dir:"up"};
for(const S of[OUT,IN]){S.cols=Math.floor(S.w/T);S.rows=Math.floor(S.h/T);S.grid=[];
  for(let y=0;y<S.rows;y++)for(let x=0;x<S.cols;x++){const cx=x*T+16,cy=y*T+16;S.grid[y*S.cols+x]=S.solids.some(r=>cx>r.x&&cx<r.x+r.w&&cy>r.y&&cy<r.y+r.h)?1:0;}}
IN.grid[IN.npc.ty*IN.cols+IN.npc.tx]=1;
const SCN={out:OUT,in:IN};
const walk=(S,x,y)=>x>=0&&y>=0&&x<S.cols&&y<S.rows&&!S.grid[y*S.cols+x];
// ---------- 상태 ----------
const cv=document.getElementById("game"),g=cv.getContext("2d"),$=id=>document.getElementById(id);
let save=null;try{save=JSON.parse(localStorage.getItem("daonVillage3")||"null");}catch{}
const mkActor=(o)=>Object.assign({tx:0,ty:0,px:0,py:0,fx:0,fy:0,dir:"down",prog:1,moving:false,bubble:null,bubbleT:0},o);
const P=mkActor({nick:"",breed:"maltese",scene:"out"});
const others=new Map();
let keys={},joyDir=null,path=[],uiOpen=false,started=false,near=null,typing=false;
function place(a,S,x,y,dir){a.scene=S.id;a.tx=a.fx=x;a.ty=a.fy=y;a.px=x*T+16;a.py=y*T+28;a.prog=1;if(dir)a.dir=dir;}
// ---------- 시작 화면 ----------
let selBreed=save?.breed||"maltese";
for(const k in BREEDS){const d=document.createElement("div");d.className="breed"+(k===selBreed?" sel":"");d.dataset.k=k;
  const im=document.createElement("img");im.src=`assets/dog_${k}_front.webp`;im.alt=BREEDS[k];
  const t=document.createElement("div");t.textContent=BREEDS[k];d.append(im,t);
  d.onclick=()=>{selBreed=k;document.querySelectorAll(".breed").forEach(e=>e.classList.toggle("sel",e.dataset.k===k));};$("breeds").append(d);}
if(save){$("nick").value=save.nick;$("startBtn").textContent=`${save.nick}(으)로 이어하기!`;}
$("startBtn").onclick=()=>{const n=$("nick").value.replace(/[<>]/g,"").trim().slice(0,10)||BREEDS[selBreed];P.breed=selBreed;P.nick=n;
  const S=SCN[save?.scene]||OUT;const sx=save&&walk(S,save.tx,save.ty)&&!S.isDoor(save.tx,save.ty)?save.tx:S.spawn.x,sy=sx===S.spawn.x?S.spawn.y:save.ty;
  place(P,S,sx,sy,save?.dir||"down");persist();
  ["start"].forEach(i=>$(i).classList.add("hidden"));["hud","chatbar","chatlog","minimap"].concat(matchMedia("(pointer:coarse)").matches||innerWidth<700?["joy"]:[]).forEach(i=>$(i).classList.remove("hidden"));
  started=true;banner(S.name);Net.connect();};
$("resetBtn").onclick=()=>{$("start").classList.remove("hidden");started=false;Net.close();};
function persist(){localStorage.setItem("daonVillage3",JSON.stringify({breed:P.breed,nick:P.nick,scene:P.scene,tx:P.tx,ty:P.ty,dir:P.dir}));}
function banner(t){const b=$("banner");b.textContent="~ "+t+" ~";b.classList.add("show");clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove("show"),1800);}
// ---------- 입력 ----------
const KEYDIR={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};
addEventListener("keydown",e=>{if(typing){if(e.key==="Escape")$("chatIn").blur();return;}
  const k=e.key.toLowerCase();
  if(k==="enter"&&started&&!uiOpen){e.preventDefault();$("chatIn").focus();return;}
  keys[k]=1;if(KEYDIR[k]){path=[];e.preventDefault();}
  if((k===" "||k==="e")&&started&&!uiOpen&&near){e.preventDefault();interact();}if(k==="escape")closeAll();});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=0);
$("chatIn").onfocus=()=>{typing=true;keys={};};$("chatIn").onblur=()=>typing=false;
$("chatbar").onsubmit=e=>{e.preventDefault();const v=$("chatIn").value.trim().slice(0,80);if(v){Net.chat(v);}$("chatIn").value="";$("chatIn").blur();};
const cam={x:0,y:0,z:1};
cv.addEventListener("pointerdown",e=>{if(!started||uiOpen)return;$("chatIn").blur();
  const wx=e.clientX/cam.z+cam.x,wy=e.clientY/cam.z+cam.y,S=SCN[P.scene];
  if(near&&Math.hypot(wx-near.x,wy-near.y)<70){interact();return;}
  let tx=Math.floor(wx/T),ty=Math.floor(wy/T);path=findPath(S,P.tx,P.ty,tx,ty);tapMark={x:tx,y:ty,t:performance.now()};});
let tapMark=null;
function findPath(S,sx,sy,gx,gy){ // BFS (막힌 칸을 누르면 가장 가까운 칸으로)
  const key=(x,y)=>y*S.cols+x,prev=new Map([[key(sx,sy),-1]]),q=[[sx,sy]];let best=[sx,sy],bd=1e9;
  while(q.length){const [x,y]=q.shift();const d=Math.abs(x-gx)+Math.abs(y-gy);if(d<bd){bd=d;best=[x,y];}if(d===0)break;
    for(const [dx,dy] of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!prev.has(k)&&walk(S,nx,ny)){prev.set(k,key(x,y));q.push([nx,ny]);}}
    if(prev.size>3000)break;}
  const out=[];let k=key(best[0],best[1]);while(k!==key(sx,sy)&&k!==-1){out.unshift([k%S.cols,Math.floor(k/S.cols)]);k=prev.get(k);}return out;}
const jb=$("joy"),kn=$("knob");let jid=null;
jb.addEventListener("pointerdown",e=>{jid=e.pointerId;jb.setPointerCapture(jid);jm(e);});
jb.addEventListener("pointermove",e=>{if(e.pointerId===jid)jm(e);});
jb.addEventListener("pointerup",()=>{jid=null;joyDir=null;kn.style.transform="";});
function jm(e){const r=jb.getBoundingClientRect(),R=r.width/2;let dx=e.clientX-r.left-R,dy=e.clientY-r.top-R;const m=Math.hypot(dx,dy);if(m>R*.75){dx*=R*.75/m;dy*=R*.75/m;}
  kn.style.transform=`translate(${dx}px,${dy}px)`;path=[];joyDir=m<12?null:Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");}
$("actBtn").onclick=()=>interact();
// ---------- 대화 / 게시판 ----------
function closeAll(){$("dialog").classList.add("hidden");$("board").classList.add("hidden");uiOpen=false;}
function say(text,choices){uiOpen=true;$("dialog").classList.remove("hidden");$("dlgName").textContent=C.owner.name;$("dlgText").textContent=text;$("dlgText").style.whiteSpace="pre-line";
  const ch=$("dlgChoices");ch.innerHTML="";(choices||[]).forEach(([t,f])=>{const b=document.createElement("button");b.textContent=t;b.onclick=f;ch.append(b);});}
function ownerMenu(text){say(text,[["👋 인사",()=>ownerMenu(`${P.nick}! 오늘도 털이 반짝반짝하네요 ✨ ${BREEDS[P.breed]} 친구는 언제나 환영이에요.`)],
  ["✂️ 미용 메뉴 안내",()=>ownerMenu(C.menus.map(m=>`• ${m.name} — ${m.price}`).join("\n"))],
  ["📅 예약 방법",()=>ownerMenu(C.reservationHowTo)],["⏰ 영업시간",()=>ownerMenu(C.shop.hours)],["📌 게시판 보기",openBoard],["닫기",closeAll]]);}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function openBoard(){closeAll();uiOpen=true;$("board").classList.remove("hidden");
  $("notices").innerHTML=C.board.notices.map(n=>`<li><b>${esc(n.date)}</b> ${esc(n.text)}</li>`).join("");
  $("slots").innerHTML=C.board.slots.map(s=>`<div class="slot">${esc(s.day)} ${s.times.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`).join("");
  $("contact").href=C.board.contactLink;}
$("closeBoard").onclick=closeAll;
function interact(){if(!near)return;if(near.k==="npc"){IN.npc.dir=faceTo(IN.npc,P);ownerMenu(`${C.owner.greeting}\n무엇을 도와드릴까요?`);}else openBoard();}
const faceTo=(a,b)=>Math.abs(b.tx-a.tx)>Math.abs(b.ty-a.ty)?(b.tx>a.tx?"right":"left"):(b.ty>a.ty?"down":"up");
// ---------- 이동 (타일 단위) ----------
const DV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function wantedDir(){if(joyDir)return joyDir;for(const k in KEYDIR)if(keys[k])return KEYDIR[k];return null;}
function update(dt){
  // 다른 사람들 보간
  for(const o of others.values())stepActor(o,dt);
  if(!started)return;
  if(P.prog<1){stepActor(P,dt);if(P.prog<1)return;arrive();}
  if(uiOpen||typing){P.moving=false;return;}
  const S=SCN[P.scene];let d=wantedDir(),nx,ny;
  if(d){[nx,ny]=[P.tx+DV[d][0],P.ty+DV[d][1]];}
  else if(path.length){[nx,ny]=path[0];d=nx>P.tx?"right":nx<P.tx?"left":ny>P.ty?"down":"up";}
  if(!d){P.moving=false;return;}
  const turned=P.dir!==d;P.dir=d;
  if(walk(S,nx,ny)){if(path.length)path.shift();P.fx=P.tx;P.fy=P.ty;P.tx=nx;P.ty=ny;P.prog=0;P.moving=true;Net.move();}
  else{path=[];P.moving=false;if(turned)Net.move();}
}
function stepActor(a,dt){if(a.prog>=1){a.moving=false;return;}a.prog=Math.min(1,a.prog+dt/STEP_MS);
  a.px=(a.fx+(a.tx-a.fx)*a.prog)*T+16;a.py=(a.fy+(a.ty-a.fy)*a.prog)*T+28;a.moving=true;a.walkT=(a.walkT||0)+dt;}
function arrive(){const S=SCN[P.scene];
  if(S.isDoor(P.tx,P.ty)){const N=S===OUT?IN:OUT;place(P,N,N.spawn.x,N.spawn.y,N.spawn.dir);path=[];banner(N.name);Net.move();}
  persist();}
function updateNear(){near=null;if(!started)return;
  if(P.scene==="in"){if(Math.abs(P.tx-IN.npc.tx)+Math.abs(P.ty-IN.npc.ty)<=3)near={k:"npc",x:IN.npc.tx*T+16,y:IN.npc.ty*T-185};
    else if(P.tx<=9&&P.ty<=10)near={k:"board",x:150,y:120};}
  else if(Math.abs(P.tx-33)+Math.abs(P.ty-15)<=3)near={k:"sign",x:1060,y:330};
  $("actBtn").classList.toggle("hidden",!near||uiOpen);$("actBtn").textContent=near?.k==="npc"?"말걸기":"보기";}
// ---------- 네트워크 (서버 없으면 혼자 모드) ----------
const Net={ws:null,id:null,online:false,
  connect(){if(location.protocol==="file:"){this.offline();return;}
    try{this.ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host+"/ws");}catch{this.offline();return;}
    const w=this.ws;const to=setTimeout(()=>{if(w.readyState!==1){w.close();this.offline();}},4000);
    w.onopen=()=>{clearTimeout(to);this.online=true;w.send(JSON.stringify({t:"hello",nick:P.nick,breed:P.breed,scene:P.scene,tx:P.tx,ty:P.ty,dir:P.dir}));sys("마을에 접속했어요. Enter로 채팅할 수 있어요.");};
    w.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}this.handle(m);};
    w.onclose=()=>{clearTimeout(to);if(this.online)sys("서버 연결이 끊겼어요. 혼자 모드로 계속해요.");this.offline();};},
  offline(){this.online=false;this.ws=null;others.clear();setOnline();},
  close(){if(this.ws){this.online=false;this.ws.onclose=null;this.ws.close();}others.clear();setOnline();},
  send(o){if(this.online&&this.ws.readyState===1)this.ws.send(JSON.stringify(o));},
  move(){this.send({t:"move",scene:P.scene,tx:P.tx,ty:P.ty,dir:P.dir});},
  chat(text){bubble(P,text);log(P.nick,text);if(this.online)this.send({t:"chat",text});},
  handle(m){
    if(m.t==="welcome"){this.id=m.id;others.clear();m.players.forEach(p=>upsert(p,true));}
    else if(m.t==="join"){upsert(m.p,true);sys(`${m.p.nick} 님이 들어왔어요.`);}
    else if(m.t==="move")upsert(m.p,false);
    else if(m.t==="leave"){const o=others.get(m.id);if(o)sys(`${o.nick} 님이 나갔어요.`);others.delete(m.id);}
    else if(m.t==="chat"){if(m.id===this.id)return;const o=others.get(m.id);if(o)bubble(o,m.text);if(m.scene===P.scene)log(m.nick,m.text);}
    else if(m.t==="notice")sys(m.text);
    setOnline();}};
function upsert(p,snap){let o=others.get(p.id);
  if(!o||snap||o.scene!==p.scene||Math.abs(o.tx-p.tx)+Math.abs(o.ty-p.ty)>1){o=o||mkActor({});Object.assign(o,{id:p.id,nick:p.nick,breed:p.breed,dir:p.dir});place(o,SCN[p.scene]||OUT,p.tx,p.ty,p.dir);others.set(p.id,o);return;}
  o.dir=p.dir;if(o.tx!==p.tx||o.ty!==p.ty){o.fx=o.tx;o.fy=o.ty;o.tx=p.tx;o.ty=p.ty;o.prog=0;}}
function setOnline(){$("online").textContent=Net.online?`🟢 접속 ${others.size+1}명`:"⚪ 혼자 모드";}
function bubble(a,text){a.bubble=text;a.bubbleT=performance.now();}
function logLine(html){const l=$("chatlog");const d=document.createElement("div");d.append(...html);l.append(d);while(l.children.length>6)l.firstChild.remove();}
function log(nick,text){const b=document.createElement("b");b.textContent=nick+": ";logLine([b,document.createTextNode(text)]);}
function sys(text){const s=document.createElement("span");s.className="sys";s.textContent="📢 "+text;logLine([s]);}
// ---------- 그리기 ----------
function shadow(x,y,w){g.fillStyle="rgba(60,40,20,.2)";g.beginPath();g.ellipse(x,y,w,w*.32,0,0,7);g.fill();}
function drawChar(prefix,a,h,t){const v=VIEW[a.dir],im=IMG[`${prefix}_${v}`];if(!ok(im))return;
  const w=h*im.naturalWidth/im.naturalHeight,ph=(a.walkT||0)/95;
  const hop=a.moving?Math.abs(Math.sin(ph))*h*.09:0,sq=a.moving?1+Math.cos(ph*2)*.05:1+Math.sin(t/600)*.015;
  shadow(a.px,a.py,Math.min(w,h)*.42*(1-hop/h));
  g.save();g.translate(a.px,a.py-hop);g.scale((a.dir==="left"?-1:1)/sq,sq);
  if(a.moving)g.rotate((v==="side"?.05:.07)*Math.sin(ph)); // 걸음마다 좌우로 흔들기(2프레임 느낌)
  g.drawImage(im,-w/2,-h,w,h);g.restore();}
function label(x,y,txt,bg="#fffaf0",fg="#a0526a",size=15){
  g.font=`${size}px Jua, sans-serif`;const w=g.measureText(txt).width+18;
  g.fillStyle="rgba(90,60,30,.18)";g.beginPath();g.roundRect(x-w/2,y-10,w,24,12);g.fill();
  g.fillStyle=bg;g.strokeStyle="#e9b9a0";g.lineWidth=2;g.beginPath();g.roundRect(x-w/2,y-12,w,24,12);g.fill();g.stroke();
  g.fillStyle=fg;g.textAlign="center";g.textBaseline="middle";g.fillText(txt,x,y+1);}
function nameTag(x,y,txt,mine){g.font="15px Jua, sans-serif";g.textAlign="center";g.textBaseline="middle";g.lineWidth=4;g.strokeStyle="rgba(50,30,15,.85)";g.strokeText(txt,x,y);g.fillStyle=mine?"#ffe066":"#fff";g.fillText(txt,x,y);}
function drawBubble(a,top,t){if(!a.bubble)return;const age=t-a.bubbleT;if(age>5000){a.bubble=null;return;}
  g.globalAlpha=age>4500?(5000-age)/500:1;g.font="15px Jua, sans-serif";
  const words=[...a.bubble],lines=[];let cur="";for(const ch of words){if(g.measureText(cur+ch).width>170){lines.push(cur);cur="";}cur+=ch;}lines.push(cur);
  const w=Math.max(...lines.map(l=>g.measureText(l).width))+20,h=lines.length*19+12,x=a.px-w/2,y=top-h-10;
  g.fillStyle="#fff";g.strokeStyle="#b98557";g.lineWidth=2.5;g.beginPath();g.roundRect(x,y,w,h,10);g.fill();g.stroke();
  g.beginPath();g.moveTo(a.px-6,y+h-1);g.lineTo(a.px,y+h+8);g.lineTo(a.px+6,y+h-1);g.fill();g.stroke();g.fillRect(a.px-5,y+h-3,10,3);
  g.fillStyle="#5a4030";g.textAlign="center";g.textBaseline="top";lines.forEach((l,i)=>g.fillText(l,a.px,y+8+i*19));g.globalAlpha=1;}
function drawActors(list,t){list.sort((a,b)=>a.y-b.y).forEach(i=>i.f());}
function render(t){const S=SCN[P.scene];
  if(S===OUT){if(ok(IMG.village))g.drawImage(IMG.village,0,0,OUT.w,OUT.h);}else if(ok(IMG.interior))g.drawImage(IMG.interior,0,0,1024,768);
  if(tapMark&&t-tapMark.t<700){g.strokeStyle=`rgba(255,143,171,${1-(t-tapMark.t)/700})`;g.lineWidth=3;g.beginPath();g.roundRect(tapMark.x*T+2,tapMark.y*T+2,T-4,T-4,6);g.stroke();}
  const L=[],tops=[];
  const addDog=(a,mine)=>{L.push({y:a.py,f:()=>{drawChar("dog_"+a.breed,a,DOGH,t);nameTag(a.px,a.py+12,a.nick,mine);}});tops.push([a,a.py-DOGH-6]);};
  for(const o of others.values())if(o.scene===P.scene)addDog(o,false);addDog(P,true);
  if(S===OUT){OUT.deco.forEach(d=>L.push({y:d.y,f:()=>{const im=IMG[d.k];if(!ok(im))return;const w=d.h*im.naturalWidth/im.naturalHeight;shadow(d.x,d.y-4,w*.4);g.drawImage(im,d.x-w/2,d.y-d.h,w,d.h);if(d.sign)label(d.x,d.y+16,"📌 게시판");}}));
    L.push({y:sp(0,900).y,f:()=>{if(ok(IMG.shop))g.drawImage(IMG.shop,SH.x,SH.y,1024*SH.s,1024*SH.s);label(sp(565,0).x,SH.y+60,"🐾 "+C.shop.name,"#fffaf0","#d16b86",17);label(848,sp(0,960).y+Math.sin(t/300)*3,"▼ 들어가기");}});}
  else{const n=IN.npc,na={px:n.tx*T+16,py:n.ty*T+28,dir:n.dir,moving:false};
    if(!uiOpen&&near?.k!=="npc"&&Math.random()<.002)n.dir=["down","left","right"][Math.floor(Math.random()*3)];
    L.push({y:na.py,f:()=>{drawChar("groomer",na,150,t);label(na.px,na.py-165,"✂️ "+C.owner.name,"#ff8fab","#fff");}});
    label(150,190,"📌 게시판");label(478,690+Math.sin(t/300)*3,"▼ 밖으로");}
  drawActors(L,t);
  if(S===IN){const gr=g.createRadialGradient(512,300,200,512,384,700);gr.addColorStop(0,"rgba(255,230,200,0)");gr.addColorStop(1,"rgba(120,70,40,.18)");g.fillStyle=gr;g.fillRect(0,0,1024,768);}
  tops.forEach(([a,y])=>drawBubble(a,y,t));
  if(near&&!uiOpen)label(near.x,near.y-Math.abs(Math.sin(t/250))*4,near.k==="npc"?"💬 말걸기 (Space)":"👀 보기 (Space)","#ffd166","#6b4a2f");}
function drawMinimap(){const m=$("minimap"),c=m.getContext("2d"),S=SCN[P.scene],bg=S===OUT?IMG.village:IMG.interior;c.clearRect(0,0,150,112);
  if(ok(bg))c.drawImage(bg,0,0,150,112);const sx=150/S.w,sy=112/S.h;
  for(const o of others.values())if(o.scene===P.scene){c.fillStyle="#4dabf7";c.beginPath();c.arc(o.px*sx,o.py*sy,3,0,7);c.fill();}
  if(S===IN){c.fillStyle="#ff8fab";c.beginPath();c.arc((IN.npc.tx*T+16)*sx,(IN.npc.ty*T+20)*sy,3,0,7);c.fill();}
  c.fillStyle="#ffe066";c.strokeStyle="#5a4030";c.lineWidth=1.5;c.beginPath();c.arc(P.px*sx,P.py*sy,4,0,7);c.fill();c.stroke();}
function resize(){const d=devicePixelRatio||1;cv.width=innerWidth*d;cv.height=innerHeight*d;}
addEventListener("resize",resize);resize();
let lt=performance.now(),mm=0;
function loop(t){const dt=Math.min(60,t-lt);lt=t;update(dt);updateNear();
  const d=devicePixelRatio||1,S=SCN[P.scene];g.setTransform(d,0,0,d,0,0);
  g.fillStyle=S===IN?"#e8c9a8":"#9fd38a";g.fillRect(0,0,innerWidth,innerHeight);
  cam.z=S===IN?Math.max(.55,Math.min(1.1,innerWidth/1024,(innerHeight-60)/768)):(innerWidth<600?.85:1);
  const z=cam.z,W=innerWidth/z,H=(innerHeight-56)/z;
  cam.x=S.w<W?(S.w-W)/2:Math.max(0,Math.min(S.w-W,P.px-W/2));cam.y=S.h<H?(S.h-H)/2:Math.max(0,Math.min(S.h-H,P.py-H/2));
  g.scale(z,z);g.translate(-cam.x,-cam.y);render(t);
  $("sceneName").textContent=(S===IN?"✂️ ":"🌳 ")+S.name;if(started&&t-mm>100){mm=t;drawMinimap();}
  requestAnimationFrame(loop);}
requestAnimationFrame(loop);
window.__daon={P,others,Net,tp(s,x,y){place(P,SCN[s],x,y);Net.move();},walkTo(x,y){path=findPath(SCN[P.scene],P.tx,P.ty,x,y);},interact,openBoard,walk:(s,x,y)=>walk(SCN[s],x,y)};
})();
