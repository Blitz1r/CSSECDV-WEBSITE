require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const crypto = require('crypto');
const workoutRoutes = require('./routes/workouts.js');
const loginRoutes = require('./routes/login.js');  // Import login route
const orderRoutes = require('./routes/orders');
const itemRoutes = require('./routes/items');  // Add the item routes
const categoryRoutes = require('./routes/category');
const Item = require('./models/ItemModel'); // Import Item model for update route
const userRoutes = require('./routes/users');
const publicUserRoutes = require('./routes/publicusers');
// express app
const app = express();

// middleware
// Robust CORS: allow configured origin and localhost:3000 during development
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow non-browser requests (no origin) and any whitelisted origin
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use((req, _res, next) => {
    if (req.headers.origin) {
        console.log('Request origin:', req.headers.origin);
    }
    next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.path}`);
    next();
});

// routes
app.use('/api/workouts', workoutRoutes);
app.use('/api/login', loginRoutes);  // Add login route
app.use('/api/orders', orderRoutes);
app.use('/api/items', itemRoutes);  // Add items route
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/categories', categoryRoutes);
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users', userRoutes);
app.use('/api/publicusers', publicUserRoutes);
// connect to MongoDB using the connection string in .env
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.log('Database connection error:', err);
    });

// start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});

// Centralized error handler (after routes & server start call)
const { addLog } = require('./controllers/loggerController');
app.use(async (err, req, res, next) => {
    const errorId = crypto.randomUUID();
    // Log sanitized error (no stack in response)
    await addLog({
        eventType: 'error',
        action: `Unhandled error: ${err.message}`,
        level: 'ERROR',
        userEmail: req.session?.email,
        userId: req.session?.userId,
        meta: { path: req.path, method: req.method, errorId }
    });
    if (res.headersSent) return next(err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred.', errorId });
});
