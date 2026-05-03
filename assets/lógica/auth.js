// ========================================
// NOVO SISTEMA DE AUTENTICAÇÃO SUPABASE
// ========================================
// Este arquivo contém funções para gerenciar autenticação
// usando o sistema nativo de Auth do Supabase

/**
 * Obtém a sessão do usuário autenticado
 * @returns {Promise<Object>} Objeto com dados da sessão ou null
 */
async function obterSessaoAtual() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    } catch (erro) {
        console.error('Erro ao obter sessão:', erro);
        return null;
    }
}

/**
 * Obtém o usuário autenticado atual
 * @returns {Promise<Object>} Objeto com dados do usuário ou null
 */
async function obterUsuarioAtual() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    } catch (erro) {
        console.error('Erro ao obter usuário:', erro);
        return null;
    }
}

/**
 * Fazer logout do usuário
 * @returns {Promise<Object>} Resultado do logout
 */
async function fazerLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
            return { sucesso: false, erro: error };
        }
        console.log('✅ Logout realizado com sucesso');
        return { sucesso: true };
    } catch (erro) {
        console.error('Erro inesperado ao fazer logout:', erro);
        return { sucesso: false, erro: erro };
    }
}

/**
 * Verifica se o usuário está autenticado
 * @returns {Promise<Boolean>} true se autenticado, false caso contrário
 */
async function estaAutenticado() {
    const sessao = await obterSessaoAtual();
    return sessao !== null;
}

/**
 * Listener para mudanças no estado de autenticação
 * Útil para sincronizar estado em toda a aplicação
 */
supabaseClient.auth.onAuthStateChange((evento, sessao) => {
    console.log('🔐 Evento de autenticação:', evento);

    if (evento === 'SIGNED_IN') {
        console.log('✅ Usuário logado:', sessao?.user?.email);
        // Pode-se disparar eventos customizados aqui se necessário
    } else if (evento === 'SIGNED_OUT') {
        console.log('❌ Usuário deslogado');
        // Limpar dados locais se necessário
        sessionStorage.clear();
    } else if (evento === 'USER_UPDATED') {
        console.log('🔄 Dados do usuário atualizados');
    }
});

// ========================================
// FUNÇÃO LEGADA (para compatibilidade)
// ========================================
// Esta função foi mantida temporariamente para compatibilidade
// com código legado durante a migração gradual
async function validarLogin(usuario, senha) {
    console.warn('⚠️ validarLogin() foi depreciada. Use a autenticação nativa do Supabase.');
    // Placeholder para manter compatibilidade
    return {
        sucesso: false,
        mensagem: 'Sistema de login atualizado. Favor recarregar a página.'
    };
}
