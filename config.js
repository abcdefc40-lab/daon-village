// ===== 다온펫살롱 빌리지 기본 설정 =====
// v7부터는 /admin 관리자 페이지에서 고친 내용이 서버에 저장되고, 이 파일은 "처음 기본값"으로만 쓰여요.
(typeof window !== "undefined" ? window : globalThis).DAON_CONFIG = {
  shop: {
    name: "다온펫살롱",
    instagram: "@daongrooming",
    hours: "(예시) 영업시간 10:00~19:00 · 매주 화요일 휴무",
    address: "(예시) 주소는 추후 입력",
  },
  owner: { name: "원장님", greeting: "어서 와요! 다온펫살롱에 온 걸 환영해요 🐾" },
  menus: [
    { name: "(예시) 목욕 + 위생미용", price: "(예시) 30,000원~" },
    { name: "(예시) 전체 클리핑", price: "(예시) 45,000원~" },
    { name: "(예시) 가위컷 스타일링", price: "(예시) 70,000원~" },
    { name: "(예시) 스파 추가", price: "(예시) 10,000원" },
  ],
  reservationHowTo: "(예시) 원장님께 '📅 예약 문의'를 고르면 원하는 날짜·서비스를 남길 수 있어요. 인스타그램 DM도 좋아요.",
  board: {
    notices: [
      { date: "(예시) 10/27", text: "(예시) 11월 예약 오픈했어요!" },
      { date: "(예시) 10/20", text: "(예시) 첫 방문 고객 스파 서비스 이벤트" },
    ],
    slots: [
      { day: "(예시) 10/29 (목)", times: ["10:00", "14:00"] },
      { day: "(예시) 10/30 (금)", times: ["11:00"] },
      { day: "(예시) 10/31 (토)", times: ["13:00", "16:00"] },
    ],
    contactLink: "#", // 외부 예약 링크 (네이버 예약, 카카오 채널 등). '#'이면 원장님 문의 흐름을 써요.
  },
  // 원장님 대화: kind = flow(질문 흐름) · reply(답장 문구) · menu(미용 메뉴) · hours(영업시간) · howto(예약 방법) · board · quest · gb
  dialogue: {
    choices: [
      { label: "📅 예약 문의", kind: "flow", flow: "reserve" },
      { label: "💰 가격 문의", kind: "flow", flow: "price" },
      { label: "✂️ 미용 상담", kind: "flow", flow: "consult" },
      { label: "✂️ 미용 메뉴 안내", kind: "menu" },
      { label: "⏰ 영업시간", kind: "hours" },
      { label: "👋 인사", kind: "reply", reply: "오늘도 털이 반짝반짝하네요 ✨ 언제나 환영이에요." },
      { label: "📌 게시판 보기", kind: "board" },
      { label: "🎁 심부름(퀘스트)", kind: "quest" },
      { label: "📖 방명록", kind: "gb" },
    ],
  },
  flows: [
    { id: "reserve", label: "예약 문의", intro: "예약 문의를 도와드릴게요! 몇 가지만 골라 주세요.", done: "문의가 원장님께 전달됐어요! 확인 후 연락드릴게요 💌",
      questions: [
        { key: "service", q: "어떤 서비스를 원하세요?", type: "choice", options: ["목욕 + 위생미용", "전체 클리핑", "가위컷 스타일링", "스파 추가"] },
        { key: "date", q: "원하는 날짜는요?", type: "choice", options: ["이번 주", "다음 주", "주말", "날짜 직접 적기"] },
        { key: "time", q: "원하는 시간대는요?", type: "choice", options: ["오전", "오후", "상관없어요"] },
        { key: "message", q: "남기실 말씀이 있으면 적어 주세요. (원하는 날짜, 몸무게 등)", type: "text", optional: true },
        { key: "contact", q: "연락받을 방법이 있으면 적어 주세요. (선택 · 인스타 아이디 등)", type: "text", optional: true },
      ] },
    { id: "price", label: "가격 문의", intro: "가격이 궁금하시군요! 우리 아이에 대해 알려 주세요.", done: "가격 문의가 접수됐어요. 원장님이 확인하고 알려 드릴게요 💰",
      questions: [
        { key: "service", q: "어떤 서비스 가격이 궁금하세요?", type: "choice", options: ["목욕 + 위생미용", "전체 클리핑", "가위컷 스타일링", "스파 추가"] },
        { key: "weight", q: "몸무게는 어느 정도예요?", type: "choice", options: ["3kg 미만", "3~5kg", "5~8kg", "8kg 이상"] },
        { key: "message", q: "더 궁금한 점이 있으면 적어 주세요.", type: "text", optional: true },
        { key: "contact", q: "연락받을 방법 (선택)", type: "text", optional: true },
      ] },
    { id: "consult", label: "미용 상담", intro: "미용 상담이에요! 원하는 스타일을 같이 골라 봐요.", done: "상담 내용이 원장님께 전달됐어요 ✂️",
      questions: [
        { key: "style", q: "원하는 스타일은요?", type: "choice", options: ["곰돌이컷", "썸머컷", "하이바컷", "풀코트 정리", "원장님 추천"] },
        { key: "concern", q: "고민이 있나요?", type: "choice", options: ["엉킴이 심해요", "피부가 예민해요", "미용을 무서워해요", "특별히 없어요"] },
        { key: "message", q: "자세히 적어 주세요.", type: "text", optional: true },
        { key: "contact", q: "연락받을 방법 (선택)", type: "text", optional: true },
      ] },
  ],
};
if (typeof module !== "undefined") module.exports = globalThis.DAON_CONFIG;
