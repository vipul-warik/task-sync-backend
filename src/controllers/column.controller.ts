import { Response } from "express";
import { prisma } from "src/config/db";
import { AuthRequest } from "src/middlewares/auth.middleware";
import z from "zod";

const createColumnSchema = z.object({
    title: z.string().min(1),
    boardId: z.uuid(),
});

export const createColumn = async (req: AuthRequest, res: Response) => {
    try {
        const {title, boardId} = createColumnSchema.parse(req.body);
        const userId = req.userId;

        // Check if user owns the board
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                ownerId: userId,
            }
        });

        if(!board){
            return res.status(404).json({ error: 'Board not found' });
        }

        // Find current higest order to append to the end
        const lastColumn = await prisma.column.findFirst({
            where: {boardId: boardId},
            orderBy: {order: 'desc'}
        });

        const newOrder = lastColumn ? lastColumn.order + 1 : 0;

        const column = await prisma.column.create({
            data: {
                title,
                boardId,
                order: newOrder
            }
        });

        res.status(201).json(column);

    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create column' });
    }
}

export const deleteColumn = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId;

        const column = await prisma.column.findUnique({
            where: {id},
            include: {board: true},
        });

        if(!column || column.board.ownerId !== userId){
            return res.status(404).json({ error: 'Column not found or access denied' });
        }

        await prisma.column.delete({
            where: {id},
        });

        res.json({message: "Column deleted"});

    } catch (error) {
        res.status(400).json({ error: error.message || 'Failed to delete column' });
    }
}