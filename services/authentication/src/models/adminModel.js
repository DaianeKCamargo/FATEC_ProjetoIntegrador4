
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const camposPublicos = {
  idAdmin: true,
  username: true,
  emailUser: true,
  createdAt: true,
  updatedAt: true,
};

async function listar() {
  return prisma.adminUser.findMany({
    select: camposPublicos,
    orderBy: {
      idAdmin: "asc",
    },
  });
}

async function buscarPorId(idAdmin) {
  return prisma.adminUser.findUnique({
    where: { idAdmin },
    select: camposPublicos,
  });
}

async function cadastrar(dados) {
  return prisma.adminUser.create({
    data: dados,
    select: camposPublicos,
  });
}

async function editar(idAdmin, dados) {
  return prisma.adminUser.update({
    where: { idAdmin },
    data: dados,
    select: camposPublicos,
  });
}

module.exports = {
  listar,
  buscarPorId,
  cadastrar,
  editar,
};
