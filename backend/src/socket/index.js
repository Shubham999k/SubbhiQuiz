// In-memory store for classroom results
// Structure: { [sessionCode]: { resultsReleased: boolean, releasedAt: Date, students: { [roll]: { rank, score, ... } }, leaderboard: [] } }
const activeSessions = {};

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Students join session and identify themselves
    socket.on("join_session", (data) => {
      // Compatibility with old clients passing string
      const sessionCode = typeof data === "string" ? data : data.sessionCode;
      if (!sessionCode) return;
      
      socket.join(sessionCode);
      console.log(`User ${socket.id} joined session ${sessionCode}`);

      // If they passed roll, we can map it. For now, we'll just handle it in check_result.
    });

    socket.on("broadcast_state", ({ sessionCode, state }) => {
      // Broadcast state to all clients in the room
      socket.to(sessionCode).emit("state_update", state);
    });

    socket.on("student_event", ({ sessionCode, event }) => {
      // Students send events like STUDENT_JOIN or STUDENT_ANSWER
      socket.to(sessionCode).emit("student_event", event);
    });

    // ADMIN: Teacher releases results
    socket.on("release_results", ({ sessionCode, studentScores, joinedStudents, totalQuestions }) => {
      if (!sessionCode || !studentScores || !joinedStudents) return;

      // 1. Calculate Ranks Server-Side
      const leaderboard = joinedStudents.map(student => {
        const score = studentScores[student.roll] || 0;
        return {
          ...student,
          score,
        };
      });

      // Sort by score (descending), then by timestamp (ascending) as tie-breaker
      leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      // Assign ranks (handling ties properly if scores are exactly equal)
      let currentRank = 1;
      for (let i = 0; i < leaderboard.length; i++) {
        if (i > 0 && leaderboard[i].score === leaderboard[i - 1].score) {
          leaderboard[i].rank = leaderboard[i - 1].rank;
        } else {
          leaderboard[i].rank = currentRank;
        }
        currentRank++;
      }

      // Store in memory
      const studentsMap = {};
      leaderboard.forEach(student => {
        studentsMap[student.roll] = student;
      });

      const sanitizedLeaderboard = leaderboard.map(s => ({
        rank: s.rank,
        name: s.name,
        score: s.score,
        roll: s.roll
      }));

      activeSessions[sessionCode] = {
        resultsReleased: true,
        releasedAt: new Date(),
        students: studentsMap,
        leaderboard: sanitizedLeaderboard,
        totalQuestions
      };

      // Emit global event so students know results are ready
      // We also send the sanitized leaderboard
      io.to(sessionCode).emit("LEADERBOARD_RELEASED", {
        releasedAt: activeSessions[sessionCode].releasedAt,
        leaderboard: sanitizedLeaderboard
      });
      
      // Also emit individual personal results to each student's specific socket if we mapped them?
      // Since we don't strictly map socket.id -> roll upon connection currently, 
      // the safest way is to let the client request it immediately upon hearing LEADERBOARD_RELEASED.
    });

    // STUDENT: Request personal result securely
    socket.on("check_result", ({ sessionCode, roll }, callback) => {
      const session = activeSessions[sessionCode];
      if (session && session.resultsReleased) {
        const personalResult = session.students[roll];
        if (personalResult) {
          callback({
            success: true,
            result: {
              ...personalResult,
              totalQuestions: session.totalQuestions,
            },
            leaderboard: session.leaderboard
          });
          return;
        }
      }
      callback({ success: false });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
