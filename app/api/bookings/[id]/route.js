import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Teacher from '@/models/Teacher';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const booking = await Booking.findById(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Teachers can confirm/cancel, students can cancel
    if (session.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: session.user.id });
      if (booking.teacherId.toString() !== teacher._id.toString()) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'student') {
      // Students can only cancel (if pending or confirmed)
      const { status } = await request.json();
      if (status !== 'cancelled') {
        return NextResponse.json(
          { error: 'Students can only cancel bookings' },
          { status: 403 }
        );
      }
    }

    const { status } = await request.json();

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    booking.status = status;
    await booking.save();

    return NextResponse.json({ message: 'Booking updated', booking }, { status: 200 });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const booking = await Booking.findById(params.id)
      .populate('studentId')
      .populate('teacherId')
      .populate('slotId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking }, { status: 200 });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}
