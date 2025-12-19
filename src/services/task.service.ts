import { prisma } from "../config/db";
import { getIO } from '../utils/socket';


interface createTaskInput {
    title: string;
    columnId: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    userId: string;
}

interface UpdateTaskInput {
    userId: string;
    taskId: string;
    title?: string;
    content?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    columnId?: string;
    order?: number;
}

export const createTask = async (data: createTaskInput) => {
    // Check Ownership
    const column = await prisma.column.findUnique({
        where: { id: data.columnId },
        include: { board: { include: { members: true } } },
    });

    if (!column) {
        throw new Error('Column not found');
    }

    // 2. SECURITY CHECK: Is user Owner OR Member?
    const isOwner = column.board.ownerId === data.userId;
    const isMember = column.board.members.some(m => m.userId === data.userId);

    if (!isOwner && !isMember) {
        throw new Error('Only board members can create tasks');
    }

    // Order Calculation
    const lastTask = await prisma.task.findFirst({
        where: { columnId: data.columnId },
        orderBy: { order: 'desc' },
    });

    const newOrder = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
        data: {
            title: data.title,
            columnId: data.columnId,
            priority: data.priority || 'LOW',
            order: newOrder,
        }
    });

    // Real time notification - Task Created
    const boardId = column.boardId;

    getIO().to(boardId).emit('task:created', task);

    return task;
}

export const updateTask = async (data: UpdateTaskInput) => {
    // Check Ownership
    const existingTask = await prisma.task.findUnique({
        where: { id: data.taskId },
        include: {
            column: {
                include: {
                    board: {
                        include: {
                            members: true // We need members to check permissions
                        }
                    }
                },
            }
        }
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    const board = existingTask.column.board;

    // 2. SECURITY CHECK: Is user the Owner OR a Member?
    const isOwner = board.ownerId === data.userId;
    const isMember = board.members.some((m) => m.userId === data.userId);

    if (!isOwner && !isMember) {
      throw new Error('Access denied. You must be a member of the board to update tasks');
    }

    // Update
    const task = await prisma.task.update({
        where: { id: data.taskId },
        data: {
            title: data.title,
            content: data.content,
            priority: data.priority,
            columnId: data.columnId,
            order: data.order,
            updatedAt: new Date()
        }
    });

    // Real time Notification - Task updated
    getIO().to(board.id).emit('task:updated', task);

    return task;
}

export const deleteTask = async (taskId: string, userId: string) => {
    // Check Ownership
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            column: {
                include: { board: true }
            }
        }
    });

    if (!task || task.column.board.ownerId !== userId) {
        throw new Error("Task not found or access denied");
    }

    await prisma.task.delete({ where: { id: taskId } });

    const boardId = task.column.boardId;
    getIO().to(boardId).emit('task:deleted', { id: taskId });

    return true;
}