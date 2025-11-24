const express = require('express')
const { requireAuth } = require('../middleware/auth');

const {
    createWorkout,
    getWorkouts,
    getAWorkout,
    deleteWorkout,
    updateWorkout
} = require('../controllers/workoutController')

const Workout = require('../models/workoutModel')

const router = express.Router()

// Protect all workout routes
router.use(requireAuth);

router.get('/', getWorkouts)
router.get('/:id', getAWorkout)
router.post('/', createWorkout)
router.delete('/:id', deleteWorkout)
router.patch('/:id', updateWorkout)


module.exports = router