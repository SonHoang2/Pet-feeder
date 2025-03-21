const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    time: {
        type: String,
        required: [true, 'Feeding time is required'],
        validate: {
            validator: function (v) {
                // Validate time format (HH:MM)
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format! Use HH:MM format.`
        }
    },
    portion: {
        type: Number,
        required: [true, 'Portion size is required'],
        min: [10, 'Portion size must be at least 10g'],
        max: [200, 'Portion size cannot exceed 200g']
    },
    days: {
        type: String,
        default: '*',
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastExecuted: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Create a compound unique index on time and portion
scheduleSchema.index({ time: 1, portion: 1 }, { unique: true });

// Pre-save hook to validate data
scheduleSchema.pre('save', function (next) {
    // Add any additional validation logic here
    next();
});

// Add a method to format the schedule for display
scheduleSchema.methods.formatSchedule = function () {
    return {
        id: this._id,
        time: this.time,
        portion: this.portion,
        days: this.days,
        active: this.active,
        createdAt: this.createdAt,
        lastExecuted: this.lastExecuted
    };
};

// Static method to find schedules for a specific day
scheduleSchema.statics.findSchedulesForDay = function (dayIndex) {
    return this.find({
        $or: [
            { days: '*' },
            { days: { $regex: new RegExp(`(^|,)${dayIndex}(,|$)`) } }
        ],
        active: true
    });
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;