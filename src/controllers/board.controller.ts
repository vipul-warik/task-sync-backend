import { Response } from "express";
import { prisma } from "src/config/db";
import { AuthRequest } from "src/middlewares/auth.middleware";
import { createBoardSchema } from "src/utils/validation";
import redis from '../config/redis';


// Create a Board
export const createBoard = async (req: AuthRequest, res: Response) => {
    try {
        const data = createBoardSchema.parse(req.body);
        const userId = req.userId;

        const board = await prisma.board.create({
            data: {
                title: data.title,
                description: data.description,
                ownerId: userId,
            }
        });

        // Cache invalidation
        await redis.del(`user:${userId}:boards`);

        res.status(201).json(board);

    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create board' });
    }
}

// Get all Boards (for user)
export const getBoards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const cacheKey = `user:${userId}:boards`;

        // Check if data is present in Cache
        const cachedData = await redis.get(cacheKey);

        if(cachedData){
            return res.json(JSON.parse(cachedData));
        }

        const boards = await prisma.board.findMany({
            where: {ownerId: userId},
            orderBy: {updatedAt: 'desc'},
            include: {
                _count: {select: { columns: true } }
            }
        });

        // Save to Cache
        // Data stored: array as a JSON string
        await redis.setex(cacheKey, 60, JSON.stringify(boards));

        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
}

// Get single board (with Columns and Tasks)
export const getBoardById = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId;

        const board = await prisma.board.findFirst({
            where: {
                id,
                ownerId: userId // Ensure they own it
            },
            include: {
                columns: {
                    orderBy: {order: 'asc'},
                    include: {
                        tasks: {
                            orderBy: {order: 'asc'}
                        }
                    }
                }
            }
        });

        if(!board) {
            return res.status(404).json({error: 'Board not found'});
        }

        res.json(board);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch board' });
    }
}

// Delete Board
export const deleteBoard = async (req: AuthRequest, res: Response) => {
    try {
        const {id} = req.params;
        const userId = req.userId;

        const result = await prisma.board.deleteMany({
            where: {
                id,
                ownerId: userId
            }
        });

        if(result.count === 0) {
            return res.status(404).json({error: "Board not found or access denied"});
        };

        // Cache invalidation
        await redis.del(`user:${userId}:boards`);

        res.json({message: "Board deleted successfully"});

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete board' });
    }
}
