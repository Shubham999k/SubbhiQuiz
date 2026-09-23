import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuiz } from "../../../app/providers/QuizContext";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import { api } from "../../../services/api";
import {
  CheckCircle2,
  Play,
  Pause,
  Square,
  QrCode,
  Users,
  Lock,
  Unlock,
  GraduationCap,
  Copy,
  BookMarked,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  UserPlus,
  Clock,
  MoreVertical,
} from "lucide-react";
import { QRCodeSVG as QrCodeComponent } from "qrcode.react";
import toast from "react-hot-toast";
import Dropdown from "../../../components/ui/Dropdown";

const ClassroomTeacher = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session") || quizId.toUpperCase();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (sessionCode) {
      localStorage.setItem("active_teacher_session", JSON.stringify({ sessionCode, quizId }));
    }
  }, [sessionCode, quizId]);

  const { currentQuiz, questions, submitQuiz, setAnswer } = useQuiz();

  // ── Core quiz state ──────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(currentQuiz?.isCustom ? currentQuiz.timeLimit : 60);
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrShownOnce, setQrShownOnce] = useState(false);

  // ── Student tracking ─────────────────────────────────────────────
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [cumulativeStudentAnswers, setCumulativeStudentAnswers] = useState({});
  const [studentScores, setStudentScores] = useState({});
  const [studentCorrectCount, setStudentCorrectCount] = useState({});
  const [resultsReleased, setResultsReleased] = useState(false);

  const quizCompletedRef = useRef(quizCompleted);
  useEffect(() => {
    quizCompletedRef.current = quizCompleted;
  }, [quizCompleted]);

  useEffect(() => {
    return () => {
      if (!quizCompletedRef.current) {
        toast("Session is running in the background. You can resume it from the notification bell.", { icon: "🔔", duration: 5000 });
      }
    };
  }, []);

  // ── NEW: Wildcard state ──────────────────────────────────────────
  const [wildcardEnabled, setWildcardEnabledState] = useState(false);
  const [wildcardRequests, setWildcardRequests] = useState([]);
  const [showWildcardPanel, setShowWildcardPanel] = useState(false);

  // ── NEW: Pending Join state ──────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);

  // ── NEW: Integrity / violations state ────────────────────────────
  const [studentViolations, setStudentViolations] = useState({}); // { roll: { count, locked, latest } }
  const [activeDropdown, setActiveDropdown] = useState(null);

  // ── NEW: Summary release state ───────────────────────────────────
  const [summaryReleased, setSummaryReleased] = useState(false);

  // ── NEW: UI Redesign State ───────────────────────────────────────
  const [studentFilter, setStudentFilter] = useState("all"); // 'all', 'focused', 'unfocused'
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [viewAllTab, setViewAllTab] = useState("all");
  const [viewAllSearchQuery, setViewAllSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [joinMode, setJoinMode] = useState("Auto Allow");
  const [autoNext, setAutoNext] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);

  // Show confirm modal helper
  const showConfirm = (opts) =>
    new Promise((resolve) => {
      setConfirmModal({ ...opts, onConfirm: resolve });
    });

  // ── Socket callbacks ─────────────────────────────────────────────
  const handleWildcardRequest = useCallback((data) => {
    const { request } = data;
    setWildcardRequests((prev) => {
      if (prev.find((r) => r.roll === request.roll)) return prev;
      setTimeout(() => {
        toast.success(`Wildcard request from ${request.name} (${request.roll})`, { duration: 5000, icon: '🪔' });
      }, 0);
      return [...prev, request];
    });
  }, []);

  const handleViolationUpdate = useCallback((data) => {
    const { roll, violationCount, locked, latestViolation } = data;
    setStudentViolations((prev) => ({
      ...prev,
      [roll]: { count: violationCount, locked, latest: latestViolation },
    }));
  }, []);

  // ── Student event handler (answers + joins) ──────────────────────
  const handleReceiveEvent = useCallback(
    (event) => {
      if (event.type === "STUDENT_JOIN") {
        const { name, roll, batch } = event.payload;
        if (joinMode === "Manual Allow") {
          setPendingRequests((prev) => {
            if (!prev.find((s) => s.roll === roll)) {
              setTimeout(() => {
                toast.success(`Join request from ${name} (${roll})`, { duration: 5000, icon: '👋' });
              }, 0);
              return [...prev, { name, roll, batch: batch || "", timestamp: Date.now() }];
            }
            return prev;
          });
        } else {
          setJoinedStudents((prev) => {
            if (!prev.find((s) => s.roll === roll)) {
              return [...prev, { name, roll, batch: batch || "", timestamp: Date.now() }];
            }
            return prev;
          });
        }
      } else if (event.type === "STUDENT_ANSWER") {
        const { roll, option, timeRemaining } = event.payload;
        setStudentAnswers((prev) => ({ ...prev, [roll]: { option, timeRemaining } }));

        if (questions && questions[currentQuestionIndex]) {
          const questionId = questions[currentQuestionIndex].id;
          setCumulativeStudentAnswers((prev) => {
            const studentHistory = prev[roll] || {};
            return { ...prev, [roll]: { ...studentHistory, [questionId]: option } };
          });
        }
      }
    },
    [questions, currentQuestionIndex, joinMode]
  );

  const {
    broadcastState,
    releaseResults,
    saveStateSnapshot,
    setWildcardEnabled,
    approveWildcard,
    rejectWildcard,
    lockStudent,
    releaseSummary,
  } = useClassroomSync(sessionCode, "teacher", handleReceiveEvent, {
    onWildcardRequest: handleWildcardRequest,
    onViolationUpdate: handleViolationUpdate,
  });

  // ── Class response tallies ───────────────────────────────────────
  const classResponses = React.useMemo(() => {
    const responses = { A: 0, B: 0, C: 0, D: 0 };
    if (!questions?.length) return responses;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return responses;
    Object.values(studentAnswers).forEach(({ option }) => {
      const optIdx = currentQuestion.options.indexOf(option);
      if (optIdx !== -1) {
        const label = String.fromCharCode(65 + optIdx);
        responses[label] = (responses[label] || 0) + 1;
      }
    });
    return responses;
  }, [studentAnswers, currentQuestionIndex, questions]);

  // ── Broadcast state on any change ───────────────────────────────
  useEffect(() => {
    const safeQuestions = questions
      ? questions.map((q, idx) => {
        const isCurrentAndRevealed = idx === currentQuestionIndex && isAnswerRevealed;
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          ...(isCurrentAndRevealed ? { correctAnswer: q.correctAnswer, explanation: q.explanation } : {}),
        };
      })
      : [];

    broadcastState({
      questions: safeQuestions,
      currentQuiz,
      currentQuestionIndex,
      selectedOption,
      isAnswerRevealed,
      classResponses,
      timeRemaining,
      isTimerPaused,
      quizCompleted,
      resultsReleased,
      sessionCode,
      showQR,
      quizStarted,
      joinedCount: joinedStudents.length,
      studentScores,
      joinedStudents,
      wildcardEnabled,
    });
  }, [
    questions, currentQuiz, currentQuestionIndex, selectedOption, isAnswerRevealed,
    classResponses, timeRemaining, isTimerPaused, quizCompleted, resultsReleased,
    sessionCode, showQR, quizStarted, joinedStudents.length, studentScores, joinedStudents,
    wildcardEnabled, broadcastState,
  ]);

  // ── Save quiz snapshot on question change (for wildcard joins) ───
  useEffect(() => {
    if (!quizStarted || !questions?.length) return;
    saveStateSnapshot({
      questions,
      currentQuestionIndex,
      timeRemaining,
      quizStarted,
      currentQuiz,
    });
  }, [quizStarted, currentQuestionIndex, questions, timeRemaining, currentQuiz, saveStateSnapshot]);

  // ── Timer logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (isTimerPaused || quizCompleted || timeRemaining <= 0 || !quizStarted) return;
    const timerId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearInterval(timerId); setIsTimerPaused(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [isTimerPaused, timeRemaining, quizCompleted, quizStarted]);


  // ── Nav guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!questions || questions.length === 0) navigate("/dashboard");
  }, [questions, navigate]);

  // ── Keyboard shortcuts ───────────────────────────────────────────
  const resetQuestionState = useCallback(() => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setStudentAnswers({});
    setTimeRemaining(currentQuiz?.isCustom ? currentQuiz.timeLimit : 60);
    setIsTimerPaused(true);
  }, [currentQuiz]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      resetQuestionState();
    }
  }, [currentQuestionIndex, questions, resetQuestionState]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      resetQuestionState();
    }
  }, [currentQuestionIndex, resetQuestionState]);

  const revealAnswer = useCallback(() => {
    if (isAnswerRevealed) return;
    const currentQuestion = questions[currentQuestionIndex];
    setIsAnswerRevealed(true);
    setStudentScores((prev) => {
      const next = { ...prev };
      Object.entries(studentAnswers).forEach(([roll, answerData]) => {
        if (answerData.option === currentQuestion.correctAnswer) {
          next[roll] = (next[roll] || 0) + 100 + (answerData.timeRemaining || 0);
        }
      });
      return next;
    });
    setStudentCorrectCount((prev) => {
      const next = { ...prev };
      Object.entries(studentAnswers).forEach(([roll, answerData]) => {
        if (answerData.option === currentQuestion.correctAnswer) {
          next[roll] = (next[roll] || 0) + 1;
        }
      });
      return next;
    });
    setIsTimerPaused(true);
  }, [isAnswerRevealed, questions, currentQuestionIndex, studentAnswers]);

  // ── Handle quiz end ──────────────────────────────────────────────
  const handleEndQuiz = async () => {
    const ok = await showConfirm({
      title: "End Quiz",
      message: "Are you sure you want to end the quiz? Students will no longer be able to answer.",
      confirmLabel: "End Quiz",
      confirmClass: "bg-error hover:bg-red-600 text-white",
    });
    if (!ok) return;

    setQuizCompleted(true);
    setIsTimerPaused(true);
    setConfirmModal(null);
    localStorage.removeItem("active_teacher_session");
  };

  const handleReleaseResults = async () => {
    const ok = await showConfirm({
      title: "Release Results",
      message: "Students will be able to see the final leaderboard and their scores.",
      confirmLabel: "Release Results",
      confirmClass: "bg-indigo-600 hover:opacity-90 text-white",
    });
    setConfirmModal(null);
    if (!ok) return;

    setResultsReleased(true);
    releaseResults({
      studentScores,
      joinedStudents,
      totalQuestions: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      cumulativeAnswers: cumulativeStudentAnswers,
    });
  };

  const handleReleaseSummary = async () => {
    const ok = await showConfirm({
      title: "Release Answer Summary",
      message: "Students will be able to see their answers, correct answers, and explanations for each question.",
      confirmLabel: "Release Summary",
      confirmClass: "bg-amber-500 hover:bg-amber-600 text-white",
    });
    setConfirmModal(null);
    if (!ok) return;

    setSummaryReleased(true);
    releaseSummary();
    toast.success("📖 Answer summary released to students!");
  };

  const handleToggleWildcard = () => {
    const newVal = !wildcardEnabled;
    setWildcardEnabledState(newVal);
    setWildcardEnabled(newVal);
    toast(newVal ? "🪔 Wildcard entry enabled" : "Wildcard entry disabled", { duration: 2000 });
  };

  const handleApproveWildcard = (roll) => {
    approveWildcard(roll);
    setWildcardRequests((prev) => prev.filter((r) => String(r.roll) !== String(roll)));
    setStudentViolations((prev) => {
      const copy = { ...prev };
      delete copy[roll];
      return copy;
    });
    const req = wildcardRequests.find((r) => String(r.roll) === String(roll));
    if (req) {
      setJoinedStudents((prev) => {
        if (!prev.find((s) => String(s.roll) === String(req.roll))) {
          return [...prev, { name: req.name, roll: req.roll, batch: req.batch || "", timestamp: Date.now(), isWildcard: true }];
        }
        return prev;
      });
      toast.success(`✅ Wildcard approved for ${req.name}`);
    } else {
      toast.success(`✅ Wildcard approved for ${roll}`);
    }
    setShowWildcardPanel(false);
  };

  const handleLockStudent = (roll) => {
    lockStudent(roll);
    setStudentViolations((prev) => ({
      ...prev,
      [roll]: {
        count: Math.max(prev[roll]?.count || 0, 3),
        locked: true,
      }
    }));
    toast.error(`🔒 Student ${roll} has been locked.`);
  };

  const handleRejectWildcard = (roll) => {
    rejectWildcard(roll);
    setWildcardRequests((prev) => prev.filter((r) => String(r.roll) !== String(roll)));
    toast(`❌ Wildcard rejected for ${roll}`, { duration: 2000 });
    setShowWildcardPanel(false);
  };

  const handleApprovePending = (roll) => {
    setPendingRequests((prev) => prev.filter((r) => String(r.roll) !== String(roll)));
    const req = pendingRequests.find((r) => String(r.roll) === String(roll));
    if (req) {
      setJoinedStudents((prev) => {
        if (!prev.find((s) => String(s.roll) === String(req.roll))) {
          return [...prev, req];
        }
        return prev;
      });
      toast.success(`✅ Join request approved for ${req.name}`);
    }
    setShowPendingPanel(false);
  };

  const handleRejectPending = (roll) => {
    setPendingRequests((prev) => prev.filter((r) => String(r.roll) !== String(roll)));
    toast(`❌ Join request rejected for ${roll}`, { duration: 2000 });
    setShowPendingPanel(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const joinUrl = import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? typeof __LOCAL_IP__ !== "undefined" ? __LOCAL_IP__ : window.location.hostname
      : window.location.hostname}:${window.location.port}/student/join?session=${sessionCode}`
    : `${window.location.origin}/student/join?session=${sessionCode}`;

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;

  // ── Auto Next logic ──────────────────────────────────────────────
  useEffect(() => {
    if (timeRemaining === 0 && autoNext && quizStarted && !quizCompleted) {
      if (!isAnswerRevealed) {
        revealAnswer();
      }
      if (!isLastQuestion) {
        const t = setTimeout(() => {
          handleNext();
          setIsTimerPaused(false);
        }, 4000);
        return () => clearTimeout(t);
      }
    }
  }, [timeRemaining, autoNext, isLastQuestion, isAnswerRevealed, handleNext, revealAnswer, quizStarted, quizCompleted]);

  // ── Computed Stats ──────────────────────────────────────────────
  const pendingCount = pendingRequests.length;
  const removedCount = 0;
  const focusViolationsCount = Object.keys(studentViolations).filter(roll => studentViolations[roll] && studentViolations[roll].count > 0).length;

  const filteredStudents = joinedStudents.filter(s => {
    const vData = studentViolations[s.roll];
    const isUnfocused = vData && vData.count > 0;

    if (studentFilter === "focused" && isUnfocused) return false;
    if (studentFilter === "unfocused" && !isUnfocused) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!String(s.name).toLowerCase().includes(query) && !String(s.roll).toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* Header removed as requested */}

      {/* ── 2. Controls Row (Top Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Wildcard Entry */}
        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 flex flex-col justify-center relative transition-all hover:border-primary hover:shadow-md">
          {wildcardRequests.length > 0 && (
            <div
              onClick={() => setShowWildcardPanel(p => !p)}
              className="absolute -top-2 -right-2 bg-secondary text-secondary-content w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow cursor-pointer animate-bounce z-10"
            >
              {wildcardRequests.length}
            </div>
          )}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-secondary" />
              <h3 className="font-bold text-base-content text-sm">Wildcard Entry</h3>
            </div>
            <input 
              type="checkbox" 
              className="checkbox checkbox-accent checkbox-md" 
              checked={wildcardEnabled}
              onChange={handleToggleWildcard}
            />
          </div>
          <p className="text-xs text-base-content/60 font-medium">Allow late or rejoin requests</p>
        </div>

        {/* Join Mode */}
        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 flex flex-col justify-center transition-all hover:border-primary hover:shadow-md relative">
          {pendingRequests.length > 0 && (
            <div
              onClick={() => setShowPendingPanel(p => !p)}
              className="absolute -top-2 -right-2 bg-warning text-warning-content w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow cursor-pointer animate-bounce z-10"
            >
              {pendingRequests.length}
            </div>
          )}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              <h3 className="font-bold text-base-content text-sm">Join Mode</h3>
            </div>
            <Dropdown
              options={[
                { label: "Auto Allow", value: "Auto Allow" },
                { label: "Manual Allow", value: "Manual Allow" }
              ]}
              value={joinMode}
              onChange={(val) => {
                setJoinMode(val);
                toast.success(`Join mode set to ${val}`, { duration: 2000 });
              }}
              className="w-40"
            />
          </div>
          <p className="text-xs text-base-content/60 font-medium mt-2">Students join automatically</p>
        </div>

        {/* Auto Next */}
        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 flex flex-col justify-center transition-all hover:border-primary hover:shadow-md">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <Play size={18} className="text-info" />
              <h3 className="font-bold text-base-content text-sm">Auto Next</h3>
            </div>
            <input 
              type="checkbox" 
              className="checkbox checkbox-accent checkbox-md" 
              checked={autoNext}
              onChange={() => {
                const newVal = !autoNext;
                setAutoNext(newVal);
                toast.success(newVal ? "Auto Next enabled" : "Auto Next disabled", { duration: 2000 });
              }}
            />
          </div>
          <p className="text-xs text-base-content/60 font-medium">Move to next question automatically</p>
        </div>



        {/* Show QR Action Card */}
        <div 
          onClick={() => { setShowQR(true); setQrShownOnce(true); }}
          className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 flex flex-col justify-center text-primary cursor-pointer transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-primary" />
              <h3 className="font-bold text-primary text-sm">Show QR Code</h3>
            </div>
          </div>
          <p className="text-xs text-primary/80 font-medium">Generate joining QR</p>
        </div>
      </div>

      {/* ── Wildcard Panel Modal ──────────────────────────────────── */}
      {showWildcardPanel && wildcardRequests.length > 0 && (
        <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-3xl shadow-2xl relative max-w-2xl w-full flex flex-col border border-base-200 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowWildcardPanel(false)} className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 p-2 rounded-full hover:bg-base-200 transition-colors">
              <X size={20} />
            </button>
            <h3 className="font-bold text-base-content text-xl mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-amber-500" /> Wildcard Requests
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {wildcardRequests.map((req) => (
                <div key={req.roll} className="flex items-center justify-between bg-base-200 p-4 rounded-xl border border-base-300 shadow-sm">
                  <div>
                    <p className="font-bold text-base-content text-lg">{req.name}</p>
                    <p className="text-sm text-base-content/60 font-mono">{req.roll} {req.batch && `• ${req.batch}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveWildcard(req.roll)} className="p-2.5 bg-success/10 text-success rounded-xl hover:bg-success/20 transition-colors" title="Approve">
                      <Check size={20} />
                    </button>
                    <button onClick={() => handleRejectWildcard(req.roll)} className="p-2.5 bg-error/10 text-error rounded-xl hover:bg-error/20 transition-colors" title="Reject">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Panel Modal ──────────────────────────────────── */}
      {showPendingPanel && pendingRequests.length > 0 && (
        <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-3xl shadow-2xl relative max-w-2xl w-full flex flex-col border border-base-200 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowPendingPanel(false)} className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 p-2 rounded-full hover:bg-base-200 transition-colors">
              <X size={20} />
            </button>
            <h3 className="font-bold text-base-content text-xl mb-4 flex items-center gap-2">
              <UserPlus size={24} className="text-amber-500" /> Join Requests
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {pendingRequests.map((req) => (
                <div key={req.roll} className="flex items-center justify-between bg-base-200 p-4 rounded-xl border border-base-300 shadow-sm">
                  <div>
                    <p className="font-bold text-base-content text-lg">{req.name}</p>
                    <p className="text-sm text-base-content/60 font-mono">{req.roll} {req.batch && `• ${req.batch}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePending(req.roll)} className="p-2.5 bg-success/10 text-success rounded-xl hover:bg-success/20 transition-colors" title="Approve">
                      <Check size={20} />
                    </button>
                    <button onClick={() => handleRejectPending(req.roll)} className="p-2.5 bg-error/10 text-error rounded-xl hover:bg-error/20 transition-colors" title="Reject">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── View All Students Modal ──────────────────────────────────── */}
      {showViewAllModal && (
        <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-3xl shadow-2xl relative w-full max-w-4xl flex flex-col border border-base-200 animate-in zoom-in-95 duration-200" style={{ height: "80vh" }}>
            <button onClick={() => setShowViewAllModal(false)} className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 p-2 rounded-full hover:bg-base-200 transition-colors">
              <X size={20} />
            </button>
            <h3 className="font-bold text-base-content text-2xl mb-6 flex items-center gap-3">
              <Users size={28} className="text-primary" /> Live Students
              <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-black">
                {joinedStudents.length}
              </span>
            </h3>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
              <div className="flex bg-base-200 p-1 rounded-xl">
                <button
                  onClick={() => setViewAllTab("all")}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${viewAllTab === "all" ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/60 hover:text-base-content"}`}
                >
                  All <span className="bg-base-300 text-base-content text-xs px-2 py-0.5 rounded-full">{joinedStudents.length}</span>
                </button>
                <button
                  onClick={() => setViewAllTab("focused")}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${viewAllTab === "focused" ? "bg-base-100 text-green-600 shadow-sm" : "text-base-content/60 hover:text-green-600"}`}
                >
                  Focused <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{joinedStudents.length - focusViolationsCount}</span>
                </button>
                <button
                  onClick={() => setViewAllTab("unfocused")}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${viewAllTab === "unfocused" ? "bg-base-100 text-error shadow-sm" : "text-base-content/60 hover:text-error"}`}
                >
                  Unfocused <span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full">{focusViolationsCount}</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={viewAllSearchQuery}
                  onChange={(e) => setViewAllSearchQuery(e.target.value)}
                  className="w-full bg-base-200 border border-base-300 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:border-primary transition-all text-base-content"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-base-200">
              <table className="w-full text-left relative">
                <thead className="sticky top-0 bg-base-200/90 backdrop-blur-md text-xs font-bold text-base-content/50 uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-4 pl-6">#</th>
                    <th className="py-4">Name</th>
                    <th className="py-4">Roll No.</th>
                    <th className="py-4 text-center">Status</th>
                    <th className="py-4 text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 bg-base-100">
                  {joinedStudents
                    .filter(s => {
                      if (viewAllTab === "focused") return !studentViolations[s.roll]?.count;
                      if (viewAllTab === "unfocused") return studentViolations[s.roll]?.count > 0;
                      return true;
                    })
                    .filter(s => {
                      if (!viewAllSearchQuery) return true;
                      const q = viewAllSearchQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
                    })
                    .map((student, idx) => {
                      const vData = studentViolations[student.roll];
                      const isUnfocused = vData && vData.count > 0;
                      return (
                        <tr key={student.roll} className="hover:bg-base-200/50 group transition-colors">
                          <td className="py-4 pl-6 text-base-content/50 font-bold text-sm">{idx + 1}</td>
                          <td className="py-4 font-bold text-base-content">{student.name}</td>
                          <td className="py-4 text-base-content/60 font-mono text-sm">{student.roll} {student.batch && `• ${student.batch}`}</td>
                          <td className="py-4 text-center">
                            {isUnfocused ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error/10 text-error text-sm font-bold border border-error/20">
                                <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div> Unfocused
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 text-green-600 text-sm font-bold px-3 py-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div> Focused
                              </div>
                            )}
                          </td>
                          <td className="py-4 pr-6">
                            <div className="flex items-center justify-center gap-3">
                              {isUnfocused && vData.locked && (
                                <div className="p-2 bg-error/10 text-error rounded-lg" title="Locked">
                                  <Lock size={16} />
                                </div>
                              )}
                              {(!isUnfocused || !vData?.locked) ? (
                                <button 
                                  onClick={() => handleLockStudent(student.roll)}
                                  className="px-3 py-1.5 text-xs font-bold text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors border border-error/20 flex items-center gap-1.5"
                                >
                                  <Lock size={12} /> Lock
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleApproveWildcard(student.roll)}
                                  className="px-3 py-1.5 text-xs font-bold text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors border border-success/20 flex items-center gap-1.5"
                                >
                                  <Unlock size={12} /> Unlock
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                  })}
                  {joinedStudents.filter(s => {
                      if (viewAllTab === "focused") return !studentViolations[s.roll]?.count;
                      if (viewAllTab === "unfocused") return studentViolations[s.roll]?.count > 0;
                      return true;
                    }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-base-content/50 font-medium">
                        No students match your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ── 3. Stats Row ────────────────────────────────────────────────── */}
      <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 md:gap-16 flex-1 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <Users size={24} className="text-blue-500" />
            <div>
              <div className="font-black text-xl leading-none text-base-content">{joinedStudents.length}</div>
              <div className="text-xs text-base-content/60 font-medium">Joined</div>
            </div>
          </div>
          <div className="w-px h-8 bg-base-300 shrink-0 hidden md:block"></div>
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer hover:bg-base-200 p-2 -ml-2 rounded-lg transition-colors"
            onClick={() => setShowPendingPanel(p => !p)}
          >
            <AlertTriangle size={24} className="text-amber-500" />
            <div>
              <div className="font-black text-xl leading-none text-base-content">{pendingCount}</div>
              <div className="text-xs text-base-content/60 font-medium">Pending</div>
            </div>
          </div>
          <div className="w-px h-8 bg-base-300 shrink-0 hidden md:block"></div>
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer hover:bg-base-200 p-2 -ml-2 rounded-lg transition-colors"
            onClick={() => setShowWildcardPanel(p => !p)}
          >
            <Sparkles size={24} className="text-amber-500" />
            <div>
              <div className="font-black text-xl leading-none text-base-content">{wildcardRequests.length}</div>
              <div className="text-xs text-base-content/60 font-medium">Wildcard</div>
            </div>
          </div>
          <div className="w-px h-8 bg-base-300 shrink-0 hidden md:block"></div>
          <div className="flex items-center gap-3 shrink-0">
            <X size={24} className="text-red-500" />
            <div>
              <div className="font-black text-xl leading-none text-base-content">{removedCount}</div>
              <div className="text-xs text-base-content/60 font-medium">Removed</div>
            </div>
          </div>
          <div className="w-px h-8 bg-base-300 shrink-0 hidden md:block"></div>
          <div className="flex items-center gap-3 shrink-0">
            <Lock size={24} className="text-green-500" />
            <div>
              <div className="font-black text-xl leading-none text-base-content">{focusViolationsCount}</div>
              <div className="text-xs text-base-content/60 font-medium">Focus Violations</div>
            </div>
          </div>
        </div>
        {!quizStarted ? (
          <button 
            onClick={() => {
              if (!qrShownOnce) {
                toast.error("Please show the QR Code first so students can join!");
                return;
              }
              setQuizStarted(true);
              setShowQR(false);
              setIsTimerPaused(false);
            }}
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm shrink-0 shadow-sm border ${!qrShownOnce ? 'bg-base-200 text-base-content/40 border-base-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'}`}
          >
            <Play size={16} fill="currentColor" /> Start Quiz
          </button>
        ) : !quizCompleted && (
          <button 
            onClick={!isSubmitting ? handleEndQuiz : undefined}
            className={`bg-error hover:bg-error/90 text-error-content px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm shrink-0 shadow-sm ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Square size={16} fill="currentColor" /> End Quiz
          </button>
        )}
      </div>

      {/* ── 4. Main Content (Two Columns) ─────────────────────────────── */}
      {/* ── 4. Main Content (Two Columns) ─────────────────────────────── */}
      {quizCompleted ? (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col p-8">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Leaderboard Management</h2>
              <p className="text-gray-500 mt-1 font-medium">Submissions: {joinedStudents.length}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${resultsReleased ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
              {resultsReleased ? <><Unlock size={18} /> Results: Released</> : <><Lock size={18} /> Results: Hidden</>}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider font-bold">
                <tr>
                  <th className="p-4 rounded-tl-lg">Student</th>
                  <th className="p-4">Roll No</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Correct</th>
                  <th className="p-4 text-center">Violations</th>
                  <th className="p-4 rounded-tr-lg" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...joinedStudents]
                  .sort((a, b) => (studentScores[b.roll] || 0) - (studentScores[a.roll] || 0))
                  .map((student, index) => {
                    const vData = studentViolations[student.roll];
                    return (
                      <tr key={student.roll} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <span className="font-bold text-gray-400 w-6">#{index + 1}</span>
                          <div>
                            <span className="font-bold text-gray-800">{student.name}</span>
                            {student.isWildcard && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">WC</span>}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-sm">{student.roll}</td>
                        <td className="p-4 text-center font-bold text-indigo-600 text-lg">{studentScores[student.roll] || 0}</td>
                        <td className="p-4 text-center text-gray-600 font-medium">{studentCorrectCount[student.roll] || 0} / {questions.length}</td>
                        <td className="p-4 text-center">
                          {vData ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${vData.locked ? "bg-red-100 text-red-700" : vData.count >= 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                              {vData.locked ? "🔒 Locked" : `⚠️ ${vData.count}`}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-4" />
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap justify-center border-t border-gray-100 pt-6 gap-4">
            {!resultsReleased ? (
              <button onClick={handleReleaseResults} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow transition-colors flex items-center gap-2">
                <Unlock size={20} /> Release Ranks
              </button>
            ) : (
              <button disabled className="px-8 py-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-lg cursor-not-allowed flex items-center gap-2">
                <CheckCircle2 size={20} /> Ranks Released
              </button>
            )}
            {!summaryReleased ? (
              <button onClick={handleReleaseSummary} className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg shadow transition-colors flex items-center gap-2">
                <BookMarked size={20} /> Release Answer Summary
              </button>
            ) : (
              <button disabled className="px-8 py-3.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-lg cursor-not-allowed flex items-center gap-2">
                <CheckCircle2 size={20} /> Summary Released
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* ── Left Column: Question Area / Waiting State ──────────────── */}
          <div className="flex-[3] flex flex-col gap-4">
            {!quizStarted ? (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 flex flex-col items-center justify-center p-8 relative overflow-hidden h-full min-h-[500px]">
                {/* Waiting State */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <QrCode size={400} />
                </div>
                <div className="z-10 text-center max-w-md">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-sm border border-primary/20">
                    <QrCode size={48} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-base-content mb-3">Ready to begin?</h2>
                  <p className="text-base-content/60 mb-8 leading-relaxed">
                    Generate the QR Code to allow students to join the classroom. Once everyone is in, click Start Quiz.
                  </p>
                  <button
                    onClick={() => {
                      if (!qrShownOnce) {
                        toast.error("Please show the QR Code first so students can join!");
                        return;
                      }
                      setQuizStarted(true);
                      setShowQR(false);
                      setIsTimerPaused(false);
                    }}
                    className={`px-8 py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mx-auto transition-all shadow-lg ${!qrShownOnce ? 'bg-base-200 text-base-content/40 cursor-not-allowed shadow-none border border-base-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-xl hover:-translate-y-0.5'}`}
                  >
                    <Play size={20} fill="currentColor" /> Start Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 flex flex-col h-full">

              {/* Question Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-extrabold text-base-content">
                    Question {currentQuestionIndex + 1} of {questions?.length || 0}
                  </h2>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                    {currentQuiz?.category || "General"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="flex items-center gap-1 px-3 py-1.5 border border-base-200 rounded-lg text-base-content/70 font-bold text-sm hover:bg-base-200 disabled:opacity-30 transition-colors">
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button onClick={handleNext} disabled={isLastQuestion} className="flex items-center gap-1 px-3 py-1.5 border border-base-200 rounded-lg text-base-content/70 font-bold text-sm hover:bg-base-200 disabled:opacity-30 transition-colors">
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {currentQuestion ? (
                <>
                  {/* Question Text */}
                  <h3 className="text-2xl font-bold text-base-content mb-8 leading-snug whitespace-pre-line">
                    {currentQuestion.question}
                  </h3>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentQuestion.options.map((option, idx) => {
                      const label = String.fromCharCode(65 + idx);
                      const isCorrect = isAnswerRevealed && option === currentQuestion.correctAnswer;

                      let cardClass = "bg-base-100 border-base-200 text-base-content";
                      let circleClass = "border-base-200 text-base-content/50 font-bold";

                      if (isCorrect) {
                        cardClass = "bg-success/10 border-success text-success shadow-sm ring-1 ring-success";
                        circleClass = "bg-success border-success text-success-content";
                      } else if (isAnswerRevealed) {
                        cardClass = "bg-base-200 border-base-200 text-base-content/40 opacity-60";
                        circleClass = "border-base-200 text-base-content/40";
                      }

                      return (
                        <div key={idx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${cardClass}`}>
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm shrink-0 ${circleClass}`}>
                            {label}
                          </div>
                          <span className="text-lg font-semibold flex-1">{option}</span>
                          {classResponses[label] > 0 && (
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                              {classResponses[label]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if revealed */}
                  {isAnswerRevealed && currentQuestion.explanation && (
                    <div className="mb-8 bg-info/10 border border-info/30 rounded-xl p-4">
                      <h4 className="font-bold text-info mb-1 flex items-center gap-2"><Sparkles size={16} /> Explanation</h4>
                      <p className="text-base-content/90">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              )}

              <div className="mt-auto"></div>

              {/* Bottom Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 pt-6 border-t border-base-200">
                {/* Timer block */}
                <div className="bg-base-100 border border-base-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider mb-0.5">Timer Control</div>
                      <div className="text-2xl font-black font-mono text-base-content leading-none">{formatTime(timeRemaining)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (timeRemaining <= 0) {
                        setTimeRemaining(currentQuiz?.isCustom ? currentQuiz.timeLimit : 60);
                      }
                      setIsTimerPaused(!isTimerPaused);
                    }}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors border border-amber-500/20 h-full"
                  >
                    {isTimerPaused ? <><Play size={18} fill="currentColor" /> Resume</> : <><Pause size={18} fill="currentColor" /> Pause</>}
                  </button>
                </div>

                {/* Reveal Answer */}
                <button
                  onClick={revealAnswer}
                  disabled={isAnswerRevealed || !currentQuestion}
                  className="bg-[#d9663b] hover:bg-[#c25a34] disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl flex flex-col items-center justify-center p-3 shadow-md transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-lg mb-0.5">
                    <CheckCircle2 size={20} /> Reveal Answer
                  </div>
                  <div className="text-xs font-medium text-white/80 disabled:text-gray-500/80">Show correct answer to all students</div>
                </button>
              </div>
            </div>
            )}
          </div>

          {/* ── Right Column: Live Tracker ──────────────────────────────── */}
          <div className="flex-[2] flex flex-col gap-4">

            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5 flex flex-col flex-1 h-[600px]">

              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Live Students ({joinedStudents.length})
                </h3>
                <button 
                  onClick={() => setShowViewAllModal(true)}
                  className="text-primary font-bold text-sm flex items-center gap-1 hover:text-primary-focus transition-colors"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => setStudentFilter(studentFilter === "focused" ? "all" : "focused")}
                  className={`flex-1 flex items-center justify-between p-2 rounded-lg border-2 transition-colors ${studentFilter === "focused" ? "border-green-400 bg-green-50" : "border-green-100 bg-green-50/50 hover:bg-green-50"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Focused Students
                  </div>
                  <div className="bg-green-200 text-green-800 text-xs font-black px-2 py-0.5 rounded-full">
                    {joinedStudents.length - focusViolationsCount}
                  </div>
                </button>
                <button
                  onClick={() => setStudentFilter(studentFilter === "unfocused" ? "all" : "unfocused")}
                  className={`flex-1 flex items-center justify-between p-2 rounded-lg border-2 transition-colors ${studentFilter === "unfocused" ? "border-error bg-error/10" : "border-error/30 bg-error/10 hover:bg-error/20"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-error">
                    <div className="w-2 h-2 rounded-full bg-error"></div> Unfocused
                  </div>
                  <div className="bg-error/20 text-error text-xs font-black px-2 py-0.5 rounded-full">
                    {focusViolationsCount}
                  </div>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-base-200 border border-base-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base-content placeholder:text-base-content/40"
                />
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto min-h-[300px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-base-100 border-b border-base-200 text-xs font-bold text-base-content/50 uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 pl-2">#</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Roll No.</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                      const vData = studentViolations[student.roll];
                      const isUnfocused = vData && vData.count > 0;
                      return (
                        <tr key={student.roll} className="hover:bg-base-200 group transition-colors">
                          <td className="py-3 pl-2 text-base-content/50 font-bold text-xs">{idx + 1}</td>
                          <td className="py-3 font-bold text-base-content text-sm">{student.name}</td>
                          <td className="py-3 text-base-content/60 font-mono text-xs">{student.roll} {student.batch && `• ${student.batch}`}</td>
                          <td className="py-3 text-center">
                            {isUnfocused ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-error/10 text-error text-xs font-bold border border-error/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-error"></div> Unfocused
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-base-content/50 text-xs font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-base-300"></div> Focused
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-2">
                              {isUnfocused && vData.locked ? (
                                <div className="p-1.5 bg-error/10 text-error rounded-lg">
                                  <Lock size={14} />
                                </div>
                              ) : (
                                <div className="p-1.5 opacity-0 text-base-content/50"><Lock size={14} /></div>
                              )}
                              <div className="relative">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === student.roll ? null : student.roll);
                                  }}
                                  className="p-1.5 text-base-content/50 hover:text-base-content hover:bg-base-300 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                >
                                  <MoreVertical size={16} />
                                </button>
                                
                                {activeDropdown === student.roll && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-base-100 rounded-xl shadow-lg border border-base-200 overflow-hidden flex flex-col">
                                      {(!isUnfocused || !vData?.locked) && (
                                        <button 
                                          onClick={() => {
                                            handleLockStudent(student.roll);
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-3 text-sm font-bold text-error hover:bg-base-200 flex items-center gap-2 transition-colors"
                                        >
                                          <Lock size={14} /> Lock Student
                                        </button>
                                      )}
                                      {(isUnfocused && vData?.locked) && (
                                        <button 
                                          onClick={() => {
                                            handleApproveWildcard(student.roll);
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-3 text-sm font-bold text-success hover:bg-base-200 flex items-center gap-2 transition-colors"
                                        >
                                          <Unlock size={14} /> Unlock Student
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-base-content/50 text-sm font-medium">
                          No students match your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Next Question Block fixed at bottom */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4">
              <button
                onClick={handleNext}
                disabled={isLastQuestion}
                className="w-full bg-base-200 hover:bg-base-300 border border-base-300 disabled:opacity-50 text-base-content rounded-xl flex flex-col items-center justify-center p-3 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-lg mb-0.5">
                  <ChevronRight size={20} className="text-base-content/60" /> Next Question
                </div>
                <div className="text-xs font-medium text-base-content/60">Move to the next question</div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── QR Modal ────────────────────────────────────────────── */}
      {showQR && (
        <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-3xl shadow-2xl relative max-w-sm w-full flex flex-col items-center border border-base-200 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 p-2 rounded-full hover:bg-base-200 transition-colors">
              <X size={20} />
            </button>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-base-200 mb-6">
              {/* Kept QR container white to ensure high contrast scanning in dark mode */}
              <QrCodeComponent value={joinUrl} size={240} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={false} />
            </div>
            <div className="w-full space-y-3">
              <p className="text-base-content/60 font-medium bg-base-200 px-6 py-3 rounded-xl border border-base-300 text-center">
                Class Code: <span className="font-bold text-base-content tracking-wider text-xl ml-1">{sessionCode}</span>
              </p>
              <div className="bg-base-200 pl-4 pr-2 py-2 rounded-xl border border-base-300 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-xs truncate font-mono text-base-content/50 select-all">{joinUrl}</span>
                <button onClick={() => { navigator.clipboard.writeText(joinUrl); toast.success("Link copied!"); }} className="shrink-0 p-2 hover:bg-base-300 rounded-lg text-primary transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ─────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-base-300/40 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full border border-base-200 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-base-content">{confirmModal.title}</h3>
                </div>
                <button
                  onClick={() => { setConfirmModal(null); confirmModal.onConfirm(false); }}
                  className="text-base-content/40 hover:text-base-content/70 p-1.5 rounded-lg hover:bg-base-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-base-content/60 text-sm leading-relaxed mb-6 pl-[52px]">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setConfirmModal(null); confirmModal.onConfirm(false); }}
                  className="px-4 py-2.5 rounded-lg border border-base-200 text-base-content/70 hover:bg-base-200 transition-colors font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmModal.onConfirm(true)}
                  className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${confirmModal.confirmClass}`}
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomTeacher;
