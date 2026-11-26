/* ════════════════════════════════════════════════════════════════
   ③ 화면 동작 파일 (app.js) — 고치지 않습니다.

   site.js(회사 설정)와 data.js(현장 데이터)를 읽어 아래를 자동으로 만듭니다.
   - 회사 이름·로고·색상·연락처 (고객용·협력업체용 화면 전체)
   - 상단 진행률 카드 (D-day · 공사 일차 · 공정률)
   - 현장일지 카드, 자재스펙 카드, 계약·정산(추가·변경 견적 포함)
   - 공정표 리스트·달력·날짜 상세창 (고객용·협력업체용)
   - 협력업체용 출입·도어락·주차 안내, 작업 수칙, 공사 전 사진, 특이사항
   - 사진 확대, 펼쳐보기 버튼
   확인용: 주소 끝에 ?today=2026-12-01 을 붙이면 그 날짜 기준으로 화면을 볼 수 있습니다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BRAND = window.BRAND || {};
  var SITE = window.SITE || {};
  var SCHEDULE = (window.SCHEDULE || []).slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  var PAGE = document.body.getAttribute('data-page') === 'partner' ? 'partner' : 'client';
  var DAY = 24 * 60 * 60 * 1000;
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var WORKDAYS = SITE.workDays || [1, 2, 3, 4, 5];
  var HOLIDAYS = SITE.holidays || [];
  var COLORS = BRAND.colors || {};
  var CEO = (BRAND.ceoTitle || '대표') + '님';

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

  /* ───────── 작은 도구 ───────── */
  function toUtc(iso) { var p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function toIso(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function dowOf(iso) { return new Date(toUtc(iso)).getUTCDay(); }
  function md(iso) { var p = iso.split('-'); return p[1] + '.' + p[2] + '(' + DOW[dowOf(iso)] + ')'; }
  function ymd(iso) { var p = iso.split('-'); return p[0] + '.' + p[1] + '.' + p[2] + '(' + DOW[dowOf(iso)] + ')'; }
  function ymdSpaced(iso) { var p = iso.split('-'); return p[0] + '.' + p[1] + '.' + p[2] + ' (' + DOW[dowOf(iso)] + ')'; }
  function korean(iso) { var p = iso.split('-').map(Number); return p[1] + '월 ' + p[2] + '일 (' + DOW[dowOf(iso)] + ')'; }
  function koreanTight(iso) { var p = iso.split('-').map(Number); return p[1] + '월 ' + p[2] + '일(' + DOW[dowOf(iso)] + ')'; }
  function addDays(iso, n) { return toIso(toUtc(iso) + n * DAY); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escBr(s) { return esc(s).replace(/\n/g, '<br>'); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function signedWon(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원'; }
  function phoneText(p) { return String(p || '').replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); }
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function isIso(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }

  // 오늘 날짜: ① 주소의 ?today= ② data.js 의 previewToday ③ 한국 시간 기준 실제 오늘
  function urlToday() { var m = /[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search); return m ? m[1] : ''; }
  function today() {
    if (urlToday()) return urlToday();
    if (isIso(SITE.previewToday)) return SITE.previewToday;
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var pick = function (t) { var h = parts.find(function (p) { return p.type === t; }); return h ? h.value : ''; };
      if (pick('year')) return pick('year') + '-' + pick('month') + '-' + pick('day');
    } catch (e) { /* Intl 미지원 기기는 기기 날짜 사용 */ }
    var n = new Date();
    return toIso(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }

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

  /* ───────── 회사 이름 · 색상 · 로고 ───────── */
  function applyBrand() {
    var root = document.documentElement.style;
    if (PAGE === 'partner') {          // 협력업체 화면은 어두운 바탕이라 머리글·버튼에만 대표 색을 씁니다
      if (COLORS.primary) root.setProperty('--brand', COLORS.primary);
      if (COLORS.primaryLight) root.setProperty('--brand-light', COLORS.primaryLight);
      if (COLORS.partnerAccent) root.setProperty('--accent', COLORS.partnerAccent);
    } else {
      if (COLORS.primary) root.setProperty('--primary', COLORS.primary);
      if (COLORS.primaryLight) root.setProperty('--primary-light', COLORS.primaryLight);
      if (COLORS.accent) root.setProperty('--accent', COLORS.accent);
    }

    var name = BRAND.name || '';
    document.title = name + (PAGE === 'partner' ? ' 협력업체 현장 가이드' : ' 현장 리포트') + (SITE.name ? ' · ' + SITE.name : '');
    var meta = function (n, v) { var el = document.querySelector('meta[name="' + n + '"]'); if (el && v) el.setAttribute('content', v); };
    meta('theme-color', COLORS.primary);
    meta('apple-mobile-web-app-title', BRAND.shortName || name);

    document.querySelectorAll('[data-brand]').forEach(function (el) {
      var k = el.getAttribute('data-brand');
      var v = { name: name, slogan: BRAND.slogan, ceo: (BRAND.ceoName || '') + ' ' + (BRAND.ceoTitle || ''), ceoTitle: CEO,
        phone: phoneText(BRAND.phone) }[k];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-brand-logo]').forEach(function (el) {
      el.innerHTML = BRAND.logoImage
        ? '<img src="' + esc(BRAND.logoImage) + '" alt="' + esc(name) + ' 로고">'
        : '<span>' + esc(BRAND.logoText || name.slice(0, 1)) + '</span>';
    });
    document.querySelectorAll('[data-brand-tel]').forEach(function (el) {
      if (BRAND.phone) el.href = 'tel:' + BRAND.phone; else el.hidden = true;
    });
    document.querySelectorAll('[data-brand-kakao]').forEach(function (el) {
      if (BRAND.kakaoUrl) el.href = BRAND.kakaoUrl; else el.hidden = true;
    });

    // 시연용 기준 날짜가 켜져 있으면 화면 맨 위에 작게 알립니다
    if (isIso(SITE.previewToday) && !urlToday()) {
      var bar = document.createElement('div');
      bar.className = 'preview-bar';
      bar.textContent = '🔎 시연 화면 · ' + ymd(SITE.previewToday) + ' 기준으로 표시 중';
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  /* ───────── 현장명·기간 글자 채우기 ───────── */
  function fillSiteText() {
    var calFirst = calStart(), calEnd = calLastDay();
    var weeks = Math.round((toUtc(calEnd) - toUtc(calFirst)) / DAY + 1) / 7;
    var offText = (WORKDAYS.indexOf(6) > -1 ? '일요일' : '주말') + (HOLIDAYS.length ? '·공휴일' : '') + ' 휴무';
    var sameYear = calFirst.slice(0, 4) === calEnd.slice(0, 4);
    var values = {
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
    if (!$('status-percent')) return;
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
      var plan = isWorkday(t) ? planOf(t) : null;
      stage = leftToEnd === 0 ? '최종 준공 검수 · 인수인계' : plan ? plan.title : '공사 진행 중';
      headline = dayText + ' · 공정률 ' + percent + '%';
    }
    setText('status-dday', dday);
    setText('status-percent', headline);
    var st = $('status-stage');
    if (st) st.innerHTML = '현재 공정: <strong>' + esc(stage) + '</strong>';
    var bar = $('progress-fill');
    if (bar) bar.style.width = percent + '%';
  }

  /* ───────── 공정표 리스트 ───────── */
  function noteHtml(text, cls) {
    if (text.indexOf('📍') === 0) return '<div class="timeline-meet">' + esc(text) + '</div>';
    return '<div class="' + cls + '">' + esc(text) + '</div>';
  }

  function renderClientTimeline() {
    var box = $('timeline');
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
    var box = $('partner-schedule');
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
    var grid = $('cal-grid');
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
    var box = $('cal-detail');
    if (!box) return;
    var plan = planOf(iso), t = today();
    var dateEl = $('cal-detail-date'), badge = $('cal-detail-badge');
    var titleEl = $('cal-detail-title'), notesEl = $('cal-detail-notes');
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
        // 진행 기록(✔ 11.25 …)은 그 날짜를 눌렀을 때만 보여 줍니다
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
    var box = $('cal-detail');
    if (box) box.classList.remove('open');
    document.body.style.overflow = '';
  }

  var VIEW_KEY = 'siteapp_' + (SITE.id || 'site') + '_' + PAGE + '_view';   // 현장·화면마다 따로 기억
  function setScheduleView(view) {
    var isCal = view === 'calendar';
    var listView = $('schedule-list-view'), calView = $('schedule-calendar-view');
    if (!listView || !calView) return;
    listView.hidden = isCal;
    calView.hidden = !isCal;
    [['view-btn-list', !isCal], ['view-btn-calendar', isCal]].forEach(function (b) {
      var el = $(b[0]);
      if (el) { el.classList.toggle('active', b[1]); el.setAttribute('aria-pressed', String(b[1])); }
    });
    if (isCal) renderCalendar();
    try { localStorage.setItem(VIEW_KEY, isCal ? 'calendar' : 'list'); } catch (e) { /* 저장이 막힌 브라우저 */ }
  }

  /* ───────── 고객용: 현장일지 ───────── */
  function photoTile(p, badge) {
    return '<div class="photo-item tap" data-zoom="' + esc(p.src) + '" data-cap="' + esc(p.cap || '') + '">' +
      '<img src="' + esc(p.src) + '" alt="' + esc(p.cap || '현장 사진') + '" loading="lazy">' +
      (badge ? '<div class="photo-badge">' + esc(p.cap || '') + '</div>' : '') + '</div>';
  }
  function logDayLabel(iso) {
    if (iso < SITE.start) return '착공 전 준비';
    if (iso > SITE.end) return '준공 후';
    if (!isWorkday(iso) && SITE.dayBase !== 'calendar') return '휴무일';
    return iso === SITE.start ? '착공 1일차' : dayNo(iso) + '일차';
  }
  function renderLogs() {
    var box = $('log-list');
    if (!box) return;
    var logs = (window.LOGS || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    box.innerHTML = logs.map(function (L) {
      var photos = L.photos || [], checks = L.checks || [];
      var strong = photos.length > 0;
      var html = '<div class="card' + (strong ? ' log-card-photo' : '') + '">' +
        '<div class="log-item"><div class="log-date">' + esc(ymdSpaced(L.date)) + ' · ' + esc(L.label || logDayLabel(L.date)) + '</div>' +
        '<div class="log-work">' + esc(L.title) + '</div></div>';
      if (L.text) html += '<p class="log-text">' + escBr(L.text) + '</p>';
      if (photos.length && photos.length <= 4) {
        html += '<div class="log-grid' + (photos.length === 1 ? ' single' : '') + '">' + photos.map(function (p) { return photoTile(p, false); }).join('') + '</div>';
      } else if (photos.length > 4) {
        html += '<div class="day1-hero">' + photos.slice(0, 2).map(function (p) { return photoTile(p, true); }).join('') + '</div>' +
          '<button type="button" class="gallery-toggle" data-total="' + photos.length + '">전체 ' + photos.length + '장 펼쳐보기 (' + (photos.length - 2) + '장 더)</button>' +
          '<div class="day1-gallery" hidden>' + photos.slice(2).map(function (p) { return photoTile(p, true); }).join('') + '</div>';
      }
      if (photos.length) html += '<div class="log-hint">📷 사진 터치 시 확대</div>';
      if (checks.length) {
        html += '<div class="check-box"><div class="check-head">확인된 체크 포인트 ' + checks.length + '곳</div>' +
          checks.map(function (c, i) {
            return '<div class="check-item"><div class="check-num">' + (i + 1) + '</div><div>' +
              '<div class="check-title">' + esc(c.title) + '</div><div class="check-desc">' + escBr(c.desc) + '</div></div></div>';
          }).join('') + '</div>';
      }
      return html + '</div>';
    }).join('');
  }
  function toggleGallery(btn) {
    var box = btn.nextElementSibling;
    if (!box) return;
    var willOpen = box.hasAttribute('hidden');
    if (willOpen) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    var total = Number(btn.getAttribute('data-total'));
    btn.textContent = willOpen ? '전체 ' + total + '장 접기' : '전체 ' + total + '장 펼쳐보기 (' + (total - 2) + '장 더)';
    if (!willOpen) { var card = btn.closest('.card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  /* ───────── 고객용: 자재스펙 ───────── */
  var STATUS_TEXT = { confirmed: '확정', recommended: '추천(협의)', changed: '변경' };
  function renderSpecs() {
    var box = $('spec-list');
    if (!box) return;
    var S = window.SPECS || { groups: [] }, groups = S.groups || [];

    var cat = BRAND.catalog || {};
    var catBox = $('catalog-banner');
    if (catBox) {
      if (cat.show && cat.url) {
        catBox.innerHTML = '<div class="catalog-title">' + esc((BRAND.name || '') + ' ' + (cat.title || '자재 도감')) + '</div>' +
          '<p class="catalog-desc">' + esc(cat.desc || '') + '</p>' +
          '<a class="catalog-btn" href="' + esc(cat.url) + '" target="_blank" rel="noopener">' + esc(cat.button || '자재 도감 열기') + '</a>';
      } else catBox.hidden = true;
    }
    var noticeBox = $('spec-notice');
    if (noticeBox) { if (S.notice) $('spec-notice-text').textContent = S.notice; else noticeBox.hidden = true; }

    var count = function (st) { return groups.filter(function (g) { return g.status === st; }).length; };
    var legend = '';
    if (count('confirmed')) legend += '<div class="spec-legend-item"><span class="spec-dot" style="background:#10b981;"></span>확정 ' + count('confirmed') + '개 공종</div>';
    if (count('recommended')) legend += '<div class="spec-legend-item"><span class="spec-dot" style="background:#f59e0b;"></span>추천(협의) ' + count('recommended') + '개 공종</div>';
    if (count('changed')) legend += '<div class="spec-legend-item"><span class="spec-dot" style="background:#d97706;"></span>변경 ' + count('changed') + '개 공종</div>';
    legend += '<div class="spec-legend-item" style="margin-left:auto; font-weight:500; color:#94a3b8;">📷 사진 터치 시 확대</div>';
    var lg = $('spec-legend');
    if (lg) lg.innerHTML = legend;

    box.innerHTML = groups.map(function (g) {
      var st = STATUS_TEXT[g.status] ? g.status : 'confirmed';
      var html = '<div class="card" style="margin-bottom: 16px;"><div class="spec-card-head"><div>' +
        (g.en ? '<div class="spec-cat-en">' + esc(g.en) + '</div>' : '') +
        '<div class="spec-card-title">' + esc(g.title) + '</div></div>' +
        '<span class="spec-status ' + st + '">' + esc(g.statusText || STATUS_TEXT[st]) + '</span></div>';
      var photos = g.photos || [], items = g.items || [];
      if (photos.length) {
        html += '<div class="spec-grid">' + photos.map(function (p) {
          var cap = (p.name || '') + (p.desc ? ' · ' + p.desc : '');
          return '<div class="spec-cell" data-zoom="' + esc(p.src) + '" data-cap="' + esc(cap) + '">' +
            '<div class="ph">' + (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') +
            '<img src="' + esc(p.src) + '" alt="' + esc(p.name || '') + '" loading="lazy"></div>' +
            '<div class="cap"><b>' + esc(p.name) + '</b>' + (p.desc ? '<em>' + esc(p.desc) + '</em>' : '') + '</div></div>';
        }).join('') + '</div>';
      }
      if (items.length) {
        html += '<div class="spec-list"' + (photos.length ? ' style="margin-top:10px;"' : '') + '>' + items.map(function (it) {
          var thumb = it.photo
            ? '<div class="spec-thumb photo" data-zoom="' + esc(it.photo) + '" data-cap="' + esc(it.name || '') + '"><img src="' + esc(it.photo) + '" alt="' + esc(it.name || '') + '"></div>'
            : '<div class="spec-thumb icon">' + esc(it.icon || '📐') + '</div>';
          return '<div class="spec-row">' + thumb + '<div class="spec-body"><div class="spec-name">' + esc(it.name) + '</div>' +
            (it.desc ? '<div class="spec-desc">' + esc(it.desc) + '</div>' : '') + '</div></div>';
        }).join('') + '</div>';
      }
      if (g.note) html += '<div class="spec-card-note">' + esc(g.note) + '</div>';
      return html + '</div>';
    }).join('');
  }

  /* ───────── 고객용: 계약 · 정산 (추가·변경 견적 포함) ───────── */
  function renderPayment() {
    var card = $('pay-card'), box = $('pay-body');
    if (!box) return;
    var P = window.PAYMENT;
    if (!P || !P.show) { if (card) card.hidden = true; return; }
    var steps = P.steps || [], changes = P.changes || [];
    var base = Number(P.total) || 0;
    var changeSum = changes.reduce(function (a, c) { return a + (Number(c.amount) || 0); }, 0);
    var grand = base + changeSum;
    var ratioSum = steps.reduce(function (a, s) { return a + (Number(s.ratio) || 0); }, 0);

    // 회차별 금액: 비율로 나누고, 끝전은 마지막 회차에 모읍니다. 추가·변경 금액은 changesWith 회차에 더합니다.
    var withIdx = -1;
    steps.forEach(function (s, i) { if (P.changesWith && s.label === P.changesWith) withIdx = i; });
    if (changes.length && withIdx < 0 && P.changesWith !== '') withIdx = steps.length - 1;   // '' 이면 회차와 따로 정산
    // 추가·변경 금액을 따로 받은 기록 (changesPaid). 합산 회차가 있으면 그 회차의 입금으로도 함께 보여 줍니다.
    var changesPaid = P.changesPaid || [];
    var changePaid = changesPaid.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0);
    var amounts = steps.map(function (s) { return Math.round(base * (Number(s.ratio) || 0) / 100); });
    if (ratioSum === 100 && amounts.length) {
      var sumBut = amounts.slice(0, -1).reduce(function (a, b) { return a + b; }, 0);
      amounts[amounts.length - 1] = base - sumBut;
    }

    var html = '';
    html += '<div class="amount-box">' +
      '<div class="amount-row"><span>기본 계약금액</span><b>' + won(base) + '</b></div>';
    if (changes.length) {
      html += '<div class="amount-row"><span>추가·변경 견적 (' + changes.length + '건)</span><b class="' + (changeSum >= 0 ? 'plus' : 'minus') + '">' + signedWon(changeSum) + '</b></div>';
    }
    html += '<div class="amount-row total"><span>최종 공사금액</span><span>' + won(grand) + '</span></div>' +
      (P.vat ? '<div class="amount-vat">' + esc(P.vat) + '</div>' : '') + '</div>';

    if (ratioSum !== 100) html += '<div class="pay-warn">※ 회차 비율 합계가 ' + ratioSum + '% 입니다. data.js 의 ratio 합계를 100으로 맞춰 주세요.</div>';

    html += '<div class="pay-sub-title">회차별 대금 · 입금 현황 <span>' + steps.map(function (s) { return s.ratio; }).join(' / ') + '</span></div>';
    var paidAll = withIdx < 0 ? changePaid : 0;
    steps.forEach(function (s, i) {
      var amount = amounts[i] + (i === withIdx ? changeSum : 0);
      var records = (s.paid || []).slice();
      if (i === withIdx) records = records.concat(changesPaid.map(function (p) { return { date: p.date, amount: p.amount, extra: true }; }));
      var paid = records.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0);
      paidAll += paid;
      var chip, detail = '';
      if (paid >= amount && amount > 0) chip = '<span class="pay-chip done">✅ 입금 완료</span>';
      else if (paid > 0) chip = '<span class="pay-chip partial">일부 입금</span>';
      else chip = '<span class="pay-chip todo">입금 예정</span>';
      if (paid > 0) {
        detail = '<div class="pay-detail">' + won(paid) + ' 입금' + (paid < amount ? ' · 남은 ' + won(amount - paid) : '') +
          '<br><span class="pay-date">' + records.map(function (p) { return esc(p.date) + ' ' + won(p.amount) + (p.extra ? ' (추가·변경)' : ''); }).join('<br>') + '</span></div>';
      } else if (s.due) detail = '<div class="pay-detail">' + esc(s.due) + '</div>';
      var extra = i === withIdx && changeSum ? '<div class="pay-extra">기본 ' + won(amounts[i]) + ' ' + signedWon(changeSum) + ' (추가·변경)</div>' : '';
      html += '<div class="pay-row"><div class="pay-kind"><div class="pay-label">' + esc(s.label) +
        '<span class="pay-ratio">' + esc(s.ratio) + '%</span></div><div class="pay-amount">' + won(amount) + '</div>' + extra + '</div>' +
        '<div class="pay-status">' + chip + detail + '</div></div>';
    });

    if (changes.length) {
      html += '<div class="pay-sub-title" style="margin-top:14px;">추가·변경 견적 내역 <span>' + esc(withIdx >= 0 ? steps[withIdx].label + '과 함께 정산' : (P.changesDue || '따로 정산')) + '</span></div>';
      changes.forEach(function (c) {
        var amt = Number(c.amount) || 0;
        html += '<div class="change-row"><div class="change-main"><div class="change-title">' + esc(c.title) + '</div>' +
          '<div class="change-meta">' + esc(c.date || '') + (c.note ? ' · ' + esc(c.note) : '') + '</div></div>' +
          '<div class="change-amt ' + (amt >= 0 ? 'plus' : 'minus') + '">' + signedWon(amt) + '</div></div>';
      });
      html += '<div class="change-row change-total"><div class="change-main"><div class="change-title">추가·변경 합계</div></div>' +
        '<div class="change-amt ' + (changeSum >= 0 ? 'plus' : 'minus') + '">' + signedWon(changeSum) + '</div></div>';
      if (changesPaid.length || withIdx < 0) {
        var cChip = changeSum <= 0 ? '<span class="pay-chip todo">정산 반영</span>'
          : changePaid >= changeSum ? '<span class="pay-chip done">✅ 입금 완료</span>'
          : changePaid > 0 ? '<span class="pay-chip partial">일부 입금</span>' : '<span class="pay-chip todo">입금 예정</span>';
        html += '<div class="change-row change-paid"><div class="change-main"><div class="change-title">추가·변경 입금 기록</div>' +
          '<div class="change-meta">' + (changesPaid.length
            ? changesPaid.map(function (p) { return esc(p.date) + ' ' + won(p.amount); }).join('<br>') + (changeSum > changePaid ? '<br>남은 추가금 ' + won(changeSum - changePaid) : '')
            : esc(P.changesDue || '아직 입금 기록이 없습니다')) + '</div></div>' + cChip + '</div>';
      }
    }

    html += '<div class="pay-sum"><div class="pay-sum-line"><span>누적 입금액</span><b>' + won(paidAll) + ' · ' +
      (grand ? (paidAll / grand * 100).toFixed(1) : '0.0') + '%</b></div><div class="pay-sum-line"><span>남은 금액</span><b>' +
      won(grand - paidAll) + '</b></div></div>';
    if (P.note) html += '<p class="pay-note">' + esc(P.note) + '</p>';
    box.innerHTML = html;
  }

  /* ───────── 사진 확대 (고객용) ───────── */
  function openSpecPhoto(src, caption) {
    var m = $('photo-modal');
    if (!m) return;
    $('photo-modal-img').src = src;
    $('photo-modal-caption').textContent = caption || '';
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSpecPhoto() {
    var m = $('photo-modal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  }
  function switchTab(name, el) {
    document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    var target = $('tab-' + name);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ───────── 협력업체용: 출입 · 수칙 · 공사 전 사진 · 특이사항 ───────── */
  function contact() {
    var A = window.ACCESS || {};
    return {
      name: A.contactName || ((BRAND.name || '') + ' ' + (BRAND.ceoName || '') + ' ' + (BRAND.ceoTitle || '')).trim(),
      short: A.contactName || ((BRAND.ceoName || '') + ' ' + (BRAND.ceoTitle || '')).trim(),
      phone: A.phone || BRAND.phone || ''
    };
  }
  function renderAccess() {
    var grid = $('access-grid');
    if (!grid) return;
    var A = window.ACCESS || {}, C = contact();
    var door = A.doorCode ? A.doorCode : CEO + '이 문자로 따로 안내';
    var item = function (title, val, cls, copy) {
      if (!val) return '';
      return '<div class="access-item full"' + (copy ? ' data-copy="' + esc(copy) + '" style="cursor:pointer;"' : '') + '>' +
        '<div class="access-title">' + esc(title) + '</div><div class="access-val' + (cls ? ' ' + cls : '') + '">' + esc(val) + '</div></div>';
    };
    grid.innerHTML =
      item('현장 주소 (탭하여 복사)', A.address, 'addr', A.address) +
      item('1층 공동현관 출입', A.lobby, 'addr') +
      item(A.doorCode ? '세대 현관 도어락 비밀번호 (탭하여 복사)' : '세대 현관 도어락 비밀번호', door, A.doorCode ? '' : 'addr', A.doorCode || '') +
      item('🚗 주차 안내', A.parking, 'addr') +
      '<div class="access-item full contact-row">' +
      '<div><div class="access-title">현장 총괄</div><div class="contact-name">' + esc(C.name) + ' · ' + esc(phoneText(C.phone)) + '</div></div>' +
      (C.phone ? '<a class="contact-call" href="tel:' + esc(C.phone) + '">📞 통화</a>' : '') + '</div>';

    var rules = (A.rules || []).slice();
    if (A.parking) rules.splice(Math.min(3, rules.length), 0, ['주차', A.parking]);
    var rl = $('rule-list');
    if (rl) rl.innerHTML = rules.map(function (r) { return '<li><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</li>'; }).join('');

    var call = $('call-btn');
    if (call) { call.href = 'tel:' + C.phone; call.textContent = '📞 ' + C.short + '님 통화'; }
    if (A.doorCode && $('copy-btn')) $('copy-btn').textContent = '📋 주소·비번 복사';
    grid.addEventListener('click', function (e) {
      var el = e.target.closest('[data-copy]');
      if (el && el.getAttribute('data-copy')) copyText(el.getAttribute('data-copy'));
    });
  }

  function renderPrePhotos() {
    var hero = $('pre-grid');
    if (!hero) return;
    var P = window.PARTNER || {}, list = P.prePhotos || [], n = P.heroCount || 4;
    var card = hero.closest('.photo-card');
    if (!list.length && !(P.notes || []).length) { if (card) card.hidden = true; return; }
    var tile = function (p, i, all) {
      var num = String(i + 1).padStart(2, '0');
      return '<div class="pre-item"' + (all ? ' data-photo="' + (i + 1) + '" data-cap="' + esc(p.cap || num + ' · ' + (p.label || '')) + '"' : '') +
        ' data-open="' + (i + 1) + '"><img src="' + esc(p.src) + '" alt="' + esc(p.cap || p.label || '') + '"' + (all ? ' loading="lazy"' : '') + '>' +
        '<div class="pre-badge">' + num + ' ' + esc(p.label || '') + '</div></div>';
    };
    hero.innerHTML = list.slice(0, n).map(function (p, i) { return tile(p, i, false); }).join('');
    $('pre-all').innerHTML = list.map(function (p, i) { return tile(p, i, true); }).join('');
    var toggle = $('pre-toggle');
    if (toggle) toggle.hidden = list.length <= n;

    var notes = P.notes || [], memo = $('memo-box');
    if (memo) {
      if (!notes.length) memo.hidden = true;
      else memo.innerHTML = '<div class="memo-title">⚠️ 현장 특이사항 ' + notes.length + '곳 (작업 전 확인)</div>' +
        notes.map(function (m, i) {
          return '<div class="memo-item"><b>' + (i + 1) + '. ' + esc(m.title) + '</b>' + escBr(m.desc) +
            (m.photo && list[m.photo - 1] ? '<br><button class="memo-link" data-open="' + m.photo + '">사진 ' + String(m.photo).padStart(2, '0') + ' 보기</button>' : '') + '</div>';
        }).join('');
    }
  }

  var prePhotos = [], preIndex = 0;
  function collectPrePhotos() { prePhotos = Array.prototype.slice.call(document.querySelectorAll('#pre-all .pre-item')); }
  function renderPrePhoto() {
    var item = prePhotos[preIndex];
    if (!item) return;
    var img = item.querySelector('img'), target = $('pre-lb-img');
    target.src = img.getAttribute('src');
    target.alt = img.getAttribute('alt') || '';
    $('pre-lb-caption').textContent = item.getAttribute('data-cap') || '';
    $('pre-lb-count').textContent = (preIndex + 1) + ' / ' + prePhotos.length + ' · 좌우로 넘기기';
  }
  function openPreLightbox(num) {
    collectPrePhotos();
    preIndex = 0;
    for (var i = 0; i < prePhotos.length; i++) if (prePhotos[i].getAttribute('data-photo') === String(num)) { preIndex = i; break; }
    renderPrePhoto();
    $('pre-lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function stepPrePhoto(delta) {
    if (!prePhotos.length) return;
    preIndex = (preIndex + delta + prePhotos.length) % prePhotos.length;
    renderPrePhoto();
  }
  function closePreLightbox() {
    var lb = $('pre-lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    $('pre-lb-img').removeAttribute('src');
    document.body.style.overflow = '';
  }
  function labelPre(open) {
    var n = document.querySelectorAll('#pre-all .pre-item').length;
    var btn = $('pre-toggle');
    if (btn) btn.textContent = open ? '전체 ' + n + '장 접기' : '전체 ' + n + '장 펼쳐보기';
    var hint = $('pre-hint');
    if (hint) hint.textContent = n ? '📷 사진을 누르면 크게 보기 · ‹ › 버튼으로 ' + n + '장 넘겨보기' : '';
  }
  function togglePreGallery() {
    var box = $('pre-all');
    var willOpen = box.hasAttribute('hidden');
    if (willOpen) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    labelPre(willOpen);
    if (!willOpen) { var card = box.closest('.photo-card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  /* ───────── 협력업체용: 복사 · 알림 ───────── */
  function showToast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { t.style.display = 'none'; }, 2500);
  }
  function writeClipboard(val, ok, fail) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(ok).catch(fail);
    } else fail();
  }
  function copyText(val) {
    writeClipboard(val, function () { showToast('📋 복사되었습니다: ' + val); },
      function () { showToast('복사가 막힌 브라우저입니다. 길게 눌러 복사해 주세요.'); });
  }
  function copyAccessInfo() {
    var A = window.ACCESS || {}, C = contact();
    var lines = ['[' + (BRAND.name || '') + ' 협력업체 현장 안내]', '- 현장: ' + (SITE.name || ''), '- 주소: ' + (A.address || '')];
    if (A.lobby) lines.push('- 1층 공동현관: ' + A.lobby);
    lines.push('- 세대 도어락: ' + (A.doorCode || CEO + '이 문자로 안내'));
    if (A.parking) lines.push('- 주차: ' + A.parking);
    lines.push('- ' + C.short + ': ' + phoneText(C.phone));
    lines.push('- 소음시간: ' + (SITE.noiseHours || '') + ' 준수 (주말·공휴일 금지)');
    lines.push('- 현장 가이드: ' + location.href.split('?')[0]);
    writeClipboard(lines.join('\n'), function () { showToast('📋 현장 정보가 복사되었습니다!'); },
      function () { showToast('복사가 막힌 브라우저입니다.'); });
  }

  /* ───────── 이벤트 연결 ───────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var cell = e.target.closest('.cal-cell[data-date]');
    if (cell) { openCalDetail(cell.getAttribute('data-date')); return; }
    var zoom = e.target.closest('[data-zoom]');
    if (zoom) { openSpecPhoto(zoom.getAttribute('data-zoom'), zoom.getAttribute('data-cap')); return; }
    var g = e.target.closest('.gallery-toggle[data-total]');
    if (g) { toggleGallery(g); return; }
    var pre = e.target.closest('[data-open]');
    if (pre) { e.stopPropagation(); openPreLightbox(pre.getAttribute('data-open')); }
  });
  document.addEventListener('keydown', function (e) {
    var lb = $('pre-lightbox');
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape') closePreLightbox();
      else if (e.key === 'ArrowLeft') stepPrePhoto(-1);
      else if (e.key === 'ArrowRight') stepPrePhoto(1);
      return;
    }
    if (e.key === 'Escape') { closeCalDetail(); closeSpecPhoto(); }
  });
  (function swipe() {   // 라이트박스 좌우 스와이프
    var lb = $('pre-lightbox');
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

  // HTML 의 onclick 에서 부르는 함수들
  window.switchTab = switchTab;
  window.openSpecPhoto = openSpecPhoto;
  window.closeSpecPhoto = closeSpecPhoto;
  window.setScheduleView = setScheduleView;
  window.openCalDetail = openCalDetail;
  window.closeCalDetail = closeCalDetail;
  window.openPreLightbox = openPreLightbox;
  window.stepPrePhoto = stepPrePhoto;
  window.closePreLightbox = closePreLightbox;
  window.togglePreGallery = togglePreGallery;
  window.copyAccessInfo = copyAccessInfo;

  // 처음 열 때
  applyBrand();
  fillSiteText();
  updateProgress();
  renderLogs();
  renderSpecs();
  renderPayment();
  renderClientTimeline();
  renderPartnerSchedule();
  renderAccess();
  renderPrePhotos();
  labelPre(false);
  try { if (localStorage.getItem(VIEW_KEY) === 'calendar') setScheduleView('calendar'); } catch (e) { /* 기본은 리스트 */ }
})();
