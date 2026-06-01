'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    averageRating: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    if (!session || session.user?.role !== 'teacher') {
      return;
    }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      if (!session || session.user?.role !== 'teacher') {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [bookingsRes, slotsRes, ratingsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/slots'),
        fetch('/api/ratings'),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);

        // Calculate stats
        const completed = (bookingsData.bookings || []).filter((b) => b.status === 'completed').length;
        const confirmed = (bookingsData.bookings || []).filter((b) => b.status === 'confirmed').length;
        const uniqueStudents = new Set((bookingsData.bookings || []).map((b) => b.studentId)).size;

        setStats((prev) => ({
          ...prev,
          totalStudents: uniqueStudents,
          totalSessions: (bookingsData.bookings || []).length,
          completedSessions: completed,
        }));
      }

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setSlots(slotsData.slots || []);
      }

      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setRatings(ratingsData.ratings || []);

        // Calculate average rating
        if ((ratingsData.ratings || []).length > 0) {
          const avg =
            (ratingsData.ratings || []).reduce((sum, r) => sum + (r.stars || 0), 0) /
            (ratingsData.ratings || []).length;
          setStats((prev) => ({
            ...prev,
            averageRating: avg.toFixed(1),
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = (bookings || [])
    .filter((b) => b.status === 'confirmed')
    .sort((a, b) => new Date(a.slotId?.date) - new Date(b.slotId?.date))
    .slice(0, 3);

  const recentBookings = (bookings || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const pendingBookings = (bookings || []).filter((b) => b.status === 'pending').length;

  // Determine if authorized
  const isAuthorized = session && session.user?.role === 'teacher';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-[280px] bg-gray-800 fixed left-0 top-0 h-full flex flex-col py-6 border-r border-gray-200 z-50">
        <div className="px-8 mb-10 flex flex-col gap-1">
          <span className="text-2xl font-bold text-white tracking-tight">
            Tutorite
          </span>
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Teacher Portal
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-left w-full ${
              activeNav === 'dashboard'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <Link
            href="/dashboard/teacher/slots"
            onClick={() => setActiveNav('slots')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'slots'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">🕐</span>
            <span className="text-sm font-medium">My Time Slots</span>
          </Link>

          <Link
            href="/dashboard/teacher/bookings"
            onClick={() => setActiveNav('bookings')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'bookings'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Student Bookings</span>
            {pendingBookings > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingBookings}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/teacher/ratings"
            onClick={() => setActiveNav('ratings')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'ratings'
                ? 'bg-white/20 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">⭐</span>
            <span className="text-sm font-medium">Student Ratings</span>
          </Link>
        </nav>

        <div className="px-8 mt-auto pt-6 border-t border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-white font-semibold text-sm">
              {session?.user?.name}
            </span>
            <span className="text-gray-400 text-xs">Teacher</span>
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
            <h1 className="text-xl font-bold text-black">Teacher Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search students..."
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
                <div className="col-span-8 p-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">
                      Welcome back, {session?.user?.name?.split(' ')[0]}.
                    </h2>
                    <p className="text-purple-100 max-w-md">
                      You have {upcomingBookings.length} upcoming sessions scheduled.
                      {pendingBookings > 0 && ` ${pendingBookings} pending booking request(s).`}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Students</p>
                        <p className="text-2xl font-bold text-black">{stats.totalStudents}</p>
                      </div>
                      <span className="text-3xl">👥</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Rating</p>
                        <div className="flex items-center gap-1">
                          <p className="text-2xl font-bold text-black">{stats.averageRating}</p>
                          <span className="text-lg">⭐</span>
                        </div>
                      </div>
                      <span className="text-3xl">📈</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Stats Cards */}
              <section className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Sessions</p>
                      <p className="text-3xl font-bold text-black">{stats.totalSessions}</p>
                    </div>
                    <span className="text-4xl">📚</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Completed</p>
                      <p className="text-3xl font-bold text-black">{stats.completedSessions}</p>
                    </div>
                    <span className="text-4xl">✅</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Pending</p>
                      <p className="text-3xl font-bold text-black">{pendingBookings}</p>
                    </div>
                    <span className="text-4xl">⏳</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Available Slots</p>
                      <p className="text-3xl font-bold text-black">{slots.length}</p>
                    </div>
                    <span className="text-4xl">🕐</span>
                  </div>
                </div>
              </section>

              {/* Upcoming Sessions */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-black">Upcoming Sessions</h3>
                  <Link
                    href="/dashboard/teacher/bookings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>

                {upcomingBookings.length > 0 ? (
                  <div className="grid gap-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                                👤
                              </div>
                              <div>
                                <p className="font-semibold text-black">
                                  {booking.studentId?.userId?.name || 'Student'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  📅 {new Date(booking.slotId?.date).toLocaleDateString()} •{' '}
                                  {booking.slotId?.startTime} - {booking.slotId?.endTime}
                                </p>
                              </div>
                            </div>
                            {booking.doubtDescription && (
                              <p className="text-sm text-gray-600 ml-13 mt-2">
                                <span className="font-medium">Topic:</span> {booking.doubtDescription}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/session/${booking._id}`}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap ml-4"
                          >
                            Join Meet
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-600">No upcoming sessions</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your confirmed bookings will appear here
                    </p>
                  </div>
                )}
              </section>

              {/* Recent Bookings */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-black">Recent Bookings</h3>
                  <Link
                    href="/dashboard/teacher/bookings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Topic
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-black font-medium">
                            {booking.studentId?.userId?.name || 'Unknown Student'}
                          </td>
                          <td className="px-6 py-4 text-black">
                            {new Date(booking.slotId?.date).toLocaleDateString()} •{' '}
                            {booking.slotId?.startTime}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {booking.doubtDescription || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {booking.status === 'confirmed' ? (
                              <Link
                                href={`/session/${booking._id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Join
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
