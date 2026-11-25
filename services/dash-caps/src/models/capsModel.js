const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Lista os registros manuais
async function listarRegistrosManuais() {
    const resultado = await pool.query(`
        SELECT
            id,
            data,
            quantidade_kg,
            created_at,
            'MANUAL' AS origem,
            'Administradora' AS responsavel,
            NULL AS ponto_id,
            NULL AS nome_ponto
        FROM "caps-registration"
        WHERE deleted_at IS NULL
    `);

    return resultado.rows;
}

// Lista os registros recebidos pela balança
async function listarRegistrosBalanca() {
    const resultado = await pool.query(`
        SELECT
            d.id,
            d.created_at AS data,
            d.peso AS quantidade_kg,
            d.quantidade_tampinhas,
            d.ponto_id,
            'BALANCA' AS origem,
            COALESCE(p.name_point, 'Ponto não identificado') AS responsavel,
            p.name_point AS nome_ponto
        FROM doacoes d
        LEFT JOIN point_collections p
            ON p.id_pc::text = d.ponto_id
        WHERE d.deleted_at IS NULL
    `);

    return resultado.rows;
}

// Reúne os dois históricos
async function listarTodosRegistros() {
    const [manuais, balanca] = await Promise.all([
        listarRegistrosManuais(),
        listarRegistrosBalanca()
    ]);

    return [...manuais, ...balanca].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
    );
}

module.exports = {
    listarTodosRegistros
};