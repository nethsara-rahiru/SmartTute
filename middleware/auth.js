const { createHash, randomBytes } = require('node:crypto');
const AuthSession = require('../models/AuthSession');

const COOKIE = 'smarttute_session';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function readToken(req) {
    const value = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='));
    const token = value ? value.slice(COOKIE.length + 1) : '';
    return /^[a-f0-9]{64}$/.test(token) ? token : '';
}

async function issueSession(req, res, user) {
    const old = readToken(req);
    if (old) await AuthSession.deleteOne({ tokenHash: tokenHash(old) });
    const token = randomBytes(32).toString('hex');
    await AuthSession.create({ tokenHash: tokenHash(token), user: user._id, expiresAt: new Date(Date.now() + MAX_AGE) });
    res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE });
}

const loadUser = asyncRoute(async (req, res, next) => {
    const token = readToken(req);
    if (token) {
        const session = await AuthSession.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } }).populate('user');
        if (session && session.user) req.user = session.user;
    }
    next();
});

function requireUser(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    next();
}

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to do that.' });
    next();
};

function sameOrigin(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const expected = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
    if (req.get('origin') !== expected || req.get('sec-fetch-site') === 'cross-site') {
        return res.status(403).json({ error: 'Please submit this request from SmartTute.' });
    }
    next();
}

const publicUser = user => ({ id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar });
module.exports = { COOKIE, cookieOptions, tokenHash, readToken, asyncRoute, issueSession, loadUser, requireUser, requireRole, sameOrigin, publicUser };
