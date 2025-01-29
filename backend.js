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

// Store connected users
let connectedUsers = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("statusUpdate", (data) => {
        console.log(`Status update from ${data.username}:`, data);
        connectedUsers[socket.id] = data.username;
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        delete connectedUsers[socket.id];
    });
});

app.get("/status", (req, res) => {
    res.json({ activeUsers: Object.values(connectedUsers) });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
