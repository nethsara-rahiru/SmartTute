const express = require('express');
const router = express.Router();
const tuteController = require('../controllers/tuteController');

// Routes for /api/tutes
router.route('/')
    .post(tuteController.createTute)
    .get(tuteController.getAllTutes);

// Routes for /api/tutes/:id
router.route('/:id')
    .get(tuteController.getTuteById)
    .put(tuteController.updateTute)
    .delete(tuteController.deleteTute);

module.exports = router;
