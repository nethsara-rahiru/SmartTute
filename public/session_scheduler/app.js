/**
 * SmartTute — Session Scheduler
 * Schedule saved classes: start time, join window, playback mode, publish & share.
 */

document.addEventListener('DOMContentLoaded', () => {
    const CLASS_STORE_KEY = 'smarttute_published_classes';
    const SESSION_STORE_KEY = 'smarttute_sessions';

    let classes = [];
    let sessions = [];
    let editingSessionId = null;
    let sessionToDeleteId = null;

    const classSelect = document.getElementById('classSelect');
    const sessionTitleInput = document.getElementById('sessionTitleInput');
    const startDateInput = document.getElementById('startDateInput');
    const startTimeInput = document.getElementById('startTimeInput');
    const waitingPeriodInput = document.getElementById('waitingPeriodInput');
    const sessionForm = document.getElementById('sessionForm');
    const formHeading = document.getElementById('formHeading');
    const btnNewSession = document.getElementById('btnNewSession');
    const btnPublishSession = document.getElementById('btnPublishSession');
    const sessionsList = document.getElementById('sessionsList');
    const emptyState = document.getElementById('emptyState');
    const emptyMessage = document.getElementById('emptyMessage');
    const searchInput = document.getElementById('searchInput');
    const statSessions = document.getElementById('statSessions');

    const shareModal = document.getElementById('shareModal');
    const shareModalTitle = document.getElementById('shareModalTitle');
    const shareModalCopy = document.getElementById('shareModalCopy');
    const shareQrImage = document.getElementById('shareQrImage');
    const shareSessionId = document.getElementById('shareSessionId');
    const shareSessionUrl = document.getElementById('shareSessionUrl');
    const shareMeta = document.getElementById('shareMeta');
    const btnCopySessionId = document.getElementById('btnCopySessionId');
    const btnCopySessionUrl = document.getElementById('btnCopySessionUrl');
    const btnCloseShare = document.getElementById('btnCloseShare');
    const btnOpenLive = document.getElementById('btnOpenLive');

    const deleteModal = document.getElementById('deleteModal');
    const deleteSessionTitle = document.getElementById('deleteSessionTitle');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenu = document.getElementById('closeMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const themeToggle = document.getElementById('themeToggle');

    /* Theme & nav */
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

    /* Storage helpers */
    function readJsonStore(key) {
        try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
        catch (e) { return {}; }
    }

    function writeJsonStore(key, store) {
        localStorage.setItem(key, JSON.stringify(store));
    }

    function loadClasses() {
        const store = readJsonStore(CLASS_STORE_KEY);
        classes = Object.values(store)
            .filter((c) => c && c.classId && String(c.classId).indexOf('ST-TEST-') !== 0)
            .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
        populateClassSelect();
    }

    function loadSessions() {
        const store = readJsonStore(SESSION_STORE_KEY);
        sessions = Object.values(store).filter((s) => s && s.sessionId);
        renderSessions();
    }

    function populateClassSelect() {
        if (!classSelect) return;
        const preset = new URLSearchParams(window.location.search).get('classId') || classSelect.value;
        classSelect.innerHTML = '<option value="">-- Choose a saved class --</option>';
        classes.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.classId;
            const cp = Array.isArray(c.checkpoints) ? c.checkpoints.length : 0;
            opt.textContent = (c.title || 'Untitled') + ' (' + c.classId + ' · ' + cp + ' cp)';
            classSelect.appendChild(opt);
        });
        if (preset && classes.some((c) => c.classId === preset)) {
            classSelect.value = preset;
            autofillTitleFromClass();
        }
    }

    function autofillTitleFromClass() {
        if (!sessionTitleInput || sessionTitleInput.value.trim()) return;
        const cls = classes.find((c) => c.classId === classSelect.value);
        if (cls) sessionTitleInput.value = cls.title || '';
    }

    if (classSelect) {
        classSelect.addEventListener('change', autofillTitleFromClass);
    }

    function getPlaybackMode() {
        const checked = document.querySelector('input[name="playbackMode"]:checked');
        return checked ? checked.value : 'from_start';
    }

    function setPlaybackMode(mode) {
        const el = document.querySelector('input[name="playbackMode"][value="' + mode + '"]');
        if (el) el.checked = true;
    }

    function defaultDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30 - (now.getMinutes() % 5));
        now.setSeconds(0, 0);
        if (startDateInput) startDateInput.value = now.toISOString().slice(0, 10);
        if (startTimeInput) {
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            startTimeInput.value = hh + ':' + mm;
        }
    }

    function combineLocalDateTime(dateStr, timeStr) {
        // Interpret as local time
        const [y, m, d] = dateStr.split('-').map(Number);
        const [hh, mm] = timeStr.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm || 0, 0, 0);
    }

    function formatWhen(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return iso;
        }
    }

    function sessionStatus(session) {
        const now = Date.now();
        const start = new Date(session.startAt).getTime();
        const close = start + (Number(session.waitingPeriodMinutes) || 15) * 60 * 1000;
        if (now < start) return { key: 'upcoming', label: 'Upcoming' };
        if (now <= close) return { key: 'open', label: 'Join open' };
        return { key: 'closed', label: 'Join closed' };
    }

    function studentUrl(sessionId) {
        return window.location.origin + '/live_class/index.html?sessionId=' + encodeURIComponent(sessionId);
    }

    function resetForm() {
        editingSessionId = null;
        if (formHeading) formHeading.textContent = 'Schedule a Session';
        if (btnPublishSession) {
            btnPublishSession.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Session';
        }
        if (btnNewSession) btnNewSession.classList.add('hidden');
        if (sessionForm) sessionForm.reset();
        if (waitingPeriodInput) waitingPeriodInput.value = '15';
        setPlaybackMode('from_start');
        defaultDateTime();
        const preset = new URLSearchParams(window.location.search).get('classId');
        if (preset && classSelect) classSelect.value = preset;
        autofillTitleFromClass();
    }

    function fillForm(session) {
        editingSessionId = session.sessionId;
        if (formHeading) formHeading.textContent = 'Edit Session';
        if (btnPublishSession) {
            btnPublishSession.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update &amp; Publish';
        }
        if (btnNewSession) btnNewSession.classList.remove('hidden');

        if (classSelect) classSelect.value = session.classId || '';
        if (sessionTitleInput) sessionTitleInput.value = session.title || '';
        if (waitingPeriodInput) waitingPeriodInput.value = session.waitingPeriodMinutes || 15;
        setPlaybackMode(session.playbackMode === 'sync' ? 'sync' : 'from_start');

        const start = new Date(session.startAt);
        if (!isNaN(start.getTime())) {
            if (startDateInput) {
                const y = start.getFullYear();
                const m = String(start.getMonth() + 1).padStart(2, '0');
                const d = String(start.getDate()).padStart(2, '0');
                startDateInput.value = y + '-' + m + '-' + d;
            }
            if (startTimeInput) {
                startTimeInput.value =
                    String(start.getHours()).padStart(2, '0') + ':' +
                    String(start.getMinutes()).padStart(2, '0');
            }
        }
    }

    if (btnNewSession) btnNewSession.addEventListener('click', resetForm);

    /* Publish / update */
    if (sessionForm) {
        sessionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const classId = classSelect ? classSelect.value : '';
            const cls = classes.find((c) => c.classId === classId);
            if (!cls) {
                alert('Select a saved class from Class Organizer first.');
                return;
            }

            const dateStr = startDateInput.value;
            const timeStr = startTimeInput.value;
            if (!dateStr || !timeStr) {
                alert('Set both date and start time.');
                return;
            }

            const startAt = combineLocalDateTime(dateStr, timeStr);
            if (isNaN(startAt.getTime())) {
                alert('Invalid date or time.');
                return;
            }

            const waiting = Math.max(1, parseInt(waitingPeriodInput.value, 10) || 15);
            const playbackMode = getPlaybackMode();
            const sessionId = editingSessionId || ('ST-SESSION-' + Math.floor(1000 + Math.random() * 9000));

            const session = {
                sessionId,
                classId: cls.classId,
                classTitle: cls.title || '',
                title: (sessionTitleInput.value || '').trim() || cls.title || 'Untitled Session',
                startAt: startAt.toISOString(),
                waitingPeriodMinutes: waiting,
                playbackMode,
                publishedAt: new Date().toISOString(),
                videoId: cls.videoId,
                checkpointCount: Array.isArray(cls.checkpoints) ? cls.checkpoints.length : 0
            };

            const store = readJsonStore(SESSION_STORE_KEY);
            store[sessionId] = session;
            writeJsonStore(SESSION_STORE_KEY, store);

            editingSessionId = sessionId;
            loadSessions();
            openShareModal(session, true);

            const url = new URL(window.location.href);
            url.searchParams.set('sessionId', sessionId);
            window.history.replaceState({}, '', url);
        });
    }

    function openShareModal(session, justPublished) {
        const url = studentUrl(session.sessionId);
        if (shareModalTitle) {
            shareModalTitle.textContent = justPublished ? 'Session Published!' : 'Share Session';
        }
        if (shareModalCopy) {
            shareModalCopy.textContent =
                'Join window: from ' + formatWhen(session.startAt) +
                ' for ' + session.waitingPeriodMinutes + ' min. Playback: ' +
                (session.playbackMode === 'sync' ? 'sync with main class' : 'from the beginning') + '.';
        }
        if (shareSessionId) shareSessionId.value = session.sessionId;
        if (shareSessionUrl) shareSessionUrl.value = url;
        if (shareQrImage) {
            shareQrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url);
        }
        if (btnOpenLive) btnOpenLive.href = url;
        if (shareMeta) {
            shareMeta.innerHTML =
                '<p><strong>Class:</strong> ' + escapeHtml(session.classTitle || session.classId) + '</p>' +
                '<p><strong>Starts:</strong> ' + escapeHtml(formatWhen(session.startAt)) + '</p>';
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

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'studio-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 1800);
    }

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

    /* List */
    function renderSessions() {
        if (!sessionsList) return;
        const query = (searchInput && searchInput.value.toLowerCase().trim()) || '';
        let list = sessions.slice().sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
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
                        ? 'No sessions matched “' + searchInput.value.trim() + '”.'
                        : 'Schedule your first live session using a saved class from the form.';
                }
            }
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        list.forEach((session) => {
            const status = sessionStatus(session);
            const card = document.createElement('article');
            card.className = 'session-card';
            card.innerHTML =
                '<div class="session-card-top">' +
                '<span class="session-status status-' + status.key + '">' + status.label + '</span>' +
                '<span class="session-id">' + escapeHtml(session.sessionId) + '</span>' +
                '</div>' +
                '<h3 class="session-title">' + escapeHtml(session.title || 'Untitled Session') + '</h3>' +
                '<p class="session-meta">' +
                '<span><i class="fa-solid fa-calendar"></i> ' + escapeHtml(formatWhen(session.startAt)) + '</span>' +
                '<span><i class="fa-solid fa-hourglass-half"></i> ' + (session.waitingPeriodMinutes || 15) + ' min window</span>' +
                '<span><i class="fa-solid fa-' + (session.playbackMode === 'sync' ? 'satellite-dish' : 'backward-step') + '"></i> ' +
                (session.playbackMode === 'sync' ? 'Synced' : 'From start') + '</span>' +
                '</p>' +
                '<p class="session-class"><i class="fa-solid fa-clapperboard"></i> ' +
                escapeHtml(session.classTitle || session.classId) + '</p>' +
                '<div class="card-actions">' +
                '<button type="button" class="card-btn btn-edit"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                '<button type="button" class="card-btn btn-share"><i class="fa-solid fa-share-nodes"></i> Share</button>' +
                '<button type="button" class="card-btn btn-delete"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>';

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

    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            sessionToDeleteId = null;
            if (deleteModal) deleteModal.classList.add('hidden');
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (!sessionToDeleteId) return;
            const store = readJsonStore(SESSION_STORE_KEY);
            delete store[sessionToDeleteId];
            writeJsonStore(SESSION_STORE_KEY, store);
            if (editingSessionId === sessionToDeleteId) resetForm();
            sessionToDeleteId = null;
            if (deleteModal) deleteModal.classList.add('hidden');
            loadSessions();
            showToast('Session deleted');
        });
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* Boot */
    defaultDateTime();
    loadClasses();
    loadSessions();

    const editId = new URLSearchParams(window.location.search).get('sessionId');
    if (editId) {
        const store = readJsonStore(SESSION_STORE_KEY);
        if (store[editId]) fillForm(store[editId]);
    }
});
