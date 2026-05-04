'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    if (!session || session.user.role !== 'student') {
      return;
    }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      // Check if user is authorized before fetching
      if (!session || session.user?.role !== 'student') {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [bookingsRes, slotsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/slots'),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings);
      }

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        const teacherMap = {};
        slotsData.slots.forEach((slot) => {
          if (slot.teacherId && !teacherMap[slot.teacherId._id]) {
            teacherMap[slot.teacherId._id] = slot.teacherId;
          }
        });
        setTeachers(Object.values(teacherMap));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = (bookings || [])
    .filter((b) => b.status === 'confirmed')
    .slice(0, 2);

  const recentBookings = (bookings || []).slice(0, 3);

  const pendingCount = (bookings || []).filter((b) => b.status === 'pending').length;
  const completedCount = (bookings || []).filter(
    (b) => b.status === 'completed'
  ).length;

  // Determine if authorized
  const isAuthorized = session && session.user?.role === 'student';

  return (
    isAuthorized ? (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-[280px] bg-gray-800 fixed left-0 top-0 h-full flex flex-col py-6 border-r border-gray-200 z-50">
        <div className="px-8 mb-10 flex flex-col gap-1">
          <span className="text-2xl font-bold text-white tracking-tight">
            Tutorite
          </span>
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Learning Hub
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4">
          <Link
            href="/dashboard/student/browse"
            onClick={() => setActiveNav('dashboard')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'dashboard'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/student/browse"
            onClick={() => setActiveNav('tutors')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'tutors'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">🔍</span>
            <span className="text-sm font-medium">Find Tutors</span>
          </Link>

          <Link
            href="/dashboard/student/bookings"
            onClick={() => setActiveNav('bookings')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'bookings'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">My Bookings</span>
          </Link>

          <Link
            href="/dashboard/student/history"
            onClick={() => setActiveNav('history')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'history'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">📚</span>
            <span className="text-sm font-medium">Learning History</span>
          </Link>
        </nav>

        <div className="px-8 mt-auto pt-6 border-t border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-white font-semibold text-sm">
              {session?.user?.name}
            </span>
            <span className="text-gray-400 text-xs">Student</span>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className="text-gray-300 hover:text-white transition-colors"
            title="Sign out"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[280px] w-[calc(100%-280px)] flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <header className="bg-white flex justify-between items-center px-8 h-16 border-b border-gray-200 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-black">Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search sessions..."
                className="pl-10 pr-4 py-1.5 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
              />
              <span className="absolute left-3 text-gray-400">🔍</span>
            </div>
            <button className="text-gray-600 hover:text-blue-600 transition-colors">
              🔔
            </button>
            <button className="text-gray-600 hover:text-blue-600 transition-colors">
              ⚙️
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          {loading ? (
            <div className="text-center text-gray-500">Loading dashboard...</div>
          ) : (
            <>
              {/* Welcome Hero */}
              <section className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-8 p-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">
                      Welcome back, {session?.user?.name?.split(' ')[0]}.
                    </h2>
                    <p className="text-blue-100 max-w-md">
                      You have {upcomingBookings.length} upcoming sessions
                      scheduled. Keep up with your learning goals!
                    </p>
                  </div>

                  <div className="flex gap-4 mt-6 relative z-10">
                    <Link
                      href="/dashboard/student/browse"
                      className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
                    >
                      ➕ Book New Session
                    </Link>
                    <Link
                      href="/dashboard/student/bookings"
                      className="border border-white/20 bg-white/10 px-6 py-2 rounded-lg font-semibold text-white hover:bg-white/20 transition-all"
                    >
                      View Schedule
                    </Link>
                  </div>

                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                {/* Stats Cards */}
                <div className="col-span-4 grid grid-rows-2 gap-6">
                  <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                      ⏳
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {pendingCount}
                      </div>
                      <div className="text-xs text-gray-600 font-semibold uppercase">
                        PENDING BOOKINGS
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
                      ✅
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {completedCount}
                      </div>
                      <div className="text-xs text-gray-600 font-semibold uppercase">
                        COMPLETED SESSIONS
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Content Grid */}
              <div className="grid grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="col-span-8 flex flex-col gap-8">
                  {/* Upcoming Sessions */}
                  <section>
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-xl font-bold text-black">
                        Upcoming Sessions
                      </h3>
                      <Link
                        href="/dashboard/student/bookings"
                        className="text-blue-600 font-semibold text-sm hover:underline"
                      >
                        View All
                      </Link>
                    </div>

                    {upcomingBookings.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-8 rounded-xl text-center text-gray-500">
                        No upcoming sessions. Book one now!
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {upcomingBookings.map((booking) => (
                          <div
                            key={booking._id}
                            className="bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2 py-1 bg-gray-100 text-blue-600 text-xs font-bold rounded uppercase">
                                {booking.doubtDescription?.split(' ')[0] ||
                                  'Session'}
                              </span>
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                ⏱️{' '}
                                {booking.slotId?.endTime &&
                                  booking.slotId?.startTime &&
                                  '60 min'}
                              </span>
                            </div>
                            <h4 className="font-bold text-black text-lg mb-1">
                              {booking.teacherId?.userId?.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                              {booking.doubtDescription || 'Session'}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  👨‍🏫
                                </div>
                                <span className="text-sm font-medium text-black">
                                  {booking.teacherId?.userId?.name?.split(
                                    ' '
                                  )[0]}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  Starts at
                                </div>
                                <div className="font-bold text-blue-600">
                                  {booking.slotId?.startTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Recent Booking History */}
                  <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-black">
                        Recent Bookings
                      </h3>
                      <Link
                        href="/dashboard/student/history"
                        className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        VIEW LOG 📥
                      </Link>
                    </div>

                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50 text-gray-700 text-xs font-bold text-left uppercase">
                        <tr>
                          <th className="px-6 py-3">TUTOR</th>
                          <th className="px-6 py-3">TOPIC</th>
                          <th className="px-6 py-3 text-right">DATE</th>
                          <th className="px-6 py-3 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentBookings.map((booking) => (
                          <tr
                            key={booking._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                              {booking.teacherId?.userId?.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-black">
                              {booking.doubtDescription || 'Session'}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-gray-600">
                              {booking.slotId?.date}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                  booking.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : booking.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </div>

                {/* Right Column */}
                <div className="col-span-4 flex flex-col gap-8">
                  {/* Find a Tutor */}
                  <section className="bg-blue-600 p-6 rounded-xl text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-4">Find a Tutor</h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-white/60">
                          🎓
                        </span>
                        <select className="w-full bg-white/20 border border-white/30 rounded-lg pl-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white">
                          <option className="text-black">
                            Select Subject
                          </option>
                          <option className="text-black">
                            Mathematics
                          </option>
                          <option className="text-black">Physics</option>
                          <option className="text-black">
                            Computer Science
                          </option>
                        </select>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-3 text-white/60">
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Teacher name..."
                          className="w-full bg-white/20 border border-white/30 rounded-lg pl-10 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>

                      <Link
                        href="/dashboard/student/browse"
                        className="w-full bg-white text-blue-600 font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-all block text-center"
                      >
                        Search Tutors
                      </Link>
                    </div>
                  </section>

                  {/* Online Tutors */}
                  <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs text-gray-700 font-bold mb-4 uppercase">
                      TUTORS AVAILABLE
                    </h3>
                    <div className="space-y-4">
                      {(teachers || []).slice(0, 3).map((teacher, idx) => (
                        <div
                          key={teacher._id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                                👨‍🏫
                              </div>
                              <div
                                className={`absolute bottom-0 right-0 w-3 h-3 ${
                                  idx < 2 ? 'bg-green-400' : 'bg-gray-300'
                                } border-2 border-white rounded-full`}
                              ></div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-black">
                                {teacher.userId?.name?.split(' ')[0]}
                              </span>
                              <span className="text-xs text-gray-600 font-bold">
                                {teacher.tags?.[0] || 'TUTOR'}
                              </span>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors">
                            💬
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Study Tip */}
                  <section className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-2xl mb-2 block">💡</span>
                      <h4 className="font-bold text-black mb-1">
                        Study Tip
                      </h4>
                      <p className="text-xs text-gray-700 italic">
                        "Spaced repetition improves retention by 50%. Review
                        notes 24 hours after learning for best results."
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
        <span className="text-2xl">💬</span>
        <span className="absolute right-16 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          Post Quick Doubt
        </span>
      </button>
    </div>
    ) : (
      <div className="flex items-center justify-center min-h-screen">Loading...</div>
    )
  );
}
