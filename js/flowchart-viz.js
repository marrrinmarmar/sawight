/**
 * PalmQual-AI - Interactive Flowchart Visualizer
 * Controls the live animated SVG/CSS decision pipeline
 */

const FlowchartViz = {
  container: null,
  
  init() {
    this.container = document.getElementById('flowchartContainer');
    if (!this.container) return;
    this.setupNodeListeners();
  },

  setupNodeListeners() {
    const nodes = document.querySelectorAll('.flow-node');
    nodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const nodeId = node.dataset.nodeId;
        this.showNodeDetails(nodeId);
      });
    });
  },

  /**
   * Updates flowchart visual state based on analysis result
   * @param {Object} result - Analysis result from PalmLogicEngine.analyze()
   */
  update(result) {
    if (!result) return;

    const {
      isDefaultTrack,
      isBioProduct,
      category,
      inputs
    } = result;

    // Reset all nodes and paths
    const allNodes = document.querySelectorAll('.flow-node');
    const allPaths = document.querySelectorAll('.flow-path');
    const allBadges = document.querySelectorAll('.branch-label');

    allNodes.forEach(n => {
      n.classList.remove('active', 'dimmed', 'node-default', 'node-bio', 'node-other', 'node-ai');
    });

    allPaths.forEach(p => {
      p.classList.remove('active', 'path-default', 'path-bio', 'path-other', 'path-neutral');
    });

    allBadges.forEach(b => {
      b.classList.remove('active', 'branch-default', 'branch-flex', 'branch-yes', 'branch-no');
    });

    // 1. Initial common pipeline is ALWAYS active
    this.activateNode('node-panen', 'node-ai');
    this.activateNode('node-penampungan', 'node-ai');
    this.activateNode('node-entry', 'node-ai');
    this.activateNode('node-ai-pemilahan', 'node-ai');

    this.activatePath('path-1', 'path-neutral');
    this.activatePath('path-2', 'path-neutral');
    this.activatePath('path-3', 'path-neutral');

    // Update status pills on common nodes
    this.updateNodePill('node-panen', 'Panen Siap', 'pill-pass');
    this.updateNodePill('node-penampungan', `Hold: ${inputs.holdTime} Jam`, inputs.holdTime <= 24 ? 'pill-pass' : 'pill-divert');
    this.updateNodePill('node-entry', `FFA: ${inputs.ffa}% | pH: ${inputs.ph}`, 'pill-pass');

    // 2. Branch decision: Default Track vs Flex Track
    if (isDefaultTrack) {
      // Default path active
      this.activatePath('path-default', 'path-default');
      this.activateBadge('badge-default', 'branch-default');
      this.activateNode('node-default-prod', 'node-default');
      this.updateNodePill('node-ai-pemilahan', 'Lolos Standar CPO', 'pill-pass');
      this.updateNodePill('node-default-prod', category.includes('Super') ? 'Cooking Oil Grade A' : 'CPO Standar PORAM', 'pill-pass');

      // Dim Flex branch
      this.dimNode('node-ai-flex');
      this.dimNode('node-bio-prod');
      this.dimNode('node-diolah');
      this.dimNode('node-other-prod');

    } else {
      // Flex path active
      this.activatePath('path-flex', 'path-neutral');
      this.activateBadge('badge-flex', 'branch-flex');
      this.activateNode('node-ai-flex', 'node-ai');
      this.updateNodePill('node-ai-pemilahan', 'Diverted ke Flex Track', 'pill-divert');

      // Dim Default branch
      this.dimNode('node-default-prod');

      if (isBioProduct) {
        // Flex -> Bio-Product (YES) -> Diolah
        this.activatePath('path-bio-yes', 'path-bio');
        this.activateBadge('badge-bio-yes', 'branch-yes');
        this.activateNode('node-bio-prod', 'node-bio');
        this.updateNodePill('node-ai-flex', 'Cocok Eco/Bio (YES)', 'pill-pass');
        this.updateNodePill('node-bio-prod', category.split('(')[0].trim(), 'pill-pass');

        this.activatePath('path-diolah', 'path-bio');
        this.activateNode('node-diolah', 'node-bio');
        this.updateNodePill('node-diolah', 'Siap Pemrosesan Khusus', 'pill-pass');

        // Dim Other products branch
        this.dimNode('node-other-prod');
      } else {
        // Flex -> Other Products (NO)
        this.activatePath('path-bio-no', 'path-other');
        this.activateBadge('badge-bio-no', 'branch-no');
        this.activateNode('node-other-prod', 'node-other');
        this.updateNodePill('node-ai-flex', 'Non-Biofuel Path (NO)', 'pill-alt');
        this.updateNodePill('node-other-prod', category.split('(')[0].trim(), 'pill-alt');

        // Dim Bio branch
        this.dimNode('node-bio-prod');
        this.dimNode('node-diolah');
      }
    }
  },

  activateNode(nodeId, typeClass) {
    const el = document.getElementById(nodeId);
    if (el) {
      el.classList.add('active', typeClass);
      el.classList.remove('dimmed');
    }
  },

  dimNode(nodeId) {
    const el = document.getElementById(nodeId);
    if (el) {
      el.classList.add('dimmed');
      el.classList.remove('active', 'node-default', 'node-bio', 'node-other', 'node-ai');
    }
  },

  activatePath(pathId, typeClass) {
    const el = document.getElementById(pathId);
    if (el) {
      el.classList.add('active', typeClass);
    }
  },

  activateBadge(badgeId, typeClass) {
    const el = document.getElementById(badgeId);
    if (el) {
      el.classList.add('active', typeClass);
    }
  },

  updateNodePill(nodeId, text, pillClass) {
    const el = document.getElementById(nodeId);
    if (!el) return;
    const pill = el.querySelector('.node-status-pill');
    if (pill) {
      pill.textContent = text;
      pill.className = `node-status-pill ${pillClass}`;
    }
  },

  showNodeDetails(nodeId) {
    const descriptions = {
      'node-panen': {
        title: 'Panen Sawit (Kebun)',
        desc: 'Proses panen Tandan Buah Segar (TBS) di blok kebun sawit. Kematangan buah optimal (5-10 brondolan lepas) menentukan kandungan minyak dasar.'
      },
      'node-penampungan': {
        title: 'Penampungan Berdasarkan Jadwal Panen',
        desc: 'Penerimaan di Loading Ramp Pabrik Kelapa Sawit (PKS). Menghitung Hold Time (lama penundaan). Jika hold time > 24 jam, enzim lipase aktif memecah trigliserida menjadi FFA.'
      },
      'node-entry': {
        title: 'Bahan Pokok Sawit (Batch Data Entry)',
        desc: 'Pengujian laboratorium analitik kualitas sampel batch: Warna pigmen carotene, viskositas cSt, derajat keasaman pH, kadar FFA %, dan moisture air.'
      },
      'node-ai-pemilahan': {
        title: 'AI Pemilahan Kualitas',
        desc: 'Engine klasifikasi AI tingkat 1: Memverifikasi apakah batch memenuhi batas aman CPO konsumsi (Hold time ≤ 24 jam, FFA ≤ 3.5%, pH 5.8-6.8, Moisture ≤ 0.25%). Jika ya, diarahkan ke Default Track; jika tidak, dialihkan ke Flex Track.'
      },
      'node-default-prod': {
        title: 'Produksi Minyak Sawit (Default Track)',
        desc: 'Pengolahan standar CPO untuk minyak goreng konsumsi (Cooking Oil / Olein Standar SNI 7709) dan ekspor CPO reguler ber-yield tinggi.'
      },
      'node-ai-flex': {
        title: 'AI Analisis Mendalam (Bio-Product)',
        desc: 'Engine AI tingkat 2: Menilai profil asam lemak unik untuk kesesuaian ekosistem Bio / Eco-Friendly (Biofuel HVO, Biodiesel FAME, Bioplastik, Sabun Organik) vs Produk Lain.'
      },
      'node-bio-prod': {
        title: 'Produk Bio / Eco-Friendly (Yes)',
        desc: 'Bahan baku lolos ambang batas ramah lingkungan (FFA ≤ 10%, pH stabil, viskositas terukur) untuk transisi energi bersih dan material terbarukan.'
      },
      'node-diolah': {
        title: 'Diolah (Downstream Eco-Refinery)',
        desc: 'Unit hidro-deoksigenasi (HVO Green Diesel), transesterifikasi B35/B40, sintesis biopolimer PHA plastik organik, atau saponifikasi sabun ramah lingkungan.'
      },
      'node-other-prod': {
        title: 'Produk Lain (Pakan / Pupuk / Oleokimia)',
        desc: 'Bahan baku dengan degradasi enzimatik tinggi (FFA > 10% - 25%+) dialihkan secara sirkular menjadi Oleokimia pelumas industri, Pakan Ternak Kalsium (Bypass Fat), atau Pupuk Kompos & Biogas.'
      }
    };

    const info = descriptions[nodeId];
    if (info && window.showToast) {
      window.showToast(`${info.title}: ${info.desc}`, 'info');
    }
  }
};

if (typeof window !== 'undefined') {
  window.FlowchartViz = FlowchartViz;
}
