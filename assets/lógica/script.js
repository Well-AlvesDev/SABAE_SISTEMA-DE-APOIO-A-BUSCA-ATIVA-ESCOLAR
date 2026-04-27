// Função para verificar se o usuário está logado
function verificarAutenticacao() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    return usuarioLogado === 'true';
}

// Variável para armazenar o ID da chamada sendo editada
let chamadaEmEdicao = null;

// Flag para identificar se a chamada veio do Supabase (não deve salvar em sessionStorage)
let chamadaEmEdicaoVeioDoSupabase = false;

// Armazenar dados da chamada do Supabase temporariamente durante edição
let chamadaSupabaseEmEdicao = null;

// Armazenar dados da chamada duplicada (para edição após confirmar no modal)
let chamadaDuplicadaParaEditar = null;

// Variável para armazenar o ID da chamada sendo excluída
let chamadaParaExcluir = null;

// Função auxiliar para adicionar/remover modo de edição do modal header
function adicionarModoEdicaoModalHeader() {
    const modalHeader = document.querySelector('.modal-chamada-header');
    if (modalHeader) {
        modalHeader.classList.add('edit-mode');
    }
}

function removerModoEdicaoModalHeader() {
    const modalHeader = document.querySelector('.modal-chamada-header');
    if (modalHeader) {
        modalHeader.classList.remove('edit-mode');
    }
}

// Função para remover o loader
function removerLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

// Funções para controlar o loader de processamento
function mostrarLoaderProcessamento(mensagem = 'Processando...') {
    const loader = document.getElementById('loaderRecarregamento');
    if (loader) {
        const paragrafo = loader.querySelector('p');
        if (paragrafo) {
            paragrafo.textContent = mensagem;
        }
        loader.style.display = 'flex';
    }
}

function esconderLoaderProcessamento() {
    const loader = document.getElementById('loaderRecarregamento');
    if (loader) {
        loader.style.display = 'none';
    }
}

// ========== LÓGICA DO DROPDOWN CUSTOMIZADO ==========
function inicializarDropdownCustomizado() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        const label = dropdown.querySelector('.dropdown-label');
        const hiddenInput = dropdown.parentElement.querySelector('input[type="hidden"]');

        if (!toggle || !menu) return;

        // Abrir/fechar dropdown ao clicar no botão
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menu.classList.contains('active');

            // Fechar todos os outros dropdowns
            document.querySelectorAll('.dropdown-menu.active').forEach(m => {
                if (m !== menu) {
                    m.classList.remove('active');
                    m.parentElement.querySelector('.dropdown-toggle').classList.remove('active');
                }
            });

            // Toggle este dropdown
            if (isActive) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
            } else {
                menu.classList.add('active');
                toggle.classList.add('active');
                // Focar no primeiro item para melhor acessibilidade
                const firstItem = menu.querySelector('.dropdown-item:not(.loading):not(.empty):not(.erro)');
                if (firstItem) {
                    firstItem.focus();
                }
            }
        });

        // Selecionar item do dropdown
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item:not(.loading):not(.empty):not(.erro)');
            if (!item) return;

            e.stopPropagation();
            const value = item.dataset.value || item.textContent;

            // Atualizar label
            label.textContent = value;

            // Atualizar input hidden
            if (hiddenInput) {
                hiddenInput.value = value;
            }

            // Remover seleção anterior
            menu.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.remove('selected');
            });

            // Adicionar seleção ao item clicado
            item.classList.add('selected');

            // Fechar dropdown
            menu.classList.remove('active');
            toggle.classList.remove('active');

            // Disparar evento customizado
            const event = new CustomEvent('dropdownChange', {
                detail: { value: value }
            });
            dropdown.dispatchEvent(event);

            console.log(`Sala selecionada: ${value}`);
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
            }
        });

        // Suporte para teclado (acessibilidade)
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });

        menu.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                menu.classList.remove('active');
                toggle.classList.remove('active');
                toggle.focus();
            }
        });

        // Suporte para navegação com setas do teclado
        menu.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = Array.from(menu.querySelectorAll('.dropdown-item:not(.loading):not(.empty):not(.erro)'));
                const currentIndex = items.indexOf(document.activeElement);
                let nextIndex;

                if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                }

                if (items[nextIndex]) {
                    items[nextIndex].focus();
                }
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (document.activeElement.classList.contains('dropdown-item')) {
                    document.activeElement.click();
                }
            }
        });
    });
}

// Função para executar após o loader
async function inicializarPagina() {
    if (verificarAutenticacao()) {
        // Recuperar e exibir nome do usuário
        const nomeUsuario = sessionStorage.getItem('usuario');
        if (nomeUsuario) {
            const spanNomeUsuario = document.getElementById('nomeUsuario');
            if (spanNomeUsuario) {
                spanNomeUsuario.textContent = nomeUsuario;
            }

            // Também atualizar o header
            const spanNomeUsuarioHeader = document.getElementById('nomeUsuarioHeader');
            if (spanNomeUsuarioHeader) {
                spanNomeUsuarioHeader.textContent = nomeUsuario;
            }
        }

        // Inicializar dropdown customizado
        inicializarDropdownCustomizado();

        // Carregar dados apenas se estamos na página chamada.html (verificar se dropdown existe)
        const salaDropdown = document.getElementById('salaDropdown');
        if (salaDropdown) {
            // Carregar TODOS os alunos e as salas antes de mostrar a página
            try {
                console.log('⏳ Carregando dados iniciais...');

                // Carregar todos os alunos no sessionStorage
                const resultadoAlunos = await carregarTodosAlunosNaSessionStorage();
                if (resultadoAlunos.sucesso) {
                    console.log(`✓ ${resultadoAlunos.alunos.length} alunos carregados no sessionStorage`);
                } else {
                    console.warn(`⚠️ Aviso ao carregar alunos: ${resultadoAlunos.mensagem}`);
                }

                // Carregar as salas
                await carregarSalasNoDropdown('#salaDropdown');
                console.log('✓ Salas carregadas com sucesso');
            } catch (erro) {
                console.error('⚠️ Erro ao carregar dados:', erro);
            } finally {
                // Remover loader após os dados terem sido carregados (ou após erro)
                removerLoader();
            }
        } else {
            // Estamos em index.html, apenas remover loader
            removerLoader();
        }
    } else {
        // Usuário não está logado - remover loader e redirecionar para login
        removerLoader();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 300);
    }
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializarPagina);

// Funcionalidade de logout
const btnSair = document.getElementById('btnSair');
if (btnSair) {
    btnSair.addEventListener('click', async () => {
        // Obter nome do usuário e senha antes de limpar a sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        // Registrar a atividade de saída
        if (nomeUsuario && senhaUsuario) {
            try {
                console.log('Registrando saída do sistema...');
                const { data: resultadoAtividade, error: erroAtividade } = await supabaseClient.rpc('registrar_atividade', {
                    p_nomeusuario: nomeUsuario,
                    p_senha_usuario: senhaUsuario,
                    p_atividade: 'Saiu do sistema'
                });

                if (erroAtividade) {
                    console.error('⚠️ Erro ao registrar logout:', erroAtividade);
                } else {
                    console.log('✅ Logout registrado com sucesso:', resultadoAtividade);
                }
            } catch (erroAtividade) {
                console.error('⚠️ Erro ao registrar logout:', erroAtividade);
            }
        }

        // Limpar dados da sessão
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem('usuarioSenha');

        // Redirecionar para página de login
        window.location.href = 'login.html';
    });
}



