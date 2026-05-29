/**
 * ============================================================
 * GESTAO.JS - SISTEMA DE GESTÃO CLÍNICA SOL NASCENTE
 * Frontend com Comunicação com API do Render
 * Versão: 12.0.0 (Corrigido - Endpoints com /api)
 * ============================================================
 * 
 * API Base: https://sol-nascente-api.onrender.com/api
 * Backend: Node.js + Express + Neon PostgreSQL
 * 
 * Regras:
 * - TODAS as requisições usam o prefixo /api
 * - Tokens armazenados no localStorage
 * - CRUD completo em todas as tabelas
 * 
 * ENDPOINTS CORRETOS:
 * - POST   /api/login
 * - GET    /api/financeiro
 * - POST   /api/financeiro
 * - PUT    /api/financeiro/:id
 * - DELETE /api/financeiro/:id
 * - GET    /api/servicos
 * - POST   /api/servicos
 * - PUT    /api/servicos/:id
 * - DELETE /api/servicos/:id
 * - GET    /api/saidas
 * - POST   /api/saidas
 * - DELETE /api/saidas/:id
 * - GET    /api/estoque
 * - PUT    /api/estoque/:id
 * - DELETE /api/estoque/:id
 * - POST   /api/estoque/movimentar
 * - GET    /api/estoque/movimentos
 * 
 * ============================================================
 */

// ============================================================
// SEÇÃO 1: CONFIGURAÇÕES GLOBAIS DA API
// ============================================================

const API_BASE_URL = 'https://sol-nascente-api.onrender.com/api';
const STORAGE_KEY = 'solNascenteSession';
const SESSION_DURATION_HOURS = 8;

// ============================================================
// SEÇÃO 2: GERADOR DE IDs ÚNICOS
// ============================================================

function gerarIdMovimento(prefixo) {
    const data = new Date();
    const anoMesDia = data.toISOString().slice(0, 10).replace(/-/g, '');
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    return `${prefixo}-${anoMesDia}-${aleatorio}`;
}

function gerarIdUsuario() {
    return gerarIdMovimento('USR');
}

function gerarIdServico() {
    return gerarIdMovimento('SRV');
}

function gerarIdFinanceiro() {
    return gerarIdMovimento('FIN');
}

function gerarIdSaida() {
    return gerarIdMovimento('SAI');
}

function gerarIdEstoquePrincipal() {
    return gerarIdMovimento('STK');
}

function gerarIdMovimentoEstoque() {
    return gerarIdMovimento('STM');
}

// ============================================================
// SEÇÃO 3: FUNÇÕES UTILITÁRIAS
// ============================================================

function formatarData(date) {
    if (!date) return '';
    
    let d;
    if (date instanceof Date) {
        d = date;
    } else if (typeof date === 'string') {
        if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) return date;
        const partes = date.split('-');
        if (partes.length === 3) {
            d = new Date(partes[0], partes[1] - 1, partes[2]);
        } else {
            d = new Date(date);
        }
    } else {
        d = new Date(date);
    }
    
    if (isNaN(d.getTime())) return '';
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarDataInput(date) {
    if (!date) return '';
    
    let d;
    if (date instanceof Date) {
        d = date;
    } else if (typeof date === 'string') {
        const partes = date.split('/');
        if (partes.length === 3) {
            d = new Date(partes[2], partes[1] - 1, partes[0]);
        } else {
            d = new Date(date);
        }
    } else {
        d = new Date(date);
    }
    
    if (isNaN(d.getTime())) return '';
    
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return 'AOA 0,00';
    }
    const numero = parseFloat(valor);
    const partes = numero.toFixed(2).split('.');
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimal = partes[1];
    return `AOA ${inteiro},${decimal}`;
}

function formatarNumero(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return '0';
    return parseInt(valor).toLocaleString('pt-AO');
}

function capitalizar(str) {
    if (!str) return '';
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function truncarTexto(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function dataHoje() {
    return formatarData(new Date());
}

function dataHoraAgora() {
    const agora = new Date();
    return formatarData(agora) + ' às ' + 
           String(agora.getHours()).padStart(2, '0') + ':' + 
           String(agora.getMinutes()).padStart(2, '0');
}

function getNomeMes(mes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || 'Mês inválido';
}

function gerarDescricaoFiltro(filtros) {
    if (!filtros || filtros.tipo_filtro === 'sem_filtro') {
        return 'Todos os registos';
    }
    
    let descricao = '';
    switch (filtros.tipo_filtro) {
        case 'hoje':
            descricao = `Hoje, ${dataHoje()}`;
            break;
        case 'mes_ano':
            descricao = `${getNomeMes(filtros.mes)} de ${filtros.ano}`;
            break;
        case 'ano':
            descricao = `Ano de ${filtros.ano}`;
            break;
        case 'intervalo':
            descricao = `${filtros.dataInicio} a ${filtros.dataFim}`;
            break;
        default:
            descricao = 'Todos os registos';
    }
    
    if (filtros.instituicao && filtros.instituicao !== 'Todos') {
        descricao += ` — ${filtros.instituicao}`;
    }
    
    return descricao;
}

// ============================================================
// SEÇÃO 4: SISTEMA DE TOAST E LOADER
// ============================================================

let activeRequests = 0;
let globalLoaderElement = null;

function showGlobalLoader(message = 'A processar...') {
    activeRequests++;
    
    if (globalLoaderElement) {
        const msgEl = globalLoaderElement.querySelector('.loader-message');
        if (msgEl) msgEl.textContent = message;
        return;
    }
    
    globalLoaderElement = document.createElement('div');
    globalLoaderElement.className = 'loader-overlay';
    globalLoaderElement.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p class="loader-message">${message}</p>
        </div>
    `;
    document.body.appendChild(globalLoaderElement);
}

function hideGlobalLoader() {
    activeRequests--;
    
    if (activeRequests <= 0) {
        activeRequests = 0;
        if (globalLoaderElement) {
            globalLoaderElement.remove();
            globalLoaderElement = null;
        }
    }
}

function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    let defaultTitle = '';
    
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            defaultTitle = 'Sucesso';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            defaultTitle = 'Erro';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            defaultTitle = 'Aviso';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            defaultTitle = 'Informação';
    }
    
    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitle}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5000);
}

// ============================================================
// SEÇÃO 5: GERENCIAMENTO DE SESSÃO
// ============================================================

function getSession() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const session = JSON.parse(stored);
        const expires = new Date(session.expires);
        const now = new Date();
        
        if (expires <= now) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        
        return session;
    } catch (e) {
        console.error('Erro ao ler sessão:', e);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function setSession(sessionData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
        console.error('Erro ao salvar sessão:', e);
    }
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}

function getCurrentUser() {
    const session = getSession();
    return session ? session.usuario : null;
}

function hasUnlimitedAccess() {
    const user = getCurrentUser();
    return user && user.acesso === 'ilimitado';
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.funcao === 'Administrador';
}

function getAuthToken() {
    const session = getSession();
    return session ? session.token : null;
}

// ============================================================
// SEÇÃO 6: API CLIENT (Render API - COM /api)
// ============================================================

async function apiRequest(endpoint, method = 'GET', data = null, loadingMessage = null) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    if (loadingMessage) showGlobalLoader(loadingMessage);
    
    try {
        // ENDPOINT CORRETO COM /api
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`📡 API Request: ${method} ${url}`);
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            console.error('API Error Response:', result);
            throw new Error(result.message || 'Erro na requisição');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        if (loadingMessage) hideGlobalLoader();
    }
}

async function apiRequestWithLoader(endpoint, method = 'GET', data = null, loadingMessage = 'A processar...') {
    return await apiRequest(endpoint, method, data, loadingMessage);
}

// ============================================================
// SEÇÃO 7: AUTENTICAÇÃO (COM /api)
// ============================================================

async function login(username, password) {
    showGlobalLoader('A autenticar utilizador...');
    
    try {
        console.log('🔐 Tentativa de login para:', username);
        console.log('📡 Endpoint:', '/login');
        
        // CORRETO: usa /api/login
        const result = await apiRequest('/login', 'POST', { username, senha: password });
        
        console.log('📥 Resposta do login:', result);
        
        if (result.success && result.data) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
            
            const sessionData = {
                token: 'session_' + Date.now(),
                usuario: result.data.usuario,
                loginTime: new Date().toISOString(),
                expires: expiresAt.toISOString()
            };
            
            setSession(sessionData);
            console.log('✅ Login bem-sucedido para:', username);
            return { success: true, usuario: result.data.usuario };
        } else {
            throw new Error(result.message || 'Credenciais inválidas');
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showToast(error.message, 'error');
        return { success: false, message: error.message };
    } finally {
        hideGlobalLoader();
    }
}

async function logout() {
    clearSession();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    showToast('Logout realizado com sucesso', 'success');
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    const icon = btn.querySelector('i');
    if (icon) {
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// ============================================================
// SEÇÃO 8: FUNÇÕES DE CRUD POR TABELA (COM /api)
// ============================================================

// ========== CONTROLO FINANCEIRO ==========

async function salvarMovimentoFinanceiro(dados) {
    // CORRETO: usa /api/financeiro
    return await apiRequestWithLoader('/financeiro', 'POST', dados, 'A registar movimento financeiro...');
}

async function listarMovimentosFinanceiro(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros.instituicao && filtros.instituicao !== 'Todos') params.append('instituicao', filtros.instituicao);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/financeiro?${queryString}` : '/financeiro';
    
    // CORRETO: usa /api/financeiro
    const result = await apiRequest(endpoint, 'GET');
    return result.data || [];
}

async function editarMovimentoFinanceiro(id, dados) {
    // CORRETO: usa /api/financeiro/:id
    return await apiRequestWithLoader(`/financeiro/${id}`, 'PUT', dados, 'A actualizar movimento...');
}

async function excluirMovimentoFinanceiro(id) {
    // CORRETO: usa /api/financeiro/:id
    return await apiRequestWithLoader(`/financeiro/${id}`, 'DELETE', null, 'A excluir movimento...');
}

// ========== SERVIÇOS PRESTADOS ==========

async function salvarServicoPrestado(dados) {
    // CORRETO: usa /api/servicos
    return await apiRequestWithLoader('/servicos', 'POST', dados, 'A registar serviço...');
}

async function listarServicosPrestados(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros.instituicao && filtros.instituicao !== 'Todos') params.append('instituicao', filtros.instituicao);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/servicos?${queryString}` : '/servicos';
    
    // CORRETO: usa /api/servicos
    const result = await apiRequest(endpoint, 'GET');
    return result.data || [];
}

async function editarServico(id, dados) {
    // CORRETO: usa /api/servicos/:id
    return await apiRequestWithLoader(`/servicos/${id}`, 'PUT', dados, 'A actualizar serviço...');
}

async function excluirServico(id) {
    // CORRETO: usa /api/servicos/:id
    return await apiRequestWithLoader(`/servicos/${id}`, 'DELETE', null, 'A excluir serviço...');
}

// ========== SAÍDAS DETALHADAS ==========

async function salvarSaidaDetalhada(dados) {
    // CORRETO: usa /api/saidas
    return await apiRequestWithLoader('/saidas', 'POST', dados, 'A registar saída...');
}

async function listarSaidasDetalhadas(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros.instituicao && filtros.instituicao !== 'Todos') params.append('instituicao', filtros.instituicao);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/saidas?${queryString}` : '/saidas';
    
    // CORRETO: usa /api/saidas
    const result = await apiRequest(endpoint, 'GET');
    return result.data || [];
}

async function excluirSaida(id) {
    // CORRETO: usa /api/saidas/:id
    return await apiRequestWithLoader(`/saidas/${id}`, 'DELETE', null, 'A excluir saída...');
}

// ========== ESTOQUE PRINCIPAL ==========

async function salvarProdutoEstoque(dados) {
    // CORRETO: usa /api/estoque
    return await apiRequestWithLoader('/estoque', 'POST', dados, 'A registar produto...');
}

async function listarProdutosEstoque(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.instituicao && filtros.instituicao !== 'Todos') params.append('instituicao', filtros.instituicao);
    if (filtros.nome_produto) params.append('nome_produto', filtros.nome_produto);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/estoque?${queryString}` : '/estoque';
    
    // CORRETO: usa /api/estoque
    const result = await apiRequest(endpoint, 'GET');
    return result.data || [];
}

async function editarProdutoEstoque(id, dados) {
    // CORRETO: usa /api/estoque/:id
    return await apiRequestWithLoader(`/estoque/${id}`, 'PUT', dados, 'A actualizar produto...');
}

async function excluirProdutoEstoque(id) {
    // CORRETO: usa /api/estoque/:id
    return await apiRequestWithLoader(`/estoque/${id}`, 'DELETE', null, 'A excluir produto...');
}

// ========== MOVIMENTOS DE ESTOQUE ==========

async function salvarMovimentoEstoque(dados) {
    // CORRETO: usa /api/estoque/movimentar
    return await apiRequestWithLoader('/estoque/movimentar', 'POST', dados, 'A registar movimento de stock...');
}

async function listarMovimentosEstoque(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros.instituicao && filtros.instituicao !== 'Todos') params.append('instituicao', filtros.instituicao);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/estoque/movimentos?${queryString}` : '/estoque/movimentos';
    
    // CORRETO: usa /api/estoque/movimentos
    const result = await apiRequest(endpoint, 'GET');
    return result.data || [];
}

