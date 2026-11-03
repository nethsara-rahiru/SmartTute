(function () {
    'use strict';
    const status = document.querySelector('#status'), result = document.querySelector('#result');
    async function api(path, options) {
        const res = await fetch('/api/admin/' + path, { cache: 'no-store', ...options }); const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to complete request.'); return data;
    }
    document.querySelector('#search').addEventListener('submit', async e => {
        e.preventDefault(); const submit = document.querySelector('#searchButton'); submit.disabled = true; result.replaceChildren(); status.textContent = 'Finding account…';
        try {
            const { users } = await api('users?email=' + encodeURIComponent(document.querySelector('#email').value.trim()));
            status.textContent = users.length ? '' : 'No account found. Ask this person to register first.';
            users.forEach(user => {
                const box = document.createElement('div'); box.className = 'user-result';
                const name = document.createElement('h2'); name.textContent = user.name;
                const email = document.createElement('small'); email.textContent = user.email + ' · ' + user.role;
                box.append(name, email); result.append(box);
                if (user.role === 'admin') { const p = document.createElement('p'); p.textContent = 'Admin accounts cannot be changed here.'; box.append(p); return; }
                const form = document.createElement('form'); const label = document.createElement('label'); label.textContent = 'Account role'; label.htmlFor = 'accountRole';
                const select = document.createElement('select'); select.id = 'accountRole';
                ['student', 'teacher'].forEach(role => { const option = document.createElement('option'); option.value = role; option.textContent = role[0].toUpperCase() + role.slice(1); select.append(option); }); select.value = user.role;
                const save = document.createElement('button'); save.className = 'primary'; save.textContent = 'Save role';
                form.append(label, select, save); box.append(form);
                form.addEventListener('submit', async event => {
                    event.preventDefault(); save.disabled = true; status.textContent = 'Saving…';
                    try { const data = await api('users/' + user.id + '/role', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: select.value }) }); email.textContent = user.email + ' · ' + data.user.role; status.textContent = 'Role updated. The new access applies immediately.'; }
                    catch (err) { status.textContent = err.message; } finally { save.disabled = false; }
                });
            });
        } catch (err) { status.textContent = err.message; } finally { submit.disabled = false; }
    });
})();
