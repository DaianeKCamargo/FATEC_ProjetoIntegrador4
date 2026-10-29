
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { neon } = require("./node_modules/@neondatabase/serverless");

const app = express();


const origensPermitidas = [
  "http://localhost:8081",
  "https://doetampinhas.vercel.app",
  "https://projeto-integrador-user-don-git-133afc-daianekcamargos-projects.vercel.app",
];

app.use(cors({
  origin: origensPermitidas,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));


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


/* =========================================
   PESAGEM AO VIVO
   ========================================= */

// POST: inicia uma sessao de pesagem para um ponto
app.post("/pontos/:pontoId/pesagem/iniciar", async (req, res) => {
    try {
        const pontoId = req.params.pontoId;

        if (!pontoId || !pontoId.trim()) {
            return res.status(400).json({
                mensagem: "Informe um ponto de coleta valido."
            });
        }

        const resultado = await sql`
            INSERT INTO pesagem_ao_vivo
                (ponto_id, ativa, peso, atualizado_em)
            VALUES
                (${pontoId}, TRUE, NULL, NULL)
            ON CONFLICT (ponto_id)
            DO UPDATE SET
                ativa = TRUE,
                peso = NULL,
                atualizado_em = NULL
            RETURNING ponto_id AS "pontoId", ativa
        `;

        return res.json({
            mensagem: "Sessao de pesagem iniciada.",
            ...resultado[0]
        });
    } catch (erro) {
        console.error("Erro ao iniciar pesagem:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel iniciar a pesagem."
        });
    }
});

// POST: recebe uma leitura temporaria do ESP32
app.post("/pontos/:pontoId/pesagem/leitura", async (req, res) => {
    try {
        const pontoId = req.params.pontoId;
        const peso = Number(req.body.peso);

        if (!Number.isFinite(peso) || peso < 0) {
            return res.status(400).json({
                mensagem: "Informe um peso numerico valido."
            });
        }

        const resultado = await sql`
            UPDATE pesagem_ao_vivo
            SET
                peso = ${peso},
                atualizado_em = NOW()
            WHERE ponto_id = ${pontoId}
              AND ativa = TRUE
            RETURNING ponto_id AS "pontoId",
                      peso,
                      atualizado_em AS "atualizadoEm"
        `;

        if (resultado.length === 0) {
            return res.status(409).json({
                mensagem: "Nao existe uma sessao de pesagem ativa para este ponto."
            });
        }

        return res.json({
            mensagem: "Leitura recebida.",
            ...resultado[0]
        });
    } catch (erro) {
        console.error("Erro ao receber leitura:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel receber a leitura."
        });
    }
});

// GET: consulta o estado atual da pesagem
app.get("/pontos/:pontoId/pesagem/atual", async (req, res) => {
    try {
        const pontoId = req.params.pontoId;

        const resultado = await sql`
            SELECT
                ponto_id AS "pontoId",
                ativa,
                peso,
                atualizado_em AS "atualizadoEm"
            FROM pesagem_ao_vivo
            WHERE ponto_id = ${pontoId}
            LIMIT 1
        `;

        if (resultado.length === 0 || !resultado[0].ativa) {
            return res.status(404).json({
                mensagem: "Nenhuma pesagem ativa para este ponto."
            });
        }

        const leitura = resultado[0];

        const leituraRecente =
            leitura.atualizadoEm &&
            Date.now() - new Date(leitura.atualizadoEm).getTime() < 5000;

        if (!leituraRecente || leitura.peso === null) {
            return res.json({
                pontoId,
                conectado: false,
                peso: null
            });
        }

        return res.json({
            pontoId,
            conectado: true,
            peso: Number(leitura.peso),
            atualizadoEm: leitura.atualizadoEm
        });
    } catch (erro) {
        console.error("Erro ao consultar pesagem:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel consultar a pesagem."
        });
    }
});

// POST: encerra a sessao de pesagem
app.post("/pontos/:pontoId/pesagem/encerrar", async (req, res) => {
    try {
        const pontoId = req.params.pontoId;

        await sql`
            UPDATE pesagem_ao_vivo
            SET ativa = FALSE
            WHERE ponto_id = ${pontoId}
        `;

        return res.json({
            mensagem: "Sessao de pesagem encerrada.",
            pontoId
        });
    } catch (erro) {
        console.error("Erro ao encerrar pesagem:", erro);

        return res.status(500).json({
            mensagem: "Nao foi possivel encerrar a pesagem."
        });
    }
});

// ================================================================


app.listen(3000, () => {
    console.log("API rodando na porta 3000");
});