// ========== DASHBOARD ==========

async function getDashboardData() {
    try {
        const [financeiro, servicos, estoque] = await Promise.all([
            listarMovimentosFinanceiro(),
            listarServicosPrestados(),
            listarProdutosEstoque()
        ]);
        
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        for (const mov of financeiro) {
            totalEntradas += (mov.entradas_caixa || 0) + (mov.entradas_banco || 0);
            totalSaidas += (mov.saidas_caixa || 0) + (mov.saidas_banco || 0);
        }
        
        const alertas = estoque.filter(p => p.quantidade_atual <= 5 || 
            (p.data_expiracao && new Date(p.data_expiracao) <= new Date(Date.now() + 30*24*60*60*1000)));
        
        return {
            success: true,
            data: {
                metricas: {
                    total_entradas: totalEntradas,
                    total_saidas: totalSaidas,
                    saldo: totalEntradas - totalSaidas,
                    total_servicos: servicos.reduce((sum, s) => sum + (s.quantidade || 1), 0)
                },
                alertas: alertas.slice(0, 10)
            }
        };
    } catch (error) {
        console.error('Erro no dashboard:', error);
        return { success: false, data: null, message: error.message };
    }
}

// ============================================================
// SEÇÃO 9: CATÁLOGO DE SERVIÇOS
// ============================================================

const CATALOGO_SERVICOS = {
    consultas: {
        label: 'Consultas',
        icone: 'fas fa-stethoscope',
        servicos: [
            { key: 'medicina_geral', label: 'Medicina Geral' },
            { key: 'gineco_obstetricia', label: 'Gineco-Obstetrícia' },
            { key: 'pediatria', label: 'Pediatria' },
            { key: 'dermatologia', label: 'Dermatologia' },
            { key: 'consulta_com_enfermeiro', label: 'Consulta c/ Enfermeiro' },
            { key: 'a_pressao_arterial', label: 'Pressão Arterial' }
        ]
    },
    exames_hematologicos: {
        label: 'Exames Hematológicos',
        icone: 'fas fa-tint',
        servicos: [
            { key: 'hemograma', label: 'Hemograma' },
            { key: 'hemoglobina', label: 'Hemoglobina' },
            { key: 'hematocrito', label: 'Hematócrito' },
            { key: 'leucograma', label: 'Leucograma' },
            { key: 't_hemorragia', label: 'T. Hemorragia' },
            { key: 't_coagulacao', label: 'T. Coagulação' },
            { key: 'grupo_sanguineo', label: 'Grupo Sanguíneo' },
            { key: 'falciformacao', label: 'Falciformação' },
            { key: 'v_sanguinea', label: 'V. Sanguínea' }
        ]
    },
    exames_serologicos: {
        label: 'Exames Serológicos',
        icone: 'fas fa-microscope',
        servicos: [
            { key: 'reaccao_widal', label: 'Reacção Widal' },
            { key: 'sifilis_vdrl', label: 'Sífilis (V.D.R.L.)' },
            { key: 'hepatite_b_hbv', label: 'Hepatite B (H.B.V)' },
            { key: 'hepatite_c_hcv', label: 'Hepatite C (H.C.V)' },
            { key: 'pcr', label: 'P.C.R' },
            { key: 'psa', label: 'P.S.A' },
            { key: 'factor_reumatoide', label: 'Factor Reumatóide' },
            { key: 'helicobacter_pylori_hp', label: 'Helicobacter Pylori (H.P)' },
            { key: 'hiv', label: 'H.I.V' },
            { key: 'dengue', label: 'Dengue' }
        ]
    },
    exames_bioquimicos: {
        label: 'Exames Bioquímicos',
        icone: 'fas fa-flask',
        servicos: [
            { key: 'glicemia', label: 'Glicémia' },
            { key: 'creatinina', label: 'Creatinina' },
            { key: 'ureia', label: 'Ureia' },
            { key: 'colesterol', label: 'Colesterol' },
            { key: 'tgo', label: 'T.G.O' },
            { key: 'tgp', label: 'T.G.P' },
            { key: 'acido_urico', label: 'Ácido Úrico' },
            { key: 'proteina_total', label: 'Proteína Total' },
            { key: 'triglicerido', label: 'Triglicérido' },
            { key: 'ldl', label: 'L.D.L' },
            { key: 'hdl', label: 'H.D.L' }
        ]
    },
    exames_urologia: {
        label: 'Exames de Urologia',
        icone: 'fas fa-vial',
        servicos: [
            { key: 'urina', label: 'Urina' },
            { key: 'exudado_vaginal', label: 'Exudado Vaginal' },
            { key: 'exudado_uretral', label: 'Exudado Uretral' },
            { key: 'espermograma', label: 'Espermograma' }
        ]
    },
    exames_parasitologicos: {
        label: 'Exames Parasitológicos',
        icone: 'fas fa-bug',
        servicos: [
            { key: 'pesquisa_plasmodio_pp', label: 'Pesquisa de Plasmódio (P.P)' },
            { key: 'filaria', label: 'Filária' },
            { key: 'fezes', label: 'Fezes' }
        ]
    },
    outros: {
        label: 'Outros Serviços',
        icone: 'fas fa-plus-circle',
        input_manual: true,
        placeholder: 'Descreva o serviço...'
    }
};

