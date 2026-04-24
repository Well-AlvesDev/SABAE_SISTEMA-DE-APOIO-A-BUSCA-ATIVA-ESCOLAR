# SABAE - Envio de Chamadas para Supabase

## 📋 Descrição

Sistema completo para envio de registros de presença (chamadas) do SABAE para o banco de dados Supabase. O sistema valida credenciais do usuário, processa os registros de presença e atualiza a tabela `SABAE-DATA` com os dados formatados corretamente.

## 🎯 Funcionalidades

### Validação de Credenciais
- Antes de enviar, o sistema valida o usuário e senha usando a função RPC `validar_login`
- Garante que apenas usuários autenticados possam registrar chamadas
- Se as credenciais forem inválidas, exibe mensagem de erro e não procede com o envio

### Processamento de Dados
- Lê as chamadas salvas em `sessionStorage`
- Formata cada registro como "PRESENCA:MES" (exemplo: "P:5" para Presente em Maio)
- Procura o aluno pela matrícula (MAT) ou pelo nome (fallback)
- Atualiza a célula correspondente à coluna do dia selecionado

### Estrutura de Armazenamento na SABAE-DATA
```
┌─────┬──────────────┬───────┬──────┬────────┬──────┬──────┬──────┬─────────────────────────┐
│ MAT │ NOME         │ TURMA │ TURNO│ STATUS │  1   │  2   │  3   │ ...                   │
├─────┼──────────────┼───────┼──────┼────────┼──────┼──────┼──────┼─────────────────────────┤
│ 123 │ PEDRO SILVA  │ 8A    │ MANHA│ ATIVO  │ P:1  │ P:1  │FNJ:3 │ ...                   │
│     │              │       │      │        │ P:2  │ P:2  │      │                       │
│     │              │       │      │        │      │      │      │                       │
├─────┼──────────────┼───────┼──────┼────────┼──────┼──────┼──────┼─────────────────────────┤
│ 124 │ JOÃO SANTOS  │ 8B    │ TARDE│ ATIVO  │FNJ:1 │      │ P:3  │ ...                   │
└─────┴──────────────┴───────┴──────┴────────┴──────┴──────┴──────┴─────────────────────────┘

Exemplo da célula da coluna 1 (dia 1) para PEDRO:
  - "P:1" significa: Presente (P) no dia 1 de Janeiro (1)
  - Múltiplos registros: "P:1,P:2,FNJ:3" (Janeiro, Fevereiro e Março - FNJ)
  - Os registros de diferentes meses são separados por vírgula
```

## 🚀 Como Usar

### 1. Registrar Chamadas
- Acesse a página de chamadas (chamada.html)
- Selecione a sala (turma)
- Escolha o mês e o dia
- Clique em "Iniciar Registro"
- Marque a presença de cada aluno (P, FNJ ou FJ)
- Clique em "Salvar Chamada"

### 2. Visualizar Chamadas Salvas
- As chamadas são exibidas como cards logo abaixo do botão "Iniciar Registro"
- Cada card mostra:
  - Sala da chamada
  - Data (dia/mês)
  - Quantidade de alunos
  - Botões para editar ou remover

### 3. Enviar para o Banco
- Clique no botão "Enviar para o Banco"
- Confirme a ação (será pedida confirmação)
- Aguarde enquanto o sistema processa:
  - Valida suas credenciais
  - Envia cada chamada
  - Mostra barra de progresso
- Visualize o resultado com:
  - Quantidade de chamadas enviadas
  - Quantidade de alunos registrados
  - Detalhes de qualquer erro

## 🔧 Configuração Técnica

### Funções SQL Criadas

#### `registrar_chamada()`
Registra um único registro de presença no banco de dados.

```sql
registrar_chamada(
    p_nome_usuario TEXT,      -- Nome do usuário
    p_senha_usuario TEXT,     -- Senha do usuário
    p_dia INTEGER,            -- Dia (1-31)
    p_mes INTEGER,            -- Mês (1-12)
    p_mat TEXT,               -- Matrícula do aluno
    p_nome TEXT,              -- Nome do aluno
    p_presenca TEXT           -- Tipo (P, FNJ, FJ)
)
RETURNS BOOLEAN
```

**Fluxo:**
1. Valida credenciais do usuário
2. Formata o valor como "PRESENCA:MES"
3. Tenta atualizar usando a matrícula (MAT)
4. Se não encontrar pela matrícula, tenta pelo nome
5. Retorna true se bem-sucedido, false caso contrário

#### `registrar_chamadas_lote()`
Registra múltiplas chamadas em um único lote.

```sql
registrar_chamadas_lote(
    p_nome_usuario TEXT,      -- Nome do usuário
    p_senha_usuario TEXT,     -- Senha do usuário
    p_chamadas_json JSONB     -- Array JSON com os registros
)
RETURNS JSONB
```

**Formato do JSON esperado:**
```json
[
  {
    "dia": 1,
    "mes": 5,
    "mat": "123",
    "nome": "PEDRO SILVA",
    "presenca": "P"
  },
  {
    "dia": 1,
    "mes": 5,
    "mat": "124",
    "nome": "JOÃO SANTOS",
    "presenca": "FNJ"
  }
]
```

