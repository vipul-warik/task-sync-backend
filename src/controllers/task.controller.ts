import { Response } from "express";
import { prisma } from "src/config/db";
import { AuthRequest } from "src/middlewares/auth.middleware";
import z from "zod";
import { getIO } from '../utils/socket';


// Schema for Creating
const createTaskSchema = z.object({
    title: z.string().min(1),
    columnId: z.uuid(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

// Schema for Updating (Moving the card)
const updateTaskSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    columnId: z.uuid().optional(), // For moving to new column
    order: z.number().optional(),  // For reordering 
});


// Create new Task
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const {title, columnId, priority} = createTaskSchema.parse(req.body);
        const userId = req.userId;

        // Check Ownership
        const column = await prisma.column.findUnique({
            where: {id: columnId},
            include: {board: true},
        });

        if(!column || column.board.ownerId !== userId){
            return res.status(404).json({ error: 'Column not found' });
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

        res.status(201).json(task);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// Update Task
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const data = updateTaskSchema.parse(req.body);
        const userId = req.userId;

        // Check Ownership
        const existingTask = await prisma.task.findUnique({
            where: {id},
            include: {column: {
                include: {board: true},
            }}
        });

        if(!existingTask || existingTask.column.board.ownerId !== userId){
            return res.status(404).json({ error: "Task not found" });
        }

        // Update
        const task = await prisma.task.update({
            where: {id},
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        // Real time Notification - Task updated
        const boardId = existingTask.column.boardId;

        getIO().to(boardId).emit('task:updated', task);

        res.json(task);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId;

        // Check Ownership
        const task = await prisma.task.findUnique({
            where: {id},
            include: {
                column: {
                 include: {board: true}
            }}
        });

        if(!task || task.column.board.ownerId !== userId){
            return res.status(404).json({ error: "Task not found" });
        }

        await prisma.task.delete({ where: { id } });
        res.json({ message: "Task deleted" });

    } catch (error) {
        res.status(500).json({ error: "Failed to delete task" });
    }
}