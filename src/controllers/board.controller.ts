import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createBoardSchema, inviteMemberSchema } from "../utils/validation";
import * as boardService from '../services/board.service';


// Create a Board
export const createBoard = async (req: AuthRequest, res: Response) => {
    try {
        const data = createBoardSchema.parse(req.body);
        const userId = req.userId;

        const board = await boardService.createBoard({
            userId,
            title: data.title,
            description: data.description,
        });

        res.status(201).json(board);

    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create board' });
    }
}

// Get all Boards (for user)
export const getBoards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;

        const boards = await boardService.getUserBoards(userId);

        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
}

// Get single board (with Columns and Tasks)
export const getBoardById = async (req: AuthRequest, res: Response) => {
    try {
        const { id: boardId } = req.params;
        const userId = req.userId;

        const board = await boardService.getBoardDetails(boardId, userId);

        res.json(board);

    } catch (error: any) {
        if (error.message === 'Board not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to fetch board' });
    }
}

// Delete Board
export const deleteBoard = async (req: AuthRequest, res: Response) => {
    try {
        const { id: boardId } = req.params;
        const userId = req.userId;

        await boardService.deleteBoard(boardId, userId);

        res.json({ message: "Board deleted successfully" });

    } catch (error: any) {
        if (error.message === 'Board not found or access denied') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete board' });
    }
}

// Invite to Board
export const inviteMember = async (req: AuthRequest, res: Response) => {
    try {

        const { id: boardId } = req.params;
        const requesterId = req.userId;
    
        const { email } = inviteMemberSchema.parse(req.body);

        const message = await boardService.inviteMember({boardId, email, requesterId});

        res.status(201).json({message});
        
    } catch (error) {
        res.status(400).json({ error: error.message || 'Failed to invite member' });
    }
    
    
}
