/**
 * ==========================================
 * SABAE - Visualizar Dados do Aluno
 * Sistema para buscar e exibir dados detalhados de um aluno
 * ==========================================
 */

// Meses do ano (índices 0-11 correspondem aos meses 1-12)
const mesesNomes = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

// Meses em número para busca na tabela
const diasPorMes = {
    1: 31,  // Janeiro
    2: 28,  // Fevereiro (pode variar com bissexto)
    3: 31,  // Março
    4: 30,  // Abril
    5: 31,  // Maio
    6: 30,  // Junho
    7: 31,  // Julho
    8: 31,  // Agosto
    9: 30,  // Setembro
    10: 31, // Outubro
    11: 30, // Novembro
    12: 31  // Dezembro
};

/**
 * Processa dados de presença por mês
 * @param {Object} dadosAluno - Dados do aluno retornados do Supabase
 * @param {number} mesNumero - Número do mês (1-12)
 * @returns {Object} Estatísticas do mês
 */
function calcularEstatisticasMes(dadosAluno, mesNumero) {
    const diasDoMes = diasPorMes[mesNumero];
    let presencas = 0;
    let faltasNaoJustificadas = 0;
    let faltasJustificadas = 0;
    let diasLecionados = 0;
    let registro = '';
    const diasDetalhes = [];

    // Iterar pelos dias do mês
    for (let dia = 1; dia <= diasDoMes; dia++) {
        const valor = dadosAluno[String(dia)];
        let tipodia = ''; // vazio, 'P', 'FNJ' ou 'FJ'

        if (valor && valor.trim() !== '') {
            diasLecionados++;
            registro += valor;

            // Parse do formato armazenado: "P:1", "FNJ:1", "FJ:1" ou múltiplos separados por vírgula
            // Ex: "P:1, FNJ:2" significa Presença em janeiro e Falta em fevereiro
            const registros = valor.split(',').map(r => r.trim());

            for (let reg of registros) {
                // Extrair presença e mês do registro (formato: "TIPO:MES")
                const partes = reg.split(':');
                if (partes.length === 2) {
                    const tipo = partes[0].trim();
                    const mesReg = parseInt(partes[1]);

                    // Se o mês do registro corresponde ao mês processado, contar
                    if (mesReg === mesNumero) {
                        tipodia = tipo;
                        if (tipo === 'P') {
                            presencas++;
                        } else if (tipo === 'FNJ') {
                            faltasNaoJustificadas++;
                        } else if (tipo === 'FJ') {
                            faltasJustificadas++;
                        }
                    }
                }
            }
        }

        diasDetalhes.push({
            dia,
            tipo: tipodia
        });
    }

    // Calcular percentual de presença
    const percentualPresenca = diasLecionados > 0
        ? Math.round((presencas / diasLecionados) * 100)
        : 0;

    return {
        mes: mesNumero,
        mesNome: mesesNomes[mesNumero - 1],
        presencas,
        faltasNaoJustificadas,
        faltasJustificadas,
        diasLecionados,
        percentualPresenca,
        registro,
        diasDetalhes
    };
}

/**
 * Busca dados do aluno no Supabase
 * @param {string} matricula - Matrícula do aluno
 * @returns {Promise<Object>} Dados do aluno com estatísticas
 */
