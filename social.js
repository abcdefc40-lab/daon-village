// 다온 마을 v6: 상호작용 (감정표현 · 강아지끼리 놀기 · 원장님 심부름 · 방명록 · 미니룸 꾸미기 · 예약 문의)
// game.js 가 window.DaonX 에 내부 도구를 넣어 주고, 여기서 그 고리(hook)를 채웁니다. 그림은 전부 코드 도트.
(() => {
"use strict";
const X = window.DaonX, C = window.DAON_CONFIG, Pix = window.DaonPix, $ = id => document.getElementById(id);
const { P, others, Net, SCN, OUT, IN, T } = X;
const V6KEY = "daonV6";
// ---------- 도트 아이콘 (글자 그림 → 캔버스) ----------
function icon(rows, pal) { const h = rows.length, w = rows[0].length, b = new Pix.Buf(w, h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) b.px(x, y, pal[ch]); })); return b.canvas(); }
const ICON = {
  heart: icon([".oo.oo.", "ohhohho", "ohwhhho", "ohhhhho", ".ohhho.", "..oho..", "...o..."], { o: "#c4407a", h: "#ff7fb5", w: "#ffffff" }),
  paw: icon(["..o.o..", ".oho ho".replace(" ", "o"), ".ooooo.", "o.ooo.o", ".ohhho.", ".ohhho.", "..ooo.."].map(r => r.padEnd(7, ".").slice(0, 7)), { o: "#a8446e", h: "#ffb3cf" }),
  bone: icon([".oo...oo.", "ohhoooohho", "ohhhhhhhho", "ohhoooohho", ".oo...oo."].map(r => r.padEnd(10, ".")), { o: "#a07a52", h: "#fff6e0" }),
  ball: icon([".ooo.", "oyyyo", "owyyo", "oyyyo", ".ooo."], { o: "#6a9a2a", y: "#d6f05a", w: "#ffffff" }),
  note: icon(["..oo", "..oh", "..o.", ".oo.", "ooo.", ".o.."], { o: "#6a58a8", h: "#a58bdc" }),
  spark: icon(["..o..", "..o..", "ooooo", "..o..", "..o.."], { o: "#ffe066" }),
  wag: icon(["o..", ".o.", "..o", ".o.", "o.."], { o: "#ff86b8" }),
  bubble: icon(["..oooooo..", ".owwwwwwo.", "owwwwwwwwo", "owwwwwwwwo", ".owwwwwwo.", "..ooowooo.", "....oo....", "...o......"], { o: "#74a9ec", w: "#ffffff" }),
};
X.EMDUR = { sit: 6000, wag: 2600, heart: 2600, bark: 1600, eat: 2400, greet: 2200 };
const EMO = [["sit", "🪑", "앉아", "1"], ["wag", "〰️", "꼬리 흔들기", "2"], ["heart", "💗", "하트", "3"], ["bark", "🐕", "멍멍!", "4"]];
function setEm(a, k) { if (!a) return; a.em = k; a.emT = performance.now(); }
function emote(k) { if (!X.isStarted()) return; setEm(P, k); if (Net.online) Net.send({ t: "emote", k }); hideEmoMenu(); }
// ---------- 저장 (간식 · 퀘스트 · 미니룸) ----------
let S6 = { treats: 0, q: {}, greeted: [], room: null, eaten: 0 };
try { Object.assign(S6, JSON.parse(localStorage.getItem(V6KEY) || "{}")); } catch {}
const save6 = () => { try { localStorage.setItem(V6KEY, JSON.stringify(S6)); } catch {} updTools(); };
// ---------- 숨겨진 뼈다귀 · 방명록 책상 ----------
const BONE_AT = [[31, 21], [4, 21], [30, 10], [5, 9]].find(([x, y]) => X.walk(OUT, x, y)) || [20, 20];
const GBD = { x: 18, y: 13 };
(function gbDesk() { const b = new Pix.Buf(28, 30), M = () => new Pix.Mask(28, 30);
  Pix.part(b, M().rect(4, 16, 7, 30), { fill: "#c99a6b", line: "#7a5238" }); Pix.part(b, M().rect(21, 16, 24, 30), { fill: "#c99a6b", line: "#7a5238" });
  Pix.part(b, M().rect(1, 12, 27, 18), { fill: "#ffc2d8", light: "#ffe0ee", shade: "#e79bb9", line: "#a05a82" });
  Pix.part(b, M().rect(5, 3, 23, 13), { fill: "#ffffff", shade: "#f0e6ff", line: "#8a78b0" }); b.vline(14, 3, 10, "#c5b4e8");
  for (let i = 0; i < 3; i++) { b.hline(7, 6 + i * 2, 5, "#b0a0d8"); b.hline(16, 6 + i * 2, 5, "#b0a0d8"); }
  b.px(24, 2, "#ff7fb5"); b.px(25, 1, "#ff7fb5"); b.vline(23, 3, 8, "#5a4a80");
  IN.sprites.push({ cv: b.canvas(), x: GBD.x * T + 8 - 14, y: (GBD.y + 1) * T - 30, sy: (GBD.y + 1) * T }); IN.grid[GBD.y * IN.cols + GBD.x] = 1; })();
