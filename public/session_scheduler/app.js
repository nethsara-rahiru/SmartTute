/**
 * SmartTute — Session Scheduler
 * Schedule saved classes: start time, join window, playback mode, publish & share.
 * All session data is persisted in MongoDB via /api/sessions.
 * Classes are fetched from /api/classes with localStorage fallback.
 */

document.addEventListener('DOMContentLoaded', () => {
    const CLASS_STORE_KEY = 'smarttute_published_classes';

    let classes = [];
    let sessions = [];
    let editingSessionId = null;
    let sessionToDeleteId = null;

    /* ── DOM refs ─────────────────────────────────────────── */
    const classSelect         = document.getElementById('classSelect');
    const sessionTitleInput   = document.getElementById('sessionTitleInput');
    const startDateInput      = document.getElementById('startDateInput');
    const startTimeInput      = document.getElementById('startTimeInput');
    const waitingPeriodInput  = document.getElementById('waitingPeriodInput');
    const sessionForm         = document.getElementById('sessionForm');
    const formHeading         = document.getElementById('formHeading');
    const btnNewSession       = document.getElementById('btnNewSession');
    const btnPublishSession   = document.getElementById('btnPublishSession');
    const sessionsList        = document.getElementById('sessionsList');
    const emptyState          = document.getElementById('emptyState');
    const emptyMessage        = document.getElementById('emptyMessage');
    const searchInput         = document.getElementById('searchInput');
    const statSessions        = document.getElementById('statSessions');

    // Mode toggle
    const modeScheduled       = document.getElementById('modeScheduled');
    const modeOpenAnytime     = document.getElementById('modeOpenAnytime');
    const scheduledFields     = document.getElementById('scheduledFields');
    const openAnytimeFields   = document.getElementById('openAnytimeFields');
    const openFromInput       = document.getElementById('openFromInput');
    const openUntilInput      = document.getElementById('openUntilInput');
    const isOpenToggle        = document.getElementById('isOpenToggle');
    const isOpenLabel         = document.getElementById('isOpenLabel');

    // Share modal
    const shareModal          = document.getElementById('shareModal');
    const shareModalTitle     = document.getElementById('shareModalTitle');
    const shareModalCopy      = document.getElementById('shareModalCopy');
    const shareQrImage        = document.getElementById('shareQrImage');
    const shareSessionId      = document.getElementById('shareSessionId');
    const shareSessionUrl     = document.getElementById('shareSessionUrl');
    const shareMeta           = document.getElementById('shareMeta');
    const btnCopySessionId    = document.getElementById('btnCopySessionId');
    const btnCopySessionUrl   = document.getElementById('btnCopySessionUrl');
    const btnCloseShare       = document.getElementById('btnCloseShare');
    const btnOpenLive         = document.getElementById('btnOpenLive');

    // Delete modal
    const deleteModal         = document.getElementById('deleteModal');
    const deleteSessionTitle  = document.getElementById('deleteSessionTitle');
    const btnCancelDelete     = document.getElementById('btnCancelDelete');
    const btnConfirmDelete    = document.getElementById('btnConfirmDelete');

    // Nav / Theme
    const menuButton    = document.getElementById('menuButton');
    const sideMenu      = document.getElementById('sideMenu');
    const closeMenu     = document.getElementById('closeMenu');
    const menuBackdrop  = document.getElementById('menuBackdrop');
    const themeToggle   = document.getElementById('themeToggle');

    // Preview card
    const summaryEmptyState  = document.getElementById('summaryEmptyState');
    const summaryContent     = document.getElementById('summaryContent');
    const summaryThumb       = document.getElementById('summaryThumb');
    const summaryCpCount     = document.getElementById('summaryCpCount');
    const summaryClassTitle  = document.getElementById('summaryClassTitle');
    const summaryTuteName    = document.getElementById('summaryTuteName');
    const summaryStartTime   = document.getElementById('summaryStartTime');
    const summaryJoinWindow  = document.getElementById('summaryJoinWindow');
    const summaryMode        = document.getElementById('summaryMode');
    const previewStatus      = document.getElementById('previewStatus');

    /* ── Theme & Nav ─────────────────────────────────────── */
    const savedTheme = localStorage.getItem('smarttute_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode', 'dark-theme');
        if (themeToggle) themeToggle.textContent = '🌙';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('dark-theme', isDark);
            themeToggle.textContent = isDark ? '🌙' : '☼';
            localStorage.setItem('smarttute_theme', isDark ? 'dark' : 'light');
        });
    }
    if (menuButton && sideMenu && menuBackdrop) {
        const toggleMenu = (open) => {
            sideMenu.classList.toggle('open', open);
            menuBackdrop.classList.toggle('visible', open);
            menuButton.setAttribute('aria-expanded', open);
        };
        menuButton.addEventListener('click', () => toggleMenu(!sideMenu.classList.contains('open')));
        if (closeMenu) closeMenu.addEventListener('click', () => toggleMenu(false));
        menuBackdrop.addEventListener('click', () => toggleMenu(false));
    }

    /* ── API helpers ─────────────────────────────────────── */
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

    /* ── Load classes (API first, localStorage fallback) ─── */
    async function loadClasses() {
        let apiClasses = [];
        try {
            apiClasses = await apiFetch('/api/classes');
        } catch (e) {
            console.warn('API classes unavailable, using localStorage fallback:', e.message);
        }

        let localClasses = [];
        try {
            const raw = localStorage.getItem(CLASS_STORE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) localClasses = parsed;
                else if (typeof parsed === 'object' && parsed !== null) localClasses = Object.values(parsed);
            }
        } catch (e) {
            console.error('Error reading local class store:', e);
        }

        const map = new Map();
        [...apiClasses, ...localClasses].forEach((c) => {
            if (c && (c.classId || c._id)) {
                const id = c.classId || c._id;
                if (!String(id).startsWith('ST-TEST-')) {
                    map.set(id, { ...c, classId: id });
                }
            }
        });

        classes = Array.from(map.values()).sort(
            (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
        );
        populateClassSelect();
    }

    /* ── Load sessions from API ──────────────────────────── */
    async function loadSessions() {
        try {
            sessions = await apiFetch('/api/sessions');
        } catch (e) {
            console.error('Failed to load sessions:', e.message);
            sessions = [];
        }
        renderSessions();
    }

    /* ── Session mode helpers ────────────────────────────── */
    function getMode() {
        return modeOpenAnytime && modeOpenAnytime.checked ? 'open_anytime' : 'scheduled';
    }

    function setMode(mode) {
        const isOpen = mode === 'open_anytime';
        if (modeScheduled)    modeScheduled.checked    = !isOpen;
        if (modeOpenAnytime)  modeOpenAnytime.checked  = isOpen;
        if (scheduledFields)  scheduledFields.classList.toggle('hidden', isOpen);
        if (openAnytimeFields) openAnytimeFields.classList.toggle('hidden', !isOpen);
        updatePreviewCard();
    }

    if (modeScheduled)   modeScheduled.addEventListener('change', () => setMode('scheduled'));
    if (modeOpenAnytime) modeOpenAnytime.addEventListener('change', () => setMode('open_anytime'));

    /* ── Class selector ─────────────────────────────────── */
    function populateClassSelect() {
        if (!classSelect) return;
        const preset = new URLSearchParams(window.location.search).get('classId') || classSelect.value;
        classSelect.innerHTML = '<option value="">-- Select Class Blueprint --</option>';

        if (classes.length === 0) {
            const emptyOpt = document.createElement('option');
            emptyOpt.disabled = true;
            emptyOpt.textContent = 'No saved classes found — create one in Class Organizer';
            classSelect.appendChild(emptyOpt);
            updatePreviewCard();
            return;
        }

        classes.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.classId;
            const cp = Array.isArray(c.checkpoints) ? c.checkpoints.length : 0;
            opt.textContent = (c.title || 'Untitled Class') + ' (' + c.classId + ' · ' + cp + ' checkpoints)';
            classSelect.appendChild(opt);
        });

        if (preset && classes.some((c) => c.classId === preset)) {
            classSelect.value = preset;
            autofillTitleFromClass();
        } else if (classes.length > 0) {
            classSelect.value = classes[0].classId;
            autofillTitleFromClass();
        }
    }

    /* ── Preview card ───────────────────────────────────── */
    function updatePreviewCard() {
        const cls = classes.find((c) => c.classId === (classSelect && classSelect.value));
        if (!cls) {
            if (summaryEmptyState) summaryEmptyState.classList.remove('hidden');
            if (summaryContent)   summaryContent.classList.add('hidden');
            if (previewStatus)    previewStatus.textContent = 'Draft';
            return;
        }

        if (summaryEmptyState) summaryEmptyState.classList.add('hidden');
        if (summaryContent)   summaryContent.classList.remove('hidden');

        if (summaryClassTitle) summaryClassTitle.textContent = cls.title || 'Untitled Class';
        if (summaryTuteName) {
            summaryTuteName.innerHTML = '<i class="fa-solid fa-file-lines"></i> ' + escapeHtml(cls.tuteTitle || 'Interactive Tute');
        }

        const cps = Array.isArray(cls.checkpoints) ? cls.checkpoints.length : 0;
        if (summaryCpCount) summaryCpCount.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> ' + cps + ' Checkpoint' + (cps === 1 ? '' : 's');

        const vid = cls.videoId || 'M7lc1UVf-VE';
        if (summaryThumb) summaryThumb.src = 'https://img.youtube.com/vi/' + vid + '/hqdefault.jpg';

        const mode = getMode();
        if (mode === 'scheduled') {
            if (startDateInput && startTimeInput && startDateInput.value && startTimeInput.value) {
                const dt = combineLocalDateTime(startDateInput.value, startTimeInput.value);
                if (!isNaN(dt.getTime()) && summaryStartTime) summaryStartTime.textContent = formatWhen(dt.toISOString());
            }
            if (summaryJoinWindow && waitingPeriodInput) summaryJoinWindow.textContent = (waitingPeriodInput.value || 15) + ' min';
        } else {
            if (summaryStartTime) summaryStartTime.textContent = 'Open Anytime';
            if (summaryJoinWindow) summaryJoinWindow.textContent = '—';
        }

        if (summaryMode) {
            summaryMode.textContent = getPlaybackMode() === 'sync' ? 'Live Synced' : 'Self-Paced';
        }

        if (previewStatus) previewStatus.textContent = editingSessionId ? 'Editing' : 'Ready';
    }

    function autofillTitleFromClass() {
        const cls = classes.find((c) => c.classId === (classSelect && classSelect.value));
        if (cls && sessionTitleInput && !sessionTitleInput.value.trim()) {
            sessionTitleInput.value = cls.title || '';
        }
        updatePreviewCard();
    }

    if (classSelect)          classSelect.addEventListener('change', autofillTitleFromClass);
    if (startDateInput)       startDateInput.addEventListener('change', updatePreviewCard);
    if (startTimeInput)       startTimeInput.addEventListener('change', updatePreviewCard);
    if (waitingPeriodInput)   waitingPeriodInput.addEventListener('input', updatePreviewCard);
    document.querySelectorAll('input[name="playbackMode"]').forEach(r => r.addEventListener('change', updatePreviewCard));

    /* ── Quick Presets ──────────────────────────────────── */
    document.querySelectorAll('.preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const addMin  = Number(btn.dataset.minutes) || 0;
            const addDays = Number(btn.dataset.days) || 0;

            let base = new Date();
            if (startDateInput && startTimeInput && startDateInput.value && startTimeInput.value) {
                const existing = combineLocalDateTime(startDateInput.value, startTimeInput.value);
                if (!isNaN(existing.getTime())) base = existing;
            }
            if (addMin)  base.setMinutes(base.getMinutes() + addMin);
            if (addDays) base.setDate(base.getDate() + addDays);

            if (startDateInput) {
                startDateInput.value = base.getFullYear() + '-' +
                    String(base.getMonth() + 1).padStart(2, '0') + '-' +
                    String(base.getDate()).padStart(2, '0');
            }
            if (startTimeInput) {
                startTimeInput.value = String(base.getHours()).padStart(2, '0') + ':' +
                    String(base.getMinutes()).padStart(2, '0');
            }
            updatePreviewCard();
        });
    });

    /* ── Playback mode ──────────────────────────────────── */
    function getPlaybackMode() {
        const checked = document.querySelector('input[name="playbackMode"]:checked');
        return checked ? checked.value : 'from_start';
    }

    function setPlaybackMode(mode) {
        const el = document.querySelector('input[name="playbackMode"][value="' + mode + '"]');
        if (el) el.checked = true;
    }

    /* ── Date/Time helpers ──────────────────────────────── */
    function defaultDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30 - (now.getMinutes() % 5));
        now.setSeconds(0, 0);
        if (startDateInput) startDateInput.value = now.toISOString().slice(0, 10);
        if (startTimeInput) {
            startTimeInput.value = String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0');
        }
    }

    function combineLocalDateTime(dateStr, timeStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const [hh, mm]  = timeStr.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm || 0, 0, 0);
    }

    function formatWhen(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return iso; }
    }

    /* ── Session status ─────────────────────────────────── */
    function sessionStatus(session) {
        const now = Date.now();

        if (session.mode === 'open_anytime') {
            const fromOk  = !session.openFrom  || now >= new Date(session.openFrom).getTime();
            const untilOk = !session.openUntil || now <= new Date(session.openUntil).getTime();
            if (session.isOpen && fromOk && untilOk) return { key: 'open',     label: 'Open' };
            if (!session.isOpen)                     return { key: 'closed',   label: 'Closed' };
            if (!fromOk)                              return { key: 'upcoming', label: 'Not yet open' };
            return { key: 'closed', label: 'Period ended' };
        }

        const start = new Date(session.startAt).getTime();
        const close = start + (Number(session.waitingPeriodMinutes) || 15) * 60 * 1000;
        if (now < start)  return { key: 'upcoming', label: 'Upcoming' };
        if (now <= close) return { key: 'open',     label: 'Join open' };
        return { key: 'closed', label: 'Join closed' };
    }

    function studentUrl(sessionId) {
        return window.location.origin + '/live_class/index.html?sessionId=' + encodeURIComponent(sessionId);
    }

    /* ── Form reset / fill ──────────────────────────────── */
    function resetForm() {
        editingSessionId = null;
        if (formHeading)      formHeading.textContent = 'Schedule Live Session';
        if (btnPublishSession) btnPublishSession.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish &amp; Launch Session';
        if (btnNewSession)    btnNewSession.classList.add('hidden');
        if (sessionForm)      sessionForm.reset();
        if (waitingPeriodInput) waitingPeriodInput.value = '15';
        setPlaybackMode('from_start');
        setMode('scheduled');
        defaultDateTime();
        const preset = new URLSearchParams(window.location.search).get('classId');
        if (preset && classSelect) classSelect.value = preset;
        autofillTitleFromClass();
        updatePreviewCard();
    }

    function fillForm(session) {
        editingSessionId = session.sessionId;
        if (formHeading)      formHeading.textContent = 'Edit Session';
        if (btnPublishSession) btnPublishSession.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update &amp; Launch';
        if (btnNewSession)    btnNewSession.classList.remove('hidden');

        if (classSelect)        classSelect.value        = session.classId || '';
        if (sessionTitleInput)  sessionTitleInput.value  = session.title || '';
        if (waitingPeriodInput) waitingPeriodInput.value = session.waitingPeriodMinutes || 15;
        setPlaybackMode(session.playbackMode === 'sync' ? 'sync' : 'from_start');
        setMode(session.mode || 'scheduled');

        if (session.mode === 'open_anytime') {
            if (openFromInput  && session.openFrom)  openFromInput.value  = session.openFrom.slice(0, 10);
            if (openUntilInput && session.openUntil) openUntilInput.value = session.openUntil.slice(0, 10);
            if (isOpenToggle)  isOpenToggle.checked = !!session.isOpen;
            if (isOpenLabel)   isOpenLabel.textContent = session.isOpen ? 'Open — students can join now' : 'Closed — students cannot join';
        } else {
            const start = new Date(session.startAt);
            if (!isNaN(start.getTime())) {
                if (startDateInput) {
                    startDateInput.value = start.getFullYear() + '-' +
                        String(start.getMonth() + 1).padStart(2, '0') + '-' +
                        String(start.getDate()).padStart(2, '0');
                }
                if (startTimeInput) {
                    startTimeInput.value = String(start.getHours()).padStart(2, '0') + ':' +
                        String(start.getMinutes()).padStart(2, '0');
                }
            }
        }
        updatePreviewCard();
    }

    if (btnNewSession) btnNewSession.addEventListener('click', resetForm);

    /* ── Open/Closed live toggle (on form for editing) ─── */
    if (isOpenToggle) {
        isOpenToggle.addEventListener('change', () => {
            const open = isOpenToggle.checked;
            if (isOpenLabel) isOpenLabel.textContent = open ? 'Open — students can join now' : 'Closed — students cannot join';
        });
    }

    /* ── Publish / Update ───────────────────────────────── */
    if (sessionForm) {
        sessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const classId = classSelect ? classSelect.value : '';
            const cls = classes.find((c) => c.classId === classId);
            if (!cls) {
                showToast('⚠ Select a saved class first.', true);
                return;
            }

            const mode = getMode();
            const playbackMode = getPlaybackMode();

            let payload = {
                classId:      cls.classId,
                classTitle:   cls.title || '',
                title:        (sessionTitleInput && sessionTitleInput.value.trim()) || cls.title || 'Untitled Session',
                mode,
                playbackMode,
                publishedAt:  new Date().toISOString(),
                videoId:      cls.videoId,
                checkpointCount: Array.isArray(cls.checkpoints) ? cls.checkpoints.length : 0
            };

            if (mode === 'scheduled') {
                const dateStr = startDateInput && startDateInput.value;
                const timeStr = startTimeInput && startTimeInput.value;
                if (!dateStr || !timeStr) {
                    showToast('⚠ Set both date and start time.', true);
                    return;
                }
                const startAt = combineLocalDateTime(dateStr, timeStr);
                if (isNaN(startAt.getTime())) {
                    showToast('⚠ Invalid date or time.', true);
                    return;
                }
                payload.startAt             = startAt.toISOString();
                payload.waitingPeriodMinutes = Math.max(1, parseInt((waitingPeriodInput && waitingPeriodInput.value) || '15', 10));
            } else {
                payload.openFrom  = (openFromInput  && openFromInput.value)  ? openFromInput.value  : null;
                payload.openUntil = (openUntilInput && openUntilInput.value) ? openUntilInput.value : null;
                payload.isOpen    = isOpenToggle ? isOpenToggle.checked : false;
            }

            // Disable button, show loading
            if (btnPublishSession) {
                btnPublishSession.disabled = true;
                btnPublishSession.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
            }

            try {
                let session;
                if (editingSessionId) {
                    session = await apiFetch('/api/sessions/' + editingSessionId, { method: 'PUT', body: payload });
                } else {
                    session = await apiFetch('/api/sessions', { method: 'POST', body: payload });
                }

                editingSessionId = session.sessionId;
                await loadSessions();
                openShareModal(session, !editingSessionId);

                const url = new URL(window.location.href);
                url.searchParams.set('sessionId', session.sessionId);
                window.history.replaceState({}, '', url);

            } catch (err) {
                showToast('⚠ ' + (err.message || 'Failed to save session.'), true);
            } finally {
                if (btnPublishSession) {
                    btnPublishSession.disabled = false;
                    btnPublishSession.innerHTML = editingSessionId
                        ? '<i class="fa-solid fa-floppy-disk"></i> Update &amp; Launch'
                        : '<i class="fa-solid fa-paper-plane"></i> Publish &amp; Launch Session';
                }
            }
        });
    }

    /* ── Share modal ────────────────────────────────────── */
    function openShareModal(session, justPublished) {
        const url = studentUrl(session.sessionId);
        if (shareModalTitle) shareModalTitle.textContent = justPublished ? 'Session Published!' : 'Share Session';

        if (shareModalCopy) {
            if (session.mode === 'open_anytime') {
                shareModalCopy.textContent = 'Students can join any time this session is open. Share the link below.';
            } else {
                shareModalCopy.textContent =
                    'Join window: from ' + formatWhen(session.startAt) +
                    ' for ' + session.waitingPeriodMinutes + ' min. Playback: ' +
                    (session.playbackMode === 'sync' ? 'synced to main class' : 'from the beginning') + '.';
            }
        }

        if (shareSessionId)  shareSessionId.value  = session.sessionId;
        if (shareSessionUrl) shareSessionUrl.value = url;
        if (shareQrImage)    shareQrImage.src       = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url);
        if (btnOpenLive)     btnOpenLive.href       = url;

        if (shareMeta) {
            let metaHtml = '<p><strong>Class:</strong> ' + escapeHtml(session.classTitle || session.classId) + '</p>';
            if (session.mode === 'open_anytime') {
                metaHtml += '<p><strong>Mode:</strong> <span class="badge-open-anytime">Open Anytime</span></p>';
                metaHtml += '<p><strong>Status:</strong> ' + (session.isOpen ? '🟢 Currently open' : '🔴 Currently closed') + '</p>';
            } else {
                metaHtml += '<p><strong>Starts:</strong> ' + escapeHtml(formatWhen(session.startAt)) + '</p>';
            }
            shareMeta.innerHTML = metaHtml;
        }

        if (shareModal) shareModal.classList.remove('hidden');
    }

    function closeShareModal() {
        if (shareModal) shareModal.classList.add('hidden');
    }

    if (btnCloseShare) btnCloseShare.addEventListener('click', closeShareModal);
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) closeShareModal();
        });
    }

    /* ── Copy buttons ───────────────────────────────────── */
    if (btnCopySessionId) {
        btnCopySessionId.addEventListener('click', () => {
            navigator.clipboard.writeText(shareSessionId.value).then(() => showToast('Session ID copied!'));
        });
    }
    if (btnCopySessionUrl) {
        btnCopySessionUrl.addEventListener('click', () => {
            navigator.clipboard.writeText(shareSessionUrl.value).then(() => showToast('Join link copied!'));
        });
    }

    /* ── Sessions list render ───────────────────────────── */
    function renderSessions() {
        if (!sessionsList) return;
        const query = (searchInput && searchInput.value.toLowerCase().trim()) || '';
        let list = sessions.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        if (query) {
            list = list.filter((s) =>
                (s.title || '').toLowerCase().includes(query) ||
                (s.sessionId || '').toLowerCase().includes(query) ||
                (s.classId || '').toLowerCase().includes(query) ||
                (s.classTitle || '').toLowerCase().includes(query)
            );
        }

        if (statSessions) statSessions.textContent = sessions.length;
        sessionsList.innerHTML = '';

        if (!list.length) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
                if (emptyMessage) {
                    emptyMessage.textContent = query
                        ? 'No sessions matched "' + (searchInput && searchInput.value.trim()) + '".'
                        : 'Schedule your first live session using a saved class from the form.';
                }
            }
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        list.forEach((session) => {
            const status   = sessionStatus(session);
            const isOA     = session.mode === 'open_anytime';
            const pCount   = Array.isArray(session.participants) ? session.participants.length : 0;
            const card     = document.createElement('article');
            card.className = 'session-card';

            let metaHtml = '';
            if (isOA) {
                metaHtml = '<span><i class="fa-solid fa-infinity"></i> Open Anytime</span>';
                if (session.openFrom)  metaHtml += '<span><i class="fa-solid fa-calendar-check"></i> From ' + formatWhen(session.openFrom) + '</span>';
                if (session.openUntil) metaHtml += '<span><i class="fa-solid fa-calendar-xmark"></i> Until ' + formatWhen(session.openUntil) + '</span>';
            } else {
                metaHtml =
                    '<span><i class="fa-solid fa-calendar"></i> ' + escapeHtml(formatWhen(session.startAt)) + '</span>' +
                    '<span><i class="fa-solid fa-hourglass-half"></i> ' + (session.waitingPeriodMinutes || 15) + ' min window</span>' +
                    '<span><i class="fa-solid fa-' + (session.playbackMode === 'sync' ? 'satellite-dish' : 'backward-step') + '"></i> ' +
                    (session.playbackMode === 'sync' ? 'Synced' : 'From start') + '</span>';
            }

            // Open/Closed toggle for open_anytime cards
            const toggleHtml = isOA
                ? '<label class="oa-toggle-label" title="Toggle class open/closed">' +
                  '<input type="checkbox" class="oa-toggle" ' + (session.isOpen ? 'checked' : '') + '>' +
                  '<span class="oa-toggle-track"><span class="oa-toggle-thumb"></span></span>' +
                  '<span class="oa-toggle-text">' + (session.isOpen ? 'Open' : 'Closed') + '</span>' +
                  '</label>'
                : '';

            card.innerHTML =
                '<div class="session-card-top">' +
                '<span class="session-status status-' + status.key + '">' + status.label + '</span>' +
                '<span class="session-id">' + escapeHtml(session.sessionId) + '</span>' +
                (isOA ? '<span class="mode-badge mode-oa"><i class="fa-solid fa-infinity"></i> Open Anytime</span>' : '<span class="mode-badge mode-sched"><i class="fa-solid fa-clock"></i> Scheduled</span>') +
                '</div>' +
                '<h3 class="session-title">' + escapeHtml(session.title || 'Untitled Session') + '</h3>' +
                '<p class="session-meta">' + metaHtml + '</p>' +
                '<p class="session-class"><i class="fa-solid fa-clapperboard"></i> ' + escapeHtml(session.classTitle || session.classId) + '</p>' +
                (pCount > 0 ? '<p class="session-participants"><i class="fa-solid fa-users"></i> ' + pCount + ' student' + (pCount === 1 ? '' : 's') + ' joined</p>' : '') +
                '<div class="card-actions">' +
                (isOA ? '<div class="oa-toggle-wrap">' + toggleHtml + '</div>' : '') +
                '<button type="button" class="card-btn btn-edit"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                '<button type="button" class="card-btn btn-share"><i class="fa-solid fa-share-nodes"></i> Share</button>' +
                '<button type="button" class="card-btn btn-delete"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>';

            // Open/Closed live toggle
            const toggleEl = card.querySelector('.oa-toggle');
            if (toggleEl) {
                toggleEl.addEventListener('change', async () => {
                    const nowOpen = toggleEl.checked;
                    const textEl = card.querySelector('.oa-toggle-text');
                    if (textEl) textEl.textContent = nowOpen ? 'Open' : 'Closed';
                    card.querySelector('.session-status').textContent = nowOpen ? 'Open' : 'Closed';
                    card.querySelector('.session-status').className = 'session-status status-' + (nowOpen ? 'open' : 'closed');
                    try {
                        await apiFetch('/api/sessions/' + session.sessionId, { method: 'PUT', body: { isOpen: nowOpen } });
                        session.isOpen = nowOpen;
                        showToast(nowOpen ? '🟢 Class opened!' : '🔴 Class closed');
                    } catch (err) {
                        toggleEl.checked = !nowOpen; // revert
                        showToast('⚠ Failed to update: ' + err.message, true);
                    }
                });
            }

            card.querySelector('.btn-edit').addEventListener('click', () => {
                fillForm(session);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            card.querySelector('.btn-share').addEventListener('click', () => openShareModal(session, false));
            card.querySelector('.btn-delete').addEventListener('click', () => {
                sessionToDeleteId = session.sessionId;
                if (deleteSessionTitle) deleteSessionTitle.textContent = session.title || session.sessionId;
                if (deleteModal) deleteModal.classList.remove('hidden');
            });

            sessionsList.appendChild(card);
        });
    }

    if (searchInput) searchInput.addEventListener('input', renderSessions);

    /* ── Delete modal ───────────────────────────────────── */
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            sessionToDeleteId = null;
            if (deleteModal) deleteModal.classList.add('hidden');
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!sessionToDeleteId) return;
            try {
                await apiFetch('/api/sessions/' + sessionToDeleteId, { method: 'DELETE' });
                if (editingSessionId === sessionToDeleteId) resetForm();
                showToast('Session deleted');
            } catch (err) {
                showToast('⚠ Delete failed: ' + err.message, true);
            } finally {
                sessionToDeleteId = null;
                if (deleteModal) deleteModal.classList.add('hidden');
                await loadSessions();
            }
        });
    }

    /* ── Toast ──────────────────────────────────────────── */
    function showToast(msg, isError) {
        const t = document.createElement('div');
        t.className = 'studio-toast' + (isError ? ' toast-error' : '');
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 2200);
    }

    /* ── Utility ────────────────────────────────────────── */
    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ── Boot ───────────────────────────────────────────── */
    defaultDateTime();
    loadClasses();
    loadSessions().then(() => {
        const editId = new URLSearchParams(window.location.search).get('sessionId');
        if (editId) {
            const s = sessions.find(x => x.sessionId === editId);
            if (s) fillForm(s);
        }
    });
});
