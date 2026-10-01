const mongoose = require('mongoose');

/**
 * ChatMessage — Stores all student messages for a session.
 * Media (images, voice clips) are stored as base64 data URIs
 * to keep the stack self-contained (no separate file storage service needed).
 */
const chatMessageSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, index: true },
    studentId:  { type: String, required: true },
    studentName:{ type: String, required: true, trim: true },

    // 'text' | 'image' | 'voice'
    type: { type: String, enum: ['text', 'image', 'voice'], default: 'text' },

    // For text messages
    text: { type: String, default: '' },

    // For image messages — base64 data URI (e.g. "data:image/jpeg;base64,...")
    imageData: { type: String, default: '' },
    imageCaption: { type: String, default: '' },

    // For voice messages — base64 data URI (e.g. "data:audio/webm;base64,...")
    audioData: { type: String, default: '' },
    // Duration in seconds (client-computed)
    audioDuration: { type: Number, default: 0 },

    // Soft-delete / moderation
    deleted: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false
});

// Index for efficient per-session polling
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