// ---------- 공 놀이 ----------
const balls = new Map(); let carry = new Map(); // bid → ball, actor id → until
const actorById = id => id === Net.id || id === "me" ? P : others.get(id);
function throwBall() { if (!X.isStarted() || X.isUi()) return; const S = SCN[P.scene], [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir];
  let tx = P.tx, ty = P.ty; for (let i = 0; i < 5; i++) { if (!X.walk(S, tx + dx, ty + dy) || S.isDoor(tx + dx, ty + dy)) break; tx += dx; ty += dy; }
  if (tx === P.tx && ty === P.ty) { X.sys("앞이 막혀서 공을 던질 수 없어요."); return; }
  carry.delete(myId()); S6.thrown = (S6.thrown || 0) + 1; save6();
  if (Net.online) Net.send({ t: "ball", tx, ty }); else addBall({ bid: "L" + Date.now(), id: "me", scene: P.scene, fx: P.tx, fy: P.ty, tx, ty }); }
const myId = () => Net.online ? Net.id : "me";
function addBall(b) { for (const [k, o] of balls) if (o.id === b.id) balls.delete(k); b.t0 = performance.now(); balls.set(b.bid, b); const a = actorById(b.id); if (a) setEm(a, "wag");
  if (b.id === myId()) setTimeout(() => { if (balls.has(b.bid) && P.scene === b.scene) X.setPath(X.findPath(SCN[P.scene], P.tx, P.ty, b.tx, b.ty)); }, 750); }
function tryPick() { const now = performance.now();
  for (const b of balls.values()) if (b.scene === P.scene && now - b.t0 > 700 && Math.abs(b.tx - P.tx) + Math.abs(b.ty - P.ty) <= 0) {
    if (Net.online) Net.send({ t: "pick", bid: b.bid }); else picked({ bid: b.bid, id: "me" }); return; } }
function picked(m) { const b = balls.get(m.bid); balls.delete(m.bid); if (!m.id) return; const a = actorById(m.id); if (!a) return;
  carry.set(m.id, performance.now() + 8000); setEm(a, "wag");
  if (a === P) { X.bubble(P, "공 잡았다! 🎾"); if (b && b.id === myId()) S6.fetched = (S6.fetched || 0) + 1; if (b && b.id !== myId()) X.sys("다른 친구의 공을 먼저 잡았어요!"); questCheck(); save6(); }
  else if (m.nick) X.sys(`${m.nick} 님이 공을 잡았어요! 🎾`); }
// ---------- 인사 · 같이 걷기 ----------
let nearDog = null, follow = 0; const pairs = new Map(); // follower → leader
function findNearDog() { let best = null, bd = 3; for (const o of others.values()) if (o.scene === P.scene) { const d = Math.abs(o.tx - P.tx) + Math.abs(o.ty - P.ty); if (d < bd) { bd = d; best = o; } } return best; }
function greet(o) { o = o || nearDog; if (!o) { X.sys("가까이(2칸 안)에 있는 강아지에게 인사할 수 있어요."); return; } if (!Net.online) return; P.dir = X.faceTo(P, o); Net.move(); Net.send({ t: "greet", to: o.id }); X.closeAll(); }
function askFollow(o) { o = o || nearDog; if (!o || !Net.online) { X.sys("가까이 있는 친구에게 산책을 신청할 수 있어요."); return; } Net.send({ t: "followReq", to: o.id }); X.sys(`${o.nick} 님에게 같이 걷자고 신청했어요. 수락하면 뒤따라 걸어요.`); X.closeAll(); }
function stopFollow() { if (Net.online) Net.send({ t: "unfollow" }); follow = 0; pairs.delete(myId()); updTools(); }
function friendMenu(o) { o = o || nearDog; if (!o) return;
  X.say(`${o.nick} (${window.DAON_DOGDATA.BREEDS[o.breed]?.name || ""}) 에게 무엇을 할까요?`, [["👋 인사하기 (G)", () => greet(o)], ["🐾 같이 걷자 (F)", () => askFollow(o)], ["🏠 미니룸 놀러가기", () => visitRoom(o.id)], ["닫기", X.closeAll]], "🐶 " + o.nick); }
// ---------- 원장님 심부름 ----------
const QUESTS = [
  { id: "fountain", name: "분수대 구경하기", desc: "마을 왼쪽 분수대 옆까지 가 보세요.", reward: 3 },
  { id: "greet3", name: "친구 3마리에게 인사", desc: "다른 강아지 가까이에서 G(👋)로 인사해요. 서로 다른 친구 3마리!", reward: 5 },
  { id: "bone", name: "숨겨진 뼈다귀 찾기", desc: "마을 어딘가 풀숲 구석에 뼈다귀가 숨어 있대요. 반짝이는 곳을 찾아보세요!", reward: 5 },
  { id: "fetch", name: "공 던지고 물어오기", desc: "B(🎾)로 공을 던지고 직접 물어 와요.", reward: 2 },
];
const qs = id => S6.q[id] || "none";
function questCheck() { let ch = false; const done = id => { if (qs(id) === "active") { S6.q[id] = "done"; ch = true; X.sys(`🎁 '${QUESTS.find(q => q.id === id).name}' 완료! 원장님께 알려 드리세요.`); X.banner("심부름 완료!"); } };
  if (P.scene === "out" && Math.abs(P.tx - (X.fountainAt.x + .5)) <= 2.5 && Math.abs(P.ty - (X.fountainAt.y + .5)) <= 2.5) done("fountain");
  if (S6.greeted.length >= 3) done("greet3");
  if (P.scene === "out" && P.tx === BONE_AT[0] && P.ty === BONE_AT[1] && qs("bone") === "active") { X.bubble(P, "뼈다귀 찾았다! 🦴"); setEm(P, "wag"); done("bone"); }
  if ((S6.fetched || 0) > (S6.fetchBase || 0)) done("fetch");
  if (ch) save6(); }
