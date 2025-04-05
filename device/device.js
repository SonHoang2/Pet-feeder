const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

// Fake data parameters
const maxFoodStorageWeight = 1000; //Cảm biến lực (Cảm biến trọng lượng)
let currentFoodStorageWeight = 1000;

const FoodBowlWeight = 0; // Trọng lượng thức ăn trong bát

client.on('connect', () => {
    console.log('Device connected to MQTT');
    // Subscribe to control topic
    client.subscribe('petfeeder/feedCommand');

    // Send periodic updates
    setInterval(() => {
        // Publish sensor data
        client.publish('petfeeder/currentFoodStorageWeight', JSON.stringify({
            deviceId: 'feeder-001',
            currentFoodStorageWeight: currentFoodStorageWeight,
            maxFoodStorageWeight: maxFoodStorageWeight,
            timestamp: new Date().toISOString()
        }));
    }, 5000);
});

client.on('message', (topic, message) => {
    if (topic === 'petfeeder/feedCommand') {
        const command = JSON.parse(message);
        if (command.cmd === 'FEED') {
            const portion = command.portion || 50;
            const requestId = command.requestId; // Get the requestId

            console.log(`Received feeding request for portion: ${portion}g`);

            // Check if there's enough food for the requested portion
            if (portion > currentFoodStorageWeight) {
                console.log(`Error: Not enough food. Requires ${portion}g but only ${currentFoodStorageWeight}g available.`);

                // Send error response back to server
                client.publish('petfeeder/feedResponse', JSON.stringify({
                    status: 'error',
                    requestId: requestId,
                    message: 'Not enough food available for the requested portion',
                    currentFoodStorageWeight: currentFoodStorageWeight,
                    maxFoodStorageWeight: maxFoodStorageWeight,
                    requestedReduction: reduction,
                    timestamp: new Date().toISOString()
                }));
                return; // Stop execution here
            }

            console.log(`Triggering feeding mechanism with portion: ${portion}g`);

            const feedingTime = 1000 + (portion * 40);
            currentFoodStorageWeight -= portion; // Reduce the food weight

            console.log('feedingTime:', feedingTime);
            setTimeout(() => {
                console.log(`Feeding complete. Food level: ${currentFoodStorageWeight}g`);

                // Send confirmation back to server
                client.publish('petfeeder/feedResponse', JSON.stringify({
                    status: 'success',
                    requestId: requestId,
                    feedingTime: feedingTime,
                    currentFoodStorageWeight: currentFoodStorageWeight,
                    maxFoodStorageWeight: maxFoodStorageWeight,
                    timestamp: new Date().toISOString()
                }));
            }, feedingTime);
        }
    }
});