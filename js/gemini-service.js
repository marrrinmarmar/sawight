/**
 * PalmQual-AI - Gemini API Integration & AI Structured Reasoning Service
 * Connects with Google Gemini API when API key is provided, or uses offline engine seamlessly.
 */

const GeminiService = {
  API_KEY_STORAGE: 'palmqual_gemini_api_key',

  getApiKey() {
    return localStorage.getItem(this.API_KEY_STORAGE) || '';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem(this.API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(this.API_KEY_STORAGE);
    }
  },

  hasApiKey() {
    return Boolean(this.getApiKey());
  },

  /**
   * Request LLM Deep Analysis using Gemini API with Structured Prompt
   * @param {Object} sampleParams - Sample laboratory metrics
   * @returns {Promise<Object>} Structured narrative reasoning
   */
  async requestDeepAnalysis(sampleParams) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      // Fallback to local expert biochemical generator
      return this.generateLocalExpertReport(sampleParams);
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
Anda adalah Chief Scientific & Refinery Allocation AI di Pabrik Kelapa Sawit (PKS) dan Bio-Refinery Nasional PalmQual-AI.
Analisis data batch kelapa sawit berikut:
- Lama Penundaan / Hold Time: ${sampleParams.holdTime} jam
- Kadar Asam Lemak Bebas (FFA): ${sampleParams.ffa} %
- pH: ${sampleParams.ph}
- Kadar Air / Moisture: ${sampleParams.moisture} %
- Viskositas: ${sampleParams.viscosity} cSt
- Kategori Warna: ${sampleParams.colorCategory}
- Suhu Lingkungan: ${sampleParams.ambientTemp} °C
- Berat Batch: ${sampleParams.batchWeight} Ton

Aturan Bisnis:
1. Default Track: Minyak Sawit Konsumsi Standar jika Hold Time ≤ 24 jam, FFA ≤ 3.5%, pH 5.8-6.8, Moisture ≤ 0.25%.
2. Flex Track (AI Deep Analysis):
   - Jika lolos kriteria bio/eco: Biofuel HVO, Biodiesel FAME B35/B40, Bioplastik PHA, atau Sabun Organik.
   - Jika tidak lolos bio: Oleokimia industri non-biofuel, Pakan Ternak Kalsium, atau Pupuk Kompos & Biogas.

Berikan output JSON murni dengan format persis:
{
  "primaryRecommendation": "Kategori Utama",
  "trackType": "DEFAULT_TRACK" atau "FLEX_TRACK",
  "isBioEco": true atau false,
  "confidenceScore": 95,
  "scientificExplanation": "Penjelasan biokimia degradasi enzimatik mendalam",
  "downstreamSteps": ["Langkah 1", "Langkah 2", "Langkah 3", "Langkah 4"],
  "economicAdvantage": "Estimasi manfaat ekonomi dan efisiensi pabrik"
}
`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
      throw new Error('Respon Gemini kosong');
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local expert engine:', err);
      return this.generateLocalExpertReport(sampleParams);
    }
  },

  /**
   * Local biochemical expert reasoning generator (Zero network dependency)
   */
  generateLocalExpertReport(params) {
    const localResult = PalmLogicEngine.analyze(params);
    return {
      primaryRecommendation: localResult.category,
      trackType: localResult.route,
      isBioEco: localResult.isBioProduct,
      confidenceScore: localResult.confidence,
      scientificExplanation: localResult.scientificReason,
      downstreamSteps: localResult.downstreamSOP.map(s => `${s.title}: ${s.desc}`),
      economicAdvantage: `Valuasi Batch Estimasi: ${PalmLogicEngine.formatRupiah(localResult.estimatedValueIDR)} | Potensi Reduksi Emisi: ${localResult.carbonSavingsKg.toLocaleString('id-ID')} kg CO2-eq.`
    };
  }
};

if (typeof window !== 'undefined') {
  window.GeminiService = GeminiService;
}
