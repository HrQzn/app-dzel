// ================================================================
// DZEL — MÓDULO: OCORRÊNCIAS
// ================================================================

const _ocoGravClass = { 'Baixa':'bg-concluido','Média':'bg-andamento','Alta':'bg-pendente','Crítica':'bg-critica' };
const _ocoStatClass = { 'Aberta':'bg-aberta','Em Tratativa':'bg-tratativa','Encerrada':'bg-encerrada' };

function criarLinhaOcorrencia(o) {
    const dataFmt = formatarDataHoraReal(o.data_hora);
    const tempo   = o.status === 'Encerrada' && o.data_encerramento
        ? `<span class="time-badge"><i class="fas fa-flag-checkered"></i> ${calcularTempoOco(o.data_hora, o.data_encerramento)}</span>`
        : `<span class="time-badge" style="background:#fef3c7;color:#92400e;border-color:#fde68a"><i class="fas fa-hourglass-half"></i> ${calcularTempoOco(o.data_hora)}</span>`;
    const titulo  = o.numero ? `<strong>#${o.numero} — ${o.categoria}</strong>` : `<strong>${o.categoria}</strong>`;
    const desc    = (o.descricao || '').substring(0, 55) + ((o.descricao || '').length > 55 ? '…' : '');
    const btnWA   = `<button onclick="enviarWhatsAppOcorrencia(${o.id})" class="action-btn btn-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>`;
    const btnPDF  = `<button onclick="gerarPDFOcorrencia(${o.id})" class="action-btn btn-print" title="Gerar PDF"><i class="fas fa-file-pdf"></i></button>`;
    const btnEdit = pode('ocorrencias','editar')  ? `<button onclick="editarOcorrencia(${o.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>` : '';
    const btnDel  = pode('ocorrencias','excluir') ? `<button onclick="deletarOcorrencia(${o.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>` : '';
    return `<tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;white-space:nowrap">${dataFmt}</td>
        <td><span class="badge ${_ocoGravClass[o.gravidade] || 'bg-saiu'}">${o.gravidade}</span></td>
        <td>${titulo}<br><small style="color:var(--text-muted)">${o.unidade} — ${o.local}</small></td>
        <td>${desc}<br><small style="color:var(--text-muted)">Resp: ${o.responsavel}</small></td>
        <td><span class="badge ${_ocoStatClass[o.status] || 'bg-saiu'}">${o.status}</span></td>
        <td>${tempo}</td>
        <td style="min-width:150px">${btnWA}${btnPDF}${btnEdit}${btnDel}</td>
    </tr>`;
}

window.renderizarApenasOcorrencias = function() {
    const mes   = document.getElementById('filtro-mes-oco').value;
    const termo = document.getElementById('filtro-busca-oco').value.toUpperCase();
    const stat  = document.getElementById('filtro-status-oco').value;
    let abertas = 0, tratativa = 0, encerradas = 0;
    const lista = ocorrencias.filter(o => {
        const bM = !mes   || (o.data_hora || '').startsWith(mes);
        const bS = !stat  || o.status === stat;
        const bT = !termo || (o.unidade + o.local + o.categoria + o.descricao + o.responsavel + (o.numero || '')).toUpperCase().includes(termo);
        return bM && bS && bT;
    });
    for (const o of lista) {
        if (o.status === 'Aberta')            abertas++;
        else if (o.status === 'Em Tratativa') tratativa++;
        else if (o.status === 'Encerrada')    encerradas++;
    }
    document.getElementById('dash-oco-total').innerText      = lista.length;
    document.getElementById('dash-oco-abertas').innerText    = abertas;
    document.getElementById('dash-oco-tratativa').innerText  = tratativa;
    document.getElementById('dash-oco-encerradas').innerText = encerradas;

    renderPaginated({
        tableId: 'tabela-ocorrencias',
        items:   lista,
        rowFn:   criarLinhaOcorrencia,
        colspan: 7,
        emptyMsg: 'Nenhuma ocorrência encontrada.',
        filterKey: mes + '|' + termo + '|' + stat,
        rerender: window.renderizarApenasOcorrencias
    });
};

