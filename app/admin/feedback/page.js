'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminFeedbackPage() {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  if (!session || session.user.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchFeedback();
  }, [page]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/feedback?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Student Feedback</h1>
          <a
            href="/admin"
            className="px-4 py-2 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition"
          >
            ← Back
          </a>
        </div>

        {loading ? (
          <div className="text-center text-violet-200">Loading feedback...</div>
        ) : ratings.length === 0 ? (
          <div className="text-center text-violet-200">No feedback yet</div>
        ) : (
          <>
            <div className="grid gap-6 mb-8">
              {ratings.map((rating) => (
                <div
                  key={rating._id}
                  className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-violet-300 text-sm">Student</p>
                      <p className="text-white font-semibold">
                        {rating.studentId?.userId?.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-violet-300 text-sm">Rating</p>
                      <p className="text-yellow-300 font-bold text-2xl">
                        ⭐ {rating.stars}/5
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-violet-300 text-sm mb-1">Tutor</p>
                    <p className="text-white">{rating.teacherId?.userId?.name}</p>
                  </div>

                  {rating.comment && (
                    <div className="mb-4">
                      <p className="text-violet-300 text-sm mb-1">Comment</p>
                      <p className="text-white bg-white bg-opacity-5 p-3 rounded-lg">
                        {rating.comment}
                      </p>
                    </div>
                  )}

                  <p className="text-violet-300 text-xs">
                    {new Date(rating.createdAt).toLocaleDateString()} at{' '}
                    {new Date(rating.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        page === p
                          ? 'bg-violet-500 text-white'
                          : 'border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setPage(Math.min(pagination.pages, page + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
