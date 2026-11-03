(function () {
    'use strict';
    let saved;
    try { saved = localStorage.getItem('smarttute_theme') || localStorage.getItem('theme'); } catch (_) {}
    document.body.classList.toggle('dark-mode', saved === 'dark');
    const header = document.querySelector('header .nav') || document.querySelector('header');
    if (!header) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'st-theme-toggle';
    function update() {
        const dark = document.body.classList.contains('dark-mode');
        button.textContent = dark ? '☾' : '☼';
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    button.addEventListener('click', () => {
        const dark = document.body.classList.toggle('dark-mode');
        try { localStorage.setItem('smarttute_theme', dark ? 'dark' : 'light'); localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (_) {}
        update();
    });
    update(); header.insertBefore(button, header.querySelector('.menu') || header.querySelector('[data-account-slot]'));
    window.addEventListener('storage', e => { if (['smarttute_theme', 'theme'].includes(e.key)) { document.body.classList.toggle('dark-mode', e.newValue === 'dark'); update(); } });
})();