async function buscarDadosAluno(matricula) {
    try {
        console.log('🔍 Buscando dados do aluno:', matricula);

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            throw new Error('Sessão expirada. Credenciais não encontradas.');
        }

        // Chamar função RPC do Supabase
        const { data, error } = await supabaseClient.rpc('obter_dados_aluno_detalhado', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_matricula: matricula.trim()
        });

        if (error) {
            console.error('❌ Erro ao buscar dados:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao buscar dados: ${error.message}`,
                dados: null
            };
        }

        // Verificar se encontrou o aluno
        if (!data || data.length === 0) {
            console.log('⚠️ Aluno não encontrado');
            return {
                sucesso: false,
                mensagem: 'Aluno não encontrado na base de dados',
                dados: null
            };
        }

        const alunoData = data[0];
        console.log('✅ Dados do aluno encontrados:', alunoData);

        // Calcular estatísticas para cada mês
        const estatisticasPorMes = [];
        for (let mes = 1; mes <= 12; mes++) {
            const stats = calcularEstatisticasMes(alunoData, mes);
            estatisticasPorMes.push(stats);
        }

        // Encontrar melhor e pior mês
        const piorMes = estatisticasPorMes.reduce((pior, atual) =>
            atual.faltasNaoJustificadas > pior.faltasNaoJustificadas ? atual : pior
        );

        const melhorMes = estatisticasPorMes.reduce((melhor, atual) =>
            atual.percentualPresenca > melhor.percentualPresenca ? atual : melhor
        );

        // Contar totais
        const totalFaltasNaoJustificadas = estatisticasPorMes.reduce((total, m) => total + m.faltasNaoJustificadas, 0);
        const totalFaltasJustificadas = estatisticasPorMes.reduce((total, m) => total + m.faltasJustificadas, 0);
        const totalDiasLecionados = estatisticasPorMes.reduce((total, m) => total + m.diasLecionados, 0);
        const totalPresencas = estatisticasPorMes.reduce((total, m) => total + m.presencas, 0);
        const percentualPresencaGeral = totalDiasLecionados > 0
            ? Math.round((totalPresencas / totalDiasLecionados) * 100)
            : 0;

        return {
            sucesso: true,
            mensagem: 'Dados do aluno encontrados com sucesso',
            dados: {
                mat: alunoData.MAT,
                nome: alunoData.NOME,
                turma: alunoData.TURMA,
                turno: alunoData.TURNO,
                status: alunoData.STATUS,
                estatisticasPorMes,
                piorMes,
                melhorMes,
                totalFaltasNaoJustificadas,
                totalFaltasJustificadas,
                totalDiasLecionados,
                totalPresencas,
                percentualPresencaGeral
            }
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
 * Formata os dados do aluno para exibição no modal
 * @param {Object} dados - Dados do aluno processados
 * @returns {string} HTML formatado
 */
function formatarDadosAlunoParaExibicao(dados) {
    let html = `
        <div class="dados-aluno-container">
            <!-- Informações do Aluno -->
            <div class="aluno-info-header">
                <div class="aluno-info-item">
                    <label>MATRÍCULA</label>
                    <p>${dados.mat}</p>
                </div>
                <div class="aluno-info-item">
                    <label>NOME</label>
                    <p>${dados.nome}</p>
                </div>
                <div class="aluno-info-item">
                    <label>TURMA</label>
                    <p>${dados.turma}</p>
                </div>
                <div class="aluno-info-item">
                    <label>TURNO</label>
                    <p>${dados.turno}</p>
                </div>
                <div class="aluno-info-item">
                    <label>STATUS</label>
                    <p>${dados.status}</p>
                </div>
            </div>

            <!-- Informações Simples -->
            <div class="resumo-geral">
                <div class="resumo-grid">
                    <div class="resumo-item">
                        <label>Presença</label>
                        <p class="valor-presenca">${dados.totalPresencas}</p>
                    </div>
                    <div class="resumo-item">
                        <label>Faltas Não Justificadas</label>
                        <p class="valor-falta-nj">${dados.totalFaltasNaoJustificadas}</p>
                    </div>
                    <div class="resumo-item">
                        <label>Faltas Justificadas</label>
                        <p class="valor-falta-j">${dados.totalFaltasJustificadas}</p>
                    </div>
                </div>
            </div>

            <!-- Visualização por Mês -->
            <div class="visualizacao-meses">
                <h3>PRESENÇA POR MÊS</h3>`;

    // Adicionar linha para cada mês
    dados.estatisticasPorMes.forEach(mes => {
        html += `
                <div class="linha-mes">
                    <div class="mes-nome">
                        <strong>${mes.mesNome}</strong>
                    </div>
                    <div class="dias-bolinha-container">`;

        // Adicionar bolinha para cada dia
        mes.diasDetalhes.forEach(dia => {
            let classeColor = '';
            let titulo = '';

            if (dia.tipo === 'P') {
                classeColor = 'bolinha-presenca';
                titulo = 'Presença';
            } else if (dia.tipo === 'FNJ') {
                classeColor = 'bolinha-falta-nj';
                titulo = 'Falta Não Justificada';
            } else if (dia.tipo === 'FJ') {
                classeColor = 'bolinha-falta-j';
                titulo = 'Falta Justificada';
            } else {
                classeColor = 'bolinha-vazia';
                titulo = 'Sem registro';
            }

            html += `<div class="bolinha ${classeColor}" title="${titulo} - Dia ${dia.dia}">${dia.dia}</div>`;
        });

        html += `
                    </div>
                </div>`;
    });

    html += `
            </div>
        </div>`;

    return html;
}
