import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "example_secret_key";

// Hash a password
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

// Check if password is correct
export const comparePasswords = async (inputPassword: string, storedHash: string) => {
    return await bcrypt.compare(inputPassword, storedHash);
}

// Generate a Token
export const generateToken = (userId: string) => {
    return jwt.sign({userId}, JWT_SECRET, {expiresIn: '7d'})
}