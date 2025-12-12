# Use a light version of Node 20
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (for caching optimization)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Generate Prisma Client (Crucial step!)
RUN npx prisma generate

# Expose port 8080
EXPOSE 8080

# Start the app in development mode
CMD ["npm", "run", "dev"]