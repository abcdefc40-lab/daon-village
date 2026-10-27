// 다온 마을 서버: 정적 파일 + WebSocket 동기화 (계정 없음, 저장 없음)
// 실행: node server.js   (PORT 환경변수로 포트 변경, 기본 8765)
const http=require("http"),fs=require("fs"),path=require("path"),{WebSocketServer}=require("ws");
const PORT=+process.env.PORT||8765, ROOT=__dirname, MAX_CLIENTS=150;
const BREEDS=["maltese","poodle","pom","bichon","shihtzu","golden","corgi","schnauzer"],DIRS=["down","up","left","right"],SCENES=["out","in"];
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".webp":"image/webp",".png":"image/png",".woff2":"font/woff2",".json":"application/json"};
const PUBLIC=/^\/(index\.html|config\.js|game\.js|style\.css|assets\/[\w.-]+)$/; // 공개 파일만
const server=http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split("?")[0]);if(u==="/")u="/index.html";
  if(!PUBLIC.test(u)){res.writeHead(404);return res.end("not found");}
  fs.readFile(path.join(ROOT,u),(e,d)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{"Content-Type":TYPES[path.extname(u)]||"application/octet-stream","Cache-Control":"no-cache"});res.end(d);});});
const wss=new WebSocketServer({server,path:"/ws",maxPayload:1024});
const clean=(s,n)=>String(s||"").replace(/[\u0000-\u001f\u007f<>]/g,"").trim().slice(0,n);
const int=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(+v||0)));
let nextId=1;const players=new Map();
const pub=p=>({id:p.id,nick:p.nick,breed:p.breed,scene:p.scene,tx:p.tx,ty:p.ty,dir:p.dir});
function bcast(o,except){const s=JSON.stringify(o);for(const c of wss.clients)if(c.readyState===1&&c!==except)c.send(s);}
wss.on("connection",ws=>{
  if(wss.clients.size>MAX_CLIENTS){ws.close(1013,"full");return;}
  let me=null,moves=[],chats=[];
  ws.on("message",raw=>{let m;try{m=JSON.parse(raw);}catch{return;}const now=Date.now();
    if(m.t==="hello"&&!me){me={id:nextId++,nick:clean(m.nick,10)||"강아지",breed:BREEDS.includes(m.breed)?m.breed:"maltese",scene:SCENES.includes(m.scene)?m.scene:"out",tx:int(m.tx,0,60),ty:int(m.ty,0,60),dir:DIRS.includes(m.dir)?m.dir:"down"};
      players.set(ws,me);ws.send(JSON.stringify({t:"welcome",id:me.id,players:[...players.values()].filter(p=>p!==me).map(pub)}));bcast({t:"join",p:pub(me)},ws);return;}
    if(!me)return;
    if(m.t==="move"){moves=moves.filter(x=>now-x<1000);if(moves.length>=15)return;moves.push(now);
      me.scene=SCENES.includes(m.scene)?m.scene:me.scene;me.tx=int(m.tx,0,60);me.ty=int(m.ty,0,60);if(DIRS.includes(m.dir))me.dir=m.dir;bcast({t:"move",p:pub(me)},ws);}
    else if(m.t==="chat"){chats=chats.filter(x=>now-x<10000);if(chats.length>=5||(chats.length&&now-chats[chats.length-1]<800)){ws.send(JSON.stringify({t:"notice",text:"채팅이 너무 빨라요. 잠시 후 다시 보내 주세요."}));return;}
      const text=clean(m.text,80);if(!text)return;chats.push(now);bcast({t:"chat",id:me.id,nick:me.nick,scene:me.scene,text});}
  });
  ws.on("close",()=>{if(me){players.delete(ws);bcast({t:"leave",id:me.id});}});
});
setInterval(()=>{for(const c of wss.clients){if(c.isAlive===false){c.terminate();continue;}c.isAlive=false;c.ping();}},30000);
wss.on("connection",c=>{c.isAlive=true;c.on("pong",()=>c.isAlive=true);});
server.listen(PORT,()=>console.log(`다온 마을 서버: http://localhost:${PORT}`));
