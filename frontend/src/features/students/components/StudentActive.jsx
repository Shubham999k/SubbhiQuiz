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
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-medium">
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
        <div className="min-h-screen bg-base-200 flex flex-col">
          <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center shrink-0">
            <h1 className="font-bold">Leaderboard</h1>
            <button onClick={() => setShowLeaderboard(false)} className="bg-primary px-3 py-1 rounded text-sm hover:opacity-80">Back to Result</button>
          </header>
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-base-200 text-base-content/70 uppercase text-xs tracking-wider border-b">
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
                    if (student.rank === 1) rankIcon = <Trophy className="w-5 h-5 text-warning" />;
                    else if (student.rank === 2) rankIcon = <Medal className="w-5 h-5 text-base-content/50" />;
                    else if (student.rank === 3) rankIcon = <Award className="w-5 h-5 text-warning" />;
                    else rankIcon = <span className="font-bold text-base-content/70 w-5 text-center">#{student.rank}</span>;

                    return (
                      <tr key={student.roll} className={isMe ? "bg-primary/10" : "hover:bg-base-200"}>
                        <td className="p-4 flex items-center justify-center">{rankIcon}</td>
                        <td className={`p-4 font-bold ${isMe ? "text-primary" : "text-base-content"}`}>
                          {student.name} {isMe && "(You)"}
                        </td>
                        <td className="p-4 text-right font-bold text-primary">{student.score}</td>
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
        <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 ${isTop3 ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white" : "bg-base-100 text-base-content"}`}>
            <div className="text-center mb-8">
              <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${isTop3 ? 'text-primary-content' : 'text-base-content/50'}`}>Result Released</p>
              <h2 className="text-2xl font-bold mb-6">Congratulations, {studentInfo.name}!</h2>
              
              <div className="relative inline-block mb-6">
                {personalResult.rank === 1 && <Trophy className="w-24 h-24 mx-auto text-warning animate-bounce" />}
                {personalResult.rank === 2 && <Medal className="w-24 h-24 mx-auto text-gray-300" />}
                {personalResult.rank === 3 && <Award className="w-24 h-24 mx-auto text-warning" />}
                {personalResult.rank > 3 && (
                  <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary/20">
                    <span className="text-3xl font-black text-primary">#{personalResult.rank}</span>
                  </div>
                )}
                
                {isTop3 && (
                  <div className="absolute -bottom-4 -right-4 bg-warning text-warning-content font-black rounded-full w-12 h-12 flex items-center justify-center border-4 border-white shadow-lg text-xl">
                    #{personalResult.rank}
                  </div>
                )}
              </div>

              <p className={`text-lg mb-1 ${isTop3 ? 'text-indigo-100' : 'text-base-content/70'}`}>Your Score</p>
              <p className="text-5xl font-black mb-8">{personalResult.score}</p>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className={`p-4 rounded-xl ${isTop3 ? 'bg-base-100/10' : 'bg-base-200'}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? 'text-primary-content' : 'text-base-content/70'}`}>Total Questions</p>
                  <p className="text-xl font-bold">{personalResult.totalQuestions}</p>
                </div>
                <div className={`p-4 rounded-xl ${isTop3 ? 'bg-base-100/10' : 'bg-base-200'}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? 'text-primary-content' : 'text-base-content/70'}`}>Completion</p>
                  <p className="text-xl font-bold">100%</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowLeaderboard(true)}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isTop3 ? 'bg-base-100 text-primary hover:bg-base-200' : 'bg-primary text-white hover:opacity-80'}`}
              >
                View Leaderboard <ArrowRight size={20} />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(`student_session_${sessionCode}`);
                  navigate("/");
                }}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${isTop3 ? 'text-primary-content hover:bg-base-100/10' : 'text-base-content/70 hover:bg-base-200'}`}
              >
                Close & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-primary/10 flex flex-col">
        <header className="bg-primary text-white p-4 shadow-md flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider">
            QUIZZZ-ZONE CLASSROOM
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-base-content mb-2">
              Quiz Submitted!
            </h2>
            <p className="text-base-content/70 mb-8 text-lg">
              Your answers have been recorded safely.
            </p>
            
            <div className="bg-base-200 p-6 rounded-2xl border border-base-300 mb-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="font-bold text-base-content mb-1">Result being prepared</p>
              <p className="text-sm text-base-content/70">Please wait for the instructor to release the results.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
          <div className="font-bold">{studentInfo.name}</div>
          <div className="bg-primary px-3 py-1 rounded text-sm">
            Roll: {studentInfo.roll}
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Successfully Joined!
          </h2>
          <p className="text-base-content/70 text-lg animate-pulse text-center">
            Waiting for teacher to start...
          </p>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div className="font-bold truncate max-w-[150px]">
          {studentInfo.name}
        </div>
        <div className="font-bold text-primary-content">
          Q {currentQuestionIndex + 1} / {questions.length}
        </div>
        <div className="bg-primary px-3 py-1 rounded text-sm shrink-0">
          Roll: {studentInfo.roll}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6 mb-6">
          <h2 className="text-xl font-bold text-base-content leading-snug">
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
              "bg-base-100 border-base-300 text-base-content hover:bg-base-200";
            let labelClass = "bg-base-200 text-base-content/70 border-base-300";

            if (isCorrectAnswer) {
              btnClass =
                "bg-success/10 border-success text-success shadow-md";
              labelClass = "bg-success text-white border-success";
            } else if (isIncorrectSelected) {
              btnClass = "bg-error/10 border-error text-error shadow-md";
              labelClass = "bg-error text-white border-error";
            } else if (isSelected) {
              btnClass =
                "bg-primary/10 border-primary text-primary shadow-md";
              labelClass = "bg-indigo-500 text-white border-primary";
            } else if (isAnswerRevealed || myAnswer) {
              // Dim others
              btnClass = "bg-base-200 border-base-300 text-base-content/50 opacity-60";
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
          <div className="mt-8 text-center text-primary font-medium animate-pulse">
            Answer submitted. Waiting for results...
          </div>
        )}

        {isAnswerRevealed && currentQuestion.explanation && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <h4 className="font-bold text-blue-800 mb-1">Explanation</h4>
            <p className="text-blue-900 whitespace-pre-line">{currentQuestion.explanation}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentActive;
