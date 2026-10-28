(() => {
"use strict";
const C = window.DAON_CONFIG, DD = window.DAON_DOGDATA, Art = window.DaonArt, Pix = window.DaonPix;
const BREEDS = Object.fromEntries(Object.entries(DD.BREEDS).map(([k,v]) => [k, v.name])), STYLE_NAME = s => DD.STYLES[s]?.name || "";
const T = 16, STEP_MS = 200, FR = DaonDog.FRAMES, SAVE_KEY = "daonVillage3", VER = 5; // 월드 좌표는 '도트' 단위, 한 칸 = 16도트
const $ = id => document.getElementById(id);
const X = window.DaonX = window.DaonX || {}; // v6 상호작용(social.js) 연결 고리
// ---------- 창틀 (스테퍼 모서리 도트 프레임을 코드로 만들어 CSS에 넘김) ----------
function frameURL(o, l, f) { const b = new Pix.Buf(9, 9), CORNER = [[null, null, o], [null, o, l], [o, l, f]];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { const ex = x < 3 ? x : x > 5 ? 8 - x : 3, ey = y < 3 ? y : y > 5 ? 8 - y : 3; let c;
    if (ex < 3 && ey < 3) c = CORNER[ey][ex]; else if (ex === 3 && ey === 3) c = f; else { const k = ex === 3 ? ey : ex; c = k === 0 ? o : k === 1 ? l : f; }
    if (c) b.px(x, y, c); }
  return `url(${b.canvas().toDataURL()})`; }
{ const r = document.documentElement.style; r.setProperty("--f-blue", frameURL("#74a9ec", "#ffffff", "#fbfdff")); r.setProperty("--f-pink", frameURL("#ff86b8", "#ffffff", "#fff4f9")); r.setProperty("--f-lav", frameURL("#a58bdc", "#ffffff", "#f7f1ff")); r.setProperty("--f-wood", frameURL("#b57a52", "#f1c99a", "#fff1d8")); }
// ---------- 맵 ----------
function mkScene(id, name, cols, rows) { return { id, name, cols, rows, w: cols * T, h: rows * T, grid: new Uint8Array(cols * rows).fill(1), sprites: [] }; }
const floor = (S, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) S.grid[y * S.cols + x] = 0; };
const block = (S, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) S.grid[y * S.cols + x] = 1; };
const OUT = mkScene("out", "다온 마을", 36, 26), IN = mkScene("in", "다온펫살롱", 22, 17);
floor(OUT, 2, 2, 33, 23); block(OUT, 12, 2, 23, 9); floor(OUT, 17, 9, 18, 9);
OUT.isDoor = (x, y) => y === 9 && x >= 17 && x <= 18; OUT.spawn = { x: 17, y: 12, dir: "down" }; OUT.exit = { x: 17, y: 11, dir: "down" };
const PATH = []; for (let y = 10; y <= 23; y++) PATH.push([17, y], [18, y]); for (let y = 15; y <= 16; y++) for (let x = 7; x <= 28; x++) if (x !== 17 && x !== 18) PATH.push([x, y]);
const treeAt = [[4, 6, 1], [30, 6, 0], [3, 18, 0], [32, 17, 1], [8, 22, 0], [27, 22, 1], [10, 4, 0], [26, 4, 1]];
const bushAt = [[11, 19], [24, 19], [6, 10], [29, 11], [13, 12], [22, 20]];
const fountainAt = { x: 8, y: 12 }, benchAt = { x: 25, y: 13 }, boardAt = { x: 22, y: 12 };
treeAt.forEach(([x, y]) => block(OUT, x, y, x, y)); bushAt.forEach(([x, y]) => block(OUT, x, y, x, y));
block(OUT, fountainAt.x, fountainAt.y, fountainAt.x + 1, fountainAt.y + 1); block(OUT, benchAt.x, benchAt.y, benchAt.x + 1, benchAt.y); block(OUT, boardAt.x, boardAt.y, boardAt.x, boardAt.y);
floor(IN, 1, 5, 20, 15); floor(IN, 10, 16, 11, 16);
IN.isDoor = (x, y) => y === 16 && x >= 10 && x <= 11; IN.spawn = { x: 10, y: 14, dir: "up" };
IN.npc = { tx: 10, ty: 6, dir: "down" };
block(IN, 9, 7, 11, 8); block(IN, 16, 5, 19, 7); block(IN, 2, 10, 5, 11); block(IN, 19, 12, 19, 12); block(IN, 1, 6, 1, 6); block(IN, 10, 6, 10, 6);
const SCN = { out: OUT, in: IN };
const walk = (S, x, y) => x >= 0 && y >= 0 && x < S.cols && y < S.rows && !S.grid[y * S.cols + x];
// ---------- 그림 만들기 ----------
const IMG = {}; let ready = false;
function build() {
  const sprite = (S, cv, cx, base) => S.sprites.push({ cv, x: Math.round(cx - cv.width / 2), y: Math.round(base - cv.height), sy: base });
  const shop = Art.shop(), fh = Art.fenceH(), fv = Art.fenceV(), fp = Art.fencePost();
  IMG.outBg = Art.outGround({ w: OUT.w, h: OUT.h, cols: OUT.cols, rows: OUT.rows, path: PATH, shop, shopX: 12 * T, shopY: 2 * T, doorX: 17 * T, fenceH: fh, fenceV: fv, fencePost: fp,
    solid: (x, y) => { const tx = x >> 4, ty = y >> 4; return tx < 2 || ty < 2 || tx > 33 || ty > 23 || (tx >= 12 && tx <= 23 && ty <= 9) || (OUT.grid[ty * OUT.cols + tx] && !(tx>=12&&tx<=23)); },
    beds: [[40, 44, 140, 50, .5], [420, 44, 120, 50, .5], [34, 330, 120, 56, .55], [420, 332, 120, 54, .55], [196, 196, 70, 30, .35], [316, 196, 70, 26, .35], [34, 170, 52, 70, .3], [490, 170, 52, 70, .3]] });
  const tr = [Art.tree(0), Art.tree(1)], bu = Art.bush();
  treeAt.forEach(([x, y, v]) => sprite(OUT, tr[v], x * T + 8, (y + 1) * T));
  bushAt.forEach(([x, y]) => sprite(OUT, bu, x * T + 8, (y + 1) * T - 1));
  sprite(OUT, Art.fountain(), (fountainAt.x + 1) * T, (fountainAt.y + 2) * T - 1);
  sprite(OUT, Art.bench(), (benchAt.x + 1) * T, (benchAt.y + 1) * T);
  sprite(OUT, Art.board(), boardAt.x * T + 8, (boardAt.y + 1) * T);
  IMG.inBg = Art.inRoom({ w: IN.w, h: IN.h + 12, rows: IN.rows, doorX: 10 * T });
  sprite(IN, Art.groomTable(), 10 * T + 8, 9 * T);
  sprite(IN, Art.tub(), 18 * T, 8 * T); sprite(IN, Art.sofa(), 4 * T, 12 * T); sprite(IN, Art.plant(), 19 * T + 8, 13 * T - 2); sprite(IN, Art.plant(), 1 * T + 8, 7 * T - 2);
  IMG.groomer = { front: [Art.groomer("front", 0), Art.groomer("front", 1)], back: [Art.groomer("back", 0), Art.groomer("back", 1)], side: [Art.groomer("side", 0), Art.groomer("side", 1)] };
  const sh = new Pix.Buf(22, 7); sh.d.fill(0); { const m = new Pix.Mask(22, 7).ell(11, 3.5, 10.5, 3.2); for (let i = 0; i < m.d.length; i++) if (m.d[i]) sh.d[i] = Pix.pack("#7a5a9a") & 0x00ffffff | (0x55 << 24); } IMG.shadow = sh.canvas();
  ready = true;
}
// ---------- 상태 ----------
const cv = $("game"), g = cv.getContext("2d");
let save = null; try { save = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch {}
const mkActor = o => Object.assign({ tx: 0, ty: 0, px: 0, py: 0, fx: 0, fy: 0, dir: "down", prog: 1, moving: false, bubble: null, bubbleT: 0 }, o);
const P = mkActor({ nick: "", breed: "maltese", style: "natural", scene: "out" });
const others = new Map();
let keys = {}, joyDir = null, path = [], uiOpen = false, started = false, near = null, typing = false;
function place(a, S, x, y, dir) { a.scene = S.id; a.tx = a.fx = x; a.ty = a.fy = y; a.px = x * T + 8; a.py = y * T + 14; a.prog = 1; if (dir) a.dir = dir; }
// ---------- 시작 화면 ----------
let selBreed = save?.breed && BREEDS[save.breed] ? save.breed : "maltese";
let selStyle = DD.validStyle(selBreed, save?.style) ? save.style : DD.defaultStyle(selBreed);
function thumb(breed, style, view) { const R = DaonDog.CROP, c = document.createElement("canvas"); c.width = R.w; c.height = R.h; c.className = "px";
  c.getContext("2d").drawImage(DaonDog.render(breed, style, view, -1), R.x, R.y, R.w, R.h, 0, 0, R.w, R.h); return c; }
function buildBreeds() { $("breeds").innerHTML = "";
  for (const k in BREEDS) { const d = document.createElement("div"); d.className = "breed" + (k === selBreed ? " sel" : ""); d.dataset.k = k;
    const t = document.createElement("div"); t.textContent = BREEDS[k]; d.append(thumb(k, DD.defaultStyle(k), "front"), t);
    d.onclick = () => { if (selBreed !== k) { selBreed = k; selStyle = DD.defaultStyle(k); } buildBreeds(); buildStyles(); }; $("breeds").append(d); } }
function buildStyles() { const box = $("styles"); box.innerHTML = "";
  DD.BREEDS[selBreed].styles.forEach(sid => { const d = document.createElement("div"); d.className = "style" + (sid === selStyle ? " sel" : ""); d.dataset.s = sid;
    const t = document.createElement("div"); t.textContent = STYLE_NAME(sid); d.append(thumb(selBreed, sid, "front"), t);
    d.onclick = () => { selStyle = sid; buildStyles(); }; box.append(d); });
  $("styleDesc").textContent = `${BREEDS[selBreed]} · ${STYLE_NAME(selStyle)} — ${DD.STYLES[selStyle].desc}`; }
const pv = $("preview"), pg = pv.getContext("2d"); pv.width = 132; pv.height = 46;
function drawPreview(t) { if ($("start").classList.contains("hidden")) { requestAnimationFrame(drawPreview); return; }
  pg.imageSmoothingEnabled = false; const f = Math.floor(t / (STEP_MS * 2 / FR)) % FR;
  for (let y = 0; y < 46; y++) for (let x = 0; x < 132; x++) { const fl = y >= 34; pg.fillStyle = fl ? ((((x >> 3) + ((y - 34) >> 2)) & 1) ? "#d8f2c4" : "#cdecb8") : y < 12 ? "#cfe8ff" : y < 24 ? "#e1ddff" : "#ffe1f0"; pg.fillRect(x, y, 1, 1); }
  pg.fillStyle = "#fff"; [[8, 6, 9], [100, 9, 7], [60, 4, 6]].forEach(([x, y, w]) => { pg.fillRect(x, y, w, 2); pg.fillRect(x + 2, y - 1, w - 4, 1); });
  [["front", 0], ["side", 1], ["back", 2]].forEach(([v, i]) => { const x = i * 44 + 2; pg.drawImage(IMG.shadow, x + 9, 34); pg.drawImage(DaonDog.render(selBreed, selStyle, v, f), x, 1); });
  requestAnimationFrame(drawPreview); }
buildBreeds(); buildStyles();
if (save) { $("nick").value = save.nick || ""; $("startBtn").textContent = `${save.nick || "강아지"}(으)로 이어하기!`; }
$("startBtn").onclick = () => { if (!ready) return; const n = $("nick").value.replace(/[<>]/g, "").trim().slice(0, 10) || BREEDS[selBreed]; P.breed = selBreed; P.style = selStyle; P.nick = n;
  const keep = save && save.v === VER, S = keep ? (SCN[save.scene] || OUT) : OUT;
  const ok = keep && walk(S, save.tx, save.ty) && !S.isDoor(save.tx, save.ty), sx = ok ? save.tx : S.spawn.x, sy = ok ? save.ty : S.spawn.y;
  place(P, S, sx, sy, (ok && save.dir) || "down"); persist();
  $("start").classList.add("hidden"); ["hud", "chatbar", "chatlog", "minimap", "zoomCtl"].concat(matchMedia("(pointer:coarse)").matches || innerWidth < 700 ? ["joy"] : []).forEach(i => $(i).classList.remove("hidden"));
  started = true; banner(S.name); Net.connect(); X.start && X.start(); };
$("resetBtn").onclick = () => { $("start").classList.remove("hidden"); started = false; Net.close(); path = []; };
function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: VER, breed: P.breed, style: P.style, nick: P.nick, scene: P.scene, tx: P.tx, ty: P.ty, dir: P.dir })); }
function banner(t) { const b = $("banner"); b.textContent = "♡ " + t + " ♡"; b.classList.add("show"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("show"), 1800); }
// ---------- 입력 ----------
const KEYDIR = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
addEventListener("keydown", e => { if (e.key === "Escape" && anyOpen()) { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); closeAll(); return; }
  if (e.target !== $("chatIn") && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return; if (typing) { if (e.key === "Escape") $("chatIn").blur(); return; }
  const k = e.key.toLowerCase();
  if (k === "enter" && started && !uiOpen) { e.preventDefault(); $("chatIn").focus(); return; }
  keys[k] = 1; if (KEYDIR[k]) { path = []; e.preventDefault(); }
  if (started && !uiOpen && X.key && X.key(k, e)) return;
  if ((k === " " || k === "e") && started && !uiOpen && near) { e.preventDefault(); interact(); } if (k === "escape") closeAll(); });
