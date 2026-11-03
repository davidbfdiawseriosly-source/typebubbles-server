const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows your CodeTorch app domain to connect
    methods: ["GET", "POST"]
  }
});

let liveList = ["Task 1 from Render", "Task 2 from Render"];

io.on('connection', (socket) => {
  // Immediately send the list to CodeTorch when the component loads
  socket.emit('list_update', liveList);

  // Listen for items added from CodeTorch
  socket.on('add_item', (item) => {
    liveList.push(item);
    io.emit('list_update', liveList); // Broadcast back to all open CodeTorch screens
  });

  // Listen for deletions from CodeTorch
  socket.on('delete_item', (index) => {
    liveList.splice(index, 1);
    io.emit('list_update', liveList);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`WebSocket server running on port ${PORT}`));
