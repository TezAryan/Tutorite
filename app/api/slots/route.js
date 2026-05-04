import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Slot from '@/models/Slot';
import Teacher from '@/models/Teacher';

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized - teacher role required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId: session.user.id });
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { date, startTime, endTime, maxStudents } = await request.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const slot = new Slot({
      teacherId: teacher._id,
      date,
      startTime,
      endTime,
      maxStudents: maxStudents || 1,
    });

    await slot.save();

    return NextResponse.json(
      { message: 'Slot created successfully', slot },
      { status: 201 }
    );
  } catch (error) {
    console.error('Slot creation error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Slot already exists at this time' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create slot' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    let query = {};
    if (teacherId) {
      query.teacherId = teacherId;
    }

    // Get available slots only
    query.isBooked = false;

    const slots = await Slot.find(query)
      .populate('teacherId')
      .sort({ date: 1, startTime: 1 });

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error('Slot fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}
