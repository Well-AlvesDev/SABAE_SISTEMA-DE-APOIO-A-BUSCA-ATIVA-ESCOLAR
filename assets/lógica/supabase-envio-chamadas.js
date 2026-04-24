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
        alert('⚠️ Não há chamadas registradas para enviar!');
        return;
    }

    // Confirmar antes de enviar
    const totalAlunos = chamadasSalvas.reduce((sum, chamada) => sum + chamada.alunos.length, 0);
    const confirmar = confirm(
        `Enviar ${chamadasSalvas.length} chamada(s) com ${totalAlunos} alunos para o Supabase?\n\nEsta ação não poderá ser desfeita.`
    );
    if (!confirmar) {
        return;
    }

    // Criar modal se não existir
    criarModalEnvio();

    // Aguardar um frame para garantir que o modal foi inserido no DOM
    await new Promise(resolve => setTimeout(resolve, 50));

    // Obter referências dos elementos do modal DEPOIS de garantir sua existência
    const modalEnvio = document.getElementById('modalEnvio');
    const progressoTexto = document.getElementById('modalEnvioProgresso');
    const barraProgressoContainer = document.querySelector('#modalEnvioBarraProgresso');
    const detalhes = document.getElementById('modalEnvioDetalhes');

    // Verificar se todos os elementos foram encontrados
    if (!modalEnvio || !progressoTexto || !barraProgressoContainer || !detalhes) {
        console.error('❌ Erro: Não foi possível encontrar todos os elementos do modal');
        console.error('modalEnvio:', !!modalEnvio);
        console.error('progressoTexto:', !!progressoTexto);
        console.error('barraProgressoContainer:', !!barraProgressoContainer);
        console.error('detalhes:', !!detalhes);
        alert('❌ Erro ao criar interface de envio. Tente recarregar a página.');
        return;
    }

    // Mostrar modal
    modalEnvio.style.display = 'flex';

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
        if (modalEnvio) {
            modalEnvio.style.display = 'none';
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

    } catch (erro) {
        console.error('❌ Erro crítico durante envio:', erro);
        if (modalEnvio) {
            modalEnvio.style.display = 'none';
        }

        exibirResultadoEnvioSupabase(
            chamadaEnviadaTotal,
            chamadasSalvas.length,
            alunosEnviadosTotal,
            alunosFalhadosTotal,
            [...errosGerais, `Erro crítico: ${erro.message}`]
        );
    }
}

/**
 * Cria o modal de envio se ele não existir
 */
