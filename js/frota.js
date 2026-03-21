// ================================================================
// DZEL — MÓDULO: GARAGEM / FROTA
// ================================================================

window.atualizarLabels = function() {
    const tipo = document.querySelector('input[name="tipoFluxo"]:checked').value;
    const btn  = document.getElementById('btn-submit-veiculo');
    if (!document.getElementById('veiculo-id-edit').value) btn.innerText = "Registrar Entrada";
    if (tipo === 'servidor') {
        btn.style.background = 'linear-gradient(135deg, var(--servidor), #1d4ed8)';
        document.getElementById('veiculo-setor').placeholder = "Setor de Origem";
    } else {
        btn.style.background = 'linear-gradient(135deg, var(--visitante), #6d28d9)';
        document.getElementById('veiculo-setor').placeholder = "Empresa / Setor Visitado";
    }
};

window.renderizarApenasFrota = function() {
    const mes   = document.getElementById('filtro-mes-frota').value;
    const busca = document.getElementById('filtro-busca-frota').value.toUpperCase();
    const lista = frota.filter(f => {
        const bData  = !mes   || f.hora_inicial.startsWith(mes);
        const bTexto = !busca || (f.motorista + f.carro + f.setor).toUpperCase().includes(busca);
        return bData && bTexto;
    });
    document.getElementById('dash-frota-total').innerText       = lista.length;
    document.getElementById('dash-frota-estacionados').innerText= lista.filter(f => f.status === 'Aberto').length;
    document.getElementById('dash-servidor-count').innerText    = lista.filter(f => f.tipo === 'servidor').length;
    document.getElementById('dash-visitante-count').innerText   = lista.filter(f => f.tipo === 'visitante').length;

    const btnExport = document.getElementById('btn-export-veiculos');
    btnExport.style.display = pode('veiculos', 'exportar') ? 'inline-flex' : 'none';

    const tbody = document.querySelector('#tabela-veiculos tbody');
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhum veículo encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(f => {
        const badge = f.status === 'Aberto'
            ? '<span class="badge bg-estacionado">ESTACIONADO</span>'
            : '<span class="badge bg-saiu">FINALIZADO</span>';
        const icon = f.tipo === 'servidor'
            ? '<span style="color:var(--servidor);font-size:0.75rem;font-weight:700;"><i class="fas fa-id-badge"></i> Servidor</span>'
            : '<span style="color:var(--visitante);font-size:0.75rem;font-weight:700;"><i class="fas fa-user-tag"></i> Visitante</span>';
        const dIn  = formatarDataHoraReal(f.hora_inicial);
        const dOut = f.hora_final ? formatarDataHoraReal(f.hora_final) : '-';
        const btnBaixa = (f.status === 'Aberto' && pode('veiculos', 'editar'))
            ? `<button onclick="baixaVeiculo(${f.id})" class="action-btn btn-baixa"><i class="fas fa-sign-out-alt"></i> Saída</button>`
            : '<i class="fas fa-check" style="color:var(--success);"></i>';
        let buttons = '';
        if (pode('veiculos', 'editar'))  buttons += `<button onclick="editarVeiculo(${f.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>`;
        if (pode('veiculos', 'excluir')) buttons += `<button onclick="deletarVeiculo(${f.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>`;
        return `<tr>
            <td>${badge}</td><td>${icon}</td>
            <td><strong>${f.motorista}</strong><br><small style="color:var(--text-muted)">${f.contato || ''}</small></td>
            <td>${f.carro}</td><td>${f.setor || '-'}</td>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;">Ent: ${dIn}<br>Sai: ${dOut}</td>
            <td style="min-width:140px">${btnBaixa}${buttons}</td>
        </tr>`;
    }).join('');
};

