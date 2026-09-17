import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Pause,
  Square,
  ExternalLink,
  QrCode,
  Users,
} from "lucide-react";
import { QRCodeSVG as QrCodeComponent } from "qrcode.react";

const ClassroomTeacher = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session") || quizId.toUpperCase();
  const navigate = useNavigate();

  const { currentQuiz, questions, submitQuiz, setAnswer } = useQuiz();

  // Local teacher state
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
  const [showQR, setShowQR] = useState(true);
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({}); // { roll: option }

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
      const { roll, option } = event.payload;
      setStudentAnswers((prev) => ({ ...prev, [roll]: option }));
    }
  }, []);

  const { broadcastState } = useClassroomSync(
    sessionCode,
    "teacher",
    handleReceiveEvent,
  );

  const classResponses = React.useMemo(() => {
    const responses = { A: 0, B: 0, C: 0, D: 0 };
    if (!questions || questions.length === 0) return responses;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return responses;

    Object.values(studentAnswers).forEach((option) => {
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
      sessionCode,
      showQR,
      quizStarted,
      joinedCount: joinedStudents.length,
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
    sessionCode,
    showQR,
    quizStarted,
    joinedStudents.length,
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
      } else if (key === "R") {
        setIsAnswerRevealed(true);
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
    if (!window.confirm("Are you sure you want to end the quiz?")) return;

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
    });

    try {
      const result = await submitQuiz();
      navigate(`/quiz/${result.quizId}/result`);
    } catch {
      navigate("/dashboard");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-bold flex flex-wrap items-center justify-center sm:justify-start gap-2">
            Teacher Control{" "}
            <span className="bg-indigo-700 text-xs px-2 py-1 rounded">
              CLASSROOM MODE
            </span>
          </h1>
          <p className="text-indigo-200 text-sm mt-1 capitalize">
            {currentQuiz.category} • {questions.length} Questions • Code:{" "}
            <span className="font-mono text-white font-bold">
              {sessionCode}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={openProjector}
            className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm font-medium"
          >
            <ExternalLink size={18} /> Open Projector
          </button>

          <button
            onClick={handleEndQuiz}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Square size={18} /> End Quiz
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {!quizStarted ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <Users className="w-20 h-20 text-indigo-200 mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Waiting for Students
              </h2>
              <p className="text-gray-500 mb-6 text-lg">
                Project the QR code for students to join the classroom session.
              </p>

              {showQR && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-indigo-100 mb-8 inline-block">
                  <QrCodeComponent
                    value={`${window.location.protocol}//${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? (typeof __LOCAL_IP__ !== "undefined" ? __LOCAL_IP__ : window.location.hostname) : window.location.hostname}:${window.location.port}/student/join?session=${sessionCode}`}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#312e81"}
                    level={"H"}
                    includeMargin={false}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-lg flex items-center gap-2 transition-colors"
                >
                  <QrCode size={20} />{" "}
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>
                <button
                  onClick={() => {
                    setQuizStarted(true);
                    setShowQR(false);
                  }}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg transition-colors shadow-md"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
                  Question {currentQuestionIndex + 1} / {questions.length}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className={`p-2 border rounded transition-colors ${showQR ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "hover:bg-gray-50"}`}
                    title="Toggle QR on Projector"
                  >
                    <QrCode size={20} />
                  </button>
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-medium text-gray-900 mb-8 whitespace-pre-line">
                {currentQuestion.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === option;
                  const isCorrect =
                    isAnswerRevealed &&
                    option === currentQuestion.correctAnswer;
                  const isIncorrectSelected =
                    isAnswerRevealed && isSelected && !isCorrect;

                  let borderClass = "border-gray-200 hover:border-indigo-300";
                  if (isCorrect) borderClass = "border-green-500 bg-green-50";
                  else if (isIncorrectSelected)
                    borderClass = "border-red-500 bg-red-50";
                  else if (isSelected)
                    borderClass = "border-indigo-600 bg-indigo-50";

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isAnswerRevealed) {
                          setSelectedOption(option);
                          setAnswer(currentQuestion.id, option);
                        }
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${borderClass} ${isAnswerRevealed ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold shrink-0
                        ${
                          isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : isIncorrectSelected
                              ? "border-red-500 bg-red-500 text-white"
                              : isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {label}
                      </div>
                      <span className="text-lg text-gray-800">{option}</span>

                      {/* Show how many students picked this */}
                      {classResponses[label] > 0 && (
                        <span className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                          {classResponses[label]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswerRevealed && currentQuestion.explanation && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-800 mb-1">Explanation</h4>
                  <p className="text-blue-900">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Controls & Live Tracking */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Live Student Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[300px]">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Users size={18} /> Live Classroom
              </h3>
              <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-sm">
                {joinedStudents.length} Joined
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {joinedStudents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center italic py-4">
                  No students joined yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {joinedStudents.map((student, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-800">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            Roll: {student.roll}{" "}
                            {student.batch && `| Batch: ${student.batch}`}
                          </p>
                        </div>
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {quizStarted && (
            <>
              {/* Timer Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wider text-sm">
                  Timer Control
                </h3>
                <div
                  className={`text-5xl font-mono font-bold mb-6 ${timeRemaining === 0 ? "text-red-500" : "text-gray-800"}`}
                >
                  {formatTime(timeRemaining)}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                      isTimerPaused
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {isTimerPaused ? (
                      <>
                        <Play size={18} /> Start
                      </>
                    ) : (
                      <>
                        <Pause size={18} /> Pause
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-3">
                <button
                  onClick={() => setIsAnswerRevealed(true)}
                  disabled={isAnswerRevealed}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 /> Reveal Answer
                </button>

                <button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Next Question
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomTeacher;
