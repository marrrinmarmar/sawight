/**
 * PalmQual-AI - Backend REST API Client
 * Seamlessly interfaces with Node.js/Express backend
 */

const ApiClient = {
  BASE_URL: '', // Relative URL handles both localhost:8080 and custom domains

  /**
   * Healthcheck
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.BASE_URL}/api/health`, { method: 'GET' });
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * POST /api/analysis/evaluate
   * @param {Object} sampleData - Physical & chemical metrics
   * @returns {Promise<Object>} Evaluated decision response
   */
  async evaluateSample(sampleData) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/analysis/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.warn('[API Client] /api/analysis/evaluate fallback to client engine:', error.message);
      // Client-side fallback if server is unreachable
      if (typeof PalmLogicEngine !== 'undefined') {
        const local = PalmLogicEngine.analyze({
          holdTime: sampleData.lama_penyimpanan_jam,
          ffa: sampleData.kadar_ffa_percent,
          ph: sampleData.pH,
          moisture: sampleData.moisture_percent,
          viscosity: sampleData.viskositas_mPa_s,
          batchWeight: sampleData.berat_ton
        });
        return {
          batch_id: sampleData.batch_id,
          track_type: local.route === 'DEFAULT_TRACK' ? 'DEFAULT' : 'FLEX',
          primary_recommendation: local.category,
          category: local.isDefaultTrack ? 'CPO_DEFAULT' : (local.isBioProduct ? 'BIO_ECO_FRIENDLY' : 'OTHER_PRODUCTS'),
          confidence_score: local.confidence,
          alternate_recommendation: local.alternativeCategory,
          ai_explanation: local.scientificReason,
          action_steps: local.downstreamSOP.map(s => `${s.title}: ${s.desc}`),
          details: { estimated_value_idr: local.estimatedValueIDR, co2_reduction_kg: local.carbonSavingsKg }
        };
      }
      throw error;
    }
  },

  /**
   * GET /api/batch/list
   */
  async getBatches(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.track && filters.track !== 'ALL') params.append('track', filters.track);
      if (filters.search) params.append('search', filters.search);

      const url = `${this.BASE_URL}/api/batch/list${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.warn('[API Client] /api/batch/list fallback to LocalStorage:', error.message);
      if (typeof BatchDataManager !== 'undefined') {
        return BatchDataManager.getAll();
      }
      return [];
    }
  },

  /**
   * POST /api/batch/create
   */
  async createBatch(batchData) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/batch/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('[API Client] /api/batch/create fallback to LocalStorage:', error.message);
      if (typeof BatchDataManager !== 'undefined') {
        return { success: true, data: BatchDataManager.addBatch(batchData) };
      }
      throw error;
    }
  },

  /**
   * DELETE /api/batch/:id
   */
  async deleteBatch(batchId) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/batch/${batchId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (typeof BatchDataManager !== 'undefined') {
        BatchDataManager.deleteBatch(batchId);
        return { success: true };
      }
      throw error;
    }
  },

  /**
   * POST /api/batch/reset
   */
  async resetBatches() {
    try {
      const res = await fetch(`${this.BASE_URL}/api/batch/reset`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (typeof BatchDataManager !== 'undefined') {
        return { success: true, data: BatchDataManager.resetToDefaults() };
      }
      throw error;
    }
  },

  /**
   * GET /api/stats
   */
  async getStatistics() {
    try {
      const res = await fetch(`${this.BASE_URL}/api/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (error) {
      if (typeof BatchDataManager !== 'undefined') {
        return BatchDataManager.getStatistics();
      }
      return null;
    }
  }
};

if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}
