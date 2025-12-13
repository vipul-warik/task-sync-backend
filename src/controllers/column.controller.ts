import { Response } from "express";
import { AuthRequest } from "src/middlewares/auth.middleware";
import z from "zod";
import * as columnService from "../services/column.service";

const createColumnSchema = z.object({
    title: z.string().min(1),
    boardId: z.uuid(),
});

export const createColumn = async (req: AuthRequest, res: Response) => {
    try {
        const {title, boardId} = createColumnSchema.parse(req.body);
        const userId = req.userId;

        const column = await columnService.createColumn({title, boardId, userId});

        res.status(201).json(column);

    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create column' });
    }
}

export const deleteColumn = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId;

        await columnService.deleteColumn(id, userId);

        res.json({message: "Column deleted"});

    } catch (error) {
        res.status(400).json({ error: error.message || 'Failed to delete column' });
    }
}