function questMenu() { const lines = QUESTS.map(q => { const s = qs(q.id); return `${s === "claimed" ? "✅" : s === "done" ? "🎉" : s === "active" ? "▶" : "○"} ${q.name} — 간식 ${q.reward}개${s === "active" ? `\n    ${q.desc}${q.id === "greet3" ? ` (${S6.greeted.length}/3)` : ""}` : ""}`; }).join("\n");
  const ch = [];
  QUESTS.forEach(q => { const s = qs(q.id);
    if (s === "none") ch.push([`▶ ${q.name}`, () => { S6.q[q.id] = "active"; if (q.id === "greet3") S6.greeted = []; if (q.id === "fetch") S6.fetchBase = S6.fetched || 0; save6(); questCheck(); X.say(`좋아요! ${q.desc}\n다 하면 저에게 다시 와 주세요 ✂️`, [["심부름 목록", questMenu], ["닫기", X.closeAll]]); }]);
    if (s === "done") ch.push([`🎁 보상 받기: ${q.name}`, () => claim(q)]); });
  if (QUESTS.every(q => qs(q.id) === "claimed")) ch.push(["🔄 처음부터 다시", () => { S6.q = {}; S6.greeted = []; save6(); questMenu(); }]);
  ch.push(["닫기", X.closeAll]);
  X.say(`심부름을 해 주면 맛있는 간식을 줄게요! (지금 간식 🦴 ${S6.treats}개)\n${lines}`, ch); }
function claim(q) { const atSalon = P.scene === "in" && Math.abs(P.tx - IN.npc.tx) + Math.abs(P.ty - IN.npc.ty) <= 4;
  if (!atSalon) { X.say("보상은 미용실 안 원장님께 직접 받아요! 살롱으로 와 주세요.", [["닫기", X.closeAll]]); return; }
  S6.q[q.id] = "claimed"; S6.treats += q.reward; save6(); X.banner(`간식 +${q.reward} 🦴`); X.say(`수고했어요! 간식 ${q.reward}개 받아요 🦴\n'🦴 간식' 버튼(T)을 누르면 냠냠 먹어요.`, [["심부름 목록", questMenu], ["닫기", X.closeAll]]); }
function eatTreat() { if (!X.isStarted()) return; if (S6.treats <= 0) { X.sys("간식이 없어요. 원장님 심부름을 하면 받을 수 있어요!"); return; }
  S6.treats--; S6.eaten = (S6.eaten || 0) + 1; save6(); emote("eat"); X.bubble(P, "냠냠 맛있다! 🦴"); }
