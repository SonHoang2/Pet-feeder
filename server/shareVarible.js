import { connect } from 'mqtt';

export const pendingCommands = new Map();

export const deviceState = {
    foodLevel: 100,
    lastFeed: null
};

export const client = connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');