
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function login(username, senha) {
  if (!username || !senha) {
    throw new Error("Usuário e senha são obrigatórios");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (!admin) {
    return null;
  }

  const senhaValida = await bcrypt.compare(
    senha,
    admin.passHash
  );

  if (!senhaValida) {
    return null;
  }

  return {
    idAdmin: admin.idAdmin,
    username: admin.username,
    emailUser: admin.emailUser,
  };
}

module.exports = { login };
