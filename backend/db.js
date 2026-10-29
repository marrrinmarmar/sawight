/**
 * PalmQual-AI - Database Persistence Layer (JSON File Store)
 * Thread-safe file-backed repository for palm oil harvest batches
 */

const fs = require('fs');
const path = require('path');
const { evaluateRuleBased } = require('./engine');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'batches.json');

const INITIAL_MOCK_BATCHES = [
  {
    batch_id: 'LOT-20261029-01',
    lokasi_kebun: 'Kebun Riau Afdeling 1 - Blok A-08',
    tanggal_panen: '2026-10-29T05:30:00.000Z',
    lama_penyimpanan_jam: 8.0,
    warna: 'Sangat Merah Kecoklatan',
    viskositas_mPa_s: 44,
    pH: 6.4,
    kadar_ffa_percent: 1.65,
    moisture_percent: 0.15,
    berat_ton: 42.5,
    track_type: 'DEFAULT',
    category: 'CPO_DEFAULT',
    primary_recommendation: 'Minyak Sawit Konsumsi Super (Cooking Oil Grade A - SNI 7709)',
    alternate_recommendation: 'Biofuel HVO Premium (Green Aviation Fuel Blend)',
    confidence_score: 97.2,
    ai_explanation: 'Kadar FFA 1.65% dan hold time 8 jam menunjukkan mutu prima untuk minyak goreng konsumsi SNI 7709.',
    action_steps: [
      'Sterilisasi TBS 90 menit pada 3.0 bar.',
      'Ekstraksi screw press dan pemurnian klarifikasi.',
      'Refinery dan fraksinasi Olein super.'
    ],
    status: 'Dispatched ke Refinery Pangan',
    created_at: '2026-10-29T06:00:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-02',
    lokasi_kebun: 'Kebun Sumut Langkat - Blok B-12',
    tanggal_panen: '2026-10-28T16:00:00.000Z',
    lama_penyimpanan_jam: 18.0,
    warna: 'Kuning Emas',
    viskositas_mPa_s: 48,
    pH: 6.1,
    kadar_ffa_percent: 2.85,
    moisture_percent: 0.22,
    berat_ton: 35.0,
    track_type: 'DEFAULT',
    category: 'CPO_DEFAULT',
    primary_recommendation: 'Produksi Minyak Sawit Standar (CPO Pangan / PORAM Standard)',
    alternate_recommendation: 'Biofuel Biodiesel Mandat B35/B40',
    confidence_score: 93.4,
    ai_explanation: 'Memenuhi spesifikasi CPO standar pangan (FFA 2.85% <= 5%, Hold Time 18 jam <= 24 jam).',
    action_steps: [
      'Sterilisasi cepat TBS untuk mencegah kenaikan FFA.',
      'Pemurnian centrifuge dan vakum drying.',
      'Kirim ke tangki timbun CPO ekspor.'
    ],
    status: 'Dispatched ke Tangki CPO',
    created_at: '2026-10-29T07:15:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-03',
    lokasi_kebun: 'Kebun Kalteng Sampit - Blok E-04',
    tanggal_panen: '2026-10-28T12:00:00.000Z',
    lama_penyimpanan_jam: 23.0,
    warna: 'Kuning Emas',
    viskositas_mPa_s: 52,
    pH: 5.8,
    kadar_ffa_percent: 3.40,
    moisture_percent: 0.32,
    berat_ton: 55.0,
    track_type: 'FLEX',
    category: 'BIO_ECO_FRIENDLY',
    primary_recommendation: 'Renewable Diesel (HVO / Green Diesel) & Bio-Aviation SAF',
    alternate_recommendation: 'Biodiesel FAME Mandat B35/B40',
    confidence_score: 95.1,
    ai_explanation: 'Kadar FFA moderat (3.4%) dan kelembaban rendah (0.32%) sangat ideal untuk proses hydrotreated vegetable oil (HVO).',
    action_steps: [
      'Pre-treatment deep degumming memangkas kadar fosfor < 5 ppm.',
      'Arahkan ke reaktor hydrodeoxygenation (HDO) katalitik.',
      'Hydroisomerization menghasilkan Green Diesel angka setana > 70.'
    ],
    status: 'Dispatched ke Eco-Fuel Refinery',
    created_at: '2026-10-29T08:00:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-04',
    lokasi_kebun: 'Kebun Jambi Muaro - Blok D-19',
    tanggal_panen: '2026-10-27T18:00:00.000Z',
    lama_penyimpanan_jam: 38.0,
    warna: 'Gelap Pucat',
    viskositas_mPa_s: 62,
    pH: 5.4,
    kadar_ffa_percent: 5.20,
    moisture_percent: 0.48,
    berat_ton: 48.0,
    track_type: 'FLEX',
    category: 'BIO_ECO_FRIENDLY',
    primary_recommendation: 'Biofuel Biodiesel FAME (Fatty Acid Methyl Ester) Mandat B35/B40',
    alternate_recommendation: 'Sabun Organik Ramah Lingkungan / Bio-Surfactant',
    confidence_score: 91.5,
    ai_explanation: 'FFA 5.2% dan hold time 38 jam telah melebihi standar pangan, namun ideal untuk transesterifikasi biodiesel FAME.',
    action_steps: [
      'Pra-pengolahan esterifikasi asam untuk menurunkan FFA < 1%.',
      'Transesterifikasi basa dengan Sodium Metoksida 65°C.',
      'Pemisahan fase gliserol dan dry washing metil ester.'
    ],
    status: 'Dispatched ke Unit Esterifikasi',
    created_at: '2026-10-29T09:30:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-05',
    lokasi_kebun: 'Kebun Kalbar Ketapang - Blok G-02',
    tanggal_panen: '2026-10-27T10:00:00.000Z',
    lama_penyimpanan_jam: 47.0,
    warna: 'Teroksidasi Gelap',
    viskositas_mPa_s: 76,
    pH: 5.1,
    kadar_ffa_percent: 7.80,
    moisture_percent: 0.65,
    berat_ton: 30.5,
    track_type: 'FLEX',
    category: 'BIO_ECO_FRIENDLY',
    primary_recommendation: 'Bioplastik & Polimer Alami (PHA / Polyhydroxyalkanoates)',
    alternate_recommendation: 'Biofuel Biodiesel FAME B35 / Bio-Pellet',
    confidence_score: 88.6,
    ai_explanation: 'Viskositas tinggi (76 mPa.s) dengan fraksi asam lemak bebas menjadikannya substrat karbon bagi bakteri bioplastik PHA.',
    action_steps: [
      'Emulsifikasi bahan baku dengan homogenizer tekanan tinggi.',
      'Fermentasi mikroba Cupriavidus necator dalam bioreaktor.',
      'Lisis sel enzimatik ramah lingkungan untuk resin bioplastik.'
    ],
    status: 'Dispatched ke Unit Bio-Resin',
    created_at: '2026-10-29T10:00:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-06',
    lokasi_kebun: 'Kebun Sumsel Banyuasin - Blok F-11',
    tanggal_panen: '2026-10-26T20:00:00.000Z',
    lama_penyimpanan_jam: 58.0,
    warna: 'Teroksidasi Gelap',
    viskositas_mPa_s: 92,
    pH: 4.8,
    kadar_ffa_percent: 12.40,
    moisture_percent: 0.95,
    berat_ton: 62.0,
    track_type: 'FLEX',
    category: 'OTHER_PRODUCTS',
    primary_recommendation: 'Oleokimia Industri Non-Biofuel (Fatty Acids & Glycerol Splitting)',
    alternate_recommendation: 'Pakan Ternak Formula Kalsium (Bypass Fat)',
    confidence_score: 90.2,
    ai_explanation: 'Tingkat hidrolisis lanjutan (FFA 12.4%) sangat bernilai untuk splitting termal asam lemak murni industri non-pangan.',
    action_steps: [
      'Kirim ke unit Thermal Fat Splitting suhu 250°C, 50 bar.',
      'Ekstraksi sweet water untuk gliserin teknis.',
      'Distilasi fraksional vakum asam lemak.'
    ],
    status: 'Dispatched ke Splitting Plant',
    created_at: '2026-10-29T11:00:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-07',
    lokasi_kebun: 'Kebun Riau Siak - Blok C-07',
    tanggal_panen: '2026-10-26T08:00:00.000Z',
    lama_penyimpanan_jam: 72.0,
    warna: 'Teroksidasi Gelap',
    viskositas_mPa_s: 105,
    pH: 4.5,
    kadar_ffa_percent: 16.50,
    moisture_percent: 1.20,
    berat_ton: 28.0,
    track_type: 'FLEX',
    category: 'OTHER_PRODUCTS',
    primary_recommendation: 'Pakan Ternak Tinggi Energi (Palm Calcium Soap / Bypass Fat)',
    alternate_recommendation: 'Pupuk Kompos Biologis & Biogas Metana',
    confidence_score: 89.1,
    ai_explanation: 'Kandungan asam lemak terhidrolisis tinggi dapat diproteksi menjadi sabun kalsium rumen-bypass untuk ternak ruminansia.',
    action_steps: [
      'Penyaringan mekanis dan pasteurisasi 85°C.',
      'Saponifikasi kalsium dengan CaO.',
      'Prilling dan granulasi konsentrat pakan.'
    ],
    status: 'Dispatched ke Pabrik Pakan',
    created_at: '2026-10-29T12:00:00.000Z'
  },
  {
    batch_id: 'LOT-20261029-08',
    lokasi_kebun: 'Kebun Aceh Tamiang - Blok H-15',
    tanggal_panen: '2026-10-25T14:00:00.000Z',
    lama_penyimpanan_jam: 89.0,
    warna: 'Teroksidasi Gelap',
    viskositas_mPa_s: 125,
    pH: 4.1,
    kadar_ffa_percent: 23.50,
    moisture_percent: 2.10,
    berat_ton: 34.0,
    track_type: 'FLEX',
    category: 'OTHER_PRODUCTS',
    primary_recommendation: 'Pupuk Kompos Biologis & Pembangkit Biogas Metana',
    alternate_recommendation: 'Pembuangan Residu Terkontrol (Safe Bio-Incineration)',
    confidence_score: 94.8,
    ai_explanation: 'Batch terdegradasi biologis berat (FFA 23.5%, pH 4.1). Sangat efektif untuk ko-digestasi biodigester biogas dan kompos.',
    action_steps: [
      'Alirkan substrat ke biodigester anaerobik untuk biogas metana.',
      'Campur bio-slurry dengan cacahan tandan kosong (EFB).',
      'Windrow composting aerobik 35 hari untuk pupuk organik.'
    ],
    status: 'Dispatched ke Composting Yard',
    created_at: '2026-10-29T13:00:00.000Z'
  }
];