// Fechar modal ao clicar fora dele
const modalSucesso = document.getElementById('modalSucesso');
if (modalSucesso) {
    modalSucesso.addEventListener('click', (e) => {
        if (e.target === modalSucesso || e.target.classList.contains('modal-sucesso-overlay')) {
            modalSucesso.style.display = 'none';
        }
    });
}

// ========== FUNCIONALIDADES DO MODAL DE AVISO ==========
function exibirModalAviso(titulo, mensagem) {
    const modalAviso = document.getElementById('modalAviso');
    const modalAvisoTitulo = document.getElementById('modalAvisoTitulo');
    const modalAvisoMensagem = document.getElementById('modalAvisoMensagem');
    const modalAvisoBotoes = document.getElementById('modalAvisoBotoes');

    if (modalAvisoTitulo) modalAvisoTitulo.textContent = titulo;
    if (modalAvisoMensagem) modalAvisoMensagem.innerHTML = mensagem;

    // Resetar botões para o padrão (apenas "Entendido")
    if (modalAvisoBotoes) {
        modalAvisoBotoes.innerHTML = '<button id="btnEntendidoAviso" class="btn-entendido-aviso">Entendido</button>';

        // Adicionar listener ao botão
        const btnEntendido = document.getElementById('btnEntendidoAviso');
        if (btnEntendido) {
            btnEntendido.addEventListener('click', fecharModalAviso);
        }
    }

    if (modalAviso) modalAviso.style.display = 'flex';
}

function fecharModalAviso() {
    const modalAviso = document.getElementById('modalAviso');
    if (modalAviso) modalAviso.style.display = 'none';
}

// Função para exibir modal de chamada duplicada com opções de editar ou voltar
function exibirModalChamadaDuplicada(titulo, mensagem, chamadaId, salaSelecionada, mesSelecionado, diaSelecionado) {
    const modalAviso = document.getElementById('modalAviso');
    const modalAvisoTitulo = document.getElementById('modalAvisoTitulo');
    const modalAvisoMensagem = document.getElementById('modalAvisoMensagem');
    const modalAvisoBotoes = document.getElementById('modalAvisoBotoes');

    // Armazenar dados da chamada duplicada
    chamadaDuplicadaParaEditar = {
        id: chamadaId,
        sala: salaSelecionada,
        mes: mesSelecionado,
        dia: diaSelecionado
    };

    if (modalAvisoTitulo) modalAvisoTitulo.textContent = titulo;
    if (modalAvisoMensagem) modalAvisoMensagem.innerHTML = mensagem;

    // Substituir botões por "Voltar" e "Sim, editar"
    if (modalAvisoBotoes) {
        modalAvisoBotoes.innerHTML = `
            <button id="btnVoltarChamadaDuplicada" class="btn-voltar-chamada-duplicada">Voltar</button>
            <button id="btnSimEditarChamadaDuplicada" class="btn-sim-editar-chamada-duplicada">Sim, editar</button>
        `;

        // Listener para botão Voltar
        const btnVoltar = document.getElementById('btnVoltarChamadaDuplicada');
        if (btnVoltar) {
            btnVoltar.addEventListener('click', () => {
                fecharModalAviso();
                chamadaDuplicadaParaEditar = null;
            });
        }

        // Listener para botão Sim, editar
        const btnSimEditar = document.getElementById('btnSimEditarChamadaDuplicada');
        if (btnSimEditar) {
            btnSimEditar.addEventListener('click', () => {
                fecharModalAviso();
                editarChamadaDuplicada(chamadaId);
            });
        }
    }

    if (modalAviso) modalAviso.style.display = 'flex';
}

// Funções para o modal de confirmação de edição
function exibirModalConfirmacaoEdicao(titulo, mensagem) {
    const modalConfirmacao = document.getElementById('modalConfirmacaoEdicao');
    const modalTitulo = document.getElementById('modalConfirmacaoEdicaoTitulo');
    const modalMensagem = document.getElementById('modalConfirmacaoEdicaoMensagem');

    if (modalTitulo) modalTitulo.textContent = titulo;
    if (modalMensagem) modalMensagem.textContent = mensagem;
    if (modalConfirmacao) modalConfirmacao.style.display = 'flex';
}

function fecharModalConfirmacaoEdicao() {
    const modalConfirmacao = document.getElementById('modalConfirmacaoEdicao');
    if (modalConfirmacao) modalConfirmacao.style.display = 'none';
}

// Listeners para os botões do modal de confirmação de edição
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const btnConfirmarEdicao = document.getElementById('btnConfirmarEdicao');

if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', () => {
        fecharModalConfirmacaoEdicao();
        // Resetar estado de edição
        chamadaEmEdicao = null;
        chamadaEmEdicaoVeioDoSupabase = false;
        chamadaSupabaseEmEdicao = null;
    });
}

if (btnConfirmarEdicao) {
    btnConfirmarEdicao.addEventListener('click', () => {
        // Este evento será disparado quando o usuário confirmar a edição
        // Será tratado no contexto específico onde o modal é exibido
    });
}

// Fechar modal de confirmação ao clicar fora dele
const modalConfirmacao = document.getElementById('modalConfirmacaoEdicao');
if (modalConfirmacao) {
    modalConfirmacao.addEventListener('click', (e) => {
        if (e.target === modalConfirmacao || e.target.classList.contains('modal-aviso-overlay')) {
            fecharModalConfirmacaoEdicao();
        }
    });
}

// Listener para o botão do modal de aviso (listeners dinâmicos serão adicionados nas funções exibirModalAviso/exibirModalChamadaDuplicada)

// Fechar modal de aviso ao clicar fora dele
const modalAviso = document.getElementById('modalAviso');
if (modalAviso) {
    modalAviso.addEventListener('click', (e) => {
        if (e.target === modalAviso || e.target.classList.contains('modal-aviso-overlay')) {
            fecharModalAviso();
        }
    });
}

// ========== FUNCIONALIDADES DO MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ==========
// Variável para armazenar o ID da chamada sendo excluída
let chamadaEmExclusao = null;

// Funções para o modal de confirmação de exclusão
function exibirModalConfirmacaoExclusao(chamadaId) {
    const modalExclusao = document.getElementById('modalConfirmacaoExclusao');
    const modalTitulo = document.getElementById('modalConfirmacaoExclusaoTitulo');
    const modalMensagem = document.getElementById('modalConfirmacaoExclusaoMensagem');

    if (modalTitulo) modalTitulo.textContent = 'Remover Chamada?';
    if (modalMensagem) modalMensagem.textContent = 'Tem certeza que deseja remover esta chamada? Esta ação não pode ser desfeita.';

    chamadaEmExclusao = chamadaId;

    if (modalExclusao) modalExclusao.style.display = 'flex';
}