// ---------- 미니룸 꾸미기 ----------
const RW = 12, RH = 8, WALL = 2;
const FURN = { bed: ["침대", 2], sofa: ["소파", 2], table: ["탁자", 1], plant: ["화분", 1], lamp: ["스탠드", 1], rug: ["러그", 2], tv: ["TV", 1], bowl: ["밥그릇", 1], shelf: ["책장", 1], frame: ["액자", 1, 1], cushion: ["방석", 1], toy: ["장난감", 1], window: ["창문", 2, 1], clock: ["시계", 1, 1], house: ["강아지집", 2], flower: ["꽃병", 1] };
const FIMG = {};
function furnArt() { const P2 = (b, m, f, l) => Pix.part(b, m, { fill: f, light: Pix.mix(f, "#ffffff", .5), shade: Pix.mix(f, "#8a5aa0", .2), line: l || Pix.mix(f, "#5a3a6a", .5) });
  const mk = (w, h, fn) => { const b = new Pix.Buf(w, h), M = () => new Pix.Mask(w, h); fn(b, M); return b.canvas(); };
  FIMG.bed = mk(32, 24, (b, M) => { P2(b, M().rect(1, 4, 9, 23), "#d5a574"); P2(b, M().rect(3, 10, 31, 22), "#ffffff"); P2(b, M().rect(12, 11, 31, 21), "#ffb3cf"); P2(b, M().ell(7, 13, 4, 2.5), "#cfeeff"); });
  FIMG.sofa = mk(32, 22, (b, M) => { P2(b, M().rect(2, 3, 30, 13), "#9ec8ff"); P2(b, M().rect(1, 11, 31, 19), "#b8d8ff"); P2(b, M().rect(0, 8, 5, 20), "#9ec8ff"); P2(b, M().rect(27, 8, 32, 20), "#9ec8ff"); b.px(16, 7, "#fff"); });
  FIMG.table = mk(16, 16, (b, M) => { P2(b, M().rect(3, 9, 5, 16), "#c99a6b"); P2(b, M().rect(11, 9, 13, 16), "#c99a6b"); P2(b, M().ell(8, 7, 7.5, 3.5), "#ecc79a"); P2(b, M().rect(6, 2, 10, 6), "#ffffff"); });
  FIMG.plant = mk(16, 24, (b, M) => { P2(b, M().ell(8, 8, 6, 7, { fz: .2, n: 7 }), "#92dc8b", "#3f8a66"); P2(b, M().rect(4, 14, 12, 23), "#ff9fc0", "#a8446e"); });
  FIMG.lamp = mk(16, 26, (b, M) => { P2(b, M().poly([[3, 10], [6, 1], [10, 1], [13, 10]]), "#fff6b8", "#b8861c"); P2(b, M().rect(7, 10, 9, 23), "#a58bdc"); P2(b, M().ell(8, 23, 5, 2), "#a58bdc"); });
  FIMG.rug = mk(32, 14, (b, M) => { P2(b, M().ell(16, 7, 15, 6), "#ffd0e2", "#e0709c"); P2(b, M().ell(16, 7, 10, 3.5), "#ffffff", "#ff9fc0"); });
  FIMG.tv = mk(16, 20, (b, M) => { P2(b, M().rect(1, 2, 15, 13), "#6a58a8"); P2(b, M().rect(3, 4, 13, 11), "#9fdcff"); b.px(5, 5, "#fff"); P2(b, M().rect(5, 13, 11, 20), "#c99a6b"); });
  FIMG.bowl = mk(16, 10, (b, M) => { P2(b, M().ell(8, 6, 7, 3.5), "#ff86b8"); P2(b, M().ell(8, 4.5, 5, 1.6), "#c8915a"); });
  FIMG.shelf = mk(16, 30, (b, M) => { P2(b, M().rect(1, 1, 15, 30), "#d5a574"); for (const y of [9, 18]) b.hline(2, y, 12, "#8a5f48"); ["#ff9fc0", "#9ec8ff", "#ffe066", "#a5e0a0"].forEach((c, i) => { b.rect(3 + i * 3, 4, 2, 5, c); b.rect(3 + i * 3, 13, 2, 5, c); }); });
  FIMG.frame = mk(14, 12, (b, M) => { P2(b, M().rect(0, 0, 14, 12), "#ffe066", "#b8861c"); P2(b, M().rect(2, 2, 12, 10), "#cfeeff"); b.rect(3, 7, 8, 3, "#a5e0a0"); b.px(9, 4, "#ff7fb5"); });
  FIMG.cushion = mk(16, 10, (b, M) => { P2(b, M().ell(8, 5, 7.5, 4.2), "#c6a4ff"); b.px(8, 4, "#fff"); });
  FIMG.toy = mk(14, 10, (b, M) => { b.px(3, 6, "#000"); const k = ICON.bone; P2(b, M().ell(4, 6, 3.5, 3.5), "#ffe066"); P2(b, M().ell(10, 6, 3, 3), "#9ec8ff"); });
  FIMG.window = mk(30, 18, (b, M) => { P2(b, M().rect(0, 0, 30, 18), "#ffffff", "#8a78b0"); P2(b, M().rect(2, 2, 14, 16), "#bfe3ff"); P2(b, M().rect(16, 2, 28, 16), "#bfe3ff"); b.rect(4, 4, 4, 2, "#fff"); b.rect(19, 9, 5, 2, "#fff"); });
  FIMG.clock = mk(12, 12, (b, M) => { P2(b, M().ell(6, 6, 5.6, 5.6), "#ffffff", "#e0709c"); b.vline(6, 3, 4, "#5a4a80"); b.hline(6, 6, 3, "#5a4a80"); });
  FIMG.house = mk(32, 28, (b, M) => { P2(b, M().rect(3, 10, 29, 28), "#ffe3cf", "#a8704f"); P2(b, M().poly([[0, 12], [16, 0], [32, 12]]), "#ff9fc0", "#a8446e"); P2(b, M().ell(16, 22, 6, 6).rect(10, 22, 22, 28), "#7a5a80"); });
  FIMG.flower = mk(12, 20, (b, M) => { P2(b, M().rect(3, 10, 9, 20), "#9ec8ff"); [[3, 4, "#ff7fb5"], [8, 3, "#ffe066"], [6, 7, "#ffffff"]].forEach(([x, y, c]) => { b.rect(x - 1, y - 1, 3, 3, c); }); b.vline(6, 8, 3, "#6fbf73"); });
}
furnArt();
const DEFAULT_ROOM = [["window", 5, 0], ["rug", 5, 5], ["bed", 1, 3], ["plant", 10, 3], ["bowl", 8, 6]];
let roomItems = Array.isArray(S6.room) ? S6.room : DEFAULT_ROOM.map(i => i.slice()), roomSel = null, roomPick = null, roomView = null; // roomView: 남의 방 {nick,items,breed,style}
function roomCanvas(cv, items, owner, sel) { const W = RW * 16, H = RH * 16, x = cv.getContext("2d"); cv.width = W; cv.height = H; x.imageSmoothingEnabled = false;
  const b = new Pix.Buf(W, H);
  for (let y = 0; y < WALL * 16; y++) for (let i = 0; i < W; i++) b.px(i, y, ((i >> 3) + (y >> 3)) & 1 ? "#ffe6f2" : "#fff3f9");
  for (let i = 0; i < W; i += 16) for (let j = 4; j < WALL * 16; j += 16) { b.px(i + 7, j + 4, "#ffb3cf"); b.px(i + 6, j + 3, "#ffb3cf"); b.px(i + 8, j + 3, "#ffb3cf"); }
  b.hline(0, WALL * 16 - 2, W, "#ff9fc0"); b.hline(0, WALL * 16 - 1, W, "#e0709c");
  for (let y = WALL * 16; y < H; y++) for (let i = 0; i < W; i++) b.px(i, y, (y - WALL * 16) % 8 === 0 ? "#e2b794" : ((i + ((y >> 3) & 1) * 8) % 16 === 0 ? "#e2b794" : "#f3d3b8"));
  x.drawImage(b.canvas(), 0, 0);
  const list = items.map((it, i) => ({ it, i, wall: !!FURN[it[0]][2], y: it[2] })).sort((a, c) => (a.wall === c.wall ? 0 : a.wall ? -1 : 1) || (FURN[a.it[0]][0] === "러그" ? -1 : 0) - (FURN[c.it[0]][0] === "러그" ? -1 : 0) || a.y - c.y);
  const drawIt = ({ it, i }) => { const im = FIMG[it[0]], fw = FURN[it[0]][1] * 16, px = it[1] * 16 + Math.round((fw - im.width) / 2), py = (it[2] + 1) * 16 - im.height;
    x.drawImage(im, px, py); if (sel === i) { x.strokeStyle = "#ff3d8b"; x.lineWidth = 1; x.setLineDash([2, 1]); x.strokeRect(it[1] * 16 + .5, it[2] * 16 + .5, fw - 1, 15); x.setLineDash([]); } };
  list.filter(l => l.wall || it0(l) === "rug").forEach(drawIt);
  const dogY = 5; let dogDrawn = false; const dog = () => { if (dogDrawn || !owner) return; dogDrawn = true; const sp = DaonDog.render(owner.breed, owner.style, "front", -1 - (Math.floor(performance.now() / 900) % 2)); x.drawImage(sp, 6 * 16 - 20 + 8, (dogY + 1) * 16 - DaonDog.GY - 2); };
  list.filter(l => !l.wall && it0(l) !== "rug").forEach(l => { if (l.y > dogY) dog(); drawIt(l); }); dog(); }
