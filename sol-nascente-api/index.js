/**
 * ============================================================
 * API SERVER - SISTEMA SOL NASCENTE
 * Servidor Express para produção no Render
 * Banco de Dados: PostgreSQL (Neon)
 * ============================================================
 * 
 * ✅ Desvinculado do Firebase (sem firebase-functions)
 * ✅ Conexão segura via process.env.DATABASE_URL
 * ✅ Porta dinâmica (process.env.PORT || 3000)
 * ✅ CORS restrito para domínios autorizados
 * ✅ Limite de payload de 10MB
 * ✅ Respostas JSON padronizadas
 * ✅ Proteção contra SQL injection via Tagged Templates
 * ✅ CRUD completo em todas as tabelas
 * 
 * Tabelas do banco (NOMES CORRETOS):
 * - sol_nascente.usuarios
 * - sol_nascente.controlo_financeiro
 * - sol_nascente.servicos_prestados
 * - sol_nascente.saidas_detalhadas
 * - sol_nascente.estoque_principal
 * - sol_nascente.estoque_movimentos
 * 
 * Versão: 7.0.0 (Render Production Ready - Nomes Corrigidos)
 * ============================================================
 */

const express = require('express');
const { neon, neonConfig, Pool } = require('@neondatabase/serverless');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const ws = require('ws');

// ============================================================
// 1. CONFIGURAÇÕES INICIAIS
// ============================================================

const app = express();

// Porta dinâmica para o Render (obrigatório)
const PORT = process.env.PORT || 3000;

// ============================================================
// 2. CONEXÃO COM NEON (via variável de ambiente)
// ============================================================

// Configurar WebSocket para Node.js (OBRIGATÓRIO para Neon)
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ ERRO CRÍTICO: DATABASE_URL não configurada no ambiente');
    console.error('   Configure a variável de ambiente DATABASE_URL no Render');
    process.exit(1);
}

// Criar pool de conexões para melhor performance
const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Função para queries com tagged template
const sql = neon(DATABASE_URL);

// Função para queries com contexto de utilizador (para RLS)
async function queryWithUser(sqlQuery, params, user) {
    const client = await pool.connect();
    try {
        if (user) {
            await client.query(`SET LOCAL app.user_acesso = $1`, [user.acesso]);
            await client.query(`SET LOCAL app.user_funcao = $1`, [user.funcao]);
            await client.query(`SET LOCAL app.user_id = $1`, [user.id]);
        }
        const result = await client.query(sqlQuery, params);
        return result;
    } finally {
        client.release();
    }
}

console.log('✅ Conexão com Neon PostgreSQL estabelecida');

