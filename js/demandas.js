// ================================================================
// DZEL — MÓDULO: DEMANDAS (GERAL, PREDIAL, AR, LIMPEZA)
// ================================================================

// ── Tabela Geral ─────────────────────────────────────────────────
function criarLinhaTabela(d) {
    const badgeClass  = d.status === 'Pendente' ? 'bg-pendente' : (d.status === 'Em Andamento' ? 'bg-andamento' : 'bg-concluido');
    const tempoStr    = calcularTempoDecorrido(d.data, d.hora, d.data_fim);
    const tempoDisplay = d.status === 'Concluído'
        ? `<span class="time-badge"><i class="fas fa-stopwatch"></i> ${tempoStr}</span>`
        : `<span class="time-badge" style="background:#fef3c7;color:#92400e;border-color:#fde68a"><i class="fas fa-hourglass-half"></i> ${tempoStr}</span>`;
    const btnAvancar  = (d.status !== 'Concluído' && pode('demandas', 'editar'))
        ? `<button onclick="avancarStatus(${d.id})" class="action-btn btn-check" title="Avançar status"><i class="fas fa-arrow-right"></i></button>` : '';
    const btnWA       = `<button onclick="enviarWhatsAppDemanda(${d.id})" class="action-btn btn-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>`;
    const btnPrint    = `<button onclick="abrirModalImpressao(${d.id})" class="action-btn btn-print" title="Imprimir O.S."><i class="fas fa-print"></i></button>`;
    const btnEdit     = pode('demandas', 'editar')  ? `<button onclick="editarDemanda(${d.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>` : '';
    const btnDel      = pode('demandas', 'excluir') ? `<button onclick="deletarDemanda(${d.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>` : '';
    const contratadaDisplay = d.contratada
        ? `<br><span style="color:var(--accent);font-size:0.75rem;font-weight:600;"><i class="fas fa-hard-hat"></i> ${d.contratada}</span>` : '';
    return `<tr>
        <td><strong style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;">${formatarData(d.data)}</strong><br><small style="color:var(--text-muted)">${d.hora || ''}</small></td>
        <td><span class="badge bg-saiu">${d.prioridade}</span></td>
        <td><strong>${d.titulo}</strong><br><small style="color:var(--text-muted)">${d.solicitante} · ${d.setor}</small>${contratadaDisplay}</td>
        <td><span class="badge ${badgeClass}">${d.status}</span></td>
        <td>${tempoDisplay}</td>
        <td style="min-width:160px">${btnAvancar}${btnWA}${btnPrint}${btnEdit}${btnDel}</td>
    </tr>`;
}

function criarLinhaTabelaSimples(d, prefixo) {
    const badgeClass   = d.status === 'Pendente' ? 'bg-pendente' : (d.status === 'Em Andamento' ? 'bg-andamento' : 'bg-concluido');
    const tempoStr     = calcularTempoDecorrido(d.data, d.hora, d.data_fim);
    const tempoDisplay = d.status === 'Concluído'
        ? `<span class="time-badge"><i class="fas fa-stopwatch"></i> ${tempoStr}</span>`
        : `<span class="time-badge" style="background:#fef3c7;color:#92400e;border-color:#fde68a"><i class="fas fa-hourglass-half"></i> ${tempoStr}</span>`;
    const btnAvancar = (d.status !== 'Concluído' && pode(prefixo, 'editar'))
        ? `<button onclick="avancarStatus(${d.id})" class="action-btn btn-check"><i class="fas fa-arrow-right"></i></button>` : '';
    const btnWA2   = `<button onclick="enviarWhatsAppDemanda(${d.id})" class="action-btn btn-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>`;
    const btnPrint = `<button onclick="abrirModalImpressao(${d.id})" class="action-btn btn-print"><i class="fas fa-print"></i></button>`;
    const btnEdit  = pode(prefixo, 'editar')  ? `<button onclick="editarDemanda(${d.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>` : '';
    const btnDel   = pode(prefixo, 'excluir') ? `<button onclick="deletarDemanda(${d.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>` : '';
    return `<tr>
        <td><strong style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;">${formatarData(d.data)}</strong><br><small style="color:var(--text-muted)">${d.hora || ''}</small></td>
        <td><strong>${d.titulo}</strong><br><small style="color:var(--text-muted)">Prioridade: ${d.prioridade}</small></td>
        <td>${d.solicitante}<br><small style="color:var(--text-muted)">${d.setor}</small></td>
        <td><span class="badge ${badgeClass}">${d.status}</span></td>
        <td>${tempoDisplay}</td>
        <td style="min-width:170px">${btnAvancar}${btnWA2}${btnPrint}${btnEdit}${btnDel}</td>
    </tr>`;
}

