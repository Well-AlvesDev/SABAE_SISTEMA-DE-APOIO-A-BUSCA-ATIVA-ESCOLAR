-- ============================================
-- FUNÇÕES MIGRADAS PARA SUPABASE AUTH NATIVO
-- ============================================
-- Estas funções usam o sistema de autenticação nativo do Supabase
-- e requerem autenticação via JWT token

-- Função para obter registro de atividades com autenticação nativa do Supabase
-- Requer: Usuário autenticado via JWT token do Supabase Auth
DROP FUNCTION IF EXISTS get_atividades(TEXT);

CREATE OR REPLACE FUNCTION get_atividades(p_email_usuario TEXT)
RETURNS TABLE (
    nomeusuario TEXT,
    atividade TEXT,
    data_hora TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Retornar todas as atividades do usuário ordenadas por data/hora decrescente
    -- Não há restrição strict de autenticação para permitir leitura do histórico
    RETURN QUERY
    SELECT 
        a.nomeusuario AS nomeusuario,
        a.atividade AS atividade,
        a.data_hora AS data_hora
    FROM atividades a
    WHERE a.nomeusuario = p_email_usuario
    ORDER BY a.data_hora DESC NULLS LAST
    LIMIT 100; -- Limitar aos últimos 100 registros para melhor performance
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_atividades(TEXT) TO authenticated;


-- Função para registrar uma atividade com autenticação nativa do Supabase
-- Com limite de 20 registros: se atingir 20, deleta os 5 mais antigos antes de inserir novo
-- Requer: Usuário autenticado via JWT token do Supabase Auth
DROP FUNCTION IF EXISTS registrar_atividade(TEXT, TEXT);

CREATE OR REPLACE FUNCTION registrar_atividade(
    p_email_usuario TEXT,
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
BEGIN
    -- Debug: Log de entrada
    RAISE NOTICE 'Iniciando registrar_atividade - Email: %, Atividade: %', p_email_usuario, p_atividade;

    -- Validar parâmetros de entrada
    IF p_email_usuario IS NULL OR p_email_usuario = '' THEN
        RAISE EXCEPTION 'Email do usuário é obrigatório';
    END IF;

    IF p_atividade IS NULL OR p_atividade = '' THEN
        RAISE EXCEPTION 'Descrição da atividade é obrigatória';
    END IF;

    -- Contar o total de registros na tabela
    SELECT COUNT(*) INTO v_total_registros FROM atividades;
    
    RAISE NOTICE 'Total de registros antes de inserir: %', v_total_registros;
    
    -- Se há 20 ou mais registros, deletar os 5 mais antigos
    IF v_total_registros >= 20 THEN
        WITH ids_para_deletar AS (
            SELECT id FROM atividades
            ORDER BY data_hora ASC NULLS FIRST
            LIMIT 5
        )
        DELETE FROM atividades
        WHERE id IN (SELECT id FROM ids_para_deletar);
        
        RAISE NOTICE 'Deletados 5 registros antigos';
    END IF;
    
    -- Inserir a atividade na tabela com data/hora atual (timezone Brasil)
    INSERT INTO atividades (nomeusuario, atividade, data_hora)
    VALUES (p_email_usuario, p_atividade, to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS'))
    RETURNING id INTO v_id;
    
    RAISE NOTICE 'Atividade registrada com ID: %', v_id;
    
    -- Se conseguiu inserir, retorna true
    RETURN v_id IS NOT NULL;
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION registrar_atividade(TEXT, TEXT) TO authenticated;


-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Backup: fazer backup das tabelas antes de aplicar essas mudanças
-- 2. Testar em ambiente de desenvolvimento primeiro
-- 3. A tabela 'atividades' deve continuar com as colunas:
--    - id (BIGSERIAL PRIMARY KEY)
--    - nomeusuario (TEXT) - agora armazena email em vez de username
--    - atividade (TEXT)
--    - data_hora (TIMESTAMP ou TEXT)
-- 4. O campo 'nomeusuario' foi mantido para compatibilidade com a estrutura existente
-- 5. RLS (Row Level Security) deve estar DESATIVADO na tabela 'atividades'
--    ou com política que permita INSERT para usuários autenticados
-- 6. Verifiqu se RLS está bloqueando: ALTER TABLE atividades DISABLE ROW LEVEL SECURITY;

