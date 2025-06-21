import { Server as HTTPServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import getCandidateService from '../services/candidateService';
import type { NextApiResponseServerIO } from '../../pages/api/socket';

let io: IOServer | null = null;

// Use globalThis to persist the WebSocket server across hot reloads in development
declare global {
  var __websocketServer: IOServer | undefined;
  var __websocketInitialized: boolean | undefined;
}

export function initializeWebSocketServer(
  httpServer: HTTPServer,
  res?: NextApiResponseServerIO
): IOServer {
  console.log('🚀 [WebSocketServer] Initializing WebSocket server...');
  
  // Reuse existing server in development to prevent multiple instances
  if (globalThis.__websocketServer && !globalThis.__websocketServer.engine.clientsCount) {
    console.log('♻️ [WebSocketServer] Reusing existing WebSocket server instance');
    io = globalThis.__websocketServer;
    setupEventListeners(); // Re-setup event listeners
    return io;
  }

  // Create new server instance
  io = new IOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  globalThis.__websocketServer = io;

  if (res) {
    res.socket.server.io = io;
  }

  setupEventListeners();
  setupCandidateServiceListeners();

  console.log('✅ [WebSocketServer] WebSocket server initialized successfully');
  return io;
}

function setupEventListeners() {
  if (!io) return;

  // Clear existing listeners to prevent duplicates
  io.removeAllListeners();

  io.on('connection', (socket: Socket) => {
    console.log('📡 Client connected:', socket.id);
    console.log('👥 Total connected clients:', io?.engine.clientsCount || 0);

    const candidateService = getCandidateService();

    // Send initial data immediately upon connection
    const candidates = candidateService.getAllCandidates();
    const stats = candidateService.getStats();
    
    console.log(`📤 [WebSocketServer] Sending initial data to ${socket.id}: ${candidates.length} candidates, ${stats.length} party stats`);
    
    socket.emit('candidates:list', candidates);
    socket.emit('stats:data', stats);

    // Handle client requests
    socket.on('candidates:getAll', () => {
      const allCandidates = candidateService.getAllCandidates();
      console.log(`📤 [WebSocketServer] Client ${socket.id} requested all candidates: sending ${allCandidates.length} candidates`);
      socket.emit('candidates:list', allCandidates);
    });

    socket.on('stats:get', () => {
      const currentStats = candidateService.getStats();
      console.log(`📤 [WebSocketServer] Client ${socket.id} requested stats: sending ${currentStats.length} party stats`);
      socket.emit('stats:data', currentStats);
    });

    socket.on('candidate:get', (id: number) => {
      const candidate = candidateService.getCandidateById(id);
      console.log(`📤 [WebSocketServer] Client ${socket.id} requested candidate ${id}: ${candidate ? 'found' : 'not found'}`);
      socket.emit('candidate:data', candidate);
    });

    socket.on('candidates:search', (query: string) => {
      const results = candidateService.searchCandidates(query);
      console.log(`📤 [WebSocketServer] Client ${socket.id} searched for "${query}": ${results.length} results`);
      socket.emit('candidates:searchResults', results);
    });

    socket.on('disconnect', () => {
      console.log('📡 Client disconnected:', socket.id);
      console.log('👥 Total connected clients:', io?.engine.clientsCount || 0);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('🚫 [WebSocketServer] Socket error for client', socket.id, ':', error);
    });
  });

  console.log('🔧 [WebSocketServer] Socket event listeners configured');
}

function setupCandidateServiceListeners() {
  if (!io || globalThis.__websocketInitialized) {
    console.log('⚠️ [WebSocketServer] Skipping candidate service listeners setup - already initialized or no io server');
    return;
  }

  console.log('🔧 [WebSocketServer] Setting up candidate service event listeners...');

  const candidateService = getCandidateService();

  // Remove any existing listeners first to prevent duplicates
  candidateService.removeAllListeners('candidateCreated');
  candidateService.removeAllListeners('candidateUpdated');
  candidateService.removeAllListeners('candidateDeleted');
  candidateService.removeAllListeners('candidatesUpdated');
  candidateService.removeAllListeners('statsUpdated');

  // Set up event listeners for real-time updates
  candidateService.on('candidateCreated', (candidate) => {
    console.log(`📡 [WebSocketServer] Received candidateCreated event for: ${candidate.name} (ID: ${candidate.id})`);
    console.log(`📡 [WebSocketServer] Broadcasting to ${io?.engine.clientsCount || 0} connected clients`);
    
    if (io) {
      io.emit('candidate:created', candidate);
      
      // Also send updated lists
      const allCandidates = candidateService.getAllCandidates();
      const stats = candidateService.getStats();
      
      io.emit('candidates:updated', allCandidates);
      io.emit('stats:updated', stats);
      
      console.log(`📡 [WebSocketServer] Broadcasted candidate creation and updates for: ${candidate.name}`);
    }
  });

  candidateService.on('candidateUpdated', (candidate) => {
    console.log(`📡 [WebSocketServer] Received candidateUpdated event for: ${candidate.name} (ID: ${candidate.id})`);
    console.log(`📡 [WebSocketServer] Broadcasting to ${io?.engine.clientsCount || 0} connected clients`);
    
    if (io) {
      io.emit('candidate:updated', candidate);
      
      // Also send updated lists
      const allCandidates = candidateService.getAllCandidates();
      const stats = candidateService.getStats();
      
      io.emit('candidates:updated', allCandidates);
      io.emit('stats:updated', stats);
      
      console.log(`📡 [WebSocketServer] Broadcasted candidate update for: ${candidate.name}`);
    }
  });

  candidateService.on('candidateDeleted', (candidate) => {
    console.log(`📡 [WebSocketServer] Received candidateDeleted event for: ${candidate.name} (ID: ${candidate.id})`);
    console.log(`📡 [WebSocketServer] Broadcasting to ${io?.engine.clientsCount || 0} connected clients`);
    
    if (io) {
      io.emit('candidate:deleted', candidate);
      
      // Also send updated lists
      const allCandidates = candidateService.getAllCandidates();
      const stats = candidateService.getStats();
      
      io.emit('candidates:updated', allCandidates);
      io.emit('stats:updated', stats);
      
      console.log(`📡 [WebSocketServer] Broadcasted candidate deletion for: ${candidate.name}`);
    }
  });

  candidateService.on('candidatesUpdated', (candidates) => {
    console.log(`📡 [WebSocketServer] Received candidatesUpdated event with ${candidates.length} candidates`);
    console.log(`📡 [WebSocketServer] Broadcasting to ${io?.engine.clientsCount || 0} connected clients`);
    
    if (io) {
      io.emit('candidates:updated', candidates);
      console.log(`📡 [WebSocketServer] Broadcasted candidates list update`);
    }
  });

  candidateService.on('statsUpdated', (stats) => {
    console.log(`📡 [WebSocketServer] Received statsUpdated event with ${stats.length} party stats`);
    console.log(`📡 [WebSocketServer] Broadcasting to ${io?.engine.clientsCount || 0} connected clients`);
    
    if (io) {
      io.emit('stats:updated', stats);
      console.log(`📡 [WebSocketServer] Broadcasted stats update`);
    }
  });

  globalThis.__websocketInitialized = true;
  console.log('✅ [WebSocketServer] Candidate service event listeners configured');
  console.log('📊 [WebSocketServer] Current event listener counts:', {
    candidateCreated: candidateService.listenerCount('candidateCreated'),
    candidateUpdated: candidateService.listenerCount('candidateUpdated'),
    candidateDeleted: candidateService.listenerCount('candidateDeleted'),
    candidatesUpdated: candidateService.listenerCount('candidatesUpdated'),
    statsUpdated: candidateService.listenerCount('statsUpdated'),
  });
}

export function getWebSocketServer(): IOServer | null {
  return io;
} 