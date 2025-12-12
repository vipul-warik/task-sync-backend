import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || 'example_secret_key';

// Extend Express Request type to include userId
export interface AuthRequest extends Request {
    userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({error: "Access denied. No token provided"});
    }

    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        
        // Attach id to req object and call the next function
        const decoded = jwt.verify(token, JWT_SECRET) as {userId: string};
        req.userId = decoded.userId;
        next();

    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
}