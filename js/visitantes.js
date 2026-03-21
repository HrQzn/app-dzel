// ================================================================
// DZEL — MÓDULO: VISITANTES / RECEPÇÃO
// ================================================================

// ── Câmera ───────────────────────────────────────────────────────
async function iniciarCamera() {
    const video      = document.getElementById('webcam-video');
    const imgPreview = document.getElementById('vis-preview');
    const btnCapt    = document.getElementById('btn-capturar-cam');
    const btnInic    = document.getElementById('btn-iniciar-cam');
    try {
        streamGeral = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject    = streamGeral;
        video.style.display      = "block";
        imgPreview.style.display = "none";
        btnCapt.style.display    = "inline-block";
        btnInic.style.display    = "none";
    } catch (err) {
        alert("Erro ao acessar câmera: " + err.message);
    }
}

function capturarFoto() {
    const video      = document.getElementById('webcam-video');
    const canvas     = document.getElementById('webcam-canvas');
    const imgPreview = document.getElementById('vis-preview');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    document.getElementById('vis-foto-base64').value = dataUrl;
    imgPreview.src = dataUrl;
    pararCamera();
}

function pararCamera() {
    const video      = document.getElementById('webcam-video');
    const imgPreview = document.getElementById('vis-preview');
    const btnCapt    = document.getElementById('btn-capturar-cam');
    const btnInic    = document.getElementById('btn-iniciar-cam');
    if (streamGeral) { streamGeral.getTracks().forEach(t => t.stop()); streamGeral = null; }
    video.style.display      = "none";
    imgPreview.style.display = "block";
    btnCapt.style.display    = "none";
    btnInic.style.display    = "inline-block";
}

// Upload de foto via input file
document.getElementById('vis-foto-input').addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('vis-foto-base64').value = ev.target.result;
        document.getElementById('vis-preview').src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// ── Renderização ─────────────────────────────────────────────────
const _defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Cpath fill='%23ccc' d='M50 50c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25zm0 10c16.7 0 50 8.3 50 25v15H0v-15c0-16.7 33.3-25 50-25z'/%3E%3C/svg%3E";

window.renderizarApenasVisitantes = function() {
    const mes   = document.getElementById('filtro-mes-vis').value;
    const termo = document.getElementById('filtro-busca-vis').value.toUpperCase();
    const lista = visitantes.filter(v => {
        const bateMes   = !mes   || v.entrada.startsWith(mes);
        const bateTermo = !termo || v.nome.toUpperCase().includes(termo)
            || v.doc.toUpperCase().includes(termo)
            || v.empresa.toUpperCase().includes(termo);
        return bateMes && bateTermo;
    });

    document.getElementById('dash-visitantes-ativos').innerText = lista.filter(v => v.status === 'Ativo').length;
    document.getElementById('dash-visitantes-total').innerText  = lista.length;

    const btnExport = document.getElementById('btn-export-visitantes');
    btnExport.style.display = pode('visitantes', 'exportar') ? 'inline-flex' : 'none';

    const tbody = document.querySelector('#tabela-visitantes tbody');
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">Nenhum visitante encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(v => {
        const badge    = v.status === 'Ativo'
            ? '<span class="badge bg-visitante-ativo">NA EMPRESA</span>'
            : '<span class="badge bg-saiu">SAIU</span>';
        const dataEnt  = formatarDataHoraReal(v.entrada);
        const dataSai  = v.saida ? formatarDataHoraReal(v.saida) : '-';
        const btnBaixa = (v.status === 'Ativo' && pode('visitantes', 'editar'))
            ? `<button onclick="baixaVisitante(${v.id})" class="action-btn btn-baixa"><i class="fas fa-sign-out-alt"></i> Saída</button>`
            : '<i class="fas fa-check" style="color:var(--success);"></i>';
        let buttons = '';
        if (pode('visitantes', 'editar'))  buttons += `<button onclick="editarVisitante(${v.id})" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>`;
        if (pode('visitantes', 'excluir')) buttons += `<button onclick="deletarVisitante(${v.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>`;
        const avatarSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Cpath fill='%23ccc' d='M50 50c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25zm0 10c16.7 0 50 8.3 50 25v15H0v-15c0-16.7 33.3-25 50-25z'/%3E%3C/svg%3E";
        return `<tr>
            <td>${badge}</td>
            <td><img src="${v.foto || avatarSrc}" class="avatar-table"><strong>${v.nome}</strong><br><small style="color:var(--text-muted)">${v.contato || ''}</small></td>
            <td>${v.empresa || '-'}<br><small style="color:var(--text-muted)">${v.doc}</small></td>
            <td>${v.responsavel}<br><small style="color:var(--text-muted)">${v.finalidade}</small></td>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;">Ent: ${dataEnt}<br>Sai: ${dataSai}</td>
            <td style="min-width:140px">${btnBaixa}${buttons}</td>
        </tr>`;
    }).join('');
};

