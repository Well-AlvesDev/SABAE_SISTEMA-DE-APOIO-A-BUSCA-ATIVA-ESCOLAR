/**
 * Cliente Supabase para adicionar novo aluno à tabela SABAE-DATA
 * 
 * ✅ VERSÃO ATUALIZADA: Suporta ambas autenticações
 * - Funções nativas (com email) para novo sistema
 * - Funções legadas (com username/senha) para compatibilidade
 */

// ========== FUNÇÕES DE VALIDAÇÃO E UTILITÁRIOS ==========

// Função para validar matrícula (apenas números)
function validarMatricula(valor) {
    return /^\d*$/.test(valor);
}

// Função para validar nome (apenas letras e parênteses)
function validarNome(valor) {
    return /^[A-ZÀ-Ÿ\s()]*$/.test(valor);
}

// Função para converter nome para maiúsculas
function converterParaMaiusculas(valor) {
    return valor.toUpperCase();
}

// ========== NOVAS FUNÇÕES COM AUTH NATIVO ==========

/**
 * Adicionar novo aluno usando autenticação nativa
 * @param {string} matricula - Matrícula do aluno
 * @param {string} nome - Nome do aluno
 * @param {string} turma - Turma do aluno
 * @param {string} turno - Turno (MANHÃ, TARDE, NOITE)
 * @param {string} status - Status (MATRICULADO, TRANSFERIDO, FALECIDO)
 * @returns {Promise<Object>} { sucesso, mensagem, dados }
 */
