const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { requireRole, asyncRoute, publicUser } = require('../middleware/auth');
const router = express.Router();
router.use(requireRole('admin'));
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/users', asyncRoute(async (req, res) => {
    // Exact email search avoids exposing an unbounded directory of students.
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    if (!email || email.length > 254) return res.status(400).json({ error: 'Enter the account’s exact email address.' });
    const users = await User.find({ email });
    res.json({ users: users.map(publicUser) });
}));
router.patch('/users/:id/role', asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id) || !['student', 'teacher'].includes(req.body.role)) {
        return res.status(400).json({ error: 'Choose student or teacher.' });
    }
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'admin' } },
        { $set: { role: req.body.role } }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Student or teacher account not found. Admin accounts cannot be changed here.' });
    res.json({ user: publicUser(user) });
}));
module.exports = router;
