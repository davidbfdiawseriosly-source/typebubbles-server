const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// The master database structure holding all your sub-lists
let databaseState = {
  "lobby": ["Welcome to the server engine!"] // Default starting sub-list
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Instantly send the whole database state to anyone who connects
  socket.emit('list_state', databaseState);

  // 1. Create a brand-new sub-list (like a new room or lobby)
  socket.on('create_sub_list', (listName) => {
    if (listName && !databaseState[listName]) {
      databaseState[listName] = [];
      io.emit('list_update', databaseState); // Broadcast updated structural layout to everyone
      console.log(`Sub-list created: ${listName}`);
    }
  });

  // 2. Add an item to a specific sub-list
  socket.on('add_to_sub_list', (data) => {
    const { listName, value } = data;
    if (listName && value) {
      // If the sub-list doesn't exist yet, automatically initialize it
      if (!databaseState[listName]) {
        databaseState[listName] = [];
      }
      databaseState[listName].push(value);
      io.emit('list_update', databaseState); // Broadcast update
      console.log(`Added "${value}" to sub-list "${listName}"`);
    }
  });

  // 3. Delete an item from a specific sub-list by its index number
  socket.on('delete_from_sub_list', (data) => {
    const { listName, index } = data;
    if (listName && databaseState[listName] && Array.isArray(databaseState[listName])) {
      if (index >= 0 && index < databaseState[listName].length) {
        databaseState[listName].splice(index, 1);
        io.emit('list_update', databaseState); // Broadcast update
        console.log(`Deleted item at index ${index} from sub-list "${listName}"`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Multi-List Server running on port ${PORT}`));
