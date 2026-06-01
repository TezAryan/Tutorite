'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherSlots() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!session || session.user?.role !== 'teacher') {
      return;
    }
    fetchSlots();
  }, [session]);

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add slot');
      }

      setSlots((prev) => [...prev, data.slot]);
      setFormData({ date: '', startTime: '', endTime: '' });
      setSuccess('Slot added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error adding slot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSlots((prev) => prev.filter((slot) => slot._id !== slotId));
        setSuccess('Slot deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete slot');
      }
    } catch (err) {
      setError('Failed to delete slot');
    }
  };

  const isAuthorized = session && session.user?.role === 'teacher';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => !s.isBooked).length;
  const bookedSlots = slots.filter((s) => s.isBooked).length;

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
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/20 text-white font-semibold border-l-4 border-blue-400"
          >
            <span className="text-2xl">🕐</span>
            <span className="text-sm font-medium">My Time Slots</span>
          </Link>

          <Link
            href="/dashboard/teacher/bookings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-white/10"
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
          <h1 className="text-xl font-bold text-black">My Time Slots</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Slots</p>
                  <p className="text-3xl font-bold text-black">{slots.length}</p>
                </div>
                <span className="text-4xl">🕐</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Available</p>
                  <p className="text-3xl font-bold text-green-600">{availableSlots}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Booked</p>
                  <p className="text-3xl font-bold text-blue-600">{bookedSlots}</p>
                </div>
                <span className="text-4xl">📅</span>
              </div>
            </div>
          </div>

          {/* Add Slot Form */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Add New Slot</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                  >
                    {loading ? 'Adding...' : 'Add Slot'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Slots Table */}
          <section>
            <h2 className="text-xl font-bold text-black mb-4">Your Slots</h2>
            {slots.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-600">No slots created yet</p>
                <p className="text-sm text-gray-500 mt-2">Add one above to get started!</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Time
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
                    {slots.map((slot) => (
                      <tr key={slot._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-black font-medium">
                          {new Date(slot.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              slot.isBooked
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!slot.isBooked && (
                            <button
                              onClick={() => handleDeleteSlot(slot._id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
