require("dotenv").config();

const express = require("express");
const relatoriosAnimaisRoutes = require("./routes/animalRoutes");

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