import {z} from 'zod';

export const createBoardSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
});

export const createColumnSchema = z.object({
  title: z.string().min(1, "Title is required"),
  boardId: z.uuid(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  columnId: z.uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});