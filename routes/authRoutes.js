const express = require('express');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const { hashPassword, verifyPassword } = require('../services/passwords');
const { asyncRoute, requireUser, issueSession, publicUser, readToken, tokenHash, COOKIE, cookieOptions } = require('../middleware/auth');
const rateLimit = require('../middleware/authRateLimit');
const router = express.Router();
const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validPassword = value => typeof value === 'string' && value.length >= 10 && Buffer.byteLength(value) <= 256;
// A fixed dummy hash keeps unknown-email requests on the password-derivation path too.
const dummyHash = '00000000000000000000000000000000:' + '00'.repeat(64);

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));

router.post('/register', rateLimit, asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !validPassword(req.body.password)) {
        return res.status(400).json({ error: 'Enter your name, a valid email, and a password of 10–256 bytes.' });
    }
    const passwordHash = await hashPassword(req.body.password);
    let user;
    try {
        // Explicit allowlist: clients can never assign roles or password hashes.
        user = await User.create({ name, email, passwordHash, role: 'student' });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
        throw err;
    }
    await issueSession(req, res, user);
    res.status(201).json({ user: publicUser(user) });
}));

router.post('/login', rateLimit, asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (typeof req.body.password !== 'string' || Buffer.byteLength(req.body.password) > 256) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = await verifyPassword(req.body.password, user ? user.passwordHash : dummyHash);
    if (!user || !valid) return res.status(401).json({ error: 'Email or password is incorrect.' });
    await issueSession(req, res, user);
    res.json({ user: publicUser(user) });
}));

router.post('/logout', asyncRoute(async (req, res) => {
    const token = readToken(req);
    if (token) await AuthSession.deleteOne({ tokenHash: tokenHash(token) });
    res.clearCookie(COOKIE, cookieOptions());
    res.json({ ok: true });
}));

function validAvatar(value) {
    if (value === '') return true;
    if (typeof value !== 'string' || value.length > 350000) return false;
    const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 256 * 1024) return false;
    if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
    if (match[1] === 'jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}

router.patch('/profile', requireUser, asyncRoute(async (req, res) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 80) return res.status(400).json({ error: 'Name must be between 1 and 80 characters.' });
    if (req.body.avatar !== undefined && !validAvatar(req.body.avatar)) {
        return res.status(400).json({ error: 'Choose a PNG, JPEG, or WebP photo under 256 KB.' });
    }
    req.user.name = name;
    if (req.body.avatar !== undefined) req.user.avatar = req.body.avatar;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
}));

module.exports = router;
