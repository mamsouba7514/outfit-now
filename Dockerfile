FROM node:20-alpine
WORKDIR /app

# Copy monorepo files
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/api/package*.json ./apps/api/

# Install all dependencies
RUN npm ci --ignore-scripts

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Build shared-types then API
RUN npm run build -w packages/shared-types
RUN npm run build -w apps/api

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

ENV NODE_ENV=production
WORKDIR /app/apps/api

# Migrate DB + start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

EXPOSE 3000
