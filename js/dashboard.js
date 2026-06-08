// ================================================================
// DZEL — DASHBOARD, GRÁFICOS E AUDITORIA
// ================================================================

async function renderizarDashboard() {
    const filtroMes = document.getElementById('dash-filtro-mes').value;

    const listaDemandas   = demandas.filter(d  => !filtroMes || d.data.startsWith(filtroMes));
    const listaFrota      = frota.filter(f     => !filtroMes || f.hora_inicial.startsWith(filtroMes));
    const listaVisitantes = visitantes.filter(v => !filtroMes || v.entrada.startsWith(filtroMes));
    const listaEventos    = eventos.filter(e   => !filtroMes || e.data.startsWith(filtroMes));
    const listaCrachas    = crachas.filter(c   => !filtroMes || c.data_solicitacao.startsWith(filtroMes));

    const totalFrota      = listaFrota.length;
    const totalVisitantes = listaVisitantes.length;
    const totalEventos    = listaEventos.length;
    const totalCrachas    = listaCrachas.length;

    let counts = { 'AR': 0, 'PREDIAL': 0, 'LIMPEZA': 0, 'RAMAL': 0, 'OUTROS': 0 };
    listaDemandas.forEach(d => {
        const cat = d._categoria || getCategoriaDemanda(d);
        if (counts[cat] !== undefined) counts[cat]++; else counts['OUTROS']++;
    });

    const totalManutencao = counts['PREDIAL'] + counts['AR'];
    const totalGeral      = totalFrota + totalVisitantes + listaDemandas.length + totalEventos + totalCrachas;
    const publicoEventos  = listaEventos.reduce((sum, e) => sum + (parseInt(e.publico) || 0), 0);

    document.getElementById('kpi-total-geral').innerText       = totalGeral.toLocaleString('pt-BR');
    document.getElementById('kpi-total-eventos').innerText     = totalEventos;
    document.getElementById('kpi-publico-eventos').innerText   = publicoEventos.toLocaleString('pt-BR') + " Participantes";
    document.getElementById('kpi-total-manutencao').innerText  = totalManutencao;
    document.getElementById('kpi-total-crachas').innerText     = totalCrachas;
    document.getElementById('kpi-total-limpeza').innerText     = counts['LIMPEZA'];

    const divisor    = filtroMes ? 30 : 365;
    const fluxoDiario = Math.ceil(totalFrota / (totalFrota > 0 ? divisor : 1));
    document.getElementById('kpi-fluxo-garagem').innerHTML = fluxoDiario + ' <small>Veíc/Dia</small>';

    // ── Gráficos (Chart.js carregado sob demanda) ────────────────
    // KPIs acima já foram pintados; só os gráficos aguardam a lib.
    // Se o CDN falhar, degrada graciosamente (mantém os KPIs).
    try { await ensureCharts(); }
    catch (e) { console.warn('Gráficos indisponíveis no momento:', e.message); return; }

    // ── Gráfico: Volume por Setor ────────────────────────────────
    const ctxVolume = document.getElementById('chartVolumeSetor').getContext('2d');
    if (chartVolume) chartVolume.destroy();

    const dadosSetor = [
        { label: 'Garagem',       valor: totalFrota       },
        { label: 'Recepção',      valor: totalVisitantes  },
        { label: 'Limpeza/Copa',  valor: counts['LIMPEZA']},
        { label: 'Manut. Predial',valor: counts['PREDIAL']},
        { label: 'Crachás',       valor: totalCrachas     },
        { label: 'Ramais',        valor: counts['RAMAL']  },
        { label: 'Ar Cond.',      valor: counts['AR']     }
    ].sort((a, b) => b.valor - a.valor);

    const isMobile = window.innerWidth <= 900;

    chartVolume = new Chart(ctxVolume, {
        type: 'bar',
        data: {
            labels: dadosSetor.map(d => d.label),
            datasets: [{
                label: 'Volume',
                data: dadosSetor.map(d => d.valor),
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                barThickness: isMobile ? 14 : 18
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: isMobile ? 30 : 40 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end', align: 'end',
                    color: '#64748b',
                    font: { weight: 'bold', size: isMobile ? 10 : 11 },
                    formatter: (value) => value > 0 ? value : ''
                }
            },
            scales: {
                x: { display: false, grace: '15%' },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: isMobile ? 11 : 12, family: 'Plus Jakarta Sans' }, color: '#64748b' }
                }
            }
        }
    });

    // ── Gráfico: Perfil Garagem ──────────────────────────────────
    const qtdServidor  = listaFrota.filter(f => f.tipo === 'servidor').length;
    const qtdVisitante = listaFrota.filter(f => f.tipo === 'visitante').length;
    document.getElementById('total-garagem-label').innerText = totalFrota;

    const ctxGaragem = document.getElementById('chartGaragemPerfil').getContext('2d');
    if (chartGaragem) chartGaragem.destroy();

    chartGaragem = new Chart(ctxGaragem, {
        type: 'doughnut',
        data: {
            labels: ['Servidores', 'Visitantes'],
            datasets: [{
                data: [qtdServidor || 0, qtdVisitante || 0],
                backgroundColor: ['#10b981', '#f59e0b'],
                borderWidth: 0,
                cutout: '65%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: isMobile ? 11 : 12 }, padding: 10 }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: isMobile ? 11 : 12 },
                    formatter: (value, ctx) => {
                        let sum = 0;
                        ctx.chart.data.datasets[0].data.forEach(d => sum += d);
                        return sum === 0 ? "" : (value * 100 / sum).toFixed(0) + "%";
                    }
                }
            }
        }
    });
}

// ── Impressão do Dashboard ───────────────────────────────────────
window.imprimirDashboard = function() {
    const resizeCharts = () => { if (window.Chart && Chart.instances) Object.values(Chart.instances).forEach(c => c.resize()); };
    document.body.classList.add('printing-dashboard');
    setTimeout(function() { window.print(); }, 500);
    window.onafterprint = function() {
        document.body.classList.remove('printing-dashboard');
        resizeCharts();
    };
    setTimeout(function() {
        document.body.classList.remove('printing-dashboard');
        resizeCharts();
    }, 5000);
};

// ── Auditoria / Logs ─────────────────────────────────────────────
function renderizarLogs() {
    const tbody = document.querySelector('#tabela-logs tbody');
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum log registrado.</td></tr>';
        return;
    }
    tbody.innerHTML = logs.map(l => {
        const data      = new Date(l.data_hora).toLocaleString('pt-BR');
        const classAcao = l.acao === 'Exclusão' ? 'log-acao-exclusao' : (l.acao === 'Edição' ? 'log-acao-edicao' : '');
        return `<tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;">${data}</td>
            <td><strong>${l.usuario}</strong></td>
            <td>${l.secao}</td>
            <td class="${classAcao}">${l.acao}</td>
            <td>${l.detalhes}</td>
        </tr>`;
    }).join('');
}
