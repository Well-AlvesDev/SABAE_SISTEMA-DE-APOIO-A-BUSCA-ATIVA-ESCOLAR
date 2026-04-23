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
