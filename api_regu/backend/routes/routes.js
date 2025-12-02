const express = require('express');
require('dotenv').config();
const router = express.Router();
const { getDB } = require('../libs/database.js');
const { ObjectId } = require('mongodb');

/*1. Comprobar la distribución de datos por tipo de usuario. Se mostrará el tipo de usuario (usertype),
total de viajes y duración promedio de los mismos.*/
router.get('/trips/user_distribution', async (req, res)=>{
    const db = getDB();
    const data = await db.collection('trips').aggregate([
  {
    $group: {
      _id: "$usertype",
      total_trips: { $sum: 1 },
      average_duration: { $avg: "$tripduration" }
    }
  },
  {
    $project: {
      _id: 0,
      usertype: "$_id",
      total_trips: 1,
      average_duration: 1
    }
  },
  {
    $sort: { total_trips: -1 }
  }
]).toArray();
    res.status(200).json(data);
})

/*2. Viajes por hora del día. Se mostrará la hora del día, promedio de duración y total de viajes
realizados.*/
router.get('/trips/trips_by_hour', async (req, res)=>{
    const db = getDB();
    const hour = req.query.hour;
    const data = await db.collection('trips').aggregate([
  {
    $group: {
      _id: {
      hour: {$hour: "$start time"}
      },
      total_trips: { $sum: 1 },
      average_duration: { $avg: "$tripduration" }
    }
  },
  { 
    $match:
     { "_id.hour": parseInt(hour) 

     } 
    },
  {
    $project: {
      _id: 0,
      hour: "$_id.hour",
      total_trips: 1,
      average_duration: 1
    }
  },
  {
    $sort: { hour: -1 }
  }
]).toArray();
    res.status(200).json(data);
})

/*3. Viajes por día. Se mostrará la fecha y el total de viajes en esa fecha.*/
router.get('/trips/trips_by_day', async (req, res)=>{
    const db = getDB();
    const data = await db.collection('trips').aggregate([
        {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$start time" } },
      total_trips: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  },
  {
    $project: {
      _id: 0,
      day: "$_id",
      total_trips: 1
    }
  }
]).toArray();
    res.status(200).json(data);
})

/*4. Estaciones de salida más populares. Se mostrarán las diez estaciones más populares por total de
salidas, se podrá ver el identificador de la estación, nombre de la estación, duración promedio de los
viajes y total de salidas.*/
router.get('/trips/top_station', async (req, res) => {
    try {
        const db = getDB();
        let limit = parseInt(req.query.limit);
        const data = await db.collection('trips').aggregate([
            {
                $group: {
                    _id: "$start station id",
                    station_name: { $first: "$start station name" },
                    total_trips: { $sum: 1 },
                    average_duration: { $avg: "$tripduration" }
                }
            },
            {
                $sort: { total_trips: -1 }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 0,
                    start_station_id: "$_id",
                    station_name: 1,
                    average_duration: 1,
                    total_trips: 1
                }
            }
        ]).toArray();
        
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Error en top_station:', error);
        res.status(500).json({ error: error.message });
    }
})

/*5. Análisis de horas pico de uso. Se mostrará de qué hora y qué día de la semana, existen mayor
cantidad de viajes.*/
router.get('/trips/peak_hours', async (req, res)=>{
    const db = getDB();
    const {hour, dayOfWeek} = req.query;
    const matchData = {};
    matchData["_id.hour"] = parseInt(hour);
    matchData["_id.dayOfWeek"] = parseInt(dayOfWeek);

    const data = await db.collection('trips').aggregate([
        {
    $group: {
      _id: {
        hour: { $hour: "$start time" },
        dayOfWeek: { $dayOfWeek: "$start time" }
      },
      total_trips: { $sum: 1 }
    }
  },
  { $match: matchData },
  {
    $sort: { total_trips: -1 }
  },
  {
    $limit: 10
  },
  {
    $project: {
      _id: 0,
      hour: "$_id.hour",
      day_of_week: "$_id.dayOfWeek",
      total_trips: 1
    }
  }
]).toArray();
    res.status(200).json(data);
})

module.exports = router;