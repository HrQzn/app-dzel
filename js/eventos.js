// ================================================================
// DZEL — MÓDULO: EVENTOS
// ================================================================

window.renderizarApenasEventos = function() {
    const mes   = document.getElementById('filtro-mes-evento').value;
    const busca = document.getElementById('filtro-busca-evento').value.toUpperCase();
    const lista = eventos.filter(ev => {
        const bData  = !mes   || ev.data.startsWith(mes);
        const bTexto = !busca || (ev.nome + ev.organizador + ev.local).toUpperCase().includes(busca);
        return bData && bTexto;
    });
    document.getElementById('dash-eventos-qtd').innerText     = lista.length;
    document.getElementById('dash-eventos-interno').innerText = lista.filter(e => e.tipo === 'Interno').length;
    document.getElementById('dash-eventos-externo').innerText = lista.filter(e => e.tipo === 'Externo').length;
    document.getElementById('dash-eventos-publico').innerText = lista.reduce((sum, ev) => sum + (parseInt(ev.publico) || 0), 0);

    const btnExport = document.getElementById('btn-export-eventos');
    btnExport.style.display = pode('eventos', 'exportar') ? 'inline-flex' : 'none';

    const tbody = document.querySelector('#tabela-eventos tbody');
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhum evento encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(ev => {
        const badgeClass  = ev.tipo === 'Interno' ? 'bg-interno' : 'bg-externo';
        const iconCoffee  = ev.coffee ? '<i class="fas fa-coffee" style="color:#92400e;margin-left:6px;" title="Coffee Break"></i>' : '';
        const obsText     = ev.obs ? `<div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;margin-top:3px;border-top:1px dashed var(--border);padding-top:3px">${ev.obs}</div>` : '';
        let buttons = '';
        if (pode('eventos', 'editar'))  buttons += `<button onclick="editarEvento(${ev.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>`;
        if (pode('eventos', 'excluir')) buttons += `<button onclick="deletarEvento(${ev.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>`;
        return `<tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;"><strong>${formatarData(ev.data)}</strong></td>
            <td><span class="badge ${badgeClass}">${ev.tipo}</span></td>
            <td><strong>${ev.nome}</strong>${iconCoffee}<br><small style="color:var(--text-muted)">${ev.local}</small>${obsText}</td>
            <td>${ev.organizador}</td>
            <td><strong style="font-family:'JetBrains Mono',monospace;">${ev.publico}</strong></td>
            <td style="min-width:100px">${buttons}</td>
        </tr>`;
    }).join('');
};

// ── CRUD ─────────────────────────────────────────────────────────
document.getElementById('form-evento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao  = document.getElementById('evento-id-edit').value;
    const id        = idEdicao || Date.now();
    const novoEvento = {
        id,
        nome:       document.getElementById('evento-nome').value.toUpperCase(),
        tipo:       document.getElementById('evento-tipo').value,
        organizador:document.getElementById('evento-organizador').value.toUpperCase(),
        data:       document.getElementById('evento-data').value,
        publico:    document.getElementById('evento-publico').value || 0,
        local:      document.getElementById('evento-local').value.toUpperCase(),
        coffee:     document.getElementById('evento-coffee').checked,
        obs:        document.getElementById('evento-obs').value.toUpperCase()
    };
    if (idEdicao) registrarLog('Edição',  'Eventos', `Editou evento: ${novoEvento.nome}`);
    else          registrarLog('Criação', 'Eventos', `Novo evento: ${novoEvento.nome}`);
    const { error } = await sb.from('eventos').upsert(novoEvento);
    if (error) alert('Erro: ' + error.message);
    else { syncSheets('eventos', 'upsert', novoEvento); cancelarEdicaoEvento(); carregarDados(); }
});

window.editarEvento = function(id) {
    const ev = eventos.find(i => i.id == id); if (!ev) return;
    document.getElementById('evento-id-edit').value      = ev.id;
    document.getElementById('evento-nome').value         = ev.nome;
    document.getElementById('evento-tipo').value         = ev.tipo;
    document.getElementById('evento-organizador').value  = ev.organizador;
    document.getElementById('evento-data').value         = ev.data;
    document.getElementById('evento-publico').value      = ev.publico;
    document.getElementById('evento-local').value        = ev.local;
    document.getElementById('evento-coffee').checked     = ev.coffee;
    document.getElementById('evento-obs').value          = ev.obs || '';
    document.getElementById('titulo-form-evento').innerHTML = '<i class="fas fa-edit"></i> Editando Evento';
    const btn = document.getElementById('btn-submit-evento');
    btn.innerText = "Salvar Alterações"; btn.style.background = "linear-gradient(135deg, var(--edit), #d97706)";
    document.getElementById('btn-cancel-evento').style.display = "block";
    document.getElementById('eventos').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoEvento = function() {
    document.getElementById('evento-id-edit').value = "";
    document.getElementById('form-evento').reset();
    document.getElementById('evento-data').value = DateUtils.getToInput().slice(0, 10);
    document.getElementById('titulo-form-evento').innerHTML = '<i class="fas fa-calendar-plus"></i> Registrar Evento';
    const btn = document.getElementById('btn-submit-evento');
    btn.innerText = "Salvar Evento"; btn.style.background = "linear-gradient(135deg, var(--evento), #be185d)";
    document.getElementById('btn-cancel-evento').style.display = "none";
};

window.deletarEvento = async function(id) {
    if (!confirm('Excluir este evento?')) return;
    const item = eventos.find(e => e.id == id);
    await sb.from('eventos').delete().eq('id', id);
    syncSheets('eventos', 'delete', { id });
    registrarLog('Exclusão', 'Eventos', `Removeu evento: ${item ? item.nome : id}`);
    if (document.getElementById('evento-id-edit').value == id) cancelarEdicaoEvento();
    carregarDados();
};