// ── Renderização ─────────────────────────────────────────────────
window.renderizarApenasDemandas = function() {
    const filtroMes    = document.getElementById('filtro-mes-demanda').value;
    const filtroStatus = document.getElementById('filtro-status-demanda').value;
    const filtroTexto  = document.getElementById('filtro-texto-demanda').value.toUpperCase();
    const lista = demandas.filter(d => {
        const bateData   = !filtroMes    || d.data.startsWith(filtroMes);
        const bateStatus = !filtroStatus || d.status === filtroStatus;
        const textoGeral = (d.titulo + ' ' + d.setor + ' ' + d.solicitante + ' ' + (d.contratada || '')).toUpperCase();
        const bateTexto  = !filtroTexto  || textoGeral.includes(filtroTexto);
        return bateData && bateStatus && bateTexto;
    });
    document.getElementById('dash-demanda-total').innerText     = lista.length;
    document.getElementById('dash-demanda-pendente').innerText  = lista.filter(d => d.status === 'Pendente').length;
    document.getElementById('dash-demanda-andamento').innerText = lista.filter(d => d.status === 'Em Andamento').length;
    document.getElementById('dash-demanda-concluido').innerText = lista.filter(d => d.status === 'Concluído').length;
    const tbody = document.querySelector('#tabela-demandas tbody');
    tbody.innerHTML = lista.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhuma demanda encontrada.</td></tr>'
        : lista.map(d => criarLinhaTabela(d)).join('');
};

window.renderizarAbasEspecificas = function() {
    function renderizarAba(prefixo, categoriaAlvo) {
        const mes    = document.getElementById(`filtro-mes-${prefixo}`).value;
        const busca  = document.getElementById(`filtro-busca-${prefixo}`).value.toUpperCase();
        const status = document.getElementById(`filtro-status-${prefixo}`).value;
        const listaFinal = demandas
            .filter(d => getCategoriaDemanda(d) === categoriaAlvo)
            .filter(d => {
                const bateMes    = !mes    || d.data.startsWith(mes);
                const bateBusca  = !busca  || (d.titulo + ' ' + d.setor + ' ' + d.solicitante).includes(busca);
                const bateStatus = !status || d.status === status;
                return bateMes && bateBusca && bateStatus;
            });
        document.getElementById(`dash-${prefixo}-total`).innerText     = listaFinal.length;
        document.getElementById(`dash-${prefixo}-pendente`).innerText  = listaFinal.filter(d => d.status === 'Pendente').length;
        document.getElementById(`dash-${prefixo}-andamento`).innerText = listaFinal.filter(d => d.status === 'Em Andamento').length;
        document.getElementById(`dash-${prefixo}-concluido`).innerText = listaFinal.filter(d => d.status === 'Concluído').length;
        const tbody = document.querySelector(`#tabela-${prefixo} tbody`);
        tbody.innerHTML = listaFinal.length === 0
            ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhum registro.</td></tr>'
            : listaFinal.map(d => criarLinhaTabelaSimples(d, prefixo)).join('');
    }
    renderizarAba('predial', 'PREDIAL');
    renderizarAba('ar',      'AR');
    renderizarAba('limpeza', 'LIMPEZA');
};

// ── CRUD ─────────────────────────────────────────────────────────
async function salvarDemandaEspecifica(prefixo, contratadaFixa) {
    const novaDemanda = {
        numero_os:  document.getElementById(`${prefixo}-numero-os`).value.toUpperCase(),
        titulo:     document.getElementById(`${prefixo}-titulo`).value.toUpperCase(),
        setor:      document.getElementById(`${prefixo}-setor`).value.toUpperCase(),
        solicitante:document.getElementById(`${prefixo}-solicitante`).value.toUpperCase(),
        prioridade: document.getElementById(`${prefixo}-prioridade`).value,
        data:       document.getElementById(`${prefixo}-data`).value,
        hora:       document.getElementById(`${prefixo}-hora`).value,
        contratada: contratadaFixa.toUpperCase(),
        status:     'Pendente',
        data_fim:   null
    };
    const { error } = await sb.from('demandas').insert(novaDemanda);
    if (error) alert('Erro: ' + error.message);
    else {
        alert('Solicitação Registrada!');
        document.getElementById(`form-${prefixo}`).reset();
        const brt = DateUtils.getToInput();
        document.getElementById(`${prefixo}-data`).value = brt.slice(0, 10);
        document.getElementById(`${prefixo}-hora`).value = brt.slice(11, 16);
        carregarDados();
    }
}

window.avancarStatus = async function(id) {
    const item = demandas.find(d => d.id == id); if (!item) return;
    let novoStatus = item.status, novaDataFim = item.data_fim;
    if (item.status === 'Pendente')      novoStatus = 'Em Andamento';
    else if (item.status === 'Em Andamento') { novoStatus = 'Concluído'; novaDataFim = DateUtils.getNowDatabaseISO(); }
    await sb.from('demandas').update({ status: novoStatus, data_fim: novaDataFim }).eq('id', id);
    syncSheets('demandas', 'upsert', { ...item, status: novoStatus, data_fim: novaDataFim });
    carregarDados();
};

window.deletarDemanda = async function(id) {
    if (!confirm('Excluir?')) return;
    const item = demandas.find(d => d.id == id);
    await sb.from('demandas').delete().eq('id', id);
    syncSheets('demandas', 'delete', { id });
    registrarLog('Exclusão', 'Demandas', `Removeu demanda: ${item ? item.titulo : id}`);
    if (document.getElementById('demanda-id-edit').value == id) cancelarEdicaoDemanda();
    carregarDados();
};

