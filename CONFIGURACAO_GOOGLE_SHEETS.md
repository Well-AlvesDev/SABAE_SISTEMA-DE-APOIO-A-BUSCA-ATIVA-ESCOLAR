# SABAE - Guia de Configuração do Envio para Google Sheets

## 📋 Visão Geral

Este guia explica como configurar o sistema de envio de chamadas para o Google Sheets usando Google Apps Script.

## 🔧 Passo 1: Preparar a Planilha Google Sheets

### 1.1 Criar/Configurar a Planilha

1. Abra [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha ou abra a existente chamada "SABAE"
3. **Importante**: Copie o ID da planilha (encontrado na URL)
   - URL exemplo: `https://docs.google.com/spreadsheets/d/1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ/edit`
   - ID: `1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ` ✓

### 1.2 Estruturar as Abas por Mês

Para cada mês que vai registrar chamadas, crie uma aba com o nome exato (maiúsculo):
- JANEIRO
- FEVEREIRO
- MARÇO
- ABRIL
- MAIO ← Exemplo
- JUNHO
- JULHO
- AGOSTO
- SETEMBRO
- OUTUBRO
- NOVEMBRO
- DEZEMBRO

### 1.3 Estruturar a Aba (Exemplo: Aba MAIO)

```
┌─────────┬────┬────┬────┬─────┬──────────┐
│ MATRICULA│ 01 │ 02 │ 03 │ ... │ 31 (últimodia)
├─────────┼────┼────┼────┼─────┼──────────┤
│ 001     │    │    │    │     │          │
│ 002     │    │    │    │     │          │
│ 003     │    │    │    │     │          │
└─────────┴────┴────┴────┴─────┴──────────┘
```

**Instruções:**
- **Linha 1**: Cabeçalho com:
  - Coluna A: "MATRICULA" (ou similar)
  - Colunas B em diante: "01", "02", "03"... até o último dia do mês (ex: "31" para maio)
  
- **Coluna A**: Matrículas dos alunos (A partir da linha 2)
  - Exemplo: 001, 002, 003, 004, etc.

- **Demais Colunas**: Vazias inicialmente - serão preenchidas com:
  - **P** = Presente
  - **FNJ** = Falta Não Justificada
  - **FJ** = Falta Justificada

## 🚀 Passo 2: Criar e Configurar o Apps Script

### 2.1 Abrir Google Apps Script

1. Acesse [script.google.com](https://script.google.com)
2. Clique em "Novo Projeto"
3. Dê um nome ao projeto (ex: "SABAE - Envio de Chamadas")

### 2.2 Copiar o Código script.gs

1. Copie todo o conteúdo do arquivo `script.gs` do projeto SABAE
2. Cole no editor de Apps Script
3. **Importante**: Substitua `SEU_SHEET_ID_AQUI` pelo ID da sua planilha (Passo 1.1)

```javascript
const SHEET_ID = '1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ'; // Seu ID aqui
```

### 2.3 Testar o Script

1. Clique em "Executar" > "testarIntegracao"
2. Na primeira execução, será solicitada autorização - autorize o acesso
3. Verifique se os dados de teste aparecem na planilha

### 2.4 Deploy como Web App

1. Clique em "Deploy" (canto superior direito)
2. Selecione "Novo deployment"
3. Tipo: Selecione "Web app"
4. Configuração:
   - "Executar como": Sua conta Google
   - "Quem tem acesso": Qualquer pessoa
5. Clique em "Implementar"
6. **Copie a URL gerada** (exemplo: `https://script.google.com/macros/d/1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ/usercopy`)

## 💻 Passo 3: Configurar a URL no Frontend

### 3.1 Atualizar a URL do Apps Script

No arquivo `assets/lógica/google-sheets-envio.js`, localize:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/d/SEU_SCRIPT_ID/usercopy';
```

Substitua pela URL gerada no Passo 2.4:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/d/1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ/usercopy';
```

## ✅ Passo 4: Testar o Sistema

### 4.1 Teste no chamada.html

1. Abra a página `chamada.html` no navegador
2. Registre algumas chamadas (Iniciar Registro)
3. Preencha as presenças dos alunos
4. Clique em "Salvar Chamada"
5. Você verá os cards das chamadas salvas
6. Clique em **"Enviar para o Banco"**
7. Acompanhe o progresso no loader
8. Verifique se os dados foram registrados na planilha

### 4.2 Verificar Resultados

- Abra a planilha Google Sheets
- Vá para a aba do mês (ex: MAIO)
- Verifique se as presenças aparecem nas colunas dos dias
- As células devem ter cores:
  - Verde: Presentes (P)
  - Laranja: Falta Não Justificada (FNJ)
  - Vermelho: Falta Justificada (FJ)

## 🔧 Solução de Problemas

### "Não consegue encontrar a aba do mês"
- Verifique se o nome da aba está **exatamente igual** ao do sistema
- O nome deve ser em MAIÚSCULA (JANEIRO, FEVEREIRO, etc.)

### "Matrícula não encontrada"
- Verifique se a matrícula está corretamente cadastrada na Coluna A
- As matrículas devem começar na linha 2 (linha 1 é cabeçalho)

### "Erro de autorização do Apps Script"
- Revise a permissão "Quem tem acesso" no deployment
- Deve estar como "Qualquer pessoa"

### "As cores não aparecem nas células"
- Elas são aplicadas automaticamente pelo script
- Se não aparecerem, verifique se o Apps Script tem permissão de edição

## 📊 Estrutura dos Dados Enviados

Cada chamada é enviada com a seguinte estrutura:

```json
{
  "mes": "MAIO",
  "dia": 15,
  "sala": "Sala A",
  "alunos": [
    {
      "mat": "001",
      "nome": "João Silva",
      "presenca": "P"
    },
    {
      "mat": "002",
      "nome": "Maria Santos",
      "presenca": "FNJ"
    }
  ]
}
```

## 🛠️ Monitoramento

Para acompanhar os logs do Apps Script:
1. Abra o Apps Script
2. Clique em "Execuções" (ícone de relógio)
3. Verifique os logs de cada execução

## 📝 Checklist de Configuração

- [ ] Planilha Google Sheets criada/configurada
- [ ] Sheet ID copiado
- [ ] Abas por mês criadas (JANEIRO até DEZEMBRO)
- [ ] Estrutura de colunas (MATRICULA + dias)
- [ ] Alunos cadastrados (coluna A, a partir de linha 2)
- [ ] Apps Script criado
- [ ] Código script.gs copiado com Sheet ID atualizado
- [ ] Teste de integração executado com sucesso
- [ ] Apps Script deployado como Web App
- [ ] URL do Apps Script copiada
- [ ] google-sheets-envio.js atualizado com a URL
- [ ] Sistema testado com chamada de teste

## 🎉 Pronto!

Seu sistema está configurado e pronto para usar. As chamadas registradas podem agora ser enviadas para o Google Sheets com um clique!

---

**Versão**: 1.0  
**Última atualização**: 2026-04-24
