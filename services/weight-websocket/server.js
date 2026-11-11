
const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const app = express();
const server = http.createServer(app);

app.use(express.json());

const wss = new WebSocketServer({ server });

// Armazena uma única conexão ativa por ponto de coleta
const conexoesPorPonto = new Map();

// Verifica se o serviço está funcionando
app.get("/", (req, res) => {
    res.json({
        mensagem: "Servidor WebSocket funcionando!",
    });
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

    // Verifica se já existe alguém conectado ao ponto
    const conexaoExistente = conexoesPorPonto.get(pontoId);

    if (
        conexaoExistente &&
        conexaoExistente.readyState !== WebSocket.CLOSED
    ) {
        console.log(
            `Conexao recusada: ponto ${pontoId} ja esta em uso.`
        );

        ws.send(JSON.stringify({
            tipo: "erro",
            mensagem: "Este ponto de coleta já está sendo utilizado."
        }));

        ws.close(1008, "Ponto ja esta em uso.");
        return;
    }

    // Registra a nova conexão
    ws.pontoId = pontoId;
    conexoesPorPonto.set(pontoId, ws);

    console.log(
        `Cliente conectado ao ponto ${pontoId}.`
    );

    // Libera o ponto quando o cliente desconectar
    ws.on("close", () => {

        // Evita remover uma conexão mais recente
        if (conexoesPorPonto.get(pontoId) === ws) {
            conexoesPorPonto.delete(pontoId);
        }

        console.log(
            `Cliente desconectado do ponto ${pontoId}.`
        );
    });

    ws.on("error", (erro) => {
        console.error(
            `Erro WebSocket no ponto ${pontoId}:`,
            erro.message
        );
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}.`);
});
