/**
 * ==========================================
 * SABAE - Envio de Chamadas para Supabase
 * Sistema de integração com banco de dados
 * ==========================================
 */

/**
 * Transforma a estrutura de chamadas para o formato esperado pela função SQL
 * @param {Array} chamadasSalvas - Array de chamadas do sessionStorage
 * @returns {Array} Array de registros no formato para a função SQL
 */
function prepararChamadasParaSupabase(chamadasSalvas) {
    const registros = [];

    // Iterar sobre cada chamada
    chamadasSalvas.forEach(chamada => {
        const numerMes = obterNumeroMes(chamada.mes);
        const dia = parseInt(chamada.dia);

        // Para cada aluno na chamada, criar um registro
        chamada.alunos.forEach(aluno => {
            registros.push({
                dia: dia,
                mes: numerMes,
                mat: String(aluno.mat || '').trim(),
                nome: String(aluno.nome || '').trim(),
                presenca: String(aluno.presenca || '').trim()
            });
        });
    });

    return registros;
}

/**
 * Envia uma chamada para o Supabase
 * @param {Object} chamada - Objeto da chamada
 * @returns {Promise<Object>} Resultado do envio
 */
async function enviarChamadaParaSupabase(chamada) {
    try {
        console.log('📤 Enviando chamada para Supabase...', chamada);

        // Preparar registros da chamada
        const registros = [];
        const numerMes = obterNumeroMes(chamada.mes);
        const dia = parseInt(chamada.dia);

        chamada.alunos.forEach(aluno => {
            registros.push({
                dia: dia,
                mes: numerMes,
                mat: String(aluno.mat || '').trim(),
                nome: String(aluno.nome || '').trim(),
                presenca: String(aluno.presenca || '').trim()
            });
        });

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            throw new Error('Sessão expirada. Credenciais não encontradas.');
        }

        // Chamar a função RPC do Supabase
        const { data, error } = await supabaseClient.rpc('registrar_chamadas_lote', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_chamadas_json: registros
        });

        if (error) {
            console.error('❌ Erro ao enviar chamada:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao enviar: ${error.message}`,
                erro: error,
                chamada: chamada
            };
        }

        console.log('✅ Resposta do Supabase:', data);

        // Verificar resposta
        if (data && data.total > 0) {
            return {
                sucesso: true,
                mensagem: `Registros enviados: ${data.sucesso}/${data.total}`,
                dados: data,
                chamada: chamada,
                sucessoTotal: data.falhados === 0
            };
        } else {
            return {
                sucesso: false,
                mensagem: 'Nenhum registro foi processado',
                dados: data,
                chamada: chamada
            };
        }

    } catch (erro) {
        console.error('❌ Erro inesperado ao enviar chamada:', erro);
        return {
            sucesso: false,
            mensagem: `Erro: ${erro.message}`,
            erro: erro,
            chamada: chamada
        };
    }
}

/**
 * Envia todas as chamadas salvas para o Supabase com barra de progresso
 * @returns {Promise<void>}
 */
