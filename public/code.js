(function() {
    const app = document.querySelector(".app");
    const socket = io();

    let uname;
    const key = "somekey";  // Key for the Feistel cipher

    app.querySelector(".join-screen #join-user").addEventListener("click", function() {
        let username = app.querySelector(".join-screen #username").value;
        if (username.length === 0) return;
        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");  
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function() {
        let message = app.querySelector(".chat-screen #message-input").value;
        if (message.length === 0) return;

        const paddedMessage = message.length % 2 === 0 ? message : message + " ";
        const encryptedMessage = feistelEncrypt(paddedMessage, 16, key);
        const encodedMessage = btoa(encryptedMessage); // Base64 encoding for transmission

        // Display the encrypted message in the sender's chat window
        renderMessage("my", { username: uname, text: encryptedMessage });

        // Send the encoded message to the server
        socket.emit("chat", { username: uname, text: encodedMessage });

        app.querySelector(".chat-screen #message-input").value = "";
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function() {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

    socket.on("update", function(update) {
        renderMessage("update", update);
    });

    socket.on("chat", function(message) {
        // Display the decrypted message in the receiver's chat window
        renderMessage("other", { username: message.username, text: message.text });
    });

    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        let el = document.createElement("div");

        if (type === "my") {
            el.classList.add("message", "my-message");
            el.innerHTML = `<div><div class="name">You</div><div class="text">${message.text}</div></div>`;
        } else if (type === "other") {
            el.classList.add("message", "other-message");
            el.innerHTML = `<div><div class="name">${message.username}</div><div class="text">${message.text}</div></div>`;
        } else if (type === "update") {
            el.classList.add("update");
            el.innerText = message;
        }

        messageContainer.appendChild(el);
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

    // Feistel cipher encryption function
    function feistelEncrypt(message, rounds, key) {
        let left = message.slice(0, message.length / 2);
        let right = message.slice(message.length / 2); // Corrected typo here
        for (let i = 0; i < rounds; i++) {
            let newLeft = right;
            right = xor(left, fFunction(right, key, i));
            left = newLeft;
        }
        return left + right;
    }

    function fFunction(part, key, round) {
        return part.split('').map((char, index) => 
            String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length) ^ round)
        ).join('');
    }

    function xor(a, b) {
        return a.split('').map((char, index) => 
            String.fromCharCode(char.charCodeAt(0) ^ b[index].charCodeAt(0))
        ).join('');
    }
})();
