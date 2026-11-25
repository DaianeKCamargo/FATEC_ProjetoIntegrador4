
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = new PrismaClient();

function gerarHashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function gerarTokenRecuperacao(emailUser) {
  const admin = await prisma.adminUser.findUnique({
    where: { emailUser },
  });

  if (!admin) {
    throw new Error("Email não encontrado");
  }

  // Gera um token aleatório e seguro
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Armazena somente o hash do token
  const resetTokenHash = gerarHashToken(resetToken);

  // Token válido por 1 hora
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.adminUser.update({
    where: { emailUser },
    data: {
      resetToken: resetTokenHash,
      resetTokenExpiry,
    },
  });

  // Retorna o token original para ser enviado por e-mail
  return resetToken;
}

async function validarTokenRecuperacao(emailUser, resetToken) {
  const admin = await prisma.adminUser.findUnique({
    where: { emailUser },
  });

  if (!admin) {
    throw new Error("Token inválido ou expirado");
  }

  const tokenHash = gerarHashToken(resetToken);

  if (!admin.resetToken || admin.resetToken !== tokenHash) {
    throw new Error("Token inválido ou expirado");
  }

  if (
    !admin.resetTokenExpiry ||
    admin.resetTokenExpiry.getTime() < Date.now()
  ) {
    throw new Error("Token inválido ou expirado");
  }

  return true;
}

async function redefinirSenha(emailUser, resetToken, novaSenha) {
  await validarTokenRecuperacao(emailUser, resetToken);

  // Criptografa a nova senha
  const passHash = await bcrypt.hash(novaSenha, 10);

  // Atualiza a senha e invalida o token
  const admin = await prisma.adminUser.update({
    where: { emailUser },
    data: {
      passHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return {
    idAdmin: admin.idAdmin,
    username: admin.username,
    emailUser: admin.emailUser,
  };
}

async function limparTokenRecuperacao(emailUser) {
  await prisma.adminUser.update({
    where: { emailUser },
    data: {
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return true;
}

module.exports = {
  gerarTokenRecuperacao,
  validarTokenRecuperacao,
  redefinirSenha,
  limparTokenRecuperacao,
};
