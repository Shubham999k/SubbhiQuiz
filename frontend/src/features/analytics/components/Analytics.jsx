import React, { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { motion } from "framer-motion";
import { useLoader } from "../../../hooks/useLoader";
import { Loader2, TrendingUp, Target, BookOpen, Clock } from "lucide-react";
import Loader from "../../../components/common/Loader";


const Analytics = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useLoader(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await api.getQuizHistory();
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <Loader message="Loading Analytics..." />;
  }

  const totalQuizzes = history.length;
  const totalQuestions = history.reduce(
    (acc, curr) => acc + curr.totalQuestions,
    0,
  );
  const totalCorrect = history.reduce(
    (acc, curr) => acc + curr.correctAnswers,
    0,
  );

  const overallAccuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Group by category
  const categoryStats = history.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { attempts: 0, totalScore: 0 };
    }
    acc[curr.category].attempts += 1;
    acc[curr.category].totalScore += curr.accuracy;
    return acc;
  }, {});

  const categoryAverages = Object.entries(categoryStats)
    .map(([cat, stats]) => ({
      name: cat,
      average: stats.totalScore / stats.attempts,
      attempts: stats.attempts,
    }))
    .sort((a, b) => b.average - a.average);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center">
          <div className="bg-primary/20 p-3 rounded-lg mr-4 text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-content/70">Total Quizzes</p>
            <h3 className="text-2xl font-bold text-base-content">{totalQuizzes}</h3>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center">
          <div className="bg-primary/20 p-3 rounded-lg mr-4 text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-content/70">
              Questions Attempted
            </p>
            <h3 className="text-2xl font-bold text-base-content">
              {totalQuestions}
            </h3>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center">
          <div className="bg-success/20 p-3 rounded-lg mr-4 text-success">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-content/70">
              Overall Accuracy
            </p>
            <h3 className="text-2xl font-bold text-base-content">
              {Math.round(overallAccuracy)}%
            </h3>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center">
          <div className="bg-amber-100 p-3 rounded-lg mr-4 text-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-content/70">Total Time</p>
            <h3 className="text-xl font-bold text-base-content">
              {Math.floor(history.reduce((a, c) => a + c.timeTaken, 0) / 60)}{" "}
              mins
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Performance */}
        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
          <h2 className="text-lg font-bold text-base-content mb-6">
            Performance by Category
          </h2>

          {categoryAverages.length === 0 ? (
            <p className="text-base-content/70 text-center py-4">
              Not enough data to display.
            </p>
          ) : (
            <div className="space-y-4">
              {categoryAverages.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-base-content capitalize">
                      {cat.name}
                    </span>
                    <span className="text-sm font-bold text-base-content">
                      {Math.round(cat.average)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        cat.average >= 80
                          ? "bg-success"
                          : cat.average >= 60
                            ? "bg-warning"
                            : "bg-error"
                      }`}
                      style={{ width: `${Math.round(cat.average)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trend */}
        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
          <h2 className="text-lg font-bold text-base-content mb-6">
            Recent Score Trend
          </h2>

          {history.length < 2 ? (
            <p className="text-base-content/70 text-center py-4">
              Take more quizzes to see your trend.
            </p>
          ) : (
            <div className="h-64 flex items-end justify-between space-x-2 pt-6">
              {/* CSS mock chart - taking up to last 10 quizzes chronologically */}
              {[...history]
                .reverse()
                .slice(-10)
                .map((attempt, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center flex-1 group"
                  >
                    <div className="relative flex-1 w-full flex items-end justify-center">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                        {Math.round(attempt.accuracy)}% - {attempt.category}
                      </div>
                      {/* Bar */}
                      <div
                        className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${
                          attempt.accuracy >= 70
                            ? "bg-indigo-500"
                            : "bg-indigo-300"
                        } group-hover:bg-primary`}
                        style={{ height: `${Math.max(attempt.accuracy, 5)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-base-content/50 mt-2 truncate w-full text-center">
                      Q{idx + 1}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