// ============================================================
// 3. MIDDLEWARES DE SEGURANÇA E PERFORMANCE
// ============================================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(compression());
app.use(morgan('combined', { skip: (req, res) => res.statusCode < 400 }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// ============================================================
// 4. CORS CONFIGURADO PARA DOMÍNIOS AUTORIZADOS
// ============================================================

const allowedOrigins = [
    'https://sol-nascente.web.app',
    'https://sol-nascente.firebaseapp.com',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://localhost:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS bloqueado para origem: ${origin}`);
            callback(new Error('Não autorizado pelo CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// ============================================================
// 5. LIMITES DE PAYLOAD
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 6. FUNÇÕES AUXILIARES
// ============================================================

async function gerarProximoId(prefixo, tabela, colunaId = 'id') {
    try {
        const buscaPrefixo = `${prefixo}-%`;
        const query = `SELECT ${colunaId} FROM sol_nascente.${tabela} WHERE ${colunaId} LIKE $1 ORDER BY ${colunaId} DESC LIMIT 1`;
        const result = await pool.query(query, [buscaPrefixo]);
        
        let novoNumero = 1;
        const rows = result.rows || result;
        
        if (rows && rows.length > 0) {
            const ultimoId = rows[0][colunaId];
            if (ultimoId && ultimoId.includes('-')) {
                const ultimoNumero = parseInt(ultimoId.split('-')[1], 10);
                if (!isNaN(ultimoNumero)) {
                    novoNumero = ultimoNumero + 1;
                }
            }
        }
        
        return `${prefixo}-${String(novoNumero).padStart(4, '0')}`;
    } catch (error) {
        console.error("Erro ao gerar ID sequencial:", error);
        throw error;
    }
}

function logInfo(message, data = null) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    if (data) console.log(data);
}

function logError(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) console.error(error);
}

function successResponse(res, data, message = 'Operação realizada com sucesso', statusCode = 200) {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

function errorResponse(res, message, statusCode = 500, details = null) {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };
    if (details && process.env.NODE_ENV !== 'production') {
        response.details = details;
    }
    res.status(statusCode).json(response);
}

// ============================================================
// 7. HEALTH CHECK E STATUS
// ============================================================

app.get('/health', async (req, res) => {
    try {
        const result = await sql`SELECT NOW() as agora, current_database() as banco`;
        successResponse(res, {
            status: 'healthy',
            banco: result[0]?.banco,
            hora_banco: result[0]?.agora,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '7.0.0'
        }, 'API saudável');
    } catch (error) {
        logError('Health check falhou', error);
        errorResponse(res, 'Erro na conexão com o banco de dados', 503);
    }
});

app.get('/status', async (req, res) => {
    try {
        const result = await sql`SELECT NOW() as now, current_database() as database`;
        successResponse(res, {
            message: 'API do Sol Nascente está funcionando!',
            hora_banco: result[0]?.now,
            database: result[0]?.database,
            environment: process.env.NODE_ENV || 'development',
            porta: PORT
        });
    } catch (error) {
        logError('Erro no status', error);
        errorResponse(res, 'Erro ao conectar ao banco de dados', 500);
    }
});

// ============================================================
// MÓDULO 1: AUTENTICAÇÃO
// ============================================================

app.post("/api/login", loginLimiter, async (req, res) => {
    try {
        const { username, senha } = req.body;
        
        if (!username || !senha) {
            return errorResponse(res, 'Username e senha são obrigatórios.', 400);
        }
        
        logInfo(`Tentativa de login: ${username}`);
        
        const result = await sql`
            SELECT id, nome, funcao, username, acesso, estado 
            FROM sol_nascente.usuarios 
            WHERE username = ${username} 
              AND senha = ${senha} 
              AND estado = 'activo'
            LIMIT 1
        `;
        
        if (result && result.length > 0) {
            const usuario = result[0];
            logInfo(`Login bem-sucedido: ${username}`);
            successResponse(res, { usuario }, 'Login realizado com sucesso', 200);
        } else {
            logInfo(`Login falhou: ${username}`);
            errorResponse(res, 'Username ou senha incorretos.', 401);
        }
    } catch (error) {
        logError("Erro no login", error);
        errorResponse(res, 'Erro interno no servidor ao processar login.', 500);
    }
});

// ============================================================
// MÓDULO 2: CONTROLE FINANCEIRO
// ============================================================

app.get("/api/financeiro", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            query = sql`
                SELECT * FROM sol_nascente.controlo_financeiro 
                WHERE data >= ${data_inicio} AND data <= ${data_fim}
                ORDER BY data DESC, id DESC
            `;
        } else if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.controlo_financeiro
                WHERE instituicao = ${instituicao}
                ORDER BY data DESC, id DESC
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.controlo_financeiro 
                ORDER BY data DESC, id DESC
                LIMIT 500
            `;
        }
        
        const result = await query;
        successResponse(res, result, 'Movimentos financeiros carregados');
    } catch (error) {
        logError("Erro ao buscar financeiro", error);
        errorResponse(res, 'Erro ao buscar movimentos financeiros.', 500);
    }
});

app.post("/api/financeiro", async (req, res) => {
    try {
        const { 
            data, instituicao, descricao_entradas, entradas_caixa, entradas_banco,
            descricao_saidas, saidas_caixa, saidas_banco, registador
        } = req.body;
        
        if (!data || !instituicao || !registador) {
            return errorResponse(res, 'Data, instituição e registador são obrigatórios.', 400);
        }
        
        const novoId = await gerarProximoId('FIN', 'controlo_financeiro');
        
        const result = await sql`
            INSERT INTO sol_nascente.controlo_financeiro (
                id, data, instituicao, descricao_entradas, entradas_caixa, entradas_banco,
                descricao_saidas, saidas_caixa, saidas_banco, registador, criado_em, atualizado_em
            ) VALUES (
                ${novoId}, ${data}, ${instituicao}, ${descricao_entradas || null}, 
                ${entradas_caixa || 0}, ${entradas_banco || 0}, ${descricao_saidas || null},
                ${saidas_caixa || 0}, ${saidas_banco || 0}, ${registador}, NOW(), NOW()
            )
            RETURNING *
        `;
        
        logInfo(`Movimento financeiro criado: ${novoId}`);
        successResponse(res, result[0], 'Movimento financeiro registado com sucesso', 201);
    } catch (error) {
        logError("Erro ao criar movimento financeiro", error);
        errorResponse(res, 'Erro ao registar movimento financeiro.', 500);
    }
});

app.put("/api/financeiro/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            data, instituicao, descricao_entradas, entradas_caixa, entradas_banco,
            descricao_saidas, saidas_caixa, saidas_banco
        } = req.body;
        
        const existeResult = await sql`
            SELECT id FROM sol_nascente.controlo_financeiro WHERE id = ${id}
        `;
        
        if (!existeResult || existeResult.length === 0) {
            return errorResponse(res, 'Movimento financeiro não encontrado.', 404);
        }
        
        const result = await sql`
            UPDATE sol_nascente.controlo_financeiro 
            SET 
                data = COALESCE(${data}, data),
                instituicao = COALESCE(${instituicao}, instituicao),
                descricao_entradas = COALESCE(${descricao_entradas}, descricao_entradas),
                entradas_caixa = COALESCE(${entradas_caixa}, entradas_caixa),
                entradas_banco = COALESCE(${entradas_banco}, entradas_banco),
                descricao_saidas = COALESCE(${descricao_saidas}, descricao_saidas),
                saidas_caixa = COALESCE(${saidas_caixa}, saidas_caixa),
                saidas_banco = COALESCE(${saidas_banco}, saidas_banco),
                atualizado_em = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        
        logInfo(`Movimento financeiro actualizado: ${id}`);
        successResponse(res, result[0], 'Movimento financeiro actualizado com sucesso');
    } catch (error) {
        logError("Erro ao editar movimento financeiro", error);
        errorResponse(res, 'Erro ao editar movimento financeiro.', 500);
    }
});

