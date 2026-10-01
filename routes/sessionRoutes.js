const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// GET /api/sessions          — list all
// POST /api/sessions         — create new
router.route('/')
    .get(sessionController.getAllSessions)
    .post(sessionController.createSession);

// GET    /api/sessions/:sessionId  — fetch one
// PUT    /api/sessions/:sessionId  — update (fields or isOpen toggle)
// DELETE /api/sessions/:sessionId  — delete
router.route('/:sessionId')
    .get(sessionController.getSession)
    .put(sessionController.updateSession)
    .delete(sessionController.deleteSession);

// POST /api/sessions/:sessionId/join — student joins (validates window, records name)
router.post('/:sessionId/join', sessionController.joinSession);

// POST /api/sessions/:sessionId/ping — presence heartbeat
router.post('/:sessionId/ping', sessionController.pingSession);

// POST /api/sessions/:sessionId/response — record checkpoint answer
router.post('/:sessionId/response', sessionController.recordResponse);

module.exports = router;
