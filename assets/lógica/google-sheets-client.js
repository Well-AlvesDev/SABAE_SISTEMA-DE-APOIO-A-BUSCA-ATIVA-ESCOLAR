// Configuração para consumir dados do Google Apps Script
// Substitua com a URL da Web App do Apps Script publicada

// URL da Web App do Google Apps Script (será gerada após o deploy)
// Formato: https://script.google.com/macros/d/{SCRIPT_ID}/usercodeapp
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzqK9P-cBWq-wb5Il-aCAmRlBANzw-2A5dwKc2IqEkiA7HHChtNvTZvwqxuFhc0tYxs/exec';

/**
 * Realiza requisição para obter dados do Google Sheets
 * @param {string} acao - Ação a executar (obterAlunos, obterPorTurma, etc)
 * @param {Object} parametros - Parâmetros adicionais
 * @returns {Promise} Promise com os dados retornados
 */
async function chamarGoogleSheetsAPI(acao, parametros = {}) {
    let url = `${GOOGLE_SHEETS_API_URL}?acao=${acao}`;

    try {
        for (const [chave, valor] of Object.entries(parametros)) {
            url += `&${chave}=${encodeURIComponent(valor)}`;
        }

        console.log('Fazendo requisição para:', url);

        // FETCH CORRIGIDO: Sem a propriedade 'headers'
        const resposta = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();
        return dados;

    } catch (erro) {
        console.error('Erro ao chamar Google Sheets API:', erro);
        return {
            sucesso: false,
            mensagem: `Erro na requisição: ${erro.message}`,
            dados: []
        };
    }
}

/**
 * Obtém todos os alunos da aba MAIO
 * @returns {Promise} Promise com array de alunos
 */
async function obterTodosAlunos() {
    console.log('Buscando todos os alunos...');
    return await chamarGoogleSheetsAPI('obterAlunos');
}

/**
 * Obtém alunos de uma turma específica
 * @param {string} turma - Nome da turma
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosTurma(turma) {
    console.log(`Buscando alunos da turma: ${turma}`);
    return await chamarGoogleSheetsAPI('obterPorTurma', { turma });
}

/**
 * Obtém alunos de um turno específico
 * @param {string} turno - Nome do turno (Manhã, Tarde, Noite)
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosTurno(turno) {
    console.log(`Buscando alunos do turno: ${turno}`);
    return await chamarGoogleSheetsAPI('obterPorTurno', { turno });
}

/**
 * Obtém alunos com status específico
 * @param {string} status - Status do aluno
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosStatus(status) {
    console.log(`Buscando alunos com status: ${status}`);
    return await chamarGoogleSheetsAPI('obterPorStatus', { status });
}

/**
 * Extrai salas únicas dos dados de alunos
 * @param {Array} alunos - Array de alunos
 * @returns {Array} Array com salas únicas ordenadas
 */
function extrairSalasUnicas(alunos) {
    if (!alunos || alunos.length === 0) {
        return [];
    }

    // Extrair salas únicas usando Set
    const salasSet = new Set();
    alunos.forEach(aluno => {
        if (aluno.turma) {
            salasSet.add(aluno.turma);
        }
    });

    // Converter para array e ordenar
    const salas = Array.from(salasSet).sort();
    return salas;
}

/**
 * Carrega as salas disponíveis e popula um dropdown
 * Funciona com dropdown customizado ou select padrão
 * @param {string} selectorDropdown - Seletor CSS do elemento dropdown
 * @returns {Promise} Promise que resolve quando o dropdown é populado
 */
async function carregarSalasNoDropdown(selectorDropdown = '#salaDropdown') {
    try {
        const resultado = await obterTodosAlunos();

        if (!resultado.sucesso || !resultado.dados) {
            console.error('Erro ao obter alunos:', resultado.mensagem);
            throw new Error(resultado.mensagem);
        }

        const salas = extrairSalasUnicas(resultado.dados);
        const dropdown = document.querySelector(selectorDropdown);

        if (!dropdown) {
            console.error(`Elemento com seletor "${selectorDropdown}" não encontrado`);
            throw new Error(`Elemento ${selectorDropdown} não encontrado`);
        }

        // Verificar se é dropdown customizado ou select padrão
        const isCustomDropdown = dropdown.classList.contains('custom-dropdown');

        if (isCustomDropdown) {
            // Carregar para dropdown customizado
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            dropdownMenu.innerHTML = ''; // Limpar itens existentes

            // Adicionar salas como itens do dropdown customizado
            salas.forEach(sala => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = sala;
                item.dataset.value = sala;
                dropdownMenu.appendChild(item);
            });

            // Atualizar label padrão
            const label = dropdown.querySelector('.dropdown-label');
            if (label) {
                label.textContent = salas.length > 0 ? '-- Selecione uma sala --' : '-- Nenhuma sala disponível --';
            }
        } else {
            // Carregar para select padrão (compatibilidade retroativa)
            dropdown.innerHTML = '<option value="">-- Selecione uma sala --</option>';
            salas.forEach(sala => {
                const option = document.createElement('option');
                option.value = sala;
                option.textContent = sala;
                dropdown.appendChild(option);
            });
        }

        console.log(`✓ ${salas.length} salas carregadas no dropdown`);
        return true;
    } catch (erro) {
        console.error('Erro ao carregar salas:', erro);
        throw erro;
    }
}



