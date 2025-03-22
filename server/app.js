import express, { json } from 'express';
const app = express();
import cors from 'cors';
import { schedule as _schedule } from 'node-cron';
import { pendingCommands, deviceState, client } from './shareVarible.js';
import Schedule from './model/schedules.js';

app.use(cors());
app.use(json());

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

    console.log(`Creating schedule: ${cronExpression} for ${portion}g`);

    // Create cron job
    const job = _schedule(cronExpression, async () => {
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
            const result = await responsePromise;

            // Update the lastExecuted time in the database
            await Schedule.findByIdAndUpdate(id, {
                lastExecuted: new Date()
            });

        } catch (error) {
            console.error('Error during scheduled feeding:', error);
        }
    });

    // Store the job reference so we can stop it later if needed
    if (id) {
        if (activeSchedules.has(id.toString())) {
            // Stop existing job before replacing it
            activeSchedules.get(id.toString()).stop();
        }
        activeSchedules.set(id.toString(), job);
    }

    return job;
}

// Get all schedules
app.get('/schedules', async (req, res) => {
    try {
        const schedules = await Schedule.find({ active: true });
        res.json({
            status: 'success',
            schedules
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch schedules'
        });
    }
});

// Create a new schedule
app.post('/schedules', async (req, res) => {
    const { time, portion, days } = req.body;

    if (!time || !portion) {
        return res.status(400).json({
            status: 'error',
            message: 'Time and portion are required'
        });
    }

    try {
        // Create new schedule in database
        const schedule = new Schedule({
            time,
            portion: Number(portion),
            days: days || '*',
            active: true
        });

        // Save to database
        await schedule.save();

        // Create the actual cron job
        scheduleFeeding(schedule.formatSchedule());

        res.status(201).json({
            status: 'success',
            message: 'Feeding schedule created',
            schedule: schedule.formatSchedule()
        });
    } catch (error) {
        console.error('Error creating schedule:', error);

        // Better error handling for duplicate schedules
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'A schedule with this time already exists'
            });
        }

        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create schedule'
        });
    }
});

// Delete a schedule
app.delete('/schedules/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                status: 'error',
                message: 'Schedule not found'
            });
        }

        // Delete from database
        await Schedule.findByIdAndDelete(id);

        // Stop the cron job if it exists
        if (activeSchedules.has(id.toString())) {
            activeSchedules.get(id.toString()).stop();
            activeSchedules.delete(id.toString());
        }

        res.json({
            status: 'success',
            message: 'Schedule deleted'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete schedule'
        });
    }
});

export default app;