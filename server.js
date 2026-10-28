// 다온 마을 서버 v6: 정적 파일 + WebSocket 동기화 + 방명록(JSON 파일)
// 실행: node server.js  (PORT 기본 8765, ADMIN_KEY 환경변수가 있으면 방명록 삭제 가능)
// 주의: Render 무료 플랜은 디스크가 임시라 재배포·재시작 때 guestbook.json 이 지워져요.
const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),{WebSocketServer}=require("ws");
const PORT=+process.env.PORT||8765, ROOT=__dirname, MAX_CLIENTS=150;
const GB_FILE=process.env.GUESTBOOK_FILE||path.join(ROOT,"guestbook.json");
const DD=require("./dogdata.js"),BREEDS=Object.keys(DD.BREEDS),DIRS=["down","up","left","right"],SCENES=["out","in"];
const EMOTES=["sit","wag","heart","bark","eat"];
const FURN=["bed","sofa","table","plant","lamp","rug","tv","bowl","shelf","frame","cushion","toy","window","clock","house","flower"];
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".webp":"image/webp",".png":"image/png",".woff2":"font/woff2",".json":"application/json"};
const PUBLIC=/^\/(index\.html|config\.js|dogdata\.js|pix\.js|art\.js|dogs\.js|game\.js|social\.js|style\.css|assets\/[\w.-]+)$/;
const clean=(s,n)=>String(s||"").replace(/[\u0000-\u001f\u007f<>]/g,"").replace(/\s+/g," ").trim().slice(0,n);
const int=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(+v||0)));
const escHTML=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// ---------- 방명록 ----------
const BAD=["시발","씨발","ㅅㅂ","병신","ㅂㅅ","개새","새끼","좆","존나","미친놈","미친년","꺼져","지랄","fuck","shit","bitch"];
const filt=s=>{let o=s;for(const w of BAD){const re=new RegExp(w.split("").map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\s._-]*"),"gi");o=o.replace(re,m=>"♡".repeat([...m].length));}return o;};
let GB=[];try{GB=JSON.parse(fs.readFileSync(GB_FILE,"utf8"));if(!Array.isArray(GB))GB=[];}catch{GB=[];}
let gbSaveT=null;const gbSave=()=>{clearTimeout(gbSaveT);gbSaveT=setTimeout(()=>fs.writeFile(GB_FILE+".tmp",JSON.stringify(GB),e=>{if(!e)fs.rename(GB_FILE+".tmp",GB_FILE,()=>{});}),300);};
const gbRate=new Map(); // ip -> [시각들]
const ADMIN_KEY=process.env.ADMIN_KEY||"";
function isAdmin(req){const k=String(req.headers["x-admin-key"]||"");if(!ADMIN_KEY||!k)return false;const a=crypto.createHash("sha256").update(k).digest(),b=crypto.createHash("sha256").update(ADMIN_KEY).digest();return crypto.timingSafeEqual(a,b);}
const ipOf=req=>String(req.headers["x-forwarded-for"]||"").split(",").pop().trim()||req.socket.remoteAddress||"?"; // 프록시가 붙인 맨 끝 값(위조 어려움)
function json(res,code,o){res.writeHead(code,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(o));}
function body(req,cb){let d="",n=0;req.on("data",c=>{n+=c.length;if(n>4096){req.destroy();return;}d+=c;});req.on("end",()=>{try{cb(JSON.parse(d||"{}"));}catch{cb(null);}});}
function api(req,res,u){
  if(u==="/api/guestbook"&&req.method==="GET")return json(res,200,{entries:GB.slice(-200).reverse(),admin:!!ADMIN_KEY});
  if(u==="/api/guestbook"&&req.method==="POST")return body(req,b=>{if(!b)return json(res,400,{error:"잘못된 요청이에요."});
    const ip=ipOf(req),now=Date.now(),arr=(gbRate.get(ip)||[]).filter(x=>now-x<3600e3);
    if(arr.length&&now-arr[arr.length-1]<20000)return json(res,200,{error:"조금 있다가 다시 남겨 주세요 (20초)."});
    if(arr.length>=10)return json(res,200,{error:"한 시간에 10개까지 남길 수 있어요."});
    const kind=b.kind==="ilchon"?"ilchon":"gb",max=kind==="ilchon"?40:200;
    const nick=filt(clean(b.nick,10))||"익명",text=filt(clean(b.text,max));if(!text)return json(res,200,{error:"내용을 적어 주세요."});
    arr.push(now);gbRate.set(ip,arr);
    const e={id:crypto.randomBytes(6).toString("hex"),kind,nick:escHTML(nick),text:escHTML(text),breed:BREEDS.includes(b.breed)?b.breed:"maltese",at:now};
    GB.push(e);if(GB.length>500)GB=GB.slice(-500);gbSave();bcast({t:"gb"});json(res,200,{ok:true,entry:e});});
  const m=u.match(/^\/api\/guestbook\/([0-9a-f]{12})$/);
  if(m&&req.method==="DELETE"){if(!isAdmin(req))return json(res,200,{error:"관리자 키가 맞지 않아요."});
    const n=GB.length;GB=GB.filter(e=>e.id!==m[1]);if(GB.length!==n){gbSave();bcast({t:"gb"});}return json(res,200,{ok:true});}
  json(res,404,{error:"not found"});}
const server=http.createServer((req,res)=>{let u;try{u=decodeURIComponent(req.url.split("?")[0]);}catch{res.writeHead(400);return res.end();}
  if(u.startsWith("/api/"))return api(req,res,u);
  if(u==="/")u="/index.html";
  if(!PUBLIC.test(u)){res.writeHead(404);return res.end("not found");}
  fs.readFile(path.join(ROOT,u),(e,d)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{"Content-Type":TYPES[path.extname(u)]||"application/octet-stream","Cache-Control":"no-cache"});res.end(d);});});
