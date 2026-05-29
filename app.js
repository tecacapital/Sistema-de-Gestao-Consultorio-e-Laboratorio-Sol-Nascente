/**
 * SISTEMA DE GESTAO CLINICA SOL NASCENTE
 * Versao: 3.1.0
 * Arquiteto: Alberto Teca Tomas
 * Uige - Angola
 * JavaScript Puro (Vanilla JS) - Zero Frameworks
 * Comunica com Code.gs V3.0.0 via Google Apps Script
 */

// ===== CONFIGURACAO DO BACKEND =====
const API_URL = "https://script.google.com/macros/s/AKfycbzHAVigGcsGMG5-vBlTIGuD3quPYui7ksegv9yqket-oFjeKiKvjEoA9HguwlJsr3g/exec";
const VERSAO = "3.1.0";

// ===== CATALOGO COMPLETO DE SERVICOS E PRECOS =====
const CATALOGO_SERVICOS = {
    consultas: [
        { nome: "Medicina Geral", preco: 3000 },
        { nome: "Gineco-Obstetricia", preco: 3000 },
        { nome: "Pediatria", preco: 3000 },
        { nome: "Dermatologia", preco: 3000 },
        { nome: "Consulta c/ Enfermeiro", preco: 1500 },
        { nome: "A. Pressao Arterial", preco: 500 }
    ],
    hematologicos: [
        { nome: "Hemograma", preco: 3000 },
        { nome: "Hemoglobina", preco: 1200 },
        { nome: "Hematocrito", preco: 1200 },
        { nome: "Leucograma", preco: 3000 },
        { nome: "T. Hemorragia", preco: 1200 },
        { nome: "T. Coagulacao", preco: 1200 },
        { nome: "Grupo Sanguineo", preco: 1200 },
        { nome: "Falciformacao", preco: 1200 },
        { nome: "V. Sanguinea", preco: 1200 }
    ],
    serologicos: [
        { nome: "Reaccao Widal", preco: 1200 },
        { nome: "Sifilis (V.D.R.L.)", preco: 1500 },
        { nome: "Hepatite B (H.B.V)", preco: 1200 },
        { nome: "Hepatite C (H.C.V)", preco: 1200 },
        { nome: "P.C.R", preco: 2000 },
        { nome: "P.S.A", preco: 2000 },
        { nome: "Factor Reumatoide", preco: 2000 },
        { nome: "Helicobacter Pylori (H.P)", preco: 8000 },
        { nome: "H.I.V", preco: 1200 },
        { nome: "Dengue", preco: 2000 }
    ],
    bioquimicos: [
        { nome: "Glicemia", preco: 1700 },
        { nome: "Creatinina", preco: 2000 },
        { nome: "Ureia", preco: 1700 },
        { nome: "Colesterol", preco: 2000 },
        { nome: "T.G.O", preco: 2000 },
        { nome: "T.G.P", preco: 2000 },
        { nome: "Acido Urico", preco: 1700 },
        { nome: "Proteina Total", preco: 1700 },
        { nome: "Triglicerido", preco: 1700 },
        { nome: "L.D.L", preco: 1700 },
        { nome: "H.D.L", preco: 1700 }
    ],
    urologia: [
        { nome: "Urina", preco: 1200 },
        { nome: "Exudado Vaginal", preco: 1200 },
        { nome: "Exudado Uretral", preco: 1200 },
        { nome: "Espermograma", preco: 3000 }
    ],
    parasitologicos: [
        { nome: "Pesquisa de Plasmodio (P.P)", preco: 700 },
        { nome: "Filaria", preco: 1200 },
        { nome: "Fezes", preco: 1200 }
    ]
};

// ===== LISTA FECHADA DE EXAMES COM DESCONTO PARA GRAVIDAS =====
const EXAMES_GRAVIDA_500 = [
    "Pesquisa de Plasmodio (P.P)",
    "Hemoglobina",
    "Reaccao Widal",
    "Sifilis (V.D.R.L.)",
    "Hepatite B (H.B.V)",
    "Hepatite C (H.C.V)",
    "Grupo Sanguineo",
    "Glicemia",
    "Fezes",
    "Urina",
    "Exudado Vaginal",
    "Dengue",
    "Falciformacao",
    "H.I.V",
    "V. Sanguinea"
];

// ===== NOMES DAS CATEGORIAS PARA EXIBICAO =====
const NOMES_CATEGORIAS = {
    consultas: "Consultas",
    hematologicos: "Exames Hematologicos",
    serologicos: "Exames Serologicos",
    bioquimicos: "Exames Bioquimicos",
    urologia: "Exames de Urologia",
    parasitologicos: "Exames Parasitologicos"
};

// ===== ICONES DAS CATEGORIAS =====
const ICONES_CATEGORIAS = {
    consultas: "fa-stethoscope",
    hematologicos: "fa-droplet",
    serologicos: "fa-flask",
    bioquimicos: "fa-microscope",
    urologia: "fa-toilet",
    parasitologicos: "fa-bug"
};

// ===== FUNCOES PREDEFINIDAS =====
const FUNCOES_PREDEFINIDAS = [
    "Medico",
    "Tecnico de Biomedicina (Laboratorio)",
    "Enfermeiro",
    "Recepcionista",
    "Administrador",
    "Gestor",
    "Marketing",
    "Auxiliar de Limpeza",
    "Assistente",
    "Estagiario de Enfermagem",
    "Estagiario de Biomedicina",
    "Estagiario"
];

// ===== ESTADO GLOBAL DA APLICACAO =====
const AppState = {
    usuario: null,
    vistaActual: "login",
    passoActual: 1,
    categoriaActiva: "consultas",
    pacienteGravida: false,
    servicosSelecionados: {},
    dadosPaciente: {
        nomePaciente: "",
        sexo: "",
        idade: "",
        regiaoBairro: "",
        telefone: "",
        email: ""
    },
    pacientes: [],
    pendentes: [],
    funcionarios: [],
    paginaActualPacientes: 1,
    totalPaginasPacientes: 1,
    registosPorPagina: 10,
    termoPesquisaPacientes: "",
    pesquisaListenerRegistado: false
};

// ===== REFERENCIAS RAPIDAS DO DOM =====
function $(id) {
    return document.getElementById(id);
}

function $$(sel) {
    return document.querySelectorAll(sel);
}

// ===== FUNCOES UTILITARIAS =====

/**
 * Formata um valor numerico para o formato de moeda Kzs
 * Exemplo: 3000 -> "3.000 Kzs"
 */
function formatarKzs(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return "0 Kzs";
    return parseInt(valor).toLocaleString("pt-PT") + " Kzs";
}

/**
 * Gera as iniciais de um nome completo
 * Exemplo: "Alberto Teca Tomas" -> "AT"
 */