function gerarOpcoesServicos() {
    let html = '';
    for (const cat in CATALOGO_SERVICOS) {
        const categoria = CATALOGO_SERVICOS[cat];
        html += `<optgroup label="${categoria.label}">`;
        if (categoria.servicos) {
            categoria.servicos.forEach(servico => {
                html += `<option value="${servico.key}" data-label="${servico.label}">${servico.label}</option>`;
            });
        }
        if (categoria.input_manual) {
            html += `<option value="outros">Outro Serviço (digitar)</option>`;
        }
        html += `</optgroup>`;
    }
    return html;
}

// ============================================================
// SEÇÃO 10: SISTEMA DE FILTROS
// ============================================================

let currentFilters = {
    tipo_filtro: 'mes_ano',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    instituicao: 'Todos'
};

let currentPage = 'dashboard';

function getCurrentFilters() {
    return { ...currentFilters };
}

function initFilters() {
    const tipoSelect = document.getElementById('tipoFiltro');
    const mesAnoGroup = document.getElementById('mesAnoGroup');
    const anoGroup = document.getElementById('anoGroup');
    const intervaloGroup = document.getElementById('intervaloGroup');
    const hoje = new Date();
    
    document.getElementById('mesFiltro').value = hoje.getMonth() + 1;
    document.getElementById('anoFiltro').value = hoje.getFullYear();
    document.getElementById('anoOnlyFiltro').value = hoje.getFullYear();
    
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    document.getElementById('dataInicioFiltro').value = formatarDataInput(primeiroDiaMes);
    document.getElementById('dataFimFiltro').value = formatarDataInput(ultimoDiaMes);
    
    tipoSelect.addEventListener('change', function() {
        mesAnoGroup.style.display = 'none';
        anoGroup.style.display = 'none';
        intervaloGroup.style.display = 'none';
        
        if (this.value === 'mes_ano') mesAnoGroup.style.display = 'flex';
        else if (this.value === 'ano') anoGroup.style.display = 'flex';
        else if (this.value === 'intervalo') intervaloGroup.style.display = 'flex';
    });
    
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        currentFilters.tipo_filtro = tipoSelect.value;
        currentFilters.instituicao = document.getElementById('instituicaoFiltro').value;
        
        if (tipoSelect.value === 'mes_ano') {
            currentFilters.mes = parseInt(document.getElementById('mesFiltro').value);
            currentFilters.ano = parseInt(document.getElementById('anoFiltro').value);
            const primeiroDia = new Date(currentFilters.ano, currentFilters.mes - 1, 1);
            const ultimoDia = new Date(currentFilters.ano, currentFilters.mes, 0);
            currentFilters.dataInicio = formatarDataInput(primeiroDia);
            currentFilters.dataFim = formatarDataInput(ultimoDia);
        } else if (tipoSelect.value === 'ano') {
            currentFilters.ano = parseInt(document.getElementById('anoOnlyFiltro').value);
            currentFilters.dataInicio = `${currentFilters.ano}-01-01`;
            currentFilters.dataFim = `${currentFilters.ano}-12-31`;
        } else if (tipoSelect.value === 'intervalo') {
            currentFilters.dataInicio = document.getElementById('dataInicioFiltro').value;
            currentFilters.dataFim = document.getElementById('dataFimFiltro').value;
        }
        
        loadPage(currentPage);
        showToast('Filtros aplicados com sucesso', 'success');
    });
    
    document.getElementById('clearFiltersBtn').addEventListener('click', function() {
        tipoSelect.value = 'sem_filtro';
        mesAnoGroup.style.display = 'none';
        anoGroup.style.display = 'none';
        intervaloGroup.style.display = 'none';
        document.getElementById('instituicaoFiltro').value = 'Todos';
        currentFilters = { tipo_filtro: 'sem_filtro', instituicao: 'Todos' };
        loadPage(currentPage);
        showToast('Filtros limpos', 'info');
    });
}

// ============================================================
// SEÇÃO 11: NAVEGAÇÃO SPA
// ============================================================

async function loadPage(page) {
    currentPage = page;
    const contentDiv = document.getElementById('pageContent');
    
    contentDiv.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-metrics">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
            <div class="skeleton-table">
                <div class="skeleton-header"></div>
                <div class="skeleton-row"></div>
                <div class="skeleton-row"></div>
                <div class="skeleton-row"></div>
            </div>
        </div>
    `;
    
    try {
        let html = '';
        
        switch (page) {
            case 'dashboard':
                html = await renderDashboard();
                break;
            case 'financeiro':
                html = await renderFinanceiro();
                break;
            case 'servicos':
                html = await renderServicos();
                break;
            case 'saidas':
                html = await renderSaidas();
                break;
            case 'estoque':
                html = await renderEstoque();
                break;
            case 'relatorios':
                html = await renderRelatorios();
                break;
            default:
                html = '<div class="error-page"><i class="fas fa-exclamation-triangle"></i><h3>Página não encontrada</h3></div>';
        }
        
        contentDiv.innerHTML = html;
        
        switch (page) {
            case 'dashboard':
                await initDashboard();
                break;
            case 'financeiro':
                await initFinanceiro();
                break;
            case 'servicos':
                await initServicos();
                break;
            case 'saidas':
                await initSaidas();
                break;
            case 'estoque':
                await initEstoque();
                break;
            case 'relatorios':
                await initRelatorios();
                break;
        }
        
        document.querySelectorAll('.nav-item, .bottom-nav-item, .mobile-nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        document.querySelectorAll(`.nav-item[data-page="${page}"], .bottom-nav-item[data-page="${page}"], .mobile-nav-item[data-page="${page}"]`).forEach(nav => {
            nav.classList.add('active');
        });
        
    } catch (error) {
        console.error('Erro ao carregar página:', error);
        contentDiv.innerHTML = `<div class="error-page"><i class="fas fa-exclamation-triangle"></i><h3>Erro ao carregar página</h3><p>${error.message}</p></div>`;
        showToast(error.message, 'error');
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item, .bottom-nav-item, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page && page !== 'mais') {
                await loadPage(page);
                document.getElementById('mobileMenuSheet')?.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });
    });
    
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileUserBtn = document.getElementById('mobileUserBtn');
    
    mobileMenuBtn?.addEventListener('click', () => {
        document.getElementById('mobileMenuSheet')?.classList.add('open');
    });
    
    mobileMenuClose?.addEventListener('click', () => {
        document.getElementById('mobileMenuSheet')?.classList.remove('open');
    });
    
    mobileUserBtn?.addEventListener('click', () => {
        document.getElementById('mobileMenuSheet')?.classList.add('open');
    });
    
    sidebarOverlay?.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
    });
    
    sidebarToggle?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('logoutMobileBtn')?.addEventListener('click', logout);
    
    const moreMenuBtn = document.getElementById('moreMenuBtn');
    moreMenuBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('mobileMenuSheet')?.classList.add('open');
    });
}

// ============================================================
// SEÇÃO 12: MODAL SYSTEM
// ============================================================

let currentModalCallback = null;

function openModal(title, body, footer, onClose = null) {
    const modal = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');
    
    titleEl.innerHTML = title;
    bodyEl.innerHTML = body;
    footerEl.innerHTML = footer;
    modal.style.display = 'flex';
    
    currentModalCallback = onClose;
}

function fecharModal() {
    const modal = document.getElementById('modalContainer');
    modal.style.display = 'none';
    
    if (currentModalCallback) {
        currentModalCallback();
        currentModalCallback = null;
    }
}

// ============================================================
// SEÇÃO 13: DASHBOARD MODULE
// ============================================================

async function renderDashboard() {
    return `
        <div class="dashboard-container">
            <div class="grid grid-4" id="metricasDashboard">
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-arrow-down"></i></div><div class="metric-value">-</div><div class="metric-label">Total de Entradas</div></div>
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-arrow-up"></i></div><div class="metric-value">-</div><div class="metric-label">Total de Saídas</div></div>
                <div class="metric-card highlight"><div class="metric-icon"><i class="fas fa-balance-scale"></i></div><div class="metric-value">-</div><div class="metric-label">Saldo do Período</div></div>
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-clipboard-list"></i></div><div class="metric-value">-</div><div class="metric-label">Serviços Realizados</div></div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-trophy"></i> TOP 5 Serviços Mais Realizados</h3></div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table-zebra">
                            <thead><tr><th>Posição</th><th>Serviço</th><th>Instituição</th><th>Quantidade</th><th>Receita Total</th></tr></thead>
                            <tbody id="rankingBody"><tr><td colspan="5" class="text-center">Carregando... </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-exclamation-triangle"></i> Alertas de Stock</h3></div>
                <div class="card-body" id="alertasBody"><div class="text-center">Carregando...</div></div>
            </div>
        </div>
    `;
}

async function initDashboard() {
    await carregarMetricasDashboard();
    await carregarRankingDashboard();
    await carregarAlertasDashboard();
}

async function carregarMetricasDashboard() {
    try {
        const resultado = await getDashboardData();
        
        if (resultado.success && resultado.data?.metricas) {
            const m = resultado.data.metricas;
            document.getElementById('metricasDashboard').innerHTML = `
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-arrow-down"></i></div><div class="metric-value">${formatarMoeda(m.total_entradas || 0)}</div><div class="metric-label">Total de Entradas</div></div>
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-arrow-up"></i></div><div class="metric-value">${formatarMoeda(m.total_saidas || 0)}</div><div class="metric-label">Total de Saídas</div></div>
                <div class="metric-card highlight"><div class="metric-icon"><i class="fas fa-balance-scale"></i></div><div class="metric-value">${formatarMoeda(m.saldo || 0)}</div><div class="metric-label">Saldo do Período</div></div>
                <div class="metric-card"><div class="metric-icon"><i class="fas fa-clipboard-list"></i></div><div class="metric-value">${formatarNumero(m.total_servicos || 0)}</div><div class="metric-label">Serviços Realizados</div></div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
    }
}

