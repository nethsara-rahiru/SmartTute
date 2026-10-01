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
        const { name, studentId: reqStudentId } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Please enter your name before joining.' });
        }

        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found. Check the ID and try again.' });

        const joinable = isSessionJoinable(session);
        if (!joinable.ok) return res.status(403).json({ error: joinable.reason });

        const studentId = reqStudentId || ('stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

        let participant = session.participants.find(p => p.studentId === studentId);
        if (participant) {
            participant.name = String(name).trim();
            participant.lastSeen = new Date();
        } else {
            session.participants.push({
                studentId,
                name: String(name).trim(),
                joinedAt: new Date(),
                lastSeen: new Date(),
                checkpoints: {}
            });
        }
        await session.save();

        const sessionData = session.toObject();
        delete sessionData.participants;

        res.json({
            session: sessionData,
            studentId,
            elapsedSec: joinable.elapsedSec || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/sessions/:sessionId/ping ─────────────── */
exports.pingSession = async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ error: 'studentId is required.' });

        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found.' });

        const participant = session.participants.find(p => p.studentId === studentId);
        if (participant) {
            participant.lastSeen = new Date();
            await session.save();
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/sessions/:sessionId/response ─────────── */
exports.recordResponse = async (req, res) => {
    try {
        const { studentId, cpId, status, isCorrect, timeTaken } = req.body;
        if (!studentId || !cpId) {
            return res.status(400).json({ error: 'studentId and cpId are required.' });
        }

        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found.' });

        let participant = session.participants.find(p => p.studentId === studentId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not registered in this session.' });
        }

        participant.lastSeen = new Date();
        if (!participant.checkpoints) participant.checkpoints = new Map();

        participant.checkpoints.set(cpId, {
            status: status || 'answered',
            isCorrect: Boolean(isCorrect),
            timeTaken: Number(timeTaken) || 0
        });

        await session.save();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

