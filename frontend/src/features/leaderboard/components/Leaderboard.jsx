import React, { useState, useEffect } from "react";
import { Trophy, Medal, Search, Loader2 } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../services/api";

const Leaderboard = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("weekly");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const leaderboardData = await api.getLeaderboard(filter);
        setData(leaderboardData);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [filter]);

  // Update real data to highlight actual user
  const displayData = data.map((entry) => ({
    id: entry._id,
    name: entry.name,
    quizzes: entry.quizzes,
    average: entry.average,
    isCurrentUser: user?._id === entry._id || user?.id === entry._id,
  }));

  // Ensure displayData has at least 3 elements for the podium UI
  while (displayData.length < 3) {
    displayData.push({ id: `placeholder-${displayData.length}`, name: "-", quizzes: 0, average: 0, isCurrentUser: false });
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            See how you rank against other students.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {["daily", "weekly", "monthly"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end h-64 gap-2 sm:gap-6 mt-8 mb-12">
        {/* Rank 2 */}
        <div className="flex flex-col items-center flex-1 max-w-[120px]">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center font-bold text-xl text-gray-500 shadow-lg">
              {displayData[1].name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gray-300 rounded-full p-1 shadow">
              <Medal className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-gray-900 truncate w-full px-2">
              {displayData[1].name}
            </p>
            <p className="text-sm font-bold text-indigo-600">
              {displayData[1].average}%
            </p>
          </div>
          <div className="w-full bg-gray-200 h-24 rounded-t-lg border border-gray-300 flex items-end justify-center pb-2 shadow-inner">
            <span className="text-3xl font-black text-gray-400">2</span>
          </div>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center flex-1 max-w-[120px] -mt-10">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center font-bold text-2xl text-yellow-600 shadow-xl">
              {displayData[0].name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1 shadow">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-gray-900 truncate w-full px-2">
              {displayData[0].name}
            </p>
            <p className="text-sm font-bold text-indigo-600">
              {displayData[0].average}%
            </p>
          </div>
          <div className="w-full bg-yellow-100 h-32 rounded-t-lg border border-yellow-300 flex items-end justify-center pb-4 shadow-inner">
            <span className="text-4xl font-black text-yellow-500">1</span>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center flex-1 max-w-[120px]">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center font-bold text-xl text-orange-600 shadow-lg">
              {displayData[2].name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-orange-300 rounded-full p-1 shadow">
              <Medal className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-gray-900 truncate w-full px-2">
              {displayData[2].name}
            </p>
            <p className="text-sm font-bold text-indigo-600">
              {displayData[2].average}%
            </p>
          </div>
          <div className="w-full bg-orange-100 h-20 rounded-t-lg border border-orange-200 flex items-end justify-center pb-1 shadow-inner">
            <span className="text-2xl font-black text-orange-400">3</span>
          </div>
        </div>
      </div>

      {/* Full List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-900">Rankings</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              className="pl-9 pr-4 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {displayData.slice(3).map((student, idx) => (
            <div
              key={student.id}
              className={`flex items-center px-6 py-4 transition-colors ${
                student.isCurrentUser
                  ? "bg-indigo-50 border-l-4 border-indigo-600"
                  : "hover:bg-gray-50 border-l-4 border-transparent"
              }`}
            >
              <div className="w-8 text-center font-bold text-gray-400 mr-4">
                #{idx + 4}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 mr-4">
                {student.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-bold ${student.isCurrentUser ? "text-indigo-900" : "text-gray-900"}`}
                >
                  {student.name}{" "}
                  {student.isCurrentUser && (
                    <span className="text-xs font-normal text-indigo-600 ml-2">
                      (You)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-500">
                  {student.quizzes} Quizzes
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {student.average}%
                </div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
