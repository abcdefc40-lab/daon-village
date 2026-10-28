// 다온 마을 서버 v7: 정적 파일 + WebSocket 동기화 + 방명록 + 관리자(/admin) + 손님 문의 기록 + 알림 웹훅
// 실행: node server.js   환경변수: PORT, ADMIN_KEY, NOTIFY_WEBHOOK_URL, NOTIFY_WEBHOOK_AUTH, GITHUB_DATA_TOKEN, GITHUB_DATA_REPO
// 저장: store.js (GitHub 비공개 저장소 또는 로컬 data.json)
const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),{WebSocketServer}=require("ws");
const PORT=+process.env.PORT||8765, ROOT=__dirname, MAX_CLIENTS=150;
const STORE=require("./store.js"),DEF=require("./config.js");
const DD=require("./dogdata.js"),BREEDS=Object.keys(DD.BREEDS),DIRS=["down","up","left","right"],SCENES=["out","in"];
const EMOTES=["sit","wag","heart","bark","eat"];
const FURN=["bed","sofa","table","plant","lamp","rug","tv","bowl","shelf","frame","cushion","toy","window","clock","house","flower"];
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".webp":"image/webp",".png":"image/png",".woff2":"font/woff2",".json":"application/json"};
const PUBLIC=/^\/(index\.html|admin\.html|admin\.js|admin\.css|config\.js|dogdata\.js|pix\.js|art\.js|dogs\.js|game\.js|social\.js|style\.css|assets\/[\w.-]+)$/;
const clean=(s,n)=>String(s||"").replace(/[\u0000-\u001f\u007f<>]/g,"").replace(/\s+/g," ").trim().slice(0,n);
const int=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(+v||0)));
const escHTML=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// ---------- 방명록 ----------
const BAD=["시발","씨발","ㅅㅂ","병신","ㅂㅅ","개새","새끼","좆","존나","미친놈","미친년","꺼져","지랄","fuck","shit","bitch"];
const filt=s=>{let o=s;for(const w of BAD){const re=new RegExp(w.split("").map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\s._-]*"),"gi");o=o.replace(re,m=>"♡".repeat([...m].length));}return o;};
let GB=[],INQ=[],CONTENT=null;
const snapshot=()=>({v:1,content:CONTENT,inquiries:INQ,guestbook:GB});
const persist=()=>STORE.save(snapshot),gbSave=persist;
// ---------- 콘텐츠 (관리자가 고치는 내용) ----------
const KINDS=["flow","reply","menu","hours","howto","board","quest","gb"];
const arr=(a,n)=>Array.isArray(a)?a.slice(0,n):[];
function sanitizeContent(c){c=c&&typeof c==="object"?c:{};const sh=c.shop||{},ow=c.owner||{},bd=c.board||{};
  const flows=arr(c.flows,12).map(f=>({id:clean(f&&f.id,20).replace(/[^\w-]/g,"")||"f"+crypto.randomBytes(3).toString("hex"),label:clean(f.label,30),intro:clean(f.intro,300),done:clean(f.done,300),
    questions:arr(f.questions,10).map(q=>({key:clean(q&&q.key,20).replace(/[^\w-]/g,"")||"q",q:clean(q.q,200),type:q.type==="text"?"text":"choice",options:q.type==="text"?[]:arr(q.options,12).map(o=>clean(o,40)).filter(Boolean),optional:!!q.optional})).filter(q=>q.q&&(q.type==="text"||q.options.length))})).filter(f=>f.label&&f.questions.length);
  const ids=new Set(flows.map(f=>f.id));
  const link=clean(bd.contactLink,300);
  return{shop:{name:clean(sh.name,40)||"다온펫살롱",instagram:clean(sh.instagram,40),hours:clean(sh.hours,200),address:clean(sh.address,200)},
    owner:{name:clean(ow.name,20)||"원장님",greeting:clean(ow.greeting,300)},
    menus:arr(c.menus,30).map(m=>({name:clean(m&&m.name,60),price:clean(m&&m.price,40)})).filter(m=>m.name),
    reservationHowTo:clean(c.reservationHowTo,400),
    board:{notices:arr(bd.notices,30).map(n=>({date:clean(n&&n.date,20),text:clean(n&&n.text,300)})).filter(n=>n.text),
      slots:arr(bd.slots,30).map(s=>({day:clean(s&&s.day,30),times:arr(s&&s.times,12).map(t=>clean(t,20)).filter(Boolean)})).filter(s=>s.day),
      contactLink:/^https?:\/\//.test(link)?link:"#"},
    dialogue:{choices:arr(c.dialogue&&c.dialogue.choices,16).map(x=>({label:clean(x&&x.label,30),kind:KINDS.includes(x&&x.kind)?x.kind:"reply",reply:clean(x&&x.reply,400),flow:clean(x&&x.flow,20)})).filter(x=>x.label&&(x.kind!=="flow"||ids.has(x.flow)))},
    flows};}
const content=()=>CONTENT||sanitizeContent(DEF);
// ---------- 문의 · 알림 ----------
const KST=t=>new Date(t+9*3600e3).toISOString().replace("T"," ").slice(0,16)+" KST";
const inqRate=new Map();
async function notify(e){const url=process.env.NOTIFY_WEBHOOK_URL;if(!url)return;
  const h={"Content-Type":"application/json"};if(process.env.NOTIFY_WEBHOOK_AUTH)h.Authorization=process.env.NOTIFY_WEBHOOK_AUTH;
  try{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),8000);
    const r=await fetch(url,{method:"POST",headers:h,body:JSON.stringify({type:"daon_inquiry",id:e.id,time:e.time,nickname:e.nickname,dog:e.dog,flow:e.flowLabel,choices:e.choices,message:e.message,contact:e.contact}),signal:ac.signal});clearTimeout(to);
    if(!r.ok)console.error(`[알림] 웹훅 응답 HTTP ${r.status} (문의 ${e.id})`);else console.log(`[알림] 전송 완료 (문의 ${e.id})`);}
  catch(err){console.error(`[알림] 웹훅 전송 실패 (문의 ${e.id}): ${err.name}`);}}
const gbRate=new Map(); // ip -> [시각들]
const ADMIN_KEY=process.env.ADMIN_KEY||"";
function isAdmin(req){const k=String(req.headers["x-admin-key"]||"");if(!ADMIN_KEY||!k)return false;const a=crypto.createHash("sha256").update(k).digest(),b=crypto.createHash("sha256").update(ADMIN_KEY).digest();return crypto.timingSafeEqual(a,b);}
const ipOf=req=>String(req.headers["x-forwarded-for"]||"").split(",").pop().trim()||req.socket.remoteAddress||"?"; // 프록시가 붙인 맨 끝 값(위조 어려움)
function json(res,code,o){res.writeHead(code,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(o));}
function body(req,cb,max=4096){let d="",n=0;req.on("data",c=>{n+=c.length;if(n>max){req.destroy();return;}d+=c;});req.on("end",()=>{try{cb(JSON.parse(d||"{}"));}catch{cb(null);}});}
function api(req,res,u){
  if(u==="/api/content"&&req.method==="GET")return json(res,200,content());
  if(u==="/api/inquiry"&&req.method==="POST")return body(req,b=>{if(!b)return json(res,400,{error:"잘못된 요청이에요."});
    const ip=ipOf(req),now=Date.now(),a=(inqRate.get(ip)||[]).filter(x=>now-x<3600e3);
    if(a.length&&now-a[a.length-1]<15000)return json(res,200,{error:"조금 있다가 다시 보내 주세요 (15초)."});if(a.length>=8)return json(res,200,{error:"한 시간에 8번까지 문의할 수 있어요."});
    const f=content().flows.find(x=>x.id===b.flow);if(!f)return json(res,200,{error:"문의 종류를 찾을 수 없어요."});
    const ans=b.answers&&typeof b.answers==="object"?b.answers:{},choices=[];let message="",contact="";
    for(const q of f.questions){let v=clean(ans[q.key],q.type==="text"?300:40);
      if(q.type==="choice"&&v&&!q.options.includes(v))return json(res,200,{error:"선택지가 바뀌었어요. 다시 시도해 주세요."});
      if(!v&&!q.optional)return json(res,200,{error:`'${q.q}' 에 답해 주세요.`});
      v=filt(v);if(q.key==="message")message=v;else if(q.key==="contact")contact=v;else choices.push({key:q.key,q:q.q,a:v});}
    a.push(now);inqRate.set(ip,a);
    const breed=BREEDS.includes(b.breed)?b.breed:"maltese",style=DD.validStyle(breed,b.style)?b.style:DD.defaultStyle(breed);
    const e={id:crypto.randomBytes(6).toString("hex"),at:now,time:KST(now),status:"new",flow:f.id,flowLabel:f.label,nickname:filt(clean(b.nick,10))||"익명",
      dog:{breed,style,breedName:DD.BREEDS[breed].name,styleName:(DD.STYLES[style]||{}).name||style},choices,message,contact};
    INQ.push(e);if(INQ.length>2000)INQ=INQ.slice(-2000);persist();json(res,200,{ok:true,id:e.id,done:f.done});notify(e);});
  if(u.startsWith("/api/admin/")){if(!ADMIN_KEY)return json(res,403,{error:"서버에 ADMIN_KEY 가 아직 설정되지 않았어요."});if(!isAdmin(req))return json(res,401,{error:"관리자 키가 맞지 않아요."});
    if(u==="/api/admin/ping")return json(res,200,{ok:true,store:STORE.mode,notify:!!process.env.NOTIFY_WEBHOOK_URL});
    if(u==="/api/admin/content"&&req.method==="PUT")return body(req,b=>{if(!b)return json(res,400,{error:"내용이 너무 크거나 잘못됐어요."});CONTENT=sanitizeContent(b);persist();bcast({t:"content"});json(res,200,{ok:true,content:CONTENT});},65536);
    if(u==="/api/admin/content/reset"&&req.method==="POST"){CONTENT=null;persist();bcast({t:"content"});return json(res,200,{ok:true,content:content()});}
    if(u==="/api/admin/inquiries"&&req.method==="GET")return json(res,200,{inquiries:INQ.slice().reverse()});
    const mi=u.match(/^\/api\/admin\/inquiries\/([0-9a-f]{12})$/);
    if(mi&&req.method==="PATCH")return body(req,b=>{const e=INQ.find(x=>x.id===mi[1]);if(!e)return json(res,404,{error:"없는 문의예요."});
      if(b&&["new","handled"].includes(b.status))e.status=b.status;if(b&&typeof b.memo==="string")e.memo=clean(b.memo,300);persist();json(res,200,{ok:true,inquiry:e});});
    if(mi&&req.method==="DELETE"){INQ=INQ.filter(x=>x.id!==mi[1]);persist();return json(res,200,{ok:true});}
    if(u==="/api/admin/guestbook"&&req.method==="GET")return json(res,200,{entries:GB.slice().reverse()});
    return json(res,404,{error:"not found"});}
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
  if(u==="/")u="/index.html";if(u==="/admin"||u==="/admin/")u="/admin.html";
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
STORE.load().then(d=>{GB=d.guestbook;INQ=d.inquiries;CONTENT=d.content?sanitizeContent(d.content):null;
  server.listen(PORT,()=>console.log(`다온 마을 서버: http://localhost:${PORT}  저장소=${STORE.mode}  관리자=${ADMIN_KEY?"켜짐":"꺼짐(ADMIN_KEY 없음)"}  알림=${process.env.NOTIFY_WEBHOOK_URL?"켜짐":"꺼짐"}`));});
const bye=()=>{STORE.flush(snapshot).finally(()=>process.exit(0));setTimeout(()=>process.exit(0),5000);};process.on("SIGTERM",bye);process.on("SIGINT",bye);
process.on("unhandledRejection",e=>console.error("[오류] "+(e&&e.message)));
