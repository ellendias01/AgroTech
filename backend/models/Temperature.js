const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  value: Number
}, { collection: 'temperature' });

module.exports = mongoose.model('Temperature', temperatureSchema);
