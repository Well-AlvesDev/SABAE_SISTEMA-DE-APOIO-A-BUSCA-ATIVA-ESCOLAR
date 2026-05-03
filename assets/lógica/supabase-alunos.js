/**
 * Cliente Supabase para obter dados de alunos da tabela SABAE-DATA
 * ATUALIZADO: Agora usa autenticação nativa do Supabase (email)
 * 
 * As funções antigas com validação de credenciais foram mantidas
 * para compatibilidade, mas foram marcadas como depreciadas.
 */

// ========== NOVAS FUNÇÕES COM AUTH NATIVO ==========

/**
 * Obter todos os alunos usando autenticação nativa (email)
 * @param {boolean} forcarRecarga - Forçar recarga ignorando cache
 * @returns {Promise<Object>} { sucesso, mensagem, alunos }
 */
async function obterTodosAlunosNativo(forcarRecarga = false) {
    try {
        console.log('📚 Obtendo todos os alunos (AUTH NATIVO)...');

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        console.log(`👤 Usuário autenticado: ${usuario.email}`);

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache('alunos');
            if (dadosEmCache) {
                console.log('✅ Alunos obtidos do cache');
                return {
                    sucesso: true,
                    mensagem: 'Alunos obtidos do cache',
                    alunos: dadosEmCache
                };
            }
        }

        // Chamar função RPC com email do usuário autenticado
        const { data, error } = await supabaseClient.rpc('obter_alunos_data_nativa', {
            p_email_usuario: usuario.email
        });

        if (error) {
            console.error('❌ Erro ao obter alunos:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter alunos: ${error.message}`,
                alunos: []
            };
        }

        if (!data || data.length === 0) {
            console.log('⚠️ Nenhum aluno encontrado');
            return {
                sucesso: false,
                mensagem: 'Nenhum aluno encontrado',
                alunos: []
            };
        }

        console.log(`✅ ${data.length} alunos obtidos com sucesso`);

        // Transformar dados para o formato esperado
        const alunos = data.map(aluno => ({
            mat: aluno.mat,
            nome: aluno.nome,
            turma: aluno.turma,
            turno: aluno.turno,
            status: aluno.status
        }));

        // Salvar no cache
        salvarNoCache('alunos', alunos);

        return {
            sucesso: true,
            mensagem: 'Alunos obtidos com sucesso',
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter alunos:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

/**
 * Obter alunos de uma turma específica usando auth nativo
 * @param {string} turma - Nome da turma
 * @param {boolean} forcarRecarga - Forçar recarga ignorando cache
 * @returns {Promise<Object>} { sucesso, mensagem, alunos }
 */
async function obterAlunosTurmaNativo(turma, forcarRecarga = false) {
    try {
        console.log(`📚 Obtendo alunos da turma: ${turma} (AUTH NATIVO)`);

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache(`alunos_turma_${turma}`);
            if (dadosEmCache) {
                console.log(`✅ Alunos da turma ${turma} obtidos do cache`);
                return {
                    sucesso: true,
                    mensagem: `Alunos da turma ${turma} obtidos do cache`,
                    alunos: dadosEmCache
                };
            }
        }

        // Chamar função RPC com email
        const { data, error } = await supabaseClient.rpc('obter_alunos_data_por_turma_nativa', {
            p_email_usuario: usuario.email,
            p_turma: turma
        });

        if (error) {
            console.error('❌ Erro ao obter alunos da turma:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter alunos: ${error.message}`,
                alunos: []
            };
        }

        if (!data || data.length === 0) {
            console.log(`⚠️ Nenhum aluno encontrado na turma ${turma}`);
            return {
                sucesso: false,
                mensagem: `Nenhum aluno encontrado na turma ${turma}`,
                alunos: []
            };
        }

        console.log(`✅ ${data.length} alunos da turma ${turma} obtidos com sucesso`);

        // Transformar dados para o formato esperado
        const alunos = data.map(aluno => ({
            mat: aluno.mat,
            nome: aluno.nome,
            turma: aluno.turma,
            turno: aluno.turno,
            status: aluno.status
        }));

        // Salvar no cache
        salvarNoCache(`alunos_turma_${turma}`, alunos);

        return {
            sucesso: true,
            mensagem: `Alunos da turma ${turma} obtidos com sucesso`,
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter alunos da turma:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

/**
 * Obter turmas disponíveis usando auth nativo
 * @param {boolean} forcarRecarga - Forçar recarga ignorando cache
 * @returns {Promise<Object>} { sucesso, mensagem, turmas }
 */
async function obterTurmasDisponiveisNativo(forcarRecarga = false) {
    try {
        console.log('🏫 Obtendo turmas disponíveis (AUTH NATIVO)...');

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache('turmas');
            if (dadosEmCache) {
                console.log('✅ Turmas obtidas do cache');
                return {
                    sucesso: true,
                    mensagem: 'Turmas obtidas do cache',
                    turmas: dadosEmCache
                };
            }
        }

        // Chamar função RPC com email
        const { data, error } = await supabaseClient.rpc('obter_turmas_disponiveis_nativa', {
            p_email_usuario: usuario.email
        });

        if (error) {
            console.error('❌ Erro ao obter turmas:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter turmas: ${error.message}`,
                turmas: []
            };
        }

        if (!data || data.length === 0) {
            console.log('⚠️ Nenhuma turma encontrada');
            return {
                sucesso: false,
                mensagem: 'Nenhuma turma encontrada',
                turmas: []
            };
        }

        console.log(`✅ ${data.length} turmas obtidas com sucesso`);

        // Extrair apenas os nomes das turmas
        const turmas = data.map(item => item.turma);

        // Salvar no cache
        salvarNoCache('turmas', turmas);

        return {
            sucesso: true,
            mensagem: 'Turmas obtidas com sucesso',
            turmas: turmas
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter turmas:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            turmas: []
        };
    }
}

// ========== FUNÇÕES LEGADAS (DEPRECIADAS) ==========
// ⚠️ Estas funções foram mantidas apenas para compatibilidade
// Use as versões com sufixo "_nativo" para novo código

// Função para obter todos os alunos (com validação de credenciais)
async function obterTodosAlunos(nomeUsuario, senhaUsuario, forcarRecarga = false) {
    try {
        console.log('📚 Obtendo todos os alunos do Supabase...');

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache('alunos');
            if (dadosEmCache) {
                console.log('✅ Alunos obtidos do cache');
                return {
                    sucesso: true,
                    mensagem: 'Alunos obtidos do cache',
                    alunos: dadosEmCache
                };
            }
        }

        // Chamar função RPC para obter alunos com validação
        const { data, error } = await supabaseClient.rpc('obter_alunos_data', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario
        });

        if (error) {
            console.error('❌ Erro ao obter alunos:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter alunos: ${error.message}`,
                alunos: []
            };
        }

        // Se não retornar dados, credenciais são inválidas
        if (!data || data.length === 0) {
            console.log('⚠️ Credenciais inválidas ou nenhum aluno encontrado');
            return {
                sucesso: false,
                mensagem: 'Credenciais inválidas ou nenhum aluno encontrado',
                alunos: []
            };
        }

        console.log(`✅ ${data.length} alunos obtidos com sucesso`);

        // Transformar dados para o formato esperado
        const alunos = data.map(aluno => ({
            mat: aluno.mat,
            nome: aluno.nome,
            turma: aluno.turma,
            turno: aluno.turno,
            status: aluno.status
        }));

        // Salvar no cache
        salvarNoCache('alunos', alunos);

        return {
            sucesso: true,
            mensagem: 'Alunos obtidos com sucesso',
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter alunos:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

// Função para obter alunos de uma turma específica
async function obterAlunosTurma(nomeUsuario, senhaUsuario, turma, forcarRecarga = false) {
    try {
        console.log(`📚 Obtendo alunos da turma: ${turma}`);

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache(`alunos_turma_${turma}`);
            if (dadosEmCache) {
                console.log(`✅ Alunos da turma ${turma} obtidos do cache`);
                return {
                    sucesso: true,
                    mensagem: `Alunos da turma ${turma} obtidos do cache`,
                    alunos: dadosEmCache
                };
            }
        }

        // Chamar função RPC para obter alunos por turma
        const { data, error } = await supabaseClient.rpc('obter_alunos_data_por_turma', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario,
            p_turma: turma
        });

        if (error) {
            console.error('❌ Erro ao obter alunos da turma:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter alunos: ${error.message}`,
                alunos: []
            };
        }

        if (!data || data.length === 0) {
            console.log(`⚠️ Nenhum aluno encontrado na turma ${turma}`);
            return {
                sucesso: false,
                mensagem: `Nenhum aluno encontrado na turma ${turma}`,
                alunos: []
            };
        }

        console.log(`✅ ${data.length} alunos da turma ${turma} obtidos com sucesso`);

        // Transformar dados para o formato esperado
        const alunos = data.map(aluno => ({
            mat: aluno.mat,
            nome: aluno.nome,
            turma: aluno.turma,
            turno: aluno.turno,
            status: aluno.status
        }));

        // Salvar no cache
        salvarNoCache(`alunos_turma_${turma}`, alunos);

        return {
            sucesso: true,
            mensagem: `Alunos da turma ${turma} obtidos com sucesso`,
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter alunos da turma:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

/**
 * @deprecated Use obterTurmasDisponiveisNativo() em vez desta função
 */
// Função para obter turmas disponíveis (LEGADA)
async function obterTurmasDisponiveis(nomeUsuario, senhaUsuario, forcarRecarga = false) {
    console.warn('⚠️ obterTurmasDisponiveis() foi depreciada. Use obterTurmasDisponiveisNativo()');
    try {
        console.log('🏫 Obtendo turmas disponíveis...');

        // Verificar cache se não for forçar recarga
        if (!forcarRecarga) {
            const dadosEmCache = obterDoCache('turmas');
            if (dadosEmCache) {
                console.log('✅ Turmas obtidas do cache');
                return {
                    sucesso: true,
                    mensagem: 'Turmas obtidas do cache',
                    turmas: dadosEmCache
                };
            }
        }

        // Chamar função RPC para obter turmas
        const { data, error } = await supabaseClient.rpc('obter_turmas_disponiveis', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario
        });

        if (error) {
            console.error('❌ Erro ao obter turmas:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter turmas: ${error.message}`,
                turmas: []
            };
        }

        if (!data || data.length === 0) {
            console.log('⚠️ Nenhuma turma encontrada');
            return {
                sucesso: false,
                mensagem: 'Nenhuma turma encontrada',
                turmas: []
            };
        }

        console.log(`✅ ${data.length} turmas obtidas com sucesso`);

        // Extrair apenas os nomes das turmas
        const turmas = data.map(item => item.turma);

        // Salvar no cache
        salvarNoCache('turmas', turmas);

        return {
            sucesso: true,
            mensagem: 'Turmas obtidas com sucesso',
            turmas: turmas
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao obter turmas:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            turmas: []
        };
    }
}

// ========== FUNÇÕES DE CACHE ==========

/**
 * Obter dados do cache (sessionStorage)
 * @param {string} chave - Chave dos dados no cache
 * @returns {any} Dados armazenados ou null
 */
function obterDoCache(chave) {
    try {
        const dados = sessionStorage.getItem(`sabae_cache_${chave}`);
        return dados ? JSON.parse(dados) : null;
    } catch (erro) {
        console.warn(`⚠️ Erro ao ler cache (${chave}):`, erro);
        return null;
    }
}

/**
 * Salvar dados no cache (sessionStorage)
 * @param {string} chave - Chave para os dados
 * @param {any} dados - Dados a serem armazenados
 */
function salvarNoCache(chave, dados) {
    try {
        sessionStorage.setItem(`sabae_cache_${chave}`, JSON.stringify(dados));
        console.log(`✅ Cache salvo: ${chave}`);
    } catch (erro) {
        console.warn(`⚠️ Erro ao salvar cache (${chave}):`, erro);
    }
}

/**
 * Limpar todo o cache
 */
function limparCache() {
    try {
        const chaves = Object.keys(sessionStorage)
            .filter(chave => chave.startsWith('sabae_cache_'));

        chaves.forEach(chave => sessionStorage.removeItem(chave));
        console.log(`✅ Cache limpo (${chaves.length} itens removidos)`);
    } catch (erro) {
        console.warn('⚠️ Erro ao limpar cache:', erro);
    }
}

/**
 * Limpar cache de um item específico
 * @param {string} chave - Chave do item a limpar
 */
function limparCacheItem(chave) {
    try {
        sessionStorage.removeItem(`sabae_cache_${chave}`);
        console.log(`✅ Cache item limpo: ${chave}`);
    } catch (erro) {
        console.warn(`⚠️ Erro ao limpar cache item (${chave}):`, erro);
    }
}

// ========== FUNÇÕES DE INTEGRAÇÃO COM DROPDOWN (AUTH NATIVO) ==========

/**
 * Carrega as turmas disponíveis e popula um dropdown customizado (AUTH NATIVO)
 * @param {string} selectorDropdown - Seletor CSS do elemento dropdown (ex: '#salaDropdown')
 * @param {boolean} forcarRecarga - Força recarregar ignorando cache
 * @returns {Promise<boolean>} true se bem-sucedido
 */
async function carregarSalasNoDropdownNativo(selectorDropdown = '#salaDropdown', forcarRecarga = false) {
    try {
        console.log(`⏳ Carregando salas${forcarRecarga ? ' (forçada)' : ''} (AUTH NATIVO)...`);

        // Obter usuário autenticado
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.email) {
            throw new Error('Usuário não autenticado');
        }

        // Obter turmas disponíveis
        const resultado = await obterTurmasDisponiveisNativo(forcarRecarga);

        if (!resultado.sucesso || !resultado.turmas) {
            console.error('❌ Erro ao obter turmas:', resultado.mensagem);
            throw new Error(resultado.mensagem);
        }

        console.log(`✅ Dados carregados do Supabase`);

        const turmas = resultado.turmas;
        const dropdown = document.querySelector(selectorDropdown);

        if (!dropdown) {
            console.error(`❌ Elemento com seletor "${selectorDropdown}" não encontrado`);
            throw new Error(`Elemento ${selectorDropdown} não encontrado`);
        }

        // Carregar para dropdown customizado
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.innerHTML = ''; // Limpar itens existentes

            // Adicionar turmas como itens do dropdown customizado
            turmas.forEach(turma => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = turma;
                item.dataset.value = turma;
                dropdownMenu.appendChild(item);
            });

            // Atualizar label padrão
            const label = dropdown.querySelector('.dropdown-label');
            if (label) {
                label.textContent = turmas.length > 0 ? '-- Selecione uma sala --' : '-- Nenhuma sala disponível --';
            }
        }

        console.log(`✅ ${turmas.length} salas carregadas no dropdown`);
        return true;

    } catch (erro) {
        console.error('❌ Erro ao carregar salas:', erro);
        throw erro;
    }
}

/**
 * Carrega todos os alunos e armazena no sessionStorage (AUTH NATIVO)
 * Executado uma vez na inicialização da página
 */
async function carregarTodosAlunosNaSessionStorageNativo(forcarRecarga = false) {
    try {
        console.log('📚 Carregando TODOS os alunos para sessionStorage (AUTH NATIVO)...');

        // Verificar se já estão carregados (a menos que seja forçar recarga)
        if (!forcarRecarga) {
            const alunosEmCache = sessionStorage.getItem('sabae_todos_alunos');
            if (alunosEmCache) {
                console.log('✅ Alunos já estão carregados no sessionStorage');
                try {
                    const alunos = JSON.parse(alunosEmCache);
                    console.log(`✅ ${alunos.length} alunos disponíveis`);
                    return {
                        sucesso: true,
                        mensagem: 'Alunos já estavam carregados',
                        alunos: alunos
                    };
                } catch (e) {
                    console.warn('⚠️ Erro ao parsear dados do sessionStorage, recarregando...');
                }
            }
        }

        // Chamar função que usa auth nativo
        const resultado = await obterTodosAlunosNativo(forcarRecarga);

        if (!resultado.sucesso || !resultado.alunos) {
            console.error('❌ Erro ao obter alunos:', resultado.mensagem);
            return {
                sucesso: false,
                mensagem: resultado.mensagem,
                alunos: []
            };
        }

        const alunos = resultado.alunos;

        // ✅ Armazenar TODOS os alunos no sessionStorage
        sessionStorage.setItem('sabae_todos_alunos', JSON.stringify(alunos));
        console.log(`✅ ${alunos.length} alunos armazenados no sessionStorage`);

        return {
            sucesso: true,
            mensagem: `${alunos.length} alunos carregados com sucesso`,
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao carregar alunos:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

// ========== FUNÇÕES DE INTEGRAÇÃO COM DROPDOWN (LEGADAS - DEPRECIADAS) ==========

/**
 * @deprecated Use carregarSalasNoDropdownNativo() em vez desta função
 */
async function carregarSalasNoDropdown(selectorDropdown = '#salaDropdown', forcarRecarga = false) {
    console.warn('⚠️ carregarSalasNoDropdown() foi depreciada. Use carregarSalasNoDropdownNativo()');
    try {
        console.log(`⏳ Carregando salas${forcarRecarga ? ' (forçada)' : ''}...`);

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            throw new Error('Sessão expirou. Faça login novamente.');
        }

        // Obter turmas disponíveis
        const resultado = await obterTurmasDisponiveis(nomeUsuario, senhaUsuario, forcarRecarga);

        if (!resultado.sucesso || !resultado.turmas) {
            console.error('❌ Erro ao obter turmas:', resultado.mensagem);
            throw new Error(resultado.mensagem);
        }

        console.log(`✅ Dados carregados do Supabase`);

        const turmas = resultado.turmas;
        const dropdown = document.querySelector(selectorDropdown);

        if (!dropdown) {
            console.error(`❌ Elemento com seletor "${selectorDropdown}" não encontrado`);
            throw new Error(`Elemento ${selectorDropdown} não encontrado`);
        }

        // Carregar para dropdown customizado
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.innerHTML = ''; // Limpar itens existentes

            // Adicionar turmas como itens do dropdown customizado
            turmas.forEach(turma => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = turma;
                item.dataset.value = turma;
                dropdownMenu.appendChild(item);
            });

            // Atualizar label padrão
            const label = dropdown.querySelector('.dropdown-label');
            if (label) {
                label.textContent = turmas.length > 0 ? '-- Selecione uma sala --' : '-- Nenhuma sala disponível --';
            }
        }

        console.log(`✅ ${turmas.length} salas carregadas no dropdown`);
        return true;

    } catch (erro) {
        console.error('❌ Erro ao carregar salas:', erro);
        throw erro;
    }
}

/**
 * @deprecated Use carregarTodosAlunosNaSessionStorageNativo() em vez desta função
 */
async function carregarTodosAlunosNaSessionStorage(forcarRecarga = false) {
    console.warn('⚠️ carregarTodosAlunosNaSessionStorage() foi depreciada. Use carregarTodosAlunosNaSessionStorageNativo()');
    try {
        console.log('📚 Carregando TODOS os alunos para sessionStorage...');

        // Verificar se já estão carregados (a menos que seja forçar recarga)
        if (!forcarRecarga) {
            const alunosEmCache = sessionStorage.getItem('sabae_todos_alunos');
            if (alunosEmCache) {
                console.log('✅ Alunos já estão carregados no sessionStorage');
                try {
                    const alunos = JSON.parse(alunosEmCache);
                    console.log(`✅ ${alunos.length} alunos disponíveis`);
                    return {
                        sucesso: true,
                        mensagem: 'Alunos já estavam carregados',
                        alunos: alunos
                    };
                } catch (e) {
                    console.warn('⚠️ Erro ao parsear dados do sessionStorage, recarregando...');
                }
            }
        }

        // Obter credenciais da sessão
        const nomeUsuario = sessionStorage.getItem('usuario');
        const senhaUsuario = sessionStorage.getItem('usuarioSenha');

        if (!nomeUsuario || !senhaUsuario) {
            console.error('❌ Credenciais não encontradas na sessão');
            return {
                sucesso: false,
                mensagem: 'Credenciais não encontradas. Faça login novamente.',
                alunos: []
            };
        }

        // Chamar função RPC para obter todos os alunos
        const { data, error } = await supabaseClient.rpc('obter_alunos_data', {
            p_nome_usuario: nomeUsuario,
            p_senha_usuario: senhaUsuario
        });

        if (error) {
            console.error('❌ Erro ao obter alunos:', error);
            return {
                sucesso: false,
                mensagem: `Erro ao obter alunos: ${error.message}`,
                alunos: []
            };
        }

        if (!data || data.length === 0) {
            console.log('⚠️ Nenhum aluno encontrado');
            return {
                sucesso: false,
                mensagem: 'Nenhum aluno encontrado',
                alunos: []
            };
        }

        // Transformar dados para o formato esperado
        const alunos = data.map(aluno => ({
            mat: aluno.mat,
            nome: aluno.nome,
            turma: aluno.turma,
            turno: aluno.turno,
            status: aluno.status
        }));

        // ✅ Armazenar TODOS os alunos no sessionStorage
        sessionStorage.setItem('sabae_todos_alunos', JSON.stringify(alunos));
        console.log(`✅ ${alunos.length} alunos armazenados no sessionStorage`);

        // Também salvar no cache do Supabase para referência
        salvarNoCache('alunos', alunos);

        return {
            sucesso: true,
            mensagem: `${alunos.length} alunos carregados com sucesso`,
            alunos: alunos
        };

    } catch (erro) {
        console.error('❌ Erro inesperado ao carregar alunos:', erro);
        return {
            sucesso: false,
            mensagem: `Erro inesperado: ${erro.message}`,
            alunos: []
        };
    }
}

/**
 * Obter alunos de uma turma específica a partir do sessionStorage
 * Mais rápido pois usa dados já carregados
 */
function obterAlunosTurmaDaSessionStorage(turma) {
    try {
        const alunosJson = sessionStorage.getItem('sabae_todos_alunos');
        if (!alunosJson) {
            return {
                sucesso: false,
                mensagem: 'Alunos não foram carregados. Recarregue a página.',
                alunos: []
            };
        }

        const todosAlunos = JSON.parse(alunosJson);
        const alunosDaTurma = todosAlunos.filter(aluno => aluno.turma === turma);

        console.log(`✅ ${alunosDaTurma.length} alunos encontrados na turma: ${turma}`);

        return {
            sucesso: true,
            mensagem: `${alunosDaTurma.length} alunos encontrados na turma ${turma}`,
            alunos: alunosDaTurma
        };
    } catch (erro) {
        console.error('❌ Erro ao filtrar alunos:', erro);
        return {
            sucesso: false,
            mensagem: `Erro ao filtrar alunos: ${erro.message}`,
            alunos: []
        };
    }
}

/**
 * Recarrega dados - limpa cache e recarrega salas e alunos
 * Útil para adicionar um botão "Atualizar" na interface
 */
async function recarregarDados() {
    console.log('🔄 Recarregando dados...');
    limparCache();
    // Limpar também o sessionStorage de alunos para forçar recarga
    sessionStorage.removeItem('sabae_todos_alunos');

    // Recarregar alunos
    await carregarTodosAlunosNaSessionStorage(true);

    // Recarregar salas
    return await carregarSalasNoDropdown('#salaDropdown', true);
}