addEventListener("keyup", e => keys[e.key.toLowerCase()] = 0);
$("chatIn").onfocus = () => { typing = true; keys = {}; }; $("chatIn").onblur = () => typing = false;
$("chatbar").onsubmit = e => { e.preventDefault(); const v = $("chatIn").value.trim().slice(0, 80); if (v) { Net.chat(v); } $("chatIn").value = ""; $("chatIn").blur(); };
const view = { scale: 3, d: 1, ox: 0, oy: 0, cx: 0, cy: 0, vw: 0, vh: 0 };
const toWorld = (clientX, clientY) => [((clientX * view.d) - view.ox) / view.scale, ((clientY * view.d) - view.oy) / view.scale];
const toScreen = (wx, wy) => [(wx * view.scale + view.ox) / view.d, (wy * view.scale + view.oy) / view.d];
let tapMark = null;
cv.addEventListener("pointerdown", e => { if (started && anyOpen()) { if (!$("dialog").classList.contains("hidden") && $("dlgChoices").dataset.lock) return; closeAll(); return; } if (!started || uiOpen) return; $("chatIn").blur();
  const [wx, wy] = toWorld(e.clientX, e.clientY), S = SCN[P.scene];
  if (near && Math.hypot(wx - near.x, wy - near.y) < 30) { interact(); return; }
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T); path = findPath(S, P.tx, P.ty, tx, ty); tapMark = { x: tx, y: ty, t: performance.now() }; });
function findPath(S, sx, sy, gx, gy) { // BFS (막힌 칸을 누르면 가장 가까운 칸으로)
  const key = (x, y) => y * S.cols + x, prev = new Map([[key(sx, sy), -1]]), q = [[sx, sy]]; let best = [sx, sy], bd = 1e9;
  while (q.length) { const [x, y] = q.shift(); const d = Math.abs(x - gx) + Math.abs(y - gy); if (d < bd) { bd = d; best = [x, y]; } if (d === 0) break;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (!prev.has(k) && walk(S, nx, ny)) { prev.set(k, key(x, y)); q.push([nx, ny]); } }
    if (prev.size > 3000) break; }
  const out = []; let k = key(best[0], best[1]); while (k !== key(sx, sy) && k !== -1) { out.unshift([k % S.cols, Math.floor(k / S.cols)]); k = prev.get(k); } return out; }
