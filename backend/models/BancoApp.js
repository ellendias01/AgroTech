const mongoose = require('mongoose');

const bancoAppSchema = new mongoose.Schema({
  nome: String,
  valor: Number,
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BancoApp', bancoAppSchema);