const it0 = l => l.it[0];
function openRoom(view) { X.closeAll(); roomView = view || null; X.setUi(true); $("room").classList.remove("hidden"); roomSel = null; roomPick = null;
  $("roomTitle").textContent = roomView ? `🏠 ${roomView.nick} 님의 미니룸 (구경 중)` : `🏠 ${P.nick} 님의 미니룸`;
  $("roomTools").classList.toggle("hidden", !!roomView); $("roomVisit").classList.toggle("hidden", !!roomView);
  buildPalette(); drawRoom(); buildVisitList(); }
function drawRoom() { if ($("room").classList.contains("hidden")) return; const v = roomView;
  roomCanvas($("roomCv"), v ? v.items : roomItems, v ? v : P, v ? null : roomSel);
  $("roomHint").textContent = v ? "다른 친구 방은 구경만 할 수 있어요." : roomPick ? `'${FURN[roomPick][0]}' 을(를) 놓을 칸을 눌러요.` : roomSel != null ? "옮길 칸을 누르거나 🗑 치우기를 눌러요." : "아래에서 가구를 고르고 방을 눌러 놓아요. 놓인 가구를 누르면 옮기거나 치울 수 있어요."; }
function buildPalette() { const p = $("palette"); p.innerHTML = ""; for (const k in FURN) { const d = document.createElement("button"); d.className = "pal" + (roomPick === k ? " sel" : ""); d.dataset.k = k; const c = document.createElement("canvas"); c.width = FIMG[k].width; c.height = FIMG[k].height; c.getContext("2d").drawImage(FIMG[k], 0, 0); const s = document.createElement("span"); s.textContent = FURN[k][0]; d.append(c, s);
  d.onclick = () => { roomPick = roomPick === k ? null : k; roomSel = null; buildPalette(); drawRoom(); }; p.append(d); } }
function itemAt(tx, ty) { for (let i = roomItems.length - 1; i >= 0; i--) { const it = roomItems[i], w = FURN[it[0]][1]; if (ty === it[2] && tx >= it[1] && tx < it[1] + w) return i; } return -1; }
function fits(k, tx, ty) { const wall = !!FURN[k][2], w = FURN[k][1]; return tx >= 0 && tx + w <= RW && (wall ? ty >= 0 && ty < WALL : ty >= WALL && ty < RH); }
function roomTap(e) { if (roomView) return; const cv = $("roomCv"), r = cv.getBoundingClientRect(), tx = Math.floor((e.clientX - r.left) / r.width * RW), ty = Math.floor((e.clientY - r.top) / r.height * RH);
  if (roomPick) { if (!fits(roomPick, tx, ty)) { X.sys(FURN[roomPick][2] ? "벽에 거는 물건은 위쪽 벽에 놓아요." : "바닥(아래쪽)에 놓아요."); return; } if (roomItems.length >= 40) { X.sys("가구는 40개까지 놓을 수 있어요."); return; } roomItems.push([roomPick, tx, ty]); saveRoom(); }
  else { const i = itemAt(tx, ty); if (i >= 0 && i !== roomSel) roomSel = i; else if (roomSel != null) { const it = roomItems[roomSel]; if (fits(it[0], tx, ty)) { it[1] = tx; it[2] = ty; saveRoom(); } roomSel = null; } }
  drawRoom(); }
function saveRoom() { S6.room = roomItems; save6(); if (Net.online) Net.send({ t: "room", items: roomItems }); }
function buildVisitList() { const box = $("visitList"); box.innerHTML = ""; const list = [...others.values()];
  if (!Net.online || !list.length) { box.textContent = Net.online ? "지금 접속한 친구가 없어요." : "혼자 모드에선 놀러갈 수 없어요."; return; }
  list.forEach(o => { const b = document.createElement("button"); b.textContent = "🏠 " + o.nick; b.onclick = () => visitRoom(o.id); box.append(b); }); }
function visitRoom(id) { if (!Net.online) return; Net.send({ t: "getRoom", id }); }
// ---------- 방명록 · 일촌평 ----------
let gbTab = "gb", adminKey = "", gbCache = [];
async function loadGB() { if (location.protocol === "file:") { $("gbList").textContent = "서버에 접속했을 때만 방명록을 볼 수 있어요."; return; }
  try { const r = await fetch("api/guestbook"), j = await r.json(); gbCache = j.entries || []; $("gbAdmin").classList.toggle("hidden", !j.admin); renderGB(); } catch { $("gbList").textContent = "방명록을 불러오지 못했어요."; } }
