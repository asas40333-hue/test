/* ════════════════════════════════════════════════════════════════
   ② 현장 정보 파일 (data.js) — 현장마다 이 파일 하나만 고칩니다.

   고치는 법
   - 작은따옴표 ' ' 안의 글자, 숫자, 날짜만 바꿉니다.
   - 따옴표 ' '  쉼표 ,  괄호 { } [ ] 는 지우지 않습니다.
   - 날짜는 반드시 '2027-03-08' 처럼 연-월-일 로 적습니다.
   - 줄을 늘릴 때는 { ... }, 한 묶음을 통째로 복사해서 붙여 넣고 글자만 바꿉니다.
   - 사진은 images 폴더에 넣고 'images/파일이름.jpg' 로 적습니다.
   - 저장한 뒤 화면이 하얗게 나오면 지운 쉼표나 따옴표가 있는지 확인하세요.

   ⚠️ 이 파일은 링크를 아는 사람이면 열어 볼 수 있습니다.
      현관 비밀번호는 적지 말고 문자로 안내하는 것을 권합니다.
      금액을 협력업체에 보이고 싶지 않으면 PAYMENT 의 show 를 false 로 두세요.
   ════════════════════════════════════════════════════════════════ */


/* ── 1. 현장 기본 정보 ─────────────────────────────────────────── */
window.SITE = {
  demo: true,             // 판매 데모 전용: true 면 날짜가 '오늘' 기준으로 자동 이동해 늘 공사 중으로 보입니다.
                          // ★ 실제 현장에 쓸 때는 반드시 false 로 바꾸세요.
  id: 'sample-101-1203',  // 현장 구분 이름 (영문·숫자, 현장마다 다르게)
  name: '샘플아파트 101동 1203호 (32평형)',   // 화면 맨 위에 보이는 현장명
  start: '2026-11-30',    // 착공일
  end: '2026-12-24',      // 완공·인수인계일
  workDays: [1, 2, 3, 4, 5],   // 작업 요일 (0=일 1=월 2=화 3=수 4=목 5=금 6=토). 토요일 작업 시 6 추가
  holidays: [],                // 공휴일·현장 휴무일. 예) ['2026-12-25', '2027-01-01']
  noiseHours: '평일 09:00~18:00',
  preStartStage: '착공 준비 중',
  dayBase: 'workday'      // 공사 일차 세는 법: 'workday'(작업일만) / 'calendar'(달력 날짜)
};


/* ── 2. 공정 일정 ──────────────────────────────────────────────────
   한 묶음 { } 이 공정 하나입니다. 고객용·협력업체용 리스트와 달력에 함께 나옵니다.
   start / end : 공정 기간 (하루짜리는 같은 날짜)
   title       : 고객에게 보이는 공정명
   work        : 협력업체에게 보이는 공정명 (없으면 title 과 같게 표시)
   cal         : 달력 칸 글자 { text: 큰 글씨, sub: 작은 글씨, tone: 색, tag: 꼬리표 }
                 tone 색: green red amber blue sky violet teal orange yellow indigo slate cyan gold
   noise       : 소음 공정이면 true
   tag         : 협력업체 카드 꼬리표 (예: '착공', '완공', '청소')
   notice      : 고객 화면 빨간 안내 한 줄
   notes       : 고객 화면 메모 ('📍'로 시작하면 파란 강조)
   partnerNotes: 협력업체 화면 메모
   ───────────────────────────────────────────────────────────────── */
