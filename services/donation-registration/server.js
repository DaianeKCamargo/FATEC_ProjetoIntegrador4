
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();

// Configuração do CORS
const origensPermitidas = [
  "http://localhost:8081",
  "https://doetampinhas.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    const origemPreviewPermitida =
      typeof origin === "string" &&
      /^https:\/\/projeto-integrador-user-don-git-[a-z0-9]+-daianekcamargos-projects\.vercel\.app$/.test(
        origin
      );

    if (
      !origin ||
      origensPermitidas.includes(origin) ||
      origemPreviewPermitida
    ) {
      return callback(null, true);
    }

    console.log("Origem bloqueada pelo CORS:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Conexão com o banco Neon
if (!process.env.DATABASE_URL) {
  throw new Error("A variável DATABASE_URL não foi configurada.");
}

const sql = neon(process.env.DATABASE_URL);

// Registra uma doação, calcula a quantidade de tampinhas e salva no banco
app.post("/doacoes", async (req, res) => {
  try {
    const peso = Number(req.body.peso);
    const pontoId = req.body.pontoId ?? null;

    if (!Number.isFinite(peso) || peso <= 0) {
      return res.status(400).json({
        erro: "O peso deve ser um número maior que zero.",
      });
    }

    if (
      pontoId !== null &&
      (typeof pontoId !== "string" || pontoId.trim() === "")
    ) {
      return res.status(400).json({
        erro: "O identificador do ponto de coleta é inválido.",
      });
    }

    // Cada tampinha é considerada com massa média de 2 gramas
    const quantidadeTampinhas = Math.round((peso * 1000) / 2);

    const resultado = await sql`
      INSERT INTO doacoes (
        peso,
        quantidade_tampinhas,
        ponto_id
      )
      VALUES (
        ${peso},
        ${quantidadeTampinhas},
        ${pontoId}
      )
      RETURNING
        id,
        peso,
        quantidade_tampinhas AS "quantidadeTampinhas",
        ponto_id AS "pontoId",
        created_at AS "createdAt"
    `;

    return res.status(201).json(resultado[0]);
  } catch (erro) {
    console.error("Erro ao registrar doação:", erro);

    return res.status(500).json({
      erro: "Não foi possível registrar a doação.",
    });
  }
});

// Consulta uma doação pelo ID
app.get("/doacoes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "O ID da doação deve ser um inteiro positivo.",
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
        erro: "Doação não encontrada.",
      });
    }

    return res.status(200).json(resultado[0]);
  } catch (erro) {
    console.error("Erro ao consultar doação:", erro);

    return res.status(500).json({
      erro: "Não foi possível consultar a doação.",
    });
  }
});

// Consulta a doação mais recente de um ponto de coleta
app.get("/pontos/:pontoId/ultima-doacao", async (req, res) => {
  try {
    const pontoId = req.params.pontoId;

    if (!pontoId || pontoId.trim() === "") {
      return res.status(400).json({
        erro: "O identificador do ponto de coleta é obrigatório.",
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
      WHERE ponto_id = ${pontoId}
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `;

    if (resultado.length === 0) {
      return res.status(404).json({
        erro: "Nenhuma doação encontrada para este ponto.",
      });
    }

    return res.status(200).json(resultado[0]);
  } catch (erro) {
    console.error("Erro ao consultar última doação:", erro);

    return res.status(500).json({
      erro: "Não foi possível consultar a última doação.",
    });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de registro de doações executando na porta ${PORT}`);
});
