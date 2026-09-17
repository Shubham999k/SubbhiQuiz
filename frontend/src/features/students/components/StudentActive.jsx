import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle, Trophy, Medal, Award, Loader2, ArrowRight } from "lucide-react";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";

const StudentActive = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session");
  const navigate = useNavigate();

  const [studentInfo] = useState(() => {
    if (!sessionCode) return null;
    const saved = localStorage.getItem(`student_session_${sessionCode}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [myAnswerData, setMyAnswerData] = useState({ index: -1, answer: null });
  const [personalResult, setPersonalResult] = useState(null);
  const [sanitizedLeaderboard, setSanitizedLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Connect to channel
  const { projectorState, broadcastEvent, socket } = useClassroomSync(
    sessionCode,
    "student",
  );

  const currentQIndex = projectorState?.currentQuestionIndex;
  const myAnswer =
    myAnswerData.index === currentQIndex ? myAnswerData.answer : null;

  useEffect(() => {
    if (!sessionCode) {
      navigate("/");
      return;
    }

    if (!studentInfo) {
      navigate(`/student/join?session=${sessionCode}`);
    }
  }, [sessionCode, navigate, studentInfo]);

  useEffect(() => {
    if (!socket || !studentInfo || !projectorState?.quizCompleted) return;

    // When the quiz is completed, check if results are already released (handling reconnection)
    socket.emit("check_result", { sessionCode, roll: studentInfo.roll }, (res) => {
      if (res && res.success) {
        setPersonalResult(res.result);
        setSanitizedLeaderboard(res.leaderboard);
      }
    });

    // Listen for real-time release event
    const handleRelease = (payload) => {
      socket.emit("check_result", { sessionCode, roll: studentInfo.roll }, (res) => {
        if (res && res.success) {
          setPersonalResult(res.result);
          setSanitizedLeaderboard(res.leaderboard);
        }
      });
    };

    socket.on("LEADERBOARD_RELEASED", handleRelease);

    return () => {
      socket.off("LEADERBOARD_RELEASED", handleRelease);
    };
  }, [socket, sessionCode, studentInfo, projectorState?.quizCompleted]);

  const handleSelectOption = (option) => {
    if (
      projectorState?.isAnswerRevealed ||
      projectorState?.isTimerPaused ||
      myAnswer
    ) {
      return; // Can't answer if revealed, paused, or already answered
    }

    setMyAnswerData({ index: currentQIndex, answer: option });

    broadcastEvent("STUDENT_ANSWER", {
      roll: studentInfo.roll,
      option: option,
      timeRemaining: projectorState.timeRemaining || 0,
    });
  };

  if (!studentInfo || !projectorState) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-medium">
            Connecting to Classroom...
          </p>
        </div>
      </div>
    );
  }

  const {
    questions,
    currentQuestionIndex,
    isAnswerRevealed,
    quizCompleted,
    quizStarted,
  } = projectorState;

  if (quizCompleted) {
    if (showLeaderboard && sanitizedLeaderboard) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
            <h1 className="font-bold">Leaderboard</h1>
            <button onClick={() => setShowLeaderboard(false)} className="bg-indigo-800 px-3 py-1 rounded text-sm hover:bg-indigo-700">Back to Result</button>
          </header>
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Student</th>
                    <th className="p-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sanitizedLeaderboard.map((student) => {
                    const isMe = student.roll === studentInfo.roll;
                    let rankIcon = null;
                    if (student.rank === 1) rankIcon = <Trophy className="w-5 h-5 text-yellow-500" />;
                    else if (student.rank === 2) rankIcon = <Medal className="w-5 h-5 text-gray-400" />;
                    else if (student.rank === 3) rankIcon = <Award className="w-5 h-5 text-amber-600" />;
                    else rankIcon = <span className="font-bold text-gray-500 w-5 text-center">#{student.rank}</span>;

                    return (
                      <tr key={student.roll} className={isMe ? "bg-indigo-50" : "hover:bg-gray-50"}>
                        <td className="p-4 flex items-center justify-center">{rankIcon}</td>
                        <td className={`p-4 font-bold ${isMe ? "text-indigo-700" : "text-gray-800"}`}>
                          {student.name} {isMe && "(You)"}
                        </td>
                        <td className="p-4 text-right font-bold text-indigo-600">{student.score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      );
    }

    if (personalResult) {
      const isTop3 = personalResult.rank <= 3;
      
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 ${isTop3 ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white" : "bg-white text-gray-800"}`}>
            <div className="text-center mb-8">
              <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${isTop3 ? 'text-indigo-200' : 'text-gray-400'}`}>Result Released</p>
              <h2 className="text-2xl font-bold mb-6">Congratulations, {studentInfo.name}!</h2>
              
              <div className="relative inline-block mb-6">
                {personalResult.rank === 1 && <Trophy className="w-24 h-24 mx-auto text-yellow-400 animate-bounce" />}
                {personalResult.rank === 2 && <Medal className="w-24 h-24 mx-auto text-gray-300" />}
                {personalResult.rank === 3 && <Award className="w-24 h-24 mx-auto text-amber-500" />}
                {personalResult.rank > 3 && (
                  <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center border-4 border-indigo-200">
                    <span className="text-3xl font-black text-indigo-600">#{personalResult.rank}</span>
                  </div>
                )}
                
                {isTop3 && (
                  <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-yellow-900 font-black rounded-full w-12 h-12 flex items-center justify-center border-4 border-white shadow-lg text-xl">
                    #{personalResult.rank}
                  </div>
                )}
              </div>

              <p className={`text-lg mb-1 ${isTop3 ? 'text-indigo-100' : 'text-gray-500'}`}>Your Score</p>
              <p className="text-5xl font-black mb-8">{personalResult.score}</p>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className={`p-4 rounded-xl ${isTop3 ? 'bg-white/10' : 'bg-gray-50'}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? 'text-indigo-200' : 'text-gray-500'}`}>Total Questions</p>
                  <p className="text-xl font-bold">{personalResult.totalQuestions}</p>
                </div>
                <div className={`p-4 rounded-xl ${isTop3 ? 'bg-white/10' : 'bg-gray-50'}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? 'text-indigo-200' : 'text-gray-500'}`}>Completion</p>
                  <p className="text-xl font-bold">100%</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowLeaderboard(true)}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isTop3 ? 'bg-white text-indigo-700 hover:bg-gray-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                View Leaderboard <ArrowRight size={20} />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(`student_session_${sessionCode}`);
                  navigate("/");
                }}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${isTop3 ? 'text-indigo-200 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Close & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col">
        <header className="bg-indigo-600 text-white p-4 shadow-md flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider">
            QUIZZZ-ZONE CLASSROOM
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Quiz Submitted!
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your answers have been recorded safely.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-700 mb-1">Result being prepared</p>
              <p className="text-sm text-gray-500">Please wait for the instructor to release the results.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
          <div className="font-bold">{studentInfo.name}</div>
          <div className="bg-indigo-800 px-3 py-1 rounded text-sm">
            Roll: {studentInfo.roll}
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Successfully Joined!
          </h2>
          <p className="text-gray-500 text-lg animate-pulse text-center">
            Waiting for teacher to start...
          </p>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div className="font-bold truncate max-w-[150px]">
          {studentInfo.name}
        </div>
        <div className="font-bold text-indigo-200">
          Q {currentQuestionIndex + 1} / {questions.length}
        </div>
        <div className="bg-indigo-800 px-3 py-1 rounded text-sm shrink-0">
          Roll: {studentInfo.roll}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((option, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = myAnswer === option;
            const isCorrectAnswer =
              isAnswerRevealed && option === currentQuestion.correctAnswer;

            // Only show red if they selected it, it was revealed, and it's wrong
            const isIncorrectSelected =
              isAnswerRevealed && isSelected && !isCorrectAnswer;

            let btnClass =
              "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
            let labelClass = "bg-gray-100 text-gray-500 border-gray-300";

            if (isCorrectAnswer) {
              btnClass =
                "bg-green-50 border-green-500 text-green-800 shadow-md";
              labelClass = "bg-green-500 text-white border-green-500";
            } else if (isIncorrectSelected) {
              btnClass = "bg-red-50 border-red-500 text-red-800 shadow-md";
              labelClass = "bg-red-500 text-white border-red-500";
            } else if (isSelected) {
              btnClass =
                "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-md";
              labelClass = "bg-indigo-500 text-white border-indigo-500";
            } else if (isAnswerRevealed || myAnswer) {
              // Dim others
              btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswerRevealed || myAnswer !== null}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${btnClass}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold shrink-0 ${labelClass}`}
                >
                  {isCorrectAnswer ? (
                    <CheckCircle2 size={20} />
                  ) : isIncorrectSelected ? (
                    <XCircle size={20} />
                  ) : (
                    label
                  )}
                </div>
                <span className="font-medium text-lg">{option}</span>
              </button>
            );
          })}
        </div>

        {myAnswer && !isAnswerRevealed && (
          <div className="mt-8 text-center text-indigo-600 font-medium animate-pulse">
            Answer submitted. Waiting for results...
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentActive;
