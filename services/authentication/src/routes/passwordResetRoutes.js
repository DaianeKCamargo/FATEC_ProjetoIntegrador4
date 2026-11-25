
const express = require("express");
const controller = require("../controllers/passwordResetController");

const router = express.Router();

// Solicitar envio do token por e-mail
router.post("/solicitar", controller.solicitarRecuperacao);

// Validar token recebido
router.post("/validar", controller.validarToken);

// Redefinir senha
router.post("/redefinir", controller.redefinirSenha);

module.exports = router;
