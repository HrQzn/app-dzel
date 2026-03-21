// ================================================================
// DZEL — UTILITÁRIOS GERAIS
// ================================================================

// ── Fuso horário BRT ────────────────────────────────────────────
const DateUtils = {
    getNowBRT: () => {
        const now = new Date();
        const brtString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
        return new Date(brtString);
    },
    getToInput: () => {
        const now = DateUtils.getNowBRT();
        const ano  = now.getFullYear();
        const mes  = String(now.getMonth() + 1).padStart(2, '0');
        const dia  = String(now.getDate()).padStart(2, '0');
        const hora = String(now.getHours()).padStart(2, '0');
        const min  = String(now.getMinutes()).padStart(2, '0');
        return `${ano}-${mes}-${dia}T${hora}:${min}`;
    },
    toDatabaseISO: (valorInput) => {
        if (!valorInput) return null;
        const [datePart, timePart] = valorInput.split('T');
        const [ano, mes, dia] = datePart.split('-').map(Number);
        const [hora, min]     = (timePart || '00:00').split(':').map(Number);
        const utcDate = new Date(Date.UTC(ano, mes - 1, dia, hora + 3, min, 0));
        return utcDate.toISOString();
    },
    getNowDatabaseISO: () => DateUtils.toDatabaseISO(DateUtils.getToInput())
};

// Aliases de compatibilidade
function getDataHoraLocalParaInput() { return DateUtils.getToInput(); }
function dataLocalParaISO(val)       { return DateUtils.toDatabaseISO(val); }

// ── Formatadores ────────────────────────────────────────────────
function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraReal(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    const brtStr = d.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    const parts = brtStr.replace(',', '').trim().split(' ');
    const datePart = parts[0].split('/').slice(0, 2).join('/');
    const timePart = parts[1] || '';
    return `${datePart} ${timePart}`;
}

// ── Controle de permissões ───────────────────────────────────────
function pode(modulo, acao) {
    if (currentUserData.isAdmin) return true;
    return currentUserData.perms[modulo] && currentUserData.perms[modulo][acao] === true;
}

// ── Sanitização para jsPDF (helvetica não suporta acentos) ──────
// DEVE ser declarada ANTES de qualquer uso (const não faz hoisting)
const s = (v) => String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');

// ── Sentence Case ───────────────────────────────────────────────
const sentCase = (str) => str.toLowerCase()
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .replace(/^[a-z]/, c => c.toUpperCase());

// ── Cálculo de tempo decorrido (Demandas) ───────────────────────
function calcularTempoDecorrido(dataStr, horaStr, dataFimStr) {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const [h, m] = (horaStr || '00:00').split(':').map(Number);
    const inicio = new Date(Date.UTC(ano, mes - 1, dia, h + 3, m, 0));
    const fim    = dataFimStr ? new Date(dataFimStr) : new Date();
    const diffMs = fim - inicio;
    if (diffMs < 0) return "00m";
    const diffHoras   = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(diffHoras).padStart(2, '0')}h ${String(diffMinutos).padStart(2, '0')}m`;
}

// ── Cálculo de tempo decorrido (Ocorrências) ────────────────────
function calcularTempoOco(dataISOInicio, dataISOFim) {
    if (!dataISOInicio) return '--';
    const inicio = new Date(dataISOInicio);
    const fim    = dataISOFim ? new Date(dataISOFim) : new Date();
    const diff   = fim - inicio;
    if (diff < 0) return '00m';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

// ── Categoria de demanda (para filtros e abas) ──────────────────
function getCategoriaDemanda(d) {
    const texto     = (d.titulo + " " + d.setor).toUpperCase();
    const contratada = (d.contratada || "").toUpperCase();
    if (contratada.includes("AR CONDICIONADO") || texto.includes("AR CONDICIONADO")) return 'AR';
    if (contratada.includes("PREDIAL") || texto.includes("PREDIAL") || texto.includes("ELÉTRICA") || texto.includes("PINTURA") || texto.includes("PORTA") || texto.includes("FECHADURA")) return 'PREDIAL';
    if (contratada.includes("LIMPEZA") || texto.includes("LIMPEZA") || texto.includes("COPA") || texto.includes("CAFÉ") || texto.includes("ÁGUA")) return 'LIMPEZA';
    if (contratada.includes("RAMAL") || texto.includes("RAMAL") || texto.includes("TELEFONE")) return 'RAMAL';
    return 'OUTROS';
}

// ── Helpers de O.S. ─────────────────────────────────────────────
function montarDadosOS(id) { return demandas.find(item => item.id == id); }

function getLogoInfoParaOS(d) {
    const cat = getCategoriaDemanda(d);
    if (cat === 'PREDIAL') return { src: 'epura.jpg', width: '140px', height: '60px', fit: 'cover' };
    if (cat === 'AR')      return { src: 'igm2.jpg',  width: '145px', height: '55px', fit: 'contain' };
    return null;
}

function montarCheckboxes(d) {
    const c = (d.contratada || '').toUpperCase();
    return {
        limpeza:    c.includes('LIMPEZA')          ? '[X]' : '[ ]',
        ar:         c.includes('AR CONDICIONADO')  ? '[X]' : '[ ]',
        manut:      (c.includes('PREDIAL') || c.includes('ELÉTRICA') || c.includes('PINTURA')) ? '[X]' : '[ ]',
        elevador:   c.includes('ELEVADOR')         ? '[X]' : '[ ]',
        ti:         '[ ]',
        telefonia:  c.includes('TELEFONIA')        ? '[X]' : '[ ]',
        extintores: '[ ]'
    };
}
