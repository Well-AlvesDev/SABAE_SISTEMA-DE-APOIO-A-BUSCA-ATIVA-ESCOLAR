-- Função SQL para validar login com SECURITY DEFINER
-- Esta função compara as credenciais do usuário com os dados na tabela 'users'
-- Retorna true se as credenciais forem corretas, false caso contrário

CREATE OR REPLACE FUNCTION validar_login(
    p_nome_usuario TEXT,
    p_senha_usuario TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_existe BOOLEAN;
BEGIN
    -- Verificar se existe um usuário com o nome fornecido e a senha correta
    SELECT EXISTS(
        SELECT 1 FROM users
        WHERE nomeUsuario = p_nome_usuario
        AND senhaUsuario = p_senha_usuario
    ) INTO v_usuario_existe;

    -- Retornar o resultado
    RETURN v_usuario_existe;
END;
$$;

-- Conceder permissão de execução para o role 'anon' (usuários não autenticados)
GRANT EXECUTE ON FUNCTION validar_login(TEXT, TEXT) TO anon;

-- Conceder permissão para o role 'authenticated' (usuários autenticados)
GRANT EXECUTE ON FUNCTION validar_login(TEXT, TEXT) TO authenticated;

-- Opcional: Se você quiser adicionar um log de tentativas de login, descomentar abaixo:
-- CREATE TABLE IF NOT EXISTS login_logs (
--     id BIGSERIAL PRIMARY KEY,
--     nome_usuario TEXT,
--     sucesso BOOLEAN,
--     data_hora TIMESTAMP DEFAULT NOW()
-- );
-- 
-- ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Usuários acessam seus próprios logs" ON login_logs
--     FOR SELECT USING (TRUE);
