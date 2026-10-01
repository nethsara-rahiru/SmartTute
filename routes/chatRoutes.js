const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// GET  /api/chat/:sessionId            — fetch messages (poll, supports ?after=ISO)
// POST /api/chat/:sessionId            — student sends a message
router.route('/:sessionId')
    .get(chatController.getMessages)
    .post(chatController.sendMessage);

// DELETE /api/chat/:sessionId/:messageId  — teacher soft-deletes a message
router.delete('/:sessionId/:messageId', chatController.deleteMessage);

// GET /api/chat/:sessionId/export         — teacher exports full chat log
router.get('/:sessionId/export', chatController.exportMessages);

module.exports = router;
