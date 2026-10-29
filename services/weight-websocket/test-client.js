
const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
    console.log("Conectado ao servidor WebSocket!");
    console.log("Aguardando leituras da balança...");
});

ws.on("message", (dados) => {
    const leitura = JSON.parse(dados.toString());

    console.log("Nova leitura recebida:");
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
