const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`server on port ${PORT}`));

const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

let socketsConnected = new Set();
let messageHistory = []; 

io.on('connection', (socket) => {
    onConnected(socket);
});

function onConnected(socket) {
    console.log(socket.id);
    socketsConnected.add(socket.id);

    io.emit('clients-total', socketsConnected.size);

    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size);
    });

    socket.on('message', (data) => {
        messageHistory.push(data);
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('load-old-messages', (callback) => {
        // Simulate loading old messages, in a real app you would fetch this from a database
        const oldMessages = messageHistory.slice(0, 10); // Load first 10 messages
        callback(oldMessages);
    });

    socket.on('feedback', (data)=>{
        socket.broadcast.emit('feedback', data)
    })
}
