import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
    };
}

let io: Server;

// Initiate IO instance
export const initSocket = (httpServer: HttpServer) => {

    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "DELETE"],
            credentials: true,
        }
    });

    io.use((socket: AuthenticatedSocket, next) => {
        // Extract token from handshake
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        // Verify Token
        try {
            console.log(process.env.JWT_SECRET);
            console.log(token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {userId: string};

            console.log(decoded);
            // Attach User ID to the socket object
            // (This lets us know WHO this socket belongs to later)
            socket.user = {
                userId: decoded.userId,
            };

            next(); // Allow connection
        } catch (err) {
            console.error("message: ", err.message);
            return next(new Error("Authentication error: Invalid token"));
        }
    });


    io.on('connection', (socket: AuthenticatedSocket) => {
        {
            console.log('User connected: ', socket.user?.userId);

            // Event - user joins a particular board Room
            // Frontend sends: socket.emit('joinBoard', 'board_1234')

            socket.on('join-board', (boardId: string) => {
                socket.join(boardId);
                console.log(`User ${socket.user?.userId} joined board: ${boardId}`);
            });

            // Event: User leaves a board
            socket.on('leave-board', (boardId: string) => {
                socket.leave(boardId);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected', socket.user?.userId);
            });

        }
    });

    return io;

};


// Helper function to get the IO instance anywhere in our app
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

