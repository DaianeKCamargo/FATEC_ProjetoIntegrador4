require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:8081",
        "http://localhost:8082",
        "https://doetampinhas.vercel.app"
    ]
}));

app.use(express.json());

// Conexão com o Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Rotas de registros de tampinhas
const capsRoutes = require("./src/routes/capsRoutes");

app.use("/api/caps", capsRoutes);

// Rota inicial
app.get("/", (req, res) => {
    res.json({
        mensagem: "Serviço dash-caps funcionando!"
    });
});

// Teste de conexão com o banco
app.get("/teste-banco", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW()");

        res.json({
            mensagem: "Conexão com Neon realizada!",
            horario: resultado.rows[0].now
        });

    } catch (erro) {
        console.error("Erro ao conectar ao banco:", erro);

        res.status(500).json({
            mensagem: "Erro na conexão com o banco."
        });
    }
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Servidor dash-caps rodando na porta ${PORT}`);
});