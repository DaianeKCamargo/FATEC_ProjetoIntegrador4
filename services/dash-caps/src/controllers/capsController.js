
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

// POST /api/caps
async function cadastrarRegistro(req, res) {
    try {
        const { data, quantidade_kg } = req.body;

        // Verifica se os campos foram enviados
        if (!data || quantidade_kg === undefined || quantidade_kg === null) {
            return res.status(400).json({
                message: "Informe a data e a quantidade em kg."
            });
        }

        // Converte o peso para número
        const peso = Number(quantidade_kg);

        // Valida o peso
        if (!Number.isFinite(peso) || peso <= 0) {
            return res.status(400).json({
                message: "A quantidade em kg deve ser maior que zero."
            });
        }

        // Valida o formato da data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return res.status(400).json({
                message: "A data deve estar no formato AAAA-MM-DD."
            });
        }

        const registro = await capsModel.cadastrarRegistroManual(
            data,
            peso
        );

        res.status(201).json({
            message: "Registro cadastrado com sucesso!",
            registro
        });

    } catch (erro) {
        console.error("Erro ao cadastrar registro:", erro);

        res.status(500).json({
            message: "Erro ao cadastrar o registro de tampinhas."
        });
    }
}

module.exports = {
    listarRegistros,
    cadastrarRegistro
};
