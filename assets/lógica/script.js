// Função para verificar se o usuário está logado
function verificarAutenticacao() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    return usuarioLogado === 'true';
}

// Variável para armazenar o ID da chamada sendo editada
let chamadaEmEdicao = null;

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
            alert('Por favor, selecione um mês');
            return;
        }

        if (!diaSelecionado) {
            alert('Por favor, selecione um dia');
            return;
        }

        // Verificar se já existe uma chamada para esta sala neste dia
        if (verificarChamadaDuplicada(salaSelecionada, mesSelecionado, diaSelecionado)) {
            alert(`⚠️ Já existe uma chamada registrada para a sala "${salaSelecionada}" em ${diaSelecionado}/${obterNumeroMes(mesSelecionado)}. Não é permitido fazer duas chamadas para a mesma sala no mesmo dia.`);
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

            // Buscar alunos da sala selecionada a partir do sessionStorage
            console.log(`Buscando alunos da sala: ${salaSelecionada}`);
            const resultado = obterAlunosTurmaDaSessionStorage(salaSelecionada);

            // Remover loader
            loader.remove();

            if (!resultado.sucesso || !resultado.alunos || resultado.alunos.length === 0) {
                alert('Nenhum aluno encontrado para a sala selecionada');
                return;
            }

            // Popular a lista de chamada no modal
            populaListaChamada(resultado.alunos, salaSelecionada, mesSelecionado, diaSelecionado);

            // Resetar estado de edição se houver
            if (chamadaEmEdicao) {
                chamadaEmEdicao = null;
                const modalTitulo = document.getElementById('modalChamadaTitulo');
                modalTitulo.textContent = 'Registrar Chamada';
            }

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
            // Se está em modo de edição, salvar automaticamente
            if (chamadaEmEdicao) {
                salvarChamadaAuto();
            } else {
                modal.style.display = 'none';
            }
        });
    }

    // Fechar modal ao clicar fora dele
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Se está em modo de edição, salvar automaticamente
            if (chamadaEmEdicao) {
                salvarChamadaAuto();
            } else {
                modal.style.display = 'none';
            }
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

    // Atualizar t\u00edtulo do modal
    modalTitulo.textContent = `Registrar Chamada - ${sala}`;

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
            matricula: item.dataset.alunoId,
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
    modalTitulo.textContent = 'Registrar Chamada';

    // Fechar modal
    modal.style.display = 'none';

    // Atualizar exibição dos cards
    renderizarCartuchosChamadaaSalvas();

    // Mostrar notificação de sucesso (opcional)
    mostrarNotificacaoSucesso('Chamada atualizada com sucesso!');
}

/**
 * Salva a chamada atual em sessionStorage
 */
function salvarChamada() {
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

    // Recuperar chamadas existentes ou criar novo array
    let chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

    let chamada;

    if (chamadaEmEdicao) {
        // Modo edição: buscar chamada original e manter dados de sala/mês/dia/data
        const chamadaOriginal = chamadasSalvas.find(c => c.id === chamadaEmEdicao);
        if (!chamadaOriginal) {
            alert('Chamada original não encontrada');
            return;
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
            matricula: item.dataset.alunoId,
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

    // Atualizar exibição dos cards
    renderizarCartuchosChamadaaSalvas();
}

/**
 * Renderiza os cards das chamadas salvas
 */
function renderizarCartuchosChamadaaSalvas() {
    const container = document.getElementById('chamadassalvasContainer');
    const listaChamadas = document.getElementById('listaChamadaaSalvas');

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
            if (confirm('Tem certeza que deseja remover esta chamada?')) {
                removerChamada(chamada.id);
            }
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

    console.log('✅ Chamada removida com sucesso');

    // Atualizar exibição dos cards
    renderizarCartuchosChamadaaSalvas();

    mostrarNotificacaoSucesso('Chamada removida!');
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
        presenças[aluno.matricula] = aluno.presenca;
    });

    // Criar item para cada aluno
    alunosOrdenados.forEach(aluno => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-chamada';
        itemDiv.dataset.alunoId = aluno.matricula;

        // Informações do aluno
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-chamada-info';
        infoDiv.innerHTML = `
            <div class="item-chamada-nome">${aluno.nome}</div>
            <div class="item-chamada-matricula">Matrícula: ${aluno.matricula}</div>
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
            if (presenças[aluno.matricula] === opcao.valor) {
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
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10004;
        animation: slideInUp 0.3s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    notificacao.innerHTML = `<i class="ri-checkbox-circle-fill"></i>${mensagem}`;
    document.body.appendChild(notificacao);

    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    }, 3000);
}

// Inicializar botão Salvar Chamada
function inicializarBotaoSalvarChamada() {
    const btnSalvar = document.getElementById('btnSalvarChamada');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarChamada);
    }
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
document.addEventListener('DOMContentLoaded', () => {
    inicializarBotaoIniciarRegistro();
    inicializarBotaoSalvarChamada();
    protegerCartuchosDeMudancasDropdown();
    renderizarCartuchosChamadaaSalvas();
});
