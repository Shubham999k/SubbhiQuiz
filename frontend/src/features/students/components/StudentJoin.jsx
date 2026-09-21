import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Users, LogIn, User, CreditCard, Building, ArrowRight, ShieldCheck, CheckCircle2, UserCircle2, QrCode } from "lucide-react";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import ThemeSelector from "../../../components/common/ThemeSelector";

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

  // We connect to the channel to see if the session is active
  const { projectorState, broadcastEvent } = useClassroomSync(
    sessionCode,
    "student",
  );

  // Automatically join once teacher starts the session if student was waiting
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

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roll.trim() || !batch.trim()) {
      setError("Please enter Name, Roll Number, and Batch.");
      return;
    }

    if (projectorState?.quizCompleted) {
      setError("This classroom quiz has ended.");
      return;
    }

    // Save session context locally so they can reconnect if they refresh
    localStorage.setItem(
      `student_session_${sessionCode}`,
      JSON.stringify({
        name: name.trim(),
        roll: roll.trim(),
        batch: batch.trim(),
      }),
    );

    setIsWaitingForTeacher(true);

    if (projectorState) {
      // Broadcast join event to teacher
      broadcastEvent("STUDENT_JOIN", {
        name: name.trim(),
        roll: roll.trim(),
        batch: batch.trim(),
      });
    }
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="bg-base-100 p-8 rounded-2xl shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-error mb-4">Invalid Link</h2>
          <p className="text-base-content/70 mb-6">
            No session code provided in the URL.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isSessionEnded = projectorState?.quizCompleted;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col relative font-sans">
      {/* Waiting Popup Modal */}
      {isWaitingForTeacher && (
        <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-10 rounded-[2rem] shadow-2xl max-w-sm w-full text-center transform transition-all border border-base-200/50">
            <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 border-[6px] border-base-200 rounded-full"></div>
               <div className="absolute inset-0 border-[6px] border-primary border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-3">
              Successfully Joined!
            </h3>
            <p className="text-base-content/60 text-sm">
              Waiting for teacher to start<br/>the quiz...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-base-100 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-base-200/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
             <h1 className="text-xl font-bold tracking-tight text-base-content leading-tight">
               Quizzz-Zone
             </h1>
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
          {/* subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-5 text-base-content/40">
              <UserCircle2 size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-2 tracking-tight">
              Join Classroom
            </h2>
            <p className="text-base-content/60 text-sm sm:text-base">
               Enter your details to join the live quiz.
            </p>

            {projectorState && !isSessionEnded && projectorState.currentQuiz && (
              <p className="mt-4 text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 inline-block px-4 py-1.5 rounded-full border border-primary/10">
                {projectorState.currentQuiz?.category} Quiz
              </p>
            )}
          </div>

          {isSessionEnded ? (
            <div className="text-center bg-base-200/50 p-6 rounded-2xl border border-base-300 relative z-10">
              <h3 className="text-lg font-bold text-base-content mb-2">
                Quiz Ended
              </h3>
              <p className="text-base-content/60 mb-6 text-sm">
                This classroom session has been ended by the teacher.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 bg-base-100 text-base-content font-bold rounded-xl border border-base-300 hover:bg-base-200 transition-colors text-sm"
              >
                Return Home
              </button>
            </div>
          ) : projectorState?.quizStarted || projectorState?.showQR === false ? (
            <div className="text-center bg-warning/10 p-6 rounded-2xl border border-warning/20 relative z-10">
              <h3 className="text-lg font-bold text-warning mb-2">
                Classroom Locked
              </h3>
              <p className="text-warning mb-6 text-sm">
                This session has already started or the teacher has locked the classroom. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-base-100 text-warning font-bold rounded-xl border border-warning/30 hover:bg-base-200 transition-colors text-sm"
              >
                Check Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6 relative z-10">
              {error && (
                <div className="bg-error/10 text-error p-3.5 rounded-xl text-sm font-medium border border-error/20 text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                        <User size={18} />
                     </div>
                     <input
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="Subbhi "
                       className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[15px] placeholder:text-base-content/30 shadow-sm"
                       required
                       maxLength={50}
                     />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">
                    Roll Number
                  </label>
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
                  <label className="block text-[13px] font-bold text-base-content mb-1.5 ml-1">
                    Batch / Class
                  </label>
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
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Quiz <ArrowRight size={20} className="ml-1" />
                    </>
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
