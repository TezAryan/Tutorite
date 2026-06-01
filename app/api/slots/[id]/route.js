import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Slot from '@/models/Slot';
import { authConfig } from '@/lib/auth';
import Teacher from '@/models/Teacher';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const teacher = await Teacher.findOne({ userId: session.user.id });
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const slot = await Slot.findById(id);

    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (slot.teacherId.toString() !== teacher._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized - can only delete own slots' },
        { status: 403 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { error: 'Cannot delete booked slots' },
        { status: 400 }
      );
    }

    await Slot.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Slot deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Slot deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete slot' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const slot = await Slot.findById(id).populate('teacherId');

    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ slot }, { status: 200 });
  } catch (error) {
    console.error('Slot fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slot' },
      { status: 500 }
    );
  }
}
