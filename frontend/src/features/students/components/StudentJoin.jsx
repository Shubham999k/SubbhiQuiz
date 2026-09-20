import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Users, LogIn } from "lucide-react";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";

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
    return Math.floor(10000 + Math.random() * 90000).toString();
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
    <div className="min-h-screen bg-base-200 flex flex-col relative">
      {/* Waiting Popup Modal */}
      {isWaitingForTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform transition-all">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-2">
              Successfully Joined!
            </h3>
            <p className="text-base-content/70 text-lg">
              Waiting for teacher to start the quiz...
            </p>
          </div>
        </div>
      )}

      <header className="bg-primary text-white p-4 shadow-md flex items-center justify-center">
        <div className="flex items-center gap-2">
          <BookOpen size={24} />
          <h1 className="text-xl font-bold tracking-wider">
            QUIZZZ-ZONE CLASSROOM
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-base-100 p-8 rounded-3xl shadow-xl max-w-md w-full border border-base-300">
          <div className="text-center mb-8">
            <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary shadow-inner">
              <Users size={40} />
            </div>
            <h2 className="text-3xl font-bold text-base-content mb-2">
              Join Classroom
            </h2>

            {projectorState && !isSessionEnded && (
              <p className="text-primary font-medium capitalize bg-primary/10 inline-block px-4 py-1 rounded-full border border-primary/10">
                {projectorState.currentQuiz?.category} Quiz
              </p>
            )}
          </div>

          {isSessionEnded ? (
            <div className="text-center bg-base-200 p-6 rounded-xl border border-base-300">
              <h3 className="text-lg font-bold text-base-content mb-2">
                Quiz Ended
              </h3>
              <p className="text-base-content/70 mb-6 text-sm">
                This classroom session has been ended by the teacher.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-base-100 text-base-content font-bold rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
              >
                Return Home
              </button>
            </div>
          ) : projectorState?.quizStarted || projectorState?.showQR === false ? (
            <div className="text-center bg-warning/10 p-6 rounded-xl border border-warning/20">
              <h3 className="text-lg font-bold text-warning mb-2">
                Classroom Locked
              </h3>
              <p className="text-warning mb-6 text-sm">
                This session has already started or the teacher has locked the classroom. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-base-100 text-warning font-bold rounded-lg border border-warning/30 hover:bg-base-200 transition-colors"
              >
                Check Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              {error && (
                <div className="bg-error/10 text-error p-3 rounded-lg text-sm border border-error/20 text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-base-content mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-4 bg-base-200 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-base-content mb-2 ml-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={roll}
                  readOnly
                  className="w-full p-4 bg-base-300 border border-base-300 rounded-xl outline-none text-lg text-base-content/70 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-base-content mb-2 ml-1">
                  Batch / Class
                </label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 10th A"
                  className="w-full p-4 bg-base-200 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg"
                  required
                  maxLength={30}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!name.trim() || !roll.trim() || !batch.trim() || isWaitingForTeacher}
                  className={`w-full font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-lg ${
                    !name.trim() || !roll.trim() || !batch.trim() || isWaitingForTeacher
                      ? "bg-base-300 text-base-content/70 cursor-not-allowed shadow-none"
                      : "bg-primary hover:opacity-80 text-white hover:shadow-lg"
                  }`}
                >
                  {isWaitingForTeacher ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Waiting for teacher...
                    </>
                  ) : (
                    <>
                      <LogIn size={24} /> JOIN QUIZ
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentJoin;
