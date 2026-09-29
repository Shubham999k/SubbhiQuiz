import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLoader } from "../../../hooks/useLoader";
import { api } from "../../../services/api";
import { BookOpen, Filter, Loader2, ArrowRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Dropdown from "../../../components/ui/Dropdown";
import Loader from "../../../components/common/Loader";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useLoader(true);
  const [filter, setFilter] = useState("all_time");
  const [viewLimit, setViewLimit] = useState("all");
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await api.getQuizHistory();
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && deleteModalData) {
        setDeleteModalData(null);
        setDeleteConfirmText("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModalData]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      await api.clearHistory(filter);
      const data = await api.getQuizHistory();
      setHistory(data);
      setDeleteModalData(null);
      setDeleteConfirmText("");
      toast.success(`${filter.replace("_", " ")} history cleared successfully!`);
    } catch (error) {
      toast.error(error.message || "Failed to clear history");
    } finally {
      setIsClearing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    if (deleteModalData?.type === "clear") {
      await handleClearHistory();
    } else if (deleteModalData?.type === "attempt") {
      await performDeleteAttempt(deleteModalData.id);
    }
  };

  const performDeleteAttempt = async (id) => {
    try {
      setIsClearing(true);
      await api.deleteHistoryItem(id);
      setHistory(prev => prev.filter(a => (a._id || a.id) !== id));
      setDeleteModalData(null);
      setDeleteConfirmText("");
      toast.success("Attempt deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete attempt");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAttempt = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModalData({ type: "attempt", id });
    setDeleteConfirmText("");
  };

  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (filter !== "all_time") {
      const now = new Date();
      filtered = history.filter((attempt) => {
        const attemptDate = new Date(attempt.createdAt || attempt.date);
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
    return <Loader message="Loading History..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
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
        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">View:</span>
          <div className="w-32">
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
          {history.length > 0 && (
            <button
              onClick={() => {
                setDeleteModalData({ type: "clear" });
                setDeleteConfirmText("");
              }}
              className="px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-white transition-all font-bold flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 size={16} />
              Clear {filter.replace("_", " ")}
            </button>
          )}
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
              <thead className="bg-base-200 sticky top-0 z-30 shadow-md">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 top-0 z-40 bg-base-200 px-6 py-4 text-left text-xs font-bold text-base-content/70 uppercase tracking-wider min-w-[140px]"
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
                    className="group hover:bg-base-200 cursor-pointer border-b border-base-300"
                  >
                    <td className="sticky left-0 z-10 bg-base-100 group-hover:bg-base-200 px-6 py-5 whitespace-nowrap">
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
                      {new Date(attempt.createdAt || attempt.date).toLocaleDateString(undefined, {
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
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/quiz/${attempt._id || attempt.id}/review`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 group/btn"
                        >
                          Review
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteAttempt(e, attempt._id || attempt.id)}
                          className="p-1.5 rounded-lg text-error/70 hover:bg-error/10 hover:text-error transition-colors"
                          title="Delete Attempt"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-base-300">
            <h3 className="text-lg font-bold text-base-content mb-2">
              {deleteModalData.type === "clear" ? `Clear ${filter.replace("_", " ")} History?` : "Delete Attempt?"}
            </h3>
            <p className="text-base-content/70 mb-4 text-sm">
              {deleteModalData.type === "clear"
                ? `Are you sure you want to clear your ${filter.replace("_", " ")} quiz history?`
                : "Are you sure you want to delete this specific attempt?"}{" "}
              This action cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Type <span className="font-bold text-error">Delete</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteConfirmText.toLowerCase() === "delete" && !isClearing) {
                    handleConfirmDelete();
                  }
                }}
                placeholder="Delete"
                className="w-full px-3 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-error bg-base-200"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalData(null);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 rounded-lg font-medium bg-base-200 text-base-content hover:bg-base-300"
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg font-medium bg-error text-white hover:bg-red-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isClearing || deleteConfirmText.toLowerCase() !== "delete"}
              >
                {isClearing && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default History;
