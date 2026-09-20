import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { BookOpen, Filter, Loader2, ArrowRight } from "lucide-react";
import Dropdown from "../../../components/ui/Dropdown";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all_time");
  const [viewLimit, setViewLimit] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await api.getQuizHistory();
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (filter !== "all_time") {
      const now = new Date();
      filtered = history.filter((attempt) => {
        const attemptDate = new Date(attempt.date);
        const diffTime = Math.abs(now - attemptDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filter === "daily") return diffDays <= 1;
        if (filter === "weekly") return diffDays <= 7;
        if (filter === "monthly") return diffDays <= 30;
        return true;
      });
    }

    if (viewLimit !== "all") {
      filtered = filtered.slice(0, parseInt(viewLimit, 10));
    }

    return filtered;
  }, [history, filter, viewLimit]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-base-content">Quiz History</h1>
          <p className="text-sm text-base-content/70">
            Review your past performance and track progress.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">


          {/* Time Filters */}
          <div className="flex bg-base-200 p-1.5 gap-2 rounded-xl border border-base-300 shadow-sm overflow-x-auto w-full sm:w-auto">
            {["daily", "weekly", "monthly", "all_time"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 sm:px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all duration-300 whitespace-nowrap ${filter === f
                  ? "bg-base-100 text-primary shadow-md scale-105"
                  : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                  }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
          {/* View Limit Selector */}
          <div className="flex items-center gap-2 w-full sm:w-40">
            <span className="text-sm font-medium text-base-content/70 whitespace-nowrap border-l border-base-300 pl-4">View:</span>
            <Dropdown
              options={[
                { label: "Top 10", value: 10 },
                { label: "Top 50", value: 50 },
                { label: "Top 100", value: 100 },
                { label: "All", value: "all" }
              ]}
              value={viewLimit}
              onChange={(val) => setViewLimit(val)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-xl shadow-sm border border-base-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No history found
          </h3>
          <p className="text-base-content/70 mb-6">
            You haven't completed any quizzes yet.
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:opacity-80"
          >
            Start your first quiz
          </Link>
        </div>
      ) : (
        <div className="bg-base-100 shadow-sm rounded-xl border border-base-300 overflow-hidden">
          <div className="overflow-auto relative h-[70vh] scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-base-200/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 top-0 z-30 bg-base-200/95 backdrop-blur-sm px-6 py-4 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider min-w-[140px]"
                  >
                    Quiz
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Time
                  </th>
                  <th scope="col" className="relative px-6 py-4 whitespace-nowrap">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-base-100">
                {filteredHistory.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="group hover:bg-base-200/70 transition-colors cursor-pointer border-b border-base-300"
                  >
                    <td className="sticky left-0 z-10 bg-base-100 group-hover:bg-base-200/70 px-6 py-5 whitespace-nowrap transition-colors">
                      <div>
                        <div className="text-sm font-bold text-base-content capitalize">
                          {attempt.category}
                        </div>
                        <div className="text-xs text-base-content/70 capitalize">
                          {attempt.difficulty} • {attempt.totalQuestions} Qs
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mr-2 ${attempt.accuracy >= 70
                              ? "bg-success"
                              : "bg-warning"
                            }`}
                        ></div>
                        <div className="text-sm font-medium text-base-content">
                          {Math.round(attempt.accuracy)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-base-content/70">
                      {new Date(attempt.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-base-content/70">
                      {formatTime(attempt.timeTaken)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/quiz/${attempt._id || attempt.id}/review`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 group/btn"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
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
  );
};

export default History;
