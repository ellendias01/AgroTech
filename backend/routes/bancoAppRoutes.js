const express = require('express');
const router = express.Router();
const BancoApp = require('../models/BancoApp');

router.get('/', async (req, res) => {
  try {
    const dados = await BancoApp.find();
    res.json(dados);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar os dados' });
  }
});

module.exports = router;