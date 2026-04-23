// Função para carregar e exibir o registro de atividades do Supabase
async function carregarAtividades() {
    try {
        console.log('Carregando atividades...');

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        // Validar se as credenciais existem
        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            exibirErroAtividades('Sessão expirou. Faça login novamente.');
            return;
        }

        // Chamar a função RPC do Supabase com validação de credenciais
        const { data, error } = await supabaseClient.rpc('get_atividades', {
            p_nomeusuario: nomeUsuario,
            p_senha_usuario: senhaUsuario
        });

        if (error) {
            console.error('❌ Erro ao carregar atividades:', error);
            exibirErroAtividades(error.message);
            return;
        }

        console.log('✅ Atividades carregadas:', data);
        exibirAtividades(data);

    } catch (erro) {
        console.error('❌ Erro ao conectar com servidor:', erro);
        exibirErroAtividades('Erro ao conectar com o servidor');
    }
}

// Função para exibir as atividades na interface
function exibirAtividades(atividades) {
    const atividadesList = document.getElementById('atividadesList');

    if (!atividadesList) {
        console.error('Elemento "atividadesList" não encontrado');
        return;
    }

    // Limpar lista
    atividadesList.innerHTML = '';

    if (!atividades || atividades.length === 0) {
        atividadesList.innerHTML = '<div class="atividade-item vazio"><span>Nenhuma atividade registrada</span></div>';
        return;
    }

    // Adicionar cada atividade como um item na lista
    atividades.forEach((atividade) => {
        const atividadeItem = document.createElement('div');
        atividadeItem.className = 'atividade-item';

        // Formatar a data/hora
        const dataHora = new Date(atividade.data_hora);
        const dataFormatada = dataHora.toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        atividadeItem.innerHTML = `
            <div class="atividade-usuario">${atividade.nomeusuario}</div>
            <div class="atividade-descricao">${atividade.atividade}</div>
            <div class="atividade-hora">${dataFormatada}</div>
        `;

        atividadesList.appendChild(atividadeItem);
    });
}

// Função para exibir erro
function exibirErroAtividades(mensagem) {
    const atividadesList = document.getElementById('atividadesList');

    if (atividadesList) {
        atividadesList.innerHTML = `<div class="atividade-item erro"><span>❌ ${mensagem}</span></div>`;
    }
}

// Carregar atividades quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que o Supabase já foi carregado
    setTimeout(() => {
        if (verificarAutenticacao()) {
            carregarAtividades();
            // Recarregar atividades a cada 5 segundos (opcional)
            setInterval(carregarAtividades, 5000);
        }
    }, 500);
});
