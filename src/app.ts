import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './config/db';
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import columnRoutes from './routes/column.routes';
import taskRoutes from './routes/task.routes';
import { createServer } from 'http';
import { initSocket } from './utils/socket';

// Load environment variablesz
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;

// Raw http server form Node.js
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors({
  origin: "*", // Allow your Frontend URL
  credentials: true
}));         // Enable CORS
app.use(helmet());       // Security Headers

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);


// Basic Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString() 
  });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    // Start Server
  httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  });

  } catch (error) {
    console.error("Failed to connect to database", error);
    process.exit(1);
  }
};

startServer();

