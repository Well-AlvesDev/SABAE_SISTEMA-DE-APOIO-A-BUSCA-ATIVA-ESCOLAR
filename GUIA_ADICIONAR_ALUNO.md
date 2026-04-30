# 📚 Guia: Adicionar Novo Aluno - SABAE

## 🎯 O que foi implementado

Um sistema completo para adicionar novos alunos à tabela SABAE-DATA do Supabase com validações robustas, interface amigável e verificações de credenciais.

---

## 📋 Checklist de Implementação

### ✅ Parte 1: Backend (Supabase SQL)

**Arquivo criado:** `assets/sql/adicionar-aluno-function.sql`

**O que fazer:**
1. Abra seu console do Supabase em https://supabase.com
2. Vá para: **SQL Editor** → **New Query**
3. Copie todo o conteúdo de `assets/sql/adicionar-aluno-function.sql`
4. Cole no editor SQL
5. Clique em **Execute** (botão Play)

**O que a função faz:**
- ✅ Valida credenciais do usuário (nome + senha)
- ✅ Verifica se a matrícula já existe (evita duplicatas)
- ✅ Insere novo aluno na tabela `SABAE-DATA`
- ✅ Retorna resposta JSON detalhada com sucesso/erro

### ✅ Parte 2: Frontend (JavaScript)

**Arquivo criado:** `assets/lógica/supabase-adicionar-aluno.js`

Já foi importado automaticamente em `gerenciar.html`. Contém:
- Funções de validação (matrícula, nome)
- Integração com Supabase
- Lógica de carregamento de turmas
- Tratamento de erros

### ✅ Parte 3: Estilos CSS

**Arquivo modificado:** `assets/estilos/style.css`

Foram adicionados estilos para:
- Modal do formulário
- Inputs com validação visual
- Dropdowns
- Animações suaves
- Responsividade

### ✅ Parte 4: Interface HTML

**Arquivo modificado:** `gerenciar.html`

Alterações:
- ✅ Importação de scripts necessários
- ✅ Modal com formulário completo
- ✅ Event listeners para abrir/fechar modal
- ✅ Validações em tempo real

---

## 🚀 Como Usar

### Para o Usuário Final

1. **Abrir página de Gerenciar Dados**
   - Clique em "Gerenciar Dados" no menu principal
   - Você verá dois botões: "Adicionar novo aluno" e "Editar aluno"

2. **Clicar em "Adicionar novo aluno"**
   - Um modal (pop-up) será aberto
   - A lista de turmas será carregada automaticamente

3. **Preencher o formulário**
   - **Matrícula**: Digite apenas números (ex: 123456)
   - **Nome**: Digite o nome em MAIÚSCULAS (ex: JOÃO SILVA)
   - **Turma**: Selecione no dropdown (valores vêm do banco)
   - **Turno**: Selecione MANHÃ, TARDE ou NOITE
   - **Status**: Selecione MATRICULADO, TRANSFERIDO ou FALECIDO

4. **Enviar o formulário**
   - Clique em "Enviar"
   - Um loader será exibido enquanto processa
   - Se sucesso: página recarrega e aluno é adicionado
   - Se erro: mensagem de erro é exibida

### Para Desenvolvedores

**Estrutura do projeto:**

```
gerenciar.html                           ← Página com modal
├── assets/lógica/
│   ├── supabase-config.js              ← Config do Supabase (já existe)
│   ├── supabase-alunos.js              ← Funções de turmas (já existe)
│   └── supabase-adicionar-aluno.js     ← Novo arquivo criado ✨
├── assets/estilos/
│   └── style.css                       ← Modificado com novos estilos
└── assets/sql/
    └── adicionar-aluno-function.sql    ← Novo arquivo (execute no Supabase)
```

---

## 📝 Detalhes Técnicos

### Validações no Frontend

```javascript
// Matrícula: apenas números
✅ "123456"  // OK
❌ "123ABC"  // Erro

// Nome: apenas letras e parênteses, maiúsculas
✅ "JOÃO SILVA"           // OK
✅ "MARIA (TRANSFERIDA)" // OK
❌ "João Silva"          // Aviso (converter para maiúsculas)
❌ "JOÃO 123"            // Erro
```

### Validações no Backend (SQL)

```sql
-- 1. Credenciais validadas
SELECT EXISTS(SELECT 1 FROM users WHERE nomeUsuario = ? AND senhaUsuario = ?)

-- 2. Matrícula não duplicada
SELECT EXISTS(SELECT 1 FROM "SABAE-DATA" WHERE "MAT" = ?)

-- 3. Inserção bem-sucedida
INSERT INTO "SABAE-DATA" (...) VALUES (...)
```

