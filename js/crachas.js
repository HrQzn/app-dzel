// ================================================================
// DZEL — MÓDULO: CRACHÁS
// ================================================================

window.renderizarApenasCrachas = function() {
    const busca       = document.getElementById('filtro-busca-cracha').value.toUpperCase();
    const statusFiltro= document.getElementById('filtro-status-cracha').value;
    const lista = crachas.filter(c => {
        const termo      = (c.nome + c.setor + (c.doc_identidade || '')).toUpperCase();
        const bateTexto  = !busca        || termo.includes(busca);
        const bateStatus = !statusFiltro || c.status === statusFiltro;
        return bateTexto && bateStatus;
    });
    document.getElementById('dash-cracha-solicitado').innerText   = lista.filter(c => c.status === 'Solicitado').length;
    document.getElementById('dash-cracha-confeccionado').innerText= lista.filter(c => c.status === 'Confeccionado').length;
    document.getElementById('dash-cracha-entregue').innerText     = lista.filter(c => c.status === 'Entregue').length;

    const btnExport = document.getElementById('btn-export-crachas');
    btnExport.style.display = pode('crachas', 'exportar') ? 'inline-flex' : 'none';

    const tbody = document.querySelector('#tabela-crachas tbody');
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhum crachá encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(c => {
        const badgeClass = c.status === 'Solicitado'
            ? 'bg-cracha-solicitado'
            : c.status === 'Confeccionado'
                ? 'bg-cracha-confeccionado'
                : 'bg-cracha-entregue';
        const dataEnt = c.data_entrega
            ? `<br><small style="color:var(--success);font-weight:600;"><i class="fas fa-check"></i> ${new Date(c.data_entrega).toLocaleDateString('pt-BR')}</small>`
            : '';
        let buttons = '';
        if (pode('crachas', 'editar'))  buttons += `<button onclick="editarCracha(${c.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>`;
        if (pode('crachas', 'excluir')) buttons += `<button onclick="deletarCracha(${c.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>`;
        return `<tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;">${formatarData(c.data_solicitacao)}</td>
            <td><strong>${c.nome}</strong><br><small style="color:var(--text-muted)">DOC: ${c.doc_identidade || '-'}</small></td>
            <td>${c.setor}<br><small style="color:var(--text-muted)">${c.cargo || '-'}</small></td>
            <td>Sala: <strong>${c.sala || '-'}</strong><br><small style="color:var(--text-muted)">Ramal: ${c.ramal || '-'}</small></td>
            <td><span class="badge ${badgeClass}">${c.status}</span>${dataEnt}</td>
            <td>${buttons}</td>
        </tr>`;
    }).join('');
};

// ── CRUD ─────────────────────────────────────────────────────────
document.getElementById('form-cracha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao  = document.getElementById('cracha-id-edit').value;
    const id        = idEdicao || Date.now();
    const novoCracha = {
        id,
        nome:           document.getElementById('cracha-nome').value.toUpperCase(),
        doc_identidade: document.getElementById('cracha-doc').value.toUpperCase(),
        setor:          document.getElementById('cracha-setor').value.toUpperCase(),
        cargo:          document.getElementById('cracha-cargo').value.toUpperCase(),
        sala:           document.getElementById('cracha-sala').value.toUpperCase(),
        ramal:          document.getElementById('cracha-ramal').value.toUpperCase(),
        tipo:           document.getElementById('cracha-tipo').value,
        status:         document.getElementById('cracha-status').value,
        data_solicitacao: document.getElementById('cracha-data').value,
        data_entrega:   document.getElementById('cracha-status').value === 'Entregue'
            ? new Date().toISOString() : null
    };
    if (idEdicao) registrarLog('Edição',  'Crachás', `Editou crachá de: ${novoCracha.nome}`);
    else          registrarLog('Criação', 'Crachás', `Solicitou crachá para: ${novoCracha.nome}`);
    const { error } = await sb.from('crachas').upsert(novoCracha);
    if (error) alert('Erro ao salvar crachá: ' + error.message);
    else { syncSheets('crachas', 'upsert', novoCracha); cancelarEdicaoCracha(); carregarDados(); }
});

window.editarCracha = function(id) {
    const c = crachas.find(item => item.id == id); if (!c) return;
    document.getElementById('cracha-id-edit').value     = c.id;
    document.getElementById('cracha-nome').value        = c.nome;
    document.getElementById('cracha-doc').value         = c.doc_identidade || '';
    document.getElementById('cracha-setor').value       = c.setor;
    document.getElementById('cracha-cargo').value       = c.cargo || '';
    document.getElementById('cracha-sala').value        = c.sala  || '';
    document.getElementById('cracha-ramal').value       = c.ramal || '';
    document.getElementById('cracha-tipo').value        = c.tipo;
    document.getElementById('cracha-data').value        = c.data_solicitacao;
    document.getElementById('cracha-status').value      = c.status;
    document.getElementById('titulo-form-cracha').innerHTML = '<i class="fas fa-edit"></i> Editando Crachá';
    const btn = document.getElementById('btn-submit-cracha');
    btn.innerText = "Salvar Alterações"; btn.style.background = "linear-gradient(135deg, var(--edit), #d97706)";
    document.getElementById('btn-cancel-cracha').style.display = "block";
    document.getElementById('crachas').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoCracha = function() {
    document.getElementById('cracha-id-edit').value = "";
    document.getElementById('form-cracha').reset();
    document.getElementById('cracha-data').value = DateUtils.getToInput().slice(0, 10);
    document.getElementById('titulo-form-cracha').innerHTML = '<i class="fas fa-id-card"></i> Novo Crachá';
    const btn = document.getElementById('btn-submit-cracha');
    btn.innerText = "Salvar Crachá"; btn.style.background = "linear-gradient(135deg, var(--cracha), #5b21b6)";
    document.getElementById('btn-cancel-cracha').style.display = "none";
};

window.deletarCracha = async function(id) {
    if (!confirm('Excluir este crachá?')) return;
    const item = crachas.find(c => c.id == id);
    await sb.from('crachas').delete().eq('id', id);
    syncSheets('crachas', 'delete', { id });
    registrarLog('Exclusão', 'Crachás', `Removeu crachá: ${item ? item.nome : id}`);
    if (document.getElementById('cracha-id-edit').value == id) cancelarEdicaoCracha();
    carregarDados();
};
