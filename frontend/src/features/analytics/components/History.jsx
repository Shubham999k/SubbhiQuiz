import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { BookOpen, Filter, Loader2, ArrowRight } from "lucide-react";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div className="flex gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-base-300 shadow-sm text-sm font-medium rounded-md text-base-content bg-base-100 hover:bg-base-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-base-200">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-base-200 px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider min-w-[140px]"
                  >
                    Quiz
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap"
                  >
                    Time
                  </th>
                  <th scope="col" className="relative px-6 py-3 whitespace-nowrap">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-base-100 divide-y divide-gray-200">
                {history.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-base-200 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-base-100 hover:bg-base-200 px-6 py-4 whitespace-nowrap transition-colors">
                      <div>
                        <div className="text-sm font-bold text-base-content capitalize">
                          {attempt.category}
                        </div>
                        <div className="text-xs text-base-content/70 capitalize">
                          {attempt.difficulty} • {attempt.totalQuestions} Qs
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mr-2 ${
                            attempt.accuracy >= 70
                              ? "bg-success"
                              : "bg-warning"
                          }`}
                        ></div>
                        <div className="text-sm font-medium text-base-content">
                          {Math.round(attempt.accuracy)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                      {new Date(attempt.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                      {formatTime(attempt.timeTaken)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/quiz/${attempt._id || attempt.id}/review`}
                        className="text-primary hover:opacity-80 inline-flex items-center"
                      >
                        Review <ArrowRight className="ml-1 w-4 h-4" />
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