async function carregarRankingDashboard() {
    try {
        const servicos = await listarServicosPrestados();
        if (servicos && servicos.length) {
            const agrupado = {};
            
            for (const s of servicos) {
                const chave = s.tipo_servico;
                if (!agrupado[chave]) {
                    agrupado[chave] = { tipo_servico: s.tipo_servico, instituicao: s.instituicao, quantidade: 0, receita: 0 };
                }
                agrupado[chave].quantidade += s.quantidade || 1;
                agrupado[chave].receita += (s.caixa || 0) + (s.banco || 0);
            }
            
            const ranking = Object.values(agrupado).sort((a, b) => b.receita - a.receita).slice(0, 5);
            let html = '';
            ranking.forEach((item, index) => {
                const medalha = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}º`));
                html += `<tr>
                    <td>${medalha}</td>
                    <td><strong>${capitalizar(item.tipo_servico)}</strong></td>
                    <td>${item.instituicao}</td>
                    <td>${formatarNumero(item.quantidade)}</td>
                    <td>${formatarMoeda(item.receita)}</td>
                </td>`;
            });
            document.getElementById('rankingBody').innerHTML = html;
        } else {
            document.getElementById('rankingBody').innerHTML = '<tr><td colspan="5" class="text-center">Nenhum serviço encontrado</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

async function carregarAlertasDashboard() {
    try {
        const estoque = await listarProdutosEstoque();
        if (estoque && estoque.length) {
            const alertas = estoque.filter(p => p.quantidade_atual <= 5 || 
                (p.data_expiracao && new Date(p.data_expiracao) <= new Date(Date.now() + 30*24*60*60*1000)));
            let html = '';
            for (const a of alertas.slice(0, 10)) {
                const status = a.quantidade_atual === 0 ? 'Esgotado' : (a.quantidade_atual <= 5 ? 'Stock Baixo' : 'A expirar');
                const alertClass = a.quantidade_atual === 0 ? 'badge-danger' : 'badge-warning';
                html += `<div style="padding:12px; border-bottom:1px solid var(--cor-borda);">
                            <span class="badge ${alertClass}">${status}</span> 
                            <strong>${capitalizar(a.nome_produto)}</strong> (${a.instituicao})<br>
                            <small>Stock actual: ${a.quantidade_atual} unidades | Expiração: ${a.data_expiracao || 'N/A'}</small>
                         </div>`;
            }
            document.getElementById('alertasBody').innerHTML = html || '<div class="empty-state">Nenhum alerta de stock</div>';
        } else {
            document.getElementById('alertasBody').innerHTML = '<div class="empty-state">Nenhum alerta de stock</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
    }
}

// ============================================================
// SEÇÃO 14: FINANCEIRO MODULE
// ============================================================

let financeiroDados = [];

async function renderFinanceiro() {
    return `
        <div class="financeiro-container">
            <div style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <h2 style="margin:0;"><i class="fas fa-coins"></i> Controlo Financeiro</h2>
                <button class="btn-primary" onclick="abrirModalFinanceiro()"><i class="fas fa-plus"></i> Novo Movimento</button>
            </div>
            <div class="grid grid-3" id="resumoFinanceiro">
                <div class="metric-card"><div class="metric-value">-</div><div class="metric-label">Total Entradas</div></div>
                <div class="metric-card"><div class="metric-value">-</div><div class="metric-label">Total Saídas</div></div>
                <div class="metric-card highlight"><div class="metric-value">-</div><div class="metric-label">Saldo Final</div></div>
            </div>
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-list"></i> Movimentos Financeiros</h3></div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table-zebra">
                            <thead><tr><th>ID</th><th>Data</th><th>Instituição</th><th>Descrição</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Registador</th><th>Ações</th></tr></thead>
                            <tbody id="financeiroBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function initFinanceiro() {
    await carregarFinanceiro();
    await carregarResumoFinanceiro();
}

async function carregarFinanceiro() {
    try {
        const filtros = {};
        if (currentFilters.dataInicio && currentFilters.dataFim) {
            filtros.data_inicio = currentFilters.dataInicio;
            filtros.data_fim = currentFilters.dataFim;
        }
        if (currentFilters.instituicao && currentFilters.instituicao !== 'Todos') {
            filtros.instituicao = currentFilters.instituicao;
        }
        
        const result = await listarMovimentosFinanceiro(filtros);
        
        if (result && result.length > 0) {
            financeiroDados = result;
            const podeEditar = hasUnlimitedAccess();
            let html = '';
            
            for (const mov of financeiroDados) {
                const totalEntradas = (mov.entradas_caixa || 0) + (mov.entradas_banco || 0);
                const totalSaidas = (mov.saidas_caixa || 0) + (mov.saidas_banco || 0);
                html += `<tr>
                    <td><code>${mov.id || '-'}</code></td>
                    <td>${formatarData(mov.data)}</td>
                    <td>${mov.instituicao || '-'}</td>
                    <td>${truncarTexto(mov.descricao_entradas || mov.descricao_saidas || '-', 30)}</td>
                    <td class="text-success">${formatarMoeda(totalEntradas)}</td>
                    <td class="text-danger">${formatarMoeda(totalSaidas)}</td>
                    <td><strong>${formatarMoeda(totalEntradas - totalSaidas)}</strong></td>
                    <td>${mov.registador || '-'}</td>
                    <td>
                        ${podeEditar ? `<button class="btn-sm btn-outline" onclick="editarMovimentoFinanceiro('${mov.id}')"><i class="fas fa-edit"></i></button> <button class="btn-sm btn-danger" onclick="excluirMovimentoFinanceiro('${mov.id}')"><i class="fas fa-trash"></i></button>` : '<span class="badge badge-info">Leitura</span>'}
                     </td>
                 </tr>`;
            }
            document.getElementById('financeiroBody').innerHTML = html;
        } else {
            document.getElementById('financeiroBody').innerHTML = '<tr><td colspan="9" class="text-center">Nenhum movimento encontrado</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar financeiro:', error);
        document.getElementById('financeiroBody').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Erro ao carregar dados</td></tr>';
    }
}

async function carregarResumoFinanceiro() {
    try {
        const movimentos = await listarMovimentosFinanceiro();
        if (movimentos && movimentos.length > 0) {
            let totalEntradas = 0, totalSaidas = 0;
            for (const mov of movimentos) {
                totalEntradas += (mov.entradas_caixa || 0) + (mov.entradas_banco || 0);
                totalSaidas += (mov.saidas_caixa || 0) + (mov.saidas_banco || 0);
            }
            document.getElementById('resumoFinanceiro').innerHTML = `
                <div class="metric-card"><div class="metric-value">${formatarMoeda(totalEntradas)}</div><div class="metric-label">Total Entradas</div></div>
                <div class="metric-card"><div class="metric-value">${formatarMoeda(totalSaidas)}</div><div class="metric-label">Total Saídas</div></div>
                <div class="metric-card highlight"><div class="metric-value">${formatarMoeda(totalEntradas - totalSaidas)}</div><div class="metric-label">Saldo Final</div></div>
            `;
        } else {
            document.getElementById('resumoFinanceiro').innerHTML = `
                <div class="metric-card"><div class="metric-value">AOA 0,00</div><div class="metric-label">Total Entradas</div></div>
                <div class="metric-card"><div class="metric-value">AOA 0,00</div><div class="metric-label">Total Saídas</div></div>
                <div class="metric-card highlight"><div class="metric-value">AOA 0,00</div><div class="metric-label">Saldo Final</div></div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
    }
}

function abrirModalFinanceiro() {
    openModal('Novo Movimento Financeiro', `
        <form id="formFinanceiro">
            <div class="form-row">
                <div class="form-group"><label>Data <span class="required">*</span></label><input type="date" id="finData" class="form-control" value="${formatarDataInput(new Date())}" required></div>
                <div class="form-group"><label>Instituição <span class="required">*</span></label><select id="finInst" class="form-control" required><option value="Consultório">Consultório</option><option value="Laboratório">Laboratório</option></select></div>
            </div>
            <div class="form-group"><label>Descrição das Entradas</label><input type="text" id="finDescE" class="form-control" placeholder="Ex: Consultas, Exames"></div>
            <div class="form-row"><div class="form-group"><label>Entradas Caixa</label><input type="number" id="finEC" class="form-control" step="0.01" value="0"></div><div class="form-group"><label>Entradas Banco</label><input type="number" id="finEB" class="form-control" step="0.01" value="0"></div></div>
            <div class="form-group"><label>Descrição das Saídas</label><input type="text" id="finDescS" class="form-control" placeholder="Ex: Compras, Pagamentos"></div>
            <div class="form-row"><div class="form-group"><label>Saídas Caixa</label><input type="number" id="finSC" class="form-control" step="0.01" value="0"></div><div class="form-group"><label>Saídas Banco</label><input type="number" id="finSB" class="form-control" step="0.01" value="0"></div></div>
            <input type="hidden" id="finId">
        </form>
    `, `
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarMovimentoFinanceiro()">Salvar</button>
    `);
}

async function editarMovimentoFinanceiro(id) {
    const movimento = financeiroDados.find(m => m.id === id);
    if (!movimento) return;
    
    openModal('Editar Movimento Financeiro', `
        <form id="formFinanceiro">
            <div class="form-row">
                <div class="form-group"><label>Data</label><input type="date" id="finData" class="form-control" value="${formatarDataInput(movimento.data)}"></div>
                <div class="form-group"><label>Instituição</label><select id="finInst" class="form-control"><option value="Consultório" ${movimento.instituicao === 'Consultório' ? 'selected' : ''}>Consultório</option><option value="Laboratório" ${movimento.instituicao === 'Laboratório' ? 'selected' : ''}>Laboratório</option></select></div>
            </div>
            <div class="form-group"><label>Descrição Entradas</label><input type="text" id="finDescE" class="form-control" value="${escapeHtml(movimento.descricao_entradas || '')}"></div>
            <div class="form-row"><div class="form-group"><label>Entradas Caixa</label><input type="number" id="finEC" class="form-control" step="0.01" value="${movimento.entradas_caixa || 0}"></div><div class="form-group"><label>Entradas Banco</label><input type="number" id="finEB" class="form-control" step="0.01" value="${movimento.entradas_banco || 0}"></div></div>
            <div class="form-group"><label>Descrição Saídas</label><input type="text" id="finDescS" class="form-control" value="${escapeHtml(movimento.descricao_saidas || '')}"></div>
            <div class="form-row"><div class="form-group"><label>Saídas Caixa</label><input type="number" id="finSC" class="form-control" step="0.01" value="${movimento.saidas_caixa || 0}"></div><div class="form-group"><label>Saídas Banco</label><input type="number" id="finSB" class="form-control" step="0.01" value="${movimento.saidas_banco || 0}"></div></div>
            <input type="hidden" id="finId" value="${id}">
        </form>
    `, `
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarMovimentoFinanceiroEdicao()">Salvar</button>
    `);
}

async function salvarMovimentoFinanceiro() {
    const data = document.getElementById('finData').value;
    const instituicao = document.getElementById('finInst').value;
    
    if (!data || !instituicao) {
        showToast('Preencha os campos obrigatórios', 'warning');
        return;
    }
    
    const user = getCurrentUser();
    const payload = {
        data: data,
        instituicao: instituicao,
        descricao_entradas: document.getElementById('finDescE').value,
        entradas_caixa: parseFloat(document.getElementById('finEC').value) || 0,
        entradas_banco: parseFloat(document.getElementById('finEB').value) || 0,
        descricao_saidas: document.getElementById('finDescS').value,
        saidas_caixa: parseFloat(document.getElementById('finSC').value) || 0,
        saidas_banco: parseFloat(document.getElementById('finSB').value) || 0,
        registador: user?.nome || 'Sistema'
    };
    
    try {
        const result = await salvarMovimentoFinanceiro(payload);
        if (result.success) {
            showToast('Movimento registado com sucesso', 'success');
            fecharModal();
            await initFinanceiro();
        } else {
            showToast(result.message || 'Erro ao registar movimento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(error.message, 'error');
    }
}

async function salvarMovimentoFinanceiroEdicao() {
    const id = document.getElementById('finId').value;
    const data = document.getElementById('finData').value;
    const instituicao = document.getElementById('finInst').value;
    
    const payload = {
        data: data,
        instituicao: instituicao,
        descricao_entradas: document.getElementById('finDescE').value,
        entradas_caixa: parseFloat(document.getElementById('finEC').value) || 0,
        entradas_banco: parseFloat(document.getElementById('finEB').value) || 0,
        descricao_saidas: document.getElementById('finDescS').value,
        saidas_caixa: parseFloat(document.getElementById('finSC').value) || 0,
        saidas_banco: parseFloat(document.getElementById('finSB').value) || 0
    };
    
    try {
        const result = await editarMovimentoFinanceiro(id, payload);
        if (result.success) {
            showToast('Movimento actualizado com sucesso', 'success');
            fecharModal();
            await initFinanceiro();
        } else {
            showToast(result.message || 'Erro ao actualizar movimento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        showToast(error.message, 'error');
    }
}

async function excluirMovimentoFinanceiro(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir este movimento? Esta acção não pode ser desfeita.')) return;
    
    try {
        const result = await excluirMovimentoFinanceiro(id);
        if (result.success) {
            showToast('Movimento excluído com sucesso', 'success');
            await initFinanceiro();
        } else {
            showToast(result.message || 'Erro ao excluir movimento', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast(error.message, 'error');
    }
}

// ============================================================
// SEÇÃO 15: SERVIÇOS MODULE (Resumido)
// ============================================================

let servicosDados = [];

async function renderServicos() {
    const opcoesServicos = gerarOpcoesServicos();
    return `
        <div class="servicos-container">
            <div style="margin-bottom:24px; display:flex; justify-content:space-between"><h2><i class="fas fa-stethoscope"></i> Serviços Prestados</h2><button class="btn-primary" onclick="abrirModalServico()"><i class="fas fa-plus"></i> Registrar Serviço</button></div>
            <div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Lista de Serviços</h3></div><div class="card-body"><div class="table-container"><table class="table-zebra"><thead><tr><th>ID</th><th>Data</th><th>Instituição</th><th>Serviço</th><th>QTD</th><th>Valor Total</th><th>Registrador</th><th>Ações</th></tr></thead><tbody id="servicosBody"></tbody></table></div></div></div>
        </div>
    `;
}

async function initServicos() {
    await carregarServicos();
}

async function carregarServicos() {
    try {
        const filtros = {};
        if (currentFilters.dataInicio && currentFilters.dataFim) {
            filtros.data_inicio = currentFilters.dataInicio;
            filtros.data_fim = currentFilters.dataFim;
        }
        if (currentFilters.instituicao && currentFilters.instituicao !== 'Todos') {
            filtros.instituicao = currentFilters.instituicao;
        }
        
        const result = await listarServicosPrestados(filtros);
        
        if (result && result.length > 0) {
            servicosDados = result;
            const podeEditar = hasUnlimitedAccess();
            let html = '';
            
            for (const serv of servicosDados) {
                html += `</tr>
                    <td><code>${serv.id || '-'}</code></td>
                    <td>${formatarData(serv.data)}</td>
                    <td>${serv.instituicao || '-'}</td>
                    <td><strong>${capitalizar(serv.tipo_servico)}</strong></td>
                    <td>${serv.quantidade || 1}</td>
                    <td class="text-success">${formatarMoeda((serv.caixa || 0) + (serv.banco || 0))}</td>
                    <td>${serv.registador || '-'}</td>
                    <td>
                        ${podeEditar ? `<button class="btn-sm btn-outline" onclick="editarServico('${serv.id}')"><i class="fas fa-edit"></i></button> <button class="btn-sm btn-danger" onclick="excluirServico('${serv.id}')"><i class="fas fa-trash"></i></button>` : '<span class="badge badge-info">Leitura</span>'}
                     </td>
                 </tr>`;
            }
            document.getElementById('servicosBody').innerHTML = html;
        } else {
            document.getElementById('servicosBody').innerHTML = '<tr><td colspan="8" class="text-center">Nenhum serviço encontrado</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        document.getElementById('servicosBody').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar dados</td></tr>';
    }
}

function abrirModalServico() {
    const opcoesServicos = gerarOpcoesServicos();
    openModal('Registrar Serviço', `
        <form id="formServico">
            <div class="form-row">
                <div class="form-group"><label>Data <span class="required">*</span></label><input type="date" id="servData" class="form-control" value="${formatarDataInput(new Date())}" required></div>
                <div class="form-group"><label>Instituição <span class="required">*</span></label><select id="servInst" class="form-control" required><option value="Consultório">Consultório</option><option value="Laboratório">Laboratório</option></select></div>
            </div>
            <div class="form-group"><label>Tipo de Serviço <span class="required">*</span></label><select id="servTipo" class="form-control" onchange="toggleServicoOutros()">${opcoesServicos}</select></div>
            <div class="form-group" id="servOutrosGroup" style="display:none"><label>Descrição do Serviço</label><input type="text" id="servOutrosDesc" class="form-control" placeholder="Descreva o serviço..."></div>
            <div class="form-row"><div class="form-group"><label>Quantidade</label><input type="number" id="servQtd" class="form-control" value="1" min="1"></div></div>
            <div class="form-row"><div class="form-group"><label>Valor Caixa</label><input type="number" id="servCaixa" class="form-control" step="0.01" value="0"></div><div class="form-group"><label>Valor Banco</label><input type="number" id="servBanco" class="form-control" step="0.01" value="0"></div></div>
            <input type="hidden" id="servId">
        </form>
    `, `
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarServico()">Salvar</button>
    `);
}

function toggleServicoOutros() {
    const select = document.getElementById('servTipo');
    const outrosGroup = document.getElementById('servOutrosGroup');
    outrosGroup.style.display = select.value === 'outros' ? 'block' : 'none';
}

async function salvarServico() {
    const data = document.getElementById('servData').value;
    const instituicao = document.getElementById('servInst').value;
    const select = document.getElementById('servTipo');
    const selectedOption = select.options[select.selectedIndex];
    
    let tipoServico = selectedOption?.dataset?.label || selectedOption?.text || '';
    if (select.value === 'outros') {
        tipoServico = document.getElementById('servOutrosDesc').value.trim();
        if (!tipoServico) {
            showToast('Por favor, descreva o serviço', 'warning');
            return;
        }
    }
    
    if (!data || !instituicao || !tipoServico) {
        showToast('Preencha os campos obrigatórios', 'warning');
        return;
    }
    
    const user = getCurrentUser();
    const payload = {
        data: data,
        instituicao: instituicao,
        tipo_servico: tipoServico,
        quantidade: parseInt(document.getElementById('servQtd').value) || 1,
        caixa: parseFloat(document.getElementById('servCaixa').value) || 0,
        banco: parseFloat(document.getElementById('servBanco').value) || 0,
        registador: user?.nome || 'Sistema'
    };
    
    try {
        const result = await salvarServicoPrestado(payload);
        if (result.success) {
            showToast('Serviço registado com sucesso', 'success');
            fecharModal();
            await initServicos();
        } else {
            showToast(result.message || 'Erro ao registar serviço', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(error.message, 'error');
    }
}

async function excluirServico(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir este serviço?')) return;
    
    try {
        const result = await excluirServico(id);
        if (result.success) {
            showToast('Serviço excluído com sucesso', 'success');
            await initServicos();
        } else {
            showToast(result.message || 'Erro ao excluir serviço', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast(error.message, 'error');
    }
}

// ============================================================
// SEÇÃO 16: SAÍDAS MODULE (Resumido)
// ============================================================

let saidasDados = [];

async function renderSaidas() {
    return `
        <div class="saidas-container">
            <div style="margin-bottom:24px; display:flex; justify-content:space-between"><h2><i class="fas fa-arrow-right-from-bracket"></i> Saídas Detalhadas</h2><button class="btn-primary" onclick="abrirModalSaida()"><i class="fas fa-plus"></i> Registrar Saída</button></div>
            <div class="grid grid-3" id="resumoSaidas"><div class="metric-card"><div class="metric-value">-</div><div class="metric-label">Total Caixa</div></div><div class="metric-card"><div class="metric-value">-</div><div class="metric-label">Total Banco</div></div><div class="metric-card highlight"><div class="metric-value">-</div><div class="metric-label">Total Geral</div></div></div>
            <div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Lista de Saídas</h3></div><div class="card-body"><div class="table-container"><table class="table-zebra"><thead><tr><th>ID</th><th>Data</th><th>Instituição</th><th>Descrição</th><th>Caixa</th><th>Banco</th><th>Total</th><th>Quem Tirou</th><th>Ações</th></tr></thead><tbody id="saidasBody"></tbody></table></div></div></div>
        </div>
    `;
}

async function initSaidas() {
    await carregarSaidas();
}

async function carregarSaidas() {
    try {
        const filtros = {};
        if (currentFilters.dataInicio && currentFilters.dataFim) {
            filtros.data_inicio = currentFilters.dataInicio;
            filtros.data_fim = currentFilters.dataFim;
        }
        if (currentFilters.instituicao && currentFilters.instituicao !== 'Todos') {
            filtros.instituicao = currentFilters.instituicao;
        }
        
        const result = await listarSaidasDetalhadas(filtros);
        
        if (result && result.length > 0) {
            saidasDados = result;
            let totalCaixa = 0, totalBanco = 0, totalGeral = 0;
            for (const s of saidasDados) {
                totalCaixa += s.caixa || 0;
                totalBanco += s.banco || 0;
                totalGeral += (s.caixa || 0) + (s.banco || 0);
            }
            document.getElementById('resumoSaidas').innerHTML = `
                <div class="metric-card"><div class="metric-value">${formatarMoeda(totalCaixa)}</div><div class="metric-label">Total Caixa</div></div>
                <div class="metric-card"><div class="metric-value">${formatarMoeda(totalBanco)}</div><div class="metric-label">Total Banco</div></div>
                <div class="metric-card highlight"><div class="metric-value">${formatarMoeda(totalGeral)}</div><div class="metric-label">Total Geral</div></div>
            `;
            
            const podeEditar = hasUnlimitedAccess();
            let html = '';
            for (const s of saidasDados) {
                html += `<tr>
                    <td><code>${s.id || '-'}</code></td>
                    <td>${formatarData(s.data)}</td>
                    <td>${s.instituicao || '-'}</td>
                    <td>${truncarTexto(s.descricao, 40)}</td>
                    <td class="text-danger">${formatarMoeda(s.caixa)}</td>
                    <td class="text-danger">${formatarMoeda(s.banco)}</td>
                    <td class="text-danger"><strong>${formatarMoeda((s.caixa || 0) + (s.banco || 0))}</strong></td>
                    <td>${s.quem_tirou || '-'}</td>
                    <td>
                        ${podeEditar ? `<button class="btn-sm btn-outline" onclick="editarSaida('${s.id}')"><i class="fas fa-edit"></i></button> <button class="btn-sm btn-danger" onclick="excluirSaida('${s.id}')"><i class="fas fa-trash"></i></button>` : '<span class="badge badge-info">Leitura</span>'}
                    </td>
                </tr>`;
            }
            document.getElementById('saidasBody').innerHTML = html;
        } else {
            document.getElementById('saidasBody').innerHTML = '<td><td colspan="9" class="text-center">Nenhuma saída encontrada</tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar saídas:', error);
        document.getElementById('saidasBody').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Erro ao carregar dados</tr>';
    }
}

function abrirModalSaida() {
    const user = getCurrentUser();
    openModal('Registrar Saída', `
        <form id="formSaida">
            <div class="form-row"><div class="form-group"><label>Data <span class="required">*</span></label><input type="date" id="saiData" class="form-control" value="${formatarDataInput(new Date())}" required></div><div class="form-group"><label>Instituição <span class="required">*</span></label><select id="saiInst" class="form-control" required><option value="Consultório">Consultório</option><option value="Laboratório">Laboratório</option></select></div></div>
            <div class="form-group"><label>Descrição <span class="required">*</span></label><textarea id="saiDesc" class="form-control" rows="3" required></textarea></div>
            <div class="form-row"><div class="form-group"><label>Valor Caixa</label><input type="number" id="saiCaixa" class="form-control" step="0.01" value="0"></div><div class="form-group"><label>Valor Banco</label><input type="number" id="saiBanco" class="form-control" step="0.01" value="0"></div></div>
            <div class="form-group"><label>Quem Tirou</label><input type="text" id="saiQuem" class="form-control" value="${user?.nome || ''}"></div>
            <input type="hidden" id="saiId">
        </form>
    `, `
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarSaida()">Salvar</button>
    `);
}

async function salvarSaida() {
    const data = document.getElementById('saiData').value;
    const instituicao = document.getElementById('saiInst').value;
    const descricao = document.getElementById('saiDesc').value.trim();
    
    if (!data || !instituicao || !descricao) {
        showToast('Preencha os campos obrigatórios', 'warning');
        return;
    }
    
    const user = getCurrentUser();
    const payload = {
        data: data,
        instituicao: instituicao,
        descricao: descricao,
        caixa: parseFloat(document.getElementById('saiCaixa').value) || 0,
        banco: parseFloat(document.getElementById('saiBanco').value) || 0,
        quem_tirou: document.getElementById('saiQuem').value || user?.nome || 'Sistema'
    };
    
    try {
        const result = await salvarSaidaDetalhada(payload);
        if (result.success) {
            showToast('Saída registada com sucesso', 'success');
            fecharModal();
            await initSaidas();
        } else {
            showToast(result.message || 'Erro ao registar saída', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(error.message, 'error');
    }
}

async function excluirSaida(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir esta saída?')) return;
    
    try {
        const result = await excluirSaida(id);
        if (result.success) {
            showToast('Saída excluída com sucesso', 'success');
            await initSaidas();
        } else {
            showToast(result.message || 'Erro ao excluir saída', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast(error.message, 'error');
    }
}

// ============================================================
// SEÇÃO 17: ESTOQUE MODULE (Resumido)
// ============================================================

let currentEstoqueTab = 'estoque';

async function renderEstoque() {
    return `
        <div class="estoque-container">
            <div style="margin-bottom:24px; display:flex; justify-content:space-between"><h2><i class="fas fa-boxes"></i> Gestão de Estoque</h2><button class="btn-primary" onclick="abrirModalMovimentoEstoque()"><i class="fas fa-exchange-alt"></i> Registrar Movimento</button></div>
            <div class="tabs" style="display:flex; gap:8px; margin-bottom:24px; border-bottom:2px solid var(--cor-borda);"><button class="tab-btn active" data-tab="estoque" onclick="switchEstoqueTab('estoque')"><i class="fas fa-box"></i> Stock Actual</button><button class="tab-btn" data-tab="movimentos" onclick="switchEstoqueTab('movimentos')"><i class="fas fa-history"></i> Histórico</button></div>
            <div id="tabEstoque" class="tab-content"><div class="card"><div class="card-header"><h3><i class="fas fa-boxes"></i> Produtos em Stock</h3></div><div class="card-body"><div class="table-container"><table class="table-zebra"><thead><tr><th>ID</th><th>Produto</th><th>Instituição</th><th>Stock</th><th>Expiração</th><th>Status</th></tr></thead><tbody id="estoqueBody"></tbody></table></div></div></div></div>
            <div id="tabMovimentos" class="tab-content" style="display:none"><div class="card"><div class="card-header"><h3><i class="fas fa-history"></i> Histórico de Movimentos</h3></div><div class="card-body"><div class="table-container"><table class="table-zebra"><thead><tr><th>Data</th><th>Produto</th><th>Instituição</th><th>Entrada</th><th>Saída</th><th>Usuário</th></tr></thead><tbody id="movimentosBody"></tbody></table></div></div></div></div>
        </div>
    `;
}

async function switchEstoqueTab(tab) {
    currentEstoqueTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('tabEstoque').style.display = tab === 'estoque' ? 'block' : 'none';
    document.getElementById('tabMovimentos').style.display = tab === 'movimentos' ? 'block' : 'none';
    
    if (tab === 'estoque') await carregarEstoque();
    else await carregarMovimentosEstoque();
}

async function initEstoque() {
    await carregarEstoque();
    await carregarMovimentosEstoque();
}

async function carregarEstoque() {
    try {
        const filtros = {};
        if (currentFilters.instituicao && currentFilters.instituicao !== 'Todos') {
            filtros.instituicao = currentFilters.instituicao;
        }
        
        const result = await listarProdutosEstoque(filtros);
        
        if (result && result.length > 0) {
            let html = '';
            for (const p of result) {
                let statusClass = '', statusText = '';
                if (p.quantidade_atual === 0) { statusClass = 'badge-danger'; statusText = 'Esgotado'; }
                else if (p.quantidade_atual < 5) { statusClass = 'badge-warning'; statusText = 'Stock Baixo'; }
                else { statusClass = 'badge-success'; statusText = 'Normal'; }
                
                html += `<tr>
                    <td><code>${p.id || '-'}</code></td>
                    <td><strong>${capitalizar(p.nome_produto)}</strong></td>
                    <td>${p.instituicao || '-'}</td>
                    <td><strong>${formatarNumero(p.quantidade_atual)}</strong></td>
                    <td>${p.data_expiracao || '—'}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>`;
            }
            document.getElementById('estoqueBody').innerHTML = html;
        } else {
            document.getElementById('estoqueBody').innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto em stock</tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        document.getElementById('estoqueBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</tr>';
    }
}

async function carregarMovimentosEstoque() {
    try {
        const filtros = {};
        if (currentFilters.dataInicio && currentFilters.dataFim) {
            filtros.data_inicio = currentFilters.dataInicio;
            filtros.data_fim = currentFilters.dataFim;
        }
        
        const result = await listarMovimentosEstoque(filtros);
        
        if (result && result.length > 0) {
            let html = '';
            for (const m of result.slice(0, 100)) {
                html += `<tr>
                    <td>${formatarData(m.data_registro)}</td>
                    <td>${capitalizar(m.nome_produto || 'N/A')}</td>
                    <td>${m.instituicao || '-'}</td>
                    <td class="text-success">${m.entradas > 0 ? '+' + formatarNumero(m.entradas) : '-'}</td>
                    <td class="text-danger">${m.saidas > 0 ? '-' + formatarNumero(m.saidas) : '-'}</td>
                    <td>${m.usuario || '-'}</td>
                </tr>`;
            }
            document.getElementById('movimentosBody').innerHTML = html;
        } else {
            document.getElementById('movimentosBody').innerHTML = '<tr><td colspan="6" class="text-center">Nenhum movimento encontrado</tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar movimentos:', error);
        document.getElementById('movimentosBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</tr>';
    }
}

function abrirModalMovimentoEstoque() {
    openModal('Registrar Movimento de Estoque', `
        <form id="formMovimentoEstoque">
            <div class="form-group"><label>Produto <span class="required">*</span></label><input type="text" id="estProduto" class="form-control" placeholder="Ex: Paracetamol 500mg" required></div>
            <div class="form-row"><div class="form-group"><label>Instituição <span class="required">*</span></label><select id="estInst" class="form-control" required><option value="Consultório">Consultório</option><option value="Laboratório">Laboratório</option></select></div><div class="form-group"><label>Data Expiração</label><input type="date" id="estExp" class="form-control"></div></div>
            <div class="form-row"><div class="form-group"><label>Entradas</label><input type="number" id="estEntradas" class="form-control" value="0" min="0"></div><div class="form-group"><label>Saídas</label><input type="number" id="estSaidas" class="form-control" value="0" min="0"></div></div>
            <small class="text-warning"><i class="fas fa-info-circle"></i> Informe apenas ENTRADA ou SAÍDA por movimento</small>
        </form>
    `, `
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarMovimentoEstoque()">Registrar</button>
    `);
}

async function salvarMovimentoEstoque() {
    const produto = document.getElementById('estProduto').value.trim();
    const instituicao = document.getElementById('estInst').value;
    const entradas = parseInt(document.getElementById('estEntradas').value) || 0;
    const saidas = parseInt(document.getElementById('estSaidas').value) || 0;
    
    if (!produto || !instituicao) {
        showToast('Preencha o produto e instituição', 'warning');
        return;
    }
    
    if (entradas === 0 && saidas === 0) {
        showToast('Informe quantidade de entrada ou saída', 'warning');
        return;
    }
    
    const user = getCurrentUser();
    const tipo_movimento = entradas > 0 ? 'ENTRADA' : 'SAIDA';
    const quantidade = entradas > 0 ? entradas : saidas;
    
    const produtosExistentes = await listarProdutosEstoque();
    let produtoExistente = produtosExistentes.find(p => 
        p.nome_produto.toLowerCase() === produto.toLowerCase() && p.instituicao === instituicao);
    
    if (!produtoExistente && tipo_movimento === 'SAIDA') {
        showToast(`Produto "${produto}" não encontrado no stock. Registar uma entrada primeiro.`, 'error');
        return;
    }
    
    const payload = {
        nome_produto: produto,
        instituicao: instituicao,
        quantidade: quantidade,
        tipo_movimento: tipo_movimento,
        data_expiracao: document.getElementById('estExp').value || null,
        usuario: user?.nome || 'Sistema'
    };
    
    try {
        const result = await salvarMovimentoEstoque(payload);
        if (result.success) {
            showToast('Movimento registado com sucesso', 'success');
            fecharModal();
            await carregarEstoque();
            await carregarMovimentosEstoque();
        } else {
            showToast(result.message || 'Erro ao registar movimento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar movimento:', error);
        showToast(error.message, 'error');
    }
}

// ============================================================
// SEÇÃO 18: RELATÓRIOS MODULE (Resumido)
// ============================================================

let dadosRelatorioAtual = null;

async function renderRelatorios() {
    return `
        <div class="relatorios-container">
            <div class="card"><div class="card-header"><h3><i class="fas fa-cog"></i> Configuração do Relatório</h3></div><div class="card-body">
                <div class="form-group"><label>Tipo de Relatório</label><select id="relTipo" class="form-control"><option value="financeiro">Relatório Financeiro</option><option value="servicos">Relatório de Serviços</option><option value="saidas">Relatório de Saídas</option><option value="estoque">Relatório de Estoque</option></select></div>
                <div style="margin-top:24px; display:flex; gap:16px; justify-content:flex-end;"><button class="btn-secondary" onclick="gerarRelatorio()"><i class="fas fa-eye"></i> Pré-visualizar</button><button class="btn-primary" id="btnImprimir" onclick="imprimirRelatorio()" disabled><i class="fas fa-print"></i> Imprimir PDF</button></div>
            </div></div>
            <div id="previewRelatorio" class="card" style="margin-top:24px; display:none;"><div class="card-header"><h3><i class="fas fa-eye"></i> Pré-visualização</h3></div><div class="card-body" id="previewContent"></div></div>
        </div>
    `;
}

async function initRelatorios() {
    dadosRelatorioAtual = null;
    document.getElementById('previewRelatorio').style.display = 'none';
    document.getElementById('btnImprimir').disabled = true;
}

async function gerarRelatorio() {
    const tipo = document.getElementById('relTipo').value;
    
    try {
        let dados = [];
        if (tipo === 'financeiro') {
            dados = await listarMovimentosFinanceiro({ limit: 1000 });
        } else if (tipo === 'servicos') {
            dados = await listarServicosPrestados({ limit: 1000 });
        } else if (tipo === 'saidas') {
            dados = await listarSaidasDetalhadas({ limit: 1000 });
        } else if (tipo === 'estoque') {
            dados = await listarProdutosEstoque({ limit: 1000 });
        }
        
        if (dados && dados.length > 0) {
            dadosRelatorioAtual = dados;
            const previewDiv = document.getElementById('previewRelatorio');
            const contentDiv = document.getElementById('previewContent');
            
            let html = '<div class="report-container">';
            html += '<div class="report-header"><h1>Consultório Médico e Laboratório</h1><h2>de Análises Clínicas Sol Nascente</h2></div>';
            html += `<div class="report-info"><p><strong>Período:</strong> ${gerarDescricaoFiltro(currentFilters)}</p><p><strong>Data de Emissão:</strong> ${dataHoraAgora()}</p><p><strong>Total Registos:</strong> ${dados.length}</p></div>`;
            
            if (dados[0]) {
                const headers = Object.keys(dados[0]).filter(h => !h.includes('criado_em') && !h.includes('atualizado_em'));
                html += '<div class="table-container"><table><thead><tr>';
                headers.forEach(h => html += `<th>${capitalizar(h.replace(/_/g, ' '))}</th>`);
                html += '</tr></thead><tbody>';
                for (const item of dados.slice(0, 100)) {
                    html += '<tr>';
                    headers.forEach(h => {
                        let val = item[h];
                        if (typeof val === 'number' && (h.includes('caixa') || h.includes('banco') || h.includes('entradas') || h.includes('saidas'))) {
                            val = formatarMoeda(val);
                        } else if (h.includes('data')) {
                            val = formatarData(val);
                        } else if (val === null || val === undefined) {
                            val = '-';
                        }
                        html += `<td>${typeof val === 'object' ? JSON.stringify(val) : val}</td>`;
                    });
                    html += '</tr>';
                }
                html += '</tbody></table></div>';
            } else {
                html += '<div class="empty-state">Nenhum dado encontrado para o período seleccionado</div>';
            }
            
            html += `<div class="report-footer"><p>Gerado por: ${getCurrentUser()?.nome || 'Utilizador'} | Sol Nascente Gestão Clínica</p></div>`;
            html += '</div>';
            
            contentDiv.innerHTML = html;
            previewDiv.style.display = 'block';
            document.getElementById('btnImprimir').disabled = false;
            showToast('Relatório gerado com sucesso', 'success');
        } else {
            showToast('Nenhum dado encontrado para o período seleccionado', 'warning');
        }
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showToast('Erro ao gerar relatório', 'error');
    }
}

function imprimirRelatorio() {
    if (!dadosRelatorioAtual) {
        showToast('Gere o relatório primeiro', 'warning');
        return;
    }
    
    const conteudo = document.getElementById('previewContent').innerHTML;
    const win = window.open('', '_blank', 'width=800,height=600,toolbar=yes,scrollbars=yes');
    if (!win) {
        showToast('Permita pop-ups para imprimir', 'warning');
        return;
    }
    
    win.document.write(`
        <!DOCTYPE html><html><head><title>Relatório - Sol Nascente</title><meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'DM Sans',Arial,sans-serif; padding:15mm; background:white; }
            .report-header { text-align:center; margin-bottom:20pt; padding-bottom:10pt; border-bottom:2px solid #1A7A4A; }
            .report-header h1 { font-size:18pt; color:#1A7A4A; }
            .report-header h2 { font-size:12pt; font-weight:normal; }
            .report-info { background:#f5f5f5; padding:10pt; margin-bottom:20pt; border-left:4px solid #C9A84C; }
            .report-info p { margin:3pt 0; font-size:9pt; }
            table { width:100%; border-collapse:collapse; margin:16pt 0; font-size:9pt; }
            th { background:#1A7A4A; color:white; padding:8pt; text-align:left; }
            td { padding:6pt 8pt; border-bottom:1px solid #ddd; }
            tbody tr:nth-child(even) { background:#F2FAF5; }
            .report-footer { margin-top:30pt; padding-top:10pt; border-top:1px solid #ddd; text-align:center; font-size:8pt; color:#999; }
            .empty-state { text-align:center; padding:40pt; color:#999; }
            @media print { body { padding:0; } @page { margin:15mm; } }
        </style>
        </head><body>${conteudo}<script>window.onload = () => setTimeout(() => window.print(), 500);<\/script></body></html>
    `);
    win.document.close();
}

// ============================================================
// SEÇÃO 19: INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================

async function initApp() {
    console.log('🚀 Inicializando aplicação...');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    const session = getSession();
    if (session) {
        console.log('✅ Sessão encontrada para:', session.usuario?.username);
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        document.getElementById('sidebarUserName').innerText = session.usuario.nome;
        document.getElementById('sidebarUserRole').innerText = session.usuario.funcao;
        document.getElementById('mobileUserName').innerText = session.usuario.nome;
        document.getElementById('mobileUserRole').innerText = session.usuario.funcao;
        
        initFilters();
        setupNavigation();
        await loadPage('dashboard');
    } else {
        console.log('🔐 Nenhuma sessão encontrada, exibindo login');
    }
    
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }, 1000);
}

// Login handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    if (!username || !password) {
        showToast('Preencha todos os campos', 'warning');
        return;
    }
    
    const result = await login(username, password);
    if (result.success) {
        window.location.reload();
    }
});

// Iniciar aplicação
document.addEventListener('DOMContentLoaded', initApp);

// Exportar funções globais necessárias
window.abrirModalFinanceiro = abrirModalFinanceiro;
window.salvarMovimentoFinanceiro = salvarMovimentoFinanceiro;
window.editarMovimentoFinanceiro = editarMovimentoFinanceiro;
window.excluirMovimentoFinanceiro = excluirMovimentoFinanceiro;
window.salvarMovimentoFinanceiroEdicao = salvarMovimentoFinanceiroEdicao;
window.abrirModalServico = abrirModalServico;
window.toggleServicoOutros = toggleServicoOutros;
window.salvarServico = salvarServico;
window.excluirServico = excluirServico;
window.abrirModalSaida = abrirModalSaida;
window.salvarSaida = salvarSaida;
window.excluirSaida = excluirSaida;
window.abrirModalMovimentoEstoque = abrirModalMovimentoEstoque;
window.salvarMovimentoEstoque = salvarMovimentoEstoque;
window.switchEstoqueTab = switchEstoqueTab;
window.gerarRelatorio = gerarRelatorio;
window.imprimirRelatorio = imprimirRelatorio;
window.fecharModal = fecharModal;
window.togglePasswordVisibility = togglePasswordVisibility;

console.log('✅ gestao.js carregado - Versão 12.0.0');