class BatchRepository {
  constructor() {
    this.ensureDbInitialized();
  }

  ensureDbInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      this.saveBatches(INITIAL_MOCK_BATCHES);
    }
  }

  loadBatches() {
    try {
      this.ensureDbInitialized();
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[DB Load Error] Reverting to defaults:', err.message);
      this.saveBatches(INITIAL_MOCK_BATCHES);
      return [...INITIAL_MOCK_BATCHES];
    }
  }

  saveBatches(batches) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(batches, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[DB Save Error]:', err.message);
      return false;
    }
  }

  getAll() {
    return this.loadBatches();
  }

  getById(batchId) {
    const batches = this.loadBatches();
    return batches.find(b => b.batch_id === batchId) || null;
  }

  create(data, evaluationResult = null) {
    const batches = this.loadBatches();

    // Generate or use ID
    const batch_id = data.batch_id || `LOT-${Date.now().toString().slice(-6)}`;
    
    // Run evaluation if not already evaluated
    const evaluation = evaluationResult || evaluateRuleBased({
      ...data,
      batch_id
    });

    const newBatch = {
      batch_id,
      lokasi_kebun: data.lokasi_kebun || 'Kebun PKS Sawit Makmur',
      tanggal_panen: data.tanggal_panen || new Date().toISOString(),
      lama_penyimpanan_jam: Number(data.lama_penyimpanan_jam) || 0,
      warna: data.warna || 'Sangat Merah Kecoklatan',
      viskositas_mPa_s: Number(data.viskositas_mPa_s) || 45,
      pH: Number(data.pH) || 6.0,
      kadar_ffa_percent: Number(data.kadar_ffa_percent) || 2.0,
      moisture_percent: Number(data.moisture_percent) || 0.2,
      berat_ton: Number(data.berat_ton) || 25.0,
      track_type: evaluation.track_type,
      category: evaluation.category,
      primary_recommendation: evaluation.primary_recommendation,
      alternate_recommendation: evaluation.alternate_recommendation,
      confidence_score: evaluation.confidence_score,
      ai_explanation: evaluation.ai_explanation,
      action_steps: evaluation.action_steps,
      status: `Dispatched ke ${evaluation.primary_recommendation.split('/')[0].trim()}`,
      created_at: new Date().toISOString(),
      details: evaluation.details || {}
    };

    // Prepend to list
    batches.unshift(newBatch);
    this.saveBatches(batches);
    return newBatch;
  }

  delete(batchId) {
    const batches = this.loadBatches();
    const filtered = batches.filter(b => b.batch_id !== batchId);
    if (filtered.length === batches.length) {
      return false;
    }
    this.saveBatches(filtered);
    return true;
  }

  reset() {
    this.saveBatches(INITIAL_MOCK_BATCHES);
    return [...INITIAL_MOCK_BATCHES];
  }

  getStatistics() {
    const batches = this.loadBatches();
    const total = batches.length;
    if (total === 0) {
      return {
        total_batches: 0,
        total_tonnage: 0,
        avg_ffa: 0,
        avg_hold_time: 0,
        distribution: { cpo_default: 0, bio_eco_friendly: 0, other_products: 0 }
      };
    }

    let sumTonnage = 0;
    let sumFfa = 0;
    let sumHold = 0;
    let cpoCount = 0;
    let bioCount = 0;
    let otherCount = 0;

    batches.forEach(b => {
      sumTonnage += Number(b.berat_ton) || 0;
      sumFfa += Number(b.kadar_ffa_percent) || 0;
      sumHold += Number(b.lama_penyimpanan_jam) || 0;

      if (b.category === 'CPO_DEFAULT') cpoCount++;
      else if (b.category === 'BIO_ECO_FRIENDLY') bioCount++;
      else otherCount++;
    });

    return {
      total_batches: total,
      total_tonnage: Math.round(sumTonnage * 10) / 10,
      avg_ffa: Number((sumFfa / total).toFixed(2)),
      avg_hold_time: Number((sumHold / total).toFixed(1)),
      distribution: {
        cpo_default: cpoCount,
        bio_eco_friendly: bioCount,
        other_products: otherCount,
        cpo_percent: Math.round((cpoCount / total) * 100),
        bio_percent: Math.round((bioCount / total) * 100),
        other_percent: Math.round((otherCount / total) * 100)
      }
    };
  }
}

module.exports = new BatchRepository();
