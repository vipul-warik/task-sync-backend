import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi is hoisted hence Mock DB module should be imported before the service
vi.mock('../config/db', () => ({
  __esModule: true,
  prisma: { // prisma is exported as {prisma} in config/db (for direct export we use default)
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { registerUser } from '../services/auth.service';
import { prisma } from '../config/db';

vi.mock('../utils/auth', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed_password_mock'),
    comparePasswords: vi.fn(),
    generateToken: vi.fn().mockReturnValue('fake_jwt_token'),
}));

describe('Auth Service - registerUser', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should register a new user and return token', async () => {

        // ARRANGE
        const input = {
            email: 'service@test.com',
            name: 'Service User',
            password: 'password@123'
        };

        // Mock: No existing user
        (prisma.user.findUnique as any).mockResolvedValue(null);

        // Mock: Create user success
        (prisma.user.create as any).mockResolvedValue({
            id: 'user-id-1',
            email: input.email,
            name: input.name,
            password: 'hashed_password_mock',
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        // ACT
        const result = await registerUser(input);

        // ASSERT
        expect(result).toHaveProperty('token', 'fake_jwt_token');
        expect(result.user.email).toBe(input.email);

        // Verify is Prisma was called correctly
        expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw an error if user already exists', async () => {

        // ARRANGE
        const input = {
            email: 'exists@test.com',
            name: 'Existing',
            password: '123'
        };

        // Mock: User found
        (prisma.user.findUnique as any).mockResolvedValue({id: 'existing-id'} as any);

        // ACT & ASSERT
        // service should throw error, we expect the promise to reject
        await expect(registerUser(input)).rejects.toThrow('User already exists');
    });
});