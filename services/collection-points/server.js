
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// Conexão com o Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Rota inicial
app.get('/', (req, res) => {
  res.json({
    message: 'API Tampets - Collection Points funcionando!',
  });
});

// Teste de conexão com o banco
app.get('/teste-banco', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Conexão com Neon realizada com sucesso!',
      horario: result.rows[0].now,
    });
  } catch (error) {
    console.error('Erro ao conectar com Neon:', error.message);

    res.status(500).json({
      message: 'Erro ao conectar com o banco de dados.',
    });
  }
});

// Listar pontos de coleta aprovados
app.get('/pontos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pc.id_pc,
        pc.status,
        pc.name_point,
        pc.opens_day,
        pc.hour_init,
        pc.hour_final,
        pc.link_photo,
        ap.street,
        ap.number,
        ap.complement,
        ap.district,
        ap.city,
        ap.post_code,
        ap.latitude,
        ap.longitude
      FROM point_collections pc
      INNER JOIN address_point ap
        ON ap.fk_point_collections = pc.id_pc
      WHERE pc.status = 'APROVADO'
      ORDER BY pc.id_pc;
    `);

    const pontos = result.rows.map((ponto) => ({
      id: ponto.id_pc,
      name: ponto.name_point,
      status: ponto.status,
      opensDay: ponto.opens_day,
      hourInit: ponto.hour_init,
      hourFinal: ponto.hour_final,
      photo: ponto.link_photo,
      address: {
        street: ponto.street,
        number: ponto.number,
        complement: ponto.complement,
        district: ponto.district,
        city: ponto.city,
        postCode: ponto.post_code,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
      },
    }));

    res.json(pontos);
  } catch (error) {
    console.error('Erro ao listar pontos:', error.message);

    res.status(500).json({
      message: 'Erro ao buscar pontos de coleta.',
    });
  }
});

// Buscar um ponto de coleta pelo ID
app.get('/pontos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido.',
      });
    }

    const result = await pool.query(
      `
        SELECT
          pc.id_pc,
          pc.status,
          pc.name_point,
          pc.opens_day,
          pc.hour_init,
          pc.hour_final,
          pc.link_photo,
          ap.street,
          ap.number,
          ap.complement,
          ap.district,
          ap.city,
          ap.post_code,
          ap.latitude,
          ap.longitude
        FROM point_collections pc
        INNER JOIN address_point ap
          ON ap.fk_point_collections = pc.id_pc
        WHERE pc.id_pc = $1
          AND pc.status = 'APROVADO';
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Ponto de coleta não encontrado.',
      });
    }

    const ponto = result.rows[0];

    res.json({
      id: ponto.id_pc,
      name: ponto.name_point,
      status: ponto.status,
      opensDay: ponto.opens_day,
      hourInit: ponto.hour_init,
      hourFinal: ponto.hour_final,
      photo: ponto.link_photo,
      address: {
        street: ponto.street,
        number: ponto.number,
        complement: ponto.complement,
        district: ponto.district,
        city: ponto.city,
        postCode: ponto.post_code,
        latitude: ponto.latitude,
        longitude: ponto.longitude,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar ponto:', error.message);

    res.status(500).json({
      message: 'Erro ao buscar ponto de coleta.',
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