app.delete("/api/financeiro/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await sql`
            DELETE FROM sol_nascente.controlo_financeiro 
            WHERE id = ${id}
            RETURNING id
        `;
        
        if (!result || result.length === 0) {
            return errorResponse(res, 'Movimento financeiro não encontrado.', 404);
        }
        
        logInfo(`Movimento financeiro removido: ${id}`);
        successResponse(res, null, 'Movimento financeiro removido com sucesso');
    } catch (error) {
        logError("Erro ao remover movimento financeiro", error);
        errorResponse(res, 'Erro ao remover movimento financeiro.', 500);
    }
});

// ============================================================
// MÓDULO 3: SERVIÇOS PRESTADOS
// ============================================================

app.get("/api/servicos", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            query = sql`
                SELECT * FROM sol_nascente.servicos_prestados 
                WHERE data >= ${data_inicio} AND data <= ${data_fim}
                ORDER BY data DESC, id DESC
            `;
        } else if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.servicos_prestados 
                WHERE instituicao = ${instituicao}
                ORDER BY data DESC, id DESC
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.servicos_prestados 
                ORDER BY data DESC, id DESC
                LIMIT 500
            `;
        }
        
        const result = await query;
        successResponse(res, result, 'Serviços carregados');
    } catch (error) {
        logError("Erro ao buscar serviços", error);
        errorResponse(res, 'Erro ao buscar serviços prestados.', 500);
    }
});

app.post("/api/servicos", async (req, res) => {
    try {
        const { data, instituicao, tipo_servico, quantidade, caixa, banco, registador } = req.body;
        
        if (!data || !instituicao || !tipo_servico || !registador) {
            return errorResponse(res, 'Data, instituição, tipo de serviço e registador são obrigatórios.', 400);
        }
        
        const novoId = await gerarProximoId('SRV', 'servicos_prestados');
        
        const result = await sql`
            INSERT INTO sol_nascente.servicos_prestados (
                id, data, instituicao, tipo_servico, quantidade, caixa, banco, registador, criado_em, atualizado_em
            ) VALUES (
                ${novoId}, ${data}, ${instituicao}, ${tipo_servico}, 
                ${quantidade || 1}, ${caixa || 0}, ${banco || 0}, ${registador}, NOW(), NOW()
            )
            RETURNING *
        `;
        
        logInfo(`Serviço criado: ${novoId}`);
        successResponse(res, result[0], 'Serviço registado com sucesso', 201);
    } catch (error) {
        logError("Erro ao criar serviço", error);
        errorResponse(res, 'Erro ao registar serviço prestado.', 500);
    }
});

