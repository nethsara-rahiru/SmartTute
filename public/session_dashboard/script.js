/**
 * SmartTute — Live Session Dashboard
 * Real-time student monitoring for active class sessions.
 * Reads from localStorage keys used by Live Class & Session Scheduler.
 * Includes a full Demo Mode with 25 simulated students.
 */

(function () {
  'use strict';

  /* ── Storage Keys ────────────────────────────────────────────────── */
  const KEY_CLASSES   = 'smarttute_published_classes';
  const KEY_SESSIONS  = 'smarttute_sessions';
  const KEY_RESPONSES = 'smarttute_session_responses';
  const KEY_THEME     = 'smarttute_theme';

  /* ── State ───────────────────────────────────────────────────────── */
  let activeSessionId   = null;
  let activeSession     = null;
  let activeClass       = null;
  let isDemo            = false;
  let demoState         = null;
  let currentCpFilter   = 'all';
  let allExpandedRows   = new Set();
  let previousKpiVals   = {};
  let refreshInterval   = null;
  let refreshTimerId    = null;
  let REFRESH_PERIOD_MS = 3000;
  let refreshStartTs    = 0;
  let lastSortKey       = 'joined';
  let lastSearchQuery   = '';

  /* ── DOM Refs ────────────────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const dashGate       = $('dashGate');
  const dashContent    = $('dashContent');
  const sessionPicker  = $('sessionPickerSelect');
  const btnMonitor     = $('btnMonitorSession');
  const btnStartDemo   = $('btnStartDemo');
  const livePill       = $('livePill');
  const liveLabel      = $('liveLabel');
  const sessionTitle   = $('sessionTitle');
  const sessionIdBadge = $('sessionIdBadge');
  const sessionTimeBadge=$('sessionTimeBadge');
  const lastUpdated    = $('lastUpdated');
  const refreshFill    = $('refreshRingFill');
  const demoBanner     = $('demoBanner');
  const btnDemoToggle  = $('btnDemoToggle');
  const btnExitDemo    = $('btnExitDemo');
  const btnChangeSession=$('btnChangeSessions');
  const cpTabsBar      = $('cpTabsBar');
  const donutChart     = $('donutChart');
  const barChart       = $('barChart');
  const stackedBars    = $('stackedBars');
  const rosterSearch   = $('rosterSearch');
  const rosterSort     = $('rosterSort');
  const rosterBody     = $('rosterBody');
  const rosterFooter   = $('rosterFooter');
  const btnExpandAll   = $('btnExpandAll');

  /* ── Theme ───────────────────────────────────────────────────────── */
  const savedTheme = localStorage.getItem(KEY_THEME);
  const themeToggle = $('themeToggle');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.textContent = '☾';
  }
  if (themeToggle) {
    themeToggle.onclick = () => {
      const isDark = document.body.classList.toggle('dark-mode');
      themeToggle.textContent = isDark ? '☾' : '☼';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      localStorage.setItem(KEY_THEME, isDark ? 'dark' : 'light');
    };
  }

  /* ── Nav Menu ────────────────────────────────────────────────────── */
  const menuButton  = $('menuButton');
  const sideMenu    = $('sideMenu');
  const menuBackdrop= $('menuBackdrop');
  const closeMenu   = $('closeMenu');
  function setMenu(open) {
    if (!sideMenu) return;
    sideMenu.classList.toggle('open', open);
    menuBackdrop && menuBackdrop.classList.toggle('visible', open);
    menuButton && menuButton.setAttribute('aria-expanded', open);
  }
  if (menuButton)   menuButton.onclick   = () => setMenu(!sideMenu.classList.contains('open'));
  if (closeMenu)    closeMenu.onclick    = () => setMenu(false);
  if (menuBackdrop) menuBackdrop.onclick = () => setMenu(false);

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (e) { return fallback; }
  }

  function formatTimeSec(sec) {
    if (!sec && sec !== 0) return '—';
    sec = Math.round(sec);
    if (sec < 60) return sec + 's';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
  }

  function pct(num, den) {
    if (!den) return 0;
    return Math.round((num / den) * 100);
  }

  function avatarClass(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return 'avatar-' + (Math.abs(hash) % 8);
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── API Helpers & Storage ────────────────────────────────────────── */
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  /* ── Session Picker Gate ─────────────────────────────────────────── */
  async function populateSessionPicker() {
    sessionPicker.innerHTML = '<option value="">Loading sessions...</option>';
    btnMonitor.disabled = true;

    // Fetch local and server sessions
    const localSessions = readJson(KEY_SESSIONS, {});
    let apiSessionsList = await apiFetch('/api/sessions');
    
    const sessionsMap = {};
    // First fill local
    Object.keys(localSessions).forEach(id => {
      sessionsMap[id] = localSessions[id];
    });

    // Merge API sessions
    if (Array.isArray(apiSessionsList)) {
      apiSessionsList.forEach(s => {
        const id = s.sessionId || s._id;
        sessionsMap[id] = {
          sessionId: id,
          title: s.title || id,
          classId: s.classId,
          startAt: s.startAt || s.createdAt,
          participants: s.participants || []
        };
      });
    }

    const keys = Object.keys(sessionsMap);
    sessionPicker.innerHTML = '<option value="">-- Choose a Session --</option>';
    keys.sort((a, b) => {
      const tA = new Date(sessionsMap[a].startAt || 0).getTime();
      const tB = new Date(sessionsMap[b].startAt || 0).getTime();
      return tB - tA;
    }).forEach(key => {
      const s = sessionsMap[key];
      const opt = document.createElement('option');
      opt.value = key;
      const d = s.startAt ? new Date(s.startAt).toLocaleString() : 'Unknown time';
      opt.textContent = (s.title || key) + ' — ' + d;
      sessionPicker.appendChild(opt);
    });

    if (!keys.length) {
      const opt = document.createElement('option');
      opt.disabled = true;
      opt.textContent = 'No sessions found — create one in Session Scheduler';
      sessionPicker.appendChild(opt);
    }
  }

  sessionPicker && sessionPicker.addEventListener('change', () => {
    btnMonitor.disabled = !sessionPicker.value;
  });

  btnMonitor && btnMonitor.addEventListener('click', () => {
    const sid = sessionPicker.value;
    if (!sid) return;
    loadSession(sid);
  });

  btnStartDemo && btnStartDemo.addEventListener('click', () => {
    startDemoMode();
  });

  /* ── Load Session ────────────────────────────────────────────────── */
  async function loadSession(sessionId) {
    let session = null;

    // Try API first
    const apiSession = await apiFetch(`/api/sessions/${sessionId}`);
    if (apiSession) {
      session = apiSession;
    } else {
      const localSessions = readJson(KEY_SESSIONS, {});
      session = localSessions[sessionId];
    }

    if (!session) {
      alert('Session "' + sessionId + '" not found.');
      return;
    }

    // Load class blueprint
    let classData = null;
    if (session.classId) {
      const apiClass = await apiFetch(`/api/classes/${session.classId}`);
      if (apiClass) {
        classData = apiClass;
      } else {
        const localClasses = readJson(KEY_CLASSES, {});
        classData = localClasses[session.classId] || null;
      }
    }

    activeSessionId = sessionId;
    activeSession   = session;
    activeClass     = classData;
    isDemo          = false;
    demoState       = null;

    updateUrlParam('sessionId', sessionId);
    showDashboard();
    startPolling();
  }

  function showDashboard() {
    dashGate.classList.add('hidden');
    dashContent.classList.remove('hidden');
    renderHeader();
    buildCpTabs();
  }

  function showGate() {
    stopPolling();
    dashContent.classList.add('hidden');
    dashGate.classList.remove('hidden');
    populateSessionPicker();
  }

  function updateUrlParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  }

  /* ── Header Render ───────────────────────────────────────────────── */
  function renderHeader() {
    if (isDemo) {
      sessionTitle.textContent  = 'Demo Session — Physics: Forces & Motion';
      sessionIdBadge.textContent = 'DEMO-SESSION';
      sessionTimeBadge.textContent = 'Started just now · 25 simulated students';
      livePill.classList.add('demo-mode');
      liveLabel.textContent = 'DEMO';
      demoBanner.classList.remove('hidden');
    } else {
      sessionTitle.textContent  = (activeSession && activeSession.title) || 'Untitled Session';
      sessionIdBadge.textContent = activeSessionId || '';
      const start = activeSession && activeSession.startAt ? new Date(activeSession.startAt) : null;
      sessionTimeBadge.textContent = start ? 'Started ' + start.toLocaleTimeString() : '';
      livePill.classList.remove('demo-mode');
      liveLabel.textContent = 'LIVE';
      demoBanner.classList.add('hidden');
    }
  }

  /* ── Checkpoint Tabs ─────────────────────────────────────────────── */
  function buildCpTabs() {
    // Keep the "All" tab, remove dynamic ones
    Array.from(cpTabsBar.querySelectorAll('.cp-tab:not(#cpTabAll)')).forEach(t => t.remove());

    const checkpoints = getCheckpoints();
    checkpoints.forEach((cp, i) => {
      const btn = document.createElement('button');
      btn.className = 'cp-tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.dataset.cp = cp.id || ('cp_' + i);
      const qNum = (cp.questionIndex != null ? cp.questionIndex : i) + 1;
      btn.innerHTML = `<i class="fa-solid fa-circle-dot"></i> CP${i + 1} · Q${qNum} <span class="cp-tab-pct" id="cpTabPct_${i}">0%</span>`;
      btn.addEventListener('click', () => setCpFilter(btn.dataset.cp));
      cpTabsBar.appendChild(btn);
    });

    $('cpTabAll').addEventListener('click', () => setCpFilter('all'));
  }

  function setCpFilter(cpId) {
    currentCpFilter = cpId;
    cpTabsBar.querySelectorAll('.cp-tab').forEach(t => {
      const active = t.dataset.cp === cpId || (cpId === 'all' && t.id === 'cpTabAll');
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
  }

  function getCheckpoints() {
    if (isDemo && demoState) return demoState.checkpoints;
    return (activeClass && activeClass.checkpoints) ? activeClass.checkpoints : [];
  }

  /* ── Response Data ───────────────────────────────────────────────── */
  function getResponses() {
    if (isDemo && demoState) return demoState.responses;

    const formattedResponses = {};

    // 1. Process server session participants if available
    if (activeSession && Array.isArray(activeSession.participants)) {
      activeSession.participants.forEach(p => {
        const sid = p.studentId || p._id || 'stu_unknown';
        const cps = {};

        if (p.checkpoints) {
          if (p.checkpoints instanceof Map) {
            p.checkpoints.forEach((val, key) => { cps[key] = val; });
          } else if (typeof p.checkpoints === 'object') {
            Object.keys(p.checkpoints).forEach(key => { cps[key] = p.checkpoints[key]; });
          }
        }

        formattedResponses[sid] = {
          studentId: sid,
          name: p.name || 'Student ' + sid.slice(-4),
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen,
          checkpoints: cps
        };
      });
    }

    // 2. Overlay localStorage fallback responses
    const allLocal = readJson(KEY_RESPONSES, {});
    const sessionLocal = allLocal[activeSessionId] || {};
    Object.keys(sessionLocal).forEach(sid => {
      if (!formattedResponses[sid]) {
        formattedResponses[sid] = sessionLocal[sid];
      } else {
        // Merge checkpoints
        formattedResponses[sid].checkpoints = {
          ...formattedResponses[sid].checkpoints,
          ...(sessionLocal[sid].checkpoints || {})
        };
        if (sessionLocal[sid].lastSeen) {
          formattedResponses[sid].lastSeen = sessionLocal[sid].lastSeen;
        }
      }
    });

    return formattedResponses;
  }

  /* ── Compute Stats ───────────────────────────────────────────────── */
  function computeStats(responses, checkpoints) {
    const studentIds = Object.keys(responses);
    const numCps = checkpoints.length;

    // Per-checkpoint aggregates
    const cpStats = checkpoints.map((cp, i) => {
      const cpId = cp.id || ('cp_' + i);
      let answered = 0, correct = 0, wrong = 0, notAnswered = 0;
      let totalTime = 0, timeCount = 0;
      const timeBins = [0, 0, 0, 0, 0]; // 0-15, 15-30, 30-60, 60-120, 120+

      studentIds.forEach(sid => {
        const student = responses[sid];
        const cpData  = student.checkpoints && student.checkpoints[cpId];
        if (!cpData || cpData.status === 'not_answered') {
          notAnswered++;
        } else {
          answered++;
          if (cpData.isCorrect === true)  correct++;
          if (cpData.isCorrect === false) wrong++;
          if (cpData.timeTaken != null) {
            totalTime += cpData.timeTaken;
            timeCount++;
            const t = cpData.timeTaken;
            if (t < 15)       timeBins[0]++;
            else if (t < 30)  timeBins[1]++;
            else if (t < 60)  timeBins[2]++;
            else if (t < 120) timeBins[3]++;
            else              timeBins[4]++;
          }
        }
      });

      return {
        cpId, index: i,
        questionIndex: cp.questionIndex != null ? cp.questionIndex : i,
        answered, correct, wrong,
        notAnswered: studentIds.length - answered,
        correctPct: pct(correct, studentIds.length),
        wrongPct: pct(wrong, studentIds.length),
        notAnsweredPct: pct(studentIds.length - answered, studentIds.length),
        avgTimeSec: timeCount ? (totalTime / timeCount) : null,
        timeBins
      };
    });

    // Active students (seen in last 60s)
    const now = Date.now();
    let activeCount = 0;
    studentIds.forEach(sid => {
      const s = responses[sid];
      if (s.lastSeen && (now - new Date(s.lastSeen).getTime()) < 60000) activeCount++;
    });

    // Aggregate
    let totalAnswered = 0, totalCorrect = 0, totalWrong = 0;
    let totalTime = 0, timeCount = 0;
    cpStats.forEach(cp => {
      totalAnswered += cp.answered;
      totalCorrect  += cp.correct;
      totalWrong    += cp.wrong;
      if (cp.avgTimeSec != null) { totalTime += cp.avgTimeSec; timeCount++; }
    });

    const totalExpected = studentIds.length * numCps;
    const totalNotAnswered = totalExpected - totalAnswered;

    // Aggregate response time bins
    const aggBins = [0,0,0,0,0];
    cpStats.forEach(cp => cp.timeBins.forEach((v,i) => aggBins[i] += v));

    // Per-student summary
    const students = studentIds.map(sid => {
      const s = responses[sid];
      let correct = 0, wrong = 0, notAnswered = 0, totalTime = 0, timeCount = 0;
      let answeredCps = 0;

      checkpoints.forEach((cp, i) => {
        const cpId = cp.id || ('cp_' + i);
        const cpData = s.checkpoints && s.checkpoints[cpId];
        if (!cpData || cpData.status === 'not_answered') {
          notAnswered++;
        } else {
          answeredCps++;
          if (cpData.isCorrect === true)  correct++;
          if (cpData.isCorrect === false) wrong++;
          if (cpData.timeTaken != null)   { totalTime += cpData.timeTaken; timeCount++; }
        }
      });

      const isActive = s.lastSeen && (now - new Date(s.lastSeen).getTime()) < 60000;
      const isInQ    = s.lastSeen && (now - new Date(s.lastSeen).getTime()) < 8000;
      let status = numCps > 0 && answeredCps === numCps ? 'done' :
                   isInQ    ? 'in_q' :
                   isActive ? 'active' : 'idle';

      return {
        studentId: sid,
        name: s.name || ('Student ' + sid.slice(-4)),
        joinedAt: s.joinedAt,
        lastSeen: s.lastSeen,
        correct, wrong, notAnswered,
        progressPct: numCps ? pct(answeredCps, numCps) : 0,
        answeredCps,
        avgTimeSec: timeCount ? (totalTime / timeCount) : null,
        status,
        checkpoints: s.checkpoints || {}
      };
    });

    return {
      totalStudents: studentIds.length,
      activeStudents: activeCount,
      totalAnswered, totalCorrect, totalWrong,
      totalNotAnswered,
      totalExpected,
      overallCorrectPct: pct(totalCorrect, totalAnswered),
      aggBins,
      avgTimeSec: timeCount ? (totalTime / timeCount) : null,
      cpStats,
      students
    };
  }

  /* ── Render All ──────────────────────────────────────────────────── */
  function renderAll() {
    const responses   = getResponses();
    const checkpoints = getCheckpoints();
    const stats       = computeStats(responses, checkpoints);

    renderKPIs(stats);
    renderDonut(stats);
    renderBarChart(stats);
    renderStackedBars(stats, checkpoints);
    renderCpTabPcts(stats);
    renderRoster(stats, checkpoints);
    lastUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString();
  }

  /* ── KPI Cards ───────────────────────────────────────────────────── */
  function animateNumber(el, newVal) {
    if (!el) return;
    const prev = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    if (prev === newVal) return;
    el.classList.remove('flashing');
    void el.offsetWidth; // reflow
    el.classList.add('flashing');
    // Quick count-up
    const steps = Math.min(Math.abs(newVal - prev), 20);
    if (steps <= 1) { el.textContent = newVal; return; }
    let step = 0;
    const inc = (newVal - prev) / steps;
    const timer = setInterval(() => {
      step++;
      el.textContent = Math.round(prev + inc * step);
      if (step >= steps) { clearInterval(timer); el.textContent = newVal; }
    }, 20);
  }

  function renderKPIs(stats) {
    animateNumber($('kpiStudentsVal'), stats.totalStudents);
    $('kpiStudentsSub').textContent = stats.activeStudents + ' active now';

    animateNumber($('kpiAnsweredVal'), stats.totalAnswered);
    const compPct = stats.totalExpected ? pct(stats.totalAnswered, stats.totalExpected) : 0;
    $('kpiAnsweredSub').textContent = compPct + '% completion rate';

    animateNumber($('kpiCorrectVal'), stats.totalCorrect);
    $('kpiCorrectSub').textContent = (stats.totalAnswered ? pct(stats.totalCorrect, stats.totalAnswered) : 0) + '% accuracy';

    animateNumber($('kpiWrongVal'), stats.totalWrong);
    $('kpiWrongSub').textContent = (stats.totalAnswered ? pct(stats.totalWrong, stats.totalAnswered) : 0) + '% of submitted';

    animateNumber($('kpiSkippedVal'), stats.totalNotAnswered);
    $('kpiSkippedSub').textContent = (stats.totalExpected ? pct(stats.totalNotAnswered, stats.totalExpected) : 0) + '% of total expected';

    const tv = $('kpiTimeVal');
    if (tv) tv.textContent = stats.avgTimeSec != null ? formatTimeSec(stats.avgTimeSec) : '—';
  }

  function renderCpTabPcts(stats) {
    stats.cpStats.forEach((cp, i) => {
      const el = $('cpTabPct_' + i);
      if (el) el.textContent = cp.correctPct + '%';
    });
  }

  /* ── Donut Chart ─────────────────────────────────────────────────── */
  function getFilteredStats(stats, checkpoints) {
    if (currentCpFilter === 'all') {
      return {
        correct: stats.totalCorrect,
        wrong: stats.totalWrong,
        notAnswered: stats.totalNotAnswered,
        total: stats.totalExpected
      };
    }
    const cpIdx = checkpoints.findIndex(cp => (cp.id || 'cp_' + checkpoints.indexOf(cp)) === currentCpFilter);
    if (cpIdx < 0) return { correct: 0, wrong: 0, notAnswered: 0, total: 0 };
    const cp = stats.cpStats[cpIdx];
    return {
      correct: cp.correct,
      wrong:   cp.wrong,
      notAnswered: cp.notAnswered,
      total: stats.totalStudents
    };
  }

  let donutAnimFrame = null;
  let donutCurrent   = [0, 0, 0];
  function renderDonut(stats) {
    const checkpoints = getCheckpoints();
    const fs = getFilteredStats(stats, checkpoints);
    const total = fs.total || 1;
    const target = [fs.correct / total, fs.wrong / total, fs.notAnswered / total];

    $('donutTotal').textContent = fs.total;
    $('legendCorrectPct').textContent  = pct(fs.correct, total) + '%';
    $('legendWrongPct').textContent    = pct(fs.wrong, total) + '%';
    $('legendSkipPct').textContent     = pct(fs.notAnswered, total) + '%';
    $('donutSubtitle').textContent     = currentCpFilter === 'all' ? 'All checkpoints' : 'CP ' + (checkpoints.findIndex(c => (c.id || 'cp_' + checkpoints.indexOf(c)) === currentCpFilter) + 1);

    const isDark = document.body.classList.contains('dark-mode');
    const colors = ['#3fb950', '#f85149', '#6e7681'];
    const trackColor = isDark ? '#21262d' : '#e2e8f0';

    if (donutAnimFrame) cancelAnimationFrame(donutAnimFrame);
    function animate() {
      let done = true;
      for (let i = 0; i < 3; i++) {
        const diff = target[i] - donutCurrent[i];
        if (Math.abs(diff) > 0.002) {
          donutCurrent[i] += diff * 0.12;
          done = false;
        } else {
          donutCurrent[i] = target[i];
        }
      }
      drawDonut(donutCurrent, colors, trackColor);
      if (!done) donutAnimFrame = requestAnimationFrame(animate);
    }
    donutAnimFrame = requestAnimationFrame(animate);
  }

  function drawDonut(fracs, colors, trackColor) {
    const canvas = donutChart;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size * 0.42, rIn = size * 0.28;
    const gap = 0.025;
    ctx.clearRect(0, 0, size, size);

    const total = fracs.reduce((a, b) => a + b, 0);

    if (total < 0.01) {
      // Draw empty ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, rIn, Math.PI * 2, 0, true);
      ctx.fillStyle = trackColor;
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    fracs.forEach((f, i) => {
      if (f <= 0) return;
      const sweep = f * Math.PI * 2 - gap;
      ctx.beginPath();
      ctx.moveTo(cx + rIn * Math.cos(startAngle + gap / 2), cy + rIn * Math.sin(startAngle + gap / 2));
      ctx.arc(cx, cy, r, startAngle + gap / 2, startAngle + sweep);
      ctx.arc(cx, cy, rIn, startAngle + sweep, startAngle + gap / 2, true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      startAngle += f * Math.PI * 2;
    });
  }

  /* ── Bar Chart (Response Time) ───────────────────────────────────── */
  function renderBarChart(stats) {
    const canvas = barChart;
    if (!canvas) return;

    const bins  = stats.aggBins;
    const max   = Math.max(...bins, 1);
    const dpr   = window.devicePixelRatio || 1;
    const W     = canvas.offsetWidth  || 400;
    const H     = 220;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const isDark   = document.body.classList.contains('dark-mode');
    const padL = 32, padR = 12, padT = 12, padB = 10;
    const chartW   = W - padL - padR;
    const chartH   = H - padT - padB;
    const barCount = bins.length;
    const barW     = (chartW / barCount) * 0.6;
    const gap      = chartW / barCount;
    const colors   = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    const textColor= isDark ? '#8b949e' : '#94a3b8';
    const gridColor= isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      const label = Math.round((max * i) / 4);
      ctx.fillStyle = textColor;
      ctx.font = `500 10px "JetBrains Mono", monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(label, padL - 4, y + 3);
    }

    // Bars
    bins.forEach((val, i) => {
      const bH  = (val / max) * chartH;
      const x   = padL + gap * i + (gap - barW) / 2;
      const y   = padT + chartH - bH;
      const rad = 5;

      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + barW - rad, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + rad);
      ctx.lineTo(x + barW, y + bH);
      ctx.lineTo(x, y + bH);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      if (val > 0) {
        ctx.fillStyle = isDark ? '#e6edf3' : '#0f172a';
        ctx.font = `700 10px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(val, x + barW / 2, y - 4);
      }
    });
  }

  /* ── Stacked Bars (per checkpoint) ──────────────────────────────── */
  function renderStackedBars(stats, checkpoints) {
    if (!stackedBars) return;
    if (!checkpoints.length) {
      stackedBars.innerHTML = '<div class="stacked-empty">No checkpoints configured</div>';
      return;
    }
    stackedBars.innerHTML = '';
    stats.cpStats.forEach((cp, i) => {
      const total  = stats.totalStudents || 1;
      const cPct   = pct(cp.correct, total);
      const wPct   = pct(cp.wrong, total);
      const sPct   = 100 - cPct - wPct;

      const row = document.createElement('div');
      row.className = 'stacked-row';
      row.innerHTML = `
        <span class="stacked-row-label">CP${i + 1} · Q${cp.questionIndex + 1}</span>
        <div class="stacked-bar-track" data-tip="Correct: ${cp.correct} · Wrong: ${cp.wrong} · Not Answered: ${cp.notAnswered}">
          <div class="stacked-seg stacked-seg-correct" style="width:${cPct}%"></div>
          <div class="stacked-seg stacked-seg-wrong"   style="width:${wPct}%"></div>
          <div class="stacked-seg stacked-seg-skip"    style="width:${Math.max(0, sPct)}%"></div>
        </div>
        <span class="stacked-row-pct">${cPct}%</span>
      `;
      stackedBars.appendChild(row);
    });
  }

  /* ── Roster ──────────────────────────────────────────────────────── */
  function sortStudents(students) {
    return [...students].sort((a, b) => {
      switch (lastSortKey) {
        case 'name':     return (a.name || '').localeCompare(b.name || '');
        case 'correct':  return b.correct - a.correct;
        case 'wrong':    return b.wrong - a.wrong;
        case 'progress': return b.progressPct - a.progressPct;
        case 'time':     return (a.avgTimeSec || Infinity) - (b.avgTimeSec || Infinity);
        default: // joined
          return new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
      }
    });
  }

  function filterStudents(students) {
    if (!lastSearchQuery) return students;
    const q = lastSearchQuery.toLowerCase();
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
  }

  function statusBadgeHtml(status) {
    const map = {
      active:  { cls: 'active',  icon: '🟢', label: 'Active' },
      in_q:    { cls: 'in-q',    icon: '⏳', label: 'In Question' },
      idle:    { cls: 'idle',    icon: '💤', label: 'Idle' },
      done:    { cls: 'done',    icon: '✅', label: 'Done' }
    };
    const m = map[status] || map.idle;
    return `<span class="status-badge ${m.cls}">${m.icon} ${m.label}</span>`;
  }

  function cpDotsHtml(student, checkpoints) {
    if (!checkpoints.length) return '<span style="color:var(--text-muted);font-size:0.75rem">—</span>';
    return checkpoints.map((cp, i) => {
      const cpId  = cp.id || ('cp_' + i);
      const cpData = student.checkpoints[cpId];
      let cls = 'pending', icon = '·', tip = 'CP' + (i+1) + ': Not yet';
      if (cpData) {
        if (cpData.status === 'not_answered') { cls = 'skipped'; icon = '⬜'; tip = 'CP' + (i+1) + ': Skipped'; }
        else if (cpData.isCorrect === true)  { cls = 'correct'; icon = '✓';  tip = 'CP' + (i+1) + ': Correct (' + formatTimeSec(cpData.timeTaken) + ')'; }
        else if (cpData.isCorrect === false) { cls = 'wrong';   icon = '✗';  tip = 'CP' + (i+1) + ': Wrong (' + formatTimeSec(cpData.timeTaken) + ')'; }
        else                                 { cls = 'pending'; icon = '…';  tip = 'CP' + (i+1) + ': Answered'; }
      }
      return `<span class="cp-dot ${cls}" data-tip="${tip}">${icon}</span>`;
    }).join('');
  }

  function buildDetailRow(student, checkpoints) {
    if (!checkpoints.length) return '';
    const cards = checkpoints.map((cp, i) => {
      const cpId  = cp.id || ('cp_' + i);
      const cpData = student.checkpoints[cpId];
      let resultClass = 'skipped', resultText = '⬜ Not Answered';
      if (cpData && cpData.status !== 'not_answered') {
        if (cpData.isCorrect === true)  { resultClass = 'correct'; resultText = '✅ Correct'; }
        else if (cpData.isCorrect === false) { resultClass = 'wrong'; resultText = '❌ Wrong'; }
        else { resultClass = 'skipped'; resultText = '📝 Answered'; }
      }
      const timeText = (cpData && cpData.timeTaken != null) ? formatTimeSec(cpData.timeTaken) : '—';
      return `<div class="detail-cp-card">
        <div class="detail-cp-card-title">CP${i+1} · Q${cp.questionIndex != null ? cp.questionIndex + 1 : i + 1}</div>
        <div class="detail-cp-card-result ${resultClass}">${resultText}</div>
        <div class="detail-cp-card-time">Time: ${timeText}</div>
      </div>`;
    }).join('');
    return `<tr class="roster-detail-row" id="detail_${escHtml(student.studentId)}">
      <td colspan="9"><div class="roster-detail-inner">${cards}</div></td>
    </tr>`;
  }

  function renderRoster(stats, checkpoints) {
    if (!rosterBody) return;

    const sorted   = sortStudents(filterStudents(stats.students));
    const oldRows  = new Set(Array.from(rosterBody.querySelectorAll('tr[data-sid]')).map(r => r.dataset.sid));

    if (!sorted.length) {
      rosterBody.innerHTML = `<tr class="roster-empty-row"><td colspan="9">
        <div class="roster-empty">
          <i class="fa-solid fa-user-slash"></i>
          <p>No students have joined yet. Share the session code!</p>
        </div></td></tr>`;
      rosterFooter.textContent = 'Showing 0 students';
      return;
    }

    // Build full table HTML
    let html = '';
    sorted.forEach((student, idx) => {
      const sid       = escHtml(student.studentId);
      const isNew     = !oldRows.has(student.studentId);
      const isExpanded= allExpandedRows.has(student.studentId);
      html += `<tr class="roster-row ${isNew ? 'roster-row-new' : ''}" data-sid="${sid}" role="row" aria-expanded="${isExpanded}">
        <td><span class="row-index">${idx + 1}</span></td>
        <td>
          <div class="student-name-cell">
            <div class="student-avatar ${avatarClass(student.studentId)}">${escHtml(initials(student.name))}</div>
            <div class="student-info-text">
              <strong>${escHtml(student.name)}</strong>
              <small>${student.studentId.slice(-8)}</small>
            </div>
          </div>
        </td>
        <td>${statusBadgeHtml(student.status)}</td>
        <td>
          <div class="mini-progress-wrap">
            <div class="mini-progress-bar"><div class="mini-progress-fill" style="width:${student.progressPct}%"></div></div>
            <span class="mini-progress-pct">${student.answeredCps}/${checkpoints.length}</span>
          </div>
        </td>
        <td class="text-right"><span class="count-correct">${student.correct}</span>
          <span style="color:var(--text-muted);font-size:0.72rem;margin-left:4px">(${pct(student.correct, checkpoints.length || 1)}%)</span>
        </td>
        <td class="text-right"><span class="count-wrong">${student.wrong}</span>
          <span style="color:var(--text-muted);font-size:0.72rem;margin-left:4px">(${pct(student.wrong, checkpoints.length || 1)}%)</span>
        </td>
        <td class="text-right"><span class="count-skip">${student.notAnswered}</span>
          <span style="color:var(--text-muted);font-size:0.72rem;margin-left:4px">(${pct(student.notAnswered, checkpoints.length || 1)}%)</span>
        </td>
        <td class="text-right mono">${student.avgTimeSec != null ? formatTimeSec(student.avgTimeSec) : '—'}</td>
        <td><div class="cp-dots">${cpDotsHtml(student, checkpoints)}</div></td>
      </tr>`;
      if (isExpanded) {
        html += buildDetailRow(student, checkpoints);
      }
    });

    rosterBody.innerHTML = html;

    // Attach row click → expand/collapse
    rosterBody.querySelectorAll('tr.roster-row').forEach(row => {
      row.addEventListener('click', () => {
        const sid = row.dataset.sid;
        if (!sid) return;
        const detailRow = document.getElementById('detail_' + sid);
        if (detailRow) {
          detailRow.remove();
          allExpandedRows.delete(sid);
          row.setAttribute('aria-expanded', 'false');
        } else {
          // Find the student data and rebuild
          const student = stats.students.find(s => s.studentId === sid);
          if (!student) return;
          allExpandedRows.add(sid);
          row.setAttribute('aria-expanded', 'true');
          row.insertAdjacentHTML('afterend', buildDetailRow(student, checkpoints));
        }
      });
    });

    const visTotal = lastSearchQuery ? sorted.length + ' of ' + stats.totalStudents : stats.totalStudents;
    rosterFooter.textContent = `Showing ${visTotal} student${stats.totalStudents !== 1 ? 's' : ''}`;
  }

  /* ── Refresh Ring Animation ──────────────────────────────────────── */
  function tickRefreshRing() {
    if (!refreshFill) return;
    const elapsed = Date.now() - refreshStartTs;
    const progress = Math.min(1, elapsed / REFRESH_PERIOD_MS);
    const circumference = 2 * Math.PI * 15.9;
    refreshFill.style.strokeDasharray  = circumference;
    refreshFill.style.strokeDashoffset = circumference * (1 - progress);
  }

  /* ── Polling ─────────────────────────────────────────────────────── */
  function startPolling() {
    stopPolling();
    renderAll();
    refreshStartTs = Date.now();
    refreshInterval = setInterval(async () => {
      if (isDemo) {
        tickDemoSimulation();
      } else if (activeSessionId) {
        const updatedSession = await apiFetch(`/api/sessions/${activeSessionId}`);
        if (updatedSession) activeSession = updatedSession;
      }
      renderAll();
      refreshStartTs = Date.now();
    }, REFRESH_PERIOD_MS);
    // Ring tick every 100ms
    refreshTimerId = setInterval(tickRefreshRing, 100);
  }

  function stopPolling() {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
    if (refreshTimerId)  { clearInterval(refreshTimerId);  refreshTimerId  = null; }
  }

  // Also respond to storage events (cross-tab live updates)
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_RESPONSES && !isDemo) renderAll();
  });

  /* ── Demo Mode ───────────────────────────────────────────────────── */
  const DEMO_NAMES = [
    'Amara Silva','Binu Jayasekara','Chamodi Perera','Dinesh Fernando',
    'Eranga Wickramasinghe','Fathima Hassan','Gayan Bandara','Hiruni Rajapaksha',
    'Isuru Gunawardena','Janaki Seneviratne','Kasun Dissanayake','Lalitha Mendis',
    'Malindu Rathnayake','Nadeeka Pushpakumara','Osanda Thilakarathna','Pramila Gamage',
    'Rangi Weerasinghe','Sajani Kumari','Tharaka Sampath','Udara Wickrama',
    'Vihara Karunaratne','Waruna Nilantha','Ximena Rodrigo','Yasitha Basnayake','Zara Niroshan'
  ];

  const DEMO_CHECKPOINTS = [
    { id: 'demo_cp1', questionIndex: 0, time: 120, duration: 60 },
    { id: 'demo_cp2', questionIndex: 1, time: 300, duration: 60 },
    { id: 'demo_cp3', questionIndex: 2, time: 480, duration: 60 },
    { id: 'demo_cp4', questionIndex: 3, time: 660, duration: 60 },
    { id: 'demo_cp5', questionIndex: 4, time: 840, duration: 60 }
  ];

  function randBetween(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max)     { return Math.floor(randBetween(min, max + 1)); }

  function initDemoState() {
    const now = Date.now();
    const responses = {};

    DEMO_NAMES.forEach((name, i) => {
      const sid = 'demo_stu_' + String(i + 1).padStart(3, '0');
      const joinOffset = randBetween(0, 45000); // joined 0–45s ago
      responses[sid] = {
        studentId: sid,
        name,
        joinedAt:  new Date(now - joinOffset).toISOString(),
        lastSeen:  new Date(now - randBetween(0, 10000)).toISOString(),
        checkpoints: {}
      };
    });

    return {
      checkpoints: DEMO_CHECKPOINTS,
      responses,
      tick: 0,
      phase: 0 // how many checkpoints are "open" in the demo
    };
  }

  function tickDemoSimulation() {
    if (!demoState) return;
    demoState.tick++;
    const now = Date.now();

    // Every few ticks, open a new checkpoint phase
    if (demoState.tick % 5 === 0 && demoState.phase < DEMO_CHECKPOINTS.length) {
      demoState.phase++;
    }

    // Each student has a chance to answer open checkpoints
    Object.values(demoState.responses).forEach(student => {
      DEMO_CHECKPOINTS.slice(0, demoState.phase).forEach(cp => {
        if (student.checkpoints[cp.id]) return; // already answered
        if (Math.random() < 0.18) { // ~18% chance per tick
          const timeTaken = randBetween(8, 90);
          const isCorrect = Math.random() < 0.68; // 68% correct rate
          student.checkpoints[cp.id] = {
            status: 'answered',
            isCorrect,
            timeTaken: Math.round(timeTaken),
            submittedAt: new Date(now - randBetween(0, 5000)).toISOString()
          };
        }
      });
      // Update lastSeen
      if (Math.random() < 0.3) {
        student.lastSeen = new Date(now - randBetween(0, 5000)).toISOString();
      }
    });
  }

  function startDemoMode() {
    isDemo      = true;
    demoState   = initDemoState();
    activeSessionId = 'DEMO-SESSION';
    activeSession   = { title: 'Demo Session — Physics: Forces & Motion', sessionId: 'DEMO-SESSION', startAt: new Date().toISOString() };
    activeClass     = { checkpoints: DEMO_CHECKPOINTS };

    updateUrlParam('demo', '1');
    showDashboard();
    buildCpTabs();
    startPolling();
  }

  function stopDemoMode() {
    isDemo    = false;
    demoState = null;
    showGate();
  }

  btnDemoToggle && btnDemoToggle.addEventListener('click', () => {
    if (isDemo) stopDemoMode();
    else startDemoMode();
  });
  btnExitDemo    && btnExitDemo.addEventListener('click', stopDemoMode);
  btnChangeSession && btnChangeSession.addEventListener('click', showGate);

  /* ── Roster Controls ─────────────────────────────────────────────── */
  rosterSearch && rosterSearch.addEventListener('input', () => {
    lastSearchQuery = rosterSearch.value.trim();
    renderAll();
  });
  rosterSort && rosterSort.addEventListener('change', () => {
    lastSortKey = rosterSort.value;
    renderAll();
  });
  btnExpandAll && btnExpandAll.addEventListener('click', () => {
    // Collect all student IDs and toggle expand all
    const responses = getResponses();
    const ids = Object.keys(responses);
    if (allExpandedRows.size === ids.length) {
      allExpandedRows.clear();
    } else {
      ids.forEach(id => allExpandedRows.add(id));
    }
    renderAll();
  });

  /* ── Chart resize ────────────────────────────────────────────────── */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (dashContent && !dashContent.classList.contains('hidden')) renderAll(); }, 150);
  });

  /* ── Boot ────────────────────────────────────────────────────────── */
  function boot() {
    populateSessionPicker();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const demo = params.get('demo');

    if (demo === '1') {
      startDemoMode();
    } else if (sessionId) {
      loadSession(sessionId);
    } else {
      // Show gate — already visible by default
    }
  }

  boot();

})();
