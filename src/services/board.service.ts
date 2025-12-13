import { prisma } from "src/config/db";
import redis from "src/config/redis";


interface CreateBoardInput {
    userId: string,
    title: string,
    description?: string,
}


// Create new Board
export const createBoard = async (data: CreateBoardInput) => {
    

  const board = await prisma.board.create({
    data: {
      title: data.title,
      description: data.description,
      ownerId: data.userId,
    },
  });

  // Cache Invalidation
  await redis.del(`user:${data.userId}:boards`);

  return board;
}

// Get all Boards
export const getUserBoards = async (userId: string) => {
    const cacheKey = `user:${userId}:boards`;

  // 1. Try Cache
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Fetch from DB
  const boards = await prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { columns: true } },
    },
  });

  // 3. Save to Cache (60 seconds)
  await redis.setex(cacheKey, 60, JSON.stringify(boards));

  return boards;
}

// Get board by Id
export const getBoardDetails = async (boardId: string, userId: string) => {
    const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId: userId, // Security check
    },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!board) {
    throw new Error('Board not found');
  }

  return board;
}

// Delete Board
export const deleteBoard = async (boardId: string, userId: string) => {
  const result = await prisma.board.deleteMany({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  if (result.count === 0) {
    throw new Error('Board not found or access denied');
  }

  // Cache Invalidation
  await redis.del(`user:${userId}:boards`);

  return true;
};