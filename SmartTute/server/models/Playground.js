import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  name: { type: String, required: true },
  avatar: {
    body: { type: String, default: '' },
    face: { type: String, default: '' },
    hair: { type: String, default: '' },
    clothes: { type: String, default: '' },
    pants: { type: String, default: '' },
    shoes: { type: String, default: '' },
    hat: { type: String, default: '' },
    accessory: { type: String, default: '' }
  },
  position: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 }
  },
  animation: { type: String, default: 'idle' }
}, { _id: false });

const PlaygroundSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  joinCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['waiting', 'started', 'finished'], default: 'waiting' },
  participants: [ParticipantSchema]
}, { timestamps: true });

export const Playground = mongoose.model('Playground', PlaygroundSchema);