function renderGB() { const L = $("gbList"), list = gbCache.filter(e => e.kind === gbTab);
  // 서버가 이미 HTML 이스케이프한 글자만 들어와요(nick/text). 날짜·견종도 숫자/허용 목록이라 안전.
  L.innerHTML = list.length ? list.map(e => `<div class="gbe ${e.kind}"><div class="gbh"><b>${e.nick}</b> <span>${new Date(e.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>${adminKey ? `<button class="del" data-id="${String(e.id).replace(/[^0-9a-f]/g, "")}">삭제</button>` : ""}</div><div class="gbt">${e.text}</div></div>`).join("") : `<p class="empty">${gbTab === "gb" ? "첫 방명록을 남겨 주세요 ✍️" : "첫 일촌평을 남겨 주세요 💌"}</p>`;
  L.querySelectorAll(".del").forEach(b => b.onclick = () => delGB(b.dataset.id));
  $("gbText").maxLength = gbTab === "gb" ? 200 : 40; $("gbText").placeholder = gbTab === "gb" ? "방명록 남기기 (200자)" : "일촌평 한마디 (40자)";
  document.querySelectorAll(".gbtab").forEach(b => b.classList.toggle("sel", b.dataset.k === gbTab)); }
async function postGB(e) { e.preventDefault(); const text = $("gbText").value.trim(); if (!text) return;
  try { const r = await fetch("api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: gbTab, nick: P.nick, text, breed: P.breed }) }), j = await r.json();
    if (!r.ok || j.error) { $("gbMsg").textContent = j.error || "남기지 못했어요."; return; } $("gbText").value = ""; $("gbMsg").textContent = "남겼어요! 💗"; setEm(P, "heart"); if (Net.online) Net.send({ t: "emote", k: "heart" }); loadGB(); } catch { $("gbMsg").textContent = "서버에 연결할 수 없어요."; } }
async function delGB(id) { if (!adminKey) return; try { const r = await fetch("api/guestbook/" + id, { method: "DELETE", headers: { "X-Admin-Key": adminKey } }); const j = await r.json(); if (j.error) { adminKey = ""; $("gbMsg").textContent = "관리자 키가 맞지 않아요."; } loadGB(); } catch {} }
function openGB() { X.closeAll(); X.setUi(true); $("gb").classList.remove("hidden"); $("gbMsg").textContent = ""; loadGB(); renderGB(); }
// ---------- 예약 문의 ----------
const linkReady = () => { const l = (C.board.contactLink || "").trim(); return l && l !== "#" && /^https?:\/\//.test(l); };
function reserve() { if (linkReady()) { window.open(C.board.contactLink, "_blank", "noopener"); return; }
  X.say(`📅 예약 문의 링크는 아직 준비 중이에요. (자리표시자)\n${C.reservationHowTo}\n인스타그램: ${C.shop.instagram}`, [["📌 게시판 보기", () => { X.closeAll(); window.__daon.openBoard(); }], ["닫기", X.closeAll]], "📅 예약 문의"); }
X.boardExtra = () => { document.querySelectorAll("#notices li").forEach((li, i) => { const n = C.board.notices[i]; if (n && (n.placeholder || /예시/.test(n.date + n.text))) { const s = document.createElement("span"); s.className = "ph"; s.textContent = "자리표시자"; li.prepend(s); } });
  const c = $("contact"); c.onclick = e => { if (!linkReady()) { e.preventDefault(); reserve(); } }; c.textContent = linkReady() ? "📅 예약 문의하기" : "📅 예약 문의하기 (링크 준비 중)"; };
// ---------- 도구 버튼 ----------
function hideEmoMenu() { $("emoMenu").classList.add("hidden"); }
function updTools() { const tb = $("treatBtn"); if (tb) tb.querySelector("b").textContent = S6.treats; const fc = $("followChip"); if (fc) { const l = follow && others.get(follow); fc.classList.toggle("hidden", !follow); if (l) fc.querySelector("span").textContent = `🐾 ${l.nick} 님과 산책 중`; } }
function wire() {
  $("emoBtn").onclick = () => $("emoMenu").classList.toggle("hidden");
  $("emoMenu").innerHTML = EMO.map(([k, ic, n, h]) => `<button data-k="${k}">${ic} ${n} <kbd>${h}</kbd></button>`).join("") + `<p class="tiny">G 인사 · F 같이 걷기 · B 공 · T 간식 · R 미니룸 · Q 심부름</p>`;
  $("emoMenu").querySelectorAll("button").forEach(b => b.onclick = () => emote(b.dataset.k));
  $("ballBtn").onclick = throwBall; $("treatBtn").onclick = eatTreat; $("questBtn").onclick = () => { X.closeAll(); questMenu(); }; $("roomBtn").onclick = () => openRoom();
  $("gbBtn").onclick = openGB; $("resvBtn").onclick = () => { X.closeAll(); reserve(); }; $("friendBtn").onclick = () => friendMenu();
  $("followChip").querySelector("button").onclick = stopFollow;
  $("roomCv").addEventListener("pointerdown", roomTap); $("roomDel").onclick = () => { if (roomSel != null) { roomItems.splice(roomSel, 1); roomSel = null; saveRoom(); drawRoom(); } };
  $("roomReset").onclick = () => { roomItems = DEFAULT_ROOM.map(i => i.slice()); roomSel = null; saveRoom(); drawRoom(); };
  $("roomClose").onclick = () => X.closeAll(); $("roomMine").onclick = () => openRoom();
  $("gbClose").onclick = () => X.closeAll(); $("gbForm").onsubmit = postGB;
  document.querySelectorAll(".gbtab").forEach(b => b.onclick = () => { gbTab = b.dataset.k; renderGB(); });
  $("gbAdmin").onclick = () => { if (adminKey) { adminKey = ""; renderGB(); return; } const k = prompt("관리자 키를 입력하세요 (이 창에만 잠시 기억해요)"); if (k) { adminKey = k; renderGB(); $("gbMsg").textContent = "관리 모드: 지울 글의 '삭제'를 누르세요."; } };
  ["gbText"].forEach(id => { $(id).onfocus = () => { }; });
  updTools(); }
wire();
setInterval(() => { if (!$("room").classList.contains("hidden")) drawRoom(); }, 450);
X.closeAll = () => { ["room", "gb"].forEach(i => $(i).classList.add("hidden")); hideEmoMenu(); roomView = null; };
X.questMenu = questMenu; X.openGB = openGB;
X.start = () => { $("tools").classList.remove("hidden"); updTools(); };
// ---------- 키 ----------
X.key = (k, e) => { if (e.repeat) return false; const m = { "1": "sit", "2": "wag", "3": "heart", "4": "bark" }[k];
  if (m) { emote(m); return true; } if (k === "g") { greet(); return true; } if (k === "f") { askFollow(); return true; } if (k === "b") { throwBall(); return true; }
  if (k === "t") { eatTreat(); return true; } if (k === "r") { openRoom(); return true; } if (k === "q") { questMenu(); return true; } return false; };
// ---------- 매 프레임 ----------
let lastNear = null;
X.update = () => { nearDog = findNearDog(); if (nearDog !== lastNear) { lastNear = nearDog; $("friendBtn").classList.toggle("hidden", !nearDog); }
  if (follow) { const l = others.get(follow); if (!l) { follow = 0; updTools(); return; }
    if (l.scene !== P.scene) { const S = SCN[l.scene]; X.place(P, S, S.spawn.x, S.spawn.y, S.spawn.dir); X.setPath([]); Net.move(); X.banner(S.name); return; }
    const d = Math.abs(l.tx - P.tx) + Math.abs(l.ty - P.ty); if (d > 1 && !X.wantedDir() && X.getPath().length === 0) { const p = X.findPath(SCN[P.scene], P.tx, P.ty, l.fx, l.fy); if (p.length && p.length < 30) X.setPath(p); } } };
X.arrive = () => { tryPick(); questCheck(); };
// ---------- 네트워크 ----------
X.net = m => { const me = Net.id;
  if (m.t === "welcome") { balls.clear(); (m.balls || []).forEach(b => { b.t0 = 0; balls.set(b.bid, b); }); pairs.clear(); for (const o of m.players || []) if (o.lead) pairs.set(o.id, o.lead); if (roomItems.length) Net.send({ t: "room", items: roomItems }); }
  else if (m.t === "offline") { follow = 0; pairs.clear(); for (const [k, b] of balls) if (!String(k).startsWith("L")) balls.delete(k); updTools(); }
  else if (m.t === "leave") { pairs.delete(m.id); for (const [f, l] of pairs) if (l === m.id) pairs.delete(f); }
  else if (m.t === "emote") { if (m.id !== me) setEm(others.get(m.id), m.k); }
  else if (m.t === "greet") { const a = actorById(m.a), b = actorById(m.b); setEm(a, "greet"); setEm(b, "greet"); if (a && b) { a.dir = X.faceTo(a, b); b.dir = X.faceTo(b, a); }
    if (m.a === me || m.b === me) { const other = m.a === me ? m.b : m.a; X.sys(`${m.a === me ? m.bn : m.an} 님과 반갑게 인사했어요! 🐾`); if (!S6.greeted.includes(other)) { S6.greeted.push(other); S6.greeted = S6.greeted.slice(-20); save6(); } questCheck(); } }
  else if (m.t === "ball") addBall(m);
  else if (m.t === "picked") picked(m);
  else if (m.t === "followReq") { X.closeAll(); X.say(`${m.nick} 님이 같이 산책하자고 해요! 수락하면 ${m.nick} 님이 나를 따라 걸어요.`, [["🐾 좋아요", () => { Net.send({ t: "followAns", to: m.from, ok: true }); X.closeAll(); }], ["다음에", () => { Net.send({ t: "followAns", to: m.from, ok: false }); X.closeAll(); }]], "🐾 산책 신청"); }
  else if (m.t === "pair") { if (m.leader) { pairs.set(m.follower, m.leader); if (m.follower === me) { follow = m.leader; X.sys(`${m.ln} 님과 같이 걸어요! (그만하려면 '그만')`); } if (m.leader === me) X.sys(`${m.fn} 님이 나를 따라 걸어요 🐾`); setEm(actorById(m.follower), "heart"); }
    else { pairs.delete(m.follower); if (m.follower === me) { follow = 0; X.sys("산책을 마쳤어요."); } } updTools(); }
  else if (m.t === "room") { if (m.id === me) return; openRoom({ nick: m.nick, items: m.items || [], breed: m.breed, style: m.style }); }
  else if (m.t === "gb") { if (!$("gb").classList.contains("hidden")) loadGB(); } };
// ---------- 그리기 ----------
const sc = () => X.view.scale / X.view.d;
function drawIcon(im, sx, sy, k = 1) { const s = Math.max(1, Math.round(sc() * k)); X.g.drawImage(im, Math.round(sx - im.width * s / 2), Math.round(sy - im.height * s), im.width * s, im.height * s); }
X.dogExtra = (a, x, y, t) => { const g = X.g, id = a === P ? myId() : a.id;
  if ((carry.get(id) || 0) > t) { const dx = a.dir === "left" ? -9 : a.dir === "right" ? 9 : 0, dy = a.dir === "up" ? -22 : -9; if (a.dir !== "up") g.drawImage(ICON.ball, x + dx - 2, y + dy - 2); }
  const em = a.em && t - a.emT < X.EMDUR[a.em] ? a.em : null;
  if (em === "wag") { const side = a.dir === "left" ? 13 : a.dir === "right" ? -15 : 11; if (Math.floor(t / 180) % 2) g.drawImage(ICON.wag, x + side, y - 18); }
  if (em === "eat") { g.drawImage(ICON.bone, x - 5 + (a.dir === "left" ? -6 : a.dir === "right" ? 6 : 0), y - 8); if (Math.floor(t / 200) % 2) { g.fillStyle = "#e8c89a"; g.fillRect(x - 6, y - 2, 1, 1); g.fillRect(x + 6, y - 3, 1, 1); } } };
X.world = (L, S, t) => {
  // 공
  for (const b of balls.values()) if (b.scene === S.id) { const age = t - (b.t0 || 0), k = Math.min(1, age / 700), fx = b.fx * T + 8, fy = b.fy * T + 10, tx = b.tx * T + 8, ty = b.ty * T + 10;
    const x = fx + (tx - fx) * k, y = fy + (ty - fy) * k - Math.sin(k * Math.PI) * 26 - (k === 1 ? Math.abs(Math.sin(age / 160)) * 2 * Math.max(0, 1 - (age - 700) / 1500) : 0);
    L.push({ y: ty + 2, f: () => { X.g.fillStyle = "rgba(122,90,154,.3)"; X.g.fillRect(Math.round(x) - 2, ty + 3, 5, 1); X.g.drawImage(ICON.ball, Math.round(x) - 2, Math.round(y) - 2); } }); }
  // 숨은 뼈다귀 (심부름 중일 때만 반짝)
  if (S === OUT && qs("bone") === "active") { const bx = BONE_AT[0] * T + 3, by = BONE_AT[1] * T + 8; L.push({ y: by + 4, f: () => { X.g.globalAlpha = .85; X.g.drawImage(ICON.bone, bx, by); X.g.globalAlpha = 1; if (Math.floor(t / 300) % 3 === 0) X.g.drawImage(ICON.spark, bx + 8, by - 6); } }); }
  // 같이 걷기 끈
  for (const [f, l] of pairs) { const A = actorById(f), B = actorById(l); if (!A || !B || A.scene !== S.id || B.scene !== S.id) continue;
    L.push({ y: Math.max(A.py, B.py) + 1, f: () => { const n = 10; for (let i = 1; i < n; i++) { const k = i / n, x = A.px + (B.px - A.px) * k, y = A.py - 10 + (B.py - A.py) * k + Math.sin(k * Math.PI) * 4; if (i % 2) { X.g.fillStyle = "#ff6fa8"; X.g.fillRect(Math.round(x), Math.round(y), 2, 1); } } } }); } };
X.overlay = (tops, t) => { tops.forEach(([a]) => { const em = a.em && t - a.emT < X.EMDUR[a.em] ? a.em : null; if (!em) return; const age = t - a.emT, [sx, sy] = X.toScreen(a.px, a.py - 36);
    if (em === "heart") { drawIcon(ICON.heart, sx + 10 * sc(), sy - age / 60, 1); drawIcon(ICON.heart, sx - 12 * sc(), sy - age / 45 + 10, .7); }
    else if (em === "bark") { drawIcon(ICON.bubble, sx + 16 * sc(), sy + 4, 1); X.g.font = `bold ${Math.round(9 * sc() / 1.5 + 4)}px ${X.FONT}`; X.g.fillStyle = "#e0589a"; X.g.textAlign = "center"; X.g.textBaseline = "middle"; X.g.fillText("멍!", sx + 16 * sc(), sy + 4 - 4.5 * Math.max(1, Math.round(sc()))); }
    else if (em === "sit") drawIcon(ICON.note, sx + 12 * sc(), sy + 6 - Math.abs(Math.sin(age / 300)) * 6, .8);
    else if (em === "greet") { drawIcon(ICON.paw, sx, sy - 4 - Math.abs(Math.sin(age / 200)) * 6, 1); }
    else if (em === "eat") drawIcon(ICON.spark, sx + 10 * sc(), sy + 8, .7); });
  if (nearDog && !X.isUi()) { const [x, y] = X.toScreen(nearDog.px, nearDog.py + 22); X.pill(x, y, "G 인사 · F 같이 걷기", "#e9f6ff", "#3a6aa8", "#8ec5ff", 12); } };
window.__daonX = { S6, balls, pairs, emote, throwBall, greet, askFollow, stopFollow, questMenu, openRoom, openGB, eatTreat, reserve, BONE_AT, roomItems: () => roomItems, setAdmin: k => { adminKey = k; renderGB(); }, visitRoom, friendMenu, nearDog: () => nearDog };
})();
