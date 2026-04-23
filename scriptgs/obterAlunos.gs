// Google Apps Script para integração com Google Sheets - SABAE
// Este script deve ser implantado como uma Web App

// ID da planilha SABAE (substitua com seu ID real)
const SHEET_ID = '15Ibs07XKhvkd54sVKTc6NB296R6eK97WrSA9pVnTRQU';
const ABA_NAME = 'MAIO';

// Tratamento de CORS - deve estar NO INÍCIO
function doOptions(e) {
  return HtmlService.createHtmlOutput('')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

// Mapeamento de colunas
const COLUNAS = {
  MATRICULA: 'A',
  NOME: 'B',
  TURMA: 'C',
  TURNO: 'D',
  STATUS: 'E'
};

/**
 * Obtém todos os alunos da aba MAIO
 * @returns {Object} Objeto com array de alunos e status da requisição
 */
function obterAlunos() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(ABA_NAME);
    
    if (!sheet) {
      return {
        sucesso: false,
        mensagem: `Aba '${ABA_NAME}' não encontrada`,
        dados: []
      };
    }
    
    // Obter dados das colunas A até E (Matrícula até Status)
    // Começando da linha 2 (linha 1 é cabeçalho)
    const dados = sheet.getRange('A2:E' + sheet.getLastRow()).getValues();
    
    // Transformar em array de objetos
    const alunos = dados.map(linha => ({
      matricula: linha[0],
      nome: linha[1],
      turma: linha[2],
      turno: linha[3],
      status: linha[4]
    })).filter(aluno => aluno.matricula !== ''); // Filtrar linhas vazias
    
    return {
      sucesso: true,
      mensagem: `${alunos.length} alunos obtidos com sucesso`,
      dados: alunos,
      timestamp: new Date().toISOString()
    };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: `Erro ao obter alunos: ${erro.message}`,
      dados: []
    };
  }
}

/**
 * Obtém alunos filtrados por turma
 * @param {string} turma - Nome da turma para filtrar
 * @returns {Object} Objeto com array de alunos filtrados
 */
function obterAlunosPorTurma(turma) {
  try {
    const resultado = obterAlunos();
    
    if (!resultado.sucesso) {
      return resultado;
    }
    
    const alunosFiltrados = resultado.dados.filter(aluno => 
      aluno.turma.toString().toUpperCase() === turma.toString().toUpperCase()
    );
    
    return {
      sucesso: true,
      mensagem: `${alunosFiltrados.length} alunos encontrados na turma ${turma}`,
      dados: alunosFiltrados,
      filtro: { tipo: 'turma', valor: turma },
      timestamp: new Date().toISOString()
    };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: `Erro ao filtrar por turma: ${erro.message}`,
      dados: []
    };
  }
}

/**
 * Obtém alunos filtrados por turno
 * @param {string} turno - Nome do turno (Manhã, Tarde, Noite)
 * @returns {Object} Objeto com array de alunos filtrados
 */
function obterAlunosPorTurno(turno) {
  try {
    const resultado = obterAlunos();
    
    if (!resultado.sucesso) {
      return resultado;
    }
    
    const alunosFiltrados = resultado.dados.filter(aluno => 
      aluno.turno.toString().toUpperCase() === turno.toString().toUpperCase()
    );
    
    return {
      sucesso: true,
      mensagem: `${alunosFiltrados.length} alunos encontrados no turno ${turno}`,
      dados: alunosFiltrados,
      filtro: { tipo: 'turno', valor: turno },
      timestamp: new Date().toISOString()
    };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: `Erro ao filtrar por turno: ${erro.message}`,
      dados: []
    };
  }
}

/**
 * Obtém alunos com status específico
 * @param {string} status - Status do aluno
 * @returns {Object} Objeto com array de alunos filtrados
 */
function obterAlunosPorStatus(status) {
  try {
    const resultado = obterAlunos();
    
    if (!resultado.sucesso) {
      return resultado;
    }
    
    const alunosFiltrados = resultado.dados.filter(aluno => 
      aluno.status.toString().toUpperCase() === status.toString().toUpperCase()
    );
    
    return {
      sucesso: true,
      mensagem: `${alunosFiltrados.length} alunos encontrados com status ${status}`,
      dados: alunosFiltrados,
      filtro: { tipo: 'status', valor: status },
      timestamp: new Date().toISOString()
    };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: `Erro ao filtrar por status: ${erro.message}`,
      dados: []
    };
  }
}

/**
 * Função para requisições HTTP (GET)
 * @param {Object} e - Objeto de evento do Google Apps Script
 * @returns {Object} Resposta com os dados solicitados
 */
function doGet(e) {
  const parametro = e.parameter.acao || 'obterAlunos';
  let resposta;
  
  switch (parametro) {
    case 'obterAlunos':
      resposta = obterAlunos();
      break;
    case 'obterPorTurma':
      resposta = obterAlunosPorTurma(e.parameter.turma || '');
      break;
    case 'obterPorTurno':
      resposta = obterAlunosPorTurno(e.parameter.turno || '');
      break;
    case 'obterPorStatus':
      resposta = obterAlunosPorStatus(e.parameter.status || '');
      break;
    default:
      resposta = {
        sucesso: false,
        mensagem: 'Ação não reconhecida. Use: obterAlunos, obterPorTurma, obterPorTurno, obterPorStatus'
      };
  }
  
  // Adicionar headers CORS para permitir requisições cross-origin
  const resultado = ContentService.createTextOutput(JSON.stringify(resposta));
  resultado.setMimeType(ContentService.MimeType.JSON);
  resultado.addHeader('Access-Control-Allow-Origin', '*');
  resultado.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  resultado.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  resultado.addHeader('Access-Control-Max-Age', '86400');
  return resultado;
}

/**
 * Para requisições POST (futuro)
 */
function doPost(e) {
  return doGet(e);
}
