/**
 * SmartTute Live Class — Chat Module
 * Handles: text messages, photo uploads, voice recording + playback.
 * All media stored as base64 via /api/chat/:sessionId.
 *
 * This script is injected AFTER script.js. It expects these globals
 * set by script.js:
 *   window._chatSessionId  — the active sessionId
 *   window._chatStudentId  — the student's ID
 *   window._chatStudentName — the student's display name
 *
 * Those are set from inside script.js once the student joins successfully.
 */
(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  const POLL_INTERVAL_MS   = 3000;   // fetch new messages every 3 s
  const MAX_IMAGE_DIM      = 1200;   // max px side — images are downscaled client-side
  const MAX_IMAGE_QUALITY  = 0.82;   // JPEG quality for client-side compression
  const MAX_VOICE_SEC      = 120;    // 2 minute voice limit

  /* ── DOM ────────────────────────────────────────────────────── */
  const chatMessages  = document.getElementById('chatMessages');
  const chatForm      = document.getElementById('chatForm');
  const chatInput     = document.getElementById('chatInput');
  const chatImgPreview    = document.getElementById('chatImgPreview');
  const chatImgPreviewImg = document.getElementById('chatImgPreviewImg');
  const chatImgRemove = document.getElementById('chatImgRemove');
  const chatVoiceBar  = document.getElementById('chatVoiceBar');
  const chatVoiceTimer= document.getElementById('chatVoiceTimer');
  const chatVoiceCancel = document.getElementById('chatVoiceCancel');
  const chatVoiceBtn  = document.getElementById('chatVoiceBtn');
  const chatImageInput= document.getElementById('chatImageInput');
  const chatSendBtn   = document.getElementById('chatSendBtn');

  if (!chatMessages || !chatForm) return; // chat elements not on page

  /* ── State ──────────────────────────────────────────────────── */
  let pendingImageData = null; // base64 dataURL for queued image
  let mediaRecorder    = null;
  let audioChunks      = [];
  let voiceTimerInt    = null;
  let voiceElapsedSec  = 0;
  let isRecording      = false;
  let pollTimer        = null;
  let lastMessageTime  = null; // ISO timestamp of last fetched message
  let renderedIds      = new Set();

  /* ── Helpers ────────────────────────────────────────────────── */
  function getCtx() {
    return {
      sessionId:   window._chatSessionId   || null,
      studentId:   window._chatStudentId   || null,
      studentName: window._chatStudentName || 'Student'
    };
  }

  function ready() {
    const { sessionId, studentId } = getCtx();
    return !!(sessionId && studentId);
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDuration(sec) {
    sec = Math.round(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function timeLabel(isoStr) {
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
  }

  function scrollToBottom() {
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /* ── Image compression ───────────────────────────────────────── */
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
            const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
            width  = Math.round(width  * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', MAX_IMAGE_QUALITY));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ── Image picker ────────────────────────────────────────────── */
  if (chatImageInput) {
    chatImageInput.addEventListener('change', async () => {
      const file = chatImageInput.files[0];
      if (!file) return;
      chatImageInput.value = '';
      try {
        const dataUrl = await compressImage(file);
        pendingImageData = dataUrl;
        chatImgPreviewImg.src = dataUrl;
        chatImgPreview.classList.remove('hidden');
        chatInput.placeholder = 'Add a caption (optional)…';
        chatInput.focus();
      } catch (_) {
        alert('Could not load that image. Please try another file.');
      }
    });
  }

  if (chatImgRemove) {
    chatImgRemove.addEventListener('click', clearPendingImage);
  }

  function clearPendingImage() {
    pendingImageData = null;
    chatImgPreview.classList.add('hidden');
    chatImgPreviewImg.src = '';
    chatInput.placeholder = 'Write a message…';
  }

  /* ── Voice recording ─────────────────────────────────────────── */
  function startVoiceRecording() {
    if (isRecording) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        isRecording   = true;
        audioChunks   = [];
        voiceElapsedSec = 0;
        chatVoiceBar.classList.remove('hidden');
        chatForm.querySelector('.chat-input-row').classList.add('recording');
        chatVoiceBtn.querySelector('i').className = 'fa-solid fa-stop';

        // Update voice timer every second
        voiceTimerInt = setInterval(() => {
          voiceElapsedSec++;
          chatVoiceTimer.textContent = formatDuration(voiceElapsedSec);
          if (voiceElapsedSec >= MAX_VOICE_SEC) stopVoiceRecording(true);
        }, 1000);

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

        mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (audioChunks.length > 0 && !cancelledRecording) {
            const blob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onload = (ev) => sendVoiceMessage(ev.target.result, voiceElapsedSec);
            reader.readAsDataURL(blob);
          }
          cancelledRecording = false;
        };
        mediaRecorder.start(250); // collect in 250ms chunks
      })
      .catch(() => {
        alert('Microphone access is needed to send voice messages. Please allow microphone access and try again.');
      });
  }

  let cancelledRecording = false;

  function stopVoiceRecording(send = true) {
    if (!isRecording || !mediaRecorder) return;
    cancelledRecording = !send;
    clearInterval(voiceTimerInt);
    isRecording = false;
    chatVoiceBar.classList.add('hidden');
    chatForm.querySelector('.chat-input-row').classList.remove('recording');
    chatVoiceBtn.querySelector('i').className = 'fa-solid fa-microphone';
    chatVoiceTimer.textContent = '0:00';
    if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  if (chatVoiceBtn) {
    chatVoiceBtn.addEventListener('click', () => {
      if (isRecording) {
        stopVoiceRecording(true);
      } else {
        startVoiceRecording();
      }
    });
  }

  if (chatVoiceCancel) {
    chatVoiceCancel.addEventListener('click', () => stopVoiceRecording(false));
  }

  /* ── Send ────────────────────────────────────────────────────── */
  async function sendVoiceMessage(audioData, duration) {
    const { sessionId, studentId, studentName } = getCtx();
    if (!sessionId || !studentId) return;
    try {
      await apiFetch(`/api/chat/${sessionId}`, {
        method: 'POST',
        body: { studentId, studentName, type: 'voice', audioData, audioDuration: Math.round(duration) }
      });
      // Poll immediately for own message
      pollMessages();
    } catch (err) {
      showChatError('Could not send voice message: ' + (err.message || 'Error'));
    }
  }

  async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
    return data;
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!ready()) {
        showChatError('You need to join the session before sending messages.');
        return;
      }
      const { sessionId, studentId, studentName } = getCtx();
      const text = chatInput.value.trim();

      // Image message
      if (pendingImageData) {
        try {
          chatSendBtn.disabled = true;
          await apiFetch(`/api/chat/${sessionId}`, {
            method: 'POST',
            body: { studentId, studentName, type: 'image', imageData: pendingImageData, imageCaption: text }
          });
          clearPendingImage();
          chatInput.value = '';
          pollMessages();
        } catch (err) {
          showChatError(err.message || 'Could not send image.');
        } finally {
          chatSendBtn.disabled = false;
        }
        return;
      }

      // Text message
      if (!text) return;
      try {
        chatSendBtn.disabled = true;
        chatInput.value = '';
        await apiFetch(`/api/chat/${sessionId}`, {
          method: 'POST',
          body: { studentId, studentName, type: 'text', text }
        });
        pollMessages();
      } catch (err) {
        showChatError(err.message || 'Could not send message.');
        chatInput.value = text; // restore on failure
      } finally {
        chatSendBtn.disabled = false;
        chatInput.focus();
      }
    });
  }

  /* ── Error toast in chat ────────────────────────────────────── */
  function showChatError(msg) {
    const el = document.createElement('p');
    el.className = 'chat-system chat-error';
    el.textContent = '⚠️ ' + msg;
    chatMessages.appendChild(el);
    scrollToBottom();
    setTimeout(() => el.remove(), 6000);
  }

  /* ── Render messages ─────────────────────────────────────────── */
  function renderMessage(msg) {
    const { sessionId } = getCtx();
    const isMine = msg.studentId === (window._chatStudentId || '');
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg' + (isMine ? ' chat-msg-mine' : '');
    wrapper.dataset.msgId = msg._id;

    const nameSpan = isMine ? '' : `<span class="chat-msg-name">${escHtml(msg.studentName)}</span>`;

    let content = '';
    if (msg.type === 'text') {
      content = `<div class="chat-bubble">${nameSpan}<p>${escHtml(msg.text)}</p></div>`;
    } else if (msg.type === 'image') {
      const cap = msg.imageCaption ? `<p class="chat-img-cap">${escHtml(msg.imageCaption)}</p>` : '';
      content = `<div class="chat-bubble chat-bubble-img">
        ${nameSpan}
        <img class="chat-img-thumb" src="${msg.imageData}" alt="Photo" loading="lazy"
             onclick="window._openChatPhoto(this.src)">
        ${cap}
      </div>`;
    } else if (msg.type === 'voice') {
      const dur = msg.audioDuration ? formatDuration(msg.audioDuration) : '';
      content = `<div class="chat-bubble chat-bubble-voice">
        ${nameSpan}
        <div class="voice-player">
          <button class="voice-play-btn" onclick="window._playVoice(this)" data-audio="${encodeURIComponent(msg.audioData)}" aria-label="Play voice message">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="voice-waveform" aria-hidden="true">
            ${Array.from({length: 20}, () => `<span style="height:${Math.round(20 + Math.random()*60)}%"></span>`).join('')}
          </div>
          <span class="voice-dur">${escHtml(dur)}</span>
        </div>
      </div>`;
    }

    const timeStr = `<span class="chat-msg-time">${timeLabel(msg.createdAt)}</span>`;
    wrapper.innerHTML = content + timeStr;
    chatMessages.appendChild(wrapper);
  }

  /* ── Photo lightbox ──────────────────────────────────────────── */
  window._openChatPhoto = function(src) {
    let overlay = document.getElementById('chatPhotoOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'chatPhotoOverlay';
      overlay.className = 'chat-photo-overlay';
      overlay.innerHTML = '<img id="chatPhotoFull" src="" alt="Full size photo"><button aria-label="Close photo">×</button>';
      overlay.querySelector('button').onclick = () => overlay.classList.add('hidden');
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
      document.body.appendChild(overlay);
    }
    overlay.querySelector('#chatPhotoFull').src = src;
    overlay.classList.remove('hidden');
  };

  /* ── Voice playback ──────────────────────────────────────────── */
  let activeAudio = null;
  window._playVoice = function(btn) {
    const src = decodeURIComponent(btn.dataset.audio);
    const icon = btn.querySelector('i');

    if (activeAudio && !activeAudio.paused) {
      activeAudio.pause();
      // Reset all play buttons
      document.querySelectorAll('.voice-play-btn i').forEach(i => i.className = 'fa-solid fa-play');
      if (activeAudio._src === src) { activeAudio = null; return; }
    }

    const audio = new Audio(src);
    audio._src = src;
    activeAudio = audio;
    icon.className = 'fa-solid fa-pause';

    audio.onended = () => { icon.className = 'fa-solid fa-play'; activeAudio = null; };
    audio.onerror = () => { icon.className = 'fa-solid fa-play'; activeAudio = null; };
    audio.play().catch(() => { icon.className = 'fa-solid fa-play'; });
  };

  /* ── Poll ────────────────────────────────────────────────────── */
  async function pollMessages() {
    const { sessionId } = getCtx();
    if (!sessionId) return;

    const url = lastMessageTime
      ? `/api/chat/${sessionId}?after=${encodeURIComponent(lastMessageTime)}`
      : `/api/chat/${sessionId}`;

    try {
      const data = await fetch(url).then(r => r.json());
      const msgs = data.messages || [];
      if (data.serverTime) lastMessageTime = data.serverTime;

      let added = false;
      msgs.forEach(msg => {
        if (!renderedIds.has(msg._id)) {
          renderedIds.add(msg._id);
          renderMessage(msg);
          added = true;
        }
      });

      if (added) scrollToBottom();
    } catch (_) { /* ignore network errors silently */ }
  }

  function startPolling() {
    stopPolling();
    pollMessages();
    pollTimer = setInterval(pollMessages, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  /* ── Start once session is joined ───────────────────────────── */
  // We watch for the global to be set (script.js sets it after join)
  let bootTimer = setInterval(() => {
    if (ready()) {
      clearInterval(bootTimer);
      bootTimer = null;
      startPolling();
    }
  }, 500);

  // Also clean up if chat panel is closed
  document.getElementById('closeChat') && document.getElementById('closeChat').addEventListener('click', () => {
    // Don't stop polling — still track messages in background
  });

})();