app.put("/api/servicos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data, instituicao, tipo_servico, quantidade, caixa, banco } = req.body;
        
        const existeResult = await sql`
            SELECT id FROM sol_nascente.servicos_prestados WHERE id = ${id}
        `;
        
        if (!existeResult || existeResult.length === 0) {
            return errorResponse(res, 'Serviço não encontrado.', 404);
        }
        
        const result = await sql`
            UPDATE sol_nascente.servicos_prestados 
            SET 
                data = COALESCE(${data}, data),
                instituicao = COALESCE(${instituicao}, instituicao),
                tipo_servico = COALESCE(${tipo_servico}, tipo_servico),
                quantidade = COALESCE(${quantidade}, quantidade),
                caixa = COALESCE(${caixa}, caixa),
                banco = COALESCE(${banco}, banco),
                atualizado_em = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        
        logInfo(`Serviço actualizado: ${id}`);
        successResponse(res, result[0], 'Serviço actualizado com sucesso');
    } catch (error) {
        logError("Erro ao editar serviço", error);
        errorResponse(res, 'Erro ao editar serviço prestado.', 500);
    }
});

app.delete("/api/servicos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await sql`
            DELETE FROM sol_nascente.servicos_prestados 
            WHERE id = ${id}
            RETURNING id
        `;
        
        if (!result || result.length === 0) {
            return errorResponse(res, 'Serviço não encontrado.', 404);
        }
        
        logInfo(`Serviço removido: ${id}`);
        successResponse(res, null, 'Serviço removido com sucesso');
    } catch (error) {
        logError("Erro ao remover serviço", error);
        errorResponse(res, 'Erro ao remover serviço prestado.', 500);
    }
});

// ============================================================
// MÓDULO 4: SAÍDAS DETALHADAS
// ============================================================

app.get("/api/saidas", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            query = sql`
                SELECT * FROM sol_nascente.saidas_detalhadas 
                WHERE data >= ${data_inicio} AND data <= ${data_fim}
                ORDER BY data DESC, id DESC
            `;
        } else if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.saidas_detalhadas 
                WHERE instituicao = ${instituicao}
                ORDER BY data DESC, id DESC
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.saidas_detalhadas 
                ORDER BY data DESC, id DESC
                LIMIT 500
            `;
        }
        
        const result = await query;
        successResponse(res, result, 'Saídas carregadas');
    } catch (error) {
        logError("Erro ao buscar saídas", error);
        errorResponse(res, 'Erro ao buscar saídas detalhadas.', 500);
    }
});

app.post("/api/saidas", async (req, res) => {
    try {
        const { data, instituicao, descricao, caixa, banco, quem_tirou } = req.body;
        
        if (!data || !instituicao || !descricao) {
            return errorResponse(res, 'Data, instituição e descrição são obrigatórios.', 400);
        }
        
        const novoId = await gerarProximoId('SAI', 'saidas_detalhadas');
        
        const result = await sql`
            INSERT INTO sol_nascente.saidas_detalhadas (
                id, data, instituicao, descricao, caixa, banco, quem_tirou, criado_em, atualizado_em
            ) VALUES (
                ${novoId}, ${data}, ${instituicao}, ${descricao}, 
                ${caixa || 0}, ${banco || 0}, ${quem_tirou || 'Sistema'}, NOW(), NOW()
            )
            RETURNING *
        `;
        
        logInfo(`Saída criada: ${novoId}`);
        successResponse(res, result[0], 'Saída registada com sucesso', 201);
    } catch (error) {
        logError("Erro ao criar saída", error);
        errorResponse(res, 'Erro ao registar saída detalhada.', 500);
    }
});

