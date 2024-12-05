/* eslint-disable no-undef */
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    event_id: String,
    parking_spot_id: String,
    device_id: String,
    status: String,
    plate_number: String,
    timestamp: String,
});

module.exports = mongoose.model('Event', eventSchema,'CarPark');
