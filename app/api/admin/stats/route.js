import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Session from '@/models/Session';
import Rating from '@/models/Rating';
import Teacher from '@/models/Teacher';

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

    // Get total sessions
    const totalSessions = await Booking.countDocuments({
      status: 'completed',
    });

    // Get sessions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessionsThisWeek = await Booking.countDocuments({
      status: 'completed',
      updatedAt: { $gte: weekAgo },
    });

    // Get average rating
    const ratings = await Rating.find();
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
        : 0;

    // Get most booked subjects
    const teachers = await Teacher.find();
    const subjectCount = {};
    teachers.forEach((teacher) => {
      teacher.subjects.forEach((subject) => {
        subjectCount[subject] = (subjectCount[subject] || 0) + 1;
      });
    });

    return NextResponse.json(
      {
        stats: {
          totalSessions,
          sessionsThisWeek,
          averageRating: avgRating.toFixed(1),
          mostBookedSubjects: Object.entries(subjectCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([subject, count]) => ({ subject, count })),
          totalTeachers: teachers.length,
          totalBookings: await Booking.countDocuments(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
