import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import getCandidateService from '../../server/services/candidateService';

// Define the extended server type
interface ServerWithIO extends HTTPServer {
  io?: IOServer;
}

// Define the extended response type
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NextApiResponse['socket'] & {
    server: ServerWithIO;
  };
}

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  console.log('🔧 [Socket API] Socket handler called');

  if (res.socket.server.io) {
    console.log('✅ [Socket API] Socket.IO already running');
    res.end();
    return;
  }

  console.log('🚀 [Socket API] Starting Socket.IO server...');
  
  const io = new IOServer(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  });

  // Store the io instance
  res.socket.server.io = io;

  const candidateService = getCandidateService();

  // Set up Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('📡 [Socket.IO] Client connected:', socket.id);
    console.log('👥 [Socket.IO] Total clients:', io.engine.clientsCount);

    // Send initial data
    const candidates = candidateService.getAllCandidates();
    const stats = candidateService.getStats();
    
    console.log(`📤 [Socket.IO] Sending initial data to ${socket.id}: ${candidates.length} candidates, ${stats.length} stats`);
    socket.emit('candidates:list', candidates);
    socket.emit('stats:data', stats);

    // Handle client requests
    socket.on('candidates:getAll', () => {
      const allCandidates = candidateService.getAllCandidates();
      console.log(`📤 [Socket.IO] Sending ${allCandidates.length} candidates to ${socket.id}`);
      socket.emit('candidates:list', allCandidates);
    });

    socket.on('stats:get', () => {
      const currentStats = candidateService.getStats();
      console.log(`📤 [Socket.IO] Sending ${currentStats.length} stats to ${socket.id}`);
      socket.emit('stats:data', currentStats);
    });

    socket.on('candidate:get', (id: number) => {
      const candidate = candidateService.getCandidateById(id);
      socket.emit('candidate:data', candidate);
    });

    socket.on('candidates:search', (query: string) => {
      const results = candidateService.searchCandidates(query);
      socket.emit('candidates:searchResults', results);
    });

    socket.on('disconnect', () => {
      console.log('📡 [Socket.IO] Client disconnected:', socket.id);
      console.log('👥 [Socket.IO] Total clients:', io.engine.clientsCount);
    });
  });

  // Set up candidate service event listeners
  candidateService.on('candidateCreated', (candidate) => {
    console.log(`📡 [Socket.IO] Broadcasting candidate created: ${candidate.name}`);
    io.emit('candidate:created', candidate);
    io.emit('candidates:updated', candidateService.getAllCandidates());
    io.emit('stats:updated', candidateService.getStats());
  });

  candidateService.on('candidateUpdated', (candidate) => {
    console.log(`📡 [Socket.IO] Broadcasting candidate updated: ${candidate.name}`);
    io.emit('candidate:updated', candidate);
    io.emit('candidates:updated', candidateService.getAllCandidates());
    io.emit('stats:updated', candidateService.getStats());
  });

  candidateService.on('candidateDeleted', (candidate) => {
    console.log(`📡 [Socket.IO] Broadcasting candidate deleted: ${candidate.name}`);
    io.emit('candidate:deleted', candidate);
    io.emit('candidates:updated', candidateService.getAllCandidates());
    io.emit('stats:updated', candidateService.getStats());
  });

  candidateService.on('candidatesUpdated', (candidates) => {
    console.log(`📡 [Socket.IO] Broadcasting candidates updated: ${candidates.length} candidates`);
    io.emit('candidates:updated', candidates);
  });

  candidateService.on('statsUpdated', (stats) => {
    console.log(`📡 [Socket.IO] Broadcasting stats updated: ${stats.length} stats`);
    io.emit('stats:updated', stats);
  });

  console.log('✅ [Socket API] Socket.IO server initialized successfully');
  res.end();
} 