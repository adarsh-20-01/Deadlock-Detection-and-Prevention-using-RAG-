# Use Node.js LTS version as base
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies (including devDependencies for building Vite)
RUN npm ci

# Copy full project files
COPY . .

# Build the React frontend production bundle
RUN npm run build

# Remove development dependencies to keep production image light
RUN npm prune --production

# Use a clean Node runtime for execution
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package file and only production files
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/algorithms ./algorithms

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start Express server (which serves dist static folder and APIs)
CMD ["npm", "run", "start"]
