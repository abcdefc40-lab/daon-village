// 다온 마을 픽셀 도구: 마스크(모양) + 버퍼(색)로 코드에서 도트 그림을 그립니다. (그림 파일 없음)
(function(){
"use strict";
const TAU=Math.PI*2,C={};
function rgb(h){h=h.replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function pack(h){if(typeof h==="number")return h;let v=C[h];if(v===undefined){const[r,g,b]=rgb(h);v=C[h]=((255<<24)|(b<<16)|(g<<8)|r)>>>0;}return v;}
function mix(a,b,t){const A=rgb(a),B=rgb(b);return"#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("");}
function hash(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul((s|0)+7,2147483629))|0;h=Math.imul(h^(h>>>13),1274126177);return(((h^(h>>>16))>>>0)%100000)/100000;}
class Buf{
  constructor(w,h){this.w=w;this.h=h;this.d=new Uint32Array(w*h);}
  px(x,y,c){x|=0;y|=0;if(x<0||y<0||x>=this.w||y>=this.h)return;this.d[y*this.w+x]=pack(c);}
  rect(x,y,w,h,c){const p=pack(c);for(let j=Math.max(0,y|0);j<Math.min(this.h,(y|0)+h);j++)for(let i=Math.max(0,x|0);i<Math.min(this.w,(x|0)+w);i++)this.d[j*this.w+i]=p;}
  hline(x,y,w,c){this.rect(x,y,w,1,c);}
  vline(x,y,h,c){this.rect(x,y,1,h,c);}
  get(x,y){return this.d[y*this.w+x];}
  blit(o,x,y,flip){for(let j=0;j<o.h;j++)for(let i=0;i<o.w;i++){const v=o.d[j*o.w+(flip?o.w-1-i:i)];if(v>>>24)this.px(x+i,y+j,v);}}
  canvas(){const cv=document.createElement("canvas");cv.width=this.w;cv.height=this.h;cv.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(this.d.buffer.slice(0)),this.w,this.h),0,0);return cv;}
}
class Mask{
  constructor(w,h){this.w=w;this.h=h;this.d=new Uint8Array(w*h);}
  ell(cx,cy,rx,ry,o){o=o||{};const fz=o.fz||0,n=o.n||Math.max(5,Math.round((rx+ry)*1.1)),ph=o.ph||0;
    for(let y=Math.max(0,Math.floor(cy-ry-3));y<Math.min(this.h,Math.ceil(cy+ry+3));y++)for(let x=Math.max(0,Math.floor(cx-rx-3));x<Math.min(this.w,Math.ceil(cx+rx+3));x++){
      const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;let r=Math.sqrt(dx*dx+dy*dy),t=1;
      if(fz)t=1+fz*(Math.abs(Math.sin(Math.atan2(dy,dx)*n/2+ph))*2-1);
      if(r<=t)this.d[y*this.w+x]=1;}return this;}
  rect(x0,y0,x1,y1){for(let y=Math.max(0,Math.floor(y0));y<Math.min(this.h,Math.floor(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(this.w,Math.floor(x1));x++)this.d[y*this.w+x]=1;return this;}
  poly(p){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;p.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);});
    for(let y=Math.max(0,Math.floor(y0));y<Math.min(this.h,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(this.w,Math.ceil(x1));x++){
      const px=x+.5,py=y+.5;let ins=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[xi,yi]=p[i],[xj,yj]=p[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)ins=!ins;}
      if(ins)this.d[y*this.w+x]=1;}return this;}
  add(m){for(let i=0;i<this.d.length;i++)if(m.d[i])this.d[i]=1;return this;}
  sub(m){for(let i=0;i<this.d.length;i++)if(m.d[i])this.d[i]=0;return this;}
  clip(x0,y0,x1,y1){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(x<x0||x>=x1||y<y0||y>=y1)this.d[y*this.w+x]=0;return this;}
  has(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h&&this.d[y*this.w+x]===1;}
}
// 마스크를 버퍼에 칠합니다: 바깥 테두리 + 윗·왼쪽 밝은 줄 + 아래·오른쪽 그림자 줄
function part(b,m,o){const w=m.w,h=m.h,d=m.d,fill=pack(o.fill),li=o.light?pack(o.light):fill,sh=o.shade?pack(o.shade):fill;
  if(o.line){const lc=pack(o.line);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i]&&((x>0&&d[i-1])||(x<w-1&&d[i+1])||(y>0&&d[i-w])||(y<h-1&&d[i+w])))b.d[i]=lc;}}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i])continue;
    const up=y>0&&d[i-w],lf=x>0&&d[i-1],dn=y<h-1&&d[i+w],rt=x<w-1&&d[i+1];let c=fill;
    if(!up||!lf)c=li;if(!dn||!rt)c=(!up&&!dn)?fill:sh;
    if(o.flat)c=fill;
    if(o.tex){const t=o.tex(x,y,c);if(t!=null)c=pack(t);}
    b.d[i]=typeof c==="number"?c:pack(c);}}
window.DaonPix={Buf,Mask,part,mix,hash,pack,rgb,TAU};
})();
