const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true }, // Subject like Math, Physics
  availableSlots: [{ type: String }],               // e.g., ["Mon 5PM-6PM", "Wed 2PM-3PM"]
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
