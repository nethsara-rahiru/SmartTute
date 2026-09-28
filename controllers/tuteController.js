const Tute = require('../modules/tuteModule');

// Save a new Tute worksheet
exports.createTute = async (req, res) => {
    try {
        const tute = new Tute(req.body);
        const savedTute = await tute.save();
        res.status(201).json({ success: true, data: savedTute });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all Tute worksheets
exports.getAllTutes = async (req, res) => {
    try {
        const tutes = await Tute.find().sort({ updatedAt: -1 });
        res.status(200).json({ success: true, count: tutes.length, data: tutes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get a single Tute worksheet by ID
exports.getTuteById = async (req, res) => {
    try {
        const tute = await Tute.findById(req.params.id);
        if (!tute) {
            return res.status(404).json({ success: false, error: 'Tute not found' });
        }
        res.status(200).json({ success: true, data: tute });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update an existing Tute worksheet by ID
exports.updateTute = async (req, res) => {
    try {
        const tute = await Tute.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!tute) {
            return res.status(404).json({ success: false, error: 'Tute not found' });
        }
        res.status(200).json({ success: true, data: tute });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete a Tute worksheet by ID
exports.deleteTute = async (req, res) => {
    try {
        const tute = await Tute.findByIdAndDelete(req.params.id);
        if (!tute) {
            return res.status(404).json({ success: false, error: 'Tute not found' });
        }
        res.status(200).json({ success: true, message: 'Tute deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
