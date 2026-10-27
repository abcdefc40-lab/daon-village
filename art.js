// 다온 마을 도트 그림 공장 (싸이월드 미니룸 느낌). 모든 그림은 코드로 찍어서 한 번만 만들어 둡니다.
(function(){
"use strict";
const {Buf,Mask,part,mix,hash}=window.DaonPix;
const auto=(f,line)=>({fill:f,light:mix(f,"#ffffff",.5),shade:mix(f,"#8a5aa0",.2),line:line||mix(f,"#5a3a6a",.5)});
const paint=(b,m,f,line,ex)=>part(b,m,Object.assign(auto(f,line),ex||{}));
const MK=b=>()=>new Mask(b.w,b.h);
// 3x5 도트 글씨
const G={D:"110101101101110",A:"010101111101101",O:"010101101101010",N:"101111111101101",P:"110101110100100",E:"111100110100111",T:"111010010010010",S:"011100010001110",L:"100100100100111",I:"111010010010111",C:"011100100100011"," ":"000000000000000"};
function text(b,s,x,y,c){for(const ch of s){const g=G[ch]||G[" "];for(let j=0;j<5;j++)for(let i=0;i<3;i++)if(g[j*3+i]==="1")b.px(x+i,y+j,c);x+=4;}}
const textW=s=>s.length*4-1;
function paw(b,x,y,c){[[1,0],[3,0],[0,2],[4,2]].forEach(([i,j])=>{b.px(x+i,y+j,c);b.px(x+i,y+j+1,c);});[[2,2],[1,3],[2,3],[3,3],[1,4],[3,4],[2,4]].forEach(([i,j])=>b.px(x+i,y+j,c));}
function heart(b,x,y,c){[[0,0],[1,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[2,3]].forEach(([i,j])=>b.px(x+i,y+j,c));}
function sparkle(b,x,y,c){b.px(x,y,c);b.px(x-1,y,c);b.px(x+1,y,c);b.px(x,y-1,c);b.px(x,y+1,c);}
const PAL={grass:"#b7e69b",grass2:"#b0e093",tuft:"#8fcb78",path:"#fbf0e3",pathJ:"#e4cdb6",wood:"#d5a574",pink:"#ff9fc0",cream:"#fff3e3"};
// ---------- 꽃 ----------
const FL=[["#ff8fb8","#ffe0ee"],["#ffe066","#fff6bf"],["#ffffff","#ffe0ee"],["#9ec8ff","#e0efff"],["#c6a4ff","#ece0ff"],["#ffb07a","#ffe0c8"]];
function flower(b,x,y,k){const[c,d]=FL[k%FL.length];b.px(x,y+3,"#6fbf73");b.px(x,y+4,"#6fbf73");b.px(x-1,y+4,"#8fd88a");
  b.px(x-1,y,c);b.px(x+1,y,c);b.px(x,y-1,c);b.px(x,y+1,c);b.px(x,y,"#fff3a0");b.px(x-1,y-1,d);}
// ---------- 나무 / 덤불 ----------
function tree(variant){const b=new Buf(44,52),M=MK(b);const pink=variant===1;const g=pink?"#ffc6de":"#92dc8b",ol=pink?"#b45c86":"#3f8a66";
  const tr=M().rect(19,34,25,50);paint(b,tr,"#c99a6b","#7a5238");
  const c=M();c.ell(22,20,17,15,{fz:.1,n:12}).add(M().ell(11,27,10,9,{fz:.12,n:9})).add(M().ell(33,27,10,9,{fz:.12,n:9})).add(M().ell(22,14,12,10,{fz:.1,n:9}));
  paint(b,c,g,ol,{light:mix(g,"#fff",.55),shade:mix(g,pink?"#d0608f":"#3f9f6a",.35),tex:(x,y)=>{const h=hash(x,y,3);if(h<.07)return mix(g,"#fff",.6);if(h>.95)return mix(g,pink?"#d0608f":"#3f9f6a",.3);return null;}});
  for(let i=0;i<9;i++){const x=8+Math.floor(hash(i,1,5)*28),y=8+Math.floor(hash(i,2,5)*24);if(c.has(x,y)){b.px(x,y,pink?"#fff":"#ffd9ec");}}
  return b.canvas();}
function bush(){const b=new Buf(26,18),M=MK(b),m=M();m.ell(13,10,11.5,7,{fz:.14,n:9}).add(M().ell(7,11,6,5,{fz:.1})).add(M().ell(19,11,6,5,{fz:.1}));
  paint(b,m,"#98e08f","#3f8a66",{tex:(x,y)=>{const h=hash(x,y,8);return h<.06?"#c9f5b0":h>.96?"#6cc380":null;}});
  [[6,7,0],[12,5,1],[18,8,2],[9,11,3],[16,12,4]].forEach(([x,y,k])=>{b.px(x,y,FL[k][0]);b.px(x+1,y,FL[k][1]);});return b.canvas();}
// ---------- 벤치 / 분수 / 게시판 ----------
function bench(){const b=new Buf(40,26),M=MK(b);
  paint(b,M().rect(3,16,7,25),"#e8a9c4","#a05a82");paint(b,M().rect(33,16,37,25),"#e8a9c4","#a05a82");
  paint(b,M().rect(3,2,37,12),"#ffc2d8","#a05a82");for(const x of[12,21,30])b.vline(x,3,8,"#e79bb9");
  paint(b,M().rect(1,12,39,18),"#ffb3cf","#a05a82");heart(b,18,5,"#fff");return b.canvas();}
function fountain(){const b=new Buf(44,40),M=MK(b);
  paint(b,M().ell(22,29,21,10,{fz:.03}),"#f3ecff","#8a78b0");
  paint(b,M().ell(22,28,17,7),"#9fdcff","#6aa8d8",{tex:(x,y)=>{const h=hash(x,y,2);return h<.07?"#e3f6ff":h>.95?"#7cc3ee":null;}});
  paint(b,M().rect(19,14,25,27),"#f3ecff","#8a78b0");paint(b,M().ell(22,14,9,3.4),"#f3ecff","#8a78b0");paint(b,M().ell(22,13.5,6.5,2),"#9fdcff","#6aa8d8");
  [[22,5],[19,7],[25,7],[17,10],[27,10]].forEach(([x,y])=>{b.px(x,y,"#bfe9ff");b.px(x,y+1,"#e8f8ff");});return b.canvas();}
function board(){const b=new Buf(32,40),M=MK(b);
  paint(b,M().rect(5,18,9,39),"#c99a6b","#7a5238");paint(b,M().rect(23,18,27,39),"#c99a6b","#7a5238");
  paint(b,M().poly([[0,9],[16,1],[32,9],[30,11],[2,11]]),"#ff9fc0","#a8446e");
  paint(b,M().rect(2,11,30,29),"#c99a6b","#7a5238");paint(b,M().rect(4,13,28,27),"#ecc79a","#b98557");
  [[6,15,"#fff6b8"],[14,15,"#ffd0e2"],[21,15,"#d5ecff"],[8,21,"#d5ecff"],[17,21,"#fff6b8"]].forEach(([x,y,c])=>{b.rect(x,y,6,5,c);b.px(x+2,y,"#e04a6a");b.px(x+1,y+2,"#b9a0a8");b.px(x+3,y+2,"#b9a0a8");});
  return b.canvas();}
// ---------- 울타리 한 칸 (16x16) ----------
function fenceH(){const b=new Buf(16,16),M=MK(b);paint(b,M().rect(0,6,16,9),"#f3ecff","#9a90b8");paint(b,M().rect(0,11,16,13),"#f3ecff","#9a90b8");
  for(const x of[1,6,11]){const m=M();m.rect(x,4,x+4,16).poly([[x,4],[x+2,1],[x+4,4]]);paint(b,m,"#ffffff","#9a90b8");}
  return b.canvas();}
function fenceV(){const b=new Buf(16,16),M=MK(b);paint(b,M().rect(6,0,10,16),"#ffffff","#9a90b8");paint(b,M().rect(5,2,11,5),"#f3ecff","#9a90b8");paint(b,M().rect(5,10,11,13),"#f3ecff","#9a90b8");return b.canvas();}
function fencePost(){const b=new Buf(16,16),M=MK(b);paint(b,M().rect(4,3,12,16).poly([[4,3],[8,0],[12,3]]),"#ffffff","#9a90b8");heart(b,6,6,"#ffb3cf");return b.canvas();}
// ---------- 가게 건물 (192x128) ----------
function shop(){const W=192,H=128,b=new Buf(W,H),M=MK(b);
  // 굴뚝
  paint(b,M().rect(140,0,158,22),"#ffe3cf","#a8704f",{tex:(x,y)=>(y%5===0||(x+(Math.floor(y/5)%2)*4)%8===0)?"#f0c6a8":null});paint(b,M().rect(137,0,161,4),"#f0c6a8","#a8704f");
  // 지붕
  const roof=M().poly([[4,52],[188,52],[168,12],[24,12]]);
  paint(b,roof,"#ff9fc0","#a8446e",{tex:(x,y)=>{const r=(y-12)%8,row=Math.floor((y-12)/8);if(r===7)return"#e0709c";if(r===0)return"#ffc2d8";if(r<7&&(x+(row%2)*4)%8===0)return"#f080aa";return null;}});
  paint(b,M().rect(20,9,172,13),"#ffd0e2","#a8446e");
  // 간판
  const sg=M().rect(46,22,146,44);paint(b,sg,"#fff8ee","#a8704f");b.rect(48,24,96,18,"#fff8ee");
  for(let x=48;x<144;x++){b.px(x,24,"#ffb3cf");b.px(x,41,"#ffb3cf");}for(let y=24;y<42;y++){b.px(48,y,"#ffb3cf");b.px(143,y,"#ffb3cf");}
  paw(b,53,28,"#ff7aa8");text(b,"DAON PET SALON",64,30,"#8a4a6a");heart(b,133,30,"#ff7aa8");
  // 벽
  paint(b,M().rect(14,52,178,128),"#fff3e3","#b98f7a",{tex:(x,y)=>(y%6===0&&y<118)?"#f6e3cf":(y>=118?"#ecd0b8":null)});
  // 차양
  const aw=M().rect(8,54,184,68);for(let s=0;s<22;s++)aw.add(M().ell(8+s*8+4,68,4,4.6));
  paint(b,aw,"#ffffff","#a8446e",{tex:(x,y)=>Math.floor((x-8)/8)%2===0?"#ff9fc0":"#ffffff",flat:1});
  for(let x=8;x<184;x++)b.px(x,54,"#a8446e");
  // 창문 2개
  for(const wx of[24,128]){paint(b,M().rect(wx,78,wx+40,112),"#c99a6b","#7a5238");
    for(let y=81;y<109;y++)for(let x=wx+3;x<wx+37;x++)b.px(x,y,y<92?"#cfeeff":y<100?"#def4ff":"#eaf9ff");
    b.rect(wx+19,81,2,28,"#c99a6b");b.rect(wx+3,94,34,2,"#c99a6b");
    sparkle(b,wx+10,86,"#fff");b.px(wx+28,100,"#fff");b.px(wx+29,100,"#fff");
    paint(b,M().poly([[wx+3,81],[wx+13,81],[wx+3,95]]),"#ffd0e2","#a8446e");paint(b,M().poly([[wx+37,81],[wx+27,81],[wx+37,95]]),"#ffd0e2","#a8446e");
    paint(b,M().rect(wx-2,111,wx+42,118),"#a8774e","#6b4429");
    for(let i=0;i<14;i++){const x=wx+1+i*3,k=Math.floor(hash(wx+i,3,1)*6);b.px(x,109,"#6fbf73");b.px(x,108,FL[k][0]);b.px(x+1,108,FL[k][1]);b.px(x,107,FL[k][0]);}}
  // 문
  paint(b,M().rect(77,92,115,128).poly([[77,92],[96,70],[115,92]]).add(M().ell(96,92,19,19)),"#ffffff","#7a5238");
  const dr=M().rect(80,92,112,128).add(M().ell(96,92,16,16));paint(b,dr,"#ffb3cf","#a8446e");
  paint(b,M().ell(96,90,7,7),"#cfeeff","#a8446e");b.px(94,87,"#fff");b.px(95,87,"#fff");b.px(94,88,"#fff");
  paint(b,M().rect(84,102,94,122),"#ff9fc0","#a8446e");paint(b,M().rect(98,102,108,122),"#ff9fc0","#a8446e");
  paint(b,M().ell(108,112,2.2,2.2),"#ffe066","#b8861c");heart(b,92,60,"#ffffff");
  b.rect(70,124,52,4,"#e4dcea");
  // 벽등
  for(const x of[64,128]){paint(b,M().rect(x,86,x+6,96),"#fff6b8","#b8861c");b.px(x+3,88,"#fff");}
  // 하단 화단 덤불
  for(const x of[16,150]){const m=M();m.ell(x+12,124,13,6,{fz:.15,n:8});paint(b,m,"#98e08f","#3f8a66");for(let i=0;i<5;i++)b.px(x+4+i*4,120+(i%2),FL[i][0]);}
  return b.canvas();}
// ---------- 땅 (바깥 마을) ----------
function outGround(o){const W=o.w,H=o.h,b=new Buf(W,H),M=MK(b),T=16;
  const x0=T,y0=T,x1=W-T,y1=H-T; // 풀밭 영역 (펜스 포함), 아래 한 줄은 흙
  const grass=M().rect(x0,y0,x1,y1+0);
  // 둥근 모서리
  for(const[cx,cy,sx,sy]of[[x0,y0,1,1],[x1-1,y0,-1,1],[x0,y1-1,1,-1],[x1-1,y1-1,-1,-1]])for(let j=0;j<6;j++)for(let i=0;i<6;i++){const dx=i-5.5,dy=j-5.5;if(dx*dx+dy*dy>30)grass.d[(cy+sy*j)*W+(cx+sx*i)]=0;}
  // 흙(절벽)
  const soil=M().rect(x0,y1-2,x1,y1+T-2);
  for(const[cx,sx]of[[x0,1],[x1-1,-1]])for(let j=0;j<8;j++)for(let i=0;i<8;i++){const dx=i-7.5,dy=j-.5;if(dx*dx+dy*dy>56)soil.d[(y1+T-3-j)*W+(cx+sx*i)]=0;}
  paint(b,soil,"#e2b794","#8a5f48",{tex:(x,y)=>{const h=hash(x,y,4);return h<.06?"#c99a78":h>.96?"#f3d3b8":null;}});
  for(let x=x0+3;x<x1-3;x++){if(hash(x,1,6)<.5)b.px(x,y1+(hash(x,2,6)<.4?3:2),"#8fcb78");}
  paint(b,grass,PAL.grass,"#6fb069",{light:PAL.grass,shade:PAL.grass,tex:(x,y)=>{const t=((x>>4)+(y>>4))&1;const h=hash(x,y,1);
      if(h<.012)return PAL.tuft;if(h>.9988)return"#ffffff";return t?PAL.grass2:null;}});
  // 풀 뭉치(작은 v)
  for(let i=0;i<150;i++){const x=x0+4+Math.floor(hash(i,0,9)*(x1-x0-8)),y=y0+6+Math.floor(hash(i,1,9)*(y1-y0-10));if(grass.has(x,y)&&grass.has(x+2,y)){b.px(x,y,PAL.tuft);b.px(x+2,y,PAL.tuft);b.px(x+1,y+1,PAL.tuft);}}
  // 돌길
  const pm=M();o.path.forEach(([tx,ty])=>pm.rect(tx*T,ty*T,tx*T+T,ty*T+T));
  const pset=new Set(o.path.map(([x,y])=>x+","+y));
  o.path.forEach(([tx,ty])=>{b.rect(tx*T,ty*T,T,T,PAL.pathJ);
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const ox=tx*T+i*8+(hash(tx*2+i,ty*2+j,3)<.5?0:1)+(j?3:0)*(i?-1:1)*0,oy=ty*T+j*8+(hash(tx*2+i,ty*2+j,4)<.5?0:1);
      const m=M().rect(ox,oy,ox+7,oy+7);m.d[oy*W+ox]=0;m.d[oy*W+ox+6]=0;m.d[(oy+6)*W+ox]=0;m.d[(oy+6)*W+ox+6]=0;
      part(b,m,{fill:PAL.path,light:"#fffaf2",shade:"#ecd8c2",line:null});}});
  // 길 양옆 풀과 경계
  o.path.forEach(([tx,ty])=>{for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]])if(!pset.has((tx+dx)+","+(ty+dy))){const x=tx*T,y=ty*T;
    if(dx)for(let j=0;j<T;j++)b.px(dx<0?x:x+T-1,y+j,"#cfae98");else for(let i=0;i<T;i++)b.px(x+i,dy<0?y:y+T-1,"#cfae98");}});
  // 꽃밭 + 흩어진 꽃
  const fl=[];o.beds.forEach(([bx,by,bw,bh,dens])=>{for(let y=by;y<by+bh;y+=3)for(let x=bx;x<bx+bw;x+=3)if(hash(x,y,12)<dens)fl.push([x+Math.floor(hash(x,y,13)*3),y+Math.floor(hash(x,y,14)*3),Math.floor(hash(x,y,15)*6)]);});
  for(let i=0;i<70;i++){const x=x0+8+Math.floor(hash(i,5,21)*(x1-x0-16)),y=y0+14+Math.floor(hash(i,6,21)*(y1-y0-24));if(!o.solid(x,y)&&!pm.has(x,y))fl.push([x,y,Math.floor(hash(i,7,21)*6)]);}
  fl.sort((a,c)=>a[1]-c[1]).forEach(([x,y,k])=>{if(!pm.has(x,y)&&!o.solid(x,y))flower(b,x,y,k);});
  // 가게 건물, 현관 매트
  b.blit(Buf.fromCanvas(o.shop),o.shopX,o.shopY);
  const mt=M().rect(o.doorX+2,o.shopY+130,o.doorX+30,o.shopY+137);paint(b,mt,"#c98a6a","#7a4a38",{tex:(x,y)=>x%4<2?"#e0a888":null});
  // 울타리
  const fh=Buf.fromCanvas(o.fenceH),fv=Buf.fromCanvas(o.fenceV),fp=Buf.fromCanvas(o.fencePost);
  for(let tx=1;tx<=o.cols-2;tx++){b.blit(fh,tx*T,T);b.blit(fh,tx*T,(o.rows-2)*T);}
  for(let ty=2;ty<=o.rows-3;ty++){b.blit(fv,T,ty*T);b.blit(fv,(o.cols-2)*T,ty*T);}
  for(const[tx,ty]of[[1,1],[o.cols-2,1],[1,o.rows-3],[o.cols-2,o.rows-3]])b.blit(fp,tx*T,ty*T);
  return b.canvas();}
