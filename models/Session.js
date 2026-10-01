const mongoose = require('mongoose');

const checkpointResponseSchema = new mongoose.Schema({
    status: { type: String, enum: ['answered', 'not_answered'], default: 'answered' },
    isCorrect: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 }
}, { _id: false });

const participantSchema = new mongoose.Schema({
    studentId: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    checkpoints: { type: Map, of: checkpointResponseSchema, default: {} }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    classId:   { type: String, required: true },
    classTitle: { type: String, default: '' },
    title:     { type: String, default: 'Untitled Session' },

    // 'scheduled' = fixed date/time + join window
    // 'open_anytime' = admin toggled open/closed + optional date range
    mode: { type: String, enum: ['scheduled', 'open_anytime'], default: 'scheduled' },

    // --- Scheduled mode fields ---
    startAt:              { type: Date },
    waitingPeriodMinutes: { type: Number, default: 15, min: 1, max: 1440 },

    // --- Open Anytime mode fields ---
    openFrom:  { type: Date, default: null },
    openUntil: { type: Date, default: null },
    isOpen:    { type: Boolean, default: false },

    // --- Shared ---
    playbackMode:    { type: String, enum: ['from_start', 'sync'], default: 'from_start' },
    videoId:         { type: String, default: '' },
    checkpointCount: { type: Number, default: 0 },
    publishedAt:     { type: Date, default: Date.now },

    participants: [participantSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);
