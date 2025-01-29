const socket = io("wss://fe2cmr-official-audio-player.onrender.com"); // Update with your backend URL

// Select elements
const usernameInput = document.getElementById("usernameInput");
const connectBtn = document.getElementById("connectBTN");
const reconnectBtn = document.getElementById("reconnectBTN");
const statusText = document.getElementById("status");
const bgmStatusText = document.getElementById("bgmInfo");
const volumeSlider = document.getElementById("volumeRange");
const loopCheckbox = document.getElementById("loopBGMCheckbox");

let isConnected = false;
let audioTrack = new Audio();
let volumeMultiplier = 1;
let audioStartTimestamp;

// Toggle UI visibility
function toggleConnectionGroupVisibility(visible) {
    document.getElementById("usernameContainer").hidden = visible;
    document.getElementById("connectInfo").hidden = !visible;
}

// Connect to WebSocket server
function connectToServer() {
    if (isConnected) return;

    toggleConnectionGroupVisibility(true);
    reconnectBtn.hidden = true;
    statusText.innerHTML = `Connecting as ${usernameInput.value}...`;
    bgmStatusText.innerHTML = "Waiting for BGM...";

    socket.emit("statusUpdate", { type: "connect", username: usernameInput.value });
}

// Handle messages from server
socket.on("connectSuccess", (data) => {
    isConnected = true;
    statusText.innerHTML = `Connected as ${usernameInput.value}; Listening...`;
});

socket.on("statusUpdate", (data) => {
    if (data.username !== usernameInput.value) return;

    if (data.info === "ingame") {
        playAudio(data.bgm, data.startUtcTime);
    } else if (data.info === "died") {
        stopAudio("Died");
    } else if (data.info === "leftGame") {
        stopAudio("Left Game");
    }
});

// Play background music
function playAudio(source, startTime) {
    fadeVolume(0, 1);
    audioStartTimestamp = startTime;
    audioTrack.src = source;
    audioTrack.loop = loopCheckbox.checked;
    audioTrack.play()
        .then(() => bgmStatusText.innerHTML = "Playing BGM")
        .catch(() => bgmStatusText.innerHTML = "Couldn't get IO source.");
}

// Stop background music
function stopAudio(reason) {
    audioTrack.pause();
    bgmStatusText.innerHTML = `Stopped BGM; ${reason}`;
}

// Adjust volume
volumeSlider.addEventListener("input", () => {
    audioTrack.volume = volumeSlider.value / 100 * volumeMultiplier;
    document.getElementById("volumeInfo").innerHTML = `Volume: ${volumeSlider.value}%`;
});

// Event listeners
connectBtn.addEventListener("click", connectToServer);
reconnectBtn.addEventListener("click", connectToServer);
loopCheckbox.addEventListener("change", () => {
    audioTrack.loop = loopCheckbox.checked;
});

// WebSocket disconnect handling
socket.on("disconnect", () => {
    isConnected = false;
    stopAudio();
    statusText.innerHTML = "Disconnected";
    reconnectBtn.hidden = false;
});
