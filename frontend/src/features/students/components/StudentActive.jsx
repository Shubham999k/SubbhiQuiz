import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Trophy,
  Medal,
  Award,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Maximize2,
  BookMarked,
} from "lucide-react";
import toast from "react-hot-toast";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import { useQuizRestrictions } from "../hooks/useQuizRestrictions";
import ChiragLifeline from "./ChiragLifeline";

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

  // Lifeline state
  const [lifelinesRemaining, setLifelinesRemaining] = useState(2);
  const [hintOption, setHintOption] = useState(null); // the correct answer revealed by Jinni

  const [pleadStatus, setPleadStatus] = useState("idle"); // idle, pending, rejected

  // Summary state
  const [summaryReleased, setSummaryReleased] = useState(false);

  // ─── useClassroomSync with new callbacks ────────────────────────
  const onSummaryReleasedCb = useCallback(() => {
    setSummaryReleased(true);
  }, []);

  const { projectorState, broadcastEvent, socket, requestLifeline, requestWildcard } =
    useClassroomSync(sessionCode, "student", null, {
      onSummaryReleased: onSummaryReleasedCb,
      onWildcardApproved: (data) => {
        if (data?.roll && studentInfo?.roll && data.roll !== studentInfo.roll) return;
        
        // Un-lock locally
        unlockStudent();
        setPleadStatus("idle");
        toast.success("Wildcard entry approved! You are back in the quiz.");
      },
      onWildcardRejected: (data) => {
        if (data?.roll && studentInfo?.roll && data.roll !== studentInfo.roll) return;
        
        setPleadStatus("rejected");
        toast.error(data.reason || "Wildcard entry rejected");
      }
    });


  const currentQIndex = projectorState?.currentQuestionIndex;

  // Restore answer from localStorage on refresh or question change
  useEffect(() => {
    if (currentQIndex !== undefined) {
      const savedAnswer = localStorage.getItem(`student_answer_${sessionCode}_${currentQIndex}`);
      if (savedAnswer) {
        setMyAnswerData({ index: currentQIndex, answer: savedAnswer });
      } else if (myAnswerData.index !== currentQIndex) {
        setMyAnswerData({ index: -1, answer: null });
      }
    }
  }, [currentQIndex, sessionCode]);

  const myAnswer = myAnswerData.index === currentQIndex ? myAnswerData.answer : null;

  // Clear hint when question changes
  useEffect(() => {
    setHintOption(null);
  }, [currentQIndex]);

  // ─── Restore lifeline count on reconnect ─────────────────────────
  useEffect(() => {
    if (!socket || !studentInfo) return;
    const roll = studentInfo.roll;

    socket.emit("check_lifelines", { sessionCode, roll }, (res) => {
      if (res && typeof res.remaining === "number") {
        setLifelinesRemaining(res.remaining);
      }
    });

    // Also check if summary was already released
    socket.emit("check_summary", { sessionCode, roll }, (res) => {
      if (res?.summaryReleased) {
        setSummaryReleased(true);
      }
    });
  }, [socket, sessionCode, studentInfo]);

  // ─── Leaderboard / personal result ──────────────────────────────
  useEffect(() => {
    if (!socket || !studentInfo || !projectorState?.quizCompleted) return;

    socket.emit("check_result", { sessionCode, roll: studentInfo.roll }, (res) => {
      if (res?.success) {
        setPersonalResult(res.result);
        setSanitizedLeaderboard(res.leaderboard);
      }
    });

    const handleRelease = () => {
      socket.emit("check_result", { sessionCode, roll: studentInfo.roll }, (res) => {
        if (res?.success) {
          setPersonalResult(res.result);
          setSanitizedLeaderboard(res.leaderboard);
        }
      });
    };

    socket.on("LEADERBOARD_RELEASED", handleRelease);
    return () => socket.off("LEADERBOARD_RELEASED", handleRelease);
  }, [socket, sessionCode, studentInfo, projectorState?.quizCompleted]);

  // ─── Anti-cheating restrictions ─────────────────────────────────
  const handleViolation = useCallback(
    (eventType, questionIndex) => {
      if (!socket || !studentInfo) return;
      socket.emit("student_focus_violation", {
        sessionCode,
        roll: studentInfo.roll,
        eventType,
        questionIndex,
        metadata: {},
      });
    },
    [socket, sessionCode, studentInfo]
  );

  const isQuizActive =
    projectorState?.quizStarted &&
    !projectorState?.quizCompleted &&
    !!projectorState?.questions;

  const {
    violations,
    warningLevel,
    isLocked,
    showWarning,
    dismissWarning,
    showFullscreenWarning,
    requestFullscreen,
    unlockStudent,
  } = useQuizRestrictions({
    enabled: isQuizActive,
    onViolation: handleViolation,
    fullscreenRequired: projectorState?.fullscreenRequired ?? false,
    currentQuestionIndex: currentQIndex ?? 0,
  });

  // ─── Plead for Wildcard Entry ────────────────────────────────────
  const handlePleadForWildcard = () => {
    if (!socket || !studentInfo || !projectorState?.wildcardEnabled) return;
    
    setPleadStatus("pending");
    requestWildcard(studentInfo.name, studentInfo.roll, studentInfo.batch || "");
  };

  // ─── Lifeline activation ─────────────────────────────────────────
  const handleLifelineActivate = useCallback(async () => {
    if (!socket || !studentInfo || !projectorState?.questions) return { success: false };

    const questions = projectorState.questions;
    const qIndex = projectorState.currentQuestionIndex;
    const question = questions[qIndex];
    if (!question) return { success: false };

    const result = await requestLifeline(question.id, qIndex);
    if (result?.success) {
      setLifelinesRemaining(result.remaining);
    }
    return result;
  }, [socket, studentInfo, projectorState, requestLifeline]);

  const handleHintReceived = useCallback(
    (correctOption) => {
      setHintOption(correctOption);
    },
    []
  );

  // ─── Nav guard ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionCode) { navigate("/"); return; }
    if (!studentInfo) { navigate(`/student/join?session=${sessionCode}`); }
  }, [sessionCode, navigate, studentInfo]);

  // ─── Answer selection ────────────────────────────────────────────
  const handleSelectOption = (option) => {
    if (
      isLocked ||
      projectorState?.isAnswerRevealed ||
      projectorState?.isTimerPaused ||
      myAnswer
    ) return;

    setMyAnswerData({ index: currentQIndex, answer: option });
    localStorage.setItem(`student_answer_${sessionCode}_${currentQIndex}`, option);
    
    broadcastEvent("STUDENT_ANSWER", {
      roll: studentInfo.roll,
      option,
      timeRemaining: projectorState.timeRemaining || 0,
    });
  };

  // ─── Loading state ───────────────────────────────────────────────
  if (!studentInfo || !projectorState) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary font-medium">Connecting to Classroom...</p>
        </div>
      </div>
    );
  }

  const { questions, currentQuestionIndex, isAnswerRevealed, quizCompleted, quizStarted } = projectorState;

  // ─── Quiz Completed views ─────────────────────────────────────────
  if (quizCompleted) {
    if (showLeaderboard && sanitizedLeaderboard) {
      return (
        <div className="min-h-screen bg-base-200 flex flex-col">
          <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center shrink-0">
            <h1 className="font-bold">Leaderboard</h1>
            <button onClick={() => setShowLeaderboard(false)} className="bg-white/20 px-3 py-1 rounded text-sm hover:opacity-80">
              Back to Result
            </button>
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
          <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl ${isTop3 ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white" : "bg-base-100 text-base-content"}`}>
            <div className="text-center mb-8">
              <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${isTop3 ? "text-primary-content" : "text-base-content/50"}`}>Result Released</p>
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
              <p className={`text-lg mb-1 ${isTop3 ? "text-indigo-100" : "text-base-content/70"}`}>Your Score</p>
              <p className="text-5xl font-black mb-8">{personalResult.score}</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className={`p-4 rounded-xl ${isTop3 ? "bg-base-100/10" : "bg-base-200"}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? "text-primary-content" : "text-base-content/70"}`}>Total Questions</p>
                  <p className="text-xl font-bold">{personalResult.totalQuestions}</p>
                </div>
                <div className={`p-4 rounded-xl ${isTop3 ? "bg-base-100/10" : "bg-base-200"}`}>
                  <p className={`text-xs uppercase font-bold ${isTop3 ? "text-primary-content" : "text-base-content/70"}`}>Completion</p>
                  <p className="text-xl font-bold">100%</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowLeaderboard(true)}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isTop3 ? "bg-base-100 text-primary hover:bg-base-200" : "bg-primary text-white hover:opacity-80"}`}
              >
                View Leaderboard <ArrowRight size={20} />
              </button>

              {/* NEW: View Answer Summary button (only when released) */}
              {summaryReleased && (
                <button
                  onClick={() => navigate(`/student/summary?session=${sessionCode}&roll=${studentInfo.roll}`)}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isTop3 ? "bg-amber-400 text-amber-900 hover:bg-amber-300" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`}
                >
                  <BookMarked size={20} /> View Answer Summary
                </button>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem(`student_session_${sessionCode}`);
                  navigate("/");
                }}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${isTop3 ? "text-primary-content hover:bg-base-100/10" : "text-base-content/70 hover:bg-base-200"}`}
              >
                Close & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Quiz done, waiting for teacher to release results
    return (
      <div className="min-h-screen bg-primary/10 flex flex-col">
        <header className="bg-primary text-white p-4 shadow-md flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider">SUBBHI-QUIZ CLASSROOM</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-base-content mb-2">Quiz Submitted!</h2>
            <p className="text-base-content/70 mb-8 text-lg">Your answers have been recorded safely.</p>
            <div className="bg-base-200 p-6 rounded-2xl border border-base-300 mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="font-bold text-base-content mb-1">Waiting for instructor</p>
              <p className="text-sm text-base-content/70">Please wait for the instructor to release the results.</p>
            </div>
            {summaryReleased && (
              <button
                onClick={() => navigate(`/student/summary?session=${sessionCode}&roll=${studentInfo.roll}`)}
                className="w-full py-3 rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"
              >
                <BookMarked size={18} /> View Answer Summary
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── Waiting for quiz to start ───────────────────────────────────
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
          <div className="font-bold">{studentInfo.name}</div>
          <div className="bg-primary px-3 py-1 rounded text-sm">Roll: {studentInfo.roll}</div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Successfully Joined!</h2>
          <p className="text-base-content/70 text-lg animate-pulse text-center">Waiting for teacher to start...</p>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // ─── Active Quiz UI ───────────────────────────────────────────────
  return (
    <div className="quiz-active-screen min-h-screen bg-base-200 flex flex-col relative">

      {/* ── Watermark ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.055,
          transform: "rotate(-25deg)",
          fontSize: "clamp(10px, 2vw, 16px)",
          fontWeight: "900",
          color: "#1e1b4b",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        SubbhiQuiz • {studentInfo.name} • {studentInfo.roll} • {sessionCode}
      </div>

      {/* ── Violation Warning Modal ────────────────────────────────── */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-warning/40 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-5 ${warningLevel >= 3 ? "bg-error" : warningLevel === 2 ? "bg-warning" : "bg-amber-400"}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-white flex-shrink-0" />
                <h3 className="text-white font-bold text-lg">
                  {isLocked
                    ? "Quiz Locked"
                    : warningLevel >= 2
                      ? "⚠️ Second Warning"
                      : "⚠️ Quiz Focus Lost"}
                </h3>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content font-medium mb-2">
                {isLocked
                  ? "You have exceeded the maximum number of focus violations. Your quiz participation has been flagged."
                  : warningLevel >= 2
                    ? "Leaving the quiz screen again may result in your quiz being flagged by the teacher."
                    : "Please stay on the quiz screen."}
              </p>
              {!isLocked && (
                <p className="text-sm text-base-content/60 mb-4">
                  Warning {warningLevel} of {3}
                </p>
              )}
              {!isLocked ? (
                <button
                  onClick={dismissWarning}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-80 transition-colors"
                >
                  I Understand — Stay on Quiz
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-error text-sm font-bold">
                    Your teacher has been notified.
                  </p>
                  
                  {projectorState?.wildcardEnabled && pleadStatus === "idle" && (
                    <button
                      onClick={handlePleadForWildcard}
                      className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      ✨ Plead for Wildcard Entry
                    </button>
                  )}
                  
                  {pleadStatus === "pending" && (
                    <div className="p-3 bg-base-200 rounded-xl text-sm font-bold text-base-content/70 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Waiting for teacher's approval...
                    </div>
                  )}

                  {pleadStatus === "rejected" && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-bold">
                      Your wildcard request was rejected.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Warning ─────────────────────────────────────── */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-sm w-full border border-base-300 p-6 text-center">
            <Maximize2 className="w-12 h-12 text-warning mx-auto mb-3" />
            <h3 className="text-xl font-bold text-base-content mb-2">⚠️ Fullscreen Required</h3>
            <p className="text-base-content/70 mb-6">Please return to fullscreen mode to continue the quiz.</p>
            <button
              onClick={requestFullscreen}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-80 transition-colors"
            >
              Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center shrink-0 relative z-10">
        <div className="font-bold truncate max-w-[150px]">{studentInfo.name}</div>
        <div className="font-bold text-primary-content">Q {currentQuestionIndex + 1} / {questions.length}</div>
        <div className="bg-white/20 px-3 py-1 rounded text-sm shrink-0">
          Roll: {studentInfo.roll}
        </div>
      </header>

      {/* ── Violation indicator (subtle, top right) ───────────────── */}
      {violations > 0 && (
        <div className={`fixed top-16 right-3 z-20 text-xs px-2 py-1 rounded-full font-bold shadow-md
          ${violations >= 3 ? "bg-error text-white" : "bg-warning text-warning-content"}`}>
          ⚠️ {violations}
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-4 overflow-y-auto relative z-10">
        {/* Question card */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6 mb-6">
          <h2 className="text-xl font-bold text-base-content leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 flex-1">
          {currentQuestion.options.map((option, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = myAnswer === option;
            const isCorrectAnswer = isAnswerRevealed && option === currentQuestion.correctAnswer;
            const isIncorrectSelected = isAnswerRevealed && isSelected && !isCorrectAnswer;
            const isHinted = hintOption === option && !isAnswerRevealed;

            let btnClass = "bg-base-100 border-base-300 text-base-content hover:bg-base-200";
            let labelClass = "bg-base-200 text-base-content/70 border-base-300";

            if (isCorrectAnswer) {
              btnClass = "bg-success/10 border-success text-success shadow-md";
              labelClass = "bg-success text-white border-success";
            } else if (isIncorrectSelected) {
              btnClass = "bg-error/10 border-error text-error shadow-md";
              labelClass = "bg-error text-white border-error";
            } else if (isHinted) {
              btnClass = "bg-amber-50 border-amber-400 text-amber-800 shadow-md ring-2 ring-amber-300/50 animate-pulse";
              labelClass = "bg-amber-400 text-white border-amber-400";
            } else if (isSelected) {
              btnClass = "bg-primary/10 border-primary text-primary shadow-md";
              labelClass = "bg-indigo-500 text-white border-primary";
            } else if (isAnswerRevealed || myAnswer) {
              btnClass = "bg-base-200 border-base-300 text-base-content/50 opacity-60";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswerRevealed || myAnswer !== null || isLocked}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${btnClass}`}
              >
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold shrink-0 ${labelClass}`}>
                  {isCorrectAnswer ? <CheckCircle2 size={20} /> : isIncorrectSelected ? <XCircle size={20} /> : isHinted ? "✨" : label}
                </div>
                <span className="font-medium text-lg flex-1">{option}</span>
                {isHinted && <span className="text-amber-600 text-xs font-bold">Jinni's Hint</span>}
              </button>
            );
          })}
        </div>

        {myAnswer && !isAnswerRevealed && (
          <div className="mt-6 text-center text-primary font-medium animate-pulse">
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

      {/* ── Bottom bar with Chirag ─────────────────────────────────── */}
      <div className="shrink-0 bg-base-100 border-t border-base-300 px-4 py-3 flex items-center justify-between relative z-10">
        {/* Left: Chirag Lifeline */}
        <ChiragLifeline
          lifelinesRemaining={lifelinesRemaining}
          onActivate={handleLifelineActivate}
          disabled={!!myAnswer || isAnswerRevealed || isLocked || !isQuizActive}
          onHintReceived={handleHintReceived}
        />

        {/* Right: Status info */}
        <div className="text-right">
          <div className="text-xs text-base-content/50 font-mono">Session</div>
          <div className="text-xs font-bold text-base-content/70">{sessionCode}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentActive;
