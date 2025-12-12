import { Request, Response } from "express";
import { z } from "zod";
import * as authService from '../services/auth.service';

// Validation Schemas
const registerSchema = z.object({
    email: z.email(),
    name: z.string().min(2),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string()
});

// Signup
export const register = async (req: Request, res: Response) => {
    try {
        // Validate Input (HTTP layer responsiblity)
        const data = registerSchema.parse(req.body);

        // Call Service (Business Layer responsibility)
        const result = await authService.registerUser(data);

        // Response
        res.status(201).json(result);
        
        
    } catch (error: any) {
        const status = error.message === 'User already exists' ? 409 : 400;
        res.status(status).json({ error: error.message });
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        const result = await authService.loginUser(data);

        res.json(result);

    } catch (error) {
        res.status(401).json({ error: error.message || 'Login failed' });
    }
}