const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bookedSlots: [{
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    time: { type: String },  // e.g., "Mon 3PM-4PM"
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
