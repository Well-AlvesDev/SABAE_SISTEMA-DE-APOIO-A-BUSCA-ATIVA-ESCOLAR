// Função para validar login via Supabase
async function validarLogin(usuario, senha) {
    try {
        console.log('=== INICIANDO VALIDAÇÃO DE LOGIN ===');
        console.log('Usuário recebido:', usuario);
        console.log('Senha recebida:', senha);
        console.log('Comprimento da senha:', senha.length);

        // Chamar a função RPC do Supabase
        console.log('Chamando RPC: validar_login');
        const { data, error } = await supabaseClient.rpc('validar_login', {
            p_nome_usuario: usuario,
            p_senha_usuario: senha
        });

        console.log('Resposta do Supabase:');
        console.log('- data:', data);
        console.log('- error:', error);

        if (error) {
            console.error('❌ Erro ao validar login:', error);
            console.error('Código do erro:', error.code);
            console.error('Mensagem do erro:', error.message);
            console.error('Detalhes:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao conectar com o servidor: ${error.message}`
            };
        }

        console.log('✅ RPC executado com sucesso');
        console.log('Resultado (data):', data);
        console.log('Tipo de data:', typeof data);

        // Se data retornar true, login bem-sucedido
        if (data === true) {
            console.log('✅ LOGIN SUCESSO!');

            // Armazenar a senha na sessão (será necessária para registrar atividades)
            sessionStorage.setItem('usuarioSenha', senha);

            // Registrar a atividade de login
            try {
                console.log('Registrando atividade de entrada...');
                const { data: resultadoAtividade, error: erroAtividade } = await supabaseClient.rpc('registrar_atividade', {
                    p_nomeusuario: usuario,
                    p_senha_usuario: senha,
                    p_atividade: 'Entrou no sistema'
                });

                if (erroAtividade) {
                    console.error('⚠️ Erro ao registrar atividade:', erroAtividade);
                } else {
                    console.log('✅ Atividade registrada com sucesso:', resultadoAtividade);
                }
            } catch (erroAtividade) {
                console.error('⚠️ Erro ao registrar atividade:', erroAtividade);
            }

            return {
                sucesso: true,
                mensagem: 'Login realizado com sucesso!'
            };
        } else {
            console.log('❌ LOGIN FALHOU - Credenciais incorretas');
            console.log('Data recebida não é true:', data);
            return {
                sucesso: false,
                mensagem: 'Usuário ou senha incorretos'
            };
        }

    } catch (erro) {
        console.error('❌ Erro inesperado:', erro);
        console.error('Stack trace:', erro.stack);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`
        };
    }
}
