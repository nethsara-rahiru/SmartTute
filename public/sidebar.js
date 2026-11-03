(function () {
    'use strict';
    // The shared request is reused by the account widget on the same page.
    function session() {
        return fetch('/api/auth/me', { cache: 'no-store' }).then(res => {
            if (!res.ok) throw new Error('Unable to load your menu.');
            return res.json();
        });
    }
    window.SmartTuteSession = session();
    const dialog = document.createElement('dialog');
    dialog.className = 'st-sidebar'; dialog.id = 'stSidebar'; dialog.setAttribute('aria-labelledby', 'stSidebarTitle');
    dialog.innerHTML = '<div class="st-sidebar-heading"><a href="/" class="st-sidebar-brand"><span>S</span><strong id="stSidebarTitle">SmartTute</strong></a><button type="button" class="st-sidebar-close" aria-label="Close sidebar">×</button></div><nav class="st-sidebar-links" aria-label="Main navigation"><p role="status">Loading navigation…</p></nav><div class="st-sidebar-footer"></div>';
    document.body.append(dialog);
    let trigger = document.querySelector('[data-sidebar-trigger]');
    if (!trigger) {
        trigger = document.createElement('button');
        trigger.type = 'button'; trigger.className = 'st-nav-trigger'; trigger.textContent = '☰';
        const header = document.querySelector('header .nav') || document.querySelector('header');
        if (header) { header.classList.add('st-header-with-sidebar'); header.prepend(trigger); }
        else { trigger.classList.add('st-nav-floating'); document.body.append(trigger); }
    }
    trigger.classList.add('st-nav-trigger');
    trigger.replaceChildren(...Array.from({ length: 3 }, () => {
        const line = document.createElement('i'); line.setAttribute('aria-hidden', 'true'); return line;
    }));
    trigger.setAttribute('aria-label', 'Open sidebar'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', dialog.id);
    trigger.addEventListener('click', () => { dialog.showModal(); trigger.setAttribute('aria-expanded', 'true'); });
    dialog.querySelector('.st-sidebar-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); });
    dialog.addEventListener('click', e => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    const links = dialog.querySelector('.st-sidebar-links');
    async function render() {
        try {
            const { user, navigation } = await window.SmartTuteSession;
            links.replaceChildren();
            for (const item of navigation) {
                const a = document.createElement('a'); a.href = item.href;
                const icon = document.createElement('span'); icon.className = 'st-sidebar-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = item.icon;
                const text = document.createElement('span'); text.textContent = item.label; a.append(icon, text);
                const target = new URL(item.href, location.origin);
                const here = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
                const there = target.pathname.replace(/\/$/, '') || '/';
                const matchesMode = target.pathname.startsWith('/auth/') ? new URLSearchParams(location.search).get('mode') === target.searchParams.get('mode') : true;
                if (here === there && matchesMode) a.setAttribute('aria-current', 'page');
                links.append(a);
            }
            const footer = dialog.querySelector('.st-sidebar-footer'); footer.replaceChildren();
            const name = document.createElement('strong'); name.textContent = user ? user.name : 'Welcome to SmartTute';
            const role = document.createElement('small'); role.textContent = user ? user.role[0].toUpperCase() + user.role.slice(1) : 'Sign in to see your workspace';
            footer.append(name, role);
        } catch (_) {
            links.replaceChildren(); const message = document.createElement('p'); message.textContent = 'Unable to load navigation.';
            const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try again';
            retry.addEventListener('click', () => { window.SmartTuteSession = session(); render(); }); links.append(message, retry);
        }
    }
    render();
})();
