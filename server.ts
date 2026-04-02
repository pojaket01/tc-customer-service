// initialize the server express app
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
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

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  handleSocketConnection(socket);
});

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
  console.log(`Server is running on port ${PORT}`);
});