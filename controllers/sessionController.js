const Session = require('../models/Session');

/* ─── Helpers ─────────────────────────────────────────── */
function generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'ST-';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

/**
 * Returns true if the session is currently joinable, plus a reason if not.
 * @returns {{ ok: boolean, reason?: string }}
 */
function isSessionJoinable(session) {
    const now = Date.now();

    if (session.mode === 'open_anytime') {
        if (!session.isOpen) {
            return { ok: false, reason: 'This class is currently closed. Please wait for your teacher to open it.' };
        }
        if (session.openFrom && now < new Date(session.openFrom).getTime()) {
            return { ok: false, reason: 'This class is not open yet. It opens on ' + new Date(session.openFrom).toLocaleString() + '.' };
        }
        if (session.openUntil && now > new Date(session.openUntil).getTime()) {
            return { ok: false, reason: 'This class has ended. The open period closed on ' + new Date(session.openUntil).toLocaleString() + '.' };
        }
        return { ok: true };
    }

    // scheduled mode
    const start = new Date(session.startAt).getTime();
    if (isNaN(start)) return { ok: false, reason: 'This session has an invalid start time.' };

    const waitMs = Math.max(1, Number(session.waitingPeriodMinutes) || 15) * 60 * 1000;
    const closeTime = start + waitMs;

    if (now < start) {
        const mins = Math.ceil((start - now) / 60000);
        return {
            ok: false,
            reason: 'This session has not started yet. Come back in about ' + mins + ' minute(s) (starts ' + new Date(start).toLocaleString() + ').'
        };
    }
    if (now > closeTime) {
        return {
            ok: false,
            reason: 'The join window has closed. Students cannot join more than ' + (session.waitingPeriodMinutes || 15) + ' minutes after the session start.'
        };
    }
    return {
        ok: true,
        elapsedSec: Math.max(0, Math.floor((now - start) / 1000))
    };
}

/* ─── GET /api/sessions ───────────────────────────────── */
exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find({}).sort({ publishedAt: -1 }).lean();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/sessions ──────────────────────────────── */
exports.createSession = async (req, res) => {
    try {
        const body = req.body;
        if (!body.classId) return res.status(400).json({ error: 'classId is required.' });

        // Generate a unique session ID (retry on collision)
        let sessionId = body.sessionId || generateSessionId();
        let attempts = 0;
        while (await Session.exists({ sessionId }) && attempts < 5) {
            sessionId = generateSessionId();
            attempts++;
        }

        const session = await Session.create({ ...body, sessionId });
        res.status(201).json(session);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Session ID already exists.' });
        res.status(500).json({ error: err.message });
    }
};

/* ─── GET /api/sessions/:sessionId ───────────────────── */
exports.getSession = async (req, res) => {
    try {
        const session = await Session.findOne({ sessionId: req.params.sessionId }).lean();
        if (!session) return res.status(404).json({ error: 'Session not found.' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── PUT /api/sessions/:sessionId ───────────────────── */
exports.updateSession = async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { sessionId: req.params.sessionId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found.' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── DELETE /api/sessions/:sessionId ────────────────── */
exports.deleteSession = async (req, res) => {
    try {
        const result = await Session.findOneAndDelete({ sessionId: req.params.sessionId });
        if (!result) return res.status(404).json({ error: 'Session not found.' });
        res.json({ message: 'Session deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/sessions/:sessionId/join ─────────────── */
exports.joinSession = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Please enter your name before joining.' });
        }

        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found. Check the ID and try again.' });

        const joinable = isSessionJoinable(session);
        if (!joinable.ok) return res.status(403).json({ error: joinable.reason });

        // Record participant
        session.participants.push({ name: String(name).trim(), joinedAt: new Date() });
        await session.save();

        // Return session data (without participant list for privacy, include elapsedSec for sync mode)
        const sessionData = session.toObject();
        delete sessionData.participants;

        res.json({
            session: sessionData,
            elapsedSec: joinable.elapsedSec || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
