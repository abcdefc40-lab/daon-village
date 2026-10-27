// 다온 마을 강아지 렌더러: 견종 × 미용스타일 × 방향 × 걷기 프레임을 코드로 그려서 캐시합니다.
// 몸통·머리·귀·꼬리·다리 4개를 따로 그려서 다리만 움직이므로 모든 프레임의 그림이 같습니다.
(function(){
"use strict";
const D=window.DAON_DOGDATA,TAU=Math.PI*2;
const SW=120,SH=86,SS=1.8,GY=102,OFFY=19,FRAMES=6; // 스프라이트 칸(단위), 해상도 배율, 땅 높이, 걷기 프레임 수
const EYE="#3a2a2a";
// ---------- 견종 기본값 ----------
const B={
 maltese:{c:"#fffaf2",l:"#ffffff",d:"#cdb8a2",rib:"#f58fa8",bw:22,bh:16,lg:14,hr:14.5,sn:.9,ear:"floppy",earL:1,tail:"curl",coat:.3,long:1},
 poodle:{c:"#e9b98a",l:"#f9dcb8",d:"#b4825a",rib:"#b48ae6",bw:20,bh:15,lg:22,hr:14,sn:1.15,ear:"floppy",earL:1,tail:"pom",coat:.9,long:0,curl:1},
 pom:{c:"#f7a24c",l:"#ffcd8a",d:"#c46f27",rib:"#6fc7b4",bw:21,bh:17.5,lg:10,hr:15.5,sn:.6,ear:"perk",earL:.65,tail:"curl",coat:.9,long:1},
 bichon:{c:"#fffdf9",l:"#ffffff",d:"#cbc2b6",rib:"#6db3e8",bw:21,bh:16.5,lg:13,hr:15,sn:.7,ear:"floppy",earL:.8,tail:"curl",coat:.85,long:0,curl:1},
 shihtzu:{c:"#fff1de",l:"#fffaf2",d:"#bba080",patch:"#b97f4c",rib:"#f58fa8",bw:22,bh:15.5,lg:11,hr:15,sn:.6,ear:"floppy",earL:1.2,tail:"curl",coat:.4,long:1},
 golden:{c:"#f0c777",l:"#ffe5a6",d:"#bd8d43",rib:"#4db6ac",bw:27,bh:17.5,lg:19,hr:16.5,sn:1.2,ear:"floppy",earL:.85,tail:"plume",coat:.3,long:.55},
 corgi:{natFz:.6,c:"#f29a42",l:"#ffc27f",d:"#b9661f",white:"#fffaf0",rib:"#8fa58f",bw:27,bh:14.5,lg:10,hr:15.5,sn:1,ear:"perk",earL:1.25,tail:"stub",coat:.1,long:0},
 schnauzer:{c:"#8d95a2",l:"#bcc3ce",d:"#555c69",face:"#e6e9ef",rib:"#9b7de0",bw:22,bh:16.5,lg:18,hr:14.5,sn:1,ear:"fold",earL:.8,tail:"stub",coat:.45,long:0},
};
// ---------- 미용 스타일 (기본값에 곱해지는 값) ----------
// fz 털 뭉게뭉게 정도, b 몸집, h 머리, e 귀 길이, em 귀 방식, lt 다리 굵기, tl 꼬리, sk 치마털, knot 정수리 뭉치, sn 주둥이, ps 꼬리 방울
const S={
 natural:{fz:1,b:1.14,h:1.02,e:1.35,em:"nat",lt:1.1,tl:1.3,sk:1,knot:1,sn:1},
 teddy:{fz:.95,b:1,h:1.16,e:.5,em:"round",lt:1.25,tl:.95,sk:0,knot:0,sn:.78},
 highba:{fz:1,b:.88,h:1.3,e:0,em:"merge",lt:.9,tl:.9,sk:0,knot:0,sn:.85},
 broccoli:{fz:1,b:.9,h:1.18,e:0,em:"merge",lt:1,tl:1,sk:0,knot:1.7,sn:.9,ps:1},
 sporting:{fz:.8,b:.86,h:1.05,e:1.05,em:"nat",lt:1.4,tl:1,sk:0,knot:1.2,sn:.95,ps:1},
 scissors:{fz:.95,b:1,h:1.2,e:.7,em:"round",lt:1.15,tl:1,sk:0,knot:0,sn:.72},
 summer:{fz:.04,b:.78,h:.97,e:.9,em:"nat",lt:.78,tl:.7,sk:0,knot:0,sn:1.05,lean:1},
 hygiene:{fz:.45,b:.98,h:.98,e:.85,em:"nat",lt:.95,tl:.95,sk:.12,knot:0,sn:1},
 schnauzer:{fz:.55,b:.9,h:1.05,e:.8,em:"nat",lt:1.35,tl:.7,sk:0,knot:0,sn:1,beard:1},
};
const mixc=(a,b,t)=>{const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),x=p(a),y=p(b);return"#"+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,"0")).join("");};
function params(breed,style){
  const b=B[breed],s=S[style]||S.natural,P=Object.assign({},b);
  P.breed=breed;P.style=style;P.fz=b.coat*s.fz;if(style==="natural"&&b.natFz)P.fz=b.natFz;P.bw=b.bw*s.b;P.bh=b.bh*s.b;P.hr=b.hr*s.h;
  P.lt=s.lt;P.sn=b.sn*s.sn;P.tl=s.tl;P.em=s.em;P.beard=s.beard||0;P.lean=s.lean||0;
  if(b.ear==="perk"||b.ear==="fold"){P.em=s.em==="merge"?"merge":s.em==="round"?"round":"nat";}
  P.earL=b.earL*(s.e||0);if(style==="summer"&&b.ear==="floppy")P.earL=b.earL*1.1;
  P.sk=Math.min(1,b.long*s.sk);
  // 정수리 뭉치 (풀코트 장모 종: 리본 묶음)
  P.knot=0;P.knotRibbon=false;
  if(style==="natural"&&(breed==="maltese"||breed==="shihtzu")){P.knot=1;P.knotRibbon=true;}
  if(s.knot>1)P.knot=s.knot;
  P.pomTail=!!s.ps||b.tail==="pom";
  P.sh=mixc(b.c,b.d,.32);P.hi=b.l;
  if(style==="summer"){P.sh=mixc(b.c,b.d,.42);}
  // 털이 짧은 스타일은 몸 곡선이 바로 보임
  P.short=P.fz<.1;P.hfz=style==="summer"?b.coat*.7:P.fz;if(style==="summer"){P.pomTail=P.tail!=="stub";P.knot=0;}
  return P;
}
// ---------- 그리기 도구 ----------
function blobPts(cx,cy,rx,ry,fz,n,ph,N){const pts=[];for(let i=0;i<=N;i++){const th=i/N*TAU,k=fz?1+fz*.07*(Math.abs(Math.sin(n*th/2+ph))*2-1):1;pts.push([cx+Math.cos(th)*rx*k,cy+Math.sin(th)*ry*k,th]);}return pts;}
function blob(g,cx,cy,rx,ry,o){
  o=o||{};const fz=o.fz||0,pts=blobPts(cx,cy,rx,ry,fz,o.n||Math.max(8,Math.round((rx+ry)*.5)),o.ph||0,fz?140:60);
  g.save();if(o.rot){g.translate(cx,cy);g.rotate(o.rot);g.translate(-cx,-cy);}
  const path=()=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();};
  path();const fill=o.fill||"#fff",gr=g.createRadialGradient(cx-rx*.25,cy-ry*.45,1,cx,cy,Math.max(rx,ry)*1.15);
  gr.addColorStop(0,o.hi||fill);gr.addColorStop(.55,fill);gr.addColorStop(1,o.sh||fill);g.fillStyle=o.flat?fill:gr;g.fill();
  if(o.inner){g.save();path();g.clip();o.inner(g);g.restore();}
  if(o.tex)o.tex(g);
  if(o.stroke!==false){g.strokeStyle=o.line||"#555";g.lineWidth=o.lw||1.7;g.lineJoin="round";
    if(o.arc){g.beginPath();let on=false;pts.forEach(p=>{if(p[2]>=o.arc[0]&&p[2]<=o.arc[1]){on?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);on=true;}});g.stroke();}
    else{path();g.stroke();}}
  g.restore();}
