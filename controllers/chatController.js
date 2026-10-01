const ChatMessage = require('../models/ChatMessage');
const Session = require('../models/Session');

/* ─── Size guard — base64 payload limit ─────────────────── */
// ~5 MB base64 ≈ 6.67 MB raw binary; images are compressed client-side before upload
const MAX_PAYLOAD_BYTES = 7 * 1024 * 1024; // 7 MB

function payloadTooLarge(dataUri = '') {
    return dataUri.length > MAX_PAYLOAD_BYTES;
}

/* ─── GET /api/chat/:sessionId ──────────────────────────── */
// Returns up to 200 most recent non-deleted messages.
// Client polls this every 3 s.  Supply ?after=<ISO timestamp> to get only new messages.
exports.getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const after = req.query.after ? new Date(req.query.after) : null;

        const filter = { sessionId, deleted: false };
        if (after && !isNaN(after.getTime())) {
            filter.createdAt = { $gt: after };
        }

        const messages = await ChatMessage.find(filter)
            .sort({ createdAt: 1 })
            .limit(200)
            .lean();

        res.json({ messages, serverTime: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/chat/:sessionId ─────────────────────────── */
exports.sendMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { studentId, studentName, type = 'text', text, imageData, imageCaption, audioData, audioDuration } = req.body;

        if (!studentId || !studentName) {
            return res.status(400).json({ error: 'studentId and studentName are required.' });
        }

        // Validate session exists
        const session = await Session.findOne({ sessionId }).lean();
        if (!session) return res.status(404).json({ error: 'Session not found.' });

        // Validate payload
        if (type === 'text') {
            if (!text || !String(text).trim()) {
                return res.status(400).json({ error: 'Message text cannot be empty.' });
            }
        } else if (type === 'image') {
            if (!imageData) return res.status(400).json({ error: 'imageData is required for image messages.' });
            if (payloadTooLarge(imageData)) return res.status(413).json({ error: 'Image is too large. Please send a smaller image (max ~5 MB).' });
        } else if (type === 'voice') {
            if (!audioData) return res.status(400).json({ error: 'audioData is required for voice messages.' });
            if (payloadTooLarge(audioData)) return res.status(413).json({ error: 'Audio clip is too large (max ~5 MB).' });
        } else {
            return res.status(400).json({ error: 'Invalid message type.' });
        }

        const msg = await ChatMessage.create({
            sessionId,
            studentId: String(studentId).trim(),
            studentName: String(studentName).trim().slice(0, 80),
            type,
            text: type === 'text' ? String(text).trim().slice(0, 2000) : '',
            imageData: type === 'image' ? imageData : '',
            imageCaption: type === 'image' ? String(imageCaption || '').trim().slice(0, 200) : '',
            audioData: type === 'voice' ? audioData : '',
            audioDuration: type === 'voice' ? Number(audioDuration) || 0 : 0,
        });

        res.status(201).json({ message: msg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── DELETE /api/chat/:sessionId/:messageId (teacher moderation) ─ */
exports.deleteMessage = async (req, res) => {
    try {
        const { sessionId, messageId } = req.params;
        const msg = await ChatMessage.findOneAndUpdate(
            { _id: messageId, sessionId },
            { $set: { deleted: true } },
            { new: true }
        );
        if (!msg) return res.status(404).json({ error: 'Message not found.' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── GET /api/chat/:sessionId/export — full export for teacher ─ */
exports.exportMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await ChatMessage.find({ sessionId })
            .sort({ createdAt: 1 })
            .lean();
        res.json({ sessionId, count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
