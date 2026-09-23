import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

const QuizActive = () => {
  const {
    currentQuiz,
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    setTimeRemaining,
    isQuizActive,
    setAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    submitQuiz,
  } = useQuiz();

  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAutoSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    const result = await submitQuiz();
    navigate(`/quiz/${result.quizId}/result`);
  }, [submitQuiz, navigate]);

  // Timer Effect
  useEffect(() => {
    if (!isQuizActive) return;

    const timerId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          if (currentQuiz.timerType === 'per_question') {
            setTimeout(() => {
              if (currentQuestionIndex === questions.length - 1) {
                handleAutoSubmit();
              } else {
                nextQuestion();
              }
            }, 0);
          } else {
            setTimeout(handleAutoSubmit, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isQuizActive, handleAutoSubmit, setTimeRemaining, currentQuiz?.timerType, currentQuestionIndex, questions.length, nextQuestion]);

  // Reset timer on question change for per_question mode
  useEffect(() => {
    if (currentQuiz?.timerType === 'per_question') {
      setTimeRemaining(currentQuiz.timeLimit);
    }
  }, [currentQuestionIndex, currentQuiz?.timerType, currentQuiz?.timeLimit, setTimeRemaining]);

  // Protect against direct access without quiz setup
  useEffect(() => {
    if (!isQuizActive && !isSubmitting && !showConfirmModal) {
      navigate("/dashboard");
    }
  }, [isQuizActive, navigate, isSubmitting, showConfirmModal]);

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    const result = await submitQuiz();
    navigate(`/quiz/${result.quizId}/result`);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!questions || questions.length === 0 || !currentQuiz) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Visual warning for timer
  const isWarningTime = timeRemaining <= 300; // 5 mins
  const isDangerTime = timeRemaining <= 60; // 1 min

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-base-100 p-4 rounded-xl shadow-sm border border-base-300 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-base-content capitalize">
            {currentQuiz.category} Quiz
          </h2>
          <div className="flex items-center text-sm text-base-content/70 mt-1">
            <span className="font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="mx-2">•</span>
            <span className="capitalize">
              {currentQuiz.difficulty} Difficulty
            </span>
          </div>
        </div>

        <div
          className={`flex items-center px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            isDangerTime
              ? "bg-error/20 text-red-700 animate-pulse"
              : isWarningTime
                ? "bg-amber-100 text-warning"
                : "bg-primary/10 text-primary"
          }`}
        >
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow">
        {/* Main Question Area */}
        <div className="lg:w-2/3 flex flex-col">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex-grow">
            <h3 className="text-xl font-medium text-base-content mb-6 whitespace-pre-line">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswer(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-base-300 hover:border-indigo-300 hover:bg-base-200"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-base-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs">
                            {String.fromCharCode(65 + idx)}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-base ${isSelected ? "text-indigo-900 font-medium" : "text-base-content"}`}
                      >
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 border border-base-300 rounded-md shadow-sm text-sm font-medium text-base-content bg-base-100 hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-success hover:bg-green-700"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:opacity-80"
              >
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 sticky top-6">
            <h4 className="text-sm font-bold text-base-content uppercase tracking-wider mb-4">
              Question Navigator
            </h4>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;

                let btnClass =
                  "w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors border ";

                if (isCurrent) {
                  btnClass +=
                    "border-primary bg-primary/20 text-primary ring-2 ring-indigo-300 ring-offset-1";
                } else if (isAnswered) {
                  btnClass +=
                    "border-primary bg-primary text-white hover:opacity-80";
                } else {
                  btnClass +=
                    "border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => jumpToQuestion(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-base-300 pt-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-base-content/70">Answered:</span>
                <span className="font-medium text-base-content">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Unanswered:</span>
                <span className="font-medium text-base-content">
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-success hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowConfirmModal(false)}
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-base-100 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div
                  className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${answeredCount < questions.length ? "bg-amber-100" : "bg-primary/20"}`}
                >
                  {answeredCount < questions.length ? (
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-base-content"
                    id="modal-title"
                  >
                    Submit Quiz?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-base-content/70">
                      Are you sure you want to submit your quiz?
                      {answeredCount < questions.length && (
                        <span className="block mt-1 font-medium text-warning">
                          You still have {questions.length - answeredCount}{" "}
                          unanswered questions.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-75"
                >
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-base-300 shadow-sm px-4 py-2 bg-base-100 text-base font-medium text-base-content hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizActive;
