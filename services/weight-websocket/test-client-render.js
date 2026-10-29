
const WebSocket = require("ws");

const pontoId = process.argv[2] || "PONTO-001";

const ws = new WebSocket(
    `wss://weight-websocket.onrender.com/?pontoId=${pontoId}`
);

ws.on("open", () => {
    console.log(`Conectado ao ponto ${pontoId}.`);
    console.log("Aguardando leituras de peso...");
});

ws.on("message", (dados) => {
    const leitura = JSON.parse(dados.toString());

    console.log("Leitura recebida:");
    console.log(`Ponto: ${leitura.pontoId}`);
    console.log(`Peso: ${leitura.peso} kg`);
    console.log(`Horário: ${leitura.atualizadoEm}`);
});

ws.on("error", (erro) => {
    console.error("Erro na conexão:", erro.message);
});

ws.on("close", () => {
    console.log("Conexão encerrada.");
});
