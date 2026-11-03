const mongoose = require('mongoose');
module.exports = mongoose.model('GuestSession', new mongoose.Schema({
    tokenHash: { type: String, unique: true, required: true },
    studentId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 80 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
}));