app.delete("/api/saidas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await sql`
            DELETE FROM sol_nascente.saidas_detalhadas 
            WHERE id = ${id}
            RETURNING id
        `;
        
        if (!result || result.length === 0) {
            return errorResponse(res, 'Saída não encontrada.', 404);
        }
        
        logInfo(`Saída removida: ${id}`);
        successResponse(res, null, 'Saída removida com sucesso');
    } catch (error) {
        logError("Erro ao remover saída", error);
        errorResponse(res, 'Erro ao remover saída detalhada.', 500);
    }
});

// ============================================================
// MÓDULO 5: ESTOQUE PRINCIPAL
// ============================================================

app.get("/api/estoque", async (req, res) => {
    try {
        const { instituicao, nome_produto } = req.query;
        
        let query;
        if (nome_produto) {
            query = sql`
                SELECT * FROM sol_nascente.estoque_principal 
                WHERE nome_produto ILIKE ${'%' + nome_produto + '%'}
                ORDER BY nome_produto
            `;
        } else if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.estoque_principal 
                WHERE instituicao = ${instituicao}
                ORDER BY nome_produto
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.estoque_principal 
                ORDER BY nome_produto
                LIMIT 500
            `;
        }
        
        const result = await query;
        successResponse(res, result, 'Estoque carregado');
    } catch (error) {
        logError("Erro ao buscar estoque", error);
        errorResponse(res, 'Erro ao buscar estoque principal.', 500);
    }
});

