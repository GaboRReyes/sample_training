const express = require('express');
require('dotenv').config();
const router = express.Router();
const { getDB } = require('../libs/database.js');
const { ObjectId } = require('mongodb');
const db = getDB;


// GET clientes activos y sus cuentas cuyos límites sean mayor igual a 10000
router.get('/active_clients', async (req, res) => {        
  try {
    const db = getDB();

        // 1. Obtener parámetros de la query string
        // El estado 'active' se espera como una cadena ('true' o 'false').
        const { active, limit } = req.query; 

        // 2. Construir los criterios de búsqueda ($match)
        const matchCriteria = {};

        // 2a. Validar y agregar el parámetro 'active' (bool)
        if (active !== undefined) {
            // Convierte la cadena 'true' o 'false' a un booleano
            matchCriteria.active = active.toLowerCase() === 'true';
        }

        // 2b. Validar y agregar el parámetro 'limit' (numérico)
        if (limit !== undefined && !isNaN(parseInt(limit))) {
            const parsedLimit = parseInt(limit);
            // Aplicamos $gte (mayor o igual) como en la consulta original
            matchCriteria["account.limit"] = { $gte: parsedLimit }; 
        } else if (limit === undefined) {
             // Si no se especifica 'limit', usamos el valor por defecto original
             matchCriteria["account.limit"] = { $gte: 10000 };
        }
    const customers = await db.collection('customers').aggregate([
  {
    $lookup: {
      from: "accounts",
      localField: "accounts",
      foreignField: "account_id",
      as: "account"
    }
  },
  { $unwind: "$account" },
  {
    $match: 
      matchCriteria
  },
  {
    $project: {
      _id: 0,
      name:1,
      address: 1,
      email: 1,
      cuenta: "account.account_id",
      limite: "account.limit"
    }
  }
]).toArray();

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET total de clientes por producto
router.get('/clients_by_product', async (req, res) => {        
  try {
    const db = getDB();

    const customers = await db.collection('customers').aggregate([
      {
$lookup:{
    from: "accounts",
      localField: "accounts",
      foreignField: "account_id",
      as: "account"
}
},
{ $unwind: "$account" },
{ $unwind: "$account.products" },
{
    $group:{
        _id: "$account.products",
         total_clientes: { $addToSet: "$_id" }
    }
    },
    {
    $project: {
      producto: "$_id",
      total_clientes: { $size: "$total_clientes" },
      _id: 0
    }
  }

]).toArray();

res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
}
});

//top n de las cuentas principales por monto total de sus transacciones.
router.get('/top_accounts', async (req, res) => {        
  try {
    const db = getDB();

    const accounts_number = parseInt(req.query.n); 
    const accounts = await db.collection('transactions').aggregate([
      {
    $unwind:"$transactions"
},
{
    $addFields: {
        monto: {$toDouble: "$transactions.total"}
    }
},
{
    $group: {
        _id: "$account_id",
        monto_total: {$sum: "$monto"}
    }
},
{
    $sort: { monto_total: -1 }
},
{
    $limit: accounts_number
},
{
    $project: {
      _id: 0,
      account_id: "$_id",
      monto_total: 1
    }
}
]).toArray();

res.status(200).json({
            success: true,
            count: accounts.length,
            data: accounts
        });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

//el top n de las cuentas que más monto total acumulan en sus transacciones por tipo de operación
router.get('/top_by_mount', async (req, res) => {
   try {
    const db = getDB();

    const accounts_number = parseInt(req.query.n); 
    const accounts = await db.collection('transactions').aggregate([
      {
    $unwind: "$transactions"
  },
  {
    $addFields: {
      monto: { $toDouble: "$transactions.total" }
    }
  },
  {
    $group: {
      _id: {
        account_id: "$account_id",
        tipo_transaccion: "$transactions.transaction_code"
      },
      monto_total: { $sum: "$monto" }
    }
  },
  {
    $sort: { monto_total: -1 }
  },
  {
    $limit: accounts_number
  },
  {
    $lookup: {
      from: "customers",
      localField: "_id.account_id",
      foreignField: "accounts",
      as: "customer"
    }
  },
  {
    $unwind: "$customer"
  },
  {
    $project: {
      _id: 0,
      account_id: "$_id.account_id",
      nombre: "$customer.name",
      monto_total: 1,
      tipo: "$_id.tipo_transaccion"
    }
  }
]).toArray();

res.status(200).json({
            success: true,
            count: accounts.length,
            data: accounts
        });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } 
});

router.put('/change_datatype', async (req, res) => {
  try {
    const db = getDB();
    db.collection('transactions').updateMany(
      {},
  [
    {
      $set: {
        transactions: {
          $map: {
            input: "$transactions",
            as: "trans",
            in: {
              date: "$$trans.date",
              amount: "$$trans.amount",
              transaction_code: "$$trans.transaction_code",
              symbol: "$$trans.symbol",
              price: { $toDouble: "$$trans.price" },
              total: { $toDouble: "$$trans.total" }
            }
          }
        }
      }
    }
  ]
);
    res.status(200).json({
      success: true,
      message: 'Tipo de dato cambiado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
module.exports = router;
