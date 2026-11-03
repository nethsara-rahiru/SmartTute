const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireRole } = require('../middleware/auth');
const teacher = requireRole('teacher', 'admin');
const participant = require('../middleware/participant');

// GET /api/sessions          — list all
// POST /api/sessions         — create new
router.route('/')
    .get(teacher, sessionController.getAllSessions)
    .post(teacher, sessionController.createSession);

// GET    /api/sessions/:sessionId  — fetch one
// PUT    /api/sessions/:sessionId  — update (fields or isOpen toggle)
// DELETE /api/sessions/:sessionId  — delete
router.route('/:sessionId')
    .get(sessionController.getSession)
    .put(teacher, sessionController.updateSession)
    .delete(teacher, sessionController.deleteSession);

// POST /api/sessions/:sessionId/join — student joins (validates window, records name)
router.post('/:sessionId/join', participant(true), sessionController.joinSession);

// POST /api/sessions/:sessionId/ping — presence heartbeat
router.post('/:sessionId/ping', participant(), sessionController.pingSession);

// POST /api/sessions/:sessionId/response — record checkpoint answer
router.post('/:sessionId/response', participant(), sessionController.recordResponse);

module.exports = router;
