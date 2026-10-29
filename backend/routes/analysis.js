/**
 * PalmQual-AI - Analysis API Route
 * Endpoint: POST /api/analysis/evaluate
 */

const express = require('express');
const router = express.Router();
const { evaluateWithGemini } = require('../engine');

/**
 * POST /api/analysis/evaluate
 * Evaluates palm oil harvest sample parameters using AI / Rule Engine
 */
router.post('/evaluate', async (req, res) => {
  try {
    const payload = req.body || {};

    // Validate required parameters
    if (payload.lama_penyimpanan_jam === undefined || 
        payload.kadar_ffa_percent === undefined || 
        payload.pH === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Parameter wajib: lama_penyimpanan_jam, kadar_ffa_percent, dan pH harus disertakan.'
      });
    }

    // Sanitize and normalize inputs
    const params = {
      batch_id: payload.batch_id || `LOT-${Date.now().toString().slice(-6)}`,
      tanggal_panen: payload.tanggal_panen || new Date().toISOString(),
      lama_penyimpanan_jam: Number(payload.lama_penyimpanan_jam),
      warna: payload.warna || 'Sangat Merah Kecoklatan',
      viskositas_mPa_s: Number(payload.viskositas_mPa_s) || 45,
      pH: Number(payload.pH),
      kadar_ffa_percent: Number(payload.kadar_ffa_percent),
      moisture_percent: Number(payload.moisture_percent) || 0.20,
      berat_ton: Number(payload.berat_ton) || 25.0,
      lokasi_kebun: payload.lokasi_kebun || 'Kebun PKS Sawit Makmur'
    };

    const apiKey = payload.gemini_api_key || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    // Run evaluation
    const evaluation = await evaluateWithGemini(params, apiKey);

    // Return exact requested JSON specification
    return res.status(200).json(evaluation);

  } catch (error) {
    console.error('[Analysis Error]:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
