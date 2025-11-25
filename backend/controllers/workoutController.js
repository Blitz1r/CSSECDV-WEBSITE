const Workout = require('../models/workoutModel')
const mongoose = require('mongoose')
const { enforceAction } = require('../middleware/authorization');

// GET all workouts
const getWorkouts = async (req, res) => {
    if (!enforceAction(req, res, 'Workout', 'read')) return;
    const workouts = await Workout.find({}).sort({createdAt: -1})

    res.status(200).json(workouts)
}

// GET a single workout
const getAWorkout = async (req, res) => {
    if (!enforceAction(req, res, 'Workout', 'read')) return;
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such item exists.'})
    }

    const workout = await Workout.findById(id)

    if (!workout) {
        return res.status(400).json({error: 'No such item exists.'})
    }
    
    res.status(200).json(workout) 
}


// CREATE new workout
const createWorkout = async (req, res) => {
    const {title, reps, load} = req.body

    // add doc to db
    try {
        if (!enforceAction(req, res, 'Workout', 'create')) return;
        const workout = await Workout.create({title, load, reps})
        res.status(200).json(workout)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// DELETE a workout
const deleteWorkout = async (req, res) => {
    const {id} = req.params
    if (!enforceAction(req, res, 'Workout', 'delete')) return;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such item exists.'})
    }

    const workout = await Workout.findOneAndDelete({_id: id})

    if (!workout) {
        return res.status(400).json({error: 'No such item exists.'})
    }
    
    res.status(200).json(workout) 
}

// UPDATE a workout
const updateWorkout = async (req, res) => {
    const {id} = req.params
    if (!enforceAction(req, res, 'Workout', 'update')) return;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such item exists.'})
    }

    const workout = await Workout.findOneAndUpdate({_id: id}, {
        ...req.body
    })

    if (!workout) {
        return res.status(400).json({error: 'No such item exists.'})
    }
    
    res.status(200).json(workout) 
}

module.exports = {
    getWorkouts,
    getAWorkout,
    createWorkout,
    deleteWorkout,
    updateWorkout
}