function fecharModalConfirmacaoExclusao() {
    const modalExclusao = document.getElementById('modalConfirmacaoExclusao');
    if (modalExclusao) modalExclusao.style.display = 'none';
    chamadaEmExclusao = null;
}

// Listeners para os botões do modal de confirmação de exclusão
const btnCancelarExclusao = document.getElementById('btnCancelarExclusao');
const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');

if (btnCancelarExclusao) {
    btnCancelarExclusao.addEventListener('click', () => {
        fecharModalConfirmacaoExclusao();
    });
}

if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener('click', () => {
        if (chamadaEmExclusao !== null) {
            removerChamada(chamadaEmExclusao);
            fecharModalConfirmacaoExclusao();
        }
    });
}

// Fechar modal de confirmação de exclusão ao clicar fora dele
const modalExclusao = document.getElementById('modalConfirmacaoExclusao');
if (modalExclusao) {
    modalExclusao.addEventListener('click', (e) => {
        if (e.target === modalExclusao || e.target.classList.contains('modal-aviso-overlay')) {
            fecharModalConfirmacaoExclusao();
        }
    });
}

function inicializarBotaoIniciarRegistro() {
    const btnIniciar = document.getElementById('btnIniciarRegistro');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const modal = document.getElementById('modalChamada');
    const listaChamada = document.getElementById('listaChamada');

    if (!btnIniciar || !modal) return;

    // Event listener para o botão "Iniciar Registro"
    btnIniciar.addEventListener('click', async () => {
        const salaSelecionada = document.getElementById('salaDropdownValue').value;
        const mesSelecionado = document.getElementById('mesValue').value;
        const diaSelecionado = document.getElementById('diaValue').value;

        // Validar se todos os campos foram preenchidos
        if (!salaSelecionada) {
            exibirModalAviso('Campo Obrigatório', 'Por favor, selecione uma sala para continuar.');
            return;
        }

        if (!mesSelecionado) {
            exibirModalAviso('Campo Obrigatório', 'Por favor, selecione um mês para continuar.');
            return;
        }

        if (!diaSelecionado) {
            exibirModalAviso('Campo Obrigatório', 'Por favor, selecione um dia para continuar.');
            return;
        }

        try {
            // Mostrar loader
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.innerHTML = `
                <img src="./assets/imagens/logos/sabae.png" alt="" style="width: 150px;">
                <div class="spinner"></div>
                <p>Verificando chamadas existentes...</p>
            `;
            document.body.appendChild(loader);

            // ========== NOVA LÓGICA: Verificar se existe chamada no Supabase ==========
            console.log(`🔍 Verificando se existe chamada no Supabase para ${salaSelecionada} - ${diaSelecionado}/${obterNumeroMes(mesSelecionado)}`);

            const resultadoChamadaSupabase = await buscarChamadaSupabaseParaEditar(
                salaSelecionada,
                parseInt(diaSelecionado),
                mesSelecionado
            );

            // Se uma chamada foi encontrada no Supabase, carregar para edição
            if (resultadoChamadaSupabase.prontaParaEditar && resultadoChamadaSupabase.chamada) {
                console.log('✅ Chamada encontrada no Supabase! Carregando para edição...');

                const chamadaSupabase = resultadoChamadaSupabase.chamada;

                // ========== NÃO adicionar ao sessionStorage de chamadasSalvas ==========
                // Armazenar temporariamente em variável global para edição
                chamadaSupabaseEmEdicao = chamadaSupabase;

                // Marcar como em edição
                chamadaEmEdicao = chamadaSupabase.id;
                chamadaEmEdicaoVeioDoSupabase = true; // Flag para indicar que veio do Supabase

                console.log('📝 Chamada do Supabase carregada para EDIÇÃO (será enviada direto ao Supabase)');

                // Buscar alunos completos da sala para poder exibir todos com sua presença
                const resultado = obterAlunosTurmaDaSessionStorage(salaSelecionada);

                if (!resultado.sucesso || !resultado.alunos || resultado.alunos.length === 0) {
                    loader.remove();
                    exibirModalAviso('Nenhum Aluno Encontrado', 'Nenhum aluno foi encontrado para a sala selecionada.');
                    return;
                }

                // Remover loader
                loader.remove();

                // Popular modal com dados da chamada existente
                const modalTitulo = document.getElementById('modalChamadaTitulo');
                modalTitulo.textContent = `Editar Chamada - ${salaSelecionada}`;

                populaListaChamadaComDados(resultado.alunos, chamadaSupabase);

                // Exibir modal de confirmação de edição
                exibirModalConfirmacaoEdicao(
                    'Chamada Existente',
                    `Esta chamada já foi registrada em ${diaSelecionado}/${obterNumeroMes(mesSelecionado)} e está salva no banco de dados. Você deseja editá-la?`
                );

                // Aguardar usuário escolher Cancelar ou Sim, editar
                const btnConfirmarEdicaoTemp = document.getElementById('btnConfirmarEdicao');
                if (btnConfirmarEdicaoTemp) {
                    // Usar uma função nomeada para poder remover o listener depois
                    const handleConfirmarEdicao = function () {
                        // Fechar modal de confirmação
                        fecharModalConfirmacaoEdicao();

                        // Exibir modal de edição
                        modal.style.display = 'flex';

                        const modalBody = document.querySelector('.modal-chamada-body');
                        if (modalBody) modalBody.scrollTop = 0;

                        // Adicionar classe ao modal header para indicar modo edição
                        adicionarModoEdicaoModalHeader();

                        // Remover listener após uso
                        btnConfirmarEdicaoTemp.removeEventListener('click', handleConfirmarEdicao);
                    };

                    btnConfirmarEdicaoTemp.addEventListener('click', handleConfirmarEdicao);
                }

                return;
            }

            // ========== Se não encontrou no Supabase, criar novo registro ==========
            console.log('📝 Nenhuma chamada existente. Criando novo registro...');

            // Verificar se já existe uma chamada para esta sala neste dia no sessionStorage
            if (verificarChamadaDuplicada(salaSelecionada, mesSelecionado, diaSelecionado)) {
                loader.remove();

                // Encontrar o ID da chamada duplicada
                const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');
                const chamadaDuplicada = chamadasSalvas.find(c =>
                    c.sala === salaSelecionada &&
                    c.mes === mesSelecionado &&
                    String(c.dia) === String(diaSelecionado)
                );

                const chamadaId = chamadaDuplicada ? chamadaDuplicada.id : null;

                exibirModalChamadaDuplicada(
                    'Chamada Duplicada',
                    `Você já lançou localmente uma chamada para o "${salaSelecionada}" para ${diaSelecionado}/${obterNumeroMes(mesSelecionado)} e que ainda não foi enviada ao banco de dados. Não é permitido fazer duas chamadas para a mesma sala no mesmo dia. <span style="font-weight: bold;">Deseja editar a chamada existente?</span>`,
                    chamadaId,
                    salaSelecionada,
                    mesSelecionado,
                    diaSelecionado
                );
                return;
            }

            // Atualizar loader
            loader.querySelector('p').textContent = 'Carregando alunos da sala...';

            // Buscar alunos da sala selecionada a partir do sessionStorage
            console.log(`Buscando alunos da sala: ${salaSelecionada}`);
            const resultado = obterAlunosTurmaDaSessionStorage(salaSelecionada);

            // Remover loader
            loader.remove();

            if (!resultado.sucesso || !resultado.alunos || resultado.alunos.length === 0) {
                exibirModalAviso('Nenhum Aluno Encontrado', 'Nenhum aluno foi encontrado para a sala selecionada.');
                return;
            }

            // Popular a lista de chamada no modal
            populaListaChamada(resultado.alunos, salaSelecionada, mesSelecionado, diaSelecionado);

            // Resetar estado de edição se houver
            if (chamadaEmEdicao) {
                chamadaEmEdicao = null;
                chamadaEmEdicaoVeioDoSupabase = false; // Resetar flag
                const modalTitulo = document.getElementById('modalChamadaTitulo');
                modalTitulo.textContent = 'Registrar Chamada';
            }

            // Exibir modal
            modal.style.display = 'flex';

            // CORREÇÃO DO SCROLL: Adicione isto aqui
            const modalBody = document.querySelector('.modal-chamada-body');
            if (modalBody) modalBody.scrollTop = 0;

        } catch (erro) {
            console.error('Erro ao buscar alunos:', erro);
            exibirModalAviso('Erro ao Buscar Alunos', 'Ocorreu um erro ao buscar os alunos. Tente novamente.');
            // Remover loader em caso de erro
            const loader = document.querySelector('.loader-container');
            if (loader) loader.remove();
        }
    });

    // Event listener para fechar o modal
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', () => {
            // Simplesmente fechar o modal sem salvar
            modal.style.display = 'none';
            removerModoEdicaoModalHeader();
            chamadaEmEdicao = null;
            chamadaEmEdicaoVeioDoSupabase = false;
            chamadaSupabaseEmEdicao = null;
        });
    }

    // Fechar modal ao clicar fora dele
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Simplesmente fechar o modal sem salvar
            modal.style.display = 'none';
            removerModoEdicaoModalHeader();
            chamadaEmEdicao = null;
            chamadaEmEdicaoVeioDoSupabase = false;
            chamadaSupabaseEmEdicao = null;
        }
    });
}

