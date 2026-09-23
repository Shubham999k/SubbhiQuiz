import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
  Save,
  PenTool,
  Edit3,
  Trash2,
  X,
  Users,
} from "lucide-react";
import QRScannerModal from "../../../components/common/QRScannerModal";

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex items-center">
    <div className={`p-4 rounded-lg ${colorClass} mr-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-base-content/70">{title}</p>
      <h3 className="text-2xl font-bold text-base-content">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { setupCustomQuiz } = useQuiz();
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || location.state?.tab || "overview";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  
  // Start modal state
  const [quizToStart, setQuizToStart] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStartingClassroom, setIsStartingClassroom] = useState(false);
  
  // Delete modal state
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartQuiz = async (quiz, mode) => {
    if (mode === "classroom") {
      setIsStartingClassroom(true);
    } else {
      setIsStarting(true);
    }

    try {
      let timeLimitSeconds = quiz.timeLimit || 10;
      if (quiz.timerType !== "per_question") {
        timeLimitSeconds = timeLimitSeconds * 60;
      }
      
      setupCustomQuiz(quiz.questions, timeLimitSeconds, quiz.timerType || "overall", quiz.title || "Custom Quiz");
      
      if (mode === "classroom") {
        const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/classroom/teacher/custom?session=${sessionId}`);
      } else {
        navigate(`/quiz/custom`);
      }
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setIsStarting(false);
      setIsStartingClassroom(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (deleteInput.toLowerCase() !== "delete") return;
    setIsDeleting(true);
    try {
      await api.deleteCustomQuiz(quizToDelete._id);
      setSavedQuizzes(prev => prev.filter(q => q._id !== quizToDelete._id));
      setQuizToDelete(null);
      setDeleteInput("");
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, savedData] = await Promise.all([
          api.getQuizHistory(),
          api.getSavedCustomQuizzes()
        ]);
        setHistory(historyData);
        setSavedQuizzes(savedData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  let activeSession = null;
  try {
    const data = localStorage.getItem("active_teacher_session");
    if (data) activeSession = JSON.parse(data);
  } catch (e) {
    // ignore
  }

  return (
    <div className="space-y-6">
      {activeSession && (
        <div className="bg-primary/10 border border-primary rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-lg text-white">
              <Play size={24} />
            </div>
            <div>
              <h3 className="font-bold text-primary text-lg">Active Session Running</h3>
              <p className="text-sm text-primary/80">You have an ongoing classroom session.</p>
            </div>
          </div>
          <Link
            to={`/classroom/teacher/${activeSession.quizId}?session=${activeSession.sessionCode}`}
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-colors shadow-sm"
          >
            Resume Session
          </Link>
        </div>
      )}

      <div className="flex justify-between gap-2">

        <div className="inline-flex bg-base-100 p-1 rounded-lg border border-base-300">
          <button
            className={`px-2 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "overview"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content"
              }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-2 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "saved-quizzes"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content"
              }`}
            onClick={() => setActiveTab("saved-quizzes")}
          >
            Saved Quizzes
          </button>
        </div>
        <Link
          to="/quiz/setup?mode=custom"
          className="flex items-center text-sm font-medium text-white bg-primary hover:opacity-80 px-4 py-2 rounded-lg transition-colors"
        >
          <PenTool size={16} className="mr-2" />
          Build New
        </Link>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Quizzes Attempted"
              value={totalQuizzes}
              icon={BookOpen}
              colorClass="bg-primary"
            />
            <StatCard
              title="Average Score"
              value={`${averageScore}%`}
              icon={Target}
              colorClass="bg-secondary"
            />
            <StatCard
              title="Best Score"
              value={`${Math.round(bestScore)}%`}
              icon={Trophy}
              colorClass="bg-warning"
            />
            <StatCard
              title="Questions Solved"
              value={totalQuestionsSolved}
              icon={PlayCircle}
              colorClass="bg-success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </>
      ) : (
        <div className="h-[calc(100vh-170px)] overflow-y-auto scrollbar-none">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-12 text-base-content/70">
              <Save className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 className="text-lg font-bold text-base-content mb-2">No Saved Quizzes</h3>
              <p className="max-w-sm mx-auto">You haven't built any custom quizzes yet. Head over to the Custom Quiz Builder to create and save your first quiz!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedQuizzes.map((quiz) => (
                <div key={quiz._id} className="bg-base-200 border border-base-300/50 rounded-xl p-4 hover:border-primary transition-colors group relative flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-3 pl-8 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-base-200 via-base-200 to-transparent z-10 rounded-tr-xl">
                    <button
                      onClick={() => navigate('/quiz/setup', { state: { customQuiz: quiz } })}
                      className="p-1.5 bg-base-100 text-primary hover:bg-primary hover:text-white rounded-md shadow-sm transition-colors"
                      title="Edit Quiz"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setQuizToDelete(quiz);
                        setDeleteInput("");
                      }}
                      className="p-1.5 bg-base-100 text-error hover:bg-error hover:text-white rounded-md shadow-sm transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="overflow-hidden relative z-0">
                    <h3 className={`font-bold text-lg text-base-content mb-2 group-hover:text-primary transition-colors ${quiz.title.length > 25 ? 'animate-marquee whitespace-nowrap' : 'line-clamp-2'}`} title={quiz.title}>
                      {quiz.title}
                    </h3>
                  </div>
                  
                  <div className="flex-grow">
                    <p className="text-sm text-base-content/70 mb-4">
                      {quiz.questions?.length || 0} Questions • Created {new Date(quiz.date).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setQuizToStart(quiz)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-content hover:opacity-90 py-2 rounded-lg font-semibold transition-colors mt-auto"
                  >
                    <Play size={16} /> Load Quiz
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Start Quiz Modal */}
      {quizToStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-base-300 transform transition-all">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-base-content mb-1">
                      Ready to begin?
                    </h3>
                    <p className="text-sm text-base-content/70 line-clamp-1" title={quizToStart.title}>
                      {quizToStart.title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setQuizToStart(null)}
                  className="text-base-content/50 hover:text-base-content bg-base-200 hover:bg-base-300 rounded-full p-1.5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-base-200 rounded-xl p-4 mb-6 border border-base-300 flex justify-between items-center">
                 <div className="text-center flex-1">
                    <p className="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Questions</p>
                    <p className="font-bold text-base-content text-lg">{quizToStart.questions?.length || 0}</p>
                 </div>
                 <div className="w-px h-8 bg-base-300"></div>
                 <div className="text-center flex-1">
                    <p className="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Timer</p>
                    <p className="font-bold text-base-content text-lg capitalize">{quizToStart.timerType?.replace('_', ' ') || 'Overall'}</p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleStartQuiz(quizToStart, "normal")}
                  disabled={isStarting || isStartingClassroom}
                  className="flex-1 flex flex-col items-center justify-center p-4 border border-transparent rounded-xl shadow-sm text-center text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 group"
                >
                  {isStarting ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></span>
                  ) : (
                    <PlayCircle className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-sm">Quiz Now</span>
                </button>
                
                <button
                  onClick={() => handleStartQuiz(quizToStart, "classroom")}
                  disabled={isStarting || isStartingClassroom}
                  className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-primary rounded-xl shadow-sm text-center text-primary bg-base-100 hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 group"
                >
                  {isStartingClassroom ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></span>
                  ) : (
                    <Users className="w-6 h-6 mb-2 text-primary/90 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-sm">Classroom Mode</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-base-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-base-content flex items-center text-error">
                  <Trash2 className="mr-2" size={24} /> Delete Quiz
                </h3>
                <button 
                  onClick={() => setQuizToDelete(null)}
                  className="text-base-content/50 hover:text-base-content bg-base-200 hover:bg-base-300 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-base-content/70 mb-4">
                Are you sure you want to delete <span className="font-bold text-base-content">"{quizToDelete.title}"</span>? This action cannot be undone.
              </p>

              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-error mb-2">
                  Please type <span className="font-bold select-all bg-error/20 px-1 py-0.5 rounded">delete</span> to confirm.
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deleteInput.toLowerCase() === "delete" && !isDeleting) {
                      e.preventDefault();
                      handleDeleteQuiz();
                    }
                  }}
                  placeholder="Type 'delete' here..."
                  className="w-full rounded-md border-error/30 bg-base-100 text-base-content py-2 px-3 focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setQuizToDelete(null)}
                  className="px-4 py-2 border border-base-300 rounded-lg text-base-content hover:bg-base-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuiz}
                  disabled={deleteInput.toLowerCase() !== "delete" || isDeleting}
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  ) : null}
                  Delete Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
