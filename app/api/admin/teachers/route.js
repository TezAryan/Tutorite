import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
import Booking from '@/models/Booking';

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const teachers = await Teacher.find().populate('userId');

    // Get session count for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const sessionCount = await Booking.countDocuments({
          teacherId: teacher._id,
          status: 'completed',
        });

        return {
          _id: teacher._id,
          name: teacher.userId?.name,
          email: teacher.userId?.email,
          bio: teacher.bio,
          tags: teacher.tags,
          averageRating: teacher.averageRating,
          sessionCount,
          isEnabled: teacher.userId?.isEnabled !== false,
        };
      })
    );

    return NextResponse.json(
      { teachers: teachersWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Teachers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const { teacherId, isEnabled } = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required' },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findById(teacherId).populate('userId');

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Update user's isEnabled field
    await User.findByIdAndUpdate(teacher.userId._id, {
      isEnabled: isEnabled !== false,
    });

    return NextResponse.json(
      { message: 'Teacher status updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Teacher update error:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}
