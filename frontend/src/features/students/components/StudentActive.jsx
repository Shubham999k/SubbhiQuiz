import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
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

  // Connect to channel
  const { projectorState, broadcastEvent } = useClassroomSync(
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
    });
  };

  if (!studentInfo || !projectorState) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-medium">
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
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-indigo-600 text-white p-4 shadow-md flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider">
            QUIZPRO CLASSROOM
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Quiz Completed!
            </h2>
            <p className="text-gray-500 mb-8">
              Look at the projector for the final results.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem(`student_session_${sessionCode}`);
                navigate("/");
              }}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl w-full"
            >
              Return Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
          <div className="font-bold">{studentInfo.name}</div>
          <div className="bg-indigo-800 px-3 py-1 rounded text-sm">
            Roll: {studentInfo.roll}
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Successfully Joined!
          </h2>
          <p className="text-gray-500 text-lg animate-pulse text-center">
            Waiting for teacher to start...
          </p>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div className="font-bold truncate max-w-[150px]">
          {studentInfo.name}
        </div>
        <div className="font-bold text-indigo-200">
          Q {currentQuestionIndex + 1} / {questions.length}
        </div>
        <div className="bg-indigo-800 px-3 py-1 rounded text-sm shrink-0">
          Roll: {studentInfo.roll}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 leading-snug">
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
              "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
            let labelClass = "bg-gray-100 text-gray-500 border-gray-300";

            if (isCorrectAnswer) {
              btnClass =
                "bg-green-50 border-green-500 text-green-800 shadow-md";
              labelClass = "bg-green-500 text-white border-green-500";
            } else if (isIncorrectSelected) {
              btnClass = "bg-red-50 border-red-500 text-red-800 shadow-md";
              labelClass = "bg-red-500 text-white border-red-500";
            } else if (isSelected) {
              btnClass =
                "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-md";
              labelClass = "bg-indigo-500 text-white border-indigo-500";
            } else if (isAnswerRevealed || myAnswer) {
              // Dim others
              btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
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
          <div className="mt-8 text-center text-indigo-600 font-medium animate-pulse">
            Answer submitted. Waiting for results...
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentActive;