Buf.fromCanvas=function(cv){const g=cv.getContext("2d"),d=g.getImageData(0,0,cv.width,cv.height),b=new Buf(cv.width,cv.height);b.d.set(new Uint32Array(d.data.buffer));return b;};
// ---------- 살롱 안 ----------
function inRoom(o){const W=o.w,H=o.h,b=new Buf(W,H),M=MK(b),T=16,fy=80,fb=o.rows*T; // 바닥 시작/끝
  // 바닥
  for(let y=fy;y<fb;y++)for(let x=0;x<W;x++){const t=(((x>>4)+(y>>4))&1);let c=t?"#fff1f6":"#ffe0ec";if((x&15)===0||(y&15)===0)c="#f7cfe0";const h=hash(x,y,2);if(h<.004)c="#ffffff";b.px(x,y,c);}
  // 벽지(핑크 + 하트무늬)
  for(let y=0;y<fy;y++)for(let x=0;x<W;x++){let c=y<56?"#ffd2e4":"#f4e9ff";if(y<56&&(((x>>3)+(y>>3))&1)&&(x&7)===3&&(y&7)===3)c="#fff0f6";if(y>=56&&(x&15)===0)c="#e5d6fa";b.px(x,y,c);}
  b.rect(0,0,W,5,"#ffffff");b.rect(0,5,W,2,"#e8c9f4");b.rect(0,54,W,3,"#ffffff");b.rect(0,76,W,4,"#c9a8e6");b.rect(0,76,W,1,"#e5d0f6");
  // 하트 가랜드
  for(let x=6;x<W-8;x+=14){const y=10+Math.round(3*Math.sin(x/W*Math.PI*4));heart(b,x,y,x%28?"#ff9fc0":"#ffffff");b.px(x+2,y-1,"#d9a0c0");}
  // 창문
  for(const wx of[112,208]){paint(b,M().rect(wx,16,wx+36,54),"#ffffff","#a898c8");
    for(let y=19;y<51;y++)for(let x=wx+3;x<wx+33;x++)b.px(x,y,y<32?"#bfe3ff":y<42?"#d4eeff":"#e8f7ff");
    b.rect(wx+17,19,2,32,"#ffffff");b.rect(wx+3,34,30,2,"#ffffff");b.rect(wx+7,26,8,3,"#ffffff");b.rect(wx+22,40,9,3,"#ffffff");sparkle(b,wx+26,24,"#fff");
    paint(b,M().poly([[wx+3,19],[wx+12,19],[wx+3,36]]),"#ffb3cf","#a8446e");paint(b,M().poly([[wx+33,19],[wx+24,19],[wx+33,36]]),"#ffb3cf","#a8446e");}
  // 시계
  paint(b,M().ell(177,26,8,8),"#ffffff","#a898c8");b.vline(177,21,6,"#8a5a80");b.hline(177,26,4,"#8a5a80");b.px(177,26,"#ff7aa8");
  // 게시판 (코르크)
  paint(b,M().rect(20,12,92,62),"#c99a6b","#7a5238");paint(b,M().rect(23,15,89,59),"#e8c08e","#b98557",{tex:(x,y)=>hash(x,y,5)<.1?"#d3a572":null});
  [[26,19,"#fff6b8"],[44,18,"#ffd0e2"],[62,20,"#d5ecff"],[76,18,"#ffe0c8"],[28,38,"#d5ecff"],[48,40,"#fff6b8"],[68,38,"#ffd0e2"]].forEach(([x,y,c])=>{b.rect(x,y,13,14,c);b.px(x+6,y,"#e04a6a");for(let k=0;k<3;k++)b.hline(x+2,y+4+k*3,9,"#c9aab8");});
  paint(b,M().rect(36,4,76,14),"#ff9fc0","#a8446e");text(b,"NOTICE",44,7,"#ffffff");
  // 선반 + 샴푸병
  paint(b,M().rect(262,34,336,39),"#e8b48a","#7a5238");
  [[266,"#9fd8ff"],[274,"#ffb3cf"],[282,"#fff3a0"],[290,"#c6a4ff"],[298,"#bdf0a0"]].forEach(([x,c],i)=>paint(b,M().rect(x,22+(i%2)*2,x+6,34),c,mix(c,"#4a3a6a",.5)));
  paint(b,M().rect(310,26,328,34),"#ffffff","#a898c8");paw(b,315,27,"#ff9fc0");
  // 왼쪽/오른쪽 벽
  for(let y=0;y<fb;y++)for(const x of[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,W-16,W-15,W-14,W-13,W-12,W-11,W-10,W-9,W-8,W-7,W-6,W-5,W-4,W-3,W-2,W-1]){if(y>=fy-0){const edge=x<16?x:W-1-x;b.px(x,y,edge<2?"#c9a8e6":edge<4?"#ffffff":edge<14?"#ffd2e4":"#e8b8d8");}}
  // 앞쪽 벽(아래 한 줄)과 문틈, 두께
  b.rect(0,fb-T,W,T,"#ffb3cf");b.rect(0,fb-T,W,2,"#ffe3ee");b.rect(0,fb-2,W,2,"#e07aa4");
  b.rect(o.doorX,fb-T,32,T,"#ffe0ec");for(let y=fb-T;y<fb;y++)for(let x=o.doorX;x<o.doorX+32;x++)if(((x>>4)+(y>>4))&1)b.px(x,y,"#fff1f6");
  paint(b,M().rect(o.doorX+2,fb-12,o.doorX+30,fb-5),"#c98a6a","#7a4a38",{tex:(x,y)=>x%4<2?"#e0a888":null});
  for(let y=fb;y<H;y++)for(let x=0;x<W;x++)b.px(x,y,y<fb+2?"#c9a8e6":y<fb+5?"#e8a7c3":"#c98aaa");
  // 발판 러그
  const rug=M().ell(176,196,62,32,{fz:.02});paint(b,rug,"#e5d6fa","#a898c8",{tex:(x,y)=>{const dx=(x-176)/62,dy=(y-196)/32;const r=dx*dx+dy*dy;if(r>.62&&r<.7)return"#ffffff";return null;}});
  for(const[x,y]of[[150,190],[168,184],[186,192],[204,186],[160,206],[180,208],[196,204]])paw(b,x,y,"#ffffff");
  // 강아지 방석
  paint(b,M().ell(270,214,17,9),"#ffd0e2","#a8446e");paint(b,M().ell(270,212,12,6),"#fff3f8","#e0a0bc");
  return b.canvas();}