// ── CRUD ─────────────────────────────────────────────────────────
document.getElementById('form-ocorrencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao = document.getElementById('ocorrencia-id-edit').value;
    const id       = idEdicao || Date.now();
    const statusN  = idEdicao ? document.getElementById('oco-status-edit').value : 'Aberta';
    const novaOco  = {
        id,
        numero:      document.getElementById('oco-numero').value.toUpperCase(),
        unidade:     document.getElementById('oco-unidade').value.toUpperCase(),
        local:       document.getElementById('oco-local').value.toUpperCase(),
        contratada:  document.getElementById('oco-contratada').value.toUpperCase(),
        categoria:   document.getElementById('oco-categoria').value,
        gravidade:   document.getElementById('oco-gravidade').value,
        data_hora:   DateUtils.toDatabaseISO(document.getElementById('oco-data').value),
        responsavel: document.getElementById('oco-responsavel').value.toUpperCase(),
        descricao:   document.getElementById('oco-descricao').value.trim().toUpperCase(),
        status:      statusN,
        data_encerramento: null
    };
    if (idEdicao) {
        const ant = ocorrencias.find(o => o.id == id);
        if (statusN === 'Encerrada' && (!ant || ant.status !== 'Encerrada'))
            novaOco.data_encerramento = DateUtils.getNowDatabaseISO();
        else if (ant && ant.data_encerramento)
            novaOco.data_encerramento = ant.data_encerramento;
        registrarLog('Edição', 'Ocorrências', `Alterou ocorrência: ${novaOco.numero || id}`);
    } else {
        registrarLog('Criação', 'Ocorrências', `Nova ocorrência: ${novaOco.categoria} — ${novaOco.unidade}`);
    }
    const { error } = await sb.from('ocorrencias').upsert(novaOco);
    if (error) alert('Erro: ' + error.message);
    else { syncSheets('ocorrencias', 'upsert', novaOco); cancelarEdicaoOcorrencia(); carregarDados(['ocorrencias']); }
});

window.editarOcorrencia = function(id) {
    const o = ocorrencias.find(i => i.id == id); if (!o) return;
    document.getElementById('ocorrencia-id-edit').value = o.id;
    document.getElementById('oco-numero').value      = o.numero || '';
    document.getElementById('oco-unidade').value     = o.unidade;
    document.getElementById('oco-local').value       = o.local;
    document.getElementById('oco-contratada').value  = o.contratada || '';
    document.getElementById('oco-categoria').value   = o.categoria;
    document.getElementById('oco-gravidade').value   = o.gravidade;
    document.getElementById('oco-responsavel').value = o.responsavel;
    document.getElementById('oco-descricao').value   = o.descricao;
    if (o.data_hora) {
        const dl = new Date(o.data_hora);
        dl.setMinutes(dl.getMinutes() - dl.getTimezoneOffset());
        document.getElementById('oco-data').value = dl.toISOString().slice(0, 16);
    }
    document.getElementById('titulo-form-ocorrencia').innerHTML = '<i class="fas fa-pen"></i> Editando Ocorrência';
    const btn = document.getElementById('btn-submit-oco');
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    btn.style.background = 'linear-gradient(135deg, var(--edit), #d97706)';
    document.getElementById('btn-cancel-oco').style.display     = 'block';
    document.getElementById('oco-status-edit').style.display    = 'block';
    document.getElementById('oco-status-edit').value = o.status;
    document.getElementById('ocorrencias').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoOcorrencia = function() {
    document.getElementById('ocorrencia-id-edit').value = '';
    document.getElementById('form-ocorrencia').reset();
    document.getElementById('oco-data').value = DateUtils.getToInput();
    document.getElementById('titulo-form-ocorrencia').innerHTML = '<i class="fas fa-triangle-exclamation" style="color:var(--ocorrencia)"></i> Registrar Ocorrência';
    const btn = document.getElementById('btn-submit-oco');
    btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Registrar Ocorrência';
    btn.style.background = 'linear-gradient(135deg, var(--ocorrencia), #991b1b)';
    document.getElementById('btn-cancel-oco').style.display  = 'none';
    document.getElementById('oco-status-edit').style.display = 'none';
};

window.deletarOcorrencia = async function(id) {
    if (!confirm('Excluir esta ocorrência?')) return;
    const item = ocorrencias.find(o => o.id == id);
    await sb.from('ocorrencias').delete().eq('id', id);
    syncSheets('ocorrencias', 'delete', { id });
    registrarLog('Exclusão', 'Ocorrências', `Removeu ocorrência: ${item ? (item.numero || item.categoria) : id}`);
    carregarDados(['ocorrencias']);
};

// ── WhatsApp ─────────────────────────────────────────────────────
window.enviarWhatsAppOcorrencia = function(id) {
    const o = ocorrencias.find(i => i.id == id); if (!o) return;
    const ic = (o.gravidade === 'Crítica' || o.gravidade === 'Alta') ? '🚨' : o.gravidade === 'Baixa' ? 'ℹ️' : '⚠️';
    const dtStr = o.data_hora ? formatarDataHoraReal(o.data_hora) : '';
    let t = `${ic} *REGISTRO DE OCORRÊNCIA* ${ic}\n\n`;
    if (o.numero) t += `*Nº:* ${o.numero}\n`;
    t += `*Status:* ${o.status}\n*Gravidade:* ${o.gravidade}\n*Categoria:* ${o.categoria}\n`;
    t += `*Unidade:* ${o.unidade} — ${o.local}\n*Data/Hora:* ${dtStr}\n`;
    t += `*Responsável:* ${o.responsavel}\n\n*Descrição:*\n${o.descricao}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`, '_blank');
};

