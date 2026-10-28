
const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const app = express();
const server = http.createServer(app);

app.use(express.json());

const wss = new WebSocketServer({ server });

// Verifica se o serviço está funcionando
app.get("/", (req, res) => {
    res.json({
        mensagem: "Servidor WebSocket funcionando!",
    });
});

// Recebe uma leitura de peso via HTTP e transmite aos clientes WebSocket
app.post("/peso", (req, res) => {
    const { pontoId, peso } = req.body;

    if (!pontoId || typeof peso !== "number" || peso < 0) {
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

    wss.clients.forEach((cliente) => {
        if (cliente.readyState === WebSocket.OPEN) {
            cliente.send(JSON.stringify(leitura));
            clientesNotificados++;
        }
    });

    res.json({
        mensagem: "Leitura recebida.",
        clientesNotificados,
        leitura,
    });
});

// Registra novas conexões WebSocket
wss.on("connection", (ws) => {
    console.log("Cliente conectado ao WebSocket.");

    ws.on("close", () => {
        console.log("Cliente desconectado do WebSocket.");
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}.`);
});
