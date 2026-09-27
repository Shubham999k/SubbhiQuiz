import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { useClassroomSync } from "../../classroom/hooks/useClassroomSync";

/**
 * StudentSummary — Protected answer review screen
 *
 * Accessible at /student/summary?session=CODE&roll=ROLL
 *
 * Anti-copy features:
 * - CSS user-select: none
 * - Prevent copy/paste/cut/contextmenu events
 * - Student watermark overlay
 * - Visual card layout (not raw text)
 */
const StudentSummary = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session");
  const roll = searchParams.get("roll");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryData, setSummaryData] = useState(null); // { myAnswers, questions, studentInfo }
  const [studentInfo, setStudentInfo] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Intercept browser/Android back button
  useEffect(() => {
    window.history.pushState({ summary: true }, "");
    const handler = () => {
      setShowExitModal(true);
      window.history.pushState({ summary: true }, "");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Load student info from localStorage
  useEffect(() => {
    if (!sessionCode) return;
    try {
      const saved = localStorage.getItem(`student_session_${sessionCode}`);
      if (saved) setStudentInfo(JSON.parse(saved));
    } catch {}
  }, [sessionCode]);

  // ── Fetch summary data via socket ──────────────────────────────
  const { socket } = useClassroomSync(sessionCode, "student");

  useEffect(() => {
    if (!socket || !sessionCode || !roll) return;

    let fetched = false;

    const doFetch = () => {
      if (fetched) return;
      socket.emit("check_summary", { sessionCode, roll }, (res) => {
        fetched = true;
        setLoading(false);
        if (res?.success) {
          setSummaryData({
            myAnswers: res.myAnswers || {},
            questions: res.questions || [],
            studentInfo: res.studentInfo,
          });
        } else if (res?.summaryReleased === false) {
          setError("The answer summary has not been released by your teacher yet.");
        } else {
          setError(res?.reason || "Summary data is not available.");
        }
      });
    };

    if (socket.connected) {
      // Join the session first so the socket is in the right room
      socket.emit("join_session", sessionCode);
      setTimeout(doFetch, 300);
    } else {
      socket.on("connect", () => {
        socket.emit("join_session", sessionCode);
        setTimeout(doFetch, 300);
      });
    }
  }, [socket, sessionCode, roll]);

  // ── Copy protection ────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);

    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ["c", "v", "x", "a", "u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);

    // CSS injection
    const style = document.createElement("style");
    style.id = "summary-protection-style";
    style.textContent = `
      .summary-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", handleKeyDown, true);
      const el = document.getElementById("summary-protection-style");
      if (el) el.remove();
    };
  }, []);

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-base-content/70 font-medium">Loading your summary...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (error || !summaryData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-10 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-base-content mb-3">Summary Not Available</h2>
          <p className="text-base-content/70 mb-8">{error || "Your teacher hasn't released the answer summary yet."}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-80 transition-colors"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const { myAnswers, questions } = summaryData;
  const correctCount = questions.filter((q) => myAnswers[q.id] === q.correctAnswer).length;
  const incorrectCount = questions.filter((q) => myAnswers[q.id] && myAnswers[q.id] !== q.correctAnswer).length;
  const unansweredCount = questions.filter((q) => !myAnswers[q.id]).length;
  const displayName = studentInfo?.name || roll || "Student";
  const displayRoll = studentInfo?.roll || roll || "";

  return (
    <div className="summary-protected min-h-screen relative pb-12"
      style={{background:"#f3f4f6"}}>

      {/* ── Exit Confirmation Modal ──────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-gray-900 font-black text-xl mb-2">Exit this page?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to go back to the result screen?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowExitModal(false); navigate(-1); }}
                className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold text-base hover:bg-red-600 active:scale-95 transition-all"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Watermark ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: "none",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.05,
          transform: "rotate(-25deg)",
          fontSize: "clamp(10px, 2vw, 18px)",
          fontWeight: "900",
          color: "#1e1b4b",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        SubbhiQuiz • {displayName} • {displayRoll} • {sessionCode}
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 shadow-lg"
        style={{background:"linear-gradient(135deg,#3730a3 0%,#4f46e5 50%,#7c3aed 100%)"}}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setShowExitModal(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                <BookOpen size={18} className="shrink-0" /> Answer Summary
              </h1>
              <p className="text-indigo-200 text-xs truncate">
                {displayName} • {displayRoll}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-indigo-300 text-xs uppercase tracking-wider font-bold">Score</p>
            <p className="text-white font-black text-xl">{correctCount}/{questions.length}</p>
          </div>
        </div>

        {/* Stats bar inside header */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center border border-white/10">
            <p className="text-green-300 text-xs font-bold uppercase tracking-wider">Correct</p>
            <p className="text-white font-black text-2xl sm:text-3xl">{correctCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center border border-white/10">
            <p className="text-red-300 text-xs font-bold uppercase tracking-wider">Wrong</p>
            <p className="text-white font-black text-2xl sm:text-3xl">{incorrectCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center border border-white/10">
            <p className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Skipped</p>
            <p className="text-white font-black text-2xl sm:text-3xl">{unansweredCount}</p>
          </div>
        </div>
      </div>

      {/* ── Question cards ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-3 sm:pt-4 space-y-3 relative z-2">
        {questions.map((q, idx) => {
          const userAnswer = myAnswers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          const isUnanswered = !userAnswer;

          const borderColor = isCorrect ? "border-green-400" : isUnanswered ? "border-amber-300" : "border-red-400";
          const statusBg = isCorrect ? "bg-green-50" : isUnanswered ? "bg-amber-50" : "bg-red-50";
          const statusColor = isCorrect ? "text-green-700" : isUnanswered ? "text-amber-600" : "text-red-600";
          const numBg = isCorrect ? "bg-green-500" : isUnanswered ? "bg-amber-400" : "bg-red-500";
          const statusText = isCorrect ? "✓ Correct" : isUnanswered ? "— Skipped" : "✗ Wrong";

          return (
            <div key={q.id} className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
              {/* Card header */}
              <div className={`px-3 sm:px-4 py-3 ${statusBg} flex items-start justify-between gap-2`}>
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black ${numBg}`}>
                    {idx + 1}
                  </span>
                  <p className="text-gray-800 font-semibold text-sm sm:text-base leading-snug">{q.question}</p>
                </div>
                <span className={`shrink-0 text-xs sm:text-sm font-black ${statusColor} whitespace-nowrap`}>{statusText}</span>
              </div>

              {/* Answer details */}
              <div className="px-3 sm:px-4 py-3 space-y-2">
                {/* Student's answer */}
                {userAnswer ? (
                  <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 ${isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-green-500" : "bg-red-500"}`}>
                      {isCorrect ? <CheckCircle2 size={14} className="text-white" /> : <XCircle size={14} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Your Answer</p>
                      <p className={`font-bold text-sm ${isCorrect ? "text-green-800" : "text-red-800"}`}>{userAnswer}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 border-amber-200 bg-amber-50">
                    <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">?</div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-0.5">Your Answer</p>
                      <p className="font-bold text-sm text-amber-700">Not answered</p>
                    </div>
                  </div>
                )}

                {/* Correct answer (only show if wrong or unanswered) */}
                {!isCorrect && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 border-green-300 bg-green-50">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-0.5">Correct Answer</p>
                      <p className="font-bold text-sm text-green-800">{q.correctAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 sm:p-3">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">💡 Explanation</p>
                    <p className="text-indigo-900 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ───────────────────────────────────────── */}
      <div className="mt-6 text-center text-xs text-gray-400 font-medium pb-4">
        SubbhiQuiz Answer Summary • {displayName} • {displayRoll}
      </div>
    </div>
  );
};

export default StudentSummary;