/**
 * Popula a lista de chamada com os alunos da turma selecionada
 * @param {Array} alunos - Lista de alunos
 * @param {string} sala - Nome da sala
 * @param {string} mes - M\u00eas selecionado
 * @param {string} dia - Dia selecionado
 */
function populaListaChamada(alunos, sala, mes, dia) {
    const listaChamada = document.getElementById('listaChamada');
    const modalTitulo = document.getElementById('modalChamadaTitulo');
    const modalQuantidade = document.getElementById('modalChamadaQuantidade');
    const modalData = document.getElementById('modalChamadaData');

    // Atualizar título do modal
    modalTitulo.textContent = `Registrar Chamada - ${sala}`;

    // Atualizar data da chamada
    const diaPadronizado = String(dia).padStart(2, '0');
    const mesNumero = obterNumeroMes(mes);
    modalData.textContent = `Dia/Mês: ${diaPadronizado}/${mesNumero}`;

    // Atualizar quantidade de alunos
    modalQuantidade.textContent = `Total de alunos: ${alunos.length}`;

    // Limpar lista anterior
    listaChamada.innerHTML = '';

    // Ordenar alunos alfabeticamente para exibição (mantém a ordem original intacta para os dados)
    const alunosOrdenados = [...alunos].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
    );

    // Criar item para cada aluno
    alunosOrdenados.forEach(aluno => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-chamada';
        itemDiv.dataset.alunoId = aluno.mat;

        // Informa\u00e7\u00f5es do aluno
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-chamada-info';
        infoDiv.innerHTML = `
            <div class="item-chamada-nome">${aluno.nome}</div>
            <div class="item-chamada-matricula">Mat\u00edcula: ${aluno.mat}</div>
        `;

        // Op\u00e7\u00f5es de presença
        const opcoesDiv = document.createElement('div');
        opcoesDiv.className = 'item-chamada-opcoes';

        const opcoes = [
            { label: 'P', classe: 'presenca', valor: 'P' },
            { label: 'FNJ', classe: 'falta-nj', valor: 'FNJ' },
            { label: 'FJ', classe: 'falta-j', valor: 'FJ' }
        ];

        opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.className = `btn-opcao ${opcao.classe}`;
            btn.textContent = opcao.label;
            btn.dataset.valor = opcao.valor;

            // Marcar 'P' como padrão
            if (opcao.valor === 'P') {
                btn.classList.add('selecionado');
                itemDiv.dataset.presenca = 'P';
            }

            btn.addEventListener('click', () => {
                // Se o botão já está selecionado, desmarcar
                if (btn.classList.contains('selecionado')) {
                    btn.classList.remove('selecionado');
                    itemDiv.dataset.presenca = '';
                } else {
                    // Se não está selecionado, remover de todos e marcar este
                    itemDiv.querySelectorAll('.btn-opcao').forEach(b => {
                        b.classList.remove('selecionado');
                    });

                    btn.classList.add('selecionado');
                    itemDiv.dataset.presenca = opcao.valor;
                }
            });

            opcoesDiv.appendChild(btn);
        });

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(opcoesDiv);
        listaChamada.appendChild(itemDiv);
    });
}

/**
 * Verifica se já existe uma chamada para a mesma sala no mesmo dia
 * @param {string} sala - Nome da sala
 * @param {string} mes - Nome do mês
 * @param {string|number} dia - Dia do mês
 * @returns {boolean} true se existe duplicada, false caso contrário
 */
function verificarChamadaDuplicada(sala, mes, dia) {
    const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

    // Procurar por uma chamada com a mesma sala, mês e dia
    return chamadasSalvas.some(chamada =>
        chamada.sala === sala &&
        chamada.mes === mes &&
        String(chamada.dia) === String(dia)
    );
}

/**
 * Salva a chamada atual em sessionStorage (versão automática para edição)
 */
