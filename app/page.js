'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      if (session.user.role === 'teacher') {
        router.push('/dashboard/teacher/slots');
      } else if (session.user.role === 'student') {
        router.push('/dashboard/student');
      } else if (session.user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900">
      <nav className="border-b border-white border-opacity-10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
            Tutorite
          </h1>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-white hover:text-violet-300 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Learn from expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">tutors online</span>
          </h2>
          <p className="text-xl text-violet-200 mb-8 max-w-2xl mx-auto">
            Book one-to-one sessions with qualified teachers. Get personalized guidance, clear doubts, and achieve your academic goals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
            >
              Find a Tutor
            </Link>
            <Link
              href="/register?role=teacher"
              className="px-8 py-3 border border-violet-400 text-violet-400 hover:text-violet-300 hover:border-violet-300 font-semibold rounded-lg transition"
            >
              Become a Tutor
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl border border-white border-opacity-10 p-8 hover:border-opacity-20 transition">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-3">Expert Tutors</h3>
            <p className="text-violet-200">
              Connect with qualified teachers who specialize in your subjects and learning style.
            </p>
          </div>

          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl border border-white border-opacity-10 p-8 hover:border-opacity-20 transition">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-bold text-white mb-3">Live Video Sessions</h3>
            <p className="text-violet-200">
              Have real-time conversations with your tutor. See them, hear them, learn better.
            </p>
          </div>

          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl border border-white border-opacity-10 p-8 hover:border-opacity-20 transition">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-white mb-3">Flexible Scheduling</h3>
            <p className="text-violet-200">
              Book sessions at times that work for you. No long-term commitments.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20">
          <h3 className="text-4xl font-bold text-white mb-12 text-center">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Sign Up', desc: 'Create your account as a student or tutor' },
              { num: 2, title: 'Browse', desc: 'Find tutors by subject and availability' },
              { num: 3, title: 'Book', desc: 'Schedule a one-on-one session' },
              { num: 4, title: 'Learn', desc: 'Join live video and get help' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  {step.num}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
                <p className="text-violet-200">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-12 backdrop-blur-lg border border-violet-500 border-opacity-30">
            <h3 className="text-3xl font-bold text-white mb-6">Ready to get started?</h3>
            <p className="text-violet-100 mb-8 text-lg">
              Join thousands of students learning from expert tutors on Tutorite
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-violet-600 font-semibold rounded-lg hover:bg-violet-50 transition"
              >
                Sign Up Now
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white border-opacity-10 mt-20 py-8 text-center text-violet-300">
        <p>&copy; 2024 Tutorite. All rights reserved.</p>
      </footer>
    </div>
  );
}
