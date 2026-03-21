// ================================================================
// DZEL — APP: INICIALIZAÇÃO, NAVEGAÇÃO E EXPORTAÇÃO
// ================================================================

function iniciarSistema(userData) {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-content').classList.add('app-visible');
    document.getElementById('user-display').innerText     = `Olá, ${userData.nome}`;
    document.getElementById('user-role-display').innerText= userData.isAdmin ? 'Administrador Geral' : 'Usuário Padrão';
    const initials = userData.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('avatar-initials').innerText  = initials;

    carregarDados();
    iniciarRealtime();

    const allTabs = ['dashboard','demandas','predial','limpeza','ar','visitantes','veiculos','eventos','auditoria','usuarios','crachas','ocorrencias'];
    allTabs.forEach(t => document.getElementById('tab-' + t).classList.add('hidden-tab'));

    if (userData.isAdmin) {
        allTabs.forEach(t => document.getElementById('tab-' + t).classList.remove('hidden-tab'));
        carregarUsuarios();
        if (!document.querySelector('.section.active')) window.switchTab('dashboard');
    } else {
        let firstTab = null;
        const p = userData.perms;
        const show = (tab, mod) => { if (p[mod]?.ver) { document.getElementById('tab-' + tab).classList.remove('hidden-tab'); if (!firstTab) firstTab = tab; } };
        show('demandas',   'demandas');
        show('predial',    'predial');
        show('limpeza',    'limpeza');
        show('ar',         'ar');
        show('visitantes', 'visitantes');
        show('veiculos',   'veiculos');
        show('eventos',    'eventos');
        show('crachas',    'crachas');
        show('ocorrencias','ocorrencias');
        if (firstTab) window.switchTab(firstTab);
    }
}

// ── Navegação entre seções ───────────────────────────────────────
window.switchTab = function(tabId) {
    fecharSidebarMobile();
    if (document.getElementById('visitantes').classList.contains('active')) pararCamera();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const btn = document.getElementById('tab-' + tabId); if (btn) btn.classList.add('active');

    if (tabId === 'dashboard') {
        renderizarDashboard();
        setTimeout(() => { if (chartVolume) chartVolume.resize(); if (chartGaragem) chartGaragem.resize(); }, 100);
    }
    if (tabId === 'visitantes') document.getElementById('vis-entrada').value = DateUtils.getToInput();
    if (tabId === 'veiculos')   document.getElementById('veiculo-hora-saida').value = DateUtils.getToInput();
    if (tabId === 'predial')  { const brt = DateUtils.getToInput(); document.getElementById('predial-data').value = brt.slice(0,10); document.getElementById('predial-hora').value = brt.slice(11,16); }
    if (tabId === 'ar')       { const brt = DateUtils.getToInput(); document.getElementById('ar-data').value     = brt.slice(0,10); document.getElementById('ar-hora').value     = brt.slice(11,16); }
    if (tabId === 'limpeza')  { const brt = DateUtils.getToInput(); document.getElementById('limpeza-data').value= brt.slice(0,10); document.getElementById('limpeza-hora').value = brt.slice(11,16); }
    if (tabId === 'ocorrencias') document.getElementById('oco-data').value = DateUtils.getToInput();
};

// ── Exportação para Excel (SheetJS) ─────────────────────────────
function exportarExcel(tipo) {
    if (!pode(tipo, 'exportar')) { alert('Você não tem permissão para exportar estes dados.'); return; }
    let data = [], nomeArquivo = "";
    if      (tipo === 'demandas')    { data = demandas;    nomeArquivo = "Relatorio_Demandas_Geral.xlsx"; }
    else if (tipo === 'predial')     { data = demandas.filter(d => getCategoriaDemanda(d) === 'PREDIAL');  nomeArquivo = "Relatorio_Predial.xlsx"; }
    else if (tipo === 'ar')          { data = demandas.filter(d => getCategoriaDemanda(d) === 'AR');       nomeArquivo = "Relatorio_ArCondicionado.xlsx"; }
    else if (tipo === 'limpeza')     { data = demandas.filter(d => getCategoriaDemanda(d) === 'LIMPEZA');  nomeArquivo = "Relatorio_Limpeza.xlsx"; }
    else if (tipo === 'visitantes')  { data = visitantes;  nomeArquivo = "Relatorio_Visitantes.xlsx"; }
    else if (tipo === 'frota')       { data = frota;       nomeArquivo = "Relatorio_Frota.xlsx"; }
    else if (tipo === 'eventos')     { data = eventos;     nomeArquivo = "Relatorio_Eventos.xlsx"; }
    else if (tipo === 'crachas')     { data = crachas;     nomeArquivo = "Relatorio_Crachas.xlsx"; }
    else if (tipo === 'ocorrencias') { data = ocorrencias; nomeArquivo = "Relatorio_Ocorrencias.xlsx"; }

    if (data.length === 0) return alert("Não há dados para exportar.");

    if (['demandas','predial','ar','limpeza'].includes(tipo)) {
        data = data.map(d => ({
            ID: d.id, NUMERO_OS: d.numero_os, TITULO: d.titulo, SETOR: d.setor,
            SOLICITANTE: d.solicitante, CONTRATADA: d.contratada, PRIORIDADE: d.prioridade,
            DATA_ABERTURA: d.data, HORA_ABERTURA: d.hora, STATUS: d.status, DATA_FIM: d.data_fim
        }));
    } else {
        data = data.map(item => { const novo = { ...item }; if (novo.foto) novo.foto = "(Imagem Salva)"; return novo; });
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, nomeArquivo);
    registrarLog('Exportação', tipo, 'Gerou relatório Excel');
}

// ── Inicializações de data/hora nos formulários ──────────────────
document.getElementById('date-display').innerText        = new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
document.getElementById('demanda-data').value            = DateUtils.getToInput().slice(0, 10);
document.getElementById('demanda-hora').value            = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
document.getElementById('evento-data').value             = DateUtils.getToInput().slice(0, 10);
document.getElementById('cracha-data').value             = DateUtils.getToInput().slice(0, 10);
document.getElementById('vis-entrada').value             = DateUtils.getToInput();
document.getElementById('veiculo-hora-saida').value      = DateUtils.getToInput();
document.getElementById('oco-data').value                = DateUtils.getToInput();

// ── Bootstrap ────────────────────────────────────────────────────
verificarSessao();
