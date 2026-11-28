const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");

const dotenvResult = dotenv.config({
    path: path.join(__dirname, ".env")
});

if (dotenvResult.error) {
    throw new Error(`Nao foi possivel carregar o arquivo .env: ${dotenvResult.error.message}`);
}

const express = require("express");
const relatoriosAnimaisRoutes = require("./src/routes/animalRoutes");

const app = express();
const PORT = process.env.PORT || process.env.RELATORIO_ANIMAIS_PORT || 5503;

// Configurações
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar funcionamento da API
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "ms-animals-registration"
    });
});

// Rotas de registro de animais
app.use("/api/animals-registration", relatoriosAnimaisRoutes);

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        message: "Rota nao encontrada"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API animals-registration em execucao na porta ${PORT}`);
});