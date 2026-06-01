'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BookSessionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get('teacherId');

  const [teacher, setTeacher] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doubtDescription, setDoubtDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!session) return;
    if (!teacherId) return;

    const fetchTeacherAndSlots = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch slots for this teacher
        const response = await fetch('/api/slots');
        if (!response.ok) throw new Error('Failed to fetch slots');

        const data = await response.json();
        const teacherSlots = data.slots.filter(
          (slot) => slot.teacherId._id === teacherId && !slot.isBooked
        );

        if (teacherSlots.length === 0) {
          setError('No available slots for this teacher');
          setSlots([]);
          setTeacher(null);
          return;
        }

        setSlots(teacherSlots);
        setTeacher(teacherSlots[0].teacherId);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Failed to load available slots');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherAndSlots();
  }, [session, teacherId]);

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a slot');
      return;
    }

    try {
      setBooking(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot._id,
          doubtDescription: doubtDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Booking failed');
      }

      const data = await response.json();
      setSuccess('Booking confirmed! Redirecting to your bookings...');
      
      setTimeout(() => {
        router.push('/dashboard/student/bookings');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  if (!session || session.user.role !== 'student') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-black text-xl font-semibold mb-4">Unauthorized</p>
          <Link href="/dashboard/student" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/student/browse" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Browse
        </Link>

        {loading ? (
          <div className="text-center text-gray-600 py-12">Loading available slots...</div>
        ) : error && slots.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-4">{error}</p>
            <Link href="/dashboard/student/browse" className="text-blue-600 hover:underline">
              Browse other tutors
            </Link>
          </div>
        ) : (
          <div>
            {/* Teacher Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                {teacher?.userId?.name}
              </h1>
              {teacher?.bio && <p className="text-gray-600 mb-4">{teacher.bio}</p>}
              <div className="flex items-center gap-4">
                <span className="text-yellow-500 font-semibold">
                  ⭐ {teacher?.averageRating?.toFixed(1) || '—'}/5
                </span>
                {teacher?.tags && (
                  <div className="flex flex-wrap gap-2">
                    {teacher.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Slot Selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">Select a Time Slot</h2>

              {slots.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  No available slots
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <button
                      key={slot._id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition ${
                        selectedSlot?._id === slot._id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-black">
                            {new Date(slot.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <div className={`text-sm font-semibold ${
                          selectedSlot?._id === slot._id ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {selectedSlot?._id === slot._id ? '✓ Selected' : 'Select'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Doubt Description */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-black mb-4">What's your doubt?</h2>
              <p className="text-gray-600 text-sm mb-4">
                (Optional) Tell the tutor what topic you need help with
              </p>
              <textarea
                value={doubtDescription}
                onChange={(e) => setDoubtDescription(e.target.value)}
                placeholder="e.g., Need help with quadratic equations..."
                className="w-full p-4 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={4}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleBooking}
                disabled={!selectedSlot || booking}
                className={`flex-1 py-3 px-6 font-semibold rounded-lg transition text-white ${
                  !selectedSlot || booking
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {booking ? 'Booking...' : '📅 Confirm Booking'}
              </button>
              <Link
                href="/dashboard/student/browse"
                className="flex-1 py-3 px-6 bg-gray-200 text-black font-semibold rounded-lg hover:bg-gray-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
