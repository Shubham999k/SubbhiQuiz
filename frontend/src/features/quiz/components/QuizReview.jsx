import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useLoader } from "../../../hooks/useLoader";
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
import Loader from "../../../components/common/Loader";

const QuizReview = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useLoader(true);
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
    return <div className="min-h-screen bg-base-200"><Loader message="Loading Quiz Results..." /></div>;
  }

  if (!result || !result.questions || result.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-base-content mb-2">No Detailed Data Available</h2>
        <p className="text-base-content/70 mb-6">This quiz was recorded before the detailed review feature was added.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center text-white bg-primary hover:opacity-80 px-6 py-3 rounded-lg font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const selectedStudent = result.participants?.find(p => p.roll === selectedStudentRoll);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="min-h-screen bg-base-200 p-4 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
            Admin Review <span className="bg-indigo-700 text-xs px-2 py-1 rounded tracking-wider">CLASSROOM</span>
          </h1>
          <p className="text-primary-content text-sm mt-1 capitalize">
            {result.category} • {result.totalQuestions} Questions • {new Date(result.date).toLocaleDateString()}
          </p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center text-sm font-bold text-indigo-900 bg-base-100 hover:bg-base-200 transition-colors px-4 py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow">
        {/* Left Sidebar: Participants */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden flex flex-col h-[580px]">
            <div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
              <h3 className="font-bold text-base-content flex items-center gap-2">
                <Users size={18} /> Participants
              </h3>
              <span className="bg-primary/20 text-primary font-bold px-2 py-1 rounded text-sm">
                {result.participants?.length || 0}
              </span>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1 pr-2">
              {result.participants?.map(student => (
                <button
                  key={student.roll}
                  onClick={() => setSelectedStudentRoll(student.roll)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                    selectedStudentRoll === student.roll 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-base-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      student.rank === 1 ? "bg-warning/20 text-warning" :
                      student.rank === 2 ? "bg-base-300 text-base-content" :
                      student.rank === 3 ? "bg-error/20 text-error" :
                      "bg-base-200 text-base-content/70"
                    }`}>
                      #{student.rank}
                    </div>
                    <div>
                      <div className={`font-bold ${selectedStudentRoll === student.roll ? "text-primary" : "text-base-content"}`}>
                        {student.name}
                      </div>
                      <div className="text-xs text-base-content/70 font-mono">
                        {student.roll}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{student.score}</div>
                  </div>
                </button>
              ))}
              
              {(!result.participants || result.participants.length === 0) && (
                <p className="text-base-content/70 text-center italic py-8">No participants recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Content: Student Review */}
        <div className="flex-1 flex flex-col gap-4">
          {selectedStudent ? (
            (() => {
              const actualCorrectCount = result.questions.filter(q => selectedStudent.answers?.[q.id] === q.correctAnswer).length;
              const actualIncorrectCount = result.questions.length - actualCorrectCount;
              
              return (
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col h-[580px]">
                <div className="border-b border-base-300 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-base-content">{selectedStudent.name}'s Answers</h2>
                    <p className="text-base-content/70">Roll: {selectedStudent.roll} • Rank: #{selectedStudent.rank}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-success/10 p-3 rounded-lg border border-success/20 text-center min-w-[80px]">
                      <p className="text-[10px] font-bold text-success uppercase">Correct</p>
                      <p className="text-xl font-black text-success">{actualCorrectCount}</p>
                    </div>
                    <div className="bg-error/10 p-3 rounded-lg border border-error/20 text-center min-w-[80px]">
                      <p className="text-[10px] font-bold text-error uppercase">Incorrect</p>
                      <p className="text-xl font-black text-error">{actualIncorrectCount}</p>
                    </div>
                    <div className="bg-base-200 p-3 rounded-lg border border-base-300 text-center min-w-[80px]">
                      <p className="text-[10px] font-bold text-base-content/70 uppercase">Total</p>
                      <p className="text-xl font-black text-base-content">{result.questions.length}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-center min-w-[80px]">
                      <p className="text-[10px] font-bold text-primary uppercase">Score</p>
                      <p className="text-xl font-black text-primary">{selectedStudent.score}</p>
                    </div>
                  </div>
                </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {result.questions.map((q, idx) => {
                  const userAnswer = selectedStudent.answers?.[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  const isUnanswered = !userAnswer;

                  return (
                    <div
                      key={q.id}
                      className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden"
                    >
                      {/* Question Header */}
                      <div
                        className={`px-6 py-4 border-b flex items-start justify-between ${
                          isCorrect
                            ? "bg-success/10 border-green-100"
                            : isUnanswered
                              ? "bg-warning/10 border-amber-100"
                              : "bg-error/10 border-error/20"
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold mr-3 mt-0.5 ${
                              isCorrect
                                ? "bg-green-200 text-success"
                                : isUnanswered
                                  ? "bg-amber-200 text-warning"
                                  : "bg-red-200 text-error"
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
                                    ? "text-warning"
                                    : "text-red-700"
                              }`}
                            >
                              {isCorrect
                                ? "Correct"
                                : isUnanswered
                                  ? "Unanswered"
                                  : "Incorrect"}
                            </span>
                            <h3 className="text-lg font-medium text-base-content mt-1 whitespace-pre-line">
                              {q.question}
                            </h3>
                          </div>
                        </div>

                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 ml-4" />
                        ) : (
                          <XCircle className="w-6 h-6 text-error flex-shrink-0 ml-4" />
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
                              "border-success bg-success/10 text-green-900 font-medium";
                          } else if (isSelected && !isActuallyCorrect) {
                            optionClass += "border-red-400 bg-error/10 text-red-900 font-medium";
                          } else {
                            optionClass +=
                              "border-base-300 bg-base-200 text-base-content/70 opacity-60";
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
                                <span className="ml-auto flex items-center gap-2 text-green-700 text-xs font-bold uppercase bg-success/20 px-2 py-1 rounded">
                                  <CheckCircle2 className="w-4 h-4" /> Correct Answer
                                </span>
                              )}
                              {isSelected && !isActuallyCorrect && (
                                <span className="ml-auto flex items-center gap-2 text-red-700 text-xs font-bold uppercase bg-error/20 px-2 py-1 rounded">
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
            );
            })()
          ) : (
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-12 flex flex-col items-center justify-center text-center h-[600px]">
              <Users className="w-20 h-20 text-gray-200 mb-4" />
              <h2 className="text-2xl font-bold text-base-content mb-2">Select a Participant</h2>
              <p className="text-base-content/70 max-w-sm">Click on a participant from the list on the left to review their exact answers for this quiz.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizReview;
