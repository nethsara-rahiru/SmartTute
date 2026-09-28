/**
 * SmartTute - Tute Library Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tutes = [];
    let filteredTutes = [];
    let tuteToDeleteId = null;
    let currentView = 'grid';

    // DOM Elements
    const tuteGrid = document.getElementById('tuteGrid');
    const searchInput = document.getElementById('searchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const sortSelect = document.getElementById('sortSelect');
    const btnGridView = document.getElementById('btnGridView');
    const btnListView = document.getElementById('btnListView');
    const emptyState = document.getElementById('emptyState');
    const emptyMessage = document.getElementById('emptyMessage');
    const loadingState = document.getElementById('loadingState');
    const statTotal = document.getElementById('statTotal');
    const statQuestions = document.getElementById('statQuestions');
    const btnCreateNew = document.getElementById('btnCreateNew');

    // Navigation Rail & Side Menu
    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenu = document.getElementById('closeMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const themeToggle = document.getElementById('themeToggle');

    // Modal elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteTuteTitle = document.getElementById('deleteTuteTitle');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    // Theme initialization
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

    // Side menu toggle logic
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

    // Create New Button
    if (btnCreateNew) {
        btnCreateNew.addEventListener('click', () => {
            window.location.href = '/tute_lab/index.html';
        });
    }

    // Fetch Tutes from backend API
    async function fetchTutes() {
        try {
            if (loadingState) loadingState.classList.remove('hidden');
            const res = await fetch('/api/tutes');
            const result = await res.json();
            
            if (result.success && Array.isArray(result.data)) {
                tutes = result.data;
                applyFilterAndSort();
            } else {
                showError('Failed to parse tutes list from server');
            }
        } catch (err) {
            console.error('Error fetching tutes:', err);
            showError('Unable to connect to server backend.');
        } finally {
            if (loadingState) loadingState.classList.add('hidden');
        }
    }

    function showError(msg) {
        if (tuteGrid) {
            tuteGrid.innerHTML = `
                <div class="error-box">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>${msg}</p>
                    <button class="lib-btn lib-btn-ghost" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Filter and Sort Tutes
    function applyFilterAndSort() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const sortBy = sortSelect ? sortSelect.value : 'newest';

        if (btnClearSearch) {
            btnClearSearch.classList.toggle('hidden', query.length === 0);
        }

        // Filter
        filteredTutes = tutes.filter(t => {
            const title = (t.title || '').toLowerCase();
            const subject = (t.subject || '').toLowerCase();
            const grade = (t.grade || '').toLowerCase();
            return title.includes(query) || subject.includes(query) || grade.includes(query);
        });

        // Sort
        filteredTutes.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            } else if (sortBy === 'oldest') {
                return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
            } else if (sortBy === 'title') {
                return (a.title || '').localeCompare(b.title || '');
            }
            return 0;
        });

        updateStats();
        renderGrid();
    }

    // Update Header Quick Stats
    function updateStats() {
        if (statTotal) statTotal.textContent = tutes.length;
        
        let totalQ = 0;
        tutes.forEach(t => {
            if (Array.isArray(t.questions)) totalQ += t.questions.length;
        });
        if (statQuestions) statQuestions.textContent = totalQ;
    }

    // Render Tute Cards
    function renderGrid() {
        if (!tuteGrid) return;
        tuteGrid.innerHTML = '';

        if (filteredTutes.length === 0) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
                if (emptyMessage) {
                    emptyMessage.textContent = searchInput.value.trim() 
                        ? `No worksheets matched your search "${searchInput.value.trim()}"`
                        : "You haven't created any interactive worksheets yet.";
                }
            }
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        filteredTutes.forEach(tute => {
            const card = document.createElement('article');
            card.className = `tute-card ${currentView === 'list' ? 'list-view-card' : ''}`;

            const updatedDate = tute.updatedAt 
                ? new Date(tute.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently';

            const questionCount = Array.isArray(tute.questions) ? tute.questions.length : 0;
            const subjectTag = tute.subject || 'General';
            const gradeTag = tute.grade ? `Grade ${tute.grade}` : '';

            card.innerHTML = `
                <div class="card-badge-row">
                    <span class="subject-tag"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(subjectTag)}</span>
                    ${gradeTag ? `<span class="grade-tag">${escapeHtml(gradeTag)}</span>` : ''}
                </div>
                <div class="card-main">
                    <h3 class="card-title">${escapeHtml(tute.title || 'Untitled Tute')}</h3>
                    <p class="card-meta">
                        <span><i class="fa-solid fa-circle-question"></i> ${questionCount} Questions</span>
                        <span><i class="fa-solid fa-clock"></i> ${updatedDate}</span>
                    </p>
                </div>
                <div class="card-actions">
                    <button class="card-btn btn-launch" data-id="${tute._id}" title="Open in Tute Lab Editor">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="card-btn btn-delete" data-id="${tute._id}" data-title="${escapeHtml(tute.title || 'Untitled Tute')}" title="Delete Tute">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            // Action listener for edit
            card.querySelector('.btn-launch').addEventListener('click', () => {
                window.location.href = `/tute_lab/index.html?id=${tute._id}`;
            });

            // Action listener for delete
            card.querySelector('.btn-delete').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const title = e.currentTarget.getAttribute('data-title');
                openDeleteModal(id, title);
            });

            tuteGrid.appendChild(card);
        });
    }

    // Modal Delete Handlers
    function openDeleteModal(id, title) {
        tuteToDeleteId = id;
        if (deleteTuteTitle) deleteTuteTitle.textContent = title;
        if (deleteModal) deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        tuteToDeleteId = null;
        if (deleteModal) deleteModal.classList.add('hidden');
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!tuteToDeleteId) return;

            btnConfirmDelete.disabled = true;
            btnConfirmDelete.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;

            try {
                const res = await fetch(`/api/tutes/${tuteToDeleteId}`, { method: 'DELETE' });
                const result = await res.json();

                if (result.success) {
                    tutes = tutes.filter(t => t._id !== tuteToDeleteId);
                    applyFilterAndSort();
                    closeDeleteModal();
                } else {
                    alert('Error deleting worksheet: ' + (result.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('Delete request failed:', err);
                alert('Server error while deleting worksheet');
            } finally {
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.innerHTML = `Delete Worksheet`;
            }
        });
    }

    // Event Listeners for Search & Sorting
    if (searchInput) {
        searchInput.addEventListener('input', applyFilterAndSort);
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            applyFilterAndSort();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilterAndSort);
    }

    // Grid vs List view toggle
    if (btnGridView && btnListView) {
        btnGridView.addEventListener('click', () => {
            currentView = 'grid';
            btnGridView.classList.add('active');
            btnListView.classList.remove('active');
            if (tuteGrid) tuteGrid.className = 'tute-grid';
            renderGrid();
        });

        btnListView.addEventListener('click', () => {
            currentView = 'list';
            btnListView.classList.add('active');
            btnGridView.classList.remove('active');
            if (tuteGrid) tuteGrid.className = 'tute-grid list-mode';
            renderGrid();
        });
    }

    // Helper: Escaping HTML
    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#039;');
    }

    // Initial load
    fetchTutes();
});
