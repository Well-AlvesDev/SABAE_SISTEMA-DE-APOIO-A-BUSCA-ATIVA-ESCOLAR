// Configuração para consumir dados do Google Apps Script
// Substitua com a URL da Web App do Apps Script publicada

// URL da Web App do Google Apps Script (será gerada após o deploy)
// Formato: https://script.google.com/macros/d/{SCRIPT_ID}/usercodeapp
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzqK9P-cBWq-wb5Il-aCAmRlBANzw-2A5dwKc2IqEkiA7HHChtNvTZvwqxuFhc0tYxs/exec';

// ========== SISTEMA DE CACHE ==========
const CACHE_CONFIG = {
    DURACAO_CACHE: 30 * 60 * 1000, // 30 minutos em ms
    PREFIXO: 'sabae_cache_'
};

/**
 * Verifica se existe cache válido para uma chave
 * @param {string} chave - Chave do cache
 * @returns {Object|null} Dados em cache ou null se expirado
 */
function obterDoCache(chave) {
    try {
        const itemCache = sessionStorage.getItem(CACHE_CONFIG.PREFIXO + chave);
        if (!itemCache) return null;

        const { dados, timestamp } = JSON.parse(itemCache);
        const agora = new Date().getTime();

        // Verificar se cache expirou
        if (agora - timestamp > CACHE_CONFIG.DURACAO_CACHE) {
            sessionStorage.removeItem(CACHE_CONFIG.PREFIXO + chave);
            console.log(`🗑️ Cache expirado para: ${chave}`);
            return null;
        }

        console.log(`✅ Cache válido para: ${chave}`);
        return dados;
    } catch (erro) {
        console.error('Erro ao obter cache:', erro);
        return null;
    }
}

/**
 * Salva dados no cache
 * @param {string} chave - Chave do cache
 * @param {*} dados - Dados a cachear
 */
function salvarNoCache(chave, dados) {
    try {
        const item = {
            dados,
            timestamp: new Date().getTime()
        };
        sessionStorage.setItem(CACHE_CONFIG.PREFIXO + chave, JSON.stringify(item));
        console.log(`💾 Dados cacheados para: ${chave}`);
    } catch (erro) {
        console.error('Erro ao salvar cache:', erro);
    }
}

/**
 * Limpa o cache
 * @param {string} chave - Chave específica (opcional). Se omitido, limpa todo cache
 */
function limparCache(chave = null) {
    try {
        if (chave) {
            sessionStorage.removeItem(CACHE_CONFIG.PREFIXO + chave);
            console.log(`🗑️ Cache limpo para: ${chave}`);
        } else {
            // Limpar todo cache do SABAE
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(CACHE_CONFIG.PREFIXO)) {
                    sessionStorage.removeItem(key);
                }
            });
            console.log('🗑️ Todo cache foi limpo');
        }
    } catch (erro) {
        console.error('Erro ao limpar cache:', erro);
    }
}

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
 * Obtém todos os alunos da aba MAIO - COM CACHE
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise} Promise com array de alunos
 */
async function obterTodosAlunos(forcarRecarga = false) {
    console.log('Buscando todos os alunos...');

    // Verificar cache primeiro
    if (!forcarRecarga) {
        const cacheAlunos = obterDoCache('todos_alunos');
        if (cacheAlunos) {
            return {
                sucesso: true,
                dados: cacheAlunos,
                origem: 'cache'
            };
        }
    }

    // Se não há cache ou forçou recarga, fazer requisição
    const resultado = await chamarGoogleSheetsAPI('obterAlunos');

    // Cachear resultado se foi bem-sucedido
    if (resultado.sucesso && resultado.dados) {
        salvarNoCache('todos_alunos', resultado.dados);
    }

    return resultado;
}

/**
 * Obtém alunos de uma turma específica - FILTRO LOCAL
 * Usa cache global de todos os alunos para maior performance
 * @param {string} turma - Nome da turma
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosTurma(turma, forcarRecarga = false) {
    console.log(`🔍 Buscando alunos da turma: ${turma}`);

    // Obter TODOS os alunos (do cache se existir)
    const resultado = await obterTodosAlunos(forcarRecarga);

    if (!resultado.sucesso || !resultado.dados) {
        return resultado;
    }

    // FILTRAR LOCALMENTE por turma
    const alunosFiltrados = resultado.dados.filter(aluno => aluno.turma === turma);

    const origem = resultado.origem === 'cache' ? '📦 cache' : '🌐 API';
    console.log(`✅ ${alunosFiltrados.length} alunos encontrados em ${origem} (filtrado localmente)`);

    return {
        sucesso: true,
        dados: alunosFiltrados,
        origem: resultado.origem
    };
}

/**
 * Obtém alunos de um turno específico - COM CACHE
 * @param {string} turno - Nome do turno (Manhã, Tarde, Noite)
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosTurno(turno, forcarRecarga = false) {
    console.log(`Buscando alunos do turno: ${turno}`);

    const chaveTurno = `turno_${turno.replace(/\s+/g, '_').toLowerCase()}`;

    // Verificar cache primeiro
    if (!forcarRecarga) {
        const cacheTurno = obterDoCache(chaveTurno);
        if (cacheTurno) {
            return {
                sucesso: true,
                dados: cacheTurno,
                origem: 'cache'
            };
        }
    }

    // Se não há cache ou forçou recarga, fazer requisição
    const resultado = await chamarGoogleSheetsAPI('obterPorTurno', { turno });

    // Cachear resultado se foi bem-sucedido
    if (resultado.sucesso && resultado.dados) {
        salvarNoCache(chaveTurno, resultado.dados);
    }

    return resultado;
}

/**
 * Obtém alunos com status específico - COM CACHE
 * @param {string} status - Status do aluno
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise} Promise com array de alunos filtrados
 */
async function obterAlunosStatus(status, forcarRecarga = false) {
    console.log(`Buscando alunos com status: ${status}`);

    const chaveStatus = `status_${status.replace(/\s+/g, '_').toLowerCase()}`;

    // Verificar cache primeiro
    if (!forcarRecarga) {
        const cacheStatus = obterDoCache(chaveStatus);
        if (cacheStatus) {
            return {
                sucesso: true,
                dados: cacheStatus,
                origem: 'cache'
            };
        }
    }

    // Se não há cache ou forçou recarga, fazer requisição
    const resultado = await chamarGoogleSheetsAPI('obterPorStatus', { status });

    // Cachear resultado se foi bem-sucedido
    if (resultado.sucesso && resultado.dados) {
        salvarNoCache(chaveStatus, resultado.dados);
    }

    return resultado;
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
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise} Promise que resolve quando o dropdown é populado
 */
async function carregarSalasNoDropdown(selectorDropdown = '#salaDropdown', forcarRecarga = false) {
    try {
        console.log(`⏳ Carregando salas${forcarRecarga ? ' (forçada)' : ''}...`);
        const resultado = await obterTodosAlunos(forcarRecarga);

        if (!resultado.sucesso || !resultado.dados) {
            console.error('Erro ao obter alunos:', resultado.mensagem);
            throw new Error(resultado.mensagem);
        }

        // Mostrar origem dos dados (cache ou API)
        const origem = resultado.origem === 'cache' ? '📦 do cache' : '🌐 da API';
        console.log(`Dados carregados ${origem}`);

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

/**
 * Função utilitária para recarregar dados (limpar cache e recarregar salas)
 * Útil para adicionar um botão "Atualizar" na interface
 */
async function recarregarDados() {
    console.log('🔄 Recarregando dados...');
    limparCache();
    return await carregarSalasNoDropdown('#salaDropdown', true);
}



