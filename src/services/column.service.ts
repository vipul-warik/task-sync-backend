import { prisma } from "../config/db";


interface CreateColumnInput {
    title: string,
    boardId: string,
    userId: string,
}

export const createColumn = async ({title, boardId, userId} : CreateColumnInput) => {

    // Check if user owns the board
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                ownerId: userId,
            }
        });

        if(!board){
            throw new Error('Board not found');
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

        return column;
}

export const deleteColumn = async (id: string, userId: string) => {
    const column = await prisma.column.findUnique({
            where: {id},
            include: {board: true},
        });

        if(!column || column.board.ownerId !== userId){
            throw new Error('Column not found or access denied');
        }

        await prisma.column.delete({
            where: {id},
        });

        return true;
}