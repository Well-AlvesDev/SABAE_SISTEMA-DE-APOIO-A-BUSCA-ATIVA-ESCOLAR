-- ==========================================
-- MIGRAÇÃO: Funções SQL para Chamadas - Auth Nativo
-- Usa autenticação nativa do Supabase (email)
-- ==========================================

-- ========== FUNÇÃO 1: Registrar uma chamada simples ==========
CREATE OR REPLACE FUNCTION registrar_chamada_nativa(
    p_email_usuario TEXT,
    p_dia INTEGER,
    p_mes INTEGER,
    p_mat TEXT,
    p_nome TEXT,
    p_presenca TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_valor_novo TEXT;
    v_mat_limpo TEXT;
    v_nome_limpo TEXT;
    v_coluna_dia TEXT;
    v_coluna_quoted TEXT;
    v_atualizado INTEGER;
    v_mat_lower TEXT;
    v_nome_lower TEXT;
BEGIN
    -- Preparar valores com limpeza agressiva
    v_mat_limpo := TRIM(COALESCE(p_mat, ''));
    v_nome_limpo := TRIM(COALESCE(p_nome, ''));
    v_mat_lower := LOWER(v_mat_limpo);
    v_nome_lower := LOWER(v_nome_limpo);
    v_valor_novo := TRIM(p_presenca) || ':' || p_mes::TEXT;
    v_coluna_dia := p_dia::TEXT;
    v_coluna_quoted := quote_ident(v_coluna_dia);

    RAISE WARNING '[SABAE] Registrando para usuário: %', p_email_usuario;

    -- ESTRATÉGIA 1: Buscar por MAT (exato, case-insensitive)
    IF v_mat_limpo != '' THEN
        BEGIN
            EXECUTE 'UPDATE "SABAE-DATA" SET ' || v_coluna_quoted || ' = CASE 
                    WHEN ' || v_coluna_quoted || ' IS NULL OR ' || v_coluna_quoted || ' = '''' THEN $1
                    WHEN ' || v_coluna_quoted || ' LIKE ''%'' || $1 || ''%'' THEN ' || v_coluna_quoted || '
                    ELSE ' || v_coluna_quoted || ' || '', '' || $1
                END
                WHERE LOWER(TRIM("MAT")) = $2'
                USING v_valor_novo, v_mat_lower;
            
            GET DIAGNOSTICS v_atualizado = ROW_COUNT;
            
            IF v_atualizado > 0 THEN
                RAISE WARNING '[SABAE] ✓ Aluno encontrado por MAT: %', v_mat_limpo;
                RETURN TRUE;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SABAE] Erro ao buscar por MAT: %', SQLERRM;
        END;
    END IF;

    -- ESTRATÉGIA 2: Buscar por NOME (exato, case-insensitive)
    IF v_nome_limpo != '' THEN
        BEGIN
            EXECUTE 'UPDATE "SABAE-DATA" SET ' || v_coluna_quoted || ' = CASE 
                    WHEN ' || v_coluna_quoted || ' IS NULL OR ' || v_coluna_quoted || ' = '''' THEN $1
                    WHEN ' || v_coluna_quoted || ' LIKE ''%'' || $1 || ''%'' THEN ' || v_coluna_quoted || '
                    ELSE ' || v_coluna_quoted || ' || '', '' || $1
                END
                WHERE LOWER(TRIM("NOME")) = $2'
                USING v_valor_novo, v_nome_lower;

            GET DIAGNOSTICS v_atualizado = ROW_COUNT;
            IF v_atualizado > 0 THEN
                RAISE WARNING '[SABAE] ✓ Aluno encontrado por NOME: %', v_nome_limpo;
                RETURN TRUE;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SABAE] Erro ao buscar por NOME: %', SQLERRM;
        END;
    END IF;

    RETURN FALSE;

END;
$$;