### Resposta da API

```json
// Sucesso
{
  "sucesso": true,
  "mensagem": "Aluno adicionado com sucesso",
  "dados": {
    "matricula": 123456,
    "nome": "JOÃO SILVA",
    "turma": "6º A",
    "turno": "MANHÃ",
    "status": "MATRICULADO"
  }
}

// Erro - Credenciais inválidas
{
  "sucesso": false,
  "mensagem": "Credenciais inválidas",
  "codigo": "CREDENCIAIS_INVALIDAS"
}

// Erro - Matrícula duplicada
{
  "sucesso": false,
  "mensagem": "Matrícula já cadastrada no sistema",
  "codigo": "MATRICULA_DUPLICADA"
}
```

### Fluxo de Dados

```
Usuário clica em "Adicionar novo aluno"
                ↓
Modal abre e carrega turmas do Supabase
                ↓
Usuário preenche formulário
                ↓
Validações em tempo real (matrícula, nome)
                ↓
Usuário clica "Enviar"
                ↓
Recupera credenciais de sessionStorage
                ↓
Chama RPC: adicionar_aluno()
                ↓
Backend valida credenciais + matrícula
                ↓
Insere na tabela SABAE-DATA
                ↓
Retorna sucesso/erro
                ↓
Mostra notificação
                ↓
Limpa cache de alunos
                ↓
Recarrega página (opcional)
```

---

## 🔐 Segurança

- ✅ **Validação de credenciais**: Sempre validado no servidor (SQL)
- ✅ **Prevenção de duplicatas**: Matrícula verificada antes de inserir
- ✅ **Sanitização de entrada**: Matrícula e nome filtrados no frontend
- ✅ **SECURITY DEFINER**: Função SQL rodará com privilégios do banco
- ✅ **Roles de permissão**: Apenas usuários autenticados podem usar

---

## ⚠️ Possíveis Erros e Soluções

### Erro: "Credenciais inválidas"
**Causa**: Sessão expirou ou usuário desconectou
**Solução**: Faça login novamente e tente adicionar o aluno

### Erro: "Matrícula já cadastrada"
**Causa**: A matrícula digitada já existe no banco
**Solução**: Verifique a matrícula ou use uma diferente

### Erro: "Função não encontrada"
**Causa**: Função SQL não foi criada no Supabase
**Solução**: Execute o arquivo `adicionar-aluno-function.sql` no console Supabase

### Modal não abre
**Causa**: JavaScript não carregou ou há erro
**Solução**: Verifique console do navegador (F12 → Console) para erros

---

## 📊 Estrutura da Tabela SABAE-DATA

```sql
CREATE TABLE "SABAE-DATA" (
    "MAT" int8 PRIMARY KEY,        -- Matrícula (chave única)
    "NOME" text,                   -- Nome do aluno
    "TURMA" text,                  -- Turma (ex: "6º A")
    "TURNO" text,                  -- Turno (MANHÃ/TARDE/NOITE)
    "STATUS" text,                 -- Status (MATRICULADO/TRANSFERIDO/FALECIDO)
    "1" text,                      -- Dia 1 (múltiplas presenças)
    "2" text,                      -- Dia 2
    ... "31" text                  -- Dia 31
);
```

---

## 🎨 Customização

### Alterar cores do botão
**Arquivo**: `assets/estilos/style.css`

Procure por `.btn-enviar-modal` e altere as cores.

### Alterar validação de nome
**Arquivo**: `assets/lógica/supabase-adicionar-aluno.js`

Função `validarNome()` - modifique a regex conforme necessário.

### Alterar opções de dropdown
**Arquivo**: `gerenciar.html`

Os dropdowns estão hardcodificados no HTML (Turno, Status) ou carregados do banco (Turma).

---

## 📞 Suporte

Se encontrar problemas:
1. Abra o console do navegador (F12 → Console)
2. Verifique se há erros em vermelho
3. Copie o erro e procure documentação
4. Verifique se a função SQL foi criada no Supabase

---

## 🔄 Próximas Funcionalidades

- [ ] Editar aluno existente
- [ ] Deletar aluno
- [ ] Importar alunos em lote (CSV/Excel)
- [ ] Buscar aluno por matrícula
- [ ] Filtros avançados

---

**Criado em**: 29/04/2026
**Versão**: 1.0
**Status**: ✅ Pronto para produção
