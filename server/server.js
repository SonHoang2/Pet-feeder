import app from './app.js';
import mongoose from 'mongoose';
import config from './config/config.js';
import { pendingCommands, deviceState, client } from './shareVarible.js';

mongoose
    .connect(config.db)
    .then(() => console.log('DB connection successfull'));


const port = config.port || 5000;


client.on('connect', () => {
    console.log('Server connected to MQTT');
    client.subscribe('petfeeder/currentFoodWeight');
    client.subscribe('petfeeder/feedResponse');
});

client.on('message', (topic, message) => {
    if (topic === 'petfeeder/currentFoodWeight') {
        const data = JSON.parse(message);
        deviceState.currentFoodWeight = data.currentFoodWeight;
        deviceState.lastUpdate = data.timestamp;
        deviceState.maxFoodWeight = data.maxFoodWeight;

        const percentage = (deviceState.currentFoodWeight / deviceState.maxFoodWeight) * 100;

        console.log("currentFoodWeight: ", deviceState.currentFoodWeight);

        if (percentage < 20) {
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