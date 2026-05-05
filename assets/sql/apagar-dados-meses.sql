-- ======================================================
-- Função SQL para Apagar Dados de Determinados Meses
-- Limpa registros de chamadas de meses específicos
-- ======================================================

-- ========== FUNÇÃO 1: Apagar dados de um único mês ==========
DROP FUNCTION IF EXISTS apagar_dados_mes(INTEGER);

CREATE OR REPLACE FUNCTION apagar_dados_mes(
    p_mes INTEGER
)
RETURNS TABLE (
    coluna_dia TEXT,
    quantidade_registros_limpos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dia INTEGER;
    v_coluna TEXT;
    v_coluna_quoted TEXT;
    v_atualizado INTEGER;
    v_total_atualizado INTEGER := 0;
    v_padrao_remover TEXT;
BEGIN
    -- Validar entrada
    IF p_mes IS NULL OR p_mes < 1 OR p_mes > 12 THEN
        RAISE EXCEPTION 'Mês inválido. Deve estar entre 1 e 12.';
    END IF;

    -- Iterar sobre cada dia do mês (colunas 1-31)
    FOR v_dia IN 1..31 LOOP
        v_coluna := v_dia::TEXT;
        v_coluna_quoted := quote_ident(v_coluna);

        -- Remover padrões como "P:3", "A:3", etc. do mês especificado
        -- Procura por: [letra]:[número_do_mes] e remove incluindo vírgula/espaços
        EXECUTE 'UPDATE "SABAE-DATA" 
                SET ' || v_coluna_quoted || ' = TRIM(
                    REGEXP_REPLACE(
                        ' || v_coluna_quoted || ',
                        ''[A-Z]:' || p_mes::TEXT || '(,)?'',
                        '''',
                        ''g''
                    )
                )
                WHERE ' || v_coluna_quoted || ' LIKE ''%:' || p_mes::TEXT || '%''';

        GET DIAGNOSTICS v_atualizado = ROW_COUNT;
        v_total_atualizado := v_total_atualizado + v_atualizado;

        IF v_atualizado > 0 THEN
            RETURN QUERY SELECT 
                v_coluna,
                v_atualizado;
        END IF;
    END LOOP;

    RAISE NOTICE '[SABAE] Total de registros limpos do mês %: %', p_mes, v_total_atualizado;
END;
$$;

GRANT EXECUTE ON FUNCTION apagar_dados_mes(INTEGER) TO authenticated;


-- ========== FUNÇÃO 2: Apagar dados de múltiplos meses ==========
DROP FUNCTION IF EXISTS apagar_dados_multiplos_meses(INTEGER[]);

CREATE OR REPLACE FUNCTION apagar_dados_multiplos_meses(
    p_meses INTEGER[]
)
RETURNS TABLE (
    mes_processado INTEGER,
    total_registros_atualizados INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mes INTEGER;
    v_dia INTEGER;
    v_coluna TEXT;
    v_coluna_quoted TEXT;
    v_atualizado INTEGER;
    v_total_mes INTEGER;
BEGIN
    -- Validar entrada
    IF p_meses IS NULL OR array_length(p_meses, 1) = 0 THEN
        RAISE EXCEPTION 'Array de meses não pode estar vazio.';
    END IF;

    -- Iterar sobre cada mês fornecido
    FOREACH v_mes IN ARRAY p_meses LOOP
        IF v_mes < 1 OR v_mes > 12 THEN
            RAISE EXCEPTION 'Mês inválido: %. Deve estar entre 1 e 12.', v_mes;
        END IF;

        v_total_mes := 0;

        -- Iterar sobre cada dia do mês (colunas 1-31)
        FOR v_dia IN 1..31 LOOP
            v_coluna := v_dia::TEXT;
            v_coluna_quoted := quote_ident(v_coluna);

            EXECUTE 'UPDATE "SABAE-DATA" 
                    SET ' || v_coluna_quoted || ' = TRIM(
                        REGEXP_REPLACE(
                            ' || v_coluna_quoted || ',
                            ''[A-Z]:' || v_mes::TEXT || '(,)?'',
                            '''',
                            ''g''
                        )
                    )
                    WHERE ' || v_coluna_quoted || ' LIKE ''%:' || v_mes::TEXT || '%''';

            GET DIAGNOSTICS v_atualizado = ROW_COUNT;
            v_total_mes := v_total_mes + v_atualizado;
        END LOOP;

        -- Retornar resultado para cada mês processado
        RETURN QUERY SELECT 
            v_mes,
            v_total_mes;

        RAISE NOTICE '[SABAE] Dados do mês % apagados. Total de registros: %', v_mes, v_total_mes;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION apagar_dados_multiplos_meses(INTEGER[]) TO authenticated;


-- ========== FUNÇÃO 3: Apagar dados de um intervalo de meses ==========
DROP FUNCTION IF EXISTS apagar_dados_intervalo_meses(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION apagar_dados_intervalo_meses(
    p_mes_inicio INTEGER,
    p_mes_fim INTEGER
)
RETURNS TABLE (
    mes_processado INTEGER,
    total_registros_atualizados INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mes INTEGER;
    v_dia INTEGER;
    v_coluna TEXT;
    v_coluna_quoted TEXT;
    v_atualizado INTEGER;
    v_total_mes INTEGER;
    v_meses_array INTEGER[];
BEGIN
    -- Validar entrada
    IF p_mes_inicio IS NULL OR p_mes_fim IS NULL THEN
        RAISE EXCEPTION 'Mês de início e fim são obrigatórios.';
    END IF;

    IF p_mes_inicio < 1 OR p_mes_inicio > 12 OR p_mes_fim < 1 OR p_mes_fim > 12 THEN
        RAISE EXCEPTION 'Meses devem estar entre 1 e 12.';
    END IF;

    IF p_mes_inicio > p_mes_fim THEN
        RAISE EXCEPTION 'Mês de início (%) não pode ser maior que mês de fim (%)', p_mes_inicio, p_mes_fim;
    END IF;

    -- Criar array de meses no intervalo
    v_meses_array := ARRAY(SELECT generate_series(p_mes_inicio, p_mes_fim));

    -- Chamar função de múltiplos meses
    RETURN QUERY 
    SELECT * FROM apagar_dados_multiplos_meses(v_meses_array);

    RAISE NOTICE '[SABAE] Dados do intervalo de meses % a % foram apagados.', p_mes_inicio, p_mes_fim;
END;
$$;

GRANT EXECUTE ON FUNCTION apagar_dados_intervalo_meses(INTEGER, INTEGER) TO authenticated;


-- ========== FUNÇÃO 4: Apagar TODOS os dados de um mês (limpeza completa) ==========
DROP FUNCTION IF EXISTS apagar_todos_dados_mes(INTEGER);

CREATE OR REPLACE FUNCTION apagar_todos_dados_mes(
    p_mes INTEGER
)
RETURNS TABLE (
    coluna_limpada TEXT,
    quantidade_nulos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dia INTEGER;
    v_coluna TEXT;
    v_coluna_quoted TEXT;
    v_nulos INTEGER;
BEGIN
    -- Validar entrada
    IF p_mes IS NULL OR p_mes < 1 OR p_mes > 12 THEN
        RAISE EXCEPTION 'Mês inválido. Deve estar entre 1 e 12.';
    END IF;

    -- Iterar sobre cada dia do mês (colunas 1-31)
    FOR v_dia IN 1..31 LOOP
        v_coluna := v_dia::TEXT;
        v_coluna_quoted := quote_ident(v_coluna);

        -- Remover padrões do mês especificado e limpar espaços extras
        EXECUTE 'UPDATE "SABAE-DATA" 
                SET ' || v_coluna_quoted || ' = TRIM(
                    REGEXP_REPLACE(
                        ' || v_coluna_quoted || ',
                        ''[A-Z]:' || p_mes::TEXT || '(,)?'',
                        '''',
                        ''g''
                    )
                )
                WHERE ' || v_coluna_quoted || ' LIKE ''%:' || p_mes::TEXT || '%''';

        GET DIAGNOSTICS v_nulos = ROW_COUNT;

        IF v_nulos > 0 THEN
            RETURN QUERY SELECT 
                v_coluna,
                v_nulos;
        END IF;

        RAISE NOTICE '[SABAE] Coluna % processada. Registros com dados do mês % removidos: %', v_coluna, p_mes, v_nulos;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION apagar_todos_dados_mes(INTEGER) TO authenticated;


-- ========== EXEMPLOS DE USO ==========
/*
-- Exemplo 1: Apagar dados apenas do mês 3 (Março)
SELECT * FROM apagar_dados_mes(3);

-- Exemplo 2: Apagar dados de múltiplos meses (Janeiro, Fevereiro, Março)
SELECT * FROM apagar_dados_multiplos_meses(ARRAY[1, 2, 3]);

-- Exemplo 3: Apagar dados de um intervalo de meses (Março a Julho)
SELECT * FROM apagar_dados_intervalo_meses(3, 7);

-- Exemplo 4: Limpeza completa de um mês (zera todas as colunas de dias)
SELECT * FROM apagar_todos_dados_mes(5);
*/
