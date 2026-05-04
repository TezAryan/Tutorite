import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Rating from '@/models/Rating';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Booking from '@/models/Booking';

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

    const { bookingId, stars, comment } = await request.json();

    if (!bookingId || !stars) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const student = await Student.findOne({ userId: session.user.id });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Check if already rated
    const existingRating = await Rating.findOne({ bookingId });
    if (existingRating) {
      return NextResponse.json(
        { error: 'This booking has already been rated' },
        { status: 400 }
      );
    }

    const rating = new Rating({
      bookingId,
      sessionId: null, // Will be linked when session is created
      teacherId: booking.teacherId,
      studentId: student._id,
      stars,
      comment: comment || '',
    });

    await rating.save();

    // Update teacher's average rating
    const allRatings = await Rating.find({ teacherId: booking.teacherId });
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

    await Teacher.findByIdAndUpdate(booking.teacherId, {
      averageRating: avgRating,
    });

    return NextResponse.json(
      { message: 'Rating submitted successfully', rating },
      { status: 201 }
    );
  } catch (error) {
    console.error('Rating creation error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
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

    const ratings = await Rating.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error('Rating fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
