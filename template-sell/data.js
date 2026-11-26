/* ════════════════════════════════════════════════════════════════
   ② 현장 데이터 파일 (data.js) — 현장마다 이 파일 하나만 고칩니다.

   지금 들어 있는 내용은 시연용 가상 현장(샘플아파트 32평형)입니다.
   실제 고객 정보는 하나도 들어 있지 않습니다. 내 현장 내용으로 바꿔 쓰세요.

   ✏️ 고치는 법 (꼭 지켜 주세요)
   - 작은따옴표 ' ' 안의 글자만 바꿉니다. 따옴표·쉼표(,)·괄호 { } [ ] 는 지우지 마세요.
   - 글자 안에 작은따옴표(')를 쓰고 싶으면 \' 처럼 앞에 \ 를 붙이거나 큰따옴표를 쓰세요.
   - 날짜는 반드시 'YYYY-MM-DD' 모양으로 적습니다. (예: '2027-03-02')
   - 사진은 images 폴더에 넣고, 'images/파일이름.jpg' 처럼 적습니다.
     (휴대폰 사진은 긴 쪽 1200px 정도로 줄여서 넣으면 화면이 빨리 열립니다)
   - 묶음 { ... } 을 하나 더 늘리고 싶으면, 위의 묶음을 통째로 복사해 붙여 넣고 글자만 바꾸면 됩니다.
     묶음과 묶음 사이에는 쉼표(,)가 있어야 합니다.

   ⚠️ 이 파일은 고객용·협력업체용 화면이 함께 읽습니다.
      인터넷에 올린 파일은 주소를 아는 사람이 열어 볼 수 있으니
      현관 비밀번호(doorCode)와 계약 금액(PAYMENT)은 신중하게 적으세요.
   ════════════════════════════════════════════════════════════════ */


/* ── 1. 현장 기본 정보 ─────────────────────────────────────────── */
window.SITE = {
  id: 'sample-32',                              // 현장 약칭 (영문 소문자·숫자·하이픈). 현장마다 다르게
  name: '샘플아파트 101동 1203호 (32평형)',      // 화면 위쪽에 크게 보이는 현장명
  start: '2026-11-16',                          // 착공일
  end: '2026-12-11',                            // 완공·인수인계일
  workDays: [1, 2, 3, 4, 5],                    // 작업 요일 (0=일 1=월 2=화 3=수 4=목 5=금 6=토). 토요일 작업이면 6 추가
  holidays: [],                                 // 공휴일·현장 휴무일. 예: ['2026-12-25', '2027-01-01']
  noiseHours: '평일 09:00~18:00',               // 소음 작업 허용 시간 (아파트 관리소 규정)
  preStartStage: '착공 준비 중',                // 착공 전에 상단 카드에 보일 문구
  dayBase: 'workday',                           // 공사 일차 계산: 'workday'(작업일만 셈) / 'calendar'(달력 날짜로 셈)

  // 🔎 시연용 기준 날짜: 이 날짜를 '오늘'로 보고 진행률·달력을 보여 줍니다.
  //    실제 현장에서는 반드시 '' 로 비워 두세요. (비우면 진짜 오늘 날짜로 자동 계산)
  previewToday: '2026-11-26'
};


/* ── 2. 공정 일정 ─────────────────────────────────────────────────
   한 묶음 { } 이 공정 하나입니다. 날짜 순서대로 적습니다.
   한 번만 적으면 고객용 공정표·달력, 협력업체용 공정표·달력에 모두 반영됩니다.

   start·end    : 공정 기간 (하루짜리는 같은 날짜)
   title        : 고객용 공정 이름          work : 협력업체용 공정 이름 (없으면 title 그대로)
   cal          : 달력 칸에 보일 글자 { text: 큰 글자, sub: 작은 글자, tone: 색, tag: 꼬리표 }
                  tone 색 이름 = green red amber blue sky violet teal orange yellow indigo slate cyan gold
   noise        : 소음 공정이면 true (고객 화면 ⚠️, 협력업체 화면 '소음주의')
   tag          : 협력업체 카드 꼬리표 (예: '착공', '완공', '청소')
   notice       : 고객 화면에 빨간 글씨로 보일 안내 한 줄
   notes        : 고객 화면 메모 목록
                  · '📍'로 시작하면 파란 글씨로 강조됩니다 (미팅 일정 등)
                  · '✔ 11.25 …' 처럼 날짜로 시작하면 그 날짜를 달력에서 눌렀을 때만 보입니다 (진행 기록)
   partnerNotes : 협력업체 화면 메모 목록
   ───────────────────────────────────────────────────────────────── */