const ell=(g,x,y,rx,ry,fill,rot)=>{g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,TAU);g.fillStyle=fill;g.fill();};
function tex(P,kind,cx,cy,rx,ry,seed){ // 털 결 표시 (프레임이 달라도 같은 자리)
  const col=P.d;return g=>{g.save();g.globalAlpha=P.short?.0:.32;g.strokeStyle=col;g.lineWidth=1;g.lineCap="round";
    const cnt=kind==="curl"?11:8;for(let i=0;i<cnt;i++){const a=(i*2.399+seed)%TAU,r=(.25+((i*37+seed*13)%60)/100*.55),x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;
      g.beginPath();if(kind==="curl")g.arc(x,y,2.1,.3,4.8);else{g.moveTo(x,y-2.5);g.quadraticCurveTo(x+1.5,y,x-.5,y+3.5);}g.stroke();}g.restore();};}
function bow(g,x,y,sz,col,rot){g.save();g.translate(x,y);g.rotate(rot||0);const dk=mixc(col,"#000000",.25);g.lineWidth=1.3;g.strokeStyle=dk;g.fillStyle=col;
  for(const s of[-1,1]){g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*sz*.9,-sz*1.0,s*sz*1.15,-sz*.15);g.quadraticCurveTo(s*sz*1.0,sz*.9,0,0);g.fill();g.stroke();}
  ell(g,0,0,sz*.32,sz*.32,mixc(col,"#ffffff",.25));g.beginPath();g.ellipse(0,0,sz*.32,sz*.32,0,0,TAU);g.stroke();g.restore();}
