import express, { Request, Response } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './src/server/api/root.js';
import getCandidateService from './src/server/services/candidateService.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.vercel.app', // Update this with your actual frontend URL
    /\.vercel\.app$/,
    /\.netlify\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// tRPC middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }: { req: Request; res: Response }) => {
      return {
        headers: req.headers,
      };
    },
  })
);

// Socket.IO setup
const io = new IOServer(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});

const candidateService = getCandidateService();

// Socket.IO event handlers
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

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🔧 tRPC API available at /api/trpc`);
}); 