// ── CRUD ─────────────────────────────────────────────────────────
document.getElementById('form-veiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao    = document.getElementById('veiculo-id-edit').value;
    const id          = idEdicao || Date.now();
    const tipo        = document.querySelector('input[name="tipoFluxo"]:checked').value;
    const horaEntrada = idEdicao
        ? dataLocalParaISO(document.getElementById('veiculo-hora-saida').value)
        : dataLocalParaISO(DateUtils.getToInput());
    const novoVeiculo = {
        id, tipo,
        carro:       document.getElementById('veiculo-carro').value.toUpperCase(),
        motorista:   document.getElementById('veiculo-motorista').value.toUpperCase(),
        setor:       document.getElementById('veiculo-setor').value.toUpperCase(),
        contato:     document.getElementById('veiculo-contato').value.toUpperCase(),
        destino:     document.getElementById('veiculo-destino').value.toUpperCase(),
        km_inicial:  document.getElementById('veiculo-km-saida').value || 0,
        hora_inicial:horaEntrada,
        status:      idEdicao ? document.getElementById('veiculo-status-edit').value : 'Aberto',
        km_final:    null,
        hora_final:  null
    };
    if (idEdicao) {
        const ant = frota.find(f => f.id == id);
        if (novoVeiculo.status === 'Aberto') { novoVeiculo.hora_final = null; novoVeiculo.km_final = null; }
        else if (ant && ant.hora_final) { novoVeiculo.hora_final = ant.hora_final; novoVeiculo.km_final = ant.km_final; }
        registrarLog('Edição', 'Garagem', `Alterou registro: ${novoVeiculo.carro}`);
    }
    const { error } = await sb.from('frota').upsert(novoVeiculo);
    if (error) alert('Erro: ' + error.message);
    else { syncSheets('frota', 'upsert', novoVeiculo); cancelarEdicaoVeiculo(); window.atualizarLabels(); carregarDados(); }
});

window.editarVeiculo = function(id) {
    const f = frota.find(i => i.id == id); if (!f) return;
    document.getElementById('veiculo-id-edit').value    = f.id;
    document.getElementById('veiculo-carro').value      = f.carro;
    document.getElementById('veiculo-motorista').value  = f.motorista;
    document.getElementById('veiculo-setor').value      = f.setor || '';
    document.getElementById('veiculo-contato').value    = f.contato || '';
    document.getElementById('veiculo-destino').value    = f.destino;
    document.getElementById('veiculo-km-saida').value   = f.km_inicial;
    if (f.hora_inicial) {
        const dl = new Date(f.hora_inicial);
        dl.setMinutes(dl.getMinutes() - dl.getTimezoneOffset());
        document.getElementById('veiculo-hora-saida').value = dl.toISOString().slice(0, 16);
    }
    if (f.tipo === 'servidor') document.getElementById('radio-servidor').checked  = true;
    else                       document.getElementById('radio-visitante').checked = true;
    document.getElementById('titulo-form-veiculo').innerHTML = '<i class="fas fa-edit"></i> Editando';
    const btn = document.getElementById('btn-submit-veiculo');
    btn.innerText = "Salvar"; btn.style.background = "linear-gradient(135deg, var(--edit), #d97706)";
    document.getElementById('btn-cancel-veiculo').style.display          = "block";
    document.getElementById('container-status-veiculo').style.display    = "block";
    document.getElementById('veiculo-status-edit').value = f.status;
    window.atualizarLabels();
    document.getElementById('veiculos').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoVeiculo = function() {
    document.getElementById('veiculo-id-edit').value = "";
    document.getElementById('form-veiculo').reset();
    document.getElementById('veiculo-hora-saida').value = DateUtils.getToInput();
    document.getElementById('titulo-form-veiculo').innerHTML = '<i class="fas fa-parking"></i> Registrar Entrada';
    document.getElementById('btn-cancel-veiculo').style.display       = "none";
    document.getElementById('container-status-veiculo').style.display = "none";
    document.getElementById('radio-servidor').checked = true;
    window.atualizarLabels();
};

window.deletarVeiculo = async function(id) {
    if (!confirm('Excluir este registro?')) return;
    const item = frota.find(f => f.id == id);
    await sb.from('frota').delete().eq('id', id);
    syncSheets('frota', 'delete', { id });
    registrarLog('Exclusão', 'Garagem', `Removeu veículo: ${item ? item.carro : id}`);
    if (document.getElementById('veiculo-id-edit').value == id) cancelarEdicaoVeiculo();
    carregarDados();
};

window.baixaVeiculo = async function(id) {
    const km  = prompt("KM de Saída (Opcional):", "0");
    const upd = { status: 'Finalizado', hora_final: DateUtils.getNowDatabaseISO(), km_final: km || 0 };
    await sb.from('frota').update(upd).eq('id', id);
    const item = frota.find(f => f.id == id);
    syncSheets('frota', 'upsert', { ...item, ...upd });
    carregarDados();
};
