const mongoose = require('mongoose');

const dadosSensorSchema = new mongoose.Schema({
  datetime: Date,
  humidity: Number,
  temperature: Number
}, { collection: 'teste_reais' });


module.exports = mongoose.model('DadosSensor', dadosSensorSchema);

