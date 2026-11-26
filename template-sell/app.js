/* ════════════════════════════════════════════════════════════════
   ③ 화면 동작 파일 (app.js) — 고치지 않습니다.

   site.js(회사 정보·색상)와 data.js(현장 정보)를 읽어서
   고객용(index.html)·협력업체용(partner.html) 화면을 자동으로 그립니다.
   - 상단 진행률 (D-day · 공사 일차 · 공정률)
   - 현장 일지 · 자재 스펙 · 계약 정산 (추가·변경 금액 자동 합산)
   - 공정표 리스트 · 달력 · 날짜 상세창
   - 출입 정보 · 공사 전 사진 · 특이사항 · 정보 복사
   확인용: 주소 끝에 ?today=2027-01-05 를 붙이면 그 날짜 기준으로 화면을 볼 수 있습니다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BRAND = window.BRAND || {};
  var COLOR = BRAND.color || {};
  var SITE = window.SITE || {};
  var PAGE = document.body.getAttribute('data-page') === 'partner' ? 'partner' : 'client';
  var DAY = 24 * 60 * 60 * 1000;
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  /* ───────── 기본 도구 ───────── */
  function toUtc(iso) { var p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function toIso(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function dowOf(iso) { return new Date(toUtc(iso)).getUTCDay(); }
  function md(iso) { var p = iso.split('-'); return p[1] + '.' + p[2] + '(' + DOW[dowOf(iso)] + ')'; }
  function ymd(iso) { var p = iso.split('-'); return p[0] + '.' + p[1] + '.' + p[2] + '(' + DOW[dowOf(iso)] + ')'; }
  function korean(iso) { var p = iso.split('-').map(Number); return p[1] + '월 ' + p[2] + '일 (' + DOW[dowOf(iso)] + ')'; }
  function koreanTight(iso) { var p = iso.split('-').map(Number); return p[1] + '월 ' + p[2] + '일(' + DOW[dowOf(iso)] + ')'; }
  function addDays(iso, n) { return toIso(toUtc(iso) + n * DAY); }
  function isIso(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function digits(s) { return String(s || '').replace(/[^0-9+]/g, ''); }
  function phoneText(s) { var d = digits(s); return d.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function signedWon(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원'; }
  function dotDate(s) { return isIso(s) ? s.replace(/-/g, '.') : String(s || ''); }
  function ceoLabel() { return (BRAND.ceoName || '') + ' ' + (BRAND.ceoTitle || '대표'); }

  // 오늘 (한국 시간). ?today=YYYY-MM-DD 로 확인 가능
  var TODAY_PARAM = (/[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search) || [])[1];
  function realToday() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var pick = function (t) { var h = parts.find(function (p) { return p.type === t; }); return h ? h.value : ''; };
      if (pick('year')) return pick('year') + '-' + pick('month') + '-' + pick('day');
    } catch (e) { /* Intl 미지원 기기 */ }
    var n = new Date();
    return toIso(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }
  function today() { return TODAY_PARAM || realToday(); }

  /* ───────── 데모 모드: 모든 날짜를 '오늘' 기준으로 옮겨 늘 공사 중으로 보이게 ─────────
     착공일이 '지난주 월요일'이 되도록 주 단위로 옮기므로 요일은 그대로 유지됩니다. */
  (function demoShift() {
    if (!SITE.demo || TODAY_PARAM || !isIso(SITE.start)) return;
    var t = realToday(), mon = t;
    while (dowOf(mon) !== 1) mon = addDays(mon, -1);
    var target = addDays(mon, -7);
    var weeks = Math.round((toUtc(target) - toUtc(SITE.start)) / DAY / 7);
    var shift = weeks * 7;
    if (!shift) return;
    var origYear = SITE.start.slice(0, 4), origStart = SITE.start;
    var walk = function (o) {
      if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) { if (isIso(o[i])) o[i] = addDays(o[i], shift); else if (o[i] && typeof o[i] === 'object') walk(o[i]); } return; }
      Object.keys(o).forEach(function (k) {
        if (isIso(o[k])) o[k] = addDays(o[k], shift);
        else if (o[k] && typeof o[k] === 'object') walk(o[k]);
      });
    };
    [window.SITE, window.SCHEDULE, window.LOGS, window.PAYMENT].forEach(function (o) { if (o) walk(o); });
    // 메모 글자 속 '12월 9일(수)' 같은 날짜도 함께 옮깁니다
    (window.SCHEDULE || []).forEach(function (s) {
      ['notes', 'partnerNotes'].forEach(function (k) {
        (s[k] || []).forEach(function (n, i) {
          s[k][i] = n.replace(/(\d{1,2})월 (\d{1,2})일\((.)\)/g, function (all, m, d) {
            var src = origYear + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            if (src < origStart) src = (Number(origYear) + 1) + src.slice(4);   // 해를 넘기는 현장
            var iso = addDays(src, shift);
            var p = iso.split('-').map(Number);
            return p[1] + '월 ' + p[2] + '일(' + DOW[dowOf(iso)] + ')';
          });
        });
      });
    });
  })();

  var SCHEDULE = (window.SCHEDULE || []).slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  var WORKDAYS = SITE.workDays || [1, 2, 3, 4, 5];
  var HOLIDAYS = SITE.holidays || [];

  /* ───────── 회사 색상 · 이름 적용 ───────── */
  (function applyBrand() {
    var root = document.documentElement.style;
    if (PAGE === 'client') {
      if (COLOR.primary) root.setProperty('--primary', COLOR.primary);
      if (COLOR.primaryLight) root.setProperty('--primary-light', COLOR.primaryLight);
      if (COLOR.accent) root.setProperty('--accent', COLOR.accent);
    } else {
      if (COLOR.primary) root.setProperty('--brand', COLOR.primary);
      if (COLOR.primaryLight) root.setProperty('--brand-light', COLOR.primaryLight);
      if (COLOR.partnerAccent) { root.setProperty('--accent', COLOR.partnerAccent); root.setProperty('--accent-light', COLOR.partnerAccent); }
    }
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme && PAGE === 'client' && COLOR.primary) theme.setAttribute('content', COLOR.primary);
    var company = BRAND.company || '';
    document.title = (company ? company + ' · ' : '') + (PAGE === 'partner' ? '협력업체 현장 가이드' : '현장 리포트') + (SITE.name ? ' · ' + SITE.name : '');
    var apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (apple && company) apple.setAttribute('content', PAGE === 'partner' ? company + ' 협력' : company);
    var foot = document.getElementById('brand-footer');
    if (foot) foot.innerHTML = '<b>' + esc(company) + '</b>' + (BRAND.career ? ' · ' + esc(BRAND.career) : '') +
      ' · ' + esc(ceoLabel()) + ' ' + esc(phoneText(BRAND.phone)) + (BRAND.footer ? '<br>' + esc(BRAND.footer) : '');
  })();

  var CAL_TONE = {
    green:  { bg: '#ecfdf5', bd: '#a7f3d0', tx: '#047857', chip: '#047857' },
    red:    { bg: '#fef2f2', bd: '#fecaca', tx: '#b91c1c', chip: '#dc2626' },
    amber:  { bg: '#fffbeb', bd: '#fde68a', tx: '#b45309', chip: '#b45309' },
    blue:   { bg: '#eff6ff', bd: '#bfdbfe', tx: '#1d4ed8', chip: '#1d4ed8' },
    sky:    { bg: '#f0f9ff', bd: '#bae6fd', tx: '#0369a1', chip: '#0369a1' },
    violet: { bg: '#f5f3ff', bd: '#ddd6fe', tx: '#6d28d9', chip: '#6d28d9' },
    teal:   { bg: '#f0fdfa', bd: '#99f6e4', tx: '#0f766e', chip: '#0f766e' },
    orange: { bg: '#fff7ed', bd: '#fed7aa', tx: '#c2410c', chip: '#c2410c' },
    yellow: { bg: '#fefce8', bd: '#fde68a', tx: '#a16207', chip: '#a16207' },
    indigo: { bg: '#eef2ff', bd: '#c7d2fe', tx: '#4338ca', chip: '#4338ca' },
    slate:  { bg: '#f1f5f9', bd: '#cbd5e1', tx: '#334155', chip: '#334155' },
    cyan:   { bg: '#ecfeff', bd: '#a5f3fc', tx: '#0e7490', chip: '#0e7490' },
    gold:   { bg: '#fef3c7', bd: '#f59e0b', tx: '#92400e', chip: '#b45309' }
  };

  function isHoliday(iso) { return HOLIDAYS.indexOf(iso) > -1; }
  function isWorkday(iso) { return WORKDAYS.indexOf(dowOf(iso)) > -1 && !isHoliday(iso); }

  // 공사 일차: 착공일 = 1일차. dayBase 'workday' 는 작업일만, 'calendar' 는 달력 날짜로 셉니다.
  function dayNo(iso) {
    if (SITE.dayBase === 'calendar') return Math.round((toUtc(iso) - toUtc(SITE.start)) / DAY) + 1;
    var n = 0;
    for (var d = SITE.start; d <= iso; d = addDays(d, 1)) if (isWorkday(d)) n++;
    return n;
  }
  var TOTAL_DAYS = dayNo(SITE.end);

  // '✔ 1.5 …' 같은 메모의 월.일 을 공사 기간 안의 실제 날짜로 (해를 넘기는 현장도 맞게)
  function noteDate(m, d) {
    var y = Number(SITE.start.slice(0, 4));
    var iso = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if (iso < SITE.start) iso = (y + 1) + iso.slice(4);
    return iso;
  }

  function planOf(iso) {
    for (var i = 0; i < SCHEDULE.length; i++) if (iso >= SCHEDULE[i].start && iso <= SCHEDULE[i].end) return SCHEDULE[i];
    return null;
  }
  function rangeDays(s) {
    var a = dayNo(s.start), b = dayNo(s.end);
    return a === b ? a + '일차' : a + '~' + b + '일차';
  }

  /* ───────── 현장명·기간 글자 채우기 ───────── */
  function fillSiteText() {
    var calFirst = calStart(), calEnd = calLastDay();
    var weeks = Math.round((toUtc(calEnd) - toUtc(calFirst)) / DAY + 1) / 7;
    var offText = (WORKDAYS.indexOf(6) > -1 ? '일요일' : '주말') + (HOLIDAYS.length ? '·공휴일' : '') + ' 휴무';
    var sameYear = calFirst.slice(0, 4) === calEnd.slice(0, 4);   // 해를 넘기면 끝 날짜에도 연도 표시
    var values = {
      brand: BRAND.company,
      name: SITE.name,
      start: ymd(SITE.start),
      end: ymd(SITE.end),
      calRange: ymd(calFirst) + ' ~ ' + (sameYear ? md(calEnd) + ' · ' + weeks + '주' : ymd(calEnd)),
      calTotal: (sameYear ? '' : weeks + '주 · ') + '총 ' + TOTAL_DAYS + '일 · ' + offText,
      noiseHours: SITE.noiseHours
    };
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var v = values[el.getAttribute('data-site')];
      if (v != null) el.textContent = v;
    });
  }

  /* ───────── 상단 진행률 카드 (고객용) ───────── */
  function updateProgress() {
    var t = today();
    var leftToStart = Math.round((toUtc(SITE.start) - toUtc(t)) / DAY);
    var leftToEnd = Math.round((toUtc(SITE.end) - toUtc(t)) / DAY);
    var dday, stage, headline, percent;
    if (leftToStart > 0) {
      dday = '착공 D-' + leftToStart + ' · 완공 D-' + leftToEnd;
      stage = SITE.preStartStage || '착공 준비 중';
      headline = '착공 준비 중';
      percent = 0;
    } else if (leftToEnd < 0) {
      dday = '공사 완료';
      stage = '준공 완료';
      headline = '준공 완료 · 공정률 100%';
      percent = 100;
    } else {
      var n = dayNo(t);
      percent = Math.min(100, Math.max(0, Math.round(n / TOTAL_DAYS * 100)));
      var dayText = isWorkday(t) || SITE.dayBase === 'calendar' ? '공사 ' + n + '일차' : '휴무일 · ' + n + '일차까지 진행';
      dday = dayText + ' · 완공 ' + (leftToEnd === 0 ? 'D-Day' : 'D-' + leftToEnd);
      stage = leftToEnd === 0 ? '최종 준공 검수 · 인수인계' : '공사 진행 중';
      headline = dayText + ' · 공정률 ' + percent + '%';
    }
    setText('status-dday', dday);
    setText('status-percent', headline);
    var st = document.getElementById('status-stage');
    if (st) st.innerHTML = '현재 상태: <strong>' + esc(stage) + '</strong>';
    var bar = document.getElementById('progress-fill');
    if (bar) bar.style.width = percent + '%';
  }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  /* ───────── 공정표 리스트 ───────── */
  function noteHtml(text, cls) {
    if (text.indexOf('📍') === 0) return '<div class="timeline-meet">' + esc(text) + '</div>';
    return '<div class="' + cls + '">' + esc(text) + '</div>';
  }

  function renderClientTimeline() {
    var box = document.getElementById('timeline');
    if (!box) return;
    var t = today();
    box.innerHTML = SCHEDULE.map(function (s, i) {
      var date = (s.start === s.end ? md(s.start) : md(s.start) + ' ~ ' + md(s.end)) + ' · ' + rangeDays(s);
      if (s.noise) date += ' ⚠️';
      if (i === SCHEDULE.length - 1) date += ' 🎉';
      var state = t > s.end ? ' done' : (t >= s.start ? ' current' : '');
      var html = '<div class="timeline-step' + state + '"><div class="timeline-dot"></div>' +
        '<div class="timeline-date">' + esc(date) + '</div>' +
        '<div class="timeline-title">' + esc(s.title) + '</div>';
      (s.notes || []).forEach(function (n) { html += noteHtml(n, 'timeline-sub'); });
      if (s.notice) html += '<div class="timeline-notice">' + esc(s.notice) + '</div>';
      return html + '</div>';
    }).join('');
  }

  function renderPartnerSchedule() {
    var box = document.getElementById('partner-schedule');
    if (!box) return;
    var t = today();
    box.innerHTML = SCHEDULE.map(function (s) {
      var date = s.start === s.end ? koreanTight(s.start)
        : koreanTight(s.start) + ' ~ ' + (s.start.slice(0, 7) === s.end.slice(0, 7) ? Number(s.end.slice(8)) + '일(' + DOW[dowOf(s.end)] + ')' : koreanTight(s.end));
      date += ' · ' + rangeDays(s);
      var tag = s.noise ? '<span class="schedule-tag noise">소음주의</span>'
        : s.tag ? '<span class="schedule-tag' + (s.tag === '착공' || s.tag === '완공' ? ' ready' : '') + '">' + esc(s.tag) + '</span>' : '';
      var state = t > s.end ? ' done' : (t >= s.start ? ' current' : '');
      var html = '<div class="schedule-card' + state + '"><div class="schedule-header">' +
        '<div class="schedule-date">' + esc(date) + '</div>' + tag + '</div>' +
        '<div class="schedule-work">' + esc(s.work || s.title) + '</div>';
      (s.partnerNotes || []).forEach(function (n) { html += noteHtml(n, 'schedule-note'); });
      if (s.partnerHtml) html += s.partnerHtml;   // 직원이 직접 적는 추가 HTML
      return html + '</div>';
    }).join('');
  }

  /* ───────── 달력 ───────── */
  function calStart() {           // 착공 주의 월요일
    var d = SITE.start;
    while (dowOf(d) !== 1) d = addDays(d, -1);
    return d;
  }
  function calLastDay() {         // 완공 주의 일요일
    var d = SITE.end;
    while (dowOf(d) !== 0) d = addDays(d, 1);
    return d;
  }

  function renderCalendar() {
    var grid = document.getElementById('cal-grid');
    if (!grid) return;
    var t = today(), first = calStart(), last = calLastDay();
    var html = ['월', '화', '수', '목', '금', '토', '일'].map(function (l, i) {
      return '<div class="cal-dow' + (i === 5 ? ' sat' : i === 6 ? ' sun' : '') + '">' + l + '</div>';
    }).join('');
    for (var d = first; d <= last; d = addDays(d, 1)) {
      var dow = dowOf(d), p = d.split('-').map(Number);
      var plan = planOf(d), work = plan && isWorkday(d);
      var cls = ['cal-cell'];
      if (dow === 6) cls.push('sat');
      if (dow === 0) cls.push('sun');
      if (d === t) cls.push('today');
      var label = (p[2] === 1 || d === first) ? p[1] + '/' + p[2] : String(p[2]);
      var style = '', inner;
      if (work) {
        var c = plan.cal || {};
        var tone = CAL_TONE[c.tone] || CAL_TONE.slate;
        style = 'background:' + tone.bg + ';border-color:' + tone.bd + ';';
        inner = '<div class="cal-day" style="color:' + tone.tx + ';">' + label + '</div>';
        if (c.tag) inner += '<span class="cal-chip" style="background:' + tone.chip + ';">' + esc(c.tag) + '</span>';
        inner += '<div class="cal-work" style="color:' + tone.tx + ';">' + esc(c.text || plan.title) + '</div>';
        if (c.sub) inner += '<div class="cal-sub" style="color:' + tone.tx + ';">' + esc(c.sub) + '</div>';
      } else {
        cls.push('off');
        inner = '<div class="cal-day">' + label + '</div><div class="cal-off-text">' +
          (d > SITE.end ? '종료' : d < SITE.start ? '착공 전' : isHoliday(d) ? '공휴일' : '휴무') + '</div>';
      }
      html += '<div class="' + cls.join(' ') + '" style="' + style + '" data-date="' + d + '">' + inner + '</div>';
    }
    grid.innerHTML = html;
  }

  function openCalDetail(iso) {
    var box = document.getElementById('cal-detail');
    if (!box) return;
    var plan = planOf(iso), t = today();
    var dateEl = document.getElementById('cal-detail-date');
    var badge = document.getElementById('cal-detail-badge');
    var titleEl = document.getElementById('cal-detail-title');
    var notesEl = document.getElementById('cal-detail-notes');
    badge.className = 'cal-detail-badge';
    dateEl.textContent = korean(iso);

    if (plan && isWorkday(iso)) {
      dateEl.textContent = korean(iso) + ' · ' + dayNo(iso) + '일차';
      if (iso === t) badge.textContent = '오늘';
      else if (iso < t) { badge.textContent = '지난 공정'; badge.classList.add('done'); }
      else badge.textContent = '예정';
      titleEl.textContent = PAGE === 'partner' ? (plan.work || plan.title) : plan.title;
      var notes = (PAGE === 'partner' ? plan.partnerNotes : plan.notes) || [];
      if (PAGE === 'client' && plan.notice) notes = notes.concat([plan.notice]);
      var body = '';
      notes.forEach(function (text) {
        // 진행 기록(✔ 1.5 …)은 그 날짜를 눌렀을 때만 보여 줍니다
        var hit = text.match(/^✔\s*(\d{1,2})\.(\d{1,2})/);
        if (hit && noteDate(hit[1], hit[2]) !== iso) return;
        var warn = text.indexOf('※') === 0 || text.indexOf('소음') > -1 || text.indexOf('⚠') > -1;
        body += '<div class="cal-note' + (warn ? ' warn' : '') + '">' + esc(text) + '</div>';
      });
      if (plan.noise && !body) body += '<div class="cal-note warn">소음 발생 예정 공정입니다. 소음 작업은 ' + esc(SITE.noiseHours) + '에만 진행합니다.</div>';
      if (!body) body += '<div class="cal-note">세부 작업 내용은 현장 상황에 따라 조정될 수 있습니다.</div>';
      body += '<div class="cal-note">※ 현장 상황에 따라 하루 이틀 앞뒤로 조정될 수 있으며, 변경되면 이 화면에 바로 반영됩니다.</div>';
      notesEl.innerHTML = body;
    } else {
      var msg;
      badge.classList.add('off');
      titleEl.textContent = '예정된 공정이 없습니다';
      if (iso > SITE.end) { badge.textContent = '공사 종료'; msg = korean(SITE.end) + ' 준공 검수·인수인계로 공사를 마칩니다.'; }
      else if (iso < SITE.start) { badge.textContent = '착공 전'; msg = korean(SITE.start) + ' 착공 예정입니다.'; }
      else if (isHoliday(iso)) { badge.textContent = '공휴일'; msg = '공휴일 휴무입니다. 소음 작업은 ' + SITE.noiseHours + '에만 진행합니다.'; }
      else if (!isWorkday(iso)) { badge.textContent = '휴무'; msg = '휴무일입니다. 소음 작업은 ' + SITE.noiseHours + '에만 진행합니다.'; }
      else { badge.textContent = '휴무'; msg = '이 날은 예정된 공정이 없습니다.'; }
      notesEl.innerHTML = '<div class="cal-note">' + esc(msg) + '</div>';
    }
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCalDetail() {
    var box = document.getElementById('cal-detail');
    if (box) box.classList.remove('open');
    document.body.style.overflow = '';
  }

  var VIEW_KEY = 'siteapp_' + (SITE.id || 'site') + '_' + PAGE + '_view';   // 현장·화면마다 따로 기억
  function setScheduleView(view) {
    var isCal = view === 'calendar';
    var listView = document.getElementById('schedule-list-view');
    var calView = document.getElementById('schedule-calendar-view');
    if (!listView || !calView) return;
    listView.hidden = isCal;
    calView.hidden = !isCal;
    [['view-btn-list', !isCal], ['view-btn-calendar', isCal]].forEach(function (b) {
      var el = document.getElementById(b[0]);
      if (el) { el.classList.toggle('active', b[1]); el.setAttribute('aria-pressed', String(b[1])); }
    });
    if (isCal) renderCalendar();
    try { localStorage.setItem(VIEW_KEY, isCal ? 'calendar' : 'list'); } catch (e) { /* 저장이 막힌 브라우저 */ }
  }

  /* ───────── 고객용: 탭 · 사진 확대 · 1일차 사진 펼치기 ───────── */
  function switchTab(name, el) {
    document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    var target = document.getElementById('tab-' + name);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openSpecPhoto(src, caption) {
    var m = document.getElementById('photo-modal');
    if (!m) return;
    document.getElementById('photo-modal-img').src = src;
    document.getElementById('photo-modal-caption').textContent = caption || '';
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSpecPhoto() {
    var m = document.getElementById('photo-modal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ───────── 협력업체용: 공사 전 사진 라이트박스 ───────── */
  var prePhotos = [], preIndex = 0;
  function collectPrePhotos() { prePhotos = Array.prototype.slice.call(document.querySelectorAll('#pre-all .pre-item')); }
  function renderPrePhoto() {
    var item = prePhotos[preIndex];
    if (!item) return;
    var img = item.querySelector('img'), target = document.getElementById('pre-lb-img');
    target.src = img.getAttribute('src');
    target.alt = img.getAttribute('alt') || '';
    document.getElementById('pre-lb-caption').textContent = item.getAttribute('data-cap') || '';
    document.getElementById('pre-lb-count').textContent = (preIndex + 1) + ' / ' + prePhotos.length + ' · 좌우로 넘기기';
  }
  function openPreLightbox(num) {
    collectPrePhotos();
    preIndex = 0;
    for (var i = 0; i < prePhotos.length; i++) if (prePhotos[i].getAttribute('data-photo') === String(num)) { preIndex = i; break; }
    renderPrePhoto();
    document.getElementById('pre-lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function stepPrePhoto(delta) {
    if (!prePhotos.length) return;
    preIndex = (preIndex + delta + prePhotos.length) % prePhotos.length;
    renderPrePhoto();
  }
  function closePreLightbox() {
    var lb = document.getElementById('pre-lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.getElementById('pre-lb-img').removeAttribute('src');
    document.body.style.overflow = '';
  }
  function labelPre(open) {
    var n = document.querySelectorAll('#pre-all .pre-item').length;
    var btn = document.getElementById('pre-toggle');
    if (btn) btn.textContent = open ? '전체 ' + n + '장 접기' : '전체 ' + n + '장 펼쳐보기';
    var hint = document.getElementById('pre-hint');
    if (hint) hint.textContent = '📷 사진을 누르면 크게 보기 · ‹ › 버튼으로 ' + n + '장 넘겨보기';
  }
  function togglePreGallery() {
    var box = document.getElementById('pre-all');
    var willOpen = box.hasAttribute('hidden');
    if (willOpen) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    labelPre(willOpen);
    if (!willOpen) { var card = box.closest('.photo-card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }


  /* ───────── 고객용: 현장 일지 ───────── */
  function photoItem(p, idx, extraCls) {
    var cap = String(idx).padStart(2, '0') + ' · ' + (p.caption || '');
    return '<div class="photo-item tap' + (extraCls || '') + '" onclick="openSpecPhoto(this.dataset.src,this.dataset.cap)" data-src="' + esc(p.src) + '" data-cap="' + esc(cap) + '">' +
      '<img src="' + esc(p.src) + '" alt="' + esc(p.caption || '') + '" loading="lazy">' +
      '<div class="photo-badge">' + String(idx).padStart(2, '0') + ' ' + esc(p.caption || '') + '</div></div>';
  }
  function dayLabel(iso) {
    if (iso < SITE.start) return '착공 전';
    if (iso > SITE.end) return '완공 후';
    if (!isWorkday(iso) && SITE.dayBase !== 'calendar') return '휴무일';
    var n = dayNo(iso);
    return n === 1 ? '착공 1일차' : n + '일차';
  }
  function renderLogs() {
    var box = document.getElementById('log-list');
    if (!box) return;
    var desc = document.getElementById('log-desc');
    if (desc) desc.textContent = (BRAND.company || '') + ' ' + (BRAND.ceoTitle || '대표') + '가 직접 기록합니다';
    var t = today();
    var logs = (window.LOGS || []).filter(function (l) { return isIso(l.date) && l.date <= t; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (!logs.length) {
      box.innerHTML = '<div class="card"><div class="empty-note">아직 등록된 현장 일지가 없습니다.<br>' +
        (t < SITE.start ? korean(SITE.start) + ' 착공 후 사진과 함께 기록이 올라옵니다.' : '곧 사진과 함께 기록이 올라옵니다.') + '</div></div>';
      return;
    }
    box.innerHTML = logs.map(function (l, li) {
      var photos = l.photos || [], html = '<div class="card log-card"><div class="log-item">' +
        '<div class="log-date">' + esc(ymd(l.date)) + ' · ' + esc(dayLabel(l.date)) + '</div>' +
        '<div class="log-work">' + esc(l.title || '') + '</div></div>';
      if (l.text) html += '<p class="log-text">' + esc(l.text) + '</p>';
      if (photos.length && photos.length <= 4) {
        html += '<div class="log-grid">' + photos.map(function (p, i) { return photoItem(p, i + 1); }).join('') + '</div>';
      } else if (photos.length > 4) {
        html += '<div class="log-grid">' + photos.slice(0, 2).map(function (p, i) { return photoItem(p, i + 1); }).join('') + '</div>' +
          '<button class="gallery-toggle" onclick="toggleLogMore(this)" data-total="' + photos.length + '" data-more="' + (photos.length - 2) + '">전체 ' + photos.length + '장 펼쳐보기 (' + (photos.length - 2) + '장 더)</button>' +
          '<div class="log-more" hidden>' + photos.slice(2).map(function (p, i) { return photoItem(p, i + 3); }).join('') + '</div>';
      }
      if (photos.length) html += '<div class="log-hint">📷 사진 터치 시 확대</div>';
      return html + '</div>';
    }).join('');
  }
  function toggleLogMore(btn) {
    var box = btn.nextElementSibling;
    var open = box.hasAttribute('hidden');
    if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    btn.textContent = open ? '전체 ' + btn.dataset.total + '장 접기' : '전체 ' + btn.dataset.total + '장 펼쳐보기 (' + btn.dataset.more + '장 더)';
    if (!open) { var card = btn.closest('.card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  /* ───────── 고객용: 자재 스펙 · 자재 도감 배너 ───────── */
  function renderSpecs() {
    var list = document.getElementById('spec-list');
    if (!list) return;
    var cat = BRAND.catalog || {}, banner = document.getElementById('catalog-banner');
    if (banner) banner.innerHTML = cat.show && cat.url && cat.url !== 'https://' ?
      '<div class="catalog-banner"><div class="catalog-banner-title">' + esc(cat.title || '자재 도감') + '</div>' +
      (cat.desc ? '<p>' + esc(cat.desc) + '</p>' : '') +
      '<a href="' + esc(cat.url) + '" target="_blank" rel="noopener">📱 자재 도감 열기</a></div>' : '';
    var S = window.SPECS || {}, groups = S.groups || [];
    var notice = document.getElementById('spec-notice');
    if (notice) notice.innerHTML = S.notice ? '<div class="spec-notice"><div class="spec-notice-icon">💡</div><div>' + esc(S.notice) + '</div></div>' : '';
    var conf = groups.filter(function (g) { return g.status !== 'recommended'; }).length;
    var legend = document.getElementById('spec-legend');
    if (legend) legend.innerHTML = '<div class="spec-legend-item"><span class="spec-dot" style="background:#10b981;"></span>확정 사양 ' + conf + '개 공종</div>' +
      '<div class="spec-legend-item"><span class="spec-dot" style="background:#f59e0b;"></span>추천(협의) ' + (groups.length - conf) + '개 공종</div>' +
      '<div class="spec-legend-item" style="margin-left:auto; font-weight:500; color:#94a3b8;">📷 사진 터치 시 확대</div>';
    if (!groups.length) { list.innerHTML = '<div class="card"><div class="empty-note">자재 사양은 미팅 후 이곳에 정리해 드립니다.</div></div>'; return; }
    list.innerHTML = groups.map(function (g) {
      var rec = g.status === 'recommended';
      var html = '<div class="card" style="margin-bottom: 16px;"><div class="spec-card-head"><div>' +
        (g.en ? '<div class="spec-cat-en">' + esc(g.en) + '</div>' : '') +
        '<div class="spec-card-title">' + esc(g.title || '') + '</div></div>' +
        '<span class="spec-status ' + (rec ? 'recommended' : 'confirmed') + '">' + esc(g.statusText || (rec ? '추천(협의)' : '확정')) + '</span></div>';
      if ((g.photos || []).length) html += '<div class="spec-grid">' + g.photos.map(function (p) {
        var cap = (p.name || '') + (p.desc ? ' · ' + p.desc : '');
        return '<div class="spec-cell" onclick="openSpecPhoto(this.dataset.src,this.dataset.cap)" data-src="' + esc(p.src) + '" data-cap="' + esc(cap) + '">' +
          '<div class="ph">' + (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') + '<img src="' + esc(p.src) + '" alt="' + esc(p.name || '') + '" loading="lazy"></div>' +
          '<div class="cap"><b>' + esc(p.name || '') + '</b>' + (p.desc ? '<em>' + esc(p.desc) + '</em>' : '') + '</div></div>';
      }).join('') + '</div>';
      if ((g.items || []).length) html += '<div class="spec-list" style="margin-top:' + ((g.photos || []).length ? '10px' : '0') + ';">' + g.items.map(function (it) {
        var thumb = it.photo ?
          '<div class="spec-thumb photo" onclick="openSpecPhoto(this.dataset.src,this.dataset.cap)" data-src="' + esc(it.photo) + '" data-cap="' + esc(it.name || '') + '"><img src="' + esc(it.photo) + '" alt="' + esc(it.name || '') + '"></div>' :
          '<div class="spec-thumb icon" style="background:linear-gradient(135deg,#f8fafc,#e2e8f0);">' + esc(it.icon || '📦') + '</div>';
        return '<div class="spec-row">' + thumb + '<div class="spec-body"><div class="spec-name">' + esc(it.name || '') + '</div>' +
          (it.desc ? '<div class="spec-desc">' + esc(it.desc) + '</div>' : '') + '</div></div>';
      }).join('') + '</div>';
      if (g.note) html += '<div class="spec-card-note">' + esc(g.note) + '</div>';
      return html + '</div>';
    }).join('');
  }

  /* ───────── 고객용: 계약 · 정산 (추가·변경 자동 합산) ───────── */
  function sumPaid(list, t) {
    return (list || []).reduce(function (a, p) { return (isIso(p.date) && p.date > t) ? a : a + (Number(p.amount) || 0); }, 0);
  }
  function calcPayment(P, t) {
    var total = Number(P.total) || 0;
    var steps = (P.steps || []).map(function (s) {
      var amount = s.amount != null ? Number(s.amount) : total * (Number(s.ratio) || 0) / 100;
      var shown = (s.paid || []).filter(function (p) { return !(isIso(p.date) && p.date > t); });
      return { s: s, amount: amount, paid: sumPaid(s.paid, t), shown: shown };
    });
    var changeSum = (P.changes || []).reduce(function (a, c) { return a + (Number(c.amount) || 0); }, 0);
    var changePaid = sumPaid(P.changesPaid, t);
    var final = total + changeSum;
    var paidAll = steps.reduce(function (a, x) { return a + x.paid; }, 0) + changePaid;
    return { total: total, steps: steps, changeSum: changeSum, changePaid: changePaid, final: final, paidAll: paidAll, left: final - paidAll };
  }
  function chip(paid, amount) {
    if (amount > 0 && paid >= amount) return '<span class="pay-chip done">✅ 입금 완료</span>';
    if (paid > 0) return '<span class="pay-chip partial">일부 입금</span>';
    return '<span class="pay-chip todo">입금 예정</span>';
  }
  function renderPayment() {
    var box = document.getElementById('pay-body');
    if (!box) return;
    var contact = document.getElementById('pay-contact');
    if (contact) contact.innerHTML = '금액·일정과 관련해 궁금하신 점은 ' + esc(BRAND.company || '') + ' ' + esc(ceoLabel()) +
      '(<a href="tel:' + esc(digits(BRAND.phone)) + '" style="color:var(--primary);font-weight:800;">' + esc(phoneText(BRAND.phone)) + '</a>)께 편하게 연락 주시면 바로 확인해 드립니다.';
    var P = window.PAYMENT, card = document.getElementById('pay-card');
    if (!P || !P.show) { if (card) card.hidden = true; return; }
    var t = today(), c = calcPayment(P, t);
    var html = '<div class="pay-total">' +
      '<div class="pay-sum-line"><span>최초 계약금액</span><b>' + won(c.total) + '</b></div>';
    if ((P.changes || []).length) html += '<div class="pay-sum-line"><span>추가·변경 합계</span><b class="' + (c.changeSum >= 0 ? 'chg-plus' : 'chg-minus') + '">' + signedWon(c.changeSum) + '</b></div>';
    html += '<div class="pay-sum-line"><span>최종 공사금액 ' + esc(P.vat || '') + '</span><b>' + won(c.final) + '</b></div></div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin:8px 0 2px;word-break:keep-all;">계약서 기준 대금 비율 <b style="color:var(--text-main);">' +
      (P.steps || []).map(function (s) { return s.ratio != null ? s.ratio : '-'; }).join(' / ') + '</b></div>';
    c.steps.forEach(function (x) {
      var s = x.s, detail = '';
      if (x.paid > 0) detail = '<div class="pay-detail">' + won(x.paid) + ' 입금<br><span class="pay-date">' +
        x.shown.map(function (p) { return esc(dotDate(p.date)) + ' ' + won(p.amount); }).join('<br>') + '</span></div>';
      else if (s.due) detail = '<div class="pay-detail">' + esc(s.due) + '</div>';
      html += '<div class="pay-row"><div class="pay-kind"><div class="pay-label">' + esc(s.label) +
        (s.ratio != null ? '<span class="pay-ratio">' + s.ratio + '%</span>' : '') + '</div><div class="pay-amount">' + won(x.amount) + '</div></div>' +
        '<div class="pay-status">' + chip(x.paid, x.amount) + detail + '</div></div>';
    });
    if ((P.changes || []).length) {
      var cd = c.changePaid > 0 ? '<div class="pay-detail">' + won(c.changePaid) + ' 입금</div>' : (P.changesDue ? '<div class="pay-detail">' + esc(P.changesDue) + '</div>' : '');
      html += '<div class="pay-row" style="display:block;"><div style="display:flex;gap:10px;align-items:center;"><div class="pay-kind"><div class="pay-label">추가·변경 공사</div>' +
        '<div class="pay-amount">' + signedWon(c.changeSum) + ' (' + P.changes.length + '건)</div></div>' +
        '<div class="pay-status">' + (c.changeSum > 0 ? chip(c.changePaid, c.changeSum) : '<span class="pay-chip todo">정산 반영</span>') + cd + '</div></div>' +
        '<div class="chg-list">' + P.changes.map(function (ch) {
          var a = Number(ch.amount) || 0;
          return '<div class="chg-row"><span>' + (ch.date ? '<span class="pay-date">' + esc(dotDate(ch.date).slice(5)) + '</span> ' : '') + esc(ch.title || '') + '</span>' +
            '<b class="' + (a >= 0 ? 'chg-plus' : 'chg-minus') + '">' + signedWon(a) + '</b></div>';
        }).join('') + '</div></div>';
    }
    html += '<div class="pay-sum"><div class="pay-sum-line"><span>누적 입금액</span><b>' + won(c.paidAll) + ' · ' +
      (c.final ? (c.paidAll / c.final * 100).toFixed(1) : '0.0') + '%</b></div><div class="pay-sum-line"><span>남은 금액</span><b>' +
      won(c.left) + '</b></div></div>';
    if (P.note) html += '<p class="pay-note">' + esc(P.note) + '</p>';
    box.innerHTML = html;
  }

  function renderHeaderCall() {
    var a = document.getElementById('header-call');
    if (!a) return;
    if (!digits(BRAND.phone)) { a.hidden = true; return; }
    a.href = 'tel:' + digits(BRAND.phone);
  }

  /* ───────── 협력업체용: 출입 정보 · 수칙 · 공사 전 사진 · 특이사항 ───────── */
  function renderAccess() {
    var grid = document.getElementById('access-grid');
    if (!grid) return;
    var A = window.ACCESS || {};
    var sub = document.getElementById('partner-sub');
    if (sub) sub.textContent = (BRAND.company || '') + ' 현장 안내 및 공정표';
    var door = A.doorCode ? A.doorCode : ceoLabel().trim() + '가 문자로 따로 안내';
    var item = function (title, val, cls, copy) {
      return '<div class="access-item full' + (copy ? ' copyable' : '') + '"' + (copy ? ' data-copy="' + esc(copy) + '"' : '') + '>' +
        '<div class="access-title">' + esc(title) + '</div><div class="access-val' + (cls ? ' ' + cls : '') + '">' + esc(val) + '</div></div>';
    };
    grid.innerHTML =
      item('현장 주소 (탭하여 복사)', A.address || '-', 'addr', A.address) +
      (A.lobby ? item('1층 공동현관 출입', A.lobby, 'addr') : '') +
      item(A.doorCode ? '세대 현관 비밀번호 (탭하여 복사)' : '세대 현관 비밀번호', door, A.doorCode ? '' : 'addr', A.doorCode || '') +
      (A.parking ? item('주차 안내', A.parking, 'addr') : '') +
      '<div class="access-item full" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
      '<div><div class="access-title">현장 총괄</div><div style="font-size:14px;font-weight:700;color:#fff;">' + esc(BRAND.company || '') + ' ' + esc(ceoLabel()) +
      ' · <span class="nowrap">' + esc(phoneText(BRAND.phone)) + '</span></div></div>' +
      '<a class="call-chip" href="tel:' + esc(digits(BRAND.phone)) + '">📞 통화</a></div>';
    var rules = (A.rules || []).slice();
    var rl = document.getElementById('rule-list');
    if (rl) rl.innerHTML = rules.map(function (r) { return '<li><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</li>'; }).join('');
    var call = document.getElementById('call-btn');
    if (call) { call.href = 'tel:' + digits(BRAND.phone); call.textContent = '📞 ' + ceoLabel().trim() + ' 통화'; }
    if (A.doorCode) { var cb = document.getElementById('copy-btn'); if (cb) cb.textContent = '📋 주소·비번 복사'; }
    grid.addEventListener('click', function (e) {
      var el = e.target.closest('[data-copy]');
      if (el && el.getAttribute('data-copy')) copyText(el.getAttribute('data-copy'));
    });
  }

  function renderPrePhotos() {
    var card = document.getElementById('pre-card');
    if (!card) return;
    var P = window.PARTNER || {}, photos = P.photos || [];
    if (!photos.length && !(P.notices || []).length) { card.hidden = true; return; }
    var hero = Math.min(photos.length, P.hero || 4);
    var tile = function (p, i, all) {
      var n = i + 1, label = String(n).padStart(2, '0');
      return '<div class="pre-item"' + (all ? ' data-photo="' + n + '" data-cap="' + esc(label + ' · ' + (p.caption || '')) + '"' : '') + ' onclick="openPreLightbox(' + n + ')">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.caption || '') + '" loading="lazy"><div class="pre-badge">' + label + ' ' + esc(p.caption || '') + '</div></div>';
    };
    document.getElementById('pre-grid').innerHTML = photos.slice(0, hero).map(function (p, i) { return tile(p, i, false); }).join('');
    document.getElementById('pre-all').innerHTML = photos.map(function (p, i) { return tile(p, i, true); }).join('');
    var notices = P.notices || [];
    document.getElementById('pre-notices').innerHTML = notices.length ? '<div class="memo-box"><div class="memo-title">⚠️ 현장 특이사항 ' + notices.length + '곳 (작업 전 확인)</div>' +
      notices.map(function (n, i) {
        return '<div class="memo-item"><b>' + (i + 1) + '. ' + esc(n.title || '') + '</b>' + esc(n.text || '') +
          (n.photo && photos[n.photo - 1] ? '<br><button class="memo-link" onclick="openPreLightbox(' + Number(n.photo) + ')">사진 ' + String(n.photo).padStart(2, '0') + ' 보기</button>' : '') + '</div>';
      }).join('') + '</div>' : '';
    var toggle = document.getElementById('pre-toggle');
    if (toggle) toggle.hidden = photos.length <= hero;
    if (!photos.length) { document.getElementById('pre-hint').textContent = ''; }
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { t.style.display = 'none'; }, 2500);
  }
  function copyText(val, okMsg) {
    var done = function () { showToast(okMsg || '📋 복사되었습니다: ' + val); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(val).then(done).catch(function () { fallbackCopy(val) ? done() : showToast('복사가 막힌 브라우저입니다. 길게 눌러 복사해 주세요.'); });
    } else if (fallbackCopy(val)) done();
    else showToast('복사가 막힌 브라우저입니다. 길게 눌러 복사해 주세요.');
  }
  function fallbackCopy(val) {
    try {
      var ta = document.createElement('textarea');
      ta.value = val; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
  function copyAccessInfo() {
    var A = window.ACCESS || {};
    var lines = ['[' + (BRAND.company || '') + ' 협력업체 현장 안내]', '- 현장: ' + (SITE.name || ''), '- 주소: ' + (A.address || '')];
    if (A.lobby) lines.push('- 공동현관: ' + A.lobby);
    lines.push('- 세대 현관 비밀번호: ' + (A.doorCode || ceoLabel().trim() + '가 문자로 안내'));
    if (A.parking) lines.push('- 주차: ' + A.parking);
    lines.push('- ' + ceoLabel().trim() + ': ' + phoneText(BRAND.phone));
    lines.push('- 소음 작업: ' + (SITE.noiseHours || '') + ' (주말·공휴일 금지)');
    lines.push('- 공정표: ' + location.href.split('?')[0]);
    copyText(lines.join('\n'), '📋 현장 정보가 복사되었습니다!');
  }

  /* ───────── 이벤트 연결 ───────── */
  document.addEventListener('click', function (e) {
    var cell = e.target.closest && e.target.closest('.cal-cell[data-date]');
    if (cell) openCalDetail(cell.getAttribute('data-date'));
  });
  document.addEventListener('keydown', function (e) {
    var lb = document.getElementById('pre-lightbox');
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape') closePreLightbox();
      else if (e.key === 'ArrowLeft') stepPrePhoto(-1);
      else if (e.key === 'ArrowRight') stepPrePhoto(1);
      return;
    }
    if (e.key === 'Escape') { closeCalDetail(); closeSpecPhoto(); }
  });
  (function swipe() {
    var lb = document.getElementById('pre-lightbox');
    if (!lb) return;
    var sx = 0, sy = 0, on = false;
    lb.addEventListener('touchstart', function (e) {
      on = e.touches.length === 1;
      if (on) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!on) return;
      on = false;
      var c = e.changedTouches[0], dx = c.clientX - sx, dy = c.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) stepPrePhoto(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  window.switchTab = switchTab;
  window.openSpecPhoto = openSpecPhoto;
  window.closeSpecPhoto = closeSpecPhoto;
  window.toggleLogMore = toggleLogMore;
  window.setScheduleView = setScheduleView;
  window.openCalDetail = openCalDetail;
  window.closeCalDetail = closeCalDetail;
  window.openPreLightbox = openPreLightbox;
  window.stepPrePhoto = stepPrePhoto;
  window.closePreLightbox = closePreLightbox;
  window.togglePreGallery = togglePreGallery;
  window.copyAccessInfo = copyAccessInfo;
  window.__calcPayment = calcPayment;   // 확인용

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.error('[' + name + '] data.js 내용을 확인해 주세요:', e); }
  }
  safe(fillSiteText, '현장명');
  safe(updateProgress, '진행률');
  safe(renderLogs, '현장 일지');
  safe(renderSpecs, '자재 스펙');
  safe(renderPayment, '정산');
  safe(renderHeaderCall, '연락처');
  safe(renderClientTimeline, '공정표');
  safe(renderPartnerSchedule, '공정표');
  safe(renderAccess, '출입 정보');
  safe(renderPrePhotos, '공사 전 사진');
  safe(function () { labelPre(false); }, '사진');
  try { if (localStorage.getItem(VIEW_KEY) === 'calendar') setScheduleView('calendar'); } catch (e) { /* 기본은 리스트 */ }
})();
