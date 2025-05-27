const express = require('express');
const router = express.Router();

const DadosSensor = require('../models/DadosSensor');

router.get('/dados', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const dados = await DadosSensor.find({
      datetime: { $gte: dataLimite }
    }).sort({ datetime: -1 }); // mais recentes primeiro

    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados do sensor' });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 395ae4438d798ab439f0856213cb8e034a737537
