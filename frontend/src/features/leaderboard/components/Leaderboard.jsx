import React, { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Search, Loader2, Users, ChevronDown, Award, TrendingUp } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../services/api";
import Dropdown from "../../../components/ui/Dropdown";

const Leaderboard = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("weekly"); // "daily", "weekly", "monthly", "all_time"
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewLimit, setViewLimit] = useState(10); // 10, 50, 100, "all"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await api.getPlayedCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error("Failed to fetch played categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const leaderboardData = await api.getLeaderboard(filter, selectedCategory);
        setData(leaderboardData);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [filter, selectedCategory]);

  // Prepare base display data
  const baseData = useMemo(() => {
    const raw = Array.isArray(data) ? data.map((entry) => ({
      id: entry._id || Math.random().toString(),
      name: entry.name || "Unknown Student",
      quizzes: entry.quizzes || 0,
      average: entry.average || 0,
      avatar: entry.avatar || null,
      isCurrentUser: user?._id === entry._id || user?.id === entry._id,
    })) : [];
    // Ensure we always have at least 3 for the podium
    while (raw.length < 3) {
      raw.push({ id: `placeholder-${raw.length}`, name: "-", quizzes: 0, average: 0, isCurrentUser: false });
    }
    return raw;
  }, [data, user]);

  // Podium takes the top 3
  const podiumData = baseData.slice(0, 3);

  // Table takes the rest, filtered by search and limited by viewLimit
  const tableData = useMemo(() => {
    let rest = baseData.slice(3);

    if (searchQuery.trim()) {
      rest = rest.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (viewLimit !== "all") {
      // If viewLimit is 10, the table should show 7 items (since 3 are in podium).
      const tableLimit = viewLimit - 3;
      rest = rest.slice(0, tableLimit > 0 ? tableLimit : 0);
    }

    return rest;
  }, [baseData, searchQuery, viewLimit]);

  const totalParticipants = data.length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">

      {/* Header & Main Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-base-content tracking-tight flex items-center gap-3">
            <Trophy className="text-warning h-6 w-6" />
            Global Leaderboard
          </h1>
          <p className="text-sm text-base-content/70 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-primary">{totalParticipants}</span> students participated this period.
          </p>
        </div>

        <div className="flex bg-base-200 p-1.5 gap-2 rounded-xl border border-base-300 shadow-sm">
          {["daily", "weekly", "monthly", "all_time"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all duration-300 ${filter === f
                ? "bg-base-100 text-primary shadow-md scale-105"
                : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium (Decorated) */}
      <div className="relative pt-18 pb-8 px-4 flex justify-center items-end max-h-[6
      0vh] gap-3 sm:gap-8 bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden group">

        {loading && (
          <div className="absolute inset-0 z-50 bg-base-100/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Abstract BG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute -top-[50%] left-[20%] w-[50%] h-[150%] bg-warning/10 rounded-full blur-3xl transform -rotate-12 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[100%] bg-primary/5 rounded-full blur-3xl transform rotate-45 transition-transform duration-1000 group-hover:scale-110"></div>
        </div>

        {/* Rank 2 (Silver) */}
        <div className="flex flex-col items-center flex-1 max-w-[140px] z-10 animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-base-100 flex items-center justify-center font-bold text-2xl text-slate-500 overflow-hidden">
                {podiumData[1].avatar ? <img src={podiumData[1].avatar} alt="" className="w-full h-full object-cover" /> : podiumData[1].name.charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-slate-300 rounded-full p-2 shadow-lg ring-4 ring-base-100">
              <Medal className="w-5 h-5 text-slate-700" />
            </div>
          </div>
          <div className="text-center mb-3">
            <p className="font-extrabold text-base-content truncate w-full px-2 text-lg">
              {podiumData[1].name}
            </p>
            <p className="text-sm font-bold text-primary flex items-center justify-center gap-1">
              <TrendingUp size={14} /> {podiumData[1].average}%
            </p>
          </div>
          <div className="w-full bg-gradient-to-t from-slate-200/40 to-slate-100/10 h-32 rounded-t-2xl border-t border-l border-r border-slate-300/50 flex items-end justify-center pb-4 backdrop-blur-sm">
            <span className="text-5xl font-black text-slate-400/50">2</span>
          </div>
        </div>

        {/* Rank 1 (Gold) */}
        <div className="flex flex-col items-center flex-1 max-w-[160px] z-20 -mt-8 animate-in slide-in-from-bottom-12 duration-700">
          <div className="relative mb-4 group-hover:-translate-y-4 transition-transform duration-500">
            <div className="absolute -inset-4 bg-warning/20 rounded-full blur-xl animate-pulse"></div>
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 p-1.5 shadow-2xl relative">
              <div className="w-full h-full rounded-full bg-base-100 flex items-center justify-center font-black text-4xl text-warning overflow-hidden">
                {podiumData[0].avatar ? <img src={podiumData[0].avatar} alt="" className="w-full h-full object-cover" /> : podiumData[0].name.charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-2.5 shadow-xl ring-4 ring-base-100">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-center mb-4">
            <p className="font-black text-base-content truncate w-full px-2 text-xl">
              {podiumData[0].name}
            </p>
            <p className="text-base font-bold text-warning flex items-center justify-center gap-1">
              <Award size={16} /> {podiumData[0].average}%
            </p>
          </div>
          <div className="w-full bg-gradient-to-t from-warning/30 to-warning/5 h-44 rounded-t-2xl border-t border-l border-r border-warning/30 flex items-end justify-center pb-6 backdrop-blur-sm shadow-[0_-10px_40px_-15px_rgba(252,211,77,0.3)]">
            <span className="text-7xl font-black text-warning/40">1</span>
          </div>
        </div>

        {/* Rank 3 (Bronze) */}
        <div className="flex flex-col items-center flex-1 max-w-[140px] z-10 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-red-400 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-base-100 flex items-center justify-center font-bold text-2xl text-orange-500 overflow-hidden">
                {podiumData[2].avatar ? <img src={podiumData[2].avatar} alt="" className="w-full h-full object-cover" /> : podiumData[2].name.charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-orange-400 rounded-full p-2 shadow-lg ring-4 ring-base-100">
              <Medal className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-center mb-3">
            <p className="font-extrabold text-base-content truncate w-full px-2 text-lg">
              {podiumData[2].name}
            </p>
            <p className="text-sm font-bold text-primary flex items-center justify-center gap-1">
              <TrendingUp size={14} /> {podiumData[2].average}%
            </p>
          </div>
          <div className="w-full bg-gradient-to-t from-orange-200/30 to-orange-100/5 h-24 rounded-t-2xl border-t border-l border-r border-orange-300/40 flex items-end justify-center pb-3 backdrop-blur-sm">
            <span className="text-4xl font-black text-orange-500/40">3</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300">

        {/* Table Toolbar */}
        <div className="py-3 px-8 border-b border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-200/30 relative z-20">
          <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
            <Users className="text-primary" /> All Rankings
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">

            {/* Search */}
            <div className="relative w-full sm:w-64 group">
              <Search className="w-4 h-4 text-base-content/50 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-base-100 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-3 w-full sm:w-48">
              <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">Topic:</span>
              <Dropdown
                options={[
                  { label: "All Topics", value: "all" },
                  ...categories.map(c => ({
                    label: c.charAt(0).toUpperCase() + c.slice(1),
                    value: c
                  }))
                ]}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                className="w-full"
              />
            </div>

            {/* View Limit Selector */}
            <div className="flex items-center gap-3 w-full sm:w-48">
              <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">View:</span>
              <Dropdown
                options={[
                  { label: "Top 10", value: 10 },
                  { label: "Top 50", value: 50 },
                  { label: "Top 100", value: 100 },
                  { label: "All Students", value: "all" }
                ]}
                value={viewLimit}
                onChange={(val) => setViewLimit(val)}
                className="w-full"
              />
            </div>



          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-auto relative max-h-[78vh] scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100 rounded-b-2xl">
          {loading && (
            <div className="absolute inset-0 z-20 bg-base-100/60 backdrop-blur-sm flex items-center justify-center rounded-b-2xl">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-base-200 text-base-content/80 text-sm border-b border-base-300 sticky top-0 z-30 shadow-md">
                <th className="sticky left-0 z-40 bg-base-200 py-2 px-4 font-semibold w-16 text-center whitespace-nowrap">#</th>
                <th className="py-2 px-4 font-semibold whitespace-nowrap min-w-[160px]">Student</th>
                <th className="py-2 px-4 font-semibold text-center whitespace-nowrap hidden md:table-cell">Quizzes Taken</th>
                <th className="py-2 px-4 font-semibold text-right whitespace-nowrap">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200 relative">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-base-content/50">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                tableData.map((student, idx) => {
                  const actualRank = idx + 4; // Podium takes 1, 2, 3
                  return (
                    <tr
                      key={student.id}
                      className={`group animate-in fade-in slide-in-from-bottom-2 ${student.isCurrentUser
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-base-200"
                        }`}
                      style={{ animationFillMode: 'both', animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Rank - sticky */}
                      <td className={`sticky left-0 z-10 py-2 px-4 text-center whitespace-nowrap ${student.isCurrentUser ? "bg-primary/5 group-hover:bg-primary/10" : "bg-base-100 group-hover:bg-base-200"}`}>
                        <span className={`inline-block px-2 py-1 rounded-md text-sm font-black ${student.isCurrentUser ? "bg-primary text-white" : "text-base-content/50 bg-base-200"}`}>
                          #{actualRank}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center font-bold overflow-hidden shadow-sm ${student.isCurrentUser ? "bg-primary/20 text-primary" : "bg-base-300 text-base-content/70"}`}>
                            {student.avatar ? (
                              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${student.isCurrentUser ? "text-primary" : "text-base-content"}`}>
                                {student.name}
                              </span>
                              {student.isCurrentUser && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-base-content/50 md:hidden block">
                              {student.quizzes} Quizzes
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quizzes Taken */}
                      <td className="py-2 px-4 text-center hidden md:table-cell whitespace-nowrap">
                        <span className="font-semibold text-base-content/70">{student.quizzes}</span>
                      </td>

                      {/* Accuracy */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-black ${student.average >= 80 ? "text-success" :
                            student.average >= 50 ? "text-warning" : "text-error"
                            }`}>
                            {student.average}%
                          </span>
                          <div className="w-24 h-1.5 bg-base-300 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${student.average >= 80 ? "bg-success" :
                                student.average >= 50 ? "bg-warning" : "bg-error"
                                }`}
                              style={{ width: `${student.average}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer note if limited */}
          {viewLimit !== "all" && baseData.length > viewLimit && (
            <div className="px-4 py-2 text-center border-t border-base-300 bg-base-200/20">
              <p className="text-sm text-base-content/60">
                Showing top {viewLimit} students. Select "All Students" to see everyone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
