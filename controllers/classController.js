const ClassBlueprint = require('../models/ClassBlueprint');

/* ─── GET /api/classes ────────────────────────────────── */
exports.getAllClasses = async (req, res) => {
    try {
        const classes = await ClassBlueprint.find({}).sort({ publishedAt: -1 }).lean();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── POST /api/classes  (upsert by classId) ─────────── */
exports.upsertClass = async (req, res) => {
    try {
        const body = req.body;
        if (!body.classId) return res.status(400).json({ error: 'classId is required.' });

        const cls = await ClassBlueprint.findOneAndUpdate(
            { classId: body.classId },
            { $set: body },
            { new: true, upsert: true, runValidators: false }
        );
        res.status(200).json(cls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ─── GET /api/classes/:classId ──────────────────────── */
exports.getClass = async (req, res) => {
    try {
        const cls = await ClassBlueprint.findOne({ classId: req.params.classId }).lean();
        if (!cls) return res.status(404).json({ error: 'Class not found.' });
        res.json(cls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
