import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../services/api";
import {
  PlayCircle,
  Play,
  BookOpen,
  Trophy,
  Target,
  ArrowRight,
  QrCode,
} from "lucide-react";
import QRScannerModal from "../../../components/common/QRScannerModal";

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-6 flex items-center">
    <div className={`p-4 rounded-lg ${colorClass} mr-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <h3 className="text-2xl font-bold text-text-base">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await api.getQuizHistory();
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  // Calculate stats
  const totalQuizzes = history.length;
  
  const getAccuracy = (h) => (h.total > 0 ? (h.score / h.total) * 100 : 0);

  const bestScore =
    history.length > 0 ? Math.max(...history.map(getAccuracy)) : 0;
  
  const averageScore =
    history.length > 0
      ? Math.round(
          history.reduce((acc, curr) => acc + getAccuracy(curr), 0) /
            history.length,
        )
      : 0;
      
  const totalQuestionsSolved = history.reduce(
    (acc, curr) => acc + (curr.total || 0),
    0,
  );

  const handleScan = (url) => {
    try {
      const urlObj = new URL(url);
      const sessionParam = urlObj.searchParams.get("session");
      if (sessionParam) {
        setIsScannerOpen(false);
        navigate(`/student/join?session=${sessionParam}`);
      }
    } catch (e) {
      console.log("Invalid QR code:", url, e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-base">
          Welcome back, {user?.name || "Student"}! 👋
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Quizzes Attempted"
          value={totalQuizzes}
          icon={BookOpen}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          icon={Target}
          colorClass="bg-primary-500"
        />
        <StatCard
          title="Best Score"
          value={`${Math.round(bestScore)}%`}
          icon={Trophy}
          colorClass="bg-amber-500"
        />
        <StatCard
          title="Questions Solved"
          value={totalQuestionsSolved}
          icon={PlayCircle}
          colorClass="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-6">
          <h2 className="text-lg font-bold text-text-base mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/categories"
              className="flex items-center justify-between p-4 rounded-lg border border-border-subtle hover:border-primary-500 hover:bg-bg-hover transition-all group"
            >
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-lg text-primary-600 mr-4">
                  <Play size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-text-base group-hover:text-primary-600 transition-colors">
                    Start New Quiz
                  </h4>
                  <p className="text-sm text-text-muted hidden sm:block">
                    Choose a topic and begin
                  </p>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="text-border-subtle group-hover:text-primary-600 transition-colors"
              />
            </Link>

            <Link
              to="/history"
              className="flex items-center justify-between p-4 rounded-lg border border-border-subtle hover:border-blue-500 hover:bg-bg-hover transition-all group"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-md mr-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-text-base">
                  Review History
                </span>
              </div>
              <ArrowRight
                size={20}
                className="text-border-subtle group-hover:text-blue-600 transition-colors"
              />
            </Link>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border-subtle hover:border-green-500 hover:bg-bg-hover transition-all group text-left"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg text-green-600 mr-4">
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-text-base group-hover:text-green-600 transition-colors">
                    Join Classroom
                  </h4>
                  <p className="text-sm text-text-muted hidden sm:block">
                    Scan QR to join instantly
                  </p>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="text-border-subtle group-hover:text-green-600 transition-colors"
              />
            </button>
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="lg:col-span-2 bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-base">
              Recent Attempts
            </h2>
            <Link
              to="/history"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-bg-base rounded-lg"></div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <p>You haven't taken any quizzes yet.</p>
              <Link
                to="/categories"
                className="text-primary-600 hover:underline mt-2 inline-block"
              >
                Take your first quiz!
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-subtle">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Quiz
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {history.slice(0, 4).map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="hover:bg-bg-base transition-colors"
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium text-text-base capitalize">
                            {attempt.categoryId || attempt.category || 'Unknown'}
                          </span>
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              attempt.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : attempt.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {attempt.difficulty || 'all'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${getAccuracy(attempt) >= 70 ? "text-green-600" : "text-amber-600"}`}
                        >
                          {Math.round(getAccuracy(attempt))}%
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(attempt.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/quiz/${attempt.id}/review`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
};

export default Dashboard;
