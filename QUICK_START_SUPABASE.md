# SABAE - Implementação Supabase - Quick Start

## 🚀 Próximos Passos Rápidos

### 1. Executar as Funções SQL no Supabase

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto SABAE
3. Vá para: **SQL Editor**
4. Clique em **+ New Query**
5. Cole TODO o conteúdo de: `assets/sql/registrar-chamadas-function.sql`
6. Clique em **Run** (botão de play ▶️)
7. Aguarde mensagens de confirmação

### 2. Verificar se Funcionou

No SQL Editor, execute este comando para testar:

```sql
-- Teste da função registrar_chamadas_lote
SELECT registrar_chamadas_lote(
    'seu_usuario',
    'sua_senha',
    '[
      {
        "dia": 1,
        "mes": 1,
        "mat": "123",
        "nome": "PEDRO",
        "presenca": "P"
      }
    ]'::jsonb
);
```

Você deve receber um JSON com:
- "sucesso": número de registros
- "falhados": 0 (se tudo ok)
- "total": 1

### 3. Acessar a Página de Chamadas

1. Acesse: `chamada.html`
2. Faça login com um usuário válido
3. Registre uma chamada de teste
4. Clique em **Enviar para o Banco**
5. Verifique a barra de progresso e o resultado

### 4. Validar os Dados Salvos

No Supabase, execute:

```sql
SELECT "MAT", "NOME", "1", "2", "3"
FROM "SABAE-DATA"
WHERE "MAT" = '123'  -- ou o MAT que você usou
LIMIT 5;
```

Deve aparecer algo como: `"P:1"` na coluna de dia correspondente

## 📋 Estrutura de Dados - RÁPIDA REFERÊNCIA

### Formato do Registro
```
PRESENCA:MES

Exemplos:
- P:1    = Presente em Janeiro
- FNJ:5  = Falta Não Justificada em Maio
- FJ:12  = Falta Justificada em Dezembro
```

### Múltiplos Registros (mesmo dia, meses diferentes)
```
Célula da coluna 5 (dia 5) para um aluno:
P:1,P:2,FNJ:3,FJ:4,P:5

Significa:
- Dia 5 de Janeiro: Presente
- Dia 5 de Fevereiro: Presente
- Dia 5 de Março: Falta Não Justificada
- Dia 5 de Abril: Falta Justificada
- Dia 5 de Maio: Presente
```

## 🎯 Checklist de Validação

- [ ] Abri o SQL Editor do Supabase
- [ ] Colei o conteúdo de `registrar-chamadas-function.sql`
- [ ] Executei o comando SQL (Run)
- [ ] Recebi mensagens de sucesso
- [ ] Acessei `chamada.html` e fiz login
- [ ] Criei uma chamada de teste
- [ ] Cliquei em "Enviar para o Banco"
- [ ] Recebi confirmação de sucesso
- [ ] Verificar a tabela no Supabase e vi os dados

## ⚠️ Problemas Comuns

### SQL não executa
- ✅ Certifique-se de que você está no SQL Editor
- ✅ Verifique se o projeto está correto
- ✅ Procure mensagens de erro em vermelho

### "Credenciais inválidas" ao enviar
- ✅ Verifique se está logado com um usuário válido
- ✅ Confirme se o usuário existe na tabela `users`
- ✅ Verifique se a senha está correta

### Chamadas não aparecem na tabela
- ✅ Verifique se a coluna de dia existe (coluna "1", "2", etc.)
- ✅ Confirme se o MAT do aluno existe na tabela
- ✅ Tente usar o nome do aluno se o MAT não funcionar

### Modal não aparece
- ✅ Abre o Console (F12) e procure por erros
- ✅ Certifique-se de que JavaScript está habilitado
- ✅ Recarregue a página (Ctrl+F5)

## 📞 Suporte Rápido

Se algo não funcionar:
1. Abra Console (F12 → Aba Console)
2. Copie a mensagem de erro
3. Procure a mensagem neste guia ou em `GUIA_ENVIO_SUPABASE.md`
4. Se persistir, relate o problema com:
   - Print do erro
   - Passos para reproduzir
   - Qual browser está usando

## 📁 Arquivos Importantes

```
SABAE/
├── chamada.html
├── assets/
│   ├── estilos/
│   │   └── style.css (MODIFICADO - novo CSS)
│   ├── lógica/
│   │   ├── supabase-config.js
│   │   ├── supabase-alunos.js
│   │   ├── supabase-envio-chamadas.js (NOVO!)
│   │   ├── auth.js
│   │   └── script.js
│   └── sql/
│       ├── login-function.sql
│       ├── obter-alunos-function.sql
│       └── registrar-chamadas-function.sql (NOVO!)
└── GUIA_ENVIO_SUPABASE.md (NOVO - Documentação completa)
```

## 🎉 Sucesso!

Se você:
- ✅ Executou o SQL no Supabase
- ✅ Conseguiu enviar uma chamada
- ✅ Viu os dados na tabela SABAE-DATA

Parabéns! O sistema está funcionando corretamente! 🎊

Você pode agora usar o sistema com dados reais dos seus alunos.
