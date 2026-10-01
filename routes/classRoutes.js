const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// GET /api/classes         — list all class blueprints
// POST /api/classes        — upsert a class blueprint
router.route('/')
    .get(classController.getAllClasses)
    .post(classController.upsertClass);

// GET /api/classes/:classId — get single class blueprint
router.route('/:classId')
    .get(classController.getClass);

module.exports = router;
