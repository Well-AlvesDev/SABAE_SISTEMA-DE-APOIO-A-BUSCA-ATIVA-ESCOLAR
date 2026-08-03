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

const FOTO_PERFIL_CACHE_KEY = 'sabae_foto_perfil_cache';

function normalizarTextoValor(valor) {
    return String(valor ?? '').trim();
}

function obterMatriculaDoAluno(aluno) {
    return normalizarTextoValor(
        aluno?.matricula || aluno?.mat || aluno?.MAT || aluno?.matricula_aluno || aluno?.matriculaAluno || aluno?.senha || ''
    );
}

function obterNomeDoAluno(aluno) {
    return normalizarTextoValor(
        aluno?.nome || aluno?.nome_completo || aluno?.nomeCompleto || ''
    );
}

function montarChaveDaConta(conta) {
    const matricula = normalizarTextoValor(
        conta?.matricula || conta?.mat || conta?.MAT || conta?.matricula_aluno || conta?.matriculaAluno || conta?.senha || ''
    );
    const nome = normalizarTextoValor(
        conta?.nome || conta?.nome_completo || conta?.nomeCompleto || ''
    );
    const chave = `${matricula}::${nome}`.trim().toLowerCase();
    return chave || 'conta-sem-identidade';
}

function obterMapaFotosPerfilDoCache() {
    try {
        const raw = localStorage.getItem(FOTO_PERFIL_CACHE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }

        if (parsed.dataUrl && parsed.metadata) {
            const chave = montarChaveDaConta(parsed.metadata);
            return { [chave]: parsed };
        }

        return Object.fromEntries(
            Object.entries(parsed).filter(([, valor]) => valor && typeof valor === 'object' && valor.dataUrl)
        );
    } catch (erro) {
        console.warn('Erro ao ler fotos de perfil do cache:', erro);
        localStorage.removeItem(FOTO_PERFIL_CACHE_KEY);
        return {};
    }
}

function obterFotoPerfilDoCache(aluno) {
    const mapa = obterMapaFotosPerfilDoCache();
    const chave = montarChaveDaConta(aluno);
    return mapa[chave] || null;
}

function salvarFotoPerfilNoCache(dataUrl, metadata) {
    const mapa = obterMapaFotosPerfilDoCache();
    const chave = montarChaveDaConta(metadata);
    const cache = {
        dataUrl,
        metadata: {
            matricula: normalizarTextoValor(metadata?.matricula || ''),
            nome: normalizarTextoValor(metadata?.nome || '')
        },
        timestamp: Date.now()
    };

    mapa[chave] = cache;
    localStorage.setItem(FOTO_PERFIL_CACHE_KEY, JSON.stringify(mapa));
    return cache;
}

function fotoPerfilEhValidaParaAluno(fotoCache, aluno) {
    if (!fotoCache?.dataUrl || !fotoCache?.metadata) return false;

    const matriculaEsperada = obterMatriculaDoAluno(aluno);
    const nomeEsperado = obterNomeDoAluno(aluno);

    return (
        normalizarTextoValor(fotoCache.metadata.matricula) === matriculaEsperada &&
        normalizarTextoValor(fotoCache.metadata.nome) === nomeEsperado
    );
}

function aplicarFotoPerfilDoCache(aluno) {
    const img = document.getElementById('studentProfileImage');
    if (!img) return;

    const fotoCache = obterFotoPerfilDoCache(aluno);
    if (fotoCache && fotoPerfilEhValidaParaAluno(fotoCache, aluno)) {
        img.src = fotoCache.dataUrl;
        img.alt = `Foto de ${obterNomeDoAluno(aluno) || 'estudante'}`;
        return;
    }

    img.src = './assets/imagens/ico/image.png';
    img.alt = 'Foto do estudante';
}

function configurarModalFotoPerfil(aluno) {
    const openBtn = document.getElementById('changePhotoBtn');
    const modal = document.getElementById('photoModal');
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const saveBtn = document.getElementById('savePhotoBtn');
    const cancelBtn = document.getElementById('cancelPhotoBtn');
    const backdrop = modal ? modal.querySelector('.modal-backdrop') : null;

    if (!modal || !openBtn || !input || !preview || !saveBtn) return;

    let fotoSelecionadaDataUrl = '';

    function fecharModal() {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        input.value = '';
        fotoSelecionadaDataUrl = '';
        preview.src = './assets/imagens/ico/image.png';
        saveBtn.disabled = true;
    }

    function abrirModal() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        input.value = '';
        fotoSelecionadaDataUrl = '';
        preview.src = './assets/imagens/ico/image.png';
        saveBtn.disabled = true;
        setTimeout(() => input.focus(), 50);
    }

    openBtn.addEventListener('click', abrirModal);
    cancelBtn?.addEventListener('click', fecharModal);

    backdrop?.addEventListener('click', (evento) => {
        if (evento.target?.dataset?.dismiss === 'photo-modal') {
            fecharModal();
        }
    });

    input.addEventListener('change', (evento) => {
        const arquivo = evento.target.files?.[0];
        if (!arquivo) {
            saveBtn.disabled = true;
            return;
        }

        if (!arquivo.type.startsWith('image/')) {
            alert('Selecione um arquivo de imagem válido.');
            saveBtn.disabled = true;
            return;
        }

        const leitor = new FileReader();
        leitor.onload = () => {
            fotoSelecionadaDataUrl = leitor.result;
            preview.src = fotoSelecionadaDataUrl;
            saveBtn.disabled = false;
        };
        leitor.onerror = () => {
            alert('Não foi possível ler a imagem selecionada.');
        };
        leitor.readAsDataURL(arquivo);
    });

    saveBtn.addEventListener('click', () => {
        if (!fotoSelecionadaDataUrl) return;

        salvarFotoPerfilNoCache(fotoSelecionadaDataUrl, {
            matricula: obterMatriculaDoAluno(aluno),
            nome: obterNomeDoAluno(aluno)
        });

        const img = document.getElementById('studentProfileImage');
        if (img) {
            img.src = fotoSelecionadaDataUrl;
            img.alt = `Foto de ${obterNomeDoAluno(aluno) || 'estudante'}`;
        }

        fecharModal();
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.classList.contains('hidden')) {
            fecharModal();
        }
    });
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

