// 다온 마을 v7 저장소: 관리자 콘텐츠 · 문의 기록 · 방명록을 하나의 data.json 으로 보관
// GITHUB_DATA_TOKEN + GITHUB_DATA_REPO(예: abcdefc40-lab/daon-village-data) 가 있으면 GitHub 비공개 저장소에,
// 없으면 로컬 파일(DATA_FILE, 기본 ./data.json)에 저장해요. 토큰은 절대 로그에 남기지 않아요.
const fs = require("fs"), path = require("path");
const TOKEN = process.env.GITHUB_DATA_TOKEN || "", REPO = process.env.GITHUB_DATA_REPO || "", BRANCH = process.env.GITHUB_DATA_BRANCH || "main";
const FILE = process.env.DATA_FILE || path.join(__dirname, "data.json"), GH_PATH = "data.json";
const useGH = !!(TOKEN && /^[\w.-]+\/[\w.-]+$/.test(REPO));
let sha = null, timer = null, saving = false, again = false;
const empty = () => ({ v: 1, content: null, inquiries: [], guestbook: [] });
const norm = d => { const o = Object.assign(empty(), d && typeof d === "object" ? d : {}); if (!Array.isArray(o.inquiries)) o.inquiries = []; if (!Array.isArray(o.guestbook)) o.guestbook = []; return o; };
const ghURL = () => `https://api.github.com/repos/${REPO}/contents/${GH_PATH}`;
const ghH = () => ({ Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "daon-village", "X-GitHub-Api-Version": "2022-11-28" });
async function ghGet() { const r = await fetch(ghURL() + "?ref=" + BRANCH, { headers: ghH() });
  if (r.status === 404) { sha = null; return empty(); } if (!r.ok) throw new Error("GitHub 읽기 실패 HTTP " + r.status);
  const j = await r.json(); sha = j.sha; return norm(JSON.parse(Buffer.from(j.content || "", "base64").toString("utf8") || "{}")); }
async function ghPut(data, retry) { const r = await fetch(ghURL(), { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, ghH()),
    body: JSON.stringify({ message: "daon-village data " + new Date().toISOString(), branch: BRANCH, content: Buffer.from(JSON.stringify(data, null, 1)).toString("base64"), ...(sha ? { sha } : {}) }) });
  if ((r.status === 409 || r.status === 422) && !retry) { try { const r2 = await fetch(ghURL() + "?ref=" + BRANCH, { headers: ghH() }); if (r2.ok) sha = (await r2.json()).sha; } catch {} return ghPut(data, true); }
  if (!r.ok) throw new Error("GitHub 저장 실패 HTTP " + r.status); sha = (await r.json()).content.sha; }
async function load() {
  if (useGH) { try { const d = await ghGet(); console.log(`[저장소] GitHub ${REPO} 에서 불러옴 (문의 ${d.inquiries.length}, 방명록 ${d.guestbook.length})`); return d; }
    catch (e) { console.error("[저장소] " + e.message + " → 로컬 파일로 시작"); } }
  try { const d = norm(JSON.parse(fs.readFileSync(FILE, "utf8"))); console.log("[저장소] 로컬 파일 " + path.basename(FILE)); return d; } catch { return empty(); } }
function save(getData) { clearTimeout(timer); timer = setTimeout(() => flush(getData), useGH ? 4000 : 300); }
async function flush(getData) { if (saving) { again = true; return; } saving = true; const data = getData();
  try { fs.writeFileSync(FILE + ".tmp", JSON.stringify(data)); fs.renameSync(FILE + ".tmp", FILE); } catch (e) { console.error("[저장소] 로컬 저장 실패: " + e.message); }
  if (useGH) { try { await ghPut(data); } catch (e) { console.error("[저장소] " + e.message + " (다음 변경 때 다시 시도)"); } }
  saving = false; if (again) { again = false; save(getData); } }
module.exports = { load, save, flush, mode: useGH ? "github:" + REPO : "local" };
