const mongoose = require('mongoose');
const { createHash } = require('node:crypto');
const { asyncRoute } = require('./auth');
const Counter = mongoose.model('AuthRateLimit', new mongoose.Schema({
    key: { type: String, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, index: { expires: 0 } }
}));

// Mongo-backed counters work across app instances and survive server restarts.
module.exports = asyncRoute(async (req, res, next) => {
    const windowMs = 15 * 60 * 1000;
    const bucket = Math.floor(Date.now() / windowMs);
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    for (const [identity, max] of [[`ip:${req.ip}`, 100], [`email:${email}`, 15]]) {
        const key = createHash('sha256').update(`${identity}:${bucket}`).digest('hex');
        const counter = await Counter.findOneAndUpdate({ key }, {
            $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) }
        }, { upsert: true, new: true });
        if (counter.count > max) {
            res.set('Retry-After', String(Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000)));
            return res.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
        }
    }
    next();
});
