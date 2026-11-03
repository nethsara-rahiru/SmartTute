const { randomBytes } = require('node:crypto');
const GuestSession = require('../models/GuestSession');
const { asyncRoute, cookieOptions, tokenHash } = require('./auth');
const COOKIE = 'smarttute_guest';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Guests receive an opaque cookie. A supplied studentId can never select another participant.
module.exports = (joining = false) => asyncRoute(async (req, res, next) => {
    if (req.user) {
        req.body.studentId = String(req.user._id);
        req.body.name = req.body.studentName = req.user.name;
        return next();
    }
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
    const token = cookie ? cookie.slice(COOKIE.length + 1) : '';
    let guest = /^[a-f0-9]{64}$/.test(token) ? await GuestSession.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } }) : null;
    if (joining) {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!name || name.length > 80) return res.status(400).json({ error: 'Please enter your name (up to 80 characters).' });
        if (!guest) {
            const newToken = randomBytes(32).toString('hex');
            guest = await GuestSession.create({ tokenHash: tokenHash(newToken), studentId: 'guest_' + randomBytes(16).toString('hex'), name, expiresAt: new Date(Date.now() + MAX_AGE) });
            res.cookie(COOKIE, newToken, { ...cookieOptions(), maxAge: MAX_AGE });
        } else { guest.name = name; await guest.save(); }
    }
    if (!guest) return res.status(401).json({ error: 'Join the session with your name first.' });
    req.body.studentId = guest.studentId;
    req.body.name = req.body.studentName = guest.name;
    next();
});
