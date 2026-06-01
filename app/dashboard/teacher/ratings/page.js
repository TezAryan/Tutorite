'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeacherRatings() {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
  });

  useEffect(() => {
    if (!session || session.user?.role !== 'teacher') {
      return;
    }
    fetchRatings();
  }, [session]);

  const fetchRatings = async () => {
    try {
      const res = await fetch('/api/ratings');
      if (res.ok) {
        const data = await res.json();
        const allRatings = data.ratings || [];
        setRatings(allRatings);

        // Calculate statistics
        if (allRatings.length > 0) {
          const avg = (allRatings.reduce((sum, r) => sum + (r.stars || 0), 0) / allRatings.length).toFixed(1);
          const starCounts = {
            5: allRatings.filter((r) => r.stars === 5).length,
            4: allRatings.filter((r) => r.stars === 4).length,
            3: allRatings.filter((r) => r.stars === 3).length,
            2: allRatings.filter((r) => r.stars === 2).length,
            1: allRatings.filter((r) => r.stars === 1).length,
          };

          setStats({
            averageRating: avg,
            totalRatings: allRatings.length,
            fiveStarCount: starCounts[5],
            fourStarCount: starCounts[4],
            threeStarCount: starCounts[3],
            twoStarCount: starCounts[2],
            oneStarCount: starCounts[1],
          });
        }
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
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

  const renderStars = (count) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < count ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

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
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-white/10"
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Student Bookings</span>
          </Link>

          <Link
            href="/dashboard/teacher/ratings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/20 text-white font-semibold border-l-4 border-blue-400"
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
          <h1 className="text-xl font-bold text-black">Student Ratings</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          {loading ? (
            <div className="text-center text-gray-500">Loading ratings...</div>
          ) : (
            <>
              {/* Rating Statistics */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Average Rating Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-4">Overall Rating</h3>
                  <div className="flex items-end gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-bold text-yellow-500">
                        {stats.averageRating}
                      </span>
                      <div className="flex gap-1 mt-2">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <p className="text-gray-600 text-sm mt-2">
                        Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-4">Rating Distribution</h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats[`${star}StarCount`] || 0;
                      const percentage =
                        stats.totalRatings > 0 ? Math.round((count / stats.totalRatings) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-4">
                          <div className="flex gap-1 w-12">
                            {renderStars(star)}
                          </div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Recent Ratings */}
              <section>
                <h3 className="text-xl font-bold text-black mb-4">Recent Reviews</h3>

                {ratings.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div
                        key={rating._id}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {rating.studentId?.userId?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-black">
                                {rating.studentId?.userId?.name || 'Student'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">{renderStars(rating.stars)}</div>
                        </div>

                        {rating.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed">"{rating.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-600">No ratings yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your student ratings will appear here
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