function legPath(g,w,L){const r=w/2;g.beginPath();g.moveTo(-r,0);g.lineTo(-r,L-r);g.arc(0,L-r,r,Math.PI,0,true);g.lineTo(r,0);g.closePath();}
// 다리 한 개: 엉덩이 위치(x,y)에서 각도 ang 만큼 휘두르고, 땅에 닿도록 길이를 맞춤
function leg(g,P,x,y,w,len,ang,lift,far,o){
  o=o||{};const Leff=(len-lift)/Math.cos(ang);const fill=o.fill||P.c,col=far?mixc(fill,P.d,.28):fill,hi=far?col:(o.hi||P.hi);
  g.save();g.translate(x,y);g.rotate(-ang);
  const fluffy=P.fz>.12&&P.lt>=1.2;
  if(fluffy){ // 가위컷으로 동글게 다듬은 털 기둥
    blob(g,0,Leff*.5,w*.66,Leff*.5+w*.05,{fz:Math.max(.5,P.fz),n:11,fill:col,hi:hi,sh:mixc(col,P.d,.3),line:P.d,lw:1.6,flat:far});
    g.strokeStyle=P.d;g.globalAlpha=.55;g.lineWidth=1;g.lineCap="round";for(const k of[-.28,.28]){g.beginPath();g.moveTo(w*k,Leff-w*.42);g.lineTo(w*k,Leff-w*.12);g.stroke();}g.globalAlpha=1;
  }else{
    const pw=w*.66,py=Leff-w*.3;
    blob(g,w*.1,py,pw,w*.46,{fill:col,hi:hi,sh:mixc(col,P.d,.3),line:P.d,lw:1.5,flat:far});
    const r=w/2;g.beginPath();g.moveTo(-r,0);g.lineTo(-r,py-w*.1);g.quadraticCurveTo(-r,py+w*.12,-r*.9,py+w*.12);g.lineTo(r*.9,py+w*.12);g.quadraticCurveTo(r,py+w*.12,r,py-w*.1);g.lineTo(r,0);g.closePath();
    const gr=g.createLinearGradient(-r,0,r,0);gr.addColorStop(0,col);gr.addColorStop(.4,hi);gr.addColorStop(1,col);g.fillStyle=gr;g.fill();
    g.strokeStyle=P.d;g.lineWidth=1.6;g.lineJoin="round";g.beginPath();g.moveTo(-r,0);g.lineTo(-r,py-w*.1);g.moveTo(r,0);g.lineTo(r,py-w*.1);g.stroke();
    g.globalAlpha=.55;g.lineWidth=1;g.beginPath();for(const k of[-.2,.2]){g.moveTo(w*(.1+k),py+w*.08);g.lineTo(w*(.1+k),py+w*.3);}g.stroke();g.globalAlpha=1;}
  g.restore();}
function tailDraw(g,P,x,y,ang,sideView){
  g.save();g.translate(x,y);g.rotate(ang);const t=P.tail,s=P.tl;const o={fz:Math.max(.25,P.fz),fill:P.c,hi:P.hi,sh:P.sh,line:P.d};
  if(t==="stub"){blob(g,-2.5*s,-1,4.8*s,4*s,Object.assign({},o,{fz:P.fz}));}
  else if(P.pomTail){g.strokeStyle=P.d;g.lineWidth=4.4;g.lineCap="round";g.beginPath();g.moveTo(0,0);g.lineTo(-7.5,-5);g.stroke();g.strokeStyle=P.sh;g.lineWidth=2.6;g.beginPath();g.moveTo(0,0);g.lineTo(-7.5,-5);g.stroke();
    blob(g,-11*s,-8*s,6.3*s,6.3*s,Object.assign({},o,{fz:Math.max(.55,P.fz)}));}
  else if(t==="plume"){blob(g,-8*s,-3*s,13*s,5.2*s,Object.assign({},o,{rot:-.35,fz:.5,n:9}));}
  else{const r=(P.short?4.6:7.2)*s;blob(g,-5*s,-r*.6,r,r*1.05,Object.assign({},o,{fz:P.fz,tex:tex(P,"curl",-5*s,-r*.6,r,r,3)}));
    if(!P.short){g.strokeStyle=P.d;g.globalAlpha=.4;g.lineWidth=1;g.beginPath();g.arc(-5*s,-r*.6,r*.5,.5,4.5);g.stroke();g.globalAlpha=1;}}
  g.restore();}
