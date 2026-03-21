// ================================================================
// DZEL — MÓDULO: USUÁRIOS
// ================================================================

async function carregarUsuarios() {
    if (!currentUserData.isAdmin) return;
    const { data } = await sb.rpc('admin_get_users');
    if (data) { appUsers = data; renderizarTabelaUsuarios(); }
}

async function salvarUsuario() {
    const idEdit = document.getElementById('edit-user-id').value;
    if (idEdit) editarUsuarioSalvar(idEdit); else criarUsuario();
}

async function criarUsuario() {
    const email   = document.getElementById('novo-user-email').value;
    const pass    = document.getElementById('novo-user-pass').value;
    const nome    = document.getElementById('novo-user-nome').value;
    const isAdmin = document.getElementById('novo-user-admin').checked;
    const perms   = montarPermissoesJSON();
    if (!email || !pass || !nome) return alert("Preencha todos os campos obrigatórios!");
    const { error } = await sb.rpc('admin_create_user', {
        email_input:       email,
        pass_input:        pass,
        nome_input:        nome,
        is_admin_input:    isAdmin,
        permissoes_input:  perms
    });
    if (error) alert("Erro ao criar: " + error.message);
    else { alert("Usuário criado com sucesso!"); cancelarEdicaoUsuario(); carregarUsuarios(); registrarLog('Criação', 'Usuários', `Criou usuário: ${email}`); }
}

async function editarUsuarioSalvar(id) {
    const nome    = document.getElementById('novo-user-nome').value;
    const isAdmin = document.getElementById('novo-user-admin').checked;
    const perms   = montarPermissoesJSON();
    const { error } = await sb.rpc('admin_update_user_meta', {
        user_id_input:    id,
        nome_input:       nome,
        role_input:       'custom',
        is_admin_input:   isAdmin,
        permissoes_input: perms
    });
    if (error) alert("Erro ao atualizar: " + error.message);
    else { alert("Usuário atualizado!"); cancelarEdicaoUsuario(); carregarUsuarios(); registrarLog('Edição', 'Usuários', `Atualizou permissões do usuário ID: ${id}`); }
}

function editarUsuario(userStr) {
    const u    = JSON.parse(decodeURIComponent(userStr));
    const meta = u.usr_meta || {};
    document.getElementById('edit-user-id').value          = u.usr_id;
    document.getElementById('titulo-user-form').innerHTML  = '<i class="fas fa-edit"></i> Editando Usuário';
    document.getElementById('btn-save-user').innerText     = 'Salvar Alterações';
    document.getElementById('btn-cancel-user').style.display = 'block';
    document.getElementById('novo-user-email').value       = u.usr_email;
    document.getElementById('novo-user-email').disabled    = true;
    document.getElementById('novo-user-pass').style.display= 'none';
    document.getElementById('novo-user-nome').value        = meta.nome || '';
    document.getElementById('novo-user-admin').checked     = meta.is_admin === true;
    togglePermissoes(document.getElementById('novo-user-admin'));
    const p    = meta.permissoes || {};
    const mods = ['demandas','visitantes','veiculos','eventos','crachas','predial','limpeza','ar','ocorrencias'];
    mods.forEach(m => {
        if (document.getElementById(`perm-${m}-ver`))  document.getElementById(`perm-${m}-ver`).checked  = p[m]?.ver     === true;
        if (document.getElementById(`perm-${m}-edit`)) document.getElementById(`perm-${m}-edit`).checked = p[m]?.editar  === true;
        if (document.getElementById(`perm-${m}-del`))  document.getElementById(`perm-${m}-del`).checked  = p[m]?.excluir === true;
        if (document.getElementById(`perm-${m}-exp`))  document.getElementById(`perm-${m}-exp`).checked  = p[m]?.exportar=== true;
    });
    document.getElementById('usuarios').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoUsuario() {
    document.getElementById('edit-user-id').value = "";
    document.getElementById('titulo-user-form').innerHTML = '<i class="fas fa-user-shield"></i> Criar Novo Usuário';
    document.getElementById('btn-save-user').innerText    = 'Criar Usuário';
    document.getElementById('btn-cancel-user').style.display = 'none';
    document.getElementById('novo-user-email').value      = '';
    document.getElementById('novo-user-email').disabled   = false;
    document.getElementById('novo-user-pass').value       = '';
    document.getElementById('novo-user-pass').style.display = 'block';
    document.getElementById('novo-user-nome').value       = '';
    document.getElementById('novo-user-admin').checked    = false;
    togglePermissoes(document.getElementById('novo-user-admin'));
    document.querySelectorAll('.perm-table input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function montarPermissoesJSON() {
    const mods = ['demandas','visitantes','veiculos','eventos','crachas','predial','limpeza','ar','ocorrencias'];
    const perms = {};
    mods.forEach(m => {
        perms[m] = {
            ver:      document.getElementById(`perm-${m}-ver`)  ? document.getElementById(`perm-${m}-ver`).checked  : false,
            editar:   document.getElementById(`perm-${m}-edit`) ? document.getElementById(`perm-${m}-edit`).checked : false,
            excluir:  document.getElementById(`perm-${m}-del`)  ? document.getElementById(`perm-${m}-del`).checked  : false,
            exportar: document.getElementById(`perm-${m}-exp`)  ? document.getElementById(`perm-${m}-exp`).checked  : false
        };
    });
    return perms;
}

async function excluirUsuario(id, email) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) return;
    const { error } = await sb.rpc('admin_delete_user', { user_id_input: id });
    if (error) alert("Erro: " + error.message);
    else { alert("Usuário removido."); carregarUsuarios(); registrarLog('Exclusão', 'Usuários', `Removeu usuário: ${email}`); }
}

function renderizarTabelaUsuarios() {
    const tbody = document.querySelector('#tabela-usuarios-app tbody');
    tbody.innerHTML = appUsers.map(u => {
        const meta      = u.usr_meta || {};
        const tipo      = meta.is_admin
            ? '<span class="badge bg-concluido">ADMIN</span>'
            : '<span class="badge bg-saiu">USUÁRIO</span>';
        const lastLogin = u.usr_last_login ? new Date(u.usr_last_login).toLocaleString('pt-BR') : 'Nunca';
        const userStr   = encodeURIComponent(JSON.stringify(u));
        return `<tr>
            <td><strong>${meta.nome}</strong></td>
            <td>${u.usr_email}</td>
            <td>${tipo}</td>
            <td><span style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;">${lastLogin}</span></td>
            <td>
                <button onclick="editarUsuario('${userStr}')" class="action-btn btn-edit"><i class="fas fa-pen"></i></button>
                <button onclick="excluirUsuario('${u.usr_id}','${u.usr_email}')" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}
