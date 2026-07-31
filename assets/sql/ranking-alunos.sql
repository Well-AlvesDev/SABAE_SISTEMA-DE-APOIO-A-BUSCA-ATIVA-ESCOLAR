CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "RAKING-ALUNOS" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "NOME" TEXT,
    "TURMA" TEXT,
    "P-QUANT" TEXT
);

CREATE OR REPLACE FUNCTION atualizar_ranking_alunos()
RETURNS TABLE (
    nome TEXT,
    turma TEXT,
    p_quant TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expr TEXT;
BEGIN
    DELETE FROM "RAKING-ALUNOS";

    SELECT string_agg(
        format(
            'COALESCE((SELECT COUNT(*) FROM regexp_matches(COALESCE(%I::TEXT, ''''), ''(^|,)\\s*P(:|$)'', ''g'')), 0)',
            column_name
        ),
        ' + '
    )
    INTO v_expr
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SABAE-DATA'
      AND column_name ~ '^[0-9]+$';

    IF COALESCE(v_expr, '') = '' THEN
        RETURN;
    END IF;

    EXECUTE format(
        'WITH presencas AS (
            SELECT
                TRIM(COALESCE("NOME", '''')) AS nome,
                TRIM(COALESCE("TURMA", '''')) AS turma,
                (%s) AS qtd_presencas
            FROM "SABAE-DATA"
            WHERE COALESCE(NULLIF(TRIM("NOME"), ''''), '''') <> ''''
              AND COALESCE(NULLIF(TRIM("TURMA"), ''''), '''') <> ''''
        )
        INSERT INTO "RAKING-ALUNOS" ("NOME", "TURMA", "P-QUANT")
        SELECT nome, turma, qtd_presencas::TEXT
        FROM (
            SELECT nome, turma, qtd_presencas
            FROM presencas
            WHERE qtd_presencas > 0
            ORDER BY qtd_presencas DESC, nome ASC
            LIMIT 15
        ) ranking;',
        v_expr
    );

    RETURN QUERY
    SELECT "NOME"::TEXT, "TURMA"::TEXT, "P-QUANT"::TEXT
    FROM "RAKING-ALUNOS"
    ORDER BY CAST("P-QUANT" AS INTEGER) DESC, "NOME" ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION atualizar_ranking_alunos() TO anon;
GRANT EXECUTE ON FUNCTION atualizar_ranking_alunos() TO authenticated;

CREATE OR REPLACE FUNCTION obter_ranking_alunos_nativo()
RETURNS TABLE (
    nome TEXT,
    turma TEXT,
    p_quant TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT "NOME"::TEXT, "TURMA"::TEXT, "P-QUANT"::TEXT
    FROM "RAKING-ALUNOS"
    ORDER BY CAST("P-QUANT" AS INTEGER) DESC, "NOME" ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION obter_ranking_alunos_nativo() TO anon;
GRANT EXECUTE ON FUNCTION obter_ranking_alunos_nativo() TO authenticated;
