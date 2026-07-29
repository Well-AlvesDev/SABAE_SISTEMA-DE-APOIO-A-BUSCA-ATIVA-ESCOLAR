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

function montarHeaderEstudante() {
    const aluno = obterAlunoDoCacheEstudante();
    const container = document.getElementById('headerEstudante');

    if (!container) return;

    if (!aluno) {
        container.innerHTML = `
            <div class="student-header-card">
                <div class="student-header-avatar">
                    <img src="./assets/imagens/ico/image.png" alt="Foto do estudante">
                </div>
                <div class="student-header-info">
                    <h1>Olá, estudante</h1>
                    <p>Dados do aluno não encontrados. Faça login novamente.</p>
                </div>
            </div>
        `;
        return;
    }

    const nome = aluno.nome || 'Nome não disponível';
    const turma = aluno.turma || 'Turma não disponível';
    const turno = aluno.turno || 'Turno não disponível';
    const status = aluno.status || 'Status não disponível';

    container.innerHTML = `
        <div class="student-header-card">
            <div class="student-header-avatar">
                <img src="./assets/imagens/ico/image.png" alt="Foto do estudante">
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
}

document.addEventListener('DOMContentLoaded', montarHeaderEstudante);
