const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

const maxFoodStorageWeight = 1000;
const maxFoodBowlWeight = 150;
var currentFoodStorageWeight = 1000
var currentFoodBowlWeight = 50

function readFoodStorageSensor() {
    //  Tạo ra một số ngẫu nhiên từ -3 đến +3.
    const noise = Math.random() * 6 - 3;
    const rawReading = currentFoodStorageWeight + noise;

    return Math.min(maxFoodStorageWeight, Math.max(0, Math.round(rawReading)));
}

function readFoodBowlSensor() {
    // Simulate pet eating (30% chance of eating when function is called)
    if (Math.random() < 0.3 && currentFoodBowlWeight > 0) {
        // Pet eats between 1-3g of food
        const amountEaten = Math.ceil(Math.random() * 3);
        currentFoodBowlWeight = Math.max(0, currentFoodBowlWeight - amountEaten);
        console.log(`Pet ate ${amountEaten}g of food. Remaining: ${currentFoodBowlWeight}g`);
    }

    // Add sensor noise (-1 to +1)
    const noise = Math.random() * 2 - 1;
    const rawReading = currentFoodBowlWeight + noise;

    // Ensure value stays within valid range
    return Math.min(maxFoodBowlWeight, Math.max(0, Math.round(rawReading)));
}


client.on('connect', () => {
    console.log('Device connected to MQTT');
    // Subscribe to control topic
    client.subscribe('petfeeder/feedCommand');

    // Send periodic updates
    setInterval(() => {
        currentFoodStorageWeight = readFoodStorageSensor();
        currentFoodBowlWeight = readFoodBowlSensor();

        // Publish sensor data
        client.publish('petfeeder/StorageWeight', JSON.stringify({
            deviceId: 'feeder-001',
            currentFoodStorageWeight: currentFoodStorageWeight,
            maxFoodStorageWeight: maxFoodStorageWeight,
            timestamp: new Date().toISOString()
        }));

        client.publish('petfeeder/FoodBowlWeight', JSON.stringify({
            deviceId: 'feeder-001',
            currentFoodBowlWeight: currentFoodBowlWeight,
            maxFoodBowlWeight: maxFoodBowlWeight,
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

            currentFoodStorageWeight = readFoodStorageSensor();
            currentFoodBowlWeight = readFoodBowlSensor();

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

            currentFoodBowlWeight += portion; // Increase the food bowl weight

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
                    currentFoodBowlWeight: currentFoodBowlWeight,
                    maxFoodBowlWeight: maxFoodBowlWeight,
                    timestamp: new Date().toISOString()
                }));
            }, feedingTime);
        }
    }
});