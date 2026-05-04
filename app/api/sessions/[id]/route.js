import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Session from '@/models/Session';

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const session = await Session.findById(params.id);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const { endedAt } = await request.json();

    session.endedAt = endedAt || new Date();

    if (session.startedAt) {
      const durationMs = session.endedAt - session.startedAt;
      session.duration = Math.round(durationMs / 60000); // Convert to minutes
    }

    await session.save();

    return NextResponse.json({ message: 'Session updated', session }, { status: 200 });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const session = await Session.findById(params.id).populate('bookingId');

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
