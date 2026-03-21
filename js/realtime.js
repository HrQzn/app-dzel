// ================================================================
// DZEL — REALTIME E CARREGAMENTO DE DADOS
// ================================================================

// Debounce para evitar múltiplos disparos do realtime em sequência
let _rtTimer = null;
const debouncedCarregar = () => {
    clearTimeout(_rtTimer);
    _rtTimer = setTimeout(() => carregarDados(), 400);
};

function iniciarRealtime() {
    sb.channel('mudancas-db')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            debouncedCarregar();
        })
        .subscribe();
}

async function carregarDados() {
    const p     = currentUserData.perms || {};
    const admin = currentUserData.isAdmin;

    const promises = [];
    const keys     = [];

    if (admin || p.demandas?.ver || p.predial?.ver || p.limpeza?.ver || p.ar?.ver) {
        keys.push('demandas');
        promises.push(sb.from('demandas').select('*'));
    }
    if (admin || p.visitantes?.ver) {
        keys.push('visitantes');
        promises.push(sb.from('visitantes').select('*'));
    }
    if (admin || p.veiculos?.ver) {
        keys.push('frota');
        promises.push(sb.from('frota').select('*'));
    }
    if (admin || p.eventos?.ver) {
        keys.push('eventos');
        promises.push(sb.from('eventos').select('*'));
    }
    if (admin || p.crachas?.ver) {
        keys.push('crachas');
        promises.push(sb.from('crachas').select('*'));
    }
    if (admin || p.ocorrencias?.ver) {
        keys.push('ocorrencias');
        promises.push(sb.from('ocorrencias').select('*'));
    }
    if (admin) {
        keys.push('logs');
        promises.push(
            sb.from('logs_auditoria')
              .select('*')
              .order('id', { ascending: false })
              .limit(50)
        );
    }

    const results = await Promise.all(promises);

    results.forEach((res, index) => {
        const key = keys[index];
        if (!res.data) return;

        if (key === 'demandas') {
            demandas = res.data.sort((a, b) => b.id - a.id);
            window.renderizarApenasDemandas();
            window.renderizarAbasEspecificas();
        }
        if (key === 'visitantes') {
            visitantes = res.data.sort((a, b) => b.id - a.id);
            window.renderizarApenasVisitantes();
        }
        if (key === 'frota') {
            frota = res.data.sort((a, b) => b.id - a.id);
            window.renderizarApenasFrota();
        }
        if (key === 'eventos') {
            eventos = res.data.sort((a, b) => new Date(b.data) - new Date(a.data));
            window.renderizarApenasEventos();
        }
        if (key === 'crachas') {
            crachas = res.data.sort((a, b) => b.id - a.id);
            window.renderizarApenasCrachas();
        }
        if (key === 'ocorrencias') {
            ocorrencias = res.data.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
            window.renderizarApenasOcorrencias();
        }
        if (key === 'logs') {
            logs = res.data;
            renderizarLogs();
        }
    });

    if (document.getElementById('dashboard').classList.contains('active')) {
        renderizarDashboard();
    }
}
