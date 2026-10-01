const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({}, { strict: false, _id: false });

const classBlueprintSchema = new mongoose.Schema({
    classId:     { type: String, required: true, unique: true, index: true },
    title:       { type: String, default: 'Untitled Class' },
    videoId:     { type: String, default: '' },
    tuteTitle:   { type: String, default: '' },
    tuteId:      { type: String, default: '' },
    checkpoints: { type: [checkpointSchema], default: [] },
    publishedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    strict: false  // allow extra fields from Class Organizer
});

module.exports = mongoose.model('ClassBlueprint', classBlueprintSchema);
