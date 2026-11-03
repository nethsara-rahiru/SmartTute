const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { once } = require('node:events');
const app = require('../server');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const LessonSession = require('../models/Session');
const { COOKIE, tokenHash } = require('../middleware/auth');
let server, origin;
before(async () => {
    // Tests always use their own local disposable database, never CONNECTION_STRING.
    await mongoose.connect(`mongodb://127.0.0.1:27017/SmartTute_auth_test_${process.pid}`);
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
async function request(path, { method = 'GET', cookie, body, requestOrigin = origin } = {}) {
    const response = await fetch(origin + path, { method, redirect: 'manual', headers: {
        ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}),
        ...(!['GET', 'HEAD'].includes(method) ? { origin: requestOrigin } : {})
    }, body: body ? JSON.stringify(body) : undefined });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch (_) { data = text; }
    return { status: response.status, data, headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const credentials = { name: 'Ayesha Student', email: 'ayesha@example.test', password: 'a-long-test-password' };
let studentCookie, adminCookie, studentId;
test('registration ignores supplied roles and hashes credentials; returns a secure session', async () => {
    const response = await request('/api/auth/register', { method: 'POST', body: { ...credentials, role: 'admin', passwordHash: 'forged' } });
    assert.equal(response.status, 201); assert.equal(response.data.user.role, 'student'); assert(!('passwordHash' in response.data.user));
    assert.match(response.headers.get('set-cookie'), /HttpOnly/); assert.match(response.headers.get('set-cookie'), /SameSite=Lax/);
    studentCookie = response.cookie; studentId = response.data.user.id;
    const user = await User.findById(studentId).select('+passwordHash'); assert.notEqual(user.passwordHash, credentials.password);
    const token = studentCookie.slice(COOKIE.length + 1); const session = await AuthSession.findOne({ user: studentId });
    assert.notEqual(session.tokenHash, token); assert.equal(session.tokenHash, tokenHash(token));
});
test('invalid passwords, duplicate accounts, wrong login and cross-origin writes are rejected', async () => {
    assert.equal((await request('/api/auth/register', { method: 'POST', body: { ...credentials, email: 'short@example.test', password: 'short' } })).status, 400);
    assert.equal((await request('/api/auth/register', { method: 'POST', body: credentials })).status, 409);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: credentials.email, password: 'incorrect' } })).status, 401);
    assert.equal((await request('/api/auth/register', { method: 'POST', requestOrigin: 'https://other.example', body: credentials })).status, 403);
});
test('students cannot visit teacher tools, write classes, list accounts, or assign themselves roles', async () => {
    assert.equal((await request('/tute_library/')).status, 302);
    assert.equal((await request('/tute_library/', { cookie: studentCookie })).status, 403);
    assert.equal((await request('/api/classes', { method: 'POST', cookie: studentCookie, body: { classId: 'bad' } })).status, 403);
    assert.equal((await request('/api/admin/users?email=' + credentials.email, { cookie: studentCookie })).status, 403);
    assert.equal((await request('/api/admin/users/' + studentId + '/role', { method: 'PATCH', cookie: studentCookie, body: { role: 'teacher' } })).status, 403);
    const profile = await request('/api/auth/profile', { method: 'PATCH', cookie: studentCookie, body: { name: 'Ayesha', role: 'admin' } });
    assert.equal(profile.status, 200); assert.equal(profile.data.user.role, 'student');
});
test('every teacher/admin page and encoded URL rejects students and anonymous visitors', async () => {
    const { teacherSections } = require('../services/pageAccess');
    for (const section of [...teacherSections, 'admin']) {
        for (const path of [`/${section}/`, `/${section}/index.html`, `/%${section.charCodeAt(0).toString(16)}${section.slice(1)}/index.html`]) {
            const denied = await request(path, { cookie: studentCookie });
            assert.equal(denied.status, 403, path);
            assert.match(denied.data, /Access restricted/);
            assert.equal((await request(path)).status, 302, `anonymous ${path}`);
        }
    }
    for (const path of ['/', '/auth/?mode=profile', '/live_class/']) {
        assert.equal((await request(path, { cookie: studentCookie })).status, 200, path);
    }
    for (const path of ['/api/tutes', '/api/classes', '/api/sessions', '/api/admin/users?email=test@example.test']) {
        assert.equal((await request(path, { cookie: studentCookie })).status, 403, path);
    }
    const me = await request('/api/auth/me', { cookie: studentCookie });
    assert.deepEqual(me.data.allowedSections, ['', 'index.html', 'auth', 'live_class']);
    assert.deepEqual(me.data.navigation.map(item => item.label), ['Home', 'Your profile']);
    const { navigationFor } = require('../services/pageAccess');
    const teacherNavigation = navigationFor({ role: 'teacher' });
    assert(!teacherNavigation.some(item => ['tute_lab', 'class_organizer', 'session_scheduler', 'live_class', 'admin'].includes(item.section)));
    assert(navigationFor({ role: 'admin' }).some(item => item.section === 'admin'));
});
test('profile photos are validated and persisted without allowing script-based images', async () => {
    assert.equal((await request('/api/auth/profile', { method: 'PATCH', cookie: studentCookie, body: { name: 'Ayesha', avatar: 'data:image/svg+xml,<svg onload="alert(1)"/>' } })).status, 400);
    const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=';
    const updated = await request('/api/auth/profile', { method: 'PATCH', cookie: studentCookie, body: { name: 'Ayesha', avatar } });
    assert.equal(updated.status, 200); assert.equal(updated.data.user.avatar, avatar);
    assert.equal((await request('/api/auth/me', { cookie: studentCookie })).data.user.avatar, avatar);
});
test('only admins promote students; changes take effect in an existing session; demotion revokes access', async () => {
    const registered = await request('/api/auth/register', { method: 'POST', body: { ...credentials, email: 'admin@example.test' } });
    await User.updateOne({ _id: registered.data.user.id }, { $set: { role: 'admin' } }); adminCookie = registered.cookie;
    const found = await request('/api/admin/users?email=' + credentials.email, { cookie: adminCookie });
    assert.equal(found.status, 200); assert.equal(found.data.users[0].id, studentId);
    const promoted = await request('/api/admin/users/' + studentId + '/role', { method: 'PATCH', cookie: adminCookie, body: { role: 'teacher' } });
    assert.equal(promoted.status, 200); assert.equal(promoted.data.user.role, 'teacher');
    assert.equal((await request('/tute_library/', { cookie: studentCookie })).status, 200);
    assert.equal((await request('/api/classes', { cookie: studentCookie })).status, 200);
    assert.equal((await request('/api/admin/users?email=' + credentials.email, { cookie: studentCookie })).status, 403);
    assert.equal((await request('/api/admin/users/' + studentId + '/role', { method: 'PATCH', cookie: adminCookie, body: { role: 'admin' } })).status, 400);
    assert.equal((await request('/api/admin/users/' + registered.data.user.id + '/role', { method: 'PATCH', cookie: adminCookie, body: { role: 'student' } })).status, 404);
    await request('/api/admin/users/' + studentId + '/role', { method: 'PATCH', cookie: adminCookie, body: { role: 'student' } });
    assert.equal((await request('/tute_library/', { cookie: studentCookie })).status, 403);
});
test('student attendance uses account identity and does not expose the participant list', async () => {
    await LessonSession.create({ sessionId: 'AUTH-TEST', classId: 'TEST-CLASS', mode: 'open_anytime', isOpen: true });
    const joined = await request('/api/sessions/AUTH-TEST/join', { method: 'POST', cookie: studentCookie, body: { studentId: 'someone-else', name: 'Forged name' } });
    assert.equal(joined.status, 200); assert.equal(joined.data.studentId, studentId);
    const session = await LessonSession.findOne({ sessionId: 'AUTH-TEST' }); assert.equal(session.participants[0].name, 'Ayesha');
    const fetched = await request('/api/sessions/AUTH-TEST', { cookie: studentCookie }); assert.equal(fetched.status, 200); assert(!('participants' in fetched.data));
    const ping = await request('/api/sessions/AUTH-TEST/ping', { method: 'POST', cookie: studentCookie, body: { studentId: 'someone-else' } }); assert.equal(ping.status, 200);
});
test('chat identity cannot be forged and students cannot moderate or export chat', async () => {
    const sent = await request('/api/chat/AUTH-TEST', { method: 'POST', cookie: studentCookie, body: { studentId: 'forged', studentName: 'Admin', type: 'text', text: 'Hello' } });
    assert.equal(sent.status, 201); assert.equal(sent.data.message.studentId, studentId); assert.equal(sent.data.message.studentName, 'Ayesha');
    assert.equal((await request('/api/chat/AUTH-TEST/export', { cookie: studentCookie })).status, 403);
    assert.equal((await request('/api/chat/AUTH-TEST/' + sent.data.message._id, { method: 'DELETE', cookie: studentCookie })).status, 403);
});
test('login rotates the session, logout revokes it, and expired tokens cannot authenticate', async () => {
    const loggedIn = await request('/api/auth/login', { method: 'POST', cookie: studentCookie, body: { email: ' AYESHA@example.test ', password: credentials.password } });
    assert.equal(loggedIn.status, 200); assert.notEqual(loggedIn.cookie, studentCookie);
    assert.equal((await request('/api/auth/me', { cookie: studentCookie })).data.user, null);
    studentCookie = loggedIn.cookie;
    assert.equal((await request('/api/auth/logout', { method: 'POST', cookie: studentCookie })).status, 200);
    assert.equal((await request('/api/auth/me', { cookie: studentCookie })).data.user, null);
    const again = await request('/api/auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } });
    await AuthSession.updateMany({ user: studentId }, { $set: { expiresAt: new Date(0) } });
    assert.equal((await request('/api/auth/me', { cookie: again.cookie })).data.user, null);
});
test('repeated login attempts are throttled', async () => {
    for (let i = 0; i < 15; i++) {
        assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: 'rate@example.test', password: 'bad-password' } })).status, 401);
    }
    const limited = await request('/api/auth/login', { method: 'POST', body: { email: 'rate@example.test', password: 'bad-password' } });
    assert.equal(limited.status, 429); assert(limited.headers.get('retry-after'));
});
