(function () {
    'use strict';
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = '/auth/auth.css'; document.head.append(link);
    const current = location.pathname + location.search;
    const signup = '/auth/?mode=register&next=' + encodeURIComponent(current);
    const login = '/auth/?mode=login&next=' + encodeURIComponent(current);
    function avatar(user) {
        if (user.avatar) return user.avatar;
        const initials = user.name.trim().split(/\s+/).slice(0, 2).map(s => Array.from(s)[0]).join('').toUpperCase().replace(/[<>&"']/g, '');
        return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#3658ee"/><text x="80" y="96" font-family="sans-serif" font-size="52" text-anchor="middle" fill="white">' + initials + '</text></svg>');
    }
    window.SmartTuteAccount = { avatar };
    async function mount() {
        let user;
        try {
            const response = await fetch('/api/auth/me', { cache: 'no-store' });
            if (!response.ok) throw new Error();
            user = (await response.json()).user;
        } catch (_) { return; }
        const host = document.createElement('div'); host.className = 'st-account';
        const nav = document.querySelector('header .nav');
        const slot = document.querySelector('[data-account-slot]');
        const old = document.querySelector('#accountButton');
        if (slot) slot.append(host);
        else if (nav) nav.insertBefore(host, nav.querySelector('.menu'));
        else if (old) { host.classList.add('st-rail-account'); old.replaceWith(host); }
        else { host.classList.add('st-floating-account'); document.body.append(host); }
        if (!user) {
            const a = document.createElement('a'); a.href = signup; a.textContent = 'Sign up'; a.className = 'st-signup'; host.append(a); return;
        }
        const nameInput = document.querySelector('#studentNameInput');
        if (nameInput) { nameInput.value = user.name; nameInput.readOnly = true; }
        const footerName = document.querySelector('.menu-footer strong');
        const footerRole = document.querySelector('.menu-footer small');
        if (footerName) footerName.textContent = user.name;
        if (footerRole) footerRole.textContent = user.role;
        document.querySelectorAll('.side-menu a').forEach(a => {
            if (a.textContent.trim() === 'Profile') a.href = '/auth/?mode=profile';
        });
        const button = document.createElement('button'); button.className = 'st-avatar-button'; button.type = 'button';
        button.setAttribute('aria-label', 'Open profile for ' + user.name); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'st-account-menu');
        const img = document.createElement('img'); img.src = avatar(user); img.alt = ''; img.className = 'st-avatar'; button.append(img);
        const panel = document.createElement('div'); panel.className = 'st-account-menu'; panel.id = 'st-account-menu'; panel.hidden = true;
        const name = document.createElement('strong'); name.textContent = user.name;
        const role = document.createElement('small'); role.textContent = user.role[0].toUpperCase() + user.role.slice(1);
        panel.append(name, role);
        function item(text, href) { const a = document.createElement('a'); a.textContent = text; a.href = href; panel.append(a); }
        item('Your profile', '/auth/?mode=profile');
        if (user.role === 'admin') item('Manage accounts', '/admin/');
        if (['teacher', 'admin'].includes(user.role)) item('Teacher workspace', '/tute_library/');
        item('Join a class', '/live_class/');
        const logout = document.createElement('button'); logout.textContent = 'Sign out'; logout.type = 'button';
        const error = document.createElement('p'); error.setAttribute('role', 'status'); panel.append(logout, error);
        logout.addEventListener('click', async () => {
            logout.disabled = true;
            try {
                const res = await fetch('/api/auth/logout', { method: 'POST' });
                if (!res.ok) throw new Error();
                location.assign('/');
            } catch (_) { error.textContent = 'Unable to sign out. Please try again.'; logout.disabled = false; }
        });
        function close() { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); }
        button.addEventListener('click', () => { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); });
        document.addEventListener('click', e => { if (!host.contains(e.target)) close(); });
        host.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); button.focus(); } });
        host.addEventListener('focusout', e => { if (!host.contains(e.relatedTarget)) close(); });
        host.append(button, panel);
        window.dispatchEvent(new CustomEvent('smarttute:account', { detail: user }));
    }
    mount();
})();
