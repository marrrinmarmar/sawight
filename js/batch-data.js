/**
 * PalmQual-AI - Batch Data Management & LocalStorage Persistence
 * Preloaded with realistic Indonesian mill batches and full CRUD operations
 */

const BatchDataManager = {
  STORAGE_KEY: 'palmqual_batches_v1',

  DEFAULT_BATCHES: [
    {
      id: 'BATCH-2026-001',
      estateName: 'Kebun Riau Afdeling 1 - Blok A-08',
      harvestDate: '2026-10-29T05:30',
      testDate: '2026-10-29T13:30',
      holdTime: 8.0,
      weightTon: 42.5,
      ffa: 1.65,
      ph: 6.4,
      moisture: 0.15,
      viscosity: 44,
      colorCategory: 'sangat-merah',
      ambientTemp: 28,
      track: 'DEFAULT_TRACK',
      allocation: 'Minyak Sawit Konsumsi Super (Cooking Oil Grade A)',
      subTrack: 'COOKING_OIL',
      confidence: 97,
      status: 'Dispatched ke Refinery Pangan'
    },
    {
      id: 'BATCH-2026-002',
      estateName: 'Kebun Sumut Langkat - Blok B-12',
      harvestDate: '2026-10-28T16:00',
      testDate: '2026-10-29T10:00',
      holdTime: 18.0,
      weightTon: 35.0,
      ffa: 2.85,
      ph: 6.1,
      moisture: 0.22,
      viscosity: 48,
      colorCategory: 'kuning-emas',
      ambientTemp: 30,
      track: 'DEFAULT_TRACK',
      allocation: 'Produksi Minyak Sawit Standar (CPO Pangan / PORAM)',
      subTrack: 'COOKING_OIL',
      confidence: 93,
      status: 'Dispatched ke Tangki CPO'
    },
    {
      id: 'BATCH-2026-003',
      estateName: 'Kebun Kalteng Sampit - Blok E-04',
      harvestDate: '2026-10-28T12:00',
      testDate: '2026-10-29T11:00',
      holdTime: 23.0,
      weightTon: 55.0,
      ffa: 3.40,
      ph: 5.8,
      moisture: 0.32,
      viscosity: 52,
      colorCategory: 'kuning-emas',
      ambientTemp: 31,
      track: 'FLEX_TRACK',
      allocation: 'Biofuel HVO (Hydrotreated Vegetable Oil / Green Diesel)',
      subTrack: 'BIO_ECO',
      confidence: 95,
      status: 'Dispatched ke Eco-Fuel Refinery'
    },
    {
      id: 'BATCH-2026-004',
      estateName: 'Kebun Jambi Muaro - Blok D-19',
      harvestDate: '2026-10-27T18:00',
      testDate: '2026-10-29T08:00',
      holdTime: 38.0,
      weightTon: 48.0,
      ffa: 5.20,
      ph: 5.4,
      moisture: 0.48,
      viscosity: 62,
      colorCategory: 'gelap-pucat',
      ambientTemp: 32,
      track: 'FLEX_TRACK',
      allocation: 'Biofuel Biodiesel FAME (Mandat Solar B35/B40)',
      subTrack: 'BIO_ECO',
      confidence: 91,
      status: 'Dispatched ke Unit Esterifikasi'
    },
    {
      id: 'BATCH-2026-005',
      estateName: 'Kebun Kalbar Ketapang - Blok G-02',
      harvestDate: '2026-10-27T10:00',
      testDate: '2026-10-29T09:00',
      holdTime: 47.0,
      weightTon: 30.5,
      ffa: 7.80,
      ph: 5.1,
      moisture: 0.65,
      viscosity: 76,
      colorCategory: 'gelap-teroksidasi',
      ambientTemp: 33,
      track: 'FLEX_TRACK',
      allocation: 'Bioplastik & Polimer Bio-Degradable (PHA)',
      subTrack: 'BIO_ECO',
      confidence: 88,
      status: 'Dispatched ke Unit Bio-Resin'
    },
    {
      id: 'BATCH-2026-006',
      estateName: 'Kebun Sumsel Banyuasin - Blok F-11',
      harvestDate: '2026-10-26T20:00',
      testDate: '2026-10-29T06:00',
      holdTime: 58.0,
      weightTon: 62.0,
      ffa: 12.40,
      ph: 4.8,
      moisture: 0.95,
      viscosity: 92,
      colorCategory: 'gelap-teroksidasi',
      ambientTemp: 30,
      track: 'FLEX_TRACK',
      allocation: 'Oleokimia Industri Non-Biofuel (Fatty Acids)',
      subTrack: 'OTHER',
      confidence: 90,
      status: 'Dispatched ke Splitting Plant'
    },
    {
      id: 'BATCH-2026-007',
      estateName: 'Kebun Riau Siak - Blok C-07',
      harvestDate: '2026-10-26T08:00',
      testDate: '2026-10-29T08:00',
      holdTime: 72.0,
      weightTon: 28.0,
      ffa: 16.50,
      ph: 4.5,
      moisture: 1.20,
      viscosity: 105,
      colorCategory: 'gelap-teroksidasi',
      ambientTemp: 32,
      track: 'FLEX_TRACK',
      allocation: 'Pakan Ternak Tinggi Energi (Calcium Bypass Fat)',
      subTrack: 'OTHER',
      confidence: 89,
      status: 'Dispatched ke Pabrik Pakan'
    },
    {
      id: 'BATCH-2026-008',
      estateName: 'Kebun Aceh Tamiang - Blok H-15',
      harvestDate: '2026-10-25T14:00',
      testDate: '2026-10-29T07:00',
      holdTime: 89.0,
      weightTon: 34.0,
      ffa: 23.50,
      ph: 4.1,
      moisture: 2.10,
      viscosity: 125,
      colorCategory: 'gelap-teroksidasi',
      ambientTemp: 31,
      track: 'FLEX_TRACK',
      allocation: 'Pupuk Kompos Biologis & Biogas Methane',
      subTrack: 'OTHER',
      confidence: 94,
      status: 'Dispatched ke Composting Yard'
    }
  ],

  /**
   * Get all stored batches or default ones
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    // Initialize defaults
    this.saveAll(this.DEFAULT_BATCHES);
    return [...this.DEFAULT_BATCHES];
  },

  /**
   * Save array of batches
   */
  saveAll(batches) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(batches));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  /**
   * Get single batch by ID
   */
  getById(id) {
    const list = this.getAll();
    return list.find(b => b.id === id);
  },

  /**
   * Add new batch
   */
  addBatch(batch) {
    const list = this.getAll();
    list.unshift(batch);
    this.saveAll(list);
    return list;
  },

  /**
   * Delete batch by ID
   */
  deleteBatch(id) {
    const list = this.getAll().filter(b => b.id !== id);
    this.saveAll(list);
    return list;
  },

  /**
   * Reset to original mock data
   */
  resetToDefaults() {
    this.saveAll(this.DEFAULT_BATCHES);
    return [...this.DEFAULT_BATCHES];
  },

  /**
   * Compute operational summary KPI statistics
   */
  getStatistics() {
    const batches = this.getAll();
    const count = batches.length;
    if (count === 0) {
      return {
        totalBatches: 0,
        totalTonnage: 0,
        avgFfa: 0,
        avgHoldTime: 0,
        trackDefaultCount: 0,
        trackBioCount: 0,
        trackOtherCount: 0,
        defaultPct: 0,
        bioPct: 0,
        otherPct: 0
      };
    }

    let totalTon = 0;
    let sumFfa = 0;
    let sumHold = 0;
    let defaultCount = 0;
    let bioCount = 0;
    let otherCount = 0;

    batches.forEach(b => {
      totalTon += (Number(b.weightTon) || 0);
      sumFfa += (Number(b.ffa) || 0);
      sumHold += (Number(b.holdTime) || 0);

      if (b.track === 'DEFAULT_TRACK') {
        defaultCount++;
      } else if (b.subTrack === 'BIO_ECO') {
        bioCount++;
      } else {
        otherCount++;
      }
    });

    return {
      totalBatches: count,
      totalTonnage: Math.round(totalTon * 10) / 10,
      avgFfa: (sumFfa / count).toFixed(2),
      avgHoldTime: (sumHold / count).toFixed(1),
      trackDefaultCount: defaultCount,
      trackBioCount: bioCount,
      trackOtherCount: otherCount,
      defaultPct: Math.round((defaultCount / count) * 100),
      bioPct: Math.round((bioCount / count) * 100),
      otherPct: Math.round((otherCount / count) * 100)
    };
  }
};

if (typeof window !== 'undefined') {
  window.BatchDataManager = BatchDataManager;
}
