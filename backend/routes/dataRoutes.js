const express = require('express');
const router = express.Router();
const DadosSensor = require('../models/DadosSensor');

router.get('/dados', async (req, res) => {
  const { data_inicio, data_fim, dias, local_name } = req.query;

  const filtros = {};
  const hoje = new Date().toISOString().split('T')[0];

  if (data_inicio && data_fim) {
    if (data_inicio > hoje || data_fim > hoje) {
      return res.status(400).json({ error: 'Não é possível buscar dados de datas futuras.' });
    }

    const inicio = new Date(`${data_inicio}T00:00:00Z`);
    const fim = new Date(`${data_fim}T23:59:59.999Z`);
    filtros.datetime = { $gte: inicio, $lte: fim };
  } else {
    // Filtro alternativo por "últimos X dias"
    const qtdDias = parseInt(dias) || 7;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - qtdDias);
    filtros.datetime = { $gte: dataLimite };
  }

  if (local_name) {
    filtros.local_name = local_name;
  }

  try {
    const dados = await DadosSensor.find(filtros).sort({ datetime: -1 });
    return res.json(dados);
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    return res.status(500).json({ error: 'Erro ao buscar dados do sensor' });
  }
});

module.exports = router;
