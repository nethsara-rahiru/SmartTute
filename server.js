require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database/connection');
const tuteRoutes = require('./routes/tuteRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const classRoutes = require('./routes/classRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static frontend serving
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/tutes', tuteRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classes', classRoutes);

// Fallback route for root -> serve tute_library/index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tute_library', 'index.html'));
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log(`SmartTute Express Server running on http://localhost:${PORT}`);
});
