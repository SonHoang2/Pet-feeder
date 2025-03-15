const mqtt = require('mqtt');
const express = require('express');
const app = express();
const port = 5000;

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

// Store fake data
let deviceState = {
    foodLevel: 0,
    lastFeed: null
};

client.on('connect', () => {
    console.log('Server connected to MQTT');
    client.subscribe('petfeeder/foodLevel');
});

// Handle incoming data
client.on('message', (topic, message) => {
    if (topic === 'petfeeder/foodLevel') {
        const data = JSON.parse(message);
        deviceState.foodLevel = data.foodLevel;
        deviceState.lastUpdate = data.timestamp;

        // Send alert if food level low
        if (data.foodLevel < 20) {
            console.log('Low food alert!');
            // Could trigger notification here
        }
    }
});

// API endpoints
app.get('/status', (req, res) => {
    res.json(deviceState);
});

app.get('/feed', (req, res) => {
    client.publish('petfeeder/feedCommand', JSON.stringify({
        cmd: 'FEED',
        timestamp: new Date().toISOString()
    }));
    console.log('Feeding command sent');
    
    res.send('Feeding command sent');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});