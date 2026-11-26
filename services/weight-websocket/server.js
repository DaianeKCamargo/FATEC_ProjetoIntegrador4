require("dotenv").config();

const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("A variável DATABASE_URL não foi configurada.");
}

const app = express();
const server = http.createServer(app);

app.use(express.json());

const wss = new WebSocketServer({ server });
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
});

pool.on("error", (erro) => {
    console.error("Erro inesperado no pool do PostgreSQL:", erro.message);
});

const TEMPO_MAXIMO_SESSAO_MS = 2 * 60 * 1000; // 2 minutos máximos por doador
const INTERVALO_HEARTBEAT_MS = 10000; // Verifica conexão viva a cada 10s

// Trava atômica imediata em memória (protege contra cliques simultâneos e PgBouncer)
const pontosEmUso = new Set();

// Mantém a conexão local por pontoId para encaminhar as leituras recebidas por HTTP.
const conexoesPorPonto = new Map();

function gerarChaveSessao(pontoId) {
    return `pesagem:${pontoId.trim()}`;
}

function enviarErroEFechar(ws, codigo, mensagem, closeCode, closeReason) {
    if (ws.readyState !== WebSocket.OPEN) {
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.close(closeCode, closeReason);
        }
        return;
    }

    ws.send(JSON.stringify({
        tipo: "erro",
        codigo,
        mensagem,
    }), (erro) => {
        if (erro) {
            console.error("Erro ao informar falha na sessão:", erro.message);
        }

        setTimeout(() => {
            if (ws.readyState !== WebSocket.CLOSED) {
                ws.close(closeCode, closeReason);
            }
        }, 150);
    });
}

async function liberarBloqueio(pontoId, client, chaveSessao) {
    pontosEmUso.delete(pontoId);

    if (!client || !chaveSessao) return;
    try {
        await client.query(
            "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
            [chaveSessao]
        );
        client.release();
    } catch (erro) {
        console.error(`Erro ao liberar a sessão (${chaveSessao}):`, erro.message);
        client.release(erro);
    }
}

