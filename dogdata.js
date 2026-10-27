// 견종·미용스타일 목록 (브라우저 game.js/dogs.js 와 서버 server.js 가 같이 씁니다)
(function(root){
const BREEDS={
  maltese:{name:"말티즈",styles:["natural","teddy","highba","summer"]},
  poodle:{name:"푸들",styles:["broccoli","teddy","sporting","summer"]},
  pom:{name:"포메라니안",styles:["natural","teddy","highba","summer"]},
  bichon:{name:"비숑프리제",styles:["scissors","teddy","sporting","summer"]},
  shihtzu:{name:"시츄",styles:["natural","teddy","highba","summer"]},
  golden:{name:"골든리트리버",styles:["natural","hygiene","summer"]},
  corgi:{name:"웰시코기",styles:["hygiene","teddy","natural"]},
  schnauzer:{name:"슈나우저",styles:["schnauzer","teddy","sporting","summer"]},
};
const STYLES={
  natural:{name:"풀코트",desc:"자연스러운 장모"},
  teddy:{name:"곰돌이컷",desc:"얼굴·다리를 동글동글 가위컷"},
  highba:{name:"하이바컷",desc:"머리를 헬멧처럼 동그랗게"},
  broccoli:{name:"브로콜리컷",desc:"머리·귀를 브로콜리처럼 풍성하게"},
  sporting:{name:"스포팅컷",desc:"몸은 짧게, 다리·머리는 풍성하게"},
  scissors:{name:"비숑컷",desc:"가위컷 · 둥근 얼굴"},
  summer:{name:"썸머컷",desc:"전체 클리핑으로 시원하게"},
  hygiene:{name:"위생미용",desc:"자연모에 발·배 털만 정리"},
  schnauzer:{name:"슈나우저컷",desc:"수염·눈썹·다리털은 살리고 몸은 짧게"},
};
const api={BREEDS,STYLES,defaultStyle:b=>BREEDS[b].styles[0],validStyle:(b,s)=>!!BREEDS[b]&&BREEDS[b].styles.includes(s)};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DAON_DOGDATA=api;
})(typeof window!=="undefined"?window:globalThis);