window.SCHEDULE = [
  { start: '2026-11-30', end: '2026-11-30',
    title: '가구 철거 (착공일)', work: '가구 철거 (붙박이장·싱크대·신발장)',
    cal: { text: '가구 철거', sub: '착공일', tone: 'green', tag: '착공' }, tag: '착공',
    notes: ['착공 전 현장 사진을 모두 기록해 두었습니다.'],
    partnerNotes: ['가구류 전면 반출 및 폐기물 당일 수거.'] },

  { start: '2026-12-01', end: '2026-12-02',
    title: '욕실 철거 · 1차 방수 · 문틀 철거', noise: true,
    cal: { text: '욕실 철거', sub: '방수·문틀', tone: 'red', tag: '소음' },
    notice: '※ 소음 발생 예정 공정 (09시 이후 시작)',
    notes: [], partnerNotes: ['09시 이후 강소음 공정 시작. 타일·도기 철거 후 1차 방수 도포.'] },

  { start: '2026-12-03', end: '2026-12-03',
    title: '샷시 철거 및 창호 시공', noise: true,
    cal: { text: '샷시', sub: '창호 교체', tone: 'red', tag: '소음' },
    notice: '※ 사다리차 사용 · 철거 소음 공정',
    notes: [], partnerNotes: ['사다리차 08:30 도착. 주차장 입구 쪽 공간 확보.'] },

  { start: '2026-12-04', end: '2026-12-04',
    title: '전기 배선 · 설비 배관',
    cal: { text: '전기·설비', sub: '배선·배관', tone: 'violet' },
    notes: [], partnerNotes: ['주방 아일랜드 콘센트 2구 위치 바닥 표시 확인.'] },

  { start: '2026-12-07', end: '2026-12-09',
    title: '목공 공사 (천장 몰딩, 문틀, 벽체 보강)',
    cal: { text: '목공', sub: '몰딩·문틀', tone: 'amber' },
    notes: ['📍 12월 9일(수) 오후 2시 주방 가구 실측 미팅'], partnerNotes: [] },

  { start: '2026-12-10', end: '2026-12-15',
    title: '타일 시공 (욕실 2곳, 주방 벽, 현관) 및 줄눈',
    cal: { text: '타일', sub: '욕실·주방·현관', tone: 'blue' },
    notes: [], partnerNotes: ['욕실 벽 600×300 · 바닥 300×300, 줄눈 그레이.'] },

  { start: '2026-12-16', end: '2026-12-16',
    title: '욕실 기구 세팅 · 필름 시공',
    cal: { text: '욕실 기구', sub: '필름 시공', tone: 'sky' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-17', end: '2026-12-18',
    title: '도배 (기초 밑작업 · 정배)',
    cal: { text: '도배', sub: '밑작업·정배', tone: 'teal' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-21', end: '2026-12-21',
    title: '주방 가구 세팅 · 조명·전기 마감',
    cal: { text: '싱크대', sub: '조명·전기', tone: 'orange', tag: '가구' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-22', end: '2026-12-22',
    title: '바닥재 시공 (강마루)',
    cal: { text: '강마루', sub: '바닥재', tone: 'indigo' },
    notes: [], partnerNotes: ['시공 후 24시간 보행 자제 안내.'] },

  { start: '2026-12-23', end: '2026-12-23',
    title: '중문 시공 · 마감 점검 · 입주청소', tag: '청소',
    cal: { text: '중문·청소', sub: '마감 점검', tone: 'cyan' },
    notes: [], partnerNotes: ['오전 중문 시공, 오후 입주청소 팀 투입.'] },

  { start: '2026-12-24', end: '2026-12-24',
    title: '고객 최종 검수 및 현장 인수인계 (완공)', tag: '완공',
    cal: { text: '준공', sub: '검수·인수인계', tone: 'gold', tag: '완공' },
    notes: [], partnerNotes: ['고객님 동행 검수 및 열쇠·보증서 전달.'] }
];


/* ── 3. 현장 일지 (고객용) ─────────────────────────────────────────
   최신 날짜가 자동으로 맨 위에 옵니다. 'N일차'도 날짜로 자동 계산됩니다.
   오늘보다 뒤 날짜로 적은 일지는 그날이 되기 전까지 숨겨집니다.
   photos: 사진 목록. 4장까지는 크게, 5장부터는 앞 2장만 보이고 나머지는 펼치기 버튼 안에 들어갑니다.
   ───────────────────────────────────────────────────────────────── */
window.LOGS = [
  { date: '2026-11-30', title: '착공 · 가구 철거 · 공사 전 현황 기록',
    text: '착공 첫날입니다. 붙박이장, 싱크대, 신발장을 철거해 반출했고, 철거 전 집 안 모든 공간을 사진으로 기록해 두었습니다.\n내일부터 이틀간 욕실 철거와 1차 방수가 진행됩니다. (소음 공정)',
    photos: [
      { src: 'images/pre_entry.svg', caption: '현관 (철거 전 현황)' },
      { src: 'images/pre_living.svg', caption: '거실 (철거 전 현황)' },
      { src: 'images/pre_kitchen.svg', caption: '주방 (철거 전 현황)' },
      { src: 'images/pre_bath.svg', caption: '거실 욕실 (철거 전 현황)' },
      { src: 'images/pre_room.svg', caption: '안방 (철거 전 현황)' },
      { src: 'images/pre_balcony.svg', caption: '발코니 (철거 전 현황)' }
    ] },

  { date: '2026-12-01', title: '욕실 철거 · 문틀 철거',
    text: '거실 욕실과 안방 욕실의 타일과 도기를 모두 걷어냈습니다. 바닥 배관 상태를 확인했고 이상은 없습니다.\n관리사무소 규정에 맞춰 오전 9시 이후에 소음 작업을 시작했습니다.',
    photos: [ { src: 'images/log_demolition.svg', caption: '욕실 철거 후 모습' } ] },

  { date: '2026-12-02', title: '욕실 1차 방수',
    text: '철거한 욕실 바닥과 벽 하단에 방수층을 칠했습니다. 마른 뒤 물을 채워 새는 곳이 없는지 하루 동안 확인합니다.',
    photos: [ { src: 'images/log_waterproof.svg', caption: '욕실 1차 방수 도포' } ] },

  { date: '2026-12-03', title: '창호 교체',
    text: '거실과 안방의 오래된 샷시를 철거하고 새 창호를 달았습니다. 단열과 소음 차단이 좋아집니다.',
    photos: [ { src: 'images/log_window.svg', caption: '거실 창호 교체' } ] },

  { date: '2026-12-07', title: '목공 · 천장 몰딩과 문틀',
    text: '천장 몰딩과 문틀 작업을 시작했습니다. 주방 쪽 벽은 상부장을 단단히 달 수 있도록 보강재를 넣었습니다.',
    photos: [ { src: 'images/log_wood.svg', caption: '문틀·벽체 보강 목공' } ] },

  { date: '2026-12-10', title: '욕실 벽 타일 시공',
    text: '거실 욕실 벽 타일을 붙였습니다. 줄눈은 그레이 색으로 마감합니다.',
    photos: [
      { src: 'images/log_tile.svg', caption: '거실 욕실 벽 타일' },
      { src: 'images/log_tile_kitchen.svg', caption: '주방 벽 타일 준비' }
    ] }
];


/* ── 4. 자재 스펙 (고객용) ─────────────────────────────────────────
   notice : 자재 탭 맨 위 노란 안내 (비워 두려면 '')
   groups : 공간·공종별 카드
     status: 'confirmed'(확정, 초록) 또는 'recommended'(추천·협의 중, 노랑)
     statusText: 꼬리표 글자 (예: '12/2 확정')
     photos: 사진 카드 { src, tag(위치), name(품목·모델), desc(브랜드·특징) }
     items : 목록 { icon(이모지) 또는 photo(사진), name, desc }
     note  : 카드 아래 작은 안내
   ───────────────────────────────────────────────────────────────── */
window.SPECS = {
  notice: '\'추천(협의)\' 품목은 실속형 표준 사양이며, 미팅 때 원하시는 색상·모델로 바로 바꿔 드립니다.',
  groups: [
    { en: 'BATHROOM', title: '욕실 자재 사양', status: 'confirmed', statusText: '12/2 확정',
      photos: [
        { src: 'images/spec_wall_tile.svg', tag: '욕실 벽', name: '벽 타일 600×300', desc: '무광 화이트 스톤 · 줄눈 그레이' },
        { src: 'images/spec_floor_tile.svg', tag: '욕실 바닥', name: '바닥 타일 300×300', desc: '논슬립 그레이 · 미끄럼 방지' },
        { src: 'images/spec_basin.svg', tag: '거실 욕실', name: '반다리 세면기', desc: '벽걸이형 · 하부 청소가 쉬움' }
      ],
      items: [
        { icon: '🚽', name: '양변기 — 원피스 절수형', desc: '욕실 2곳 · 소프트 클로징 시트' },
        { icon: '🚿', name: '샤워 수전 — 해바라기 세트', desc: '무광 니켈 · 슬라이드바 포함' },
        { icon: '🌀', name: '욕실 환풍기 — 역류 방지형', desc: '욕실 2곳 · 타이머 스위치' }
      ],
      note: '※ 욕실 수납장은 고객님 요청으로 제외했습니다 (추가·변경 내역 참고).' },

    { en: 'KITCHEN', title: '주방 자재 사양', status: 'confirmed', statusText: '12/9 확정',
      photos: [
        { src: 'images/spec_counter.svg', tag: '상판', name: '인조대리석 상판', desc: '화이트 계열 · 12T' },
        { src: 'images/spec_faucet.svg', tag: '싱크', name: '주방 수전', desc: '니켈 · 풀아웃 헤드' }
      ],
      items: [
        { icon: '🍳', name: '싱크볼 — 사각 엠보볼', desc: '스크래치에 강한 엠보 마감' },
        { icon: '💨', name: '후드 — 빌트인 600', desc: '상부장 매립형' }
      ],
      note: '' },

    { en: 'FLOOR · DOOR', title: '바닥재 · 도어', status: 'confirmed', statusText: '12/4 확정',
      photos: [
        { src: 'images/spec_floor.svg', tag: '전체', name: '강마루 (내추럴 오크)', desc: '장판에서 변경 · 추가 공사' },
        { src: 'images/spec_door.svg', tag: '방 3곳', name: '도어 (화이트 무광)', desc: '레버 핸들 블랙' }
      ],
      items: [],
      note: '' },

    { en: 'LIGHTING', title: '조명 사양', status: 'recommended', statusText: '추천(협의)',
      photos: [],
      items: [
        { photo: 'images/spec_light.svg', name: '거실등 — LED 사각 3등', desc: '플리커프리 · 주광색' },
        { icon: '💡', name: '다운라이트 — 3인치 LED 7W', desc: '주방·식탁·현관 · 주백색' }
      ],
      note: '※ 12/16 미팅에서 색온도를 최종 확정합니다.' }
  ]
};


/* ── 5. 계약 · 정산 (고객용) ───────────────────────────────────────
   show    : 금액을 보여 줄지 (고객 동의 없으면 false)
   total   : 최초 계약 금액 (원, 숫자만 · 쉼표 없이)
   vat     : 부가세 안내 문구
   steps   : 회차별 { label, ratio(%), due(입금 시점), paid: [{ date, amount }] }
   changes : 추가·변경 견적. 늘어나면 +금액, 줄어들면 -금액 (예: 1500000 / -200000)
   changesDue  : 추가·변경 금액을 언제 받는지
   changesPaid : 추가·변경 금액 입금 내역 [{ date, amount }]
   합계·최종 금액·남은 금액은 자동으로 계산됩니다.
   ───────────────────────────────────────────────────────────────── */
window.PAYMENT = {
  show: true,
  total: 38000000,
  vat: '(부가세 별도)',
  steps: [
    { label: '계약금',     ratio: 10, due: '계약 시',      paid: [{ date: '2026-11-20', amount: 3800000 }] },
    { label: '1차 중도금', ratio: 30, due: '착공 시',      paid: [{ date: '2026-11-30', amount: 11400000 }] },
    { label: '2차 중도금', ratio: 30, due: '목공 완료 후', paid: [{ date: '2026-12-10', amount: 11400000 }] },
    { label: '잔금',       ratio: 30, due: '준공 검수 후', paid: [] }
  ],
  changes: [
    { date: '2026-12-02', title: '바닥재 변경 (장판 → 강마루)', amount: 1500000 },
    { date: '2026-12-02', title: '현관 디지털 도어락 신설',     amount: 250000 },
    { date: '2026-12-02', title: '욕실 수납장 제외 (고객 요청)', amount: -200000 }
  ],
  changesDue: '잔금과 함께',
  changesPaid: [],
  note: '공정 변경으로 금액이 조정될 경우에는 반영 전에 먼저 말씀드립니다.'
};


/* ── 6. 출입 · 안내 (협력업체용) ───────────────────────────────────
   doorCode : 세대 현관 비밀번호. 기본은 '' (빈칸) → "대표가 문자로 따로 안내" 로 보입니다.
              적었다면 완공 후 꼭 지우고, 고객님께 비밀번호 변경을 안내하세요.
   대표 이름·연락처는 site.js 의 내용이 자동으로 들어갑니다.
   ───────────────────────────────────────────────────────────────── */
window.ACCESS = {
  address: '서울특별시 샘플구 샘플로 123, 샘플아파트 101동 1203호',
  lobby: '공동현관 호출 1203 → 연결 안 되면 관리실 호출',
  doorCode: '',
  parking: '지하 2층 방문 차량 구역 (차량 번호를 관리실에 미리 등록)',
  rules: [
    ['소음 공사 허용 시간', '평일 09:00~18:00 (점심 12:00~13:00 소음 자제 · 주말·공휴일 불가)'],
    ['승강기(엘리베이터)', '보양재 훼손 주의, 자재 운반 후 승강기 바닥 청소'],
    ['폐기물 처리', '당일 발생 폐기물은 당일 반출 (단지 내 적치 금지)'],
    ['작업 완료 후', '퇴실 시 창문 잠금·소등, 세대 도어락 잠금 확인 필수']
  ]
};


/* ── 7. 공사 전 사진 · 특이사항 (협력업체용) ────────────────────────
   photos : 공사 전 사진. 앞의 hero 장수만큼 크게 보이고, 전체는 펼치기 버튼 안에 있습니다.
   notices: 작업 전 꼭 볼 특이사항. photo 에 사진 순서 번호(1부터)를 적으면 '사진 보기' 버튼이 생깁니다.
   ───────────────────────────────────────────────────────────────── */
window.PARTNER = {
  hero: 4,
  photos: [
    { src: 'images/pre_entry.svg', caption: '현관 (공사 전)' },
    { src: 'images/pre_living.svg', caption: '거실 (공사 전)' },
    { src: 'images/pre_kitchen.svg', caption: '주방 (공사 전)' },
    { src: 'images/pre_bath.svg', caption: '거실 욕실 (공사 전)' },
    { src: 'images/pre_room.svg', caption: '안방 (공사 전)' },
    { src: 'images/pre_balcony.svg', caption: '발코니 (공사 전)' }
  ],
  notices: [
    { title: '거실 욕실 · 바닥 배수 느림', text: '철거 후 배수구 위치를 다시 확인하고, 구배를 잡아 주세요.', photo: 4 },
    { title: '주방 · 상부장 벽 보강 필요', text: '상부장 설치 벽이 석고보드라 목공 때 보강재를 넣어야 합니다.', photo: 3 }
  ]
};
