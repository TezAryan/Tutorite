import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Slot from '@/models/Slot';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized - student role required' },
        { status: 403 }
      );
    }

    await connectDB();

    const student = await Student.findOne({ userId: session.user.id });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { slotId, doubtDescription } = await request.json();

    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID required' },
        { status: 400 }
      );
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { error: 'Slot already booked' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = new Booking({
      studentId: student._id,
      teacherId: slot.teacherId,
      slotId: slot._id,
      doubtDescription: doubtDescription || '',
    });

    await booking.save();

    // Update slot to mark as booked
    slot.isBooked = true;
    await slot.save();

    // TODO: Send confirmation email via Resend

    return NextResponse.json(
      { message: 'Booking confirmed', booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    let bookings;

    if (session.user.role === 'student') {
      const student = await Student.findOne({ userId: session.user.id });
      if (!student) {
        return NextResponse.json({ bookings: [] }, { status: 200 });
      }

      bookings = await Booking.find({ studentId: student._id })
        .populate('teacherId')
        .populate('slotId')
        .sort({ createdAt: -1 });
    } else if (session.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: session.user.id });
      if (!teacher) {
        return NextResponse.json({ bookings: [] }, { status: 200 });
      }

      bookings = await Booking.find({ teacherId: teacher._id })
        .populate('studentId')
        .populate('slotId')
        .sort({ 'slotId.date': 1 });
    }

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