**Retorno:**
```json
{
  "sucesso": 2,           -- Registros processados com sucesso
  "falhados": 0,          -- Registros que falharam
  "total": 2,             -- Total de registros enviados
  "detalhes": [           -- Detalhes de erros (se houver)
    {
      "indice": 1,
      "status": "Aluno não encontrado",
      "mat": "999",
      "nome": "ALUNO INEXISTENTE"
    }
  ]
}
```

### Arquivos Criados/Modificados

#### Novos Arquivos
1. **`assets/sql/registrar-chamadas-function.sql`**
   - Contém as funções SQL RPC para registrar chamadas
   - Precisa ser executado no Supabase SQL Editor

2. **`assets/lógica/supabase-envio-chamadas.js`**
   - Lógica frontend para enviar chamadas
   - Gerencia validação, progresso e resultado
   - Cria modais dinâmicos

#### Arquivos Modificados
1. **`chamada.html`**
   - Adicionado script `supabase-envio-chamadas.js`

2. **`assets/estilos/style.css`**
   - Adicionados estilos para modais de envio e resultado

## 📦 Instalação

### Passo 1: Adicionar as Funções SQL ao Supabase
1. Abra o Supabase Dashboard
2. Vá para "SQL Editor"
3. Crie uma nova query
4. Copie o conteúdo de `assets/sql/registrar-chamadas-function.sql`
5. Execute a query
6. Aguarde a confirmação de sucesso

### Passo 2: Verificar se os scripts estão inclusos
- `chamada.html` já inclui `supabase-envio-chamadas.js`
- Verifique se o arquivo está em `assets/lógica/supabase-envio-chamadas.js`

### Passo 3: Testar
1. Acesse `chamada.html`
2. Faça login com um usuário válido
3. Crie uma chamada de teste
4. Clique em "Enviar para o Banco"
5. Verifique se os dados foram salvos no Supabase

## 🔍 Troubleshooting

### Erro: "Credenciais inválidas"
- Verifique se o usuário e senha estão corretos
- Certifique-se de que a função `validar_login` foi criada corretamente
- Verifique se o usuário existe na tabela `users`

### Erro: "Aluno não encontrado"
- O sistema procura primeiro pela matrícula (MAT)
- Se não encontrar, procura pelo nome
- Certifique-se de que:
  - A matrícula está correta (sem espaços extras)
  - O nome do aluno está exatamente como na tabela SABAE-DATA
  - Os dados foram carregados corretamente da sala

### Erro: "Nenhum registro foi processado"
- Verifique se há alunos registrados na chamada
- Certifique-se de que todos têm presença marcada
- Verifique se a tabela SABAE-DATA existe e tem dados

### Modal não aparece
- Verifique se o navegador bloqueia popups
- Certifique-se de que o JavaScript está habilitado
- Verifique o console (F12) para mensagens de erro

## 📊 Exemplo de Fluxo Completo

1. **Preparação**
   - Usuário faz login: usuário="professor1", senha="senha123"

2. **Registro de Chamada**
   - Seleciona sala: "8A"
   - Seleciona data: 5 de Maio
   - Marca presença:
     - PEDRO (mat=123): P
     - JOÃO (mat=124): FNJ
     - MARIA (mat=125): FJ

3. **Envio para Banco**
   - Clica "Enviar para o Banco"
   - Sistema valida credenciais
   - Sistema envia:
     ```
     {
       "dia": 5,
       "mes": 5,
       "mat": "123",
       "nome": "PEDRO",
       "presenca": "P"
     },
     {
       "dia": 5,
       "mes": 5,
       "mat": "124",
       "nome": "JOÃO",
       "presenca": "FNJ"
     },
     {
       "dia": 5,
       "mes": 5,
       "mat": "125",
       "nome": "MARIA",
       "presenca": "FJ"
     }
     ```

4. **Resultado no Banco**
   - Tabela SABAE-DATA atualizada
   - PEDRO, linha 1, coluna "5": "P:5" (ou "P:1,P:2,...,P:5" se já tinha registros)
   - JOÃO, linha 2, coluna "5": "FNJ:5"
   - MARIA, linha 3, coluna "5": "FJ:5"

## ✅ Checklist de Implementação

- [x] Funções SQL criadas (`registrar-chamadas-function.sql`)
- [x] JavaScript de envio criado (`supabase-envio-chamadas.js`)
- [x] HTML atualizado com novo script
- [x] CSS atualizado com novos estilos
- [ ] Funções SQL executadas no Supabase
- [ ] Testes funcionais realizados
- [ ] Usuários notificados sobre a nova funcionalidade

## 🆘 Suporte

Para reportar bugs ou solicitar melhorias:
1. Verifique o console (F12) para mensagens de erro
2. Verifique o log de atividades no Supabase
3. Teste com dados simples primeiro
4. Relate o problema com prints e passos para reproduzir

## 📝 Versão

- **Versão**: 1.0
- **Data**: 2025
- **Status**: Produção