GRANT EXECUTE ON FUNCTION registrar_chamada_nativa(TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;


-- ========== FUNÇÃO 1.5: Editar uma chamada (substitui o valor anterior) ==========
CREATE OR REPLACE FUNCTION editar_chamada_nativa(
    p_email_usuario TEXT,
    p_dia INTEGER,
    p_mes INTEGER,
    p_mat TEXT,
    p_nome TEXT,
    p_presenca TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_valor_novo TEXT;
    v_mat_limpo TEXT;
    v_nome_limpo TEXT;
    v_coluna_dia TEXT;
    v_coluna_quoted TEXT;
    v_atualizado INTEGER;
    v_mat_lower TEXT;
    v_nome_lower TEXT;
    v_valor_atual TEXT;
    v_valor_limpo TEXT;
BEGIN
    -- Preparar valores com limpeza agressiva
    v_mat_limpo := TRIM(COALESCE(p_mat, ''));
    v_nome_limpo := TRIM(COALESCE(p_nome, ''));
    v_mat_lower := LOWER(v_mat_limpo);
    v_nome_lower := LOWER(v_nome_limpo);
    v_valor_novo := TRIM(p_presenca) || ':' || p_mes::TEXT;
    v_coluna_dia := p_dia::TEXT;
    v_coluna_quoted := quote_ident(v_coluna_dia);

    RAISE WARNING '[SABAE] Editando para usuário: %', p_email_usuario;

    -- ESTRATÉGIA 1: Buscar por MAT (exato, case-insensitive)
    IF v_mat_limpo != '' THEN
        BEGIN
            -- Buscar aluno por MAT
            EXECUTE 'SELECT ' || v_coluna_quoted || ' FROM "SABAE-DATA" WHERE LOWER(TRIM("MAT")) = $1'
                INTO v_valor_atual
                USING v_mat_lower;
            
            IF v_valor_atual IS NOT NULL THEN
                -- Remover item antigo deste mês e adicionar novo
                v_valor_limpo := REGEXP_REPLACE(v_valor_atual, '[^:]+:' || p_mes::TEXT, '', 'g');
                v_valor_limpo := TRIM(v_valor_limpo, ', ');
                
                -- Se ficou vazio, usar apenas o novo; senão, adicionar com vírgula
                IF v_valor_limpo = '' OR v_valor_limpo IS NULL THEN
                    v_valor_novo := v_valor_novo;
                ELSE
                    v_valor_novo := v_valor_limpo || ', ' || v_valor_novo;
                END IF;
                
                EXECUTE 'UPDATE "SABAE-DATA" SET ' || v_coluna_quoted || ' = $1 WHERE LOWER(TRIM("MAT")) = $2'
                    USING v_valor_novo, v_mat_lower;
                
                GET DIAGNOSTICS v_atualizado = ROW_COUNT;
                
                IF v_atualizado > 0 THEN
                    RAISE WARNING '[SABAE] ✓ Aluno editado por MAT: % (novo valor: %)', v_mat_limpo, v_valor_novo;
                    RETURN TRUE;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SABAE] Erro ao editar por MAT: %', SQLERRM;
        END;
    END IF;

    -- ESTRATÉGIA 2: Buscar por NOME (exato, case-insensitive)
    IF v_nome_limpo != '' THEN
        BEGIN
            -- Buscar aluno por NOME
            EXECUTE 'SELECT ' || v_coluna_quoted || ' FROM "SABAE-DATA" WHERE LOWER(TRIM("NOME")) = $1'
                INTO v_valor_atual
                USING v_nome_lower;
            
            IF v_valor_atual IS NOT NULL THEN
                -- Remover item antigo deste mês e adicionar novo
                v_valor_limpo := REGEXP_REPLACE(v_valor_atual, '[^:]+:' || p_mes::TEXT, '', 'g');
                v_valor_limpo := TRIM(v_valor_limpo, ', ');
                
                -- Se ficou vazio, usar apenas o novo; senão, adicionar com vírgula
                IF v_valor_limpo = '' OR v_valor_limpo IS NULL THEN
                    v_valor_novo := v_valor_novo;
                ELSE
                    v_valor_novo := v_valor_limpo || ', ' || v_valor_novo;
                END IF;
                
                EXECUTE 'UPDATE "SABAE-DATA" SET ' || v_coluna_quoted || ' = $1 WHERE LOWER(TRIM("NOME")) = $2'
                    USING v_valor_novo, v_nome_lower;
                
                GET DIAGNOSTICS v_atualizado = ROW_COUNT;
                
                IF v_atualizado > 0 THEN
                    RAISE WARNING '[SABAE] ✓ Aluno editado por NOME: % (novo valor: %)', v_nome_limpo, v_valor_novo;
                    RETURN TRUE;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SABAE] Erro ao editar por NOME: %', SQLERRM;
        END;
    END IF;

    RETURN FALSE;

