const path = require("path");
const dotenv = require("dotenv");

const dotenvResult = dotenv.config({
    path: path.join(__dirname, ".env")
});

if (dotenvResult.error) {
    throw new Error(`Nao foi possivel carregar o arquivo .env: ${dotenvResult.error.message}`);
}

const express = require("express");
const relatoriosAnimaisRoutes = require("./src/routes/animalRoutes");

const app = express();
const PORT = process.env.RELATORIO_ANIMAIS_PORT || 5503;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "ms-animals-registration"
    });
});

app.use("/api/animals-registration", relatoriosAnimaisRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Rota nao encontrada"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API animals-registration em execucao na porta ${PORT}`);
});