// 귀
function earDraw(g,P,x,y,side,view,ang,far){ // side: -1 왼쪽 +1 오른쪽
  const col=P.patch&&!P.hfz?P.c:(P.patch||P.c),c2=far?mixc(col,P.d,.3):col,hr=P.hr,L=P.earL;
  if(P.em==="merge"||L<=0)return;
  g.save();g.translate(x,y);g.rotate(ang||0);
  const mk={fz:Math.max(.3,P.hfz),fill:c2,hi:far?c2:mixc(col,"#ffffff",.35),sh:mixc(col,P.d,.35),line:P.d};
  if(P.em==="round"){blob(g,0,hr*.1,hr*.36,hr*.36,Object.assign({},mk,{fz:Math.max(.5,P.hfz)}));}
  else if(P.ear==="floppy"){const len=hr*.82*L*(1),wd=hr*(P.hfz>.4?.42:.36);
    blob(g,side*wd*.15,len*.52,wd,len*.58,Object.assign({},mk,{rot:side*.12,fz:P.sk>.5?.5:Math.max(.25,P.hfz),n:9}));}
  else if(P.ear==="perk"){const h=hr*.92*L,w=hr*.5;g.beginPath();g.moveTo(-side*w*.25,hr*.25);g.quadraticCurveTo(side*w*.9,-h*.35,side*w*.45,-h);g.quadraticCurveTo(-side*w*.1,-h*.55,-side*w*1.1,hr*.1);g.closePath();
    const gr=g.createLinearGradient(0,-h,0,hr*.2);gr.addColorStop(0,mixc(col,"#ffffff",.15));gr.addColorStop(1,c2);g.fillStyle=gr;g.fill();g.strokeStyle=P.d;g.lineWidth=1.7;g.lineJoin="round";g.stroke();
    if(!far&&view!=="back"){g.beginPath();g.moveTo(-side*w*.1,hr*.05);g.quadraticCurveTo(side*w*.5,-h*.35,side*w*.3,-h*.72);g.quadraticCurveTo(side*w*.05,-h*.4,-side*w*.7,hr*.0);g.closePath();g.fillStyle="#f6b9bd";g.fill();}
    if(P.hfz>.4){blob(g,0,hr*.05,w*.9,hr*.3,{fz:P.hfz,fill:c2,hi:c2,sh:c2,line:P.d,lw:1.3,flat:true,stroke:false});}}
  else{const w=hr*.62*L,h=hr*.62*L; // 접힌 귀 (슈나우저)
    g.beginPath();g.moveTo(-side*w*.6,hr*.2);g.quadraticCurveTo(-side*w*.2,-h*1.1,side*w*.6,-h*.9);g.quadraticCurveTo(side*w*1.2,-h*.2,side*w*.9,h*.5);g.quadraticCurveTo(side*w*.2,h*.15,-side*w*.6,hr*.2);g.closePath();
    g.fillStyle=c2;g.fill();g.strokeStyle=P.d;g.lineWidth=1.7;g.lineJoin="round";g.stroke();}
  g.restore();}
// 정수리 뭉치
function knotDraw(g,P,x,y,rot){if(!P.knot)return;const p=P.hr*.3*P.knot,big=P.knot>1.4;
  g.save();g.translate(x,y);g.rotate(rot||0);
  blob(g,0,-p*(big?.85:.7),p*(big?1.5:1.1),p*(big?1.1:1),{fz:Math.max(.5,P.fz),fill:P.patch||P.c,hi:P.hi,sh:mixc(P.patch||P.c,P.d,.3),line:P.d,tex:P.curl?tex(P,"curl",0,-p,p,p,5):null});
  if(P.knotRibbon)bow(g,0,-p*.1,p*.85,P.rib);g.restore();}
