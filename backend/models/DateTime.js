const mongoose = require('mongoose');

const dateTimeSchema = new mongoose.Schema({
  timestamp: Date
}, { collection: 'datetime' }); // força o nome exato da coleção

module.exports = mongoose.model('DateTime', dateTimeSchema);
