/**
 * ==========================================
 * SABAE - Buscar Chamadas Existentes do Supabase
 * Sistema para verificar e carregar chamadas já registradas
 * ==========================================
 */

/**
 * Verifica se existe uma chamada registrada no Supabase para um dia/mês/turma
 * @param {string} turma - Nome da turma/sala
 * @param {number} dia - Dia do mês (1-31)
 * @param {number} mes - Número do mês (1-12)
 * @returns {Promise<Object>} { sucesso, chamadaEncontrada, dados }
 */
async function verificarChamadaNoSupabase(turma, dia, mes) {
    try {
        console.log(`🔍 Verificando chamada no Supabase para ${turma} - ${dia}/${mes}...`);

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            throw new Error('Sessão expirada. Credenciais não encontradas.');
        }

        // Chamar a função RPC do Supabase
        const { data, error } = await supabaseClient.rpc('obter_chamada_existente', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_dia: dia,
            p_mes: mes,
            p_turma: turma
        });

        if (error) {
            console.error('❌ Erro ao verificar chamada:', error);
            return {
                sucesso: false,
                chamadaEncontrada: false,
                mensagem: `Erro ao verificar chamada: ${error.message}`,
                dados: []
            };
        }

        // Verificar se há pelo menos um aluno com presença registrada
        const alunosComPresenca = (data || []).filter(registro => registro.presenca);

        if (alunosComPresenca.length > 0) {
            console.log(`✅ Chamada encontrada com ${alunosComPresenca.length} aluno(s) registrado(s)`);

            return {
                sucesso: true,
                chamadaEncontrada: true,
                mensagem: `Chamada encontrada com ${alunosComPresenca.length} aluno(s)`,
                dados: data,
                alunosComPresenca: alunosComPresenca
            };
        } else {
            console.log('⚠️ Nenhuma chamada encontrada para este dia/mês');

            return {
                sucesso: true,
                chamadaEncontrada: false,
                mensagem: 'Nenhuma chamada encontrada para este dia/mês',
                dados: [],
                alunosComPresenca: []
            };
        }

    } catch (erro) {
        console.error('❌ Erro inesperado ao verificar chamada:', erro);
        return {
            sucesso: false,
            chamadaEncontrada: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            dados: []
        };
    }
}

/**
 * Formata os dados da chamada existente para o padrão esperado pela interface
 * @param {Array} dadosBrutos - Dados retornados do Supabase
 * @param {string} turma - Nome da turma
 * @param {string} mes - Nome do mês
 * @param {number} dia - Dia do mês
 * @returns {Object} Chamada formatada
 */
function formatarChamadaDoSupabase(dadosBrutos, turma, mes, dia) {
    const alunos = dadosBrutos.map(registro => ({
        mat: registro.mat,
        nome: registro.nome,
        presenca: registro.presenca || null
    }));

    return {
        id: `chamada-${turma}-${dia}-${obterNumeroMes(mes)}-${Date.now()}`,
        sala: turma,
        mes: mes,
        dia: dia,
        data_hora_registrada: new Date().toLocaleString('pt-BR'),
        alunos: alunos,
        origemSupabase: true // Flag para indicar que é edição do Supabase
    };
}

/**
 * Extrai o tipo de presença do formato armazenado (ex: "P:5" -> "P")
 * @param {string} presencaComMes - String no formato "PRESENCA:MES"
 * @returns {string} Tipo de presença (P, FNJ, FJ)
 */
function extrairTipoPresenca(presencaComMes) {
    if (!presencaComMes) return null;

    const partes = presencaComMes.split(':');
    return partes[0] || null;
}

/**
 * Busca uma chamada completa do Supabase e retorna pronta para edição
 * @param {string} turma - Nome da turma/sala
 * @param {number} dia - Dia do mês (1-31)
 * @param {string} mes - Nome do mês
 * @returns {Promise<Object>} { sucesso, chamada, prontaParaEditar }
 */
async function buscarChamadaSupabaseParaEditar(turma, dia, mes) {
    try {
        const resultado = await verificarChamadaNoSupabase(turma, dia, obterNumeroMes(mes));

        if (!resultado.sucesso) {
            return {
                sucesso: false,
                mensagem: resultado.mensagem,
                chamada: null,
                prontaParaEditar: false
            };
        }

        if (!resultado.chamadaEncontrada) {
            return {
                sucesso: true,
                mensagem: 'Nenhuma chamada encontrada',
                chamada: null,
                prontaParaEditar: false
            };
        }

        // Formatar dados para edição
        const chamadaFormatada = formatarChamadaDoSupabase(resultado.dados, turma, mes, dia);

        // Extrair tipos de presença
        chamadaFormatada.alunos = chamadaFormatada.alunos.map(aluno => ({
            ...aluno,
            presenca: aluno.presenca ? extrairTipoPresenca(aluno.presenca) : null
        }));

        console.log('✅ Chamada formatada e pronta para edição:', chamadaFormatada);

        return {
            sucesso: true,
            mensagem: 'Chamada carregada com sucesso',
            chamada: chamadaFormatada,
            prontaParaEditar: true
        };

    } catch (erro) {
        console.error('❌ Erro ao buscar chamada para editar:', erro);
        return {
            sucesso: false,
            mensagem: `Erro: ${erro.message}`,
            chamada: null,
            prontaParaEditar: false
        };
    }
}
