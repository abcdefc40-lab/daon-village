// 다온펫살롱 관리자 페이지 (v7) — 관리자 키는 이 탭의 sessionStorage 에만 잠시 보관돼요.
(() => {
"use strict";
const $ = id => document.getElementById(id);
let KEY = sessionStorage.getItem("daonAdminKey") || "", C = null, INQ = [], dirty = false;
const KINDS = { flow: "문의 흐름 시작", reply: "답장 문구", menu: "미용 메뉴 보여주기", hours: "영업시간 보여주기", howto: "예약 방법 보여주기", board: "게시판 열기", quest: "심부름 목록", gb: "방명록 열기" };
function el(tag, props, ...kids) { const e = document.createElement(tag); for (const k in props || {}) { if (k === "on") for (const ev in props.on) e.addEventListener(ev, props.on[ev]); else if (k in e && k !== "list") e[k] = props[k]; else e.setAttribute(k, props[k]); } kids.flat().forEach(c => c != null && e.append(c)); return e; }
async function api(path, opt = {}) { const r = await fetch("/api/admin/" + path, Object.assign({}, opt, { headers: Object.assign({ "X-Admin-Key": KEY, "Content-Type": "application/json" }, opt.headers || {}) }));
  const j = await r.json().catch(() => ({})); if (r.status === 401 || r.status === 403) { logout(j.error || "관리자 키가 맞지 않아요."); throw new Error("auth"); } if (!r.ok || j.error) throw new Error(j.error || "HTTP " + r.status); return j; }
function status(t, ok) { const s = $("status"); s.textContent = t; s.style.color = ok ? "#3a8a5a" : "#d9447f"; clearTimeout(s._t); s._t = setTimeout(() => s.textContent = dirty ? "저장하지 않은 변경이 있어요." : "", 4000); }
function logout(msg) { KEY = ""; sessionStorage.removeItem("daonAdminKey"); $("app").classList.add("hidden"); $("login").classList.remove("hidden"); $("loginMsg").textContent = msg || ""; }
async function login() { try { const p = await api("ping"); sessionStorage.setItem("daonAdminKey", KEY); $("login").classList.add("hidden"); $("app").classList.remove("hidden");
    status(`접속됨 · 저장소: ${p.store.startsWith("github") ? "GitHub 비공개 저장소" : "서버 로컬 파일 (재배포 때 지워질 수 있어요)"} · 알림: ${p.notify ? "켜짐" : "꺼짐"}`, true);
    await Promise.all([loadContent(), loadInq(), loadGb()]); } catch (e) { if (e.message !== "auth") $("loginMsg").textContent = e.message; } }
$("loginForm").onsubmit = e => { e.preventDefault(); KEY = $("key").value; $("key").value = ""; login(); };
$("logout").onclick = () => logout("나갔어요.");
document.querySelectorAll("#tabs button[data-t]").forEach(b => b.onclick = () => { document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("sel", x === b)); document.querySelectorAll(".tab").forEach(t => t.classList.toggle("hidden", t.id !== "t-" + b.dataset.t)); });
// ---------- 문의 ----------
async function loadInq() { INQ = (await api("inquiries")).inquiries; renderInq(); }
function renderInq() { const L = $("inqList"); L.innerHTML = ""; const only = $("onlyNew").checked, list = INQ.filter(i => !only || i.status === "new");
  const n = INQ.filter(i => i.status === "new").length; $("newCount").textContent = n ? n : "";
  if (!list.length) { L.append(el("p", { className: "empty", textContent: only ? "새 문의가 없어요 🎉" : "아직 문의가 없어요." })); return; }
  list.forEach(i => { const memo = el("input", { value: i.memo || "", placeholder: "메모 (예: 11/3 14시로 연락함)" });
    L.append(el("div", { className: "inq " + i.status },
      el("div", { className: "h" }, el("span", { className: "badge", textContent: i.status === "new" ? "새 문의" : "처리됨" }), el("b", { textContent: i.flowLabel }), el("span", { textContent: i.time }), el("span", { textContent: "#" + i.id.slice(0, 6) })),
      el("div", { textContent: `🐶 ${i.nickname} · ${i.dog.breedName} ${i.dog.styleName}` }),
      el("ul", {}, i.choices.map(c => el("li", { textContent: `${c.q} → ${c.a || "—"}` }))),
      i.message ? el("div", { className: "m", textContent: "💬 " + i.message }) : null,
      i.contact ? el("div", { className: "m", textContent: "📞 연락: " + i.contact }) : null,
      el("div", { className: "row" }, memo,
        el("button", { className: "mini", textContent: i.status === "new" ? "✅ 처리 완료" : "↩ 새 문의로", on: { click: () => patch(i, { status: i.status === "new" ? "handled" : "new", memo: memo.value }) } }),
        el("button", { className: "mini", textContent: "메모 저장", on: { click: () => patch(i, { memo: memo.value }) } }),
        el("button", { className: "mini del", textContent: "삭제", on: { click: async () => { if (!confirm("이 문의를 지울까요?")) return; await api("inquiries/" + i.id, { method: "DELETE" }); loadInq(); } } })))); }); }
async function patch(i, b) { try { const j = await api("inquiries/" + i.id, { method: "PATCH", body: JSON.stringify(b) }); Object.assign(i, j.inquiry); renderInq(); status("저장했어요.", true); } catch (e) { status(e.message); } }
$("onlyNew").onchange = renderInq; $("reloadInq").onclick = () => loadInq().then(() => status("새로고침했어요.", true));
setInterval(() => { if (KEY && !$("app").classList.contains("hidden")) loadInq().catch(() => {}); }, 30000);
// ---------- 콘텐츠 편집 ----------
async function loadContent() { C = await fetch("/api/content", { cache: "no-store" }).then(r => r.json()); C.dialogue = C.dialogue || { choices: [] }; C.flows = C.flows || []; dirty = false; renderContent(); }
const get = (o, p) => p.split(".").reduce((a, k) => a && a[k], o), set = (o, p, v) => { const ks = p.split("."), l = ks.pop(); ks.reduce((a, k) => a[k] = a[k] || {}, o)[l] = v; };
const mark = () => { dirty = true; $("status").textContent = "저장하지 않은 변경이 있어요."; $("status").style.color = "#d9447f"; };
const inp = (obj, k, ph, tag = "input") => { const e = el(tag, { value: obj[k] == null ? "" : obj[k], placeholder: ph || "" }); if (tag === "textarea") e.rows = 2; e.oninput = () => { obj[k] = e.value; mark(); }; return e; };
const ctrl = (arr, i, rerender) => [el("button", { className: "mini", textContent: "▲", title: "위로", on: { click: () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; mark(); rerender(); } } } }),
  el("button", { className: "mini", textContent: "▼", title: "아래로", on: { click: () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; mark(); rerender(); } } } }),
  el("button", { className: "mini del", textContent: "✕", title: "삭제", on: { click: () => { arr.splice(i, 1); mark(); rerender(); } } })];
