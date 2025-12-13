import { prisma } from "src/config/db";
import { getIO } from '../utils/socket';

interface createTaskInput {
    title: string;
    columnId: string;
    priority?: 'LOW' | 'MEDIUM'| 'HIGH';
    userId: string;
}

export const createTask = async({title, columnId, priority, userId}: createTaskInput) => {
    // Check Ownership
        const column = await prisma.column.findUnique({
            where: {id: columnId},
            include: {board: true},
        });

        if(!column || column.board.ownerId !== userId){
            throw new Error('Column not found');
        };

        // Order Calculation
        const lastTask = await prisma.task.findFirst({
            where: {columnId: columnId},
            orderBy: {order: 'desc'},
        });

        const newOrder = lastTask ? lastTask.order + 1 : 0;

        const task = await prisma.task.create({
            data: {
                title,
                columnId,
                priority: priority || 'LOW',
                order: newOrder,
            }
        });

        // Real time notification - Task Created
        const boardId = column.boardId;

        getIO().to(boardId).emit('task:created', task);

        return task;
}

export const updateTask = async() => {
    
}

export const deleteTask = async() => {
    
}