function criarModalEnvio() {
    let modalExistente = document.getElementById('modalEnvio');
    if (modalExistente) {
        return; // Modal já existe
    }

    const modalHTML = `
    <div id="modalEnvio" class="modal-envio" style="display: none;">
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="margin-bottom: 20px;">
                <div class="spinner" style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <h2 style="margin: 20px 0; font-size: 18px; color: #333;">Enviando Chamadas...</h2>
            <p id="modalEnvioProgresso" style="font-size: 14px; color: #666; margin-bottom: 10px;">0/0</p>
            <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 15px;">
                <div id="modalEnvioBarraProgresso" style="background: linear-gradient(90deg, #3498db, #2ecc71); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <p id="modalEnvioDetalhes" style="font-size: 12px; color: #999; margin-top: 10px;">Preparando...</p>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✓ Modal de envio criado com sucesso');
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
    let modal = document.getElementById('modalResultadoEnvio');

    // Criar modal se não existir
    if (!modal) {
        const modalHTML = `
        <div id="modalResultadoEnvio" class="modal-resultado-envio" style="display: none;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div id="modalResultadoIcone" style="text-align: center; margin-bottom: 20px;"></div>
                <h2 id="modalResultadoTitulo" style="text-align: center; margin: 20px 0; font-size: 20px;"></h2>
                <p id="modalResultadoMensagem" style="text-align: center; margin: 15px 0; color: #666; font-size: 14px; line-height: 1.5;"></p>
                <div id="modalResultadoStats" style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin: 15px 0; font-size: 13px; color: #555;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span>Chamadas:</span>
                        <strong id="modalResultadoEstatChamadas">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span>Alunos Enviados:</span>
                        <strong id="modalResultadoEstatAlunos" style="color: #4CAF50;">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span>Alunos Falhados:</span>
                        <strong id="modalResultadoEstatFalhados" style="color: #FF9800;">0</strong>
                    </div>
                </div>
                <div id="modalResultadoDetalhes" style="display: none; background: #fff3cd; border-left: 4px solid #FF9800; padding: 12px; border-radius: 5px; margin: 15px 0; font-size: 12px; color: #856404; max-height: 200px; overflow-y: auto;"></div>
                <div style="text-align: center; margin-top: 20px;">
                    <button id="btnFecharResultado" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.3s ease;">Fechar</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalResultadoEnvio');

        // Adicionar event listener ao botão de fechar
        const btnFecharResultado = document.getElementById('btnFecharResultado');
        if (btnFecharResultado) {
            btnFecharResultado.addEventListener('click', () => {
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // Verificar se o modal foi criado com sucesso
    if (!modal) {
        console.error('❌ Erro ao criar modal de resultado');
        alert('Erro ao exibir resultado. Por favor, verifique os dados manualmente no Supabase.');
        return;
    }

    // Obter referências dos elementos dentro do modal
    const icone = document.getElementById('modalResultadoIcone');
    const titulo = document.getElementById('modalResultadoTitulo');
    const mensagem = document.getElementById('modalResultadoMensagem');
    const detalhesDiv = document.getElementById('modalResultadoDetalhes');
    const estatChamadas = document.getElementById('modalResultadoEstatChamadas');
    const estatAlunos = document.getElementById('modalResultadoEstatAlunos');
    const estatFalhados = document.getElementById('modalResultadoEstatFalhados');

    // Verificar se todos os elementos foram encontrados
    if (!icone || !titulo || !mensagem || !detalhesDiv || !estatChamadas || !estatAlunos || !estatFalhados) {
        console.error('❌ Erro: Não foi possível encontrar todos os elementos do modal de resultado');
        return;
    }

    // Configurar ícone e cor baseado no resultado
    const todasEnviadas = chamadasEnviadas === totalChamadas;

    if (todasEnviadas && alunosFalhados === 0) {
        icone.innerHTML = '<i class="ri-checkbox-circle-fill" style="color: #4CAF50; font-size: 48px;"></i>';
        titulo.textContent = '✅ Sucesso Completo!';
        titulo.style.color = '#4CAF50';
        mensagem.textContent = `Todas as ${chamadasEnviadas} chamada(s) foram enviadas com sucesso! ${alunosEnviados} alunos registrados no banco de dados.`;
    } else if (chamadasEnviadas > 0) {
        icone.innerHTML = '<i class="ri-alert-line" style="color: #FF9800; font-size: 48px;"></i>';
        titulo.textContent = '⚠️ Envio Parcial';
        titulo.style.color = '#FF9800';
        mensagem.textContent = `${chamadasEnviadas}/${totalChamadas} chamada(s) enviadas. ${alunosEnviados} alunos registrados ${alunosFalhados > 0 ? `e ${alunosFalhados} não encontrados` : ''}.`;
    } else {
        icone.innerHTML = '<i class="ri-close-circle-fill" style="color: #d32f2f; font-size: 48px;"></i>';
        titulo.textContent = '❌ Falha no Envio';
        titulo.style.color = '#d32f2f';
        mensagem.textContent = 'Não foi possível enviar as chamadas. Verifique sua conexão e tente novamente.';
    }

    // Atualizar estatísticas
    estatChamadas.textContent = `${chamadasEnviadas}/${totalChamadas}`;
    estatAlunos.textContent = alunosEnviados;
    estatFalhados.textContent = alunosFalhados;

    // Exibir erros, se houver
    if (erros.length > 0) {
        detalhesDiv.style.display = 'block';
        detalhesDiv.innerHTML = '<strong>⚠️ Detalhes dos Erros:</strong><br>' +
            erros.slice(0, 10).map((erro, idx) =>
                `<div style="padding: 5px 0; border-bottom: 1px solid #ffebcd;">
                    ${idx + 1}. ${erro}
                </div>`
            ).join('') +
            (erros.length > 10 ? `<div style="padding: 5px 0; font-style: italic;">... e mais ${erros.length - 10} erros</div>` : '');
    } else {
        detalhesDiv.style.display = 'none';
    }

    // Mostrar modal
    modal.style.display = 'flex';
}

/**
 * Inicializa os event listeners do botão de envio
 */
function inicializarBotaoEnvioSupabase() {
    // Botão de enviar para o banco
    const btnEnviarParaBanco = document.getElementById('btnEnviarParaBanco');
    if (btnEnviarParaBanco) {
        btnEnviarParaBanco.addEventListener('click', () => {
            enviarTodasChamadasParaSupabase();
        });
    }

    console.log('✓ Funcionalidade de envio para Supabase inicializada');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarBotaoEnvioSupabase);
