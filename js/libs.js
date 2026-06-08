// ================================================================
// DZEL — CARREGAMENTO SOB DEMANDA (LAZY) DE BIBLIOTECAS PESADAS
// ================================================================
// XLSX (~900KB), jsPDF (~350KB) e Chart.js (~250KB) só são usados em
// ações pontuais (exportar, imprimir, dashboard). Carregá-los apenas
// quando necessário reduz drasticamente o tempo de carregamento inicial.

const _libCache = {};

function carregarScript(url) {
    if (_libCache[url]) return _libCache[url];
    _libCache[url] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src    = url;
        s.async  = true;
        s.onload = () => resolve();
        s.onerror = () => { delete _libCache[url]; reject(new Error('Falha ao carregar ' + url)); };
        document.head.appendChild(s);
    });
    return _libCache[url];
}

// ── SheetJS (exportação Excel) ───────────────────────────────────
async function ensureXLSX() {
    if (window.XLSX) return;
    await carregarScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
}

// ── jsPDF (geração de PDF de O.S. e Ocorrências) ────────────────
async function ensureJsPDF() {
    if (window.jspdf) return;
    await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
}

// ── Chart.js + plugin de datalabels (Dashboard) ─────────────────
let _chartsRegistrados = false;
async function ensureCharts() {
    if (!window.Chart)          await carregarScript('https://cdn.jsdelivr.net/npm/chart.js');
    if (!window.ChartDataLabels) await carregarScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0');
    if (!_chartsRegistrados) { Chart.register(ChartDataLabels); _chartsRegistrados = true; }
}
