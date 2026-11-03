(async function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const mode = ['login', 'profile'].includes(params.get('mode')) ? params.get('mode') : 'register';
    function destination(user) {
        const raw = params.get('next');
        if (raw) {
            const url = new URL(raw, location.origin);
            if (url.origin === location.origin && url.pathname !== '/auth' && !url.pathname.startsWith('/auth/')) return url.pathname + url.search + url.hash;
        }
        return ['admin', 'teacher'].includes(user.role) ? '/tute_library/' : '/';
    }
    ['register', 'login'].forEach(tab => {
        $(tab + 'Tab').href = '?mode=' + tab + (params.get('next') ? '&next=' + encodeURIComponent(params.get('next')) : '');
        if (tab === mode) $(tab + 'Tab').setAttribute('aria-current', 'page');
    });
    let avatar;
    let photoPending = false;
    let currentUser;
    async function request(path, method, body) {
        const res = await fetch('/api/auth/' + path, { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to complete request. Please try again.');
        return data;
    }
    function message(text, success) { $('message').textContent = text; $('message').classList.toggle('success', !!success); }
    function initials(user) {
        const text = user.name.trim().split(/\s+/).slice(0, 2).map(s => Array.from(s)[0]).join('').toUpperCase().replace(/[<>&"']/g, '');
        return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#2563eb"/><text x="80" y="100" text-anchor="middle" font-family="sans-serif" font-size="55" fill="white">' + text + '</text></svg>');
    }
    try {
        const { user } = await request('me', 'GET'); currentUser = user;
        if (mode === 'profile') {
            if (!user) { location.replace('/auth/?mode=login&next=' + encodeURIComponent('/auth/?mode=profile')); return; }
            $('tabs').hidden = true; $('heading').textContent = 'Your profile'; $('description').textContent = 'A familiar face in your classroom.';
            $('emailField').hidden = true; $('email').required = false; $('passwordField').hidden = true; $('password').required = false;
            $('photoField').hidden = false; $('name').value = user.name; $('roleLabel').textContent = 'Account role: ' + user.role;
            $('photoPreview').src = user.avatar || initials(user); $('submit').textContent = 'Save profile'; $('footnote').textContent = 'Only administrators can change account roles.';
        } else if (user) {
            $('signedIn').hidden = false; $('continueLink').href = destination(user); $('loading').hidden = true; return;
        } else if (mode === 'login') {
            $('heading').textContent = 'Welcome back'; $('description').textContent = 'Sign in and pick up where you left off.';
            $('nameField').hidden = true; $('name').required = false; $('submit').textContent = 'Sign in ↗';
            $('password').autocomplete = 'current-password'; $('password').removeAttribute('minlength'); $('passwordHint').textContent = 'Enter your account password.';
            $('footnote').textContent = 'New here? Choose Sign up to create a student account.';
        }
        $('loading').hidden = true; $('accountForm').hidden = false;
    } catch (_) { $('loading').textContent = 'Unable to connect. Refresh this page to try again.'; return; }
    $('showPassword').addEventListener('click', () => {
        const show = $('password').type === 'password'; $('password').type = show ? 'text' : 'password';
        $('showPassword').textContent = show ? 'Hide' : 'Show'; $('showPassword').setAttribute('aria-label', show ? 'Hide password' : 'Show password'); $('showPassword').setAttribute('aria-pressed', String(show));
    });
    $('photo').addEventListener('change', async () => {
        const file = $('photo').files[0]; if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { message('Choose a PNG, JPEG, or WebP image smaller than 5 MB.'); $('photo').value = ''; return; }
        photoPending = true; $('submit').disabled = true;
        let bitmap;
        try {
            bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 192;
            const ctx = canvas.getContext('2d'); const side = Math.min(bitmap.width, bitmap.height);
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 192, 192);
            ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 192, 192);
            avatar = canvas.toDataURL('image/jpeg', .85); $('photoPreview').src = avatar; message('Photo ready. Save your profile to apply it.', true);
        } catch (_) { message('Unable to read that image. Please choose another photo.'); }
        finally { if (bitmap) bitmap.close(); photoPending = false; $('submit').disabled = false; }
    });
    $('removePhoto').addEventListener('click', () => { avatar = ''; $('photo').value = ''; $('photoPreview').src = initials(currentUser); message('Save your profile to use your initials.', true); });
    $('accountForm').addEventListener('submit', async e => {
        e.preventDefault(); if (photoPending) return; $('submit').disabled = true; message('');
        try {
            const body = mode === 'profile' ? { name: $('name').value, ...(avatar !== undefined ? { avatar } : {}) } : { name: $('name').value, email: $('email').value, password: $('password').value };
            const { user } = await request(mode === 'profile' ? 'profile' : mode, mode === 'profile' ? 'PATCH' : 'POST', body);
            if (mode === 'profile') { currentUser = user; message('Your profile has been saved.', true); }
            else location.assign(destination(user));
        } catch (err) { message(err.message); }
        finally { $('submit').disabled = false; }
    });
})();
