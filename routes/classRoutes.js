const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { requireRole } = require('../middleware/auth');

// GET /api/classes         — list all class blueprints
// POST /api/classes        — upsert a class blueprint
router.route('/')
    .get(requireRole('teacher', 'admin'), classController.getAllClasses)
    .post(requireRole('teacher', 'admin'), classController.upsertClass);

// GET /api/classes/:classId — get single class blueprint
router.route('/:classId')
    .get(classController.getClass);

module.exports = router;
