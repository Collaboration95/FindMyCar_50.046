const app = require('./app');
const config = require('./utils/config');
const { MongoClient } = require('mongodb');
const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server for the app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins
    },
});

// Use the same MONGO_URI as in app.js
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
async function connectToStream() {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('FindMyCar');
        const collection = db.collection('CarPark');

        // Watch the collection for changes
        const changeStream = collection.watch();

        changeStream.on('change', (change) => {
            // Filter for only 'insert' operations
            if (change.operationType === 'insert') {
                const simplifiedChange = {
                    operationType: change.operationType,
                    document: change.fullDocument,
                };

                console.log('Simplified Change Detected:', simplifiedChange);

                // Emit the simplified change to the frontend
                io.emit('carParkUpdate', simplifiedChange);
            }
        });

        // Handle errors
        changeStream.on('error', (error) => {
            console.error('Change Stream Error:', error);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB stream:', error);
    }
}


connectToStream();

// Start the server
const PORT = config.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
