import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { api } from "../../../services/api";
import { useQuiz } from "../../../app/providers/QuizContext";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../../../components/common/AnimatedPage";
import {
  FileCode2,
  Coffee,
  Code2,
  TerminalSquare,
  Layout,
  Palette,
  Database,
  Network,
  Save,
  Edit3,
  Trash2,
  Play,
  PlayCircle,
  Users,
  X,
  PenTool
} from "lucide-react";

const iconMap = {
  FileCode2,
  Coffee,
  Code2,
  TerminalSquare,
  Layout,
  Palette,
  Database,
  Network,
};

const dummyCategories = [
  {
    id: "python",
    name: "Python",
    description: "Test your knowledge of Python.",
    icon: "FileCode2",
    quizCount: 12,
  },
  {
    id: "java",
    name: "Java",
    description: "Object-oriented programming concepts.",
    icon: "Coffee",
    quizCount: 8,
  },
  {
    id: "react",
    name: "React",
    description: "Component lifecycle, hooks, context API.",
    icon: "Code2",
    quizCount: 15,
  },
  {
    id: "javascript",
    name: "JavaScript",
    description: "ES6+, closures, async.",
    icon: "TerminalSquare",
    quizCount: 20,
  },
  {
    id: "html",
    name: "HTML",
    description: "Semantic HTML, forms, accessibility.",
    icon: "Layout",
    quizCount: 5,
  },
  {
    id: "css",
    name: "CSS",
    description: "Flexbox, Grid, animations.",
    icon: "Palette",
    quizCount: 10,
  },
  {
    id: "sql",
    name: "SQL",
    description: "Query writing, joins, indexing.",
    icon: "Database",
    quizCount: 14,
  },
  {
    id: "dsa",
    name: "DSA",
    description: "Data Structures & Algorithms.",
    icon: "Network",
    quizCount: 25,
  },
];

const dummySavedQuizzes = dummyCategories.map((cat, index) => ({
  _id: `dummy_saved_${index}`,
  title: `${cat.name} Mastery Quiz`,
  description: `A custom test covering essential ${cat.name} concepts.`,
  icon: cat.icon,
  questions: [], // Dummy doesn't have real questions
  timeLimit: 10,
  timerType: "overall"
}));

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { setupCustomQuiz } = useQuiz();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || location.state?.tab || "categories";
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsData, savedData] = await Promise.all([
          api.getCategories().catch(() => null),
          api.getSavedCustomQuizzes().catch(() => [])
        ]);
        
        if (catsData && catsData.length > 0) {
          setCategories(catsData);
        } else {
          setCategories(dummyCategories);
        }
        
        if (savedData && savedData.length > 0) {
          setSavedQuizzes(savedData);
        } else {
          setSavedQuizzes(dummySavedQuizzes);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setCategories(dummyCategories);
        setSavedQuizzes(dummySavedQuizzes);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      if (!String(quizToDelete._id).startsWith("dummy_")) {
        await api.deleteCustomQuiz(quizToDelete._id);
      }
      setSavedQuizzes(prev => prev.filter(q => q._id !== quizToDelete._id));
      setQuizToDelete(null);
      setDeleteInput("");
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-base-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-base-100 p-6 rounded-xl border border-base-300 h-48"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <div className="inline-flex bg-base-100 p-1 rounded-lg border border-base-300">
          <button
            className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === "categories"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content"
              }`}
            onClick={() => setActiveTab("categories")}
          >
            Explore
          </button>
          <button
            className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === "saved-quizzes"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content"
              }`}
            onClick={() => setActiveTab("saved-quizzes")}
          >
            Saved
          </button>
        </div>
        
        <Link
          to="/quiz/setup?mode=custom"
          className="flex items-center text-sm font-medium text-white bg-primary hover:opacity-80 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <PenTool size={16} className="mr-2" />
          Create
        </Link>
      </div>

      <AnimatePresence mode="wait">
        <AnimatedPage key={activeTab}>
          {activeTab === "categories" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || FileCode2;

            return (
              <div
                key={category.id}
                className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-base-content">
                      {category.title || category.name || "Quizzes"}
                    </h3>
                    <p className="text-xs font-medium text-primary">
                      {category.quizCount || 10} Quizzes
                    </p>
                  </div>
                </div>
                <p className="text-sm text-base-content/70 flex-grow mb-6">
                  {category.description}
                </p>
                <Link
                  to={`/quiz/setup?category=${category.id}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Start Practice
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-12 text-base-content/70">
              <Save className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 className="text-lg font-bold text-base-content mb-2">No Saved Quizzes</h3>
              <p className="max-w-sm mx-auto">You haven't built any custom quizzes yet. Head over to the Custom Quiz Builder to create and save your first quiz!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedQuizzes.map((quiz) => {
                const Icon = iconMap[quiz.icon] || Save;
                return (
                  <div
                    key={quiz._id}
                    className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col hover:shadow-md transition-shadow group relative"
                  >
                    <div className="absolute top-0 right-0 p-3 pl-8 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-base-100 via-base-100 to-transparent z-10 rounded-tr-xl">
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

                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-base-content line-clamp-1" title={quiz.title}>
                          {quiz.title}
                        </h3>
                        <p className="text-xs font-medium text-primary">
                          {quiz.questions?.length || 0} Questions
                        </p>
                      </div>
                    </div>
                    <div className="flex-grow flex flex-col mb-6">
                      <p className="text-sm text-base-content/70 line-clamp-2">
                        {quiz.description || "Custom quiz created by you."}
                      </p>
                      <p className="text-xs text-base-content/50 mt-auto pt-4 font-medium">
                        Created: {new Date(quiz.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => setQuizToStart(quiz)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      Start Practice
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          )}
        </AnimatedPage>
      </AnimatePresence>
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

export default Categories;
