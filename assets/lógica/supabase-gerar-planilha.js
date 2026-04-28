/**
 * SABAE - Módulo para Gerar Planilhas
 * Armazena todos os dados brutos do Supabase sem processamento
 */

/**
 * Extrai o número do mês de uma entrada de chamada
 * @param {string} entrada - Entrada no formato "presenca:mes" (ex: "P:5", "FJ:3")
 * @returns {number} Número do mês (1-12) ou null
 */
function extrairMesDaChamada(entrada) {
    if (!entrada) return null;
    entrada = String(entrada).trim();
    const match = entrada.match(/:(\d+)$/);
    const mes = match ? parseInt(match[1]) : null;
    return (mes >= 1 && mes <= 12) ? mes : null;
}

/**
 * Extrai o tipo de presença de uma entrada de chamada
 * @param {string} entrada - Entrada no formato "presenca:mes" (ex: "P:5", "FJ:3")
 * @returns {string} Tipo de presença (P, FJ, FNJ) ou null
 */
function extrairPresencaDaChamada(entrada) {
    if (!entrada) return null;
    entrada = String(entrada).trim();
    const match = entrada.match(/^([A-Za-z]+):/);
    const presenca = match ? match[1].toUpperCase() : null;
    return (presenca === 'P' || presenca === 'FJ' || presenca === 'FNJ') ? presenca : null;
}

/**
 * Processa uma coluna de dia e retorna um objeto com presenças por mês
 * @param {string} colunaDia - Conteúdo da coluna (ex: "P:5, FJ:3, FNJ:7")
 * @returns {object} Objeto com presenças organizadas por mês {mes: presenca}
 */
function processarColunaDia(colunaDia) {
    const resultado = {};

    if (!colunaDia || String(colunaDia).trim() === '') {
        return resultado;
    }

    // Dividir múltiplas entradas separadas por vírgula
    const entradas = String(colunaDia).split(',').map(e => e.trim()).filter(e => e.length > 0);

    entradas.forEach(entrada => {
        const mes = extrairMesDaChamada(entrada);
        const presenca = extrairPresencaDaChamada(entrada);

        if (mes !== null && presenca !== null) {
            resultado[mes] = presenca;
        }
    });

    return resultado;
}

/**
 * Busca os dados brutos do Supabase sem processamento
 * @param {string} usuario - Nome de usuário
 * @param {string} senha - Senha do usuário
 * @param {number} mesSelecionado - Mês selecionado (1-12) - não usado, mantido para compatibilidade
 * @returns {Promise<object>} Objeto com status e dados brutos da planilha
 */
async function gerarDadosPlanilha(usuario, senha, mesSelecionado) {
    try {
        console.log('=== INICIANDO BUSCA DE DADOS BRUTOS ===');
        console.log('Usuário:', usuario);

        // Chamar a função RPC do Supabase
        const { data, error } = await supabaseClient.rpc('gerar_dados_planilha', {
            p_nome_usuario: usuario,
            p_senha_usuario: senha,
            p_mes_selecionado: mesSelecionado
        });

        if (error) {
            console.error('❌ Erro ao buscar dados:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`,
                dados: null
            };
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ Nenhum dado retornado do servidor');
            return {
                sucesso: false,
                mensagem: 'Credenciais inválidas ou nenhum aluno encontrado',
                dados: null
            };
        }

        console.log('✅ Dados retornados com sucesso');
        console.log(`Total de alunos: ${data.length}`);
        console.log('Primeiro aluno (raw):', JSON.stringify(data[0], null, 2));

        return {
            sucesso: true,
            mensagem: `Dados carregados com sucesso! ${data.length} aluno(s) encontrado(s)`,
            dados: data,
            totalAlunos: data.length
        };

    } catch (erro) {
        console.error('❌ Erro inesperado:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            dados: null
        };
    }
}

/**
 * Valida as credenciais do usuário (sem gerar dados)
 * @param {string} usuario - Nome de usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<boolean>} true se credenciais válidas, false caso contrário
 */
async function validarCredenciaisParaPlanilha(usuario, senha) {
    try {
        console.log('Validando credenciais...');

        const { data, error } = await supabaseClient.rpc('validar_login', {
            p_nome_usuario: usuario,
            p_senha_usuario: senha
        });

        if (error) {
            console.error('Erro ao validar credenciais:', error);
            return false;
        }

        return data === true;

    } catch (erro) {
        console.error('Erro inesperado na validação:', erro);
        return false;
    }
}

