// Função para verificar se o usuário está logado
function verificarAutenticacao() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    return usuarioLogado === 'true';
}

// Função para remover o loader
function removerLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
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

        // Carregar as salas e remover loader após o carregamento
        try {
            await carregarSalasNoDropdown('#salaDropdown');
            console.log('✓ Salas carregadas com sucesso');
        } catch (erro) {
            console.error('⚠️ Erro ao carregar salas:', erro);
        } finally {
            // Remover loader após as salas terem sido carregadas (ou após erro)
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

// ========== FUNCIONALIDADE DE RECARREGAR DADOS ==========
const btnRecarregar = document.getElementById('btnRecarregar');
if (btnRecarregar) {
    btnRecarregar.addEventListener('click', async () => {
        btnRecarregar.disabled = true;
        const loaderRecarregamento = document.getElementById('loaderRecarregamento');
        const modalSucesso = document.getElementById('modalSucesso');

        // Mostrar loader
        loaderRecarregamento.style.display = 'flex';

        try {
            console.log('🔄 Recarregando dados...');
            await recarregarDados();
            console.log('✅ Dados recarregados com sucesso');

            // Esconder loader e mostrar modal de sucesso
            loaderRecarregamento.style.display = 'none';
            modalSucesso.style.display = 'flex';

        } catch (erro) {
            console.error('❌ Erro ao recarregar dados:', erro);
            loaderRecarregamento.style.display = 'none';
            alert('❌ Erro ao recarregar dados. Tente novamente.');
        } finally {
            btnRecarregar.disabled = false;
        }
    });
}

// Fechar modal de sucesso
const btnFecharSucesso = document.getElementById('btnFecharSucesso');
if (btnFecharSucesso) {
    btnFecharSucesso.addEventListener('click', () => {
        const modalSucesso = document.getElementById('modalSucesso');
        modalSucesso.style.display = 'none';
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
function inicializarBotaoIniciarRegistro() {
    const btnIniciar = document.getElementById('btnIniciarRegistro');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const modal = document.getElementById('modalChamada');
    const listaChamada = document.getElementById('listaChamada');

    if (!btnIniciar) return;

    // Event listener para o botão "Iniciar Registro"
    btnIniciar.addEventListener('click', async () => {
        const salaSelecionada = document.getElementById('salaDropdownValue').value;
        const mesSelecionado = document.getElementById('mesValue').value;
        const diaSelecionado = document.getElementById('diaValue').value;

        // Validar se todos os campos foram preenchidos
        if (!salaSelecionada) {
            alert('Por favor, selecione uma sala');
            return;
        }

        if (!mesSelecionado) {
            alert('Por favor, selecione um m\u00eas');
            return;
        }

        if (!diaSelecionado) {
            alert('Por favor, selecione um dia');
            return;
        }

        try {
            // Mostrar loader
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.innerHTML = `
                <img src="./assets/imagens/logos/sabae.png" alt="" style="width: 150px;">
                <div class="spinner"></div>
                <p>Carregando alunos da sala...</p>
            `;
            document.body.appendChild(loader);

            // Buscar alunos da sala selecionada
            console.log(`Buscando alunos da sala: ${salaSelecionada}`);
            const resultado = await obterAlunosTurma(salaSelecionada);

            // Remover loader
            loader.remove();

            if (!resultado.sucesso || !resultado.dados || resultado.dados.length === 0) {
                alert('Nenhum aluno encontrado para a sala selecionada');
                return;
            }

            // Popular a lista de chamada no modal
            populaListaChamada(resultado.dados, salaSelecionada, mesSelecionado, diaSelecionado);

            // Exibir modal
            modal.style.display = 'flex';

        } catch (erro) {
            console.error('Erro ao buscar alunos:', erro);
            alert('Erro ao buscar alunos. Tente novamente.');
            // Remover loader em caso de erro
            const loader = document.querySelector('.loader-container');
            if (loader) loader.remove();
        }
    });

    // Event listener para fechar o modal
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Fechar modal ao clicar fora dele
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
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

    // Atualizar t\u00edtulo do modal
    modalTitulo.textContent = `Registrar Chamada - ${sala}`;

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
        itemDiv.dataset.alunoId = aluno.matricula;

        // Informa\u00e7\u00f5es do aluno
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-chamada-info';
        infoDiv.innerHTML = `
            <div class="item-chamada-nome">${aluno.nome}</div>
            <div class="item-chamada-matricula">Mat\u00edcula: ${aluno.matricula}</div>
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

// Executar quando a p\u00e1gina carregar
document.addEventListener('DOMContentLoaded', () => {
    inicializarBotaoIniciarRegistro();
});
