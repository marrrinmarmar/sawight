/**
 * PalmQual-AI - Interactive Analytical Charts
 * Chart.js configurations and real-time visual updates
 */

const PalmCharts = {
  allocationChartInstance: null,
  ffaHoldChartInstance: null,

  init() {
    this.initAllocationChart();
    this.initFfaHoldChart();
  },

  /**
   * Doughnut chart showing allocation distribution
   */
  initAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    const stats = BatchDataManager.getStatistics();

    if (this.allocationChartInstance) {
      this.allocationChartInstance.destroy();
    }

    this.allocationChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Minyak Standar (Default)', 'Bio/Eco-Products (Flex)', 'Produk Lain (Non-Bio)'],
        datasets: [{
          data: [stats.trackDefaultCount, stats.trackBioCount, stats.trackOtherCount],
          backgroundColor: [
            '#f59e0b', // Amber / Palm
            '#10b981', // Emerald / Bio
            '#f97316'  // Bronze / Other
          ],
          borderColor: '#0f172a',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              },
              padding: 16,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const val = context.raw;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${context.label}: ${val} Batch (${pct}%)`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });
  },

  /**
   * Scatter / Correlation chart: Hold Time (Hours) vs FFA (%)
   */
  initFfaHoldChart() {
    const ctx = document.getElementById('ffaHoldChart');
    if (!ctx) return;

    const batches = BatchDataManager.getAll();

    const defaultPoints = [];
    const bioPoints = [];
    const otherPoints = [];

    batches.forEach(b => {
      const pt = { x: Number(b.holdTime), y: Number(b.ffa), label: b.id, name: b.estateName, alloc: b.allocation };
      if (b.track === 'DEFAULT_TRACK') {
        defaultPoints.push(pt);
      } else if (b.subTrack === 'BIO_ECO') {
        bioPoints.push(pt);
      } else {
        otherPoints.push(pt);
      }
    });

    if (this.ffaHoldChartInstance) {
      this.ffaHoldChartInstance.destroy();
    }

    this.ffaHoldChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Minyak Standar (Default)',
            data: defaultPoints,
            backgroundColor: 'rgba(245, 158, 11, 0.85)',
            borderColor: '#f59e0b',
            pointRadius: 6,
            pointHoverRadius: 9
          },
          {
            label: 'Bio / Eco-Friendly (Flex)',
            data: bioPoints,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            pointRadius: 6,
            pointHoverRadius: 9
          },
          {
            label: 'Produk Lain (Non-Bio)',
            data: otherPoints,
            backgroundColor: 'rgba(249, 115, 22, 0.85)',
            borderColor: '#f97316',
            pointRadius: 6,
            pointHoverRadius: 9
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Lama Penyimpanan / Hold Time (Jam)',
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 'bold' }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#64748b'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Kadar Asam Lemak Bebas / FFA (%)',
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 'bold' }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#64748b'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title(items) {
                const pt = items[0].raw;
                return `${pt.label} (${pt.name})`;
              },
              label(context) {
                const pt = context.raw;
                return [
                  `Hold Time: ${pt.x} Jam | FFA: ${pt.y}%`,
                  `Alokasi: ${pt.alloc}`
                ];
              }
            }
          }
        }
      }
    });
  },

  /**
   * Refreshes chart data when batches are modified
   */
  refresh() {
    this.initAllocationChart();
    this.initFfaHoldChart();
  }
};

if (typeof window !== 'undefined') {
  window.PalmCharts = PalmCharts;
}
