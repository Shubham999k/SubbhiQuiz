import React, { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useClassroomSync } from "../../../features/classroom/hooks/useClassroomSync";
import { Clock, CheckCircle2, Maximize, Users, Trophy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const ClassroomProjector = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSessionCode = searchParams.get("session");

  const { projectorState } = useClassroomSync(
    initialSessionCode || quizId,
    "projector",
  );

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {}, []);

  const {
    questions,
    currentQuiz,
    currentQuestionIndex = 0,
    selectedOption,
    isAnswerRevealed,
    classResponses,
    timeRemaining = 0,
    quizCompleted,
    sessionCode = initialSessionCode,
    showQR = true,
    quizStarted = false,
    joinedCount = 0,
    studentScores = {},
    joinedStudents = [],
  } = projectorState || {};

  if (!questions || questions.length === 0 || !currentQuiz) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center flex-col">
        <h1 className="text-4xl font-bold mb-4">
          Waiting for teacher to start session...
        </h1>
        <p className="text-gray-400">The presentation will begin shortly.</p>
      </div>
    );
  }

  if (quizCompleted) {
    const sortedStudents = joinedStudents
      .map((student) => ({
        ...student,
        score: studentScores[student.roll] || 0,
      }))
      .sort((a, b) => b.score - a.score);

    const topThree = sortedStudents.slice(0, 3);
    const others = sortedStudents.slice(3, 10); // Show top 10 others

    return (
      <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center py-12 px-4 overflow-y-auto">
        <div className="w-full max-w-5xl bg-white text-gray-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
          <h1 className="text-5xl font-bold mb-4 text-indigo-900 flex items-center gap-4 uppercase tracking-widest">
            <Trophy className="w-14 h-14 text-yellow-500" /> Leaderboard
          </h1>
          <p className="text-xl text-gray-500 mb-12 font-medium capitalize">
            {currentQuiz.category} Fundamentals
          </p>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 h-80 mb-16 w-full max-w-3xl">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-700 truncate w-32">{topThree[1].name}</div>
                  <div className="text-lg font-mono text-indigo-600 font-bold">{topThree[1].score} pts</div>
                </div>
                <div className="w-full bg-gray-300 rounded-t-lg shadow-inner flex justify-center pt-4" style={{ height: '140px' }}>
                  <span className="text-4xl font-bold text-gray-500">2</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-center mb-4">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2 drop-shadow-md" />
                  <div className="text-3xl font-bold text-gray-800 truncate w-40">{topThree[0].name}</div>
                  <div className="text-xl font-mono text-indigo-600 font-bold">{topThree[0].score} pts</div>
                </div>
                <div className="w-full bg-yellow-400 rounded-t-lg shadow-inner flex justify-center pt-4" style={{ height: '180px' }}>
                  <span className="text-5xl font-bold text-yellow-700">1</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-600 truncate w-32">{topThree[2].name}</div>
                  <div className="text-lg font-mono text-indigo-600 font-bold">{topThree[2].score} pts</div>
                </div>
                <div className="w-full bg-orange-300 rounded-t-lg shadow-inner flex justify-center pt-4" style={{ height: '110px' }}>
                  <span className="text-4xl font-bold text-orange-700">3</span>
                </div>
              </div>
            )}
          </div>

          {/* Rest of Leaderboard */}
          {others.length > 0 && (
            <div className="w-full max-w-2xl bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-700 mb-4 uppercase tracking-wider text-center border-b pb-4">Runner Ups</h3>
              <div className="space-y-3">
                {others.map((student, idx) => (
                  <div key={student.roll} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center font-bold text-gray-400 text-lg">#{idx + 4}</span>
                      <span className="font-bold text-lg text-gray-800">{student.name}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-600">{student.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={() => window.close()}
            className="mt-12 px-8 py-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-full font-bold text-lg transition-colors"
          >
            Close Projector
          </button>
        </div>
      </div>
    );
  }

  const serverHostname =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? typeof __LOCAL_IP__ !== "undefined"
        ? __LOCAL_IP__
        : window.location.hostname
      : window.location.hostname;
  const joinUrl = import.meta.env.DEV 
    ? `${window.location.protocol}//${serverHostname}:${window.location.port}/student/join?session=${sessionCode}` 
    : `${window.location.origin}/student/join?session=${sessionCode}`;

  // Show Lobby / QR View if quiz hasn't started or teacher toggles Show QR
  if (!quizStarted || showQR) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
        <div className="bg-indigo-900 text-white p-6 shadow-md flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-4xl font-bold capitalize tracking-wide">
              {currentQuiz.category} Fundamentals
            </h1>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-white transition-colors"
          >
            <Maximize size={28} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 max-w-4xl w-full text-center flex flex-col items-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-2 uppercase tracking-widest">
              Join the Quiz
            </h2>
            <p className="text-gray-500 text-xl mb-12">
              Scan QR with your phone camera to join the classroom
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border-4 border-indigo-100 mb-10">
              <QRCodeSVG
                value={joinUrl}
                size={350}
                bgColor={"#ffffff"}
                fgColor={"#312e81"}
                level={"H"}
                includeMargin={false}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-center justify-center w-full mt-4">
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-10 py-6 text-center">
                <p className="text-indigo-600 font-bold uppercase tracking-wide text-sm mb-1">
                  Quiz Code
                </p>
                <p className="text-5xl font-mono font-bold text-indigo-900 tracking-wider">
                  {sessionCode}
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-10 py-6 text-center">
                <p className="text-green-600 font-bold uppercase tracking-wide text-sm mb-1">
                  Students Joined
                </p>
                <div className="text-5xl font-bold text-green-700 flex items-center justify-center gap-3">
                  <Users size={40} /> {joinedCount}
                </div>
              </div>
            </div>

            {!quizStarted && (
              <div className="mt-12 text-2xl text-gray-400 font-medium animate-pulse">
                Waiting for teacher to start...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal Quiz View
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  let totalResponses = 0;
  if (classResponses) {
    totalResponses = Object.values(classResponses).reduce(
      (sum, val) => sum + (parseInt(val) || 0),
      0,
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 sm:p-6 shadow-md flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold capitalize tracking-wide">
            {currentQuiz.category} Fundamentals
          </h1>
          <div className="text-indigo-200 text-lg sm:text-xl mt-1 sm:mt-2 font-medium">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="bg-indigo-800 px-4 py-2 rounded-xl text-center">
            <div className="text-indigo-200 text-xs font-bold uppercase">
              Joined
            </div>
            <div className="text-white font-bold text-xl">{joinedCount}</div>
          </div>

          <div
            className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-mono text-2xl sm:text-4xl font-bold bg-white text-indigo-900 shadow-inner
            ${timeRemaining <= 10 && timeRemaining > 0 ? "text-red-600 animate-pulse" : ""}
            ${timeRemaining === 0 ? "text-red-600" : ""}
          `}
          >
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
            {formatTime(timeRemaining)}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-white transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 shrink-0">
        <div
          className="bg-indigo-500 h-3 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-medium text-gray-900 mb-6 sm:mb-12 leading-tight whitespace-pre-line text-center">
          {currentQuestion.question}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-6xl mx-auto w-full">
          {currentQuestion.options.map((option, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = selectedOption === option;
            const isCorrect =
              isAnswerRevealed && option === currentQuestion.correctAnswer;
            const isIncorrectSelected =
              isAnswerRevealed && isSelected && !isCorrect;

            let cardClass = "bg-white border-gray-300 shadow-sm";
            let labelClass = "bg-gray-100 text-gray-500 border-gray-300";
            let textClass = "text-gray-800";

            if (isCorrect) {
              cardClass =
                "bg-green-500 border-green-600 shadow-lg scale-[1.02] transform transition-all";
              labelClass = "bg-green-600 text-white border-green-400";
              textClass = "text-white font-bold";
            } else if (isIncorrectSelected) {
              cardClass =
                "bg-red-500 border-red-600 shadow-lg scale-[1.02] transform transition-all";
              labelClass = "bg-red-600 text-white border-red-400";
              textClass = "text-white font-bold";
            } else if (isSelected) {
              cardClass =
                "bg-indigo-600 border-indigo-700 shadow-lg scale-[1.02] transform transition-all";
              labelClass = "bg-indigo-700 text-white border-indigo-500";
              textClass = "text-white font-bold";
            } else if (isAnswerRevealed) {
              // Dim other options if answer is revealed
              cardClass = "bg-gray-100 border-gray-200 opacity-60";
              textClass = "text-gray-500";
            }

            return (
              <div
                key={idx}
                className={`p-4 sm:p-6 lg:p-8 rounded-2xl border-4 flex items-center gap-4 sm:gap-6 ${cardClass} transition-all duration-300`}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-4 flex items-center justify-center text-xl sm:text-3xl lg:text-4xl font-bold shrink-0 ${labelClass}`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                  ) : (
                    label
                  )}
                </div>
                <span
                  className={`text-lg sm:text-2xl lg:text-4xl ${textClass}`}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>

        {/* Revealed Explanation & Stats Area */}
        <div
          className={`mt-12 transition-all duration-700 ${isAnswerRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
        >
          <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8">
            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="flex-1 bg-blue-50 border-l-8 border-blue-500 p-6 lg:p-8 rounded-r-xl shadow-md">
                <h3 className="text-2xl font-bold text-blue-900 mb-3">
                  Explanation
                </h3>
                <p className="text-xl text-blue-800 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Class Response Stats */}
            {classResponses && totalResponses > 0 && (
              <div className="flex-1 bg-white p-6 lg:p-8 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Class Response
                </h3>
                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    const count = parseInt(classResponses[label]) || 0;
                    const percentage =
                      totalResponses > 0
                        ? Math.round((count / totalResponses) * 100)
                        : 0;
                    const isCorrect = option === currentQuestion.correctAnswer;

                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-8 font-bold text-xl text-gray-600">
                          {label}
                        </div>
                        <div className="flex-1 bg-gray-100 h-8 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full ${isCorrect ? "bg-green-500" : "bg-gray-400"} transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-right font-bold text-lg text-gray-700">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomProjector;
