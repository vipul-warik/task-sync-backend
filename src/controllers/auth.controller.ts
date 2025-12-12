import { Request, Response } from "express";
import {email, z} from "zod";
import {prisma} from "../config/db"
import { hashPassword, comparePasswords, generateToken } from "src/utils/auth";

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
        // Validate Input
        const data = registerSchema.parse(req.body);

        // Check if the user exists
        const existingUser = await prisma.user.findUnique({where: {email: data.email}});

        if(existingUser){
            return res.status(400).json({error: "User already exist"});
        }

        // Hash Password & Create User
        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
            }
        });

        // Return Token
        const token = generateToken(user.id);
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        res.status(400).json({error: error.message || "Registration failed"});
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 2. Check Password
    const isValid = await comparePasswords(data.password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    // 3. Return Token
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });

    } catch (error) {
        res.status(400).json({ error: error.message || 'Login failed' });
    }
}