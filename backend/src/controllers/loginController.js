
const jwt = require("jsonwebtoken");
const loginModel = require("../models/loginModel");

async function login(req, res) {
  try {
    const { username, senha } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof senha !== "string" ||
      !username.trim() ||
      !senha
    ) {
      return res.status(400).json({
        message: "Usuário e senha são obrigatórios",
      });
    }

    const admin = await loginModel.login(username, senha);

    if (!admin) {
      return res.status(401).json({
        message: "Usuário ou senha inválidos",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não configurado");
    }

    const token = jwt.sign(
      {
        idAdmin: admin.idAdmin,
        username: admin.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
        algorithm: "HS256",
      }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      admin,
    });
  } catch (erro) {
    console.error("Erro no login:", erro.message);

    return res.status(500).json({
      message: "Erro interno ao realizar login",
    });
  }
}

module.exports = { login };
