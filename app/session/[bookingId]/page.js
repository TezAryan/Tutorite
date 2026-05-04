'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SessionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const bookingId = params.bookingId;
  const [booking, setBooking] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const [roomName, setRoomName] = useState('');

  if (!session) {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);

        // Check if we can join (within 10 minutes of session start)
        const slotDate = new Date(data.booking.slotId.date);
        const [startHour, startMin] = data.booking.slotId.startTime.split(':');
        slotDate.setHours(parseInt(startHour), parseInt(startMin), 0);

        const now = new Date();
        const timeDiff = (slotDate - now) / (1000 * 60); // in minutes

        setCanJoin(timeDiff >= -10 && timeDiff <= 60); // Can join 10 minutes before or during session
        setRoomName(`tutorite-${bookingId}`);

        // Fetch or create session
        const sessionsResponse = await fetch(`/api/sessions?bookingId=${bookingId}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          if (sessionsData.sessions.length > 0) {
            setSessionData(sessionsData.sessions[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading session...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Session with {booking.teacherId?.userId?.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Session Details</h2>

              <div className="space-y-4 text-white">
                <div>
                  <p className="text-violet-300 text-sm">Date</p>
                  <p className="font-semibold">{booking.slotId?.date}</p>
                </div>

                <div>
                  <p className="text-violet-300 text-sm">Time</p>
                  <p className="font-semibold">
                    {booking.slotId?.startTime} - {booking.slotId?.endTime}
                  </p>
                </div>

                <div>
                  <p className="text-violet-300 text-sm">Status</p>
                  <p className="font-semibold">
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </p>
                </div>

                {booking.doubtDescription && (
                  <div>
                    <p className="text-violet-300 text-sm">Your Doubt</p>
                    <p className="font-semibold text-sm">{booking.doubtDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {!canJoin && (
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-xl p-6">
                <p className="text-yellow-300 font-semibold">
                  ⏰ Session hasn't started yet. You can join up to 10 minutes before the scheduled time.
                </p>
              </div>
            )}
          </div>

          {/* Video Area */}
          <div className="lg:col-span-2">
            {canJoin ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Live Session</h2>

                {sessionData ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-white border-opacity-20">
                      <iframe
                        src={`https://meet.jitsi.org/${roomName}`}
                        allow="camera; microphone; display-capture; fullscreen"
                        allowFullScreen
                        className="w-full h-full rounded-lg"
                      />
                    </div>

                    <p className="text-violet-300 text-sm text-center">
                      Room: <span className="font-mono font-semibold">{roomName}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-violet-200">Ready to join the video session?</p>

                    <button
                      onClick={handleJoinSession}
                      className="w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-lg transition"
                    >
                      🎥 Join Session
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-12 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <p className="text-white text-xl font-semibold mb-2">Session Not Yet Available</p>
                  <p className="text-violet-200">
                    This session starts on {booking.slotId?.date} at{' '}
                    {booking.slotId?.startTime}
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
