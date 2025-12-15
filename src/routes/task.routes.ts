import { Router } from "express";
import {authenticate} from "../middlewares/auth.middleware"
import { createTask, deleteTask, updateTask } from "../controllers/task.controller";


const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;