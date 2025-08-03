const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
    },
    date: {
        type: String, // Format: 'YYYY-MM-DD'
        required: true,
    },
    time: {
        type: String, // Format: 'HH:MM' (24-hour)
        required: true,
    },
    isBooked: {
        type: Boolean,
        default: false,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        default: null, // will be filled once booked
    }
});

const Slot = mongoose.model("Slot", slotSchema);
module.exports = Slot;
