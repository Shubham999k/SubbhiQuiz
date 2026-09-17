import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import { api } from "../../../services/api";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Lightbulb,
} from "lucide-react";

const QuizReview = () => {
  const { quizResult: contextResult } = useQuiz();
  const [result, setResult] = useState(contextResult);
  const [loading, setLoading] = useState(!contextResult);
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    // If not in context (e.g. came from history), fetch it
    const fetchResult = async () => {
      if (!contextResult) {
        // Mock fetch from history for now. In a real app, fetch by ID.
        const history = await api.getQuizHistory();
        // Since we don't have perfect IDs for routing yet, just take the first matching or latest
        // For this demo, we'll just show the latest if no specific one is found
        if (history.length > 0) {
          // If we had real IDs: const found = history.find(h => h.id === quizId);
          setResult(history[0]);
        } else {
          navigate("/dashboard");
        }
        setLoading(false);
      }
    };

    fetchResult();
  }, [contextResult, navigate, quizId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Answers</h1>
          <p className="text-gray-500 capitalize">
            {result.category} Quiz • {Math.round(result.accuracy)}% Score
          </p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {result.questions.map((q, idx) => {
          const userAnswer = result.answers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          const isUnanswered = !userAnswer;

          return (
            <div
              key={q.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Question Header */}
              <div
                className={`px-6 py-4 border-b flex items-start justify-between ${
                  isCorrect
                    ? "bg-green-50 border-green-100"
                    : isUnanswered
                      ? "bg-amber-50 border-amber-100"
                      : "bg-red-50 border-red-100"
                }`}
              >
                <div className="flex items-start">
                  <span
                    className={`flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold mr-3 mt-0.5 ${
                      isCorrect
                        ? "bg-green-200 text-green-800"
                        : isUnanswered
                          ? "bg-amber-200 text-amber-800"
                          : "bg-red-200 text-red-800"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span
                      className={`text-sm font-bold uppercase tracking-wider ${
                        isCorrect
                          ? "text-green-700"
                          : isUnanswered
                            ? "text-amber-700"
                            : "text-red-700"
                      }`}
                    >
                      {isCorrect
                        ? "Correct"
                        : isUnanswered
                          ? "Unanswered"
                          : "Incorrect"}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900 mt-1 whitespace-pre-line">
                      {q.question}
                    </h3>
                  </div>
                </div>

                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 ml-4" />
                )}
              </div>

              {/* Options */}
              <div className="p-6 space-y-3">
                {q.options.map((option, optIdx) => {
                  const isSelected = userAnswer === option;
                  const isActuallyCorrect = option === q.correctAnswer;

                  let optionClass =
                    "flex items-center p-3 rounded-lg border-2 transition-colors text-sm ";

                  if (isActuallyCorrect) {
                    optionClass +=
                      "border-green-500 bg-green-50 text-green-900 font-medium";
                  } else if (isSelected && !isActuallyCorrect) {
                    optionClass += "border-red-300 bg-red-50 text-red-900";
                  } else {
                    optionClass +=
                      "border-gray-100 bg-gray-50 text-gray-500 opacity-60";
                  }

                  return (
                    <div key={optIdx} className={optionClass}>
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center mr-3">
                        <span className="text-[10px]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                      </div>
                      <span>{option}</span>

                      {isActuallyCorrect && (
                        <CheckCircle2 className="w-4 h-4 ml-auto text-green-600" />
                      )}
                      {isSelected && !isActuallyCorrect && (
                        <XCircle className="w-4 h-4 ml-auto text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-start">
                  <Lightbulb className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Explanation
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizReview;
