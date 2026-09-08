import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tute } from './models/Tute.js';
import { Playground } from './models/Playground.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not defined in environment variables.');
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected successfully to MongoDB Atlas!'))
    .catch(err => console.error('❌ MongoDB Atlas Connection Error:', err));
}

// API Routes for Tutes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

// GET all tutes
app.get('/api/tutes', async (req, res) => {
  try {
    const tutes = await Tute.find().sort({ updatedAt: -1 });
    res.json(tutes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutes', details: err.message });
  }
});

// GET tute by ID
app.get('/api/tutes/:id', async (req, res) => {
  try {
    const tute = await Tute.findOne({ id: req.params.id });
    if (!tute) return res.status(404).json({ error: 'Tute not found' });
    res.json(tute);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tute', details: err.message });
  }
});

// POST save / update tute
app.post('/api/tutes', async (req, res) => {
  try {
    const tuteData = req.body;
    if (!tuteData.id) {
      tuteData.id = `tute_${Date.now()}`;
    }

    const updated = await Tute.findOneAndUpdate(
      { id: tuteData.id },
      tuteData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save tute', details: err.message });
  }
});

// DELETE tute
app.delete('/api/tutes/:id', async (req, res) => {
  try {
    const result = await Tute.deleteOne({ id: req.params.id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tute', details: err.message });
  }
});

// API Routes for Playgrounds
app.get('/api/playgrounds', async (req, res) => {
  try {
    const playgrounds = await Playground.find().sort({ updatedAt: -1 });
    res.json(playgrounds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playgrounds', details: err.message });
  }
});

app.get('/api/playgrounds/code/:code', async (req, res) => {
  try {
    const playground = await Playground.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!playground) return res.status(404).json({ error: 'Invalid join code' });
    res.json(playground);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playground by code', details: err.message });
  }
});

app.get('/api/playgrounds/:id', async (req, res) => {
  try {
    const playground = await Playground.findOne({ id: req.params.id });
    if (!playground) return res.status(404).json({ error: 'Playground not found' });
    res.json(playground);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playground', details: err.message });
  }
});


app.post('/api/playgrounds', async (req, res) => {
  try {
    const data = req.body;
    const updated = await Playground.findOneAndUpdate(
      { id: data.id },
      data,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save playground', details: err.message });
  }
});

app.delete('/api/playgrounds/:id', async (req, res) => {
  try {
    const result = await Playground.deleteOne({ id: req.params.id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playground', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 SmartTute MongoDB Server running on http://localhost:${PORT}`);
});
