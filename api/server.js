
require("dotenv").config();

const express = require("express");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(express.json());

if (!process.env.DATABASE_URL) {
    throw new Error("A variavel DATABASE_URL nao foi configurada.");
}

const sql = neon(process.env.DATABASE_URL);

// POST: recebe e salva uma doacao
app.post("/doacoes", async (req, res) => {
    try {
        const peso = Number(req.body.peso);
        const pontoId = req.body.pontoId ?? null;

        if (!Number.isFinite(peso) || peso <= 0) {
            return res.status(400).json({
                mensagem: "Informe um peso numerico maior que zero."
            });
        }

        if (
            pontoId !== null &&
            (typeof pontoId !== "string" || pontoId.trim() === "")
        ) {
            return res.status(400).json({
                mensagem: "O pontoId deve ser um texto valido."
            });
        }

        // Converte kg para gramas e estima a quantidade de tampinhas.
        const quantidadeTampinhas = Math.round((peso * 1000) / 2);

        // Salva a doacao no banco e recebe o registro criado.
        const resultado = await sql`
            INSERT INTO doacoes
                (peso, quantidade_tampinhas, ponto_id)
            VALUES
                (${peso}, ${quantidadeTampinhas}, ${pontoId})
            RETURNING
                id,
                peso,
                quantidade_tampinhas AS "quantidadeTampinhas",
                ponto_id AS "pontoId",
                created_at AS "createdAt"
        `;

        const doacao = resultado[0];

        console.log("Doacao salva:", doacao.id);

        return res.status(201).json({
            mensagem: "Doacao recebida e salva com sucesso!",
            ...doacao
        });
    } catch (erro) {
        console.error("Erro ao salvar doacao:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel salvar a doacao."
        });
    }
});

// GET: consulta uma doacao pelo ID
app.get("/doacoes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de doacao invalido."
            });
        }

        const resultado = await sql`
            SELECT
                id,
                peso,
                quantidade_tampinhas AS "quantidadeTampinhas",
                ponto_id AS "pontoId",
                created_at AS "createdAt"
            FROM doacoes
            WHERE id = ${id}
            LIMIT 1
        `;

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: "Doacao nao encontrada."
            });
        }

        return res.json(resultado[0]);
    } catch (erro) {
        console.error("Erro ao consultar doacao:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel consultar a doacao."
        });
    }
});

// GET: consulta a doacao mais recente de um ponto
app.get("/pontos/:pontoId/ultima-doacao", async (req, res) => {
    try {
        const pontoId = req.params.pontoId;

        const resultado = await sql`
            SELECT
                id,
                peso,
                quantidade_tampinhas AS "quantidadeTampinhas",
                ponto_id AS "pontoId",
                created_at AS "createdAt"
            FROM doacoes
            WHERE ponto_id = ${pontoId}
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        `;

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: "Nenhuma doacao encontrada para este ponto."
            });
        }

        return res.json(resultado[0]);
    } catch (erro) {
        console.error("Erro ao consultar ultima doacao:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel consultar a doacao."
        });
    }
});

app.listen(3000, () => {
    console.log("API rodando na porta 3000");
});
