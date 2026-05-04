'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminTeachersPage() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  if (!session || session.user.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTeacher = async (teacherId, currentStatus) => {
    setUpdating((prev) => ({ ...prev, [teacherId]: true }));

    try {
      const response = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          isEnabled: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchTeachers();
      }
    } catch (err) {
      console.error('Error updating teacher:', err);
    } finally {
      setUpdating((prev) => ({ ...prev, [teacherId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Teacher Management</h1>
          <a
            href="/admin"
            className="px-4 py-2 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition"
          >
            ← Back
          </a>
        </div>

        {loading ? (
          <div className="text-center text-violet-200">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="text-center text-violet-200">No teachers found</div>
        ) : (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl border border-white border-opacity-20 p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white border-opacity-20">
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Specializations
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-white font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher._id}
                    className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5"
                  >
                    <td className="px-6 py-4 text-white font-semibold">
                      {teacher.name}
                    </td>
                    <td className="px-6 py-4 text-white">{teacher.email}</td>
                    <td className="px-6 py-4 text-white">
                      <div className="flex flex-wrap gap-1">
                        {teacher.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-violet-500 bg-opacity-30 text-violet-200 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {teacher.tags?.length > 2 && (
                          <span className="text-xs text-violet-300">
                            +{teacher.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {teacher.sessionCount}
                    </td>
                    <td className="px-6 py-4 text-yellow-300 font-semibold">
                      ⭐ {teacher.averageRating.toFixed(1)}/5
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          teacher.isEnabled
                            ? 'bg-green-500 bg-opacity-20 text-green-300'
                            : 'bg-red-500 bg-opacity-20 text-red-300'
                        }`}
                      >
                        {teacher.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleToggleTeacher(
                            teacher._id,
                            teacher.isEnabled
                          )
                        }
                        disabled={updating[teacher._id]}
                        className={`px-4 py-2 rounded-lg transition font-semibold ${
                          teacher.isEnabled
                            ? 'bg-red-500 bg-opacity-20 text-red-300 hover:bg-opacity-30'
                            : 'bg-green-500 bg-opacity-20 text-green-300 hover:bg-opacity-30'
                        } disabled:opacity-50`}
                      >
                        {updating[teacher._id]
                          ? 'Updating...'
                          : teacher.isEnabled
                          ? 'Disable'
                          : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
