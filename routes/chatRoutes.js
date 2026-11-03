const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireRole, asyncRoute } = require('../middleware/auth');
const Session = require('../models/Session');
router.use(require('../middleware/participant')());
router.use('/:sessionId', asyncRoute(async (req, res, next) => {
    if (!req.user || req.user.role === 'student') {
        const joined = await Session.exists({ sessionId: req.params.sessionId, 'participants.studentId': req.body.studentId });
        if (!joined) return res.status(403).json({ error: 'Join this session before opening its chat.' });
    }
    next();
}));

// GET  /api/chat/:sessionId            — fetch messages (poll, supports ?after=ISO)
// POST /api/chat/:sessionId            — student sends a message
router.route('/:sessionId')
    .get(chatController.getMessages)
    .post(chatController.sendMessage);

// DELETE /api/chat/:sessionId/:messageId  — teacher soft-deletes a message
router.delete('/:sessionId/:messageId', requireRole('teacher', 'admin'), chatController.deleteMessage);

// GET /api/chat/:sessionId/export         — teacher exports full chat log
router.get('/:sessionId/export', requireRole('teacher', 'admin'), chatController.exportMessages);

module.exports = router;
