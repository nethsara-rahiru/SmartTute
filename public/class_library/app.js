/**
 * SmartTute - Class Library Management Logic
 * Lists classes published from Class Organizer (localStorage store).
 */

document.addEventListener('DOMContentLoaded', () => {
    const STORE_KEY = 'smarttute_published_classes';
    const LATEST_KEY = 'smarttute_latest_class_id';

    let classes = [];
    let filteredClasses = [];
    let classToDeleteId = null;
    let currentView = 'grid';

    const classGrid = document.getElementById('classGrid');
    const searchInput = document.getElementById('searchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const sortSelect = document.getElementById('sortSelect');
    const btnGridView = document.getElementById('btnGridView');
    const btnListView = document.getElementById('btnListView');
    const emptyState = document.getElementById('emptyState');
    const emptyMessage = document.getElementById('emptyMessage');
    const loadingState = document.getElementById('loadingState');
    const statTotal = document.getElementById('statTotal');
    const statCheckpoints = document.getElementById('statCheckpoints');
    const btnCreateNew = document.getElementById('btnCreateNew');

    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenu = document.getElementById('closeMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const themeToggle = document.getElementById('themeToggle');

    const deleteModal = document.getElementById('deleteModal');
    const deleteClassTitle = document.getElementById('deleteClassTitle');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    const shareModal = document.getElementById('shareModal');
    const shareClassId = document.getElementById('shareClassId');
    const shareClassUrl = document.getElementById('shareClassUrl');
    const btnCopyId = document.getElementById('btnCopyId');
    const btnCopyUrl = document.getElementById('btnCopyUrl');
    const btnCloseShare = document.getElementById('btnCloseShare');
    const btnOpenLive = document.getElementById('btnOpenLive');

    // Theme
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

    // Side menu
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

    if (btnCreateNew) {
        btnCreateNew.addEventListener('click', () => {
            window.location.href = '/class_organizer/index.html';
        });
    }

    function readStore() {
        try {
            return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
        } catch (err) {
            console.error('Failed to read class store', err);
            return {};
        }
    }

    function writeStore(store) {
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
    }

    function fetchClasses() {
        try {
            if (loadingState) loadingState.classList.remove('hidden');
            const store = readStore();
            classes = Object.values(store).filter((c) => c && c.classId);
            applyFilterAndSort();
        } catch (err) {
            console.error('Error loading classes:', err);
            showError('Unable to load saved classes from this browser.');
        } finally {
            if (loadingState) loadingState.classList.add('hidden');
        }
    }

    function showError(msg) {
        if (classGrid) {
            classGrid.innerHTML =
                '<div class="error-box">' +
                '<i class="fa-solid fa-circle-exclamation"></i>' +
                '<p>' + escapeHtml(msg) + '</p>' +
                '<button class="lib-btn lib-btn-ghost" onclick="location.reload()">Retry</button>' +
                '</div>';
        }
    }

    function applyFilterAndSort() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const sortBy = sortSelect ? sortSelect.value : 'newest';

        if (btnClearSearch) {
            btnClearSearch.classList.toggle('hidden', query.length === 0);
        }

        filteredClasses = classes.filter((c) => {
            const title = (c.title || '').toLowerCase();
            const id = (c.classId || '').toLowerCase();
            const tute = (c.tuteTitle || '').toLowerCase();
            return title.includes(query) || id.includes(query) || tute.includes(query);
        });

        filteredClasses.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            }
            if (sortBy === 'oldest') {
                return new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0);
            }
            if (sortBy === 'title') {
                return (a.title || '').localeCompare(b.title || '');
            }
            return 0;
        });

        updateStats();
        renderGrid();
    }

    function updateStats() {
        if (statTotal) statTotal.textContent = classes.length;
        let totalCp = 0;
        classes.forEach((c) => {
            if (Array.isArray(c.checkpoints)) totalCp += c.checkpoints.length;
        });
        if (statCheckpoints) statCheckpoints.textContent = totalCp;
    }

    function liveUrl(classId) {
        return window.location.origin + '/live_class/index.html?classId=' + encodeURIComponent(classId);
    }

    function isTestDraft(classId) {
        return String(classId || '').indexOf('ST-TEST-') === 0;
    }

    function renderGrid() {
        if (!classGrid) return;
        classGrid.innerHTML = '';

        if (filteredClasses.length === 0) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
                if (emptyMessage) {
                    emptyMessage.textContent = searchInput && searchInput.value.trim()
                        ? 'No classes matched your search "' + searchInput.value.trim() + '"'
                        : "You haven't published any interactive live classes yet.";
                }
            }
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        filteredClasses.forEach((cls) => {
            const card = document.createElement('article');
            card.className = 'tute-card' + (currentView === 'list' ? ' list-view-card' : '');

            const publishedDate = cls.publishedAt
                ? new Date(cls.publishedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
                : 'Recently';

            const checkpointCount = Array.isArray(cls.checkpoints) ? cls.checkpoints.length : 0;
            const testBadge = isTestDraft(cls.classId)
                ? '<span class="grade-tag">Test Run</span>'
                : '<span class="grade-tag">Published</span>';

            card.innerHTML =
                '<div class="card-badge-row">' +
                '<span class="subject-tag"><i class="fa-solid fa-clapperboard"></i> ' + escapeHtml(cls.classId || 'Class') + '</span>' +
                testBadge +
                '</div>' +
                '<div class="card-main">' +
                '<h3 class="card-title">' + escapeHtml(cls.title || 'Untitled Class') + '</h3>' +
                '<p class="card-meta">' +
                '<span><i class="fa-solid fa-flag-checkered"></i> ' + checkpointCount + ' Checkpoints</span>' +
                '<span><i class="fa-solid fa-clock"></i> ' + publishedDate + '</span>' +
                (cls.tuteTitle ? '<span><i class="fa-solid fa-file-lines"></i> ' + escapeHtml(cls.tuteTitle) + '</span>' : '') +
                '</p>' +
                '</div>' +
                '<div class="card-actions">' +
                '<button class="card-btn btn-edit" title="Edit in Class Organizer">' +
                '<i class="fa-solid fa-pen-to-square"></i> Edit' +
                '</button>' +
                '<button class="card-btn btn-share" title="Share Class ID">' +
                '<i class="fa-solid fa-share-nodes"></i> Share' +
                '</button>' +
                '<button class="card-btn btn-delete" title="Delete Class">' +
                '<i class="fa-solid fa-trash-can"></i>' +
                '</button>' +
                '</div>';

            card.querySelector('.btn-edit').addEventListener('click', () => {
                window.location.href = '/class_organizer/index.html?classId=' + encodeURIComponent(cls.classId);
            });

            card.querySelector('.btn-share').addEventListener('click', () => {
                openShareModal(cls);
            });

            card.querySelector('.btn-delete').addEventListener('click', () => {
                openDeleteModal(cls.classId, cls.title || 'Untitled Class');
            });

            classGrid.appendChild(card);
        });
    }

    function openDeleteModal(id, title) {
        classToDeleteId = id;
        if (deleteClassTitle) deleteClassTitle.textContent = title;
        if (deleteModal) deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        classToDeleteId = null;
        if (deleteModal) deleteModal.classList.add('hidden');
    }

    function openShareModal(cls) {
        const url = liveUrl(cls.classId);
        if (shareClassId) shareClassId.value = cls.classId;
        if (shareClassUrl) shareClassUrl.value = url;
        if (btnOpenLive) btnOpenLive.href = url;
        if (shareModal) shareModal.classList.remove('hidden');
    }

    function closeShareModal() {
        if (shareModal) shareModal.classList.add('hidden');
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

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (!classToDeleteId) return;

            const store = readStore();
            delete store[classToDeleteId];
            writeStore(store);

            if (localStorage.getItem(LATEST_KEY) === classToDeleteId) {
                const remaining = Object.keys(store);
                if (remaining.length) localStorage.setItem(LATEST_KEY, remaining[remaining.length - 1]);
                else localStorage.removeItem(LATEST_KEY);
            }

            classes = classes.filter((c) => c.classId !== classToDeleteId);
            applyFilterAndSort();
            closeDeleteModal();
            showToast('Class deleted');
        });
    }

    if (btnCloseShare) btnCloseShare.addEventListener('click', closeShareModal);
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) closeShareModal();
        });
    }

    if (btnCopyId) {
        btnCopyId.addEventListener('click', () => {
            if (!shareClassId) return;
            navigator.clipboard.writeText(shareClassId.value).then(() => showToast('Class ID copied!'));
        });
    }

    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            if (!shareClassUrl) return;
            navigator.clipboard.writeText(shareClassUrl.value).then(() => showToast('Student link copied!'));
        });
    }

    if (searchInput) searchInput.addEventListener('input', applyFilterAndSort);
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            applyFilterAndSort();
        });
    }
    if (sortSelect) sortSelect.addEventListener('change', applyFilterAndSort);

    if (btnGridView && btnListView) {
        btnGridView.addEventListener('click', () => {
            currentView = 'grid';
            btnGridView.classList.add('active');
            btnListView.classList.remove('active');
            if (classGrid) classGrid.className = 'tute-grid';
            renderGrid();
        });

        btnListView.addEventListener('click', () => {
            currentView = 'list';
            btnListView.classList.add('active');
            btnGridView.classList.remove('active');
            if (classGrid) classGrid.className = 'tute-grid list-mode';
            renderGrid();
        });
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    fetchClasses();
});
