/**
 * PalmQual-AI - Batch Management API Routes
 * Endpoints:
 * - POST /api/batch/create
 * - GET  /api/batch/list
 * - GET  /api/batch/:id
 * - DELETE /api/batch/:id
 * - POST /api/batch/reset
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { evaluateWithGemini } = require('../engine');

/**
 * POST /api/batch/create
 * Stores a new palm oil lot batch with automated AI allocation
 */
router.post('/create', async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.batch_id && !payload.kadar_ffa_percent) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Data batch tidak valid. Mohon sertakan batch_id dan parameter kualitas.'
      });
    }

    const apiKey = payload.gemini_api_key || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    // Run AI Evaluation
    const evaluation = await evaluateWithGemini(payload, apiKey);

    // Persist into database store
    const newBatch = db.create(payload, evaluation);

    return res.status(201).json({
      success: true,
      message: `Batch [${newBatch.batch_id}] berhasil disimpan dan dialokasikan.`,
      data: newBatch
    });

  } catch (error) {
    console.error('[Batch Create Error]:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/batch/list
 * Retrieves list of all palm oil batches with current allocation status
 */
router.get('/list', (req, res) => {
  try {
    const { track, category, search } = req.query;
    let list = db.getAll();

    if (track) {
      list = list.filter(b => b.track_type.toUpperCase() === track.toUpperCase());
    }
    if (category) {
      list = list.filter(b => b.category.toUpperCase() === category.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        b.batch_id.toLowerCase().includes(q) ||
        (b.lokasi_kebun && b.lokasi_kebun.toLowerCase().includes(q)) ||
        (b.primary_recommendation && b.primary_recommendation.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });

  } catch (error) {
    console.error('[Batch List Error]:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/batch/:id
 * Retrieve single batch details
 */
router.get('/:id', (req, res) => {
  try {
    const batch = db.getById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Batch dengan ID [${req.params.id}] tidak ditemukan.`
      });
    }
    return res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/batch/:id
 * Delete a batch
 */
router.delete('/:id', (req, res) => {
  try {
    const success = db.delete(req.params.id);
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Batch [${req.params.id}] tidak ditemukan atau sudah terhapus.`
      });
    }
    return res.status(200).json({
      success: true,
      message: `Batch [${req.params.id}] berhasil dihapus.`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/batch/reset
 * Resets database to factory defaults
 */
router.post('/reset', (req, res) => {
  try {
    const list = db.reset();
    return res.status(200).json({
      success: true,
      message: 'Database berhasil direset ke data awal PKS.',
      count: list.length,
      data: list
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