function renderContent() {
  document.querySelectorAll("[data-f]").forEach(e => { const v = get(C, e.dataset.f); e.value = v == null || v === "#" ? "" : v; e.oninput = () => { set(C, e.dataset.f, e.value); mark(); }; });
  renderMenus(); renderNotices(); renderSlots(); renderChoices(); renderFlows(); }
function renderMenus() { const L = $("menus"); L.innerHTML = ""; C.menus.forEach((m, i) => L.append(el("div", { className: "row item" }, inp(m, "name", "메뉴 이름"), inp(m, "price", "가격"), ctrl(C.menus, i, renderMenus)))); }
function renderNotices() { const L = $("notices"); L.innerHTML = ""; C.board.notices.forEach((n, i) => L.append(el("div", { className: "row item" }, (() => { const e = inp(n, "date", "날짜"); e.style.maxWidth = "110px"; return e; })(), inp(n, "text", "공지 내용", "textarea"), ctrl(C.board.notices, i, renderNotices)))); }
function renderSlots() { const L = $("slots"); L.innerHTML = ""; C.board.slots.forEach((s, i) => { const t = el("input", { value: s.times.join(", "), placeholder: "10:00, 14:00" }); t.oninput = () => { s.times = t.value.split(/[,，]/).map(x => x.trim()).filter(Boolean); mark(); };
  L.append(el("div", { className: "row item" }, inp(s, "day", "날짜 (예: 11/3 (월))"), t, ctrl(C.board.slots, i, renderSlots))); }); }
function renderChoices() { const L = $("choices"); L.innerHTML = ""; C.dialogue.choices.forEach((c, i) => {
    const kind = el("select", {}, Object.entries(KINDS).map(([k, v]) => el("option", { value: k, textContent: v }))); kind.value = c.kind;
    const extra = el("div"); const fill = () => { extra.innerHTML = ""; if (c.kind === "reply") extra.append(el("label", {}, "원장님 답장 ({nick} = 손님 이름)", inp(c, "reply", "", "textarea")));
      if (c.kind === "flow") { const s = el("select", {}, C.flows.map(f => el("option", { value: f.id, textContent: `${f.label} (${f.id})` }))); s.value = c.flow; if (!c.flow && C.flows[0]) c.flow = C.flows[0].id; s.onchange = () => { c.flow = s.value; mark(); }; extra.append(el("label", {}, "시작할 문의 흐름", s)); } };
    kind.onchange = () => { c.kind = kind.value; mark(); fill(); }; fill();
    L.append(el("div", { className: "item" }, el("div", { className: "row" }, inp(c, "label", "버튼 글자 (예: 📅 예약 문의)"), kind, ctrl(C.dialogue.choices, i, renderChoices)), extra)); }); }