window.editarDemanda = function(id) {
    const d = demandas.find(item => item.id == id); if (!d) return;
    if (!document.getElementById('demandas').classList.contains('active')) switchTab('demandas');
    document.getElementById('demanda-id-edit').value    = d.id;
    document.getElementById('demanda-numero-os').value  = d.numero_os || '';
    document.getElementById('demanda-titulo').value     = d.titulo;
    document.getElementById('demanda-setor').value      = d.setor;
    document.getElementById('demanda-solicitante').value= d.solicitante;
    document.getElementById('demanda-contratada').value = d.contratada || '';
    document.getElementById('demanda-prioridade').value = d.prioridade;
    document.getElementById('demanda-data').value       = d.data;
    document.getElementById('demanda-hora').value       = d.hora || '00:00';
    document.getElementById('titulo-form-demanda').innerHTML = '<i class="fas fa-edit"></i> Editando O.S. ' + d.id;
    const btn = document.getElementById('btn-submit-demanda');
    btn.innerText = "Salvar"; btn.style.background = "linear-gradient(135deg, var(--edit), #d97706)";
    document.getElementById('btn-cancel-demanda').style.display = "block";
    const selStatus = document.getElementById('demanda-status-edit');
    selStatus.style.display = "block"; selStatus.value = d.status;
    document.getElementById('demandas').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoDemanda = function() {
    document.getElementById('demanda-id-edit').value = "";
    document.getElementById('form-demanda').reset();
    document.getElementById('demanda-data').value = DateUtils.getToInput().slice(0, 10);
    document.getElementById('demanda-hora').value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('titulo-form-demanda').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Solicitação (Geral)';
    const btn = document.getElementById('btn-submit-demanda');
    btn.innerText = "Registrar Demanda"; btn.style.background = "linear-gradient(135deg, var(--accent), #6366f1)";
    document.getElementById('btn-cancel-demanda').style.display    = "none";
    document.getElementById('demanda-status-edit').style.display   = "none";
};

// ── Listeners de formulário ──────────────────────────────────────
document.getElementById('form-predial').addEventListener('submit', e => { e.preventDefault(); salvarDemandaEspecifica('predial', 'MANUTENÇÃO PREDIAL'); });
document.getElementById('form-ar').addEventListener('submit',      e => { e.preventDefault(); salvarDemandaEspecifica('ar',      'AR CONDICIONADO'); });
document.getElementById('form-limpeza').addEventListener('submit', e => { e.preventDefault(); salvarDemandaEspecifica('limpeza', 'LIMPEZA'); });

document.getElementById('form-demanda').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao    = document.getElementById('demanda-id-edit').value;
    const novaDemanda = {
        numero_os:  document.getElementById('demanda-numero-os').value.toUpperCase(),
        titulo:     document.getElementById('demanda-titulo').value.toUpperCase(),
        setor:      document.getElementById('demanda-setor').value.toUpperCase(),
        solicitante:document.getElementById('demanda-solicitante').value.toUpperCase(),
        contratada: document.getElementById('demanda-contratada').value.toUpperCase(),
        prioridade: document.getElementById('demanda-prioridade').value,
        data:       document.getElementById('demanda-data').value,
        hora:       document.getElementById('demanda-hora').value,
        status:     idEdicao ? document.getElementById('demanda-status-edit').value : 'Pendente',
        data_fim:   null
    };
    let error = null;
    if (idEdicao) {
        const itemAntigo = demandas.find(d => d.id == idEdicao);
        if (novaDemanda.status === 'Concluído' && (!itemAntigo || itemAntigo.status !== 'Concluído'))
            novaDemanda.data_fim = DateUtils.getNowDatabaseISO();
        else if (itemAntigo && itemAntigo.data_fim)
            novaDemanda.data_fim = itemAntigo.data_fim;
        registrarLog('Edição', 'Demandas', `Alterou demanda ID: ${idEdicao}`);
        const res = await sb.from('demandas').update(novaDemanda).eq('id', idEdicao); error = res.error;
        if (!error) syncSheets('demandas', 'upsert', novaDemanda);
    } else {
        const res = await sb.from('demandas').insert(novaDemanda); error = res.error;
        if (!error) { registrarLog('Criação', 'Demandas', 'Nova O.S. Gerada'); syncSheets('demandas', 'insert', novaDemanda); }
    }
    if (error) alert('Erro: ' + error.message); else { cancelarEdicaoDemanda(); carregarDados(); }
});

// Debounce busca de texto
let _timeoutBusca = null;
document.getElementById('filtro-texto-demanda').addEventListener('keyup', function() {
    clearTimeout(_timeoutBusca);
    _timeoutBusca = setTimeout(() => window.renderizarApenasDemandas(), 300);
});

// ── Modal de Impressão de O.S. ───────────────────────────────────
window.abrirModalImpressao = function(id) {
    osPrintAtualId = id;
    document.getElementById('print-input-descricao').value = "";
    document.getElementById('print-input-materiais').value = "";
    document.getElementById('modal-print').style.display   = "flex";
};

window.fecharModalImpressao = function() {
    document.getElementById('modal-print').style.display = "none";
};

