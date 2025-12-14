import { Response } from "express";
import { AuthRequest } from "src/middlewares/auth.middleware";
import z from "zod";
import * as taskService from "../services/task.service";



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
        const userId = req.userId!;

        const task = await taskService.createTask({title, columnId, priority, userId});

        res.status(201).json(task);

    } catch (error: any) {
        if (error.message === 'Column not found or access denied') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}


// Update Task
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const data = updateTaskSchema.parse(req.body);
        const userId = req.userId!;

        const task = await taskService.updateTask({
            userId,
            taskId: id,
            ...data
        });

        res.json(task);

    } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}


// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId!;

        await taskService.deleteTask(id, userId);

        res.json({ message: "Task deleted" });

    } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to delete task" });
    }
}