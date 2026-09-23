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
    <div className="summary-protected min-h-screen bg-base-200 relative pb-12">

      {/* ── Watermark ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-5 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} /> Answer Summary
              </h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                {displayName} • {displayRoll} • {sessionCode}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-indigo-300 uppercase tracking-wider">Score</p>
            <p className="text-2xl font-black">{correctCount}/{questions.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pt-6 relative z-2">
        {/* ── Stats bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">Correct</p>
            <p className="text-3xl font-black text-success">{correctCount}</p>
          </div>
          <div className="bg-error/10 border border-error/20 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-error uppercase tracking-wider mb-1">Incorrect</p>
            <p className="text-3xl font-black text-error">{incorrectCount}</p>
          </div>
          <div className="bg-base-100 border border-base-300 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1">Skipped</p>
            <p className="text-3xl font-black text-base-content">{unansweredCount}</p>
          </div>
        </div>

        {/* ── Question cards ─────────────────────────────────────── */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userAnswer = myAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isUnanswered = !userAnswer;

            const headerBg = isCorrect
              ? "bg-success/10 border-b border-success/20"
              : isUnanswered
                ? "bg-amber-50 border-b border-amber-100"
                : "bg-error/10 border-b border-error/20";

            const statusColor = isCorrect
              ? "text-green-700"
              : isUnanswered
                ? "text-amber-600"
                : "text-red-700";

            const statusText = isCorrect ? "✓ Correct" : isUnanswered ? "— Unanswered" : "✗ Incorrect";

            return (
              <div key={q.id} className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
                {/* Card header */}
                <div className={`px-5 py-4 ${headerBg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                        ${isCorrect ? "bg-success/20 text-green-700" : isUnanswered ? "bg-amber-200 text-amber-700" : "bg-red-200 text-red-700"}`}>
                        {idx + 1}
                      </span>
                      <p className="text-base-content font-medium leading-snug">{q.question}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${statusColor}`}>{statusText}</span>
                  </div>
                </div>

                {/* Answer details */}
                <div className="p-5 space-y-3">
                  {/* Student's answer */}
                  {userAnswer ? (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCorrect ? "border-success bg-success/5" : "border-error bg-error/5"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-success text-white" : "bg-error text-white"}`}>
                        {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-0.5">Your Answer</p>
                        <p className={`font-bold ${isCorrect ? "text-green-800" : "text-red-800"}`}>{userAnswer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-200 bg-amber-50">
                      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">?</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-0.5">Your Answer</p>
                        <p className="font-bold text-amber-700">Not answered</p>
                      </div>
                    </div>
                  )}

                  {/* Correct answer (only show if wrong or unanswered) */}
                  {!isCorrect && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-success/40 bg-success/5">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-0.5">Correct Answer</p>
                        <p className="font-bold text-green-800">{q.correctAnswer}</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-line">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer note ───────────────────────────────────────── */}
        <div className="mt-8 text-center text-xs text-base-content/30 font-medium">
          SubbhiQuiz Answer Summary • {displayName} • {displayRoll}
        </div>
      </div>
    </div>
  );
};

export default StudentSummary;