function groomTable(){const b=new Buf(52,40),M=MK(b);
  paint(b,M().rect(2,16,6,38),"#d8c8ee","#7a68a0");paint(b,M().rect(46,16,50,38),"#d8c8ee","#7a68a0");
  paint(b,M().rect(2,14,50,34),"#ffc2d8","#a8446e");heart(b,24,20,"#ffffff");paw(b,8,19,"#ffffff");paw(b,38,19,"#ffffff");
  paint(b,M().rect(0,6,52,16),"#e8f2ff","#7a8fb8");b.hline(2,8,48,"#ffffff");
  paint(b,M().rect(6,2,18,8),"#fff6b8","#b8861c");paint(b,M().rect(30,3,34,8),"#ff9fc0","#a8446e");b.px(40,4,"#c8d4e8");b.px(41,3,"#c8d4e8");b.px(40,6,"#c8d4e8");b.px(41,7,"#c8d4e8");
  return b.canvas();}
function tub(){const b=new Buf(66,48),M=MK(b);
  paint(b,M().rect(6,36,12,46),"#ffe066","#b8861c");paint(b,M().rect(54,36,60,46),"#ffe066","#b8861c");
  paint(b,M().rect(2,14,64,40).add(M().ell(33,40,31,6)),"#bfe3ff","#6aa8d8");
  paint(b,M().ell(33,15,29,5),"#e8f7ff","#6aa8d8");paint(b,M().ell(33,16,26,3.4),"#9fdcff","#6aa8d8");
  [[16,12],[26,9],[38,10],[47,12],[32,13],[21,14],[52,14]].forEach(([x,y],i)=>{paint(b,M().ell(x,y,3.4-i%2,3.2-i%2),"#ffffff","#8ab8e0");b.px(x-1,y-1,"#bfe3ff");});
  paint(b,M().rect(56,2,60,12).add(M().rect(50,2,60,5)),"#ffe066","#b8861c");heart(b,30,26,"#ffffff");return b.canvas();}
