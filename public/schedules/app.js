/**
 * SmartTute — Class Schedules & Calendar
 * Displays all upcoming classes, join-open sessions, past history, and interactive calendar.
 */

document.addEventListener('DOMContentLoaded', () => {
    const SESSION_STORE_KEY = 'smarttute_sessions';

    let sessions = [];
    let activeTab = 'all';
    let currentView = 'list';
    let calendarDate = new Date();
    let sessionToDeleteId = null;

    const searchInput = document.getElementById('searchInput');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const btnListView = document.getElementById('btnListView');
    const btnCalendarView = document.getElementById('btnCalendarView');
    const listViewContainer = document.getElementById('listViewContainer');
    const calendarViewContainer = document.getElementById('calendarViewContainer');
    const sessionsList = document.getElementById('sessionsList');
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const btnPrevMonth = document.getElementById('btnPrevMonth');
    const btnNextMonth = document.getElementById('btnNextMonth');

    const statTotal = document.getElementById('statTotal');
    const statUpcoming = document.getElementById('statUpcoming');
    const statOpen = document.getElementById('statOpen');
    const statPast = document.getElementById('statPast');

    const emptyState = document.getElementById('emptyState');
    const emptyMessage = document.getElementById('emptyMessage');

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

    /* Theme & Menu */
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

    /* Store helpers */
    function readJsonStore(key) {
        try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
        catch (e) { return {}; }
    }

    function writeJsonStore(key, store) {
        localStorage.setItem(key, JSON.stringify(store));
    }

    function loadSessions() {
        const store = readJsonStore(SESSION_STORE_KEY);
        sessions = Object.values(store).filter((s) => s && s.sessionId);
        updateStats();
        renderView();
    }

    function sessionStatus(session) {
        const now = Date.now();
        const start = new Date(session.startAt).getTime();
        const close = start + (Number(session.waitingPeriodMinutes) || 15) * 60 * 1000;
        if (now < start) return { key: 'upcoming', label: 'Upcoming' };
        if (now <= close) return { key: 'open', label: 'Join open' };
        return { key: 'closed', label: 'Past / Closed' };
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

    function studentUrl(sessionId) {
        return window.location.origin + '/live_class/index.html?sessionId=' + encodeURIComponent(sessionId);
    }

    function updateStats() {
        let upcoming = 0, open = 0, past = 0;
        sessions.forEach(s => {
            const st = sessionStatus(s).key;
            if (st === 'upcoming') upcoming++;
            else if (st === 'open') open++;
            else past++;
        });
        if (statTotal) statTotal.textContent = sessions.length;
        if (statUpcoming) statUpcoming.textContent = upcoming;
        if (statOpen) statOpen.textContent = open;
        if (statPast) statPast.textContent = past;
    }

    function getFilteredSessions() {
        const query = (searchInput && searchInput.value.toLowerCase().trim()) || '';
        return sessions.filter(s => {
            const st = sessionStatus(s).key;
            if (activeTab === 'upcoming' && st !== 'upcoming') return false;
            if (activeTab === 'open' && st !== 'open') return false;
            if (activeTab === 'past' && st !== 'closed') return false;

            if (query) {
                const matchTitle = (s.title || '').toLowerCase().includes(query);
                const matchId = (s.sessionId || '').toLowerCase().includes(query);
                const matchClass = (s.classTitle || s.classId || '').toLowerCase().includes(query);
                if (!matchTitle && !matchId && !matchClass) return false;
            }
            return true;
        }).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    }

    function renderView() {
        if (currentView === 'list') {
            listViewContainer.classList.remove('hidden');
            calendarViewContainer.classList.add('hidden');
            renderListView();
        } else {
            listViewContainer.classList.add('hidden');
            calendarViewContainer.classList.remove('hidden');
            renderCalendarView();
        }
    }

    /* List View */
    function renderListView() {
        if (!sessionsList) return;
        const list = getFilteredSessions();
        sessionsList.innerHTML = '';

        if (!list.length) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
                if (emptyMessage) {
                    emptyMessage.textContent = searchInput && searchInput.value.trim()
                        ? 'No sessions match your search terms.'
                        : 'No scheduled sessions available in this tab.';
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
                '<a href="/session_scheduler/index.html?sessionId=' + encodeURIComponent(session.sessionId) + '" class="card-btn btn-edit"><i class="fa-solid fa-pen-to-square"></i> Edit</a>' +
                '<button type="button" class="card-btn btn-share"><i class="fa-solid fa-share-nodes"></i> Share / Join</button>' +
                '<button type="button" class="card-btn btn-delete"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>';

            card.querySelector('.btn-share').addEventListener('click', () => openShareModal(session));
            card.querySelector('.btn-delete').addEventListener('click', () => {
                sessionToDeleteId = session.sessionId;
                if (deleteSessionTitle) deleteSessionTitle.textContent = session.title || session.sessionId;
                if (deleteModal) deleteModal.classList.remove('hidden');
            });

            sessionsList.appendChild(card);
        });
    }

    /* Calendar View */
    function renderCalendarView() {
        if (!calendarGrid) return;
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        if (calendarMonthYear) {
            calendarMonthYear.textContent = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        }

        calendarGrid.innerHTML = '';

        // Day of week headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(d => {
            const h = document.createElement('div');
            h.className = 'calendar-day-header';
            h.textContent = d;
            calendarGrid.appendChild(h);
        });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Previous month padding cells
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell other-month';
            cell.innerHTML = '<span class="date-num">' + (prevMonthDays - i) + '</span>';
            calendarGrid.appendChild(cell);
        }

        const filtered = getFilteredSessions();
        const now = new Date();

        // Current month cells
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            cell.className = 'calendar-cell' + (isToday ? ' today' : '');

            let cellContent = '<span class="date-num">' + day + '</span>';

            // Find sessions on this day
            const daySessions = filtered.filter(s => {
                const d = new Date(s.startAt);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            });

            if (daySessions.length) {
                cellContent += '<div class="calendar-events">';
                daySessions.forEach(s => {
                    const st = sessionStatus(s);
                    const timeStr = new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    cellContent +=
                        '<div class="calendar-event-pill status-' + st.key + '" data-id="' + s.sessionId + '">' +
                        '<span class="ev-time">' + timeStr + '</span> ' + escapeHtml(s.title) +
                        '</div>';
                });
                cellContent += '</div>';
            }

            cell.innerHTML = cellContent;

            // Bind click events on event pills
            cell.querySelectorAll('.calendar-event-pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const sid = pill.dataset.id;
                    const sess = sessions.find(x => x.sessionId === sid);
                    if (sess) openShareModal(sess);
                });
            });

            calendarGrid.appendChild(cell);
        }

        // Next month padding cells
        const totalCellsSoFar = firstDayIndex + totalDays;
        const remainingCells = (42 - totalCellsSoFar) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell other-month';
            cell.innerHTML = '<span class="date-num">' + i + '</span>';
            calendarGrid.appendChild(cell);
        }

        if (emptyState) emptyState.classList.add('hidden');
    }

    /* Navigation & Tabs */
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            renderView();
        });
    });

    if (btnListView) {
        btnListView.addEventListener('click', () => {
            currentView = 'list';
            btnListView.classList.add('active');
            if (btnCalendarView) btnCalendarView.classList.remove('active');
            renderView();
        });
    }

    if (btnCalendarView) {
        btnCalendarView.addEventListener('click', () => {
            currentView = 'calendar';
            btnCalendarView.classList.add('active');
            if (btnListView) btnListView.classList.remove('active');
            renderView();
        });
    }

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            renderCalendarView();
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            renderCalendarView();
        });
    }

    if (searchInput) searchInput.addEventListener('input', renderView);

    /* Modal interactions */
    function openShareModal(session) {
        const url = studentUrl(session.sessionId);
        if (shareModalTitle) shareModalTitle.textContent = session.title || 'Session Details';
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
    loadSessions();
});