// ---------- 실시간 ----------
const wss=new WebSocketServer({server,path:"/ws",maxPayload:4096});
let nextId=1,nextBall=1;const players=new Map(),byId=new Map(),balls=new Map();
const pub=p=>({id:p.id,nick:p.nick,breed:p.breed,style:p.style,scene:p.scene,tx:p.tx,ty:p.ty,dir:p.dir,lead:p.lead||0});
function bcast(o,except){const s=JSON.stringify(o);for(const c of wss.clients)if(c.readyState===1&&c!==except)c.send(s);}
const sendTo=(id,o)=>{const p=byId.get(id);if(p&&p.ws.readyState===1)p.ws.send(JSON.stringify(o));};
const near=(a,b,d)=>a&&b&&a.scene===b.scene&&Math.abs(a.tx-b.tx)+Math.abs(a.ty-b.ty)<=d;
function rl(me,k,n,ms){const now=Date.now();const a=(me.rl[k]=(me.rl[k]||[]).filter(x=>now-x<ms));if(a.length>=n)return false;a.push(now);return true;}
function unfollow(me){if(me.lead){const l=me.lead;me.lead=0;bcast({t:"pair",follower:me.id,leader:0,prev:l});}}
wss.on("connection",ws=>{
  if(wss.clients.size>MAX_CLIENTS){ws.close(1013,"full");return;}
  let me=null,moves=[],chats=[];
  ws.on("message",raw=>{let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=="object")return;const now=Date.now();
    if(m.t==="hello"&&!me){me={ws,rl:{},id:nextId++,nick:clean(m.nick,10)||"강아지",breed:BREEDS.includes(m.breed)?m.breed:"maltese",scene:SCENES.includes(m.scene)?m.scene:"out",tx:int(m.tx,0,60),ty:int(m.ty,0,60),dir:DIRS.includes(m.dir)?m.dir:"down",room:[]};
      me.style=DD.validStyle(me.breed,m.style)?m.style:DD.defaultStyle(me.breed);
      players.set(ws,me);byId.set(me.id,me);
      ws.send(JSON.stringify({t:"welcome",id:me.id,players:[...players.values()].filter(p=>p!==me).map(pub),balls:[...balls.values()]}));bcast({t:"join",p:pub(me)},ws);return;}
    if(!me)return;
    if(m.t==="move"){moves=moves.filter(x=>now-x<1000);if(moves.length>=15)return;moves.push(now);
      me.scene=SCENES.includes(m.scene)?m.scene:me.scene;me.tx=int(m.tx,0,60);me.ty=int(m.ty,0,60);if(DIRS.includes(m.dir))me.dir=m.dir;bcast({t:"move",p:pub(me)},ws);}
    else if(m.t==="chat"){chats=chats.filter(x=>now-x<10000);if(chats.length>=5||(chats.length&&now-chats[chats.length-1]<800)){ws.send(JSON.stringify({t:"notice",text:"채팅이 너무 빨라요. 잠시 후 다시 보내 주세요."}));return;}
      const text=filt(clean(m.text,80));if(!text)return;chats.push(now);bcast({t:"chat",id:me.id,nick:me.nick,scene:me.scene,text});}
    else if(m.t==="emote"){if(!EMOTES.includes(m.k)||!rl(me,"em",6,5000))return;bcast({t:"emote",id:me.id,k:m.k});}
    else if(m.t==="greet"){const o=byId.get(+m.to);if(!o||o===me||!near(me,o,3)||!rl(me,"gr",3,5000))return;bcast({t:"greet",a:me.id,b:o.id,an:me.nick,bn:o.nick});}
    else if(m.t==="ball"){if(!rl(me,"ball",3,3000))return;for(const[k,b]of balls)if(b.id===me.id)balls.delete(k);
      const b={bid:nextBall++,id:me.id,scene:me.scene,fx:me.tx,fy:me.ty,tx:int(m.tx,0,60),ty:int(m.ty,0,60)};balls.set(b.bid,b);bcast(Object.assign({t:"ball"},b));}
    else if(m.t==="pick"){const b=balls.get(+m.bid);if(!b||b.scene!==me.scene||Math.abs(b.tx-me.tx)+Math.abs(b.ty-me.ty)>1)return;balls.delete(b.bid);bcast({t:"picked",bid:b.bid,id:me.id,nick:me.nick});}
    else if(m.t==="followReq"){const o=byId.get(+m.to);if(!o||o===me||!near(me,o,4)||!rl(me,"fr",2,8000))return;sendTo(o.id,{t:"followReq",from:me.id,nick:me.nick});}
    else if(m.t==="followAns"){const o=byId.get(+m.to);if(!o)return;if(m.ok&&near(me,o,6)){o.lead=me.id;bcast({t:"pair",follower:o.id,leader:me.id,fn:o.nick,ln:me.nick});}else sendTo(o.id,{t:"notice",text:`${me.nick} 님이 지금은 산책이 어렵대요.`});}
    else if(m.t==="unfollow"){unfollow(me);for(const p of players.values())if(p.lead===me.id)unfollow(p);}
    else if(m.t==="room"){if(!Array.isArray(m.items)||!rl(me,"room",10,10000))return;
      me.room=m.items.slice(0,40).filter(i=>Array.isArray(i)&&FURN.includes(i[0])).map(i=>[i[0],int(i[1],0,11),int(i[2],0,7)]);}
    else if(m.t==="getRoom"){const o=byId.get(+m.id);if(!o||!rl(me,"gr2",5,5000))return;ws.send(JSON.stringify({t:"room",id:o.id,nick:o.nick,breed:o.breed,style:o.style,items:o.room}));}
  });
  ws.on("close",()=>{if(me){unfollow(me);for(const p of players.values())if(p.lead===me.id)unfollow(p);players.delete(ws);byId.delete(me.id);for(const[k,b]of balls)if(b.id===me.id){balls.delete(k);bcast({t:"picked",bid:k,id:0});}bcast({t:"leave",id:me.id});}});
});
setInterval(()=>{for(const c of wss.clients){if(c.isAlive===false){c.terminate();continue;}c.isAlive=false;c.ping();}},30000);
wss.on("connection",c=>{c.isAlive=true;c.on("pong",()=>c.isAlive=true);});
server.listen(PORT,()=>console.log(`다온 마을 서버: http://localhost:${PORT}  (방명록 삭제: ${ADMIN_KEY?"켜짐":"꺼짐 - ADMIN_KEY 없음"})`));
