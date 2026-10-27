// 다온 마을 강아지 (싸이월드 미니미 도트 스타일)
// 견종 × 미용스타일 × 방향(앞/뒤/옆) × 걷기 프레임을 코드로 도트를 찍어서 만들고 캐시합니다. 그림 파일은 쓰지 않아요.
(function(){
"use strict";
const D=window.DAON_DOGDATA,{Buf,Mask,part,mix,hash,TAU}=window.DaonPix;
const SW=40,SH=38,CX=20,GY=35,FRAMES=6; // 도화지 크기(도트), 중앙 x, 발바닥 y, 걷기 프레임 수
const EYE="#3a2838",NOSE="#4a3040",MOUTH="#8a4a5e",BLUSH="#ff9db8";
// ---------- 견종 ----------
const B={
 maltese:{c:"#fffdf9",l:"#ffffff",s:"#d9d3ee",ol:"#8a7a98",bw:6,bh:4,lg:5,hr:6.4,sn:.9,ear:"floppy",earL:1.2,tail:"curl",fz:.1,long:1,tex:"strand",rib:"#6fb7f2"},
 poodle:{c:"#f3c590",l:"#ffe3b8",s:"#d99f68",ol:"#9a6540",bw:5.4,bh:3.8,lg:7,hr:6.3,sn:1.1,ear:"floppy",earL:1,tail:"pom",fz:.17,long:0,tex:"curl",rib:"#f48fc0"},
 pom:{c:"#f6a64f",l:"#ffcf8a",s:"#d77f2c",ol:"#a35a22",cream:"#ffe2b0",bw:6,bh:4.6,lg:4,hr:6.9,sn:.55,ear:"perk",earL:.8,tail:"curl",fz:.2,long:.5,tex:"strand",rib:"#7fd1c0"},
 bichon:{c:"#fffdf8",l:"#ffffff",s:"#e6d9c8",ol:"#9b8777",bw:5.8,bh:4.2,lg:5,hr:6.8,sn:.6,ear:"floppy",earL:.8,tail:"curl",fz:.17,long:0,tex:"curl",rib:"#7db7f0"},
 shihtzu:{c:"#fff3e2",l:"#fffbf2",s:"#dcc3a0",ol:"#8d6a48",patch:"#c89058",bw:6.2,bh:4,lg:4,hr:6.5,sn:.45,ear:"floppy",earL:1.4,tail:"curl",fz:.12,long:1,tex:"strand",rib:"#f58fb0"},
 golden:{c:"#f2c46d",l:"#ffe29b",s:"#cf9440",ol:"#9a6a2b",bw:7.8,bh:4.6,lg:6.5,hr:6.8,sn:1.35,ear:"floppy",earL:1,tail:"plume",fz:.08,long:.6,tex:"strand",rib:"#5fc4b4"},
 corgi:{c:"#f3a14c",l:"#ffc681",s:"#d27a28",ol:"#a05a23",white:"#fffaf0",bw:7.2,bh:3.8,lg:4,hr:6.8,sn:1.1,ear:"perk",earL:1.45,tail:"stub",fz:.02,long:0,tex:null,rib:"#8fc9a8"},
 schnauzer:{c:"#98a0b0",l:"#c4cad6",s:"#6f7686",ol:"#566078",face:"#f1f3f8",bw:6,bh:4,lg:6.5,hr:6.5,sn:1,ear:"fold",earL:.9,tail:"stub",fz:.06,long:0,tex:"curl",rib:"#a98ae8"},
};
// ---------- 미용 스타일 (견종 값에 곱해지는 값) ----------
// fm 털 뭉게뭉게, hs 머리 크기, bs 몸집, eL 귀 길이, em 귀 방식, lt 다리 굵기, pf 다리털 방울, sk 치마털, kn 정수리 뭉치, sn 주둥이, tl 꼬리
const S={
 natural:{fm:1.3,hs:1.02,bs:1.1,eL:1.35,em:"nat",lt:1,pf:0,sk:1,kn:0,sn:1,tl:1.25},
 teddy:{fm:.8,hs:1.16,bs:1,eL:.5,em:"round",lt:1.25,pf:1,sk:0,kn:0,sn:.7,tl:1},
 highba:{fm:.45,hs:1.3,bs:.9,eL:0,em:"merge",lt:1,pf:.3,sk:0,kn:0,sn:.8,tl:.9},
 broccoli:{fm:1.5,hs:1.2,bs:.88,eL:0,em:"puff",lt:1,pf:.5,sk:0,kn:1.4,sn:.9,tl:1},
 sporting:{fm:.8,hs:1.08,bs:.84,eL:1,em:"nat",lt:1,pf:1.5,sk:0,kn:1.25,sn:.95,tl:1},
 scissors:{fm:.8,hs:1.22,bs:1,eL:.6,em:"round",lt:1.1,pf:.8,sk:0,kn:0,sn:.7,tl:1},
 summer:{fm:0,hs:.95,bs:.78,eL:.9,em:"nat",lt:.8,pf:0,sk:0,kn:0,sn:1.05,tl:.7},
 hygiene:{fm:.4,hs:.98,bs:.98,eL:.85,em:"nat",lt:.95,pf:0,sk:.12,kn:0,sn:1,tl:.95},
 schnauzer:{fm:.35,hs:1,bs:.95,eL:.8,em:"nat",lt:1,pf:.9,sk:0,kn:0,sn:1,tl:.8,brow:1,furn:1},
};
function params(breed,style){const b=B[breed],s=S[style],P=Object.assign({},b);
  P.breed=breed;P.style=style;P.fz=b.fz*s.fm;P.hs=s.hs;P.bs=s.bs;P.eL=s.eL*b.earL;P.em=s.em;P.lt=s.lt;P.pf=s.pf;P.sk=s.sk*b.long;P.kn=s.kn;P.snz=b.sn*s.sn;P.tl=s.tl;
  P.brow=s.brow||0;P.furn=s.furn||0;P.summer=style==="summer";
  P.s2=mix(b.c,b.s,.55);P.farc=mix(b.c,b.s,.6);P.muz=b.white||b.face||b.cream||b.l;P.bowOl=mix(b.rib,"#6a3a58",.5);
  if(breed==="schnauzer"){P.beard=style==="schnauzer"?1:.7;}
  P.legc=b.c;if(P.furn&&b.face)P.legc=b.face;
  return P;}
const M=()=>new Mask(SW,SH);
const ell=(m,cx,cy,rx,ry,fz,ph)=>m.ell(cx,cy,rx,ry,{fz:fz||0,ph:ph||0});
function coatTex(P,seed,extra){return(x,y,c)=>{if(extra){const e=extra(x,y,c);if(e)return e;}const h=hash(x,y,seed);
  if(P.fz<.02)return h<.03?P.l:null;
  if(P.tex==="curl"){if(h<.13)return P.s2;if(h>.93)return P.l;}else if(P.tex==="strand"){if(h<.12&&(y&1))return P.s2;if(h>.95)return P.l;}return null;};}
// ---------- 자세 ----------
function pose(frame){const mv=frame>=0,k=mv?frame:0,ph=k/FRAMES;
  return{mv,ph,bob:mv&&k%3===0?-1:0,hb:frame===-2?1:0,blink:frame===-3,wag:mv?(k%2?1:-1):(frame===-2?1:0),ear:mv?(k%3===0?0:1):0,A:mv?2:0};}
// ---------- 부품 ----------
function bow(b,P,x,y){const m=M();[[0,0],[1,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[3,2],[4,2]].forEach(([i,j])=>m.d[(y+j)*SW+x+i]=1);
  part(b,m,{fill:P.rib,light:mix(P.rib,"#fff",.45),shade:mix(P.rib,"#a04070",.3),line:P.bowOl});b.px(x+2,y+1,mix(P.rib,"#fff",.7));}
function legPart(b,P,x,top,bot,lw,far,flipX){const m=M(),len=Math.max(2,bot-top);m.rect(x,top,x+lw,bot);
  if(P.pf>0){const r=lw/2+1.15*P.pf;ell(m,x+lw/2,top+len*.55,r,len*.55+.2,P.fz>.04?.14:0,3);m.clip(0,0,SW,bot);}
  const col=far?P.farc:P.legc;
  part(b,m,{fill:col,light:far?col:mix(col,P.l,.6),shade:far?mix(col,P.s,.4):P.s,line:P.ol,tex:(px,py,c)=>{if(P.white&&py>=bot-2&&!far)return P.white;if(P.patch&&false)return null;return null;}});}
function tailPart(b,P,pts,r,col){const m=M();pts.forEach(([x,y],i)=>ell(m,x,y,r*(i===pts.length-1&&P.tail==="pom"?1.1:1),r,P.tail==="pom"&&i===pts.length-1?.25:(P.fz>.05?.15:0),i));
  part(b,m,{fill:col||P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,5)});}
function tailPts(P,x,y,wag,dir){ // dir=-1: 왼쪽(옆모습 뒤쪽) , 0: 위로(뒷모습)
  const t=P.tl,w=wag;let pts,r=1.6;
  switch(P.tail){
   case"curl":pts=dir?[[-.8,-.5],[-2,-2],[-1.8,-4],[-.2,-4.6+w*.4]].map(([a,b])=>[a*Math.min(1.2,t),b]):[[0,-1],[-1.5,-2.5],[0,-4],[1.6,-3.2+w*.5]];r=1.7;break;
   case"plume":pts=dir?[[-1,0],[-3,-1+w*.3],[-5,-1.5+w*.5],[-7,-.5+w*.8]].map(([a,b])=>[a*Math.min(1.2,t),b]):[[0,-1],[-1,-3],[-2.5,-4.5+w*.5]];r=1.9;break;
   case"pom":pts=dir?[[-.5,-.3],[-1.6,-1.6],[-3.6,-3.2+w*.5]]:[[0,-1],[0,-2.5],[w*.7,-4.4]];r=1.3;break;
   default:pts=dir?[[-.5,-.3],[-1.6,-.8+w*.4]]:[[0,-1],[0,-2+w*.2]];r=1.9;}
  return{pts:pts.map(([a,b])=>[x+a,y+b]),r};}
function earShape(m,P,view,hx,hy,hrx,hry,side,po){ // side: -1 왼쪽 귀(그림 기준), 1 오른쪽, 0 옆모습 가까운 귀
  const em=P.em,L=Math.max(.2,P.eL),o=po.ear;
  if(em==="merge"){ell(m,hx+side*hrx*.9,hy+hry*.25,2.2,2.6,.2,1);return"c";}
  if(em==="puff"){ell(m,view==="side"?hx-hrx*.35:hx+side*hrx*.9,hy+hry*.2+o,3.3,3.4,.28,2);return"c";}
  const type=em==="round"?"round":P.ear;
  if(type==="round"){if(view==="side")ell(m,hx-hrx*.35,hy-hry*.78,2.4,2.2,.1,1);else ell(m,hx+side*hrx*.68,hy-hry*.78,2.4,2.2,.1,1);return"r";}
  if(type==="floppy"){const ry=Math.min(4.8,2.6*L+.9),rx=2.1+.2*L;
    if(view==="side")ell(m,hx-hrx*.35,hy-hry*.25+ry+o,rx+.4,ry,P.fz>.05?.12:0,4);else ell(m,hx+side*hrx*.9,hy+hry*.05+ry*.45+o*.5,rx,ry,P.fz>.05?.12:0,4);return"f";}
  if(type==="perk"){const h=Math.round(3.4*L+1.2);
    if(view==="side")m.poly([[hx-hrx*.75,hy-hry*.55],[hx+hrx*.1,hy-hry*.7],[hx-hrx*.35,hy-hry-h]]);
    else{const s=side;m.poly([[hx+s*hrx*.28,hy-hry*.8],[hx+s*hrx*.98,hy-hry*.4],[hx+s*hrx*.82,hy-hry-h+1]]);}return"p";}
  if(type==="fold"){const h=2.6+.8*L;
    if(view==="side")m.poly([[hx-hrx*.7,hy-hry*.7],[hx+hrx*.1,hy-hry*.75],[hx+hrx*.15,hy-hry*.1+h*.4],[hx-hrx*.2,hy-hry*.2]]);
    else{const s=side;m.poly([[hx+s*hrx*.25,hy-hry*.85],[hx+s*hrx*.95,hy-hry*.55],[hx+s*hrx*1.12,hy-hry*.55+h],[hx+s*hrx*.7,hy-hry*.35]]);}return"d";}
  return"";}
function earPaint(b,P,m,kind){const col=P.patch&&P.breed==="shihtzu"?P.patch:(P.ear==="perk"&&kind==="p"?P.c:P.c);
  part(b,m,{fill:col,light:mix(col,P.l,.5),shade:mix(col,P.s,.5),line:P.ol,tex:(x,y)=>{const h=hash(x,y,9);return P.fz>.05&&h<.1?mix(col,P.s,.4):null;}});
  if(P.breed==="shihtzu"&&P.patch&&false)return;}
function innerEar(b,m,P,kind,view,hx,hy,hrx,hry,side){ // 쫑긋귀 안쪽 분홍
  if(kind!=="p")return;const pink="#ffb9c8";
  if(view==="side"){b.px(Math.round(hx-hrx*.4),Math.round(hy-hry-1),pink);b.px(Math.round(hx-hrx*.4),Math.round(hy-hry),pink);b.px(Math.round(hx-hrx*.4),Math.round(hy-hry+1),pink);}
  else{const x=Math.round(hx+side*hrx*.7);b.px(x-(side>0?0:1),Math.round(hy-hry-1),pink);b.px(x-(side>0?0:1),Math.round(hy-hry*.9),pink);b.px(x-(side>0?0:1),Math.round(hy-hry*.7),pink);}}
function eyes(b,x0,y0,blink){ // 2x3 큰 눈 + 반짝이
  if(blink){b.px(x0,y0+2,EYE);b.px(x0+1,y0+2,EYE);return;}
  for(let j=0;j<3;j++)for(let i=0;i<2;i++)b.px(x0+i,y0+j,EYE);b.px(x0,y0,"#ffffff");}
function topKnot(b,P,x,y){if(!P.kn)return;const m=M();ell(m,x,y,2.5*P.kn,2.1*P.kn,.3,0);part(b,m,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,11)});}
// ---------- 옆모습 (오른쪽을 봄, 왼쪽은 좌우반전) ----------
function side(b,P,po){
  const lg=P.lg,hipY=GY-lg,rx=P.bw*P.bs,ry=P.bh*(.6+.4*P.bs),bx=CX-2,by=hipY+1-ry+po.bob;
  const hrx=P.hr*P.hs*1.05,hry=P.hr*P.hs,hx=Math.round(bx+rx*.78+1),hy=Math.round(by-ry*.95-hry*.42+po.hb);
  const lw=Math.max(2,Math.round(2.7*P.lt)),sw=po.A,off=p=>Math.round(sw*Math.sin(TAU*p)),lift=p=>Math.round(Math.max(0,Math.cos(TAU*p))*3.2);
  const p1=po.ph,p2=po.ph+.5,fl=Math.round(bx+rx*.55-lw/2),hl=Math.round(bx-rx*.62-lw/2);
  const leg=(x,p,far)=>legPart(b,P,x+off(p),hipY-1,GY-lift(p),lw,far);
  leg(hl,p1,true);leg(fl,p2,true);
  const tp=tailPts(P,bx-rx+.5,by-ry*.4,po.wag,-1);tailPart(b,P,tp.pts,tp.r);
  // 몸통
  const bm=M();ell(bm,bx,by,rx,ry,P.fz,1);
  part(b,bm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,1,(x,y)=>{
    if(P.white&&y>by+ry*.25)return P.white;
    if(P.patch&&y<by-ry*.1&&x<bx+rx*.3&&x>bx-rx*.7)return P.patch;
    if(P.cream&&y>by+ry*.35)return P.cream;return null;})});
  leg(hl,p2,false);leg(fl,p1,false);
  if(P.sk>.05){const top=Math.round(by+ry*.2),bot=Math.round(top+(GY-2-top)*Math.min(1,.45+P.sk*.55)),m=M();ell(m,bx,(top+bot)/2,rx*.98,(bot-top)/2,.14,2);m.clip(0,top,SW,bot+1);
    part(b,m,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,3)});}
  // 머리
  const hm=M();ell(hm,hx,hy,hrx*(P.em==="merge"?1.08:1),hry*(P.em==="merge"?1.04:1),P.fz*.85,2);
  const snx=hx+hrx*.78,sny=hy+hry*.32,snr=1.9+1.1*P.snz;ell(hm,snx,sny,snr,2.1+.25*P.snz);
  if(P.em==="puff"||P.em==="round"||P.em==="merge")ell(hm,hx-hrx*.1,hy-hry*.2,hrx*.95,hry*.95,P.fz*.4);
  // 먼쪽 귀(쫑긋귀는 머리 뒤에서 살짝)
  if(P.ear==="perk"&&P.em==="nat"){const em=M();earShape(em,P,"side",hx+2,hy-1,hrx,hry,1,po);part(b,em,{fill:P.farc,line:P.ol,flat:1});}
  part(b,hm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,2,(x,y)=>{
    if(P.white){if(x>hx+hrx*.32&&y>hy-hry*.1)return P.white;if(y>hy+hry*.5)return P.white;}
    if(P.patch&&(y<hy-hry*.2||(x>hx-hrx*.2&&x<hx+hrx*.1&&y<hy+hry*.1)))return P.patch;
    if(P.face&&x>hx+hrx*.25&&y>hy+hry*.1)return P.face;
    if(P.cream&&y>hy+hry*.45)return P.cream;
    return null;})});
  // 주둥이 하이라이트 / 코 / 입
  const nx=Math.round(snx+snr-1.4),ny=Math.round(sny-1.2);b.px(nx,ny,NOSE);b.px(nx+1,ny,NOSE);b.px(nx,ny+1,NOSE);b.px(nx+1,ny+1,NOSE);b.px(nx,ny,"#8a6a7a");
  b.px(nx-2,ny+3,MOUTH);b.px(nx-1,ny+3,MOUTH);b.px(nx-3,ny+2,MOUTH);
  // 눈, 볼터치
  const ex=Math.round(hx+hrx*.4),ey=Math.round(hy-hry*.1);
  if(P.brow){const bm2=M();ell(bm2,ex+1,ey-1.8,2.8,1.4,.2);part(b,bm2,{fill:P.face,light:"#fff",shade:P.l,line:P.ol,flat:1});}
  eyes(b,ex,ey,po.blink);b.px(ex-2,ey+3,BLUSH);b.px(ex-1,ey+3,BLUSH);
  if(P.beard){const m=M();ell(m,snx-.5,hy+hry*.82,(2.2+1.2*P.snz)*P.beard,(1.9+.6*P.beard),.2,3);part(b,m,{fill:P.face,light:"#fff",shade:P.l,line:P.ol,tex:coatTex({fz:.1,tex:"strand",l:"#fff",s2:P.l},7)});}
  // 귀 (가까운 쪽)
  if(!(P.ear==="perk"&&P.em==="nat")||true){const em=M(),k=earShape(em,P,"side",hx,hy,hrx,hry,0,po);if(k)earPaint(b,P,em,k);innerEar(b,em,P,k,"side",hx,hy,hrx,hry,0);}
  if(P.kn){topKnot(b,P,hx-hrx*.15,hy-hry*.95);bow(b,P,Math.round(hx-hrx*.15)-2,Math.round(hy-hry*.95+1.2));}
  else bow(b,P,Math.round(hx-hrx*.55),Math.round(hy-hry*.95)-1+(P.em==="round"?1:0));
}
// ---------- 앞모습 ----------
function front(b,P,po){
  const lg=P.lg,hipY=GY-lg,ry=P.bh*(.6+.4*P.bs),rx=Math.round(P.bh*1.25+.5)*P.bs*1.0+.5,by=hipY+1-ry+po.bob;
  const hrx=P.hr*P.hs*1.12,hry=P.hr*P.hs,hx=CX,hy=Math.round(by-ry*.9-hry*.45+po.hb);
  const lw=Math.max(2,Math.round(2.7*P.lt)),s=Math.sin(TAU*po.ph),lL=po.mv?Math.round(Math.max(0,s)*3.2):0,lR=po.mv?Math.round(Math.max(0,-s)*3.2):0;
  const gap=Math.round(rx*.55);
  legPart(b,P,CX-gap-lw+1,hipY-1,GY-lL,lw,false);legPart(b,P,CX+gap-1,hipY-1,GY-lR,lw,false);
  const bm=M();ell(bm,CX,by,rx,ry,P.fz,1);
  part(b,bm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,4,(x,y)=>{
    if(P.white&&Math.abs(x+.5-CX)<rx*.65&&y>by-ry*.3)return P.white;
    if(P.cream&&Math.abs(x+.5-CX)<rx*.55&&y>by-ry*.3)return P.cream;return null;})});
  if(P.sk>.05){const top=Math.round(by+ry*.3),bot=Math.round(top+(GY-2-top)*Math.min(1,.4+P.sk*.5)),m=M();ell(m,CX,(top+bot)/2,rx*.98,(bot-top)/2,.14,2);m.clip(0,top,SW,bot+1);part(b,m,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,3)});}
  // 귀(머리 뒤)
  const eps=[];for(const sd of[-1,1]){const em=M(),k=earShape(em,P,"front",hx,hy,hrx,hry,sd,po);if(k)eps.push([em,k,sd]);}
  const behind=P.em==="nat"||P.em==="puff";
  if(behind)eps.forEach(([m,k,sd])=>{earPaint(b,P,m,k);innerEar(b,m,P,k,"front",hx,hy,hrx,hry,sd);});
  const hm=M();ell(hm,hx,hy,hrx*(P.em==="merge"?1.08:1),hry*(P.em==="merge"?1.04:1),P.fz*.85,2);
  part(b,hm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,2,(x,y)=>{
    const dx=Math.abs(x+.5-hx);
    if(P.white){if(dx<hrx*.26&&y>hy-hry*.55)return P.white;if(y>hy+hry*.45)return P.white;}
    if(P.patch&&(y<hy-hry*.25||(dx>hrx*.28&&dx<hrx*.62&&y<hy+hry*.05&&x<hx)))return P.patch;
    if(P.face&&y>hy+hry*.18&&dx<hrx*.62)return P.face;
    if(P.cream&&y>hy+hry*.45)return P.cream;return null;})});
  if(!behind)eps.forEach(([m,k,sd])=>{earPaint(b,P,m,k);innerEar(b,m,P,k,"front",hx,hy,hrx,hry,sd);});
  // 얼굴
  const mz=M();ell(mz,hx,hy+hry*.5,1.6+1.5*P.snz,2.2);if(P.muz!==P.c){part(b,mz,{fill:P.muz,line:null,flat:1});}
  const ny=Math.round(hy+hry*.36),d=Math.round(hrx*.46),ey=Math.round(hy-hry*.12);
  if(P.brow)for(const sd of[-1,1]){const m=M();ell(m,hx+sd*(d-.5)-(sd>0?0:0),ey-2,2.6,1.4,.2);part(b,m,{fill:P.face,light:"#fff",shade:P.l,line:P.ol,flat:1});}
  eyes(b,hx-d-1,ey,po.blink);eyes(b,hx+d-1,ey,po.blink);
  b.px(hx-1,ny,NOSE);b.px(hx,ny,NOSE);b.px(hx-1,ny,"#8a6a7a");b.px(hx-2,ny+1,MOUTH);b.px(hx-1,ny+2,MOUTH);b.px(hx,ny+2,MOUTH);b.px(hx+1,ny+1,MOUTH);
  const bd=Math.round(hrx*.72);b.px(hx-bd-1,ey+3,BLUSH);b.px(hx-bd,ey+3,BLUSH);b.px(hx+bd-1,ey+3,BLUSH);b.px(hx+bd,ey+3,BLUSH);
  if(P.beard){const m=M();ell(m,hx,hy+hry*.84,(2.9+1.2*P.snz)*P.beard,2+.7*P.beard,.22,3);part(b,m,{fill:P.face,light:"#fff",shade:P.l,line:P.ol,tex:coatTex({fz:.1,tex:"strand",l:"#fff",s2:P.l},7)});b.px(hx-1,ny,NOSE);b.px(hx,ny,NOSE);}
  if(P.kn){topKnot(b,P,hx,hy-hry*.95);bow(b,P,hx-2,Math.round(hy-hry*.95+1.4));}
  else bow(b,P,hx+Math.round(hrx*.38),Math.round(hy-hry*.92)-1+(P.em==="round"?1:0));
}
// ---------- 뒷모습 ----------
function back(b,P,po){
  const lg=P.lg,hipY=GY-lg,ry=P.bh*(.6+.4*P.bs),rx=Math.round(P.bh*1.25+.5)*P.bs*1.0+.5,by=hipY+1-ry+po.bob;
  const hrx=P.hr*P.hs*1.12,hry=P.hr*P.hs,hx=CX,hy=Math.round(by-ry*.9-hry*.45+po.hb);
  const lw=Math.max(2,Math.round(2.7*P.lt)),s=Math.sin(TAU*po.ph),lL=po.mv?Math.round(Math.max(0,s)*3.2):0,lR=po.mv?Math.round(Math.max(0,-s)*3.2):0,gap=Math.round(rx*.55);
  legPart(b,P,CX-gap-lw+1,hipY-1,GY-lR,lw,false);legPart(b,P,CX+gap-1,hipY-1,GY-lL,lw,false);
  const bm=M();ell(bm,CX,by,rx,ry,P.fz,1);
  part(b,bm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,4,(x,y)=>P.patch&&y<by+ry*.1?P.patch:null)});
  if(P.sk>.05){const top=Math.round(by+ry*.3),bot=Math.round(top+(GY-2-top)*Math.min(1,.4+P.sk*.5)),m=M();ell(m,CX,(top+bot)/2,rx*.98,(bot-top)/2,.14,2);m.clip(0,top,SW,bot+1);part(b,m,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,3)});}
  const tp=tailPts(P,CX+(P.tail==="curl"?0:0),by-ry*.1,po.wag,0);tailPart(b,P,tp.pts,tp.r);
  const eps=[];for(const sd of[-1,1]){const em=M(),k=earShape(em,P,"front",hx,hy,hrx,hry,sd,po);if(k)eps.push([em,k,sd]);}
  const behind=P.em==="nat"||P.em==="puff";
  if(behind)eps.forEach(([m,k])=>earPaint(b,P,m,k));
  const hm=M();ell(hm,hx,hy,hrx*(P.em==="merge"?1.08:1),hry*(P.em==="merge"?1.04:1),P.fz*.85,2);
  part(b,hm,{fill:P.c,light:P.l,shade:P.s,line:P.ol,tex:coatTex(P,2,(x,y)=>P.patch&&y<hy+hry*.2?P.patch:null)});
  if(!behind)eps.forEach(([m,k])=>earPaint(b,P,m,k));
  if(P.kn){topKnot(b,P,hx,hy-hry*.95);bow(b,P,hx-2,Math.round(hy-hry*.95+1.4));}
  else bow(b,P,hx+Math.round(hrx*.38),Math.round(hy-hry*.92)-1+(P.em==="round"?1:0));
}
// ---------- 캐시 ----------
const cache=new Map();
function render(breed,style,view,frame){ // view: front|back|side(오른쪽), frame: 0..5 걷기, -1 서있기, -2 숨쉬기, -3 눈감기
  if(!B[breed])breed="maltese";if(!D.validStyle(breed,style))style=D.defaultStyle(breed);
  const key=breed+"|"+style+"|"+view+"|"+frame;let c=cache.get(key);if(c)return c;
  const b=new Buf(SW,SH);(view==="side"?side:view==="back"?back:front)(b,params(breed,style),pose(frame));
  c=b.canvas();cache.set(key,c);return c;}
// 선택 화면용 얼굴 썸네일(도트 그대로 잘라서)
const CROP={x:4,y:5,w:32,h:31};
window.DaonDog={render,FRAMES,SW,SH,GY,CROP,params,heightOf:()=>30};
})();
