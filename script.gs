// ==========================================
// SABAE - Google Apps Script
// Sistema de Envio de Chamadas para Google Sheets
// ==========================================

// SUBSTITUIR PELO SHEET_ID DA SUA PLANILHA
const SHEET_ID = 'SEU_SHEET_ID_AQUI'; // Exemplo: 1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4

/**
 * Processa o envio de uma chamada para a planilha
 * @param {Object} chamada - Objeto contendo informações da chamada
 * @returns {Object} Resultado do processamento
 */
function enviarChamadaParaPlanilha(chamada) {
  try {
    Logger.log('🔵 Iniciando envio de chamada...');
    Logger.log('Dados recebidos:', JSON.stringify(chamada));

    // Validar dados recebidos
    if (!chamada || !chamada.mes || !chamada.dia || !chamada.alunos || chamada.alunos.length === 0) {
      return {
        sucesso: false,
        mensagem: '❌ Dados da chamada incompletos',
        erro: 'Faltam dados obrigatórios (mês, dia ou alunos)'
      };
    }

    // Abrir a planilha
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    if (!spreadsheet) {
      return {
        sucesso: false,
        mensagem: '❌ Planilha não encontrada',
        erro: 'Verifique se o SHEET_ID está correto'
      };
    }

    // Obter a aba do mês
    let sheet = spreadsheet.getSheetByName(chamada.mes);
    if (!sheet) {
      return {
        sucesso: false,
        mensagem: `❌ Aba do mês "${chamada.mes}" não encontrada`,
        erro: `Crie uma aba com o nome "${chamada.mes}" na planilha`
      };
    }

    Logger.log(`✓ Aba "${chamada.mes}" encontrada`);

    // Obter a primeira linha (cabeçalho com os dias)
    const primeiraLinha = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Primeira linha (dias):', primeiraLinha);

    // Encontrar a coluna do dia
    const colunaDodia = encontrarColunaPorDia(primeiraLinha, chamada.dia);
    if (colunaDodia === -1) {
      return {
        sucesso: false,
        mensagem: `❌ Dia ${chamada.dia} não encontrado na primeira linha`,
        erro: 'Verifique se o dia está na primeira linha da aba'
      };
    }

    Logger.log(`✓ Dia ${chamada.dia} encontrado na coluna ${colunaDodia + 1}`);

    // Processar cada aluno
    let alunosEnviados = 0;
    let erros = [];

    for (let aluno of chamada.alunos) {
      try {
        const resultado = registrarPresencaAluno(sheet, colunaDodia, aluno);
        if (resultado.sucesso) {
          alunosEnviados++;
          Logger.log(`✓ Aluno ${aluno.mat} registrado com presença: ${aluno.presenca}`);
        } else {
          erros.push(`Mat ${aluno.mat}: ${resultado.mensagem}`);
          Logger.log(`⚠️ Erro ao registrar ${aluno.mat}: ${resultado.mensagem}`);
        }
      } catch (erro) {
        erros.push(`Mat ${aluno.mat}: ${erro.toString()}`);
        Logger.log(`❌ Erro ao processar aluno ${aluno.mat}:`, erro);
      }
    }

    // Retornar resultado
    const todasRegistradas = alunosEnviados === chamada.alunos.length;
    return {
      sucesso: todasRegistradas,
      mensagem: todasRegistradas
        ? `✅ Chamada enviada com sucesso! ${alunosEnviados} alunos registrados`
        : `⚠️ Chamada parcialmente enviada: ${alunosEnviados}/${chamada.alunos.length} alunos`,
      alunosEnviados: alunosEnviados,
      totalAlunos: chamada.alunos.length,
      erros: erros
    };

  } catch (erro) {
    Logger.log('❌ Erro crítico:', erro.toString());
    return {
      sucesso: false,
      mensagem: '❌ Erro ao enviar chamada',
      erro: erro.toString()
    };
  }
}

/**
 * Encontra a coluna que contém o dia especificado na primeira linha
 * @param {Array} primeiraLinha - Array com valores da primeira linha
 * @param {number} dia - Dia a procurar
 * @returns {number} Índice da coluna (0-based) ou -1 se não encontrado
 */
