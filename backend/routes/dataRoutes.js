const express = require('express');
const router = express.Router();

const DadosSensor = require('../models/DadosSensor');

router.get('/dados', async (req, res) => {
  try {
    const dados = await DadosSensor.find();
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados do sensor' });
  }
});

module.exports = router;