async function enviarTodasChamadasParaSupabase() {
    // Recuperar chamadas salvas
    const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

    if (chamadasSalvas.length === 0) {
        console.warn('⚠️ Não há chamadas registradas para enviar!');
        return;
    }

    // Criar modal se não existir (apenas verifica)
    criarModalEnvio();

    // Obter referências dos elementos do modal
    const modalLoaderEnvio = document.getElementById('modalLoaderEnvio');
    const progressoTexto = document.getElementById('modalLoaderProgresso');
    const barraProgressoContainer = document.getElementById('modalLoaderBarra');
    const detalhes = document.getElementById('modalLoaderDetalhes');

    // Verificar se todos os elementos foram encontrados
    if (!modalLoaderEnvio || !progressoTexto || !barraProgressoContainer || !detalhes) {
        console.error('❌ Erro: Não foi possível encontrar todos os elementos do modal');
        console.error('modalLoaderEnvio:', !!modalLoaderEnvio);
        console.error('progressoTexto:', !!progressoTexto);
        console.error('barraProgressoContainer:', !!barraProgressoContainer);
        console.error('detalhes:', !!detalhes);
        return;
    }

    // Mostrar modal
    modalLoaderEnvio.style.display = 'flex';

    let chamadaEnviadaTotal = 0;
    let alunosEnviadosTotal = 0;
    let alunosFalhadosTotal = 0;
    const errosGerais = [];

    try {
        // Primeiro, validar credenciais
        console.log('🔐 Validando credenciais...');
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            throw new Error('Credenciais não encontradas. Faça login novamente.');
        }

        // Validar login
        const resultadoValidacao = await validarLogin(nomeUsuario, senhaUsuario);
        if (!resultadoValidacao.sucesso) {
            throw new Error('Falha na validação de credenciais. Faça login novamente.');
        }

        console.log('✅ Credenciais validadas com sucesso');

        // Enviar cada chamada
        for (let i = 0; i < chamadasSalvas.length; i++) {
            const chamada = chamadasSalvas[i];

            // Atualizar progresso no modal
            if (progressoTexto) {
                progressoTexto.textContent = `${i + 1}/${chamadasSalvas.length}`;
            }

            const percentual = ((i + 1) / chamadasSalvas.length) * 100;
            if (barraProgressoContainer) {
                barraProgressoContainer.style.width = percentual + '%';
            }

            // Atualizar detalhes
            if (detalhes) {
                detalhes.textContent = `Enviando: ${chamada.sala} - Dia ${chamada.dia}/${obterNumeroMes(chamada.mes)} (${chamada.alunos.length} alunos)`;
            }

            console.log(`\n📤 Enviando chamada ${i + 1}/${chamadasSalvas.length}...`);
            console.log('   Sala:', chamada.sala);
            console.log('   Data:', chamada.dia + '/' + obterNumeroMes(chamada.mes));
            console.log('   Alunos:', chamada.alunos.length);

            // Enviar chamada
            const resultado = await enviarChamadaParaSupabase(chamada);

            if (resultado.sucesso) {
                chamadaEnviadaTotal++;
                alunosEnviadosTotal += resultado.dados.sucesso || chamada.alunos.length;
                alunosFalhadosTotal += resultado.dados.falhados || 0;

                console.log(`✅ Chamada enviada com sucesso`);
                if (resultado.dados.detalhes && resultado.dados.detalhes.length > 0) {
                    console.warn('⚠️ Alguns alunos não foram encontrados:');
                    resultado.dados.detalhes.forEach(detalhe => {
                        const nome = detalhe.nome || 'N/A';
                        const mat = detalhe.mat || 'N/A';
                        const status = detalhe.status || detalhe.erro || 'Erro desconhecido';
                        console.warn(`   - ${nome} (${mat}): ${status}`);
                        errosGerais.push(`${chamada.sala} - ${nome}: ${status}`);
                    });
                }
            } else {
                errosGerais.push(`Sala ${chamada.sala} (${chamada.dia}/${obterNumeroMes(chamada.mes)}): ${resultado.mensagem}`);
                console.error(`❌ Erro ao enviar chamada: ${resultado.mensagem}`);
            }

            // Pequeno delay para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Fechar modal de envio
        if (modalLoaderEnvio) {
            modalLoaderEnvio.style.display = 'none';
        }

        // Exibir resultado
        exibirResultadoEnvioSupabase(
            chamadaEnviadaTotal,
            chamadasSalvas.length,
            alunosEnviadosTotal,
            alunosFalhadosTotal,
            errosGerais
        );

        // Se tudo foi enviado com sucesso, limpar sessionStorage
        if (chamadaEnviadaTotal === chamadasSalvas.length && alunosFalhadosTotal === 0) {
            sessionStorage.removeItem('chamadasSalvas');
            renderizarCartuchosChamadaaSalvas();
            console.log('✅ Todas as chamadas foram enviadas e removidas da memória');
        }

        // Esconder modal de loader
        esconderModalLoaderEnvio();

    } catch (erro) {
        console.error('❌ Erro crítico durante envio:', erro);
        esconderModalLoaderEnvio();

        exibirResultadoEnvioSupabase(
            chamadaEnviadaTotal,
            chamadasSalvas.length,
            alunosEnviadosTotal,
            alunosFalhadosTotal,
            [...errosGerais, `Erro crítico: ${erro.message}`]
        );
    } finally {
        esconderModalLoaderEnvio();
    }
}

/**
 * Exibe o modal de loader para envio
 */
