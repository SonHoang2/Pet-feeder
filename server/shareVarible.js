import { connect } from 'mqtt';

export const pendingCommands = new Map();

export const deviceState = {
    currentFoodStorageWeight: 0,
    maxFoodStorageWeight: 1000,
    lastUpdate: null
};

export const client = connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');