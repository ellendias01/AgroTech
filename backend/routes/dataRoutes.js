const express = require('express');
const router = express.Router();
const DadosSensor = require('../models/DadosSensor');

router.get('/dados', async (req, res) => {
  const { data_inicio, dias } = req.query;

  const hoje = new Date().toISOString().split('T')[0];

  // Se data_inicio for fornecida, valida e busca por esse dia específico
  if (data_inicio) {
    if (data_inicio > hoje) {
      return res.status(400).json({ error: 'Não é possível buscar dados de datas futuras.' });
    }

    const inicio = new Date(`${data_inicio}T00:00:00`);
    const fim = new Date(`${data_inicio}T23:59:59.999`);

    try {
      const dados = await DadosSensor.find({
        datetime: { $gte: inicio, $lte: fim }
      }).sort({ datetime: -1 });

      return res.json(dados);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar dados do sensor' });
    }
  }

  // Se não tiver data_inicio, usa o parâmetro 'dias' (ou 7 por padrão)
  const qtdDias = parseInt(dias) || 7;
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - qtdDias);

  try {
    const dados = await DadosSensor.find({
      datetime: { $gte: dataLimite }
    }).sort({ datetime: -1 });

    return res.json(dados);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar dados do sensor' });
  }
});

module.exports = router;
