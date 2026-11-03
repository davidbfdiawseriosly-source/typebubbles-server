const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Ground state database schema configuration mapping
let databaseState = {
  "lobby": {
    "rooms": {}
  }
};

// Traverses a structural pathway tree reference pattern to return target mutations
function getNestedTarget(obj, pathStr) {
  if (!pathStr || pathStr.trim() === '') return obj;
  const parts = pathStr.split('/');
  let current = obj;
  for (let part of parts) {
    if (current[part] === undefined) {
      current[part] = {}; 
    }
    current = current[part];
  }
  return current;
}

io.on('connection', (socket) => {
  socket.emit('list_state', databaseState);

  // 1. Instantiates a child leaf array at path locations
  socket.on('create_nested_list', (payload) => {
    const { path, newListName } = payload;
    const target = getNestedTarget(databaseState, path);
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      if (!target[newListName]) {
        target[newListName] = []; // Creates a clean nested list container block
        io.emit('list_update', databaseState);
      }
    }
  });

  // 2. appends value structures into child leaf arrays
  socket.on('add_to_path', (payload) => {
    const { path, value } = payload;
    const target = getNestedTarget(databaseState, path);
    if (Array.isArray(target)) {
      target.push(value);
      io.emit('list_update', databaseState);
    }
  });

  // 3. removes child structural data indices from branch tracks
  socket.on('delete_from_path', (payload) => {
    const { path, index } = payload;
    const target = getNestedTarget(databaseState, path);
    if (Array.isArray(target) && index >= 0 && index < target.length) {
      target.splice(index, 1);
      io.emit('list_update', databaseState);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Infinite-Nest Network Engine running on port ${PORT}`));
