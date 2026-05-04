import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
    },
    tags: [String], // e.g., ["DSA", "DBMS", "Web Dev"]
    subjects: [String],
    averageRating: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
