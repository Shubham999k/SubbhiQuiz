import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import {
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

const QuizResult = () => {
  const { quizResult, resetQuiz } = useQuiz();
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    // If no result in context, they shouldn't be here
    if (!quizResult) {
      navigate("/dashboard");
    }
  }, [quizResult, navigate]);

  if (!quizResult) return null;

  const {
    accuracy,
    correctAnswers,
    incorrectAnswers,
    unanswered,
    timeTaken,
    category,
    difficulty,
  } = quizResult;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isPassing = accuracy >= 70;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden text-center">
        {/* Header Banner */}
        <div
          className={`py-10 px-6 ${isPassing ? "bg-success" : "bg-warning"}`}
        >
          <div className="inline-flex items-center justify-center p-4 bg-base-100 bg-opacity-20 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Quiz Completed!
          </h1>
          <p className="text-white text-opacity-90 capitalize">
            {category} • {difficulty} Level
          </p>
        </div>

        {/* Score Ring */}
        <div className="relative -mt-16 mb-8 flex justify-center">
          <div className="w-32 h-32 bg-base-100 rounded-full p-2 shadow-lg">
            <div
              className={`w-full h-full rounded-full flex flex-col items-center justify-center border-4 ${
                isPassing
                  ? "border-success text-success"
                  : "border-amber-500 text-warning"
              }`}
            >
              <span className="text-3xl font-bold">
                {Math.round(accuracy)}%
              </span>
              <span className="text-xs font-medium text-base-content/70 mt-1 uppercase tracking-wider">
                Score
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <div className="flex items-center justify-center text-base-content/70 mb-2">
                <CheckCircle className="w-5 h-5 mr-2 text-success" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <p className="text-2xl font-bold text-base-content">
                {correctAnswers}
              </p>
            </div>

            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <div className="flex items-center justify-center text-base-content/70 mb-2">
                <XCircle className="w-5 h-5 mr-2 text-error" />
                <span className="text-sm font-medium">Incorrect</span>
              </div>
              <p className="text-2xl font-bold text-base-content">
                {incorrectAnswers}
              </p>
            </div>

            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <div className="flex items-center justify-center text-base-content/70 mb-2">
                <AlertCircle className="w-5 h-5 mr-2 text-warning" />
                <span className="text-sm font-medium">Unanswered</span>
              </div>
              <p className="text-2xl font-bold text-base-content">{unanswered}</p>
            </div>

            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <div className="flex items-center justify-center text-base-content/70 mb-2">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                <span className="text-sm font-medium">Time Taken</span>
              </div>
              <p className="text-xl font-bold text-base-content mt-1">
                {formatTime(timeTaken)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to={`/quiz/${quizId}/review`}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-base-300 shadow-sm text-base font-medium rounded-md text-base-content bg-base-100 hover:bg-base-200 transition-colors"
            >
              <CheckCircle className="w-5 h-5 mr-2 text-primary" />
              Review Answers
            </Link>

            <button
              onClick={() => {
                resetQuiz();
                navigate(`/quiz/setup?category=${category}`);
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:opacity-80 transition-colors"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retry Quiz
            </button>

            <Link
              to="/dashboard"
              onClick={resetQuiz}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-primary/20 hover:bg-indigo-200 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
