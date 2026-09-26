import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useLoader } from "../../../hooks/useLoader";
import { useAuth } from "../../../app/providers/AuthContext";
import { useQuiz } from "../../../app/providers/QuizContext";
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
import Loader from "../../../components/common/Loader";

// Lazy-load QRScannerModal — html5-qrcode is a large library (~300KB) only
// needed when the user clicks "Join Classroom". Keep it out of the initial chunk.
const QRScannerModal = lazy(() => import("../../../components/common/QRScannerModal"));


const StatCard = ({ title, value, icon: Icon, themeColor }) => {
  const themes = {
    orange: {
      bg: "bg-orange-50/50 dark:bg-[#1E140E] border-orange-200/50 dark:border-[#4A2D17]",
      iconBg: "bg-gradient-to-br from-orange-400 to-orange-500",
      textValue: "text-orange-600 dark:text-orange-400",
      wave: "from-orange-500/5 via-orange-500/5 to-transparent dark:from-orange-500/10 dark:via-orange-500/5",
    },
    blue: {
      bg: "bg-blue-50/50 dark:bg-[#0E1522] border-blue-200/50 dark:border-[#182C4A]",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-500",
      textValue: "text-blue-600 dark:text-blue-400",
      wave: "from-blue-500/5 via-blue-500/5 to-transparent dark:from-blue-500/10 dark:via-blue-500/5",
    },
    purple: {
      bg: "bg-purple-50/50 dark:bg-[#161022] border-purple-200/50 dark:border-[#2C184A]",
      iconBg: "bg-gradient-to-br from-purple-400 to-purple-500",
      textValue: "text-purple-600 dark:text-purple-400",
      wave: "from-purple-500/5 via-purple-500/5 to-transparent dark:from-purple-500/10 dark:via-purple-500/5",
    },
    green: {
      bg: "bg-green-50/50 dark:bg-[#0B1812] border-green-200/50 dark:border-[#123824]",
      iconBg: "bg-gradient-to-br from-green-400 to-green-500",
      textValue: "text-green-600 dark:text-green-400",
      wave: "from-green-500/5 via-green-500/5 to-transparent dark:from-green-500/10 dark:via-green-500/5",
    }
  };

  const theme = themes[themeColor] || themes.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${theme.bg} p-3 sm:p-5 flex flex-col justify-between group min-h-[90px] sm:min-h-[120px]`}>
      
      {/* Bottom Wave Gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${theme.wave} pointer-events-none rounded-b-2xl`}></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full w-full justify-between">
        
        {/* Top Section */}
        <div className="flex justify-between items-start w-full">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${theme.iconBg} shadow-lg mb-1 shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
          </div>
          
          {/* Value */}
          <div className={`text-[28px] sm:text-4xl font-black ${theme.textValue} tracking-tight leading-none mt-1`}>{value}</div>
        </div>
        
        {/* Bottom Section */}
        <div className="flex flex-col mt-1 sm:mt-2">
          <h3 className="text-gray-900 dark:text-white font-bold text-[11px] sm:text-sm lg:text-base leading-tight line-clamp-1">{title}</h3>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useLoader(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return; // Wait until user is fully populated from AuthContext
      try {
        const historyData = await api.getQuizHistory();
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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
    return <Loader message="Loading Dashboard..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Quizzes Attempted"
              value={totalQuizzes}
              icon={BookOpen}
              themeColor="orange"
            />
            <StatCard
              title="Average Score"
              value={`${averageScore}%`}
              icon={Target}
              themeColor="blue"
            />
            <StatCard
              title="Best Score"
              value={`${Math.round(bestScore)}%`}
              icon={Trophy}
              themeColor="purple"
            />
            <StatCard
              title="Questions Solved"
              value={totalQuestionsSolved}
              icon={PlayCircle}
              themeColor="green"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick Actions */}
            <div className="lg:col-span-1 bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <h2 className="text-lg font-bold text-base-content mb-4 border-b border-base-300 pb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/categories"
                  className="flex items-center justify-between p-4 rounded-lg border border-base-300 hover:border-primary hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-all group"
                >
                  <div className="flex items-center">
                    <div className="bg-primary/20 p-2 rounded-lg text-primary mr-4">
                      <Play size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base-content group-hover:text-primary transition-colors">
                        Start New Quiz
                      </h4>
                      <p className="text-sm text-base-content/70 hidden sm:block">
                        Choose a topic and begin
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-base-content/30 group-hover:text-primary transition-colors"
                  />
                </Link>

                <Link
                  to="/history"
                  className="flex items-center justify-between p-4 rounded-lg border border-base-300 hover:border-primary hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-all group"
                >
                  <div className="flex items-center">
                    <div className="bg-primary/20 p-2 rounded-md mr-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-base-content">
                      Review History
                    </span>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-base-content/30 group-hover:text-primary transition-colors"
                  />
                </Link>

                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-base-300 hover:border-success hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-all group text-left"
                >
                  <div className="flex items-center">
                    <div className="bg-success/20 p-2 rounded-lg text-success mr-4">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base-content group-hover:text-success transition-colors">
                        Join Classroom
                      </h4>
                      <p className="text-sm text-base-content/70 hidden sm:block">
                        Scan QR to join instantly
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-base-content/30 group-hover:text-success transition-colors"
                  />
                </button>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex items-center justify-between mb-4 border-b border-base-300 pb-4">
                <h2 className="text-lg font-bold text-base-content">
                  Recent Attempts
                </h2>
                <Link
                  to="/history"
                  className="text-sm font-medium text-primary hover:text-primary"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-base-200 rounded-lg"></div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-base-content/70">
                  <p>You haven't taken any quizzes yet.</p>
                  <Link
                    to="/categories"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Take your first quiz!
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-base-300">
                    <thead>
                      <tr className="sticky top-0 z-30 bg-base-100 shadow-md border-b border-base-300">
                        <th className="sticky left-0 z-40 bg-base-100 px-3 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider min-w-[120px]">
                          Quiz
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
                          Score
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
                          Date
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-300">
                      {history.slice(0, 4).map((attempt) => (
                        <tr
                          key={attempt.id}
                          className="group hover:bg-base-200 cursor-pointer"
                        >
                          <td className="sticky left-0 z-10 bg-base-100 group-hover:bg-base-200 px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base-content capitalize">
                                {attempt.categoryId || attempt.category || 'Unknown'}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full hidden sm:inline ${attempt.difficulty === "easy"
                                  ? "bg-success/20 text-success"
                                  : attempt.difficulty === "medium"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-error/20 text-error"
                                  }`}
                              >
                                {attempt.difficulty || 'all'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span
                              className={`font-semibold ${getAccuracy(attempt) >= 70 ? "text-success" : "text-warning"}`}
                            >
                              {Math.round(getAccuracy(attempt))}%
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-base-content/70">
                            {new Date(attempt.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/quiz/${attempt._id}/review`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 group/btn"
                            >
                              Review
                              <ArrowRight className="w-3 h-3 translate-x-0 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
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

        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScan={handleScan}
          />
        </Suspense>
      </motion.div>
  );
};

export default Dashboard;
