import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Booking from '@/models/Booking';

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
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

    // Check if session already exists for this booking
    const existingSession = await Session.findOne({ bookingId });
    if (existingSession) {
      return NextResponse.json({ session: existingSession }, { status: 200 });
    }

    const roomName = `tutorite-${bookingId}`;

    const newSession = new Session({
      bookingId,
      roomName,
      startedAt: new Date(),
    });

    await newSession.save();

    return NextResponse.json(
      { message: 'Session created', session: newSession },
      { status: 201 }
    );
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    await connectDB();

    let query = {};
    if (bookingId) {
      query.bookingId = bookingId;
    }

    const sessions = await Session.find(query).populate('bookingId');

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
