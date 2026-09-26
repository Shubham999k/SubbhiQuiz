import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Users,
  User,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UserCircle2,
  QrCode,
  Sparkles,
  Clock,
  X,
} from "lucide-react";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import ThemeSelector from "../../../components/common/ThemeSelector";
import { api } from "../../../services/api";

const StudentJoin = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session");
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [roll, setRoll] = useState(() => {
    try {
      const saved = localStorage.getItem(`student_session_${sessionCode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roll) return parsed.roll;
      }
    } catch (e) {}
    return "";
  });
  const [batch, setBatch] = useState("");
  const [error, setError] = useState("");
  const [isWaitingForTeacher, setIsWaitingForTeacher] = useState(false);

  // ── Wildcard state ─────────────────────────────────────────────
  const [wildcardMode, setWildcardMode] = useState(false); // quiz started and wildcard available
  const [wildcardPending, setWildcardPending] = useState(false);
  const [wildcardRejected, setWildcardRejected] = useState(false);
  const [wildcardRejectedReason, setWildcardRejectedReason] = useState("");

  // ── Callbacks for wildcard socket events ──────────────────────
  const handleWildcardApproved = (data) => {
    // Save student info to localStorage (for reconnect in StudentActive)
    localStorage.setItem(
      `student_session_${sessionCode}`,
      JSON.stringify({ name: name.trim(), roll: roll.trim(), batch: batch.trim() })
    );
    // Navigate to active quiz — they'll receive current state via projectorState
    navigate(`/student/active?session=${sessionCode}`);
  };

  const handleWildcardRejected = (data) => {
    setWildcardPending(false);
    setWildcardRejected(true);
    setWildcardRejectedReason(data?.reason || "Your request was rejected.");
  };

  const { projectorState, broadcastEvent, requestWildcard, checkStudentStatus, reauthenticateAndJoin } = useClassroomSync(
    sessionCode,
    "student",
    null,
    {
      onWildcardApproved: handleWildcardApproved,
      onWildcardRejected: handleWildcardRejected,
    }
  );

  // Check student status immediately to prevent bypass
  useEffect(() => {
    if (roll && checkStudentStatus) {
      checkStudentStatus(roll).then((res) => {
        if (res?.success && res.rejected) {
          handleWildcardRejected({ reason: "Your wildcard request was previously rejected by the teacher." });
        }
      });
    }
  }, [roll, checkStudentStatus]);

  // ── Determine if quiz started & wildcard available ────────────
  useEffect(() => {
    if (!projectorState) return;

    if (projectorState.quizStarted && !projectorState.quizCompleted) {
      // Quiz is running
      if (projectorState.wildcardEnabled) {
        setWildcardMode(true);
      }
    } else {
      setWildcardMode(false);
    }
  }, [projectorState]);

  // ── Auto-navigate once teacher starts (normal join) ────────────
  useEffect(() => {
    if (isWaitingForTeacher && projectorState) {
      if (projectorState.quizCompleted) {
        setError("This classroom quiz has ended.");
        setIsWaitingForTeacher(false);
        return;
      }

      broadcastEvent("STUDENT_JOIN", {
        name: name.trim(),
        roll: roll.trim(),
        batch: batch.trim(),
      });

      if (projectorState.quizStarted) {
        navigate(`/student/active?session=${sessionCode}`);
      }
    }
  }, [projectorState, isWaitingForTeacher, name, roll, batch, sessionCode, navigate, broadcastEvent]);

  // ── Normal join handler ────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !roll.trim() || !batch.trim()) {
      setError("Please enter Name, Roll Number, and Batch.");
      return;
    }
    if (projectorState?.quizCompleted) {
      setError("This classroom quiz has ended.");
      return;
    }

    try {
      const data = await api.studentJoinQuiz(sessionCode, name.trim(), roll.trim(), batch.trim());
      localStorage.setItem(`student_token_${sessionCode}`, data.token);
      localStorage.setItem(`student_session_${sessionCode}`, JSON.stringify(data.studentInfo));
      
      reauthenticateAndJoin(data.token);
      setIsWaitingForTeacher(true);

      if (projectorState) {
        broadcastEvent("STUDENT_JOIN", data.studentInfo);
      }
    } catch (err) {
      setError(err.message || "Failed to join session.");
    }
  };

  // ── Wildcard request handler ───────────────────────────────────
  const handleWildcardRequest = async () => {
    if (!name.trim() || !roll.trim() || !batch.trim()) {
      setError("Please enter Name, Roll Number, and Batch before requesting wildcard entry.");
      return;
    }
    setError("");
    setWildcardPending(true);
    
    try {
      const data = await api.studentJoinQuiz(sessionCode, name.trim(), roll.trim(), batch.trim());
      localStorage.setItem(`student_token_${sessionCode}`, data.token);
      localStorage.setItem(`student_session_${sessionCode}`, JSON.stringify(data.studentInfo));
      
      reauthenticateAndJoin(data.token);
      requestWildcard(name.trim(), roll.trim(), batch.trim());
    } catch (err) {
      setError(err.message || "Failed to request wildcard.");
      setWildcardPending(false);
    }
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="bg-base-100 p-8 rounded-2xl shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-error mb-4">Invalid Link</h2>
          <p className="text-base-content/70 mb-6">No session code provided in the URL.</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-primary text-white rounded-lg font-medium">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isSessionEnded = projectorState?.quizCompleted;
  const isSessionLocked = projectorState?.quizStarted && !projectorState?.wildcardEnabled;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col relative font-sans">

      {/* ── Wildcard Pending Overlay ───────────────────────────────── */}
      {wildcardPending && (
        <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-10 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-purple-200/50">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
              🧞‍♂️
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-3">Wildcard Request Sent!</h3>
            <p className="text-base-content/60 text-sm mb-6">
              Waiting for your teacher to approve your request...
            </p>
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <div className="w-5 h-5 border-[3px] border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Pending approval</span>
            </div>
            <button
              onClick={() => setWildcardPending(false)}
              className="mt-6 text-xs text-base-content/40 hover:text-base-content transition-colors"
            >
              Cancel request
            </button>
          </div>
        </div>
      )}

      {/* ── Normal Waiting Overlay ─────────────────────────────────── */}
      {isWaitingForTeacher && (
        <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-10 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-base-200/50">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-[6px] border-base-200 rounded-full" />
              <div className="absolute inset-0 border-[6px] border-primary border-r-transparent border-b-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-3">Successfully Joined!</h3>
            <p className="text-base-content/60 text-sm">Waiting for teacher to start<br />the quiz...</p>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-base-100 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-base-200/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-base-content leading-tight">Quizzz-Zone</h1>
            <p className="text-[11px] font-medium text-base-content/60 uppercase tracking-widest mt-0.5">Learn • Compete • Grow</p>
          </div>
        </div>
        <ThemeSelector />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 pt-8 max-w-[480px] mx-auto w-full">

        {/* Banner */}
        <div className="w-full bg-success/10 border border-success/20 rounded-2xl p-4 mb-8 flex items-center gap-4 shadow-sm shadow-success/5">
          <div className="bg-success/20 p-2.5 rounded-xl text-success flex-shrink-0">
            <QrCode size={24} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-success">You joined via classroom QR</p>
            <p className="text-xs font-medium text-success/80 mt-0.5">You're almost there!</p>
          </div>
          <div className="text-success flex-shrink-0">
            <CheckCircle2 size={24} fill="currentColor" className="text-success/20 stroke-success" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-base-100 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-base-content/5 border border-base-200/50 w-full relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-5 text-base-content/40">
              <UserCircle2 size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-2 tracking-tight">Join Classroom</h2>
            <p className="text-base-content/60 text-sm sm:text-base">Enter your details to join the live quiz.</p>

            {projectorState && !isSessionEnded && projectorState.currentQuiz && (
              <p className="mt-4 text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 inline-block px-4 py-1.5 rounded-full border border-primary/10">
                {projectorState.currentQuiz?.category} Quiz
              </p>
            )}
          </div>

          {/* ── Session Ended ─────────────────────────────────────── */}
          {isSessionEnded ? (
            <div className="text-center bg-base-200/50 p-6 rounded-2xl border border-base-300 relative z-10">
              <h3 className="text-lg font-bold text-base-content mb-2">Quiz Ended</h3>
              <p className="text-base-content/60 mb-6 text-sm">This classroom session has been ended by the teacher.</p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 bg-base-100 text-base-content font-bold rounded-xl border border-base-300 hover:bg-base-200 transition-colors text-sm"
              >
                Return Home
              </button>
            </div>

          /* ── Quiz started but wildcard available ────────────────── */
          ) : wildcardMode ? (
            <div className="relative z-10">
              {/* Wildcard rejected message */}
              {wildcardRejected && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <X size={18} className="text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-error font-bold text-sm">Request Rejected</p>
                    <p className="text-error/80 text-xs mt-1">{wildcardRejectedReason}</p>
                  </div>
                </div>
              )}

              {/* Wildcard notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl animate-bounce">🧞‍♂️</div>
                  <div>
                    <h3 className="font-bold text-purple-900">Quiz Already Started</h3>
                    <p className="text-purple-700 text-xs mt-0.5">Wildcard Entry is available</p>
                  </div>
                </div>
                <p className="text-purple-800 text-sm">
                  The quiz is in progress. Fill your details and request wildcard entry. Your teacher must approve before you can join.
                </p>
                <div className="flex items-center gap-2 mt-3 text-purple-600 text-xs">
                  <Clock size={13} />
                  You'll join at the current question with remaining time.
                </div>
              </div>

              {/* Details form */}
              {error && (
                <div className="bg-error/10 text-error p-3.5 rounded-xl text-sm font-medium border border-error/20 text-center mb-4">
                  {error}
                </div>
              )}
              <div className="space-y-4 mb-6">
                {[
                  { label: "Full Name", value: name, setter: setName, icon: User, placeholder: "Your name" },
                  { label: "Roll Number", value: roll, setter: setRoll, icon: CreditCard, placeholder: "e.g. 84431" },
                  { label: "Batch / Class", value: batch, setter: setBatch, icon: Building, placeholder: "e.g. 10th A" },
                ].map(({ label, value, setter, icon: Icon, placeholder }) => (
                  <div key={label}>
                    <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">{label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                        <Icon size={18} />
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none transition-all text-[15px] placeholder:text-base-content/30 shadow-sm"
                        maxLength={50}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleWildcardRequest}
                disabled={!name.trim() || !roll.trim() || !batch.trim() || wildcardPending}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px] ${
                  !name.trim() || !roll.trim() || !batch.trim() || wildcardPending
                    ? "bg-base-200 text-base-content/40 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <Sparkles size={20} />
                Request Wildcard Entry
              </button>
              <p className="text-center text-xs text-base-content/40 mt-4">
                Your teacher will receive your request instantly.
              </p>
            </div>

          /* ── Quiz locked (started, no wildcard) ─────────────────── */
          ) : isSessionLocked ? (
            <div className="text-center bg-warning/10 p-6 rounded-2xl border border-warning/20 relative z-10">
              <h3 className="text-lg font-bold text-warning mb-2">Classroom Locked</h3>
              <p className="text-warning mb-6 text-sm">
                This session has already started. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-base-100 text-warning font-bold rounded-xl border border-warning/30 hover:bg-base-200 transition-colors text-sm"
              >
                Check Again
              </button>
            </div>

          /* ── Normal join form ───────────────────────────────────── */
          ) : (
            <form onSubmit={handleJoin} className="space-y-4 relative z-10">
              {error && (
                <div className="bg-error/10 text-error p-3.5 rounded-xl text-sm font-medium border border-error/20 text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Subbhi"
                      className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[15px] placeholder:text-base-content/30 shadow-sm"
                      required
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">Roll Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                      <CreditCard size={18} />
                    </div>
                    <input
                      type="text"
                      value={roll}
                      onChange={(e) => setRoll(e.target.value)}
                      placeholder="e.g. 84431"
                      className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[15px] placeholder:text-base-content/30 shadow-sm"
                      required
                      maxLength={30}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">Batch / Class</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                      <Building size={18} />
                    </div>
                    <input
                      type="text"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="e.g. 10th A"
                      className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[15px] placeholder:text-base-content/30 shadow-sm"
                      required
                      maxLength={30}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!name.trim() || !roll.trim() || !batch.trim() || isWaitingForTeacher}
                  className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px] ${
                    !name.trim() || !roll.trim() || !batch.trim() || isWaitingForTeacher
                      ? "bg-base-200 text-base-content/40 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isWaitingForTeacher ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>Join Quiz <ArrowRight size={20} className="ml-1" /></>
                  )}
                </button>
              </div>

              <div className="flex items-start justify-center gap-2.5 text-center pt-3">
                <ShieldCheck size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-base-content/50 max-w-[240px] leading-relaxed">
                  Your information is safe and only used to join this quiz session.
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentJoin;
