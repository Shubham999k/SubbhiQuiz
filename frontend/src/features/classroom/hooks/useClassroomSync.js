import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export const useClassroomSync = (
  sessionCode,
  role = "projector",
  onReceiveEvent = null,
  // NEW optional callbacks
  {
    onWildcardRequest = null,    // teacher: receives wildcard request
    onViolationUpdate = null,    // teacher: receives student violation update
    onSummaryReleased = null,    // student: summary released
    onWildcardApproved = null,   // student: wildcard approved + snapshot
    onWildcardRejected = null,   // student: wildcard rejected
    onRecoverStudents = null,    // teacher: recover active students map
  } = {}
) => {
  const socketRef = useRef(null);
  const [projectorState, setProjectorState] = useState(null);

  // Keep latest callbacks in a ref to avoid stale closures in socket listeners
  const callbacksRef = useRef({
    onReceiveEvent,
    onWildcardRequest,
    onViolationUpdate,
    onSummaryReleased,
    onWildcardApproved,
    onWildcardRejected,
    onRecoverStudents,
  });

  useEffect(() => {
    callbacksRef.current = {
      onReceiveEvent,
      onWildcardRequest,
      onViolationUpdate,
      onSummaryReleased,
      onWildcardApproved,
      onWildcardRejected,
      onRecoverStudents,
    };
  });

  useEffect(() => {
    if (!sessionCode) return;

    const serverHostname =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? typeof __LOCAL_IP__ !== "undefined"
          ? __LOCAL_IP__
          : window.location.hostname
        : window.location.hostname;

    const serverUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.DEV
        ? `${window.location.protocol}//${serverHostname}:5000`
        : "https://subbhiquiz.onrender.com");

    const socket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_session", sessionCode);
      // Teacher registers to receive targeted events
      if (role === "teacher") {
        socket.emit("teacher_register", { sessionCode });
      }
    });

    socket.on("state_update", (state) => {
      if (role !== "teacher") {
        setProjectorState(state);
      }
    });

    socket.on("student_event", (event) => {
      if (callbacksRef.current.onReceiveEvent) {
        callbacksRef.current.onReceiveEvent(event);
      }
    });

    // ── Teacher listeners ──────────────────────────────────────
    if (role === "teacher") {
      socket.on("teacher_wildcard_request", (data) => {
        if (callbacksRef.current.onWildcardRequest) callbacksRef.current.onWildcardRequest(data);
      });

      socket.on("student_violation_update", (data) => {
        if (callbacksRef.current.onViolationUpdate) callbacksRef.current.onViolationUpdate(data);
      });
      
      socket.on("teacher_recover_students", (data) => {
        if (callbacksRef.current.onRecoverStudents) callbacksRef.current.onRecoverStudents(data);
      });
    }

    // ── Student listeners ──────────────────────────────────────
    if (role === "student") {
      socket.on("SUMMARY_RELEASED", (data) => {
        if (callbacksRef.current.onSummaryReleased) callbacksRef.current.onSummaryReleased(data);
      });

      socket.on("student_wildcard_approved", (data) => {
        if (callbacksRef.current.onWildcardApproved) callbacksRef.current.onWildcardApproved(data);
      });

      socket.on("student_wildcard_rejected", (data) => {
        if (callbacksRef.current.onWildcardRejected) callbacksRef.current.onWildcardRejected(data);
      });

      socket.on("violation_recorded", (data) => {
        // Student can track server-confirmed violation count if needed
        socketRef.current._lastViolationData = data;
      });
    }

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode, role]);

  // ── Teacher methods ────────────────────────────────────────────

  /** Teacher broadcasts full state to room */
  const broadcastState = useCallback(
    (newState) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("broadcast_state", {
          sessionCode,
          state: newState,
        });
      }
    },
    [role, sessionCode]
  );

  /** Teacher/student sends generic student event */
  const broadcastEvent = useCallback(
    (type, payload) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("student_event", {
          sessionCode,
          event: { type, payload },
        });
      }
    },
    [sessionCode]
  );

  /** Teacher releases leaderboard (existing) */
  const releaseResults = useCallback(
    (payload) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("release_results", {
          sessionCode,
          ...payload,
        });
      }
    },
    [role, sessionCode]
  );

  /** Teacher saves current quiz snapshot so wildcard students can join */
  const saveStateSnapshot = useCallback(
    (snapshot) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("teacher_state_snapshot", {
          sessionCode,
          snapshot,
        });
      }
    },
    [role, sessionCode]
  );

  /** Teacher toggles wildcard entry */
  const setWildcardEnabled = useCallback(
    (enabled) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("teacher_set_wildcard", { sessionCode, enabled });
      }
    },
    [role, sessionCode]
  );

  /** Teacher approves a wildcard request */
  const approveWildcard = useCallback(
    (roll) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("teacher_approve_wildcard", { sessionCode, roll });
      }
    },
    [role, sessionCode]
  );

  /** Teacher rejects a wildcard request */
  const rejectWildcard = useCallback(
    (roll) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("teacher_reject_wildcard", { sessionCode, roll });
      }
    },
    [role, sessionCode]
  );

  /** Teacher forcefully locks a student */
  const lockStudent = useCallback(
    (roll) => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("teacher_lock_student", { sessionCode, roll });
      }
    },
    [role, sessionCode]
  );

  /** Teacher releases the answer summary */
  const releaseSummary = useCallback(
    () => {
      if (role === "teacher" && socketRef.current?.connected) {
        socketRef.current.emit("release_summary", { sessionCode });
      }
    },
    [role, sessionCode]
  );

  // ── Student methods ────────────────────────────────────────────

  /** Student reports an integrity/focus violation to the server */
  const reportViolation = useCallback(
    (eventType, questionIndex = null, metadata = {}) => {
      if (socketRef.current?.connected) {
        const roll = (() => {
          try {
            const saved = localStorage.getItem(`student_session_${sessionCode}`);
            return saved ? JSON.parse(saved).roll : null;
          } catch {
            return null;
          }
        })();
        if (!roll) return;
        socketRef.current.emit("student_focus_violation", {
          sessionCode,
          roll,
          eventType,
          questionIndex,
          metadata,
        });
      }
    },
    [sessionCode]
  );

  /** Student requests a lifeline (server-authoritative) */
  const requestLifeline = useCallback(
    (questionId, questionIndex) => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, reason: "Not connected." });
          return;
        }
        const roll = (() => {
          try {
            const saved = localStorage.getItem(`student_session_${sessionCode}`);
            return saved ? JSON.parse(saved).roll : null;
          } catch {
            return null;
          }
        })();
        if (!roll) {
          resolve({ success: false, reason: "Student not identified." });
          return;
        }
        socketRef.current.emit(
          "lifeline_request",
          { sessionCode, roll, questionId, questionIndex },
          (response) => resolve(response)
        );
      });
    },
    [sessionCode]
  );

  /** Student checks current lifeline count (for reconnect restoration) */
  const checkLifelines = useCallback(
    (roll) => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ remaining: 2 });
          return;
        }
        socketRef.current.emit("check_lifelines", { sessionCode, roll }, resolve);
      });
    },
    [sessionCode]
  );

  /** Student requests wildcard entry */
  const requestWildcard = useCallback(
    (name, roll, batch) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("wildcard_request", { sessionCode, name, roll, batch });
      }
    },
    [sessionCode]
  );

  /** Student checks if summary is released and fetches their data */
  const checkSummary = useCallback(
    (roll) => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, summaryReleased: false });
          return;
        }
        socketRef.current.emit("check_summary", { sessionCode, roll }, resolve);
      });
    },
    [sessionCode]
  );

  /** Student checks their current locked/rejected status on reconnect */
  const checkStudentStatus = useCallback(
    (roll) => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false });
          return;
        }
        socketRef.current.emit("check_student_status", { sessionCode, roll }, resolve);
      });
    },
    [sessionCode]
  );

  return {
    projectorState,
    broadcastState,
    broadcastEvent,
    releaseResults,
    saveStateSnapshot,
    setWildcardEnabled,
    approveWildcard,
    rejectWildcard,
    lockStudent,
    releaseSummary,
    reportViolation,
    requestLifeline,
    checkLifelines,
    requestWildcard,
    checkSummary,
    checkStudentStatus,
    socket: socketRef.current,
  };
};
