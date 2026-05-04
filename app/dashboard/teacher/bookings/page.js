'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function TeacherBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!session || session.user.role !== 'teacher') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Upcoming Sessions</h1>

        {loading ? (
          <div className="text-center text-violet-200">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center text-violet-200">No bookings yet</div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-violet-300 text-sm">Student</p>
                    <p className="text-white font-semibold">
                      {booking.studentId?.userId?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-violet-300 text-sm">Date</p>
                    <p className="text-white font-semibold">{booking.slotId?.date}</p>
                  </div>

                  <div>
                    <p className="text-violet-300 text-sm">Time</p>
                    <p className="text-white font-semibold">
                      {booking.slotId?.startTime} - {booking.slotId?.endTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-violet-300 text-sm">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        booking.status === 'completed'
                          ? 'bg-green-500 bg-opacity-20 text-green-300'
                          : booking.status === 'cancelled'
                          ? 'bg-red-500 bg-opacity-20 text-red-300'
                          : booking.status === 'confirmed'
                          ? 'bg-blue-500 bg-opacity-20 text-blue-300'
                          : 'bg-yellow-500 bg-opacity-20 text-yellow-300'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                {booking.doubtDescription && (
                  <div className="mb-4">
                    <p className="text-violet-300 text-sm mb-2">Doubt Description</p>
                    <p className="text-white">{booking.doubtDescription}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        className="px-4 py-2 bg-green-500 bg-opacity-20 text-green-300 hover:bg-opacity-30 rounded-lg transition font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'cancelled')}
                        className="px-4 py-2 bg-red-500 bg-opacity-20 text-red-300 hover:bg-opacity-30 rounded-lg transition font-semibold"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <>
                      <a
                        href={`/session/${booking._id}`}
                        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition font-semibold"
                      >
                        Join Session
                      </a>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'completed')}
                        className="px-4 py-2 bg-blue-500 bg-opacity-20 text-blue-300 hover:bg-opacity-30 rounded-lg transition font-semibold"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