function salvarChamadaAuto() {
    const listaChamada = document.getElementById('listaChamada');
    const modal = document.getElementById('modalChamada');
    const modalTitulo = document.getElementById('modalChamadaTitulo');

    // Validar se todos os alunos têm uma presença registrada
    const itensChamada = listaChamada.querySelectorAll('.item-chamada');
    const alunosSemPresenca = Array.from(itensChamada).filter(item => !item.dataset.presenca);

    if (alunosSemPresenca.length > 0) {
        alert(`⚠️ ${alunosSemPresenca.length} aluno(s) não tem presença registrada. Por favor, selecione uma opção para todos.`);
        return;
    }

    // Recuperar chamadas existentes
    let chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');
    const chamadaOriginal = chamadasSalvas.find(c => c.id === chamadaEmEdicao);

    if (!chamadaOriginal) {
        alert('Chamada original não encontrada');
        return;
    }

    // Manter dados originais (sala, mês, dia, data_hora_registrada)
    // Apenas atualizar presença dos alunos
    let chamada = {
        id: chamadaEmEdicao,
        sala: chamadaOriginal.sala,  // MANTER SALA ORIGINAL
        mes: chamadaOriginal.mes,    // MANTER MÊS ORIGINAL
        dia: chamadaOriginal.dia,    // MANTER DIA ORIGINAL
        data_hora_registrada: chamadaOriginal.data_hora_registrada,  // MANTER DATA ORIGINAL
        alunos: []
    };

    // Coletar presença de cada aluno (ÚNICA COISA QUE MUDA)
    itensChamada.forEach(item => {
        chamada.alunos.push({
            mat: item.dataset.alunoId,
            nome: item.querySelector('.item-chamada-nome').textContent,
            presenca: item.dataset.presenca
        });
    });

    // Atualizar chamada existente
    const indice = chamadasSalvas.findIndex(c => c.id === chamadaEmEdicao);
    if (indice !== -1) {
        chamadasSalvas[indice] = chamada;
        console.log('✅ Chamada atualizada automaticamente:', chamada);
    }

    // Salvar em sessionStorage
    sessionStorage.setItem('chamadasSalvas', JSON.stringify(chamadasSalvas));

    // Resetar estado de edição
    chamadaEmEdicao = null;
    chamadaEmEdicaoVeioDoSupabase = false; // Resetar flag
    modalTitulo.textContent = 'Registrar Chamada';

    // Fechar modal
    modal.style.display = 'none';
    removerModoEdicaoModalHeader();

    // Atualizar exibição dos cards
    renderizarCartuchosChamadaaSalvas();

    // Mostrar notificação de sucesso (opcional)
    mostrarNotificacaoSucesso('Chamada atualizada com sucesso!');
}

/**
 * Salva a chamada atual (sessionStorage ou Supabase)
 * Se a chamada veio do Supabase, envia direto para Supabase
 * Se é uma chamada nova, salva em sessionStorage
 */
async function salvarChamada() {
    const listaChamada = document.getElementById('listaChamada');
    const modal = document.getElementById('modalChamada');
    const salaDropdownValue = document.getElementById('salaDropdownValue').value;
    const mesValue = document.getElementById('mesValue').value;
    const diaValue = document.getElementById('diaValue').value;

    // Validar se todos os alunos têm uma presença registrada
    const itensChamada = listaChamada.querySelectorAll('.item-chamada');
    const alunosSemPresenca = Array.from(itensChamada).filter(item => !item.dataset.presenca);

    if (alunosSemPresenca.length > 0) {
        alert(`⚠️ ${alunosSemPresenca.length} aluno(s) não tem presença registrada. Por favor, selecione uma opção para todos.`);
        return;
    }

    // Mostrar loader
    mostrarLoaderProcessamento('Salvando chamada...');

    try {
        // ========== CASO 1: Edição do Supabase - Enviar direto para Supabase ==========
        if (chamadaEmEdicaoVeioDoSupabase && chamadaSupabaseEmEdicao) {
            console.log('📤 Enviando edição direto para Supabase (não salvando em sessionStorage)...');

            // Coletar presença de cada aluno
            const alunos = [];
            itensChamada.forEach(item => {
                alunos.push({
                    mat: item.dataset.alunoId,
                    nome: item.querySelector('.item-chamada-nome').textContent,
                    presenca: item.dataset.presenca
                });
            });

            // Preparar dados para envio
            const numerMes = obterNumeroMes(chamadaSupabaseEmEdicao.mes);
            const dia = parseInt(chamadaSupabaseEmEdicao.dia);

            const registros = alunos.map(aluno => ({
                dia: dia,
                mes: numerMes,
                mat: String(aluno.mat || '').trim(),
                nome: String(aluno.nome || '').trim(),
                presenca: String(aluno.presenca || '').trim()
            }));

            // Obter credenciais da sessão
            const nomeUsuario = sessionStorage.getItem('usuario');
            const senhaUsuario = sessionStorage.getItem('usuarioSenha');

            if (!nomeUsuario || !senhaUsuario) {
                throw new Error('Sessão expirada. Credenciais não encontradas.');
            }

            // Chamar a função RPC do Supabase com a nova função que atualiza por mês
            const { data, error } = await supabaseClient.rpc('registrar_chamadas_lote_atualizar_mes', {
                p_nome_usuario: nomeUsuario,
                p_senha_usuario: senhaUsuario,
                p_chamadas_json: registros
            });

            if (error) {
                throw new Error(error.message || 'Erro ao salvar chamada');
            }

            console.log('✅ Edição enviada com sucesso para Supabase:', data);
            mostrarNotificacaoSucesso('Chamada atualizada no banco de dados com sucesso!');

            // Resetar estado de edição
            chamadaEmEdicao = null;
            chamadaEmEdicaoVeioDoSupabase = false;
            chamadaSupabaseEmEdicao = null;

            // Fechar modal
            modal.style.display = 'none';
            removerModoEdicaoModalHeader();

            // Atualizar exibição dos cards (não há cards para remover, pois não foi salvo em sessionStorage)
            renderizarCartuchosChamadaaSalvas();

            return;
        }

        // ========== CASO 2: Chamada nova ou edição de sessionStorage ==========
        // Recuperar chamadas existentes ou criar novo array
        let chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

        let chamada;

        if (chamadaEmEdicao) {
            // Modo edição: buscar chamada original e manter dados de sala/mês/dia/data
            const chamadaOriginal = chamadasSalvas.find(c => c.id === chamadaEmEdicao);
            if (!chamadaOriginal) {
                throw new Error('Chamada original não encontrada');
            }

            // Manter dados originais, alterar apenas presença dos alunos
            chamada = {
                id: chamadaEmEdicao,
                sala: chamadaOriginal.sala,  // MANTER SALA ORIGINAL
                mes: chamadaOriginal.mes,    // MANTER MÊS ORIGINAL
                dia: chamadaOriginal.dia,    // MANTER DIA ORIGINAL
                data_hora_registrada: chamadaOriginal.data_hora_registrada,  // MANTER DATA ORIGINAL
                alunos: []
            };
        } else {
            // Modo novo: criar chamada com dados do dropdown
            chamada = {
                id: Date.now(),
                sala: salaDropdownValue,
                mes: mesValue,
                dia: diaValue,
                data_hora_registrada: new Date().toLocaleString('pt-BR'),
                alunos: []
            };
        }

        // Coletar presença de cada aluno
        itensChamada.forEach(item => {
            chamada.alunos.push({
                mat: item.dataset.alunoId,
                nome: item.querySelector('.item-chamada-nome').textContent,
                presenca: item.dataset.presenca
            });
        });

        if (chamadaEmEdicao) {
            // Modo edição: atualizar chamada existente
            const indice = chamadasSalvas.findIndex(c => c.id === chamadaEmEdicao);
            if (indice !== -1) {
                chamadasSalvas[indice] = chamada;
                console.log('✅ Chamada atualizada com sucesso:', chamada);
                mostrarNotificacaoSucesso('Chamada atualizada com sucesso!');
            }
            chamadaEmEdicao = null;
            chamadaEmEdicaoVeioDoSupabase = false; // Resetar flag
        } else {
            // Modo novo: adicionar nova chamada
            chamadasSalvas.push(chamada);
            console.log('✅ Chamada salva com sucesso:', chamada);
            mostrarNotificacaoSucesso('Chamada registrada com sucesso!');
        }

        // Salvar em sessionStorage
        sessionStorage.setItem('chamadasSalvas', JSON.stringify(chamadasSalvas));

        // Fechar modal
        modal.style.display = 'none';
        removerModoEdicaoModalHeader();

        // Atualizar exibição dos cards
        renderizarCartuchosChamadaaSalvas();

    } catch (erro) {
        console.error('❌ Erro ao salvar chamada:', erro);
        alert(`❌ Erro ao salvar: ${erro.message}`);
    } finally {
        // Esconder loader
        esconderLoaderProcessamento();
    }
}