const jb = $("joy"), kn = $("knob"); let jid = null;
jb.addEventListener("pointerdown", e => { jid = e.pointerId; jb.setPointerCapture(jid); jm(e); });
jb.addEventListener("pointermove", e => { if (e.pointerId === jid) jm(e); });
jb.addEventListener("pointerup", () => { jid = null; joyDir = null; kn.style.transform = ""; });
function jm(e) { const r = jb.getBoundingClientRect(), R = r.width / 2; let dx = e.clientX - r.left - R, dy = e.clientY - r.top - R; const m = Math.hypot(dx, dy); if (m > R * .75) { dx *= R * .75 / m; dy *= R * .75 / m; }
  kn.style.transform = `translate(${dx}px,${dy}px)`; path = []; joyDir = m < 12 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"); }
$("actBtn").onclick = () => interact();
// ---------- 대화 / 게시판 ----------
const PANELS = ["dialog", "board", "room", "gb", "emoMenu"];
const anyOpen = () => uiOpen || PANELS.some(i => $(i) && !$(i).classList.contains("hidden"));
// 바깥(어두운 배경)을 누르면 닫기 — 터치/마우스 모두 pointerdown 기준
["board", "room", "gb"].forEach(i => $(i).addEventListener("pointerdown", e => { if (e.target === $(i)) { e.preventDefault(); closeAll(); } }));
document.querySelectorAll(".xbtn").forEach(b => b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); closeAll(); }));
function closeAll() { $("dialog").classList.add("hidden"); $("dlgForm").classList.add("hidden"); $("board").classList.add("hidden"); uiOpen = false; X.closeExtra && X.closeExtra(); $("chatIn").blur(); }
function say(text, choices, who) { uiOpen = true; $("dlgForm").classList.add("hidden"); delete $("dlgChoices").dataset.lock; $("dialog").classList.remove("hidden"); $("dlgName").textContent = who || C.owner.name; $("dlgText").textContent = text; $("dlgText").style.whiteSpace = "pre-line";
  const ch = $("dlgChoices"); ch.innerHTML = ""; (choices || []).forEach(([t, f]) => { const b = document.createElement("button"); b.textContent = t; b.onclick = f; ch.append(b); }); }
