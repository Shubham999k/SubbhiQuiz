import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Clock,
  Sparkles,
  Lock,
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
  const [showExitModal, setShowExitModal] = useState(false);

  // Summary state
  const [summaryReleased, setSummaryReleased] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showExitModal) setShowExitModal(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showExitModal]);

  // ─── Unlock Speech Synthesis on first interaction ──────────────────
  useEffect(() => {
    const unlockAudio = () => {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // ─── useClassroomSync with new callbacks ────────────────────────
  const onSummaryReleasedCb = useCallback(() => {
    setSummaryReleased(true);
  }, []);

  const onLeaderboardReleasedCb = useCallback(() => {
    // If socket isn't directly available in this scope, we can check result
    const saved = localStorage.getItem(`student_session_${sessionCode}`);
    const roll = saved ? JSON.parse(saved).roll : null;
    if (roll) {
      // Re-trigger the result check effect by some state, or just emit manually?
      // It's cleaner to just update a local trigger state
      setCheckResultTrigger(prev => prev + 1);
    }
  }, [sessionCode]);

  const [checkResultTrigger, setCheckResultTrigger] = useState(0);

  const { projectorState, broadcastEvent, socket, requestLifeline, requestWildcard, checkStudentStatus } =
    useClassroomSync(sessionCode, "student", null, {
      onSummaryReleased: onSummaryReleasedCb,
      onLeaderboardReleased: onLeaderboardReleasedCb,
      onWildcardApproved: (data) => {
        if (data?.roll && studentInfo?.roll && String(data.roll) !== String(studentInfo.roll)) return;
        
        // Un-lock locally
        if (typeof window.unlockStudentFn === "function") window.unlockStudentFn();
        setPleadStatus("idle");
        toast.success("🎉 Wildcard entry approved! You are back in the quiz.");
      },
      onWildcardRejected: (data) => {
        if (data?.roll && studentInfo?.roll && String(data.roll) !== String(studentInfo.roll)) return;
        
        setPleadStatus("rejected");
        toast.error(data.reason || "Wildcard entry rejected");
      },
      onViolationUpdate: (data) => {
        if (data?.roll && studentInfo?.roll && String(data.roll) === String(studentInfo.roll)) {
           if (data.locked) {
             if (typeof window.lockStudentLocallyFn === "function") window.lockStudentLocallyFn();
           } else if (data.violationCount === 0) {
             // Only unlock if teacher explicitly unlocked or reset violations!
             if (typeof window.unlockStudentFn === "function") window.unlockStudentFn();
             setPleadStatus("idle");
             toast.success("✅ You have been unlocked by your teacher! You can continue.");
           }
        }
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

    // Announce presence on reconnect/refresh so the teacher's dashboard recovers the student
    broadcastEvent("STUDENT_JOIN", studentInfo);

    socket.emit("check_lifelines", { sessionCode, roll }, (res) => {
      if (res && typeof res.remaining === "number") {
        setLifelinesRemaining(res.remaining);
      }
    });

    // Also check student lock/rejected status from server (server-authoritative)
    checkStudentStatus(roll).then((res) => {
      if (res?.success) {
        if (res.locked) {
          if (typeof window.lockStudentLocallyFn === "function") window.lockStudentLocallyFn();
        }
        if (res.rejected) {
          setPleadStatus("rejected");
        }
      }
    });

    // Also check if summary was already released
    socket.emit("check_summary", { sessionCode, roll }, (res) => {
      if (res?.summaryReleased) {
        setSummaryReleased(true);
      }
    });
  }, [socket, sessionCode, studentInfo, checkStudentStatus, broadcastEvent]);

  // ─── Leaderboard / personal result ──────────────────────────────
  useEffect(() => {
    if (!socket || !studentInfo) return;

    socket.emit("check_result", { sessionCode, roll: studentInfo.roll }, (res) => {
      if (res?.success) {
        setPersonalResult(res.result);
        setSanitizedLeaderboard(res.leaderboard);
      }
    });
  }, [socket, sessionCode, studentInfo, checkResultTrigger]);

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
    lockStudentLocally,
  } = useQuizRestrictions({
    enabled: isQuizActive,
    onViolation: handleViolation,
    fullscreenRequired: projectorState?.fullscreenRequired ?? false,
    currentQuestionIndex: currentQIndex ?? 0,
  });

  useEffect(() => {
    window.unlockStudentFn = unlockStudent;
    window.lockStudentLocallyFn = lockStudentLocally;
  }, [unlockStudent, lockStudentLocally]);

  // ─── Countdown Audio ───────────────────────────────────────────────
  const speakCountdown = useCallback((text) => {
    try {
      if (!window.speechSynthesis) return;
      
      // Cancel any ongoing speech to ensure the current number is spoken immediately
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a female voice
      const femaleVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Victoria') || 
        v.name.includes('Zira') ||
        v.name.includes('Karen') ||
        v.name.includes('Moira') ||
        v.name.includes('Google UK English Female')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.3; // Slightly faster for urgency
      utterance.pitch = 1.3; // Higher pitch for a more female-like tone as fallback
      utterance.volume = 1;
      
      // Use setTimeout to allow the cancel() to take effect before speaking, fixing a bug in Chrome
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.log('Speech error:', e);
    }
  }, []);

  const prevTimeRef = useRef(projectorState?.timeRemaining);
  useEffect(() => {
    const time = projectorState?.timeRemaining;
    if (time !== undefined && time !== prevTimeRef.current && projectorState?.quizStarted && !projectorState?.quizCompleted) {
      if (time <= 5 && time > 0) {
        const words = { 5: "five", 4: "four", 3: "three", 2: "two", 1: "one" };
        speakCountdown(words[time] || time.toString());
      } else if (time === 0 && prevTimeRef.current > 0) {
        speakCountdown("zero");
      }
      prevTimeRef.current = time;
    }
  }, [projectorState?.timeRemaining, projectorState?.quizStarted, projectorState?.quizCompleted, speakCountdown]);

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

  // ─── Result screen back guard (Top level) ──────────────
  useEffect(() => {
    if (!projectorState?.quizCompleted || !personalResult) return;
    
    if (!showLeaderboard) {
      window.history.pushState({ result: true }, "");
    }
    
    const handler = (e) => {
      if (showLeaderboard) {
        setShowLeaderboard(false);
      } else {
        setShowExitModal(true);
        window.history.pushState({ result: true }, "");
      }
    };
    
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [projectorState?.quizCompleted, personalResult, showLeaderboard]);

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

  const getAvatar = (name, size = 40) => {
    const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    const bg = colors[idx];
    const initials = name ? name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() : "?";
    return { bg, initials };
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Exit confirmation modal component ───────────────────────────
  const ExitConfirmModal = ({ onCancel, onExit }) => (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-gray-900 font-black text-xl mb-2">Exit this page?</h3>
        <p className="text-gray-500 text-sm mb-6">Are you sure you want to go back? You'll return to the result screen.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onExit}
            className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold text-base hover:bg-red-600 active:scale-95 transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );


  // ─── Quiz Completed views ─────────────────────────────────────────
  if (quizCompleted) {
    if (showLeaderboard && sanitizedLeaderboard) {
      const top3 = sanitizedLeaderboard.slice(0, 3);
      const rest = sanitizedLeaderboard.slice(3);
      const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
      const podiumHeights = ["h-24","h-32","h-20"];
      const podiumColors = ["bg-gray-400","bg-yellow-400","bg-amber-600"];
      const crownColors = ["text-gray-300","text-yellow-400","text-amber-600"];

      return (
        <div className="min-h-screen flex flex-col" style={{background:"linear-gradient(160deg,#0d1b3e 0%,#1a2a5e 50%,#0d2240 100%)"}}>
          {/* Header */}
          <header className="flex justify-between items-center px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-white font-bold text-lg leading-tight">Leaderboard</div>
                <div className="text-blue-300 text-xs">Top Performers of This Quiz</div>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 bg-blue-600/70 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              <ArrowRight size={14} className="rotate-180" /> Back to Result
            </button>
          </header>

          {/* Podium */}
          <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-2">
            {podiumOrder.map((student, i) => {
              if (!student) return null;
              const isMe = student.roll === studentInfo.roll;
              const av = getAvatar(student.name);
              const rankBadge = [2,1,3][i];
              return (
                <div key={student.roll} className="flex flex-col items-center" style={{minWidth:"80px"}}>
                  {/* Crown */}
                  <div className={`text-2xl mb-1 ${crownColors[i]}`}>{rankBadge===1?"👑":rankBadge===2?"🥈":"🥉"}</div>
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 ${isMe?"border-yellow-300":"border-white/30"} shadow-lg mb-1`}
                    style={{background:av.bg}}>
                    {av.initials}
                  </div>
                  <div className={`text-white text-xs font-bold text-center leading-tight mb-1 ${isMe?"text-yellow-300":""}`}>
                    {student.name}{isMe?" (You)":""}
                  </div>
                  {/* Podium block */}
                  <div className={`w-20 ${podiumHeights[i]} ${podiumColors[i]} rounded-t-xl flex flex-col items-center justify-start pt-2`}>
                    <span className="text-white font-black text-lg">{rankBadge}</span>
                    <div className="mt-1 bg-white/20 rounded-lg px-2 py-0.5">
                      <span className="text-white font-bold text-sm">{student.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List */}
          <div className="flex-1 bg-white rounded-t-3xl overflow-y-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sanitizedLeaderboard.map((student) => {
                  const isMe = student.roll === studentInfo.roll;
                  const av = getAvatar(student.name);
                  let rankEl;
                  if (student.rank === 1) rankEl = <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-white text-xs font-black">1</div>;
                  else if (student.rank === 2) rankEl = <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-black">2</div>;
                  else if (student.rank === 3) rankEl = <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-black">3</div>;
                  else rankEl = <span className="text-gray-400 font-bold text-sm">{student.rank}</span>;

                  return (
                    <tr key={student.roll} className={isMe ? "bg-indigo-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-3">{rankEl}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow"
                            style={{background:av.bg}}>
                            {av.initials}
                          </div>
                          <span className={`font-semibold text-sm ${isMe ? "text-indigo-700" : "text-gray-800"}`}>
                            {student.name}{isMe ? " (You)" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-800">{student.score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (personalResult) {
      // Confetti ribbons
      const ribbons = [
        {top:"8%",left:"5%",rotate:-30,color:"#ffd700",delay:"0s",w:8,h:32},
        {top:"12%",right:"8%",rotate:25,color:"#3b82f6",delay:"0.3s",w:6,h:24},
        {top:"20%",left:"15%",rotate:15,color:"#ef4444",delay:"0.6s",w:7,h:28},
        {top:"5%",right:"20%",rotate:-20,color:"#ffd700",delay:"0.1s",w:9,h:20},
        {top:"30%",right:"5%",rotate:40,color:"#8b5cf6",delay:"0.4s",w:6,h:30},
        {top:"40%",left:"3%",rotate:-15,color:"#ef4444",delay:"0.7s",w:8,h:22},
        {top:"15%",left:"40%",rotate:60,color:"#3b82f6",delay:"0.2s",w:5,h:18},
        {top:"25%",right:"35%",rotate:-45,color:"#ffd700",delay:"0.5s",w:7,h:26},
      ];
      const myRank = personalResult.rank;

      const handleExitQuiz = () => {
        localStorage.removeItem(`student_session_${sessionCode}`);
        navigate("/");
      };

      const handleShowLeaderboard = () => {
        window.history.pushState({ view: 'leaderboard' }, "");
        setShowLeaderboard(true);
      };

      return (
        <div className="min-h-[100dvh] w-full flex flex-col overflow-hidden relative"
          style={{background:"#0a0127"}}
        >
          {/* Exit Confirmation Modal */}
          {showExitModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-[#1a0b40] border border-purple-500/30 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.3)] max-w-xs w-full p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="text-white font-black text-xl mb-2">Exit Quiz?</h3>
                <p className="text-white/60 text-sm mb-6">Are you sure you want to leave and return to the home page?</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-3 rounded-2xl border-2 border-white/20 text-white font-bold text-base hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Cancel — Stay Here
                  </button>
                  <button
                    onClick={handleExitQuiz}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold text-base hover:opacity-90 shadow-lg active:scale-95 transition-all"
                  >
                    Yes, Exit Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Animations */}
          <style>{`
            @keyframes floatRibbon {
              0%   { transform: translateY(0px) rotate(var(--rot)); opacity:1; }
              50%  { transform: translateY(18px) rotate(calc(var(--rot) + 10deg)); opacity:0.9; }
              100% { transform: translateY(0px) rotate(var(--rot)); opacity:1; }
            }
            @keyframes bounceTrophy {
              0%,100% { transform: translateY(0) scale(1) rotate(0deg); }
              25%     { transform: translateY(-5px) scale(1.02) rotate(-2deg); }
              50%     { transform: translateY(-10px) scale(1.05) rotate(0deg); }
              75%     { transform: translateY(-5px) scale(1.02) rotate(2deg); }
            }
            @keyframes glowPulse {
              0%,100% { opacity: 0.5; transform: scale(1); }
              50%     { opacity: 0.8; transform: scale(1.2); }
            }
            @keyframes spinSlow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .ribbon-float { animation: floatRibbon 3s ease-in-out infinite; }
            .trophy-bounce { animation: bounceTrophy 3s ease-in-out infinite; }
            .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
            .ring-spin { animation: spinSlow 10s linear infinite; }
          `}</style>

          {/* Background Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[60vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/10 to-transparent pointer-events-none" />

          {/* Ribbons */}
          {ribbons.map((r, i) => (
            <div key={i} className="ribbon-float pointer-events-none absolute rounded-sm opacity-90 shadow-lg"
              style={{
                top:r.top, left:r.left, right:r.right,
                width:r.w, height:r.h,
                background:r.color,
                '--rot':`${r.rotate}deg`,
                transform:`rotate(${r.rotate}deg)`,
                animationDelay:r.delay,
                borderRadius:"3px",
                zIndex:1
              }}
            />
          ))}

          {/* Header Content */}
          <div className="relative z-10 flex flex-col items-center pt-8 px-4 w-full">
            {/* Pill */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-400 rounded-full px-5 py-1.5 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.5)] mb-4">
              <span className="text-yellow-400 text-sm">👑</span>
              <span className="text-white text-xs font-black tracking-widest uppercase">Result Released</span>
              <span className="text-yellow-400 text-sm">✨</span>
            </div>

            {/* Title */}
            <h2 className="text-white font-black text-3xl sm:text-4xl leading-tight mb-1">Congratulations,</h2>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-3xl drop-shadow-md">›</span>
              <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 font-black text-3xl sm:text-4xl italic drop-shadow-md">
                {studentInfo.name}!
              </h3>
              <span className="text-yellow-400 text-3xl drop-shadow-md">‹</span>
              <span className="text-2xl ml-1 -rotate-12 drop-shadow-md">🎓</span>
            </div>
          </div>

          {/* Trophy Area */}
          <div className="relative z-10 flex justify-center items-center mt-10 mb-8 flex-1 min-h-[220px]">
            {/* Pedestal Base */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 rounded-[100%] bg-purple-900/50 border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.6)]" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-10 rounded-[100%] bg-purple-800 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
            
            {/* Rotating Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-yellow-500/20 rounded-full ring-spin rotate-[60deg] scale-y-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-indigo-400/30 rounded-full ring-spin rotate-[-30deg] scale-y-50" style={{animationDirection: "reverse"}} />

            {/* Glowing Backdrop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-500/20 rounded-full blur-2xl glow-pulse" />

            {/* Trophy Icon */}
            <div className="trophy-bounce text-[120px] select-none leading-none relative z-10" style={{filter:"drop-shadow(0 10px 25px rgba(251,191,36,0.6))"}}>
              🏆
            </div>

            {/* Rank Badge attached to Trophy */}
            <div className="absolute bottom-10 right-[calc(50%-55px)] w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 p-[3px] shadow-2xl z-20">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-yellow-100 to-yellow-400 flex flex-col items-center justify-center shadow-inner">
                <span className="text-amber-900 font-black text-xl leading-none tracking-tighter">#{myRank}</span>
              </div>
            </div>
          </div>

          {/* Bottom Card Area */}
          <div className="relative z-10 px-4 w-full flex flex-col gap-3 pb-6">
            {/* Score Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
              {/* Internal glow */}
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              
              <div className="flex items-center gap-2 mb-1 text-white/90">
                <span className="text-yellow-400 text-sm">👑</span>
                <span className="font-bold text-sm tracking-widest uppercase">Your Score</span>
              </div>
              
              <div className="flex items-center gap-6">
                <span className="text-yellow-300/40 text-4xl">🌿</span>
                <span className="text-white font-black text-6xl italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {personalResult.score}
                </span>
                <span className="text-yellow-300/40 text-4xl scale-x-[-1]">🌿</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-lg">📋</span>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-wider leading-none mb-1">Total<br/>Questions</div>
                  <div className="text-purple-700 font-black text-xl leading-none">{personalResult.totalQuestions}</div>
                </div>
              </div>
              
              <div className="bg-[#dcfce7] rounded-2xl p-3 flex items-center gap-3 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-wider leading-none mb-1">Completion</div>
                  <div className="text-green-700 font-black text-xl leading-none">100%</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={handleShowLeaderboard}
              className="w-full py-4 rounded-2xl bg-white text-blue-900 font-black text-base flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
            >
              <Trophy size={20} className="text-blue-600" />
              View Leaderboard
              <ArrowRight size={18} className="text-blue-600" />
            </button>

            {summaryReleased && (
              <button
                onClick={() => navigate(`/student/summary?session=${sessionCode}&roll=${studentInfo.roll}`)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 font-black text-base flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
              >
                <BookMarked size={20} />
                View Answer Summary
                <ArrowRight size={18} />
              </button>
            )}

            <button
              onClick={() => setShowExitModal(true)}
              className="w-full py-3 mt-1 flex items-center justify-center gap-2 text-white/60 font-bold hover:text-white transition-colors"
            >
              🏠 Close &amp; Return Home
            </button>
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

  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  // ─── Active Quiz UI ───────────────────────────────────────────────
  if (quizStarted && !currentQuestion) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold mb-2 text-base-content">Loading Question...</h2>
        <p className="text-base-content/70">Please wait while the quiz data syncs.</p>
      </div>
    );
  }

  return (
    <div className="quiz-active-screen h-[100dvh] overflow-hidden bg-base-200 flex flex-col relative">

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

      {/* ── Persistent Violation Warning Modal (Warning 1 & 2) ────────────────── */}
      {showWarning && !isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl max-w-md w-full border-2 border-warning overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-5 ${warningLevel >= 2 ? "bg-amber-600" : "bg-amber-500"} text-white flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl leading-tight">
                  {warningLevel >= 2 ? "⚠️ Second Warning!" : "⚠️ Quiz Warning!"}
                </h3>
                <p className="text-white/90 text-xs font-bold mt-0.5">
                  Warning {warningLevel} of 3
                </p>
              </div>
            </div>
            
            <div className="p-6 text-center">
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-5 text-left">
                <p className="text-base-content text-sm leading-relaxed font-medium">
                  {warningLevel >= 2
                    ? "Attention! You switched away from the quiz or violated focus guidelines. If you leave the screen one more time (3rd violation), you will be locked out of the quiz."
                    : "You switched tabs, minimized the window, or lost screen focus. Please remain strictly on this screen to take your quiz."}
                </p>
              </div>

              <p className="text-xs text-base-content/60 mb-5 font-semibold">
                You must click below to confirm and return to your questions.
              </p>

              <button
                onClick={dismissWarning}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                I Understand — Stay on Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Locked Screen Popup ────────────────── */}
      {isLocked && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl max-w-md w-full border-2 border-error/50 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-error text-error-content p-6 text-center relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">You are Locked</h2>
              <p className="text-white/80 text-xs font-semibold mt-1 truncate px-2">
                Student: {studentInfo?.name} • Roll: {studentInfo?.roll}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <div className="bg-error/10 border border-error/20 rounded-2xl p-4 mb-5 text-left">
                <p className="text-base-content text-sm font-medium leading-relaxed">
                  You have been locked out of the quiz due to multiple integrity violations or teacher action.
                </p>
                <p className="text-error font-bold text-xs mt-2">
                  You cannot proceed until you are unlocked by your teacher or your wildcard entry request is approved.
                </p>
              </div>

              {/* Wildcard Section */}
              {projectorState?.wildcardEnabled ? (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-2xl p-5 mb-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl animate-bounce">
                    🧞‍♂️
                  </div>
                  <h4 className="font-bold text-base-content text-base mb-1">Wildcard Entry Available!</h4>
                  <p className="text-xs text-base-content/70 mb-4 leading-relaxed">
                    Your teacher has opened wildcard entries. You can plead to re-enter the quiz.
                  </p>

                  {pleadStatus === "idle" && (
                    <button
                      onClick={handlePleadForWildcard}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} /> Plead for Wildcard Entry
                    </button>
                  )}

                  {pleadStatus === "pending" && (
                    <div className="p-3 bg-purple-100/80 dark:bg-purple-900/50 rounded-xl text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      Request sent! Waiting for teacher approval...
                    </div>
                  )}

                  {pleadStatus === "rejected" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-bold">
                        ❌ Your wildcard request was rejected. You remain locked.
                      </div>
                      <button
                        onClick={handlePleadForWildcard}
                        className="text-xs text-purple-600 hover:underline font-bold cursor-pointer"
                      >
                        Try Pleading Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-base-200 rounded-2xl p-5 mb-3 text-center border border-base-300">
                  <Clock className="w-6 h-6 text-base-content/40 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold text-base-content/80">Wildcard entry is currently disabled</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Please inform your teacher to unlock your roll number ({studentInfo?.roll}) or open wildcard entry.
                  </p>
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

      <header className="bg-primary text-white p-2 sm:p-4 shadow-md flex justify-between items-center shrink-0 relative z-10 gap-1 sm:gap-4">
        <div className="relative inline-flex pr-3 items-center shrink-0">
          <div className="font-bold truncate max-w-[55px] sm:max-w-[140px] text-sm sm:text-base">{studentInfo.name}</div>
          {violations > 0 && (
            <div className="absolute -top-1.5 right-0 bg-red-600 text-white text-[10px] w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold shadow border border-red-400">
              {violations}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="font-bold text-primary-content text-xs sm:text-base whitespace-nowrap">Q {currentQuestionIndex + 1}/{questions.length}</div>
          <div className="relative">
            {projectorState?.timeRemaining <= 10 && projectorState?.timeRemaining >= 0 && (
              <div className="absolute inset-0 bg-red-400 rounded-md animate-ping opacity-75 z-0" />
            )}
            <div className={`relative z-10 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm shrink-0 flex items-center gap-1 sm:gap-1.5 font-mono font-bold shadow-inner border transition-colors ${
              projectorState?.timeRemaining <= 10 && projectorState?.timeRemaining >= 0
                ? "bg-red-500 animate-[pulse_0.5s_ease-in-out_infinite] border-red-400 text-white shadow-red-900/50"
                : "bg-green-600 border-green-500 text-white shadow-green-900/50"
            }`}>
              <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
              {formatTime(projectorState?.timeRemaining || 0)}
            </div>
          </div>
        </div>
        <div className="bg-white/20 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm shrink-0 truncate max-w-[90px] sm:max-w-none">
          Roll: {studentInfo.roll}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-2 overflow-y-auto relative z-10">
        {/* Question card */}
        <div className="bg-base-100 rounded-md shadow-sm border border-base-300 p-3 mb-2">
          <h2 className="text-lg font-bold text-base-content leading-snug whitespace-pre-wrap">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 flex-1">
          {(currentQuestion.options || []).map((option, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = myAnswer === option;
            const correctOption = currentQuestion.correctAnswer || currentQuestion.correctOption;
            const isCorrectAnswer = isAnswerRevealed && option === correctOption;
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
                className={`w-full p-2 rounded-md border-2 text-left flex items-center gap-2 transition-all ${btnClass}`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold shrink-0 text-sm ${labelClass}`}>
                  {isCorrectAnswer ? <CheckCircle2 size={20} /> : isIncorrectSelected ? <XCircle size={20} /> : isHinted ? "✨" : label}
                </div>
                <span className="font-medium text-lg flex-1">{option}</span>
                {isHinted && <span className="text-amber-600 text-xs font-bold">Jinni's Hint</span>}
              </button>
            );
          })}

          {/* Explanation moved below options */}
          {isAnswerRevealed && currentQuestion.explanation && (
            <div className="mt-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm shadow-sm">
                <h4 className="font-bold text-blue-800 mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={16} /> Explanation
                </h4>
                <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Bottom bar — Chirag lives here, no overlap ─────────────── */}
      <div className="shrink-0 bg-base-100 border-t border-base-300 relative z-10">

        {/* Chirag anchored to top-left of bar, pops above it */}
        <div className="absolute -top-12 left-3 z-50">
          <ChiragLifeline
            lifelinesRemaining={lifelinesRemaining}
            onActivate={handleLifelineActivate}
            disabled={!!myAnswer || isAnswerRevealed || isLocked || !isQuizActive}
            onHintReceived={handleHintReceived}
          />
        </div>

        {/* "Answer submitted" — pl-16 keeps it right of Chirag */}
        {myAnswer && !isAnswerRevealed && (
          <div className="pl-16 pr-4 pt-2 pb-0 text-primary text-xs font-semibold animate-pulse flex items-center gap-1">
            <CheckCircle2 size={13} /> Answer submitted. Waiting for results...
          </div>
        )}

        {/* Session info */}
        <div className="px-4 py-2 flex items-center justify-end">
          <div className="text-right">
            <div className="text-xs text-base-content/50 font-mono">Session</div>
            <div className="text-xs font-bold text-base-content/70">{sessionCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActive;
