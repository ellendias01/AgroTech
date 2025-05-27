const mongoose = require('mongoose');

const dadosSensorSchema = new mongoose.Schema({
  datetime: Date,
  humidity: Number,
  temperature: Number
}, { collection: 'dados_sensor' });

<<<<<<< HEAD
module.exports = mongoose.model('DadosSensor', dadosSensorSchema);
=======
module.exports = mongoose.model('DadosSensor', dadosSensorSchema);
>>>>>>> 395ae4438d798ab439f0856213cb8e034a737537
