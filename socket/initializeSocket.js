const { log } = require("console");
const socketIo = require("socket.io");
const express = require("express");
const http = require("http");

// Function to initialize Socket.IO and store user socket IDs
function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  const userSocketIds = {}; // Store user socket IDs

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // Store user socket ID when they connect
    socket.on("user_connected", (userId) => {
      userSocketIds[userId] = socket.id;
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove user socket ID when they disconnect
      const userId = Object.keys(userSocketIds).find(
        (key) => userSocketIds[key] === socket.id
      );
      if (userId) {
        delete userSocketIds[userId];
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  return { io, userSocketIds }; // Return the io object and user socket IDs
}

module.exports = { initializeSocket };