// ── CRUD ─────────────────────────────────────────────────────────
document.getElementById('form-visitante').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEdicao   = document.getElementById('visitante-id-edit').value;
    const id         = idEdicao || Date.now();
    const fotoBase64 = document.getElementById('vis-foto-base64').value;
    const horaEntrada = idEdicao
        ? dataLocalParaISO(document.getElementById('vis-entrada').value)
        : dataLocalParaISO(DateUtils.getToInput());
    const novoVisitante = {
        id,
        foto:        fotoBase64 || null,
        nome:        document.getElementById('vis-nome').value.toUpperCase(),
        doc:         document.getElementById('vis-doc').value.toUpperCase(),
        empresa:     document.getElementById('vis-empresa').value.toUpperCase(),
        contato:     document.getElementById('vis-contato').value.toUpperCase(),
        responsavel: document.getElementById('vis-responsavel').value.toUpperCase(),
        finalidade:  document.getElementById('vis-finalidade').value.toUpperCase(),
        entrada:     horaEntrada,
        status:      idEdicao ? document.getElementById('vis-status-edit').value : 'Ativo',
        saida:       null
    };
    if (idEdicao) {
        const ant = visitantes.find(v => v.id == id);
        if (!novoVisitante.foto && ant && ant.foto) novoVisitante.foto = ant.foto;
        if (novoVisitante.status === 'Saiu' && (!ant || !ant.saida))
            novoVisitante.saida = new Date().toISOString();
        else if (ant && ant.saida)
            novoVisitante.saida = ant.saida;
        registrarLog('Edição', 'Visitantes', `Alterou visitante: ${novoVisitante.nome}`);
    }
    const { error } = await sb.from('visitantes').upsert(novoVisitante);
    if (error) alert('Erro: ' + error.message);
    else { syncSheets('visitantes', 'upsert', novoVisitante); cancelarEdicaoVisitante(); carregarDados(); }
});

window.editarVisitante = function(id) {
    const v = visitantes.find(i => i.id == id); if (!v) return;
    document.getElementById('visitante-id-edit').value  = v.id;
    document.getElementById('vis-nome').value       = v.nome;
    document.getElementById('vis-doc').value        = v.doc;
    document.getElementById('vis-empresa').value    = v.empresa;
    document.getElementById('vis-contato').value    = v.contato;
    document.getElementById('vis-responsavel').value= v.responsavel;
    document.getElementById('vis-finalidade').value = v.finalidade;
    if (v.entrada) {
        const dl = new Date(v.entrada);
        dl.setMinutes(dl.getMinutes() - dl.getTimezoneOffset());
        document.getElementById('vis-entrada').value = dl.toISOString().slice(0, 16);
    }
    const preview = document.getElementById('vis-preview');
    if (v.foto) { preview.src = v.foto; document.getElementById('vis-foto-base64').value = v.foto; }
    else        { preview.src = _defaultAvatar; document.getElementById('vis-foto-base64').value = ""; }
    document.getElementById('titulo-form-visitante').innerHTML = '<i class="fas fa-edit"></i> Editando Visitante';
    const btn = document.getElementById('btn-submit-vis');
    btn.innerText = "Salvar"; btn.style.background = "linear-gradient(135deg, var(--edit), #d97706)";
    document.getElementById('btn-cancel-vis').style.display = "block";
    const selStat = document.getElementById('vis-status-edit');
    selStat.style.display = "block"; selStat.value = v.status;
    document.getElementById('visitantes').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoVisitante = function() {
    document.getElementById('visitante-id-edit').value = "";
    document.getElementById('form-visitante').reset();
    document.getElementById('vis-entrada').value = DateUtils.getToInput();
    document.getElementById('titulo-form-visitante').innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar Visitante';
    const btn = document.getElementById('btn-submit-vis');
    btn.innerText = "Registrar Entrada"; btn.style.background = "linear-gradient(135deg, var(--accent), #6366f1)";
    document.getElementById('btn-cancel-vis').style.display  = "none";
    document.getElementById('vis-status-edit').style.display = "none";
    document.getElementById('vis-preview').src = _defaultAvatar;
    document.getElementById('vis-foto-base64').value = "";
    pararCamera();
};

window.deletarVisitante = async function(id) {
    if (!confirm('Excluir?')) return;
    const item = visitantes.find(v => v.id == id);
    await sb.from('visitantes').delete().eq('id', id);
    syncSheets('visitantes', 'delete', { id });
    registrarLog('Exclusão', 'Visitantes', `Removeu visitante: ${item ? item.nome : id}`);
    if (document.getElementById('visitante-id-edit').value == id) cancelarEdicaoVisitante();
    carregarDados();
};

window.baixaVisitante = async function(id) {
    if (!confirm('Confirmar saída do visitante?')) return;
    const upd  = { status: 'Saiu', saida: DateUtils.getNowDatabaseISO() };
    await sb.from('visitantes').update(upd).eq('id', id);
    const item = visitantes.find(v => v.id == id);
    syncSheets('visitantes', 'upsert', { ...item, ...upd });
    carregarDados();
};
