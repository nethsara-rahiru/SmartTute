require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/database/connection');
const tuteRoutes = require('./routes/tuteRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const classRoutes = require('./routes/classRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { loadUser, sameOrigin, requireUser, requireRole } = require('./middleware/auth');

const app = express();

// Middleware
app.disable('x-powered-by');
app.use(sameOrigin);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', loadUser);
app.use('/api/auth', express.json({ limit: '400kb' }), require('./routes/authRoutes'));
app.use('/api/admin', express.json({ limit: '8kb' }), require('./routes/adminRoutes'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static frontend serving
const teacherPages = ['tute_library', 'tute_lab', 'class_library', 'class_organizer', 'session_scheduler', 'session_dashboard', 'schedules', 'live_chatbox'];
app.use((req, res, next) => {
    let section;
    try { section = path.posix.normalize(decodeURIComponent(req.path)).split('/')[1]; }
    catch (_) { return res.status(400).send('Invalid URL.'); }
    const roles = section === 'admin' ? ['admin'] : teacherPages.includes(section) ? ['teacher', 'admin'] : null;
    if (!roles && section !== 'live_class') return next();
    loadUser(req, res, () => {
        res.set('Cache-Control', 'no-store');
        if (!req.user) return res.redirect('/auth/?mode=login&next=' + encodeURIComponent(req.originalUrl));
        if (roles && !roles.includes(req.user.role)) return res.status(403).send('This page is for teachers or administrators. <a href="/">Return home</a>');
        next();
    });
});
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/tutes', requireRole('teacher', 'admin'), tuteRoutes);
app.use('/api/sessions', requireUser, sessionRoutes);
app.use('/api/classes', requireUser, classRoutes);
app.use('/api/chat', requireUser, chatRoutes);

// Fallback route for root -> serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Request failed:', err.name);
    const status = err.status === 413 ? 413 : err instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'This upload is too large.' : status === 400 ? 'Invalid request body.' : 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5500;

if (require.main === module) {
    connectDB().then(async () => {
        // Ensure uniqueness and TTL indexes exist before accepting registrations.
        await Promise.all(Object.values(require('mongoose').models).map(model => model.init()));
        app.listen(PORT, () => {
        console.log(`SmartTute Express Server running on http://localhost:${PORT}`);
        });
    }).catch(err => { console.error('Startup failed:', err.name); process.exitCode = 1; });
}
module.exports = app;