// ---------- 얼굴 ----------
function faceFront(g,P,hx,hy,hrx,hr){
  const eyeX=hr*.45*(P.em==="merge"?1.1:1),eyeY=hy+hr*.02;
  const muz=P.sn,faceCol=P.face||P.white||P.l;
  // 주둥이
  const mrx=hr*(.34+.12*Math.min(1.2,muz)),mry=hr*(.26+.06*muz),my=hy+hr*(.36+.05*muz);
  blob(g,hx,my,mrx,mry,{fz:P.short?0:P.fz*.4,fill:P.white?P.white:(P.face||mixc(P.c,"#ffffff",.5)),hi:"#ffffff",sh:mixc(P.c,P.d,.1),line:P.d,lw:1.2,stroke:false,n:8});
  if(P.white){g.save();g.globalAlpha=1;}
  // 눈
  for(const s of[-1,1]){const x=hx+s*eyeX,r=hr*.135;ell(g,x,eyeY,r,r*1.18,EYE);ell(g,x-r*.3,eyeY-r*.45,r*.38,r*.38,"#fff");ell(g,x+r*.35,eyeY+r*.4,r*.17,r*.17,"#ffffffcc");}
  // 눈썹(슈나우저) 
  if(P.beard){for(const s of[-1,1])blob(g,hx+s*eyeX*1.02,eyeY-hr*.24,hr*.3,hr*.14,{fz:.5,fill:P.face,hi:"#fff",sh:P.face,line:P.d,lw:1,rot:-s*.12,n:6});}
  // 홍조
  g.globalAlpha=.55;for(const s of[-1,1])ell(g,hx+s*hr*.72,hy+hr*.36,hr*.14,hr*.085,"#ff9eb5");g.globalAlpha=1;
  // 코, 입
  const ny=my-mry*.55;ell(g,hx,ny,hr*.17,hr*.115,"#3a2a2a");ell(g,hx-hr*.05,ny-hr*.035,hr*.05,hr*.03,"#fff9");
  g.strokeStyle="#5a3f3f";g.lineWidth=1.2;g.lineCap="round";g.beginPath();g.moveTo(hx,ny+hr*.1);g.lineTo(hx,ny+hr*.2);g.moveTo(hx-hr*.2,ny+hr*.3);g.quadraticCurveTo(hx-hr*.1,ny+hr*.32,hx,ny+hr*.2);g.quadraticCurveTo(hx+hr*.1,ny+hr*.32,hx+hr*.2,ny+hr*.3);g.stroke();
  if(P.beard)blob(g,hx,hy+hr*.78,hr*.62,hr*.42,{fz:.7,fill:P.face,hi:"#fff",sh:mixc(P.face,P.d,.2),line:P.d,n:8});
  if(P.beard){ell(g,hx,ny,hr*.17,hr*.115,"#3a2a2a");}
}
function faceSide(g,P,hx,hy,hr){ // 오른쪽을 보는 옆얼굴
  const muz=P.sn,mrx=hr*(.4+.1*muz),mry=hr*(.3+.04*muz),mx=hx+hr*(.72+.18*muz),my=hy+hr*.3;
  const mcol=P.white?P.white:(P.face||mixc(P.c,"#ffffff",.45));
  blob(g,mx-mrx*.25,my,mrx,mry,{fz:P.short?0:P.fz*.35,fill:mcol,hi:"#fff",sh:mixc(P.c,P.d,.15),line:P.d,lw:1.6,n:8,tex:null});
  if(P.beard)blob(g,mx-mrx*.2,my+mry*.75,mrx*.95,mry*.85,{fz:.7,fill:P.face,hi:"#fff",sh:mixc(P.face,P.d,.2),line:P.d,n:7});
  // 코
  const nx=mx+mrx*.62,ny=my-mry*.45;ell(g,nx,ny,hr*.16,hr*.12,"#3a2a2a");ell(g,nx-hr*.04,ny-hr*.04,hr*.045,hr*.03,"#fff9");
  // 입
  g.strokeStyle="#5a3f3f";g.lineWidth=1.2;g.lineCap="round";g.beginPath();g.moveTo(nx-hr*.02,ny+hr*.12);g.quadraticCurveTo(nx-hr*.08,my+mry*.5,mx-mrx*.35,my+mry*.4);g.stroke();
  // 눈
  const ex=hx+hr*.5,ey=hy-hr*.02,r=hr*.14;ell(g,ex,ey,r,r*1.18,EYE);ell(g,ex-r*.3,ey-r*.45,r*.4,r*.4,"#fff");ell(g,ex+r*.35,ey+r*.4,r*.17,r*.17,"#ffffffcc");
  if(P.beard)blob(g,ex,ey-hr*.27,hr*.32,hr*.14,{fz:.5,fill:P.face,hi:"#fff",sh:P.face,line:P.d,lw:1,rot:.2,n:6});
  g.globalAlpha=.55;ell(g,hx+hr*.3,hy+hr*.38,hr*.14,hr*.085,"#ff9eb5");g.globalAlpha=1;
}
// ---------- 자세 계산 ----------
function pose(view,frame){
  if(frame<0)return{idle:1,legs:[{a:0,l:0},{a:0,l:0},{a:0,l:0},{a:0,l:0}],bob:0,tail:0,ear:0,sway:0};
  const ph=frame/FRAMES,A=view==="side"?.55:0,mk=p=>({a:A*Math.sin(TAU*p),l:Math.max(0,Math.cos(TAU*p))*(view==="side"?5.2:6.4)});
  const p1=mk(ph),p2=mk(ph+.5);
  // legs: 0 먼쪽 뒷다리, 1 먼쪽 앞다리, 2 가까운 뒷다리, 3 가까운 앞다리
  return{legs:[p1,p2,p2,p1],bob:-1.6*(Math.cos(TAU*ph*2)*.5+.5),tail:Math.sin(TAU*ph*2)*.28,ear:Math.sin(TAU*ph*2+1)*.09,sway:Math.sin(TAU*ph)*.035};
}
function neck(g,P,x,y,w,rot){ // 목걸이 리본
  g.save();g.translate(x,y);g.rotate(rot||0);g.beginPath();g.ellipse(0,0,w,w*.26,0,.05,Math.PI-.05);g.strokeStyle=mixc(P.rib,"#000000",.2);g.lineWidth=3.6;g.stroke();g.strokeStyle=P.rib;g.lineWidth=2.2;g.stroke();g.restore();}
