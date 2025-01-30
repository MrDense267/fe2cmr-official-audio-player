const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users and their BGM status
let connectedUsers = {};

io.on("connection", (socket) => {
    console.log(`🔵 User connected: ${socket.id}`);

    socket.on("connect", (data) => {
        console.log(`✅ User ${data.username} connected.`);
        connectedUsers[socket.id] = {
            username: data.username,
            status: "connected",
            bgm: null,
            startUtcTime: null
        };
        io.emit("statusUpdate", { type: "connectSuccess", username: data.username });
    });

    socket.on("statusUpdate", (data) => {
        console.log(`🎵 Status update from ${data.username}:`, data);

        if (data.status === "ingame") {
            connectedUsers[socket.id] = {
                ...connectedUsers[socket.id],
                status: "ingame",
                bgm: data.bgm,
                startUtcTime: Date.now() / 1000 // Store timestamp
            };
            io.emit("statusUpdate", { 
                type: "statusUpdate", 
                username: data.username, 
                status: "ingame",
                bgm: data.bgm,
                startUtcTime: Date.now() / 1000 
            });
        }

        if (data.status === "died") {
            io.emit("statusUpdate", { type: "statusUpdate", username: data.username, status: "died" });
        }

        if (data.status === "leftGame") {
            io.emit("statusUpdate", { type: "statusUpdate", username: data.username, status: "leftGame" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User disconnected: ${socket.id}`);
        if (connectedUsers[socket.id]) {
            io.emit("statusUpdate", { type: "statusUpdate", username: connectedUsers[socket.id].username, status: "leftGame" });
        }
        delete connectedUsers[socket.id];
    });
});

// API Route to Get Active Users
app.get("/status", (req, res) => {
    res.json({ activeUsers: Object.values(connectedUsers) });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
