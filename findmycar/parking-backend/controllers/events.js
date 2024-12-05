const eventRouter = require("express").Router();
const Event = require('../models/Event');

// Get all events
eventRouter.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        console.log("Fetched Events:",events);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching events' });
    }
});

// Get events by plate number
eventRouter.get('/plate/:plate_number', async (req, res) => {
    try {
        const events = await Event.find({ plate_number: req.params.plate_number });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching events by plate number' });
    }
});

// Filter events
eventRouter.get('/filter', async (req, res) => {
    const { parking_spot_id, device_id, timestamp } = req.query;
    const filter = {};
    if (parking_spot_id) filter.parking_spot_id = parking_spot_id;
    if (device_id) filter.device_id = device_id;
    if (timestamp) filter.timestamp = timestamp;

    try {
        const events = await Event.find(filter);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching filtered events' });
    }
});

module.exports = eventRouter;