window.executarAcaoOS = async function(modo) {
    const desc = document.getElementById('print-input-descricao').value;
    const mat  = document.getElementById('print-input-materiais').value;
    if (modo === 'pdf') {
        await gerarPDFOS(osPrintAtualId, desc, mat);
    } else {
        fecharModalImpressao();
        const html = gerarHTMLOS(osPrintAtualId, desc, mat);
        const pw   = window.open('', '_blank');
        if (pw && !pw.closed) {
            pw.document.open();
            pw.document.write(html);
            pw.document.close();
            // Aguarda imagens carregarem e dispara impressão diretamente
            const tentarImprimir = () => {
                try {
                    const imgs = pw.document.images;
                    const total = imgs.length;
                    if (total === 0) { pw.focus(); pw.print(); return; }
                    let loaded = 0;
                    const check = () => { loaded++; if (loaded >= total) { pw.focus(); pw.print(); } };
                    for (let i = 0; i < total; i++) {
                        if (imgs[i].complete) { check(); }
                        else { imgs[i].addEventListener('load', check); imgs[i].addEventListener('error', check); }
                    }
                } catch(e) { pw.focus(); pw.print(); }
            };
            if (pw.document.readyState === 'complete') tentarImprimir();
            else pw.addEventListener('load', tentarImprimir);
        } else {
            imprimirViaOverlay(html);
        }
    }
};

window.executarImpressao = function() { executarAcaoOS('print'); };

// ── Overlay de impressão (fallback iOS) ──────────────────────────
function imprimirViaOverlay(html) {
    let overlay = document.getElementById('print-overlay-mobile');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'print-overlay-mobile';
        overlay.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px;';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Fechar';
        closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:100000;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        closeBtn.onclick = () => { document.body.removeChild(overlay); };
        overlay.appendChild(closeBtn);
        const content = document.createElement('div');
        content.id = 'print-overlay-content';
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }
    document.getElementById('print-overlay-content').innerHTML = html;
    setTimeout(() => window.print(), 600);
    window.onafterprint = () => {
        const el = document.getElementById('print-overlay-mobile');
        if (el) document.body.removeChild(el);
    };
}

