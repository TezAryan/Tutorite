import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/db';
import Session from '@/models/Session';

export async function POST(request) {
  // This endpoint handles resource uploads to sessions
  // In a real implementation, it would use Cloudinary
  // For now, we just store URL references

  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { sessionId, type, url, title } = await request.json();

    if (!sessionId || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Add resource to session
    sessionDoc.resources.push({
      type,
      url,
      title: title || 'Untitled Resource',
    });

    await sessionDoc.save();

    return NextResponse.json(
      { message: 'Resource added successfully', session: sessionDoc },
      { status: 201 }
    );
  } catch (error) {
    console.error('Resource upload error:', error);
    return NextResponse.json(
      { error: 'Failed to add resource' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    await connectDB();

    let query = {};
    if (sessionId) {
      query._id = sessionId;
    }

    const sessions = await Session.find(query);

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('Resource fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
