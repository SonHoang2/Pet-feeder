import { connect } from 'mqtt';

export const pendingCommands = new Map();

export const storageWeight = {
    currentFoodStorageWeight: 0,
    maxFoodStorageWeight: 1000,
};

export const foodBowlWeight = {
    currentFoodBowlWeight: 0,
    maxFoodBowlWeight: 150,
};

export const client = connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');