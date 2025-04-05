import app from './app.js';
import mongoose from 'mongoose';
import config from './config/config.js';
import { pendingCommands, storageWeight, foodBowlWeight, client } from './shareVarible.js';

mongoose
    .connect(config.db)
    .then(() => console.log('DB connection successfull'));

const port = config.port || 5000;


client.on('connect', () => {
    console.log('Server connected to MQTT');
    client.subscribe('petfeeder/StorageWeight');
    client.subscribe('petfeeder/feedResponse');
    client.subscribe('petfeeder/FoodBowlWeight');
});

client.on('message', (topic, message) => {
    if (topic === 'petfeeder/StorageWeight') {
        const data = JSON.parse(message);
        storageWeight.currentFoodStorageWeight = data.currentFoodStorageWeight;
        storageWeight.maxFoodStorageWeight = data.maxFoodStorageWeight;

        const percentage = (storageWeight.currentFoodStorageWeight / storageWeight.maxFoodStorageWeight) * 100;

        if (percentage < 20) {
            console.log('Low food alert!');
        }
    }

    if (topic === 'petfeeder/FoodBowlWeight') {
        const data = JSON.parse(message);
        foodBowlWeight.currentFoodBowlWeight = data.currentFoodBowlWeight;
        foodBowlWeight.maxFoodBowlWeight = data.maxFoodBowlWeight;

        console.log("currentFoodBowlWeight: ", foodBowlWeight);
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