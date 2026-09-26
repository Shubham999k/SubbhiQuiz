// In-memory store for classroom sessions
// Structure: {
//   [sessionCode]: {
//     resultsReleased, releasedAt, students, leaderboard, totalQuestions,  // EXISTING
//     summaryReleased,      // NEW — separate from leaderboard release
//     wildcardEnabled,      // NEW — teacher toggle
//     wildcardRequests,     // NEW — pending wildcard requests
//     teacherSocketId,      // NEW — to send targeted events to teacher
//     quizIntegrity,        // NEW — { [roll]: { violations: [], violationCount: 0, locked: false } }
//     studentLifelines,     // NEW — { [roll]: { remaining: 2, usedOnQuestions: [] } }
//     quizSnapshot,         // NEW — current state snapshot for wildcard joins (set by teacher)
//     studentSummaryData,   // NEW — full summary data (set at release_results time)
//   }
import jwt from "jsonwebtoken";

const activeSessions = {};

export const getActiveSession = (sessionCode) => activeSessions[sessionCode];

// Helper: ensure session exists in memory
function ensureSession(sessionCode) {
  if (!activeSessions[sessionCode]) {
    activeSessions[sessionCode] = {
      // existing fields
      resultsReleased: false,
      releasedAt: null,
      students: {},
      leaderboard: [],
      totalQuestions: 0,
      // new fields
      summaryReleased: false,
      wildcardEnabled: false,
      wildcardRequests: [],
      teacherSocketId: null,
      quizIntegrity: {},
      studentLifelines: {},
      quizSnapshot: null,
      studentSummaryData: null,
      latestState: null, // NEW: Cache latest state for reconnections
      rejectedWildcards: new Set(),
      activeStudentsMap: {},
    };
  }
  return activeSessions[sessionCode];
}

// Helper: initialize per-student integrity record
function ensureIntegrity(session, roll) {
  if (!session.quizIntegrity[roll]) {
    session.quizIntegrity[roll] = {
      violations: [],
      violationCount: 0,
      locked: false,
    };
  }
  return session.quizIntegrity[roll];
}