function encontrarColunaPorDia(primeiraLinha, dia) {
  const diaString = String(dia).padStart(2, '0'); // Converter para "01", "02", etc.

  for (let i = 0; i < primeiraLinha.length; i++) {
    const celulaValor = String(primeiraLinha[i]).trim();
    if (celulaValor === diaString) {
      return i;
    }
  }

  return -1;
}

/**
 * Registra a presença de um aluno na planilha
 * @param {Sheet} sheet - Sheet da aba
 * @param {number} colunaDodia - Coluna do dia (0-based)
 * @param {Object} aluno - Objeto com mat, nome e presenca
 * @returns {Object} Resultado da operação
 */
function registrarPresencaAluno(sheet, colunaDodia, aluno) {
  try {
    // Buscar a linha da matrícula
    const todasAsLinhas = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();

    let linhaDoAluno = -1;
    for (let i = 1; i < todasAsLinhas.length; i++) { // Começar de 1 para pular cabeçalho
      const matriculaEmCelula = String(todasAsLinhas[i][0]).trim(); // Coluna A
      if (matriculaEmCelula === String(aluno.mat).trim()) {
        linhaDoAluno = i + 1; // +1 porque o range é 1-based
        break;
      }
    }

    if (linhaDoAluno === -1) {
      return {
        sucesso: false,
        mensagem: `Matrícula ${aluno.mat} não encontrada na aba`
      };
    }

    // Escrever a presença na célula
    const celula = sheet.getRange(linhaDoAluno, colunaDodia + 1); // +1 para converter de 0-based para 1-based
    celula.setValue(aluno.presenca);

    // Aplicar formatação (opcional)
    aplicarFormatacaoPresenca(celula, aluno.presenca);

    return {
      sucesso: true,
      mensagem: `Aluno registrado na linha ${linhaDoAluno}`,
      linha: linhaDoAluno,
      coluna: colunaDodia + 1
    };

  } catch (erro) {
    return {
      sucesso: false,
      mensagem: erro.toString()
    };
  }
}

/**
 * Aplica formatação à célula baseado no tipo de presença
 * @param {Range} celula - Célula a formatar
 * @param {string} presenca - Tipo de presença (P, FNJ, FJ)
 */
function aplicarFormatacaoPresenca(celula, presenca) {
  const cores = {
    'P': '#a4c2a5',    // Verde claro - Presente
    'FNJ': '#f9cb9c',  // Laranja - Falta Não Justificada
    'FJ': '#f4cccc'    // Vermelho - Falta Justificada
  };

  const cor = cores[presenca] || '#ffffff';
  celula.setBackground(cor);
  celula.setFontWeight('bold');
  celula.setHorizontalAlignment('center');
  celula.setVerticalAlignment('middle');
}

/**
 * Função para testar a integração (chamada via URL ou teste)
 * Pode ser removida em produção
 */
function testarIntegracao() {
  Logger.log('🧪 Testando integração com Google Sheets...');

  const chamadaTeste = {
    mes: 'MAIO',
    dia: 15,
    sala: 'Sala A',
    alunos: [
      { mat: '001', nome: 'João Silva', presenca: 'P' },
      { mat: '002', nome: 'Maria Santos', presenca: 'FNJ' }
    ]
  };

  const resultado = enviarChamadaParaPlanilha(chamadaTeste);
  Logger.log('Resultado do teste:', JSON.stringify(resultado));
  return resultado;
}

/**
 * Função doGet - Necessária para Web App deployment
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      mensagem: 'SABAE - API de Envio de Chamadas',
      versao: '1.0',
      status: 'ativo'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Função doPost - Recebe os dados do frontend
 */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    
    if (dados.acao === 'enviarChamada') {
      const resultado = enviarChamadaParaPlanilha(dados.chamada);
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (dados.acao === 'testar') {
      const resultado = testarIntegracao();
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      mensagem: 'Ação não reconhecida'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    Logger.log('Erro ao processar POST:', erro);
    return ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      mensagem: 'Erro ao processar requisição',
      erro: erro.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
