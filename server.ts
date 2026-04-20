// initialize the server express app
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { handleSocketConnection } from './socketHandler';
import { registerApiRoutes } from './src/api';
import { ConsumeQueue } from './src/consume/consume-queue';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const dbUrl = process.env.DB_URL;
if (dbUrl) {
  mongoose.connect(dbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  handleSocketConnection(socket);
});

console.log('start registering API routes');
// register API routes
registerApiRoutes(app);

// Scheduler to consume SQS messages every 30 seconds
if (isProd) {
  const queueUrl = process.env.SQS_QUEUE_URL || 'your-sqs-queue-url';
  const consumeQueue = new ConsumeQueue(queueUrl);
  setInterval(() => {
    consumeQueue.consume();
  }, 30000);
} else {
  console.log('Running in development mode, SQS consumer is disabled.');
}

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server is running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://127.0.0.1:${PORT}`);
  console.log(`\n📋 API Routes available at: http://localhost:${PORT}/api`);
});