// Helper: initialize per-student lifelines
function ensureLifelines(session, roll) {
  if (!session.studentLifelines[roll]) {
    session.studentLifelines[roll] = {
      remaining: 2,
      usedOnQuestions: [],
    };
  }
  return session.studentLifelines[roll];
}

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    // Emit current server version to client
    socket.emit("app_version", process.env.APP_VERSION || "1.0.0");

    // ─────────────────────────────────────────────────────────────
    // EXISTING: Students/projector join a session room
    // ─────────────────────────────────────────────────────────────
    socket.on("join_session", (data) => {
      const sessionCode = typeof data === "string" ? data : data.sessionCode;
      const token = typeof data === "object" ? data.token : null;
      if (!sessionCode) return;
      
      // Verify authorization
      try {
        if (!token) throw new Error("No token provided");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        if (decoded.role === "student" && decoded.sessionCode !== sessionCode) {
          throw new Error("Student token does not match sessionCode");
        }
        socket.user = decoded; // Cache user context on socket
      } catch (err) {
        socket.emit("error", { message: "Unauthorized to join this room" });
        return; // Deny join
      }

      socket.join(sessionCode);
      socket.data.sessionCode = sessionCode; // Track room for later events
      
      // If a student refreshes, instantly send them the latest state
      const session = ensureSession(sessionCode);
      if (session.latestState) {
        socket.emit("state_update", session.latestState);
      }
      
      console.log(`User ${socket.id} joined session ${sessionCode} as ${socket.user.role || 'teacher'}`);
    });

    // EXISTING: Teacher broadcasts full state to everyone in room
    socket.on("broadcast_state", ({ sessionCode, state }) => {
      if (socket.user?.role === "student") return; // Students cannot broadcast state
      const session = ensureSession(sessionCode);
      session.latestState = state; // Cache it
      socket.to(sessionCode).emit("state_update", state);
    });

    // EXISTING: Students send events like STUDENT_JOIN or STUDENT_ANSWER
    socket.on("student_event", ({ sessionCode, event }) => {
      if (socket.data?.sessionCode !== sessionCode && socket.user?.role !== "teacher") return; // Verify boundary
      
      const session = ensureSession(sessionCode);
      const roll = event?.payload?.roll;

      if (roll) {
        // Enforce locked/rejected status
        if (session.rejectedWildcards.has(roll)) return; // Block rejected
        if (session.quizIntegrity[roll]?.locked) return; // Block locked
        
        if (event.type === "STUDENT_JOIN") {
          session.activeStudentsMap[roll] = event.payload;
        }
      }
      
      socket.to(sessionCode).emit("student_event", event);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student checks their current locked/rejected status on reconnect
    // ─────────────────────────────────────────────────────────────
    socket.on("check_student_status", ({ sessionCode, roll }, callback) => {
      if (typeof callback !== "function") return;
      if (socket.data?.sessionCode !== sessionCode && socket.user?.role !== "teacher") {
        callback({ success: false, reason: "Unauthorized" });
        return;
      }
      if (!sessionCode || !roll) {
        callback({ success: false });
        return;
      }
      const session = ensureSession(sessionCode);
      const integrity = session.quizIntegrity[roll];
      
      callback({
        success: true,
        locked: integrity ? integrity.locked : false,
        rejected: session.rejectedWildcards.has(roll),
      });
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher registers as teacher for this session (to receive targeted events)
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_register", ({ sessionCode }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode) return;
      const session = ensureSession(sessionCode);
      session.teacherSocketId = socket.id;

      // Resend pending wildcard requests to reconnecting teacher
      session.wildcardRequests.forEach((request) => {
        socket.emit("teacher_wildcard_request", { sessionCode, request });
      });

      // Send active students to recover joined list if teacher refreshed
      const students = Object.values(session.activeStudentsMap);
      if (students.length > 0) {
        socket.emit("teacher_recover_students", { students });
      }

      // Resend violations for locked students
      Object.entries(session.quizIntegrity).forEach(([roll, data]) => {
         if (data.locked || data.violationCount > 0) {
           socket.emit("student_violation_update", {
             roll,
             violationCount: data.violationCount,
             locked: data.locked,
             latestViolation: data.violations[data.violations.length - 1]
           });
         }
      });

      console.log(`Teacher registered for session ${sessionCode}: ${socket.id}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher saves quiz snapshot so wildcard students can join mid-quiz
    // Payload: { sessionCode, snapshot: { questions, currentQuestionIndex, timeRemaining, quizStarted, currentQuiz } }
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_state_snapshot", ({ sessionCode, snapshot }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode || !snapshot) return;
      const session = ensureSession(sessionCode);
      session.quizSnapshot = snapshot;
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher toggles wildcard entry
    // Payload: { sessionCode, enabled: boolean }
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_set_wildcard", ({ sessionCode, enabled }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode) return;
      const session = ensureSession(sessionCode);
      session.wildcardEnabled = !!enabled;
      console.log(`Wildcard entry ${enabled ? "enabled" : "disabled"} for session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student requests wildcard entry
    // Payload: { sessionCode, name, roll, batch }
    // ─────────────────────────────────────────────────────────────
    socket.on("wildcard_request", ({ sessionCode, name, roll, batch }) => {
      if (socket.data?.sessionCode !== sessionCode) return;
      if (!sessionCode || !roll) return;
      const session = ensureSession(sessionCode);

      if (!session.wildcardEnabled) {
        socket.emit("student_wildcard_rejected", { reason: "Wildcard entry is not enabled." });
        return;
      }

      if (session.rejectedWildcards.has(roll)) {
        socket.emit("student_wildcard_rejected", { reason: "Your wildcard request was previously rejected by the teacher." });
        return;
      }

      // Prevent duplicate requests
      const existing = session.wildcardRequests.find((r) => r.roll === roll);
      if (existing) {
        socket.emit("student_wildcard_pending", { message: "Your request is already pending." });
        return;
      }

      const request = {
        socketId: socket.id,
        name,
        roll,
        batch: batch || "",
        requestedAt: new Date(),
      };
      session.wildcardRequests.push(request);

      // Notify teacher
      io.to(sessionCode).emit("teacher_wildcard_request", {
        sessionCode,
        request,
      });

      console.log(`Wildcard request from ${roll} for session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher approves a wildcard request
    // Payload: { sessionCode, roll }
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_approve_wildcard", ({ sessionCode, roll }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode || !roll) return;
      const session = ensureSession(sessionCode);

      const reqIdx = session.wildcardRequests.findIndex((r) => r.roll === roll);
      if (reqIdx !== -1) {
        session.wildcardRequests.splice(reqIdx, 1);
      }

      // Initialize lifelines for this student
      ensureLifelines(session, roll);
      
      // RESET integrity (unlock them) on wildcard approval!
      session.quizIntegrity[roll] = {
        violations: [],
        violationCount: 0,
        locked: false,
      };

      // Send approval + current quiz snapshot to the student room with their roll
      io.to(sessionCode).emit("student_wildcard_approved", {
        roll,
        snapshot: session.quizSnapshot,
      });

      console.log(`Wildcard approved for ${roll} in session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher rejects a wildcard request
    // Payload: { sessionCode, roll }
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_reject_wildcard", ({ sessionCode, roll }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode || !roll) return;
      const session = ensureSession(sessionCode);

      const reqIdx = session.wildcardRequests.findIndex((r) => r.roll === roll);
      if (reqIdx === -1) return;

      session.rejectedWildcards.add(roll);
      const [req] = session.wildcardRequests.splice(reqIdx, 1);

      io.to(sessionCode).emit("student_wildcard_rejected", {
        roll,
        reason: "Your wildcard request was rejected by the teacher.",
      });

      console.log(`Wildcard rejected for ${roll} in session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher forcefully locks a student
    // Payload: { sessionCode, roll }
    // ─────────────────────────────────────────────────────────────
    socket.on("teacher_lock_student", ({ sessionCode, roll }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode || !roll) return;
      const session = ensureSession(sessionCode);
      const integrity = ensureIntegrity(session, roll);

      integrity.locked = true;
      integrity.violationCount = Math.max(integrity.violationCount, 3);

      io.to(sessionCode).emit("student_violation_update", {
        roll,
        violationCount: integrity.violationCount,
        locked: true,
        latestViolation: {
          eventType: "teacher_forced_lock",
          timestamp: new Date(),
        },
      });

      console.log(`Teacher forcefully locked ${roll} in session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student reports a focus/integrity violation
    // Payload: { sessionCode, roll, eventType, questionIndex, metadata }
    // ─────────────────────────────────────────────────────────────
    socket.on("student_focus_violation", ({ sessionCode, roll, eventType, questionIndex, metadata }) => {
      if (socket.data?.sessionCode !== sessionCode) return;
      if (!sessionCode || !roll || !eventType) return;
      const session = ensureSession(sessionCode);
      const integrity = ensureIntegrity(session, roll);

      const violation = {
        eventType,
        questionIndex: questionIndex ?? null,
        metadata: metadata ?? {},
        timestamp: new Date(),
      };
      integrity.violations.push(violation);
      integrity.violationCount = integrity.violations.length;

      // Lock student after 3 violations (configurable threshold)
      const MAX_VIOLATIONS = 3;
      if (integrity.violationCount >= MAX_VIOLATIONS && !integrity.locked) {
        integrity.locked = true;
      }

      // Notify teacher (using room to ensure delivery even if teacher reconnects and socketId changes)
      io.to(sessionCode).emit("student_violation_update", {
        roll,
        violationCount: integrity.violationCount,
        locked: integrity.locked,
        latestViolation: violation,
      });

      // Confirm to student (inform if locked)
      socket.emit("violation_recorded", {
        violationCount: integrity.violationCount,
        locked: integrity.locked,
        maxViolations: MAX_VIOLATIONS,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student requests a lifeline
    // Payload: { sessionCode, roll, questionId, questionIndex }
    // Callback: { success, hintOption, remaining, reason? }
    // ─────────────────────────────────────────────────────────────
    socket.on("lifeline_request", ({ sessionCode, roll, questionId, questionIndex }, callback) => {
      if (typeof callback !== "function") return;
      if (socket.data?.sessionCode !== sessionCode) {
        callback({ success: false, reason: "Unauthorized" });
        return;
      }
      if (!sessionCode || !roll) {
        callback({ success: false, reason: "Invalid request." });
        return;
      }

      const session = ensureSession(sessionCode);
      const lifelines = ensureLifelines(session, roll);

      if (lifelines.remaining <= 0) {
        callback({ success: false, reason: "No lifelines remaining." });
        return;
      }

      // Prevent using a lifeline on the same question twice
      if (lifelines.usedOnQuestions.includes(questionIndex)) {
        callback({ success: false, reason: "Lifeline already used on this question." });
        return;
      }

      // Get correct answer from quiz snapshot
      const snapshot = session.quizSnapshot;
      if (!snapshot || !snapshot.questions) {
        callback({ success: false, reason: "Quiz data not available." });
        return;
      }

      const question = snapshot.questions.find((q) => q.id === questionId);
      if (!question || !question.correctAnswer) {
        callback({ success: false, reason: "Question not found." });
        return;
      }

      // Consume lifeline
      lifelines.remaining -= 1;
      lifelines.usedOnQuestions.push(questionIndex);

      console.log(`Lifeline used by ${roll} on q${questionIndex} in session ${sessionCode}. Remaining: ${lifelines.remaining}`);

      callback({
        success: true,
        hintOption: question.correctAnswer,
        remaining: lifelines.remaining,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student checks their current lifeline status (for reconnect)
    // Payload: { sessionCode, roll }
    // Callback: { remaining }
    // ─────────────────────────────────────────────────────────────
    socket.on("check_lifelines", ({ sessionCode, roll }, callback) => {
      if (typeof callback !== "function") return;
      if (socket.data?.sessionCode !== sessionCode && socket.user?.role !== "teacher") {
        callback({ remaining: 2 });
        return;
      }
      const session = activeSessions[sessionCode];
      if (!session) {
        callback({ remaining: 2 }); // default for new sessions
        return;
      }
      const lifelines = ensureLifelines(session, roll);
      callback({ remaining: lifelines.remaining });
    });

    // ─────────────────────────────────────────────────────────────
    // EXISTING: Teacher releases leaderboard results
    // Extended to also store questions + participant answers for summary
    // ─────────────────────────────────────────────────────────────
    socket.on("release_results", ({ sessionCode, studentScores, joinedStudents, totalQuestions, questions, cumulativeAnswers }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode || !studentScores || !joinedStudents) return;

      const session = ensureSession(sessionCode);

      // Calculate ranks (existing logic)
      const leaderboard = joinedStudents.map((student) => {
        const score = studentScores[student.roll] || 0;
        return { ...student, score };
      });

      leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      let currentRank = 1;
      for (let i = 0; i < leaderboard.length; i++) {
        if (i > 0 && leaderboard[i].score === leaderboard[i - 1].score) {
          leaderboard[i].rank = leaderboard[i - 1].rank;
        } else {
          leaderboard[i].rank = currentRank;
        }
        currentRank++;
      }

      const studentsMap = {};
      leaderboard.forEach((student) => {
        studentsMap[student.roll] = student;
      });

      const sanitizedLeaderboard = leaderboard.map((s) => ({
        rank: s.rank,
        name: s.name,
        score: s.score,
        roll: s.roll,
      }));

      session.resultsReleased = true;
      session.releasedAt = new Date();
      session.students = studentsMap;
      session.leaderboard = sanitizedLeaderboard;
      session.totalQuestions = totalQuestions;

      // NEW: store questions + cumulative answers for summary feature
      if (questions) {
        session.studentSummaryData = {
          questions,         // full questions with correctAnswer + explanation
          cumulativeAnswers: cumulativeAnswers || {}, // { roll: { questionId: option } }
        };
      }

      io.to(sessionCode).emit("LEADERBOARD_RELEASED", {
        releasedAt: session.releasedAt,
        leaderboard: sanitizedLeaderboard,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // EXISTING: Student requests their personal result
    // ─────────────────────────────────────────────────────────────
    socket.on("check_result", ({ sessionCode, roll }, callback) => {
      if (socket.data?.sessionCode !== sessionCode && socket.user?.role !== "teacher") {
        callback({ success: false, reason: "Unauthorized" });
        return;
      }
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
            leaderboard: session.leaderboard,
          });
          return;
        }
      }
      callback({ success: false });
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Teacher releases answer summary (separate from leaderboard)
    // Payload: { sessionCode }
    // ─────────────────────────────────────────────────────────────
    socket.on("release_summary", ({ sessionCode }) => {
      if (socket.user?.role !== "teacher") return;
      if (!sessionCode) return;
      const session = ensureSession(sessionCode);
      session.summaryReleased = true;

      io.to(sessionCode).emit("SUMMARY_RELEASED", {
        releasedAt: new Date(),
      });

      console.log(`Answer summary released for session ${sessionCode}`);
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Student checks if summary is available + fetches their data
    // Payload: { sessionCode, roll }
    // Callback: { success, summaryReleased, myAnswers, questions }
    // ─────────────────────────────────────────────────────────────
    socket.on("check_summary", ({ sessionCode, roll }, callback) => {
      if (typeof callback !== "function") return;
      if (socket.data?.sessionCode !== sessionCode && socket.user?.role !== "teacher") {
        callback({ success: false, reason: "Unauthorized" });
        return;
      }

      const session = activeSessions[sessionCode];
      if (!session || !session.summaryReleased) {
        callback({ success: false, summaryReleased: false });
        return;
      }

      const summaryData = session.studentSummaryData;
      if (!summaryData) {
        callback({ success: false, summaryReleased: true, reason: "Summary data not available." });
        return;
      }

      // Only return this student's answers (privacy)
      const myAnswers = summaryData.cumulativeAnswers[roll] || {};

      callback({
        success: true,
        summaryReleased: true,
        myAnswers,
        questions: summaryData.questions,
        studentInfo: session.students[roll] || null,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
