import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    startTime: {
      type: String, // HH:mm format
      required: true,
    },
    endTime: {
      type: String, // HH:mm format
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    maxStudents: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Unique index on (teacherId, date, startTime)
slotSchema.index({ teacherId: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.models.Slot || mongoose.model('Slot', slotSchema);