window.SCHEDULE = [
  { start: '2026-11-16', end: '2026-11-16',
    title: '가구 철거 (착공일)', work: '가구 철거 (붙박이장·싱크대·신발장)',
    cal: { text: '가구 철거', sub: '착공일', tone: 'green', tag: '착공' }, tag: '착공',
    notes: ['엘리베이터·복도 보양 후 철거를 시작합니다.'],
    partnerNotes: ['가구류 전면 반출 및 폐기물 수거. 엘리베이터 보양 확인 후 반출.'] },

  { start: '2026-11-17', end: '2026-11-18',
    title: '욕실·주방 철거 · 1차 방수', noise: true,
    cal: { text: '욕실 철거', sub: '1차 방수', tone: 'red', tag: '소음' },
    notice: '※ 소음 발생 예정 공정입니다',
    notes: [],
    partnerNotes: ['09시 이후 강소음 작업 시작. 타일·위생도기 철거 후 1차 방수 도포.'] },

  { start: '2026-11-19', end: '2026-11-19',
    title: '샷시 철거 · 창호 시공', noise: true,
    cal: { text: '샷시', sub: '창호 시공', tone: 'red', tag: '소음' },
    notice: '※ 사다리차 반입 및 철거 소음 공정',
    notes: [],
    partnerNotes: ['사다리차 08:30 도착. 관리실에 차량 진입 사전 신고 완료.'] },

  { start: '2026-11-20', end: '2026-11-20',
    title: '전기 배선 · 설비 배관',
    cal: { text: '전기·설비', sub: '배선·배관', tone: 'violet' },
    notes: [], partnerNotes: ['주방 콘센트 이설 2곳, 거실 다운라이트 배선.'] },

  { start: '2026-11-23', end: '2026-11-24',
    title: '목공 (천장 몰딩 · 문틀 · 가벽)',
    cal: { text: '목공', sub: '몰딩·문틀', tone: 'amber' },
    notes: ['📍 11.24(화) 14:00 주방 가구 실측 미팅'],
    partnerNotes: ['거실 우물천장 간접조명 박스 제작 포함.'] },

  { start: '2026-11-25', end: '2026-11-27',
    title: '타일 시공 (욕실 · 주방 · 현관) 및 줄눈',
    cal: { text: '타일', sub: '욕실·주방·현관', tone: 'blue' },
    notes: ['✔ 11.25 공용 욕실 바닥 타일 완료', '✔ 11.26 공용 욕실 벽 타일 진행 중 (70%)'],
    partnerNotes: ['줄눈은 27일 오후. 타일 잔여분은 베란다에 보관.'] },

  { start: '2026-11-30', end: '2026-11-30',
    title: '욕실 기구 세팅',
    cal: { text: '욕실 기구', sub: '도기·수전', tone: 'sky' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-01', end: '2026-12-01',
    title: '필름 시공 (문 · 문틀 · 몰딩)',
    cal: { text: '필름', sub: '문·문틀', tone: 'yellow' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-02', end: '2026-12-03',
    title: '도배 (밑작업 · 정배)',
    cal: { text: '도배', sub: '밑작업·정배', tone: 'teal' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-04', end: '2026-12-04',
    title: '주방 가구 · 붙박이장 설치',
    cal: { text: '가구 설치', sub: '싱크대·붙박이', tone: 'orange', tag: '가구' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-07', end: '2026-12-07',
    title: '바닥재 시공 (강마루)',
    cal: { text: '바닥재', sub: '강마루', tone: 'indigo' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-08', end: '2026-12-08',
    title: '조명 · 전기 마감 · 중문 설치',
    cal: { text: '조명·중문', sub: '전기 마감', tone: 'slate' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-09', end: '2026-12-09',
    title: '마감 점검 · 실리콘 · 잔손보기',
    cal: { text: '잔손보기', sub: '마감 점검', tone: 'slate' },
    notes: [], partnerNotes: [] },

  { start: '2026-12-10', end: '2026-12-10',
    title: '전문 입주청소', tag: '청소',
    cal: { text: '입주청소', sub: '준공 청소', tone: 'cyan' },
    notes: [], partnerNotes: ['분진·창호·욕실·주방 전체 정밀 청소.'] },

  { start: '2026-12-11', end: '2026-12-11',
    title: '최종 준공 검수 및 인수인계 (완공)', tag: '완공',
    cal: { text: '준공', sub: '검수·인수인계', tone: 'gold', tag: '완공' },
    notes: [], partnerNotes: ['고객님 동행 검수 및 키 전달.'] }
];


/* ── 3. 현장 일지 (고객 화면 첫 번째 탭) ─────────────────────────
   한 묶음이 날짜 카드 하나입니다. 순서는 상관없이 최신 날짜가 자동으로 맨 위에 옵니다.
   'N일차'는 날짜를 보고 자동으로 계산됩니다.

   date   : 날짜                title : 한 줄 요약
   text   : 고객님께 드리는 설명 (줄을 바꾸려면 \n)
   photos : 사진 목록 [{ src: 사진 경로, cap: 사진 설명 }]
            4장 이하면 모두 보이고, 5장 이상이면 2장만 보이고 나머지는 '펼쳐보기' 버튼 안에 들어갑니다.
   checks : 확인 사항 목록 [{ title, desc }] (철거 중 발견한 문제 등, 없으면 생략)
   ───────────────────────────────────────────────────────────────── */
window.LOGS = [
  { date: '2026-11-26',
    title: '타일 시공 2일차 · 공용 욕실 벽 타일',
    text: '어제 바닥 타일에 이어 오늘은 공용 욕실 벽 타일을 붙이고 있습니다. 300×600 무광 화이트 타일을 세로로 시공해 천장이 높아 보이도록 했습니다.\n내일 현관·주방 타일과 줄눈 작업까지 마치면 다음 주 월요일(11/30)에 욕실 기구를 설치합니다.',
    photos: [
      { src: 'images/sample-tile.svg', cap: '01 · 공용 욕실 벽 타일 시공 중' },
      { src: 'images/sample-bath-waterproof.svg', cap: '02 · 바닥 타일 완료 상태' }
    ] },

  { date: '2026-11-24',
    title: '목공 마무리 · 거실 간접조명 박스',
    text: '거실 우물천장에 간접조명이 들어갈 박스를 만들고, 방문 문틀을 새로 세웠습니다. 오후 2시에는 주방 가구 실측을 마쳤습니다.',
    photos: [
      { src: 'images/sample-carpentry.svg', cap: '01 · 천장 몰딩·간접조명 박스' },
      { src: 'images/sample-window.svg', cap: '02 · 문틀 교체 후 거실 모습' }
    ] },

  { date: '2026-11-19',
    title: '샷시 교체 완료',
    text: '거실·안방 샷시를 철거하고 새 이중창으로 교체했습니다. 사다리차 작업은 오전 중에 마쳤고, 실리콘 마감은 내일 한 번 더 점검합니다.',
    photos: [
      { src: 'images/sample-window.svg', cap: '01 · 거실 이중창 시공 완료' }
    ] },

  { date: '2026-11-18',
    title: '욕실 철거 완료 · 1차 방수',
    text: '두 곳의 욕실 타일과 도기를 모두 철거하고 바닥·벽 하단에 1차 방수를 칠했습니다. 방수층이 마르는 동안 철거 중 확인된 부분을 아래에 정리했습니다.',
    photos: [
      { src: 'images/sample-demolition.svg', cap: '01 · 욕실 철거 직후' },
      { src: 'images/sample-bath-waterproof.svg', cap: '02 · 1차 방수 도포' }
    ],
    checks: [
      { title: '공용 욕실 · 배수구 주변 미세 균열', desc: '배수구 둘레에 머리카락 굵기의 균열이 있어 방수제를 한 번 더 덧발라 보강합니다. 추가 비용은 없습니다.' },
      { title: '주방 벽 · 콘센트 위치 이동 필요', desc: '새 싱크대 높이와 맞지 않아 11/20 전기 작업 때 2곳을 옮깁니다.' }
    ] },

  { date: '2026-11-16',
    title: '착공 · 가구 철거 및 공사 전 현황 기록',
    text: '오늘 착공했습니다. 엘리베이터와 복도에 보양재를 붙이고 붙박이장·싱크대·신발장을 철거했습니다. 철거 전 집 안 모습을 사진으로 남겨 두었습니다.',
    photos: [
      { src: 'images/sample-before-entrance.svg', cap: '01 · 현관 (공사 전)' },
      { src: 'images/sample-before-living.svg', cap: '02 · 거실 (공사 전)' },
      { src: 'images/sample-before-kitchen.svg', cap: '03 · 주방 (공사 전)' },
      { src: 'images/sample-before-bath.svg', cap: '04 · 공용 욕실 (공사 전)' },
      { src: 'images/sample-before-room.svg', cap: '05 · 안방 (공사 전)' },
      { src: 'images/sample-demolition.svg', cap: '06 · 가구 철거 후' }
    ] },

  { date: '2026-11-13',
    title: '착공 전 준비 · 관리사무소 공사 신고',
    text: '관리사무소에 공사 신고를 마치고, 같은 라인 세대에 공사 안내문과 소음 일정표를 붙였습니다.',
    photos: [] }
];


/* ── 4. 자재 스펙 (고객 화면 두 번째 탭) ─────────────────────────
   notice : 탭 맨 위 노란 안내 상자 글자 (필요 없으면 '')
   groups : 공종(욕실·주방·바닥 등)마다 카드 하나
     en         : 영문 작은 제목 (예: 'BATHROOM')     title : 카드 제목
     status     : 'confirmed'(확정 · 초록) / 'recommended'(추천·협의 · 노랑) / 'changed'(변경 · 주황)
     statusText : 꼬리표 글자 (예: '11/20 확정')
     photos     : 큰 사진 카드 [{ src, tag: 사진 위 작은 글자, name: 품목명, desc: 설명 }]
     items      : 목록 [{ icon: 이모지 또는 photo: 사진 경로, name, desc }]
     note       : 카드 아래 작은 안내 (없으면 '')
   ───────────────────────────────────────────────────────────────── */
window.SPECS = {
  notice: '\'추천(협의)\' 품목은 표준 세팅이며, 고객님과 미팅 후 원하시는 색상·모델로 바꿔 드립니다.',
  groups: [
    { en: 'BATHROOM', title: '욕실 자재', status: 'confirmed', statusText: '11/20 확정',
      photos: [
        { src: 'images/sample-mat-tile-white.svg', tag: '벽', name: '벽 타일 300×600', desc: '무광 화이트 · 세로 시공' },
        { src: 'images/sample-mat-tile-gray.svg', tag: '바닥', name: '바닥 타일 300×300', desc: '논슬립 그레이' }
      ],
      items: [
        { icon: '🚽', name: '양변기 — 원피스 절수형', desc: '공용·안방 욕실 각 1대' },
        { icon: '🚿', name: '샤워 수전 — 레인샤워 세트', desc: '공용 욕실 · 추가 견적 반영' },
        { icon: '🪞', name: '욕실장 — 슬라이드 거울장', desc: '폭 800 · 하부 간접조명' }
      ],
      note: '※ 타일 줄눈은 화이트 기본, 원하시면 그레이로 변경 가능합니다.' },

    { en: 'KITCHEN', title: '주방 자재', status: 'confirmed', statusText: '11/24 확정',
      photos: [
        { src: 'images/sample-mat-top.svg', tag: '상판', name: '인조대리석 상판', desc: '스노우 화이트 · 두께 12T' }
      ],
      items: [
        { photo: 'images/sample-mat-faucet.svg', name: '주방 수전 — 원홀 거위목', desc: '풀아웃 샤워 겸용' },
        { icon: '🍳', name: '후드 — 슬림 히든형 600', desc: '상부장 일체형' },
        { icon: '🗄️', name: '싱크대 문짝 — 무광 PET 웜그레이', desc: '상부장 화이트 / 하부장 웜그레이' }
      ],
      note: '' },

    { en: 'FLOOR · WALL', title: '바닥 · 벽 마감', status: 'recommended', statusText: '추천(협의)',
      photos: [
        { src: 'images/sample-mat-floor.svg', tag: '바닥', name: '강마루 — 내추럴 오크', desc: '거실·주방·방 전체' },
        { src: 'images/sample-mat-wall.svg', tag: '벽', name: '실크 벽지 — 화이트', desc: '천장 동일 품번' }
      ],
      items: [],
      note: '※ 12/2 도배 전까지 색상 변경 가능합니다.' },

    { en: 'LIGHTING', title: '조명', status: 'changed', statusText: '11/25 변경',
      photos: [],
      items: [
        { photo: 'images/sample-mat-light.svg', name: '거실 — 3인치 다운라이트 8개 + 라인 조명', desc: '기존 LED 평판등에서 변경 (고객 요청)' },
        { icon: '💡', name: '방 — LED 슬림 방등 50W', desc: '안방·작은방 2곳' }
      ],
      note: '' }
  ]
};


/* ── 5. 협력업체용: 공사 전 사진과 현장 특이사항 ──────────────────
   prePhotos : 공사 전 사진 [{ src, label: 사진 위 짧은 이름, cap: 크게 볼 때 설명 }]
               앞의 heroCount 장은 바로 보이고, 전체는 '펼쳐보기' 버튼으로 봅니다.
   notes     : 작업 전에 꼭 알아야 할 특이사항 [{ title, desc, photo: 관련 사진 번호(없으면 0) }]
   ───────────────────────────────────────────────────────────────── */
window.PARTNER = {
  heroCount: 4,
  prePhotos: [
    { src: 'images/sample-before-entrance.svg', label: '현관', cap: '01 · 현관 (공사 전)' },
    { src: 'images/sample-before-living.svg', label: '거실', cap: '02 · 거실 (공사 전)' },
    { src: 'images/sample-before-kitchen.svg', label: '주방', cap: '03 · 주방 (공사 전)' },
    { src: 'images/sample-before-bath.svg', label: '공용 욕실', cap: '04 · 공용 욕실 (공사 전)' },
    { src: 'images/sample-before-room.svg', label: '안방', cap: '05 · 안방 (공사 전)' },
    { src: 'images/sample-demolition.svg', label: '철거 후', cap: '06 · 가구 철거 후' }
  ],
  notes: [
    { title: '공용 욕실 · 배수구 주변 미세 균열', desc: '방수 시 배수구 둘레 2회 덧칠 필수.', photo: 4 },
    { title: '주방 벽 · 콘센트 2곳 이설', desc: '싱크대 상판 높이 기준 +200mm 로 이동.', photo: 3 },
    { title: '거실 발코니 확장부 · 단열 상태', desc: '목공 전에 단열재 들뜸 여부 확인 후 대표님께 사진 전송.', photo: 2 }
  ]
};


/* ── 6. 협력업체용: 현장 출입 · 도어락 · 주차 안내 ─────────────────
   doorCode    : 세대 현관(도어락) 비밀번호.
                 비워 두면('') 화면에 "대표님이 문자로 따로 안내"라고 나옵니다. (권장)
                 적을 경우 완공 후 꼭 지우고, 고객님께 비밀번호 변경을 안내하세요.
   contactName·phone : 현장 담당자. 비워 두면 site.js 의 대표님 이름·번호가 들어갑니다.
   rules       : 현장 작업 수칙 ['제목', '내용'] 목록
   ───────────────────────────────────────────────────────────────── */
window.ACCESS = {
  address: '샘플시 샘플구 샘플로 123, 샘플아파트 101동 1203호',
  lobby: '공동현관 호출 → 관리실에서 열어 줌 (평일 08:00~18:00)',
  doorCode: '',
  parking: '지하 2층 B구역 · 방문 차량은 관리실에 차량번호 사전 등록',
  contactName: '',
  phone: '',
  rules: [
    ['소음 공사 허용 시간', '평일 09:00~18:00 (점심 12:00~13:00 소음 자제 / 주말·공휴일 불가)'],
    ['승강기(엘리베이터)', '보양재 훼손 주의, 자재 운반 후 승강기 바닥 청소'],
    ['폐기물 처리', '당일 발생분은 마대에 담아 세대 안 베란다에 보관 (단지 내 투기 금지)'],
    ['작업 완료 후', '퇴실 시 창문 잠금·소등, 세대 도어락 잠금 상태 확인 필수']
  ]
};


/* ── 7. 계약 · 정산 (고객 화면 네 번째 탭) ────────────────────────
   show     : 금액을 보여 줄지 (고객님 동의를 받은 뒤 true. 동의가 없으면 false)
   total    : 기본 계약금액 (원, 숫자만. 쉼표 없이)
   vat      : 부가세 안내 문구
   steps    : 회차별 대금 { label: 이름, ratio: 비율(%), due: 입금 예정 시점,
                            paid: 입금 기록 [{ date: '2026.11.16', amount: 금액 }] }
              비율 합계는 100 이 되어야 합니다.
   changes  : 추가·변경 견적 목록 { date, title, amount, note }
              · 추가는 그냥 숫자 (예: 1200000), 빼는 금액은 앞에 - (예: -400000)
   changesWith : 추가·변경 금액을 함께 받을 회차 이름 (예: '잔금'). steps 의 label 과 같게 적습니다.
                 회차와 따로 받으려면 '' 로 비우고, 아래 changesDue 에 받는 시점을 적습니다.
   changesDue  : (따로 받을 때) 추가·변경 금액을 언제 받는지 (예: '도배 전')
   changesPaid : 추가·변경 금액을 받은 기록 [{ date: '2026.11.25', amount: 금액 }] (없으면 [])
                 changesWith 회차가 있으면 그 회차의 입금으로도 함께 계산됩니다.
   note     : 맨 아래 안내 문구
   합계, 회차별 금액, 누적 입금액, 남은 금액은 모두 자동으로 계산됩니다.
   ───────────────────────────────────────────────────────────────── */
window.PAYMENT = {
  show: true,
  total: 38000000,
  vat: '(부가세 별도)',
  steps: [
    { label: '계약금',     ratio: 10, due: '계약 시',       paid: [{ date: '2026.10.28', amount: 3800000 }] },
    { label: '1차 중도금', ratio: 30, due: '착공 시',       paid: [{ date: '2026.11.16', amount: 11400000 }] },
    { label: '2차 중도금', ratio: 30, due: '목공 완료 후',  paid: [{ date: '2026.11.25', amount: 5000000 }] },
    { label: '잔금',       ratio: 30, due: '준공 검수 후',  paid: [] }
  ],
  changes: [
    { date: '2026.11.18', title: '안방 붙박이장 추가 (폭 1.2m)', amount: 1200000, note: '고객 요청' },
    { date: '2026.11.20', title: '공용 욕실 레인샤워 수전으로 변경', amount: 650000, note: '기본 수전 대비 차액' },
    { date: '2026.11.25', title: '작은방 천장 몰딩 제외', amount: -400000, note: '무몰딩 마감으로 변경' }
  ],
  changesWith: '잔금',
  changesDue: '',
  changesPaid: [{ date: '2026.11.25', amount: 650000 }],
  note: '공정 변경으로 금액이 달라질 때는 반영 전에 먼저 말씀드리고 동의를 받습니다.'
};
