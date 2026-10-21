const model = require("../models/animals-registrationModel");

async function listar(req, res) {
    try {
        const dados = await model.listar();
        return res.status(200).json(dados);
    } catch (error) {
        console.error("Erro ao listar registros de animais:", error);

        return res.status(500).json({
            message: "Erro ao listar registros de animais."
        });
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID inválido."
            });
        }

        const item = await model.buscarPorId(id);

        if (!item) {
            return res.status(404).json({
                message: "Registro de animal não encontrado."
            });
        }

        return res.status(200).json(item);
    } catch (error) {
        console.error("Erro ao buscar registro de animal:", error);

        return res.status(500).json({
            message: "Erro ao buscar registro de animal."
        });
    }
}

async function criar(req, res) {
    try {
        const { data, tipoAnimal, quantidade } = req.body;

        if (!data || !tipoAnimal || quantidade === undefined ||
            quantidade === null) {
            return res.status(400).json({
                message: "Data, tipo de animal e quantidade são obrigatórios."
            });
        }

        if (
            typeof tipoAnimal !== "string" ||
            tipoAnimal.trim() === ""
        ) {
            return res.status(400).json({
                message: "Informe um tipo de animal válido."
            });
        }

        const quantidadeNumerica = Number(quantidade);

        if (
            !Number.isSafeInteger(quantidadeNumerica) ||
            quantidadeNumerica <= 0
        ) {
            return res.status(400).json({
                message: "A quantidade deve ser um número inteiro maior que zero."
            });
        }

        // Mantém os campos esperados pelo model.
        const dados = {
            ...req.body,
            tipoAnimal: tipoAnimal.trim(),
            quantidade: quantidadeNumerica
        };

        const novo = await model.criar(dados);

        return res.status(201).json({
            message: "Registro de animais criado com sucesso.",
            registro: novo
        });
    } catch (error) {
        console.error("Erro ao criar registro de animais:", error);

        return res.status(500).json({
            message: "Erro ao criar registro de animais."
        });
    }
}

async function atualizar(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID inválido."
            });
        }

        const atualizado = await model.atualizar(id, req.body);

        if (!atualizado) {
            return res.status(404).json({
                message: "Registro de animal não encontrado."
            });
        }

        return res.status(200).json({
            message: "Registro atualizado com sucesso.",
            registro: atualizado
        });
    } catch (error) {
        console.error("Erro ao atualizar registro de animais:", error);

        return res.status(500).json({
            message: "Erro ao atualizar registro de animais."
        });
    }
}

async function remover(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID inválido."
            });
        }

        const removido = await model.remover(id);

        if (removido === false || removido === null) {
            return res.status(404).json({
                message: "Registro de animal não encontrado."
            });
        }

        return res.status(200).json({
            message: "Registro de animais removido com sucesso."
        });
    } catch (error) {
        console.error("Erro ao remover registro de animais:", error);

        return res.status(500).json({
            message: "Erro ao remover registro de animais."
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    remover
};
