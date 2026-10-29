/**
 * PalmQual-AI - Full-Stack Express Server
 * Serves REST API Endpoints and Interactive Web Application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// REST API Routes
app.use('/api/analysis', require('./backend/routes/analysis'));
app.use('/api/batch', require('./backend/routes/batch'));

// Dashboard Statistics Route
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStatistics();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Healthcheck Route
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'HEALTHY',
    system: 'PalmQual-AI',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    gemini_key_configured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Serve Frontend Static Files
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Catch-all to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌴 PalmQual-AI Full-Stack Server Running on Port ${PORT}`);
  console.log(`📍 Web UI:      http://localhost:${PORT}`);
  console.log(`📍 API Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/analysis/evaluate`);
  console.log(`   - POST http://localhost:${PORT}/api/batch/create`);
  console.log(`   - GET  http://localhost:${PORT}/api/batch/list`);
  console.log(`   - GET  http://localhost:${PORT}/api/stats`);
  console.log(`=======================================================`);
});

module.exports = app;
