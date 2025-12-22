import { getIO } from "src/utils/socket";
import { prisma } from "../config/db";
import redis from "../config/redis";


interface CreateBoardInput {
  userId: string,
  title: string,
  description?: string,
}

interface inviteMemberInput {
  requesterId: string,
  boardId: string,
  email: string,
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
    where: {
      OR: [
        { ownerId: userId },                    // Boards I own
        { members: { some: { userId: userId } } } // Boards where I am a member
      ]
    },
    include: {
      owner: { select: { name: true, email: true } }, // Useful to show who owns it
      members: { include: { user: { select: { name: true, email: true } } } } // See other members
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Save to Cache (60 seconds)
  await redis.setex(cacheKey, 60, JSON.stringify(boards));

  return boards;
}

// Get board by Id
export const getBoardDetails = async (boardId: string, userId: string) => {

  const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          include: {
            tasks: { orderBy: { order: 'asc' } } // Load tasks inside columns
          },
          orderBy: { order: 'asc' }
        },
        members: { include: { user: { select: { id: true, name: true } } } }
      }
    });

  if (!board) {
    throw new Error('Board not found');
  }

  // SECURITY CHECK: Am I the Owner OR a Member?
    const isOwner = board.ownerId === userId;
    const isMember = board.members.some(m => m.user.id === userId);

    if (!isOwner && !isMember) {
      throw new Error('Access denied');
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

  getIO().to(boardId).emit('board-updated');

  return true;
};

// Invite Member
export const inviteMember = async (data: inviteMemberInput) => {

  const board = await prisma.board.findUnique({
    where: {id: data.boardId}
  })

  if(!board) {
    throw new Error('Board not found');
  }

  if(board.ownerId !== data.requesterId){
    throw new Error('Only the board owner can invite members');
  }

  const userToInvite = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if(!userToInvite){
    throw new Error('User not found');
  };

  if (userToInvite.id === data.requesterId) {
      throw new Error('You are already the owner.');
    }
  
  const existingMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: data.boardId,
        userId: userToInvite.id,
      }
    }
  });

  if(existingMember){
    throw new Error('User is already a member of this board');
  }

  await prisma.boardMember.create({
    data: {
      boardId: data.boardId,
      userId: userToInvite.id,
    }
  });

  return `Successfully added ${userToInvite.name} to the board`;
};