async function iniciarSessao(ws, pontoId) {
    // 1. VERIFICAÇÃO SÍNCRONA IMEDIATA (antes de qualquer await)
    if (pontosEmUso.has(pontoId)) {
        console.log(`Bloqueado imediatamente em memoria: ponto ${pontoId} ja esta em uso.`);
        enviarErroEFechar(
            ws,
            "SESSAO_ATIVA",
            "Outra pessoa já iniciou uma pesagem neste ponto de coleta. Aguarde a finalização antes de tentar novamente.",
            1008,
            "Sessao de pesagem ja ativa neste ponto."
        );
        return;
    }

    // Reserva o ponto no mesmo milissegundo em que o segundo celular tenta entrar
    pontosEmUso.add(pontoId);

    let client;
    const chaveSessao = gerarChaveSessao(pontoId);

    try {
        client = await pool.connect();

        const resultado = await client.query(
            "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS adquirido",
            [chaveSessao]
        );

        if (!resultado.rows[0].adquirido) {
            client.release();
            pontosEmUso.delete(pontoId);
            console.log(`Bloqueado pelo PostgreSQL: ponto ${pontoId} ja esta em uso.`);
            enviarErroEFechar(
                ws,
                "SESSAO_ATIVA",
                "Outra pessoa já iniciou uma pesagem neste ponto de coleta. Aguarde a finalização antes de tentar novamente.",
                1008,
                "Sessao de pesagem ja ativa neste ponto."
            );
            return;
        }

        if (ws.readyState !== WebSocket.OPEN) {
            await liberarBloqueio(pontoId, client, chaveSessao);
            return;
        }

        ws.pontoId = pontoId;
        ws.chaveSessao = chaveSessao;
        ws.clienteBanco = client;
        ws.isAlive = true;
        conexoesPorPonto.set(pontoId, ws);

        ws.on("pong", () => {
            ws.isAlive = true;
        });

        const timeoutSessao = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                enviarErroEFechar(
                    ws,
                    "TEMPO_ESGOTADO",
                    "Tempo limite de pesagem atingido neste ponto. Inicie novamente.",
                    1008,
                    "Tempo maximo de sessao excedido."
                );
            }
        }, TEMPO_MAXIMO_SESSAO_MS);

        ws.once("close", () => {
            clearTimeout(timeoutSessao);

            if (conexoesPorPonto.get(pontoId) === ws) {
                conexoesPorPonto.delete(pontoId);
            }

            const clienteBanco = ws.clienteBanco;
            const chave = ws.chaveSessao;
            ws.clienteBanco = null;
            ws.chaveSessao = null;

            void liberarBloqueio(pontoId, clienteBanco, chave);

            console.log(`Sessao encerrada e ponto ${pontoId} liberado.`);
        });

        ws.on("error", (erro) => {
            console.error(`Erro WebSocket no ponto ${pontoId}:`, erro.message);
        });

        ws.send(JSON.stringify({
            tipo: "sessao_iniciada",
            pontoId,
        }), (erro) => {
            if (erro) {
                console.error(`Erro ao confirmar sessao do ponto ${pontoId}:`, erro.message);
                if (ws.readyState !== WebSocket.CLOSED) {
                    ws.close(1011, "Falha ao confirmar sessao.");
                }
            }
        });

        console.log(`Sessao exclusiva iniciada no ponto ${pontoId}.`);
    } catch (erro) {
        if (client) {
            client.release(erro);
        }
        pontosEmUso.delete(pontoId);

        console.error(`Erro ao iniciar sessao no ponto ${pontoId}:`, erro.message);
        enviarErroEFechar(
            ws,
            "SESSAO_INDISPONIVEL",
            "Não foi possível verificar se já existe uma pesagem ativa neste ponto. Tente novamente.",
            1011,
            "Falha ao verificar sessao."
        );
    }
}

const intervaloHeartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`Encerrando conexao inativa no ponto ${ws.pontoId}...`);
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, INTERVALO_HEARTBEAT_MS);

wss.on("close", () => {
    clearInterval(intervaloHeartbeat);
});

app.get("/", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            mensagem: "Servidor WebSocket funcionando!",
            banco: "conectado",
            bloqueio: "memoria_e_banco_por_ponto",
            pontosAtivos: Array.from(pontosEmUso),
        });
    } catch (erro) {
        console.error("Erro ao verificar a conexão com o banco:", erro.message);
        res.status(503).json({
            mensagem: "O serviço está sem conexão com o banco de dados.",
        });
    }
});

app.post("/peso", (req, res) => {
    const { pontoId, peso } = req.body;

    if (
        typeof pontoId !== "string" ||
        !pontoId.trim() ||
        typeof peso !== "number" ||
        !Number.isFinite(peso) ||
        peso < 0
    ) {
        return res.status(400).json({
            erro: "Informe um pontoId e um peso válido.",
        });
    }

    const idLimpo = pontoId.trim();

    const leitura = {
        tipo: "leitura_peso",
        pontoId: idLimpo,
        peso,
        atualizadoEm: new Date().toISOString(),
    };

    let clientesNotificados = 0;
    const cliente = conexoesPorPonto.get(idLimpo);

    if (cliente && cliente.readyState === WebSocket.OPEN) {
        cliente.send(JSON.stringify(leitura));
        clientesNotificados++;
    }

    res.json({
        mensagem: "Leitura recebida.",
        clientesNotificados,
        leitura,
    });
});

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const pontoId = url.searchParams.get("pontoId");

    if (!pontoId || !pontoId.trim()) {
        ws.close(1008, "Informe o pontoId.");
        return;
    }

    void iniciarSessao(ws, pontoId.trim());
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}.`);
});