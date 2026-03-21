// ================================================================
// DZEL — AUTENTICAÇÃO E SESSÃO
// ================================================================

async function verificarSessao() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
        const user = data.session.user;
        const meta = user.user_metadata;
        currentUserData = {
            nome:    meta.nome || 'Usuário',
            email:   user.email,
            isAdmin: meta.is_admin === true,
            perms:   meta.permissoes || {}
        };
        iniciarSistema(currentUserData);
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
}

window.checkEnter = function(e) {
    if (e.key === 'Enter') window.fazerLogin();
};

window.fazerLogin = async function() {
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
        document.getElementById('login-error').style.display = 'block';
    } else {
        location.reload();
    }
};

window.logout = async function() {
    await sb.auth.signOut();
    location.reload();
};

async function registrarLog(acao, secao, detalhes) {
    if (!currentUserData) return;
    await sb.from('logs_auditoria').insert({
        usuario:  currentUserData.nome,
        acao,
        secao,
        detalhes,
        data_hora: DateUtils.getNowDatabaseISO()
    });
}

// ── Controles de sidebar mobile ─────────────────────────────────
window.toggleSidebar = function() {
    document.getElementById('app-content').classList.toggle('sidebar-open');
    document.getElementById('mobile-overlay').classList.toggle('active');
};

function fecharSidebarMobile() {
    document.getElementById('app-content').classList.remove('sidebar-open');
    document.getElementById('mobile-overlay').classList.remove('active');
}

// ── Permissões de usuário (módulo Usuários) ─────────────────────
function togglePermissoes(checkbox) {
    const container = document.getElementById('container-permissoes');
    if (checkbox.checked) {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
    }
}
