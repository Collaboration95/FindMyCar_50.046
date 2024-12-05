const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB URI
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB using Mongoose
mongoose.set('strictQuery', false);
mongoose
    .connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', async (req, res, next) => {
    res.send('Welcome to Parking Backend');
});

// Events Router
const eventsRouter = require('./controllers/events');
app.use('/api/events', eventsRouter);

module.exports = app;
