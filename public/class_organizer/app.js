/**
 * SmartTute - Class Organizer Studio Engine
 * v2 -- Timeline drag-and-drop, fixed playhead origin
 */

document.addEventListener('DOMContentLoaded', () => {
    /* STATE */
    let player           = null;
    let isPlayerReady    = false;
    let videoDuration    = 300;
    let checkpoints      = [];
    let activeCheckpointId = null;
    let tutes            = [];
    let selectedTute     = null;
    let playheadInterval = null;
    let draggingCpId     = null;
    let dragStartX       = 0;
    let dragStartTime    = 0;

    /* DOM REFS */
    const ytUrlInput            = document.getElementById('ytUrlInput');
    const btnLoadYt             = document.getElementById('btnLoadYt');
    const tuteSelect            = document.getElementById('tuteSelect');
    const questionsDragList     = document.getElementById('questionsDragList');
    const inspectorEmpty        = document.getElementById('inspectorEmpty');
    const inspectorForm         = document.getElementById('inspectorForm');
    const activeItemBadge       = document.getElementById('activeItemBadge');
    const cpQuestionSelect      = document.getElementById('cpQuestionSelect');
    const cpTimeInput           = document.getElementById('cpTimeInput');
    const cpDurationInput       = document.getElementById('cpDurationInput');
    const cpPauseToggle         = document.getElementById('cpPauseToggle');
    const btnDeleteCheckpoint   = document.getElementById('btnDeleteCheckpoint');
    const previewQOverlay       = document.getElementById('previewQOverlay');
    const previewQBadge         = document.getElementById('previewQBadge');
    const previewQTitle         = document.getElementById('previewQTitle');
    const previewQOptions       = document.getElementById('previewQOptions');
    const btnResumePreview      = document.getElementById('btnResumePreview');
    const timelineRuler         = document.getElementById('timelineRuler');
    const timelinePlayhead      = document.getElementById('timelinePlayhead');
    const questionsTrackContent = document.getElementById('questionsTrackContent');
    const timeDisplay           = document.getElementById('timeDisplay');
    const btnTlPlay             = document.getElementById('btnTlPlay');
    const btnTlPause            = document.getElementById('btnTlPause');
    const btnPublishClass       = document.getElementById('btnPublishClass');
    const publishModal          = document.getElementById('publishModal');
    const btnClosePublishModal  = document.getElementById('btnClosePublishModal');
    const shareClassId          = document.getElementById('shareClassId');
    const shareClassUrl         = document.getElementById('shareClassUrl');
    const publishQrImage        = document.getElementById('publishQrImage');
    const btnCopyId             = document.getElementById('btnCopyId');
    const btnCopyUrl            = document.getElementById('btnCopyUrl');
    const btnOpenStudentView    = document.getElementById('btnOpenStudentView');
    const menuButton            = document.getElementById('menuButton');
    const sideMenu              = document.getElementById('sideMenu');
    const closeMenu             = document.getElementById('closeMenu');
    const menuBackdrop          = document.getElementById('menuBackdrop');
    const themeToggle           = document.getElementById('themeToggle');

    /* THEME */
    const savedTheme = localStorage.getItem('smarttute_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode', 'dark-theme');
        if (themeToggle) themeToggle.textContent = '\u{1F319}';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('dark-theme', isDark);
            themeToggle.textContent = isDark ? '\u{1F319}' : '\u{2600}';
            localStorage.setItem('smarttute_theme', isDark ? 'dark' : 'light');
        });
    }

    /* NAV MENU */
    if (menuButton && sideMenu && menuBackdrop) {
        const toggleMenu = (open) => {
            sideMenu.classList.toggle('open', open);
            menuBackdrop.classList.toggle('visible', open);
        };
        menuButton.addEventListener('click', () => toggleMenu(!sideMenu.classList.contains('open')));
        if (closeMenu) closeMenu.addEventListener('click', () => toggleMenu(false));
        menuBackdrop.addEventListener('click', () => toggleMenu(false));
    }

    /* YOUTUBE PLAYER */
    window.onYouTubeIframeAPIReady = () => {
        loadYouTubePlayer(extractVideoId(ytUrlInput.value) || 'M7lc1UVf-VE');
    };

    function loadYouTubePlayer(videoId) {
        if (player) { player.loadVideoById(videoId); return; }
        player = new YT.Player('previewYoutubePlayer', {
            videoId,
            playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
            events: {
                onReady: () => {
                    isPlayerReady = true;
                    videoDuration = player.getDuration() || 300;
                    renderRuler();
                    renderTimelineMarkers();
                    startPlayheadScrubber();
                },
                onStateChange: (e) => {
                    if (e.data === YT.PlayerState.PLAYING) {
                        videoDuration = player.getDuration() || 300;
                        renderRuler();
                        renderTimelineMarkers();
                    }
                }
            }
        });
    }

    function extractVideoId(url) {
        const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (m && m[2].length === 11) ? m[2] : null;
    }

    if (btnLoadYt) {
        btnLoadYt.addEventListener('click', () => {
            const vid = extractVideoId(ytUrlInput.value);
            vid ? loadYouTubePlayer(vid) : alert('Please enter a valid YouTube URL');
        });
    }

    /* TUTES API */
    async function fetchTutes() {
        try {
            const res = await fetch('/api/tutes');
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                tutes = result.data;
                populateTuteDropdown();
            }
        } catch (err) { console.error('Error fetching tutes:', err); }
    }

    function populateTuteDropdown() {
        tuteSelect.innerHTML = '<option value="">-- Choose a Tute from Library --</option>';
        tutes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t._id;
            opt.textContent = t.title || 'Untitled' + ' (' + (t.questions || []).length + ' Qs)';
            tuteSelect.appendChild(opt);
        });
    }

    if (tuteSelect) {
        tuteSelect.addEventListener('change', (e) => {
            selectedTute = tutes.find(t => t._id === e.target.value);
            renderQuestionsToolbox();
            updateInspectorQuestionDropdown();
        });
    }

    /* TOOLBOX QUESTIONS */
    function renderQuestionsToolbox() {
        if (!selectedTute || !Array.isArray(selectedTute.questions) || !selectedTute.questions.length) {
            questionsDragList.innerHTML = '<div class="drag-hint">No questions found in selected Tute</div>';
            return;
        }
        questionsDragList.innerHTML = '';
        selectedTute.questions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'question-drag-item';
            item.setAttribute('draggable', 'true');
            item.dataset.questionIndex = idx;
            item.innerHTML =
                '<div class="q-drag-title"><i class="fa-solid fa-grip-vertical"></i> Q' + (idx + 1) + ': ' + escapeHtml(q.promptText || 'Question ' + (idx + 1)) + '</div>' +
                '<button class="btn-add-cp" title="Add to timeline at current playhead time"><i class="fa-solid fa-plus"></i></button>';

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('questionIndex', String(idx));
                e.dataTransfer.effectAllowed = 'copy';
            });

            item.querySelector('.btn-add-cp').addEventListener('click', () => {
                const curTime = player && isPlayerReady ? Math.floor(player.getCurrentTime()) : 30;
                addCheckpoint(idx, curTime);
            });
            questionsDragList.appendChild(item);
        });
    }

    /* Drop toolbox item onto track */
    if (questionsTrackContent) {
        questionsTrackContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        questionsTrackContent.addEventListener('drop', (e) => {
            e.preventDefault();
            const qIndex = parseInt(e.dataTransfer.getData('questionIndex'), 10);
            if (isNaN(qIndex)) return;
            const rect = questionsTrackContent.getBoundingClientRect();
            const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = Math.round(pct * videoDuration);
            addCheckpoint(qIndex, time);
        });
    }

    /* CHECKPOINTS */
    function addCheckpoint(qIndex, triggerTime) {
        triggerTime = triggerTime || 30;
        const newCp = {
            id: 'cp_' + Date.now(),
            questionIndex: qIndex,
            time: Math.max(0, Math.min(triggerTime, videoDuration)),
            duration: 60,
            pauseVideo: true
        };
        checkpoints.push(newCp);
        renderTimelineMarkers();
        selectCheckpoint(newCp.id);
    }

    function renderTimelineMarkers() {
        questionsTrackContent.innerHTML = '';
        checkpoints.forEach((cp) => {
            const pct  = Math.min(100, Math.max(0, (cp.time / videoDuration) * 100));
            const qNum = cp.questionIndex + 1;

            const marker = document.createElement('div');
            marker.className = 'checkpoint-marker' + (activeCheckpointId === cp.id ? ' active' : '');
            marker.style.left = pct + '%';
            marker.dataset.cpId = cp.id;
            marker.title = 'Q' + qNum + ' - drag to change trigger time';

            marker.innerHTML =
                '<div class="marker-pill">' +
                '  <i class="fa-solid fa-circle-dot"></i> Q' + qNum +
                '  <span class="marker-time">(' + formatTime(cp.time) + ')</span>' +
                '</div>' +
                '<div class="marker-line"></div>';

            marker.addEventListener('pointerdown', onMarkerPointerDown);
            marker.addEventListener('click', (e) => {
                if (marker.dataset.wasDragged === 'true') {
                    marker.dataset.wasDragged = 'false';
                    return;
                }
                selectCheckpoint(cp.id);
            });

            questionsTrackContent.appendChild(marker);
        });
    }

    /* Pointer drag for markers */
    function onMarkerPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const marker  = e.currentTarget;
        const cpId    = marker.dataset.cpId;
        const cp      = checkpoints.find(c => c.id === cpId);
        if (!cp) return;

        draggingCpId  = cpId;
        dragStartX    = e.clientX;
        dragStartTime = cp.time;
        marker.dataset.wasDragged = 'false';

        marker.setPointerCapture(e.pointerId);
        marker.classList.add('dragging');

        const trackRect = questionsTrackContent.getBoundingClientRect();

        function onMove(ev) {
            const dx   = ev.clientX - dragStartX;
            const pct  = dx / trackRect.width;
            const dt   = pct * videoDuration;
            const newT = Math.round(Math.max(0, Math.min(videoDuration, dragStartTime + dt)));

            cp.time = newT;
            marker.style.left = ((newT / videoDuration) * 100) + '%';
            const timeSpan = marker.querySelector('.marker-time');
            if (timeSpan) timeSpan.textContent = '(' + formatTime(newT) + ')';

            if (activeCheckpointId === cpId && cpTimeInput) cpTimeInput.value = newT;
            if (Math.abs(dx) > 3) marker.dataset.wasDragged = 'true';
        }

        function onUp() {
            marker.classList.remove('dragging');
            marker.releasePointerCapture(e.pointerId);
            marker.removeEventListener('pointermove', onMove);
            marker.removeEventListener('pointerup',   onUp);
            draggingCpId = null;
        }

        marker.addEventListener('pointermove', onMove);
        marker.addEventListener('pointerup',   onUp);
        selectCheckpoint(cpId);
        e.preventDefault();
    }

    /* SELECT / INSPECT */
    function selectCheckpoint(id) {
        activeCheckpointId = id;
        const cp = checkpoints.find(c => c.id === id);

        document.querySelectorAll('.checkpoint-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.cpId === id);
        });

        if (!cp) {
            if (inspectorEmpty) inspectorEmpty.classList.remove('hidden');
            if (inspectorForm)  inspectorForm.classList.add('hidden');
            if (activeItemBadge) activeItemBadge.textContent = 'No item selected';
            return;
        }

        if (inspectorEmpty) inspectorEmpty.classList.add('hidden');
        if (inspectorForm)  inspectorForm.classList.remove('hidden');
        if (activeItemBadge) activeItemBadge.textContent = 'Checkpoint Q' + (cp.questionIndex + 1);

        updateInspectorQuestionDropdown();
        if (cpQuestionSelect) cpQuestionSelect.value = cp.questionIndex;
        if (cpTimeInput)      cpTimeInput.value       = cp.time;
        if (cpDurationInput)  cpDurationInput.value   = cp.duration;
        if (cpPauseToggle)    cpPauseToggle.checked   = cp.pauseVideo;
    }

    function updateInspectorQuestionDropdown() {
        if (!cpQuestionSelect) return;
        cpQuestionSelect.innerHTML = '';
        if (selectedTute && Array.isArray(selectedTute.questions)) {
            selectedTute.questions.forEach((q, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                const label = q.promptText ? q.promptText.substring(0, 35) + '...' : 'Question ' + (idx + 1);
                opt.textContent = 'Q' + (idx + 1) + ': ' + label;
                cpQuestionSelect.appendChild(opt);
            });
        }
    }

    /* INSPECTOR FORM BINDINGS */
    if (cpQuestionSelect) {
        cpQuestionSelect.addEventListener('change', (e) => {
            const cp = checkpoints.find(c => c.id === activeCheckpointId);
            if (cp) { cp.questionIndex = parseInt(e.target.value, 10); renderTimelineMarkers(); }
        });
    }

    if (cpTimeInput) {
        cpTimeInput.addEventListener('input', (e) => {
            const cp = checkpoints.find(c => c.id === activeCheckpointId);
            if (cp) {
                cp.time = Math.max(0, Math.min(videoDuration, parseInt(e.target.value, 10) || 0));
                renderTimelineMarkers();
            }
        });
    }

    if (cpDurationInput) {
        cpDurationInput.addEventListener('input', (e) => {
            const cp = checkpoints.find(c => c.id === activeCheckpointId);
            if (cp) cp.duration = parseInt(e.target.value, 10) || 60;
        });
    }

    if (cpPauseToggle) {
        cpPauseToggle.addEventListener('change', (e) => {
            const cp = checkpoints.find(c => c.id === activeCheckpointId);
            if (cp) cp.pauseVideo = e.target.checked;
        });
    }

    if (btnDeleteCheckpoint) {
        btnDeleteCheckpoint.addEventListener('click', () => {
            if (activeCheckpointId) {
                checkpoints = checkpoints.filter(c => c.id !== activeCheckpointId);
                selectCheckpoint(null);
                renderTimelineMarkers();
            }
        });
    }

    /* TIMELINE RULER */
    function renderRuler() {
        if (!timelineRuler) return;
        timelineRuler.innerHTML = '';
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t    = Math.floor((videoDuration / steps) * i);
            const tick = document.createElement('span');
            tick.className   = 'ruler-tick';
            tick.textContent = formatTime(t);
            timelineRuler.appendChild(tick);
        }
    }

    /* Click ruler to seek */
    if (timelineRuler) {
        timelineRuler.addEventListener('click', (e) => {
            if (!isPlayerReady) return;
            const rect = timelineRuler.getBoundingClientRect();
            const pct  = (e.clientX - rect.left) / rect.width;
            player.seekTo(pct * videoDuration, true);
        });
    }

    /* PLAYHEAD - starts at 00:00 (left: 0%) */
    function startPlayheadScrubber() {
        if (playheadInterval) clearInterval(playheadInterval);

        if (timelinePlayhead) timelinePlayhead.style.left = '0%';
        if (timeDisplay)      timeDisplay.textContent     = '00:00 / ' + formatTime(videoDuration);

        playheadInterval = setInterval(() => {
            if (!player || !isPlayerReady || !player.getCurrentTime) return;
            const cur = player.getCurrentTime();
            const dur = player.getDuration() || videoDuration;
            const pct = (cur / dur) * 100;

            if (timelinePlayhead) timelinePlayhead.style.left = pct + '%';
            if (timeDisplay)      timeDisplay.textContent     = formatTime(cur) + ' / ' + formatTime(dur);

            checkPreviewTrigger(cur);
        }, 250);
    }

    /* PREVIEW TRIGGERS */
    let activeTriggeredCpId = null;

    function checkPreviewTrigger(curTime) {
        const cp = checkpoints.find(c => Math.abs(c.time - curTime) < 0.4);
        if (cp && activeTriggeredCpId !== cp.id) {
            activeTriggeredCpId = cp.id;
            triggerPreviewCheckpoint(cp);
        }
    }

    function triggerPreviewCheckpoint(cp) {
        if (cp.pauseVideo && player && player.pauseVideo) player.pauseVideo();
        if (!selectedTute || !selectedTute.questions || !selectedTute.questions[cp.questionIndex]) return;

        const q = selectedTute.questions[cp.questionIndex];
        if (previewQBadge) previewQBadge.textContent = 'Checkpoint Q' + (cp.questionIndex + 1);
        if (previewQTitle) previewQTitle.textContent  = q.promptText || 'Interactive Question';

        if (previewQOptions) {
            previewQOptions.innerHTML = '';
            if (Array.isArray(q.options)) {
                q.options.forEach(opt => {
                    const b = document.createElement('button');
                    b.className   = 'answer';
                    b.textContent = typeof opt === 'string' ? opt : (opt.text || 'Option');
                    previewQOptions.appendChild(b);
                });
            }
        }
        if (previewQOverlay) previewQOverlay.classList.remove('hidden');
    }

    if (btnResumePreview) {
        btnResumePreview.addEventListener('click', () => {
            if (previewQOverlay) previewQOverlay.classList.add('hidden');
            if (player && player.playVideo) player.playVideo();
            activeTriggeredCpId = null;
        });
    }

    if (btnTlPlay)  btnTlPlay.addEventListener('click',  () => { if (player && player.playVideo)  player.playVideo();  });
    if (btnTlPause) btnTlPause.addEventListener('click', () => { if (player && player.pauseVideo) player.pauseVideo(); });

    /* PUBLISH MODAL */
    if (btnPublishClass) {
        btnPublishClass.addEventListener('click', () => {
            const classId  = 'ST-CLASS-' + Math.floor(1000 + Math.random() * 9000);
            const classUrl = window.location.origin + '/live_class/index.html?classId=' + classId;
            if (shareClassId)       shareClassId.value       = classId;
            if (shareClassUrl)      shareClassUrl.value      = classUrl;
            if (publishQrImage)     publishQrImage.src       = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(classUrl);
            if (btnOpenStudentView) btnOpenStudentView.href  = classUrl;
            if (publishModal)       publishModal.classList.remove('hidden');
        });
    }

    if (btnClosePublishModal) btnClosePublishModal.addEventListener('click', () => { if (publishModal) publishModal.classList.add('hidden'); });

    if (btnCopyId)  btnCopyId.addEventListener('click',  () => { navigator.clipboard.writeText(shareClassId.value);  showToast('Class ID copied!'); });
    if (btnCopyUrl) btnCopyUrl.addEventListener('click', () => { navigator.clipboard.writeText(shareClassUrl.value); showToast('Student link copied!'); });

    /* HELPERS */
    function formatTime(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className   = 'studio-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
    }

    /* INIT */
    renderRuler();
    fetchTutes();
});
