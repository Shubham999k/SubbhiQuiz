import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import { api } from "../../../services/api";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Pause,
  Square,
  QrCode,
  Users,
  Lock,
  Unlock,
  GraduationCap,
  Copy,
  EyeOff,
  Wifi,
  BarChart3,
  Shield,
  User,
  Lightbulb,
  ChevronUp,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import { QRCodeSVG as QrCodeComponent } from "qrcode.react";
import toast from "react-hot-toast";

const ClassroomTeacher = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session") || quizId.toUpperCase();
  const navigate = useNavigate();

  const { currentQuiz, questions, submitQuiz, setAnswer } = useQuiz();

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null);
  // { title, message, onConfirm, confirmLabel, confirmClass }

  const showConfirm = (opts) => new Promise((resolve) => {
    setConfirmModal({ ...opts, onConfirm: resolve });
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    currentQuiz?.isCustom ? currentQuiz.timeLimit : 60,
  );
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features state
  const [quizStarted, setQuizStarted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrShownOnce, setQrShownOnce] = useState(false); // tracks if teacher viewed QR at least once
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({}); // { roll: { option, timeRemaining } }
  const [cumulativeStudentAnswers, setCumulativeStudentAnswers] = useState({}); // { roll: { questionId: option } }
  const [studentScores, setStudentScores] = useState({}); // { roll: totalScore }
  const [studentCorrectCount, setStudentCorrectCount] = useState({}); // { roll: correctCount }
  const [resultsReleased, setResultsReleased] = useState(false);

  // Listen for student events (joining, answering)
  const handleReceiveEvent = useCallback((event) => {
    if (event.type === "STUDENT_JOIN") {
      const { name, roll, batch } = event.payload;
      setJoinedStudents((prev) => {
        // Prevent duplicates by roll number
        if (!prev.find((s) => s.roll === roll)) {
          return [
            ...prev,
            { name, roll, batch: batch || "", timestamp: Date.now() },
          ];
        }
        return prev;
      });
    } else if (event.type === "STUDENT_ANSWER") {
      const { roll, option, timeRemaining } = event.payload;
      setStudentAnswers((prev) => ({ ...prev, [roll]: { option, timeRemaining } }));

      // Store in cumulative for history review
      if (questions && questions[currentQuestionIndex]) {
        const questionId = questions[currentQuestionIndex].id;
        setCumulativeStudentAnswers((prev) => {
          const studentHistory = prev[roll] || {};
          return {
            ...prev,
            [roll]: {
              ...studentHistory,
              [questionId]: option
            }
          };
        });
      }
    }
  }, [questions, currentQuestionIndex]);

  const { broadcastState, releaseResults } = useClassroomSync(
    sessionCode,
    "teacher",
    handleReceiveEvent,
  );

  const classResponses = React.useMemo(() => {
    const responses = { A: 0, B: 0, C: 0, D: 0 };
    if (!questions || questions.length === 0) return responses;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return responses;

    Object.values(studentAnswers).forEach(({ option }) => {
      const optIdx = currentQuestion.options.indexOf(option);
      if (optIdx !== -1) {
        const label = String.fromCharCode(65 + optIdx);
        responses[label] = (responses[label] || 0) + 1;
      }
    });
    return responses;
  }, [studentAnswers, currentQuestionIndex, questions]);

  // Sync state to projector and students whenever it changes
  useEffect(() => {
    // Sanitize questions so students don't get the correct answers prematurely
    const safeQuestions = questions
      ? questions.map((q, idx) => {
        const isCurrentAndRevealed =
          idx === currentQuestionIndex && isAnswerRevealed;
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          // Only include correct answer and explanation if revealed for the current question
          ...(isCurrentAndRevealed
            ? { correctAnswer: q.correctAnswer, explanation: q.explanation }
            : {}),
        };
      })
      : [];

    broadcastState({
      questions: safeQuestions,
      currentQuiz,
      currentQuestionIndex,
      selectedOption,
      isAnswerRevealed,
      classResponses,
      timeRemaining,
      isTimerPaused,
      quizCompleted,
      resultsReleased,
      sessionCode,
      showQR,
      quizStarted,
      joinedCount: joinedStudents.length,
      studentScores,
      joinedStudents,
    });
  }, [
    questions,
    currentQuiz,
    currentQuestionIndex,
    selectedOption,
    isAnswerRevealed,
    classResponses,
    timeRemaining,
    isTimerPaused,
    quizCompleted,
    resultsReleased,
    sessionCode,
    showQR,
    quizStarted,
    joinedStudents.length,
    studentScores,
    joinedStudents,
    broadcastState,
  ]);

  // Timer logic
  useEffect(() => {
    if (isTimerPaused || quizCompleted || timeRemaining <= 0 || !quizStarted)
      return;

    const timerId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          setIsTimerPaused(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isTimerPaused, timeRemaining, quizCompleted, quizStarted]);

  // Protect against direct access
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate("/dashboard");
    }
  }, [questions, navigate]);

  // Keyboard shortcuts
  const resetQuestionState = useCallback(() => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setStudentAnswers({});

    setTimeRemaining(currentQuiz?.isCustom ? currentQuiz.timeLimit : 60);
    setIsTimerPaused(true);
  }, [currentQuiz]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      resetQuestionState();
    }
  }, [currentQuestionIndex, questions, resetQuestionState]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      resetQuestionState();
    }
  }, [currentQuestionIndex, resetQuestionState]);

  const handleKeyPress = useCallback(
    (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        !quizStarted
      )
        return;
      const key = e.key.toUpperCase();
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;

      if (key >= "A" && key <= "D") {
        const idx = key.charCodeAt(0) - 65;
        if (idx < currentQuestion.options.length) {
          const option = currentQuestion.options[idx];
          setSelectedOption(option);
          setAnswer(currentQuestion.id, option);
        }
      } else if (key === "R" && !isAnswerRevealed) {
        setIsAnswerRevealed(true);
        // Calculate scores
        setStudentScores((prevScores) => {
          const newScores = { ...prevScores };
          Object.entries(studentAnswers).forEach(([roll, answerData]) => {
            if (answerData.option === currentQuestion.correctAnswer) {
              const bonus = answerData.timeRemaining || 0;
              newScores[roll] = (newScores[roll] || 0) + 100 + bonus;
            }
          });
          return newScores;
        });
        setStudentCorrectCount((prevCount) => {
          const newCount = { ...prevCount };
          Object.entries(studentAnswers).forEach(([roll, answerData]) => {
            if (answerData.option === currentQuestion.correctAnswer) {
              newCount[roll] = (newCount[roll] || 0) + 1;
            }
          });
          return newCount;
        });
      } else if (key === "N") {
        if (currentQuestionIndex < questions.length - 1) {
          handleNext();
        }
      } else if (key === "P") {
        if (currentQuestionIndex > 0) {
          handlePrev();
        }
      } else if (e.key === " ") {
        e.preventDefault();
        setIsTimerPaused((prev) => !prev);
      }
    },
    [
      currentQuestionIndex,
      questions,
      quizStarted,
      setAnswer,
      handleNext,
      handlePrev,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (!questions || questions.length === 0 || !currentQuiz) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const openProjector = () => {
    window.open(
      `/classroom/projector/${quizId}?session=${sessionCode}`,
      "_blank",
    );
  };

  const handleEndQuiz = async () => {
    const ok = await showConfirm({
      title: "End Quiz",
      message: "Are you sure you want to end the quiz? This will stop the session for all students.",
      confirmLabel: "Yes, End Quiz",
      confirmClass: "bg-error hover:bg-red-600 text-white",
    });
    setConfirmModal(null);
    if (!ok) return;

    setIsSubmitting(true);
    setQuizCompleted(true);

    broadcastState({
      currentQuestionIndex,
      selectedOption,
      isAnswerRevealed,
      classResponses,
      timeRemaining,
      isTimerPaused: true,
      quizCompleted: true,
      quizStarted: false,
      sessionCode,
      studentScores,
      joinedStudents,
    });

    try {
      // Calculate classroom average accuracy
      const totalStudents = joinedStudents.length;
      let averageAccuracy = 0;
      let totalCorrect = 0;

      if (totalStudents > 0) {
        Object.values(studentCorrectCount).forEach(count => {
          totalCorrect += count;
        });
        const averageCorrect = totalCorrect / totalStudents;
        averageAccuracy = (averageCorrect / questions.length) * 100;
      }

      // Calculate ranks for history
      const sortedStudents = [...joinedStudents].sort((a, b) => {
        const scoreA = studentScores[a.roll] || 0;
        const scoreB = studentScores[b.roll] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      const participantsData = sortedStudents.map((student, index) => ({
        name: student.name,
        roll: student.roll,
        score: studentScores[student.roll] || 0,
        rank: index + 1,
        correctCount: studentCorrectCount[student.roll] || 0,
        answers: cumulativeStudentAnswers[student.roll] || {}
      }));

      const questionsData = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));

      const resultData = {
        category: currentQuiz.category,
        totalQuestions: questions.length,
        difficulty: currentQuiz.difficulty,
        score: averageAccuracy > 0 ? averageAccuracy : 0, // In backend, 'score' can just be average accuracy or we can save it as score
        accuracy: averageAccuracy > 0 ? averageAccuracy : 0,
        timeTaken: currentQuiz.timeLimit || 60 * questions.length,
        questions: questionsData,
        participants: participantsData
      };

      const result = await api.submitQuizResult(resultData);

      // Removed redirect to dashboard, stay on admin results page
    } catch {
      // Failed to submit history, but we can still show the leaderboard
      console.error("Failed to submit history");
    }
  };

  const handleReleaseResults = async () => {
    const ok = await showConfirm({
      title: "Release Results",
      message: "Are you sure you want to release the results? Once released, students will be notified and their rank-wise result popup will appear.",
      confirmLabel: "Yes, Release",
      confirmClass: "bg-primary hover:opacity-90 text-white",
    });
    setConfirmModal(null);
    if (!ok) return;

    setResultsReleased(true);
    releaseResults({
      studentScores,
      joinedStudents,
      totalQuestions: questions.length
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const joinUrl = import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? (typeof __LOCAL_IP__ !== "undefined" ? __LOCAL_IP__ : window.location.hostname) : window.location.hostname}:${window.location.port}/student/join?session=${sessionCode}` : `${window.location.origin}/student/join?session=${sessionCode}`;

  return (
    <>
      <div className="bg-base-200 flex flex-col">
      {/* Header */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border border-base-300">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="bg-primary text-white p-3 rounded-2xl shadow-md hidden sm:block">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-base-content flex flex-wrap items-center justify-center sm:justify-start gap-2">
              Teacher Control{" "}
              <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">
                CLASSROOM MODE
              </span>
            </h1>
            <p className="text-base-content/70 text-sm mt-1 font-medium capitalize">
              {currentQuiz.category} • {questions.length} Questions • Code:{" "}
              <span className="font-bold text-base-content">
                {sessionCode}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4">
          {!quizStarted && (
            <div className="flex items-center gap-2 mr-2 text-sm font-medium text-base-content/70">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Quiz Ready
            </div>
          )}


          {!quizCompleted && (
            <>
              <button
                onClick={() => {
                  if (!qrShownOnce) {
                    toast.error("Please generate the QR Code first so students can join before starting the quiz!", { duration: 4000, icon: "📱" });
                    return;
                  }
                  setQuizStarted(true);
                  setShowQR(false);
                  setIsTimerPaused(false);
                }}
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center gap-2"
              >
                <Play size={18} fill="currentColor" /> Start Quiz
              </button>
              <button
                onClick={handleEndQuiz}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-error hover:opacity-90 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-colors text-sm font-bold shadow-sm disabled:opacity-50"
              >
                <Square size={18} /> End Quiz
              </button>

            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {quizCompleted ? (
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-8 flex flex-col order-1 lg:order-2 min-h-[300px] sm:min-h-[400px]">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-base-content">Leaderboard Management</h2>
                  <p className="text-base-content/70 mt-1">Submissions: {joinedStudents.length}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${resultsReleased ? 'bg-success/20 text-green-700' : 'bg-amber-100 text-warning'}`}>
                  {resultsReleased ? (
                    <><Unlock size={18} /> Results: Released</>
                  ) : (
                    <><Lock size={18} /> Results: Hidden</>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-base-200 text-base-content/70 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="p-4 rounded-tl-lg">Student</th>
                      <th className="p-4">Roll No</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4 text-center">Correct</th>
                      <th className="p-4 rounded-tr-lg"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...joinedStudents]
                      .sort((a, b) => {
                        const scoreA = studentScores[a.roll] || 0;
                        const scoreB = studentScores[b.roll] || 0;
                        if (scoreB !== scoreA) return scoreB - scoreA;
                        return (a.timestamp || 0) - (b.timestamp || 0);
                      })
                      .map((student, index) => {
                        // Calculate rank based on sorting
                        const rank = index + 1;
                        return (
                          <tr key={student.roll} className="hover:bg-base-200">
                            <td className="p-4 flex items-center gap-3">
                              <span className="font-bold text-base-content/50 w-6">#{rank}</span>
                              <span className="font-bold text-base-content">{student.name}</span>
                            </td>
                            <td className="p-4 text-base-content/70 font-mono">{student.roll}</td>
                            <td className="p-4 text-center font-bold text-primary">{studentScores[student.roll] || 0}</td>
                            <td className="p-4 text-center text-base-content/70">{studentCorrectCount[student.roll] || 0} / {questions.length}</td>
                            <td className="p-4"></td>
                          </tr>
                        );
                      })}
                    {joinedStudents.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-base-content/70 italic">No students joined this session.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-center border-t pt-6 gap-4">
                {!resultsReleased ? (
                  <button
                    onClick={handleReleaseResults}
                    className="px-8 py-3 bg-primary hover:opacity-80 text-white rounded-lg font-bold text-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    <Unlock size={20} /> Release Ranks
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-8 py-3 bg-success/20 text-green-700 rounded-lg font-bold text-lg cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Ranks Already Released
                  </button>
                )}
              </div>
            </div>
          ) : !quizStarted ? (
            <div className="flex flex-col flex-1 gap-6">

              <div className="bg-base-100 flex-1 rounded-2xl shadow-sm border border-base-300 p-8 flex items-center justify-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => { setShowQR(true); setQrShownOnce(true); }}
                    className="px-6 py-3 bg-base-200 text-base-content rounded-xl font-bold text-sm flex items-center gap-2 transition-colors border border-base-200 shadow-sm"
                  >
                    <QrCode size={18} />
                    Generate QR Code
                  </button>
                </div>
              </div>

              {/* QR Modal Overlay */}
              {showQR && (
                <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-base-100 p-8 rounded-3xl shadow-2xl relative max-w-sm w-full flex flex-col items-center border border-base-300 animate-in fade-in zoom-in duration-200">
                    <button
                      onClick={() => setShowQR(false)}
                      className="absolute top-4 right-4 text-base-content/50 hover:text-base-content p-2 rounded-full hover:bg-base-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200">
                      <QrCodeComponent
                        value={joinUrl}
                        size={240}
                        bgColor={"#ffffff"}
                        fgColor={"#1e1b4b"}
                        level={"H"}
                        includeMargin={false}
                      />
                    </div>
                    <div className="mt-6 w-full space-y-3">
                      <p className="text-base-content/70 font-medium bg-base-200 px-6 py-3 rounded-xl border border-base-300 text-center">
                        Class Code: <span className="font-bold text-base-content tracking-wider text-lg ml-1">{sessionCode}</span>
                      </p>
                      <div className="bg-base-200 pl-4 pr-2 py-2 rounded-xl border border-base-300 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="text-xs truncate font-mono text-base-content/70 select-all" title={joinUrl}>{joinUrl}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(joinUrl);
                            toast.success("Link copied to clipboard!");
                          }}
                          className="shrink-0 p-2 hover:bg-base-300 rounded-lg text-primary transition-colors flex items-center justify-center gap-1"
                          title="Copy Link"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              {/* Question Card */}
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-5">
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                <h2 className="text-base font-bold text-base-content uppercase tracking-wide">
                  Question {currentQuestionIndex + 1} / {questions.length}
                </h2>
                <div className="flex gap-2">

                  <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-2 py-1 border rounded hover:bg-base-200 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className="px-2 py-1 border rounded hover:bg-base-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-medium text-base-content mb-5 whitespace-pre-line">
                {currentQuestion.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === option;
                  const isCorrect =
                    isAnswerRevealed &&
                    option === currentQuestion.correctAnswer;
                  const isIncorrectSelected =
                    isAnswerRevealed && isSelected && !isCorrect;

                  let borderClass = "border-base-300 hover:border-indigo-300";
                  if (isCorrect) borderClass = "border-success bg-success/10";
                  else if (isIncorrectSelected)
                    borderClass = "border-error bg-error/10";
                  else if (isSelected)
                    borderClass = "border-primary bg-primary/10";

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isAnswerRevealed) {
                          setSelectedOption(option);
                          setAnswer(currentQuestion.id, option);
                        }
                      }}
                      className={`text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${borderClass} ${isAnswerRevealed ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold shrink-0 text-sm
                        ${isCorrect
                            ? "border-success bg-success text-white"
                            : isIncorrectSelected
                              ? "border-error bg-error text-white"
                              : isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-base-300 text-base-content/70"
                          }`}
                      >
                        {label}
                      </div>
                      <span className="text-base text-base-content">{option}</span>

                      {/* Show how many students picked this */}
                      {classResponses[label] > 0 && (
                        <span className="ml-auto bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
                          {classResponses[label]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswerRevealed && currentQuestion.explanation && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <h4 className="font-bold text-blue-800 mb-1">Explanation</h4>
                  <p className="text-blue-900">{currentQuestion.explanation}</p>
                </div>
              )}
              </div>

              {/* Controls Below Question */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timer Card */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-5 text-center flex flex-col justify-center">
                  <h3 className="text-base-content/70 font-medium mb-3 uppercase tracking-wider text-sm">
                    Timer Control
                  </h3>
                  <div className={`text-4xl font-mono font-bold mb-4 ${timeRemaining === 0 ? "text-error" : "text-base-content"}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setIsTimerPaused(!isTimerPaused)}
                      className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${isTimerPaused
                          ? "bg-success/20 text-green-700 hover:bg-green-200"
                          : "bg-amber-100 text-warning hover:bg-amber-200"
                        }`}
                    >
                      {isTimerPaused ? (
                        <><Play size={18} /> Start</>
                      ) : (
                        <><Pause size={18} /> Pause</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Card */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-5 flex flex-col gap-3 justify-center">
                  <button
                    onClick={() => {
                      setIsAnswerRevealed(true);
                      // Calculate scores
                      const currentQuestion = questions[currentQuestionIndex];
                      setStudentScores((prevScores) => {
                        const newScores = { ...prevScores };
                        Object.entries(studentAnswers).forEach(([roll, answerData]) => {
                          if (answerData.option === currentQuestion.correctAnswer) {
                            const bonus = answerData.timeRemaining || 0;
                            newScores[roll] = (newScores[roll] || 0) + 100 + bonus;
                          }
                        });
                        return newScores;
                      });
                      setStudentCorrectCount((prevCount) => {
                        const newCount = { ...prevCount };
                        Object.entries(studentAnswers).forEach(([roll, answerData]) => {
                          if (answerData.option === currentQuestion.correctAnswer) {
                            newCount[roll] = (newCount[roll] || 0) + 1;
                          }
                        });
                        return newCount;
                      });
                    }}
                    disabled={isAnswerRevealed}
                    className="w-full py-3.5 bg-primary text-white rounded-lg font-bold text-lg hover:opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Reveal Answer
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className="w-full py-3 bg-base-200 text-base-content rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Controls & Live Tracking */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Live Student Tracker */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden flex flex-col min-h-[300px] lg:min-h-[480px] max-h-[600px] order-2 lg:order-1">
            <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-100">
              <h3 className="font-extrabold text-base-content flex items-center gap-3 text-[15px]">
                <Users size={20} className="text-indigo-600" /> Live Classroom
              </h3>
              <span className="bg-base-200 text-base-content font-bold px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span> {joinedStudents.length} Joined
              </span>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-base-100">
              {joinedStudents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center text-base-content/30 mb-4">
                    <Users size={40} />
                  </div>
                  <h4 className="font-bold text-base-content mb-1">No students joined yet</h4>
                  <p className="text-base-content/60 text-sm">Students will appear here after scanning the QR code.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {joinedStudents.map((student, i) => (
                    <li key={i} className="text-sm text-base-content">
                      <div className="flex justify-between items-center bg-base-50 p-4 rounded-xl border border-base-200 shadow-sm transition-all hover:border-indigo-200">
                        <div>
                          <p className="font-bold text-base-content">
                            {student.name}
                          </p>
                          <p className="text-xs text-base-content/70 font-mono mt-1">
                            Roll: {student.roll}{" "}
                            {student.batch && `| Batch: ${student.batch}`}
                          </p>
                        </div>
                        <CheckCircle2 size={20} className="text-success" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Custom Confirm Modal */}
    {confirmModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full border border-base-300 animate-in zoom-in-95 duration-200">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <h3 className="text-lg font-bold text-base-content">{confirmModal.title}</h3>
              </div>
              <button
                onClick={() => { setConfirmModal(null); confirmModal.onConfirm(false); }}
                className="text-base-content/40 hover:text-base-content p-1 rounded-lg hover:bg-base-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message */}
            <p className="text-base-content/70 text-sm leading-relaxed mb-6 pl-[52px]">
              {confirmModal.message}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setConfirmModal(null); confirmModal.onConfirm(false); }}
                className="px-4 py-2 rounded-lg border border-base-300 text-base-content hover:bg-base-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmModal.onConfirm(true)}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${confirmModal.confirmClass}`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ClassroomTeacher;
