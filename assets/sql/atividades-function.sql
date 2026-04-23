-- Função SQL para obter registro de atividades com SECURITY DEFINER
-- Requer validação de usuário e senha - apenas usuários autenticados com credenciais válidas podem acessar
DROP FUNCTION IF EXISTS get_atividades(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_atividades(
    p_nomeusuario TEXT,
    p_senha_usuario TEXT
)
RETURNS TABLE (
    nomeusuario TEXT,
    atividade TEXT,
    data_hora TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_valido BOOLEAN;
BEGIN
    -- Validar se o usuário e senha são corretos
    SELECT EXISTS(
        SELECT 1 FROM users u
        WHERE u.nomeUsuario = p_nomeusuario
        AND u.senhaUsuario = p_senha_usuario
    ) INTO v_usuario_valido;

    -- Se o usuário não for válido, retorna tabela vazia
    IF NOT v_usuario_valido THEN
        RETURN;
    END IF;

    -- Retornar todas as atividades ordenadas por data/hora decrescente
    RETURN QUERY
    SELECT 
        a.nomeusuario AS nomeusuario,
        a.atividade AS atividade,
        a.data_hora AS data_hora
    FROM atividades a
    ORDER BY a.data_hora DESC NULLS LAST
    LIMIT 100; -- Limitar aos últimos 100 registros para melhor performance
END;
$$;

-- Conceder permissão de execução APENAS para usuários autenticados
GRANT EXECUTE ON FUNCTION get_atividades(TEXT, TEXT) TO authenticated;


-- Função para registrar uma atividade (ex: login, logout, etc)
-- Com limite de 20 registros: se atingir 20, deleta os 5 mais antigos antes de inserir novo
-- Requer validação de usuário e senha - apenas usuários autenticados podem registrar
DROP FUNCTION IF EXISTS registrar_atividade(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION registrar_atividade(
    p_nomeusuario TEXT,
    p_senha_usuario TEXT,
    p_atividade TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_total_registros INTEGER;
    v_usuario_valido BOOLEAN;
BEGIN
    -- Validar se o usuário e senha são corretos
    SELECT EXISTS(
        SELECT 1 FROM users u
        WHERE u.nomeUsuario = p_nomeusuario
        AND u.senhaUsuario = p_senha_usuario
    ) INTO v_usuario_valido;

    -- Se o usuário não for válido, retorna false
    IF NOT v_usuario_valido THEN
        RETURN FALSE;
    END IF;

    -- Contar o total de registros na tabela
    SELECT COUNT(*) INTO v_total_registros FROM atividades;
    
    -- Se há 20 ou mais registros, deletar os 5 mais antigos usando CTE
    IF v_total_registros >= 20 THEN
        WITH ids_para_deletar AS (
            SELECT id FROM atividades
            ORDER BY data_hora ASC NULLS FIRST
            LIMIT 5
        )
        DELETE FROM atividades
        WHERE id IN (SELECT id FROM ids_para_deletar);
    END IF;
    
    -- Inserir a atividade na tabela com data/hora atual formatada como TEXT (timezone Brasil)
    INSERT INTO atividades (nomeusuario, atividade, data_hora)
    VALUES (p_nomeusuario, p_atividade, to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS'))
    RETURNING id INTO v_id;
    
    -- Se conseguiu inserir, retorna true
    RETURN v_id IS NOT NULL;
END;
$$;

-- Conceder permissão de execução APENAS para usuários autenticados
GRANT EXECUTE ON FUNCTION registrar_atividade(TEXT, TEXT, TEXT) TO authenticated;


-- Nota: A tabela 'atividades' deve ter as seguintes colunas:
-- - id (BIGSERIAL PRIMARY KEY) - identificador único
-- - nomeusuario (TEXT) - nome do usuário que fez a atividade
-- - atividade (TEXT) - descrição da atividade (ex: "entrou", "saiu", "chamada realizada na sala 101")
-- - data_hora (TIMESTAMP) - data e hora da atividade
-- 
-- Exemplo de criação da tabela:
-- CREATE TABLE atividades (
--     id BIGSERIAL PRIMARY KEY,
--     nomeusuario TEXT NOT NULL,
--     atividade TEXT NOT NULL,
--     data_hora TIMESTAMP DEFAULT NOW(),
--     created_at TIMESTAMP DEFAULT NOW()
-- );
--
-- ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Ninguém pode acessar direto" ON atividades
--     FOR SELECT USING (FALSE);