END;
$$;

GRANT EXECUTE ON FUNCTION editar_chamada_nativa(TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;


-- ========== FUNÇÃO 2: Registrar múltiplas chamadas (LOTE) ==========
CREATE OR REPLACE FUNCTION registrar_chamadas_lote_nativa(
    p_email_usuario TEXT,
    p_chamadas_json JSONB
)
RETURNS TABLE (
    total INTEGER,
    sucesso INTEGER,
    falhados INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chamada JSONB;
    v_sucesso_count INTEGER := 0;
    v_total_count INTEGER := 0;
    v_falhou BOOLEAN;
BEGIN
    -- Iterar sobre cada chamada no JSON
    FOR v_chamada IN SELECT jsonb_array_elements(p_chamadas_json)
    LOOP
        v_total_count := v_total_count + 1;

        -- Chamar função de registrar uma chamada por vez
        v_falhou := NOT registrar_chamada_nativa(
            p_email_usuario,
            (v_chamada->>'dia')::INTEGER,
            (v_chamada->>'mes')::INTEGER,
            v_chamada->>'mat',
            v_chamada->>'nome',
            v_chamada->>'presenca'
        );

        IF NOT v_falhou THEN
            v_sucesso_count := v_sucesso_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_total_count, v_sucesso_count, (v_total_count - v_sucesso_count);

END;
$$;

GRANT EXECUTE ON FUNCTION registrar_chamadas_lote_nativa(TEXT, JSONB) TO authenticated;


-- ========== FUNÇÃO 2.5: Editar múltiplas chamadas (LOTE - para edições) ==========
CREATE OR REPLACE FUNCTION editar_chamadas_lote_nativa(
    p_email_usuario TEXT,
    p_chamadas_json JSONB
)
RETURNS TABLE (
    total INTEGER,
    sucesso INTEGER,
    falhados INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chamada JSONB;
    v_sucesso_count INTEGER := 0;
    v_total_count INTEGER := 0;
    v_falhou BOOLEAN;
BEGIN
    -- Iterar sobre cada chamada no JSON
    FOR v_chamada IN SELECT jsonb_array_elements(p_chamadas_json)
    LOOP
        v_total_count := v_total_count + 1;

        -- Chamar função de editar uma chamada por vez
        v_falhou := NOT editar_chamada_nativa(
            p_email_usuario,
            (v_chamada->>'dia')::INTEGER,
            (v_chamada->>'mes')::INTEGER,
            v_chamada->>'mat',
            v_chamada->>'nome',
            v_chamada->>'presenca'
        );

        IF NOT v_falhou THEN
            v_sucesso_count := v_sucesso_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_total_count, v_sucesso_count, (v_total_count - v_sucesso_count);

END;
$$;

GRANT EXECUTE ON FUNCTION editar_chamadas_lote_nativa(TEXT, JSONB) TO authenticated;


-- ========== FUNÇÃO 3: Obter chamadas existentes ==========
CREATE OR REPLACE FUNCTION obter_chamada_existente_nativa(
    p_email_usuario TEXT,
    p_dia INTEGER,
    p_mes INTEGER,
    p_turma TEXT
)
RETURNS TABLE (
    mat TEXT,
    nome TEXT,
    turma TEXT,
    presenca TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coluna_dia TEXT;
    v_mes_numero INTEGER;
    v_padrao_busca TEXT;
    v_sql TEXT;
BEGIN
    -- A coluna do dia é o número do dia como string
    v_coluna_dia := p_dia::TEXT;
    
    -- Se p_mes não for fornecido (0), usar o mês atual
    v_mes_numero := CASE WHEN p_mes = 0 THEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER ELSE p_mes END;
    
    -- Padrão de busca para encontrar registros daquele mês: "algo:MES" ou ":MES"
    v_padrao_busca := ':' || v_mes_numero::TEXT;

    -- Construir SQL dinamicamente de forma segura
    v_sql := 'SELECT ' ||
            quote_ident('MAT') || '::TEXT as mat, ' ||
            quote_ident('NOME') || '::TEXT as nome, ' ||
            quote_ident('TURMA') || '::TEXT as turma, ' ||
            '(SELECT TRIM(item) 
              FROM (SELECT REGEXP_SPLIT_TO_TABLE(' || quote_ident(v_coluna_dia) || ', '','') as item) AS items
              WHERE TRIM(item) ~ '':' || v_mes_numero::TEXT || '''
              LIMIT 1) as presenca
        FROM "SABAE-DATA"
        WHERE ' || quote_ident('TURMA') || ' = $1
        AND ' || quote_ident(v_coluna_dia) || ' IS NOT NULL 
        AND ' || quote_ident(v_coluna_dia) || ' != '''' 
        AND ' || quote_ident(v_coluna_dia) || ' ~ $2';

    -- Executar SQL com parâmetros seguros
    RETURN QUERY EXECUTE v_sql USING p_turma, v_padrao_busca;

END;
$$;

GRANT EXECUTE ON FUNCTION obter_chamada_existente_nativa(TEXT, INTEGER, INTEGER, TEXT) TO authenticated;


-- ========== FUNÇÃO 4: Obter todos os alunos ==========
CREATE OR REPLACE FUNCTION obter_alunos_data_nativa(
    p_email_usuario TEXT
)
RETURNS TABLE (
    mat TEXT,
    nome TEXT,
    turma TEXT,
    turno TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Retornar os dados da tabela SABAE-DATA
    RETURN QUERY
    SELECT 
        "MAT"::TEXT,
        "NOME",
        "TURMA",
        "TURNO",
        "STATUS"
    FROM "SABAE-DATA"
    ORDER BY "MAT";
END;
$$;

GRANT EXECUTE ON FUNCTION obter_alunos_data_nativa(TEXT) TO authenticated;


-- ========== FUNÇÃO 5: Obter alunos por turma ==========
CREATE OR REPLACE FUNCTION obter_alunos_data_por_turma_nativa(
    p_email_usuario TEXT,
    p_turma TEXT
)
RETURNS TABLE (
    mat TEXT,
    nome TEXT,
    turma TEXT,
    turno TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Retornar os dados filtrados por turma
    RETURN QUERY
    SELECT 
        "MAT"::TEXT,
        "NOME",
        "TURMA",
        "TURNO",
        "STATUS"
    FROM "SABAE-DATA"
    WHERE "TURMA" = p_turma
    ORDER BY "MAT";
END;
$$;

GRANT EXECUTE ON FUNCTION obter_alunos_data_por_turma_nativa(TEXT, TEXT) TO authenticated;


-- ========== FUNÇÃO 6: Obter turmas disponíveis ==========
CREATE OR REPLACE FUNCTION obter_turmas_disponiveis_nativa(
    p_email_usuario TEXT
)
RETURNS TABLE (
    turma TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Retornar as turmas únicas
    RETURN QUERY
    SELECT DISTINCT "TURMA"
    FROM "SABAE-DATA"
    ORDER BY "TURMA";
END;
$$;

GRANT EXECUTE ON FUNCTION obter_turmas_disponiveis_nativa(TEXT) TO authenticated;

-- ==========================================
-- FIM - Funções migradas para Auth Nativo
-- ==========================================
