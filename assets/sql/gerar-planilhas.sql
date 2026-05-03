-- ======================================================
-- Função SQL para Gerar Dados da Planilha - AUTH NATIVO
-- Retorna todos os dados brutos da tabela SABAE-DATA
-- Usa autenticação nativa do Supabase (JWT token)
-- ======================================================

-- NOVA FUNÇÃO COM SUPORTE A AUTH NATIVO
DROP FUNCTION IF EXISTS gerar_dados_planilha_nativo(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION gerar_dados_planilha_nativo(
    p_email_usuario TEXT,
    p_mes_selecionado INTEGER
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
BEGIN
    -- Verificar se o usuário está autenticado (email fornecido)
    IF p_email_usuario IS NULL OR p_email_usuario = '' THEN
        RAISE EXCEPTION 'Usuário não autenticado. Email é obrigatório.';
    END IF;

    -- Retornar todos os dados brutos da tabela SABAE-DATA
    RETURN QUERY
    SELECT 
        d."MAT",
        d."NOME",
        d."TURMA",
        d."TURNO",
        d."STATUS",
        d."1",
        d."2",
        d."3",
        d."4",
        d."5",
        d."6",
        d."7",
        d."8",
        d."9",
        d."10",
        d."11",
        d."12",
        d."13",
        d."14",
        d."15",
        d."16",
        d."17",
        d."18",
        d."19",
        d."20",
        d."21",
        d."22",
        d."23",
        d."24",
        d."25",
        d."26",
        d."27",
        d."28",
        d."29",
        d."30",
        d."31"
    FROM "SABAE-DATA" d
    ORDER BY d."MAT";
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION gerar_dados_planilha_nativo(TEXT, INTEGER) TO authenticated;