/**
 * Renderiza os cards das chamadas salvas
 */
function renderizarCartuchosChamadaaSalvas() {
    const container = document.getElementById('chamadassalvasContainer');
    const listaChamadas = document.getElementById('listaChamadaaSalvas');

    // Se os elementos não existem, sair (página index.html não tem esses elementos)
    if (!container || !listaChamadas) {
        return;
    }

    // Recuperar chamadas salvas e fazer uma cópia profunda para evitar ligações acidentais
    const chamadasSalvasRaw = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');
    const chamadasSalvas = JSON.parse(JSON.stringify(chamadasSalvasRaw)); // Cópia profunda isolada

    // Se não houver chamadas, esconder container
    if (chamadasSalvas.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Mostrar container
    container.style.display = 'block';

    // Limpar lista anterior
    listaChamadas.innerHTML = '';

    // Criar card para cada chamada
    chamadasSalvas.forEach(chamada => {
        const card = document.createElement('div');
        card.className = 'card-chamada-salva';
        card.dataset.chamadaId = chamada.id;

        // Header do card
        const headerDiv = document.createElement('div');
        headerDiv.className = 'card-chamada-header';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'card-chamada-info';

        const salaDiv = document.createElement('div');
        salaDiv.className = 'card-chamada-sala';
        salaDiv.textContent = chamada.sala;

        const dataDiv = document.createElement('div');
        dataDiv.className = 'card-chamada-data';
        dataDiv.textContent = `${chamada.dia}/${obterNumeroMes(chamada.mes)}`;

        const horaDiv = document.createElement('div');
        horaDiv.className = 'card-chamada-hora';
        horaDiv.textContent = `Registrada em: ${chamada.data_hora_registrada}`;

        infoDiv.appendChild(salaDiv);
        infoDiv.appendChild(dataDiv);
        infoDiv.appendChild(horaDiv);

        // Botões de ação
        const acoesDiv = document.createElement('div');
        acoesDiv.className = 'card-chamada-acoes';

        // Botão editar (para futura implementação)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-card-acao btn-card-editar';
        btnEditar.innerHTML = '<i class="ri-edit-line"></i>';
        btnEditar.title = 'Editar chamada';
        btnEditar.addEventListener('click', () => {
            editarChamada(chamada.id);
        });

        // Botão remover
        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-card-acao btn-card-remover';
        btnRemover.innerHTML = '<i class="ri-delete-bin-line"></i>';
        btnRemover.title = 'Remover chamada';
        btnRemover.addEventListener('click', () => {
            exibirModalConfirmacaoExclusao(chamada.id);
        });

        acoesDiv.appendChild(btnEditar);
        acoesDiv.appendChild(btnRemover);

        headerDiv.appendChild(infoDiv);
        headerDiv.appendChild(acoesDiv);

        // Lista de alunos
        const alunosDiv = document.createElement('div');
        alunosDiv.className = 'card-chamada-alunos';

        const alunosTituloDiv = document.createElement('div');
        alunosTituloDiv.className = 'card-chamada-alunos-titulo';
        alunosTituloDiv.innerHTML = `<i class="ri-user-line"></i> ${chamada.alunos.length} alunos`;

        const alunosListaDiv = document.createElement('div');
        alunosListaDiv.className = 'card-chamada-alunos-lista';

        // Contar presenças
        const contadores = {
            'P': 0,
            'FNJ': 0,
            'FJ': 0
        };

        chamada.alunos.forEach(aluno => {
            contadores[aluno.presenca]++;
        });

        // Mostrar resumo de presenças
        const resumo = [];
        if (contadores['P'] > 0) resumo.push(`${contadores['P']} Presentes`);
        if (contadores['FNJ'] > 0) resumo.push(`${contadores['FNJ']} Faltas (NJ)`);
        if (contadores['FJ'] > 0) resumo.push(`${contadores['FJ']} Faltas (J)`);

        resumo.forEach(texto => {
            const resumoSpan = document.createElement('div');
            resumoSpan.style.fontSize = '12px';
            resumoSpan.style.color = '#666';
            resumoSpan.style.marginBottom = '4px';
            resumoSpan.textContent = `• ${texto}`;
            alunosListaDiv.appendChild(resumoSpan);
        });

        alunosDiv.appendChild(alunosTituloDiv);
        alunosDiv.appendChild(alunosListaDiv);

        card.appendChild(headerDiv);
        card.appendChild(alunosDiv);

        listaChamadas.appendChild(card);
    });
}

/**
 * Remove uma chamada
 * @param {number} chamadaId - ID da chamada a remover
 */
function removerChamada(chamadaId) {
    let chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

    // Filtrar a chamada a ser removida
    chamadasSalvas = chamadasSalvas.filter(c => c.id !== chamadaId);

    // Salvar de volta em sessionStorage
    sessionStorage.setItem('chamadasSalvas', JSON.stringify(chamadasSalvas));

    console.log('✅ Chamada removida com sucesso. CODX:', chamadaId);

    // Atualizar exibição dos cards
    renderizarCartuchosChamadaaSalvas();

    mostrarNotificacaoSucesso('✅ Chamada removida com sucesso. CODX: ' + chamadaId);
}

/**
 * Edita uma chamada aberta no modal
 * @param {number} chamadaId - ID da chamada a editar
 */
function editarChamada(chamadaId) {
    // Recuperar chamadas salvas
    const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');
    const chamada = chamadasSalvas.find(c => c.id === chamadaId);

    if (!chamada) {
        alert('Chamada não encontrada');
        return;
    }

    // Marcar como em edição
    chamadaEmEdicao = chamadaId;
    chamadaEmEdicaoVeioDoSupabase = false; // Esta é uma chamada do sessionStorage, não do Supabase

    // Atualizar título do modal
    const modalTitulo = document.getElementById('modalChamadaTitulo');
    modalTitulo.textContent = `Editar Chamada - ${chamada.sala}`;

    // Recuperar alunos da sala a partir do sessionStorage para popular a lista
    const resultado = obterAlunosTurmaDaSessionStorage(chamada.sala);

    // Se bem-sucedido, continuar com a edição
    if (resultado.sucesso && resultado.alunos) {
        // Usar a função populaListaChamada, mas com os dados da chamada salva
        populaListaChamadaComDados(resultado.alunos, chamada);

        // Abrir modal
        const modal = document.getElementById('modalChamada');
        modal.style.display = 'flex';

        // CORREÇÃO DO SCROLL: Adicione isto aqui
        const modalBody = document.querySelector('.modal-chamada-body');
        if (modalBody) modalBody.scrollTop = 0;
    } else {
        console.error('Erro ao recuperar alunos:', resultado.mensagem);
        alert('Erro ao carregar alunos para edição');
        chamadaEmEdicao = null;
    }
}

/**
 * Edita uma chamada duplicada (chamada quando o usuário clica em "Sim, editar" no modal)
 * @param {number} chamadaId - ID da chamada a editar
 */
function editarChamadaDuplicada(chamadaId) {
    // Recuperar chamadas salvas
    const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');
    const chamada = chamadasSalvas.find(c => c.id === chamadaId);

    if (!chamada) {
        alert('Chamada não encontrada');
        return;
    }

    // Marcar como em edição
    chamadaEmEdicao = chamadaId;
    chamadaEmEdicaoVeioDoSupabase = false; // Esta é uma chamada do sessionStorage, não do Supabase

    // Atualizar título do modal
    const modalTitulo = document.getElementById('modalChamadaTitulo');
    modalTitulo.textContent = `Editar Chamada - ${chamada.sala}`;

    // Recuperar alunos da sala a partir do sessionStorage para popular a lista
    const resultado = obterAlunosTurmaDaSessionStorage(chamada.sala);

    // Se bem-sucedido, continuar com a edição
    if (resultado.sucesso && resultado.alunos) {
        // Usar a função populaListaChamada, mas com os dados da chamada salva
        populaListaChamadaComDados(resultado.alunos, chamada);

        // Abrir modal
        const modal = document.getElementById('modalChamada');
        modal.style.display = 'flex';
        // CORREÇÃO DO SCROLL: Adicione isto aqui
        const modalBody = document.querySelector('.modal-chamada-body');
        if (modalBody) modalBody.scrollTop = 0;
        // Adicionar classe ao modal header para indicar modo edição
        adicionarModoEdicaoModalHeader();
    } else {
        console.error('Erro ao recuperar alunos:', resultado.mensagem);
        alert('Erro ao carregar alunos para edição');
        chamadaEmEdicao = null;
    }
}

/**
 * Seleciona um item em um dropdown
 * @param {string} dropdownId - ID do dropdown
 * @param {string} valor - Valor a selecionar
 * @param {string} inputId - ID do input hidden para armazenar o valor
 */
function selecionarNoDropdown(dropdownId, valor, inputId) {
    const dropdown = document.getElementById(dropdownId);
    const menu = dropdown.querySelector('.dropdown-menu');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const label = dropdown.querySelector('.dropdown-label');
    const input = document.getElementById(inputId);

    if (!menu || !toggle || !label || !input) return;

    // Encontrar e clicar no item correspondente
    const items = menu.querySelectorAll('.dropdown-item:not(.loading):not(.empty):not(.erro)');

    items.forEach(item => {
        if (item.textContent === valor || item.dataset.value === valor) {
            // Remover seleção anterior
            menu.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.remove('selected');
            });

            // Adicionar seleção ao item encontrado
            item.classList.add('selected');

            // Atualizar label
            label.textContent = valor;

            // Atualizar input hidden
            input.value = valor;

            // Se for o dropdown de mês, atualizar os dias disponíveis
            if (dropdownId === 'mesDropdown') {
                const mesSelecionado = Array.from(items).findIndex(
                    i => i.textContent === valor
                );
                if (mesSelecionado !== -1) {
                    atualizarDropdownDias(mesSelecionado);
                }
            }
        }

        // ========== BOTÃO ENVIAR PARA O BANCO ==========
        // Funcionalidade temporária - será implementada com Supabase em breve
        document.addEventListener('DOMContentLoaded', () => {
            const btnEnviarParaBanco = document.getElementById('btnEnviarParaBanco');
            if (btnEnviarParaBanco) {
                btnEnviarParaBanco.addEventListener('click', () => {
                    alert('⚠️ Esta funcionalidade será implementada em breve usando Supabase.\n\nAs chamadas estão salvas e serão enviadas em uma próxima atualização.');
                });
            }
        });
    });
}

