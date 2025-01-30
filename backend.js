const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users
let connectedUsers = {};

wss.on("connection", (ws) => {
    console.log("🔵 WebSocket Connected");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`📩 Received message:`, data);

            if (data.type === "connect") {
                connectedUsers[ws] = { username: data.username, status: "connected", bgm: null };
                ws.send(JSON.stringify({ type: "connectSuccess", username: data.username }));
            }

            if (data.type === "statusUpdate") {
                connectedUsers[ws] = { ...connectedUsers[ws], status: data.status, bgm: data.bgm };
                broadcast({ type: "statusUpdate", username: data.username, status: data.status });
            }
        } catch (error) {
            console.error("⚠️ Error:", error);
        }
    });

    ws.on("close", () => {
        console.log("🔴 WebSocket Disconnected");
        delete connectedUsers[ws];
    });
});

// ✅ ADD THIS ROUTE TO FIX THE 404 ERROR!
app.post("/statusUpdate", (req, res) => {
    const { type, username, status, bgm } = req.body;

    if (!username || !status) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`📡 Status Update: ${username} is now ${status}`);
    broadcast({ type, username, status, bgm });

    res.json({ message: "Status update received" });
});

// Function to Broadcast WebSocket Messages
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
