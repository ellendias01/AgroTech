
const express = require('express');
const router = express.Router();
const DadosSensor = require('../models/DadosSensor');

/**
 * @swagger
 * components:
 *   schemas:
 *     DadoSensor:
 *       type: object
 *       required:
 *         - temperature
 *         - humidity
 *         - datetime
 *         - local_name
 *       properties:
 *         _id:
 *           type: string
 *         temperature:
 *           type: number
 *           example: 23.5
 *         humidity:
 *           type: number
 *           example: 55.2
 *         datetime:
 *           type: string
 *           format: date-time
 *           example: "2025-06-13T09:00:00Z"
 *         local_name:
 *           type: string
 *           example: "Galpão A"
 */

/**
 * @swagger
 * tags:
 *   name: DadoSensor
 *   description: Endpoints para dados de sensores
 */

/**
 * @swagger
 * /api/dados:
 *   get:
 *     summary: Retorna os dados dos sensores dos últimos X dias
 *     tags: [DadoSensor]
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *         description: "Número de dias a buscar, (padrão: 7)"
 *       - in: query
 *         name: local_name
 *         schema:
 *           type: string
 *         description: Nome do local do sensor
 *     responses:
 *       200:
 *         description: Lista de dados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DadoSensor'
 */
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

/**
 * @swagger
 * /api/dados:
 *   post:
 *     summary: Cria um novo dado de sensor
 *     tags: [DadoSensor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DadoSensor'
 *     responses:
 *       201:
 *         description: Dado criado com sucesso
 */
router.post('/dados', async (req, res) => {
  try {
    const { temperature, humidity, datetime, local_name } = req.body;
    const novoDado = new DadosSensor({ temperature, humidity, datetime, local_name });
    await novoDado.save();
    res.status(201).json(novoDado);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar dado do sensor' });
  }
});

/**
 * @swagger
 * /api/dados/{id}:
 *   get:
 *     summary: Retorna um dado específico por ID
 *     tags: [DadoSensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dado
 *     responses:
 *       200:
 *         description: Dado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DadoSensor'
 *       404:
 *         description: Dado não encontrado
 */
router.get('/dados/:id', async (req, res) => {
  try {
    const dado = await DadosSensor.findById(req.params.id);
    if (!dado) return res.status(404).json({ error: 'Dado não encontrado' });
    res.json(dado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dado do sensor' });
  }
});

/**
 * @swagger
 * /api/dados/{id}:
 *   put:
 *     summary: Atualiza completamente um dado
 *     tags: [DadoSensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DadoSensor'
 *     responses:
 *       200:
 *         description: Dado atualizado
 *       404:
 *         description: Dado não encontrado
 */
router.put('/dados/:id', async (req, res) => {
  try {
    const { temperature, humidity, datetime, local_name } = req.body;
    const atualizado = await DadosSensor.findByIdAndUpdate(
      req.params.id,
      { temperature, humidity, datetime, local_name },
      { new: true }
    );
    if (!atualizado) return res.status(404).json({ error: 'Dado não encontrado' });
    res.json(atualizado);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar dado do sensor' });
  }
});

/**
 * @swagger
 * /api/dados/{id}:
 *   patch:
 *     summary: Atualiza parcialmente um dado
 *     tags: [DadoSensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               temperature: 28.0
 *     responses:
 *       200:
 *         description: Dado atualizado parcialmente
 *       404:
 *         description: Dado não encontrado
 */
router.patch('/dados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const atualizacoes = req.body;

    const dadoAtualizado = await DadosSensor.findByIdAndUpdate(id, atualizacoes, {
      new: true,
      runValidators: true,
    });

    if (!dadoAtualizado) {
      return res.status(404).json({ error: 'Dado não encontrado' });
    }

    res.json(dadoAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar parcialmente o dado' });
  }
});

/**
 * @swagger
 * /api/dados/{id}:
 *   delete:
 *     summary: Remove um dado por ID
 *     tags: [DadoSensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dado
 *     responses:
 *       200:
 *         description: Dado deletado com sucesso
 *       404:
 *         description: Dado não encontrado
 */
router.delete('/dados/:id', async (req, res) => {
  try {
    const deletado = await DadosSensor.findByIdAndDelete(req.params.id);
    if (!deletado) return res.status(404).json({ error: 'Dado não encontrado' });
    res.json({ mensagem: 'Dado removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar dado do sensor' });
  }
});

module.exports = router;
