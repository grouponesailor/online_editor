const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { networkInterfaces } = require('os');

// Get local IP address
function getLocalIP() {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Return the first available IP
  const networkNames = Object.keys(results);
  if (networkNames.length > 0) {
    return results[networkNames[0]][0];
  }
  return 'localhost';
}

const PORT = process.env.PORT || 1234;
const HOST = getLocalIP();

// Create Express app for REST API
const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (would use a database in production)
const documents = new Map();
const documentNames = new Map();
const shareSettings = new Map();
const sharedUsers = new Map();

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);

// Load persisted data
async function loadPersistedData() {
  try {
    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        const parsed = JSON.parse(data);
        const docId = file.replace('.json', '');
        
        if (parsed.name) documentNames.set(docId, parsed.name);
        if (parsed.content) documents.set(docId, parsed.content);
        if (parsed.settings) shareSettings.set(docId, parsed.settings);
        if (parsed.users) sharedUsers.set(docId, parsed.users);
      }
    }
    console.log(`Loaded ${files.length} persisted documents`);
  } catch (error) {
    console.log('No persisted data found, starting fresh');
  }
}

// Save document data
async function saveDocumentData(docId, data) {
  try {
    const filePath = path.join(DATA_DIR, `${docId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save document data:', error);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    host: HOST,
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Document management
app.get('/api/documents', (req, res) => {
  const docs = Array.from(documentNames.entries()).map(([id, name]) => ({
    id,
    name,
    lastModified: documents.has(id) ? new Date().toISOString() : null
  }));
  res.json(docs);
});

app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const name = documentNames.get(id) || 'Untitled Document';
  const content = documents.get(id) || '';
  res.json({ id, name, content });
});

app.post('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;
  
  if (name) {
    documentNames.set(id, name);
  }
  if (content) {
    documents.set(id, content);
  }
  
  // Save to disk
  const data = {
    name: documentNames.get(id),
    content: documents.get(id),
    settings: shareSettings.get(id),
    users: sharedUsers.get(id)
  };
  saveDocumentData(id, data);
  
  res.json({ success: true, id, name: documentNames.get(id) });
});

// Share management
app.get('/api/share/:id/settings', (req, res) => {
  const { id } = req.params;
  const settings = shareSettings.get(id) || {
    access: 'private',
    allowEdit: false,
    allowComment: true,
    allowShare: false
  };
  res.json(settings);
});

app.post('/api/share/:id/settings', (req, res) => {
  const { id } = req.params;
  const settings = req.body;
  shareSettings.set(id, settings);
  
  // Save to disk
  const data = {
    name: documentNames.get(id),
    content: documents.get(id),
    settings: settings,
    users: sharedUsers.get(id)
  };
  saveDocumentData(id, data);
  
  res.json(settings);
});

app.get('/api/share/:id/users', (req, res) => {
  const { id } = req.params;
  const users = sharedUsers.get(id) || [];
  res.json(users);
});

app.post('/api/share/:id/users', (req, res) => {
  const { id } = req.params;
  const { email, access, name } = req.body;
  
  let users = sharedUsers.get(id) || [];
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    existingUser.access = access;
    existingUser.name = name || existingUser.name;
  } else {
    users.push({
      id: Date.now().toString(),
      email,
      name: name || email.split('@')[0],
      access,
      addedAt: new Date().toISOString()
    });
  }
  
  sharedUsers.set(id, users);
  
  // Save to disk
  const data = {
    name: documentNames.get(id),
    content: documents.get(id),
    settings: shareSettings.get(id),
    users: users
  };
  saveDocumentData(id, data);
  
  res.json(users);
});

app.delete('/api/share/:id/users/:userId', (req, res) => {
  const { id, userId } = req.params;
  let users = sharedUsers.get(id) || [];
  users = users.filter(u => u.id !== userId);
  sharedUsers.set(id, users);
  
  // Save to disk
  const data = {
    name: documentNames.get(id),
    content: documents.get(id),
    settings: shareSettings.get(id),
    users: users
  };
  saveDocumentData(id, data);
  
  res.json(users);
});

app.post('/api/share/:id/link', (req, res) => {
  const { id } = req.params;
  const protocol = req.secure ? 'https' : 'http';
  const link = `${protocol}://${HOST}:4200/documents/${id}`;
  res.json({ link });
});

// WebSocket server for real-time collaboration
const wss = new WebSocket.Server({ port: PORT });
const rooms = new Map(); // documentId -> Set of WebSocket connections

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  let documentId = null;
  let userId = null;

  ws.on('message', (message) => {
    try {
      let data;
      
      // Handle both string and binary messages
      if (message instanceof Buffer) {
        // This is likely a Yjs update
        if (!documentId) {
          console.log('Received binary message without document ID');
          return;
        }
        
        // Broadcast to all clients in the same room
        const room = rooms.get(documentId);
        if (room) {
          room.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
        return;
      }
      
      // Handle string messages (JSON)
      data = JSON.parse(message.toString());
      
      if (data.type === 'join') {
        documentId = data.documentId;
        userId = data.userId || `user-${Date.now()}`;
        
        console.log(`User ${userId} joined document ${documentId}`);
        
        // Add to room
        if (!rooms.has(documentId)) {
          rooms.set(documentId, new Set());
        }
        rooms.get(documentId).add(ws);
        
        // Send existing document content if available
        const content = documents.get(documentId);
        if (content) {
          ws.send(JSON.stringify({
            type: 'document-content',
            content: content
          }));
        }
        
        // Notify other clients about new user
        const room = rooms.get(documentId);
        room.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user-joined',
              userId: userId,
              documentId: documentId
            }));
          }
        });
        
      } else if (data.type === 'leave') {
        if (documentId && rooms.has(documentId)) {
          rooms.get(documentId).delete(ws);
          if (rooms.get(documentId).size === 0) {
            rooms.delete(documentId);
          }
        }
        
      } else if (data.type === 'document-update') {
        // Save document content
        if (documentId && data.content) {
          documents.set(documentId, data.content);
          
          // Save to disk
          const docData = {
            name: documentNames.get(documentId),
            content: data.content,
            settings: shareSettings.get(documentId),
            users: sharedUsers.get(documentId)
          };
          saveDocumentData(documentId, docData);
        }
        
        // Broadcast to other clients
        if (documentId && rooms.has(documentId)) {
          const room = rooms.get(documentId);
          room.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    
    // Remove from room
    if (documentId && rooms.has(documentId)) {
      rooms.get(documentId).delete(ws);
      if (rooms.get(documentId).size === 0) {
        rooms.delete(documentId);
      }
      
      // Notify other clients
      const room = rooms.get(documentId);
      if (room) {
        room.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user-left',
              userId: userId,
              documentId: documentId
            }));
          }
        });
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  await loadPersistedData();
  console.log(`🚀 Collaborative Document Server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${HOST}:${PORT}`);
  console.log(`   WebSocket: ws://${HOST}:${PORT}`);
  console.log('');
  console.log('📝 Available endpoints:');
  console.log(`   Health:     GET  /api/health`);
  console.log(`   Documents:  GET  /api/documents`);
  console.log(`   Share:      POST /api/share/:id/settings`);
  console.log('');
  console.log('🔗 Share documents by visiting:');
  console.log(`   http://${HOST}:4200/documents/{document-id}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    wss.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    wss.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
  });
});

// Export for testing
module.exports = { app, server, wss }; 