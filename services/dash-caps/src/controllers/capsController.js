const capsModel = require("../models/capsModel");

// GET /api/caps
async function listarRegistros(req, res) {
    try {
        const registros = await capsModel.listarTodosRegistros();

        res.status(200).json(registros);

    } catch (erro) {
        console.error("Erro ao listar registros:", erro);

        res.status(500).json({
            message: "Erro ao buscar os registros de tampinhas."
        });
    }
}

module.exports = {
    listarRegistros
};