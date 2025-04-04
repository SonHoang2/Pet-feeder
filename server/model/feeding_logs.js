import { Schema, model } from "mongoose";

const feedingLogSchema = new Schema({
    portion: {
        type: Number,
        required: [true, 'Portion size is required'],
        min: [10, 'Portion size must be at least 10g'],
        max: [100, 'Portion size cannot exceed 100g']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

const FeedingLog = model('FeedingLog', feedingLogSchema);

export default FeedingLog;