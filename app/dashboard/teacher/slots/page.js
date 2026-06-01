'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherSlotsPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (session && session.user.role === 'teacher') {
      fetchSlots();
    }
  }, [session]);

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots);
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
    setLoading(true);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSlots((prev) => [...prev, data.slot]);
      setFormData({ date: '', startTime: '', endTime: '' });
    } catch (err) {
      setError(err.message);
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
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete slot');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {(!session || session.user.role !== 'teacher') && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 text-red-700">
            <p className="font-bold mb-2">Unauthorized - teacher role required</p>
            <p className="text-sm mb-4">Your account role: {session?.user?.role || 'none'} | Email: {session?.user?.email || 'not logged in'}</p>
            <a href="/login" className="text-blue-600 hover:underline">Go back to login</a>
          </div>
        </div>
      )}
      {session && session.user.role === 'teacher' && (
        <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8">My Slots</h1>

        {/* Add Slot Form */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold text-black mb-6">Add New Slot</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Slots List */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-black mb-6">Your Slots</h2>

          {slots.length === 0 ? (
            <p className="text-gray-600">No slots created yet. Add one above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-black font-semibold">Date</th>
                    <th className="px-6 py-3 text-black font-semibold">Time</th>
                    <th className="px-6 py-3 text-black font-semibold">Status</th>
                    <th className="px-6 py-3 text-black font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-black">{slot.date}</td>
                      <td className="px-6 py-4 text-black">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            slot.isBooked
                              ? 'bg-red-100 text-red-700'
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
                            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition font-semibold"
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
        </div>
      </div>
      )}
    </div>
  );
}