// ── Geração de PDF da O.S. (jsPDF puro) ─────────────────────────
async function gerarPDFOS(id, descricao, materiais) {
    const btnPDF       = document.getElementById('btn-acao-pdf');
    const textoOriginal = btnPDF.innerHTML;
    btnPDF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    btnPDF.disabled  = true;

    try {
        const d = montarDadosOS(id);
        if (!d) throw new Error('O.S. não encontrada.');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const PW = 200, OX = 5;
        let Y = 8;

        const sn = (str) => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '');

        // ── Helpers ──────────────────────────────────────────────
        const linhah = (y, lw)  => { pdf.setLineWidth(lw || 0.3); pdf.setDrawColor(0,0,0); pdf.line(OX, y, OX + PW, y); };
        const linhav = (x,y1,y2)=> { pdf.setLineWidth(0.3); pdf.setDrawColor(0,0,0); pdf.line(x, y1, x, y2); };
        const label  = (txt,x,y)=> { pdf.setFontSize(6.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(80,80,80); pdf.text(sn(txt), x, y); };
        const secao  = (txt, y, h) => {
            pdf.setFillColor(30,30,30); pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.4);
            pdf.rect(OX, y, PW, h, 'FD');
            pdf.setFontSize(7.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(255,255,255);
            pdf.text(sn(txt), OX + PW / 2, y + 3.6, { align: 'center' });
            pdf.setTextColor(0,0,0);
            linhah(y + h);
            return y + h;
        };

        // ── Cabeçalho ────────────────────────────────────────────
        const hdrH = 28;
        pdf.setLineWidth(0.5); pdf.setDrawColor(0,0,0); pdf.rect(OX, Y, PW, hdrH, 'S');

        const cW1 = PW * 0.18, cW3 = PW * 0.27, cW2 = PW - cW1 - cW3;
        const cx2 = OX + cW1, cx3 = OX + cW1 + cW2;
        linhav(cx2, Y, Y + hdrH); linhav(cx3, Y, Y + hdrH);

        // Brasão
        try {
            await new Promise(resolve => {
                const img = new Image(); img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const cv = document.createElement('canvas');
                    cv.width  = img.naturalWidth  || img.width;
                    cv.height = img.naturalHeight || img.height;
                    cv.getContext('2d').drawImage(img, 0, 0);
                    const bW = 15, bH = 15;
                    pdf.addImage(cv.toDataURL('image/png'), 'PNG', OX + (cW1 - bW) / 2, Y + (hdrH - bH) / 2, bW, bH);
                    resolve();
                };
                img.onerror = resolve;
                img.src = 'brasao.jpg';
            });
        } catch(e) {}

        // Logo contratada
        const logoInfo = getLogoInfoParaOS(d);
        if (logoInfo) {
            try {
                await new Promise(resolve => {
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const cv = document.createElement('canvas');
                        cv.width  = img.naturalWidth  || img.width;
                        cv.height = img.naturalHeight || img.height;
                        cv.getContext('2d').drawImage(img, 0, 0);
                        const lW = 28, lH = 14;
                        pdf.addImage(cv.toDataURL('image/png'), 'PNG', cx3 + (cW3 - lW) / 2, Y + 2, lW, lH);
                        resolve();
                    };
                    img.onerror = resolve;
                    img.src = logoInfo.src;
                });
            } catch(e) {}
        }

        // Textos do cabeçalho central
        const ctrX = cx2 + cW2 / 2;
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(9.5); pdf.setFont('helvetica','bold');
        pdf.text('GOVERNO DO ESTADO DE SAO PAULO', ctrX, Y + 6, { align: 'center' });
        pdf.setFontSize(7.5); pdf.setFont('helvetica','normal');
        pdf.text('SECRETARIA DA EDUCACAO', ctrX, Y + 10.5, { align: 'center' });
        pdf.text('COORDENADORIA GERAL DE SUPORTE ADMINISTRATIVO - DIVISAO DE ZELADORIA', ctrX, Y + 14.5, { align: 'center' });
        pdf.setFont('helvetica','bold');
        pdf.text('ORDEM DE SERVICO', ctrX, Y + 20, { align: 'center' });

        // OS número + coluna direita
        const numDisplay = d.numero_os ? `O.S. No. ${sn(d.numero_os)}` : `O.S. ID ${d.id}`;
        pdf.setFontSize(7); pdf.setFont('helvetica','normal'); pdf.setTextColor(60,60,60);
        pdf.text('NUMERO DA O.S.', cx3 + cW3 / 2, Y + 19, { align: 'center' });
        pdf.setFontSize(11); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        pdf.text(numDisplay, cx3 + cW3 / 2, Y + 25, { align: 'center' });

        Y += hdrH;

        // ── Seção 1 — Identificação ──────────────────────────────
        Y = secao('1. IDENTIFICACAO DA SOLICITACAO', Y, 5);

        const r1H = 12;
        linhav(OX + PW * 0.25, Y, Y + r1H); linhav(OX + PW * 0.75, Y, Y + r1H);
        label('DATA E HORA DE ABERTURA',    OX + 1,           Y + 3.5);
        pdf.setFontSize(8.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        pdf.text(sn(`${formatarData(d.data)} ${d.hora || ''}`), OX + 2, Y + 8);
        label('SOLICITANTE / CONTATO',      OX + PW * 0.25 + 1, Y + 3.5);
        pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
        pdf.text(sn(d.solicitante || ''), OX + PW * 0.25 + 2, Y + 8);
        label('PRIORIDADE NO SISTEMA',      OX + PW * 0.75 + 1, Y + 3.5);
        pdf.setFontSize(8.5); pdf.setFont('helvetica','bold');
        pdf.text(sn(d.prioridade || ''), OX + PW * 0.75 + 2, Y + 8);
        linhah(Y + r1H); Y += r1H;

        linhav(OX + PW * 0.75, Y, Y + r1H);
        label('UNIDADE / SETOR DE ORIGEM', OX + 1, Y + 3.5);
        pdf.setFontSize(8.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
        pdf.text(sn(d.setor || ''), OX + 2, Y + 8);
        label('STATUS ATUAL', OX + PW * 0.75 + 1, Y + 3.5);
        pdf.setFontSize(8.5); pdf.setFont('helvetica','bold');
        pdf.text(sn(d.status || ''), OX + PW * 0.75 + 2, Y + 8);
        linhah(Y + r1H, 0.5); Y += r1H;

        // ── Seção 2 — Descrição ──────────────────────────────────
        Y = secao('2. DESCRICAO DA DEMANDA (PREENCHIMENTO PELO SISTEMA)', Y, 5);
        pdf.setFontSize(6.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(80,80,80);
        pdf.text('TITULO / DESCRICAO', OX + 1, Y + 4);
        pdf.setFontSize(9.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        const tituloW = PW - 4;
        pdf.setFontSize(9); pdf.setFont('helvetica','bold');
        const tLines = pdf.splitTextToSize(sn(d.titulo || ''), tituloW);
        pdf.text(tLines, OX + 2, Y + 9);
        const tH = Math.max(18, tLines.length * 5 + 10);
        linhah(Y + tH, 0.5); Y += tH;

        // ── Seção 3 — Execução ───────────────────────────────────
        Y = secao('3. PARECER TECNICO E EXECUCAO (PREENCHIMENTO PELA EQUIPE)', Y, 5);

        const chks = montarCheckboxes(d);
        const equipes = [
            [chks.limpeza,    'LIMPEZA PREDIAL'],
            [chks.ar,         'AR CONDICIONADO'],
            [chks.manut,      'MANUTENCAO PREDIAL'],
            [chks.elevador,   'MANUT. DE ELEVADORES'],
            [chks.ti,         'SUPORTE TI'],
            [chks.telefonia,  'TELEFONIA'],
            [chks.extintores, 'MANUT. E RECARGA EXTINTORES'],
            ['[ ]',           'OUTROS: _______________________'],
        ];
        pdf.setFontSize(8); pdf.setFont('helvetica','normal');
        const colW3 = PW / 3;
        equipes.forEach((eq, i) => {
            const col    = i % 3;
            const row    = Math.floor(i / 3);
            const ex     = OX + 2 + col * colW3;
            const ey     = Y + 8 + row * 5.5;
            const marcado = eq[0] === '[X]';
            pdf.setFont('helvetica', marcado ? 'bold' : 'normal');
            pdf.setTextColor(marcado ? 0 : 80, marcado ? 120 : 80, marcado ? 0 : 80);
            pdf.text(`${eq[0]} ${sn(eq[1])}`, ex, ey);
        });
        pdf.setTextColor(0,0,0);
        const eqH = Math.ceil(equipes.length / 3) * 5.5 + 11;
        linhah(Y + eqH); Y += eqH;

        // Checkboxes locais
        label('LOCAL DE ATUACAO / PREDIO VINCULADO', OX + 1, Y + 4);
        const locais = ['SEDE','AROUCHE','EFAPE','ARMENIA','CASA VERDE','SAO DOMINGOS','CAJAMAR','TENENTE PENA','CENTRO OESTE','CAPE'];
        pdf.setFontSize(8); pdf.setFont('helvetica','normal'); pdf.setTextColor(80,80,80);
        const colW4 = PW / 4;
        locais.forEach((loc, i) => {
            const col = i % 4, row = Math.floor(i / 4);
            pdf.text(`[ ] ${sn(loc)}`, OX + 2 + col * colW4, Y + 8 + row * 5.5);
        });
        const rowsLoc = Math.ceil(locais.length / 4);
        pdf.text('[ ] OUTRO: ______________________________', OX + 2, Y + 8 + rowsLoc * 5.5);
        pdf.setTextColor(0,0,0);
        const locH = (rowsLoc + 1) * 5.5 + 10;
        pdf.setLineWidth(0.5); linhah(Y + locH); pdf.setLineWidth(0.3);
        Y += locH;

        // Campos de texto livres
        const camposMH = 35;
        const midX = OX + PW / 2;
        linhav(midX, Y, Y + camposMH);
        label('DESCRICAO DETALHADA DOS SERVICOS EXECUTADOS', OX + 1, Y + 4);
        if (descricao && descricao.trim()) {
            pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
            const dLines = pdf.splitTextToSize(sn(descricao.toUpperCase()), midX - OX - 4);
            pdf.text(dLines, OX + 2, Y + 9);
        }
        label('MATERIAIS E PECAS UTILIZADOS (REPOSICAO)', midX + 1, Y + 4);
        if (materiais && materiais.trim()) {
            pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
            const mLines = pdf.splitTextToSize(sn(materiais.toUpperCase()), OX + PW - midX - 4);
            pdf.text(mLines, midX + 2, Y + 9);
        }
        pdf.setLineWidth(0.5); linhah(Y + camposMH); pdf.setLineWidth(0.3);
        Y += camposMH;

        // ── Seção 4 — Encerramento ───────────────────────────────
        Y = secao('4. TERMO DE ENCERRAMENTO E ACEITE FISCAL', Y, 5);
        const enc4H = 14;
        const e1x = OX + PW * 0.25, e2x = OX + PW * 0.50;
        linhav(e1x, Y, Y + enc4H); linhav(e2x, Y, Y + enc4H);
        label('INICIO DO ATENDIMENTO',  OX + 1,  Y + 3.5);
        pdf.setFontSize(8); pdf.text('___/___/20___ AS ___:___', OX + 2, Y + 9);
        label('TERMINO DO ATENDIMENTO', e1x + 1, Y + 3.5);
        pdf.setFontSize(8); pdf.text('___/___/20___ AS ___:___', e1x + 2, Y + 9);
        label('OBSERVACOES FINAIS / PENDENCIAS', e2x + 1, Y + 3.5);
        linhah(Y + enc4H); Y += enc4H;

        // ── Assinaturas ──────────────────────────────────────────
        const sigH = 28, sigW = PW / 3;
        linhav(OX + sigW,     Y, Y + sigH);
        linhav(OX + sigW * 2, Y, Y + sigH);
        const sigs = [
            ['TECNICO EXECUTOR',       'Nome legivel / Matricula / Empresa'],
            ['GESTOR / FISCAL (DZEL)', 'Carimbo e Assinatura'],
            ['SOLICITANTE / RECEBEDOR','Atesto a conformidade do servico'],
        ];
        sigs.forEach((sig, i) => {
            const sx = OX + 3 + i * sigW;
            pdf.setLineWidth(0.2); pdf.line(sx, Y + sigH - 10, sx + sigW - 6, Y + sigH - 10); pdf.setLineWidth(0.3);
            pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
            pdf.text(sig[0], sx + (sigW - 6) / 2, Y + sigH - 6, { align: 'center' });
            pdf.setFontSize(7); pdf.setFont('helvetica','normal'); pdf.setTextColor(80,80,80);
            pdf.text(sig[1], sx + (sigW - 6) / 2, Y + sigH - 2.5, { align: 'center' });
        });
        linhah(Y + sigH); Y += sigH;

        // Borda externa + rodapé
        pdf.setLineWidth(0.7); pdf.rect(OX, 8, PW, Y - 8);
        pdf.setFontSize(7); pdf.setFont('helvetica','italic'); pdf.setTextColor(100,100,100);
        pdf.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, OX + PW / 2, Y + 4, { align: 'center' });

        const nomeArq = d.numero_os ? String(d.numero_os).replace(/[^a-zA-Z0-9]/g,'_') : d.id;
        pdf.save(`OS_${nomeArq}.pdf`);
        fecharModalImpressao();

    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        alert('Não foi possível gerar o PDF: ' + err.message);
    } finally {
        btnPDF.innerHTML = textoOriginal;
        btnPDF.disabled  = false;
    }
}

// ── Geração de HTML da O.S. (para impressão) ────────────────────
function gerarHTMLOS(id, descricao, materiais) {
    const d = montarDadosOS(id);
    if (!d) return '<html><body><p>Erro: OS não encontrada.</p></body></html>';
    const baseHref = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const logoInfo = getLogoInfoParaOS(d);
    const logoTag  = logoInfo
        ? `<img src="${baseHref}${logoInfo.src}" style="max-width:${logoInfo.width};max-height:${logoInfo.height};object-fit:${logoInfo.fit};">`
        : '';
    const chks = montarCheckboxes(d);
    return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="${baseHref}">
<title>O.S. ${d.numero_os || d.id}</title>
<style>
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;width:100%;background:#fff;}
  body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:8mm;}
  @page{size:A4 portrait;margin:8mm;}
  @media print{
    html,body{padding:0;margin:0;}
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}
    .os-container{width:100%;border:2px solid #000;page-break-inside:avoid;}
  }
  @media screen{
    body{padding:10px;background:#e0e0e0;}
    .os-wrapper{background:#fff;width:210mm;min-height:297mm;margin:0 auto;padding:8mm;box-shadow:0 0 20px rgba(0,0,0,0.3);}
  }
  .os-container{border:2px solid #000;width:100%;}
  .os-grid-row{display:flex;border-bottom:1px solid #000;}
  .os-grid-row.border-thick{border-bottom:2px solid #000;}
  .os-cell{padding:4px 6px;min-height:28px;display:flex;flex-direction:column;justify-content:center;}
  .os-label{font-size:7px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:2px;}
  .os-value{font-size:10px;font-weight:700;text-transform:uppercase;}
  .os-value.destaque{font-size:12px;}
  .os-secao-titulo{background:#1e1e1e;color:#fff;font-size:8px;font-weight:700;padding:3px 6px;text-transform:uppercase;letter-spacing:.5px;}
  .os-secao-titulo.top-border{border-top:2px solid #000;}
  .os-header-center{flex:1;text-align:center;padding:6px;border-right:1px solid #000;border-left:1px solid #000;}
  .os-header-center h3{margin:0;font-size:11px;}
  .os-header-center h4{margin:2px 0;font-size:9px;font-weight:400;}
  .os-header-center p{margin:2px 0;font-size:8px;}
  .os-logo-box{width:50px;display:flex;align-items:center;justify-content:center;padding:4px;border-right:1px solid #000;}
  .os-logo-box img{max-width:40px;max-height:40px;object-fit:contain;}
  .os-header-right{width:120px;text-align:center;padding:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .os-header-right p{font-size:7px;margin:0;color:#555;}
  .os-header-right img{max-width:80px;max-height:35px;object-fit:contain;margin:3px 0;}
  .os-numero{font-size:12px;margin:0;}
  .os-checkbox-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:4px 0;font-size:8px;}
  .os-checkbox-grid.locais{grid-template-columns:repeat(4,1fr);}
  .row-expand .os-cell{min-height:70px;align-items:flex-start;}
  .os-signatures{min-height:55px;}
  .os-sig-box{flex:1;padding:4px 6px;display:flex;align-items:flex-end;justify-content:center;border-right:1px solid #000;}
  .os-sig-box:last-child{border-right:none;}
  .os-sig-line{border-top:1px solid #000;width:80%;text-align:center;padding-top:3px;font-size:8px;font-weight:700;}
  .os-sig-line span{display:block;font-weight:400;font-size:7px;color:#555;}
  .os-footer-print{text-align:center;font-size:7px;color:#666;margin-top:4px;font-style:italic;}
</style>
</head><body>
<div class="os-wrapper">
<div class="os-container">
  <div class="os-grid-row border-thick">
    <div class="os-logo-box"><img src="${baseHref}brasao.jpg" alt="SP"></div>
    <div class="os-header-center">
      <h3>GOVERNO DO ESTADO DE SÃO PAULO</h3>
      <h4>SECRETARIA DA EDUCAÇÃO</h4>
      <p>COORDENADORIA GERAL DE SUPORTE ADMINISTRATIVO - DIVISÃO DE ZELADORIA</p>
    </div>
    <div class="os-header-right">
      <p>ORDEM DE SERVIÇO</p>${logoTag}
      <h3 class="os-numero">Nº ${d.numero_os || d.id}</h3>
    </div>
  </div>
  <div class="os-secao-titulo">1. IDENTIFICAÇÃO DA SOLICITAÇÃO</div>
  <div class="os-grid-row">
    <div class="os-cell" style="flex:0 0 25%;border-right:1px solid #000"><div class="os-label">DATA E HORA DE ABERTURA</div><div class="os-value">${formatarData(d.data)} ${d.hora || ''}</div></div>
    <div class="os-cell" style="flex:0 0 50%;border-right:1px solid #000"><div class="os-label">SOLICITANTE / CONTATO</div><div class="os-value">${d.solicitante || ''}</div></div>
    <div class="os-cell" style="flex:0 0 25%"><div class="os-label">PRIORIDADE</div><div class="os-value">${d.prioridade || ''}</div></div>
  </div>
  <div class="os-grid-row border-thick">
    <div class="os-cell" style="flex:0 0 75%;border-right:1px solid #000"><div class="os-label">UNIDADE / SETOR</div><div class="os-value">${d.setor || ''}</div></div>
    <div class="os-cell" style="flex:0 0 25%"><div class="os-label">STATUS</div><div class="os-value">${d.status || ''}</div></div>
  </div>
  <div class="os-secao-titulo">2. DESCRIÇÃO DA DEMANDA</div>
  <div class="os-grid-row border-thick" style="min-height:60px">
    <div class="os-cell" style="flex:1"><div class="os-value destaque">${d.titulo || ''}</div></div>
  </div>
  <div class="os-secao-titulo">3. PARECER TÉCNICO E EXECUÇÃO</div>
  <div class="os-grid-row">
    <div class="os-cell" style="flex:1">
      <div class="os-label">EQUIPE RESPONSÁVEL</div>
      <div class="os-checkbox-grid">
        <div>${chks.limpeza} LIMPEZA PREDIAL</div><div>${chks.ar} AR CONDICIONADO</div><div>${chks.manut} MANUTENÇÃO PREDIAL</div>
        <div>${chks.elevador} MANUT. ELEVADORES</div><div>${chks.ti} SUPORTE TI</div><div>${chks.telefonia} TELEFONIA</div>
        <div>${chks.extintores} MANUT. EXTINTORES</div><div>☐ OUTROS: _____________</div>
      </div>
    </div>
  </div>
  <div class="os-grid-row border-thick">
    <div class="os-cell" style="flex:1">
      <div class="os-label">LOCAL DE ATUAÇÃO</div>
      <div class="os-checkbox-grid locais">
        <div>☐ SEDE</div><div>☐ AROUCHE</div><div>☐ EFAPE</div><div>☐ ARMÊNIA</div>
        <div>☐ CASA VERDE</div><div>☐ SÃO DOMINGOS</div><div>☐ CAJAMAR</div><div>☐ TENENTE PENA</div>
        <div>☐ CENTRO OESTE</div><div>☐ CAPE</div><div style="grid-column:span 2">☐ OUTRO: ___________</div>
      </div>
    </div>
  </div>
  <div class="os-grid-row row-expand">
    <div class="os-cell" style="flex:0 0 50%;border-right:1px solid #000"><div class="os-label">SERVIÇOS EXECUTADOS</div><div style="font-size:11px;white-space:pre-wrap;margin-top:4px">${(descricao || '').toUpperCase()}</div></div>
    <div class="os-cell" style="flex:0 0 50%"><div class="os-label">MATERIAIS UTILIZADOS</div><div style="font-size:11px;white-space:pre-wrap;margin-top:4px">${(materiais || '').toUpperCase()}</div></div>
  </div>
  <div class="os-secao-titulo top-border">4. TERMO DE ENCERRAMENTO E ACEITE FISCAL</div>
  <div class="os-grid-row">
    <div class="os-cell" style="flex:0 0 25%;border-right:1px solid #000;text-align:center"><div class="os-label" style="text-align:center">INÍCIO</div><div style="margin-top:12px">___/___/20___ ÀS ___:___</div></div>
    <div class="os-cell" style="flex:0 0 25%;border-right:1px solid #000;text-align:center"><div class="os-label" style="text-align:center">TÉRMINO</div><div style="margin-top:12px">___/___/20___ ÀS ___:___</div></div>
    <div class="os-cell" style="flex:1"><div class="os-label">OBSERVAÇÕES FINAIS</div></div>
  </div>
  <div class="os-grid-row os-signatures">
    <div class="os-sig-box"><div class="os-sig-line">TÉCNICO EXECUTOR<span>Nome / Matrícula / Empresa</span></div></div>
    <div class="os-sig-box"><div class="os-sig-line">GESTOR / FISCAL (DZEL)<span>Carimbo e Assinatura</span></div></div>
    <div class="os-sig-box"><div class="os-sig-line">SOLICITANTE / RECEBEDOR<span>Atesto a conformidade</span></div></div>
  </div>
</div>
</div><!-- /os-container -->
<div class="os-footer-print">Documento impresso em ${new Date().toLocaleString('pt-BR')} | DIVISÃO DE ZELADORIA — COGESPA</div>
</div><!-- /os-wrapper -->
<script>
  window.addEventListener('load', function() {
    var imgs = document.images, total = imgs.length, loaded = 0;
    function tryPrint() { loaded++; if (loaded >= total) setTimeout(function(){ window.print(); }, 300); }
    if (total === 0) setTimeout(function(){ window.print(); }, 300);
    else imgs.forEach(function(img){ if(img.complete){ tryPrint(); } else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); } });
  });
  window.addEventListener('afterprint', function() { try { window.close(); } catch(e){} });
<\/script>
</body></html>`;
}

// ── WhatsApp Demanda ─────────────────────────────────────────────
window.enviarWhatsAppDemanda = function(id) {
    const d = demandas.find(i => i.id == id); if (!d) return;
    const ic = d.prioridade === 'Alta' ? '🚨' : '🔧';
    let t = `${ic} *ORDEM DE SERVIÇO* ${ic}\n\n`;
    if (d.numero_os) t += `*Nº O.S.:* ${d.numero_os}\n`;
    t += `*Status:* ${d.status}\n*Prioridade:* ${d.prioridade}\n*Serviço:* ${d.titulo}\n`;
    t += `*Setor:* ${d.setor}\n*Data:* ${formatarData(d.data)} ${d.hora || ''}\n`;
    t += `*Solicitante:* ${d.solicitante}\n`;
    if (d.contratada) t += `*Contratada:* ${d.contratada}\n`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`, '_blank');
};
