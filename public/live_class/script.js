/**
 * SmartTute Live Class player
 * Runs one Class Organizer checkpoint at a time, rendering the selected
 * tuteModule question (title, latex, images, answer boxes).
 *
 * Session & class data is now fetched from the API (/api/sessions, /api/classes).
 * Students must enter their name (via name-gate modal) before joining.
 */

(function () {
  const STORE_KEY = 'smarttute_published_classes'; // localStorage fallback for classes

  /* ──────────────────────────────────────────────────────
   *  Shell UI (nav, theme, chat, help)
   * ────────────────────────────────────────────────────── */
  const menuButton = document.querySelector('#menuButton');
  const sideMenu   = document.querySelector('#sideMenu');
  const menuBackdrop = document.querySelector('#menuBackdrop');

  function setMenu(open) {
    sideMenu.classList.toggle('open', open);
    menuBackdrop.classList.toggle('visible', open);
    menuButton.setAttribute('aria-expanded', open);
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  if (menuButton) menuButton.onclick = () => setMenu(!sideMenu.classList.contains('open'));
  const closeMenu = document.querySelector('#closeMenu');
  if (closeMenu) closeMenu.onclick = () => setMenu(false);
  if (menuBackdrop) menuBackdrop.onclick = () => setMenu(false);

  const themeToggle = document.querySelector('#themeToggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('smarttute_theme') || localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
      themeToggle.textContent = '☾';
      themeToggle.setAttribute('aria-label', 'Switch to light mode');
    }
    themeToggle.onclick = () => {
      const isDark = document.body.classList.toggle('dark-mode');
      themeToggle.textContent = isDark ? '☾' : '☼';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      localStorage.setItem('smarttute_theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
  }

  const flagQuestionButton = document.querySelector('#flagQuestionButton');
  const helpMessage = document.querySelector('#helpMessage');
  if (flagQuestionButton && helpMessage) {
    flagQuestionButton.onclick = () => {
      const isActive = flagQuestionButton.classList.toggle('active');
      flagQuestionButton.setAttribute('aria-pressed', isActive);
      flagQuestionButton.setAttribute('aria-label', isActive ? 'Cancel help request' : 'Ask for help with this question');
      flagQuestionButton.title = isActive ? 'Cancel help request' : 'Ask for help';
      helpMessage.textContent = isActive ? 'You asked for help' : 'Help request cancelled';
      helpMessage.classList.remove('hidden');
      if (!isActive) setTimeout(() => helpMessage.classList.add('hidden'), 1800);
    };
  }

  const chatToggles = document.querySelectorAll('.chat-toggle');
  const chatPanel   = document.querySelector('#chatPanel');
  const chatForm    = document.querySelector('#chatForm');
  const chatInput   = document.querySelector('#chatInput');
  const chatMessages = document.querySelector('#chatMessages');

  function setChat(open) {
    if (!chatPanel) return;
    chatPanel.classList.toggle('open', open);
    chatToggles.forEach((btn) => {
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close lesson chat' : 'Open lesson chat');
      btn.classList.toggle('active', open);
    });
    if (open && chatInput) chatInput.focus();
  }
  chatToggles.forEach((btn) => { btn.onclick = () => setChat(!chatPanel.classList.contains('open')); });
  const closeChat = document.querySelector('#closeChat');
  if (closeChat) closeChat.onclick = () => setChat(false);
  if (chatForm) {
    chatForm.onsubmit = (event) => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      const bubble = document.createElement('p');
      bubble.className = 'chat-bubble';
      bubble.textContent = message;
      chatMessages.append(bubble);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };
  }

  /* ──────────────────────────────────────────────────────
   *  DOM refs
   * ────────────────────────────────────────────────────── */
  // Name gate (new)
  const nameGate           = document.querySelector('#nameGate');
  const nameGateForm       = document.querySelector('#nameGateForm');
  const nameGateTitle      = document.querySelector('#nameGateTitle');
  const nameGateDesc       = document.querySelector('#nameGateDesc');
  const nameGateSessionLabel = document.querySelector('#nameGateSessionLabel');
  const studentNameInput   = document.querySelector('#studentNameInput');
  const nameGateError      = document.querySelector('#nameGateError');
  const btnJoinSession     = document.querySelector('#btnJoinSession');

  // Code gate (fallback)
  const classCodeGate   = document.querySelector('#classCodeGate');
  const classCodeForm   = document.querySelector('#classCodeForm');
  const classCodeInput  = document.querySelector('#classCodeInput');
  const classCodeError  = document.querySelector('#classCodeError');

  // Main lesson
  const liveClassPage   = document.querySelector('#liveClassPage');
  const liveClassTitle  = document.querySelector('#liveClassTitle');
  const liveClassMeta   = document.querySelector('#liveClassMeta');
  const classMissing    = document.querySelector('#classMissing');
  const classMissingCopy = document.querySelector('#classMissingCopy');
  const btnReenterCode  = document.querySelector('#btnReenterCode');
  const videoLoader     = document.querySelector('#videoLoader');
  const videoLoaderText = document.querySelector('#videoLoaderText');
  const questionBox     = document.querySelector('#questionBox');
  const waiting         = document.querySelector('#waitingQuestion');
  const waitingHeading  = document.querySelector('#waitingHeading');
  const waitingCopy     = document.querySelector('#waitingCopy');
  const activeBox       = document.querySelector('#activeQuestion');
  const questionTimerEl = document.querySelector('#questionTimer');
  const questionCount   = document.querySelector('#questionCount');
  const liveQBadge      = document.querySelector('#liveQBadge');
  const questionTitle   = document.querySelector('#questionTitle');
  const questionMarks   = document.querySelector('#questionMarks');
  const questionBody    = document.querySelector('#questionBody');
  const liveTuteQuestion = document.querySelector('#liveTuteQuestion');
  const answers         = document.querySelector('#answers');
  const feedback        = document.querySelector('#feedback');
  const continueButton  = document.querySelector('#continueButton');

  /* ──────────────────────────────────────────────────────
   *  Helpers
   * ────────────────────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeAnswer(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.ceil(sec || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getClassIdFromUrl()  { return new URLSearchParams(window.location.search).get('classId')  || ''; }
  function getSessionIdFromUrl() { return new URLSearchParams(window.location.search).get('sessionId') || ''; }

  /* ──────────────────────────────────────────────────────
   *  API helpers
   * ────────────────────────────────────────────────────── */
  async function apiFetch(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
    return data;
  }

  /* ──────────────────────────────────────────────────────
   *  Legacy localStorage helpers (fallback only)
   * ────────────────────────────────────────────────────── */
  function loadPublishedClassLocal(classId) {
    if (!classId) return null;
    try {
      const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
      // store may be object keyed by classId or array
      if (Array.isArray(store)) return store.find(c => c.classId === classId) || null;
      return store[classId] || null;
    } catch (err) {
      return null;
    }
  }

  /* ──────────────────────────────────────────────────────
   *  Session join window evaluation (for sync mode offset)
   * ────────────────────────────────────────────────────── */
  function getElapsedSec(session) {
    if (!session || session.mode === 'open_anytime') return 0;
    const start = new Date(session.startAt).getTime();
    if (isNaN(start)) return 0;
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  }

  /* ──────────────────────────────────────────────────────
   *  Gate helpers
   * ────────────────────────────────────────────────────── */
  function hideAll() {
    if (nameGate)       nameGate.classList.add('hidden');
    if (classCodeGate)  classCodeGate.classList.add('hidden');
    if (liveClassPage)  liveClassPage.classList.add('hidden');
    if (classMissing)   classMissing.classList.add('hidden');
  }

  function showNameGate(session) {
    hideAll();
    if (nameGateSessionLabel) nameGateSessionLabel.textContent = session.title || 'Live Class';
    if (nameGateTitle)        nameGateTitle.textContent = 'Join Class';
    if (nameGateDesc) {
      if (session.mode === 'open_anytime') {
        nameGateDesc.textContent = 'Enter your name to join this open class.';
      } else {
        nameGateDesc.textContent = 'Enter your name to join the live session.';
      }
    }
    if (nameGateError) nameGateError.classList.add('hidden');
    if (studentNameInput) { studentNameInput.value = ''; studentNameInput.focus(); }
    if (nameGate) nameGate.classList.remove('hidden');
  }

  function showCodeGate(errorMsg) {
    hideAll();
    if (classCodeGate) classCodeGate.classList.remove('hidden');
    if (classCodeError) {
      if (errorMsg) {
        classCodeError.textContent = errorMsg;
        classCodeError.classList.remove('hidden');
      } else {
        classCodeError.classList.add('hidden');
      }
    }
    if (classCodeInput) { classCodeInput.focus(); classCodeInput.select(); }
  }

  function showNotFound(code) {
    hideAll();
    if (liveClassPage)  liveClassPage.classList.remove('hidden');
    if (questionBox)    questionBox.classList.add('hidden');
    if (videoLoader)    videoLoader.classList.add('hidden');
    if (classMissing)   classMissing.classList.remove('hidden');
    if (liveClassTitle) liveClassTitle.textContent = 'Not found';
    if (liveClassMeta)  liveClassMeta.textContent  = code || '';
    if (classMissingCopy) {
      classMissingCopy.textContent = 'No session found for "' + code + '". Ask your teacher for the correct Session ID.';
    }
  }

  function showJoinBlocked(message, session) {
    hideAll();
    if (liveClassPage)  liveClassPage.classList.remove('hidden');
    if (questionBox)    questionBox.classList.add('hidden');
    if (videoLoader)    videoLoader.classList.add('hidden');
    if (classMissing)   classMissing.classList.remove('hidden');
    if (liveClassTitle) liveClassTitle.textContent = 'Cannot join';
    if (liveClassMeta)  liveClassMeta.textContent  = session ? session.sessionId : '';
    if (classMissingCopy) classMissingCopy.textContent = message || 'Joining is not allowed right now.';
  }

  /* ──────────────────────────────────────────────────────
   *  Tute question renderer (unchanged from original)
   * ────────────────────────────────────────────────────── */
  function processLatexForLive(latexStr, answersMap, imagesMap) {
    if (!latexStr) return '';

    const placeholders = [];
    function createPlaceholder(content) {
      const token = '___LIVE_PH_' + placeholders.length + '___';
      placeholders.push({ token, content });
      return token;
    }

    let processed = String(latexStr)
      .replace(/(?:\\\[\s*)?\\\begin\{tikzpicture\}([\s\S]*?)\\\end\{tikzpicture\}(?:\s*\\\])?/g, () =>
        createPlaceholder('<div class="live-diagram-note"><i class="fa-solid fa-draw-polygon"></i> Diagram</div>'))
      .replace(/\\diagram\{[^}]+\}/g, () =>
        createPlaceholder('<div class="live-diagram-note"><i class="fa-solid fa-draw-polygon"></i> Diagram</div>'));

    processed = processed.replace(/\{image(?:_([a-zA-Z0-9_\-]+))?\}/g, (fullMatch, imgKey) => {
      const key = imgKey || 'image_1';
      const imgData = (imagesMap && (imagesMap[key] || imagesMap.image || imagesMap.image_1)) || null;

      if (!imgData || !imgData.dataUrl) {
        return createPlaceholder(
          '<div class="tute-figure-box align-center size-medium">' +
          '<div class="live-image-missing"><i class="fa-solid fa-image"></i><div>Image not available</div></div>' +
          '</div>'
        );
      }

      const alignClass   = 'align-' + (imgData.align || 'center');
      const sizeClass    = 'size-'  + (imgData.size  || 'medium');
      const captionHtml  = imgData.caption ? '<div class="tute-figure-caption">' + escapeHtml(imgData.caption) + '</div>' : '';

      let hotspotsHtml = '';
      if (Array.isArray(imgData.hotspots)) {
        imgData.hotspots.forEach((hs, hsIdx) => {
          const ansConfig    = (answersMap && answersMap[hs.tagId]) ? answersMap[hs.tagId] : {};
          const displayStyle = ansConfig.displayStyle || 'input';
          const customText   = ansConfig.labelText || hs.label || ('Label ' + (hsIdx + 1));
          const tagId = escapeHtml(hs.tagId);
          const left  = Number(hs.x) || 0;
          const top   = Number(hs.y) || 0;

          if (displayStyle === 'label') {
            hotspotsHtml += '<div class="hotspot-badge-wrap" style="left:' + left + '%;top:' + top + '%;"><span class="hs-display-badge"><i class="fa-solid fa-tag"></i> ' + escapeHtml(customText) + '</span><input type="text" class="tute-answer-input hs-live-input" data-ans-id="' + tagId + '" placeholder="Answer…" autocomplete="off" spellcheck="false"></div>';
          } else if (displayStyle === 'dot') {
            hotspotsHtml += '<div class="hotspot-dot-wrap" style="left:' + left + '%;top:' + top + '%;"><span class="hs-display-dot">' + (hsIdx + 1) + '</span><input type="text" class="tute-answer-input hs-live-input" data-ans-id="' + tagId + '" placeholder="Answer…" autocomplete="off" spellcheck="false"></div>';
          } else if (displayStyle === 'checkbox') {
            hotspotsHtml += '<div class="hotspot-checkbox-wrap" style="left:' + left + '%;top:' + top + '%;"><label class="hs-checkbox-label"><input type="checkbox" class="tute-hs-checkbox" data-ans-id="' + tagId + '"><span>' + escapeHtml(customText) + '</span></label></div>';
          } else {
            hotspotsHtml += '<div class="hotspot-input-wrap" style="left:' + left + '%;top:' + top + '%;"><input type="text" class="tute-answer-input" data-ans-id="' + tagId + '" placeholder="' + escapeHtml(customText) + '" autocomplete="off" spellcheck="false"></div>';
          }
        });
      }

      return createPlaceholder(
        '<div class="tute-figure-box ' + alignClass + ' ' + sizeClass + '" data-img-key="' + escapeHtml(key) + '">' +
        '<div style="position:relative;display:inline-block;max-width:100%;">' +
        '<img src="' + imgData.dataUrl + '" alt="' + escapeHtml(imgData.caption || 'Figure') + '" class="tute-figure-img">' +
        hotspotsHtml + '</div>' + captionHtml + '</div>'
      );
    });

    processed = processed.replace(/\{\{([a-zA-Z0-9_\-]+)\}\}/g, (fullMatch, tagId) => {
      return '<span class="answer-box-container"><input type="text" class="tute-answer-input" data-ans-id="' + escapeHtml(tagId) + '" placeholder="' + escapeHtml(tagId) + '" autocomplete="off" spellcheck="false"><span class="ans-tag-label">' + escapeHtml(tagId) + '</span></span>';
    });

    processed = processed.replace(/(\\[[\\s\\S]*?\\]|\$\$[\\s\\S]*?\$\$)/g, (mathMatch) => createPlaceholder(mathMatch));

    processed = processed.split(/\n\s*\n/).map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      return '<p style="margin-bottom:0.8rem;">' + trimmed.replace(/\n/g, '<br>') + '</p>';
    }).filter(Boolean).join('');

    placeholders.forEach((item) => {
      const paragraphWrapper = '<p style="margin-bottom:0.8rem;">' + item.token + '</p>';
      if (processed.includes(paragraphWrapper)) {
        processed = processed.replace(paragraphWrapper, item.content);
      } else {
        processed = processed.split(item.token).join(item.content);
      }
    });

    return processed;
  }

  function renderKatex(container) {
    if (!container || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input', 'select', 'svg'],
        ignoredClasses: ['tute-answer-input', 'answer-box-container', 'diagram-visual-box', 'tute-figure-box'],
        throwOnError: false
      });
    } catch (err) { console.error('KaTeX error:', err); }
  }

  function collectRenderedAnswerIds() {
    const ids = new Set();
    if (questionBody) {
      questionBody.querySelectorAll('[data-ans-id]').forEach((el) => {
        const id = el.getAttribute('data-ans-id');
        if (id) ids.add(id);
      });
    }
    return Array.from(ids);
  }

  /* ──────────────────────────────────────────────────────
   *  Class session state
   * ────────────────────────────────────────────────────── */
  let player = null;
  let ytApiLoading  = false;
  let checkpoints   = [];
  let activeIndex   = -1;
  let answered      = false;
  let timerInterval = null;
  let timeLeft      = 0;
  const completed   = new Set();
  let pollInterval  = null;

  function clearTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function updateTimerDisplay() {
    if (!questionTimerEl) return;
    questionTimerEl.textContent = '⏱ ' + formatTime(timeLeft);
    questionTimerEl.classList.toggle('urgent', timeLeft <= 10);
  }

  function startTimer(seconds) {
    clearTimer();
    timeLeft = Math.max(5, Number(seconds) || 60);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      updateTimerDisplay();
      if (timeLeft <= 0) { clearTimer(); finishCheckpoint(true); }
    }, 1000);
  }

  function checkVideoTime() {
    if (!player || activeIndex > -1 || !player.getCurrentTime) return;
    const cur  = player.getCurrentTime();
    const next = checkpoints.findIndex((cp, i) => !completed.has(i) && cur >= (Number(cp.time) || 0));
    if (next > -1) showCheckpoint(next);
  }

  function showCheckpoint(index) {
    activeIndex = index;
    answered = false;
    const cp = checkpoints[index];
    const q  = cp.question || {};

    if (cp.pauseVideo !== false && player && player.pauseVideo) player.pauseVideo();

    waiting.classList.add('hidden');
    activeBox.classList.remove('hidden');
    questionBox.classList.remove('hidden');
    if (classMissing) classMissing.classList.add('hidden');

    questionCount.textContent = 'CHECKPOINT ' + (index + 1) + ' OF ' + checkpoints.length;
    feedback.textContent = '';
    feedback.className = 'feedback';
    continueButton.disabled = false;
    continueButton.textContent = 'Submit answers';

    if (q.type === 'tute' || q.latex || q.images) {
      if (liveTuteQuestion) liveTuteQuestion.classList.remove('hidden');
      if (answers) { answers.classList.add('hidden'); answers.innerHTML = ''; }
      if (liveQBadge)    liveQBadge.textContent    = 'Question ' + ((cp.questionIndex != null ? cp.questionIndex : index) + 1);
      if (questionTitle) questionTitle.textContent  = q.title || 'Checkpoint question';
      if (questionMarks) questionMarks.textContent  = q.marks != null ? '[' + q.marks + ' Marks]' : '';
      if (questionBody) {
        questionBody.innerHTML = processLatexForLive(q.latex || '', q.answers || {}, q.images || {});
        if (!q.latex && q.title) questionBody.innerHTML = '<p>' + escapeHtml(q.title) + '</p>' + questionBody.innerHTML;
        renderKatex(questionBody);
        if (window.SmartTuteInkFigure) window.SmartTuteInkFigure.enhanceTuteFigures(questionBody);
        const firstInput = questionBody.querySelector('input.tute-answer-input, input.live-text-input');
        if (firstInput) firstInput.focus();
      }
    } else {
      if (liveTuteQuestion) liveTuteQuestion.classList.add('hidden');
      if (answers) {
        answers.classList.remove('hidden');
        answers.classList.remove('answers-text');
        const options = Array.isArray(q.options) ? q.options : [];
        answers.innerHTML = options
          .map((option, i) => '<button type="button" class="answer" data-answer="' + i + '">' + escapeHtml(option) + '</button>')
          .join('');
      }
      if (liveQBadge)    liveQBadge.textContent    = 'Question';
      if (questionTitle) questionTitle.textContent  = q.title || q.text || 'Quick check';
      if (questionMarks) questionMarks.textContent  = '';
      if (questionBody)  questionBody.innerHTML     = q.text && q.title !== q.text ? '<p>' + escapeHtml(q.text) + '</p>' : '';
      continueButton.disabled = true;
      continueButton.textContent = 'Choose an answer to continue';
    }

    startTimer(cp.duration || 60);
    questionBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function gradeTuteQuestion() {
    const cp = checkpoints[activeIndex];
    const q  = cp.question || {};
    const answersMap = q.answers || {};
    const ids = collectRenderedAnswerIds();
    let allCorrect = true;
    const missed = [];

    ids.forEach((id) => {
      const expected = answersMap[id] ? String(answersMap[id].correctAnswer || '').trim() : '';
      const checkbox = (questionBody || document).querySelector('input.tute-hs-checkbox[data-ans-id="' + id + '"]');
      const input    = (questionBody || document).querySelector('input.tute-answer-input[data-ans-id="' + id + '"], input.live-text-input[data-ans-id="' + id + '"]');

      if (checkbox && !input) {
        checkbox.disabled = true;
        const expectedBool = /^(true|yes|1|checked)$/i.test(expected);
        const ok = expected ? (checkbox.checked === expectedBool) : checkbox.checked;
        checkbox.parentElement && checkbox.parentElement.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) { allCorrect = false; if (expected) missed.push(expected); }
        return;
      }
      if (!input) return;
      input.disabled = true;
      const ok = expected ? normalizeAnswer(input.value) === normalizeAnswer(expected) : Boolean(input.value.trim());
      input.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) { allCorrect = false; if (expected) missed.push(expected); }
    });

    if (!ids.length) { feedback.textContent = 'Answer recorded.'; feedback.className = 'feedback ok'; return true; }

    feedback.textContent = allCorrect
      ? 'Correct — well done!'
      : (missed.length ? 'Not quite. Expected: "' + missed.join('", "') + '".' : 'Not quite — check your answers.');
    feedback.className = 'feedback ' + (allCorrect ? 'ok' : 'bad');
    return allCorrect;
  }

  function gradeMcq(choice) {
    const cp = checkpoints[activeIndex];
    const q  = cp.question || {};
    const correct = typeof q.correct === 'number' ? q.correct : 0;
    const buttons = answers.querySelectorAll('button.answer');
    buttons.forEach((item, i) => { item.disabled = true; if (i === correct) item.classList.add('correct'); });
    const chosenBtn = answers.querySelector('[data-answer="' + choice + '"]');
    const isCorrect = choice === correct;
    if (!isCorrect && chosenBtn) chosenBtn.classList.add('wrong');
    feedback.textContent = isCorrect ? 'Correct — well done!' : 'Not quite. The correct answer is "' + ((q.options && q.options[correct]) || '') + '".';
    feedback.className = 'feedback ' + (isCorrect ? 'ok' : 'bad');
    return isCorrect;
  }

  function finishCheckpoint(timedOut) {
    if (answered || activeIndex < 0) return;
    answered = true;
    clearTimer();

    const cp = checkpoints[activeIndex];
    const q  = cp.question || {};

    if (q.type === 'tute' || q.latex || q.images) {
      gradeTuteQuestion();
      if (timedOut) feedback.textContent = 'Time is up. ' + feedback.textContent;
    } else if (timedOut) {
      const buttons = answers.querySelectorAll('button.answer');
      if (buttons.length && !answers.querySelector('.answer.correct, .answer.wrong')) {
        const correct = typeof q.correct === 'number' ? q.correct : 0;
        buttons.forEach((item, i) => { item.disabled = true; if (i === correct) item.classList.add('correct'); });
      }
      feedback.textContent = 'Time is up. Moving on when you continue.';
      feedback.className = 'feedback bad';
    }

    completed.add(activeIndex);
    continueButton.disabled = false;
    continueButton.textContent = completed.size === checkpoints.length ? 'Finish lesson' : 'Continue video';
    if (questionTimerEl) {
      questionTimerEl.textContent = timedOut ? 'Time up' : 'Done';
      questionTimerEl.classList.remove('urgent');
    }
  }

  if (answers) {
    answers.onclick = (event) => {
      const button = event.target.closest('.answer');
      if (!button || activeIndex < 0 || answered) return;
      gradeMcq(Number(button.dataset.answer));
      finishCheckpoint(false);
    };
  }

  if (continueButton) {
    continueButton.onclick = () => {
      if (activeIndex < 0) return;
      const cp = checkpoints[activeIndex];
      const q  = cp.question || {};
      if (!answered) {
        if (q.type === 'mcq' && !(q.latex || q.images)) return;
        finishCheckpoint(false);
        return;
      }
      activeBox.classList.add('hidden');
      waiting.classList.remove('hidden');
      const videoCard = document.querySelector('.video-card');
      if (videoCard) videoCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const moreLeft = completed.size < checkpoints.length;
      if (moreLeft && player && player.playVideo) player.playVideo();
      else if (!moreLeft && waitingHeading) {
        waitingHeading.textContent = 'Lesson complete';
        waitingCopy.textContent = 'You finished all checkpoints for this class.';
      }
      activeIndex = -1;
    };
  }

  /* ──────────────────────────────────────────────────────
   *  YouTube API
   * ────────────────────────────────────────────────────── */
  function ensureYouTubeApi(callback) {
    if (window.YT && window.YT.Player) { callback(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); callback(); };
    if (!ytApiLoading) {
      ytApiLoading = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.append(tag);
    }
  }

  /* ──────────────────────────────────────────────────────
   *  Start class
   * ────────────────────────────────────────────────────── */
  function startClass(classData, session, elapsedSecOverride) {
    hideAll();
    if (liveClassPage) liveClassPage.classList.remove('hidden');
    if (classMissing)  classMissing.classList.add('hidden');
    if (questionBox)   questionBox.classList.remove('hidden');

    let sessionSeekSec = 0;
    if (session && session.playbackMode === 'sync') {
      sessionSeekSec = elapsedSecOverride != null ? elapsedSecOverride : getElapsedSec(session);
    }

    checkpoints = (classData.checkpoints || []).slice().sort((a, b) => (a.time || 0) - (b.time || 0));
    completed.clear();
    activeIndex = -1;
    answered    = false;
    clearTimer();
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }

    if (liveClassTitle) liveClassTitle.textContent = (session && session.title) || classData.title || 'Interactive Lesson';
    if (liveClassMeta) {
      const bits = [];
      if (session && session.sessionId) bits.push(session.sessionId);
      else if (classData.classId) bits.push(classData.classId);
      bits.push(checkpoints.length + ' checkpoint' + (checkpoints.length === 1 ? '' : 's'));
      if (session) bits.push(session.playbackMode === 'sync' ? 'Synced playback' : 'From beginning');
      if (classData.tuteTitle) bits.push(classData.tuteTitle);
      liveClassMeta.textContent = bits.join(' · ');
    }
    if (waitingHeading) waitingHeading.textContent = checkpoints.length ? 'Watch for checkpoints' : 'No checkpoints in this class';
    if (waitingCopy) {
      waitingCopy.textContent = checkpoints.length
        ? (session && session.playbackMode === 'sync'
          ? 'Your video is synced to the main class clock. Checkpoints appear at the scheduled times.'
          : 'Continue watching. Only the question selected for each checkpoint will appear — one at a time.')
        : 'This class has a video but no question checkpoints yet.';
    }
    if (waiting)       waiting.classList.remove('hidden');
    if (activeBox)     activeBox.classList.add('hidden');
    if (videoLoader)   videoLoader.classList.remove('hidden');
    if (videoLoaderText) videoLoaderText.textContent = 'Loading "' + ((session && session.title) || classData.title || 'lesson') + '"…';

    const videoId = classData.videoId || 'M7lc1UVf-VE';

    ensureYouTubeApi(() => {
      if (player && player.destroy) { try { player.destroy(); } catch (e) {} player = null; }
      const mount = document.querySelector('#youtubePlayer');
      if (mount && mount.tagName !== 'DIV') {
        const fresh = document.createElement('div');
        fresh.id = 'youtubePlayer';
        fresh.title = 'Lesson video';
        mount.replaceWith(fresh);
      }
      player = new YT.Player('youtubePlayer', {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(sessionSeekSec) || 0 },
        events: {
          onReady: (event) => {
            event.target.mute();
            if (sessionSeekSec > 0) event.target.seekTo(sessionSeekSec, true);
            event.target.playVideo();
            pollInterval = setInterval(checkVideoTime, 250);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING && videoLoader) videoLoader.classList.add('hidden');
          }
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────
   *  Name gate form — called when sessionId is in the URL
   * ────────────────────────────────────────────────────── */
  let pendingSession = null; // session object shown on name gate

  if (nameGateForm) {
    nameGateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (studentNameInput && studentNameInput.value.trim()) || '';
      if (!name) { showNameGateError('Please enter your name.'); return; }
      if (!pendingSession) { showNameGateError('Session data missing, please refresh.'); return; }

      // Disable form while joining
      if (btnJoinSession) { btnJoinSession.disabled = true; btnJoinSession.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Joining…'; }

      try {
        const result = await apiFetch('/api/sessions/' + pendingSession.sessionId + '/join', {
          method: 'POST',
          body: { name }
        });

        // Cache join data so a refresh skips the name gate
        try {
          sessionStorage.setItem('st_join_' + pendingSession.sessionId, JSON.stringify({ name, sessionId: pendingSession.sessionId }));
        } catch (_) {}

        const session = result.session || pendingSession;
        const elapsedSec = result.elapsedSec || 0;

        // Fetch class data
        let classData = null;
        try {
          classData = await apiFetch('/api/classes/' + session.classId);
        } catch (_) {}
        if (!classData) classData = loadPublishedClassLocal(session.classId);

        if (!classData) {
          showNotFound(session.classId);
          return;
        }
        startClass(classData, session, elapsedSec);

      } catch (err) {
        showNameGateError(err.message || 'Failed to join. Please try again.');
      } finally {
        if (btnJoinSession) { btnJoinSession.disabled = false; btnJoinSession.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Join Session'; }
      }
    });
  }

  function showNameGateError(msg) {
    if (nameGateError) { nameGateError.textContent = msg; nameGateError.classList.remove('hidden'); }
  }

  /* ──────────────────────────────────────────────────────
   *  Code gate (manual code entry fallback)
   * ────────────────────────────────────────────────────── */
  if (classCodeForm) {
    classCodeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = String(classCodeInput ? classCodeInput.value : '').trim();
      if (!code) { showCodeGate('Please enter a Session ID or Class ID.'); return; }

      // Try API session lookup first
      try {
        const session = await apiFetch('/api/sessions/' + code);
        pendingSession = session;
        const url = new URL(window.location.href);
        url.searchParams.set('sessionId', code);
        url.searchParams.delete('classId');
        window.history.replaceState({}, '', url);
        showNameGate(session);
        return;
      } catch (_) {}

      // Try API class lookup (direct class access / teacher preview)
      try {
        const classData = await apiFetch('/api/classes/' + code);
        const url = new URL(window.location.href);
        url.searchParams.set('classId', code);
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url);
        startClass(classData, null, 0);
        return;
      } catch (_) {}

      // localStorage fallback for direct class
      const localClass = loadPublishedClassLocal(code);
      if (localClass) {
        const url = new URL(window.location.href);
        url.searchParams.set('classId', code);
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url);
        startClass(localClass, null, 0);
        return;
      }

      showCodeGate('No session or class found for "' + code + '". Check the ID and try again.');
    });
  }

  if (btnReenterCode) {
    btnReenterCode.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('classId');
      url.searchParams.delete('sessionId');
      window.history.replaceState({}, '', url);
      pendingSession = null;
      showCodeGate('');
    });
  }

  /* ──────────────────────────────────────────────────────
   *  Boot
   * ────────────────────────────────────────────────────── */
  const urlSessionId = getSessionIdFromUrl();
  const urlClassId   = getClassIdFromUrl();

  if (urlSessionId) {
    // Check if student already joined this session this browser session
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('st_join_' + urlSessionId)); } catch (_) {}

    (async () => {
      try {
        const session = await apiFetch('/api/sessions/' + urlSessionId);
        pendingSession = session;

        if (cached && cached.name) {
          // Re-join silently (page refresh), re-record attendance
          try {
            const result = await apiFetch('/api/sessions/' + urlSessionId + '/join', { method: 'POST', body: { name: cached.name } });
            const s = result.session || session;
            let classData = null;
            try { classData = await apiFetch('/api/classes/' + s.classId); } catch (_) {}
            if (!classData) classData = loadPublishedClassLocal(s.classId);
            if (classData) { startClass(classData, s, result.elapsedSec || 0); return; }
            showNotFound(s.classId);
          } catch (err) {
            // Session might be closed now — show gate with error
            showNameGate(session);
            showNameGateError(err.message);
          }
        } else {
          showNameGate(session);
        }
      } catch (_) {
        // Fallback: Check if the ID given was actually a class ID (direct link to class)
        try {
          const classData = await apiFetch('/api/classes/' + urlSessionId);
          if (classData) { startClass(classData, null, 0); return; }
        } catch (_) {}
        const localClass = loadPublishedClassLocal(urlSessionId);
        if (localClass) { startClass(localClass, null, 0); return; }

        showNotFound(urlSessionId);
      }
    })();

  } else if (urlClassId) {
    (async () => {
      let classData = null;
      try { classData = await apiFetch('/api/classes/' + urlClassId); } catch (_) {}
      if (!classData) classData = loadPublishedClassLocal(urlClassId);
      if (classData) startClass(classData, null, 0);
      else showNotFound(urlClassId);
    })();

  } else {
    showCodeGate('');
  }
})();
