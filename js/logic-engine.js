/**
 * PalmQual-AI - Decision & Recommendation Logic Engine
 * Scientific Biochemical Quality Analysis & Multi-Level Downstream Allocation
 */

const PalmLogicEngine = {
  // Default thresholds for standard cooking oil / CPO
  THRESHOLDS: {
    DEFAULT_MAX_HOLD_TIME: 24.0,   // hours
    DEFAULT_MAX_FFA: 3.5,          // %
    DEFAULT_MIN_PH: 5.8,
    DEFAULT_MAX_PH: 6.8,
    DEFAULT_MAX_MOISTURE: 0.25,    // %
    DEFAULT_COLORS: ['sangat-merah', 'kuning-emas'],
    
    // Bio-Product Thresholds
    HVO_MAX_FFA: 4.2,
    HVO_MIN_PH: 5.6,
    HVO_MAX_MOISTURE: 0.35,
    
    FAME_MAX_FFA: 7.0,
    FAME_MIN_PH: 5.2,
    
    BIOPLASTIC_MIN_VISCOSITY: 65,  // cSt
    BIOPLASTIC_MAX_FFA: 10.0,
    
    ORGANIC_SOAP_MAX_FFA: 9.5,
    
    // Non-Bio / Secondary Thresholds
    OLEO_MAX_FFA: 16.0,
    FEED_MAX_FFA: 18.0,
    COMPOST_MIN_FFA: 18.0
  },

  /**
   * Main analysis entrypoint
   * @param {Object} params - Sample input parameters
   * @returns {Object} Comprehensive analysis and allocation decision
   */
  analyze(params) {
    const {
      holdTime = 12,
      ffa = 2.1,
      ph = 6.2,
      moisture = 0.18,
      viscosity = 45,
      colorCategory = 'sangat-merah',
      ambientTemp = 29,
      batchWeight = 25.0
    } = params;

    // Step 1: Evaluate Default Track (Standard CPO / Cooking Oil)
    const defaultViolations = [];
    if (holdTime > this.THRESHOLDS.DEFAULT_MAX_HOLD_TIME) {
      defaultViolations.push(`Hold Time (${holdTime} jam) melebihi batas simpan segar (≤ 24 jam)`);
    }
    if (ffa > this.THRESHOLDS.DEFAULT_MAX_FFA) {
      defaultViolations.push(`Kadar FFA (${ffa}%) melebihi standar pangan CPO konsumsi (≤ ${this.THRESHOLDS.DEFAULT_MAX_FFA}%)`);
    }
    if (ph < this.THRESHOLDS.DEFAULT_MIN_PH || ph > this.THRESHOLDS.DEFAULT_MAX_PH) {
      defaultViolations.push(`pH (${ph}) berada di luar rentang netral-asam CPO konsumsi (${this.THRESHOLDS.DEFAULT_MIN_PH} - ${this.THRESHOLDS.DEFAULT_MAX_PH})`);
    }
    if (moisture > this.THRESHOLDS.DEFAULT_MAX_MOISTURE) {
      defaultViolations.push(`Kadar air (${moisture}%) melebihi batas degradasi mikroba (≤ ${this.THRESHOLDS.DEFAULT_MAX_MOISTURE}%)`);
    }
    if (!this.THRESHOLDS.DEFAULT_COLORS.includes(colorCategory)) {
      defaultViolations.push(`Warna (${colorCategory}) menunjukkan indikasi oksidasi / penuaan pigmen karotenoid`);
    }

    const isDefaultTrack = defaultViolations.length === 0;

    let route = '';
    let category = '';
    let subCategory = '';
    let alternativeCategory = '';
    let isBioProduct = false;
    let confidence = 0;
    let scientificReason = '';
    let downstreamSOP = [];
    let carbonSavingsKg = 0;
    let estimatedValueIDR = 0;
    let activePathIds = [];

    if (isDefaultTrack) {
      // ---------------- DEFAULT TRACK ----------------
      route = 'DEFAULT_TRACK';
      activePathIds = ['path-1', 'path-2', 'path-3', 'path-default'];
      
      if (ffa <= 2.2 && holdTime <= 16) {
        category = 'Minyak Sawit Konsumsi Super (Cooking Oil Grade A - SNI 7709)';
        subCategory = 'Premium Olein / Golden Cooking Oil';
        alternativeCategory = 'Biofuel HVO Premium (Green Aviation Fuel Blend)';
        confidence = Math.min(99, Math.round(98 - (ffa * 1.5) - (holdTime * 0.2)));
        estimatedValueIDR = Math.round(batchWeight * 14800000); // Rp 14.8jt/ton
        carbonSavingsKg = Math.round(batchWeight * 620);
      } else {
        category = 'Produksi Minyak Sawit Standar (CPO Pangan / Refinery Grade)';
        subCategory = 'Crude Palm Oil (PORAM Export Standard)';
        alternativeCategory = 'Biofuel HVO / Biodiesel Mandat B35';
        confidence = Math.min(96, Math.round(94 - (ffa * 2.0) - (holdTime * 0.3)));
        estimatedValueIDR = Math.round(batchWeight * 13500000); // Rp 13.5jt/ton
        carbonSavingsKg = Math.round(batchWeight * 580);
      }

      scientificReason = `Batch diproses dalam kurun waktu optimum (${holdTime} jam) sebelum enzim endogen lipase pada mesocarp buah teraktivasi secara masif. Nilai FFA (${ffa}%) dan pH (${ph}) menunjukkan integritas trigliserida sangat utuh, dengan laju oksidasi peroksida yang sangat rendah. Kadar air ${moisture}% meminimalkan risiko hidrolisis selama pemurnian fraksinasi.`;

      downstreamSOP = [
        { step: 1, title: 'Sterilisasi TBS (Sterilization)', desc: 'Pengukusan uap tekanan 3.0 bar selama 90 menit untuk menginaktivasi total enzim lipase.' },
        { step: 2, title: 'Penebahan & Kempa (Threshing & Pressing)', desc: 'Pemisahan buah dari janjangan dan ekstraksi minyak mekanis menggunakan screw press.' },
        { step: 3, title: 'Klarifikasi & Pemurnian (Clarification)', desc: 'Pemisahan sludge dan air menggunakan settling tank dan continuous centrifuge.' },
        { step: 4, title: 'Refinery & Fraksinasi Konsumsi', desc: 'Degumming asam fosfat, bleaching bleaching earth, deodarisasi vakum untuk memproduksi Fraksi Olein (Minyak Goreng) dan Stearin.' }
      ];

    } else {
      // ---------------- FLEX TRACK (AI DEEP ANALYSIS) ----------------
      route = 'FLEX_TRACK';
      activePathIds = ['path-1', 'path-2', 'path-3', 'path-flex'];

      // Evaluate Suitability for Bio / Eco-Friendly Products vs Other Products
      // Criteria Bio-Product: FFA <= 10.0%, pH >= 5.0, moisture <= 0.8%
      const meetsBioEcoCriteria = ffa <= 10.0 && ph >= 4.9 && moisture <= 1.0;

      if (meetsBioEcoCriteria) {
        // Bio / Eco-Friendly Products (YES)
        isBioProduct = true;
        activePathIds.push('path-bio-yes', 'path-diolah');

        if (ffa <= this.THRESHOLDS.HVO_MAX_FFA && ph >= this.THRESHOLDS.HVO_MIN_PH && moisture <= this.THRESHOLDS.HVO_MAX_MOISTURE) {
          // HVO / Green Diesel
          category = 'Biofuel HVO (Hydrotreated Vegetable Oil / Green Diesel)';
          subCategory = 'Drop-in Renewable Diesel (Standar Euro 5/6)';
          alternativeCategory = 'Biodiesel FAME B35 / B40 Mandat Nasional';
          confidence = Math.min(97, Math.round(95 - (ffa * 1.8) - (moisture * 5)));
          estimatedValueIDR = Math.round(batchWeight * 15200000); // High premium eco-fuel
          carbonSavingsKg = Math.round(batchWeight * 1850); // Massive GHG reduction
          
          scientificReason = `Profil trigliserida memiliki FFA moderat (${ffa}%) dan kelembaban rendah (${moisture}%), sangat ideal untuk proses deoksigenasi dan perengkahan hidrogenasi katalitik (HDO) tanpa meracuni katalis Ni-Mo/Al2O3. Menghasilkan paraffin rantai lurus dengan angka setana >70 dan nol sulfur.`;

          downstreamSOP = [
            { step: 1, title: 'Pre-Treatment Deep Degumming', desc: 'Penghilangan fosfolipid (gum) hingga kadar P < 5 ppm dan logam alkali dengan asam sitrat/silika.' },
            { step: 2, title: 'Hydrodeoxygenation (HDO)', desc: 'Reaksi hidrogenasi pada reaktor 300-380°C, 50-80 bar untuk memecah ikatan oksigen menjadi alkana.' },
            { step: 3, title: 'Hydroisomerization', desc: 'Penataan ulang rantai hidrokarbon menjadi iso-paraffin untuk mencapai titik tuang (cold flow) -15°C.' },
            { step: 4, title: 'Fraksinasi Green Diesel', desc: 'Distilasi presisi untuk memisahkan Green Diesel, Green Naphtha, dan Renewable Jet Fuel (SAF).' }
          ];

        } else if (ffa <= this.THRESHOLDS.FAME_MAX_FFA) {
          // Biodiesel FAME
          category = 'Biofuel Biodiesel FAME (Fatty Acid Methyl Ester)';
          subCategory = 'Bahan Baku Mandat Campuran Solar B35/B40';
          alternativeCategory = 'Sabun Organik Ramah Lingkungan / Bio-Pellet';
          confidence = Math.min(95, Math.round(92 - (ffa * 1.5)));
          estimatedValueIDR = Math.round(batchWeight * 12800000);
          carbonSavingsKg = Math.round(batchWeight * 1450);

          scientificReason = `FFA (${ffa}%) melampaui batas minyak makan namun berada pada spektrum ideal untuk transesterifikasi FAME. Tingkat viskositas (${viscosity} cSt) dan pH (${ph}) memungkinkan sintesis metil ester dengan yield >98.5% melalui transesterifikasi basa metanol-KOH (atau pra-esterifikasi asam jika FFA > 5%).`;

          downstreamSOP = [
            { step: 1, title: 'Acid Pre-Esterification', desc: 'Reaksi metanol + asam sulfat katalis 60°C untuk mereduksi FFA hingga < 1%.' },
            { step: 2, title: 'Alkaline Transesterification', desc: 'Reaksi transesterifikasi utama menggunakan Sodium Metoksida (CH3ONa) pada 65°C.' },
            { step: 3, title: 'Pemisahan Gliserol Kasar', desc: 'Sentrifugasi untuk memisahkan fase FAME atas dan fase gliserol mentah bawah.' },
            { step: 4, title: 'Dry Washing & Polishing', desc: 'Pemurnian adsorben ion-exchange resin untuk mencapai kemurnian metil ester SNI 7182.' }
          ];

        } else if (viscosity >= this.THRESHOLDS.BIOPLASTIC_MIN_VISCOSITY || colorCategory === 'gelap-teroksidasi') {
          // Bioplastik / Bio-Resin / PHA
          category = 'Bioplastik & Polimer Bio-Degradable (PHA / Polyhydroxyalkanoates)';
          subCategory = 'Substrat Fermentasi Bio-Material Ramah Lingkungan';
          alternativeCategory = 'Bio-pellet Padat Energi Biomassa';
          confidence = Math.min(93, Math.round(89 - (Math.abs(viscosity - 75) * 0.2)));
          estimatedValueIDR = Math.round(batchWeight * 11500000);
          carbonSavingsKg = Math.round(batchWeight * 1200);

          scientificReason = `Viskositas yang relatif pekat (${viscosity} cSt) dikombinasikan dengan rantai asam lemak bebas teroksidasi sebagian (${ffa}%) menjadikannya media substrat karbon yang sangat kaya bagi bakteri sintesis biopolimer (seperti Ralstonia eutropha / Cupriavidus necator) untuk menghasilkan plastik alami terurai 100%.`;

          downstreamSOP = [
            { step: 1, title: 'Emulsifikasi Substrat', desc: 'Pencampuran substrat lipid dengan medium mineral cair dan homogenizer tekanan tinggi.' },
            { step: 2, title: 'Bioreaktor Fermentasi Bakteri', desc: 'Kultivasi kultur mikroba penghasil granula PHA pada kondisi nitrogen terbatas selama 48 jam.' },
            { step: 3, title: 'Lisis Sel Mikroba', desc: 'Ekstraksi polimer intraseluler menggunakan metode enzimatik ramah lingkungan (non-halogenated).' },
            { step: 4, title: 'Pelletizing Bio-Resin', desc: 'Ekstrusi dan pembentukan butiran pelet bioplastik untuk industri cetak kemasan organik.' }
          ];

        } else {
          // Sabun Organik / Bio-pellet
          category = 'Sabun Organik & Bio-Surfactant Ramah Lingkungan';
          subCategory = 'Eco-Friendly Detergent Base & Natural Castile Soap';
          alternativeCategory = 'Biofuel Biodiesel FAME / Bio-Pellet';
          confidence = 90;
          estimatedValueIDR = Math.round(batchWeight * 10800000);
          carbonSavingsKg = Math.round(batchWeight * 950);

          scientificReason = `Kandungan asam lemak (${ffa}%) sangat mudah bereaksi saponifikasi langsung dengan larutan alkali alami (NaOH / KOH) untuk menghasilkan sabun dengan busa stabil tanpa membutuhkan zat aditif sintetis berbahaya.`;

          downstreamSOP = [
            { step: 1, title: 'Saponifikasi Suhu Rendah (Cold Process)', desc: 'Pencampuran lemak sawit dengan larutan alkali pada 45°C hingga mencapai fase trace.' },
            { step: 2, title: 'Gliserin Retensi Alami', desc: 'Mempertahankan gliseril alami sebagai pelembab ramah lingkungan tanpa de-gliserinasi kimia.' },
            { step: 3, title: 'Curing & Pencetakan Blok', desc: 'Pematangan sabun dalam cetakan selama 3-4 minggu untuk memastikan netralitas pH 8-9.' }
          ];
        }

      } else {
        // Produk Lain (NO to Bio-Product)
        isBioProduct = false;
        activePathIds.push('path-bio-no');

        if (ffa <= this.THRESHOLDS.OLEO_MAX_FFA && ph >= 4.6) {
          // Oleokimia Industri
          category = 'Oleokimia Industri Non-Biofuel (Fatty Acids & Glycerol)';
          subCategory = 'Bahan Baku Pelumas Industri, Lilin, & Emulsifier';
          alternativeCategory = 'Pakan Ternak Formula Tinggi Energi (Animal Feed)';
          confidence = Math.min(94, Math.round(91 - (ffa * 0.8)));
          estimatedValueIDR = Math.round(batchWeight * 9800000);
          carbonSavingsKg = Math.round(batchWeight * 420);

          scientificReason = `Tingkat hidrolisis yang telah mencapai FFA ${ffa}% dan pH ${ph} tidak lagi ekonomis untuk minyak pangan atau biofuel standar, namun sangat ideal untuk unit splitting fraksinasi asam lemak (Fatty Acid Splitting) menjadi asam palmitat, oleat, dan stearat teknis murni.`;

          downstreamSOP = [
            { step: 1, title: 'Thermal Fat Splitting (Colgate-Emery Process)', desc: 'Hidrolisis termal tanpa katalis pada 250-260°C, 50 bar dalam kolom counter-current.' },
            { step: 2, title: 'Pemisahan Sweet Water', desc: 'Pengambilan fase air gliserol encer untuk evaporasi menjadi gliserin teknis.' },
            { step: 3, title: 'Distilasi Fraksional Asam Lemak', desc: 'Pemisahan fraksi asam lemak murni di bawah vakum tinggi untuk bahan kimia industri.' }
          ];

        } else if (ffa <= this.THRESHOLDS.FEED_MAX_FFA && ph >= 4.3) {
          // Pakan Ternak
          category = 'Pakan Ternak Tinggi Energi (Animal Feed Supplement)';
          subCategory = 'Palm Fat Calcium Soap / Suplemen Ruminansia';
          alternativeCategory = 'Pupuk Organik & Biogas Digestasi';
          confidence = Math.min(92, Math.round(88 - (ffa * 0.6)));
          estimatedValueIDR = Math.round(batchWeight * 7800000);
          carbonSavingsKg = Math.round(batchWeight * 310);

          scientificReason = `Batch yang mengalami keterlambatan simpan (${holdTime} jam) telah terurai menjadi asam lemak rantai menengah yang memiliki densitas energi brutto sangat tinggi (~9.000 kkal/kg). Dengan reaksi penyabunan kalsium, lemak ini menjadi bypass fat yang aman bagi rumen ternak sapi perah dan unggas.`;

          downstreamSOP = [
            { step: 1, title: 'Penyaringan Impurities & Pasteurisasi', desc: 'Penyaringan kotoran mekanis dan pemanasan 85°C untuk eliminasi bakteri patogen.' },
            { step: 2, title: 'Saponifikasi Kalsium (Bypass Fat)', desc: 'Reaksi asam lemak dengan kalsium oksida (CaO) untuk membentuk Calcium Salts of Fatty Acids.' },
            { step: 3, title: 'Prilling & Granulasi Pakan', desc: 'Pembentukan granul padat kering berbutir halus yang siap dicampur ke dalam konsentrat pakan.' }
          ];

        } else {
          // Pupuk Organik / Kompos Biologis
          category = 'Pupuk Kompos Biologis & Biogas Methane Generator';
          subCategory = 'Bio-Organic Soil Fertilizer & Anaerobic Digestate';
          alternativeCategory = 'Pembuangan Residu Terkontrol (Controlled Incineration)';
          confidence = 94;
          estimatedValueIDR = Math.round(batchWeight * 4500000);
          carbonSavingsKg = Math.round(batchWeight * 850); // Methane capture saves GHG

          scientificReason = `Penundaan panen ekstrim (${holdTime} jam) telah memicu dekomposisi enzimatik dan mikroba lanjut (FFA ${ffa}%, pH asam ${ph}). Bahan kaya unsur hara N-P-K dan bahan organik ini sangat bernilai jika dialirkan ke unit biometanasi dan windrow composting bersama tandan kosong (EFB).`;

          downstreamSOP = [
            { step: 1, title: 'Ko-Digestasi Anaerobik', desc: 'Pencampuran substrat ke dalam biodigester CSTR tertutup untuk penangkapan gas metana (Biogas listrik).' },
            { step: 2, title: 'Pencampuran Janjangan Kosong (EFB)', desc: 'Pencampuran bio-slurry hasil digestasi dengan cacahan janjangan sawit untuk rasio C/N 25:1.' },
            { step: 3, title: 'Aerobic Windrow Composting', desc: 'Pembalikan tumpukan kompos secara berkala selama 35 hari hingga suhu stabil dan matang.' },
            { step: 4, title: 'Aplikasi Kembali ke Kebun Sawit', desc: 'Pengembalian unsur hara organik ke blok tanaman kelapa sawit untuk regenerasi tanah.' }
          ];
        }
      }
    }

    return {
      route,                  // 'DEFAULT_TRACK' or 'FLEX_TRACK'
      isDefaultTrack,
      isBioProduct,
      category,               // Primary Recommendation
      subCategory,
      alternativeCategory,    // Secondary Recommendation
      confidence,             // 0 - 100
      scientificReason,       // Biochemical degradation explanation
      downstreamSOP,          // Array of SOP steps
      estimatedValueIDR,      // Financial valuation in Rupiah
      carbonSavingsKg,        // CO2-eq reduction
      activePathIds,          // IDs for SVG flowchart nodes & cables
      violations: defaultViolations,
      inputs: {
        holdTime,
        ffa,
        ph,
        moisture,
        viscosity,
        colorCategory,
        ambientTemp,
        batchWeight
      }
    };
  },

  /**
   * Helper to format Indonesian Rupiah
   */
  formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  }
};

// Export to window or CommonJS
if (typeof window !== 'undefined') {
  window.PalmLogicEngine = PalmLogicEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PalmLogicEngine;
}