async function adicionarNovoAlunoNativo(matricula, nome, turma, turno, status) {
    try {
        console.log('➕ Adicionando novo aluno (AUTH NATIVO)...');
        console.log('Dados:', { matricula, nome, turma, turno, status });

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        console.log(`👤 Usuário autenticado: ${usuario.email}`);

        // Chamar função RPC com email do usuário autenticado
        const { data, error } = await supabaseClient.rpc('adicionar_aluno_nativo', {
            p_email_usuario: usuario.email,
            p_matricula: matricula,
            p_nome: nome,
            p_turma: turma,
            p_turno: turno,
            p_status: status
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao adicionar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao adicionar aluno'
            };
        }

        console.log('✅ Aluno adicionado com sucesso!');

        // Limpar cache de alunos para forçar recarga na próxima vez
        limparCacheAlunos();

        return {
            sucesso: true,
            mensagem: 'Aluno adicionado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao adicionar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

/**
 * Buscar aluno por matrícula usando autenticação nativa
 * @param {string} matricula - Matrícula do aluno
 * @returns {Promise<Object>} { sucesso, mensagem, dados }
 */
async function buscarAlunoPorMatriculaNativo(matricula) {
    try {
        console.log('🔍 Buscando aluno com matrícula:', matricula);

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Chamar função RPC com email
        const { data, error } = await supabaseClient.rpc('buscar_aluno_por_matricula_nativo', {
            p_email_usuario: usuario.email,
            p_matricula: matricula
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao buscar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao buscar aluno'
            };
        }

        console.log('✅ Aluno encontrado!', data.dados);
        return {
            sucesso: true,
            mensagem: 'Aluno encontrado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao buscar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

/**
 * Atualizar aluno usando autenticação nativa
 * @param {string} matricula - Matrícula do aluno
 * @param {string} nome - Novo nome
 * @param {string} turma - Nova turma
 * @param {string} turno - Novo turno
 * @param {string} status - Novo status
 * @returns {Promise<Object>} { sucesso, mensagem, dados }
 */
async function atualizarAlunoNativo(matricula, nome, turma, turno, status) {
    try {
        console.log('✏️ Atualizando aluno (AUTH NATIVO)...');
        console.log('Dados:', { matricula, nome, turma, turno, status });

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Chamar função RPC com email
        const { data, error } = await supabaseClient.rpc('atualizar_aluno_nativo', {
            p_email_usuario: usuario.email,
            p_matricula: matricula,
            p_nome: nome,
            p_turma: turma,
            p_turno: turno,
            p_status: status
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao atualizar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao atualizar aluno'
            };
        }

        console.log('✅ Aluno atualizado com sucesso!');

        // Limpar cache de alunos para forçar recarga
        limparCacheAlunos();

        return {
            sucesso: true,
            mensagem: 'Aluno atualizado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao atualizar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

/**
 * Carregar turmas disponíveis usando autenticação nativa
 * @param {boolean} forcarRecarga - Ignorar cache
 * @returns {Promise<Array>} Lista de turmas
 */
async function carregarTurmasParaModalNativo(forcarRecarga = false) {
    try {
        console.log('🏫 Carregando turmas para o modal (AUTH NATIVO)...');

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Chamar função RPC com email
        const { data, error } = await supabaseClient.rpc('obter_turmas_disponiveis_nativo', {
            p_email_usuario: usuario.email
        });

        if (error) {
            console.error('❌ Erro ao obter turmas:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('⚠️ Nenhuma turma encontrada');
            return [];
        }

        // Extrair nomes das turmas
        const turmas = data.map(item => item.turma).filter(turma => turma);
        console.log(`✅ ${turmas.length} turmas carregadas`);
        return turmas;

    } catch (erro) {
        console.error('❌ Erro ao carregar turmas:', erro);
        return [];
    }
}

// ========== FUNÇÕES LEGADAS (DEPRECIADAS) - COMPATIBILIDADE ==========

// @deprecated Usar versões com sufixo "Nativo" em vez disso
// Função para adicionar novo aluno
async function adicionarNovoAluno(matricula, nome, turma, turno, status) {
    try {
        console.log('➕ Adicionando novo aluno...');
        console.log('Dados:', { matricula, nome, turma, turno, status });

        // Recuperar credenciais do sessionStorage
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            return {
                sucesso: false,
                mensagem: 'Erro: Credenciais da sessão não encontradas. Faça login novamente.'
            };
        }

        console.log('✅ Credenciais recuperadas da sessão');

        // Chamar função RPC para adicionar aluno
        const { data, error } = await supabaseClient.rpc('adicionar_aluno', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_matricula: matricula,
            p_nome: nome,
            p_turma: turma,
            p_turno: turno,
            p_status: status
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao adicionar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao adicionar aluno'
            };
        }

        console.log('✅ Aluno adicionado com sucesso!');

        // Limpar cache de alunos para forçar recarga na próxima vez
        limparCacheAlunos();

        return {
            sucesso: true,
            mensagem: 'Aluno adicionado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao adicionar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

// Função para limpar cache de alunos
function limparCacheAlunos() {
    try {
        sessionStorage.removeItem('sabae_cache_alunos');
        sessionStorage.removeItem('sabae_cache_alunos_turma_*');
        // Limpar todos os caches de turma
        for (let i = 0; i < sessionStorage.length; i++) {
            const chave = sessionStorage.key(i);
            if (chave && chave.startsWith('sabae_cache_alunos_turma_')) {
                sessionStorage.removeItem(chave);
            }
        }
        console.log('✅ Cache de alunos limpo');
    } catch (erro) {
        console.warn('⚠️ Erro ao limpar cache:', erro);
    }
}

// Função para obter turmas disponíveis e adicionar ao cache
async function carregarTurmasParaModal() {
    try {
        console.log('🏫 Carregando turmas para o modal...');

        // Recuperar credenciais
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas');
            return [];
        }

        // Chamar função para obter turmas
        const resultado = await obterTurmasDisponiveis(nomeUsuario, senhaUsuario, false);

        if (resultado.sucesso && resultado.turmas && resultado.turmas.length > 0) {
            console.log(`✅ ${resultado.turmas.length} turmas carregadas`);
            return resultado.turmas;
        } else {
            console.warn('⚠️ Nenhuma turma encontrada ou erro na busca');
            return [];
        }

    } catch (erro) {
        console.error('❌ Erro ao carregar turmas:', erro);
        return [];
    }
}

// ========== FUNÇÕES PARA POPULAR DROPDOWNS ==========

/**
 * Popular dropdown de turmas usando autenticação nativa
 * @param {string} seletor - Seletor do elemento select
 */
async function popularDropdownTurmasNativo(seletor) {
    try {
        const turmas = await carregarTurmasParaModalNativo();
        const dropdown = document.querySelector(seletor);

        if (!dropdown) {
            console.error(`❌ Elemento ${seletor} não encontrado`);
            return;
        }

        // Limpar opções existentes (mantém primeira opção placeholder se houver)
        const opcoes = dropdown.querySelectorAll('option:not(:first-child)');
        opcoes.forEach(opcao => opcao.remove());

        // Adicionar novas opções
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            dropdown.appendChild(option);
        });

        console.log(`✅ Dropdown de turmas populado com ${turmas.length} opções`);
    } catch (erro) {
        console.error('❌ Erro ao popular dropdown:', erro);
    }
}

// @deprecated Usar popularDropdownTurmasNativo() em vez disso
// Função para Popular dropdown de turmas
async function popularDropdownTurmas(seletor) {
    try {
        const turmas = await carregarTurmasParaModal();
        const dropdown = document.querySelector(seletor);

        if (!dropdown) {
            console.error(`❌ Elemento ${seletor} não encontrado`);
            return;
        }

        // Limpar opções existentes (mantém primeira opção placeholder se houver)
        const opcoes = dropdown.querySelectorAll('option:not(:first-child)');
        opcoes.forEach(opcao => opcao.remove());

        // Adicionar novas opções
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            dropdown.appendChild(option);
        });

        console.log(`✅ Dropdown de turmas populado com ${turmas.length} opções`);
    } catch (erro) {
        console.error('❌ Erro ao popular dropdown:', erro);
    }
}

// Função para validar e enviar formulário
async function enviarFormularioAdicionarAluno(event) {
    event.preventDefault();

    try {
        console.log('📝 Validando formulário de adicionar aluno...');

        // Obter valores dos inputs
        const inputMatricula = document.getElementById('inputMatricula');
        const inputNome = document.getElementById('inputNome');
        const selectTurma = document.getElementById('selectTurma');
        const selectTurno = document.getElementById('selectTurno');
        const selectStatus = document.getElementById('selectStatus');

        // Validar se elementos existem
        if (!inputMatricula || !inputNome || !selectTurma || !selectTurno || !selectStatus) {
            console.error('❌ Um ou mais elementos do formulário não encontrados');
            mostrarNotificacao('Erro: Formulário incompleto', 'erro');
            return;
        }

        const matricula = inputMatricula.value.trim();
        const nome = inputNome.value.trim();
        const turma = selectTurma.value;
        const turno = selectTurno.value;
        const status = selectStatus.value;

        // Validar matrícula
        if (!matricula) {
            console.warn('⚠️ Matrícula vazia');
            mostrarNotificacao('Matrícula é obrigatória', 'erro');
            inputMatricula.focus();
            return;
        }

        if (!validarMatricula(matricula)) {
            console.warn('⚠️ Matrícula contém caracteres inválidos');
            mostrarNotificacao('Matrícula deve conter apenas números', 'erro');
            inputMatricula.focus();
            return;
        }

        // Validar nome
        if (!nome) {
            console.warn('⚠️ Nome vazio');
            mostrarNotificacao('Nome é obrigatório', 'erro');
            inputNome.focus();
            return;
        }

        if (!validarNome(nome)) {
            console.warn('⚠️ Nome contém caracteres inválidos');
            mostrarNotificacao('Nome deve conter apenas letras e parênteses', 'erro');
            inputNome.focus();
            return;
        }

        // Validar turma
        if (!turma || turma === '') {
            console.warn('⚠️ Turma não selecionada');
            mostrarNotificacao('Selecione uma turma', 'erro');
            selectTurma.focus();
            return;
        }

        // Validar turno
        if (!turno || turno === '') {
            console.warn('⚠️ Turno não selecionado');
            mostrarNotificacao('Selecione um turno', 'erro');
            selectTurno.focus();
            return;
        }

        // Validar status
        if (!status || status === '') {
            console.warn('⚠️ Status não selecionado');
            mostrarNotificacao('Selecione um status', 'erro');
            selectStatus.focus();
            return;
        }

        console.log('✅ Validações concluídas com sucesso');
        console.log('Dados do formulário:', { matricula, nome, turma, turno, status });

        // Mostrar loader
        mostrarLoaderProcessamento('Adicionando aluno...');

        // Chamar função para adicionar aluno (usando auth nativo)
        const resultado = await adicionarNovoAlunoNativo(
            matricula,
            nome,
            turma,
            turno,
            status
        );

        // Remover loader
        removerLoaderProcessamento();

        if (resultado.sucesso) {
            console.log('✅ Aluno adicionado com sucesso!');
            mostrarNotificacao('Aluno adicionado com sucesso!', 'sucesso');

            // Limpar formulário
            document.getElementById('formAdicionarAluno').reset();
            document.getElementById('inputNome').value = '';

            // Fechar modal
            const modal = document.getElementById('modalAdicionarAluno');
            if (modal) {
                modal.style.display = 'none';
            }

            // Aguardar um pouco e recarregar dados
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            console.error('❌ Erro ao adicionar aluno:', resultado.mensagem);
            mostrarNotificacao(resultado.mensagem, 'erro');
        }

    } catch (erro) {
        console.error('❌ Erro ao processar formulário:', erro);
        removerLoaderProcessamento();
        mostrarNotificacao('Erro ao processar o formulário: ' + erro.message, 'erro');
    }
}

// Função auxiliar para mostrar loader de processamento (se não existir)
function mostrarLoaderProcessamento(mensagem = 'Processando...') {
    let loader = document.getElementById('loaderRecarregamento');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loaderRecarregamento';
        loader.className = 'loader-container';
        loader.innerHTML = `
            <img src="./assets/imagens/logos/sabae.png" alt="" style="width: 150px;">
            <div class="spinner"></div>
            <p>${mensagem}</p>
        `;
        document.body.appendChild(loader);
    } else {
        const paragrafo = loader.querySelector('p');
        if (paragrafo) paragrafo.textContent = mensagem;
        loader.style.display = 'flex';
    }
}

// Função auxiliar para remover loader (se não existir)
function removerLoaderProcessamento() {
    const loader = document.getElementById('loaderRecarregamento');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Função auxiliar para mostrar notificação (se não existir)
function mostrarNotificacao(mensagem, tipo = 'info') {
    console.log(`📢 Notificação [${tipo}]: ${mensagem}`);

    // Criar notificação visual se possível
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${tipo === 'sucesso' ? '#4CAF50' : tipo === 'erro' ? '#F44336' : '#2196F3'};
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease-in-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// ========================================================================================================
// FUNÇÕES PARA EDITAR ALUNO
// ========================================================================================================

// Flag para rastrear se estamos em modo de edição
let modoEdicaoAluno = false;
let alunoEmEdicaoMatricula = null;

// Função para buscar aluno por matrícula
async function buscarAlunoPorMatricula(matricula) {
    try {
        console.log('🔍 Buscando aluno com matrícula:', matricula);

        // Recuperar credenciais do sessionStorage
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            return {
                sucesso: false,
                mensagem: 'Erro: Credenciais da sessão não encontradas. Faça login novamente.'
            };
        }

        // Chamar função RPC para buscar aluno
        const { data, error } = await supabaseClient.rpc('buscar_aluno_por_matricula', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_matricula: matricula
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao buscar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao buscar aluno'
            };
        }

        console.log('✅ Aluno encontrado!', data.dados);
        return {
            sucesso: true,
            mensagem: 'Aluno encontrado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao buscar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

// Função para atualizar aluno
async function atualizarAluno(matricula, nome, turma, turno, status) {
    try {
        console.log('✏️ Atualizando aluno...');
        console.log('Dados:', { matricula, nome, turma, turno, status });

        // Recuperar credenciais do sessionStorage
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            return {
                sucesso: false,
                mensagem: 'Erro: Credenciais da sessão não encontradas. Faça login novamente.'
            };
        }

        // Chamar função RPC para atualizar aluno
        const { data, error } = await supabaseClient.rpc('atualizar_aluno', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_matricula: matricula,
            p_nome: nome,
            p_turma: turma,
            p_turno: turno,
            p_status: status
        });

        console.log('Resposta do Supabase:', { data, error });

        if (error) {
            console.error('❌ Erro ao atualizar aluno:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        // Verificar resposta
        if (!data || !data.sucesso) {
            console.warn('⚠️ Operação não bem-sucedida:', data?.mensagem);
            return {
                sucesso: false,
                mensagem: data?.mensagem || 'Erro ao atualizar aluno'
            };
        }

        console.log('✅ Aluno atualizado com sucesso!');

        // Limpar cache de alunos para forçar recarga na próxima vez
        limparCacheAlunos();

        return {
            sucesso: true,
            mensagem: 'Aluno atualizado com sucesso',
            dados: data.dados
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao atualizar aluno:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}

// Função para abrir modal de edição de aluno
function abrirModalBuscaMatricula() {
    console.log('📖 Abrindo modal de busca de matrícula...');
    const modal = document.getElementById('modalBuscaMatricula');
    if (modal) {
        modal.classList.add('ativo');
        setTimeout(() => {
            const input = document.getElementById('inputBuscaMatricula');
            if (input) input.focus();
        }, 100);
    }
}

// Função para fechar modal de busca de matrícula
function fecharModalBuscaMatricula() {
    console.log('❌ Fechando modal de busca...');
    const modal = document.getElementById('modalBuscaMatricula');
    if (modal) {
        modal.classList.remove('ativo');
        const input = document.getElementById('inputBuscaMatricula');
        if (input) input.value = '';
    }
}

// Função para confirmar busca de matrícula
async function confirmarBuscaMatricula() {
    const inputBusca = document.getElementById('inputBuscaMatricula');
    if (!inputBusca) {
        console.error('❌ Input de busca não encontrado');
        mostrarNotificacao('Erro ao buscar aluno', 'erro');
        return;
    }

    const matricula = inputBusca.value.trim();

    // Validar matrícula
    if (!matricula) {
        console.warn('⚠️ Matrícula vazia');
        mostrarNotificacao('Digite a matrícula do aluno', 'erro');
        inputBusca.focus();
        return;
    }

    if (!validarMatricula(matricula)) {
        console.warn('⚠️ Matrícula contém caracteres inválidos');
        mostrarNotificacao('Matrícula deve conter apenas números', 'erro');
        inputBusca.focus();
        return;
    }

    console.log('🔍 Buscando aluno com matrícula:', matricula);

    // Mostrar loader
    mostrarLoaderProcessamento('Buscando aluno...');

    // Buscar aluno
    const resultado = await buscarAlunoPorMatricula(matricula);

    // Remover loader
    removerLoaderProcessamento();

    if (resultado.sucesso) {
        console.log('✅ Aluno encontrado:', resultado.dados);

        // Fechar modal de busca
        fecharModalBuscaMatricula();

        // Armazenar informação de edição
        modoEdicaoAluno = true;
        alunoEmEdicaoMatricula = resultado.dados.matricula;

        // Preencher formulário com dados do aluno
        preencherFormularioComDadosAluno(resultado.dados);

        // Abrir modal de edição
        const modalAdicionarAluno = document.getElementById('modalAdicionarAluno');
        if (modalAdicionarAluno) {
            // Atualizar título do header para "Editar Aluno"
            const modalHeader = modalAdicionarAluno.querySelector('.modal-adicionar-header h2');
            if (modalHeader) {
                modalHeader.textContent = 'Editar Aluno';
            }

            // Atualizar texto do botão de envio
            const btnEnviarModal = modalAdicionarAluno.querySelector('.btn-enviar-modal');
            if (btnEnviarModal) {
                const btnText = btnEnviarModal.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Atualizar';
            }

            modalAdicionarAluno.classList.add('ativo');
            // Carregar turmas se não estiverem carregadas
            popularDropdownTurmas('#selectTurma');
        }
    } else {
        console.error('❌ Erro ao buscar aluno:', resultado.mensagem);
        mostrarNotificacao(resultado.mensagem, 'erro');
    }
}

// Função para preencher formulário com dados do aluno
function preencherFormularioComDadosAluno(dados) {
    try {
        console.log('📝 Preenchendo formulário com dados do aluno...');

        const inputMatricula = document.getElementById('inputMatricula');
        const inputNome = document.getElementById('inputNome');
        const selectTurma = document.getElementById('selectTurma');
        const selectTurno = document.getElementById('selectTurno');
        const selectStatus = document.getElementById('selectStatus');

        if (!inputMatricula || !inputNome || !selectTurma || !selectTurno || !selectStatus) {
            console.error('❌ Um ou mais elementos do formulário não encontrados');
            return;
        }

        // Preencher campos
        inputMatricula.value = dados.matricula;
        inputMatricula.disabled = true;
        inputMatricula.style.opacity = '0.5';
        inputMatricula.style.cursor = 'not-allowed';

        inputNome.value = dados.nome;

        // Aguardar um pouco para as opções de turma serem carregadas
        setTimeout(() => {
            selectTurma.value = dados.turma;
            selectTurno.value = dados.turno;
            selectStatus.value = dados.status;
        }, 200);

        console.log('✅ Formulário preenchido com sucesso');

    } catch (erro) {
        console.error('❌ Erro ao preencher formulário:', erro);
    }
}

// Função para validar e enviar formulário de edição
async function enviarFormularioEditarAluno(event) {
    event.preventDefault();

    try {
        console.log('📝 Validando formulário de editar aluno...');

        // Obter valores dos inputs
        const inputMatricula = document.getElementById('inputMatricula');
        const inputNome = document.getElementById('inputNome');
        const selectTurma = document.getElementById('selectTurma');
        const selectTurno = document.getElementById('selectTurno');
        const selectStatus = document.getElementById('selectStatus');

        // Validar se elementos existem
        if (!inputMatricula || !inputNome || !selectTurma || !selectTurno || !selectStatus) {
            console.error('❌ Um ou mais elementos do formulário não encontrados');
            mostrarNotificacao('Erro: Formulário incompleto', 'erro');
            return;
        }

        const matricula = inputMatricula.value.trim();
        const nome = inputNome.value.trim();
        const turma = selectTurma.value;
        const turno = selectTurno.value;
        const status = selectStatus.value;

        // Validar nome
        if (!nome) {
            console.warn('⚠️ Nome vazio');
            mostrarNotificacao('Nome é obrigatório', 'erro');
            inputNome.focus();
            return;
        }

        if (!validarNome(nome)) {
            console.warn('⚠️ Nome contém caracteres inválidos');
            mostrarNotificacao('Nome deve conter apenas letras e parênteses', 'erro');
            inputNome.focus();
            return;
        }

        // Validar turma
        if (!turma || turma === '') {
            console.warn('⚠️ Turma não selecionada');
            mostrarNotificacao('Selecione uma turma', 'erro');
            selectTurma.focus();
            return;
        }

        // Validar turno
        if (!turno || turno === '') {
            console.warn('⚠️ Turno não selecionado');
            mostrarNotificacao('Selecione um turno', 'erro');
            selectTurno.focus();
            return;
        }

        // Validar status
        if (!status || status === '') {
            console.warn('⚠️ Status não selecionado');
            mostrarNotificacao('Selecione um status', 'erro');
            selectStatus.focus();
            return;
        }

        console.log('✅ Validações concluídas com sucesso');
        console.log('Dados do formulário:', { matricula, nome, turma, turno, status });

        // Mostrar loader
        mostrarLoaderProcessamento('Atualizando aluno...');

        // Chamar função para atualizar aluno (usando auth nativo)
        const resultado = await atualizarAlunoNativo(
            matricula,
            nome,
            turma,
            turno,
            status
        );

        // Remover loader
        removerLoaderProcessamento();

        if (resultado.sucesso) {
            console.log('✅ Aluno atualizado com sucesso!');
            mostrarNotificacao('Aluno atualizado com sucesso!', 'sucesso');

            // Limpar estado de edição
            modoEdicaoAluno = false;
            alunoEmEdicaoMatricula = null;

            // Limpar formulário
            document.getElementById('formAdicionarAluno').reset();
            document.getElementById('inputNome').value = '';
            document.getElementById('inputMatricula').disabled = false;
            document.getElementById('inputMatricula').style.opacity = '1';
            document.getElementById('inputMatricula').style.cursor = 'pointer';

            // Fechar modal
            const modal = document.getElementById('modalAdicionarAluno');
            if (modal) {
                modal.classList.remove('ativo');
            }

            // Aguardar um pouco e recarregar dados
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            console.error('❌ Erro ao atualizar aluno:', resultado.mensagem);
            mostrarNotificacao(resultado.mensagem, 'erro');
        }

    } catch (erro) {
        console.error('❌ Erro ao processar formulário:', erro);
        removerLoaderProcessamento();
        mostrarNotificacao('Erro ao processar o formulário: ' + erro.message, 'erro');
    }
}
