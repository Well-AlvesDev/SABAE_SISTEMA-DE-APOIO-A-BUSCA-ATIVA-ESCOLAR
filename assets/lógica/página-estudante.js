function obterAlunoDoCacheEstudante() {
    try {
        const raw = localStorage.getItem('sabae_aluno_cache');
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (!cache || !cache.timestamp || !cache.aluno) return null;
        const CACHE_TTL_MS = 5 * 60 * 60 * 1000;
        if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem('sabae_aluno_cache');
            return null;
        }
        return cache.aluno;
    } catch (erro) {
        console.warn('Erro ao ler cache do aluno:', erro);
        localStorage.removeItem('sabae_aluno_cache');
        return null;
    }
}

const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function obterValorColunaDia(aluno, dia) {
    const formatos = [
        String(dia),
        String(dia).padStart(2, '0'),
        dia
    ];

    for (const formato of formatos) {
        if (aluno[formato] !== undefined && aluno[formato] !== null) {
            return String(aluno[formato]).trim();
        }
    }

    return '';
}

function extrairRegistrosDeFrequencia(colunaDia) {
    if (!colunaDia || String(colunaDia).trim() === '') {
        return [];
    }

    return String(colunaDia)
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => {
            const partes = item.split(':').map(part => part.trim());
            const tipo = partes[0] ? partes[0].toUpperCase() : null;
            const mes = partes.length > 1 ? parseInt(partes[1], 10) : null;
            return {
                tipo,
                mes: Number.isInteger(mes) ? mes : null
            };
        })
        .filter(reg => reg.tipo && reg.mes >= 1 && reg.mes <= 12 && ['P', 'FNJ', 'FJ'].includes(reg.tipo));
}

function calcularEstatisticasFrequencia(aluno) {
    const estatisticasMes = Array.from({ length: 12 }, () => ({
        diasComChamada: 0,
        presencas: 0,
        faltasJustificadas: 0,
        faltasNaoJustificadas: 0
    }));

    for (let dia = 1; dia <= 31; dia++) {
        const colunaDia = obterValorColunaDia(aluno, dia);
        const registros = extrairRegistrosDeFrequencia(colunaDia);

        const statusPorMes = {};
        for (const registro of registros) {
            const mesIndex = registro.mes - 1;
            if (!statusPorMes[mesIndex]) {
                statusPorMes[mesIndex] = {
                    temChamada: false,
                    temPresenca: false,
                    temFJ: false,
                    temFNJ: false
                };
            }

            statusPorMes[mesIndex].temChamada = true;
            if (registro.tipo === 'P') {
                statusPorMes[mesIndex].temPresenca = true;
            } else if (registro.tipo === 'FJ') {
                statusPorMes[mesIndex].temFJ = true;
            } else if (registro.tipo === 'FNJ') {
                statusPorMes[mesIndex].temFNJ = true;
            }
        }

        Object.keys(statusPorMes).forEach(chave => {
            const mesIndex = Number(chave);
            if (!Number.isInteger(mesIndex) || mesIndex < 0 || mesIndex > 11) return;

            const status = statusPorMes[mesIndex];
            estatisticasMes[mesIndex].diasComChamada += 1;
            if (status.temPresenca) {
                estatisticasMes[mesIndex].presencas += 1;
            }
            if (status.temFJ) {
                estatisticasMes[mesIndex].faltasJustificadas += 1;
            }
            if (status.temFNJ) {
                estatisticasMes[mesIndex].faltasNaoJustificadas += 1;
            }
        });
    }

    return estatisticasMes;
}

function classeBadgePorEstatistica(stats) {
    if (stats.faltasNaoJustificadas > 0) return 'red';
    if (stats.faltasJustificadas > 0) return 'yellow';
    if (stats.presencas > 0) return 'green';
    return 'green';
}

