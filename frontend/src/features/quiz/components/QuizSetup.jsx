import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useLoader } from "../../../hooks/useLoader";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../../../components/common/AnimatedPage";
import { useQuiz } from "../../../app/providers/QuizContext";
import { api } from "../../../services/api";
import { Loader2, Plus, Trash2, Save, Undo2, Redo2 } from "lucide-react";
import toast from "react-hot-toast";
import Dropdown from "../../../components/ui/Dropdown";
import Loader from "../../../components/common/Loader";

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

const QuizSetup = () => {
  const [searchParams] = useSearchParams();
  const defaultCategory = searchParams.get("category") || "python";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useLoader(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStartingClassroom, setIsStartingClassroom] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);

  // Built-in mode timer
  const [builtinTimerType, setBuiltinTimerType] = useState("overall");
  const [builtinTimeLimit, setBuiltinTimeLimit] = useState(10);

  const { setupQuiz, setupCustomQuiz } = useQuiz();
  const navigate = useNavigate();

  const location = useLocation();
  const preloadedQuiz = location.state?.customQuiz;

  const initialMode = preloadedQuiz ? "custom" : (searchParams.get("mode") === "custom" ? "custom" : "builtin");
  const [quizMode, setQuizMode] = useState(initialMode); // 'builtin' or 'custom'
  const [customQuizTitle, setCustomQuizTitle] = useState(preloadedQuiz ? preloadedQuiz.title : "");
  const [customQuizDescription, setCustomQuizDescription] = useState(preloadedQuiz ? (preloadedQuiz.description || "") : "");
  const [customQuizIcon, setCustomQuizIcon] = useState(preloadedQuiz ? (preloadedQuiz.icon || "Save") : "Save");
  
  const [timerType, setTimerType] = useState(preloadedQuiz?.timerType || "overall");
  const [timeLimit, setTimeLimit] = useState(preloadedQuiz?.timeLimit || 10);

  const [customQuestions, setCustomQuestions] = useState(() => {
    if (preloadedQuiz && preloadedQuiz.questions) {
      return preloadedQuiz.questions;
    }
    return [
      {
        id: `custom_${Date.now()}_0`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ];
  });
  const [savedQuizId, setSavedQuizId] = useState(preloadedQuiz ? preloadedQuiz._id : null);
  const [isSaving, setIsSaving] = useState(false);

  // Tracking dirty state to prevent redundant saves
  const [originalStateStr, setOriginalStateStr] = useState(
    preloadedQuiz ? JSON.stringify({
      title: preloadedQuiz.title,
      description: preloadedQuiz.description || "",
      icon: preloadedQuiz.icon || "Save",
      timerType: preloadedQuiz.timerType,
      timeLimit: preloadedQuiz.timeLimit,
      questions: preloadedQuiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    }) : null
  );

  const currentStateStr = JSON.stringify({
    title: customQuizTitle,
    description: customQuizDescription,
    icon: customQuizIcon,
    timerType,
    timeLimit,
    questions: customQuestions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }))
  });
  
  const isDirty = originalStateStr === null || currentStateStr !== originalStateStr;

  // Using react-hot-toast instead of AlertModal
  
  // Undo/Redo State
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Title validation state
  const titleInputRef = useRef(null);
  const [titleError, setTitleError] = useState("");

  const updateQuestionsHistory = (newQuestions) => {
    setUndoStack(prev => [...prev, customQuestions]);
    setRedoStack([]);
    setCustomQuestions(newQuestions);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevQuestions = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, customQuestions]);
    setCustomQuestions(prevQuestions);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextQuestions = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, customQuestions]);
    setCustomQuestions(nextQuestions);
    setRedoStack(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (quizMode !== "custom") return;
      
      // Ctrl+Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z (Redo)
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizMode, undoStack, redoStack, customQuestions]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        if (data && data.length > 0) {
          setCategories(data);
          if (!searchParams.get("category")) setSelectedCategory(data[0].id);
        } else {
          setCategories(dummyCategories);
          if (!searchParams.get("category"))
            setSelectedCategory(dummyCategories[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories(dummyCategories);
        if (!searchParams.get("category"))
          setSelectedCategory(dummyCategories[0].id);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [searchParams]);

  const handleStart = async (e, mode = "normal") => {
    e.preventDefault();
    if (mode === "classroom") {
      setIsStartingClassroom(true);
    } else {
      setIsStarting(true);
    }

    try {
      if (quizMode === "custom") {
        // Validate custom questions
        for (let i = 0; i < customQuestions.length; i++) {
          const q = customQuestions[i];
          if (
            !q.question.trim() ||
            q.options.some((opt) => !opt.trim()) ||
            !q.correctAnswer
          ) {
            toast.error(`Incomplete Question: Please complete all fields for Question ${i + 1}`);
            setIsStarting(false);
            setIsStartingClassroom(false);
            return;
          }
        }
        
        let timeLimitSeconds;
        if (timerType === "per_question") {
           timeLimitSeconds = timeLimit;
        } else {
           timeLimitSeconds = timeLimit * 60;
        }

        await setupCustomQuiz(customQuestions, timeLimitSeconds, timerType);
      } else {
        let builtinTimeLimitSeconds;
        if (builtinTimerType === "per_question") {
          builtinTimeLimitSeconds = builtinTimeLimit;
        } else {
          builtinTimeLimitSeconds = builtinTimeLimit * 60;
        }
        await setupQuiz(selectedCategory, difficulty, questionCount, builtinTimeLimitSeconds, builtinTimerType);
      }

      const categoryPath = quizMode === "custom" ? "custom" : selectedCategory;
      if (mode === "classroom") {
        const sessionId = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        navigate(`/classroom/teacher/${categoryPath}?session=${sessionId}`);
      } else {
        navigate(`/quiz/${categoryPath}`);
      }
    } catch (error) {
      console.error("Failed to start quiz:", error);
      setIsStarting(false);
      setIsStartingClassroom(false);
    }
  };

  const handleSaveCustomQuiz = async () => {
    if (!customQuizTitle.trim()) {
      toast.error("Missing Title: Please provide a Quiz Title before saving.");
      return;
    }

    // Validate custom questions & detect duplicates
    const questionTexts = new Set();
    for (let i = 0; i < customQuestions.length; i++) {
      const q = customQuestions[i];
      if (
        !q.question.trim() ||
        q.options.some((opt) => !opt.trim()) ||
        !q.correctAnswer
      ) {
        toast.error(`Incomplete Question: Please complete all fields for Question ${i + 1}`);
        return;
      }
      
      const qTextNormalized = q.question.trim().toLowerCase();
      if (questionTexts.has(qTextNormalized)) {
        toast.error(`Duplicate Question: Question ${i + 1} is identical to an earlier question.`);
        return;
      }
      questionTexts.add(qTextNormalized);
    }

    setIsSaving(true);
    try {
      const response = await api.saveCustomQuiz({
        id: savedQuizId,
        title: customQuizTitle,
        description: customQuizDescription,
        icon: customQuizIcon,
        questions: customQuestions,
        timerType: timerType,
        timeLimit: timeLimit,
      });
      if (response && response._id) {
        setSavedQuizId(response._id);
        setOriginalStateStr(currentStateStr);
      }
      toast.success("Custom Quiz Saved Successfully!");
      navigate('/practice');
    } catch (error) {
      console.error("Failed to save custom quiz:", error);
      const errMsg = error.message || "";
      if (errMsg.includes("already exists") || errMsg.includes("unique title")) {
        setTitleError(errMsg);
        if (titleInputRef.current) {
          titleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          titleInputRef.current.focus();
        }
      } else {
        toast.error(`Failed to save: ${errMsg || "Unknown error"}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomQuestion = () => {
    const newQuestions = [
      ...customQuestions,
      {
        id: `custom_${Date.now()}_${customQuestions.length}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ];
    updateQuestionsHistory(newQuestions);
  };

  const removeCustomQuestion = (index) => {
    if (customQuestions.length > 1) {
      const newQuestions = customQuestions.filter((_, i) => i !== index);
      updateQuestionsHistory(newQuestions);
    }
  };

  const updateCustomQuestion = (index, field, value, optionIndex = null) => {
    const newQuestions = customQuestions.map((q, i) => {
      if (i !== index) return q;
      const newQ = { ...q };
      if (optionIndex !== null) {
        newQ.options = [...q.options];
        const oldOptionValue = newQ.options[optionIndex];
        newQ.options[optionIndex] = value;
        // Keep correct answer in sync if they edit the text of the selected correct option
        if (newQ.correctAnswer === oldOptionValue && oldOptionValue !== "") {
          newQ.correctAnswer = value;
        }
      } else {
        newQ[field] = value;
      }
      return newQ;
    });
    updateQuestionsHistory(newQuestions);
  };

  if (loading) {
    return <Loader message="Loading Quiz Setup..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-base-content">
            Configure Your Quiz
          </h1>
        </div>

        <div className="flex w-full sm:inline-flex sm:w-auto bg-base-100 p-1 rounded-lg border border-base-300">
          <button
            className={`flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-colors whitespace-nowrap ${quizMode === "builtin"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              }`}
            onClick={() => setQuizMode("builtin")}
          >
            Built-in Categories
          </button>
          <button
            className={`flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-colors whitespace-nowrap ${quizMode === "custom"
              ? "bg-primary text-white shadow-sm"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              }`}
            onClick={() => setQuizMode("custom")}
          >
            Custom Quiz Builder
          </button>
        </div>
      </div>

      <form className="space-y-4">
        <AnimatePresence mode="wait">
          <AnimatedPage key={quizMode}>
            {quizMode === "builtin" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-base-100 p-6 md:p-8 rounded-xl border border-base-300 shadow-sm">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-base-content mb-2"
              >
                Select Topic
              </label>
              <Dropdown
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="Select a category"
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">
                Difficulty Level
              </label>
              <Dropdown
                options={[
                  { label: "All", value: "all" },
                  { label: "Easy", value: "easy" },
                  { label: "Medium", value: "medium" },
                  { label: "Hard", value: "hard" }
                ]}
                value={difficulty}
                onChange={(val) => setDifficulty(val)}
                placeholder="Select difficulty"
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">
                Number of Questions
              </label>
              <Dropdown
                options={[
                  { label: "5", value: 5 },
                  { label: "10", value: 10 },
                  { label: "15", value: 15 },
                  { label: "20", value: 20 },
                  { label: "25", value: 25 },
                  { label: "30", value: 30 }
                ]}
                value={questionCount}
                onChange={(val) => setQuestionCount(val)}
                placeholder="Select number of questions"
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">
                Timer Type
              </label>
              <Dropdown
                options={[
                  { label: "Overall Quiz Timer", value: "overall" },
                  { label: "Per Question Timer", value: "per_question" },
                ]}
                value={builtinTimerType}
                onChange={(val) => {
                  setBuiltinTimerType(val);
                  if (val === "per_question" && builtinTimeLimit === 10) setBuiltinTimeLimit(60);
                  if (val === "overall" && builtinTimeLimit === 60) setBuiltinTimeLimit(10);
                }}
                placeholder="Select timer type"
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">
                Time Limit ({builtinTimerType === "overall" ? "Minutes" : "Seconds"})
              </label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full bg-base-100 border border-base-300 px-4 py-2.5 rounded-lg font-medium text-sm text-base-content hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors shadow-sm"
                value={builtinTimeLimit}
                onChange={(e) => setBuiltinTimeLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm mb-6 relative">
              <div className="fixed bottom-24 right-8 z-[60] flex flex-col space-y-3 bg-base-100 p-2.5 rounded-2xl shadow-2xl border border-base-300 transition-all">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-3 bg-base-200 text-base-content hover:bg-base-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-3 bg-base-200 text-base-content hover:bg-base-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={24} />
                </button>
              </div>

              <label className="block text-sm font-semibold text-base-content mb-2 pr-24">
                Quiz Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                className={`w-full rounded-md bg-base-200 text-base-content py-3 px-4 focus:outline-none focus:ring-1 border transition-colors ${
                  titleError 
                    ? "border-error focus:border-error focus:ring-error" 
                    : "border-base-300 focus:border-primary focus:ring-primary"
                }`}
                value={customQuizTitle}
                onChange={(e) => {
                  setCustomQuizTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="e.g. Weekly Assessment: React Hooks"
                required
              />
              {titleError && (
                <p className="text-error text-sm mt-1 mb-5 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
                  {titleError}
                </p>
              )}
              {!titleError && <div className="mb-6"></div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Quiz Description
                  </label>
                  <textarea
                    className="w-full rounded-md bg-base-200 text-base-content py-3 px-4 focus:outline-none focus:ring-1 border border-base-300 focus:border-primary focus:ring-primary transition-colors resize-none h-24"
                    value={customQuizDescription}
                    onChange={(e) => setCustomQuizDescription(e.target.value)}
                    placeholder="Briefly describe what this quiz is about..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Quiz Icon
                  </label>
                  <Dropdown
                    options={[
                      { label: "Save (Default)", value: "Save" },
                      { label: "Python/Code File", value: "FileCode2" },
                      { label: "Java/Coffee", value: "Coffee" },
                      { label: "React/Code", value: "Code2" },
                      { label: "JavaScript/Terminal", value: "TerminalSquare" },
                      { label: "HTML/Layout", value: "Layout" },
                      { label: "CSS/Palette", value: "Palette" },
                      { label: "SQL/Database", value: "Database" },
                      { label: "DSA/Network", value: "Network" },
                      { label: "Brain", value: "Brain" },
                      { label: "Gamepad", value: "Gamepad2" }
                    ]}
                    value={customQuizIcon}
                    onChange={(val) => setCustomQuizIcon(val)}
                    placeholder="Select an icon"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Timer Type
                  </label>
                  <Dropdown
                    options={[
                      { label: "Overall Quiz Timer", value: "overall" },
                      { label: "Per Question Timer", value: "per_question" },
                    ]}
                    value={timerType}
                    onChange={(val) => {
                      setTimerType(val);
                      if (val === "per_question" && timeLimit === 10) setTimeLimit(60); // Default 60s
                      if (val === "overall" && timeLimit === 60) setTimeLimit(10); // Default 10m
                    }}
                    placeholder="Select timer type"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Time Limit ({timerType === "overall" ? "Minutes" : "Seconds"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-md border-base-300 bg-base-200 text-base-content py-2.5 px-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border transition-colors"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </div>

            {customQuestions.map((q, qIndex) => (
              <div
                key={q.id}
                className="bg-base-200 p-4 rounded-lg border border-base-300"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-base-content">
                    Question {qIndex + 1}
                  </h4>
                  {customQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomQuestion(qIndex)}
                      className="text-error hover:text-red-700 p-1"
                      title="Remove Question"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-base-content/70 mb-1">
                      Question Text
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-base-300 bg-base-100 text-base-content py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border"
                      value={q.question}
                      onChange={(e) =>
                        updateCustomQuestion(qIndex, "question", e.target.value)
                      }
                      placeholder="e.g. What is the output of 2 + 2?"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctAnswer === opt && opt.trim() !== "";
                      return (
                        <div key={optIndex}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-base-content/70">
                              Option {String.fromCharCode(65 + optIndex)}
                            </label>
                            <label className="cursor-pointer flex items-center space-x-1.5 text-xs text-base-content/70 hover:text-success transition-colors">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={isCorrect}
                                onChange={() => updateCustomQuestion(qIndex, "correctAnswer", opt)}
                                disabled={!opt.trim()}
                                className="radio radio-success radio-xs"
                              />
                              <span className={isCorrect ? "font-bold text-success" : ""}>Mark Correct</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            className={`w-full rounded-md bg-base-100 text-base-content py-2 px-3 text-sm focus:outline-none border transition-all ${
                              isCorrect
                                ? 'border-success ring-1 ring-success bg-success/5'
                                : 'border-base-300 focus:border-primary focus:ring-1 focus:ring-primary'
                            }`}
                            value={opt}
                            onChange={(e) =>
                              updateCustomQuestion(
                                qIndex,
                                "options",
                                e.target.value,
                                optIndex,
                              )
                            }
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            required
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-base-content/70 mb-1">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-base-300 bg-base-100 text-base-content py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border"
                      value={q.explanation}
                      onChange={(e) =>
                        updateCustomQuestion(
                          qIndex,
                          "explanation",
                          e.target.value,
                        )
                      }
                      placeholder="Why is this the correct answer?"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCustomQuestion}
              className="w-full py-3 border-2 border-dashed border-base-300 rounded-lg text-base-content/70 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add Another Question
            </button>
          </div>
            )}
          </AnimatedPage>
        </AnimatePresence>

        <div className="pt-6 flex flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={(e) => handleStart(e, "normal")}
            disabled={isStarting || isStartingClassroom}
            className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 transition-colors"
          >
            {isStarting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Starting...
              </>
            ) : (
              "Start Quiz Now"
            )}
          </button>

          <button
            type="button"
            onClick={(e) => handleStart(e, "classroom")}
            disabled={isStarting || isStartingClassroom}
            className="flex items-center justify-center px-6 py-2.5 border-2 border-primary rounded-lg shadow-sm text-sm font-bold text-primary bg-base-100 hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 transition-colors"
          >
            {isStartingClassroom ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" />
                Preparing Classroom...
              </>
            ) : (
              "Start Classroom Mode"
            )}
          </button>
          {quizMode === "custom" && (
            <button
              type="button"
              onClick={handleSaveCustomQuiz}
              disabled={isSaving || isStarting || isStartingClassroom || !isDirty}
              className={`flex items-center justify-center px-6 py-2.5 border border-base-300 rounded-lg shadow-sm text-sm font-bold text-base-content bg-base-100 hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-base-content" />
                  Saving...
                </>
              ) : !isDirty ? (
                "Saved"
              ) : (
                "Save Quiz"
              )}
            </button>
          )}
        </div>
      </form>


    </motion.div>
  );
};

export default QuizSetup;
