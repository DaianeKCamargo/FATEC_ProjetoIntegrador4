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

// EDITAR REGISTRO MANUAL
async function editarRegistro(req, res) {
    try {
        const id = Number(req.params.id);
        const { data, quantidade_kg } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID inválido."
            });
        }

        if (!data || quantidade_kg === undefined || quantidade_kg === null) {
            return res.status(400).json({
                message: "Informe a data e a quantidade em kg."
            });
        }

        const peso = Number(quantidade_kg);

        if (!Number.isFinite(peso) || peso <= 0) {
            return res.status(400).json({
                message: "A quantidade em kg deve ser maior que zero."
            });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return res.status(400).json({
                message: "A data deve estar no formato AAAA-MM-DD."
            });
        }

        const registro = await capsModel.editarRegistroManual(
            id,
            data,
            peso
        );

        if (!registro) {
            return res.status(404).json({
                message: "Registro não encontrado ou já excluído."
            });
        }

        res.status(200).json({
            message: "Registro atualizado com sucesso!",
            registro
        });

    } catch (erro) {
        console.error("Erro ao editar registro:", erro);

        res.status(500).json({
            message: "Erro ao editar o registro de tampinhas."
        });
    }
}

// EXCLUIR REGISTRO (MANUAL OU BALANÇA)
async function excluirRegistro(req, res) {
    try {
        const id = Number(req.params.id);
        const origem = req.params.origem;

        // Valida o ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID inválido."
            });
        }

        // Valida a origem
        if (origem !== "MANUAL" && origem !== "BALANCA") {
            return res.status(400).json({
                message: "Origem inválida. Informe MANUAL ou BALANCA."
            });
        }

        let excluido;

        // Identifica qual tabela deve ser atualizada
        if (origem === "MANUAL") {
            excluido = await capsModel.excluirRegistroManual(id);
        } else {
            excluido = await capsModel.excluirRegistroBalanca(id);
        }

        if (!excluido) {
            return res.status(404).json({
                message: "Registro não encontrado ou já excluído."
            });
        }

        res.status(200).json({
            message: "Registro excluído com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao excluir registro:", erro);

        res.status(500).json({
            message: "Erro ao excluir o registro de tampinhas."
        });
    }
}

module.exports = {
    listarRegistros,
    cadastrarRegistro,
    editarRegistro,
    excluirRegistro
};