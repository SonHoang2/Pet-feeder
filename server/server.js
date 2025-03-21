const mqtt = require('mqtt');
const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');


app.use(cors());
app.use(express.json());

// Store fake data
let deviceState = {
    foodLevel: 0,
    lastFeed: null
};

const pendingCommands = new Map();

client.on('connect', () => {
    console.log('Server connected to MQTT');
    client.subscribe('petfeeder/foodLevel');
    client.subscribe('petfeeder/feedResponse');
});

client.on('message', (topic, message) => {
    if (topic === 'petfeeder/foodLevel') {
        const data = JSON.parse(message);
        deviceState.foodLevel = data.foodLevel;
        deviceState.lastUpdate = data.timestamp;

        console.log("foodLevel: ", deviceState.foodLevel);

        if (data.foodLevel < 20) {
            console.log('Low food alert!');
        }
    }

    if (topic === 'petfeeder/feedResponse') {
        const response = JSON.parse(message);
    
        // Find the pending request
        if (response.requestId && pendingCommands.has(response.requestId)) {
            const { resolve, reject } = pendingCommands.get(response.requestId);
            
            // Check if this is an error response
            if (response.status === 'error') {
                // If it's an error, reject the promise
                reject(new Error(response.message || 'Unknown device error'));
            } else {
                // If it's successful, resolve the promise
                resolve(response);
            }
            
            pendingCommands.delete(response.requestId);
        }
    }
});


app.get('/status', (req, res) => {
    res.json(deviceState);
});

app.post('/feed', async (req, res) => {
    const { portion } = req.body;

    if (!portion || isNaN(Number(portion))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid portion value provided'
        });
    }

    try {
        // Generate a unique request ID
        const requestId = Date.now().toString();

        // Create a promise that will resolve when the device responds
        const responsePromise = new Promise((resolve, reject) => {
            pendingCommands.set(requestId, {
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Set timeout to remove stale requests after 30 seconds
            setTimeout(() => {
                if (pendingCommands.has(requestId)) {
                    const { reject } = pendingCommands.get(requestId);
                    reject(new Error("Feeding timeout - device did not respond"));
                    pendingCommands.delete(requestId);
                }
            }, 30000);
        });

        // Send command with requestId
        client.publish('petfeeder/feedCommand', JSON.stringify({
            cmd: 'FEED',
            portion: Number(portion) || 50,
            requestId: requestId,
            timestamp: new Date().toISOString()
        }));

        console.log('Feeding command sent with portion:', portion);

        // Wait for device to complete feeding and respond
        const feedResult = await responsePromise;

        res.status(200).json({
            status: 'success',
            message: 'Feeding completed successfully',
            portion: Number(portion) || 50,
            foodLevel: feedResult.foodLevel
        });
    } catch (error) {
        console.error('Error in feeding process:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to complete feeding'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});