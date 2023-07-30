// index.js (Server)

const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

const connectedUsers = {};
const activeCalls = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    connectedUsers[userId] = socket.id;
    socket.broadcast.emit("userJoined", userId);
  });

  socket.on("callRequest", (data) => {
    const { from, to } = data;
    const toSocketId = connectedUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callRequest", from);
    }
  });

  socket.on("acceptCall", (data) => {
    const { from, signal } = data;
    const fromSocketId = connectedUsers[from];
    if (fromSocketId) {
      io.to(fromSocketId).emit("callAccepted", signal);
      // Mark the call as active between these two users
      activeCalls[from] = connectedUsers[socket.id];
      activeCalls[socket.id] = fromSocketId;
    }
  });

  socket.on("rejectCall", (data) => {
    const { from } = data;
    const fromSocketId = connectedUsers[from];
    if (fromSocketId) {
      io.to(fromSocketId).emit("callRejected");
    }
  });

  socket.on("hangUpCall", () => {
    const partnerSocketId = activeCalls[socket.id];
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("callEnded");
      delete activeCalls[socket.id];
      delete activeCalls[partnerSocketId];
    }
  });

  socket.on("disconnect", () => {
    // Clean up disconnected user from connectedUsers and activeCalls
    const userId = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key] === socket.id
    );
    if (userId) {
      delete connectedUsers[userId];
      if (activeCalls[socket.id]) {
        const partnerSocketId = activeCalls[socket.id];
        io.to(partnerSocketId).emit("callEnded");
        delete activeCalls[partnerSocketId];
      }
      delete activeCalls[socket.id];
    }
    // Notify other users about the disconnected user
    socket.broadcast.emit("userLeft", socket.id);
  });
});

const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
