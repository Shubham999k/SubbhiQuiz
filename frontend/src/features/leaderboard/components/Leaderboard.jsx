import React, { useState } from "react";
import { Trophy, Medal, Search } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock data for leaderboard
const MOCK_LEADERBOARD = [
  {
    id: 1,
    name: "Sarah Connor",
    quizzes: 45,
    average: 94,
    isCurrentUser: false,
  },
  { id: 2, name: "John Smith", quizzes: 38, average: 91, isCurrentUser: false },
  { id: 3, name: "Emily Chen", quizzes: 42, average: 89, isCurrentUser: false },
  {
    id: 4,
    name: "Demo Student",
    quizzes: 12,
    average: 85,
    isCurrentUser: true,
  }, // will match default user name
  {
    id: 5,
    name: "Michael Chang",
    quizzes: 31,
    average: 84,
    isCurrentUser: false,
  },
  {
    id: 6,
    name: "Alex Johnson",
    quizzes: 28,
    average: 82,
    isCurrentUser: false,
  },
  {
    id: 7,
    name: "Jessica Williams",
    quizzes: 25,
    average: 79,
    isCurrentUser: false,
  },
  {
    id: 8,
    name: "David Brown",
    quizzes: 22,
    average: 75,
    isCurrentUser: false,
  },
  { id: 9, name: "Emma Davis", quizzes: 19, average: 73, isCurrentUser: false },
  {
    id: 10,
    name: "James Miller",
    quizzes: 15,
    average: 68,
    isCurrentUser: false,
  },
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("weekly");

  // Update mock data to highlight actual user
  const displayData = MOCK_LEADERBOARD.map((entry) => {
    if (entry.name === "Demo Student" && user?.name) {
      return { ...entry, name: user.name, isCurrentUser: true };
    }
    return { ...entry, isCurrentUser: false };
  });

  return (
    <div className="space-y-6">
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
