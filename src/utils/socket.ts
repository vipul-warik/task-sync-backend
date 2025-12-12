import {Server as HttpServer} from 'http';
import {Server, Socket} from 'socket.io';

let io: Server;

// Initiate IO instance
export const initSocket = (httpServer: HttpServer) => {
    
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "DELETE"],
        }
    });

    io.on('connection', (socket: Socket) => {{
        console.log('User connected: ', socket.id);

        // Event - user joins a particular board Room
        // Frontend sends: socket.emit('joinBoard', 'board_1234')

        socket.on('joinBoard', (boardId: string) => {
            socket.join(boardId);
            console.log(`User ${socket.id} joined board: ${boardId}`);
        });

        // Event: User leaves a board
        socket.on('leaveBoard', (boardId: string) => {
            socket.leave(boardId);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
        });

    }});

    return io;

};


// Helper function to get the IO instance anywhere in our app
export const getIO = () => {
    if(!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

