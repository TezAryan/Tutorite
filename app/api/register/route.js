import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password, role, bio, tags, subjects, grade } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();

    // Create role-specific profile
    if (role === 'teacher') {
      const teacher = new Teacher({
        userId: user._id,
        bio: bio || '',
        tags: tags || [],
        subjects: subjects || [],
      });
      await teacher.save();
    } else if (role === 'student') {
      const student = new Student({
        userId: user._id,
        grade: grade || '',
      });
      await student.save();
    }

    return NextResponse.json(
      { message: 'User registered successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Full error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
