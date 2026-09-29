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
    let isScrubbing      = false;
    let scrubTime        = 0; // seconds — pointer position; play starts from here
    let activeTriggeredCpId = null;
    let editingClassId   = null; // set when opening a saved class from Class Library
    const TRACK_LABEL_W  = 100; // must match .track-label width in CSS
    const STORE_KEY      = 'smarttute_published_classes';
    const LATEST_KEY     = 'smarttute_latest_class_id';

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
    const timelineViewport      = document.getElementById('timelineViewport');
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
    const btnCopyId             = document.getElementById('btnCopyId');
    const btnOpenStudentView    = document.getElementById('btnOpenStudentView');
    const btnScheduleSession    = document.getElementById('btnScheduleSession');
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
                return true;
            }
        } catch (err) { console.error('Error fetching tutes:', err); }
        return false;
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

    function selectTuteById(tuteId) {
        if (!tuteId || !tuteSelect) return false;
        const match = tutes.find(t => String(t._id) === String(tuteId));
        if (!match) return false;
        tuteSelect.value = match._id;
        selectedTute = match;
        renderQuestionsToolbox();
        updateInspectorQuestionDropdown();
        return true;
    }

    function loadPublishedClassFromStore(classId) {
        if (!classId) return null;
        try {
            const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
            return store[classId] || null;
        } catch (err) {
            console.error('Failed to read published class', err);
            return null;
        }
    }

    function applyClassForEdit(classData) {
        if (!classData) return false;

        editingClassId = classData.classId || null;

        if (btnScheduleSession && editingClassId) {
            btnScheduleSession.href = '/session_scheduler/index.html?classId=' + encodeURIComponent(editingClassId);
        }

        const titleInput = document.getElementById('classTitleInput');
        if (titleInput) titleInput.value = classData.title || 'Untitled Interactive Class';

        if (ytUrlInput) {
            ytUrlInput.value = classData.youtubeUrl
                || (classData.videoId ? ('https://www.youtube.com/watch?v=' + classData.videoId) : ytUrlInput.value);
        }

        if (classData.videoDuration) {
            videoDuration = Number(classData.videoDuration) || videoDuration;
        }

        checkpoints = (classData.checkpoints || []).map((cp, idx) => ({
            id: cp.id || ('cp_' + Date.now() + '_' + idx),
            questionIndex: Number(cp.questionIndex) || 0,
            time: Math.max(0, Number(cp.time) || 0),
            duration: Math.max(5, Number(cp.duration) || 60),
            pauseVideo: cp.pauseVideo !== false
        }));

        selectTuteById(classData.tuteId);

        const videoId = classData.videoId || extractVideoId(ytUrlInput ? ytUrlInput.value : '');
        if (videoId) {
            if (player && isPlayerReady) {
                player.loadVideoById(videoId);
            } else if (window.YT && window.YT.Player) {
                loadYouTubePlayer(videoId);
            }
            // else: onYouTubeIframeAPIReady will load from ytUrlInput
        }

        renderRuler();
        renderTimelineMarkers();
        selectCheckpoint(null);
        showToast('Editing class ' + (classData.classId || ''));
        return true;
    }

    async function loadClassFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const classId = params.get('classId') || params.get('id') || '';
        if (!classId) return false;

        const classData = loadPublishedClassFromStore(classId);
        if (!classData) {
            alert('Could not find saved class “' + classId + '” in this browser.\nOpen Class Library and try again after publishing.');
            return false;
        }

        applyClassForEdit(classData);
        return true;
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
                '<div class="q-drag-title"><i class="fa-solid fa-grip-vertical"></i> Q' + (idx + 1) + ': ' + escapeHtml(q.promptText || q.title || 'Question ' + (idx + 1)) + '</div>' +
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
                const labelSrc = q.promptText || q.title || '';
                const label = labelSrc ? labelSrc.substring(0, 35) + (labelSrc.length > 35 ? '...' : '') : 'Question ' + (idx + 1);
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

    /* ---- Playhead ↔ video sync ---- */
    function getTrackWidth() {
        if (!timelineViewport) return 1;
        return Math.max(1, timelineViewport.clientWidth - TRACK_LABEL_W);
    }

    function timeFromClientX(clientX) {
        if (!timelineViewport) return 0;
        const rect = timelineViewport.getBoundingClientRect();
        const x = clientX - rect.left - TRACK_LABEL_W;
        const pct = Math.max(0, Math.min(1, x / getTrackWidth()));
        const dur = (player && isPlayerReady && player.getDuration && player.getDuration()) || videoDuration || 1;
        return pct * dur;
    }

    function setPlayheadTime(time, opts) {
        const seek = !opts || opts.seek !== false;
        const dur = (player && isPlayerReady && player.getDuration && player.getDuration()) || videoDuration || 1;
        scrubTime = Math.max(0, Math.min(dur, time || 0));
        const pct = (scrubTime / dur) * 100;
        const leftPx = TRACK_LABEL_W + (scrubTime / dur) * getTrackWidth();

        if (timelinePlayhead) {
            // Prefer pixel left so it aligns with track-content (after label)
            timelinePlayhead.style.left = leftPx + 'px';
        }
        if (timeDisplay) {
            timeDisplay.textContent = formatTime(scrubTime) + ' / ' + formatTime(dur);
        }
        if (seek && player && isPlayerReady && player.seekTo) {
            player.seekTo(scrubTime, true);
        }
        return scrubTime;
    }

    function syncPlayheadFromVideo() {
        if (isScrubbing || !player || !isPlayerReady || !player.getCurrentTime) return;
        const cur = player.getCurrentTime();
        const dur = player.getDuration() || videoDuration;
        scrubTime = cur;
        const leftPx = TRACK_LABEL_W + (cur / Math.max(dur, 0.001)) * getTrackWidth();
        if (timelinePlayhead) timelinePlayhead.style.left = leftPx + 'px';
        if (timeDisplay) timeDisplay.textContent = formatTime(cur) + ' / ' + formatTime(dur);
        checkPreviewTrigger(cur);
    }

    /* Click ruler / empty timeline to seek */
    function seekFromPointerEvent(e) {
        if (!isPlayerReady) return;
        // Ignore clicks that start on a checkpoint marker
        if (e.target.closest && e.target.closest('.checkpoint-marker')) return;
        setPlayheadTime(timeFromClientX(e.clientX), { seek: true });
        // Reset checkpoint trigger lock so seeking back can re-fire
        activeTriggeredCpId = null;
    }

    if (timelineRuler) {
        timelineRuler.addEventListener('click', seekFromPointerEvent);
    }

    if (timelineViewport) {
        timelineViewport.addEventListener('click', (e) => {
            if (e.target.closest && (e.target.closest('.checkpoint-marker') || e.target.closest('.timeline-playhead'))) return;
            // Only seek when clicking track areas / ruler, not labels
            seekFromPointerEvent(e);
        });
    }

    /* Drag the red playhead to scrub video */
    function onPlayheadPointerDown(e) {
        if (!isPlayerReady || !timelinePlayhead) return;
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        e.stopPropagation();

        isScrubbing = true;
        timelinePlayhead.classList.add('scrubbing');
        timelinePlayhead.setPointerCapture(e.pointerId);

        const wasPlaying = player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING;
        if (wasPlaying && player.pauseVideo) player.pauseVideo();

        function onMove(ev) {
            setPlayheadTime(timeFromClientX(ev.clientX), { seek: true });
        }

        function onUp(ev) {
            timelinePlayhead.classList.remove('scrubbing');
            try { timelinePlayhead.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            timelinePlayhead.removeEventListener('pointermove', onMove);
            timelinePlayhead.removeEventListener('pointerup', onUp);
            timelinePlayhead.removeEventListener('pointercancel', onUp);

            setPlayheadTime(timeFromClientX(ev.clientX), { seek: true });
            activeTriggeredCpId = null;
            isScrubbing = false;

            // Keep paused after scrub; play button resumes from pointer
            if (wasPlaying && player && player.playVideo) {
                // optional: don't auto-resume — user asked play button to start from pointer
            }
        }

        timelinePlayhead.addEventListener('pointermove', onMove);
        timelinePlayhead.addEventListener('pointerup', onUp);
        timelinePlayhead.addEventListener('pointercancel', onUp);
        onMove(e);
    }

    if (timelinePlayhead) {
        timelinePlayhead.addEventListener('pointerdown', onPlayheadPointerDown);
    }

    /* PLAYHEAD sync loop */
    function startPlayheadScrubber() {
        if (playheadInterval) clearInterval(playheadInterval);

        scrubTime = 0;
        setPlayheadTime(0, { seek: false });

        playheadInterval = setInterval(() => {
            syncPlayheadFromVideo();
        }, 100);

        // Keep alignment on resize
        window.addEventListener('resize', () => {
            setPlayheadTime(scrubTime, { seek: false });
        });
    }

    /* Play / Pause — play starts from current pointer position */
    if (btnTlPlay) {
        btnTlPlay.addEventListener('click', () => {
            if (!player || !isPlayerReady) return;
            // Seek to pointer, then play from there
            player.seekTo(scrubTime, true);
            activeTriggeredCpId = null;
            if (player.playVideo) player.playVideo();
        });
    }
    if (btnTlPause) {
        btnTlPause.addEventListener('click', () => {
            if (player && player.pauseVideo) player.pauseVideo();
        });
    }

    /* QUESTION SERIALIZATION (full tuteModule shape → live class) */
    function answersToObject(answers) {
        if (!answers) return {};
        if (answers instanceof Map) return Object.fromEntries(answers);
        if (typeof answers === 'object') return { ...answers };
        return {};
    }

    function imagesToObject(images) {
        if (!images) return {};
        const src = images instanceof Map ? Object.fromEntries(images) : images;
        if (typeof src !== 'object') return {};
        const out = {};
        Object.keys(src).forEach((key) => {
            const img = src[key];
            if (!img) return;
            out[key] = {
                dataUrl: img.dataUrl || '',
                originalDataUrl: img.originalDataUrl || '',
                caption: img.caption || '',
                size: img.size || 'medium',
                align: img.align || 'center',
                hotspots: Array.isArray(img.hotspots) ? img.hotspots.map((hs) => ({
                    tagId: hs.tagId,
                    x: hs.x,
                    y: hs.y,
                    label: hs.label || ''
                })) : []
            };
        });
        return out;
    }

    function serializeQuestion(raw, index) {
        const fallbackTitle = 'Question ' + (index + 1);
        if (!raw) {
            return {
                type: 'mcq',
                title: fallbackTitle,
                text: fallbackTitle,
                options: ['A', 'B', 'C', 'D'],
                correct: 0
            };
        }

        if (Array.isArray(raw.options) && raw.options.length) {
            const options = raw.options.map((opt) => (
                typeof opt === 'string' ? opt : (opt && opt.text ? opt.text : String(opt))
            ));
            return {
                type: 'mcq',
                title: raw.promptText || raw.title || fallbackTitle,
                text: raw.promptText || raw.text || raw.title || fallbackTitle,
                options,
                correct: typeof raw.correct === 'number' ? raw.correct : 0
            };
        }

        // Full tuteModule QuestionSchema payload (one selected question only)
        return {
            type: 'tute',
            id: raw.id || ('q_' + (index + 1)),
            title: raw.title || fallbackTitle,
            marks: Number(raw.marks) || 10,
            latex: raw.latex || '',
            answers: answersToObject(raw.answers),
            images: imagesToObject(raw.images)
        };
    }

    // Keep alias used by preview overlay
    function normalizeQuestion(raw, index) {
        const q = serializeQuestion(raw, index);
        if (q.type === 'tute') {
            return {
                type: 'tute',
                text: q.title,
                title: q.title,
                marks: q.marks,
                latex: q.latex,
                answers: q.answers,
                images: q.images
            };
        }
        return q;
    }

    function buildPublishedClass(classId) {
        const titleInput = document.getElementById('classTitleInput');
        const videoId = extractVideoId(ytUrlInput ? ytUrlInput.value : '') || 'M7lc1UVf-VE';
        const sorted = checkpoints.slice().sort((a, b) => a.time - b.time);

        return {
            classId,
            title: (titleInput && titleInput.value.trim()) || 'Untitled Interactive Class',
            videoId,
            youtubeUrl: ytUrlInput ? ytUrlInput.value : '',
            tuteId: selectedTute ? selectedTute._id : null,
            tuteTitle: selectedTute ? (selectedTute.title || '') : '',
            publishedAt: new Date().toISOString(),
            videoDuration: videoDuration,
            checkpoints: sorted.map((cp) => {
                const rawQ = selectedTute && Array.isArray(selectedTute.questions)
                    ? selectedTute.questions[cp.questionIndex]
                    : null;
                return {
                    id: cp.id,
                    time: Number(cp.time) || 0,
                    duration: Math.max(5, Number(cp.duration) || 60),
                    pauseVideo: cp.pauseVideo !== false,
                    questionIndex: cp.questionIndex,
                    question: serializeQuestion(rawQ, cp.questionIndex)
                };
            })
        };
    }

    function savePublishedClass(classData) {
        let store = {};
        try { store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { store = {}; }
        store[classData.classId] = classData;
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
        localStorage.setItem(LATEST_KEY, classData.classId);
        editingClassId = classData.classId;
        return classData;
    }

    /* PREVIEW TRIGGERS */

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

        const q = serializeQuestion(selectedTute.questions[cp.questionIndex], cp.questionIndex);
        if (previewQBadge) previewQBadge.textContent = 'Checkpoint Q' + (cp.questionIndex + 1) + ' · ' + (cp.duration || 60) + 's';
        if (previewQTitle) previewQTitle.textContent = q.title || q.text || 'Interactive Question';

        if (previewQOptions) {
            previewQOptions.innerHTML = '';
            if (q.type === 'mcq' && Array.isArray(q.options)) {
                q.options.forEach((opt) => {
                    const b = document.createElement('button');
                    b.className = 'answer';
                    b.textContent = opt;
                    previewQOptions.appendChild(b);
                });
            } else if (q.type === 'tute') {
                const hint = document.createElement('p');
                hint.className = 'preview-tute-hint';
                hint.textContent = 'Tute question (title, latex, images & answer boxes) will open in Live Class.';
                previewQOptions.appendChild(hint);
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

    /* SAVE CLASS (publish/share moved to Session Scheduler) */
    if (btnPublishClass) {
        btnPublishClass.addEventListener('click', () => {
            if (!checkpoints.length) {
                alert('Add at least one question checkpoint to the timeline before saving.');
                return;
            }
            if (!selectedTute) {
                alert('Select a Tute worksheet so checkpoints have questions to ask.');
                return;
            }

            const classId  = editingClassId || ('ST-CLASS-' + Math.floor(1000 + Math.random() * 9000));
            const classData = savePublishedClass(buildPublishedClass(classId));

            // Keep organizer URL tied to this class for further edits
            const orgUrl = new URL(window.location.href);
            orgUrl.searchParams.set('classId', classId);
            window.history.replaceState({}, '', orgUrl);

            if (shareClassId) shareClassId.value = classId;
            if (btnOpenStudentView) {
                btnOpenStudentView.href = '/session_scheduler/index.html?classId=' + encodeURIComponent(classId);
            }
            if (btnScheduleSession) {
                btnScheduleSession.href = '/session_scheduler/index.html?classId=' + encodeURIComponent(classId);
            }
            if (publishModal) publishModal.classList.remove('hidden');
            showToast('Class "' + classData.title + '" saved · ' + classData.checkpoints.length + ' checkpoint(s)');
        });
    }

    const btnPreviewToggle = document.getElementById('btnPreviewToggle');

    if (btnPreviewToggle) {
        btnPreviewToggle.addEventListener('click', () => {
            if (!checkpoints.length) {
                alert('Add at least one checkpoint before running a test.');
                return;
            }
            if (!selectedTute) {
                alert('Select a Tute worksheet so the live class has questions.');
                return;
            }
            const draftId = 'ST-TEST-' + Date.now();
            savePublishedClass(buildPublishedClass(draftId));
            window.open('/live_class/index.html?classId=' + encodeURIComponent(draftId), '_blank');
        });
    }

    if (btnClosePublishModal) btnClosePublishModal.addEventListener('click', () => { if (publishModal) publishModal.classList.add('hidden'); });

    if (btnCopyId)  btnCopyId.addEventListener('click',  () => { navigator.clipboard.writeText(shareClassId.value);  showToast('Class ID copied!'); });
    // btnCopyUrl removed — sharing lives in Session Scheduler

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
    (async () => {
        await fetchTutes();
        await loadClassFromUrl();
    })();
});
