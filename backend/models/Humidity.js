const mongoose = require('mongoose');

const humiditySchema = new mongoose.Schema({
  value: Number
}, { collection: 'humidity' });

module.exports = mongoose.model('Humidity', humiditySchema);