/**
 * Popula a lista de chamada com dados pré-preenchidos para edição
 * @param {Array} alunos - Lista de alunos
 * @param {Object} chamadaSalva - Dados da chamada salva
 */
function populaListaChamadaComDados(alunos, chamadaSalva) {
    const listaChamada = document.getElementById('listaChamada');
    const modalQuantidade = document.getElementById('modalChamadaQuantidade');
    const modalData = document.getElementById('modalChamadaData');

    // Atualizar data da chamada
    const diaPadronizado = String(chamadaSalva.dia).padStart(2, '0');
    const mesNumero = obterNumeroMes(chamadaSalva.mes);
    modalData.textContent = `Dia/Mês: ${diaPadronizado}/${mesNumero}`;

    // Atualizar quantidade de alunos
    modalQuantidade.textContent = `Total de alunos: ${alunos.length}`;

    // Limpar lista anterior
    listaChamada.innerHTML = '';

    // Ordenar alunos alfabeticamente
    const alunosOrdenados = [...alunos].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
    );

    // Criar mapa de presenças da chamada salva para acesso rápido
    const presenças = {};
    chamadaSalva.alunos.forEach(aluno => {
        presenças[aluno.mat] = aluno.presenca;
    });

    // Criar item para cada aluno
    alunosOrdenados.forEach(aluno => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-chamada';
        itemDiv.dataset.alunoId = aluno.mat;

        // Informações do aluno
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-chamada-info';
        infoDiv.innerHTML = `
            <div class="item-chamada-nome">${aluno.nome}</div>
            <div class="item-chamada-matricula">Matrícula: ${aluno.mat}</div>
        `;

        // Opções de presença
        const opcoesDiv = document.createElement('div');
        opcoesDiv.className = 'item-chamada-opcoes';

        const opcoes = [
            { label: 'P', classe: 'presenca', valor: 'P' },
            { label: 'FNJ', classe: 'falta-nj', valor: 'FNJ' },
            { label: 'FJ', classe: 'falta-j', valor: 'FJ' }
        ];

        opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.className = `btn-opcao ${opcao.classe}`;
            btn.textContent = opcao.label;
            btn.dataset.valor = opcao.valor;

            // Se este aluno tinha uma presença registrada, marcar o botão
            if (presenças[aluno.mat] === opcao.valor) {
                btn.classList.add('selecionado');
                itemDiv.dataset.presenca = opcao.valor;
            }

            btn.addEventListener('click', () => {
                // Se o botão já está selecionado, desmarcar
                if (btn.classList.contains('selecionado')) {
                    btn.classList.remove('selecionado');
                    itemDiv.dataset.presenca = '';
                } else {
                    // Se não está selecionado, remover de todos e marcar este
                    itemDiv.querySelectorAll('.btn-opcao').forEach(b => {
                        b.classList.remove('selecionado');
                    });

                    btn.classList.add('selecionado');
                    itemDiv.dataset.presenca = opcao.valor;
                }
            });

            opcoesDiv.appendChild(btn);
        });

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(opcoesDiv);
        listaChamada.appendChild(itemDiv);
    });
}

