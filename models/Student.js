import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    grade: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
