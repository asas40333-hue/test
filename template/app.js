/* ════════════════════════════════════════════════════════════════
   메종플러스 현장 웹앱 · 공통 동작 (틀) — 새 현장에서도 고치지 않습니다.
   site.js 의 SITE·SCHEDULE 을 읽어 아래를 자동으로 만듭니다.
   - 상단 진행률 카드 (D-day · 공사 일차 · 공정률)
   - 공정표 리스트 (고객용 타임라인 / 협력업체용 카드)
   - 달력 보기, 날짜 상세창, 마지막 보기 방식 기억
   - 화면 곳곳의 현장명·기간 글자 (data-site 표시가 붙은 곳)
   - 사진 확대, 사진 펼치기 버튼의 장수
   확인용: 주소 끝에 ?today=2027-01-05 를 붙이면 그 날짜 기준으로 화면을 볼 수 있습니다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var SCHEDULE = (window.SCHEDULE || []).slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  var PAGE = document.body.getAttribute('data-page') === 'partner' ? 'partner' : 'client';
  var DAY = 24 * 60 * 60 * 1000;
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var WORKDAYS = SITE.workDays || [1, 2, 3, 4, 5];
  var HOLIDAYS = SITE.holidays || [];

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

  /* ───────── 날짜 도구 ───────── */
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
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 한국 시간 기준 오늘 (주소에 ?today=YYYY-MM-DD 가 있으면 그 날짜로 확인)
  function today() {
    var m = /[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    if (m) return m[1];
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

  /* ───────── 현장명·기간 글자 채우기 ───────── */
  function fillSiteText() {
    var calFirst = calStart(), calEnd = calLastDay();
    var weeks = Math.round((toUtc(calEnd) - toUtc(calFirst)) / DAY + 1) / 7;
    var offText = (WORKDAYS.indexOf(6) > -1 ? '일요일' : '주말') + (HOLIDAYS.length ? '·공휴일' : '') + ' 휴무';
    var sameYear = calFirst.slice(0, 4) === calEnd.slice(0, 4);   // 해를 넘기면 끝 날짜에도 연도 표시
    var values = {
      brand: SITE.brand,
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

  var VIEW_KEY = 'maison_' + (SITE.id || 'site') + '_' + PAGE + '_view';   // 현장·화면마다 따로 기억
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

  // 1일차 사진 펼치기 버튼: 장수를 사진 개수로 자동 계산
  function galleryCounts() {
    var hero = document.querySelectorAll('.day1-hero .photo-item').length;
    var more = document.querySelectorAll('#day1-gallery .photo-item').length;
    return { total: hero + more, more: more };
  }
  function labelDay1(btn, open) {
    var c = galleryCounts();
    btn.textContent = open ? '전체 ' + c.total + '장 접기' : '전체 ' + c.total + '장 펼쳐보기 (' + c.more + '장 더)';
  }
  function toggleDay1(btn) {
    var box = document.getElementById('day1-gallery');
    if (!box) return;
    var willOpen = box.hasAttribute('hidden');
    if (willOpen) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    labelDay1(btn, willOpen);
    if (!willOpen) { var card = btn.closest('.card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
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

  (function swipe() {   // 라이트박스 좌우 스와이프
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

  // HTML 의 onclick 에서 부르는 함수들
  window.switchTab = switchTab;
  window.openSpecPhoto = openSpecPhoto;
  window.closeSpecPhoto = closeSpecPhoto;
  window.toggleDay1 = toggleDay1;
  window.setScheduleView = setScheduleView;
  window.openCalDetail = openCalDetail;
  window.closeCalDetail = closeCalDetail;
  window.openPreLightbox = openPreLightbox;
  window.stepPrePhoto = stepPrePhoto;
  window.closePreLightbox = closePreLightbox;
  window.togglePreGallery = togglePreGallery;

  // 처음 열 때
  fillSiteText();
  updateProgress();
  renderClientTimeline();
  renderPartnerSchedule();
  var d1 = document.querySelector('.gallery-toggle[data-day1]');
  if (d1) labelDay1(d1, false);
  labelPre(false);
  try { if (localStorage.getItem(VIEW_KEY) === 'calendar') setScheduleView('calendar'); } catch (e) { /* 기본은 리스트 */ }
})();
