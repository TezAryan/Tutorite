'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import VideoCall from '@/app/components/VideoCall';

export default function SessionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const bookingId = params.bookingId;
  const [booking, setBooking] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const [roomName, setRoomName] = useState('');

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
        setRoomName(`tutorite-${bookingId}`);

        // Allow joining if booking is pending or confirmed
        if (data.booking.status === 'confirmed' || data.booking.status === 'pending') {
          setCanJoin(true);
          
          // Auto-create/fetch session
          try {
            const sessionsResponse = await fetch(`/api/sessions?bookingId=${bookingId}`);
            if (sessionsResponse.ok) {
              const sessionsData = await sessionsResponse.json();
              if (sessionsData.sessions.length > 0) {
                setSessionData(sessionsData.sessions[0]);
              } else {
                // Auto-create session if doesn't exist
                const createResponse = await fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bookingId }),
                });
                if (createResponse.ok) {
                  const newSessionData = await createResponse.json();
                  setSessionData(newSessionData.session);
                }
              }
            }
          } catch (sessErr) {
            console.error('Error with session:', sessErr);
          }
        } else {
          setCanJoin(false);
        }
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && bookingId) {
      fetchBooking();
    }
  }, [bookingId, session]);

  const handleJoinSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionData(data.session);
      }
    } catch (err) {
      console.error('Error joining session:', err);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Unauthorized</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Loading session...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8">
          Session with {booking.teacherId?.userId?.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-black mb-4">Session Details</h2>

              <div className="space-y-4 text-black">
                <div>
                  <p className="text-gray-600 text-sm">Date</p>
                  <p className="font-semibold">{booking.slotId?.date}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Time</p>
                  <p className="font-semibold">
                    {booking.slotId?.startTime} - {booking.slotId?.endTime}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="font-semibold">
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </p>
                </div>

                {booking.doubtDescription && (
                  <div>
                    <p className="text-gray-600 text-sm">Your Doubt</p>
                    <p className="font-semibold text-sm">{booking.doubtDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {!canJoin && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-yellow-800 font-semibold">
                  ⏰ Session Status: <span className="capitalize">{booking.status}</span>
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  You can join once the booking is confirmed by the tutor.
                </p>
              </div>
            )}
          </div>

          {/* Video Area */}
          <div className="lg:col-span-2">
            {canJoin ? (
              sessionData ? (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">🎥 Live Video Session</h2>
                  <VideoCall bookingId={bookingId} remoteRole={session?.user?.role === 'teacher' ? 'student' : 'teacher'} />
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                  <p className="text-blue-800 font-semibold mb-4">Loading video session...</p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 shadow-md flex items-center justify-center min-h-96">
                <div className="text-center">
                  <p className="text-black text-xl font-semibold mb-2">Session Not Available Yet</p>
                  <p className="text-gray-600 mb-4">
                    This session starts on {booking.slotId?.date} at{' '}
                    {booking.slotId?.startTime}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Status: <span className="font-semibold capitalize">{booking.status}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
