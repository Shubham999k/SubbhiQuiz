import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useLoader } from "../../../hooks/useLoader";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedPage } from "../../../components/common/AnimatedPage";
import { useQuiz } from "../../../app/providers/QuizContext";
import { api } from "../../../services/api";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import Dropdown from "../../../components/ui/Dropdown";
import Loader from "../../../components/common/Loader";
import CreateQuizTabs from "./CreateQuizTabs";
import BuiltInCategories from "./BuiltInCategories";
import CustomQuizBuilder from "./CustomQuizBuilder";
import JsonQuestionImporter from "./JsonQuestionImporter";

const dummyCategories = [
  { id: "python", name: "Python", description: "Test your knowledge of Python.", icon: "FileCode2", quizCount: 12 },
  { id: "java", name: "Java", description: "Object-oriented programming concepts.", icon: "Coffee", quizCount: 8 },
  { id: "react", name: "React", description: "Component lifecycle, hooks, context API.", icon: "Code2", quizCount: 15 },
  { id: "javascript", name: "JavaScript", description: "ES6+, closures, async.", icon: "TerminalSquare", quizCount: 20 },
  { id: "html", name: "HTML", description: "Semantic HTML, forms, accessibility.", icon: "Layout", quizCount: 5 },
  { id: "css", name: "CSS", description: "Flexbox, Grid, animations.", icon: "Palette", quizCount: 10 },
  { id: "sql", name: "SQL", description: "Query writing, joins, indexing.", icon: "Database", quizCount: 14 },
  { id: "dsa", name: "DSA", description: "Data Structures & Algorithms.", icon: "Network", quizCount: 25 },
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

  const { setupQuiz, setupCustomQuiz } = useQuiz();
  const navigate = useNavigate();

  const location = useLocation();
  const preloadedQuiz = location.state?.customQuiz;

  const initialMode = preloadedQuiz ? "custom" : (searchParams.get("mode") === "custom" ? "custom" : "builtin");
  const [quizMode, setQuizMode] = useState(initialMode); // 'builtin', 'custom', or 'json'

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
  
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
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
          if (!searchParams.get("category")) setSelectedCategory(dummyCategories[0].id);
        }
      } catch (err) {
        setCategories(dummyCategories);
        if (!searchParams.get("category")) setSelectedCategory(dummyCategories[0].id);
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
      if (quizMode === "custom" || quizMode === "json") {
        for (let i = 0; i < customQuestions.length; i++) {
          const q = customQuestions[i];
          if (!q.question.trim() || q.options.some((opt) => !opt.trim()) || !q.correctAnswer) {
            toast.error(`Incomplete Question: Please complete all fields for Question ${i + 1}`);
            setIsStarting(false);
            setIsStartingClassroom(false);
            return;
          }
        }
        
        let timeLimitSeconds = timerType === "per_question" ? timeLimit : timeLimit * 60;
        await setupCustomQuiz(customQuestions, timeLimitSeconds, timerType, customQuizTitle || "Custom Quiz");
      } else {
        let timeLimitSeconds = timerType === "per_question" ? timeLimit : timeLimit * 60;
        await setupQuiz(selectedCategory, difficulty, questionCount, timeLimitSeconds, timerType);
      }

      const categoryPath = (quizMode === "custom" || quizMode === "json") ? "custom" : selectedCategory;
      if (mode === "classroom") {
        const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/classroom/teacher/${categoryPath}?session=${sessionId}`);
      } else {
        navigate(`/quiz/${categoryPath}`);
      }
    } catch (error) {
      setIsStarting(false);
      setIsStartingClassroom(false);
    }
  };

  const handleSaveCustomQuiz = async () => {
    if (!customQuizTitle.trim()) {
      toast.error("Missing Title: Please provide a Quiz Title before saving.");
      return;
    }

    const questionTexts = new Set();
    for (let i = 0; i < customQuestions.length; i++) {
      const q = customQuestions[i];
      if (!q.question.trim() || q.options.some((opt) => !opt.trim()) || !q.correctAnswer) {
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
        timerType,
        timeLimit,
      });
      if (response && response._id) {
        setSavedQuizId(response._id);
        setOriginalStateStr(currentStateStr);
      }
      toast.success("Custom Quiz Saved Successfully!");
      navigate('/practice');
    } catch (error) {
      const errMsg = error.message || "";
      if (errMsg.includes("already exists") || errMsg.includes("unique title")) {
        setTitleError(errMsg);
        if (titleInputRef.current) titleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const handleImportJson = (importedQuestions) => {
    updateQuestionsHistory([...customQuestions, ...importedQuestions]);
    setQuizMode("custom");
    toast.success(`Imported ${importedQuestions.length} questions successfully.`);
  };

  if (loading) return <Loader message="Loading Quiz Setup..." />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-base-content">Configure Your Quiz</h1>
        <CreateQuizTabs mode={quizMode} setMode={setQuizMode} />
      </div>

      <form className="space-y-4">
        {/* COMMON QUIZ CONFIGURATION */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-base-content mb-2 pr-24">Quiz Title</label>
          <input
            ref={titleInputRef}
            type="text"
            className={`w-full rounded-md bg-base-200 text-base-content py-3 px-4 focus:outline-none focus:ring-1 border transition-colors ${
              titleError ? "border-error focus:border-error focus:ring-error" : "border-base-300 focus:border-primary focus:ring-primary"
            }`}
            value={customQuizTitle}
            onChange={(e) => {
              setCustomQuizTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            placeholder="e.g. Weekly Assessment: React Hooks"
          />
          {titleError && (
            <p className="text-error text-sm mt-1 mb-5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>{titleError}
            </p>
          )}
          {!titleError && <div className="mb-6"></div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">Quiz Description</label>
              <textarea
                className="w-full rounded-md bg-base-200 text-base-content py-3 px-4 focus:outline-none focus:ring-1 border border-base-300 focus:border-primary focus:ring-primary transition-colors resize-none h-24"
                value={customQuizDescription}
                onChange={(e) => setCustomQuizDescription(e.target.value)}
                placeholder="Briefly describe what this quiz is about..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">Quiz Icon</label>
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
              <label className="block text-sm font-semibold text-base-content mb-2">Timer Type</label>
              <Dropdown
                options={[
                  { label: "Overall Quiz Timer", value: "overall" },
                  { label: "Per Question Timer", value: "per_question" },
                ]}
                value={timerType}
                onChange={(val) => {
                  setTimerType(val);
                  if (val === "per_question" && timeLimit === 10) setTimeLimit(60);
                  if (val === "overall" && timeLimit === 60) setTimeLimit(10);
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
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <AnimatedPage key={quizMode}>
            {quizMode === "builtin" && (
              <BuiltInCategories
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
              />
            )}
            
            {quizMode === "custom" && (
              <CustomQuizBuilder
                customQuestions={customQuestions}
                updateCustomQuestion={updateCustomQuestion}
                removeCustomQuestion={removeCustomQuestion}
                addCustomQuestion={addCustomQuestion}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                undoStack={undoStack}
                redoStack={redoStack}
              />
            )}

            {quizMode === "json" && (
              <JsonQuestionImporter onImport={handleImportJson} />
            )}
          </AnimatedPage>
        </AnimatePresence>

        <div className="pt-6 flex flex-row justify-end gap-3 mt-6 pb-12">
          <button
            type="button"
            onClick={(e) => handleStart(e, "normal")}
            disabled={isStarting || isStartingClassroom}
            className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 transition-colors"
          >
            {isStarting ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />Starting...</> : "Start Quiz Now"}
          </button>

          <button
            type="button"
            onClick={(e) => handleStart(e, "classroom")}
            disabled={isStarting || isStartingClassroom}
            className="flex items-center justify-center px-6 py-2.5 border-2 border-primary rounded-lg shadow-sm text-sm font-bold text-primary bg-base-100 hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 transition-colors"
          >
            {isStartingClassroom ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" />Preparing Classroom...</> : "Start Classroom Mode"}
          </button>
          
          {(quizMode === "custom" || quizMode === "json") && (
            <button
              type="button"
              onClick={handleSaveCustomQuiz}
              disabled={isSaving || isStarting || isStartingClassroom || !isDirty}
              className={`flex items-center justify-center px-6 py-2.5 border border-base-300 rounded-lg shadow-sm text-sm font-bold text-base-content bg-base-100 hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-base-content" />Saving...</> : !isDirty ? "Saved" : "Save Quiz"}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default QuizSetup;
