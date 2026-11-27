const express = require("express");
const router = express.Router();

const capsController = require("../controllers/capsController");

// Listar todos os registros
router.get("/", capsController.listarRegistros);

// Cadastrar registro manual
router.post("/", capsController.cadastrarRegistro);

// Editar registro manual pelo ID
router.put("/:id", capsController.editarRegistro);

// Excluir registro manual ou da balança pela origem e ID
router.delete("/:origem/:id", capsController.excluirRegistro);

module.exports = router;