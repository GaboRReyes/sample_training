const express = require('express');
const app = express();
const { ObjectId } = require('mongodb'); 
require('dotenv').config();
const port = process.env.PORT || 3000;
const { connectDB } = require('./libs/database.js');

app.use(express.json());

app.get('/', (req, res) => {
    res.send({ 
        message: 'Bienvenido a la API de Empleados',
        documentation: 'Visita /api/v1/ para acceder a los datos de empleados'
    });
});

// Importa tus rutas
const employeesRoutes = require('./routes/employeesRoutes');
app.use('/api/v1/', employeesRoutes);

// Conecta a la base de datos y luego inicia el servidor
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on port ${port}!`);  
  });
}).catch(err => {
  console.error('Error al conectar a la base de datos:', err);
  process.exit(1);
});