function ownerMenu(text) { const H = { menu: () => ownerMenu(C.menus.map(m => `• ${m.name} — ${m.price}`).join("\n") || "메뉴 준비 중이에요."), hours: () => ownerMenu(C.shop.hours || "영업시간 준비 중이에요."), howto: () => ownerMenu(C.reservationHowTo || ""),
    board: openBoard, quest: () => X.questMenu(), gb: () => X.openGB() };
  const list = (C.dialogue && C.dialogue.choices) || [];
  const ch = list.map(c => [c.label, () => c.kind === "flow" ? X.runFlow(c.flow) : c.kind === "reply" ? ownerMenu(c.reply.replace(/\{nick\}/g, P.nick)) : (H[c.kind] || closeAll)()]);
  say(text, ch.concat([["닫기", closeAll]])); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function openBoard() { closeAll(); uiOpen = true; $("board").classList.remove("hidden");
  $("notices").innerHTML = C.board.notices.map(n => `<li><b>${esc(n.date)}</b> ${esc(n.text)}</li>`).join("");
  $("slots").innerHTML = C.board.slots.map(s => `<div class="slot">${esc(s.day)} ${s.times.map(t => `<span>${esc(t)}</span>`).join("")}</div>`).join("");
  $("contact").href = C.board.contactLink; X.boardExtra && X.boardExtra(); }
$("closeBoard").onclick = closeAll;
function interact() { if (!near) return; if (near.k === "gb") { X.openGB(); return; } if (near.k === "npc") { IN.npc.dir = faceTo(IN.npc, P); ownerMenu(`${C.owner.greeting}\n무엇을 도와드릴까요?`); } else openBoard(); }
const faceTo = (a, b) => Math.abs(b.tx - a.tx) > Math.abs(b.ty - a.ty) ? (b.tx > a.tx ? "right" : "left") : (b.ty > a.ty ? "down" : "up");
// ---------- 이동 (타일 단위) ----------
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function wantedDir() { if (joyDir) return joyDir; for (const k in KEYDIR) if (keys[k]) return KEYDIR[k]; return null; }
function update(dt) {
  for (const o of others.values()) stepActor(o, dt);
  if (!started) return;
  if (P.prog < 1) { stepActor(P, dt); if (P.prog < 1) return; arrive(); }
  if (uiOpen || typing) { P.moving = false; return; }
  X.update && X.update(dt);
  const S = SCN[P.scene]; let d = wantedDir(), nx, ny;
  if (d) { [nx, ny] = [P.tx + DV[d][0], P.ty + DV[d][1]]; }
  else if (path.length) { [nx, ny] = path[0]; d = nx > P.tx ? "right" : nx < P.tx ? "left" : ny > P.ty ? "down" : "up"; }
  if (!d) { P.moving = false; return; }
  const turned = P.dir !== d; P.dir = d;
  if (walk(S, nx, ny)) { if (path.length) path.shift(); P.fx = P.tx; P.fy = P.ty; P.tx = nx; P.ty = ny; P.prog = 0; P.moving = true; Net.move(); }
  else { path = []; P.moving = false; if (turned) Net.move(); }
}
function stepActor(a, dt) { if (a.prog >= 1) { a.moving = false; return; } a.prog = Math.min(1, a.prog + dt / STEP_MS);
  a.px = (a.fx + (a.tx - a.fx) * a.prog) * T + 8; a.py = (a.fy + (a.ty - a.fy) * a.prog) * T + 14; a.moving = true; a.walkT = (a.walkT || 0) + dt; a.walkUntil = performance.now() + 140; }
function arrive() { const S = SCN[P.scene];
  if (S.isDoor(P.tx, P.ty)) { const N = S === OUT ? IN : OUT, sp = N === OUT ? OUT.exit : IN.spawn; place(P, N, sp.x, sp.y, sp.dir); path = []; banner(N.name); Net.move(); }
  persist(); X.arrive && X.arrive(); }
function updateNear() { near = null; if (!started) return;
  if (P.scene === "in") { if (Math.abs(P.tx - IN.npc.tx) + Math.abs(P.ty - IN.npc.ty) <= 3) near = { k: "npc", x: IN.npc.tx * T + 8, y: IN.npc.ty * T - 30 };
    else if (P.tx <= 6 && P.ty <= 7) near = { k: "board", x: 56, y: 70 };
    else if (P.tx >= 14 && P.ty >= 12 && P.tx <= 20) near = { k: "gb", x: 18 * T, y: 13 * T - 20 }; }
  else if (Math.abs(P.tx - boardAt.x) + Math.abs(P.ty - boardAt.y) <= 3) near = { k: "sign", x: boardAt.x * T + 8, y: boardAt.y * T - 34 };
  $("actBtn").classList.toggle("hidden", !near || uiOpen); $("actBtn").textContent = near?.k === "npc" ? "말걸기" : "보기"; }
// ---------- 네트워크 (서버 없으면 혼자 모드) ----------
const Net = { ws: null, id: null, online: false,
  connect() { if (location.protocol === "file:") { this.offline(); return; }
    try { this.ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"); } catch { this.offline(); return; }
    const w = this.ws; const to = setTimeout(() => { if (w.readyState !== 1) { w.close(); this.offline(); } }, 4000);
    w.onopen = () => { clearTimeout(to); this.online = true; w.send(JSON.stringify({ t: "hello", nick: P.nick, breed: P.breed, style: P.style, scene: P.scene, tx: P.tx, ty: P.ty, dir: P.dir })); sys("마을에 접속했어요. Enter로 채팅할 수 있어요."); };
    w.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.handle(m); };
    w.onclose = () => { clearTimeout(to); if (this.online) sys("서버 연결이 끊겼어요. 혼자 모드로 계속해요."); this.offline(); }; },
  offline() { X.net && X.net({ t: "offline" }); this.online = false; this.ws = null; others.clear(); setOnline(); },
  close() { if (this.ws) { this.online = false; this.ws.onclose = null; this.ws.close(); } others.clear(); setOnline(); },
  send(o) { if (this.online && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); },
  move() { this.send({ t: "move", scene: P.scene, tx: P.tx, ty: P.ty, dir: P.dir }); },
  chat(text) { bubble(P, text); log(P.nick, text); if (this.online) this.send({ t: "chat", text }); },
  handle(m) {
    if (m.t === "welcome") { this.id = m.id; others.clear(); m.players.forEach(p => upsert(p, true)); X.net && X.net(m); }
    else if (m.t === "join") { upsert(m.p, true); sys(`${m.p.nick} 님이 들어왔어요.`); }
    else if (m.t === "move") upsert(m.p, false);
    else if (m.t === "leave") { X.net && X.net(m); const o = others.get(m.id); if (o) sys(`${o.nick} 님이 나갔어요.`); others.delete(m.id); }
    else if (m.t === "chat") { if (m.id === this.id) return; const o = others.get(m.id); if (o) bubble(o, m.text); if (m.scene === P.scene) log(m.nick, m.text); }
    else if (m.t === "notice") sys(m.text);
    else X.net && X.net(m);
    setOnline(); } };
function upsert(p, snap) { let o = others.get(p.id); const S = SCN[p.scene] || OUT;
  // 다른 버전(예전 큰 맵)에서 온 좌표는 안전한 칸으로
  const okp = walk(S, p.tx, p.ty) || S.isDoor(p.tx, p.ty), tx = okp ? p.tx : S.spawn.x, ty = okp ? p.ty : S.spawn.y;
  if (!o || snap || o.scene !== p.scene || Math.abs(o.tx - tx) + Math.abs(o.ty - ty) > 1) { o = o || mkActor({}); Object.assign(o, { id: p.id, nick: p.nick, breed: p.breed, style: DD.validStyle(p.breed, p.style) ? p.style : DD.defaultStyle(p.breed), dir: p.dir }); place(o, S, tx, ty, p.dir); others.set(p.id, o); return; }
  o.dir = p.dir; if (o.tx !== tx || o.ty !== ty) { o.fx = o.tx; o.fy = o.ty; o.tx = tx; o.ty = ty; o.prog = 0; } }
function setOnline() { $("online").textContent = Net.online ? `🟢 접속 ${others.size + 1}명` : "⚪ 혼자 모드"; }
function bubble(a, text) { a.bubble = text; a.bubbleT = performance.now(); }
function logLine(html) { const l = $("chatlog"); const d = document.createElement("div"); d.append(...html); l.append(d); while (l.children.length > 6) l.firstChild.remove(); }
function log(nick, text) { const b = document.createElement("b"); b.textContent = nick + ": "; logLine([b, document.createTextNode(text)]); }
function sys(text) { const s = document.createElement("span"); s.className = "sys"; s.textContent = "📢 " + text; logLine([s]); }
// ---------- 그리기 ----------
const FONT = "Jua, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
function drawDog(a, t) { const walking = a.moving || t < (a.walkUntil || 0), v = a.dir === "down" ? "front" : a.dir === "up" ? "back" : "side";
  let f; if (walking) f = Math.floor((a.walkT || 0) / (STEP_MS * 2 / FR)) % FR; else { const u = (t + (a.id || 0) * 777) % 4200; f = u > 3950 ? -3 : (Math.floor(u / 900) % 2 ? -2 : -1); }
  const em = a.em && t - a.emT < (X.EMDUR?.[a.em] || 2000) ? a.em : null; if (em === "sit" && walking) a.em = null;
  if (em && !walking) f = em === "bark" || em === "eat" ? -3 : -1;
  const sp = DaonDog.render(a.breed, a.style, v, f); let x = Math.round(a.px), y = Math.round(a.py), cut = 0;
  if (em === "wag") x += Math.floor(t / 90) % 2 ? 1 : -1; if (em === "bark") y -= Math.floor(t / 120) % 3 === 0 ? 2 : 0; if (em === "eat") y += Math.floor(t / 160) % 2; if (em === "greet") y -= Math.floor(t / 150) % 2 * 2;
  if (em === "sit") cut = 4;
  g.drawImage(IMG.shadow, x - 11, y - 4); const H = sp.height - cut;
  if (a.dir === "left") { g.save(); g.translate(2 * x, 0); g.scale(-1, 1); g.drawImage(sp, 0, 0, sp.width, H, x - 20, y - DaonDog.GY + cut, sp.width, H); g.restore(); } else g.drawImage(sp, 0, 0, sp.width, H, x - 20, y - DaonDog.GY + cut, sp.width, H);
  if (cut) { g.fillStyle = "rgba(122,90,154,.35)"; g.fillRect(x - 9, y - 1, 18, 1); }
  X.dogExtra && X.dogExtra(a, x, y, t); }
function drawGroomer(n, t) { const v = n.dir === "down" ? "front" : n.dir === "up" ? "back" : "side", im = IMG.groomer[v][Math.floor(t / 700) % 2], x = n.tx * T + 8, y = n.ty * T + 14;
  g.drawImage(IMG.shadow, x - 11, y - 4);
  if (n.dir === "left") { g.save(); g.translate(2 * x, 0); g.scale(-1, 1); g.drawImage(im, x - 14, y - 38); g.restore(); } else g.drawImage(im, x - 14, y - 38); }
function pill(x, y, txt, bg, fg, bd, size = 15) { g.font = `${size}px ${FONT}`; const w = Math.ceil(g.measureText(txt).width) + 18, h = size + 11, X = Math.round(x - w / 2), Y = Math.round(y - h / 2);
  const box = (c, i) => { g.fillStyle = c; g.fillRect(X + 3 + i, Y + i, w - 6 - 2 * i, h - 2 * i); g.fillRect(X + i, Y + 3 + i, w - 2 * i, h - 6 - 2 * i); g.fillRect(X + 1 + i, Y + 1 + i, w - 2 - 2 * i, h - 2 - 2 * i); };
  g.fillStyle = "rgba(120,90,160,.25)"; g.fillRect(X + 3, Y + h, w - 6, 3); box(bd, 0); box(bg, 2);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, x, Y + h / 2 + 1); }
