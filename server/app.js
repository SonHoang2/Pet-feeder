const express = require('express');
const app = express();
const cors = require('cors');
const cron = require('node-cron');

app.use(cors());
app.use(express.json());

const scheduledFeedings = [];
const activeSchedules = new Map();

app.get('/status', (req, res) => {
    res.json(deviceState);
});

app.post('/feed', async (req, res) => {
    const { portion } = req.body;

    if (!portion || isNaN(Number(portion))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid portion value provided'
        });
    }

    try {
        // Generate a unique request ID
        const requestId = Date.now().toString();

        // Create a promise that will resolve when the device responds
        const responsePromise = new Promise((resolve, reject) => {
            pendingCommands.set(requestId, {
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Set timeout to remove stale requests after 30 seconds
            setTimeout(() => {
                if (pendingCommands.has(requestId)) {
                    const { reject } = pendingCommands.get(requestId);
                    reject(new Error("Feeding timeout - device did not respond"));
                    pendingCommands.delete(requestId);
                }
            }, 30000);
        });

        // Send command with requestId
        client.publish('petfeeder/feedCommand', JSON.stringify({
            cmd: 'FEED',
            portion: Number(portion) || 50,
            requestId: requestId,
            timestamp: new Date().toISOString()
        }));

        console.log('Feeding command sent with portion:', portion);

        // Wait for device to complete feeding and respond
        const feedResult = await responsePromise;

        res.status(200).json({
            status: 'success',
            message: 'Feeding completed successfully',
            portion: Number(portion) || 50,
            foodLevel: feedResult.foodLevel
        });
    } catch (error) {
        console.error('Error in feeding process:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to complete feeding'
        });
    }
});

function scheduleFeeding(schedule) {
    const { time, portion, days, id } = schedule;
    const [hours, minutes] = time.split(':');

    // Convert to cron format - if days is provided use it, otherwise run daily
    const cronExpression = `${minutes} ${hours} * * ${days || '*'}`;

    // Create cron job
    const job = cron.schedule(cronExpression, async () => {
        console.log(`Executing scheduled feeding: ${portion}g at ${time}`);

        try {
            // Generate a unique request ID
            const requestId = Date.now().toString();

            // Create a promise that will resolve when the device responds
            const responsePromise = new Promise((resolve, reject) => {
                pendingCommands.set(requestId, {
                    resolve,
                    reject,
                    timestamp: Date.now()
                });

                // Set timeout to remove stale requests after 30 seconds
                setTimeout(() => {
                    if (pendingCommands.has(requestId)) {
                        const { reject } = pendingCommands.get(requestId);
                        reject(new Error("Feeding timeout - device did not respond"));
                        pendingCommands.delete(requestId);
                    }
                }, 30000);
            });

            // Send command with requestId
            client.publish('petfeeder/feedCommand', JSON.stringify({
                cmd: 'FEED',
                portion: Number(portion),
                requestId: requestId,
                scheduled: true,
                timestamp: new Date().toISOString()
            }));

            // Wait for device to complete feeding and respond
            await responsePromise;

        } catch (error) {
            console.error('Error during scheduled feeding:', error);
        }
    });

    // Store the job reference so we can stop it later if needed
    if (id) {
        if (activeSchedules.has(id)) {
            // Stop existing job before replacing it
            activeSchedules.get(id).stop();
        }
        activeSchedules.set(id, job);
    }

    return job;
}

// Add these new endpoints for schedule management
app.get('/schedules', (req, res) => {
    res.json(scheduledFeedings);
});

app.post('/schedules', (req, res) => {
    const { time, portion } = req.body;

    if (!time || !portion) {
        return res.status(400).json({
            status: 'error',
            message: 'Time and portion are required'
        });
    }

    const id = Date.now().toString();
    const schedule = { id, time, portion, days: '*', active: true };

    // Add to our schedule list
    scheduledFeedings.push(schedule);

    // Create the actual schedule
    scheduleFeeding(schedule);

    res.status(201).json({
        status: 'success',
        message: 'Feeding schedule created',
        schedule
    });
});

app.delete('/schedules/:id', (req, res) => {
    const { id } = req.params;
    const index = scheduledFeedings.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({
            status: 'error',
            message: 'Schedule not found'
        });
    }

    // Remove from our array
    scheduledFeedings.splice(index, 1);

    // Stop the cron job if it exists
    if (activeSchedules.has(id)) {
        activeSchedules.get(id).stop();
        activeSchedules.delete(id);
    }

    res.json({
        status: 'success',
        message: 'Schedule deleted'
    });
});

module.exports = app;