function renderFlows() { const L = $("flows"); L.innerHTML = ""; C.flows.forEach((f, i) => { const qs = el("div");
    const rq = () => { qs.innerHTML = ""; f.questions.forEach((q, j) => { const type = el("select", {}, el("option", { value: "choice", textContent: "버튼 고르기" }), el("option", { value: "text", textContent: "글 적기" })); type.value = q.type;
      const opts = el("input", { value: (q.options || []).join(", "), placeholder: "선택지 (쉼표로 구분)" }); opts.oninput = () => { q.options = opts.value.split(/[,，]/).map(x => x.trim()).filter(Boolean); mark(); };
      opts.style.display = q.type === "text" ? "none" : ""; type.onchange = () => { q.type = type.value; opts.style.display = q.type === "text" ? "none" : ""; mark(); };
      const opt = el("input", { type: "checkbox", checked: !!q.optional }); opt.style.width = "auto"; opt.onchange = () => { q.optional = opt.checked; mark(); };
      qs.append(el("div", { className: "q" }, el("div", { className: "row" }, el("b", { textContent: `질문 ${j + 1}` }), (() => { const k = inp(q, "key", "키"); k.style.maxWidth = "110px"; k.title = "message·contact 는 특별 키"; return k; })(), type, el("label", { style: "margin:0" }, opt, " 선택(건너뛰기 가능)"), ctrl(f.questions, j, rq)),
        inp(q, "q", "질문 문장"), opts)); }); };
    rq();
    L.append(el("div", { className: "item flow" }, el("div", { className: "row" }, el("b", { textContent: "📋" }), inp(f, "label", "흐름 이름 (예: 예약 문의)"), (() => { const k = inp(f, "id", "id"); k.style.maxWidth = "120px"; k.title = "영문 id (선택지에서 연결)"; return k; })(), ctrl(C.flows, i, () => { renderFlows(); renderChoices(); })),
      el("label", {}, "시작 말", inp(f, "intro", "", "textarea")), qs,
      el("button", { className: "mini add", textContent: "+ 질문 추가", on: { click: () => { f.questions.push({ key: "q" + (f.questions.length + 1), q: "", type: "choice", options: [], optional: false }); mark(); rq(); } } }),
      el("label", {}, "보낸 뒤 손님에게 보여줄 말", inp(f, "done", "", "textarea")))); }); }
document.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const k = b.dataset.add;
  if (k === "menus") { C.menus.push({ name: "", price: "" }); renderMenus(); } if (k === "notices") { C.board.notices.unshift({ date: "", text: "" }); renderNotices(); }
  if (k === "slots") { C.board.slots.push({ day: "", times: [] }); renderSlots(); } if (k === "choices") { C.dialogue.choices.push({ label: "", kind: "reply", reply: "" }); renderChoices(); }
  if (k === "flows") { C.flows.push({ id: "flow" + (C.flows.length + 1), label: "새 문의", intro: "", done: "전달됐어요!", questions: [{ key: "message", q: "무엇이 궁금하세요?", type: "text", optional: false }] }); renderFlows(); renderChoices(); } mark(); });
document.querySelectorAll(".saveBtn").forEach(b => b.onclick = async () => { try { if (!C.board.contactLink) C.board.contactLink = "#"; const j = await api("content", { method: "PUT", body: JSON.stringify(C) }); C = j.content; dirty = false; renderContent(); status("💾 저장했어요! 마을에 바로 반영돼요.", true); } catch (e) { status("저장 실패: " + e.message); } });
$("resetContent").onclick = async () => { if (!confirm("모든 가게·게시판·대화 내용을 처음 기본값으로 되돌릴까요?")) return; try { await api("content/reset", { method: "POST" }); await loadContent(); status("기본값으로 되돌렸어요.", true); } catch (e) { status(e.message); } };
addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
// ---------- 방명록 ----------
async function loadGb() { const list = (await api("guestbook")).entries, L = $("gbList"); L.innerHTML = "";
  const unesc = s => { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; };
  if (!list.length) L.append(el("p", { className: "empty", textContent: "아직 글이 없어요." }));
  list.forEach(e => L.append(el("div", { className: "gbe" }, el("span", { textContent: e.kind === "ilchon" ? "💌" : "📖" }), el("b", { textContent: unesc(e.nick) }), el("span", { className: "t", textContent: unesc(e.text) }), el("small", { textContent: new Date(e.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) }),
    el("button", { className: "mini del", textContent: "삭제", on: { click: async () => { if (!confirm("이 글을 지울까요?")) return; const r = await fetch("/api/guestbook/" + e.id, { method: "DELETE", headers: { "X-Admin-Key": KEY } }); const j = await r.json(); status(j.error || "지웠어요.", !j.error); loadGb(); } } })))); }
$("reloadGb").onclick = () => loadGb();
if (KEY) login();
})();