function nameTag(x, y, txt, mine) { g.font = `14px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 4; g.strokeStyle = mine ? "#b0488a" : "#6a58a8"; g.strokeText(txt, x, y); g.fillStyle = mine ? "#fff2a0" : "#ffffff"; g.fillText(txt, x, y); }
function drawBubble(a, topY, t) { if (!a.bubble) return; const age = t - a.bubbleT; if (age > 5000) { a.bubble = null; return; }
  g.globalAlpha = age > 4500 ? (5000 - age) / 500 : 1; g.font = `15px ${FONT}`;
  const [sx] = toScreen(a.px, 0), words = [...a.bubble], lines = []; let cur = ""; for (const ch of words) { if (g.measureText(cur + ch).width > 170) { lines.push(cur); cur = ""; } cur += ch; } lines.push(cur);
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + 22, h = lines.length * 19 + 14, X = Math.round(sx - w / 2), Y = Math.round(topY - h - 12);
  const box = (c, i) => { g.fillStyle = c; g.fillRect(X + 4 + i, Y + i, w - 8 - 2 * i, h - 2 * i); g.fillRect(X + i, Y + 4 + i, w - 2 * i, h - 8 - 2 * i); g.fillRect(X + 2 + i, Y + 2 + i, w - 4 - 2 * i, h - 4 - 2 * i); };
  box("#74a9ec", 0); box("#ffffff", 2);
  const cx = Math.round(sx); g.fillStyle = "#74a9ec"; g.fillRect(cx - 6, Y + h, 12, 2); g.fillRect(cx - 4, Y + h + 2, 8, 2); g.fillRect(cx - 2, Y + h + 4, 4, 3); g.fillStyle = "#fff"; g.fillRect(cx - 5, Y + h - 2, 10, 2); g.fillRect(cx - 3, Y + h, 6, 2); g.fillRect(cx - 1, Y + h + 2, 2, 2);
  g.fillStyle = "#5a4a80"; g.textAlign = "center"; g.textBaseline = "top"; lines.forEach((l, i) => g.fillText(l, sx, Y + 8 + i * 19)); g.globalAlpha = 1; }
// 하늘색→분홍 하늘 배경 + 구름 + 반짝이
const CLOUD = (() => { const b = new Pix.Buf(34, 14), m = new Pix.Mask(34, 14); m.ell(10, 9, 8, 4.5).add(new Pix.Mask(34, 14).ell(19, 7, 9, 6)).add(new Pix.Mask(34, 14).ell(27, 9, 6, 4)).clip(0, 0, 34, 12); Pix.part(b, m, { fill: "#ffffff", light: "#ffffff", shade: "#e6e9ff", line: "#c7d4f7" }); return b.canvas(); })();
function drawSky(t) { const W = cv.width, H = cv.height, sc = view.scale, bands = ["#bfe3ff", "#c8e4ff", "#d3e2ff", "#dcdcff", "#e8d8ff", "#f4d6f6", "#ffd3ea", "#ffd6e6"];
  const bh = Math.ceil(H / bands.length); bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, W, bh + 1); });
  [[.06, .12, 1, 9000], [.58, .06, 1.4, 14000], [.82, .3, 1, 11000], [.2, .55, 1.2, 16000], [.7, .75, 1, 10000], [.4, .9, 1.3, 13000]].forEach(([x, y, s, sp], i) => { const cx = ((x * W + t / sp * W * .8 + i * 137) % (W + 40 * sc)) - 36 * sc; g.drawImage(CLOUD, Math.round(cx), Math.round(y * H), Math.round(34 * sc * s), Math.round(14 * sc * s)); });
  g.fillStyle = "#ffffff"; for (let i = 0; i < 26; i++) { const x = Pix.hash(i, 1, 4) * W, y = Pix.hash(i, 2, 4) * H, on = Math.floor(t / 600 + i * 1.7) % 3; if (on) { const s = sc * (on === 1 ? 1 : 2) / 1; g.fillRect(Math.round(x), Math.round(y), s, s); if (on === 2) { g.fillRect(Math.round(x) - s, Math.round(y), s, s); g.fillRect(Math.round(x) + s, Math.round(y), s, s); g.fillRect(Math.round(x), Math.round(y) - s, s, s); g.fillRect(Math.round(x), Math.round(y) + s, s, s); } } } }
function drawWorld(t) { const S = SCN[P.scene];
  g.drawImage(S === OUT ? IMG.outBg : IMG.inBg, 0, 0);
  if (tapMark && t - tapMark.t < 700) { const a = 1 - (t - tapMark.t) / 700; g.fillStyle = `rgba(255,111,170,${a})`; const x = tapMark.x * T, y = tapMark.y * T; g.fillRect(x + 1, y + 1, 4, 1); g.fillRect(x + 1, y + 1, 1, 4); g.fillRect(x + 11, y + 1, 4, 1); g.fillRect(x + 14, y + 1, 1, 4); g.fillRect(x + 1, y + 14, 4, 1); g.fillRect(x + 1, y + 11, 1, 4); g.fillRect(x + 11, y + 14, 4, 1); g.fillRect(x + 14, y + 11, 1, 4); }
  const fly = [];
  if (S === OUT) [[90, 120, "#ff9ccf"], [430, 190, "#8ec5ff"], [300, 330, "#ffd966"]].forEach(([bx, by, col], i) => { const k = t / 1000 + i * 2.1, x = bx + Math.sin(k * .7) * 40 + Math.sin(k * 1.9) * 8, y = by + Math.cos(k * .5) * 22 + Math.sin(k * 2.3) * 4, fl = Math.floor(t / 130 + i) % 2;
    fly.push({ y: y + 40, f: () => { g.fillStyle = col; const X = Math.round(x), Y = Math.round(y); if (fl) { g.fillRect(X - 2, Y - 1, 2, 2); g.fillRect(X + 1, Y - 1, 2, 2); } else { g.fillRect(X - 2, Y, 2, 1); g.fillRect(X + 1, Y, 2, 1); } g.fillStyle = "#7a5a80"; g.fillRect(X, Y, 1, 2); } }); });
  const L = fly.concat(S.sprites.map(s => ({ y: s.sy, f: () => g.drawImage(s.cv, s.x, s.y) }))), tops = [];
  const addDog = (a, mine) => { L.push({ y: a.py, f: () => drawDog(a, t) }); tops.push([a, mine]); };
  for (const o of others.values()) if (o.scene === P.scene) addDog(o, false); addDog(P, true);
  if (S === IN) { const n = IN.npc; if (!uiOpen && near?.k !== "npc" && Math.random() < .002) n.dir = ["down", "left", "right"][Math.floor(Math.random() * 3)]; L.push({ y: n.ty * T + 14, f: () => drawGroomer(n, t) }); }
  X.world && X.world(L, S, t);
  L.sort((a, b) => a.y - b.y).forEach(i => i.f());
  return tops; }
function drawOverlay(tops, t) { const S = SCN[P.scene];
  tops.forEach(([a, mine]) => { const [sx, sy] = toScreen(a.px, a.py); nameTag(Math.round(sx), Math.round(sy + 9 * view.scale / view.d), a.nick, mine); });
  tops.forEach(([a]) => { const [, sy] = toScreen(a.px, a.py - 34); drawBubble(a, sy, t); });
  if (S === OUT) { const [x, y] = toScreen(18 * T, 10 * T + 8); pill(x, y + 6 + Math.sin(t / 300) * 3, "▲ 들어가기", "#ffffff", "#e0709c", "#ff9fc0", 14);
    const [bx, by] = toScreen(boardAt.x * T + 8, boardAt.y * T + 18); pill(bx, by, "📌 게시판", "#fff8e0", "#8a5a30", "#d5a574", 13); }
  else { const [x, y] = toScreen(11 * T, 16 * T - 6 + 0); pill(x, y - 14 + Math.sin(t / 300) * 3, "▼ 밖으로", "#ffffff", "#e0709c", "#ff9fc0", 14);
    const [bx, by] = toScreen(56, 74); pill(bx, by, "📌 게시판", "#fff8e0", "#8a5a30", "#d5a574", 13);
    const [gx, gy] = toScreen(18 * T, 13 * T + 4); pill(gx, gy, "📖 방명록", "#fff0f7", "#c0407a", "#ff9fc0", 13);
    const n = IN.npc; const [nx, ny] = toScreen(n.tx * T + 8, n.ty * T - 26); pill(nx, ny - 10, "✂️ " + C.owner.name, "#ff9fc0", "#ffffff", "#c45a8a", 14); }
  X.overlay && X.overlay(tops, t);
  if (near && !uiOpen) { const [x, y] = toScreen(near.x, near.y); pill(x, y - Math.abs(Math.sin(t / 250)) * 4, near.k === "npc" ? "💬 말걸기 (Space)" : near.k === "gb" ? "📖 방명록 (Space)" : "👀 보기 (Space)", "#fff3b0", "#7a4a20", "#e0b030", 14); } }
function drawMinimap() { const m = $("minimap"), c = m.getContext("2d"), S = SCN[P.scene], bg = S === OUT ? IMG.outBg : IMG.inBg; c.imageSmoothingEnabled = false; c.clearRect(0, 0, 150, 112);
  if (bg) c.drawImage(bg, 0, 0, bg.width, S.h, 0, 0, 150, 112); const sx = 150 / S.w, sy = 112 / S.h;
  for (const o of others.values()) if (o.scene === P.scene) { c.fillStyle = "#4d8cf0"; c.fillRect(Math.round(o.px * sx) - 2, Math.round(o.py * sy) - 2, 4, 4); }
  if (S === IN) { c.fillStyle = "#ff6fa8"; c.fillRect(Math.round((IN.npc.tx * T + 8) * sx) - 2, Math.round((IN.npc.ty * T + 8) * sy) - 2, 4, 4); }
  c.fillStyle = "#fff2a0"; c.strokeStyle = "#b0488a"; c.lineWidth = 1.5; c.fillRect(Math.round(P.px * sx) - 3, Math.round(P.py * sy) - 3, 6, 6); c.strokeRect(Math.round(P.px * sx) - 3, Math.round(P.py * sy) - 3, 6, 6); }
// 카메라 줌: 기본값은 화면 크기에 맞춰(가로 ~18칸, 세로 ~16칸) 정하고, 사용자가 +/-·휠·핀치로 조절(localStorage 기억)
const ZKEY = "daonZoom", ZMIN = 0.5, ZMAX = 3; let zoomF = Math.min(ZMAX, Math.max(ZMIN, +localStorage.getItem(ZKEY) || 1));
function baseCss() { return Math.min(innerWidth / (18 * T), innerHeight / (16 * T)); }
function calcScale(f) { const d = view.d; return Math.max(1, Math.min(Math.round(8 * d), Math.round(baseCss() * f * d))); } // 기기 픽셀 기준 정수 배율 → 도트 선명
function resize() { const d = devicePixelRatio || 1; cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); view.d = d; view.scale = calcScale(zoomF); }
function setZoom(f) { f = Math.min(ZMAX, Math.max(ZMIN, f)); zoomF = f; try { localStorage.setItem(ZKEY, String(f)); } catch (e) {} view.scale = calcScale(f); }
function zoomStep(dir) { const cur = view.scale; let f = zoomF; for (let i = 0; i < 12; i++) { f *= dir > 0 ? 1.15 : 1 / 1.15; if (f <= ZMIN || f >= ZMAX || calcScale(f) !== cur) break; } setZoom(f); }
cv.addEventListener("wheel", e => { if (!started || anyOpen()) return; e.preventDefault(); zoomStep(e.deltaY < 0 ? 1 : -1); }, { passive: false });
let pinch = null; const tdist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
cv.addEventListener("touchstart", e => { if (e.touches.length === 2 && started && !anyOpen()) { pinch = { d: tdist(e.touches), f: zoomF }; path = []; tapMark = null; e.preventDefault(); } }, { passive: false });
cv.addEventListener("touchmove", e => { if (pinch && e.touches.length === 2) { e.preventDefault(); setZoom(pinch.f * tdist(e.touches) / pinch.d); } }, { passive: false });
cv.addEventListener("touchend", e => { if (e.touches.length < 2) pinch = null; });
$("zoomIn").addEventListener("click", e => { e.stopPropagation(); zoomStep(1); });
$("zoomOut").addEventListener("click", e => { e.stopPropagation(); zoomStep(-1); });
addEventListener("resize", resize); resize();
let lt = performance.now(), mm = 0;
function loop(t) { const dt = Math.min(60, t - lt); lt = t; if (ready) update(dt), updateNear();
  const S = SCN[P.scene]; g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; drawSky(t);
  if (ready && !(S === IN && !IMG.inBg)) {
    const sc = view.scale, vw = cv.width / sc, vh = (cv.height - 56 * view.d) / sc, sh = S === IN ? S.h + 12 : S.h + 0;
    const cx = S.w <= vw ? (S.w - vw) / 2 : Math.max(0, Math.min(S.w - vw, P.px - vw / 2)), cy = sh <= vh ? (sh - vh) / 2 : Math.max(0, Math.min(sh - vh, P.py - vh / 2));
    view.ox = -Math.round(cx * sc); view.oy = -Math.round(cy * sc); view.cx = cx; view.cy = cy;
    g.setTransform(sc, 0, 0, sc, view.ox, view.oy); g.imageSmoothingEnabled = false;
    const tops = drawWorld(t);
    g.setTransform(view.d, 0, 0, view.d, 0, 0); drawOverlay(tops, t);
    $("sceneName").textContent = (S === IN ? "✂️ " : "🌳 ") + S.name; if (started && t - mm > 100) { mm = t; drawMinimap(); } }
  requestAnimationFrame(loop); }
Object.assign(X, { P, others, Net, SCN, OUT, IN, T, walk, findPath, setPath: p => { path = p; }, getPath: () => path, g, toScreen, toWorld, pill, view, say, ownerMenu, closeAll, setUi: v => { uiOpen = v; }, isUi: () => uiOpen, isTyping: () => typing, isStarted: () => started, sys, log, bubble, banner, fountainAt, esc, faceTo, place, persist, IMG, FONT, STEP_MS, wantedDir });
build(); drawPreview(0); buildBreeds(); buildStyles();
requestAnimationFrame(loop);
window.__daon = { P, others, Net, tp(s, x, y) { place(P, SCN[s], x, y); Net.move(); }, walkTo(x, y) { path = findPath(SCN[P.scene], P.tx, P.ty, x, y); }, interact, openBoard, walk: (s, x, y) => walk(SCN[s], x, y), view, SCN,
  dump(id, z) { const S = SCN[id], c = document.createElement('canvas'); c.width = (id === 'in' ? S.w : S.w) * z; c.height = (S.h + (id === 'in' ? 12 : 0)) * z; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(z, z); x.drawImage(id === 'out' ? IMG.outBg : IMG.inBg, 0, 0); S.sprites.slice().sort((a, b) => a.sy - b.sy).forEach(s => x.drawImage(s.cv, s.x, s.y)); return c.toDataURL(); } };
})();
