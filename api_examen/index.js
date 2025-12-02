const express = require('express');
const app = express();
const { ObjectId } = require('mongodb'); 
require('dotenv').config();
const port = process.env.PORT || 3000;
const { connectDB } = require('./libs/database.js');

app.use(express.json());

app.get('/', (req, res) => {
    res.send({ 
        message: 'API de examen funcionando',
    });
});

const routes = require('./routes/examen_routes.js');
app.use('', routes);

// Conecta a la base de datos y luego inicia el servidor
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on port ${port}!`);  
  });
}).catch(err => {
  console.error('Error al conectar a la base de datos:', err);
  process.exit(1);
});