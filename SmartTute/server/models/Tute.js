import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, default: 'number' },
  correctAnswer: { type: String, default: '' },
  options: [{ type: String }],
  explanation: { type: String, default: '' }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  order: { type: Number, default: 1 },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  answers: [AnswerSchema]
}, { _id: false });

const TuteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  grade: { type: String, default: 'Grade 10' },
  subject: { type: String, default: 'Mathematics' },
  unit: { type: String, default: 'General' },
  className: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  questions: [QuestionSchema]
}, { timestamps: true });

export const Tute = mongoose.model('Tute', TuteSchema);
