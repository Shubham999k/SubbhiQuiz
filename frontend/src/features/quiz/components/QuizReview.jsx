import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../../services/api";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Lightbulb,
  Trophy,
  Users,
} from "lucide-react";

const QuizReview = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await api.getQuizHistoryById(quizId);
        setResult(data);
        if (data.participants && data.participants.length > 0) {
          setSelectedStudentRoll(data.participants[0].roll);
        }
      } catch (error) {
        console.error("Error fetching review:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchResult();
    } else {
      navigate("/dashboard");
    }
  }, [navigate, quizId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!result || !result.questions || result.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Detailed Data Available</h2>
        <p className="text-gray-500 mb-6">This quiz was recorded before the detailed review feature was added.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const selectedStudent = result.participants?.find(p => p.roll === selectedStudentRoll);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
            Admin Review <span className="bg-indigo-700 text-xs px-2 py-1 rounded tracking-wider">CLASSROOM</span>
          </h1>
          <p className="text-indigo-200 text-sm mt-1 capitalize">
            {result.category} • {result.totalQuestions} Questions • {new Date(result.date).toLocaleDateString()}
          </p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center text-sm font-bold text-indigo-900 bg-white hover:bg-gray-100 transition-colors px-4 py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Left Sidebar: Participants */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Users size={18} /> Participants
              </h3>
              <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-sm">
                {result.participants?.length || 0}
              </span>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {result.participants?.map(student => (
                <button
                  key={student.roll}
                  onClick={() => setSelectedStudentRoll(student.roll)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                    selectedStudentRoll === student.roll 
                      ? "bg-indigo-50 border border-indigo-200" 
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      student.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                      student.rank === 2 ? "bg-gray-200 text-gray-700" :
                      student.rank === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      #{student.rank}
                    </div>
                    <div>
                      <div className={`font-bold ${selectedStudentRoll === student.roll ? "text-indigo-900" : "text-gray-800"}`}>
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {student.roll}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-600">{student.score}</div>
                  </div>
                </button>
              ))}
              
              {(!result.participants || result.participants.length === 0) && (
                <p className="text-gray-500 text-center italic py-8">No participants recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Content: Student Review */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedStudent ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="border-b border-gray-200 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}'s Answers</h2>
                  <p className="text-gray-500">Roll: {selectedStudent.roll} • Rank: #{selectedStudent.rank}</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center min-w-[100px]">
                    <p className="text-xs font-bold text-gray-500 uppercase">Correct</p>
                    <p className="text-2xl font-black text-green-600">{selectedStudent.correctCount} / {result.questions.length}</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-center min-w-[100px]">
                    <p className="text-xs font-bold text-indigo-400 uppercase">Score</p>
                    <p className="text-2xl font-black text-indigo-700">{selectedStudent.score}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {result.questions.map((q, idx) => {
                  const userAnswer = selectedStudent.answers?.[q.id];
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
                            optionClass += "border-red-400 bg-red-50 text-red-900 font-medium";
                          } else {
                            optionClass +=
                              "border-gray-100 bg-gray-50 text-gray-500 opacity-60";
                          }

                          return (
                            <div key={optIdx} className={optionClass}>
                              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 font-bold">
                                <span className="text-[10px]">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                              </div>
                              <span className="text-lg">{option}</span>

                              {isActuallyCorrect && (
                                <span className="ml-auto flex items-center gap-2 text-green-700 text-xs font-bold uppercase bg-green-100 px-2 py-1 rounded">
                                  <CheckCircle2 className="w-4 h-4" /> Correct Answer
                                </span>
                              )}
                              {isSelected && !isActuallyCorrect && (
                                <span className="ml-auto flex items-center gap-2 text-red-700 text-xs font-bold uppercase bg-red-100 px-2 py-1 rounded">
                                  <XCircle className="w-4 h-4" /> Selected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center h-[600px]">
              <Users className="w-20 h-20 text-gray-200 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Participant</h2>
              <p className="text-gray-500 max-w-sm">Click on a participant from the list on the left to review their exact answers for this quiz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizReview;