app.put("/api/estoque/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_produto, data_expiracao } = req.body;
        
        const existeResult = await sql`
            SELECT id FROM sol_nascente.estoque_principal WHERE id = ${id}
        `;
        
        if (!existeResult || existeResult.length === 0) {
            return errorResponse(res, 'Produto não encontrado no estoque.', 404);
        }
        
        const result = await sql`
            UPDATE sol_nascente.estoque_principal 
            SET 
                nome_produto = COALESCE(${nome_produto}, nome_produto),
                data_expiracao = COALESCE(${data_expiracao}, data_expiracao),
                atualizado_em = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        
        logInfo(`Produto actualizado no estoque: ${id}`);
        successResponse(res, result[0], 'Produto actualizado com sucesso');
    } catch (error) {
        logError("Erro ao editar produto", error);
        errorResponse(res, 'Erro ao editar produto do estoque.', 500);
    }
});

app.delete("/api/estoque/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const produto = await sql`
            SELECT quantidade_atual FROM sol_nascente.estoque_principal WHERE id = ${id}
        `;
        
        if (!produto || produto.length === 0) {
            return errorResponse(res, 'Produto não encontrado.', 404);
        }
        
        if (produto[0].quantidade_atual > 0) {
            return errorResponse(res, 'Não é possível remover um produto com stock positivo. Registar uma saída primeiro.', 400);
        }
        
        const result = await sql`
            DELETE FROM sol_nascente.estoque_principal 
            WHERE id = ${id}
            RETURNING id
        `;
        
        logInfo(`Produto removido do estoque: ${id}`);
        successResponse(res, null, 'Produto removido do estoque com sucesso');
    } catch (error) {
        logError("Erro ao remover produto", error);
        errorResponse(res, 'Erro ao remover produto do estoque.', 500);
    }
});

// ============================================================
// MÓDULO 6: MOVIMENTOS DE ESTOQUE
// ============================================================

app.post("/api/estoque/movimentar", async (req, res) => {
    try {
        const { produto_id, nome_produto, instituicao, quantidade, tipo_movimento, data_expiracao, usuario } = req.body;
        
        if (!nome_produto || !instituicao || !quantidade || !tipo_movimento || !usuario) {
            return errorResponse(res, 'Nome do produto, instituição, quantidade, tipo de movimento e usuário são obrigatórios.', 400);
        }
        
        if (quantidade <= 0) {
            return errorResponse(res, 'A quantidade deve ser maior que zero.', 400);
        }
        
        if (tipo_movimento !== 'ENTRADA' && tipo_movimento !== 'SAIDA') {
            return errorResponse(res, 'Tipo de movimento deve ser ENTRADA ou SAIDA.', 400);
        }
        
        let produtoExistente;
        if (produto_id) {
            const result = await sql`
                SELECT * FROM sol_nascente.estoque_principal WHERE id = ${produto_id}
            `;
            produtoExistente = result && result.length > 0 ? result[0] : null;
        } else {
            const result = await sql`
                SELECT * FROM sol_nascente.estoque_principal 
                WHERE nome_produto = ${nome_produto} AND instituicao = ${instituicao}
            `;
            produtoExistente = result && result.length > 0 ? result[0] : null;
        }
        
        let produtoIdFinal = produto_id;
        
        if (!produtoExistente && tipo_movimento === 'SAIDA') {
            return errorResponse(res, `Produto "${nome_produto}" não encontrado no stock. Registar uma entrada primeiro.`, 400);
        }
        
        if (!produtoExistente && tipo_movimento === 'ENTRADA') {
            produtoIdFinal = await gerarProximoId('STK', 'estoque_principal');
            
            await sql`
                INSERT INTO sol_nascente.estoque_principal (
                    id, instituicao, nome_produto, data_expiracao, quantidade_atual, entradas_acumuladas, saidas_acumuladas, criado_em, atualizado_em
                ) VALUES (
                    ${produtoIdFinal}, ${instituicao}, ${nome_produto}, ${data_expiracao || null}, 
                    ${quantidade}, ${quantidade}, 0, NOW(), NOW()
                )
            `;
            
            logInfo(`Novo produto criado: ${produtoIdFinal} - ${nome_produto}`);
        }
        
        if (produtoExistente && tipo_movimento === 'ENTRADA') {
            produtoIdFinal = produtoExistente.id;
            await sql`
                UPDATE sol_nascente.estoque_principal 
                SET 
                    quantidade_atual = quantidade_atual + ${quantidade},
                    entradas_acumuladas = entradas_acumuladas + ${quantidade},
                    data_expiracao = COALESCE(${data_expiracao}, data_expiracao),
                    atualizado_em = NOW()
                WHERE id = ${produtoIdFinal}
            `;
        }
        
        if (produtoExistente && tipo_movimento === 'SAIDA') {
            produtoIdFinal = produtoExistente.id;
            const stockAtual = produtoExistente.quantidade_atual;
            
            if (quantidade > stockAtual) {
                return errorResponse(res, `Stock insuficiente para "${nome_produto}". Disponível: ${stockAtual}, Solicitado: ${quantidade}`, 400);
            }
            
            await sql`
                UPDATE sol_nascente.estoque_principal 
                SET 
                    quantidade_atual = quantidade_atual - ${quantidade},
                    saidas_acumuladas = saidas_acumuladas + ${quantidade},
                    atualizado_em = NOW()
                WHERE id = ${produtoIdFinal}
            `;
        }
        
        const movId = await gerarProximoId('STM', 'estoque_movimentos');
        
        await sql`
            INSERT INTO sol_nascente.estoque_movimentos (
                id, produto_id, nome_produto, instituicao, quantidade, tipo_movimento, data_expiracao, usuario, data_registro, criado_em
            ) VALUES (
                ${movId}, ${produtoIdFinal}, ${nome_produto}, ${instituicao}, 
                ${quantidade}, ${tipo_movimento}, ${data_expiracao || null}, ${usuario}, CURRENT_DATE, NOW()
            )
        `;
        
        logInfo(`Movimento de stock: ${movId} - ${tipo_movimento} de ${quantidade} ${nome_produto}`);
        
        successResponse(res, { movimento_id: movId, produto_id: produtoIdFinal }, `Movimentação processada. ${tipo_movimento === 'ENTRADA' ? '+' : '-'}${quantidade} unidades.`);
    } catch (error) {
        logError("Erro ao processar movimentação", error);
        errorResponse(res, 'Erro ao processar movimentação de estoque.', 500);
    }
});

app.get("/api/estoque/movimentos", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao, produto_id } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            query = sql`
                SELECT * FROM sol_nascente.estoque_movimentos 
                WHERE data_registro >= ${data_inicio} AND data_registro <= ${data_fim}
                ORDER BY data_registro DESC, id DESC
                LIMIT 500
            `;
        } else if (produto_id) {
            query = sql`
                SELECT * FROM sol_nascente.estoque_movimentos 
                WHERE produto_id = ${produto_id}
                ORDER BY data_registro DESC, id DESC
                LIMIT 200
            `;
        } else if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.estoque_movimentos 
                WHERE instituicao = ${instituicao}
                ORDER BY data_registro DESC, id DESC
                LIMIT 500
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.estoque_movimentos 
                ORDER BY data_registro DESC, id DESC
                LIMIT 500
            `;
        }
        
        const result = await query;
        successResponse(res, result, 'Histórico de movimentações carregado');
    } catch (error) {
        logError("Erro ao buscar movimentos", error);
        errorResponse(res, 'Erro ao buscar histórico de movimentações.', 500);
    }
});