function gerarIniciais(nome) {
    if (!nome || typeof nome !== "string") return "--";
    var partes = nome.trim().split(/\s+/);
    if (partes.length === 0) return "--";
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

/**
 * Verifica se o utilizador logado tem uma das funcoes permitidas
 */
function temPermissao(funcoesPermitidas) {
    if (!AppState.usuario) return false;
    if (!funcoesPermitidas || funcoesPermitidas.length === 0) return true;
    return funcoesPermitidas.indexOf(AppState.usuario.funcao) !== -1;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escaparHTML(str) {
    if (!str && str !== 0 && str !== false) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

/**
 * Calcula o preco final de um servico considerando desconto para gravidas
 * Regra: apenas exames na lista EXAMES_GRAVIDA_500 tem desconto para 500 Kzs
 */
function calcularPrecoFinal(nomeServico, precoNormal, eGravida) {
    if (!eGravida) return precoNormal;
    if (EXAMES_GRAVIDA_500.indexOf(nomeServico) !== -1) return 500;
    return precoNormal;
}

/**
 * Calcula o total do atendimento somando todos os servicos selecionados
 * Aplica a regra de desconto para gravidas quando aplicavel
 */
function calcularTotalAtendimento() {
    var total = 0;
    var categorias = Object.keys(AppState.servicosSelecionados);
    
    for (var i = 0; i < categorias.length; i++) {
        var cat = categorias[i];
        var servicos = AppState.servicosSelecionados[cat] || {};
        var nomesServicos = Object.keys(servicos);
        
        for (var j = 0; j < nomesServicos.length; j++) {
            var nome = nomesServicos[j];
            var selecionado = servicos[nome];
            
            if (!selecionado) continue;
            
            var catalogo = CATALOGO_SERVICOS[cat] || [];
            for (var k = 0; k < catalogo.length; k++) {
                if (catalogo[k].nome === nome) {
                    total += calcularPrecoFinal(nome, catalogo[k].preco, AppState.pacienteGravida);
                    break;
                }
            }
        }
    }
    
    return total;
}

/**
 * Gera um username a partir do nome completo
 * Formato: primeironome.ultimonome (minusculas)
 */
function gerarUsername(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== "string") return "";
    var partes = nomeCompleto.trim().toLowerCase().split(/\s+/);
    if (partes.length === 0) return "";
    if (partes.length === 1) return partes[0];
    return partes[0] + "." + partes[partes.length - 1];
}

/**
 * Extrai o bairro de um objecto paciente, verificando multiplas variantes
 */
function extrairBairroSeguro(dadosPaciente) {
    if (!dadosPaciente) return "";
    return dadosPaciente["Região Bairro"] || 
           dadosPaciente["Regiao Bairro"] || 
           dadosPaciente["regiaoBairro"] || 
           dadosPaciente["Bairro"] || 
           dadosPaciente["Região/Bairro"] || "";
}

/**
 * Extrai o ID de um paciente de forma segura
 */
function extrairID(paciente) {
    if (!paciente) return "N/A";
    return paciente["ID"] || paciente["id"] || "N/A";
}

/**
 * Extrai o nome de um paciente de forma segura
 */
function extrairNomePaciente(paciente) {
    if (!paciente) return "N/A";
    return paciente["Nome Paciente"] || paciente["nomePaciente"] || "N/A";
}

// ===== OVERLAY DE LOADING =====

/**
 * Mostra ou oculta o overlay de loading com spinner
 */
function mostrarLoading(mostrar) {
    var overlay = $("overlay-loading");
    if (overlay) {
        if (mostrar) {
            overlay.classList.remove("oculto");
        } else {
            overlay.classList.add("oculto");
        }
    }
}

// ===== SISTEMA DE NOTIFICACOES TOAST =====

/**
 * Exibe uma notificacao toast no canto superior direito
 * Tipos: sucesso, erro, aviso, info
 * Duracao: 4000ms
 */
function mostrarNotificacao(mensagem, tipo) {
    tipo = tipo || "info";
    
    var icones = {
        sucesso: "fa-circle-check",
        erro: "fa-circle-xmark",
        aviso: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };
    
    var toast = document.createElement("div");
    toast.className = "toast toast-" + tipo;
    toast.innerHTML = '<i class="fa-solid ' + (icones[tipo] || icones.info) + '"></i><span>' + escaparHTML(mensagem) + '</span>';
    
    var container = $("container-notificacoes");
    if (container) {
        container.appendChild(toast);
    }
    
    setTimeout(function() {
        toast.style.animation = "toastSaida 0.3s ease forwards";
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// ===== MODAL DE CONFIRMACAO =====

/**
 * Exibe um modal de confirmacao e retorna uma Promise<boolean>
 * Usar: const confirmado = await mostrarConfirmacao("Tem certeza?");
 */
function mostrarConfirmacao(mensagem) {
    return new Promise(function(resolve) {
        var overlay = $("modal-confirmacao-overlay");
        var mensagemEl = $("modal-confirmacao-mensagem");
        var btnConfirmar = $("btn-confirmacao-confirmar");
        var btnCancelar = $("btn-confirmacao-cancelar");
        
        if (!overlay || !mensagemEl || !btnConfirmar || !btnCancelar) {
            resolve(false);
            return;
        }
        
        mensagemEl.textContent = mensagem;
        overlay.classList.remove("oculto");
        
        function limparEResolver(valor) {
            overlay.classList.add("oculto");
            btnConfirmar.removeEventListener("click", aoConfirmar);
            btnCancelar.removeEventListener("click", aoCancelar);
            resolve(valor);
        }
        
        function aoConfirmar() { limparEResolver(true); }
        function aoCancelar() { limparEResolver(false); }
        
        btnConfirmar.addEventListener("click", aoConfirmar);
        btnCancelar.addEventListener("click", aoCancelar);
    });
}

// ===== MODAL GENERICO =====

/**
 * Abre o modal generico com o conteudo HTML fornecido
 */
function abrirModal(conteudoHTML) {
    var container = $("modal-container");
    var overlay = $("modal-overlay");
    
    if (container && overlay) {
        container.innerHTML = conteudoHTML;
        overlay.classList.remove("oculto");
    }
}

/**
 * Fecha o modal generico e limpa o conteudo
 */
function fecharModal() {
    var overlay = $("modal-overlay");
    var container = $("modal-container");
    
    if (overlay) overlay.classList.add("oculto");
    if (container) container.innerHTML = "";
}

// ===== BADGE DE PENDENTES =====

/**
 * Actualiza o contador visual de resultados pendentes na barra lateral
 */
function actualizarBadgePendentes() {
    var badge = $("badge-pendentes");
    if (!badge) return;
    
    var total = AppState.pendentes ? AppState.pendentes.length : 0;
    badge.textContent = total;
    
    if (total === 0) {
        badge.classList.add("oculto");
    } else {
        badge.classList.remove("oculto");
    }
}

/**
 * Carrega o badge de pendentes do backend
 */
async function carregarBadgePendentesRemoto() {
    try {
        var resultado = await API.listarPendentes();
        if (resultado.success && resultado.data) {
            AppState.pendentes = resultado.data.pendentes || [];
            actualizarBadgePendentes();
        }
    } catch (e) {
        console.error("[SOL NASCENTE] Erro ao carregar badge pendentes:", e.message);
    }
}

// ===== COMUNICACAO COM O BACKEND =====

/**
 * Funcao central de comunicacao com o Google Apps Script
 * Todas as chamadas a API passam por aqui
 * Usa Content-Type: text/plain para evitar problemas de CORS
 * Timeout de 15 segundos
 */
async function chamarBackend(action, dados) {
    dados = dados || {};
    
    var controller = new AbortController();
    var timeoutId = setTimeout(function() {
        controller.abort();
    }, 15000);
    
    mostrarLoading(true);
    
    try {
        var body = JSON.stringify({
            action: action,
            dados: dados
        });
        
        console.log("[SOL NASCENTE v3] -> " + action, dados);
        
        var resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: body,
            signal: controller.signal
        });
        
        var texto = await resposta.text();
        console.log("[SOL NASCENTE v3] <- " + action, texto.substring(0, 300));
        
        var resultado = JSON.parse(texto);
        return resultado;
        
    } catch (erro) {
        console.error("[SOL NASCENTE v3] ERRO " + action + ":", erro.message);
        
        var mensagem;
        if (erro.name === "AbortError") {
            mensagem = "Tempo de resposta esgotado. Verifique a ligacao.";
        } else {
            mensagem = "Erro de comunicacao: " + erro.message;
        }
        
        mostrarNotificacao(mensagem, "erro");
        return {
            success: false,
            message: mensagem
        };
        
    } finally {
        clearTimeout(timeoutId);
        mostrarLoading(false);
    }
}

/**
 * Objecto API com todos os metodos disponiveis
 * Cada metodo mapeia para uma action especifica no backend
 */
const API = {
    ping: function() {
        return chamarBackend("ping");
    },
    login: function(dados) {
        return chamarBackend("login", dados);
    },
    registarAtendimento: function(dados) {
        return chamarBackend("registarAtendimento", dados);
    },
    actualizarResultado: function(id) {
        return chamarBackend("actualizarResultado", { id: id });
    },
    listarPacientes: function() {
        return chamarBackend("listarPacientes");
    },
    buscarPaciente: function(id) {
        return chamarBackend("buscarPaciente", { id: id });
    },
    listarPendentes: function() {
        return chamarBackend("listarPendentes");
    },
    criarFuncionario: function(dados) {
        return chamarBackend("criarFuncionario", dados);
    },
    listarFuncionarios: function() {
        return chamarBackend("listarFuncionarios");
    },
    getRankingExames: function() {
        return chamarBackend("getRankingExames");
    }
};

// ===== SISTEMA DE LOGIN =====

/**
 * Mostra a tela de login e limpa a sessao
 */
function mostrarLogin() {
    AppState.usuario = null;
    AppState.vistaActual = "login";
    
    var secaoLogin = $("secao-login");
    var secaoPainel = $("secao-painel");
    
    if (secaoLogin) secaoLogin.classList.remove("oculto");
    if (secaoPainel) secaoPainel.classList.add("oculto");
    
    sessionStorage.removeItem("solnascente_v3");
}

/**
 * Mostra o painel principal apos login bem-sucedido
 */
function mostrarPainel() {
    var secaoLogin = $("secao-login");
    var secaoPainel = $("secao-painel");
    
    if (secaoLogin) secaoLogin.classList.add("oculto");
    if (secaoPainel) secaoPainel.classList.remove("oculto");
    
    actualizarHeader();
    actualizarVisibilidadeRestrita();
}

/**
 * Actualiza o header com os dados do funcionario logado
 */
function actualizarHeader() {
    if (!AppState.usuario) return;
    
    var iniciaisEl = $("iniciais-funcionario");
    var nomeEl = $("dropdown-nome");
    var funcaoEl = $("dropdown-funcao");
    
    if (iniciaisEl) iniciaisEl.textContent = gerarIniciais(AppState.usuario.nomeCompleto);
    if (nomeEl) nomeEl.textContent = AppState.usuario.nomeCompleto;
    if (funcaoEl) funcaoEl.textContent = AppState.usuario.funcao;
}

/**
 * Mostra ou oculta itens restritos do menu conforme a funcao do utilizador
 */
function actualizarVisibilidadeRestrita() {
    var elementos = $$(".restrito");
    
    for (var i = 0; i < elementos.length; i++) {
        var el = elementos[i];
        var permissoesStr = el.getAttribute("data-permissao") || "";
        var permissoes = permissoesStr.split(",");
        
        if (temPermissao(permissoes)) {
            el.classList.remove("oculto");
        } else {
            el.classList.add("oculto");
        }
    }
}

/**
 * Executa o processo de login
 * Valida campos, chama a API e redireciona para o dashboard
 */
async function executarLogin(e) {
    if (e) e.preventDefault();
    
    var inputUsername = $("input-username");
    var inputSenha = $("input-senha");
    var msgErro = $("msg-erro-login");
    var textoErro = $("texto-erro-login");
    
    if (!inputUsername || !inputSenha || !msgErro || !textoErro) return;
    
    var username = inputUsername.value.trim();
    var senha = inputSenha.value.trim();
    
    msgErro.classList.add("oculto");
    textoErro.textContent = "";
    
    if (!username || !senha) {
        textoErro.textContent = "Preencha o username e a senha.";
        msgErro.classList.remove("oculto");
        return;
    }
    
    if (!API_URL || API_URL.indexOf("COLE_AQUI") !== -1) {
        textoErro.textContent = "URL do servidor nao configurada. Va a Configuracoes.";
        msgErro.classList.remove("oculto");
        return;
    }
    
    var resultado = await API.login({
        username: username,
        senha: senha
    });
    
    if (resultado.success) {
        AppState.usuario = resultado.data;
        sessionStorage.setItem("solnascente_v3", JSON.stringify(resultado.data));
        
        inputUsername.value = "";
        inputSenha.value = "";
        
        mostrarPainel();
        navegarPara("inicio");
        mostrarNotificacao("Bem-vindo, " + resultado.data.nomeCompleto, "sucesso");
    } else {
        textoErro.textContent = resultado.message || "Credenciais invalidas.";
        msgErro.classList.remove("oculto");
    }
}

// ===== NAVEGACAO E ROTEAMENTO =====

/**
 * Navega para uma vista especifica do sistema
 * Controla permissoes de acesso e renderiza o conteudo
 */
function navegarPara(vista) {
    if (!AppState.usuario && vista !== "login") {
        mostrarLogin();
        return;
    }
    
    var vistasRestritas = ["funcionarios", "configuracoes"];
    var funcoesComAcesso = ["Administrador", "Gestor"];
    
    if (vistasRestritas.indexOf(vista) !== -1) {
        if (!temPermissao(funcoesComAcesso)) {
            mostrarNotificacao("Acesso restrito. Contacte a administracao.", "erro");
            return;
        }
    }
    
    AppState.vistaActual = vista;
    
    var todosMenus = $$("[data-vista]");
    for (var i = 0; i < todosMenus.length; i++) {
        var el = todosMenus[i];
        if (el.getAttribute("data-vista") === vista) {
            el.classList.add("activo");
        } else {
            el.classList.remove("activo");
        }
    }
    
    var painelMais = $("painel-mais-mobile");
    if (painelMais) painelMais.classList.add("oculto");
    
    var area = $("area-conteudo");
    if (!area) return;
    
    switch (vista) {
        case "inicio":
            renderizarDashboard(area);
            break;
        case "novo-atendimento":
            renderizarNovoAtendimento(area);
            break;
        case "pacientes":
            renderizarPacientes(area);
            break;
        case "pendentes":
            renderizarPendentes(area);
            break;
        case "funcionarios":
            renderizarFuncionarios(area);
            break;
        case "configuracoes":
            renderizarConfiguracoes(area);
            break;
    }
    
    if (vista === "pacientes") {
        setTimeout(function() {
            registarListenerPesquisaEstavel();
        }, 200);
    }
}

// ===== NOVA FUNCIONALIDADE 1: DASHBOARD TOP 10 EXAMES =====

/**
 * Renderiza o dashboard com apenas boas-vindas e Top 10 Exames
 */
function renderizarDashboard(area) {
    var nomeUsuario = AppState.usuario ? AppState.usuario.nomeCompleto : "Funcionario";
    var funcaoUsuario = AppState.usuario ? AppState.usuario.funcao : "";

    area.innerHTML =
        '<div class="boas-vindas-card">' +
        '<h3>Ola, ' + escaparHTML(nomeUsuario) + '</h3>' +
        '<p>' + escaparHTML(funcaoUsuario) + ' - Sistema de Gestao Clinica Sol Nascente</p>' +
        '</div>' +
        '<div class="ranking-container">' +
        '<h4><i class="fa-solid fa-trophy" style="color:var(--amarelo);"></i> Top 10 Exames Mais Realizados</h4>' +
        '<div id="dash-ranking"><div class="estado-vazio">' +
        '<i class="fa-solid fa-spinner fa-spin"></i><p>A carregar...</p></div></div>' +
        '</div>';

    carregarTop10Exames();
}

/**
 * Carrega o ranking dos 10 exames mais realizados via API
 */
async function carregarTop10Exames() {
    var container = document.getElementById("dash-ranking");
    if (!container) return;
    
    var resultado = await API.getRankingExames();

    if (!resultado.success || !resultado.data || resultado.data.length === 0) {
        container.innerHTML =
            '<p style="color:var(--cinza-medio);padding:20px;text-align:center;">' +
            'Nenhum exame realizado ainda.</p>';
        return;
    }

    var top10 = resultado.data.slice(0, 10);
    var maxTotal = top10[0].total || 1;
    var html = "";

    for (var i = 0; i < top10.length; i++) {
        var exame = top10[i];
        var largura = Math.round((exame.total / maxTotal) * 100);

        html += '<div class="ranking-item">';
        html += '<div class="ranking-posicao">' + (i + 1) + '</div>';
        html += '<div class="ranking-info">';
        html += '<div class="ranking-nome">' + escaparHTML(exame.nome) + '</div>';
        html += '<div class="ranking-categoria">' + escaparHTML(exame.categoriaNome || exame.categoria) + '</div>';
        html += '<div class="ranking-barra">';
        html += '<div class="ranking-barra-preenchida" style="width:' + largura + '%"></div>';
        html += '</div></div>';
        html += '<div class="ranking-total">' + exame.total + 'x</div>';
        html += '</div>';
    }

    container.innerHTML = html;
}

// ===== NOVO ATENDIMENTO =====

/**
 * Reseta o estado do formulario de atendimento
 */
function resetarFormulario() {
    AppState.servicosSelecionados = {};
    AppState.pacienteGravida = false;
    AppState.passoActual = 1;
    AppState.categoriaActiva = "consultas";
    AppState.dadosPaciente = {
        nomePaciente: "",
        sexo: "",
        idade: "",
        regiaoBairro: "",
        telefone: "",
        email: ""
    };
}

/**
 * Renderiza o formulario de novo atendimento (3 passos)
 */
function renderizarNovoAtendimento(area) {
    resetarFormulario();
    renderizarPassoFormulario(area);
}

/**
 * Renderiza o passo actual do formulario de atendimento
 */
function renderizarPassoFormulario(area) {
    var passo = AppState.passoActual;
    
    var html = '<div class="form-container" id="form-atendimento">';
    html += '<h2 class="form-titulo"><i class="fa-solid fa-user-plus"></i> Novo Atendimento</h2>';
    
    html += '<div class="progresso-barra">';
    var passos = ["Dados do Paciente", "Servicos", "Pagamento"];
    
    for (var i = 0; i < passos.length; i++) {
        if (i > 0) {
            var linhaConcluida = i < passo ? " concluida" : "";
            html += '<div class="progresso-linha' + linhaConcluida + '"></div>';
        }
        
        var classePasso = "";
        if (i + 1 === passo) classePasso = " activo";
        if (i + 1 < passo) classePasso = " concluido";
        
        html += '<div class="progresso-passo' + classePasso + '">';
        html += '<div class="progresso-passo-numero">' + (i + 1) + '</div>';
        html += '<span class="progresso-passo-label">' + passos[i] + '</span>';
        html += '</div>';
    }
    html += '</div>';
    
    if (passo === 1) {
        html += renderizarPasso1HTML();
    } else if (passo === 2) {
        html += renderizarPasso2HTML();
    } else if (passo === 3) {
        html += renderizarPasso3HTML();
    }
    
    html += '</div>';
    area.innerHTML = html;
    
    if (passo === 1) inicializarBindingsPasso1();
    else if (passo === 2) inicializarBindingsPasso2();
    else if (passo === 3) inicializarBindingsPasso3();
}

/**
 * Renderiza o HTML do Passo 1 - Dados do Paciente com campo de busca
 */
function renderizarPasso1HTML() {
    var html = '<div class="form-grid">';
    
    // Campo de busca de paciente existente
    html += '<div class="form-grid-cheio" id="container-busca-paciente">';
    html += '<label class="input-label">Pesquisar Paciente Existente <small>(Opcional)</small></label>';
    html += '<div class="input-icon-wrapper" style="position:relative;">';
    html += '<i class="fa-solid fa-magnifying-glass input-icon"></i>';
    html += '<input type="text" id="busca-paciente-existente" class="input-campo" ';
    html += 'placeholder="Nome ou ID do paciente..." autocomplete="off">';
    html += '</div>';
    html += '<div id="busca-resultados" style="display:none;position:absolute;';
    html += 'z-index:100;background:#fff;border:1px solid var(--borda);';
    html += 'border-radius:8px;width:100%;max-height:200px;overflow-y:auto;';
    html += 'box-shadow:var(--sombra-media);top:100%;left:0;"></div>';
    html += '<div id="busca-badge-paciente" style="display:none;margin-top:8px;';
    html += 'padding:8px 12px;background:var(--verde-claro);border-radius:6px;';
    html += 'font-size:12px;color:var(--verde-primario);">';
    html += '<i class="fa-solid fa-circle-info"></i> ';
    html += 'Paciente encontrado. Um novo atendimento sera registado com novo ID.</div>';
    html += '</div>';
    
    // Nome
    html += '<div class="form-grid-cheio">';
    html += '<label class="input-label" for="input-nome-paciente">Nome Paciente *</label>';
    html += '<div class="input-icon-wrapper">';
    html += '<i class="fa-solid fa-user input-icon"></i>';
    html += '<input type="text" id="input-nome-paciente" class="input-campo" placeholder="Nome completo do paciente" required>';
    html += '</div></div>';
    
    // Sexo
    html += '<div>';
    html += '<label class="input-label" for="select-sexo">Sexo *</label>';
    html += '<select id="select-sexo" class="input-campo">';
    html += '<option value="">Seleccionar...</option>';
    html += '<option value="Masculino">Masculino</option>';
    html += '<option value="Feminino">Feminino</option>';
    html += '</select></div>';
    
    // Idade
    html += '<div>';
    html += '<label class="input-label" for="input-idade">Idade *</label>';
    html += '<div class="input-icon-wrapper">';
    html += '<i class="fa-solid fa-cake-candles input-icon"></i>';
    html += '<input type="number" id="input-idade" class="input-campo" placeholder="Idade" min="0" max="150" required>';
    html += '</div></div>';
    
    // Regiao/Bairro
    html += '<div>';
    html += '<label class="input-label" for="input-regiao-bairro">Regiao/Bairro *</label>';
    html += '<div class="input-icon-wrapper">';
    html += '<i class="fa-solid fa-location-dot input-icon"></i>';
    html += '<input type="text" id="input-regiao-bairro" class="input-campo" placeholder="Bairro ou regiao" required>';
    html += '</div></div>';
    
    // Telefone
    html += '<div>';
    html += '<label class="input-label" for="input-telefone">Telefone <small>(Opcional)</small></label>';
    html += '<div class="input-icon-wrapper">';
    html += '<i class="fa-solid fa-phone input-icon"></i>';
    html += '<input type="number" id="input-telefone" class="input-campo" placeholder="Telefone">';
    html += '</div></div>';
    
    // Email
    html += '<div>';
    html += '<label class="input-label" for="input-email">Email <small>(Opcional)</small></label>';
    html += '<div class="input-icon-wrapper">';
    html += '<i class="fa-solid fa-envelope input-icon"></i>';
    html += '<input type="email" id="input-email" class="input-campo" placeholder="Email">';
    html += '</div></div>';
    
    // Gravida (toggle)
    html += '<div class="form-grid-cheio" id="campo-gravida" style="display:none;">';
    html += '<div class="toggle-container">';
    html += '<label class="toggle-switch">';
    html += '<input type="checkbox" id="toggle-gravida">';
    html += '<span class="toggle-slider"></span>';
    html += '</label>';
    html += '<span class="toggle-label" id="label-gravida"><i class="fa-solid fa-baby"></i> Paciente Gravida?</span>';
    html += '</div></div>';
    
    html += '</div>';
    
    html += '<div class="flex-between mt-24">';
    html += '<div></div>';
    html += '<button id="btn-proximo-passo1" class="btn btn-primario">Proximo <i class="fa-solid fa-arrow-right"></i></button>';
    html += '</div>';
    
    return html;
}

/**
 * Mostra resultados da busca de paciente
 */
function mostrarResultadosBusca(termo, pacientes, container, badge) {
    var filtrados = pacientes.filter(function(p) {
        var nome = (p["Nome Paciente"] || "").toLowerCase();
        var id = String(p["ID"] || "");
        return nome.indexOf(termo) !== -1 || id === termo;
    }).slice(0, 8);

    if (filtrados.length === 0) {
        container.innerHTML =
            '<div style="padding:12px;color:var(--cinza-medio);font-size:13px;">' +
            'Nenhum paciente encontrado.</div>';
        container.style.display = "block";
        return;
    }

    var html = "";
    for (var i = 0; i < filtrados.length; i++) {
        var p = filtrados[i];
        var bairro = extrairBairroSeguro(p);
        html += '<div class="busca-resultado-item" ';
        html += 'style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--borda);font-size:13px;" ';
        html += 'data-nome="' + escaparHTML(p["Nome Paciente"] || "") + '" ';
        html += 'data-sexo="' + escaparHTML(p["Sexo"] || "") + '" ';
        html += 'data-idade="' + escaparHTML(String(p["Idade"] || "")) + '" ';
        html += 'data-bairro="' + escaparHTML(bairro || "") + '" ';
        html += 'data-telefone="' + escaparHTML(String(p["Telefone"] || "")) + '" ';
        html += 'data-email="' + escaparHTML(p["Email"] || "") + '">';
        html += '<strong>' + escaparHTML(p["Nome Paciente"] || "N/A") + '</strong>';
        html += '<span style="color:var(--cinza-medio);margin-left:8px;font-size:11px;">';
        html += 'ID: ' + (p["ID"] || "N/A") + ' | ';
        html += escaparHTML(p["Sexo"] || "") + ' | ';
        html += (p["Idade"] || "?") + ' anos | ';
        html += escaparHTML(bairro || "N/A");
        html += '</span></div>';
    }

    container.innerHTML = html;
    container.style.display = "block";

    var itens = container.querySelectorAll(".busca-resultado-item");
    for (var j = 0; j < itens.length; j++) {
        itens[j].addEventListener("mouseenter", function() {
            this.style.background = "var(--verde-claro)";
        });
        itens[j].addEventListener("mouseleave", function() {
            this.style.background = "#fff";
        });
        itens[j].addEventListener("click", function() {
            preencherPacienteExistente(this.dataset, badge);
            container.style.display = "none";
        });
    }
}

/**
 * Preenche o formulario com dados de paciente existente
 * NUNCA preenche: total pago, status, resultado, servicos
 */
function preencherPacienteExistente(dados, badge) {
    var campos = {
        "input-nome-paciente": dados.nome || "",
        "input-idade": dados.idade || "",
        "input-regiao-bairro": dados.bairro || "",
        "input-telefone": dados.telefone || "",
        "input-email": dados.email || ""
    };

    Object.keys(campos).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && campos[id]) el.value = campos[id];
    });

    var elSexo = document.getElementById("select-sexo");
    if (elSexo && dados.sexo) {
        elSexo.value = dados.sexo;
        elSexo.dispatchEvent(new Event("change", { bubbles: true }));
    }

    var inputBusca = document.getElementById("busca-paciente-existente");
    if (inputBusca) inputBusca.value = dados.nome || "";

    if (badge) badge.style.display = "block";

    AppState.dadosPaciente.nomePaciente = dados.nome || "";
    AppState.dadosPaciente.sexo = dados.sexo || "";
    AppState.dadosPaciente.idade = dados.idade || "";
    AppState.dadosPaciente.regiaoBairro = dados.bairro || "";
    AppState.dadosPaciente.telefone = dados.telefone || "";
    AppState.dadosPaciente.email = dados.email || "";

    mostrarNotificacao("Dados do paciente preenchidos. Novo atendimento sera registado.", "info");
}

