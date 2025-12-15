# ---------------------------------------
# 1. BASE (Common for both Dev and Prod)
# ---------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------------------------------------
# 2. DEVELOPMENT Stage (Localhost)
# ---------------------------------------
FROM base AS dev
# Install ALL dependencies (including devDependencies like tsx, vitest)
RUN npm install
COPY . .
# Default command for local development
CMD ["npm", "run", "dev"]

# ---------------------------------------
# 3. BUILDER Stage (Compiles TS -> JS)
# ---------------------------------------
FROM base AS builder
WORKDIR /app
COPY . .
# Clean install for build consistency
RUN npm ci
# Generate Prisma Client (Dummy URL for build step)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/mydb" npx prisma generate
# Build the TypeScript code
RUN npm run build

# ---------------------------------------
# 4. PRODUCTION Stage (What runs on AWS)
# ---------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

# Copy only the necessary files from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install ONLY production dependencies (saves space, improves security)
RUN npm ci --only=production

# Generate Prisma Client for Production
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/mydb" npx prisma generate

EXPOSE 8080
CMD ["npm", "start"]