// ============================================================
// MÓDULO 7: DASHBOARD
// ============================================================

app.get("/api/dashboard", async (req, res) => {
    try {
        const { mes, ano } = req.query;
        const mesActual = mes || new Date().getMonth() + 1;
        const anoActual = ano || new Date().getFullYear();
        
        const [entradas, saidas, servicos, alertas] = await Promise.all([
            sql`
                SELECT COALESCE(SUM(entradas_caixa + entradas_banco), 0) as total
                FROM sol_nascente.controlo_financeiro
                WHERE EXTRACT(MONTH FROM data) = ${mesActual} AND EXTRACT(YEAR FROM data) = ${anoActual}
            `,
            sql`
                SELECT COALESCE(SUM(saidas_caixa + saidas_banco), 0) as total
                FROM sol_nascente.controlo_financeiro 
                WHERE EXTRACT(MONTH FROM data) = ${mesActual} AND EXTRACT(YEAR FROM data) = ${anoActual}
            `,
            sql`
                SELECT 
                    COALESCE(SUM(quantidade), 0) as total_servicos,
                    COALESCE(SUM(caixa + banco), 0) as receita
                FROM sol_nascente.servicos_prestados 
                WHERE EXTRACT(MONTH FROM data) = ${mesActual} AND EXTRACT(YEAR FROM data) = ${anoActual}
            `,
            sql`
                SELECT id, nome_produto, instituicao, quantidade_atual, data_expiracao
                FROM sol_nascente.estoque_principal 
                WHERE quantidade_atual <= 5 OR data_expiracao <= CURRENT_DATE + INTERVAL '30 days'
                ORDER BY quantidade_atual ASC
                LIMIT 10
            `
        ]);
        
        successResponse(res, {
            metricas: {
                total_entradas: parseFloat(entradas[0]?.total || 0),
                total_saidas: parseFloat(saidas[0]?.total || 0),
                saldo: parseFloat((entradas[0]?.total || 0) - (saidas[0]?.total || 0)),
                total_servicos: parseInt(servicos[0]?.total_servicos || 0),
                receita_servicos: parseFloat(servicos[0]?.receita || 0)
            },
            alertas: alertas
        }, 'Dashboard carregado');
    } catch (error) {
        logError("Erro no dashboard", error);
        errorResponse(res, 'Erro ao carregar dashboard.', 500);
    }
});

// ============================================================
// MÓDULO 8: RELATÓRIOS
// ============================================================

app.get("/api/relatorios/financeiro", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.controlo_financeiro 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    AND instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.controlo_financeiro 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    ORDER BY data DESC, id DESC
                `;
            }
        } else {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.controlo_financeiro 
                    WHERE instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.controlo_financeiro 
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            }
        }
        
        const result = await query;
        
        let totalEntradas = 0, totalSaidas = 0;
        for (const item of result) {
            totalEntradas += (item.entradas_caixa || 0) + (item.entradas_banco || 0);
            totalSaidas += (item.saidas_caixa || 0) + (item.saidas_banco || 0);
        }
        
        successResponse(res, {
            movimentos: result,
            totais: {
                total_entradas: totalEntradas,
                total_saidas: totalSaidas,
                saldo_final: totalEntradas - totalSaidas,
                total_registos: result.length
            }
        }, 'Relatório financeiro gerado');
    } catch (error) {
        logError("Erro no relatório financeiro", error);
        errorResponse(res, 'Erro ao gerar relatório financeiro.', 500);
    }
});

app.get("/api/relatorios/servicos", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.servicos_prestados 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    AND instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.servicos_prestados 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    ORDER BY data DESC, id DESC
                `;
            }
        } else {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.servicos_prestados 
                    WHERE instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.servicos_prestados 
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            }
        }
        
        const result = await query;
        
        let totalReceita = 0, totalServicos = 0;
        for (const item of result) {
            totalReceita += (item.caixa || 0) + (item.banco || 0);
            totalServicos += item.quantidade || 1;
        }
        
        successResponse(res, {
            servicos: result,
            totais: {
                total_receita: totalReceita,
                total_servicos: totalServicos,
                total_registos: result.length
            }
        }, 'Relatório de serviços gerado');
    } catch (error) {
        logError("Erro no relatório de serviços", error);
        errorResponse(res, 'Erro ao gerar relatório de serviços.', 500);
    }
});

