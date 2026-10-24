
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const loginRoutes = require("./src/routes/loginRoutes");
const autenticarToken = require("./src/middlewares/autenticarToken");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de autenticação funcionando corretamente!",
  });
});

app.use("/api/login", loginRoutes);

// Rota de teste protegida por JWT
app.get("/api/admin/me", autenticarToken, (req, res) => {
  res.status(200).json({
    message: "Token válido",
    admin: req.admin,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
