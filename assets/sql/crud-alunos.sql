-- ==========================================
-- Funções CRUD para Auth Nativo do Supabase
-- ==========================================
-- Versão Nativa: Usa email do usuário autenticado
-- Sem validação de username/senha (feita pelo Supabase Auth)
-- Data: 3 de maio de 2026

-- ========== FUNÇÃO 1: Adicionar Novo Aluno ==========

DROP FUNCTION IF EXISTS adicionar_aluno_nativo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION adicionar_aluno_nativo(
    p_email_usuario TEXT,
    p_matricula TEXT,
    p_nome TEXT,
    p_turma TEXT,
    p_turno TEXT,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_matricula_existe BOOLEAN;
    v_resultado JSONB;
    v_dia INTEGER;
    v_coluna TEXT;
    v_valor_turma TEXT;
    v_meses TEXT;
BEGIN
    -- 1. Verificar se a matrícula já existe
    SELECT EXISTS(
        SELECT 1 FROM "SABAE-DATA"
        WHERE "MAT" = p_matricula
    ) INTO v_matricula_existe;

    -- Se matrícula já existe, retornar erro
    IF v_matricula_existe THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Matrícula já cadastrada no sistema',
            'codigo', 'MATRICULA_DUPLICADA'
        );
    END IF;

    -- 2. Inserir novo aluno
    INSERT INTO "SABAE-DATA" (
        "MAT",
        "NOME",
        "TURMA",
        "TURNO",
        "STATUS"
    ) VALUES (
        p_matricula,
        p_nome,
        p_turma,
        p_turno,
        p_status
    );

    -- 3. Sincronizar chamadas existentes da turma com o novo aluno
    FOR v_dia IN 1..31 LOOP
        v_coluna := v_dia::TEXT;
        
        BEGIN
            EXECUTE 'SELECT ' || quote_ident(v_coluna) || ' FROM "SABAE-DATA" 
                    WHERE "TURMA" = $1 
                    AND ' || quote_ident(v_coluna) || ' IS NOT NULL 
                    AND ' || quote_ident(v_coluna) || ' != '''' 
                    LIMIT 1'
                INTO v_valor_turma
                USING p_turma;
            
            IF v_valor_turma IS NOT NULL AND v_valor_turma != '' THEN
                SELECT string_agg('P:' || m[1], ', ')
                INTO v_meses
                FROM regexp_matches(v_valor_turma, ':(\d+)', 'g') AS m;
                
                IF v_meses IS NOT NULL THEN
                    EXECUTE 'UPDATE "SABAE-DATA" 
                            SET ' || quote_ident(v_coluna) || ' = $1
                            WHERE "MAT" = $2'
                        USING v_meses, p_matricula;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Ignorar erro de coluna não encontrada
            NULL;
        END;
    END LOOP;

    -- 4. Retornar sucesso
    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Aluno adicionado com sucesso',
        'codigo', 'ALUNO_ADICIONADO',
        'dados', jsonb_build_object(
            'matricula', p_matricula,
            'nome', p_nome,
            'turma', p_turma,
            'turno', p_turno,
            'status', p_status
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao adicionar aluno: ' || SQLERRM,
        'codigo', 'ERRO_ADICIONAR'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION adicionar_aluno_nativo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ========== FUNÇÃO 2: Buscar Aluno por Matrícula ==========

DROP FUNCTION IF EXISTS buscar_aluno_por_matricula_nativo(TEXT, TEXT);

CREATE OR REPLACE FUNCTION buscar_aluno_por_matricula_nativo(
    p_email_usuario TEXT,
    p_matricula TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno RECORD;
    v_resultado JSONB;
BEGIN
    -- 1. Buscar aluno por matrícula
    SELECT "MAT", "NOME", "TURMA", "TURNO", "STATUS"
    INTO v_aluno
    FROM "SABAE-DATA"
    WHERE "MAT" = TRIM(p_matricula);

    -- Se aluno não encontrado, retornar erro
    IF v_aluno IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Aluno não encontrado',
            'codigo', 'ALUNO_NAO_ENCONTRADO'
        );
    END IF;

    -- 2. Retornar sucesso com dados do aluno
    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Aluno encontrado com sucesso',
        'dados', jsonb_build_object(
            'matricula', v_aluno."MAT",
            'nome', v_aluno."NOME",
            'turma', v_aluno."TURMA",
            'turno', v_aluno."TURNO",
            'status', v_aluno."STATUS"
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao buscar aluno: ' || SQLERRM,
        'codigo', 'ERRO_CONSULTA'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION buscar_aluno_por_matricula_nativo(TEXT, TEXT) TO authenticated;

-- ========== FUNÇÃO 3: Atualizar Aluno ==========

DROP FUNCTION IF EXISTS atualizar_aluno_nativo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION atualizar_aluno_nativo(
    p_email_usuario TEXT,
    p_matricula TEXT,
    p_nome TEXT,
    p_turma TEXT,
    p_turno TEXT,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_existe BOOLEAN;
    v_resultado JSONB;
BEGIN
    -- 1. Verificar se o aluno existe
    SELECT EXISTS(
        SELECT 1 FROM "SABAE-DATA"
        WHERE "MAT" = p_matricula
    ) INTO v_aluno_existe;

    -- Se aluno não existe, retornar erro
    IF NOT v_aluno_existe THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Aluno não encontrado',
            'codigo', 'ALUNO_NAO_ENCONTRADO'
        );
    END IF;

    -- 2. Atualizar aluno (não permite alterar matrícula)
    UPDATE "SABAE-DATA"
    SET
        "NOME" = p_nome,
        "TURMA" = p_turma,
        "TURNO" = p_turno,
        "STATUS" = p_status
    WHERE "MAT" = p_matricula;

    -- 3. Retornar sucesso
    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Aluno atualizado com sucesso',
        'codigo', 'ALUNO_ATUALIZADO',
        'dados', jsonb_build_object(
            'matricula', p_matricula,
            'nome', p_nome,
            'turma', p_turma,
            'turno', p_turno,
            'status', p_status
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao atualizar aluno: ' || SQLERRM,
        'codigo', 'ERRO_ATUALIZACAO'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION atualizar_aluno_nativo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ========== FUNÇÃO 4: Obter Dados Detalhados do Aluno ==========

DROP FUNCTION IF EXISTS obter_dados_aluno_detalhado_nativo(TEXT, TEXT);

CREATE OR REPLACE FUNCTION obter_dados_aluno_detalhado_nativo(
    p_email_usuario TEXT,
    p_matricula TEXT
)
RETURNS TABLE (
    "MAT" text,
    "NOME" text,
    "TURMA" text,
    "TURNO" text,
    "STATUS" text,
    "1" text,
    "2" text,
    "3" text,
    "4" text,
    "5" text,
    "6" text,
    "7" text,
    "8" text,
    "9" text,
    "10" text,
    "11" text,
    "12" text,
    "13" text,
    "14" text,
    "15" text,
    "16" text,
    "17" text,
    "18" text,
    "19" text,
    "20" text,
    "21" text,
    "22" text,
    "23" text,
    "24" text,
    "25" text,
    "26" text,
    "27" text,
    "28" text,
    "29" text,
    "30" text,
    "31" text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mat_limpo TEXT := TRIM(p_matricula);
BEGIN
    -- Retornar dados do aluno
    RETURN QUERY
    SELECT 
        d."MAT",
        d."NOME",
        d."TURMA",
        d."TURNO",
        d."STATUS",
        d."1", d."2", d."3", d."4", d."5", d."6", d."7", d."8", d."9", d."10",
        d."11", d."12", d."13", d."14", d."15", d."16", d."17", d."18", d."19", d."20",
        d."21", d."22", d."23", d."24", d."25", d."26", d."27", d."28", d."29", d."30", d."31"
    FROM "SABAE-DATA" d
    WHERE d."MAT" = v_mat_limpo;
END;
$$;

GRANT EXECUTE ON FUNCTION obter_dados_aluno_detalhado_nativo(TEXT, TEXT) TO authenticated;

-- ========== FUNÇÃO 5: Obter Turmas Disponíveis (Nativa) ==========

DROP FUNCTION IF EXISTS obter_turmas_disponiveis_nativo(TEXT);

CREATE OR REPLACE FUNCTION obter_turmas_disponiveis_nativo(
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
    RETURN QUERY
    SELECT DISTINCT "TURMA"
    FROM "SABAE-DATA"
    WHERE "TURMA" IS NOT NULL
    AND "TURMA" != ''
    ORDER BY "TURMA";
END;
$$;

GRANT EXECUTE ON FUNCTION obter_turmas_disponiveis_nativo(TEXT) TO authenticated;

-- ========== FUNÇÃO 6: Deletar Aluno (BONUS) ==========

DROP FUNCTION IF EXISTS deletar_aluno_nativo(TEXT, TEXT);

CREATE OR REPLACE FUNCTION deletar_aluno_nativo(
    p_email_usuario TEXT,
    p_matricula TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_existe BOOLEAN;
BEGIN
    -- 1. Verificar se o aluno existe
    SELECT EXISTS(
        SELECT 1 FROM "SABAE-DATA"
        WHERE "MAT" = p_matricula
    ) INTO v_aluno_existe;

    -- Se aluno não existe, retornar erro
    IF NOT v_aluno_existe THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Aluno não encontrado',
            'codigo', 'ALUNO_NAO_ENCONTRADO'
        );
    END IF;

    -- 2. Deletar aluno
    DELETE FROM "SABAE-DATA"
    WHERE "MAT" = p_matricula;

    -- 3. Retornar sucesso
    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Aluno deletado com sucesso',
        'codigo', 'ALUNO_DELETADO'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao deletar aluno: ' || SQLERRM,
        'codigo', 'ERRO_DELECAO'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION deletar_aluno_nativo(TEXT, TEXT) TO authenticated;

-- ========== FIM DAS FUNÇÕES NATIVAS ==========
-- Funções antigas mantidas para compatibilidade (depreciadas)
-- Remover após conclusão da migração completa