function sofa(){const b=new Buf(68,36),M=MK(b);
  paint(b,M().rect(2,4,66,22),"#ffb3cf","#a8446e");paint(b,M().rect(0,14,12,32),"#ff9fc0","#a8446e");paint(b,M().rect(56,14,68,32),"#ff9fc0","#a8446e");
  paint(b,M().rect(10,18,58,32),"#ffc2d8","#a8446e");b.vline(34,19,12,"#e0709c");
  paint(b,M().rect(6,32,10,36),"#c99a6b","#7a5238");paint(b,M().rect(58,32,62,36),"#c99a6b","#7a5238");heart(b,16,8,"#ffffff");heart(b,44,8,"#ffffff");return b.canvas();}
function plant(){const b=new Buf(22,34),M=MK(b);
  for(const[x,y,rx,ry]of[[11,10,5,9],[5,14,4,7],[17,14,4,7],[8,7,3.5,6],[14,7,3.5,6]])paint(b,M().ell(x,y,rx,ry),"#98e08f","#3f8a66");
  paint(b,M().rect(4,22,18,32).add(M().rect(3,21,19,24)),"#ffb3cf","#a8446e");heart(b,9,26,"#ffffff");return b.canvas();}
// ---------- 사람(원장님) 미니미 ----------
const SKIN="#ffe3d0",HAIR="#a5674a",EYEC="#3a2838";
function groomer(view,fr){const W=28,H=40,b=new Buf(W,H),M=MK(b),cx=14,bob=fr?1:0,gy=38;
  const shoe=(x)=>paint(b,M().rect(x,gy-3,x+5,gy),"#ffffff","#8a78b0");
  const body=()=>{paint(b,M().rect(cx-5,gy-14+bob*0,cx+5,gy-4),"#ffb3cf","#a8446e");paint(b,M().rect(cx-4,gy-12,cx+4,gy-4),"#ffffff","#b8a0c0");heart(b,cx-2,gy-11,"#ff9fc0");};
  if(view==="front"){shoe(cx-6);shoe(cx+1);paint(b,M().rect(cx-5,gy-6,cx+5,gy-3),"#9fb7e8","#5a6aa8");body();
    paint(b,M().rect(cx-8,gy-13,cx-5,gy-6),"#ffb3cf","#a8446e");paint(b,M().rect(cx+5,gy-13,cx+8,gy-6),"#ffb3cf","#a8446e");b.rect(cx-8,gy-6,3,2,SKIN);b.rect(cx+5,gy-6,3,2,SKIN);
    const hy=gy-23+bob;paint(b,M().ell(cx,hy-6,8.5,8.5,{fz:.05}),HAIR,"#6a3a2a");paint(b,M().ell(cx,hy-12,3.4,3),HAIR,"#6a3a2a");
    paint(b,M().ell(cx,hy,7.2,6.5),SKIN,"#b87a6a");
    const fr2=M();fr2.ell(cx,hy-5.5,7.6,5);fr2.sub(M().ell(cx,hy+1.5,6.2,6));paint(b,fr2,HAIR,"#6a3a2a",{line:null});
    for(const x of[cx-4,cx+2])for(let j=0;j<3;j++){b.px(x,hy-1+j,EYEC);b.px(x+1,hy-1+j,EYEC);}b.px(cx-4,hy-1,"#fff");b.px(cx+2,hy-1,"#fff");
    b.px(cx-6,hy+2,"#ffa0b8");b.px(cx-5,hy+2,"#ffa0b8");b.px(cx+4,hy+2,"#ffa0b8");b.px(cx+5,hy+2,"#ffa0b8");b.px(cx-1,hy+3,"#c0506a");b.px(cx,hy+3,"#c0506a");b.px(cx-2,hy+2,"#c0506a");b.px(cx+1,hy+2,"#c0506a");
    paint(b,M().rect(cx-3,hy-9,cx+3,hy-7),"#ff9fc0","#a8446e");}
  else if(view==="back"){shoe(cx-6);shoe(cx+1);paint(b,M().rect(cx-5,gy-6,cx+5,gy-3),"#9fb7e8","#5a6aa8");body();
    paint(b,M().rect(cx-8,gy-13,cx-5,gy-6),"#ffb3cf","#a8446e");paint(b,M().rect(cx+5,gy-13,cx+8,gy-6),"#ffb3cf","#a8446e");b.vline(cx,gy-12,8,"#e0709c");
    const hy=gy-23+bob;paint(b,M().ell(cx,hy-6,8.5,8.5,{fz:.05}),HAIR,"#6a3a2a");paint(b,M().ell(cx,hy-12,3.4,3),HAIR,"#6a3a2a");paint(b,M().ell(cx,hy,7.6,7.2),HAIR,"#6a3a2a");paint(b,M().rect(cx-3,hy-6,cx+3,hy-4),"#ff9fc0","#a8446e");}
  else{shoe(cx-3);paint(b,M().rect(cx-5,gy-6,cx+4,gy-3),"#9fb7e8","#5a6aa8");paint(b,M().rect(cx-5,gy-14,cx+4,gy-4),"#ffb3cf","#a8446e");paint(b,M().rect(cx-3,gy-12,cx+4,gy-4),"#ffffff","#b8a0c0");
    paint(b,M().rect(cx-1,gy-13,cx+3,gy-6),"#ffb3cf","#a8446e");b.rect(cx-1,gy-6,3,2,SKIN);
    const hy=gy-23+bob;paint(b,M().ell(cx-1,hy-6,8,8.5,{fz:.05}),HAIR,"#6a3a2a");paint(b,M().ell(cx-4,hy-12,3.4,3),HAIR,"#6a3a2a");
    paint(b,M().ell(cx+1,hy,6.6,6.5),SKIN,"#b87a6a");const f=M();f.ell(cx-1,hy-4,7.6,6);f.sub(M().ell(cx+3,hy+2,6,6));paint(b,f,HAIR,"#6a3a2a",{line:null});
    for(let j=0;j<3;j++){b.px(cx+4,hy-1+j,EYEC);b.px(cx+5,hy-1+j,EYEC);}b.px(cx+4,hy-1,"#fff");b.px(cx+2,hy+2,"#ffa0b8");b.px(cx+3,hy+2,"#ffa0b8");b.px(cx+6,hy+3,"#c0506a");
    paint(b,M().rect(cx-5,hy-9,cx-1,hy-7),"#ff9fc0","#a8446e");}
  return b.canvas();}
window.DaonArt={tree,bush,bench,fountain,board,fenceH,fenceV,fencePost,shop,outGround,inRoom,groomTable,tub,sofa,plant,groomer,flower,heart,sparkle,paw,text,textW};
})();
