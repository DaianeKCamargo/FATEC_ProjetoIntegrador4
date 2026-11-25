const express = require("express");
const router = express.Router();

const capsController = require("../controllers/capsController");

// Listar todos os registros de tampinhas
router.get("/", capsController.listarRegistros);

module.exports = router;