
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

// Mantém a conexão local para encaminhar as leituras recebidas por HTTP.
const conexoesPorPonto = new Map();

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

        if (ws.readyState !== WebSocket.CLOSED) {
            ws.close(closeCode, closeReason);
        }
    });
}

async function liberarBloqueio(client, pontoId) {
    try {
        await client.query(
            "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
            [`pesagem:${pontoId}`]
        );
        client.release();
    } catch (erro) {
        console.error(
            `Erro ao liberar o bloqueio do ponto ${pontoId}:`,
            erro.message
        );
        client.release(erro);
    }
}

async function iniciarSessao(ws, pontoId) {
    let client;

    try {
        client = await pool.connect();

        const resultado = await client.query(
            "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS adquirido",
            [`pesagem:${pontoId}`]
        );

        if (!resultado.rows[0].adquirido) {
            client.release();
            console.log(
                `Conexao recusada: ponto ${pontoId} ja esta em uso.`
            );
            enviarErroEFechar(
                ws,
                "SESSAO_ATIVA",
                "Este ponto de coleta já está sendo utilizado.",
                1008,
                "Ponto ja esta em uso."
            );
            return;
        }

        if (ws.readyState !== WebSocket.OPEN) {
            await liberarBloqueio(client, pontoId);
            return;
        }

        ws.pontoId = pontoId;
        ws.clienteBanco = client;
        conexoesPorPonto.set(pontoId, ws);

        console.log(`Cliente conectado ao ponto ${pontoId}.`);

        ws.once("close", () => {
            if (conexoesPorPonto.get(pontoId) === ws) {
                conexoesPorPonto.delete(pontoId);
            }

            const clienteBanco = ws.clienteBanco;
            ws.clienteBanco = null;

            if (clienteBanco) {
                void liberarBloqueio(clienteBanco, pontoId);
            }

            console.log(`Cliente desconectado do ponto ${pontoId}.`);
        });

        ws.on("error", (erro) => {
            console.error(
                `Erro WebSocket no ponto ${pontoId}:`,
                erro.message
            );
        });
    } catch (erro) {
        if (client) {
            client.release(erro);
        }

        console.error(
            `Nao foi possivel iniciar a sessao no ponto ${pontoId}:`,
            erro.message
        );
        enviarErroEFechar(
            ws,
            "SESSAO_INDISPONIVEL",
            "Não foi possível verificar se este ponto está livre. Tente novamente.",
            1011,
            "Falha ao verificar sessao."
        );
    }
}

// Verifica se o serviço está funcionando
app.get("/", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            mensagem: "Servidor WebSocket funcionando!",
            banco: "conectado",
        });
    } catch (erro) {
        console.error("Erro ao verificar a conexão com o banco:", erro.message);
        res.status(503).json({
            mensagem: "O serviço está sem conexão com o banco de dados.",
        });
    }
});

// Recebe uma leitura de peso via HTTP e transmite
// somente ao cliente conectado ao ponto correspondente
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

    const leitura = {
        tipo: "leitura_peso",
        pontoId,
        peso,
        atualizadoEm: new Date().toISOString(),
    };

    let clientesNotificados = 0;

    const cliente = conexoesPorPonto.get(pontoId);

    if (
        cliente &&
        cliente.readyState === WebSocket.OPEN
    ) {
        cliente.send(JSON.stringify(leitura));
        clientesNotificados++;
    }

    res.json({
        mensagem: "Leitura recebida.",
        clientesNotificados,
        leitura,
    });
});

// Registra novas conexões WebSocket
wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const pontoId = url.searchParams.get("pontoId");

    if (!pontoId || !pontoId.trim()) {
        ws.close(1008, "Informe o pontoId.");
        return;
    }

    void iniciarSessao(ws, pontoId);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}.`);
});
