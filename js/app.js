/**
 * PalmQual-AI - Application Main Controller (Full-Stack Connected)
 * Coordinates UI events, REST API communication with Express backend,
 * interactive flowchart synchronization, batch management, and export.
 */

// Global Toast function
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

const PalmApp = {
  currentAnalysisResult: null,

  async init() {
    this.initNavigation();
    this.initSliders();
    this.initSwatches();
    this.initPresets();
    this.initModalActions();
    this.initSettings();
    this.initExportButtons();

    // Initialize Flowchart & Charts
    FlowchartViz.init();
    PalmCharts.init();

    // Check backend API connection
    await this.checkBackendStatus();

    // Load initial data and run first analysis
    await this.loadBatchesFromApi();
    this.runAnalysis();
    this.updateDashboardKPIs();
  },

  /**
   * Check connection to backend Express server
   */
  async checkBackendStatus() {
    const health = await ApiClient.checkHealth();
    const statusBadge = document.querySelector('.system-status-badge');
    if (statusBadge) {
      if (health) {
        statusBadge.innerHTML = `
          <span class="status-dot-pulse"></span>
          <span>API Connected (Express :8080)</span>
        `;
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      } else {
        statusBadge.innerHTML = `
          <span class="status-dot-pulse" style="background:#f59e0b; box-shadow: 0 0 8px #f59e0b;"></span>
          <span>Local Engine Active</span>
        `;
      }
    }
  },

  /**
   * Tab Navigation System
   */
  initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const activePanel = document.getElementById(`panel-${targetTab}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Refresh charts on dashboard view
        if (targetTab === 'dashboard') {
          setTimeout(() => PalmCharts.refresh(), 100);
        }
      });
    });
  },

  /**
   * Format parameter payload matching backend schema
   */
  getInputParameters() {
    const colorMap = {
      'sangat-merah': 'Sangat Merah Kecoklatan',
      'kuning-emas': 'Kuning Emas',
      'gelap-pucat': 'Gelap Pucat',
      'gelap-teroksidasi': 'Teroksidasi Gelap'
    };

    const selectedColorKey = document.querySelector('.swatch-card.active')?.dataset.color || 'sangat-merah';

    return {
      batch_id: document.getElementById('inputBatchId').value || 'LOT-20261029-01',
      lokasi_kebun: document.getElementById('inputEstateName').value || 'Kebun PKS Sawit Makmur',
      tanggal_panen: document.getElementById('inputHarvestDate').value || new Date().toISOString(),
      lama_penyimpanan_jam: parseFloat(document.getElementById('inputHoldTime').value) || 0,
      warna: colorMap[selectedColorKey] || 'Sangat Merah Kecoklatan',
      colorCategoryKey: selectedColorKey,
      viskositas_mPa_s: parseFloat(document.getElementById('inputViscosity').value) || 45,
      pH: parseFloat(document.getElementById('inputPh').value) || 6.0,
      kadar_ffa_percent: parseFloat(document.getElementById('inputFfa').value) || 2.0,
      moisture_percent: parseFloat(document.getElementById('inputMoisture').value) || 0.20,
      suhu_simpan_c: parseFloat(document.getElementById('inputAmbientTemp').value) || 30,
      berat_ton: parseFloat(document.getElementById('inputBatchWeight').value) || 25
    };
  },

  /**
   * Bind range sliders with real-time value badges
   */
  initSliders() {
    const sliders = [
      { id: 'inputHoldTime', badge: 'badgeHoldTime', unit: ' Jam', decimals: 1 },
      { id: 'inputFfa', badge: 'badgeFfa', unit: ' %', decimals: 2 },
      { id: 'inputPh', badge: 'badgePh', unit: '', decimals: 2 },
      { id: 'inputMoisture', badge: 'badgeMoisture', unit: ' %', decimals: 2 },
      { id: 'inputViscosity', badge: 'badgeViscosity', unit: ' mPa.s', decimals: 0 },
      { id: 'inputAmbientTemp', badge: 'badgeAmbientTemp', unit: ' °C', decimals: 0 },
      { id: 'inputBatchWeight', badge: 'badgeBatchWeight', unit: ' Ton', decimals: 1 }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const badge = document.getElementById(s.badge);
      if (el && badge) {
        el.addEventListener('input', () => {
          const val = parseFloat(el.value).toFixed(s.decimals);
          badge.textContent = `${val}${s.unit}`;
          this.debounceRunAnalysis();
        });
      }
    });

    // Automatic Hold Time calculation from harvest date and test date
    const harvestDateInput = document.getElementById('inputHarvestDate');
    const testDateInput = document.getElementById('inputTestDate');
    if (harvestDateInput && testDateInput) {
      const calcHold = () => {
        const d1 = new Date(harvestDateInput.value);
        const d2 = new Date(testDateInput.value);
        if (!isNaN(d1) && !isNaN(d2)) {
          const diffHours = Math.max(0, (d2 - d1) / (1000 * 60 * 60));
          const holdSlider = document.getElementById('inputHoldTime');
          if (holdSlider) {
            holdSlider.value = Math.min(120, Math.round(diffHours * 10) / 10);
            document.getElementById('badgeHoldTime').textContent = `${holdSlider.value} Jam`;
            this.debounceRunAnalysis();
          }
        }
      };
      harvestDateInput.addEventListener('change', calcHold);
      testDateInput.addEventListener('change', calcHold);
    }
  },

  analysisTimer: null,
  debounceRunAnalysis() {
    clearTimeout(this.analysisTimer);
    this.analysisTimer = setTimeout(() => this.runAnalysis(), 150);
  },

  /**
   * Color Swatches Picker
   */
  initSwatches() {
    const swatches = document.querySelectorAll('.swatch-card');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.runAnalysis();
      });
    });
  },

  /**
   * Preset Simulation Buttons
   */
  initPresets() {
    const presets = {
      'preset-fresh': {
        lama_penyimpanan_jam: 8.0,
        kadar_ffa_percent: 1.60,
        pH: 6.4,
        moisture_percent: 0.15,
        viskositas_mPa_s: 44,
        colorCategoryKey: 'sangat-merah',
        suhu_simpan_c: 28,
        berat_ton: 35.0
      },
      'preset-hvo': {
        lama_penyimpanan_jam: 22.0,
        kadar_ffa_percent: 3.20,
        pH: 5.9,
        moisture_percent: 0.28,
        viskositas_mPa_s: 52,
        colorCategoryKey: 'kuning-emas',
        suhu_simpan_c: 30,
        berat_ton: 45.0
      },
      'preset-fame': {
        lama_penyimpanan_jam: 36.0,
        kadar_ffa_percent: 4.80,
        pH: 5.5,
        moisture_percent: 0.45,
        viskositas_mPa_s: 62,
        colorCategoryKey: 'gelap-pucat',
        suhu_simpan_c: 31,
        berat_ton: 50.0
      },
      'preset-bioplastic': {
        lama_penyimpanan_jam: 44.0,
        kadar_ffa_percent: 7.20,
        pH: 5.2,
        moisture_percent: 0.60,
        viskositas_mPa_s: 78,
        colorCategoryKey: 'gelap-teroksidasi',
        suhu_simpan_c: 32,
        berat_ton: 30.0
      },
      'preset-oleo': {
        lama_penyimpanan_jam: 54.0,
        kadar_ffa_percent: 12.00,
        pH: 4.8,
        moisture_percent: 0.95,
        viskositas_mPa_s: 92,
        colorCategoryKey: 'gelap-teroksidasi',
        suhu_simpan_c: 31,
        berat_ton: 60.0
      },
      'preset-feed': {
        lama_penyimpanan_jam: 68.0,
        kadar_ffa_percent: 16.50,
        pH: 4.5,
        moisture_percent: 1.25,
        viskositas_mPa_s: 105,
        colorCategoryKey: 'gelap-teroksidasi',
        suhu_simpan_c: 32,
        berat_ton: 28.0
      },
      'preset-compost': {
        lama_penyimpanan_jam: 88.0,
        kadar_ffa_percent: 22.50,
        pH: 4.1,
        moisture_percent: 2.10,
        viskositas_mPa_s: 125,
        colorCategoryKey: 'gelap-teroksidasi',
        suhu_simpan_c: 30,
        berat_ton: 40.0
      }
    };

    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        if (presetKey === 'random') {
          this.applyRandomValues();
          return;
        }

        const data = presets[presetKey];
        if (data) {
          this.setFormValues(data);
          document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          window.showToast(`Preset "${btn.innerText.trim()}" dimuat!`, 'success');
        }
      });
    });
  },

  setFormValues(data) {
    if (data.lama_penyimpanan_jam !== undefined) {
      document.getElementById('inputHoldTime').value = data.lama_penyimpanan_jam;
      document.getElementById('badgeHoldTime').textContent = `${data.lama_penyimpanan_jam} Jam`;
    }
    if (data.kadar_ffa_percent !== undefined) {
      document.getElementById('inputFfa').value = data.kadar_ffa_percent;
      document.getElementById('badgeFfa').textContent = `${data.kadar_ffa_percent} %`;
    }
    if (data.pH !== undefined) {
      document.getElementById('inputPh').value = data.pH;
      document.getElementById('badgePh').textContent = `${data.pH}`;
    }
    if (data.moisture_percent !== undefined) {
      document.getElementById('inputMoisture').value = data.moisture_percent;
      document.getElementById('badgeMoisture').textContent = `${data.moisture_percent} %`;
    }
    if (data.viskositas_mPa_s !== undefined) {
      document.getElementById('inputViscosity').value = data.viskositas_mPa_s;
      document.getElementById('badgeViscosity').textContent = `${data.viskositas_mPa_s} mPa.s`;
    }
    if (data.suhu_simpan_c !== undefined) {
      document.getElementById('inputAmbientTemp').value = data.suhu_simpan_c;
      document.getElementById('badgeAmbientTemp').textContent = `${data.suhu_simpan_c} °C`;
    }
    if (data.berat_ton !== undefined) {
      document.getElementById('inputBatchWeight').value = data.berat_ton;
      document.getElementById('badgeBatchWeight').textContent = `${data.berat_ton} Ton`;
    }
    if (data.colorCategoryKey) {
      document.querySelectorAll('.swatch-card').forEach(s => {
        if (s.dataset.color === data.colorCategoryKey) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    }

    this.runAnalysis();
  },

  applyRandomValues() {
    const randomData = {
      lama_penyimpanan_jam: Math.round((Math.random() * 80 + 4) * 10) / 10,
      kadar_ffa_percent: Math.round((Math.random() * 20 + 1) * 100) / 100,
      pH: Math.round((Math.random() * 2.5 + 4.2) * 100) / 100,
      moisture_percent: Math.round((Math.random() * 1.8 + 0.1) * 100) / 100,
      viskositas_mPa_s: Math.round(Math.random() * 80 + 35),
      colorCategoryKey: ['sangat-merah', 'kuning-emas', 'gelap-pucat', 'gelap-teroksidasi'][Math.floor(Math.random() * 4)],
      suhu_simpan_c: Math.round(Math.random() * 6 + 27),
      berat_ton: Math.round((Math.random() * 50 + 15) * 10) / 10
    };
    this.setFormValues(randomData);
    window.showToast('Parameter acak di-generate!', 'info');
  },

  /**
   * Run Analysis via Backend API POST /api/analysis/evaluate
   */
  async runAnalysis() {
    const params = this.getInputParameters();

    // Call Backend API
    const result = await ApiClient.evaluateSample({
      batch_id: params.batch_id,
      lokasi_kebun: params.lokasi_kebun,
      tanggal_panen: params.tanggal_panen,
      lama_penyimpanan_jam: params.lama_penyimpanan_jam,
      warna: params.warna,
      viskositas_mPa_s: params.viskositas_mPa_s,
      pH: params.pH,
      kadar_ffa_percent: params.kadar_ffa_percent,
      moisture_percent: params.moisture_percent,
      berat_ton: params.berat_ton,
      gemini_api_key: GeminiService.getApiKey()
    });

    this.currentAnalysisResult = result;

    // 1. Update Flowchart visual state
    FlowchartViz.update({
      isDefaultTrack: result.track_type === 'DEFAULT',
      isBioProduct: result.category === 'BIO_ECO_FRIENDLY',
      category: result.primary_recommendation,
      inputs: {
        holdTime: params.lama_penyimpanan_jam,
        ffa: params.kadar_ffa_percent,
        ph: params.pH
      }
    });

    // 2. Render Hero Card
    this.renderAiHeroCard(result, params);
  },

  /**
   * Render AI Result Hero Card
   */
  renderAiHeroCard(result, params) {
    const heroCard = document.getElementById('aiResultHero');
    if (!heroCard) return;

    const isDefault = result.track_type === 'DEFAULT';
    const isBio = result.category === 'BIO_ECO_FRIENDLY';

    heroCard.className = `ai-result-hero ${isDefault ? 'track-default' : (isBio ? 'track-bio' : 'track-other')}`;

    // Tag Pill
    const tagEl = document.getElementById('aiTrackTag');
    if (tagEl) {
      if (isDefault) {
        tagEl.className = 'ai-track-tag tag-default';
        tagEl.innerHTML = '⚡ Default Track (CPO Pangan)';
      } else if (isBio) {
        tagEl.className = 'ai-track-tag tag-bio';
        tagEl.innerHTML = '🌿 Flex Track (Bio / Eco-Friendly)';
      } else {
        tagEl.className = 'ai-track-tag tag-other';
        tagEl.innerHTML = '🍂 Flex Track (Produk Lain / Oleo / Feed)';
      }
    }

    // Titles
    document.getElementById('aiPrimaryTitle').textContent = result.primary_recommendation;
    document.getElementById('aiSubCategory').textContent = `Kategori: ${result.category}`;
    document.getElementById('aiAlternativeRec').textContent = `Alternatif / Fallback: ${result.alternate_recommendation || '-'}`;

    // Confidence
    const confValEl = document.getElementById('aiConfidenceVal');
    if (confValEl) {
      confValEl.textContent = `${result.confidence_score}%`;
      confValEl.style.color = isDefault ? 'var(--accent-palm)' : (isBio ? 'var(--accent-bio)' : 'var(--accent-other)');
    }

    // Valuation & Carbon Pills
    const valIdr = result.details?.estimated_value_idr || Math.round(params.berat_ton * 12500000);
    const co2Kg = result.details?.co2_reduction_kg || Math.round(params.berat_ton * 750);

    document.getElementById('valFinancial').textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(valIdr);
    document.getElementById('valCarbon').textContent = `-${co2Kg.toLocaleString('id-ID')} kg CO2`;
    document.getElementById('valRouteStatus').textContent = isDefault ? 'Standar SNI 7709 / PORAM' : (isBio ? 'Standar Mandat Eco-Fuel' : 'Industri Oleokimia / Sirkular');

    // SOP steps checklist
    const sopListEl = document.getElementById('aiSopList');
    if (sopListEl && Array.isArray(result.action_steps)) {
      sopListEl.innerHTML = result.action_steps.map((stepText, idx) => `
        <li class="sop-step-item">
          <span class="step-num">${idx + 1}</span>
          <div class="sop-step-text">
            ${stepText}
          </div>
        </li>
      `).join('');
    }

    // Scientific Explanation
    const reasonEl = document.getElementById('aiScientificReason');
    if (reasonEl) {
      reasonEl.textContent = result.ai_explanation;
    }
  },

  /**
   * Save current analyzed sample as a permanent batch via POST /api/batch/create
   */
  async saveCurrentAsBatch() {
    if (!this.currentAnalysisResult) return;

    const params = this.getInputParameters();
    const result = this.currentAnalysisResult;

    const newId = `LOT-20261029-${String(Math.floor(Math.random() * 900) + 100)}`;

    const createPayload = {
      batch_id: newId,
      lokasi_kebun: params.lokasi_kebun,
      tanggal_panen: params.tanggal_panen,
      lama_penyimpanan_jam: params.lama_penyimpanan_jam,
      warna: params.warna,
      viskositas_mPa_s: params.viskositas_mPa_s,
      pH: params.pH,
      kadar_ffa_percent: params.kadar_ffa_percent,
      moisture_percent: params.moisture_percent,
      berat_ton: params.berat_ton,
      gemini_api_key: GeminiService.getApiKey()
    };

    try {
      const resp = await ApiClient.createBatch(createPayload);
      if (resp.success) {
        window.showToast(`Batch [${newId}] berhasil disimpan via API!`, 'success');
        await this.loadBatchesFromApi();
        this.updateDashboardKPIs();
        PalmCharts.refresh();
      }
    } catch (e) {
      window.showToast(`Gagal menyimpan batch: ${e.message}`, 'error');
    }
  },

  /**
   * Fetch and render batch table from Backend GET /api/batch/list
   */
  async loadBatchesFromApi() {
    const tableBody = document.getElementById('batchTableBody');
    if (!tableBody) return;

    const filterTrack = document.getElementById('filterBatchTrack')?.value || 'ALL';
    const searchQuery = document.getElementById('searchBatchInput')?.value.toLowerCase().trim() || '';

    const batches = await ApiClient.getBatches({
      track: filterTrack !== 'ALL' ? filterTrack : undefined,
      search: searchQuery || undefined
    });

    if (batches.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Tidak ada batch yang cocok dengan kriteria pencarian.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = batches.map(b => {
      let badgeClass = 'badge-default';
      let trackLabel = 'Default (Minyak)';
      if (b.category === 'BIO_ECO_FRIENDLY') {
        badgeClass = 'badge-bio';
        trackLabel = 'Flex (Bio/Eco)';
      } else if (b.category === 'OTHER_PRODUCTS') {
        badgeClass = 'badge-other';
        trackLabel = 'Flex (Produk Lain)';
      }

      return `
        <tr>
          <td><strong class="mono" style="color: var(--accent-ai);">${b.batch_id}</strong></td>
          <td>
            <div style="font-weight: 600;">${b.lokasi_kebun || 'PKS Makmur'}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${(b.tanggal_panen || '').slice(0, 16).replace('T', ' ')}</div>
          </td>
          <td><span class="mono">${b.lama_penyimpanan_jam} Jam</span></td>
          <td><span class="mono">${b.berat_ton || 25} Ton</span></td>
          <td>
            <div class="mono" style="font-size: 0.78rem;">
              FFA: <strong>${b.kadar_ffa_percent}%</strong> | pH: ${b.pH} | Air: ${b.moisture_percent}%
            </div>
          </td>
          <td>
            <div style="font-weight: 700; font-size: 0.82rem;">${b.primary_recommendation || b.allocation}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${b.status || 'Dispatched'}</div>
          </td>
          <td>
            <span class="badge-status ${badgeClass}">${trackLabel}</span>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="PalmApp.loadBatchToSimulator('${b.batch_id}')" title="Muat ke Simulator">
                🧪 Uji
              </button>
              <button class="btn btn-secondary btn-sm" onclick="PalmApp.openCertificateModal('${b.batch_id}')" title="Cetak Dispatch Certificate">
                📄 Tiket
              </button>
              <button class="btn btn-secondary btn-sm" style="color: var(--accent-danger);" onclick="PalmApp.deleteBatch('${b.batch_id}')" title="Hapus Batch">
                🗑
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Update count in header
    const counterEl = document.getElementById('batchCountBadge');
    if (counterEl) {
      counterEl.textContent = `${batches.length} Lot`;
    }
  },

  async loadBatchToSimulator(batchId) {
    const batches = await ApiClient.getBatches();
    const batch = batches.find(b => b.batch_id === batchId);
    if (!batch) return;

    const colorKeyMap = {
      'Sangat Merah Kecoklatan': 'sangat-merah',
      'Kuning Emas': 'kuning-emas',
      'Gelap Pucat': 'gelap-pucat',
      'Teroksidasi Gelap': 'gelap-teroksidasi'
    };

    this.setFormValues({
      lama_penyimpanan_jam: Number(batch.lama_penyimpanan_jam),
      kadar_ffa_percent: Number(batch.kadar_ffa_percent),
      pH: Number(batch.pH),
      moisture_percent: Number(batch.moisture_percent),
      viskositas_mPa_s: Number(batch.viskositas_mPa_s),
      colorCategoryKey: colorKeyMap[batch.warna] || 'sangat-merah',
      suhu_simpan_c: 30,
      berat_ton: Number(batch.berat_ton) || 25
    });

    document.getElementById('inputBatchId').value = batch.batch_id;
    document.getElementById('inputEstateName').value = batch.lokasi_kebun || 'Kebun PKS Sawit';

    document.querySelector('.nav-tab-btn[data-tab="simulator"]')?.click();
    window.showToast(`Batch ${batch.batch_id} dimuat ke Simulator AI!`, 'info');
  },

  async deleteBatch(batchId) {
    if (confirm(`Yakin ingin menghapus data batch ${batchId}?`)) {
      await ApiClient.deleteBatch(batchId);
      await this.loadBatchesFromApi();
      this.updateDashboardKPIs();
      PalmCharts.refresh();
      window.showToast(`Batch ${batchId} telah dihapus.`, 'info');
    }
  },

  async resetMockBatches() {
    if (confirm('Kembalikan semua data ke setelan awal PKS?')) {
      await ApiClient.resetBatches();
      await this.loadBatchesFromApi();
      this.updateDashboardKPIs();
      PalmCharts.refresh();
      window.showToast('Data batch telah direset ke mock default.', 'success');
    }
  },

  /**
   * Update Dashboard KPI Counter Cards from GET /api/stats
   */
  async updateDashboardKPIs() {
    const stats = await ApiClient.getStatistics();
    if (!stats) return;

    document.getElementById('kpiTotalBatches').textContent = stats.total_batches;
    document.getElementById('kpiTotalTonnage').textContent = stats.total_tonnage?.toLocaleString('id-ID') || 0;
    document.getElementById('kpiAvgFfa').textContent = stats.avg_ffa || 0;
    document.getElementById('kpiAvgHoldTime').textContent = stats.avg_hold_time || 0;

    const dist = stats.distribution || {};
    document.getElementById('kpiDefaultCount').textContent = `${dist.cpo_default || 0} Lot (${dist.cpo_percent || 0}%)`;
    document.getElementById('kpiBioCount').textContent = `${dist.bio_eco_friendly || 0} Lot (${dist.bio_percent || 0}%)`;
    document.getElementById('kpiOtherCount').textContent = `${dist.other_products || 0} Lot (${dist.other_percent || 0}%)`;
  },

  /**
   * Certificate / Dispatch Pass Modal
   */
  initModalActions() {
    const modal = document.getElementById('certModal');
    const closeBtn = document.getElementById('btnCloseCertModal');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    document.getElementById('btnPrintCertificate')?.addEventListener('click', () => {
      window.print();
    });
  },

  async openCertificateModal(batchId) {
    const batches = await ApiClient.getBatches();
    const batch = batches.find(b => b.batch_id === batchId);
    if (!batch) return;

    document.getElementById('certBatchId').textContent = batch.batch_id;
    document.getElementById('certEstate').textContent = batch.lokasi_kebun || 'Kebun PKS Sawit Makmur';
    document.getElementById('certHarvestTime').textContent = (batch.tanggal_panen || '').replace('T', ' ').slice(0, 16);
    document.getElementById('certTestTime').textContent = (batch.created_at || new Date().toISOString()).replace('T', ' ').slice(0, 16);
    document.getElementById('certHoldHours').textContent = `${batch.lama_penyimpanan_jam} Jam`;
    document.getElementById('certWeight').textContent = `${batch.berat_ton || 25} Ton Metrik`;
    document.getElementById('certFfa').textContent = `${batch.kadar_ffa_percent} %`;
    document.getElementById('certPh').textContent = `${batch.pH}`;
    document.getElementById('certMoisture').textContent = `${batch.moisture_percent} %`;
    document.getElementById('certViscosity').textContent = `${batch.viskositas_mPa_s} mPa.s`;
    document.getElementById('certAllocation').textContent = batch.primary_recommendation || batch.allocation;
    document.getElementById('certTrack').textContent = batch.track_type === 'DEFAULT' ? 'DEFAULT TRACK (CPO Pangan Standar SNI 7709)' : 'FLEX TRACK (AI Deep Allocation)';
    document.getElementById('certConfidence').textContent = `${batch.confidence_score || 95}%`;
    document.getElementById('certStamp').textContent = batch.category === 'BIO_ECO_FRIENDLY' ? 'LULUS ECO-CERT' : (batch.track_type === 'DEFAULT' ? 'FOOD GRADE PASSED' : 'INDUSTRIAL RECOVERY');

    document.getElementById('certModal')?.classList.add('active');
  },

  /**
   * Export batch data as CSV or JSON
   */
  initExportButtons() {
    document.getElementById('btnExportCsv')?.addEventListener('click', async () => {
      const batches = await ApiClient.getBatches();
      if (!batches.length) return;

      const headers = ['ID', 'Kebun', 'Tanggal Panen', 'Hold Time (Jam)', 'Berat (Ton)', 'FFA (%)', 'pH', 'Air (%)', 'Viskositas (mPa.s)', 'Alokasi Rekomendasi', 'Jalur'];
      const rows = batches.map(b => [
        b.batch_id,
        `"${b.lokasi_kebun || ''}"`,
        b.tanggal_panen,
        b.lama_penyimpanan_jam,
        b.berat_ton,
        b.kadar_ffa_percent,
        b.pH,
        b.moisture_percent,
        b.viskositas_mPa_s,
        `"${b.primary_recommendation}"`,
        b.track_type
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PalmQual_Batch_Export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.showToast('Data berhasil diunduh dalam format CSV.', 'success');
    });

    document.getElementById('btnExportJson')?.addEventListener('click', async () => {
      const batches = await ApiClient.getBatches();
      const blob = new Blob([JSON.stringify(batches, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PalmQual_Batch_Data_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      window.showToast('Data berhasil diunduh dalam format JSON.', 'success');
    });
  },

  /**
   * Settings & API Key handler
   */
  initSettings() {
    const apiKeyInput = document.getElementById('inputGeminiApiKey');
    if (apiKeyInput) {
      apiKeyInput.value = GeminiService.getApiKey();
    }

    document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
      const key = document.getElementById('inputGeminiApiKey')?.value;
      GeminiService.setApiKey(key);
      window.showToast('Pengaturan sistem dan API Key berhasil disimpan!', 'success');
    });
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PalmApp.init();

  // Search and filter listeners
  document.getElementById('searchBatchInput')?.addEventListener('input', () => PalmApp.loadBatchesFromApi());
  document.getElementById('filterBatchTrack')?.addEventListener('change', () => PalmApp.loadBatchesFromApi());
  document.getElementById('btnSaveBatch')?.addEventListener('click', () => PalmApp.saveCurrentAsBatch());
  document.getElementById('btnResetBatches')?.addEventListener('click', () => PalmApp.resetMockBatches());
});

if (typeof window !== 'undefined') {
  window.PalmApp = PalmApp;
}
