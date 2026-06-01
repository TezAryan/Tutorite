import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

// In-memory storage for signaling data (in production, use Redis or database)
const signalingData = new Map();

export async function POST(req) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await connectDB();
    const { action, bookingId, peerId, offer, answer, candidate } = await req.json();

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is the teacher or student in this booking
    const teacher = await Teacher.findById(booking.teacherId);
    const student = await Student.findById(booking.studentId);

    const isTeacher = teacher && teacher.userId.toString() === session.user.id;
    const isStudent = student && student.userId.toString() === session.user.id;

    if (!isTeacher && !isStudent) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to booking' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize signaling room if not exists
    if (!signalingData.has(bookingId)) {
      signalingData.set(bookingId, {
        teacher: { peerId: null, offer: null, candidates: [] },
        student: { peerId: null, answer: null, candidates: [] },
      });
    }

    const room = signalingData.get(bookingId);

    if (action === 'register') {
      // Register peer in the room
      const role = isTeacher ? 'teacher' : 'student';
      room[role].peerId = peerId;

      return new Response(
        JSON.stringify({
          success: true,
          role,
          remotePeerId: room[role === 'teacher' ? 'student' : 'teacher'].peerId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'offer') {
      // Store offer from teacher
      room.teacher.offer = offer;
      return new Response(
        JSON.stringify({
          success: true,
          studentReady: !!room.student.peerId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'answer') {
      // Store answer from student
      room.student.answer = answer;
      return new Response(
        JSON.stringify({
          success: true,
          offer: room.teacher.offer,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'candidate') {
      // Relay ICE candidate
      const role = isTeacher ? 'teacher' : 'student';
      const remoteRole = role === 'teacher' ? 'student' : 'teacher';
      
      room[remoteRole].candidates.push(candidate);

      return new Response(
        JSON.stringify({
          success: true,
          candidates: room[role].candidates,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-candidates') {
      // Retrieve accumulated ICE candidates for peer
      const role = isTeacher ? 'teacher' : 'student';
      const candidates = room[role].candidates;
      room[role].candidates = []; // Clear after retrieval

      return new Response(
        JSON.stringify({
          success: true,
          candidates,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end-call') {
      // Clean up signaling data
      signalingData.delete(bookingId);
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Signaling error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
