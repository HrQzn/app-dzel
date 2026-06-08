// ================================================================
// DZEL — REALTIME E CARREGAMENTO DE DADOS
// ================================================================

// Mapeia a tabela do banco -> chave interna de carregamento.
const _TABELA_KEYS = {
    demandas:       'demandas',
    visitantes:     'visitantes',
    frota:          'frota',
    eventos:        'eventos',
    crachas:        'crachas',
    ocorrencias:    'ocorrencias',
    logs_auditoria: 'logs'
};

// Colspan de cada tabela (para skeleton/estado vazio).
const _TABELA_COLSPAN = {
    'tabela-demandas': 6, 'tabela-predial': 6, 'tabela-ar': 6, 'tabela-limpeza': 6,
    'tabela-visitantes': 6, 'tabela-veiculos': 7, 'tabela-eventos': 6,
    'tabela-crachas': 6, 'tabela-ocorrencias': 7
};

// ── Realtime granular: acumula apenas as tabelas alteradas ───────
let _rtTimer = null;
let _rtPendentes = new Set();
const debouncedCarregar = (chave) => {
    if (chave) _rtPendentes.add(chave);
    clearTimeout(_rtTimer);
    _rtTimer = setTimeout(() => {
        const alvos = _rtPendentes.size ? [..._rtPendentes] : null;
        _rtPendentes = new Set();
        carregarDados(alvos);
    }, 400);
};

function iniciarRealtime() {
    sb.channel('mudancas-db')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            // Recarrega SOMENTE a tabela que mudou (antes recarregava tudo).
            const chave = _TABELA_KEYS[payload.table];
            if (chave) debouncedCarregar(chave);
        })
        .subscribe();
}

// Pré-computa a categoria de cada demanda UMA única vez, evitando
// milhares de recálculos durante a renderização das abas técnicas.
function _indexarDemandas(lista) {
    for (let i = 0; i < lista.length; i++) lista[i]._categoria = getCategoriaDemanda(lista[i]);
    return lista;
}

// carregarDados(alvos?) — sem argumento carrega tudo (boot inicial);
// com um array de chaves recarrega apenas as tabelas indicadas.
async function carregarDados(alvos) {
    const p        = currentUserData.perms || {};
    const admin    = currentUserData.isAdmin;
    const querTudo = !alvos;
    const quer     = (k) => querTudo || alvos.includes(k);

    const promises = [];
    const keys     = [];

    const add = (key, podeVer, query) => {
        if (podeVer && quer(key)) { keys.push(key); promises.push(query); }
    };

    add('demandas',    admin || p.demandas?.ver || p.predial?.ver || p.limpeza?.ver || p.ar?.ver,
        sb.from('demandas').select('*').order('id', { ascending: false }));
    add('visitantes',  admin || p.visitantes?.ver,
        sb.from('visitantes').select('*').order('id', { ascending: false }));
    add('frota',       admin || p.veiculos?.ver,
        sb.from('frota').select('*').order('id', { ascending: false }));
    add('eventos',     admin || p.eventos?.ver,
        sb.from('eventos').select('*').order('data', { ascending: false }).order('id', { ascending: false }));
    add('crachas',     admin || p.crachas?.ver,
        sb.from('crachas').select('*').order('id', { ascending: false }));
    add('ocorrencias', admin || p.ocorrencias?.ver,
        sb.from('ocorrencias').select('*').order('data_hora', { ascending: false }).order('id', { ascending: false }));
    add('logs',        admin,
        sb.from('logs_auditoria').select('*').order('id', { ascending: false }).limit(50));

    if (!promises.length) return;

    // Skeleton apenas no carregamento inicial (não em reloads pontuais).
    if (querTudo) {
        for (const id in _TABELA_COLSPAN) {
            const tb = document.querySelector(`#${id} tbody`);
            if (tb && tb.querySelector('.loading')) mostrarSkeleton(id, _TABELA_COLSPAN[id]);
        }
    }

    const results = await Promise.all(promises);

    results.forEach((res, index) => {
        const key = keys[index];
        if (res.error || !res.data) return;

        if (key === 'demandas') {
            demandas = _indexarDemandas(res.data);
            window.renderizarApenasDemandas();
            window.renderizarAbasEspecificas();
        }
        if (key === 'visitantes')  { visitantes  = res.data; window.renderizarApenasVisitantes(); }
        if (key === 'frota')       { frota       = res.data; window.renderizarApenasFrota(); }
        if (key === 'eventos')     { eventos     = res.data; window.renderizarApenasEventos(); }
        if (key === 'crachas')     { crachas     = res.data; window.renderizarApenasCrachas(); }
        if (key === 'ocorrencias') { ocorrencias = res.data; window.renderizarApenasOcorrencias(); }
        if (key === 'logs')        { logs        = res.data; renderizarLogs(); }
    });

    if (document.getElementById('dashboard').classList.contains('active')) {
        renderizarDashboard();
    }
}
