'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!session || session.user.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <div className="text-right">
            <p className="text-violet-300 text-sm">Logged in as</p>
            <p className="text-white font-semibold">{session.user.name}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <p className="text-violet-300 text-sm mb-2">Total Sessions</p>
            <p className="text-4xl font-bold text-white">
              {stats?.totalSessions || 0}
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <p className="text-violet-300 text-sm mb-2">Sessions This Week</p>
            <p className="text-4xl font-bold text-green-300">
              {stats?.sessionsThisWeek || 0}
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <p className="text-violet-300 text-sm mb-2">Avg Platform Rating</p>
            <p className="text-4xl font-bold text-yellow-300">
              ⭐ {stats?.averageRating || 0}
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <p className="text-violet-300 text-sm mb-2">Active Teachers</p>
            <p className="text-4xl font-bold text-blue-300">
              {stats?.totalTeachers || 0}
            </p>
          </div>
        </div>

        {/* Top Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Most Booked Subjects
            </h2>

            <div className="space-y-4">
              {stats?.mostBookedSubjects?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <p className="text-white">{item.subject}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-white bg-opacity-10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-violet-600"
                        style={{
                          width: `${Math.min(
                            (item.count /
                              (stats.mostBookedSubjects[0]?.count || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-violet-300 font-semibold text-sm">
                      {item.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>

            <div className="space-y-3">
              <a
                href="/admin/teachers"
                className="block w-full px-4 py-3 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-lg transition text-center"
              >
                👥 Manage Teachers
              </a>

              <a
                href="/admin/feedback"
                className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition text-center"
              >
                ⭐ View Feedback
              </a>

              <a
                href="/"
                className="block w-full px-4 py-3 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 font-semibold rounded-lg transition text-center"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Platform Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div>
              <p className="text-violet-300 text-sm mb-1">Total Bookings</p>
              <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
            </div>

            <div>
              <p className="text-violet-300 text-sm mb-1">Active Teachers</p>
              <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
            </div>

            <div>
              <p className="text-violet-300 text-sm mb-1">This Week</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  ((stats?.sessionsThisWeek || 0) /
                    (stats?.totalSessions || 1)) *
                    100
                )}
                %
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
