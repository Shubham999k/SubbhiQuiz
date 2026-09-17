import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useClassroomSync = (
  sessionCode,
  role = "projector",
  onReceiveEvent = null,
) => {
  const socketRef = useRef(null);

  // State that the projector and students will listen to
  const [projectorState, setProjectorState] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;

    // Connect to the Socket.io server
    // We use VITE_SOCKET_URL in production, fallback to local IP in development
    const serverHostname =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? typeof __LOCAL_IP__ !== "undefined"
          ? __LOCAL_IP__
          : window.location.hostname
        : window.location.hostname;

    // In production, VITE_SOCKET_URL might be completely different domain (e.g. wss://backend.onrender.com)
    const serverUrl =
      import.meta.env.VITE_SOCKET_URL ||
      `${window.location.protocol}//${serverHostname}:5000`;
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_session", sessionCode);
    });

    socket.on("state_update", (state) => {
      if (role !== "teacher") {
        setProjectorState(state);
      }
    });

    socket.on("student_event", (event) => {
      if (onReceiveEvent) {
        onReceiveEvent(event);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionCode, role, onReceiveEvent]);

  // Method for teacher to broadcast full state
  const broadcastState = (newState) => {
    if (role === "teacher" && socketRef.current?.connected) {
      socketRef.current.emit("broadcast_state", {
        sessionCode,
        state: newState,
      });
    }
  };

  // Generic method to broadcast custom events (like student joining)
  const broadcastEvent = (type, payload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("student_event", {
        sessionCode,
        event: { type, payload },
      });
    }
  };

  return {
    projectorState,
    broadcastState,
    broadcastEvent,
  };
};