/**
 * Converte nome do mês em número
 * @param {string} mes - Nome do mês
 * @returns {string} Número do mês com zero à esquerda
 */
function obterNumeroMes(mes) {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const numero = meses.indexOf(mes) + 1;
    return String(numero).padStart(2, '0');
}

/**
 * Mostra uma notificação de sucesso
 * @param {string} mensagem - Mensagem a exibir
 */
function mostrarNotificacaoSucesso(mensagem) {
    const modalSucesso = document.getElementById('modalSucesso');
    if (!modalSucesso) return;

    // Atualizar mensagem do modal
    const titleElement = modalSucesso.querySelector('h2');
    const messageElement = modalSucesso.querySelector('p');

    if (titleElement) {
        titleElement.textContent = 'Sucesso!';
    }
    if (messageElement) {
        messageElement.textContent = mensagem;
    }

    // Mostrar modal
    modalSucesso.style.display = 'flex';

    // Fechar ao clicar no botão OK
    const btnFechar = document.getElementById('btnFecharSucesso');
    if (btnFechar) {
        btnFechar.onclick = () => {
            modalSucesso.style.display = 'none';
        };
    }

    // Fechar ao clicar na overlay (opcional)
    const overlay = modalSucesso.querySelector('.modal-sucesso-overlay');
    if (overlay) {
        overlay.onclick = () => {
            modalSucesso.style.display = 'none';
        };
    }
}

// Inicializar botão Salvar Chamada
function inicializarBotaoSalvarChamada() {
    const btnSalvar = document.getElementById('btnSalvarChamada');
    if (!btnSalvar) return;

    btnSalvar.addEventListener('click', salvarChamada);
}

// Adicionar listener ao dropdown de sala para evitar que mudanças afetem os cards
function protegerCartuchosDeMudancasDropdown() {
    const salaDropdown = document.getElementById('salaDropdown');
    if (!salaDropdown) return;

    // Listener para mudanças no dropdown de sala
    salaDropdown.addEventListener('dropdownChange', (e) => {
        // Se o modal está aberto (editando), não fazer nada
        const modal = document.getElementById('modalChamada');
        if (modal && modal.style.display === 'flex') {
            return;
        }

        // Se não está em edição, apenas garantir que os dados dos cards estão atualizados
        // com os dados do sessionStorage (proteção contra bugs de binding)
        if (!chamadaEmEdicao) {
            renderizarCartuchosChamadaaSalvas();
        }
    });
}

// Executar quando a página carregar
// ========== FUNCIONALIDADES DO MODAL DE PERFIL DO USUÁRIO ==========

// Função para extrair informações do nome do usuário
// Formato esperado: funcao@codigo.escolar
function extrairInformacoesUsuario(nomeUsuario) {
    if (!nomeUsuario || typeof nomeUsuario !== 'string') {
        return {
            nomeCompleto: '',
            funcao: '',
            codigoEscolar: ''
        };
    }

    // Verificar se existe @ para separar função
    const posicaoArroba = nomeUsuario.indexOf('@');
    const posicaoPonto = nomeUsuario.lastIndexOf('.');

    let funcao = '';
    let codigoEscolar = '';

    if (posicaoArroba !== -1 && posicaoPonto !== -1 && posicaoArroba < posicaoPonto) {
        // Função é entre @ e o primeiro ponto após @
        funcao = nomeUsuario.substring(posicaoArroba + 1, posicaoPonto);
        codigoEscolar = nomeUsuario.substring(posicaoPonto + 1);
    }

    return {
        nomeCompleto: nomeUsuario.toUpperCase(),
        funcao: funcao.toUpperCase(),
        codigoEscolar: codigoEscolar.toUpperCase()
    };
}

// Função para abrir o modal de perfil
function abrirModalPerfilUsuario() {
    const nomeUsuario = sessionStorage.getItem('usuario');

    if (!nomeUsuario) {
        console.warn('⚠️ Nome do usuário não encontrado na sessão');
        return;
    }

    // Extrair informações
    const info = extrairInformacoesUsuario(nomeUsuario);

    // Preencher modal com as informações
    const perfilNomeUsuario = document.getElementById('perfilNomeUsuario');
    const perfilFuncao = document.getElementById('perfilFuncao');
    const perfilCodigoEscolar = document.getElementById('perfilCodigoEscolar');

    if (perfilNomeUsuario) {
        perfilNomeUsuario.textContent = info.nomeCompleto;
    }

    if (perfilFuncao) {
        perfilFuncao.textContent = info.funcao || '-';
    }

    if (perfilCodigoEscolar) {
        perfilCodigoEscolar.textContent = info.codigoEscolar || '-';
    }

    // Mostrar modal
    const modal = document.getElementById('modalPerfilUsuario');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Função para fechar o modal de perfil
function fecharModalPerfilUsuario() {
    const modal = document.getElementById('modalPerfilUsuario');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar event listeners do modal de perfil
function inicializarModalPerfil() {
    // Elementos que abrem o modal
    const nomeUsuarioHeader = document.getElementById('nomeUsuarioHeader');
    const userIcon = document.querySelector('.user-icon');
    const btnFecharPerfilModal = document.getElementById('btnFecharPerfilModal');
    const modalPerfilOverlay = document.querySelector('.modal-perfil-overlay');
    const modalPerfilUsuario = document.getElementById('modalPerfilUsuario');

    // Clique no nome do usuário
    if (nomeUsuarioHeader) {
        nomeUsuarioHeader.style.cursor = 'pointer';
        nomeUsuarioHeader.addEventListener('click', abrirModalPerfilUsuario);
    }

    // Clique no ícone do usuário
    if (userIcon) {
        userIcon.style.cursor = 'pointer';
        userIcon.addEventListener('click', abrirModalPerfilUsuario);
    }

    // Botão fechar modal
    if (btnFecharPerfilModal) {
        btnFecharPerfilModal.addEventListener('click', fecharModalPerfilUsuario);
    }

    // Fechar ao clicar no overlay
    if (modalPerfilOverlay) {
        modalPerfilOverlay.addEventListener('click', fecharModalPerfilUsuario);
    }

    // Fechar ao clicar fora do modal (no background)
    if (modalPerfilUsuario) {
        modalPerfilUsuario.addEventListener('click', (e) => {
            if (e.target === modalPerfilUsuario) {
                fecharModalPerfilUsuario();
            }
        });
    }

    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModalPerfilUsuario();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Apenas executar se os elementos da página chamada.html existirem
    const btnIniciarRegistro = document.getElementById('btnIniciarRegistro');
    const btnSalvarChamada = document.getElementById('btnSalvarChamada');
    const chamadassalvasContainer = document.getElementById('chamadassalvasContainer');

    if (btnIniciarRegistro && btnSalvarChamada && chamadassalvasContainer) {
        inicializarBotaoIniciarRegistro();
        inicializarBotaoSalvarChamada();
        protegerCartuchosDeMudancasDropdown();
        renderizarCartuchosChamadaaSalvas();
    }

    // Sempre inicializar modal de perfil em ambas as páginas
    inicializarModalPerfil();
});
