const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

const server = require('http').createServer(app);
const io = require("socket.io")(server);

// Feistel Decryption
function feistelDecrypt(ciphertext, rounds, key) {
    let left = ciphertext.slice(0, ciphertext.length / 2);
    let right = ciphertext.slice(ciphertext.length / 2);
    for (let i = rounds - 1; i >= 0; i--) {
        let newRight = left;
        left = xor(right, fFunction(left, key, i));
        right = newRight;
    }
    return left + right; // Adjusted to maintain original order
}

// Feistel f-function
function fFunction(part, key, round) {
    return part.split('').map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length) ^ round)
    ).join('');
}

// XOR function
function xor(a, b) {
    return a.split('').map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ b[index].charCodeAt(0))
    ).join('');
}

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "/public")));

io.on("connection", (socket) => {
    socket.on("newuser", (username) => {
        socket.broadcast.emit("update", `${username} joined the conversation`);
    });

    socket.on("exituser", (username) => {
        socket.broadcast.emit("update", `${username} left the conversation`);
    });

    socket.on("chat", (message) => {
        const key = "somekey"; // Symmetric key for encryption/decryption
        try {
            // Decrypting message assuming it's received as Base64 encoded ciphertext
            const encryptedMessage = Buffer.from(message.text, 'base64').toString('utf-8');
            const decryptedMessage = feistelDecrypt(encryptedMessage, 16, key);

            // Broadcasting the decrypted message to all other users
            socket.broadcast.emit("chat", {
                username: message.username,
                text: decryptedMessage
            });
        } catch (error) {
            console.error("Decryption error:", error);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
