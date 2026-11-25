/* ════════════════════════════════════════════════════════════════
   메종플러스 현장 웹앱 · 현장 정보 파일 (새 현장마다 이 파일을 고칩니다)

   - 고객용(index.html)과 협력업체용(partner.html)이 이 파일 하나를 함께 읽습니다.
     공정 일정은 여기에 한 번만 적으면 두 화면의 리스트·달력에 모두 반영됩니다.
   - 날짜는 반드시 'YYYY-MM-DD' 형식으로 적습니다. (예: '2027-01-04')
   - 아래 값은 해를 넘기는 예시 현장입니다. 대괄호 [ ] 부분과 날짜·공정을 바꿔 쓰세요.
   - 이 파일은 협력업체도 볼 수 있습니다. 계약 금액은 index.html, 출입 정보는
     partner.html 안에 따로 적습니다.
   ════════════════════════════════════════════════════════════════ */

window.SITE = {
  id: 'sample',                                 // 현장 약칭(영문 소문자·숫자). 폴더 이름과 같게
  brand: '메종플러스 인테리어',
  name: '[OO동] [OO아파트] [OOO동 OOOO호] ([OO평형])', // 화면 위쪽에 표시되는 현장명
  start: '2026-12-21',                          // 착공일
  end: '2027-01-15',                            // 완공·인수인계일
  workDays: [1, 2, 3, 4, 5],                    // 작업 요일 (0=일 1=월 … 6=토). 토요일 작업 시 6 추가
  holidays: ['2026-12-25', '2027-01-01'],       // 공휴일·현장 휴무일
  noiseHours: '평일 09:00~18:00',               // 소음 작업 허용 시간 (단지 관리소 규정)
  preStartStage: '착공 준비 중',                // 착공 전 상단 카드에 보일 상태 문구
  dayBase: 'workday'                            // 공사 일차 기준: 'workday'(작업일만) / 'calendar'(달력 날짜)
};

/* ── 공정 일정 ──────────────────────────────────────────────────────
   한 줄(묶음)이 공정 하나입니다. 날짜 순서대로 적습니다.
   start·end    : 공정 기간 (하루짜리는 같은 날짜)
   title        : 고객용 공정명            work : 협력업체용 공정명 (없으면 title 사용)
   cal          : 달력 칸 글자 { text, sub, tone, tag }
                  tone = green red amber blue sky violet teal orange yellow indigo slate cyan gold
   noise        : 소음 공정이면 true (고객 화면 ⚠️, 협력업체 화면 '소음주의')
   tag          : 협력업체 카드의 꼬리표 (예: '착공', '완공', '청소')
   notice       : 고객 화면 빨간 안내 한 줄
   notes        : 고객 화면 메모들. '📍'로 시작하면 파란 강조, '✔ 1.5 …'처럼 날짜로 시작하면
                  그 날짜를 달력에서 눌렀을 때만 보입니다(진행 기록).
   partnerNotes : 협력업체 화면 메모들
   partnerHtml  : 협력업체 카드 아래에 넣을 추가 HTML (발주 스펙 요약 등, 없으면 생략)
   ───────────────────────────────────────────────────────────────── */
window.SCHEDULE = [
  { start: '2026-12-21', end: '2026-12-21',
    title: '가구 철거 (착공일)', work: '가구 철거 (붙박이장, 싱크대 등)',
    cal: { text: '가구 철거', sub: '착공일', tone: 'green', tag: '착공' }, tag: '착공',
    notes: [], partnerNotes: ['가구류 전면 반출 및 폐기물 수거.'] },

  { start: '2026-12-22', end: '2026-12-23',
    title: '욕실 철거 · 1차 방수 · 문틀 철거', noise: true,
    cal: { text: '욕실 철거', sub: '방수·문틀', tone: 'red', tag: '소음' },
    notice: '※ 소음 발생 예정 공정',
    notes: [], partnerNotes: ['09시 이후 강소음 공정 시작. 타일·위생도기 철거 후 1차 방수 도포.'] },

  { start: '2026-12-24', end: '2026-12-24',
    title: '샷시 철거 및 창호 시공 · 전기 배선', noise: true,
    cal: { text: '샷시', sub: '창호·전기', tone: 'red', tag: '소음' },
    notice: '※ 샷시 반입 및 철거 소음 공정',
    notes: [], partnerNotes: ['사다리차 반입 및 창호 시공.'] },

  { start: '2026-12-28', end: '2026-12-30',
    title: '목공 공사 (천장 몰딩, 문틀, 벽체 보강)',
    cal: { text: '목공', sub: '몰딩·문틀', tone: 'amber' },
    notes: ['📍 [12.30(수) 12:00] 맞춤 가구 정밀 실측 미팅'], partnerNotes: [] },

  { start: '2026-12-31', end: '2027-01-05',
    title: '타일 시공 (욕실, 주방, 현관) 및 줄눈',
    cal: { text: '타일', sub: '욕실·주방·현관', tone: 'blue' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-06', end: '2027-01-06',
    title: '욕실 기구 세팅 · 필름 시공',
    cal: { text: '욕실 기구', sub: '필름 시공', tone: 'sky' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-07', end: '2027-01-08',
    title: '도배 (기초 밑작업 · 정배)',
    cal: { text: '도배', sub: '밑작업·정배', tone: 'teal' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-11', end: '2027-01-11',
    title: '주방 가구 세팅 · 조명·전기 마감',
    cal: { text: '싱크대', sub: '조명·전기', tone: 'orange', tag: '가구' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-12', end: '2027-01-12',
    title: '바닥재 시공',
    cal: { text: '바닥재', sub: '장판·마루', tone: 'indigo' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-13', end: '2027-01-13',
    title: '문·중문 시공 · 마감 점검',
    cal: { text: '문·중문', sub: '잔손보기', tone: 'slate' },
    notes: [], partnerNotes: [] },

  { start: '2027-01-14', end: '2027-01-14',
    title: '전문 입주청소', tag: '청소',
    cal: { text: '입주청소', sub: '준공 청소', tone: 'cyan' },
    notes: [], partnerNotes: ['분진, 창호, 욕실, 주방 전체 정밀 청소.'] },

  { start: '2027-01-15', end: '2027-01-15',
    title: '고객 최종 준공 검수 및 현장 인수인계 (완공)', tag: '완공',
    cal: { text: '준공', sub: '검수·인수인계', tone: 'gold', tag: '완공' },
    notes: [], partnerNotes: ['입주자 고객님 동행 검수 및 키 전달.'] }
];
