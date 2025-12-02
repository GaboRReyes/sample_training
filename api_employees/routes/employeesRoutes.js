const express = require('express');
require('dotenv').config();
const router = express.Router();
const { getDB } = require('../libs/database.js');
const { ObjectId } = require('mongodb');
const db = getDB;

router.get('/employees/salaries_by_dept', async (req, res)=>{
    const db = getDB();
    const data = await db.collection('employees_salaries').aggregate([
        {
            $group: {
                _id:"$dept_name",
                total_salaries: { $sum: "$salary" },
                avg_salary: { $avg: "$salary" },
                employees_count: { $sum: 1 },
                min_salary: { $min: "$salary"},
                max_salary: { $max: "$salary"},
            }
        },
        {
            $sort: { total_salaries: -1 }
        }
    ]).toArray();
    res.status(200).json(data);
})

// GET todos los empleados
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const employees = await db.collection('employees_salaries').find().toArray();
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST crear empleado
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const newEmployee = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email || '',
      position: req.body.position || '',
      department: req.body.department || '',
      salary: req.body.salary || 0,
      created_at: new Date()
    };
    
    const result = await db.collection('employees_salaries').insertOne(newEmployee);
    
    res.status(201).json({
      success: true,
      message: 'Empleado creado',
      data: { _id: result.insertedId, ...newEmployee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT actualizar empleado
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('employees_salaries').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updated_at: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Empleado actualizado',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE eliminar empleado
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('employees_salaries').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Empleado eliminado',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;