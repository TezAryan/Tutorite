'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentBrowsePage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  if (!session || session.user.role !== 'student') {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots);

        // Extract unique teachers and their info
        const teacherMap = {};
        data.slots.forEach((slot) => {
          const teacher = slot.teacherId;
          if (teacher && !teacherMap[teacher._id]) {
            teacherMap[teacher._id] = teacher;
            if (teacher.tags) {
              setAllTags((prev) => [...new Set([...prev, ...teacher.tags])]);
            }
          }
        });
        setTeachers(teacherMap);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = selectedTag
    ? slots.filter((slot) => slot.teacherId.tags?.includes(selectedTag))
    : slots;

  const uniqueTeachers = Object.values(teachers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Browse Tutors</h1>
        <p className="text-violet-200 mb-8">Find and book sessions with expert tutors</p>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                !selectedTag
                  ? 'bg-violet-500 text-white'
                  : 'bg-white bg-opacity-10 text-violet-200 hover:bg-opacity-20'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  selectedTag === tag
                    ? 'bg-violet-500 text-white'
                    : 'bg-white bg-opacity-10 text-violet-200 hover:bg-opacity-20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Teachers Grid */}
        {loading ? (
          <div className="text-center text-violet-200">Loading tutors...</div>
        ) : uniqueTeachers.length === 0 ? (
          <div className="text-center text-violet-200">No tutors available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {uniqueTeachers.map((teacher) => {
              const teacherSlots = filteredSlots.filter(
                (slot) => slot.teacherId._id === teacher._id
              );

              return (
                <div
                  key={teacher._id}
                  className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 p-6 hover:border-opacity-40 transition"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{teacher.userId?.name}</h3>
                  {teacher.bio && <p className="text-violet-200 text-sm mb-4">{teacher.bio}</p>}

                  {teacher.tags && teacher.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {teacher.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs bg-violet-500 bg-opacity-30 text-violet-200 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-yellow-300 font-semibold">
                      ⭐ {teacher.averageRating.toFixed(1)}/5
                    </p>
                  </div>

                  <div className="text-sm text-violet-200 mb-4">
                    {teacherSlots.length} available slot{teacherSlots.length !== 1 ? 's' : ''}
                  </div>

                  {teacherSlots.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {teacherSlots.slice(0, 2).map((slot) => (
                        <div key={slot._id} className="text-xs bg-white bg-opacity-5 p-2 rounded">
                          <p className="text-white">{slot.date}</p>
                          <p className="text-violet-300">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      ))}
                      {teacherSlots.length > 2 && (
                        <p className="text-xs text-violet-300">
                          +{teacherSlots.length - 2} more slots
                        </p>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/dashboard/student/book?teacherId=${teacher._id}`}
                    className="block w-full py-2 px-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-lg transition text-center"
                  >
                    Book Session
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* All Available Slots List */}
        {filteredSlots.length > 0 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl border border-white border-opacity-20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Available Slots</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white border-opacity-20">
                    <th className="px-6 py-3 text-white font-semibold">Tutor</th>
                    <th className="px-6 py-3 text-white font-semibold">Date</th>
                    <th className="px-6 py-3 text-white font-semibold">Time</th>
                    <th className="px-6 py-3 text-white font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.map((slot) => (
                    <tr
                      key={slot._id}
                      className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5"
                    >
                      <td className="px-6 py-4 text-white">{slot.teacherId?.userId?.name}</td>
                      <td className="px-6 py-4 text-white">{slot.date}</td>
                      <td className="px-6 py-4 text-white">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/student/confirm-booking?slotId=${slot._id}`}
                          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition font-semibold"
                        >
                          Book
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
