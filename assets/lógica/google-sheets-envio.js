// ==========================================
// SABAE - Integração com Google Sheets
// Sistema de Envio de Chamadas
// ==========================================

// SUBSTITUIR PELA URL DO SEU APPS SCRIPT DEPLOYADO
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqK9P-cBWq-wb5Il-aCAmRlBANzw-2A5dwKc2IqEkiA7HHChtNvTZvwqxuFhc0tYxs/exec'; // Exemplo: https://script.google.com/macros/d/1A5B2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ/usercopy

/**
 * Envia uma chamada individual para o Google Sheets
 * @param {Object} chamada - Objeto da chamada com mes, dia, alunos, etc
 * @returns {Promise<Object>} Resultado do envio
 */
async function enviarChamadaParaGoogleSheets(chamada) {
    try {
        console.log('📤 Enviando chamada para Google Sheets...', chamada);

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                acao: 'enviarChamada',
                chamada: chamada
            })
        });

        // Como usamos mode: 'no-cors', não podemos ler a resposta
        // Consideramos como sucesso se a requisição foi enviada
        console.log('✓ Chamada enviada para processamento no Google Apps Script');

        return {
            sucesso: true,
            mensagem: 'Chamada enviada para processamento'
        };

    } catch (erro) {
        console.error('❌ Erro ao enviar chamada:', erro);
        return {
            sucesso: false,
            mensagem: 'Erro ao conectar com o Google Sheets',
            erro: erro.message
        };
    }
}

/**
 * Envia todas as chamadas salvas para o Google Sheets
 * com barra de progresso
 * @returns {Promise<void>}
 */
