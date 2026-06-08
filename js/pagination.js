// ================================================================
// DZEL — PAGINAÇÃO CLIENT-SIDE + SKELETON LOADERS
// ================================================================
// Renderiza apenas a "fatia" visível de cada tabela em vez de injetar
// milhares de <tr> de uma vez. Os filtros/contadores continuam
// operando sobre a lista completa — apenas o DOM é paginado.

const PAGE_SIZE = 50;

const _pgState     = {};   // tableId -> página atual
const _pgFilterKey = {};   // tableId -> assinatura dos filtros (reseta página ao mudar)
const _pgRerender  = {};   // tableId -> função que refaz a renderização

// opts: { tableId, items, rowFn, colspan, emptyMsg, filterKey, rerender }
function renderPaginated(opts) {
    const { tableId, items, rowFn, colspan, emptyMsg, filterKey, rerender } = opts;
    _pgRerender[tableId] = rerender;

    // Mudou o filtro/busca → volta para a primeira página.
    // Mudou só o conjunto de dados (CRUD/realtime) → mantém a página.
    if (_pgFilterKey[tableId] !== filterKey) {
        _pgFilterKey[tableId] = filterKey;
        _pgState[tableId]     = 1;
    }

    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    const total      = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    let   page       = _pgState[tableId] || 1;
    if (page > totalPages) { page = totalPages; _pgState[tableId] = page; }

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="tabela-vazia">${emptyMsg}</td></tr>`;
        _renderPager(tableId, 1, 1, 0, 0, 0);
        return;
    }

    const start = (page - 1) * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, total);
    // Monta a fatia visível num fragmento de string única (1 reflow).
    let html = '';
    for (let i = start; i < end; i++) html += rowFn(items[i]);
    tbody.innerHTML = html;

    _renderPager(tableId, page, totalPages, total, start, end);
}

// ── Controles de navegação (criados dinamicamente após a tabela) ──
function _pagerEl(tableId) {
    let el = document.getElementById('pager-' + tableId);
    if (!el) {
        const table = document.getElementById(tableId);
        if (!table) return null;
        const container = table.closest('.table-container') || table.parentNode;
        el = document.createElement('div');
        el.id        = 'pager-' + tableId;
        el.className = 'pagination no-print';
        container.parentNode.insertBefore(el, container.nextSibling);
    }
    return el;
}

function _renderPager(tableId, page, totalPages, total, start, end) {
    const el = _pagerEl(tableId);
    if (!el) return;
    if (total <= PAGE_SIZE) { el.innerHTML = ''; return; }
    el.innerHTML = `
        <span class="pagination-info">Exibindo <strong>${start + 1}–${end}</strong> de <strong>${total}</strong></span>
        <div class="pagination-controls">
            <button class="pg-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.pgIr('${tableId}',1)" title="Primeira página"><i class="fas fa-angles-left"></i></button>
            <button class="pg-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.pgDelta('${tableId}',-1)" title="Anterior"><i class="fas fa-angle-left"></i></button>
            <span class="pagination-page">${page} / ${totalPages}</span>
            <button class="pg-btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.pgDelta('${tableId}',1)" title="Próxima"><i class="fas fa-angle-right"></i></button>
            <button class="pg-btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.pgIr('${tableId}',${totalPages})" title="Última página"><i class="fas fa-angles-right"></i></button>
        </div>`;
}

window.pgIr = function(tableId, page) {
    _pgState[tableId] = page;
    if (_pgRerender[tableId]) _pgRerender[tableId]();
    _scrollTopoTabela(tableId);
};
window.pgDelta = function(tableId, delta) {
    _pgState[tableId] = (_pgState[tableId] || 1) + delta;
    if (_pgRerender[tableId]) _pgRerender[tableId]();
    _scrollTopoTabela(tableId);
};
function _scrollTopoTabela(tableId) {
    const t = document.getElementById(tableId);
    if (!t) return;
    const c = t.closest('.table-container');
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Skeleton loader (feedback visual durante o carregamento) ─────
function mostrarSkeleton(tableId, colspan, linhas = 8) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    let html = '';
    for (let i = 0; i < linhas; i++) {
        html += `<tr class="skeleton-row"><td colspan="${colspan}"><div class="skeleton-bar"></div></td></tr>`;
    }
    tbody.innerHTML = html;
}