// ---------- 옆모습 (오른쪽 방향) ----------
function drawSide(g,P,po){
  const lg=P.lg,bw=P.bw,bh=P.bh,hr=P.hr,gy=GY,bx=54+(P.long>0&&P.sk>.5?0:0);
  const by=gy-lg-bh+8+po.bob,hipY=by+bh*.45,lw=Math.max(5.2,hr*.5)*P.lt,len=gy-hipY;
  const fx=bx+bw*.56,rx=bx-bw*.56,hx=bx+bw*.74,hy=by-bh*.58-hr*.12;
  const white=P.white||null,legFill=white||null;
  // 먼쪽 다리
  leg(g,P,rx+4,hipY,lw,len,po.legs[0].a,po.legs[0].l,true,{fill:legFill});
  leg(g,P,fx-4,hipY,lw,len,po.legs[1].a,po.legs[1].l,true,{fill:legFill});
  // 꼬리
  tailDraw(g,P,bx-bw*.9,by-bh*.38,-po.tail,true);
  // 몸통
  blob(g,bx,by,bw,bh,{fz:P.fz,n:Math.round(bw*.55),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,
    inner:g=>{if(P.patch){g.fillStyle=P.patch;g.beginPath();g.ellipse(bx-bw*.1,by-bh*.5,bw*.55,bh*.55,-.1,0,TAU);g.fill();}
      if(white){g.fillStyle=white;g.beginPath();g.ellipse(bx+bw*.15,by+bh*.95,bw*.95,bh*.62,0,0,TAU);g.fill();}},
    tex:tex(P,P.curl?"curl":"strand",bx,by,bw,bh,1)});
  // 가까운 다리
  leg(g,P,rx-1,hipY,lw,len,po.legs[2].a,po.legs[2].l,false,{fill:legFill});
  leg(g,P,fx+3,hipY,lw,len,po.legs[3].a,po.legs[3].l,false,{fill:legFill});
  // 치마털 (장모 풀코트)
  if(P.sk>.05){const y0=by+bh*.15,bot=y0+(gy-7-y0)*Math.min(1,.5+P.sk*.5);const sk=P.sk;
    blob(g,bx,(y0+bot)/2+1,bw*.97,(bot-y0)/2,{fz:.9,n:Math.round(bw*.5),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,arc:[.3,Math.PI-.3],tex:tex(P,"strand",bx,(y0+bot)/2,bw,(bot-y0)/2,7)});}
  else if(P.lt>1.25&&P.fz>.1){} 
  // 목 리본, 머리
  neck(g,P,hx-hr*.18,hy+hr*.98,hr*.62,-.55);
  earDraw(g,P,hx+hr*.05,hy-hr*.62,1,"side",-po.ear-.12,true); // 먼쪽 귀(뾰족귀만 보임)
  const hrx=hr*(P.em==="merge"?1.12:1.04),hry=hr*(P.em==="merge"?1.06:1);
  blob(g,hx,hy,hrx,hry,{fz:P.hfz,n:Math.round(hr*.7),fill:P.patch&&P.fz?P.patch:P.c,hi:P.hi,sh:P.sh,line:P.d,
    inner:g=>{if(P.white){g.fillStyle=P.white;g.beginPath();g.ellipse(hx+hr*.85,hy+hr*.5,hr*.7,hr*.55,0,0,TAU);g.fill();}},
    tex:tex(P,P.curl?"curl":"strand",hx,hy,hr,hr,2)});
  faceSide(g,P,hx,hy,hr);
  if(P.beard===0)knotDraw(g,P,hx-hr*.1,hy-hr*.95,.1);else knotDraw(g,P,hx-hr*.1,hy-hr*.95,.1);
  // 가까운 귀
  if(P.ear==="floppy")earDraw(g,P,hx-hr*.2,hy-hr*.42,1,"side",po.ear*1.4,false);
  else earDraw(g,P,hx-hr*.45,hy-hr*.7,-1,"side",po.ear-.15,false);
  if(P.em==="merge"){ // 헬멧 볼털
    blob(g,hx-hr*.55,hy+hr*.35,hr*.45,hr*.4,{fz:P.fz,fill:P.c,hi:P.hi,sh:P.sh,line:P.d,stroke:false});}
}
// ---------- 앞모습 / 뒷모습 ----------
function drawFront(g,P,po){
  const lg=P.lg,bh=P.bh,hr=P.hr,gy=GY,bw=bh*1.18+P.lt*1.5,cx=60+po.sway*60;
  const by=gy-lg-bh+8+po.bob,hipY=by+bh*.4,lw=Math.max(5.4,hr*.5)*P.lt,len=gy-hipY;
  const hy=by-bh*.86-hr*.05,hrx=hr*(P.em==="merge"?1.28:1.12),hry=hr*(P.em==="merge"?1.12:1);
  g.save();g.translate(60,gy);g.rotate(po.sway);g.translate(-60,-gy);
  const ox=bw*.5,white=P.white||null;
  // 몸통
  blob(g,60,by,bw,bh,{fz:P.fz,n:Math.round(bw*.5),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,
    inner:g=>{if(white){g.fillStyle=white;g.beginPath();g.ellipse(60,by+bh*.45,bw*.62,bh*.8,0,0,TAU);g.fill();}},tex:tex(P,P.curl?"curl":"strand",60,by,bw,bh,4)});
  // 앞다리(번갈아 들기)
  for(const [i,s] of[[0,-1],[1,1]]){const q=po.legs[i===0?3:1];leg(g,P,60+s*ox,hipY,lw,len,0,q.l,false,{fill:white||null});}
  if(P.sk>.05){const y0=by+bh*.4,bot=y0+(gy-8-y0)*Math.min(1,.45+P.sk*.5);blob(g,60,(y0+bot)/2,bw*.95,(bot-y0)/2,{fz:.9,n:Math.round(bw*.5),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,arc:[.35,Math.PI-.35],tex:tex(P,"strand",60,(y0+bot)/2,bw,(bot-y0)/2,8)});}
  neck(g,P,60,hy+hry*.98,hr*.7,0);
  // 귀 (머리 뒤)
  const eo=hrx*.78;
  if(P.ear==="floppy"){earDraw(g,P,60-hrx*.78,hy-hr*.4,-1,"front",po.ear,false);earDraw(g,P,60+hrx*.78,hy-hr*.4,1,"front",-po.ear,false);}
  else if(P.em==="round"){earDraw(g,P,60-hrx*.7,hy-hr*.6,-1,"front",0,false);earDraw(g,P,60+hrx*.7,hy-hr*.6,1,"front",0,false);}
  else{earDraw(g,P,60-eo*.78,hy-hr*.55,-1,"front",po.ear,false);earDraw(g,P,60+eo*.78,hy-hr*.55,1,"front",-po.ear,false);}
  // 머리
  blob(g,60,hy,hrx,hry,{fz:P.hfz,n:Math.round(hr*.75),fill:P.patch&&P.fz?mixc(P.patch,P.c,.0):P.c,hi:P.hi,sh:P.sh,line:P.d,
    inner:g=>{if(P.patch&&P.fz){g.fillStyle=P.c;g.beginPath();g.ellipse(60,hy+hr*.5,hr*.55,hr*.7,0,0,TAU);g.fill();}
      if(P.white){g.fillStyle=P.white;g.beginPath();g.moveTo(60,hy-hr*.3);g.quadraticCurveTo(60-hr*.5,hy+hr*.3,60-hr*.7,hy+hry);g.lineTo(60+hr*.7,hy+hry);g.quadraticCurveTo(60+hr*.5,hy+hr*.3,60,hy-hr*.3);g.fill();}},
    tex:tex(P,P.curl?"curl":"strand",60,hy,hr,hr,6)});
  knotDraw(g,P,60,hy-hry*.95,0);
  faceFront(g,P,60,hy,hrx,hr);
  g.restore();
}
function drawBack(g,P,po){
  const lg=P.lg,bh=P.bh,hr=P.hr,gy=GY,bw=bh*1.2+P.lt*1.5;
  const by=gy-lg-bh+8+po.bob,hipY=by+bh*.4,lw=Math.max(5.4,hr*.5)*P.lt,len=gy-hipY;
  const hy=by-bh*.95-hr*.18,hrx=hr*(P.em==="merge"?1.28:1.12),hry=hr*(P.em==="merge"?1.12:1);
  g.save();g.translate(60,gy);g.rotate(po.sway);g.translate(-60,-gy);
  const white=P.white||null;
  // 귀 + 머리(뒤통수)
  if(P.ear==="floppy"){earDraw(g,P,60-hrx*.78,hy-hr*.4,-1,"back",po.ear,false);earDraw(g,P,60+hrx*.78,hy-hr*.4,1,"back",-po.ear,false);}
  else if(P.em==="round"){earDraw(g,P,60-hrx*.7,hy-hr*.6,-1,"back",0,false);earDraw(g,P,60+hrx*.7,hy-hr*.6,1,"back",0,false);}
  else{earDraw(g,P,60-hrx*.6,hy-hr*.55,-1,"back",po.ear,false);earDraw(g,P,60+hrx*.6,hy-hr*.55,1,"back",-po.ear,false);}
  blob(g,60,hy,hrx,hry,{fz:P.hfz,n:Math.round(hr*.75),fill:P.patch&&P.fz?P.patch:P.c,hi:P.hi,sh:P.sh,line:P.d,tex:tex(P,P.curl?"curl":"strand",60,hy,hr,hr,6)});
  knotDraw(g,P,60,hy-hry*.95,0);
  // 몸통
  blob(g,60,by,bw,bh,{fz:P.fz,n:Math.round(bw*.5),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,
    inner:g=>{if(P.patch){g.fillStyle=P.patch;g.beginPath();g.ellipse(60,by-bh*.4,bw*.6,bh*.7,0,0,TAU);g.fill();}},tex:tex(P,P.curl?"curl":"strand",60,by,bw,bh,9)});
  for(const [k,s] of[[2,-1],[3,1]]){const q=po.legs[k===2?2:0];leg(g,P,60+s*bw*.5,hipY,lw,len,0,q.l,false,{fill:white||null});}
  if(P.sk>.05){const y0=by+bh*.4,bot=y0+(gy-8-y0)*Math.min(1,.45+P.sk*.5);blob(g,60,(y0+bot)/2,bw*.95,(bot-y0)/2,{fz:.9,n:Math.round(bw*.5),fill:P.c,hi:P.hi,sh:P.sh,line:P.d,arc:[.35,Math.PI-.35],tex:tex(P,"strand",60,(y0+bot)/2,bw,(bot-y0)/2,8)});}
  tailDraw(g,P,60,by-bh*.45,po.tail*1.2-1.3,false);
  g.restore();
}
// ---------- 캐시 ----------
const cache=new Map();
function render(breed,style,view,frame){ // view: front|back|side(오른쪽 향함). frame -1=서있기, 0..5 걷기
  if(!B[breed])breed="maltese";if(!D.validStyle(breed,style))style=D.defaultStyle(breed);
  const key=breed+"|"+style+"|"+view+"|"+frame;let c=cache.get(key);if(c)return c;
  c=document.createElement("canvas");c.width=Math.round(SW*SS);c.height=Math.round(SH*SS);const g=c.getContext("2d");
  g.scale(SS,SS);g.translate(SW/2-60,-OFFY);const P=params(breed,style),po=pose(view,frame);
  g.lineCap="round";(view==="side"?drawSide:view==="back"?drawBack:drawFront)(g,P,po);
  cache.set(key,c);return c;}
const heightOf=(b,st)=>{const P=params(B[b]?b:"maltese",st);return P.lg+P.bh*1.6+P.hr*1.95+(P.knot?P.hr*.3*P.knot*1.6:0)+4;};
window.DaonDog={render,FRAMES,SW,SH,SS,GY:GY-OFFY,params,heightOf};
})();
