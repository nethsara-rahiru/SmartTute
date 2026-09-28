const mongoose = require('mongoose');

// Schema for individual Hotspot pins on an image figure
const HotspotSchema = new mongoose.Schema({
    tagId: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    label: { type: String, default: '' }
}, { _id: false });

// Schema for embedded Image Figures
const ImageFigureSchema = new mongoose.Schema({
    dataUrl: { type: String, required: true },
    originalDataUrl: { type: String },
    caption: { type: String, default: '' },
    size: { type: String, enum: ['small', 'medium', 'large', 'full'], default: 'medium' },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    hotspots: [HotspotSchema]
}, { _id: false });

// Schema for dynamic Answer Keys & Worked Solutions
const AnswerKeySchema = new mongoose.Schema({
    correctAnswer: { type: String, default: '' },
    solution: { type: String, default: '' },
    marks: { type: Number, default: 2 },
    displayStyle: { 
        type: String, 
        enum: ['input', 'label', 'dot', 'checkbox'], 
        default: 'input' 
    },
    labelText: { type: String, default: '' }
}, { _id: false });

// Schema for Question blocks
const QuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    marks: { type: Number, default: 10 },
    latex: { type: String, required: true },
    answers: {
        type: Map,
        of: AnswerKeySchema,
        default: {}
    },
    images: {
        type: Map,
        of: ImageFigureSchema,
        default: {}
    }
}, { _id: false });

// Main Tute Worksheet Schema
const TuteSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    grade: { type: String, required: true, default: 'Grade 11 (O/L)' },
    term: { type: String, required: true, default: 'Term 1' },
    subject: { type: String, required: true, default: 'Mathematics' },
    totalMarks: { type: Number, default: 0 },
    questions: [QuestionSchema]
}, {
    timestamps: true
});

const Tute = mongoose.model('Tute', TuteSchema);

module.exports = Tute;
