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
          setTimeout(handleAutoSubmit, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isQuizActive, handleAutoSubmit, setTimeRemaining]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {currentQuiz.category} Quiz
          </h2>
          <div className="flex items-center text-sm text-gray-500 mt-1">
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
              ? "bg-red-100 text-red-700 animate-pulse"
              : isWarningTime
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-50 text-indigo-700"
          }`}
        >
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-grow">
        {/* Main Question Area */}
        <div className="lg:w-2/3 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-grow">
            <h3 className="text-xl font-medium text-gray-900 mb-6 whitespace-pre-line">
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
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-gray-300"
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
                        className={`text-base ${isSelected ? "text-indigo-900 font-medium" : "text-gray-700"}`}
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
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
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
                    "border-indigo-600 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300 ring-offset-1";
                } else if (isAnswered) {
                  btnClass +=
                    "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700";
                } else {
                  btnClass +=
                    "border-gray-200 bg-white text-gray-600 hover:bg-gray-50";
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

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Answered:</span>
                <span className="font-medium text-gray-900">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unanswered:</span>
                <span className="font-medium text-gray-900">
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div
                  className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${answeredCount < questions.length ? "bg-amber-100" : "bg-indigo-100"}`}
                >
                  {answeredCount < questions.length ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Submit Quiz?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to submit your quiz?
                      {answeredCount < questions.length && (
                        <span className="block mt-1 font-medium text-amber-600">
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-75"
                >
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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
