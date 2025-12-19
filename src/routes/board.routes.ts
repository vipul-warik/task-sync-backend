import { Router } from "express";
import {authenticate} from "../middlewares/auth.middleware"
import { createBoard, deleteBoard, getBoardById, getBoards, inviteMember } from "../controllers/board.controller";

const router = Router();

// Middleware
router.use(authenticate);

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.delete('/:id', deleteBoard);
router.post('/:id/invite', inviteMember);

export default router;