app.get("/api/relatorios/saidas", async (req, res) => {
    try {
        const { data_inicio, data_fim, instituicao } = req.query;
        
        let query;
        if (data_inicio && data_fim) {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.saidas_detalhadas 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    AND instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.saidas_detalhadas 
                    WHERE data >= ${data_inicio} AND data <= ${data_fim}
                    ORDER BY data DESC, id DESC
                `;
            }
        } else {
            if (instituicao && instituicao !== 'Todos') {
                query = sql`
                    SELECT * FROM sol_nascente.saidas_detalhadas 
                    WHERE instituicao = ${instituicao}
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            } else {
                query = sql`
                    SELECT * FROM sol_nascente.saidas_detalhadas 
                    ORDER BY data DESC, id DESC
                    LIMIT 1000
                `;
            }
        }
        
        const result = await query;
        
        let totalCaixa = 0, totalBanco = 0, totalGeral = 0;
        for (const item of result) {
            totalCaixa += item.caixa || 0;
            totalBanco += item.banco || 0;
            totalGeral += item.total || 0;
        }
        
        successResponse(res, {
            saidas: result,
            totais: {
                total_caixa: totalCaixa,
                total_banco: totalBanco,
                total_geral: totalGeral,
                total_registos: result.length
            }
        }, 'Relatório de saídas gerado');
    } catch (error) {
        logError("Erro no relatório de saídas", error);
        errorResponse(res, 'Erro ao gerar relatório de saídas.', 500);
    }
});

app.get("/api/relatorios/estoque", async (req, res) => {
    try {
        const { instituicao } = req.query;
        
        let query;
        if (instituicao && instituicao !== 'Todos') {
            query = sql`
                SELECT * FROM sol_nascente.estoque_principal
                WHERE instituicao = ${instituicao}
                ORDER BY nome_produto
            `;
        } else {
            query = sql`
                SELECT * FROM sol_nascente.estoque_principal 
                ORDER BY nome_produto
            `;
        }
        
        const result = await query;
        
        let totalProdutos = result.length;
        let produtosComStock = 0;
        let produtosZerados = 0;
        let produtosExpirados = 0;
        
        for (const item of result) {
            if (item.quantidade_atual > 0) produtosComStock++;
            if (item.quantidade_atual === 0) produtosZerados++;
            if (item.data_expiracao && new Date(item.data_expiracao) < new Date()) produtosExpirados++;
        }
        
        successResponse(res, {
            produtos: result,
            totais: {
                total_produtos: totalProdutos,
                produtos_com_stock: produtosComStock,
                produtos_zerados: produtosZerados,
                produtos_expirados: produtosExpirados
            }
        }, 'Relatório de estoque gerado');
    } catch (error) {
        logError("Erro no relatório de estoque", error);
        errorResponse(res, 'Erro ao gerar relatório de estoque.', 500);
    }
});

// ============================================================
// 9. TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================================

app.use((req, res) => {
    errorResponse(res, `Rota ${req.originalUrl} não encontrada.`, 404);
});

// ============================================================
// 10. INICIALIZAÇÃO DO SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏥 SISTEMA SOL NASCENTE - API SERVER                      ║
║   📍 Versão: 7.0.0 (Production Ready)                       ║
║   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}                         ║
║   🔌 Porta: ${PORT}                                          ║
║   💾 Banco: Neon PostgreSQL                                  ║
║   🔐 WebSocket: Configurado para Neon                       ║
║                                                              ║
║   ✅ Servidor rodando com sucesso!                          ║
║   📡 API disponível em: http://localhost:${PORT}/api          ║
║   ❤️  Health check: http://localhost:${PORT}/health           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// ============================================================
// 11. TRATAMENTO DE SINAIS
// ============================================================

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM recebido, encerrando pool de conexões...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT recebido, encerrando pool de conexões...');
    await pool.end();
    process.exit(0);
});

module.exports = app;