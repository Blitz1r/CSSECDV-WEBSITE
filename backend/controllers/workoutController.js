const Workout = require('../models/workoutModel')
const mongoose = require('mongoose')
const { enforceAction } = require('../middleware/authorization');
const { addLog } = require('./loggerController');

// GET all workouts
const getWorkouts = async (req, res) => {
    if (!enforceAction(req, res, 'Workout', 'read')) return;
    try {
        const workouts = await Workout.find({}).sort({createdAt: -1})
        res.status(200).json(workouts)
    } catch (error) {
        console.error('Error fetching workouts:', error);
        await addLog({ eventType: 'error', action: 'Fetch workouts failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ error: 'Error fetching workouts' });
    }
}

// GET a single workout
const getAWorkout = async (req, res) => {
    if (!enforceAction(req, res, 'Workout', 'read')) return;
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        await addLog({ eventType: 'validation_failure', action: 'Get workout: invalid ID format', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { id } });
        return res.status(404).json({error: 'No such item exists.'})
    }

    try {
        const workout = await Workout.findById(id)

        if (!workout) {
            return res.status(400).json({error: 'No such item exists.'})
        }
        
        res.status(200).json(workout) 
    } catch (error) {
        console.error('Error fetching workout:', error);
        await addLog({ eventType: 'error', action: 'Fetch workout failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ error: 'Error fetching workout' });
    }
}


// CREATE new workout
const createWorkout = async (req, res) => {
    const {title} = req.body
    let { reps, load } = req.body;

    // Convert string inputs to numbers if needed
    if (typeof reps === 'string') reps = parseInt(reps, 10);
    if (typeof load === 'string') load = parseFloat(load);

    // Input validation with logging
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        await addLog({ eventType: 'validation_failure', action: 'Workout creation: invalid title', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'title' } });
        return res.status(400).json({ error: 'Title is required' });
    }
    if (reps !== undefined && (isNaN(reps) || reps < 0)) {
        await addLog({ eventType: 'validation_failure', action: 'Workout creation: invalid reps', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'reps', value: req.body.reps } });
        return res.status(400).json({ error: 'Valid reps value is required' });
    }
    if (load !== undefined && (isNaN(load) || load < 0)) {
        await addLog({ eventType: 'validation_failure', action: 'Workout creation: invalid load', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'load', value: req.body.load } });
        return res.status(400).json({ error: 'Valid load value is required' });
    }

    try {
        if (!enforceAction(req, res, 'Workout', 'create')) return;
        const workout = await Workout.create({title, load, reps})
        res.status(200).json(workout)
    } catch (error) {
        console.error('Error creating workout:', error);
        await addLog({ eventType: 'error', action: 'Workout creation failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(400).json({error: 'Error creating workout'})
    }
}

// DELETE a workout
const deleteWorkout = async (req, res) => {
    const {id} = req.params
    if (!enforceAction(req, res, 'Workout', 'delete')) return;

    if(!mongoose.Types.ObjectId.isValid(id)){
        await addLog({ eventType: 'validation_failure', action: 'Delete workout: invalid ID format', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { id } });
        return res.status(404).json({error: 'No such item exists.'})
    }

    try {
        const workout = await Workout.findOneAndDelete({_id: id})

        if (!workout) {
            return res.status(400).json({error: 'No such item exists.'})
        }
        
        res.status(200).json(workout) 
    } catch (error) {
        console.error('Error deleting workout:', error);
        await addLog({ eventType: 'error', action: 'Workout deletion failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ error: 'Error deleting workout' });
    }
}

// UPDATE a workout
const updateWorkout = async (req, res) => {
    const {id} = req.params
    if (!enforceAction(req, res, 'Workout', 'update')) return;

    if(!mongoose.Types.ObjectId.isValid(id)){
        await addLog({ eventType: 'validation_failure', action: 'Update workout: invalid ID format', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { id } });
        return res.status(404).json({error: 'No such item exists.'})
    }

    try {
        const workout = await Workout.findOneAndUpdate({_id: id}, {
            ...req.body
        })

        if (!workout) {
            return res.status(400).json({error: 'No such item exists.'})
        }
        
        res.status(200).json(workout) 
    } catch (error) {
        console.error('Error updating workout:', error);
        await addLog({ eventType: 'error', action: 'Workout update failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ error: 'Error updating workout' });
    }
}

module.exports = {
    getWorkouts,
    getAWorkout,
    createWorkout,
    deleteWorkout,
    updateWorkout
}