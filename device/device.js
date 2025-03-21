const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

// Fake data parameters
let foodLevel = 100; // percentage
let isFeeding = false;

client.on('connect', () => {
    console.log('Device connected to MQTT');
    // Subscribe to control topic
    client.subscribe('petfeeder/feedCommand');

    // Send periodic updates
    setInterval(() => {
        // Simulate food consumption
        if (!isFeeding) foodLevel = Math.max(0, Math.ceil(foodLevel - Math.random() * 2));

        // Publish sensor data
        client.publish('petfeeder/foodLevel', JSON.stringify({
            deviceId: 'feeder-001',
            foodLevel: foodLevel,
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

            const reductionRate = 0.5;
            const reduction = portion * reductionRate;

            // Check if there's enough food for the requested portion
            if (reduction > foodLevel) {
                console.log(`Error: Not enough food. Requested ${portion}g requires ${reduction}% but only ${foodLevel}% available.`);

                // Send error response back to server
                client.publish('petfeeder/feedResponse', JSON.stringify({
                    status: 'error',
                    requestId: requestId,
                    message: 'Not enough food available for the requested portion',
                    foodLevel: foodLevel,
                    requestedReduction: reduction,
                    timestamp: new Date().toISOString()
                }));
                return; // Stop execution here
            }

            console.log(`Triggering feeding mechanism with portion: ${portion}g`);

            // Reduce food level only if there's enough food
            foodLevel = Math.max(0, foodLevel - reduction);
            isFeeding = true;

            const feedingTime = 1000 + (portion * 40);

            console.log('feedingTime:', feedingTime);
            setTimeout(() => {
                isFeeding = false;
                console.log(`Feeding complete. Food level: ${foodLevel}%`);

                // Send confirmation back to server
                client.publish('petfeeder/feedResponse', JSON.stringify({
                    status: 'success',
                    requestId: requestId,
                    foodLevel: foodLevel,
                    timestamp: new Date().toISOString()
                }));
            }, feedingTime);
        }
    }
});