function mostrarModalLoaderEnvio() {
    const modal = document.getElementById('modalLoaderEnvio');
    if (modal) {
        modal.style.display = 'flex';
        // Garantir que o overlay está visível
        const overlay = modal.querySelector('.modal-loader-overlay');
        if (overlay) overlay.style.display = 'block';
    }
}

/**
 * Esconde o modal de loader para envio
 */
function esconderModalLoaderEnvio() {
    const modal = document.getElementById('modalLoaderEnvio');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Atualiza a barra de progresso do modal de loader
 */
function atualizarProgressoModalLoader(atual, total, mensagem = '') {
    const modal = document.getElementById('modalLoaderEnvio');
    if (!modal) return;

    const progresso = document.getElementById('modalLoaderProgresso');
    const barra = document.getElementById('modalLoaderBarra');
    const detalhes = document.getElementById('modalLoaderDetalhes');

    if (progresso) progresso.textContent = `${atual}/${total}`;
    if (barra) barra.style.width = `${(atual / total) * 100}%`;
    if (detalhes && mensagem) detalhes.textContent = mensagem;
}

/**
 * Cria o modal de envio se ele não existir (compatibilidade com código antigo)
 */
function criarModalEnvio() {
    // Modal já existe no HTML, apenas retorna
    console.log('✓ Modal de loader já configurado no HTML');
}

/**
 * Exibe o resultado do envio para Supabase em um modal
 * @param {number} chamadasEnviadas - Quantidade de chamadas enviadas
 * @param {number} totalChamadas - Total de chamadas
 * @param {number} alunosEnviados - Total de alunos enviados com sucesso
 * @param {number} alunosFalhados - Total de alunos que falharam
 * @param {Array} erros - Array com mensagens de erro
 */
function exibirResultadoEnvioSupabase(chamadasEnviadas, totalChamadas, alunosEnviados, alunosFalhados = 0, erros = []) {
    // Usar o modal padrão de sucesso
    const modalSucesso = document.getElementById('modalSucesso');

    if (!modalSucesso) {
        console.error('❌ Modal de sucesso não encontrado');
        return;
    }

    // Atualizar conteúdo do modal padrão baseado no resultado
    const todasEnviadas = chamadasEnviadas === totalChamadas;

    if (todasEnviadas && alunosFalhados === 0) {
        // Sucesso completo
        const titulo = modalSucesso.querySelector('h2');
        const descricao = modalSucesso.querySelector('p');

        if (titulo) titulo.textContent = '✅ Enviado com Sucesso!';
        if (descricao) {
            descricao.textContent = `${chamadasEnviadas} chamada(s) enviada(s).\n${alunosEnviados} alunos registrados no banco de dados.`;
        }
    } else if (chamadasEnviadas > 0) {
        // Envio parcial
        const titulo = modalSucesso.querySelector('h2');
        const descricao = modalSucesso.querySelector('p');

        if (titulo) titulo.textContent = '⚠️ Envio Parcial';
        if (descricao) {
            descricao.textContent = `${chamadasEnviadas}/${totalChamadas} chamada(s) enviadas.\n${alunosEnviados} alunos registrados ${alunosFalhados > 0 ? `e ${alunosFalhados} não encontrados` : ''}.`;
        }
    } else {
        // Falha no envio
        const titulo = modalSucesso.querySelector('h2');
        const descricao = modalSucesso.querySelector('p');

        if (titulo) titulo.textContent = '❌ Falha no Envio';
        if (descricao) descricao.textContent = 'Não foi possível enviar as chamadas. Verifique sua conexão e tente novamente.';
    }

    // Log de erros no console para debug
    if (erros.length > 0) {
        console.warn('⚠️ Erros durante envio:');
        erros.slice(0, 10).forEach((erro, idx) => {
            console.warn(`${idx + 1}. ${erro}`);
        });
        if (erros.length > 10) {
            console.warn(`... e mais ${erros.length - 10} erros`);
        }
    }

    // Mostrar modal
    modalSucesso.style.display = 'flex';
}

/**
 * Inicializa os event listeners do botão de envio
 */
function inicializarBotaoEnvioSupabase() {
    // Listener para o evento de confirmação do modal
    document.addEventListener('confirmarEnvioChamas', () => {
        enviarTodasChamadasParaSupabase();
    });

    console.log('✓ Funcionalidade de envio para Supabase inicializada');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarBotaoEnvioSupabase);
