const express = require('express');
const router = express.Router();

const DateTime = require('../models/DateTime');
const Humidity = require('../models/Humidity');
const Temperature = require('../models/Temperature');

router.get('/datetime', async (req, res) => {
  try {
    const data = await DateTime.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar datetime' });
  }
});

router.get('/humidity', async (req, res) => {
  try {
    const data = await Humidity.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar humidity' });
  }
});

router.get('/temperature', async (req, res) => {
  try {
    const data = await Temperature.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar temperature' });
  }
});

router.get('/all', async (req, res) => {
    try {
      const [datetime, humidity, temperature] = await Promise.all([
        DateTime.find(),
        Humidity.find(),
        Temperature.find()
      ]);
      res.json({ datetime, humidity, temperature });
    } catch (err) {
      res.status(500).json({ erro: 'Erro ao buscar dados combinados' });
    }
  });
  

module.exports = router;
