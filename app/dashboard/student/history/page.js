'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function StudentHistoryPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({
    start: '',
    end: '',
  });

  if (!session || session.user.role !== 'student') {
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
        // Filter only completed and cancelled bookings
        const history = data.bookings.filter(
          (b) => b.status === 'completed' || b.status === 'cancelled'
        );
        setBookings(history);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.slotId?.date);
    const startDate = filterDateRange.start
      ? new Date(filterDateRange.start)
      : null;
    const endDate = filterDateRange.end
      ? new Date(filterDateRange.end)
      : null;

    let dateMatch = true;
    if (startDate && bookingDate < startDate) dateMatch = false;
    if (endDate && bookingDate > endDate) dateMatch = false;

    let tagMatch = true;
    if (filterTag) {
      tagMatch = booking.teacherId?.tags?.includes(filterTag);
    }

    return dateMatch && tagMatch;
  });

  const allTags = [
    ...new Set(bookings.flatMap((b) => b.teacherId?.tags || [])),
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8">My Learning History</h1>

        {/* Filters */}
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-black text-sm font-medium mb-2">
                Subject Filter
              </label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag} className="text-black">
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-black text-sm font-medium mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filterDateRange.start}
                onChange={(e) =>
                  setFilterDateRange((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-medium mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filterDateRange.end}
                onChange={(e) =>
                  setFilterDateRange((prev) => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center text-gray-600">Loading history...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center text-gray-600">No sessions found</div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Tutor</p>
                    <p className="text-black font-semibold">
                      {booking.teacherId?.userId?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Date</p>
                    <p className="text-black font-semibold">{booking.slotId?.date}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Time</p>
                    <p className="text-black font-semibold">
                      {booking.slotId?.startTime} - {booking.slotId?.endTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Rating</p>
                    <p className="text-yellow-600 font-semibold">
                      ⭐ {booking.teacherId?.averageRating?.toFixed(1) || '—'}/5
                    </p>
                  </div>
                </div>

                {booking.doubtDescription && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm mb-1">Topic</p>
                    <p className="text-black">{booking.doubtDescription}</p>
                  </div>
                )}

                {booking.teacherId?.tags && (
                  <div className="flex flex-wrap gap-2">
                    {booking.teacherId.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
