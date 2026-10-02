const express = require("express");

const app = express();

app.use(express.json());

app.post("/doacoes", (req, res) => {
    const peso = req.body.peso;
    const qntTampinhas = (peso *1000) / 2

    console.log("peso recebido: ", peso, "kg");
    console.log("Quantidade de Tampinhas: ", qntTampinhas, "un");

    res.json({
        mensagem: "Doação recebida com sucesso!",
        peso: peso,
        quantidadeTampinhas: qntTampinhas
    });
});

app.listen(3000, () => {
    console.log("API rodando na porta 3000");
});