/**
 * Filtra dados para um mês específico
 * @param {array} dadosBrutos - Array com todos os dados brutos
 * @param {number} mesSelecionado - Número do mês (1-12)
 * @returns {array} Array com dados filtrados para o mês
 */
function filtrarPorMes(dadosBrutos, mesSelecionado) {
    console.log(`\n📅 Filtrando dados para mês: ${mesSelecionado}`);

    return dadosBrutos.map((aluno, idx) => {
        const alunoFiltrado = {
            MAT: aluno.MAT || '',
            NOME: aluno.NOME || '',
            TURMA: aluno.TURMA || '',
            TURNO: aluno.TURNO || '',
            STATUS: aluno.STATUS || '',
            chamadas: {}
        };

        // Processar cada dia (1-31)
        for (let dia = 1; dia <= 31; dia++) {
            const colunaDia = aluno[String(dia)] || '';
            const presencasPorMes = processarColunaDia(colunaDia);

            if (presencasPorMes[mesSelecionado]) {
                alunoFiltrado.chamadas[dia] = presencasPorMes[mesSelecionado];
            } else {
                alunoFiltrado.chamadas[dia] = null;
            }
        }

        return alunoFiltrado;
    });
}

/**
 * Converte dados da planilha para CSV (formato simples)
 * @param {array} dadosPlanilha - Array de objetos com dados formatados
 * @param {number} mesSelecionado - Mês selecionado
 * @returns {string} String no formato CSV
 */
function converterParaCSV(dadosPlanilha, mesSelecionado) {
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    let csv = 'MAT,NOME,TURMA,TURNO,STATUS';

    // Header com dias (1-31)
    for (let dia = 1; dia <= 31; dia++) {
        csv += `,D${dia}`;
    }
    csv += '\n';

    // Dados dos alunos
    dadosPlanilha.forEach(aluno => {
        const linha = [
            `"${aluno.MAT}"`,
            `"${aluno.NOME}"`,
            `"${aluno.TURMA}"`,
            `"${aluno.TURNO}"`,
            `"${aluno.STATUS}"`
        ];

        for (let dia = 1; dia <= 31; dia++) {
            linha.push(aluno.chamadas[dia] || '');
        }

        csv += linha.join(',') + '\n';
    });

    return csv;
}

/**
 * Converte dados da planilha para JSON
 * @param {array} dadosPlanilha - Array de objetos com dados formatados
 * @param {number} mesSelecionado - Mês selecionado
 * @returns {string} String no formato JSON
 */
function converterParaJSON(dadosPlanilha, mesSelecionado) {
    return JSON.stringify(dadosPlanilha, null, 2);
}

/**
 * Armazena dados brutos da planilha em sessionStorage
 * @param {array} dadosBrutos - Array com todos os dados brutos
 */
function armazenarDadosPlanilha(dadosBrutos) {
    try {
        sessionStorage.setItem('dadosPlanilhaBrutos', JSON.stringify({
            dados: dadosBrutos,
            data: new Date().toISOString()
        }));
        console.log('✅ Dados brutos armazenados em sessionStorage');
    } catch (erro) {
        console.warn('⚠️ Erro ao armazenar dados em sessionStorage:', erro);
    }
}

/**
 * Recupera dados brutos da planilha de sessionStorage
 * @returns {array|null} Array com dados brutos ou null
 */
function recuperarDadosPlanilhaBrutos() {
    try {
        const dados = sessionStorage.getItem('dadosPlanilhaBrutos');
        if (dados) {
            const parsed = JSON.parse(dados);
            return parsed.dados;
        }
        return null;
    } catch (erro) {
        console.warn('⚠️ Erro ao recuperar dados de sessionStorage:', erro);
        return null;
    }
}

/**
 * Recupera dados processados da planilha de sessionStorage (compatibilidade)
 * @returns {object|null} Objeto com dados processados ou null
 */
function recuperarDadosPlanilha() {
    try {
        const dados = sessionStorage.getItem('dadosPlanilha');
        if (dados) {
            return JSON.parse(dados);
        }
        return null;
    } catch (erro) {
        console.warn('⚠️ Erro ao recuperar dados de sessionStorage:', erro);
        return null;
    }
}