/**
 * Restaura dados do paciente no Passo 1 quando volta do Passo 2
 */
function restaurarDadosNoPasso1() {
    var d = AppState.dadosPaciente || {};

    if (!d.nomePaciente && !d.sexo && !d.idade && !d.regiaoBairro) return;

    var elNome = document.getElementById("input-nome-paciente");
    var elSexo = document.getElementById("select-sexo");
    var elIdade = document.getElementById("input-idade");
    var elBairro = document.getElementById("input-regiao-bairro");
    var elTelefone = document.getElementById("input-telefone");
    var elEmail = document.getElementById("input-email");

    if (elNome && d.nomePaciente) elNome.value = d.nomePaciente;
    if (elSexo && d.sexo) {
        elSexo.value = d.sexo;
        elSexo.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (elIdade && d.idade !== undefined && d.idade !== "") elIdade.value = d.idade;
    if (elBairro && d.regiaoBairro) elBairro.value = d.regiaoBairro;
    if (elTelefone && d.telefone) elTelefone.value = d.telefone;
    if (elEmail && d.email) elEmail.value = d.email;
}

/**
 * Inicializa os event listeners do Passo 1 com busca e auto-fill
 */
function inicializarBindingsPasso1() {
    var selectSexo = $("select-sexo");
    var campoGravida = $("campo-gravida");
    var toggleGravida = $("toggle-gravida");
    var labelGravida = $("label-gravida");
    var btnProximo = $("btn-proximo-passo1");
    
    if (selectSexo && campoGravida) {
        selectSexo.addEventListener("change", function() {
            if (this.value === "Feminino") {
                campoGravida.style.display = "block";
            } else {
                campoGravida.style.display = "none";
                AppState.pacienteGravida = false;
                if (toggleGravida) toggleGravida.checked = false;
                if (labelGravida) labelGravida.classList.remove("ativo");
            }
        });
    }
    
    if (toggleGravida && labelGravida) {
        toggleGravida.addEventListener("change", function() {
            AppState.pacienteGravida = this.checked;
            if (this.checked) {
                labelGravida.classList.add("ativo");
            } else {
                labelGravida.classList.remove("ativo");
            }
        });
    }
    
    // === BUSCA E AUTO-FILL ===
    var inputBusca = document.getElementById("busca-paciente-existente");
    var containerResultados = document.getElementById("busca-resultados");
    var badge = document.getElementById("busca-badge-paciente");

    if (inputBusca && containerResultados) {
        inputBusca.addEventListener("input", function() {
            var termo = this.value.trim().toLowerCase();
            containerResultados.style.display = "none";

            if (termo.length < 2) return;

            if (AppState.pacientes && AppState.pacientes.length > 0) {
                mostrarResultadosBusca(termo, AppState.pacientes, containerResultados, badge);
            } else {
                API.listarPacientes().then(function(resultado) {
                    if (resultado.success && resultado.data) {
                        AppState.pacientes = resultado.data.pacientes || [];
                        mostrarResultadosBusca(termo, AppState.pacientes, containerResultados, badge);
                    }
                });
            }
        });

        document.addEventListener("click", function(e) {
            if (!e.target.closest("#container-busca-paciente")) {
                containerResultados.style.display = "none";
            }
        });
    }
    
    if (btnProximo) {
        btnProximo.addEventListener("click", function() {
            var nome = ($("input-nome-paciente") ? $("input-nome-paciente").value : "").trim();
            var sexo = $("select-sexo") ? $("select-sexo").value : "";
            var idade = $("input-idade") ? $("input-idade").value : "";
            var bairro = ($("input-regiao-bairro") ? $("input-regiao-bairro").value : "").trim();
            var telefone = ($("input-telefone") ? $("input-telefone").value : "").trim();
            var email = ($("input-email") ? $("input-email").value : "").trim();
            
            if (!nome || !sexo || !idade || !bairro) {
                mostrarNotificacao("Preencha todos os campos obrigatorios.", "aviso");
                return;
            }
            
            var idadeNum = parseInt(idade);
            if (isNaN(idadeNum) || idadeNum < 0 || idadeNum > 150) {
                mostrarNotificacao("Idade invalida.", "aviso");
                return;
            }
            
            AppState.dadosPaciente.nomePaciente = nome;
            AppState.dadosPaciente.sexo = sexo;
            AppState.dadosPaciente.idade = idadeNum;
            AppState.dadosPaciente.regiaoBairro = bairro;
            AppState.dadosPaciente.telefone = telefone;
            AppState.dadosPaciente.email = email;
            
            AppState.passoActual = 2;
            renderizarPassoFormulario($("area-conteudo"));
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
    
    restaurarDadosNoPasso1();
}

/**
 * Renderiza o HTML do Passo 2 - Seleccao de Servicos
 */
function renderizarPasso2HTML() {
    var html = '';
    
    html += '<div class="categorias-abas" id="categorias-abas">';
    var categorias = Object.keys(CATALOGO_SERVICOS);
    
    for (var i = 0; i < categorias.length; i++) {
        var key = categorias[i];
        var activa = AppState.categoriaActiva === key ? " activa" : "";
        html += '<button class="categoria-aba' + activa + '" data-categoria="' + key + '">';
        html += '<i class="fa-solid ' + (ICONES_CATEGORIAS[key] || "fa-circle") + '"></i> ' + (NOMES_CATEGORIAS[key] || key);
        html += '</button>';
    }
    html += '</div>';
    
    html += '<div class="servicos-grid" id="servicos-grid"></div>';
    
    html += '<div class="resumo-servicos mt-16">';
    html += '<div class="resumo-servicos-titulo" id="toggle-resumo">';
    html += '<span><i class="fa-solid fa-receipt"></i> Resumo dos Servicos</span>';
    html += '<i class="fa-solid fa-chevron-up" id="icone-toggle-resumo"></i>';
    html += '</div>';
    html += '<ul class="resumo-servicos-lista aberto" id="resumo-lista"></ul>';
    html += '<div class="resumo-servicos-total">';
    html += '<span>Total a Pagar:</span>';
    html += '<span id="resumo-total">' + formatarKzs(calcularTotalAtendimento()) + '</span>';
    html += '</div></div>';
    
    html += '<div class="flex-between mt-16">';
    html += '<button id="btn-anterior-passo2" class="btn btn-secundario"><i class="fa-solid fa-arrow-left"></i> Anterior</button>';
    html += '<button id="btn-proximo-passo2" class="btn btn-primario">Proximo <i class="fa-solid fa-arrow-right"></i></button>';
    html += '</div>';
    
    return html;
}

/**
 * Inicializa os event listeners do Passo 2
 */
function inicializarBindingsPasso2() {
    if (!AppState.categoriaActiva) AppState.categoriaActiva = "consultas";
    
    renderizarCatalogo(AppState.categoriaActiva);
    
    var abas = document.querySelectorAll(".categoria-aba");
    for (var i = 0; i < abas.length; i++) {
        abas[i].addEventListener("click", function() {
            var categoria = this.getAttribute("data-categoria");
            AppState.categoriaActiva = categoria;
            
            var todasAbas = document.querySelectorAll(".categoria-aba");
            for (var j = 0; j < todasAbas.length; j++) {
                todasAbas[j].classList.remove("activa");
            }
            this.classList.add("activa");
            
            renderizarCatalogo(categoria);
        });
    }
    
    var toggleResumo = $("toggle-resumo");
    var resumoLista = $("resumo-lista");
    var iconeToggle = $("icone-toggle-resumo");
    
    if (toggleResumo && resumoLista && iconeToggle) {
        toggleResumo.addEventListener("click", function() {
            if (resumoLista.classList.contains("aberto")) {
                resumoLista.classList.remove("aberto");
                iconeToggle.classList.remove("fa-chevron-up");
                iconeToggle.classList.add("fa-chevron-down");
            } else {
                resumoLista.classList.add("aberto");
                iconeToggle.classList.remove("fa-chevron-down");
                iconeToggle.classList.add("fa-chevron-up");
            }
        });
    }
    
    var btnAnterior = $("btn-anterior-passo2");
    if (btnAnterior) {
        btnAnterior.addEventListener("click", function() {
            AppState.passoActual = 1;
            renderizarPassoFormulario($("area-conteudo"));
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
    
    var btnProximo = $("btn-proximo-passo2");
    if (btnProximo) {
        btnProximo.addEventListener("click", function() {
            var total = calcularTotalAtendimento();
            if (total <= 0) {
                mostrarNotificacao("Seleccione pelo menos um servico.", "aviso");
                return;
            }
            AppState.passoActual = 3;
            renderizarPassoFormulario($("area-conteudo"));
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

/**
 * Renderiza os cards de servicos de uma categoria
 */
function renderizarCatalogo(categoria) {
    var grid = $("servicos-grid");
    if (!grid) return;
    
    var servicos = CATALOGO_SERVICOS[categoria] || [];
    var html = "";
    
    for (var i = 0; i < servicos.length; i++) {
        var servico = servicos[i];
        var selecionado = AppState.servicosSelecionados[categoria] && 
                          AppState.servicosSelecionados[categoria][servico.nome] === true;
        var precoFinal = calcularPrecoFinal(servico.nome, servico.preco, AppState.pacienteGravida);
        var temDesconto = AppState.pacienteGravida && 
                          EXAMES_GRAVIDA_500.indexOf(servico.nome) !== -1 && 
                          precoFinal === 500;
        
        html += '<div class="servico-card' + (selecionado ? " seleccionado" : "") + '" ';
        html += 'data-categoria="' + categoria + '" data-nome="' + escaparHTML(servico.nome) + '" data-preco-normal="' + servico.preco + '">';
        html += '<div class="servico-card-nome">' + servico.nome + '</div>';
        
        if (temDesconto) {
            html += '<div class="servico-card-preco original">' + formatarKzs(servico.preco) + '</div>';
            html += '<div class="servico-card-preco gravida">500 Kzs (Gravida)</div>';
        } else {
            html += '<div class="servico-card-preco">' + formatarKzs(precoFinal) + '</div>';
        }
        
        html += '</div>';
    }
    
    grid.innerHTML = html;
    
    var cards = grid.querySelectorAll(".servico-card");
    for (var j = 0; j < cards.length; j++) {
        cards[j].addEventListener("click", function() {
            var cat = this.getAttribute("data-categoria");
            var nome = this.getAttribute("data-nome");
            
            if (!AppState.servicosSelecionados[cat]) {
                AppState.servicosSelecionados[cat] = {};
            }
            
            if (AppState.servicosSelecionados[cat][nome]) {
                delete AppState.servicosSelecionados[cat][nome];
                this.classList.remove("seleccionado");
            } else {
                AppState.servicosSelecionados[cat][nome] = true;
                this.classList.add("seleccionado");
            }
            
            actualizarResumoServicos();
        });
    }
}

/**
 * Actualiza o painel de resumo de servicos em tempo real
 */
function actualizarResumoServicos() {
    var resumoLista = $("resumo-lista");
    var resumoTotal = $("resumo-total");
    
    if (!resumoLista || !resumoTotal) return;
    
    var html = "";
    var total = 0;
    var categorias = Object.keys(AppState.servicosSelecionados);
    
    for (var i = 0; i < categorias.length; i++) {
        var cat = categorias[i];
        var servicos = AppState.servicosSelecionados[cat] || {};
        var nomes = Object.keys(servicos);
        
        for (var j = 0; j < nomes.length; j++) {
            var nome = nomes[j];
            if (!servicos[nome]) continue;
            
            var catalogo = CATALOGO_SERVICOS[cat] || [];
            for (var k = 0; k < catalogo.length; k++) {
                if (catalogo[k].nome === nome) {
                    var precoFinal = calcularPrecoFinal(nome, catalogo[k].preco, AppState.pacienteGravida);
                    var indicacao = (AppState.pacienteGravida && EXAMES_GRAVIDA_500.indexOf(nome) !== -1 && precoFinal === 500) ? " (Gravida)" : "";
                    
                    html += '<li class="resumo-servicos-item">';
                    html += '<span>' + nome + indicacao + '</span>';
                    html += '<span>' + formatarKzs(precoFinal) + '</span>';
                    html += '</li>';
                    
                    total += precoFinal;
                    break;
                }
            }
        }
    }
    
    if (!html) {
        html = '<li class="resumo-servicos-item"><span>Nenhum servico seleccionado</span></li>';
    }
    
    resumoLista.innerHTML = html;
    resumoTotal.textContent = formatarKzs(total);
}

/**
 * Renderiza o HTML do Passo 3 - Pagamento e Confirmacao
 */
function renderizarPasso3HTML() {
    var d = AppState.dadosPaciente || {};
    var nomePaciente = d.nomePaciente || "";
    var sexo = d.sexo || "";
    var idade = d.idade !== undefined && d.idade !== "" ? d.idade : "";
    var bairro = d.regiaoBairro || "";
    var total = calcularTotalAtendimento();
    
    var html = '<div class="form-grid"><div class="form-grid-cheio">';
    html += '<h3 style="margin-bottom:16px;"><i class="fa-solid fa-circle-check" style="color:var(--sucesso);"></i> Confirmacao do Atendimento</h3>';
    
    html += '<div style="background:#FAFAFA;padding:16px;border-radius:8px;margin-bottom:16px;">';
    html += '<h4><i class="fa-solid fa-user"></i> Dados do Paciente</h4>';
    html += '<p><strong>Nome:</strong> ' + escaparHTML(nomePaciente || "Nao informado") + '</p>';
    html += '<p><strong>Sexo:</strong> ' + escaparHTML(sexo || "Nao informado") + '</p>';
    html += '<p><strong>Idade:</strong> ' + (idade !== "" ? idade : "Nao informado") + '</p>';
    html += '<p><strong>Bairro:</strong> ' + escaparHTML(bairro || "Nao informado") + '</p>';
    if (AppState.pacienteGravida) html += '<p><strong>Paciente Gravida:</strong> Sim</p>';
    html += '</div>';
    
    html += '<div style="background:#FAFAFA;padding:16px;border-radius:8px;margin-bottom:16px;">';
    html += '<h4><i class="fa-solid fa-list-check"></i> Servicos Seleccionados</h4>';
    html += '<ul id="resumo-confirmacao-lista" style="list-style:none;padding:0;"></ul>';
    html += '</div></div>';
    
    html += '<div class="form-grid-cheio" style="background:var(--verde-claro);padding:16px;border-radius:8px;text-align:center;">';
    html += '<span style="font-size:14px;color:var(--cinza-medio);">Total a Pagar</span><br>';
    html += '<span style="font-size:28px;font-weight:700;color:var(--verde-primario);">' + formatarKzs(total) + '</span>';
    html += '</div>';
    
    html += '<div class="form-grid-cheio">';
    html += '<label class="input-label">Forma de Pagamento *</label>';
    html += '<div class="radio-pagamento">';
    html += criarRadioPagamento("Caixa", "fa-money-bill-wave", "caixa");
    html += criarRadioPagamento("Transferencia Bancaria", "fa-building-columns", "transferencia");
    html += criarRadioPagamento("Multicaixa Express", "fa-mobile-screen", "multicaixa");
    html += '</div></div>';
    
    html += '<div class="form-grid-cheio">';
    html += '<label class="input-label">Atendido Por</label>';
    html += '<input type="text" class="input-campo" value="' + escaparHTML(AppState.usuario ? AppState.usuario.nomeCompleto : "") + '" readonly style="background:#F5F5F5;">';
    html += '</div></div>';
    
    html += '<div class="flex-between mt-16">';
    html += '<button id="btn-anterior-passo3" class="btn btn-secundario"><i class="fa-solid fa-arrow-left"></i> Anterior</button>';
    html += '<button id="btn-registar-atendimento" class="btn btn-primario"><i class="fa-solid fa-floppy-disk"></i> Registar Atendimento</button>';
    html += '</div>';
    
    return html;
}

/**
 * Cria o HTML de uma opcao de radio para forma de pagamento
 */
function criarRadioPagamento(label, icone, valor) {
    return '<div class="radio-pagamento-opcao">' +
        '<input type="radio" name="forma-pagamento" id="pg-' + valor + '" value="' + label + '">' +
        '<label for="pg-' + valor + '"><i class="fa-solid ' + icone + '"></i> ' + label + '</label>' +
        '</div>';
}

/**
 * Inicializa os event listeners do Passo 3
 */
function inicializarBindingsPasso3() {
    var resumoConfirmacao = $("resumo-confirmacao-lista");
    if (resumoConfirmacao) {
        var html = "";
        var categorias = Object.keys(AppState.servicosSelecionados);
        
        for (var i = 0; i < categorias.length; i++) {
            var cat = categorias[i];
            var servicos = AppState.servicosSelecionados[cat] || {};
            var nomes = Object.keys(servicos);
            
            for (var j = 0; j < nomes.length; j++) {
                var nome = nomes[j];
                if (!servicos[nome]) continue;
                
                var catalogo = CATALOGO_SERVICOS[cat] || [];
                for (var k = 0; k < catalogo.length; k++) {
                    if (catalogo[k].nome === nome) {
                        var precoFinal = calcularPrecoFinal(nome, catalogo[k].preco, AppState.pacienteGravida);
                        html += '<li style="display:flex;justify-content:space-between;padding:4px 0;">';
                        html += '<span><i class="fa-solid fa-circle-check" style="color:var(--verde-primario);font-size:12px;"></i> ' + nome + '</span>';
                        html += '<span>' + formatarKzs(precoFinal) + '</span></li>';
                        break;
                    }
                }
            }
        }
        
        resumoConfirmacao.innerHTML = html || '<li>Nenhum servico seleccionado</li>';
    }
    
    var btnAnterior = $("btn-anterior-passo3");
    if (btnAnterior) {
        btnAnterior.addEventListener("click", function() {
            AppState.passoActual = 2;
            renderizarPassoFormulario($("area-conteudo"));
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
    
    var btnRegistar = $("btn-registar-atendimento");
    if (btnRegistar) {
        btnRegistar.addEventListener("click", async function() {
            var formaPagamento = document.querySelector('input[name="forma-pagamento"]:checked');
            
            if (!formaPagamento) {
                mostrarNotificacao("Seleccione a forma de pagamento.", "aviso");
                return;
            }
            
            var payload = construirPayloadAtendimento();
            var resultado = await API.registarAtendimento(payload);
            
            if (resultado.success) {
                var idGerado = resultado.data ? resultado.data.id : "N/A";
                
                var modalHTML = '<div class="modal-header">';
                modalHTML += '<h3><i class="fa-solid fa-circle-check" style="color:var(--sucesso);"></i> Atendimento Registado</h3>';
                modalHTML += '<button class="modal-fechar" onclick="fecharModal()"><i class="fa-solid fa-times"></i></button>';
                modalHTML += '</div><div class="modal-corpo">';
                modalHTML += '<p>Atendimento registado com sucesso!</p>';
                modalHTML += '<p style="font-size:18px;font-weight:700;color:var(--verde-primario);margin:12px 0;">ID: ' + idGerado + '</p>';
                modalHTML += '<p>Paciente: ' + escaparHTML(payload.nomePaciente) + '</p>';
                modalHTML += '<p>Total: ' + formatarKzs(payload.totalPago) + '</p>';
                modalHTML += '</div><div class="modal-acoes">';
                modalHTML += '<button class="btn btn-primario" onclick="fecharModal();navegarPara(\'novo-atendimento\');">';
                modalHTML += '<i class="fa-solid fa-user-plus"></i> Novo Atendimento</button>';
                modalHTML += '</div>';
                
                abrirModal(modalHTML);
                resetarFormulario();
                carregarBadgePendentesRemoto();
            } else {
                mostrarNotificacao(resultado.message || "Erro ao registar atendimento.", "erro");
            }
        });
    }
}

/**
 * Constroi o payload para envio ao backend
 * Le os dados de AppState.dadosPaciente e AppState.servicosSelecionados
 */
function construirPayloadAtendimento() {
    var d = AppState.dadosPaciente || {};
    var servicosPorCategoria = {};
    var categorias = Object.keys(CATALOGO_SERVICOS);
    
    for (var i = 0; i < categorias.length; i++) {
        var cat = categorias[i];
        servicosPorCategoria[cat] = {};
        
        var servicos = CATALOGO_SERVICOS[cat] || [];
        for (var j = 0; j < servicos.length; j++) {
            var nome = servicos[j].nome;
            servicosPorCategoria[cat][nome] = AppState.servicosSelecionados[cat] && 
                                               AppState.servicosSelecionados[cat][nome] === true;
        }
    }
    
    var formaPagamentoEl = document.querySelector('input[name="forma-pagamento"]:checked');
    var formaPagamento = formaPagamentoEl ? formaPagamentoEl.value : "";
    
    var total = calcularTotalAtendimento();
    
    return {
        nomePaciente: d.nomePaciente || "",
        sexo: d.sexo || "",
        idade: parseInt(d.idade) || 0,
        regiaoBairro: d.regiaoBairro || "",
        telefone: d.telefone || "",
        email: d.email || "",
        gravida: AppState.pacienteGravida ? "Sim" : "Nao",
        atendidoPor: AppState.usuario ? AppState.usuario.nomeCompleto : "",
        totalPago: total,
        formaPagamento: formaPagamento,
        consultas: servicosPorCategoria.consultas || {},
        hematologicos: servicosPorCategoria.hematologicos || {},
        serologicos: servicosPorCategoria.serologicos || {},
        bioquimicos: servicosPorCategoria.bioquimicos || {},
        urologia: servicosPorCategoria.urologia || {},
        parasitologicos: servicosPorCategoria.parasitologicos || {}
    };
}

// ===== GESTAO DE PACIENTES =====

/**
 * Carrega e renderiza a lista de pacientes
 */
async function renderizarPacientes(area) {
    area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-spinner fa-spin"></i><p>A carregar pacientes...</p></div>';
    
    var resultado = await API.listarPacientes();
    
    if (resultado.success && resultado.data) {
        AppState.pacientes = resultado.data.pacientes || [];
        AppState.paginaActualPacientes = 1;
        AppState.totalPaginasPacientes = Math.ceil(AppState.pacientes.length / AppState.registosPorPagina) || 1;
        AppState.pesquisaListenerRegistado = false;
        renderizarTabelaPacientes(area);
    } else {
        area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-circle-xmark"></i><p>Erro ao carregar pacientes.</p></div>';
    }
}

/**
 * Renderiza a tabela de pacientes com pesquisa e paginacao
 */
function renderizarTabelaPacientes(area) {
    var termo = (AppState.termoPesquisaPacientes || "").toLowerCase();
    var filtrados = AppState.pacientes;
    
    if (termo) {
        filtrados = AppState.pacientes.filter(function(p) {
            var nome = extrairNomePaciente(p).toLowerCase();
            return nome.indexOf(termo) !== -1;
        });
    }
    
    var totalPaginas = Math.ceil(filtrados.length / AppState.registosPorPagina) || 1;
    var inicio = (AppState.paginaActualPacientes - 1) * AppState.registosPorPagina;
    var pagina = filtrados.slice(inicio, inicio + AppState.registosPorPagina);
    
    var html = '<div class="tabela-container">';
    
    html += '<div class="tabela-header">';
    html += '<h3><i class="fa-solid fa-users"></i> Pacientes (' + filtrados.length + ')</h3>';
    html += '<div class="tabela-pesquisa">';
    html += '<i class="fa-solid fa-magnifying-glass"></i>';
    html += '<input type="text" id="input-pesquisa-pacientes" placeholder="Pesquisar por nome..." value="' + escaparHTML(AppState.termoPesquisaPacientes || "") + '" autocomplete="off">';
    html += '</div></div>';
    
    html += '<div class="tabela-wrapper"><table>';
    html += '<thead><tr><th>ID</th><th>Nome</th><th>Sexo</th><th>Idade</th><th>Bairro</th><th>Data</th><th>Total</th><th>Status</th><th>Accoes</th></tr></thead>';
    html += '<tbody id="tabela-pacientes-tbody">';
    
    if (pagina.length === 0) {
        html += '<tr><td colspan="9" class="text-center">Nenhum paciente encontrado.</td></tr>';
    } else {
        for (var i = 0; i < pagina.length; i++) {
            var p = pagina[i];
            var id = extrairID(p);
            var status = (p["Status Resultado"] || "").trim();
            var statusClass = (status === "Pendente" || status === "") ? "status-pendente" : "status-levantado";
            var statusTexto = status === "" ? "Pendente" : (status || "N/A");
            var bairro = extrairBairroSeguro(p);
            var totalPago = p["Total Pago"] ? parseInt(p["Total Pago"]) : 0;
            
            html += '<tr>';
            html += '<td data-label="ID">' + id + '</td>';
            html += '<td data-label="Nome">' + escaparHTML(extrairNomePaciente(p)) + '</td>';
            html += '<td data-label="Sexo">' + escaparHTML(p["Sexo"] || "N/A") + '</td>';
            html += '<td data-label="Idade">' + (p["Idade"] || "N/A") + '</td>';
            html += '<td data-label="Bairro">' + escaparHTML(bairro || "N/A") + '</td>';
            html += '<td data-label="Data">' + (p["Data Hora Atendimento"] || "N/A") + '</td>';
            html += '<td data-label="Total">' + (totalPago ? formatarKzs(totalPago) : "N/A") + '</td>';
            html += '<td data-label="Status"><span class="status-badge ' + statusClass + '">' + escaparHTML(statusTexto) + '</span></td>';
            html += '<td data-label="Accoes"><button class="btn btn-pequeno btn-secundario btn-ver-paciente" data-id="' + id + '"><i class="fa-solid fa-eye"></i> Ver</button></td>';
            html += '</tr>';
        }
    }
    
    html += '</tbody></table></div>';
    
    html += '<div class="paginacao" id="paginacao-pacientes">';
    html += '<button ' + (AppState.paginaActualPacientes <= 1 ? "disabled" : "") + ' data-pagina="anterior"><i class="fa-solid fa-chevron-left"></i></button>';
    for (var j = 1; j <= totalPaginas; j++) {
        html += '<button class="' + (j === AppState.paginaActualPacientes ? "activo" : "") + '" data-pagina="' + j + '">' + j + '</button>';
    }
    html += '<button ' + (AppState.paginaActualPacientes >= totalPaginas ? "disabled" : "") + ' data-pagina="proximo"><i class="fa-solid fa-chevron-right"></i></button>';
    html += '</div></div>';
    
    area.innerHTML = html;
    
    registarListenerPesquisaEstavel();
    bindPaginacaoPacientes();
    bindVerPaciente();
}

/**
 * Regista o listener de pesquisa sem recriar o input
 */
function registarListenerPesquisaEstavel() {
    var input = $("input-pesquisa-pacientes");
    if (!input) return;
    if (AppState.pesquisaListenerRegistado) return;
    
    input.addEventListener("input", function() {
        AppState.termoPesquisaPacientes = this.value;
        AppState.paginaActualPacientes = 1;
        
        var termo = this.value.toLowerCase().trim();
        var filtrados = AppState.pacientes;
        
        if (termo) {
            filtrados = AppState.pacientes.filter(function(p) {
                return extrairNomePaciente(p).toLowerCase().indexOf(termo) !== -1;
            });
        }
        
        actualizarTabelaIncremental(filtrados);
    });
    
    AppState.pesquisaListenerRegistado = true;
    
    if (document.activeElement === input) {
        var len = input.value.length;
        input.setSelectionRange(len, len);
    }
}

/**
 * Actualiza a tabela de pacientes de forma incremental (apenas tbody e paginacao)
 */
function actualizarTabelaIncremental(filtrados) {
    var tbody = $("tabela-pacientes-tbody");
    if (!tbody) {
        renderizarTabelaPacientes($("area-conteudo"));
        return;
    }
    
    var totalPaginas = Math.ceil(filtrados.length / AppState.registosPorPagina) || 1;
    if (AppState.paginaActualPacientes > totalPaginas) {
        AppState.paginaActualPacientes = totalPaginas;
    }
    
    var inicio = (AppState.paginaActualPacientes - 1) * AppState.registosPorPagina;
    var pagina = filtrados.slice(inicio, inicio + AppState.registosPorPagina);
    
    var html = "";
    
    if (pagina.length === 0) {
        html = '<tr><td colspan="9" class="text-center">Nenhum paciente encontrado.</td></tr>';
    } else {
        for (var i = 0; i < pagina.length; i++) {
            var p = pagina[i];
            var id = extrairID(p);
            var status = (p["Status Resultado"] || "").trim();
            var statusClass = (status === "Pendente" || status === "") ? "status-pendente" : "status-levantado";
            var statusTexto = status === "" ? "Pendente" : (status || "N/A");
            var bairro = extrairBairroSeguro(p);
            var totalPago = p["Total Pago"] ? parseInt(p["Total Pago"]) : 0;
            
            html += '<tr>';
            html += '<td data-label="ID">' + id + '</td>';
            html += '<td data-label="Nome">' + escaparHTML(extrairNomePaciente(p)) + '</td>';
            html += '<td data-label="Sexo">' + escaparHTML(p["Sexo"] || "N/A") + '</td>';
            html += '<td data-label="Idade">' + (p["Idade"] || "N/A") + '</td>';
            html += '<td data-label="Bairro">' + escaparHTML(bairro || "N/A") + '</td>';
            html += '<td data-label="Data">' + (p["Data Hora Atendimento"] || "N/A") + '</td>';
            html += '<td data-label="Total">' + (totalPago ? formatarKzs(totalPago) : "N/A") + '</td>';
            html += '<td data-label="Status"><span class="status-badge ' + statusClass + '">' + escaparHTML(statusTexto) + '</span></td>';
            html += '<td data-label="Accoes"><button class="btn btn-pequeno btn-secundario btn-ver-paciente" data-id="' + id + '"><i class="fa-solid fa-eye"></i> Ver</button></td>';
            html += '</tr>';
        }
    }
    
    tbody.innerHTML = html;
    
    var headerCount = document.querySelector(".tabela-header h3");
    if (headerCount) {
        headerCount.innerHTML = '<i class="fa-solid fa-users"></i> Pacientes (' + filtrados.length + ')';
    }
    
    actualizarPaginacaoIncremental(filtrados, totalPaginas);
    bindVerPaciente();
}

/**
 * Actualiza a paginacao de forma incremental
 */
function actualizarPaginacaoIncremental(filtrados, totalPaginas) {
    var container = $("paginacao-pacientes");
    if (!container) return;
    
    var pagHTML = '';
    pagHTML += '<button ' + (AppState.paginaActualPacientes <= 1 ? "disabled" : "") + ' data-pagina="anterior"><i class="fa-solid fa-chevron-left"></i></button>';
    for (var i = 1; i <= totalPaginas; i++) {
        pagHTML += '<button class="' + (i === AppState.paginaActualPacientes ? "activo" : "") + '" data-pagina="' + i + '">' + i + '</button>';
    }
    pagHTML += '<button ' + (AppState.paginaActualPacientes >= totalPaginas ? "disabled" : "") + ' data-pagina="proximo"><i class="fa-solid fa-chevron-right"></i></button>';
    container.innerHTML = pagHTML;
    
    bindPaginacaoPacientes();
}

/**
 * Adiciona event listeners aos botoes de paginacao
 */
function bindPaginacaoPacientes() {
    var container = $("paginacao-pacientes");
    if (!container) return;
    
    var botoes = container.querySelectorAll("button[data-pagina]");
    for (var i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener("click", function() {
            var pagina = this.getAttribute("data-pagina");
            
            if (pagina === "anterior" && AppState.paginaActualPacientes > 1) {
                AppState.paginaActualPacientes--;
            } else if (pagina === "proximo") {
                AppState.paginaActualPacientes++;
            } else if (!isNaN(parseInt(pagina))) {
                AppState.paginaActualPacientes = parseInt(pagina);
            }
            
            renderizarTabelaPacientes($("area-conteudo"));
        });
    }
}

/**
 * Adiciona event listeners aos botoes "Ver" dos pacientes
 */
function bindVerPaciente() {
    var botoes = document.querySelectorAll(".btn-ver-paciente");
    for (var i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener("click", async function() {
            var id = this.getAttribute("data-id");
            await abrirDetalhesPaciente(id);
        });
    }
}

/**
 * Abre o modal com os detalhes completos de um paciente
 */
async function abrirDetalhesPaciente(id) {
    var resultado = await API.buscarPaciente(id);
    
    if (!resultado.success) {
        mostrarNotificacao(resultado.message || "Paciente nao encontrado.", "erro");
        return;
    }
    
    var dp = resultado.data.dadosPessoais;
    var servicos = resultado.data.servicosRealizados;
    var totalServicos = resultado.data.totalServicos;
    var bairro = extrairBairroSeguro(dp);
    
    var html = '<div class="modal-header">';
    html += '<h3><i class="fa-solid fa-user"></i> Detalhes do Paciente</h3>';
    html += '<button class="modal-fechar" onclick="fecharModal()"><i class="fa-solid fa-times"></i></button>';
    html += '</div><div class="modal-corpo">';
    
    html += '<p><strong>ID:</strong> ' + extrairID(dp) + '</p>';
    html += '<p><strong>Nome:</strong> ' + escaparHTML(extrairNomePaciente(dp)) + '</p>';
    html += '<p><strong>Sexo:</strong> ' + escaparHTML(dp["Sexo"] || "N/A") + '</p>';
    html += '<p><strong>Idade:</strong> ' + (dp["Idade"] || "N/A") + '</p>';
    html += '<p><strong>Regiao/Bairro:</strong> ' + escaparHTML(bairro || "Nao informado") + '</p>';
    html += '<p><strong>Telefone:</strong> ' + escaparHTML(dp["Telefone"] || "Nao informado") + '</p>';
    html += '<p><strong>Email:</strong> ' + escaparHTML(dp["Email"] || "Nao informado") + '</p>';
    html += '<p><strong>Gravida:</strong> ' + escaparHTML(dp["Gravida"] || "Nao") + '</p>';
    html += '<p><strong>Data Atendimento:</strong> ' + (dp["Data Hora Atendimento"] || "N/A") + '</p>';
    html += '<p><strong>Atendido Por:</strong> ' + escaparHTML(dp["Atendido Por"] || "N/A") + '</p>';
    html += '<p><strong>Total Pago:</strong> ' + (dp["Total Pago"] ? formatarKzs(parseInt(dp["Total Pago"])) : "N/A") + '</p>';
    html += '<p><strong>Forma Pagamento:</strong> ' + escaparHTML(dp["Forma Pagamento"] || "N/A") + '</p>';
    html += '<p><strong>Status:</strong> ' + escaparHTML(dp["Status Resultado"] || "N/A") + '</p>';
    
    html += '<h4 style="margin-top:16px;"><i class="fa-solid fa-list-check"></i> Servicos Realizados (' + totalServicos + ')</h4>';
    
    var temServicos = false;
    var categoriasServicos = Object.keys(servicos || {});
    
    for (var i = 0; i < categoriasServicos.length; i++) {
        var cat = categoriasServicos[i];
        var listaServicos = servicos[cat] || [];
        
        if (listaServicos.length > 0) {
            temServicos = true;
            var nomeCategoria = NOMES_CATEGORIAS[cat] || cat;
            html += '<p><strong>' + escaparHTML(nomeCategoria) + ':</strong> ';
            
            var itens = [];
            for (var j = 0; j < listaServicos.length; j++) {
                itens.push('<i class="fa-solid fa-circle-check" style="color:var(--verde-primario);font-size:12px;"></i> ' + escaparHTML(listaServicos[j]));
            }
            html += itens.join(", ") + '</p>';
        }
    }
    
    if (!temServicos) {
        html += '<p>Nenhum servico realizado.</p>';
    }
    
    html += '</div>';
    
    abrirModal(html);
}

// ===== RESULTADOS PENDENTES =====

/**
 * Carrega e renderiza a lista de resultados pendentes
 */
async function renderizarPendentes(area) {
    area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-spinner fa-spin"></i><p>A carregar pendentes...</p></div>';
    
    var resultado = await API.listarPendentes();
    
    if (resultado.success && resultado.data) {
        AppState.pendentes = resultado.data.pendentes || [];
        actualizarBadgePendentes();
        
        if (AppState.pendentes.length === 0) {
            area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-circle-check" style="color:var(--sucesso);"></i><p>Todos os resultados foram levantados.</p></div>';
            return;
        }
        
        var html = '<h3 style="margin-bottom:16px;"><i class="fa-solid fa-clock"></i> Resultados Pendentes (' + AppState.pendentes.length + ')</h3>';
        html += '<div id="container-pendentes">';
        
        for (var i = 0; i < AppState.pendentes.length; i++) {
            var p = AppState.pendentes[i];
            var idPendente = p.id || p.ID || "N/A";
            var nomePendente = p.nomePaciente || p["Nome Paciente"] || "N/A";
            var dataPendente = p.dataHoraAtendimento || p["Data Hora Atendimento"] || "N/A";
            var atendidoPor = p.atendidoPor || p["Atendido Por"] || "N/A";
            
            html += '<div class="card-pendente" id="card-pendente-' + idPendente + '">';
            html += '<div class="card-pendente-info">';
            html += '<h4>' + escaparHTML(nomePendente) + '</h4>';
            html += '<p>Data: ' + dataPendente + ' | Atendido por: ' + escaparHTML(atendidoPor) + '</p>';
            html += '</div>';
            html += '<button class="btn btn-pequeno btn-primario" data-acao="marcar-levantado" data-id="' + idPendente + '" data-nome="' + escaparHTML(nomePendente) + '">';
            html += '<i class="fa-solid fa-check-circle"></i> Marcar Levantado</button>';
            html += '</div>';
        }
        
        html += '</div>';
        area.innerHTML = html;
    } else {
        area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-circle-xmark"></i><p>Erro ao carregar pendentes.</p></div>';
    }
}

// ===== GESTAO DE FUNCIONARIOS =====

/**
 * Renderiza a pagina de gestao de funcionarios (apenas Admin e Gestor)
 */
async function renderizarFuncionarios(area) {
    if (!temPermissao(["Administrador", "Gestor"])) {
        area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-lock"></i><p>Acesso restrito.</p></div>';
        return;
    }
    
    var resultado = await API.listarFuncionarios();
    var funcionarios = [];
    
    if (resultado.success && resultado.data) {
        funcionarios = resultado.data.funcionarios || [];
    }
    
    var html = '<div class="form-container">';
    html += '<h3 class="form-titulo"><i class="fa-solid fa-user-tie"></i> Gestao de Funcionarios</h3>';
    
    html += '<h4 style="margin-bottom:12px;"><i class="fa-solid fa-user-plus"></i> Novo Funcionario</h4>';
    html += '<div class="form-grid" id="form-novo-funcionario">';
    
    html += criarInputFunc("Nome Completo *", "text", "func-nome", "fa-user", true);
    html += criarSelectFunc("Sexo *", "func-sexo", ["Masculino", "Feminino"]);
    html += criarInputFunc("Morada *", "text", "func-morada", "fa-location-dot", true);
    html += criarInputFunc("Telefone", "number", "func-telefone", "fa-phone", false);
    html += criarInputFunc("Email", "email", "func-email", "fa-envelope", false);
    html += criarSelectFunc("Funcao *", "func-funcao", FUNCOES_PREDEFINIDAS);
    html += criarInputFunc("Username", "text", "func-username", "fa-user-tag", false);
    html += criarInputSenhaFunc();
    
    html += '</div>';
    html += '<button id="btn-criar-funcionario" class="btn btn-primario mt-16"><i class="fa-solid fa-save"></i> Criar Funcionario</button>';
    
    html += '<h4 style="margin-top:24px;margin-bottom:12px;"><i class="fa-solid fa-list"></i> Funcionarios (' + funcionarios.length + ')</h4>';
    html += '<div class="tabela-wrapper"><table><thead><tr><th>ID</th><th>Nome</th><th>Funcao</th><th>Username</th><th>Status</th></tr></thead><tbody>';
    
    if (funcionarios.length === 0) {
        html += '<tr><td colspan="5" class="text-center">Nenhum funcionario cadastrado.</td></tr>';
    } else {
        for (var i = 0; i < funcionarios.length; i++) {
            var f = funcionarios[i];
            html += '<tr>';
            html += '<td>' + (f.id || "N/A") + '</td>';
            html += '<td>' + escaparHTML(f.nomeCompleto || "N/A") + '</td>';
            html += '<td>' + escaparHTML(f.funcao || "N/A") + '</td>';
            html += '<td>' + escaparHTML(f.username || "N/A") + '</td>';
            html += '<td>' + escaparHTML(f.status || "N/A") + '</td>';
            html += '</tr>';
        }
    }
    
    html += '</tbody></table></div>';
    html += '</div>';
    
    area.innerHTML = html;
    inicializarBindingsFuncionarios();
}

/**
 * Cria o HTML de um campo de input para o formulario de funcionario
 */
function criarInputFunc(label, tipo, id, icone, obrigatorio) {
    return '<div><label class="input-label" for="' + id + '">' + label + '</label>' +
        '<div class="input-icon-wrapper"><i class="fa-solid ' + icone + ' input-icon"></i>' +
        '<input type="' + tipo + '" id="' + id + '" class="input-campo" placeholder="' + label.replace(" *", "") + '" ' + (obrigatorio ? 'required' : '') + '></div></div>';
}

/**
 * Cria o HTML de um select para o formulario de funcionario
 */
function criarSelectFunc(label, id, opcoes) {
    var html = '<div><label class="input-label" for="' + id + '">' + label + '</label>';
    html += '<select id="' + id + '" class="input-campo"><option value="">Seleccionar...</option>';
    for (var i = 0; i < opcoes.length; i++) {
        html += '<option value="' + opcoes[i] + '">' + opcoes[i] + '</option>';
    }
    html += '</select></div>';
    return html;
}

/**
 * Cria o HTML do campo de senha com toggle
 */
function criarInputSenhaFunc() {
    return '<div><label class="input-label" for="func-senha">Senha *</label>' +
        '<div class="input-icon-wrapper"><i class="fa-solid fa-lock input-icon"></i>' +
        '<input type="password" id="func-senha" class="input-campo" placeholder="Senha" required>' +
        '<button type="button" class="btn-toggle-senha" id="toggle-senha-func"><i class="fa-solid fa-eye"></i></button></div></div>';
}

/**
 * Inicializa os event listeners do formulario de funcionarios
 */
function inicializarBindingsFuncionarios() {
    var inputNome = $("func-nome");
    var inputUsername = $("func-username");
    
    if (inputNome && inputUsername) {
        inputNome.addEventListener("input", function() {
            if (!inputUsername.getAttribute("data-editado") || inputUsername.getAttribute("data-editado") === "false") {
                inputUsername.value = gerarUsername(this.value);
            }
        });
        
        inputUsername.addEventListener("input", function() {
            this.setAttribute("data-editado", "true");
        });
    }
    
    var toggleSenha = $("toggle-senha-func");
    var inputSenha = $("func-senha");
    
    if (toggleSenha && inputSenha) {
        toggleSenha.addEventListener("click", function() {
            var icone = this.querySelector("i");
            if (inputSenha.type === "password") {
                inputSenha.type = "text";
                if (icone) { icone.classList.remove("fa-eye"); icone.classList.add("fa-eye-slash"); }
            } else {
                inputSenha.type = "password";
                if (icone) { icone.classList.remove("fa-eye-slash"); icone.classList.add("fa-eye"); }
            }
        });
    }
    
    var btnCriar = $("btn-criar-funcionario");
    if (btnCriar) {
        btnCriar.addEventListener("click", async function() {
            var nome = ($("func-nome") ? $("func-nome").value : "").trim();
            var sexo = $("func-sexo") ? $("func-sexo").value : "";
            var morada = ($("func-morada") ? $("func-morada").value : "").trim();
            var funcao = $("func-funcao") ? $("func-funcao").value : "";
            var username = ($("func-username") ? $("func-username").value : "").trim();
            var senha = $("func-senha") ? $("func-senha").value : "";
            
            if (!nome || !sexo || !morada || !funcao || !username || !senha) {
                mostrarNotificacao("Preencha todos os campos obrigatorios.", "aviso");
                return;
            }
            
            var resultado = await API.criarFuncionario({
                nomeCompleto: nome,
                sexo: sexo,
                morada: morada,
                telefone: ($("func-telefone") ? $("func-telefone").value : "").trim(),
                email: ($("func-email") ? $("func-email").value : "").trim(),
                funcao: funcao,
                username: username,
                senha: senha
            });
            
            if (resultado.success) {
                mostrarNotificacao("Funcionario criado com sucesso.", "sucesso");
                renderizarFuncionarios($("area-conteudo"));
            } else {
                mostrarNotificacao(resultado.message || "Erro ao criar funcionario.", "erro");
            }
        });
    }
}

// ===== CONFIGURACOES =====

/**
 * Renderiza a pagina de configuracoes (apenas Admin e Gestor)
 */
function renderizarConfiguracoes(area) {
    if (!temPermissao(["Administrador", "Gestor"])) {
        area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-lock"></i><p>Acesso restrito.</p></div>';
        return;
    }
    
    var logoData = localStorage.getItem("solnascente_logo") || "";
    var nomeConsultorio = localStorage.getItem("solnascente_nome") || "Sol Nascente";
    
    var html = '<div class="form-container">';
    html += '<h3 class="form-titulo"><i class="fa-solid fa-gear"></i> Configuracoes do Sistema</h3>';
    
    html += '<div style="margin-bottom:20px;">';
    html += '<label class="input-label">URL do Apps Script</label>';
    html += '<input type="text" id="config-url" class="input-campo" value="' + escaparHTML(API_URL) + '" readonly style="background:#F5F5F5;">';
    html += '<p style="font-size:11px;color:var(--cinza-medio);margin-top:4px;">URL incorporada no codigo. Para alterar, edite o ficheiro app.js.</p>';
    html += '<div style="display:flex;gap:8px;margin-top:8px;">';
    html += '<button id="btn-testar-url" class="btn btn-pequeno btn-secundario"><i class="fa-solid fa-plug"></i> Testar Ligacao</button>';
    html += '</div></div>';
    
    html += '<div style="margin-bottom:20px;">';
    html += '<label class="input-label">Logotipo do Consultorio</label>';
    html += '<input type="file" id="config-logo" accept="image/*" class="input-campo">';
    html += '<div id="preview-logo" style="margin-top:8px;">';
    if (logoData) {
        html += '<img src="' + logoData + '" style="max-height:80px;border-radius:8px;" alt="Logotipo">';
    }
    html += '</div></div>';
    
    html += '<div style="margin-bottom:20px;">';
    html += '<label class="input-label">Nome do Consultorio</label>';
    html += '<input type="text" id="config-nome" class="input-campo" value="' + escaparHTML(nomeConsultorio) + '">';
    html += '<button id="btn-guardar-nome" class="btn btn-pequeno btn-primario mt-8"><i class="fa-solid fa-save"></i> Guardar Nome</button>';
    html += '</div>';
    
    html += '<div style="margin-bottom:20px;padding:16px;background:#FAFAFA;border-radius:8px;">';
    html += '<p style="font-size:13px;color:var(--cinza-medio);"><strong>Versao do Sistema:</strong> ' + VERSAO + '</p>';
    html += '<p style="font-size:13px;color:var(--cinza-medio);"><strong>API:</strong> Google Apps Script</p>';
    html += '<p style="font-size:13px;color:var(--cinza-medio);"><strong>Base de Dados:</strong> Google Sheets</p>';
    html += '<p style="font-size:13px;color:var(--cinza-medio);"><strong>Arquiteto:</strong> Alberto Teca Tomas</p>';
    html += '<p style="font-size:13px;color:var(--cinza-medio);"><strong>Local:</strong> Uige - Angola</p>';
    html += '</div>';
    
    html += '</div>';
    area.innerHTML = html;
    
    var btnTestar = $("btn-testar-url");
    if (btnTestar) {
        btnTestar.addEventListener("click", async function() {
            mostrarNotificacao("A testar ligacao com o servidor...", "info");
            var resultado = await API.ping();
            if (resultado.success) {
                mostrarNotificacao("Ligacao bem-sucedida! Servidor operacional.", "sucesso");
            } else {
                mostrarNotificacao("Falha na ligacao: " + (resultado.message || "Erro desconhecido"), "erro");
            }
        });
    }
    
    var inputLogo = $("config-logo");
    if (inputLogo) {
        inputLogo.addEventListener("change", function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(ev) {
                var dataURL = ev.target.result;
                localStorage.setItem("solnascente_logo", dataURL);
                aplicarLogotipo(dataURL);
                
                var preview = $("preview-logo");
                if (preview) {
                    preview.innerHTML = '<img src="' + dataURL + '" style="max-height:80px;border-radius:8px;" alt="Logotipo">';
                }
                mostrarNotificacao("Logotipo actualizado com sucesso.", "sucesso");
            };
            reader.readAsDataURL(file);
        });
    }
    
    var btnGuardarNome = $("btn-guardar-nome");
    if (btnGuardarNome) {
        btnGuardarNome.addEventListener("click", function() {
            var nome = $("config-nome") ? $("config-nome").value.trim() : "";
            if (!nome) nome = "Sol Nascente";
            localStorage.setItem("solnascente_nome", nome);
            aplicarNomeConsultorio(nome);
            mostrarNotificacao("Nome do consultorio guardado.", "sucesso");
        });
    }
}

/**
 * Aplica o logotipo guardado aos elementos da interface
 */
function aplicarLogotipo(dataURL) {
    var logoLogin = $("logo-login");
    var logoHeader = $("logo-header-img");
    var fallbackLogin = $("logo-login-fallback");
    
    if (logoLogin) { logoLogin.src = dataURL; logoLogin.style.display = "block"; }
    if (logoHeader) { logoHeader.src = dataURL; logoHeader.style.display = "block"; }
    if (fallbackLogin) fallbackLogin.style.display = "none";
}

/**
 * Aplica o nome do consultorio aos elementos da interface
 */
function aplicarNomeConsultorio(nome) {
    var elHeader = $("nome-sistema");
    var elLogin = $("logo-login-fallback");
    if (elHeader) elHeader.textContent = nome;
    if (elLogin) elLogin.textContent = nome;
}

/**
 * Carrega as configuracoes guardadas em localStorage
 */
function carregarConfiguracoesLocais() {
    var logo = localStorage.getItem("solnascente_logo");
    if (logo) aplicarLogotipo(logo);
    
    var nome = localStorage.getItem("solnascente_nome");
    if (nome) aplicarNomeConsultorio(nome);
}

// ===== INICIALIZACAO GERAL DO SISTEMA =====

/**
 * Inicializa todo o sistema: configuracoes, eventos, e sessao
 */
function inicializarSistema() {
    console.log("[SOL NASCENTE v" + VERSAO + "] Inicializando sistema...");
    
    carregarConfiguracoesLocais();
    
    var btnToggleSenha = $("btn-toggle-senha");
    if (btnToggleSenha) {
        btnToggleSenha.addEventListener("click", function() {
            var input = $("input-senha");
            var icone = this.querySelector("i");
            if (!input || !icone) return;
            
            if (input.type === "password") {
                input.type = "text";
                icone.classList.remove("fa-eye");
                icone.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icone.classList.remove("fa-eye-slash");
                icone.classList.add("fa-eye");
            }
        });
    }
    
    var formLogin = $("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", executarLogin);
    }
    
    var avatar = $("avatar-funcionario");
    if (avatar) {
        avatar.addEventListener("click", function(e) {
            e.stopPropagation();
            var dropdown = $("dropdown-avatar");
            if (dropdown) dropdown.classList.toggle("oculto");
        });
    }
    
    document.addEventListener("click", function() {
        var dropdown = $("dropdown-avatar");
        if (dropdown && !dropdown.classList.contains("oculto")) {
            dropdown.classList.add("oculto");
        }
    });
    
    var btnLogout = $("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", function() {
            mostrarLogin();
            mostrarNotificacao("Sessao terminada com sucesso.", "info");
        });
    }
    
    var todosNav = $$(".sidebar-item[data-vista], .bottom-nav-item[data-vista], .painel-mais-item[data-vista]");
    for (var i = 0; i < todosNav.length; i++) {
        todosNav[i].addEventListener("click", function() {
            var vista = this.getAttribute("data-vista");
            navegarPara(vista);
            var painelMais = $("painel-mais-mobile");
            if (painelMais) painelMais.classList.add("oculto");
        });
    }
    
    var btnMaisMobile = $("btn-mais-mobile");
    if (btnMaisMobile) {
        btnMaisMobile.addEventListener("click", function() {
            var painelMais = $("painel-mais-mobile");
            if (painelMais) painelMais.classList.toggle("oculto");
        });
    }
    
    var btnFecharMais = $("btn-fechar-mais-mobile");
    if (btnFecharMais) {
        btnFecharMais.addEventListener("click", function() {
            var painelMais = $("painel-mais-mobile");
            if (painelMais) painelMais.classList.add("oculto");
        });
    }
    
    var modalOverlay = $("modal-overlay");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", function(e) {
            if (e.target === this) fecharModal();
        });
    }
    
    document.addEventListener("click", async function(e) {
        var btn = e.target.closest("[data-acao='marcar-levantado']");
        if (!btn) return;
        if (btn.disabled) return;
        
        var id = btn.getAttribute("data-id");
        var nome = btn.getAttribute("data-nome");
        
        var confirmado = await mostrarConfirmacao("Confirma o levantamento do resultado de " + nome + "?");
        if (!confirmado) return;
        
        btn.disabled = true;
        btn.style.opacity = "0.6";
        
        var resultado = await API.actualizarResultado(id);
        
        btn.disabled = false;
        btn.style.opacity = "1";
        
        if (resultado.success) {
            var card = document.getElementById("card-pendente-" + id);
            if (card) card.remove();
            
            AppState.pendentes = AppState.pendentes.filter(function(p) {
                return (p.id || p.ID) != id;
            });
            
            actualizarBadgePendentes();
            
            if (AppState.pendentes.length === 0) {
                var area = $("area-conteudo");
                if (area && AppState.vistaActual === "pendentes") {
                    area.innerHTML = '<div class="estado-vazio"><i class="fa-solid fa-circle-check" style="color:var(--sucesso);"></i><p>Todos os resultados foram levantados.</p></div>';
                }
            }
            
            mostrarNotificacao("Resultado de " + nome + " marcado como levantado.", "sucesso");
        } else {
            mostrarNotificacao(resultado.message || "Erro ao actualizar.", "erro");
        }
    });
    
    var sessao = sessionStorage.getItem("solnascente_v3");
    if (sessao) {
        try {
            AppState.usuario = JSON.parse(sessao);
            if (AppState.usuario && AppState.usuario.id) {
                mostrarPainel();
                navegarPara("inicio");
            } else {
                mostrarLogin();
            }
        } catch (e) {
            sessionStorage.removeItem("solnascente_v3");
            mostrarLogin();
        }
    } else {
        mostrarLogin();
    }
    
    console.log("[SOL NASCENTE v" + VERSAO + "] Sistema inicializado com sucesso.");
}

document.addEventListener("DOMContentLoaded", function() {
    inicializarSistema();
});

// ===== FIM DO APP.JS v3.1.0 =====


// ===== AJUSTES DE AUTOCOMPLETE PACIENTE v1.0 =====
// Sistema Sol Nascente - Correção de posicionamento do dropdown

(function() {
    "use strict";
    
    /**
     * Garante que o dropdown de resultados tenha posicionamento correto
     * após cada renderização do formulário
     */
    function fixAutocompletePosition() {
        var container = document.getElementById("container-busca-paciente");
        var dropdown = document.getElementById("busca-resultados");
        
        if (!container || !dropdown) return;
        
        // Garantir que o container pai tem position relative
        if (window.getComputedStyle(container).position !== "relative") {
            container.style.position = "relative";
        }
        
        // Garantir que o dropdown está posicionado corretamente
        dropdown.style.position = "absolute";
        dropdown.style.top = "calc(100% + 4px)";
        dropdown.style.left = "0";
        dropdown.style.right = "0";
        dropdown.style.width = "100%";
    }
    
    /**
     * Ajusta o dropdown quando há scroll na página
     */
    function adjustDropdownOnScroll() {
        var dropdown = document.getElementById("busca-resultados");
        var input = document.getElementById("busca-paciente-existente");
        
        if (!dropdown || !input || dropdown.style.display !== "block") return;
        
        var rect = input.getBoundingClientRect();
        var viewportHeight = window.innerHeight;
        var spaceBelow = viewportHeight - rect.bottom;
        
        // Se não há espaço suficiente abaixo, abrir para cima
        if (spaceBelow < 200 && rect.top > 200) {
            dropdown.style.top = "auto";
            dropdown.style.bottom = "calc(100% + 4px)";
            dropdown.style.maxHeight = Math.min(spaceBelow + rect.height - 20, 240) + "px";
        } else {
            dropdown.style.top = "calc(100% + 4px)";
            dropdown.style.bottom = "auto";
            dropdown.style.maxHeight = Math.min(spaceBelow - 20, 240) + "px";
        }
    }
    
    /**
     * Fecha o dropdown ao rolar a página (opcional)
     */
    function closeDropdownOnScroll() {
        var dropdown = document.getElementById("busca-resultados");
        if (dropdown && dropdown.style.display === "block") {
            dropdown.style.display = "none";
        }
    }
    
    /**
     * Aplica correções ao inicializar bindings do Passo 1
     * Deve ser chamada APÓS o binding original
     */
    function applyAutocompleteFixes() {
        var input = document.getElementById("busca-paciente-existente");
        var dropdown = document.getElementById("busca-resultados");
        
        if (!input || !dropdown) return;
        
        // Aplicar fix de posicionamento
        fixAutocompletePosition();
        
        // Ajustar dropdown quando abrir
        var originalShow = function() {};
        
        // Observer para detectar quando o dropdown é exibido
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "style") {
                    if (dropdown.style.display === "block") {
                        adjustDropdownOnScroll();
                    }
                }
            });
        });
        
        observer.observe(dropdown, { attributes: true });
        
        // Ajustar no resize da janela
        window.addEventListener("resize", function() {
            if (dropdown.style.display === "block") {
                fixAutocompletePosition();
                adjustDropdownOnScroll();
            }
        });
        
        // Opcional: fechar dropdown ao scroll (descomente se desejar)
        // window.addEventListener("scroll", function() {
        //     if (dropdown.style.display === "block") {
        //         dropdown.style.display = "none";
        //     }
        // });
    }
    
    // Aguardar DOM carregado
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(applyAutocompleteFixes, 200);
        });
    } else {
        setTimeout(applyAutocompleteFixes, 200);
    }
    
    // Exportar funções para uso global (opcional)
    window.fixAutocompletePosition = fixAutocompletePosition;
    window.adjustDropdownOnScroll = adjustDropdownOnScroll;
    
})();