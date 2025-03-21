const mqtt = require('mqtt');
const port = 5000;
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');
const app = require('./app');

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


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});