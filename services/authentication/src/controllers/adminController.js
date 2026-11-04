
const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");

const camposPermitidos = ["username", "emailUser", "senha"];

function validarDados(body, cadastro = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Dados inválidos";
  }

  if (Object.keys(body).some((campo) => !camposPermitidos.includes(campo))) {
    return "A requisição contém campos não permitidos";
  }

  if (
    typeof body.username !== "string" ||
    !body.username.trim() ||
    typeof body.emailUser !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailUser.trim())
  ) {
    return "Informe um usuário e um e-mail válidos";
  }

  if (cadastro && (typeof body.senha !== "string" || body.senha.length < 8)) {
    return "A senha deve conter pelo menos 8 caracteres";
  }

  if (
    body.senha !== undefined &&
    (typeof body.senha !== "string" || body.senha.length < 8)
  ) {
    return "A senha deve conter pelo menos 8 caracteres";
  }

  return null;
}

function tratarErro(res, erro) {
  if (erro.code === "P2002") {
    return res.status(409).json({
      message: "Nome de usuário ou e-mail já cadastrado",
    });
  }

  if (erro.code === "P2025") {
    return res.status(404).json({
      message: "Administrador não encontrado",
    });
  }

  console.error("Erro ao gerenciar administradores:", erro);

  return res.status(500).json({
    message: "Erro interno no servidor",
  });
}

async function listar(req, res) {
  try {
    const administradores = await adminModel.listar();

    return res.status(200).json(administradores);
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

async function cadastrar(req, res) {
  try {
    const erroValidacao = validarDados(req.body, true);

    if (erroValidacao) {
      return res.status(400).json({ message: erroValidacao });
    }

    const username = req.body.username.trim();
    const emailUser = req.body.emailUser.trim().toLowerCase();

    const passHash = await bcrypt.hash(req.body.senha, 12);

    const administrador = await adminModel.cadastrar({
      username,
      emailUser,
      passHash,
    });

    return res.status(201).json({
      message: "Administrador cadastrado com sucesso",
      admin: administrador,
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

async function editar(req, res) {
  try {
    const idAdmin = Number(req.params.id);

    if (!Number.isSafeInteger(idAdmin) || idAdmin <= 0) {
      return res.status(400).json({
        message: "ID do administrador inválido",
      });
    }

    const erroValidacao = validarDados(req.body);

    if (erroValidacao) {
      return res.status(400).json({ message: erroValidacao });
    }

    const dados = {
      username: req.body.username.trim(),
      emailUser: req.body.emailUser.trim().toLowerCase(),
    };

    if (req.body.senha !== undefined) {
      dados.passHash = await bcrypt.hash(req.body.senha, 12);
    }

    const administrador = await adminModel.editar(idAdmin, dados);

    return res.status(200).json({
      message: "Administrador atualizado com sucesso",
      admin: administrador,
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

module.exports = {
  listar,
  cadastrar,
  editar,
};
