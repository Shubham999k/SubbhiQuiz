import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Users, LogIn } from "lucide-react";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";

const StudentJoin = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get("session");
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
          <p className="text-gray-600 mb-6">
            No session code provided in the URL.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isSessionEnded = projectorState?.quizCompleted;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Waiting Popup Modal */}
      {isWaitingForTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform transition-all">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Successfully Joined!
            </h3>
            <p className="text-gray-500 text-lg">
              Waiting for teacher to start the quiz...
            </p>
          </div>
        </div>
      )}

      <header className="bg-indigo-600 text-white p-4 shadow-md flex items-center justify-center">
        <div className="flex items-center gap-2">
          <BookOpen size={24} />
          <h1 className="text-xl font-bold tracking-wider">
            QUIZZZ-ZONE CLASSROOM
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
              <Users size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Join Classroom
            </h2>

            {projectorState && !isSessionEnded && (
              <p className="text-indigo-600 font-medium capitalize bg-indigo-50 inline-block px-4 py-1 rounded-full border border-indigo-100">
                {projectorState.currentQuiz?.category} Quiz
              </p>
            )}
          </div>

          {isSessionEnded ? (
            <div className="text-center bg-gray-100 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Quiz Ended
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                This classroom session has been ended by the teacher.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Return Home
              </button>
            </div>
          ) : projectorState?.quizStarted || projectorState?.showQR === false ? (
            <div className="text-center bg-amber-50 p-6 rounded-xl border border-amber-200">
              <h3 className="text-lg font-bold text-amber-800 mb-2">
                Classroom Locked
              </h3>
              <p className="text-amber-700 mb-6 text-sm">
                This session has already started or the teacher has locked the classroom. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white text-amber-800 font-bold rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors"
              >
                Check Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  placeholder="e.g. 21"
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Batch / Class
                </label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 10th A"
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
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
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg"
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
