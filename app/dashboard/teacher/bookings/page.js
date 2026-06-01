'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherBookings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!session || session.user?.role !== 'teacher') {
      return;
    }
    fetchBookings();
  }, [session]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  const filteredBookings =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const isAuthorized = session && session.user?.role === 'teacher';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gray-800 fixed left-0 top-0 h-full flex flex-col py-6 border-r border-gray-200 z-50">
        <div className="px-8 mb-10 flex flex-col gap-1">
          <span className="text-2xl font-bold text-white tracking-tight">Tutorite</span>
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Teacher Portal
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4">
          <Link
            href="/dashboard/teacher"
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-white/10"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/teacher/slots"
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-white/10"
          >
            <span className="text-2xl">🕐</span>
            <span className="text-sm font-medium">My Time Slots</span>
          </Link>

          <Link
            href="/dashboard/teacher/bookings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/20 text-white font-semibold border-l-4 border-blue-400"
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Student Bookings</span>
          </Link>

          <Link
            href="/dashboard/teacher/ratings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-white/10"
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
            <span className="text-white font-semibold text-sm">{session?.user?.name}</span>
            <span className="text-gray-400 text-xs">Teacher</span>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className="text-gray-300 hover:text-white transition-colors"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[280px] w-[calc(100%-280px)] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white flex justify-between items-center px-8 h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-black">Student Bookings</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-1.5 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          {loading ? (
            <div className="text-center text-gray-500">Loading bookings...</div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex gap-4 mb-6">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Bookings Table */}
              {filteredBookings.length > 0 ? (
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                                {booking.studentId?.userId?.name?.charAt(0) || '?'}
                              </div>
                              <span className="font-medium text-black">
                                {booking.studentId?.userId?.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
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
                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                            {booking.status === 'confirmed' && (
                              <Link
                                href={`/session/${booking._id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Join Meet
                              </Link>
                            )}
                            {booking.status === 'completed' && (
                              <span className="text-gray-500 text-sm">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-600">No bookings found</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
