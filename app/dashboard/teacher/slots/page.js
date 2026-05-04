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

  if (!session || session.user.role !== 'teacher') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchSlots();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">My Slots</h1>

        {/* Add Slot Form */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl border border-white border-opacity-20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Add New Slot</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </form>
        </div>

        {/* Slots List */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl border border-white border-opacity-20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Slots</h2>

          {slots.length === 0 ? (
            <p className="text-violet-200">No slots created yet. Add one above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white border-opacity-20">
                    <th className="px-6 py-3 text-white font-semibold">Date</th>
                    <th className="px-6 py-3 text-white font-semibold">Time</th>
                    <th className="px-6 py-3 text-white font-semibold">Status</th>
                    <th className="px-6 py-3 text-white font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot._id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
                      <td className="px-6 py-4 text-white">{slot.date}</td>
                      <td className="px-6 py-4 text-white">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            slot.isBooked
                              ? 'bg-red-500 bg-opacity-20 text-red-300'
                              : 'bg-green-500 bg-opacity-20 text-green-300'
                          }`}
                        >
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!slot.isBooked && (
                          <button
                            onClick={() => handleDeleteSlot(slot._id)}
                            className="px-4 py-2 bg-red-500 bg-opacity-20 text-red-300 hover:bg-opacity-30 rounded-lg transition font-semibold"
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
    </div>
  );
}