function obterDetalhesDoMes(aluno, mesIndex) {
    const detalhes = [];
    const diasNoMes = 31;

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const valor = obterValorColunaDia(aluno, dia);
        const registros = extrairRegistrosDeFrequencia(valor);
        const registroDoMes = registros.find(registro => registro.mes === mesIndex + 1);

        let status = '';
        let titulo = 'Sem registro';

        if (registroDoMes?.tipo === 'P') {
            status = 'p';
            titulo = 'Presença';
        } else if (registroDoMes?.tipo === 'FNJ') {
            status = 'fnj';
            titulo = 'Falta não justificada';
        } else if (registroDoMes?.tipo === 'FJ') {
            status = 'fj';
            titulo = 'Falta justificada';
        }

        detalhes.push({
            dia,
            status,
            titulo
        });
    }

    return detalhes;
}

function abrirDetalhesDoMes(aluno, mesIndex) {
    const modal = document.getElementById('monthDetailModal');
    const title = document.getElementById('monthDetailModalTitle');
    const body = document.getElementById('monthDetailBody');

    if (!modal || !title || !body) return;

    const detalhes = obterDetalhesDoMes(aluno, mesIndex);
    const nomeMes = mesesNomes[mesIndex] || 'Mês';
    const diasComRegistro = detalhes.filter(item => item.status).length;

    title.textContent = `${nomeMes} · ${diasComRegistro} registro${diasComRegistro === 1 ? '' : 's'}`;
    body.innerHTML = `
        <div class="month-detail-days">
            ${detalhes.map(item => {
        const classe = item.status ? `month-day-bubble ${item.status}` : 'month-day-bubble empty';
        const titulo = item.status ? `${item.titulo} · Dia ${item.dia}` : `Sem registro · Dia ${item.dia}`;
        return `<div class="${classe}" title="${titulo}">${item.dia}</div>`;
    }).join('')}
        </div>
        <div class="month-detail-legend">
            <span class="month-detail-legend-item"><span class="month-detail-dot" style="background:#28a745"></span> Presença (P)</span>
            <span class="month-detail-legend-item"><span class="month-detail-dot" style="background:#d9534f"></span> Falta não justificada (FNJ)</span>
            <span class="month-detail-legend-item"><span class="month-detail-dot" style="background:#1f77d0"></span> Falta justificada (FJ)</span>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharDetalhesDoMes() {
    const modal = document.getElementById('monthDetailModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
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
        <p class="month-badges-note">Clique no card de mês desejado para visualizar informações detalhadas sobre sua frequência.</p>
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
            <div class="month-badge" data-mes-index="${index}">
                <div class="month-badge-header">
                    <span>${mesNome}</span>
                    <div class="month-badge-right">
                        <span class="month-badge-value">${valorTexto}</span>
                        <i class="ri-arrow-right-s-line month-badge-arrow" aria-hidden="true"></i>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.month-badge').forEach((badge) => {
        badge.addEventListener('click', () => {
            const mesIndex = Number(badge.getAttribute('data-mes-index'));
            if (!Number.isInteger(mesIndex)) return;
            abrirDetalhesDoMes(aluno, mesIndex);
        });
    });
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
                <img id="studentProfileImage" src="./assets/imagens/ico/image.png" alt="Foto do estudante">
            </div>
            <button type="button" class="profile-photo-action" id="changePhotoBtn">Alterar foto de perfil</button>
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

    aplicarFotoPerfilDoCache(aluno);
    configurarModalFotoPerfil(aluno);
    renderizarBadgesDeFrequencia(aluno);
}

document.addEventListener('DOMContentLoaded', () => {
    montarHeaderEstudante();

    const monthModal = document.getElementById('monthDetailModal');
    const closeMonthBtn = document.getElementById('closeMonthDetailBtn');

    closeMonthBtn?.addEventListener('click', fecharDetalhesDoMes);

    monthModal?.addEventListener('click', (event) => {
        if (event.target?.dataset?.dismiss === 'month-detail-modal') {
            fecharDetalhesDoMes();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && monthModal && !monthModal.classList.contains('hidden')) {
            fecharDetalhesDoMes();
        }
    });
});

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

    function showHeaderMenu() {
        headerMenu.classList.remove('hidden');
        headerMenu.setAttribute('aria-hidden', 'false');
        gsap.fromTo(headerMenu,
            { opacity: 0, y: -12, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: 'power2.out' }
        );
    }

    function hideHeaderMenu() {
        if (headerMenu.classList.contains('hidden')) return;
        gsap.to(headerMenu, {
            opacity: 0,
            y: -12,
            duration: 0.18,
            ease: 'power2.in',
            onComplete: () => {
                headerMenu.classList.add('hidden');
                headerMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (headerMenu.classList.contains('hidden')) {
            showHeaderMenu();
        } else {
            hideHeaderMenu();
        }
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!headerMenu.classList.contains('hidden')) {
            if (!headerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                hideHeaderMenu();
            }
        }
    });

    // Fecha o menu quando o usuário rola a página
    window.addEventListener('scroll', () => {
        hideHeaderMenu();
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
