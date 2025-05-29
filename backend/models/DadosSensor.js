const mongoose = require('mongoose');

const dadosSensorSchema = new mongoose.Schema({
  datetime: Date,
  humidity: Number,
  temperature: Number
}, { collection: 'dados_sensor' });


module.exports = mongoose.model('DadosSensor', dadosSensorSchema);

