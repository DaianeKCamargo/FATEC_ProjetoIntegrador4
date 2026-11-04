const express = require("express");
const controller = require("../controllers/adminController");
const autenticarToken = require("../middlewares/autenticarToken");

const router = express.Router();

router.use(autenticarToken);

router.get("/", controller.listar);
router.post("/", controller.cadastrar);
router.put("/:id", controller.editar);

module.exports = router;