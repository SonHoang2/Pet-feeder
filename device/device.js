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
        if(!isFeeding) foodLevel = Math.max(0, foodLevel - Math.random() * 2);
        
        // Publish sensor data
        client.publish('petfeeder/foodLevel', JSON.stringify({
            deviceId: 'feeder-001',
            foodLevel: foodLevel,
            timestamp: new Date().toISOString()
        }));
    }, 5000);
});

// Handle feed commands
client.on('message', (topic, message) => {
    if(topic === 'petfeeder/feedCommand') {
        const command = JSON.parse(message);
        if(command.cmd === 'FEED') {
            console.log('Triggering feeding mechanism');
            isFeeding = true;
            foodLevel = 100;
            setTimeout(() => isFeeding = false, 3000); // Simulate feeding time
        }
    }
});