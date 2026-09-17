export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_session", (sessionCode) => {
      if (!sessionCode) return;
      socket.join(sessionCode);
      console.log(`User ${socket.id} joined session ${sessionCode}`);
    });

    socket.on("broadcast_state", ({ sessionCode, state }) => {
      // Broadcast state to all clients in the room (including sender if needed, but 'to' excludes sender by default)
      // Actually, projector needs state too. We can use socket.to(sessionCode).emit()
      socket.to(sessionCode).emit("state_update", state);
    });

    socket.on("student_event", ({ sessionCode, event }) => {
      // Students send events like STUDENT_JOIN or STUDENT_ANSWER
      socket.to(sessionCode).emit("student_event", event);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
