const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.CONN_STRING;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log('Conexión exitosa a MongoDB');
    return db;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database no está conectada');
  }
  return db;
}

module.exports = { connectDB, getDB };