function renderizarBadgesDeFrequencia(aluno) {
    const container = document.querySelector('.month-badges');
    if (!container) return;

    const anoAtual = new Date().getFullYear();
    const estatisticas = calcularEstatisticasFrequencia(aluno);

    // Totais gerais (soma de todos os meses)
    const totais = estatisticas.reduce((acc, s) => {
        acc.p += Number(s.presencas || 0);
        acc.fj += Number(s.faltasJustificadas || 0);
        acc.fnj += Number(s.faltasNaoJustificadas || 0);
        return acc;
    }, { p: 0, fj: 0, fnj: 0 });

    const totalGeral = totais.p + totais.fj + totais.fnj;
    const pct = (n) => totalGeral ? Math.round((n / totalGeral) * 100) : 0;

    let html = `
        <div class="summary-bars">
            <div class="summary-bar">
                <div class="summary-bar-left"><span class="summary-percent">${pct(totais.fnj)}%</span><span class="summary-label">FALTA (FNJ)</span></div>
                <div class="summary-bar-track"><div class="summary-bar-fill fnj" style="width: ${pct(totais.fnj)}%"></div></div>
            </div>
            <div class="summary-bar">
                <div class="summary-bar-left"><span class="summary-percent">${pct(totais.fj)}%</span><span class="summary-label">FALTA <br>JUSTIFICADA (FJ)</span></div>
                <div class="summary-bar-track"><div class="summary-bar-fill fj" style="width: ${pct(totais.fj)}%"></div></div>
            </div>
            <div class="summary-bar">
                <div class="summary-bar-left"><span class="summary-percent">${pct(totais.p)}%</span><span class="summary-label">PRESENÇA (P)</span></div>
                <div class="summary-bar-track"><div class="summary-bar-fill p" style="width: ${pct(totais.p)}%"></div></div>
            </div>
        </div>

        <div class="month-badges-title">- Referente ao ano de ${anoAtual} -</div>
        <p class="month-badges-note">Aviso: Registros de chamadas de anos anteriores são apagados do sistema do SABAE para evitar sobrecarga no servidor. Mas os registros ainda podem ser encontrados no SIEPE ou secretaria da sua escola.</p>
    `;

    estatisticas.forEach((stats, index) => {
        if (stats.diasComChamada === 0) {
            return;
        }

        const mesNome = mesesNomes[index];
        const classe = classeBadgePorEstatistica(stats);
        const valorTexto = `
            <span class="badge-fnj">FNJ: ${stats.faltasNaoJustificadas}</span>
            <span class="badge-fj">FJ: ${stats.faltasJustificadas}</span>
            <span class="badge-p">P: ${stats.presencas}</span>
        `;

        html += `
            <div class="month-badge">
                <div class="month-badge-header">
                    <span>${mesNome}</span>
                    <span class="month-badge-value">${valorTexto}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function montarHeaderEstudante() {
    const aluno = obterAlunoDoCacheEstudante();
    const container = document.getElementById('headerEstudante');

    if (!container) return;

    if (!aluno) {
        // Exibir página em branco com mensagem quando não há dados em cache
        try {
            document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;"><h1>nada por aqui</h1></div>';
        } catch (err) {
            console.warn('Falha ao renderizar página vazia:', err);
        }
        return;
    }

    const nome = aluno.nome || 'Nome não disponível';
    const turma = aluno.turma || 'Turma não disponível';
    const turno = aluno.turno || 'Turno não disponível';
    const status = aluno.status || 'Status não disponível';

    container.innerHTML = `
        <div class="student-header-card">
            <div class="student-header-avatar">
                <img src="./assets/imagens/ico/image.webp" alt="Foto do estudante">
            </div>
            <div class="student-header-info">
                <h1>${nome}</h1>
                <div class="student-header-meta">
                    <span><strong>Turma:</strong> ${turma}</span>
                    <span><strong>Turno:</strong> ${turno}</span>
                    <span><strong>Status:</strong> ${status}</span>
                </div>
            </div>
        </div>
    `;

    renderizarBadgesDeFrequencia(aluno);
}

document.addEventListener('DOMContentLoaded', montarHeaderEstudante);

// Header action menu handlers (três pontos)
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const headerMenu = document.getElementById('headerMenu');

    if (!menuToggle || !headerMenu) return;
    // Elementos do modal de logout (se presentes no DOM)
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogoutBtn = logoutModal ? logoutModal.querySelector('.confirm-logout') : null;
    const cancelLogoutBtn = logoutModal ? logoutModal.querySelector('.cancel-logout') : null;

    function showLogoutModal() {
        if (!logoutModal) return null;
        logoutModal.classList.remove('hidden');
        logoutModal.setAttribute('aria-hidden', 'false');
        if (confirmLogoutBtn) confirmLogoutBtn.focus();
        return true;
    }

    function hideLogoutModal() {
        if (!logoutModal) return;
        logoutModal.classList.add('hidden');
        logoutModal.setAttribute('aria-hidden', 'true');
    }

    if (logoutModal) {
        // clicar no backdrop fecha o modal
        logoutModal.addEventListener('click', (ev) => {
            if (ev.target && ev.target.dataset && ev.target.dataset.dismiss === 'modal') {
                hideLogoutModal();
            }
        });

        // Esc fecha o modal
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && !logoutModal.classList.contains('hidden')) {
                hideLogoutModal();
            }
        });

        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                try { localStorage.removeItem('sabae_aluno_cache'); } catch (err) { }
                window.location.href = './index.html';
            });
        }

        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', hideLogoutModal);
        }
    }

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        headerMenu.classList.toggle('hidden');
        const expanded = headerMenu.classList.contains('hidden') ? 'false' : 'true';
        headerMenu.setAttribute('aria-hidden', expanded === 'true' ? 'false' : 'true');
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!headerMenu.classList.contains('hidden')) {
            if (!headerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                headerMenu.classList.add('hidden');
                headerMenu.setAttribute('aria-hidden', 'true');
            }
        }
    });

    headerMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('.menu-item');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        headerMenu.classList.add('hidden');
        headerMenu.setAttribute('aria-hidden', 'true');

        if (action === 'request-justification') {
            alert('Solicitação de justificativa de falta enviada (simulada).');
        } else if (action === 'change-password') {
            const nova = prompt('Digite a nova senha:');
            if (nova !== null && nova.length > 0) {
                alert('Senha alterada com sucesso (simulada).');
            }
        } else if (action === 'logout') {
            // Preferir o modal customizado; se não existir, usar confirm()
            if (logoutModal) {
                showLogoutModal();
            } else {
                if (confirm('Deseja realmente sair da conta?')) {
                    try { localStorage.removeItem('sabae_aluno_cache'); } catch (err) { }
                    window.location.href = './index.html';
                }
            }
        }
    });
});
