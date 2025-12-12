import { prisma } from "src/config/db";
import { comparePasswords, generateToken, hashPassword } from "src/utils/auth";


// Expected inputs (Interfaces)
interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Register User
export const registerUser = async (data: RegisterInput) => {
    
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash & Create
  const hashedPassword = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
  });

  // Generate Token
  const token = generateToken(user.id);

  // Return pure data to controller
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

// Login User
export const loginUser = async (data: LoginInput) => {
  
  // Find User
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check Password
  const isValid = await comparePasswords(data.password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Return Token
  const token = generateToken(user.id);
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}