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

// Store connected users and their BGM status
let connectedUsers = {};

wss.on("connection", (ws) => {
    console.log("🔵 New WebSocket Connection Established");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`📩 Received message:`, data);

            if (data.type === "connect") {
                connectedUsers[ws] = {
                    username: data.username,
                    status: "connected",
                    bgm: null,
                    startUtcTime: null
                };

                ws.send(JSON.stringify({ type: "connectSuccess", username: data.username }));
            }

            if (data.type === "statusUpdate") {
                if (data.status === "ingame") {
                    connectedUsers[ws] = {
                        ...connectedUsers[ws],
                        status: "ingame",
                        bgm: data.bgm,
                        startUtcTime: Date.now() / 1000 // Store timestamp
                    };
                }

                if (data.status === "died") {
                    broadcast({ type: "statusUpdate", username: data.username, status: "died" });
                }

                if (data.status === "leftGame") {
                    broadcast({ type: "statusUpdate", username: data.username, status: "leftGame" });
                }
            }
        } catch (error) {
            console.error("⚠️ Error processing message:", error);
        }
    });

    ws.on("close", () => {
        console.log("🔴 User Disconnected");
        if (connectedUsers[ws]) {
            broadcast({ type: "statusUpdate", username: connectedUsers[ws].username, status: "leftGame" });
        }
        delete connectedUsers[ws];
    });
});

// Function to Broadcast Messages to All Clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// API Route to Get Active Users
app.get("/status", (req, res) => {
    res.json({ activeUsers: Object.values(connectedUsers).map(user => user.username) });
});

// Start the Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket Server Running on Port ${PORT}`);
});
