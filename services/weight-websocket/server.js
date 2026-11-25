
const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const app = express();
const server = http.createServer(app);

app.use(express.json());

const wss = new WebSocketServer({ server });

// Apenas uma sessão de pesagem pode ficar ativa em todo o serviço
let sessaoAtiva = null;

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

    const cliente = sessaoAtiva;

    if (
        cliente &&
        cliente.readyState === WebSocket.OPEN &&
        cliente.pontoId === pontoId
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

    // Impede sessões simultâneas, mesmo em pontos de coleta diferentes
    const conexaoExistente = sessaoAtiva;

    if (
        conexaoExistente &&
        conexaoExistente.readyState !== WebSocket.CLOSED
    ) {
        console.log(
            `Conexao recusada: ja existe uma sessao ativa no ponto ${conexaoExistente.pontoId}.`
        );

        ws.send(JSON.stringify({
            tipo: "erro",
            codigo: "SESSAO_ATIVA",
            mensagem: "Já existe uma sessão de pesagem ativa."
        }));

        ws.close(1008, "Ponto ja esta em uso.");
        return;
    }

    // Registra a nova conexão
    ws.pontoId = pontoId;
    sessaoAtiva = ws;

    console.log(
        `Cliente conectado ao ponto ${pontoId}.`
    );

    // Libera o ponto quando o cliente desconectar
    ws.on("close", () => {

        // Evita liberar uma sessão mais recente
        if (sessaoAtiva === ws) {
            sessaoAtiva = null;
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
