# 📚 SABAE - Sistema de Apoio à Busca Ativa Escolar

## 📖 Sobre o Projeto

O **SABAE** é um sistema web responsivo desenvolvido para facilitar a **identificação, registro e acompanhamento da frequência dos estudantes** em instituições de ensino. O projeto utiliza tecnologias modernas como HTML5, CSS3, JavaScript e banco de dados em nuvem (Supabase) para proporcionar uma solução robusta e escalável.

### Objetivo Principal
Otimizar o processo de busca ativa escolar através de:
- 📋 Registro digital de chamadas/presenças
- 👥 Gerenciamento completo de dados de alunos (CRUD)
- 📊 Geração automática de planilhas para análise
- 🔐 Autenticação segura de usuários
- 📈 Rastreamento de atividades do sistema

---

## 🎯 Funcionalidades Principais

### 1️⃣ **Autenticação e Segurança**
- Sistema de login nativo do Supabase
- Validação de email e senha
- Gerenciamento de sessões automático
- Logout com registro de atividade
- Verificação de autenticação em todas as páginas
- Redirecionamento automático para login se sessão expirar

### 2️⃣ **Registrar Chamadas (chamada.html)**
- Seleção dinâmica de sala/turma
- Seleção de data (mês e dia)
- Modal interativo para registro de presença
- Salvar chamadas localmente (sessionStorage)
- Enviar chamadas para banco de dados
- Editar chamadas já registradas
- Remover chamadas do banco
- Sincronização em tempo real com Supabase
- Indicadores visuais de status (cores diferentes para presença/falta)

### 3️⃣ **CRUD de Alunos (crud.html)**
- **Criar**: Adicionar novos alunos com matrícula, nome, turma, turno e status
- **Ler**: Visualizar dados completos de alunos
- **Atualizar**: Editar informações de alunos existentes
- **Deletar**: Remover alunos do sistema
- Validação de dados em tempo real
- Busca por matrícula
- Suporte a diferentes status: MATRICULADO, TRANSFERIDO, FALECIDO

### 4️⃣ **Gerar Planilhas (planilhas.html)**
- Geração automática de planilhas de frequência
- Visualização em tabela interativa
- Download em formato Excel (.xlsx)
- Download em formato CSV
- Cores visuais para facilitar leitura (verde=presença, amarelo=falta justificada, vermelho=falta)
- Detecção de alunos não cadastrados
- Destaque visual para alunos transferidos (fundo cinza)
- Interface responsiva

### 5️⃣ **Dashboard Principal (index.html)**
- Exibição de informações do usuário logado
- Registro de todas as atividades executadas no sistema
- Navegação rápida para principais funcionalidades
- Modal de perfil do usuário
- Atualização dinâmica de data/hora
 
### Tecnologias Principais
- Frontend: HTML5, CSS3, JavaScript
- Backend: Supabase (PostgreSQL)
- Hospedagem: Hostinger (https://www.sabae.com.br)
- Versionamento: Git

---
**Status:** Em Desenvolvimento ✨
