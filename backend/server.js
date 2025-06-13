const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const dataRoutes = require('./routes/dataRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', dataRoutes);



// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API AgroTech',
      version: '1.0.0',
      description: 'Documentação da API do Projeto AgroTech',
    },
    servers: [{ url: 'http://localhost:8080' }],
  },
  apis: ['./routes/*.js'], // Ajuste conforme a pasta correta
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Conexão com o MongoDB

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB conectado');
  app.listen(8080, () => {
    console.log('🚀 Servidor rodando na porta 8080');
  });
})
.catch((err) => console.error('❌ Erro ao conectar no MongoDB:', err));