// ================================================================
// PDF DE OCORRÊNCIA — layout governamental preto e branco
// BUG FIX: descrição dinâmica (sem Math.max(130,...)) + multi-página
// ================================================================
window.gerarPDFOcorrencia = async function(id) {
    const o = ocorrencias.find(i => i.id == id); if (!o) return;
    try { await ensureJsPDF(); }   // carrega jsPDF sob demanda
    catch (e) { alert('Não foi possível carregar o gerador de PDF. Verifique a conexão e tente novamente.'); return; }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 200, OX = 5, RX = 205;
    let Y = 8;

    const s = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '');

    const hline    = (y, lw) => { pdf.setLineWidth(lw || 0.3); pdf.setDrawColor(0,0,0); pdf.line(OX, y, RX, y); };
    const vline    = (x,y1,y2,lw) => { pdf.setLineWidth(lw || 0.3); pdf.setDrawColor(0,0,0); pdf.line(x, y1, x, y2); };
    const caixa    = (x,y,w,h) => { pdf.setLineWidth(0.25); pdf.setDrawColor(0,0,0); pdf.rect(x,y,w,h,'S'); };
    const secHeader = (num, titulo, y) => {
        const h = 6.5;
        pdf.setFillColor(240,240,240); pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.4);
        pdf.rect(OX, y, PW, h, 'FD');
        pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        pdf.text(`${num}  ${s(titulo)}`, OX + PW/2, y + 4.3, { align: 'center' });
        return y + h;
    };
    const campo = (lbl, val, x, y, w, h) => {
        caixa(x, y, w, h);
        pdf.setFontSize(6.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(60,60,60);
        pdf.text(s(lbl), x + 2, y + 3.5);
        pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
        const linhas = pdf.splitTextToSize(s(String(val || '-').toUpperCase()), w - 4);
        pdf.text(linhas[0] || '', x + 2, y + h - 2.5);
    };

    pdf.setDrawColor(0,0,0);

    // ── Cabeçalho ────────────────────────────────────────────────
    const hdrH = 28;
    pdf.setLineWidth(0.6); pdf.rect(OX, Y, PW, hdrH, 'S');
    const cW1 = PW * 0.18, cW3 = PW * 0.27, cW2 = PW - cW1 - cW3;
    const cx2 = OX + cW1, cx3 = OX + cW1 + cW2;
    vline(cx2, Y, Y + hdrH, 0.3); vline(cx3, Y, Y + hdrH, 0.3);

    try {
        await new Promise(resolve => {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => {
                const cv = document.createElement('canvas');
                cv.width = img.naturalWidth || img.width; cv.height = img.naturalHeight || img.height;
                cv.getContext('2d').drawImage(img, 0, 0);
                const bW = 15, bH = 15;
                pdf.addImage(cv.toDataURL('image/png'), 'PNG', OX + (cW1 - bW)/2, Y + (hdrH - bH)/2, bW, bH);
                resolve();
            };
            img.onerror = resolve; img.src = 'brasao.jpg';
        });
    } catch(e) {}

    const ctrX = cx2 + cW2/2;
    pdf.setTextColor(0,0,0);
    pdf.setFontSize(10); pdf.setFont('helvetica','bold');
    pdf.text('GOVERNO DO ESTADO DE SAO PAULO', ctrX, Y + 6.5, { align: 'center' });
    pdf.setFontSize(8); pdf.setFont('helvetica','normal');
    pdf.text('SECRETARIA DA EDUCACAO', ctrX, Y + 11, { align: 'center' });
    pdf.text('COORDENADORIA GERAL DE SUPORTE ADMINISTRATIVO', ctrX, Y + 15, { align: 'center' });
    pdf.setFont('helvetica','bold');
    pdf.text('DIVISAO DE ZELADORIA  -  DZEL', ctrX, Y + 19.5, { align: 'center' });
    pdf.setLineWidth(0.2); pdf.line(cx2 + 5, Y + 21.5, cx3 - 5, Y + 21.5);
    pdf.setFontSize(8.5); pdf.setFont('helvetica','bold');
    pdf.text('REGISTRO DE OCORRENCIA', ctrX, Y + 26, { align: 'center' });

    const numDisplay = o.numero ? `No. ${s(o.numero)}` : `ID ${o.id}`;
    pdf.setFontSize(7); pdf.setFont('helvetica','normal'); pdf.setTextColor(60,60,60);
    pdf.text('NUMERO DO REGISTRO', cx3 + cW3/2, Y + 7, { align: 'center' });
    pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
    pdf.text(numDisplay, cx3 + cW3/2, Y + 15, { align: 'center' });
    const sW = cW3 - 10, sH = 5.5, sX = cx3 + 5, sY = Y + hdrH - 8;
    caixa(sX, sY, sW, sH);
    pdf.setFontSize(7); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
    pdf.text(s(o.status).toUpperCase(), sX + sW/2, sY + 3.8, { align: 'center' });

    Y += hdrH;

    // ── Barra de Resumo ──────────────────────────────────────────
    const barH = 8;
    caixa(OX, Y, PW, barH);
    const gW = 32, gH = 5, gX = OX + 2, gY = Y + 1.5;
    caixa(gX, gY, gW, gH);
    pdf.setFontSize(7); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
    pdf.text(`GRAVIDADE: ${s(o.gravidade || '').toUpperCase()}`, gX + gW/2, gY + 3.5, { align: 'center' });

    const dt      = o.data_hora ? new Date(o.data_hora) : new Date();
    const dataStr = dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const horaStr = dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    pdf.setFontSize(6.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(60,60,60);
    pdf.text('Abertura:', OX + 38, Y + 3.5);
    pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
    pdf.text(`${dataStr}  ${horaStr}`, OX + 38, Y + 7);
    pdf.setFontSize(6.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(60,60,60);
    pdf.text('Responsavel:', OX + 90, Y + 3.5);
    pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
    pdf.text(s((o.responsavel || '').toUpperCase()).substring(0, 44), OX + 90, Y + 7);

    Y += barH + 1;

    // ── Seção 1 — Identificação ──────────────────────────────────
    Y = secHeader('1.', 'IDENTIFICACAO DA OCORRENCIA', Y);
    const fH = 11, hw = PW/2;
    campo('UNIDADE / PREDIO',     o.unidade || '-',   OX,    Y, hw, fH);
    campo('LOCAL / SETOR',        o.local || '-',     OX+hw, Y, hw, fH); Y += fH;
    campo('CATEGORIA',            o.categoria || '-', OX,    Y, hw, fH);
    campo('CONTRATADA / EMPRESA', o.contratada||'-',  OX+hw, Y, hw, fH); Y += fH;

    const temEnc = o.status === 'Encerrada' && o.data_encerramento;
    if (temEnc) {
        const dtE = new Date(o.data_encerramento);
        const encStr = `${dtE.toLocaleDateString('pt-BR')}  ${dtE.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
        campo('DATA / HORA DE ABERTURA',    `${dataStr}  ${horaStr}`, OX,    Y, hw, fH);
        campo('DATA / HORA DE ENCERRAMENTO', encStr,                  OX+hw, Y, hw, fH);
    } else {
        campo('DATA / HORA DE ABERTURA', `${dataStr}  ${horaStr}`, OX, Y, PW, fH);
    }
    Y += fH + 1;

    // ── Seção 2 — Descrição (CORRIGIDA) ─────────────────────────
    Y = secHeader('2.', 'HISTORICO  /  DESCRICAO DETALHADA DA OCORRENCIA', Y);

    pdf.setFontSize(9.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
    const boxTxtW  = PW - 22;
    const descLines = pdf.splitTextToSize(s((o.descricao || '').toUpperCase()), boxTxtW);
    const lnH      = 6.5;
    const topPad   = 10;
    const botPad   = 8;
    const txtX     = OX + 6;
    const PAGE_H      = 297;
    const SIG_BLOCK_H = 6.5 + 22 + 1;
    const FOOTER_H    = 12;

    const drawDescLines = (linhas, startY) => {
        linhas.forEach((linha, i) => {
            const posY      = startY + topPad + i * lnH;
            const largLinha = pdf.getTextWidth(linha);
            const proporcao = largLinha / boxTxtW;
            const ehUltima  = (i === linhas.length - 1);
            if (ehUltima || proporcao < 0.55) {
                pdf.text(linha, txtX, posY);
            } else {
                const palavras = linha.split(' ');
                if (palavras.length <= 1) { pdf.text(linha, txtX, posY); return; }
                const largPalavras = palavras.reduce((sum, p) => sum + pdf.getTextWidth(p), 0);
                const espacoExtra  = (boxTxtW - largPalavras) / (palavras.length - 1);
                let curX = txtX;
                palavras.forEach((palavra, pi) => {
                    pdf.text(palavra, curX, posY);
                    if (pi < palavras.length - 1) curX += pdf.getTextWidth(palavra) + espacoExtra;
                });
            }
        });
    };

    const finalizarPagina = (yFinal, pageStartY) => {
        pdf.setLineWidth(0.7); pdf.setDrawColor(0,0,0);
        pdf.rect(OX, pageStartY, PW, yFinal - pageStartY, 'S');
        pdf.setFontSize(7); pdf.setFont('helvetica','italic'); pdf.setTextColor(80,80,80);
        pdf.text(
            `Documento gerado em ${new Date().toLocaleString('pt-BR')}   |   DIVISAO DE ZELADORIA - COGESPA`,
            OX + PW/2, yFinal + 4, { align: 'center' }
        );
    };

    const desenharAssinatura = () => {
        Y = secHeader('3.', 'TERMO DE CIENCIA E ASSINATURA DO FISCAL', Y);
        const sigH = 22, sigW = PW * 0.55, sigX = OX + (PW - PW * 0.55) / 2;
        pdf.setLineWidth(0.4); pdf.setDrawColor(0,0,0);
        pdf.line(sigX, Y + sigH - 9, sigX + sigW, Y + sigH - 9);
        pdf.setLineWidth(0.25);
        pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        pdf.text('GESTOR / FISCAL  (DZEL)', sigX + sigW/2, Y + sigH - 4.5, { align: 'center' });
        pdf.setFontSize(6.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(60,60,60);
        pdf.text('Carimbo, Assinatura e Matricula', sigX + sigW/2, Y + sigH - 1.2, { align: 'center' });
        Y += sigH;
    };

    const linesPerPage = (avail) => Math.max(1, Math.floor((avail - topPad - botPad) / lnH));
    const availDescPrimeira = PAGE_H - Y - SIG_BLOCK_H - FOOTER_H - 2;
    const lppFirst = linesPerPage(availDescPrimeira);

    if (descLines.length <= lppFirst) {
        // Caso 1: tudo na página 1
        const descBoxH = Math.max(40, descLines.length * lnH + topPad + botPad);
        caixa(OX, Y, PW, descBoxH);
        pdf.setFontSize(9.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
        drawDescLines(descLines, Y);
        Y += descBoxH + 1;
        desenharAssinatura();
        finalizarPagina(Y, 8);
    } else {
        // Caso 2: multi-página
        let remaining = [...descLines];
        let pageNum   = 1, pageStartY = 8;
        while (remaining.length > 0) {
            pdf.setFontSize(9.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
            const isLast = remaining.length <= lppFirst;
            const avail  = PAGE_H - Y - (isLast ? SIG_BLOCK_H : 0) - FOOTER_H - 2;
            const lpp    = linesPerPage(avail);
            const chunk  = remaining.slice(0, lpp);
            const boxH   = Math.max(40, chunk.length * lnH + topPad + botPad);
            caixa(OX, Y, PW, boxH);
            drawDescLines(chunk, Y);
            Y += boxH + 1;
            remaining = remaining.slice(lpp);
            if (remaining.length > 0) {
                finalizarPagina(Y, pageStartY);
                pdf.addPage(); pageNum++; pageStartY = 8; Y = 8;
                const contH = 9;
                pdf.setFillColor(240,240,240); pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.4);
                pdf.rect(OX, Y, PW, contH, 'FD');
                pdf.setFontSize(7.5); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
                const numCont = o.numero ? `R.O. No. ${s(o.numero)}` : `R.O. ID ${o.id}`;
                pdf.text(`DESCRICAO DA OCORRENCIA (cont. pg. ${pageNum})  —  ${numCont}`, OX + PW/2, Y + 6.2, { align: 'center' });
                Y += contH + 2;
            }
        }
        desenharAssinatura();
        finalizarPagina(Y, pageStartY);
    }

    const nomeArq = o.numero ? String(o.numero).replace(/[^a-zA-Z0-9]/g, '_') : o.id;
    pdf.save(`RO_${nomeArq}.pdf`);
};
