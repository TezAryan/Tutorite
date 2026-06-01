import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    callDuration: {
      type: Number, // in seconds
      default: 0,
    },
    callQuality: {
      videoBitrate: Number,
      audioBitrate: Number,
      packetsLost: Number,
      jitter: Number,
      latency: Number,
    },
    resources: [
      {
        type: String, // 'pdf' | 'link'
        url: String,
        title: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
