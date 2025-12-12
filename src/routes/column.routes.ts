import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createColumn, deleteColumn } from '../controllers/column.controller';

const router = Router();
router.use(authenticate);

router.post('/', createColumn);
router.delete('/:id', deleteColumn);

export default router;