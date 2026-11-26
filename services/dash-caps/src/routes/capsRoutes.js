
const express = require("express");
const router = express.Router();

const capsController = require("../controllers/capsController");

// GET /api/caps
router.get("/", capsController.listarRegistros);

// POST /api/caps
router.post("/", capsController.cadastrarRegistro);

module.exports = router;
