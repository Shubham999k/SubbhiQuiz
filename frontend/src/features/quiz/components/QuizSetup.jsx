import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import { api } from "../../../services/api";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStartingClassroom, setIsStartingClassroom] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);

  const { setupQuiz, setupCustomQuiz } = useQuiz();
  const navigate = useNavigate();

  const [quizMode, setQuizMode] = useState("builtin"); // 'builtin' or 'custom'
  const [customQuestions, setCustomQuestions] = useState(() => [
    {
      id: `custom_${Date.now()}_0`,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
    },
  ]);

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
            alert(`Please complete all fields for Question ${i + 1}`);
            setIsStarting(false);
            setIsStartingClassroom(false);
            return;
          }
        }
        await setupCustomQuiz(customQuestions, 60); // 60 seconds total or per question (Classroom logic handles per-question)
      } else {
        await setupQuiz(selectedCategory, difficulty, questionCount);
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

  const addCustomQuestion = () => {
    setCustomQuestions((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}_${prev.length}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const removeCustomQuestion = (index) => {
    if (customQuestions.length > 1) {
      setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateCustomQuestion = (index, field, value, optionIndex = null) => {
    setCustomQuestions((prev) => {
      const newQuestions = [...prev];
      if (optionIndex !== null) {
        newQuestions[index].options[optionIndex] = value;
        // If the correct answer matches the old option text, we don't auto-update it, but they should re-select.
      } else {
        newQuestions[index][field] = value;
      }
      return newQuestions;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-base">
          Configure Your Quiz
        </h1>
        <p className="mt-2 text-text-muted">
          Customize your practice session or create your own custom quiz.
        </p>
      </div>

      <div className="inline-flex bg-bg-surface p-1 rounded-lg border border-border-subtle">
        <button
          className={`px-6 py-2.5 rounded-md font-medium text-sm transition-colors ${
            quizMode === "builtin"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-text-muted hover:text-text-base hover:bg-bg-base"
          }`}
          onClick={() => setQuizMode("builtin")}
        >
          Built-in Categories
        </button>
        <button
          className={`px-6 py-2.5 rounded-md font-medium text-sm transition-colors ${
            quizMode === "custom"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-text-muted hover:text-text-base hover:bg-bg-base"
          }`}
          onClick={() => setQuizMode("custom")}
        >
          Custom Quiz Builder
        </button>
      </div>

      <form className="space-y-8">
        {quizMode === "builtin" ? (
          <div className="space-y-8 bg-bg-surface p-6 md:p-8 rounded-xl border border-border-subtle shadow-sm">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-text-base mb-2"
              >
                Select Topic
              </label>
              <select
                id="category"
                className="mt-1 block w-full rounded-md border-border-subtle bg-bg-base text-text-base py-3 pl-4 pr-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm border transition-colors"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-base mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["all", "easy", "medium", "hard"].map((level) => (
                  <div
                    key={level}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                      difficulty === level
                        ? "border-primary-600 bg-primary-600 text-white shadow-md transform scale-[1.02]"
                        : "border-border-subtle bg-bg-base text-text-base hover:border-primary-400 hover:bg-bg-surface"
                    }`}
                    onClick={() => setDifficulty(level)}
                  >
                    <span className="capitalize font-medium">{level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-base mb-3">
                Number of Questions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((num) => (
                  <div
                    key={num}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                      questionCount === num
                        ? "border-primary-600 bg-primary-600 text-white shadow-md transform scale-[1.02]"
                        : "border-border-subtle bg-bg-base text-text-base hover:border-primary-400 hover:bg-bg-surface"
                    }`}
                    onClick={() => setQuestionCount(num)}
                  >
                    <span className="font-medium">{num}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {customQuestions.map((q, qIndex) => (
              <div
                key={q.id}
                className="bg-bg-base p-4 rounded-lg border border-border-subtle"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-text-base">
                    Question {qIndex + 1}
                  </h4>
                  {customQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove Question"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Question Text
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-border-subtle bg-bg-surface text-text-base py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 border"
                      value={q.question}
                      onChange={(e) =>
                        updateCustomQuestion(qIndex, "question", e.target.value)
                      }
                      placeholder="e.g. What is the output of 2 + 2?"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex}>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Option {String.fromCharCode(65 + optIndex)}
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border-border-subtle bg-bg-surface text-text-base py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 border"
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
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Correct Answer
                    </label>
                    <select
                      className="w-full rounded-md border-border-subtle bg-bg-surface text-text-base py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 border"
                      value={q.correctAnswer}
                      onChange={(e) =>
                        updateCustomQuestion(
                          qIndex,
                          "correctAnswer",
                          e.target.value,
                        )
                      }
                      required
                    >
                      <option value="">Select the correct option...</option>
                      {q.options.map(
                        (opt, optIndex) =>
                          opt.trim() && (
                            <option key={optIndex} value={opt}>
                              Option {String.fromCharCode(65 + optIndex)}: {opt}
                            </option>
                          ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-border-subtle bg-bg-surface text-text-base py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 border"
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
              className="w-full py-3 border-2 border-dashed border-border-subtle rounded-lg text-text-muted font-medium hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add Another Question
            </button>
          </div>
        )}

        <div className="pt-6 flex flex-col gap-3 border-t border-border-subtle mt-6">
          <button
            type="button"
            onClick={(e) => handleStart(e, "normal")}
            disabled={isStarting || isStartingClassroom}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-75 transition-colors"
          >
            {isStarting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
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
            className="w-full flex justify-center py-3 px-4 border-2 border-primary-600 rounded-md shadow-sm text-lg font-medium text-primary-600 bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-75 transition-colors"
          >
            {isStartingClassroom ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-primary-600" />
                Preparing Classroom...
              </>
            ) : (
              "Start Classroom Mode"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizSetup;