async function enviarTodasChamadasParaGoogleSheets() {
    // Recuperar chamadas salvas
    const chamadasSalvas = JSON.parse(sessionStorage.getItem('chamadasSalvas') || '[]');

    if (chamadasSalvas.length === 0) {
        alert('⚠️ Não há chamadas registradas para enviar!');
        return;
    }

    // Confirmar antes de enviar
    const confirmar = confirm(`Enviar ${chamadasSalvas.length} chamada(s) para o Google Sheets?`);
    if (!confirmar) {
        return;
    }

    // Mostrar modal de envio
    const modalEnvio = document.getElementById('modalEnvio');
    const progressoTexto = document.getElementById('modalEnvioProgresso');
    const barraProgresso = document.getElementById('modalEnvioBarraProgresso');
    const detalhes = document.getElementById('modalEnvioDetalhes');

    modalEnvio.style.display = 'flex';

    let alunosEnviadosTotal = 0;
    let chamadaEnviadaTotal = 0;
    const errosGerais = [];

    try {
        // Enviar cada chamada
        for (let i = 0; i < chamadasSalvas.length; i++) {
            const chamada = chamadasSalvas[i];

            // Atualizar progresso no modal
            progressoTexto.textContent = `${i + 1}/${chamadasSalvas.length}`;
            const percentual = ((i + 1) / chamadasSalvas.length) * 100;
            barraProgresso.style.width = percentual + '%';

            // Atualizar detalhes
            detalhes.textContent = `Enviando: Sala ${chamada.sala} - ${chamada.dia}/${obterNumeroMes(chamada.mes)}`;

            console.log(`Enviando chamada ${i + 1}/${chamadasSalvas.length}...`);

            // Enviar chamada
            const resultado = await enviarChamadaParaGoogleSheets(chamada);

            if (resultado.sucesso) {
                chamadaEnviadaTotal++;
                alunosEnviadosTotal += chamada.alunos.length;
            } else {
                errosGerais.push(`Sala ${chamada.sala} (${chamada.dia}/${obterNumeroMes(chamada.mes)}): ${resultado.mensagem}`);
            }

            // Pequeno delay para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Fechar modal de envio
        modalEnvio.style.display = 'none';

        // Exibir resultado
        exibirResultadoEnvio(chamadaEnviadaTotal, chamadasSalvas.length, alunosEnviadosTotal, errosGerais);

        // Se tudo foi enviado com sucesso, limpar sessionStorage
        if (chamadaEnviadaTotal === chamadasSalvas.length) {
            sessionStorage.removeItem('chamadasSalvas');
            renderizarCartuchosChamadaaSalvas();
            console.log('✅ Todas as chamadas foram enviadas e removidas da memória');
        }

    } catch (erro) {
        console.error('❌ Erro durante envio em lote:', erro);
        modalEnvio.style.display = 'none';

        exibirResultadoEnvio(
            chamadaEnviadaTotal,
            chamadasSalvas.length,
            alunosEnviadosTotal,
            [...errosGerais, `Erro crítico: ${erro.message}`]
        );
    }
}

/**
 * Exibe o resultado do envio em um modal
 * @param {number} chamadasEnviadas - Quantidade de chamadas enviadas
 * @param {number} totalChamadas - Total de chamadas
 * @param {number} totalAlunos - Total de alunos enviados
 * @param {Array} erros - Array com mensagens de erro
 */
function exibirResultadoEnvio(chamadasEnviadas, totalChamadas, totalAlunos, erros = []) {
    const modal = document.getElementById('modalResultadoEnvio');
    const icone = document.getElementById('modalResultadoIcone');
    const titulo = document.getElementById('modalResultadoTitulo');
    const mensagem = document.getElementById('modalResultadoMensagem');
    const detalhesDiv = document.getElementById('modalResultadoDetalhes');

    const todasEnviadas = chamadasEnviadas === totalChamadas;

    // Configurar ícone e cor baseado no resultado
    if (todasEnviadas) {
        icone.innerHTML = '<i class="ri-checkbox-circle-fill" style="color: #4CAF50; font-size: 48px;"></i>';
        titulo.textContent = '✅ Sucesso!';
        titulo.style.color = '#4CAF50';
        mensagem.textContent = `Todas as ${chamadasEnviadas} chamada(s) foram enviadas com sucesso! ${totalAlunos} alunos registrados.`;
    } else {
        icone.innerHTML = '<i class="ri-alert-line" style="color: #FF9800; font-size: 48px;"></i>';
        titulo.textContent = '⚠️ Envio Parcial';
        titulo.style.color = '#FF9800';
        mensagem.textContent = `${chamadasEnviadas}/${totalChamadas} chamada(s) enviadas. ${totalAlunos} alunos registrados.`;
    }

    // Exibir erros, se houver
    if (erros.length > 0) {
        detalhesDiv.style.display = 'block';
        detalhesDiv.innerHTML = '<strong>Erros encontrados:</strong><br>' +
            erros.map(erro => `<span style="display: block; margin-top: 5px; font-size: 12px; color: #d32f2f;">• ${erro}</span>`).join('');
    } else {
        detalhesDiv.style.display = 'none';
    }

    // Mostrar modal
    modal.style.display = 'flex';
}

/**
 * Formata a estrutura da chamada para envio ao Google Sheets
 * @param {Object} chamadaOriginal - Chamada do sessionStorage
 * @returns {Object} Chamada formatada
 */
function formatarChamadaParaEnvio(chamadaOriginal) {
    return {
        id: chamadaOriginal.id,
        sala: chamadaOriginal.sala,
        mes: chamadaOriginal.mes,
        dia: parseInt(chamadaOriginal.dia),
        data_hora_registrada: chamadaOriginal.data_hora_registrada,
        alunos: chamadaOriginal.alunos.map(aluno => ({
            mat: String(aluno.mat).trim(),
            nome: String(aluno.nome).trim(),
            presenca: String(aluno.presenca).trim()
        }))
    };
}

/**
 * Função auxiliar para obter o número do mês pelo nome
 * @param {string} nomeMes - Nome do mês (ex: "Janeiro")
 * @returns {number} Número do mês (1-12)
 */
function obterNumeroMes(nomeMes) {
    const meses = {
        'Janeiro': 1,
        'Fevereiro': 2,
        'Março': 3,
        'Abril': 4,
        'Maio': 5,
        'Junho': 6,
        'Julho': 7,
        'Agosto': 8,
        'Setembro': 9,
        'Outubro': 10,
        'Novembro': 11,
        'Dezembro': 12
    };
    return meses[nomeMes] || 0;
}

/**
 * Inicializa os event listeners do botão e modal de envio
 */
function inicializarFuncionalidadeEnvio() {
    // Botão de enviar para o banco
    const btnEnviarParaBanco = document.getElementById('btnEnviarParaBanco');
    if (btnEnviarParaBanco) {
        btnEnviarParaBanco.addEventListener('click', () => {
            enviarTodasChamadasParaGoogleSheets();
        });
    }

    // Botão de fechar resultado
    const btnFecharResultado = document.getElementById('btnFecharResultado');
    if (btnFecharResultado) {
        btnFecharResultado.addEventListener('click', () => {
            const modal = document.getElementById('modalResultadoEnvio');
            modal.style.display = 'none';
        });
    }

    // Fechar resultado ao clicar fora
    const modalResultado = document.getElementById('modalResultadoEnvio');
    if (modalResultado) {
        modalResultado.addEventListener('click', (e) => {
            if (e.target === modalResultado || e.target.classList.contains('modal-resultado-overlay')) {
                modalResultado.style.display = 'none';
            }
        });
    }

    console.log('✓ Funcionalidade de envio inicializada');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarFuncionalidadeEnvio);
